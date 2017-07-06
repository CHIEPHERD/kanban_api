const models = require('../../models');
const uuidV4 = require('uuid/v4');
let Project = models.projects;
let State = models.states;

module.exports = function(connection, done) {
  connection.createChannel(function(err, ch) {
    console.log(err);
    var ex = 'chiepherd.main';
    ch.assertExchange(ex, 'topic');
    ch.assertQueue('kanban.state.update', { exclusive: false }, function(err, q) {
      ch.bindQueue(q.queue, ex, "kanban.state.update")

      ch.consume(q.queue, function(msg) {
        // LOG
        console.log(" [%s]: %s", msg.fields.routingKey, msg.content.toString());
        let json = JSON.parse(msg.content.toString());

        if (json.level < 4) {
          ch.sendToQueue(msg.properties.replyTo,
            new Buffer("This state can't be updated."),
            { correlationId: msg.properties.correlationId });
          ch.ack(msg);
        } else {
          State.find({
            uuid: json.uuid
          }).then(function (state) {
            if (state != undefined) {
              state.update({
                name: json.name || state.name
              }).then(function (state) {
                ch.sendToQueue(msg.properties.replyTo,
                  new Buffer.from(JSON.stringify(state.responsify())),
                  { correlationId: msg.properties.correlationId });
                ch.ack(msg);
              }).catch(function (error) {
                console.log(error);
                ch.sendToQueue(msg.properties.replyTo,
                  new Buffer(error.toString()),
                  { correlationId: msg.properties.correlationId });
                ch.ack(msg);
              });
            } else {
              ch.sendToQueue(msg.properties.replyTo,
                new Buffer("Unknown state."),
                { correlationId: msg.properties.correlationId });
              ch.ack(msg);
            }
          }).catch(function (error) {
            console.log(error);
            ch.sendToQueue(msg.properties.replyTo,
              new Buffer(error.toString()),
              { correlationId: msg.properties.correlationId });
            ch.ack(msg);
          });
        }
      }, { noAck: false });
    });
  });
  done();
}

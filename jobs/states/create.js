const models = require('../../models');
const uuidV4 = require('uuid/v4');
let Project = models.projects;
let State = models.states;

module.exports = function(connection, done) {
  connection.createChannel(function(err, ch) {
    console.log(err);
    var ex = 'kanban.main';
    ch.assertExchange(ex, 'topic');
    ch.assertQueue('kanban.state.create', { exclusive: false }, function(err, q) {
      ch.bindQueue(q.queue, ex, "kanban.state.create")

      ch.consume(q.queue, function(msg) {
        // LOG
        console.log(" [%s]: %s", msg.fields.routingKey, msg.content.toString());
        let json = JSON.parse(msg.content.toString());

        Project.find({
          where: {
            id: json.projectId
          }
        }).then(function (project) {
          if (project != undefined) {
            if (json.level < 3 || json.level == 99) {
              // NOK
            } else {
              State.create({
                projectId: project.id,
                level: json.level,
                name: json.name,
                uuid: uuidV4()
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
            }
          } else {
            ch.sendToQueue(msg.properties.replyTo,
              new Buffer("Unknown project."),
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
      }, { noAck: false });
    });
  });
  done();
}

const models = require('../../models');
let State = models.states;

module.exports = function(connection, done) {
  connection.createChannel(function(err, ch) {
    console.log(err);
    var ex = 'kanban.main';
    var queue = 'kanban.state.delete';
    ch.assertExchange(ex, 'fanout', { durable: false });
    ch.assertQueue(queue, { exclusive: false }, function(err, q) {
      ch.bindQueue(q.queue, ex, queue);

      ch.consume(q.queue, function(msg) {
        // LOG
        console.log(" [%s]: %s", queue, msg.content.toString());
        let json = JSON.parse(msg.content.toString());

        // Create state
        State.destroy({
          uuid: json.uuid
        }).then(function(state) {
          ch.sendToQueue(msg.properties.replyTo,
            new Buffer.from(JSON.stringify(state.responsify())),
            { correlationId: msg.properties.correlationId });
          ch.ack(msg);
        }).catch(function(error) {
          console.log(error);
          ch.sendToQueue(msg.properties.replyTo,
            new Buffer(error.toString()),
            { correlationId: msg.properties.correlationId });
          ch.ack(msg);
        });
      }, { noAck: true });
    });
  });
  done();
}

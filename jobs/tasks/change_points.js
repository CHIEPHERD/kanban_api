const models = require('../../models');
let Task = models.tasks;

module.exports = function(connection, done) {
  connection.createChannel(function(err, ch) {
    console.log(err);
    var ex = 'kanban.task.changes_points';
    var queue = 'kanban.task.changes_points';
    ch.assertExchange(ex, 'fanout', { durable: false });
    ch.assertQueue(queue, { exclusive: false }, function(err, q) {
      ch.bindQueue(q.queue, ex, queue);

      ch.consume(q.queue, function(msg) {
        // LOG
        console.log(" [%s]: %s", queue, msg.content.toString());
        let json = JSON.parse(msg.content.toString());

        Update task
        Task.find({
          where: {
            uuid: json.uuid
          }
        }).then(function(task) {
          if(task) {
            task.update({
              points: json.points || task.points
            }).then(function(task) {
              ch.sendToQueue(msg.properties.replyTo,
                new Buffer.from(JSON.stringify(task.responsify())),
                { correlationId: msg.properties.correlationId });
              ch.ack(msg);
            }).catch(function(error) {
              console.log(error);
              ch.sendToQueue(msg.properties.replyTo,
                new Buffer(error.toString()),
                { correlationId: msg.properties.correlationId });
              ch.ack(msg);
            });
          } else {
            ch.sendToQueue(msg.properties.replyTo,
              new Buffer("Unknown task."),
              { correlationId: msg.properties.correlationId });
            ch.ack(msg);
          }
        }).catch(function(error) {
          cconsole.log(error);
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

const models = require('../../models');
let Task = models.tasks;
let Comment = models.comments;

module.exports = function(connection, done) {
  connection.createChannel(function(err, ch) {
    console.log(err);
    var ex = 'kanban.main';
    ch.assertExchange(ex, 'topic');
    ch.assertQueue('kanban.task.comments', { exclusive: false }, function(err, q) {
      ch.bindQueue(q.queue, ex, "kanban.task.comments")

      ch.consume(q.queue, function(msg) {
        // LOG
        console.log(" [%s]: %s", msg.fields.routingKey, msg.content.toString());
        let json = JSON.parse(msg.content.toString());

        Task.find({
          where: {
            uuid: json.taskUuid
          }
        }).then(function (task) {
          if (task != undefined) {
            State.find({
              where: {
                uuid: json.stateUuid
              }
            }).then(function (state) {
              if (state != null) {
                task.update({
                  stateId: state.id
                }).then(function (task) {
                  ch.sendToQueue(msg.properties.replyTo,
                    new Buffer.from(JSON.stringify(task.responsify())),
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
          } else {
            ch.sendToQueue(msg.properties.replyTo,
              new Buffer("Unknown task."),
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

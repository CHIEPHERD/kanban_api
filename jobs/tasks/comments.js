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
            uuid: json.TaskUuid
          }
        }).then(function (task) {
          if (state != undefined) {
            Comment.findAll({
              where: {
                taskId: task.id
              },
              include: [{ model: User,  as: 'user' }],
              order: [
                ['createdAt', 'DESC']
              ]
            }).then(function (comments) {
              for (var i = 0; i < comments.length; i++) {
                comments[i] = comments[i].responsify();
              }
              ch.sendToQueue(msg.properties.replyTo,
                new Buffer.from(JSON.stringify(comments)),
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

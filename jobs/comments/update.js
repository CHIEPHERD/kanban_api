const models = require('../../models');
let Task = models.tasks;
let ProjectAssignment = models.project_assignments;
let User = models.users;
let Comment = models.comments;

module.exports = function(connection, done) {
  connection.createChannel(function(err, ch) {
    console.log(err);
    var ex = 'chiepherd.main';
    ch.assertExchange(ex, 'topic');
    ch.assertQueue('kanban.comment.create', { exclusive: false }, function(err, q) {
      ch.bindQueue(q.queue, ex, "kanban.comment.create")

      ch.consume(q.queue, function(msg) {
        // LOG
        console.log(" [%s]: %s", msg.fields.routingKey, msg.content.toString());
        let json = JSON.parse(msg.content.toString());

        Comment.find({
          where: {
            uuid: json.uuid
          }
        }).then(function (comment) {
          if (comment != null) {
            comment.update({
              message: json.message || this.message
            }).then(function (comment) {
              ch.sendToQueue(msg.properties.replyTo,
                new Buffer.from(JSON.stringify(comment.responsify())),
                { correlationId: msg.properties.correlationId });
            }).catch(function (error) {
              console.log(error);
              ch.sendToQueue(msg.properties.replyTo,
                new Buffer(error.toString()),
                { correlationId: msg.properties.correlationId });
              ch.ack(msg);
            });
          } else {
            ch.sendToQueue(msg.properties.replyTo,
              new Buffer("Unknown comment."),
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

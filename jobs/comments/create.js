const models = require('../../models');
const uuidV4 = require('uuid/v4');
let Task = models.tasks;
let ProjectAssignment = models.project_assignments;
let User = models.users;
let Comment = models.comments;

module.exports = function(connection, done) {
  connection.createChannel(function(err, ch) {
    console.log(err);
    var ex = process.env.ex;
    ch.assertExchange(ex, 'topic');
    ch.assertQueue('kanban.comment.create', { exclusive: false }, function(err, q) {
      ch.bindQueue(q.queue, ex, "kanban.comment.create")

      ch.consume(q.queue, function(msg) {
        // LOG
        console.log(" [%s]: %s", msg.fields.routingKey, msg.content.toString());
        let json = JSON.parse(msg.content.toString());

        User.find({
          where: {
            email: json.email
          }
        }).then(function (user) {
          if (user != null) {
            Task.find({
              where: {
                uuid: json.taskUuid
              }
            }).then(function (task) {
              if (task != null) {
                ProjectAssignment.find({
                  where: {
                    projectId: task.projectId,
                    userId: user.id
                  }
                }).then(function (assignment) {
                  if (assignment != null) {
                    Comment.create({
                      uuid: uuidV4(),
                      message: json.message,
                      userId: user.id,
                      taskId: task.id
                    }).then(function (comment) {
                      ch.sendToQueue(msg.properties.replyTo,
                        new Buffer.from(JSON.stringify(comment.responsify())),
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
                      new Buffer("This task doesn't belong to this project."),
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
          } else {
            ch.sendToQueue(msg.properties.replyTo,
              new Buffer("Unknown user."),
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

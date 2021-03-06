const sequelize = require('sequelize');
const models = require('../../models');
let Task = models.tasks;
let Comment = models.comments;

module.exports = function(connection, done) {
  connection.createChannel(function(err, ch) {
    console.log(err);
    var ex = process.env.ex;
    var queue = 'chiepherd.task.delete.reply';

    ch.assertExchange(ex, 'topic');
    ch.assertQueue(queue, { exclusive: false }, function(err, q) {
      ch.bindQueue(q.queue, ex, queue);

      ch.consume(q.queue, function(msg) {
        // LOG
        console.log(" [%s]: %s", queue, msg.content.toString());
        let json = JSON.parse(msg.content.toString());

        // Destroy task
        Task.find({
          where: {
            uuid: json.uuid
          }
        }).then(function (task) {
          if (task != null) {
            Task.destroy({
              individualHooks: true,
              where: {
                uuid: json.uuid
              }
            }).then(function(removed) {
              Task.update({
                priority: sequelize.literal('priority - 1')
              }, {
                where: {
                  stateId: task.stateId,
                  priority: {
                    $gt: task.priority
                  }
                }
              }).then(function (tasks) {
                Comment.findAll({
                  where: {
                    taskId: task.id
                  }
                }).then(function (comments) {
                  for (let comment of comments) {
                    connection.createChannel(function(error, channel) {
                      channel.assertExchange(ex, 'topic');
                      channel.publish(ex, 'kanban.comment.delete', new Buffer.from(JSON.stringify({ uuid: comment.uuid })));
                    });
                  }
                }).catch(function (error) {
                  console.log(error);
                });
              }).catch(function (error) {
                console.log(error);
              });
              console.log('OK');
            }).catch(function(error) {
              console.log(error);
              console.log('NOK');
            });
          } else {
            console.log('Unknown task');
            console.log('NOK');
          }
        }).catch(function (error) {
          console.log(error);
          console.log('NOK');
        });
      }, { noAck: true });
    });
  });
  done();
}

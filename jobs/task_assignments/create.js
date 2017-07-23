const models = require('../../models');
let TaskAssignment = models.task_assignments;
let User = models.users;
let Task = models.tasks;

module.exports = function(connection, done) {
  connection.createChannel(function(err, ch) {
    console.log(err);
    var ex = process.env.ex
    var queue = 'chiepherd.task_assignment.create.reply';

    ch.assertExchange(ex, 'topic');
    ch.assertQueue(queue, { exclusive: false }, function(err, q) {
      ch.bindQueue(q.queue, ex, queue);

      ch.consume(q.queue, function(msg) {
        // LOG
        console.log(" [%s]: %s", queue, msg.content.toString());
        let json = JSON.parse(msg.content.toString());

        // Create project_assignment
        Task.find({
          where: {
            uuid: json.task.uuid
          }
        }).then(function (task) {
          if (task != undefined) {
            User.find({
              where: {
                email: json.user.email,
                isActive: true
              }
            }).then(function (user) {
              if (user != undefined) {
                TaskAssignment.create({
                  userId: user.id,
                  taskId: task.id
                }).then(function (task) {
                  console.log('OK');
                }).catch(function (error) {
                  console.log(error);
                  console.log('NOK');
                });
              } else {
                console.log('NOK');
                console.log('Unknown user.');
              }
            }).catch(function (error) {
              console.log(error);
              console.log('NOK');
            });
          } else {
            console.log('NOK');
            console.log('Unknown task.');
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

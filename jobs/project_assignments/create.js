const models = require('../../models');
let ProjectAssignment = models.project_assignments;
let Project = models.projects;
let User = models.users;

module.exports = function(connection, done) {
  connection.createChannel(function(err, ch) {
    console.log(err);
    var ex = process.env.ex;
    var queue = 'chiepherd.project_assignment.create.reply';
    
    ch.assertExchange(ex, 'topic');
    ch.assertQueue(queue, { exclusive: false }, function(err, q) {
      ch.bindQueue(q.queue, ex, queue);

      ch.consume(q.queue, function(msg) {
        // LOG
        console.log(" [%s]: %s", queue, msg.content.toString());
        let json = JSON.parse(msg.content.toString());

        // Create project_assignment
        Project.find({
          where: {
            uuid: json.projectUuid
          }
        }).then(function (project) {
          if (project != undefined) {
            User.find({
              where: {
                email: json.email,
                isActive: true
              }
            }).then(function (user) {
              if (user != undefined) {
                ProjectAssignment.create({
                  projectId: project.id,
                  userId: user.id,
                  uuid: json.uuid
                }).then(function(project_assignment) {
                  console.log(project_assignment);
                  console.log('OK');
                }).catch(function(error) {
                  console.log(error);
                  console.log('NOK');
                });
              } else {
                console.log('NOK');
                console.log('Unknown user');
              }
            }).catch(function (error) {
              console.log(error);
              console.log('NOK');
            });
          } else {
            console.log('NOK');
            console.log('Unknown project');
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

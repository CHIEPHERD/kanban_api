const models = require('../../models');
let Task = models.tasks;
let Project = models.projects;
let State = models.states;

module.exports = function(connection, done) {
  connection.createChannel(function(err, ch) {
    console.log(err);
    var ex = process.env.ex;
    var queue = 'chiepherd.task.create.reply';
    
    ch.assertExchange(ex, 'topic');
    ch.assertQueue(queue, { exclusive: false }, function(err, q) {
      ch.bindQueue(q.queue, ex, queue);

      ch.consume(q.queue, function(msg) {
        // LOG
        console.log(" [%s]: %s", queue, msg.content.toString());
        let json = JSON.parse(msg.content.toString());

        // Create task
        Project.find({
          where: {
            uuid: json.projectUuid
          }
        }).then(function (project) {
          Task.find({
            where: {
              uuid: json.ancestorUuid
            }
          }).then(function (ancestor) {
            if (json.ancestorUuid == null || ancestor != null) {
              State.find({
                projectId: project.id,
                name: 'Icebox'
              }).then(function (state) {
                if (state != undefined) {
                  Task.max('priority', {
                    where: {
                      projectId: project.id,
                      stateId: state.id
                    }
                  }).then(function (max) {
                    max = (isNaN(max) ? 0 : max + 1)
                    Task.create({
                      uuid: json.uuid,
                      title: json.title,
                      description: json.description,
                      type: json.type,
                      projectId: project.id,
                      ancestorId: ancestor && ancestor.id,
                      stateId: state.id,
                      priority: max
                    }).then(function(task) {
                      console.log('OK');
                    }).catch(function(error) {
                      console.log(error);
                      console.log('NOK');
                    });
                  }).catch(function (error) {
                    console.log(error);
                    console.log('NOK');
                  });
                } else {
                  console.log('Invalid state');
                  console.log('NOK');
                }
              }).catch(function (error) {
                console.log(error);
                console.log('NOK');
              });
            } else {
              console.log('Invalid ancestor');
            }
          }).catch(function (error) {
            console.log(error);
            console.log('NOK');
          })
        }).catch(function (error) {
          console.log(error);
          console.log('NOK');
        })
      }, { noAck: true });
    });
  });
  done();
}

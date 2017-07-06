const models = require('../../models');
const uuidV4 = require('uuid/v4');
let Project = models.projects;
let State = models.states;

module.exports = function(connection, done) {
  connection.createChannel(function(err, ch) {
    console.log(err);
    var ex = 'chiepherd.project.created';
    var queue = 'kanban.project.create';
    ch.assertExchange(ex, 'fanout', { durable: false });
    ch.assertQueue(queue, { exclusive: false }, function(err, q) {
      ch.bindQueue(q.queue, ex, queue);

      ch.consume(q.queue, function(msg) {
        // LOG
        console.log(" [%s]: %s", queue, msg.content.toString());
        let json = JSON.parse(msg.content.toString());

        // Create project
        Project.create({
          name: json.name,
          label: json.label,
          uuid: json.uuid
        }).then(function(project) {
          states = ['Archived', 'Icebox', 'Backlog', 'Ready', 'In progress', 'To test', 'Done']
          console.log(states);
          for (var i = 0; i < states.length; i++) {
            console.log(states[i]);
            State.create({
              uuid: uuidV4(),
              projectId: project.id,
              level: i,
              name: states[i]
            }).then(function (state) {
              console.log(state.responsify());
            }).catch(function (error) {
              console.log(error);
            });
          }
          console.log('OK');
        }).catch(function(error) {
          console.log(error);
          console.log('NOK');
        });
      }, { noAck: true });
    });
  });
  done();
}

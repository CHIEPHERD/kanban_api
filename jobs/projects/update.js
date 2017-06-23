const models = require('../../models');
let Project = models.projects;

module.exports = function(connection, done) {
  connection.createChannel(function(err, ch) {
    console.log(err);
    var ex = 'chiepherd.project.updated';
    var queue = 'kanban.project.update';
    ch.assertExchange(ex, 'fanout', { durable: false });
    ch.assertQueue(queue, { exclusive: false }, function(err, q) {
      ch.bindQueue(q.queue, ex, queue);

      ch.consume(q.queue, function(msg) {
        // LOG
        console.log(" [%s]: %s", queue, msg.content.toString());
        let json = JSON.parse(msg.content.toString());

        // Update project
        Project.find({
          where: {
            uuid: json.uuid
          }
        }).then(function(project) {
          if(project) {
            project.update({
              name: json.name || project.name,
              label: json.label || project.label,
              visibility: json.visibility || project.visibility
            }).then(function(project) {
              console.log('OK');
            }).catch(function(error) {
              console.log(error);
              console.log('NOK');
            });
          }
        }).catch(function(error) {
          console.log(error);
          console.log('NOK');
        });
      }, { noAck: true });
    });
  });
  done();
}

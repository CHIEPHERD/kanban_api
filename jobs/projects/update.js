const models = require('../../models');
let Project = models.projects;

module.exports = function(connection, done) {
  connection.createChannel(function(err, ch) {
    console.log(err);
    var ex = process.env.ex;
    var queue = 'chiepherd.project.reply';
    ch.assertExchange(ex, 'topic');
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
              name: json.name || project.name
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

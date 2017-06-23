const models = require('../../models');
let Task = models.tasks;

module.exports = function(connection, done) {
  connection.createChannel(function(err, ch) {
    console.log(err);
    var ex = 'chiepherd.task.created';
    var queue = 'kanban.task.create';
    ch.assertExchange(ex, 'fanout', { durable: false });
    ch.assertQueue(queue, { exclusive: false }, function(err, q) {
      ch.bindQueue(q.queue, ex, queue);

      ch.consume(q.queue, function(msg) {
        // LOG
        console.log(" [%s]: %s", queue, msg.content.toString());
        let json = JSON.parse(msg.content.toString());

        // Create task
        Task.create({
          uuid: json.uuid,
          title: json.title,
          description: json.description,
          type: json.label,
          projectId: json.projectId,
          ancestorId: json.ancestorId
        }).then(function(task) {
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
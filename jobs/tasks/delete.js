const models = require('../../models');
let Task = models.tasks;

module.exports = function(connection, done) {
  connection.createChannel(function(err, ch) {
    console.log(err);
    var ex = 'chiepherd.task.deleted';
    var queue = 'kanban.task.delete';
    ch.assertExchange(ex, 'fanout', { durable: false });
    ch.assertQueue(queue, { exclusive: false }, function(err, q) {
      ch.bindQueue(q.queue, ex, queue);

      ch.consume(q.queue, function(msg) {
        // LOG
        console.log(" [%s]: %s", queue, msg.content.toString());
        let json = JSON.parse(msg.content.toString());

        // Update task
        Task.destroy({
          where: {
            uuid: json.uuid
          }
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
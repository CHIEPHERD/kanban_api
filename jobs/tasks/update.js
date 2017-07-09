const models = require('../../models');
let Task = models.tasks;

module.exports = function(connection, done) {
  connection.createChannel(function(err, ch) {
    console.log(err);
    var ex = process.env.ex;
    var queue = 'chiepherd.task.update.reply';
    
    ch.assertExchange(ex, 'topic');
    ch.assertQueue(queue, { exclusive: false }, function(err, q) {
      ch.bindQueue(q.queue, ex, queue);

      ch.consume(q.queue, function(msg) {
        // LOG
        console.log(" [%s]: %s", queue, msg.content.toString());
        let json = JSON.parse(msg.content.toString());

        // Update task
        Task.find({
          where: {
            uuid: json.uuid
          }
        }).then(function(task) {
          if (task != undefined) {
            Task.find({
              where: {
                uuid: json.ancestorUuid
              }
            }).then(function (ancestor) {
              if (ancestor != undefined || json.ancestorUuid == undefined || json.ancestorUuid == null) {
                task.update({
                  title: json.title || task.title,
                  description: json.description || task.description,
                  ancestorId: (ancestor && ancestor.id) || task.ancestorId,
                  type: json.type || task.type
                }).then(function(task) {
                  console.log('OK');
                }).catch(function(error) {
                  console.log(error);
                  console.log('NOK');
                });
              } else {
                console.log('Unknow task');
              }
            }).catch(function(error) {
              console.log(error);
              console.log('NOK');
            });
          } else {
            console.log('Unknow task');
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

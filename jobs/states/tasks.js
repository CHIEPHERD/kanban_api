const models = require('../../models');
let Task = models.tasks;
let State = models.states;
let User = models.users;

module.exports = function(connection, done) {
  connection.createChannel(function(err, ch) {
    console.log(err);
    var ex = process.env.ex;
    var queue = 'kanban.state.tasks';

    ch.assertExchange(ex, 'topic');
    ch.assertQueue(queue, { exclusive: false }, function(err, q) {
      ch.bindQueue(q.queue, ex, queue)

      ch.consume(q.queue, function(msg) {
        // LOG
        console.log(" [%s]: %s", msg.fields.routingKey, msg.content.toString());
        let json = JSON.parse(msg.content.toString());

        State.find({
          where: {
            uuid: json.stateUuid
          }
        }).then(function (state) {
          if (state != undefined) {
            Task.findAll({
              where: {
                stateId: state.id
              },
              order: [
                ['priority', 'ASC']
              ],
              include: [{ model: Task, as: 'ancestor' }]
            }).then(function (tasks) {
              var map = {}, task, roots = [];
              for (var i = 0; i < tasks.length; i++) {
                task = tasks[i].simplify();
                map[task.id] = i;
                if (task.ancestorId !== null && roots[map[task.ancestorId]] != undefined) {
                  roots[map[task.ancestorId]].children.push(tasks[i].responsify());
                } else {
                  roots.push(tasks[i].responsify());
                }
              }
              ch.sendToQueue(msg.properties.replyTo,
                new Buffer.from(JSON.stringify(roots)),
                { correlationId: msg.properties.correlationId });
              ch.ack(msg);
            }).catch(function (error) {
              console.log(error);
              ch.sendToQueue(msg.properties.replyTo,
                new Buffer(error.toString()),
                { correlationId: msg.properties.correlationId });
              ch.ack(msg);
            });
          } else {
            ch.sendToQueue(msg.properties.replyTo,
              new Buffer("Unknown state."),
              { correlationId: msg.properties.correlationId });
            ch.ack(msg);
          }
        }).catch(function (error) {
          console.log(error);
          ch.sendToQueue(msg.properties.replyTo,
            new Buffer(error.toString()),
            { correlationId: msg.properties.correlationId });
          ch.ack(msg);
        });
      }, { noAck: false });
    });
  });
  done();
}

const models = require('../../models');
var sequelize = require('sequelize');
let Task = models.tasks;
let State = models.states;
let Comment = models.comments;

module.exports = function(connection, done) {
  connection.createChannel(function(err, ch) {
    console.log(err);
    var ex = process.env.ex;
    var queue = 'kanban.task.move';
    ch.assertExchange(ex, 'topic');
    ch.assertQueue(queue, { exclusive: false }, function(err, q) {
      ch.bindQueue(q.queue, ex, queue)

      ch.consume(q.queue, function(msg) {
        // LOG
        console.log(" [%s]: %s", msg.fields.routingKey, msg.content.toString());
        let json = JSON.parse(msg.content.toString());

        Task.find({
          where: {
            uuid: json.taskUuid
          }
        }).then(function (task) {
          if (task != undefined) {
            State.find({
              where: {
                id: task.stateId
              }
            }).then(function (oldState) {
              State.find({
                where: {
                  id: json.stateUuid
                }
              }).then(function (newState) {
                if (newState != undefined || json.stateUuid == undefined) {
                  let move, range;
                  newState = newState || oldState
                  if (newState.uuid == oldState.uuid && json.priority == task.priority) {
                    ch.sendToQueue(msg.properties.replyTo,
                      new Buffer("Already at this place."),
                      { correlationId: msg.properties.correlationId });
                    ch.ack(msg);
                  } else if (newState.uuid != oldState.uuid || json.priority < task.priority) {
                    move = 1;
                    range = [json.priority, task.priority]
                  } else {
                    move = -1;
                    range = [task.priority, json.priority]
                  }
                  console.log('move');
                  console.log(move);

                  // Move tasks of the target state
                  Task.update({
                    priority: sequelize.literal('priority + ' + move)
                  }, {
                    where: {
                      stateId: newState.id,
                      priority: {
                        $between: range
                      }
                    }
                  }).then(function (tasks) {
                    // Move all tasks of the old state
                    if (newState.uuid != oldState.uuid) {
                      Task.update({
                        priority: sequelize.literal('priority - 1')
                      }, {
                        where: {
                          stateId: oldState.id,
                          priority: {
                            $gt: task.priority
                          }
                        }
                      }).then(function (tasks) {
                        for (var i = 0; i < tasks.length; i++) {
                          tasks[i] = tasks[i].responsify();
                        }
                        console.log(tasks);
                      }).catch(function (error) {
                        console.log(error);
                      });
                    }
                    console.log('hey');
                  }).catch(function (error) {
                    console.log(error);
                  });

                  // Move the target task
                  console.log(json.priority);
                  console.log(newState.id);
                  task.update({
                    priority: json.priority,
                    stateId: newState.id
                  }, {
                    where: {
                      uuid: json.taskUuid
                    }
                  }).then(function (task) {
                    console.log(task);
                    ch.sendToQueue(msg.properties.replyTo,
                      new Buffer.from(JSON.stringify(task.responsify())),
                      { correlationId: msg.properties.correlationId });
                    ch.ack(msg);
                  }).catch(function (error) {
                    console.log(error);
                  });
                } else {
                  ch.sendToQueue(msg.properties.replyTo,
                    new Buffer("Unknown new state."),
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
            }).catch(function (error) {
              console.log(error);
              ch.sendToQueue(msg.properties.replyTo,
                new Buffer(error.toString()),
                { correlationId: msg.properties.correlationId });
              ch.ack(msg);
            });
          } else {
            ch.sendToQueue(msg.properties.replyTo,
              new Buffer("Unknown task."),
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

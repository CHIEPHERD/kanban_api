const models = require('../../models');
let Task = models.tasks;
let Comment = models.comments;

module.exports = function(connection, done) {
  connection.createChannel(function(err, ch) {
    console.log(err);
    var ex = 'chiepherd.main';
    ch.assertExchange(ex, 'topic');
    ch.assertQueue('kanban.task.comments', { exclusive: false }, function(err, q) {
      ch.bindQueue(q.queue, ex, "kanban.task.comments")

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
                uuid: json.stateUuid
              }
            }).then(function (newState) {
              if (newState != undefined) {
                State.find({
                  where: {
                    id: task.stateId
                  }
                }).then(function (oldState) {
                  if (oldState != undefined) {
                    let move, range;
                    if (oldState.uuid == newState.uuid && json.priority == task.priority) {
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

                    // Move tasks of the targe state
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
                      console.log(tasks);
                    }).catch(function (error) {
                      console.log(error);
                    });

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
                        console.log(tasks);
                      }).catch(function (error) {
                        console.log(error);
                      });

                      // Move the target task
                      Task.update({
                        priority: json.priority,
                        stateId: newState.id
                      }, {
                        where: {
                          uuid: json.tasUuid
                        }
                      }).then(function (tasks) {
                        ch.sendToQueue(msg.properties.replyTo,
                          new Buffer.from(JSON.stringify(task.responsify())),
                          { correlationId: msg.properties.correlationId });
                        ch.ack(msg);
                      }).catch(function (error) {
                        console.log(error);
                      });
                    }
                  } else {
                    ch.sendToQueue(msg.properties.replyTo,
                      new Buffer("Unknown old state."),
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

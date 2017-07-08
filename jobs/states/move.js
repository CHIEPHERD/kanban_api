const models = require('../../models');
const sequelize = require('sequelize');
const uuidV4 = require('uuid/v4');
let Project = models.projects;
let State = models.states;

module.exports = function(connection, done) {
  connection.createChannel(function(err, ch) {
    console.log(err);
    var ex = 'chiepherd.main';
    ch.assertExchange(ex, 'topic');
    ch.assertQueue('kanban.state.move', { exclusive: false }, function(err, q) {
      ch.bindQueue(q.queue, ex, "kanban.state.move")

      ch.consume(q.queue, function(msg) {
        // LOG
        console.log(" [%s]: %s", msg.fields.routingKey, msg.content.toString());
        let json = JSON.parse(msg.content.toString());

        if (json.level < 4) {
          ch.sendToQueue(msg.properties.replyTo,
            new Buffer("This state can't be updated."),
            { correlationId: msg.properties.correlationId });
          ch.ack(msg);
        } else {
          State.find({
            where: {
              uuid: json.uuid
            }
          }).then(function (state) {
            State.max('level', {
              where: {
                projectId: state.projectId
              }
            }).then(function (max) {
              if (state == undefined) {
                ch.sendToQueue(msg.properties.replyTo,
                  new Buffer("Unknown state."),
                  { correlationId: msg.properties.correlationId });
                ch.ack(msg);
              } else if (state.level < 4) {
                ch.sendToQueue(msg.properties.replyTo,
                  new Buffer("Can't update this state."),
                  { correlationId: msg.properties.correlationId });
                ch.ack(msg);
              } else if (json.level > max.level) {
                ch.sendToQueue(msg.properties.replyTo,
                  new Buffer("Level too hight."),
                  { correlationId: msg.properties.correlationId });
                ch.ack(msg);
              } else {
                let move, range;
                if (json.level < state.level) {
                  move = 1;
                  range = [json.level, state.level]
                } else {
                  move = -1;
                  range = [state.level, json.level]
                }

                // Move states
                State.update({
                  level: sequelize.literal('level + ' + move)
                }, {
                  where: {
                    projectId: state.projectId,
                    level: {
                      $between: range
                    }
                  }
                }).then(function (states) {
                  console.log(states);
                }).catch(function (error) {
                  console.log(error);
                });

                //Upadte state
                state.update({
                  name: json.name || state.name,
                  level: json.level || state.level
                }).then(function (state) {
                  ch.sendToQueue(msg.properties.replyTo,
                    new Buffer.from(JSON.stringify(state.responsify())),
                    { correlationId: msg.properties.correlationId });
                  ch.ack(msg);
                }).catch(function (error) {
                  console.log(error);
                  ch.sendToQueue(msg.properties.replyTo,
                    new Buffer(error.toString()),
                    { correlationId: msg.properties.correlationId });
                  ch.ack(msg);
                });
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
        }
      }, { noAck: false });
    });
  });
  done();
}

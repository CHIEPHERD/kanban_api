const models = require('../../models');
const uuidV4 = require('uuid/v4');
let Project = models.projects;
let State = models.states;
var sequelize = require('sequelize');

module.exports = function(connection, done) {
  connection.createChannel(function(err, ch) {
    console.log(err);
    var ex = 'chiepherd.main';
    ch.assertExchange(ex, 'topic');
    ch.assertQueue('kanban.state.create', { exclusive: false }, function(err, q) {
      ch.bindQueue(q.queue, ex, "kanban.state.create")

      ch.consume(q.queue, function(msg) {
        // LOG
        console.log(" [%s]: %s", msg.fields.routingKey, msg.content.toString());
        let json = JSON.parse(msg.content.toString());

        Project.find({
          where: {
            uuid: json.projectUuid
          }
        }).then(function (project) {
          if (project != undefined) {
            State.max('level', {
              where: {
                projectId: project.id
              }
            }).then(function (max) {
              if (json.level < 4) {
                ch.sendToQueue(msg.properties.replyTo,
                  new Buffer("Too low level."),
                  { correlationId: msg.properties.correlationId });
                ch.ack(msg);
              } else if (json.level > max) {
                ch.sendToQueue(msg.properties.replyTo,
                  new Buffer("Too hight level."),
                  { correlationId: msg.properties.correlationId });
                ch.ack(msg);
              } else {
                State.create({
                  projectId: project.id,
                  level: json.level,
                  name: json.name,
                  uuid: uuidV4()
                }).then(function (state) {
                  State.update({
                    level: sequelize.literal('level + 1')
                  }, {
                    where: {
                      level: {
                        $gte: state.level
                      },
                      uuid: {
                        $not: state.uuid
                      }
                    }
                  }).then(function (states) {
                    console.log(states);
                  }).catch(function (error) {
                    console.log(error);
                    ch.sendToQueue(msg.properties.replyTo,
                      new Buffer(error.toString()),
                      { correlationId: msg.properties.correlationId });
                    ch.ack(msg);
                  });
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
          } else {
            ch.sendToQueue(msg.properties.replyTo,
              new Buffer("Unknown project."),
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

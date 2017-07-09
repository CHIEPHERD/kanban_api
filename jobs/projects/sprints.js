const models = require('../../models');
const uuidV4 = require('uuid/v4');
let Task = models.tasks;
let Project = models.projects;
let Sprint = models.sprints;

module.exports = function(connection, done) {
  connection.createChannel(function(err, ch) {
    console.log(err);
    var ex = process.env.ex;
    var queue = 'kanban.project.sprints';

    ch.assertExchange(ex, 'topic');
    ch.assertQueue(queue, { exclusive: false }, function(err, q) {
      ch.bindQueue(q.queue, ex, queue)

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
            Sprint.findAll({
              where: {
                projectId: project.id
              },
              include: [{ model: Task, as: 'tasks' }]
            }).then(function (sprints) {
              for (var i = 0; i < sprintd.length; i++) {
                sprintd[i] = sprints[i].responsify();
              }
              ch.sendToQueue(msg.properties.replyTo,
                new Buffer.from(JSON.stringify(sprints)),
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

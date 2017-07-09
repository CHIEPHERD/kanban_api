const models = require('../../models');
const uuidV4 = require('uuid/v4');
let Task = models.tasks;
let Project = models.projects;
let Sprint = models.sprints;

module.exports = function(connection, done) {
  connection.createChannel(function(err, ch) {
    console.log(err);
    var ex = process.env.ex;
    ch.assertExchange(ex, 'topic');
    ch.assertQueue('kanban.sprint.show', { exclusive: false }, function(err, q) {
      ch.bindQueue(q.queue, ex, "kanban.sprint.show")

      ch.consume(q.queue, function(msg) {
        // LOG
        console.log(" [%s]: %s", msg.fields.routingKey, msg.content.toString());
        let json = JSON.parse(msg.content.toString());

        Sprint.find({
          where: {
            uuid: json.uuid
          },
          include: [{ model: Task, as: 'tasks' }]
        }).then(function (sprint) {
          console.log(sprint);
          if (sprint != undefined) {
            ch.sendToQueue(msg.properties.replyTo,
              new Buffer.from(JSON.stringify(sprint.responsify())),
              { correlationId: msg.properties.correlationId });
            ch.ack(msg);
          } else {
            ch.sendToQueue(msg.properties.replyTo,
              new Buffer("Unknown sprint."),
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

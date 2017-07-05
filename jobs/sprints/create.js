const models = require('../../models');
const uuidV4 = require('uuid/v4');
let Task = models.tasks;
let User = models.users;
let Sprint = models.sprints;

module.exports = function(connection, done) {
  connection.createChannel(function(err, ch) {
    console.log(err);
    var ex = 'kanban.main';
    ch.assertExchange(ex, 'topic');
    ch.assertQueue('kanban.sprint.create', { exclusive: false }, function(err, q) {
      ch.bindQueue(q.queue, ex, "kanban.sprint.create")

      ch.consume(q.queue, function(msg) {
        // LOG
        console.log(" [%s]: %s", msg.fields.routingKey, msg.content.toString());
        let json = JSON.parse(msg.content.toString());

        User.find({
          where: {
            email: json.email
          }
        }).then(function (user) {
          if (user != undefined) {
            Task.findAll({
              uuid: {
                $in: json.tasks
              }
            }).then(function (tasks) {
              if (tasks.count() == json.tasks.length) {
                Sprint.create({
                  uuid: uuidV4(),
                  week: new Date()
                }).then(function (sprint) {
                  Task.update({
                    sprintId: sprint.id
                  }, {
                    where: {
                      uuid: {
                        $in: json.tasks
                      }
                    }
                  }).then(function (tasks) {
                    sprint.tasks = tasks
                    ch.sendToQueue(msg.properties.replyTo,
                      new Buffer.from(JSON.stringify(sprint.responsify())),
                      { correlationId: msg.properties.correlationId });
                    ch.ack(msg);
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
                })
              } else {
                ch.sendToQueue(msg.properties.replyTo,
                  new Buffer("Missing tasks."),
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
              new Buffer("Unknown user."),
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

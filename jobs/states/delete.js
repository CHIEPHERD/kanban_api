const models = require('../../models');
var sequelize = require('sequelize');
let State = models.states;
let Task = models.tasks;

module.exports = function(connection, done) {
  connection.createChannel(function(err, ch) {
    console.log(err);
    var ex = 'chiepherd.main';
    var queue = 'kanban.state.delete';
    ch.assertExchange(ex, 'topic');
    ch.assertQueue(queue, { exclusive: false }, function(err, q) {
      ch.bindQueue(q.queue, ex, queue)

      ch.consume(q.queue, function(msg) {
        // LOG
        console.log(" [%s]: %s", queue, msg.content.toString());
        let json = JSON.parse(msg.content.toString());

        // Create state
        State.find({
          where: {
            uuid: json.uuid
          }
        }).then(function (state) {
          if (state == undefined) {
            ch.sendToQueue(msg.properties.replyTo,
              new Buffer("Unknown state."),
              { correlationId: msg.properties.correlationId });
            ch.ack(msg);
          } else if (state.level < 4) {
            ch.sendToQueue(msg.properties.replyTo,
              new Buffer("Can't delete this state."),
              { correlationId: msg.properties.correlationId });
            ch.ack(msg);
          } else {
            Task.find({
              where: {
                stateId: state.id
              }
            }).then(function (task) {
              if (task != undefined) {
                ch.sendToQueue(msg.properties.replyTo,
                  new Buffer("Can't delete this state as long as it has tasks."),
                  { correlationId: msg.properties.correlationId });
                ch.ack(msg);
              } else {
                State.destroy({
                  where: {
                    uuid: json.uuid
                  }
                }).then(function(removed) {
                  State.update({
                    level: sequelize.literal('level - 1')
                  }, {
                    where: {
                      level: {
                        $gt: state.level
                      }
                    }
                  })
                  ch.sendToQueue(msg.properties.replyTo,
                    new Buffer.from(JSON.stringify({ status: 'removed' })),
                    { correlationId: msg.properties.correlationId });
                  ch.ack(msg);
                }).catch(function(error) {
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

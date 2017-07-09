const models = require('../../models');
let Comment = models.comments;

module.exports = function(connection, done) {
  connection.createChannel(function(err, ch) {
    console.log(err);
    var ex = process.env.ex;
    var queue = 'kanban.comment.delete';

    ch.assertExchange(ex, 'topic');
    ch.assertQueue(queue, { exclusive: false }, function(err, q) {
      ch.bindQueue(q.queue, ex, queue)

      ch.consume(q.queue, function(msg) {
        // LOG
        console.log(" [%s]: %s", msg.fields.routingKey, msg.content.toString());
        let json = JSON.parse(msg.content.toString());

        Comment.destroy({
          where: {
            uuid: json.uuid
          }
        }).then(function (comment) {
          ch.sendToQueue(msg.properties.replyTo,
            new Buffer.from(JSON.stringify({ status: 'removed' })),
            { correlationId: msg.properties.correlationId });
          ch.ack(msg);
        }).catch(function (error) {
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

const models = require('../../models');
let Comment = models.comments;

module.exports = function(connection, done) {
  connection.createChannel(function(err, ch) {
    console.log(err);
    var ex = 'kanban.main';
    ch.assertExchange(ex, 'topic');
    ch.assertQueue('kanban.comment.show', { exclusive: false }, function(err, q) {
      ch.bindQueue(q.queue, ex, "kanban.comment.show")

      ch.consume(q.queue, function(msg) {
        // LOG
        console.log(" [%s]: %s", msg.fields.routingKey, msg.content.toString());
        let json = JSON.parse(msg.content.toString());

        // update comment
        Comment.find({
          where: {
            uuid: json.uuid
          }
        }).then(function(comment) {
          ch.sendToQueue(msg.properties.replyTo,
            new Buffer.from(JSON.stringify(comment.responsify())),
            { correlationId: msg.properties.correlationId });
          ch.ack(msg);
        }).catch(function(error) {
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

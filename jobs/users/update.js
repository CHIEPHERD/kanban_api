const models = require('../../models');
let User = models.users;

module.exports = function(connection, done) {
  connection.createChannel(function(err, ch) {
    console.log(err);
    var ex = process.env.ex;
    var queue = 'chiepherd.user.update.reply';
    ch.assertExchange(ex, 'topic');
    ch.assertQueue(queue, { exclusive: false }, function(err, q) {
      ch.bindQueue(q.queue, ex, queue);

      ch.consume(q.queue, function(msg) {
        // LOG
        console.log(" [%s]: %s", queue, msg.content.toString());
        let json = JSON.parse(msg.content.toString());

        // Update user
        User.find({
          where: {
            email: json.email
          }
        }).then(function(user) {
          if(user) {
            user.update({
              lastname: json.lastname,
              firstname: json.firstname,
              nickname: json.nickname
            }).then(function(user) {
              console.log('OK');
            }).catch(function(error) {
              console.log(error);
              console.log('NOK');
            });
          }
        }).catch(function(error) {
          console.log(error);
          console.log('NOK');
        });
      }, { noAck: true });
    });
  });
  done();
}

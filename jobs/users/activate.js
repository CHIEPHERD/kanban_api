const models = require('../../models');
let User = models.users;

module.exports = function(connection, done) {
  connection.createChannel(function(err, ch) {
    console.log(err);
    var ex = process.env.ex;
    var queue = 'chiepherd.user.activate.reply';
    
    ch.assertExchange(ex, 'topic');
    ch.assertQueue(queue, { exclusive: false }, function(err, q) {
      ch.bindQueue(q.queue, ex, queue);

      ch.consume(q.queue, function(msg) {
        // LOG
        console.log(" [%s]: %s", queue, msg.content.toString());
        let json = JSON.parse(msg.content.toString());

        // Create user
        User.find({
          where: {
            email: json.email
          }
        }).then(function (user) {
          if (user != undefined) {
            user.update({
              isActive: json.isActive
            }).then(function(user) {
              console.log('OK');
            }).catch(function(error) {
              console.log(error);
              console.log('NOK');
            });
          } else {
            console.log('NOK');
            console.log('Unknown user');
          }
        }).catch(function (error) {
          console.log(error);
          console.log('NOK');
        });
      }, { noAck: true });
    });
  });
  done();
}

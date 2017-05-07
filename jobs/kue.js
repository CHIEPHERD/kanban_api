let Kue = function() {};
var jobs = require("./jobs");
var amqp = require('amqplib/callback_api');
var kue = require('kue')

Kue.prototype.run = function () {
  createQueueFor('project.created', jobs.project.create)
}

function createQueueFor(resource, job) {
  let queue = kue.createQueue();
  amqp.connect('amqp://root:root@192.168.56.1', function(err, conn) {
    if(err) { console.log(err); return; }
    queue.process(resource, function(_job, done) {
      job(conn, done);
    });
    queue.create(resource).save();
  })
}

module.exports = Kue;

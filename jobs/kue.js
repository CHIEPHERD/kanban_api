let Kue = function() {};
var jobs = require("./jobs");
var amqp = require('amqplib/callback_api');
var kue = require('kue')

Kue.prototype.run = function () {
  createQueueFor('project.created', jobs.project.create)
  createQueueFor('project.updated', jobs.project.update)

  createQueueFor('user.created', jobs.user.create)
  createQueueFor('user.updated', jobs.user.update)

  createQueueFor('task.created', jobs.task.create)
  createQueueFor('task.updated', jobs.task.update)
  createQueueFor('task.deleted', jobs.task.delete)

  createQueueFor('comment.create', jobs.comment.create)
  createQueueFor('comment.update', jobs.comment.update)
  createQueueFor('comment.delete', jobs.comment.delete)
  createQueueFor('comment.show', jobs.comment.show)
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

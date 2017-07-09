let Kue = function() {};
var jobs = require("./jobs");
var amqp = require('amqplib/callback_api');
var kue = require('kue')

Kue.prototype.run = function () {
  createQueueFor('project.create.reply', jobs.project.create)
  createQueueFor('project.update.reply', jobs.project.update)

  createQueueFor('user.create.reply', jobs.user.create)
  createQueueFor('user.update.reply', jobs.user.update)
  createQueueFor('user.activate.reply', jobs.user.activate)

  createQueueFor('task.create.reply', jobs.task.create)
  createQueueFor('task.update.reply', jobs.task.update)
  createQueueFor('task.delete.reply', jobs.task.delete)
  createQueueFor('task.move', jobs.task.move)
  createQueueFor('task.change_points', jobs.task.change_points)
  createQueueFor('state.tasks', jobs.state.tasks)

  createQueueFor('comment.create', jobs.comment.create)
  createQueueFor('comment.update', jobs.comment.update)
  createQueueFor('comment.delete', jobs.comment.delete)
  createQueueFor('comment.show', jobs.comment.show)
  createQueueFor('task.comments', jobs.task.comments)

  createQueueFor('project_assignment.create.reply', jobs.project_assignment.create)
  createQueueFor('project_assignment.delete.reply', jobs.project_assignment.delete)
  createQueueFor('project_assignment.update.reply', jobs.project_assignment.update)

  createQueueFor('state.create', jobs.state.create)
  createQueueFor('state.update', jobs.state.update)
  createQueueFor('state.delete', jobs.state.delete)
  createQueueFor('state.move', jobs.state.move)
  createQueueFor('project.states', jobs.project.states)

  createQueueFor('task_assignment.create.reply', jobs.task_assignment.create)
  createQueueFor('task_assignment.delete.reply', jobs.task_assignment.delete)

  createQueueFor('sprint.create', jobs.sprint.create)
  createQueueFor('sprint.done', jobs.sprint.done)
  createQueueFor('sprint.tasks', jobs.sprint.tasks)
  createQueueFor('sprint.show', jobs.sprint.show)
  createQueueFor('project.sprints', jobs.project.sprints)
}

function createQueueFor(resource, job) {
  let queue = kue.createQueue();
  amqp.connect(process.env.amqp_ip, function(err, conn) {
    if(err) { console.log(err); return; }
    queue.process(resource, function(_job, done) {
      job(conn, done);
    });
    queue.create(resource).save();
  })
}

module.exports = Kue;

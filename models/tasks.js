'use strict'
//sequelize model:create --name Users --attributes first_name:string,last_name:string

module.exports = function(sequelize, DataTypes) {
  var Tasks = sequelize.define('tasks', {
    id: {
      type: DataTypes.BIGINT,
      unique: true,
      primaryKey: true,
      autoIncrement: true
    },
    uuid: {
      type: DataTypes.STRING,
      unique: true,
      primaryKey: true
    },
    title: {
      type: DataTypes.STRING,
      defaultValue: ''
    },
    points: {
      type: DataTypes.INTEGER.UNSIGNED,
      defaultValue: 0
    },
    type: {
      type: DataTypes.ENUM('Epic', 'User story', 'Task')
    },
    priority: {
      type: DataTypes.INTEGER.UNSIGNED,
    },
    description: {
      type: DataTypes.TEXT,
      defaultValue: ''
    }
  }, {
    classMethods: {
      associate: function(models) {
        Tasks.belongsTo(models.tasks, {
          as: 'ancestor'
        });
        Tasks.belongsToMany(models.projects, {
          through : 'task_assignments'
        });
        Tasks.belongsTo(models.projects);
        Tasks.belongsTo(models.states);
      }
    },
    instanceMethods: {
      responsify: function() {
        let result = {}
        result.uuid = this.uuid
        result.title = this.title
        result.description = this.description
        result.type = this.type
        result.points = this.points
        result.priority = this.priority
        result.user = this.user && this.user.responsify()
        result.ancestorUuid = this.ancestor && this.ancestor.uuid
        result.children = []
        return result
      },
      simplify: function () {
        let result = {}
        result.id = this.id,
        result.ancestorId = this.ancestorId
        result.uuid = this.uuid
        return result
      }
    },
    hooks: {
      afterDestroy: function(task) {
        Tasks.destroy({
          individualHooks: true,
          where: {
            ancestorId: task.id
          }
        }).then(function (children) {
          console.log(children);
        }).catch(function (err) {
          console.log(err);
        })
      },
      afterUpdate: function (task) {
        Task.findAll({
          where: {
            ancestorId: task.id
          }
        }).then(function (children) {
          for (let child of children) {
            Task.update({
              stateId: task.stateId
            }).then(function (child) {
              console.log(child);
            }).catch(function (error) {
              console.log(error);
            })
          }
        }).catch(function (error) {
          console.log(error);
        })
      })
    }
  });
  return Tasks;
}

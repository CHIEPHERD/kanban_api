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
      }
    }
  });
  return Tasks;
}

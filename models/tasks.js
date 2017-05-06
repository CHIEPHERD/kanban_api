'use strict'
//sequelize model:create --name Users --attributes first_name:string,last_name:string

module.exports = function(sequelize, DataTypes) {
  var Tasks = sequelize.define('tasks', {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true
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
        Tasks.hasMany(Tasks, {
          as: 'ancestor'
        });
        Tasks.belongsToMany(models.projects, {
          through : 'users_tasks'
        });
      }
    }
  });
  return Tasks;
}

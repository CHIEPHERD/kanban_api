'use strict';
module.exports = function(sequelize, DataTypes) {
  var sprint = sequelize.define('sprints', {
    id: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: DataTypes.BIGINT
    },
    uuid: {
      type: DataTypes.STRING,
      unique: true,
    },
    week: {
      type: DataTypes.DATEONLY
    },
    // begin: {
    //   type: DataTypes.DATEONLY
    // },
    // end: {
    //   type: DataTypes.DATEONLY
    // },
    active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  }, {
    paranoid: true,
    classMethods: {
      associate: function(models) {
        sprint.belongsTo(models.projects);
        sprint.hasMany(models.tasks);
      }
    },
    instanceMethods: {
      responsify: function() {
        let result = {}
        result.week = this.week;
        result.uuid = this.uuid;
        result.tasks = this.tasks;
        for (var i = 0; i < (result.tasks && result.tasks.length) || 0; i++) {
          result.tasks[i] = result.tasks[i].responsify();
        }
        return result
      }
    }
  });
  return sprint;
};

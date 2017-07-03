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
    }
  }, {
    paranoid: true,
    classMethods: {
      associate: function(models) {
        sprint.belongsTo(models.projects);
        sprint.hasMany(models.tasks);
      }
    }
  });
  return sprint;
};

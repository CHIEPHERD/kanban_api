'use strict';
module.exports = function(sequelize, DataTypes) {
  var task_assignment = sequelize.define('task_assignments', {
    id: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: DataTypes.BIGINT
    },
    uuid: {
      type: DataTypes.STRING,
      unique: true,
    }
  }, {
    paranoid: true,
    classMethods: {
      associate: function(models) {
        task_assignment.belongsTo(models.users);
        task_assignment.belongsTo(models.tasks);
      }
    }
  });
  return task_assignment;
};

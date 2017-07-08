'use strict';
module.exports = function(sequelize, DataTypes) {
  var project_assignment = sequelize.define('project_assignments', {
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
    classMethods: {
      associate: function(models) {
        project_assignment.belongsTo(models.users);
        project_assignment.belongsTo(models.projects);
      }
    }
  });
  return project_assignment;
};

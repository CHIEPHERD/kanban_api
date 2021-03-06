'use strict';
module.exports = function(sequelize, DataTypes) {
  var project = sequelize.define('projects', {
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
    name: {
      type: DataTypes.STRING
    },
    label: DataTypes.TEXT,
    visibility: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
  }, {
    paranoid: true,
    classMethods: {
      associate: function(models) {
        project.belongsToMany(models.users, {
          through : 'project_assignments'
        });
        project.hasMany(models.tasks);
      }
    }
  });
  return project;
};

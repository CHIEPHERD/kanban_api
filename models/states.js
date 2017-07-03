'use strict';
module.exports = function(sequelize, DataTypes) {
  var state = sequelize.define('states', {
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
        state.belongsTo(models.projects);
      }
    }
  });
  return state;
};

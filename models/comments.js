'use strict';
module.exports = function(sequelize, DataTypes) {
  var comment = sequelize.define('comments', {
    id: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: DataTypes.BIGINT
    },
    message: {
      type: DataTypes.TEXT,
      defaultValue: ''
    },
    uuid: {
      type: DataTypes.STRING,
      unique: true,
    }
  }, {
    paranoid: true,
    classMethods: {
      associate: function(models) {
        comment.belongsTo(models.users);
        comment.belongsTo(models.tasks);
      }
    },
    instanceMethods: {
      responsify: function() {
        let result = {}
        result.message = this.message;
        result.uuid = this.uuid;
        result.createdAt = this.createdAt;
        result.updatedAt = this.updatedAt;
        return result
      }
    }
  });
  return comment;
};

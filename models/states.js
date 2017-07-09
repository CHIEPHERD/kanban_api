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
    },
    name: {
      type: DataTypes.STRING
    },
    level: {
      type: DataTypes.INTEGER.UNSIGNED
    }
  }, {
    paranoid: true,
    classMethods: {
      associate: function(models) {
        state.belongsTo(models.projects);
      }
    },
    instanceMethods: {
      responsify: function() {
        let result = {}
        result.name = this.name;
        result.uuid = this.uuid;
        result.level = this.level;
        return result
      }
    },
    hook: {
      afterSave: function (state) {
        State.find({
          where: {
            projectId: state.projectId,
            level: state.level,
            id: {
              $not: state.id
            }
          }
        }).then(function (old) {
          old.update({
            individualHooks: true,
            where: {
              level: old.level + 1
            }
          })
        })
      }
    }
  });
  return state;
};

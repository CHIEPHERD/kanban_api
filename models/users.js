'use strict'
//sequelize model:create --name Users --attributes first_name:string,last_name:string

module.exports = function(sequelize, DataTypes) {
  var Users = sequelize.define('users', {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true
    },
    email: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false
    },
    firstname: {
      type: DataTypes.STRING,
      defaultValue: ''
    },
    lastname: {
      type: DataTypes.STRING,
      defaultValue: ''
    },
    nickname: {
      type: DataTypes.STRING,
      defaultValue: ''
    }
  }, {
    classMethods: {
      associate: function(models) {
        Users.belongsToMany(models.projects, {
          through : 'project_assignments'
        });
        Users.belongsToMany(models.tasks, {
          through : 'users_tasks'
        });
      }
    },
    instanceMethods: {
      responsify: function() {
        let result = {}
        result.email = this.email
        return result
      }
    }
  });
  return Users;
};

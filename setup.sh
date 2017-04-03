#!/bin/bash
function InstallEnv {
  sudo locale-gen C.UTF-8
}

function InstallNodeAndNpm {
  curl -sL https://deb.nodesource.com/setup_7.x | sudo -E bash -
  apt-get install nodejs -y
  apt-get install npm -y
  npm install /vagrant
  ln -s /home/vagrant/node_modules/ /vagrant/node_modules
  npm install -g node-dev
  npm install -g express-generator
  #ln -s /usr/bin/nodejs /usr/local/bin/node
}

function InstallPostgre {
  apt-get install postgresql -y
  npm install -g sequelize-cli
  #connection postgres pour créer vagrant
  sudo -u postgres psql -c "CREATE USER vagrant WITH PASSWORD 'root'"
  sudo -u postgres psql -c "CREATE DATABASE cp_kanban"
}

function SequelizeMigrate {
  cd /vagrant
  sequelize db:migrate
}

echo 'Prepare the environement'; InstallEnv
echo 'Installing Node...'; InstallNodeAndNpm
echo 'Installing postgresql And sequelize-cli'; InstallPostgre
echo 'Migrate db With Sequelize'; SequelizeMigrate

exit 0

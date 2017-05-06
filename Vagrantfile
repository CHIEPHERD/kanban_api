# -*- mode: ruby -*-
# vi: set ft=ruby :

Vagrant.configure(2) do |config|
  config.vm.box = 'ubuntu/trusty64'

  config.vbguest.auto_update = false if defined?(VagrantVbguest::Middleware)
  config.ssh.forward_agent = true
  config.vm.network :private_network, ip: '192.168.56.105'

  config.vm.provider :virtualbox do |vb|
    vb.customize ['modifyvm', :id, '--cpus', '1', '--memory', '1024']
    vb.customize ['guestproperty', 'set', :id, '--timesync-threshold', 5000]
  end

  config.vm.provision 'shell', privileged: true, path: './setup.sh'
end

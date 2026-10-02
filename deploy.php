<?php

namespace Deployer;

// Deploy do fisioweb com Deployer 7 (https://deployer.org).
// O servidor é preparado uma única vez por infra/provision.sh.
// Passo a passo em infra/README.md.
//
//   dep deploy production                  publica a branch main
//   dep deploy production --branch=minha   publica outra branch
//   dep rollback production                volta para a release anterior
//   dep artisan:db:seed production         roda os seeders
//   dep ssh production                     abre um shell na release atual

require 'recipe/laravel.php';
require 'contrib/npm.php';

set('application', 'fisioweb');
set('repository', 'git@github.com:ClevertonCodev/fisioweb.git');
set('branch', 'main');
set('keep_releases', 5);

set('bin/php', '/usr/bin/php8.5');
// O PHP-FPM roda como o mesmo usuário do deploy (ver provision.sh).
set('http_user', 'fisioweb');

host('production')
    ->setHostname('159.69.100.198')
    ->setRemoteUser('fisioweb')
    ->setDeployPath('/var/www/fisioweb')
    // O servidor clona o GitHub usando a sua chave SSH local (ssh-add).
    ->setForwardAgent(true);

// O Vite lê as variáveis VITE_* do .env compartilhado durante o build.
task('build:assets', function () {
    run('cd {{release_path}} && {{bin/npm}} run build');
})->desc('Gera os assets do frontend');

task('fisioweb:restart', function () {
    run('sudo systemctl reload php8.5-fpm');
    run('sudo systemctl restart fisioweb-queue');
})->desc('Recarrega o PHP-FPM e reinicia o worker da fila');

after('deploy:vendors', 'npm:install');
after('npm:install', 'build:assets');
after('deploy:symlink', 'fisioweb:restart');
after('deploy:failed', 'deploy:unlock');

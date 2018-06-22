#! /usr/bin/env node

const fs = require('fs');
const path = require('path');
const clone = require('git-clone');
const program = require('commander');
const download = require('download-git-repo');
const chalk = require('chalk');
const ora = require('ora');
const shell = require('shelljs');
const log = require('tracer').colorConsole({
    format: "{{timestamp}} {{message}}",
    dateformat: "HH:MM:ss"
})
const package = require(path.resolve(__dirname, '../package.json'));
const co = require('co');
const prompt = require('co-prompt');

program
    .version(package.version)
    .usage('[options]')
    .option('init --dir', '在指定位置初始化项目')
    .description('Omega-UI脚手架')

program
    .command('* init <project>')
		.alias('i').description('在指定位置初始化项目') .option('--dir'," 项目位置")
    .action((projectPath) => {
        log.debug(load())
        log.info('初始化构建工具...')
        co(function*() {
            if (projectPath) {
                let isExist = fs.existsSync(projectPath);
                if (isExist) {
                    let confirmDelete = yield prompt(`当前路径已存在，是否自动删除并重新创建(y/n)？`);
                    while (!['y', 'Y', 'n', 'N'].includes(confirmDelete)) {
                        confirmDelete = yield prompt(`当前路径已存在，是否自动删除并重新创建(y/n)？`);
                    }
                    if (['y', 'Y'].includes(confirmDelete)) {
                        deleteFolderRecursive(projectPath);
                        downloadTemplate(projectPath);
                    } else process.exit(1);
                } else {
                    downloadTemplate(projectPath);
                }
            }
        })
    })
program.parse(process.argv);

if(!program.args.length){
  program.help()
}

function deleteFolderRecursive(path) {
    log.info(`正在删除${path}...'`);
    if (fs.existsSync(path)) {
        fs.readdirSync(path).forEach(function(file) {
            var curPath = path + "/" + file;
            if (fs.statSync(curPath).isDirectory()) { // recurse
                deleteFolderRecursive(curPath);
            } else { // delete file
                fs.unlinkSync(curPath);
            }
        });
        fs.rmdirSync(path);
    }
};

function downloadTemplate(projectPath) {
    log.info('正在下载模板...')
    download('github:qulongjun/Omega-template', projectPath, {
        clone: true
    }, (err) => {
        if (!err) {
            //下载成功
            log.info('模板下载成功...');
            log.info('正在安装依赖...');
            if (shell.cd(projectPath).exec('npm install').code !== 0) {
                log.error(`依赖安装失败，请手动进入项目目录并执行'npm install'`);
            }
            log.info('依赖安装成功...');
            log.info(finish(projectPath));
            process.exit(1);
        } else {
            //下载失败
            log.error(`模板下载失败，请检查网络，或手动执行命令'git clone https://github.com/qulongjun/Omega-template.git' ！`)
            process.exit(1);
        }

    })
}

function load() {
    return `
            ~~~~~~~~~
          ~~~~~~~~~~~~~
        ,~~~~~~~~~~~~~~~,
       .~~~~~~~~~~~~~~~~~.
       ~~~~~~       ~~~~~~
      ~~~~~~         ~~~~~~
      ~~~~~.         -~~~~~    ~~~~~~~~~~~~~~~~~~~~~          .~~~~~~~~~~       ~~~~~~~~~~~~     ~~~~~~~~~~~~.
      ~~~~~           ~~~~~    ~~~~~~~~~~~~~~~~~~~~~~        ~~~~~~~~~~~~     ~~~~~~~~~~~~~~     ~~~~~~~~~~~~~~
     -~~~~~           ~~~~~.   ~~~~~~~~~~~~~~~~~~~~~~~      ~~~~~~~~~~~~~    ~~~~~~~~~~~~~~~     ~~~~~~~~~~~~~~~
     ~~~~~~           ~~~~~-   ~~~~~~~~~~~~~~~~~~~~~~~     ~~~~~~~~~~~~~~   -~~~~~~-,,,,~~~~     ~~~~~~~~~~~~~~~
     ~~~~~-           ~~~~~-   ~~~~     ~~~~~     ~~~~-   .~~~~-            ~~~~~       ~~~~                ~~~~.
     ~~~~~-           ~~~~~~   ~~~~     ~~~~~     ~~~~~   ~~~~~             ~~~~        ~~~~                ~~~~-
     ~~~~~-           ~~~~~~   ~~~~     ~~~~~     ~~~~~   ~~~~~            -~~~~        ~~~~                ~~~~~
     ~~~~~~           ~~~~~-   ~~~~     ~~~~~     ~~~~~   ~~~~~~~~~~~~~~~  ~~~~~        ~~~~      ~~~~~~~~~~~~~~~
     ~~~~~~           ~~~~~.   ~~~~     ~~~~~     ~~~~~   ~~~~~~~~~~~~~~~  ~~~~~        ~~~~     ~~~~~~~~~~~~~~~~
     .~~~~~           ~~~~~    ~~~~     ~~~~~     ~~~~~   ~~~~~~~~~~~~~~~  ~~~~~        ~~~~    ~~~~~~~~~~~~~~~~~
      ~~~~~~         ~~~~~~    ~~~~     ~~~~~     ~~~~~   ~~~~~            -~~~~        ~~~~    ~~~~~       ~~~~~
      ~~~~~~.       ~~~~~~-    ~~~~     ~~~~~     ~~~~~   ~~~~~            .~~~~~       ~~~~    ~~~~        ~~~~~
       ~~~~~~~    .~~~~~~~     ~~~~     ~~~~~     ~~~~~    ~~~~~            ~~~~~~      ~~~~    ~~~~~       ~~~~~
        ~~~~~~~~~~~~~~~~~      ~~~~     ~~~~~     ~~~~~    ~~~~~~~~~~~~~~   -~~~~~~~~~~~~~~~    ~~~~~~~~~~~~~~~~~
         ~~~~~~~~~~~~~~~       ~~~~     ~~~~~     ~~~~~     ~~~~~~~~~~~~~    ~~~~~~~~~~~~~~~    -~~~~~~~~~~~~~~~~
          -~~~~~~~~~~~-        ~~~~     ~~~~~     ~~~~~      ~~~~~~~~~~~~     -~~~~~~~~~~~~~     -~~~~~~~~~~~~~~~
             -~~~~~-           ~~~~     ~~~~~     ~~~~~        ,~~~~~~~~~        -~~~~~~~~~~       ,~~~~~~~~~~~~~
                                                                                       .~~~~
                                                                                       ~~~~~
                                                                             ~~~~~~~~~~~~~~~
                                                                             ~~~~~~~~~~~~~~
                                                                             ~~~~~~~~~~~~~
                                                                             ----------.
	`;
}


function finish(path) {
    return `
============================
搭建完成！
进入项目：cd ${path}
开发环境：npm run dev
生产环境：npm run build
	`;
}

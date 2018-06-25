#! /usr/bin/env node

const fs = require('fs');
const path = require('path');
const program = require('commander');
const download = require('download-git-repo');
const chalk = require('chalk');
const ora = require('ora');
const shell = require('shelljs');
const log = require('tracer').colorConsole({
    format: "{{message}}",
    dateformat: "HH:MM:ss"
})
const package = require(path.resolve(__dirname, '../package.json'));
const co = require('co');
const prompt = require('co-prompt');
const inquirer = require('inquirer');
// const sleep = require('sleep');


program
    .version(package.version)
    .usage('[options]')
    .option('init --dir', '在指定位置初始化项目')
    .description('OmegaUI 快速构建工具')

program
    .command('* init <projectPath>')
    .alias('i').description('在指定位置初始化项目')
    .action((projectPath) => {
        // log.debug(load())
        inquirer.prompt([{
            type: 'list',
            message: '请选择模板版本：',
            name: 'type',
            choices: ['稳定版本', '开发版本']
        }]).then(function(answers) {
            if (answers.type === '稳定版本') {
                build(projectPath, 'template/stable');
            } else {
                build(projectPath, 'template/beta');
            }
        })

    })
program.parse(process.argv);

if (!program.args.length) {
    program.help()
}

function build(projectPath, version) {
    let spinner = ora({
        color: 'green'
    });
    // log.info('初始化构建工具...')
    co(function*() {
        if (projectPath) {
            let isExist = fs.existsSync(projectPath);
            if (isExist) {
                inquirer.prompt([{
                    type: 'list',
                    message: '当前路径已存在，请选择操作',
                    name: 'type',
                    choices: ['删除并重新创建', '取消操作']
                }]).then(function(answers) {
                    if (answers.type === '删除并重新创建') {
                        spinner.start('初始化构建工具');
												//sleep.msleep(500);
                        spinner.succeed('构建工具初始化成功');
                        spinner.start(`正在删除路径`);
                        deleteFolderRecursive(projectPath);
                        spinner.succeed(`路径删除成功`);
                        spinner.start(`正在创建路径`);
                        spinner.succeed(`路径创建成功`);
                        downloadTemplate(projectPath, version);
                    } else {
                        process.exit(1);
                    }
                })
            } else {
                spinner.start('初始化构建工具');
                spinner.succeed('构建工具初始化成功');
                downloadTemplate(projectPath, version);
            }
        }
    })
}

function deleteFolderRecursive(path) {
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

function downloadTemplate(projectPath, version) {
    let spinner = ora({
        color: 'green'
    });
    //log.info('正在下载模板...')
    spinner.start(`正在下载模板`);
    download('qulongjun/Omega-UI#' + version, projectPath, {
        clone: true
    }, (err) => {
        if (!err) {
            //下载成功
            //log.info('模板下载成功...');
            spinner.succeed('模板下载成功');
            //log.info('正在安装依赖...');
            spinner.start(`正在安装依赖\n`);
            if (shell.cd(projectPath).exec('npm install --progress false',{silent:true}).code !== 0) {
                // log.error(`依赖安装失败，请手动进入项目目录并执行'npm install'`);
                spinner.fail(`依赖安装失败，请手动进入项目目录并执行'npm install'`);
            }
            spinner.succeed('依赖安装成功');
            spinner.succeed('项目构建完成');
            log.debug(finish(projectPath));
            process.exit(1);
        } else {
            //下载失败
            spinner.fail(`模板下载失败，请检查网络，或手动执行命令'git clone https://github.com/qulongjun/Omega-template.git' ！`)
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
开发环境：
cd ${path} && npm run dev
生产环境：
cd ${path} && npm run build
	`;
}

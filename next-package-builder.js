/**
 * TODOs
 *
 * create package structure -> packages -> foo
 * create view -> Main.js
 *
 */

const {mkdirSync, writeFileSync} = require('fs'),
    log = require('./log').log;

let packageFolder = 'packages',
    packageName = 'foo',
    viewName = 'Main';

let baseConfig = {
    extend: 'Ext.panel.Panel'
}

let customConfig = {
    moduleId: null // todo -- accept undefined here (json stringify..)
}

// improve
let prefix = 'Ext.define(';
let suffix = ')';

const ending = '.js';

const createView = function (viewName) {
    let componentConfig = Object.assign({}, baseConfig, customConfig);
    let className = '"' + packageName + '.' + viewName + '",';
    return prefix + className + JSON.stringify(componentConfig, undefined, 4) + suffix;
}


const createPath = function (folder, name) {
    return [folder, name].join('/')
}

const createPackageFolders = function (path) {
    mkdirSync(path, {
        recursive: true
    })
    log('PACKAGE STRUCTURE created');
}

const createPackageStructure = function () {
    // create paths and package structure
    let path = createPath(packageFolder, packageName);
    createPackageFolders(path);

    // create views, right now Main.js
    let componentString = createView(viewName);
    console.log(componentString);
    // write views to disk
    writeFileSync(path + '/' + viewName.trim() + ending.trim(), componentString);
    log('PACKAGE ' + viewName + ' created');
}

createPackageStructure()





/**
 * TODOs
 *
 * create package structure -> packages -> foo
 * create view -> Main.js
 *
 */

const {mkdirSync, writeFileSync} = require('fs'),
    log = require('./log').log;

let packageFolder = 'packages'
let packageName = 'foo';

let baseConfig = {
    extend: 'Ext.panel.Panel'
}

let prefix = "Ext.define('";
let suffix = ")";

const ending = '.js';

const createView = function (viewName) {
    return prefix + packageName + "." + viewName + "'," + JSON.stringify(baseConfig, undefined, 4) + suffix;
}

const createPackageStructure = function () {
    // create paths and package structure
    let path = [packageFolder, packageName].join('/')
    mkdirSync(path, {
        recursive: true
    })
    log('PACKAGE STRUCTURE created');

    // create views, right now Main.js
    let viewName = 'Main'
    let componentString = createView(viewName);
    //console.log(componentString)

    // write views to disk
    writeFileSync(path + '/' + viewName.trim() + ending.trim(), componentString);
    log('PACKAGE ' + viewName + ' created');
}

createPackageStructure()





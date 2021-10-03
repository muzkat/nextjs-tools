/**
 * TODOs
 *
 * create package structure
 * create view
 *
 */

const {mkdirSync} = require('fs'),
    log = require('./log').log;

let packageFolder = 'packages'
let packageName = 'foo';

let baseConfig = {
    extend: 'Ext.panel.Panel'
}

let prefix= "Ext.define('";
let suffix= ")";

const createView = function (viewName){
    return prefix + packageName + "." + viewName+  "'," + JSON.stringify(baseConfig, undefined, 4) + suffix;
}

const createPackageStructure = function () {
    mkdirSync([packageFolder, packageName].join('/'), {
        recursive: true
    })
    log('packages created');
    // buildPackage
    let componentString = createView('Main');
    console.log(componentString)

}

createPackageStructure()





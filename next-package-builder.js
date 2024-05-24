const {log} = require('@srcld/sourlog');
const {a2p, createPath, doWrite} = require("./src/utils/file");

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

const createView = function (viewName, packageName) {
    let componentConfig = Object.assign({}, baseConfig, customConfig);
    let className = '"' + packageName + '.' + viewName + '",';
    componentConfig.alias = 'widget.' + packageName.toLowerCase() + viewName; // add naive alias
    return prefix + className + JSON.stringify(componentConfig, undefined, 4) + suffix;
}

const createPackageFolders = function (path) {
    createPath(path, true);
    log('PACKAGE STRUCTURE created');
}

// war -> seperation resources and src
const createPackageStructure = function (packageName, viewName, packageFolder, war = false) {
    let created = false;
    try {
        // create paths and package structure
        let paths = [packageFolder, packageName].concat(war ? ['src'] : []);
        let path = a2p(paths);
        createPackageFolders(path);

        // create views, right now Main.js
        let componentString = createView(viewName, packageName);
        log(componentString);
        // write views to disk
        doWrite(path + '/' + viewName.trim() + ending.trim(), componentString)
        created = true;
    } catch (e) {
        created = false
    }
    return created;
}

const packageBuilder = {
    createPackage: function (packageName = 'foo', vieName = 'Main', folder = 'packages') {
        return createPackageStructure(packageName, vieName, folder);
    },
    createWarPackage: function (packageName = 'foo', vieName = 'Main', folder = 'packages') {
        return createPackageStructure(packageName, vieName, folder, true);
    }
}

module.exports = packageBuilder;





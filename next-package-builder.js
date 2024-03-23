const {mkdirSync, writeFileSync} = require('fs'),
    {log} = require('@srcld/sourlog');

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


const createPath = function (folder, name) {
    return [folder, name].join('/')
}

const createPackageFolders = function (path) {
    mkdirSync(path, {
        recursive: true
    })
    log('PACKAGE STRUCTURE created');
}

// war -> seperation resources and src
const createPackageStructure = function (packageName, viewName, packageFolder, war = false) {
    let created = false;
    try {
        // create paths and package structure
        let path = createPath(packageFolder, packageName);
        if(war) path += '/src'
        createPackageFolders(path);

        // create views, right now Main.js
        let componentString = createView(viewName, packageName);
        console.log(componentString);
        // write views to disk
        writeFileSync(path + '/' + viewName.trim() + ending.trim(), componentString);
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





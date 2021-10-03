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

const createPackage = function () {
    mkdirSync([packageFolder, packageName].join('/'), {
        recursive: true
    })
    log('packages created');
}

createPackage()





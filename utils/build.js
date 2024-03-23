const {rmSync} = require('fs'),
    {log} = require('@srcld/sourlog');

const emptyFolder = function (folder = 'build') {
    log('DELETING BUILD FOLDER');
    rmSync('./' + folder, {recursive: true, force: true});
}

module.exports = {emptyFolder};
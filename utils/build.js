const {rmSync} = require('fs'),
    {log} = require('./log');

const clean = function (folder = 'build') {
    log('DELETING BUILD FOLDER');
    rmSync('./' + folder, {recursive: true, force: true});
}

module.exports = {clean};
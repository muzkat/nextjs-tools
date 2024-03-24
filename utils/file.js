const {readdirSync, writeFileSync, existsSync, mkdirSync} = require('fs');
const fs = require('fs').promises;
const {log} = require("@srcld/sourlog");

const getDirectories = source =>
    readdirSync(source, {withFileTypes: true})
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name)

const getFileNames = source =>
    readdirSync(source, {withFileTypes: true})
        .filter(dirent => dirent.isFile())
        .map(dirent => dirent.name)

const getDirDown = (directoryPath) => {
    let tree = {};

    const fetchDirsDown = function (dirPath) {
        let dirs = getDirectories(dirPath);
        if (dirs.length) {
            dirs.map(name => {
                tree[name] = {};
                let subs = getDirectories(dirPath + '/' + name);
                subs.map(sub => {
                    tree[name][sub] = {};
                    fetchDirsDown(dirPath + '/' + name + '/' + sub) // might not work with sub sub
                })
            })
        }
    }

    fetchDirsDown(directoryPath);
    return tree;
}

const getFileName = function (name, ending, debug = false) {
    return name.trim() + (debug ? (debugJoinBefore + debugSuffix) : '') + ending.trim();
}

const writeToDisk = function (path, name, string, ending = '.js') {
    log('WRITING : ' + name)
    doWrite([path, getFileName(name, ending)].join('/'), string)
    doWrite([path, getFileName(name, ending, true)].join('/'), string)
}

const doWrite = function (path, data) {
    writeFileSync(path, data);
}

const createPath = function (path) {
    if (!existsSync(path)) {
        mkdirSync(path);
    }
}

const emptyOrCreateFolder = async function (dir) {
    if (existsSync(dir)) {
        await fs.rm(dir, {recursive: true})
            .then(() => log('BUILD DIRECTORY REMOVED'));
    } else {
        mkdirSync(dir);
    }
}

const renameFile = function (oldPath, newPath) {
    return fs.rename(oldPath, newPath)
}

const debugSuffix = 'debug';
const debugJoinBefore = '-';

module.exports = {
    getFileNames,
    getDirectories,
    getDirDown,
    writeToDisk,
    createPath,
    buildDefaultProperties: {debugSuffix, debugJoinBefore},
    emptyOrCreateFolder,
    renameFile
}
const {readdirSync, writeFileSync, existsSync, mkdirSync} = require('fs');
const fs = require('fs').promises;
const {log, logJson} = require("@srcld/sourlog");

const getDirectories = source =>
    readdirSync(source, {withFileTypes: true})
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name)

const getFileNames = source =>
    readdirSync(source, {withFileTypes: true})
        .filter(dirent => dirent.isFile())
        .map(dirent => dirent.name)

const buildAst = function (p) {
    let ast = {};
    getDirectories(p).map((subFolder) => {
        ast[subFolder] = buildAst([p, subFolder].join('/'));
    })
    return ast;
}

const buildTree = function (path) {
    let tree = buildAst(path);
    logJson('TREE:', tree);
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
    buildTree,
    getDirectories,
    writeToDisk,
    createPath,
    buildDefaultProperties: {debugSuffix, debugJoinBefore},
    emptyOrCreateFolder,
    renameFile
}
const {readdirSync, writeFileSync, existsSync, mkdirSync, rmSync} = require('fs');
const fs = require('fs').promises;
const {log, logJson} = require("@srcld/sourlog");
const {buildVars} = require("../env/props");

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
        ast[subFolder] = buildAst(a2p([p, subFolder]));
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
    doWrite(a2p([path, getFileName(name, ending)]), string)
    doWrite(a2p([path, getFileName(name, ending, true)]), string)
}

const doWrite = function (path, data) {
    writeFileSync(path, data);
}

const createPath = function (path, recursive = false) {
    if (!exists(path)) createDir(path, recursive);
}

const createDir = function (dir, recursive = false) {
    mkdirSync(dir, {recursive})
}

const exists = function (path) {
    return existsSync(path)
}

const emptyOrCreateFolder = async function (dir) {
    if (exists(dir)) {
        await fs.rm(dir, {recursive: true})
            .then(() => log('BUILD DIRECTORY REMOVED'));
    } else {
        createDir(dir);
    }
}

const emptyFolder = function (folder = 'build') {
    log('DELETING BUILD FOLDER');
    rmSync('./' + folder, {recursive: true, force: true});
}

const renameFile = function (oldPath, newPath) {
    return fs.rename(oldPath, newPath)
}

const {
    debugSuffix,
    debugJoinBefore
} = buildVars()

const a2p = function (array = []) {
    return array.join('/');
}

module.exports = {
    getFileNames,
    buildTree,
    getDirectories,
    writeToDisk,
    createPath,
    emptyFolder,
    a2p,
    emptyOrCreateFolder,
    renameFile, createDir, doWrite, exists
}
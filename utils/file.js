const {readdirSync} = require('fs');

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

module.exports = {getFileNames, getDirectories, getDirDown}
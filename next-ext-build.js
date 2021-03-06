const {readdirSync} = require('fs'),
    {readFileSync} = require('fs'),
    fs = require('fs'),
    helper = require('./next-ext');

const log = function (txt) {
    console.log(new Date().toISOString() + ' - ' + txt)
}

const logJson = (text, json, divider = ' : ') => {
    log(text + divider + JSON.stringify(json, undefined, 4))
}

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

const buildArtefactType = 'js',
    buildDir = 'build',
    debugSuffix = 'debug',
    bundleName = 'bundle'

// todo move to build.json
const buildFile = {
    srcDir: 'src',
    packagesDir: 'packages',

}

const fetchPackageDirs = () => {
    let packagesPath = [buildFile.srcDir, buildFile.packagesDir].join('/');
    let componentNames = getDirectories(packagesPath).map(i => {
        return {
            packageName: i,
            packagePath: packagesPath + '/' + i
        }
    });
    log('PACKAGES FOUND : ' + componentNames.length)
    return componentNames;
}

const buildArtefactPaths = (packageDirNames) => {
    return packageDirNames.map(packageObj => {
        let debugPath = [buildDir, buildArtefactType, packageObj.packageName, packageObj.packageName + '.' + debugSuffix + '.' + buildArtefactType].join('/');
        let packagePath = packageObj.packagePath;
        packageObj.concat = {
            src: [packagePath + '/**/*.js'],
            dest: debugPath
        };
        return packageObj
    });
}

const fetchFilesFromTree = (t, basePath) => {
    t = t || {};
    var files = [];

    const downDir = (objRef, path) => {
        Object.keys(objRef).map(key => {
            let tPath = path + '/' + key;
            files = files.concat(getFileNames(tPath).map(fileName => tPath + '/' + fileName))
            if (objRef[key]) {
                downDir(objRef[key], tPath)
            }
        })
    }

    downDir(t, basePath);
    return files;
}

const getFiles = (buildConfig) => {
    return buildConfig.map(config => {
        log('GET FILES FOR : ' + config.packageName)

        let tree = getDirDown(config.packagePath);

        let files = getFileNames(config.packagePath).map(fileName => config.packagePath + '/' + fileName);
        files = files.concat(fetchFilesFromTree(tree, config.packagePath))

        config.tree = tree;
        config.files = files;
        return config;
    })
}

// PROTOTYPE

// prepare build files
let conf1 = fetchPackageDirs();
let conf2 = buildArtefactPaths(conf1);
//logJson('', conf2);
let configs = getFiles(conf2)

const writeToDisk = function (name, string) {
    fs.writeFileSync(name, string);
}

// create Ext like object
helper.initExt(); // todo get context for every package

// build
configs.map(config => {
    if (config.files) {
        if (!fs.existsSync(buildDir)) {
            fs.mkdirSync(buildDir);
        }
        config.files.map(filePath => helper.getClassObjects(readFileSync(filePath)))
        const strings = helper.getFilesAsBundle();
        const packageName = config.packageName + '.js';
        log('WRITING :' + packageName)
        writeToDisk('build/' + packageName, strings);
    }
});

module.exports = {};
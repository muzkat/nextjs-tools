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

const fetchPackageDirs = (sourceDir, packagesDir) => {
    let packagesPath = [sourceDir, packagesDir].join('/');
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
    let files = [];

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

const writeToDisk = function (name, string) {
    fs.writeFileSync(name, string);
}

const generateBundles = function (cfgs) {
    cfgs.map(config => {
        if (config.files) {
            // generate build folder
            if (!fs.existsSync(buildDir)) {
                fs.mkdirSync(buildDir);
            }

            // create Ext like object
            helper.initExt(); // todo get context for every package
            // add to framework
            config.files.map(filePath => helper.getClassObjects(readFileSync(filePath)))

            const packageName = config.packageName + '.js';

            // get framework
            let moduleClassInfo = helper.getModuleClassInfo();

            log('SORTING CLASSES : ' + packageName)

            moduleClassInfo.classArray.sort((a, b) => {
                if (a.requires && a.requires.indexOf(b.className) !== -1) {
                    return 1
                } else if (b.requires && b.requires.indexOf(a.className) !== -1) {
                    return -1
                } else return 0;
            })

            console.table(moduleClassInfo.classArray)

            log('WRITING : ' + packageName)
            let strings = helper.getFilesAsBundle(moduleClassInfo.classArray);
            writeToDisk('build/' + packageName, strings);
        }
    });
}

const buildArtefactType = 'js',
    buildDir = 'build',
    debugSuffix = 'debug',
    bundleName = 'bundle'


const nextBuilder = function (buildFile) {
    return {
        buildFile: buildFile,
        getPackageDirectories: fetchPackageDirs,
        generatePathsForPackages: buildArtefactPaths,
        fetchFiles: getFiles,
        generateBundles: generateBundles,
        build: function () {
            var config = this.getPackageDirectories(buildFile.srcDir, buildFile.packagesDir);
            config = this.generatePathsForPackages(config);
            config = this.fetchFiles(config);
            this.generateBundles(config);
        }
    };
}

module.exports = nextBuilder;


// todo
//
// check if mixins gets merged using cmd
// or loaded in advance, like requires / extend
//
// transpile
// uglify
// create prod, debug
//
// plus bundle option (modules)
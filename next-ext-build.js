const {readdirSync, readFileSync, existsSync, writeFileSync, unlinkSync, mkdirSync} = require('fs'),
    fs = require('fs').promises,
    helper = require('./next-ext'),
    log = require('./log').log,
    packageBuilder = require('./next-package-builder');

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
        let debugPath = [buildDir, buildArtefactType, packageObj.packageName, packageObj.packageName + debugJoinBefore + debugSuffix + '.' + buildArtefactType].join('/');
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

const sortClasses = (classArray) => {
    log('SORTING CLASSES')

    classArray.sort((a, b) => {
        if (a.requires && a.requires.indexOf(b.className) !== -1) {
            return 1
        } else if (b.requires && b.requires.indexOf(a.className) !== -1) {
            return -1
        } else return 0;
    })

    console.table(classArray);
    return classArray;
}

const generateBundles = async function (cfgs) {
    if (existsSync(buildDir)) {
        await fs.rm(buildDir, {recursive: true})
            .then(() => log('BUILD DIRECTORY REMOVED'));
    }
    mkdirSync(buildDir);

    return cfgs.map(config => {
        if (config.files) {
            // run in Ext context
            helper.initExt(); // todo get context for every package
            helper.newModuleBuild();
            // add to framework
            config.files.map(filePath => helper.getClassObjects(readFileSync(filePath)))

            var packagePath = buildDir + '/' + config.packageName;
            if (!existsSync(packagePath)) {
                mkdirSync(packagePath);
            }
            // get framework
            let moduleClassInfo = helper.getModuleClassInfo();
            moduleClassInfo.classArray = sortClasses(moduleClassInfo.classArray);

            let strings = helper.getFilesAsBundle(moduleClassInfo.classArray);
            writeToDisk(packagePath, config.packageName, strings);
            config.moduleString = strings;
        }
        return config;
    });
}

const deploy = function () {
    // todo good for today...
    let oldPath = 'build/'
    let newPath = 'public/app'
    let fileName = 'bundle.js'

    if (existsSync(newPath)) log('DEPLOY TARGET PATH EXISTS');
    else mkdirSync(newPath, {recursive: true});
    if (existsSync(newPath + '/' + fileName)) unlinkSync(newPath + '/' + fileName);
    return fs.rename(oldPath + '/' + fileName, newPath + '/' + fileName);
}


const buildArtefactType = 'js',
    buildDir = 'build',
    debugSuffix = 'debug',
    debugJoinBefore = '-',
    bundleName = 'bundle'


const nextBuilder = function (buildFile) {
    return {
        buildFile: buildFile,
        getPackageDirectories: fetchPackageDirs,
        generatePathsForPackages: buildArtefactPaths,
        fetchFiles: getFiles,
        generateBundles: generateBundles,
        build: async function () {
            let start = new Date(),
                buildStatus = {statusText: 'OK'};
            let config = this.getPackageDirectories(buildFile.srcDir, buildFile.packagesDir);
            config = this.generatePathsForPackages(config);
            config = this.fetchFiles(config);
            if (buildFile.appDir) {
                log('APPLICATION DIRECTORY FOUND')
                config = config.concat(this.getAppConfig(buildFile.appDir));
                log('APPLICATION FILES ADDED')
            }
            await this.generateBundles(config).then((configs) => {
                if (buildFile.bundleFiles) {
                    let bundleStringArray = configs.filter(conf => conf.moduleString).map(c => c.moduleString);
                    writeToDisk(buildDir, 'bundle', bundleStringArray.join('\n'));
                }
            }).finally(() => {
                let end = new Date();
                let diff = end.getTime() - start.getTime();
                log('BUILD STATUS: ' + buildStatus.statusText);
                log('BUILD TIME  : ' + diff);
            });
            return true;
        },
        getAppConfig: function (appDir) {
            let config = this.generatePathsForPackages([{
                packageName: 'application',
                packagePath: buildFile.srcDir + '/' + appDir
            }]);
            return this.fetchFiles(config);
        },
        deploy: deploy,
        createPackage: packageBuilder.createPackage
    };
}

module.exports = nextBuilder;

// todo
//
// add sort based in extend if within package
//
// check if mixins gets merged using cmd
// or loaded in advance, like requires / extend
//
// transpile
// uglify
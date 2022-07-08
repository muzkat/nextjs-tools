const {readFileSync, existsSync, writeFileSync, unlinkSync, mkdirSync, cpSync} = require('fs'),
    {getDirectories, getFileNames, getDirDown} = require('./utils/file'),
    {clean} = require('./utils/build'),
    fs = require('fs').promises,
    helper = require('./next-ext'),
    packageBuilder = require('./next-package-builder'),
    {logLine, log} = require("./utils/log");

const fetchPackageDirs = (sourceDir, packagesDir, packages = {}) => {
    let packagesPath = [sourceDir, packagesDir].join('/');
    let componentNames = getDirectories(packagesPath).map(i => {
        let item = {
            packageName: i,
            packagesPath,
            packagePath: packagesPath + '/' + i,
            packageRoot: packagesPath + '/' + i
        };
        // overwrite with custom src path if not folder root
        // useful if you have ie resources folder -> war / jar
        if (packages[i]) {
            item.customConfig = packages[i] || {};
            if (item.customConfig.srcDir) {
                item.packagePath += '/' + item.customConfig.srcDir;
            }
            if (item.customConfig.resDir) {
                item.resourcesPath = item.packageRoot + '/' + item.customConfig.resDir
            }
        }
        return item;
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

    // not good...
    const downDir = (objRef, path) => {
        console.log('DOWNDIR: ' + path);
        Object.keys(objRef).map(key => {
            console.log('KEY:' + key);
            console.log('PATH:' + path);
            let tPath = path + '/' + key;
            console.log('tPATH: ' + tPath);
            files = files.concat(getFileNames(tPath).map(fileName => tPath + '/' + fileName))
            if (objRef[key]) {
                console.log('CALL :' + objRef[key] + ' ' + tPath)
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
        if (buildConfig.packages) {
            if (buildConfig.packages[config.packageName]) {
                log('CUSTOM CONFIG FOUND');
                const packageConfig = buildConfig.packages[config.packageName] || {};
                let {srcDir = undefined} = packageConfig;
                if (srcDir) config.packagePath = config.packagePath + '/' + srcDir;
            }
        }
        let tree = getDirDown(config.packagePath);
        // console.table(tree);
        let files = getFileNames(config.packagePath).map(fileName => config.packagePath + '/' + fileName);
        // console.table(files);
        files = files.concat(fetchFilesFromTree(tree, config.packagePath))
        // console.table(files);
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

    classArray.sort((a, b) => {
        if (a.extend && a.extend === b.className) {
            return 1
        } else if (b.extend && b.extend === a.className) {
            return -1
        } else return 0;
    })
    console.table(classArray);
    return classArray;
}

const createPath = function (path) {
    if (!existsSync(path)) {
        mkdirSync(path);
    }
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

            let packagePath = buildDir + '/' + config.packageName;
            createPath(packagePath);

            // get framework
            let moduleClassInfo = helper.getModuleClassInfo();
            moduleClassInfo.classArray = sortClasses(moduleClassInfo.classArray);
            let strings = helper.getFilesAsBundle(moduleClassInfo.classArray);
            // console.log(moduleClassInfo);
            writeToDisk(packagePath, config.packageName, strings);
            config.moduleString = strings;
            //copy resources - if defined in buildFile
            if (config.resourcesPath) {
                cpSync(config.resourcesPath, packagePath + '/' + config.customConfig.resDir, {recursive: true})
            }
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
    bundleName = 'bundle';


const doBuild = async function (buildFile) {
    log('BUILD START')
    let start = new Date(),
        buildStatus = {statusText: 'OK'};
    let {srcDir = 'src', packagesDir = 'packages', appDir, bundleFiles, packages = {}} = buildFile;
    let config = fetchPackageDirs(srcDir, packagesDir, packages); // array with obj -> package// Name, packagePath
    config = buildArtefactPaths(config);
    config = getFiles(config);
    if (appDir) {
        log('APPLICATION DIRECTORY FOUND IN CONFIG: ' + appDir)
        if (existsSync(appDir)) {
            config = config.concat(this.getAppConfig(appDir, buildFile));
            log('APPLICATION DIRECTORY ADDED')
        } else {
            log('APPLICATION DIRECTORY SPECIFIED, BUT NOT EXISTING')
        }
    }
    let success = false;
    await generateBundles(config).then((configs) => {
        if (bundleFiles) {
            let bundleStringArray = configs.filter(conf => conf.moduleString).map(c => c.moduleString);
            writeToDisk(buildDir, 'bundle', bundleStringArray.join('\n'));
        }
    }).finally(() => {
        logLine();
        success = true;
        let diff = new Date().getTime() - start.getTime();
        log('BUILD STATUS: ' + buildStatus.statusText);
        log('BUILD TIME  : ' + diff);
        log('BUILD DONE.');
        logLine();
    });
    return {buildConfig: config, success, buildDir};
}

const getAppConfig = function (appDir, buildFile) {
    return getFiles(buildArtefactPaths([{
        packageName: 'application',
        packagePath: buildFile.srcDir + '/' + appDir
    }]));
}

const nextBuilder = function (buildFile) {
    return {
        buildFile,
        build: function (cleanRun = true) {
            if (cleanRun) {
                clean();
                logLine();
            }
            return doBuild(this.buildFile)
        },
        clean,
        getAppConfig,
        deploy,
        createPackage: packageBuilder.createPackage,
        createWarPackage: packageBuilder.createWarPackage
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
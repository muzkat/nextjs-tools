const {readFileSync, existsSync, unlinkSync, mkdirSync, cpSync} = require('fs'),
    {
        getDirectories,
        getFileNames,
        getDirDown,
        writeToDisk,
        createPath,
        buildDefaultProperties, renameFile, emptyOrCreateFolder
    } = require('./utils/file'),
    {emptyFolder} = require('./utils/build'),
    {sortClasses} = require('./utils/packagebuild'),
    helper = require('./next-ext'),
    packageBuilder = require('./next-package-builder'),
    {logLine, log} = require("@srcld/sourlog");

const {debugSuffix, debugJoinBefore} = buildDefaultProperties;

const fetchPackageDirs = (sourceDir, packagesDir, packages = {}) => {
    // allow with and without srcDir - ext legacy uses /packages/local/packagename to store individuell js
    let packagesPath = sourceDir && sourceDir.length ? [sourceDir, packagesDir].join('/') : packagesDir;
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

const debugPath = function (packageName) {
    return [buildDir, buildArtefactType, packageName, packageName + debugJoinBefore + debugSuffix + '.' + buildArtefactType].join('/');
}

const buildArtefactPaths = (packageDirNames) => {
    return packageDirNames.map(packageObj => {
        let {packagePath, packageName} = packageObj;
        packageObj.concat = {
            src: [packagePath + '/**/*.js'],
            dest: debugPath(packageName)
        };
        return packageObj
    });
}

const fetchFilesFromTree = (t, basePath) => {
    t = t || {};
    let files = [];

    // not good...
    const downDir = (objRef, path) => {
        log('DOWNDIR: ' + path);
        Object.keys(objRef).map(key => {
            log('KEY:' + key);
            log('PATH:' + path);
            let tPath = path + '/' + key;
            log('tPATH: ' + tPath);
            files = files.concat(getFileNames(tPath).map(fileName => tPath + '/' + fileName))
            if (objRef[key]) {
                log('CALL :' + objRef[key] + ' ' + tPath)
                downDir(objRef[key], tPath)
            }
        })
    }

    downDir(t, basePath);
    return files;
}

const getFiles = (buildConfig) => {
    return buildConfig.map(config => {
        let {packageName} = config;
        log('GET FILES FOR : ' + packageName)
        if (buildConfig.packages) {
            if (buildConfig.packages[packageName]) {
                log('CUSTOM CONFIG FOUND');
                const packageConfig = buildConfig.packages[packageName] || {};
                let {srcDir = undefined} = packageConfig;
                if (srcDir) config.packagePath = config.packagePath + '/' + srcDir;
            }
        }
        let tree = getDirDown(config.packagePath);
        let files = getFileNames(config.packagePath).map(fileName => config.packagePath + '/' + fileName);
        files = files.concat(fetchFilesFromTree(tree, config.packagePath))
        config.tree = tree;
        config.files = files;
        return config;
    })
}


const generateBundles = async function (cfgs) {
    await emptyOrCreateFolder(buildDir);

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

    oldPath = [oldPath, fileName].join('/');
    newPath = [newPath, fileName].join('/');
    if (existsSync(newPath)) unlinkSync(newPath);
    return renameFile(oldPath, newPath);
}

const buildArtefactType = 'js',
    buildDir = 'build';


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
        let appDirPath = [srcDir, appDir].join('/');
        if (existsSync(appDirPath)) {
            config = config.concat(getAppConfig(appDir, buildFile));
            log('APPLICATION DIRECTORY ADDED')
        } else {
            log('APPLICATION DIRECTORY SPECIFIED, BUT NOT EXISTING')
        }
    }
    let success = false;
    await generateBundles(config)
        .then((configs) => {
            if (bundleFiles) {
                let bundleStringArray = configs.filter(conf => conf.moduleString).map(c => c.moduleString);
                writeToDisk(buildDir, 'bundle', bundleStringArray.join('\n'));
            }
        })
        .finally(() => {
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
    const packagePath = [(buildFile.srcDir || 'src'), appDir].join('/');
    return getFiles(buildArtefactPaths([{
        packageName: 'application',
        packagePath
    }]));
}

const nextBuilder = function (buildFile) {
    return {
        buildFile,
        log,
        build: function (cleanRun = true) {
            if (cleanRun) {
                emptyFolder();
                logLine();
            }
            return doBuild(this.buildFile)
        },
        clean: emptyFolder, // keep api stable for now
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
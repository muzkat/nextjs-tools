const {readFileSync, existsSync, unlinkSync, cpSync} = require('fs'),
    {
        getDirectories,
        getFileNames,
        writeToDisk,
        createPath,
        buildDefaultProperties,
        renameFile,
        emptyOrCreateFolder,
        buildTree,
        a2p,
        emptyFolder
    } = require('./src/utils/file'),
    {sortClasses} = require('./src/utils/packagebuild'),
    helper = require('./next-ext'),
    packageBuilder = require('./next-package-builder'),
    {logLine, log, logTable} = require("@srcld/sourlog");

const {debugSuffix, debugJoinBefore} = buildDefaultProperties;

const fetchPackageDirs = (sourceDir, packagesDir, packages = {}) => {
    // allow with and without srcDir - ext legacy uses /packages/local/packagename to store individuell js
    let packagesPath = sourceDir && sourceDir.length ? a2p([sourceDir, packagesDir]) : packagesDir;
    let componentNames = getDirectories(packagesPath).map(i => {
        let item = {
            packageName: i,
            packagesPath,
            packagePath: a2p([packagesPath, i]),
            packageRoot: a2p([packagesPath, i])
        };
        // overwrite with custom src path if not folder root
        // useful if you have ie resources folder -> war / jar
        if (packages[i]) {
            item.customConfig = packages[i] || {};
            if (item.customConfig.srcDir) {
                item.packagePath += '/' + item.customConfig.srcDir;
            }
            if (item.customConfig.resDir) {
                item.resourcesPath = a2p([item.packageRoot, item.customConfig.resDir])
            }
        }
        return item;
    });
    log('PACKAGES FOUND : ' + componentNames.length)
    return componentNames;
}

const debugPath = function (packageName) {
    return a2p([buildDir, buildArtefactType, packageName, packageName + debugJoinBefore + debugSuffix + '.' + buildArtefactType]);
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
                if (srcDir) config.packagePath = a2p([config.packagePath, srcDir]);
            }
        }
        let tree = buildTree(config.packagePath);
        let files = getFileNames(config.packagePath).map(fileName => a2p([config.packagePath, fileName]));
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

            let packagePath = a2p([buildDir, config.packageName]);
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
    else createPath(newPath, true);

    oldPath = a2p([oldPath, fileName]);
    newPath = a2p([newPath, fileName]);
    if (existsSync(newPath)) unlinkSync(newPath);
    return renameFile(oldPath, newPath);
}

const buildArtefactType = 'js',
    buildDir = 'build',
    defaultSrcDirName = 'src',
    defaultPackagesDirName = 'packages';

const doBuild = async function (buildFile) {
    log('BUILD START')
    let start = new Date(),
        buildStatus = {statusText: 'OK'};
    let {
        srcDir = buildFile.defaultSrcDirName || defaultSrcDirName,
        packagesDir = defaultPackagesDirName,
        appDir,
        bundleFiles,
        packages = {}
    } = buildFile;
    let config = fetchPackageDirs(srcDir, packagesDir, packages); // array with obj -> package// Name, packagePath
    config = buildArtefactPaths(config);
    config = getFiles(config);
    if (appDir) {
        log('APPLICATION DIRECTORY FOUND IN CONFIG: ' + appDir)
        if (existsSync(a2p([srcDir, appDir]))) {
            config = config.concat(getAppConfig(appDir, buildFile));
            log('APPLICATION DIRECTORY ADDED')
        } else {
            log('APPLICATION DIRECTORY SPECIFIED, BUT NOT EXISTING')
        }
    }
    let success = false;
    await generateBundles(config)
        .then((configs) => {
            if (bundleFiles) writeAsBundle(buildDir, configs);
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

const writeAsBundle = function (buildDir, configs) {
    writeToDisk(buildDir, 'bundle', getBundleString(configs));
}

const getBundleString = function (configs = []) {
    return configs
        .filter(conf => conf.moduleString)
        .map(c => c.moduleString).join('\n');
}

const getAppConfig = function (appDir, buildFile) {
    return getFiles(buildArtefactPaths([{
        packageName: 'application',
        packagePath: a2p([(buildFile.defaultSrcDirName || buildFile.srcDir || defaultSrcDirName), appDir])
    }]));
}

const nextBuilder = function (buildFile) {
    return {
        buildFile,
        log,
        build: function (cleanRun = true) {
            if (cleanRun) {
                log('CLEAN RUN');
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
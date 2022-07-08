const vm = require('vm'),
    {log} = require('./utils/log');

// helper object for each module, application
const getModuleClassInfo = function () {
    return {
        objs: [],
        classMap: {},
        classArray: [],
        classId: 1,
    }
}

let moduleClassInformation = {};
let isCode = false;

const ExtJsClassBuildUtil = {
    define: function (name, config) {
        log('DEFINE: ' + name);
        isCode = true;
        let cls = {
            className: name || 'UNDEFINED',
            config: config || {}
        };
        moduleClassInformation.objs.push(cls);
        moduleClassInformation.classMap[cls.className] = cls.config;
        moduleClassInformation.classArray.push({
            className: name,
            config: config,
            requires: config.requires ? config.requires : undefined,
            extend: config.extend ? config.extend : undefined,
            id: moduleClassInformation.classId
        })
        moduleClassInformation.classId++;
    },
    getClassNames: function () {
        return moduleClassInformation.objs.map(i => i.className);
    },
    create: () => {
        return undefined;
    }
}


module.exports = {
    ExtJsClassBuildUtil,
    vmContext: undefined,
    moduleClassInfo: undefined,
    initExt: function () {
        var ctx = {Ext: this.ExtJsClassBuildUtil};
        vm.createContext(ctx);
        this.vmContext = ctx;
    },
    filesRaw: [],
    newModuleBuild: function () {
        moduleClassInformation = getModuleClassInfo();
        this.filesRaw = [];
    },
    getModuleClassInfo: function () {
        // remove placeholder - can happen if full doc is commented out
        moduleClassInformation.classArray = moduleClassInformation.classArray.filter((item, index) => {
            if (item.className === '') { // remove there as well, sorting issue - TODO write better sort function...
                this.filesRaw.filter((fileBuf, i) => {
                    return i !== index;
                })
                return false;
            }
            return true;
        })

        return moduleClassInformation;
    },
    getClassObjects: function (fileSource) {
        // will be set to true if run in context
        // otherwise define was not called
        // therefore we will exclude it for now
        // later this should be only excluded in prod builds
        isCode = false;
        this.filesRaw.push(fileSource);
        try {
            vm.runInNewContext(fileSource, this.vmContext);
        } catch (e) {
            log(e)
            log('ERROR in File : ' + fileSource);
            this.initExt();
        }
        if (!isCode) {
            log('LOOKS LIKE -> THIS IS NOT A VALID JS FILE')
            moduleClassInformation.classArray.push({
                className: '',
                config: '',
                id: moduleClassInformation.classId
            })
            moduleClassInformation.classId++;
        }
        return this.vmContext;
    },
    getFilesAsBundle: function (classNamesArray) {
        log('FILES RAW: ' + this.filesRaw.length)
        let bundle = classNamesArray.map(item => {
            return this.filesRaw[item.id - 1]; // buffer
        });
        return bundle.join('\n');
    }
}
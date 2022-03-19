const vm = require('vm'),
    log = require('./log').log;

const getModuleClassInfo = function () {
    return {
        objs: [],
        classMap: {},
        classArray: [],
        classId: 1,
    }
}

let moduleClassInformation = {};

const Ext = {
    define: function (name, config) {
        log('DEFINE: ' + name);
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
    Ext: Ext,
    vmContext: undefined,
    moduleClassInfo: undefined,
    initExt: function () {
        var ctx = {Ext: this.Ext};
        vm.createContext(ctx);
        this.vmContext = ctx;
    },
    filesRaw: [],
    getExt: function () {
        return this.Ext;
    },
    newModuleBuild: function () {
        moduleClassInformation = getModuleClassInfo();
        this.filesRaw = [];
    },
    getModuleClassInfo: function () {
        return moduleClassInformation;
    },
    getClassObjects: function (fileSource) {
        this.filesRaw.push(fileSource);
        try {
            vm.runInNewContext(fileSource, this.vmContext);
        } catch (e) {
            log(e)
            this.initExt();
            log('ERROR in File : ' + fileSource);
        }
        return this.vmContext;
    },
    getFilesAsBundle: function (classNamesArray) {
        let bundle = classNamesArray.map(item => {
            return this.filesRaw[item.id - 1];
        });
        //console.log(bundle.toString());
        return bundle.join('\n');
    }
}
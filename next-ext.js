const vm = require('vm');

const Ext = {
    objs: [],
    classMap: {},
    classArray: [],
    classId: 1,
    define: function (name, config) {
        var cls = {
            className: name || 'UNDEFINED',
            config: config || {}
        };
        this.objs.push(cls);
        this.classMap[cls.className] = cls.config;
        this.classArray.push({
            className: name,
            config: config,
            requires: config.requires ? config.requires : undefined,
            id: this.classId
        })
        this.classId++;
    },
    getClassNames: function () {
        return this.objs.map(i => i.className);
    }
}

module.exports = {
    Ext: Ext,
    vmContext: undefined,
    initExt: function () {
        var ctx = {Ext: this.Ext};
        vm.createContext(ctx);
        this.vmContext = ctx;
    },
    filesRaw: [],
    getExt: function () {
        return this.Ext;
    },
    getClassObjects: function (fileSource) {
        this.filesRaw.push(fileSource);
        vm.runInNewContext(fileSource, this.vmContext);
        return this.vmContext;
    },
    getFilesAsBundle: function (classNamesArray) {
        let bundle = classNamesArray.map(item => {
            return this.filesRaw[item.id - 1];
        });
        return bundle.join('\n');
    }
}
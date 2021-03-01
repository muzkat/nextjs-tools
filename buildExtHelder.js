const vm = require('vm');

const Ext = {
    objs: [],
    classMap: {},
    define: function (name, config) {
        var cls = {
            className: name || 'UNDEFINED',
            config: config || {}
        };
        this.objs.push(cls);
        this.classMap[cls.className] = cls.config;
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
    getClassObjects: function (fileSource) {
        vm.runInNewContext(fileSource, this.vmContext);
        return this.vmContext;
    }
}

// todo
// "register" all files in src/packages/testModule
// sort based on extend and requires props
//
// check if mixins gets merged using cmd
// or loaded in advance, like requires / extend
//
// concat
// transpile
// uglify
// create prod, debug
//
// plus bundle option (modules)
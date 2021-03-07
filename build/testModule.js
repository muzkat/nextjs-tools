Ext.define('testModule.x', {
    extend: 'Ext.Base',

    constructor: function () {
        console.log('x created');
    },
});
Ext.define('testModule.Main', {
    extend: 'testModule.base.view.Main',
    requires: ['testModule.x'],

    alias: ['widget.testModuleMain'],

    initComponent: function () {
        this.x = Ext.create('testModule.x');
        this.callParent(arguments);
    }
});
Ext.define('testModule.base.view.Main', {
    extend: 'Ext.container.Container',

    html: 'Show me'
});
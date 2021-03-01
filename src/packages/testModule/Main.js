Ext.define('testModule.Main', {
    extend: 'testModule.base.view.Main',
    requires: ['testModule.x'],

    alias: ['widget.testModuleMain'],

    initComponent: function () {
        this.x = Ext.create('testModule.x');
        this.callParent(arguments);
    }
});
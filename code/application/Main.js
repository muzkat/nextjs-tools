Ext.define('mzk.application.frame.main', {
    extend: 'Ext.container.Container',
    alias: 'widget.mzkApplicationMain',

    layout: {
        type: 'hbox',
        align: 'stretch'
    },

    initComponent: function () {
        this.nav = Ext.create({
            xtype: 'toolbar',
            layout: {
                type: 'vbox',
                align: 'stretch'
            },
            flex: 1,
            defaults: {
                textAlign: 'left'
            },
            items: [{
                text: 'Info',
                style: {
                    marginBottom: '15px'
                }
            }, {
                xtype: 'tbfill'
            }, {
                text: 'Settings'
            }]
        });

        this.mainFrame = Ext.create({
            xtype: 'panel',
            header: false,
            flex: 8,
            layout: 'card',
            padding: '15 15 15 15',
            items: [{xtype: 'container', html: 'hello'}]
        });

        this.items = [this.nav, this.mainFrame];
        this.callParent(arguments);
    },

    setComponentActive: function (xtype, config) {
        let cmpCfg = {} || config;
        if (xtype) cmpCfg = Ext.apply(cmpCfg, {
            xtype: xtype
        })
        this.mainFrame.removeAll();
        this.mainFrame.add(cmpCfg);
    }
});

const builder = require('./next-ext-build')

const buildFile = {
    // srcDir: 'src',
    appDir: 'application2', // does not exist
    // packagesDir: 'packages',
    bundleFiles: true,
    deployMode: 'bundle',
    deployDir: 'public',
    packages: {
        testModuleWithResources: {
            srcDir: 'src',
            resDir: 'resources'
        }
    }
}

// build a package
builder(buildFile)
    .build()
    .then((success) => {
        console.log(success);
        //  if (success && buildFile.deployDir) myBuilder.deploy()
    })
//
// myBuilder.clean();

/**
 produces
 build/application/application.debug.js
 build/application/application.js
 build/testModule/testModule.debug.js
 build/testModule/testModule.js
 build/bundle.debug.js
 build/bundle.js
 */


// create a simple package
//  myBuilder.createWarPackage('test', 'TestView', 'folder')

/**
 * produces
 * folder -> test -> TestView.js
 *
 *
 * Ext.define("test.TestView",{
    "extend": "Ext.panel.Panel",
    "moduleId": null,
    "alias": "widget.testTestView"
})
 *
 */
const builder = require('./next-ext-build')

const buildFile = {
    srcDir: 'src',
    appDir: 'application',
    packagesDir: 'packages',
    bundleFiles: true,
    deployMode: 'bundle',
    deployDir: 'public'
}

const myBuilder = builder(buildFile);
// build a package
myBuilder.build()
    .then((success) => {
        if (success && buildFile.deployDir) myBuilder.deploy()
    })

// create a simple package
myBuilder.createPackage('test', 'TestView', 'folder')

/**
 produces
 build/application/application.debug.js
 build/application/application.js
 build/testModule/testModule.debug.js
 build/testModule/testModule.js
 build/bundle.debug.js
 build/bundle.js
 */

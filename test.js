const builder = require('./next-ext-build');

const buildFile = {
    srcDir: 'src',
    appDir: 'application',
    packagesDir: 'packages',
    bundleFiles: true,
    deployMode: 'bundle',
    deployDir: 'public'
}

let myBuilder = builder(buildFile);
myBuilder.build()
    .then((success) => {
        if (success && buildFile.deployDir) myBuilder.deploy()
    });

/**
 produces
 build/application/application.debug.js
 build/application/application.js
 build/testModule/testModule.debug.js
 build/testModule/testModule.js
 build/bundle.debug.js
 build/bundle.js
 */

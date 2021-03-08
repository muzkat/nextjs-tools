const builder = require('./next-ext-build');

const buildFile = {
    srcDir: 'src',
    packagesDir: 'packages',
    bundleFiles: true
}

let myBuilder = builder(buildFile);
myBuilder.build();

/**
 produces
 build/testModule/testModule.debug.js
 build/testModule/testModule.js
 build/bundle.debug.js
 build/bundle.js
 */

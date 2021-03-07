const builder = require('./next-ext-build');

// todo move to build.json
const buildFile = {
    srcDir: 'src',
    packagesDir: 'packages',

}

// PROTOTYPE
let myBuilder = builder(buildFile);
myBuilder.build();
# nextjs-tools

Modern and fast build tools for ExtJS - Classic framwork

* no java / sdk during build needed
* no dependencies except this package
* fast configuration
* ExtJS6+

### Features

* build ExtJS like packages
* build ExtJS like applications

### Example build file

```javascript
const builder = require('./next-ext-build');

const buildFile = {
    srcDir: 'src',
    appDir: 'application',
    packagesDir: 'packages',
    bundleFiles: true
}

let myBuilder = builder(buildFile);
myBuilder.build();
```

Wishes, Changes, Feedback, Questions?

Please file an issue. 

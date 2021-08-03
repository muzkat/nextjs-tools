# nextjs-tools

Modern and fast build tools for ExtJS - Classic framework

* no java / sdk during build needed
* no dependencies except this package
* fast configuration
* ExtJS6+

### Features

* build ExtJS like packages
* build ExtJS like applications

### Example build file (test.js)

```javascript
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
myBuilder.build()
    .then((success) => {
        if (success && buildFile.deployDir) myBuilder.deploy()
    })
```
### Example build log

* clone repo and run "npm run test"

```shell
> @muzkat/nextjs-tools@0.0.9 test
> node test.js

2021-08-03T16:32:17.646Z - PACKAGES FOUND : 1
2021-08-03T16:32:17.652Z - GET FILES FOR : testModule
2021-08-03T16:32:17.653Z - APPLICATION DIRECTORY FOUND
2021-08-03T16:32:17.653Z - GET FILES FOR : application
2021-08-03T16:32:17.653Z - APPLICATION FILES ADDED
2021-08-03T16:32:17.657Z - BUILD DIRECTORY REMOVED
2021-08-03T16:32:17.659Z - DEFINE: testModule.Main
2021-08-03T16:32:17.659Z - DEFINE: testModule.x
2021-08-03T16:32:17.660Z - DEFINE: testModule.base.view.Main
2021-08-03T16:32:17.660Z - SORTING CLASSES
┌─────────┬─────────────────────────────┬──────────────────────────────────────────────────────────────┬────────────────────┬────┐
│ (index) │          className          │                            config                            │      requires      │ id │
├─────────┼─────────────────────────────┼──────────────────────────────────────────────────────────────┼────────────────────┼────┤
│    0    │       'testModule.x'        │ { extend: 'Ext.Base', constructor: [Function: constructor] } │     undefined      │ 2  │
│    1    │      'testModule.Main'      │                           [Object]                           │ [ 'testModule.x' ] │ 1  │
│    2    │ 'testModule.base.view.Main' │    { extend: 'Ext.container.Container', html: 'Show me' }    │     undefined      │ 3  │
└─────────┴─────────────────────────────┴──────────────────────────────────────────────────────────────┴────────────────────┴────┘
2021-08-03T16:32:17.664Z - WRITING : testModule
2021-08-03T16:32:17.666Z - DEFINE: mzk.application.frame.main
2021-08-03T16:32:17.666Z - SORTING CLASSES
┌─────────┬──────────────────────────────┬──────────┬───────────┬────┐
│ (index) │          className           │  config  │ requires  │ id │
├─────────┼──────────────────────────────┼──────────┼───────────┼────┤
│    0    │ 'mzk.application.frame.main' │ [Object] │ undefined │ 1  │
└─────────┴──────────────────────────────┴──────────┴───────────┴────┘
2021-08-03T16:32:17.666Z - WRITING : application
2021-08-03T16:32:17.667Z - WRITING : bundle
2021-08-03T16:32:17.667Z - BUILD STATUS: OK
2021-08-03T16:32:17.667Z - BUILD TIME  : 21
2021-08-03T16:32:17.668Z - DEPLOY TARGET PATH EXISTS
```

Changes, feedback, questions?

Please file an issue. 

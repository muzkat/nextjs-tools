const {readdirSync} = require('fs'),
    {readFileSync} = require('fs'),
    log = console.log;

const helper = require('./buildExtHelder')

const getDirectories = source =>
    readdirSync(source, {withFileTypes: true})
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name)


module.exports = function (grunt) {

    // TODO read from .env or other config
    const sourceRoot = 'src/',
        componentDir = 'components/',
        appDir = 'app/',
        applicationWrapper = 'wrapper.js',
        buildDir = 'build/',
        buildArtefactType = 'js';

    const debugSuffix = 'debug';

    const targetName = 'bundle.js',
        targetPath = './public/js/';


    var concatConf = {};

    // get all folder names inside /src/components/
    let componentNames = getDirectories(sourceRoot + componentDir);

    let packages = {};
    // build each individually and store them temp under /build/js/
    let buildArtefactPaths = componentNames.map(name => {
        let debugPath = buildDir + buildArtefactType + '/' + name + '.' + debugSuffix + '.js';
        let packagePath = sourceRoot + componentDir + name;
        packages[name] = {
            path: packagePath
        };
        concatConf[name] = {
            src: [packagePath + '/**/*.js'],
            dest: debugPath
        }
        return debugPath
    });

    // application wrapper
    let appPath = buildDir + buildArtefactType + '/' + 'app.' + debugSuffix + '.js';
    concatConf.app = {
        src: [sourceRoot + appDir + '/**/*.js'],
        dest: appPath
    };
    buildArtefactPaths.push(appPath);

    helper.initExt();
    log(helper.getClassObjects(readFileSync(appPath)))

    Object.keys(packages).map(name => {
        packages[name].folders = getDirectories(packages[name].path).map(subFolderName => {
            return {
                name: subFolderName,
                folders: getDirectories(packages[name].path + '/' + subFolderName)
            }
        });
    })

    log(JSON.stringify(packages, undefined, 4));

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        concat: concatConf,

        // add back later
        // watch: {
        //     scripts: {
        //         files: ['src/**/*.js', 'public/**/*.html'],
        //         tasks: ['concat', 'dev'],
        //         options: {
        //             spawn: false,
        //             livereload: true
        //         }
        //     }
        // },


        browserify: {
            dev: {
                src: buildArtefactPaths.concat([sourceRoot + applicationWrapper]),
                dest: targetPath + targetName,
                options: {
                    // watch : true, // use watchify for incremental builds!
                    //  keepAlive : true, // watchify will exit unless task is kept alive
                    browserifyOptions: {
                        debug: true // source mapping
                    }
                }
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-browserify');


    grunt.registerTask("dev", ["browserify:dev"]);
    grunt.registerTask('default', ['concat', 'dev']);
};
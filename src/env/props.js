const buildVars = function (){
    return {
        buildArtefactType: 'js',
        buildDir: 'build',
        defaultSrcDirName: 'src',
        defaultPackagesDirName: 'packages',
        debugSuffix: 'debug',
        debugJoinBefore: '-'
    }
}

module.exports = {
    buildVars
}
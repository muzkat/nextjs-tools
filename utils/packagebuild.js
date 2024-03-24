const {log, logTable} = require("@srcld/sourlog");
const sortClasses = (classArray) => {
    log('SORTING CLASSES')
    logTable(classArray);

    classArray.sort((a, b) => {
        const ahasRequires = a.requires && a.requires.length;
        const bhasRequires = b.requires && b.requires.length;
        if (ahasRequires && bhasRequires) return 0;
        if (ahasRequires) return 1;
        if (bhasRequires) return -1;
    })

    classArray.sort((a, b) => {
        if (a.requires && a.requires.indexOf(b.className) !== -1) {
            return 1
        } else if (b.requires && b.requires.indexOf(a.className) !== -1) {
            return -1
        }
        return 0;
    })

    // classSaveArray.sort((a, b) => {
    //     if (a.extend && a.extend === b.className) {
    //         return 1
    //     } else if (b.extend && b.extend === a.className) {
    //         return -1
    //     } else return 0;
    // })

    return classArray;
}

module.exports = {sortClasses};
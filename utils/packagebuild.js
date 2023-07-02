const {log} = require("./log");
const sortClasses = (classArray) => {
    log('SORTING CLASSES')

    console.table(classArray);

    const requiredClassNames = [];
    const extendClassNames = [];


    let modifiedClassArray = [];

    classArray = classArray.map((item) => {
        if (item.requires) {
            item.requires.map((className) => {
                className = className.trim();
                if (requiredClassNames.indexOf(className) === -1) {
                    requiredClassNames.push({required: className, cls: item, name: item.className});
                }
            })
        } else if (item.extend) {
            if (!item.extend.startsWith('Ext.') && !item.extend.startsWith('BpcCommon.')) {
                if (extendClassNames.indexOf(item.extend) === -1) {
                    extendClassNames.push({extend: item.extend, cls: item, name: item.className});
                }
            } else {
                // log ignored
            }
        } else {
            // noSortClasses.push(item);
        }
        return item;
    })

    console.table(requiredClassNames);
    console.table(extendClassNames);

    const handledClassNames = [];

    requiredClassNames.map((item) => {
        let {required, cls, name} = item;
        const match = classArray.filter((item) => item.className === required);
        if (match.length) {
            modifiedClassArray.push(match[0]);
            modifiedClassArray.push(item.cls);

            handledClassNames.push(required);
            handledClassNames.push(item.name);
        }
    })

    extendClassNames.map((item) => {
        let {extend, cls, name} = item;
        const match = classArray.filter((item) => item.className === extend);
        if (match.length) {
            modifiedClassArray.push(match[0]);
            modifiedClassArray.push(item.cls);

            handledClassNames.push(extend);
            handledClassNames.push(item.name);
        }
    })

    const missing = classArray.filter((item) => handledClassNames.indexOf(item.className) === -1);

    modifiedClassArray = modifiedClassArray.concat(missing);

    if (modifiedClassArray.length === classArray.length) {
        console.log('GOODIE!')
    }

    console.table(modifiedClassArray);

    return modifiedClassArray;


    // way too naive sort
    // classArray.sort((a, b) => {
    //     if (a.requires && a.requires.indexOf(b.className) !== -1) {
    //         return 1
    //     } else if (b.requires && b.requires.indexOf(a.className) !== -1) {
    //         return -1
    //     } else return 0;
    // })
    //
    // classArray.sort((a, b) => {
    //     if (a.extend && a.extend === b.className) {
    //         return 1
    //     } else if (b.extend && b.extend === a.className) {
    //         return -1
    //     } else return 0;
    // })
    //
    // console.table(classArray);
    // return classArray;
}

module.exports = {sortClasses};
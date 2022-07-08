const logTypeMap = {
    i: 'info',
    w: 'warning',
    e: 'error'
}

const log = function (txt, type = 'info') {
    type = logTypeMap[type] || type;
    console.log(new Date().toISOString() + ' - ' + (type || '').toUpperCase() + ' - ' + txt);
}

const stringify = (json) => {
    return JSON.stringify(json, undefined, 4);
}

const logJson = (text, json, divider = ' : ') => {
    log(text + divider + stringify(json, undefined, 4))
}

module.exports = {
    log,
    logJson,
    logLine: () => log('-------------------------------'),
}
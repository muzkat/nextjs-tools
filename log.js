const log = function (txt, type = 'info',) {
    console.log(new Date().toISOString() + ' - ' + (type || '').toUpperCase() + ' - ' + txt);
}

const logJson = (text, json, divider = ' : ') => {
    log(text + divider + JSON.stringify(json, undefined, 4))
}

module.exports = {
    log: log,
    logLine: () => log('-------------------------------'),
    logJson: logJson
}
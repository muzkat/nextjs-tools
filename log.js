const log = function (txt) {
    console.log(new Date().toISOString() + ' - ' + txt)
}

const logJson = (text, json, divider = ' : ') => {
    log(text + divider + JSON.stringify(json, undefined, 4))
}

module.exports = {
    log: log,
    logJson: logJson
}
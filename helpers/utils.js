const moment = require('moment-timezone');

// Valid checking regex
function isValid(text) {
    return /^[0-9a-z_.-]+$/.test(text);
}

function isValidPass(text) {
    for (var i = 0; i < text.length; i++) {
        if (text[i] == ' ') {
            return false;
        }
    }
    return true;
}

function getBDTime() {
    var time = moment.tz('Asia/Dhaka');
    return new Date(time);
}

// Generate alphanumeric string
function randomString() {
    var result = '';
    var chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    for (var i = 32; i > 0; --i) {
        result += chars[Math.floor(Math.random() * chars.length)];
    }
    return result;
}

module.exports = {
    isValid,
    isValidPass,
    getBDTime,
    randomString
}; 
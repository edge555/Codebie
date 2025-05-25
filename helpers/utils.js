const moment = require('moment-timezone');

// Get Bangladesh time
const getBDTime = () => {
    const time = moment.tz('Asia/Dhaka');
    return new Date(time);
};

// Validate username/email format
const isValid = (text) => {
    return /^[0-9a-z_.-]+$/.test(text);
};

// Validate password format
const isValidPass = (text) => {
    for (let i = 0; i < text.length; i++) {
        if (text[i] === ' ') {
            return false;
        }
    }
    return true;
};

// Generate random alphanumeric string
const randomString = () => {
    let result = '';
    const chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    for (let i = 32; i > 0; --i) {
        result += chars[Math.floor(Math.random() * chars.length)];
    }
    return result;
};

module.exports = {
    getBDTime,
    isValid,
    isValidPass,
    randomString
}; 
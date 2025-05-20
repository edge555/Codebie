const path = require('path');
const exphbs = require('express-handlebars');
const { allowInsecurePrototypeAccess } = require('@handlebars/allow-prototype-access');
const Handlebars = require('handlebars');
const handlebarsHelpers = require('../helpers/handlebarsHelpers');

// Admin configuration
const adminConfig = {
    adminIds: ["edge555"],
    development: {
        myId: "edge555",
        myPass: "abc123"
    }
};

// Handlebars configuration
const handlebarsConfig = {
    defaultLayout: 'main',
    handlebars: allowInsecurePrototypeAccess(Handlebars),
    helpers: handlebarsHelpers
};

// Session configuration
const sessionConfig = {
    secret: 'secret',
    resave: true,
    saveUninitialized: true
};

// MongoDB configuration
const mongoConfig = {
    useNewUrlParser: true,
    useUnifiedTopology: true
};

// Email configuration
const emailConfig = {
    service: 'yahoo',
    auth: {
        user: process.env.NODEMAILER_MAIL,
        pass: process.env.NODEMAILER_PASS
    }
};

module.exports = {
    adminConfig,
    handlebarsConfig,
    sessionConfig,
    mongoConfig,
    emailConfig
}; 
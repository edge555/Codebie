const nodemailer = require('nodemailer');

// Node mailer email
const transporter = nodemailer.createTransport({
    service: 'yahoo',
    auth: {
        user: process.env.NODEMAILER_MAIL,
        pass: process.env.NODEMAILER_PASS
    }
});

// Nodemailer mail sending function
function sendMail(sender, receiver, subject, text) {
    var mailOptions = {
        from: sender,
        to: receiver,
        subject: subject,
        text: text
    };
    transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
            console.log(error);
        }
    });
}

module.exports = {
    sendMail
}; 
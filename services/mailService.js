const nodemailer = require('nodemailer');
const logger = require('../helpers/logger');

class MailService {
    constructor() {
        this.transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.NODEMAILER_MAIL,
                pass: process.env.NODEMAILER_PASS
            }
        });
    }

    async sendMail(sender, receiver, subject, text) {
        try {
            const mailOptions = {
                from: sender,
                to: receiver,
                subject: subject,
                text: text
            };

            await this.transporter.sendMail(mailOptions);
            logger.info(`Email sent successfully to ${receiver}`);
        } catch (error) {
            logger.error('Email sending error:', error);
            throw error;
        }
    }

    async sendActivationEmail(email, token, url) {
        const subject = "Codebie Registration";
        const text = `Welcome to Codebie! Please click on this link http://${url}/token/${token} to activate your account. This link will expire after 10 minutes.`;
        await this.sendMail(process.env.NODEMAILER_MAIL, email, subject, text);
    }

    async sendPasswordResetEmail(email, token, url) {
        const subject = "Codebie Password Reset";
        const text = `Please click on this link http://${url}/resetpass/${token} to reset your password. This link will expire after 10 minutes.`;
        await this.sendMail(process.env.NODEMAILER_MAIL, email, subject, text);
    }

    async sendContactEmail(from, subject, message) {
        const text = `Name : ${from.name}\nEmail : ${from.email}\nSubject : ${subject}\nMessage : ${message}`;
        await this.sendMail(from.email, process.env.RECEIVER_MAIL, "Codebie Contact", text);
    }
}

module.exports = new MailService(); 
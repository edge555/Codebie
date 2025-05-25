const logger = require('../helpers/logger');
const mailService = require('../services/mailService');

class ContactController {
    getContactPage(req, res) {
        res.render('contactus', {
            curuser: req.user,
            error_msg: req.flash('error_msg'),
            success_msg: req.flash('success_msg')
        });
    }

    async handleContact(req, res) {
        try {
            const { username, useremail, usersubject, usermessage } = req.body;

            // Basic validation
            if (!username || !useremail || !usersubject || !usermessage) {
                req.flash('error_msg', 'All fields are required');
                return res.redirect('/contactus');
            }

            await mailService.sendContactEmail(
                {
                    name: username,
                    email: useremail
                },
                usersubject,
                usermessage
            );

            req.flash('success_msg', 'Message sent successfully! We will get back to you soon.');
            res.redirect('/contactus');
        } catch (error) {
            logger.error('Contact form error:', error);
            req.flash('error_msg', 'An error occurred while sending your message. Please try again later.');
            res.redirect('/contactus');
        }
    }
}

module.exports = new ContactController(); 
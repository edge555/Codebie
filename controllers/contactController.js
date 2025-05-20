const mailService = require('../helpers/mailService');

// Format contact message
const formatContactMessage = (contactData) => {
    return `Name: ${contactData.username}
Email: ${contactData.useremail}
Subject: ${contactData.usersubject}
Message: ${contactData.usermessage}`;
};

// Send contact email
const sendContactEmail = async (contactData) => {
    const subject = "Codebie Contact Form";
    const text = formatContactMessage(contactData);
    
    try {
        await mailService.sendMail(
            contactData.useremail,
            process.env.RECEIVER_MAIL,
            subject,
            text
        );
        return { success: true };
    } catch (error) {
        console.error('Error sending contact email:', error);
        return { 
            success: false, 
            error: 'Failed to send message. Please try again later.' 
        };
    }
};

module.exports = {
    sendContactEmail
}; 
const sgMail = require('@sendgrid/mail');
require("dotenv").config()


sgMail.setApiKey(process.env.SENDGRID_API_KEY);

async function sendEmail(to, subject, body) {
    const msg = {
        to,
        from: 'developer@saaracpl.com', // Replace with your sender email address
        subject,
        html: body,
    };

    try {
        await sgMail.send(msg);
        console.log('Email sent successfully');
        return true
    } catch (error) {
        console.error('Error sending email:', error);
        return false;
        
    }
}

module.exports = sendEmail ;
const nodemailer = require('nodemailer');

// Configure transporter
let transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.SENDER_EMAIL,
        pass: process.env.SENDER_PASSWORD, // Use an App Password if using Gmail
    }
});

// Setup email data
let mailOptions = {
    from: '"Your Name" <gov.nav.official@gmail.com>',
    to: 'priyanshusinghpanda2005@gmail.com',
    subject: 'Test Email from Node.js',
    text: 'Hello! This is a test email sent from Node.js.'
};

// Send email
transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
        return console.log('Error:', error);
    }
    console.log('Email sent:', info.response);
});

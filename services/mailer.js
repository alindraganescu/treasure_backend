const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'in-v3.mailjet.com',
  port: 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.USER_MAILJET,
    pass: process.env.PASSWORD_MAILJET,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

const sendEmail = async (to, subject, text, html) => {
  let info = await transporter.sendMail({
    from: 'Alin Draganescu" <alindraganescu@gmail.com>',
    to,
    subject,
    text,
    html,
    // to: 'alindraganescu@gmail.com, someone@something.com', // list of receivers
    // subject: 'Hello ✔', // Subject line
    // text: 'Hello world?', // plain text body
    // html: '<b>Hello world?</b>', // html body
  });
  return info;
};

module.exports = sendEmail;

require('dotenv').config();
const nodeMailer = require('nodemailer');
import BrevoEmailSender from './EmailService';

const sendEmail = async (body) => {
  const transporter = nodeMailer.createTransport({
    host: 'smtp-relay.brevo.com',
    port: 587,
    secure: false, 
    auth: {
      user: process.env.SMTP_Email, 
      pass: process.env.SMTP_KEY
    }
  });
  try {
    const info = await transporter.sendMail(body);
    return console.log(`Message sent: ${info.response}`);
  } catch (err) {
    return console.log(`Problem sending email: ${err}`);
  }
};

const sendBrevoEmail = async (mailOptions) => {
   const emailSender = new BrevoEmailSender(process.env.BREVA_API_KEY, {
    maxRetries: 3,
    retryDelay: 1000,
    batchSize: 10,
    validateEmails: true,
    logErrors: true
  });

  try {
    const result = await emailSender.sendEmail(mailOptions);
    if (result.success) {
      console.log(`Brevo Email sent successfully, Message ID: ${result.messageId}`);
      return result;
    } else {
      console.error(`Brevo Email failed to send after ${result.retryCount} attempts. Error: ${result.error}`);
      throw new Error(result.error);
    }
  } catch (error) {
    console.error('Unexpected error sending Brevo email:', error);
        throw new Error(error.message);
  }
}

export { sendEmail, sendBrevoEmail };

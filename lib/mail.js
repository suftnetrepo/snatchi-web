require('dotenv').config();
const nodeMailer = require('nodemailer');
const sendGrid = require('@sendgrid/mail');
const { logger } = require('../app/api/utils/logger');
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
  console.log('Sending Brevo email with options process.env.BREVA_API_KEY:', process.env.BREVA_API_KEY);
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
        throw new Error(result.error);
  }
}

const sendGridEmail = async (mailOptions) => {
  await sendGrid
    .send(mailOptions)
    .then((response) => {
      console.log(response[0].statusCode);
      console.log(response[0].headers);
    })
    .catch((error) => {
      logger.error(error);
    });
};

const sendGridMail = (mailOptions) => {
  switch (process.env.MAIL_PROVIDER) {
    case 'SEND_GRID':
      sendGridEmail(mailOptions);
      break;
    case 'NODE_MAILER':
      sendEmail(mailOptions);
      break;
    default:
      sendEmail(mailOptions);
      break;
  }
};

export { sendGridMail, sendGridEmail, sendEmail, sendBrevoEmail };

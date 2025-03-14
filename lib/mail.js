require('dotenv').config()
const nodeMailer = require('nodemailer')
const sendGrid = require('@sendgrid/mail')
const { logger } = require('../app/api/utils/logger')

sendGrid.setApiKey("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")

const sendEmail = async body => {
    const transporter = nodeMailer.createTransport({
        host: process.env.EMAIL_SERVER,
        port: process.env.EMAIL_SERVER_PORT,
        secure: false,
        requireTLS: false,
        auth: {
            user: process.env.USER_NAME,
            pass: process.env.PASSWORD
        }
    })
    try {
        const info = await transporter.sendMail(body)
        return console.log(`Message sent: ${info.response}`)
    } catch (err) {
        return console.log(`Problem sending email: ${err}`)
    }
}

const sendGridEmail = async mailOptions => {
    await sendGrid
        .send(mailOptions)
        .then(response => {
            console.log(response[0].statusCode)
            console.log(response[0].headers)
        })
        .catch(error => {
            logger.error(error)
        })
}

const sendGridMail = mailOptions => {
    switch (process.env.MAIL_PROVIDER) {
        case 'SEND_GRID':
            sendGridEmail(mailOptions)
            break
        case 'NODE_MAILER':
            sendEmail(mailOptions)
            break
        default:
            sendEmail(mailOptions)
            break
    }
}

export {
    sendGridMail,
    sendGridEmail,
    sendEmail
}

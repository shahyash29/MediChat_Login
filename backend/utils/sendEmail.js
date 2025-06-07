const { EmailClient } = require('@azure/communication-email');
require('dotenv').config();

const connectionString = process.env.EMAIL_CONNECTION_STRING;
const senderEmail = process.env.SENDER_EMAIL_ADDRESS;

if (!connectionString) throw new Error("EMAIL_CONNECTION_STRING is undefined.");
if (!senderEmail) throw new Error("SENDER_EMAIL_ADDRESS is undefined.");

const emailClient = new EmailClient(connectionString);

async function sendEmail(to, subject, text) {
  const message = {
    senderAddress: senderEmail,
    content: {
      subject,
      plainText: text,
    },
    recipients: {
      to: [{ address: to }],
    },
  };

  console.log('Attempting to send email to:', to);

  try {
    const poller = await emailClient.beginSend(message);
    const result = await poller.pollUntilDone();
    console.log('Email sent successfully. Message ID:', result.id);
    return result.id;
  } catch (err) {
    console.error('Error sending email:', err);
    throw err;
  }
}

module.exports = sendEmail;

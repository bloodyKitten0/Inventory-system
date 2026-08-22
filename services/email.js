require("dotenv").config();
const nodemailer = require("nodemailer");

const setupEmail = async () => {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: true,

    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 10000,

    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  });

  return transporter;
};

const sendVerificationEmail = async (email, rawToken) => {
  const transporter = await setupEmail();
  await transporter.verify();
  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to: email,
    subject: "Verify your Inventory System account",
    text: `The code is ${rawToken}`,
  });
};

module.exports = sendVerificationEmail;

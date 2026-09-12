require("dotenv").config();
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: process.env.SMTP_SECURE === "true",
  connectionTimeout: 10000,
  greetingTimeout: 10000,
  socketTimeout: 10000,
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD },
});

const sendVerificationEmail = async (email, rawToken) => {
  await transporter.verify();
  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to: email,
    subject: "Verify your Inventory System account",
    text: `Your verification token is: ${rawToken}`,
  });
};

module.exports = sendVerificationEmail;

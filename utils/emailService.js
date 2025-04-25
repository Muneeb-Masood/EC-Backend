const nodemailer = require("nodemailer");
require("dotenv").config();


const transporter = nodemailer.createTransport({
    host: "sandbox.smtp.mailtrap.io", 
    port: 2525,               
    auth: {
      user: "", 
      pass: "", 
    },
  });

const sendVerificationEmail = async (to, verificationLink) => {
    try {
        const mailOptions = {
            from: '',
            to,
            subject: "Verify Your Email",
            html: `
                <div style="font-family: Arial, sans-serif; text-align: center;">
                    <h2>Verify Your Email</h2>
                    <p>Click the button below to verify your email and activate your account:</p>
                    <a href="${verificationLink}" style="background-color: #28a745; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Verify Email</a>
                    <p>If you didn’t request this, you can ignore this email.</p>
                </div>
            `,
        };

        await transporter.sendMail(mailOptions);
        console.log("Verification email sent successfully");
    } catch (error) {
        console.error("Error sending email:", error);
    }
};

module.exports = sendVerificationEmail;

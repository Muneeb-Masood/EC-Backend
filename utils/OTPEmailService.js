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

const sendOTPEmail = async (to, otp) => {
    try {
        const mailOptions = {
            from: '',
            to,
            subject: "Verify Your Email",
            html: `
            <div style="font-family: Arial, sans-serif; text-align: center;">
                <h2>Your One-Time Password (OTP)</h2>
                <p>Use the OTP below to verify your email and activate your account:</p>
                <h3 style="background-color: #f4f4f4; display: inline-block; padding: 10px 20px; border-radius: 5px; font-size: 24px; font-weight: bold;">${otp}</h3>
                <p>This OTP is valid for only a short period. Do not share it with anyone.</p>
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

module.exports = sendOTPEmail;

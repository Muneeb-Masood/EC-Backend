const nodemailer = require("nodemailer");
require("dotenv").config();



const transporter = nodemailer.createTransport({
    service: "gmail",               
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS, 
    },
  });

const sendOTPEmail = async (to, otp) => {
    try {
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to,
            subject: "Login OTP for Your Account",
            html: `
            <div style="font-family: Arial, sans-serif; text-align: center;">
                <h2>Your One-Time Password (OTP) for Login</h2>
                <p>Use the OTP below to securely log in to your account:</p>
                <h3 style="background-color: #f4f4f4; display: inline-block; padding: 10px 20px; border-radius: 5px; font-size: 24px; font-weight: bold;">${otp}</h3>
                <p>This OTP is valid for only a short period and can only be used once.</p>
                <p>Do not share this OTP with anyone for security reasons.</p>
                <p>If you didn’t request this OTP, please ignore this email.</p>
                <br>
                <p>Thank you,</p>
            </div>
            `,
        };

        await transporter.sendMail(mailOptions);
        console.log("Verification email sent successfully");
    } catch (error) {
        console.log(process.env.EMAIL_USER, process.env.EMAIL_PASS)
        console.error("Error sending email:", error);
    }
};

module.exports = sendOTPEmail;

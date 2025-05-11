require('dotenv').config();

const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

exports.transferConfirmation = async (req, res) => {
  const { amount, walletAddress, toEmail } = req.body;

  if (!amount || !walletAddress || !toEmail) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const msg = {
    to: toEmail, 
    from: process.env.SENDGRID_FROM_EMAIL,
    subject: 'Thank You for Using Zentrons',
    text: `Thank you for using Zentrons! Your ${amount} ETH has been successfully transferred.`,
    html: `<strong>Thank you for using Zentrons! Your ${amount} ETH has been successfully transferred.</strong>`,
  };

  sgMail.send(msg)
    .then(() => {
        console.log('Muneeb Bhai');
      res.status(200).json({ message: 'Email sent successfully!' });
      console.log('Email sent successfully!');
    })
    .catch((error) => {
        console.log('Error sending email:', error);
      console.error(error);
      console.error('Detailed error:', error.response.body);  // Log the errors returned by SendGrid
      res.status(500).json({ error: 'Failed to send email' });
    });
};

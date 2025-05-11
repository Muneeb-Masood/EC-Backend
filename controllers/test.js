const sgMail = require('@sendgrid/mail')
sgMail.setApiKey(process.env.SENDGRID_API_KEY)
const msg = {
  to: 'muneebmasood789@gmail.com', 
  from: 'masood4508129@cloud.neduet.edu.pk',
  subject: 'Sending with SendGrid is Fun',
  text: 'and easy to do anywhere, even with Node.js',
  html: '<strong>and easy to do anywhere, even with Node.js</strong>',
}
sgMail.send(msg).then(() => {
    console.log('Email sent')
  })
  .catch((error) => {
    console.error(error)
  })

  export default msg;
const express = require("express");
const cors = require("cors");
const userRoutes = require('./routes/userRoutes');
const kycRoutes = require("./routes/kycRoutes");
const {approveKyc , rejectKyc , getKycRecords} = require('./controllers/kycControllerForAdmin');
const userRoutes = require('./loginRoutes.js/userRoutes')
const loginRoutes = require('./routes/loginRoutes')
// const kycRoutes = require('./routes/kycRoutes')
// const transactionRoutes = require('./routes/transactionRoutes')
require("dotenv").config();

const app = express();


app.use(cors());
app.use(express.json());

app.use('/api/auth', userRoutes)
app.use('/api/kyc' , kycRoutes);
app.use('/api/getKyc',getKycRecords);
app.use('/api/kyc/approve', approveKyc);
app.use('/api/kyc/reject', rejectKyc);
app.use("/api/login", loginRoutes);

// app.use('/api/kyc', kycRoutes)
// app.use('/api/kyc', transactionRoutes)


const server = app.listen(process.env.PORT_NUMBER, () => {
    console.log(`Server Started at ${process.env.PORT_NUMBER}`);
    
});
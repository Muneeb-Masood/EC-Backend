const express = require("express");
const cors = require("cors");
const userRoutes = require('./routes/userRoutes')
const authRoutes = require('./routes/authRoutes')
// const kycRoutes = require('./routes/kycRoutes')
const transactionRoutes = require('./routes/transactionRoutes')
require("dotenv").config();

const app = express();


app.use(cors());
app.use(express.json());

app.use('/api/auth', userRoutes)
app.use("/api/login", authRoutes);
// app.use('/api/kyc', kycRoutes)
app.use('/api', transactionRoutes)



const server = app.listen(process.env.PORT_NUMBER, () => {
    console.log(`Server Started at ${process.env.PORT_NUMBER}`);
    
});
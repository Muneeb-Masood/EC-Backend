const express = require("express");
const cors = require("cors");
const userRoutes = require('./routes/userRoutes')
// const kycRoutes = require('./routes/kycRoutes')
// const transactionRoutes = require('./routes/transactionRoutes')
require("dotenv").config();

// console.log(userRoutes)

const app = express();


app.use(cors());
app.use(express.json());

app.use('/api/auth', userRoutes)
// app.use('/api/kyc', kycRoutes)
// app.use('/api/kyc', transactionRoutes)


const server = app.listen(process.env.PORT, () => {
    console.log(`Server Started at ${process.env.PORT}`);
});
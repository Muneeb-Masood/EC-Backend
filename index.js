const express = require("express");
const cors = require("cors");
const userRoutes = require('./routes/userRoutes')
const kycRoutes = require("./routes/kycRoutes");
require("dotenv").config();

const app = express();


app.use(cors());
app.use(express.json());

app.use('/api/auth', userRoutes)
app.use('/api/kyc' , kycRoutes);

app.get("/api" , (req , res) => {
    res.json({
        message: "Welcome to EC-6th-Semster Backend API",
        postMessage: process.env.AWS_REGION
    })
})

const server = app.listen(process.env.PORT_NUMBER, () => {
    console.log(`Server Started at ${process.env.PORT_NUMBER}`);
    // console.log(process);
    // console.log(process.env.AWS_REGION);
});
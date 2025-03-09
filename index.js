const express = require("express");
const cors = require("cors");
const userRoutes = require('./routes/userRoutes')
const {kycRoutes} = require("./routes/kycRoutes");
require("dotenv").config();

const app = express();


app.use(cors());
app.use(express.json());

app.use('/api/auth', userRoutes)
app.use('api/kyc' , kycRoutes);

const server = app.listen(process.env.PORT, () => {
    console.log(`Server Started at ${process.env.PORT}`);
});
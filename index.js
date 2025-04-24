const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

const userRoutes = require('./routes/userRoutes');
const authRoutes = require('./routes/authRoutes');
const kycRoutes = require("./routes/kycRoutes");
const { approveKyc, rejectKyc, getKycRecords } = require('./controllers/kycControllerForAdmin');
const transactionRoutes = require('./routes/transactionRoutes');

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', userRoutes);
app.use("/api/login", authRoutes); 
app.use('/api/kyc', kycRoutes);
app.use('/api/getKyc', getKycRecords);
app.use('/api/kyc/approve', approveKyc);
app.use('/api/kyc/reject', rejectKyc);
app.use('/api', transactionRoutes);

const server = app.listen(process.env.PORT_NUMBER, () => {
    console.log(`Server Started at ${process.env.PORT_NUMBER}`);
});

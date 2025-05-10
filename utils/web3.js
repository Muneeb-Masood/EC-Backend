const { Web3 } = require("web3");
require("dotenv").config();

const web3 = new Web3(process.env.BLOCKCHAIN_URL);

web3.eth.getBlockNumber()
    .then(blockNumber => console.log(`Connected to blockchain. Latest Block: ${blockNumber}`))
    .catch(error => console.error("Error connecting to blockchain:", error));

module.exports = web3;

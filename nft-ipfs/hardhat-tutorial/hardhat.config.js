require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config({ path: ".env" });
 
 
const QUICKNODE_HTTP_URL = process.env.QUICKNODE_HTTP_URL;
const PRIVATE_KEY = process.env.PRIVATE_KEY;
 
 
module.exports = {
  solidity: "0.8.9",
  networks: {
    mumbai: {
      url: QUICKNODE_HTTP_URL,
      accounts: [PRIVATE_KEY],
    },
  },
};

// AW3Punks Contract Address: 0x072e1A35DE4d6c0FA710D9598763F615F18ce1F0
require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config({path: ".env"});

const ALCHEMY_API_KEY_URL = process.env.ALCHEMY_API_KEY_URL;
const GOERLI_PRIVATE_KEY = process.env.GOERLI_PRIVATE_KEY; 

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  deafultNetwork: "goerli", 
  solidity: "0.8.7",
  networks: {
    hardhat: {},
    goerli: {
      url: ALCHEMY_API_KEY_URL,
      accounts: [GOERLI_PRIVATE_KEY],
    },
  }, 
};

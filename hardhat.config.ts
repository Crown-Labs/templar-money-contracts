import dotenv from "dotenv";
import "hardhat-typechain";
import "@nomiclabs/hardhat-etherscan";
import "@nomiclabs/hardhat-waffle";
import "hardhat-gas-reporter";
import "solidity-coverage";

dotenv.config();

// const { PRIVATE_KEY, MNEMONIC } = import "./.env";

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
// task(
//   "accounts",
//   "Prints the list of accounts",
//   async (taskArgs, hre) => {
//     const accounts = await hre.ethers.getSigners();

//     for (const account of accounts) {
//       console.log(account.address);
//     }
//   }
// );

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  paths: {
    sources: "./contracts",
  },
  solidity: {
    compilers: [
      {
        version: "0.6.6",
        settings: {
          optimizer: {
            enabled: true,
          },
        },
      },
      {
        version: "0.8.6",
        settings: {
          optimizer: {
            enabled: true,
          },
        },
      },
      {
        version: "0.8.17",
        settings: {
          optimizer: {
            enabled: true,
          },
        },
      },
    ],
  },
  networks: {
    hardhat: {
      forking: {
        url: "https://bsc-dataseed2.binance.org",
      },
    },
    bsc: {
      url: "https://bsc-dataseed2.binance.org",
      chainId: 56,
      gasPrice: 3000000000,
    },
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY
  }, 
};

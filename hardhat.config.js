require("dotenv").config();

require("@nomiclabs/hardhat-etherscan");
require("@nomiclabs/hardhat-waffle");
require("hardhat-gas-reporter");
require("solidity-coverage");

const { PRIVATE_KEY, MNEMONIC } = require('./.env');

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  solidity: {
    compilers: [
      {
        version: "0.6.6",
        settings: {
          optimizer: {
            enabled: true
          }
         }
      },
      {
        version: "0.8.6",
        settings: {
          optimizer: {
            enabled: true
          }
         }
      },
    ]
  },
  networks: {
    hardhat: {
      forking: {
        url: "https://bsc.getblock.io/mainnet/?api_key=6cb196d6-25c9-4a9a-846b-e5308b92e4a9"
      }
    },
    ropsten: {
      url: process.env.ROPSTEN_URL || "",
      accounts: [`0x${PRIVATE_KEY}`]
    },
    bsc_testnet: {
      url: "https://data-seed-prebsc-1-s1.binance.org:8545",
      chainId: 97,
      gas: 2100000,
      gasPrice: 10000000000,
      accounts: [`0x${PRIVATE_KEY}`]
    },
    /*mainnet: {
      url: "https://bsc-dataseed.binance.org/",
      chainId: 56,
      gasPrice: 20000000000,
      accounts: {mnemonic: mnemonic}
    }*/
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: "USD",
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
  },
};

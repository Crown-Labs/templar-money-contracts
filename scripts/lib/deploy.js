const fs = require('fs');
const path = require('path');
const network = process.env.HARDHAT_NETWORK || process.env.DEFAULT_NETWORK;
const filePath = path.join(__dirname, '..', '..', `.addresses-${network}.json`);
const deployedAddress = readTmpAddresses();
console.log(filePath)

const contactAddress = {
  treasury: deployedAddress["Treasury"], 
  managerFund: deployedAddress["ManagerFund"],
  reserveFund: "0xEbe9da74D7d5dc5203776264E7610aE76D7c9f93",
  reserveOracle: "0xcBb98864Ef56E9042e7d2efef76141f15731B82f",
  tm: deployedAddress["TM"],
  busd: "0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56",
  usdt: "0x55d398326f99059fF775485246999027B3197955",
  usdc: "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d",
  dai: "0x1AF3F329e8BE154074D8769D1FFa4eE058B1DBc3",
  tem: "0x19e6BfC1A6e4B042Fb20531244D47E252445df01",
  wbnb: "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c",
  stableRouter: "0xb3f0c9ea1f05e312093fdb031e789a756659b0ac",
  universalRouter: "0x5Dc88340E1c5c6366864Ee415d6034cadd1A9897",
  permit2: "0x000000000022d473030f116ddee9f6b43ac78ba3",
  quoter2: "0x78D78E420Da98ad378D7799bE8f4AF69033EB077"
}

function getContractAddress(name) {
  const addr = contactAddress[name];
  if (!addr) {
    throw new Error("not found " + name + " address");
  }

  return addr;
}

async function deployContract(name, args, label, provider, options) {
    if (!label) { label = name }
    let contractFactory = await ethers.getContractFactory(name)
    if (provider) {
      contractFactory = contractFactory.connect(provider)
    }
  
    let contract
    if (options) {
      contract = await contractFactory.deploy(...args, options)
    } else {
      contract = await contractFactory.deploy(...args)
    }
    const argStr = args.map((i) => `"${i}"`).join(" ")
    console.info(`\n[Deploy ${name}] ${label}: ${contract.address} ${argStr}`)
    await contract.deployTransaction.wait()
    console.info("... Completed!")
  
    writeTmpAddresses({
      [label]: contract.address
    })
  
    return contract
  }

  async function contractAt(name, address, provider) {
    let contractFactory = await ethers.getContractFactory(name)
    if (provider) {
      contractFactory = contractFactory.connect(provider)
    }
    return await contractFactory.attach(address)
  }

  function getChainId(network) {
    /* if (network === "hardhat") {
      return 56;
    } */
    if (network === "bsc") {
      return 56;
    }
  
    throw new Error("Unsupported network");
  }
  
  async function getFrameSigner() {
    if (process.env.USE_FRAME_SIGNER == "true") {
       try {
         const frame = new ethers.providers.JsonRpcProvider("http://127.0.0.1:1248");
         const signer = frame.getSigner();
   
         if (getChainId(network) !== (await signer.getChainId())) {
           throw new Error("Incorrect frame network");
         }
   
         console.log("🖼️ FrameSigner ChainId:", await signer.getChainId());
         console.log(`signer: ${signer.address}`);
   
         return signer;
       } catch (e) {
         throw new Error(`getFrameSigner error: ${e.toString()}`);
       }
    } else {
       const [ signer ] = await hre.ethers.getSigners();
       console.log(`📝 use deployer from PRIVATE_KEY in .env`);
       console.log(`signer: ${signer.address}`);
       return signer;
    }
   }
  
  function readTmpAddresses() {
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath))
    }
    return {}
  }

  function writeTmpAddresses(json) {
    const tmpAddresses = Object.assign(readTmpAddresses(), json)
    fs.writeFileSync(filePath, JSON.stringify(tmpAddresses))
  }

  async function sendTxn(txnPromise, label) {
    const txn = await txnPromise;
    console.info(`Sending ${label}...`);
    await txn.wait();
    console.info(`... Sent! ${txn.hash}`);
    return txn;
  }

  module.exports = {
    getContractAddress,
    deployContract,
    contractAt,
    getFrameSigner,
    writeTmpAddresses,
    readTmpAddresses,
    sendTxn
  }
  
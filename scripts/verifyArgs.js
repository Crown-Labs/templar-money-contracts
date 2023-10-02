const { getContractAddress } = require("./lib/deploy");

const treasury = { address: getContractAddress("treasury") };
const tm = { address:  getContractAddress("tm") };
const busd = { address: getContractAddress("busd") };
const usdt = { address: getContractAddress("usdt") };
const usdc = { address: getContractAddress("usdc") };
const dai = { address: getContractAddress("dai") };
const tem = { address: getContractAddress("tem") };
const wbnb = { address: getContractAddress("wbnb") };
const stableRouter = { address: getContractAddress("stableRouter") };
const universalRouter = { address: getContractAddress("universalRouter") };
const permit2 = { address: getContractAddress("permit2") };
const quoter2 = { address: getContractAddress("quoter2") };

module.exports = [
  treasury.address, 
  tm.address, 
  busd.address,
  usdt.address,
  usdc.address,
  dai.address,
  tem.address,
  wbnb.address,
  stableRouter.address,
  universalRouter.address,
  permit2.address,
  quoter2.address
];
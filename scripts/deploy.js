const { deployContract, contractAt, getContractAddress, sendTxn, getFrameSigner } = require("./lib/deploy");

async function main() {
  const deployer = await getFrameSigner();

  const treasury = await contractAt("Treasury", getContractAddress("treasury"), deployer);
  const tm = await contractAt("TemplarMoney", getContractAddress("tm"), deployer);
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

  // deploy TemplarRouter
  const templarRouter = await deployContract("TemplarRouter", [
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
  ], "TemplarRouter", deployer);
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error)
    process.exit(1)
})
const { deployContract, contractAt, getContractAddress, sendTxn, getFrameSigner } = require("./lib/deploy");

async function main() {
  const deployer = await getFrameSigner();

  let treasury;
  const treasuryPrevious = await contractAt("Treasury", getContractAddress("treasury"), deployer);
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
  const reserveFund = { address: getContractAddress("reserveFund") };
  const reserveOracle = { address: getContractAddress("reserveOracle") };

  // Migrate Treasury
  const migrateTreasury = false;
  if (migrateTreasury) {
    const TREAUSRY_INTEREST = 5000;
    const worker = await treasuryPrevious.worker();
    const treasuryBalancePrevious = await treasuryPrevious.treasuryBalance();

    // deploy TemplarRouter
    treasury = await deployContract("Treasury", [
      tm.address,
      usdt.address,
      reserveFund.address,
      reserveOracle.address,
      treasuryBalancePrevious,
    ], "Treasury", deployer);

    await treasury.setInterest(TREAUSRY_INTEREST);
    await treasury.setWorker(worker);
  } else {
    treasury = treasuryPrevious;
  }

  // ManagerFund
  const deployManagerFund = false;
  if (deployManagerFund) {
    const vault = { address: "0xEA724deA000b5e5206d28f4BC2dAD5f2FA1fe788" };
    const targetRebalance = "20000000000000000000000";

    // deploy ManagerFund
    const managerFund = await deployContract("ManagerFund", [
      reserveFund.address,
      vault.address,
      usdt.address,
    ], "ManagerFund", deployer);

    await managerFund.setManager(deployer.address);
    await managerFund.setTargetReserveBalance(targetRebalance);
  }

  // TemplarRouter
  const deployTemplarRouter = true;
  if (deployTemplarRouter) {
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
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error)
    process.exit(1)
})
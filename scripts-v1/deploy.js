// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const hre = require("hardhat");

async function main() {
  // Hardhat always runs the compile task when running scripts with its command
  // line interface.
  //
  // If this script is run directly using `node` you may want to call compile
  // manually to make sure everything is compiled
  // await hre.run('compile');

  // Config
  const interest = 16560; // // APR 16.560% * 10**3

  const [deployer] = await ethers.getSigners();
  const account1 = "0x354d7E877B1C6F2baAE21FEEd36574Ae3356017b";
  const accountNot = "0xd37e5DA65B53E482e4bA5c770C69e9a2671B9812";
  const pancakeRouterAddress = "0x9ac64cc6e4415144c455bd8e4837fea55603e5c3";

  /*const ustAddress = "0xB4B57C624Ee507C352f1C4354Bfc1e0d4285B70a";
  const busdAddress = "0xd47f707598F7e5546575A429a84Fc324dabC17Fc";
  const usdtAddress = "0x94C0b116616bB7fa21C16F5717566127231D856B";
  const usdcAddress = "0x2dC5dAAb018f2E58c0912f8452Bb3604e300c3D0";
  const daiAddress = "0x6B2e58491c4Fee106f35615276082802056F94Ae";
  const mimAddress = "0x93461083DB23EEd641462f9e963920A06AC5a251";*/

  console.log("-----------------------------");
  console.log("block:", await getBlockNumber());
  console.log("deployer:", deployer.address);
  console.log("-----------------------------");

  // ------------------------------
  // Deploy
  // ------------------------------
  const ERC20Token = await ethers.getContractFactory('ERC20Token');
  const busd = await ERC20Token.deploy("BUSD", "BUSD", 18, toWei(10000000)); // mint 10M
  const ust = await ERC20Token.deploy("UST", "UST", 18, toWei(10000000)); // mint 10M
  const usdt = await ERC20Token.deploy("USDT", "USDT", 18, toWei(10000000)); // mint 10M
  const usdc = await ERC20Token.deploy("USDC", "USDC", 18, toWei(10000000)); // mint 10M
  const dai = await ERC20Token.deploy("DAI", "DAI", 18, toWei(10000000)); // mint 10M
  const mim = await ERC20Token.deploy("MIM", "MIM", 18, toWei(10000000)); // mint 10M
  /*const ust = ERC20Token.attach(ustAddress);
  const busd = ERC20Token.attach(busdAddress);
  const usdt = ERC20Token.attach(usdtAddress);
  const usdc = ERC20Token.attach(usdcAddress);
  const dai = ERC20Token.attach(daiAddress);
  const mim = ERC20Token.attach(mimAddress);*/

  console.log("BUSD:", busd.address);
  console.log("UST:", ust.address);
  console.log("USDT:", usdt.address);
  console.log("USDC:", usdc.address);
  console.log("DAI:", dai.address);
  console.log("MIM:", mim.address);

  const PancakeRouter = await ethers.getContractFactory('PancakeRouter');
  pancakeRouter = PancakeRouter.attach(pancakeRouterAddress);

  // add lp MIM-BUSD
  await busd.approve(pancakeRouter.address, toWei(1000000)); // 1M
  await mim.approve(pancakeRouter.address, toWei(1000000)); // 1M
  await pancakeRouter.addLiquidity(busd.address, mim.address, toWei(1000000), toWei(1000000), toWei(1000000), toWei(1000000), deployer.address, Date.now()+500);*/


  // Deploy MockupStableRouter
  const MockupStableRouter = await ethers.getContractFactory("MockupStableRouter");
  const stableRouter = await MockupStableRouter.deploy(ust.address, busd.address, usdt.address, usdc.address, dai.address);
  await stableRouter.deployed();
  console.log("[Mockup] stableRouter:", stableRouter.address);

  // deposite to stable swap
  await transfer("UST", ust, stableRouter.address, 1000000, false);
  await transfer("BUSD", busd, stableRouter.address, 1000000, false);
  await transfer("USDT", usdt, stableRouter.address, 1000000, false);
  await transfer("USDC", usdc, stableRouter.address, 1000000, false);
  await transfer("DAI", dai, stableRouter.address, 1000000, false);

  // Deploy MockupPriceFeed
  const MockupPriceFeed = await ethers.getContractFactory("MockupPriceFeed");
  const pricefeed = await MockupPriceFeed.deploy();
  await pricefeed.deployed();
  console.log("[Mockup] priceFeed:", pricefeed.address);

  // Deploy TM Token
  const TM = await ethers.getContractFactory("TemplarMoney");
  const tm = await TM.deploy();
  await tm.deployed();
  console.log("TM:", tm.address);

  // Deploy Reserve Fund
  const ReserveFund = await ethers.getContractFactory("ReserveFund");
  const reserveFund = await ReserveFund.deploy(); 
  await reserveFund.deployed();
  console.log("ReserveFund:", reserveFund.address);

  // Deploy Treasury
  const Treasury = await ethers.getContractFactory("Treasury");
  treasury = await Treasury.deploy(tm.address, ust.address, reserveFund.address, pricefeed.address); 
  await treasury.deployed();
  console.log("Treasury:", treasury.address);

  // Deploy TemplarRouter
  const TemplarRouter = await ethers.getContractFactory("TemplarRouter");
  router = await TemplarRouter.deploy(treasury.address, tm.address, ust.address, busd.address, usdt.address, usdc.address, dai.address, mim.address, stableRouter.address, pancakeRouter.address); 
  await router.deployed();
  console.log("TemplarRouter:", router.address);

  // Setup
  await tm.setTreasury(treasury.address);
  await reserveFund.addPool(treasury.address, ust.address);
  await treasury.setWorker(deployer.address);
  await treasury.setInterest(interest); 
  console.log("Set Interest: ", (interest / 10**3), "%");    

  // deposite to reserveFund 2M
  await transfer("UST", ust, reserveFund.address, 2000000, false);
  console.log("-----------------------------");

  await transfer("UST", ust, accountNot, 1000000, true);
  await transfer("BUSD", busd, accountNot, 1000000, true);
  await transfer("USDT", usdt, accountNot, 1000000, true);
  await transfer("USDC", usdc, accountNot, 1000000, true);
  await transfer("DAI", dai, accountNot, 1000000, true);

  await transfer("UST", ust, account1, 1000000, true);
  await transfer("BUSD", busd, account1, 1000000, true);
  await transfer("USDT", usdt, account1, 1000000, true);
  await transfer("USDC", usdc, account1, 1000000, true);
  await transfer("DAI", dai, account1, 1000000, true);
  
  console.log("-----------------------------");
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

function toETH(amount) {
  return ethers.utils.formatEther(amount);
}

function toWei(amount) {
  return ethers.utils.parseEther(amount + "");
}

async function transfer(symbol, token, to, amount, log) {
  if (log) {
    console.log("Transfer", amount, symbol, "to ", to);    
  }
  await token.transfer(to, toWei(amount)); 
}

async function getBlockNumber() {
  return await ethers.provider.getBlockNumber();
}
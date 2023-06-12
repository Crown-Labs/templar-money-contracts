// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const hre = require("hardhat");

let ust;
let busd;
let usdt;
let usdc;
let dai;
let mim;
let tm;
let reserveFund;
let managerFund;
let treasury;
let pancakeRouter;

async function main() {
  // Hardhat always runs the compile task when running scripts with its command
  // line interface.
  //
  // If this script is run directly using `node` you may want to call compile
  // manually to make sure everything is compiled
  // await hre.run('compile');

  // Config
  const interest = 16560; // // APR 16.560% * 10**3

  const account = "0x083B4acb59B0D102740cDA8de8f31cB603091043";
  const ustAddress = "0x23396cF899Ca06c4472205fC903bDB4de249D6fC";
  const busdAddress = "0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56";
  const usdtAddress = "0x55d398326f99059fF775485246999027B3197955";
  const usdcAddress = "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d";
  const daiAddress = "0x1AF3F329e8BE154074D8769D1FFa4eE058B1DBc3";
  const mimAddress = "0xfE19F0B51438fd612f6FD59C1dbB3eA319f433Ba";
  const pancakeRouterAddress = "0x10ED43C718714eb63d5aA57B78B54704E256024E";
  const terraFund = "0xe8ef8710e77dfb7a37b98e13fcc30f61350fd719000000000000000000000000";

  const [deployer, account2] = await ethers.getSigners();
  const account1 = await impersonateAddress(account);
  const accountFund1= await impersonateAddress("0x2D1bC07BB992F889cE3ef298C13F5d674459bA5b"); // 275k UST
  //const accountFund2 = await impersonateAddress("0xaDf3D808Dc0E361551F5C944041DB13fe53A8928"); // 980k BUSD
  //const accountFund3 = await impersonateAddress("0xa7e5732C37f398e6AD4174c4a339d6CeDE30D7aA"); // 990k USDT + 530k USDC
  const accountFund4 = await impersonateAddress("0x41772eDd47D9DDF9ef848cDB34fE76143908c7Ad"); // FTX Wallet: 200m BUSD, 335m USDT, 127m USDC, 18m DAI

  console.log("Deployer:", deployer.address);
  console.log('Block Number:', await getBlockNumber());
  console.log("-----------------------------");

  // ------------------------------
  // Deploy
  // ------------------------------
  console.log("Deploy...");

  const ERC20Token = await ethers.getContractFactory('ERC20Token');
  ust = ERC20Token.attach(ustAddress);
  busd = ERC20Token.attach(busdAddress);
  usdt = ERC20Token.attach(usdtAddress);
  usdc = ERC20Token.attach(usdcAddress);
  dai = ERC20Token.attach(daiAddress);
  mim = ERC20Token.attach(mimAddress);

  const PancakeRouter = await ethers.getContractFactory('PancakeRouter');
  pancakeRouter = PancakeRouter.attach(pancakeRouterAddress);

  // Deploy TM Token
  const TM = await ethers.getContractFactory("TemplarMoney");
  tm = await TM.deploy();
  await tm.deployed();
  console.log("TM:", tm.address);

  // Deploy Reserve Fund
  const ReserveFund = await ethers.getContractFactory("ReserveFund");
  reserveFund = await ReserveFund.deploy(); 
  await reserveFund.deployed();
  console.log("ReserveFund:", reserveFund.address);

  // Deploy Manager Fund
  const ManagerFund = await ethers.getContractFactory("ManagerFund");
  managerFund = await ManagerFund.deploy(reserveFund.address, terraFund, ust.address); 
  await managerFund.deployed();
  console.log("ManagerFund:", managerFund.address);

  // Deploy Treasury
  const Treasury = await ethers.getContractFactory("Treasury");
  treasury = await Treasury.deploy(tm.address, ust.address, reserveFund.address, "0xcbf8518F8727B8582B22837403cDabc53463D462"); 
  await treasury.deployed();
  console.log("Treasury:", treasury.address);

  // Deploy TemplarRouter
  const TemplarRouter = await ethers.getContractFactory("TemplarRouter");
  router = await TemplarRouter.deploy(treasury.address, tm.address, ust.address, busd.address, usdt.address, usdc.address, dai.address, mim.address, "0x99c92765EfC472a9709Ced86310D64C4573c4b77", "0x10ED43C718714eb63d5aA57B78B54704E256024E"); 
  await router.deployed();
  console.log("TemplarRouter:", router.address);

  // Setup
  await tm.setTreasury(treasury.address);

  await reserveFund.addPool(treasury.address, ust.address);
  await reserveFund.addPool(managerFund.address, ust.address);

  await managerFund.setTargetReserveBalance("10000000000000000000000"); // 10k
  await managerFund.setManager(account1.address); 

  await treasury.setWorker(deployer.address);
  await treasury.setInterest(interest); 

  console.log("Set Interest: ", (interest / 10**3), "%");    
  console.log("-----------------------------");

  // ------------------------------
  // Setup Wallet Balance
  // ------------------------------
  console.log("Setup Wallet Balance...");

  await logBalance(account1.address, false);

  //await ust.connect(accountFund1).transfer(account1.address, toWei(100000)); // 100k UST
  //await ust.connect(accountFund1).transfer(reserveFund.address, toWei(100000)); // 100k UST

  await ust.connect(accountFund1).transfer(account1.address, toWei(200000)); // 200k UST
  await busd.connect(accountFund4).transfer(account1.address, toWei(500000)); // 500k BUSD
  await usdt.connect(accountFund4).transfer(account1.address, toWei(100000)); // 100k USDT
  await usdc.connect(accountFund4).transfer(account1.address, toWei(100000)); // 100k USDC
  await dai.connect(accountFund4).transfer(account1.address, toWei(100000)); // 100k USDC

  // Swap 150k BUSD to 100k MIM (price impact 30%)
  await busd.connect(account1).approve(pancakeRouter.address, toWei(150000));
  await pancakeRouter.connect(account1).swapExactTokensForTokens(toWei(150000), 0, [busdAddress, mimAddress], account1.address, Date.now()+500);

  await logBalance(account1.address, true);

  // ------------------------------
  // Test
  // ------------------------------
  console.log("Test...");

  // Mint 100k TM
  await swap("1.", account1, "UST", "TM", ust, tm, 100000, 99);

  

  /*for (let i = 0; i < 10; i++) {
    const ustBalance = await ust.balanceOf(account1.address);
    await swap((i*2 + 1) + ".", account1, "UST", "TM", ust, tm, toETH(ustBalance));
    const tmBalance = await tm.balanceOf(account1.address);
    await swap((i*2 + 2) + ".", account1, "TM", "UST", tm, ust, toETH(tmBalance));
  }
  return;*/

  // Test all
  const symbolList = ["UST", "BUSD", "MIM", "TM", "USDT", "USDC", "DAI"];
  const tokenList = [ust, busd, mim, tm, usdt, usdc, dai];
  const amount = 10000;
  let no = 2;

  for (let i = 0; i < tokenList.length; i++) {
    for (let j = 0; j < tokenList.length; j++) {
      if (i == j) {
        continue;
      }
      await swap(no + ".", account1, symbolList[i], symbolList[j], tokenList[i], tokenList[j], amount, 99); // slippage 99%
      no++;
    }
  }

  await rebalance(account1, true);
}

async function swap(tag, account, symbolA, symbolB, tokenA, tokenB, amount, slippage = 1) {
  const amountOut = await router.connect(account).getAmountOut(tokenA.address, tokenB.address, toWei(amount));
  console.log(tag, "Swap ", amount, symbolA,"to", toETH(amountOut), symbolB);
  await tokenA.connect(account).approve(router.address, toWei(amount));
  await router.connect(account).swap(tokenA.address, tokenB.address, toWei(amount), toWei(minAmount(amount, slippage)));
  await logBalance(account.address, true);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

const impersonateAddress = async (address) => {
  const hre = require('hardhat');
  await hre.network.provider.request({
    method: 'hardhat_impersonateAccount',
    params: [address],
  });
  const signer = await ethers.provider.getSigner(address);
  signer.address = signer._address;
  return signer;
};

function toETH(amount) {
  return ethers.utils.formatEther(amount);
}

function toWei(amount) {
  return ethers.utils.parseEther(amount + "");
}

function minAmount(amount, slippage) {
  return amount * (1 - slippage / 100);
}

async function getBlockNumber() {
  return await ethers.provider.getBlockNumber();
}

async function rebalance(account, log) {
  const reserveBalance = await managerFund.reserveBalance();
  const rebalanceAmount = await managerFund.rebalanceAmount();

  await managerFund.connect(account).rebalance();

  if (log) {
    console.log("");
    console.log("-----------------------------");
    console.log("Rebalance block:", await getBlockNumber());
    console.log("-----------------------------");
    console.log("ReserveBalance:", toETH(reserveBalance));
    console.log("RebalanceAmount:", toETH(rebalanceAmount));
    console.log("[after] ReserveBalance:", toETH(await managerFund.reserveBalance()));
    console.log("-----------------------------");
  }
}

let tmBalanceLog = [];
let ustBalanceLog = [];
let busdBalanceLog = [];
let usdtBalanceLog = [];
let usdcBalanceLog = [];
let daiBalanceLog = [];
let mimBalanceLog = [];

async function logBalance(account, log) {
  const tmBalance = await tm.balanceOf(account);
  const ustBalance = await ust.balanceOf(account);
  const busdBalance = await busd.balanceOf(account);
  const usdtBalance = await usdt.balanceOf(account);
  const usdcBalance = await usdc.balanceOf(account);
  const daiBalance = await dai.balanceOf(account);
  const mimBalance = await mim.balanceOf(account);

  if (log) {
    console.log("");
    console.log("-----------------------------");
    console.log("account1:", account, "block:", await getBlockNumber());
    console.log("-----------------------------");
    console.log("TM Balance:", toETH(tmBalance), getBalanceChange(tmBalanceLog[account], tmBalance));
    console.log("UST Balance:", toETH(ustBalance), getBalanceChange(ustBalanceLog[account], ustBalance));
    console.log("BUSD Balance:", toETH(busdBalance), getBalanceChange(busdBalanceLog[account], busdBalance));
    console.log("USDT Balance:", toETH(usdtBalance), getBalanceChange(usdtBalanceLog[account], usdtBalance));
    console.log("USDC Balance:", toETH(usdcBalance), getBalanceChange(usdcBalanceLog[account], usdcBalance));
    console.log("DAI Balance:", toETH(daiBalance), getBalanceChange(daiBalanceLog[account], daiBalance));
    console.log("MIM Balance:", toETH(mimBalance), getBalanceChange(mimBalanceLog[account], mimBalance));
    console.log("-----------------------------");
  }

  tmBalanceLog[account] = tmBalance;
  ustBalanceLog[account] = ustBalance;
  busdBalanceLog[account] = busdBalance;
  usdtBalanceLog[account] = usdtBalance;
  usdcBalanceLog[account] = usdcBalance;
  daiBalanceLog[account] = daiBalance;
  mimBalanceLog[account] = mimBalance;  
}

function getBalanceChange(balance1, balance2) {
  diff = toETH(balance2) - toETH(balance1);
  if (diff == 0) {
    return "";
  }

  return "(" + (diff > 0 ? "+" : "") + diff + ")";
}
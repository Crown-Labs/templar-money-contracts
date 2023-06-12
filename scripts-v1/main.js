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
let tm;
let reserveFund;
let treasury;

async function main() {
  // Hardhat always runs the compile task when running scripts with its command
  // line interface.
  //
  // If this script is run directly using `node` you may want to call compile
  // manually to make sure everything is compiled
  // await hre.run('compile');

  // Config
  const interest = 16560; // // APR 16.560% * 10**3

  const account = "0xeE8d3BF5Ed2f390608AC8Ce87AB2B574c69dc717";
  const ustAddress = "0x23396cf899ca06c4472205fc903bdb4de249d6fc";
  const busdAddress = "0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56";
  const usdtAddress = "0x55d398326f99059fF775485246999027B3197955";
  const usdcAddress = "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d";

  const [deployer, account2] = await ethers.getSigners();
  const account1 = await impersonateAddress(account);
  const accountFund1= await impersonateAddress("0x2D1bC07BB992F889cE3ef298C13F5d674459bA5b"); // 275k UST
  const accountFund2 = await impersonateAddress("0xaDf3D808Dc0E361551F5C944041DB13fe53A8928"); // 980k BUSD
  const accountFund3 = await impersonateAddress("0xa7e5732C37f398e6AD4174c4a339d6CeDE30D7aA"); // 990k USDT + 530k USDC

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

  // Deploy Treasury
  const Treasury = await ethers.getContractFactory("Treasury");
  treasury = await Treasury.deploy(tm.address, ust.address, reserveFund.address, "0xcbf8518F8727B8582B22837403cDabc53463D462"); 
  await treasury.deployed();
  console.log("Treasury:", treasury.address);

  // Deploy ZapMint
  const ZapMint = await ethers.getContractFactory("ZapMint");
  zapMint = await ZapMint.deploy(treasury.address, tm.address, ust.address); 
  await zapMint.deployed();
  console.log("ZapMint:", zapMint.address);

  // Setup
  await tm.setTreasury(treasury.address);
  await reserveFund.addPool(treasury.address, ust.address);
  await treasury.setWorker(deployer.address);
  await treasury.setInterest(interest); 

  console.log("Set Interest: ", (interest / 10**3), "%");    
  console.log("-----------------------------");

  // ------------------------------
  // Setup Wallet Balance
  // ------------------------------
  console.log("Setup Wallet Balance...");

  await logBalance(account1.address, false);

  await ust.connect(accountFund1).transfer(account1.address, toWei(100000)); // 100k UST
  await busd.connect(accountFund2).transfer(account1.address, toWei(100000)); // 100k BUSD
  await usdt.connect(accountFund3).transfer(account1.address, toWei(100000)); // 100k USDT
  await usdc.connect(accountFund3).transfer(account1.address, toWei(100000)); // 100k USDC

  await logBalance(account1.address, true);

  // ------------------------------
  // Test
  // ------------------------------
  console.log("Test...");

  const slippage = 1; // 1%
  // mint
  const ustAmount = 20000;
  const busdAmount = 20000;
  const usdtAmount = 20000;
  const usdcAmount = 20000;
  // redeem
  const redeemAmount = 10000;

  console.log("1. ZapMint:", ustAmount, "UST");
  await ust.connect(account1).approve(zapMint.address, toWei(ustAmount));
  await zapMint.connect(account1).zapMint(ustAddress, toWei(ustAmount), toWei(minAmount(ustAmount, slippage)));
  await logBalance(account1.address, true);

  console.log("2. ZapMint:", busdAmount, "BUSD");
  await busd.connect(account1).approve(zapMint.address, toWei(busdAmount));
  await zapMint.connect(account1).zapMint(busdAddress, toWei(busdAmount), toWei(minAmount(busdAmount, slippage)));
  await logBalance(account1.address, true);

  console.log("3. ZapMint:", usdtAmount, "USDT");
  await usdt.connect(account1).approve(zapMint.address, toWei(usdtAmount));
  await zapMint.connect(account1).zapMint(usdtAddress, toWei(usdtAmount), toWei(minAmount(usdtAmount, slippage)));
  await logBalance(account1.address, true);

  console.log("4. ZapMint:", usdcAmount, "USDC");
  await usdc.connect(account1).approve(zapMint.address, toWei(usdcAmount));
  await zapMint.connect(account1).zapMint(usdcAddress, toWei(usdcAmount), toWei(minAmount(usdcAmount, slippage)));
  await logBalance(account1.address, true);

  console.log("5. ZapRedeem to UST:", redeemAmount, "TM");
  await tm.connect(account1).approve(zapMint.address, toWei(redeemAmount));
  await zapMint.connect(account1).zapRedeem(ustAddress, toWei(redeemAmount), toWei(minAmount(redeemAmount, slippage)));
  await logBalance(account1.address, true);

  console.log("6. ZapRedeem to BUSD:", redeemAmount, "TM");
  await tm.connect(account1).approve(zapMint.address, toWei(redeemAmount));
  await zapMint.connect(account1).zapRedeem(busdAddress, toWei(redeemAmount), toWei(minAmount(redeemAmount, slippage)));
  await logBalance(account1.address, true);

  console.log("7. ZapRedeem to USDT:", redeemAmount, "TM");
  await tm.connect(account1).approve(zapMint.address, toWei(redeemAmount));
  await zapMint.connect(account1).zapRedeem(usdtAddress, toWei(redeemAmount), toWei(minAmount(redeemAmount, slippage)));
  await logBalance(account1.address, true);

  console.log("8. ZapRedeem to USDC:", redeemAmount, "TM");
  await tm.connect(account1).approve(zapMint.address, toWei(redeemAmount));
  await zapMint.connect(account1).zapRedeem(usdcAddress, toWei(redeemAmount), toWei(minAmount(redeemAmount, slippage)));
  await logBalance(account1.address, true);

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

let tmBalanceLog = [];
let ustBalanceLog = [];
let busdBalanceLog = [];
let usdtBalanceLog = [];
let usdcBalanceLog = [];

async function logBalance(account, log) {
  const tmBalance = await tm.balanceOf(account);
  const ustBalance = await ust.balanceOf(account);
  const busdBalance = await busd.balanceOf(account);
  const usdtBalance = await usdt.balanceOf(account);
  const usdcBalance = await usdc.balanceOf(account);

  if (log) {
    console.log("");
    console.log("-----------------------------");
    console.log("account1:", account);
    console.log("-----------------------------");
    console.log("TM Balance:", toETH(tmBalance), getBalanceChange(tmBalanceLog[account], tmBalance));
    console.log("UST Balance:", toETH(ustBalance), getBalanceChange(ustBalanceLog[account], ustBalance));
    console.log("BUSD Balance:", toETH(busdBalance), getBalanceChange(busdBalanceLog[account], busdBalance));
    console.log("USDT Balance:", toETH(usdtBalance), getBalanceChange(usdtBalanceLog[account], usdtBalance));
    console.log("USDC Balance:", toETH(usdcBalance), getBalanceChange(usdcBalanceLog[account], usdcBalance));
    console.log("-----------------------------");
  }

  tmBalanceLog[account] = tmBalance;
  ustBalanceLog[account] = ustBalance;
  busdBalanceLog[account] = busdBalance;
  usdtBalanceLog[account] = usdtBalance;
  usdcBalanceLog[account] = usdcBalance;
}

function getBalanceChange(balance1, balance2) {
  diff = toETH(balance2) - toETH(balance1);
  if (diff == 0) {
    return "";
  }

  return "(" + (diff > 0 ? "+" : "") + diff + ")";
}
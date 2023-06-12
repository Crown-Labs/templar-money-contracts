// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const hre = require("hardhat");

let busd;
let usdt;
let usdc;
let dai;
let tm;
let reserveFund;
let router;
let pancakeRouter;

async function main() {
  // Hardhat always runs the compile task when running scripts with its command
  // line interface.
  //
  // If this script is run directly using `node` you may want to call compile
  // manually to make sure everything is compiled
  // await hre.run('compile');

  // Config
  //const interest = 16560; // // APR 16.560% * 10**3
  //const interest = 0; // // APR 0% * 10**3
  const interest = 500; // // APR 0.5% * 10**3
  
  // V1 Address
  const treasuryV1Address = "0x650E26fb02350509fd745e9f57f35927206D118a";
  const deployerV1Address = "0x8e762609CEa5Ddd3234B9d41Cf8D0d8b4f2581a6";
  const tmAddress = "0x194d1D62d8d798Fcc81A6435e6d13adF8bcC2966";
  const multisigAddress = "0xEA724deA000b5e5206d28f4BC2dAD5f2FA1fe788";

  const accountAddress = "0xeE8d3BF5Ed2f390608AC8Ce87AB2B574c69dc717";
  const busdAddress = "0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56";
  const usdtAddress = "0x55d398326f99059fF775485246999027B3197955";
  const usdcAddress = "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d";
  const daiAddress = "0x1AF3F329e8BE154074D8769D1FFa4eE058B1DBc3";
  const stableRouter = "0xb3f0c9ea1f05e312093fdb031e789a756659b0ac"; // "0x99c92765EfC472a9709Ced86310D64C4573c4b77"
  const pancakeRouterAddress = "0x10ED43C718714eb63d5aA57B78B54704E256024E";

  const [deployer, account2] = await ethers.getSigners();
  const deployerV1 = await impersonateAddress(deployerV1Address);
  const multisig = await impersonateAddress(multisigAddress);
  const account1 = await impersonateAddress(accountAddress);

  const accountFund2 = await impersonateAddress("0xaDf3D808Dc0E361551F5C944041DB13fe53A8928"); // 300k BUSD + 200k USDT

  console.log("Deployer:", deployer.address);
  console.log('Block Number:', await getBlockNumber());
  console.log("-----------------------------");

  // ------------------------------
  // Terminate Treasury V.1
  // ------------------------------
  console.log("Terminate Treasury V.1...");

  const TM = await ethers.getContractFactory('TemplarMoney');
  const tmV1 = TM.attach(tmAddress);
  const tmV1Supply = await tmV1.totalSupply();

  const TreasuryV1 = await ethers.getContractFactory('Treasury');
  const treasuryV1 = TreasuryV1.attach(treasuryV1Address);

  await treasuryV1.connect(deployerV1).setInterest(0);
  const treasuryV1Balance = await treasuryV1.treasuryBalance();

  console.log("snapshot Treasury V1 balance:", toETH(treasuryV1Balance));
  console.log("snapshot TM V1 supply:", toETH(tmV1Supply));
  console.log("-----------------------------");

  // ------------------------------
  // Deploy
  // ------------------------------
  console.log("Deploy...");

  const ERC20Token = await ethers.getContractFactory('ERC20Token');
  busd = ERC20Token.attach(busdAddress);
  usdt = ERC20Token.attach(usdtAddress);
  usdc = ERC20Token.attach(usdcAddress);
  dai = ERC20Token.attach(daiAddress);

  const PancakeRouter = await ethers.getContractFactory('PancakeRouter');
  pancakeRouter = PancakeRouter.attach(pancakeRouterAddress);

  // Deploy TM Token
  //const TM = await ethers.getContractFactory("TemplarMoney");
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
  treasury = await Treasury.deploy(tm.address, busd.address, reserveFund.address, "0xcBb98864Ef56E9042e7d2efef76141f15731B82f", treasuryV1Balance); 
  await treasury.deployed();
  console.log("Treasury:", treasury.address);

  // Deploy TemplarRouter
  const TemplarRouter = await ethers.getContractFactory("TemplarRouter");
  router = await TemplarRouter.deploy(treasury.address, tm.address, busd.address, usdt.address, usdc.address, dai.address, stableRouter); 
  await router.deployed();
  console.log("TemplarRouter:", router.address);

  // Setup
  await tm.setTreasury(deployer.address);
  await tm.mint(deployer.address, tmV1Supply);

  await tm.setTreasury(treasury.address);
  await reserveFund.addPool(treasury.address, busd.address);
  await treasury.setWorker(deployer.address);
  await treasury.setInterest(interest); 
  console.log("Set Interest: ", (interest / 10**3), "%");    

  // ------------------------------
  // Migrate Stat
  // ------------------------------
  console.log("-----------------------------");
  console.log("V1 Stat...");
  console.log("Treasury balance: ", toETH(await treasuryV1.treasuryBalance()));    
  console.log("Treasury reserveBalance: ", toETH(await treasuryV1.reserveBalance()));    
  console.log("TM supply: ", toETH(await tmV1.totalSupply()));    
  console.log("TM ratio: ", toETH(await treasuryV1.tmRatio()));    
  console.log("TM reservePrice: ", toETH(await treasuryV1.reservePrice()));    
  console.log("TM tmPrice: ", toETH(await treasuryV1.tmPrice()));    
  console.log("TM reservePrice: ", toETH(await treasuryV1.reservePrice()));    
  console.log("TM debtBalance: ", toETH(await treasuryV1.debtBalance()));    
  console.log("mint 1 UST =", toETH(await treasuryV1.reserveToTMAmount(toWei(1))), "TM"); 
  console.log("redeem 1 TM =", toETH(await treasuryV1.tmToReserveAmount(toWei(1))), "UST");    
  console.log("-----------------------------");

  console.log("V2 Stat...");
  console.log("Treasury balance: ", toETH(await treasury.treasuryBalance()));    
  console.log("Treasury reserveBalance: ", toETH(await treasury.reserveBalance()));    
  console.log("TM supply: ", toETH(await tm.totalSupply()));    
  console.log("TM ratio: ", toETH(await treasury.tmRatio()));    
  console.log("TM reservePrice: ", toETH(await treasury.reservePrice()));    
  console.log("TM tmPrice: ", toETH(await treasury.tmPrice()));    
  console.log("TM reservePrice: ", toETH(await treasury.reservePrice()));    
  console.log("TM debtBalance: ", toETH(await treasury.debtBalance()));    
  console.log("mint 1 BUSD =", toETH(await treasury.reserveToTMAmount(toWei(1))), "TM"); 
  console.log("1 TM =", toETH(await treasury.tmToReserveAmount(toWei(1))), "BUSD");    
  console.log("-----------------------------");

  // ------------------------------
  // Setup Wallet Balance
  // ------------------------------
  console.log("Setup Wallet Balance...");

  await logBalance(account1.address, false);

  await busd.connect(accountFund2).transfer(reserveFund.address, toWei(100000)); // 100k BUSD
  await busd.connect(accountFund2).transfer(account1.address, toWei(200000)); // 200k BUSD
  await usdt.connect(accountFund2).transfer(account1.address, toWei(100000)); // 100k USDT
  await tm.transfer(account1.address, toWei(100000)); // 100k TM
  
  // Swap 50k BUSD to USDC, DAI
  await busd.connect(account1).approve(pancakeRouter.address, toWei(100000));
  await pancakeRouter.connect(account1).swapExactTokensForTokens(toWei(50000), 0, [busdAddress, usdcAddress], account1.address, Date.now()+500);
  await pancakeRouter.connect(account1).swapExactTokensForTokens(toWei(50000), 0, [busdAddress, daiAddress], account1.address, Date.now()+500);

  await logBalance(account1.address, true);

  // ------------------------------
  // Test
  // ------------------------------
  console.log("Test...");

  // init TM
  //await swap("1.", account1, "BUSD", "TM", busd, tm, 50000, 99); // slippage 99%
  
  // Test all
  const symbolList = ["BUSD", "TM", "USDC", "DAI" ];
  const tokenList = [busd, tm, usdc, dai ];
  const amount = 10000;
  let no = 1;

  for (let i = 0; i < tokenList.length; i++) {
    for (let j = 0; j < tokenList.length; j++) {
      if (i == j) {
        continue;
      }
      await swap(no + ".", account1, symbolList[i], symbolList[j], tokenList[i], tokenList[j], amount, 99); // slippage 99%
      no++;
    }
  } 

  // ------------------------------
  // Stat
  // ------------------------------
  console.log("V2 Stat...");
  console.log('Block Number:', await getBlockNumber());
  console.log("Treasury balance: ", toETH(await treasury.treasuryBalance()));    
  console.log("Treasury reserveBalance: ", toETH(await treasury.reserveBalance()));    
  console.log("TM supply: ", toETH(await tm.totalSupply()));    
  console.log("TM ratio: ", toETH(await treasury.tmRatio()));    
  console.log("TM reservePrice: ", toETH(await treasury.reservePrice()));    
  console.log("TM tmPrice: ", toETH(await treasury.tmPrice()));    
  console.log("TM reservePrice: ", toETH(await treasury.reservePrice()));    
  console.log("TM debtBalance: ", toETH(await treasury.debtBalance()));    
  console.log("mint 1 BUSD =", toETH(await treasury.reserveToTMAmount(toWei(1))), "TM"); 
  console.log("1 TM =", toETH(await treasury.tmToReserveAmount(toWei(1))), "BUSD");    
  console.log("-----------------------------");

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

let tmBalanceLog = [];
let busdBalanceLog = [];
let usdtBalanceLog = [];
let usdcBalanceLog = [];
let daiBalanceLog = [];
let treasuryBalanceLog = [];

async function logBalance(account, log) {
  const tmBalance = await tm.balanceOf(account);
  const busdBalance = await busd.balanceOf(account);
  const usdtBalance = await usdt.balanceOf(account);
  const usdcBalance = await usdc.balanceOf(account);
  const daiBalance = await dai.balanceOf(account);
  const treasuryBalance = await treasury.treasuryBalance();

  if (log) {
    console.log("");
    console.log("-----------------------------");
    console.log("account1:", account, "block:", await getBlockNumber());
    console.log("-----------------------------");
    console.log("TM Balance:", toETH(tmBalance), getBalanceChange(tmBalanceLog[account], tmBalance));
    console.log("BUSD Balance:", toETH(busdBalance), getBalanceChange(busdBalanceLog[account], busdBalance));
    console.log("USDT Balance:", toETH(usdtBalance), getBalanceChange(usdtBalanceLog[account], usdtBalance));
    console.log("USDC Balance:", toETH(usdcBalance), getBalanceChange(usdcBalanceLog[account], usdcBalance));
    console.log("DAI Balance:", toETH(daiBalance), getBalanceChange(daiBalanceLog[account], daiBalance));
    console.log("-----------------------------");
    console.log("Treasury Balance: ", toETH(treasuryBalance), getBalanceChange(treasuryBalanceLog[account], treasuryBalance));
    console.log("-----------------------------");
  }

  tmBalanceLog[account] = tmBalance;
  busdBalanceLog[account] = busdBalance;
  usdtBalanceLog[account] = usdtBalance;
  usdcBalanceLog[account] = usdcBalance;
  daiBalanceLog[account] = daiBalance;
  treasuryBalanceLog[account] = treasuryBalance;
}

function getBalanceChange(balance1, balance2) {
  diff = toETH(balance2) - toETH(balance1);
  if (diff == 0) {
    return "";
  }

  return "(" + (diff > 0 ? "+" : "") + diff + ")";
}

function sleep(milliseconds) {
  const date = Date.now();
  let currentDate = null;
  do {
    currentDate = Date.now();
  } while (currentDate - date < milliseconds);
}
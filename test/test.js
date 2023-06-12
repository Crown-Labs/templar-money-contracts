const { expect } = require("chai");
const { ethers } = require("hardhat");

let ust;
let tm;
let reserveFund;
let treasury;
let currentBlock = 0;

describe("Mint TM", function () {
  it("Test Mint TM", async function () {
    console.log("-----------------------------");
    const [deployer, account2] = await ethers.getSigners();
    console.log("account1 (Deployer):", deployer.address);
    console.log("account2:", account2.address);

    // ------------------------------
    // Deploy
    // ------------------------------

    // Deploy Dummy UST
    const ERC20Token = await ethers.getContractFactory("ERC20Token");
    ust = await ERC20Token.deploy("Terra USD Token", "UST", 18, "1200000000000000000000000"); //Mint 1.2M UST
    await ust.deployed();
    console.log("UST:", ust.address);

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
    const Treasury = await ethers.getContractFactory("TreasuryTest");
    treasury = await Treasury.deploy(tm.address, ust.address, reserveFund.address, "0xcbf8518F8727B8582B22837403cDabc53463D462"); 
    await treasury.deployed();
    console.log("Treasury:", treasury.address);

    // ------------------------------
    // Setup
    // ------------------------------
    await tm.setTreasury(treasury.address);
    await reserveFund.addPool(treasury.address, ust.address);
    await treasury.setWorker(deployer.address);
    
    const interest = 16560; // // APR 16.560% * 10**3
    //await treasury.setInterest(20000); // APR 18.240% * 10**3
    await treasury.setInterest(interest); 
    console.log("Set Interest: ", ( interest/ 10**3), "%");    

    // deposit reserve 1M UST
    await ust.transfer(reserveFund.address, "1000000000000000000000000");
    // transfer to account2 100k UST
    await ust.transfer(account2.address, "100000000000000000000000");

    console.log("-----------------------------");    

    // ------------------------------
    // Test
    // ------------------------------
    const blockPerYear = (await treasury.blockPerYear()).toNumber();
    const blockPerDay = blockPerYear / 365;

    await treasuryLog(currentBlock, treasury);
    await treasury.setBlockNumber(currentBlock); 
    
    // 1. Mint 100k TM
    console.log("#1 - Mint 100k TM by account1:", deployer.address);
    await mint(deployer, "100000000000000000000000")
    await treasuryLog(currentBlock, treasury);

    // burn 100 TM
    console.log("#X - account1: Burn 100 TM");
    await tm.burn("100000000000000000000");
    console.log("");

    // 2. Wait
    console.log("#2 - wait 365 days...");
    while (true) {
      await treasury.setBlockNumber(currentBlock);
      // auto compound
      await treasury.compound(); 
      if (currentBlock == blockPerYear) {
        break;
      }
      currentBlock = currentBlock + blockPerDay;
    }
    await treasuryLog(currentBlock, treasury);

    // 3. Mint 100k TM
    console.log("#3 - Mint 100k TM more by account2:",  account2.address);
    await mint(account2, "100000000000000000000000")
    await treasuryLog(currentBlock, treasury);

    // 4. Wait
    console.log("#4 - wait 365days... (total 730 days)");
    while (true) {
      await treasury.setBlockNumber(currentBlock);
      // auto compound
      await treasury.compound(); 
      if (currentBlock == blockPerYear * 2) {
        break;
      }
      currentBlock = currentBlock + blockPerDay;
    }
    await treasuryLog(currentBlock, treasury);

    // 5. Redeem
    console.log("5. Redeem All TM by account1:", deployer.address);
    await redeem(deployer, (await tm.balanceOf(deployer.address)).toString());
    await treasuryLog(currentBlock, treasury);

    // 6. Redeem
    console.log("6. Redeem All TM by account2:", account2.address);
    await redeem(account2, (await tm.balanceOf(account2.address)).toString());
    await treasuryLog(currentBlock, treasury);

    // 7. Mint 100k TM
    /*console.log("#7 - Mint 100k TM more by account2:",  account2.address);
    await mint(account2, "100000000000000000000000")
    await treasuryLog(currentBlock, treasury);*/

  });
});

async function mint(account, ustAmount) {
  console.log("Mint " + toETH(ustAmount) + " TM");
  await ust.connect(account).approve(treasury.address, ustAmount);
  await treasury.connect(account).mint(ustAmount);

  console.log("TM Balance:", toETH(await tm.balanceOf(account.address)));
  console.log("UST Balance:", toETH(await ust.balanceOf(account.address)));
}

async function redeem(account, tmAmount) {
  console.log("Redeem " + toETH(tmAmount) + " TM");
  await tm.connect(account).approve(treasury.address, tmAmount);
  await treasury.connect(account).redeem(tmAmount);

  console.log("TM Balance:", toETH(await tm.balanceOf(account.address)));
  console.log("UST Balance:", toETH(await ust.balanceOf(account.address)));
}

async function treasuryLog(block, treasury) {

  console.log("");
  console.log("-----------------------------");
  console.log("Log Treasury Block:", block);
  console.log("-----------------------------");

  console.log("UST Price:", toETH(await treasury.reservePrice()));
  console.log("TM Price:", toETH(await treasury.tmPrice()));
  console.log("TM Ratio:", toETH(await treasury.tmRatio()));
  console.log("Interest Per Block:", toETH(await treasury.interestPerBlock()));
  console.log("Last Block:", (await treasury.lastBlock()).toNumber());
  console.log("Current Block:", (await treasury.blockNumber()).toNumber());

  //console.log("Reserve Balance:", toETH(await treasury.reserveBalance()));
  console.log("Treasury Balance:", toETH(await treasury.treasuryBalance()));
  //console.log("Debt Balance:", toETH(await treasury.debtBalance()));

  //console.log("tmToReserveAmount:", toETH(await treasury.tmToReserveAmount("100000000000000000000000")));
  //console.log("100k UST To TM Amount:", toETH(await treasury.reserveToTMAmount("100000000000000000000000")));

  console.log("-----------------------------");
  console.log("");
}

function toETH(amount) {
  return ethers.utils.formatEther(amount);
}

async function getBlockNumber() {
  return await ethers.provider.getBlockNumber();
}
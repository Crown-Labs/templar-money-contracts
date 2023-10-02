import { ethers, network } from "hardhat";
import { Erc20, Treasury } from "../typechain";
import { TemplarRouter } from "../typechain";
import { TransactionReceipt } from "@ethersproject/abstract-provider";

import {
  MAX_UINT,
  FOO_ADDRESS,
  TEM_ADDRESS,
  ROUTER_ADDRESS,
  TREASURY_ADDRESS,
  TM_ADDRESS,
  BUSD_ADDRESS,
  USDC_ADDRESS,
  WBNB_ADDRESS,
  USDT_ADDRESS,
  STABLE_ROUTER_ADDRESS,
  DAI_ADDRESS,
  BAR_ADDRESS,
  BHOT_ADDRESS,
  PERMITV2_ADDRESS,
  QUOTER2_ADDRESS,
} from "./shared/constant";
import { parseEvents, EVENT } from "./shared/parseEvents";

import { abi as TOKEN_ABI } from "./shared/abis/ERC20.json";
import QuoterV2 from "./shared/abis/QuoterV2.json";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { parseEther, parseUnits } from "ethers/lib/utils";
import { expect } from "chai";
import { BigNumber } from "ethers";
import { calculateMinimumOutput } from "./shared";

describe("Templar Router", () => {
  let foo: SignerWithAddress;
  let bar: SignerWithAddress;
  let bhot: SignerWithAddress;
  let treasury: Treasury;
  let templarRouter: TemplarRouter;
  let tmContract: Erc20;
  let temContract: Erc20;
  let busdContract: Erc20;
  let daiContract: Erc20;
  let usdtContract: Erc20;
  let usdcContract: Erc20;
  let quoterV2: any;

  beforeEach(async () => {
    foo = await ethers.getSigner(FOO_ADDRESS);
    bar = await ethers.getSigner(BAR_ADDRESS);
    bhot = await ethers.getSigner(BHOT_ADDRESS);

    temContract = new ethers.Contract(
      TEM_ADDRESS,
      TOKEN_ABI,
      foo
    ) as Erc20;

    busdContract = new ethers.Contract(
      BUSD_ADDRESS,
      TOKEN_ABI,
      foo
    ) as Erc20;

    daiContract = new ethers.Contract(
      DAI_ADDRESS,
      TOKEN_ABI,
      foo
    ) as Erc20;

    tmContract = new ethers.Contract(
      TM_ADDRESS,
      TOKEN_ABI,
      foo
    ) as Erc20;

    usdtContract = new ethers.Contract(
      USDT_ADDRESS,
      TOKEN_ABI,
      foo
    ) as Erc20;

    usdcContract = new ethers.Contract(
      USDC_ADDRESS,
      TOKEN_ABI,
      foo
    ) as Erc20;

    quoterV2 = new ethers.Contract(
      "0x78D78E420Da98ad378D7799bE8f4AF69033EB077",
      QuoterV2,
      foo
    ) as Erc20;

    await network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [FOO_ADDRESS],
    });

    await network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [BAR_ADDRESS],
    });
    await network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [BHOT_ADDRESS],
    });

    const Treasury = await ethers.getContractFactory("Treasury");
    treasury = Treasury.attach(TREASURY_ADDRESS) as Treasury;

    // await treasury.connect(bar).setMintPause(false);

    const router = await ethers.getContractFactory("TemplarRouter");
    templarRouter = (await router
      .connect(foo)
      .deploy(
        TREASURY_ADDRESS,
        TM_ADDRESS,
        BUSD_ADDRESS,
        USDT_ADDRESS,
        USDC_ADDRESS,
        DAI_ADDRESS,
        TEM_ADDRESS,
        WBNB_ADDRESS,
        STABLE_ROUTER_ADDRESS,
        ROUTER_ADDRESS,
        PERMITV2_ADDRESS,
        QUOTER2_ADDRESS
      )) as TemplarRouter;

    // approve tokens
    await busdContract
      .connect(foo)
      ["approve(address,uint256)"](templarRouter.address, MAX_UINT);
    await temContract
      .connect(foo)
      ["approve(address,uint256)"](templarRouter.address, MAX_UINT);
    await usdtContract
      .connect(foo)
      ["approve(address,uint256)"](templarRouter.address, MAX_UINT);
    await daiContract
      .connect(foo)
      ["approve(address,uint256)"](templarRouter.address, MAX_UINT);
    await tmContract
      .connect(foo)
      ["approve(address,uint256)"](templarRouter.address, MAX_UINT);

    // Transfer DAI token
    await daiContract
      .connect(bhot)
      ["transfer(address,uint256)"](foo.address, parseEther("1000"));
  });

  describe("TemplarRouter getAmountOut", () => {
    it("TM --> TEM", async () => {
      const amountIn = parseEther("1");
      const amountOut = await templarRouter
        .connect(bhot)
        .callStatic["getAmountOut(address,address,uint256)"](
          TM_ADDRESS,
          TEM_ADDRESS,
          amountIn
        );
      let amountOut1 = await templarRouter.callStatic.swap(
        TM_ADDRESS,
        TEM_ADDRESS,
        amountIn,
        0
      );
      expect(amountOut).to.be.equal(amountOut1);
    });

    it("TEM --> TM", async () => {
      const amountIn = parseUnits("1", "gwei");
      const amountOut = await templarRouter
        .connect(bhot)
        .callStatic["getAmountOut(address,address,uint256)"](
          TEM_ADDRESS,
          TM_ADDRESS,

          amountIn
        );
      let amountOut1 = await templarRouter.callStatic.swap(
        TEM_ADDRESS,
        TM_ADDRESS,
        amountIn,
        0
      );
      expect(amountOut).to.be.equal(amountOut1);
    });

    it("BUSD --> TEM", async () => {
      const amountIn = parseEther("1");
      const amountOut = await templarRouter
        .connect(bhot)
        .callStatic["getAmountOut(address,address,uint256)"](
          BUSD_ADDRESS,
          TEM_ADDRESS,
          amountIn
        );
      let amountOut1 = await templarRouter.callStatic.swap(
        BUSD_ADDRESS,
        TEM_ADDRESS,
        amountIn,
        0
      );
      expect(amountOut).to.be.equal(amountOut1);
    });

    it("BUSD --> TM", async () => {
      const amountIn = parseEther("1");
      const amountOut = await templarRouter
        .connect(bhot)
        .callStatic["getAmountOut(address,address,uint256)"](
          BUSD_ADDRESS,
          TM_ADDRESS,
          amountIn
        );
      let amountOut1 = await templarRouter.callStatic.swap(
        BUSD_ADDRESS,
        TM_ADDRESS,
        amountIn,
        0
      );
      expect(amountOut).to.be.equal(amountOut1);
    });

    it("BUSD --> DAI", async () => {
      const amountIn = parseEther("1");
      const amountOut = await templarRouter
        .connect(bhot)
        .callStatic["getAmountOut(address,address,uint256)"](
          BUSD_ADDRESS,
          DAI_ADDRESS,
          amountIn
        );
      let amountOut1 = await templarRouter.callStatic.swap(
        BUSD_ADDRESS,
        DAI_ADDRESS,
        amountIn,
        0
      );
      expect(amountOut).to.be.equal(amountOut1);
    });

    it("TEM --> BUSD", async () => {
      const amountIn = parseUnits("1", "gwei");
      const amountOut = await templarRouter
        .connect(bhot)
        .callStatic["getAmountOut(address,address,uint256)"](
          TEM_ADDRESS,
          BUSD_ADDRESS,
          amountIn
        );
      let amountOut1 = await templarRouter.callStatic.swap(
        TEM_ADDRESS,
        BUSD_ADDRESS,
        amountIn,
        0
      );
      expect(amountOut).to.be.equal(amountOut1);
    });

    it("TEM --> DAI", async () => {
      const amountIn = parseUnits("1", "gwei");
      const amountOut = await templarRouter
        .connect(bhot)
        .callStatic["getAmountOut(address,address,uint256)"](
          TEM_ADDRESS,
          DAI_ADDRESS,
          amountIn
        );
      let amountOut1 = await templarRouter.callStatic.swap(
        TEM_ADDRESS,
        DAI_ADDRESS,
        amountIn,
        0
      );
      expect(amountOut).to.be.equal(amountOut1);
    });

    it("DAI --> TEM", async () => {
      const amountIn = parseUnits("1", "ether");
      const amountOut = await templarRouter
        .connect(bhot)
        .callStatic["getAmountOut(address,address,uint256)"](
          DAI_ADDRESS,
          TEM_ADDRESS,
          amountIn
        );
      let amountOut1 = await templarRouter.callStatic.swap(
        DAI_ADDRESS,
        TEM_ADDRESS,
        amountIn,
        0
      );
      expect(amountOut).to.be.equal(amountOut1);
    });
  });

  describe("TemplarRouter swap token", () => {
    it("reverts for dai amount exceeds balance", async function () {
      await expect(
        templarRouter["swap(address,address,uint256,uint256)"](
          DAI_ADDRESS,
          BUSD_ADDRESS,
          parseEther("1000000"),
          0
        )
      ).to.be.reverted;
    });

    it("completes a trade for BUSD --> DAI", async function () {
      const amountIn = parseEther("100");
      const amountOutMin = parseEther("99");
      const {
        busdBalanceAfter,
        busdBalanceBefore,
        daiBalanceAfter,
        daiBalanceBefore,
      } = await executeRouter(
        BUSD_ADDRESS,
        DAI_ADDRESS,
        amountIn,
        amountOutMin
      );
      expect(busdBalanceBefore.sub(amountIn)).to.eq(busdBalanceAfter);
      expect(daiBalanceAfter.sub(daiBalanceBefore)).to.be.gte(
        amountOutMin
      );
    });

    it("completes a trade for BUSD ---> DAI, DAI --> TEM", async function () {
      const amountIn = parseEther("10");
      const amountOutMin = parseEther("0");
      await executeRouter(
        BUSD_ADDRESS,
        DAI_ADDRESS,
        parseEther("20"),
        amountOutMin
      );
      const { temBalanceAfter, temBalanceBefore } =
        await executeRouter(
          DAI_ADDRESS,
          TEM_ADDRESS,
          amountIn,
          amountOutMin
        );
      expect(temBalanceAfter.sub(temBalanceBefore)).to.be.gte(
        amountOutMin
      );
    });

    it("completes a trade for TEM --> BUSD", async function () {
      const amountIn = parseUnits("10", 9);
      const amountOutMin = parseEther("14");
      const {
        busdBalanceAfter,
        busdBalanceBefore,
        temBalanceAfter,
        temBalanceBefore,
      } = await executeRouter(
        TEM_ADDRESS,
        BUSD_ADDRESS,
        amountIn,
        amountOutMin
      );
      expect(temBalanceBefore.sub(amountIn)).to.eq(temBalanceAfter);
      expect(busdBalanceAfter.sub(busdBalanceBefore)).to.be.gte(
        amountOutMin
      );
    });

    // must have the two amount out min for TEM --> BUSD and BUSD --> USDT
    it("completes a trade for TEM --> USDT", async function () {
      const amountIn = parseUnits("10", 9);
      const amountOutMin = parseEther("0");
      const {
        usdtBalanceAfter,
        usdtBalanceBefore,
        temBalanceAfter,
        temBalanceBefore,
      } = await executeRouter(
        TEM_ADDRESS,
        USDC_ADDRESS,
        amountIn,
        amountOutMin
      );
      expect(temBalanceBefore.sub(amountIn)).to.eq(temBalanceAfter);
      expect(usdtBalanceAfter.sub(usdtBalanceBefore)).to.be.gte(
        amountOutMin
      );
    });

    it("completes a trade for BUSD --> TM", async function () {
      const amountIn = parseEther("10");
      let minAmountOut = await templarRouter.callStatic.swap(
        BUSD_ADDRESS,
        TM_ADDRESS,
        amountIn,
        0
      );
      minAmountOut = calculateMinimumOutput(minAmountOut, 1);
      const {
        busdBalanceAfter,
        busdBalanceBefore,
        tmBalanceAfter,
        tmBalanceBefore,
      } = await executeRouter(
        BUSD_ADDRESS,
        TM_ADDRESS,
        amountIn,
        minAmountOut
      );
      expect(busdBalanceBefore.sub(amountIn)).to.eq(busdBalanceAfter);
      expect(tmBalanceAfter.sub(tmBalanceBefore)).to.be.gte(
        minAmountOut
      );
    });

    it("completes a trade for TM --> BUSD", async function () {
      const amountIn = parseEther("10");
      let minAmountOut = await templarRouter.callStatic.swap(
        TM_ADDRESS,
        BUSD_ADDRESS,
        amountIn,
        0
      );
      minAmountOut = calculateMinimumOutput(minAmountOut, 1);
      const {
        tmBalanceAfter,
        tmBalanceBefore,
        busdBalanceAfter,
        busdBalanceBefore,
      } = await executeRouter(
        TM_ADDRESS,
        BUSD_ADDRESS,
        amountIn,
        minAmountOut
      );
      expect(tmBalanceBefore.sub(amountIn)).to.eq(tmBalanceAfter);
      expect(busdBalanceAfter.sub(busdBalanceBefore)).to.be.gte(
        minAmountOut
      );
    });

    it("stable swap completes a trade for BUSD --> USDT", async function () {
      const amountIn = parseEther("10");
      const amountOutMin = parseEther("9");
      const {
        busdBalanceAfter,
        busdBalanceBefore,
        usdtBalanceAfter,
        usdtBalanceBefore,
      } = await executeRouter(
        BUSD_ADDRESS,
        USDT_ADDRESS,
        amountIn,
        amountOutMin
      );
      expect(busdBalanceBefore.sub(amountIn)).to.eq(busdBalanceAfter);
      expect(usdtBalanceAfter.sub(usdtBalanceBefore)).to.be.gte(
        amountOutMin
      );
    });

    it("complete get amount out with slippage 1% and swap BUSD --> TEM", async () => {
      const amountIn = parseEther("10");
      let minAmountOut = await templarRouter.callStatic.swap(
        BUSD_ADDRESS,
        TEM_ADDRESS,
        amountIn,
        0
      );
      minAmountOut = calculateMinimumOutput(minAmountOut, 1);
      const { temBalanceAfter, temBalanceBefore } =
        await executeRouter(
          BUSD_ADDRESS,
          TEM_ADDRESS,
          amountIn,
          minAmountOut
        );
      expect(temBalanceAfter.sub(temBalanceBefore)).to.gte(
        minAmountOut
      );
    });

    it("complete get amount out with slippage 1% and swap TM --> TEM", async () => {
      const amountIn = parseEther("10");
      let minAmountOut = await templarRouter.callStatic.swap(
        TM_ADDRESS,
        TEM_ADDRESS,
        amountIn,
        0
      );
      minAmountOut = calculateMinimumOutput(minAmountOut, 1);
      const { temBalanceAfter, temBalanceBefore, swapEventArgs } =
        await executeRouter(
          TM_ADDRESS,
          TEM_ADDRESS,
          amountIn,
          minAmountOut
        );
      const { _amountIn, _amountOut } = swapEventArgs;
      expect(temBalanceAfter.sub(temBalanceBefore)).to.gte(
        minAmountOut
      );
      expect(_amountIn).to.eq(amountIn);
      expect(_amountOut).to.eq(temBalanceAfter.sub(temBalanceBefore));
    });

    it("complete get amount out and swap BUSD --> DAI, DAI --> TM", async () => {
      const amountIn = parseEther("10");
      let minAmountOut = await templarRouter.callStatic.swap(
        BUSD_ADDRESS,
        DAI_ADDRESS,
        amountIn,
        0
      );
      minAmountOut = calculateMinimumOutput(minAmountOut, 1);
      const { daiBalanceAfter, daiBalanceBefore, swapEventArgs } =
        await executeRouter(
          BUSD_ADDRESS,
          DAI_ADDRESS,
          amountIn,
          minAmountOut
        );
      const { _amountIn, _amountOut } = swapEventArgs;
      expect(daiBalanceAfter.sub(daiBalanceBefore)).to.gte(
        minAmountOut
      );
      expect(_amountIn).to.eq(amountIn);
      expect(_amountOut).to.eq(daiBalanceAfter.sub(daiBalanceBefore));
      // DAI --> TM
      let minAmountOutTM = await templarRouter.callStatic.swap(
        DAI_ADDRESS,
        TM_ADDRESS,
        daiBalanceAfter,
        0
      );
      minAmountOutTM = calculateMinimumOutput(minAmountOutTM, 1);
      const { tmBalanceAfter, tmBalanceBefore } = await executeRouter(
        DAI_ADDRESS,
        TM_ADDRESS,
        daiBalanceAfter,
        minAmountOutTM
      );
      expect(tmBalanceAfter.sub(tmBalanceBefore)).to.gte(
        minAmountOutTM
      );
    });
  });

  type SwapEventArgs = {
    _amountIn: BigNumber;
    _amountOut: BigNumber;
    _minAmountOut: BigNumber;
  };

  type ExecutionParams = {
    bnbBalanceBefore: BigNumber;
    busdBalanceBefore: BigNumber;
    daiBalanceBefore: BigNumber;
    temBalanceBefore: BigNumber;
    usdcBalanceBefore: BigNumber;
    usdtBalanceBefore: BigNumber;
    tmBalanceBefore: BigNumber;
    bnbBalanceAfter: BigNumber;
    busdBalanceAfter: BigNumber;
    daiBalanceAfter: BigNumber;
    temBalanceAfter: BigNumber;
    usdcBalanceAfter: BigNumber;
    usdtBalanceAfter: BigNumber;
    tmBalanceAfter: BigNumber;
    swapEventArgs: SwapEventArgs;
    receipt: TransactionReceipt;
    gasSpent: BigNumber;
  };
  async function executeRouter(
    tokenA: string,
    tokenB: string,
    value: BigNumber,
    minAmount: BigNumber
  ): Promise<ExecutionParams> {
    const bnbBalanceBefore: BigNumber =
      await ethers.provider.getBalance(foo.address);
    const busdBalanceBefore: BigNumber = await busdContract.balanceOf(
      foo.address
    );
    const daiBalanceBefore: BigNumber = await daiContract.balanceOf(
      foo.address
    );
    const usdcBalanceBefore: BigNumber = await usdcContract.balanceOf(
      foo.address
    );
    const tmBalanceBefore: BigNumber = await tmContract.balanceOf(
      foo.address
    );
    const temBalanceBefore: BigNumber = await temContract.balanceOf(
      foo.address
    );
    const usdtBalanceBefore: BigNumber = await usdtContract.balanceOf(
      foo.address
    );

    const receipt = await (
      await templarRouter
        .connect(foo)
        ["swap(address,address,uint256,uint256)"](
          tokenA,
          tokenB,
          value,
          minAmount
        )
    ).wait();
    const gasSpent = receipt.gasUsed.mul(receipt.effectiveGasPrice);

    const swapEventArgs = parseEvents(EVENT, receipt)[0]
      ?.args as unknown as SwapEventArgs;

    const bnbBalanceAfter: BigNumber =
      await ethers.provider.getBalance(foo.address);
    const busdBalanceAfter: BigNumber = await busdContract.balanceOf(
      foo.address
    );
    const daiBalanceAfter: BigNumber = await daiContract.balanceOf(
      foo.address
    );
    const usdcBalanceAfter: BigNumber = await usdcContract.balanceOf(
      foo.address
    );
    const tmBalanceAfter: BigNumber = await tmContract.balanceOf(
      foo.address
    );
    const temBalanceAfter: BigNumber = await temContract.balanceOf(
      foo.address
    );
    const usdtBalanceAfter: BigNumber = await usdtContract.balanceOf(
      foo.address
    );

    return {
      bnbBalanceBefore,
      busdBalanceBefore,
      daiBalanceBefore,
      temBalanceBefore,
      usdcBalanceBefore,
      usdtBalanceBefore,
      tmBalanceBefore,
      bnbBalanceAfter,
      busdBalanceAfter,
      daiBalanceAfter,
      temBalanceAfter,
      usdcBalanceAfter,
      usdtBalanceAfter,
      tmBalanceAfter,
      swapEventArgs,
      receipt,
      gasSpent,
    };
  }
});

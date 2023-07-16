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
} from "./shared/constant";
import { parseEvents, EVENT } from "./shared/parseEvents";

import { abi as TOKEN_ABI } from "./shared/abis/ERC20.json";
import QuoterV2 from "./shared/abis/QuoterV2.json";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { parseEther, parseUnits } from "ethers/lib/utils";
import { expect } from "chai";
import { BigNumber } from "ethers";
import {
  calculateMinimumOutput,
  expandTo18DecimalsBN,
} from "./shared";

describe("Templar Router", () => {
  let foo: SignerWithAddress;
  let bar: SignerWithAddress;

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
        ROUTER_ADDRESS
      )) as TemplarRouter;

    await templarRouter.addUniTokenWhitelist([
      BUSD_ADDRESS,
      TEM_ADDRESS,
    ]);

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
  });

  describe("UniswapV3 swaptoken", () => {
    it("reverts for dai amount exceeds balance", async function () {
      await expect(
        templarRouter["swap(address,address,uint256,uint256)"](
          DAI_ADDRESS,
          BUSD_ADDRESS,
          parseEther("100"),
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

    it("completes a trade for BUSD --> TM", async function () {
      const amountIn = parseEther("10");
      const amountOutMin = parseEther("8.9");

      const {
        busdBalanceAfter,
        busdBalanceBefore,
        tmBalanceAfter,
        tmBalanceBefore,
      } = await executeRouter(
        BUSD_ADDRESS,
        TM_ADDRESS,
        amountIn,
        amountOutMin
      );

      expect(busdBalanceBefore.sub(amountIn)).to.eq(busdBalanceAfter);
      expect(tmBalanceAfter.sub(tmBalanceBefore)).to.be.gte(
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

    it("complete get amount out and swap BUSD --> TEM", async () => {
      const amountIn = parseEther("10");

      const amountOut = await templarRouter.callStatic.swap(
        BUSD_ADDRESS,
        TEM_ADDRESS,
        amountIn,
        0
      );

      const { temBalanceAfter, temBalanceBefore } =
        await executeRouter(
          BUSD_ADDRESS,
          TEM_ADDRESS,
          amountIn,
          amountOut
        );
      expect(amountOut).to.eq(temBalanceAfter.sub(temBalanceBefore));
    });

    it("complete get amount out and swap TM --> TEM", async () => {
      const amountIn = parseEther("10");

      const amountOut = await templarRouter.callStatic.swap(
        TM_ADDRESS,
        TEM_ADDRESS,
        amountIn,
        0
      );

      const { temBalanceAfter, temBalanceBefore, swapEventArgs } =
        await executeRouter(
          TM_ADDRESS,
          TEM_ADDRESS,
          amountIn,
          amountOut
        );

      const { _amountIn, _amountOut } = swapEventArgs;
      expect(temBalanceAfter.sub(temBalanceBefore)).to.gte(amountOut);

      expect(_amountIn).to.eq(amountIn);
      expect(_amountOut).to.eq(amountOut);
    });

    it("complete get amount out and swap BUSD --> DAI, DAI --> TM", async () => {
      const amountIn = parseEther("10");

      const amountOut = await templarRouter.callStatic.swap(
        BUSD_ADDRESS,
        DAI_ADDRESS,
        amountIn,
        0
      );

      const { daiBalanceAfter, daiBalanceBefore, swapEventArgs } =
        await executeRouter(
          BUSD_ADDRESS,
          DAI_ADDRESS,
          amountIn,
          amountOut
        );

      const { _amountIn, _amountOut } = swapEventArgs;
      expect(daiBalanceAfter.sub(daiBalanceBefore)).to.gte(amountOut);

      expect(_amountIn).to.eq(amountIn);
      expect(_amountOut).to.eq(amountOut);

      // DAI --> TM
      const amountOutTM = await templarRouter.callStatic.swap(
        DAI_ADDRESS,
        TM_ADDRESS,
        daiBalanceAfter,
        0
      );

      const { tmBalanceAfter, tmBalanceBefore } = await executeRouter(
        BUSD_ADDRESS,
        TM_ADDRESS,
        daiBalanceAfter,
        amountOutTM
      );

      expect(tmBalanceAfter.sub(tmBalanceBefore)).to.gte(amountOutTM);
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

import { ethers, network } from "hardhat";
import { Erc20 } from "../typechain";
import { TemplarRouter } from "../typechain";
import { IPermitV2 } from "../typechain/IPermitV2";

import {
  MAX_UINT,
  MAX_UINT160,
  DEADLINE,
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
  PERMITV2_ADDRESS,
} from "./shared/constant";

import { abi as TOKEN_ABI } from "./shared/abis/ERC20.json";
import PERMITV2_ABI from "./shared/abis/PermitV2.json";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { parseEther } from "ethers/lib/utils";
import { expect } from "chai";

describe("UniversalRouter", () => {
  let foo: SignerWithAddress;
  let templarRouter: TemplarRouter;
  let permitv2: IPermitV2;
  let temContract: Erc20;
  let busdContract: Erc20;
  let daiContract: Erc20;

  beforeEach(async () => {
    foo = await ethers.getSigner(FOO_ADDRESS);

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

    permitv2 = new ethers.Contract(
      PERMITV2_ADDRESS,
      PERMITV2_ABI,
      foo
    ) as IPermitV2;

    await network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [FOO_ADDRESS],
    });

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

    await busdContract
      .connect(foo)
      ["approve(address,uint256)"](templarRouter.address, MAX_UINT);
  });

  it("[testSwap] completes a trade for BUSD --> WBNB --> TEM", async function () {
    const balanceBefore = await temContract.balanceOf(
      templarRouter.address
    );
    await templarRouter["testSwap(uint256,address,address)"](
      parseEther("100"),
      BUSD_ADDRESS,
      TEM_ADDRESS
    );

    let balanceAfter = await temContract.balanceOf(
      templarRouter.address
    );

    // console.log("balanceAfter", balanceAfter.sub(balanceBefore));
    expect(balanceAfter.sub(balanceBefore)).to.be.gt(0);
  });

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
    //  await daiContract["approve(address,uint256)"](
    //    templarRouter.address,
    //    MAX_UINT
    //  );
    const balanceBefore = await daiContract.balanceOf(foo.address);

    await templarRouter["swap(address,address,uint256,uint256)"](
      BUSD_ADDRESS,
      DAI_ADDRESS,
      parseEther("100"),
      0
    );

    const balanceAfter = await daiContract.balanceOf(foo.address);
    // console.log("balanceAfter", balanceAfter.sub(balanceBefore));
    expect(balanceAfter.sub(balanceBefore)).to.be.gt(0);
  });

  it("completes a trade for BUSD --> DAI", async function () {
    //  await daiContract["approve(address,uint256)"](
    //    templarRouter.address,
    //    MAX_UINT
    //  );
    const balanceBefore = await daiContract.balanceOf(foo.address);

    await templarRouter["swap(address,address,uint256,uint256)"](
      BUSD_ADDRESS,
      DAI_ADDRESS,
      parseEther("100"),
      0
    );

    const balanceAfter = await daiContract.balanceOf(foo.address);
    // console.log("balanceAfter", balanceAfter.sub(balanceBefore));
    expect(balanceAfter.sub(balanceBefore)).to.be.gt(0);
  });
});
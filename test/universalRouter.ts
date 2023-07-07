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

describe("UniversalRouter", () => {
  let foo: SignerWithAddress;
  let templarRouter: TemplarRouter;
  let permitv2: IPermitV2;
  let temContract: Erc20;
  let busdContract: Erc20;

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

    permitv2 = new ethers.Contract(
      PERMITV2_ADDRESS,
      PERMITV2_ABI,
      foo
    ) as IPermitV2;

    await network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [FOO_ADDRESS],
    });

    let beforeSwap = await temContract.balanceOf(foo.address);
    console.log("After swap :>> ", beforeSwap);

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

    await busdContract
      .connect(foo)
      ["approve(address,uint256)"](templarRouter.address, MAX_UINT);

    // await busdContract
    //   .connect(foo)
    //   ["approve(address,uint256)"](PERMITV2_ADDRESS, MAX_UINT);

    // await permitv2
    //   .connect(foo)
    //   ["approve(address,address,uint160,uint48)"](
    //     BUSD_ADDRESS,
    //     ROUTER_ADDRESS,
    //     MAX_UINT160,
    //     DEADLINE
    //   );
  });

  // it("complete approvel to router", async () => {
  //   // allowance[ownerAddress][tokenAddress][spenderAddress]
  //   const b = await permitv2["allowance(address,address,address)"](
  //     foo.address,
  //     BUSD_ADDRESS,
  //     ROUTER_ADDRESS
  //   );
  //   console.log(b);
  // });

  it("completes a trade for BUSD --> WBNB --> TEM", async function () {
    console.log("test");
    await templarRouter["testSwap(uint256)"](parseEther("100"));

    let temAmount = await temContract.balanceOf(foo.address);
    console.log("After swap :>> ", temAmount);

    // const b = await permitv2["allowance(address,address,address)"](
    //   foo.address,
    //   BUSD_ADDRESS,
    //   ROUTER_ADDRESS
    // );
    // console.log("after testSwap called >> ", b);
  });
});

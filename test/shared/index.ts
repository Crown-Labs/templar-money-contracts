import { BigNumber } from "ethers";
import bn from "bignumber.js";

export function expandTo18DecimalsBN(n: number): BigNumber {
  // use bn intermediately to allow decimals in intermediate calculations
  return BigNumber.from(
    new bn(n).times(new bn(10).pow(18)).toFixed()
  );
}

// Input amount without slippage
// Slippage percentage
export function calculateMinimumOutput(
  inputAmount: BigNumber,
  slippagePercentage: number
): BigNumber {
  const slippageAmount: BigNumber = inputAmount
    .mul(slippagePercentage)
    .div(100);
  return inputAmount.sub(slippageAmount);
}

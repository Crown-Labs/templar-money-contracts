export function calculateMinimumOutput(
  expectedAmountOut: number,
  slippageTolerance: number
): number {
  return expectedAmountOut * (1 - slippageTolerance);
}

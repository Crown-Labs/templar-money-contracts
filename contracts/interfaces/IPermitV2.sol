// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.6;

interface IPermitV2 {
  /// @notice Shared errors between signature based transfers and allowance based transfers.

  /// @notice Thrown when validating an inputted signature that is stale
  /// @param signatureDeadline The timestamp at which a signature is no longer valid
  error SignatureExpired(uint256 signatureDeadline);

  /// @notice Thrown when validating that the inputted nonce has not been used
  error InvalidNonce();

  function approve(
    address token,
    address spender,
    uint160 amount,
    uint48 expiration
  ) external;
}

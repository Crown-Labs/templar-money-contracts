// SPDX-License-Identifier: AGPL-3.0-or-later
pragma solidity 0.8.6;
import "hardhat/console.sol";

import { IUniversalRouter } from "./interfaces/IUniversalRouter.sol";
import { IPermitV2 } from "./interfaces/IPermitV2.sol";
import { Commands } from "./libraries/Commands.sol";

import "@uniswap/v3-periphery/contracts/interfaces/ISwapRouter.sol";

import "hardhat/console.sol";

// CAUTION
// This version of SafeMath should only be used with Solidity 0.8 or later,
// because it relies on the compiler's built in overflow checks.

/**
 * @dev Wrappers over Solidity's arithmetic operations.
 *
 * NOTE: `SafeMath` is no longer needed starting with Solidity 0.8. The compiler
 * now has built in overflow checking.
 */
library SafeMath {
  /**
   * @dev Returns the addition of two unsigned integers, with an overflow flag.
   *
   * _Available since v3.4._
   */
  function tryAdd(uint256 a, uint256 b)
    internal
    pure
    returns (bool, uint256)
  {
    unchecked {
      uint256 c = a + b;
      if (c < a) return (false, 0);
      return (true, c);
    }
  }

  /**
   * @dev Returns the substraction of two unsigned integers, with an overflow flag.
   *
   * _Available since v3.4._
   */
  function trySub(uint256 a, uint256 b)
    internal
    pure
    returns (bool, uint256)
  {
    unchecked {
      if (b > a) return (false, 0);
      return (true, a - b);
    }
  }

  /**
   * @dev Returns the multiplication of two unsigned integers, with an overflow flag.
   *
   * _Available since v3.4._
   */
  function tryMul(uint256 a, uint256 b)
    internal
    pure
    returns (bool, uint256)
  {
    unchecked {
      // Gas optimization: this is cheaper than requiring 'a' not being zero, but the
      // benefit is lost if 'b' is also tested.
      // See: https://github.com/OpenZeppelin/openzeppelin-contracts/pull/522
      if (a == 0) return (true, 0);
      uint256 c = a * b;
      if (c / a != b) return (false, 0);
      return (true, c);
    }
  }

  /**
   * @dev Returns the division of two unsigned integers, with a division by zero flag.
   *
   * _Available since v3.4._
   */
  function tryDiv(uint256 a, uint256 b)
    internal
    pure
    returns (bool, uint256)
  {
    unchecked {
      if (b == 0) return (false, 0);
      return (true, a / b);
    }
  }

  /**
   * @dev Returns the remainder of dividing two unsigned integers, with a division by zero flag.
   *
   * _Available since v3.4._
   */
  function tryMod(uint256 a, uint256 b)
    internal
    pure
    returns (bool, uint256)
  {
    unchecked {
      if (b == 0) return (false, 0);
      return (true, a % b);
    }
  }

  /**
   * @dev Returns the addition of two unsigned integers, reverting on
   * overflow.
   *
   * Counterpart to Solidity's `+` operator.
   *
   * Requirements:
   *
   * - Addition cannot overflow.
   */
  function add(uint256 a, uint256 b) internal pure returns (uint256) {
    return a + b;
  }

  /**
   * @dev Returns the subtraction of two unsigned integers, reverting on
   * overflow (when the result is negative).
   *
   * Counterpart to Solidity's `-` operator.
   *
   * Requirements:
   *
   * - Subtraction cannot overflow.
   */
  function sub(uint256 a, uint256 b) internal pure returns (uint256) {
    return a - b;
  }

  /**
   * @dev Returns the multiplication of two unsigned integers, reverting on
   * overflow.
   *
   * Counterpart to Solidity's `*` operator.
   *
   * Requirements:
   *
   * - Multiplication cannot overflow.
   */
  function mul(uint256 a, uint256 b) internal pure returns (uint256) {
    return a * b;
  }

  /**
   * @dev Returns the integer division of two unsigned integers, reverting on
   * division by zero. The result is rounded towards zero.
   *
   * Counterpart to Solidity's `/` operator.
   *
   * Requirements:
   *
   * - The divisor cannot be zero.
   */
  function div(uint256 a, uint256 b) internal pure returns (uint256) {
    return a / b;
  }

  /**
   * @dev Returns the remainder of dividing two unsigned integers. (unsigned integer modulo),
   * reverting when dividing by zero.
   *
   * Counterpart to Solidity's `%` operator. This function uses a `revert`
   * opcode (which leaves remaining gas untouched) while Solidity uses an
   * invalid opcode to revert (consuming all remaining gas).
   *
   * Requirements:
   *
   * - The divisor cannot be zero.
   */
  function mod(uint256 a, uint256 b) internal pure returns (uint256) {
    return a % b;
  }

  /**
   * @dev Returns the subtraction of two unsigned integers, reverting with custom message on
   * overflow (when the result is negative).
   *
   * CAUTION: This function is deprecated because it requires allocating memory for the error
   * message unnecessarily. For custom revert reasons use {trySub}.
   *
   * Counterpart to Solidity's `-` operator.
   *
   * Requirements:
   *
   * - Subtraction cannot overflow.
   */
  function sub(
    uint256 a,
    uint256 b,
    string memory errorMessage
  ) internal pure returns (uint256) {
    unchecked {
      require(b <= a, errorMessage);
      return a - b;
    }
  }

  /**
   * @dev Returns the integer division of two unsigned integers, reverting with custom message on
   * division by zero. The result is rounded towards zero.
   *
   * Counterpart to Solidity's `%` operator. This function uses a `revert`
   * opcode (which leaves remaining gas untouched) while Solidity uses an
   * invalid opcode to revert (consuming all remaining gas).
   *
   * Counterpart to Solidity's `/` operator. Note: this function uses a
   * `revert` opcode (which leaves remaining gas untouched) while Solidity
   * uses an invalid opcode to revert (consuming all remaining gas).
   *
   * Requirements:
   *
   * - The divisor cannot be zero.
   */
  function div(
    uint256 a,
    uint256 b,
    string memory errorMessage
  ) internal pure returns (uint256) {
    unchecked {
      require(b > 0, errorMessage);
      return a / b;
    }
  }

  /**
   * @dev Returns the remainder of dividing two unsigned integers. (unsigned integer modulo),
   * reverting with custom message when dividing by zero.
   *
   * CAUTION: This function is deprecated because it requires allocating memory for the error
   * message unnecessarily. For custom revert reasons use {tryMod}.
   *
   * Counterpart to Solidity's `%` operator. This function uses a `revert`
   * opcode (which leaves remaining gas untouched) while Solidity uses an
   * invalid opcode to revert (consuming all remaining gas).
   *
   * Requirements:
   *
   * - The divisor cannot be zero.
   */
  function mod(
    uint256 a,
    uint256 b,
    string memory errorMessage
  ) internal pure returns (uint256) {
    unchecked {
      require(b > 0, errorMessage);
      return a % b;
    }
  }
}

/*
 * @dev Provides information about the current execution context, including the
 * sender of the transaction and its data. While these are generally available
 * via msg.sender and msg.data, they should not be accessed in such a direct
 * manner, since when dealing with meta-transactions the account sending and
 * paying for execution may not be the actual sender (as far as an application
 * is concerned).
 *
 * This contract is only required for intermediate, library-like contracts.
 */
abstract contract Context {
  function _msgSender() internal view virtual returns (address) {
    return msg.sender;
  }

  function _msgData() internal view virtual returns (bytes calldata) {
    this; // silence state mutability warning without generating bytecode - see https://github.com/ethereum/solidity/issues/2691
    return msg.data;
  }
}

/**
 * @dev Contract module which provides a basic access control mechanism, where
 * there is an account (an owner) that can be granted exclusive access to
 * specific functions.
 *
 * By default, the owner account will be the one that deploys the contract. This
 * can later be changed with {transferOwnership}.
 *
 * This module is used through inheritance. It will make available the modifier
 * `onlyOwner`, which can be applied to your functions to restrict their use to
 * the owner.
 */
abstract contract Ownable is Context {
  address private _owner;

  event OwnershipTransferred(
    address indexed previousOwner,
    address indexed newOwner
  );

  /**
   * @dev Initializes the contract setting the deployer as the initial owner.
   */
  constructor() {
    address msgSender = _msgSender();
    _owner = msgSender;
    emit OwnershipTransferred(address(0), msgSender);
  }

  /**
   * @dev Returns the address of the current owner.
   */
  function owner() public view virtual returns (address) {
    return _owner;
  }

  /**
   * @dev Throws if called by any account other than the owner.
   */
  modifier onlyOwner() {
    require(
      owner() == _msgSender(),
      "Ownable: caller is not the owner"
    );
    _;
  }

  /**
   * @dev Leaves the contract without owner. It will not be possible to call
   * `onlyOwner` functions anymore. Can only be called by the current owner.
   *
   * NOTE: Renouncing ownership will leave the contract without an owner,
   * thereby removing any functionality that is only available to the owner.
   */
  function renounceOwnership() public virtual onlyOwner {
    emit OwnershipTransferred(_owner, address(0));
    _owner = address(0);
  }

  /**
   * @dev Transfers ownership of the contract to a new account (`newOwner`).
   * Can only be called by the current owner.
   */
  function transferOwnership(address newOwner)
    public
    virtual
    onlyOwner
  {
    require(
      newOwner != address(0),
      "Ownable: new owner is the zero address"
    );
    emit OwnershipTransferred(_owner, newOwner);
    _owner = newOwner;
  }
}

/**
 * @dev Interface of the ERC20 standard as defined in the EIP.
 */
interface IERC20 {
  /**
   * @dev Returns the amount of tokens in existence.
   */
  function totalSupply() external view returns (uint256);

  /**
   * @dev Returns the amount of tokens owned by `account`.
   */
  function balanceOf(address account) external view returns (uint256);

  /**
   * @dev Moves `amount` tokens from the caller's account to `recipient`.
   *
   * Returns a boolean value indicating whether the operation succeeded.
   *
   * Emits a {Transfer} event.
   */
  function transfer(address recipient, uint256 amount)
    external
    returns (bool);

  /**
   * @dev Returns the remaining number of tokens that `spender` will be
   * allowed to spend on behalf of `owner` through {transferFrom}. This is
   * zero by default.
   *
   * This value changes when {approve} or {transferFrom} are called.
   */
  function allowance(address owner, address spender)
    external
    view
    returns (uint256);

  /**
   * @dev Sets `amount` as the allowance of `spender` over the caller's tokens.
   *
   * Returns a boolean value indicating whether the operation succeeded.
   *
   * IMPORTANT: Beware that changing an allowance with this method brings the risk
   * that someone may use both the old and the new allowance by unfortunate
   * transaction ordering. One possible solution to mitigate this race
   * condition is to first reduce the spender's allowance to 0 and set the
   * desired value afterwards:
   * https://github.com/ethereum/EIPs/issues/20#issuecomment-263524729
   *
   * Emits an {Approval} event.
   */
  function approve(address spender, uint256 amount)
    external
    returns (bool);

  /**
   * @dev Moves `amount` tokens from `sender` to `recipient` using the
   * allowance mechanism. `amount` is then deducted from the caller's
   * allowance.
   *
   * Returns a boolean value indicating whether the operation succeeded.
   *
   * Emits a {Transfer} event.
   */
  function transferFrom(
    address sender,
    address recipient,
    uint256 amount
  ) external returns (bool);

  /**
   * @dev Emitted when `value` tokens are moved from one account (`from`) to
   * another (`to`).
   *
   * Note that `value` may be zero.
   */
  event Transfer(
    address indexed from,
    address indexed to,
    uint256 value
  );

  /**
   * @dev Emitted when the allowance of a `spender` for an `owner` is set by
   * a call to {approve}. `value` is the new allowance.
   */
  event Approval(
    address indexed owner,
    address indexed spender,
    uint256 value
  );
}

/**
 * @dev Collection of functions related to the address type
 */
library Address {
  /**
   * @dev Returns true if `account` is a contract.
   *
   * [IMPORTANT]
   * ====
   * It is unsafe to assume that an address for which this function returns
   * false is an externally-owned account (EOA) and not a contract.
   *
   * Among others, `isContract` will return false for the following
   * types of addresses:
   *
   *  - an externally-owned account
   *  - a contract in construction
   *  - an address where a contract will be created
   *  - an address where a contract lived, but was destroyed
   * ====
   */
  function isContract(address account) internal view returns (bool) {
    // This method relies on extcodesize, which returns 0 for contracts in
    // construction, since the code is only stored at the end of the
    // constructor execution.

    uint256 size;
    // solhint-disable-next-line no-inline-assembly
    assembly {
      size := extcodesize(account)
    }
    return size > 0;
  }

  /**
   * @dev Replacement for Solidity's `transfer`: sends `amount` wei to
   * `recipient`, forwarding all available gas and reverting on errors.
   *
   * https://eips.ethereum.org/EIPS/eip-1884[EIP1884] increases the gas cost
   * of certain opcodes, possibly making contracts go over the 2300 gas limit
   * imposed by `transfer`, making them unable to receive funds via
   * `transfer`. {sendValue} removes this limitation.
   *
   * https://diligence.consensys.net/posts/2019/09/stop-using-soliditys-transfer-now/[Learn more].
   *
   * IMPORTANT: because control is transferred to `recipient`, care must be
   * taken to not create reentrancy vulnerabilities. Consider using
   * {ReentrancyGuard} or the
   * https://solidity.readthedocs.io/en/v0.5.11/security-considerations.html#use-the-checks-effects-interactions-pattern[checks-effects-interactions pattern].
   */
  function sendValue(address payable recipient, uint256 amount)
    internal
  {
    require(
      address(this).balance >= amount,
      "Address: insufficient balance"
    );

    // solhint-disable-next-line avoid-low-level-calls, avoid-call-value
    (bool success, ) = recipient.call{ value: amount }("");
    require(
      success,
      "Address: unable to send value, recipient may have reverted"
    );
  }

  /**
   * @dev Performs a Solidity function call using a low level `call`. A
   * plain`call` is an unsafe replacement for a function call: use this
   * function instead.
   *
   * If `target` reverts with a revert reason, it is bubbled up by this
   * function (like regular Solidity function calls).
   *
   * Returns the raw returned data. To convert to the expected return value,
   * use https://solidity.readthedocs.io/en/latest/units-and-global-variables.html?highlight=abi.decode#abi-encoding-and-decoding-functions[`abi.decode`].
   *
   * Requirements:
   *
   * - `target` must be a contract.
   * - calling `target` with `data` must not revert.
   *
   * _Available since v3.1._
   */
  function functionCall(address target, bytes memory data)
    internal
    returns (bytes memory)
  {
    return
      functionCall(target, data, "Address: low-level call failed");
  }

  /**
   * @dev Same as {xref-Address-functionCall-address-bytes-}[`functionCall`], but with
   * `errorMessage` as a fallback revert reason when `target` reverts.
   *
   * _Available since v3.1._
   */
  function functionCall(
    address target,
    bytes memory data,
    string memory errorMessage
  ) internal returns (bytes memory) {
    return functionCallWithValue(target, data, 0, errorMessage);
  }

  /**
   * @dev Same as {xref-Address-functionCall-address-bytes-}[`functionCall`],
   * but also transferring `value` wei to `target`.
   *
   * Requirements:
   *
   * - the calling contract must have an ETH balance of at least `value`.
   * - the called Solidity function must be `payable`.
   *
   * _Available since v3.1._
   */
  function functionCallWithValue(
    address target,
    bytes memory data,
    uint256 value
  ) internal returns (bytes memory) {
    return
      functionCallWithValue(
        target,
        data,
        value,
        "Address: low-level call with value failed"
      );
  }

  /**
   * @dev Same as {xref-Address-functionCallWithValue-address-bytes-uint256-}[`functionCallWithValue`], but
   * with `errorMessage` as a fallback revert reason when `target` reverts.
   *
   * _Available since v3.1._
   */
  function functionCallWithValue(
    address target,
    bytes memory data,
    uint256 value,
    string memory errorMessage
  ) internal returns (bytes memory) {
    require(
      address(this).balance >= value,
      "Address: insufficient balance for call"
    );
    require(isContract(target), "Address: call to non-contract");

    // solhint-disable-next-line avoid-low-level-calls
    (bool success, bytes memory returndata) = target.call{
      value: value
    }(data);
    return _verifyCallResult(success, returndata, errorMessage);
  }

  /**
   * @dev Same as {xref-Address-functionCall-address-bytes-}[`functionCall`],
   * but performing a static call.
   *
   * _Available since v3.3._
   */
  function functionStaticCall(address target, bytes memory data)
    internal
    view
    returns (bytes memory)
  {
    return
      functionStaticCall(
        target,
        data,
        "Address: low-level static call failed"
      );
  }

  /**
   * @dev Same as {xref-Address-functionCall-address-bytes-string-}[`functionCall`],
   * but performing a static call.
   *
   * _Available since v3.3._
   */
  function functionStaticCall(
    address target,
    bytes memory data,
    string memory errorMessage
  ) internal view returns (bytes memory) {
    require(
      isContract(target),
      "Address: static call to non-contract"
    );

    // solhint-disable-next-line avoid-low-level-calls
    (bool success, bytes memory returndata) = target.staticcall(data);
    return _verifyCallResult(success, returndata, errorMessage);
  }

  /**
   * @dev Same as {xref-Address-functionCall-address-bytes-}[`functionCall`],
   * but performing a delegate call.
   *
   * _Available since v3.4._
   */
  function functionDelegateCall(address target, bytes memory data)
    internal
    returns (bytes memory)
  {
    return
      functionDelegateCall(
        target,
        data,
        "Address: low-level delegate call failed"
      );
  }

  /**
   * @dev Same as {xref-Address-functionCall-address-bytes-string-}[`functionCall`],
   * but performing a delegate call.
   *
   * _Available since v3.4._
   */
  function functionDelegateCall(
    address target,
    bytes memory data,
    string memory errorMessage
  ) internal returns (bytes memory) {
    require(
      isContract(target),
      "Address: delegate call to non-contract"
    );

    // solhint-disable-next-line avoid-low-level-calls
    (bool success, bytes memory returndata) = target.delegatecall(
      data
    );
    return _verifyCallResult(success, returndata, errorMessage);
  }

  function _verifyCallResult(
    bool success,
    bytes memory returndata,
    string memory errorMessage
  ) private pure returns (bytes memory) {
    if (success) {
      return returndata;
    } else {
      // Look for revert reason and bubble it up if present
      if (returndata.length > 0) {
        // The easiest way to bubble the revert reason is using memory via assembly

        // solhint-disable-next-line no-inline-assembly
        assembly {
          let returndata_size := mload(returndata)
          revert(add(32, returndata), returndata_size)
        }
      } else {
        revert(errorMessage);
      }
    }
  }
}

/**
 * @title SafeERC20
 * @dev Wrappers around ERC20 operations that throw on failure (when the token
 * contract returns false). Tokens that return no value (and instead revert or
 * throw on failure) are also supported, non-reverting calls are assumed to be
 * successful.
 * To use this library you can add a `using SafeERC20 for IERC20;` statement to your contract,
 * which allows you to call the safe operations as `token.safeTransfer(...)`, etc.
 */
library SafeERC20 {
  using Address for address;

  function safeTransfer(
    IERC20 token,
    address to,
    uint256 value
  ) internal {
    _callOptionalReturn(
      token,
      abi.encodeWithSelector(token.transfer.selector, to, value)
    );
  }

  function safeTransferFrom(
    IERC20 token,
    address from,
    address to,
    uint256 value
  ) internal {
    _callOptionalReturn(
      token,
      abi.encodeWithSelector(
        token.transferFrom.selector,
        from,
        to,
        value
      )
    );
  }

  /**
   * @dev Deprecated. This function has issues similar to the ones found in
   * {IERC20-approve}, and its usage is discouraged.
   *
   * Whenever possible, use {safeIncreaseAllowance} and
   * {safeDecreaseAllowance} instead.
   */
  function safeApprove(
    IERC20 token,
    address spender,
    uint256 value
  ) internal {
    // safeApprove should only be called when setting an initial allowance,
    // or when resetting it to zero. To increase and decrease it, use
    // 'safeIncreaseAllowance' and 'safeDecreaseAllowance'
    // solhint-disable-next-line max-line-length
    require(
      (value == 0) || (token.allowance(address(this), spender) == 0),
      "SafeERC20: approve from non-zero to non-zero allowance"
    );
    _callOptionalReturn(
      token,
      abi.encodeWithSelector(token.approve.selector, spender, value)
    );
  }

  function safeIncreaseAllowance(
    IERC20 token,
    address spender,
    uint256 value
  ) internal {
    uint256 newAllowance = token.allowance(address(this), spender) +
      value;
    _callOptionalReturn(
      token,
      abi.encodeWithSelector(
        token.approve.selector,
        spender,
        newAllowance
      )
    );
  }

  function safeDecreaseAllowance(
    IERC20 token,
    address spender,
    uint256 value
  ) internal {
    unchecked {
      uint256 oldAllowance = token.allowance(address(this), spender);
      require(
        oldAllowance >= value,
        "SafeERC20: decreased allowance below zero"
      );
      uint256 newAllowance = oldAllowance - value;
      _callOptionalReturn(
        token,
        abi.encodeWithSelector(
          token.approve.selector,
          spender,
          newAllowance
        )
      );
    }
  }

  /**
   * @dev Imitates a Solidity high-level call (i.e. a regular function call to a contract), relaxing the requirement
   * on the return value: the return value is optional (but if data is returned, it must not be false).
   * @param token The token targeted by the call.
   * @param data The call data (encoded using abi.encode or one of its variants).
   */
  function _callOptionalReturn(IERC20 token, bytes memory data)
    private
  {
    // We need to perform a low level call here, to bypass Solidity's return data size checking mechanism, since
    // we're implementing it ourselves. We use {Address.functionCall} to perform this call, which verifies that
    // the target address contains contract code and also asserts for success in the low-level call.

    bytes memory returndata = address(token).functionCall(
      data,
      "SafeERC20: low-level call failed"
    );
    if (returndata.length > 0) {
      // Return data is optional
      // solhint-disable-next-line max-line-length
      require(
        abi.decode(returndata, (bool)),
        "SafeERC20: ERC20 operation did not succeed"
      );
    }
  }
}

interface IStableRouter {
  function exchange(
    int128 i,
    int128 j,
    uint256 dx,
    uint256 min_dy
  ) external returns (uint256);

  function get_dy(
    int128 i,
    int128 j,
    uint256 dx
  ) external view returns (uint256);
}

interface ITreasury {
  function mint(uint256 _amount) external returns (uint256);

  function redeem(uint256 _amount) external returns (uint256);

  function reserveToTMAmount(uint256 _amount)
    external
    view
    returns (uint256);

  function tmToReserveAmount(uint256 _amount)
    external
    view
    returns (uint256);
}

contract TemplarRouter is Ownable {
  using SafeMath for uint256;
  using SafeERC20 for IERC20;
  ISwapRouter swapRouter;

  address public immutable treasury;
  address public immutable tm;
  address public immutable busd;
  address public immutable wbnb;
  address public immutable tem;
  address public immutable stableRouter;
  address public immutable uniRouter;
  address public immutable permit2 =
    address(0x000000000022D473030F116dDEE9F6B43aC78BA3);

  uint160 public maxUInt160;

  mapping(address => bool) public tokenList;
  mapping(address => int128) public tokenParam;

  mapping(address => bool) public uniTokenWhitelist;

  event Swap(
    address indexed _address,
    address _tokenA,
    address _tokenB,
    uint256 _amountIn,
    uint256 _minAmountOut,
    uint256 _amountOut
  );

  constructor(
    address _treasury,
    address _tm,
    address _busd,
    address _usdt,
    address _usdc,
    address _dai,
    address _tem,
    address _wbnb,
    address _stableRouter,
    address _uniRouter
  ) {
    require(_treasury != address(0), "invalid address");
    require(_tm != address(0), "invalid address");
    require(_busd != address(0), "invalid address");
    require(_usdt != address(0), "invalid address");
    require(_usdc != address(0), "invalid address");
    require(_dai != address(0), "invalid address");
    require(_tem != address(0), "invalid TEM address");
    require(_wbnb != address(0), "invalid WBNB address");
    require(_stableRouter != address(0), "invalid address");
    require(
      _uniRouter != address(0),
      "invalid UniswapV3 router address"
    );

    treasury = _treasury;
    tm = _tm;
    busd = _busd;
    wbnb = _wbnb;
    tem = _tem;
    stableRouter = _stableRouter;
    uniRouter = _uniRouter;

    // initial token list
    tokenList[_tm] = true;
    tokenList[_busd] = true;
    tokenList[_usdt] = true;
    tokenList[_dai] = true;
    tokenList[_usdc] = true;
    tokenList[_tem] = true;

    // initial stable swap param
    tokenParam[_busd] = 0;
    tokenParam[_usdt] = 1;
    tokenParam[_dai] = 2;
    tokenParam[_usdc] = 3;

    maxUInt160 = uint160(~uint160(0));
  }

  modifier onlyUniTokenWhitelist(address _token) {
    require(
      uniTokenWhitelist[_token],
      "token not contained in uniTokenWhiteList"
    );
    require(tokenList[_token], "token not contained in tokenList");
    _;
  }

  modifier allowTokenList(address _tokenA, address _tokenB) {
    require(tokenList[_tokenA], "token not allow");
    require(tokenList[_tokenB], "token not allow");
    require(_tokenA != _tokenB, "not same token");
    _;
  }

  function swap(
    address _tokenA,
    address _tokenB,
    uint256 _amountIn,
    uint256 _minAmountOut
  ) external allowTokenList(_tokenA, _tokenB) returns (uint256) {
    IERC20(_tokenA).safeTransferFrom(
      msg.sender,
      address(this),
      _amountIn
    );

    uint256 _amountOut = 0;
    uint256 busdBalance = IERC20(busd).balanceOf(address(this));
    uint256 temBalance = IERC20(tem).balanceOf(address(this));

    // only TEM > BUSD || BUSD > TEM
    if (
      (_tokenA == tem && _tokenB == busd) ||
      (_tokenA == busd && _tokenB == tem)
    ) {
      _uniV3Swap(_amountIn, _minAmountOut, _tokenA, _tokenB);

      if (_tokenA == tem) {
        uint256 currentBusdBalance = IERC20(busd).balanceOf(
          address(this)
        );

        _amountOut = currentBusdBalance.sub(busdBalance);
      } else {
        uint256 currentTemBalance = IERC20(tem).balanceOf(
          address(this)
        );
        _amountOut = currentTemBalance.sub(busdBalance);
      }
    } else {
      if (_tokenA == tem) {
        _uniV3Swap(_amountIn, _minAmountOut, _tokenA, busd);

        uint256 currentBusdBalance = IERC20(busd).balanceOf(
          address(this)
        );

        _amountOut = currentBusdBalance.sub(busdBalance);
        _tokenA = busd;
      }

      // console.log(
      //   "Transferring from %s A token %s %s tokens",
      //   msg.sender,
      //   _tokenA,
      //   _amountOut
      // );

      if (_tokenA != tem) {
        if (_tokenB == tem) {
          _amountOut = swapV1(
            _tokenA,
            busd,
            _amountIn,
            _minAmountOut
          );
        } else {
          _amountOut = swapV1(
            _tokenA,
            _tokenB,
            _amountIn,
            _minAmountOut
          );
        }
      }

      if (_tokenB == tem) {
        _uniV3Swap(_amountIn, _minAmountOut, busd, _tokenB);

        uint256 currentTemBalance = IERC20(tem).balanceOf(
          address(this)
        );

        require(
          currentTemBalance > temBalance,
          "TEM balance is less than current balance"
        );

        _amountOut = currentTemBalance.sub(temBalance);
      }
    }

    require(_amountOut >= _minAmountOut, "slippage");

    // transfer
    IERC20(_tokenB).safeTransfer(msg.sender, _amountOut);

    emit Swap(
      msg.sender,
      _tokenA,
      _tokenB,
      _amountIn,
      _minAmountOut,
      _amountOut
    );

    return _amountOut;
  }

  function swapV1(
    address _tokenA,
    address _tokenB,
    uint256 _amountIn,
    uint256 _minAmountOut
  ) internal returns (uint256) {
    uint256 _amountOut;

    if (_tokenB == tm) {
      _amountOut = zapMint(_tokenA, _amountIn, _minAmountOut);
    } else if (_tokenA == tm) {
      _amountOut = zapRedeem(_tokenB, _amountIn, _minAmountOut);
    } else {
      _amountOut = stableSwap(
        _tokenA,
        _tokenB,
        _amountIn,
        _minAmountOut
      );
    }

    return _amountOut;
  }

  function getAmountOut(
    address _tokenA,
    address _tokenB,
    uint256 _amountIn
  ) external view allowTokenList(_tokenA, _tokenB) returns (uint256) {
    uint256 _balance = _amountIn;
    if (_tokenA == tm) {
      // from TM
      _balance = ITreasury(treasury).tmToReserveAmount(_balance); // swap TM to BUSD
      _tokenA = busd;

      if (_tokenB == busd) {
        // target is BUSD
        return _balance;
      }
    }

    // _tokenA is BUSD, USDT, USDC, DAI
    if (_tokenB == tm) {
      // target is TM
      if (_tokenA != busd) {
        _balance = IStableRouter(stableRouter).get_dy(
          tokenParam[_tokenA],
          tokenParam[busd],
          _balance
        ); // swap xxx to BUSD
      }
      _balance = ITreasury(treasury).reserveToTMAmount(_balance);
    } else {
      _balance = IStableRouter(stableRouter).get_dy(
        tokenParam[_tokenA],
        tokenParam[_tokenB],
        _balance
      );
    }

    return _balance;
  }

  // ------------------------------
  // internal
  // ------------------------------
  function zapMint(
    address _token,
    uint256 _amountIn,
    uint256 _minAmountOut
  ) internal returns (uint256) {
    // swap to BUSD
    // IERC20(_token).safeTransferFrom(
    //   msg.sender,
    //   address(this),
    //   _amountIn
    // );
    uint256 _balance = (_token == busd)
      ? _amountIn
      : _swap(_token, busd, _amountIn, _minAmountOut);

    // mint
    IERC20(busd).safeApprove(treasury, _balance);
    uint256 _amountOut = ITreasury(treasury).mint(_balance);

    // transfer TM
    // IERC20(tm).safeTransfer(msg.sender, _amountOut);
    return _amountOut;
  }

  function zapRedeem(
    address _token,
    uint256 _amountIn,
    uint256 _minAmountOut
  ) internal returns (uint256) {
    // redeem to BUSD
    // IERC20(tm).safeTransferFrom(msg.sender, address(this), _amountIn);
    IERC20(tm).safeApprove(treasury, _amountIn);
    uint256 _balance = ITreasury(treasury).redeem(_amountIn);

    // swap from BUSD
    uint256 _amountOut = (_token == busd)
      ? _balance
      : _swap(busd, _token, _balance, _minAmountOut);

    // transfer
    // IERC20(_token).safeTransfer(msg.sender, _amountOut);
    return _amountOut;
  }

  function stableSwap(
    address _tokenA,
    address _tokenB,
    uint256 _amountIn,
    uint256 _minAmountOut
  ) internal returns (uint256) {
    // IERC20(_tokenA).safeTransferFrom(
    //   msg.sender,
    //   address(this),
    //   _amountIn
    // );

    uint256 _amountOut = _swap(
      _tokenA,
      _tokenB,
      _amountIn,
      _minAmountOut
    );

    // transfer
    // IERC20(_tokenB).safeTransfer(msg.sender, _amountOut);
    return _amountOut;
  }

  function _swap(
    address _tokenA,
    address _tokenB,
    uint256 _amountIn,
    uint256 _minAmountOut
  ) internal returns (uint256) {
    // swap
    IERC20(_tokenA).safeApprove(stableRouter, _amountIn);
    uint256 _balance = IStableRouter(stableRouter).exchange(
      tokenParam[_tokenA],
      tokenParam[_tokenB],
      _amountIn,
      _minAmountOut
    );

    require(_balance >= _minAmountOut, "slippage");
    return _balance;
  }

  function _uniV3Swap(
    uint256 amountIn,
    uint256 minAmountOut,
    address _tokenA,
    address _tokenB
  )
    internal
    onlyUniTokenWhitelist(_tokenA)
    onlyUniTokenWhitelist(_tokenB)
  {
    // Permit2 token approval
    IERC20(_tokenA).safeApprove(permit2, amountIn);
    IPermitV2(permit2).approve(
      _tokenA,
      uniRouter,
      maxUInt160,
      uint48(block.timestamp + 60)
    );

    // Generate commands and inputs
    // 0x00 = V3_SWAP_EXACT_IN
    bytes memory commands = abi.encodePacked(
      bytes1(uint8(Commands.V3_SWAP_EXACT_IN))
    );
    bytes[] memory inputs = new bytes[](1);

    // Just only parts supported
    // BUSD -> WBNB -> TEM
    // TEM -> WBNB -> BUSD
    bytes memory paths = abi.encodePacked(
      _tokenA,
      uint24(3000),
      wbnb,
      uint24(3000),
      _tokenB
    );

    // V3_SWAP_EXACT_IN
    // (recipient, amountIn, minAmountOut, paths, bool A flag from msg.sender)
    address MSG_SENDER = 0x0000000000000000000000000000000000000001;
    inputs[0] = abi.encode(
      MSG_SENDER,
      amountIn,
      minAmountOut,
      paths,
      true
    );

    IUniversalRouter router = IUniversalRouter(uniRouter);
    router.execute(commands, inputs, block.timestamp + 60);
  }

  function testSwap(
    uint256 amoutIn,
    address _tokenA,
    address _tokenB
  ) public {
    IERC20(_tokenA).safeTransferFrom(
      msg.sender,
      address(this),
      amoutIn
    );
    _uniV3Swap(amoutIn, 0, _tokenA, _tokenB);
  }

  // ------------------------------
  // onlyOwner
  // ------------------------------
  function addTokenList(address _token) external onlyOwner {
    require(_token != address(0), "address invalid");
    tokenList[_token] = true;
  }

  function removeTokenList(address _token) external onlyOwner {
    require(_token != address(0), "address invalid");
    tokenList[_token] = false;
  }

  function addUniTokenWhitelist(address[] calldata tokenAddresses)
    external
    onlyOwner
  {
    for (uint256 i = 0; i < tokenAddresses.length; i++) {
      uniTokenWhitelist[tokenAddresses[i]] = true;
    }
  }
}

// SPDX-License-Identifier: AGPL-3.0-or-later
pragma solidity 0.8.17;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@uniswap/v3-periphery/contracts/interfaces/ISwapRouter.sol";
import "./interfaces/IUniversalRouter.sol";
import "./interfaces/IPermitV2.sol";
import "./interfaces/IQuoterV2.sol";
import "./libraries/Commands.sol";
import "./libraries/SafeERC20.sol";

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
  using SafeERC20 for IERC20;
  ISwapRouter swapRouter;

  address public immutable treasury;
  address public immutable tm;
  address public immutable usdt;
  address public immutable wbnb;
  address public immutable tem;
  address public immutable stableRouter;
  address public immutable uniRouter;
  address public immutable permit2;
  address public immutable quoter2;

  mapping(address => bool) public tokenList;
  mapping(address => int128) public tokenParam;

  event Swap(
    address indexed _address,
    address _tokenA,
    address _tokenB,
    uint256 _amountIn,
    uint256 _minAmountOut,
    uint256 _amountOut
  );

  modifier allowTokenList(address _tokenA, address _tokenB) {
    require(_tokenA != _tokenB, "not same token");
    require(
      tokenList[_tokenA] && tokenList[_tokenB],
      "token not allow"
    );
    _;
  }

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
    address _uniRouter,
    address _permit2,
    address _quoter2
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
    require(_permit2 != address(0), "invalid permit2 address");

    treasury = _treasury;
    tm = _tm;
    usdt = _usdt;
    wbnb = _wbnb;
    tem = _tem;
    stableRouter = _stableRouter;
    uniRouter = _uniRouter;
    permit2 = _permit2;
    quoter2 = _quoter2;

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
  }

  function swap(
    address _tokenA,
    address _tokenB,
    uint256 _amountIn,
    uint256 _minAmountOut
  )
    external
    allowTokenList(_tokenA, _tokenB)
    returns (uint256 _amountOut)
  {
    IERC20(_tokenA).safeTransferFrom(
      msg.sender,
      address(this),
      _amountIn
    );

    if (_tokenA == tem) {
      _amountOut = _swapWithUniswapV3(_amountIn, 0, tem, usdt);
      if (_tokenB != usdt) {
        _amountOut = _swapStableTM(usdt, _tokenB, _amountOut, 0);
      }
    } else if (_tokenB == tem) {
      uint256 amountIn = _amountIn;
      if (_tokenA != usdt) {
        amountIn = _swapStableTM(_tokenA, usdt, amountIn, 0);
      }
      _amountOut = _swapWithUniswapV3(amountIn, 0, usdt, tem);
    } else {
      _amountOut = _swapStableTM(_tokenA, _tokenB, _amountIn, 0);
    }

    require(_amountOut >= _minAmountOut, "slippage");
    IERC20(_tokenB).safeTransfer(msg.sender, _amountOut);

    emit Swap(
      msg.sender,
      _tokenA,
      _tokenB,
      _amountIn,
      _minAmountOut,
      _amountOut
    );
  }

  function getAmountOut(
    address _tokenA,
    address _tokenB,
    uint256 _amountIn
  )
    external
    allowTokenList(_tokenA, _tokenB)
    returns (uint256 _amountOut)
  {
    if (_tokenA == tem) {
      _amountOut = _getQuoteExactInput(tem, usdt, _amountIn);
      if (_tokenB != usdt) {
        _amountOut = _getExactInputSwapStableTM(
          usdt,
          _tokenB,
          _amountOut
        );
      }
    } else if (_tokenB == tem) {
      uint256 amountIn = _amountIn;
      if (_tokenA != usdt) {
        amountIn = _getExactInputSwapStableTM(
          _tokenA,
          usdt,
          amountIn
        );
      }
      _amountOut = _getQuoteExactInput(usdt, tem, amountIn);
    } else {
      _amountOut = _getExactInputSwapStableTM(
        _tokenA,
        _tokenB,
        _amountIn
      );
    }
  }

  // ------------------------------
  // internal
  // ------------------------------
  function _getQuoteExactInput(
    address _tokenA,
    address _tokenB,
    uint256 _amountIn
  ) internal returns (uint256 amountOut) {
    (uint24 fee1, uint24 fee2) = _tokenA == usdt ? (500, 3000) : (3000, 500);
    bytes memory paths = abi.encodePacked(
      _tokenA,
      fee1,
      wbnb,
      fee2,
      _tokenB
    );
    IQuoterV2 q = IQuoterV2(quoter2);
    (amountOut, , , ) = q.quoteExactInput(paths, _amountIn);
  }

  function _getExactInputSwapStableTM(
    address _tokenA,
    address _tokenB,
    uint256 _amountIn
  ) internal view returns (uint256 _amountOut) {
    if (_tokenA == tm) {
      _amountOut = ITreasury(treasury).tmToReserveAmount(_amountIn);
    } else if (_tokenB == tm) {
      _amountOut = ITreasury(treasury).reserveToTMAmount(_amountIn);
    } else {
      _amountOut = IStableRouter(stableRouter).get_dy(
        tokenParam[_tokenA],
        tokenParam[_tokenB],
        _amountIn
      );
    }
  }

  function _swapStableTM(
    address _tokenA,
    address _tokenB,
    uint256 _amountIn,
    uint256 _minAmountOut
  ) internal returns (uint256 _amountOut) {
    if (_tokenA == tm) {
      _amountOut = _zapRedeem(_tokenB, _amountIn, _minAmountOut);
    } else if (_tokenB == tm) {
      _amountOut = _zapMint(_tokenA, _amountIn, _minAmountOut);
    } else {
      _amountOut = _stableSwap(
        _tokenA,
        _tokenB,
        _amountIn,
        _minAmountOut
      );
    }
  }

  function _zapMint(
    address _token,
    uint256 _amountIn,
    uint256 _minAmountOut
  ) internal returns (uint256 _amountOut) {
    // swap to USDT
    uint256 _balance = (_token == usdt)
      ? _amountIn
      : _swap(_token, usdt, _amountIn, _minAmountOut);

    // mint
    IERC20(usdt).safeApprove(treasury, _balance);
    _amountOut = ITreasury(treasury).mint(_balance);
  }

  function _zapRedeem(
    address _token,
    uint256 _amountIn,
    uint256 _minAmountOut
  ) internal returns (uint256 _amountOut) {
    // redeem to USDT
    IERC20(tm).safeApprove(treasury, _amountIn);
    uint256 _balance = ITreasury(treasury).redeem(_amountIn);

    // swap from USDT
    _amountOut = (_token == usdt)
      ? _balance
      : _swap(usdt, _token, _balance, _minAmountOut);
  }

  function _stableSwap(
    address _tokenA,
    address _tokenB,
    uint256 _amountIn,
    uint256 _minAmountOut
  ) internal returns (uint256 _amountOut) {
    _amountOut = _swap(_tokenA, _tokenB, _amountIn, _minAmountOut);
  }

  function _swap(
    address _tokenA,
    address _tokenB,
    uint256 _amountIn,
    uint256 _minAmountOut
  ) internal returns (uint256 _amountOut) {
    IERC20(_tokenA).safeApprove(stableRouter, _amountIn);
    _amountOut = IStableRouter(stableRouter).exchange(
      tokenParam[_tokenA],
      tokenParam[_tokenB],
      _amountIn,
      _minAmountOut
    );
  }

  function _swapWithUniswapV3(
    uint256 _amountIn,
    uint256 _minAmountOut,
    address _tokenA,
    address _tokenB
  ) internal returns (uint256 _amountOut) {
    // Get balance before
    uint256 balanceBefore = IERC20(_tokenB).balanceOf(address(this));

    // Permit2 token approval
    IERC20(_tokenA).safeApprove(permit2, _amountIn);
    IPermitV2(permit2).approve(
      _tokenA,
      uniRouter,
      uint160(_amountIn),
      uint48(block.timestamp + 60)
    );

    // Create commands and inputs
    // 0x00 = V3_SWAP_EXACT_IN
    bytes memory commands = abi.encodePacked(
      bytes1(uint8(Commands.V3_SWAP_EXACT_IN))
    );
    bytes[] memory inputs = new bytes[](1);

    // Just only paths supported
    // USDT -> WBNB -> TEM
    // TEM -> WBNB -> USDT
    (uint24 fee1, uint24 fee2) = _tokenA == usdt ? (500, 3000) : (3000, 500);
    bytes memory paths = abi.encodePacked(
      _tokenA,
      fee1,
      wbnb,
      fee2,
      _tokenB
    );

    // 0x00 V3_SWAP_EXACT_IN
    // (recipient, amountIn, minAmountOut, paths, bool A flag from msg.sender)
    inputs[0] = abi.encode(
      address(0x0000000000000000000000000000000000000001), // MSG_SENDER
      _amountIn,
      _minAmountOut,
      paths,
      true
    );

    IUniversalRouter router = IUniversalRouter(uniRouter);
    router.execute(commands, inputs, block.timestamp + 60);

    uint256 balanceAfter = IERC20(_tokenB).balanceOf(address(this));
    _amountOut = balanceAfter - balanceBefore;
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
}

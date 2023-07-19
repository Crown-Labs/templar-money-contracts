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
  address public immutable busd;
  address public immutable wbnb;
  address public immutable tem;
  address public immutable stableRouter;
  address public immutable uniRouter;
  address public immutable permit2 = address(0x000000000022D473030F116dDEE9F6B43aC78BA3);
  address public immutable quoter2 = address(0x78D78E420Da98ad378D7799bE8f4AF69033EB077);

  uint160 public maxUInt160;

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
    require(_uniRouter != address(0), "invalid UniswapV3 router address");

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

  modifier allowTokenList(address _tokenA, address _tokenB) {
    require(_tokenA != _tokenB, "not same token");
    require(tokenList[_tokenA] && tokenList[_tokenB], "token not allow");
    _;
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
    // address _tokenABefore = _tokenA;
    IERC20(_tokenA).safeTransferFrom(msg.sender, address(this), _amountIn);

    // only TEM --> BUSD || BUSD --> TEM
    /*if (
      (_tokenA == tem && _tokenB == busd) ||
      (_tokenA == busd && _tokenB == tem)
    ) {
      _amountOut = _swapWithUniswapV3(_amountIn, 0, _tokenA, _tokenB);
    } else {
      if (_tokenA == tem) {
        _amountOut = _swapWithUniswapV3(_amountIn, 0, _tokenA, busd);
        _tokenA = busd;
      }

      if (_tokenA != tem) {
        if (_tokenB == tem) {
          _amountOut = _swapV1(_tokenA, busd, _amountIn, 0);
        } else {
          _amountOut = _swapV1(_tokenA, _tokenB, _amountIn, 0);
        }
      }

      if (_tokenB == tem) {
        _amountOut = _swapWithUniswapV3(_amountOut, 0, busd, _tokenB);
      }
    }*/

    // DAI -> TEM
    // DAI -> USDC
    // TEM -> DAI 
    // TM -> TEM 
    // TEM -> TM 
    // TM -> DAI  
    // BUSD -> TEM 
    // TEM -> BUSD .
    if (_tokenA == tem) {
      _amountOut = _swapWithUniswapV3(_amountIn, 0, tem, busd);
      if (_tokenB != busd) {
        _amountOut = _swapStableTM(busd, _tokenB, _amountOut, 0);
      }
    } else if (_tokenB == tem) {
      uint256 amountIn = _amountIn;
      if (_tokenA != busd) {
        amountIn = _swapStableTM(_tokenA, busd, amountIn, 0);
      }
      _amountOut = _swapWithUniswapV3(amountIn, 0, busd, tem);
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

    return _amountOut;
  }

  // ------------------------------
  // internal
  // ------------------------------
  function _swapStableTM(
    address _tokenA,
    address _tokenB,
    uint256 _amountIn,
    uint256 _minAmountOut
  ) internal returns (uint256 _amountOut) {
    if (_tokenB == tm) {
      _amountOut = _zapMint(_tokenA, _amountIn, _minAmountOut);
    } else if (_tokenA == tm) {
      _amountOut = _zapRedeem(_tokenB, _amountIn, _minAmountOut);
    } else {
      _amountOut = _stableSwap(
        _tokenA,
        _tokenB,
        _amountIn,
        _minAmountOut
      );
    }

    return _amountOut;
  }

  function _zapMint(
    address _token,
    uint256 _amountIn,
    uint256 _minAmountOut
  ) internal returns (uint256) {
    // swap to BUSD
    uint256 _balance = (_token == busd)
      ? _amountIn
      : _swap(_token, busd, _amountIn, _minAmountOut);

    // mint
    IERC20(busd).safeApprove(treasury, _balance);
    uint256 _amountOut = ITreasury(treasury).mint(_balance);

    return _amountOut;
  }

  function _zapRedeem(
    address _token,
    uint256 _amountIn,
    uint256 _minAmountOut
  ) internal returns (uint256) {
    // redeem to BUSD
    IERC20(tm).safeApprove(treasury, _amountIn);
    uint256 _balance = ITreasury(treasury).redeem(_amountIn);

    // swap from BUSD
    uint256 _amountOut = (_token == busd)
      ? _balance
      : _swap(busd, _token, _balance, _minAmountOut);

    return _amountOut;
  }

  function _stableSwap(
    address _tokenA,
    address _tokenB,
    uint256 _amountIn,
    uint256 _minAmountOut
  ) internal returns (uint256) {
    uint256 _amountOut = _swap(
      _tokenA,
      _tokenB,
      _amountIn,
      _minAmountOut
    );

    return _amountOut;
  }

  function _swap(
    address _tokenA,
    address _tokenB,
    uint256 _amountIn,
    uint256 _minAmountOut
  ) internal returns (uint256) {
    IERC20(_tokenA).safeApprove(stableRouter, _amountIn);
    uint256 _balance = IStableRouter(stableRouter).exchange(
      tokenParam[_tokenA],
      tokenParam[_tokenB],
      _amountIn,
      _minAmountOut
    );
    return _balance;
  }

  function _swapWithUniswapV3(
    uint256 _amountIn,
    uint256 _minAmountOut,
    address _tokenA,
    address _tokenB
  ) internal returns (uint256 _amountOut) {
    // Check _tokenB balane before
    uint256 _tokenBalanceBefore = IERC20(_tokenB).balanceOf(
      address(this)
    );

    // Permit2 token approval
    IERC20(_tokenA).safeApprove(permit2, _amountIn);

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
      _amountIn,
      _minAmountOut,
      paths,
      true
    );

    IUniversalRouter router = IUniversalRouter(uniRouter);
    router.execute(commands, inputs, block.timestamp + 60);

    uint256 _tokenBalanceAfter = IERC20(_tokenB).balanceOf(
      address(this)
    );

    require(
      _tokenBalanceAfter > _tokenBalanceBefore,
      "swap with uniswap failed"
    );

    _amountOut = _tokenBalanceAfter - _tokenBalanceBefore;
    return _amountOut;
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

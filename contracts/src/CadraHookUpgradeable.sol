// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import {IHooks} from "@uniswap/v4-core/src/interfaces/IHooks.sol";
import {IPoolManager} from "@uniswap/v4-core/src/interfaces/IPoolManager.sol";
import {Hooks} from "@uniswap/v4-core/src/libraries/Hooks.sol";
import {PoolKey} from "@uniswap/v4-core/src/types/PoolKey.sol";
import {PoolId, PoolIdLibrary} from "@uniswap/v4-core/src/types/PoolId.sol";
import {BalanceDelta, BalanceDeltaLibrary} from "@uniswap/v4-core/src/types/BalanceDelta.sol";
import {BeforeSwapDelta, BeforeSwapDeltaLibrary} from "@uniswap/v4-core/src/types/BeforeSwapDelta.sol";
import {Currency, CurrencyLibrary} from "@uniswap/v4-core/src/types/Currency.sol";
import {TickMath} from "@uniswap/v4-core/src/libraries/TickMath.sol";
import {LiquidityAmounts} from "./libraries/LiquidityAmounts.sol";
import {StateLibrary} from "@uniswap/v4-core/src/libraries/StateLibrary.sol";
import {SwapParams, ModifyLiquidityParams} from "@uniswap/v4-core/src/types/PoolOperation.sol";
import {IUnlockCallback} from "@uniswap/v4-core/src/interfaces/callback/IUnlockCallback.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {FullMath} from "@uniswap/v4-core/src/libraries/FullMath.sol";

import {UUPSUpgradeable} from "@openzeppelin/contracts/proxy/utils/UUPSUpgradeable.sol";
import {Initializable} from "@openzeppelin/contracts/proxy/utils/Initializable.sol";

import {Mandate, Range} from "./types/Mandate.sol";
import {Vault, Record, QueuedDeposit, QueuedWithdraw} from "./types/Vault.sol";
import {PaceLib} from "./libraries/PaceLib.sol";
import {SettlementLib} from "./libraries/SettlementLib.sol";
import {MandateLib} from "./libraries/MandateLib.sol";
import {TwapOracle} from "./libraries/TwapOracle.sol";

/// @title CadraHookUpgradeable
/// @notice UUPS-upgradeable implementation of CadraHook for Uniswap v4.
/// @dev Intended to be deployed behind CadraHookProxy (which is mined with Uniswap v4 hook flags).
contract CadraHookUpgradeable is IHooks, IUnlockCallback, Initializable, UUPSUpgradeable {
    using PoolIdLibrary for PoolKey;
    using CurrencyLibrary for Currency;
    using SafeERC20 for IERC20;
    using TwapOracle for TwapOracle.Buffer;

    uint256 public constant MAX_PERF_FEE_BPS = 3000; // 30%
    uint256 public constant MAX_VAULTS_PER_POOL = 32;
    uint256 public constant BOND_WITHDRAW_COOLDOWN = 1 days;

    // Upgradable Protocol Parameters (Stored in Proxy state)
    IPoolManager public poolManager;
    IERC20 public bondToken;
    uint256 public epochLength;
    uint32 public twapWindow;
    int24 public maxSpotDeviationTicks;
    address public owner;

    uint256 public nextVaultId;

    mapping(uint256 => Vault) public vaults;
    mapping(uint256 => Range[]) internal vaultPositions;
    mapping(uint256 => mapping(address => uint256)) public vaultFollowerShares;
    mapping(uint256 => QueuedDeposit[]) internal vaultDeposits;
    mapping(uint256 => QueuedWithdraw[]) internal vaultWithdraws;

    mapping(PoolId => uint256[]) public poolVaults;
    mapping(PoolId => TwapOracle.Buffer) internal poolOracles;
    mapping(PoolId => bool) public poolRegistered;

    // Hook idle token balances per vault
    mapping(uint256 => uint256) public vaultIdle0;
    mapping(uint256 => uint256) public vaultIdle1;

    // Events
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    event VaultCreated(uint256 indexed vaultId, address indexed curator, PoolId indexed poolId, uint16 perfFeeBps);
    event MandateSet(uint256 indexed vaultId, Mandate mandate, uint256 effectiveEpoch);
    event BondChanged(uint256 indexed vaultId, uint256 bond, uint256 capacity);
    event DepositQueued(uint256 indexed vaultId, address indexed follower, uint256 amount0, uint256 amount1);
    event WithdrawQueued(uint256 indexed vaultId, address indexed follower, uint256 shares);
    event Rebalanced(uint256 indexed vaultId, Range[] ranges);
    event BandLeft(uint256 indexed vaultId, int24 tick);
    event VaultParked(uint256 indexed vaultId, uint256 epoch, uint256 shortfallBps);
    event Settled(
        uint256 indexed vaultId,
        uint256 epoch,
        uint256 vaultValue,
        uint256 paceValue,
        uint256 fee,
        uint256 bondPaid,
        uint256 deficit
    );

    // Errors
    error OnlyCurator();
    error OnlyOwner();
    error NotPoolManager();
    error HookNotImplemented();
    error VaultFrozen();
    error VaultNotParkable(uint256 shortfallBps, uint256 maxShortfallBps);
    error EpochNotEnded();
    error CapacityExceeded();
    error InsufficientBond();
    error CooldownActive();
    error InsufficientShares();
    error SpotDeviationTooHigh(int24 spotTick, int24 twapTick);
    error MaxVaultsReached();
    error ZeroLiquidity();

    struct UnlockCallbackData {
        uint8 action; // 1: rebalance, 2: park, 3: fullRangeInit
        uint256 vaultId;
        Range[] newRanges;
    }

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /// @notice Initializer function called once through the proxy upon deployment.
    function initialize(
        IPoolManager _poolManager,
        IERC20 _bondToken,
        uint256 _epochLength,
        uint32 _twapWindow,
        int24 _maxSpotDeviationTicks,
        address _owner
    ) external initializer {
        require(_owner != address(0), "ZeroOwner");
        require(address(_poolManager) != address(0), "ZeroPoolManager");

        poolManager = _poolManager;
        bondToken = _bondToken;
        epochLength = _epochLength;
        twapWindow = _twapWindow;
        maxSpotDeviationTicks = _maxSpotDeviationTicks;
        owner = _owner;
        nextVaultId = 1;

        emit OwnershipTransferred(address(0), _owner);
    }

    modifier onlyOwner() {
        if (msg.sender != owner) revert OnlyOwner();
        _;
    }

    modifier onlyPoolManager() {
        if (msg.sender != address(poolManager)) revert NotPoolManager();
        _;
    }

    /// @notice Restricts contract logic upgrades strictly to the owner.
    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}

    /// @notice Allows the contract owner to transfer governance to a new address.
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "ZeroOwner");
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }

    /// @notice Returns the permissions flags expected by the v4 PoolManager.
    function getHookPermissions() public pure returns (Hooks.Permissions memory) {
        return Hooks.Permissions({
            beforeInitialize: false,
            afterInitialize: true,
            beforeAddLiquidity: false,
            afterAddLiquidity: false,
            beforeRemoveLiquidity: false,
            afterRemoveLiquidity: false,
            beforeSwap: true,
            afterSwap: true,
            beforeDonate: false,
            afterDonate: false,
            beforeSwapReturnDelta: false,
            afterSwapReturnDelta: false,
            afterAddLiquidityReturnDelta: false,
            afterRemoveLiquidityReturnDelta: false
        });
    }

    // ==========================================
    //            HOOK CALLBACKS
    // ==========================================

    function afterInitialize(
        address,
        PoolKey calldata key,
        uint160,
        int24 tick
    ) external override onlyPoolManager returns (bytes4) {
        PoolId poolId = key.toId();
        poolRegistered[poolId] = true;
        poolOracles[poolId].initialize(tick);
        return IHooks.afterInitialize.selector;
    }

    function beforeSwap(
        address,
        PoolKey calldata key,
        SwapParams calldata,
        bytes calldata
    ) external override onlyPoolManager returns (bytes4, BeforeSwapDelta, uint24) {
        PoolId poolId = key.toId();
        (, int24 spotTick, , ) = StateLibrary.getSlot0(poolManager, poolId);
        poolOracles[poolId].write(spotTick);
        return (IHooks.beforeSwap.selector, BeforeSwapDeltaLibrary.ZERO_DELTA, 0);
    }

    function afterSwap(
        address,
        PoolKey calldata key,
        SwapParams calldata,
        BalanceDelta,
        bytes calldata
    ) external override onlyPoolManager returns (bytes4, int128) {
        PoolId poolId = key.toId();
        (, int24 spotTick, , ) = StateLibrary.getSlot0(poolManager, poolId);

        uint256[] storage vaultList = poolVaults[poolId];
        uint256 len = vaultList.length;
        if (len > MAX_VAULTS_PER_POOL) len = MAX_VAULTS_PER_POOL;

        for (uint256 i = 0; i < len; i++) {
            uint256 vId = vaultList[i];
            Vault storage v = vaults[vId];
            if (spotTick < v.mandate.minTick || spotTick > v.mandate.maxTick) {
                if (!v.bandLeft) {
                    v.bandLeft = true;
                    emit BandLeft(vId, spotTick);
                }
            }
        }

        return (IHooks.afterSwap.selector, 0);
    }

    // Unimplemented hook entrypoints revert gracefully
    function beforeInitialize(address, PoolKey calldata, uint160) external pure override returns (bytes4) {
        revert HookNotImplemented();
    }

    function beforeAddLiquidity(address, PoolKey calldata, ModifyLiquidityParams calldata, bytes calldata) external pure override returns (bytes4) {
        revert HookNotImplemented();
    }

    function afterAddLiquidity(address, PoolKey calldata, ModifyLiquidityParams calldata, BalanceDelta, BalanceDelta, bytes calldata) external pure override returns (bytes4, BalanceDelta) {
        revert HookNotImplemented();
    }

    function beforeRemoveLiquidity(address, PoolKey calldata, ModifyLiquidityParams calldata, bytes calldata) external pure override returns (bytes4) {
        revert HookNotImplemented();
    }

    function afterRemoveLiquidity(address, PoolKey calldata, ModifyLiquidityParams calldata, BalanceDelta, BalanceDelta, bytes calldata) external pure override returns (bytes4, BalanceDelta) {
        revert HookNotImplemented();
    }

    function beforeDonate(address, PoolKey calldata, uint256, uint256, bytes calldata) external pure override returns (bytes4) {
        revert HookNotImplemented();
    }

    function afterDonate(address, PoolKey calldata, uint256, uint256, bytes calldata) external pure override returns (bytes4) {
        revert HookNotImplemented();
    }

    // ==========================================
    //            VAULT CREATION & MANDATE
    // ==========================================

    function createVault(
        PoolKey calldata key,
        uint16 perfFeeBps,
        Mandate calldata mandate
    ) external returns (uint256 vaultId) {
        require(perfFeeBps <= MAX_PERF_FEE_BPS, "PerfFeeTooHigh");
        MandateLib.validateMandate(mandate);

        PoolId poolId = key.toId();
        if (poolVaults[poolId].length >= MAX_VAULTS_PER_POOL) revert MaxVaultsReached();

        vaultId = nextVaultId++;
        Vault storage v = vaults[vaultId];
        v.curator = msg.sender;
        v.poolKey = key;
        v.perfFeeBps = perfFeeBps;
        v.mandate = mandate;
        v.capacityMultiplier = 5;
        v.epoch = 1;
        v.epochStart = block.timestamp;

        if (poolRegistered[poolId]) {
            (v.feeGrowthGlobal0X128Snapshot, v.feeGrowthGlobal1X128Snapshot) = StateLibrary.getFeeGrowthGlobals(poolManager, poolId);
        }

        poolVaults[poolId].push(vaultId);

        emit VaultCreated(vaultId, msg.sender, poolId, perfFeeBps);
        emit MandateSet(vaultId, mandate, 1);
    }

    function proposeMandate(uint256 vaultId, Mandate calldata mandate) external {
        Vault storage v = vaults[vaultId];
        if (msg.sender != v.curator) revert OnlyCurator();
        MandateLib.validateMandate(mandate);

        v.pendingMandate = mandate;
        v.hasPendingMandate = true;

        emit MandateSet(vaultId, mandate, v.epoch + 1);
    }

    // ==========================================
    //            BOND & CAPACITY
    // ==========================================

    function postBond(uint256 vaultId, uint256 amount) external {
        Vault storage v = vaults[vaultId];
        require(v.curator != address(0), "VaultNotFound");

        bondToken.safeTransferFrom(msg.sender, address(this), amount);
        v.bond += amount;
        v.bondUnlockTime = block.timestamp + BOND_WITHDRAW_COOLDOWN;

        emit BondChanged(vaultId, v.bond, v.bond * v.capacityMultiplier);
    }

    function withdrawBond(uint256 vaultId, uint256 amount) external {
        Vault storage v = vaults[vaultId];
        if (msg.sender != v.curator) revert OnlyCurator();
        if (block.timestamp < v.bondUnlockTime) revert CooldownActive();

        uint256 currentVal = getVaultValue(vaultId);
        uint256 requiredBond = (currentVal + v.capacityMultiplier - 1) / v.capacityMultiplier;
        if (v.bond - amount < requiredBond) revert InsufficientBond();

        v.bond -= amount;
        bondToken.safeTransfer(msg.sender, amount);

        emit BondChanged(vaultId, v.bond, v.bond * v.capacityMultiplier);
    }

    // ==========================================
    //            DEPOSIT & WITHDRAW QUEUES
    // ==========================================

    function deposit(uint256 vaultId, uint256 amount0, uint256 amount1) external {
        Vault storage v = vaults[vaultId];
        require(v.curator != address(0), "VaultNotFound");

        uint160 twapSqrtPrice = getTwapSqrtPrice(v.poolKey.toId());
        uint256 depValue = PaceLib.token0ToToken1Value(amount0, twapSqrtPrice) + amount1;
        uint256 currentVal = getVaultValue(vaultId);
        if (currentVal + depValue > v.bond * v.capacityMultiplier) revert CapacityExceeded();

        if (amount0 > 0) {
            IERC20(Currency.unwrap(v.poolKey.currency0)).safeTransferFrom(msg.sender, address(this), amount0);
            vaultIdle0[vaultId] += amount0;
        }
        if (amount1 > 0) {
            IERC20(Currency.unwrap(v.poolKey.currency1)).safeTransferFrom(msg.sender, address(this), amount1);
            vaultIdle1[vaultId] += amount1;
        }

        vaultDeposits[vaultId].push(QueuedDeposit({follower: msg.sender, amount0: amount0, amount1: amount1}));
        emit DepositQueued(vaultId, msg.sender, amount0, amount1);
    }

    function requestWithdraw(uint256 vaultId, uint256 shares) external {
        Vault storage v = vaults[vaultId];
        if (vaultFollowerShares[vaultId][msg.sender] < shares) revert InsufficientShares();

        vaultFollowerShares[vaultId][msg.sender] -= shares;
        vaultWithdraws[vaultId].push(QueuedWithdraw({follower: msg.sender, shares: shares}));

        emit WithdrawQueued(vaultId, msg.sender, shares);
    }

    // ==========================================
    //            REBALANCE & PARKING
    // ==========================================

    function rebalance(uint256 vaultId, Range[] calldata ranges) external {
        Vault storage v = vaults[vaultId];
        if (msg.sender != v.curator) revert OnlyCurator();
        if (v.isFrozen) revert VaultFrozen();

        MandateLib.validateRanges(v.mandate, ranges, v.poolKey.tickSpacing);

        uint160 twapSqrtPrice = getTwapSqrtPrice(v.poolKey.toId());
        uint256 totalVaultVal = getVaultValue(vaultId);

        for (uint256 i = 0; i < ranges.length; i++) {
            (uint256 a0, uint256 a1) = LiquidityAmounts.getAmountsForLiquidity(
                twapSqrtPrice,
                TickMath.getSqrtPriceAtTick(ranges[i].tickLower),
                TickMath.getSqrtPriceAtTick(ranges[i].tickUpper),
                ranges[i].liquidity
            );
            uint256 rangeVal = PaceLib.token0ToToken1Value(a0, twapSqrtPrice) + a1;
            MandateLib.validateConcentration(rangeVal, totalVaultVal, v.mandate.maxConcentrationBps);
        }

        poolManager.unlock(abi.encode(UnlockCallbackData({
            action: 1,
            vaultId: vaultId,
            newRanges: ranges
        })));

        delete vaultPositions[vaultId];
        for (uint256 i = 0; i < ranges.length; i++) {
            vaultPositions[vaultId].push(ranges[i]);
        }

        (, int24 currentTick, , ) = StateLibrary.getSlot0(poolManager, v.poolKey.toId());
        if (currentTick >= v.mandate.minTick && currentTick <= v.mandate.maxTick) {
            v.bandLeft = false;
        }

        emit Rebalanced(vaultId, ranges);
    }

    function enforce(uint256 vaultId) external {
        Vault storage v = vaults[vaultId];
        PoolId poolId = v.poolKey.toId();
        verifySpotDeviation(poolId);

        uint256 vaultVal = getVaultValue(vaultId);
        uint256 paceVal = getPaceValue(vaultId);

        if (vaultVal < paceVal) {
            uint256 shortfall = paceVal - vaultVal;
            uint256 shortfallBps = FullMath.mulDiv(shortfall, 10000, paceVal);
            if (shortfallBps >= v.mandate.maxShortfallBps) {
                v.isFrozen = true;
                v.record.timesParked++;

                poolManager.unlock(abi.encode(UnlockCallbackData({
                    action: 2,
                    vaultId: vaultId,
                    newRanges: new Range[](0)
                })));

                emit VaultParked(vaultId, v.epoch, shortfallBps);
                return;
            }
            revert VaultNotParkable(shortfallBps, v.mandate.maxShortfallBps);
        }
        revert VaultNotParkable(0, v.mandate.maxShortfallBps);
    }

    // ==========================================
    //               SETTLEMENT
    // ==========================================

    function settle(uint256 vaultId) external {
        Vault storage v = vaults[vaultId];
        if (block.timestamp < v.epochStart + epochLength) revert EpochNotEnded();

        PoolId poolId = v.poolKey.toId();
        verifySpotDeviation(poolId);

        uint256 vaultVal = getVaultValue(vaultId);
        uint256 paceVal = getPaceValue(vaultId);

        SettlementLib.SettlementResult memory res = SettlementLib.computeSettlement(
            vaultVal,
            paceVal,
            v.bond,
            v.deficit,
            v.perfFeeBps,
            v.capacityMultiplier,
            v.totalShares
        );

        if (res.isAhead) {
            v.record.epochsAhead++;
            v.record.cumulativeExcess += res.gap;
        } else {
            v.record.epochsBehind++;
            v.record.cumulativeExcess += res.gap;
        }

        v.bond = res.newBond;
        v.deficit = res.newDeficit;
        v.capacityMultiplier = res.newMultiplier;

        if (res.feeShares > 0) {
            vaultFollowerShares[vaultId][v.curator] += res.feeShares;
            v.totalShares += res.feeShares;
        }

        if (res.bondPayout > 0) {
            vaultIdle1[vaultId] += res.bondPayout;
        }

        if (v.hasPendingMandate) {
            v.mandate = v.pendingMandate;
            v.hasPendingMandate = false;
            emit MandateSet(vaultId, v.mandate, v.epoch + 1);
        }

        v.isFrozen = false;
        v.bandLeft = false;

        uint256 netVal = res.netVaultValue;
        QueuedWithdraw[] storage wQueue = vaultWithdraws[vaultId];
        for (uint256 i = 0; i < wQueue.length; i++) {
            QueuedWithdraw memory qw = wQueue[i];
            if (v.totalShares > 0 && qw.shares > 0) {
                uint256 payout = FullMath.mulDiv(qw.shares, netVal, v.totalShares);
                v.totalShares -= qw.shares;
                if (netVal >= payout) netVal -= payout;
                if (vaultIdle1[vaultId] >= payout) {
                    vaultIdle1[vaultId] -= payout;
                    IERC20(Currency.unwrap(v.poolKey.currency1)).safeTransfer(qw.follower, payout);
                }
            }
        }
        delete vaultWithdraws[vaultId];

        uint160 twapSqrtPrice = getTwapSqrtPrice(poolId);
        QueuedDeposit[] storage dQueue = vaultDeposits[vaultId];
        for (uint256 i = 0; i < dQueue.length; i++) {
            QueuedDeposit memory qd = dQueue[i];
            uint256 depVal = PaceLib.token0ToToken1Value(qd.amount0, twapSqrtPrice) + qd.amount1;
            uint256 sharesToMint = (v.totalShares == 0 || netVal == 0)
                ? depVal
                : FullMath.mulDiv(depVal, v.totalShares, netVal);

            vaultFollowerShares[vaultId][qd.follower] += sharesToMint;
            v.totalShares += sharesToMint;
            netVal += depVal;
        }
        delete vaultDeposits[vaultId];

        v.startValue = getVaultValue(vaultId);
        v.paceLiquidity = PaceLib.computePaceLiquidity(v.startValue, twapSqrtPrice);
        (v.feeGrowthGlobal0X128Snapshot, v.feeGrowthGlobal1X128Snapshot) = StateLibrary.getFeeGrowthGlobals(poolManager, poolId);

        emit Settled(vaultId, v.epoch, vaultVal, paceVal, res.fee, res.bondPayout, res.newDeficit);

        v.epochStart = block.timestamp;
        v.epoch++;
    }

    // ==========================================
    //            UNLOCK CALLBACK
    // ==========================================

    function unlockCallback(bytes calldata data) external override returns (bytes memory) {
        if (msg.sender != address(poolManager)) revert NotPoolManager();

        UnlockCallbackData memory decoded = abi.decode(data, (UnlockCallbackData));
        uint256 vId = decoded.vaultId;
        Vault storage v = vaults[vId];

        Range[] storage currentPositions = vaultPositions[vId];
        for (uint256 i = 0; i < currentPositions.length; i++) {
            Range memory r = currentPositions[i];
            if (r.liquidity > 0) {
                (BalanceDelta delta, ) = poolManager.modifyLiquidity(
                    v.poolKey,
                    ModifyLiquidityParams({
                        tickLower: r.tickLower,
                        tickUpper: r.tickUpper,
                        liquidityDelta: -int256(uint256(r.liquidity)),
                        salt: bytes32(vId)
                    }),
                    ""
                );
                _settleDeltas(v.poolKey, delta, vId);
            }
        }

        if (decoded.action == 1) {
            for (uint256 i = 0; i < decoded.newRanges.length; i++) {
                Range memory r = decoded.newRanges[i];
                if (r.liquidity > 0) {
                    (BalanceDelta delta, ) = poolManager.modifyLiquidity(
                        v.poolKey,
                        ModifyLiquidityParams({
                            tickLower: r.tickLower,
                            tickUpper: r.tickUpper,
                            liquidityDelta: int256(uint256(r.liquidity)),
                            salt: bytes32(vId)
                        }),
                        ""
                    );
                    _settleDeltas(v.poolKey, delta, vId);
                }
            }
        } else if (decoded.action == 2) {
            int24 tickLower = TickMath.minUsableTick(v.poolKey.tickSpacing);
            int24 tickUpper = TickMath.maxUsableTick(v.poolKey.tickSpacing);

            uint160 twapSqrtPrice = getTwapSqrtPrice(v.poolKey.toId());
            uint128 parkLiquidity = LiquidityAmounts.getLiquidityForAmounts(
                twapSqrtPrice,
                TickMath.getSqrtPriceAtTick(tickLower),
                TickMath.getSqrtPriceAtTick(tickUpper),
                vaultIdle0[vId],
                vaultIdle1[vId]
            );

            delete vaultPositions[vId];
            if (parkLiquidity > 0) {
                (BalanceDelta delta, ) = poolManager.modifyLiquidity(
                    v.poolKey,
                    ModifyLiquidityParams({
                        tickLower: tickLower,
                        tickUpper: tickUpper,
                        liquidityDelta: int256(uint256(parkLiquidity)),
                        salt: bytes32(vId)
                    }),
                    ""
                );
                _settleDeltas(v.poolKey, delta, vId);
                vaultPositions[vId].push(Range({tickLower: tickLower, tickUpper: tickUpper, liquidity: parkLiquidity}));
            }
        }

        return "";
    }

    function _settleDeltas(PoolKey memory key, BalanceDelta delta, uint256 vaultId) internal {
        int128 d0 = delta.amount0();
        int128 d1 = delta.amount1();

        if (d0 > 0) {
            uint256 take0 = uint256(int256(d0));
            poolManager.take(key.currency0, address(this), take0);
            vaultIdle0[vaultId] += take0;
        } else if (d0 < 0) {
            uint256 pay0 = uint256(int256(-d0));
            require(vaultIdle0[vaultId] >= pay0, "InsufficientIdle0");
            vaultIdle0[vaultId] -= pay0;
            IERC20(Currency.unwrap(key.currency0)).safeTransfer(address(poolManager), pay0);
            poolManager.settle();
        }

        if (d1 > 0) {
            uint256 take1 = uint256(int256(d1));
            poolManager.take(key.currency1, address(this), take1);
            vaultIdle1[vaultId] += take1;
        } else if (d1 < 0) {
            uint256 pay1 = uint256(int256(-d1));
            require(vaultIdle1[vaultId] >= pay1, "InsufficientIdle1");
            vaultIdle1[vaultId] -= pay1;
            IERC20(Currency.unwrap(key.currency1)).safeTransfer(address(poolManager), pay1);
            poolManager.settle();
        }
    }

    // ==========================================
    //            VALUATION HELPERS
    // ==========================================

    function getVaultValue(uint256 vaultId) public view returns (uint256) {
        Vault storage v = vaults[vaultId];
        PoolId poolId = v.poolKey.toId();
        uint160 twapSqrtPrice = getTwapSqrtPrice(poolId);

        uint256 totalVal = vaultIdle1[vaultId] + PaceLib.token0ToToken1Value(vaultIdle0[vaultId], twapSqrtPrice);

        Range[] storage positions = vaultPositions[vaultId];
        for (uint256 i = 0; i < positions.length; i++) {
            Range memory r = positions[i];
            if (r.liquidity > 0) {
                (uint256 a0, uint256 a1) = LiquidityAmounts.getAmountsForLiquidity(
                    twapSqrtPrice,
                    TickMath.getSqrtPriceAtTick(r.tickLower),
                    TickMath.getSqrtPriceAtTick(r.tickUpper),
                    r.liquidity
                );
                totalVal += a1 + PaceLib.token0ToToken1Value(a0, twapSqrtPrice);
            }
        }
        return totalVal;
    }

    function getPaceValue(uint256 vaultId) public view returns (uint256) {
        Vault storage v = vaults[vaultId];
        PoolId poolId = v.poolKey.toId();
        uint160 twapSqrtPrice = getTwapSqrtPrice(poolId);

        (uint256 currentFeeGrowth0, uint256 currentFeeGrowth1) = StateLibrary.getFeeGrowthGlobals(poolManager, poolId);

        uint256 dF0 = currentFeeGrowth0 >= v.feeGrowthGlobal0X128Snapshot
            ? currentFeeGrowth0 - v.feeGrowthGlobal0X128Snapshot
            : (type(uint256).max - v.feeGrowthGlobal0X128Snapshot + currentFeeGrowth0 + 1);

        uint256 dF1 = currentFeeGrowth1 >= v.feeGrowthGlobal1X128Snapshot
            ? currentFeeGrowth1 - v.feeGrowthGlobal1X128Snapshot
            : (type(uint256).max - v.feeGrowthGlobal1X128Snapshot + currentFeeGrowth1 + 1);

        return PaceLib.computePaceValue(v.paceLiquidity, twapSqrtPrice, dF0, dF1);
    }

    function getTwapSqrtPrice(PoolId poolId) public view returns (uint160) {
        (, int24 spotTick, , ) = StateLibrary.getSlot0(poolManager, poolId);
        int24 twapTick = poolOracles[poolId].getTwapTick(twapWindow, spotTick);
        return TickMath.getSqrtPriceAtTick(twapTick);
    }

    function verifySpotDeviation(PoolId poolId) public view {
        (, int24 spotTick, , ) = StateLibrary.getSlot0(poolManager, poolId);
        int24 twapTick = poolOracles[poolId].getTwapTick(twapWindow, spotTick);
        int24 diff = spotTick > twapTick ? spotTick - twapTick : twapTick - spotTick;
        if (diff > maxSpotDeviationTicks) revert SpotDeviationTooHigh(spotTick, twapTick);
    }

    function getVaultPositions(uint256 vaultId) external view returns (Range[] memory) {
        return vaultPositions[vaultId];
    }

    function getVault(uint256 vaultId) external view returns (Vault memory) {
        return vaults[vaultId];
    }

    function getVaultRecord(uint256 vaultId) external view returns (Record memory) {
        return vaults[vaultId].record;
    }

    function getVaultMandate(uint256 vaultId) external view returns (Mandate memory) {
        return vaults[vaultId].mandate;
    }

    function getVaultBond(uint256 vaultId) external view returns (uint256) {
        return vaults[vaultId].bond;
    }

    function getVaultMultiplier(uint256 vaultId) external view returns (uint256) {
        return vaults[vaultId].capacityMultiplier;
    }

    function isVaultFrozen(uint256 vaultId) external view returns (bool) {
        return vaults[vaultId].isFrozen;
    }

    function isVaultBandLeft(uint256 vaultId) external view returns (bool) {
        return vaults[vaultId].bandLeft;
    }

    // Storage gap for upgrade safety (prevents storage collisions across versions)
    uint256[50] private __gap;
}

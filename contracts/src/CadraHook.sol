// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import {BaseHook} from "uniswap-hooks/base/BaseHook.sol";
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
import {ReentrancyGuardTransient} from "@openzeppelin/contracts/utils/ReentrancyGuardTransient.sol";
import {FullMath} from "@uniswap/v4-core/src/libraries/FullMath.sol";

import {Mandate, Range} from "./types/Mandate.sol";
import {Vault, Record, QueuedDeposit, QueuedWithdraw} from "./types/Vault.sol";
import {PaceLib} from "./libraries/PaceLib.sol";
import {SettlementLib} from "./libraries/SettlementLib.sol";
import {MandateLib} from "./libraries/MandateLib.sol";
import {TwapOracle} from "./libraries/TwapOracle.sol";

/// @title CadraHook
/// @notice Uniswap v4 hook for curated liquidity benchmarking against the Pace.
contract CadraHook is BaseHook, IUnlockCallback, ReentrancyGuardTransient {
    using PoolIdLibrary for PoolKey;
    using CurrencyLibrary for Currency;
    using SafeERC20 for IERC20;
    using TwapOracle for TwapOracle.Buffer;

    uint256 internal constant MAX_PERF_FEE_BPS = 3000; // 30%
    uint256 internal constant MAX_VAULTS_PER_POOL = 32;
    uint256 internal constant SETTLEMENT_GRACE_PERIOD = 1 hours;
    uint256 internal constant BOND_WITHDRAW_COOLDOWN = 1 days;

    IERC20 internal immutable bondToken;
    uint256 internal immutable epochLength;
    uint32 internal immutable twapWindow;
    int24 internal immutable maxSpotDeviationTicks;

    uint256 public nextVaultId = 1;

    address public owner;
    address public protocolTreasury;
    uint16 public protocolFeeBps = 100; // 100 bps = 1.00% of excess profit

    mapping(uint256 => Vault) internal vaults;
    mapping(uint256 => Range[]) internal vaultPositions;
    mapping(uint256 => mapping(address => uint256)) public vaultFollowerShares;
    mapping(uint256 => QueuedDeposit[]) internal vaultDeposits;
    mapping(uint256 => QueuedWithdraw[]) internal vaultWithdraws;

    mapping(PoolId => uint256[]) internal poolVaults;
    mapping(PoolId => TwapOracle.Buffer) internal poolOracles;
    mapping(PoolId => bool) internal poolRegistered;

    // Hook idle token balances per vault
    mapping(uint256 => uint256) public vaultIdle0;
    mapping(uint256 => uint256) public vaultIdle1;

    // Pending deposit balances (held in escrow during epoch, activated at settle)
    mapping(uint256 => uint256) public vaultPending0;
    mapping(uint256 => uint256) public vaultPending1;

    // Signaled status for Reactive settlement
    mapping(uint256 => bool) public epochReadySignaled;

    // Safe tick envelope & active mask for gas-optimized afterSwap
    mapping(PoolId => int24) internal poolSafeMinTick;
    mapping(PoolId => int24) internal poolSafeMaxTick;
    mapping(PoolId => uint32) public poolActiveBandMask;
    mapping(uint256 => uint256) internal vaultIndexInPool;

    // Events
    event VaultCreated(uint256 indexed vaultId, address indexed curator, PoolId indexed poolId, uint16 perfFeeBps);
    event MandateSet(uint256 indexed vaultId, Mandate mandate, uint256 effectiveEpoch);
    event BondChanged(uint256 indexed vaultId, uint256 bond, uint256 capacity);
    event DepositQueued(uint256 indexed vaultId, address indexed follower, uint256 amount0, uint256 amount1);
    event WithdrawQueued(uint256 indexed vaultId, address indexed follower, uint256 shares);
    event WithdrawProcessed(
        uint256 indexed vaultId, address indexed follower, uint256 amount0, uint256 amount1, uint256 shares
    );
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
        uint256 deficit,
        uint256 protocolFee
    );
    event EpochReady(uint256 indexed vaultId, uint256 epoch);
    event ProtocolTreasuryUpdated(address indexed oldTreasury, address indexed newTreasury);
    event ProtocolFeeBpsUpdated(uint16 oldBps, uint16 newBps);

    // Errors
    error OnlyOwner();
    error ProtocolFeeTooHigh();
    error OnlyCurator();
    error VaultFrozen();
    error EpochNotEnded();
    error CapacityExceeded();
    error InsufficientBond();
    error CooldownActive();
    error InsufficientShares();
    error SpotDeviationTooHigh(int24 spotTick, int24 twapTick);
    error MaxVaultsReached();
    error ZeroLiquidity();
    error PerfFeeTooHigh();
    error VaultNotFound();
    error ZeroDeposit();
    error SlippageExceeded();
    error InsufficientIdle();
    error AlreadySignaled();
    error ZeroAmount();
    error BondCurrencyMismatch();

    struct UnlockCallbackData {
        uint8 action; // 1: rebalance, 2: park, 3: fullRangeInit, 4: withdrawUnwind
        uint256 vaultId;
        Range[] newRanges;
    }

    constructor(
        IPoolManager _poolManager,
        IERC20 _bondToken,
        uint256 _epochLength,
        uint32 _twapWindow,
        int24 _maxSpotDeviationTicks,
        address _owner
    ) BaseHook(_poolManager) {
        bondToken = _bondToken;
        epochLength = _epochLength;
        twapWindow = _twapWindow;
        maxSpotDeviationTicks = _maxSpotDeviationTicks;
        // CREATE2 deployer is msg.sender during construction; pass the real admin explicitly.
        owner = _owner;
        protocolTreasury = _owner;
    }

    function getHookPermissions() public pure override returns (Hooks.Permissions memory) {
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

    function _afterInitialize(address, PoolKey calldata key, uint160, int24 tick) internal override returns (bytes4) {
        PoolId poolId = key.toId();
        poolRegistered[poolId] = true;
        poolOracles[poolId].initialize(tick);
        return this.afterInitialize.selector;
    }

    function _beforeSwap(address, PoolKey calldata key, SwapParams calldata, bytes calldata)
        internal
        override
        returns (bytes4, BeforeSwapDelta, uint24)
    {
        PoolId poolId = key.toId();
        (, int24 spotTick,,) = StateLibrary.getSlot0(poolManager, poolId);
        poolOracles[poolId].write(spotTick);
        return (this.beforeSwap.selector, BeforeSwapDeltaLibrary.ZERO_DELTA, 0);
    }

    function _afterSwap(address, PoolKey calldata key, SwapParams calldata, BalanceDelta, bytes calldata)
        internal
        override
        returns (bytes4, int128)
    {
        PoolId poolId = key.toId();
        uint32 activeMask = poolActiveBandMask[poolId];
        if (activeMask == 0) return (this.afterSwap.selector, 0);

        (, int24 spotTick,,) = StateLibrary.getSlot0(poolManager, poolId);

        // Fast-path: spotTick is within the safe envelope of all active vaults (no loop, ~97% gas reduction)
        int24 safeMin = poolSafeMinTick[poolId];
        int24 safeMax = poolSafeMaxTick[poolId];
        if (safeMin <= safeMax && spotTick >= safeMin && spotTick <= safeMax) {
            return (this.afterSwap.selector, 0);
        }

        // Slow-path: check only vaults that haven't left band yet
        uint256[] storage vaultList = poolVaults[poolId];
        uint256 len = vaultList.length;
        if (len > MAX_VAULTS_PER_POOL) len = MAX_VAULTS_PER_POOL;

        for (uint256 i = 0; i < len; i++) {
            if ((activeMask & (uint32(1) << uint32(i))) == 0) continue;
            Vault storage v = vaults[vaultList[i]];
            if (spotTick < v.mandate.minTick || spotTick > v.mandate.maxTick) {
                v.bandLeft = true;
                activeMask &= ~(uint32(1) << uint32(i));
                emit BandLeft(vaultList[i], spotTick);
            }
        }
        poolActiveBandMask[poolId] = activeMask;

        return (this.afterSwap.selector, 0);
    }

    // ==========================================
    //            PROTOCOL ADMIN & FEES
    // ==========================================

    function setProtocolTreasury(address _newTreasury) external {
        if (msg.sender != owner) revert OnlyOwner();
        require(_newTreasury != address(0), "ZeroAddress");
        address oldTreasury = protocolTreasury;
        protocolTreasury = _newTreasury;
        emit ProtocolTreasuryUpdated(oldTreasury, _newTreasury);
    }

    function setProtocolFeeBps(uint16 _newFeeBps) external {
        if (msg.sender != owner) revert OnlyOwner();
        if (_newFeeBps > 500) revert ProtocolFeeTooHigh(); // Maximum 5% safety cap
        uint16 oldBps = protocolFeeBps;
        protocolFeeBps = _newFeeBps;
        emit ProtocolFeeBpsUpdated(oldBps, _newFeeBps);
    }

    function transferOwnership(address _newOwner) external {
        if (msg.sender != owner) revert OnlyOwner();
        require(_newOwner != address(0), "ZeroAddress");
        owner = _newOwner;
    }

    // ==========================================
    //            VAULT CREATION & MANDATE
    // ==========================================

    function createVault(PoolKey calldata key, uint16 perfFeeBps, Mandate calldata mandate, uint256 initialBond)
        external
        nonReentrant
        returns (uint256 vaultId)
    {
        if (perfFeeBps > MAX_PERF_FEE_BPS) revert PerfFeeTooHigh();
        if (initialBond == 0) revert ZeroAmount();
        MandateLib.validateMandate(mandate);

        // Bond must be one of the pool currencies so settle payouts cannot DoS.
        address bt = address(bondToken);
        if (bt != Currency.unwrap(key.currency0) && bt != Currency.unwrap(key.currency1)) {
            revert BondCurrencyMismatch();
        }

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

        bondToken.safeTransferFrom(msg.sender, address(this), initialBond);
        v.bond = initialBond;
        v.bondUnlockTime = block.timestamp + BOND_WITHDRAW_COOLDOWN;

        uint256 idx = poolVaults[poolId].length;
        vaultIndexInPool[vaultId] = idx;
        poolVaults[poolId].push(vaultId);

        // Update safe tick envelope for afterSwap fast-path
        if (poolActiveBandMask[poolId] == 0) {
            poolSafeMinTick[poolId] = mandate.minTick;
            poolSafeMaxTick[poolId] = mandate.maxTick;
        } else {
            if (mandate.minTick > poolSafeMinTick[poolId]) {
                poolSafeMinTick[poolId] = mandate.minTick;
            }
            if (mandate.maxTick < poolSafeMaxTick[poolId]) {
                poolSafeMaxTick[poolId] = mandate.maxTick;
            }
        }
        if (idx < 32) {
            poolActiveBandMask[poolId] |= uint32(1) << uint32(idx);
        }

        emit VaultCreated(vaultId, msg.sender, poolId, perfFeeBps);
        emit BondChanged(vaultId, v.bond, _bondValueInToken1(v, getTwapSqrtPrice(poolId)) * v.capacityMultiplier);
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

    function postBond(uint256 vaultId, uint256 amount) external nonReentrant {
        Vault storage v = vaults[vaultId];
        if (v.curator == address(0)) revert VaultNotFound();

        bondToken.safeTransferFrom(msg.sender, address(this), amount);
        v.bond += amount;
        v.bondUnlockTime = block.timestamp + BOND_WITHDRAW_COOLDOWN;

        emit BondChanged(
            vaultId, v.bond, _bondValueInToken1(v, getTwapSqrtPrice(v.poolKey.toId())) * v.capacityMultiplier
        );
    }

    function withdrawBond(uint256 vaultId, uint256 amount) external nonReentrant {
        Vault storage v = vaults[vaultId];
        if (msg.sender != v.curator) revert OnlyCurator();
        if (block.timestamp < v.bondUnlockTime) revert CooldownActive();

        uint256 currentVal = getVaultTotalValue(vaultId);
        uint256 requiredBond = (currentVal + v.capacityMultiplier - 1) / v.capacityMultiplier;
        // requiredBond is in token1; convert remaining bond to token1 for comparison.
        uint160 twapSqrtPrice = getTwapSqrtPrice(v.poolKey.toId());
        uint256 remainingBondVal = _bondValueInToken1(v, twapSqrtPrice);
        // remaining = bond - amount, but amount is bondToken units; convert amount too.
        uint256 amountVal = address(bondToken) == Currency.unwrap(v.poolKey.currency1)
            ? amount
            : PaceLib.token0ToToken1Value(amount, twapSqrtPrice);
        if (remainingBondVal < amountVal + requiredBond) revert InsufficientBond();

        v.bond -= amount;
        bondToken.safeTransfer(msg.sender, amount);

        emit BondChanged(vaultId, v.bond, _bondValueInToken1(v, twapSqrtPrice) * v.capacityMultiplier);
    }

    // ==========================================
    //            DEPOSIT & WITHDRAW QUEUES
    // ==========================================

    function deposit(uint256 vaultId, uint256 amount0, uint256 amount1) external returns (uint256) {
        return depositWithSlippage(vaultId, amount0, amount1, 0);
    }

    function depositWithSlippage(uint256 vaultId, uint256 amount0, uint256 amount1, uint256 minSharesOut)
        public
        nonReentrant
        returns (uint256 sharesToMint)
    {
        Vault storage v = vaults[vaultId];
        if (v.curator == address(0)) revert VaultNotFound();

        // Verify spot deviation to protect deposit-time valuation
        _checkSpotDeviation(v.poolKey.toId(), false);

        uint160 twapSqrtPrice = getTwapSqrtPrice(v.poolKey.toId());
        uint256 depValue = PaceLib.token0ToToken1Value(amount0, twapSqrtPrice) + amount1;
        if (depValue == 0) revert ZeroDeposit();

        // Capacity check: current active + pending + new deposit (bond converted to token1)
        uint256 currentVal = getVaultValue(vaultId);
        uint256 pendingVal = vaultPending1[vaultId] + PaceLib.token0ToToken1Value(vaultPending0[vaultId], twapSqrtPrice);
        uint256 bondVal = _bondValueInToken1(v, twapSqrtPrice);
        if (currentVal + pendingVal + depValue > bondVal * v.capacityMultiplier) revert CapacityExceeded();

        // Return an estimate for callers; final mint shares are calculated at settlement NAV.
        sharesToMint =
            (v.totalShares == 0 || currentVal == 0) ? depValue : FullMath.mulDiv(depValue, v.totalShares, currentVal);

        if (amount0 > 0) {
            IERC20(Currency.unwrap(v.poolKey.currency0)).safeTransferFrom(msg.sender, address(this), amount0);
            vaultPending0[vaultId] += amount0;
        }
        if (amount1 > 0) {
            IERC20(Currency.unwrap(v.poolKey.currency1)).safeTransferFrom(msg.sender, address(this), amount1);
            vaultPending1[vaultId] += amount1;
        }

        vaultDeposits[vaultId].push(
            QueuedDeposit({follower: msg.sender, amount0: amount0, amount1: amount1, minSharesOut: minSharesOut})
        );
        emit DepositQueued(vaultId, msg.sender, amount0, amount1);
    }

    function requestWithdraw(uint256 vaultId, uint256 shares) external nonReentrant {
        if (shares == 0) revert ZeroAmount();
        if (vaultFollowerShares[vaultId][msg.sender] < shares) revert InsufficientShares();

        vaultFollowerShares[vaultId][msg.sender] -= shares;
        vaultWithdraws[vaultId].push(QueuedWithdraw({follower: msg.sender, shares: shares}));

        emit WithdrawQueued(vaultId, msg.sender, shares);
    }

    function cancelWithdraw(uint256 vaultId) external nonReentrant {
        QueuedWithdraw[] storage queue = vaultWithdraws[vaultId];
        uint256 cancelled;
        for (uint256 i = 0; i < queue.length; i++) {
            if (queue[i].follower == msg.sender) {
                cancelled += queue[i].shares;
                queue[i].shares = 0;
            }
        }
        if (cancelled == 0) revert InsufficientShares();
        vaultFollowerShares[vaultId][msg.sender] += cancelled;
    }

    // ==========================================
    //            REBALANCE & PARKING
    // ==========================================

    function rebalance(uint256 vaultId, Range[] calldata ranges) external nonReentrant {
        Vault storage v = vaults[vaultId];
        if (msg.sender != v.curator) revert OnlyCurator();
        if (v.isFrozen) revert VaultFrozen();

        MandateLib.validateRanges(v.mandate, ranges, v.poolKey.tickSpacing);

        uint160 twapSqrtPrice = getTwapSqrtPrice(v.poolKey.toId());
        uint256 totalVaultVal = getVaultValue(vaultId);

        // Concentration check on each new range
        for (uint256 i = 0; i < ranges.length; i++) {
            MandateLib.validateConcentration(
                _rangeValue(twapSqrtPrice, ranges[i]), totalVaultVal, v.mandate.maxConcentrationBps
            );
        }

        // Execute position adjustments via PoolManager.unlock
        poolManager.unlock(abi.encode(UnlockCallbackData({action: 1, vaultId: vaultId, newRanges: ranges})));

        // Update stored positions
        delete vaultPositions[vaultId];
        for (uint256 i = 0; i < ranges.length; i++) {
            vaultPositions[vaultId].push(ranges[i]);
        }

        // Clear bandLeft if tick is within mandate and re-arm active mask
        (, int24 currentTick,,) = StateLibrary.getSlot0(poolManager, v.poolKey.toId());
        if (currentTick >= v.mandate.minTick && currentTick <= v.mandate.maxTick) {
            v.bandLeft = false;
            uint256 idx = vaultIndexInPool[vaultId];
            if (idx < 32) {
                poolActiveBandMask[v.poolKey.toId()] |= uint32(1) << uint32(idx);
            }
        }

        emit Rebalanced(vaultId, ranges);
    }

    function enforce(uint256 vaultId) external nonReentrant returns (bool) {
        Vault storage v = vaults[vaultId];
        if (v.curator == address(0) || v.isFrozen) return false;

        PoolId poolId = v.poolKey.toId();

        // Spot deviation check: verify without reverting so keeper automation does not revert
        (, int24 spotTick,,) = StateLibrary.getSlot0(poolManager, poolId);
        int24 twapTick = poolOracles[poolId].getTwapTick(twapWindow, spotTick);
        int24 diff = spotTick > twapTick ? spotTick - twapTick : twapTick - spotTick;
        if (diff > maxSpotDeviationTicks) return false;

        uint256 vaultVal = getVaultValue(vaultId);
        uint256 paceVal = getPaceValue(vaultId);

        // Ahead of Pace: no-op for keepers, cleanly returns false
        if (vaultVal >= paceVal) return false;

        uint256 shortfall = paceVal - vaultVal;
        uint256 shortfallBps = FullMath.mulDiv(shortfall, 10000, paceVal);
        // Shortfall below mandate threshold: no-op for keepers, cleanly returns false
        if (shortfallBps < v.mandate.maxShortfallBps) return false;

        v.isFrozen = true;
        v.record.timesParked++;

        // Remove existing positions and park into full range
        poolManager.unlock(abi.encode(UnlockCallbackData({action: 2, vaultId: vaultId, newRanges: new Range[](0)})));

        emit VaultParked(vaultId, v.epoch, shortfallBps);
        return true;
    }

    // ==========================================
    //               SETTLEMENT
    // ==========================================

    function settle(uint256 vaultId) external nonReentrant {
        Vault storage v = vaults[vaultId];
        uint256 epochEnd = v.epochStart + epochLength;
        if (block.timestamp < epochEnd) revert EpochNotEnded();

        PoolId poolId = v.poolKey.toId();
        // Fallback to pure TWAP if beyond grace period to ensure liveness against prolonged spot manipulation
        bool allowGraceFallback = block.timestamp >= epochEnd + SETTLEMENT_GRACE_PERIOD;
        _checkSpotDeviation(poolId, allowGraceFallback);

        uint256 vaultVal = getVaultValue(vaultId);
        uint256 paceVal = getPaceValue(vaultId);

        SettlementLib.SettlementResult memory res;
        if (v.epoch == 1) {
            // No Pace benchmark yet: neutral settlement (no fees, no multiplier change).
            res.newBond = v.bond;
            res.newDeficit = v.deficit;
            res.newMultiplier = v.capacityMultiplier;
        } else {
            res = SettlementLib.computeSettlement(
                vaultVal, paceVal, v.bond, v.deficit, v.perfFeeBps, protocolFeeBps, v.capacityMultiplier, v.totalShares
            );
        }

        // Update record
        if (res.isAhead) {
            v.record.epochsAhead++;
            v.record.cumulativeExcess += res.gap;
        } else {
            v.record.epochsBehind++;
            v.record.cumulativeExcess += res.gap;
        }

        // Apply state changes from settlement
        v.bond = res.newBond;
        v.deficit = res.newDeficit;
        v.capacityMultiplier = res.newMultiplier;

        // Mint fee shares to curator and protocol treasury
        if (res.curatorShares > 0) {
            vaultFollowerShares[vaultId][v.curator] += res.curatorShares;
        }
        if (res.protocolShares > 0 && protocolTreasury != address(0)) {
            vaultFollowerShares[vaultId][protocolTreasury] += res.protocolShares;
        }
        if (res.feeShares > 0) {
            v.totalShares += res.feeShares;
        }

        // Route bond payouts to the currency that backs the bond.
        // Bond currency is validated in createVault, so one branch always matches.
        if (res.bondPayout > 0) {
            if (address(bondToken) == Currency.unwrap(v.poolKey.currency1)) {
                vaultIdle1[vaultId] += res.bondPayout;
            } else {
                vaultIdle0[vaultId] += res.bondPayout;
            }
        }

        // Apply pending mandate
        if (v.hasPendingMandate) {
            v.mandate = v.pendingMandate;
            v.hasPendingMandate = false;
            emit MandateSet(vaultId, v.mandate, v.epoch + 1);
        }

        v.isFrozen = false;
        v.bandLeft = false;
        uint256 vIdx = vaultIndexInPool[vaultId];
        if (vIdx < 32) {
            poolActiveBandMask[poolId] |= uint32(1) << uint32(vIdx);
        }

        // Measure settlement NAV while pending deposits are still escrowed.
        // Activating them first would include depositor funds in NAV and under-mint shares.
        uint160 settlementSqrtPrice = getTwapSqrtPrice(poolId);
        uint256 navBeforeDeposits = getVaultValue(vaultId);
        uint256 sharesBeforeDeposits = v.totalShares;

        // Activate pending deposits into idle balances.
        uint256 p0 = vaultPending0[vaultId];
        if (p0 > 0) {
            vaultIdle0[vaultId] += p0;
            vaultPending0[vaultId] = 0;
        }
        uint256 p1 = vaultPending1[vaultId];
        if (p1 > 0) {
            vaultIdle1[vaultId] += p1;
            vaultPending1[vaultId] = 0;
        }

        QueuedDeposit[] storage dQueue = vaultDeposits[vaultId];
        for (uint256 i = 0; i < dQueue.length; i++) {
            QueuedDeposit memory qd = dQueue[i];
            uint256 depValue = PaceLib.token0ToToken1Value(qd.amount0, settlementSqrtPrice) + qd.amount1;
            if (depValue == 0) continue;

            uint256 sharesToMint = (sharesBeforeDeposits == 0 || navBeforeDeposits == 0)
                ? depValue
                : FullMath.mulDiv(depValue, sharesBeforeDeposits, navBeforeDeposits);
            if (sharesToMint < qd.minSharesOut) revert SlippageExceeded();

            vaultFollowerShares[vaultId][qd.follower] += sharesToMint;
            v.totalShares += sharesToMint;
        }
        delete vaultDeposits[vaultId];

        // Process withdrawals — pro-rata token0 and token1 payouts (never silently fails/skips)
        QueuedWithdraw[] storage wQueue = vaultWithdraws[vaultId];
        uint256 totalWithdrawShares = 0;
        for (uint256 i = 0; i < wQueue.length; i++) {
            totalWithdrawShares += wQueue[i].shares;
        }

        if (totalWithdrawShares > 0 && v.totalShares > 0) {
            // Unwind pro-rata liquidity if positions exist
            if (vaultPositions[vaultId].length > 0) {
                poolManager.unlock(
                    abi.encode(UnlockCallbackData({action: 4, vaultId: vaultId, newRanges: new Range[](0)}))
                );
            }

            uint256 sharesBasis = v.totalShares;
            uint256 avail0 = vaultIdle0[vaultId];
            uint256 avail1 = vaultIdle1[vaultId];

            for (uint256 i = 0; i < wQueue.length; i++) {
                QueuedWithdraw memory qw = wQueue[i];
                if (qw.shares > 0) {
                    uint256 pay0 = FullMath.mulDiv(avail0, qw.shares, sharesBasis);
                    uint256 pay1 = FullMath.mulDiv(avail1, qw.shares, sharesBasis);

                    v.totalShares -= qw.shares;
                    if (pay0 > 0) {
                        vaultIdle0[vaultId] -= pay0;
                        IERC20(Currency.unwrap(v.poolKey.currency0)).safeTransfer(qw.follower, pay0);
                    }
                    if (pay1 > 0) {
                        vaultIdle1[vaultId] -= pay1;
                        IERC20(Currency.unwrap(v.poolKey.currency1)).safeTransfer(qw.follower, pay1);
                    }
                    emit WithdrawProcessed(vaultId, qw.follower, pay0, pay1, qw.shares);
                }
            }
        }
        delete vaultWithdraws[vaultId];

        // Re-benchmark Pace for the next epoch
        uint160 twapSqrtPrice = getTwapSqrtPrice(poolId);
        v.startValue = getVaultValue(vaultId);
        v.paceLiquidity = PaceLib.computePaceLiquidity(v.startValue, twapSqrtPrice);
        emit Settled(
            vaultId, v.epoch, vaultVal, paceVal, res.curatorFee, res.bondPayout, res.newDeficit, res.protocolFee
        );

        v.epochStart = block.timestamp;
        v.epoch++;
        epochReadySignaled[vaultId] = false;
    }

    /// @notice Permissionless function to signal that an epoch has ended, emitting EpochReady for Reactive settlement.
    function signalEpochReady(uint256 vaultId) external {
        Vault storage v = vaults[vaultId];
        if (v.curator == address(0)) revert VaultNotFound();
        if (block.timestamp < v.epochStart + epochLength) revert EpochNotEnded();
        if (epochReadySignaled[vaultId]) revert AlreadySignaled();
        epochReadySignaled[vaultId] = true;
        emit EpochReady(vaultId, v.epoch);
    }

    // ==========================================
    //            UNLOCK CALLBACK
    // ==========================================

    function unlockCallback(bytes calldata data) external override returns (bytes memory) {
        if (msg.sender != address(poolManager)) revert();

        UnlockCallbackData memory decoded = abi.decode(data, (UnlockCallbackData));
        uint256 vId = decoded.vaultId;
        Vault storage v = vaults[vId];

        if (decoded.action == 1 || decoded.action == 2) {
            // Remove all existing positions for rebalance or parking
            Range[] storage currentPositions = vaultPositions[vId];
            for (uint256 i = 0; i < currentPositions.length; i++) {
                Range memory r = currentPositions[i];
                if (r.liquidity > 0) {
                    _modifyAndSettle(v.poolKey, vId, r.tickLower, r.tickUpper, -int256(uint256(r.liquidity)));
                }
            }

            if (decoded.action == 1) {
                // Rebalance: Add new ranges
                for (uint256 i = 0; i < decoded.newRanges.length; i++) {
                    Range memory r = decoded.newRanges[i];
                    if (r.liquidity > 0) {
                        _modifyAndSettle(v.poolKey, vId, r.tickLower, r.tickUpper, int256(uint256(r.liquidity)));
                    }
                }
            } else if (decoded.action == 2) {
                // Park: Add full-range position with available idle funds
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
                    _modifyAndSettle(v.poolKey, vId, tickLower, tickUpper, int256(uint256(parkLiquidity)));
                    vaultPositions[vId].push(
                        Range({tickLower: tickLower, tickUpper: tickUpper, liquidity: parkLiquidity})
                    );
                }
            }
        } else if (decoded.action == 4) {
            // Action 4: Unwind proportional liquidity for queued withdrawals
            QueuedWithdraw[] storage wQueue = vaultWithdraws[vId];
            uint256 wShares = 0;
            for (uint256 i = 0; i < wQueue.length; i++) {
                wShares += wQueue[i].shares;
            }

            if (wShares > 0 && v.totalShares > 0) {
                Range[] storage positions = vaultPositions[vId];
                for (uint256 i = 0; i < positions.length; i++) {
                    Range storage r = positions[i];
                    if (r.liquidity > 0) {
                        uint128 liqToRemove = uint128(FullMath.mulDiv(r.liquidity, wShares, v.totalShares));
                        if (liqToRemove > 0) {
                            _modifyAndSettle(v.poolKey, vId, r.tickLower, r.tickUpper, -int256(uint256(liqToRemove)));
                            r.liquidity -= liqToRemove;
                        }
                    }
                }
            }
        }

        return "";
    }

    function _modifyAndSettle(
        PoolKey memory key,
        uint256 vaultId,
        int24 tickLower,
        int24 tickUpper,
        int256 liquidityDelta
    ) internal {
        (BalanceDelta delta,) = poolManager.modifyLiquidity(
            key,
            ModifyLiquidityParams({
                tickLower: tickLower, tickUpper: tickUpper, liquidityDelta: liquidityDelta, salt: bytes32(vaultId)
            }),
            ""
        );
        _settleDeltas(key, delta, vaultId);
    }

    function _settleSingleDelta(Currency currency, int128 deltaAmt, uint256 currentIdle) internal returns (uint256) {
        if (deltaAmt > 0) {
            uint256 takeAmt = uint256(int256(deltaAmt));
            poolManager.take(currency, address(this), takeAmt);
            return currentIdle + takeAmt;
        } else if (deltaAmt < 0) {
            uint256 payAmt = uint256(int256(-deltaAmt));
            if (currentIdle < payAmt) revert InsufficientIdle();
            IERC20(Currency.unwrap(currency)).safeTransfer(address(poolManager), payAmt);
            poolManager.settle();
            return currentIdle - payAmt;
        }
        return currentIdle;
    }

    function _settleDeltas(PoolKey memory key, BalanceDelta delta, uint256 vaultId) internal {
        vaultIdle0[vaultId] = _settleSingleDelta(key.currency0, delta.amount0(), vaultIdle0[vaultId]);
        vaultIdle1[vaultId] = _settleSingleDelta(key.currency1, delta.amount1(), vaultIdle1[vaultId]);
    }

    // ==========================================
    //            VALUATION HELPERS
    // ==========================================

    function _rangeValue(uint160 twapSqrtPrice, Range memory r) internal pure returns (uint256) {
        if (r.liquidity == 0) return 0;
        (uint256 a0, uint256 a1) = LiquidityAmounts.getAmountsForLiquidity(
            twapSqrtPrice,
            TickMath.getSqrtPriceAtTick(r.tickLower),
            TickMath.getSqrtPriceAtTick(r.tickUpper),
            r.liquidity
        );
        return a1 + PaceLib.token0ToToken1Value(a0, twapSqrtPrice);
    }

    /// @dev Bond denominated in bondToken; convert to token1 (vault value unit) at TWAP.
    ///      createVault guarantees bondToken is currency0 or currency1 of the pool.
    function _bondValueInToken1(Vault storage v, uint160 twapSqrtPrice) internal view returns (uint256) {
        if (v.bond == 0) return 0;
        if (address(bondToken) == Currency.unwrap(v.poolKey.currency1)) return v.bond;
        return PaceLib.token0ToToken1Value(v.bond, twapSqrtPrice);
    }

    function getVaultValue(uint256 vaultId) public view returns (uint256) {
        Vault storage v = vaults[vaultId];
        PoolId poolId = v.poolKey.toId();
        uint160 twapSqrtPrice = getTwapSqrtPrice(poolId);

        uint256 totalVal = vaultIdle1[vaultId] + PaceLib.token0ToToken1Value(vaultIdle0[vaultId], twapSqrtPrice);

        Range[] storage positions = vaultPositions[vaultId];
        for (uint256 i = 0; i < positions.length; i++) {
            totalVal += _rangeValue(twapSqrtPrice, positions[i]);
        }
        return totalVal;
    }

    function getPaceValue(uint256 vaultId) public view returns (uint256) {
        Vault storage v = vaults[vaultId];
        PoolId poolId = v.poolKey.toId();
        uint160 twapSqrtPrice = getTwapSqrtPrice(poolId);

        // Do not use pool-wide feeGrowthGlobal here. It can be inflated by a
        // donation/self-trade and is not a reliable measure of passive full-range
        // fees. LP fee accounting for vault positions remains a separate issue.
        return PaceLib.computePaceValue(v.paceLiquidity, twapSqrtPrice, 0, 0);
    }

    function getTwapSqrtPrice(PoolId poolId) internal view returns (uint160) {
        (, int24 spotTick,,) = StateLibrary.getSlot0(poolManager, poolId);
        int24 twapTick = poolOracles[poolId].getTwapTick(twapWindow, spotTick);
        return TickMath.getSqrtPriceAtTick(twapTick);
    }

    function _checkSpotDeviation(PoolId poolId, bool allowGraceFallback) internal view {
        (, int24 spotTick,,) = StateLibrary.getSlot0(poolManager, poolId);
        int24 twapTick = poolOracles[poolId].getTwapTick(twapWindow, spotTick);
        int24 diff = spotTick > twapTick ? spotTick - twapTick : twapTick - spotTick;
        if (diff > maxSpotDeviationTicks && !allowGraceFallback) revert SpotDeviationTooHigh(spotTick, twapTick);
    }

    function getVaultPositions(uint256 vaultId) external view returns (Range[] memory) {
        return vaultPositions[vaultId];
    }

    function getVault(uint256 vaultId) external view returns (Vault memory) {
        return vaults[vaultId];
    }

    function getVaultTotalValue(uint256 vaultId) public view returns (uint256) {
        uint160 twapSqrtPrice = getTwapSqrtPrice(vaults[vaultId].poolKey.toId());
        return getVaultValue(vaultId) + vaultPending1[vaultId]
            + PaceLib.token0ToToken1Value(vaultPending0[vaultId], twapSqrtPrice);
    }
}

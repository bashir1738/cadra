// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import {Script} from "forge-std/Script.sol";
import {PoolKey} from "@uniswap/v4-core/src/types/PoolKey.sol";
import {MockERC20} from "../src/mocks/MockERC20.sol";
import {CadraHook} from "../src/CadraHook.sol";
import {Mandate} from "../src/types/Mandate.sol";

contract SeedDemoScript is Script {
    function run(
        address hookAddress,
        address wethAddress,
        address usdcAddress,
        PoolKey memory poolKey
    ) external {
        uint256 deployerPrivateKey = vm.envOr("DEPLOYER_PRIVATE_KEY", uint256(1));
        vm.startBroadcast(deployerPrivateKey);

        CadraHook hook = CadraHook(hookAddress);
        MockERC20 weth = MockERC20(wethAddress);
        MockERC20 usdc = MockERC20(usdcAddress);

        address tightCurator = vm.addr(0x101);
        address wideCurator = vm.addr(0x102);
        address lazyCurator = vm.addr(0x103);
        address recklessCurator = vm.addr(0x104);

        address follower1 = vm.addr(0x201);
        address follower2 = vm.addr(0x202);

        // Fund curators with USDC for bonds
        uint256 bondAmount = 10000 * 1e6; // $10,000 USDC each
        usdc.mint(tightCurator, bondAmount);
        usdc.mint(wideCurator, bondAmount);
        usdc.mint(lazyCurator, bondAmount);
        usdc.mint(recklessCurator, bondAmount);

        // Fund followers with WETH & USDC for deposits
        usdc.mint(follower1, 5000 * 1e6);
        weth.mint(follower1, 2 * 1e18);
        usdc.mint(follower2, 5000 * 1e6);
        weth.mint(follower2, 2 * 1e18);

        vm.stopBroadcast();

        // 1. Setup Tight Curator: ±1% range (~200 ticks), 50% max concentration, 5% max shortfall
        vm.startBroadcast(0x101);
        usdc.approve(address(hook), bondAmount);
        Mandate memory tightMandate = Mandate({
            minTick: -2000,
            maxTick: 2000,
            maxConcentrationBps: 5000,
            minRangeWidth: 120,
            maxShortfallBps: 500
        });
        uint256 tightVaultId = hook.createVault(poolKey, 2000, tightMandate);
        hook.postBond(tightVaultId, bondAmount);
        vm.stopBroadcast();

        // 2. Setup Wide Curator: ±10% range (~2000 ticks), 50% max concentration, 10% max shortfall
        vm.startBroadcast(0x102);
        usdc.approve(address(hook), bondAmount);
        Mandate memory wideMandate = Mandate({
            minTick: -5000,
            maxTick: 5000,
            maxConcentrationBps: 5000,
            minRangeWidth: 600,
            maxShortfallBps: 1000
        });
        uint256 wideVaultId = hook.createVault(poolKey, 1500, wideMandate);
        hook.postBond(wideVaultId, bondAmount);
        vm.stopBroadcast();

        // 3. Setup Lazy Curator: wide range, never rebalances, 8% shortfall
        vm.startBroadcast(0x103);
        usdc.approve(address(hook), bondAmount);
        Mandate memory lazyMandate = Mandate({
            minTick: -8000,
            maxTick: 8000,
            maxConcentrationBps: 6000,
            minRangeWidth: 600,
            maxShortfallBps: 800
        });
        uint256 lazyVaultId = hook.createVault(poolKey, 1000, lazyMandate);
        hook.postBond(lazyVaultId, bondAmount);
        vm.stopBroadcast();

        // 4. Setup Reckless Curator: ultra tight range (60 ticks), high concentration (80%), 3% max shortfall
        vm.startBroadcast(0x104);
        usdc.approve(address(hook), bondAmount);
        Mandate memory recklessMandate = Mandate({
            minTick: -120,
            maxTick: 120,
            maxConcentrationBps: 8000,
            minRangeWidth: 60,
            maxShortfallBps: 300
        });
        uint256 recklessVaultId = hook.createVault(poolKey, 3000, recklessMandate);
        hook.postBond(recklessVaultId, bondAmount);
        vm.stopBroadcast();

        // 5. Follower deposits
        vm.startBroadcast(0x201);
        usdc.approve(address(hook), 1000 * 1e6);
        hook.deposit(tightVaultId, 0, 1000 * 1e6);

        usdc.approve(address(hook), 1000 * 1e6);
        hook.deposit(wideVaultId, 0, 1000 * 1e6);
        vm.stopBroadcast();

        vm.startBroadcast(0x202);
        usdc.approve(address(hook), 1000 * 1e6);
        hook.deposit(recklessVaultId, 0, 1000 * 1e6);
        vm.stopBroadcast();
    }
}

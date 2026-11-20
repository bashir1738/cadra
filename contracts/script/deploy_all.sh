#!/usr/bin/env bash
# ==============================================================================
# Cadra Protocol — Automated Multi-Chain Deployment Script
# Targets:
#   1. Unichain Sepolia (Chain ID: 1301)
#   2. Reactive Lasna   (Chain ID: 5318007)
# ==============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONTRACTS_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
REACTIVE_DIR="${CONTRACTS_DIR}/reactive"

echo "=== Cadra Protocol Deployment Engine ==="

# Load environment
if [ -f "${CONTRACTS_DIR}/.env" ]; then
    source "${CONTRACTS_DIR}/.env"
else
    echo "Error: contracts/.env not found."
    exit 1
fi

DEPLOYER_KEY="${DEPLOYER_PRIVATE_KEY}"
DEPLOYER_ADDR="$(${CONTRACTS_DIR}/../bin/cast wallet address "${DEPLOYER_KEY}")"
echo "Deployer Address: ${DEPLOYER_ADDR}"

# Step 0: Check Balances
echo ""
echo "Checking balances..."
UNICHAIN_BAL="$(${CONTRACTS_DIR}/../bin/cast balance "${DEPLOYER_ADDR}" --rpc-url https://sepolia.unichain.org || echo 0)"
LASNA_BAL="$(${CONTRACTS_DIR}/../bin/cast balance "${DEPLOYER_ADDR}" --rpc-url https://lasna-rpc.rnk.dev/ || echo 0)"

echo "Unichain Sepolia Balance: ${UNICHAIN_BAL} wei"
echo "Reactive Lasna Balance:   ${LASNA_BAL} wei"

if [ "${UNICHAIN_BAL}" = "0" ]; then
    echo "Warning: Deployer has 0 ETH on Unichain Sepolia."
    echo "Fund via faucet: https://faucet.unichain.org/ or bridge to 1301."
fi

if [ "${LASNA_BAL}" = "0" ]; then
    echo "Warning: Deployer has 0 REACT on Reactive Lasna."
    echo "Fund via faucet: https://faucet.rnk.dev/"
fi

if [ "${UNICHAIN_BAL}" = "0" ] || [ "${LASNA_BAL}" = "0" ]; then
    echo "Please fund the deployer address (${DEPLOYER_ADDR}) before broadcasting."
    exit 1
fi

# Step 1: Deploy CadraHook on Unichain Sepolia
echo ""
echo "--- Step 1: Deploying CadraHook on Unichain Sepolia ---"
cd "${CONTRACTS_DIR}"
HOME=/tmp/home "${CONTRACTS_DIR}/../bin/forge" script script/Deploy.s.sol \
    --rpc-url https://sepolia.unichain.org \
    --broadcast \
    -vvv

# Extract deployed hook address from latest broadcast
LATEST_RUN="$(ls -td broadcast/Deploy.s.sol/1301/run-latest.json 2>/dev/null | head -n1 || true)"
if [ -n "${LATEST_RUN}" ]; then
    HOOK_ADDR="$(grep -o '"contractAddress": "[^"]*"' "${LATEST_RUN}" | tail -n1 | cut -d'"' -f4)"
    echo "Discovered Hook Address: ${HOOK_ADDR}"
else
    echo "Could not auto-detect hook address; using fallback from environment."
    HOOK_ADDR="${HOOK_ADDRESS:-0x728D9b5f428B736A26D07879F55C3982Ddf890C0}"
fi

# Step 2: Deploy CadraReactive on Lasna
echo ""
echo "--- Step 2: Deploying CadraReactive on Reactive Lasna ---"
cd "${REACTIVE_DIR}"
HOME=/tmp/home "${CONTRACTS_DIR}/../bin/forge" script script/DeployReactive.s.sol \
    --sig "deployReactive(address)" "${HOOK_ADDR}" \
    --rpc-url https://lasna-rpc.rnk.dev/ \
    --broadcast \
    -vvv

# Step 3: Deploy CadraCallback on Unichain Sepolia
echo ""
echo "--- Step 3: Deploying CadraCallback on Unichain Sepolia ---"
CALLBACK_PROXY="0x9299472A6399Fd1027ebF067571Eb3e3D7837FC4"
# Read reactive address from broadcast
REACTIVE_RUN="$(ls -td broadcast/DeployReactive.s.sol/5318007/run-latest.json 2>/dev/null | head -n1 || true)"
REACTIVE_ADDR="$(grep -o '"contractAddress": "[^"]*"' "${REACTIVE_RUN}" | tail -n1 | cut -d'"' -f4)"
echo "Discovered Reactive Address: ${REACTIVE_ADDR}"

HOME=/tmp/home "${CONTRACTS_DIR}/../bin/forge" script script/DeployReactive.s.sol \
    --sig "deployCallback(address,address,address)" "${CALLBACK_PROXY}" "${REACTIVE_ADDR}" "${HOOK_ADDR}" \
    --rpc-url https://sepolia.unichain.org \
    --broadcast \
    -vvv

# Step 4: Link Callback on Lasna
CALLBACK_RUN="$(ls -td broadcast/DeployReactive.s.sol/1301/run-latest.json 2>/dev/null | head -n1 || true)"
CALLBACK_ADDR="$(grep -o '"contractAddress": "[^"]*"' "${CALLBACK_RUN}" | tail -n1 | cut -d'"' -f4)"
echo "Discovered Callback Address: ${CALLBACK_ADDR}"

echo ""
echo "--- Step 4: Linking Callback Recipient on Reactive Lasna ---"
HOME=/tmp/home "${CONTRACTS_DIR}/../bin/forge" script script/DeployReactive.s.sol \
    --sig "linkCallback(address,address)" "${REACTIVE_ADDR}" "${CALLBACK_ADDR}" \
    --rpc-url https://lasna-rpc.rnk.dev/ \
    --broadcast \
    -vvv

echo ""
echo "=== Deployment Completed Successfully ==="
echo "CadraHook:     ${HOOK_ADDR} (Unichain Sepolia 1301)"
echo "CadraReactive: ${REACTIVE_ADDR} (Reactive Lasna 5318007)"
echo "CadraCallback: ${CALLBACK_ADDR} (Unichain Sepolia 1301)"

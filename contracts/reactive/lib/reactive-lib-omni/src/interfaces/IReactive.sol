// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

struct LogRecord {
    uint256 chainId;
    address _contract;
    uint256 topic0;
    uint256 topic1;
    uint256 topic2;
    uint256 topic3;
    bytes data;
    uint256 blockNumber;
    uint256 opCode;
}

interface IReactive {
    event Callback(
        uint256 indexed chain_id,
        address indexed _contract,
        uint64 indexed gas_limit,
        bytes payload
    );

    function react(LogRecord calldata logRecord) external;
}


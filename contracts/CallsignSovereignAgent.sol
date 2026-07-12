// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface ICallsignRegistry {
    function submitProposal(
        uint256 signalId,
        uint256 agentId,
        string calldata planURI,
        string calldata permissionURI,
        uint8 riskLevel,
        uint256 price,
        uint256 etaSeconds
    ) external returns (uint256 proposalId);

    function submitReport(uint256 missionId, string calldata reportURI) external;

    function requestAutonomousScan(
        uint256 agentId,
        bytes32 contextHash,
        string calldata contextURI
    ) external;
}

/// @title CallsignSovereignAgent
/// @notice A lightweight Ritual-native sovereign agent contract for CALLSIGN.
/// @dev
/// Each responder registered in CallsignRegistry gets one of these contracts.
/// The human owner can configure and trigger it in the MVP, while Ritual
/// Scheduler / runtime can later wake this contract and let it act within the
/// allowed CALLSIGN workflow.
contract CallsignSovereignAgent {
    error NotOwner();
    error NotRegistry();
    error EmptyString();
    error InvalidAgentId();
    error TransferFailed();

    uint256 public constant RITUAL_CHAIN_ID = 1979;

    /// @notice Current public Ritual scheduler address used as integration anchor.
    address public constant RITUAL_SCHEDULER =
        0x56e776BAE2DD60664b69Bd5F865F1180ffB7D58B;

    address public immutable owner;
    address public immutable registry;
    string public name;
    string public capabilityURI;
    string public memoryURI;
    uint256 public registryAgentId;
    uint256 public autonomousTicks;

    event AgentBound(uint256 indexed agentId);
    event AgentMemoryUpdated(string memoryURI);
    event AgentProposalForwarded(
        uint256 indexed signalId,
        uint256 indexed agentId,
        uint256 indexed proposalId
    );
    event AgentReportForwarded(uint256 indexed missionId, string reportURI);
    event AgentWakeRequested(
        uint256 indexed agentId,
        bytes32 indexed contextHash,
        string contextURI
    );
    event FundsWithdrawn(address indexed to, uint256 amount);

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    modifier onlyRegistry() {
        if (msg.sender != registry) revert NotRegistry();
        _;
    }

    modifier boundAgent() {
        if (registryAgentId == 0) revert InvalidAgentId();
        _;
    }

    constructor(
        address owner_,
        address registry_,
        string memory name_,
        string memory capabilityURI_
    ) {
        if (owner_ == address(0) || registry_ == address(0)) revert NotRegistry();
        if (bytes(name_).length == 0) revert EmptyString();

        owner = owner_;
        registry = registry_;
        name = name_;
        capabilityURI = capabilityURI_;
    }

    receive() external payable {}

    /// @notice Called once by CallsignRegistry immediately after deployment.
    function bindAgentId(uint256 agentId) external onlyRegistry {
        if (agentId == 0 || registryAgentId != 0) revert InvalidAgentId();
        registryAgentId = agentId;
        emit AgentBound(agentId);
    }

    /// @notice Update public capability and memory anchors for this agent.
    function updateLocalProfile(
        string calldata newCapabilityURI,
        string calldata newMemoryURI
    ) external onlyOwner {
        if (bytes(newCapabilityURI).length == 0) revert EmptyString();
        capabilityURI = newCapabilityURI;
        memoryURI = newMemoryURI;
        emit AgentMemoryUpdated(newMemoryURI);
    }

    /// @notice MVP autonomous hook: owner/Scheduler can request a scan.
    /// @dev In a fuller Ritual integration, a scheduled wakeup would call this,
    /// then the agent runtime/LLM decides whether to submit proposals.
    function requestWake(bytes32 contextHash, string calldata contextURI)
        external
        onlyOwner
        boundAgent
    {
        autonomousTicks += 1;
        ICallsignRegistry(registry).requestAutonomousScan(
            registryAgentId,
            contextHash,
            contextURI
        );
        emit AgentWakeRequested(registryAgentId, contextHash, contextURI);
    }

    /// @notice Submit a proposal from the sovereign agent contract itself.
    function propose(
        uint256 signalId,
        string calldata planURI,
        string calldata permissionURI,
        uint8 riskLevel,
        uint256 price,
        uint256 etaSeconds
    ) external onlyOwner boundAgent returns (uint256 proposalId) {
        proposalId = ICallsignRegistry(registry).submitProposal(
            signalId,
            registryAgentId,
            planURI,
            permissionURI,
            riskLevel,
            price,
            etaSeconds
        );

        emit AgentProposalForwarded(signalId, registryAgentId, proposalId);
    }

    /// @notice Forward a mission report from the sovereign agent.
    function submitMissionReport(uint256 missionId, string calldata reportURI)
        external
        onlyOwner
        boundAgent
    {
        ICallsignRegistry(registry).submitReport(missionId, reportURI);
        memoryURI = reportURI;
        emit AgentReportForwarded(missionId, reportURI);
        emit AgentMemoryUpdated(reportURI);
    }

    /// @notice Withdraw earned mission funds from the sovereign agent contract.
    function withdraw(address payable to, uint256 amount) external onlyOwner {
        if (to == address(0)) revert NotOwner();
        (bool ok, ) = to.call{value: amount}("");
        if (!ok) revert TransferFailed();
        emit FundsWithdrawn(to, amount);
    }
}

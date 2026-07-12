// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./CallsignSovereignAgent.sol";

/// @title CallsignRegistry
/// @notice Reverse agent marketplace for Ritual Chain: users broadcast problems,
/// and sovereign agents respond with plans, price, permissions, and risk level.
/// @dev MVP contract for CALLSIGN. It intentionally keeps payloads as URI/hash
/// anchors so sensitive plans, permissions, and reports can live off-chain or in
/// Ritual-controlled private storage while the chain records state transitions.
contract CallsignRegistry {
    error ZeroAddress();
    error EmptyString();
    error AgentNotFound();
    error SignalNotFound();
    error ProposalNotFound();
    error MissionNotFound();
    error NotAgentController();
    error NotSignalOwner();
    error NotMissionParticipant();
    error InvalidStatus();
    error InvalidAmount();
    error SignalClosed();
    error DeadlineExpired();
    error TransferFailed();

    uint256 public constant RITUAL_CHAIN_ID = 1979;
    address public constant RITUAL_SCHEDULER =
        0x56e776BAE2DD60664b69Bd5F865F1180ffB7D58B;
    address public constant RITUAL_ASYNC_DELIVERY =
        0x5A16214fF555848411544b005f7Ac063742f39F6;

    enum SignalStatus {
        OPEN,
        ASSIGNED,
        CLOSED,
        EXPIRED
    }

    enum ProposalStatus {
        PENDING,
        ACCEPTED,
        REJECTED,
        CANCELLED
    }

    enum MissionStatus {
        ACTIVE,
        REPORTED,
        COMPLETED,
        DISPUTED,
        REFUNDED
    }

    struct ResponderAgent {
        uint256 id;
        address owner;
        address agentWallet;
        string name;
        string capabilityURI;
        string[] tags;
        uint256 reputation;
        uint256 missionsCompleted;
        bool active;
        uint256 createdAt;
    }

    struct Signal {
        uint256 id;
        address creator;
        string title;
        string problemURI;
        string[] tags;
        uint256 budget;
        uint256 deadline;
        SignalStatus status;
        uint256 acceptedProposalId;
        uint256 createdAt;
    }

    struct Proposal {
        uint256 id;
        uint256 signalId;
        uint256 agentId;
        string planURI;
        string permissionURI;
        uint8 riskLevel; // 1 low, 5 high
        uint256 price;
        uint256 etaSeconds;
        ProposalStatus status;
        uint256 createdAt;
    }

    struct Mission {
        uint256 id;
        uint256 signalId;
        uint256 proposalId;
        uint256 agentId;
        address creator;
        uint256 escrowAmount;
        string latestReportURI;
        MissionStatus status;
        uint256 createdAt;
        uint256 completedAt;
    }

    uint256 public nextAgentId = 1;
    uint256 public nextSignalId = 1;
    uint256 public nextProposalId = 1;
    uint256 public nextMissionId = 1;

    mapping(uint256 => ResponderAgent) private agents;
    mapping(uint256 => Signal) private signals;
    mapping(uint256 => Proposal) private proposals;
    mapping(uint256 => Mission) private missions;

    uint256[] private allAgentIds;
    uint256[] private allSignalIds;
    uint256[] private allMissionIds;

    mapping(address => uint256[]) private ownerAgentIds;
    mapping(uint256 => uint256[]) private signalProposalIds;
    mapping(uint256 => uint256[]) private agentMissionIds;
    mapping(bytes32 => uint256[]) private signalsByTag;
    mapping(bytes32 => uint256[]) private agentsByTag;

    event AgentRegistered(
        uint256 indexed agentId,
        address indexed owner,
        address indexed agentWallet,
        address agentContract,
        string name,
        string capabilityURI
    );
    event SignalBroadcast(
        uint256 indexed signalId,
        address indexed creator,
        string title,
        uint256 budget,
        uint256 deadline
    );
    event ProposalSubmitted(
        uint256 indexed proposalId,
        uint256 indexed signalId,
        uint256 indexed agentId,
        uint256 price,
        uint8 riskLevel,
        string planURI,
        string permissionURI
    );
    event ProposalStatusChanged(uint256 indexed proposalId, ProposalStatus status);
    event MissionStarted(
        uint256 indexed missionId,
        uint256 indexed signalId,
        uint256 indexed agentId,
        uint256 escrowAmount
    );
    event ReportSubmitted(uint256 indexed missionId, string reportURI);
    event MissionCompleted(uint256 indexed missionId, uint256 paidAmount, uint8 rating);
    event MissionDisputed(uint256 indexed missionId, string reasonURI);
    event MissionRefunded(uint256 indexed missionId, uint256 refundedAmount);
    event AutonomousScanRequested(uint256 indexed agentId, bytes32 contextHash, string contextURI);

    modifier existingAgent(uint256 agentId) {
        if (agents[agentId].id == 0) revert AgentNotFound();
        _;
    }

    modifier existingSignal(uint256 signalId) {
        if (signals[signalId].id == 0) revert SignalNotFound();
        _;
    }

    modifier existingProposal(uint256 proposalId) {
        if (proposals[proposalId].id == 0) revert ProposalNotFound();
        _;
    }

    modifier existingMission(uint256 missionId) {
        if (missions[missionId].id == 0) revert MissionNotFound();
        _;
    }

    modifier onlyAgentController(uint256 agentId) {
        ResponderAgent storage agent = agents[agentId];
        if (agent.id == 0) revert AgentNotFound();
        if (msg.sender != agent.owner && msg.sender != agent.agentWallet) {
            revert NotAgentController();
        }
        _;
    }

    function registerAgent(
        address agentController,
        string calldata name,
        string calldata capabilityURI,
        string[] calldata tags
    ) external returns (uint256 agentId) {
        if (agentController == address(0)) revert ZeroAddress();
        if (bytes(name).length == 0) revert EmptyString();
        if (bytes(capabilityURI).length == 0) revert EmptyString();

        agentId = nextAgentId++;

        CallsignSovereignAgent sovereignAgent = new CallsignSovereignAgent(
            agentController,
            address(this),
            name,
            capabilityURI
        );
        sovereignAgent.bindAgentId(agentId);

        ResponderAgent storage agent = agents[agentId];
        agent.id = agentId;
        agent.owner = msg.sender;
        agent.agentWallet = address(sovereignAgent);
        agent.name = name;
        agent.capabilityURI = capabilityURI;
        agent.active = true;
        agent.createdAt = block.timestamp;

        _copyAgentTags(agent, tags);
        _indexAgentTags(agentId, tags);
        allAgentIds.push(agentId);
        ownerAgentIds[msg.sender].push(agentId);

        emit AgentRegistered(
            agentId,
            msg.sender,
            address(sovereignAgent),
            address(sovereignAgent),
            name,
            capabilityURI
        );
    }

    function broadcastSignal(
        string calldata title,
        string calldata problemURI,
        string[] calldata tags,
        uint256 budget,
        uint256 deadline
    ) external returns (uint256 signalId) {
        if (bytes(title).length == 0) revert EmptyString();
        if (bytes(problemURI).length == 0) revert EmptyString();
        if (deadline != 0 && deadline <= block.timestamp) revert DeadlineExpired();

        signalId = nextSignalId++;
        Signal storage signal = signals[signalId];
        signal.id = signalId;
        signal.creator = msg.sender;
        signal.title = title;
        signal.problemURI = problemURI;
        signal.budget = budget;
        signal.deadline = deadline;
        signal.status = SignalStatus.OPEN;
        signal.createdAt = block.timestamp;

        _copySignalTags(signal, tags);
        _indexSignalTags(signalId, tags);
        allSignalIds.push(signalId);

        emit SignalBroadcast(signalId, msg.sender, title, budget, deadline);
    }

    function submitProposal(
        uint256 signalId,
        uint256 agentId,
        string calldata planURI,
        string calldata permissionURI,
        uint8 riskLevel,
        uint256 price,
        uint256 etaSeconds
    )
        external
        existingSignal(signalId)
        existingAgent(agentId)
        onlyAgentController(agentId)
        returns (uint256 proposalId)
    {
        Signal storage signal = signals[signalId];
        if (signal.status != SignalStatus.OPEN) revert SignalClosed();
        if (signal.deadline != 0 && signal.deadline <= block.timestamp) {
            revert DeadlineExpired();
        }
        if (bytes(planURI).length == 0) revert EmptyString();
        if (riskLevel == 0 || riskLevel > 5) revert InvalidAmount();

        proposalId = nextProposalId++;
        Proposal storage proposal = proposals[proposalId];
        proposal.id = proposalId;
        proposal.signalId = signalId;
        proposal.agentId = agentId;
        proposal.planURI = planURI;
        proposal.permissionURI = permissionURI;
        proposal.riskLevel = riskLevel;
        proposal.price = price;
        proposal.etaSeconds = etaSeconds;
        proposal.status = ProposalStatus.PENDING;
        proposal.createdAt = block.timestamp;

        signalProposalIds[signalId].push(proposalId);

        emit ProposalSubmitted(
            proposalId,
            signalId,
            agentId,
            price,
            riskLevel,
            planURI,
            permissionURI
        );
    }

    function acceptProposal(uint256 proposalId)
        external
        payable
        existingProposal(proposalId)
        returns (uint256 missionId)
    {
        Proposal storage proposal = proposals[proposalId];
        if (proposal.status != ProposalStatus.PENDING) revert InvalidStatus();

        Signal storage signal = signals[proposal.signalId];
        if (msg.sender != signal.creator) revert NotSignalOwner();
        if (signal.status != SignalStatus.OPEN) revert SignalClosed();
        if (msg.value != proposal.price) revert InvalidAmount();

        proposal.status = ProposalStatus.ACCEPTED;
        signal.status = SignalStatus.ASSIGNED;
        signal.acceptedProposalId = proposalId;

        missionId = nextMissionId++;
        Mission storage mission = missions[missionId];
        mission.id = missionId;
        mission.signalId = signal.id;
        mission.proposalId = proposal.id;
        mission.agentId = proposal.agentId;
        mission.creator = signal.creator;
        mission.escrowAmount = msg.value;
        mission.status = MissionStatus.ACTIVE;
        mission.createdAt = block.timestamp;

        allMissionIds.push(missionId);
        agentMissionIds[proposal.agentId].push(missionId);

        emit ProposalStatusChanged(proposalId, ProposalStatus.ACCEPTED);
        emit MissionStarted(missionId, signal.id, proposal.agentId, msg.value);
    }

    function submitReport(uint256 missionId, string calldata reportURI)
        external
        existingMission(missionId)
        onlyAgentController(missions[missionId].agentId)
    {
        Mission storage mission = missions[missionId];
        if (mission.status != MissionStatus.ACTIVE && mission.status != MissionStatus.REPORTED) {
            revert InvalidStatus();
        }
        if (bytes(reportURI).length == 0) revert EmptyString();

        mission.latestReportURI = reportURI;
        mission.status = MissionStatus.REPORTED;

        emit ReportSubmitted(missionId, reportURI);
    }

    function completeMission(uint256 missionId, uint8 rating)
        external
        existingMission(missionId)
    {
        Mission storage mission = missions[missionId];
        if (msg.sender != mission.creator) revert NotMissionParticipant();
        if (mission.status != MissionStatus.ACTIVE && mission.status != MissionStatus.REPORTED) {
            revert InvalidStatus();
        }
        if (rating == 0 || rating > 5) revert InvalidAmount();

        mission.status = MissionStatus.COMPLETED;
        mission.completedAt = block.timestamp;

        ResponderAgent storage agent = agents[mission.agentId];
        agent.missionsCompleted += 1;
        agent.reputation += rating;

        uint256 amount = mission.escrowAmount;
        mission.escrowAmount = 0;

        (bool ok, ) = agent.agentWallet.call{value: amount}("");
        if (!ok) revert TransferFailed();

        emit MissionCompleted(missionId, amount, rating);
    }

    function disputeMission(uint256 missionId, string calldata reasonURI)
        external
        existingMission(missionId)
    {
        Mission storage mission = missions[missionId];
        ResponderAgent storage agent = agents[mission.agentId];
        if (
            msg.sender != mission.creator &&
            msg.sender != agent.owner &&
            msg.sender != agent.agentWallet
        ) {
            revert NotMissionParticipant();
        }
        if (mission.status != MissionStatus.ACTIVE && mission.status != MissionStatus.REPORTED) {
            revert InvalidStatus();
        }

        mission.status = MissionStatus.DISPUTED;
        emit MissionDisputed(missionId, reasonURI);
    }

    function refundMission(uint256 missionId)
        external
        existingMission(missionId)
    {
        Mission storage mission = missions[missionId];
        if (msg.sender != mission.creator) revert NotMissionParticipant();
        if (mission.status != MissionStatus.ACTIVE && mission.status != MissionStatus.DISPUTED) {
            revert InvalidStatus();
        }

        mission.status = MissionStatus.REFUNDED;
        uint256 amount = mission.escrowAmount;
        mission.escrowAmount = 0;

        (bool ok, ) = mission.creator.call{value: amount}("");
        if (!ok) revert TransferFailed();

        emit MissionRefunded(missionId, amount);
    }

    /// @notice Scheduler/agent hook: a sovereign agent can emit a scan request,
    /// then an off-chain/Ritual runtime can read open signals and submit proposals.
    function requestAutonomousScan(
        uint256 agentId,
        bytes32 contextHash,
        string calldata contextURI
    ) external existingAgent(agentId) onlyAgentController(agentId) {
        emit AutonomousScanRequested(agentId, contextHash, contextURI);
    }

    function getAgent(uint256 agentId)
        external
        view
        existingAgent(agentId)
        returns (ResponderAgent memory)
    {
        return agents[agentId];
    }

    function getSignal(uint256 signalId)
        external
        view
        existingSignal(signalId)
        returns (Signal memory)
    {
        return signals[signalId];
    }

    function getProposal(uint256 proposalId)
        external
        view
        existingProposal(proposalId)
        returns (Proposal memory)
    {
        return proposals[proposalId];
    }

    function getMission(uint256 missionId)
        external
        view
        existingMission(missionId)
        returns (Mission memory)
    {
        return missions[missionId];
    }

    function getAllAgentIds() external view returns (uint256[] memory) {
        return allAgentIds;
    }

    function getAllSignalIds() external view returns (uint256[] memory) {
        return allSignalIds;
    }

    function getAllMissionIds() external view returns (uint256[] memory) {
        return allMissionIds;
    }

    function getSignalProposalIds(uint256 signalId)
        external
        view
        existingSignal(signalId)
        returns (uint256[] memory)
    {
        return signalProposalIds[signalId];
    }

    function getAgentMissionIds(uint256 agentId)
        external
        view
        existingAgent(agentId)
        returns (uint256[] memory)
    {
        return agentMissionIds[agentId];
    }

    function getSignalsByTag(string calldata tag) external view returns (uint256[] memory) {
        return signalsByTag[_tagKey(tag)];
    }

    function getAgentsByTag(string calldata tag) external view returns (uint256[] memory) {
        return agentsByTag[_tagKey(tag)];
    }

    function _copyAgentTags(ResponderAgent storage agent, string[] calldata tags) internal {
        for (uint256 i = 0; i < tags.length; i++) {
            if (bytes(tags[i]).length == 0) revert EmptyString();
            agent.tags.push(tags[i]);
        }
    }

    function _copySignalTags(Signal storage signal, string[] calldata tags) internal {
        for (uint256 i = 0; i < tags.length; i++) {
            if (bytes(tags[i]).length == 0) revert EmptyString();
            signal.tags.push(tags[i]);
        }
    }

    function _indexAgentTags(uint256 agentId, string[] calldata tags) internal {
        for (uint256 i = 0; i < tags.length; i++) {
            agentsByTag[_tagKey(tags[i])].push(agentId);
        }
    }

    function _indexSignalTags(uint256 signalId, string[] calldata tags) internal {
        for (uint256 i = 0; i < tags.length; i++) {
            signalsByTag[_tagKey(tags[i])].push(signalId);
        }
    }

    function _tagKey(string calldata tag) internal pure returns (bytes32) {
        return keccak256(bytes(tag));
    }
}

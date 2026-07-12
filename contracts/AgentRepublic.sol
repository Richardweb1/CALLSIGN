// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title AgentRepublic
/// @notice Ritual-native coordination market for sovereign agents.
/// @dev
/// MVP scope:
/// - Agent registry
/// - Intent publishing
/// - Proposal flow
/// - Mission creation with native RIT escrow
/// - Basic completion/refund/dispute status
/// - Reputation and memory anchors
///
/// Ritual integration notes:
/// - This contract stores the deterministic coordination state.
/// - A Sovereign Agent contract/container can own or control an agent wallet and call these methods.
/// - Ritual Scheduler can periodically call `autonomousTick` or an external agent wakeup function.
/// - Ritual LLM/Sovereign Agent precompiles should be called by the agent contract/runtime, then results
///   are committed here as proposals, mission updates, memory hashes, or reputation updates.
contract AgentRepublic {
    // -------------------------------------------------------------------------
    // Errors
    // -------------------------------------------------------------------------

    error ZeroAddress();
    error EmptyString();
    error AgentNotFound();
    error IntentNotFound();
    error ProposalNotFound();
    error MissionNotFound();
    error NotAgentController();
    error NotIntentOwner();
    error NotMissionParticipant();
    error InvalidStatus();
    error InvalidAmount();
    error IntentInactive();
    error DeadlineExpired();
    error TransferFailed();
    error CannotProposeToOwnIntent();

    // -------------------------------------------------------------------------
    // Ritual system addresses - current public docs / skills config.
    // -------------------------------------------------------------------------

    /// @notice Ritual Chain ID for testnet.
    uint256 public constant RITUAL_CHAIN_ID = 1979;

    /// @notice Ritual Scheduler system contract.
    /// @dev Kept as a public constant so the frontend/indexer can display intended integration.
    address public constant RITUAL_SCHEDULER =
        0x56e776BAE2DD60664b69Bd5F865F1180ffB7D58B;

    /// @notice Ritual AsyncDelivery system contract for two-phase async callbacks.
    address public constant RITUAL_ASYNC_DELIVERY =
        0x5A16214fF555848411544b005f7Ac063742f39F6;

    // -------------------------------------------------------------------------
    // Types
    // -------------------------------------------------------------------------

    enum IntentType {
        OFFER,
        REQUEST
    }

    enum ProposalStatus {
        PENDING,
        ACCEPTED,
        REJECTED,
        CANCELLED
    }

    enum MissionStatus {
        CREATED,
        IN_PROGRESS,
        SUBMITTED,
        COMPLETED,
        DISPUTED,
        REFUNDED,
        CANCELLED
    }

    struct Agent {
        uint256 id;
        address owner;
        /// @notice Wallet/contract that represents the sovereign agent on-chain.
        /// It may be a DKMS-derived agent wallet, a Sovereign Agent contract, or
        /// the owner's wallet for local testing.
        address agentWallet;
        string name;
        string profileURI;
        string systemPromptURI;
        string[] tags;
        string memoryURI;
        uint256 reputation;
        uint256 missionsCompleted;
        bool active;
        uint256 createdAt;
    }

    struct Intent {
        uint256 id;
        uint256 agentId;
        IntentType intentType;
        string title;
        string descriptionURI;
        string[] tags;
        uint256 budget;
        uint256 deadline;
        bool active;
        uint256 createdAt;
    }

    struct Proposal {
        uint256 id;
        uint256 intentId;
        uint256 proposerAgentId;
        string termsURI;
        uint256 requestedPayment;
        ProposalStatus status;
        uint256 createdAt;
    }

    struct Mission {
        uint256 id;
        uint256 intentId;
        uint256 proposalId;
        uint256 requesterAgentId;
        uint256 providerAgentId;
        string termsURI;
        string resultURI;
        uint256 escrowAmount;
        MissionStatus status;
        uint256 createdAt;
        uint256 completedAt;
    }

    // -------------------------------------------------------------------------
    // Storage
    // -------------------------------------------------------------------------

    uint256 public nextAgentId = 1;
    uint256 public nextIntentId = 1;
    uint256 public nextProposalId = 1;
    uint256 public nextMissionId = 1;

    mapping(uint256 => Agent) private agents;
    mapping(uint256 => Intent) private intents;
    mapping(uint256 => Proposal) private proposals;
    mapping(uint256 => Mission) private missions;

    uint256[] private allAgentIds;
    uint256[] private allIntentIds;
    uint256[] private allMissionIds;

    mapping(address => uint256[]) private ownerAgentIds;
    mapping(uint256 => uint256[]) private agentIntentIds;
    mapping(uint256 => uint256[]) private intentProposalIds;
    mapping(uint256 => uint256[]) private agentMissionIds;

    // Lightweight tag index for MVP discovery.
    // Store lowercase/canonical tags from the frontend/agent runtime.
    mapping(bytes32 => uint256[]) private intentsByTag;
    mapping(bytes32 => uint256[]) private agentsByTag;

    // -------------------------------------------------------------------------
    // Events
    // -------------------------------------------------------------------------

    event AgentRegistered(
        uint256 indexed agentId,
        address indexed owner,
        address indexed agentWallet,
        string name,
        string profileURI
    );

    event AgentProfileUpdated(
        uint256 indexed agentId,
        string profileURI,
        string systemPromptURI,
        string memoryURI
    );

    event IntentPublished(
        uint256 indexed intentId,
        uint256 indexed agentId,
        IntentType intentType,
        string title,
        uint256 budget,
        uint256 deadline
    );

    event IntentClosed(uint256 indexed intentId);

    event ProposalSubmitted(
        uint256 indexed proposalId,
        uint256 indexed intentId,
        uint256 indexed proposerAgentId,
        uint256 requestedPayment,
        string termsURI
    );

    event ProposalStatusChanged(
        uint256 indexed proposalId,
        ProposalStatus status
    );

    event MissionCreated(
        uint256 indexed missionId,
        uint256 indexed intentId,
        uint256 indexed proposalId,
        uint256 requesterAgentId,
        uint256 providerAgentId,
        uint256 escrowAmount
    );

    event MissionSubmitted(uint256 indexed missionId, string resultURI);
    event MissionCompleted(uint256 indexed missionId, uint256 paidAmount);
    event MissionDisputed(uint256 indexed missionId, string reasonURI);
    event MissionRefunded(uint256 indexed missionId, uint256 refundedAmount);
    event MemoryUpdated(uint256 indexed agentId, string memoryURI);
    event ReputationUpdated(uint256 indexed agentId, uint256 reputation);

    /// @notice Emitted by an agent/Scheduler tick. Off-chain autonomous runtimes can watch this.
    event AutonomousTickRequested(
        uint256 indexed agentId,
        bytes32 indexed contextHash,
        string contextURI
    );

    /// @notice Emitted when a Ritual async callback commits an agent decision.
    event AgentDecisionCommitted(
        uint256 indexed agentId,
        bytes32 indexed decisionHash,
        string decisionURI
    );

    // -------------------------------------------------------------------------
    // Modifiers
    // -------------------------------------------------------------------------

    modifier existingAgent(uint256 agentId) {
        if (agents[agentId].id == 0) revert AgentNotFound();
        _;
    }

    modifier existingIntent(uint256 intentId) {
        if (intents[intentId].id == 0) revert IntentNotFound();
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
        Agent storage agent = agents[agentId];
        if (agent.id == 0) revert AgentNotFound();
        if (msg.sender != agent.owner && msg.sender != agent.agentWallet) {
            revert NotAgentController();
        }
        _;
    }

    // -------------------------------------------------------------------------
    // Agent Registry
    // -------------------------------------------------------------------------

    /// @notice Register a sovereign agent profile in the Republic.
    /// @param agentWallet Wallet/contract controlled by the sovereign agent. Use owner address for local testing.
    /// @param name Human-readable agent name.
    /// @param profileURI IPFS/HTTPS/DA URI containing skills, goals, and public profile metadata.
    /// @param systemPromptURI URI/hash for the agent's system prompt or policy. Avoid storing sensitive prompts on-chain.
    /// @param tags Canonical skills/tags for discovery, e.g. ["solidity", "design"].
    function registerAgent(
        address agentWallet,
        string calldata name,
        string calldata profileURI,
        string calldata systemPromptURI,
        string[] calldata tags
    ) external returns (uint256 agentId) {
        if (agentWallet == address(0)) revert ZeroAddress();
        if (bytes(name).length == 0) revert EmptyString();

        agentId = nextAgentId++;

        Agent storage agent = agents[agentId];
        agent.id = agentId;
        agent.owner = msg.sender;
        agent.agentWallet = agentWallet;
        agent.name = name;
        agent.profileURI = profileURI;
        agent.systemPromptURI = systemPromptURI;
        agent.active = true;
        agent.createdAt = block.timestamp;

        _copyTagsToAgent(agent, tags);

        allAgentIds.push(agentId);
        ownerAgentIds[msg.sender].push(agentId);
        _indexAgentTags(agentId, tags);

        emit AgentRegistered(agentId, msg.sender, agentWallet, name, profileURI);
    }

    /// @notice Update mutable public agent metadata.
    function updateAgentProfile(
        uint256 agentId,
        string calldata profileURI,
        string calldata systemPromptURI,
        string calldata memoryURI
    ) external existingAgent(agentId) onlyAgentController(agentId) {
        Agent storage agent = agents[agentId];
        agent.profileURI = profileURI;
        agent.systemPromptURI = systemPromptURI;
        agent.memoryURI = memoryURI;

        emit AgentProfileUpdated(agentId, profileURI, systemPromptURI, memoryURI);
        emit MemoryUpdated(agentId, memoryURI);
    }

    // -------------------------------------------------------------------------
    // Intent Publishing
    // -------------------------------------------------------------------------

    /// @notice Publish an OFFER or REQUEST intent from an agent.
    /// @dev For REQUEST intents, `budget` is informational until a mission is funded.
    function publishIntent(
        uint256 agentId,
        IntentType intentType,
        string calldata title,
        string calldata descriptionURI,
        string[] calldata tags,
        uint256 budget,
        uint256 deadline
    )
        external
        existingAgent(agentId)
        onlyAgentController(agentId)
        returns (uint256 intentId)
    {
        if (bytes(title).length == 0) revert EmptyString();
        if (deadline != 0 && deadline <= block.timestamp) revert DeadlineExpired();

        intentId = nextIntentId++;

        Intent storage intent = intents[intentId];
        intent.id = intentId;
        intent.agentId = agentId;
        intent.intentType = intentType;
        intent.title = title;
        intent.descriptionURI = descriptionURI;
        intent.budget = budget;
        intent.deadline = deadline;
        intent.active = true;
        intent.createdAt = block.timestamp;

        _copyTagsToIntent(intent, tags);

        allIntentIds.push(intentId);
        agentIntentIds[agentId].push(intentId);
        _indexIntentTags(intentId, tags);

        emit IntentPublished(intentId, agentId, intentType, title, budget, deadline);
    }

    /// @notice Close an intent so no new proposals should be accepted.
    function closeIntent(uint256 intentId)
        external
        existingIntent(intentId)
        onlyAgentController(intents[intentId].agentId)
    {
        intents[intentId].active = false;
        emit IntentClosed(intentId);
    }

    // -------------------------------------------------------------------------
    // Proposals and Missions
    // -------------------------------------------------------------------------

    /// @notice Propose a mission against another agent's intent.
    function submitProposal(
        uint256 intentId,
        uint256 proposerAgentId,
        string calldata termsURI,
        uint256 requestedPayment
    )
        external
        existingIntent(intentId)
        existingAgent(proposerAgentId)
        onlyAgentController(proposerAgentId)
        returns (uint256 proposalId)
    {
        Intent storage intent = intents[intentId];
        if (!intent.active) revert IntentInactive();
        if (intent.deadline != 0 && intent.deadline <= block.timestamp) {
            revert DeadlineExpired();
        }
        if (intent.agentId == proposerAgentId) revert CannotProposeToOwnIntent();
        if (bytes(termsURI).length == 0) revert EmptyString();

        proposalId = nextProposalId++;

        Proposal storage proposal = proposals[proposalId];
        proposal.id = proposalId;
        proposal.intentId = intentId;
        proposal.proposerAgentId = proposerAgentId;
        proposal.termsURI = termsURI;
        proposal.requestedPayment = requestedPayment;
        proposal.status = ProposalStatus.PENDING;
        proposal.createdAt = block.timestamp;

        intentProposalIds[intentId].push(proposalId);

        emit ProposalSubmitted(
            proposalId,
            intentId,
            proposerAgentId,
            requestedPayment,
            termsURI
        );
    }

    /// @notice Accept a proposal and create a mission.
    /// @dev Send native RIT as escrow. It must equal the chosen escrow amount.
    function acceptProposal(uint256 proposalId)
        external
        payable
        existingProposal(proposalId)
        returns (uint256 missionId)
    {
        Proposal storage proposal = proposals[proposalId];
        if (proposal.status != ProposalStatus.PENDING) revert InvalidStatus();

        Intent storage intent = intents[proposal.intentId];
        if (!intent.active) revert IntentInactive();
        if (intent.deadline != 0 && intent.deadline <= block.timestamp) {
            revert DeadlineExpired();
        }

        // Intent owner/requester accepts and funds the mission.
        if (msg.sender != agents[intent.agentId].owner && msg.sender != agents[intent.agentId].agentWallet) {
            revert NotIntentOwner();
        }

        if (msg.value != proposal.requestedPayment) revert InvalidAmount();

        proposal.status = ProposalStatus.ACCEPTED;
        intent.active = false;

        missionId = nextMissionId++;

        Mission storage mission = missions[missionId];
        mission.id = missionId;
        mission.intentId = intent.id;
        mission.proposalId = proposal.id;
        mission.requesterAgentId = intent.agentId;
        mission.providerAgentId = proposal.proposerAgentId;
        mission.termsURI = proposal.termsURI;
        mission.escrowAmount = msg.value;
        mission.status = MissionStatus.IN_PROGRESS;
        mission.createdAt = block.timestamp;

        allMissionIds.push(missionId);
        agentMissionIds[mission.requesterAgentId].push(missionId);
        agentMissionIds[mission.providerAgentId].push(missionId);

        emit ProposalStatusChanged(proposalId, ProposalStatus.ACCEPTED);
        emit IntentClosed(intent.id);
        emit MissionCreated(
            missionId,
            intent.id,
            proposal.id,
            mission.requesterAgentId,
            mission.providerAgentId,
            msg.value
        );
    }

    /// @notice Provider submits mission result metadata.
    function submitMissionResult(uint256 missionId, string calldata resultURI)
        external
        existingMission(missionId)
        onlyAgentController(missions[missionId].providerAgentId)
    {
        Mission storage mission = missions[missionId];
        if (mission.status != MissionStatus.IN_PROGRESS) revert InvalidStatus();
        if (bytes(resultURI).length == 0) revert EmptyString();

        mission.resultURI = resultURI;
        mission.status = MissionStatus.SUBMITTED;

        emit MissionSubmitted(missionId, resultURI);
    }

    /// @notice Requester accepts delivered work and releases escrow to provider agent wallet.
    function completeMission(
        uint256 missionId,
        string calldata requesterMemoryURI,
        string calldata providerMemoryURI
    )
        external
        existingMission(missionId)
        onlyAgentController(missions[missionId].requesterAgentId)
    {
        Mission storage mission = missions[missionId];
        if (mission.status != MissionStatus.SUBMITTED && mission.status != MissionStatus.IN_PROGRESS) {
            revert InvalidStatus();
        }

        mission.status = MissionStatus.COMPLETED;
        mission.completedAt = block.timestamp;

        _increaseReputation(mission.requesterAgentId, 1);
        _increaseReputation(mission.providerAgentId, 3);
        agents[mission.requesterAgentId].missionsCompleted += 1;
        agents[mission.providerAgentId].missionsCompleted += 1;

        if (bytes(requesterMemoryURI).length != 0) {
            agents[mission.requesterAgentId].memoryURI = requesterMemoryURI;
            emit MemoryUpdated(mission.requesterAgentId, requesterMemoryURI);
        }

        if (bytes(providerMemoryURI).length != 0) {
            agents[mission.providerAgentId].memoryURI = providerMemoryURI;
            emit MemoryUpdated(mission.providerAgentId, providerMemoryURI);
        }

        uint256 amount = mission.escrowAmount;
        mission.escrowAmount = 0;

        address payee = agents[mission.providerAgentId].agentWallet;
        (bool ok, ) = payee.call{value: amount}("");
        if (!ok) revert TransferFailed();

        emit MissionCompleted(missionId, amount);
    }

    /// @notice Mark mission as disputed. v1 only records the dispute; resolution can be added later.
    function disputeMission(uint256 missionId, string calldata reasonURI)
        external
        existingMission(missionId)
    {
        Mission storage mission = missions[missionId];
        if (
            msg.sender != agents[mission.requesterAgentId].owner &&
            msg.sender != agents[mission.requesterAgentId].agentWallet &&
            msg.sender != agents[mission.providerAgentId].owner &&
            msg.sender != agents[mission.providerAgentId].agentWallet
        ) {
            revert NotMissionParticipant();
        }
        if (
            mission.status != MissionStatus.IN_PROGRESS &&
            mission.status != MissionStatus.SUBMITTED
        ) {
            revert InvalidStatus();
        }

        mission.status = MissionStatus.DISPUTED;
        emit MissionDisputed(missionId, reasonURI);
    }

    /// @notice Refund mission escrow to requester when work cannot proceed.
    /// @dev MVP rule: only requester can refund while in progress/disputed. Later add deadlines/arbitration.
    function refundMission(uint256 missionId)
        external
        existingMission(missionId)
        onlyAgentController(missions[missionId].requesterAgentId)
    {
        Mission storage mission = missions[missionId];
        if (
            mission.status != MissionStatus.IN_PROGRESS &&
            mission.status != MissionStatus.DISPUTED
        ) {
            revert InvalidStatus();
        }

        mission.status = MissionStatus.REFUNDED;

        uint256 amount = mission.escrowAmount;
        mission.escrowAmount = 0;

        address requesterWallet = agents[mission.requesterAgentId].agentWallet;
        (bool ok, ) = requesterWallet.call{value: amount}("");
        if (!ok) revert TransferFailed();

        emit MissionRefunded(missionId, amount);
    }

    // -------------------------------------------------------------------------
    // Ritual autonomous hooks
    // -------------------------------------------------------------------------

    /// @notice Hook for a Sovereign Agent/Scheduler tick.
    /// @dev
    /// Current MVP emits a request event. A Ritual Sovereign Agent runtime can:
    /// 1. Wake via Scheduler.
    /// 2. Read this agent's profile, tags, intents, and recent events.
    /// 3. Use the LLM/Sovereign Agent precompile to decide whether to propose/accept/update memory.
    /// 4. Commit the selected action by calling this contract.
    function autonomousTick(
        uint256 agentId,
        bytes32 contextHash,
        string calldata contextURI
    ) external existingAgent(agentId) onlyAgentController(agentId) {
        emit AutonomousTickRequested(agentId, contextHash, contextURI);
    }

    /// @notice Callback entrypoint for Ritual AsyncDelivery-driven decisions.
    /// @dev This is intentionally generic until the exact precompile payload format is pinned.
    /// Production integration should decode `result` and execute constrained actions.
    function onRitualAsyncResult(
        uint256 agentId,
        bytes32 decisionHash,
        string calldata decisionURI,
        bytes calldata /* result */
    ) external existingAgent(agentId) {
        if (msg.sender != RITUAL_ASYNC_DELIVERY) revert NotAgentController();
        emit AgentDecisionCommitted(agentId, decisionHash, decisionURI);
    }

    // -------------------------------------------------------------------------
    // Views
    // -------------------------------------------------------------------------

    function getAgent(uint256 agentId)
        external
        view
        existingAgent(agentId)
        returns (Agent memory)
    {
        return agents[agentId];
    }

    function getIntent(uint256 intentId)
        external
        view
        existingIntent(intentId)
        returns (Intent memory)
    {
        return intents[intentId];
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

    function getAllIntentIds() external view returns (uint256[] memory) {
        return allIntentIds;
    }

    function getAllMissionIds() external view returns (uint256[] memory) {
        return allMissionIds;
    }

    function getOwnerAgentIds(address owner) external view returns (uint256[] memory) {
        return ownerAgentIds[owner];
    }

    function getAgentIntentIds(uint256 agentId)
        external
        view
        existingAgent(agentId)
        returns (uint256[] memory)
    {
        return agentIntentIds[agentId];
    }

    function getIntentProposalIds(uint256 intentId)
        external
        view
        existingIntent(intentId)
        returns (uint256[] memory)
    {
        return intentProposalIds[intentId];
    }

    function getAgentMissionIds(uint256 agentId)
        external
        view
        existingAgent(agentId)
        returns (uint256[] memory)
    {
        return agentMissionIds[agentId];
    }

    function getIntentIdsByTag(string calldata tag) external view returns (uint256[] memory) {
        return intentsByTag[_tagKey(tag)];
    }

    function getAgentIdsByTag(string calldata tag) external view returns (uint256[] memory) {
        return agentsByTag[_tagKey(tag)];
    }

    // -------------------------------------------------------------------------
    // Internal helpers
    // -------------------------------------------------------------------------

    function _copyTagsToAgent(Agent storage agent, string[] calldata tags) internal {
        for (uint256 i = 0; i < tags.length; i++) {
            if (bytes(tags[i]).length == 0) revert EmptyString();
            agent.tags.push(tags[i]);
        }
    }

    function _copyTagsToIntent(Intent storage intent, string[] calldata tags) internal {
        for (uint256 i = 0; i < tags.length; i++) {
            if (bytes(tags[i]).length == 0) revert EmptyString();
            intent.tags.push(tags[i]);
        }
    }

    function _indexAgentTags(uint256 agentId, string[] calldata tags) internal {
        for (uint256 i = 0; i < tags.length; i++) {
            agentsByTag[_tagKey(tags[i])].push(agentId);
        }
    }

    function _indexIntentTags(uint256 intentId, string[] calldata tags) internal {
        for (uint256 i = 0; i < tags.length; i++) {
            intentsByTag[_tagKey(tags[i])].push(intentId);
        }
    }

    function _increaseReputation(uint256 agentId, uint256 points) internal {
        agents[agentId].reputation += points;
        emit ReputationUpdated(agentId, agents[agentId].reputation);
    }

    function _tagKey(string calldata tag) internal pure returns (bytes32) {
        return keccak256(bytes(tag));
    }
}

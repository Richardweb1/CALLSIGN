export const agentRepublicAbi = [
  {
    "inputs": [],
    "name": "AgentNotFound",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "CannotProposeToOwnIntent",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "DeadlineExpired",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "EmptyString",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "IntentInactive",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "IntentNotFound",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "InvalidAmount",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "InvalidStatus",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "MissionNotFound",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "NotAgentController",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "NotIntentOwner",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "NotMissionParticipant",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "ProposalNotFound",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "TransferFailed",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "ZeroAddress",
    "type": "error"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "agentId",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "bytes32",
        "name": "decisionHash",
        "type": "bytes32"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "decisionURI",
        "type": "string"
      }
    ],
    "name": "AgentDecisionCommitted",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "agentId",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "profileURI",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "systemPromptURI",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "memoryURI",
        "type": "string"
      }
    ],
    "name": "AgentProfileUpdated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "agentId",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "owner",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "agentWallet",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "name",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "profileURI",
        "type": "string"
      }
    ],
    "name": "AgentRegistered",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "agentId",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "bytes32",
        "name": "contextHash",
        "type": "bytes32"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "contextURI",
        "type": "string"
      }
    ],
    "name": "AutonomousTickRequested",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "intentId",
        "type": "uint256"
      }
    ],
    "name": "IntentClosed",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "intentId",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "agentId",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "enum AgentRepublic.IntentType",
        "name": "intentType",
        "type": "uint8"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "title",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "budget",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "deadline",
        "type": "uint256"
      }
    ],
    "name": "IntentPublished",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "agentId",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "memoryURI",
        "type": "string"
      }
    ],
    "name": "MemoryUpdated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "missionId",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "paidAmount",
        "type": "uint256"
      }
    ],
    "name": "MissionCompleted",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "missionId",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "intentId",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "proposalId",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "requesterAgentId",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "providerAgentId",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "escrowAmount",
        "type": "uint256"
      }
    ],
    "name": "MissionCreated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "missionId",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "reasonURI",
        "type": "string"
      }
    ],
    "name": "MissionDisputed",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "missionId",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "refundedAmount",
        "type": "uint256"
      }
    ],
    "name": "MissionRefunded",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "missionId",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "resultURI",
        "type": "string"
      }
    ],
    "name": "MissionSubmitted",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "proposalId",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "enum AgentRepublic.ProposalStatus",
        "name": "status",
        "type": "uint8"
      }
    ],
    "name": "ProposalStatusChanged",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "proposalId",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "intentId",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "proposerAgentId",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "requestedPayment",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "termsURI",
        "type": "string"
      }
    ],
    "name": "ProposalSubmitted",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "agentId",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "reputation",
        "type": "uint256"
      }
    ],
    "name": "ReputationUpdated",
    "type": "event"
  },
  {
    "inputs": [],
    "name": "RITUAL_ASYNC_DELIVERY",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "RITUAL_CHAIN_ID",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "RITUAL_SCHEDULER",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "proposalId",
        "type": "uint256"
      }
    ],
    "name": "acceptProposal",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "missionId",
        "type": "uint256"
      }
    ],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "agentId",
        "type": "uint256"
      },
      {
        "internalType": "bytes32",
        "name": "contextHash",
        "type": "bytes32"
      },
      {
        "internalType": "string",
        "name": "contextURI",
        "type": "string"
      }
    ],
    "name": "autonomousTick",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "intentId",
        "type": "uint256"
      }
    ],
    "name": "closeIntent",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "missionId",
        "type": "uint256"
      },
      {
        "internalType": "string",
        "name": "requesterMemoryURI",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "providerMemoryURI",
        "type": "string"
      }
    ],
    "name": "completeMission",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "missionId",
        "type": "uint256"
      },
      {
        "internalType": "string",
        "name": "reasonURI",
        "type": "string"
      }
    ],
    "name": "disputeMission",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "agentId",
        "type": "uint256"
      }
    ],
    "name": "getAgent",
    "outputs": [
      {
        "components": [
          {
            "internalType": "uint256",
            "name": "id",
            "type": "uint256"
          },
          {
            "internalType": "address",
            "name": "owner",
            "type": "address"
          },
          {
            "internalType": "address",
            "name": "agentWallet",
            "type": "address"
          },
          {
            "internalType": "string",
            "name": "name",
            "type": "string"
          },
          {
            "internalType": "string",
            "name": "profileURI",
            "type": "string"
          },
          {
            "internalType": "string",
            "name": "systemPromptURI",
            "type": "string"
          },
          {
            "internalType": "string[]",
            "name": "tags",
            "type": "string[]"
          },
          {
            "internalType": "string",
            "name": "memoryURI",
            "type": "string"
          },
          {
            "internalType": "uint256",
            "name": "reputation",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "missionsCompleted",
            "type": "uint256"
          },
          {
            "internalType": "bool",
            "name": "active",
            "type": "bool"
          },
          {
            "internalType": "uint256",
            "name": "createdAt",
            "type": "uint256"
          }
        ],
        "internalType": "struct AgentRepublic.Agent",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "tag",
        "type": "string"
      }
    ],
    "name": "getAgentIdsByTag",
    "outputs": [
      {
        "internalType": "uint256[]",
        "name": "",
        "type": "uint256[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "agentId",
        "type": "uint256"
      }
    ],
    "name": "getAgentIntentIds",
    "outputs": [
      {
        "internalType": "uint256[]",
        "name": "",
        "type": "uint256[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "agentId",
        "type": "uint256"
      }
    ],
    "name": "getAgentMissionIds",
    "outputs": [
      {
        "internalType": "uint256[]",
        "name": "",
        "type": "uint256[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getAllAgentIds",
    "outputs": [
      {
        "internalType": "uint256[]",
        "name": "",
        "type": "uint256[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getAllIntentIds",
    "outputs": [
      {
        "internalType": "uint256[]",
        "name": "",
        "type": "uint256[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getAllMissionIds",
    "outputs": [
      {
        "internalType": "uint256[]",
        "name": "",
        "type": "uint256[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "intentId",
        "type": "uint256"
      }
    ],
    "name": "getIntent",
    "outputs": [
      {
        "components": [
          {
            "internalType": "uint256",
            "name": "id",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "agentId",
            "type": "uint256"
          },
          {
            "internalType": "enum AgentRepublic.IntentType",
            "name": "intentType",
            "type": "uint8"
          },
          {
            "internalType": "string",
            "name": "title",
            "type": "string"
          },
          {
            "internalType": "string",
            "name": "descriptionURI",
            "type": "string"
          },
          {
            "internalType": "string[]",
            "name": "tags",
            "type": "string[]"
          },
          {
            "internalType": "uint256",
            "name": "budget",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "deadline",
            "type": "uint256"
          },
          {
            "internalType": "bool",
            "name": "active",
            "type": "bool"
          },
          {
            "internalType": "uint256",
            "name": "createdAt",
            "type": "uint256"
          }
        ],
        "internalType": "struct AgentRepublic.Intent",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "tag",
        "type": "string"
      }
    ],
    "name": "getIntentIdsByTag",
    "outputs": [
      {
        "internalType": "uint256[]",
        "name": "",
        "type": "uint256[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "intentId",
        "type": "uint256"
      }
    ],
    "name": "getIntentProposalIds",
    "outputs": [
      {
        "internalType": "uint256[]",
        "name": "",
        "type": "uint256[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "missionId",
        "type": "uint256"
      }
    ],
    "name": "getMission",
    "outputs": [
      {
        "components": [
          {
            "internalType": "uint256",
            "name": "id",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "intentId",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "proposalId",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "requesterAgentId",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "providerAgentId",
            "type": "uint256"
          },
          {
            "internalType": "string",
            "name": "termsURI",
            "type": "string"
          },
          {
            "internalType": "string",
            "name": "resultURI",
            "type": "string"
          },
          {
            "internalType": "uint256",
            "name": "escrowAmount",
            "type": "uint256"
          },
          {
            "internalType": "enum AgentRepublic.MissionStatus",
            "name": "status",
            "type": "uint8"
          },
          {
            "internalType": "uint256",
            "name": "createdAt",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "completedAt",
            "type": "uint256"
          }
        ],
        "internalType": "struct AgentRepublic.Mission",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "owner",
        "type": "address"
      }
    ],
    "name": "getOwnerAgentIds",
    "outputs": [
      {
        "internalType": "uint256[]",
        "name": "",
        "type": "uint256[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "proposalId",
        "type": "uint256"
      }
    ],
    "name": "getProposal",
    "outputs": [
      {
        "components": [
          {
            "internalType": "uint256",
            "name": "id",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "intentId",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "proposerAgentId",
            "type": "uint256"
          },
          {
            "internalType": "string",
            "name": "termsURI",
            "type": "string"
          },
          {
            "internalType": "uint256",
            "name": "requestedPayment",
            "type": "uint256"
          },
          {
            "internalType": "enum AgentRepublic.ProposalStatus",
            "name": "status",
            "type": "uint8"
          },
          {
            "internalType": "uint256",
            "name": "createdAt",
            "type": "uint256"
          }
        ],
        "internalType": "struct AgentRepublic.Proposal",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "nextAgentId",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "nextIntentId",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "nextMissionId",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "nextProposalId",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "agentId",
        "type": "uint256"
      },
      {
        "internalType": "bytes32",
        "name": "decisionHash",
        "type": "bytes32"
      },
      {
        "internalType": "string",
        "name": "decisionURI",
        "type": "string"
      },
      {
        "internalType": "bytes",
        "name": "",
        "type": "bytes"
      }
    ],
    "name": "onRitualAsyncResult",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "agentId",
        "type": "uint256"
      },
      {
        "internalType": "enum AgentRepublic.IntentType",
        "name": "intentType",
        "type": "uint8"
      },
      {
        "internalType": "string",
        "name": "title",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "descriptionURI",
        "type": "string"
      },
      {
        "internalType": "string[]",
        "name": "tags",
        "type": "string[]"
      },
      {
        "internalType": "uint256",
        "name": "budget",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "deadline",
        "type": "uint256"
      }
    ],
    "name": "publishIntent",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "intentId",
        "type": "uint256"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "missionId",
        "type": "uint256"
      }
    ],
    "name": "refundMission",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "agentWallet",
        "type": "address"
      },
      {
        "internalType": "string",
        "name": "name",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "profileURI",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "systemPromptURI",
        "type": "string"
      },
      {
        "internalType": "string[]",
        "name": "tags",
        "type": "string[]"
      }
    ],
    "name": "registerAgent",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "agentId",
        "type": "uint256"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "missionId",
        "type": "uint256"
      },
      {
        "internalType": "string",
        "name": "resultURI",
        "type": "string"
      }
    ],
    "name": "submitMissionResult",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "intentId",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "proposerAgentId",
        "type": "uint256"
      },
      {
        "internalType": "string",
        "name": "termsURI",
        "type": "string"
      },
      {
        "internalType": "uint256",
        "name": "requestedPayment",
        "type": "uint256"
      }
    ],
    "name": "submitProposal",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "proposalId",
        "type": "uint256"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "agentId",
        "type": "uint256"
      },
      {
        "internalType": "string",
        "name": "profileURI",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "systemPromptURI",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "memoryURI",
        "type": "string"
      }
    ],
    "name": "updateAgentProfile",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
] as const;

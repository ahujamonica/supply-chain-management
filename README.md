


A blockchain-based supply chain tracking application that records product batch creation, shipment, and delivery on the Ethereum Sepolia Testnet.

## Overview

This project demonstrates how blockchain technology can improve transparency and traceability in a retail supply chain. It provides a React-based dashboard connected to a Solidity smart contract, allowing supply chain participants to interact with product batches through MetaMask.

The application follows three stages:

**Farmer → Distributor → Retailer**

Each batch progresses through the following lifecycle:

`Created → Shipped → Delivered`

Blockchain transactions provide a verifiable record of these state changes.

## Features

- **Wallet Connection:** Connect to the application using MetaMask.
- **Batch Creation:** Create product batches with an ID, name, quantity, distributor address, and retailer address.
- **Batch Tracking:** Retrieve batch details using the batch ID.
- **Shipment Management:** Allow the assigned distributor to mark a batch as shipped.
- **Delivery Confirmation:** Allow the assigned retailer to confirm delivery.
- **Lifecycle Tracking:** Maintain batch status on the blockchain.
- **Transaction Verification:** Record blockchain events for batch creation, shipment, and delivery.
- **Role-Aware Dashboard:** Display actions according to the configured participant wallet.

## Technology Stack

| Component | Technology |
|---|---|
| Frontend | React.js, JavaScript, CSS |
| Smart Contract | Solidity |
| Blockchain | Ethereum Sepolia Testnet |
| Wallet | MetaMask |
| Blockchain Integration | ethers.js |
| Contract Development and Deployment | Remix IDE |
| Runtime and Package Management | Node.js, npm |
| Version Control | Git and GitHub |

## System Architecture

```text
              User
               |
               v
       React Dashboard
               |
               v
         MetaMask Wallet
               |
               v
          ethers.js
               |
               v
      SupplyChainBatch.sol
               |
               v
     Ethereum Sepolia Testnet
               |
               v
       Blockchain Records
```

The React frontend communicates with the deployed Solidity contract through MetaMask and ethers.js. Users sign transactions using their connected wallets, and the smart contract updates the batch lifecycle on the Sepolia network.

## Supply Chain Workflow

### 1. Farmer – Create Batch

- Connect MetaMask using the configured Farmer account.
- Enter the batch ID, product name, quantity, distributor address, and retailer address.
- Submit the transaction.
- Approve it through MetaMask.
- The batch is recorded with the initial status `Created`.

### 2. Distributor – Ship Batch

- Switch MetaMask to the assigned Distributor account.
- Locate a batch with status `Created`.
- Select the Ship action.
- Approve the transaction in MetaMask.
- The batch status changes to `Shipped`.

### 3. Retailer – Confirm Delivery

- Switch MetaMask to the assigned Retailer account.
- Locate a batch with status `Shipped`.
- Select the Deliver action.
- Approve the transaction in MetaMask.
- The batch status changes to `Delivered`.

### 4. Batch Lookup

Users can search for a batch using its ID and retrieve its available details and current lifecycle status.

## Smart Contract

The project uses the `SupplyChainBatch` Solidity contract.

Its main functions include:

| Function | Purpose |
|---|---|
| `createBatch()` | Creates a new product batch |
| `shipBatch()` | Updates a batch to Shipped |
| `deliverBatch()` | Updates a batch to Delivered |
| `getStateText()` | Returns the readable batch status |
| `getBatchReadable()` | Returns readable batch information |

The contract also defines events for batch creation, shipment, and delivery.

It stores batch details including the product name, quantity, participant addresses, lifecycle state, and timestamps.

## Project Structure

```text
supply-chain-management/
│
├── contracts/
│   ├── supply_chain.sol
│   ├── abi/
│   │   └── SupplyChain.json
│   └── deployment/
│       └── contract-address.txt
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── abi/
│   │   │   └── SupplyChain.json
│   │   ├── App.js
│   │   ├── App.css
│   │   ├── contract.js
│   │   ├── index.js
│   │   └── index.css
│   ├── package.json
│   └── package-lock.json
│
├── docs/
│   ├── architecture.md
│   ├── deployment-info.md
│   ├── deployment.md
│   ├── metamask-setup.md
│   └── testing.md
│
├── Screenshots_UI/
├── .gitignore
├── LICENSE
└── README.md
```

## Getting Started

### Prerequisites

Install or configure the following:

- Node.js and npm
- Git
- MetaMask browser extension
- Ethereum Sepolia Testnet access
- Remix IDE (for deploying the smart contract)

### 1. Clone the Repository

```bash
git clone https://github.com/ahujamonica/supply-chain-management.git
cd supply-chain-management
```

### 2. Install Frontend Dependencies

```bash
cd frontend
npm install
```

### 3. Configure Environment Variables

Create a `.env` file inside the `frontend` directory.

Add the following configuration:

```env
REACT_APP_CONTRACT_ADDRESS=YOUR_DEPLOYED_CONTRACT_ADDRESS
REACT_APP_FARMER=YOUR_FARMER_WALLET_ADDRESS
REACT_APP_DISTRIBUTOR=YOUR_DISTRIBUTOR_WALLET_ADDRESS
REACT_APP_RETAILER=YOUR_RETAILER_WALLET_ADDRESS
```

Replace the placeholder values with the deployed contract address and corresponding MetaMask account addresses.

**Important:** Never upload your actual `.env` file, private keys, or seed phrases to GitHub.

### 4. Configure MetaMask

- Install and unlock MetaMask.
- Enable the Ethereum Sepolia Testnet.
- Import or select the accounts assigned to the Farmer, Distributor, and Retailer roles.
- Ensure the accounts have Sepolia test ETH to pay transaction fees.

Refer to `docs/metamask-setup.md` for additional instructions.

### 5. Deploy the Smart Contract

The Solidity contract is located at:

`contracts/supply_chain.sol`

To deploy:

1. Open Remix IDE.
2. Import or paste the Solidity contract.
3. Compile using a compatible Solidity 0.8.x compiler.
4. Select Injected Provider – MetaMask.
5. Connect to Ethereum Sepolia.
6. Deploy `SupplyChainBatch`.
7. Copy the deployed contract address into `frontend/.env`.

Refer to `docs/deployment.md` for the deployment procedure.

### 6. Run the Application

From the `frontend` directory, execute:

```bash
npm start
```

The application will be available at:

`http://localhost:3000`

## Testing and Demonstration

The application was demonstrated on Ethereum Sepolia using three MetaMask accounts.

A sample product batch was used to demonstrate the complete lifecycle:

| Participant | Action | Result |
|---|---|---|
| Farmer | Create batch | Created |
| Distributor | Ship batch | Shipped |
| Retailer | Confirm delivery | Delivered |

The demonstration also covered batch lookup and invalid wallet-role scenarios.

### Screenshots

The `Screenshots_UI` directory contains screenshots of the application and its workflow, including:

- Dashboard interface
- Batch creation and lookup
- Distributor shipment
- Retailer delivery
- Updated batch records
- Invalid wallet-role handling
- Non-existing batch lookup

## Important Implementation Notes and Limitations

- The application is an educational proof of concept, not a production-ready retail platform.
- It demonstrates product batch tracking rather than a complete e-commerce system with shopping carts, payments, and inventory management.
- Wallet-role configuration is handled by the frontend. The smart contract restricts shipment and delivery to the assigned distributor and retailer. Batch creation itself is public at the contract level, so the Farmer restriction should not be treated as an on-chain authorization guarantee.
- The current deployment uses the Sepolia test network and test ETH, not real currency or mainnet transactions.
- Participant addresses are configured through environment variables.

## Future Enhancements

- On-chain participant registration and role management.
- QR-code-based product verification.
- Product history and timestamp visualization.
- IPFS integration for product certificates and documents.
- Analytics and reporting dashboard.
- Deployment to a production blockchain network.

## Documentation

Additional project documentation is available in the `docs/` directory:

- `architecture.md` – System architecture
- `deployment.md` – Smart contract deployment
- `deployment-info.md` – Deployment information
- `metamask-setup.md` – Wallet configuration
- `testing.md` – Testing procedure and scenarios

## Acknowledgement

This project builds upon an existing open-source supply chain implementation. The frontend configuration, presentation, project documentation, and demonstration have been adapted for this D-Mart-themed academic project. Original source and applicable licence notices are retained.

Original reference repository:

https://github.com/micag2025/Supply_Chain_project

## License

Refer to the included `LICENSE` file for the applicable license terms.

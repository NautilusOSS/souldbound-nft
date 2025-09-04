# Achievement NFT Contract Documentation

## Overview

The Achievement NFT contract is a soulbound (non-transferable) NFT implementation built on Algorand using the ARC-72 standard. This contract allows for the creation of achievement-based NFTs that cannot be transferred between accounts, making them ideal for representing accomplishments, badges, or other non-tradeable digital assets.

## Key Features

- **Soulbound NFTs**: Tokens cannot be transferred between accounts
- **Mintable**: Authorized minters can create new NFTs
- **Burnable**: Authorized minters can destroy NFTs
- **Ownable**: Contract has an owner with administrative privileges
- **Upgradeable**: Contract can be upgraded by the owner
- **Bootstrappable**: Contract requires bootstrapping before use
- **ARC-72 Compliant**: Implements the Algorand ARC-72 NFT standard

## Contract Structure

The contract consists of two main classes:

1. **SoulboundARC72Token**: Base class that overrides transfer functionality to make NFTs non-transferable
2. **MintableSBNFT**: Main contract that inherits from SoulboundARC72Token, Ownable, and Upgradeable

## State Variables

| Variable | Type | Description |
|----------|------|-------------|
| `owner` | `Account` | Contract owner address |
| `upgrader` | `Account` | Address authorized to upgrade the contract |
| `contract_version` | `UInt64` | Current contract version |
| `deployment_version` | `UInt64` | Deployment version |
| `updatable` | `bool` | Whether the contract can be upgraded |
| `totalSupply` | `BigUInt` | Total number of NFTs minted |
| `minter` | `BoxMap[Account, UInt64]` | Mapping of authorized minters and their minting limits |
| `soulbound_nft` | `UInt64` | Soulbound NFT identifier |
| `achievement_token` | `UInt64` | Achievement token identifier |
| `bootstrapped` | `UInt64` | Whether the contract has been bootstrapped |

## Constants

| Constant | Value | Description |
|----------|-------|-------------|
| `mint_fee` | 0 | Fee for minting (currently set to 0) |
| `mint_cost` | 336700 | Cost in microAlgos for minting an NFT |
| `approve_minter_cost` | 20900 | Cost in microAlgos for approving a minter |
| `set_metadata_uri_cost` | 109700 | Cost in microAlgos for setting metadata URI |

## Methods

### Bootstrap Methods

#### `bootstrap()`
- **Access**: Owner only
- **Description**: Bootstraps the contract, making it ready for use
- **Requirements**: Contract must not already be bootstrapped

#### `bootstrap_cost() -> UInt64`
- **Access**: Public
- **Description**: Returns the cost in microAlgos required to bootstrap the contract
- **Returns**: Global minimum balance

### Administrative Methods

#### `approve_minter(to: Address, approve: UInt64)`
- **Access**: Owner only
- **Description**: Approves an address to mint NFTs with a specified limit
- **Parameters**:
  - `to`: Address to approve as a minter
  - `approve`: Number of NFTs the address can mint
- **Cost**: 20900 microAlgos (set via `approve_minter_cost()`)

#### `set_metadata_uri(metadata_uri: Bytes256)`
- **Access**: Owner only
- **Description**: Sets the metadata URI for all NFTs minted by this contract
- **Parameters**:
  - `metadata_uri`: URI containing NFT metadata
- **Cost**: 109700 microAlgos (set via `set_metadata_uri_cost()`)

### Minting Methods

#### `mint(to: Address) -> UInt256`
- **Access**: Approved minters only
- **Description**: Mints a new NFT to the specified address
- **Parameters**:
  - `to`: Address to receive the NFT
- **Returns**: Token ID of the minted NFT
- **Requirements**:
  - Caller must be an approved minter
  - Sufficient payment must be provided (mint_cost + mint_fee)
  - Token must not already exist for the given address

#### `mint_cost() -> UInt64`
- **Access**: Public
- **Description**: Returns the cost in microAlgos required to mint an NFT
- **Returns**: 336700 microAlgos

### Burning Methods

#### `burn(account: Address)`
- **Access**: Approved minters only
- **Description**: Burns an NFT owned by the specified account
- **Parameters**:
  - `account`: Address of the NFT owner
- **Requirements**:
  - Caller must be an approved minter
  - Account must own the NFT
  - Token must exist

### Transfer Methods

#### `arc72_transferFrom(from: Address, to: Address, tokenId: UInt256)`
- **Access**: Public (but disabled)
- **Description**: Overridden to prevent transfers (soulbound functionality)
- **Note**: This method is intentionally empty to make NFTs non-transferable

### Metadata Methods

#### `metadata_uri() -> Bytes256`
- **Access**: Public
- **Description**: Returns the current metadata URI for NFTs
- **Returns**: Current metadata URI or zero bytes if not set

#### `set_metadata_uri_cost() -> UInt64`
- **Access**: Public
- **Description**: Returns the cost in microAlgos required to set metadata URI
- **Returns**: 109700 microAlgos

### Upgrade Methods

#### `post_update()`
- **Access**: Upgrader only
- **Description**: Updates the contract version after deployment
- **Requirements**: Caller must be the upgrader

## Getting Started

This section provides a step-by-step guide to get your Achievement NFT contract up and running using the command-line interface.

### Prerequisites

Before starting, ensure you have:
- Node.js installed
- Access to an Algorand account with sufficient ALGO balance
- The contract source code and dependencies installed

### Step 1: Deploy the Contract

First, deploy the Achievement NFT contract to your chosen network:

```bash
node main.js deploy --type MintableSBNFT --name MintableSBNFT
```

This command will:
- Create a new application on the Algorand blockchain
- Set your account as the owner and upgrader
- Return an application ID that you'll need for subsequent operations

**Note**: Save the application ID returned from this command - you'll need it for all future operations.

### Step 2: Bootstrap the Contract

After deployment, the contract must be bootstrapped before it can be used:

```bash
node main.js bootstrap --appId <APP_ID>
```

Replace `<APP_ID>` with the application ID from step 1.

This step:
- Initializes the contract for use
- Sets up the global state
- Is required before any other operations can be performed

### Step 3: Approve a Minter

To enable NFT minting, you need to approve one or more addresses as minters:

```bash
node main.js approve-minter --appId <APP_ID> --account <MINTER_ADDRESS>
```

Example:
```bash
node main.js approve-minter --appId 123 --account PMIVXUAIRMLNCXKCWB3DQ554EYRCYI3CCHFYIK5YJRYM6X43PYVZSGHPO4
```

This command:
- Approves the specified address to mint NFTs
- Requires 20,900 microAlgos as a fee
- Only the contract owner can approve minters

**Note**: Approved minters are authorized to call both `mint` and `burn` operations. If you're using a single account for testing, consider using your deployer address as the minter to simplify operations.

### Step 4: Set Metadata URI

Set the metadata URI that will be associated with all NFTs minted by this contract:

```bash
node main.js set-metadata-uri --appId <APP_ID> --metadataURI "https://your-metadata-endpoint.com/metadata"
```

This command:
- Sets the metadata URI for all NFTs
- Requires 109,700 microAlgos as a fee
- Only the contract owner can set the metadata URI

### Next Steps

After completing these steps, your contract is ready for use! You can now:

- **Mint NFTs**: Use the `mint` command to create new NFTs
- **Burn NFTs**: Use the `burn` command to destroy NFTs
- **Query Metadata**: Use the `metadata-uri` command to retrieve the current metadata URI

## Usage Examples

### Command Line Interface

The contract provides a command-line interface for common operations:

#### Deploying the Contract
```bash
node main.js deploy --type MintableSBNFT --name MintableSBNFT
```

#### Bootstrapping the Contract
```bash
node main.js bootstrap --appId 1
```

#### Setting Metadata URI
```bash
node main.js set-metadata-uri --appId 1 --metadataURI "https://..."
```

#### Approving a Minter
```bash
node main.js approve-minter --appId 1 --account PMIVXUAIRMLNCXKCWB3DQ554EYRCYI3CCHFYIK5YJRYM6X43PYVZSGHPO4 --approve true
```

#### Minting an NFT
```bash
node main.js mint --appId 1 --account PMIVXUAIRMLNCXKCWB3DQ554EYRCYI3CCHFYIK5YJRYM6X43PYVZSGHPO4
```

#### Burning an NFT
```bash
node main.js burn --appId 1 --account PMIVXUAIRMLNCXKCWB3DQ554EYRCYI3CCHFYIK5YJRYM6X43PYVZSGHPO4
```

#### Getting Metadata URI
```bash
node main.js metadata-uri --appId 1
```

#### Post Update (Contract Upgrade)
```bash
node main.js post-update --appId 1
```

### Programmatic Usage

#### Bootstrapping the Contract
```python
# Owner bootstraps the contract
contract.bootstrap()
```

#### Approving a Minter
```python
# Owner approves an address to mint up to 100 NFTs
contract.approve_minter(minter_address, 100)
```

#### Minting an NFT
```python
# Approved minter mints an NFT to a user
token_id = contract.mint(user_address)
```

#### Burning an NFT
```python
# Approved minter burns an NFT from a user
contract.burn(user_address)
```

#### Setting Metadata URI
```python
# Owner sets the metadata URI for all NFTs
contract.set_metadata_uri(metadata_uri_bytes)
```

#### Getting Mint Cost
```python
# Get the cost required to mint an NFT
cost = contract.mint_cost()
```

#### Getting Metadata URI
```python
# Get the current metadata URI
uri = contract.metadata_uri()
```

#### Post Update
```python
# Upgrader updates the contract version
contract.post_update()
```

## Security Considerations

1. **Access Control**: Only the owner can approve minters and set metadata
2. **Bootstrap Requirement**: Contract must be bootstrapped before use
3. **Payment Verification**: Minting requires exact payment amount (336700 microAlgos)
4. **Soulbound Protection**: NFTs cannot be transferred, preventing trading
5. **Ownership Verification**: Burning requires the account to own the NFT
6. **Duplicate Prevention**: Each address can only have one NFT minted to it
7. **Metadata Cost**: Setting metadata URI requires 109700 microAlgos
8. **Minter Approval Cost**: Approving a minter requires 20900 microAlgos
9. **Upgrade Control**: Only the upgrader can perform post-update operations

## Events

The contract emits ARC-72 Transfer events for:
- Minting: `Transfer(ZeroAddress, ToAddress, TokenId)`
- Burning: `Transfer(FromAddress, ZeroAddress, TokenId)`

## Dependencies

- **algopy**: Algorand Python SDK
- **opensubmarine**: OpenSubmarine framework providing ARC-72, Ownable, and Upgradeable functionality

## Deployment

The contract should be deployed with:
- Creator address as the initial owner and upgrader
- Proper initialization of all state variables
- Sufficient Algo balance for contract operations
- Bootstrapping required before first use

## Contract Upgrades

To upgrade the contract to a new version:

### Step 1: Deploy New Contract
Deploy the new contract version using the same deployer account as the original contract:

```bash
node main.js deploy --type MintableSBNFT --name MintableSBNFT
```

**Important**: Use the same deployer account that was used for the original contract deployment. This ensures the new contract inherits the same owner and upgrader permissions, and **produces the same application ID** as the original contract.

### Step 2: Run Post-Update
After deployment, run the post-update command to finalize the upgrade:

```bash
node main.js post-update --appId <APP_ID>
```

Replace `<APP_ID>` with the application ID of the contract (which should be the same as the original).

### Upgrade Process Details

1. **Same Account Requirement**: The upgrade must be deployed from the same account that deployed the original contract
2. **Same App ID**: The new deployment will produce the same application ID as the original contract
3. **State Preservation**: The new contract will maintain the same owner and upgrader addresses
4. **Version Management**: The `post_update()` method updates the contract version to reflect the upgrade
5. **Access Control**: Only the upgrader account can execute the post-update operation

### Verification

After upgrading, verify the contract is working correctly by:
- Testing basic functionality (minting, burning)
- Checking that existing NFTs are still accessible
- Verifying that administrative functions work as expected

## Testing

The contract includes comprehensive tests covering:

### Core Functionality Tests (`contract.test.js`)
- NFT minting functionality
- NFT burning functionality
- Access control for minters
- Prevention of duplicate NFTs per address
- Soulbound transfer prevention
- Metadata URI management
- Non-minter access restrictions

### Bootstrap Tests (`bootstrap.test.js`)
- Contract bootstrapping functionality
- Bootstrap requirement validation

### Update Tests (`update.test.js`)
- Contract upgrade functionality
- Post-update operations

### Test Coverage Areas
- **Minting**: Successful minting, duplicate prevention, access control
- **Burning**: Successful burning, non-existent token handling, access control
- **Access Control**: Owner-only operations, minter-only operations
- **Metadata**: Setting and retrieving metadata URI
- **Bootstrap**: Contract initialization requirement
- **Upgrades**: Contract version management
- **Soulbound**: Transfer prevention verification

## Network Support

The contract supports multiple networks:
- **Devnet**: Local development environment
- **Testnet**: Voi testnet for testing
- **Mainnet**: Voi mainnet for production

Network configuration is handled automatically based on the `--network` flag or environment variables.

# Achievement NFT Contract Documentation

## Overview

The Achievement NFT contract is a soulbound (non-transferable) NFT implementation built on Algorand using the ARC-72 standard. This contract allows for the creation of achievement-based NFTs that cannot be transferred between accounts, making them ideal for representing accomplishments, badges, or other non-tradeable digital assets.

## Key Features

- **Soulbound NFTs**: Tokens cannot be transferred between accounts
- **Mintable**: Authorized minters can create new NFTs
- **Burnable**: Authorized minters can destroy NFTs
- **Ownable**: Contract has an owner with administrative privileges
- **Upgradeable**: Contract can be upgraded by the owner
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

## Constants

| Constant | Value | Description |
|----------|-------|-------------|
| `mint_fee` | 0 | Fee for minting (currently set to 0) |
| `mint_cost` | 336700 | Cost in microAlgos for minting an NFT |

## Methods

### Administrative Methods

#### `approve_minter(to: Address, approve: UInt64)`
- **Access**: Owner only
- **Description**: Approves an address to mint NFTs with a specified limit
- **Parameters**:
  - `to`: Address to approve as a minter
  - `approve`: Number of NFTs the address can mint

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

## Usage Examples

### Command Line Interface

The contract provides a command-line interface for common operations:

#### Deploying the Contract
```bash
node main.js deploy --type MintableSBNFT --name MintableSBNFT
```

#### Setting Metadata URI
```bash
node main.js set-metadata-uri --appId 1 --metadataURI "https://..."
```

#### Approving a Minter
```bash
node main.js approve-minter --appId 1 --account PMIVXUAIRMLNCXKCWB3DQ554EYRCYI3CCHFYIK5YJRYM6X43PYVZSGHPO4
```

#### Getting Metadata URI
```bash
node main.js metadata-uri --appId 1
```

### Programmatic Usage

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

## Security Considerations

1. **Access Control**: Only the owner can approve minters and set metadata
2. **Payment Verification**: Minting requires exact payment amount (336700 microAlgos)
3. **Soulbound Protection**: NFTs cannot be transferred, preventing trading
4. **Ownership Verification**: Burning requires the account to own the NFT
5. **Duplicate Prevention**: Each address can only have one NFT minted to it
6. **Metadata Cost**: Setting metadata URI requires 109700 microAlgos

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

## Testing

The contract includes comprehensive tests covering:
- NFT minting functionality
- NFT burning functionality
- Access control for minters
- Prevention of duplicate NFTs per address
- Soulbound transfer prevention
- Metadata URI management

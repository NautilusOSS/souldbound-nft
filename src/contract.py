from algopy import (
    Box,
    Bytes,
    Global,
    Account,
    BigUInt,
    Txn,
    arc4,
    subroutine,
    BoxMap,
    UInt64,
)
from opensubmarine import (
    ARC72Token,
    arc72_nft_data,
    arc72_Transfer,
    Ownable,
    Upgradeable,
)
from opensubmarine.utils.algorand import require_payment
from opensubmarine.utils.types import Bytes256


mint_fee = 0
mint_cost = 336700


class SoulboundARC72Token(ARC72Token):

    def __init__(self) -> None:
        super().__init__()  # call ARC72Token constructor

    # override
    @arc4.abimethod
    def arc72_transferFrom(
        self, from_: arc4.Address, to: arc4.Address, tokenId: arc4.UInt256
    ) -> None:
        """
        Transfers ownership of an NFT
        """
        pass


class MintableSBNFT(SoulboundARC72Token, Ownable, Upgradeable):

    def __init__(self) -> None:
        # ownable state
        self.owner = Global.creator_address
        # upgradeable state
        self.upgrader = Global.creator_address
        self.contract_version = UInt64(0)
        self.deployment_version = UInt64(0)
        self.updatable = bool(1)
        # arc72 state
        self.totalSupply = BigUInt()
        # achievement nft state
        self.minter = BoxMap(Account, UInt64)
        self.soulbound_nft = UInt64(1)
        self.achievement_token = UInt64(1)

    @subroutine
    def _only_owner(self) -> None:
        assert Txn.sender == self.owner, "only owner can call this function"

    @subroutine
    def _only_minter(self) -> None:
        assert Txn.sender in self.minter, "only minter can call this function"

    @arc4.abimethod
    def approve_minter(self, to: arc4.Address, approve: arc4.UInt64) -> None:
        self._only_owner()
        self._approve_minter(to.native, approve.native)

    @subroutine
    def _approve_minter(self, to: Account, approve: UInt64) -> None:
        self.minter[to] = approve

    @arc4.abimethod
    def mint(
        self,
        to: arc4.Address,
    ) -> arc4.UInt256:
        """
        Mint a new NFT
        """
        self._only_minter()
        return arc4.UInt256(self._mint(to.native, BigUInt.from_bytes(to.bytes)))

    @subroutine
    def _mint(self, to: Account, tokenId: BigUInt) -> BigUInt:
        nft_data = self._nft_data(tokenId)
        assert nft_data.index == 0, "token must not exist"
        payment_amount = require_payment(Txn.sender)
        assert payment_amount >= mint_cost + mint_fee, "payment amount accurate"
        index = arc4.UInt256(
            self._increment_counter()
        ).native  # BigUInt to BigUInt(UInt256)
        self._increment_totalSupply()
        self.nft_index[index] = tokenId
        self.nft_data[tokenId] = arc72_nft_data(
            owner=arc4.Address(to),
            approved=arc4.Address(Global.zero_address),
            index=arc4.UInt256(index),
            token_id=arc4.UInt256(tokenId),
            metadata=self.metadata_uri(),
        )
        self._holder_increment_balance(to)
        arc4.emit(
            arc72_Transfer(
                arc4.Address(Global.zero_address),
                arc4.Address(to),
                arc4.UInt256(tokenId),
            )
        )
        return index

    @arc4.abimethod
    def mint_cost(self) -> UInt64:
        return UInt64(mint_cost)

    @arc4.abimethod
    def burn(self, account: arc4.Address) -> None:
        self._only_minter()
        self._burn(account.native, BigUInt.from_bytes(account.bytes))

    @subroutine
    def _burn(self, account: Account, tokenId: BigUInt) -> None:
        nft_data = self._nft_data(tokenId)
        assert nft_data.index != 0, "token must exist"
        assert nft_data.owner == account, "account must own the token"
        self._holder_decrement_balance(account)
        self._decrement_totalSupply()
        del self.nft_index[nft_data.index.native]
        del self.nft_data[tokenId]
        arc4.emit(
            arc72_Transfer(
                arc4.Address(account),
                arc4.Address(Global.zero_address),
                arc4.UInt256(tokenId),
            )
        )

    @arc4.abimethod
    def set_metadata_uri(self, metadata_uri: Bytes256) -> None:
        self._only_owner()
        self._set_metadata_uri(metadata_uri.bytes)

    @subroutine
    def _set_metadata_uri(self, metadata_uri: Bytes) -> None:
        box = Box(Bytes, key=b"metadata_uri")
        box.value = metadata_uri

    @arc4.abimethod
    def set_metadata_uri_cost(self) -> arc4.UInt64:
        return arc4.UInt64(self._set_metadata_uri_cost())

    @subroutine
    def _set_metadata_uri_cost(self) -> UInt64:
        return UInt64(109700)

    @arc4.abimethod
    def metadata_uri(self) -> Bytes256:
        return Bytes256.from_bytes(self._metadata_uri())

    @subroutine
    def _metadata_uri(self) -> Bytes:
        return Box(Bytes, key=b"metadata_uri").get(default=Bytes(b"\x00" * 256))

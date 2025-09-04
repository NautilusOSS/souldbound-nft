import { expect } from "chai";
import {
  approveMinter,
  arc72OwnerOf,
  burn,
  deploy,
  fund,
  getAccount,
  metadataURI,
  mint,
  setMetadataURI,
} from "../command.js";
import algosdk from "algosdk";

describe("MintableSBNFT Testing", function () {
  let deployOptions = {
    type: "MintableSBNFT",
    name: "MintableSBNFT",
    debug: false,
  };
  let owner;
  let minter;
  let player;
  let player2;
  let appId;

  before(async function () {
    owner = await getAccount();
    await fund(owner.addr, 10e6);
  });

  beforeEach(async function () {
    minter = await getAccount();
    player = await getAccount();
    player2 = await getAccount();
    await fund(minter.addr, 10e6);
    await fund(player.addr, 10e6);
    const { appId: id0 } = await deploy({
      ...deployOptions,
      ...owner,
    });
    appId = id0;
    await approveMinter({
      appId,
      account: minter.addr,
      approve: true,
      ...owner,
      debug: true,
    });
    expect(appId).to.not.equal(0);
  });

  afterEach(async function () {});

  it("should mint an NFT", async function () {
    const mintR = await mint({
      appId,
      account: player.addr,
      ...minter,
      debug: true,
    });
    expect(mintR.success).to.be.true;
  });

  it("should burn an NFT", async function () {
    const mintR = await mint({
      appId,
      account: player.addr,
      ...minter,
      debug: true,
    });
    const burnR = await burn({
      appId,
      account: player.addr,
      ...minter,
      debug: true,
    });
    expect(mintR.success).to.be.true;
    expect(burnR.success).to.be.true;
  });

  it("should not burn an NFT that does not exist", async function () {
    const burnR = await burn({
      appId,
      account: player.addr,
      ...minter,
      debug: true,
    });
  });

  it("should not allow a non-minter to mint an NFT", async function () {
    const mintR = await mint({
      appId,
      account: player.addr,
      ...owner,
      debug: true,
    });
    const mintR2 = await mint({
      appId,
      account: player.addr,
      ...player,
      debug: true,
    });
    const mintR3 = await mint({
      appId,
      account: player.addr,
      ...minter,
      debug: true,
    });
    expect(mintR.success).to.be.false;
    expect(mintR2.success).to.be.false;
    expect(mintR3.success).to.be.true;
  });

  it("should not allow a non-minter to burn an NFT", async function () {
    const mintR = await mint({
      appId,
      account: player.addr,
      ...minter,
      debug: true,
    });
    const burnR = await burn({
      appId,
      account: player.addr,
      ...owner,
      debug: true,
    });
    expect(mintR.success).to.be.true;
    expect(burnR.success).to.be.false;
  });

  it("should not allow minting and an nft that is already minted", async function () {
    const mintR = await mint({
      appId,
      account: player.addr,
      ...minter,
      debug: true,
    });
    expect(mintR.success).to.be.true;
    const mintR2 = await mint({
      appId,
      account: player.addr,
      ...minter,
      debug: true,
    });
    const mintR3 = await mint({
      appId,
      account: player2.addr,
      ...minter,
      debug: true,
    });
    expect(mintR2.success).to.be.false;
    expect(mintR2.success).to.be.false;
    expect(mintR3.success).to.be.true;
  });

  it("should not allow transfer of an NFT", async function () {
    const mintR = await mint({
      appId,
      account: player.addr,
      ...minter,
      debug: true,
    });
    const decodedPlayerAddr = algosdk.decodeAddress(player.addr);
    console.log({ decodedPlayerAddr });
    const ownerOfR = await arc72OwnerOf({
      appId,
      tokenId: BigInt(
        "0x" + Buffer.from(decodedPlayerAddr.publicKey).toString("hex")
      ),
      debug: true,
    });
    expect(mintR.success).to.be.true;
  });

  it("should set the metadata URI", async function () {
    const setMetadataURIR = await setMetadataURI({
      appId,
      metadataURI: "https://example.com",
      ...owner,
      debug: true,
    });
    const metadataURIR = await metadataURI({
      appId,
      ...owner,
      debug: true,
    });
    expect(metadataURIR).to.equal("https://example.com");
    expect(setMetadataURIR.success).to.be.true;
  });
});

import { expect } from "chai";
import {
  approveMinter,
  arc72OwnerOf,
  bootstrap,
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
  });

  afterEach(async function () {});

  it("should bootstrap the contract", async function () {
    const bootstrapR = await bootstrap({
      appId,
      ...owner,
      debug: true,
    });
    expect(bootstrapR.success).to.be.true;
  });
});

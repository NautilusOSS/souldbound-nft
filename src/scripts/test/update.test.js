import { expect } from "chai";
import { deploy, fund, getAccount, postUpdate } from "../command.js";

describe("MintableSBNFT Testing", function () {
  let deployOptions = {
    type: "MintableSBNFT",
    name: "MintableSBNFT",
    debug: true,
  };
  let owner;
  let minter;
  let player;
  let player2;
  let appId;

  before(async function () {});

  beforeEach(async function () {});

  afterEach(async function () {});

  it("should update the contract", async function () {
    const owner = await getAccount();
    await fund(owner.addr, 10e6);
    const { appId } = await deploy({
      ...deployOptions,
      ...owner,
      debug: true,
    });
    // REM if you call deploy again in same test it will deploy a new contract but this does
    //     not generally happen in practice
    const postUpdateR = await postUpdate({
      appId,
      ...owner,
      debug: true,
    });
    expect(postUpdateR).to.be.true;
  });
});

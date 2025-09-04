import { Command } from "commander";
import { MintableSbnftClient, APP_SPEC as MintableSbnftSpec, } from "./clients/MintableSBNFTClient.js";
import algosdk from "algosdk";
import * as dotenv from "dotenv";
import { CONTRACT } from "ulujs";
dotenv.config({ path: ".env" });
export const program = new Command();
// Global options
program
    .option("-n, --network <string>", "Specify network (devnet, testnet, mainnet)")
    .option("--algod-server <string>", "Override Algorand node server URL")
    .option("--algod-port <number>", "Override Algorand node port")
    .option("--indexer-server <string>", "Override Algorand indexer server URL")
    .option("--indexer-port <number>", "Override Algorand indexer port")
    .option("--algod-token <string>", "Override Algorand node token")
    .option("--indexer-token <string>", "Override Algorand indexer token")
    .option("-d, --debug", "Enable debug mode")
    .option("-s, --simulate", "Simulate transactions without sending")
    .option("--dry-run", "Show what would be done without executing")
    .option("-h, --help", "Show help information"); // (Commander also adds this automatically; keeping to avoid API change)
// Hook to handle global options and configure network
program.hook("preAction", (thisCommand) => {
    const options = thisCommand.opts();
    const network = (options.network || "devnet").toLowerCase();
    const debug = !!options.debug;
    const simulate = !!options.simulate;
    const dryRun = !!options.dryRun;
    console.log("Using network", network);
    // Update network configuration based on global options
    if (network === "testnet") {
        const ALGO_SERVER = "https://testnet-api.voi.nodely.dev";
        const ALGO_INDEXER_SERVER = "https://testnet-idx.voi.nodely.dev";
        const ALGO_PORT = 443;
        const ALGO_INDEXER_PORT = 443;
        if (!options.algodServer) {
            globalThis.ALGO_SERVER = ALGO_SERVER;
            globalThis.ALGO_PORT = ALGO_PORT;
        }
        if (!options.indexerServer) {
            globalThis.ALGO_INDEXER_SERVER = ALGO_INDEXER_SERVER;
            globalThis.ALGO_INDEXER_PORT = ALGO_INDEXER_PORT;
        }
    }
    else if (network === "mainnet") {
        const ALGO_SERVER = "https://mainnet-api.voi.nodely.dev";
        const ALGO_PORT = 443;
        const ALGO_INDEXER_SERVER = "https://mainnet-idx.voi.nodely.dev";
        const ALGO_INDEXER_PORT = 443;
        if (!options.algodServer) {
            globalThis.ALGO_SERVER = ALGO_SERVER;
            globalThis.ALGO_PORT = ALGO_PORT;
        }
        if (!options.indexerServer) {
            globalThis.ALGO_INDEXER_SERVER = ALGO_INDEXER_SERVER;
            globalThis.ALGO_INDEXER_PORT = ALGO_INDEXER_PORT;
        }
    }
    globalThis.GLOBAL_DEBUG = debug;
    globalThis.GLOBAL_SIMULATE = simulate;
    globalThis.GLOBAL_DRY_RUN = dryRun;
    globalThis.CURRENT_NETWORK_OPTIONS = { ...options, network };
});
const { MN } = process.env;
export const acc = algosdk.mnemonicToSecretKey(MN || "");
export const { addr, sk } = acc;
export const addressses = {
    deployer: addr,
};
export const sks = {
    deployer: sk,
};
// DEVNET defaults (only used if nothing else is provided)
const DEVNET_ALGO_SERVER = "http://localhost";
const DEVNET_ALGO_PORT = 4001;
const DEVNET_ALGO_INDEXER_SERVER = "http://localhost";
const DEVNET_ALGO_INDEXER_PORT = 8980;
// Function to get current network configuration
const getCurrentNetworkConfig = () => {
    const globalOptions = globalThis.CURRENT_NETWORK_OPTIONS;
    // Base defaults by network (fall back to devnet)
    const base = (() => {
        const network = globalOptions?.network || "devnet";
        if (network === "testnet") {
            return {
                server: "https://testnet-api.voi.nodely.dev",
                port: 443,
                indexerServer: "https://testnet-idx.voi.nodely.dev",
                indexerPort: 443,
            };
        }
        if (network === "mainnet") {
            return {
                server: "https://mainnet-api.voi.nodely.dev",
                port: 443,
                indexerServer: "https://mainnet-idx.voi.nodely.dev",
                indexerPort: 443,
            };
        }
        return {
            server: DEVNET_ALGO_SERVER,
            port: DEVNET_ALGO_PORT,
            indexerServer: DEVNET_ALGO_INDEXER_SERVER,
            indexerPort: DEVNET_ALGO_INDEXER_PORT,
        };
    })();
    const config = {
        server: globalOptions?.algodServer ||
            globalThis.ALGO_SERVER ||
            process.env.ALGOD_SERVER ||
            base.server,
        port: Number(globalOptions?.algodPort ||
            globalThis.ALGO_PORT ||
            process.env.ALGOD_PORT ||
            base.port),
        indexerServer: globalOptions?.indexerServer ||
            globalThis.ALGO_INDEXER_SERVER ||
            process.env.INDEXER_SERVER ||
            base.indexerServer,
        indexerPort: Number(globalOptions?.indexerPort ||
            globalThis.ALGO_INDEXER_PORT ||
            process.env.INDEXER_PORT ||
            base.indexerPort),
        token: globalOptions?.algodToken ||
            process.env.ALGOD_TOKEN ||
            "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
        indexerToken: globalOptions?.indexerToken || process.env.INDEXER_TOKEN || "",
    };
    if (globalOptions?.debug) {
        console.log("Network configuration:", config);
    }
    return config;
};
export const getCurrentClients = () => {
    const config = getCurrentNetworkConfig();
    const algodClient = new algosdk.Algodv2(config.token, config.server, config.port);
    const indexerClient = new algosdk.Indexer(config.indexerToken, config.indexerServer, config.indexerPort);
    return { algodClient, indexerClient };
};
function stripTrailingZeroBytes(str) {
    return str.replace(/\0+$/, "");
}
function padStringWithZeroBytes(input, length) {
    const paddingLength = length - input.length;
    return paddingLength > 0 ? input + "\0".repeat(paddingLength) : input;
}
export const fund = async (addr, amount) => {
    console.log("funding", addr, amount);
    const { algodClient } = getCurrentClients(); // <-- use current client
    const txn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
        from: addressses.deployer,
        to: addr,
        amount,
        suggestedParams: await algodClient.getTransactionParams().do(),
    });
    const signedTxn = algosdk.signTransaction(txn, sks.deployer);
    const res = await algodClient.sendRawTransaction(signedTxn.blob).do();
    await algosdk.waitForConfirmation(algodClient, res.txId, 4);
};
const signSendAndConfirm = async (txns, sk) => {
    const { algodClient } = getCurrentClients(); // <-- use current client
    const stxns = txns
        .map((t) => new Uint8Array(Buffer.from(t, "base64")))
        .map((t) => algosdk.decodeUnsignedTransaction(t))
        .map((t) => algosdk.signTransaction(t, sk));
    const res = await algodClient
        .sendRawTransaction(stxns.map((s) => s.blob))
        .do();
    if (globalThis.GLOBAL_DEBUG)
        console.log(res);
    return await Promise.all(stxns.map((s) => algosdk.waitForConfirmation(algodClient, s.txID, 4)));
};
export const getAccount = async () => {
    const acc = algosdk.generateAccount();
    return acc;
};
const makeContract = (appId, appSpec, acc) => {
    const { algodClient, indexerClient } = getCurrentClients(); // <-- use current clients
    return new CONTRACT(appId, algodClient, indexerClient, {
        name: "",
        desc: "",
        methods: appSpec.contract.methods,
        events: [],
    }, {
        addr: acc.addr,
        sk: acc.sk,
    });
};
export const deploy = async (options) => {
    if (options.debug) {
        console.log(options);
    }
    const addr = options.addr || addressses.deployer;
    const sk = options.sk || sks.deployer;
    const deployer = { addr, sk };
    let Client;
    switch (options.type) {
        case "MintableSBNFT":
            Client = MintableSbnftClient;
            break;
        default:
            throw new Error(`Unknown deploy type: ${options.type}`);
    }
    const { algodClient, indexerClient } = getCurrentClients(); // <-- use current clients
    const clientParams = {
        resolveBy: "creatorAndName",
        findExistingUsing: indexerClient, // <-- current indexer
        creatorAddress: deployer.addr,
        name: options.name || "",
        sender: deployer,
    };
    const appClient = Client ? new Client(clientParams, algodClient) : null;
    if (!appClient) {
        throw new Error("Failed to construct app client");
    }
    const app = await appClient.deploy({
        deployTimeParams: {},
        onUpdate: "update",
        onSchemaBreak: "fail",
    });
    return { appId: app.appId, appClient };
};
program
    .command("deploy")
    .requiredOption("-t, --type <string>", "Specify factory type")
    .requiredOption("-n, --name <string>", "Specify contract name")
    .option("--debug", "Debug the deployment", false)
    .description("Deploy a specific contract type")
    .action(async (options) => {
    try {
        const apid = await deploy(options);
        if (!apid) {
            console.log("Failed to deploy contract");
            return;
        }
        console.log(apid);
    }
    catch (e) {
        console.error(e);
        process.exit(1);
    }
});
export const mint = async (options) => {
    if (options.debug)
        console.log(options);
    const addr = options.addr || addressses.deployer;
    const sk = options.sk || sks.deployer;
    const acc = { addr, sk };
    const ci = makeContract(options.appId, MintableSbnftSpec, acc);
    const mintCost = (await ci.mint_cost()).returnValue;
    ci.setPaymentAmount(mintCost);
    const mintR = await ci.mint(options.account);
    if (options.debug)
        console.log({ mintR });
    if (mintR.success && !options.simulate) {
        await signSendAndConfirm(mintR.txns, sk);
    }
    return mintR;
};
program
    .command("mint")
    .requiredOption("-i, --appId <number>", "Specify appId")
    .requiredOption("-a, --account <string>", "Specify account to mint")
    .option("--debug", "Debug the deployment", false)
    .description("Mint a specific contract type")
    .action(async (options) => {
    const mintR = await mint({
        ...options,
        appId: Number(options.appId),
    });
    console.log(mintR);
});
export const approveMinter = async (options) => {
    if (options.debug)
        console.log(options);
    const addr = options.addr || addressses.deployer;
    const sk = options.sk || sks.deployer;
    const acc = { addr, sk };
    const ci = makeContract(options.appId, MintableSbnftSpec, acc);
    const approveMinterCost = (await ci.approve_minter_cost()).returnValue;
    ci.setPaymentAmount(approveMinterCost);
    const approveMinterR = await ci.approve_minter(options.account, options.approve ? 1 : 0);
    if (options.debug)
        console.log({ approveMinterR });
    if (approveMinterR.success && !options.simulate) {
        await signSendAndConfirm(approveMinterR.txns, sk);
    }
    return approveMinterR;
};
program
    .command("approve-minter")
    .requiredOption("-i, --appId <number>", "Specify appId")
    .requiredOption("-a, --account <string>", "Specify account to approve")
    .requiredOption("-p, --approve <boolean>", "Specify if to approve or revoke", true)
    .option("--debug", "Debug the deployment", false)
    .description("Approve a minter for a specific contract type")
    .action(async (options) => {
    const apid = await approveMinter({
        ...options,
        appId: Number(options.appId),
    });
    if (!apid) {
        console.log("Failed to approve minter");
        return;
    }
    console.log(apid);
});
export const burn = async (options) => {
    if (options.debug)
        console.log(options);
    const addr = options.addr || addressses.deployer;
    const sk = options.sk || sks.deployer;
    const acc = { addr, sk };
    const ci = makeContract(options.appId, MintableSbnftSpec, acc);
    const burnR = await ci.burn(options.account);
    if (options.debug)
        console.log({ burnR });
    if (burnR.success && !options.simulate) {
        await signSendAndConfirm(burnR.txns, sk);
    }
    return burnR;
};
program
    .command("burn")
    .requiredOption("-i, --appId <number>", "Specify appId")
    .requiredOption("-a, --account <string>", "Specify account to burn")
    .option("--debug", "Debug the deployment", false)
    .description("Burn a specific contract type")
    .action(async (options) => {
    const burnR = await burn({
        ...options,
        appId: Number(options.appId),
    });
    console.log(burnR);
});
export const arc72TransferFrom = async (options) => {
    if (options.debug)
        console.log(options);
    const addr = options.addr || addressses.deployer;
    const sk = options.sk || sks.deployer;
    const acc = { addr, sk };
    const ci = makeContract(options.appId, MintableSbnftSpec, acc);
    const arc72TransferFromR = await ci.arc72_transferFrom(options.from, options.to, options.tokenId);
    if (options.debug)
        console.log({ arc72TransferFromR });
    if (arc72TransferFromR.success && !options.simulate) {
        await signSendAndConfirm(arc72TransferFromR.txns, sk);
    }
    return arc72TransferFromR;
};
export const arc72OwnerOf = async (options) => {
    if (options.debug)
        console.log(options);
    const addr = options.addr || addressses.deployer;
    const sk = options.sk || sks.deployer;
    const acc = { addr, sk };
    const ci = makeContract(options.appId, MintableSbnftSpec, acc);
    const arc72OwnerOfR = await ci.arc72_ownerOf(options.tokenId);
    if (options.debug)
        console.log({ arc72OwnerOfR });
    return arc72OwnerOfR.returnValue;
};
export const setMetadataURI = async (options) => {
    if (options.debug)
        console.log(options);
    const addr = options.addr || addressses.deployer;
    const sk = options.sk || sks.deployer;
    const acc = { addr, sk };
    const ci = makeContract(options.appId, MintableSbnftSpec, acc);
    const setMetadataURICost = (await ci.set_metadata_uri_cost()).returnValue;
    ci.setPaymentAmount(setMetadataURICost);
    const r = await ci.set_metadata_uri(new Uint8Array(Buffer.from(padStringWithZeroBytes(options.metadataURI, 256))));
    if (options.debug)
        console.log({ r });
    if (r.success && !options.simulate) {
        await signSendAndConfirm(r.txns, sk);
    }
    return r;
};
program
    .command("set-metadata-uri")
    .requiredOption("-i, --appId <number>", "Specify appId")
    .requiredOption("-m, --metadataURI <string>", "Specify metadata URI")
    .option("--debug", "Debug the deployment", false)
    .description("Get the cost to set the metadata URI for a specific contract type")
    .action(async (options) => {
    const setMetadataURICostR = await setMetadataURI({
        ...options,
        appId: Number(options.appId),
    });
    console.log(setMetadataURICostR);
});
export const metadataURI = async (options) => {
    if (options.debug)
        console.log(options);
    const addr = options.addr || addressses.deployer;
    const sk = options.sk || sks.deployer;
    const acc = { addr, sk };
    const ci = makeContract(options.appId, MintableSbnftSpec, acc);
    const metadataURIR = await ci.metadata_uri();
    if (options.debug)
        console.log({ metadataURIR });
    return stripTrailingZeroBytes(metadataURIR.returnValue);
};
program
    .command("metadata-uri")
    .requiredOption("-i, --appId <number>", "Specify appId")
    .option("--debug", "Debug the deployment", false)
    .description("Get the metadata URI for a specific contract type")
    .action(async (options) => {
    const metadataURIR = await metadataURI({
        ...options,
        appId: Number(options.appId),
    });
    console.log(metadataURIR);
});
export const bootstrap = async (options) => {
    if (options.debug)
        console.log(options);
    const addr = options.addr || addressses.deployer;
    const sk = options.sk || sks.deployer;
    const acc = { addr, sk };
    const ci = makeContract(options.appId, MintableSbnftSpec, acc);
    const bootstrapCost = (await ci.bootstrap_cost()).returnValue;
    ci.setPaymentAmount(bootstrapCost);
    const bootstrapR = await ci.bootstrap();
    if (options.debug)
        console.log({ bootstrapR });
    if (bootstrapR.success && !options.simulate) {
        await signSendAndConfirm(bootstrapR.txns, sk);
    }
    return bootstrapR;
};
program
    .command("bootstrap")
    .requiredOption("-i, --appId <number>", "Specify appId")
    .option("--debug", "Debug the deployment", false)
    .description("Bootstrap a specific contract type")
    .action(async (options) => {
    const bootstrapR = await bootstrap({
        ...options,
        appId: Number(options.appId),
    });
    console.log(bootstrapR);
});
export const postUpdate = async (options) => {
    try {
        console.log("=== PostUpdate START ===");
        if (options.debug) {
            console.log("PostUpdateOptions:", options);
        }
        // Validate app ID
        const appId = Number(options.appId);
        if (isNaN(appId) || appId <= 0) {
            console.error("Invalid app ID:", options.appId);
            return false;
        }
        const addr = options?.addr || addressses.deployer;
        const sk = options?.sk || sks.deployer;
        const acc = { addr, sk };
        if (options.debug) {
            console.log("App ID:", appId);
            console.log("Address:", addr);
        }
        console.log("Creating contract instance...");
        const ci = makeContract(appId, MintableSbnftSpec, acc);
        console.log("Contract instance created successfully");
        ci.setFee(2000);
        console.log("Fee set to 2000");
        if (options.debug) {
            console.log("Calling post_update...");
        }
        console.log("About to call ci.post_update()...");
        const postUpdateR = await ci.post_update();
        console.log("post_update() call completed");
        if (options.debug) {
            console.log("post_update result:", postUpdateR);
        }
        if (postUpdateR.success) {
            console.log("post_update was successful");
            if (!options.simulate) {
                if (options.debug) {
                    console.log("Executing transaction (not simulating)...");
                }
                await signSendAndConfirm(postUpdateR.txns, sk);
                if (options.debug) {
                    console.log("Transaction confirmed");
                }
            }
            else {
                if (options.debug) {
                    console.log("Simulation mode - skipping transaction execution");
                }
            }
        }
        else {
            console.log("post_update failed:", postUpdateR);
        }
        console.log("=== arc200PostUpdate END ===");
        return postUpdateR.success;
    }
    catch (e) {
        console.error("Error in arc200PostUpdate:", e);
        console.error("Error stack:", e instanceof Error ? e.stack : "No stack trace");
        return false; // Return false on error
    }
};
program
    .command("post-update")
    .description("Post update the contract")
    .requiredOption("-a, --appId <number>", "Specify the application ID")
    .option("--simulate", "Simulate the post update", false)
    .option("--debug", "Debug the deployment", false)
    .option("--addr <string>", "Specify the address")
    .action(async (options) => {
    try {
        console.log("Starting post-update command...");
        const success = await postUpdate({
            ...options,
            appId: Number(options.appId),
            addr: options.addr,
            sk: sks.deployer,
            debug: options.debug,
            simulate: options.simulate,
        });
        if (!success) {
            console.log("Failed to post update");
        }
        else {
            console.log("Post update completed successfully");
        }
    }
    catch (error) {
        console.error("Error in post-update command:", error);
    }
});
program.command("whoami").action(async () => {
    console.log("whoami", addr);
});

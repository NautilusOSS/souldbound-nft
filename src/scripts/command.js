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
    .option("-h, --help", "Show help information");
// Hook to handle global options and configure network
program.hook("preAction", (thisCommand, actionCommand) => {
    const options = thisCommand.opts();
    // Set defaults for undefined options
    const network = options.network || "devnet";
    const debug = options.debug || false;
    const simulate = options.simulate || false;
    const dryRun = options.dryRun || false;
    console.log("Using network", network);
    // Update network configuration based on global options
    if (network === "testnet") {
        const ALGO_SERVER = "https://testnet-api.voi.nodely.dev";
        const ALGO_INDEXER_SERVER = "https://testnet-idx.voi.nodely.dev";
        const ALGO_PORT = 443;
        const ALGO_INDEXER_PORT = 443;
        // Update global variables if not overridden
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
        // Update global variables if not overridden
        if (!options.algodServer) {
            globalThis.ALGO_SERVER = ALGO_SERVER;
            globalThis.ALGO_PORT = ALGO_PORT;
        }
        if (!options.indexerServer) {
            globalThis.ALGO_INDEXER_SERVER = ALGO_INDEXER_SERVER;
            globalThis.ALGO_INDEXER_PORT = ALGO_INDEXER_PORT;
        }
    }
    // Set global debug and simulate flags
    globalThis.GLOBAL_DEBUG = debug;
    globalThis.GLOBAL_SIMULATE = simulate;
    globalThis.GLOBAL_DRY_RUN = dryRun;
    // Store the current options globally for client creation
    globalThis.CURRENT_NETWORK_OPTIONS = options;
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
// DEVNET
const ALGO_SERVER = "http://localhost";
const ALGO_PORT = 4001;
const ALGO_INDEXER_SERVER = "http://localhost";
const ALGO_INDEXER_PORT = 8980;
// TESTNET
// const ALGO_SERVER = "https://testnet-api.voi.nodely.dev";
// const ALGO_INDEXER_SERVER = "https://testnet-idx.voi.nodely.dev";
// MAINNET
// const ALGO_SERVER = "https://mainnet-api.voi.nodely.dev";
// const ALGO_INDEXER_SERVER = "https://mainnet-idx.voi.nodely.dev";
const algodServerURL = process.env.ALGOD_SERVER || ALGO_SERVER;
const algodServerPort = process.env.ALGOD_PORT || ALGO_PORT;
export const algodClient = new algosdk.Algodv2(process.env.ALGOD_TOKEN ||
    "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa", algodServerURL, algodServerPort);
const indexerServerURL = process.env.INDEXER_SERVER || ALGO_INDEXER_SERVER;
const indexerServerPort = process.env.INDEXER_PORT || ALGO_INDEXER_PORT;
export const indexerClient = new algosdk.Indexer(process.env.INDEXER_TOKEN || "", indexerServerURL, indexerServerPort);
// Function to get current network configuration
const getCurrentNetworkConfig = () => {
    const globalOptions = globalThis.CURRENT_NETWORK_OPTIONS;
    if (!globalOptions) {
        //console.log("No global options found, using default devnet configuration");
        return {
            server: ALGO_SERVER,
            port: ALGO_PORT,
            indexerServer: ALGO_INDEXER_SERVER,
            indexerPort: ALGO_INDEXER_PORT,
            token: process.env.ALGOD_TOKEN ||
                "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
            indexerToken: process.env.INDEXER_TOKEN || "",
        };
    }
    console.log("Global options found:", globalOptions);
    const config = {
        server: globalOptions.algodServer ||
            globalThis.ALGO_SERVER ||
            ALGO_SERVER,
        port: globalOptions.algodPort || globalThis.ALGO_PORT || ALGO_PORT,
        indexerServer: globalOptions.indexerServer ||
            globalThis.ALGO_INDEXER_SERVER ||
            ALGO_INDEXER_SERVER,
        indexerPort: globalOptions.indexerPort ||
            globalThis.ALGO_INDEXER_PORT ||
            ALGO_INDEXER_PORT,
        token: globalOptions.algodToken ||
            process.env.ALGOD_TOKEN ||
            "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
        indexerToken: globalOptions.indexerToken || process.env.INDEXER_TOKEN || "",
    };
    if (globalOptions.debug) {
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
    return str.replace(/\0+$/, ""); // Matches one or more '\0' at the end of the string and removes them
}
function padStringWithZeroBytes(input, length) {
    const paddingLength = length - input.length;
    if (paddingLength > 0) {
        const zeroBytes = "\0".repeat(paddingLength);
        return input + zeroBytes;
    }
    return input; // Return the original string if it's already long enough
}
export const fund = async (addr, amount) => {
    console.log("funding", addr, amount);
    const txn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
        from: addressses.deployer,
        to: addr,
        amount: amount,
        suggestedParams: await algodClient.getTransactionParams().do(),
    });
    const signedTxn = algosdk.signTransaction(txn, sks.deployer);
    const res = await algodClient.sendRawTransaction(signedTxn.blob).do();
    await algosdk.waitForConfirmation(algodClient, res.txId, 4);
};
const signSendAndConfirm = async (txns, sk) => {
    const { algodClient: currentAlgodClient } = getCurrentClients();
    const stxns = txns
        .map((t) => new Uint8Array(Buffer.from(t, "base64")))
        .map((t) => {
        const txn = algosdk.decodeUnsignedTransaction(t);
        return txn;
    })
        .map((t) => algosdk.signTransaction(t, sk));
    const res = await currentAlgodClient
        .sendRawTransaction(stxns.map((txn) => txn.blob))
        .do();
    console.log(res);
    return await Promise.all(stxns.map((res) => algosdk.waitForConfirmation(currentAlgodClient, res.txID, 4)));
};
export const getAccount = async () => {
    const acc = algosdk.generateAccount();
    return acc;
};
const makeContract = (appId, appSpec, acc) => {
    const { algodClient, indexerClient } = getCurrentClients();
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
    const deployer = {
        addr,
        sk,
    };
    let Client;
    switch (options.type) {
        case "MintableSBNFT": {
            Client = MintableSbnftClient;
            break;
        }
    }
    const clientParams = {
        resolveBy: "creatorAndName",
        findExistingUsing: indexerClient,
        creatorAddress: deployer.addr,
        name: options.name || "",
        sender: deployer,
    };
    const appClient = Client ? new Client(clientParams, algodClient) : null;
    if (appClient) {
        const app = await appClient.deploy({
            deployTimeParams: {},
            onUpdate: "update",
            onSchemaBreak: "fail",
        });
        return { appId: app.appId, appClient: appClient };
    }
};
program
    .command("deploy")
    .requiredOption("-t, --type <string>", "Specify factory type")
    .requiredOption("-n, --name <string>", "Specify contract name")
    .option("--debug", "Debug the deployment", false)
    .description("Deploy a specific contract type")
    .action(async (options) => {
    const apid = await deploy(options);
    if (!apid) {
        console.log("Failed to deploy contract");
        return;
    }
    console.log(apid);
});
export const mint = async (options) => {
    if (options.debug) {
        console.log(options);
    }
    const addr = options.addr || addressses.deployer;
    const sk = options.sk || sks.deployer;
    const acc = { addr, sk };
    const ci = makeContract(options.appId, MintableSbnftSpec, acc);
    const mintCost = (await ci.mint_cost()).returnValue;
    ci.setPaymentAmount(mintCost);
    const mintR = await ci.mint(options.account);
    if (options.debug) {
        console.log({ mintR });
    }
    if (mintR.success) {
        if (!options.simulate) {
            await signSendAndConfirm(mintR.txns, sk);
        }
    }
    return mintR;
};
export const approveMinter = async (options) => {
    if (options.debug) {
        console.log(options);
    }
    const addr = options.addr || addressses.deployer;
    const sk = options.sk || sks.deployer;
    const acc = { addr, sk };
    const ci = makeContract(options.appId, MintableSbnftSpec, acc);
    ci.setPaymentAmount(120900);
    const approveMinterR = await ci.approve_minter(options.account, options.approve ? 1 : 0);
    if (options.debug) {
        console.log({ approveMinterR });
    }
    if (approveMinterR.success) {
        if (!options.simulate) {
            await signSendAndConfirm(approveMinterR.txns, sk);
        }
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
    if (options.debug) {
        console.log(options);
    }
    const addr = options.addr || addressses.deployer;
    const sk = options.sk || sks.deployer;
    const acc = { addr, sk };
    const ci = makeContract(options.appId, MintableSbnftSpec, acc);
    const burnR = await ci.burn(options.account);
    if (options.debug) {
        console.log({ burnR });
    }
    if (burnR.success) {
        if (!options.simulate) {
            await signSendAndConfirm(burnR.txns, sk);
        }
    }
    return burnR;
};
export const arc72TransferFrom = async (options) => {
    if (options.debug) {
        console.log(options);
    }
    const addr = options.addr || addressses.deployer;
    const sk = options.sk || sks.deployer;
    const acc = { addr, sk };
    const ci = makeContract(options.appId, MintableSbnftSpec, acc);
    const arc72TransferFromR = await ci.arc72_transferFrom(options.from, options.to, options.tokenId);
    if (options.debug) {
        console.log({ arc72TransferFromR });
    }
    if (arc72TransferFromR.success) {
        if (!options.simulate) {
            await signSendAndConfirm(arc72TransferFromR.txns, sk);
        }
    }
    return arc72TransferFromR;
};
export const arc72OwnerOf = async (options) => {
    if (options.debug) {
        console.log(options);
    }
    const addr = options.addr || addressses.deployer;
    const sk = options.sk || sks.deployer;
    const acc = { addr, sk };
    const ci = makeContract(options.appId, MintableSbnftSpec, acc);
    const arc72OwnerOfR = await ci.arc72_ownerOf(options.tokenId);
    if (options.debug) {
        console.log({ arc72OwnerOfR });
    }
    return arc72OwnerOfR.returnValue;
};
export const setMetadataURI = async (options) => {
    if (options.debug) {
        console.log(options);
    }
    const addr = options.addr || addressses.deployer;
    const sk = options.sk || sks.deployer;
    const acc = { addr, sk };
    const ci = makeContract(options.appId, MintableSbnftSpec, acc);
    const setMetadataURICost = (await ci.set_metadata_uri_cost()).returnValue;
    ci.setPaymentAmount(setMetadataURICost);
    const setMetadataURIR = await ci.set_metadata_uri(new Uint8Array(Buffer.from(padStringWithZeroBytes(options.metadataURI, 256))));
    if (options.debug) {
        console.log({ setMetadataURIR });
    }
    if (setMetadataURIR.success) {
        if (!options.simulate) {
            await signSendAndConfirm(setMetadataURIR.txns, sk);
        }
    }
    return setMetadataURIR;
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
    if (options.debug) {
        console.log(options);
    }
    const addr = options.addr || addressses.deployer;
    const sk = options.sk || sks.deployer;
    const acc = { addr, sk };
    const ci = makeContract(options.appId, MintableSbnftSpec, acc);
    const metadataURI = await ci.metadata_uri();
    if (options.debug) {
        console.log({ metadataURI });
    }
    return stripTrailingZeroBytes(metadataURI.returnValue);
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

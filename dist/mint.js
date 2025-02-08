import { createNft, fetchDigitalAsset, mplTokenMetadata, } from "@metaplex-foundation/mpl-token-metadata";
import { airdropIfRequired, getExplorerLink, } from "@solana-developers/helpers";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { Connection, LAMPORTS_PER_SOL, clusterApiUrl, Keypair } from "@solana/web3.js";
import { generateSigner, keypairIdentity, percentAmount, } from "@metaplex-foundation/umi";
import fs from "fs";
// Path to store wallet file
const WALLET_PATH = "wallet.json";
// Function to load or create a wallet
function loadOrCreateWallet() {
    if (fs.existsSync(WALLET_PATH)) {
        console.log("🔹 Loading existing wallet...");
        const secret = JSON.parse(fs.readFileSync(WALLET_PATH, "utf8"));
        return Keypair.fromSecretKey(new Uint8Array(secret));
    }
    else {
        console.log("🔹 No wallet found. Generating a new one...");
        const newWallet = Keypair.generate();
        fs.writeFileSync(WALLET_PATH, JSON.stringify(Array.from(newWallet.secretKey)));
        console.log("✅ Wallet created and stored in 'wallet.json'");
        return newWallet;
    }
}
// Load existing wallet or create a new one
const user = loadOrCreateWallet();
console.log("🔑 Using wallet:", user.publicKey.toBase58());
// Create Solana connection
const connection = new Connection(clusterApiUrl("devnet"));
await airdropIfRequired(connection, user.publicKey, 1 * LAMPORTS_PER_SOL, 0.5 * LAMPORTS_PER_SOL);
const umi = createUmi(connection.rpcEndpoint);
umi.use(mplTokenMetadata());
// Convert Web3 keypair to UMI keypair
const umiUser = umi.eddsa.createKeypairFromSecretKey(user.secretKey);
umi.use(keypairIdentity(umiUser));
// Generate a new mint account for the NFT collection
const collectionMint = generateSigner(umi);
console.log("🎨 Minting new NFT collection with address:", collectionMint.publicKey);
// Create NFT transaction
const transaction = createNft(umi, {
    mint: collectionMint,
    name: "My Collection",
    symbol: "MC",
    uri: "https://gateway.pinata.cloud/ipfs/QmPs6YNwEnG6AcXcpAeqHtmYvovGKnxYvEY42T7ZFmQMkf",
    sellerFeeBasisPoints: percentAmount(0),
    isCollection: true,
});
// Send transaction
await transaction.sendAndConfirm(umi);
console.log("✅ NFT collection created!");
// Fetch NFT details
const createdCollectionNft = await fetchDigitalAsset(umi, collectionMint.publicKey);
console.log(`📦 Collection Address: ${getExplorerLink("address", createdCollectionNft.mint.publicKey, "devnet")}`);
//# sourceMappingURL=mint.js.map
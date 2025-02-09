import Fastify, { FastifyReply, FastifyRequest }from 'fastify'
import { Keypair } from "@solana/web3.js";
import crypto from "crypto";
import fs from "fs";
import path from "path";

const server = Fastify({logger: true})

interface walletAddress {
    address: string;
}

const __dirname = "/home/alastor/Intermediatery Layer/block_server/"

server.get('/ping', async (request: any, reply: any) => {
  return 'pong\n'
})

// 🔐 Encrypt private key before storing
function encryptPrivateKey(secretKey: Uint8Array): string {
    const algorithm = "aes-256-cbc";
    const key = crypto.scryptSync(process.env.ENCRYPTION_SECRET || "default_key", "salt", 32);
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    const encrypted = Buffer.concat([cipher.update(secretKey.toString()), cipher.final()]);
    return iv.toString("hex") + ":" + encrypted.toString("hex");
}

// 🔓 Decrypt private key when needed
function decryptPrivateKey(encryptedData: string): Uint8Array {
    const algorithm = "aes-256-cbc";
    const key = crypto.scryptSync(process.env.ENCRYPTION_SECRET || "default_key", "salt", 32);
    const [ivHex, encryptedText] = encryptedData.split(":");
    const iv = Buffer.from(ivHex, "hex");
    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    const decrypted = Buffer.concat([decipher.update(Buffer.from(encryptedText, "hex")), decipher.final()]);
    return new Uint8Array(decrypted.toString().split(",").map(Number));
}

//Wallet creation route
server.get("/wallet/create", async (request, reply) => {
    try {
        const keypair = Keypair.generate();
        const walletAddress = keypair.publicKey.toBase58();
        const encryptedPrivateKey = encryptPrivateKey(keypair.secretKey);
        console.log(walletAddress);

        // Save encrypted key securely (e.g., database, file storage)
        const filePath = path.join(__dirname, "wallets", `${walletAddress}.json`);
        fs.writeFileSync(filePath, JSON.stringify({ publicKey: walletAddress, privateKey: encryptedPrivateKey }));

        return reply.send({ walletAddress });
    } catch (error) {
        console.log(error)
        return reply.status(500).send({ error: error });
    }
});

//To get wallet address
server.get("/wallet/get/:address", async (request: FastifyRequest<{Params : walletAddress}>, reply: FastifyReply) => {    
    try {
        const { address } = request.params;
        const filePath = path.join(__dirname, "wallets", `${address}.json`);
        if (!fs.existsSync(filePath)) return reply.status(404).send({ error: "Wallet not found" });

        const walletData = JSON.parse(fs.readFileSync(filePath, "utf8"));
        return reply.send({ publicKey: walletData.publicKey, encryptedPrivateKey: walletData.privateKey });
    } catch (error) {
        return reply.status(500).send({ error: "Failed to retrieve wallet" });
    }
});













server.listen({ port: 8080 }, (err: any, address: any) => {
  if (err) {
    console.error(err)
    process.exit(1)
  }
  console.log(`Server listening at ${address}`)
})
const crypto = require("crypto");
const fs = require("fs");

const algorithm = "aes-256-cbc";
const key = crypto.randomBytes(32); // Save securely (not in repo!)
const iv = crypto.randomBytes(16);

const jsonData = fs.readFileSync("./snatchichat-firebase-adminsdk-1vpcs-d06f6114f0.json", "utf8");

const cipher = crypto.createCipheriv(algorithm, key, iv);
let encrypted = cipher.update(jsonData, "utf8", "base64");
encrypted += cipher.final("base64");

// Save encrypted file
fs.writeFileSync("./serviceAccount.json.enc", encrypted);

console.log("✅ Encrypted file written: serviceAccount.json.enc");
console.log("🔑 KEY:", key.toString("base64"));
console.log("🔑 IV:", iv.toString("base64"));
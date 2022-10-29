const { generateKeyPairSync } = require("node:crypto");

const generateKeys = () => {
  let { publicKey, privateKey } = generateKeyPairSync("rsa", {
    modulusLength: 4096,
    publicKeyEncoding: {
      type: "spki",
      format: "der",
    },
    privateKeyEncoding: {
      type: "pkcs8",
      format: "der",
      cipher: "aes-256-cbc",
      passphrase: "top secret",
    },
  });
  publicKey = publicKey.toString('hex');
  privateKey = privateKey.toString('hex');
  return { publicKey, privateKey };
};

module.exports = generateKeys;

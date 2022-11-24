const fs = require('fs');

const generateKeys = () => {
  const publicKey = fs.readFileSync('./keys/public.key', 'utf8');
  const privateKey = fs.readFileSync('./keys/private.key', 'utf8');
  return { publicKey, privateKey };
};

module.exports = generateKeys;

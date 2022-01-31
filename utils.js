const SHA256 = require('crypto-js/sha256');
const EC = require('elliptic').ec;
const ec = new EC('secp256k1');

function generateKeyPair() {
  const key = ec.genKeyPair();

  return {
    privateKey: key.getPrivate().toString(16),
    publicKey: key.getPublic().encode('hex'),
  };
}

function getHash(input) {
  return SHA256(input).toString();
}

module.exports = { generateKeyPair, getHash };

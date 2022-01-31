const fetch = require('node-fetch');
const Block = require('./Block');
const Transaction = require('./Transaction');
const { getHash } = require('../utils');

const TARGET_DIFFICULTY = BigInt('0x0000' + 'F'.repeat(60));
const currentNodeUrl = process.argv[3];

class Blockchain {
  constructor() {
    this.blocks = [];
    this.mempool = [];
    this.mining = false;

    this.currentNodeUrl = currentNodeUrl;
    this.nodes = [];

    this.addBlock(new Block());
  }

  blockHeight() {
    return this.blocks.length;
  }

  lastBlock() {
    return this.blocks[this.blockHeight() - 1];
  }

  targetDifficulty() {
    return TARGET_DIFFICULTY;
  }

  addBlock(block) {
    this.blocks.push(block);
  }

  addTransactionToMempool(tx) {
    this.mempool.push(tx);
  }

  emptyMempool() {
    const mempoolTxs = [...this.mempool];
    this.mempool = [];

    return mempoolTxs;
  }

  mine(publicKey) {
    this.mining = true;

    setInterval(() => {
      let block = new Block();
      const previousBlockHash = this.lastBlock().hash;
      const coinbaseTX = new Transaction('0x0', publicKey, 10);
      const mempoolTxs = this.emptyMempool();

      block.previousBlockHash = previousBlockHash;
      block.addTransaction(coinbaseTX);
      mempoolTxs.forEach(tx => block.addTransaction(tx));

      while (
        BigInt('0x' + getHash(block.previousBlockHash + '' + block.nonce + JSON.stringify(block.transactions))) >=
        this.targetDifficulty()
      ) {
        block.nonce++;
      }

      block.hash = getHash(block.previousBlockHash + '' + block.nonce + JSON.stringify(block.transactions));
      block = block.toJSON();
      this.addBlock(block);

      console.log(`${currentNodeUrl} mined block with a hash of ${block.hash} and nonce ${block.nonce}`);

      const blockBroadcastPromises = this.nodes.map(nodeUri =>
        fetch(`${nodeUri}/receive-new-block`, {
          method: 'POST',
          body: JSON.stringify({ block }),
          headers: { 'Content-Type': 'application/json' },
        }),
      );

      Promise.all(blockBroadcastPromises);
    }, 5000);
  }
}

module.exports = Blockchain;

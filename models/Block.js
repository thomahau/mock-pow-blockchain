class Block {
  constructor() {
    this.timestamp = Date.now();
    this.nonce = 0;
    this.hash = '0x0';
    this.previousBlockHash = '0x0';
    this.transactions = [];
  }

  addTransaction(tx) {
    this.transactions.push(tx);
  }

  toJSON() {
    return {
      timestamp: this.timestamp,
      nonce: this.nonce,
      hash: this.hash,
      previousBlockHash: this.previousBlockHash,
      transactions: this.transactions,
    };
  }
}

module.exports = Block;

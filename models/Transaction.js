const { getHash } = require('../utils');

class Transaction {
  constructor(sender, recipient, amount) {
    this.sender = sender;
    this.recipient = recipient;
    this.amount = amount;
    this.hash = getHash(this.sender + this.recipient + this.amount.toString());
  }
}

module.exports = Transaction;

const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const Blockchain = require('./models/Blockchain');
const Transaction = require('./models/Transaction');
const { generateKeyPair } = require('./utils');

const app = express();
app.use(cors());
app.use(express.json());

const { publicKey, privateKey } = generateKeyPair();
const blockchain = new Blockchain();
const port = process.argv[2];
const currentNodeUrl = process.argv[3];

app.get('/blockchain', (req, res) => {
  res.send(blockchain);
});

app.get('/mine', (req, res) => {
  // Mining coinbase rewards will be sent to node's public key
  blockchain.mine(publicKey);
  res.send('Now mining');
});

app.post('/register-and-broadcast-node', (req, res) => {
  const newNodeUrl = req.body.newNodeUrl;
  if (!blockchain.nodes.includes(newNodeUrl)) {
    blockchain.nodes.push(newNodeUrl);
  }

  const nodeRegistrationPromises = blockchain.nodes.map(nodeUri =>
    fetch(`${nodeUri}/register-node`, {
      method: 'POST',
      body: JSON.stringify({ newNodeUrl }),
      headers: { 'Content-Type': 'application/json' },
    }),
  );

  Promise.all(nodeRegistrationPromises)
    .then(() => {
      fetch(`${newNodeUrl}/register-nodes-bulk`, {
        method: 'POST',
        body: JSON.stringify({ allNodes: [...blockchain.nodes, blockchain.currentNodeUrl] }),
        headers: { 'Content-Type': 'application/json' },
      });
    })
    .then(() => {
      res.json({ message: 'New node registered and broadcasted to blockchain network' });
    });
});

app.post('/register-node', (req, res) => {
  const { newNodeUrl } = req.body;
  const nodeNotAlreadyPresent = !blockchain.nodes.includes(newNodeUrl);
  const notCurrentNode = blockchain.currentNodeUrl !== newNodeUrl;

  if (nodeNotAlreadyPresent && notCurrentNode) {
    blockchain.nodes.push(newNodeUrl);
  }

  res.json({ message: 'New node registered' });
});

app.post('/register-nodes-bulk', (req, res) => {
  const { allNodes } = req.body;

  allNodes.forEach(nodeUri => {
    const nodeNotAlreadyPresent = !blockchain.nodes.includes(nodeUri);
    const notCurrentNode = blockchain.currentNodeUrl !== nodeUri;

    if (nodeNotAlreadyPresent && notCurrentNode) {
      blockchain.nodes.push(nodeUri);
    }
  });

  res.json({ message: 'Nodes registered with blockchain network' });
});

app.post('/receive-new-block', (req, res) => {
  const { block: newBlock } = req.body;
  const lastBlock = blockchain.lastBlock();
  const correctHash = lastBlock.hash === newBlock.previousBlockHash;

  if (correctHash) {
    blockchain.addBlock(newBlock);
    blockchain.mempool = [];
    res.json({
      message: 'New block received and accepted',
      newBlock: newBlock,
    });
  } else {
    res.json({
      message: 'New block rejected',
      newBlock: newBlock,
    });
  }
});

app.post('/transaction/broadcast', (req, res) => {
  const { recipient, amount } = req.body;
  const tx = new Transaction(publicKey, recipient, amount);

  blockchain.addTransactionToMempool(tx);

  const transactionBroadcastRequestPromises = blockchain.nodes.map(nodeUri =>
    fetch(`${nodeUri}/transaction`, {
      method: 'POST',
      body: JSON.stringify(tx),
      headers: { 'Content-Type': 'application/json' },
    }),
  );

  Promise.all(transactionBroadcastRequestPromises).then(data => {
    res.json({ message: 'Transaction created and broadcasted successfully' });
  });
});

app.post('/transaction', (req, res) => {
  const newTx = req.body;
  blockchain.addTransactionToMempool(newTx);
  const blockIndex = blockchain.blockHeight() + 1;

  res.json({ message: `Transaction will be added in block ${blockIndex}` });
});

app.listen(port, () => {
  const allNodeUrls = ['http://localhost:3001', 'http://localhost:3002', 'http://localhost:3003'];
  const otherNodeUrls = allNodeUrls.filter(nodeUrl => nodeUrl !== currentNodeUrl);

  const registerNodePromises = otherNodeUrls.map(nodeUrl =>
    fetch(`${nodeUrl}/register-and-broadcast-node`, {
      method: 'POST',
      body: JSON.stringify({ newNodeUrl: currentNodeUrl }),
      headers: { 'Content-Type': 'application/json' },
    }),
  );

  Promise.all(registerNodePromises).then(() => {
    console.log(`Blockchain node running and listening on port ${port}. It has the public key ${publicKey}`);
  });
});

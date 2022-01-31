# Mock PoW Blockchain

This repository features a mock implementation of a Proof of Work blockchain network. Due to time constraints, the project has not had all intended features added and kinks worked out.

### Functionality

`npm start` spins up three blockchain nodes on ports 3001, 3002, and 3003, then connects them to each other in a network. The currently valid blockchain in each node can be found at `http://localhost:{PORT}/blockchain`.

By going to `http://localhost:{PORT}/mine` a user can start mining in one of the nodes. The node will mine new blocks and broadcast them to the other nodes in the network. The other nodes will receive the new blocks and either accept them into their own blockchain or reject them.

There is also a transaction endpoint at `http://localhost:{PORT}/transaction/broadcast` where a user can send a POST request to submit a transaction to the blockchain mempool. This endpoint requires a request body in the form `{"recipient": string, "amount": number}`.

### TODO

- Save blockchain state to local file system
- Setup a frontend with some kind of visualization or blockchain explorer as well as a form for users to submit transactions
- Adjust mining difficulty based on time taken to find a block
- Work out bugs in blockchain consensus process

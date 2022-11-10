const rpcPromise = (rpcData) => {
  return new Promise((resolve, reject) => {
    const data = { id: new Date().getTime(), jsonrpc: "2.0" };
    web3.currentProvider.send({ ...data, ...rpcData }, (err, result) => {
      if (err) return reject(err);
      return resolve(result.result);
    });
  });
};

const makeNetworkSnapshot = () => rpcPromise({ method: "evm_snapshot" });

const revertNetworkFromSnapshot = (id) =>
  rpcPromise({ method: "evm_revert", params: [id] });

const mineBlock = () => rpcPromise({ method: "evm_mine" });

const advanceTimeTo = async (timestampInSecs) => {
  if (!timestampInSecs) return;
  const msg = `Jump to future request: ${timestampInSecs}\n\t${new Date(
    timestampInSecs * 1000
  )}`;

  const setTimeResult = await rpcPromise({
    method: "evm_setTime",
    params: [timestampInSecs * 1000], // yea milliseconds
  });

  //Hack: mine a new block to work around ganache issue where evm_estimateGas
  //does not use the new blocktime set by evm_setTime. This makes it difficult
  //to test reverting transactions after a jump to the future because the
  //estimateGas call will fail and not submit the transaction.
  //https://github.com/trufflesuite/ganache/issues/3528
  return mineBlock();
};

const getLatestBlockTimestamp = async () => {
  const block = await rpcPromise({
    method: "eth_getBlockByNumber",
    params: ["latest", false],
  });
  const ts = block.timestamp;
  const timestamp = parseInt(ts, 16);
  return timestamp;
};

module.exports = {
  advanceTimeTo,
  getLatestBlockTimestamp,
  makeNetworkSnapshot,
  mineBlock,
  revertNetworkFromSnapshot,
};

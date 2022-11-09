const Auction = artifacts.require("Auction");
const truffleAssert = require("truffle-assertions");
const {
  getLatestBlockTimestamp,
  advanceTimeTo,
} = require("../ganache-helpers.js");

contract("Auction", (accounts) => {
  // PRE-START

  it("should not allow a bid until the auction has started", async () => {
    const auctionInstance = await Auction.deployed();

    await truffleAssert.reverts(
      auctionInstance.bid({ value: 101 }),
      "not started"
    );
  });

  // POST-START

  it("should not allow the auction to end early", async () => {
    const auctionInstance = await Auction.deployed();

    // Start an auction
    await auctionInstance.start();

    await truffleAssert.reverts(auctionInstance.end(), "end time in future");
  });

  it("should have an opening bid of 100 wei", async () => {
    const auctionInstance = await Auction.deployed();

    const highestBid = (await auctionInstance.highestBid.call()).toNumber();

    assert.equal(highestBid, 100, "opening bid is not equal to 100 wei");
  });

  it("should not accept a bid lower than or equal to the current bid", async () => {
    const auctionInstance = await Auction.deployed();

    await truffleAssert.reverts(
      // Using accounts[9] as a stand-in for an NFT address
      auctionInstance.methods['bid(address)'](accounts[9], { value: 100 }),
      "value < highest"
    );
  });

  it("should not accept a bid if the user has not provided an NFT address", async () => {
    const auctionInstance = await Auction.deployed();

    await truffleAssert.reverts(
      auctionInstance.bid({ value: 101 }),
      "include nft to display"
    );
  });

  it("should not accept a bid if the user has provided an empty NFT address", async () => {
    const auctionInstance = await Auction.deployed();

    await truffleAssert.reverts(
      auctionInstance.methods['bid(address)']('0x0000000000000000000000000000000000000000', { value: 101 }),
      "invalid nft address"
    );
  });

  // HAPPY PATH

  it("should accept a bid higher than the current bid with an NFT address", async () => {
    const auctionInstance = await Auction.deployed();

    // Using accounts[9] as a stand-in for an NFT address
    await auctionInstance.methods['bid(address)'](accounts[9], { value: 101 });
    const highestBId = (await auctionInstance.highestBid.call()).toNumber();

    assert.equal(highestBId, 101, "opening bid is not equal to 100 wei");
  });

  it("should allow the auction to end after 1 day", async () => {
    const auctionInstance = await Auction.deployed();

    // Gets the timestamp for 1 day from the current block in seconds
    const timestamp = await getLatestBlockTimestamp();
    const nextDay = timestamp + 86400;

    await advanceTimeTo(nextDay);

    const tx = await auctionInstance.end();

    truffleAssert.eventEmitted(tx, "End");
  });
});

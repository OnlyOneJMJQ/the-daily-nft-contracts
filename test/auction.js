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

    const highestBId = (await auctionInstance.highestBid.call()).toNumber();

    assert.equal(highestBId, 100, "opening bid is not equal to 100 wei");
  });

  it("should not accept a bid lower than or equal to the current bid", async () => {
    const auctionInstance = await Auction.deployed();

    await truffleAssert.reverts(
      auctionInstance.bid({ value: 100 }),
      "value < highest"
    );
  });

  // HAPPY PATH

  it("should accept a bid higher than the current bid", async () => {
    const auctionInstance = await Auction.deployed();

    await auctionInstance.bid({ value: 101 });
    const highestBId = (await auctionInstance.highestBid.call()).toNumber();

    assert.equal(highestBId, 101, "opening bid is not equal to 100 wei");
  });

  it("should allow the auction to end after 1 day", async () => {
    const auctionInstance = await Auction.deployed();

    const timestamp = await getLatestBlockTimestamp();

    // Gets the timestamp for 1 day from the current block in seconds
    const nextDay = timestamp + 86400;
    await advanceTimeTo(nextDay);

    const tx = await auctionInstance.end();

    truffleAssert.eventEmitted(tx, "End");
  });
});

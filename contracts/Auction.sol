// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

contract Auction {
    event Start();
    event Bid(address indexed sender, uint amount);
    event Withdraw(address indexed bidder, uint amount);
    event End(address winner, uint amount);

    address payable public seller;
    uint public endAt;
    bool public started;
    bool public ended;

    address public highestBidder;
    uint public highestBid; // Wei
    mapping(address => uint) public bids;
    mapping(address => address) public nfts;
    mapping(address => uint256) public nftIds;

    constructor(
        uint _startingBid
    ) {
        seller = payable(msg.sender);
        highestBid = _startingBid;
    }

    function start() external {
        require(!started, "started");
        require(msg.sender == seller, "not seller");

        started = true;
        endAt = block.timestamp + 1 days;

        emit Start();
    }

    function bid() external payable {
        require(started, "not started");
        require(block.timestamp < endAt, "ended");
        require(msg.value > highestBid, "value < highest");
        require(nfts[msg.sender] != address(0), "include nft to display");

        if (highestBidder != address(0)) {
            bids[highestBidder] += highestBid;
        }

        highestBidder = msg.sender;
        highestBid = msg.value;

        emit Bid(msg.sender, msg.value);
    }

    // Overload if the user submits an NFT
    function bid(address nft, uint256 nftId) external payable {
        require(started, "not started");
        require(block.timestamp < endAt, "ended");
        require(msg.value > highestBid, "value < highest");

        if (highestBidder != address(0)) {
            bids[highestBidder] += highestBid;
        }

        if (nfts[msg.sender] == address(0)) {
            require(nft != address(0), "invalid nft address");
            nfts[msg.sender] = nft;
            nftIds[msg.sender] = nftId;
        }

        highestBidder = msg.sender;
        highestBid = msg.value;

        emit Bid(msg.sender, msg.value);
    }

    function withdraw() external {
        uint bal = bids[msg.sender];
        bids[msg.sender] = 0;
        payable(msg.sender).transfer(bal);

        emit Withdraw(msg.sender, bal);
    }

    function end() external {
        require(started, "not started");
        require(block.timestamp >= endAt, "end time in future");
        require(!ended, "ended");

        ended = true;

        emit End(highestBidder, highestBid);
    }
}
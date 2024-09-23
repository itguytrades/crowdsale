//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "./Token.sol";

contract Crowdsale {
    address owner;
    Token public token;
    uint256 public price;
    uint256 public maxTokens;
    uint256 public tokenSold;

    mapping(address => bool) public whitelist; 

    uint256 public startTime;
    uint256 public endTime;


    uint256 public minPurchase;
    uint256 public maxPurchase;

    event Buy(uint256 amount, address buyer);
    event Finalize(uint256 tokensSold, uint256 ethRaised);

    constructor(
        Token _token,
        uint256 _price,
        uint256 _maxTokens,
        uint256 _startTime, 
        uint256 _endTime, 
        uint256 _minPurchase, 
        uint256 _maxPurchase
    ) {
        owner = msg.sender;
        token = _token;
        price = _price;
        maxTokens = _maxTokens;
        startTime = _startTime;
        endTime = _endTime;
        minPurchase = _minPurchase;
        maxPurchase = _maxPurchase;

    }

    modifier isWhitelisted() {
        require(whitelist[msg.sender], "Investor not Whitelisted");
        _;
    }

    modifier crowdsaleStatus() {
        require(block.timestamp >= startTime && block.timestamp <= endTime, "Crowdsale not active");
        _;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Caller is not the owner");
        _;
    }

/*    modifier validPurchaseAmount () {

        require(_amount >= minPurchase, "Purchase amount is below minimum limit");
        require(_amount <= maxPurchase, "Purchase amount exceeds maximum limit");
        _;
}*/

    receive() external payable {
        uint256 amount = msg.value / price;
        buyTokens(amount * 1e18);
    }

    function addToWhitelist(address _investorAddress, bool _status) public onlyOwner {
        whitelist[_investorAddress] = _status;
    }

    function buyTokens(uint256 _amount) 
        public
        payable
        isWhitelisted
        crowdsaleStatus {

            require(_amount >= minPurchase, "Insufficient Purchased");
            require(_amount <= maxPurchase, "Exceeded max Purchase Limit");         
            require(msg.value == (_amount / 1e18) * price);
            require(token.balanceOf(address(this)) >= _amount);
            require(token.transfer(msg.sender, _amount));
            tokenSold += _amount;

        emit Buy(_amount, msg.sender);
    }

    function setPrice(uint256 _price) public onlyOwner {
        price = _price;
    }

       // Finalize Sale
    function finalize() public onlyOwner{
        require(token.transfer(owner, token.balanceOf(address(this))));

        uint256 value = address(this).balance;
        (bool sent, ) = owner.call{value: value}("");
        require(sent);

        emit Finalize(tokenSold, value);
    }
}

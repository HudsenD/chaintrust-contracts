// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import "./TrustFundToken.sol";
import "./interfaces/IERC6551Registry.sol";
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";


// Uncomment this line to use console.log
// import "hardhat/console.sol";

// this contract will create Trusts based on specified terms

// will this contract own the trust/nft? yes I think so


contract TrustOperator is Ownable {
    IERC20 usdcToken;
    TrustFundToken public trustFund;
    IERC6551Registry registry;
    address implementation;
    uint256 saltCounter;
    uint256 public constant chainId = 1;
    uint256 createFee; // initially set to $20 in constructor or 20000000

    struct TrustTerms {
        address creator;
        address beneficiary;
        address trustFundAccount;
        uint256 releaseTime;
        address priceFeed;
        uint256 releasePrice;
    }
        // tokenId => trust terms
    mapping (uint256 => TrustTerms) TokenToTerms;
        // allcaps like BTC/USD or ETH/USD -> address
    mapping (string => address) public PairToPriceFeed;

    event TimeTrustMinted(uint tokenId, address indexed creator, address indexed beneficiary, uint indexed releaseTime, address trustAccount);
    event PriceTrustMinted(uint tokenId, address indexed creator, address indexed beneficiary, uint releasePrice, address trustAccount);
    event TrustReleased(uint indexed tokenId, address indexed creator, address indexed beneficiary);
    constructor(address _registry, address _implementation, address _usdcToken, uint256 _createFee) {
        trustFund = new TrustFundToken();
        registry = IERC6551Registry(_registry);
        implementation = _implementation;
        usdcToken = IERC20(_usdcToken);
        createFee = _createFee;
    }


    function createTimeTrustFund(address beneficiary, uint256 releaseTime) external {
        require(beneficiary != address(0) && beneficiary != address(this), "Invalid beneficiary");
        payCreateFee();
        // mint erc721
        // we mint to this contract since it will hold the token until terms are met
        uint256 tokenId = trustFund.mintNewTrust(address(this));
        // additional logic to set conditions
        TrustTerms storage tokenToTerms = TokenToTerms[tokenId];
        tokenToTerms.beneficiary = beneficiary;
        tokenToTerms.creator = msg.sender;
        tokenToTerms.releaseTime = releaseTime;

        // register it for an account
        // chainid of trustfundtoken
       
        address erc6551Account = createERC6551(tokenId);

        tokenToTerms.trustFundAccount = erc6551Account;
        
        emit TimeTrustMinted(tokenId, msg.sender, beneficiary, releaseTime, erc6551Account);
    }

    function createPriceTrustFund(address beneficiary, string memory assetPair, uint256 releasePrice)  external {
        require(beneficiary != address(0) && beneficiary != address(this), "Invalid beneficiary");
        address priceFeed = PairToPriceFeed[assetPair];
        require(priceFeed != address(0), "Unsupported Asset Pair");
        payCreateFee();

        uint256 tokenId = trustFund.mintNewTrust(address(this));
        TrustTerms storage tokenToTerms = TokenToTerms[tokenId];
        tokenToTerms.beneficiary = beneficiary;
        tokenToTerms.creator = msg.sender;
        tokenToTerms.priceFeed = priceFeed;
        tokenToTerms.releasePrice = releasePrice;

        address erc6551Account = createERC6551(tokenId);
        tokenToTerms.trustFundAccount = erc6551Account;
        emit PriceTrustMinted(tokenId, msg.sender, beneficiary, releasePrice, erc6551Account);
    }

    function createERC6551(uint256 tokenId) internal returns(address) {
        saltCounter++;
        address erc6551Account = registry.createAccount(implementation,
        chainId,
        address(trustFund),
        tokenId,
        saltCounter,
        "");
        return erc6551Account;
    }

    function payCreateFee() internal {
        usdcToken.transferFrom(msg.sender, address(this), createFee);
    }

    function setCreateFee(uint256 newCreateFee) external onlyOwner {
        createFee = newCreateFee;
    }

    // function setNewBenficiary() external {}

    function releaseTrustFund(uint256 _tokenId) public {
        // check token id exists
        require(trustFund.tokenId() >= _tokenId, "TokenId doesn't exist"); 
        TrustTerms memory tokenToTerms = TokenToTerms[_tokenId];
        if(tokenToTerms.releaseTime == 0) {
             (
            /* uint80 roundID */,
            int256 price,
            /*uint startedAt*/,
            /*uint timeStamp*/,
            /*uint80 answeredInRound*/
            ) = AggregatorV3Interface(tokenToTerms.priceFeed).latestRoundData();
            require(price >= int(tokenToTerms.releasePrice), "Current price is below release price");
        
        } else {
            require(block.timestamp >= tokenToTerms.releaseTime, "Release time has not been reached");
        }
        // check if conditions have been met

        trustFund.transferFrom(address(this), tokenToTerms.beneficiary, _tokenId);
        emit TrustReleased(_tokenId, tokenToTerms.creator, tokenToTerms.beneficiary);
    }
    function addPriceFeed(string memory _asset, address _priceFeed) external onlyOwner {
        PairToPriceFeed[_asset] = _priceFeed;
    }

    function getPriceFeed(string memory _asset) public view returns (address) {
        return PairToPriceFeed[_asset];
    }   

    function getTrustTerms(uint256 tokenId) external view returns(TrustTerms memory) {
        return TokenToTerms[tokenId];
    }

    function getTrustAddress(uint256 tokenId) external view returns(address) {
        return TokenToTerms[tokenId].trustFundAccount;
    }

    function withdrawFees() external onlyOwner {
        uint256 balance = usdcToken.balanceOf(address(this));
        require(usdcToken.transfer(owner(), balance), "Transfer failed");
    }

}

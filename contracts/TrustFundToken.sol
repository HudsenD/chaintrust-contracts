// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.13;


import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract TrustFundToken is ERC721, Ownable {
    uint256 public tokenId;
    
    constructor() ERC721("TrustFundToken", "TFT"){
    }

    function mintNewTrust(address _to) external onlyOwner returns(uint256){
        tokenId++;
        _mint(_to, tokenId);
        return tokenId;
    }

    
}
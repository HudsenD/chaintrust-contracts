// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity 0.8.13;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract Usdc is ERC20 {
    constructor() ERC20("Usdc token", "USDC"){
        
    }

    function mint(uint256 amount) external{
        _mint(msg.sender, amount);
    }
}
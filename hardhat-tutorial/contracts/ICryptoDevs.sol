// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface ICryptoDevs {
    // @dev returns a token ID ownded by the owner at a given index of its token list 
    // Use along with balanceOf to enumerate all of the owner's tokens 

    function tokenOfOwnderByIndex(address owner, uint256 index)
        external 
        view 
        returns (uint256 tokenId);


    // dev returns the number of tokens in the owners account 
    function balanceOf(address owner)
        external 
        view 
        returns (uint256 balance);
}
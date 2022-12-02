// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

    import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
    import "@openzeppelin/contracts/access/Ownable.sol";
    import "./ICryptoDevs.sol";

    contract CryptoDevToken is ERC20, Ownable {
        //Price of one CD token 
        uint256 public constant tokenPrice = 0.001 ether;
        
        // Each NFT would give the user 10 tojens 
        // This is represented by 10 * (10**18) as ERC20 tokens are represented by the smallest demonination possible for the token 
        // ERC20 tokens have the smallest denomination of 10^(-18) which means having a balance of 1 
        // This is actually equal to 10 ^ -18 tokens 
        // Owning 1 full oken is equivalent ot owning 10^18 tokens when you account for decimals 
        uint256 public constant tokensPerNFT = 10 * 10**18;
        
        //max total suply is 10000 for Crypto Dev Tokens 
        uint public constant maxTotalSupply = 10000 * 10**18;

        //CryptoDevsNFT contract instance 
        ICryptoDevs CryptoDevsNFT; 

        //Mapping to keep track of which tokenIds have been claimed
        mapping(uint256 => bool) public tokenIdsClaimed; 

        constructor(address _cryptoDevsContract) ERC20("Crypto Devs", "CD") {
            CryptoDevsNFT = ICryptoDevs(_cryptoDevsContract);
        }
      /**
       * @dev Mints `amount` number of CryptoDevTokens
       * Requirements:
       * - `msg.value` should be equal or greater than the tokenPrice * amount
       */
       function mint(uint256 amount) public payable {
           //the value of ether that should be equal or greater than tokenPrice * amount 
           uint256 _requiredAmount = tokenPrice * amount;
           require(msg.value >= _requiredAmount, "Ether sent is incorrect");

           //total token + amount must be less than or equal to 10000, otherwise kill the transcation 
           uint256 amountWithDecimals = amount * 10**18;
           require(
               (totalSupply() + amountWithDecimals) <= maxTotalSupply, "Exceeds the max total supply available"
           );
           // call the internal function from OpenZepplin's ERC20 contract 
           _mint(msg.sender, amountWithDecimals); 
       }
      /**
       * @dev Mints tokens based on the number of NFT's held by the sender
       * Requirements:
       * balance of Crypto Dev NFT's owned by the sender should be greater than 0
       * Tokens should have not been claimed for all the NFTs owned by the sender
       */
       function claim() public {
           address sender = msg.sender;

           //Get the number of cryptodev NFTs held by a given sender address
           uint256 balance = CryptoDevsNFT.balanceOf(sender);

           //If the balance is zero, revert the transaction 
           require(balance > 0, "You don't own any crypto dev nfts");

           //amount keeps track of number of unclaimed tokenIds
           uint256 amount = 0;

           //loop over the balance and get the token ID ownder by sender at a given idex of its token list 
           for (uint256 i = 0; i < balance; i++){
               uint256 tokenId = CryptoDevsNFT.tokenOfOwnerByIndex(sender, i); 
               // if the tokenId has not been claimed, increase the amount 
               if (!tokenIdsClaimed[tokenId]) {
                   amount += 1; 
                   tokenIdsClaimed[tokenId] = true;
               }
           }

           //If all the token Ids have been claimed, revert the transaction 
           require(amount > 0, "You have already claimed all the tokens");

           //call the internal function from Openzepplin's ERC20 contract to Mint (amount *10) tokens for each NFT
           _mint(msg.sender, amount*tokensPerNFT);
       }
       /**
        * @dev withdraws all ETH and tokens sent to the contract
        * Requirements:
        * wallet connected must be owner's address
        */
        function withdraw() public onlyOwner {
            address _owner = owner();
            uint256 amount = address(this).balance;
            (bool sent, ) = _owner.call{value: amount}("");
            require(sent, "failed to send Ether");
        }

        // Function to receive Ether so msg.data must be empty 
        receive() external payable {}

        // Fallback function is called when msg.data is not empty 
        fallback() external payable {}
    }
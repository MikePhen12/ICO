import { BigNumber, Contract, providers, utils } from "ethers";
import Head from "next/head";
import React, { useEffect, useRef, useState } from "react";
import Web3Modal from "web3modal";
import {
  NFT_CONTRACT_ABI,
  NFT_CONTRACT_ADDRESS,
  TOKEN_CONTRACT_ABI,
  TOKEN_CONTRACT_ADDRESS,
} from "../constants/"
import styles from "../styles/Home.module.css";

export default function Home() {
// Create a big number zero 
const zero = BigNumber.from(0);

//Wallet connected keeps track of whether the user's wallet is connected or not
const [walletConnected, setWalletConnected] = useState(false);

//Loading is set to true when we are writing for a transaction to get mined
const [loading, setLoading] = useState(false);

//tokensToBeClaimed keeps track of the number of tokens that can be claimed
// based on the Crypto devs NFT held by the user for which thye havent claimed the tokens 
const [tokensToBeClaimed, setTokensToBeClaimed] = useState(zero);

// Keep track of the number of crypto dev tokens owned by an address
const [balanceOfCryptoDevTokens, setBalanceOfCryptoDevTokens] = useState(zero);

//Amount of the tokens the user wants to mint 
const [tokenAmount, setTokenAmount] = useState(zero);

//tokensMinted is the total number of tokens that have been minted till now out of 10000 max
const [tokensMinted, setTokensMinted] = useState(zero);

//isOwner gets the owner of the contract through the signed address
const [isOwner, setIsOwner] = useState(false);

// Create a reference to the web3 modal which persists as long as the page is open 
const web3ModalRef = useRef();

// getTokensToBeClaimed: Checks the balance of tokens that can be claimed by the user 
const getTokensToBeClaimed = async() => {
  try {
    // Get the provider from web3modal which is metamask 
    // No need from the signer here as we are only reading state from the blockchain 
    const provider = await getProviderOrSigner();

    //Create an instance of NFT Contract 
    const nftContract = new Contract(NFT_CONTRACT_ADDRESS, NFT_CONTRACT_ABI, provider);

    // Create an instance of tokenContract 
    const tokenContract = new Contract(TOKEN_CONTRACT_ADDRESS, TOKEN_CONTRACT_ABI, provider);
    
    // Get the signer to extract the address of the currently connected MetaMask account
    const signer = await getProviderOrSigner(true);

    // Get the address associated to the signer which is connected to MetaMask 
    const address = await signer.getAddress();

    // Call the blanceOf from the NFT contract to get the number of NFTs held by the user 
    const balance = await nftContract.balanceOf(address);

    // Check the Big Number balance and thus we would compare it with Big Number 'zero' 
    if (balance === zero) {
      setTokensToBeClaimed(zero);
    } else {
      // amount to keep track of number of unclaimed tokens 
      var amount = 0; 

      // Check if the tokens have already been claimed and only increase if the tokens have not been claimed 
      for (var i = 0; i < balance; i++){
        const tokenId = await nftContract.tokenOfOwnerByIndex(address, i);
        const claimed = await tokenContract.tokenIdsClaimed(tokenId);
        if (!claimed) {
          amount++; 
        }
      }

      //tokensToBeClaimed has been initialized to a Big Number, thus we would convert amount ot a big number
      // then set its value 
      setTokensToBeClaimed(BigNumber.from(amount));
    }
  
  } catch (err) {
    console.error(err);
    setTokensToBeClaimed(zero);
  }
}; 

const getBalanceOfCryptoDevTokens = async () => {
  try {
    // Get the provider from teh web3modal which is meta  mask 
    // Only reading state from blockchain, so no need to read state from block chain 
    const provider = await getProviderOrSigner();
    
    //create an instance of token contract 
    const tokenContract = new Contract(
      TOKEN_CONTRACT_ADDRESS,
      TOKEN_CONTRACT_ABI,
      provider
    );

    //Get the address of the currently connected metamask account 
    const signer = await getProviderOrSigner(true);
    
    //Get the address associated to the signer which is connected to MetaMask 
    const address = await signer.getAddress();

    //Call the balanceOf from the token contract to get the number of tokens held by the user
    const balance = await tokenContract.balanceOf(address);

    // Balanace is a big number, so we dont need to convert it before setting it
    setBalanceOfCryptoDevTokens(balance);

  } catch (err) {
    console.error(err);
    setBalanceOfCryptoDevTokens(zero);
  }
};

// mintCryptoDevToken: mints amount number of tokens to a given address
const mintCryptoDevToken = async (amount) => {
  try {
    //we need a signer here since this is a write transaction 
    // create an instance of tokenContract
    const signer = await getProviderOrSigner(true);
    
    // Create an instance of tokenContract 
    const tokenContract = new Contract(
      TOKEN_CONTRACT_ADDRESS,
      TOKEN_CONTRACT_ABI,
      signer
    );


    // Each token is set to .001 eth, the value we need is .001 * amount 
    const value = 0.001 * amount;
    const tx = await tokenContract.mint(amount, {
      // value signifies the cost of one crypto dev token which is 0.001 eth 
      // parsing 0.001 string to ether usting the utils library from ethers.js 
      value: utils.parseEther(value.toString()),
    });
    setLoading(true);
    // Wait for tx to get mined 
    await tx.wait();
    setLoading(false);
    window.alert("Successfully minted crypto dev tokens");
    await getBalanceOfCryptoDevTokens();
    await getTotalTokensMinted();
    await getTokensToBeClaimed();
  } catch (err) {
    console.error(err);   
  }
};

  /**
   * claimCryptoDevTokens: Helps the user claim Crypto Dev Tokens
   */
   const claimCryptoDevTokens = async () => {
    try {
      // We need a Signer here since this is a 'write' transaction.
      // Create an instance of tokenContract
      const signer = await getProviderOrSigner(true);
      // Create an instance of tokenContract
      const tokenContract = new Contract(
        TOKEN_CONTRACT_ADDRESS,
        TOKEN_CONTRACT_ABI,
        signer
      );
      const tx = await tokenContract.claim();
      setLoading(true);
      // wait for the transaction to get mined
      await tx.wait();
      setLoading(false);
      window.alert("Sucessfully claimed Crypto Dev Tokens");
      await getBalanceOfCryptoDevTokens();
      await getTotalTokensMinted();
      await getTokensToBeClaimed();
    } catch (err) {
      console.error(err);
    }
  };

//getTotalTokensMinted: retrieves how many tokens have been minted till now out of the total supply 

  async function getTotalTokensMinted() {
    try {
      // Get the provider from web3modal which is metamask 
      // No need for the signer here as we are only reading the state from the block chain 
      const provider = await getProviderOrSigner();

      // Create an instance of the token contract
      const tokenContract = new Contract(
        TOKEN_CONTRACT_ADDRESS,
        TOKEN_CONTRACT_ABI,
        provider
      );


      //Get all tokens that have been minted 
      const _tokensMinted = await tokenContract.totalSupply();
      setTokensMinted(_tokensMinted);
    } catch (err) {
      console.error(err);
    }
  } 

// getOwner: get the contract owner by connected address

const getOwner = async () => {
  try {
    const provider = await getProviderOrSigner();
    const tokenContract = new Contract(
      TOKEN_CONTRACT_ADDRESS,
      TOKEN_CONTRACT_ABI,
      provider
    );


    //call the ownder function from the contract 
    const _owner = await tokenContract.owner();
    
    //Get the signer to extract address of currently connected metamask account 
    const signer = await getProviderOrSigner(true);

    //get address associated to signer which is connected to metamask 
    const address = await signer.getAddress();
    if (address.toLowerCase() === _owner.toLowerCase()) {
      setIsOwner(true);
    }
  } catch (err) {
    console.error(err);
  }
}; 


//withdrawCoins: withdraws ether by calling the withdra function in the contract 
const withdrawCoins = async () => {
  try {
    const signer = await getProviderOrSigner(true);
    //create an instance of token contract 
    const tokenContract = new Contract(
      TOKEN_CONTRACT_ADDRESS,
      TOKEN_CONTRACT_ABI,
      signer
    );

    const tx = await tokenContract.withdraw();
    setLoading(true);
    await tx.wait();
    setLoading(false);
    await getOwner();
  } catch (err){
    console.error(err);
    window.alert(err.reason);

  }
};

 /**
   * Returns a Provider or Signer object representing the Ethereum RPC with or without the
   * signing capabilities of metamask attached
   *
   * A `Provider` is needed to interact with the blockchain - reading transactions, reading balances, reading state, etc.
   *
   * A `Signer` is a special type of Provider used in case a `write` transaction needs to be made to the blockchain, which involves the connected account
   * needing to make a digital signature to authorize the transaction being sent. Metamask exposes a Signer API to allow your website to
   * request signatures from the user using Signer functions.
   *
   * @param {*} needSigner - True if you need the signer, default false otherwise
   */

 const getProviderOrSigner = async (needSigner=false) => {
  // Connect to Metamask 
  // since we store the web3moadl as a reference we need to access the current value to get access to the underlying object 

  const provider = await web3ModalRef.current.connect();
  const web3Provider = new providers.Web3Provider(provider);

  // If user is not connected to the goerli network, let them know and throw an error
  const { chainId } = await web3Provider.getNetwork();
  if (chainId !== 5) {
    window.alert("Change network to Goerli");
    throw new Error("Change network to Goerli");
  }

  if (needSigner) {
    const signer = web3Provider.getSigner()
    return signer;
  }
  return web3Provider;
 }; 

 // connectWallet: connects the metamask wallet 
 const connectWallet = async () => {
  try {
    // Get the provider from web3Modal, which is metamask 
    // When used for the first time it prompts the user to connect their wallet 
    await getProviderOrSigner();
    setWalletConnected(true);

  } catch (err) {
    console.error(err);
  }
 }; 

   // useEffects are used to react to changes in state of the website
  // The array at the end of function call represents what state changes will trigger this effect
  // In this case, whenever the value of `walletConnected` changes - this effect will be called
  useEffect(() => {
    // if wallet is not connected, create a new instance of Web3Modal and connect the MetaMask wallet
    if (!walletConnected) {
      // Assign the Web3Modal class to the reference object by setting it's `current` value
      // The `current` value is persisted throughout as long as this page is open
      web3ModalRef.current = new Web3Modal({
        network: "goerli",
        providerOptions: {},
        disableInjectedProvider: false,
      });
      connectWallet();
      getTotalTokensMinted();
      getBalanceOfCryptoDevTokens();
      getTokensToBeClaimed();
      getOwner();
    }
  }, [walletConnected]);

  /*
        renderButton: Returns a button based on the state of the dapp
      */
  const renderButton = () => {
    // If we are currently waiting for something, return a loading button
    if (loading) {
      return (
        <div>
          <button className={styles.button}>Loading...</button>
        </div>
      );
    }
    // If tokens to be claimed are greater than 0, Return a claim button
    if (tokensToBeClaimed > 0) {
      return (
        <div>
          <div className={styles.description}>
            {tokensToBeClaimed * 10} Tokens can be claimed!
          </div>
          <button className={styles.button} onClick={claimCryptoDevTokens}>
            Claim Tokens
          </button>
        </div>
      );
    }
    // If user doesn't have any tokens to claim, show the mint button
    return (
      <div style={{ display: "flex-col" }}>
        <div>
          <input
            type="number"
            placeholder="Amount of Tokens"
            // BigNumber.from converts the `e.target.value` to a BigNumber
            onChange={(e) => setTokenAmount(BigNumber.from(e.target.value))}
            className={styles.input}
          />
        </div>

        <button
          className={styles.button}
          disabled={!(tokenAmount > 0)}
          onClick={() => mintCryptoDevToken(tokenAmount)}
        >
          Mint Tokens
        </button>
      </div>
    );
  };

  return (
    <div>
      <Head>
        <title>Crypto Devs</title>
        <meta name="description" content="ICO-Dapp" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className={styles.main}>
        <div>
          <h1 className={styles.title}>Welcome to Crypto Devs ICO!</h1>
          <div className={styles.description}>
            You can claim or mint Crypto Dev tokens here
          </div>
          {walletConnected ? (
            <div>
              <div className={styles.description}>
                {/* Format Ether helps us in converting a BigNumber to string */}
                You have minted {utils.formatEther(balanceOfCryptoDevTokens)} Crypto
                Dev Tokens
              </div>
              <div className={styles.description}>
                {/* Format Ether helps us in converting a BigNumber to string */}
                Overall {utils.formatEther(tokensMinted)}/10000 have been minted!!!
              </div>
              {renderButton()}
              {/* Display additional withdraw button if connected wallet is owner */}
                {isOwner ? (
                  <div>
                  {loading ? <button className={styles.button}>Loading...</button>
                           : <button className={styles.button} onClick={withdrawCoins}>
                               Withdraw Coins
                             </button>
                  }
                  </div>
                  ) : ("")
                }
            </div>
          ) : (
            <button onClick={connectWallet} className={styles.button}>
              Connect your wallet
            </button>
          )}
        </div>
        <div>
          <img className={styles.image} src="./0.svg" />
        </div>
      </div>

      <footer className={styles.footer}>
        Made with &#10084; by Crypto Devs
      </footer>
    </div>
  );
}
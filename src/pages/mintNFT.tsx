import { UserButton, useUser } from "@clerk/nextjs";
import React, { useState } from 'react';
import Web3 from 'web3';
import { LazyLoadImage } from 'react-lazy-load-image-component';
import 'react-lazy-load-image-component/src/effects/blur.css';

import Link from 'next/link';
import GlobeComponent from "../components/animation/GlobeComponent";
import { useTranslation } from 'next-i18next';

export default function MintPage() {
  const { t } = useTranslation('common'); 
  
  const [message, setMessage] = useState("")
  const [txHash, setTxHash] = useState("");
  const { user } = useUser();
  const primaryWeb3Wallet = user?.primaryWeb3Wallet;

  const [web3, setWeb3] = useState(null);
  const [account, setAccount] = useState('');
  const contractAddress = '0x18404aF27F12b6375c184C2855fE098fdd4AC2eb';
  const contractABI = [{"inputs":[{"internalType":"string","name":"_name","type":"string"},{"internalType":"string","name":"_symbol","type":"string"},{"internalType":"string","name":"_initBaseURI","type":"string"},{"internalType":"string","name":"_initNotRevealedUri","type":"string"}],"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"owner","type":"address"},{"indexed":true,"internalType":"address","name":"approved","type":"address"},{"indexed":true,"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"Approval","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"owner","type":"address"},{"indexed":true,"internalType":"address","name":"operator","type":"address"},{"indexed":false,"internalType":"bool","name":"approved","type":"bool"}],"name":"ApprovalForAll","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"previousOwner","type":"address"},{"indexed":true,"internalType":"address","name":"newOwner","type":"address"}],"name":"OwnershipTransferred","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"from","type":"address"},{"indexed":true,"internalType":"address","name":"to","type":"address"},{"indexed":true,"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"Transfer","type":"event"},{"inputs":[{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"approve","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"owner","type":"address"}],"name":"balanceOf","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"baseExtension","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"cost","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"getApproved","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"owner","type":"address"},{"internalType":"address","name":"operator","type":"address"}],"name":"isApprovedForAll","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"maxMintAmount","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"maxSupply","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"_mintAmount","type":"uint256"}],"name":"mint","outputs":[],"stateMutability":"payable","type":"function"},{"inputs":[],"name":"name","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"notRevealedUri","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"owner","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"ownerOf","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"bool","name":"_state","type":"bool"}],"name":"pause","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"paused","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"renounceOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"reveal","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"revealed","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"from","type":"address"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"safeTransferFrom","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"from","type":"address"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"tokenId","type":"uint256"},{"internalType":"bytes","name":"_data","type":"bytes"}],"name":"safeTransferFrom","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"operator","type":"address"},{"internalType":"bool","name":"approved","type":"bool"}],"name":"setApprovalForAll","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"string","name":"_newBaseExtension","type":"string"}],"name":"setBaseExtension","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"string","name":"_newBaseURI","type":"string"}],"name":"setBaseURI","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"_newCost","type":"uint256"}],"name":"setCost","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"string","name":"_notRevealedURI","type":"string"}],"name":"setNotRevealedURI","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"_newmaxMintAmount","type":"uint256"}],"name":"setmaxMintAmount","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes4","name":"interfaceId","type":"bytes4"}],"name":"supportsInterface","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"symbol","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"index","type":"uint256"}],"name":"tokenByIndex","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"owner","type":"address"},{"internalType":"uint256","name":"index","type":"uint256"}],"name":"tokenOfOwnerByIndex","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"tokenURI","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"totalSupply","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"from","type":"address"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"transferFrom","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"newOwner","type":"address"}],"name":"transferOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"_owner","type":"address"}],"name":"walletOfOwner","outputs":[{"internalType":"uint256[]","name":"","type":"uint256[]"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"withdraw","outputs":[],"stateMutability":"payable","type":"function"}];
  
  const connectWallet = async () => {
    if ((window as any).ethereum) {

      const web3 = new Web3((window as any).ethereum);
      
      try {

        const networkId = await web3.eth.net.getId();
        const polygonNetworkId = 137;
  
        if (networkId !== polygonNetworkId) {
          try {
            await (window as any).ethereum.request({
              method: 'wallet_switchEthereumChain',
              params: [{ chainId: web3.utils.toHex(polygonNetworkId) }],
            });
          } catch (switchError) {
            if (switchError.code === 4001) {
              console.log('the client refused to switch to the Polygon network'); 
            }
            console.error(switchError);
          }
        }
        // await window.ethereum.enable();
        // const accounts = await web3.eth.getAccounts();
        const accountsAll = await web3.eth.requestAccounts() 
        // const accounts = await (window as any).ethereum.request({ method: 'eth_requestAccounts' });

        setWeb3(web3);
        // setAccount(accounts[0]);
        setAccount(accountsAll[0]);
      } catch (error) {
        setMessage(t('nft-metamask-alert')+ error.message)
        console.error(error);
      }
    } else {
      setMessage(t('nft-metamask-setup-alert')) 
      console.error('Please install MetaMask!');
    }
  };

  const handleMint = async () => {
    if (!web3) return;
    const contract = new web3.eth.Contract(contractABI, contractAddress);
  
    try {
      const mintAmount = 1;
      // const transaction = await contract.methods.mint(mintAmount).send({ 
      //   from: account, 
      //   value: web3.utils.toWei("0.05", "ether") * mintAmount
      // });

      const valueInWei = web3.utils.toWei("0.05", "ether");
      const totalValue = web3.utils.toBN(valueInWei).mul(web3.utils.toBN(mintAmount));
      const totalValueHex = web3.utils.toHex(totalValue);

      const gasPrice = await web3.eth.getGasPrice();
      const priorityFee = web3.utils.toWei('300', 'gwei');
      const maxFeePerGas = web3.utils.toHex(parseInt(gasPrice) + parseInt(priorityFee));
  
      const transaction = await contract.methods.mint(mintAmount).send({ 
        from: account,
        value: totalValueHex,
        maxPriorityFeePerGas: priorityFee,
        maxFeePerGas: maxFeePerGas
      });
      setMessage(t('nft-transaction-success'));
      setTxHash(transaction.transactionHash);
      console.log('Mint success:', transaction);
    } catch (error) {
      setMessage(t('nft-transaction-failed')+ error.message)
      console.error('Mint failed:', error);
    }
  };

  return (

  <div className="relative flex items-center justify-center min-h-screen bg-gray-800 p-4">
   <GlobeComponent disableHover={true} />
    <div className="absolute top-60 left-51% flex-col justify-center items-center z-10">
    <h1 className="text-3xl font-bold mb-4 text-center shadow-xl p-5 bg-gray-800 text-orange-500 opacity-95 rounded-full px-10">
      {t('nft-mint-page-title')}
    </h1>
    <div className="flex-col flex justify-center items-center">
      <h3 className="mb-4 text-black bg-orange-400 py-2 px-3 rounded-3xl opacity-90 "> {t('nft-title')}</h3>
      <a title="series" className="hover:black" href="https://www.okx.com/hk/web3/marketplace/nft/collection/polygon/hiddengemnft" target="_blank" rel="noopener noreferrer">
        <div className="text-center opacity-90">
          <LazyLoadImage effect="blur"className="mb-10 rounded-3xl" 
          src="/images/marker-nft.png" alt="nft-photo" width={200} height={200} />
        </div>
      </a>
    </div>
    <div className="text-center mb-2 mt-2">
    <UserButton />
    </div>
    <div className="flex flex-col">
    {account ? (
      <div className="flex-col">
          <p className="mb-4 bg-gray-400 rounded-md p-3 text-white"> {t('nft-connect-account')} <span className="text-baseline font-semibold">{account}</span></p>
          <button 
            onClick={handleMint} 
            className="bg-orange-500 text-white font-bold py-2 px-4 mt-2 rounded hover:bg-blue-600"
          >
            {t('mint-nft')} NFT
          </button>
        </div>
      ) : (
        <div className="flex-col flex justify-center align-middle items-center">
          <button 
              onClick={connectWallet} 
              className="bg-orange-500  text-white font-bold py-2 px-4 rounded hover:bg-green-600"
            >
              {t('nft-connect-request')} 
            </button>

          {/* <button onClick={() => handleWalletSelection('blocto')}
          className="bg-blue-500  text-white font-bold py-2 px-4 rounded hover:bg-green-600"
          >使用 Blocto 錢包</button>
          <button onClick={() => handleWalletSelection('metamask')}
          className="bg-orange-500  text-white font-bold py-2 px-4 rounded hover:bg-green-600"
          >使用 MetaMask 錢包</button> */}
        </div>
      )}
      <div className="flex flex-col">
        <span className="mt-3 text-white bg-gray-400 p-3 rounded-md">
          {message}
        </span>
      </div>
      </div>
      {txHash && (
        <>
          <div className="bg-blue-500 text-white font-bold py-2 px-4 rounded hover:bg-blue-600 my-2">
            <Link href={`https://polygonscan.com/tx/${txHash}`} target="_blank" rel="noopener noreferrer">
              {t('nft-transaction-details')}
            </Link>
          </div>
            <button
            onClick={() => window.open("https://polygonscan.com/address/0x18404af27f12b6375c184c2855fe098fdd4ac2eb", "_blank")}
            className="bg-blue-500 text-white font-bold py-2 px-4 rounded hover:bg-blue-600 my-2"
          >
            {t('nft-transaction-contract')}
          </button>
    
          <button
            onClick={() => window.open("https://www.okx.com/hk/web3", "_blank")}
            className="bg-green-500 text-white font-bold py-2 px-4 rounded hover:bg-green-600 my-2"
          >
             {t('nft-okx-wallet')}
          </button>
         </>
      )}
      </div>
  </div>
  );
}
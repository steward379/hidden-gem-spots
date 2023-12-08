import { SignIn, SignOutButton, UserButton, useUser } from "@clerk/nextjs";
import React, { useState } from 'react';
import Web3 from 'web3';
import Image from 'next/image';
import { LazyLoadImage } from 'react-lazy-load-image-component';
import 'react-lazy-load-image-component/src/effects/blur.css';

import Link from 'next/link';
import GlobeComponent from "../components/animation/GlobeComponent";
import RainbowButtonModule from '@/src/styles/RainbowButton.module.css';

export default function MintPage() {
  const [message, setMessage] = useState("")
  const [txHash, setTxHash] = useState("");
  ;
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
        // await window.ethereum.enable();
        // const accounts = await web3.eth.getAccounts();
        const accounts = await (window as any).ethereum.request({ method: 'eth_requestAccounts' });
        setWeb3(web3);
        setAccount(accounts[0]);
      } catch (error) {
        setMessage("請授權 MetaMask 錢包連接" + error)
        console.error(error);
      }
    } else {
      setMessage("請安裝狐狸 MetaMask 錢包")
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

      // 設置優先費，至少為 30 Gwei
      const priorityFee = web3.utils.toWei('300', 'gwei');

      const maxFeePerGas = web3.utils.toHex(parseInt(gasPrice) + parseInt(priorityFee));
  
      const transaction = await contract.methods.mint(mintAmount).send({ 
        from: account,
        value: totalValueHex,
        maxPriorityFeePerGas: priorityFee,
        maxFeePerGas: maxFeePerGas
      });

      setMessage("交易成功！ 請去 OKX Web3 Wallet 查看 NFT")
      setTxHash(transaction.transactionHash);
      console.log('Mint 成功:', transaction);
    } catch (error) {
      // 錯誤處理
      setMessage("交易失敗, 錯誤"+ error.message)
      console.error('Mint 失敗:', error);
    }
  };

  return (

  <div className="relative flex items-center justify-center min-h-screen bg-gray-100 p-4">
   <GlobeComponent disableHover={true} />


    
    <div className="absolute top-60 left-51% flex-col justify-center items-center z-10">
    <h1 className="text-2xl font-bold mb-4">NFT Mint 頁面 on Polygon</h1>
    <div className="flex-col justify-center align-center">
      <h3 className="mb-2 text-center">圖標們的聚會 </h3>
      <a title="series" className="hover:black" href="https://www.okx.com/hk/web3/marketplace/nft/collection/polygon/hiddengemnft" target="_blank" rel="noopener noreferrer">
        <div>
          <LazyLoadImage effect="blur"className="mb-10 rounded-3xl" 
          src="/images/marker-nft.png" alt="nft-photo" width={200} height={200} />
        </div>
      </a>
    </div>
    <UserButton />
    {account ? (
      <>
        <p className="text-gray-700 mb-4">已連接帳號: <span className="font-semibold">{account}</span></p>
        <button 
          onClick={handleMint} 
          className="bg-blue-500 text-white font-bold py-2 px-4 rounded hover:bg-blue-600"
        >
          Mint NFT

          Address:{" "}
          {primaryWeb3Wallet ? primaryWeb3Wallet.web3Wallet : ""}
        </button>
      </>
    ) : (
      <button 
        onClick={connectWallet} 
        className="bg-green-500 text-white font-bold py-2 px-4 rounded hover:bg-green-600"
      >
        連接 MetaMask 錢包
      </button>
    )}
          <span>{message}</span>
      {txHash && (
        <>
          <div className="bg-blue-500 text-white font-bold py-2 px-4 rounded hover:bg-blue-600 my-2">
            <Link href={`https://polygonscan.com/tx/${txHash}`} target="_blank" rel="noopener noreferrer">
              查看交易詳情
            </Link>
          </div>
            <button
            onClick={() => window.open("https://polygonscan.com/address/0x18404af27f12b6375c184c2855fe098fdd4ac2eb", "_blank")}
            className="bg-blue-500 text-white font-bold py-2 px-4 rounded hover:bg-blue-600 my-2"
          >
            查看合約
          </button>
    
          {/* 顯示 OKX Web3 錢包查看按鈕 */}
          <button
            onClick={() => window.open("https://www.okx.com/hk/web3", "_blank")}
            className="bg-green-500 text-white font-bold py-2 px-4 rounded hover:bg-green-600 my-2"
          >
            OKX Web3 錢包查看
          </button>
         </>
      )}
      </div>
  </div>
  );
}
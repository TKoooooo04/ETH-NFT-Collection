// App.js
// useEffect と useState 関数を React.js からインポートしています。
import React, { useEffect, useState } from "react";
import "./styles/App.css";
import twitterLogo from "./assets/twitter-logo.svg";
import { ethers } from "ethers";
import myEpicNft from "./utils/MyEpicNFT.json"
// Constantsを宣言する: constとは値書き換えを禁止した変数を宣言する方法です。
const TWITTER_HANDLE = "あなたのTwitterのハンドルネームを貼り付けてください";
const TWITTER_LINK = `https://twitter.com/${TWITTER_HANDLE}`;
// コトントラクトアドレスをCONTRACT_ADDRESS変数に格納
const CONTRACT_ADDRESS = "0x92cE5E5Cb5623C8d348Be62cdD0e576Ede7010E2";

const App = () => {
  /*
   * ユーザーのウォレットアドレスを格納するために使用する状態変数を定義します。
   */
  const [currentAccount, setCurrentAccount] = useState("");
  /*この段階でcurrentAccountの中身は空*/
  console.log("currentAccount: ", currentAccount);

  const [totalSupply, setTotalSupply] = useState(null);
  const [cap, setCap] = useState(null);
  /*
   * ユーザーが認証可能なウォレットアドレスを持っているか確認します。
   */
  const checkIfWalletIsConnected = async () => {
    const { ethereum } = window;
    if (!ethereum) {
      console.log("Make sure you have MetaMask!");
      return;
    } else {
      console.log("We have the ethereum object", ethereum);
    }

    let chainId = await ethereum.request({ method: "eth_chainId" });
    console.log("Connected to chain " + chainId);
    // 0xaa36a7(11155111) は　Sepolia の ID です。
    const sepoliaChainId = "0xaa36a7";
    if (chainId !== sepoliaChainId) {
      alert("You are not connected to the Sepolia Test Network!");
    }
    /* ユーザーが認証可能なウォレットアドレスを持っている場合は、
     * ユーザーに対してウォレットへのアクセス許可を求める。
     * 許可されれば、ユーザーの最初のウォレットアドレスを
     * accounts に格納する。
     */
    const accounts = await ethereum.request({ method: "eth_accounts" });

    if (accounts.length !== 0) {
      const account = accounts[0];
      console.log("Found an authorized account:", account);
      setCurrentAccount(account);
      // この時点で、ユーザーはウォレット接続が済んでいます。
      console.log("call setupEventListener from checkIfWalletIsConnected");
      setupEventListener();
    } else {
      console.log("No authorized account found");
    }
  };

  /*
   * connectWallet メソッドを実装します。
   */
  const connectWallet = async () => {
    try {
      const { ethereum } = window;
      if (!ethereum) {
        alert("Get MetaMask!");
        return;
      }
      /*
       * ウォレットアドレスに対してアクセスをリクエストしています。
       */
      const accounts = await ethereum.request({
        method: "eth_requestAccounts",
      });
      console.log("Connected", accounts[0]);
      /*
       * ウォレットアドレスを currentAccount に紐付けます。
       */
      setCurrentAccount(accounts[0]);
      // **** イベントリスナーをここで設定 ****
      console.log("call setupEventListener from connectWallet");
      setupEventListener();
    } catch (error) {
      console.log(error);
    }
  };

  // setupEventListener 関数を定義します。
  // MyEpicNFT.sol の中で event が　emit された時に、
  // 情報を受け取ります。
  const setupEventListener = async () => {
    try {
      const { ethereum } = window;
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        // NFT が発行されます。
        const connectedContract = new ethers.Contract(
          CONTRACT_ADDRESS,
          myEpicNft.abi,
          signer
        );
        // Event が　emit される際に、コントラクトから送信される情報を受け取っています。
        connectedContract.on("NewEpicNFTMinted", (from, tokenId) => {
          console.log(from, tokenId.toNumber());
          alert(
            `あなたのウォレットに NFT を送信しました。gemcase に表示されるまで数分かかることがあります。NFT へのリンクはこちらです: https://gemcase.vercel.app/view/evm/sepolia/${CONTRACT_ADDRESS}/${tokenId.toNumber()}`
          );
        });
        console.log("Setup event listener!");
      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      console.log(error);
    }
  };

  // 現在の発行状況を取得
  const checkMaxMint  = async () => {
      const provider = new ethers.providers.Web3Provider(ethereum);
      const signer = provider.getSigner();
      const connectedContract = new ethers.Contract(
        CONTRACT_ADDRESS,
        myEpicNft.abi,
        signer
      );
      const totalSupply = await connectedContract.totalSupply();
      const cap = await connectedContract.cap();
      // バランスをEther単位に調整
      setTotalSupply(totalSupply, 18);
      setCap(cap);
  }

  const askContractToMintNft = async () => {
    try {
      const { ethereum } = window;
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const connectedContract = new ethers.Contract(
          CONTRACT_ADDRESS,
          myEpicNft.abi,
          signer
        );
        console.log("Going to pop wallet now to pay gas...");
        let nftTxn = await connectedContract.makeAnEpicNFT();
        console.log("Mining...please wait.");
        // ローディングアニメーションを表示する
        const loadingOverlay = document.getElementById("loadingOverlay");
        loadingOverlay.style.display = "flex";
        await nftTxn.wait();
        console.log(
          `Mined, see transaction: https://sepolia.etherscan.io/tx/${nftTxn.hash}`
        );
        // ローディングアニメーションを非表示にする
        loadingOverlay.style.display = "none";checkMaxMint();
      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      console.log(error);
    }
  };

  const goGemcase = async () => {
    const test = "0x92cE5E5Cb5623C8d348Be62cdD0e576Ede7010E2";
    window.location.href = 'https://gemcase.vercel.app/view/evm/sepolia/' + currentAccount; // リダイレクト先のURLを指定
  }

  // renderNotConnectedContainer メソッドを定義します。
  const renderNotConnectedContainer = () => (
    <button
      onClick={connectWallet}
      className="cta-button connect-wallet-button"
    >
      Connect to Wallet
    </button>
  );

  // Mint NFT ボタンをレンダリングするメソッドを定義します。
    const renderMintUI = () => (
      <button
        onClick={askContractToMintNft}
        className="cta-button connect-wallet-button"
      >
        Mint NFT
      </button>
    );
  /*
   * ページがロードされたときに useEffect()内の関数が呼び出されます。
   */
  useEffect(() => {
    checkIfWalletIsConnected();
    checkMaxMint();
    loadingOverlay.style.display = "none";
  }, []);
  return (
    <div className="App">
      <div className="container">
        <div className="header-container">
          <p className="header gradient-text">My NFT Collection</p>
          <p className="sub-text">あなただけの特別な NFT を Mint しよう💫</p>
          <p className="sub-text">現在の発行状況は {totalSupply !== null ? `${totalSupply} / ${cap} TOKENS` : 'Loading...'}</p>
          {/*条件付きレンダリングを追加しました
          // すでに接続されている場合は、
          // Connect to Walletを表示しないようにします。*/}
          {currentAccount === "" ? renderNotConnectedContainer(): renderMintUI()}
        </div>
        <div class="loading-overlay" id="loadingOverlay">
            <div class="loader"></div>
            <p>Mining... Please wait.</p>
          </div>
        <div>
            <button
              onClick={goGemcase}
              className="cta-button connect-wallet-button"
            >
              gemcaseでコレクションを表示
            </button>
        </div>
        <div className="footer-container">
          <img alt="Twitter Logo" className="twitter-logo" src={twitterLogo} />
          <a
            className="footer-text"
            href={TWITTER_LINK}
            target="_blank"
            rel="noreferrer"
          >{`built on @${TWITTER_HANDLE}`}</a>
        </div>
      </div>
    </div>
  );
};
export default App;
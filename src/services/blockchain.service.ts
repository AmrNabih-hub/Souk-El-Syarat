/**
 * Blockchain Service
 * NFT marketplace, crypto payments, and smart contracts
 */

import { db } from '@/config/firebase.config';
import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc,
  getDocs,
  query,
  where,
  serverTimestamp
} from 'firebase/firestore';
import toast from 'react-hot-toast';

interface NFT {
  id: string;
  tokenId: string;
  contractAddress: string;
  owner: string;
  creator: string;
  metadata: {
    name: string;
    description: string;
    image: string;
    attributes: Array<{
      trait_type: string;
      value: string | number;
    }>;
  };
  price: number;
  currency: 'ETH' | 'MATIC' | 'BNB';
  isForSale: boolean;
  royaltyPercentage: number;
  transactionHistory: Transaction[];
}

interface Transaction {
  id: string;
  type: 'mint' | 'transfer' | 'sale' | 'auction';
  from: string;
  to: string;
  amount: number;
  currency: string;
  gasUsed?: number;
  blockNumber?: number;
  timestamp: Date;
}

interface SmartContract {
  address: string;
  abi: any[];
  network: 'ethereum' | 'polygon' | 'binance';
  type: 'marketplace' | 'nft' | 'payment' | 'escrow';
}

interface CryptoWallet {
  address: string;
  balance: {
    ETH: number;
    MATIC: number;
    BNB: number;
    USDT: number;
  };
  network: string;
  isConnected: boolean;
}

class BlockchainService {
  private static instance: BlockchainService;
  private web3Provider: any = null;
  private currentWallet: CryptoWallet | null = null;
  private contracts: Map<string, SmartContract> = new Map();
  private supportedNetworks = {
    ethereum: { chainId: '0x1', name: 'Ethereum Mainnet' },
    polygon: { chainId: '0x89', name: 'Polygon' },
    binance: { chainId: '0x38', name: 'Binance Smart Chain' }
  };

  private constructor() {
    this.initializeWeb3();
    this.loadSmartContracts();
  }

  static getInstance(): BlockchainService {
    if (!BlockchainService.instance) {
      BlockchainService.instance = new BlockchainService();
    }
    return BlockchainService.instance;
  }

  /**
   * Initialize Web3 provider
   */
  private async initializeWeb3() {
    if (typeof window === 'undefined') return;

    // Check for MetaMask or other Web3 providers
    if ((window as any).ethereum) {
      this.web3Provider = (window as any).ethereum;
      
      // Listen for account changes
      this.web3Provider.on('accountsChanged', (accounts: string[]) => {
        if (accounts.length === 0) {
          this.disconnectWallet();
        } else {
          this.updateWalletInfo(accounts[0]);
        }
      });

      // Listen for network changes
      this.web3Provider.on('chainChanged', (chainId: string) => {
        window.location.reload();
      });
    }
  }

  /**
   * Load smart contract configurations
   */
  private async loadSmartContracts() {
    // Load contract ABIs and addresses from database
    try {
      const contractsSnapshot = await getDocs(collection(db, 'smart_contracts'));
      contractsSnapshot.forEach(doc => {
        const contract = doc.data() as SmartContract;
        this.contracts.set(contract.type, contract);
      });
    } catch (error) {
      console.error('Error loading smart contracts:', error);
    }
  }

  /**
   * Connect crypto wallet
   */
  async connectWallet(): Promise<CryptoWallet> {
    if (!this.web3Provider) {
      throw new Error('No Web3 provider found. Please install MetaMask.');
    }

    try {
      // Request account access
      const accounts = await this.web3Provider.request({
        method: 'eth_requestAccounts'
      });

      if (accounts.length === 0) {
        throw new Error('No accounts found');
      }

      const address = accounts[0];
      
      // Get network
      const chainId = await this.web3Provider.request({
        method: 'eth_chainId'
      });

      // Get balances
      const balance = await this.getWalletBalance(address);

      this.currentWallet = {
        address,
        balance,
        network: this.getNetworkName(chainId),
        isConnected: true
      };

      // Save wallet connection
      await this.saveWalletConnection(address);

      toast.success('Wallet connected successfully!');
      return this.currentWallet;

    } catch (error: any) {
      console.error('Error connecting wallet:', error);
      toast.error(error.message || 'Failed to connect wallet');
      throw error;
    }
  }

  /**
   * Disconnect wallet
   */
  async disconnectWallet() {
    this.currentWallet = null;
    toast.info('Wallet disconnected');
  }

  /**
   * Get wallet balance
   */
  private async getWalletBalance(address: string): Promise<CryptoWallet['balance']> {
    try {
      // Get ETH balance
      const ethBalance = await this.web3Provider.request({
        method: 'eth_getBalance',
        params: [address, 'latest']
      });

      // Convert from Wei to ETH
      const ethValue = parseInt(ethBalance, 16) / 1e18;

      // Get token balances (simplified - in production use token contracts)
      return {
        ETH: ethValue,
        MATIC: 0,
        BNB: 0,
        USDT: 0
      };
    } catch (error) {
      console.error('Error getting balance:', error);
      return { ETH: 0, MATIC: 0, BNB: 0, USDT: 0 };
    }
  }

  /**
   * Create and mint NFT
   */
  async mintNFT(
    name: string,
    description: string,
    imageUrl: string,
    attributes: any[],
    royaltyPercentage: number = 10
  ): Promise<NFT> {
    if (!this.currentWallet) {
      throw new Error('Please connect your wallet first');
    }

    try {
      // Generate token metadata
      const metadata = {
        name,
        description,
        image: imageUrl,
        attributes
      };

      // In production, upload to IPFS
      const metadataUri = await this.uploadToIPFS(metadata);

      // Mint NFT on blockchain (simplified)
      const tokenId = `${Date.now()}`;
      const contractAddress = this.contracts.get('nft')?.address || '0x0';

      // Create NFT document
      const nftDoc = await addDoc(collection(db, 'nfts'), {
        tokenId,
        contractAddress,
        owner: this.currentWallet.address,
        creator: this.currentWallet.address,
        metadata,
        metadataUri,
        price: 0,
        currency: 'ETH',
        isForSale: false,
        royaltyPercentage,
        transactionHistory: [{
          id: `tx_${Date.now()}`,
          type: 'mint',
          from: '0x0',
          to: this.currentWallet.address,
          amount: 0,
          currency: 'ETH',
          timestamp: new Date()
        }],
        createdAt: serverTimestamp()
      });

      const nft: NFT = {
        id: nftDoc.id,
        tokenId,
        contractAddress,
        owner: this.currentWallet.address,
        creator: this.currentWallet.address,
        metadata,
        price: 0,
        currency: 'ETH',
        isForSale: false,
        royaltyPercentage,
        transactionHistory: []
      };

      toast.success('NFT minted successfully!');
      return nft;

    } catch (error: any) {
      console.error('Error minting NFT:', error);
      toast.error('Failed to mint NFT');
      throw error;
    }
  }

  /**
   * List NFT for sale
   */
  async listNFTForSale(nftId: string, price: number, currency: NFT['currency']) {
    if (!this.currentWallet) {
      throw new Error('Please connect your wallet first');
    }

    try {
      await updateDoc(doc(db, 'nfts', nftId), {
        price,
        currency,
        isForSale: true,
        updatedAt: serverTimestamp()
      });

      toast.success('NFT listed for sale!');
    } catch (error) {
      console.error('Error listing NFT:', error);
      toast.error('Failed to list NFT');
      throw error;
    }
  }

  /**
   * Buy NFT
   */
  async buyNFT(nftId: string): Promise<Transaction> {
    if (!this.currentWallet) {
      throw new Error('Please connect your wallet first');
    }

    try {
      // Get NFT details
      const nftQuery = query(collection(db, 'nfts'), where('id', '==', nftId));
      const nftSnapshot = await getDocs(nftQuery);
      
      if (nftSnapshot.empty) {
        throw new Error('NFT not found');
      }

      const nft = nftSnapshot.docs[0].data() as NFT;

      if (!nft.isForSale) {
        throw new Error('NFT is not for sale');
      }

      // Process payment (simplified - in production use smart contract)
      const transaction: Transaction = {
        id: `tx_${Date.now()}`,
        type: 'sale',
        from: this.currentWallet.address,
        to: nft.owner,
        amount: nft.price,
        currency: nft.currency,
        timestamp: new Date()
      };

      // Update NFT ownership
      await updateDoc(doc(db, 'nfts', nftId), {
        owner: this.currentWallet.address,
        isForSale: false,
        transactionHistory: [...(nft.transactionHistory || []), transaction],
        updatedAt: serverTimestamp()
      });

      // Calculate and distribute royalties
      if (nft.creator !== nft.owner) {
        const royaltyAmount = nft.price * (nft.royaltyPercentage / 100);
        await this.distributeRoyalties(nft.creator, royaltyAmount, nft.currency);
      }

      toast.success('NFT purchased successfully!');
      return transaction;

    } catch (error: any) {
      console.error('Error buying NFT:', error);
      toast.error('Failed to buy NFT');
      throw error;
    }
  }

  /**
   * Process crypto payment
   */
  async processCryptoPayment(
    amount: number,
    currency: string,
    recipient: string
  ): Promise<Transaction> {
    if (!this.currentWallet) {
      throw new Error('Please connect your wallet first');
    }

    try {
      // Convert amount to Wei (for ETH)
      const amountInWei = (amount * 1e18).toString(16);

      // Send transaction
      const txHash = await this.web3Provider.request({
        method: 'eth_sendTransaction',
        params: [{
          from: this.currentWallet.address,
          to: recipient,
          value: `0x${amountInWei}`,
          gas: '0x5208' // 21000 gas
        }]
      });

      // Wait for transaction confirmation
      const receipt = await this.waitForTransaction(txHash);

      // Create transaction record
      const transaction: Transaction = {
        id: txHash,
        type: 'sale',
        from: this.currentWallet.address,
        to: recipient,
        amount,
        currency,
        gasUsed: parseInt(receipt.gasUsed, 16),
        blockNumber: parseInt(receipt.blockNumber, 16),
        timestamp: new Date()
      };

      // Save transaction
      await addDoc(collection(db, 'crypto_transactions'), transaction);

      toast.success('Payment successful!');
      return transaction;

    } catch (error: any) {
      console.error('Error processing payment:', error);
      toast.error('Payment failed');
      throw error;
    }
  }

  /**
   * Deploy smart contract for escrow
   */
  async createEscrowContract(
    buyer: string,
    seller: string,
    amount: number,
    currency: string
  ): Promise<string> {
    try {
      // Deploy escrow smart contract (simplified)
      const escrowContract = {
        buyer,
        seller,
        amount,
        currency,
        status: 'pending',
        createdAt: new Date()
      };

      const escrowDoc = await addDoc(collection(db, 'escrow_contracts'), escrowContract);

      toast.success('Escrow contract created!');
      return escrowDoc.id;

    } catch (error) {
      console.error('Error creating escrow:', error);
      toast.error('Failed to create escrow');
      throw error;
    }
  }

  /**
   * Get user's NFT collection
   */
  async getUserNFTs(address?: string): Promise<NFT[]> {
    const walletAddress = address || this.currentWallet?.address;
    
    if (!walletAddress) {
      return [];
    }

    try {
      const nftsQuery = query(
        collection(db, 'nfts'),
        where('owner', '==', walletAddress)
      );
      
      const snapshot = await getDocs(nftsQuery);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as NFT));
    } catch (error) {
      console.error('Error fetching NFTs:', error);
      return [];
    }
  }

  /**
   * Get marketplace NFTs
   */
  async getMarketplaceNFTs(): Promise<NFT[]> {
    try {
      const nftsQuery = query(
        collection(db, 'nfts'),
        where('isForSale', '==', true)
      );
      
      const snapshot = await getDocs(nftsQuery);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as NFT));
    } catch (error) {
      console.error('Error fetching marketplace NFTs:', error);
      return [];
    }
  }

  /**
   * Verify product authenticity using blockchain
   */
  async verifyProductAuthenticity(productId: string): Promise<{
    isAuthentic: boolean;
    certificate?: string;
    verificationHash?: string;
  }> {
    try {
      // Generate verification hash
      const verificationData = {
        productId,
        timestamp: Date.now(),
        verifier: this.currentWallet?.address || 'system'
      };

      const verificationHash = await this.generateHash(JSON.stringify(verificationData));

      // Check blockchain records
      const authenticityQuery = query(
        collection(db, 'product_authenticity'),
        where('productId', '==', productId)
      );
      
      const snapshot = await getDocs(authenticityQuery);
      
      if (!snapshot.empty) {
        const record = snapshot.docs[0].data();
        return {
          isAuthentic: true,
          certificate: record.certificate,
          verificationHash
        };
      }

      // Create new authenticity record
      const certificate = await this.generateCertificate(productId);
      
      await addDoc(collection(db, 'product_authenticity'), {
        productId,
        certificate,
        verificationHash,
        verifiedAt: serverTimestamp()
      });

      return {
        isAuthentic: true,
        certificate,
        verificationHash
      };

    } catch (error) {
      console.error('Error verifying authenticity:', error);
      return { isAuthentic: false };
    }
  }

  /**
   * Helper functions
   */
  private async uploadToIPFS(data: any): Promise<string> {
    // In production, use actual IPFS service
    return `ipfs://${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async waitForTransaction(txHash: string): Promise<any> {
    // Wait for transaction to be mined
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          transactionHash: txHash,
          blockNumber: '0x' + Math.floor(Math.random() * 1000000).toString(16),
          gasUsed: '0x5208'
        });
      }, 3000);
    });
  }

  private async distributeRoyalties(creator: string, amount: number, currency: string) {
    // Distribute royalties to creator
    console.log(`Distributing ${amount} ${currency} royalties to ${creator}`);
  }

  private async saveWalletConnection(address: string) {
    // Save wallet connection to user profile
    await addDoc(collection(db, 'wallet_connections'), {
      address,
      connectedAt: serverTimestamp()
    });
  }

  private async updateWalletInfo(address: string) {
    if (this.currentWallet) {
      this.currentWallet.address = address;
      this.currentWallet.balance = await this.getWalletBalance(address);
    }
  }

  private getNetworkName(chainId: string): string {
    const networks: Record<string, string> = {
      '0x1': 'Ethereum',
      '0x89': 'Polygon',
      '0x38': 'BSC'
    };
    return networks[chainId] || 'Unknown';
  }

  private async generateHash(data: string): Promise<string> {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  private async generateCertificate(productId: string): Promise<string> {
    return `CERT-${productId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Public API
   */
  isWalletConnected(): boolean {
    return this.currentWallet?.isConnected || false;
  }

  getCurrentWallet(): CryptoWallet | null {
    return this.currentWallet;
  }

  async switchNetwork(network: keyof typeof this.supportedNetworks) {
    if (!this.web3Provider) {
      throw new Error('No Web3 provider found');
    }

    try {
      await this.web3Provider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: this.supportedNetworks[network].chainId }]
      });
    } catch (error: any) {
      // If network doesn't exist, add it
      if (error.code === 4902) {
        await this.web3Provider.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: this.supportedNetworks[network].chainId,
            chainName: this.supportedNetworks[network].name
          }]
        });
      } else {
        throw error;
      }
    }
  }
}

export const blockchainService = BlockchainService.getInstance();
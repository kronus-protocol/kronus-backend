const solanaWeb3 = require('@solana/web3.js');
const  anchor = require("@project-serum/anchor");
const KronusLib = require("./kronus-lib");
const DB = require("./DB");
const base58 = require("bs58");
const NodeWallet = require('@project-serum/anchor/dist/cjs/nodewallet');

class SolanaHelper {

  static connection;
  static contractLib;

  static setupContractLib() {
    // const userWalletSecretKey = '3ZcBG7cAJ8mHTAWuiENvWqTGPNnW9nN17JPw2jSpfx5RNrM1zQ1gN1oVwoNX84HxKCU31BQRAq8rLMDSGTtK27ut';
    // const userWalletKeypair = solanaWeb3.Keypair.fromSecretKey(base58.decode(userWalletSecretKey));
    // const userWallet = new anchor.Wallet(userWalletKeypair);
    // anchor.setProvider(provider);

    const programId = '5gk9VvQLwJtAt2KxxccvYeeDkJkMsmUzyt1p8e4qMdBL';
    const serverKeypair = solanaWeb3.Keypair.fromSecretKey(new Uint8Array([47,201,17,34,42,33,99,66,110,20,52,131,242,244,164,211,59,113,205,134,228,151,103,76,234,124,161,142,178,106,235,203,93,200,35,101,38,73,164,79,25,92,115,160,53,219,63,1,189,146,201,207,10,201,70,173,96,129,251,24,122,13,232,97]));
    const serverWallet = new anchor.Wallet(serverKeypair);
    return new KronusLib(programId, SolanaHelper.connection, serverWallet);
  }

  static setupConnection() {

    // setup solanaWeb3 connection
    let net = 'devnet';
    SolanaHelper.connection = new solanaWeb3.Connection(
      // solanaWeb3.clusterApiUrl(net),
      'https://fragrant-black-cherry.solana-devnet.quiknode.pro/74fbede70f2b8f6ed9b5bac5bfcda983e8bab832/',
      'confirmed',
    );

    // const commitment: Commitment = 'processed';
    // SolanaHelper.connection = new Connection('https://api.devnet.solana.com', { commitment, wsEndpoint: 'wss://api.devnet.solana.com/' });


    // setup anchor connection
    SolanaHelper.contractLib = SolanaHelper.setupContractLib();

    console.log('connecting to ', net, '. Anchor contract also setup.');
  }

  static async assignSignerToGamer(pubkey) {
    if (pubkey in DB.get('GAMER_TO_SIGNER')) {
      return;
    }

    // create a signer account for gamer
    let signerKeypair = solanaWeb3.Keypair.generate();
    // let aidropTxHash = await SolanaHelper.connection.requestAirdrop(
    //     signerKeypair.publicKey,
    //     solanaWeb3.LAMPORTS_PER_SOL * 0.2
    // );
    // await SolanaHelper.connection.confirmTransaction(aidropTxHash);
    console.log('Created signer key for gamer=', pubkey, ' signer=', signerKeypair.publicKey.toString());
    DB.store['GAMER_TO_SIGNER'][pubkey] = signerKeypair;
  }
}

module.exports = SolanaHelper;

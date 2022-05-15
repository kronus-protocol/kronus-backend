const solanaWeb3 = require('@solana/web3.js');
const anchor = require("@project-serum/anchor");
const KronusLib = require("./kronus-lib");
const DB = require("./DB");
const Constants = require("./Constants");

class SolanaHelper {

  static connection;
  static contractLib;

  static setupConnection() {

    // setup solanaWeb3 connection
    let net = 'devnet';
    SolanaHelper.connection = new solanaWeb3.Connection(
      // solanaWeb3.clusterApiUrl(net),
      'https://fragrant-black-cherry.solana-devnet.quiknode.pro/74fbede70f2b8f6ed9b5bac5bfcda983e8bab832/',
      'confirmed',
    );


    // setup anchor connection
    const programId = '5gk9VvQLwJtAt2KxxccvYeeDkJkMsmUzyt1p8e4qMdBL';
    const serverKeypair = solanaWeb3.Keypair.fromSecretKey(new Uint8Array([47,201,17,34,42,33,99,66,110,20,52,131,242,244,164,211,59,113,205,134,228,151,103,76,234,124,161,142,178,106,235,203,93,200,35,101,38,73,164,79,25,92,115,160,53,219,63,1,189,146,201,207,10,201,70,173,96,129,251,24,122,13,232,97]));
    const serverWallet = new anchor.Wallet(serverKeypair);
    SolanaHelper.contractLib = new KronusLib(programId, SolanaHelper.connection, serverWallet);

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
    // console.log('Airdrop 0.2 SOL to gamer=', pubkey, ' signer=', signerKeypair.publicKey.toString(), ' tx=', aidropTxHash);
    DB.store['GAMER_TO_SIGNER'][pubkey] = signerKeypair;
  }
}

module.exports = SolanaHelper;

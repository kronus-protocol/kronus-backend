const Game = require("./Game");
const Constants = require("./Constants");
const DB = require("./DB");
const SolanaHelper = require("./SolanaHelper");
const solanaWeb3 =  require("@solana/web3.js");
const {Wallet} = require("@project-serum/anchor");

const winningCombinations = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
];

/**
 * pubkey0: 'o', pubkey1: 'x'
 */
class GameHelper {

    static async initGame(game_id, pubkey0, pubkey1) {
        let game = new Game({
            game_id,
            pubkey0,
            pubkey1,
            grid: ['', '', '', '', '', '', '', '', '', ],
        });
        DB.set(game_id, game);

        console.log('create a signer for pubkey0 if it does not exist');
        await SolanaHelper.assignSignerToGamer(pubkey0);
    }

    static getDB() {
        return DB.store;
    }

    static nextMover(grid) {
        let os = 0;
        let xs = 0;
        let emptys = 0;
        for (let p of grid) {
            if (p==='') {
                emptys += 1;
            } else if (p === 'o') {
                os += 1;
            } else {
                xs += 1;
            }
        }
        return os <= xs ? 'pubkey0' : 'pubkey1';
    }

    static computeWinner(grid) {
        // checking for each combinations
        for (let i = 0; i < winningCombinations.length; i++) {
            const [a, b, c] = winningCombinations[i];
            // first check if grid is occupy then compare value to winning combinations
            if (grid[a] != '' && grid[a] === grid[b] && grid[a] === grid[c]) {
                // we have a winner
                return grid[a]==='o' ? Constants.PUBKEY0_WIN : Constants.PUBKEY1_WIN;
            }
        }
        if (!grid.includes('')) return Constants.TIE;
        return Constants.ONGOING;
    }

    static async move(game_id, pubkey, position) {
        let game = DB.get(game_id);
        if (game === undefined) {
            return Constants.GAME_ID_NOT_EXIST;
        }

        if (game.pubkey1 === null) {
            return Constants.GAME_NOT_STARTED;
        }

        if (position < 0 || position > 8) {
            return Constants.INVALID_MOVE;
        }

        // check if the game is still ongoing
        let gameStatus = GameHelper.computeWinner(game.grid);
        // console.log('gameStatus:', gameStatus, gameStatus in [Constants.TIE, Constants.PUBKEY0_WIN, Constants.PUBKEY1_WIN]);
        if ([Constants.TIE, Constants.PUBKEY0_WIN, Constants.PUBKEY1_WIN].indexOf(gameStatus) >= 0) {
            return Constants.GAME_ALREADY_DONE;
        }

        if (game.grid[position] != '') {
            return Constants.INVALID_OCCUPIED;
        }

        // still ongoing
        let nextMover = GameHelper.nextMover(game.grid);
        // console.log('nextMover:', nextMover);
        if ((nextMover=='pubkey0' && pubkey==game.pubkey0) ||
            (nextMover=='pubkey1' && pubkey==game.pubkey1)) {
            game.grid[position] = pubkey==game.pubkey0 ? 'o' : 'x';

            DB.set(game_id, game);

            // write to solana
            let signerPubkey = DB.get('GAMER_TO_SIGNER')[pubkey];
            console.log('signerPubkey=', signerPubkey.publicKey.toString());
            let transaction = await SolanaHelper.contractLib.makeMove(
                game_id,
                new solanaWeb3.PublicKey(pubkey),
                signerPubkey.publicKey,
                position
            );
            // console.log('moveTx=', transaction);

            transaction.recentBlockhash = (await SolanaHelper.connection.getLatestBlockhash()).blockhash;
            transaction.feePayer = signerPubkey.publicKey;

            // @ts-ignore
            let signer = new Wallet(signerPubkey);
            const signed = await signer.signTransaction(transaction);
            const tx = await SolanaHelper.connection.sendRawTransaction(signed.serialize());
            const txInfo = await SolanaHelper.connection.confirmTransaction(tx);
            console.log('final txInfo:', txInfo);

            // compute the grid status after the move
            let gameStatus = GameHelper.computeWinner(game.grid);
            switch (gameStatus) {
                case Constants.PUBKEY0_WIN:
                case Constants.PUBKEY1_WIN:
                case Constants.TIE:
                    return gameStatus;
                default:
                    return Constants.ONGOING;
            }
        } else {
            return Constants.INVALID_NOT_YOUR_TURN;
        }
    }
}

module.exports = GameHelper;
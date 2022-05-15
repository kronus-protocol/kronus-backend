const GameHelper = require("./GameHelper");
const Constants = require("./Constants");
const Game = require("./Game");
const DB = require("./DB");
const Utils = require("./Utils");
const SolanaHelper = require("./SolanaHelper");

class Controller {

    static async handleInitGame(req, res) {
        let { pubkey, } = req.body;
        let game_id = Math.random().toString(36).substring(2,7);

        // store in DB
        await GameHelper.initGame(game_id, pubkey, null);

        let ret = {
            success: true,
            game_id,
            pubkey0: pubkey,
            pubkey1: null,
            grid: ['','','','','','','','','',],
            pubkey0_signer: DB.get('GAMER_TO_SIGNER')[pubkey].publicKey,
        };
        res.status(201).json(ret);
    }

    static async handleAcceptInvite(req, res) {
        let { game_id, pubkey } = req.body;
        let ret = {};
        let game = DB.get(game_id);
        if (Utils.isEmpty(game)) {
            ret = {
                success: false,
                reason: Constants.GAME_ID_NOT_EXIST,
            }
        } else if (game.pubkey0 === pubkey) {
            ret = {
                success: false,
                reason: Constants.NEED_DIFF_PUBKEY,
            }
        } else {
            // update db
            game.pubkey1 = pubkey;
            DB.set(game_id, game);
            console.log('create a signer for pubkey1 if it does not exist');
            await SolanaHelper.assignSignerToGamer(game.pubkey1);

            ret = {
                success: true,
                game_id,
                pubkey0: game.pubkey0,
                pubkey1: game.pubkey1,
                grid: game.grid,
                pubkey0_signer: DB.get('GAMER_TO_SIGNER')[game.pubkey0].publicKey,
                pubkey1_signer: DB.get('GAMER_TO_SIGNER')[game.pubkey1].publicKey,
            }
        }
        res.status(201).json(ret);
    }

    static async handleMove (req, res) {
        let ret = {};
        let game;
        let {game_id, pubkey, position} = req.body;
        let result = await GameHelper.move(game_id, pubkey, position);
        switch(result) {
            case Constants.ONGOING:
            case Constants.PUBKEY0_WIN:
            case Constants.PUBKEY1_WIN:
            case Constants.TIE:
                game = DB.get(game_id);
                ret = {
                    success: true,
                    game_id,
                    pubkey0: game.pubkey0,
                    pubkey1: game.pubkey1,
                    game_status: result,
                    grid: game.grid,
                };
                break;
            case Constants.GAME_ID_NOT_EXIST:
            case Constants.GAME_NOT_STARTED:
                ret = {
                    success: false,
                    reason: result,
                };
                break;
            case Constants.INVALID_MOVE:
            case Constants.GAME_ALREADY_DONE:
            case Constants.INVALID_OCCUPIED:
            case Constants.INVALID_NOT_YOUR_TURN:
                game = DB.get(game_id);
                ret = {
                    success: false,
                    reason: result,
                    game_id,
                    pubkey0: game.pubkey0,
                    pubkey1: game.pubkey1,
                    grid: game.grid,
                };
                break;
            default:
                throw Error("should not be here");
        }

        res.status(201).json(ret);
    }

    static handleGetDB(req, res) {
        res.status(201).json(GameHelper.getDB());
    }
}

module.exports = Controller;
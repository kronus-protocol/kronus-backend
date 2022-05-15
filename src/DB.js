class DB {
    /**
     * {
     *    game_id1: Game{},
     *    game_id2: Game{},
     *
     *    gamer_to_signer: {
     *        gamer1Pubkey: signer1Pubkey,
     *        gamer2Pubkey: signer2Pubkey,
     *    }
     * }
     */
    static store = {};

    static set(game_id, game) {
        DB.store[game_id] = game;
    }

    static get(game_id) {
        return DB.store[game_id];
    }
}

module.exports = DB;
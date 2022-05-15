class Game {
    constructor(params) {
        let {game_id, pubkey0, pubkey1, grid} = params;
        this.game_id = game_id;
        this.pubkey0 = pubkey0;
        this.pubkey1 = pubkey1;
        this.grid = grid;
    }
}

module.exports = Game;
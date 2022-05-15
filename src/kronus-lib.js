const {AnchorProvider, Program, Wallet} = require("@project-serum/anchor");
const {IDL} = require("./kronus");
const solanaWeb3 =  require("@solana/web3.js");
const anchor = require("@project-serum/anchor");

class KronusLib {

    program;
    connection;

    constructor(programId, connection, wallet) {
        this.connection = connection;
        const provider = new AnchorProvider(connection, wallet, AnchorProvider.defaultOptions());
        this.program = new Program(IDL, programId, provider);
    }

    async getGamePdaAddress(uuid) {
        const [gamePdaAddress] = await solanaWeb3.PublicKey.findProgramAddress([Buffer.from(uuid)], this.program.programId);
        return gamePdaAddress;
    }

    async isGamePdaInitialize(gamePdaAddress) {
        const levelUpAccountInfo = await this.connection.getAccountInfo(gamePdaAddress);

        return levelUpAccountInfo != null;
    }

    async initializeGame (uuid, playerOne, playerOneSinger, playerTwo) {
        const gamePdaAddress = await this.getGamePdaAddress(uuid);

        const isGamePdaInitialized = await this.isGamePdaInitialize(gamePdaAddress);

        if (isGamePdaInitialized) {
            throw Error('Game already initialize');
        }

        const initializeGameTx = this.program.methods.initializeGame(uuid)
            .accounts({
                playerOne: playerOne,
                playerOneSingingKey: playerOneSinger,
                playerTwo: playerTwo,
                game: gamePdaAddress,
                systemProgram: anchor.web3.SystemProgram.programId
            }).transaction();

        return initializeGameTx;
    }

    async acceptGame (uuid, playerTwo, playerTwoSinger) {
        const gamePdaAddress = await this.getGamePdaAddress(uuid);

        const isGamePdaInitialized = await this.isGamePdaInitialize(gamePdaAddress);

        if (!isGamePdaInitialized) {
            throw Error('Game is not initialize');
        }

        const currentBlockTime = await anchor.getProvider().connection.getBlockTime(await anchor.getProvider().connection.getSlot(undefined));

        const acceptGameTx = await this.program.methods.acceptGame(new anchor.BN(currentBlockTime))
            .accounts({
                playerTwo: playerTwo,
                playerTwoSingingKey: playerTwoSinger,
                game: gamePdaAddress,
                systemProgram: anchor.web3.SystemProgram.programId
            }).transaction();

        return acceptGameTx;
    }

    async makeMove(uuid, player, playerSinger, moveValue) {
        const gamePdaAddress = await this.getGamePdaAddress(uuid);

        const isGamePdaInitialized = await this.isGamePdaInitialize(gamePdaAddress);

        if (!isGamePdaInitialized) {
            throw Error('Game is not initialize');
        }

        const currentBlockTime = await this.connection.getBlockTime(await this.connection.getSlot(undefined));

        const makeMoveTx = await this.program.methods.makeMove(moveValue, new anchor.BN(currentBlockTime))
            .accounts({
                player: player,
                playerSinger: playerSinger,
                game: gamePdaAddress
            }).transaction();

        return makeMoveTx;
    }

    async getGameDataByUuid(uuid) {
        const gamePdaAddress = await this.getGamePdaAddress(uuid);

        const isGamePdaInitialized = await this.isGamePdaInitialize(gamePdaAddress);

        if (!isGamePdaInitialized) {
            throw Error('Game is not initialize');
        }

        return (await this.program.account.game.fetch(gamePdaAddress));
    }

    async getGameDataByPda(gamePdaAddress) {
        const isGamePdaInitialized = await this.isGamePdaInitialize(gamePdaAddress);

        if (!isGamePdaInitialized) {
            throw Error('Game is not initialize');
        }

        return (await this.program.account.game.fetch(gamePdaAddress));
    }

}

module.exports = KronusLib;
var express = require('express');
var cookieParser = require('cookie-parser');
const cors = require('cors');
var logger = require('morgan');
const Controller = require('./src/controller');
const SolanaHelper = require('./src/SolanaHelper');
const DB = require("./src/DB");
const Constants = require("constants");

let app = express();

app.use(cors());
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.post("/move", async (req, res) => {
    await Controller.handleMove(req, res);
});

app.post("/init_game", async (req, res) => {
    await Controller.handleInitGame(req, res);
});

app.post("/accept_invite", (req, res) => {
    Controller.handleAcceptInvite(req, res);
});

app.get("/get_db", (req, res) => {
    Controller.handleGetDB(req, res);
});

async function onStart() {
    // Connect to cluster
    SolanaHelper.setupConnection();

    DB.set('GAMER_TO_SIGNER', {});
}

onStart().then(() => console.log('All initialized.'));

app.listen(3000);
module.exports = app;
require('dotenv').config();
const express = require('express');
const app = express();
const fileUpload = require('express-fileupload');
app.use(
    fileUpload({
        extended:true
    })
)
app.use(express.static(__dirname));
app.use(express.json());
const path = require("path");
const ethers = require('ethers');
const datastore = require("nedb")

var port = 3000;

const API_URL = process.env.API_URL;
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;

const {abi} = require('./artifacts/contracts/Voting.sol/Voting.json');
const { log } = require('console');
const provider = new ethers.providers.JsonRpcProvider(API_URL);

const database = new datastore('candidates.db');
database.remove({}, {
    multi: true
});
database.loadDatabase();

const signer = new ethers.Wallet(PRIVATE_KEY, provider);

const contractInstance = new ethers.Contract(CONTRACT_ADDRESS, abi, signer);

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
})

app.post("/addCandidate", async (req, res) => {
    var candidate = req.body.candidate;
    console.log(candidate)
    async function storeDataInBlockchain(candidate) {
        console.log("Adding the candidate in voting contract...");
        const tx = await contractInstance.addCandidate(candidate);
        await tx.wait();    
    }
    const bool = await contractInstance.getVotingStatus();
    if (bool == true) {
        await storeDataInBlockchain(candidate);
        res.send("The candidate has been registered in the smart contract");
        res.redirect("/");
    }
    else {
        res.send("Voting is DONE");
        res.redirect("/");
    }
});

app.post("/test", (req, res) => {
    const data = req.body;

    database.insert(data);
    console.log(data);

    res.json({
        status: "success"
    });

});

app.listen(port, function () {
    console.log("App is listening on port 3000")
});

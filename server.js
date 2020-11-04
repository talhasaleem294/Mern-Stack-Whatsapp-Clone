// importing
import express from "express";
import mongoose from "mongoose";
import Messages from "./dbMessages.js";
import Pusher from "pusher";
import cors from 'cors';

// app config
const app = express();
const port = process.env.PORT || 9000;

const pusher = new Pusher({
    appId: "1100723",
    key: "43e45c60cb8767c2adc0",
    secret: "45f65885076a0241f234",
    cluster: "ap2",
    useTLS: true
  });

// middlewares
app.use(express.json());
app.use(cors());

// DB config
const connection_url = "mongodb+srv://admin:VMXkRqzzGHPdtSJA@cluster0.7jlk5.mongodb.net/whatsappdb?retryWrites=true&w=majority";
mongoose.connect(connection_url, {
    useCreateIndex: true,
    useNewUrlParser: true,
    useUnifiedTopology: true
});

// ???
const db = mongoose.connection;

db.once("open", () => {
    console.log("DB Connected");

    const msgCollection = db.collection("messagecontents");
    const changeStream = msgCollection.watch();

    changeStream.on("change", (change) => {
        console.log("A change occured", change);

        if(change.operationType === "insert") {
            const messageDetails = change.fullDocument;
            pusher.trigger("messages", "inserted", 
            {
                name: messageDetails.name,
                message: messageDetails.message,
                timestamp: messageDetails.timestamp,
                received: messageDetails.received
            });
        } else {
            console.log("Error triggering pusher");
        }
    });
});

// api routes
app.get("/", (req, res) => res.status(200).send('hello world'));

app.get("/messages/sync", (req, res) => {
    Messages.find((err, data) => {
        if(err) {
            res.status(500).send(err)
        } else {
            res.status(200).send(data)
        }
    });
});


app.post("/messages/new", (req, res) => {
    const dbMessage = req.body;

    Messages.create(dbMessage, (err, data) => {
        if(err) {
            res.status(500).send(err)
        } else {
            res.status(201).send(data)
        }
    })
});

if(process.env.NODE_ENV=="production"){
    app.use(express.static('whatsapp-mern/build'))
    const path = require('path')
    app.get("*", (req, res) => {
        res.sendFile(path.resolve(__dirname, 'whatsapp-mern', 'build', 'index.html'))
    })
}

// listner
app.listen(port, ()=> console.log(`Listening on localhost:${port}`));


// VMXkRqzzGHPdtSJA
// 103.73.101.134   IP
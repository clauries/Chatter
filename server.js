// Requirements
const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const mongoose = require('mongoose');

// Letting our app... need to find why we used this
app.use(express.static(__dirname));
// Lets our app know to expect json strings
app.use(bodyParser.json());
// Lets our app know to exprect url encoded info
app.use(bodyParser.urlencoded({ extended: false }));

// Tell mongoose we want to use the regular promise
mongoose.Promise = Promise;

// Url for db
const dbUrl = 'mongodb+srv://clauries:claurie12@cluster0-mvub3.mongodb.net/test?retryWrites=true&w=majority';

// Creating a model for the data sent to Mongodb
const Message = mongoose.model('Message', {
    name: String,
    message: String,
});

// Getting messages from Express Server
app.get('/messages', (req, res) => {
    Message.find({}, (err, messages) => {
        res.send(messages);
    })
});

// Getting messages from Express Server for a specific user
app.get('/messages/:user', (req, res) => {
    const user = req.params.user;
    Message.find({name:user}, (err, messages) => {
        res.send(messages);
    })
});

// Posting messages on Express server & in db
app.post('/messages', async (req, res) => {
    // Try, catch, finally is a common expression for async programming
    try {
        // Create new message model
        const message = new Message(req.body);

        // Saving to db
        const savedMessage = await message.save();

        console.log('saved')

        // Looks for censored words
        const censored = await Message.findOne({ message: 'badword' });

        // If it finds a censored word, will remove word
        // else it will emit the message
        if (censored) {
            await Message.remove({ _id: censored.id });
        } else {
            io.emit('message', req.body);
        };

        // Sends the completed status
        res.sendStatus(200);
    // How to handle an error
    } catch (error) {
        res.sendStatus(500);
        return console.error(error);
    // What to do at the end - often tied to a log
    } finally {
        console.log('message post called')
    }
});

// Socket.io connection
io.on('connection', (socket) => {
    console.log('a user connected');
});

// Mongoose connection with MongoDB Atlas
mongoose.connect(dbUrl, { useNewUrlParser: true, useUnifiedTopology: true }, (err) => {
    console.log('mongo db connection', err);
});

// Server set up
const server = http.listen(3000, () => {
    console.log('server is listening on port', server.address().port);
});


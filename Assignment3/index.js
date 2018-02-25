let express = require('express');
let app = express();
let http = require('http').createServer(app);
let io = require('socket.io')(http);
let port = process.env.PORT || 3000;


let msgHistory = [];
let users = [];
http.listen( port, function () {
    console.log('listening on port', port);
});

app.use(express.static(__dirname + '/public'));

// listen to 'chat' messages
io.on('connection', function(socket){
    socket.on('chat', function(msg){
        msgHistory.push(buildMsg(msg));
	    io.emit('chat', msgHistory[msgHistory.length-1]);
    });
    socket.on('newUser', userName => {
        console.log('User has name from cookie: ', userName);
        io.emit('newUser', addUser(userName));
        console.log('New User has entered the arena', users);

    });
});

function buildMsg (msg) {
    return {
        username : msg['username'],
        msg : msg['msg'],
        timestamp : Date.now()
    }
}

function addUser(username) {
    return {
        username : users.includes(username) ? username : generateUsername(),
        msgHistory : msgHistory
    }
}

function generateUsername() {
    users.push('User' + (users.length + 1));
    return users[users.length-1];
}
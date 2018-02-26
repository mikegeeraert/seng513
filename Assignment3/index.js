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
io.on('connection', socket => {
    socket.on('chat', function(msg){
        msgHistory.push(buildMsg(msg));
	    io.emit('chat', msgHistory[msgHistory.length-1]);
    });
    socket.on('newUser', (nickname, callbackFn) => {
        callbackFn(addUser(nickname));
        console.log('New User has entered the arena', users);
    });
    socket.on('changeNickname', (nicknames, callbackFn) => {
        callbackFn(changeNickname(nicknames));
    });
});

function buildMsg (msg) {
    return {
        nickname : msg['nickname'],
        msg : msg['msg'],
        timestamp : Date.now()
    }
}

function addUser(nickname) {
    return {
        nickname : users.includes(nickname) ? nickname : generateNickname(),
        msgHistory : msgHistory
    }
}

function changeNickname(nicknames) {
    let index = users.findIndex(name => name === nicknames['oldNickname']);
    users.splice(index, 1);
    users.push(nicknames['newNickname']);
    console.log('nickname changed: ', users);
    return {
        newNickname: users[users.length-1]
    };
}

function generateNickname() {
    users.push('User' + (users.length + 1));
    return users[users.length-1];
}
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

// listen to messages
io.on('connection', socket => {
    socket.on('chat', function(msg){
        msgHistory.push(buildChatMsg(msg));
	    io.emit('chat', msgHistory[msgHistory.length-1]);
    });
    socket.on('newUser', (nickname, callbackFn) => {
        callbackFn(addUser(nickname));
        console.log('New User has entered the arena', users);
    });
    socket.on('changeNickname', (nicknames, callbackFn) => {
        let result  = changeNickname(nicknames);
        if (result['err'] === undefined) {
            msgHistory.push(buildChangedNicknameMsg(result));
            io.emit('changedNickname', nicknames);
        }
        callbackFn(result);
    });
});

function buildChatMsg (msg) {
    return {
        type : 'chat',
        nickname : msg['nickname'],
        msg : msg['msg'],
        timestamp : Date.now()
    }
}

function buildChangedNicknameMsg (msg) {
    return {
        type : 'changedNickname',
        oldNickname: msg['oldNickname'],
        newNickname: msg.newNickname
    }
}

function addUser(nickname) {
    return {
        nickname : users.includes(nickname) ? nickname : generateNickname(),
        msgHistory : msgHistory
    }
}

function changeNickname(nicknames) {
    let existingIndex = users.findIndex(name => name === nicknames['oldNickname']);
    let nameAlreadyExists = users.find(name => name === nicknames['newNickname']);
    if (nameAlreadyExists) {
        console.log('Name Already exists, returning an error to client');
        return {
            err: 'collision'
        }
    }
    else {
        users.splice(existingIndex, 1, nicknames['newNickname']);
        console.log('nickname changed: ', users);
        return nicknames;
    }
}

function generateNickname() {
    users.push('User' + (users.length + 1));
    return users[users.length-1];
}
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

//obscure server directory structure by using this alias for scripts
app.use('/scripts/', express.static(__dirname + '/node_modules/'));
//serve index.html from public directory
app.use(express.static(__dirname + '/public'));


// listen to messages
io.on('connection', socket => {

    socket.on('chat', function(msg){
        msgHistory.push(buildChatMsg(msg));
	    io.emit('chat', msgHistory[msgHistory.length-1]);
    });

    socket.on('newUser', (nickname, callbackFn) => {
        callbackFn(addUserAndShareHistory(nickname));
        console.log('New User has entered the arena', users);
    });

    socket.on('changeNickname', (deltaNickname, callbackFn) => {
        let result  = changeNickname(deltaNickname);
        if (result['err'] === undefined) {
            msgHistory.push(buildChangedNicknameMsg(result));
            io.emit('changedNickname', deltaNickname);
        }
        callbackFn(result);
    });
});

function buildChatMsg (msg) {
    return {
        type : 'chat',
        nickname : msg.nickname,
        msg : msg.msg,
        timestamp : Date.now()
    }
}

function buildChangedNicknameMsg (msg) {
    return {
        type : 'changedNickname',
        oldNickname: msg.oldNickname,
        newNickname: msg.newNickname
    }
}

function addUserAndShareHistory(nickname) {
    return {
        nickname : users.includes(nickname) ? nickname : generateNickname(),
        msgHistory : msgHistory
    }
}

function changeNickname(deltaNickname) {
    let result = {};
    let existingIndex = users.findIndex(name => name === deltaNickname.oldNickname);
    let nameAlreadyExists = users.find(name => name === deltaNickname.newNickname);

    if (deltaNickname.oldNickname === deltaNickname.newNickname) result = {err: 'no-change'};
    else if (nameAlreadyExists) result =  {err: 'collision'};
    else {
        users.splice(existingIndex, 1, deltaNickname.newNickname);
        console.log('nickname changed: ', users);
        result = deltaNickname;
    }
    return result;
}

function generateNickname() {
    users.push('User' + (users.length + 1));
    return users[users.length-1];
}
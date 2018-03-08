let express = require('express');
let app = express();
let http = require('http').createServer(app);
let io = require('socket.io')(http);
const rp = require('request-promise');
let port = process.env.PORT || 3000;


const AvailableUserColors = ['red', 'pink', 'purple', 'deep-purple', 'indigo', 'blue', 'light-blue', 'cyan', 'teal', 'green', 'light-green', 'lime', 'yellow', 'amber', 'orange', 'deep-orange', 'brown', 'grey', 'blue-grey', 'black'];
let msgHistory = [];
let users = {};
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
        msgHistory.push(buildChatMsg(msg, socket.id));
	    io.emit('chat', msgHistory[msgHistory.length-1]);
    });

    socket.on('newUser', (userCookieVals, callbackFn) => {
        addUser(userCookieVals, socket.id).then(user => {
            console.log('New User has entered the arena', users);
            let result = {
                user : user,
                allUsers: listUsers(),
                msgHistory : msgHistory
            };
            callbackFn(result);
            let newUserMessage = buildNewUserMsg(user.nickname);
            msgHistory.push(newUserMessage);
            io.emit('newUser', newUserMessage);
            socket.broadcast.emit('userChange', buildUserChangeMsg(socket.id, 'add'));
        });
    });

    socket.on('changeNickname', (deltaNickname, callbackFn) => {
        let oldUser = Object.assign({nickname: users[socket.id].nickname, color: users[socket.id].color});
        let result  = changeNickname(deltaNickname, socket.id);
        if (result['err'] === undefined) {
            msgHistory.push(buildChangedNicknameMsg(result));
            io.emit('changedNickname', deltaNickname);
            socket.broadcast.emit('userChange', buildUserChangeMsg(socket.id, 'update', oldUser));

        }
        callbackFn(result);
    });

    socket.on('changeColor', (deltaColor, callbackFn) => {
        let oldUser = Object.assign(users[socket.id]);
        let result = changeColor(deltaColor, socket.id);
        callbackFn(result);
        io.emit('userChange', buildUserChangeMsg(socket.id, 'update', oldUser));
    });

    socket.on('disconnect', () => {
        let user = Boolean(users[socket.id]) ? users[socket.id] : { nickname:'unknown user' } ;
        let userDisconnectedMsg = buildUserDisconnectedMsg(user.nickname);
        msgHistory.push(userDisconnectedMsg);
        io.emit('userDisconnected', userDisconnectedMsg);
        socket.broadcast.emit('userChange', buildUserChangeMsg(socket.id, 'remove'));
        removeUser(socket.id);
    });
});

function buildChatMsg (msg, socketId) {
    return {
        type : 'chat',
        nickname : msg.nickname,
        color : users[socketId].color,
        msg : msg.msg,
        timestamp : Date.now()
    }
}

function buildChangedNicknameMsg (msg) {
    return {
        type : 'changedNickname',
        oldNickname : msg.oldNickname,
        newNickname : msg.newNickname
    }
}

function buildNewUserMsg (nickname) {
    return {
        type : 'newUser',
        nickname : nickname
    }
}

function buildUserChangeMsg(socketId, action, oldUser) {
    return {
        action : action,
        user : users[socketId],
        oldUser : action === 'update' ? oldUser : null
    }
}

function buildUserDisconnectedMsg (nickname) {
    return {
        type : 'userDisconnected',
        nickname : nickname
    }
}

async function addUser(UserCookieVals, socketID) {
    let user = {
        nickname : UserCookieVals.nickname || await getNickname().catch(err => console.log(err)),
        color : UserCookieVals.color || 'cyan'
    };
    users[socketID] = user;
    return user;
}

function removeUser(socketID) {
    delete users[socketID];
}

function changeNickname(deltaNickname, socketId) {
    let result = {};
    let user = users[socketId];
    if (!Boolean(user)) result = {err: 'user-not-found'};
    else if (deltaNickname.oldNickname === deltaNickname.newNickname) result = {err: 'no-change'};
    else if (nameAlreadyExists(deltaNickname.newNickname)) result =  {err: 'collision'};
    else {
        users[socketId].nickname = deltaNickname.newNickname;
        result = deltaNickname;
    }
    return result;
}

function changeColor(deltaColor, socketId) {
    let result = {};
    let user = users[socketId];
    if (!Boolean(user)) result = {err: 'user-not-found'};
    else if (deltaColor.oldColor === deltaColor.newColor) result = { err: 'no-change' };
    else if (!AvailableUserColors.includes(deltaColor.newColor)) result = {err: 'not-available'};
    else {
        users[socketId].color = deltaColor.newColor;
        result = deltaColor;
    }
    return result;
}

const randomNounRequestURL = 'http://api.wordnik.com:80/v4/words.json/randomWord?hasDictionaryDef=true&includePartOfSpeech=proper-noun&excludePartOfSpeech=noun-plural&minCorpusCount=4500&maxCorpusCount=-1&minDictionaryCount=1&maxDictionaryCount=-1&minLength=5&maxLength=-1&api_key=a2a73e7b926c924fad7001ca3111acd55af2ffabf50eb4ae5';
const randomAdjectiveRequestURL = 'http://api.wordnik.com:80/v4/words.json/randomWord?hasDictionaryDef=true&includePartOfSpeech=adjective&excludePartOfSpeech=noun-plural&minCorpusCount=4500&maxCorpusCount=-1&minDictionaryCount=1&maxDictionaryCount=-1&minLength=5&maxLength=-1&api_key=a2a73e7b926c924fad7001ca3111acd55af2ffabf50eb4ae5';
function getNickname(optionalRetryCount) {

    //default to using generic "User{n}" nicknames if the word requests fail
    optionalRetryCount = optionalRetryCount || 0;
    let nickname = 'User' + (users.length + 1 + optionalRetryCount);

    let adjectivePromise = rp({uri: randomAdjectiveRequestURL, json: true})
        .then( body => { return body.word })
        .catch( err => { console.log(err) });
    let nounPromise = rp({uri: randomNounRequestURL, json: true})
        .then( body => { return body.word })
        .catch( err => { console.log(err) });

    return Promise.all([adjectivePromise, nounPromise])
        .then(results => {
        if (results[0] && results[1]) { nickname = results[0] + results[1] }
        if (nameAlreadyExists(nickname)){
            nickname = getNickname(optionalRetryCount + 1);
        }
        return nickname;
    });
}

function nameAlreadyExists(nickname) {
    for (let user in users) {
        if (users[user].nickname === nickname) return true;
    }
    return false;
}

function listUsers() {
    let userList = [];
    for (let user in users) {
        userList.push(users[user]);
    }
    return userList;
}
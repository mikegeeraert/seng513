let express = require('express');
let app = express();
let http = require('http').createServer(app);
let io = require('socket.io')(http);
const rp = require('request-promise');
let port = process.env.PORT || 3000;


const AvailableUserColors = ['red', 'pink', 'purple', 'deep-purple', 'indigo', 'blue', 'light-blue', 'cyan', 'teal', 'green', 'light-green', 'lime', 'yellow', 'amber', 'orange', 'deep-orange', 'brown', 'grey', 'blue-grey', 'black'];
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
        addUserAndShareHistory(nickname).then(message => {
            console.log('New User has entered the arena', users);
            callbackFn(message);
            let newUserMessage = buildNewUserMsg(message.nickname);
            msgHistory.push(newUserMessage);
            io.emit('newUser', newUserMessage);
        });
    });

    socket.on('changeNickname', (deltaNickname, callbackFn) => {
        let result  = changeNickname(deltaNickname);
        if (result['err'] === undefined) {
            msgHistory.push(buildChangedNicknameMsg(result));
            io.emit('changedNickname', deltaNickname);
        }
        callbackFn(result);
    });

    socket.on('changeColor', (deltaColor, callbackFn) => {
        let result = changeColor(deltaColor);
        callbackFn(result);
    })
});

function buildChatMsg (msg) {
    return {
        type : 'chat',
        nickname : msg.nickname,
        color : users.find(user => user.nickname === msg.nickname).color,
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
        nickname: nickname
    }
}

async function addUserAndShareHistory(nickname) {
    let existingUser = users.find(user => user.nickname === nickname);
    nickname = existingUser ? nickname : await getNickname().catch(err => console.log(err));
    let color = existingUser ? existingUser.color : 'cyan';
    users.push({nickname: nickname, color : color});
    return {
        nickname :  nickname,
        color : color ,
        msgHistory : msgHistory
    }
}

function changeNickname(deltaNickname) {
    let result = {};
    let existingIndex = users.findIndex(user => user.nickname === deltaNickname.oldNickname);
    let nameAlreadyExists = users.find(user => user.nickname === deltaNickname.newNickname);

    if (deltaNickname.oldNickname === deltaNickname.newNickname) result = {err: 'no-change'};
    else if (nameAlreadyExists) result =  {err: 'collision'};
    else {
        users[existingIndex].nickname = deltaNickname.newNickname;
        console.log('nickname changed: ', users);
        result = deltaNickname;
    }
    return result;
}

function changeColor(deltaColor) {
    let result = {};
    let userIndex = users.findIndex(user => user.nickname === deltaColor.nickname);

    if (deltaColor.oldColor === deltaColor.newColor) result = { err: 'no-change' };
    else if (!AvailableUserColors.includes(deltaColor.newColor)) result = {err: 'not-available'};
    else {
        users[userIndex].color = deltaColor.newColor;
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
        let nameAlreadyExists = users.find(user => user.nickname === nickname);
        if (nameAlreadyExists){
            nickname = getNickname(optionalRetryCount + 1);
        }
        return nickname;
    });
}
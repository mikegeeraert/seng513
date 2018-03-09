$(function() {
    let socket = io();

    _.templateSettings.variable = "rc";
    var chatTemplate = _.template($('#chat_message').html());
    var usersTemplate = _.template($('#users').html());
    var activityTemplate = _.template($('#activity_message').html());
    let users = [];

    let userCookieVals = getUserInfo();
    socket.emit('newUser', userCookieVals, response => loadConversation(response));

    $('form').submit(function(){
        let input = $('#m').val();
        determineAction(input);
	    $('#m').val('');
	    return false;
    });
    socket.on('chat', msg => displayChatMessage(msg));
    socket.on('changedNickname', msg => displayChangedNickname(msg));
    socket.on('newUser', msg => displayNewUser(msg));
    socket.on('userDisconnected', msg => displayUserDisconnected(msg));
    socket.on('userChange', msg => updateUserList(msg));
    socket.on('chatHistory', msg => setChatHistory(msg));

    function determineAction(input) {
        let command  = input.split(' ')[0];
        let option = input.split(' ')[1];

        switch(command) {
            case '/nick':
                changeNickname(option);
                break;
            case '/nickcolor':
                changeColor(option);
                break;
            case '/reset':
                resetChat();
                break;
            default:
                socket.emit('chat', buildChatMessage(input));
                break;
        }
    }

    function changeNickname(newNickname) {
        let user = getUserInfo();
        let deltaNickname = {
            oldNickname : user.nickname,
            newNickname : newNickname
        };
        socket.emit('changeNickname', deltaNickname, response => handleResponse(response));

        function handleResponse(response) {
            console.log(response);
            if (response['err'] !== undefined ) {
                let errorText = '';
                switch (response['err']) {
                    case 'collision':
                        errorText = 'Oops, someone already has that nickname!';
                        break;
                    case 'no-change':
                        errorText = 'Oops, you already have this nickname!';
                        break;
                    default:
                        errorText = 'There was an error that we did not expect. Please try again, differently.';
                        break;
                }
                displayToast(errorText);
            }
            else {
                setUserInfo(response.newNickname, null);
                displayUsers(users);
                displayToast('Great! You shall now be known as ' + response.newNickname);
            }
        }
    }

    function changeColor(newColor) {
        let user = getUserInfo();
        let deltaColor = {
            nickname : user.nickname,
            oldColor : user.color,
            newColor : newColor
        };

        socket.emit('changeColor', deltaColor, response => handleResponse(response));

        function handleResponse(response) {
            let resultText = '';
            if (response['err'] !== undefined ) {
                switch (response['err']) {
                    case 'no-change':
                        resultText = 'Oops, you already have this color applied!';
                        break;
                    case 'not-available':
                        resultText = 'Oh, sorry, that color is not available';
                    default:
                        resultText = 'There was an error that we did not expect. Please try again differently, and we will too.';
                        break;
                }
            }
            else {
                setUserInfo(null, response.newColor);
                displayUsers(users);
                resultText = 'There, your color should be different for all your new messages';
            }
            displayToast(resultText);
        }
    }

    function resetChat() {
        socket.emit('resetChat');
    }

    function buildChatMessage(msg) {
        return {
            user: getUserInfo(),
            msg: msg
        }
    }

    function setUserInfo(username, color) {
        let currentUser = getUserInfo();
        let updatedUser = {
            nickname : username || currentUser.nickname || 'Unknown Name',
            color : color || currentUser.color || 'grey'
        };
        let updateIndex = users.findIndex(user => user.nickname === currentUser.nickname);
        if (updateIndex > -1) { users.splice(updateIndex, 1, updatedUser)}
        Cookies.set('user', updatedUser);
    }

    function getUserInfo() {
        let user = Cookies.getJSON('user');
        return user !== undefined ? user : {username: null, color: null};
    }

    function loadConversation(response) {
        setUserInfo(response.user.nickname, response.user.color);
        users = response.allUsers;
        displayUsers(users);
        response.msgHistory.forEach(msg => displayMessage(msg));
    }

    function setChatHistory(msg) {
        $('#messages').empty();
        msg.forEach(msg => displayMessage(msg));
    }

    function displayMessage(msg) {
        switch(msg.type){
            case 'chat':
                displayChatMessage(msg);
                break;
            case 'changedNickname':
                displayChangedNickname(msg);
                break;
            case 'newUser':
                displayNewUser(msg);
                break;
            case 'userDisconnected':
                displayUserDisconnected(msg);
            default:
                break;
        }
        $
    }

    function displayUsers(userList) {
        $('#users-card').empty();
        let thisUser = getUserInfo();
        let otherUsers = new Set(userList);
        otherUsers.forEach(user => {
            if (user.nickname === thisUser.nickname) {
                otherUsers.delete(user);
            }
        });
        thisUser['firstLetter'] = thisUser.nickname.charAt(0).toUpperCase();
        otherUsers.forEach(user => user['firstLetter'] = user.nickname.charAt(0).toUpperCase());
        let usersForTemplate = {
            thisUser : thisUser,
            otherUsers : Array.from(otherUsers)
        };
        $('#users-card').append(usersTemplate(usersForTemplate));
    }

    function displayChatMessage(msg) {
        let localeOptions = {hour: 'numeric', minute: 'numeric'};
        msg.timestamp = new Date(msg.timestamp).toLocaleTimeString('en-US', localeOptions);
        msg['firstLetter'] = msg.nickname.charAt(0).toUpperCase();
        console.log(msg);
        $('#messages').append(chatTemplate(msg));

    }

    function displayChangedNickname(msg) {
        let oldNickname = msg['oldNickname'];
        let newNickname = msg['newNickname'];
        let text = oldNickname + ' changed their nickname to ' + newNickname;
        $('#messages').append(activityTemplate({text:text}));
    }

    function displayNewUser(msg) {
        let text = msg.nickname + ' joined the chat!';
        $('#messages').append(activityTemplate({text:text}));
    }

    function displayUserDisconnected(msg) {
        let text = msg.nickname + ' left the chat';
        $('#messages').append(activityTemplate({text:text}));
    }

    function updateUserList(msg) {
        console.log(msg);
        console.log('Users Before', users);
        switch(msg.action) {
            case 'add':
                users.push(msg.user);
                break;
            case 'remove':
                let removeIndex = users.findIndex(user => user.nickname === msg.user.nickname);
                if (removeIndex > -1) { users.splice(removeIndex, 1)}
                break;
            case 'update':
                let updateIndex = users.findIndex(user => user.nickname === msg.oldUser.nickname);
                if (updateIndex > -1) { users.splice(updateIndex, 1, msg.user)};
                break;

        }
        console.log('Users After', users);
        displayUsers(users);


    }
});

function displayToast (text) {
    let notification = document.querySelector('#error-toast');
    notification.MaterialSnackbar.showSnackbar(
        {
            message: text
        }
    );
}
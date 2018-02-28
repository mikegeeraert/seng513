$(function() {
    let socket = io();

    _.templateSettings.variable = "rc";
    var chatTemplate = _.template($('#chat_message').html());

    let userCookieVals = {
        nickname : findNickname(),
        color : findColor()
    };
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
            default:
                socket.emit('chat', buildChatMessage(input));
                break;
        }
    }

    function changeNickname(newNickname) {
        let deltaNickname = {
            oldNickname : findNickname(),
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
                        errorText = 'There was an error that we did not expect. Please try again differently.';
                        break;
                }
                displayToast(errorText);
            }
            else {
                Cookies.set('nickname', response.newNickname);
                displayToast('Great! You shall now be known as ' + response.newNickname);
            }
        }
    }

    function changeColor(newColor) {
        let deltaColor = {
            nickname : findNickname(),
            oldColor : findColor(),
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
                Cookies.set('color', response.newColor);
                resultText = 'There, your color should be different for all your new messages';
            }
            displayToast(resultText);
        }
    }

    function buildChatMessage(msg) {
        return {
            nickname: findNickname(),
            msg: msg
        }
    }

    function findNickname() {
        let nickname  = Cookies.get('nickname');
        return nickname !== undefined ? nickname : null;
    }

    function findColor() {
        let color = Cookies.get('color');
        return color !== undefined ? color : null;
    }

    function loadConversation(response) {
        Cookies.set('nickname', response.user.nickname);
        Cookies.set('color', response.user.color);
        response.msgHistory.forEach(msg => displayMessage(msg));

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
        }
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
        let item = $('<li></li>').text(oldNickname + ' changed their nickname to ' + newNickname);
        $('#messages').append(item);
    }

    function displayNewUser(msg) {
        let item = $('<li></li>').text(msg.nickname + ' joined the chat!');
        $('#messages').append(item);
    }

    function displayUserDisconnected(msg) {
        let item = $('<li></li>').text(msg.nickname + ' left the chat');
        $('#messages').append(item);
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
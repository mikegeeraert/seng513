$(function() {
    let socket = io();

    socket.emit('newUser', findNickname(), response => loadConversation(response));

    $('form').submit(function(){
        let input = $('#m').val();
        determineAction(input);
	    $('#m').val('');
	    return false;
    });
    socket.on('chat', msg => displayMessage(msg));

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
        let nicknames = {
            oldNickname : findNickname(),
            newNickname : newNickname
        };
        socket.emit('changeNickname', nicknames, response => handleResponse(response));

        function handleResponse(response) {
            let oldNickname = Cookies.get('nickname');
            let newNickname = response['newNickname'];
            Cookies.set('nickname', newNickname);
            let item = $('<li></li>').text(oldNickname + ' changed their nickname to ' + newNickname);
            $('#messages').append(item);
        }
    }


    function changeColor(input) {

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

    function loadConversation(response) {
        console.log(response);
        Cookies.set('nickname', response['nickname']);
        response['msgHistory'].forEach(msg => displayMessage(msg));
    }

    function displayMessage(msg) {
        let item = $('<li></li>');
        let nickname = $('<div></div>').text(msg['nickname']);
        let timestamp = new Date(msg['timestamp']);
        let localeOptions = {hour: 'numeric', minute: 'numeric'};
        let timeSent = $('<div></div>').text(timestamp.toLocaleTimeString('en-US', localeOptions));
        let message = $('<div></div>').text(msg['msg']);

        item.append(nickname, timeSent, message);
        $('#messages').append(item);

    }
});
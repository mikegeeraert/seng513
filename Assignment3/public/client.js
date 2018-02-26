$(function() {
    let socket = io();

    socket.emit('newUser', findNickname(), response => loadConversation(response));

    $('form').submit(function(){
        let input = $('#m').val();
        determineAction(input);
	    $('#m').val('');
	    return false;
    });
    socket.on('chat', msg => displayChatMessage(msg));
    socket.on('changedNickname', msg => displayChangedNickname(msg));

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
                displayErrorToast(errorText);
            }
            else {
                Cookies.set('nickname', response['newNickname']);
            }
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

        function displayMessage(msg) {
            switch(msg.type){
                case 'chat':
                    displayChatMessage(msg);
                    break;
                case 'changedNickname':
                    displayChangedNickname(msg);
                    break;
            }
        }
    }

    function displayChatMessage(msg) {
    // <li class="mdl-list__item">
    //         <span class="mdl-list__item-primary-content">
    //         <i class="material-icons mdl-list__item-icon">person</i>
    //     Aaron Paul
    //     </span>
    //     </li>
        let item = $('<li></li>');
        let nameChip = $("<span class=\"mdl-chip\"><span class=\"mdl-chip__text\">" + msg.nickname + "</span></span>");
        // let nickname = $('<div></div>').text(msg['nickname']);
        let timestamp = new Date(msg['timestamp']);
        let localeOptions = {hour: 'numeric', minute: 'numeric'};
        let timeSent = $('<span></span>').text(timestamp.toLocaleTimeString('en-US', localeOptions));
        let message = $('<div></div>').text(msg['msg']);

        item.append(nameChip, timeSent, message);
        $('#messages').append(item);

    }

    function displayChangedNickname(msg) {
        let oldNickname = msg['oldNickname'];
        let newNickname = msg['newNickname'];
        let item = $('<li></li>').text(oldNickname + ' changed their nickname to ' + newNickname);
        $('#messages').append(item);
    }
});

function displayErrorToast (errorText) {
    var notification = document.querySelector('#error-toast');
    notification.MaterialSnackbar.showSnackbar(
        {
            message: errorText
        }
    );
}
$(function() {
    let socket = io();

    socket.emit('newUser', findUsername(), response => loadConversation(response));

    $('form').submit(function(){
        input = $('#m').val();
        determineAction(input);
	    $('#m').val('');
	    return false;
    });
    socket.on('chat', msg => addMessageToPage(msg));
});

function determineAction(input) {
    if (input.startsWith('/nick')) { changeNickname(input) }
    else if (input.startsWith('/nickcolor')) { changeColor(input) }
    else { socket.emit('chat', buildMessage()) }
}

function changeNickname(input) {

}

function changeColor(input) {

}

function buildMessage() {
    return {
        username: findUsername(),
        msg: $('#m').val()
    }
}

function findUsername() {
    let username  = Cookies.get('username');
    return username !== undefined ? username : null;
}

function loadConversation(response) {
    console.log(response);
    Cookies.set('username', response['username']);
    response['msgHistory'].forEach(msg => addMessageToPage(msg));
}

function addMessageToPage(msg) {
    $('#messages').append(buildMessageToDisplay(msg));
}

function buildMessageToDisplay(msg) {
    let item = $('<li></li>');
    let username = $('<div></div>').text(msg['username']);
    let timestamp = new Date(msg['timestamp']);
    let localeOptions = {hour: 'numeric', minute: 'numeric'};
    let timeSent = $('<div></div>').text(timestamp.toLocaleTimeString('en-US', localeOptions));

    let message = $('<div></div>').text(msg['msg']);

    item.append(username, timeSent, message);
    return item;

}
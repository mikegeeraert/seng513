$(function() {
    let socket = io();

    socket.emit('newUser', findUsername());
    socket.on('newUser', response => loadConversation(response));

    $('form').submit(function(){
	socket.emit('chat', buildMessage());
	$('#m').val('');
	return false;
    });
    socket.on('chat', msg => addMessageToPage(msg));
});

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
    $('#messages').append($('<li>').text(msg['msg']));
}
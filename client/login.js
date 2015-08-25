var socket = io();
document.find('#name').on('keydown', function(e) {
  if (e.which === 13) {
    e.preventDefault();
    var username = e.target.textContent;
    // Set cookie to allow for refreshes
    document.cookie = 'name="' + username + '"';
    socket.emit('login', username);
  }
});

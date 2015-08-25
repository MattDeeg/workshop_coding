var _ = require('underscore');
var shared = require('./socket_shared');

module.exports = function(socket) {
  socket.emit('init_admin');
  shared.admin_users.push({
    id: socket.id,
    socket: socket
  });
  shared.updateAdmin('refreshdata');

  function removeUser() {
    for (var i = 0; i < shared.admin_users.length; i++) {
      if (shared.admin_users[i].id === socket.id) {
        shared.admin_users.splice(i, 1);
        break;
      }
    }
  }

  socket.on('logout', function() {
    shared.navigate(socket, 'login');
    removeUser();
  });
  socket.on('disconnect', removeUser);
};

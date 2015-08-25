var _ = require('underscore');
var tester = require('./test_code');
var shared = require('./socket_shared');
var getUserIndex = shared.getUserIndex;

module.exports = function(socket, existing) {
  socket.emit('init_user');

  var userData;
  if (existing.id) {
    var index = getUserIndex(existing.id);
    if (index !== null) {
      userData = shared.users[index];
      userData.id = socket.id;
      userData.socket = socket;
      userData.inactive = false;
    }
  }

  if (!userData) {
    userData = {
      id: socket.id,
      name: existing.name,
      socket: socket,
      inactive: false,
      data: {
        code: ''
      }
    };
    shared.users.push(userData);
  }

  userData.runTests = _.debounce(function() {
    tester(userData.data.code, shared.currentExercise.tests, function(result, failed) {
      userData.data.tests = result;
      socket.emit('updatetests', result);
      if (!failed) {
        shared.updateAdmin('userlist');
        shared.updateAdmin('code', {forId: socket.id});
      }
    });
  }, 1000);

  shared.updateAdmin('userlist');

  socket.on('login', function(name) {
    userData.name = name;
    shared.navigate(socket, 'editor', {
      username: name,
      exercise: shared.getCurrentData(socket.id)
    });
    shared.updateAdmin('userlist');
  });

  socket.on('updateCode', function(code) {
    var index = getUserIndex(socket.id);
    var userData = shared.users[index];
    userData.data.code = code;
    shared.updateAdmin('code', {forId: socket.id});
    userData.runTests();
  });

  socket.on('logout', function() {
    shared.navigate(socket, 'login');
    var index = getUserIndex(socket.id);
    shared.users.splice(index, 1);
    shared.updateAdmin('userlist');
  });

  socket.on('disconnect', function() {
    var index = getUserIndex(socket.id);
    shared.users[index].inactive = true;
    shared.updateAdmin('userlist');
  });
};

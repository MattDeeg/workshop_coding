var _ = require('underscore');
var tester = require('./test_code');
var shared = require('./socket_shared');
var getUserIndex = shared.getUserIndex;

module.exports = function(socket, existing) {
  socket.emit('init_user');

  var userData;
  var index = getUserIndex(existing.id);
  if (index !== null) {
    userData = shared.users[index];
    userData.name = existing.name;
    userData.socket = socket;
    userData.inactive = false;
  } else {
    userData = {
      id: existing.id,
      name: existing.name,
      socket: socket,
      inactive: false,
      data: {
        hasFiles: shared.currentExercise.hasFiles,
        files: shared.currentExercise.files
      }
    };
    shared.users.push(userData);
  }

  function runTests() {
    if (!shared.currentExercise.tests) {
      return;
    }
    tester(userData.data.files[0].code, shared.currentExercise.tests, function(result, failed) {
      userData.data.tests = result;
      socket.emit('updatetests', result);
      if (!failed) {
        shared.updateAdmin('userlist');
        shared.updateAdmin('updateresults', {forId: userData.id});
      }
    });
  }

  userData.runTests = _.debounce(runTests, 1000);

  if (!userData.data.tests) {
    runTests();
  }

  shared.updateAdmin('userlist');

  socket.on('login', function(name) {
    userData.name = name;
    var exercise = shared.getCurrentData(userData.id);
    shared.navigate(socket, 'editor', {
      username: name,
      exercise: exercise,
      activeFile: _.findWhere(exercise.files, {fileClass:'active'})
    });
    shared.updateAdmin('userlist');
  });

  socket.on('updateCode', function(files) {
    userData.data.files = files;
    shared.updateAdmin('code', {forId: userData.id});
    userData.runTests();
  });

  socket.on('logout', function() {
    shared.navigate(socket, 'login');
    var index = getUserIndex(userData.id);
    if (index !== null) {
      shared.users.splice(index, 1);
      shared.updateAdmin('userlist');
    }
  });

  socket.on('disconnect', function() {
    userData.inactive = true;
    shared.updateAdmin('userlist');
  });
};

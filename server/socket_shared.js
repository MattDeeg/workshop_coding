var fs = require('fs');
var path = require('path');
var _ = require('underscore');
var tester = require('./test_code');

function getFunctionContents(fn) {
  var fnLines = fn.toString().split('\n');
  // Remove the first and last lines to strip off that function wrapper
  fnLines.splice(0, 1);
  fnLines.splice(-1, 1);
  // Trim whitespace
  var whitespace = (/^\s+/.exec(fnLines[0]) || [''])[0].length;
  if (whitespace > 0) {
    for (var i = 0; i < fnLines.length; i++) {
      fnLines[i] = fnLines[i].substr(whitespace);
    }
  }
  return fnLines.join('\n');
}

function loadExercise(name) {
  var exercisePath = path.resolve(data.exercisePath + '/' + name + '.js');
  if (fs.existsSync(exercisePath)) {
    var workshop = require(exercisePath);
    if (typeof workshop.initial === 'function') {
      return {
        code: getFunctionContents(workshop.initial),
        tests: getFunctionContents(workshop.tests)
      };
    } else {
      var files = [];
      for (var filename in workshop.initial) {
        files.push({
          name: filename,
          code: getFunctionContents(workshop.initial[filename]),
          editable: filename !== 'entry.js',
          fileClass: filename === 'entry.js' ? 'active' : ''
        });
      }
      return {
        hasFiles: true,
        files: files,
        code: getFunctionContents(workshop.initial['entry.js']),
        output: workshop.output
      };
    }
  } else {
    return {};
  }
}

function getUserIndex(socketID) {
  var index = null;
  for (var i = 0; i < data.users.length; i++) {
    if (data.users[i].id === socketID) {
      index = i;
      break;
    }
  }
  return index;
}

function getCurrentData(socketID) {
  var index = getUserIndex(socketID);
  var loadData = _.extend({}, data.currentExercise);
  if (index !== null) {
    var userData = data.users[index];
    if (userData.data.code !== '') {
      loadData.code = userData.data.code;
    }
  }
  return loadData;
}

var data = module.exports = {
  users: [],
  admin_users: [],
  currentExercise: null,
  navigate: function navigate(socket, template, data) {
    socket.emit('navigate', {
      template:template,
      data:data||{}
    });
  },
  changeExercise: function(name) {
    data.currentExercise = loadExercise(name);
    // Get default test results
    tester(data.currentExercise.code, data.currentExercise.tests, function(result) {
      for (var i = data.users.length; i--;) {
        var user = data.users[i];
        user.socket.emit('load', data.currentExercise);
        user.data.tests = result;
        user.data.code = data.currentExercise.code;
        socket.emit('updatetests', result);
      }
    });
  },
  getUsers: function() {
    var numUsers = data.users.length;
    var results = new Array(numUsers);
    for (var i = numUsers; i--;) {
      results[i] = {
        id: data.users[i].id,
        name: data.users[i].name,
        data: data.users[i].data
      };
    }
    return results;
  },
  updateAdmin: function(type, extraData) {
    var socketData = _.extend({ users: data.getUsers() }, extraData);
    socketData.currentExercise = data.currentExercise;
    for (var i = data.admin_users.length; i--;) {
      data.admin_users[i].socket.emit(type, socketData);
    }
  },
  getUserIndex: getUserIndex,
  getCurrentData: getCurrentData,
  exercisePath: './exercises/',
  loadExercise: loadExercise
};

var fs = require('fs');
var path = require('path');
var _ = require('underscore');
var tester = require('./test_code');

function getFunctionContents(fn) {
  if (typeof fn !== 'function') {
    return fn;
  }
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

function getFileObject(name, fn, active) {
  return {
    name: name,
    code: getFunctionContents(fn),
    fileClass: active ? 'active' : ''
  };
}

function loadExercise(name) {
  var exercisePath = path.resolve(data.exercisePath + '/' + name + '.js');
  if (fs.existsSync(exercisePath)) {
    var workshop = require(exercisePath);
    if (typeof workshop.initial === 'function') {
      var files = [getFileObject('', workshop.initial, true)];
      return {
        hasFiles: false,
        files: files,
        tests: getFunctionContents(workshop.tests),
        code: files[0].code
      };
    } else {
      var files = _.map(workshop.initial, function(fn, filename) {
        return getFileObject(filename, fn, filename === 'entry.js');
      });
      return {
        hasFiles: true,
        files: files,
        jsFiles: JSON.stringify(files),
        code: files[0].code
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
  getCurrentUser: function(socketID) {
    var index = getUserIndex(socketID);
    if (index !== null) {
      return shared.users[index];
    }
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

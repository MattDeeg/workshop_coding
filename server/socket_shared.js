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
  var mode = /\.mustache$/.test(name) ? 'mustache' : 'javascript';
  return {
    name: name,
    code: getFunctionContents(fn),
    fileClass: active ? 'active' : '',
    mode: mode,
    lint: mode === 'javascript',
    cursor: [0, 0]
  };
}

function loadExercise(name, rootPath) {
  var exercisePath = path.resolve(rootPath + '/' + name + '.js');
  if (fs.existsSync(exercisePath)) {
    var workshop = require(exercisePath);
    var data = {};
    var files;
    if (typeof workshop.initial === 'function') {
      files = [getFileObject('entry.js', workshop.initial, true)];
    } else {
      files = _.map(workshop.initial, function(fn, filename) {
        return getFileObject(filename, fn, filename === 'entry.js');
      });
    }
    data.files = files;
    data.hasFiles = files.length > 1;
    data.code = _.findWhere(files, {name: 'entry.js'}).code;
    data.jsFiles = JSON.stringify(files);
    if (workshop.tests) {
      data.tests = getFunctionContents(workshop.tests);
    }
    if (workshop.output) {
      data.output = workshop.output;
    }
    return data;
  } else {
    return {};
  }
}

function getUserIndex(userId) {
  var index = null;
  for (var i = 0; i < data.users.length; i++) {
    if (data.users[i].id === userId) {
      index = i;
      break;
    }
  }
  return index;
}

function getCurrentData(userId) {
  var index = getUserIndex(userId);
  var loadData = _.extend({}, data.currentExercise);
  if (index !== null) {
    loadData.files = data.users[index].data.files;
    loadData.jsFiles = JSON.stringify(data.users[index].data.files);
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
    data.currentExercise = loadExercise(name, data.exercisePath);
    // Get default test results
    if (data.currentExercise.tests) {
      tester(data.currentExercise.code, data.currentExercise.tests, function(result) {
        for (var i = data.users.length; i--;) {
          var user = data.users[i];
          user.socket.emit('load', data.currentExercise);
          user.data.tests = result;
          user.data.files = data.currentExercise.files;
          user.socket.emit('updatetests', result);
        }
      });
    } else {
      for (var i = data.users.length; i--;) {
        var user = data.users[i];
        user.data.tests = null;
        user.socket.emit('load', data.currentExercise);
        user.data.files = data.currentExercise.files;
      }
      data.updateAdmin('userlist');
    }
  },
  getCurrentUser: function(userId) {
    var index = getUserIndex(userId);
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

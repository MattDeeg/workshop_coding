var fs = require('fs');
var path = require('path');
var _ = require('underscore');

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

var exerciseFolder = './exercises/';
function loadExercise(name) {
  var exercisePath = path.resolve(exerciseFolder + name + '.js');
  if (fs.existsSync(exercisePath)) {
    var workshop = require(exercisePath);
    return {
      code: getFunctionContents(workshop.initial),
      tests: getFunctionContents(workshop.tests)
    };
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
  currentExercise: loadExercise('workshop1'),
  navigate: function navigate(socket, template, data) {
    socket.emit('navigate', {
      template:template,
      data:data||{}
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
    for (var i = data.admin_users.length; i--;) {
      data.admin_users[i].socket.emit(type, socketData);
    }
  },
  getUserIndex: getUserIndex,
  getCurrentData: getCurrentData
};

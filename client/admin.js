var socket = io();
var editor, preview, tests;
socket.on('init_user', function() {
  window.location = '/';
});

function init() {
  var panel = document.getElementById('code_panel');
  if (panel) {
    editor = CodeMirror.fromTextArea(panel, {
      readOnly: true,
      mode: 'javascript',
      matchBrackets: true,
      continueComments: "Enter",
      electricChars: true,
      lineNumbers: true,
      gutters: ['hint-gutter'],
      theme: 'monokai'
    });

    tests = CodeMirror.fromTextArea(document.getElementById('result_panel'), {
      readOnly: true,
      mode: 'javascript',
      theme: 'monokai'
    });

    preview = CodeMirror.fromTextArea(document.getElementById('preview_panel'), {
      readOnly: true,
      mode: 'javascript',
      lineNumbers: false,
      theme: 'monokai'
    });
  }
}
window.registerPostNavigate(init);

document.delegate('click', '.js-change-exercise', function() {
  document.find('.js-exercise-selector').toggleClass('hidden');
});
document.delegate('click', '.js-exercise-selector', function(e) {
  if (e.target.hasClass('js-exercise-selector')) {
    e.target.toggleClass('hidden');
  }
});

document.delegate('change', '.js-exercise-selector', function(e) {
  var radioButtons = e.target.form.elements.exercise;
  var selected;
  for (var i = radioButtons.length; i--;) {
    if (radioButtons[i].checked) {
      selected = radioButtons[i].value;
      break;
    }
  }
  if (selected) {
    preview.setValue(exercises[selected].code);
  }
});

document.delegate('submit', '.js-exercise-selector-form', function(e) {
  e.preventDefault();
  var exerciseSelector = e.target.closest('js-exercise-selector-form');
  var radioButtons = exerciseSelector.elements.exercise;
  var selected;
  for (var i = radioButtons.length; i--;) {
    if (radioButtons[i].checked) {
      selected = radioButtons[i].value;
      break;
    }
  }
  if (selected) {
    socket.emit('changeExercise', selected);
    e.target.closest('js-exercise-selector').toggleClass('hidden');
  }
});

var lastUserData;
var selectedUserId = null;
document.delegate('click', '.js-user', function(e) {
  var userRow  = e.target.closest('js-user');
  selectedUserId = userRow.getAttribute('data-id');
  if (lastUserData) {
    updateUserList(lastUserData);
    updateCodeEditor(lastUserData);
  }
});

function updateUserList(data) {
  for (var i = data.users.length; i--;) {
    data.users[i].selected = data.users[i].id === selectedUserId;
  }
  var userList = document.find('.js-user-list');
  userList.empty();
  userList.append(templates('admin_user_list', data, true));
}

function updateCodeEditor(data) {
  for (var i = data.users.length; i--;) {
    if (data.users[i].id === selectedUserId) {
      var user = data.users[i];
      editor.setValue(user.data.code || '');
      if (user.data.cursor) {
        editor.setCursor(user.data.cursor);
      }
      if (user.data.tests) {
        tests.setValue(data.currentExercise.tests);
        document.find('.results').innerHTML = user.data.tests.output;
        document.find('.test_progress').innerHTML = user.data.tests.barHtml;
      }
      break;
    }
  }
}

socket.on('refreshdata', function(data) {
  lastUserData = data;
});

socket.on('userlist', function(data) {
  lastUserData = data;
  updateUserList(data);
});

socket.on('code', function(data) {
  lastUserData = data;
  if (data.forId !== selectedUserId) {
    return;
  }
  updateCodeEditor(data);
});

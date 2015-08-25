var socket = io();
var editor;
socket.on('init_user', function() {
  window.location = '/';
});

socket.on('navigate', init);

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
  }
}
init();

var lastUserData;
var selectedUserId = null;
var userList = document.find('.js-user-list');
userList.delegate('click', '.js-user', function(e) {
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
  userList.empty();
  userList.append(templates('admin_user_list', data, true));
}

function updateCodeEditor(data) {
  for (var i = data.users.length; i--;) {
    if (data.users[i].id === selectedUserId) {
      editor.setValue(data.users[i].data.code || '');
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

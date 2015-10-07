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

    // tests = CodeMirror.fromTextArea(document.getElementById('result_panel'), {
    //   readOnly: true,
    //   mode: 'javascript',
    //   theme: 'monokai'
    // });

    preview = CodeMirror.fromTextArea(document.getElementById('preview_panel'), {
      readOnly: true,
      mode: 'javascript',
      lineNumbers: false,
      theme: 'monokai'
    });
  }
}
window.registerPostNavigate(init);

function setEditorToFile(file) {
  editor.setValue(file.code || '');
  var isMustache = /\.mustache$/.test(file.name);
  editor.setOption('mode', isMustache ? 'mustache' : 'javascript');
}

var files;
document.delegate('click', '.js-file-tab', function(e) {
  if (!files || e.target.hasClass('active')) {
    return;
  }
  var newFile = e.target.getAttribute('data-file-id');
  activeFile.fileClass = '';
  var isMustache = false;
  for (var i = 0; i < files.length; i++) {
    if (files[i].name === newFile) {
      activeFile = files[i];
      files[i].fileClass = 'active';
      setEditorToFile(files[i]);
    }
  }

  document.findAll('.js-file-tab').removeClass('active');
  e.target.addClass('active');
});

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
      if (!files) {
        files = user.data.files;
        for (var i = files.length; i--;) {
          if (files[i].fileClass !== '') {
            activeFile = files[i];
            break;
          }
        }
      } else {
        for (var i = files.length; i--;) {
          files[i].code = user.data.files[i].code;
        }
      }

      var tabs = document.find('#file_tabs');
      tabs.empty();
      tabs.append(templates('editor_file_tabs', {
        exercise: {
          hasFiles: files.length > 1,
          files: files
        }
      }, true));
      setEditorToFile(activeFile);
      if (tests && user.data.tests) {
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

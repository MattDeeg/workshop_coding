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
  editor.setOption('mode', file.mode);
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

document.delegate('click', '.js-refresh', function(e) {
  document.find('iframe').contentWindow.location.reload();
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
    files = activeFile = null
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
    updateCodeEditor(lastUserData, true);
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

function setResultsPanel(user, data) {
  var wrapper = document.find('.result_panel');
  wrapper.empty();
  wrapper.append(templates('admin_results_panel', {
    userId: user.id,
    barHtml: user.data.tests && user.data.tests.barHtml,
    testOutput: user.data.tests && user.data.tests.output,
    tests: data.currentExercise.tests
  }, true));

  var testResults = document.getElementById('result_panel');
  if (data.currentExercise.tests && testResults) {
    tests = CodeMirror.fromTextArea(testResults, {
      readOnly: true,
      mode: 'javascript',
      theme: 'monokai'
    });
  }
}

function updateCodeEditor(data, refreshResults) {
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
      if (refreshResults) {
        setResultsPanel(user, data);
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

socket.on('updateresults', function(data) {
  if (data.forId !== selectedUserId) {
    return;
  }
  updateCodeEditor(lastUserData, true);
});

socket.on('code', function(data) {
  lastUserData = data;
  if (data.forId !== selectedUserId) {
    return;
  }
  updateCodeEditor(data);
});

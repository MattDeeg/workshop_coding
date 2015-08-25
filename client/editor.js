var socket = io();
socket.on('navigate', init);
var editor, tests;
socket.on('load', function(data) {
  if (data && data.code) {
    if (editor && tests) {
      editor.setValue(data.code);
      tests.setValue(data.tests);
    }
  }
});

document.on('keydown', function(e) {
  // Disable save key command to avoid natural instincts
  if (e.which === 83 && (e.ctrlKey || e.metaKey) || event.which == 19) {
    e.preventDefault();
    socket.emit('updateCode', editor.getValue(), editor.getCursor());
  }
});

document.delegate('click', '.js-toggle-results', function() {
  if (editor) {
    document.body.toggleClass('revealed');
  }
});

socket.on('updatetests', function(results) {
  var resultsDiv = document.find('.results');
  if (resultsDiv) {
    resultsDiv.innerHTML = results.output;
    document.find('.test_progress').innerHTML = results.barHtml;
  }
});

function init() {
  var codePanel = document.getElementById('code_panel');
  if (!codePanel) {
    editor = tests = null;
    return;
  }
  if (editor && tests) {
    socket.emit('updateCode', editor.getValue(), editor.getCursor());
    return;
  }
  var resultPanel = document.getElementById('result_panel');
  if (codePanel) {
    editor = CodeMirror.fromTextArea(codePanel, {
      mode: 'javascript',
      matchBrackets: true,
      continueComments: "Enter",
      electricChars: true,
      lineNumbers: true,
      gutters: ['hint-gutter'],
      theme: 'monokai'
    });

    tests = CodeMirror.fromTextArea(resultPanel, {
      readOnly: true,
      mode: 'javascript',
      theme: 'monokai'
    });

    var waiting;
    editor.on('change', function() {
      clearTimeout(waiting);
      waiting = setTimeout(updateHints, 500);
      socket.emit('updateCode', editor.getValue(), editor.getCursor());
    });
    socket.emit('updateCode', editor.getValue(), editor.getCursor());

    setTimeout(updateHints, 100);
  }
}
window.registerPostNavigate(init);

function setTheme(newTheme) {
  var codemirror = document.querySelector('.CodeMirror');
  codemirror.className = codemirror.className.replace(/cm-s-[\S]+/, 'cm-s-' + newTheme);
}

function updateHints() {
  editor.operation(function(){
    var value = editor.getValue();
    var numLines = value.split('\n').length;
    for (var i = 0; i < numLines; i++) {
      editor.setGutterMarker(i, 'hint-gutter', null);
    }

    JSHINT(editor.getValue(), window.jshintConfig);
    var errors = [];
    for (i = 0; i < JSHINT.errors.length; ++i) {
      var err = JSHINT.errors[i];
      if (!err) continue;
      var line = err.line - 1;
      errors[line] = errors[line] || [];
      errors[line].push(err.reason);
    }

    for (i = 0; i < errors.length; i++) {
      if (!errors[i]) {
        continue;
      }
      var num = errors[i].length;
      var text = '<ul><li>' + errors[i].join('</li><li>') + '</li></ul>';
      var wrapper = document.createElement('div');
      wrapper.className = 'lint-error';
      var icon = document.createElement('span');
      icon.appendChild(document.createTextNode(num));
      icon.className = 'lint-error-icon cm-error';
      var message = document.createElement('div');
      message.className = 'lint-error-message';
      message.innerHTML = text;
      wrapper.appendChild(icon);
      wrapper.appendChild(message);
      editor.setGutterMarker(i, 'hint-gutter', wrapper);
    }
  });
  var info = editor.getScrollInfo();
  var after = editor.charCoords({line: editor.getCursor().line + 1, ch: 0}, "local").top;
  if (info.top + info.clientHeight < after) {
    editor.scrollTo(null, after - info.clientHeight + 3);
  }
}

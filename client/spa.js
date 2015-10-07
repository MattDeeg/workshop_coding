var socket = io();
window.on('load', function() {
  socket.emit('handshake');
  socket.on('identify', function() {
    var matches = /(^| )workshop_id="(.*?)"/.exec(document.cookie);
    var existing = {};
    if (matches && matches[2]) {
      existing.id = matches[2];
    }

    matches = /(^| )name="(.*?)"/.exec(document.cookie);
    if (matches && matches[2]) {
      existing.name = matches[2];
    }

    socket.emit('identify', existing, window.ADMIN_SECRET);
  });
});

document.delegate('click', '.logout', function(e) {
  e.preventDefault();
  document.cookie='name=';
  socket.emit('logout');
});

var loadedScripts = {};

function loadScripts(scripts, callback) {
  if (scripts.length === 0) {
    if (callback && typeof callback === 'function') {
      callback();
    }
    return;
  }
  var script = scripts.splice(0, 1);
  script = script[0];
  if (script.src) {
    loadedScripts[script.src] = true;
    var stupid = document.createElement('script');
    stupid.onload = function() {
      loadScripts(scripts, callback);
    };
    stupid.setAttribute('src', script.src);
    document.body.appendChild(stupid);
  } else if (script.inline) {
    // Inline scripts apparently can't be injected, so we need to eval it
    eval(script.inline); // jshint ignore:line
    loadScripts(scripts, callback);
  }
}

var styleContainer = document.getElementById('pagestyles');
var appContainer = document.getElementById('app');
function renderState(state) {
  var output = templates(state.template, state.data);

  styleContainer.empty();
  styleContainer.append(output.styles);

  appContainer.empty();
  appContainer.append(output.content);

  var docFrag = stringToFragment(output.scripts);
  var scripts = docFrag.findAll('script');
  var script;
  var scriptsToLoad = [];
  for (var i = 0; i < scripts.length; i++) {
    script = scripts[i];
    script.parentNode.removeChild(script);
    if (script.src) {
      if (!loadedScripts[script.src]) {
        scriptsToLoad.push({
          src: script.src
        });
      }
    } else {
      scriptsToLoad.push({
        inline: script.textContent
      });
    }
  }
  appContainer.append(docFrag);
  loadScripts(scriptsToLoad, function() {
    runPostNavigate();
  });
}
socket.on('navigate', renderState);

var postNavigateTasks = [];
function registerPostNavigate(fn) {
  if (typeof fn === 'function') {
    postNavigateTasks.push(fn);
  }
}

function runPostNavigate() {
  for (var i = 0; i < postNavigateTasks.length; i++) {
    postNavigateTasks[i]();
  }
}

window.on('load', function() {
  var scripts = document.findAll('script[src]');
  for (var i = 0; i < scripts.length; i++) {
    loadedScripts[scripts[i].src] = true;
  }
  runPostNavigate();
});

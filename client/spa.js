var socket = io();
window.on('load', function() {
  socket.emit('handshake');
  socket.on('identify', function(socketID) {
    var matches = /(^| )workshop_id="(.*?)"/.exec(document.cookie);
    var existing = {};
    if (matches && matches[2]) {
      existing.id = matches[2];
    }
    // Set new cookie to latest socket ID
    document.cookie = 'workshop_id="' + socketID + '"';

    matches = /(^| )name="(.*?)"/.exec(document.cookie);
    if (matches && matches[2]) {
      existing.name = matches[2];
    }

    socket.emit('identify', existing, window.ADMIN_SECRET);
  });
});

document.delegate('click', '.logout', function(e) {
  e.preventDefault();
  socket.emit('logout');
});

var loadedScripts = {};

function loadScripts(scripts) {
  if (scripts.length === 0) {
    return;
  }
  var script = scripts.splice(0, 1);
  script = script[0];
  if (script.src) {
    loadedScripts[script.src] = true;
    var stupid = document.createElement('script');
    stupid.setAttribute('src', script.src);
    document.body.appendChild(stupid);
    stupid.onload = function() {
      loadScripts(scripts);
    };
  } else if (script.inline) {
    // Inline scripts apparently can't be injected, so we need to eval it
    eval(script.inline); // jshint ignore:line
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

  var styles = docFrag.findAll('link');
  var style;
  for (i = 0; i < styles.length; i++) {
    style = styles[i];
    style.parentNode.removeChild(style);
    if (style.href) {
      if (!loadedScripts[style.href]) {
        loadedScripts[style.href] = true;
        var stupid = document.createElement('link');
        stupid.rel = 'stylesheet';
        stupid.href = style.href;
        document.body.appendChild(stupid);
      }
    }
  }

  appContainer.append(docFrag);
  loadScripts(scriptsToLoad);
}
socket.on('navigate', renderState);

window.on('load', function() {
  var scripts = document.findAll('script[src]');
  for (var i = 0; i < scripts.length; i++) {
    loadedScripts[scripts[i].src] = true;
  }
});

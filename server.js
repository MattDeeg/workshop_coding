var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var cookieParser = require('cookie-parser');
var fs = require('fs');
var _ = require('underscore');

app.set('view engine', 'mustache');
app.set('layout', __dirname + '/templates/layout');
app.set('views', __dirname + '/templates');
app.engine('mustache', require('hogan-express'));

var partials = {};
fs.readdir(__dirname + '/templates', function(err, files) {
  var templates = [];
  var tmpl, key;
  for (var i = 0; i < files.length; i++) {
    if (files[i] === 'layout.mustache') {
      continue;
    }
    key = files[i].replace('.mustache', '');
    partials[key] = key;
  }
});
app.set('partials', partials);

app.use('/img', express.static(__dirname + '/img'));
app.use('/fonts', express.static(__dirname + '/fonts'));
app.use(cookieParser());

function render(req, res, template, data) {
  if (req.query._format === 'json') {
    res.writeHead(200);
    res.end(JSON.stringify({template:template, data:data}));
  } else {
    res.render(template, data);
  }
}

app.get('/', function(req, res){
  if (!req.cookies.name) {
    render(req, res, 'login', {});
  } else {
    console.log('cookie', req.cookies);
    render(req, res, 'editor', {
      username: req.cookies.name,
      exercise: socketData.getCurrentData(req.cookies.workshop_id)
    });
  }
});

var ADMIN_SECRET = 'JsWorkshopAdmin';
app.get('/admin', function(req, res) {
  var data = {
    users: socketData.getUsers()
  };
  render(req, res, 'admin', data);
});

var socketData = require('./server/socket_shared');
var adminSocket = require('./server/admin_socket');
var userSocket = require('./server/user_socket');
io.on('connection', function(socket) {
  // Client will send a handshake when it's ready to connect
  socket.on('handshake', function() {
    socket.on('identify', function(existingData, adminSecret) {
      console.log('Identifying: ', existingData, adminSecret);
      console.log(_.pluck(socketData.users, 'id'));
      if (adminSecret === ADMIN_SECRET) {
        console.log('admin identify');
        adminSocket(socket);
      } else {
        console.log('user identify');
        userSocket(socket, existingData);
      }
    });

    socket.emit('identify', socket.id);
  });
});

////////////////////////////////////////////////////////////////////////////////

function fileConcat(fileList, mimeType) {
  var numFiles = fileList.length;
  return function(req, res) {
    var output = new Array(numFiles);
    for (var i = 0; i < numFiles; i++) {
      if (typeof fileList[i] === 'string') {
        output[i] = fs.readFileSync(__dirname + fileList[i]);
      } else if (typeof fileList[i] === 'function') {
        output[i] = fileList[i]();
      }
    }
    res.setHeader('Content-Type', mimeType);
    res.writeHead(200);
    res.end(output.join('\n'));
  };
}

var appJS = [
  '/client/util.js',
  '/node_modules/hogan-express/node_modules/hogan.js/dist/template-3.0.2.min.js',
  '/client/spa.js'
];
app.get('/app.js', fileConcat(appJS, 'text/javascript'));

var appCSS = [
  '/fonts/sourcecodepro/stylesheet.css',
  '/fonts/ubuntumono/stylesheet.css',
  '/client/app.css'
];
app.get('/app.css', fileConcat(appCSS, 'text/css'));

var adminJS = [
  '/node_modules/codemirror/lib/codemirror.js',
  '/node_modules/codemirror/mode/javascript/javascript.js',
  '/client/jshint.config.js',
  '/node_modules/jshint/dist/jshint.js',
  function() { return 'var ADMIN_SECRET="' + ADMIN_SECRET + '";'; },
  '/client/admin.js'
];
app.get('/admin.js', fileConcat(adminJS, 'text/javascript'));

var adminCSS = [
  '/client/admin.css'
];
app.get('/admin.css', fileConcat(adminCSS, 'text/css'));

var editorJS = [
  '/node_modules/codemirror/lib/codemirror.js',
  '/node_modules/codemirror/mode/javascript/javascript.js',
  '/client/jshint.config.js',
  '/node_modules/jshint/dist/jshint.js',
  '/client/editor.js'
];
app.get('/editor.js', fileConcat(editorJS, 'text/javascript'));

var editorCSS = [
  '/node_modules/codemirror/lib/codemirror.css',
  '/node_modules/codemirror/theme/monokai.css',
  '/client/editor.css'
];
app.get('/editor.css', fileConcat(editorCSS, 'text/css'));

var loginJS = [
  '/client/login.js'
];
app.get('/login.js', fileConcat(loginJS, 'text/javascript'));

var loginCSS = [
  '/client/login.css'
];
app.get('/login.css', fileConcat(loginCSS, 'text/css'));

////////////////////////////////////////////////////////////////////////////////

var isFontRegex = /\.(eot|svg|ttf|woff|woff2)$/;
function bindFile(url, file) {
  app.get(url, function(req, res) {
    res.sendFile(file);
  });
}

function loadFonts(basePath) {
  var folderContents = fs.readdirSync(basePath);
  for (var i = 0; i < folderContents.length; i++) {
    var fileName = folderContents[i];
    var filePath = basePath + '/' + fileName;
    if (fs.lstatSync(filePath).isDirectory()) {
      loadFonts(filePath);
      continue;
    }
    if (!fs.existsSync(filePath)) {
      continue;
    }
    if (isFontRegex.test(filePath)) {
      bindFile('/' + fileName, filePath);
    }
  }
}

loadFonts(__dirname + '/fonts');

////////////////////////////////////////////////////////////////////////////////

var Hogan = require('hogan-express/node_modules/hogan.js');
app.get('/templates.js', function (req, res) {
  var templates = [];
  _.each(partials, function(templateName) {
    tmpl = fs.readFileSync(__dirname + '/templates/' + templateName + '.mustache').toString();
    templates.push(JSON.stringify(templateName) + ':new Hogan.Template(' + Hogan.compile(tmpl, {asString: true}) + ')');
  });
  var output =  '';
  output += 'var templates = function() {';
    output += 'var _templates={';
      output += templates.join(',');
    output += '};';
    output += 'function renderWith(template, data, key) {';
      output += 'data["yield-"+key]=true;';
      output += 'var o=template.render(data, _templates);';
      output += 'data["yield-"+key]=false;';
      output += 'return o;';
    output += '}';
    output += 'return function(templateName, data, flat) {';
      output += 'var t=_templates[templateName];';
      output += 'if (flat) { return renderWith(t, data); }';
      output += 'return {';
        output += 'styles:renderWith(t, data, "styles"),';
        output += 'content:renderWith(t, data, "content"),';
        output += 'scripts:renderWith(t, data, "scripts")';
      output += '};';
    output += '};';
  output += '}();';
  res.writeHead(200);
  res.end(output);
 });

////////////////////////////////////////////////////////////////////////////////

http.listen(3000, function(){
  console.log('listening on *:3000');
});

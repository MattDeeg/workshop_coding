var getCompiler = require('./server/compiler.js');

var entryModule = 'entry.js';
var files = {
  'entry.js': 'require("a.js");require("b.js");require("t.mustache")',
  'a.js': 'console.log("a");',
  'b.js': 'console.log("b");',
  't.mustache': 'console.log("HERE");'
};

var compiler = getCompiler({
  rootOutputFolder: __dirname + '/tmp/',
  loaders: [{
      test: /\.mustache$/,
      // Loader needs absolute path to avoid resolveLoaders, but can point directly to files
      loader: __dirname + '/test-loader.js'
    }]
});
// Third parameter should be some unique variable for the output, probably socketID
compiler(files, entryModule, 'asdf', function(err, output) {
  console.log(err || output);
});

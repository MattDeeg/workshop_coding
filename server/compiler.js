var path = require('path');
var webpack = require('webpack');
var rmdir = require('rmdir');
var mkdirp = require('mkdirp');
var fs = require('fs');

module.exports = function(config) {
  if (!path.isAbsolute(config.rootOutputFolder)) {
    config.rootOutputFolder = path.join(__dirname, config.rootOutputFolder);
  }

  function getOutputFolder(folderName) {
    return path.join(config.rootOutputFolder + folderName);
  }

  function readOutput(outputFile) {
    if (fs.existsSync(outputFile)) {
      return fs.readFileSync(outputFile).toString();
    }
  }

  var getLastOutput = function(folderName) {
    var outputFile = getOutputFolder(folderName) + '/output.js';
    var output = readOutput(outputFile);
    if (!output) {
      output = 'Unknown error compiling, file not output'
    }
    return output;
  }

  var build = function(files, entryModule, folderName, callback) {
    var outputFolder = getOutputFolder(folderName);
    // Clear previous data
    rmdir(outputFolder, function() {
      mkdirp.sync(outputFolder);

      var outputFile = outputFolder + '/output.js';

      var aliasMap = {};
      for (var filename in files) {
        var fPath = outputFolder + '/' + filename;
        fs.writeFileSync(fPath, files[filename]);
        aliasMap[filename] = fPath;
      }

      var buildConfig = {
        entry: aliasMap[entryModule],
        output: {
          filename: outputFile,
          library: 'workshop',
          libraryTarget: 'umd'
        },
        resolve: {
          alias: aliasMap
        },
        module: {
          loaders: config.loaders
        }
      };

      function getErrorString(err, stats) {
        var errStr = err;
        if (!err && stats.compilation.errors.length) {
          errStr = stats.compilation.errors.map(function (err) {
            return err.message;
          }).join('\n');
        }

        return errStr || null;
      }

      webpack(buildConfig, function(err, stats) {
        var errStr = getErrorString(err, stats);
        var output = readOutput(outputFile);
        if (!output) {
          errStr = errStr || 'Unknown error compiling, file not output';
        }
        callback(errStr, output);
      });
    });
  };

  return {
    build: build,
    getLastOutput: getLastOutput
  }
};

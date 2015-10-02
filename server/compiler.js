var path = require('path');
var webpack = require('webpack');
var rmdir = require('rmdir');
var mkdirp = require('mkdirp');
var fs = require('fs');

module.exports = function(config) {
  if (!path.isAbsolute(config.rootOutputFolder)) {
    config.rootOutputFolder = path.join(__dirname, config.rootOutputFolder);
  }

  return function(files, entryModule, folderName, callback) {
    var outputFolder = path.join(config.rootOutputFolder + folderName);
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
        callback(getErrorString(err, stats), fs.readFileSync(outputFile).toString());
      });
    });
  };
};

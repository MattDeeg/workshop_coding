var _ = require('underscore');

var toString = Object.prototype.toString;
function stringifyArgs(args) {
  var output = new Array(args.length);
  for (var i = args.length; i--;) {
    var arg = args[i];
    if (Array.isArray(arg)) {
      output[i] = stringifyArgs(arg);
    } else if (typeof arg === 'object' || typeof arg === 'function') {
      output[i] = toString.call(arg);
    } else {
      output[i] = arg;
    }
  }
  return output;
}

function consoleFn() {
  var args = stringifyArgs(arguments);
  this.consoleOutput += '<div class="message">';
  this.consoleOutput += args.length === 1 ? args[0] : ('[' + args.join(', ') + ']');
  this.consoleOutput += '</div>';
}

var WorkshopReporter = function() {
  var boundConsoleFn = _.bind(consoleFn, this);
  this.console = {
    log: boundConsoleFn,
    dir: boundConsoleFn
  };

  this.consoleOutput = '';
  this.testOutput = '';

  this.specMap = {};
  this.suites = [];
  this.numSpecs = 0;
  this.numPassingSpecs = 0;
  this.barHtml = '';
};
WorkshopReporter.prototype = {
  suiteStarted: function(result) {
    this.testOutput += '<div class="suite">' + result.description + ':</div>';
  },

  specStarted: function(spec) {
    this.numSpecs += 1;
  },

  specDone: function(result) {
    var numErrors = result.failedExpectations.length;

    var className = numErrors === 0 ? 'pass' : 'fail';
    if (numErrors === 0) {
      this.numPassingSpecs += 1;
    }
    this.barHtml += '<span class="bar ' + className + '"></span>';

    var i;
    if (numErrors > 0) {
      this.testOutput += '<div class="spec failing">' + result.description + '</div>';
      for (i = 0; i < numErrors; i++) {
       this.testOutput += '<div class="spec-message failing">' + result.failedExpectations[i].message + '</div>';
      }
    } else {
      this.testOutput += '<div class="spec passing">' + result.description + '</div>';
    }
  },

  jasmineDone: function() {
    this.testOutput += '<div class="pb"></div>';
    var testPercent = this.numPassingSpecs / this.numSpecs;
    this.testsStr = this.numPassingSpecs + '/' + this.numSpecs;
    this.testClass = 'poor';
    if (testPercent > 0.85) {
      this.testClass = 'great';
    } else if (testPercent > 0.5) {
      this.testClass = 'good';
    }
  }
};

module.exports = WorkshopReporter;

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
  this.console_ += '<div class="message">';
  this.console_ += args.length === 1 ? args[0] : ('[' + args.join(', ') + ']');
  this.console_ += '</div>';
}

var WorkshopReporter = function(config) {
  config = config || {};
  var self = this;
  this.print_ = config.print || function (str) { self.output += str.toString(); };

  this.started_ = false;
  this.finished_ = false;

  var boundConsoleFn = _.bind(consoleFn, this);
  this.console = {
    log: boundConsoleFn,
    dir: boundConsoleFn
  };

  this.callback_ = config.onComplete || false;
  this.console_ = '';
  this.specMap_ = {};
  this.suites_ = [];
  this.specResults_ = {};
  this.failures_ = [];
  this.numSpecs_ = 0;
  this.numFailingSpecs_ = 0;
  this.includeStackTrace_ = config.includeStackTrace === false ? false : true;
  this.stackFilter_ = config.stackFilter || function(t) { return t; };
};


WorkshopReporter.prototype = {
  reportRunnerStarting: function(runner) {
    this.started_ = true;
    this.startedAt = new Date();
    var suites = runner.topLevelSuites();
    for (var i = 0; i < suites.length; i++) {
      var suite = suites[i];
      this.suites_.push(this.summarize_(suite));
    }
  },

  summarize_: function(suiteOrSpec) {
    var isSuite = suiteOrSpec instanceof jasmine.Suite;

    // We could use a separate object for suite and spec
    var summary = {
      id: suiteOrSpec.id,
      name: suiteOrSpec.description,
      type: isSuite? 'suite' : 'spec',
      suiteNestingLevel: 0,
      children: [],
      errors: []
    };

    if (!isSuite) {
      this.specMap_[summary.name] = summary;
      this.numSpecs_ += 1;
    }

    if (isSuite) {
      var calculateNestingLevel = function(examinedSuite) {
        var nestingLevel = 0;
        while (examinedSuite.parentSuite !== null) {
          nestingLevel += 1;
          examinedSuite = examinedSuite.parentSuite;
        }
        return nestingLevel;
      };

      summary.suiteNestingLevel = calculateNestingLevel(suiteOrSpec);

      var children = suiteOrSpec.children();
      for (var i = 0; i < children.length; i++) {
        summary.children.push(this.summarize_(children[i]));
      }
    }

    return summary;
  },

  // This is heavily influenced by Jasmine's Html/Trivial Reporter
  reportRunnerResults: function(runner) {
    var results = runner.results();

    var specs = runner.specs();
    var specCount = specs.length;

    this.finished_ = true;
    if(this.callback_) { this.callback_(runner); }
  },

  reportSuiteResults: function(suite) {
    // Not used in this context
  },

  reportSpecResults: function(spec) {
    var result = spec.results();
    var msg = '';
    if (!result.skipped && !result.passed()) {
      this.addFailureToFailures_(spec);
    }
  },

  addFailureToFailures_: function(spec) {
    var result = spec.results();
    var failureItem = null;

    var items_length = result.items_.length;
    for (var i = 0; i < items_length; i++) {
      if (result.items_[i].passed_ === false) {
        failureItem = result.items_[i];

        var failure = {
          spec: spec.suite.getFullName() + " " + spec.description,
          message: failureItem.message,
          stackTrace: failureItem.trace.stack
        };

        this.failures_.push(failure);
        if (this.specMap_[spec.description].errors.length === 0) {
          this.numFailingSpecs_ += 1;
        }
        this.specMap_[spec.description].errors.push(failure);
      }
    }
  },

  printRunnerResults_: function(runner){
    var results = runner.results();
    var specs = runner.specs();
  }
};

module.exports = WorkshopReporter;

var _ = require('underscore');
var jasmine = require('jasmine-node');
var chai = require('chai');
var WorkshopReporter = require('./workshop_reporter');
chai.should();

module.exports = function(code, tests, callback) {
  var reporter = new WorkshopReporter({
    onComplete: function() {
      var progressMap = [];
      var output = reporter.console_;
      if (output.length) {
        output += '<hr>';
      }
      var numTests = 0;
      var numTestsPassing = 0;
      _.each(reporter.specMap_, function(spec) {
        var numErrors = spec.errors.length;
        numTests += 1;
        progressMap.push(numErrors === 0);
        if (numErrors > 0) {
          output += '<div class="failing">' + spec.name + '</div>';
          for (var i = 0; i < numErrors; i++) {
           output += '<div class="failing-error">' + spec.errors[i].message + '</div>';
          }
        } else {
          numTestsPassing += 1;
          output += '<div class="passing">' + spec.name + '</div>';
        }
      });
      output += '<div class="pb"></div>';

      var testPercent = numTestsPassing / numTests;
      var testClass = 'poor';
      if (testPercent > 0.85) {
        testClass = 'great';
      } else if (testPercent > 0.5) {
        testClass = 'good';
      }
      callback({
        testsStr: numTestsPassing + '/' + numTests,
        testClass: testClass,
        progressMap: progressMap,
        output: output
      });
    }
  });

  var jasmineEnv = jasmine.getEnv();
  jasmineEnv.currentRunner_ = new jasmine.Runner(jasmineEnv);
  jasmineEnv.addReporter(reporter);

  // Yea yea this is an eval, but whachagonnado?
  try {
    new Function('var __jfn=function(console){' + code + '\n\n' + tests + '};__jfn.apply(this, arguments)')(reporter.console); // jshint ignore:line
  } catch (ex) {
    console.log(ex);
    callback({
      progressMap: [],
      output: ex.message
    }, false);
  }
  jasmineEnv.execute();

};

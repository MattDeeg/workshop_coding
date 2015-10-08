var _ = require('underscore');
var Jasmine = require('jasmine');
var WorkshopReporter = require('./workshop_reporter');

module.exports = function(code, tests, callback) {
  if (!tests) {
    callback(null);
    return;
  }
  var reporter = new WorkshopReporter();

  var jasmine = new Jasmine();
  jasmine.addReporter(reporter);
  jasmine.onComplete(function() {
    callback({
      testsStr: reporter.testsStr,
      testClass: reporter.testClass,
      barHtml: reporter.barHtml,
      output: reporter.consoleOutput + '<hr>' + reporter.testOutput
    });
  });

  // Yea yea this is an eval, but whachagonnado?
  try {
    new Function('var __jfn=function(console){' + code + '\n\n' + tests + '};__jfn.apply(this, arguments)')(reporter.console); // jshint ignore:line
    jasmine.execute();
  } catch (ex) {
    callback({
      testsStr: 'error',
      testClass: 'poor',
      barHtml: '<span class="bar fail"></span>',
      output: '<div class="failing">' + ex.message + '</div>'
    }, false);
  }
};

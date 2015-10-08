module.exports = {
  initial: {
    'entry.js': function() {
      var view = require('view.js');
      var el = document.getElementById('appwrapper');
      view(el);
    },
    'view.js': function() {
      module.exports = function(el) {
        el.innerHTML = 'LOADED';
      };
    },
    'view2.js': function() {
      module.exports = function(el) {
        el.innerHTML = 'LOADED';
      };
    },
    'view3.js': function() {
      module.exports = function(el) {
        el.innerHTML = 'LOADED';
      };
    },
    'view4.js': function() {
      module.exports = function(el) {
        el.innerHTML = 'LOADED';
      };
    },
    'view5.js': function() {
      module.exports = function(el) {
        el.innerHTML = 'LOADED';
      };
    },
    'view.mustache': `<div>
  {{test}}
</div>`
  },
  output: '<div id="appwrapper"></div>'
};

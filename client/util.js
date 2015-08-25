document.find = document.querySelector;
document.findAll = document.querySelectorAll;

DocumentFragment.prototype.find = DocumentFragment.prototype.querySelector;
DocumentFragment.prototype.findAll = DocumentFragment.prototype.querySelectorAll;

(function(ElementPrototype) {
  ElementPrototype.matchesSelector = ElementPrototype.matchesSelector || 
    ElementPrototype.mozMatchesSelector ||
    ElementPrototype.msMatchesSelector ||
    ElementPrototype.oMatchesSelector ||
    ElementPrototype.webkitMatchesSelector ||
    function (selector) {
      var node = this, nodes = (node.parentNode || node.document).querySelectorAll(selector), i = -1;
   
      while (nodes[++i] && nodes[i] != node);
   
      return !!nodes[i];
    };
})(Element.prototype);

Element.prototype.find = Element.prototype.querySelector;
Element.prototype.findAll = Element.prototype.querySelectorAll;
Element.prototype.hasClass = function(classStr) {
  var classes = (classStr || '').split(' ');
  var result = true;
  for (var i = classes.length; i--;) {
    if (classes[i]) {
      result = result && this.classList.contains(classes[i]);
    }
  }
  return result;
};
Element.prototype.addClass = function(classStr) {
  var classes = (classStr || '').split(' ');
  for (var i = classes.length; i--;) {
    if (classes[i]) {
      this.classList.add(classes[i]);
    }
  }
};
Element.prototype.removeClass = function(classStr) {
  var classes = (classStr || '').split(' ');
  for (var i = classes.length; i--;) {
    if (classes[i]) {
      this.classList.remove(classes[i]);
    }
  }
};
Element.prototype.toggleClass = function(classStr, state) {
  if (state === undefined) {
    state = !this.hasClass(classStr);
  }
  this[state ? 'addClass' : 'removeClass'](classStr);
};
Element.prototype.on = function(type, handler) {
  var events = type.split(' ');
  for (var i = events.length; i--;) {
    this.addEventListener(events[i], handler);
  }
};
Element.prototype.off = function(type, handler) {
  var events = type.split(' ');
  for (var i = events.length; i--;) {
    this.removeEventListener(events[i], handler);
  }
};
Element.prototype.on = function(type, handler) {
  var events = type.split(' ');
  for (var i = events.length; i--;) {
    this.addEventListener(events[i], handler);
  }
};
Element.prototype.delegate = function(type, selector, handler) {
  var self = this;
  var delegateHandler = function(evt) {
    var el = evt.target;
    evt.delegateTarget = self;
    while (el && el !== self) {
      if (el.matchesSelector(selector)) {
        evt.currentTarget = el;
        return handler(evt);
      }
      el = el.parentNode;
    }
  };
  this.on(type, delegateHandler);
};
Element.prototype.trigger = function(type, data) {
  var event = document.createEvent('HTMLEvents');
  event.initEvent(type, true, false);
  event.data = data;
  this.dispatchEvent(event);
};
Element.prototype.remove = function() {
  this.parentNode.removeChild(this);
};
Element.prototype.closest = function(className) {
  var target = this;
  while (target !== document.body && !target.classList.contains(className)) {
    target = target.parentNode;
  }
  return target.classList.contains(className) ? target : null;
};
Element.prototype.after = function(contents) {
  if (typeof contents === 'string') {
    contents = stringToFragment(contents);
  }
  var next = this.nextElementSibling;
  if (next) {
    next.parentNode.insertBefore(contents, next);
  } else {
    this.parentNode.appendChild(contents);
  }
};
Element.prototype.empty = function() {
  while (this.firstChild) {
    this.removeChild(this.firstChild);
  }
};
Element.prototype.append = function(el) {
  if (typeof el === 'string') {
    el = stringToFragment(el);
  }
  this.appendChild(el);
};
Element.prototype.prepend = function(el) {
  if (typeof el === 'string') {
    el = stringToFragment(el);
  }
  this.insertBefore(el, this.firstChild);
};
Element.prototype.show = function() {
  this.style.display = '';
};
Element.prototype.hide = function() {
  this.style.display = 'none';
};
NodeList.prototype.css = function(property, value) {
  for (var i = this.length; i--;) {
    this[i].style[property] = value;
  }
};
NodeList.prototype.on = function(type, handler) {
  for (var i = this.length; i--;) {
    this[i].on(type, handler);
  }
};
NodeList.prototype.off = function(type, handler) {
  for (var i = this.length; i--;) {
    this[i].off(type, handler);
  }
};
NodeList.prototype.remove = function() {
  for (var i = this.length; i--;) {
    this[i].remove();
  }
};
NodeList.prototype.addClass = function(classStr) {
  for (var i = this.length; i--;) {
    this[i].addClass(classStr);
  }
};
NodeList.prototype.removeClass = function(classStr) {
  for (var i = this.length; i--;) {
    this[i].removeClass(classStr);
  }
};
NodeList.prototype.show = function() {
  for (var i = this.length; i--;) {
    this[i].show();
  }
};
NodeList.prototype.hide = function() {
  for (var i = this.length; i--;) {
    this[i].hide();
  }
};

window.trigger = document.trigger = Element.prototype.trigger;
window.delegate = document.delegate = Element.prototype.delegate;
window.on = document.on = Element.prototype.on;
window.off = document.off = Element.prototype.off;

var ajax = function(cfg) {
  if (!cfg || !cfg.url) {
    return;
  }
  var request = new XMLHttpRequest();
  request.open(cfg.method || 'GET', cfg.url, true);
  if (cfg.method === 'POST') {
    request.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
  }

  if (cfg.success) {
    request.onload = function(response) {
      cfg.success(response.target.responseText);
    };
  }
  if (cfg.error) {
    request.onerror = cfg.error;
  }

  if (typeof cfg.data === 'object') {
    var keys = Object.keys(cfg.data);
    var dataArr = [];
    for (var i = 0; i < keys.length; i++) {
      dataArr[i] = keys[i] + '=' + encodeURIComponent(cfg.data[keys[i]]);
    }
    cfg.data = dataArr.join('&');
  }
  request.send(cfg.data);
};

var clone = function(obj) {
  var target = {};
  for (var i in obj) {
    if (obj.hasOwnProperty(i)) {
      target[i] = obj[i];
    }
  }
  return target;
};

function scrollTo(element, to, duration) {
  if (duration < 0) return;
  var difference = to - element.scrollTop;
  var perTick = difference / duration * 10;

  setTimeout(function() {
    element.scrollTop = element.scrollTop + perTick;
    if (element.scrollTop == to) return;
    scrollTo(element, to, duration - 10);
  }, 10);
}

function stringToFragment(contents) {
  var frag = document.createDocumentFragment();
  var div = document.createElement('div');
  div.innerHTML = contents;
  while (div.firstChild) {
    frag.appendChild(div.firstChild);
  }
  return frag;
}

var deepExtend = function(t, s) {
  for (var n in s)
    if (s[n] instanceof Array) {
      t[n] = s[n].slice();
    }
    else if ((t[n] instanceof Object) && !(t[n] instanceof Element) && (typeof t[n] !== 'function')) {
      t[n] = extend(t[n], s[n]);
    }
    else if (s[n] !== undefined && s[n] !== null) {
      t[n] = s[n];
    }
  return t;
};
var extend = function(def, config) {
  var result = deepExtend({}, def);
  result = deepExtend(result, config);

  return result;
};

var repeatChar = function(c, times) {
  return Array(times+1).join(c);
};

var randInt = function (min, max) {
  return Math.floor(Math.random() * (max - min) + 1) + min;
};

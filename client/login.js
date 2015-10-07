var socket = io();
function getHexStr(l) {
  l = Math.max(0, l);
  var o = '';
  for (var i = l; i--;) {
    o += Math.floor(Math.random() * 16 + 1).toString(16);
  }
  return o;
}

function getGuid() {
  return [
    getHexStr(8), getHexStr(4), getHexStr(4), getHexStr(4), getHexStr(16)
  ].join('-');
}

document.delegate('keydown', '#name', function(e) {
  if (e.which === 13) {
    e.preventDefault();
    var username = e.target.textContent;
    // Set cookie to allow for refreshes
    document.cookie = 'name="' + username + '"';
    // Guid is unique enough for our purposes, but add username for a touch of entropy
    document.cookie = 'workshop_id="' + username + getGuid() + '"';
    socket.emit('login', username);
  }
});

var scrollTimer;
document.delegate('mouseup', '.js-file-nav-scroll', function(e) {
  clearTimeout(scrollTimer);
});

document.delegate('mousedown', '.js-file-nav-scroll', function(e) {
  var scrollBy = parseInt(e.target.getAttribute('data-scrollby'), 10);
  var scrollable = document.find('.js-file-nav-scrollable');
  scrollable.scrollLeft += scrollBy;
  scrollTimer = setTimeout(function() {
    scrollTimer = setInterval(function() {
      scrollable.scrollLeft += scrollBy;
    }, 50);
  }, 150);
});


document.on('keydown', function(e) {
  if ((e.ctrlKey || e.metaKey) && e.which > 47 && e.which < 58) {
    var numFiles = files.length;
    var index = (e.which - 49 + numFiles) % numFiles;
    var file = files[index];
    document.find('.js-file-tab[data-file-id="' + file.name + '"]').trigger('click')
  }
});

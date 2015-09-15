/* global require */
var companion = (function(module, undefined) {
  "use strict";
  var fs, vm, path, load, compose, explicitParent, getParent, instance;

  fs = require('fs');
  vm = require('vm');
  path = require('path');

  compose = (parent) => {
    explicitParent = parent;
    return instance;
  };

  getParent = () => {
    return explicitParent || module.parent.filename;
  };

  load = (filename, context, callback) => {
    var poly = typeof context === 'function';
    filename = path.resolve(path.dirname(getParent()), filename);
    callback = poly ? context : callback;
    context = poly ? {} : (context || {});
    if (callback) {
      fs.readFile(filename, function(err, data) {
        if (!err) {
          vm.runInNewContext(data, context, filename);
        }
        callback(err, context);
      });
    } else {
      vm.runInNewContext(fs.readFileSync(filename), context, filename);
    }
    return context;
  };

  instance = {
    compose: compose,
    require: load
  };

  return instance;

}());

module.exports = companion;

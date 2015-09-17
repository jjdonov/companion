/* global require */
var companion = (function(module, undefined) {
  "use strict";
  var fs, vm, path, explicitParent, instance, walk;

  fs = require('fs');
  vm = require('vm');
  path = require('path');
  walk = require('walk');

  function compose(parent) {
    explicitParent = parent;
    return instance;
  }

  function getParent() {
    return explicitParent || module.parent.filename;
  }

  function load(name, context, callback) {
    var poly = typeof context === 'function';
    name = path.resolve(path.dirname(getParent()), name);
    callback = poly ? context : callback;
    context = poly ? {} : (context || {});
    if (fs.lstatSync(name).isDirectory()) {
      return loadModule(name, context, callback);
    }
    return loadFile(name, context, callback);
  }

  function loadFile(filename, context, callback) {
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
  }

  function loadModule(moduleName, context, callback) {
    var scripts = [];
    var options = {
      followLinks: false,
      filters: [
        'PlatformLocalization',
        'TypeExtensionD1',
        'xsd'
      ],
      listeners: {
        file: (root, fileStats, next) => {
          if (fileStats.name.endsWith('.js')) {
            var resolved = path.resolve(root, fileStats.name);
            var s = fs.readFileSync(resolved);
            scripts.push(s);
          }
          next();
        },
        errors: (root, nodeStatsArray, next) => {
          //TODO
          next();
        }
      },

    };
    walk.walkSync(moduleName, options);
    if (!scripts.length) {
      throw new Error('Did not find any scripts in ' + moduleName);
    }
    var uniScript = scripts.join('\n');
    vm.runInNewContext(uniScript, context, moduleName);
    return context;
  }

  instance = {
    compose: compose,
    require: load
  };

  return instance;

}());

module.exports = companion;

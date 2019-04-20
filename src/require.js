/**
 * @param {Object} _this  the global variable
 * @param {String}  basedir basedir of require
 */
(function(_this, basedir) {
var exports = {};

var createScript = function(src, _async) {
  if (_async === undefined) {
    _async = true;
  }
  var script = document.createElement('script');
  script.src = src;
  script.async = _async ? true : false;
  return script;
}

/**
 * 
 * @param {String} str 
 * @return {String}
 */
var stringRtrim = function(str) {
  if (!str) {
    return '';
  }
  return str.replace(/\/$/, '');
}

/**
 * @param {String} path
 * @return {String}
 */
var cleanPath = function(path) {
  if (!path) path = '';
  return path.replace(/(\/){2,10}/g, '');
};

/**
 * @param {...String}
 * @return {String}
 */
var pathJoin = function() {
  var paths = Array.prototype.splice.apply(arguments, [0]);
  var result = [];
  for (var i = 0; i < paths.length; i++) {
    var path = paths[i];
    result.push(stringRtrim(path));
  }
  
  return cleanPath(result.join('/'));
};

/**
 * 
 * @param {String} current 
 * @param {String} relative 
 * @return {String}
 */
var getPathByRelativePath = function(current, relative) {
  if (relative.substr(0, 1) === '/') {
    return relative;
  }

  var currentAsArray = current.split('/');
  var relativeAsArray = relative.split('/');

  for (var i = 0; i < relativeAsArray.length; i++) {
    var path = relativeAsArray[i];
    var len = currentAsArray.length;

    if (path === '..') {
      currentAsArray = currentAsArray.slice(0, len - 1);
    } else {
      currentAsArray.push(path);
    }
  }

  if (currentAsArray.length === 0) {
    return '';
  }

  return currentAsArray.join('/');
};

/**
 * 
 * @param {String} id 
 * @param {String} basedir 
 */
var getModulePath = function(id, basedir) {
  var absolutePathRegexp = /^\//;
  var relativePathRegexp = /(\.\.\/?){1,30}/;
  var currentPathRegexp = /^\.\//;

  if (id.match(absolutePathRegexp)) {
    return id;
  }

  if (id.match(relativePathRegexp)) {
    return getPathByRelativePath(basedir, id);
  }

  if (id.match(currentPathRegexp)) {
    return pathJoin(basedir, id.substr(2)); 
  }

  return pathJoin(basedir, id);
}

/**
 * @param {String} name 
 */
var getModuleName = function(name) {
  return name.split('/').filter(function(item) {
    return item;
  }).pop();
}

/**
 * 
 * @param {String} id 
 * @param {Function} onLoad 
 * @param {Function} onError 
 */
var loadModule = function(id, onLoad, onError) {
  var script = createScript(getModulePath(id + '.js'), true);
  script.addEventListener('load', onLoad); 
  script.addEventListener('error', function() {
    console.warn("module: '" + id + "', load error");
    if (typeof onError === 'function') {
      onError();
    }
  });
  _this.document.body.append(script);
};

/**
 * 
 * @param {String} id 
 * @param {<Array>String?} dependncies 
 * @param {Function|Object} factory 
 */
var define = function(id, dependncies, factory) {
  if (!id) throw new TypeError('define need an id.');
  if (typeof dependncies === 'function') {
    factory = dependncies;
    exports[id] = factory();
    return;
  }


  if (typeof dependncies === 'string') {
    return loadModule(dependncies, function() {
      dependncies = getModulePath(dependncies);
      exports[id] = factory(exports[getModuleName(dependncies)]);
    });
  }

  var dependncieCount = dependncies.length;
  var loadedDependncieCount = 0;

  if (dependncieCount === 0) {
    return exports[id] = factory();
  }

  if (dependncieCount === 1) {
    var dep = getModulePath(dependncies[0]);
    return loadModule(dep, function() {
      exports[id] = factory(exports[getModuleName(dep)]);
    });
  }

  for (var i = 0; i < dependncies.length; i++) {
    var dependncie = dependncies[i];
    loadModule(dependncie, function() {
      dependncie = getModulePath(dependncie);
      if (loadedDependncieCount !== dependncieCount) {
        loadedDependncieCount += 1;
      } else {
         exports[id] = factory.call(undefined, dependncies.map(dep => exports[getModuleName(dep)])); 
      }
    });
  }
};

_this.define = define;
console.log(exports);
})(this, '/src');


define('main', ['/tests/test'], function(test) {
  test();
  return function() {
    test();
    alert('main');
  }
})
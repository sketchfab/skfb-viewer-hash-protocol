var BackboneEvents = require('backbone-events-standalone');

var METADATA_SEPARATOR = ':';
var MESSAGE_SEPARATOR = ';';
var ARRAY_SEPARATOR = ',';
var DATA_SEPARATOR = '=';


var _parseMessageData = function(dataString) {

  var dataObject;

  if (dataString.indexOf(DATA_SEPARATOR) > -1) {
    var keyVal = dataString.split(DATA_SEPARATOR);
    if (keyVal[1].indexOf(ARRAY_SEPARATOR) > -1) {
      keyVal[1] = keyVal[1].split(ARRAY_SEPARATOR);
    }
    dataObject = {};
    dataObject[keyVal[0]] = keyVal[1];
  } else if (dataString.indexOf(ARRAY_SEPARATOR) > -1) {
    dataObject = dataString.split(ARRAY_SEPARATOR);
  } else {
    dataObject = dataString;
  }

  return dataObject;
};

var _parseHash = function(str, device) {

  var hash = str;

  if (hash.indexOf('#') > -1) {
    hash = hash.slice(1);
  }

  var messages = hash.split(MESSAGE_SEPARATOR);
  var messageObjects = [];

  for (var k in messages) {
    var aMessage = new ViewerHashMessage(_parseMessage(messages[k]));
    if ((!aMessage.from || aMessage.from !== device) && aMessage.data) {
      messageObjects.push(aMessage);
    }
  }

  return messageObjects;

};

var _parseMessage = function(str) {

  var messageString = str;
  var message = {};

  if (messageString.indexOf('#') > -1) {
    messageString = messageString.slice(1);
  }

  var parts = messageString.split(METADATA_SEPARATOR);

  if (parts.length === 1) {
    message.data = parts[0];
  } else if (parts.length === 2) {
    message.from = parts[0].toUpperCase();
    message.data = parts[1];
  } else if (parts.length === 3) {
    message.from = parts[0].toUpperCase();
    message.to = parts[1].toUpperCase();
    message.data = parts[2];
  }

  if (message.data) {
    message.stringData = message.data;
    message.data = _parseMessageData(message.data);
  }

  message._originalString = (str + MESSAGE_SEPARATOR);

  return message;

};

var ViewerHashMessage = function ViewerHashMessage(opt) {

  var msg = opt;

  if (typeof opt === 'string') {
    msg = _parseMessage(opt);
  }

  this._msg = msg;
  this.from = msg.from;
  this.to = msg.to;
  this.data = msg.data;

};

ViewerHashMessage.prototype._getStringifiedData = function _getStringifiedData() {
  var d = '';

  if (typeof this.data === 'string') {
    return this.data;
  } else if (Array.isArray(this.data)) {
    return this.data.join(',');
  } else if (typeof this.data === 'object') {
    for (var k in this.data) {

      var rData;

      if (typeof this.data[k] === 'string') {
        rData = this.data[k];
      } else if (Array.isArray(this.data[k])) {
        rData = this.data[k].join(',');
      }

      d += k + DATA_SEPARATOR + rData;
    }
  }

  return d;
};

ViewerHashMessage.prototype.toString = function toString() {
  var str = '';
  if (this.from) {
    str += this.from + METADATA_SEPARATOR;
  }
  if (this.to) {
    str += this.to + METADATA_SEPARATOR;
  }
  str += this._getStringifiedData() + MESSAGE_SEPARATOR;
  return str;
};

var ViewerHashAPI = function ViewerHashAPI(opt) {

  opt = opt || {};

  if (!opt.device) {
    throw new Error('ViewerHashAPI options need to contain the "device" identifier property');
  }
  if (opt.listen) {
    this.listen();
  }

  this.device = opt.device;

};

ViewerHashAPI.prototype.appendToHash = function(m, target) {
  if (m instanceof ViewerHashMessage) {
    m = m.toString();
  }

  if (typeof m !== 'string') {
    return;
  }

  target = _ensureHashTarget(target);

  if (target.location.hash.indexOf(m) === -1)
    target.location.hash = target.location.hash + m;
};

ViewerHashAPI.prototype.removeFromHash = function(m, target) {
  if (!(m instanceof ViewerHashMessage)) {
    throw new Error('Please supply an instance of ViewerHashMessage');
  }

  target = _ensureHashTarget(target);

  var hash = target.location.hash;
  if (m._msg && m._msg._originalString) {
    hash = hash.replace(m._msg._originalString, '');
  } else {
    hash = hash.replace(m.toString(), '');
  }

  target.location.hash = hash;

}

var _ensureHashTarget = function(target) {

  target = target || window;

  if (target && target.tagName && target.tagName.toLowerCase() === 'iframe') {
    target = target.contentWindow;
  }

  if (!target.addEventListener) {
    throw new Error('Could not bind an event to supplied target. Please supply an instance of window or an iframe.');
  }

  return target;

}

ViewerHashAPI.prototype.listen = function(target) {

  target = _ensureHashTarget(target);
  return target.addEventListener('hashchange', this._onHashChange.bind(this, target), false);

};

ViewerHashAPI.prototype._onHashChange = function(target) {

  var messages = this.getMessages(target.location.hash);

  (messages.messages || []).forEach(function(m) {

    if (m && m.data && !Array.isArray(m)) {
      var triggerKey = m.data;
      if (typeof m.data === 'object') {
        triggerKey = Object.keys(m.data)[0];
      }
      this.trigger('message:' + triggerKey, m);
    }
    this.trigger('message', m);

  }.bind(this));
};

ViewerHashAPI.prototype.getMessages = function(hash) {
  var messages = _parseHash(hash, this.device);
  var newHash = hash;

  for (var k in messages) {
    if (messages[k]._msg && messages[k]._msg._originalString) {
      newHash = newHash.replace(messages[k]._msg._originalString, '');
    } else {
      newHash = newHash.replace(messages[k].toString(), '');
    }
  }

  return {
    messages: messages,
    hash: newHash
  };
};

ViewerHashAPI.prototype.createMessage = function(data) {
  data = data || {};
  data.from = this.device;
  return new ViewerHashMessage(data);
};

BackboneEvents.mixin(ViewerHashAPI.prototype);
ViewerHashMessage.prototype.removeFromHash = function() {
  ViewerHashAPI.prototype.removeFromHash.call(this, this);
};
ViewerHashMessage.prototype.appendToHash = function() {
  ViewerHashAPI.prototype.appendToHash.call(this, this);
};

module.exports = ViewerHashAPI;

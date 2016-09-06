var BackboneEvents = require('backbone-events-standalone');

var METADATA_SEPARATOR = ':';
var MESSAGE_SEPARATOR = ';';
var ARRAY_SEPARATOR = ',';
var DATA_SEPARATOR = '=';
var QS_SEPARATOR = '&';

var _parseMessageData = function(dataString) {

  dataString = dataString || '';
  dataString = decodeURIComponent(dataString);

  var dataObject = {};
  var dataParts = dataString.split(QS_SEPARATOR);

  dataParts.forEach(function (dataPart) {
    if (dataPart.indexOf(DATA_SEPARATOR) > -1) {
      var keyVal = dataPart.split(DATA_SEPARATOR);
      dataObject[keyVal[0]] = keyVal[1];
    } else if (dataPart.indexOf(ARRAY_SEPARATOR) > -1) {
      dataObject = dataPart.split(ARRAY_SEPARATOR);
    } else {
      dataObject = dataPart;
    }
  }.bind(this));

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
  this.data = _decodeData(msg.data);

};

var _ensureSafeData = function _ensureSafeData (data) {

  if (typeof data === 'string') {
    data = encodeURIComponent(data);
  } else if (Array.isArray(data)) {
    data = data.map(encodeURIComponent);
  } else if ((typeof data).toLowerCase() === 'object') {
    Object.keys(data).forEach(function (key) {
      if (typeof data[key] === 'string') {
        data[key] = encodeURIComponent(data[key]);
      } else if (Array.isArray(data[key])) {
        data[key] = data[key].map(encodeURIComponent)
      }
    }.bind(this))
  }

  return data;

};

var _decodeData = function _decodeData (data) {

  if (typeof data === 'string') {
    data = decodeURIComponent(data);
  } else if (Array.isArray(data)) {
    data = data.map(decodeURIComponent);
  } else if ((typeof data).toLowerCase() === 'object') {
    Object.keys(data).forEach(function (key) {
      if (typeof data[key] === 'string') {
        data[key] = decodeURIComponent(data[key]);
      } else if (Array.isArray(data[key])) {
        data[key] = data[key].map(decodeURIComponent)
      }
    }.bind(this))
  }

  return data;

};

ViewerHashMessage.prototype._getStringifiedData = function _getStringifiedData() {
  var d = '';

  if (typeof this.data === 'string') {
    return encodeURIComponent( this.data );
  } else if (Array.isArray(this.data)) {
    return this.data.map(encodeURIComponent).join(',');
  } else if (typeof this.data === 'object') {
    for (var k in this.data) {

      var rData;

      if (typeof this.data[k] === 'string') {
        rData = encodeURIComponent(this.data[k]);
      } else if (Array.isArray(this.data[k])) {
        rData = this.data[k].map(encodeURIComponent).join(',');
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
    this.listen(opt.listen);
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


  target = (target === true ? window : target) || window;

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

  var getMessages = this.getMessages(target.location.hash);
  var messages = getMessages.messages || [];

  messages.forEach(function(m) {

    if( m ) {

      if( m.data && !Array.isArray(m) ) {
        var triggerKey = m.data;

        if (typeof m.data === 'object') {

          var triggerKeys = Object.keys(m.data);
          if (m.data._key) {
            triggerKey = m.data._key;
          } else {
            triggerKey = triggerKeys[0];
          }

        }
        if ( triggerKey ) {
          this.trigger('message:' + triggerKey, m);
        }
      } else {
        this.trigger('message', m);
      }
    }
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

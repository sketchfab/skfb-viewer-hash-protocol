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
    if (!aMessage.from || aMessage.from !== device) {
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
  this.data = msg.data

};

ViewerHashMessage.prototype._getStringifiedData = function _getStringifiedData() {
  var d = '';

  if (typeof this.data === 'string') {
    return this.data;
  } else if (Array.isArray(this.data)) {
    return this.data.join(',')
  } else if (typeof this.data === 'object') {
    for (var k in this.data) {

      var rData;

      if (typeof this.data[k] === 'string') {
        rData = this.data[k]
      } else if (Array.isArray(this.data[k])) {
        rData = this.data[k].join(',');
      }

      d += k + DATA_SEPARATOR + rData
    }
  }

  return d;
};

ViewerHashMessage.prototype.toString = function toString() {
  return (this.from || '') + METADATA_SEPARATOR + (this.to || '') + METADATA_SEPARATOR + this._getStringifiedData() + MESSAGE_SEPARATOR;
};

var ViewerHashAPI = function ViewerHashAPI(opt) {

  opt = opt || {};

  if (!opt.device) {
    throw new Error('ViewerHasAPI options need to contain the "device" identifier property');
  }

  this.device = opt.device;

};

ViewerHashAPI.prototype.getMessages = function(hash, excludeSelf) {
  return _parseHash(hash, this.device);
}

ViewerHashAPI.prototype.prepare = function prepare(message) {

  if (!(message instanceof ViewerHashMessage)) {
    msg = new ViewerHashMessage(message);
  }

  if (!msg.from) {
    msg.from = this.device;
  }

  return msg;

}


module.exports = ViewerHashAPI;

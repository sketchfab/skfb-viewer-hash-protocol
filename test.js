var API = require('./index.js');

var api = new API({
  device: 'TAGL'
});

console.log('———');
console.log('reading : ', '#VWR:start;ergerg\n');
console.log('Result : ');
console.log(api.getMessages('#VWR:start;ergerg'));

console.log('———');
console.log('reading : ', '#APP:models=1,2,3;\n');
console.log('Result : ');
console.log(api.getMessages('#APP:models=1,2,3;'));

console.log('———');
console.log('reading : ', '#APP:models=1,2,3;\n');
console.log('Result : ');
console.log(api.getMessages('#APP:models=1,2,3&tagl=24;'));

console.log('———');
console.log('reading : ', '#APP:VWR:selected=1;\n');
console.log('Result : ');
console.log(api.getMessages('#APP:VWR:selected=1;'));

console.log('———');
console.log('reading : ', '#VWR:APP:selected=1;VWR:WEB:selected=2;\n');
console.log('Result : ');
console.log(api.getMessages('#VWR:APP:selected=1;VWR:WEB:selected=2;'));

var m = api.createMessage({
  to: 'VWR',
  data: {
    'models': [1, 2, 3],
    'unAutreTruc': 'l&&t'
  }
});

console.log('———');
console.log('Stringifying : ');
console.log(m);
console.log('Result :');
console.log(m.toString());

var API = require('./index.js');

var api = new API({
  device: 'APP'
});

console.log('———');
console.log('reading : ', '#VWR:start\n');
console.log('Result : ');
console.log(api.getMessages('#VWR:start'));

console.log('———');
console.log('reading : ', '#APP:models=1,2,3\n');
console.log('Result : ');
console.log(api.getMessages('#APP:models=1,2,3'));

console.log('———');
console.log('reading : ', '#APP:VWR:selected=1\n');
console.log('Result : ');
console.log(api.getMessages('#APP:VWR:selected=1'));

console.log('———');
console.log('reading : ', '#VWR:APP:selected=1;VWR:WEB:selected=2\n');
console.log('Result : ');
console.log(api.getMessages('#VWR:APP:selected=1;VWR:WEB:selected=2'));

var m = api.prepare({
  to: 'VWR',
  data: {
    'models': [1, 2, 3]
  }
});

console.log('———');
console.log('Stringifying : ');
console.log(m);
console.log('Result :');
console.log(m.toString());

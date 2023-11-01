# Slanger
## web dev simplified

Author: Wael Houry - ⌐■‿■

![Build Status](https://travis-ci.org/joemccann/dillinger.svg?branch=master)

[![buy me a coffe](https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png)](https://www.buymeacoffee.com/waelhoury)

Slanger is a lightweight JS library that simplifies writing JavaScript.

- Free 🤑
- Easy to use 👶
- ✨Magic ✨

## Features

- $ and $$ just like jquery
- .on() and .css() methods
- Custom HTML tags
- simplified Promises
- more to come ...



## Tech

Slanger is based on and inspired by:
- [jQuery] - duh
- [Bling]
- [Promise js]
- [Personal touch and modifications] 


And of course Slanger itself is open source 

## Installation
method 1:

Simply insert this script into the head of your project

```sh
<script src="https://unpkg.com/slangerjs"></script>
```

method 2:

```sh
npm i slangerjs
```

## Features
- Single element query ```$('class_name')```
- Multiple elements query ```$$('class_name')```
- ```.on('event_name', () => {})``` support
- ```.css({})``` support
- Full form deserialization with support to nester attributes ```$('form').serializeJson()```
- Callbacks are attached using the .then(callback) method. They will be called when the promise is resolved.
```sh
var p = asyncfoo(a, b, c);

p.then(function(error, result) {
    if (error) return;
    alert(result);
});
```
- Forget about centrilizing sections with this custom HTML element```<flex-center></flex-center>```
- More features are coming soon like new custom element called ```<copyToClipboard>``` which basically allows you to copy any item inside of it to clipboard
  
## License

MIT


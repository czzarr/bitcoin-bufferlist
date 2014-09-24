# bitcoin-bufferlist *(Bitcoin BufferList)*

**A Node.js Buffer Writer and Reader for Bitcoin apps**

**bitcoin-bufferlist** is a storage object for collections of Node Buffers, exposing them with the main Buffer readable API. 

The original buffers are kept intact and copies are only done as necessary. Any reads that require the use of a single original buffer will return a slice of that buffer only (which references the same memory as the original buffer). Reads that span buffers perform concatenation as required and return the results transparently.

This module is heavily inspired from
[rvagg/bl](http://github.com/rvagg/bl) but without the callback and
streaming interface, and with added Bitcoin-related functions
such as `writeUInt8/16LE/32LE/64LE`, `readUInt64LE`, and
`write/readVarInt` 

```js
const BufferList = require('bitcoin-bufferlist')

var bl = new BufferList()
bl.append(new Buffer('abcd'))
bl.append(new Buffer('efg'))
bl.append(new Buffer('j'))
bl.append(new Buffer([ 0x3, 0x4 ]))
bl.append('hi')                     // bl will also accept & convert Strings
bl.append('00aa', 'hex')                     // bl will also accept & convert hex Strings
bl.append(0xff)                     // bl will also accept & convert Numbers
bl.append([118, 169])  // bl will also accept & convert Arrays

console.log(bl.length) // 12

console.log(bl.slice(0, 10).toString('ascii')) // 'abcdefghij'
console.log(bl.slice(3, 10).toString('ascii')) // 'defghij'
console.log(bl.slice(3, 6).toString('ascii'))  // 'def'
console.log(bl.slice(3, 8).toString('ascii'))  // 'defgh'
console.log(bl.slice(5, 10).toString('ascii')) // 'fghij'

// or just use toString!
console.log(bl.toString())               // 'abcdefghij\u0003\u0004'
console.log(bl.toString('ascii', 3, 8))  // 'defgh'
console.log(bl.toString('ascii', 5, 10)) // 'fghij'

// other standard Buffer readables
console.log(bl.readUInt16LE(10)) // 0x0403
```

## API

  * <a href="#ctor"><code><b>new BufferList([s])</b></code></a>
  * <a href="#length"><code>bl.<b>length</b></code></a>
  * <a href="#append"><code>bl.<b>append(buffer)</b></code></a>
  * <a href="#writePad"><code>bl.<b>writePad(string, length, encoding)</b></code></a>
  * <a href="#get"><code>bl.<b>get(index)</b></code></a>
  * <a href="#slice"><code>bl.<b>slice([ start[, end ] ])</b></code></a>
  * <a href="#copy"><code>bl.<b>copy(dest, [ destStart, [ srcStart [, srcEnd ] ] ])</b></code></a>
  * <a href="#toString"><code>bl.<b>toString([encoding, [ start, [ end ]]])</b></code></a>
  * <a href="#readXX">
    <code>bl.<b>readUInt64LE()</b></code>,
    <code>bl.<b>readUInt64BE()</b></code>,
<code>bl.<b>readUInt32LE()</b></code>,
<code>bl.<b>readUInt32BE()</b></code>,
<code>bl.<b>readUInt16LE()</b></code>,
<code>bl.<b>readUInt16BE()</b></code>,
<code>bl.<b>readUInt8()</b></code></a>,
<code>bl.<b>readVarInt(offset)</b></code></a>,
  * <a href="#writeXX">
    <code>bl.<b>writeUInt64LE()</b></code>,
    <code>bl.<b>writeUInt64BE()</b></code>,
<code>bl.<b>writeUInt32LE()</b></code>,
<code>bl.<b>writeUInt32BE()</b></code>,
<code>bl.<b>writeUInt16LE()</b></code>,
<code>bl.<b>writeUInt16BE()</b></code>,
<code>bl.<b>writeUInt8()</b></code></a>,
<code>bl.<b>writeVarInt(n)</b></code></a>,

--------------------------------------------------------
<a name="ctor"></a>
### new BufferList([ callback | buffer | buffer array ])
The constructor takes an optional callback, if supplied, the callback will be called with an error argument followed by a reference to the **bl** instance, when `bl.end()` is called (i.e. from a piped stream). This is a convenient method of collecting the entire contents of a stream, particularly when the stream is *chunky*, such as a network stream.

Normally, no arguments are required for the constructor, but you can initialise the list by passing in a single `Buffer` object or an array of `Buffer` object.

`new` is not strictly required, if you don't instantiate a new object, it will be done automatically for you so you can create a new instance simply with:

```js
var bl = require('bl')
var myinstance = bl()

// equivilant to:

var BufferList = require('bl')
var myinstance = new BufferList()
```

--------------------------------------------------------
<a name="length"></a>
### bl.length
Get the length of the list in bytes. This is the sum of the lengths of all of the buffers contained in the list, minus any initial offset for a semi-consumed buffer at the beginning. Should accurately represent the total number of bytes that can be read from the list.

--------------------------------------------------------
<a name="append"></a>
### bl.append(buffer)
`append(buffer)` adds an additional buffer or BufferList to the internal list.

--------------------------------------------------------
<a name="writePad"></a>
### bl.writePad(string, length, encoding)
`writePad(string, length, encoding)` writes a string padded with zeros
so that the total length equals length

--------------------------------------------------------
<a name="get"></a>
### bl.get(index)
`get()` will return the byte at the specified index.

--------------------------------------------------------
<a name="slice"></a>
### bl.slice([ start, [ end ] ])
`slice()` returns a new `Buffer` object containing the bytes within the range specified. Both `start` and `end` are optional and will default to the beginning and end of the list respectively.

If the requested range spans a single internal buffer then a slice of that buffer will be returned which shares the original memory range of that Buffer. If the range spans multiple buffers then copy operations will likely occur to give you a uniform Buffer.

--------------------------------------------------------
<a name="copy"></a>
### bl.copy(dest, [ destStart, [ srcStart [, srcEnd ] ] ])
`copy()` copies the content of the list in the `dest` buffer, starting from `destStart` and containing the bytes within the range specified with `srcStart` to `srcEnd`. `destStart`, `start` and `end` are optional and will default to the beginning of the `dest` buffer, and the beginning and end of the list respectively.

--------------------------------------------------------
<a name="toString"></a>
### bl.toString([encoding, [ start, [ end ]]])
`toString()` will return a string representation of the buffer. The optional `start` and `end` arguments are passed on to `slice()`, while the `encoding` is passed on to `toString()` of the resulting Buffer. See the [Buffer#toString()](http://nodejs.org/docs/latest/api/buffer.html#buffer_buf_tostring_encoding_start_end) documentation for more information.

--------------------------------------------------------
<a name="readXX"></a>
### bl.readUInt64LE(), bl.readUInt64BE(), bl.readUInt32LE(), bl.readUInt32BE() bl.readUInt16LE(), bl.readUInt16BE(), bl.readUInt8()

All of the standard byte-reading methods of the `Buffer` interface are implemented and will operate across internal Buffer boundaries transparently.

See the <b><code>[Buffer](http://nodejs.org/docs/latest/api/buffer.html)</code></b> documentation for how these work.

--------------------------------------------------------
<a name="writeXX"></a>
### bl.writeUInt64LE(), bl.writeUInt64BE(), bl.writeUInt32LE(), bl.writeUInt32BE(), bl.writeIntU16LE(), bl.writeUInt16BE(), bl.writeUInt8()

All of the standard byte-writing methods of the `Buffer`. At the moment you cannot set an offset, and can only append the bytes.

See the <b><code>[Buffer](http://nodejs.org/docs/latest/api/buffer.html)</code></b> documentation for how these work.

--------------------------------------------------------
### bl.readVarInt(offset)
returns a `{ res: res, offset: offset }` object

### bl.writeVarInt(n)

// heavily inspired from github.com/rvagg/bl
var assert = require('assert')

function BufferList (s) {
  if (!(this instanceof BufferList))
    return new BufferList(s)

  this._bufs = []
  this.length = 0

  if (!!s)
    this.append(s)
}

BufferList.prototype.append = function (s, enc) {

  if (Buffer.isBuffer(s) || s instanceof BufferList) {
    this._bufs.push(s)
    this.length += s.length
  } else if ('number' === typeof s) {
    this._bufs.push(new Buffer([s]))
    this.length += this._bufs[this._bufs.length - 1].length
  } else if ('string' === typeof s) {
    this._bufs.push(new Buffer(s, enc))
    this.length += this._bufs[this._bufs.length - 1].length
  } else if (Array.isArray(s)) {
    if (Buffer.isBuffer(s[0])) {
      s.forEach(function (buf) {
        this._bufs.push(buf)
        this.length += buf.length
      }.bind(this))
    } else {
      this._bufs.push(new Buffer(s))
      this.length += this._bufs[this._bufs.length - 1].length
    }
  }
  return this
}

BufferList.prototype.copy = function (dst, dstStart, srcStart, srcEnd) {
  if (typeof srcStart != 'number' || srcStart < 0)
    srcStart = 0
  if (typeof srcEnd != 'number' || srcEnd > this.length)
    srcEnd = this.length
  if (srcStart >= this.length)
    return dst || new Buffer(0)
  if (srcEnd <= 0)
    return dst || new Buffer(0)

  var copy   = !!dst
    , off    = this._offset(srcStart)
    , len    = srcEnd - srcStart
    , bytes  = len
    , bufoff = (copy && dstStart) || 0
    , start  = off[1]
    , l
    , i

  // copy/slice everything
  if (srcStart === 0 && srcEnd == this.length) {
    if (!copy) // slice, just return a full concat
      return Buffer.concat(this._bufs)

    // copy, need to copy individual buffers
    for (i = 0; i < this._bufs.length; i++) {
      this._bufs[i].copy(dst, bufoff)
      bufoff += this._bufs[i].length
    }

    return dst
  }

  // easy, cheap case where it's a subset of one of the buffers
  if (bytes <= this._bufs[off[0]].length - start) {
    return copy
      ? this._bufs[off[0]].copy(dst, dstStart, start, start + bytes)
      : this._bufs[off[0]].slice(start, start + bytes)
  }

  if (!copy) // a slice, we need something to copy in to
    dst = new Buffer(len)

  for (i = off[0]; i < this._bufs.length; i++) {
    l = this._bufs[i].length - start

    if (bytes > l) {
      this._bufs[i].copy(dst, bufoff, start)
    } else {
      this._bufs[i].copy(dst, bufoff, start, start + bytes)
      break
    }

    bufoff += l
    bytes -= l

    if (start)
      start = 0
  }

  return dst
}

BufferList.prototype.slice = function (start, end) {
  return this.copy(null, 0, start, end)
}

BufferList.prototype.toString = function (encoding, start, end) {
  return this.slice(start, end).toString(encoding)
}

BufferList.prototype.get = function (index) {
  return this.slice(index, index + 1)[0]
}

;(function () {
  var methods = {
    writeUInt8: 1,
    writeUInt16LE: 2,
    writeUInt32LE: 4
  }

  for (var m in methods) {
    (function (m) {
      BufferList.prototype[m] = function (n) {
        var buf = new Buffer(methods[m])
        buf[m](n, 0)
        this.append(buf)
      }
    }(m))
  }
}())

;(function () {
  var methods = {
    readUInt8: 1,
    readUInt16LE: 2,
    readUInt32LE: 4
  }

  for (var m in methods) {
    (function (m) {
      BufferList.prototype[m] = function (offset) {
        return this.slice(offset, offset + methods[m])[m](0)
      }
    }(m))
  }
}())

// https://github.com/bitcoinjs/bitcoinjs-lib/blob/cc98600154bf921acaff2efd907c1fcec08232e8/src/bufferutils.js
BufferList.prototype.writeUInt64LE = function (n) {
  verifuint(n, 0x001fffffffffffff)
  var buf = new Buffer(8)
  this.append(buf)
  buf.writeInt32LE(n & -1, 0)
  buf.writeUInt32LE(Math.floor(n / 0x100000000), 4)
}

// https://github.com/bitcoinjs/bitcoinjs-lib/blob/cc98600154bf921acaff2efd907c1fcec08232e8/src/bufferutils.js
BufferList.prototype.readUInt64LE = function (offset) {
  var n = this.readUInt32LE(offset) + this.readUInt32LE(offset + 4) * 0x100000000
  verifuint(n, 0x001fffffffffffff)
  return n
}

BufferList.prototype.writeVarInt = function (n) {
  if (n < 0xfd) {
    this.writeUInt8(n)
  } else if (n <= 0xffff) {
    this.writeUInt8(0xfd)
    this.writeUInt16LE(n)
  } else if (n <= 0xffffffff) {
    this.writeUInt8(0xfe)
    this.writeUInt32LE(n)
  } else {
    this.writeUInt8(0xff)
    this.writeUInt64LE(n)
  }
}

BufferList.prototype.readVarInt  = function (offset) {
  if (!offset)
    offset = 0

  var res, size

  if (this.get(offset) < 0xfd) {
    res = this.readUInt8(offset)
    size = 1
  } else if (this.get(offset) === 0xfd) {
    res = this.readUInt16LE(offset + 1)
    size = 3
  } else if (this.get(offset) === 0xfe) {
    res = this.readUInt32LE(offset + 1)
    size = 5
  } else if (this.get(offset) === 0xff) {
    res = this.readUInt64LE(offset + 1)
    size = 9
  }

  return { res: res, offset: offset + size }
}

BufferList.prototype._offset = function (offset) {
  var tot = 0, _t
  for (var i = 0; i < this._bufs.length; i++) {
    _t = tot + this._bufs[i].length
    if (offset < _t)
      return [i, offset - tot]
    tot = _t
  }
}

// https://github.com/feross/buffer/blob/master/index.js#L1127
function verifuint(value, max) {
  assert(typeof value === 'number', 'cannot write a non-number as a number')
  assert(value >= 0, 'specified a negative value for writing an unsigned value')
  assert(value <= max, 'value is larger than maximum value for type')
  assert(Math.floor(value) === value, 'value has a fractional component')
}

module.exports = BufferList

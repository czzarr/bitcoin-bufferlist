var BufferList = require('../')
var crypto = require('crypto')
var encodings =
      ('hex utf8 utf-8 ascii binary base64'
          + (process.browser ? '' : ' ucs2 ucs-2 utf16le utf-16le')).split(' ')
var tape = require('tape')

tape('single bytes from single buffer', function (t) {
  var bl = new BufferList()
  bl.append(new Buffer('abcd'))

  t.equal(bl.length, 4)

  t.equal(bl.get(0), 97)
  t.equal(bl.get(1), 98)
  t.equal(bl.get(2), 99)
  t.equal(bl.get(3), 100)

  t.end()
})

tape('single bytes from multiple buffers', function (t) {
  var bl = new BufferList()
  bl.append(new Buffer('abcd'))
  bl.append(new Buffer('efg'))
  bl.append(new Buffer('hi'))
  bl.append(new Buffer('j'))

  t.equal(bl.length, 10)

  t.equal(bl.get(0), 97)
  t.equal(bl.get(1), 98)
  t.equal(bl.get(2), 99)
  t.equal(bl.get(3), 100)
  t.equal(bl.get(4), 101)
  t.equal(bl.get(5), 102)
  t.equal(bl.get(6), 103)
  t.equal(bl.get(7), 104)
  t.equal(bl.get(8), 105)
  t.equal(bl.get(9), 106)
  t.end()
})

tape('multi bytes from single buffer', function (t) {
  var bl = new BufferList()
  bl.append(new Buffer('abcd'))

  t.equal(bl.length, 4)

  t.equal(bl.slice(0, 4).toString('ascii'), 'abcd')
  t.equal(bl.slice(0, 3).toString('ascii'), 'abc')
  t.equal(bl.slice(1, 4).toString('ascii'), 'bcd')

  t.end()
})

tape('multiple bytes from multiple buffers', function (t) {
  var bl = new BufferList()

  bl.append(new Buffer('abcd'))
  bl.append(new Buffer('efg'))
  bl.append(new Buffer('hi'))
  bl.append(new Buffer('j'))

  t.equal(bl.length, 10)

  t.equal(bl.slice(0, 10).toString('ascii'), 'abcdefghij')
  t.equal(bl.slice(3, 10).toString('ascii'), 'defghij')
  t.equal(bl.slice(3, 6).toString('ascii'), 'def')
  t.equal(bl.slice(3, 8).toString('ascii'), 'defgh')
  t.equal(bl.slice(5, 10).toString('ascii'), 'fghij')

  t.end()
})

tape('multiple bytes from multiple buffer lists', function (t) {
  var bl = new BufferList()

  bl.append(new BufferList([new Buffer('abcd'), new Buffer('efg')]))
  bl.append(new BufferList([new Buffer('hi'), new Buffer('j')]))

  t.equal(bl.length, 10)

  t.equal(bl.slice(0, 10).toString('ascii'), 'abcdefghij')
  t.equal(bl.slice(3, 10).toString('ascii'), 'defghij')
  t.equal(bl.slice(3, 6).toString('ascii'), 'def')
  t.equal(bl.slice(3, 8).toString('ascii'), 'defgh')
  t.equal(bl.slice(5, 10).toString('ascii'), 'fghij')

  t.end()
})

tape('test writeUInt8', function (t) {
  var bl  = new BufferList()

  bl.writeUInt8(2)
  bl.writeUInt8(3)
  bl.writeUInt8(4)
  bl.writeUInt8(5)

  t.equal(bl.toString('hex'), '02030405')

  t.end()
})

tape('test writeUInt16LE', function (t) {
  var bl  = new BufferList()

  bl.writeUInt16LE(2)
  bl.writeUInt16LE(3)
  bl.writeUInt16LE(4)
  bl.writeUInt16LE(5)

  t.equal(bl.toString('hex'), '0200030004000500')

  t.end()
})

tape('test writeUInt32LE', function (t) {
  var bl  = new BufferList()

  bl.writeUInt32LE(2)
  bl.writeUInt32LE(3)
  bl.writeUInt32LE(4)
  bl.writeUInt32LE(5)

  t.equal(bl.toString('hex'), '02000000030000000400000005000000')

  t.end()
})

tape('test writeUInt64LE', function (t) {
  var bl  = new BufferList()

  bl.writeUInt64LE(2)
  bl.writeUInt64LE(3)

  t.equal(bl.toString('hex'), '02000000000000000300000000000000')

  t.end()
})

tape('test writeVarInt', function (t) {
  var bl  = new BufferList()

  bl.writeVarInt(2)
  bl.writeVarInt(0xfe)
  bl.writeVarInt(0xffffff)
  bl.writeVarInt(0xffffffffff)

  t.equal(bl.toString('hex'), '02fdfe00feffffff00ffffffffffff000000')

  t.end()
})

tape('test readUInt8', function (t) {
  var buf1 = new Buffer(1)
    , buf2 = new Buffer(3)
    , buf3 = new Buffer(3)
    , bl  = new BufferList()

  buf2[1] = 0x3
  buf2[2] = 0x4
  buf3[0] = 0x23
  buf3[1] = 0x42

  bl.append(buf1)
  bl.append(buf2)
  bl.append(buf3)

  t.equal(bl.readUInt8(2), 0x3)
  t.equal(bl.readUInt8(3), 0x4)
  t.equal(bl.readUInt8(4), 0x23)
  t.equal(bl.readUInt8(5), 0x42)
  t.end()
})

tape('test readUInt16LE', function (t) {
  var buf1 = new Buffer(1)
    , buf2 = new Buffer(3)
    , buf3 = new Buffer(3)
    , bl   = new BufferList()

  buf2[1] = 0x3
  buf2[2] = 0x4
  buf3[0] = 0x23
  buf3[1] = 0x42

  bl.append(buf1)
  bl.append(buf2)
  bl.append(buf3)

  t.equal(bl.readUInt16LE(2), 0x0403)
  t.equal(bl.readUInt16LE(3), 0x2304)
  t.equal(bl.readUInt16LE(4), 0x4223)
  t.end()
})

tape('test readUInt32LE', function (t) {
  var buf1 = new Buffer(1)
    , buf2 = new Buffer(3)
    , buf3 = new Buffer(3)
    , bl   = new BufferList()

  buf2[1] = 0x3
  buf2[2] = 0x4
  buf3[0] = 0x23
  buf3[1] = 0x42

  bl.append(buf1)
  bl.append(buf2)
  bl.append(buf3)

  t.equal(bl.readUInt32LE(2), 0x42230403)
  t.end()
})

tape('test readUInt64LE', function (t) {
  var buf1 = new Buffer('0100', 'hex')
    , buf2 = new Buffer('0000', 'hex')
    , buf3 = new Buffer('0000', 'hex')
    , buf4 = new Buffer('0000', 'hex')
    , bl   = new BufferList()

  bl.append(buf1)
  bl.append(buf2)
  bl.append(buf3)
  bl.append(buf4)

  t.equal(bl.readUInt64LE(0), 1)
  t.end()
})

tape('test readVarInt', function (t) {
  var buf1 = new Buffer('02', 'hex')
    , buf2 = new Buffer('fdfe00', 'hex')
    , buf3 = new Buffer('feffffff00', 'hex')
    , buf4 = new Buffer('ffffffffffff000000', 'hex')
    , bl   = new BufferList()

  bl.append(buf1)
  bl.append(buf2)
  bl.append(buf3)
  bl.append(buf4)

  t.deepEqual(bl.readVarInt(0), { res: 2, offset: 1 })
  t.deepEqual(bl.readVarInt(1), { res: 0xfe, offset: 4 })
  t.deepEqual(bl.readVarInt(4), { res: 0xffffff, offset: 9 })
  t.deepEqual(bl.readVarInt(9), { res: 0xffffffffff, offset: 18 })
  t.end()
})

tape('instantiation with Buffer', function (t) {
  var buf  = crypto.randomBytes(1024)
    , buf2 = crypto.randomBytes(1024)
    , b    = BufferList(buf)

  t.equal(buf.toString('hex'), b.slice().toString('hex'), 'same buffer')
  b = BufferList([ buf, buf2 ])
  t.equal(b.slice().toString('hex'), Buffer.concat([ buf, buf2 ]).toString('hex'), 'same buffer')
  t.end()
})

tape('test String appendage', function (t) {
  var bl = new BufferList()
    , b  = new Buffer('abcdefghij\xff\x00')

  bl.append('abcd')
  bl.append('efg')
  bl.append('hi')
  bl.append('j')
  bl.append('\xff\x00')

  encodings.forEach(function (enc) {
      t.equal(bl.toString(enc), b.toString(enc))
    })

  t.end()
})

tape('unicode string', function (t) {
  t.plan(2)
  var inp1 = '\u2600'
    , inp2 = '\u2603'
    , exp = inp1 + ' and ' + inp2
    , bl = BufferList()
  bl.append(inp1)
  bl.append(' and ')
  bl.append(inp2)
  t.equal(exp, bl.toString())
  t.equal(new Buffer(exp).toString('hex'), bl.toString('hex'))
})

tape('basic copy', function (t) {
  var buf  = crypto.randomBytes(1024)
    , buf2 = new Buffer(1024)
    , b    = BufferList(buf)

  b.copy(buf2)
  t.equal(b.slice().toString('hex'), buf2.toString('hex'), 'same buffer')
  t.end()
})

tape('copy after many appends', function (t) {
  var buf  = crypto.randomBytes(512)
    , buf2 = new Buffer(1024)
    , b    = BufferList(buf)

  b.append(buf)
  b.copy(buf2)
  t.equal(b.slice().toString('hex'), buf2.toString('hex'), 'same buffer')
  t.end()
})

tape('copy at a precise position', function (t) {
  var buf  = crypto.randomBytes(1004)
    , buf2 = new Buffer(1024)
    , b    = BufferList(buf)

  b.copy(buf2, 20)
  t.equal(b.slice().toString('hex'), buf2.slice(20).toString('hex'), 'same buffer')
  t.end()
})

tape('copy starting from a precise location', function (t) {
  var buf  = crypto.randomBytes(10)
    , buf2 = new Buffer(5)
    , b    = BufferList(buf)

  b.copy(buf2, 0, 5)
  t.equal(b.slice(5).toString('hex'), buf2.toString('hex'), 'same buffer')
  t.end()
})

tape('copy in an interval', function (t) {
  var rnd      = crypto.randomBytes(10)
    , b        = BufferList(rnd) // put the random bytes there
    , actual   = new Buffer(3)
    , expected = new Buffer(3)

  rnd.copy(expected, 0, 5, 8)
  b.copy(actual, 0, 5, 8)

  t.equal(actual.toString('hex'), expected.toString('hex'), 'same buffer')
  t.end()
})

tape('copy an interval between two buffers', function (t) {
  var buf      = crypto.randomBytes(10)
    , buf2     = new Buffer(10)
    , b        = BufferList(buf)

  b.append(buf)
  b.copy(buf2, 0, 5, 15)

  t.equal(b.slice(5, 15).toString('hex'), buf2.toString('hex'), 'same buffer')
  t.end()
})

import assert from 'node:assert';
import { Buffer } from 'node:buffer';
import crypto from 'node:crypto';
import test from 'node:test';

import decode from '../src/decode.mjs';
import {
  pack,
  packStrLen,
} from '../src/pack.mjs';
import { TYPE_REQUEST_CONNECT } from './constants.mjs';

test('encode', () => {
  let execute = decode();
  execute(Buffer.from([0]));
  assert.throws(() => {
    execute(Buffer.from([2]));
  });
  execute = decode();
  execute(Buffer.from([0, 1]));
  assert.throws(() => {
    execute(Buffer.from([99]));
  });
  execute = decode();
  execute(Buffer.from([0, 1]));
  execute(Buffer.from([1]));
  const id = Buffer.from('asdfwefefadsf');
  execute(Buffer.from([id.length]));
  execute(id);
  execute = decode();
  const version = Buffer.from([0, 1]);
  const type = Buffer.from([1]);
  execute(version);
  execute(type);
  execute(Buffer.from([id.length]));
  execute(id.slice(0, 3));
  execute(id.slice(3));
  const subHash = crypto.createHash('sha256').update(Buffer.concat([
    Buffer.from([id.length]),
    id,
  ])).digest();
  execute(subHash.slice(0, 5));
  execute(subHash.slice(5));

  const hash = crypto.createHash('sha256').update(Buffer.concat([
    version,
    type,
    subHash,
  ])).digest();
  let ret = execute(hash.slice(0, 3));
  assert.equal(ret, null);
  ret = execute(hash.slice(3));
  assert.equal(ret.payload.type, 1);
  assert.equal(ret.payload.version, 1);
  execute = decode();
  ret = execute(Buffer.concat([
    version,
    type,
    Buffer.from([id.length]),
    id,
    subHash,
    hash,
  ]));
  assert.equal(ret.payload.type, 1);
  assert.equal(ret.payload.version, 1);
  assert.equal(ret.buf.length, 0);
  execute = decode();
  ret = execute(Buffer.concat([
    version,
    type,
    Buffer.from([id.length]),
    id,
    subHash,
    hash.slice(0, 4),
  ]));
  assert.equal(ret, null);
  ret = execute(Buffer.concat([
    hash.slice(4),
    Buffer.from('aaa'),
  ]));
  assert.equal(ret.payload.payload.identifierSize, id.length);
  assert.equal(ret.buf.toString(), 'aaa');
});

test('2', () => {
  const _id = 'bbbbb';
  const portBuf = Buffer.allocUnsafe(2);
  portBuf.writeUInt16BE(66);
  const hostname = 'quan.dev';
  const chunk = pack({
    type: TYPE_REQUEST_CONNECT,
    payload: Buffer.concat([
      packStrLen(_id, 1),
      packStrLen(hostname, 1),
      portBuf,
    ]),
  });
  const ret = decode()(chunk);
  assert.equal(ret.payload.payload.hostname, hostname);
  assert.equal(ret.payload.payload.port, 66);
});

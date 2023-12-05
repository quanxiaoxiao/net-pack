import crypto from 'node:crypto';
import test from 'ava'; // eslint-disable-line
import { TYPE_REQUEST_CONNECT } from '../src/constants.mjs';
import {
  pack,
  packStrLen,
} from '../src/pack.mjs';
import decode from '../src/decode.mjs';

test('encode', (t) => {
  let execute = decode();
  execute(Buffer.from([0]));
  t.throws(() => {
    execute(Buffer.from([2]));
  });
  execute = decode();
  execute(Buffer.from([0, 1]));
  t.throws(() => {
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
  t.is(ret, null);
  ret = execute(hash.slice(3));
  t.is(ret.payload.type, 1);
  t.is(ret.payload.version, 1);
  execute = decode();
  ret = execute(Buffer.concat([
    version,
    type,
    Buffer.from([id.length]),
    id,
    subHash,
    hash,
  ]));
  t.is(ret.payload.type, 1);
  t.is(ret.payload.version, 1);
  t.is(ret.buf.length, 0);
  execute = decode();
  ret = execute(Buffer.concat([
    version,
    type,
    Buffer.from([id.length]),
    id,
    subHash,
    hash.slice(0, 4),
  ]));
  t.is(ret, null);
  ret = execute(Buffer.concat([
    hash.slice(4),
    Buffer.from('aaa'),
  ]));
  t.is(ret.payload.payload.identifierSize, id.length);
  t.is(ret.buf.toString(), 'aaa');
});

test('2', (t) => {
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
  t.is(ret.payload.payload.hostname, hostname);
  t.is(ret.payload.payload.port, 66);
});

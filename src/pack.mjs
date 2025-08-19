import crypto from 'node:crypto';

import {
  CURRENT_VERSION,
  TYPE_ERROR_REPORT,
} from './constants.mjs';

export const calcHash = (chunk) => {
  const hash = crypto.createHash('sha256');
  hash.update(chunk);
  return hash.digest();
};

export const calcPackHash = ({
  type,
  hash,
}) => {
  const versionBuf = Buffer.allocUnsafe(2);
  versionBuf.writeUInt16BE(CURRENT_VERSION);
  const typeBuf = Buffer.allocUnsafe(1);
  typeBuf.writeUInt8(type);
  return calcHash(Buffer.concat([
    versionBuf,
    typeBuf,
    hash,
  ]));
};

export const checkHash = (a, b) => {
  if (!a.equals(b)) {
    throw new Error('hash invalid');
  }
};

export const packStrLen = (str, size = 1) => {
  if (typeof str !== 'string') {
    throw new Error('content is not string');
  }
  if (size > 4) {
    throw new Error(`\`${size}\` exceed max size`);
  }
  const buf = Buffer.from(str);
  const len = buf.length;
  const bufLength = Buffer.allocUnsafe(size);
  if (len > 2147483647) {
    throw new Error('content size execute 2147483647');
  }
  if (size === 1) {
    if (len > 255) {
      throw new Error('content size execute 255');
    }
    bufLength.writeUInt8(buf.length);
  } else if (size === 2) {
    if (len > 65535) {
      throw new Error('content size execute 65535');
    }
    bufLength.writeUInt16BE(buf.length);
  } else if (size === 4) {
    bufLength.writeUInt32BE(buf.length);
  } else {
    throw new Error(`\`${size}\` unable handle`);
  }
  return Buffer.concat([
    bufLength,
    buf,
  ]);
};

export const packPort = (port) => {
  const portBuf = Buffer.allocUnsafe(2);
  portBuf.writeUInt16BE(port);
  return portBuf;
};

export const pack = ({
  type,
  payload,
}) => {
  const versionBuf = Buffer.allocUnsafe(2);
  versionBuf.writeUInt16BE(CURRENT_VERSION);
  const typeBuf = Buffer.allocUnsafe(1);
  typeBuf.writeUInt8(type);
  const payloadHash = calcHash(payload || Buffer.from([]));
  return Buffer.concat([
    versionBuf,
    typeBuf,
    ...payload && payload.length > 0 ? [payload] : [],
    payloadHash,
    calcPackHash({
      type,
      hash: payloadHash,
    }),
  ]);
};

export const packErrorReport = (message) => pack({
  type: TYPE_ERROR_REPORT,
  payload: packStrLen(message, 2),
});

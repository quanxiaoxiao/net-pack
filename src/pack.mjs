import crypto from 'node:crypto';

import { enpack } from '@quanxiaoxiao/bytes';

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
  payload: enpack(message, 2),
});

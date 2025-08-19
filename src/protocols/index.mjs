import {
  TYPE_CREATE_CONNECT,
  TYPE_ERROR_REPORT,
  TYPE_PING,
  TYPE_PIPE_CONNECT,
  TYPE_PONG,
  TYPE_QUERY_STATE,
  TYPE_REQUEST_CONNECT,
  TYPE_RESULT_STATE,
  TYPE_SUBSCRIBER,
} from '../constants.mjs';
import {
  calcHash,
  checkHash,
  packStrLen,
} from '../pack.mjs';

export default {
  [TYPE_SUBSCRIBER]: [
    {
      size: 1,
      fn: (buf, payload) => {
        payload.identifierSize = buf.readUInt8(0);
      },
    },
    {
      size: (payload) => payload.identifierSize,
      fn: (buf, payload) => {
        payload.identifier = buf.toString();
      },
    },
    {
      size: 32,
      fn: (buf, payload) => {
        const hash = calcHash(packStrLen(payload.identifier, 1));
        checkHash(hash, buf);
        payload.hash = hash;
      },
    },
  ],
  [TYPE_CREATE_CONNECT]: [
    {
      size: 1,
      fn: (buf, payload) => {
        payload.identifierSize = buf.readUInt8(0);
      },
    },
    {
      size: (payload) => payload.identifierSize,
      fn: (buf, payload) => {
        payload.identifier = buf.toString();
      },
    },
    {
      size: 1,
      fn: (buf, payload) => {
        payload.hostnameSize = buf.readUInt8(0);
      },
    },
    {
      size: (payload) => payload.hostnameSize,
      fn: (buf, payload) => {
        payload.hostname = buf.toString();
      },
    },
    {
      size: 2,
      fn: (buf, payload) => {
        const port = buf.readUInt16BE(0);
        if (port === 0) {
          throw new Error('port invalid');
        }
        payload.port = port;
      },
    },
    {
      size: 32,
      fn: (buf, payload) => {
        const portBuf = Buffer.allocUnsafe(2);
        portBuf.writeUInt16BE(payload.port);
        const hash = calcHash(Buffer.concat([
          packStrLen(payload.identifier, 1),
          packStrLen(payload.hostname, 1),
          portBuf,
        ]));
        checkHash(hash, buf);
        payload.hash = hash;
      },
    },
  ],
  [TYPE_REQUEST_CONNECT]: [
    {
      size: 1,
      fn: (buf, payload) => {
        payload.identifierSize = buf.readUInt8(0);
      },
    },
    {
      size: (payload) => payload.identifierSize,
      fn: (buf, payload) => {
        payload.identifier = buf.toString();
      },
    },
    {
      size: 1,
      fn: (buf, payload) => {
        payload.hostnameSize = buf.readUInt8(0);
      },
    },
    {
      size: (payload) => payload.hostnameSize,
      fn: (buf, payload) => {
        payload.hostname = buf.toString();
      },
    },
    {
      size: 2,
      fn: (buf, payload) => {
        payload.port = buf.readUInt16BE(0);
      },
    },
    {
      size: 32,
      fn: (buf, payload) => {
        const portBuf = Buffer.allocUnsafe(2);
        portBuf.writeUInt16BE(payload.port);
        const hash = calcHash(Buffer.concat([
          packStrLen(payload.identifier, 1),
          packStrLen(payload.hostname, 1),
          portBuf,
        ]));
        checkHash(hash, buf);
        payload.hash = hash;
      },
    },
  ],
  [TYPE_PIPE_CONNECT]: [
    {
      size: 1,
      fn: (buf, payload) => {
        payload.identifierSize = buf.readUInt8(0);
      },
    },
    {
      size: (payload) => payload.identifierSize,
      fn: (buf, payload) => {
        payload.identifier = buf.toString();
      },
    },
    {
      size: 32,
      fn: (buf, payload) => {
        const hash = calcHash(packStrLen(payload.identifier, 1));
        checkHash(hash, buf);
        payload.hash = hash;
      },
    },
  ],
  [TYPE_PING]: [
    {
      size: 8,
      fn: (buf, payload) => {
        payload.timestamp = buf.readBigInt64BE(0);
      },
    },
    {
      size: 32,
      fn: (buf, payload) => {
        const timestampBuf = Buffer.allocUnsafe(8);
        timestampBuf.writeBigInt64BE(payload.timestamp);
        const hash = calcHash(timestampBuf);
        checkHash(hash, buf);
        payload.hash = hash;
      },
    },
  ],
  [TYPE_PONG]: [
    {
      size: 8,
      fn: (buf, payload) => {
        payload.timestampRequest = buf.readBigInt64BE(0);
      },
    },
    {
      size: 8,
      fn: (buf, payload) => {
        payload.timestampeResponse = buf.readBigInt64BE(0);
      },
    },
    {
      size: 32,
      fn: (buf, payload) => {
        const timestampRequestBuf = Buffer.allocUnsafe(8);
        const timestampResponseBuf = Buffer.allocUnsafe(8);
        timestampRequestBuf.writeBigInt64BE(payload.timestampRequest);
        timestampResponseBuf.writeBigInt64BE(payload.timestampeResponse);
        const hash = calcHash(Buffer.concat([
          timestampRequestBuf,
          timestampResponseBuf,
        ]));
        checkHash(hash, buf);
        payload.hash = hash;
      },
    },
  ],
  [TYPE_QUERY_STATE]: [
    {
      size: 32,
      fn: (buf, payload) => {
        const hash = calcHash(Buffer.from([]));
        checkHash(hash, buf);
        payload.hash = hash;
      },
    },
  ],
  [TYPE_RESULT_STATE]: [
    {
      size: 4,
      fn: (buf, payload) => {
        payload.dataSize = buf.readUInt32BE(0);
      },
    },
    {
      size: (payload) => payload.dataSize,
      fn: (buf, payload) => {
        payload.data = buf.toString();
      },
    },
    {
      size: 32,
      fn: (buf, payload) => {
        const hash = calcHash(packStrLen(payload.data, 4));
        checkHash(hash, buf);
        payload.hash = hash;
      },
    },
  ],
  [TYPE_ERROR_REPORT]: [
    {
      size: 2,
      fn: (buf, payload) => {
        payload.messageSize = buf.readUInt16BE(0);
      },
    },
    {
      size: (payload) => payload.messageSize,
      fn: (buf, payload) => {
        payload.message = buf.toString();
      },
    },
    {
      size: 32,
      fn: (buf, payload) => {
        const hash = calcHash(packStrLen(payload.message, 2));
        checkHash(hash, buf);
        payload.hash = hash;
      },
    },
  ],
};

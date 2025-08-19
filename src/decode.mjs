import { Buffer } from 'node:buffer';

import { CURRENT_VERSION } from './constants.mjs';
import {
  calcPackHash,
  checkHash,
} from './pack.mjs';
import protocols from './protocols/index.mjs';

export default () => {
  const state = {
    buf: Buffer.from([]),
    size: 0,
    offset: 0,
    depth: 0,
    payload: {
      index: 0,
      hash: null,
      version: null,
      type: null,
    },
  };

  const procedure = [
    {
      size: 2,
      fn: (buf, payload) => {
        const version = buf.readUInt16BE();
        if (version > CURRENT_VERSION) {
          throw new Error('version invalid');
        }
        payload.version = version;
      },
    },
    {
      size: 1,
      fn: (buf, payload) => {
        const type = buf.readUInt8(0);
        const arr = protocols[type];
        if (!Array.isArray(arr)) {
          throw new Error('type invalid');
        }
        payload.type = type;
      },
    },
    (payload) => {
      const arr = protocols[payload.type];
      if (!arr || arr.length === 0) {
        throw new Error('unable handle sub');
      }
      return arr;
    },
    {
      size: 32,
      fn: (buf, payload) => {
        const versionBuf = Buffer.allocUnsafe(2);
        versionBuf.writeUInt16BE(payload.version);
        const hash = calcPackHash({
          type: payload.type,
          hash: payload.payload.hash,
        });
        checkHash(buf, hash);
        payload.hash = hash;
      },
    },
  ];

  function hasEnoughData(requiredSize) {
    return state.size - state.offset >= requiredSize && state.size > state.offset;
  }

  function processStaticHandler(handler, payload) {
    const size = typeof handler.size === 'function' ? handler.size(payload) : handler.size;
    if (!hasEnoughData(size)) {
      return false;
    }
    const dataSlice = state.buf.subarray(state.offset, state.offset + size);
    handler.fn(dataSlice, payload);
    state.offset += size;
    payload.index ++;
    return true;
  }

  function processDynamicHandler(handler, payload) {
    const subArr = handler(payload);
    if (!payload.payload) {
      state.depth ++;
      payload.payload = {
        index: 0,
      };
    }
    if (state.size === state.offset) {
      return false;
    }
    walk(subArr, payload.payload); // eslint-disable-line no-use-before-define
    if (payload.payload.index === subArr.length) {
      state.depth --;
      payload.index ++;
    }
    return true;
  }

  function processHandler(handler, payload) {
    if (typeof handler === 'function') {
      return processDynamicHandler(handler, payload);
    }
    return processStaticHandler(handler, payload);
  }

  function walk(handlerArray, payload) {
    while (payload.index < handlerArray.length) {
      const handler = handlerArray[payload.index];
      const success = processHandler(handler, payload);
      if (!success) {
        return true;
      }
    }
    return false;
  }

  const run = (handlerArray, payload, depth) => {
    if (depth === 0) {
      return walk(handlerArray, payload);
    }
    const currentHandler = handlerArray[payload.index];
    if (typeof currentHandler === 'function') {
      const subArr = currentHandler(payload);
      const subPayload = payload.payload;
      if (subArr.length === subPayload.index) {
        payload.index ++;
        state.depth --;
        return walk(handlerArray, payload);
      }
      return run(subArr, subPayload, depth - 1);
    }
    return walk(currentHandler, payload);
  };

  const isComplete = () => {
    return state.payload.index === procedure.length && state.depth === 0;
  };

  return (chunk) => {
    if (isComplete()) {
      throw new Error('Parser already completed');
    }
    if (!Buffer.isBuffer(chunk)) {
      throw new Error('Invalid chunk: must be a Buffer');
    }
    if (chunk.length > 0) {
      state.size += chunk.length;
      state.buf = Buffer.concat([state.buf, chunk], state.size);
    }
    run(procedure, state.payload, state.depth);

    if (isComplete()) {
      return {
        payload: state.payload,
        buf: state.buf.slice(state.offset),
      };
    }
    return null;
  };
};

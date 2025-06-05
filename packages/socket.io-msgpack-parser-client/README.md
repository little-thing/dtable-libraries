# socket.io-msgpack-parser

Socket.io parser based on [msgpack](https://github.com/kriszyp/msgpackr)

## Installation

```bash
npm install @dtable/socket.io-msgpack-parser-client
```

## Usage

```ts
import { io } from 'socket.io-client';
import * as parser from '@dtable/socket.io-msgpack-parser-client';

const socket = io('/', {
  // ...
  parser,
});
```

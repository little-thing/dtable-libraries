# socket.io-msgpack-parser

Socket.io parser based on [msgpack](https://github.com/kriszyp/msgpackr)

## Installation

```bash
npm install @dtable/socket.io-msgpack-parser
```

## Usage

```ts
import { createServer } from 'http';
import { Server } from 'socket.io';
import * as parser from '@dtable/socket.io-msgpack-parser';

const httpServer = createServer();
const io = new Server(httpServer, {
  parser,
});
```

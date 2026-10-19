import http from 'node:http';
import https from 'node:https';
import { syncBuiltinESMExports } from 'node:module';

const blockNetwork = () => { throw new Error('Offline regression tests prohibit network requests.'); };
globalThis.fetch = blockNetwork;
http.request = blockNetwork;
http.get = blockNetwork;
https.request = blockNetwork;
https.get = blockNetwork;
syncBuiltinESMExports();

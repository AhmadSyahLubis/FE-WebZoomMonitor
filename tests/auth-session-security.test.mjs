import assert from 'node:assert/strict';
import { test } from 'node:test';
import { resolve } from 'node:path';
import { createServer } from 'vite';
import axios from 'axios';

test('memory sessions ignore forged storage and refresh once without reviving a logged-out session', async () => {
  const previous = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  const values = new Map([['access_token','forged'],['refresh_token','forged'],['user','{"id":1,"is_admin":true}']]);
  Object.defineProperty(globalThis,'localStorage',{configurable:true,value:{getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,String(value)),removeItem:key=>values.delete(key)}});
  const server = await createServer({configFile:false,cacheDir:'node_modules/.vite-test-security',resolve:{alias:{'@':resolve('src')}},server:{middlewareMode:true,hmr:false,ws:false,watch:null},appType:'custom'});
  const previousAdapter = axios.defaults.adapter;
  try {
    const {default:api} = await server.ssrLoadModule('/src/lib/api.ts');
    const {useAuthStore:store} = await server.ssrLoadModule('/src/features/auth/useAuthStore.ts');
    assert.equal(store.getState().isAuthenticated,false);
    const login = () => store.getState().login({access_token:'old-access',refresh_token:'old-refresh',user:{id:1,name:'Offline account'}});
    login();assert.equal(values.has('access_token'),false);assert.equal(values.has('refresh_token'),false);
    await assert.rejects(api.get('https://untrusted.example/collect'));
    assert.equal(store.getState().isAuthenticated,true);
    let refreshes = 0;
    axios.defaults.adapter = async config => { refreshes++;return {config,status:200,statusText:'OK',headers:{},data:{success:true,data:{access_token:'new-access',refresh_token:'new-refresh'}}}; };
    api.defaults.adapter = async config => {
      if(config.headers.Authorization === 'Bearer old-access') throw {config,response:{status:401,data:{error_code:'TOKEN_EXPIRED'}}};
      return {config,status:200,statusText:'OK',headers:{},data:{success:true}};
    };
    await Promise.all(Array.from({length:8},()=>api.get('/dashboard')));
    assert.equal(refreshes,1);
    assert.equal(store.getState().refreshToken,'new-refresh');

    login();let finish;let started;
    const ready = new Promise(resolve=>{started=resolve;});
    axios.defaults.adapter = config => new Promise(resolve=>{started();finish=()=>resolve({config,status:200,statusText:'OK',headers:{},data:{success:true,data:{access_token:'late-access',refresh_token:'late-refresh'}}});});
    const request = api.get('/dashboard');const rejected = assert.rejects(request);
    await ready;store.getState().logout();finish();await rejected;
    assert.equal(store.getState().isAuthenticated,false);assert.equal(store.getState().accessToken,null);
    login();api.defaults.adapter = async config => {throw {config,response:{status:401,data:{error_code:'SESSION_REVOKED'}}};};
    axios.defaults.adapter = async () => {throw new Error('revoked sessions must not refresh');};
    await assert.rejects(api.get('/dashboard'));
    assert.equal(store.getState().isAuthenticated,false);
  } finally {
    axios.defaults.adapter=previousAdapter;await server.close();
    if(previous) Object.defineProperty(globalThis,'localStorage',previous);else delete globalThis.localStorage;
  }
});

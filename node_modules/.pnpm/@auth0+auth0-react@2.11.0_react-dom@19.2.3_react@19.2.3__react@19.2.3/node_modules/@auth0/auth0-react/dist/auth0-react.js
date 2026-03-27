(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('react')) :
    typeof define === 'function' && define.amd ? define(['exports', 'react'], factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.reactAuth0 = {}, global.React));
})(this, (function (exports, React) { 'use strict';

    /******************************************************************************
    Copyright (c) Microsoft Corporation.

    Permission to use, copy, modify, and/or distribute this software for any
    purpose with or without fee is hereby granted.

    THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
    REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
    AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
    INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
    LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
    OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
    PERFORMANCE OF THIS SOFTWARE.
    ***************************************************************************** */
    /* global Reflect, Promise, SuppressedError, Symbol, Iterator */

    var extendStatics = function(d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };

    function __extends(d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    }

    var __assign = function() {
        __assign = Object.assign || function __assign(t) {
            for (var s, i = 1, n = arguments.length; i < n; i++) {
                s = arguments[i];
                for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
            }
            return t;
        };
        return __assign.apply(this, arguments);
    };

    function __rest(s, e) {
        var t = {};
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
            t[p] = s[p];
        if (s != null && typeof Object.getOwnPropertySymbols === "function")
            for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
                if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                    t[p[i]] = s[p[i]];
            }
        return t;
    }

    function __awaiter(thisArg, _arguments, P, generator) {
        function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
        return new (P || (P = Promise))(function (resolve, reject) {
            function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
            function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
            function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
            step((generator = generator.apply(thisArg, _arguments || [])).next());
        });
    }

    function __generator(thisArg, body) {
        var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
        return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
        function verb(n) { return function (v) { return step([n, v]); }; }
        function step(op) {
            if (f) throw new TypeError("Generator is already executing.");
            while (g && (g = 0, op[0] && (_ = 0)), _) try {
                if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
                if (y = 0, t) op = [op[0] & 2, t.value];
                switch (op[0]) {
                    case 0: case 1: t = op; break;
                    case 4: _.label++; return { value: op[1], done: false };
                    case 5: _.label++; y = op[1]; op = [0]; continue;
                    case 7: op = _.ops.pop(); _.trys.pop(); continue;
                    default:
                        if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                        if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                        if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                        if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                        if (t[2]) _.ops.pop();
                        _.trys.pop(); continue;
                }
                op = body.call(thisArg, _);
            } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
            if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
        }
    }

    function __spreadArray(to, from, pack) {
        if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
            if (ar || !(i in from)) {
                if (!ar) ar = Array.prototype.slice.call(from, 0, i);
                ar[i] = from[i];
            }
        }
        return to.concat(ar || Array.prototype.slice.call(from));
    }

    typeof SuppressedError === "function" ? SuppressedError : function (error, suppressed, message) {
        var e = new Error(message);
        return e.name = "SuppressedError", e.error = error, e.suppressed = suppressed, e;
    };

    function e(e,t){var o={};for(var n in e)Object.prototype.hasOwnProperty.call(e,n)&&t.indexOf(n)<0&&(o[n]=e[n]);if(null!=e&&"function"==typeof Object.getOwnPropertySymbols){var i=0;for(n=Object.getOwnPropertySymbols(e);i<n.length;i++)t.indexOf(n[i])<0&&Object.prototype.propertyIsEnumerable.call(e,n[i])&&(o[n[i]]=e[n[i]]);}return o}"function"==typeof SuppressedError&&SuppressedError;var t="undefined"!=typeof globalThis?globalThis:"undefined"!=typeof window?window:"undefined"!=typeof global?global:"undefined"!=typeof self?self:{};function o(e){return e&&e.__esModule&&Object.prototype.hasOwnProperty.call(e,"default")?e.default:e}function n(e,t){return e(t={exports:{}},t.exports),t.exports}var i=n((function(e,t){Object.defineProperty(t,"__esModule",{value:!0});var o=function(){function e(){var e=this;this.locked=new Map,this.addToLocked=function(t,o){var n=e.locked.get(t);void 0===n?void 0===o?e.locked.set(t,[]):e.locked.set(t,[o]):void 0!==o&&(n.unshift(o),e.locked.set(t,n));},this.isLocked=function(t){return e.locked.has(t)},this.lock=function(t){return new Promise((function(o,n){e.isLocked(t)?e.addToLocked(t,o):(e.addToLocked(t),o());}))},this.unlock=function(t){var o=e.locked.get(t);if(void 0!==o&&0!==o.length){var n=o.pop();e.locked.set(t,o),void 0!==n&&setTimeout(n,0);}else e.locked.delete(t);};}return e.getInstance=function(){return void 0===e.instance&&(e.instance=new e),e.instance},e}();t.default=function(){return o.getInstance()};}));o(i);var r=o(n((function(e,o){var n=t&&t.__awaiter||function(e,t,o,n){return new(o||(o=Promise))((function(i,r){function s(e){try{c(n.next(e));}catch(e){r(e);}}function a(e){try{c(n.throw(e));}catch(e){r(e);}}function c(e){e.done?i(e.value):new o((function(t){t(e.value);})).then(s,a);}c((n=n.apply(e,t||[])).next());}))},r=t&&t.__generator||function(e,t){var o,n,i,r,s={label:0,sent:function(){if(1&i[0])throw i[1];return i[1]},trys:[],ops:[]};return r={next:a(0),throw:a(1),return:a(2)},"function"==typeof Symbol&&(r[Symbol.iterator]=function(){return this}),r;function a(r){return function(a){return function(r){if(o)throw new TypeError("Generator is already executing.");for(;s;)try{if(o=1,n&&(i=2&r[0]?n.return:r[0]?n.throw||((i=n.return)&&i.call(n),0):n.next)&&!(i=i.call(n,r[1])).done)return i;switch(n=0,i&&(r=[2&r[0],i.value]),r[0]){case 0:case 1:i=r;break;case 4:return s.label++,{value:r[1],done:!1};case 5:s.label++,n=r[1],r=[0];continue;case 7:r=s.ops.pop(),s.trys.pop();continue;default:if(!(i=s.trys,(i=i.length>0&&i[i.length-1])||6!==r[0]&&2!==r[0])){s=0;continue}if(3===r[0]&&(!i||r[1]>i[0]&&r[1]<i[3])){s.label=r[1];break}if(6===r[0]&&s.label<i[1]){s.label=i[1],i=r;break}if(i&&s.label<i[2]){s.label=i[2],s.ops.push(r);break}i[2]&&s.ops.pop(),s.trys.pop();continue}r=t.call(e,s);}catch(e){r=[6,e],n=0;}finally{o=i=0;}if(5&r[0])throw r[1];return {value:r[0]?r[1]:void 0,done:!0}}([r,a])}}},s=t;Object.defineProperty(o,"__esModule",{value:!0});var a="browser-tabs-lock-key",c={key:function(e){return n(s,void 0,void 0,(function(){return r(this,(function(e){throw new Error("Unsupported")}))}))},getItem:function(e){return n(s,void 0,void 0,(function(){return r(this,(function(e){throw new Error("Unsupported")}))}))},clear:function(){return n(s,void 0,void 0,(function(){return r(this,(function(e){return [2,window.localStorage.clear()]}))}))},removeItem:function(e){return n(s,void 0,void 0,(function(){return r(this,(function(e){throw new Error("Unsupported")}))}))},setItem:function(e,t){return n(s,void 0,void 0,(function(){return r(this,(function(e){throw new Error("Unsupported")}))}))},keySync:function(e){return window.localStorage.key(e)},getItemSync:function(e){return window.localStorage.getItem(e)},clearSync:function(){return window.localStorage.clear()},removeItemSync:function(e){return window.localStorage.removeItem(e)},setItemSync:function(e,t){return window.localStorage.setItem(e,t)}};function u(e){return new Promise((function(t){return setTimeout(t,e)}))}function d(e){for(var t="0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz",o="",n=0;n<e;n++){o+=t[Math.floor(Math.random()*t.length)];}return o}var h=function(){function e(t){this.acquiredIatSet=new Set,this.storageHandler=void 0,this.id=Date.now().toString()+d(15),this.acquireLock=this.acquireLock.bind(this),this.releaseLock=this.releaseLock.bind(this),this.releaseLock__private__=this.releaseLock__private__.bind(this),this.waitForSomethingToChange=this.waitForSomethingToChange.bind(this),this.refreshLockWhileAcquired=this.refreshLockWhileAcquired.bind(this),this.storageHandler=t,void 0===e.waiters&&(e.waiters=[]);}return e.prototype.acquireLock=function(t,o){return void 0===o&&(o=5e3),n(this,void 0,void 0,(function(){var n,i,s,h,l,p,m;return r(this,(function(r){switch(r.label){case 0:n=Date.now()+d(4),i=Date.now()+o,s=a+"-"+t,h=void 0===this.storageHandler?c:this.storageHandler,r.label=1;case 1:return Date.now()<i?[4,u(30)]:[3,8];case 2:return r.sent(),null!==h.getItemSync(s)?[3,5]:(l=this.id+"-"+t+"-"+n,[4,u(Math.floor(25*Math.random()))]);case 3:return r.sent(),h.setItemSync(s,JSON.stringify({id:this.id,iat:n,timeoutKey:l,timeAcquired:Date.now(),timeRefreshed:Date.now()})),[4,u(30)];case 4:return r.sent(),null!==(p=h.getItemSync(s))&&(m=JSON.parse(p)).id===this.id&&m.iat===n?(this.acquiredIatSet.add(n),this.refreshLockWhileAcquired(s,n),[2,!0]):[3,7];case 5:return e.lockCorrector(void 0===this.storageHandler?c:this.storageHandler),[4,this.waitForSomethingToChange(i)];case 6:r.sent(),r.label=7;case 7:return n=Date.now()+d(4),[3,1];case 8:return [2,!1]}}))}))},e.prototype.refreshLockWhileAcquired=function(e,t){return n(this,void 0,void 0,(function(){var o=this;return r(this,(function(s){return setTimeout((function(){return n(o,void 0,void 0,(function(){var o,n,s;return r(this,(function(r){switch(r.label){case 0:return [4,i.default().lock(t)];case 1:return r.sent(),this.acquiredIatSet.has(t)?(o=void 0===this.storageHandler?c:this.storageHandler,null===(n=o.getItemSync(e))?(i.default().unlock(t),[2]):((s=JSON.parse(n)).timeRefreshed=Date.now(),o.setItemSync(e,JSON.stringify(s)),i.default().unlock(t),this.refreshLockWhileAcquired(e,t),[2])):(i.default().unlock(t),[2])}}))}))}),1e3),[2]}))}))},e.prototype.waitForSomethingToChange=function(t){return n(this,void 0,void 0,(function(){return r(this,(function(o){switch(o.label){case 0:return [4,new Promise((function(o){var n=!1,i=Date.now(),r=!1;function s(){if(r||(window.removeEventListener("storage",s),e.removeFromWaiting(s),clearTimeout(a),r=!0),!n){n=!0;var t=50-(Date.now()-i);t>0?setTimeout(o,t):o(null);}}window.addEventListener("storage",s),e.addToWaiting(s);var a=setTimeout(s,Math.max(0,t-Date.now()));}))];case 1:return o.sent(),[2]}}))}))},e.addToWaiting=function(t){this.removeFromWaiting(t),void 0!==e.waiters&&e.waiters.push(t);},e.removeFromWaiting=function(t){void 0!==e.waiters&&(e.waiters=e.waiters.filter((function(e){return e!==t})));},e.notifyWaiters=function(){void 0!==e.waiters&&e.waiters.slice().forEach((function(e){return e()}));},e.prototype.releaseLock=function(e){return n(this,void 0,void 0,(function(){return r(this,(function(t){switch(t.label){case 0:return [4,this.releaseLock__private__(e)];case 1:return [2,t.sent()]}}))}))},e.prototype.releaseLock__private__=function(t){return n(this,void 0,void 0,(function(){var o,n,s,u;return r(this,(function(r){switch(r.label){case 0:return o=void 0===this.storageHandler?c:this.storageHandler,n=a+"-"+t,null===(s=o.getItemSync(n))?[2]:(u=JSON.parse(s)).id!==this.id?[3,2]:[4,i.default().lock(u.iat)];case 1:r.sent(),this.acquiredIatSet.delete(u.iat),o.removeItemSync(n),i.default().unlock(u.iat),e.notifyWaiters(),r.label=2;case 2:return [2]}}))}))},e.lockCorrector=function(t){for(var o=Date.now()-5e3,n=t,i=[],r=0;;){var s=n.keySync(r);if(null===s)break;i.push(s),r++;}for(var c=!1,u=0;u<i.length;u++){var d=i[u];if(d.includes(a)){var h=n.getItemSync(d);if(null!==h){var l=JSON.parse(h);(void 0===l.timeRefreshed&&l.timeAcquired<o||void 0!==l.timeRefreshed&&l.timeRefreshed<o)&&(n.removeItemSync(d),c=!0);}}}c&&e.notifyWaiters();},e.waiters=void 0,e}();o.default=h;})));const s={timeoutInSeconds:60},a={name:"auth0-spa-js",version:"2.11.0"},c=()=>Date.now();class u extends Error{constructor(e,t){super(t),this.error=e,this.error_description=t,Object.setPrototypeOf(this,u.prototype);}static fromPayload({error:e,error_description:t}){return new u(e,t)}}class d extends u{constructor(e,t,o,n=null){super(e,t),this.state=o,this.appState=n,Object.setPrototypeOf(this,d.prototype);}}class h extends u{constructor(e,t,o,n,i=null){super(e,t),this.connection=o,this.state=n,this.appState=i,Object.setPrototypeOf(this,h.prototype);}}class l extends u{constructor(){super("timeout","Timeout"),Object.setPrototypeOf(this,l.prototype);}}class p extends l{constructor(e){super(),this.popup=e,Object.setPrototypeOf(this,p.prototype);}}class m extends u{constructor(e){super("cancelled","Popup closed"),this.popup=e,Object.setPrototypeOf(this,m.prototype);}}class f extends u{constructor(){super("popup_open","Unable to open a popup for loginWithPopup - window.open returned `null`"),Object.setPrototypeOf(this,f.prototype);}}class g extends u{constructor(e,t,o){super(e,t),this.mfa_token=o,Object.setPrototypeOf(this,g.prototype);}}class y extends u{constructor(e,t){super("missing_refresh_token",`Missing Refresh Token (audience: '${k(e,["default"])}', scope: '${k(t)}')`),this.audience=e,this.scope=t,Object.setPrototypeOf(this,y.prototype);}}class w extends u{constructor(e,t){super("missing_scopes",`Missing requested scopes after refresh (audience: '${k(e,["default"])}', missing scope: '${k(t)}')`),this.audience=e,this.scope=t,Object.setPrototypeOf(this,w.prototype);}}class b extends u{constructor(e){super("use_dpop_nonce","Server rejected DPoP proof: wrong nonce"),this.newDpopNonce=e,Object.setPrototypeOf(this,b.prototype);}}function k(e,t=[]){return e&&!t.includes(e)?e:""}const v=()=>window.crypto,_=()=>{const e="0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-_~.";let t="";return Array.from(v().getRandomValues(new Uint8Array(43))).forEach((o=>t+=e[o%e.length])),t},S=e=>btoa(e),I=[{key:"name",type:["string"]},{key:"version",type:["string","number"]},{key:"env",type:["object"]}],P=e=>Object.keys(e).reduce(((t,o)=>{const n=I.find((e=>e.key===o));return n&&n.type.includes(typeof e[o])&&(t[o]=e[o]),t}),{}),T=t=>{var{clientId:o}=t,n=e(t,["clientId"]);return new URLSearchParams((e=>Object.keys(e).filter((t=>void 0!==e[t])).reduce(((t,o)=>Object.assign(Object.assign({},t),{[o]:e[o]})),{}))(Object.assign({client_id:o},n))).toString()},O=async e=>{const t=v().subtle.digest({name:"SHA-256"},(new TextEncoder).encode(e));return await t},j=e=>(e=>decodeURIComponent(atob(e).split("").map((e=>"%"+("00"+e.charCodeAt(0).toString(16)).slice(-2))).join("")))(e.replace(/_/g,"/").replace(/-/g,"+")),C=e=>{const t=new Uint8Array(e);return (e=>{const t={"+":"-","/":"_","=":""};return e.replace(/[+/=]/g,(e=>t[e]))})(window.btoa(String.fromCharCode(...Array.from(t))))},K=new TextEncoder,x=new TextDecoder;function z(e){return "string"==typeof e?K.encode(e):x.decode(e)}function E(e){if("number"!=typeof e.modulusLength||e.modulusLength<2048)throw new U(`${e.name} modulusLength must be at least 2048 bits`)}async function N(e,t,o){if(!1===o.usages.includes("sign"))throw new TypeError('private CryptoKey instances used for signing assertions must include "sign" in their "usages"');const n=`${D(z(JSON.stringify(e)))}.${D(z(JSON.stringify(t)))}`;return `${n}.${D(await crypto.subtle.sign(function(e){switch(e.algorithm.name){case"ECDSA":return {name:e.algorithm.name,hash:"SHA-256"};case"RSA-PSS":return E(e.algorithm),{name:e.algorithm.name,saltLength:32};case"RSASSA-PKCS1-v1_5":return E(e.algorithm),{name:e.algorithm.name};case"Ed25519":return {name:e.algorithm.name}}throw new A}(o),o,z(n)))}`}let R;if(Uint8Array.prototype.toBase64)R=e=>(e instanceof ArrayBuffer&&(e=new Uint8Array(e)),e.toBase64({alphabet:"base64url",omitPadding:!0}));else {const e=32768;R=t=>{t instanceof ArrayBuffer&&(t=new Uint8Array(t));const o=[];for(let n=0;n<t.byteLength;n+=e)o.push(String.fromCharCode.apply(null,t.subarray(n,n+e)));return btoa(o.join("")).replace(/=/g,"").replace(/\+/g,"-").replace(/\//g,"_")};}function D(e){return R(e)}class A extends Error{constructor(e){var t;super(null!=e?e:"operation not supported"),this.name=this.constructor.name,null===(t=Error.captureStackTrace)||void 0===t||t.call(Error,this,this.constructor);}}class U extends Error{constructor(e){var t;super(e),this.name=this.constructor.name,null===(t=Error.captureStackTrace)||void 0===t||t.call(Error,this,this.constructor);}}function L(e){switch(e.algorithm.name){case"RSA-PSS":return function(e){if("SHA-256"===e.algorithm.hash.name)return "PS256";throw new A("unsupported RsaHashedKeyAlgorithm hash name")}(e);case"RSASSA-PKCS1-v1_5":return function(e){if("SHA-256"===e.algorithm.hash.name)return "RS256";throw new A("unsupported RsaHashedKeyAlgorithm hash name")}(e);case"ECDSA":return function(e){if("P-256"===e.algorithm.namedCurve)return "ES256";throw new A("unsupported EcKeyAlgorithm namedCurve")}(e);case"Ed25519":return "Ed25519";default:throw new A("unsupported CryptoKey algorithm name")}}function Z(e){return e instanceof CryptoKey}function H(e){return Z(e)&&"public"===e.type}async function W(e,t,o,n,i,r){const s=null==e?void 0:e.privateKey,a=null==e?void 0:e.publicKey;if(!Z(c=s)||"private"!==c.type)throw new TypeError('"keypair.privateKey" must be a private CryptoKey');var c;if(!H(a))throw new TypeError('"keypair.publicKey" must be a public CryptoKey');if(!0!==a.extractable)throw new TypeError('"keypair.publicKey.extractable" must be true');if("string"!=typeof t)throw new TypeError('"htu" must be a string');if("string"!=typeof o)throw new TypeError('"htm" must be a string');if(void 0!==n&&"string"!=typeof n)throw new TypeError('"nonce" must be a string or undefined');if(void 0!==i&&"string"!=typeof i)throw new TypeError('"accessToken" must be a string or undefined');if(void 0!==r&&("object"!=typeof r||null===r||Array.isArray(r)))throw new TypeError('"additional" must be an object');return N({alg:L(s),typ:"dpop+jwt",jwk:await J(a)},Object.assign(Object.assign({},r),{iat:Math.floor(Date.now()/1e3),jti:crypto.randomUUID(),htm:o,nonce:n,htu:t,ath:i?D(await crypto.subtle.digest("SHA-256",z(i))):void 0}),s)}async function J(e){const{kty:t,e:o,n:n,x:i,y:r,crv:s}=await crypto.subtle.exportKey("jwk",e);return {kty:t,crv:s,e:o,n:n,x:i,y:r}}const X=["authorization_code","refresh_token","urn:ietf:params:oauth:grant-type:token-exchange"];function V(){return async function(e,t){var o;let n;if("string"!=typeof e||0===e.length)throw new TypeError('"alg" must be a non-empty string');switch(e){case"PS256":n={name:"RSA-PSS",hash:"SHA-256",modulusLength:2048,publicExponent:new Uint8Array([1,0,1])};break;case"RS256":n={name:"RSASSA-PKCS1-v1_5",hash:"SHA-256",modulusLength:2048,publicExponent:new Uint8Array([1,0,1])};break;case"ES256":n={name:"ECDSA",namedCurve:"P-256"};break;case"Ed25519":n={name:"Ed25519"};break;default:throw new A}return crypto.subtle.generateKey(n,null!==(o=null==t?void 0:t.extractable)&&void 0!==o&&o,["sign","verify"])}("ES256",{extractable:!1})}function F(e){return async function(e){if(!H(e))throw new TypeError('"publicKey" must be a public CryptoKey');if(!0!==e.extractable)throw new TypeError('"publicKey.extractable" must be true');const t=await J(e);let o;switch(t.kty){case"EC":o={crv:t.crv,kty:t.kty,x:t.x,y:t.y};break;case"OKP":o={crv:t.crv,kty:t.kty,x:t.x};break;case"RSA":o={e:t.e,kty:t.kty,n:t.n};break;default:throw new A("unsupported JWK kty")}return D(await crypto.subtle.digest({name:"SHA-256"},z(JSON.stringify(o))))}(e.publicKey)}function G({keyPair:e,url:t,method:o,nonce:n,accessToken:i}){const r=function(e){const t=new URL(e);return t.search="",t.hash="",t.href}(t);return W(e,r,o,n,i)}const M=async(e,t)=>{const o=await fetch(e,t);return {ok:o.ok,json:await o.json(),headers:(n=o.headers,[...n].reduce(((e,[t,o])=>(e[t]=o,e)),{}))};var n;},Y=async(e,t,o)=>{const n=new AbortController;let i;return t.signal=n.signal,Promise.race([M(e,t),new Promise(((e,t)=>{i=setTimeout((()=>{n.abort(),t(new Error("Timeout when executing 'fetch'"));}),o);}))]).finally((()=>{clearTimeout(i);}))},$=async(e,t,o,n,i,r,s,a)=>{return c={auth:{audience:t,scope:o},timeout:i,fetchUrl:e,fetchOptions:n,useFormData:s,useMrrt:a},u=r,new Promise((function(e,t){const o=new MessageChannel;o.port1.onmessage=function(n){n.data.error?t(new Error(n.data.error)):e(n.data),o.port1.close();},u.postMessage(c,[o.port2]);}));var c,u;},B=async(e,t,o,n,i,r,s=1e4,a)=>i?$(e,t,o,n,s,i,r,a):Y(e,n,s);async function q(t,o,n,i,r,s,a,c,d,h){if(d){const e=await d.generateProof({url:t,method:r.method||"GET",nonce:await d.getNonce()});r.headers=Object.assign(Object.assign({},r.headers),{dpop:e});}let l,p=null;for(let e=0;e<3;e++)try{l=await B(t,n,i,r,s,a,o,c),p=null;break}catch(e){p=e;}if(p)throw p;const m=l.json,{error:f,error_description:w}=m,k=e(m,["error","error_description"]),{headers:v,ok:_}=l;let S;if(d&&(S=v["dpop-nonce"],S&&await d.setNonce(S)),!_){const e=w||`HTTP error. Unable to fetch ${t}`;if("mfa_required"===f)throw new g(f,e,k.mfa_token);if("missing_refresh_token"===f)throw new y(n,i);if("use_dpop_nonce"===f){if(!d||!S||h)throw new b(S);return q(t,o,n,i,r,s,a,c,d,!0)}throw new u(f||"request_error",e)}return k}async function Q(t,o){var{baseUrl:n,timeout:i,audience:r,scope:s,auth0Client:c,useFormData:u,useMrrt:d,dpop:h}=t,l=e(t,["baseUrl","timeout","audience","scope","auth0Client","useFormData","useMrrt","dpop"]);const p="urn:ietf:params:oauth:grant-type:token-exchange"===l.grant_type,m="refresh_token"===l.grant_type&&d,f=Object.assign(Object.assign(Object.assign(Object.assign({},l),p&&r&&{audience:r}),p&&s&&{scope:s}),m&&{audience:r,scope:s}),g=u?T(f):JSON.stringify(f),y=(w=l.grant_type,X.includes(w));var w;return await q(`${n}/oauth/token`,i,r||"default",s,{method:"POST",body:g,headers:{"Content-Type":u?"application/x-www-form-urlencoded":"application/json","Auth0-Client":btoa(JSON.stringify(P(c||a)))}},o,u,d,y?h:void 0)}const ee=(...e)=>{return (t=e.filter(Boolean).join(" ").trim().split(/\s+/),Array.from(new Set(t))).join(" ");var t;},te=(e,t,o)=>{let n;return o&&(n=e[o]),n||(n=e.default),ee(n,t)};class oe{constructor(e,t="@@auth0spajs@@",o){this.prefix=t,this.suffix=o,this.clientId=e.clientId,this.scope=e.scope,this.audience=e.audience;}toKey(){return [this.prefix,this.clientId,this.audience,this.scope,this.suffix].filter(Boolean).join("::")}static fromKey(e){const[t,o,n,i]=e.split("::");return new oe({clientId:o,scope:i,audience:n},t)}static fromCacheEntry(e){const{scope:t,audience:o,client_id:n}=e;return new oe({scope:t,audience:o,clientId:n})}}class ne{set(e,t){localStorage.setItem(e,JSON.stringify(t));}get(e){const t=window.localStorage.getItem(e);if(t)try{return JSON.parse(t)}catch(e){return}}remove(e){localStorage.removeItem(e);}allKeys(){return Object.keys(window.localStorage).filter((e=>e.startsWith("@@auth0spajs@@")))}}class ie{constructor(){this.enclosedCache=function(){let e={};return {set(t,o){e[t]=o;},get(t){const o=e[t];if(o)return o},remove(t){delete e[t];},allKeys:()=>Object.keys(e)}}();}}class re{constructor(e,t,o){this.cache=e,this.keyManifest=t,this.nowProvider=o||c;}async setIdToken(e,t,o){var n;const i=this.getIdTokenCacheKey(e);await this.cache.set(i,{id_token:t,decodedToken:o}),await(null===(n=this.keyManifest)||void 0===n?void 0:n.add(i));}async getIdToken(e){const t=await this.cache.get(this.getIdTokenCacheKey(e.clientId));if(!t&&e.scope&&e.audience){const t=await this.get(e);if(!t)return;if(!t.id_token||!t.decodedToken)return;return {id_token:t.id_token,decodedToken:t.decodedToken}}if(t)return {id_token:t.id_token,decodedToken:t.decodedToken}}async get(e,t=0,o=!1,n){var i;let r=await this.cache.get(e.toKey());if(!r){const t=await this.getCacheKeys();if(!t)return;const i=this.matchExistingCacheKey(e,t);if(i&&(r=await this.cache.get(i)),!i&&o&&"cache-only"!==n)return this.getEntryWithRefreshToken(e,t)}if(!r)return;const s=await this.nowProvider(),a=Math.floor(s/1e3);return r.expiresAt-t<a?r.body.refresh_token?this.modifiedCachedEntry(r,e):(await this.cache.remove(e.toKey()),void await(null===(i=this.keyManifest)||void 0===i?void 0:i.remove(e.toKey()))):r.body}async modifiedCachedEntry(e,t){return e.body={refresh_token:e.body.refresh_token,audience:e.body.audience,scope:e.body.scope},await this.cache.set(t.toKey(),e),{refresh_token:e.body.refresh_token,audience:e.body.audience,scope:e.body.scope}}async set(e){var t;const o=new oe({clientId:e.client_id,scope:e.scope,audience:e.audience}),n=await this.wrapCacheEntry(e);await this.cache.set(o.toKey(),n),await(null===(t=this.keyManifest)||void 0===t?void 0:t.add(o.toKey()));}async remove(e,t,o){const n=new oe({clientId:e,scope:o,audience:t});await this.cache.remove(n.toKey());}async clear(e){var t;const o=await this.getCacheKeys();o&&(await o.filter((t=>!e||t.includes(e))).reduce((async(e,t)=>{await e,await this.cache.remove(t);}),Promise.resolve()),await(null===(t=this.keyManifest)||void 0===t?void 0:t.clear()));}async wrapCacheEntry(e){const t=await this.nowProvider();return {body:e,expiresAt:Math.floor(t/1e3)+e.expires_in}}async getCacheKeys(){var e;return this.keyManifest?null===(e=await this.keyManifest.get())||void 0===e?void 0:e.keys:this.cache.allKeys?this.cache.allKeys():void 0}getIdTokenCacheKey(e){return new oe({clientId:e},"@@auth0spajs@@","@@user@@").toKey()}matchExistingCacheKey(e,t){return t.filter((t=>{var o;const n=oe.fromKey(t),i=new Set(n.scope&&n.scope.split(" ")),r=(null===(o=e.scope)||void 0===o?void 0:o.split(" "))||[],s=n.scope&&r.reduce(((e,t)=>e&&i.has(t)),!0);return "@@auth0spajs@@"===n.prefix&&n.clientId===e.clientId&&n.audience===e.audience&&s}))[0]}async getEntryWithRefreshToken(e,t){var o;for(const n of t){const t=oe.fromKey(n);if("@@auth0spajs@@"===t.prefix&&t.clientId===e.clientId){const t=await this.cache.get(n);if(null===(o=null==t?void 0:t.body)||void 0===o?void 0:o.refresh_token)return this.modifiedCachedEntry(t,e)}}}async updateEntry(e,t){var o;const n=await this.getCacheKeys();if(n)for(const i of n){const n=await this.cache.get(i);if((null===(o=null==n?void 0:n.body)||void 0===o?void 0:o.refresh_token)===e){const e=Object.assign(Object.assign({},n.body),{refresh_token:t});await this.set(e);}}}}class se{constructor(e,t,o){this.storage=e,this.clientId=t,this.cookieDomain=o,this.storageKey=`a0.spajs.txs.${this.clientId}`;}create(e){this.storage.save(this.storageKey,e,{daysUntilExpire:1,cookieDomain:this.cookieDomain});}get(){return this.storage.get(this.storageKey)}remove(){this.storage.remove(this.storageKey,{cookieDomain:this.cookieDomain});}}const ae=e=>"number"==typeof e,ce=["iss","aud","exp","nbf","iat","jti","azp","nonce","auth_time","at_hash","c_hash","acr","amr","sub_jwk","cnf","sip_from_tag","sip_date","sip_callid","sip_cseq_num","sip_via_branch","orig","dest","mky","events","toe","txn","rph","sid","vot","vtm"],ue=e=>{if(!e.id_token)throw new Error("ID token is required but missing");const t=(e=>{const t=e.split("."),[o,n,i]=t;if(3!==t.length||!o||!n||!i)throw new Error("ID token could not be decoded");const r=JSON.parse(j(n)),s={__raw:e},a={};return Object.keys(r).forEach((e=>{s[e]=r[e],ce.includes(e)||(a[e]=r[e]);})),{encoded:{header:o,payload:n,signature:i},header:JSON.parse(j(o)),claims:s,user:a}})(e.id_token);if(!t.claims.iss)throw new Error("Issuer (iss) claim must be a string present in the ID token");if(t.claims.iss!==e.iss)throw new Error(`Issuer (iss) claim mismatch in the ID token; expected "${e.iss}", found "${t.claims.iss}"`);if(!t.user.sub)throw new Error("Subject (sub) claim must be a string present in the ID token");if("RS256"!==t.header.alg)throw new Error(`Signature algorithm of "${t.header.alg}" is not supported. Expected the ID token to be signed with "RS256".`);if(!t.claims.aud||"string"!=typeof t.claims.aud&&!Array.isArray(t.claims.aud))throw new Error("Audience (aud) claim must be a string or array of strings present in the ID token");if(Array.isArray(t.claims.aud)){if(!t.claims.aud.includes(e.aud))throw new Error(`Audience (aud) claim mismatch in the ID token; expected "${e.aud}" but was not one of "${t.claims.aud.join(", ")}"`);if(t.claims.aud.length>1){if(!t.claims.azp)throw new Error("Authorized Party (azp) claim must be a string present in the ID token when Audience (aud) claim has multiple values");if(t.claims.azp!==e.aud)throw new Error(`Authorized Party (azp) claim mismatch in the ID token; expected "${e.aud}", found "${t.claims.azp}"`)}}else if(t.claims.aud!==e.aud)throw new Error(`Audience (aud) claim mismatch in the ID token; expected "${e.aud}" but found "${t.claims.aud}"`);if(e.nonce){if(!t.claims.nonce)throw new Error("Nonce (nonce) claim must be a string present in the ID token");if(t.claims.nonce!==e.nonce)throw new Error(`Nonce (nonce) claim mismatch in the ID token; expected "${e.nonce}", found "${t.claims.nonce}"`)}if(e.max_age&&!ae(t.claims.auth_time))throw new Error("Authentication Time (auth_time) claim must be a number present in the ID token when Max Age (max_age) is specified");if(null==t.claims.exp||!ae(t.claims.exp))throw new Error("Expiration Time (exp) claim must be a number present in the ID token");if(!ae(t.claims.iat))throw new Error("Issued At (iat) claim must be a number present in the ID token");const o=e.leeway||60,n=new Date(e.now||Date.now()),i=new Date(0);if(i.setUTCSeconds(t.claims.exp+o),n>i)throw new Error(`Expiration Time (exp) claim error in the ID token; current time (${n}) is after expiration time (${i})`);if(null!=t.claims.nbf&&ae(t.claims.nbf)){const e=new Date(0);if(e.setUTCSeconds(t.claims.nbf-o),n<e)throw new Error(`Not Before time (nbf) claim in the ID token indicates that this token can't be used just yet. Current time (${n}) is before ${e}`)}if(null!=t.claims.auth_time&&ae(t.claims.auth_time)){const i=new Date(0);if(i.setUTCSeconds(parseInt(t.claims.auth_time)+e.max_age+o),n>i)throw new Error(`Authentication Time (auth_time) claim in the ID token indicates that too much time has passed since the last end-user authentication. Current time (${n}) is after last auth at ${i}`)}if(e.organization){const o=e.organization.trim();if(o.startsWith("org_")){const e=o;if(!t.claims.org_id)throw new Error("Organization ID (org_id) claim must be a string present in the ID token");if(e!==t.claims.org_id)throw new Error(`Organization ID (org_id) claim mismatch in the ID token; expected "${e}", found "${t.claims.org_id}"`)}else {const e=o.toLowerCase();if(!t.claims.org_name)throw new Error("Organization Name (org_name) claim must be a string present in the ID token");if(e!==t.claims.org_name)throw new Error(`Organization Name (org_name) claim mismatch in the ID token; expected "${e}", found "${t.claims.org_name}"`)}}return t};var de=n((function(e,o){var n=t&&t.__assign||function(){return n=Object.assign||function(e){for(var t,o=1,n=arguments.length;o<n;o++)for(var i in t=arguments[o])Object.prototype.hasOwnProperty.call(t,i)&&(e[i]=t[i]);return e},n.apply(this,arguments)};function i(e,t){if(!t)return "";var o="; "+e;return !0===t?o:o+"="+t}function r(e,t,o){return encodeURIComponent(e).replace(/%(23|24|26|2B|5E|60|7C)/g,decodeURIComponent).replace(/\(/g,"%28").replace(/\)/g,"%29")+"="+encodeURIComponent(t).replace(/%(23|24|26|2B|3A|3C|3E|3D|2F|3F|40|5B|5D|5E|60|7B|7D|7C)/g,decodeURIComponent)+function(e){if("number"==typeof e.expires){var t=new Date;t.setMilliseconds(t.getMilliseconds()+864e5*e.expires),e.expires=t;}return i("Expires",e.expires?e.expires.toUTCString():"")+i("Domain",e.domain)+i("Path",e.path)+i("Secure",e.secure)+i("SameSite",e.sameSite)}(o)}function s(e){for(var t={},o=e?e.split("; "):[],n=/(%[\dA-F]{2})+/gi,i=0;i<o.length;i++){var r=o[i].split("="),s=r.slice(1).join("=");'"'===s.charAt(0)&&(s=s.slice(1,-1));try{t[r[0].replace(n,decodeURIComponent)]=s.replace(n,decodeURIComponent);}catch(e){}}return t}function a(){return s(document.cookie)}function c(e,t,o){document.cookie=r(e,t,n({path:"/"},o));}o.__esModule=!0,o.encode=r,o.parse=s,o.getAll=a,o.get=function(e){return a()[e]},o.set=c,o.remove=function(e,t){c(e,"",n(n({},t),{expires:-1}));};}));o(de),de.encode,de.parse,de.getAll;var he=de.get,le=de.set,pe=de.remove;const me={get(e){const t=he(e);if(void 0!==t)return JSON.parse(t)},save(e,t,o){let n={};"https:"===window.location.protocol&&(n={secure:!0,sameSite:"none"}),(null==o?void 0:o.daysUntilExpire)&&(n.expires=o.daysUntilExpire),(null==o?void 0:o.cookieDomain)&&(n.domain=o.cookieDomain),le(e,JSON.stringify(t),n);},remove(e,t){let o={};(null==t?void 0:t.cookieDomain)&&(o.domain=t.cookieDomain),pe(e,o);}},fe={get(e){const t=me.get(e);return t||me.get(`_legacy_${e}`)},save(e,t,o){let n={};"https:"===window.location.protocol&&(n={secure:!0}),(null==o?void 0:o.daysUntilExpire)&&(n.expires=o.daysUntilExpire),(null==o?void 0:o.cookieDomain)&&(n.domain=o.cookieDomain),le(`_legacy_${e}`,JSON.stringify(t),n),me.save(e,t,o);},remove(e,t){let o={};(null==t?void 0:t.cookieDomain)&&(o.domain=t.cookieDomain),pe(e,o),me.remove(e,t),me.remove(`_legacy_${e}`,t);}},ge={get(e){if("undefined"==typeof sessionStorage)return;const t=sessionStorage.getItem(e);return null!=t?JSON.parse(t):void 0},save(e,t){sessionStorage.setItem(e,JSON.stringify(t));},remove(e){sessionStorage.removeItem(e);}};exports.ResponseType = void 0;!function(e){e.Code="code",e.ConnectCode="connect_code";}(exports.ResponseType||(exports.ResponseType={}));class we{}function be(e,t,o){var n=void 0===t?null:t,i=function(e,t){var o=atob(e);if(t){for(var n=new Uint8Array(o.length),i=0,r=o.length;i<r;++i)n[i]=o.charCodeAt(i);return String.fromCharCode.apply(null,new Uint16Array(n.buffer))}return o}(e,void 0!==o&&o),r=i.indexOf("\n",10)+1,s=i.substring(r)+(n?"//# sourceMappingURL="+n:""),a=new Blob([s],{type:"application/javascript"});return URL.createObjectURL(a)}var ke,ve,_e,Se,Ie=(ke="Lyogcm9sbHVwLXBsdWdpbi13ZWItd29ya2VyLWxvYWRlciAqLwohZnVuY3Rpb24oKXsidXNlIHN0cmljdCI7Y2xhc3MgZSBleHRlbmRzIEVycm9ye2NvbnN0cnVjdG9yKHQscil7c3VwZXIociksdGhpcy5lcnJvcj10LHRoaXMuZXJyb3JfZGVzY3JpcHRpb249cixPYmplY3Quc2V0UHJvdG90eXBlT2YodGhpcyxlLnByb3RvdHlwZSl9c3RhdGljIGZyb21QYXlsb2FkKHtlcnJvcjp0LGVycm9yX2Rlc2NyaXB0aW9uOnJ9KXtyZXR1cm4gbmV3IGUodCxyKX19Y2xhc3MgdCBleHRlbmRzIGV7Y29uc3RydWN0b3IoZSxzKXtzdXBlcigibWlzc2luZ19yZWZyZXNoX3Rva2VuIixgTWlzc2luZyBSZWZyZXNoIFRva2VuIChhdWRpZW5jZTogJyR7cihlLFsiZGVmYXVsdCJdKX0nLCBzY29wZTogJyR7cihzKX0nKWApLHRoaXMuYXVkaWVuY2U9ZSx0aGlzLnNjb3BlPXMsT2JqZWN0LnNldFByb3RvdHlwZU9mKHRoaXMsdC5wcm90b3R5cGUpfX1mdW5jdGlvbiByKGUsdD1bXSl7cmV0dXJuIGUmJiF0LmluY2x1ZGVzKGUpP2U6IiJ9ImZ1bmN0aW9uIj09dHlwZW9mIFN1cHByZXNzZWRFcnJvciYmU3VwcHJlc3NlZEVycm9yO2NvbnN0IHM9ZT0+e3ZhcntjbGllbnRJZDp0fT1lLHI9ZnVuY3Rpb24oZSx0KXt2YXIgcj17fTtmb3IodmFyIHMgaW4gZSlPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwoZSxzKSYmdC5pbmRleE9mKHMpPDAmJihyW3NdPWVbc10pO2lmKG51bGwhPWUmJiJmdW5jdGlvbiI9PXR5cGVvZiBPYmplY3QuZ2V0T3duUHJvcGVydHlTeW1ib2xzKXt2YXIgbz0wO2ZvcihzPU9iamVjdC5nZXRPd25Qcm9wZXJ0eVN5bWJvbHMoZSk7bzxzLmxlbmd0aDtvKyspdC5pbmRleE9mKHNbb10pPDAmJk9iamVjdC5wcm90b3R5cGUucHJvcGVydHlJc0VudW1lcmFibGUuY2FsbChlLHNbb10pJiYocltzW29dXT1lW3Nbb11dKX1yZXR1cm4gcn0oZSxbImNsaWVudElkIl0pO3JldHVybiBuZXcgVVJMU2VhcmNoUGFyYW1zKChlPT5PYmplY3Qua2V5cyhlKS5maWx0ZXIoKHQ9PnZvaWQgMCE9PWVbdF0pKS5yZWR1Y2UoKCh0LHIpPT5PYmplY3QuYXNzaWduKE9iamVjdC5hc3NpZ24oe30sdCkse1tyXTplW3JdfSkpLHt9KSkoT2JqZWN0LmFzc2lnbih7Y2xpZW50X2lkOnR9LHIpKSkudG9TdHJpbmcoKX07bGV0IG89e307Y29uc3Qgbj0oZSx0KT0+YCR7ZX18JHt0fWA7YWRkRXZlbnRMaXN0ZW5lcigibWVzc2FnZSIsKGFzeW5jKHtkYXRhOnt0aW1lb3V0OmUsYXV0aDpyLGZldGNoVXJsOmksZmV0Y2hPcHRpb25zOmMsdXNlRm9ybURhdGE6YSx1c2VNcnJ0OmZ9LHBvcnRzOltwXX0pPT57bGV0IGgsdSxsPXt9O2NvbnN0e2F1ZGllbmNlOmQsc2NvcGU6eX09cnx8e307dHJ5e2NvbnN0IHI9YT8oZT0+e2NvbnN0IHQ9bmV3IFVSTFNlYXJjaFBhcmFtcyhlKSxyPXt9O3JldHVybiB0LmZvckVhY2goKChlLHQpPT57clt0XT1lfSkpLHJ9KShjLmJvZHkpOkpTT04ucGFyc2UoYy5ib2R5KTtpZighci5yZWZyZXNoX3Rva2VuJiYicmVmcmVzaF90b2tlbiI9PT1yLmdyYW50X3R5cGUpe2lmKHU9KChlLHQpPT5vW24oZSx0KV0pKGQseSksIXUmJmYpe2NvbnN0IGU9by5sYXRlc3RfcmVmcmVzaF90b2tlbix0PSgoZSx0KT0+e2NvbnN0IHI9T2JqZWN0LmtleXMobykuZmluZCgocj0+e2lmKCJsYXRlc3RfcmVmcmVzaF90b2tlbiIhPT1yKXtjb25zdCBzPSgoZSx0KT0+dC5zdGFydHNXaXRoKGAke2V9fGApKSh0LHIpLG89ci5zcGxpdCgifCIpWzFdLnNwbGl0KCIgIiksbj1lLnNwbGl0KCIgIikuZXZlcnkoKGU9Pm8uaW5jbHVkZXMoZSkpKTtyZXR1cm4gcyYmbn19KSk7cmV0dXJuISFyfSkoeSxkKTtlJiYhdCYmKHU9ZSl9aWYoIXUpdGhyb3cgbmV3IHQoZCx5KTtjLmJvZHk9YT9zKE9iamVjdC5hc3NpZ24oT2JqZWN0LmFzc2lnbih7fSxyKSx7cmVmcmVzaF90b2tlbjp1fSkpOkpTT04uc3RyaW5naWZ5KE9iamVjdC5hc3NpZ24oT2JqZWN0LmFzc2lnbih7fSxyKSx7cmVmcmVzaF90b2tlbjp1fSkpfWxldCBqLGs7ImZ1bmN0aW9uIj09dHlwZW9mIEFib3J0Q29udHJvbGxlciYmKGo9bmV3IEFib3J0Q29udHJvbGxlcixjLnNpZ25hbD1qLnNpZ25hbCk7dHJ5e2s9YXdhaXQgUHJvbWlzZS5yYWNlKFsoXz1lLG5ldyBQcm9taXNlKChlPT5zZXRUaW1lb3V0KGUsXykpKSksZmV0Y2goaSxPYmplY3QuYXNzaWduKHt9LGMpKV0pfWNhdGNoKGUpe3JldHVybiB2b2lkIHAucG9zdE1lc3NhZ2Uoe2Vycm9yOmUubWVzc2FnZX0pfWlmKCFrKXJldHVybiBqJiZqLmFib3J0KCksdm9pZCBwLnBvc3RNZXNzYWdlKHtlcnJvcjoiVGltZW91dCB3aGVuIGV4ZWN1dGluZyAnZmV0Y2gnIn0pO2c9ay5oZWFkZXJzLGw9Wy4uLmddLnJlZHVjZSgoKGUsW3Qscl0pPT4oZVt0XT1yLGUpKSx7fSksaD1hd2FpdCBrLmpzb24oKSxoLnJlZnJlc2hfdG9rZW4/KGYmJihvLmxhdGVzdF9yZWZyZXNoX3Rva2VuPWgucmVmcmVzaF90b2tlbixPPXUsYj1oLnJlZnJlc2hfdG9rZW4sT2JqZWN0LmVudHJpZXMobykuZm9yRWFjaCgoKFtlLHRdKT0+e3Q9PT1PJiYob1tlXT1iKX0pKSksKChlLHQscik9PntvW24odCxyKV09ZX0pKGgucmVmcmVzaF90b2tlbixkLHkpLGRlbGV0ZSBoLnJlZnJlc2hfdG9rZW4pOigoZSx0KT0+e2RlbGV0ZSBvW24oZSx0KV19KShkLHkpLHAucG9zdE1lc3NhZ2Uoe29rOmsub2ssanNvbjpoLGhlYWRlcnM6bH0pfWNhdGNoKGUpe3AucG9zdE1lc3NhZ2Uoe29rOiExLGpzb246e2Vycm9yOmUuZXJyb3IsZXJyb3JfZGVzY3JpcHRpb246ZS5tZXNzYWdlfSxoZWFkZXJzOmx9KX12YXIgTyxiLGcsX30pKX0oKTsKCg==",ve=null,_e=!1,function(e){return Se=Se||be(ke,ve,_e),new Worker(Se,e)});const Pe={};class Te{constructor(e,t){this.cache=e,this.clientId=t,this.manifestKey=this.createManifestKeyFrom(this.clientId);}async add(e){var t;const o=new Set((null===(t=await this.cache.get(this.manifestKey))||void 0===t?void 0:t.keys)||[]);o.add(e),await this.cache.set(this.manifestKey,{keys:[...o]});}async remove(e){const t=await this.cache.get(this.manifestKey);if(t){const o=new Set(t.keys);return o.delete(e),o.size>0?await this.cache.set(this.manifestKey,{keys:[...o]}):await this.cache.remove(this.manifestKey)}}get(){return this.cache.get(this.manifestKey)}clear(){return this.cache.remove(this.manifestKey)}createManifestKeyFrom(e){return `@@auth0spajs@@::${e}`}}const Oe={memory:()=>(new ie).enclosedCache,localstorage:()=>new ne},je=e=>Oe[e],Ce=t=>{const{openUrl:o,onRedirect:n}=t,i=e(t,["openUrl","onRedirect"]);return Object.assign(Object.assign({},i),{openUrl:!1===o||o?o:n})},Ke=(e,t)=>{const o=(null==t?void 0:t.split(" "))||[];return ((null==e?void 0:e.split(" "))||[]).every((e=>o.includes(e)))},xe={NONCE:"nonce",KEYPAIR:"keypair"};class ze{constructor(e){this.clientId=e;}getVersion(){return 1}createDbHandle(){const e=window.indexedDB.open("auth0-spa-js",this.getVersion());return new Promise(((t,o)=>{e.onupgradeneeded=()=>Object.values(xe).forEach((t=>e.result.createObjectStore(t))),e.onerror=()=>o(e.error),e.onsuccess=()=>t(e.result);}))}async getDbHandle(){return this.dbHandle||(this.dbHandle=await this.createDbHandle()),this.dbHandle}async executeDbRequest(e,t,o){const n=o((await this.getDbHandle()).transaction(e,t).objectStore(e));return new Promise(((e,t)=>{n.onsuccess=()=>e(n.result),n.onerror=()=>t(n.error);}))}buildKey(e){const t=e?`_${e}`:"auth0";return `${this.clientId}::${t}`}setNonce(e,t){return this.save(xe.NONCE,this.buildKey(t),e)}setKeyPair(e){return this.save(xe.KEYPAIR,this.buildKey(),e)}async save(e,t,o){await this.executeDbRequest(e,"readwrite",(e=>e.put(o,t)));}findNonce(e){return this.find(xe.NONCE,this.buildKey(e))}findKeyPair(){return this.find(xe.KEYPAIR,this.buildKey())}find(e,t){return this.executeDbRequest(e,"readonly",(e=>e.get(t)))}async deleteBy(e,t){const o=await this.executeDbRequest(e,"readonly",(e=>e.getAllKeys()));null==o||o.filter(t).map((t=>this.executeDbRequest(e,"readwrite",(e=>e.delete(t)))));}deleteByClientId(e,t){return this.deleteBy(e,(e=>"string"==typeof e&&e.startsWith(`${t}::`)))}clearNonces(){return this.deleteByClientId(xe.NONCE,this.clientId)}clearKeyPairs(){return this.deleteByClientId(xe.KEYPAIR,this.clientId)}}class Ee{constructor(e){this.storage=new ze(e);}getNonce(e){return this.storage.findNonce(e)}setNonce(e,t){return this.storage.setNonce(e,t)}async getOrGenerateKeyPair(){let e=await this.storage.findKeyPair();return e||(e=await V(),await this.storage.setKeyPair(e)),e}async generateProof(e){const t=await this.getOrGenerateKeyPair();return G(Object.assign({keyPair:t},e))}async calculateThumbprint(){return F(await this.getOrGenerateKeyPair())}async clear(){await Promise.all([this.storage.clearNonces(),this.storage.clearKeyPairs()]);}}var Ne;!function(e){e.Bearer="Bearer",e.DPoP="DPoP";}(Ne||(Ne={}));class Re{constructor(e,t){this.hooks=t,this.config=Object.assign(Object.assign({},e),{fetch:e.fetch||("undefined"==typeof window?fetch:window.fetch.bind(window))});}isAbsoluteUrl(e){return /^(https?:)?\/\//i.test(e)}buildUrl(e,t){if(t){if(this.isAbsoluteUrl(t))return t;if(e)return `${e.replace(/\/?\/$/,"")}/${t.replace(/^\/+/,"")}`}throw new TypeError("`url` must be absolute or `baseUrl` non-empty.")}getAccessToken(e){return this.config.getAccessToken?this.config.getAccessToken(e):this.hooks.getAccessToken(e)}extractUrl(e){return "string"==typeof e?e:e instanceof URL?e.href:e.url}buildBaseRequest(e,t){if(!this.config.baseUrl)return new Request(e,t);const o=this.buildUrl(this.config.baseUrl,this.extractUrl(e)),n=e instanceof Request?new Request(o,e):o;return new Request(n,t)}setAuthorizationHeader(e,t,o=Ne.Bearer){e.headers.set("authorization",`${o} ${t}`);}async setDpopProofHeader(e,t){if(!this.config.dpopNonceId)return;const o=await this.hooks.getDpopNonce(),n=await this.hooks.generateDpopProof({accessToken:t,method:e.method,nonce:o,url:e.url});e.headers.set("dpop",n);}async prepareRequest(e,t){const o=await this.getAccessToken(t);let n,i;"string"==typeof o?(n=this.config.dpopNonceId?Ne.DPoP:Ne.Bearer,i=o):(n=o.token_type,i=o.access_token),this.setAuthorizationHeader(e,i,n),n===Ne.DPoP&&await this.setDpopProofHeader(e,i);}getHeader(e,t){return Array.isArray(e)?new Headers(e).get(t)||"":"function"==typeof e.get?e.get(t)||"":e[t]||""}hasUseDpopNonceError(e){if(401!==e.status)return !1;const t=this.getHeader(e.headers,"www-authenticate");return t.includes("invalid_dpop_nonce")||t.includes("use_dpop_nonce")}async handleResponse(e,t){const o=this.getHeader(e.headers,"dpop-nonce");if(o&&await this.hooks.setDpopNonce(o),!this.hasUseDpopNonceError(e))return e;if(!o||!t.onUseDpopNonceError)throw new b(o);return t.onUseDpopNonceError()}async internalFetchWithAuth(e,t,o,n){const i=this.buildBaseRequest(e,t);await this.prepareRequest(i,n);const r=await this.config.fetch(i);return this.handleResponse(r,o)}fetchWithAuth(e,t,o){const n={onUseDpopNonceError:()=>this.internalFetchWithAuth(e,t,Object.assign(Object.assign({},n),{onUseDpopNonceError:void 0}),o)};return this.internalFetchWithAuth(e,t,n,o)}}class De{constructor(e,t){this.myAccountFetcher=e,this.apiBase=t;}async connectAccount(e){const t=await this.myAccountFetcher.fetchWithAuth(`${this.apiBase}v1/connected-accounts/connect`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(e)});return this._handleResponse(t)}async completeAccount(e){const t=await this.myAccountFetcher.fetchWithAuth(`${this.apiBase}v1/connected-accounts/complete`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(e)});return this._handleResponse(t)}async _handleResponse(e){let t;try{t=await e.text(),t=JSON.parse(t);}catch(o){throw new Ae({type:"invalid_json",status:e.status,title:"Invalid JSON response",detail:t||String(o)})}if(e.ok)return t;throw new Ae(t)}}class Ae extends Error{constructor({type:e,status:t,title:o,detail:n,validation_errors:i}){super(n),this.name="MyAccountApiError",this.type=e,this.status=t,this.title=o,this.detail=n,this.validation_errors=i,Object.setPrototypeOf(this,Ae.prototype);}}const Ue=new r;class Le{constructor(e){let t,o;if(this.userCache=(new ie).enclosedCache,this.activeLockKeys=new Set,this.defaultOptions={authorizationParams:{scope:"openid profile email"},useRefreshTokensFallback:!1,useFormData:!0},this._releaseLockOnPageHide=async()=>{const e=Array.from(this.activeLockKeys);for(const t of e)await Ue.releaseLock(t);this.activeLockKeys.clear(),window.removeEventListener("pagehide",this._releaseLockOnPageHide);},this.options=Object.assign(Object.assign(Object.assign({},this.defaultOptions),e),{authorizationParams:Object.assign(Object.assign({},this.defaultOptions.authorizationParams),e.authorizationParams)}),"undefined"!=typeof window&&(()=>{if(!v())throw new Error("For security reasons, `window.crypto` is required to run `auth0-spa-js`.");if(void 0===v().subtle)throw new Error("\n      auth0-spa-js must run on a secure origin. See https://github.com/auth0/auth0-spa-js/blob/main/FAQ.md#why-do-i-get-auth0-spa-js-must-run-on-a-secure-origin for more information.\n    ")})(),e.cache&&e.cacheLocation&&console.warn("Both `cache` and `cacheLocation` options have been specified in the Auth0Client configuration; ignoring `cacheLocation` and using `cache`."),e.cache)o=e.cache;else {if(t=e.cacheLocation||"memory",!je(t))throw new Error(`Invalid cache location "${t}"`);o=je(t)();}this.httpTimeoutMs=e.httpTimeoutInSeconds?1e3*e.httpTimeoutInSeconds:1e4,this.cookieStorage=!1===e.legacySameSiteCookie?me:fe,this.orgHintCookieName=`auth0.${this.options.clientId}.organization_hint`,this.isAuthenticatedCookieName=(e=>`auth0.${e}.is.authenticated`)(this.options.clientId),this.sessionCheckExpiryDays=e.sessionCheckExpiryDays||1;const n=e.useCookiesForTransactions?this.cookieStorage:ge;var i;this.scope=((e,t,...o)=>{if("object"!=typeof e)return {default:ee(t,e,...o)};let n={default:ee(t,...o)};return Object.keys(e).forEach((i=>{const r=e[i];n[i]=ee(t,r,...o);})),n})(this.options.authorizationParams.scope,"openid",this.options.useRefreshTokens?"offline_access":""),this.transactionManager=new se(n,this.options.clientId,this.options.cookieDomain),this.nowProvider=this.options.nowProvider||c,this.cacheManager=new re(o,o.allKeys?void 0:new Te(o,this.options.clientId),this.nowProvider),this.dpop=this.options.useDpop?new Ee(this.options.clientId):void 0,this.domainUrl=(i=this.options.domain,/^https?:\/\//.test(i)?i:`https://${i}`),this.tokenIssuer=((e,t)=>e?e.startsWith("https://")?e:`https://${e}/`:`${t}/`)(this.options.issuer,this.domainUrl);const r=`${this.domainUrl}/me/`,s=this.createFetcher(Object.assign(Object.assign({},this.options.useDpop&&{dpopNonceId:"__auth0_my_account_api__"}),{getAccessToken:()=>this.getTokenSilently({authorizationParams:{scope:"create:me:connected_accounts",audience:r},detailedResponse:!0})}));this.myAccountApi=new De(s,r),"undefined"!=typeof window&&window.Worker&&this.options.useRefreshTokens&&"memory"===t&&(this.options.workerUrl?this.worker=new Worker(this.options.workerUrl):this.worker=new Ie);}_url(e){const t=encodeURIComponent(btoa(JSON.stringify(this.options.auth0Client||a)));return `${this.domainUrl}${e}&auth0Client=${t}`}_authorizeUrl(e){return this._url(`/authorize?${T(e)}`)}async _verifyIdToken(e,t,o){const n=await this.nowProvider();return ue({iss:this.tokenIssuer,aud:this.options.clientId,id_token:e,nonce:t,organization:o,leeway:this.options.leeway,max_age:(i=this.options.authorizationParams.max_age,"string"!=typeof i?i:parseInt(i,10)||void 0),now:n});var i;}_processOrgHint(e){e?this.cookieStorage.save(this.orgHintCookieName,e,{daysUntilExpire:this.sessionCheckExpiryDays,cookieDomain:this.options.cookieDomain}):this.cookieStorage.remove(this.orgHintCookieName,{cookieDomain:this.options.cookieDomain});}async _prepareAuthorizeUrl(e,t,o){var n;const i=S(_()),r=S(_()),s=_(),a=await O(s),c=C(a),u=await(null===(n=this.dpop)||void 0===n?void 0:n.calculateThumbprint()),d=((e,t,o,n,i,r,s,a,c)=>Object.assign(Object.assign(Object.assign({client_id:e.clientId},e.authorizationParams),o),{scope:te(t,o.scope,o.audience),response_type:"code",response_mode:a||"query",state:n,nonce:i,redirect_uri:s||e.authorizationParams.redirect_uri,code_challenge:r,code_challenge_method:"S256",dpop_jkt:c}))(this.options,this.scope,e,i,r,c,e.redirect_uri||this.options.authorizationParams.redirect_uri||o,null==t?void 0:t.response_mode,u),h=this._authorizeUrl(d);return {nonce:r,code_verifier:s,scope:d.scope,audience:d.audience||"default",redirect_uri:d.redirect_uri,state:i,url:h}}async loginWithPopup(e,t){var o;if(e=e||{},!(t=t||{}).popup&&(t.popup=(e=>{const t=window.screenX+(window.innerWidth-400)/2,o=window.screenY+(window.innerHeight-600)/2;return window.open(e,"auth0:authorize:popup",`left=${t},top=${o},width=400,height=600,resizable,scrollbars=yes,status=1`)})(""),!t.popup))throw new f;const n=await this._prepareAuthorizeUrl(e.authorizationParams||{},{response_mode:"web_message"},window.location.origin);t.popup.location.href=n.url;const i=await(e=>new Promise(((t,o)=>{let n;const i=setInterval((()=>{e.popup&&e.popup.closed&&(clearInterval(i),clearTimeout(r),window.removeEventListener("message",n,!1),o(new m(e.popup)));}),1e3),r=setTimeout((()=>{clearInterval(i),o(new p(e.popup)),window.removeEventListener("message",n,!1);}),1e3*(e.timeoutInSeconds||60));n=function(s){if(s.data&&"authorization_response"===s.data.type){if(clearTimeout(r),clearInterval(i),window.removeEventListener("message",n,!1),e.popup.close(),s.data.response.error)return o(u.fromPayload(s.data.response));t(s.data.response);}},window.addEventListener("message",n);})))(Object.assign(Object.assign({},t),{timeoutInSeconds:t.timeoutInSeconds||this.options.authorizeTimeoutInSeconds||60}));if(n.state!==i.state)throw new u("state_mismatch","Invalid state");const r=(null===(o=e.authorizationParams)||void 0===o?void 0:o.organization)||this.options.authorizationParams.organization;await this._requestToken({audience:n.audience,scope:n.scope,code_verifier:n.code_verifier,grant_type:"authorization_code",code:i.code,redirect_uri:n.redirect_uri},{nonceIn:n.nonce,organization:r});}async getUser(){var e;const t=await this._getIdTokenFromCache();return null===(e=null==t?void 0:t.decodedToken)||void 0===e?void 0:e.user}async getIdTokenClaims(){var e;const t=await this._getIdTokenFromCache();return null===(e=null==t?void 0:t.decodedToken)||void 0===e?void 0:e.claims}async loginWithRedirect(t={}){var o;const n=Ce(t),{openUrl:i,fragment:r,appState:s}=n,a=e(n,["openUrl","fragment","appState"]),c=(null===(o=a.authorizationParams)||void 0===o?void 0:o.organization)||this.options.authorizationParams.organization,u=await this._prepareAuthorizeUrl(a.authorizationParams||{}),{url:d}=u,h=e(u,["url"]);this.transactionManager.create(Object.assign(Object.assign(Object.assign({},h),{appState:s,response_type:exports.ResponseType.Code}),c&&{organization:c}));const l=r?`${d}#${r}`:d;i?await i(l):window.location.assign(l);}async handleRedirectCallback(e=window.location.href){const t=e.split("?").slice(1);if(0===t.length)throw new Error("There are no query params available for parsing.");const o=this.transactionManager.get();if(!o)throw new u("missing_transaction","Invalid state");this.transactionManager.remove();const n=(e=>{e.indexOf("#")>-1&&(e=e.substring(0,e.indexOf("#")));const t=new URLSearchParams(e);return {state:t.get("state"),code:t.get("code")||void 0,connect_code:t.get("connect_code")||void 0,error:t.get("error")||void 0,error_description:t.get("error_description")||void 0}})(t.join(""));return o.response_type===exports.ResponseType.ConnectCode?this._handleConnectAccountRedirectCallback(n,o):this._handleLoginRedirectCallback(n,o)}async _handleLoginRedirectCallback(e,t){const{code:o,state:n,error:i,error_description:r}=e;if(i)throw new d(i,r||i,n,t.appState);if(!t.code_verifier||t.state&&t.state!==n)throw new u("state_mismatch","Invalid state");const s=t.organization,a=t.nonce,c=t.redirect_uri;return await this._requestToken(Object.assign({audience:t.audience,scope:t.scope,code_verifier:t.code_verifier,grant_type:"authorization_code",code:o},c?{redirect_uri:c}:{}),{nonceIn:a,organization:s}),{appState:t.appState,response_type:exports.ResponseType.Code}}async _handleConnectAccountRedirectCallback(e,t){const{connect_code:o,state:n,error:i,error_description:r}=e;if(i)throw new h(i,r||i,t.connection,n,t.appState);if(!o)throw new u("missing_connect_code","Missing connect code");if(!(t.code_verifier&&t.state&&t.auth_session&&t.redirect_uri&&t.state===n))throw new u("state_mismatch","Invalid state");const s=await this.myAccountApi.completeAccount({auth_session:t.auth_session,connect_code:o,redirect_uri:t.redirect_uri,code_verifier:t.code_verifier});return Object.assign(Object.assign({},s),{appState:t.appState,response_type:exports.ResponseType.ConnectCode})}async checkSession(e){if(!this.cookieStorage.get(this.isAuthenticatedCookieName)){if(!this.cookieStorage.get("auth0.is.authenticated"))return;this.cookieStorage.save(this.isAuthenticatedCookieName,!0,{daysUntilExpire:this.sessionCheckExpiryDays,cookieDomain:this.options.cookieDomain}),this.cookieStorage.remove("auth0.is.authenticated");}try{await this.getTokenSilently(e);}catch(e){}}async getTokenSilently(e={}){var t,o;const n=Object.assign(Object.assign({cacheMode:"on"},e),{authorizationParams:Object.assign(Object.assign(Object.assign({},this.options.authorizationParams),e.authorizationParams),{scope:te(this.scope,null===(t=e.authorizationParams)||void 0===t?void 0:t.scope,(null===(o=e.authorizationParams)||void 0===o?void 0:o.audience)||this.options.authorizationParams.audience)})}),i=await((e,t)=>{let o=Pe[t];return o||(o=e().finally((()=>{delete Pe[t],o=null;})),Pe[t]=o),o})((()=>this._getTokenSilently(n)),`${this.options.clientId}::${n.authorizationParams.audience}::${n.authorizationParams.scope}`);return e.detailedResponse?i:null==i?void 0:i.access_token}async _getTokenSilently(t){const{cacheMode:o}=t,n=e(t,["cacheMode"]);if("off"!==o){const e=await this._getEntryFromCache({scope:n.authorizationParams.scope,audience:n.authorizationParams.audience||"default",clientId:this.options.clientId,cacheMode:o});if(e)return e}if("cache-only"===o)return;const i=(r=this.options.clientId,s=n.authorizationParams.audience||"default",`auth0.lock.getTokenSilently.${r}.${s}`);var r,s;if(!await(async(e,t=3)=>{for(let o=0;o<t;o++)if(await e())return !0;return !1})((()=>Ue.acquireLock(i,5e3)),10))throw new l;this.activeLockKeys.add(i),1===this.activeLockKeys.size&&window.addEventListener("pagehide",this._releaseLockOnPageHide);try{if("off"!==o){const e=await this._getEntryFromCache({scope:n.authorizationParams.scope,audience:n.authorizationParams.audience||"default",clientId:this.options.clientId});if(e)return e}const e=this.options.useRefreshTokens?await this._getTokenUsingRefreshToken(n):await this._getTokenFromIFrame(n),{id_token:t,token_type:r,access_token:s,oauthTokenScope:a,expires_in:c}=e;return Object.assign(Object.assign({id_token:t,token_type:r,access_token:s},a?{scope:a}:null),{expires_in:c})}finally{await Ue.releaseLock(i),this.activeLockKeys.delete(i),0===this.activeLockKeys.size&&window.removeEventListener("pagehide",this._releaseLockOnPageHide);}}async getTokenWithPopup(e={},t={}){var o,n;const i=Object.assign(Object.assign({},e),{authorizationParams:Object.assign(Object.assign(Object.assign({},this.options.authorizationParams),e.authorizationParams),{scope:te(this.scope,null===(o=e.authorizationParams)||void 0===o?void 0:o.scope,(null===(n=e.authorizationParams)||void 0===n?void 0:n.audience)||this.options.authorizationParams.audience)})});t=Object.assign(Object.assign({},s),t),await this.loginWithPopup(i,t);return (await this.cacheManager.get(new oe({scope:i.authorizationParams.scope,audience:i.authorizationParams.audience||"default",clientId:this.options.clientId}),void 0,this.options.useMrrt)).access_token}async isAuthenticated(){return !!await this.getUser()}_buildLogoutUrl(t){null!==t.clientId?t.clientId=t.clientId||this.options.clientId:delete t.clientId;const o=t.logoutParams||{},{federated:n}=o,i=e(o,["federated"]),r=n?"&federated":"";return this._url(`/v2/logout?${T(Object.assign({clientId:t.clientId},i))}`)+r}async logout(t={}){var o;const n=Ce(t),{openUrl:i}=n,r=e(n,["openUrl"]);null===t.clientId?await this.cacheManager.clear():await this.cacheManager.clear(t.clientId||this.options.clientId),this.cookieStorage.remove(this.orgHintCookieName,{cookieDomain:this.options.cookieDomain}),this.cookieStorage.remove(this.isAuthenticatedCookieName,{cookieDomain:this.options.cookieDomain}),this.userCache.remove("@@user@@"),await(null===(o=this.dpop)||void 0===o?void 0:o.clear());const s=this._buildLogoutUrl(r);i?await i(s):!1!==i&&window.location.assign(s);}async _getTokenFromIFrame(e){const t=Object.assign(Object.assign({},e.authorizationParams),{prompt:"none"}),o=this.cookieStorage.get(this.orgHintCookieName);o&&!t.organization&&(t.organization=o);const{url:n,state:i,nonce:r,code_verifier:s,redirect_uri:a,scope:c,audience:d}=await this._prepareAuthorizeUrl(t,{response_mode:"web_message"},window.location.origin);try{if(window.crossOriginIsolated)throw new u("login_required","The application is running in a Cross-Origin Isolated context, silently retrieving a token without refresh token is not possible.");const o=e.timeoutInSeconds||this.options.authorizeTimeoutInSeconds;let h;try{h=new URL(this.domainUrl).origin;}catch(e){h=this.domainUrl;}const p=await((e,t,o=60)=>new Promise(((n,i)=>{const r=window.document.createElement("iframe");r.setAttribute("width","0"),r.setAttribute("height","0"),r.style.display="none";const s=()=>{window.document.body.contains(r)&&(window.document.body.removeChild(r),window.removeEventListener("message",a,!1));};let a;const c=setTimeout((()=>{i(new l),s();}),1e3*o);a=function(e){if(e.origin!=t)return;if(!e.data||"authorization_response"!==e.data.type)return;const o=e.source;o&&o.close(),e.data.response.error?i(u.fromPayload(e.data.response)):n(e.data.response),clearTimeout(c),window.removeEventListener("message",a,!1),setTimeout(s,2e3);},window.addEventListener("message",a,!1),window.document.body.appendChild(r),r.setAttribute("src",e);})))(n,h,o);if(i!==p.state)throw new u("state_mismatch","Invalid state");const m=await this._requestToken(Object.assign(Object.assign({},e.authorizationParams),{code_verifier:s,code:p.code,grant_type:"authorization_code",redirect_uri:a,timeout:e.authorizationParams.timeout||this.httpTimeoutMs}),{nonceIn:r,organization:t.organization});return Object.assign(Object.assign({},m),{scope:c,oauthTokenScope:m.scope,audience:d})}catch(e){throw "login_required"===e.error&&this.logout({openUrl:!1}),e}}async _getTokenUsingRefreshToken(e){const t=await this.cacheManager.get(new oe({scope:e.authorizationParams.scope,audience:e.authorizationParams.audience||"default",clientId:this.options.clientId}),void 0,this.options.useMrrt);if(!(t&&t.refresh_token||this.worker)){if(this.options.useRefreshTokensFallback)return await this._getTokenFromIFrame(e);throw new y(e.authorizationParams.audience||"default",e.authorizationParams.scope)}const o=e.authorizationParams.redirect_uri||this.options.authorizationParams.redirect_uri||window.location.origin,n="number"==typeof e.timeoutInSeconds?1e3*e.timeoutInSeconds:null,i=((e,t,o,n)=>{var i;if(e&&o&&n){if(t.audience!==o)return t.scope;const e=n.split(" "),r=(null===(i=t.scope)||void 0===i?void 0:i.split(" "))||[],s=r.every((t=>e.includes(t)));return e.length>=r.length&&s?n:t.scope}return t.scope})(this.options.useMrrt,e.authorizationParams,null==t?void 0:t.audience,null==t?void 0:t.scope);try{const u=await this._requestToken(Object.assign(Object.assign(Object.assign({},e.authorizationParams),{grant_type:"refresh_token",refresh_token:t&&t.refresh_token,redirect_uri:o}),n&&{timeout:n}),{scopesToRequest:i});if(u.refresh_token&&this.options.useMrrt&&(null==t?void 0:t.refresh_token)&&await this.cacheManager.updateEntry(t.refresh_token,u.refresh_token),this.options.useMrrt){if(r=null==t?void 0:t.audience,s=null==t?void 0:t.scope,a=e.authorizationParams.audience,c=e.authorizationParams.scope,r!==a||!Ke(c,s)){if(!Ke(i,u.scope)){if(this.options.useRefreshTokensFallback)return await this._getTokenFromIFrame(e);await this.cacheManager.remove(this.options.clientId,e.authorizationParams.audience,e.authorizationParams.scope);const t=((e,t)=>{const o=(null==e?void 0:e.split(" "))||[],n=(null==t?void 0:t.split(" "))||[];return o.filter((e=>-1==n.indexOf(e))).join(",")})(i,u.scope);throw new w(e.authorizationParams.audience||"default",t)}}}return Object.assign(Object.assign({},u),{scope:e.authorizationParams.scope,oauthTokenScope:u.scope,audience:e.authorizationParams.audience||"default"})}catch(t){if((t.message.indexOf("Missing Refresh Token")>-1||t.message&&t.message.indexOf("invalid refresh token")>-1)&&this.options.useRefreshTokensFallback)return await this._getTokenFromIFrame(e);throw t}var r,s,a,c;}async _saveEntryInCache(t){const{id_token:o,decodedToken:n}=t,i=e(t,["id_token","decodedToken"]);this.userCache.set("@@user@@",{id_token:o,decodedToken:n}),await this.cacheManager.setIdToken(this.options.clientId,t.id_token,t.decodedToken),await this.cacheManager.set(i);}async _getIdTokenFromCache(){const e=this.options.authorizationParams.audience||"default",t=this.scope[e],o=await this.cacheManager.getIdToken(new oe({clientId:this.options.clientId,audience:e,scope:t})),n=this.userCache.get("@@user@@");return o&&o.id_token===(null==n?void 0:n.id_token)?n:(this.userCache.set("@@user@@",o),o)}async _getEntryFromCache({scope:e,audience:t,clientId:o,cacheMode:n}){const i=await this.cacheManager.get(new oe({scope:e,audience:t,clientId:o}),60,this.options.useMrrt,n);if(i&&i.access_token){const{token_type:e,access_token:t,oauthTokenScope:o,expires_in:n}=i,r=await this._getIdTokenFromCache();return r&&Object.assign(Object.assign({id_token:r.id_token,token_type:e||"Bearer",access_token:t},o?{scope:o}:null),{expires_in:n})}}async _requestToken(e,t){const{nonceIn:o,organization:n,scopesToRequest:i}=t||{},r=await Q(Object.assign(Object.assign({baseUrl:this.domainUrl,client_id:this.options.clientId,auth0Client:this.options.auth0Client,useFormData:this.options.useFormData,timeout:this.httpTimeoutMs,useMrrt:this.options.useMrrt,dpop:this.dpop},e),{scope:i||e.scope}),this.worker),s=await this._verifyIdToken(r.id_token,o,n);return await this._saveEntryInCache(Object.assign(Object.assign(Object.assign(Object.assign({},r),{decodedToken:s,scope:e.scope,audience:e.audience||"default"}),r.scope?{oauthTokenScope:r.scope}:null),{client_id:this.options.clientId})),this.cookieStorage.save(this.isAuthenticatedCookieName,!0,{daysUntilExpire:this.sessionCheckExpiryDays,cookieDomain:this.options.cookieDomain}),this._processOrgHint(n||s.claims.org_id),Object.assign(Object.assign({},r),{decodedToken:s})}async exchangeToken(e){return this._requestToken({grant_type:"urn:ietf:params:oauth:grant-type:token-exchange",subject_token:e.subject_token,subject_token_type:e.subject_token_type,scope:te(this.scope,e.scope,e.audience||this.options.authorizationParams.audience),audience:e.audience||this.options.authorizationParams.audience,organization:e.organization||this.options.authorizationParams.organization})}_assertDpop(e){if(!e)throw new Error("`useDpop` option must be enabled before using DPoP.")}getDpopNonce(e){return this._assertDpop(this.dpop),this.dpop.getNonce(e)}setDpopNonce(e,t){return this._assertDpop(this.dpop),this.dpop.setNonce(e,t)}generateDpopProof(e){return this._assertDpop(this.dpop),this.dpop.generateProof(e)}createFetcher(e={}){return new Re(e,{isDpopEnabled:()=>!!this.options.useDpop,getAccessToken:e=>{var t;return this.getTokenSilently({authorizationParams:{scope:null===(t=null==e?void 0:e.scope)||void 0===t?void 0:t.join(" "),audience:null==e?void 0:e.audience},detailedResponse:!0})},getDpopNonce:()=>this.getDpopNonce(e.dpopNonceId),setDpopNonce:t=>this.setDpopNonce(t,e.dpopNonceId),generateDpopProof:e=>this.generateDpopProof(e)})}async connectAccountWithRedirect(e){const{openUrl:t,appState:o,connection:n,scopes:i,authorization_params:r,redirectUri:s=this.options.authorizationParams.redirect_uri||window.location.origin}=e;if(!n)throw new Error("connection is required");const a=S(_()),c=_(),u=await O(c),d=C(u),{connect_uri:h,connect_params:l,auth_session:p}=await this.myAccountApi.connectAccount({connection:n,scopes:i,redirect_uri:s,state:a,code_challenge:d,code_challenge_method:"S256",authorization_params:r});this.transactionManager.create({state:a,code_verifier:c,auth_session:p,redirect_uri:s,appState:o,connection:n,response_type:exports.ResponseType.ConnectCode});const m=new URL(h);m.searchParams.set("ticket",l.ticket),t?await t(m.toString()):window.location.assign(m);}}

    /**
     * The initial auth state.
     */
    var initialAuthState = {
        isAuthenticated: false,
        isLoading: true,
        error: undefined,
        user: undefined,
    };

    /**
     * @ignore
     */
    var stub = function () {
        throw new Error('You forgot to wrap your component in <Auth0Provider>.');
    };
    /**
     * @ignore
     */
    var initialContext = __assign(__assign({}, initialAuthState), { buildAuthorizeUrl: stub, buildLogoutUrl: stub, getAccessTokenSilently: stub, getAccessTokenWithPopup: stub, getIdTokenClaims: stub, exchangeToken: stub, loginWithRedirect: stub, loginWithPopup: stub, connectAccountWithRedirect: stub, logout: stub, handleRedirectCallback: stub, getDpopNonce: stub, setDpopNonce: stub, generateDpopProof: stub, createFetcher: stub });
    /**
     * The Auth0 Context
     */
    var Auth0Context = React.createContext(initialContext);

    /**
     * An OAuth2 error will come from the authorization server and will have at least an `error` property which will
     * be the error code. And possibly an `error_description` property
     *
     * See: https://openid.net/specs/openid-connect-core-1_0.html#rfc.section.3.1.2.6
     */
    var OAuthError = /** @class */ (function (_super) {
        __extends(OAuthError, _super);
        function OAuthError(error, error_description) {
            var _this = _super.call(this, error_description !== null && error_description !== void 0 ? error_description : error) || this;
            _this.error = error;
            _this.error_description = error_description;
            // https://github.com/Microsoft/TypeScript-wiki/blob/master/Breaking-Changes.md#extending-built-ins-like-error-array-and-map-may-no-longer-work
            Object.setPrototypeOf(_this, OAuthError.prototype);
            return _this;
        }
        return OAuthError;
    }(Error));

    var CODE_RE = /[?&](?:connect_)?code=[^&]+/;
    var STATE_RE = /[?&]state=[^&]+/;
    var ERROR_RE = /[?&]error=[^&]+/;
    var hasAuthParams = function (searchParams) {
        if (searchParams === void 0) { searchParams = window.location.search; }
        return (CODE_RE.test(searchParams) || ERROR_RE.test(searchParams)) &&
            STATE_RE.test(searchParams);
    };
    var normalizeErrorFn = function (fallbackMessage) {
        return function (error) {
            if (error instanceof Error) {
                return error;
            }
            // try to check errors of the following form: {error: string; error_description?: string}
            if (error !== null &&
                typeof error === 'object' &&
                'error' in error &&
                typeof error.error === 'string') {
                if ('error_description' in error &&
                    typeof error.error_description === 'string') {
                    var e_1 = error;
                    return new OAuthError(e_1.error, e_1.error_description);
                }
                var e = error;
                return new OAuthError(e.error);
            }
            return new Error(fallbackMessage);
        };
    };
    var loginError = normalizeErrorFn('Login failed');
    var tokenError = normalizeErrorFn('Get access token failed');
    /**
     * @ignore
     * Helper function to map the v1 `redirectUri` option to the v2 `authorizationParams.redirect_uri`
     * and log a warning.
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    var deprecateRedirectUri = function (options) {
        var _a, _b;
        if (options === null || options === void 0 ? void 0 : options.redirectUri) {
            console.warn('Using `redirectUri` has been deprecated, please use `authorizationParams.redirect_uri` instead as `redirectUri` will be no longer supported in a future version');
            options.authorizationParams = (_a = options.authorizationParams) !== null && _a !== void 0 ? _a : {};
            options.authorizationParams.redirect_uri = options.redirectUri;
            delete options.redirectUri;
        }
        if ((_b = options === null || options === void 0 ? void 0 : options.authorizationParams) === null || _b === void 0 ? void 0 : _b.redirectUri) {
            console.warn('Using `authorizationParams.redirectUri` has been deprecated, please use `authorizationParams.redirect_uri` instead as `authorizationParams.redirectUri` will be removed in a future version');
            options.authorizationParams.redirect_uri =
                options.authorizationParams.redirectUri;
            delete options.authorizationParams.redirectUri;
        }
    };

    /**
     * Handles how that state changes in the `useAuth0` hook.
     */
    var reducer = function (state, action) {
        switch (action.type) {
            case 'LOGIN_POPUP_STARTED':
                return __assign(__assign({}, state), { isLoading: true });
            case 'LOGIN_POPUP_COMPLETE':
            case 'INITIALISED':
                return __assign(__assign({}, state), { isAuthenticated: !!action.user, user: action.user, isLoading: false, error: undefined });
            case 'HANDLE_REDIRECT_COMPLETE':
            case 'GET_ACCESS_TOKEN_COMPLETE':
                if (state.user === action.user) {
                    return state;
                }
                return __assign(__assign({}, state), { isAuthenticated: !!action.user, user: action.user });
            case 'LOGOUT':
                return __assign(__assign({}, state), { isAuthenticated: false, user: undefined });
            case 'ERROR':
                return __assign(__assign({}, state), { isLoading: false, error: action.error });
        }
    };

    /**
     * @ignore
     */
    var toAuth0ClientOptions = function (opts) {
        deprecateRedirectUri(opts);
        return __assign(__assign({}, opts), { auth0Client: {
                name: 'auth0-react',
                version: '2.11.0',
            } });
    };
    /**
     * @ignore
     */
    var defaultOnRedirectCallback = function (appState) {
        var _a;
        window.history.replaceState({}, document.title, (_a = appState.returnTo) !== null && _a !== void 0 ? _a : window.location.pathname);
    };
    /**
     * ```jsx
     * <Auth0Provider
     *   domain={domain}
     *   clientId={clientId}
     *   authorizationParams={{ redirect_uri: window.location.origin }}>
     *   <MyApp />
     * </Auth0Provider>
     * ```
     *
     * Provides the Auth0Context to its child components.
     */
    var Auth0Provider = function (opts) {
        var children = opts.children, skipRedirectCallback = opts.skipRedirectCallback, _a = opts.onRedirectCallback, onRedirectCallback = _a === void 0 ? defaultOnRedirectCallback : _a, _b = opts.context, context = _b === void 0 ? Auth0Context : _b, clientOpts = __rest(opts, ["children", "skipRedirectCallback", "onRedirectCallback", "context"]);
        var client = React.useState(function () { return new Le(toAuth0ClientOptions(clientOpts)); })[0];
        var _c = React.useReducer((reducer), initialAuthState), state = _c[0], dispatch = _c[1];
        var didInitialise = React.useRef(false);
        var handleError = React.useCallback(function (error) {
            dispatch({ type: 'ERROR', error: error });
            return error;
        }, []);
        React.useEffect(function () {
            if (didInitialise.current) {
                return;
            }
            didInitialise.current = true;
            (function () { return __awaiter(void 0, void 0, void 0, function () {
                var user, _a, _b, appState, response_type, result, error_1;
                return __generator(this, function (_c) {
                    switch (_c.label) {
                        case 0:
                            _c.trys.push([0, 7, , 8]);
                            user = void 0;
                            if (!(hasAuthParams() && !skipRedirectCallback)) return [3 /*break*/, 3];
                            return [4 /*yield*/, client.handleRedirectCallback()];
                        case 1:
                            _a = _c.sent(), _b = _a.appState, appState = _b === void 0 ? {} : _b, response_type = _a.response_type, result = __rest(_a, ["appState", "response_type"]);
                            return [4 /*yield*/, client.getUser()];
                        case 2:
                            user = _c.sent();
                            appState.response_type = response_type;
                            if (response_type === exports.ResponseType.ConnectCode) {
                                appState.connectedAccount = result;
                            }
                            onRedirectCallback(appState, user);
                            return [3 /*break*/, 6];
                        case 3: return [4 /*yield*/, client.checkSession()];
                        case 4:
                            _c.sent();
                            return [4 /*yield*/, client.getUser()];
                        case 5:
                            user = _c.sent();
                            _c.label = 6;
                        case 6:
                            dispatch({ type: 'INITIALISED', user: user });
                            return [3 /*break*/, 8];
                        case 7:
                            error_1 = _c.sent();
                            handleError(loginError(error_1));
                            return [3 /*break*/, 8];
                        case 8: return [2 /*return*/];
                    }
                });
            }); })();
        }, [client, onRedirectCallback, skipRedirectCallback, handleError]);
        var loginWithRedirect = React.useCallback(function (opts) {
            deprecateRedirectUri(opts);
            return client.loginWithRedirect(opts);
        }, [client]);
        var loginWithPopup = React.useCallback(function (options, config) { return __awaiter(void 0, void 0, void 0, function () {
            var error_2, user;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        dispatch({ type: 'LOGIN_POPUP_STARTED' });
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, client.loginWithPopup(options, config)];
                    case 2:
                        _a.sent();
                        return [3 /*break*/, 4];
                    case 3:
                        error_2 = _a.sent();
                        handleError(loginError(error_2));
                        return [2 /*return*/];
                    case 4: return [4 /*yield*/, client.getUser()];
                    case 5:
                        user = _a.sent();
                        dispatch({ type: 'LOGIN_POPUP_COMPLETE', user: user });
                        return [2 /*return*/];
                }
            });
        }); }, [client, handleError]);
        var logout = React.useCallback(function () {
            var args_1 = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args_1[_i] = arguments[_i];
            }
            return __awaiter(void 0, __spreadArray([], args_1, true), void 0, function (opts) {
                if (opts === void 0) { opts = {}; }
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, client.logout(opts)];
                        case 1:
                            _a.sent();
                            if (opts.openUrl || opts.openUrl === false) {
                                dispatch({ type: 'LOGOUT' });
                            }
                            return [2 /*return*/];
                    }
                });
            });
        }, [client]);
        var getAccessTokenSilently = React.useCallback(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        function (opts) { return __awaiter(void 0, void 0, void 0, function () {
            var token, error_3, _a;
            var _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        _c.trys.push([0, 2, 3, 5]);
                        return [4 /*yield*/, client.getTokenSilently(opts)];
                    case 1:
                        token = _c.sent();
                        return [3 /*break*/, 5];
                    case 2:
                        error_3 = _c.sent();
                        throw tokenError(error_3);
                    case 3:
                        _a = dispatch;
                        _b = {
                            type: 'GET_ACCESS_TOKEN_COMPLETE'
                        };
                        return [4 /*yield*/, client.getUser()];
                    case 4:
                        _a.apply(void 0, [(_b.user = _c.sent(),
                                _b)]);
                        return [7 /*endfinally*/];
                    case 5: return [2 /*return*/, token];
                }
            });
        }); }, [client]);
        var getAccessTokenWithPopup = React.useCallback(function (opts, config) { return __awaiter(void 0, void 0, void 0, function () {
            var token, error_4, _a;
            var _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        _c.trys.push([0, 2, 3, 5]);
                        return [4 /*yield*/, client.getTokenWithPopup(opts, config)];
                    case 1:
                        token = _c.sent();
                        return [3 /*break*/, 5];
                    case 2:
                        error_4 = _c.sent();
                        throw tokenError(error_4);
                    case 3:
                        _a = dispatch;
                        _b = {
                            type: 'GET_ACCESS_TOKEN_COMPLETE'
                        };
                        return [4 /*yield*/, client.getUser()];
                    case 4:
                        _a.apply(void 0, [(_b.user = _c.sent(),
                                _b)]);
                        return [7 /*endfinally*/];
                    case 5: return [2 /*return*/, token];
                }
            });
        }); }, [client]);
        var connectAccountWithRedirect = React.useCallback(function (options) {
            return client.connectAccountWithRedirect(options);
        }, [client]);
        var getIdTokenClaims = React.useCallback(function () { return client.getIdTokenClaims(); }, [client]);
        var exchangeToken = React.useCallback(function (options) { return __awaiter(void 0, void 0, void 0, function () {
            var tokenResponse, error_5, _a;
            var _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        _c.trys.push([0, 2, 3, 5]);
                        return [4 /*yield*/, client.exchangeToken(options)];
                    case 1:
                        tokenResponse = _c.sent();
                        return [3 /*break*/, 5];
                    case 2:
                        error_5 = _c.sent();
                        throw tokenError(error_5);
                    case 3:
                        // We dispatch the standard GET_ACCESS_TOKEN_COMPLETE action here to maintain 
                        // backward compatibility and consistency with the getAccessTokenSilently flow. 
                        // This ensures the SDK's internal state lifecycle (loading/user updates) remains 
                        // identical regardless of whether the token was retrieved via silent auth or CTE.
                        _a = dispatch;
                        _b = {
                            type: 'GET_ACCESS_TOKEN_COMPLETE'
                        };
                        return [4 /*yield*/, client.getUser()];
                    case 4:
                        // We dispatch the standard GET_ACCESS_TOKEN_COMPLETE action here to maintain 
                        // backward compatibility and consistency with the getAccessTokenSilently flow. 
                        // This ensures the SDK's internal state lifecycle (loading/user updates) remains 
                        // identical regardless of whether the token was retrieved via silent auth or CTE.
                        _a.apply(void 0, [(_b.user = _c.sent(),
                                _b)]);
                        return [7 /*endfinally*/];
                    case 5: return [2 /*return*/, tokenResponse];
                }
            });
        }); }, [client]);
        var handleRedirectCallback = React.useCallback(function (url) { return __awaiter(void 0, void 0, void 0, function () {
            var error_6, _a;
            var _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        _c.trys.push([0, 2, 3, 5]);
                        return [4 /*yield*/, client.handleRedirectCallback(url)];
                    case 1: return [2 /*return*/, _c.sent()];
                    case 2:
                        error_6 = _c.sent();
                        throw tokenError(error_6);
                    case 3:
                        _a = dispatch;
                        _b = {
                            type: 'HANDLE_REDIRECT_COMPLETE'
                        };
                        return [4 /*yield*/, client.getUser()];
                    case 4:
                        _a.apply(void 0, [(_b.user = _c.sent(),
                                _b)]);
                        return [7 /*endfinally*/];
                    case 5: return [2 /*return*/];
                }
            });
        }); }, [client]);
        var getDpopNonce = React.useCallback(function (id) { return client.getDpopNonce(id); }, [client]);
        var setDpopNonce = React.useCallback(function (nonce, id) { return client.setDpopNonce(nonce, id); }, [client]);
        var generateDpopProof = React.useCallback(function (params) { return client.generateDpopProof(params); }, [client]);
        var createFetcher = React.useCallback(function (config) { return client.createFetcher(config); }, [client]);
        var contextValue = React.useMemo(function () {
            return __assign(__assign({}, state), { getAccessTokenSilently: getAccessTokenSilently, getAccessTokenWithPopup: getAccessTokenWithPopup, getIdTokenClaims: getIdTokenClaims, exchangeToken: exchangeToken, loginWithRedirect: loginWithRedirect, loginWithPopup: loginWithPopup, connectAccountWithRedirect: connectAccountWithRedirect, logout: logout, handleRedirectCallback: handleRedirectCallback, getDpopNonce: getDpopNonce, setDpopNonce: setDpopNonce, generateDpopProof: generateDpopProof, createFetcher: createFetcher });
        }, [
            state,
            getAccessTokenSilently,
            getAccessTokenWithPopup,
            getIdTokenClaims,
            exchangeToken,
            loginWithRedirect,
            loginWithPopup,
            connectAccountWithRedirect,
            logout,
            handleRedirectCallback,
            getDpopNonce,
            setDpopNonce,
            generateDpopProof,
            createFetcher,
        ]);
        return React.createElement(context.Provider, { value: contextValue }, children);
    };

    /**
     * ```js
     * const {
     *   // Auth state:
     *   error,
     *   isAuthenticated,
     *   isLoading,
     *   user,
     *   // Auth methods:
     *   getAccessTokenSilently,
     *   getAccessTokenWithPopup,
     *   getIdTokenClaims,
     *   exchangeToken,
     *   loginWithRedirect,
     *   loginWithPopup,
     *   logout,
     * } = useAuth0<TUser>();
     * ```
     *
     * Use the `useAuth0` hook in your components to access the auth state and methods.
     *
     * TUser is an optional type param to provide a type to the `user` field.
     */
    var useAuth0 = function (context) {
        if (context === void 0) { context = Auth0Context; }
        return React.useContext(context);
    };

    /**
     * ```jsx
     * class MyComponent extends Component {
     *   render() {
     *     // Access the auth context from the `auth0` prop
     *     const { user } = this.props.auth0;
     *     return <div>Hello {user.name}!</div>
     *   }
     * }
     * // Wrap your class component in withAuth0
     * export default withAuth0(MyComponent);
     * ```
     *
     * Wrap your class components in this Higher Order Component to give them access to the Auth0Context.
     *
     * Providing a context as the second argument allows you to configure the Auth0Provider the Auth0Context
     * should come from f you have multiple within your application.
     */
    var withAuth0 = function (Component, context) {
        if (context === void 0) { context = Auth0Context; }
        return function WithAuth(props) {
            return (React.createElement(context.Consumer, null, function (auth) { return (React.createElement(Component, __assign({}, props, { auth0: auth }))); }));
        };
    };

    /**
     * @ignore
     */
    var defaultOnRedirecting = function () { return React.createElement(React.Fragment, null); };
    /**
    * @ignore
    */
    var defaultOnBeforeAuthentication = function () { return __awaiter(void 0, void 0, void 0, function () { return __generator(this, function (_a) {
        return [2 /*return*/];
    }); }); };
    /**
     * @ignore
     */
    var defaultReturnTo = function () {
        return "".concat(window.location.pathname).concat(window.location.search);
    };
    /**
     * ```js
     * const MyProtectedComponent = withAuthenticationRequired(MyComponent);
     * ```
     *
     * When you wrap your components in this Higher Order Component and an anonymous user visits your component
     * they will be redirected to the login page; after login they will be returned to the page they were redirected from.
     */
    var withAuthenticationRequired = function (Component, options) {
        if (options === void 0) { options = {}; }
        return function WithAuthenticationRequired(props) {
            var _this = this;
            var _a = options.returnTo, returnTo = _a === void 0 ? defaultReturnTo : _a, _b = options.onRedirecting, onRedirecting = _b === void 0 ? defaultOnRedirecting : _b, _c = options.onBeforeAuthentication, onBeforeAuthentication = _c === void 0 ? defaultOnBeforeAuthentication : _c, loginOptions = options.loginOptions, _d = options.context, context = _d === void 0 ? Auth0Context : _d;
            var _e = useAuth0(context), isAuthenticated = _e.isAuthenticated, isLoading = _e.isLoading, loginWithRedirect = _e.loginWithRedirect;
            React.useEffect(function () {
                if (isLoading || isAuthenticated) {
                    return;
                }
                var opts = __assign(__assign({}, loginOptions), { appState: __assign(__assign({}, loginOptions === null || loginOptions === void 0 ? void 0 : loginOptions.appState), { returnTo: typeof returnTo === 'function' ? returnTo() : returnTo }) });
                void (function () { return __awaiter(_this, void 0, void 0, function () {
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0: return [4 /*yield*/, onBeforeAuthentication()];
                            case 1:
                                _a.sent();
                                return [4 /*yield*/, loginWithRedirect(opts)];
                            case 2:
                                _a.sent();
                                return [2 /*return*/];
                        }
                    });
                }); })();
            }, [
                isLoading,
                isAuthenticated,
                loginWithRedirect,
                onBeforeAuthentication,
                loginOptions,
                returnTo,
            ]);
            return isAuthenticated ? React.createElement(Component, __assign({}, props)) : onRedirecting();
        };
    };

    exports.Auth0Context = Auth0Context;
    exports.Auth0Provider = Auth0Provider;
    exports.AuthenticationError = d;
    exports.ConnectError = h;
    exports.GenericError = u;
    exports.InMemoryCache = ie;
    exports.LocalStorageCache = ne;
    exports.MfaRequiredError = g;
    exports.MissingRefreshTokenError = y;
    exports.OAuthError = OAuthError;
    exports.PopupCancelledError = m;
    exports.PopupTimeoutError = p;
    exports.TimeoutError = l;
    exports.UseDpopNonceError = b;
    exports.User = we;
    exports.initialContext = initialContext;
    exports.useAuth0 = useAuth0;
    exports.withAuth0 = withAuth0;
    exports.withAuthenticationRequired = withAuthenticationRequired;

}));
//# sourceMappingURL=auth0-react.js.map

const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/CommentOverlay-DMhi6kil.js","assets/vendor-reshaped-B6QN4BpE.js","assets/vendor-react-DKHl9wlW.js","assets/vendor-reshaped-CU0gdG-S.css","assets/vendor-primer-J7MfFwzX.js","assets/vendor-octicons-CaLqJUBG.js","assets/vendor-primer-CL7onuSO.css"])))=>i.map(i=>d[i]);
import{j as e,C as ce,V as u,T as h,D as te,R as Ie,B as Ne,a as Ur,b as gt,P as Fr,S as dn,F as b,c as fe,d as ne,e as ge,A as un,M as xe}from"./vendor-reshaped-B6QN4BpE.js";import{r as S,u as Hn,L as me,O as Un,f as Et,g as qr,h as Wr,i as Vr,j as Yr}from"./vendor-react-DKHl9wlW.js";import{S as re,I as Gr,T as z,U as pn,N as st,a as Fn,A as ft,L as qn,u as Kr,b as at,c as it,d as Jr,e as Xr,B as Zr}from"./vendor-primer-J7MfFwzX.js";import{o as Qr,M as eo,p as _t,m as F,l as kt,q as It,r as Nt,s as Rt,f as Pt,t as Lt,u as Tt,v as zt,w as $t,j as Wn,k as Vn,b as to,x as mn,y as Te}from"./vendor-octicons-CaLqJUBG.js";(function(){const n=document.createElement("link").relList;if(n&&n.supports&&n.supports("modulepreload"))return;for(const o of document.querySelectorAll('link[rel="modulepreload"]'))r(o);new MutationObserver(o=>{for(const a of o)if(a.type==="childList")for(const i of a.addedNodes)i.tagName==="LINK"&&i.rel==="modulepreload"&&r(i)}).observe(document,{childList:!0,subtree:!0});function s(o){const a={};return o.integrity&&(a.integrity=o.integrity),o.referrerPolicy&&(a.referrerPolicy=o.referrerPolicy),o.crossOrigin==="use-credentials"?a.credentials="include":o.crossOrigin==="anonymous"?a.credentials="omit":a.credentials="same-origin",a}function r(o){if(o.ep)return;o.ep=!0;const a=s(o);fetch(o.href,a)}})();function De(t,n){const s={...t};for(const r of Object.keys(n)){const o=n[r],a=t[r];o!==null&&typeof o=="object"&&!Array.isArray(o)&&a!==null&&typeof a=="object"&&!Array.isArray(a)?s[r]=De(a,o):s[r]=o}return s}let K={scenes:{},objects:{},records:{}};function no(t){if(!t||typeof t!="object")throw new Error("[storyboard-core] init() requires { scenes, objects, records }");K={scenes:t.scenes||{},objects:t.objects||{},records:t.records||{}}}function bt(t,n){if(n&&K[n]?.[t]!=null)return K[n][t];if(!n){for(const s of["scenes","objects","records"])if(K[s]?.[t]!=null)return K[s][t]}if(n==="scenes"||!n){const s=t.toLowerCase();for(const r of Object.keys(K.scenes))if(r.toLowerCase()===s)return K.scenes[r]}throw new Error(`Data file not found: ${t}${n?` (type: ${n})`:""}`)}function _e(t,n=new Set){if(t===null||typeof t!="object")return t;if(Array.isArray(t))return t.map(r=>_e(r,n));if(t.$ref&&typeof t.$ref=="string"){const r=t.$ref;if(n.has(r))throw new Error(`Circular $ref detected: ${r}`);n.add(r);const o=bt(r,"objects");return _e(o,n)}const s={};for(const[r,o]of Object.entries(t))s[r]=_e(o,n);return s}function ro(t){if(K.scenes[t]!=null)return!0;const n=t.toLowerCase();for(const s of Object.keys(K.scenes))if(s.toLowerCase()===n)return!0;return!1}function Ke(t="default"){let n;try{n=bt(t,"scenes")}catch{throw new Error(`Failed to load scene: ${t}`)}if(Array.isArray(n.$global)){const s=n.$global;delete n.$global;let r={};for(const o of s)try{let a=bt(o);a=_e(a),r=De(r,a)}catch(a){console.warn(`Failed to load $global: ${o}`,a)}n=De(r,n)}return n=_e(n),structuredClone(n)}function At(t){const n=K.records[t];if(n==null)throw new Error(`Record not found: ${t}`);if(!Array.isArray(n))throw new Error(`Record "${t}" must be an array, got ${typeof n}`);return structuredClone(n)}function oo(t,n){return At(t).find(r=>r.id===n)??null}function Yn(t,n){if(t==null||typeof n!="string"||n==="")return;const s=n.split(".");let r=t;for(const o of s){if(r==null||typeof r!="object")return;r=r[o]}return r}function Re(t){if(Array.isArray(t))return t.map(Re);if(t!==null&&typeof t=="object"){const n={};for(const s of Object.keys(t))n[s]=Re(t[s]);return n}return t}function Be(t,n,s){const r=n.split(".");let o=t;for(let a=0;a<r.length-1;a++){const i=r[a];(o[i]==null||typeof o[i]!="object")&&(o[i]=/^\d+$/.test(r[a+1])?[]:{}),o=o[i]}o[r[r.length-1]]=s}function Je(){const t=window.location.hash.replace(/^#/,"");return new URLSearchParams(t)}function Gn(t){const n=t.toString();window.location.hash=n}function Kn(t){return Je().get(t)}function ve(t,n){const s=Je();s.set(t,String(n)),Gn(s)}function Jn(){const t=Je(),n={};for(const[s,r]of t.entries())n[s]=r;return n}function He(t){const n=Je();n.delete(t),Gn(n)}const Xe="storyboard:";function Ze(t){try{return localStorage.getItem(Xe+t)}catch{return null}}function Y(t,n){try{localStorage.setItem(Xe+t,String(n)),Ot()}catch{}}function Ue(t){try{localStorage.removeItem(Xe+t),Ot()}catch{}}function Xn(t){const n=()=>{Zn(),t()};return window.addEventListener("storage",n),window.addEventListener("storyboard-storage",n),()=>{window.removeEventListener("storage",n),window.removeEventListener("storyboard-storage",n)}}let Ee=null;function Zn(){Ee=null}function Qn(){if(Ee!==null)return Ee;try{const t=[];for(let n=0;n<localStorage.length;n++){const s=localStorage.key(n);s&&s.startsWith(Xe)&&t.push(s+"="+localStorage.getItem(s))}return Ee=t.sort().join("&"),Ee}catch{return""}}function Ot(){Zn(),window.dispatchEvent(new Event("storyboard-storage"))}const Mt="__hide__",Fe="historyState",ye="currentState",be="nextState",hn=200;function ke(){return Ze(Mt)==="1"}function so(){Pe(),Y(Mt,"1");const t=new URL(window.location.href);t.searchParams.delete("hide"),t.hash="",window.history.replaceState(window.history.state,"",t.toString())}function ao(){const t=Le();if(t){window.location.hash="";const n=new URLSearchParams(t);for(const[s,r]of n.entries())ve(s,r)}Ue(Mt),uo("show")}function Qe(){return window.location.pathname}function er(){return new URLSearchParams(window.location.hash.replace(/^#/,"")).toString()}function Pe(t,n){const s=t!==void 0?t:er(),r=n!==void 0?n:Qe(),o=et(),a=tt();if(a!==null&&o[a]){const[,c,m]=o[a];if(c===r&&m===s)return}const i=a!==null?o.slice(0,a+1):o,l=i.length,d=[l,r,s],p=[...i,d];if(p.length>hn){const c=p.slice(p.length-hn);for(let m=0;m<c.length;m++)c[m]=[m,c[m][1],c[m][2]];Y(Fe,JSON.stringify(c)),Y(ye,String(c.length-1))}else Y(Fe,JSON.stringify(p)),Y(ye,String(l));Ue(be)}function et(){const t=Ze(Fe);if(!t)return[];try{const n=JSON.parse(t);return Array.isArray(n)?n:[]}catch{return[]}}function tt(){const t=Ze(ye);if(t===null)return null;const n=parseInt(t,10);return Number.isNaN(n)?null:n}function io(){const t=Ze(be);if(t===null)return null;const n=parseInt(t,10);return Number.isNaN(n)?null:n}function Le(){const t=tt();if(t===null)return null;const n=et();return n[t]?n[t][2]:null}function tr(){const t=tt();if(t===null)return null;const n=et();return n[t]?n[t][1]:null}function nr(t){const n=Le();return n?new URLSearchParams(n).get(t):null}function gn(t,n){const s=Le()||"",r=new URLSearchParams(s);r.set(t,String(n)),Pe(r.toString(),tr()||Qe())}function fn(t){const n=Le()||"",s=new URLSearchParams(n);s.delete(t),Pe(s.toString(),tr()||Qe())}function co(){const t=Le();if(!t)return{};const n=new URLSearchParams(t),s={};for(const[r,o]of n.entries())s[r]=o;return s}function bn(){if(ke())return;const t=Qe(),n=er(),s=et(),r=tt();if(!n&&!t&&s.length===0)return;const o=s.findIndex(([,l,d])=>l===t&&d===n);if(o===-1){Pe(n,t);return}if(o===r)return;const a=r!==null?r-1:null,i=io();if(a!==null&&o===a)Y(be,String(r)),Y(ye,String(o));else if(i!==null&&o===i){const l=i+1;s[l]?Y(be,String(l)):Ue(be),Y(ye,String(o))}else{Ue(be),Y(ye,String(o));const l=s.slice(0,o+1);Y(Fe,JSON.stringify(l))}Ot()}function lo(){Pe(),window.addEventListener("hashchange",()=>bn()),window.addEventListener("popstate",()=>bn())}function uo(t){const n=new URL(window.location.href);n.searchParams.has(t)&&(n.searchParams.delete(t),window.history.replaceState(window.history.state,"",n.toString()))}function qe(){const t=new URL(window.location.href);if(t.searchParams.has("hide")){so();return}if(t.searchParams.has("show")){ao();return}}function po(){qe(),window.addEventListener("popstate",()=>qe())}function nt(t){return window.addEventListener("hashchange",t),()=>window.removeEventListener("hashchange",t)}function Dt(){return window.location.hash}const mo="modulepreload",ho=function(t){return"/storyboard/"+t},xn={},ee=function(n,s,r){let o=Promise.resolve();if(s&&s.length>0){let d=function(p){return Promise.all(p.map(c=>Promise.resolve(c).then(m=>({status:"fulfilled",value:m}),m=>({status:"rejected",reason:m}))))};document.getElementsByTagName("link");const i=document.querySelector("meta[property=csp-nonce]"),l=i?.nonce||i?.getAttribute("nonce");o=d(s.map(p=>{if(p=ho(p),p in xn)return;xn[p]=!0;const c=p.endsWith(".css"),m=c?'[rel="stylesheet"]':"";if(document.querySelector(`link[href="${p}"]${m}`))return;const g=document.createElement("link");if(g.rel=c?"stylesheet":mo,c||(g.as="script"),g.crossOrigin="",g.href=p,l&&g.setAttribute("nonce",l),document.head.appendChild(g),c)return new Promise((k,y)=>{g.addEventListener("load",k),g.addEventListener("error",()=>y(new Error(`Unable to preload CSS for ${p}`)))})}))}function a(i){const l=new Event("vite:preloadError",{cancelable:!0});if(l.payload=i,window.dispatchEvent(l),!l.defaultPrevented)throw i}return o.then(i=>{for(const l of i||[])l.status==="rejected"&&a(l.reason);return n().catch(a)})};let we=null;function go(t){if(!t||!t.comments){we=null;return}const n=t.comments;we={repo:{owner:n.repo?.owner??"",name:n.repo?.name??""},discussions:{category:n.discussions?.category??"Storyboard Comments"}}}function Bt(){return we}function We(){return we!==null&&we.repo.owner!==""&&we.repo.name!==""}const fo=`
.sb-devtools-wrapper {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 9999;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
}

.sb-devtools-trigger {
  display: flex;
  align-items: center;
  padding: 12px;
  background-color: #161b22;
  color: #8b949e;
  border: 1px solid #30363d;
  border-radius: 50%;
  cursor: pointer;
  box-shadow: 0 8px 24px rgba(0,0,0,0.4);
  transition: opacity 150ms ease, transform 150ms ease;
  user-select: none;
}
.sb-devtools-trigger:hover { transform: scale(1.05); }
.sb-devtools-trigger:active { transform: scale(0.97); }
.sb-devtools-trigger svg { width: 16px; height: 16px; fill: currentColor; }

.sb-devtools-menu {
  position: absolute;
  bottom: 56px;
  right: 0;
  min-width: 200px;
  background-color: #161b22;
  border: 1px solid #30363d;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.4);
  overflow: hidden;
  display: none;
}
.sb-devtools-menu.open { display: block; }

.sb-devtools-menu-item {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 8px 16px;
  background: none;
  border: none;
  color: #c9d1d9;
  font-size: 14px;
  font-family: inherit;
  cursor: pointer;
  text-align: left;
}
.sb-devtools-menu-item:hover { background-color: #21262d; }
.sb-devtools-menu-item svg { width: 16px; height: 16px; fill: currentColor; flex-shrink: 0; }

.sb-devtools-hint {
  padding: 6px 16px 8px;
  font-size: 12px;
  color: #484f58;
  font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace;
}

.sb-devtools-overlay {
  position: fixed;
  inset: 0;
  z-index: 9998;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding: 16px;
  padding-bottom: 80px;
}
.sb-devtools-backdrop {
  position: fixed;
  inset: 0;
  background: transparent;
}
.sb-devtools-panel {
  position: relative;
  width: 100%;
  max-width: 640px;
  max-height: 60vh;
  background-color: #0d1117;
  border: 1px solid #30363d;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.4);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
.sb-devtools-panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid #21262d;
}
.sb-devtools-panel-title {
  font-size: 14px;
  font-weight: 600;
  color: #c9d1d9;
}
.sb-devtools-panel-close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  background: none;
  border: none;
  border-radius: 6px;
  color: #8b949e;
  cursor: pointer;
}
.sb-devtools-panel-close:hover { background-color: #21262d; color: #c9d1d9; }
.sb-devtools-panel-close svg { width: 16px; height: 16px; fill: currentColor; }
.sb-devtools-panel-body {
  overflow: auto;
  padding: 16px;
}
.sb-devtools-code {
  padding: 0;
  margin: 0;
  background: none;
  font-size: 13px;
  font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace;
  line-height: 1.5;
  color: #c9d1d9;
  white-space: pre-wrap;
  word-break: break-word;
}
.sb-devtools-error { color: #f85149; }
`,bo='<svg viewBox="0 0 16 16"><path d="M5 5.782V2.5h-.25a.75.75 0 010-1.5h6.5a.75.75 0 010 1.5H11v3.282l3.666 5.86C15.619 13.04 14.552 15 12.46 15H3.54c-2.092 0-3.159-1.96-2.206-3.358zM6.5 2.5v3.782a.75.75 0 01-.107.384L3.2 12.5h9.6l-3.193-5.834A.75.75 0 019.5 6.282V2.5z"/></svg>',xo='<svg viewBox="0 0 16 16"><path d="M0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8Zm8-6.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13ZM6.5 7.75A.75.75 0 0 1 7.25 7h1a.75.75 0 0 1 .75.75v2.75h.25a.75.75 0 0 1 0 1.5h-2a.75.75 0 0 1 0-1.5h.25v-2h-.25a.75.75 0 0 1-.75-.75ZM8 6a1 1 0 1 1 0-2 1 1 0 0 1 0 2Z"/></svg>',vo='<svg viewBox="0 0 16 16"><path d="M1.705 8.005a.75.75 0 0 1 .834.656 5.5 5.5 0 0 0 9.592 2.97l-1.204-1.204a.25.25 0 0 1 .177-.427h3.646a.25.25 0 0 1 .25.25v3.646a.25.25 0 0 1-.427.177l-1.38-1.38A7.002 7.002 0 0 1 1.05 8.84a.75.75 0 0 1 .656-.834ZM8 2.5a5.487 5.487 0 0 0-4.131 1.869l1.204 1.204A.25.25 0 0 1 4.896 6H1.25A.25.25 0 0 1 1 5.75V2.104a.25.25 0 0 1 .427-.177l1.38 1.38A7.002 7.002 0 0 1 14.95 7.16a.75.75 0 0 1-1.49.178A5.5 5.5 0 0 0 8 2.5Z"/></svg>',yo='<svg viewBox="0 0 16 16"><path d="M8.5 1.75a.75.75 0 0 0-1.5 0V3H1.75a.75.75 0 0 0 0 1.5H3v6H1.75a.75.75 0 0 0 0 1.5H7v1.25a.75.75 0 0 0 1.5 0V12h5.25a.75.75 0 0 0 0-1.5H12v-6h1.75a.75.75 0 0 0 0-1.5H8.5Zm2 8.75h-5a.25.25 0 0 1-.25-.25v-4.5A.25.25 0 0 1 5.5 5.5h5a.25.25 0 0 1 .25.25v4.5a.25.25 0 0 1-.25.25Z"/></svg>',wo='<svg viewBox="0 0 16 16"><path d="M3.72 3.72a.75.75 0 0 1 1.06 0L8 6.94l3.22-3.22a.749.749 0 0 1 1.275.326.749.749 0 0 1-.215.734L9.06 8l3.22 3.22a.749.749 0 0 1-.326 1.275.749.749 0 0 1-.734-.215L8 9.06l-3.22 3.22a.751.751 0 0 1-1.042-.018.751.751 0 0 1-.018-1.042L6.94 8 3.72 4.78a.75.75 0 0 1 0-1.06Z"/></svg>';function jo(){return new URLSearchParams(window.location.search).get("scene")||"default"}function So(t={}){const n=t.container||document.body,s=t.basePath||"/";if(n.querySelector(".sb-devtools-wrapper"))return;const r=document.createElement("style");r.textContent=fo,document.head.appendChild(r);let o=!0,a=!1;const i=document.createElement("div");i.className="sb-devtools-wrapper";const l=document.createElement("button");l.className="sb-devtools-trigger",l.setAttribute("aria-label","Storyboard DevTools"),l.innerHTML=bo;const d=document.createElement("div");d.className="sb-devtools-menu";const p=document.createElement("button");p.className="sb-devtools-menu-item",p.innerHTML=`${yo} Viewfinder`;const c=document.createElement("button");c.className="sb-devtools-menu-item",c.innerHTML=`${xo} Show scene info`;const m=document.createElement("button");m.className="sb-devtools-menu-item",m.innerHTML=`${vo} Reset all params`;const g=document.createElement("div");g.className="sb-devtools-hint",g.innerHTML="Press <code>⌘ + .</code> to hide",d.appendChild(p),d.appendChild(c),d.appendChild(m);function k(){d.querySelectorAll("[data-sb-comment-menu-item]").forEach(w=>w.remove()),We()&&ee(async()=>{const{getCommentsMenuItems:w}=await import("./CommentOverlay-DMhi6kil.js");return{getCommentsMenuItems:w}},__vite__mapDeps([0,1,2,3,4,5,6])).then(({getCommentsMenuItems:w})=>{const L=w(),A=g;for(const M of L){const O=document.createElement("button");O.className="sb-devtools-menu-item",O.setAttribute("data-sb-comment-menu-item",""),O.innerHTML=`<span style="width:16px;height:16px;display:flex;align-items:center;justify-content:center;">${M.icon}</span> ${M.label}`,O.addEventListener("click",()=>{a=!1,d.classList.remove("open"),M.onClick()}),d.insertBefore(O,A)}})}l.addEventListener("click",k),d.appendChild(g),i.appendChild(d),i.appendChild(l),n.appendChild(i);let y=null;function v(){a=!1,d.classList.remove("open"),y&&y.remove();const w=jo();let L="",A=null;try{L=JSON.stringify(Ke(w),null,2)}catch(W){A=W.message}y=document.createElement("div"),y.className="sb-devtools-overlay";const M=document.createElement("div");M.className="sb-devtools-backdrop",M.addEventListener("click",N);const O=document.createElement("div");O.className="sb-devtools-panel";const G=document.createElement("div");G.className="sb-devtools-panel-header",G.innerHTML=`<span class="sb-devtools-panel-title">Scene: ${w}</span>`;const q=document.createElement("button");q.className="sb-devtools-panel-close",q.setAttribute("aria-label","Close panel"),q.innerHTML=wo,q.addEventListener("click",N),G.appendChild(q);const X=document.createElement("div");if(X.className="sb-devtools-panel-body",A)X.innerHTML=`<span class="sb-devtools-error">${A}</span>`;else{const W=document.createElement("pre");W.className="sb-devtools-code",W.textContent=L,X.appendChild(W)}O.appendChild(G),O.appendChild(X),y.appendChild(M),y.appendChild(O),n.appendChild(y)}function N(){y&&(y.remove(),y=null)}l.addEventListener("click",()=>{a=!a,d.classList.toggle("open",a)}),c.addEventListener("click",v),p.addEventListener("click",()=>{a=!1,d.classList.remove("open"),window.location.href=s+"viewfinder"}),m.addEventListener("click",()=>{window.location.hash="",a=!1,d.classList.remove("open")}),document.addEventListener("click",w=>{a&&!i.contains(w.target)&&(a=!1,d.classList.remove("open"))}),window.addEventListener("keydown",w=>{w.key==="."&&(w.metaKey||w.ctrlKey)&&(w.preventDefault(),o=!o,i.style.display=o?"":"none",o||(a=!1,d.classList.remove("open"),N()))})}function Co(t){let n=0;for(let s=0;s<t.length;s++)n=(n<<5)-n+t.charCodeAt(s)|0;return Math.abs(n)}function Eo(t,n=[]){for(const s of n)if(s.toLowerCase()===t.toLowerCase())return`/${s}?scene=${encodeURIComponent(t)}`;try{const s=Ke(t),r=s?.sceneMeta?.route||s?.route;if(r)return`${r.startsWith("/")?r:`/${r}`}?scene=${encodeURIComponent(t)}`}catch{}return`/?scene=${encodeURIComponent(t)}`}function _o(t){try{return Ke(t)?.sceneMeta||null}catch{return null}}const ko={sceneMeta:{route:"/Signup",author:"dfosco"},signup:{fullName:"",email:"",password:"",organization:{name:"",size:"",role:""},workspace:{region:"",plan:"starter",newsletter:!1,agreeTerms:!1}}},Io={sceneMeta:{route:"/reshaped-issues",author:"dfosco"},signup:{fullName:"Jane Doe",organization:{name:"Acme Cloud",size:"11-50",role:"developer"},workspace:{region:"us-east-1",plan:"growth"}}},No={sceneMeta:{route:"/primer-issues",author:"dfosco"},user:{$ref:"jane-doe"},navigation:{$ref:"navigation"}},Ro={sceneMeta:{route:"/reshaped-issues",author:"dfosco"},user:{$ref:"jane-doe"},navigation:{$ref:"navigation"},projects:[{id:1,name:"primer-react",description:"React components for the Primer Design System",owner:{name:"GitHub",avatar:"https://avatars.githubusercontent.com/u/9919?v=4"},stars:2500,issues:42},{id:2,name:"storyboard",description:"Prototyping meta-framework",owner:{name:"Jane Doe",avatar:"https://avatars.githubusercontent.com/u/1?v=4"},stars:128,issues:7}],settings:{theme:"dark_dimmed",notifications:!0,language:"en"},signup:{fullName:"",email:"",password:"",organization:{name:"",size:"",role:""},workspace:{region:"",plan:"starter",newsletter:!1,agreeTerms:!1}}},Po={primary:[{label:"Overview",url:"/Overview",icon:"home"},{label:"Issues",url:"/primer-issues",icon:"issue-opened"},{label:"Pull Requests",url:"#",icon:"git-pull-request"},{label:"Discussions",url:"#",icon:"comment-discussion"}],secondary:[{label:"Settings",url:"#",icon:"gear"},{label:"Help",url:"#",icon:"question"}]},Lo={name:"Jane Doe",username:"janedoe",role:"admin",avatar:"https://avatars.githubusercontent.com/u/1?v=4",profile:{bio:"Designer & developer",location:"San Francisco, CA"}},To=[{id:"refactor-auth-sso",identifier:"FIL-10",title:"Refactor authentication flow to support SSO providers",description:"Our current auth flow only supports email/password login. We need to extend it to support SSO providers (Google, Okta, Azure AD) for enterprise customers.",status:"todo",priority:"high",labels:["Auth","Backend","Feature"],assignee:null,project:null,estimate:5,author:"danielfosco",authorAvatar:"https://avatars.githubusercontent.com/u/4331946?v=4",createdAt:"2026-02-17T10:50:00Z",acceptanceCriteria:["Users can authenticate via Google OAuth 2.0","Users can authenticate via SAML-based SSO (Okta, Azure AD)","Existing email/password flow remains unchanged","Session tokens are issued consistently regardless of auth method","Admin panel includes SSO configuration settings"],technicalNotes:["Use the existing AuthService class as the base","Add a provider strategy pattern to abstract login methods","Store provider metadata in the identity_providers table","Redirect URI callback must handle both web and mobile clients"],activity:[{type:"created",user:"danielfosco",avatar:"https://avatars.githubusercontent.com/u/4331946?v=4",time:"10min ago"}]},{id:"fix-rate-limiter-bypass",identifier:"FIL-9",title:"Fix rate limiter bypass on batch endpoints",description:"The rate limiter can be bypassed by splitting a large request into multiple smaller batch calls. Each sub-request is counted as a single hit instead of being weighted by payload size.",status:"in_progress",priority:"urgent",labels:["Bug","Security","Backend"],assignee:"danielfosco",assigneeAvatar:"https://avatars.githubusercontent.com/u/4331946?v=4",project:"Platform Infrastructure",estimate:3,author:"danielfosco",authorAvatar:"https://avatars.githubusercontent.com/u/4331946?v=4",createdAt:"2026-02-16T14:20:00Z",acceptanceCriteria:["Batch endpoints count each item in the payload toward the rate limit","Rate limit headers reflect weighted counts","Existing single-request endpoints are unaffected"],technicalNotes:["Update RateLimiterMiddleware to accept a weight function","Batch controller should pass payload.length as weight","Add integration tests for weighted rate limiting"],activity:[{type:"created",user:"danielfosco",avatar:"https://avatars.githubusercontent.com/u/4331946?v=4",time:"1 day ago"},{type:"comment",user:"danielfosco",avatar:"https://avatars.githubusercontent.com/u/4331946?v=4",time:"6 hours ago",body:"Started investigating — the middleware doesn't have access to parsed body at the point it runs. May need to restructure."}]},{id:"add-webhook-retry-logic",identifier:"FIL-8",title:"Add exponential backoff retry logic for webhook deliveries",description:"Webhook deliveries currently fail silently on timeout. We need retry logic with exponential backoff and a dead-letter queue for persistently failing endpoints.",status:"todo",priority:"medium",labels:["Feature","Backend"],assignee:null,project:"Platform Infrastructure",estimate:8,author:"danielfosco",authorAvatar:"https://avatars.githubusercontent.com/u/4331946?v=4",createdAt:"2026-02-15T09:00:00Z",acceptanceCriteria:["Failed webhook deliveries are retried up to 5 times","Retry intervals follow exponential backoff (1s, 2s, 4s, 8s, 16s)","After all retries, the event is moved to a dead-letter queue","Delivery status is visible in the admin dashboard"],technicalNotes:["Use the existing job queue (BullMQ) for retry scheduling","Add a webhook_deliveries table to track attempts","Dead-letter events should be replayable from the admin UI"],activity:[{type:"created",user:"danielfosco",avatar:"https://avatars.githubusercontent.com/u/4331946?v=4",time:"2 days ago"}]},{id:"dashboard-loading-skeleton",identifier:"FIL-7",title:"Add loading skeletons to dashboard widgets",description:"Dashboard widgets show a blank space while data is loading. Add skeleton loaders to improve perceived performance.",status:"done",priority:"low",labels:["Feature","Frontend"],assignee:"danielfosco",assigneeAvatar:"https://avatars.githubusercontent.com/u/4331946?v=4",project:"Dashboard",estimate:2,author:"danielfosco",authorAvatar:"https://avatars.githubusercontent.com/u/4331946?v=4",createdAt:"2026-02-12T16:30:00Z",acceptanceCriteria:["All dashboard cards show skeleton loaders while fetching data","Skeleton matches the shape of the loaded content","Transition from skeleton to content is smooth"],technicalNotes:["Use Reshaped Skeleton component","Wrap each StatCard in a loading boundary"],activity:[{type:"created",user:"danielfosco",avatar:"https://avatars.githubusercontent.com/u/4331946?v=4",time:"5 days ago"},{type:"comment",user:"danielfosco",avatar:"https://avatars.githubusercontent.com/u/4331946?v=4",time:"3 days ago",body:"Done — merged in FIL-7-skeletons branch."}]},{id:"migrate-env-config",identifier:"FIL-6",title:"Migrate environment config to typed schema validation",description:"Environment variables are currently accessed via raw process.env lookups with no validation. Migrate to a typed config schema using zod so missing or malformed values are caught at startup.",status:"todo",priority:"medium",labels:["Backend","DevEx"],assignee:null,project:null,estimate:3,author:"danielfosco",authorAvatar:"https://avatars.githubusercontent.com/u/4331946?v=4",createdAt:"2026-02-10T11:00:00Z",acceptanceCriteria:["All environment variables are defined in a single config schema","Server fails fast on startup if required variables are missing","Types are inferred from the schema — no manual type assertions"],technicalNotes:["Use zod for schema definition and parsing","Create src/config.ts as the single source of truth","Replace all process.env.X references with config.X"],activity:[{type:"created",user:"danielfosco",avatar:"https://avatars.githubusercontent.com/u/4331946?v=4",time:"1 week ago"}]}],Ht={signup:ko,"issues-reshaped":Io,"issues-primer":No,default:Ro},zo={navigation:Po,"jane-doe":Lo},$o={issues:To};no({scenes:Ht,objects:zo,records:$o});const Ut=S.createContext(null);function Ao(){return new URLSearchParams(window.location.search).get("scene")}function Oo(){const t=window.location.pathname.replace(/\/+$/,"")||"/";return t==="/"?"index":t.split("/").pop()||"index"}function Mo({sceneName:t,recordName:n,recordParam:s,children:r}){const o=Oo(),a=Ao()||t||(ro(o)?o:"default"),i=Hn(),{data:l,error:d}=S.useMemo(()=>{try{let c=Ke(a);if(n&&s&&i[s]){const m=oo(n,i[s]);m&&(c=De(c,{record:m}))}return{data:c,error:null}}catch(c){return{data:null,error:c.message}}},[a,n,s,i]),p={data:l,error:d,loading:!1,sceneName:a};return d?e.jsxs("span",{style:{color:"var(--fgColor-danger, #f85149)"},children:["Error loading scene: ",d]}):e.jsx(Ut.Provider,{value:p,children:r})}function B(t){const n=S.useContext(Ut);if(n===null)throw new Error("useSceneData must be used within a <StoryboardProvider>");const{data:s,loading:r,error:o}=n,a=S.useSyncExternalStore(nt,Dt),i=S.useSyncExternalStore(Xn,Qn);return S.useMemo(()=>{if(r||o||s==null)return;const d=ke(),p=d?nr:Kn,c=d?co:Jn;if(!t){const N=c(),w=Object.keys(N);if(w.length===0)return s;const L=Re(s);for(const A of w)Be(L,A,N[A]);return L}const m=p(t);if(m!==null)return m;const g=t+".",k=c(),y=Object.keys(k).filter(N=>N.startsWith(g)),v=Yn(s,t);if(y.length>0&&v!==void 0){const N=Re(v);for(const w of y){const L=w.slice(g.length);Be(N,L,k[w])}return N}return v===void 0?(console.warn(`[useSceneData] Path "${t}" not found in scene data.`),{}):v},[s,r,o,t,a,i])}function j(t){const n=S.useContext(Ut);if(n===null)throw new Error("useOverride must be used within a <StoryboardProvider>");const{data:s}=n,r=ke(),o=s!=null?Yn(s,t):void 0,a=S.useCallback(()=>Kn(t),[t]),i=S.useSyncExternalStore(nt,a);S.useSyncExternalStore(Xn,Qn);let l;if(r){const c=nr(t);l=c!==null?c:o}else l=i!==null?i:o;const d=S.useCallback(c=>{ke()||ve(t,c),gn(t,c)},[t]),p=S.useCallback(()=>{ke()||He(t),fn(t)},[t]);return[l,d,p]}function rr(t,n){const s=Jn(),r=`record.${n}.`,o=Object.keys(s).filter(l=>l.startsWith(r));if(o.length===0)return t;const a=Re(t),i={};for(const l of o){const d=l.slice(r.length),p=d.indexOf(".");if(p===-1)continue;const c=d.slice(0,p),m=d.slice(p+1);i[c]||(i[c]={}),i[c][m]=s[l]}for(const[l,d]of Object.entries(i)){const p=a.find(c=>c.id===l);if(p)for(const[c,m]of Object.entries(d))Be(p,c,m);else{const c={id:l};for(const[m,g]of Object.entries(d))Be(c,m,g);a.push(c)}}return a}function or(t,n="id"){const r=Hn()[n],o=S.useSyncExternalStore(nt,Dt);return S.useMemo(()=>{if(!r)return null;try{const a=At(t);return rr(a,t).find(l=>l[n]===r)??null}catch(a){return console.error(`[useRecord] ${a.message}`),null}},[t,n,r,o])}function sr(t){const n=S.useSyncExternalStore(nt,Dt);return S.useMemo(()=>{try{const s=At(t);return rr(s,t)}catch(s){return console.error(`[useRecords] ${s.message}`),[]}},[t,n])}function de(t,n,s){return j(`record.${t}.${n}.${s}`)}function Do(t,n=""){const s=n.replace(/\/+$/,"");document.addEventListener("click",o=>{if(o.metaKey||o.ctrlKey||o.shiftKey||o.altKey)return;const a=o.target.closest("a[href]");if(!a||a.target==="_blank")return;const i=new URL(a.href,window.location.origin);if(i.origin!==window.location.origin)return;const l=window.location.hash,d=l&&l!=="#",c=i.hash&&i.hash!=="#"?i.hash:d?l:"";let m=i.pathname;s&&m.startsWith(s)&&(m=m.slice(s.length)||"/"),o.preventDefault(),t.navigate(m+i.search+c),setTimeout(qe,0)});const r=t.navigate.bind(t);t.navigate=(o,a)=>{const i=window.location.hash;return i&&i!=="#"&&typeof o=="string"&&!o.includes("#")&&(o=o+i),r(o,a).then(d=>(qe(),d))}}S.createContext(null);const Bo="_container_1j46h_1",Ho="_header_1j46h_8",Uo="_title_1j46h_13",Fo="_subtitle_1j46h_21",qo="_grid_1j46h_27",Wo="_card_1j46h_35",Vo="_thumbnail_1j46h_51",Yo="_cardBody_1j46h_71",Go="_sceneName_1j46h_76",Ko="_empty_1j46h_83",Jo="_sectionTitle_1j46h_92",Xo="_branchSection_1j46h_102",Zo="_branchMeta_1j46h_106",Qo="_author_1j46h_113",es="_authorAvatar_1j46h_120",ts="_authorName_1j46h_126",P={container:Bo,header:Ho,title:Uo,subtitle:Fo,grid:qo,card:Wo,thumbnail:Vo,cardBody:Yo,sceneName:Go,empty:Ko,sectionTitle:Jo,branchSection:Xo,branchMeta:Zo,author:Qo,authorAvatar:es,authorName:ts};function vn({name:t}){const n=Co(t),s=[];for(let o=0;o<12;o++){const a=n*(o+1),i=(a*7+o*31)%320,l=(a*13+o*17)%200,d=20+a*(o+3)%80,p=8+a*(o+7)%40,c=.06+a*(o+2)%20/100,m=o%3===0?"var(--placeholder-accent)":o%3===1?"var(--placeholder-fg)":"var(--placeholder-muted)";s.push(e.jsx("rect",{x:i,y:l,width:d,height:p,rx:2,fill:m,opacity:c},o))}const r=[];for(let o=0;o<6;o++){const i=10+n*(o+5)%180;r.push(e.jsx("line",{x1:0,y1:i,x2:320,y2:i,stroke:"var(--placeholder-grid)",strokeWidth:.5,opacity:.4},`h${o}`))}for(let o=0;o<8;o++){const i=10+n*(o+9)%300;r.push(e.jsx("line",{x1:i,y1:0,x2:i,y2:200,stroke:"var(--placeholder-grid)",strokeWidth:.5,opacity:.3},`v${o}`))}return e.jsxs("svg",{viewBox:"0 0 320 200",xmlns:"http://www.w3.org/2000/svg","aria-hidden":"true",children:[e.jsx("rect",{width:"320",height:"200",fill:"var(--placeholder-bg)"}),r,s]})}function ar({scenes:t={},pageModules:n={},basePath:s,title:r="Viewfinder"}){const[o,a]=S.useState(null),i=S.useMemo(()=>Object.keys(t),[t]),l=S.useMemo(()=>Object.keys(n).map(p=>p.replace("/src/pages/","").replace(".jsx","")).filter(p=>!p.startsWith("_")&&p!=="index"&&p!=="viewfinder"),[n]),d=S.useMemo(()=>(s||"/storyboard-source/").replace(/\/[^/]*\/$/,"/"),[s]);return S.useEffect(()=>{const p=`${d}branches.json`;fetch(p).then(c=>c.ok?c.json():[]).then(c=>a(Array.isArray(c)?c:[])).catch(()=>a([]))},[d]),e.jsxs("div",{className:P.container,children:[e.jsxs("header",{className:P.header,children:[e.jsx("h1",{className:P.title,children:r}),e.jsxs("p",{className:P.subtitle,children:[i.length," scene",i.length!==1?"s":"",o&&o.length>0?` · ${o.length} branch preview${o.length!==1?"s":""}`:""]})]}),i.length===0?e.jsxs("p",{className:P.empty,children:["No scenes found. Add a ",e.jsx("code",{children:"*.scene.json"})," file to get started."]}):e.jsxs("section",{children:[e.jsx("h2",{className:P.sectionTitle,children:"Scenes"}),e.jsx("div",{className:P.grid,children:i.map(p=>{const c=_o(p);return e.jsxs(me,{to:Eo(p,l),className:P.card,children:[e.jsx("div",{className:P.thumbnail,children:e.jsx(vn,{name:p})}),e.jsxs("div",{className:P.cardBody,children:[e.jsx("p",{className:P.sceneName,children:p}),c?.author&&e.jsxs("div",{className:P.author,children:[e.jsx("img",{src:`https://github.com/${c.author}.png?size=32`,alt:c.author,className:P.authorAvatar}),e.jsx("span",{className:P.authorName,children:c.author})]})]})]},p)})})]}),o&&o.length>0&&e.jsxs("section",{className:P.branchSection,children:[e.jsx("h2",{className:P.sectionTitle,children:"Branch Previews"}),e.jsx("div",{className:P.grid,children:o.map(p=>e.jsxs("a",{href:`${d}${p.folder}/`,className:P.card,children:[e.jsx("div",{className:P.thumbnail,children:e.jsx(vn,{name:p.branch})}),e.jsxs("div",{className:P.cardBody,children:[e.jsx("p",{className:P.sceneName,children:p.branch}),e.jsx("p",{className:P.branchMeta,children:p.folder})]})]},p.folder))})]})]})}function ns(){return e.jsxs("div",{style:{display:"flex",alignItems:"center",justifyContent:"center",minHeight:"100vh",backgroundColor:"var(--bgColor-default, #0d1117)"},children:[e.jsxs("svg",{width:"48",height:"48",viewBox:"0 0 24 24",fill:"none",style:{animation:"spin 0.8s linear infinite"},children:[e.jsx("circle",{cx:"12",cy:"12",r:"10",stroke:"var(--fgColor-muted, #484f58)",strokeWidth:"2.5",opacity:"0.25"}),e.jsx("path",{d:"M12 2a10 10 0 0 1 10 10",stroke:"var(--fgColor-default, #e6edf3)",strokeWidth:"2.5",strokeLinecap:"round"})]}),e.jsx("style",{children:"@keyframes spin { to { transform: rotate(360deg) } }"})]})}function rs(){return e.jsx(Mo,{children:e.jsx(S.Suspense,{fallback:e.jsx(ns,{}),children:e.jsx(Un,{})})})}const Ft=Object.freeze(Object.defineProperty({__proto__:null,default:rs},Symbol.toStringTag,{value:"Module"})),os="_navItem_ec50i_1",ss="_active_ec50i_16",yn={navItem:os,active:ss},as=[{label:"Overview",path:"/Dashboard"},{label:"Issues",path:"/reshaped-issues"},{label:"Projects",path:"/Dashboard"},{label:"Views",path:"/Dashboard"}];function ct(t){return typeof t=="string"?t:""}function Ve({orgName:t,activePage:n,userInfo:s}){const r=Et();return e.jsx(ce,{padding:4,children:e.jsxs(u,{direction:"column",gap:2,children:[e.jsx(h,{variant:"featured-3",weight:"bold",children:ct(t)||"—"}),e.jsx(te,{}),e.jsx("nav",{children:e.jsx(u,{direction:"column",gap:0,children:as.map(o=>e.jsx("button",{type:"button",className:`${yn.navItem} ${n===o.label?yn.active:""}`,onClick:()=>r(o.path),children:e.jsx(h,{variant:"body-3",weight:n===o.label?"bold":"regular",children:o.label})},o.label))})}),s&&e.jsxs(e.Fragment,{children:[e.jsx(te,{}),e.jsxs(u,{direction:"column",gap:1,paddingTop:1,children:[e.jsx(h,{variant:"caption-1",color:"neutral-faded",children:ct(s.name)||"—"}),e.jsx(h,{variant:"caption-1",color:"neutral-faded",children:ct(s.role)||"—"})]})]})]})})}function he(t){return t==null||t===""||typeof t=="object"?"—":String(t)}function ze({label:t,value:n,change:s,color:r}){return e.jsx(ce,{padding:5,children:e.jsxs(u,{direction:"column",gap:2,children:[e.jsx(h,{variant:"body-3",color:"neutral-faded",children:t}),e.jsx(h,{variant:"featured-2",weight:"bold",children:n}),e.jsx(h,{variant:"caption-1",color:r||"positive",children:s})]})})}function Se({label:t,value:n,max:s,color:r}){return e.jsxs(u,{direction:"column",gap:1,children:[e.jsxs(u,{direction:"row",justify:"space-between",children:[e.jsx(h,{variant:"body-3",children:t}),e.jsx(h,{variant:"body-3",weight:"medium",children:n})]}),e.jsx(Fr,{value:typeof s=="number"?parseFloat(n)/s*100:parseFloat(n),color:r,size:"small",attributes:{"aria-label":t}})]})}const is=[{label:"Team standup",time:"Today, 10:00"},{label:"Architecture review",time:"Today, 11:30"},{label:"Lunch",time:"Today, 12:30"},{label:"Sprint planning",time:"Today, 14:00"},{label:"Deploy v2.4",time:"Today, 17:00"}];function cs(){const t=B("signup.fullName"),n=B("signup.organization.name"),s=B("signup.organization.size"),r=B("signup.organization.role"),o=B("signup.workspace.region"),a=B("signup.workspace.plan");return e.jsx(Ie,{defaultTheme:"reshaped",defaultColorMode:"dark",children:e.jsx(u,{backgroundColor:"page",minHeight:"100vh",padding:12,children:e.jsxs(u,{direction:"row",align:"start",gap:8,wrap:"no-wrap",children:[e.jsx(u.Item,{columns:2,children:e.jsx(Ve,{orgName:he(n),activePage:"Overview",userInfo:{name:he(t),role:he(r)}})}),e.jsx(u.Item,{columns:10,direction:"column",align:"center",justify:"center",children:e.jsxs(u,{direction:"column",maxWidth:"80%",gap:4,children:[e.jsxs(u,{direction:"row",justify:"space-between",align:"center",children:[e.jsx(h,{variant:"featured-2",weight:"bold",children:"Overview"}),e.jsxs(u,{direction:"row",gap:2,align:"center",children:[e.jsxs(Ne,{color:"positive",children:[he(a)," plan"]}),e.jsx(Ne,{variant:"faded",children:he(o)})]})]}),e.jsxs(u,{direction:"row",gap:3,children:[e.jsx(u.Item,{columns:3,children:e.jsx(ze,{label:"Active Users",value:"0",change:"No data yet",color:"neutral-faded"})}),e.jsx(u.Item,{columns:3,children:e.jsx(ze,{label:"Deployments",value:"0",change:"No data yet",color:"neutral-faded"})}),e.jsx(u.Item,{columns:3,children:e.jsx(ze,{label:"New Members",value:"1",change:"That's you!",color:"primary"})}),e.jsx(u.Item,{columns:3,children:e.jsx(ze,{label:"Team Size",value:he(s),change:"Current plan capacity",color:"primary"})})]}),e.jsxs(u,{direction:"row",gap:4,children:[e.jsx(u.Item,{columns:5,children:e.jsxs(u,{direction:"column",gap:4,children:[e.jsx(ce,{padding:4,children:e.jsx(Ur,{})}),e.jsx(ce,{padding:5,children:e.jsxs(u,{direction:"column",gap:3,children:[e.jsx(h,{variant:"body-2",weight:"bold",children:"Schedule"}),e.jsx(u,{direction:"column",gap:2,children:is.map(i=>e.jsx(gt,{name:`schedule-${i.label}`,children:e.jsxs(u,{direction:"column",children:[e.jsx(h,{variant:"body-3",children:i.label}),e.jsx(h,{variant:"caption-1",color:"neutral-faded",children:i.time})]})},i.label))})]})})]})}),e.jsx(u.Item,{grow:!0,children:e.jsxs(u,{direction:"column",gap:4,children:[e.jsx(ce,{padding:5,children:e.jsxs(u,{direction:"column",gap:4,children:[e.jsx(h,{variant:"body-2",weight:"bold",children:"Metrics"}),e.jsx(Se,{label:"Performance",value:"0",max:100,color:"neutral-faded"}),e.jsx(Se,{label:"Monthly revenue goal",value:"0",max:100,color:"neutral-faded"}),e.jsx(Se,{label:"Error rate",value:"0",max:100,color:"neutral-faded"}),e.jsx(Se,{label:"User acquisition",value:"0",max:100,color:"neutral-faded"}),e.jsx(Se,{label:"Releases shipped",value:"0",max:100,color:"neutral-faded"})]})}),e.jsx(ce,{padding:5,children:e.jsxs(u,{direction:"column",gap:3,children:[e.jsx(h,{variant:"body-2",weight:"bold",children:"Recent activity"}),e.jsx(te,{}),e.jsxs(u,{direction:"column",gap:4,align:"center",paddingBlock:6,children:[e.jsx(h,{variant:"body-3",color:"neutral-faded",children:"No activity yet"}),e.jsx(h,{variant:"caption-1",color:"neutral-faded",children:"Deployments and events will appear here once your workspace is active."})]})]})})]})})]})]})})]})})})}const qt=Object.freeze(Object.defineProperty({__proto__:null,default:cs},Symbol.toStringTag,{value:"Module"})),lt=["Account","Organization","Workspace","Review"];function oe(t){return typeof t=="string"?t:""}function wn(t){return t===!0||t==="true"}function $e({name:t,defaultValue:n,onCommit:s,...r}){const o=S.useRef(n);return e.jsx(ge,{name:t,defaultValue:n,onChange:({value:a})=>{o.current=a},onBlur:()=>s(o.current),...r})}function ls(){const t=Et(),[n,s]=j("signup.step"),r=Math.min(Math.max(parseInt(n,10)||0,0),lt.length-1),o=C=>{const $=typeof C=="function"?C(r):C;s(String($))},[a,i,l]=j("signup.errors.fullName"),[d,p,c]=j("signup.errors.email"),[m,g,k]=j("signup.errors.password"),[y,v,N]=j("signup.errors.orgName"),[w,L,A]=j("signup.errors.orgSize"),[M,O,G]=j("signup.errors.role"),[q,X,W]=j("signup.errors.region"),[f,E,I]=j("signup.errors.plan"),[R,D,T]=j("signup.errors.agreeTerms"),x={fullName:a,email:d,password:m,orgName:y,orgSize:w,role:M,region:q,plan:f,agreeTerms:R},V={fullName:i,email:p,password:g,orgName:v,orgSize:L,role:O,region:X,plan:E,agreeTerms:D},H={fullName:l,email:c,password:k,orgName:N,orgSize:A,role:G,region:W,plan:I,agreeTerms:T},le=()=>Object.values(H).forEach(C=>C()),Xt=C=>{le(),Object.entries(C).forEach(([$,Hr])=>V[$]?.(Hr))},[Zt,Ir]=j("signup.fullName"),[Qt,Nr]=j("signup.email"),[en,Rr]=j("signup.password"),[tn,Pr]=j("signup.organization.name"),[nn,Lr]=j("signup.organization.size"),[rn,Tr]=j("signup.organization.role"),[on,zr]=j("signup.workspace.region"),[sn,$r]=j("signup.workspace.plan"),[an,Ar]=j("signup.workspace.newsletter"),[cn,Or]=j("signup.workspace.agreeTerms"),_=S.useMemo(()=>({fullName:oe(Zt),email:oe(Qt),password:oe(en),orgName:oe(tn),orgSize:oe(nn),role:oe(rn),region:oe(on),plan:oe(sn)||"starter",newsletter:wn(an),agreeTerms:wn(cn)}),[Zt,Qt,en,tn,nn,rn,on,sn,an,cn]);function ln(C){const $={};return C===0&&(_.fullName.trim()||($.fullName="Full name is required."),_.email.trim()||($.email="Email is required."),_.password.trim()||($.password="Password is required.")),C===1&&(_.orgName.trim()||($.orgName="Organization name is required."),_.orgSize.trim()||($.orgSize="Organization size is required."),_.role.trim()||($.role="Role is required.")),C===2&&(_.region.trim()||($.region="Region is required."),_.plan.trim()||($.plan="Plan is required."),_.agreeTerms||($.agreeTerms="You must accept terms to continue.")),Xt($),Object.keys($).length===0}function Mr(){ln(r)&&o(C=>Math.min(C+1,lt.length-1))}function Dr(){Xt({}),o(C=>Math.max(C-1,0))}function Br(){if(!ln(2)){o(2);return}t("/Dashboard")}return e.jsx(Ie,{defaultTheme:"reshaped",defaultColorMode:"dark",children:e.jsx(u,{backgroundColor:"page",minHeight:"100vh",padding:6,align:"center",justify:"center",children:e.jsxs(u,{maxWidth:"560px",width:"100%",direction:"column",gap:6,children:[e.jsxs(u,{direction:"column",gap:2,children:[e.jsx(h,{variant:"featured-1",weight:"bold",children:"Create your cloud account"}),e.jsx(h,{variant:"body-2",color:"neutral-faded",children:"Complete the onboarding flow to configure your account and organization."})]}),e.jsx(dn,{activeId:String(r),children:lt.map((C,$)=>e.jsx(dn.Item,{id:String($),title:C,completed:$<r,subtitle:`Step ${$+1}`},C))}),e.jsx(ce,{padding:6,children:e.jsxs(u,{direction:"column",gap:5,children:[r===0&&e.jsxs(e.Fragment,{children:[e.jsxs(b,{hasError:!!x.fullName,children:[e.jsx(b.Label,{children:"Full name"}),e.jsx($e,{name:"fullName",defaultValue:_.fullName,placeholder:"Jane Doe",onCommit:Ir}),x.fullName&&e.jsx(b.Error,{children:x.fullName})]}),e.jsxs(b,{hasError:!!x.email,children:[e.jsx(b.Label,{children:"Email"}),e.jsx($e,{name:"email",defaultValue:_.email,placeholder:"jane@acme.cloud",onCommit:Nr}),x.email&&e.jsx(b.Error,{children:x.email})]}),e.jsxs(b,{hasError:!!x.password,children:[e.jsx(b.Label,{children:"Password"}),e.jsx($e,{name:"password",defaultValue:_.password,onCommit:Rr,inputAttributes:{type:"password"}}),x.password&&e.jsx(b.Error,{children:x.password})]})]}),r===1&&e.jsxs(e.Fragment,{children:[e.jsxs(b,{hasError:!!x.orgName,children:[e.jsx(b.Label,{children:"Organization name"}),e.jsx($e,{name:"orgName",defaultValue:_.orgName,placeholder:"Acme Cloud",onCommit:Pr}),x.orgName&&e.jsx(b.Error,{children:x.orgName})]}),e.jsxs(b,{hasError:!!x.orgSize,children:[e.jsx(b.Label,{children:"Organization size"}),e.jsxs(fe,{name:"orgSize",value:_.orgSize,placeholder:"Select size",onChange:({value:C})=>Lr(C),children:[e.jsx("option",{value:"1-10",children:"1–10 employees"}),e.jsx("option",{value:"11-50",children:"11–50 employees"}),e.jsx("option",{value:"51-250",children:"51–250 employees"}),e.jsx("option",{value:"251+",children:"251+ employees"})]}),x.orgSize&&e.jsx(b.Error,{children:x.orgSize})]}),e.jsxs(b,{hasError:!!x.role,children:[e.jsx(b.Label,{children:"Your role"}),e.jsxs(fe,{name:"role",value:_.role,placeholder:"Select role",onChange:({value:C})=>Tr(C),children:[e.jsx("option",{value:"founder",children:"Founder"}),e.jsx("option",{value:"engineering-manager",children:"Engineering Manager"}),e.jsx("option",{value:"developer",children:"Developer"}),e.jsx("option",{value:"platform-admin",children:"Platform Admin"})]}),x.role&&e.jsx(b.Error,{children:x.role})]})]}),r===2&&e.jsxs(e.Fragment,{children:[e.jsxs(b,{hasError:!!x.region,children:[e.jsx(b.Label,{children:"Primary region"}),e.jsxs(fe,{name:"region",value:_.region,placeholder:"Select region",onChange:({value:C})=>zr(C),children:[e.jsx("option",{value:"us-east-1",children:"US East"}),e.jsx("option",{value:"us-west-2",children:"US West"}),e.jsx("option",{value:"eu-west-1",children:"EU West"}),e.jsx("option",{value:"ap-southeast-1",children:"AP Southeast"})]}),x.region&&e.jsx(b.Error,{children:x.region})]}),e.jsxs(b,{hasError:!!x.plan,children:[e.jsx(b.Label,{children:"Starting plan"}),e.jsxs(fe,{name:"plan",value:_.plan,onChange:({value:C})=>$r(C),children:[e.jsx("option",{value:"starter",children:"Starter"}),e.jsx("option",{value:"growth",children:"Growth"}),e.jsx("option",{value:"enterprise",children:"Enterprise"})]}),x.plan&&e.jsx(b.Error,{children:x.plan})]}),e.jsx(gt,{name:"newsletter",checked:_.newsletter,onChange:({checked:C})=>Ar(C?"true":"false"),children:"Email me product updates and onboarding tips"}),e.jsxs(b,{hasError:!!x.agreeTerms,children:[e.jsx(gt,{name:"agreeTerms",checked:_.agreeTerms,onChange:({checked:C})=>Or(C?"true":"false"),children:"I agree to the Terms of Service and Privacy Policy"}),x.agreeTerms&&e.jsx(b.Error,{children:x.agreeTerms})]})]}),r===3&&e.jsxs(u,{direction:"column",gap:4,children:[e.jsx(h,{variant:"featured-3",weight:"bold",children:"Review your configuration"}),e.jsxs(u,{direction:"column",gap:3,children:[e.jsxs(u,{direction:"row",align:"center",children:[e.jsx(u.Item,{columns:4,children:e.jsx(h,{variant:"body-3",color:"neutral-faded",children:"Name"})}),e.jsx(u.Item,{grow:!0,children:e.jsx(h,{variant:"body-2",children:_.fullName})})]}),e.jsxs(u,{direction:"row",align:"center",children:[e.jsx(u.Item,{columns:4,children:e.jsx(h,{variant:"body-3",color:"neutral-faded",children:"Email"})}),e.jsx(u.Item,{grow:!0,children:e.jsx(h,{variant:"body-2",children:_.email})})]}),e.jsxs(u,{direction:"row",align:"center",children:[e.jsx(u.Item,{columns:4,children:e.jsx(h,{variant:"body-3",color:"neutral-faded",children:"Organization"})}),e.jsx(u.Item,{grow:!0,children:e.jsx(h,{variant:"body-2",children:_.orgName})})]}),e.jsxs(u,{direction:"row",align:"center",children:[e.jsx(u.Item,{columns:4,children:e.jsx(h,{variant:"body-3",color:"neutral-faded",children:"Team size"})}),e.jsx(u.Item,{grow:!0,children:e.jsx(h,{variant:"body-2",children:_.orgSize})})]}),e.jsxs(u,{direction:"row",align:"center",children:[e.jsx(u.Item,{columns:4,children:e.jsx(h,{variant:"body-3",color:"neutral-faded",children:"Role"})}),e.jsx(u.Item,{grow:!0,children:e.jsx(h,{variant:"body-2",children:_.role})})]}),e.jsxs(u,{direction:"row",align:"center",children:[e.jsx(u.Item,{columns:4,children:e.jsx(h,{variant:"body-3",color:"neutral-faded",children:"Region"})}),e.jsx(u.Item,{grow:!0,children:e.jsx(h,{variant:"body-2",children:_.region})})]}),e.jsxs(u,{direction:"row",align:"center",children:[e.jsx(u.Item,{columns:4,children:e.jsx(h,{variant:"body-3",color:"neutral-faded",children:"Plan"})}),e.jsx(u.Item,{grow:!0,children:e.jsx(h,{variant:"body-2",children:_.plan})})]}),e.jsxs(u,{direction:"row",align:"center",children:[e.jsx(u.Item,{columns:4,children:e.jsx(h,{variant:"body-3",color:"neutral-faded",children:"Newsletter"})}),e.jsx(u.Item,{grow:!0,children:e.jsx(h,{variant:"body-2",children:_.newsletter?"Yes":"No"})})]})]})]}),e.jsxs(u,{direction:"row",justify:"end",gap:3,children:[r>0&&e.jsx(ne,{variant:"ghost",onClick:Dr,children:"Back"}),r<3&&e.jsx(ne,{color:"primary",onClick:Mr,children:"Continue"}),r===3&&e.jsx(ne,{color:"primary",onClick:Br,children:"Create account"})]})]})})]})})})}const Wt=Object.freeze(Object.defineProperty({__proto__:null,default:ls},Symbol.toStringTag,{value:"Module"})),ds=Object.assign({"/src/pages/Dashboard.jsx":()=>ee(()=>Promise.resolve().then(()=>qt),void 0),"/src/pages/Signup.jsx":()=>ee(()=>Promise.resolve().then(()=>Wt),void 0),"/src/pages/_app.jsx":()=>ee(()=>Promise.resolve().then(()=>Ft),void 0),"/src/pages/viewfinder.jsx":()=>ee(()=>Promise.resolve().then(()=>pr),void 0)});function us(){return e.jsx(ar,{scenes:Ht,pageModules:ds,basePath:"/storyboard/"})}const ir=Object.freeze(Object.defineProperty({__proto__:null,default:us},Symbol.toStringTag,{value:"Module"}));var dt={exports:{}},ut,jn;function ps(){if(jn)return ut;jn=1;var t="SECRET_DO_NOT_PASS_THIS_OR_YOU_WILL_BE_FIRED";return ut=t,ut}var pt,Sn;function ms(){if(Sn)return pt;Sn=1;var t=ps();function n(){}function s(){}return s.resetWarningCache=n,pt=function(){function r(i,l,d,p,c,m){if(m!==t){var g=new Error("Calling PropTypes validators directly is not supported by the `prop-types` package. Use PropTypes.checkPropTypes() to call them. Read more at http://fb.me/use-check-prop-types");throw g.name="Invariant Violation",g}}r.isRequired=r;function o(){return r}var a={array:r,bigint:r,bool:r,func:r,number:r,object:r,string:r,symbol:r,any:r,arrayOf:o,element:r,elementType:r,instanceOf:o,node:r,objectOf:o,oneOf:o,oneOfType:o,shape:o,exact:o,checkPropTypes:s,resetWarningCache:n};return a.PropTypes=a,a},pt}var Cn;function hs(){return Cn||(Cn=1,dt.exports=ms()()),dt.exports}var gs=hs();const Z=qr(gs),fs="_header_1282e_1",bs="_headerContent_1282e_8",xs="_titleWrapper_1282e_17",vs="_separator_1282e_21",ys="_subtitle_1282e_25",Ce={header:fs,headerContent:bs,titleWrapper:xs,separator:vs,subtitle:ys},ws=[{icon:_t,label:"Code",current:!0},{icon:F,label:"Issues",counter:30},{icon:kt,label:"Pull Requests",counter:3},{icon:It,label:"Discussions"},{icon:Nt,label:"Actions"},{icon:Rt,label:"Projects",counter:7},{icon:Pt,label:"Security",counter:12},{icon:Lt,label:"Insights"}];function cr({items:t=ws,title:n,subtitle:s}){return e.jsxs(re,{as:"header",className:Ce.header,children:[e.jsxs("div",{className:Ce.headerContent,children:[e.jsx(Gr,{icon:Qr,"aria-label":"Open global navigation menu",unsafeDisableTooltip:!0}),e.jsx(eo,{size:32}),e.jsxs(re,{direction:"horizontal",gap:"condensed",className:Ce.titleWrapper,children:[e.jsx("span",{children:n||"title"}),s&&e.jsxs(e.Fragment,{children:[e.jsx(z,{className:Ce.separator,children:"/"}),e.jsx(z,{className:Ce.subtitle,children:s||"subtitle"})]})]})]}),e.jsx(pn,{"aria-label":"Repository",children:t.map(r=>e.jsx(pn.Item,{icon:r.icon,"aria-current":r.current?"page":void 0,counter:r.counter,href:r.url,children:r.label},r.label))})]})}cr.propTypes={items:Z.arrayOf(Z.shape({icon:Z.elementType,label:Z.string.isRequired,current:Z.bool,counter:Z.number,url:Z.string})),title:Z.string,subtitle:Z.string};const js=[{icon:F,label:"Open issues",url:"#"},{icon:Tt,label:"Your issues",url:"#"},{icon:zt,label:"Assigned to you",url:"#",current:!0},{icon:$t,label:"Mentioning you",url:"#"}];function Ss({items:t=js}){return e.jsx(st,{"aria-label":"Navigation",children:t.map(n=>e.jsxs(st.Item,{href:n.url,"aria-current":n.current?"page":void 0,children:[n.icon&&e.jsx(st.LeadingVisual,{children:e.jsx(n.icon,{})}),n.label]},n.label))})}const Cs="_wrapper_74lhx_1",Es="_navigation_74lhx_7",_s="_main_74lhx_13",ks="_container_74lhx_22",Ae={wrapper:Cs,navigation:Es,main:_s,container:ks};function xt({children:t,title:n,subtitle:s,topnav:r,sidenav:o}){return e.jsxs(re,{className:Ae.container,children:[e.jsx(cr,{title:n,subtitle:s,items:r}),e.jsxs("div",{className:Ae.wrapper,children:[o&&e.jsx("aside",{className:Ae.navigation,children:e.jsx(Ss,{items:o})}),e.jsx("main",{className:Ae.main,children:t})]})]})}const En=[{icon:_t,label:"Code",url:"/"},{icon:F,label:"Issues",counter:10,url:"/primer-issues",current:!0},{icon:kt,label:"Pull Requests",counter:3},{icon:It,label:"Discussions"},{icon:Nt,label:"Actions"},{icon:Rt,label:"Projects",counter:7},{icon:Pt,label:"Security",counter:12},{icon:Lt,label:"Insights"}],_n=[{icon:F,label:"Open issues",url:"/primer-issues"},{icon:Tt,label:"Your issues",url:""},{icon:zt,label:"Assigned to you",url:""},{icon:$t,label:"Mentioning you",url:""}],Is={todo:F,in_progress:F,done:Vn,cancelled:Wn},kn={todo:"Open",in_progress:"In Progress",done:"Closed",cancelled:"Cancelled"},Ns={urgent:"Urgent",high:"High",medium:"Medium",low:"Low"};function Rs(){const t=or("issues","id");if(B("user"),!t)return e.jsx(xt,{title:"Primer",subtitle:"React",topnav:En,sidenav:_n,children:e.jsxs("div",{style:{textAlign:"center",padding:"var(--base-size-64) var(--base-size-16)"},children:[e.jsx("h2",{children:"Issue not found"}),e.jsx("p",{style:{color:"var(--fgColor-muted)",marginTop:"var(--base-size-8)"},children:"The issue you're looking for doesn't exist."}),e.jsx(me,{to:"/primer-issues",style:{color:"var(--fgColor-accent)"},children:"← Back to all issues"})]})});const n=Is[t.status]||F,s=t.status==="done"||t.status==="cancelled";return e.jsx(xt,{title:"Primer",subtitle:"React",topnav:En,sidenav:_n,children:e.jsxs("div",{style:{display:"flex",gap:"var(--base-size-32)",alignItems:"flex-start",maxWidth:960},children:[e.jsxs("div",{style:{flex:1,minWidth:0},children:[e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:"var(--base-size-8)",marginBottom:"var(--base-size-16)",fontSize:"var(--text-caption-size)",color:"var(--fgColor-muted)"},children:[e.jsx(me,{to:"/primer-issues",style:{color:"var(--fgColor-muted)",textDecoration:"none"},children:"Issues"}),e.jsx("span",{children:"›"}),e.jsx("span",{children:t.identifier})]}),e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:"var(--base-size-8)",marginBottom:"var(--base-size-8)"},children:[e.jsx("span",{style:{color:s?"var(--fgColor-done)":"var(--fgColor-success)"},children:e.jsx(n,{size:24})}),e.jsx("h1",{style:{fontSize:"var(--text-title-size-medium)",fontWeight:600,margin:0},children:t.title})]}),e.jsx("div",{style:{marginBottom:"var(--base-size-16)"},children:e.jsx(Fn,{status:s?"issueClosed":"issueOpened",children:kn[t.status]||t.status})}),t.description&&e.jsx("p",{style:{color:"var(--fgColor-muted)",marginBottom:"var(--base-size-24)",lineHeight:1.5},children:t.description}),t.acceptanceCriteria?.length>0&&e.jsxs("div",{style:{marginBottom:"var(--base-size-24)"},children:[e.jsx("h3",{style:{fontSize:"var(--text-body-size-medium)",fontWeight:600,marginBottom:"var(--base-size-8)"},children:"Acceptance Criteria"}),e.jsx("ul",{style:{margin:0,paddingLeft:"1.5rem",color:"var(--fgColor-default)"},children:t.acceptanceCriteria.map((r,o)=>e.jsx("li",{style:{marginBottom:"var(--base-size-4)",lineHeight:1.5},children:r},o))})]}),t.technicalNotes?.length>0&&e.jsxs("div",{style:{marginBottom:"var(--base-size-24)"},children:[e.jsx("h3",{style:{fontSize:"var(--text-body-size-medium)",fontWeight:600,marginBottom:"var(--base-size-8)"},children:"Technical Notes"}),e.jsx("ul",{style:{margin:0,paddingLeft:"1.5rem",color:"var(--fgColor-default)"},children:t.technicalNotes.map((r,o)=>e.jsx("li",{style:{marginBottom:"var(--base-size-4)",lineHeight:1.5},children:r},o))})]}),e.jsxs("div",{style:{borderTop:"1px solid var(--borderColor-default)",paddingTop:"var(--base-size-16)",marginTop:"var(--base-size-16)"},children:[e.jsx("h3",{style:{fontSize:"var(--text-body-size-medium)",fontWeight:600,marginBottom:"var(--base-size-12)"},children:"Activity"}),e.jsx(re,{gap:"normal",children:(t.activity||[]).map((r,o)=>e.jsxs("div",{style:{display:"flex",gap:"var(--base-size-12)",alignItems:"flex-start"},children:[e.jsx(ft,{src:r.avatar,size:32,alt:r.user}),e.jsxs("div",{children:[e.jsx(z,{as:"span",style:{fontWeight:600},children:r.user}),e.jsxs(z,{as:"span",style:{color:"var(--fgColor-muted)"},children:[r.type==="created"&&" created the issue",r.type==="comment"&&":"]}),r.body&&e.jsx("p",{style:{color:"var(--fgColor-muted)",margin:"var(--base-size-4) 0 0",lineHeight:1.5},children:r.body}),e.jsx(z,{as:"span",style:{fontSize:"var(--text-caption-size)",color:"var(--fgColor-muted)"},children:r.time})]})]},o))})]})]}),e.jsxs("div",{style:{width:240,flexShrink:0,border:"1px solid var(--borderColor-default)",borderRadius:"var(--borderRadius-medium)",padding:"var(--base-size-16)"},children:[e.jsx(z,{as:"p",style:{fontSize:"var(--text-caption-size)",color:"var(--fgColor-muted)",fontWeight:600,marginBottom:"var(--base-size-12)"},children:"Properties"}),e.jsx("div",{style:{borderTop:"1px solid var(--borderColor-default)",paddingTop:"var(--base-size-12)"},children:e.jsxs(re,{gap:"normal",children:[e.jsxs("div",{children:[e.jsx(z,{as:"p",style:{fontSize:"var(--text-caption-size)",color:"var(--fgColor-muted)"},children:"Status"}),e.jsx(z,{as:"p",children:kn[t.status]||t.status})]}),e.jsxs("div",{children:[e.jsx(z,{as:"p",style:{fontSize:"var(--text-caption-size)",color:"var(--fgColor-muted)"},children:"Priority"}),e.jsx(z,{as:"p",style:{textTransform:"capitalize"},children:Ns[t.priority]||t.priority})]}),e.jsxs("div",{children:[e.jsx(z,{as:"p",style:{fontSize:"var(--text-caption-size)",color:"var(--fgColor-muted)"},children:"Assignee"}),t.assignee?e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:"var(--base-size-8)"},children:[e.jsx(ft,{src:t.assigneeAvatar,size:20,alt:t.assignee}),e.jsx(z,{as:"span",children:t.assignee})]}):e.jsx(z,{as:"p",style:{color:"var(--fgColor-muted)"},children:"Unassigned"})]}),e.jsxs("div",{children:[e.jsx(z,{as:"p",style:{fontSize:"var(--text-caption-size)",color:"var(--fgColor-muted)"},children:"Labels"}),e.jsx("div",{style:{display:"flex",gap:"var(--base-size-4)",flexWrap:"wrap"},children:(t.labels||[]).map(r=>e.jsx(qn,{size:"small",children:r},r))})]}),t.project&&e.jsxs("div",{children:[e.jsx(z,{as:"p",style:{fontSize:"var(--text-caption-size)",color:"var(--fgColor-muted)"},children:"Project"}),e.jsx(z,{as:"p",children:t.project})]}),t.estimate&&e.jsxs("div",{children:[e.jsx(z,{as:"p",style:{fontSize:"var(--text-caption-size)",color:"var(--fgColor-muted)"},children:"Estimate"}),e.jsxs(z,{as:"p",children:[t.estimate," points"]})]})]})})]})]})})}const Ps=Object.freeze(Object.defineProperty({__proto__:null,default:Rs},Symbol.toStringTag,{value:"Module"})),Ls="_issueRow_138tt_1",Ts={issueRow:Ls},zs=[{icon:_t,label:"Code",url:"/"},{icon:F,label:"Issues",counter:10,url:"/primer-issues",current:!0},{icon:kt,label:"Pull Requests",counter:3},{icon:It,label:"Discussions"},{icon:Nt,label:"Actions"},{icon:Rt,label:"Projects",counter:7},{icon:Pt,label:"Security",counter:12},{icon:Lt,label:"Insights"}],$s=[{icon:F,label:"Open issues",url:"",current:!0},{icon:Tt,label:"Your issues",url:""},{icon:zt,label:"Assigned to you",url:""},{icon:$t,label:"Mentioning you",url:""}],As={todo:F,in_progress:F,done:Vn,cancelled:Wn};function In({issue:t}){const n=As[t.status]||F,s=t.status==="done"||t.status==="cancelled";return e.jsxs(me,{to:`/primer-issues/${t.id}`,className:Ts.issueRow,style:{display:"flex",alignItems:"flex-start",gap:"var(--base-size-12)",padding:"var(--base-size-8) var(--base-size-16)",borderBottom:"1px solid var(--borderColor-default)"},children:[e.jsx("span",{style:{paddingTop:2,color:s?"var(--fgColor-done)":"var(--fgColor-success)"},children:e.jsx(n,{size:16})}),e.jsxs("div",{style:{flex:1,minWidth:0},children:[e.jsx(z,{as:"span",style:{fontWeight:600,fontSize:"var(--text-body-size-medium)"},children:t.title}),e.jsxs("div",{style:{display:"flex",gap:"var(--base-size-4)",marginTop:"var(--base-size-4)",flexWrap:"wrap",alignItems:"center"},children:[e.jsx(z,{as:"span",style:{fontSize:"var(--text-caption-size)",color:"var(--fgColor-muted)"},children:t.identifier}),(t.labels||[]).map(r=>e.jsx(qn,{size:"small",children:r},r))]})]}),t.assigneeAvatar&&e.jsx(ft,{src:t.assigneeAvatar,size:20,alt:t.assignee})]})}function Os(){B("user");const t=sr("issues"),n=t.filter(r=>r.status!=="done"&&r.status!=="cancelled"),s=t.filter(r=>r.status==="done"||r.status==="cancelled");return e.jsx(xt,{title:"Primer",subtitle:"React",topnav:zs,sidenav:$s,children:e.jsxs("div",{style:{maxWidth:960},children:[e.jsxs(re,{direction:"horizontal",gap:"condensed",align:"center",style:{marginBottom:"var(--base-size-16)"},children:[e.jsxs(Fn,{status:"issueOpened",children:[n.length," Open"]}),e.jsxs("span",{style:{fontSize:"var(--text-caption-size)",color:"var(--fgColor-muted)",display:"flex",alignItems:"center",gap:"var(--base-size-4)"},children:[e.jsx(to,{size:16})," ",s.length," Closed"]})]}),e.jsxs("div",{style:{border:"1px solid var(--borderColor-default)",borderRadius:"var(--borderRadius-medium)",overflow:"hidden"},children:[n.map(r=>e.jsx(In,{issue:r},r.id)),s.map(r=>e.jsx(In,{issue:r},r.id)),t.length===0&&e.jsx("p",{style:{padding:"var(--base-size-32)",textAlign:"center",color:"var(--fgColor-muted)"},children:"No issues found."})]})]})})}const Ms=Object.freeze(Object.defineProperty({__proto__:null,default:Os},Symbol.toStringTag,{value:"Module"})),lr={todo:"Todo",in_progress:"In Progress",done:"Done",cancelled:"Cancelled"},dr={urgent:"Urgent",high:"High",medium:"Medium",low:"Low"},Ds=Object.entries(lr),Bs=Object.entries(dr);function ur({prefix:t}){const[n,s]=j(`${t}.title`),[r,o]=j(`${t}.description`),[a,i]=j(`${t}.status`),[l,d]=j(`${t}.priority`),[p,c]=j(`${t}.assignee`),[m,g]=j(`${t}.project`),[k,y]=j(`${t}.estimate`);return e.jsxs(u,{direction:"column",gap:4,children:[e.jsxs(b,{children:[e.jsx(b.Label,{children:"Title"}),e.jsx(ge,{name:"title",value:n??"",onChange:({value:v})=>s(v)})]}),e.jsxs(b,{children:[e.jsx(b.Label,{children:"Description"}),e.jsx(ge,{name:"description",multiline:!0,value:r??"",onChange:({value:v})=>o(v),inputAttributes:{rows:3}})]}),e.jsxs(u,{direction:"row",gap:4,children:[e.jsx(u.Item,{grow:!0,children:e.jsxs(b,{children:[e.jsx(b.Label,{children:"Status"}),e.jsx(fe,{name:"status",value:a??"todo",onChange:({value:v})=>i(v),children:Ds.map(([v,N])=>e.jsx("option",{value:v,children:N},v))})]})}),e.jsx(u.Item,{grow:!0,children:e.jsxs(b,{children:[e.jsx(b.Label,{children:"Priority"}),e.jsx(fe,{name:"priority",value:l??"medium",onChange:({value:v})=>d(v),children:Bs.map(([v,N])=>e.jsx("option",{value:v,children:N},v))})]})})]}),e.jsxs(u,{direction:"row",gap:4,children:[e.jsx(u.Item,{grow:!0,children:e.jsxs(b,{children:[e.jsx(b.Label,{children:"Assignee"}),e.jsx(ge,{name:"assignee",placeholder:"Username",value:p??"",onChange:({value:v})=>c(v)})]})}),e.jsx(u.Item,{grow:!0,children:e.jsxs(b,{children:[e.jsx(b.Label,{children:"Project"}),e.jsx(ge,{name:"project",placeholder:"Project name",value:m??"",onChange:({value:v})=>g(v)})]})})]}),e.jsxs(b,{children:[e.jsx(b.Label,{children:"Estimate (points)"}),e.jsx(ge,{name:"estimate",placeholder:"e.g. 5",value:k??"",onChange:({value:v})=>y(v)})]})]})}const Hs={Auth:"neutral",Backend:"critical",Feature:"primary",Bug:"critical",Security:"warning",Frontend:"primary",DevEx:"positive"},Oe=["title","description","status","priority","assignee","project","estimate"];function Us({issue:t,active:n,onClose:s}){const r={title:de("issues",t.id,"title"),description:de("issues",t.id,"description"),status:de("issues",t.id,"status"),priority:de("issues",t.id,"priority"),assignee:de("issues",t.id,"assignee"),project:de("issues",t.id,"project"),estimate:de("issues",t.id,"estimate")},o=()=>{Oe.forEach(l=>{ve(`draft.edit.${l}`,t[l]??"")})},a=()=>{const l=new URLSearchParams(window.location.hash.replace(/^#/,""));Oe.forEach(d=>{const[,p]=r[d];p(l.get(`draft.edit.${d}`)??"")}),Oe.forEach(d=>He(`draft.edit.${d}`)),s({reason:"save"})},i=()=>{Oe.forEach(l=>He(`draft.edit.${l}`)),s({reason:"cancel"})};return e.jsxs(xe,{active:n,onClose:i,onOpen:o,size:"600px",padding:6,position:"center",children:[e.jsx(xe.Title,{children:"Edit Issue"}),e.jsx(xe.Subtitle,{children:t.identifier}),e.jsxs(u,{direction:"column",gap:4,paddingTop:4,children:[e.jsx(ur,{prefix:"draft.edit"}),e.jsxs(u,{direction:"row",justify:"end",gap:2,paddingTop:2,children:[e.jsx(ne,{variant:"outline",onClick:i,children:"Cancel"}),e.jsx(ne,{color:"primary",onClick:a,children:"Save"})]})]})]})}function ue(t){return typeof t=="string"?t:""}function Fs(){const[t,n,s]=j("ui.editModal"),r=t==="true",o=or("issues","id"),a=B("signup.organization.name"),i=B("signup.fullName"),l=B("signup.organization.role");return o?e.jsx(Ie,{defaultTheme:"reshaped",defaultColorMode:"dark",children:e.jsx(u,{backgroundColor:"page",minHeight:"100vh",padding:12,children:e.jsxs(u,{direction:"row",align:"start",gap:8,wrap:"no-wrap",children:[e.jsx(u.Item,{columns:2,children:e.jsx(Ve,{orgName:ue(a),activePage:"Issues",userInfo:{name:ue(i),role:ue(l)}})}),e.jsx(u.Item,{grow:!0,children:e.jsxs(u,{direction:"row",gap:8,align:"start",children:[e.jsx(u.Item,{grow:!0,children:e.jsxs(u,{direction:"column",gap:4,maxWidth:"720px",children:[e.jsxs(u,{direction:"row",gap:2,align:"center",justify:"space-between",children:[e.jsxs(u,{direction:"row",gap:2,align:"center",children:[e.jsx(me,{to:"/reshaped-issues",style:{textDecoration:"none"},children:e.jsx(h,{variant:"caption-1",color:"neutral-faded",children:ue(a)||"Workspace"})}),e.jsx(h,{variant:"caption-1",color:"neutral-faded",children:"›"}),e.jsx(h,{variant:"caption-1",color:"neutral-faded",children:o.identifier})]}),e.jsx(ne,{variant:"outline",size:"small",onClick:()=>n("true"),children:"Edit issue"})]}),e.jsx(Us,{issue:o,active:r,onClose:()=>s()}),e.jsx(h,{variant:"featured-1",weight:"bold",children:o.title}),o.description&&e.jsx(h,{variant:"body-2",color:"neutral-faded",children:o.description}),o.acceptanceCriteria?.length>0&&e.jsxs(u,{direction:"column",gap:2,children:[e.jsx(h,{variant:"body-2",weight:"bold",children:"Acceptance Criteria"}),e.jsx("ul",{style:{margin:0,paddingLeft:"1.5rem"},children:o.acceptanceCriteria.map((d,p)=>e.jsx("li",{style:{marginBottom:"0.5rem"},children:e.jsx(h,{variant:"body-3",children:d})},p))})]}),o.technicalNotes?.length>0&&e.jsxs(u,{direction:"column",gap:2,children:[e.jsx(h,{variant:"body-2",weight:"bold",children:"Technical Notes"}),e.jsx("ul",{style:{margin:0,paddingLeft:"1.5rem"},children:o.technicalNotes.map((d,p)=>e.jsx("li",{style:{marginBottom:"0.5rem"},children:e.jsx(h,{variant:"body-3",children:d})},p))})]}),e.jsx(te,{}),e.jsx(h,{variant:"caption-1",color:"neutral-faded",children:"+ Add sub-issues"}),e.jsx(te,{}),e.jsxs(u,{direction:"column",gap:3,children:[e.jsx(h,{variant:"body-2",weight:"bold",children:"Activity"}),(o.activity||[]).map((d,p)=>e.jsxs(u,{direction:"row",gap:3,align:"center",children:[e.jsx(un,{src:d.avatar,initials:d.user?.[0]?.toUpperCase(),size:6}),e.jsxs(u,{direction:"column",children:[e.jsxs(h,{variant:"body-3",children:[e.jsx(h,{weight:"medium",children:d.user}),d.type==="created"&&" created the issue",d.type==="comment"&&":"]}),d.body&&e.jsx(h,{variant:"body-3",color:"neutral-faded",children:d.body}),e.jsx(h,{variant:"caption-1",color:"neutral-faded",children:d.time})]})]},p))]})]})}),e.jsx(u.Item,{columns:3,children:e.jsx(ce,{padding:4,children:e.jsxs(u,{direction:"column",gap:4,children:[e.jsx(h,{variant:"caption-1",color:"neutral-faded",weight:"medium",children:"Properties"}),e.jsx(te,{}),e.jsxs(u,{direction:"column",gap:1,children:[e.jsx(h,{variant:"caption-1",color:"neutral-faded",children:"Status"}),e.jsx(h,{variant:"body-3",children:lr[o.status]||o.status})]}),e.jsxs(u,{direction:"column",gap:1,children:[e.jsx(h,{variant:"caption-1",color:"neutral-faded",children:"Priority"}),e.jsx(h,{variant:"body-3",children:dr[o.priority]||o.priority})]}),e.jsxs(u,{direction:"column",gap:1,children:[e.jsx(h,{variant:"caption-1",color:"neutral-faded",children:"Assignee"}),o.assignee?e.jsxs(u,{direction:"row",gap:2,align:"center",children:[e.jsx(un,{src:o.assigneeAvatar,initials:o.assignee?.[0]?.toUpperCase(),size:5}),e.jsx(h,{variant:"body-3",children:o.assignee})]}):e.jsx(h,{variant:"body-3",color:"neutral-faded",children:"Assign"})]}),e.jsxs(u,{direction:"column",gap:1,children:[e.jsx(h,{variant:"caption-1",color:"neutral-faded",children:"Labels"}),e.jsx(u,{direction:"row",gap:1,wrap:!0,children:(o.labels||[]).map(d=>e.jsx(Ne,{size:"small",color:Hs[d]||"neutral",children:d},d))})]}),e.jsxs(u,{direction:"column",gap:1,children:[e.jsx(h,{variant:"caption-1",color:"neutral-faded",children:"Project"}),e.jsx(h,{variant:"body-3",color:o.project?void 0:"neutral-faded",children:o.project||"Add to project"})]}),o.estimate&&e.jsxs(u,{direction:"column",gap:1,children:[e.jsx(h,{variant:"caption-1",color:"neutral-faded",children:"Estimate"}),e.jsxs(h,{variant:"body-3",children:[o.estimate," points"]})]})]})})})]})})]})})}):e.jsx(Ie,{defaultTheme:"reshaped",defaultColorMode:"dark",children:e.jsx(u,{backgroundColor:"page",minHeight:"100vh",padding:12,children:e.jsxs(u,{direction:"row",align:"start",gap:8,wrap:"no-wrap",children:[e.jsx(u.Item,{columns:2,children:e.jsx(Ve,{orgName:ue(a),activePage:"Issues",userInfo:{name:ue(i),role:ue(l)}})}),e.jsx(u.Item,{grow:!0,children:e.jsxs(u,{direction:"column",gap:4,align:"center",paddingBlock:16,children:[e.jsx(h,{variant:"featured-2",weight:"bold",children:"Issue not found"}),e.jsx(h,{variant:"body-3",color:"neutral-faded",children:"The issue you're looking for doesn't exist."}),e.jsx(me,{to:"/reshaped-issues",children:"← Back to all issues"})]})})]})})})}const qs=Object.freeze(Object.defineProperty({__proto__:null,default:Fs},Symbol.toStringTag,{value:"Module"})),Ws="_issueRow_1cpdh_1",Vs={issueRow:Ws},Ys={todo:"○",in_progress:"◐",done:"●",cancelled:"✕"},Gs={Auth:"neutral",Backend:"critical",Feature:"primary",Bug:"critical",Security:"warning",Frontend:"primary",DevEx:"positive"},Ks={title:"",description:"",status:"todo",priority:"medium",assignee:"",project:"",estimate:""},vt=["title","description","status","priority","assignee","project","estimate"];function Nn(t){vt.forEach(n=>He(`${t}.${n}`))}function Js({active:t,onClose:n,issueCount:s}){const[r]=j("draft.create.title"),o=Et(),a=`FIL-${s+1}`,i=()=>{vt.forEach(p=>{ve(`draft.create.${p}`,Ks[p])})},l=()=>{if(!(r??"").trim())return;const p=r.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/(^-|-$)/g,"")||`new-issue-${s+1}`;vt.forEach(c=>{const m=new URLSearchParams(window.location.hash.replace(/^#/,"")).get(`draft.create.${c}`)??"";ve(`record.issues.${p}.${c}`,m)}),ve(`record.issues.${p}.identifier`,a),Nn("draft.create"),n({reason:"save"}),o(`/reshaped-issues/${p}`)},d=()=>{Nn("draft.create"),n({reason:"cancel"})};return e.jsxs(xe,{active:t,onClose:d,onOpen:i,size:"600px",padding:6,position:"center",children:[e.jsx(xe.Title,{children:"Create Issue"}),e.jsx(xe.Subtitle,{children:a}),e.jsxs(u,{direction:"column",gap:4,paddingTop:4,children:[e.jsx(ur,{prefix:"draft.create"}),e.jsxs(u,{direction:"row",justify:"end",gap:2,paddingTop:2,children:[e.jsx(ne,{variant:"outline",onClick:d,children:"Cancel"}),e.jsx(ne,{color:"primary",onClick:l,children:"Save"})]})]})]})}function mt(t){return typeof t=="string"?t:""}function Xs(){const[t,n,s]=j("ui.createModal"),r=t==="true",o=sr("issues"),a=B("signup.organization.name"),i=B("signup.fullName"),l=B("signup.organization.role"),d=o.filter(c=>c.status!=="done"&&c.status!=="cancelled"),p=o.filter(c=>c.status==="done"||c.status==="cancelled");return e.jsx(Ie,{defaultTheme:"reshaped",defaultColorMode:"dark",children:e.jsx(u,{backgroundColor:"page",minHeight:"100vh",padding:12,children:e.jsxs(u,{direction:"row",align:"start",gap:8,wrap:"no-wrap",children:[e.jsx(u.Item,{columns:2,children:e.jsx(Ve,{orgName:mt(a),activePage:"Issues",userInfo:{name:mt(i),role:mt(l)}})}),e.jsx(u.Item,{grow:!0,children:e.jsxs(u,{direction:"column",gap:4,maxWidth:"900px",children:[e.jsxs(u,{direction:"row",justify:"space-between",align:"center",children:[e.jsx(h,{variant:"featured-2",weight:"bold",children:"Issues"}),e.jsxs(u,{direction:"row",gap:2,align:"center",children:[e.jsxs(Ne,{color:"neutral",children:[o.length," total"]}),e.jsx(ne,{size:"small",color:"primary",onClick:()=>n("true"),children:"Create issue"})]})]}),e.jsx(Js,{active:r,onClose:()=>s(),issueCount:o.length}),e.jsxs(u,{direction:"column",gap:0,children:[e.jsx(u,{paddingBlock:2,paddingInline:3,children:e.jsxs(h,{variant:"caption-1",color:"neutral-faded",weight:"medium",children:["Open · ",d.length]})}),e.jsx(te,{}),d.map(c=>e.jsx(Rn,{issue:c},c.id))]}),p.length>0&&e.jsxs(u,{direction:"column",gap:0,children:[e.jsx(u,{paddingBlock:2,paddingInline:3,children:e.jsxs(h,{variant:"caption-1",color:"neutral-faded",weight:"medium",children:["Closed · ",p.length]})}),e.jsx(te,{}),p.map(c=>e.jsx(Rn,{issue:c},c.id))]})]})})]})})})}function Rn({issue:t}){return e.jsxs(e.Fragment,{children:[e.jsx(me,{to:`/reshaped-issues/${t.id}`,className:Vs.issueRow,children:e.jsxs(u,{direction:"row",align:"center",gap:3,padding:3,children:[e.jsx(h,{variant:"body-3",color:"neutral-faded",attributes:{style:{minWidth:20}},children:Ys[t.status]||"○"}),e.jsx(h,{variant:"caption-1",color:"neutral-faded",attributes:{style:{minWidth:50}},children:t.identifier}),e.jsx(u.Item,{grow:!0,children:e.jsx(h,{variant:"body-3",children:t.title})}),e.jsx(u,{direction:"row",gap:1,children:(t.labels||[]).map(n=>e.jsx(Ne,{size:"small",color:Gs[n]||"neutral",children:n},n))}),e.jsx(h,{variant:"caption-1",color:"neutral-faded",attributes:{style:{textTransform:"capitalize"}},children:t.priority})]})}),e.jsx(te,{})]})}const Zs=Object.freeze(Object.defineProperty({__proto__:null,default:Xs},Symbol.toStringTag,{value:"Module"})),Qs=Object.assign({"/src/pages/Dashboard.jsx":()=>ee(()=>Promise.resolve().then(()=>qt),void 0),"/src/pages/Signup.jsx":()=>ee(()=>Promise.resolve().then(()=>Wt),void 0),"/src/pages/_app.jsx":()=>ee(()=>Promise.resolve().then(()=>Ft),void 0),"/src/pages/index.jsx":()=>ee(()=>Promise.resolve().then(()=>ir),void 0)});function ea(){return e.jsx(ar,{scenes:Ht,pageModules:Qs,basePath:"/storyboard/"})}const pr=Object.freeze(Object.defineProperty({__proto__:null,default:ea},Symbol.toStringTag,{value:"Module"}));var se={route:[/^.*\/src\/pages\/|\.(jsx|tsx|mdx)$/g,""],splat:[/\[\.{3}\w+\]/g,"*"],param:[/\[([^\]]+)\]/g,":$1"],slash:[/^index$|\./g,"/"],optional:[/^-(:?[\w-]+|\*)/,"$1?"]},ta=t=>Object.keys(t).reduce((n,s)=>{const r=s.replace(...se.route);return{...n,[r]:t[s]}},{}),na=(t,n)=>Object.keys(t).filter(r=>!r.includes("/_")||/_layout\.(jsx|tsx)$/.test(r)).reduce((r,o)=>{const a=t[o],i={id:o.replace(...se.route),...n(a,o)},l=o.replace(...se.route).replace(...se.splat).replace(...se.param).split("/").filter(Boolean);return l.reduce((d,p,c)=>{const m=p.replace(...se.slash).replace(...se.optional),g=c===0,k=c===l.length-1&&l.length>1,y=!g&&!k,v=p==="_layout",N=/\([\w-]+\)/.test(m),w=/^\w|\//.test(m)?"unshift":"push";if(g&&l.length===1)return r.push({path:m,...i}),d;if(g||y){const L=g?r:d.children,A=L?.find(O=>O.path===m||O.id?.replace("/_layout","").split("/").pop()===m),M=N?i?.component?{id:m,path:"/"}:{id:m}:{path:m};return A?A.children??=[]:L?.[w]({...M,children:[]}),A||L?.[w==="unshift"?0:L.length-1]}return v?Object.assign(d,i):(k&&d?.children?.[w](i?.index?i:{path:m,...i}),d)},{}),r},[]),ra=t=>Object.keys(t).reduce((n,s)=>{const r=s.replace(...se.route).replace(/\+|\([\w-]+\)\//g,"").replace(/(\/)?index/g,"").replace(/\./g,"/");return{...n,[`/${r}`]:t[s]?.default}},{}),oa=Object.assign({"/src/pages/_app.jsx":Ft}),sa=Object.assign({}),aa=Object.assign({"/src/pages/Dashboard.jsx":qt,"/src/pages/Signup.jsx":Wt,"/src/pages/index.jsx":ir,"/src/pages/primer-issues/[id].jsx":Ps,"/src/pages/primer-issues/index.jsx":Ms,"/src/pages/reshaped-issues/[id].jsx":qs,"/src/pages/reshaped-issues/index.jsx":Zs,"/src/pages/viewfinder.jsx":pr}),mr=ta(oa),ia=ra(sa),ca=na(aa,(t,n)=>{const s=/index\.(jsx|tsx|mdx)$/.test(n)&&!n.includes("pages/index")?{index:!0}:{},r=t?.default||S.Fragment;return{...s,Component:()=>t?.Pending?e.jsx(S.Suspense,{fallback:e.jsx(t.Pending,{}),children:e.jsx(r,{})}):e.jsx(r,{}),ErrorBoundary:t?.Catch,loader:t?.Loader,action:t?.Action}}),je=mr?._app,la=mr?.["404"],da=je?.default||Un,ua=()=>{const t=ia[Wr().state?.modal]||S.Fragment;return e.jsx(t,{})},yt=()=>e.jsxs(e.Fragment,{children:[e.jsx(da,{})," ",e.jsx(ua,{})]}),pa=()=>je?.Pending?e.jsx(S.Suspense,{fallback:e.jsx(je.Pending,{}),children:e.jsx(yt,{})}):e.jsx(yt,{}),ma={Component:je?.default?pa:yt,ErrorBoundary:je?.Catch,loader:je?.Loader},ha={path:"*",Component:la?.default||S.Fragment},ga=[{...ma,children:[...ca,ha]}];const fa="_container_m20cu_1",ba="_buttonWrapper_m20cu_7",xa="_label_m20cu_12",ht={container:fa,buttonWrapper:ba,label:xa};function va(){const{setDayScheme:t,setNightScheme:n,colorScheme:s}=Kr(),r=i=>{t(i),n(i)},o=[{name:"Light",value:"light",icon:mn},{name:"Light colorblind",value:"light_colorblind",icon:mn},{name:"Dark",value:"dark",icon:Te},{name:"Dark colorblind",value:"dark_colorblind",icon:Te},{name:"Dark high contrast",value:"dark_high_contrast",icon:Te},{name:"Dark Dimmed",value:"dark_dimmed",icon:Te}],a=o.find(i=>i.value===s);return e.jsx(re,{padding:"normal",className:ht.container,children:e.jsx(re,{className:ht.buttonWrapper,children:e.jsxs(at,{children:[e.jsxs(at.Button,{size:"small",children:[e.jsx(a.icon,{}),e.jsxs(re,{className:ht.label,children:[" ",a.name]})]}),e.jsx(at.Overlay,{align:"right",children:e.jsx(it,{showDividers:!0,children:e.jsx(it.Group,{selectionVariant:"single",children:o.map(i=>e.jsx(it.Item,{href:"#",selected:i.value===s,onSelect:()=>r(i.value),children:i.name},i.value))})})})]})})})}const Vt="sb-comments-token",Yt="sb-comments-user";function hr(){try{return localStorage.getItem(Vt)}catch{return null}}function ya(t){localStorage.setItem(Vt,t)}function wa(){localStorage.removeItem(Vt),localStorage.removeItem(Yt)}function Gt(){try{const t=localStorage.getItem(Yt);return t?JSON.parse(t):null}catch{return null}}async function ja(t){const n=await fetch("https://api.github.com/user",{headers:{Authorization:`bearer ${t}`}});if(!n.ok)throw new Error("Invalid token — GitHub returned "+n.status);const s=await n.json(),r={login:s.login,avatarUrl:s.avatar_url};return localStorage.setItem(Yt,JSON.stringify(r)),r}function Ye(){return hr()!==null}let pe=!1;const wt=new Set;function Me(){return pe}function Sa(){return We()?!pe&&!Ye()?(console.warn("[storyboard] Sign in first to use comments"),!1):(pe=!pe,gr(),pe):(console.warn("[storyboard] Comments not enabled — check storyboard.config.json"),!1)}function Pn(t){pe=t,gr()}function Ca(t){return wt.add(t),()=>wt.delete(t)}function gr(){for(const t of wt)t(pe)}const Ln=/<!--\s*sb-meta\s+(\{.*?\})\s*-->/;function jt(t){if(!t)return{meta:null,text:""};const n=t.match(Ln);if(!n)return{meta:null,text:t.trim()};try{const s=JSON.parse(n[1]),r=t.replace(Ln,"").trim();return{meta:s,text:r}}catch{return{meta:null,text:t.trim()}}}function St(t,n){return`${`<!-- sb-meta ${JSON.stringify(t)} -->`}
${n}`}function fr(t,n){const{meta:s,text:r}=jt(t),o={...s,...n};return St(o,r)}const Ea="https://api.github.com/graphql";async function J(t,n={},s={}){const{retries:r=2}=s,o=hr();if(!o)throw new Error("Not authenticated — no GitHub PAT found. Please sign in.");let a;for(let i=0;i<=r;i++)try{const l=await fetch(Ea,{method:"POST",headers:{Authorization:`bearer ${o}`,"Content-Type":"application/json"},body:JSON.stringify({query:t,variables:n})});if(l.status===401)throw new Error("GitHub PAT is invalid or expired. Please sign in again.");if(!l.ok)throw new Error(`GitHub API error: ${l.status} ${l.statusText}`);const d=await l.json();if(d.errors?.length)throw new Error(`GraphQL error: ${d.errors.map(p=>p.message).join(", ")}`);return d.data}catch(l){if(a=l,l.message.includes("401")||l.message.includes("Not authenticated")||l.message.includes("invalid or expired"))throw l;i<r&&await new Promise(d=>setTimeout(d,1e3*(i+1)))}throw a}const _a=`
  query SearchDiscussion($query: String!) {
    search(query: $query, type: DISCUSSION, first: 1) {
      nodes {
        ... on Discussion {
          id
          title
          body
          url
          comments(first: 100) {
            nodes {
              id
              body
              createdAt
              author {
                login
                avatarUrl
              }
              replies(first: 50) {
                nodes {
                  id
                  body
                  createdAt
                  author {
                    login
                    avatarUrl
                  }
                  reactionGroups {
                    content
                    users(first: 0) { totalCount }
                    viewerHasReacted
                  }
                }
              }
              reactionGroups {
                content
                users(first: 0) { totalCount }
                viewerHasReacted
              }
            }
          }
        }
      }
    }
  }
`,ka=`
  query GetCategoryId($owner: String!, $name: String!, $slug: String!) {
    repository(owner: $owner, name: $name) {
      id
      discussionCategory(slug: $slug) {
        id
      }
      discussionCategories(first: 25) {
        nodes {
          id
          name
          slug
        }
      }
    }
  }
`,Ia=`
  mutation CreateDiscussion($repositoryId: ID!, $categoryId: ID!, $title: String!, $body: String!) {
    createDiscussion(input: { repositoryId: $repositoryId, categoryId: $categoryId, title: $title, body: $body }) {
      discussion {
        id
        title
        url
      }
    }
  }
`,Na=`
  mutation AddComment($discussionId: ID!, $body: String!) {
    addDiscussionComment(input: { discussionId: $discussionId, body: $body }) {
      comment {
        id
        body
        createdAt
        author {
          login
          avatarUrl
        }
      }
    }
  }
`,Ra=`
  mutation AddReply($discussionId: ID!, $replyToId: ID!, $body: String!) {
    addDiscussionComment(input: { discussionId: $discussionId, body: $body, replyToId: $replyToId }) {
      comment {
        id
        body
        createdAt
        author {
          login
          avatarUrl
        }
      }
    }
  }
`,br=`
  mutation UpdateComment($commentId: ID!, $body: String!) {
    updateDiscussionComment(input: { commentId: $commentId, body: $body }) {
      comment {
        id
        body
      }
    }
  }
`,Pa=`
  mutation AddReaction($subjectId: ID!, $content: ReactionContent!) {
    addReaction(input: { subjectId: $subjectId, content: $content }) {
      reaction {
        content
      }
    }
  }
`,La=`
  mutation RemoveReaction($subjectId: ID!, $content: ReactionContent!) {
    removeReaction(input: { subjectId: $subjectId, content: $content }) {
      reaction {
        content
      }
    }
  }
`,Ta=`
  query ListDiscussions($owner: String!, $name: String!, $categoryId: ID!) {
    repository(owner: $owner, name: $name) {
      discussions(first: 50, categoryId: $categoryId) {
        nodes {
          id
          title
          body
          url
          createdAt
          comments {
            totalCount
          }
        }
      }
    }
  }
`;async function xr(t){const n=Bt(),r=`"${`Comments: ${t}`}" in:title repo:${n.repo.owner}/${n.repo.name}`,a=(await J(_a,{query:r})).search?.nodes?.[0];if(!a)return null;const i=(a.comments?.nodes??[]).map(l=>{const{meta:d,text:p}=jt(l.body);return{...l,meta:d,text:p,replies:(l.replies?.nodes??[]).map(c=>{const{meta:m,text:g}=jt(c.body);return{...c,meta:m,text:g}})}});return{...a,comments:i}}async function vr(){const t=Bt(),n=t.discussions.category.toLowerCase().replace(/\s+/g,"-"),s=await J(ka,{owner:t.repo.owner,name:t.repo.name,slug:n}),r=s.repository?.id;let o=s.repository?.discussionCategory?.id;if(o||(o=s.repository?.discussionCategories?.nodes?.find(i=>i.name===t.discussions.category)?.id),!r||!o)throw new Error(`Could not find repository or discussion category "${t.discussions.category}" in ${t.repo.owner}/${t.repo.name}`);return{repositoryId:r,categoryId:o}}async function za(t,n,s,r){let o=await xr(t);if(!o){const{repositoryId:l,categoryId:d}=await vr(),p=`Comments: ${t}`,c=St({route:t,createdAt:new Date().toISOString()},"");o=(await J(Ia,{repositoryId:l,categoryId:d,title:p,body:c})).createDiscussion.discussion}const a=St({x:Math.round(n*10)/10,y:Math.round(s*10)/10},r);return(await J(Na,{discussionId:o.id,body:a})).addDiscussionComment.comment}async function $a(t,n,s){return(await J(Ra,{discussionId:t,replyToId:n,body:s})).addDiscussionComment.comment}async function Aa(t,n){const s=fr(n,{resolved:!0});return(await J(br,{commentId:t,body:s})).updateDiscussionComment.comment}async function Oa(t,n,s,r){const o=fr(n,{x:Math.round(s*10)/10,y:Math.round(r*10)/10});return(await J(br,{commentId:t,body:o})).updateDiscussionComment.comment}async function Ma(t,n){await J(Pa,{subjectId:t,content:n})}async function Da(t,n){await J(La,{subjectId:t,content:n})}async function ci(){const t=Bt(),{categoryId:n}=await vr();return(await J(Ta,{owner:t.repo.owner,name:t.repo.name,categoryId:n})).repository?.discussions?.nodes??[]}const Tn="sb-composer-style";function Ba(){if(document.getElementById(Tn))return;const t=document.createElement("style");t.id=Tn,t.textContent=`
    .sb-composer {
      position: absolute;
      z-index: 100001;
      display: flex;
      flex-direction: column;
      width: 280px;
      background: #161b22;
      border: 1px solid #30363d;
      border-radius: 10px;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
      overflow: hidden;
    }

    .sb-composer-header {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 12px 0;
    }

    .sb-composer-avatar {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      border: 1px solid #30363d;
      flex-shrink: 0;
    }

    .sb-composer-username {
      font-size: 12px;
      color: #8b949e;
      font-weight: 500;
    }

    .sb-composer-body {
      padding: 8px 12px 12px;
    }

    .sb-composer-textarea {
      width: 100%;
      min-height: 60px;
      max-height: 160px;
      padding: 8px 10px;
      background: #0d1117;
      border: 1px solid #30363d;
      border-radius: 6px;
      color: #c9d1d9;
      font-size: 13px;
      font-family: inherit;
      line-height: 1.5;
      resize: vertical;
      outline: none;
      box-sizing: border-box;
    }
    .sb-composer-textarea:focus {
      border-color: #58a6ff;
      box-shadow: 0 0 0 3px rgba(88, 166, 255, 0.15);
    }
    .sb-composer-textarea::placeholder {
      color: #484f58;
    }

    .sb-composer-footer {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 6px;
      padding: 0 12px 10px;
    }

    .sb-composer-btn {
      padding: 4px 12px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 500;
      font-family: inherit;
      cursor: pointer;
      border: 1px solid transparent;
    }

    .sb-composer-btn-cancel {
      background: none;
      color: #8b949e;
      border-color: #30363d;
    }
    .sb-composer-btn-cancel:hover {
      background: #21262d;
      color: #c9d1d9;
    }

    .sb-composer-btn-submit {
      background: #238636;
      color: #fff;
    }
    .sb-composer-btn-submit:hover {
      background: #2ea043;
    }
    .sb-composer-btn-submit:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .sb-composer-hint {
      padding: 0 12px 8px;
      font-size: 11px;
      color: #484f58;
    }
    .sb-composer-hint kbd {
      display: inline-block;
      padding: 0 4px;
      font-size: 10px;
      border: 1px solid rgba(255,255,255,0.2);
      border-radius: 3px;
      background: rgba(255,255,255,0.06);
      font-family: inherit;
    }
  `,document.head.appendChild(t)}function Ha(t,n,s,r,o={}){Ba();const a=Gt(),i=document.createElement("div");i.className="sb-composer",i.style.left=`${n}%`,i.style.top=`${s}%`,i.style.transform="translate(12px, -50%)",i.innerHTML=`
    ${a?`
      <div class="sb-composer-header">
        <img class="sb-composer-avatar" src="${a.avatarUrl}" alt="${a.login}" />
        <span class="sb-composer-username">${a.login}</span>
      </div>
    `:""}
    <div class="sb-composer-body">
      <textarea class="sb-composer-textarea" placeholder="Leave a comment…" autofocus></textarea>
    </div>
    <div class="sb-composer-footer">
      <button class="sb-composer-btn sb-composer-btn-cancel" data-action="cancel">Cancel</button>
      <button class="sb-composer-btn sb-composer-btn-submit" data-action="submit">Comment</button>
    </div>
  `,t.appendChild(i);const l=i.querySelector(".sb-composer-textarea"),d=i.querySelector('[data-action="submit"]');function p(){i.remove()}function c(){p(),o.onCancel?.()}async function m(){const g=l.value.trim();if(!g){l.focus();return}d.disabled=!0,d.textContent="Posting…";try{const k=await za(r,n,s,g);p(),o.onSubmit?.(k)}catch(k){d.disabled=!1,d.textContent="Comment",console.error("[storyboard] Failed to post comment:",k);let y=i.querySelector(".sb-composer-error");y||(y=document.createElement("div"),y.className="sb-composer-error",y.style.cssText="padding: 4px 12px 8px; font-size: 12px; color: #f85149;",i.querySelector(".sb-composer-footer").before(y)),y.textContent=k.message}}return i.querySelector('[data-action="cancel"]').addEventListener("click",c),d.addEventListener("click",m),l.addEventListener("keydown",g=>{g.key==="Enter"&&(g.metaKey||g.ctrlKey)&&(g.preventDefault(),m()),g.key==="Escape"&&(g.preventDefault(),g.stopPropagation(),c())}),i.addEventListener("click",g=>g.stopPropagation()),requestAnimationFrame(()=>l.focus()),{el:i,destroy:p}}const zn="sb-auth-modal",$n="sb-auth-modal-style";function Ua(){if(document.getElementById($n))return;const t=document.createElement("style");t.id=$n,t.textContent=`
    .sb-auth-backdrop {
      position: fixed;
      inset: 0;
      z-index: 100000;
      background: rgba(0, 0, 0, 0.6);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
    }

    .sb-auth-modal {
      width: 420px;
      max-width: calc(100vw - 32px);
      background: #161b22;
      border: 1px solid #30363d;
      border-radius: 12px;
      box-shadow: 0 16px 48px rgba(0, 0, 0, 0.5);
      color: #c9d1d9;
      overflow: hidden;
    }

    .sb-auth-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 20px;
      border-bottom: 1px solid #21262d;
    }

    .sb-auth-header h2 {
      margin: 0;
      font-size: 16px;
      font-weight: 600;
      color: #f0f6fc;
    }

    .sb-auth-close {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 28px;
      height: 28px;
      background: none;
      border: none;
      border-radius: 6px;
      color: #8b949e;
      cursor: pointer;
      font-size: 18px;
      line-height: 1;
    }
    .sb-auth-close:hover {
      background: #21262d;
      color: #c9d1d9;
    }

    .sb-auth-body {
      padding: 20px;
    }

    .sb-auth-description {
      margin: 0 0 16px;
      font-size: 13px;
      color: #8b949e;
      line-height: 1.5;
    }

    .sb-auth-description a {
      color: #58a6ff;
      text-decoration: none;
    }
    .sb-auth-description a:hover {
      text-decoration: underline;
    }

    .sb-auth-label {
      display: block;
      margin-bottom: 6px;
      font-size: 13px;
      font-weight: 500;
      color: #c9d1d9;
    }

    .sb-auth-input {
      width: 100%;
      padding: 8px 12px;
      background: #0d1117;
      border: 1px solid #30363d;
      border-radius: 6px;
      color: #c9d1d9;
      font-size: 14px;
      font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace;
      outline: none;
      box-sizing: border-box;
    }
    .sb-auth-input:focus {
      border-color: #58a6ff;
      box-shadow: 0 0 0 3px rgba(88, 166, 255, 0.15);
    }
    .sb-auth-input::placeholder {
      color: #484f58;
    }

    .sb-auth-scopes {
      margin: 12px 0 0;
      padding: 10px 12px;
      background: #0d1117;
      border: 1px solid #21262d;
      border-radius: 6px;
      font-size: 12px;
      color: #8b949e;
      line-height: 1.6;
    }
    .sb-auth-scopes code {
      display: inline-block;
      padding: 1px 5px;
      background: rgba(110, 118, 129, 0.15);
      border-radius: 4px;
      font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace;
      font-size: 11px;
      color: #c9d1d9;
    }

    .sb-auth-footer {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 8px;
      padding: 16px 20px;
      border-top: 1px solid #21262d;
    }

    .sb-auth-btn {
      padding: 6px 16px;
      border-radius: 6px;
      font-size: 13px;
      font-weight: 500;
      font-family: inherit;
      cursor: pointer;
      border: 1px solid transparent;
      transition: background 100ms ease;
    }

    .sb-auth-btn-cancel {
      background: #21262d;
      border-color: #30363d;
      color: #c9d1d9;
    }
    .sb-auth-btn-cancel:hover {
      background: #30363d;
    }

    .sb-auth-btn-submit {
      background: #238636;
      color: #fff;
    }
    .sb-auth-btn-submit:hover {
      background: #2ea043;
    }
    .sb-auth-btn-submit:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .sb-auth-error {
      margin: 10px 0 0;
      padding: 8px 12px;
      background: rgba(248, 81, 73, 0.1);
      border: 1px solid rgba(248, 81, 73, 0.3);
      border-radius: 6px;
      font-size: 13px;
      color: #f85149;
    }

    .sb-auth-success {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 4px 0;
    }

    .sb-auth-avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      border: 2px solid #30363d;
    }

    .sb-auth-user-info {
      font-size: 14px;
      color: #f0f6fc;
    }
    .sb-auth-user-info span {
      display: block;
      font-size: 12px;
      color: #3fb950;
      margin-top: 2px;
    }
  `,document.head.appendChild(t)}function Fa(){return Ua(),new Promise(t=>{const n=document.getElementById(zn);n&&n.remove();const s=document.createElement("div");s.id=zn,s.className="sb-auth-backdrop";const r=document.createElement("div");r.className="sb-auth-modal",r.innerHTML=`
      <div class="sb-auth-header">
        <h2>Sign in for comments</h2>
        <button class="sb-auth-close" data-action="close" aria-label="Close">×</button>
      </div>
      <div class="sb-auth-body">
        <p class="sb-auth-description">
          Enter a <a href="https://github.com/settings/tokens/new" target="_blank" rel="noopener">GitHub Personal Access Token</a>
          to leave comments on this prototype. Your token is stored locally in your browser.
        </p>
        <label class="sb-auth-label" for="sb-auth-token-input">Personal Access Token</label>
        <input class="sb-auth-input" id="sb-auth-token-input" type="password" placeholder="ghp_xxxxxxxxxxxx" autocomplete="off" spellcheck="false" />
        <div class="sb-auth-scopes">Required scopes: <code>repo</code> <code>read:user</code></div>
        <div data-slot="feedback"></div>
      </div>
      <div class="sb-auth-footer">
        <button class="sb-auth-btn sb-auth-btn-cancel" data-action="close">Cancel</button>
        <button class="sb-auth-btn sb-auth-btn-submit" data-action="submit">Sign in</button>
      </div>
    `,s.appendChild(r),document.body.appendChild(s);const o=r.querySelector("#sb-auth-token-input"),a=r.querySelector('[data-action="submit"]'),i=r.querySelector('[data-slot="feedback"]');function l(c){s.remove(),t(c)}s.addEventListener("click",c=>{c.target===s&&l(null)}),r.querySelectorAll('[data-action="close"]').forEach(c=>{c.addEventListener("click",()=>l(null))});function d(c){c.key==="Escape"&&(c.preventDefault(),c.stopPropagation(),window.removeEventListener("keydown",d,!0),l(null))}window.addEventListener("keydown",d,!0);async function p(){const c=o.value.trim();if(!c){o.focus();return}a.disabled=!0,a.textContent="Validating…",i.innerHTML="";try{const m=await ja(c);ya(c),i.innerHTML=`
          <div class="sb-auth-success">
            <img class="sb-auth-avatar" src="${m.avatarUrl}" alt="${m.login}" />
            <div class="sb-auth-user-info">
              ${m.login}
              <span>✓ Signed in</span>
            </div>
          </div>
        `,a.textContent="Done",a.disabled=!1,a.onclick=()=>{window.removeEventListener("keydown",d,!0),l(m)}}catch(m){i.innerHTML=`<div class="sb-auth-error">${m.message}</div>`,a.disabled=!1,a.textContent="Sign in"}}a.addEventListener("click",p),o.addEventListener("keydown",c=>{c.key==="Enter"&&p()}),requestAnimationFrame(()=>o.focus())})}function li(){const t=Gt();wa(),console.log(`[storyboard] Signed out${t?` (was ${t.login})`:""}`)}const An="sb-comment-window-style",yr={THUMBS_UP:"👍",THUMBS_DOWN:"👎",LAUGH:"😄",HOORAY:"🎉",CONFUSED:"😕",HEART:"❤️",ROCKET:"🚀",EYES:"👀"};function qa(){if(document.getElementById(An))return;const t=document.createElement("style");t.id=An,t.textContent=`
    .sb-comment-window {
      position: absolute;
      z-index: 100001;
      width: 360px;
      max-height: 480px;
      display: flex;
      flex-direction: column;
      background: #161b22;
      border: 1px solid #30363d;
      border-radius: 10px;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
      overflow: hidden;
    }

    .sb-comment-window-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 10px 12px;
      border-bottom: 1px solid #21262d;
      cursor: grab;
      user-select: none;
    }
    .sb-comment-window-header:active {
      cursor: grabbing;
    }

    .sb-comment-window-header-left {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .sb-comment-window-avatar {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      border: 1px solid #30363d;
      flex-shrink: 0;
    }

    .sb-comment-window-author {
      font-size: 12px;
      font-weight: 600;
      color: #f0f6fc;
    }

    .sb-comment-window-time {
      font-size: 11px;
      color: #484f58;
      margin-left: 4px;
    }

    .sb-comment-window-close {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 24px;
      height: 24px;
      background: none;
      border: none;
      border-radius: 6px;
      color: #8b949e;
      cursor: pointer;
      font-size: 16px;
      line-height: 1;
      flex-shrink: 0;
    }
    .sb-comment-window-close:hover {
      background: #21262d;
      color: #c9d1d9;
    }

    .sb-comment-window-header-actions {
      display: flex;
      align-items: center;
      gap: 4px;
      flex-shrink: 0;
    }

    .sb-comment-window-action-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 8px;
      background: none;
      border: none;
      border-radius: 6px;
      color: #8b949e;
      cursor: pointer;
      font-size: 11px;
      font-weight: 500;
      font-family: inherit;
      line-height: 1;
      flex-shrink: 0;
      white-space: nowrap;
    }
    .sb-comment-window-action-btn:hover {
      background: #21262d;
      color: #c9d1d9;
    }
    .sb-comment-window-action-btn[data-resolved="true"] {
      color: #3fb950;
    }
    .sb-comment-window-action-btn[data-copied="true"] {
      color: #3fb950;
    }

    .sb-comment-window-body {
      flex: 1;
      overflow-y: auto;
      padding: 12px;
    }

    .sb-comment-window-text {
      font-size: 13px;
      line-height: 1.5;
      color: #c9d1d9;
      margin: 0 0 8px;
      word-break: break-word;
    }

    .sb-comment-window-reactions {
      display: flex;
      align-items: center;
      gap: 4px;
      flex-wrap: wrap;
      margin-bottom: 10px;
    }

    .sb-reaction-pill {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 2px 8px;
      border-radius: 999px;
      border: 1px solid #30363d;
      background: none;
      color: #8b949e;
      cursor: pointer;
      // font-size: 12px;
      font-family: inherit;
      transition: border-color 100ms, background 100ms;
    }
    .sb-reaction-pill span {
      // font-size: 12px;
   }
    .sb-reaction-pill:hover {
      border-color: #8b949e;
    }
    .sb-reaction-pill[data-active="true"] {
      border-color: rgba(88, 166, 255, 0.4);
      background: rgba(88, 166, 255, 0.1);
      color: #58a6ff;
    }

    .sb-reaction-add-btn {
      display: inline-flex;
      align-items: center;
      padding: 2px 6px;
      gap: 4px;
      border-radius: 999px;
      border: 1px solid transparent;
      background: none;
      color: #8b949e;
      font-size: 12px;
      cursor: pointer;
      font-family: inherit;
      position: relative;
      border-color: #30363d;
      background: #21262d;
    }
    .sb-reaction-add-btn:hover {
      border: 1px solid rgba(88, 166, 255, 0.4);
      background: rgba(88, 166, 255, 0.1);
    }

    .sb-reaction-picker {
      position: absolute;
      bottom: 100%;
      left: 0;
      margin-bottom: 4px;
      z-index: 10;
      display: flex;
      gap: 2px;
      padding: 4px;
      background: #161b22;
      border: 1px solid #30363d;
      border-radius: 10px;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
    }

    .sb-reaction-picker-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 28px;
      height: 28px;
      border-radius: 6px;
      border: none;
      background: none;
      font-size: 14px;
      cursor: pointer;
      transition: background 100ms;
    }
    .sb-reaction-picker-btn:hover {
      background: #21262d;
    }
    .sb-reaction-picker-btn[data-active="true"] {
      background: rgba(88, 166, 255, 0.15);
      box-shadow: inset 0 0 0 1px rgba(88, 166, 255, 0.4);
    }

    .sb-comment-window-replies {
      border-top: 1px solid #21262d;
      padding-top: 10px;
      margin-top: 4px;
    }

    .sb-comment-window-replies-label {
      font-size: 11px;
      font-weight: 600;
      color: #8b949e;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 8px;
    }

    .sb-reply-item {
      display: flex;
      gap: 8px;
      margin-bottom: 10px;
    }

    .sb-reply-avatar {
      width: 20px;
      height: 20px;
      border-radius: 50%;
      border: 1px solid #30363d;
      flex-shrink: 0;
    }

    .sb-reply-content {
      flex: 1;
      min-width: 0;
    }

    .sb-reply-meta {
      display: flex;
      align-items: center;
      gap: 4px;
      margin-bottom: 2px;
    }

    .sb-reply-author {
      font-size: 12px;
      font-weight: 600;
      color: #f0f6fc;
    }

    .sb-reply-time {
      font-size: 11px;
      color: #484f58;
    }

    .sb-reply-text {
      font-size: 13px;
      line-height: 1.4;
      color: #c9d1d9;
      margin: 0;
      word-break: break-word;
    }

    .sb-reply-reactions {
      display: flex;
      align-items: center;
      gap: 4px;
      flex-wrap: wrap;
      margin-top: 4px;
    }

    .sb-comment-window-reply-form {
      border-top: 1px solid #21262d;
      padding: 10px 12px;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .sb-reply-textarea {
      width: 100%;
      min-height: 40px;
      max-height: 100px;
      padding: 6px 8px;
      background: #0d1117;
      border: 1px solid #30363d;
      border-radius: 6px;
      color: #c9d1d9;
      font-size: 12px;
      font-family: inherit;
      line-height: 1.4;
      resize: vertical;
      outline: none;
      box-sizing: border-box;
    }
    .sb-reply-textarea:focus {
      border-color: #58a6ff;
      box-shadow: 0 0 0 3px rgba(88, 166, 255, 0.15);
    }
    .sb-reply-textarea::placeholder {
      color: #484f58;
    }

    .sb-reply-form-actions {
      display: flex;
      justify-content: flex-end;
    }

    .sb-reply-submit-btn {
      padding: 4px 10px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 500;
      font-family: inherit;
      cursor: pointer;
      border: none;
      background: #238636;
      color: #fff;
    }
    .sb-reply-submit-btn:hover {
      background: #2ea043;
    }
    .sb-reply-submit-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  `,document.head.appendChild(t)}function On(t){return new Date(t).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"})}function Mn(t){const n=document.createElement("div");n.className=t.replies?"sb-comment-window-reactions":"sb-reply-reactions";function s(){n.innerHTML="";const r=t.reactionGroups??[];for(const a of r){if(a.users?.totalCount===0&&!a.viewerHasReacted)continue;const i=a.users?.totalCount??0;if(i===0)continue;const l=document.createElement("button");l.className="sb-reaction-pill",l.dataset.active=String(!!a.viewerHasReacted),l.innerHTML=`<span>${yr[a.content]??a.content}</span><span>${i}</span>`,l.addEventListener("click",d=>{d.stopPropagation(),wr(t,a.content,a,s)}),n.appendChild(l)}const o=document.createElement("button");o.className="sb-reaction-add-btn",o.textContent="😀 +",o.addEventListener("click",a=>{a.stopPropagation(),Wa(o,t,s)}),n.appendChild(o)}return s(),n}function Wa(t,n,s){const r=t.querySelector(".sb-reaction-picker");if(r){r.remove();return}const o=document.createElement("div");o.className="sb-reaction-picker";for(const[i,l]of Object.entries(yr)){const d=n.reactionGroups??[],p=d.some(m=>m.content===i&&m.viewerHasReacted),c=document.createElement("button");c.className="sb-reaction-picker-btn",c.dataset.active=String(p),c.textContent=l,c.addEventListener("click",m=>{m.stopPropagation();const g=d.find(k=>k.content===i);wr(n,i,g,s),o.remove()}),o.appendChild(c)}t.appendChild(o);function a(i){!o.contains(i.target)&&i.target!==t&&(o.remove(),document.removeEventListener("click",a,!0))}setTimeout(()=>document.addEventListener("click",a,!0),0)}async function wr(t,n,s,r){const o=s?.viewerHasReacted??!1;t.reactionGroups||(t.reactionGroups=[]),o&&s?(s.users={totalCount:Math.max(0,(s.users?.totalCount??1)-1)},s.viewerHasReacted=!1,s.users.totalCount===0&&(t.reactionGroups=t.reactionGroups.filter(a=>a.content!==n))):s?(s.users={totalCount:(s.users?.totalCount??0)+1},s.viewerHasReacted=!0):t.reactionGroups.push({content:n,users:{totalCount:1},viewerHasReacted:!0}),r();try{o?await Da(t.id,n):await Ma(t.id,n)}catch(a){console.error("[storyboard] Reaction toggle failed:",a)}}let Q=null;function jr(t,n,s,r={}){qa(),Q&&(Q.destroy(),Q=null);const o=Gt(),a=document.createElement("div");a.className="sb-comment-window",a.style.left=`${n.meta?.x??0}%`,a.style.top=`${n.meta?.y??0}%`,a.style.transform="translate(12px, -50%)";const i=document.createElement("div");i.className="sb-comment-window-header";const l=document.createElement("div");if(l.className="sb-comment-window-header-left",n.author?.avatarUrl){const f=document.createElement("img");f.className="sb-comment-window-avatar",f.src=n.author.avatarUrl,f.alt=n.author.login??"",l.appendChild(f)}const d=document.createElement("span");if(d.className="sb-comment-window-author",d.textContent=n.author?.login??"unknown",l.appendChild(d),n.createdAt){const f=document.createElement("span");f.className="sb-comment-window-time",f.textContent=On(n.createdAt),l.appendChild(f)}i.appendChild(l);const p=document.createElement("div");p.className="sb-comment-window-header-actions";const c=document.createElement("button");c.className="sb-comment-window-action-btn",c.setAttribute("aria-label",n.meta?.resolved?"Resolved":"Resolve"),c.title=n.meta?.resolved?"Resolved":"Resolve",c.textContent=n.meta?.resolved?"Resolved":"Resolve",n.meta?.resolved&&(c.dataset.resolved="true"),c.addEventListener("click",async f=>{if(f.stopPropagation(),!n.meta?.resolved){c.dataset.resolved="true",c.textContent="Resolved",c.title="Resolved";try{await Aa(n.id,n._rawBody??n.body??""),n.meta={...n.meta,resolved:!0},r.onMove?.()}catch(E){console.error("[storyboard] Failed to resolve comment:",E),c.dataset.resolved="false",c.textContent="Resolve",c.title="Resolve"}}}),p.appendChild(c);const m=document.createElement("button");m.className="sb-comment-window-action-btn",m.setAttribute("aria-label","Copy link"),m.title="Copy link",m.textContent="Copy link",m.addEventListener("click",f=>{f.stopPropagation();const E=new URL(window.location.href);E.searchParams.set("comment",n.id),navigator.clipboard.writeText(E.toString()).then(()=>{m.dataset.copied="true",m.textContent="Copied!",m.title="Copied!",setTimeout(()=>{m.dataset.copied="false",m.textContent="Copy link",m.title="Copy link"},2e3)}).catch(()=>{const I=document.createElement("input");I.value=E.toString(),document.body.appendChild(I),I.select(),document.execCommand("copy"),I.remove()})}),p.appendChild(m);const g=document.createElement("button");g.className="sb-comment-window-close",g.innerHTML="×",g.setAttribute("aria-label","Close"),g.addEventListener("click",f=>{f.stopPropagation(),W()}),p.appendChild(g),i.appendChild(p),a.appendChild(i);const k=document.createElement("div");k.className="sb-comment-window-body";const y=document.createElement("p");y.className="sb-comment-window-text",y.textContent=n.text??"",k.appendChild(y),k.appendChild(Mn(n));const v=n.replies??[];if(v.length>0){const f=document.createElement("div");f.className="sb-comment-window-replies";const E=document.createElement("div");E.className="sb-comment-window-replies-label",E.textContent=`${v.length} ${v.length===1?"Reply":"Replies"}`,f.appendChild(E);for(const I of v){const R=document.createElement("div");if(R.className="sb-reply-item",I.author?.avatarUrl){const H=document.createElement("img");H.className="sb-reply-avatar",H.src=I.author.avatarUrl,H.alt=I.author.login??"",R.appendChild(H)}const D=document.createElement("div");D.className="sb-reply-content";const T=document.createElement("div");T.className="sb-reply-meta";const x=document.createElement("span");if(x.className="sb-reply-author",x.textContent=I.author?.login??"unknown",T.appendChild(x),I.createdAt){const H=document.createElement("span");H.className="sb-reply-time",H.textContent=On(I.createdAt),T.appendChild(H)}D.appendChild(T);const V=document.createElement("p");V.className="sb-reply-text",V.textContent=I.text??I.body??"",D.appendChild(V),D.appendChild(Mn(I)),R.appendChild(D),f.appendChild(R)}k.appendChild(f)}if(a.appendChild(k),o&&s){const f=document.createElement("div");f.className="sb-comment-window-reply-form";const E=document.createElement("textarea");E.className="sb-reply-textarea",E.placeholder="Reply…",f.appendChild(E);const I=document.createElement("div");I.className="sb-reply-form-actions";const R=document.createElement("button");R.className="sb-reply-submit-btn",R.textContent="Reply",R.disabled=!0,E.addEventListener("input",()=>{R.disabled=!E.value.trim()});async function D(){const T=E.value.trim();if(T){R.disabled=!0,R.textContent="Posting…";try{await $a(s.id,n.id,T),E.value="",R.textContent="Reply",r.onMove?.()}catch(x){console.error("[storyboard] Failed to post reply:",x),R.textContent="Reply",R.disabled=!1}}}R.addEventListener("click",D),E.addEventListener("keydown",T=>{T.key==="Enter"&&(T.metaKey||T.ctrlKey)&&(T.preventDefault(),D()),T.key==="Escape"&&(T.preventDefault(),T.stopPropagation())}),I.appendChild(R),f.appendChild(I),a.appendChild(f)}let N=!1,w=0,L=0,A=0,M=0;function O(f){if(f.target.closest(".sb-comment-window-header-actions"))return;N=!0,w=f.clientX,L=f.clientY;const E=t.getBoundingClientRect();A=parseFloat(a.style.left)/100*E.width,M=parseFloat(a.style.top)/100*E.height,document.addEventListener("mousemove",G),document.addEventListener("mouseup",q),f.preventDefault()}function G(f){if(!N)return;const E=f.clientX-w,I=f.clientY-L,R=t.getBoundingClientRect(),D=A+E,T=M+I,x=Math.round(D/R.width*1e3)/10,V=Math.round(T/R.height*1e3)/10;a.style.left=`${x}%`,a.style.top=`${V}%`}async function q(f){if(!N)return;N=!1,document.removeEventListener("mousemove",G),document.removeEventListener("mouseup",q);const E=t.getBoundingClientRect(),I=f.clientX-w,R=f.clientY-L,D=A+I,T=M+R,x=Math.round(D/E.width*1e3)/10,V=Math.round(T/E.height*1e3)/10;if(Math.abs(I)>2||Math.abs(R)>2){n.meta={...n.meta,x,y:V};const H=t.querySelectorAll(".sb-comment-pin");for(const le of H)if(le._commentId===n.id){le.style.left=`${x}%`,le.style.top=`${V}%`;break}try{await Oa(n.id,n._rawBody??"",x,V),n._rawBody=null}catch(le){console.error("[storyboard] Failed to move comment:",le)}}}i.addEventListener("mousedown",O),a.addEventListener("click",f=>f.stopPropagation());const X=new URL(window.location.href);X.searchParams.set("comment",n.id),window.history.replaceState(null,"",X.toString()),t.appendChild(a);function W(){document.removeEventListener("mousemove",G),document.removeEventListener("mouseup",q),a.remove(),Q?.el===a&&(Q=null);const f=new URL(window.location.href);f.searchParams.delete("comment"),window.history.replaceState(null,"",f.toString()),r.onClose?.()}return Q={el:a,destroy:W},{el:a,destroy:W}}function Sr(){Q&&(Q.destroy(),Q=null)}const Va='<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="none" stroke="%23fff" stroke-width="1.5" d="M19.503 9.97c1.204.489 1.112 2.224-.137 2.583l-6.305 1.813l-2.88 5.895c-.571 1.168-2.296.957-2.569-.314L4.677 6.257A1.369 1.369 0 0 1 6.53 4.7z" clip-rule="evenodd"/></svg>',Dn="sb-comment-mode-style";function Ya(){if(document.getElementById(Dn))return;const t=document.createElement("style");t.id=Dn,t.textContent=`
    .sb-comment-mode {
      cursor: url("data:image/svg+xml,${Va}") 4 2, crosshair;
    }
    .sb-comment-overlay {
      position: absolute;
      inset: 0;
      z-index: 99998;
      pointer-events: none;
    }
    .sb-comment-overlay.active {
      pointer-events: auto;
    }
    .sb-comment-mode-banner {
      position: fixed;
      bottom: 12px;
      left: 50%;
      transform: translateX(-50%);
      z-index: 99999;
      background: rgba(0, 0, 0, 0.85);
      color: #fff;
      padding: 6px 16px;
      border-radius: 8px;
      font: 13px/1.4 -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
      display: flex;
      align-items: center;
      gap: 8px;
      pointer-events: none;
      backdrop-filter: blur(8px);
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    }
    .sb-comment-mode-banner kbd {
      display: inline-block;
      padding: 1px 5px;
      font-size: 11px;
      font-family: inherit;
      border: 1px solid rgba(255,255,255,0.3);
      border-radius: 4px;
      background: rgba(255,255,255,0.1);
    }
    .sb-comment-pin {
      position: absolute;
      z-index: 100000;
      width: 32px;
      height: 32px;
      margin-left: -16px;
      margin-top: -16px;
      border-radius: 50%;
      background: #161b22;
      border: 3px solid hsl(var(--pin-hue, 140), 50%, 38%);
      cursor: pointer;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
      pointer-events: auto;
      transition: transform 100ms ease;
      overflow: hidden;
    }
    .sb-comment-pin img {
      width: 100%;
      height: 100%;
      border-radius: 50%;
      object-fit: cover;
      display: block;
    }
    .sb-comment-pin:hover {
      transform: scale(1.15);
    }
    .sb-comment-pin[data-resolved="true"] {
      border-color: #8b949e;
      opacity: 0.5;
    }
  `,document.head.appendChild(t)}let ie=null,ae=null,U=null,Ct=[],Ge=null;function Kt(){return document.querySelector("main")||document.body}function rt(){if(ae)return ae;const t=Kt();return getComputedStyle(t).position==="static"&&(t.style.position="relative"),ae=document.createElement("div"),ae.className="sb-comment-overlay",t.appendChild(ae),ae}function Ga(){ie||(ie=document.createElement("div"),ie.className="sb-comment-mode-banner",ie.innerHTML="Comment mode — click to place a comment. Press <kbd>C</kbd> or <kbd>Esc</kbd> to exit.",document.body.appendChild(ie))}function Ka(){ie&&(ie.remove(),ie=null)}function Cr(){return window.location.pathname}function Jt(){for(const t of Ct)t.remove();Ct=[]}function Er(t,n,s){const r=document.createElement("div");r.className="sb-comment-pin",r.style.left=`${n.meta?.x??0}%`,r.style.top=`${n.meta?.y??0}%`;const o=s*137.5%360;if(r.style.setProperty("--pin-hue",String(Math.round(o))),n.author?.avatarUrl){const a=document.createElement("img");a.src=n.author.avatarUrl,a.alt=n.author.login??"",r.appendChild(a)}return n.meta?.resolved&&r.setAttribute("data-resolved","true"),r.title=`${n.author?.login??"unknown"}: ${n.text?.slice(0,80)??""}`,r._commentId=n.id,n._rawBody=n.body,r.addEventListener("click",a=>{a.stopPropagation(),U&&(U.destroy(),U=null),jr(t,n,Ge,{onClose:()=>{},onMove:()=>ot()})}),t.appendChild(r),Ct.push(r),r}function _r(){if(!Ge?.comments?.length)return;const t=rt();Jt(),Ge.comments.forEach((n,s)=>{n.meta?.x!=null&&n.meta?.y!=null&&Er(t,n,s)})}async function ot(){if(!Ye())return;const t=rt();_r();try{const n=await xr(Cr());if(Ge=n,Jt(),!n?.comments?.length)return;n.comments.forEach((s,r)=>{s.meta?.x!=null&&s.meta?.y!=null&&Er(t,s,r)}),Ja(t,n)}catch(n){console.warn("[storyboard] Could not load comments:",n.message)}}function Ja(t,n){const s=new URLSearchParams(window.location.search).get("comment");if(!s||!n?.comments?.length)return;const r=n.comments.find(o=>o.id===s);if(r){if(r.meta?.y!=null){const o=Kt(),a=r.meta.y/100*o.scrollHeight,i=o.scrollTop||window.scrollY,l=i+window.innerHeight;if(a<i||a>l){const d=Math.max(0,a-window.innerHeight/3);window.scrollTo({top:d,behavior:"smooth"})}}r._rawBody=r.body,jr(t,r,n,{onClose:()=>{},onMove:()=>ot()})}}function Xa(t){if(!Me()||t.target.closest(".sb-composer")||t.target.closest(".sb-comment-pin")||t.target.closest(".sb-comment-window"))return;Sr(),U&&(U.destroy(),U=null);const n=Kt(),s=n.getBoundingClientRect(),r=Math.round((t.clientX-s.left)/s.width*1e3)/10,o=Math.round((t.clientY-s.top+n.scrollTop)/n.scrollHeight*1e3)/10,a=rt();U=Ha(a,r,o,Cr(),{onCancel:()=>{U=null},onSubmit:()=>{U=null,ot()}})}function Za(t){t?(document.body.classList.add("sb-comment-mode"),Ga(),rt().classList.add("active"),_r(),ot()):(document.body.classList.remove("sb-comment-mode"),Ka(),U&&(U.destroy(),U=null),Sr(),Jt(),ae&&ae.classList.remove("active"))}let Bn=!1;function Qa(){Bn||(Bn=!0,Ya(),Ca(Za),document.addEventListener("click",t=>{Me()&&(t.target.closest(".sb-devtools-wrapper")||t.target.closest(".sb-auth-backdrop")||t.target.closest(".sb-comments-drawer")||t.target.closest(".sb-comments-drawer-backdrop")||Xa(t))}),window.addEventListener("keydown",t=>{const n=t.target.tagName;if(!(n==="INPUT"||n==="TEXTAREA"||n==="SELECT"||t.target.isContentEditable)){if(t.key==="c"&&!t.metaKey&&!t.ctrlKey&&!t.altKey){if(!We())return;if(t.preventDefault(),!Me()&&!Ye()){Fa();return}Sa()}t.key==="Escape"&&Me()&&(t.preventDefault(),Pn(!1))}}),We()&&Ye()&&new URLSearchParams(window.location.search).get("comment")&&Pn(!0))}const ei={repo:{owner:"dfosco",name:"storyboard"},discussions:{category:"General"}},ti={comments:ei},kr=Vr(ga,{basename:"/storyboard/"});Do(kr,"/storyboard/");po();lo();go(ti);So({basePath:"/storyboard/"});Qa();const ni=document.getElementById("root"),ri=Jr.createRoot(ni);ri.render(e.jsx(S.StrictMode,{children:e.jsx(Xr,{colorMode:"auto",children:e.jsxs(Zr,{children:[e.jsx(va,{}),e.jsx(Yr,{router:kr})]})})}));export{li as a,xr as f,Ye as i,ci as l,Fa as o,Pn as s,Sa as t};

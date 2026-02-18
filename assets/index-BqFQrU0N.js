const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/CommentOverlay-Dj3gm384.js","assets/vendor-primer-CS_VN4Z9.js","assets/vendor-react-CEV42LK2.js","assets/vendor-octicons-BwmXKGpU.js","assets/vendor-primer-CL7onuSO.css","assets/vendor-reshaped-BSTWqelT.js","assets/vendor-reshaped-CU0gdG-S.css"])))=>i.map(i=>d[i]);
import{j as n,S as ee,I as Nn,T as je,U as jt,N as Be,B as Ct,u as On,A as Ue,a as Fe,c as Mn,b as Dn,d as Hn}from"./vendor-primer-CS_VN4Z9.js";import{b as j,u as Vt,O as Kt,g as zn,f as Jt,L as Ve,h as Bn,i as Un,j as Fn}from"./vendor-react-CEV42LK2.js";import{e as qn,M as Wn,f as Xt,I as fe,G as rt,g as st,h as at,i as it,S as ct,j as lt,k as Zt,l as Qt,m as en,H as Yn,b as Gn,n as St,o as xe}from"./vendor-octicons-BwmXKGpU.js";import{C as tn,V as m,T as f,D as K,F as R,a as le,S as kt,R as Ke,B as ie,A as Et,b as dt,M as ne}from"./vendor-reshaped-BSTWqelT.js";(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const o of document.querySelectorAll('link[rel="modulepreload"]'))s(o);new MutationObserver(o=>{for(const a of o)if(a.type==="childList")for(const i of a.addedNodes)i.tagName==="LINK"&&i.rel==="modulepreload"&&s(i)}).observe(document,{childList:!0,subtree:!0});function r(o){const a={};return o.integrity&&(a.integrity=o.integrity),o.referrerPolicy&&(a.referrerPolicy=o.referrerPolicy),o.crossOrigin==="use-credentials"?a.credentials="include":o.crossOrigin==="anonymous"?a.credentials="omit":a.credentials="same-origin",a}function s(o){if(o.ep)return;o.ep=!0;const a=r(o);fetch(o.href,a)}})();function Ce(e,t){const r={...e};for(const s of Object.keys(t)){const o=t[s],a=e[s];o!==null&&typeof o=="object"&&!Array.isArray(o)&&a!==null&&typeof a=="object"&&!Array.isArray(a)?r[s]=Ce(a,o):r[s]=o}return r}let D={scenes:{},objects:{},records:{}};function Vn(e){if(!e||typeof e!="object")throw new Error("[storyboard-core] init() requires { scenes, objects, records }");D={scenes:e.scenes||{},objects:e.objects||{},records:e.records||{}}}function Je(e,t){if(t&&D[t]?.[e]!=null)return D[t][e];if(!t){for(const r of["scenes","objects","records"])if(D[r]?.[e]!=null)return D[r][e]}if(t==="scenes"||!t){const r=e.toLowerCase();for(const s of Object.keys(D.scenes))if(s.toLowerCase()===r)return D.scenes[s]}throw new Error(`Data file not found: ${e}${t?` (type: ${t})`:""}`)}function pe(e,t=new Set){if(e===null||typeof e!="object")return e;if(Array.isArray(e))return e.map(s=>pe(s,t));if(e.$ref&&typeof e.$ref=="string"){const s=e.$ref;if(t.has(s))throw new Error(`Circular $ref detected: ${s}`);t.add(s);const o=Je(s,"objects");return pe(o,t)}const r={};for(const[s,o]of Object.entries(e))r[s]=pe(o,t);return r}function Kn(e){if(D.scenes[e]!=null)return!0;const t=e.toLowerCase();for(const r of Object.keys(D.scenes))if(r.toLowerCase()===t)return!0;return!1}function nn(e="default"){let t;try{t=Je(e,"scenes")}catch{throw new Error(`Failed to load scene: ${e}`)}if(Array.isArray(t.$global)){const r=t.$global;delete t.$global;let s={};for(const o of r)try{let a=Je(o);a=pe(a),s=Ce(s,a)}catch(a){console.warn(`Failed to load $global: ${o}`,a)}t=Ce(s,t)}return t=pe(t),structuredClone(t)}function ut(e){const t=D.records[e];if(t==null)throw new Error(`Record not found: ${e}`);if(!Array.isArray(t))throw new Error(`Record "${e}" must be an array, got ${typeof t}`);return structuredClone(t)}function Jn(e,t){return ut(e).find(s=>s.id===t)??null}function on(e,t){if(e==null||typeof t!="string"||t==="")return;const r=t.split(".");let s=e;for(const o of r){if(s==null||typeof s!="object")return;s=s[o]}return s}function he(e){if(Array.isArray(e))return e.map(he);if(e!==null&&typeof e=="object"){const t={};for(const r of Object.keys(e))t[r]=he(e[r]);return t}return e}function Se(e,t,r){const s=t.split(".");let o=e;for(let a=0;a<s.length-1;a++){const i=s[a];(o[i]==null||typeof o[i]!="object")&&(o[i]=/^\d+$/.test(s[a+1])?[]:{}),o=o[i]}o[s[s.length-1]]=r}function Pe(){const e=window.location.hash.replace(/^#/,"");return new URLSearchParams(e)}function rn(e){const t=e.toString();window.location.hash=t}function sn(e){return Pe().get(e)}function oe(e,t){const r=Pe();r.set(e,String(t)),rn(r)}function an(){const e=Pe(),t={};for(const[r,s]of e.entries())t[r]=s;return t}function ke(e){const t=Pe();t.delete(e),rn(t)}const Ae="storyboard:";function Te(e){try{return localStorage.getItem(Ae+e)}catch{return null}}function O(e,t){try{localStorage.setItem(Ae+e,String(t)),pt()}catch{}}function Ee(e){try{localStorage.removeItem(Ae+e),pt()}catch{}}function cn(e){const t=()=>{ln(),e()};return window.addEventListener("storage",t),window.addEventListener("storyboard-storage",t),()=>{window.removeEventListener("storage",t),window.removeEventListener("storyboard-storage",t)}}let ue=null;function ln(){ue=null}function dn(){if(ue!==null)return ue;try{const e=[];for(let t=0;t<localStorage.length;t++){const r=localStorage.key(t);r&&r.startsWith(Ae)&&e.push(r+"="+localStorage.getItem(r))}return ue=e.sort().join("&"),ue}catch{return""}}function pt(){ln(),window.dispatchEvent(new Event("storyboard-storage"))}const mt="__hide__",Ie="historyState",re="currentState",te="nextState",It=200;function me(){return Te(mt)==="1"}function Xn(){be(),O(mt,"1");const e=new URL(window.location.href);e.searchParams.delete("hide"),e.hash="",window.history.replaceState(window.history.state,"",e.toString())}function Zn(){const e=ge();if(e){window.location.hash="";const t=new URLSearchParams(e);for(const[r,s]of t.entries())oe(r,s)}Ee(mt),no("show")}function Ne(){return window.location.pathname}function un(){return new URLSearchParams(window.location.hash.replace(/^#/,"")).toString()}function be(e,t){const r=e!==void 0?e:un(),s=t!==void 0?t:Ne(),o=Oe(),a=Me();if(a!==null&&o[a]){const[,l,u]=o[a];if(l===s&&u===r)return}const i=a!==null?o.slice(0,a+1):o,c=i.length,d=[c,s,r],p=[...i,d];if(p.length>It){const l=p.slice(p.length-It);for(let u=0;u<l.length;u++)l[u]=[u,l[u][1],l[u][2]];O(Ie,JSON.stringify(l)),O(re,String(l.length-1))}else O(Ie,JSON.stringify(p)),O(re,String(c));Ee(te)}function Oe(){const e=Te(Ie);if(!e)return[];try{const t=JSON.parse(e);return Array.isArray(t)?t:[]}catch{return[]}}function Me(){const e=Te(re);if(e===null)return null;const t=parseInt(e,10);return Number.isNaN(t)?null:t}function Qn(){const e=Te(te);if(e===null)return null;const t=parseInt(e,10);return Number.isNaN(t)?null:t}function ge(){const e=Me();if(e===null)return null;const t=Oe();return t[e]?t[e][2]:null}function pn(){const e=Me();if(e===null)return null;const t=Oe();return t[e]?t[e][1]:null}function mn(e){const t=ge();return t?new URLSearchParams(t).get(e):null}function _t(e,t){const r=ge()||"",s=new URLSearchParams(r);s.set(e,String(t)),be(s.toString(),pn()||Ne())}function Lt(e){const t=ge()||"",r=new URLSearchParams(t);r.delete(e),be(r.toString(),pn()||Ne())}function eo(){const e=ge();if(!e)return{};const t=new URLSearchParams(e),r={};for(const[s,o]of t.entries())r[s]=o;return r}function Rt(){if(me())return;const e=Ne(),t=un(),r=Oe(),s=Me();if(!t&&!e&&r.length===0)return;const o=r.findIndex(([,c,d])=>c===e&&d===t);if(o===-1){be(t,e);return}if(o===s)return;const a=s!==null?s-1:null,i=Qn();if(a!==null&&o===a)O(te,String(s)),O(re,String(o));else if(i!==null&&o===i){const c=i+1;r[c]?O(te,String(c)):Ee(te),O(re,String(o))}else{Ee(te),O(re,String(o));const c=r.slice(0,o+1);O(Ie,JSON.stringify(c))}pt()}function to(){be(),window.addEventListener("hashchange",()=>Rt()),window.addEventListener("popstate",()=>Rt())}function no(e){const t=new URL(window.location.href);t.searchParams.has(e)&&(t.searchParams.delete(e),window.history.replaceState(window.history.state,"",t.toString()))}function _e(){const e=new URL(window.location.href);if(e.searchParams.has("hide")){Xn();return}if(e.searchParams.has("show")){Zn();return}}function oo(){_e(),window.addEventListener("popstate",()=>_e())}function De(e){return window.addEventListener("hashchange",e),()=>window.removeEventListener("hashchange",e)}function ht(){return window.location.hash}const ro="modulepreload",so=function(e){return"/storyboard/"+e},$t={},ao=function(t,r,s){let o=Promise.resolve();if(r&&r.length>0){let d=function(p){return Promise.all(p.map(l=>Promise.resolve(l).then(u=>({status:"fulfilled",value:u}),u=>({status:"rejected",reason:u}))))};document.getElementsByTagName("link");const i=document.querySelector("meta[property=csp-nonce]"),c=i?.nonce||i?.getAttribute("nonce");o=d(r.map(p=>{if(p=so(p),p in $t)return;$t[p]=!0;const l=p.endsWith(".css"),u=l?'[rel="stylesheet"]':"";if(document.querySelector(`link[href="${p}"]${u}`))return;const h=document.createElement("link");if(h.rel=l?"stylesheet":ro,l||(h.as="script"),h.crossOrigin="",h.href=p,c&&h.setAttribute("nonce",c),document.head.appendChild(h),l)return new Promise((w,x)=>{h.addEventListener("load",w),h.addEventListener("error",()=>x(new Error(`Unable to preload CSS for ${p}`)))})}))}function a(i){const c=new Event("vite:preloadError",{cancelable:!0});if(c.payload=i,window.dispatchEvent(c),!c.defaultPrevented)throw i}return o.then(i=>{for(const c of i||[])c.status==="rejected"&&a(c.reason);return t().catch(a)})};let se=null;function io(e){if(!e||!e.comments){se=null;return}const t=e.comments;se={repo:{owner:t.repo?.owner??"",name:t.repo?.name??""},discussions:{category:t.discussions?.category??"Storyboard Comments"}}}function ft(){return se}function Le(){return se!==null&&se.repo.owner!==""&&se.repo.name!==""}const co=`
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
`,lo='<svg viewBox="0 0 16 16"><path d="M5 5.782V2.5h-.25a.75.75 0 010-1.5h6.5a.75.75 0 010 1.5H11v3.282l3.666 5.86C15.619 13.04 14.552 15 12.46 15H3.54c-2.092 0-3.159-1.96-2.206-3.358zM6.5 2.5v3.782a.75.75 0 01-.107.384L3.2 12.5h9.6l-3.193-5.834A.75.75 0 019.5 6.282V2.5z"/></svg>',uo='<svg viewBox="0 0 16 16"><path d="M0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8Zm8-6.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13ZM6.5 7.75A.75.75 0 0 1 7.25 7h1a.75.75 0 0 1 .75.75v2.75h.25a.75.75 0 0 1 0 1.5h-2a.75.75 0 0 1 0-1.5h.25v-2h-.25a.75.75 0 0 1-.75-.75ZM8 6a1 1 0 1 1 0-2 1 1 0 0 1 0 2Z"/></svg>',po='<svg viewBox="0 0 16 16"><path d="M1.705 8.005a.75.75 0 0 1 .834.656 5.5 5.5 0 0 0 9.592 2.97l-1.204-1.204a.25.25 0 0 1 .177-.427h3.646a.25.25 0 0 1 .25.25v3.646a.25.25 0 0 1-.427.177l-1.38-1.38A7.002 7.002 0 0 1 1.05 8.84a.75.75 0 0 1 .656-.834ZM8 2.5a5.487 5.487 0 0 0-4.131 1.869l1.204 1.204A.25.25 0 0 1 4.896 6H1.25A.25.25 0 0 1 1 5.75V2.104a.25.25 0 0 1 .427-.177l1.38 1.38A7.002 7.002 0 0 1 14.95 7.16a.75.75 0 0 1-1.49.178A5.5 5.5 0 0 0 8 2.5Z"/></svg>',mo='<svg viewBox="0 0 16 16"><path d="M8.5 1.75a.75.75 0 0 0-1.5 0V3H1.75a.75.75 0 0 0 0 1.5H3v6H1.75a.75.75 0 0 0 0 1.5H7v1.25a.75.75 0 0 0 1.5 0V12h5.25a.75.75 0 0 0 0-1.5H12v-6h1.75a.75.75 0 0 0 0-1.5H8.5Zm2 8.75h-5a.25.25 0 0 1-.25-.25v-4.5A.25.25 0 0 1 5.5 5.5h5a.25.25 0 0 1 .25.25v4.5a.25.25 0 0 1-.25.25Z"/></svg>',ho='<svg viewBox="0 0 16 16"><path d="M3.72 3.72a.75.75 0 0 1 1.06 0L8 6.94l3.22-3.22a.749.749 0 0 1 1.275.326.749.749 0 0 1-.215.734L9.06 8l3.22 3.22a.749.749 0 0 1-.326 1.275.749.749 0 0 1-.734-.215L8 9.06l-3.22 3.22a.751.751 0 0 1-1.042-.018.751.751 0 0 1-.018-1.042L6.94 8 3.72 4.78a.75.75 0 0 1 0-1.06Z"/></svg>';function fo(){return new URLSearchParams(window.location.search).get("scene")||"default"}function bo(e={}){const t=e.container||document.body,r=e.basePath||"/";if(t.querySelector(".sb-devtools-wrapper"))return;const s=document.createElement("style");s.textContent=co,document.head.appendChild(s);let o=!0,a=!1;const i=document.createElement("div");i.className="sb-devtools-wrapper";const c=document.createElement("button");c.className="sb-devtools-trigger",c.setAttribute("aria-label","Storyboard DevTools"),c.innerHTML=lo;const d=document.createElement("div");d.className="sb-devtools-menu";const p=document.createElement("button");p.className="sb-devtools-menu-item",p.innerHTML=`${mo} Viewfinder`;const l=document.createElement("button");l.className="sb-devtools-menu-item",l.innerHTML=`${uo} Show scene info`;const u=document.createElement("button");u.className="sb-devtools-menu-item",u.innerHTML=`${po} Reset all params`;const h=document.createElement("div");h.className="sb-devtools-hint",h.innerHTML="Press <code>⌘ + .</code> to hide",d.appendChild(p),d.appendChild(l),d.appendChild(u);function w(){d.querySelectorAll("[data-sb-comment-menu-item]").forEach(y=>y.remove()),Le()&&ao(async()=>{const{getCommentsMenuItems:y}=await import("./CommentOverlay-Dj3gm384.js");return{getCommentsMenuItems:y}},__vite__mapDeps([0,1,2,3,4,5,6])).then(({getCommentsMenuItems:y})=>{const E=y(),_=h;for(const $ of E){const L=document.createElement("button");L.className="sb-devtools-menu-item",L.setAttribute("data-sb-comment-menu-item",""),L.innerHTML=`<span style="width:16px;height:16px;display:flex;align-items:center;justify-content:center;">${$.icon}</span> ${$.label}`,L.addEventListener("click",()=>{a=!1,d.classList.remove("open"),$.onClick()}),d.insertBefore(L,_)}})}c.addEventListener("click",w),d.appendChild(h),i.appendChild(d),i.appendChild(c),t.appendChild(i);let x=null;function g(){a=!1,d.classList.remove("open"),x&&x.remove();const y=fo();let E="",_=null;try{E=JSON.stringify(nn(y),null,2)}catch(B){_=B.message}x=document.createElement("div"),x.className="sb-devtools-overlay";const $=document.createElement("div");$.className="sb-devtools-backdrop",$.addEventListener("click",S);const L=document.createElement("div");L.className="sb-devtools-panel";const W=document.createElement("div");W.className="sb-devtools-panel-header",W.innerHTML=`<span class="sb-devtools-panel-title">Scene: ${y}</span>`;const z=document.createElement("button");z.className="sb-devtools-panel-close",z.setAttribute("aria-label","Close panel"),z.innerHTML=ho,z.addEventListener("click",S),W.appendChild(z);const X=document.createElement("div");if(X.className="sb-devtools-panel-body",_)X.innerHTML=`<span class="sb-devtools-error">${_}</span>`;else{const B=document.createElement("pre");B.className="sb-devtools-code",B.textContent=E,X.appendChild(B)}L.appendChild(W),L.appendChild(X),x.appendChild($),x.appendChild(L),t.appendChild(x)}function S(){x&&(x.remove(),x=null)}c.addEventListener("click",()=>{a=!a,d.classList.toggle("open",a)}),l.addEventListener("click",g),p.addEventListener("click",()=>{a=!1,d.classList.remove("open"),window.location.href=r+"viewfinder"}),u.addEventListener("click",()=>{window.location.hash="",a=!1,d.classList.remove("open")}),document.addEventListener("click",y=>{a&&!i.contains(y.target)&&(a=!1,d.classList.remove("open"))}),window.addEventListener("keydown",y=>{y.key==="."&&(y.metaKey||y.ctrlKey)&&(y.preventDefault(),o=!o,i.style.display=o?"":"none",o||(a=!1,d.classList.remove("open"),S()))})}const go={user:{$ref:"jane-doe"},navigation:{$ref:"navigation"},projects:[{id:1,name:"primer-react",description:"React components for the Primer Design System",owner:{name:"GitHub",avatar:"https://avatars.githubusercontent.com/u/9919?v=4"},stars:2500,issues:42},{id:2,name:"storyboard",description:"Prototyping meta-framework",owner:{name:"Jane Doe",avatar:"https://avatars.githubusercontent.com/u/1?v=4"},stars:128,issues:7}],settings:{theme:"dark_dimmed",notifications:!0,language:"en"},signup:{fullName:"",email:"",password:"",organization:{name:"",size:"",role:""},workspace:{region:"",plan:"starter",newsletter:!1,agreeTerms:!1}}},xo={primary:[{label:"Overview",url:"/Overview",icon:"home"},{label:"Issues",url:"/Issues",icon:"issue-opened"},{label:"Pull Requests",url:"#",icon:"git-pull-request"},{label:"Discussions",url:"#",icon:"comment-discussion"}],secondary:[{label:"Settings",url:"#",icon:"gear"},{label:"Help",url:"#",icon:"question"}]},yo={name:"Jane Doe",username:"janedoe",role:"admin",avatar:"https://avatars.githubusercontent.com/u/1?v=4",profile:{bio:"Designer & developer",location:"San Francisco, CA"}},vo=[{id:"refactor-auth-sso",identifier:"FIL-10",title:"Refactor authentication flow to support SSO providers",description:"Our current auth flow only supports email/password login. We need to extend it to support SSO providers (Google, Okta, Azure AD) for enterprise customers.",status:"todo",priority:"high",labels:["Auth","Backend","Feature"],assignee:null,project:null,estimate:5,author:"danielfosco",authorAvatar:"https://avatars.githubusercontent.com/u/4331946?v=4",createdAt:"2026-02-17T10:50:00Z",acceptanceCriteria:["Users can authenticate via Google OAuth 2.0","Users can authenticate via SAML-based SSO (Okta, Azure AD)","Existing email/password flow remains unchanged","Session tokens are issued consistently regardless of auth method","Admin panel includes SSO configuration settings"],technicalNotes:["Use the existing AuthService class as the base","Add a provider strategy pattern to abstract login methods","Store provider metadata in the identity_providers table","Redirect URI callback must handle both web and mobile clients"],activity:[{type:"created",user:"danielfosco",avatar:"https://avatars.githubusercontent.com/u/4331946?v=4",time:"10min ago"}]},{id:"fix-rate-limiter-bypass",identifier:"FIL-9",title:"Fix rate limiter bypass on batch endpoints",description:"The rate limiter can be bypassed by splitting a large request into multiple smaller batch calls. Each sub-request is counted as a single hit instead of being weighted by payload size.",status:"in_progress",priority:"urgent",labels:["Bug","Security","Backend"],assignee:"danielfosco",assigneeAvatar:"https://avatars.githubusercontent.com/u/4331946?v=4",project:"Platform Infrastructure",estimate:3,author:"danielfosco",authorAvatar:"https://avatars.githubusercontent.com/u/4331946?v=4",createdAt:"2026-02-16T14:20:00Z",acceptanceCriteria:["Batch endpoints count each item in the payload toward the rate limit","Rate limit headers reflect weighted counts","Existing single-request endpoints are unaffected"],technicalNotes:["Update RateLimiterMiddleware to accept a weight function","Batch controller should pass payload.length as weight","Add integration tests for weighted rate limiting"],activity:[{type:"created",user:"danielfosco",avatar:"https://avatars.githubusercontent.com/u/4331946?v=4",time:"1 day ago"},{type:"comment",user:"danielfosco",avatar:"https://avatars.githubusercontent.com/u/4331946?v=4",time:"6 hours ago",body:"Started investigating — the middleware doesn't have access to parsed body at the point it runs. May need to restructure."}]},{id:"add-webhook-retry-logic",identifier:"FIL-8",title:"Add exponential backoff retry logic for webhook deliveries",description:"Webhook deliveries currently fail silently on timeout. We need retry logic with exponential backoff and a dead-letter queue for persistently failing endpoints.",status:"todo",priority:"medium",labels:["Feature","Backend"],assignee:null,project:"Platform Infrastructure",estimate:8,author:"danielfosco",authorAvatar:"https://avatars.githubusercontent.com/u/4331946?v=4",createdAt:"2026-02-15T09:00:00Z",acceptanceCriteria:["Failed webhook deliveries are retried up to 5 times","Retry intervals follow exponential backoff (1s, 2s, 4s, 8s, 16s)","After all retries, the event is moved to a dead-letter queue","Delivery status is visible in the admin dashboard"],technicalNotes:["Use the existing job queue (BullMQ) for retry scheduling","Add a webhook_deliveries table to track attempts","Dead-letter events should be replayable from the admin UI"],activity:[{type:"created",user:"danielfosco",avatar:"https://avatars.githubusercontent.com/u/4331946?v=4",time:"2 days ago"}]},{id:"dashboard-loading-skeleton",identifier:"FIL-7",title:"Add loading skeletons to dashboard widgets",description:"Dashboard widgets show a blank space while data is loading. Add skeleton loaders to improve perceived performance.",status:"done",priority:"low",labels:["Feature","Frontend"],assignee:"danielfosco",assigneeAvatar:"https://avatars.githubusercontent.com/u/4331946?v=4",project:"Dashboard",estimate:2,author:"danielfosco",authorAvatar:"https://avatars.githubusercontent.com/u/4331946?v=4",createdAt:"2026-02-12T16:30:00Z",acceptanceCriteria:["All dashboard cards show skeleton loaders while fetching data","Skeleton matches the shape of the loaded content","Transition from skeleton to content is smooth"],technicalNotes:["Use Reshaped Skeleton component","Wrap each StatCard in a loading boundary"],activity:[{type:"created",user:"danielfosco",avatar:"https://avatars.githubusercontent.com/u/4331946?v=4",time:"5 days ago"},{type:"comment",user:"danielfosco",avatar:"https://avatars.githubusercontent.com/u/4331946?v=4",time:"3 days ago",body:"Done — merged in FIL-7-skeletons branch."}]},{id:"migrate-env-config",identifier:"FIL-6",title:"Migrate environment config to typed schema validation",description:"Environment variables are currently accessed via raw process.env lookups with no validation. Migrate to a typed config schema using zod so missing or malformed values are caught at startup.",status:"todo",priority:"medium",labels:["Backend","DevEx"],assignee:null,project:null,estimate:3,author:"danielfosco",authorAvatar:"https://avatars.githubusercontent.com/u/4331946?v=4",createdAt:"2026-02-10T11:00:00Z",acceptanceCriteria:["All environment variables are defined in a single config schema","Server fails fast on startup if required variables are missing","Types are inferred from the schema — no manual type assertions"],technicalNotes:["Use zod for schema definition and parsing","Create src/config.ts as the single source of truth","Replace all process.env.X references with config.X"],activity:[{type:"created",user:"danielfosco",avatar:"https://avatars.githubusercontent.com/u/4331946?v=4",time:"1 week ago"}]}],wo={default:go},jo={navigation:xo,"jane-doe":yo},Co={issues:vo};Vn({scenes:wo,objects:jo,records:Co});const bt=j.createContext(null);function So(){return new URLSearchParams(window.location.search).get("scene")}function ko(){const e=window.location.pathname.replace(/\/+$/,"")||"/";return e==="/"?"index":e.split("/").pop()||"index"}function Eo({sceneName:e,recordName:t,recordParam:r,children:s}){const o=ko(),a=So()||e||(Kn(o)?o:"default"),i=Vt(),{data:c,error:d}=j.useMemo(()=>{try{let l=nn(a);if(t&&r&&i[r]){const u=Jn(t,i[r]);u&&(l=Ce(l,{record:u}))}return{data:l,error:null}}catch(l){return{data:null,error:l.message}}},[a,t,r,i]),p={data:c,error:d,loading:!1,sceneName:a};return d?n.jsxs("span",{style:{color:"var(--fgColor-danger, #f85149)"},children:["Error loading scene: ",d]}):n.jsx(bt.Provider,{value:p,children:s})}function J(e){const t=j.useContext(bt);if(t===null)throw new Error("useSceneData must be used within a <StoryboardProvider>");const{data:r,loading:s,error:o}=t,a=j.useSyncExternalStore(De,ht),i=j.useSyncExternalStore(cn,dn);return j.useMemo(()=>{if(s||o||r==null)return;const d=me(),p=d?mn:sn,l=d?eo:an;if(!e){const S=l(),y=Object.keys(S);if(y.length===0)return r;const E=he(r);for(const _ of y)Se(E,_,S[_]);return E}const u=p(e);if(u!==null)return u;const h=e+".",w=l(),x=Object.keys(w).filter(S=>S.startsWith(h)),g=on(r,e);if(x.length>0&&g!==void 0){const S=he(g);for(const y of x){const E=y.slice(h.length);Se(S,E,w[y])}return S}return g===void 0?(console.warn(`[useSceneData] Path "${e}" not found in scene data.`),{}):g},[r,s,o,e,a,i])}function N(e){const t=j.useContext(bt);if(t===null)throw new Error("useOverride must be used within a <StoryboardProvider>");const{data:r}=t,s=me(),o=r!=null?on(r,e):void 0,a=j.useCallback(()=>sn(e),[e]),i=j.useSyncExternalStore(De,a);j.useSyncExternalStore(cn,dn);let c;if(s){const l=mn(e);c=l!==null?l:o}else c=i!==null?i:o;const d=j.useCallback(l=>{me()||oe(e,l),_t(e,l)},[e]),p=j.useCallback(()=>{me()||ke(e),Lt(e)},[e]);return[c,d,p]}function hn(e,t){const r=an(),s=`record.${t}.`,o=Object.keys(r).filter(c=>c.startsWith(s));if(o.length===0)return e;const a=he(e),i={};for(const c of o){const d=c.slice(s.length),p=d.indexOf(".");if(p===-1)continue;const l=d.slice(0,p),u=d.slice(p+1);i[l]||(i[l]={}),i[l][u]=r[c]}for(const[c,d]of Object.entries(i)){const p=a.find(l=>l.id===c);if(p)for(const[l,u]of Object.entries(d))Se(p,l,u);else{const l={id:c};for(const[u,h]of Object.entries(d))Se(l,u,h);a.push(l)}}return a}function Io(e,t="id"){const s=Vt()[t],o=j.useSyncExternalStore(De,ht);return j.useMemo(()=>{if(!s)return null;try{const a=ut(e);return hn(a,e).find(c=>c[t]===s)??null}catch(a){return console.error(`[useRecord] ${a.message}`),null}},[e,t,s,o])}function _o(e){const t=j.useSyncExternalStore(De,ht);return j.useMemo(()=>{try{const r=ut(e);return hn(r,e)}catch(r){return console.error(`[useRecords] ${r.message}`),[]}},[e,t])}function Z(e,t,r){return N(`record.${e}.${t}.${r}`)}function Lo(e,t=""){const r=t.replace(/\/+$/,"");document.addEventListener("click",o=>{if(o.metaKey||o.ctrlKey||o.shiftKey||o.altKey)return;const a=o.target.closest("a[href]");if(!a||a.target==="_blank")return;const i=new URL(a.href,window.location.origin);if(i.origin!==window.location.origin)return;const c=window.location.hash,d=c&&c!=="#",l=i.hash&&i.hash!=="#"?i.hash:d?c:"";let u=i.pathname;r&&u.startsWith(r)&&(u=u.slice(r.length)||"/"),o.preventDefault(),e.navigate(u+i.search+l),setTimeout(_e,0)});const s=e.navigate.bind(e);e.navigate=(o,a)=>{const i=window.location.hash;return i&&i!=="#"&&typeof o=="string"&&!o.includes("#")&&(o=o+i),s(o,a).then(d=>(_e(),d))}}j.createContext(null);function Ro(){return n.jsxs("div",{style:{display:"flex",alignItems:"center",justifyContent:"center",minHeight:"100vh",backgroundColor:"var(--bgColor-default, #0d1117)"},children:[n.jsxs("svg",{width:"48",height:"48",viewBox:"0 0 24 24",fill:"none",style:{animation:"spin 0.8s linear infinite"},children:[n.jsx("circle",{cx:"12",cy:"12",r:"10",stroke:"var(--fgColor-muted, #484f58)",strokeWidth:"2.5",opacity:"0.25"}),n.jsx("path",{d:"M12 2a10 10 0 0 1 10 10",stroke:"var(--fgColor-default, #e6edf3)",strokeWidth:"2.5",strokeLinecap:"round"})]}),n.jsx("style",{children:"@keyframes spin { to { transform: rotate(360deg) } }"})]})}function $o(){return n.jsx(Eo,{children:n.jsx(j.Suspense,{fallback:n.jsx(Ro,{}),children:n.jsx(Kt,{})})})}const Po=Object.freeze(Object.defineProperty({__proto__:null,default:$o},Symbol.toStringTag,{value:"Module"}));var qe={exports:{}},We,Pt;function Ao(){if(Pt)return We;Pt=1;var e="SECRET_DO_NOT_PASS_THIS_OR_YOU_WILL_BE_FIRED";return We=e,We}var Ye,At;function To(){if(At)return Ye;At=1;var e=Ao();function t(){}function r(){}return r.resetWarningCache=t,Ye=function(){function s(i,c,d,p,l,u){if(u!==e){var h=new Error("Calling PropTypes validators directly is not supported by the `prop-types` package. Use PropTypes.checkPropTypes() to call them. Read more at http://fb.me/use-check-prop-types");throw h.name="Invariant Violation",h}}s.isRequired=s;function o(){return s}var a={array:s,bigint:s,bool:s,func:s,number:s,object:s,string:s,symbol:s,any:s,arrayOf:o,element:s,elementType:s,instanceOf:o,node:s,objectOf:o,oneOf:o,oneOfType:o,shape:o,exact:o,checkPropTypes:r,resetWarningCache:t};return a.PropTypes=a,a},Ye}var Tt;function No(){return Tt||(Tt=1,qe.exports=To()()),qe.exports}var Oo=No();const F=zn(Oo),Mo="_header_1282e_1",Do="_headerContent_1282e_8",Ho="_titleWrapper_1282e_17",zo="_separator_1282e_21",Bo="_subtitle_1282e_25",de={header:Mo,headerContent:Do,titleWrapper:Ho,separator:zo,subtitle:Bo},Uo=[{icon:Xt,label:"Code",current:!0},{icon:fe,label:"Issues",counter:30},{icon:rt,label:"Pull Requests",counter:3},{icon:st,label:"Discussions"},{icon:at,label:"Actions"},{icon:it,label:"Projects",counter:7},{icon:ct,label:"Security",counter:12},{icon:lt,label:"Insights"}];function fn({items:e=Uo,title:t,subtitle:r}){return n.jsxs(ee,{as:"header",className:de.header,children:[n.jsxs("div",{className:de.headerContent,children:[n.jsx(Nn,{icon:qn,"aria-label":"Open global navigation menu",unsafeDisableTooltip:!0}),n.jsx(Wn,{size:32}),n.jsxs(ee,{direction:"horizontal",gap:"condensed",className:de.titleWrapper,children:[n.jsx("span",{children:t||"title"}),r&&n.jsxs(n.Fragment,{children:[n.jsx(je,{className:de.separator,children:"/"}),n.jsx(je,{className:de.subtitle,children:r||"subtitle"})]})]})]}),n.jsx(jt,{"aria-label":"Repository",children:e.map(s=>n.jsx(jt.Item,{icon:s.icon,"aria-current":s.current?"page":void 0,counter:s.counter,href:s.url,children:s.label},s.label))})]})}fn.propTypes={items:F.arrayOf(F.shape({icon:F.elementType,label:F.string.isRequired,current:F.bool,counter:F.number,url:F.string})),title:F.string,subtitle:F.string};const Fo=[{icon:fe,label:"Open issues",url:"#"},{icon:Zt,label:"Your issues",url:"#"},{icon:Qt,label:"Assigned to you",url:"#",current:!0},{icon:en,label:"Mentioning you",url:"#"}];function qo({items:e=Fo}){return n.jsx(Be,{"aria-label":"Navigation",children:e.map(t=>n.jsxs(Be.Item,{href:t.url,"aria-current":t.current?"page":void 0,children:[t.icon&&n.jsx(Be.LeadingVisual,{children:n.jsx(t.icon,{})}),t.label]},t.label))})}const Wo="_wrapper_74lhx_1",Yo="_navigation_74lhx_7",Go="_main_74lhx_13",Vo="_container_74lhx_22",ye={wrapper:Wo,navigation:Yo,main:Go,container:Vo};function bn({children:e,title:t,subtitle:r,topnav:s,sidenav:o}){return n.jsxs(ee,{className:ye.container,children:[n.jsx(fn,{title:t,subtitle:r,items:s}),n.jsxs("div",{className:ye.wrapper,children:[o&&n.jsx("aside",{className:ye.navigation,children:n.jsx(qo,{items:o})}),n.jsx("main",{className:ye.main,children:e})]})]})}const Ko=[{icon:Xt,label:"Code",url:"/"},{icon:fe,label:"Issues",counter:10,url:"#issues",current:!0},{icon:rt,label:"Pull Requests",counter:3},{icon:st,label:"Discussions"},{icon:at,label:"Actions"},{icon:it,label:"Projects",counter:7},{icon:ct,label:"Security",counter:12},{icon:lt,label:"Insights"}],Jo=[{icon:fe,label:"Open issues",url:""},{icon:Zt,label:"Your issues",url:""},{icon:Qt,label:"Assigned to you",url:"",current:!0},{icon:en,label:"Mentioning you",url:""}];function Xo(){const e=J("user");return n.jsxs(bn,{title:"Primer",subtitle:"React",topnav:Ko,sidenav:Jo,children:[n.jsx("h2",{children:"Issues"}),n.jsxs("p",{style:{color:"var(--fgColor-muted)",marginTop:"var(--base-size-8)"},children:["This is a Primer-styled page with scene data, top navigation, and a sidebar.",e?.name&&n.jsxs(n.Fragment,{children:[" Logged in as ",n.jsx("strong",{children:e.name}),"."]})]})]})}const Zo=Object.freeze(Object.defineProperty({__proto__:null,default:Xo},Symbol.toStringTag,{value:"Module"})),Qo=[{icon:Yn,label:"Home",url:"/",current:!0},{icon:fe,label:"Issues",url:"/Issues"},{icon:rt,label:"Pull Requests"},{icon:st,label:"Discussions"},{icon:at,label:"Actions"},{icon:it,label:"Projects"},{icon:ct,label:"Security"},{icon:lt,label:"Insights"}];function er(){const e=J("user");return n.jsx(bn,{title:"Storyboard",subtitle:"Example",topnav:Qo,children:n.jsxs("div",{style:{maxWidth:600,width:"100%"},children:[n.jsxs(je,{as:"h1",style:{marginBottom:"var(--base-size-16)"},children:["Welcome",e?.name?`, ${e.name}`:""]}),n.jsxs(je,{as:"p",style:{marginBottom:"var(--base-size-16)",color:"var(--fgColor-muted)"},children:["This is a Storyboard prototype. Edit pages in ",n.jsx("code",{children:"src/pages/"})," and data files in ",n.jsx("code",{children:"src/data/"})," to build your prototype."]}),n.jsxs(ee,{direction:"horizontal",gap:"condensed",children:[n.jsxs(Ct,{as:"a",href:"/Issues",variant:"primary",children:[n.jsx(Gn,{})," View Issues (Primer)"]}),n.jsx(Ct,{as:"a",href:"/issues",children:"View Issues (Reshaped)"})]})]})})}const tr=Object.freeze(Object.defineProperty({__proto__:null,default:er},Symbol.toStringTag,{value:"Module"})),nr="_navItem_ec50i_1",or="_active_ec50i_16",Nt={navItem:nr,active:or},rr=[{label:"Overview",path:"/Dashboard"},{label:"Issues",path:"/issues"},{label:"Projects",path:"/Dashboard"},{label:"Views",path:"/Dashboard"}];function Xe({orgName:e,activePage:t,userInfo:r}){const s=Jt();return n.jsx(tn,{padding:4,children:n.jsxs(m,{direction:"column",gap:2,children:[n.jsx(f,{variant:"featured-3",weight:"bold",children:e||"—"}),n.jsx(K,{}),n.jsx("nav",{children:n.jsx(m,{direction:"column",gap:0,children:rr.map(o=>n.jsx("button",{type:"button",className:`${Nt.navItem} ${t===o.label?Nt.active:""}`,onClick:()=>s(o.path),children:n.jsx(f,{variant:"body-3",weight:t===o.label?"bold":"regular",children:o.label})},o.label))})}),r&&n.jsxs(n.Fragment,{children:[n.jsx(K,{}),n.jsxs(m,{direction:"column",gap:1,paddingTop:1,children:[n.jsx(f,{variant:"caption-1",color:"neutral-faded",children:r.name||"—"}),n.jsx(f,{variant:"caption-1",color:"neutral-faded",children:r.role||"—"})]})]})]})})}const gn={todo:"Todo",in_progress:"In Progress",done:"Done",cancelled:"Cancelled"},xn={urgent:"Urgent",high:"High",medium:"Medium",low:"Low"},sr=Object.entries(gn),ar=Object.entries(xn);function yn({prefix:e}){const[t,r]=N(`${e}.title`),[s,o]=N(`${e}.description`),[a,i]=N(`${e}.status`),[c,d]=N(`${e}.priority`),[p,l]=N(`${e}.assignee`),[u,h]=N(`${e}.project`),[w,x]=N(`${e}.estimate`);return n.jsxs(m,{direction:"column",gap:4,children:[n.jsxs(R,{children:[n.jsx(R.Label,{children:"Title"}),n.jsx(le,{name:"title",value:t??"",onChange:({value:g})=>r(g)})]}),n.jsxs(R,{children:[n.jsx(R.Label,{children:"Description"}),n.jsx(le,{name:"description",multiline:!0,value:s??"",onChange:({value:g})=>o(g),inputAttributes:{rows:3}})]}),n.jsxs(m,{direction:"row",gap:4,children:[n.jsx(m.Item,{grow:!0,children:n.jsxs(R,{children:[n.jsx(R.Label,{children:"Status"}),n.jsx(kt,{name:"status",value:a??"todo",onChange:({value:g})=>i(g),children:sr.map(([g,S])=>n.jsx("option",{value:g,children:S},g))})]})}),n.jsx(m.Item,{grow:!0,children:n.jsxs(R,{children:[n.jsx(R.Label,{children:"Priority"}),n.jsx(kt,{name:"priority",value:c??"medium",onChange:({value:g})=>d(g),children:ar.map(([g,S])=>n.jsx("option",{value:g,children:S},g))})]})})]}),n.jsxs(m,{direction:"row",gap:4,children:[n.jsx(m.Item,{grow:!0,children:n.jsxs(R,{children:[n.jsx(R.Label,{children:"Assignee"}),n.jsx(le,{name:"assignee",placeholder:"Username",value:p??"",onChange:({value:g})=>l(g)})]})}),n.jsx(m.Item,{grow:!0,children:n.jsxs(R,{children:[n.jsx(R.Label,{children:"Project"}),n.jsx(le,{name:"project",placeholder:"Project name",value:u??"",onChange:({value:g})=>h(g)})]})})]}),n.jsxs(R,{children:[n.jsx(R.Label,{children:"Estimate (points)"}),n.jsx(le,{name:"estimate",placeholder:"e.g. 5",value:w??"",onChange:({value:g})=>x(g)})]})]})}const ir={Auth:"neutral",Backend:"critical",Feature:"primary",Bug:"critical",Security:"warning",Frontend:"primary",DevEx:"positive"},ve=["title","description","status","priority","assignee","project","estimate"];function cr({issue:e,active:t,onClose:r}){const s={title:Z("issues",e.id,"title"),description:Z("issues",e.id,"description"),status:Z("issues",e.id,"status"),priority:Z("issues",e.id,"priority"),assignee:Z("issues",e.id,"assignee"),project:Z("issues",e.id,"project"),estimate:Z("issues",e.id,"estimate")},o=()=>{ve.forEach(c=>{oe(`draft.edit.${c}`,e[c]??"")})},a=()=>{const c=new URLSearchParams(window.location.hash.replace(/^#/,""));ve.forEach(d=>{const[,p]=s[d];p(c.get(`draft.edit.${d}`)??"")}),ve.forEach(d=>ke(`draft.edit.${d}`)),r({reason:"save"})},i=()=>{ve.forEach(c=>ke(`draft.edit.${c}`)),r({reason:"cancel"})};return n.jsxs(ne,{active:t,onClose:i,onOpen:o,size:"600px",padding:6,position:"center",children:[n.jsx(ne.Title,{children:"Edit Issue"}),n.jsx(ne.Subtitle,{children:e.identifier}),n.jsxs(m,{direction:"column",gap:4,paddingTop:4,children:[n.jsx(yn,{prefix:"draft.edit"}),n.jsxs(m,{direction:"row",justify:"end",gap:2,paddingTop:2,children:[n.jsx(ie,{variant:"outline",onClick:i,children:"Cancel"}),n.jsx(ie,{color:"primary",onClick:a,children:"Save"})]})]})]})}function lr(){const[e,t,r]=N("ui.editModal"),s=e==="true",o=Io("issues","id"),a=J("signup.organization.name"),i=J("signup.fullName"),c=J("signup.organization.role");return o?n.jsx(Ke,{defaultTheme:"reshaped",defaultColorMode:"dark",children:n.jsx(m,{backgroundColor:"page",minHeight:"100vh",padding:12,children:n.jsxs(m,{direction:"row",align:"start",gap:8,wrap:"no-wrap",children:[n.jsx(m.Item,{columns:2,children:n.jsx(Xe,{orgName:a,activePage:"Issues",userInfo:{name:i,role:c}})}),n.jsx(m.Item,{grow:!0,children:n.jsxs(m,{direction:"row",gap:8,align:"start",children:[n.jsx(m.Item,{grow:!0,children:n.jsxs(m,{direction:"column",gap:4,maxWidth:"720px",children:[n.jsxs(m,{direction:"row",gap:2,align:"center",justify:"space-between",children:[n.jsxs(m,{direction:"row",gap:2,align:"center",children:[n.jsx(Ve,{to:"/issues",style:{textDecoration:"none"},children:n.jsx(f,{variant:"caption-1",color:"neutral-faded",children:a||"Workspace"})}),n.jsx(f,{variant:"caption-1",color:"neutral-faded",children:"›"}),n.jsx(f,{variant:"caption-1",color:"neutral-faded",children:o.identifier})]}),n.jsx(ie,{variant:"outline",size:"small",onClick:()=>t("true"),children:"Edit issue"})]}),n.jsx(cr,{issue:o,active:s,onClose:()=>r()}),n.jsx(f,{variant:"featured-1",weight:"bold",children:o.title}),o.description&&n.jsx(f,{variant:"body-2",color:"neutral-faded",children:o.description}),o.acceptanceCriteria?.length>0&&n.jsxs(m,{direction:"column",gap:2,children:[n.jsx(f,{variant:"body-2",weight:"bold",children:"Acceptance Criteria"}),n.jsx("ul",{style:{margin:0,paddingLeft:"1.5rem"},children:o.acceptanceCriteria.map((d,p)=>n.jsx("li",{style:{marginBottom:"0.5rem"},children:n.jsx(f,{variant:"body-3",children:d})},p))})]}),o.technicalNotes?.length>0&&n.jsxs(m,{direction:"column",gap:2,children:[n.jsx(f,{variant:"body-2",weight:"bold",children:"Technical Notes"}),n.jsx("ul",{style:{margin:0,paddingLeft:"1.5rem"},children:o.technicalNotes.map((d,p)=>n.jsx("li",{style:{marginBottom:"0.5rem"},children:n.jsx(f,{variant:"body-3",children:d})},p))})]}),n.jsx(K,{}),n.jsx(f,{variant:"caption-1",color:"neutral-faded",children:"+ Add sub-issues"}),n.jsx(K,{}),n.jsxs(m,{direction:"column",gap:3,children:[n.jsx(f,{variant:"body-2",weight:"bold",children:"Activity"}),(o.activity||[]).map((d,p)=>n.jsxs(m,{direction:"row",gap:3,align:"center",children:[n.jsx(Et,{src:d.avatar,initials:d.user?.[0]?.toUpperCase(),size:6}),n.jsxs(m,{direction:"column",children:[n.jsxs(f,{variant:"body-3",children:[n.jsx(f,{weight:"medium",children:d.user}),d.type==="created"&&" created the issue",d.type==="comment"&&":"]}),d.body&&n.jsx(f,{variant:"body-3",color:"neutral-faded",children:d.body}),n.jsx(f,{variant:"caption-1",color:"neutral-faded",children:d.time})]})]},p))]})]})}),n.jsx(m.Item,{columns:3,children:n.jsx(tn,{padding:4,children:n.jsxs(m,{direction:"column",gap:4,children:[n.jsx(f,{variant:"caption-1",color:"neutral-faded",weight:"medium",children:"Properties"}),n.jsx(K,{}),n.jsxs(m,{direction:"column",gap:1,children:[n.jsx(f,{variant:"caption-1",color:"neutral-faded",children:"Status"}),n.jsx(f,{variant:"body-3",children:gn[o.status]||o.status})]}),n.jsxs(m,{direction:"column",gap:1,children:[n.jsx(f,{variant:"caption-1",color:"neutral-faded",children:"Priority"}),n.jsx(f,{variant:"body-3",children:xn[o.priority]||o.priority})]}),n.jsxs(m,{direction:"column",gap:1,children:[n.jsx(f,{variant:"caption-1",color:"neutral-faded",children:"Assignee"}),o.assignee?n.jsxs(m,{direction:"row",gap:2,align:"center",children:[n.jsx(Et,{src:o.assigneeAvatar,initials:o.assignee?.[0]?.toUpperCase(),size:5}),n.jsx(f,{variant:"body-3",children:o.assignee})]}):n.jsx(f,{variant:"body-3",color:"neutral-faded",children:"Assign"})]}),n.jsxs(m,{direction:"column",gap:1,children:[n.jsx(f,{variant:"caption-1",color:"neutral-faded",children:"Labels"}),n.jsx(m,{direction:"row",gap:1,wrap:!0,children:(o.labels||[]).map(d=>n.jsx(dt,{size:"small",color:ir[d]||"neutral",children:d},d))})]}),n.jsxs(m,{direction:"column",gap:1,children:[n.jsx(f,{variant:"caption-1",color:"neutral-faded",children:"Project"}),n.jsx(f,{variant:"body-3",color:o.project?void 0:"neutral-faded",children:o.project||"Add to project"})]}),o.estimate&&n.jsxs(m,{direction:"column",gap:1,children:[n.jsx(f,{variant:"caption-1",color:"neutral-faded",children:"Estimate"}),n.jsxs(f,{variant:"body-3",children:[o.estimate," points"]})]})]})})})]})})]})})}):n.jsx(Ke,{defaultTheme:"reshaped",defaultColorMode:"dark",children:n.jsx(m,{backgroundColor:"page",minHeight:"100vh",padding:12,children:n.jsxs(m,{direction:"row",align:"start",gap:8,wrap:"no-wrap",children:[n.jsx(m.Item,{columns:2,children:n.jsx(Xe,{orgName:a,activePage:"Issues",userInfo:{name:i,role:c}})}),n.jsx(m.Item,{grow:!0,children:n.jsxs(m,{direction:"column",gap:4,align:"center",paddingBlock:16,children:[n.jsx(f,{variant:"featured-2",weight:"bold",children:"Issue not found"}),n.jsx(f,{variant:"body-3",color:"neutral-faded",children:"The issue you're looking for doesn't exist."}),n.jsx(Ve,{to:"/issues",children:"← Back to all issues"})]})})]})})})}const dr=Object.freeze(Object.defineProperty({__proto__:null,default:lr},Symbol.toStringTag,{value:"Module"})),ur="_issueRow_1cpdh_1",pr={issueRow:ur},mr={todo:"○",in_progress:"◐",done:"●",cancelled:"✕"},hr={Auth:"neutral",Backend:"critical",Feature:"primary",Bug:"critical",Security:"warning",Frontend:"primary",DevEx:"positive"},fr={title:"",description:"",status:"todo",priority:"medium",assignee:"",project:"",estimate:""},Ze=["title","description","status","priority","assignee","project","estimate"];function Ot(e){Ze.forEach(t=>ke(`${e}.${t}`))}function br({active:e,onClose:t,issueCount:r}){const[s]=N("draft.create.title"),o=Jt(),a=`FIL-${r+1}`,i=()=>{Ze.forEach(p=>{oe(`draft.create.${p}`,fr[p])})},c=()=>{if(!(s??"").trim())return;const p=s.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/(^-|-$)/g,"")||`new-issue-${r+1}`;Ze.forEach(l=>{const u=new URLSearchParams(window.location.hash.replace(/^#/,"")).get(`draft.create.${l}`)??"";oe(`record.issues.${p}.${l}`,u)}),oe(`record.issues.${p}.identifier`,a),Ot("draft.create"),t({reason:"save"}),o(`/issues/${p}`)},d=()=>{Ot("draft.create"),t({reason:"cancel"})};return n.jsxs(ne,{active:e,onClose:d,onOpen:i,size:"600px",padding:6,position:"center",children:[n.jsx(ne.Title,{children:"Create Issue"}),n.jsx(ne.Subtitle,{children:a}),n.jsxs(m,{direction:"column",gap:4,paddingTop:4,children:[n.jsx(yn,{prefix:"draft.create"}),n.jsxs(m,{direction:"row",justify:"end",gap:2,paddingTop:2,children:[n.jsx(ie,{variant:"outline",onClick:d,children:"Cancel"}),n.jsx(ie,{color:"primary",onClick:c,children:"Save"})]})]})]})}function gr(){const[e,t,r]=N("ui.createModal"),s=e==="true",o=_o("issues"),a=J("signup.organization.name"),i=J("signup.fullName"),c=J("signup.organization.role"),d=o.filter(l=>l.status!=="done"&&l.status!=="cancelled"),p=o.filter(l=>l.status==="done"||l.status==="cancelled");return n.jsx(Ke,{defaultTheme:"reshaped",defaultColorMode:"dark",children:n.jsx(m,{backgroundColor:"page",minHeight:"100vh",padding:12,children:n.jsxs(m,{direction:"row",align:"start",gap:8,wrap:"no-wrap",children:[n.jsx(m.Item,{columns:2,children:n.jsx(Xe,{orgName:a,activePage:"Issues",userInfo:{name:i,role:c}})}),n.jsx(m.Item,{grow:!0,children:n.jsxs(m,{direction:"column",gap:4,maxWidth:"900px",children:[n.jsxs(m,{direction:"row",justify:"space-between",align:"center",children:[n.jsx(f,{variant:"featured-2",weight:"bold",children:"Issues"}),n.jsxs(m,{direction:"row",gap:2,align:"center",children:[n.jsxs(dt,{color:"neutral",children:[o.length," total"]}),n.jsx(ie,{size:"small",color:"primary",onClick:()=>t("true"),children:"Create issue"})]})]}),n.jsx(br,{active:s,onClose:()=>r(),issueCount:o.length}),n.jsxs(m,{direction:"column",gap:0,children:[n.jsx(m,{paddingBlock:2,paddingInline:3,children:n.jsxs(f,{variant:"caption-1",color:"neutral-faded",weight:"medium",children:["Open · ",d.length]})}),n.jsx(K,{}),d.map(l=>n.jsx(Mt,{issue:l},l.id))]}),p.length>0&&n.jsxs(m,{direction:"column",gap:0,children:[n.jsx(m,{paddingBlock:2,paddingInline:3,children:n.jsxs(f,{variant:"caption-1",color:"neutral-faded",weight:"medium",children:["Closed · ",p.length]})}),n.jsx(K,{}),p.map(l=>n.jsx(Mt,{issue:l},l.id))]})]})})]})})})}function Mt({issue:e}){return n.jsxs(n.Fragment,{children:[n.jsx(Ve,{to:`/issues/${e.id}`,className:pr.issueRow,children:n.jsxs(m,{direction:"row",align:"center",gap:3,padding:3,children:[n.jsx(f,{variant:"body-3",color:"neutral-faded",attributes:{style:{minWidth:20}},children:mr[e.status]||"○"}),n.jsx(f,{variant:"caption-1",color:"neutral-faded",attributes:{style:{minWidth:50}},children:e.identifier}),n.jsx(m.Item,{grow:!0,children:n.jsx(f,{variant:"body-3",children:e.title})}),n.jsx(m,{direction:"row",gap:1,children:(e.labels||[]).map(t=>n.jsx(dt,{size:"small",color:hr[t]||"neutral",children:t},t))}),n.jsx(f,{variant:"caption-1",color:"neutral-faded",attributes:{style:{textTransform:"capitalize"}},children:e.priority})]})}),n.jsx(K,{})]})}const xr=Object.freeze(Object.defineProperty({__proto__:null,default:gr},Symbol.toStringTag,{value:"Module"}));var Y={route:[/^.*\/src\/pages\/|\.(jsx|tsx|mdx)$/g,""],splat:[/\[\.{3}\w+\]/g,"*"],param:[/\[([^\]]+)\]/g,":$1"],slash:[/^index$|\./g,"/"],optional:[/^-(:?[\w-]+|\*)/,"$1?"]},yr=e=>Object.keys(e).reduce((t,r)=>{const s=r.replace(...Y.route);return{...t,[s]:e[r]}},{}),vr=(e,t)=>Object.keys(e).filter(s=>!s.includes("/_")||/_layout\.(jsx|tsx)$/.test(s)).reduce((s,o)=>{const a=e[o],i={id:o.replace(...Y.route),...t(a,o)},c=o.replace(...Y.route).replace(...Y.splat).replace(...Y.param).split("/").filter(Boolean);return c.reduce((d,p,l)=>{const u=p.replace(...Y.slash).replace(...Y.optional),h=l===0,w=l===c.length-1&&c.length>1,x=!h&&!w,g=p==="_layout",S=/\([\w-]+\)/.test(u),y=/^\w|\//.test(u)?"unshift":"push";if(h&&c.length===1)return s.push({path:u,...i}),d;if(h||x){const E=h?s:d.children,_=E?.find(L=>L.path===u||L.id?.replace("/_layout","").split("/").pop()===u),$=S?i?.component?{id:u,path:"/"}:{id:u}:{path:u};return _?_.children??=[]:E?.[y]({...$,children:[]}),_||E?.[y==="unshift"?0:E.length-1]}return g?Object.assign(d,i):(w&&d?.children?.[y](i?.index?i:{path:u,...i}),d)},{}),s},[]),wr=e=>Object.keys(e).reduce((t,r)=>{const s=r.replace(...Y.route).replace(/\+|\([\w-]+\)\//g,"").replace(/(\/)?index/g,"").replace(/\./g,"/");return{...t,[`/${s}`]:e[r]?.default}},{}),jr=Object.assign({"/src/pages/_app.jsx":Po}),Cr=Object.assign({}),Sr=Object.assign({"/src/pages/Issues.jsx":Zo,"/src/pages/index.jsx":tr,"/src/pages/issues/[id].jsx":dr,"/src/pages/issues/index.jsx":xr}),vn=yr(jr),kr=wr(Cr),Er=vr(Sr,(e,t)=>{const r=/index\.(jsx|tsx|mdx)$/.test(t)&&!t.includes("pages/index")?{index:!0}:{},s=e?.default||j.Fragment;return{...r,Component:()=>e?.Pending?n.jsx(j.Suspense,{fallback:n.jsx(e.Pending,{}),children:n.jsx(s,{})}):n.jsx(s,{}),ErrorBoundary:e?.Catch,loader:e?.Loader,action:e?.Action}}),ae=vn?._app,Ir=vn?.["404"],_r=ae?.default||Kt,Lr=()=>{const e=kr[Bn().state?.modal]||j.Fragment;return n.jsx(e,{})},Qe=()=>n.jsxs(n.Fragment,{children:[n.jsx(_r,{})," ",n.jsx(Lr,{})]}),Rr=()=>ae?.Pending?n.jsx(j.Suspense,{fallback:n.jsx(ae.Pending,{}),children:n.jsx(Qe,{})}):n.jsx(Qe,{}),$r={Component:ae?.default?Rr:Qe,ErrorBoundary:ae?.Catch,loader:ae?.Loader},Pr={path:"*",Component:Ir?.default||j.Fragment},Ar=[{...$r,children:[...Er,Pr]}];const Tr="_container_m20cu_1",Nr="_buttonWrapper_m20cu_7",Or="_label_m20cu_12",Ge={container:Tr,buttonWrapper:Nr,label:Or};function Mr(){const{setDayScheme:e,setNightScheme:t,colorScheme:r}=On(),s=i=>{e(i),t(i)},o=[{name:"Light",value:"light",icon:St},{name:"Light colorblind",value:"light_colorblind",icon:St},{name:"Dark",value:"dark",icon:xe},{name:"Dark colorblind",value:"dark_colorblind",icon:xe},{name:"Dark high contrast",value:"dark_high_contrast",icon:xe},{name:"Dark Dimmed",value:"dark_dimmed",icon:xe}],a=o.find(i=>i.value===r);return n.jsx(ee,{padding:"normal",className:Ge.container,children:n.jsx(ee,{className:Ge.buttonWrapper,children:n.jsxs(Ue,{children:[n.jsxs(Ue.Button,{size:"small",children:[n.jsx(a.icon,{}),n.jsxs(ee,{className:Ge.label,children:[" ",a.name]})]}),n.jsx(Ue.Overlay,{align:"right",children:n.jsx(Fe,{showDividers:!0,children:n.jsx(Fe.Group,{selectionVariant:"single",children:o.map(i=>n.jsx(Fe.Item,{href:"#",selected:i.value===r,onSelect:()=>s(i.value),children:i.name},i.value))})})})]})})})}const gt="sb-comments-token",xt="sb-comments-user";function wn(){try{return localStorage.getItem(gt)}catch{return null}}function Dr(e){localStorage.setItem(gt,e)}function Hr(){localStorage.removeItem(gt),localStorage.removeItem(xt)}function yt(){try{const e=localStorage.getItem(xt);return e?JSON.parse(e):null}catch{return null}}async function zr(e){const t=await fetch("https://api.github.com/user",{headers:{Authorization:`bearer ${e}`}});if(!t.ok)throw new Error("Invalid token — GitHub returned "+t.status);const r=await t.json(),s={login:r.login,avatarUrl:r.avatar_url};return localStorage.setItem(xt,JSON.stringify(s)),s}function Re(){return wn()!==null}let Q=!1;const et=new Set;function we(){return Q}function Br(){return Le()?!Q&&!Re()?(console.warn("[storyboard] Sign in first to use comments"),!1):(Q=!Q,jn(),Q):(console.warn("[storyboard] Comments not enabled — check storyboard.config.json"),!1)}function Dt(e){Q=e,jn()}function Ur(e){return et.add(e),()=>et.delete(e)}function jn(){for(const e of et)e(Q)}const Ht=/<!--\s*sb-meta\s+(\{.*?\})\s*-->/;function tt(e){if(!e)return{meta:null,text:""};const t=e.match(Ht);if(!t)return{meta:null,text:e.trim()};try{const r=JSON.parse(t[1]),s=e.replace(Ht,"").trim();return{meta:r,text:s}}catch{return{meta:null,text:e.trim()}}}function nt(e,t){return`${`<!-- sb-meta ${JSON.stringify(e)} -->`}
${t}`}function Cn(e,t){const{meta:r,text:s}=tt(e),o={...r,...t};return nt(o,s)}const Fr="https://api.github.com/graphql";async function H(e,t={},r={}){const{retries:s=2}=r,o=wn();if(!o)throw new Error("Not authenticated — no GitHub PAT found. Please sign in.");let a;for(let i=0;i<=s;i++)try{const c=await fetch(Fr,{method:"POST",headers:{Authorization:`bearer ${o}`,"Content-Type":"application/json"},body:JSON.stringify({query:e,variables:t})});if(c.status===401)throw new Error("GitHub PAT is invalid or expired. Please sign in again.");if(!c.ok)throw new Error(`GitHub API error: ${c.status} ${c.statusText}`);const d=await c.json();if(d.errors?.length)throw new Error(`GraphQL error: ${d.errors.map(p=>p.message).join(", ")}`);return d.data}catch(c){if(a=c,c.message.includes("401")||c.message.includes("Not authenticated")||c.message.includes("invalid or expired"))throw c;i<s&&await new Promise(d=>setTimeout(d,1e3*(i+1)))}throw a}const qr=`
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
`,Wr=`
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
`,Yr=`
  mutation CreateDiscussion($repositoryId: ID!, $categoryId: ID!, $title: String!, $body: String!) {
    createDiscussion(input: { repositoryId: $repositoryId, categoryId: $categoryId, title: $title, body: $body }) {
      discussion {
        id
        title
        url
      }
    }
  }
`,Gr=`
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
`,Vr=`
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
`,Sn=`
  mutation UpdateComment($commentId: ID!, $body: String!) {
    updateDiscussionComment(input: { commentId: $commentId, body: $body }) {
      comment {
        id
        body
      }
    }
  }
`,Kr=`
  mutation AddReaction($subjectId: ID!, $content: ReactionContent!) {
    addReaction(input: { subjectId: $subjectId, content: $content }) {
      reaction {
        content
      }
    }
  }
`,Jr=`
  mutation RemoveReaction($subjectId: ID!, $content: ReactionContent!) {
    removeReaction(input: { subjectId: $subjectId, content: $content }) {
      reaction {
        content
      }
    }
  }
`,Xr=`
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
`;async function kn(e){const t=ft(),s=`"${`Comments: ${e}`}" in:title repo:${t.repo.owner}/${t.repo.name}`,a=(await H(qr,{query:s})).search?.nodes?.[0];if(!a)return null;const i=(a.comments?.nodes??[]).map(c=>{const{meta:d,text:p}=tt(c.body);return{...c,meta:d,text:p,replies:(c.replies?.nodes??[]).map(l=>{const{meta:u,text:h}=tt(l.body);return{...l,meta:u,text:h}})}});return{...a,comments:i}}async function En(){const e=ft(),t=e.discussions.category.toLowerCase().replace(/\s+/g,"-"),r=await H(Wr,{owner:e.repo.owner,name:e.repo.name,slug:t}),s=r.repository?.id;let o=r.repository?.discussionCategory?.id;if(o||(o=r.repository?.discussionCategories?.nodes?.find(i=>i.name===e.discussions.category)?.id),!s||!o)throw new Error(`Could not find repository or discussion category "${e.discussions.category}" in ${e.repo.owner}/${e.repo.name}`);return{repositoryId:s,categoryId:o}}async function Zr(e,t,r,s){let o=await kn(e);if(!o){const{repositoryId:c,categoryId:d}=await En(),p=`Comments: ${e}`,l=nt({route:e,createdAt:new Date().toISOString()},"");o=(await H(Yr,{repositoryId:c,categoryId:d,title:p,body:l})).createDiscussion.discussion}const a=nt({x:Math.round(t*10)/10,y:Math.round(r*10)/10},s);return(await H(Gr,{discussionId:o.id,body:a})).addDiscussionComment.comment}async function Qr(e,t,r){return(await H(Vr,{discussionId:e,replyToId:t,body:r})).addDiscussionComment.comment}async function es(e,t){const r=Cn(t,{resolved:!0});return(await H(Sn,{commentId:e,body:r})).updateDiscussionComment.comment}async function ts(e,t,r,s){const o=Cn(t,{x:Math.round(r*10)/10,y:Math.round(s*10)/10});return(await H(Sn,{commentId:e,body:o})).updateDiscussionComment.comment}async function ns(e,t){await H(Kr,{subjectId:e,content:t})}async function os(e,t){await H(Jr,{subjectId:e,content:t})}async function Es(){const e=ft(),{categoryId:t}=await En();return(await H(Xr,{owner:e.repo.owner,name:e.repo.name,categoryId:t})).repository?.discussions?.nodes??[]}const zt="sb-composer-style";function rs(){if(document.getElementById(zt))return;const e=document.createElement("style");e.id=zt,e.textContent=`
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
  `,document.head.appendChild(e)}function ss(e,t,r,s,o={}){rs();const a=yt(),i=document.createElement("div");i.className="sb-composer",i.style.left=`${t}%`,i.style.top=`${r}%`,i.style.transform="translate(12px, -50%)",i.innerHTML=`
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
  `,e.appendChild(i);const c=i.querySelector(".sb-composer-textarea"),d=i.querySelector('[data-action="submit"]');function p(){i.remove()}function l(){p(),o.onCancel?.()}async function u(){const h=c.value.trim();if(!h){c.focus();return}d.disabled=!0,d.textContent="Posting…";try{const w=await Zr(s,t,r,h);p(),o.onSubmit?.(w)}catch(w){d.disabled=!1,d.textContent="Comment",console.error("[storyboard] Failed to post comment:",w);let x=i.querySelector(".sb-composer-error");x||(x=document.createElement("div"),x.className="sb-composer-error",x.style.cssText="padding: 4px 12px 8px; font-size: 12px; color: #f85149;",i.querySelector(".sb-composer-footer").before(x)),x.textContent=w.message}}return i.querySelector('[data-action="cancel"]').addEventListener("click",l),d.addEventListener("click",u),c.addEventListener("keydown",h=>{h.key==="Enter"&&(h.metaKey||h.ctrlKey)&&(h.preventDefault(),u()),h.key==="Escape"&&(h.preventDefault(),h.stopPropagation(),l())}),i.addEventListener("click",h=>h.stopPropagation()),requestAnimationFrame(()=>c.focus()),{el:i,destroy:p}}const Bt="sb-auth-modal",Ut="sb-auth-modal-style";function as(){if(document.getElementById(Ut))return;const e=document.createElement("style");e.id=Ut,e.textContent=`
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
  `,document.head.appendChild(e)}function is(){return as(),new Promise(e=>{const t=document.getElementById(Bt);t&&t.remove();const r=document.createElement("div");r.id=Bt,r.className="sb-auth-backdrop";const s=document.createElement("div");s.className="sb-auth-modal",s.innerHTML=`
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
    `,r.appendChild(s),document.body.appendChild(r);const o=s.querySelector("#sb-auth-token-input"),a=s.querySelector('[data-action="submit"]'),i=s.querySelector('[data-slot="feedback"]');function c(l){r.remove(),e(l)}r.addEventListener("click",l=>{l.target===r&&c(null)}),s.querySelectorAll('[data-action="close"]').forEach(l=>{l.addEventListener("click",()=>c(null))});function d(l){l.key==="Escape"&&(l.preventDefault(),l.stopPropagation(),window.removeEventListener("keydown",d,!0),c(null))}window.addEventListener("keydown",d,!0);async function p(){const l=o.value.trim();if(!l){o.focus();return}a.disabled=!0,a.textContent="Validating…",i.innerHTML="";try{const u=await zr(l);Dr(l),i.innerHTML=`
          <div class="sb-auth-success">
            <img class="sb-auth-avatar" src="${u.avatarUrl}" alt="${u.login}" />
            <div class="sb-auth-user-info">
              ${u.login}
              <span>✓ Signed in</span>
            </div>
          </div>
        `,a.textContent="Done",a.disabled=!1,a.onclick=()=>{window.removeEventListener("keydown",d,!0),c(u)}}catch(u){i.innerHTML=`<div class="sb-auth-error">${u.message}</div>`,a.disabled=!1,a.textContent="Sign in"}}a.addEventListener("click",p),o.addEventListener("keydown",l=>{l.key==="Enter"&&p()}),requestAnimationFrame(()=>o.focus())})}function Is(){const e=yt();Hr(),console.log(`[storyboard] Signed out${e?` (was ${e.login})`:""}`)}const Ft="sb-comment-window-style",In={THUMBS_UP:"👍",THUMBS_DOWN:"👎",LAUGH:"😄",HOORAY:"🎉",CONFUSED:"😕",HEART:"❤️",ROCKET:"🚀",EYES:"👀"};function cs(){if(document.getElementById(Ft))return;const e=document.createElement("style");e.id=Ft,e.textContent=`
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
  `,document.head.appendChild(e)}function qt(e){return new Date(e).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"})}function Wt(e){const t=document.createElement("div");t.className=e.replies?"sb-comment-window-reactions":"sb-reply-reactions";function r(){t.innerHTML="";const s=e.reactionGroups??[];for(const a of s){if(a.users?.totalCount===0&&!a.viewerHasReacted)continue;const i=a.users?.totalCount??0;if(i===0)continue;const c=document.createElement("button");c.className="sb-reaction-pill",c.dataset.active=String(!!a.viewerHasReacted),c.innerHTML=`<span>${In[a.content]??a.content}</span><span>${i}</span>`,c.addEventListener("click",d=>{d.stopPropagation(),_n(e,a.content,a,r)}),t.appendChild(c)}const o=document.createElement("button");o.className="sb-reaction-add-btn",o.textContent="😀 +",o.addEventListener("click",a=>{a.stopPropagation(),ls(o,e,r)}),t.appendChild(o)}return r(),t}function ls(e,t,r){const s=e.querySelector(".sb-reaction-picker");if(s){s.remove();return}const o=document.createElement("div");o.className="sb-reaction-picker";for(const[i,c]of Object.entries(In)){const d=t.reactionGroups??[],p=d.some(u=>u.content===i&&u.viewerHasReacted),l=document.createElement("button");l.className="sb-reaction-picker-btn",l.dataset.active=String(p),l.textContent=c,l.addEventListener("click",u=>{u.stopPropagation();const h=d.find(w=>w.content===i);_n(t,i,h,r),o.remove()}),o.appendChild(l)}e.appendChild(o);function a(i){!o.contains(i.target)&&i.target!==e&&(o.remove(),document.removeEventListener("click",a,!0))}setTimeout(()=>document.addEventListener("click",a,!0),0)}async function _n(e,t,r,s){const o=r?.viewerHasReacted??!1;e.reactionGroups||(e.reactionGroups=[]),o&&r?(r.users={totalCount:Math.max(0,(r.users?.totalCount??1)-1)},r.viewerHasReacted=!1,r.users.totalCount===0&&(e.reactionGroups=e.reactionGroups.filter(a=>a.content!==t))):r?(r.users={totalCount:(r.users?.totalCount??0)+1},r.viewerHasReacted=!0):e.reactionGroups.push({content:t,users:{totalCount:1},viewerHasReacted:!0}),s();try{o?await os(e.id,t):await ns(e.id,t)}catch(a){console.error("[storyboard] Reaction toggle failed:",a)}}let q=null;function Ln(e,t,r,s={}){cs(),q&&(q.destroy(),q=null);const o=yt(),a=document.createElement("div");a.className="sb-comment-window",a.style.left=`${t.meta?.x??0}%`,a.style.top=`${t.meta?.y??0}%`,a.style.transform="translate(12px, -50%)";const i=document.createElement("div");i.className="sb-comment-window-header";const c=document.createElement("div");if(c.className="sb-comment-window-header-left",t.author?.avatarUrl){const b=document.createElement("img");b.className="sb-comment-window-avatar",b.src=t.author.avatarUrl,b.alt=t.author.login??"",c.appendChild(b)}const d=document.createElement("span");if(d.className="sb-comment-window-author",d.textContent=t.author?.login??"unknown",c.appendChild(d),t.createdAt){const b=document.createElement("span");b.className="sb-comment-window-time",b.textContent=qt(t.createdAt),c.appendChild(b)}i.appendChild(c);const p=document.createElement("div");p.className="sb-comment-window-header-actions";const l=document.createElement("button");l.className="sb-comment-window-action-btn",l.setAttribute("aria-label",t.meta?.resolved?"Resolved":"Resolve"),l.title=t.meta?.resolved?"Resolved":"Resolve",l.textContent=t.meta?.resolved?"Resolved":"Resolve",t.meta?.resolved&&(l.dataset.resolved="true"),l.addEventListener("click",async b=>{if(b.stopPropagation(),!t.meta?.resolved){l.dataset.resolved="true",l.textContent="Resolved",l.title="Resolved";try{await es(t.id,t._rawBody??t.body??""),t.meta={...t.meta,resolved:!0},s.onMove?.()}catch(v){console.error("[storyboard] Failed to resolve comment:",v),l.dataset.resolved="false",l.textContent="Resolve",l.title="Resolve"}}}),p.appendChild(l);const u=document.createElement("button");u.className="sb-comment-window-action-btn",u.setAttribute("aria-label","Copy link"),u.title="Copy link",u.textContent="Copy link",u.addEventListener("click",b=>{b.stopPropagation();const v=new URL(window.location.href);v.searchParams.set("comment",t.id),navigator.clipboard.writeText(v.toString()).then(()=>{u.dataset.copied="true",u.textContent="Copied!",u.title="Copied!",setTimeout(()=>{u.dataset.copied="false",u.textContent="Copy link",u.title="Copy link"},2e3)}).catch(()=>{const C=document.createElement("input");C.value=v.toString(),document.body.appendChild(C),C.select(),document.execCommand("copy"),C.remove()})}),p.appendChild(u);const h=document.createElement("button");h.className="sb-comment-window-close",h.innerHTML="×",h.setAttribute("aria-label","Close"),h.addEventListener("click",b=>{b.stopPropagation(),B()}),p.appendChild(h),i.appendChild(p),a.appendChild(i);const w=document.createElement("div");w.className="sb-comment-window-body";const x=document.createElement("p");x.className="sb-comment-window-text",x.textContent=t.text??"",w.appendChild(x),w.appendChild(Wt(t));const g=t.replies??[];if(g.length>0){const b=document.createElement("div");b.className="sb-comment-window-replies";const v=document.createElement("div");v.className="sb-comment-window-replies-label",v.textContent=`${g.length} ${g.length===1?"Reply":"Replies"}`,b.appendChild(v);for(const C of g){const k=document.createElement("div");if(k.className="sb-reply-item",C.author?.avatarUrl){const M=document.createElement("img");M.className="sb-reply-avatar",M.src=C.author.avatarUrl,M.alt=C.author.login??"",k.appendChild(M)}const P=document.createElement("div");P.className="sb-reply-content";const I=document.createElement("div");I.className="sb-reply-meta";const T=document.createElement("span");if(T.className="sb-reply-author",T.textContent=C.author?.login??"unknown",I.appendChild(T),C.createdAt){const M=document.createElement("span");M.className="sb-reply-time",M.textContent=qt(C.createdAt),I.appendChild(M)}P.appendChild(I);const U=document.createElement("p");U.className="sb-reply-text",U.textContent=C.text??C.body??"",P.appendChild(U),P.appendChild(Wt(C)),k.appendChild(P),b.appendChild(k)}w.appendChild(b)}if(a.appendChild(w),o&&r){const b=document.createElement("div");b.className="sb-comment-window-reply-form";const v=document.createElement("textarea");v.className="sb-reply-textarea",v.placeholder="Reply…",b.appendChild(v);const C=document.createElement("div");C.className="sb-reply-form-actions";const k=document.createElement("button");k.className="sb-reply-submit-btn",k.textContent="Reply",k.disabled=!0,v.addEventListener("input",()=>{k.disabled=!v.value.trim()});async function P(){const I=v.value.trim();if(I){k.disabled=!0,k.textContent="Posting…";try{await Qr(r.id,t.id,I),v.value="",k.textContent="Reply",s.onMove?.()}catch(T){console.error("[storyboard] Failed to post reply:",T),k.textContent="Reply",k.disabled=!1}}}k.addEventListener("click",P),v.addEventListener("keydown",I=>{I.key==="Enter"&&(I.metaKey||I.ctrlKey)&&(I.preventDefault(),P()),I.key==="Escape"&&(I.preventDefault(),I.stopPropagation())}),C.appendChild(k),b.appendChild(C),a.appendChild(b)}let S=!1,y=0,E=0,_=0,$=0;function L(b){if(b.target.closest(".sb-comment-window-header-actions"))return;S=!0,y=b.clientX,E=b.clientY;const v=e.getBoundingClientRect();_=parseFloat(a.style.left)/100*v.width,$=parseFloat(a.style.top)/100*v.height,document.addEventListener("mousemove",W),document.addEventListener("mouseup",z),b.preventDefault()}function W(b){if(!S)return;const v=b.clientX-y,C=b.clientY-E,k=e.getBoundingClientRect(),P=_+v,I=$+C,T=Math.round(P/k.width*1e3)/10,U=Math.round(I/k.height*1e3)/10;a.style.left=`${T}%`,a.style.top=`${U}%`}async function z(b){if(!S)return;S=!1,document.removeEventListener("mousemove",W),document.removeEventListener("mouseup",z);const v=e.getBoundingClientRect(),C=b.clientX-y,k=b.clientY-E,P=_+C,I=$+k,T=Math.round(P/v.width*1e3)/10,U=Math.round(I/v.height*1e3)/10;if(Math.abs(C)>2||Math.abs(k)>2){t.meta={...t.meta,x:T,y:U};const M=e.querySelectorAll(".sb-comment-pin");for(const ce of M)if(ce._commentId===t.id){ce.style.left=`${T}%`,ce.style.top=`${U}%`;break}try{await ts(t.id,t._rawBody??"",T,U),t._rawBody=null}catch(ce){console.error("[storyboard] Failed to move comment:",ce)}}}i.addEventListener("mousedown",L),a.addEventListener("click",b=>b.stopPropagation());const X=new URL(window.location.href);X.searchParams.set("comment",t.id),window.history.replaceState(null,"",X.toString()),e.appendChild(a);function B(){document.removeEventListener("mousemove",W),document.removeEventListener("mouseup",z),a.remove(),q?.el===a&&(q=null);const b=new URL(window.location.href);b.searchParams.delete("comment"),window.history.replaceState(null,"",b.toString()),s.onClose?.()}return q={el:a,destroy:B},{el:a,destroy:B}}function Rn(){q&&(q.destroy(),q=null)}const ds='<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="none" stroke="%23fff" stroke-width="1.5" d="M19.503 9.97c1.204.489 1.112 2.224-.137 2.583l-6.305 1.813l-2.88 5.895c-.571 1.168-2.296.957-2.569-.314L4.677 6.257A1.369 1.369 0 0 1 6.53 4.7z" clip-rule="evenodd"/></svg>',Yt="sb-comment-mode-style";function us(){if(document.getElementById(Yt))return;const e=document.createElement("style");e.id=Yt,e.textContent=`
    .sb-comment-mode {
      cursor: url("data:image/svg+xml,${ds}") 4 2, crosshair;
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
  `,document.head.appendChild(e)}let V=null,G=null,A=null,ot=[],$e=null;function vt(){return document.querySelector("main")||document.body}function He(){if(G)return G;const e=vt();return getComputedStyle(e).position==="static"&&(e.style.position="relative"),G=document.createElement("div"),G.className="sb-comment-overlay",e.appendChild(G),G}function ps(){V||(V=document.createElement("div"),V.className="sb-comment-mode-banner",V.innerHTML="Comment mode — click to place a comment. Press <kbd>C</kbd> or <kbd>Esc</kbd> to exit.",document.body.appendChild(V))}function ms(){V&&(V.remove(),V=null)}function $n(){return window.location.pathname}function wt(){for(const e of ot)e.remove();ot=[]}function Pn(e,t,r){const s=document.createElement("div");s.className="sb-comment-pin",s.style.left=`${t.meta?.x??0}%`,s.style.top=`${t.meta?.y??0}%`;const o=r*137.5%360;if(s.style.setProperty("--pin-hue",String(Math.round(o))),t.author?.avatarUrl){const a=document.createElement("img");a.src=t.author.avatarUrl,a.alt=t.author.login??"",s.appendChild(a)}return t.meta?.resolved&&s.setAttribute("data-resolved","true"),s.title=`${t.author?.login??"unknown"}: ${t.text?.slice(0,80)??""}`,s._commentId=t.id,t._rawBody=t.body,s.addEventListener("click",a=>{a.stopPropagation(),A&&(A.destroy(),A=null),Ln(e,t,$e,{onClose:()=>{},onMove:()=>ze()})}),e.appendChild(s),ot.push(s),s}function An(){if(!$e?.comments?.length)return;const e=He();wt(),$e.comments.forEach((t,r)=>{t.meta?.x!=null&&t.meta?.y!=null&&Pn(e,t,r)})}async function ze(){if(!Re())return;const e=He();An();try{const t=await kn($n());if($e=t,wt(),!t?.comments?.length)return;t.comments.forEach((r,s)=>{r.meta?.x!=null&&r.meta?.y!=null&&Pn(e,r,s)}),hs(e,t)}catch(t){console.warn("[storyboard] Could not load comments:",t.message)}}function hs(e,t){const r=new URLSearchParams(window.location.search).get("comment");if(!r||!t?.comments?.length)return;const s=t.comments.find(o=>o.id===r);if(s){if(s.meta?.y!=null){const o=vt(),a=s.meta.y/100*o.scrollHeight,i=o.scrollTop||window.scrollY,c=i+window.innerHeight;if(a<i||a>c){const d=Math.max(0,a-window.innerHeight/3);window.scrollTo({top:d,behavior:"smooth"})}}s._rawBody=s.body,Ln(e,s,t,{onClose:()=>{},onMove:()=>ze()})}}function fs(e){if(!we()||e.target.closest(".sb-composer")||e.target.closest(".sb-comment-pin")||e.target.closest(".sb-comment-window"))return;Rn(),A&&(A.destroy(),A=null);const t=vt(),r=t.getBoundingClientRect(),s=Math.round((e.clientX-r.left)/r.width*1e3)/10,o=Math.round((e.clientY-r.top+t.scrollTop)/t.scrollHeight*1e3)/10,a=He();A=ss(a,s,o,$n(),{onCancel:()=>{A=null},onSubmit:()=>{A=null,ze()}})}function bs(e){e?(document.body.classList.add("sb-comment-mode"),ps(),He().classList.add("active"),An(),ze()):(document.body.classList.remove("sb-comment-mode"),ms(),A&&(A.destroy(),A=null),Rn(),wt(),G&&G.classList.remove("active"))}let Gt=!1;function gs(){Gt||(Gt=!0,us(),Ur(bs),document.addEventListener("click",e=>{we()&&(e.target.closest(".sb-devtools-wrapper")||e.target.closest(".sb-auth-backdrop")||e.target.closest(".sb-comments-drawer")||e.target.closest(".sb-comments-drawer-backdrop")||fs(e))}),window.addEventListener("keydown",e=>{const t=e.target.tagName;if(!(t==="INPUT"||t==="TEXTAREA"||t==="SELECT"||e.target.isContentEditable)){if(e.key==="c"&&!e.metaKey&&!e.ctrlKey&&!e.altKey){if(!Le())return;if(e.preventDefault(),!we()&&!Re()){is();return}Br()}e.key==="Escape"&&we()&&(e.preventDefault(),Dt(!1))}}),Le()&&Re()&&new URLSearchParams(window.location.search).get("comment")&&Dt(!0))}const xs={repo:{owner:"YOUR_GITHUB_USERNAME",name:"YOUR_REPO_NAME"},discussions:{category:"General"}},ys={comments:xs},Tn=Un(Ar,{basename:"/storyboard/"});Lo(Tn,"/storyboard/");oo();to();io(ys);bo({basePath:"/storyboard/"});gs();const vs=document.getElementById("root"),ws=Mn.createRoot(vs);ws.render(n.jsx(j.StrictMode,{children:n.jsx(Dn,{colorMode:"auto",children:n.jsxs(Hn,{children:[n.jsx(Mr,{}),n.jsx(Fn,{router:Tn})]})})}));export{Is as a,kn as f,Re as i,Es as l,is as o,Dt as s,Br as t};

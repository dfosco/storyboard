var z=Object.defineProperty;var n=(t,e)=>z(t,"name",{value:e,configurable:!0});import{M as g,L as _,ae as B}from"./index-CqNBTU66.js";const S="sb-comments-token",b="sb-comments-user",K="https://api.github.com/graphql";function w(){try{return localStorage.getItem(S)}catch{return null}}n(w,"getToken");function A(t){localStorage.setItem(S,t)}n(A,"setToken");function O(){localStorage.removeItem(S),localStorage.removeItem(b)}n(O,"clearToken");function M(){try{const t=localStorage.getItem(b);return t?JSON.parse(t):null}catch{return null}}n(M,"getCachedUser");async function x(t){const e=await fetch("https://api.github.com/user",{headers:{Authorization:`bearer ${t}`}});if(!e.ok)throw new Error("Invalid token — GitHub returned "+e.status);const o=await e.json(),s=(e.headers.get("x-oauth-scopes")||"").split(",").map(a=>a.trim()).filter(Boolean),r={login:o.login,avatarUrl:o.avatar_url,scopes:s};return await Y(t),localStorage.setItem(b,JSON.stringify(r)),r}n(x,"validateToken");async function Y(t){const e=g();if(!e)return;const{owner:o,name:s}=e.repo;if(!o||!s)return;const r=`query { repository(owner: "${o}", name: "${s}") { id discussionCategories(first: 1) { nodes { id } } } }`,a=await fetch(K,{method:"POST",headers:{Authorization:`bearer ${t}`,"Content-Type":"application/json"},body:JSON.stringify({query:r})});if(a.status===401)throw new Error("Token is invalid or expired.");if(!a.ok)throw new Error(`GitHub API error: ${a.status}`);const c=await a.json();if(c.errors?.length){const i=c.errors.map(d=>d.message).join(", ");throw i.includes("not accessible")||i.includes("insufficient")?new Error(`Token doesn't have access to ${o}/${s} discussions. Fine-grained tokens need "Discussions: Read and write". Classic tokens need the "repo" scope.`):new Error(`GitHub API error: ${i}`)}if(!c.data?.repository)throw new Error(`Repository ${o}/${s} not found. Check that the token has access to this repository.`);if(!c.data.repository.discussionCategories?.nodes?.length)throw new Error(`No discussion categories found in ${o}/${s}. Enable Discussions in the repository settings.`)}n(Y,"validateTokenPermissions");function D(){return w()!==null}n(D,"isAuthenticated");const Ot=Object.freeze(Object.defineProperty({__proto__:null,clearToken:O,getCachedUser:M,getToken:w,isAuthenticated:D,setToken:A,validateToken:x},Symbol.toStringTag,{value:"Module"}));let y=!1;const $=new Set;function N(){return y}n(N,"isCommentModeActive");function G(){return _()?!y&&!D()?(console.warn("[storyboard] Sign in first to use comments"),!1):(y=!y,U(),y):(console.warn("[storyboard] Comments not enabled — check storyboard.config.json"),!1)}n(G,"toggleCommentMode");function P(t){y=t,U()}n(P,"setCommentMode");function j(t){return $.add(t),()=>$.delete(t)}n(j,"subscribeToCommentMode");function U(){for(const t of $)t(y)}n(U,"_notify");const Mt=Object.freeze(Object.defineProperty({__proto__:null,isCommentModeActive:N,setCommentMode:P,subscribeToCommentMode:j,toggleCommentMode:G},Symbol.toStringTag,{value:"Module"})),F="https://api.github.com/graphql";async function u(t,e={},o={}){const{retries:s=2}=o,r=w();if(!r)throw new Error("Not authenticated — no GitHub PAT found. Please sign in.");let a;for(let c=0;c<=s;c++)try{const i=await fetch(F,{method:"POST",headers:{Authorization:`bearer ${r}`,"Content-Type":"application/json"},body:JSON.stringify({query:t,variables:e})});if(i.status===401)throw new Error("GitHub PAT is invalid or expired. Please sign in again.");if(!i.ok)throw new Error(`GitHub API error: ${i.status} ${i.statusText}`);const d=await i.json();if(d.errors?.length)throw new Error(`GraphQL error: ${d.errors.map(l=>l.message).join(", ")}`);return d.data}catch(i){if(a=i,i.message.includes("401")||i.message.includes("Not authenticated")||i.message.includes("invalid or expired"))throw i;c<s&&await new Promise(d=>setTimeout(d,1e3*(c+1)))}throw a}n(u,"graphql");const R=/<!--\s*sb-meta\s+(\{.*?\})\s*-->/;function m(t){if(!t)return{meta:null,text:""};const e=t.match(R);if(!e)return{meta:null,text:t.trim()};try{const o=JSON.parse(e[1]),s=t.replace(R,"").trim();return{meta:o,text:s}}catch{return{meta:null,text:t.trim()}}}n(m,"parseMetadata");function f(t,e){return`${`<!-- sb-meta ${JSON.stringify(t)} -->`}
${e}`}n(f,"serializeMetadata");function H(t,e){const{meta:o,text:s}=m(t),r={...o,...e};return f(r,s)}n(H,"updateMetadata");const Q=`
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
`,X=`
  query SearchDiscussionLightweight($query: String!) {
    search(query: $query, type: DISCUSSION, first: 1) {
      nodes {
        ... on Discussion {
          id
          title
          url
          comments(first: 100) {
            nodes {
              id
              body
              author {
                login
                avatarUrl
              }
            }
          }
        }
      }
    }
  }
`,W=`
  query GetCommentDetail($id: ID!) {
    node(id: $id) {
      ... on DiscussionComment {
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
`,V=`
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
`,Z=`
  mutation CreateDiscussion($repositoryId: ID!, $categoryId: ID!, $title: String!, $body: String!) {
    createDiscussion(input: { repositoryId: $repositoryId, categoryId: $categoryId, title: $title, body: $body }) {
      discussion {
        id
        title
        url
      }
    }
  }
`,tt=`
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
`,et=`
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
`,p=`
  mutation UpdateComment($commentId: ID!, $body: String!) {
    updateDiscussionComment(input: { commentId: $commentId, body: $body }) {
      comment {
        id
        body
      }
    }
  }
`,ot=`
  mutation DeleteComment($commentId: ID!) {
    deleteDiscussionComment(input: { id: $commentId }) {
      comment {
        id
      }
    }
  }
`,nt=`
  mutation AddReaction($subjectId: ID!, $content: ReactionContent!) {
    addReaction(input: { subjectId: $subjectId, content: $content }) {
      reaction {
        content
      }
    }
  }
`,st=`
  mutation RemoveReaction($subjectId: ID!, $content: ReactionContent!) {
    removeReaction(input: { subjectId: $subjectId, content: $content }) {
      reaction {
        content
      }
    }
  }
`;async function q(t){const e=g(),s=`"${`Comments: ${t}`}" in:title repo:${e.repo.owner}/${e.repo.name}`,a=(await u(Q,{query:s})).search?.nodes?.[0];if(!a)return null;const c=(a.comments?.nodes??[]).map(i=>{const{meta:d,text:l}=m(i.body);return{...i,meta:d,text:l,replies:(i.replies?.nodes??[]).map(h=>{const{meta:v,text:L}=m(h.body);return{...h,meta:v,text:L}})}});return{...a,comments:c}}n(q,"fetchRouteDiscussion");async function rt(t){const e=g(),s=`"${`Comments: ${t}`}" in:title repo:${e.repo.owner}/${e.repo.name}`,a=(await u(X,{query:s})).search?.nodes?.[0];if(!a)return null;const c=(a.comments?.nodes??[]).map(i=>{const{meta:d,text:l}=m(i.body);return{...i,meta:d,text:l}});return{...a,comments:c}}n(rt,"fetchRouteCommentsSummary");async function at(t){const o=(await u(W,{id:t})).node;if(!o)return null;const{meta:s,text:r}=m(o.body),a=(o.replies?.nodes??[]).map(c=>{const{meta:i,text:d}=m(c.body);return{...c,meta:i,text:d}});return{...o,meta:s,text:r,replies:a}}n(at,"fetchCommentDetail");async function it(){const t=g(),e=t.discussions.category.toLowerCase().replace(/\s+/g,"-"),o=await u(V,{owner:t.repo.owner,name:t.repo.name,slug:e}),s=o.repository?.id;let r=o.repository?.discussionCategory?.id;if(r||(r=o.repository?.discussionCategories?.nodes?.find(c=>c.name===t.discussions.category)?.id),!s||!r)throw new Error(`Could not find repository or discussion category "${t.discussions.category}" in ${t.repo.owner}/${t.repo.name}`);return{repositoryId:s,categoryId:r}}n(it,"getRepoAndCategoryIds");async function ct(t,e,o,s){let r=await q(t);if(!r){const{repositoryId:i,categoryId:d}=await it(),l=`Comments: ${t}`,h=f({route:t,createdAt:new Date().toISOString()},"");r=(await u(Z,{repositoryId:i,categoryId:d,title:l,body:h})).createDiscussion.discussion}const a=f({x:Math.round(e*10)/10,y:Math.round(o*10)/10},s);return(await u(tt,{discussionId:r.id,body:a})).addDiscussionComment.comment}n(ct,"createComment");async function ut(t,e,o){return(await u(et,{discussionId:t,replyToId:e,body:o})).addDiscussionComment.comment}n(ut,"replyToComment");async function dt(t,e){const{meta:o,text:s}=m(e),r={...o,resolved:!0},a=s.startsWith("(Resolved) ")?s:`(Resolved) ${s}`,c=f(r,a);return(await u(p,{commentId:t,body:c})).updateDiscussionComment.comment}n(dt,"resolveComment");async function mt(t,e){const{meta:o,text:s}=m(e),r={...o};delete r.resolved;const a=s.replace(/^\(Resolved\)\s*/,""),c=f(r,a);return(await u(p,{commentId:t,body:c})).updateDiscussionComment.comment}n(mt,"unresolveComment");async function lt(t,e,o){const{meta:s}=m(e),r=s?f(s,o):o;return(await u(p,{commentId:t,body:r})).updateDiscussionComment.comment}n(lt,"editComment");async function yt(t,e){return(await u(p,{commentId:t,body:e})).updateDiscussionComment.comment}n(yt,"editReply");async function ft(t,e,o,s){const r=H(e,{x:Math.round(o*10)/10,y:Math.round(s*10)/10});return(await u(p,{commentId:t,body:r})).updateDiscussionComment.comment}n(ft,"moveComment");async function gt(t){await u(ot,{commentId:t})}n(gt,"deleteComment");async function pt(t,e){await u(nt,{subjectId:t,content:e})}n(pt,"addReaction");async function ht(t,e){await u(st,{subjectId:t,content:e})}n(ht,"removeReaction");const I="sb-comments:",It=120*1e3;function Ct(t){try{const e=localStorage.getItem(I+t);if(!e)return null;const o=JSON.parse(e);return Date.now()-o.ts>It?(localStorage.removeItem(I+t),null):o.data}catch{return null}}n(Ct,"getCachedComments");function wt(t,e){try{localStorage.setItem(I+t,JSON.stringify({ts:Date.now(),data:e}))}catch{}}n(wt,"setCachedComments");function $t(t){try{localStorage.removeItem(I+t)}catch{}}n($t,"clearCachedComments");const C="sb-pending-comments:";function St(t,e){try{const o=E(t),s=o.findIndex(r=>r.id===e.id);s>=0?o[s]=e:o.push(e),localStorage.setItem(C+t,JSON.stringify(o))}catch{}}n(St,"savePendingComment");function E(t){try{const e=localStorage.getItem(C+t);return e?JSON.parse(e):[]}catch{return[]}}n(E,"getPendingComments");function bt(t,e){try{const o=E(t).filter(s=>s.id!==e);o.length>0?localStorage.setItem(C+t,JSON.stringify(o)):localStorage.removeItem(C+t)}catch{}}n(bt,"removePendingComment");const k="sb-comment-drafts";function T(){try{return JSON.parse(localStorage.getItem(k)||"{}")}catch{return{}}}n(T,"readDrafts");function J(t){try{localStorage.setItem(k,JSON.stringify(t))}catch{}}n(J,"writeDrafts");function Dt(t,e){const o=T();o[t]=e,J(o)}n(Dt,"saveDraft");function Et(t){return T()[t]??null}n(Et,"getDraft");function Tt(t){const e=T();delete e[t],J(e)}n(Tt,"clearDraft");function vt(t){return`comment:${t}`}n(vt,"composerDraftKey");function Rt(t){return`reply:${t}`}n(Rt,"replyDraftKey");const xt=Object.freeze(Object.defineProperty({__proto__:null,addReaction:pt,clearCachedComments:$t,clearDraft:Tt,clearToken:O,composerDraftKey:vt,createComment:ct,deleteComment:gt,editComment:lt,editReply:yt,fetchCommentDetail:at,fetchRouteCommentsSummary:rt,fetchRouteDiscussion:q,getCachedComments:Ct,getCachedUser:M,getCommentsConfig:g,getDraft:Et,getPendingComments:E,getToken:w,graphql:u,initCommentsConfig:B,isAuthenticated:D,isCommentModeActive:N,isCommentsEnabled:_,moveComment:ft,parseMetadata:m,removePendingComment:bt,removeReaction:ht,replyDraftKey:Rt,replyToComment:ut,resolveComment:dt,saveDraft:Dt,savePendingComment:St,serializeMetadata:f,setCachedComments:wt,setCommentMode:P,setToken:A,subscribeToCommentMode:j,toggleCommentMode:G,unresolveComment:mt,updateMetadata:H,validateToken:x},Symbol.toStringTag,{value:"Module"}));export{$t as A,ft as B,St as C,Ot as D,Mt as E,xt as F,D as a,Dt as b,vt as c,Tt as d,M as e,dt as f,Et as g,lt as h,N as i,ht as j,pt as k,ut as l,yt as m,gt as n,P as o,Ct as p,rt as q,Rt as r,j as s,G as t,mt as u,wt as v,at as w,E as x,ct as y,bt as z};

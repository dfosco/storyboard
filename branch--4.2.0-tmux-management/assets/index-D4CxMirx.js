var z=Object.defineProperty;var o=(t,e)=>z(t,"name",{value:e,configurable:!0});import{I as g,H as _,R as B}from"./index-0fOFFOL4.js";const S="sb-comments-token",b="sb-comments-user",K="https://api.github.com/graphql";function w(){try{return localStorage.getItem(S)}catch{return null}}o(w,"getToken");function A(t){localStorage.setItem(S,t)}o(A,"setToken");function O(){localStorage.removeItem(S),localStorage.removeItem(b)}o(O,"clearToken");function M(){try{const t=localStorage.getItem(b);return t?JSON.parse(t):null}catch{return null}}o(M,"getCachedUser");async function N(t){const e=await fetch("https://api.github.com/user",{headers:{Authorization:`bearer ${t}`}});if(!e.ok)throw new Error("Invalid token — GitHub returned "+e.status);const n=await e.json(),s={login:n.login,avatarUrl:n.avatar_url};return await Y(t),localStorage.setItem(b,JSON.stringify(s)),s}o(N,"validateToken");async function Y(t){const e=g();if(!e)return;const{owner:n,name:s}=e.repo;if(!n||!s)return;const r=`query { repository(owner: "${n}", name: "${s}") { id discussionCategories(first: 1) { nodes { id } } } }`,i=await fetch(K,{method:"POST",headers:{Authorization:`bearer ${t}`,"Content-Type":"application/json"},body:JSON.stringify({query:r})});if(i.status===401)throw new Error("Token is invalid or expired.");if(!i.ok)throw new Error(`GitHub API error: ${i.status}`);const c=await i.json();if(c.errors?.length){const a=c.errors.map(d=>d.message).join(", ");throw a.includes("not accessible")||a.includes("insufficient")?new Error(`Token doesn't have access to ${n}/${s} discussions. Fine-grained tokens need "Discussions: Read and write". Classic tokens need the "repo" scope.`):new Error(`GitHub API error: ${a}`)}if(!c.data?.repository)throw new Error(`Repository ${n}/${s} not found. Check that the token has access to this repository.`);if(!c.data.repository.discussionCategories?.nodes?.length)throw new Error(`No discussion categories found in ${n}/${s}. Enable Discussions in the repository settings.`)}o(Y,"validateTokenPermissions");function D(){return w()!==null}o(D,"isAuthenticated");const Ot=Object.freeze(Object.defineProperty({__proto__:null,clearToken:O,getCachedUser:M,getToken:w,isAuthenticated:D,setToken:A,validateToken:N},Symbol.toStringTag,{value:"Module"}));let y=!1;const $=new Set;function x(){return y}o(x,"isCommentModeActive");function G(){return _()?!y&&!D()?(console.warn("[storyboard] Sign in first to use comments"),!1):(y=!y,U(),y):(console.warn("[storyboard] Comments not enabled — check storyboard.config.json"),!1)}o(G,"toggleCommentMode");function P(t){y=t,U()}o(P,"setCommentMode");function j(t){return $.add(t),()=>$.delete(t)}o(j,"subscribeToCommentMode");function U(){for(const t of $)t(y)}o(U,"_notify");const Mt=Object.freeze(Object.defineProperty({__proto__:null,isCommentModeActive:x,setCommentMode:P,subscribeToCommentMode:j,toggleCommentMode:G},Symbol.toStringTag,{value:"Module"})),F="https://api.github.com/graphql";async function u(t,e={},n={}){const{retries:s=2}=n,r=w();if(!r)throw new Error("Not authenticated — no GitHub PAT found. Please sign in.");let i;for(let c=0;c<=s;c++)try{const a=await fetch(F,{method:"POST",headers:{Authorization:`bearer ${r}`,"Content-Type":"application/json"},body:JSON.stringify({query:t,variables:e})});if(a.status===401)throw new Error("GitHub PAT is invalid or expired. Please sign in again.");if(!a.ok)throw new Error(`GitHub API error: ${a.status} ${a.statusText}`);const d=await a.json();if(d.errors?.length)throw new Error(`GraphQL error: ${d.errors.map(l=>l.message).join(", ")}`);return d.data}catch(a){if(i=a,a.message.includes("401")||a.message.includes("Not authenticated")||a.message.includes("invalid or expired"))throw a;c<s&&await new Promise(d=>setTimeout(d,1e3*(c+1)))}throw i}o(u,"graphql");const R=/<!--\s*sb-meta\s+(\{.*?\})\s*-->/;function m(t){if(!t)return{meta:null,text:""};const e=t.match(R);if(!e)return{meta:null,text:t.trim()};try{const n=JSON.parse(e[1]),s=t.replace(R,"").trim();return{meta:n,text:s}}catch{return{meta:null,text:t.trim()}}}o(m,"parseMetadata");function f(t,e){return`${`<!-- sb-meta ${JSON.stringify(t)} -->`}
${e}`}o(f,"serializeMetadata");function H(t,e){const{meta:n,text:s}=m(t),r={...n,...e};return f(r,s)}o(H,"updateMetadata");const Q=`
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
`,nt=`
  mutation DeleteComment($commentId: ID!) {
    deleteDiscussionComment(input: { id: $commentId }) {
      comment {
        id
      }
    }
  }
`,ot=`
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
`;async function q(t){const e=g(),s=`"${`Comments: ${t}`}" in:title repo:${e.repo.owner}/${e.repo.name}`,i=(await u(Q,{query:s})).search?.nodes?.[0];if(!i)return null;const c=(i.comments?.nodes??[]).map(a=>{const{meta:d,text:l}=m(a.body);return{...a,meta:d,text:l,replies:(a.replies?.nodes??[]).map(h=>{const{meta:v,text:L}=m(h.body);return{...h,meta:v,text:L}})}});return{...i,comments:c}}o(q,"fetchRouteDiscussion");async function rt(t){const e=g(),s=`"${`Comments: ${t}`}" in:title repo:${e.repo.owner}/${e.repo.name}`,i=(await u(X,{query:s})).search?.nodes?.[0];if(!i)return null;const c=(i.comments?.nodes??[]).map(a=>{const{meta:d,text:l}=m(a.body);return{...a,meta:d,text:l}});return{...i,comments:c}}o(rt,"fetchRouteCommentsSummary");async function at(t){const n=(await u(W,{id:t})).node;if(!n)return null;const{meta:s,text:r}=m(n.body),i=(n.replies?.nodes??[]).map(c=>{const{meta:a,text:d}=m(c.body);return{...c,meta:a,text:d}});return{...n,meta:s,text:r,replies:i}}o(at,"fetchCommentDetail");async function it(){const t=g(),e=t.discussions.category.toLowerCase().replace(/\s+/g,"-"),n=await u(V,{owner:t.repo.owner,name:t.repo.name,slug:e}),s=n.repository?.id;let r=n.repository?.discussionCategory?.id;if(r||(r=n.repository?.discussionCategories?.nodes?.find(c=>c.name===t.discussions.category)?.id),!s||!r)throw new Error(`Could not find repository or discussion category "${t.discussions.category}" in ${t.repo.owner}/${t.repo.name}`);return{repositoryId:s,categoryId:r}}o(it,"getRepoAndCategoryIds");async function ct(t,e,n,s){let r=await q(t);if(!r){const{repositoryId:a,categoryId:d}=await it(),l=`Comments: ${t}`,h=f({route:t,createdAt:new Date().toISOString()},"");r=(await u(Z,{repositoryId:a,categoryId:d,title:l,body:h})).createDiscussion.discussion}const i=f({x:Math.round(e*10)/10,y:Math.round(n*10)/10},s);return(await u(tt,{discussionId:r.id,body:i})).addDiscussionComment.comment}o(ct,"createComment");async function ut(t,e,n){return(await u(et,{discussionId:t,replyToId:e,body:n})).addDiscussionComment.comment}o(ut,"replyToComment");async function dt(t,e){const{meta:n,text:s}=m(e),r={...n,resolved:!0},i=s.startsWith("(Resolved) ")?s:`(Resolved) ${s}`,c=f(r,i);return(await u(p,{commentId:t,body:c})).updateDiscussionComment.comment}o(dt,"resolveComment");async function mt(t,e){const{meta:n,text:s}=m(e),r={...n};delete r.resolved;const i=s.replace(/^\(Resolved\)\s*/,""),c=f(r,i);return(await u(p,{commentId:t,body:c})).updateDiscussionComment.comment}o(mt,"unresolveComment");async function lt(t,e,n){const{meta:s}=m(e),r=s?f(s,n):n;return(await u(p,{commentId:t,body:r})).updateDiscussionComment.comment}o(lt,"editComment");async function yt(t,e){return(await u(p,{commentId:t,body:e})).updateDiscussionComment.comment}o(yt,"editReply");async function ft(t,e,n,s){const r=H(e,{x:Math.round(n*10)/10,y:Math.round(s*10)/10});return(await u(p,{commentId:t,body:r})).updateDiscussionComment.comment}o(ft,"moveComment");async function gt(t){await u(nt,{commentId:t})}o(gt,"deleteComment");async function pt(t,e){await u(ot,{subjectId:t,content:e})}o(pt,"addReaction");async function ht(t,e){await u(st,{subjectId:t,content:e})}o(ht,"removeReaction");const I="sb-comments:",It=120*1e3;function Ct(t){try{const e=localStorage.getItem(I+t);if(!e)return null;const n=JSON.parse(e);return Date.now()-n.ts>It?(localStorage.removeItem(I+t),null):n.data}catch{return null}}o(Ct,"getCachedComments");function wt(t,e){try{localStorage.setItem(I+t,JSON.stringify({ts:Date.now(),data:e}))}catch{}}o(wt,"setCachedComments");function $t(t){try{localStorage.removeItem(I+t)}catch{}}o($t,"clearCachedComments");const C="sb-pending-comments:";function St(t,e){try{const n=E(t),s=n.findIndex(r=>r.id===e.id);s>=0?n[s]=e:n.push(e),localStorage.setItem(C+t,JSON.stringify(n))}catch{}}o(St,"savePendingComment");function E(t){try{const e=localStorage.getItem(C+t);return e?JSON.parse(e):[]}catch{return[]}}o(E,"getPendingComments");function bt(t,e){try{const n=E(t).filter(s=>s.id!==e);n.length>0?localStorage.setItem(C+t,JSON.stringify(n)):localStorage.removeItem(C+t)}catch{}}o(bt,"removePendingComment");const k="sb-comment-drafts";function T(){try{return JSON.parse(localStorage.getItem(k)||"{}")}catch{return{}}}o(T,"readDrafts");function J(t){try{localStorage.setItem(k,JSON.stringify(t))}catch{}}o(J,"writeDrafts");function Dt(t,e){const n=T();n[t]=e,J(n)}o(Dt,"saveDraft");function Et(t){return T()[t]??null}o(Et,"getDraft");function Tt(t){const e=T();delete e[t],J(e)}o(Tt,"clearDraft");function vt(t){return`comment:${t}`}o(vt,"composerDraftKey");function Rt(t){return`reply:${t}`}o(Rt,"replyDraftKey");const Nt=Object.freeze(Object.defineProperty({__proto__:null,addReaction:pt,clearCachedComments:$t,clearDraft:Tt,clearToken:O,composerDraftKey:vt,createComment:ct,deleteComment:gt,editComment:lt,editReply:yt,fetchCommentDetail:at,fetchRouteCommentsSummary:rt,fetchRouteDiscussion:q,getCachedComments:Ct,getCachedUser:M,getCommentsConfig:g,getDraft:Et,getPendingComments:E,getToken:w,graphql:u,initCommentsConfig:B,isAuthenticated:D,isCommentModeActive:x,isCommentsEnabled:_,moveComment:ft,parseMetadata:m,removePendingComment:bt,removeReaction:ht,replyDraftKey:Rt,replyToComment:ut,resolveComment:dt,saveDraft:Dt,savePendingComment:St,serializeMetadata:f,setCachedComments:wt,setCommentMode:P,setToken:A,subscribeToCommentMode:j,toggleCommentMode:G,unresolveComment:mt,updateMetadata:H,validateToken:N},Symbol.toStringTag,{value:"Module"}));export{$t as A,ft as B,St as C,Ot as D,Mt as E,Nt as F,D as a,Dt as b,Tt as c,vt as d,M as e,lt as f,Et as g,ut as h,x as i,Rt as j,ht as k,pt as l,yt as m,gt as n,P as o,Ct as p,rt as q,dt as r,j as s,G as t,mt as u,wt as v,at as w,E as x,ct as y,bt as z};

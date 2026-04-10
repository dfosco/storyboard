import { jsx as tt } from "react/jsx-runtime";
import Dt, { useRef as j, useState as et, useEffect as nt, Children as Ct, useCallback as Nt } from "react";
var ft = { dragStart: !0 }, gt = { delay: 0, distance: 3 };
function Tt(t, e = {}) {
  let r, a, { bounds: s, axis: p = "both", gpuAcceleration: i = !0, legacyTranslate: C = !1, transform: b, applyUserSelectHack: E = !0, disabled: m = !1, ignoreMultitouch: h = !1, recomputeBounds: y = ft, grid: T, threshold: f = gt, position: S, cancel: D, handle: N, defaultClass: g = "neodrag", defaultClassDragging: P = "neodrag-dragging", defaultClassDragged: c = "neodrag-dragged", defaultPosition: o = { x: 0, y: 0 }, onDragStart: x, onDrag: I, onDragEnd: q } = e, A = !1, L = !1, B = 0, l = !1, R = !1, X = 0, O = 0, k = 0, G = 0, rt = 0, ot = 0, { x: F, y: Q } = S ? { x: S?.x ?? 0, y: S?.y ?? 0 } : o;
  ct(F, Q);
  let Y, U, J, at, st, yt = "", At = !!S;
  y = { ...ft, ...y }, f = { ...gt, ...f ?? {} };
  let W = /* @__PURE__ */ new Set();
  function vt(n) {
    A && !L && R && l && st && (L = !0, (function(d) {
      lt("neodrag:start", x, d);
    })(n), H.add(P), E && (yt = it.userSelect, it.userSelect = "none"));
  }
  const it = document.body.style, H = t.classList;
  function ct(n = X, d = O) {
    if (!b) {
      if (C) {
        let M = `${+n}px, ${+d}px`;
        return Z(t, "transform", i ? `translate3d(${M}, 0)` : `translate(${M})`);
      }
      return Z(t, "translate", `${+n}px ${+d}px`);
    }
    const w = b({ offsetX: n, offsetY: d, rootNode: t });
    pt(w) && Z(t, "transform", w);
  }
  function lt(n, d, w) {
    const M = /* @__PURE__ */ (function(v) {
      return { offsetX: X, offsetY: O, rootNode: t, currentNode: st, event: v };
    })(w);
    t.dispatchEvent(new CustomEvent(n, { detail: M })), d?.(M);
  }
  const K = addEventListener, ut = new AbortController(), dt = { signal: ut.signal, capture: !1 };
  function xt() {
    let n = t.offsetWidth / U.width;
    return isNaN(n) && (n = 1), n;
  }
  return Z(t, "touch-action", "none"), K("pointerdown", ((n) => {
    if (m || n.button === 2) return;
    if (W.add(n.pointerId), h && W.size > 1) return n.preventDefault();
    if (y.dragStart && (Y = ht(s, t)), pt(N) && pt(D) && N === D) throw new Error("`handle` selector can't be same as `cancel` selector");
    if (H.add(g), J = (function(u, _) {
      if (!u) return [_];
      if (mt(u)) return [u];
      if (Array.isArray(u)) return u;
      const $ = _.querySelectorAll(u);
      if ($ === null) throw new Error("Selector passed for `handle` option should be child of the element on which the action is applied");
      return Array.from($.values());
    })(N, t), at = (function(u, _) {
      if (!u) return [];
      if (mt(u)) return [u];
      if (Array.isArray(u)) return u;
      const $ = _.querySelectorAll(u);
      if ($ === null) throw new Error("Selector passed for `cancel` option should be child of the element on which the action is applied");
      return Array.from($.values());
    })(D, t), r = /(both|x)/.test(p), a = /(both|y)/.test(p), Et(at, J)) throw new Error("Element being dragged can't be a child of the element on which `cancel` is applied");
    const d = n.composedPath()[0];
    if (!J.some(((u) => u.contains(d) || u.shadowRoot?.contains(d))) || Et(at, [d])) return;
    st = J.length === 1 ? t : J.find(((u) => u.contains(d))), A = !0, B = Date.now(), f.delay || (l = !0), U = t.getBoundingClientRect();
    const { clientX: w, clientY: M } = n, v = xt();
    r && (k = w - F / v), a && (G = M - Q / v), Y && (rt = w - U.left, ot = M - U.top);
  }), dt), K("pointermove", ((n) => {
    if (!A || h && W.size > 1) return;
    if (!L) {
      if (l || Date.now() - B >= f.delay && (l = !0, vt(n)), !R) {
        const v = n.clientX - k, u = n.clientY - G;
        Math.sqrt(v ** 2 + u ** 2) >= f.distance && (R = !0, vt(n));
      }
      if (!L) return;
    }
    y.drag && (Y = ht(s, t)), n.preventDefault(), U = t.getBoundingClientRect();
    let d = n.clientX, w = n.clientY;
    const M = xt();
    if (Y) {
      const v = { left: Y.left + rt, top: Y.top + ot, right: Y.right + rt - U.width, bottom: Y.bottom + ot - U.height };
      d = bt(d, v.left, v.right), w = bt(w, v.top, v.bottom);
    }
    if (Array.isArray(T)) {
      let [v, u] = T;
      if (isNaN(+v) || v < 0) throw new Error("1st argument of `grid` must be a valid positive number");
      if (isNaN(+u) || u < 0) throw new Error("2nd argument of `grid` must be a valid positive number");
      let _ = d - k, $ = w - G;
      [_, $] = It([v / M, u / M], _, $), d = k + _, w = G + $;
    }
    r && (X = Math.round((d - k) * M)), a && (O = Math.round((w - G) * M)), F = X, Q = O, lt("neodrag", I, n), ct();
  }), dt), K("pointerup", ((n) => {
    W.delete(n.pointerId), A && (L && (K("click", ((d) => d.stopPropagation()), { once: !0, signal: ut.signal, capture: !0 }), y.dragEnd && (Y = ht(s, t)), H.remove(P), H.add(c), E && (it.userSelect = yt), lt("neodrag:end", q, n), r && (k = X), a && (G = O)), A = !1, L = !1, l = !1, R = !1);
  }), dt), { destroy: () => ut.abort(), update: (n) => {
    p = n.axis || "both", m = n.disabled ?? !1, h = n.ignoreMultitouch ?? !1, N = n.handle, s = n.bounds, y = n.recomputeBounds ?? ft, D = n.cancel, E = n.applyUserSelectHack ?? !0, T = n.grid, i = n.gpuAcceleration ?? !0, C = n.legacyTranslate ?? !1, b = n.transform, f = { ...gt, ...n.threshold ?? {} };
    const d = H.contains(c);
    H.remove(g, c), g = n.defaultClass ?? "neodrag", P = n.defaultClassDragging ?? "neodrag-dragging", c = n.defaultClassDragged ?? "neodrag-dragged", H.add(g), d && H.add(c), At && (F = X = n.position?.x ?? X, Q = O = n.position?.y ?? O, ct());
  } };
}
var bt = (t, e, r) => Math.min(Math.max(t, e), r), pt = (t) => typeof t == "string", It = ([t, e], r, a) => {
  const s = (p, i) => i === 0 ? 0 : Math.ceil(p / i) * i;
  return [s(r, t), s(a, e)];
}, Et = (t, e) => t.some(((r) => e.some(((a) => r.contains(a)))));
function ht(t, e) {
  if (t === void 0) return;
  if (mt(t)) return t.getBoundingClientRect();
  if (typeof t == "object") {
    const { top: a = 0, left: s = 0, right: p = 0, bottom: i = 0 } = t;
    return { top: a, right: window.innerWidth - p, bottom: window.innerHeight - i, left: s };
  }
  if (t === "parent") return e.parentNode.getBoundingClientRect();
  const r = document.querySelector(t);
  if (r === null) throw new Error("The selector provided for bound doesn't exists in the document.");
  return r.getBoundingClientRect();
}
var Z = (t, e, r) => t.style.setProperty(e, r), mt = (t) => t instanceof HTMLElement;
function V(t) {
  return t == null || typeof t == "string" || t instanceof HTMLElement ? t : "current" in t ? t.current : Array.isArray(t) ? t.map(((e) => e instanceof HTMLElement ? e : e.current)) : void 0;
}
function Lt(t, e = {}) {
  const r = j(), [a, s] = et(!1), [p, i] = et();
  let { onDragStart: C, onDrag: b, onDragEnd: E, handle: m, cancel: h } = e, y = V(m), T = V(h);
  function f(g, P) {
    i(g), P?.(g);
  }
  function S(g) {
    s(!0), f(g, C);
  }
  function D(g) {
    f(g, b);
  }
  function N(g) {
    s(!1), f(g, E);
  }
  return nt((() => {
    if (typeof window > "u") return;
    const g = t.current;
    if (!g) return;
    ({ onDragStart: C, onDrag: b, onDragEnd: E } = e);
    const { update: P, destroy: c } = Tt(g, { ...e, handle: y, cancel: T, onDragStart: S, onDrag: D, onDragEnd: N });
    return r.current = P, c;
  }), []), nt((() => {
    r.current?.({ ...e, handle: V(m), cancel: V(h), onDragStart: S, onDrag: D, onDragEnd: N });
  }), [e]), { isDragging: a, dragState: p };
}
const z = "tiny-canvas-queue";
function wt() {
  const t = localStorage.getItem(z);
  if (!t) return [];
  try {
    const e = JSON.parse(t);
    return Array.isArray(e) ? e : [];
  } catch {
    return localStorage.setItem(z, JSON.stringify([])), [];
  }
}
const Rt = (t) => {
  if (!t) return null;
  let e = null;
  const r = (a) => {
    if (a.props && a.props.id) {
      e = a.props.id;
      return;
    }
    a.props && a.props.children && Dt.Children.forEach(a.props.children, r);
  };
  return r(t), e;
};
function Xt(t) {
  let e = 5381;
  for (let r = 0; r < t.length; r++)
    e = (e << 5) + e + t.charCodeAt(r) >>> 0;
  return e.toString(16).padStart(8, "0");
}
function Mt(t) {
  if (t == null || typeof t == "boolean") return "";
  if (typeof t == "string" || typeof t == "number") return "#text";
  const e = t.type, r = typeof e == "function" ? e.displayName || e.name || "Anonymous" : typeof e == "string" ? e : "Fragment", a = t.props?.children;
  if (a == null) return r;
  const s = [];
  return Dt.Children.forEach(a, (p) => {
    const i = Mt(p);
    i && s.push(i);
  }), s.length ? `${r}(${s.join(",")})` : r;
}
const Yt = (t, e) => {
  const r = Mt(t);
  return `tc-${Xt(r)}-${e}`;
}, Gt = (t) => {
  try {
    return wt().reduce((a, s) => (a[s.id] = { id: s.id, x: s.x, y: s.y }, a), {})[t] || { x: 0, y: 0 };
  } catch (e) {
    return console.error("Error getting saved coordinates:", e), { x: 0, y: 0 };
  }
}, Jt = () => {
  try {
    localStorage.getItem(z) || localStorage.setItem(z, JSON.stringify([]));
  } catch (t) {
    console.error("LocalStorage is not available:", t);
  }
}, $t = (t, e, r) => {
  try {
    const a = wt(), s = (/* @__PURE__ */ new Date()).toISOString().replace(/[:.]/g, "-"), p = { id: t, x: e, y: r, time: s }, i = a.findIndex((C) => C.id === t);
    i >= 0 ? a[i] = p : a.push(p), localStorage.setItem(z, JSON.stringify(a));
  } catch (a) {
    console.error("Error saving drag position:", a);
  }
}, Pt = 250, St = 4, qt = 150, Ht = 8;
function _t({ children: t, dragId: e, initialPosition: r, onDragStart: a, onDrag: s, onDragEnd: p, handle: i, snapGrid: C, locked: b = !1 }) {
  const E = j(null), m = r || { x: 0, y: 0 }, h = j(m), y = j(!1), T = j({
    timer: null,
    startX: 0,
    startY: 0,
    delayMet: !1,
    distanceMet: !1,
    active: !1,
    lastEvent: null
  }), [f, S] = et(m), [D, N] = et(m);
  r && (r.x !== D.x || r.y !== D.y) && (N(r), S(r)), nt(() => {
    const c = E.current;
    if (c && e && (m.x !== 0 || m.y !== 0)) {
      c.classList.add("tc-on-translation");
      const o = setTimeout(() => {
        c.classList.remove("tc-on-translation");
      }, Pt * 4);
      return () => {
        clearTimeout(o);
      };
    }
  }, [e, m.x, m.y]), nt(() => {
    const c = E.current;
    if (!c || !i || b) return;
    const o = T.current;
    let x = null;
    function I(l) {
      if (!(l.target instanceof Element)) return !1;
      const R = l.target.closest(i);
      return R != null && c.contains(R);
    }
    function q(l) {
      if (l === x) {
        x = null;
        return;
      }
      I(l) && (l.stopImmediatePropagation(), o.active = !0, o.delayMet = !1, o.distanceMet = !1, o.startX = l.clientX, o.startY = l.clientY, o.target = l.target, o.pointerId = l.pointerId, o.button = l.button, o.pointerType = l.pointerType, clearTimeout(o.timer), o.timer = setTimeout(() => {
        o.delayMet = !0, A();
      }, qt));
    }
    function A() {
      if (o.delayMet && o.distanceMet && o.active && o.target) {
        const l = new PointerEvent("pointerdown", {
          bubbles: !0,
          cancelable: !0,
          pointerId: o.pointerId,
          clientX: o.startX,
          clientY: o.startY,
          button: o.button,
          pointerType: o.pointerType
        });
        x = l, o.target.dispatchEvent(l), o.target = null;
      }
    }
    function L(l) {
      if (!o.active || o.distanceMet) return;
      const R = l.clientX - o.startX, X = l.clientY - o.startY;
      Math.hypot(R, X) >= Ht && (o.distanceMet = !0, A());
    }
    function B() {
      clearTimeout(o.timer), o.active = !1, o.target = null;
    }
    return c.addEventListener("pointerdown", q, !0), document.addEventListener("pointermove", L), document.addEventListener("pointerup", B), document.addEventListener("pointercancel", B), () => {
      c.removeEventListener("pointerdown", q, !0), document.removeEventListener("pointermove", L), document.removeEventListener("pointerup", B), document.removeEventListener("pointercancel", B), clearTimeout(o.timer);
    };
  }, [i, b]);
  const { isDragging: g } = Lt(E, {
    axis: "both",
    grid: C,
    defaultClass: "tc-drag",
    defaultClassDragging: "tc-on",
    defaultClassDragged: "tc-off",
    applyUserSelectHack: !0,
    disabled: b,
    ...i ? { handle: i } : {},
    position: { x: f.x, y: f.y },
    // Clamp in the transform callback so neodrag never paints a
    // negative position — avoids the one-frame flicker that happens
    // when clamping only in onDrag (React re-render lag).
    transform: ({ offsetX: c, offsetY: o }) => {
      const x = Math.max(0, c), I = Math.max(0, o);
      return `translate3d(${x}px, ${I}px, 0)`;
    },
    onDragStart: () => {
      h.current = f, y.current = !1, a?.(e, f);
    },
    onDrag: ({ offsetX: c, offsetY: o }) => {
      const x = c - h.current.x, I = o - h.current.y, q = Math.hypot(x, I);
      !y.current && q >= St && (y.current = !0);
      const A = { x: Math.max(0, c), y: Math.max(0, o) };
      S(A), s?.(e, A);
    },
    onDragEnd: (c) => {
      const o = Math.max(0, c.offsetX), x = Math.max(0, c.offsetY);
      S({ x: o, y: x });
      const I = o - h.current.x, q = x - h.current.y;
      (y.current || Math.hypot(I, q) >= St) && (e && $t(e, o, x), p?.(e, { x: o, y: x }));
    }
  });
  return /* @__PURE__ */ tt(
    "article",
    {
      ref: E,
      style: { cursor: b ? void 0 : i ? g ? "grabbing" : void 0 : g ? "grabbing" : "grab" },
      children: /* @__PURE__ */ tt("div", { className: "tc-draggable-inner", children: t })
    }
  );
}
function Bt(t) {
  const e = Number(t?.props?.["data-tc-x"]), r = Number(t?.props?.["data-tc-y"]);
  return Number.isFinite(e) && Number.isFinite(r) ? { x: Math.max(0, e), y: Math.max(0, r) } : null;
}
function Ot(t) {
  return t?.props?.["data-tc-handle"] || null;
}
function jt({
  children: t,
  dotted: e = !1,
  grid: r = !1,
  gridSize: a,
  snapGrid: s,
  colorMode: p = "auto",
  locked: i = !1,
  onDragStart: C,
  onDrag: b,
  onDragEnd: E
}) {
  const m = e || r, h = a, y = h && h < 16 ? 1 : 2, T = h ? {
    "--tc-grid-size": `${h}px`,
    "--tc-grid-offset": `${h / -2}px`,
    "--tc-dot-radius": `${y}px`
  } : void 0;
  return /* @__PURE__ */ tt(
    "main",
    {
      className: "tc-canvas",
      "data-dotted": m || void 0,
      "data-color-mode": p !== "auto" ? p : void 0,
      style: T,
      children: Ct.map(t, (f, S) => {
        const D = Rt(f) ?? Yt(f, S), N = Bt(f), g = Ot(f);
        return /* @__PURE__ */ tt(
          _t,
          {
            gridSize: a,
            snapGrid: s,
            dragId: D,
            initialPosition: N,
            onDragStart: C,
            onDrag: b,
            onDragEnd: E,
            handle: g,
            locked: i,
            children: f
          },
          D
        );
      })
    }
  );
}
function zt({ reload: t = !1 } = {}) {
  return Nt(() => {
    try {
      localStorage.removeItem("tiny-canvas-queue");
    } catch (e) {
      console.error("Error clearing canvas state:", e);
    }
    t && window.location.reload();
  }, [t]);
}
export {
  jt as Canvas,
  _t as Draggable,
  Rt as findDragId,
  Yt as generateDragId,
  Gt as getQueue,
  Jt as refreshStorage,
  $t as saveDrag,
  zt as useResetCanvas
};

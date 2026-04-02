import { jsx as Z } from "react/jsx-runtime";
import vt, { useRef as W, useState as B, useEffect as ft, Children as Mt, useCallback as Rt } from "react";
var it = { dragStart: !0 }, ct = { delay: 0, distance: 3 };
function It(t, e = {}) {
  let n, o, { bounds: a, axis: s = "both", gpuAcceleration: f = !0, legacyTranslate: d = !1, transform: v, applyUserSelectHack: w = !0, disabled: D = !1, ignoreMultitouch: N = !1, recomputeBounds: x = it, grid: I, threshold: y = ct, position: S, cancel: u, handle: m, defaultClass: i = "neodrag", defaultClassDragging: b = "neodrag-dragging", defaultClassDragged: A = "neodrag-dragged", defaultPosition: Et = { x: 0, y: 0 }, onDragStart: xt, onDrag: Nt, onDragEnd: At } = e, L = !1, $ = !1, gt = 0, Y = !1, _ = !1, T = 0, O = 0, q = 0, X = 0, G = 0, K = 0, { x: U, y: J } = S ? { x: (S == null ? void 0 : S.x) ?? 0, y: (S == null ? void 0 : S.y) ?? 0 } : Et;
  nt(U, J);
  let C, P, k, tt, et, pt = "", Ct = !!S;
  x = { ...it, ...x }, y = { ...ct, ...y ?? {} };
  let j = /* @__PURE__ */ new Set();
  function ht(r) {
    L && !$ && _ && Y && et && ($ = !0, (function(c) {
      ot("neodrag:start", xt, c);
    })(r), R.add(b), w && (pt = rt.userSelect, rt.userSelect = "none"));
  }
  const rt = document.body.style, R = t.classList;
  function nt(r = T, c = O) {
    if (!v) {
      if (d) {
        let p = `${+r}px, ${+c}px`;
        return Q(t, "transform", f ? `translate3d(${p}, 0)` : `translate(${p})`);
      }
      return Q(t, "translate", `${+r}px ${+c}px`);
    }
    const g = v({ offsetX: r, offsetY: c, rootNode: t });
    lt(g) && Q(t, "transform", g);
  }
  function ot(r, c, g) {
    const p = /* @__PURE__ */ (function(h) {
      return { offsetX: T, offsetY: O, rootNode: t, currentNode: et, event: h };
    })(g);
    t.dispatchEvent(new CustomEvent(r, { detail: p })), c == null || c(p);
  }
  const F = addEventListener, at = new AbortController(), st = { signal: at.signal, capture: !1 };
  function yt() {
    let r = t.offsetWidth / P.width;
    return isNaN(r) && (r = 1), r;
  }
  return Q(t, "touch-action", "none"), F("pointerdown", ((r) => {
    if (D || r.button === 2) return;
    if (j.add(r.pointerId), N && j.size > 1) return r.preventDefault();
    if (x.dragStart && (C = ut(a, t)), lt(m) && lt(u) && m === u) throw new Error("`handle` selector can't be same as `cancel` selector");
    if (R.add(i), k = (function(l, E) {
      if (!l) return [E];
      if (dt(l)) return [l];
      if (Array.isArray(l)) return l;
      const M = E.querySelectorAll(l);
      if (M === null) throw new Error("Selector passed for `handle` option should be child of the element on which the action is applied");
      return Array.from(M.values());
    })(m, t), tt = (function(l, E) {
      if (!l) return [];
      if (dt(l)) return [l];
      if (Array.isArray(l)) return l;
      const M = E.querySelectorAll(l);
      if (M === null) throw new Error("Selector passed for `cancel` option should be child of the element on which the action is applied");
      return Array.from(M.values());
    })(u, t), n = /(both|x)/.test(s), o = /(both|y)/.test(s), St(tt, k)) throw new Error("Element being dragged can't be a child of the element on which `cancel` is applied");
    const c = r.composedPath()[0];
    if (!k.some(((l) => {
      var E;
      return l.contains(c) || ((E = l.shadowRoot) == null ? void 0 : E.contains(c));
    })) || St(tt, [c])) return;
    et = k.length === 1 ? t : k.find(((l) => l.contains(c))), L = !0, gt = Date.now(), y.delay || (Y = !0), P = t.getBoundingClientRect();
    const { clientX: g, clientY: p } = r, h = yt();
    n && (q = g - U / h), o && (X = p - J / h), C && (G = g - P.left, K = p - P.top);
  }), st), F("pointermove", ((r) => {
    if (!L || N && j.size > 1) return;
    if (!$) {
      if (Y || Date.now() - gt >= y.delay && (Y = !0, ht(r)), !_) {
        const h = r.clientX - q, l = r.clientY - X;
        Math.sqrt(h ** 2 + l ** 2) >= y.distance && (_ = !0, ht(r));
      }
      if (!$) return;
    }
    x.drag && (C = ut(a, t)), r.preventDefault(), P = t.getBoundingClientRect();
    let c = r.clientX, g = r.clientY;
    const p = yt();
    if (C) {
      const h = { left: C.left + G, top: C.top + K, right: C.right + G - P.width, bottom: C.bottom + K - P.height };
      c = mt(c, h.left, h.right), g = mt(g, h.top, h.bottom);
    }
    if (Array.isArray(I)) {
      let [h, l] = I;
      if (isNaN(+h) || h < 0) throw new Error("1st argument of `grid` must be a valid positive number");
      if (isNaN(+l) || l < 0) throw new Error("2nd argument of `grid` must be a valid positive number");
      let E = c - q, M = g - X;
      [E, M] = Tt([h / p, l / p], E, M), c = q + E, g = X + M;
    }
    n && (T = Math.round((c - q) * p)), o && (O = Math.round((g - X) * p)), U = T, J = O, ot("neodrag", Nt, r), nt();
  }), st), F("pointerup", ((r) => {
    j.delete(r.pointerId), L && ($ && (F("click", ((c) => c.stopPropagation()), { once: !0, signal: at.signal, capture: !0 }), x.dragEnd && (C = ut(a, t)), R.remove(b), R.add(A), w && (rt.userSelect = pt), ot("neodrag:end", At, r), n && (q = T), o && (X = O)), L = !1, $ = !1, Y = !1, _ = !1);
  }), st), { destroy: () => at.abort(), update: (r) => {
    var g, p;
    s = r.axis || "both", D = r.disabled ?? !1, N = r.ignoreMultitouch ?? !1, m = r.handle, a = r.bounds, x = r.recomputeBounds ?? it, u = r.cancel, w = r.applyUserSelectHack ?? !0, I = r.grid, f = r.gpuAcceleration ?? !0, d = r.legacyTranslate ?? !1, v = r.transform, y = { ...ct, ...r.threshold ?? {} };
    const c = R.contains(A);
    R.remove(i, A), i = r.defaultClass ?? "neodrag", b = r.defaultClassDragging ?? "neodrag-dragging", A = r.defaultClassDragged ?? "neodrag-dragged", R.add(i), c && R.add(A), Ct && (U = T = ((g = r.position) == null ? void 0 : g.x) ?? T, J = O = ((p = r.position) == null ? void 0 : p.y) ?? O, nt());
  } };
}
var mt = (t, e, n) => Math.min(Math.max(t, e), n), lt = (t) => typeof t == "string", Tt = ([t, e], n, o) => {
  const a = (s, f) => f === 0 ? 0 : Math.ceil(s / f) * f;
  return [a(n, t), a(o, e)];
}, St = (t, e) => t.some(((n) => e.some(((o) => n.contains(o)))));
function ut(t, e) {
  if (t === void 0) return;
  if (dt(t)) return t.getBoundingClientRect();
  if (typeof t == "object") {
    const { top: o = 0, left: a = 0, right: s = 0, bottom: f = 0 } = t;
    return { top: o, right: window.innerWidth - s, bottom: window.innerHeight - f, left: a };
  }
  if (t === "parent") return e.parentNode.getBoundingClientRect();
  const n = document.querySelector(t);
  if (n === null) throw new Error("The selector provided for bound doesn't exists in the document.");
  return n.getBoundingClientRect();
}
var Q = (t, e, n) => t.style.setProperty(e, n), dt = (t) => t instanceof HTMLElement;
function z(t) {
  return t == null || typeof t == "string" || t instanceof HTMLElement ? t : "current" in t ? t.current : Array.isArray(t) ? t.map(((e) => e instanceof HTMLElement ? e : e.current)) : void 0;
}
function Ot(t, e = {}) {
  const n = W(), [o, a] = B(!1), [s, f] = B();
  let { onDragStart: d, onDrag: v, onDragEnd: w, handle: D, cancel: N } = e, x = z(D), I = z(N);
  function y(i, b) {
    f(i), b == null || b(i);
  }
  function S(i) {
    a(!0), y(i, d);
  }
  function u(i) {
    y(i, v);
  }
  function m(i) {
    a(!1), y(i, w);
  }
  return ft((() => {
    if (typeof window > "u") return;
    const i = t.current;
    if (!i) return;
    ({ onDragStart: d, onDrag: v, onDragEnd: w } = e);
    const { update: b, destroy: A } = It(i, { ...e, handle: x, cancel: I, onDragStart: S, onDrag: u, onDragEnd: m });
    return n.current = b, A;
  }), []), ft((() => {
    var i;
    (i = n.current) == null || i.call(n, { ...e, handle: z(D), cancel: z(N), onDragStart: S, onDrag: u, onDragEnd: m });
  }), [e]), { isDragging: o, dragState: s };
}
const H = "tiny-canvas-queue";
function wt() {
  const t = localStorage.getItem(H);
  if (!t) return [];
  try {
    const e = JSON.parse(t);
    return Array.isArray(e) ? e : [];
  } catch {
    return localStorage.setItem(H, JSON.stringify([])), [];
  }
}
const Pt = (t) => {
  if (!t) return null;
  let e = null;
  const n = (o) => {
    if (o.props && o.props.id) {
      e = o.props.id;
      return;
    }
    o.props && o.props.children && vt.Children.forEach(o.props.children, n);
  };
  return n(t), e;
};
function $t(t) {
  let e = 5381;
  for (let n = 0; n < t.length; n++)
    e = (e << 5) + e + t.charCodeAt(n) >>> 0;
  return e.toString(16).padStart(8, "0");
}
function Dt(t) {
  var s;
  if (t == null || typeof t == "boolean") return "";
  if (typeof t == "string" || typeof t == "number") return "#text";
  const e = t.type, n = typeof e == "function" ? e.displayName || e.name || "Anonymous" : typeof e == "string" ? e : "Fragment", o = (s = t.props) == null ? void 0 : s.children;
  if (o == null) return n;
  const a = [];
  return vt.Children.forEach(o, (f) => {
    const d = Dt(f);
    d && a.push(d);
  }), a.length ? `${n}(${a.join(",")})` : n;
}
const qt = (t, e) => {
  const n = Dt(t);
  return `tc-${$t(n)}-${e}`;
}, Ut = (t) => {
  try {
    return wt().reduce((o, a) => (o[a.id] = { id: a.id, x: a.x, y: a.y }, o), {})[t] || { x: 0, y: 0 };
  } catch (e) {
    return console.error("Error getting saved coordinates:", e), { x: 0, y: 0 };
  }
}, Jt = () => {
  try {
    localStorage.getItem(H) || localStorage.setItem(H, JSON.stringify([]));
  } catch (t) {
    console.error("LocalStorage is not available:", t);
  }
}, Xt = (t, e, n) => {
  try {
    const o = wt(), a = (/* @__PURE__ */ new Date()).toISOString().replace(/[:.]/g, "-"), s = { id: t, x: e, y: n, time: a }, f = o.findIndex((d) => d.id === t);
    f >= 0 ? o[f] = s : o.push(s), localStorage.setItem(H, JSON.stringify(o));
  } catch (o) {
    console.error("Error saving drag position:", o);
  }
}, Lt = 250, bt = 4, Yt = 10, V = 1.5;
function kt({ children: t, dragId: e, initialPosition: n, onDragEnd: o }) {
  const a = W(null), s = n || { x: 0, y: 0 }, f = W(s), d = W(!1), [v, w] = B(!1), [D, N] = B(s), [x, I] = B(
    () => Math.random() < 0.5 ? -V : V
  );
  ft(() => {
    const u = a.current;
    if (u && e && (s.x !== 0 || s.y !== 0)) {
      u.classList.add("tc-on-translation");
      const m = setTimeout(() => {
        u.classList.remove("tc-on-translation");
      }, Lt * 4);
      return () => {
        clearTimeout(m);
      };
    }
  }, [e, s.x, s.y]);
  const { isDragging: y } = Ot(a, {
    axis: "both",
    threshold: { delay: 50, distance: 30 },
    defaultClass: "tc-drag",
    defaultClassDragging: "tc-on",
    defaultClassDragged: "tc-off",
    applyUserSelectHack: !0,
    position: { x: D.x, y: D.y },
    onDragStart: () => {
      f.current = D, d.current = !1, w(!1);
    },
    onDrag: ({ offsetX: u, offsetY: m }) => {
      const i = u - f.current.x, b = m - f.current.y, A = Math.hypot(i, b);
      !d.current && Math.hypot(i, b) >= bt && (d.current = !0), !v && A >= Yt && w(!0), N({ x: u, y: m });
    },
    onDragEnd: (u) => {
      N({ x: u.offsetX, y: u.offsetY }), I(Math.random() < 0.5 ? -V : V), w(!1);
      const m = u.offsetX - f.current.x, i = u.offsetY - f.current.y;
      (d.current || Math.hypot(m, i) >= bt) && (e && Xt(e, u.offsetX, u.offsetY), o == null || o(e, { x: u.offsetX, y: u.offsetY }));
    }
  }), S = y && v ? `${x}deg` : "0deg";
  return /* @__PURE__ */ Z(
    "article",
    {
      ref: a,
      style: { cursor: y ? "grabbing" : "grab" },
      children: /* @__PURE__ */ Z(
        "div",
        {
          className: "tc-draggable-inner",
          style: {
            transform: y ? `rotate(${S})` : void 0,
            transition: "transform ease-in-out 150ms"
          },
          children: t
        }
      )
    }
  );
}
function Bt(t) {
  var o, a;
  const e = Number((o = t == null ? void 0 : t.props) == null ? void 0 : o["data-tc-x"]), n = Number((a = t == null ? void 0 : t.props) == null ? void 0 : a["data-tc-y"]);
  return Number.isFinite(e) && Number.isFinite(n) ? { x: e, y: n } : null;
}
function jt({
  children: t,
  dotted: e = !1,
  grid: n = !1,
  gridSize: o,
  colorMode: a = "auto",
  onDragEnd: s
}) {
  return /* @__PURE__ */ Z(
    "main",
    {
      className: "tc-canvas",
      "data-dotted": e || n || void 0,
      "data-color-mode": a !== "auto" ? a : void 0,
      children: Mt.map(t, (d, v) => {
        const w = Pt(d) ?? qt(d, v), D = Bt(d);
        return /* @__PURE__ */ Z(
          kt,
          {
            gridSize: o,
            dragId: w,
            initialPosition: D,
            onDragEnd: s,
            children: d
          },
          v
        );
      })
    }
  );
}
function Ft({ reload: t = !1 } = {}) {
  return Rt(() => {
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
  kt as Draggable,
  Pt as findDragId,
  qt as generateDragId,
  Ut as getQueue,
  Jt as refreshStorage,
  Xt as saveDrag,
  Ft as useResetCanvas
};

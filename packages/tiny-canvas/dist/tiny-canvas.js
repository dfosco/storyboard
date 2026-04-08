import { jsx as Z } from "react/jsx-runtime";
import xt, { useRef as W, useState as H, useEffect as dt, Children as Ct, useCallback as Rt } from "react";
var it = { dragStart: !0 }, ct = { delay: 0, distance: 3 };
function It(t, e = {}) {
  let n, o, { bounds: a, axis: i = "both", gpuAcceleration: u = !0, legacyTranslate: d = !1, transform: v, applyUserSelectHack: x = !0, disabled: w = !1, ignoreMultitouch: A = !1, recomputeBounds: N = it, grid: I, threshold: m = ct, position: S, cancel: f, handle: g, defaultClass: s = "neodrag", defaultClassDragging: b = "neodrag-dragging", defaultClassDragged: D = "neodrag-dragged", defaultPosition: gt = { x: 0, y: 0 }, onDragStart: Et, onDrag: Nt, onDragEnd: At } = e, X = !1, $ = !1, pt = 0, k = !1, _ = !1, T = 0, O = 0, q = 0, L = 0, G = 0, K = 0, { x: U, y: J } = S ? { x: (S == null ? void 0 : S.x) ?? 0, y: (S == null ? void 0 : S.y) ?? 0 } : gt;
  nt(U, J);
  let M, P, B, tt, et, ht = "", Mt = !!S;
  N = { ...it, ...N }, m = { ...ct, ...m ?? {} };
  let j = /* @__PURE__ */ new Set();
  function yt(r) {
    X && !$ && _ && k && et && ($ = !0, (function(c) {
      ot("neodrag:start", Et, c);
    })(r), R.add(b), x && (ht = rt.userSelect, rt.userSelect = "none"));
  }
  const rt = document.body.style, R = t.classList;
  function nt(r = T, c = O) {
    if (!v) {
      if (d) {
        let h = `${+r}px, ${+c}px`;
        return Q(t, "transform", u ? `translate3d(${h}, 0)` : `translate(${h})`);
      }
      return Q(t, "translate", `${+r}px ${+c}px`);
    }
    const p = v({ offsetX: r, offsetY: c, rootNode: t });
    lt(p) && Q(t, "transform", p);
  }
  function ot(r, c, p) {
    const h = /* @__PURE__ */ (function(y) {
      return { offsetX: T, offsetY: O, rootNode: t, currentNode: et, event: y };
    })(p);
    t.dispatchEvent(new CustomEvent(r, { detail: h })), c == null || c(h);
  }
  const F = addEventListener, at = new AbortController(), st = { signal: at.signal, capture: !1 };
  function mt() {
    let r = t.offsetWidth / P.width;
    return isNaN(r) && (r = 1), r;
  }
  return Q(t, "touch-action", "none"), F("pointerdown", ((r) => {
    if (w || r.button === 2) return;
    if (j.add(r.pointerId), A && j.size > 1) return r.preventDefault();
    if (N.dragStart && (M = ut(a, t)), lt(g) && lt(f) && g === f) throw new Error("`handle` selector can't be same as `cancel` selector");
    if (R.add(s), B = (function(l, E) {
      if (!l) return [E];
      if (ft(l)) return [l];
      if (Array.isArray(l)) return l;
      const C = E.querySelectorAll(l);
      if (C === null) throw new Error("Selector passed for `handle` option should be child of the element on which the action is applied");
      return Array.from(C.values());
    })(g, t), tt = (function(l, E) {
      if (!l) return [];
      if (ft(l)) return [l];
      if (Array.isArray(l)) return l;
      const C = E.querySelectorAll(l);
      if (C === null) throw new Error("Selector passed for `cancel` option should be child of the element on which the action is applied");
      return Array.from(C.values());
    })(f, t), n = /(both|x)/.test(i), o = /(both|y)/.test(i), St(tt, B)) throw new Error("Element being dragged can't be a child of the element on which `cancel` is applied");
    const c = r.composedPath()[0];
    if (!B.some(((l) => {
      var E;
      return l.contains(c) || ((E = l.shadowRoot) == null ? void 0 : E.contains(c));
    })) || St(tt, [c])) return;
    et = B.length === 1 ? t : B.find(((l) => l.contains(c))), X = !0, pt = Date.now(), m.delay || (k = !0), P = t.getBoundingClientRect();
    const { clientX: p, clientY: h } = r, y = mt();
    n && (q = p - U / y), o && (L = h - J / y), M && (G = p - P.left, K = h - P.top);
  }), st), F("pointermove", ((r) => {
    if (!X || A && j.size > 1) return;
    if (!$) {
      if (k || Date.now() - pt >= m.delay && (k = !0, yt(r)), !_) {
        const y = r.clientX - q, l = r.clientY - L;
        Math.sqrt(y ** 2 + l ** 2) >= m.distance && (_ = !0, yt(r));
      }
      if (!$) return;
    }
    N.drag && (M = ut(a, t)), r.preventDefault(), P = t.getBoundingClientRect();
    let c = r.clientX, p = r.clientY;
    const h = mt();
    if (M) {
      const y = { left: M.left + G, top: M.top + K, right: M.right + G - P.width, bottom: M.bottom + K - P.height };
      c = bt(c, y.left, y.right), p = bt(p, y.top, y.bottom);
    }
    if (Array.isArray(I)) {
      let [y, l] = I;
      if (isNaN(+y) || y < 0) throw new Error("1st argument of `grid` must be a valid positive number");
      if (isNaN(+l) || l < 0) throw new Error("2nd argument of `grid` must be a valid positive number");
      let E = c - q, C = p - L;
      [E, C] = Tt([y / h, l / h], E, C), c = q + E, p = L + C;
    }
    n && (T = Math.round((c - q) * h)), o && (O = Math.round((p - L) * h)), U = T, J = O, ot("neodrag", Nt, r), nt();
  }), st), F("pointerup", ((r) => {
    j.delete(r.pointerId), X && ($ && (F("click", ((c) => c.stopPropagation()), { once: !0, signal: at.signal, capture: !0 }), N.dragEnd && (M = ut(a, t)), R.remove(b), R.add(D), x && (rt.userSelect = ht), ot("neodrag:end", At, r), n && (q = T), o && (L = O)), X = !1, $ = !1, k = !1, _ = !1);
  }), st), { destroy: () => at.abort(), update: (r) => {
    var p, h;
    i = r.axis || "both", w = r.disabled ?? !1, A = r.ignoreMultitouch ?? !1, g = r.handle, a = r.bounds, N = r.recomputeBounds ?? it, f = r.cancel, x = r.applyUserSelectHack ?? !0, I = r.grid, u = r.gpuAcceleration ?? !0, d = r.legacyTranslate ?? !1, v = r.transform, m = { ...ct, ...r.threshold ?? {} };
    const c = R.contains(D);
    R.remove(s, D), s = r.defaultClass ?? "neodrag", b = r.defaultClassDragging ?? "neodrag-dragging", D = r.defaultClassDragged ?? "neodrag-dragged", R.add(s), c && R.add(D), Mt && (U = T = ((p = r.position) == null ? void 0 : p.x) ?? T, J = O = ((h = r.position) == null ? void 0 : h.y) ?? O, nt());
  } };
}
var bt = (t, e, n) => Math.min(Math.max(t, e), n), lt = (t) => typeof t == "string", Tt = ([t, e], n, o) => {
  const a = (i, u) => u === 0 ? 0 : Math.ceil(i / u) * u;
  return [a(n, t), a(o, e)];
}, St = (t, e) => t.some(((n) => e.some(((o) => n.contains(o)))));
function ut(t, e) {
  if (t === void 0) return;
  if (ft(t)) return t.getBoundingClientRect();
  if (typeof t == "object") {
    const { top: o = 0, left: a = 0, right: i = 0, bottom: u = 0 } = t;
    return { top: o, right: window.innerWidth - i, bottom: window.innerHeight - u, left: a };
  }
  if (t === "parent") return e.parentNode.getBoundingClientRect();
  const n = document.querySelector(t);
  if (n === null) throw new Error("The selector provided for bound doesn't exists in the document.");
  return n.getBoundingClientRect();
}
var Q = (t, e, n) => t.style.setProperty(e, n), ft = (t) => t instanceof HTMLElement;
function z(t) {
  return t == null || typeof t == "string" || t instanceof HTMLElement ? t : "current" in t ? t.current : Array.isArray(t) ? t.map(((e) => e instanceof HTMLElement ? e : e.current)) : void 0;
}
function Ot(t, e = {}) {
  const n = W(), [o, a] = H(!1), [i, u] = H();
  let { onDragStart: d, onDrag: v, onDragEnd: x, handle: w, cancel: A } = e, N = z(w), I = z(A);
  function m(s, b) {
    u(s), b == null || b(s);
  }
  function S(s) {
    a(!0), m(s, d);
  }
  function f(s) {
    m(s, v);
  }
  function g(s) {
    a(!1), m(s, x);
  }
  return dt((() => {
    if (typeof window > "u") return;
    const s = t.current;
    if (!s) return;
    ({ onDragStart: d, onDrag: v, onDragEnd: x } = e);
    const { update: b, destroy: D } = It(s, { ...e, handle: N, cancel: I, onDragStart: S, onDrag: f, onDragEnd: g });
    return n.current = b, D;
  }), []), dt((() => {
    var s;
    (s = n.current) == null || s.call(n, { ...e, handle: z(w), cancel: z(A), onDragStart: S, onDrag: f, onDragEnd: g });
  }), [e]), { isDragging: o, dragState: i };
}
const Y = "tiny-canvas-queue";
function wt() {
  const t = localStorage.getItem(Y);
  if (!t) return [];
  try {
    const e = JSON.parse(t);
    return Array.isArray(e) ? e : [];
  } catch {
    return localStorage.setItem(Y, JSON.stringify([])), [];
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
    o.props && o.props.children && xt.Children.forEach(o.props.children, n);
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
  var i;
  if (t == null || typeof t == "boolean") return "";
  if (typeof t == "string" || typeof t == "number") return "#text";
  const e = t.type, n = typeof e == "function" ? e.displayName || e.name || "Anonymous" : typeof e == "string" ? e : "Fragment", o = (i = t.props) == null ? void 0 : i.children;
  if (o == null) return n;
  const a = [];
  return xt.Children.forEach(o, (u) => {
    const d = Dt(u);
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
    localStorage.getItem(Y) || localStorage.setItem(Y, JSON.stringify([]));
  } catch (t) {
    console.error("LocalStorage is not available:", t);
  }
}, Lt = (t, e, n) => {
  try {
    const o = wt(), a = (/* @__PURE__ */ new Date()).toISOString().replace(/[:.]/g, "-"), i = { id: t, x: e, y: n, time: a }, u = o.findIndex((d) => d.id === t);
    u >= 0 ? o[u] = i : o.push(i), localStorage.setItem(Y, JSON.stringify(o));
  } catch (o) {
    console.error("Error saving drag position:", o);
  }
}, Xt = 250, vt = 4, kt = 10, V = 1.5;
function Bt({ children: t, dragId: e, initialPosition: n, onDragEnd: o }) {
  const a = W(null), i = n || { x: 0, y: 0 }, u = W(i), d = W(!1), [v, x] = H(!1), [w, A] = H(i), [N, I] = H(
    () => Math.random() < 0.5 ? -V : V
  );
  dt(() => {
    const f = a.current;
    if (f && e && (i.x !== 0 || i.y !== 0)) {
      f.classList.add("tc-on-translation");
      const g = setTimeout(() => {
        f.classList.remove("tc-on-translation");
      }, Xt * 4);
      return () => {
        clearTimeout(g);
      };
    }
  }, [e, i.x, i.y]);
  const { isDragging: m } = Ot(a, {
    axis: "both",
    bounds: "parent",
    threshold: { delay: 50, distance: 30 },
    defaultClass: "tc-drag",
    defaultClassDragging: "tc-on",
    defaultClassDragged: "tc-off",
    applyUserSelectHack: !0,
    position: { x: w.x, y: w.y },
    onDragStart: () => {
      u.current = w, d.current = !1, x(!1);
    },
    onDrag: ({ offsetX: f, offsetY: g }) => {
      const s = f - u.current.x, b = g - u.current.y, D = Math.hypot(s, b);
      !d.current && Math.hypot(s, b) >= vt && (d.current = !0), !v && D >= kt && x(!0), A({ x: Math.max(0, f), y: Math.max(0, g) });
    },
    onDragEnd: (f) => {
      const g = Math.max(0, f.offsetX), s = Math.max(0, f.offsetY);
      A({ x: g, y: s }), I(Math.random() < 0.5 ? -V : V), x(!1);
      const b = g - u.current.x, D = s - u.current.y;
      (d.current || Math.hypot(b, D) >= vt) && (e && Lt(e, g, s), o == null || o(e, { x: g, y: s }));
    }
  }), S = m && v ? `${N}deg` : "0deg";
  return /* @__PURE__ */ Z(
    "article",
    {
      ref: a,
      style: { cursor: m ? "grabbing" : "grab" },
      children: /* @__PURE__ */ Z(
        "div",
        {
          className: "tc-draggable-inner",
          style: {
            transform: m ? `rotate(${S})` : void 0,
            transition: "transform ease-in-out 150ms"
          },
          children: t
        }
      )
    }
  );
}
function Ht(t) {
  var o, a;
  const e = Number((o = t == null ? void 0 : t.props) == null ? void 0 : o["data-tc-x"]), n = Number((a = t == null ? void 0 : t.props) == null ? void 0 : a["data-tc-y"]);
  return Number.isFinite(e) && Number.isFinite(n) ? { x: Math.max(0, e), y: Math.max(0, n) } : null;
}
function jt({
  children: t,
  dotted: e = !1,
  grid: n = !1,
  gridSize: o,
  colorMode: a = "auto",
  onDragEnd: i
}) {
  return /* @__PURE__ */ Z(
    "main",
    {
      className: "tc-canvas",
      "data-dotted": e || n || void 0,
      "data-color-mode": a !== "auto" ? a : void 0,
      children: Ct.map(t, (d, v) => {
        const x = Pt(d) ?? qt(d, v), w = Ht(d);
        return /* @__PURE__ */ Z(
          Bt,
          {
            gridSize: o,
            dragId: x,
            initialPosition: w,
            onDragEnd: i,
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
  Bt as Draggable,
  Pt as findDragId,
  qt as generateDragId,
  Ut as getQueue,
  Jt as refreshStorage,
  Lt as saveDrag,
  Ft as useResetCanvas
};

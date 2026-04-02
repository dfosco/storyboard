import { jsx as Z } from "react/jsx-runtime";
import St, { useRef as W, useState as B, useEffect as ut, Children as At, useCallback as Ct } from "react";
var st = { dragStart: !0 }, it = { delay: 0, distance: 3 };
function Mt(t, e = {}) {
  let n, o, { bounds: a, axis: s = "both", gpuAcceleration: f = !0, legacyTranslate: d = !1, transform: b, applyUserSelectHack: D = !0, disabled: w = !1, ignoreMultitouch: N = !1, recomputeBounds: E = st, grid: I, threshold: y = it, position: v, cancel: u, handle: m, defaultClass: i = "neodrag", defaultClassDragging: S = "neodrag-dragging", defaultClassDragged: A = "neodrag-dragged", defaultPosition: Dt = { x: 0, y: 0 }, onDragStart: wt, onDrag: xt, onDragEnd: Et } = e, L = !1, P = !1, dt = 0, Y = !1, H = !1, q = 0, T = 0, $ = 0, X = 0, G = 0, Q = 0, { x: _, y: J } = v ? { x: (v == null ? void 0 : v.x) ?? 0, y: (v == null ? void 0 : v.y) ?? 0 } : Dt;
  rt(_, J);
  let C, O, k, K, tt, gt = "", Nt = !!v;
  E = { ...st, ...E }, y = { ...it, ...y ?? {} };
  let j = /* @__PURE__ */ new Set();
  function pt(r) {
    L && !P && H && Y && tt && (P = !0, (function(c) {
      nt("neodrag:start", wt, c);
    })(r), R.add(S), D && (gt = et.userSelect, et.userSelect = "none"));
  }
  const et = document.body.style, R = t.classList;
  function rt(r = q, c = T) {
    if (!b) {
      if (d) {
        let p = `${+r}px, ${+c}px`;
        return U(t, "transform", f ? `translate3d(${p}, 0)` : `translate(${p})`);
      }
      return U(t, "translate", `${+r}px ${+c}px`);
    }
    const g = b({ offsetX: r, offsetY: c, rootNode: t });
    ct(g) && U(t, "transform", g);
  }
  function nt(r, c, g) {
    const p = /* @__PURE__ */ (function(h) {
      return { offsetX: q, offsetY: T, rootNode: t, currentNode: tt, event: h };
    })(g);
    t.dispatchEvent(new CustomEvent(r, { detail: p })), c == null || c(p);
  }
  const F = addEventListener, ot = new AbortController(), at = { signal: ot.signal, capture: !1 };
  function ht() {
    let r = t.offsetWidth / O.width;
    return isNaN(r) && (r = 1), r;
  }
  return U(t, "touch-action", "none"), F("pointerdown", ((r) => {
    if (w || r.button === 2) return;
    if (j.add(r.pointerId), N && j.size > 1) return r.preventDefault();
    if (E.dragStart && (C = lt(a, t)), ct(m) && ct(u) && m === u) throw new Error("`handle` selector can't be same as `cancel` selector");
    if (R.add(i), k = (function(l, x) {
      if (!l) return [x];
      if (ft(l)) return [l];
      if (Array.isArray(l)) return l;
      const M = x.querySelectorAll(l);
      if (M === null) throw new Error("Selector passed for `handle` option should be child of the element on which the action is applied");
      return Array.from(M.values());
    })(m, t), K = (function(l, x) {
      if (!l) return [];
      if (ft(l)) return [l];
      if (Array.isArray(l)) return l;
      const M = x.querySelectorAll(l);
      if (M === null) throw new Error("Selector passed for `cancel` option should be child of the element on which the action is applied");
      return Array.from(M.values());
    })(u, t), n = /(both|x)/.test(s), o = /(both|y)/.test(s), mt(K, k)) throw new Error("Element being dragged can't be a child of the element on which `cancel` is applied");
    const c = r.composedPath()[0];
    if (!k.some(((l) => {
      var x;
      return l.contains(c) || ((x = l.shadowRoot) == null ? void 0 : x.contains(c));
    })) || mt(K, [c])) return;
    tt = k.length === 1 ? t : k.find(((l) => l.contains(c))), L = !0, dt = Date.now(), y.delay || (Y = !0), O = t.getBoundingClientRect();
    const { clientX: g, clientY: p } = r, h = ht();
    n && ($ = g - _ / h), o && (X = p - J / h), C && (G = g - O.left, Q = p - O.top);
  }), at), F("pointermove", ((r) => {
    if (!L || N && j.size > 1) return;
    if (!P) {
      if (Y || Date.now() - dt >= y.delay && (Y = !0, pt(r)), !H) {
        const h = r.clientX - $, l = r.clientY - X;
        Math.sqrt(h ** 2 + l ** 2) >= y.distance && (H = !0, pt(r));
      }
      if (!P) return;
    }
    E.drag && (C = lt(a, t)), r.preventDefault(), O = t.getBoundingClientRect();
    let c = r.clientX, g = r.clientY;
    const p = ht();
    if (C) {
      const h = { left: C.left + G, top: C.top + Q, right: C.right + G - O.width, bottom: C.bottom + Q - O.height };
      c = yt(c, h.left, h.right), g = yt(g, h.top, h.bottom);
    }
    if (Array.isArray(I)) {
      let [h, l] = I;
      if (isNaN(+h) || h < 0) throw new Error("1st argument of `grid` must be a valid positive number");
      if (isNaN(+l) || l < 0) throw new Error("2nd argument of `grid` must be a valid positive number");
      let x = c - $, M = g - X;
      [x, M] = Rt([h / p, l / p], x, M), c = $ + x, g = X + M;
    }
    n && (q = Math.round((c - $) * p)), o && (T = Math.round((g - X) * p)), _ = q, J = T, nt("neodrag", xt, r), rt();
  }), at), F("pointerup", ((r) => {
    j.delete(r.pointerId), L && (P && (F("click", ((c) => c.stopPropagation()), { once: !0, signal: ot.signal, capture: !0 }), E.dragEnd && (C = lt(a, t)), R.remove(S), R.add(A), D && (et.userSelect = gt), nt("neodrag:end", Et, r), n && ($ = q), o && (X = T)), L = !1, P = !1, Y = !1, H = !1);
  }), at), { destroy: () => ot.abort(), update: (r) => {
    var g, p;
    s = r.axis || "both", w = r.disabled ?? !1, N = r.ignoreMultitouch ?? !1, m = r.handle, a = r.bounds, E = r.recomputeBounds ?? st, u = r.cancel, D = r.applyUserSelectHack ?? !0, I = r.grid, f = r.gpuAcceleration ?? !0, d = r.legacyTranslate ?? !1, b = r.transform, y = { ...it, ...r.threshold ?? {} };
    const c = R.contains(A);
    R.remove(i, A), i = r.defaultClass ?? "neodrag", S = r.defaultClassDragging ?? "neodrag-dragging", A = r.defaultClassDragged ?? "neodrag-dragged", R.add(i), c && R.add(A), Nt && (_ = q = ((g = r.position) == null ? void 0 : g.x) ?? q, J = T = ((p = r.position) == null ? void 0 : p.y) ?? T, rt());
  } };
}
var yt = (t, e, n) => Math.min(Math.max(t, e), n), ct = (t) => typeof t == "string", Rt = ([t, e], n, o) => {
  const a = (s, f) => f === 0 ? 0 : Math.ceil(s / f) * f;
  return [a(n, t), a(o, e)];
}, mt = (t, e) => t.some(((n) => e.some(((o) => n.contains(o)))));
function lt(t, e) {
  if (t === void 0) return;
  if (ft(t)) return t.getBoundingClientRect();
  if (typeof t == "object") {
    const { top: o = 0, left: a = 0, right: s = 0, bottom: f = 0 } = t;
    return { top: o, right: window.innerWidth - s, bottom: window.innerHeight - f, left: a };
  }
  if (t === "parent") return e.parentNode.getBoundingClientRect();
  const n = document.querySelector(t);
  if (n === null) throw new Error("The selector provided for bound doesn't exists in the document.");
  return n.getBoundingClientRect();
}
var U = (t, e, n) => t.style.setProperty(e, n), ft = (t) => t instanceof HTMLElement;
function z(t) {
  return t == null || typeof t == "string" || t instanceof HTMLElement ? t : "current" in t ? t.current : Array.isArray(t) ? t.map(((e) => e instanceof HTMLElement ? e : e.current)) : void 0;
}
function It(t, e = {}) {
  const n = W(), [o, a] = B(!1), [s, f] = B();
  let { onDragStart: d, onDrag: b, onDragEnd: D, handle: w, cancel: N } = e, E = z(w), I = z(N);
  function y(i, S) {
    f(i), S == null || S(i);
  }
  function v(i) {
    a(!0), y(i, d);
  }
  function u(i) {
    y(i, b);
  }
  function m(i) {
    a(!1), y(i, D);
  }
  return ut((() => {
    if (typeof window > "u") return;
    const i = t.current;
    if (!i) return;
    ({ onDragStart: d, onDrag: b, onDragEnd: D } = e);
    const { update: S, destroy: A } = Mt(i, { ...e, handle: E, cancel: I, onDragStart: v, onDrag: u, onDragEnd: m });
    return n.current = S, A;
  }), []), ut((() => {
    var i;
    (i = n.current) == null || i.call(n, { ...e, handle: z(w), cancel: z(N), onDragStart: v, onDrag: u, onDragEnd: m });
  }), [e]), { isDragging: o, dragState: s };
}
const qt = (t) => {
  if (!t) return null;
  let e = null;
  const n = (o) => {
    if (o.props && o.props.id) {
      e = o.props.id;
      return;
    }
    o.props && o.props.children && St.Children.forEach(o.props.children, n);
  };
  return n(t), e;
};
function Tt(t) {
  let e = 5381;
  for (let n = 0; n < t.length; n++)
    e = (e << 5) + e + t.charCodeAt(n) >>> 0;
  return e.toString(16).padStart(8, "0");
}
function bt(t) {
  var s;
  if (t == null || typeof t == "boolean") return "";
  if (typeof t == "string" || typeof t == "number") return "#text";
  const e = t.type, n = typeof e == "function" ? e.displayName || e.name || "Anonymous" : typeof e == "string" ? e : "Fragment", o = (s = t.props) == null ? void 0 : s.children;
  if (o == null) return n;
  const a = [];
  return St.Children.forEach(o, (f) => {
    const d = bt(f);
    d && a.push(d);
  }), a.length ? `${n}(${a.join(",")})` : n;
}
const Ot = (t, e) => {
  const n = bt(t);
  return `tc-${Tt(n)}-${e}`;
}, Ht = (t) => {
  try {
    return (JSON.parse(localStorage.getItem("tiny-canvas-queue")) || []).reduce((o, a) => (o[a.id] = { id: a.id, x: a.x, y: a.y }, o), {})[t] || { x: 0, y: 0 };
  } catch (e) {
    return console.error("Error getting saved coordinates:", e), { x: 0, y: 0 };
  }
}, _t = () => {
  try {
    localStorage.getItem("tiny-canvas-queue") || localStorage.setItem("tiny-canvas-queue", JSON.stringify([]));
  } catch (t) {
    console.error("LocalStorage is not available:", t);
  }
}, Pt = (t, e, n) => {
  try {
    const o = JSON.parse(localStorage.getItem("tiny-canvas-queue")) || [], a = (/* @__PURE__ */ new Date()).toISOString().replace(/[:.]/g, "-"), s = { id: t, x: e, y: n, time: a }, f = o.findIndex((d) => d.id === t);
    f >= 0 ? o[f] = s : o.push(s), localStorage.setItem("tiny-canvas-queue", JSON.stringify(o));
  } catch (o) {
    console.error("Error saving drag position:", o);
  }
}, $t = 250, vt = 4, Xt = 10, V = 1.5;
function Lt({ children: t, dragId: e, initialPosition: n, onDragEnd: o }) {
  const a = W(null), s = n || { x: 0, y: 0 }, f = W(s), d = W(!1), [b, D] = B(!1), [w, N] = B(s), [E, I] = B(
    () => Math.random() < 0.5 ? -V : V
  );
  ut(() => {
    const u = a.current;
    if (u && e && (s.x !== 0 || s.y !== 0)) {
      u.classList.add("tc-on-translation");
      const m = setTimeout(() => {
        u.classList.remove("tc-on-translation");
      }, $t * 4);
      return () => {
        clearTimeout(m);
      };
    }
  }, [e, s.x, s.y]);
  const { isDragging: y } = It(a, {
    axis: "both",
    threshold: { delay: 50, distance: 30 },
    defaultClass: "tc-drag",
    defaultClassDragging: "tc-on",
    defaultClassDragged: "tc-off",
    applyUserSelectHack: !0,
    position: { x: w.x, y: w.y },
    onDragStart: () => {
      f.current = w, d.current = !1, D(!1);
    },
    onDrag: ({ offsetX: u, offsetY: m }) => {
      const i = u - f.current.x, S = m - f.current.y, A = Math.hypot(i, S);
      !d.current && Math.hypot(i, S) >= vt && (d.current = !0), !b && A >= Xt && D(!0), N({ x: u, y: m });
    },
    onDragEnd: (u) => {
      N({ x: u.offsetX, y: u.offsetY }), I(Math.random() < 0.5 ? -V : V), D(!1);
      const m = u.offsetX - f.current.x, i = u.offsetY - f.current.y;
      (d.current || Math.hypot(m, i) >= vt) && (e && Pt(e, u.offsetX, u.offsetY), o == null || o(e, { x: u.offsetX, y: u.offsetY }));
    }
  }), v = y && b ? `${E}deg` : "0deg";
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
            transform: y ? `rotate(${v})` : void 0,
            transition: "transform ease-in-out 150ms"
          },
          children: t
        }
      )
    }
  );
}
function Yt(t) {
  var o, a;
  const e = Number((o = t == null ? void 0 : t.props) == null ? void 0 : o["data-tc-x"]), n = Number((a = t == null ? void 0 : t.props) == null ? void 0 : a["data-tc-y"]);
  return Number.isFinite(e) && Number.isFinite(n) ? { x: e, y: n } : null;
}
function Jt({
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
      children: At.map(t, (d, b) => {
        const D = qt(d) ?? Ot(d, b), w = Yt(d);
        return /* @__PURE__ */ Z(
          Lt,
          {
            gridSize: o,
            dragId: D,
            initialPosition: w,
            onDragEnd: s,
            children: d
          },
          b
        );
      })
    }
  );
}
function jt({ reload: t = !1 } = {}) {
  return Ct(() => {
    try {
      localStorage.removeItem("tiny-canvas-queue");
    } catch (e) {
      console.error("Error clearing canvas state:", e);
    }
    t && window.location.reload();
  }, [t]);
}
export {
  Jt as Canvas,
  Lt as Draggable,
  qt as findDragId,
  Ot as generateDragId,
  Ht as getQueue,
  _t as refreshStorage,
  Pt as saveDrag,
  jt as useResetCanvas
};

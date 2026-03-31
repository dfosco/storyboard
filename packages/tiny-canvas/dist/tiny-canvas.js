import { jsx as W } from "react/jsx-runtime";
import me, { useRef as le, useState as F, useEffect as Q, Children as Ee, useCallback as Ce } from "react";
var ae = { dragStart: !0 }, se = { delay: 0, distance: 3 };
function Ae(e, t = {}) {
  let n, o, { bounds: a, axis: l = "both", gpuAcceleration: c = !0, legacyTranslate: p = !1, transform: y, applyUserSelectHack: C = !0, disabled: u = !1, ignoreMultitouch: m = !1, recomputeBounds: S = ae, grid: B, threshold: w = se, position: v, cancel: N, handle: q, defaultClass: d = "neodrag", defaultClassDragging: D = "neodrag-dragging", defaultClassDragged: M = "neodrag-dragged", defaultPosition: be = { x: 0, y: 0 }, onDragStart: Se, onDrag: we, onDragEnd: De } = t, H = !1, T = !1, de = 0, X = !1, O = !1, R = 0, $ = 0, L = 0, k = 0, _ = 0, G = 0, { x: P, y: J } = v ? { x: (v == null ? void 0 : v.x) ?? 0, y: (v == null ? void 0 : v.y) ?? 0 } : be;
  te(P, J);
  let x, I, Y, K, Z, fe = "", xe = !!v;
  S = { ...ae, ...S }, w = { ...se, ...w ?? {} };
  let j = /* @__PURE__ */ new Set();
  function ge(r) {
    H && !T && O && X && Z && (T = !0, (function(s) {
      re("neodrag:start", Se, s);
    })(r), A.add(D), C && (fe = ee.userSelect, ee.userSelect = "none"));
  }
  const ee = document.body.style, A = e.classList;
  function te(r = R, s = $) {
    if (!y) {
      if (p) {
        let g = `${+r}px, ${+s}px`;
        return z(e, "transform", c ? `translate3d(${g}, 0)` : `translate(${g})`);
      }
      return z(e, "translate", `${+r}px ${+s}px`);
    }
    const f = y({ offsetX: r, offsetY: s, rootNode: e });
    ie(f) && z(e, "transform", f);
  }
  function re(r, s, f) {
    const g = /* @__PURE__ */ (function(h) {
      return { offsetX: R, offsetY: $, rootNode: e, currentNode: Z, event: h };
    })(f);
    e.dispatchEvent(new CustomEvent(r, { detail: g })), s == null || s(g);
  }
  const U = addEventListener, ne = new AbortController(), oe = { signal: ne.signal, capture: !1 };
  function pe() {
    let r = e.offsetWidth / I.width;
    return isNaN(r) && (r = 1), r;
  }
  return z(e, "touch-action", "none"), U("pointerdown", ((r) => {
    if (u || r.button === 2) return;
    if (j.add(r.pointerId), m && j.size > 1) return r.preventDefault();
    if (S.dragStart && (x = ce(a, e)), ie(q) && ie(N) && q === N) throw new Error("`handle` selector can't be same as `cancel` selector");
    if (A.add(d), Y = (function(i, b) {
      if (!i) return [b];
      if (ue(i)) return [i];
      if (Array.isArray(i)) return i;
      const E = b.querySelectorAll(i);
      if (E === null) throw new Error("Selector passed for `handle` option should be child of the element on which the action is applied");
      return Array.from(E.values());
    })(q, e), K = (function(i, b) {
      if (!i) return [];
      if (ue(i)) return [i];
      if (Array.isArray(i)) return i;
      const E = b.querySelectorAll(i);
      if (E === null) throw new Error("Selector passed for `cancel` option should be child of the element on which the action is applied");
      return Array.from(E.values());
    })(N, e), n = /(both|x)/.test(l), o = /(both|y)/.test(l), ye(K, Y)) throw new Error("Element being dragged can't be a child of the element on which `cancel` is applied");
    const s = r.composedPath()[0];
    if (!Y.some(((i) => {
      var b;
      return i.contains(s) || ((b = i.shadowRoot) == null ? void 0 : b.contains(s));
    })) || ye(K, [s])) return;
    Z = Y.length === 1 ? e : Y.find(((i) => i.contains(s))), H = !0, de = Date.now(), w.delay || (X = !0), I = e.getBoundingClientRect();
    const { clientX: f, clientY: g } = r, h = pe();
    n && (L = f - P / h), o && (k = g - J / h), x && (_ = f - I.left, G = g - I.top);
  }), oe), U("pointermove", ((r) => {
    if (!H || m && j.size > 1) return;
    if (!T) {
      if (X || Date.now() - de >= w.delay && (X = !0, ge(r)), !O) {
        const h = r.clientX - L, i = r.clientY - k;
        Math.sqrt(h ** 2 + i ** 2) >= w.distance && (O = !0, ge(r));
      }
      if (!T) return;
    }
    S.drag && (x = ce(a, e)), r.preventDefault(), I = e.getBoundingClientRect();
    let s = r.clientX, f = r.clientY;
    const g = pe();
    if (x) {
      const h = { left: x.left + _, top: x.top + G, right: x.right + _ - I.width, bottom: x.bottom + G - I.height };
      s = he(s, h.left, h.right), f = he(f, h.top, h.bottom);
    }
    if (Array.isArray(B)) {
      let [h, i] = B;
      if (isNaN(+h) || h < 0) throw new Error("1st argument of `grid` must be a valid positive number");
      if (isNaN(+i) || i < 0) throw new Error("2nd argument of `grid` must be a valid positive number");
      let b = s - L, E = f - k;
      [b, E] = Ne([h / g, i / g], b, E), s = L + b, f = k + E;
    }
    n && (R = Math.round((s - L) * g)), o && ($ = Math.round((f - k) * g)), P = R, J = $, re("neodrag", we, r), te();
  }), oe), U("pointerup", ((r) => {
    j.delete(r.pointerId), H && (T && (U("click", ((s) => s.stopPropagation()), { once: !0, signal: ne.signal, capture: !0 }), S.dragEnd && (x = ce(a, e)), A.remove(D), A.add(M), C && (ee.userSelect = fe), re("neodrag:end", De, r), n && (L = R), o && (k = $)), H = !1, T = !1, X = !1, O = !1);
  }), oe), { destroy: () => ne.abort(), update: (r) => {
    var f, g;
    l = r.axis || "both", u = r.disabled ?? !1, m = r.ignoreMultitouch ?? !1, q = r.handle, a = r.bounds, S = r.recomputeBounds ?? ae, N = r.cancel, C = r.applyUserSelectHack ?? !0, B = r.grid, c = r.gpuAcceleration ?? !0, p = r.legacyTranslate ?? !1, y = r.transform, w = { ...se, ...r.threshold ?? {} };
    const s = A.contains(M);
    A.remove(d, M), d = r.defaultClass ?? "neodrag", D = r.defaultClassDragging ?? "neodrag-dragging", M = r.defaultClassDragged ?? "neodrag-dragged", A.add(d), s && A.add(M), xe && (P = R = ((f = r.position) == null ? void 0 : f.x) ?? R, J = $ = ((g = r.position) == null ? void 0 : g.y) ?? $, te());
  } };
}
var he = (e, t, n) => Math.min(Math.max(e, t), n), ie = (e) => typeof e == "string", Ne = ([e, t], n, o) => {
  const a = (l, c) => c === 0 ? 0 : Math.ceil(l / c) * c;
  return [a(n, e), a(o, t)];
}, ye = (e, t) => e.some(((n) => t.some(((o) => n.contains(o)))));
function ce(e, t) {
  if (e === void 0) return;
  if (ue(e)) return e.getBoundingClientRect();
  if (typeof e == "object") {
    const { top: o = 0, left: a = 0, right: l = 0, bottom: c = 0 } = e;
    return { top: o, right: window.innerWidth - l, bottom: window.innerHeight - c, left: a };
  }
  if (e === "parent") return t.parentNode.getBoundingClientRect();
  const n = document.querySelector(e);
  if (n === null) throw new Error("The selector provided for bound doesn't exists in the document.");
  return n.getBoundingClientRect();
}
var z = (e, t, n) => e.style.setProperty(t, n), ue = (e) => e instanceof HTMLElement;
function V(e) {
  return e == null || typeof e == "string" || e instanceof HTMLElement ? e : "current" in e ? e.current : Array.isArray(e) ? e.map(((t) => t instanceof HTMLElement ? t : t.current)) : void 0;
}
function qe(e, t = {}) {
  const n = le(), [o, a] = F(!1), [l, c] = F();
  let { onDragStart: p, onDrag: y, onDragEnd: C, handle: u, cancel: m } = t, S = V(u), B = V(m);
  function w(d, D) {
    c(d), D == null || D(d);
  }
  function v(d) {
    a(!0), w(d, p);
  }
  function N(d) {
    w(d, y);
  }
  function q(d) {
    a(!1), w(d, C);
  }
  return Q((() => {
    if (typeof window > "u") return;
    const d = e.current;
    if (!d) return;
    ({ onDragStart: p, onDrag: y, onDragEnd: C } = t);
    const { update: D, destroy: M } = Ae(d, { ...t, handle: S, cancel: B, onDragStart: v, onDrag: N, onDragEnd: q });
    return n.current = D, M;
  }), []), Q((() => {
    var d;
    (d = n.current) == null || d.call(n, { ...t, handle: V(u), cancel: V(m), onDragStart: v, onDrag: N, onDragEnd: q });
  }), [t]), { isDragging: o, dragState: l };
}
const Me = (e) => {
  if (!e) return null;
  let t = null;
  const n = (o) => {
    if (o.props && o.props.id) {
      t = o.props.id;
      return;
    }
    o.props && o.props.children && me.Children.forEach(o.props.children, n);
  };
  return n(e), t;
};
function Re(e) {
  let t = 5381;
  for (let n = 0; n < e.length; n++)
    t = (t << 5) + t + e.charCodeAt(n) >>> 0;
  return t.toString(16).padStart(8, "0");
}
function ve(e) {
  var l;
  if (e == null || typeof e == "boolean") return "";
  if (typeof e == "string" || typeof e == "number") return "#text";
  const t = e.type, n = typeof t == "function" ? t.displayName || t.name || "Anonymous" : typeof t == "string" ? t : "Fragment", o = (l = e.props) == null ? void 0 : l.children;
  if (o == null) return n;
  const a = [];
  return me.Children.forEach(o, (c) => {
    const p = ve(c);
    p && a.push(p);
  }), a.length ? `${n}(${a.join(",")})` : n;
}
const $e = (e, t) => {
  const n = ve(e);
  return `tc-${Re(n)}-${t}`;
}, Ie = (e) => {
  try {
    return (JSON.parse(localStorage.getItem("tiny-canvas-queue")) || []).reduce((o, a) => (o[a.id] = { id: a.id, x: a.x, y: a.y }, o), {})[e] || { x: 0, y: 0 };
  } catch (t) {
    return console.error("Error getting saved coordinates:", t), { x: 0, y: 0 };
  }
}, Te = () => {
  try {
    localStorage.getItem("tiny-canvas-queue") || localStorage.setItem("tiny-canvas-queue", JSON.stringify([]));
  } catch (e) {
    console.error("LocalStorage is not available:", e);
  }
}, Le = (e, t, n) => {
  try {
    const o = JSON.parse(localStorage.getItem("tiny-canvas-queue")) || [], a = (/* @__PURE__ */ new Date()).toISOString().replace(/[:.]/g, "-"), l = { id: e, x: t, y: n, time: a }, c = o.findIndex((p) => p.id === e);
    c >= 0 ? o[c] = l : o.push(l), localStorage.setItem("tiny-canvas-queue", JSON.stringify(o));
  } catch (o) {
    console.error("Error saving drag position:", o);
  }
}, ke = 250;
function Be({ children: e, dragId: t }) {
  const n = le(null), o = le(Ie(t)), [a, l] = F({ x: 0, y: 0 }), [c, p] = F(
    () => Math.random() < 0.5 ? -0.5 : 0.5
  );
  Q(() => {
    const u = n.current, m = o.current;
    if (u && t && m && (m.x !== 0 || m.y !== 0)) {
      u.classList.add("tc-on-translation");
      const S = setTimeout(() => {
        u.classList.remove("tc-on-translation");
      }, ke * 4);
      return () => {
        clearTimeout(S);
      };
    }
  }, [t]), Q(() => {
    Te();
    const u = o.current;
    n.current && u && l({ x: u.x, y: u.y });
  }, []);
  const { isDragging: y } = qe(n, {
    axis: "both",
    threshold: { delay: 50, distance: 30 },
    defaultClass: "tc-drag",
    defaultClassDragging: "tc-on",
    defaultClassDragged: "tc-off",
    applyUserSelectHack: !0,
    position: { x: a.x, y: a.y },
    onDrag: ({ offsetX: u, offsetY: m }) => l({ x: u, y: m }),
    onDragEnd: (u) => {
      l({ x: u.offsetX, y: u.offsetY }), p(Math.random() < 0.5 ? -0.5 : 0.5), t !== null && Le(t, u.offsetX, u.offsetY);
    }
  }), C = y ? `${c}deg` : "0deg";
  return /* @__PURE__ */ W(
    "article",
    {
      ref: n,
      style: { cursor: y ? "grabbing" : "grab" },
      children: /* @__PURE__ */ W(
        "div",
        {
          className: "tc-draggable-inner",
          style: {
            transform: y ? `rotate(${C})` : void 0,
            transition: "transform ease-in-out 150ms"
          },
          children: e
        }
      )
    }
  );
}
function Ye({
  children: e,
  dotted: t = !1,
  grid: n = !1,
  gridSize: o,
  colorMode: a = "auto"
}) {
  return /* @__PURE__ */ W(
    "main",
    {
      className: "tc-canvas",
      "data-dotted": t || n || void 0,
      "data-color-mode": a !== "auto" ? a : void 0,
      children: Ee.map(e, (c, p) => {
        const y = Me(c) ?? $e(c, p);
        return /* @__PURE__ */ W(Be, { gridSize: o, dragId: y, children: c }, p);
      })
    }
  );
}
function Oe({ reload: e = !1 } = {}) {
  return Ce(() => {
    try {
      localStorage.removeItem("tiny-canvas-queue");
    } catch (t) {
      console.error("Error clearing canvas state:", t);
    }
    e && window.location.reload();
  }, [e]);
}
export {
  Ye as Canvas,
  Be as Draggable,
  Me as findDragId,
  $e as generateDragId,
  Ie as getQueue,
  Te as refreshStorage,
  Le as saveDrag,
  Oe as useResetCanvas
};

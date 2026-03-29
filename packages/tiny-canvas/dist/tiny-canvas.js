import { jsx as V } from "react/jsx-runtime";
import me, { useRef as le, useState as Y, useEffect as P, Children as Ee, useCallback as Ce } from "react";
var ae = { dragStart: !0 }, se = { delay: 0, distance: 3 };
function Ae(e, t = {}) {
  let r, o, { bounds: a, axis: c = "both", gpuAcceleration: u = !0, legacyTranslate: p = !1, transform: v, applyUserSelectHack: b = !0, disabled: D = !1, ignoreMultitouch: w = !1, recomputeBounds: m = ae, grid: N, threshold: l = se, position: h, cancel: q, handle: I, defaultClass: d = "neodrag", defaultClassDragging: x = "neodrag-dragging", defaultClassDragged: M = "neodrag-dragged", defaultPosition: be = { x: 0, y: 0 }, onDragStart: Se, onDrag: De, onDragEnd: we } = t, H = !1, L = !1, de = 0, O = !1, j = !1, R = 0, T = 0, k = 0, B = 0, W = 0, Q = 0, { x: J, y: U } = h ? { x: (h == null ? void 0 : h.x) ?? 0, y: (h == null ? void 0 : h.y) ?? 0 } : be;
  te(J, U);
  let E, $, X, Z, K, fe = "", xe = !!h;
  m = { ...ae, ...m }, l = { ...se, ...l ?? {} };
  let G = /* @__PURE__ */ new Set();
  function ge(n) {
    H && !L && j && O && K && (L = !0, (function(s) {
      ne("neodrag:start", Se, s);
    })(n), A.add(x), b && (fe = ee.userSelect, ee.userSelect = "none"));
  }
  const ee = document.body.style, A = e.classList;
  function te(n = R, s = T) {
    if (!v) {
      if (p) {
        let g = `${+n}px, ${+s}px`;
        return z(e, "transform", u ? `translate3d(${g}, 0)` : `translate(${g})`);
      }
      return z(e, "translate", `${+n}px ${+s}px`);
    }
    const f = v({ offsetX: n, offsetY: s, rootNode: e });
    ie(f) && z(e, "transform", f);
  }
  function ne(n, s, f) {
    const g = /* @__PURE__ */ (function(y) {
      return { offsetX: R, offsetY: T, rootNode: e, currentNode: K, event: y };
    })(f);
    e.dispatchEvent(new CustomEvent(n, { detail: g })), s == null || s(g);
  }
  const _ = addEventListener, re = new AbortController(), oe = { signal: re.signal, capture: !1 };
  function pe() {
    let n = e.offsetWidth / $.width;
    return isNaN(n) && (n = 1), n;
  }
  return z(e, "touch-action", "none"), _("pointerdown", ((n) => {
    if (D || n.button === 2) return;
    if (G.add(n.pointerId), w && G.size > 1) return n.preventDefault();
    if (m.dragStart && (E = ce(a, e)), ie(I) && ie(q) && I === q) throw new Error("`handle` selector can't be same as `cancel` selector");
    if (A.add(d), X = (function(i, S) {
      if (!i) return [S];
      if (ue(i)) return [i];
      if (Array.isArray(i)) return i;
      const C = S.querySelectorAll(i);
      if (C === null) throw new Error("Selector passed for `handle` option should be child of the element on which the action is applied");
      return Array.from(C.values());
    })(I, e), Z = (function(i, S) {
      if (!i) return [];
      if (ue(i)) return [i];
      if (Array.isArray(i)) return i;
      const C = S.querySelectorAll(i);
      if (C === null) throw new Error("Selector passed for `cancel` option should be child of the element on which the action is applied");
      return Array.from(C.values());
    })(q, e), r = /(both|x)/.test(c), o = /(both|y)/.test(c), ye(Z, X)) throw new Error("Element being dragged can't be a child of the element on which `cancel` is applied");
    const s = n.composedPath()[0];
    if (!X.some(((i) => {
      var S;
      return i.contains(s) || ((S = i.shadowRoot) == null ? void 0 : S.contains(s));
    })) || ye(Z, [s])) return;
    K = X.length === 1 ? e : X.find(((i) => i.contains(s))), H = !0, de = Date.now(), l.delay || (O = !0), $ = e.getBoundingClientRect();
    const { clientX: f, clientY: g } = n, y = pe();
    r && (k = f - J / y), o && (B = g - U / y), E && (W = f - $.left, Q = g - $.top);
  }), oe), _("pointermove", ((n) => {
    if (!H || w && G.size > 1) return;
    if (!L) {
      if (O || Date.now() - de >= l.delay && (O = !0, ge(n)), !j) {
        const y = n.clientX - k, i = n.clientY - B;
        Math.sqrt(y ** 2 + i ** 2) >= l.distance && (j = !0, ge(n));
      }
      if (!L) return;
    }
    m.drag && (E = ce(a, e)), n.preventDefault(), $ = e.getBoundingClientRect();
    let s = n.clientX, f = n.clientY;
    const g = pe();
    if (E) {
      const y = { left: E.left + W, top: E.top + Q, right: E.right + W - $.width, bottom: E.bottom + Q - $.height };
      s = he(s, y.left, y.right), f = he(f, y.top, y.bottom);
    }
    if (Array.isArray(N)) {
      let [y, i] = N;
      if (isNaN(+y) || y < 0) throw new Error("1st argument of `grid` must be a valid positive number");
      if (isNaN(+i) || i < 0) throw new Error("2nd argument of `grid` must be a valid positive number");
      let S = s - k, C = f - B;
      [S, C] = Ne([y / g, i / g], S, C), s = k + S, f = B + C;
    }
    r && (R = Math.round((s - k) * g)), o && (T = Math.round((f - B) * g)), J = R, U = T, ne("neodrag", De, n), te();
  }), oe), _("pointerup", ((n) => {
    G.delete(n.pointerId), H && (L && (_("click", ((s) => s.stopPropagation()), { once: !0, signal: re.signal, capture: !0 }), m.dragEnd && (E = ce(a, e)), A.remove(x), A.add(M), b && (ee.userSelect = fe), ne("neodrag:end", we, n), r && (k = R), o && (B = T)), H = !1, L = !1, O = !1, j = !1);
  }), oe), { destroy: () => re.abort(), update: (n) => {
    var f, g;
    c = n.axis || "both", D = n.disabled ?? !1, w = n.ignoreMultitouch ?? !1, I = n.handle, a = n.bounds, m = n.recomputeBounds ?? ae, q = n.cancel, b = n.applyUserSelectHack ?? !0, N = n.grid, u = n.gpuAcceleration ?? !0, p = n.legacyTranslate ?? !1, v = n.transform, l = { ...se, ...n.threshold ?? {} };
    const s = A.contains(M);
    A.remove(d, M), d = n.defaultClass ?? "neodrag", x = n.defaultClassDragging ?? "neodrag-dragging", M = n.defaultClassDragged ?? "neodrag-dragged", A.add(d), s && A.add(M), xe && (J = R = ((f = n.position) == null ? void 0 : f.x) ?? R, U = T = ((g = n.position) == null ? void 0 : g.y) ?? T, te());
  } };
}
var he = (e, t, r) => Math.min(Math.max(e, t), r), ie = (e) => typeof e == "string", Ne = ([e, t], r, o) => {
  const a = (c, u) => u === 0 ? 0 : Math.ceil(c / u) * u;
  return [a(r, e), a(o, t)];
}, ye = (e, t) => e.some(((r) => t.some(((o) => r.contains(o)))));
function ce(e, t) {
  if (e === void 0) return;
  if (ue(e)) return e.getBoundingClientRect();
  if (typeof e == "object") {
    const { top: o = 0, left: a = 0, right: c = 0, bottom: u = 0 } = e;
    return { top: o, right: window.innerWidth - c, bottom: window.innerHeight - u, left: a };
  }
  if (e === "parent") return t.parentNode.getBoundingClientRect();
  const r = document.querySelector(e);
  if (r === null) throw new Error("The selector provided for bound doesn't exists in the document.");
  return r.getBoundingClientRect();
}
var z = (e, t, r) => e.style.setProperty(t, r), ue = (e) => e instanceof HTMLElement;
function F(e) {
  return e == null || typeof e == "string" || e instanceof HTMLElement ? e : "current" in e ? e.current : Array.isArray(e) ? e.map(((t) => t instanceof HTMLElement ? t : t.current)) : void 0;
}
function qe(e, t = {}) {
  const r = le(), [o, a] = Y(!1), [c, u] = Y();
  let { onDragStart: p, onDrag: v, onDragEnd: b, handle: D, cancel: w } = t, m = F(D), N = F(w);
  function l(d, x) {
    u(d), x == null || x(d);
  }
  function h(d) {
    a(!0), l(d, p);
  }
  function q(d) {
    l(d, v);
  }
  function I(d) {
    a(!1), l(d, b);
  }
  return P((() => {
    if (typeof window > "u") return;
    const d = e.current;
    if (!d) return;
    ({ onDragStart: p, onDrag: v, onDragEnd: b } = t);
    const { update: x, destroy: M } = Ae(d, { ...t, handle: m, cancel: N, onDragStart: h, onDrag: q, onDragEnd: I });
    return r.current = x, M;
  }), []), P((() => {
    var d;
    (d = r.current) == null || d.call(r, { ...t, handle: F(D), cancel: F(w), onDragStart: h, onDrag: q, onDragEnd: I });
  }), [t]), { isDragging: o, dragState: c };
}
const Ie = (e) => {
  if (!e) return null;
  let t = null;
  const r = (o) => {
    if (o.props && o.props.id) {
      t = o.props.id;
      return;
    }
    o.props && o.props.children && me.Children.forEach(o.props.children, r);
  };
  return r(e), t;
};
function Me(e) {
  let t = 5381;
  for (let r = 0; r < e.length; r++)
    t = (t << 5) + t + e.charCodeAt(r) >>> 0;
  return t.toString(16).padStart(8, "0");
}
function ve(e) {
  var c;
  if (e == null || typeof e == "boolean") return "";
  if (typeof e == "string" || typeof e == "number") return "#text";
  const t = e.type, r = typeof t == "function" ? t.displayName || t.name || "Anonymous" : typeof t == "string" ? t : "Fragment", o = (c = e.props) == null ? void 0 : c.children;
  if (o == null) return r;
  const a = [];
  return me.Children.forEach(o, (u) => {
    const p = ve(u);
    p && a.push(p);
  }), a.length ? `${r}(${a.join(",")})` : r;
}
const Re = (e, t) => {
  const r = ve(e);
  return `tc-${Me(r)}-${t}`;
}, Te = (e) => {
  try {
    return (JSON.parse(localStorage.getItem("tiny-canvas-queue")) || []).reduce((o, a) => (o[a.id] = { id: a.id, x: a.x, y: a.y }, o), {})[e] || { x: 0, y: 0 };
  } catch (t) {
    return console.error("Error getting saved coordinates:", t), { x: 0, y: 0 };
  }
}, $e = () => {
  try {
    localStorage.getItem("tiny-canvas-queue") || localStorage.setItem("tiny-canvas-queue", JSON.stringify([]));
  } catch (e) {
    console.error("LocalStorage is not available:", e);
  }
}, Le = (e, t, r) => {
  try {
    const o = JSON.parse(localStorage.getItem("tiny-canvas-queue")) || [], a = (/* @__PURE__ */ new Date()).toISOString().replace(/[:.]/g, "-"), c = { id: e, x: t, y: r, time: a }, u = o.findIndex((p) => p.id === e);
    u >= 0 ? o[u] = c : o.push(c), localStorage.setItem("tiny-canvas-queue", JSON.stringify(o));
  } catch (o) {
    console.error("Error saving drag position:", o);
  }
}, ke = 250;
function Be({ children: e, gridSize: t, dragId: r }) {
  const o = le(null), a = le(Te(r)).current, [c, u] = Y(!1), [p, v] = Y({ x: 0, y: 0 }), [b, D] = Y(
    Math.random() < 0.5 ? -2 : 2
  );
  P(() => {
    const l = o.current;
    if (l && r && a && (a.x !== 0 || a.y !== 0)) {
      l.classList.add("tc-on-translation"), u(!0);
      const h = setTimeout(() => {
        l.classList.remove("tc-on-translation"), u(!1);
      }, ke * 4);
      return () => clearTimeout(h);
    }
  }, []), P(() => {
    $e(), o.current && a && v({ x: a.x, y: a.y });
  }, [a]);
  const w = t !== void 0 ? [t, t] : void 0, { isDragging: m } = qe(o, {
    axis: "both",
    grid: w,
    bounds: "body",
    threshold: { delay: 50, distance: 30 },
    defaultClass: "tc-drag",
    defaultClassDragging: "tc-on",
    defaultClassDragged: "tc-off",
    applyUserSelectHack: !0,
    position: { x: p.x, y: p.y },
    onDrag: ({ offsetX: l, offsetY: h }) => v({ x: l, y: h }),
    onDragEnd: (l) => {
      r !== null && (v({ x: l.offsetX, y: l.offsetY }), Le(r, l.offsetX, l.offsetY));
    }
  }), N = m || c ? `${b}deg` : "0deg";
  return P(() => {
    D(Math.random() < 0.5 ? -2 : 2);
  }, [m]), /* @__PURE__ */ V(
    "article",
    {
      ref: o,
      style: { cursor: m ? "grabbing" : "grab" },
      children: /* @__PURE__ */ V(
        "div",
        {
          className: "tc-draggable-inner",
          style: {
            transform: m || c ? `rotate(${N})` : void 0,
            transition: "transform ease-in-out 150ms"
          },
          children: e
        }
      )
    }
  );
}
const He = 18;
function Ye({
  children: e,
  centered: t = !0,
  dotted: r = !1,
  grid: o = !1,
  gridSize: a = He,
  colorMode: c = "auto"
}) {
  const u = t ? {
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
    alignItems: "center",
    justifyContent: "center"
  } : null, p = r || o, v = o ? a : void 0;
  return /* @__PURE__ */ V(
    "main",
    {
      className: "tc-canvas",
      style: u,
      "data-dotted": p || void 0,
      "data-color-mode": c !== "auto" ? c : void 0,
      children: Ee.map(e, (b, D) => {
        const w = Ie(b) ?? Re(b, D);
        return /* @__PURE__ */ V(Be, { gridSize: v, dragId: w, children: b }, D);
      })
    }
  );
}
function Pe({ reload: e = !1 } = {}) {
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
  Ie as findDragId,
  Re as generateDragId,
  Te as getQueue,
  $e as refreshStorage,
  Le as saveDrag,
  Pe as useResetCanvas
};

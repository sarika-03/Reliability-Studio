import { AppPlugin as wt } from "@grafana/data";
import er, { useState as Y, useEffect as Ie, useCallback as St } from "react";
import { useTheme2 as kt, useStyles2 as jt } from "@grafana/ui";
var Xe = { exports: {} }, me = {};
/**
 * @license React
 * react-jsx-runtime.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var Cr;
function Et() {
  if (Cr)
    return me;
  Cr = 1;
  var e = er, r = Symbol.for("react.element"), n = Symbol.for("react.fragment"), i = Object.prototype.hasOwnProperty, a = e.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentOwner, s = { key: !0, ref: !0, __self: !0, __source: !0 };
  function f(l, p, m) {
    var u, h = {}, k = null, y = null;
    m !== void 0 && (k = "" + m), p.key !== void 0 && (k = "" + p.key), p.ref !== void 0 && (y = p.ref);
    for (u in p)
      i.call(p, u) && !s.hasOwnProperty(u) && (h[u] = p[u]);
    if (l && l.defaultProps)
      for (u in p = l.defaultProps, p)
        h[u] === void 0 && (h[u] = p[u]);
    return { $$typeof: r, type: l, key: k, ref: y, props: h, _owner: a.current };
  }
  return me.Fragment = n, me.jsx = f, me.jsxs = f, me;
}
var xe = {};
/**
 * @license React
 * react-jsx-runtime.development.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var Rr;
function Ct() {
  return Rr || (Rr = 1, {}.NODE_ENV !== "production" && function() {
    var e = er, r = Symbol.for("react.element"), n = Symbol.for("react.portal"), i = Symbol.for("react.fragment"), a = Symbol.for("react.strict_mode"), s = Symbol.for("react.profiler"), f = Symbol.for("react.provider"), l = Symbol.for("react.context"), p = Symbol.for("react.forward_ref"), m = Symbol.for("react.suspense"), u = Symbol.for("react.suspense_list"), h = Symbol.for("react.memo"), k = Symbol.for("react.lazy"), y = Symbol.for("react.offscreen"), T = Symbol.iterator, v = "@@iterator";
    function P(t) {
      if (t === null || typeof t != "object")
        return null;
      var c = T && t[T] || t[v];
      return typeof c == "function" ? c : null;
    }
    var S = e.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED;
    function b(t) {
      {
        for (var c = arguments.length, d = new Array(c > 1 ? c - 1 : 0), w = 1; w < c; w++)
          d[w - 1] = arguments[w];
        H("error", t, d);
      }
    }
    function H(t, c, d) {
      {
        var w = S.ReactDebugCurrentFrame, _ = w.getStackAddendum();
        _ !== "" && (c += "%s", d = d.concat([_]));
        var D = d.map(function($) {
          return String($);
        });
        D.unshift("Warning: " + c), Function.prototype.apply.call(console[t], console, D);
      }
    }
    var L = !1, N = !1, q = !1, I = !1, ke = !1, ce;
    ce = Symbol.for("react.module.reference");
    function ze(t) {
      return !!(typeof t == "string" || typeof t == "function" || t === i || t === s || ke || t === a || t === m || t === u || I || t === y || L || N || q || typeof t == "object" && t !== null && (t.$$typeof === k || t.$$typeof === h || t.$$typeof === f || t.$$typeof === l || t.$$typeof === p || // This needs to include all possible module reference object
      // types supported by any Flight configuration anywhere since
      // we don't know which Flight build this will end up being used
      // with.
      t.$$typeof === ce || t.getModuleId !== void 0));
    }
    function Me(t, c, d) {
      var w = t.displayName;
      if (w)
        return w;
      var _ = c.displayName || c.name || "";
      return _ !== "" ? d + "(" + _ + ")" : d;
    }
    function g(t) {
      return t.displayName || "Context";
    }
    function x(t) {
      if (t == null)
        return null;
      if (typeof t.tag == "number" && b("Received an unexpected object in getComponentNameFromType(). This is likely a bug in React. Please file an issue."), typeof t == "function")
        return t.displayName || t.name || null;
      if (typeof t == "string")
        return t;
      switch (t) {
        case i:
          return "Fragment";
        case n:
          return "Portal";
        case s:
          return "Profiler";
        case a:
          return "StrictMode";
        case m:
          return "Suspense";
        case u:
          return "SuspenseList";
      }
      if (typeof t == "object")
        switch (t.$$typeof) {
          case l:
            var c = t;
            return g(c) + ".Consumer";
          case f:
            var d = t;
            return g(d._context) + ".Provider";
          case p:
            return Me(t, t.render, "ForwardRef");
          case h:
            var w = t.displayName || null;
            return w !== null ? w : x(t.type) || "Memo";
          case k: {
            var _ = t, D = _._payload, $ = _._init;
            try {
              return x($(D));
            } catch {
              return null;
            }
          }
        }
      return null;
    }
    var j = Object.assign, ie = 0, ar, or, ir, sr, cr, lr, dr;
    function ur() {
    }
    ur.__reactDisabledLog = !0;
    function Gr() {
      {
        if (ie === 0) {
          ar = console.log, or = console.info, ir = console.warn, sr = console.error, cr = console.group, lr = console.groupCollapsed, dr = console.groupEnd;
          var t = {
            configurable: !0,
            enumerable: !0,
            value: ur,
            writable: !0
          };
          Object.defineProperties(console, {
            info: t,
            log: t,
            warn: t,
            error: t,
            group: t,
            groupCollapsed: t,
            groupEnd: t
          });
        }
        ie++;
      }
    }
    function Jr() {
      {
        if (ie--, ie === 0) {
          var t = {
            configurable: !0,
            enumerable: !0,
            writable: !0
          };
          Object.defineProperties(console, {
            log: j({}, t, {
              value: ar
            }),
            info: j({}, t, {
              value: or
            }),
            warn: j({}, t, {
              value: ir
            }),
            error: j({}, t, {
              value: sr
            }),
            group: j({}, t, {
              value: cr
            }),
            groupCollapsed: j({}, t, {
              value: lr
            }),
            groupEnd: j({}, t, {
              value: dr
            })
          });
        }
        ie < 0 && b("disabledDepth fell below zero. This is a bug in React. Please file an issue.");
      }
    }
    var We = S.ReactCurrentDispatcher, Be;
    function je(t, c, d) {
      {
        if (Be === void 0)
          try {
            throw Error();
          } catch (_) {
            var w = _.stack.trim().match(/\n( *(at )?)/);
            Be = w && w[1] || "";
          }
        return `
` + Be + t;
      }
    }
    var Le = !1, Ee;
    {
      var Kr = typeof WeakMap == "function" ? WeakMap : Map;
      Ee = new Kr();
    }
    function fr(t, c) {
      if (!t || Le)
        return "";
      {
        var d = Ee.get(t);
        if (d !== void 0)
          return d;
      }
      var w;
      Le = !0;
      var _ = Error.prepareStackTrace;
      Error.prepareStackTrace = void 0;
      var D;
      D = We.current, We.current = null, Gr();
      try {
        if (c) {
          var $ = function() {
            throw Error();
          };
          if (Object.defineProperty($.prototype, "props", {
            set: function() {
              throw Error();
            }
          }), typeof Reflect == "object" && Reflect.construct) {
            try {
              Reflect.construct($, []);
            } catch (J) {
              w = J;
            }
            Reflect.construct(t, [], $);
          } else {
            try {
              $.call();
            } catch (J) {
              w = J;
            }
            t.call($.prototype);
          }
        } else {
          try {
            throw Error();
          } catch (J) {
            w = J;
          }
          t();
        }
      } catch (J) {
        if (J && w && typeof J.stack == "string") {
          for (var C = J.stack.split(`
`), G = w.stack.split(`
`), z = C.length - 1, W = G.length - 1; z >= 1 && W >= 0 && C[z] !== G[W]; )
            W--;
          for (; z >= 1 && W >= 0; z--, W--)
            if (C[z] !== G[W]) {
              if (z !== 1 || W !== 1)
                do
                  if (z--, W--, W < 0 || C[z] !== G[W]) {
                    var Q = `
` + C[z].replace(" at new ", " at ");
                    return t.displayName && Q.includes("<anonymous>") && (Q = Q.replace("<anonymous>", t.displayName)), typeof t == "function" && Ee.set(t, Q), Q;
                  }
                while (z >= 1 && W >= 0);
              break;
            }
        }
      } finally {
        Le = !1, We.current = D, Jr(), Error.prepareStackTrace = _;
      }
      var de = t ? t.displayName || t.name : "", se = de ? je(de) : "";
      return typeof t == "function" && Ee.set(t, se), se;
    }
    function Xr(t, c, d) {
      return fr(t, !1);
    }
    function Zr(t) {
      var c = t.prototype;
      return !!(c && c.isReactComponent);
    }
    function Ce(t, c, d) {
      if (t == null)
        return "";
      if (typeof t == "function")
        return fr(t, Zr(t));
      if (typeof t == "string")
        return je(t);
      switch (t) {
        case m:
          return je("Suspense");
        case u:
          return je("SuspenseList");
      }
      if (typeof t == "object")
        switch (t.$$typeof) {
          case p:
            return Xr(t.render);
          case h:
            return Ce(t.type, c, d);
          case k: {
            var w = t, _ = w._payload, D = w._init;
            try {
              return Ce(D(_), c, d);
            } catch {
            }
          }
        }
      return "";
    }
    var he = Object.prototype.hasOwnProperty, pr = {}, hr = S.ReactDebugCurrentFrame;
    function Re(t) {
      if (t) {
        var c = t._owner, d = Ce(t.type, t._source, c ? c.type : null);
        hr.setExtraStackFrame(d);
      } else
        hr.setExtraStackFrame(null);
    }
    function Qr(t, c, d, w, _) {
      {
        var D = Function.call.bind(he);
        for (var $ in t)
          if (D(t, $)) {
            var C = void 0;
            try {
              if (typeof t[$] != "function") {
                var G = Error((w || "React class") + ": " + d + " type `" + $ + "` is invalid; it must be a function, usually from the `prop-types` package, but received `" + typeof t[$] + "`.This often happens because of typos such as `PropTypes.function` instead of `PropTypes.func`.");
                throw G.name = "Invariant Violation", G;
              }
              C = t[$](c, $, w, d, null, "SECRET_DO_NOT_PASS_THIS_OR_YOU_WILL_BE_FIRED");
            } catch (z) {
              C = z;
            }
            C && !(C instanceof Error) && (Re(_), b("%s: type specification of %s `%s` is invalid; the type checker function must return `null` or an `Error` but returned a %s. You may have forgotten to pass an argument to the type checker creator (arrayOf, instanceOf, objectOf, oneOf, oneOfType, and shape all require an argument).", w || "React class", d, $, typeof C), Re(null)), C instanceof Error && !(C.message in pr) && (pr[C.message] = !0, Re(_), b("Failed %s type: %s", d, C.message), Re(null));
          }
      }
    }
    var et = Array.isArray;
    function Ye(t) {
      return et(t);
    }
    function rt(t) {
      {
        var c = typeof Symbol == "function" && Symbol.toStringTag, d = c && t[Symbol.toStringTag] || t.constructor.name || "Object";
        return d;
      }
    }
    function tt(t) {
      try {
        return gr(t), !1;
      } catch {
        return !0;
      }
    }
    function gr(t) {
      return "" + t;
    }
    function mr(t) {
      if (tt(t))
        return b("The provided key is an unsupported type %s. This value must be coerced to a string before before using it here.", rt(t)), gr(t);
    }
    var ge = S.ReactCurrentOwner, nt = {
      key: !0,
      ref: !0,
      __self: !0,
      __source: !0
    }, xr, yr, He;
    He = {};
    function at(t) {
      if (he.call(t, "ref")) {
        var c = Object.getOwnPropertyDescriptor(t, "ref").get;
        if (c && c.isReactWarning)
          return !1;
      }
      return t.ref !== void 0;
    }
    function ot(t) {
      if (he.call(t, "key")) {
        var c = Object.getOwnPropertyDescriptor(t, "key").get;
        if (c && c.isReactWarning)
          return !1;
      }
      return t.key !== void 0;
    }
    function it(t, c) {
      if (typeof t.ref == "string" && ge.current && c && ge.current.stateNode !== c) {
        var d = x(ge.current.type);
        He[d] || (b('Component "%s" contains the string ref "%s". Support for string refs will be removed in a future major release. This case cannot be automatically converted to an arrow function. We ask you to manually fix this case by using useRef() or createRef() instead. Learn more about using refs safely here: https://reactjs.org/link/strict-mode-string-ref', x(ge.current.type), t.ref), He[d] = !0);
      }
    }
    function st(t, c) {
      {
        var d = function() {
          xr || (xr = !0, b("%s: `key` is not a prop. Trying to access it will result in `undefined` being returned. If you need to access the same value within the child component, you should pass it as a different prop. (https://reactjs.org/link/special-props)", c));
        };
        d.isReactWarning = !0, Object.defineProperty(t, "key", {
          get: d,
          configurable: !0
        });
      }
    }
    function ct(t, c) {
      {
        var d = function() {
          yr || (yr = !0, b("%s: `ref` is not a prop. Trying to access it will result in `undefined` being returned. If you need to access the same value within the child component, you should pass it as a different prop. (https://reactjs.org/link/special-props)", c));
        };
        d.isReactWarning = !0, Object.defineProperty(t, "ref", {
          get: d,
          configurable: !0
        });
      }
    }
    var lt = function(t, c, d, w, _, D, $) {
      var C = {
        // This tag allows us to uniquely identify this as a React Element
        $$typeof: r,
        // Built-in properties that belong on the element
        type: t,
        key: c,
        ref: d,
        props: $,
        // Record the component responsible for creating this element.
        _owner: D
      };
      return C._store = {}, Object.defineProperty(C._store, "validated", {
        configurable: !1,
        enumerable: !1,
        writable: !0,
        value: !1
      }), Object.defineProperty(C, "_self", {
        configurable: !1,
        enumerable: !1,
        writable: !1,
        value: w
      }), Object.defineProperty(C, "_source", {
        configurable: !1,
        enumerable: !1,
        writable: !1,
        value: _
      }), Object.freeze && (Object.freeze(C.props), Object.freeze(C)), C;
    };
    function dt(t, c, d, w, _) {
      {
        var D, $ = {}, C = null, G = null;
        d !== void 0 && (mr(d), C = "" + d), ot(c) && (mr(c.key), C = "" + c.key), at(c) && (G = c.ref, it(c, _));
        for (D in c)
          he.call(c, D) && !nt.hasOwnProperty(D) && ($[D] = c[D]);
        if (t && t.defaultProps) {
          var z = t.defaultProps;
          for (D in z)
            $[D] === void 0 && ($[D] = z[D]);
        }
        if (C || G) {
          var W = typeof t == "function" ? t.displayName || t.name || "Unknown" : t;
          C && st($, W), G && ct($, W);
        }
        return lt(t, C, G, _, w, ge.current, $);
      }
    }
    var Ve = S.ReactCurrentOwner, vr = S.ReactDebugCurrentFrame;
    function le(t) {
      if (t) {
        var c = t._owner, d = Ce(t.type, t._source, c ? c.type : null);
        vr.setExtraStackFrame(d);
      } else
        vr.setExtraStackFrame(null);
    }
    var qe;
    qe = !1;
    function Ue(t) {
      return typeof t == "object" && t !== null && t.$$typeof === r;
    }
    function br() {
      {
        if (Ve.current) {
          var t = x(Ve.current.type);
          if (t)
            return `

Check the render method of \`` + t + "`.";
        }
        return "";
      }
    }
    function ut(t) {
      {
        if (t !== void 0) {
          var c = t.fileName.replace(/^.*[\\\/]/, ""), d = t.lineNumber;
          return `

Check your code at ` + c + ":" + d + ".";
        }
        return "";
      }
    }
    var wr = {};
    function ft(t) {
      {
        var c = br();
        if (!c) {
          var d = typeof t == "string" ? t : t.displayName || t.name;
          d && (c = `

Check the top-level render call using <` + d + ">.");
        }
        return c;
      }
    }
    function Sr(t, c) {
      {
        if (!t._store || t._store.validated || t.key != null)
          return;
        t._store.validated = !0;
        var d = ft(c);
        if (wr[d])
          return;
        wr[d] = !0;
        var w = "";
        t && t._owner && t._owner !== Ve.current && (w = " It was passed a child from " + x(t._owner.type) + "."), le(t), b('Each child in a list should have a unique "key" prop.%s%s See https://reactjs.org/link/warning-keys for more information.', d, w), le(null);
      }
    }
    function kr(t, c) {
      {
        if (typeof t != "object")
          return;
        if (Ye(t))
          for (var d = 0; d < t.length; d++) {
            var w = t[d];
            Ue(w) && Sr(w, c);
          }
        else if (Ue(t))
          t._store && (t._store.validated = !0);
        else if (t) {
          var _ = P(t);
          if (typeof _ == "function" && _ !== t.entries)
            for (var D = _.call(t), $; !($ = D.next()).done; )
              Ue($.value) && Sr($.value, c);
        }
      }
    }
    function pt(t) {
      {
        var c = t.type;
        if (c == null || typeof c == "string")
          return;
        var d;
        if (typeof c == "function")
          d = c.propTypes;
        else if (typeof c == "object" && (c.$$typeof === p || // Note: Memo only checks outer props here.
        // Inner props are checked in the reconciler.
        c.$$typeof === h))
          d = c.propTypes;
        else
          return;
        if (d) {
          var w = x(c);
          Qr(d, t.props, "prop", w, t);
        } else if (c.PropTypes !== void 0 && !qe) {
          qe = !0;
          var _ = x(c);
          b("Component %s declared `PropTypes` instead of `propTypes`. Did you misspell the property assignment?", _ || "Unknown");
        }
        typeof c.getDefaultProps == "function" && !c.getDefaultProps.isReactClassApproved && b("getDefaultProps is only used on classic React.createClass definitions. Use a static property named `defaultProps` instead.");
      }
    }
    function ht(t) {
      {
        for (var c = Object.keys(t.props), d = 0; d < c.length; d++) {
          var w = c[d];
          if (w !== "children" && w !== "key") {
            le(t), b("Invalid prop `%s` supplied to `React.Fragment`. React.Fragment can only have `key` and `children` props.", w), le(null);
            break;
          }
        }
        t.ref !== null && (le(t), b("Invalid attribute `ref` supplied to `React.Fragment`."), le(null));
      }
    }
    var jr = {};
    function Er(t, c, d, w, _, D) {
      {
        var $ = ze(t);
        if (!$) {
          var C = "";
          (t === void 0 || typeof t == "object" && t !== null && Object.keys(t).length === 0) && (C += " You likely forgot to export your component from the file it's defined in, or you might have mixed up default and named imports.");
          var G = ut(_);
          G ? C += G : C += br();
          var z;
          t === null ? z = "null" : Ye(t) ? z = "array" : t !== void 0 && t.$$typeof === r ? (z = "<" + (x(t.type) || "Unknown") + " />", C = " Did you accidentally export a JSX literal instead of a component?") : z = typeof t, b("React.jsx: type is invalid -- expected a string (for built-in components) or a class/function (for composite components) but got: %s.%s", z, C);
        }
        var W = dt(t, c, d, _, D);
        if (W == null)
          return W;
        if ($) {
          var Q = c.children;
          if (Q !== void 0)
            if (w)
              if (Ye(Q)) {
                for (var de = 0; de < Q.length; de++)
                  kr(Q[de], t);
                Object.freeze && Object.freeze(Q);
              } else
                b("React.jsx: Static children should always be an array. You are likely explicitly calling React.jsxs or React.jsxDEV. Use the Babel transform instead.");
            else
              kr(Q, t);
        }
        if (he.call(c, "key")) {
          var se = x(t), J = Object.keys(c).filter(function(bt) {
            return bt !== "key";
          }), Ge = J.length > 0 ? "{key: someKey, " + J.join(": ..., ") + ": ...}" : "{key: someKey}";
          if (!jr[se + Ge]) {
            var vt = J.length > 0 ? "{" + J.join(": ..., ") + ": ...}" : "{}";
            b(`A props object containing a "key" prop is being spread into JSX:
  let props = %s;
  <%s {...props} />
React keys must be passed directly to JSX without using spread:
  let props = %s;
  <%s key={someKey} {...props} />`, Ge, se, vt, se), jr[se + Ge] = !0;
          }
        }
        return t === i ? ht(W) : pt(W), W;
      }
    }
    function gt(t, c, d) {
      return Er(t, c, d, !0);
    }
    function mt(t, c, d) {
      return Er(t, c, d, !1);
    }
    var xt = mt, yt = gt;
    xe.Fragment = i, xe.jsx = xt, xe.jsxs = yt;
  }()), xe;
}
({}).NODE_ENV === "production" ? Xe.exports = Et() : Xe.exports = Ct();
var o = Xe.exports, Rt = !1;
function $t(e) {
  if (e.sheet)
    return e.sheet;
  for (var r = 0; r < document.styleSheets.length; r++)
    if (document.styleSheets[r].ownerNode === e)
      return document.styleSheets[r];
}
function Tt(e) {
  var r = document.createElement("style");
  return r.setAttribute("data-emotion", e.key), e.nonce !== void 0 && r.setAttribute("nonce", e.nonce), r.appendChild(document.createTextNode("")), r.setAttribute("data-s", ""), r;
}
var _t = /* @__PURE__ */ function() {
  function e(n) {
    var i = this;
    this._insertTag = function(a) {
      var s;
      i.tags.length === 0 ? i.insertionPoint ? s = i.insertionPoint.nextSibling : i.prepend ? s = i.container.firstChild : s = i.before : s = i.tags[i.tags.length - 1].nextSibling, i.container.insertBefore(a, s), i.tags.push(a);
    }, this.isSpeedy = n.speedy === void 0 ? !Rt : n.speedy, this.tags = [], this.ctr = 0, this.nonce = n.nonce, this.key = n.key, this.container = n.container, this.prepend = n.prepend, this.insertionPoint = n.insertionPoint, this.before = null;
  }
  var r = e.prototype;
  return r.hydrate = function(i) {
    i.forEach(this._insertTag);
  }, r.insert = function(i) {
    this.ctr % (this.isSpeedy ? 65e3 : 1) === 0 && this._insertTag(Tt(this));
    var a = this.tags[this.tags.length - 1];
    if (this.isSpeedy) {
      var s = $t(a);
      try {
        s.insertRule(i, s.cssRules.length);
      } catch {
      }
    } else
      a.appendChild(document.createTextNode(i));
    this.ctr++;
  }, r.flush = function() {
    this.tags.forEach(function(i) {
      var a;
      return (a = i.parentNode) == null ? void 0 : a.removeChild(i);
    }), this.tags = [], this.ctr = 0;
  }, e;
}(), U = "-ms-", De = "-moz-", A = "-webkit-", Nr = "comm", rr = "rule", tr = "decl", At = "@import", Fr = "@keyframes", Ot = "@layer", It = Math.abs, Pe = String.fromCharCode, Dt = Object.assign;
function Pt(e, r) {
  return V(e, 0) ^ 45 ? (((r << 2 ^ V(e, 0)) << 2 ^ V(e, 1)) << 2 ^ V(e, 2)) << 2 ^ V(e, 3) : 0;
}
function zr(e) {
  return e.trim();
}
function Nt(e, r) {
  return (e = r.exec(e)) ? e[0] : e;
}
function O(e, r, n) {
  return e.replace(r, n);
}
function Ze(e, r) {
  return e.indexOf(r);
}
function V(e, r) {
  return e.charCodeAt(r) | 0;
}
function ve(e, r, n) {
  return e.slice(r, n);
}
function re(e) {
  return e.length;
}
function nr(e) {
  return e.length;
}
function $e(e, r) {
  return r.push(e), e;
}
function Ft(e, r) {
  return e.map(r).join("");
}
var Ne = 1, fe = 1, Mr = 0, K = 0, B = 0, pe = "";
function Fe(e, r, n, i, a, s, f) {
  return { value: e, root: r, parent: n, type: i, props: a, children: s, line: Ne, column: fe, length: f, return: "" };
}
function ye(e, r) {
  return Dt(Fe("", null, null, "", null, null, 0), e, { length: -e.length }, r);
}
function zt() {
  return B;
}
function Mt() {
  return B = K > 0 ? V(pe, --K) : 0, fe--, B === 10 && (fe = 1, Ne--), B;
}
function Z() {
  return B = K < Mr ? V(pe, K++) : 0, fe++, B === 10 && (fe = 1, Ne++), B;
}
function ne() {
  return V(pe, K);
}
function _e() {
  return K;
}
function Se(e, r) {
  return ve(pe, e, r);
}
function be(e) {
  switch (e) {
    case 0:
    case 9:
    case 10:
    case 13:
    case 32:
      return 5;
    case 33:
    case 43:
    case 44:
    case 47:
    case 62:
    case 64:
    case 126:
    case 59:
    case 123:
    case 125:
      return 4;
    case 58:
      return 3;
    case 34:
    case 39:
    case 40:
    case 91:
      return 2;
    case 41:
    case 93:
      return 1;
  }
  return 0;
}
function Wr(e) {
  return Ne = fe = 1, Mr = re(pe = e), K = 0, [];
}
function Br(e) {
  return pe = "", e;
}
function Ae(e) {
  return zr(Se(K - 1, Qe(e === 91 ? e + 2 : e === 40 ? e + 1 : e)));
}
function Wt(e) {
  for (; (B = ne()) && B < 33; )
    Z();
  return be(e) > 2 || be(B) > 3 ? "" : " ";
}
function Bt(e, r) {
  for (; --r && Z() && !(B < 48 || B > 102 || B > 57 && B < 65 || B > 70 && B < 97); )
    ;
  return Se(e, _e() + (r < 6 && ne() == 32 && Z() == 32));
}
function Qe(e) {
  for (; Z(); )
    switch (B) {
      case e:
        return K;
      case 34:
      case 39:
        e !== 34 && e !== 39 && Qe(B);
        break;
      case 40:
        e === 41 && Qe(e);
        break;
      case 92:
        Z();
        break;
    }
  return K;
}
function Lt(e, r) {
  for (; Z() && e + B !== 47 + 10; )
    if (e + B === 42 + 42 && ne() === 47)
      break;
  return "/*" + Se(r, K - 1) + "*" + Pe(e === 47 ? e : Z());
}
function Yt(e) {
  for (; !be(ne()); )
    Z();
  return Se(e, K);
}
function Ht(e) {
  return Br(Oe("", null, null, null, [""], e = Wr(e), 0, [0], e));
}
function Oe(e, r, n, i, a, s, f, l, p) {
  for (var m = 0, u = 0, h = f, k = 0, y = 0, T = 0, v = 1, P = 1, S = 1, b = 0, H = "", L = a, N = s, q = i, I = H; P; )
    switch (T = b, b = Z()) {
      case 40:
        if (T != 108 && V(I, h - 1) == 58) {
          Ze(I += O(Ae(b), "&", "&\f"), "&\f") != -1 && (S = -1);
          break;
        }
      case 34:
      case 39:
      case 91:
        I += Ae(b);
        break;
      case 9:
      case 10:
      case 13:
      case 32:
        I += Wt(T);
        break;
      case 92:
        I += Bt(_e() - 1, 7);
        continue;
      case 47:
        switch (ne()) {
          case 42:
          case 47:
            $e(Vt(Lt(Z(), _e()), r, n), p);
            break;
          default:
            I += "/";
        }
        break;
      case 123 * v:
        l[m++] = re(I) * S;
      case 125 * v:
      case 59:
      case 0:
        switch (b) {
          case 0:
          case 125:
            P = 0;
          case 59 + u:
            S == -1 && (I = O(I, /\f/g, "")), y > 0 && re(I) - h && $e(y > 32 ? Tr(I + ";", i, n, h - 1) : Tr(O(I, " ", "") + ";", i, n, h - 2), p);
            break;
          case 59:
            I += ";";
          default:
            if ($e(q = $r(I, r, n, m, u, a, l, H, L = [], N = [], h), s), b === 123)
              if (u === 0)
                Oe(I, r, q, q, L, s, h, l, N);
              else
                switch (k === 99 && V(I, 3) === 110 ? 100 : k) {
                  case 100:
                  case 108:
                  case 109:
                  case 115:
                    Oe(e, q, q, i && $e($r(e, q, q, 0, 0, a, l, H, a, L = [], h), N), a, N, h, l, i ? L : N);
                    break;
                  default:
                    Oe(I, q, q, q, [""], N, 0, l, N);
                }
        }
        m = u = y = 0, v = S = 1, H = I = "", h = f;
        break;
      case 58:
        h = 1 + re(I), y = T;
      default:
        if (v < 1) {
          if (b == 123)
            --v;
          else if (b == 125 && v++ == 0 && Mt() == 125)
            continue;
        }
        switch (I += Pe(b), b * v) {
          case 38:
            S = u > 0 ? 1 : (I += "\f", -1);
            break;
          case 44:
            l[m++] = (re(I) - 1) * S, S = 1;
            break;
          case 64:
            ne() === 45 && (I += Ae(Z())), k = ne(), u = h = re(H = I += Yt(_e())), b++;
            break;
          case 45:
            T === 45 && re(I) == 2 && (v = 0);
        }
    }
  return s;
}
function $r(e, r, n, i, a, s, f, l, p, m, u) {
  for (var h = a - 1, k = a === 0 ? s : [""], y = nr(k), T = 0, v = 0, P = 0; T < i; ++T)
    for (var S = 0, b = ve(e, h + 1, h = It(v = f[T])), H = e; S < y; ++S)
      (H = zr(v > 0 ? k[S] + " " + b : O(b, /&\f/g, k[S]))) && (p[P++] = H);
  return Fe(e, r, n, a === 0 ? rr : l, p, m, u);
}
function Vt(e, r, n) {
  return Fe(e, r, n, Nr, Pe(zt()), ve(e, 2, -2), 0);
}
function Tr(e, r, n, i) {
  return Fe(e, r, n, tr, ve(e, 0, i), ve(e, i + 1, -1), i);
}
function ue(e, r) {
  for (var n = "", i = nr(e), a = 0; a < i; a++)
    n += r(e[a], a, e, r) || "";
  return n;
}
function qt(e, r, n, i) {
  switch (e.type) {
    case Ot:
      if (e.children.length)
        break;
    case At:
    case tr:
      return e.return = e.return || e.value;
    case Nr:
      return "";
    case Fr:
      return e.return = e.value + "{" + ue(e.children, i) + "}";
    case rr:
      e.value = e.props.join(",");
  }
  return re(n = ue(e.children, i)) ? e.return = e.value + "{" + n + "}" : "";
}
function Ut(e) {
  var r = nr(e);
  return function(n, i, a, s) {
    for (var f = "", l = 0; l < r; l++)
      f += e[l](n, i, a, s) || "";
    return f;
  };
}
function Gt(e) {
  return function(r) {
    r.root || (r = r.return) && e(r);
  };
}
function Jt(e) {
  var r = /* @__PURE__ */ Object.create(null);
  return function(n) {
    return r[n] === void 0 && (r[n] = e(n)), r[n];
  };
}
var Kt = function(r, n, i) {
  for (var a = 0, s = 0; a = s, s = ne(), a === 38 && s === 12 && (n[i] = 1), !be(s); )
    Z();
  return Se(r, K);
}, Xt = function(r, n) {
  var i = -1, a = 44;
  do
    switch (be(a)) {
      case 0:
        a === 38 && ne() === 12 && (n[i] = 1), r[i] += Kt(K - 1, n, i);
        break;
      case 2:
        r[i] += Ae(a);
        break;
      case 4:
        if (a === 44) {
          r[++i] = ne() === 58 ? "&\f" : "", n[i] = r[i].length;
          break;
        }
      default:
        r[i] += Pe(a);
    }
  while (a = Z());
  return r;
}, Zt = function(r, n) {
  return Br(Xt(Wr(r), n));
}, _r = /* @__PURE__ */ new WeakMap(), Qt = function(r) {
  if (!(r.type !== "rule" || !r.parent || // positive .length indicates that this rule contains pseudo
  // negative .length indicates that this rule has been already prefixed
  r.length < 1)) {
    for (var n = r.value, i = r.parent, a = r.column === i.column && r.line === i.line; i.type !== "rule"; )
      if (i = i.parent, !i)
        return;
    if (!(r.props.length === 1 && n.charCodeAt(0) !== 58 && !_r.get(i)) && !a) {
      _r.set(r, !0);
      for (var s = [], f = Zt(n, s), l = i.props, p = 0, m = 0; p < f.length; p++)
        for (var u = 0; u < l.length; u++, m++)
          r.props[m] = s[p] ? f[p].replace(/&\f/g, l[u]) : l[u] + " " + f[p];
    }
  }
}, en = function(r) {
  if (r.type === "decl") {
    var n = r.value;
    // charcode for l
    n.charCodeAt(0) === 108 && // charcode for b
    n.charCodeAt(2) === 98 && (r.return = "", r.value = "");
  }
};
function Lr(e, r) {
  switch (Pt(e, r)) {
    case 5103:
      return A + "print-" + e + e;
    case 5737:
    case 4201:
    case 3177:
    case 3433:
    case 1641:
    case 4457:
    case 2921:
    case 5572:
    case 6356:
    case 5844:
    case 3191:
    case 6645:
    case 3005:
    case 6391:
    case 5879:
    case 5623:
    case 6135:
    case 4599:
    case 4855:
    case 4215:
    case 6389:
    case 5109:
    case 5365:
    case 5621:
    case 3829:
      return A + e + e;
    case 5349:
    case 4246:
    case 4810:
    case 6968:
    case 2756:
      return A + e + De + e + U + e + e;
    case 6828:
    case 4268:
      return A + e + U + e + e;
    case 6165:
      return A + e + U + "flex-" + e + e;
    case 5187:
      return A + e + O(e, /(\w+).+(:[^]+)/, A + "box-$1$2" + U + "flex-$1$2") + e;
    case 5443:
      return A + e + U + "flex-item-" + O(e, /flex-|-self/, "") + e;
    case 4675:
      return A + e + U + "flex-line-pack" + O(e, /align-content|flex-|-self/, "") + e;
    case 5548:
      return A + e + U + O(e, "shrink", "negative") + e;
    case 5292:
      return A + e + U + O(e, "basis", "preferred-size") + e;
    case 6060:
      return A + "box-" + O(e, "-grow", "") + A + e + U + O(e, "grow", "positive") + e;
    case 4554:
      return A + O(e, /([^-])(transform)/g, "$1" + A + "$2") + e;
    case 6187:
      return O(O(O(e, /(zoom-|grab)/, A + "$1"), /(image-set)/, A + "$1"), e, "") + e;
    case 5495:
    case 3959:
      return O(e, /(image-set\([^]*)/, A + "$1$`$1");
    case 4968:
      return O(O(e, /(.+:)(flex-)?(.*)/, A + "box-pack:$3" + U + "flex-pack:$3"), /s.+-b[^;]+/, "justify") + A + e + e;
    case 4095:
    case 3583:
    case 4068:
    case 2532:
      return O(e, /(.+)-inline(.+)/, A + "$1$2") + e;
    case 8116:
    case 7059:
    case 5753:
    case 5535:
    case 5445:
    case 5701:
    case 4933:
    case 4677:
    case 5533:
    case 5789:
    case 5021:
    case 4765:
      if (re(e) - 1 - r > 6)
        switch (V(e, r + 1)) {
          case 109:
            if (V(e, r + 4) !== 45)
              break;
          case 102:
            return O(e, /(.+:)(.+)-([^]+)/, "$1" + A + "$2-$3$1" + De + (V(e, r + 3) == 108 ? "$3" : "$2-$3")) + e;
          case 115:
            return ~Ze(e, "stretch") ? Lr(O(e, "stretch", "fill-available"), r) + e : e;
        }
      break;
    case 4949:
      if (V(e, r + 1) !== 115)
        break;
    case 6444:
      switch (V(e, re(e) - 3 - (~Ze(e, "!important") && 10))) {
        case 107:
          return O(e, ":", ":" + A) + e;
        case 101:
          return O(e, /(.+:)([^;!]+)(;|!.+)?/, "$1" + A + (V(e, 14) === 45 ? "inline-" : "") + "box$3$1" + A + "$2$3$1" + U + "$2box$3") + e;
      }
      break;
    case 5936:
      switch (V(e, r + 11)) {
        case 114:
          return A + e + U + O(e, /[svh]\w+-[tblr]{2}/, "tb") + e;
        case 108:
          return A + e + U + O(e, /[svh]\w+-[tblr]{2}/, "tb-rl") + e;
        case 45:
          return A + e + U + O(e, /[svh]\w+-[tblr]{2}/, "lr") + e;
      }
      return A + e + U + e + e;
  }
  return e;
}
var rn = function(r, n, i, a) {
  if (r.length > -1 && !r.return)
    switch (r.type) {
      case tr:
        r.return = Lr(r.value, r.length);
        break;
      case Fr:
        return ue([ye(r, {
          value: O(r.value, "@", "@" + A)
        })], a);
      case rr:
        if (r.length)
          return Ft(r.props, function(s) {
            switch (Nt(s, /(::plac\w+|:read-\w+)/)) {
              case ":read-only":
              case ":read-write":
                return ue([ye(r, {
                  props: [O(s, /:(read-\w+)/, ":" + De + "$1")]
                })], a);
              case "::placeholder":
                return ue([ye(r, {
                  props: [O(s, /:(plac\w+)/, ":" + A + "input-$1")]
                }), ye(r, {
                  props: [O(s, /:(plac\w+)/, ":" + De + "$1")]
                }), ye(r, {
                  props: [O(s, /:(plac\w+)/, U + "input-$1")]
                })], a);
            }
            return "";
          });
    }
}, tn = [rn], nn = function(r) {
  var n = r.key;
  if (n === "css") {
    var i = document.querySelectorAll("style[data-emotion]:not([data-s])");
    Array.prototype.forEach.call(i, function(v) {
      var P = v.getAttribute("data-emotion");
      P.indexOf(" ") !== -1 && (document.head.appendChild(v), v.setAttribute("data-s", ""));
    });
  }
  var a = r.stylisPlugins || tn, s = {}, f, l = [];
  f = r.container || document.head, Array.prototype.forEach.call(
    // this means we will ignore elements which don't have a space in them which
    // means that the style elements we're looking at are only Emotion 11 server-rendered style elements
    document.querySelectorAll('style[data-emotion^="' + n + ' "]'),
    function(v) {
      for (var P = v.getAttribute("data-emotion").split(" "), S = 1; S < P.length; S++)
        s[P[S]] = !0;
      l.push(v);
    }
  );
  var p, m = [Qt, en];
  {
    var u, h = [qt, Gt(function(v) {
      u.insert(v);
    })], k = Ut(m.concat(a, h)), y = function(P) {
      return ue(Ht(P), k);
    };
    p = function(P, S, b, H) {
      u = b, y(P ? P + "{" + S.styles + "}" : S.styles), H && (T.inserted[S.name] = !0);
    };
  }
  var T = {
    key: n,
    sheet: new _t({
      key: n,
      container: f,
      nonce: r.nonce,
      speedy: r.speedy,
      prepend: r.prepend,
      insertionPoint: r.insertionPoint
    }),
    nonce: r.nonce,
    inserted: s,
    registered: {},
    insert: p
  };
  return T.sheet.hydrate(l), T;
};
function an(e) {
  for (var r = 0, n, i = 0, a = e.length; a >= 4; ++i, a -= 4)
    n = e.charCodeAt(i) & 255 | (e.charCodeAt(++i) & 255) << 8 | (e.charCodeAt(++i) & 255) << 16 | (e.charCodeAt(++i) & 255) << 24, n = /* Math.imul(k, m): */
    (n & 65535) * 1540483477 + ((n >>> 16) * 59797 << 16), n ^= /* k >>> r: */
    n >>> 24, r = /* Math.imul(k, m): */
    (n & 65535) * 1540483477 + ((n >>> 16) * 59797 << 16) ^ /* Math.imul(h, m): */
    (r & 65535) * 1540483477 + ((r >>> 16) * 59797 << 16);
  switch (a) {
    case 3:
      r ^= (e.charCodeAt(i + 2) & 255) << 16;
    case 2:
      r ^= (e.charCodeAt(i + 1) & 255) << 8;
    case 1:
      r ^= e.charCodeAt(i) & 255, r = /* Math.imul(h, m): */
      (r & 65535) * 1540483477 + ((r >>> 16) * 59797 << 16);
  }
  return r ^= r >>> 13, r = /* Math.imul(h, m): */
  (r & 65535) * 1540483477 + ((r >>> 16) * 59797 << 16), ((r ^ r >>> 15) >>> 0).toString(36);
}
var on = {
  animationIterationCount: 1,
  aspectRatio: 1,
  borderImageOutset: 1,
  borderImageSlice: 1,
  borderImageWidth: 1,
  boxFlex: 1,
  boxFlexGroup: 1,
  boxOrdinalGroup: 1,
  columnCount: 1,
  columns: 1,
  flex: 1,
  flexGrow: 1,
  flexPositive: 1,
  flexShrink: 1,
  flexNegative: 1,
  flexOrder: 1,
  gridRow: 1,
  gridRowEnd: 1,
  gridRowSpan: 1,
  gridRowStart: 1,
  gridColumn: 1,
  gridColumnEnd: 1,
  gridColumnSpan: 1,
  gridColumnStart: 1,
  msGridRow: 1,
  msGridRowSpan: 1,
  msGridColumn: 1,
  msGridColumnSpan: 1,
  fontWeight: 1,
  lineHeight: 1,
  opacity: 1,
  order: 1,
  orphans: 1,
  scale: 1,
  tabSize: 1,
  widows: 1,
  zIndex: 1,
  zoom: 1,
  WebkitLineClamp: 1,
  // SVG-related properties
  fillOpacity: 1,
  floodOpacity: 1,
  stopOpacity: 1,
  strokeDasharray: 1,
  strokeDashoffset: 1,
  strokeMiterlimit: 1,
  strokeOpacity: 1,
  strokeWidth: 1
}, sn = !1, cn = /[A-Z]|^ms/g, ln = /_EMO_([^_]+?)_([^]*?)_EMO_/g, Yr = function(r) {
  return r.charCodeAt(1) === 45;
}, Ar = function(r) {
  return r != null && typeof r != "boolean";
}, Je = /* @__PURE__ */ Jt(function(e) {
  return Yr(e) ? e : e.replace(cn, "-$&").toLowerCase();
}), Or = function(r, n) {
  switch (r) {
    case "animation":
    case "animationName":
      if (typeof n == "string")
        return n.replace(ln, function(i, a, s) {
          return te = {
            name: a,
            styles: s,
            next: te
          }, a;
        });
  }
  return on[r] !== 1 && !Yr(r) && typeof n == "number" && n !== 0 ? n + "px" : n;
}, dn = "Component selectors can only be used in conjunction with @emotion/babel-plugin, the swc Emotion plugin, or another Emotion-aware compiler transform.";
function we(e, r, n) {
  if (n == null)
    return "";
  var i = n;
  if (i.__emotion_styles !== void 0)
    return i;
  switch (typeof n) {
    case "boolean":
      return "";
    case "object": {
      var a = n;
      if (a.anim === 1)
        return te = {
          name: a.name,
          styles: a.styles,
          next: te
        }, a.name;
      var s = n;
      if (s.styles !== void 0) {
        var f = s.next;
        if (f !== void 0)
          for (; f !== void 0; )
            te = {
              name: f.name,
              styles: f.styles,
              next: te
            }, f = f.next;
        var l = s.styles + ";";
        return l;
      }
      return un(e, r, n);
    }
    case "function": {
      if (e !== void 0) {
        var p = te, m = n(e);
        return te = p, we(e, r, m);
      }
      break;
    }
  }
  var u = n;
  if (r == null)
    return u;
  var h = r[u];
  return h !== void 0 ? h : u;
}
function un(e, r, n) {
  var i = "";
  if (Array.isArray(n))
    for (var a = 0; a < n.length; a++)
      i += we(e, r, n[a]) + ";";
  else
    for (var s in n) {
      var f = n[s];
      if (typeof f != "object") {
        var l = f;
        r != null && r[l] !== void 0 ? i += s + "{" + r[l] + "}" : Ar(l) && (i += Je(s) + ":" + Or(s, l) + ";");
      } else {
        if (s === "NO_COMPONENT_SELECTOR" && sn)
          throw new Error(dn);
        if (Array.isArray(f) && typeof f[0] == "string" && (r == null || r[f[0]] === void 0))
          for (var p = 0; p < f.length; p++)
            Ar(f[p]) && (i += Je(s) + ":" + Or(s, f[p]) + ";");
        else {
          var m = we(e, r, f);
          switch (s) {
            case "animation":
            case "animationName": {
              i += Je(s) + ":" + m + ";";
              break;
            }
            default:
              i += s + "{" + m + "}";
          }
        }
      }
    }
  return i;
}
var Ir = /label:\s*([^\s;{]+)\s*(;|$)/g, te;
function Ke(e, r, n) {
  if (e.length === 1 && typeof e[0] == "object" && e[0] !== null && e[0].styles !== void 0)
    return e[0];
  var i = !0, a = "";
  te = void 0;
  var s = e[0];
  if (s == null || s.raw === void 0)
    i = !1, a += we(n, r, s);
  else {
    var f = s;
    a += f[0];
  }
  for (var l = 1; l < e.length; l++)
    if (a += we(n, r, e[l]), i) {
      var p = s;
      a += p[l];
    }
  Ir.lastIndex = 0;
  for (var m = "", u; (u = Ir.exec(a)) !== null; )
    m += "-" + u[1];
  var h = an(a) + m;
  return {
    name: h,
    styles: a,
    next: te
  };
}
var fn = !0;
function Hr(e, r, n) {
  var i = "";
  return n.split(" ").forEach(function(a) {
    e[a] !== void 0 ? r.push(e[a] + ";") : a && (i += a + " ");
  }), i;
}
var pn = function(r, n, i) {
  var a = r.key + "-" + n.name;
  // we only need to add the styles to the registered cache if the
  // class name could be used further down
  // the tree but if it's a string tag, we know it won't
  // so we don't have to add it to registered cache.
  // this improves memory usage since we can avoid storing the whole style string
  (i === !1 || // we need to always store it if we're in compat mode and
  // in node since emotion-server relies on whether a style is in
  // the registered cache to know whether a style is global or not
  // also, note that this check will be dead code eliminated in the browser
  fn === !1) && r.registered[a] === void 0 && (r.registered[a] = n.styles);
}, hn = function(r, n, i) {
  pn(r, n, i);
  var a = r.key + "-" + n.name;
  if (r.inserted[n.name] === void 0) {
    var s = n;
    do
      r.insert(n === s ? "." + a : "", s, r.sheet, !0), s = s.next;
    while (s !== void 0);
  }
};
function Dr(e, r) {
  if (e.inserted[r.name] === void 0)
    return e.insert("", r, e.sheet, !0);
}
function Pr(e, r, n) {
  var i = [], a = Hr(e, i, n);
  return i.length < 2 ? n : a + r(i);
}
var gn = function(r) {
  var n = nn(r);
  n.sheet.speedy = function(l) {
    this.isSpeedy = l;
  }, n.compat = !0;
  var i = function() {
    for (var p = arguments.length, m = new Array(p), u = 0; u < p; u++)
      m[u] = arguments[u];
    var h = Ke(m, n.registered, void 0);
    return hn(n, h, !1), n.key + "-" + h.name;
  }, a = function() {
    for (var p = arguments.length, m = new Array(p), u = 0; u < p; u++)
      m[u] = arguments[u];
    var h = Ke(m, n.registered), k = "animation-" + h.name;
    return Dr(n, {
      name: h.name,
      styles: "@keyframes " + k + "{" + h.styles + "}"
    }), k;
  }, s = function() {
    for (var p = arguments.length, m = new Array(p), u = 0; u < p; u++)
      m[u] = arguments[u];
    var h = Ke(m, n.registered);
    Dr(n, h);
  }, f = function() {
    for (var p = arguments.length, m = new Array(p), u = 0; u < p; u++)
      m[u] = arguments[u];
    return Pr(n.registered, i, mn(m));
  };
  return {
    css: i,
    cx: f,
    injectGlobal: s,
    keyframes: a,
    hydrate: function(p) {
      p.forEach(function(m) {
        n.inserted[m] = !0;
      });
    },
    flush: function() {
      n.registered = {}, n.inserted = {}, n.sheet.flush();
    },
    sheet: n.sheet,
    cache: n,
    getRegisteredStyles: Hr.bind(null, n.registered),
    merge: Pr.bind(null, n.registered, i)
  };
}, mn = function e(r) {
  for (var n = "", i = 0; i < r.length; i++) {
    var a = r[i];
    if (a != null) {
      var s = void 0;
      switch (typeof a) {
        case "boolean":
          break;
        case "object": {
          if (Array.isArray(a))
            s = e(a);
          else {
            s = "";
            for (var f in a)
              a[f] && f && (s && (s += " "), s += f);
          }
          break;
        }
        default:
          s = a;
      }
      s && (n && (n += " "), n += s);
    }
  }
  return n;
}, Vr = gn({
  key: "css"
}), qr = Vr.keyframes, R = Vr.css;
class xn {
  constructor(r = {}) {
    this.state = "closed", this.failureCount = 0, this.lastFailureTime = null, this.successCount = 0, this.failureThreshold = r.failureThreshold || 5, this.timeout = r.timeout || 6e4;
  }
  /**
   * Check if the circuit allows execution
   */
  canExecute() {
    return this.state === "closed" ? !0 : this.state === "open" ? this.lastFailureTime && Date.now() - this.lastFailureTime >= this.timeout ? (this.state = "half-open", this.successCount = 0, console.log("[CircuitBreaker] Transitioning to half-open state"), !0) : !1 : !0;
  }
  /**
   * Record a successful call
   */
  recordSuccess() {
    this.failureCount = 0, this.state === "half-open" && (this.successCount++, this.successCount >= 2 && (this.state = "closed", console.log("[CircuitBreaker] Circuit closed - service recovered")));
  }
  /**
   * Record a failed call
   */
  recordFailure() {
    if (this.failureCount++, this.lastFailureTime = Date.now(), this.state === "half-open") {
      this.state = "open", console.log("[CircuitBreaker] Half-open failure - reopening circuit");
      return;
    }
    this.failureCount >= this.failureThreshold && this.state === "closed" && (this.state = "open", console.log(
      `[CircuitBreaker] Failure threshold reached (${this.failureCount}/${this.failureThreshold}) - opening circuit`
    ));
  }
  /**
   * Get current circuit state
   */
  getState() {
    return this.state;
  }
  /**
   * Get failure count
   */
  getFailureCount() {
    return this.failureCount;
  }
  /**
   * Reset circuit to closed state
   */
  reset() {
    this.state = "closed", this.failureCount = 0, this.successCount = 0, this.lastFailureTime = null;
  }
}
class yn {
  constructor(r = {}) {
    this.breakers = /* @__PURE__ */ new Map(), this.config = r;
  }
  /**
   * Get or create a circuit breaker for a service
   */
  getBreaker(r) {
    return this.breakers.has(r) || this.breakers.set(r, new xn(this.config)), this.breakers.get(r);
  }
  /**
   * Check if a service can be called
   */
  canExecute(r) {
    return this.getBreaker(r).canExecute();
  }
  /**
   * Record success for a service
   */
  recordSuccess(r) {
    this.getBreaker(r).recordSuccess();
  }
  /**
   * Record failure for a service
   */
  recordFailure(r) {
    this.getBreaker(r).recordFailure();
  }
  /**
   * Get all breaker states
   */
  getAllStates() {
    const r = {};
    return this.breakers.forEach((n, i) => {
      r[i] = n.getState();
    }), r;
  }
  /**
   * Reset all circuits
   */
  resetAll() {
    this.breakers.forEach((r) => {
      r.reset();
    });
  }
  /**
   * Reset a specific service's circuit
   */
  reset(r) {
    var n;
    (n = this.breakers.get(r)) == null || n.reset();
  }
}
const Te = new yn({
  failureThreshold: 5,
  timeout: 6e4
  // 60 seconds
});
function Ur(e) {
  if (e instanceof TypeError) {
    const r = e.message.toLowerCase();
    return r.includes("failed to fetch") || r.includes("network") || r.includes("timeout") || r.includes("connection") || r.includes("refused");
  }
  if (e instanceof Error) {
    const r = e.message.toLowerCase();
    return r.includes("econnrefused") || r.includes("econnreset") || r.includes("etimedout") || r.includes("ehostunreach") || r.includes("enetunreach");
  }
  return !1;
}
function vn(e, r) {
  const n = Math.min(
    r.initialDelay * Math.pow(r.backoffMultiplier, e),
    r.maxDelay
  );
  if (!r.jitter)
    return n;
  const i = Math.random() * (n * 0.5);
  return n + i;
}
async function bn(e, r = "unknown", n = {}) {
  const i = {
    maxAttempts: n.maxAttempts || 3,
    initialDelay: n.initialDelay || 1e3,
    maxDelay: n.maxDelay || 32e3,
    backoffMultiplier: n.backoffMultiplier || 2,
    jitter: n.jitter !== !1
  }, a = Date.now();
  let s = null;
  for (let f = 0; f < i.maxAttempts; f++) {
    if (!Te.canExecute(r)) {
      const l = new Error(`Circuit breaker open for ${r}`);
      return console.warn(`[Retry] ${l.message}`), {
        data: null,
        error: l,
        attempts: f + 1,
        totalDuration: Date.now() - a,
        success: !1
      };
    }
    try {
      const l = await e();
      return Te.recordSuccess(r), {
        data: l,
        error: null,
        attempts: f + 1,
        totalDuration: Date.now() - a,
        success: !0
      };
    } catch (l) {
      if (s = l instanceof Error ? l : new Error(String(l)), !Ur(l) || f === i.maxAttempts - 1)
        return Te.recordFailure(r), console.error(
          `[Retry] Failed after ${f + 1} attempt(s) for ${r}:`,
          s.message
        ), {
          data: null,
          error: s,
          attempts: f + 1,
          totalDuration: Date.now() - a,
          success: !1
        };
      const m = vn(f, i);
      console.warn(
        `[Retry] Attempt ${f + 1} failed for ${r}, retrying in ${Math.round(m)}ms:`,
        s.message
      ), await new Promise((u) => setTimeout(u, m));
    }
  }
  return Te.recordFailure(r), {
    data: null,
    error: s || new Error("Unknown error"),
    attempts: i.maxAttempts,
    totalDuration: Date.now() - a,
    success: !1
  };
}
new Date(Date.now() - 36e5).toISOString(), (/* @__PURE__ */ new Date()).toISOString(), new Date(Date.now() - 72e5).toISOString(), new Date(Date.now() - 18e5).toISOString(), new Date(Date.now() - 36e5).toISOString(), new Date(Date.now() - 3e6).toISOString(), new Date(Date.now() - 18e5).toISOString(), new Date(Date.now() - 9e5).toISOString();
const wn = {}.VITE_BACKEND_URL || "http://localhost:9000/api";
function Sn() {
  const e = Date.now().toString(36), r = Math.random().toString(36).substring(2, 9);
  return `${e}-${r}`;
}
class kn {
  static async handle(r, n) {
    const i = await r.json().catch(() => ({ error: "Unknown error" })), a = r.headers.get("x-trace-id") || n.traceId;
    if (r.status === 401)
      return {
        status: r.status,
        message: "Your session has expired. Please login again.",
        isTokenExpired: !0,
        traceId: a,
        endpoint: n.endpoint,
        method: n.method,
        duration: n.duration
      };
    if (r.status === 429)
      return {
        status: r.status,
        message: "Too many requests. Please wait a moment and try again.",
        isTokenExpired: !1,
        traceId: a,
        endpoint: n.endpoint,
        method: n.method,
        duration: n.duration
      };
    if (r.status === 403)
      return {
        status: r.status,
        message: "Access forbidden. Your account may be locked due to failed login attempts.",
        isTokenExpired: !1,
        traceId: a,
        endpoint: n.endpoint,
        method: n.method,
        duration: n.duration
      };
    const s = i.error || i.message || `API error: ${r.statusText}`;
    return {
      status: r.status,
      message: `${s} (${r.status})`,
      isTokenExpired: !1,
      traceId: a,
      endpoint: n.endpoint,
      method: n.method,
      duration: n.duration,
      requestId: i.request_id || i.requestId
    };
  }
}
let jn = null;
async function E(e, r = {}) {
  const { body: n, serviceName: i = "backend-api", ...a } = r, s = Sn(), f = a.method || "GET", l = performance.now(), p = localStorage.getItem("access_token"), m = {
    "Content-Type": "application/json",
    "X-Trace-ID": s,
    // Send trace ID to backend
    "X-Request-Started": (/* @__PURE__ */ new Date()).toISOString(),
    ...p ? { Authorization: `Bearer ${p}` } : {},
    ...a.headers
  }, u = {
    ...a,
    headers: m
  };
  return n && (u.body = JSON.stringify(n)), console.log(`[API] ${f} ${e} (trace: ${s})`), bn(
    async () => {
      const h = await fetch(`${wn}${e}`, u), k = Math.round(performance.now() - l);
      if (!h.ok) {
        const v = await kn.handle(h, {
          endpoint: e,
          method: f,
          traceId: s,
          duration: k
        });
        console.error(
          `[API] Error ${f} ${e}: ${v.message}`,
          {
            status: v.status,
            traceId: v.traceId,
            requestId: v.requestId,
            duration: `${k}ms`
          }
        ), v.isTokenExpired && (localStorage.removeItem("access_token"), localStorage.removeItem("user"));
        const P = new Error(v.message);
        throw Object.assign(P, {
          status: v.status,
          traceId: v.traceId,
          requestId: v.requestId,
          endpoint: v.endpoint,
          method: v.method,
          duration: v.duration,
          isTokenExpired: v.isTokenExpired
        }), !Ur(P) && v.status !== 503, P;
      }
      const y = await h.json(), T = Math.round(performance.now() - l);
      return console.log(`[API] ✓ ${f} ${e} (${T}ms, trace: ${s})`), y;
    },
    i,
    { maxAttempts: 3, initialDelay: 1e3, maxDelay: 8e3 }
  ).then((h) => {
    if (h.success)
      return h.data;
    const k = h.error || new Error("Failed to fetch data"), y = k;
    throw y.traceId ? console.error(
      `[API] Request failed for ${e}: ${k.message}`,
      `(trace: ${y.traceId})`
    ) : console.error(`[API] Request failed for ${e}:`, k), k;
  });
}
const oe = {
  auth: {
    login: (e, r) => E("/auth/login", {
      method: "POST",
      body: { username: e, password: r }
    }),
    register: (e, r, n) => E("/auth/register", {
      method: "POST",
      body: { username: e, email: r, password: n }
    }),
    refresh: () => E("/auth/refresh", { method: "POST" })
  },
  incidents: {
    list: () => E("/incidents"),
    get: (e) => E(`/incidents/${e}`),
    create: (e) => E("/incidents", { method: "POST", body: e }),
    update: (e, r) => E(`/incidents/${e}`, { method: "PATCH", body: r }),
    getTimeline: (e) => E(`/incidents/${e}/timeline`),
    getCorrelations: (e) => E(`/incidents/${e}/correlations`),
    getAnalysis: (e) => E(`/incidents/${e}/analysis`)
  },
  services: {
    list: () => E("/services"),
    get: (e) => E(`/services/${e}`),
    create: (e) => E("/services", { method: "POST", body: e }),
    update: (e, r) => E(`/services/${e}`, { method: "PATCH", body: r })
  },
  slos: {
    list: () => E("/slos"),
    get: (e) => E(`/slos/${e}`),
    create: (e) => E("/slos", { method: "POST", body: e }),
    update: (e, r) => E(`/slos/${e}`, { method: "PATCH", body: r }),
    delete: (e) => E(`/slos/${e}`, { method: "DELETE" }),
    calculate: (e) => E(`/slos/${e}/calculate`, { method: "POST" }),
    getHistory: (e) => E(`/slos/${e}/history`)
  },
  metrics: {
    getAvailability: (e) => E(`/metrics/availability/${e}`),
    getErrorRate: (e) => E(`/metrics/error-rate/${e}`),
    getLatency: (e) => E(`/metrics/latency/${e}`)
  },
  kubernetes: {
    getPods: (e, r) => E(`/kubernetes/pods/${e}/${r}`),
    getDeployments: (e, r) => E(`/kubernetes/deployments/${e}/${r}`),
    getEvents: (e, r) => E(`/kubernetes/events/${e}/${r}`)
  },
  logs: {
    getErrors: (e) => E(`/logs/${e}/errors`),
    search: (e, r) => E(`/logs/${e}/search?q=${encodeURIComponent(r)}`)
  },
  detection: {
    getRules: () => E("/detection/rules"),
    getStatus: () => E("/detection/status")
  },
  investigation: {
    getHypotheses: (e) => E(`/incidents/${e}/investigation/hypotheses`),
    createHypothesis: (e, r) => E(`/incidents/${e}/investigation/hypotheses`, { method: "POST", body: r }),
    getSteps: (e) => E(`/incidents/${e}/investigation/steps`),
    createStep: (e, r) => E(`/incidents/${e}/investigation/steps`, { method: "POST", body: r }),
    getRCA: (e) => E(`/incidents/${e}/investigation/rca`),
    getRecommendedActions: (e) => E(`/incidents/${e}/investigation/recommended-actions`)
  }
};
function En({
  url: e = {}.VITE_WS_URL || "ws://reliability-backend:9000/api/realtime",
  onIncidentCreated: r,
  onIncidentUpdated: n,
  onCorrelationFound: i,
  onTimelineEvent: a,
  onAlert: s
} = {}) {
  const [f, l] = Y(!1), [p, m] = Y(null), [u, h] = Y(null), [k, y] = Y(null), [T, v] = Y(0);
  Ie(() => {
    let S = !1, b;
    const H = () => {
      S || (console.log(`[WebSocket] Connecting to ${e}...`), b = new WebSocket(e), b.onopen = () => {
        S || (console.log("[WebSocket] Connected to realtime server"), l(!0), h(null), v(0));
      }, b.onmessage = (L) => {
        if (!S)
          try {
            const N = JSON.parse(L.data);
            switch (m(N), N.type) {
              case "incident_created":
                r == null || r(N.payload);
                break;
              case "incident_updated":
                n == null || n(N.payload);
                break;
              case "correlation_found":
                i == null || i(N.payload);
                break;
              case "timeline_event":
                a == null || a(N.payload);
                break;
              case "alert":
                s == null || s(N.payload);
                break;
              default:
                console.log("[WebSocket] Unknown message type:", N.type);
            }
          } catch (N) {
            console.error("[WebSocket] Failed to parse message:", N);
          }
      }, b.onerror = (L) => {
        S || (console.error("[WebSocket] Error:", L), h("WebSocket connection error"), l(!1));
      }, b.onclose = (L) => {
        if (S)
          return;
        console.log("[WebSocket] Connection closed:", L.code, L.reason), l(!1);
        const N = Math.min(1e3 * Math.pow(2, T), 3e4);
        console.log(`[WebSocket] Attempting reconnection in ${N}ms...`), setTimeout(() => {
          S || (v((q) => q + 1), H());
        }, N);
      }, y(b));
    };
    return H(), () => {
      S = !0, b && b.readyState === WebSocket.OPEN && b.close();
    };
  }, [e, T]);
  const P = St((S) => {
    (k == null ? void 0 : k.readyState) === WebSocket.OPEN ? k.send(JSON.stringify(S)) : console.warn("[WebSocket] Cannot send - not connected");
  }, [k]);
  return {
    connected: f,
    lastMessage: p,
    error: u,
    send: P
  };
}
const X = {
  border: "#2d333d",
  text: "#e6e8eb",
  textMuted: "#9fa6b2",
  accent: "#00d2ff",
  surface: "#1a1d23"
}, ee = {
  container: R`
    padding: 24px;
    overflow-y: auto;
    background: #0d0e12;
    &::-webkit-scrollbar {
      width: 4px;
    }
    &::-webkit-scrollbar-thumb {
      background: ${X.border};
      border-radius: 2px;
    }
  `,
  sectionTitle: R`
    font-size: 16px;
    font-weight: 700;
    margin-bottom: 24px;
    color: ${X.text};
    text-transform: uppercase;
    letter-spacing: 1px;
    display: flex;
    align-items: center;
    gap: 10px;

    &::after {
      content: '';
      flex: 1;
      height: 1px;
      background: ${X.border};
    }
  `,
  timeline: R`
    display: flex;
    flex-direction: column;
    gap: 0;
    position: relative;
    padding-left: 20px;

    &::before {
      content: '';
      position: absolute;
      left: 6px;
      top: 0;
      bottom: 0;
      width: 2px;
      background: ${X.border};
    }
  `,
  event: R`
    position: relative;
    padding-bottom: 30px;
    padding-left: 24px;

    &:last-child {
      padding-bottom: 0;
    }
  `,
  iconWrapper: (e) => R`
    position: absolute;
    left: -24px;
    top: 0;
    width: 32px;
    height: 32px;
    background: #1a1d23;
    border: 1px solid ${X.border};
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    z-index: 1;
    box-shadow: 0 0 0 4px #0d0e12;
  `,
  eventContent: R`
    background: ${X.surface};
    border: 1px solid ${X.border};
    border-radius: 8px;
    padding: 16px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.2);
  `,
  eventHeader: R`
    display: flex;
    justify-content: space-between;
    margin-bottom: 8px;
  `,
  eventTitle: R`
    font-weight: 600;
    font-size: 14px;
    color: ${X.text};
  `,
  eventTime: R`
    font-size: 11px;
    color: ${X.textMuted};
  `,
  eventDesc: R`
    font-size: 13px;
    color: ${X.textMuted};
    line-height: 1.5;
  `,
  metadata: R`
    margin-top: 12px;
    padding: 8px;
    background: #0b0c10;
    border-radius: 4px;
    font-family: 'Berkeley Mono', 'Fira Code', monospace;
    font-size: 11px;
    color: #00ff41;
    overflow-x: auto;
  `
}, Cn = (e) => ({
  alert: "🚨",
  metric_anomaly: "📊",
  log_event: "📝",
  deployment: "🚀",
  mitigation: "🔧",
  resolution: "✅",
  trace_anomaly: "🔍",
  system: "⚙️"
})[e] || "•";
function Rn({ events: e }) {
  return /* @__PURE__ */ o.jsxs("div", { className: ee.container, children: [
    /* @__PURE__ */ o.jsx("h3", { className: ee.sectionTitle, children: "Incident Timeline" }),
    /* @__PURE__ */ o.jsx("div", { className: ee.timeline, children: e.length === 0 ? /* @__PURE__ */ o.jsxs("div", { style: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "40px 20px",
      color: X.textMuted,
      textAlign: "center",
      gap: "12px"
    }, children: [
      /* @__PURE__ */ o.jsx("div", { style: { fontSize: "24px" }, children: "📋" }),
      /* @__PURE__ */ o.jsxs("div", { children: [
        /* @__PURE__ */ o.jsx("div", { style: { fontSize: "13px", fontWeight: 600, marginBottom: "4px" }, children: "No timeline events yet" }),
        /* @__PURE__ */ o.jsx("div", { style: { fontSize: "12px" }, children: "Events will appear as the incident progresses" })
      ] })
    ] }) : /* @__PURE__ */ o.jsxs(o.Fragment, { children: [
      /* @__PURE__ */ o.jsxs("div", { style: {
        fontSize: "12px",
        color: X.textMuted,
        marginBottom: "20px",
        padding: "12px 0 0 24px"
      }, children: [
        e.length,
        " event(s) recorded"
      ] }),
      e.map((r) => /* @__PURE__ */ o.jsxs("div", { className: ee.event, children: [
        /* @__PURE__ */ o.jsx("div", { className: ee.iconWrapper(r.type), children: Cn(r.type) }),
        /* @__PURE__ */ o.jsxs("div", { className: ee.eventContent, children: [
          /* @__PURE__ */ o.jsxs("div", { className: ee.eventHeader, children: [
            /* @__PURE__ */ o.jsx("div", { className: ee.eventTitle, children: r.title }),
            /* @__PURE__ */ o.jsx("div", { className: ee.eventTime, children: new Date(r.timestamp).toLocaleTimeString() })
          ] }),
          /* @__PURE__ */ o.jsx("div", { className: ee.eventDesc, children: r.description }),
          r.metadata && Object.keys(r.metadata).length > 0 && /* @__PURE__ */ o.jsxs("details", { style: { marginTop: "12px" }, children: [
            /* @__PURE__ */ o.jsx("summary", { style: {
              fontSize: "11px",
              color: X.accent,
              cursor: "pointer",
              fontWeight: 600
            }, children: "Show metadata" }),
            /* @__PURE__ */ o.jsx("pre", { className: ee.metadata, children: JSON.stringify(r.metadata, null, 2) })
          ] })
        ] })
      ] }, r.id))
    ] }) })
  ] });
}
const M = {
  bg: "#0b0c10",
  surface: "#1a1d23",
  border: "#2d333d",
  accent: "#00d2ff",
  text: "#e6e8eb",
  textMuted: "#9fa6b2"
}, ae = {
  container: R`
    display: flex;
    flex-direction: column;
    height: 100%;
    background: ${M.surface};
  `,
  tabs: R`
    display: flex;
    padding: 0 10px;
    border-bottom: 1px solid ${M.border};
    background: #0d0e12;
  `,
  tab: (e) => R`
    padding: 12px 20px;
    font-size: 13px;
    font-weight: 600;
    color: ${e ? M.accent : M.textMuted};
    cursor: pointer;
    border-bottom: 2px solid ${e ? M.accent : "transparent"};
    transition: all 0.2s;

    &:hover {
      color: ${M.text};
    }
  `,
  content: R`
    flex: 1;
    overflow-y: auto;
    padding: 20px;
  `,
  dataCard: R`
    background: ${M.bg};
    border: 1px solid ${M.border};
    border-radius: 8px;
    padding: 16px;
    margin-bottom: 12px;
  `,
  logEntry: (e) => R`
    font-family: 'Berkeley Mono', monospace;
    font-size: 12px;
    padding: 8px;
    border-bottom: 1px solid ${M.border};
    display: flex;
    gap: 12px;
    
    &::before {
      content: '';
      width: 4px;
      height: 100%;
      background: ${e === "error" ? "#f44336" : e === "warn" ? "#ff9800" : "#4caf50"};
    }
  `
};
function $n({ incidentId: e, service: r }) {
  var h, k;
  const [n, i] = Y("metrics"), [a, s] = Y(null), [f, l] = Y(!1), [p, m] = Y(null);
  Ie(() => {
    u();
  }, [n, e, r]);
  const u = async () => {
    l(!0), m(null), s(null);
    try {
      console.log(`[TelemetryTabs] Loading ${n} for service: ${r}`);
      let y;
      switch (n) {
        case "metrics":
          const T = await oe.metrics.getErrorRate(r), v = await oe.metrics.getLatency(r);
          y = { errorRate: T, latency: v };
          break;
        case "logs":
          y = await oe.logs.getErrors(r);
          break;
        case "traces":
          y = [];
          break;
        case "k8s":
          y = await oe.kubernetes.getPods("default", r);
          break;
      }
      console.log(`[TelemetryTabs] Loaded ${n}:`, y), s(y);
    } catch (y) {
      const T = y instanceof Error ? y.message : `Failed to load ${n}`;
      console.error(`[TelemetryTabs] Error loading ${n}:`, T), m(T);
    } finally {
      l(!1);
    }
  };
  return /* @__PURE__ */ o.jsxs("div", { className: ae.container, children: [
    /* @__PURE__ */ o.jsx("div", { className: ae.tabs, children: ["metrics", "logs", "traces", "k8s"].map((y) => /* @__PURE__ */ o.jsx(
      "div",
      {
        className: ae.tab(n === y),
        onClick: () => i(y),
        children: y.toUpperCase()
      },
      y
    )) }),
    /* @__PURE__ */ o.jsxs("div", { className: ae.content, children: [
      p && /* @__PURE__ */ o.jsxs("div", { style: {
        padding: "16px",
        background: "rgba(244, 67, 54, 0.1)",
        borderRadius: "4px",
        color: "#ff9999",
        fontSize: "12px",
        marginBottom: "16px"
      }, children: [
        /* @__PURE__ */ o.jsxs("div", { style: { fontWeight: 600, marginBottom: "8px" }, children: [
          "❌ Failed to load ",
          n
        ] }),
        /* @__PURE__ */ o.jsx("div", { style: { fontSize: "11px" }, children: p }),
        /* @__PURE__ */ o.jsx(
          "button",
          {
            onClick: () => u(),
            style: {
              marginTop: "8px",
              padding: "6px 12px",
              background: "#f44336",
              border: "none",
              borderRadius: "3px",
              color: "#fff",
              fontSize: "11px",
              cursor: "pointer"
            },
            children: "Retry"
          }
        )
      ] }),
      f ? /* @__PURE__ */ o.jsxs("div", { style: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 20px",
        color: M.textMuted,
        gap: "12px"
      }, children: [
        /* @__PURE__ */ o.jsx("div", { style: { fontSize: "24px" }, children: "⏳" }),
        /* @__PURE__ */ o.jsxs("div", { style: { fontSize: "12px" }, children: [
          "Loading ",
          n,
          "..."
        ] })
      ] }) : /* @__PURE__ */ o.jsxs("div", { children: [
        n === "metrics" && a && /* @__PURE__ */ o.jsxs(o.Fragment, { children: [
          /* @__PURE__ */ o.jsxs("div", { className: ae.dataCard, children: [
            /* @__PURE__ */ o.jsx("div", { style: { color: M.textMuted, fontSize: "12px", marginBottom: "8px" }, children: "Error Rate" }),
            /* @__PURE__ */ o.jsxs("div", { style: { fontSize: "24px", fontWeight: 700, color: "#f44336" }, children: [
              (((h = a.errorRate) == null ? void 0 : h.value) || 0).toFixed(2),
              "%"
            ] })
          ] }),
          /* @__PURE__ */ o.jsxs("div", { className: ae.dataCard, children: [
            /* @__PURE__ */ o.jsx("div", { style: { color: M.textMuted, fontSize: "12px", marginBottom: "8px" }, children: "P95 Latency" }),
            /* @__PURE__ */ o.jsxs("div", { style: { fontSize: "24px", fontWeight: 700, color: "#00d2ff" }, children: [
              (((k = a.latency) == null ? void 0 : k.value) || 0).toFixed(3),
              "s"
            ] })
          ] })
        ] }),
        n === "logs" && Array.isArray(a) && /* @__PURE__ */ o.jsx("div", { className: ae.dataCard, style: { padding: 0 }, children: a.length === 0 ? /* @__PURE__ */ o.jsxs("div", { style: { padding: "20px", color: M.textMuted, textAlign: "center" }, children: [
          /* @__PURE__ */ o.jsx("div", { style: { fontSize: "14px", marginBottom: "8px" }, children: "✅ No error logs" }),
          /* @__PURE__ */ o.jsx("div", { style: { fontSize: "12px" }, children: "No errors detected for this service" })
        ] }) : /* @__PURE__ */ o.jsxs(o.Fragment, { children: [
          /* @__PURE__ */ o.jsxs("div", { style: {
            padding: "12px 16px",
            borderBottom: `1px solid ${M.border}`,
            fontSize: "12px",
            color: M.textMuted,
            fontWeight: 600
          }, children: [
            a.length,
            " error log(s)"
          ] }),
          a.map((y, T) => /* @__PURE__ */ o.jsxs("div", { className: ae.logEntry(y.level || "error"), children: [
            /* @__PURE__ */ o.jsx("span", { style: { color: M.textMuted, whiteSpace: "nowrap" }, children: new Date(y.timestamp).toLocaleTimeString() }),
            /* @__PURE__ */ o.jsx("span", { style: { color: M.text }, children: y.message })
          ] }, T))
        ] }) }),
        n === "k8s" && Array.isArray(a) && /* @__PURE__ */ o.jsx("div", { className: ae.dataCard, children: a.length === 0 ? /* @__PURE__ */ o.jsxs("div", { style: { padding: "20px", color: M.textMuted, textAlign: "center" }, children: [
          /* @__PURE__ */ o.jsx("div", { style: { fontSize: "14px", marginBottom: "8px" }, children: "📦 No pods found" }),
          /* @__PURE__ */ o.jsx("div", { style: { fontSize: "12px" }, children: "Service may not be deployed" })
        ] }) : /* @__PURE__ */ o.jsxs(o.Fragment, { children: [
          /* @__PURE__ */ o.jsxs("h4", { style: { margin: "0 0 10px 0", fontSize: "14px", padding: "0 16px", paddingTop: "16px" }, children: [
            "System Resources (",
            a.length,
            " pods)"
          ] }),
          a.map((y, T) => /* @__PURE__ */ o.jsxs("div", { style: { display: "flex", justifyContent: "space-between", padding: "8px 16px", borderBottom: `1px solid ${M.border}` }, children: [
            /* @__PURE__ */ o.jsx("span", { style: { fontSize: "13px" }, children: y.name }),
            /* @__PURE__ */ o.jsx("span", { style: {
              fontSize: "11px",
              background: y.status === "Running" ? "#4caf5020" : "#f4433620",
              color: y.status === "Running" ? "#4caf50" : "#f44336",
              padding: "2px 6px",
              borderRadius: "4px"
            }, children: y.status })
          ] }, T))
        ] }) }),
        n === "traces" && /* @__PURE__ */ o.jsxs("div", { style: { color: M.textMuted, textAlign: "center", padding: "40px 20px" }, children: [
          /* @__PURE__ */ o.jsx("div", { style: { fontSize: "24px", marginBottom: "12px" }, children: "🔄" }),
          /* @__PURE__ */ o.jsx("div", { style: { fontSize: "12px" }, children: "Distributed tracing investigation is coming soon." }),
          /* @__PURE__ */ o.jsx("div", { style: { fontSize: "11px", marginTop: "8px", color: M.textMuted }, children: "Integration with Tempo in progress" })
        ] })
      ] })
    ] })
  ] });
}
const Tn = qr`
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
`, _n = qr`
  0% { box-shadow: 0 0 0 0 rgba(244, 67, 54, 0.4); }
  70% { box-shadow: 0 0 0 10px rgba(244, 67, 54, 0); }
  100% { box-shadow: 0 0 0 0 rgba(244, 67, 54, 0); }
`, An = (e) => ({
  container: R`
      display: flex;
      height: 100%;
      background: ${e.colors.background.primary};
      color: ${e.colors.text.primary};
      font-family: ${e.typography.fontFamily};
      overflow: hidden;
      animation: ${Tn} 0.5s ease-out;
    `,
  sidebar: R`
    width: 320px;
    border-right: 1px solid ${e.colors.border.weak};
    display: flex;
    flex-direction: column;
    background: ${e.colors.background.secondary};
  `,
  sidebarHeader: R`
    padding: 20px;
    border-bottom: 1px solid ${e.colors.border.weak};
    font-size: 18px;
    font-weight: 700;
    letter-spacing: -0.5px;
    display: flex;
    align-items: center;
    gap: 10px;
  `,
  incidentList: R`
    flex: 1;
    overflow-y: auto;
    padding: 10px;
    &::-webkit-scrollbar {
      width: 4px;
    }
    &::-webkit-scrollbar-thumb {
      background: ${e.colors.border.weak};
      border-radius: 2px;
    }
  `,
  incidentCard: (r, n) => R`
    padding: 16px;
    border-radius: 8px;
    margin-bottom: 10px;
    background: ${r ? e.colors.action.hover : "transparent"};
    border: 1px solid ${r ? e.colors.primary.main : e.colors.border.weak};
    cursor: pointer;
    transition: all 0.2s ease;
    position: relative;
    overflow: hidden;

    &:hover {
      background: ${e.colors.action.hover};
      transform: translateX(4px);
    }

    &::before {
      content: '';
      position: absolute;
      left: 0;
      top: 0;
      bottom: 0;
      width: 4px;
      background: ${n === "critical" ? e.colors.error.main : n === "high" ? e.colors.warning.main : n === "medium" ? e.colors.info.main : e.colors.secondary.main};
    }
  `,
  cardTitle: R`
    font-size: 14px;
    font-weight: 600;
    margin-bottom: 6px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  `,
  cardMeta: R`
    display: flex;
    justify-content: space-between;
    font-size: 11px;
    color: ${e.colors.text.secondary};
  `,
  mainContent: R`
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  `,
  header: R`
    padding: 24px;
    border-bottom: 1px solid ${e.colors.border.weak};
    background: ${e.colors.background.secondary};
    display: flex;
    justify-content: space-between;
    align-items: center;
  `,
  headerInfo: R`
    display: flex;
    flex-direction: column;
    gap: 4px;
  `,
  headerTitle: R`
    font-size: 24px;
    font-weight: 800;
    letter-spacing: -1px;
  `,
  badge: (r) => R`
    padding: 4px 10px;
    border-radius: 12px;
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    background: ${r}20;
    color: ${r};
    border: 1px solid ${r}40;
  `,
  actions: R`
    display: flex;
    gap: 12px;
  `,
  button: (r) => R`
    padding: 10px 20px;
    border-radius: 6px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    background: ${r ? e.colors.primary.main : "transparent"};
    border: 1px solid ${r ? "transparent" : e.colors.border.weak};
    color: ${e.colors.text.primary};

    &:hover {
      transform: translateY(-2px);
      box-shadow: ${r ? "0 4px 15px rgba(0, 210, 255, 0.3)" : "none"};
      background: ${r ? e.colors.primary.main : e.colors.action.hover};
    }
  `,
  contentGrid: R`
    display: grid;
    grid-template-columns: 1fr 400px;
    flex: 1;
    overflow: hidden;
  `,
  tabContainer: R`
    border-left: 1px solid ${e.colors.border.weak};
    display: flex;
    flex-direction: column;
    overflow: hidden;
  `,
  emptyState: R`
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    color: ${e.colors.text.secondary};
    gap: 20px;
  `,
  liveDot: R`
    width: 10px;
    height: 10px;
    background: ${e.colors.error.main};
    border-radius: 50%;
    animation: ${_n} 2s infinite;
  `
});
function On() {
  const e = kt(), r = jt(An), [n, i] = Y([]), [a, s] = Y(null), [f, l] = Y([]), [p, m] = Y(!0), [u, h] = Y(null), [k, y] = Y(!1), [T, v] = Y(!1), [P, S] = Y([]), [b, H] = Y(null), [L, N] = Y(() => localStorage.getItem("selectedService") || "payment-service");
  Ie(() => {
    q();
  }, []), Ie(() => {
    ke();
  }, [L]);
  const q = async () => {
    try {
      H(null);
      const g = await oe.services.list(), x = (Array.isArray(g) ? g : []).map((j) => j.name);
      S(x), x.includes("payment-service") && !localStorage.getItem("selectedService") && I("payment-service");
    } catch (g) {
      const x = g instanceof Error ? g.message : "Failed to load services";
      console.error("[IncidentControlRoom] Failed to load services:", x), H(x), S(["payment-service", "api-gateway", "user-service", "frontend-web"]);
    }
  }, I = (g) => {
    N(g), localStorage.setItem("selectedService", g), s(null), l([]);
  }, ke = async () => {
    try {
      v(!0), h(null);
      const g = await oe.incidents.list(), x = Array.isArray(g) ? g : [], j = L ? x.filter((ie) => ie.service === L) : x;
      i(j), j.length > 0 && !a ? (console.log("[IncidentControlRoom] Auto-selecting first incident:", j[0].id), ce(j[0])) : j.length === 0 && (console.log("[IncidentControlRoom] No incidents found for service:", L), s(null), l([]));
    } catch (g) {
      const x = g instanceof Error ? g.message : "Failed to load incidents";
      console.error("[IncidentControlRoom] Failed to load incidents:", x), h(x), i([]);
    } finally {
      v(!1), m(!1);
    }
  }, ce = async (g) => {
    try {
      console.log("[IncidentControlRoom] Selecting incident:", g.id), s(g), y(!0), h(null);
      const x = await oe.incidents.getTimeline(g.id), j = Array.isArray(x) ? x : [];
      console.log("[IncidentControlRoom] Loaded timeline events:", j.length), l(j);
    } catch (x) {
      const j = x instanceof Error ? x.message : "Failed to load timeline";
      console.error("[IncidentControlRoom] Failed to load timeline:", j), h(j), l([]);
    } finally {
      y(!1);
    }
  };
  En({
    onIncidentCreated: (g) => {
      i((x) => [g, ...x]), a || ce(g);
    },
    onIncidentUpdated: (g) => {
      i(
        (x) => x.map((j) => j.id === g.id ? { ...j, ...g } : j)
      ), (a == null ? void 0 : a.id) === g.id && s((x) => ({ ...x, ...g }));
    },
    onTimelineEvent: (g) => {
      (a == null ? void 0 : a.id) === g.incident_id && l((x) => [g, ...x]);
    }
  });
  const ze = async (g) => {
    try {
      console.log("[IncidentControlRoom] Acknowledging incident:", g), await oe.incidents.update(g, { status: "investigating" }), i(
        (x) => x.map((j) => j.id === g ? { ...j, status: "investigating" } : j)
      ), (a == null ? void 0 : a.id) === g && s((x) => ({ ...x, status: "investigating" }));
    } catch (x) {
      const j = x instanceof Error ? x.message : "Failed to acknowledge incident";
      console.error("[IncidentControlRoom] Failed to acknowledge:", j), h(j);
    }
  }, Me = async (g) => {
    try {
      console.log("[IncidentControlRoom] Resolving incident:", g), await oe.incidents.update(g, { status: "resolved" }), i(
        (x) => x.map((j) => j.id === g ? { ...j, status: "resolved" } : j)
      ), (a == null ? void 0 : a.id) === g && s((x) => ({ ...x, status: "resolved" }));
    } catch (x) {
      const j = x instanceof Error ? x.message : "Failed to resolve incident";
      console.error("[IncidentControlRoom] Failed to resolve:", j), h(j);
    }
  };
  return p ? /* @__PURE__ */ o.jsxs("div", { className: r.container, children: [
    /* @__PURE__ */ o.jsxs("div", { className: r.sidebar, children: [
      /* @__PURE__ */ o.jsxs("div", { className: r.sidebarHeader, children: [
        /* @__PURE__ */ o.jsx("div", { className: r.liveDot }),
        /* @__PURE__ */ o.jsx("span", { children: "Active Incidents" })
      ] }),
      /* @__PURE__ */ o.jsxs("div", { className: r.emptyState, children: [
        /* @__PURE__ */ o.jsx("div", { style: { fontSize: "14px", fontWeight: 500 }, children: "📊 Initializing Control Room" }),
        /* @__PURE__ */ o.jsx("div", { style: { fontSize: "12px", marginTop: "8px", color: e.colors.text.secondary }, children: "Loading services and incidents..." })
      ] })
    ] }),
    /* @__PURE__ */ o.jsx("div", { style: { flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: e.colors.text.secondary }, children: /* @__PURE__ */ o.jsxs("div", { style: { textAlign: "center" }, children: [
      /* @__PURE__ */ o.jsx("div", { style: { fontSize: "24px", marginBottom: "12px" }, children: "⏳" }),
      /* @__PURE__ */ o.jsx("div", { children: "Initializing" })
    ] }) })
  ] }) : /* @__PURE__ */ o.jsxs("div", { className: r.container, children: [
    /* @__PURE__ */ o.jsxs("div", { className: r.sidebar, children: [
      /* @__PURE__ */ o.jsxs("div", { className: r.sidebarHeader, children: [
        /* @__PURE__ */ o.jsx("div", { className: r.liveDot }),
        /* @__PURE__ */ o.jsx("span", { children: "Active Incidents" })
      ] }),
      b && /* @__PURE__ */ o.jsxs("div", { style: {
        padding: "12px 20px",
        background: "rgba(244, 67, 54, 0.1)",
        borderBottom: "1px solid #f44336",
        fontSize: "12px",
        color: "#ff9999"
      }, children: [
        "❌ Services error: ",
        b
      ] }),
      /* @__PURE__ */ o.jsxs("div", { style: { padding: "10px 20px", borderBottom: `1px solid ${e.colors.border.weak}` }, children: [
        /* @__PURE__ */ o.jsx("label", { style: { fontSize: "11px", color: e.colors.text.secondary, marginBottom: "6px", display: "block" }, children: "Service Filter" }),
        /* @__PURE__ */ o.jsxs(
          "select",
          {
            value: L,
            onChange: (g) => I(g.target.value),
            style: {
              width: "100%",
              padding: "8px 12px",
              background: e.colors.action.hover,
              border: `1px solid ${e.colors.border.weak}`,
              borderRadius: "6px",
              color: e.colors.text.primary,
              fontSize: "13px",
              fontWeight: 600,
              cursor: "pointer",
              outline: "none"
            },
            children: [
              /* @__PURE__ */ o.jsx("option", { value: "", children: "All Services" }),
              P.map((g) => /* @__PURE__ */ o.jsx("option", { value: g, children: g }, g))
            ]
          }
        )
      ] }),
      /* @__PURE__ */ o.jsx("div", { className: r.incidentList, children: T ? /* @__PURE__ */ o.jsxs("div", { className: r.emptyState, children: [
        /* @__PURE__ */ o.jsx("div", { style: { fontSize: "14px", fontWeight: 500 }, children: "📋 Loading incidents" }),
        /* @__PURE__ */ o.jsx("div", { style: { fontSize: "12px", marginTop: "8px", color: e.colors.text.secondary }, children: "Fetching from backend..." })
      ] }) : u ? /* @__PURE__ */ o.jsxs("div", { style: {
        padding: "20px",
        background: "rgba(244, 67, 54, 0.1)",
        borderRadius: "4px",
        margin: "10px",
        fontSize: "12px",
        color: "#ff9999"
      }, children: [
        /* @__PURE__ */ o.jsx("div", { style: { fontWeight: 600, marginBottom: "8px" }, children: "❌ Failed to load incidents" }),
        /* @__PURE__ */ o.jsx("div", { style: { fontSize: "11px", marginBottom: "12px" }, children: u }),
        /* @__PURE__ */ o.jsx(
          "button",
          {
            onClick: () => ke(),
            style: {
              padding: "6px 12px",
              background: "#f44336",
              border: "none",
              borderRadius: "3px",
              color: "#fff",
              fontSize: "11px",
              cursor: "pointer"
            },
            children: "Retry"
          }
        )
      ] }) : n.length === 0 ? /* @__PURE__ */ o.jsxs("div", { className: r.emptyState, children: [
        /* @__PURE__ */ o.jsx("div", { style: { fontSize: "14px", fontWeight: 500 }, children: "✅ No active incidents" }),
        /* @__PURE__ */ o.jsx("div", { style: { fontSize: "12px", marginTop: "8px", color: e.colors.text.secondary }, children: "All systems healthy" })
      ] }) : n.map((g) => /* @__PURE__ */ o.jsxs(
        "div",
        {
          className: r.incidentCard((a == null ? void 0 : a.id) === g.id, g.severity),
          onClick: () => ce(g),
          children: [
            /* @__PURE__ */ o.jsx("div", { className: r.cardTitle, children: g.title }),
            /* @__PURE__ */ o.jsxs("div", { className: r.cardMeta, children: [
              /* @__PURE__ */ o.jsx("span", { children: g.service }),
              /* @__PURE__ */ o.jsx("span", { children: new Date(g.started_at).toLocaleTimeString() })
            ] })
          ]
        },
        g.id
      )) })
    ] }),
    /* @__PURE__ */ o.jsxs("div", { className: r.mainContent, children: [
      u && /* @__PURE__ */ o.jsxs("div", { style: {
        padding: "16px",
        background: "rgba(244, 67, 54, 0.1)",
        borderBottom: "1px solid #f44336",
        color: "#ff9999",
        fontSize: "12px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center"
      }, children: [
        /* @__PURE__ */ o.jsxs("span", { children: [
          "❌ Error: ",
          u
        ] }),
        /* @__PURE__ */ o.jsx(
          "button",
          {
            onClick: () => h(null),
            style: {
              background: "transparent",
              border: "none",
              color: "#ff9999",
              cursor: "pointer",
              fontSize: "18px"
            },
            children: "×"
          }
        )
      ] }),
      a ? /* @__PURE__ */ o.jsxs(o.Fragment, { children: [
        /* @__PURE__ */ o.jsxs("div", { className: r.header, children: [
          /* @__PURE__ */ o.jsxs("div", { className: r.headerInfo, children: [
            /* @__PURE__ */ o.jsxs("div", { style: { display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }, children: [
              /* @__PURE__ */ o.jsx("div", { className: r.badge(
                a.severity === "critical" ? e.colors.error.main : a.severity === "high" ? e.colors.warning.main : e.colors.info.main
              ), children: a.severity }),
              /* @__PURE__ */ o.jsx("div", { className: r.badge(e.colors.primary.main), children: a.status })
            ] }),
            /* @__PURE__ */ o.jsx("div", { className: r.headerTitle, children: a.title }),
            /* @__PURE__ */ o.jsxs("div", { style: { color: e.colors.text.secondary, fontSize: "14px" }, children: [
              "Detected for ",
              /* @__PURE__ */ o.jsx("strong", { children: a.service }),
              " at ",
              new Date(a.started_at).toLocaleString()
            ] })
          ] }),
          /* @__PURE__ */ o.jsxs("div", { className: r.actions, children: [
            a.status === "open" && /* @__PURE__ */ o.jsx(
              "button",
              {
                className: r.button(!0),
                onClick: () => ze(a.id),
                children: "Acknowledge"
              }
            ),
            a.status !== "resolved" && /* @__PURE__ */ o.jsx(
              "button",
              {
                className: r.button(!1),
                onClick: () => Me(a.id),
                children: "Mark Resolved"
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ o.jsxs("div", { className: r.contentGrid, children: [
          k ? /* @__PURE__ */ o.jsxs("div", { style: {
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            color: e.colors.text.secondary,
            gap: "12px"
          }, children: [
            /* @__PURE__ */ o.jsx("div", { style: { fontSize: "24px" }, children: "⏳" }),
            /* @__PURE__ */ o.jsx("div", { style: { fontSize: "12px" }, children: "Loading timeline events..." })
          ] }) : /* @__PURE__ */ o.jsx(Rn, { events: f }),
          /* @__PURE__ */ o.jsx("div", { className: r.tabContainer, children: /* @__PURE__ */ o.jsx(
            $n,
            {
              incidentId: a.id,
              service: a.service
            }
          ) })
        ] })
      ] }) : /* @__PURE__ */ o.jsxs("div", { className: r.emptyState, children: [
        /* @__PURE__ */ o.jsx("div", { style: { fontSize: "24px", marginBottom: "12px" }, children: "👋" }),
        /* @__PURE__ */ o.jsx("h2", { style: { margin: "0 0 8px 0" }, children: "Select an incident to investigate" }),
        /* @__PURE__ */ o.jsx("p", { style: { margin: "0", color: e.colors.text.secondary }, children: n.length > 0 ? "Click on an incident in the left sidebar to view details, timeline, and telemetry." : "All systems are healthy. No active incidents detected." })
      ] })
    ] })
  ] });
}
class In extends er.Component {
  constructor(r) {
    super(r), this.handleRetry = () => {
      this.setState({ hasError: !1, error: void 0, errorInfo: void 0 });
    }, this.state = { hasError: !1, attemptNumber: 0 };
  }
  static getDerivedStateFromError(r) {
    return { hasError: !0, error: r };
  }
  componentDidCatch(r, n) {
    console.error("[ErrorBoundary] Error caught:", r), console.error("[ErrorBoundary] Error info:", n), this.props.onError && this.props.onError(r, n);
    try {
      const i = JSON.parse(localStorage.getItem("errorLogs") || "[]");
      i.push({
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        message: r.message,
        stack: r.stack,
        componentStack: n.componentStack
      }), localStorage.setItem("errorLogs", JSON.stringify(i.slice(-50)));
    } catch (i) {
      console.error("[ErrorBoundary] Failed to log error:", i);
    }
    this.setState((i) => ({
      errorInfo: n,
      attemptNumber: i.attemptNumber + 1
    }));
  }
  render() {
    if (this.state.hasError) {
      const { level: r = "component" } = this.props;
      return this.state, this.props.fallback ? this.props.fallback : r === "page" ? this.renderPageError() : r === "section" ? this.renderSectionError() : this.renderComponentError();
    }
    return this.props.children;
  }
  renderPageError() {
    var r;
    return /* @__PURE__ */ o.jsx("div", { style: F.pageContainer, children: /* @__PURE__ */ o.jsxs("div", { style: F.errorBox, children: [
      /* @__PURE__ */ o.jsx("div", { style: F.errorIcon, children: "⚠️" }),
      /* @__PURE__ */ o.jsx("h1", { style: F.pageTitle, children: "Application Error" }),
      /* @__PURE__ */ o.jsx("p", { style: F.message, children: ((r = this.state.error) == null ? void 0 : r.message) || "An unexpected error occurred." }),
      this.state.errorInfo && /* @__PURE__ */ o.jsxs("details", { style: F.details, children: [
        /* @__PURE__ */ o.jsx("summary", { style: F.summary, children: "Error Details" }),
        /* @__PURE__ */ o.jsx("pre", { style: F.pre, children: this.state.errorInfo.componentStack })
      ] }),
      /* @__PURE__ */ o.jsxs("div", { style: F.buttonGroup, children: [
        /* @__PURE__ */ o.jsx("button", { onClick: this.handleRetry, style: { ...F.button, ...F.retryButton }, children: "Try Again" }),
        /* @__PURE__ */ o.jsx(
          "button",
          {
            onClick: () => window.location.reload(),
            style: { ...F.button, ...F.reloadButton },
            children: "Reload Page"
          }
        )
      ] })
    ] }) });
  }
  renderSectionError() {
    var r;
    return /* @__PURE__ */ o.jsx("div", { style: F.sectionContainer, children: /* @__PURE__ */ o.jsxs("div", { style: F.sectionError, children: [
      /* @__PURE__ */ o.jsx("div", { style: F.sectionIcon, children: "⚠️" }),
      /* @__PURE__ */ o.jsx("h3", { style: F.sectionTitle, children: "Section Unavailable" }),
      /* @__PURE__ */ o.jsx("p", { style: F.message, children: ((r = this.state.error) == null ? void 0 : r.message) || "This section encountered an error." }),
      /* @__PURE__ */ o.jsx("button", { onClick: this.handleRetry, style: F.button, children: "Try Again" })
    ] }) });
  }
  renderComponentError() {
    var r;
    return /* @__PURE__ */ o.jsxs("div", { style: F.componentError, children: [
      /* @__PURE__ */ o.jsx("span", { style: F.componentIcon, children: "❌" }),
      /* @__PURE__ */ o.jsx("span", { style: F.componentMessage, children: ((r = this.state.error) == null ? void 0 : r.message) || "Component error" })
    ] });
  }
}
const F = {
  // Page-level error
  pageContainer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "100vh",
    backgroundColor: "#f9fafb",
    padding: "16px"
  },
  errorBox: {
    backgroundColor: "white",
    borderRadius: "12px",
    padding: "48px 32px",
    boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)",
    textAlign: "center",
    maxWidth: "600px",
    borderLeft: "4px solid #ef4444"
  },
  errorIcon: {
    fontSize: "48px",
    marginBottom: "16px"
  },
  pageTitle: {
    margin: "0 0 12px 0",
    fontSize: "28px",
    fontWeight: "700",
    color: "#1f2937"
  },
  sectionIcon: {
    fontSize: "32px",
    marginRight: "8px"
  },
  componentIcon: {
    fontSize: "16px",
    marginRight: "6px"
  },
  message: {
    margin: "0 0 24px 0",
    fontSize: "15px",
    color: "#6b7280",
    lineHeight: "1.6"
  },
  details: {
    marginBottom: "24px",
    textAlign: "left",
    backgroundColor: "#f9fafb",
    borderRadius: "8px",
    padding: "12px"
  },
  summary: {
    cursor: "pointer",
    fontWeight: "600",
    color: "#374151",
    marginBottom: "8px"
  },
  pre: {
    margin: "0",
    fontSize: "12px",
    color: "#6b7280",
    overflow: "auto",
    maxHeight: "200px",
    fontFamily: "monospace"
  },
  buttonGroup: {
    display: "flex",
    gap: "12px",
    justifyContent: "center",
    flexWrap: "wrap"
  },
  button: {
    padding: "10px 20px",
    backgroundColor: "#3b82f6",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: 600,
    transition: "all 0.2s"
  },
  retryButton: {
    backgroundColor: "#10b981"
  },
  reloadButton: {
    backgroundColor: "#ef4444"
  },
  // Section-level error
  sectionContainer: {
    width: "100%",
    padding: "24px",
    backgroundColor: "white",
    borderRadius: "8px",
    minHeight: "200px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },
  sectionError: {
    textAlign: "center",
    maxWidth: "400px"
  },
  sectionTitle: {
    margin: "8px 0 12px 0",
    fontSize: "18px",
    fontWeight: "600",
    color: "#1f2937"
  },
  // Component-level error
  componentError: {
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    padding: "8px 12px",
    backgroundColor: "#fee2e2",
    color: "#991b1b",
    borderRadius: "4px",
    fontSize: "13px",
    fontWeight: "500"
  },
  componentMessage: {
    maxWidth: "300px",
    overflow: "hidden",
    textOverflow: "ellipsis"
  }
}, Dn = (e) => /* @__PURE__ */ o.jsx(In, { level: "page", children: /* @__PURE__ */ o.jsx("div", { className: "page-container", style: { width: "100%", height: "100%" }, children: /* @__PURE__ */ o.jsx(On, {}) }) }), zn = new wt().setRootPage(Dn);
export {
  zn as plugin
};

var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// node_modules/@neondatabase/serverless/index.mjs
var io = Object.create;
var Ce = Object.defineProperty;
var so = Object.getOwnPropertyDescriptor;
var oo = Object.getOwnPropertyNames;
var ao = Object.getPrototypeOf;
var uo = Object.prototype.hasOwnProperty;
var co = /* @__PURE__ */ __name((r, e, t) => e in r ? Ce(r, e, { enumerable: true, configurable: true, writable: true, value: t }) : r[e] = t, "co");
var a = /* @__PURE__ */ __name((r, e) => Ce(r, "name", { value: e, configurable: true }), "a");
var z = /* @__PURE__ */ __name((r, e) => () => (r && (e = r(r = 0)), e), "z");
var I = /* @__PURE__ */ __name((r, e) => () => (e || r((e = { exports: {} }).exports, e), e.exports), "I");
var se = /* @__PURE__ */ __name((r, e) => {
  for (var t in e)
    Ce(r, t, { get: e[t], enumerable: true });
}, "se");
var Tn = /* @__PURE__ */ __name((r, e, t, n) => {
  if (e && typeof e == "object" || typeof e == "function") for (let i of oo(e)) !uo.call(r, i) && i !== t && Ce(r, i, { get: /* @__PURE__ */ __name(() => e[i], "get"), enumerable: !(n = so(e, i)) || n.enumerable });
  return r;
}, "Tn");
var Te = /* @__PURE__ */ __name((r, e, t) => (t = r != null ? io(ao(r)) : {}, Tn(e || !r || !r.__esModule ? Ce(t, "default", {
  value: r,
  enumerable: true
}) : t, r)), "Te");
var O = /* @__PURE__ */ __name((r) => Tn(Ce({}, "__esModule", { value: true }), r), "O");
var _ = /* @__PURE__ */ __name((r, e, t) => co(r, typeof e != "symbol" ? e + "" : e, t), "_");
var Bn = I((st) => {
  "use strict";
  p();
  st.byteLength = lo;
  st.toByteArray = po;
  st.fromByteArray = go;
  var ae = [], re = [], ho = typeof Uint8Array < "u" ? Uint8Array : Array, Rt = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  for (Ee = 0, In = Rt.length; Ee < In; ++Ee)
    ae[Ee] = Rt[Ee], re[Rt.charCodeAt(Ee)] = Ee;
  var Ee, In;
  re[45] = 62;
  re[95] = 63;
  function Pn(r) {
    var e = r.length;
    if (e % 4 > 0) throw new Error("Invalid string. Length must be a multiple of 4");
    var t = r.indexOf("=");
    t === -1 && (t = e);
    var n = t === e ? 0 : 4 - t % 4;
    return [t, n];
  }
  __name(Pn, "Pn");
  a(
    Pn,
    "getLens"
  );
  function lo(r) {
    var e = Pn(r), t = e[0], n = e[1];
    return (t + n) * 3 / 4 - n;
  }
  __name(lo, "lo");
  a(lo, "byteLength");
  function fo(r, e, t) {
    return (e + t) * 3 / 4 - t;
  }
  __name(fo, "fo");
  a(fo, "_byteLength");
  function po(r) {
    var e, t = Pn(r), n = t[0], i = t[1], s = new ho(fo(r, n, i)), o = 0, u = i > 0 ? n - 4 : n, c;
    for (c = 0; c < u; c += 4) e = re[r.charCodeAt(c)] << 18 | re[r.charCodeAt(c + 1)] << 12 | re[r.charCodeAt(c + 2)] << 6 | re[r.charCodeAt(c + 3)], s[o++] = e >> 16 & 255, s[o++] = e >> 8 & 255, s[o++] = e & 255;
    return i === 2 && (e = re[r.charCodeAt(c)] << 2 | re[r.charCodeAt(c + 1)] >> 4, s[o++] = e & 255), i === 1 && (e = re[r.charCodeAt(
      c
    )] << 10 | re[r.charCodeAt(c + 1)] << 4 | re[r.charCodeAt(c + 2)] >> 2, s[o++] = e >> 8 & 255, s[o++] = e & 255), s;
  }
  __name(po, "po");
  a(po, "toByteArray");
  function yo(r) {
    return ae[r >> 18 & 63] + ae[r >> 12 & 63] + ae[r >> 6 & 63] + ae[r & 63];
  }
  __name(yo, "yo");
  a(yo, "tripletToBase64");
  function mo(r, e, t) {
    for (var n, i = [], s = e; s < t; s += 3) n = (r[s] << 16 & 16711680) + (r[s + 1] << 8 & 65280) + (r[s + 2] & 255), i.push(yo(n));
    return i.join(
      ""
    );
  }
  __name(mo, "mo");
  a(mo, "encodeChunk");
  function go(r) {
    for (var e, t = r.length, n = t % 3, i = [], s = 16383, o = 0, u = t - n; o < u; o += s) i.push(mo(r, o, o + s > u ? u : o + s));
    return n === 1 ? (e = r[t - 1], i.push(ae[e >> 2] + ae[e << 4 & 63] + "==")) : n === 2 && (e = (r[t - 2] << 8) + r[t - 1], i.push(ae[e >> 10] + ae[e >> 4 & 63] + ae[e << 2 & 63] + "=")), i.join("");
  }
  __name(go, "go");
  a(go, "fromByteArray");
});
var Ln = I((Ft) => {
  p();
  Ft.read = function(r, e, t, n, i) {
    var s, o, u = i * 8 - n - 1, c = (1 << u) - 1, h = c >> 1, l = -7, d = t ? i - 1 : 0, b = t ? -1 : 1, C = r[e + d];
    for (d += b, s = C & (1 << -l) - 1, C >>= -l, l += u; l > 0; s = s * 256 + r[e + d], d += b, l -= 8) ;
    for (o = s & (1 << -l) - 1, s >>= -l, l += n; l > 0; o = o * 256 + r[e + d], d += b, l -= 8) ;
    if (s === 0) s = 1 - h;
    else {
      if (s === c) return o ? NaN : (C ? -1 : 1) * (1 / 0);
      o = o + Math.pow(2, n), s = s - h;
    }
    return (C ? -1 : 1) * o * Math.pow(2, s - n);
  };
  Ft.write = function(r, e, t, n, i, s) {
    var o, u, c, h = s * 8 - i - 1, l = (1 << h) - 1, d = l >> 1, b = i === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0, C = n ? 0 : s - 1, B = n ? 1 : -1, Q = e < 0 || e === 0 && 1 / e < 0 ? 1 : 0;
    for (e = Math.abs(e), isNaN(e) || e === 1 / 0 ? (u = isNaN(e) ? 1 : 0, o = l) : (o = Math.floor(Math.log(e) / Math.LN2), e * (c = Math.pow(2, -o)) < 1 && (o--, c *= 2), o + d >= 1 ? e += b / c : e += b * Math.pow(2, 1 - d), e * c >= 2 && (o++, c /= 2), o + d >= l ? (u = 0, o = l) : o + d >= 1 ? (u = (e * c - 1) * Math.pow(
      2,
      i
    ), o = o + d) : (u = e * Math.pow(2, d - 1) * Math.pow(2, i), o = 0)); i >= 8; r[t + C] = u & 255, C += B, u /= 256, i -= 8) ;
    for (o = o << i | u, h += i; h > 0; r[t + C] = o & 255, C += B, o /= 256, h -= 8) ;
    r[t + C - B] |= Q * 128;
  };
});
var Kn = I((Le) => {
  "use strict";
  p();
  var Mt = Bn(), Pe = Ln(), Rn = typeof Symbol == "function" && typeof Symbol.for == "function" ? /* @__PURE__ */ Symbol.for("nodejs.util.inspect.custom") : null;
  Le.Buffer = f;
  Le.SlowBuffer = vo;
  Le.INSPECT_MAX_BYTES = 50;
  var ot = 2147483647;
  Le.kMaxLength = ot;
  f.TYPED_ARRAY_SUPPORT = wo();
  !f.TYPED_ARRAY_SUPPORT && typeof console < "u" && typeof console.error == "function" && console.error("This browser lacks typed array (Uint8Array) support which is required by `buffer` v5.x. Use `buffer` v4.x if you require old browser support.");
  function wo() {
    try {
      let r = new Uint8Array(1), e = { foo: a(function() {
        return 42;
      }, "foo") };
      return Object.setPrototypeOf(e, Uint8Array.prototype), Object.setPrototypeOf(
        r,
        e
      ), r.foo() === 42;
    } catch {
      return false;
    }
  }
  __name(wo, "wo");
  a(wo, "typedArraySupport");
  Object.defineProperty(
    f.prototype,
    "parent",
    { enumerable: true, get: a(function() {
      if (f.isBuffer(this)) return this.buffer;
    }, "get") }
  );
  Object.defineProperty(f.prototype, "offset", { enumerable: true, get: a(
    function() {
      if (f.isBuffer(this)) return this.byteOffset;
    },
    "get"
  ) });
  function le(r) {
    if (r > ot) throw new RangeError('The value "' + r + '" is invalid for option "size"');
    let e = new Uint8Array(
      r
    );
    return Object.setPrototypeOf(e, f.prototype), e;
  }
  __name(le, "le");
  a(le, "createBuffer");
  function f(r, e, t) {
    if (typeof r == "number") {
      if (typeof e == "string") throw new TypeError('The "string" argument must be of type string. Received type number');
      return Ot(r);
    }
    return kn(
      r,
      e,
      t
    );
  }
  __name(f, "f");
  a(f, "Buffer");
  f.poolSize = 8192;
  function kn(r, e, t) {
    if (typeof r == "string") return So(
      r,
      e
    );
    if (ArrayBuffer.isView(r)) return xo(r);
    if (r == null) throw new TypeError("The first argument must be one of type string, Buffer, ArrayBuffer, Array, or Array-like Object. Received type " + typeof r);
    if (ue(r, ArrayBuffer) || r && ue(r.buffer, ArrayBuffer) || typeof SharedArrayBuffer < "u" && (ue(r, SharedArrayBuffer) || r && ue(r.buffer, SharedArrayBuffer)))
      return kt(r, e, t);
    if (typeof r == "number") throw new TypeError('The "value" argument must not be of type number. Received type number');
    let n = r.valueOf && r.valueOf();
    if (n != null && n !== r) return f.from(n, e, t);
    let i = Eo(r);
    if (i) return i;
    if (typeof Symbol < "u" && Symbol.toPrimitive != null && typeof r[Symbol.toPrimitive] == "function") return f.from(r[Symbol.toPrimitive]("string"), e, t);
    throw new TypeError("The first argument must be one of type string, Buffer, ArrayBuffer, Array, or Array-like Object. Received type " + typeof r);
  }
  __name(kn, "kn");
  a(kn, "from");
  f.from = function(r, e, t) {
    return kn(r, e, t);
  };
  Object.setPrototypeOf(f.prototype, Uint8Array.prototype);
  Object.setPrototypeOf(
    f,
    Uint8Array
  );
  function Un(r) {
    if (typeof r != "number") throw new TypeError('"size" argument must be of type number');
    if (r < 0) throw new RangeError('The value "' + r + '" is invalid for option "size"');
  }
  __name(Un, "Un");
  a(Un, "assertSize");
  function bo(r, e, t) {
    return Un(r), r <= 0 ? le(r) : e !== void 0 ? typeof t == "string" ? le(r).fill(e, t) : le(r).fill(e) : le(r);
  }
  __name(bo, "bo");
  a(
    bo,
    "alloc"
  );
  f.alloc = function(r, e, t) {
    return bo(r, e, t);
  };
  function Ot(r) {
    return Un(r), le(
      r < 0 ? 0 : Nt(r) | 0
    );
  }
  __name(Ot, "Ot");
  a(Ot, "allocUnsafe");
  f.allocUnsafe = function(r) {
    return Ot(r);
  };
  f.allocUnsafeSlow = function(r) {
    return Ot(r);
  };
  function So(r, e) {
    if ((typeof e != "string" || e === "") && (e = "utf8"), !f.isEncoding(e)) throw new TypeError("Unknown encoding: " + e);
    let t = On(r, e) | 0, n = le(t), i = n.write(r, e);
    return i !== t && (n = n.slice(0, i)), n;
  }
  __name(So, "So");
  a(So, "fromString");
  function Dt(r) {
    let e = r.length < 0 ? 0 : Nt(r.length) | 0, t = le(e);
    for (let n = 0; n < e; n += 1) t[n] = r[n] & 255;
    return t;
  }
  __name(Dt, "Dt");
  a(Dt, "fromArrayLike");
  function xo(r) {
    if (ue(r, Uint8Array)) {
      let e = new Uint8Array(r);
      return kt(e.buffer, e.byteOffset, e.byteLength);
    }
    return Dt(r);
  }
  __name(xo, "xo");
  a(xo, "fromArrayView");
  function kt(r, e, t) {
    if (e < 0 || r.byteLength < e) throw new RangeError('"offset" is outside of buffer bounds');
    if (r.byteLength < e + (t || 0)) throw new RangeError('"length" is outside of buffer bounds');
    let n;
    return e === void 0 && t === void 0 ? n = new Uint8Array(
      r
    ) : t === void 0 ? n = new Uint8Array(r, e) : n = new Uint8Array(r, e, t), Object.setPrototypeOf(
      n,
      f.prototype
    ), n;
  }
  __name(kt, "kt");
  a(kt, "fromArrayBuffer");
  function Eo(r) {
    if (f.isBuffer(r)) {
      let e = Nt(
        r.length
      ) | 0, t = le(e);
      return t.length === 0 || r.copy(t, 0, 0, e), t;
    }
    if (r.length !== void 0)
      return typeof r.length != "number" || Qt(r.length) ? le(0) : Dt(r);
    if (r.type === "Buffer" && Array.isArray(r.data)) return Dt(r.data);
  }
  __name(Eo, "Eo");
  a(Eo, "fromObject");
  function Nt(r) {
    if (r >= ot) throw new RangeError("Attempt to allocate Buffer larger than maximum size: 0x" + ot.toString(16) + " bytes");
    return r | 0;
  }
  __name(Nt, "Nt");
  a(Nt, "checked");
  function vo(r) {
    return +r != r && (r = 0), f.alloc(+r);
  }
  __name(vo, "vo");
  a(vo, "SlowBuffer");
  f.isBuffer = a(function(e) {
    return e != null && e._isBuffer === true && e !== f.prototype;
  }, "isBuffer");
  f.compare = a(function(e, t) {
    if (ue(e, Uint8Array) && (e = f.from(e, e.offset, e.byteLength)), ue(t, Uint8Array) && (t = f.from(t, t.offset, t.byteLength)), !f.isBuffer(e) || !f.isBuffer(t)) throw new TypeError('The "buf1", "buf2" arguments must be one of type Buffer or Uint8Array');
    if (e === t) return 0;
    let n = e.length, i = t.length;
    for (let s = 0, o = Math.min(n, i); s < o; ++s) if (e[s] !== t[s]) {
      n = e[s], i = t[s];
      break;
    }
    return n < i ? -1 : i < n ? 1 : 0;
  }, "compare");
  f.isEncoding = a(function(e) {
    switch (String(e).toLowerCase()) {
      case "hex":
      case "utf8":
      case "utf-8":
      case "ascii":
      case "latin1":
      case "binary":
      case "base64":
      case "ucs2":
      case "ucs-2":
      case "utf16le":
      case "utf-16le":
        return true;
      default:
        return false;
    }
  }, "isEncoding");
  f.concat = a(function(e, t) {
    if (!Array.isArray(e)) throw new TypeError('"list" argument must be an Array of Buffers');
    if (e.length === 0) return f.alloc(0);
    let n;
    if (t === void 0) for (t = 0, n = 0; n < e.length; ++n) t += e[n].length;
    let i = f.allocUnsafe(t), s = 0;
    for (n = 0; n < e.length; ++n) {
      let o = e[n];
      if (ue(o, Uint8Array)) s + o.length > i.length ? (f.isBuffer(
        o
      ) || (o = f.from(o)), o.copy(i, s)) : Uint8Array.prototype.set.call(i, o, s);
      else if (f.isBuffer(
        o
      )) o.copy(i, s);
      else throw new TypeError('"list" argument must be an Array of Buffers');
      s += o.length;
    }
    return i;
  }, "concat");
  function On(r, e) {
    if (f.isBuffer(r)) return r.length;
    if (ArrayBuffer.isView(r) || ue(r, ArrayBuffer)) return r.byteLength;
    if (typeof r != "string") throw new TypeError('The "string" argument must be one of type string, Buffer, or ArrayBuffer. Received type ' + typeof r);
    let t = r.length, n = arguments.length > 2 && arguments[2] === true;
    if (!n && t === 0) return 0;
    let i = false;
    for (; ; ) switch (e) {
      case "ascii":
      case "latin1":
      case "binary":
        return t;
      case "utf8":
      case "utf-8":
        return Ut(r).length;
      case "ucs2":
      case "ucs-2":
      case "utf16le":
      case "utf-16le":
        return t * 2;
      case "hex":
        return t >>> 1;
      case "base64":
        return Vn(r).length;
      default:
        if (i) return n ? -1 : Ut(r).length;
        e = ("" + e).toLowerCase(), i = true;
    }
  }
  __name(On, "On");
  a(On, "byteLength");
  f.byteLength = On;
  function _o(r, e, t) {
    let n = false;
    if ((e === void 0 || e < 0) && (e = 0), e > this.length || ((t === void 0 || t > this.length) && (t = this.length), t <= 0) || (t >>>= 0, e >>>= 0, t <= e)) return "";
    for (r || (r = "utf8"); ; ) switch (r) {
      case "hex":
        return Mo(
          this,
          e,
          t
        );
      case "utf8":
      case "utf-8":
        return qn(this, e, t);
      case "ascii":
        return Ro(
          this,
          e,
          t
        );
      case "latin1":
      case "binary":
        return Fo(this, e, t);
      case "base64":
        return Bo(
          this,
          e,
          t
        );
      case "ucs2":
      case "ucs-2":
      case "utf16le":
      case "utf-16le":
        return Do(this, e, t);
      default:
        if (n) throw new TypeError("Unknown encoding: " + r);
        r = (r + "").toLowerCase(), n = true;
    }
  }
  __name(_o, "_o");
  a(
    _o,
    "slowToString"
  );
  f.prototype._isBuffer = true;
  function ve(r, e, t) {
    let n = r[e];
    r[e] = r[t], r[t] = n;
  }
  __name(ve, "ve");
  a(ve, "swap");
  f.prototype.swap16 = a(function() {
    let e = this.length;
    if (e % 2 !== 0)
      throw new RangeError("Buffer size must be a multiple of 16-bits");
    for (let t = 0; t < e; t += 2) ve(this, t, t + 1);
    return this;
  }, "swap16");
  f.prototype.swap32 = a(function() {
    let e = this.length;
    if (e % 4 !== 0) throw new RangeError("Buffer size must be a multiple of 32-bits");
    for (let t = 0; t < e; t += 4) ve(this, t, t + 3), ve(this, t + 1, t + 2);
    return this;
  }, "swap32");
  f.prototype.swap64 = a(function() {
    let e = this.length;
    if (e % 8 !== 0) throw new RangeError(
      "Buffer size must be a multiple of 64-bits"
    );
    for (let t = 0; t < e; t += 8) ve(this, t, t + 7), ve(this, t + 1, t + 6), ve(this, t + 2, t + 5), ve(this, t + 3, t + 4);
    return this;
  }, "swap64");
  f.prototype.toString = a(function() {
    let e = this.length;
    return e === 0 ? "" : arguments.length === 0 ? qn(
      this,
      0,
      e
    ) : _o.apply(this, arguments);
  }, "toString");
  f.prototype.toLocaleString = f.prototype.toString;
  f.prototype.equals = a(function(e) {
    if (!f.isBuffer(e)) throw new TypeError(
      "Argument must be a Buffer"
    );
    return this === e ? true : f.compare(this, e) === 0;
  }, "equals");
  f.prototype.inspect = a(function() {
    let e = "", t = Le.INSPECT_MAX_BYTES;
    return e = this.toString(
      "hex",
      0,
      t
    ).replace(/(.{2})/g, "$1 ").trim(), this.length > t && (e += " ... "), "<Buffer " + e + ">";
  }, "inspect");
  Rn && (f.prototype[Rn] = f.prototype.inspect);
  f.prototype.compare = a(function(e, t, n, i, s) {
    if (ue(e, Uint8Array) && (e = f.from(e, e.offset, e.byteLength)), !f.isBuffer(e)) throw new TypeError('The "target" argument must be one of type Buffer or Uint8Array. Received type ' + typeof e);
    if (t === void 0 && (t = 0), n === void 0 && (n = e ? e.length : 0), i === void 0 && (i = 0), s === void 0 && (s = this.length), t < 0 || n > e.length || i < 0 || s > this.length) throw new RangeError("out of range index");
    if (i >= s && t >= n) return 0;
    if (i >= s) return -1;
    if (t >= n) return 1;
    if (t >>>= 0, n >>>= 0, i >>>= 0, s >>>= 0, this === e) return 0;
    let o = s - i, u = n - t, c = Math.min(o, u), h = this.slice(i, s), l = e.slice(t, n);
    for (let d = 0; d < c; ++d)
      if (h[d] !== l[d]) {
        o = h[d], u = l[d];
        break;
      }
    return o < u ? -1 : u < o ? 1 : 0;
  }, "compare");
  function Nn(r, e, t, n, i) {
    if (r.length === 0) return -1;
    if (typeof t == "string" ? (n = t, t = 0) : t > 2147483647 ? t = 2147483647 : t < -2147483648 && (t = -2147483648), t = +t, Qt(t) && (t = i ? 0 : r.length - 1), t < 0 && (t = r.length + t), t >= r.length) {
      if (i) return -1;
      t = r.length - 1;
    } else if (t < 0) if (i) t = 0;
    else return -1;
    if (typeof e == "string" && (e = f.from(e, n)), f.isBuffer(e)) return e.length === 0 ? -1 : Fn(r, e, t, n, i);
    if (typeof e == "number") return e = e & 255, typeof Uint8Array.prototype.indexOf == "function" ? i ? Uint8Array.prototype.indexOf.call(r, e, t) : Uint8Array.prototype.lastIndexOf.call(r, e, t) : Fn(
      r,
      [e],
      t,
      n,
      i
    );
    throw new TypeError("val must be string, number or Buffer");
  }
  __name(Nn, "Nn");
  a(Nn, "bidirectionalIndexOf");
  function Fn(r, e, t, n, i) {
    let s = 1, o = r.length, u = e.length;
    if (n !== void 0 && (n = String(n).toLowerCase(), n === "ucs2" || n === "ucs-2" || n === "utf16le" || n === "utf-16le")) {
      if (r.length < 2 || e.length < 2) return -1;
      s = 2, o /= 2, u /= 2, t /= 2;
    }
    function c(l, d) {
      return s === 1 ? l[d] : l.readUInt16BE(d * s);
    }
    __name(c, "c");
    a(c, "read");
    let h;
    if (i) {
      let l = -1;
      for (h = t; h < o; h++) if (c(r, h) === c(e, l === -1 ? 0 : h - l)) {
        if (l === -1 && (l = h), h - l + 1 === u) return l * s;
      } else l !== -1 && (h -= h - l), l = -1;
    } else for (t + u > o && (t = o - u), h = t; h >= 0; h--) {
      let l = true;
      for (let d = 0; d < u; d++)
        if (c(r, h + d) !== c(e, d)) {
          l = false;
          break;
        }
      if (l) return h;
    }
    return -1;
  }
  __name(Fn, "Fn");
  a(Fn, "arrayIndexOf");
  f.prototype.includes = a(function(e, t, n) {
    return this.indexOf(e, t, n) !== -1;
  }, "includes");
  f.prototype.indexOf = a(function(e, t, n) {
    return Nn(this, e, t, n, true);
  }, "indexOf");
  f.prototype.lastIndexOf = a(function(e, t, n) {
    return Nn(this, e, t, n, false);
  }, "lastIndexOf");
  function Ao(r, e, t, n) {
    t = Number(t) || 0;
    let i = r.length - t;
    n ? (n = Number(n), n > i && (n = i)) : n = i;
    let s = e.length;
    n > s / 2 && (n = s / 2);
    let o;
    for (o = 0; o < n; ++o) {
      let u = parseInt(e.substr(o * 2, 2), 16);
      if (Qt(u))
        return o;
      r[t + o] = u;
    }
    return o;
  }
  __name(Ao, "Ao");
  a(Ao, "hexWrite");
  function Co(r, e, t, n) {
    return at(Ut(
      e,
      r.length - t
    ), r, t, n);
  }
  __name(Co, "Co");
  a(Co, "utf8Write");
  function To(r, e, t, n) {
    return at(No(e), r, t, n);
  }
  __name(To, "To");
  a(To, "asciiWrite");
  function Io(r, e, t, n) {
    return at(Vn(e), r, t, n);
  }
  __name(Io, "Io");
  a(Io, "base64Write");
  function Po(r, e, t, n) {
    return at(qo(e, r.length - t), r, t, n);
  }
  __name(Po, "Po");
  a(Po, "ucs2Write");
  f.prototype.write = a(function(e, t, n, i) {
    if (t === void 0) i = "utf8", n = this.length, t = 0;
    else if (n === void 0 && typeof t == "string") i = t, n = this.length, t = 0;
    else if (isFinite(t)) t = t >>> 0, isFinite(n) ? (n = n >>> 0, i === void 0 && (i = "utf8")) : (i = n, n = void 0);
    else throw new Error("Buffer.write(string, encoding, offset[, length]) is no longer supported");
    let s = this.length - t;
    if ((n === void 0 || n > s) && (n = s), e.length > 0 && (n < 0 || t < 0) || t > this.length) throw new RangeError(
      "Attempt to write outside buffer bounds"
    );
    i || (i = "utf8");
    let o = false;
    for (; ; ) switch (i) {
      case "hex":
        return Ao(this, e, t, n);
      case "utf8":
      case "utf-8":
        return Co(this, e, t, n);
      case "ascii":
      case "latin1":
      case "binary":
        return To(this, e, t, n);
      case "base64":
        return Io(
          this,
          e,
          t,
          n
        );
      case "ucs2":
      case "ucs-2":
      case "utf16le":
      case "utf-16le":
        return Po(this, e, t, n);
      default:
        if (o) throw new TypeError("Unknown encoding: " + i);
        i = ("" + i).toLowerCase(), o = true;
    }
  }, "write");
  f.prototype.toJSON = a(function() {
    return { type: "Buffer", data: Array.prototype.slice.call(this._arr || this, 0) };
  }, "toJSON");
  function Bo(r, e, t) {
    return e === 0 && t === r.length ? Mt.fromByteArray(r) : Mt.fromByteArray(r.slice(e, t));
  }
  __name(Bo, "Bo");
  a(Bo, "base64Slice");
  function qn(r, e, t) {
    t = Math.min(r.length, t);
    let n = [], i = e;
    for (; i < t; ) {
      let s = r[i], o = null, u = s > 239 ? 4 : s > 223 ? 3 : s > 191 ? 2 : 1;
      if (i + u <= t) {
        let c, h, l, d;
        switch (u) {
          case 1:
            s < 128 && (o = s);
            break;
          case 2:
            c = r[i + 1], (c & 192) === 128 && (d = (s & 31) << 6 | c & 63, d > 127 && (o = d));
            break;
          case 3:
            c = r[i + 1], h = r[i + 2], (c & 192) === 128 && (h & 192) === 128 && (d = (s & 15) << 12 | (c & 63) << 6 | h & 63, d > 2047 && (d < 55296 || d > 57343) && (o = d));
            break;
          case 4:
            c = r[i + 1], h = r[i + 2], l = r[i + 3], (c & 192) === 128 && (h & 192) === 128 && (l & 192) === 128 && (d = (s & 15) << 18 | (c & 63) << 12 | (h & 63) << 6 | l & 63, d > 65535 && d < 1114112 && (o = d));
        }
      }
      o === null ? (o = 65533, u = 1) : o > 65535 && (o -= 65536, n.push(o >>> 10 & 1023 | 55296), o = 56320 | o & 1023), n.push(o), i += u;
    }
    return Lo(n);
  }
  __name(qn, "qn");
  a(qn, "utf8Slice");
  var Mn = 4096;
  function Lo(r) {
    let e = r.length;
    if (e <= Mn) return String.fromCharCode.apply(String, r);
    let t = "", n = 0;
    for (; n < e; ) t += String.fromCharCode.apply(String, r.slice(n, n += Mn));
    return t;
  }
  __name(Lo, "Lo");
  a(Lo, "decodeCodePointsArray");
  function Ro(r, e, t) {
    let n = "";
    t = Math.min(r.length, t);
    for (let i = e; i < t; ++i) n += String.fromCharCode(r[i] & 127);
    return n;
  }
  __name(Ro, "Ro");
  a(Ro, "asciiSlice");
  function Fo(r, e, t) {
    let n = "";
    t = Math.min(r.length, t);
    for (let i = e; i < t; ++i) n += String.fromCharCode(r[i]);
    return n;
  }
  __name(Fo, "Fo");
  a(Fo, "latin1Slice");
  function Mo(r, e, t) {
    let n = r.length;
    (!e || e < 0) && (e = 0), (!t || t < 0 || t > n) && (t = n);
    let i = "";
    for (let s = e; s < t; ++s) i += Qo[r[s]];
    return i;
  }
  __name(Mo, "Mo");
  a(Mo, "hexSlice");
  function Do(r, e, t) {
    let n = r.slice(e, t), i = "";
    for (let s = 0; s < n.length - 1; s += 2) i += String.fromCharCode(n[s] + n[s + 1] * 256);
    return i;
  }
  __name(Do, "Do");
  a(Do, "utf16leSlice");
  f.prototype.slice = a(function(e, t) {
    let n = this.length;
    e = ~~e, t = t === void 0 ? n : ~~t, e < 0 ? (e += n, e < 0 && (e = 0)) : e > n && (e = n), t < 0 ? (t += n, t < 0 && (t = 0)) : t > n && (t = n), t < e && (t = e);
    let i = this.subarray(
      e,
      t
    );
    return Object.setPrototypeOf(i, f.prototype), i;
  }, "slice");
  function N(r, e, t) {
    if (r % 1 !== 0 || r < 0) throw new RangeError("offset is not uint");
    if (r + e > t) throw new RangeError(
      "Trying to access beyond buffer length"
    );
  }
  __name(N, "N");
  a(N, "checkOffset");
  f.prototype.readUintLE = f.prototype.readUIntLE = a(function(e, t, n) {
    e = e >>> 0, t = t >>> 0, n || N(e, t, this.length);
    let i = this[e], s = 1, o = 0;
    for (; ++o < t && (s *= 256); ) i += this[e + o] * s;
    return i;
  }, "readUIntLE");
  f.prototype.readUintBE = f.prototype.readUIntBE = a(function(e, t, n) {
    e = e >>> 0, t = t >>> 0, n || N(e, t, this.length);
    let i = this[e + --t], s = 1;
    for (; t > 0 && (s *= 256); ) i += this[e + --t] * s;
    return i;
  }, "readUIntBE");
  f.prototype.readUint8 = f.prototype.readUInt8 = a(function(e, t) {
    return e = e >>> 0, t || N(e, 1, this.length), this[e];
  }, "readUInt8");
  f.prototype.readUint16LE = f.prototype.readUInt16LE = a(function(e, t) {
    return e = e >>> 0, t || N(e, 2, this.length), this[e] | this[e + 1] << 8;
  }, "readUInt16LE");
  f.prototype.readUint16BE = f.prototype.readUInt16BE = a(function(e, t) {
    return e = e >>> 0, t || N(e, 2, this.length), this[e] << 8 | this[e + 1];
  }, "readUInt16BE");
  f.prototype.readUint32LE = f.prototype.readUInt32LE = a(function(e, t) {
    return e = e >>> 0, t || N(e, 4, this.length), (this[e] | this[e + 1] << 8 | this[e + 2] << 16) + this[e + 3] * 16777216;
  }, "readUInt32LE");
  f.prototype.readUint32BE = f.prototype.readUInt32BE = a(function(e, t) {
    return e = e >>> 0, t || N(e, 4, this.length), this[e] * 16777216 + (this[e + 1] << 16 | this[e + 2] << 8 | this[e + 3]);
  }, "readUInt32BE");
  f.prototype.readBigUInt64LE = me(a(function(e) {
    e = e >>> 0, Be(e, "offset");
    let t = this[e], n = this[e + 7];
    (t === void 0 || n === void 0) && We(e, this.length - 8);
    let i = t + this[++e] * 2 ** 8 + this[++e] * 2 ** 16 + this[++e] * 2 ** 24, s = this[++e] + this[++e] * 2 ** 8 + this[++e] * 2 ** 16 + n * 2 ** 24;
    return BigInt(i) + (BigInt(s) << BigInt(32));
  }, "readBigUInt64LE"));
  f.prototype.readBigUInt64BE = me(a(function(e) {
    e = e >>> 0, Be(e, "offset");
    let t = this[e], n = this[e + 7];
    (t === void 0 || n === void 0) && We(e, this.length - 8);
    let i = t * 2 ** 24 + this[++e] * 2 ** 16 + this[++e] * 2 ** 8 + this[++e], s = this[++e] * 2 ** 24 + this[++e] * 2 ** 16 + this[++e] * 2 ** 8 + n;
    return (BigInt(
      i
    ) << BigInt(32)) + BigInt(s);
  }, "readBigUInt64BE"));
  f.prototype.readIntLE = a(function(e, t, n) {
    e = e >>> 0, t = t >>> 0, n || N(e, t, this.length);
    let i = this[e], s = 1, o = 0;
    for (; ++o < t && (s *= 256); )
      i += this[e + o] * s;
    return s *= 128, i >= s && (i -= Math.pow(2, 8 * t)), i;
  }, "readIntLE");
  f.prototype.readIntBE = a(function(e, t, n) {
    e = e >>> 0, t = t >>> 0, n || N(e, t, this.length);
    let i = t, s = 1, o = this[e + --i];
    for (; i > 0 && (s *= 256); ) o += this[e + --i] * s;
    return s *= 128, o >= s && (o -= Math.pow(2, 8 * t)), o;
  }, "readIntBE");
  f.prototype.readInt8 = a(function(e, t) {
    return e = e >>> 0, t || N(e, 1, this.length), this[e] & 128 ? (255 - this[e] + 1) * -1 : this[e];
  }, "readInt8");
  f.prototype.readInt16LE = a(function(e, t) {
    e = e >>> 0, t || N(e, 2, this.length);
    let n = this[e] | this[e + 1] << 8;
    return n & 32768 ? n | 4294901760 : n;
  }, "readInt16LE");
  f.prototype.readInt16BE = a(
    function(e, t) {
      e = e >>> 0, t || N(e, 2, this.length);
      let n = this[e + 1] | this[e] << 8;
      return n & 32768 ? n | 4294901760 : n;
    },
    "readInt16BE"
  );
  f.prototype.readInt32LE = a(function(e, t) {
    return e = e >>> 0, t || N(e, 4, this.length), this[e] | this[e + 1] << 8 | this[e + 2] << 16 | this[e + 3] << 24;
  }, "readInt32LE");
  f.prototype.readInt32BE = a(function(e, t) {
    return e = e >>> 0, t || N(e, 4, this.length), this[e] << 24 | this[e + 1] << 16 | this[e + 2] << 8 | this[e + 3];
  }, "readInt32BE");
  f.prototype.readBigInt64LE = me(a(function(e) {
    e = e >>> 0, Be(e, "offset");
    let t = this[e], n = this[e + 7];
    (t === void 0 || n === void 0) && We(
      e,
      this.length - 8
    );
    let i = this[e + 4] + this[e + 5] * 2 ** 8 + this[e + 6] * 2 ** 16 + (n << 24);
    return (BigInt(
      i
    ) << BigInt(32)) + BigInt(t + this[++e] * 2 ** 8 + this[++e] * 2 ** 16 + this[++e] * 2 ** 24);
  }, "readBigInt64LE"));
  f.prototype.readBigInt64BE = me(a(function(e) {
    e = e >>> 0, Be(e, "offset");
    let t = this[e], n = this[e + 7];
    (t === void 0 || n === void 0) && We(e, this.length - 8);
    let i = (t << 24) + this[++e] * 2 ** 16 + this[++e] * 2 ** 8 + this[++e];
    return (BigInt(i) << BigInt(32)) + BigInt(
      this[++e] * 2 ** 24 + this[++e] * 2 ** 16 + this[++e] * 2 ** 8 + n
    );
  }, "readBigInt64BE"));
  f.prototype.readFloatLE = a(function(e, t) {
    return e = e >>> 0, t || N(e, 4, this.length), Pe.read(
      this,
      e,
      true,
      23,
      4
    );
  }, "readFloatLE");
  f.prototype.readFloatBE = a(function(e, t) {
    return e = e >>> 0, t || N(e, 4, this.length), Pe.read(this, e, false, 23, 4);
  }, "readFloatBE");
  f.prototype.readDoubleLE = a(function(e, t) {
    return e = e >>> 0, t || N(e, 8, this.length), Pe.read(this, e, true, 52, 8);
  }, "readDoubleLE");
  f.prototype.readDoubleBE = a(function(e, t) {
    return e = e >>> 0, t || N(e, 8, this.length), Pe.read(this, e, false, 52, 8);
  }, "readDoubleBE");
  function Y(r, e, t, n, i, s) {
    if (!f.isBuffer(
      r
    )) throw new TypeError('"buffer" argument must be a Buffer instance');
    if (e > i || e < s) throw new RangeError('"value" argument is out of bounds');
    if (t + n > r.length) throw new RangeError(
      "Index out of range"
    );
  }
  __name(Y, "Y");
  a(Y, "checkInt");
  f.prototype.writeUintLE = f.prototype.writeUIntLE = a(function(e, t, n, i) {
    if (e = +e, t = t >>> 0, n = n >>> 0, !i) {
      let u = Math.pow(2, 8 * n) - 1;
      Y(
        this,
        e,
        t,
        n,
        u,
        0
      );
    }
    let s = 1, o = 0;
    for (this[t] = e & 255; ++o < n && (s *= 256); ) this[t + o] = e / s & 255;
    return t + n;
  }, "writeUIntLE");
  f.prototype.writeUintBE = f.prototype.writeUIntBE = a(function(e, t, n, i) {
    if (e = +e, t = t >>> 0, n = n >>> 0, !i) {
      let u = Math.pow(2, 8 * n) - 1;
      Y(this, e, t, n, u, 0);
    }
    let s = n - 1, o = 1;
    for (this[t + s] = e & 255; --s >= 0 && (o *= 256); ) this[t + s] = e / o & 255;
    return t + n;
  }, "writeUIntBE");
  f.prototype.writeUint8 = f.prototype.writeUInt8 = a(function(e, t, n) {
    return e = +e, t = t >>> 0, n || Y(this, e, t, 1, 255, 0), this[t] = e & 255, t + 1;
  }, "writeUInt8");
  f.prototype.writeUint16LE = f.prototype.writeUInt16LE = a(function(e, t, n) {
    return e = +e, t = t >>> 0, n || Y(
      this,
      e,
      t,
      2,
      65535,
      0
    ), this[t] = e & 255, this[t + 1] = e >>> 8, t + 2;
  }, "writeUInt16LE");
  f.prototype.writeUint16BE = f.prototype.writeUInt16BE = a(function(e, t, n) {
    return e = +e, t = t >>> 0, n || Y(
      this,
      e,
      t,
      2,
      65535,
      0
    ), this[t] = e >>> 8, this[t + 1] = e & 255, t + 2;
  }, "writeUInt16BE");
  f.prototype.writeUint32LE = f.prototype.writeUInt32LE = a(function(e, t, n) {
    return e = +e, t = t >>> 0, n || Y(
      this,
      e,
      t,
      4,
      4294967295,
      0
    ), this[t + 3] = e >>> 24, this[t + 2] = e >>> 16, this[t + 1] = e >>> 8, this[t] = e & 255, t + 4;
  }, "writeUInt32LE");
  f.prototype.writeUint32BE = f.prototype.writeUInt32BE = a(function(e, t, n) {
    return e = +e, t = t >>> 0, n || Y(this, e, t, 4, 4294967295, 0), this[t] = e >>> 24, this[t + 1] = e >>> 16, this[t + 2] = e >>> 8, this[t + 3] = e & 255, t + 4;
  }, "writeUInt32BE");
  function Qn(r, e, t, n, i) {
    $n(
      e,
      n,
      i,
      r,
      t,
      7
    );
    let s = Number(e & BigInt(4294967295));
    r[t++] = s, s = s >> 8, r[t++] = s, s = s >> 8, r[t++] = s, s = s >> 8, r[t++] = s;
    let o = Number(e >> BigInt(32) & BigInt(4294967295));
    return r[t++] = o, o = o >> 8, r[t++] = o, o = o >> 8, r[t++] = o, o = o >> 8, r[t++] = o, t;
  }
  __name(Qn, "Qn");
  a(Qn, "wrtBigUInt64LE");
  function jn(r, e, t, n, i) {
    $n(e, n, i, r, t, 7);
    let s = Number(e & BigInt(4294967295));
    r[t + 7] = s, s = s >> 8, r[t + 6] = s, s = s >> 8, r[t + 5] = s, s = s >> 8, r[t + 4] = s;
    let o = Number(e >> BigInt(32) & BigInt(4294967295));
    return r[t + 3] = o, o = o >> 8, r[t + 2] = o, o = o >> 8, r[t + 1] = o, o = o >> 8, r[t] = o, t + 8;
  }
  __name(jn, "jn");
  a(jn, "wrtBigUInt64BE");
  f.prototype.writeBigUInt64LE = me(a(function(e, t = 0) {
    return Qn(this, e, t, BigInt(0), BigInt(
      "0xffffffffffffffff"
    ));
  }, "writeBigUInt64LE"));
  f.prototype.writeBigUInt64BE = me(a(function(e, t = 0) {
    return jn(this, e, t, BigInt(0), BigInt("0xffffffffffffffff"));
  }, "writeBigUInt64BE"));
  f.prototype.writeIntLE = a(function(e, t, n, i) {
    if (e = +e, t = t >>> 0, !i) {
      let c = Math.pow(
        2,
        8 * n - 1
      );
      Y(this, e, t, n, c - 1, -c);
    }
    let s = 0, o = 1, u = 0;
    for (this[t] = e & 255; ++s < n && (o *= 256); ) e < 0 && u === 0 && this[t + s - 1] !== 0 && (u = 1), this[t + s] = (e / o >> 0) - u & 255;
    return t + n;
  }, "writeIntLE");
  f.prototype.writeIntBE = a(function(e, t, n, i) {
    if (e = +e, t = t >>> 0, !i) {
      let c = Math.pow(
        2,
        8 * n - 1
      );
      Y(this, e, t, n, c - 1, -c);
    }
    let s = n - 1, o = 1, u = 0;
    for (this[t + s] = e & 255; --s >= 0 && (o *= 256); ) e < 0 && u === 0 && this[t + s + 1] !== 0 && (u = 1), this[t + s] = (e / o >> 0) - u & 255;
    return t + n;
  }, "writeIntBE");
  f.prototype.writeInt8 = a(function(e, t, n) {
    return e = +e, t = t >>> 0, n || Y(
      this,
      e,
      t,
      1,
      127,
      -128
    ), e < 0 && (e = 255 + e + 1), this[t] = e & 255, t + 1;
  }, "writeInt8");
  f.prototype.writeInt16LE = a(function(e, t, n) {
    return e = +e, t = t >>> 0, n || Y(this, e, t, 2, 32767, -32768), this[t] = e & 255, this[t + 1] = e >>> 8, t + 2;
  }, "writeInt16LE");
  f.prototype.writeInt16BE = a(function(e, t, n) {
    return e = +e, t = t >>> 0, n || Y(this, e, t, 2, 32767, -32768), this[t] = e >>> 8, this[t + 1] = e & 255, t + 2;
  }, "writeInt16BE");
  f.prototype.writeInt32LE = a(function(e, t, n) {
    return e = +e, t = t >>> 0, n || Y(this, e, t, 4, 2147483647, -2147483648), this[t] = e & 255, this[t + 1] = e >>> 8, this[t + 2] = e >>> 16, this[t + 3] = e >>> 24, t + 4;
  }, "writeInt32LE");
  f.prototype.writeInt32BE = a(function(e, t, n) {
    return e = +e, t = t >>> 0, n || Y(this, e, t, 4, 2147483647, -2147483648), e < 0 && (e = 4294967295 + e + 1), this[t] = e >>> 24, this[t + 1] = e >>> 16, this[t + 2] = e >>> 8, this[t + 3] = e & 255, t + 4;
  }, "writeInt32BE");
  f.prototype.writeBigInt64LE = me(a(function(e, t = 0) {
    return Qn(this, e, t, -BigInt(
      "0x8000000000000000"
    ), BigInt("0x7fffffffffffffff"));
  }, "writeBigInt64LE"));
  f.prototype.writeBigInt64BE = me(a(function(e, t = 0) {
    return jn(this, e, t, -BigInt("0x8000000000000000"), BigInt("0x7fffffffffffffff"));
  }, "writeBigInt64BE"));
  function Wn(r, e, t, n, i, s) {
    if (t + n > r.length) throw new RangeError("Index out of range");
    if (t < 0) throw new RangeError(
      "Index out of range"
    );
  }
  __name(Wn, "Wn");
  a(Wn, "checkIEEE754");
  function Hn(r, e, t, n, i) {
    return e = +e, t = t >>> 0, i || Wn(r, e, t, 4, 34028234663852886e22, -34028234663852886e22), Pe.write(
      r,
      e,
      t,
      n,
      23,
      4
    ), t + 4;
  }
  __name(Hn, "Hn");
  a(Hn, "writeFloat");
  f.prototype.writeFloatLE = a(function(e, t, n) {
    return Hn(
      this,
      e,
      t,
      true,
      n
    );
  }, "writeFloatLE");
  f.prototype.writeFloatBE = a(function(e, t, n) {
    return Hn(
      this,
      e,
      t,
      false,
      n
    );
  }, "writeFloatBE");
  function Gn(r, e, t, n, i) {
    return e = +e, t = t >>> 0, i || Wn(
      r,
      e,
      t,
      8,
      17976931348623157e292,
      -17976931348623157e292
    ), Pe.write(r, e, t, n, 52, 8), t + 8;
  }
  __name(Gn, "Gn");
  a(Gn, "writeDouble");
  f.prototype.writeDoubleLE = a(function(e, t, n) {
    return Gn(
      this,
      e,
      t,
      true,
      n
    );
  }, "writeDoubleLE");
  f.prototype.writeDoubleBE = a(function(e, t, n) {
    return Gn(
      this,
      e,
      t,
      false,
      n
    );
  }, "writeDoubleBE");
  f.prototype.copy = a(function(e, t, n, i) {
    if (!f.isBuffer(
      e
    )) throw new TypeError("argument should be a Buffer");
    if (n || (n = 0), !i && i !== 0 && (i = this.length), t >= e.length && (t = e.length), t || (t = 0), i > 0 && i < n && (i = n), i === n || e.length === 0 || this.length === 0) return 0;
    if (t < 0) throw new RangeError("targetStart out of bounds");
    if (n < 0 || n >= this.length) throw new RangeError("Index out of range");
    if (i < 0) throw new RangeError(
      "sourceEnd out of bounds"
    );
    i > this.length && (i = this.length), e.length - t < i - n && (i = e.length - t + n);
    let s = i - n;
    return this === e && typeof Uint8Array.prototype.copyWithin == "function" ? this.copyWithin(t, n, i) : Uint8Array.prototype.set.call(e, this.subarray(n, i), t), s;
  }, "copy");
  f.prototype.fill = a(function(e, t, n, i) {
    if (typeof e == "string") {
      if (typeof t == "string" ? (i = t, t = 0, n = this.length) : typeof n == "string" && (i = n, n = this.length), i !== void 0 && typeof i != "string") throw new TypeError("encoding must be a string");
      if (typeof i == "string" && !f.isEncoding(i)) throw new TypeError("Unknown encoding: " + i);
      if (e.length === 1) {
        let o = e.charCodeAt(0);
        (i === "utf8" && o < 128 || i === "latin1") && (e = o);
      }
    } else typeof e == "number" ? e = e & 255 : typeof e == "boolean" && (e = Number(e));
    if (t < 0 || this.length < t || this.length < n) throw new RangeError("Out of range index");
    if (n <= t) return this;
    t = t >>> 0, n = n === void 0 ? this.length : n >>> 0, e || (e = 0);
    let s;
    if (typeof e == "number") for (s = t; s < n; ++s)
      this[s] = e;
    else {
      let o = f.isBuffer(e) ? e : f.from(e, i), u = o.length;
      if (u === 0) throw new TypeError(
        'The value "' + e + '" is invalid for argument "value"'
      );
      for (s = 0; s < n - t; ++s) this[s + t] = o[s % u];
    }
    return this;
  }, "fill");
  var Ie = {};
  function qt(r, e, t) {
    var n;
    Ie[r] = (n = class extends t {
      static {
        __name(this, "n");
      }
      constructor() {
        super(), Object.defineProperty(this, "message", {
          value: e.apply(this, arguments),
          writable: true,
          configurable: true
        }), this.name = `${this.name} [${r}]`, this.stack, delete this.name;
      }
      get code() {
        return r;
      }
      set code(s) {
        Object.defineProperty(this, "code", {
          configurable: true,
          enumerable: true,
          value: s,
          writable: true
        });
      }
      toString() {
        return `${this.name} [${r}]: ${this.message}`;
      }
    }, a(n, "NodeError"), n);
  }
  __name(qt, "qt");
  a(qt, "E");
  qt("ERR_BUFFER_OUT_OF_BOUNDS", function(r) {
    return r ? `${r} is outside of buffer bounds` : "Attempt to access memory outside buffer bounds";
  }, RangeError);
  qt("ERR_INVALID_ARG_TYPE", function(r, e) {
    return `The "${r}" argument must be of type number. Received type ${typeof e}`;
  }, TypeError);
  qt("ERR_OUT_OF_RANGE", function(r, e, t) {
    let n = `The value of "${r}" is out of range.`, i = t;
    return Number.isInteger(t) && Math.abs(t) > 2 ** 32 ? i = Dn(String(t)) : typeof t == "bigint" && (i = String(t), (t > BigInt(2) ** BigInt(32) || t < -(BigInt(2) ** BigInt(32))) && (i = Dn(i)), i += "n"), n += ` It must be ${e}. Received ${i}`, n;
  }, RangeError);
  function Dn(r) {
    let e = "", t = r.length, n = r[0] === "-" ? 1 : 0;
    for (; t >= n + 4; t -= 3) e = `_${r.slice(t - 3, t)}${e}`;
    return `${r.slice(
      0,
      t
    )}${e}`;
  }
  __name(Dn, "Dn");
  a(Dn, "addNumericalSeparator");
  function ko(r, e, t) {
    Be(e, "offset"), (r[e] === void 0 || r[e + t] === void 0) && We(e, r.length - (t + 1));
  }
  __name(ko, "ko");
  a(ko, "checkBounds");
  function $n(r, e, t, n, i, s) {
    if (r > t || r < e) {
      let o = typeof e == "bigint" ? "n" : "", u;
      throw s > 3 ? e === 0 || e === BigInt(0) ? u = `>= 0${o} and < 2${o} ** ${(s + 1) * 8}${o}` : u = `>= -(2${o} ** ${(s + 1) * 8 - 1}${o}) and < 2 ** ${(s + 1) * 8 - 1}${o}` : u = `>= ${e}${o} and <= ${t}${o}`, new Ie.ERR_OUT_OF_RANGE(
        "value",
        u,
        r
      );
    }
    ko(n, i, s);
  }
  __name($n, "$n");
  a($n, "checkIntBI");
  function Be(r, e) {
    if (typeof r != "number")
      throw new Ie.ERR_INVALID_ARG_TYPE(e, "number", r);
  }
  __name(Be, "Be");
  a(Be, "validateNumber");
  function We(r, e, t) {
    throw Math.floor(r) !== r ? (Be(r, t), new Ie.ERR_OUT_OF_RANGE(
      t || "offset",
      "an integer",
      r
    )) : e < 0 ? new Ie.ERR_BUFFER_OUT_OF_BOUNDS() : new Ie.ERR_OUT_OF_RANGE(t || "offset", `>= ${t ? 1 : 0} and <= ${e}`, r);
  }
  __name(We, "We");
  a(We, "boundsError");
  var Uo = /[^+/0-9A-Za-z-_]/g;
  function Oo(r) {
    if (r = r.split("=")[0], r = r.trim().replace(Uo, ""), r.length < 2) return "";
    for (; r.length % 4 !== 0; ) r = r + "=";
    return r;
  }
  __name(Oo, "Oo");
  a(Oo, "base64clean");
  function Ut(r, e) {
    e = e || 1 / 0;
    let t, n = r.length, i = null, s = [];
    for (let o = 0; o < n; ++o) {
      if (t = r.charCodeAt(o), t > 55295 && t < 57344) {
        if (!i) {
          if (t > 56319) {
            (e -= 3) > -1 && s.push(239, 191, 189);
            continue;
          } else if (o + 1 === n) {
            (e -= 3) > -1 && s.push(239, 191, 189);
            continue;
          }
          i = t;
          continue;
        }
        if (t < 56320) {
          (e -= 3) > -1 && s.push(
            239,
            191,
            189
          ), i = t;
          continue;
        }
        t = (i - 55296 << 10 | t - 56320) + 65536;
      } else i && (e -= 3) > -1 && s.push(
        239,
        191,
        189
      );
      if (i = null, t < 128) {
        if ((e -= 1) < 0) break;
        s.push(t);
      } else if (t < 2048) {
        if ((e -= 2) < 0) break;
        s.push(t >> 6 | 192, t & 63 | 128);
      } else if (t < 65536) {
        if ((e -= 3) < 0) break;
        s.push(t >> 12 | 224, t >> 6 & 63 | 128, t & 63 | 128);
      } else if (t < 1114112) {
        if ((e -= 4) < 0) break;
        s.push(t >> 18 | 240, t >> 12 & 63 | 128, t >> 6 & 63 | 128, t & 63 | 128);
      } else throw new Error("Invalid code point");
    }
    return s;
  }
  __name(Ut, "Ut");
  a(
    Ut,
    "utf8ToBytes"
  );
  function No(r) {
    let e = [];
    for (let t = 0; t < r.length; ++t) e.push(r.charCodeAt(
      t
    ) & 255);
    return e;
  }
  __name(No, "No");
  a(No, "asciiToBytes");
  function qo(r, e) {
    let t, n, i, s = [];
    for (let o = 0; o < r.length && !((e -= 2) < 0); ++o) t = r.charCodeAt(o), n = t >> 8, i = t % 256, s.push(i), s.push(n);
    return s;
  }
  __name(qo, "qo");
  a(qo, "utf16leToBytes");
  function Vn(r) {
    return Mt.toByteArray(Oo(r));
  }
  __name(Vn, "Vn");
  a(Vn, "base64ToBytes");
  function at(r, e, t, n) {
    let i;
    for (i = 0; i < n && !(i + t >= e.length || i >= r.length); ++i)
      e[i + t] = r[i];
    return i;
  }
  __name(at, "at");
  a(at, "blitBuffer");
  function ue(r, e) {
    return r instanceof e || r != null && r.constructor != null && r.constructor.name != null && r.constructor.name === e.name;
  }
  __name(ue, "ue");
  a(ue, "isInstance");
  function Qt(r) {
    return r !== r;
  }
  __name(Qt, "Qt");
  a(Qt, "numberIsNaN");
  var Qo = (function() {
    let r = "0123456789abcdef", e = new Array(256);
    for (let t = 0; t < 16; ++t) {
      let n = t * 16;
      for (let i = 0; i < 16; ++i) e[n + i] = r[t] + r[i];
    }
    return e;
  })();
  function me(r) {
    return typeof BigInt > "u" ? jo : r;
  }
  __name(me, "me");
  a(me, "defineBigIntMethod");
  function jo() {
    throw new Error("BigInt not supported");
  }
  __name(jo, "jo");
  a(jo, "BufferBigIntNotDefined");
});
var S;
var x;
var E;
var w;
var y;
var m;
var p = z(() => {
  "use strict";
  S = globalThis, x = globalThis.setImmediate ?? ((r) => setTimeout(
    r,
    0
  )), E = globalThis.clearImmediate ?? ((r) => clearTimeout(r)), w = globalThis.crypto ?? {};
  w.subtle ?? (w.subtle = {});
  y = typeof globalThis.Buffer == "function" && typeof globalThis.Buffer.allocUnsafe == "function" ? globalThis.Buffer : Kn().Buffer, m = globalThis.process ?? {};
  m.env ?? (m.env = {});
  try {
    m.nextTick(() => {
    });
  } catch {
    let e = Promise.resolve();
    m.nextTick = e.then.bind(e);
  }
});
var ge = I((nh, jt) => {
  "use strict";
  p();
  var Re = typeof Reflect == "object" ? Reflect : null, zn = Re && typeof Re.apply == "function" ? Re.apply : a(function(e, t, n) {
    return Function.prototype.apply.call(e, t, n);
  }, "ReflectApply"), ut;
  Re && typeof Re.ownKeys == "function" ? ut = Re.ownKeys : Object.getOwnPropertySymbols ? ut = a(function(e) {
    return Object.getOwnPropertyNames(
      e
    ).concat(Object.getOwnPropertySymbols(e));
  }, "ReflectOwnKeys") : ut = a(function(e) {
    return Object.getOwnPropertyNames(e);
  }, "ReflectOwnKeys");
  function Wo(r) {
    console && console.warn && console.warn(r);
  }
  __name(Wo, "Wo");
  a(Wo, "ProcessEmitWarning");
  var Zn = Number.isNaN || a(function(e) {
    return e !== e;
  }, "NumberIsNaN");
  function L() {
    L.init.call(this);
  }
  __name(L, "L");
  a(L, "EventEmitter");
  jt.exports = L;
  jt.exports.once = Vo;
  L.EventEmitter = L;
  L.prototype._events = void 0;
  L.prototype._eventsCount = 0;
  L.prototype._maxListeners = void 0;
  var Yn = 10;
  function ct(r) {
    if (typeof r != "function") throw new TypeError('The "listener" argument must be of type Function. Received type ' + typeof r);
  }
  __name(ct, "ct");
  a(ct, "checkListener");
  Object.defineProperty(L, "defaultMaxListeners", { enumerable: true, get: a(function() {
    return Yn;
  }, "get"), set: a(function(r) {
    if (typeof r != "number" || r < 0 || Zn(r)) throw new RangeError('The value of "defaultMaxListeners" is out of range. It must be a non-negative number. Received ' + r + ".");
    Yn = r;
  }, "set") });
  L.init = function() {
    (this._events === void 0 || this._events === Object.getPrototypeOf(this)._events) && (this._events = /* @__PURE__ */ Object.create(null), this._eventsCount = 0), this._maxListeners = this._maxListeners || void 0;
  };
  L.prototype.setMaxListeners = a(
    function(e) {
      if (typeof e != "number" || e < 0 || Zn(e)) throw new RangeError('The value of "n" is out of range. It must be a non-negative number. Received ' + e + ".");
      return this._maxListeners = e, this;
    },
    "setMaxListeners"
  );
  function Jn(r) {
    return r._maxListeners === void 0 ? L.defaultMaxListeners : r._maxListeners;
  }
  __name(Jn, "Jn");
  a(Jn, "_getMaxListeners");
  L.prototype.getMaxListeners = a(function() {
    return Jn(this);
  }, "getMaxListeners");
  L.prototype.emit = a(function(e) {
    for (var t = [], n = 1; n < arguments.length; n++) t.push(arguments[n]);
    var i = e === "error", s = this._events;
    if (s !== void 0) i = i && s.error === void 0;
    else if (!i) return false;
    if (i) {
      var o;
      if (t.length > 0 && (o = t[0]), o instanceof Error) throw o;
      var u = new Error("Unhandled error." + (o ? " (" + o.message + ")" : ""));
      throw u.context = o, u;
    }
    var c = s[e];
    if (c === void 0) return false;
    if (typeof c == "function") zn(c, this, t);
    else for (var h = c.length, l = ni(c, h), n = 0; n < h; ++n) zn(
      l[n],
      this,
      t
    );
    return true;
  }, "emit");
  function Xn(r, e, t, n) {
    var i, s, o;
    if (ct(t), s = r._events, s === void 0 ? (s = r._events = /* @__PURE__ */ Object.create(null), r._eventsCount = 0) : (s.newListener !== void 0 && (r.emit(
      "newListener",
      e,
      t.listener ? t.listener : t
    ), s = r._events), o = s[e]), o === void 0) o = s[e] = t, ++r._eventsCount;
    else if (typeof o == "function" ? o = s[e] = n ? [t, o] : [o, t] : n ? o.unshift(
      t
    ) : o.push(t), i = Jn(r), i > 0 && o.length > i && !o.warned) {
      o.warned = true;
      var u = new Error("Possible EventEmitter memory leak detected. " + o.length + " " + String(e) + " listeners added. Use emitter.setMaxListeners() to increase limit");
      u.name = "MaxListenersExceededWarning", u.emitter = r, u.type = e, u.count = o.length, Wo(u);
    }
    return r;
  }
  __name(Xn, "Xn");
  a(Xn, "_addListener");
  L.prototype.addListener = a(function(e, t) {
    return Xn(this, e, t, false);
  }, "addListener");
  L.prototype.on = L.prototype.addListener;
  L.prototype.prependListener = a(function(e, t) {
    return Xn(this, e, t, true);
  }, "prependListener");
  function Ho() {
    if (!this.fired) return this.target.removeListener(this.type, this.wrapFn), this.fired = true, arguments.length === 0 ? this.listener.call(this.target) : this.listener.apply(this.target, arguments);
  }
  __name(Ho, "Ho");
  a(
    Ho,
    "onceWrapper"
  );
  function ei(r, e, t) {
    var n = {
      fired: false,
      wrapFn: void 0,
      target: r,
      type: e,
      listener: t
    }, i = Ho.bind(n);
    return i.listener = t, n.wrapFn = i, i;
  }
  __name(ei, "ei");
  a(ei, "_onceWrap");
  L.prototype.once = a(function(e, t) {
    return ct(t), this.on(e, ei(this, e, t)), this;
  }, "once");
  L.prototype.prependOnceListener = a(function(e, t) {
    return ct(t), this.prependListener(e, ei(
      this,
      e,
      t
    )), this;
  }, "prependOnceListener");
  L.prototype.removeListener = a(
    function(e, t) {
      var n, i, s, o, u;
      if (ct(t), i = this._events, i === void 0) return this;
      if (n = i[e], n === void 0) return this;
      if (n === t || n.listener === t) --this._eventsCount === 0 ? this._events = /* @__PURE__ */ Object.create(null) : (delete i[e], i.removeListener && this.emit("removeListener", e, n.listener || t));
      else if (typeof n != "function") {
        for (s = -1, o = n.length - 1; o >= 0; o--) if (n[o] === t || n[o].listener === t) {
          u = n[o].listener, s = o;
          break;
        }
        if (s < 0) return this;
        s === 0 ? n.shift() : Go(n, s), n.length === 1 && (i[e] = n[0]), i.removeListener !== void 0 && this.emit("removeListener", e, u || t);
      }
      return this;
    },
    "removeListener"
  );
  L.prototype.off = L.prototype.removeListener;
  L.prototype.removeAllListeners = a(function(e) {
    var t, n, i;
    if (n = this._events, n === void 0) return this;
    if (n.removeListener === void 0) return arguments.length === 0 ? (this._events = /* @__PURE__ */ Object.create(null), this._eventsCount = 0) : n[e] !== void 0 && (--this._eventsCount === 0 ? this._events = /* @__PURE__ */ Object.create(null) : delete n[e]), this;
    if (arguments.length === 0) {
      var s = Object.keys(n), o;
      for (i = 0; i < s.length; ++i) o = s[i], o !== "removeListener" && this.removeAllListeners(o);
      return this.removeAllListeners(
        "removeListener"
      ), this._events = /* @__PURE__ */ Object.create(null), this._eventsCount = 0, this;
    }
    if (t = n[e], typeof t == "function") this.removeListener(e, t);
    else if (t !== void 0) for (i = t.length - 1; i >= 0; i--) this.removeListener(e, t[i]);
    return this;
  }, "removeAllListeners");
  function ti(r, e, t) {
    var n = r._events;
    if (n === void 0) return [];
    var i = n[e];
    return i === void 0 ? [] : typeof i == "function" ? t ? [i.listener || i] : [i] : t ? $o(i) : ni(i, i.length);
  }
  __name(ti, "ti");
  a(ti, "_listeners");
  L.prototype.listeners = a(function(e) {
    return ti(this, e, true);
  }, "listeners");
  L.prototype.rawListeners = a(function(e) {
    return ti(this, e, false);
  }, "rawListeners");
  L.listenerCount = function(r, e) {
    return typeof r.listenerCount == "function" ? r.listenerCount(e) : ri.call(r, e);
  };
  L.prototype.listenerCount = ri;
  function ri(r) {
    var e = this._events;
    if (e !== void 0) {
      var t = e[r];
      if (typeof t == "function") return 1;
      if (t !== void 0) return t.length;
    }
    return 0;
  }
  __name(ri, "ri");
  a(ri, "listenerCount");
  L.prototype.eventNames = a(function() {
    return this._eventsCount > 0 ? ut(this._events) : [];
  }, "eventNames");
  function ni(r, e) {
    for (var t = new Array(e), n = 0; n < e; ++n) t[n] = r[n];
    return t;
  }
  __name(ni, "ni");
  a(ni, "arrayClone");
  function Go(r, e) {
    for (; e + 1 < r.length; e++) r[e] = r[e + 1];
    r.pop();
  }
  __name(Go, "Go");
  a(Go, "spliceOne");
  function $o(r) {
    for (var e = new Array(r.length), t = 0; t < e.length; ++t)
      e[t] = r[t].listener || r[t];
    return e;
  }
  __name($o, "$o");
  a($o, "unwrapListeners");
  function Vo(r, e) {
    return new Promise(
      function(t, n) {
        function i(o) {
          r.removeListener(e, s), n(o);
        }
        __name(i, "i");
        a(i, "errorListener");
        function s() {
          typeof r.removeListener == "function" && r.removeListener("error", i), t([].slice.call(
            arguments
          ));
        }
        __name(s, "s");
        a(s, "resolver"), ii(r, e, s, { once: true }), e !== "error" && Ko(r, i, { once: true });
      }
    );
  }
  __name(Vo, "Vo");
  a(Vo, "once");
  function Ko(r, e, t) {
    typeof r.on == "function" && ii(r, "error", e, t);
  }
  __name(Ko, "Ko");
  a(
    Ko,
    "addErrorHandlerIfEventEmitter"
  );
  function ii(r, e, t, n) {
    if (typeof r.on == "function")
      n.once ? r.once(e, t) : r.on(e, t);
    else if (typeof r.addEventListener == "function") r.addEventListener(
      e,
      a(/* @__PURE__ */ __name(function i(s) {
        n.once && r.removeEventListener(e, i), t(s);
      }, "i"), "wrapListener")
    );
    else
      throw new TypeError('The "emitter" argument must be of type EventEmitter. Received type ' + typeof r);
  }
  __name(ii, "ii");
  a(ii, "eventTargetAgnosticAddListener");
});
var He = {};
se(He, { default: /* @__PURE__ */ __name(() => zo, "default") });
var zo;
var Ge = z(() => {
  "use strict";
  p();
  zo = {};
});
function $e(r) {
  let e = 1779033703, t = 3144134277, n = 1013904242, i = 2773480762, s = 1359893119, o = 2600822924, u = 528734635, c = 1541459225, h = 0, l = 0, d = [
    1116352408,
    1899447441,
    3049323471,
    3921009573,
    961987163,
    1508970993,
    2453635748,
    2870763221,
    3624381080,
    310598401,
    607225278,
    1426881987,
    1925078388,
    2162078206,
    2614888103,
    3248222580,
    3835390401,
    4022224774,
    264347078,
    604807628,
    770255983,
    1249150122,
    1555081692,
    1996064986,
    2554220882,
    2821834349,
    2952996808,
    3210313671,
    3336571891,
    3584528711,
    113926993,
    338241895,
    666307205,
    773529912,
    1294757372,
    1396182291,
    1695183700,
    1986661051,
    2177026350,
    2456956037,
    2730485921,
    2820302411,
    3259730800,
    3345764771,
    3516065817,
    3600352804,
    4094571909,
    275423344,
    430227734,
    506948616,
    659060556,
    883997877,
    958139571,
    1322822218,
    1537002063,
    1747873779,
    1955562222,
    2024104815,
    2227730452,
    2361852424,
    2428436474,
    2756734187,
    3204031479,
    3329325298
  ], b = a(
    (A, g) => A >>> g | A << 32 - g,
    "rrot"
  ), C = new Uint32Array(64), B = new Uint8Array(64), Q = a(() => {
    for (let R = 0, $ = 0; R < 16; R++, $ += 4) C[R] = B[$] << 24 | B[$ + 1] << 16 | B[$ + 2] << 8 | B[$ + 3];
    for (let R = 16; R < 64; R++) {
      let $ = b(C[R - 15], 7) ^ b(C[R - 15], 18) ^ C[R - 15] >>> 3, ce = b(C[R - 2], 17) ^ b(C[R - 2], 19) ^ C[R - 2] >>> 10;
      C[R] = C[R - 16] + $ + C[R - 7] + ce | 0;
    }
    let A = e, g = t, P = n, K = i, k = s, j = o, ee = u, oe = c;
    for (let R = 0; R < 64; R++) {
      let $ = b(
        k,
        6
      ) ^ b(k, 11) ^ b(k, 25), ce = k & j ^ ~k & ee, ye = oe + $ + ce + d[R] + C[R] | 0, Se = b(A, 2) ^ b(A, 13) ^ b(A, 22), je = A & g ^ A & P ^ g & P, he = Se + je | 0;
      oe = ee, ee = j, j = k, k = K + ye | 0, K = P, P = g, g = A, A = ye + he | 0;
    }
    e = e + A | 0, t = t + g | 0, n = n + P | 0, i = i + K | 0, s = s + k | 0, o = o + j | 0, u = u + ee | 0, c = c + oe | 0, l = 0;
  }, "process"), X = a((A) => {
    typeof A == "string" && (A = new TextEncoder().encode(A));
    for (let g = 0; g < A.length; g++) B[l++] = A[g], l === 64 && Q();
    h += A.length;
  }, "add"), de = a(() => {
    if (B[l++] = 128, l == 64 && Q(), l + 8 > 64) {
      for (; l < 64; ) B[l++] = 0;
      Q();
    }
    for (; l < 58; ) B[l++] = 0;
    let A = h * 8;
    B[l++] = A / 1099511627776 & 255, B[l++] = A / 4294967296 & 255, B[l++] = A >>> 24, B[l++] = A >>> 16 & 255, B[l++] = A >>> 8 & 255, B[l++] = A & 255, Q();
    let g = new Uint8Array(32);
    return g[0] = e >>> 24, g[1] = e >>> 16 & 255, g[2] = e >>> 8 & 255, g[3] = e & 255, g[4] = t >>> 24, g[5] = t >>> 16 & 255, g[6] = t >>> 8 & 255, g[7] = t & 255, g[8] = n >>> 24, g[9] = n >>> 16 & 255, g[10] = n >>> 8 & 255, g[11] = n & 255, g[12] = i >>> 24, g[13] = i >>> 16 & 255, g[14] = i >>> 8 & 255, g[15] = i & 255, g[16] = s >>> 24, g[17] = s >>> 16 & 255, g[18] = s >>> 8 & 255, g[19] = s & 255, g[20] = o >>> 24, g[21] = o >>> 16 & 255, g[22] = o >>> 8 & 255, g[23] = o & 255, g[24] = u >>> 24, g[25] = u >>> 16 & 255, g[26] = u >>> 8 & 255, g[27] = u & 255, g[28] = c >>> 24, g[29] = c >>> 16 & 255, g[30] = c >>> 8 & 255, g[31] = c & 255, g;
  }, "digest");
  return r === void 0 ? { add: X, digest: de } : (X(r), de());
}
__name($e, "$e");
var si = z(
  () => {
    "use strict";
    p();
    a($e, "sha256");
  }
);
var U;
var Ve;
var oi = z(() => {
  "use strict";
  p();
  U = class U2 {
    static {
      __name(this, "U");
    }
    constructor() {
      _(
        this,
        "_dataLength",
        0
      );
      _(this, "_bufferLength", 0);
      _(this, "_state", new Int32Array(4));
      _(
        this,
        "_buffer",
        new ArrayBuffer(68)
      );
      _(this, "_buffer8");
      _(this, "_buffer32");
      this._buffer8 = new Uint8Array(
        this._buffer,
        0,
        68
      ), this._buffer32 = new Uint32Array(this._buffer, 0, 17), this.start();
    }
    static hashByteArray(e, t = false) {
      return this.onePassHasher.start().appendByteArray(e).end(t);
    }
    static hashStr(e, t = false) {
      return this.onePassHasher.start().appendStr(e).end(t);
    }
    static hashAsciiStr(e, t = false) {
      return this.onePassHasher.start().appendAsciiStr(e).end(t);
    }
    static _hex(e) {
      let t = U2.hexChars, n = U2.hexOut, i, s, o, u;
      for (u = 0; u < 4; u += 1) for (s = u * 8, i = e[u], o = 0; o < 8; o += 2) n[s + 1 + o] = t.charAt(i & 15), i >>>= 4, n[s + 0 + o] = t.charAt(i & 15), i >>>= 4;
      return n.join("");
    }
    static _md5cycle(e, t) {
      let n = e[0], i = e[1], s = e[2], o = e[3];
      n += (i & s | ~i & o) + t[0] - 680876936 | 0, n = (n << 7 | n >>> 25) + i | 0, o += (n & i | ~n & s) + t[1] - 389564586 | 0, o = (o << 12 | o >>> 20) + n | 0, s += (o & n | ~o & i) + t[2] + 606105819 | 0, s = (s << 17 | s >>> 15) + o | 0, i += (s & o | ~s & n) + t[3] - 1044525330 | 0, i = (i << 22 | i >>> 10) + s | 0, n += (i & s | ~i & o) + t[4] - 176418897 | 0, n = (n << 7 | n >>> 25) + i | 0, o += (n & i | ~n & s) + t[5] + 1200080426 | 0, o = (o << 12 | o >>> 20) + n | 0, s += (o & n | ~o & i) + t[6] - 1473231341 | 0, s = (s << 17 | s >>> 15) + o | 0, i += (s & o | ~s & n) + t[7] - 45705983 | 0, i = (i << 22 | i >>> 10) + s | 0, n += (i & s | ~i & o) + t[8] + 1770035416 | 0, n = (n << 7 | n >>> 25) + i | 0, o += (n & i | ~n & s) + t[9] - 1958414417 | 0, o = (o << 12 | o >>> 20) + n | 0, s += (o & n | ~o & i) + t[10] - 42063 | 0, s = (s << 17 | s >>> 15) + o | 0, i += (s & o | ~s & n) + t[11] - 1990404162 | 0, i = (i << 22 | i >>> 10) + s | 0, n += (i & s | ~i & o) + t[12] + 1804603682 | 0, n = (n << 7 | n >>> 25) + i | 0, o += (n & i | ~n & s) + t[13] - 40341101 | 0, o = (o << 12 | o >>> 20) + n | 0, s += (o & n | ~o & i) + t[14] - 1502002290 | 0, s = (s << 17 | s >>> 15) + o | 0, i += (s & o | ~s & n) + t[15] + 1236535329 | 0, i = (i << 22 | i >>> 10) + s | 0, n += (i & o | s & ~o) + t[1] - 165796510 | 0, n = (n << 5 | n >>> 27) + i | 0, o += (n & s | i & ~s) + t[6] - 1069501632 | 0, o = (o << 9 | o >>> 23) + n | 0, s += (o & i | n & ~i) + t[11] + 643717713 | 0, s = (s << 14 | s >>> 18) + o | 0, i += (s & n | o & ~n) + t[0] - 373897302 | 0, i = (i << 20 | i >>> 12) + s | 0, n += (i & o | s & ~o) + t[5] - 701558691 | 0, n = (n << 5 | n >>> 27) + i | 0, o += (n & s | i & ~s) + t[10] + 38016083 | 0, o = (o << 9 | o >>> 23) + n | 0, s += (o & i | n & ~i) + t[15] - 660478335 | 0, s = (s << 14 | s >>> 18) + o | 0, i += (s & n | o & ~n) + t[4] - 405537848 | 0, i = (i << 20 | i >>> 12) + s | 0, n += (i & o | s & ~o) + t[9] + 568446438 | 0, n = (n << 5 | n >>> 27) + i | 0, o += (n & s | i & ~s) + t[14] - 1019803690 | 0, o = (o << 9 | o >>> 23) + n | 0, s += (o & i | n & ~i) + t[3] - 187363961 | 0, s = (s << 14 | s >>> 18) + o | 0, i += (s & n | o & ~n) + t[8] + 1163531501 | 0, i = (i << 20 | i >>> 12) + s | 0, n += (i & o | s & ~o) + t[13] - 1444681467 | 0, n = (n << 5 | n >>> 27) + i | 0, o += (n & s | i & ~s) + t[2] - 51403784 | 0, o = (o << 9 | o >>> 23) + n | 0, s += (o & i | n & ~i) + t[7] + 1735328473 | 0, s = (s << 14 | s >>> 18) + o | 0, i += (s & n | o & ~n) + t[12] - 1926607734 | 0, i = (i << 20 | i >>> 12) + s | 0, n += (i ^ s ^ o) + t[5] - 378558 | 0, n = (n << 4 | n >>> 28) + i | 0, o += (n ^ i ^ s) + t[8] - 2022574463 | 0, o = (o << 11 | o >>> 21) + n | 0, s += (o ^ n ^ i) + t[11] + 1839030562 | 0, s = (s << 16 | s >>> 16) + o | 0, i += (s ^ o ^ n) + t[14] - 35309556 | 0, i = (i << 23 | i >>> 9) + s | 0, n += (i ^ s ^ o) + t[1] - 1530992060 | 0, n = (n << 4 | n >>> 28) + i | 0, o += (n ^ i ^ s) + t[4] + 1272893353 | 0, o = (o << 11 | o >>> 21) + n | 0, s += (o ^ n ^ i) + t[7] - 155497632 | 0, s = (s << 16 | s >>> 16) + o | 0, i += (s ^ o ^ n) + t[10] - 1094730640 | 0, i = (i << 23 | i >>> 9) + s | 0, n += (i ^ s ^ o) + t[13] + 681279174 | 0, n = (n << 4 | n >>> 28) + i | 0, o += (n ^ i ^ s) + t[0] - 358537222 | 0, o = (o << 11 | o >>> 21) + n | 0, s += (o ^ n ^ i) + t[3] - 722521979 | 0, s = (s << 16 | s >>> 16) + o | 0, i += (s ^ o ^ n) + t[6] + 76029189 | 0, i = (i << 23 | i >>> 9) + s | 0, n += (i ^ s ^ o) + t[9] - 640364487 | 0, n = (n << 4 | n >>> 28) + i | 0, o += (n ^ i ^ s) + t[12] - 421815835 | 0, o = (o << 11 | o >>> 21) + n | 0, s += (o ^ n ^ i) + t[15] + 530742520 | 0, s = (s << 16 | s >>> 16) + o | 0, i += (s ^ o ^ n) + t[2] - 995338651 | 0, i = (i << 23 | i >>> 9) + s | 0, n += (s ^ (i | ~o)) + t[0] - 198630844 | 0, n = (n << 6 | n >>> 26) + i | 0, o += (i ^ (n | ~s)) + t[7] + 1126891415 | 0, o = (o << 10 | o >>> 22) + n | 0, s += (n ^ (o | ~i)) + t[14] - 1416354905 | 0, s = (s << 15 | s >>> 17) + o | 0, i += (o ^ (s | ~n)) + t[5] - 57434055 | 0, i = (i << 21 | i >>> 11) + s | 0, n += (s ^ (i | ~o)) + t[12] + 1700485571 | 0, n = (n << 6 | n >>> 26) + i | 0, o += (i ^ (n | ~s)) + t[3] - 1894986606 | 0, o = (o << 10 | o >>> 22) + n | 0, s += (n ^ (o | ~i)) + t[10] - 1051523 | 0, s = (s << 15 | s >>> 17) + o | 0, i += (o ^ (s | ~n)) + t[1] - 2054922799 | 0, i = (i << 21 | i >>> 11) + s | 0, n += (s ^ (i | ~o)) + t[8] + 1873313359 | 0, n = (n << 6 | n >>> 26) + i | 0, o += (i ^ (n | ~s)) + t[15] - 30611744 | 0, o = (o << 10 | o >>> 22) + n | 0, s += (n ^ (o | ~i)) + t[6] - 1560198380 | 0, s = (s << 15 | s >>> 17) + o | 0, i += (o ^ (s | ~n)) + t[13] + 1309151649 | 0, i = (i << 21 | i >>> 11) + s | 0, n += (s ^ (i | ~o)) + t[4] - 145523070 | 0, n = (n << 6 | n >>> 26) + i | 0, o += (i ^ (n | ~s)) + t[11] - 1120210379 | 0, o = (o << 10 | o >>> 22) + n | 0, s += (n ^ (o | ~i)) + t[2] + 718787259 | 0, s = (s << 15 | s >>> 17) + o | 0, i += (o ^ (s | ~n)) + t[9] - 343485551 | 0, i = (i << 21 | i >>> 11) + s | 0, e[0] = n + e[0] | 0, e[1] = i + e[1] | 0, e[2] = s + e[2] | 0, e[3] = o + e[3] | 0;
    }
    start() {
      return this._dataLength = 0, this._bufferLength = 0, this._state.set(U2.stateIdentity), this;
    }
    appendStr(e) {
      let t = this._buffer8, n = this._buffer32, i = this._bufferLength, s, o;
      for (o = 0; o < e.length; o += 1) {
        if (s = e.charCodeAt(o), s < 128) t[i++] = s;
        else if (s < 2048) t[i++] = (s >>> 6) + 192, t[i++] = s & 63 | 128;
        else if (s < 55296 || s > 56319) t[i++] = (s >>> 12) + 224, t[i++] = s >>> 6 & 63 | 128, t[i++] = s & 63 | 128;
        else {
          if (s = (s - 55296) * 1024 + (e.charCodeAt(++o) - 56320) + 65536, s > 1114111) throw new Error("Unicode standard supports code points up to U+10FFFF");
          t[i++] = (s >>> 18) + 240, t[i++] = s >>> 12 & 63 | 128, t[i++] = s >>> 6 & 63 | 128, t[i++] = s & 63 | 128;
        }
        i >= 64 && (this._dataLength += 64, U2._md5cycle(this._state, n), i -= 64, n[0] = n[16]);
      }
      return this._bufferLength = i, this;
    }
    appendAsciiStr(e) {
      let t = this._buffer8, n = this._buffer32, i = this._bufferLength, s, o = 0;
      for (; ; ) {
        for (s = Math.min(e.length - o, 64 - i); s--; ) t[i++] = e.charCodeAt(o++);
        if (i < 64) break;
        this._dataLength += 64, U2._md5cycle(
          this._state,
          n
        ), i = 0;
      }
      return this._bufferLength = i, this;
    }
    appendByteArray(e) {
      let t = this._buffer8, n = this._buffer32, i = this._bufferLength, s, o = 0;
      for (; ; ) {
        for (s = Math.min(e.length - o, 64 - i); s--; ) t[i++] = e[o++];
        if (i < 64) break;
        this._dataLength += 64, U2._md5cycle(
          this._state,
          n
        ), i = 0;
      }
      return this._bufferLength = i, this;
    }
    getState() {
      let e = this._state;
      return { buffer: String.fromCharCode.apply(null, Array.from(this._buffer8)), buflen: this._bufferLength, length: this._dataLength, state: [e[0], e[1], e[2], e[3]] };
    }
    setState(e) {
      let t = e.buffer, n = e.state, i = this._state, s;
      for (this._dataLength = e.length, this._bufferLength = e.buflen, i[0] = n[0], i[1] = n[1], i[2] = n[2], i[3] = n[3], s = 0; s < t.length; s += 1) this._buffer8[s] = t.charCodeAt(s);
    }
    end(e = false) {
      let t = this._bufferLength, n = this._buffer8, i = this._buffer32, s = (t >> 2) + 1;
      this._dataLength += t;
      let o = this._dataLength * 8;
      if (n[t] = 128, n[t + 1] = n[t + 2] = n[t + 3] = 0, i.set(U2.buffer32Identity.subarray(s), s), t > 55 && (U2._md5cycle(this._state, i), i.set(U2.buffer32Identity)), o <= 4294967295)
        i[14] = o;
      else {
        let u = o.toString(16).match(/(.*?)(.{0,8})$/);
        if (u === null) return;
        let c = parseInt(
          u[2],
          16
        ), h = parseInt(u[1], 16) || 0;
        i[14] = c, i[15] = h;
      }
      return U2._md5cycle(this._state, i), e ? this._state : U2._hex(this._state);
    }
  };
  a(U, "Md5"), _(U, "stateIdentity", new Int32Array(
    [1732584193, -271733879, -1732584194, 271733878]
  )), _(U, "buffer32Identity", new Int32Array(
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
  )), _(U, "hexChars", "0123456789abcdef"), _(U, "hexOut", []), _(U, "onePassHasher", new U());
  Ve = U;
});
var Wt = {};
se(Wt, { createHash: /* @__PURE__ */ __name(() => Zo, "createHash"), createHmac: /* @__PURE__ */ __name(() => Jo, "createHmac"), randomBytes: /* @__PURE__ */ __name(() => Yo, "randomBytes") });
function Yo(r) {
  return w.getRandomValues(y.alloc(r));
}
__name(Yo, "Yo");
function Zo(r) {
  if (r === "sha256") return { update: a(
    function(e) {
      return { digest: a(function() {
        return y.from($e(e));
      }, "digest") };
    },
    "update"
  ) };
  if (r === "md5") return { update: a(function(e) {
    return { digest: a(function() {
      return typeof e == "string" ? Ve.hashStr(e) : Ve.hashByteArray(e);
    }, "digest") };
  }, "update") };
  throw new Error(
    `Hash type '${r}' not supported`
  );
}
__name(Zo, "Zo");
function Jo(r, e) {
  if (r !== "sha256") throw new Error(
    `Only sha256 is supported (requested: '${r}')`
  );
  return { update: a(function(t) {
    return {
      digest: a(function() {
        typeof e == "string" && (e = new TextEncoder().encode(e)), typeof t == "string" && (t = new TextEncoder().encode(t));
        let n = e.length;
        if (n > 64) e = $e(e);
        else if (n < 64) {
          let c = new Uint8Array(64);
          c.set(e), e = c;
        }
        let i = new Uint8Array(64), s = new Uint8Array(
          64
        );
        for (let c = 0; c < 64; c++) i[c] = 54 ^ e[c], s[c] = 92 ^ e[c];
        let o = new Uint8Array(t.length + 64);
        o.set(i, 0), o.set(t, 64);
        let u = new Uint8Array(96);
        return u.set(s, 0), u.set(
          $e(o),
          64
        ), y.from($e(u));
      }, "digest")
    };
  }, "update") };
}
__name(Jo, "Jo");
var Ht = z(() => {
  "use strict";
  p();
  si();
  oi();
  a(Yo, "randomBytes");
  a(Zo, "createHash");
  a(Jo, "createHmac");
});
var $t = I((ai) => {
  "use strict";
  p();
  ai.parse = function(r, e) {
    return new Gt(r, e).parse();
  };
  var ht = class ht2 {
    static {
      __name(this, "ht");
    }
    constructor(e, t) {
      this.source = e, this.transform = t || Xo, this.position = 0, this.entries = [], this.recorded = [], this.dimension = 0;
    }
    isEof() {
      return this.position >= this.source.length;
    }
    nextCharacter() {
      var e = this.source[this.position++];
      return e === "\\" ? { value: this.source[this.position++], escaped: true } : { value: e, escaped: false };
    }
    record(e) {
      this.recorded.push(e);
    }
    newEntry(e) {
      var t;
      (this.recorded.length > 0 || e) && (t = this.recorded.join(""), t === "NULL" && !e && (t = null), t !== null && (t = this.transform(t)), this.entries.push(
        t
      ), this.recorded = []);
    }
    consumeDimensions() {
      if (this.source[0] === "[") for (; !this.isEof(); ) {
        var e = this.nextCharacter();
        if (e.value === "=") break;
      }
    }
    parse(e) {
      var t, n, i;
      for (this.consumeDimensions(); !this.isEof(); ) if (t = this.nextCharacter(), t.value === "{" && !i) this.dimension++, this.dimension > 1 && (n = new ht2(this.source.substr(this.position - 1), this.transform), this.entries.push(
        n.parse(true)
      ), this.position += n.position - 2);
      else if (t.value === "}" && !i) {
        if (this.dimension--, !this.dimension && (this.newEntry(), e)) return this.entries;
      } else t.value === '"' && !t.escaped ? (i && this.newEntry(true), i = !i) : t.value === "," && !i ? this.newEntry() : this.record(
        t.value
      );
      if (this.dimension !== 0) throw new Error("array dimension not balanced");
      return this.entries;
    }
  };
  a(ht, "ArrayParser");
  var Gt = ht;
  function Xo(r) {
    return r;
  }
  __name(Xo, "Xo");
  a(Xo, "identity");
});
var Vt = I((Sh, ui) => {
  p();
  var ea = $t();
  ui.exports = { create: a(function(r, e) {
    return { parse: a(
      function() {
        return ea.parse(r, e);
      },
      "parse"
    ) };
  }, "create") };
});
var li = I((vh, hi) => {
  "use strict";
  p();
  var ta = /(\d{1,})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})(\.\d{1,})?.*?( BC)?$/, ra = /^(\d{1,})-(\d{2})-(\d{2})( BC)?$/, na = /([Z+-])(\d{2})?:?(\d{2})?:?(\d{2})?/, ia = /^-?infinity$/;
  hi.exports = a(function(e) {
    if (ia.test(e)) return Number(e.replace("i", "I"));
    var t = ta.exec(e);
    if (!t) return sa(e) || null;
    var n = !!t[8], i = parseInt(t[1], 10);
    n && (i = ci(i));
    var s = parseInt(
      t[2],
      10
    ) - 1, o = t[3], u = parseInt(t[4], 10), c = parseInt(t[5], 10), h = parseInt(t[6], 10), l = t[7];
    l = l ? 1e3 * parseFloat(l) : 0;
    var d, b = oa(e);
    return b != null ? (d = new Date(Date.UTC(
      i,
      s,
      o,
      u,
      c,
      h,
      l
    )), Kt(i) && d.setUTCFullYear(i), b !== 0 && d.setTime(d.getTime() - b)) : (d = new Date(
      i,
      s,
      o,
      u,
      c,
      h,
      l
    ), Kt(i) && d.setFullYear(i)), d;
  }, "parseDate");
  function sa(r) {
    var e = ra.exec(r);
    if (e) {
      var t = parseInt(e[1], 10), n = !!e[4];
      n && (t = ci(t));
      var i = parseInt(
        e[2],
        10
      ) - 1, s = e[3], o = new Date(t, i, s);
      return Kt(t) && o.setFullYear(t), o;
    }
  }
  __name(sa, "sa");
  a(sa, "getDate");
  function oa(r) {
    if (r.endsWith("+00")) return 0;
    var e = na.exec(r.split(" ")[1]);
    if (e) {
      var t = e[1];
      if (t === "Z") return 0;
      var n = t === "-" ? -1 : 1, i = parseInt(e[2], 10) * 3600 + parseInt(
        e[3] || 0,
        10
      ) * 60 + parseInt(e[4] || 0, 10);
      return i * n * 1e3;
    }
  }
  __name(oa, "oa");
  a(oa, "timeZoneOffset");
  function ci(r) {
    return -(r - 1);
  }
  __name(ci, "ci");
  a(ci, "bcYearToNegativeYear");
  function Kt(r) {
    return r >= 0 && r < 100;
  }
  __name(Kt, "Kt");
  a(
    Kt,
    "is0To99"
  );
});
var pi = I((Ch, fi) => {
  p();
  fi.exports = ua;
  var aa = Object.prototype.hasOwnProperty;
  function ua(r) {
    for (var e = 1; e < arguments.length; e++) {
      var t = arguments[e];
      for (var n in t) aa.call(
        t,
        n
      ) && (r[n] = t[n]);
    }
    return r;
  }
  __name(ua, "ua");
  a(ua, "extend");
});
var mi = I((Ph, yi) => {
  "use strict";
  p();
  var ca = pi();
  yi.exports = Fe;
  function Fe(r) {
    if (!(this instanceof Fe)) return new Fe(r);
    ca(this, xa(r));
  }
  __name(Fe, "Fe");
  a(Fe, "PostgresInterval");
  var ha = ["seconds", "minutes", "hours", "days", "months", "years"];
  Fe.prototype.toPostgres = function() {
    var r = ha.filter(this.hasOwnProperty, this);
    return this.milliseconds && r.indexOf("seconds") < 0 && r.push("seconds"), r.length === 0 ? "0" : r.map(function(e) {
      var t = this[e] || 0;
      return e === "seconds" && this.milliseconds && (t = (t + this.milliseconds / 1e3).toFixed(6).replace(
        /\.?0+$/,
        ""
      )), t + " " + e;
    }, this).join(" ");
  };
  var la = { years: "Y", months: "M", days: "D", hours: "H", minutes: "M", seconds: "S" }, fa = ["years", "months", "days"], pa = ["hours", "minutes", "seconds"];
  Fe.prototype.toISOString = Fe.prototype.toISO = function() {
    var r = fa.map(t, this).join(""), e = pa.map(t, this).join("");
    return "P" + r + "T" + e;
    function t(n) {
      var i = this[n] || 0;
      return n === "seconds" && this.milliseconds && (i = (i + this.milliseconds / 1e3).toFixed(6).replace(
        /0+$/,
        ""
      )), i + la[n];
    }
    __name(t, "t");
  };
  var zt = "([+-]?\\d+)", da = zt + "\\s+years?", ya = zt + "\\s+mons?", ma = zt + "\\s+days?", ga = "([+-])?([\\d]*):(\\d\\d):(\\d\\d)\\.?(\\d{1,6})?", wa = new RegExp([
    da,
    ya,
    ma,
    ga
  ].map(function(r) {
    return "(" + r + ")?";
  }).join("\\s*")), di = {
    years: 2,
    months: 4,
    days: 6,
    hours: 9,
    minutes: 10,
    seconds: 11,
    milliseconds: 12
  }, ba = ["hours", "minutes", "seconds", "milliseconds"];
  function Sa(r) {
    var e = r + "000000".slice(r.length);
    return parseInt(
      e,
      10
    ) / 1e3;
  }
  __name(Sa, "Sa");
  a(Sa, "parseMilliseconds");
  function xa(r) {
    if (!r) return {};
    var e = wa.exec(
      r
    ), t = e[8] === "-";
    return Object.keys(di).reduce(function(n, i) {
      var s = di[i], o = e[s];
      return !o || (o = i === "milliseconds" ? Sa(o) : parseInt(o, 10), !o) || (t && ~ba.indexOf(i) && (o *= -1), n[i] = o), n;
    }, {});
  }
  __name(xa, "xa");
  a(xa, "parse");
});
var wi = I((Rh, gi) => {
  "use strict";
  p();
  gi.exports = a(function(e) {
    if (/^\\x/.test(e)) return new y(
      e.substr(2),
      "hex"
    );
    for (var t = "", n = 0; n < e.length; ) if (e[n] !== "\\") t += e[n], ++n;
    else if (/[0-7]{3}/.test(e.substr(n + 1, 3))) t += String.fromCharCode(parseInt(e.substr(n + 1, 3), 8)), n += 4;
    else {
      for (var i = 1; n + i < e.length && e[n + i] === "\\"; ) i++;
      for (var s = 0; s < Math.floor(i / 2); ++s) t += "\\";
      n += Math.floor(i / 2) * 2;
    }
    return new y(t, "binary");
  }, "parseBytea");
});
var Ai = I((Dh, _i) => {
  p();
  var Ke = $t(), ze = Vt(), lt = li(), Si = mi(), xi = wi();
  function ft(r) {
    return a(function(t) {
      return t === null ? t : r(t);
    }, "nullAllowed");
  }
  __name(ft, "ft");
  a(ft, "allowNull");
  function Ei(r) {
    return r === null ? r : r === "TRUE" || r === "t" || r === "true" || r === "y" || r === "yes" || r === "on" || r === "1";
  }
  __name(Ei, "Ei");
  a(Ei, "parseBool");
  function Ea(r) {
    return r ? Ke.parse(r, Ei) : null;
  }
  __name(Ea, "Ea");
  a(Ea, "parseBoolArray");
  function va(r) {
    return parseInt(r, 10);
  }
  __name(va, "va");
  a(va, "parseBaseTenInt");
  function Yt(r) {
    return r ? Ke.parse(r, ft(va)) : null;
  }
  __name(Yt, "Yt");
  a(Yt, "parseIntegerArray");
  function _a(r) {
    return r ? Ke.parse(r, ft(function(e) {
      return vi(e).trim();
    })) : null;
  }
  __name(_a, "_a");
  a(_a, "parseBigIntegerArray");
  var Aa = a(function(r) {
    if (!r) return null;
    var e = ze.create(r, function(t) {
      return t !== null && (t = er(t)), t;
    });
    return e.parse();
  }, "parsePointArray"), Zt = a(function(r) {
    if (!r)
      return null;
    var e = ze.create(r, function(t) {
      return t !== null && (t = parseFloat(t)), t;
    });
    return e.parse();
  }, "parseFloatArray"), ne = a(function(r) {
    if (!r) return null;
    var e = ze.create(r);
    return e.parse();
  }, "parseStringArray"), Jt = a(function(r) {
    if (!r) return null;
    var e = ze.create(r, function(t) {
      return t !== null && (t = lt(t)), t;
    });
    return e.parse();
  }, "parseDateArray"), Ca = a(function(r) {
    if (!r) return null;
    var e = ze.create(r, function(t) {
      return t !== null && (t = Si(t)), t;
    });
    return e.parse();
  }, "parseIntervalArray"), Ta = a(function(r) {
    return r ? Ke.parse(r, ft(xi)) : null;
  }, "parseByteAArray"), Xt = a(function(r) {
    return parseInt(
      r,
      10
    );
  }, "parseInteger"), vi = a(function(r) {
    var e = String(r);
    return /^\d+$/.test(e) ? e : r;
  }, "parseBigInteger"), bi = a(
    function(r) {
      return r ? Ke.parse(r, ft(JSON.parse)) : null;
    },
    "parseJsonArray"
  ), er = a(function(r) {
    return r[0] !== "(" ? null : (r = r.substring(1, r.length - 1).split(","), { x: parseFloat(r[0]), y: parseFloat(r[1]) });
  }, "parsePoint"), Ia = a(function(r) {
    if (r[0] !== "<" && r[1] !== "(") return null;
    for (var e = "(", t = "", n = false, i = 2; i < r.length - 1; i++) {
      if (n || (e += r[i]), r[i] === ")") {
        n = true;
        continue;
      } else if (!n) continue;
      r[i] !== "," && (t += r[i]);
    }
    var s = er(e);
    return s.radius = parseFloat(t), s;
  }, "parseCircle"), Pa = a(function(r) {
    r(
      20,
      vi
    ), r(21, Xt), r(23, Xt), r(26, Xt), r(700, parseFloat), r(701, parseFloat), r(16, Ei), r(
      1082,
      lt
    ), r(1114, lt), r(1184, lt), r(600, er), r(651, ne), r(718, Ia), r(1e3, Ea), r(1001, Ta), r(
      1005,
      Yt
    ), r(1007, Yt), r(1028, Yt), r(1016, _a), r(1017, Aa), r(1021, Zt), r(1022, Zt), r(1231, Zt), r(1014, ne), r(1015, ne), r(1008, ne), r(1009, ne), r(1040, ne), r(1041, ne), r(1115, Jt), r(
      1182,
      Jt
    ), r(1185, Jt), r(1186, Si), r(1187, Ca), r(17, xi), r(114, JSON.parse.bind(JSON)), r(
      3802,
      JSON.parse.bind(JSON)
    ), r(199, bi), r(3807, bi), r(3907, ne), r(2951, ne), r(791, ne), r(
      1183,
      ne
    ), r(1270, ne);
  }, "init");
  _i.exports = { init: Pa };
});
var Ti = I((Oh, Ci) => {
  "use strict";
  p();
  var Z = 1e6;
  function Ba(r) {
    var e = r.readInt32BE(
      0
    ), t = r.readUInt32BE(4), n = "";
    e < 0 && (e = ~e + (t === 0), t = ~t + 1 >>> 0, n = "-");
    var i = "", s, o, u, c, h, l;
    {
      if (s = e % Z, e = e / Z >>> 0, o = 4294967296 * s + t, t = o / Z >>> 0, u = "" + (o - Z * t), t === 0 && e === 0) return n + u + i;
      for (c = "", h = 6 - u.length, l = 0; l < h; l++) c += "0";
      i = c + u + i;
    }
    {
      if (s = e % Z, e = e / Z >>> 0, o = 4294967296 * s + t, t = o / Z >>> 0, u = "" + (o - Z * t), t === 0 && e === 0) return n + u + i;
      for (c = "", h = 6 - u.length, l = 0; l < h; l++) c += "0";
      i = c + u + i;
    }
    {
      if (s = e % Z, e = e / Z >>> 0, o = 4294967296 * s + t, t = o / Z >>> 0, u = "" + (o - Z * t), t === 0 && e === 0) return n + u + i;
      for (c = "", h = 6 - u.length, l = 0; l < h; l++) c += "0";
      i = c + u + i;
    }
    return s = e % Z, o = 4294967296 * s + t, u = "" + o % Z, n + u + i;
  }
  __name(Ba, "Ba");
  a(Ba, "readInt8");
  Ci.exports = Ba;
});
var Ri = I((Qh, Li) => {
  p();
  var La = Ti(), F = a(function(r, e, t, n, i) {
    t = t || 0, n = n || false, i = i || function(C, B, Q) {
      return C * Math.pow(2, Q) + B;
    };
    var s = t >> 3, o = a(function(C) {
      return n ? ~C & 255 : C;
    }, "inv"), u = 255, c = 8 - t % 8;
    e < c && (u = 255 << 8 - e & 255, c = e), t && (u = u >> t % 8);
    var h = 0;
    t % 8 + e >= 8 && (h = i(0, o(r[s]) & u, c));
    for (var l = e + t >> 3, d = s + 1; d < l; d++) h = i(h, o(r[d]), 8);
    var b = (e + t) % 8;
    return b > 0 && (h = i(h, o(r[l]) >> 8 - b, b)), h;
  }, "parseBits"), Bi = a(function(r, e, t) {
    var n = Math.pow(2, t - 1) - 1, i = F(r, 1), s = F(r, t, 1);
    if (s === 0) return 0;
    var o = 1, u = a(function(h, l, d) {
      h === 0 && (h = 1);
      for (var b = 1; b <= d; b++) o /= 2, (l & 1 << d - b) > 0 && (h += o);
      return h;
    }, "parsePrecisionBits"), c = F(r, e, t + 1, false, u);
    return s == Math.pow(2, t + 1) - 1 ? c === 0 ? i === 0 ? 1 / 0 : -1 / 0 : NaN : (i === 0 ? 1 : -1) * Math.pow(2, s - n) * c;
  }, "parseFloatFromBits"), Ra = a(function(r) {
    return F(r, 1) == 1 ? -1 * (F(r, 15, 1, true) + 1) : F(r, 15, 1);
  }, "parseInt16"), Ii = a(function(r) {
    return F(r, 1) == 1 ? -1 * (F(
      r,
      31,
      1,
      true
    ) + 1) : F(r, 31, 1);
  }, "parseInt32"), Fa = a(function(r) {
    return Bi(r, 23, 8);
  }, "parseFloat32"), Ma = a(function(r) {
    return Bi(r, 52, 11);
  }, "parseFloat64"), Da = a(function(r) {
    var e = F(r, 16, 32);
    if (e == 49152) return NaN;
    for (var t = Math.pow(1e4, F(r, 16, 16)), n = 0, i = [], s = F(r, 16), o = 0; o < s; o++) n += F(r, 16, 64 + 16 * o) * t, t /= 1e4;
    var u = Math.pow(10, F(r, 16, 48));
    return (e === 0 ? 1 : -1) * Math.round(n * u) / u;
  }, "parseNumeric"), Pi = a(function(r, e) {
    var t = F(
      e,
      1
    ), n = F(e, 63, 1), i = new Date((t === 0 ? 1 : -1) * n / 1e3 + 9466848e5);
    return r || i.setTime(i.getTime() + i.getTimezoneOffset() * 6e4), i.usec = n % 1e3, i.getMicroSeconds = function() {
      return this.usec;
    }, i.setMicroSeconds = function(s) {
      this.usec = s;
    }, i.getUTCMicroSeconds = function() {
      return this.usec;
    }, i;
  }, "parseDate"), Ye = a(function(r) {
    for (var e = F(r, 32), t = F(r, 32, 32), n = F(r, 32, 64), i = 96, s = [], o = 0; o < e; o++) s[o] = F(r, 32, i), i += 32, i += 32;
    var u = a(function(h) {
      var l = F(r, 32, i);
      if (i += 32, l == 4294967295) return null;
      var d;
      if (h == 23 || h == 20) return d = F(r, l * 8, i), i += l * 8, d;
      if (h == 25) return d = r.toString(this.encoding, i >> 3, (i += l << 3) >> 3), d;
      console.log("ERROR: ElementType not implemented: " + h);
    }, "parseElement"), c = a(function(h, l) {
      var d = [], b;
      if (h.length > 1) {
        var C = h.shift();
        for (b = 0; b < C; b++) d[b] = c(h, l);
        h.unshift(
          C
        );
      } else for (b = 0; b < h[0]; b++) d[b] = u(l);
      return d;
    }, "parse");
    return c(s, n);
  }, "parseArray"), ka = a(function(r) {
    return r.toString("utf8");
  }, "parseText"), Ua = a(function(r) {
    return r === null ? null : F(r, 8) > 0;
  }, "parseBool"), Oa = a(function(r) {
    r(20, La), r(21, Ra), r(23, Ii), r(
      26,
      Ii
    ), r(1700, Da), r(700, Fa), r(701, Ma), r(16, Ua), r(1114, Pi.bind(null, false)), r(1184, Pi.bind(
      null,
      true
    )), r(1e3, Ye), r(1007, Ye), r(1016, Ye), r(1008, Ye), r(1009, Ye), r(25, ka);
  }, "init");
  Li.exports = { init: Oa };
});
var Mi = I((Hh, Fi) => {
  p();
  Fi.exports = {
    BOOL: 16,
    BYTEA: 17,
    CHAR: 18,
    INT8: 20,
    INT2: 21,
    INT4: 23,
    REGPROC: 24,
    TEXT: 25,
    OID: 26,
    TID: 27,
    XID: 28,
    CID: 29,
    JSON: 114,
    XML: 142,
    PG_NODE_TREE: 194,
    SMGR: 210,
    PATH: 602,
    POLYGON: 604,
    CIDR: 650,
    FLOAT4: 700,
    FLOAT8: 701,
    ABSTIME: 702,
    RELTIME: 703,
    TINTERVAL: 704,
    CIRCLE: 718,
    MACADDR8: 774,
    MONEY: 790,
    MACADDR: 829,
    INET: 869,
    ACLITEM: 1033,
    BPCHAR: 1042,
    VARCHAR: 1043,
    DATE: 1082,
    TIME: 1083,
    TIMESTAMP: 1114,
    TIMESTAMPTZ: 1184,
    INTERVAL: 1186,
    TIMETZ: 1266,
    BIT: 1560,
    VARBIT: 1562,
    NUMERIC: 1700,
    REFCURSOR: 1790,
    REGPROCEDURE: 2202,
    REGOPER: 2203,
    REGOPERATOR: 2204,
    REGCLASS: 2205,
    REGTYPE: 2206,
    UUID: 2950,
    TXID_SNAPSHOT: 2970,
    PG_LSN: 3220,
    PG_NDISTINCT: 3361,
    PG_DEPENDENCIES: 3402,
    TSVECTOR: 3614,
    TSQUERY: 3615,
    GTSVECTOR: 3642,
    REGCONFIG: 3734,
    REGDICTIONARY: 3769,
    JSONB: 3802,
    REGNAMESPACE: 4089,
    REGROLE: 4096
  };
});
var Xe = I((Je) => {
  p();
  var Na = Ai(), qa = Ri(), Qa = Vt(), ja = Mi();
  Je.getTypeParser = Wa;
  Je.setTypeParser = Ha;
  Je.arrayParser = Qa;
  Je.builtins = ja;
  var Ze = { text: {}, binary: {} };
  function Di(r) {
    return String(
      r
    );
  }
  __name(Di, "Di");
  a(Di, "noParse");
  function Wa(r, e) {
    return e = e || "text", Ze[e] && Ze[e][r] || Di;
  }
  __name(Wa, "Wa");
  a(
    Wa,
    "getTypeParser"
  );
  function Ha(r, e, t) {
    typeof e == "function" && (t = e, e = "text"), Ze[e][r] = t;
  }
  __name(Ha, "Ha");
  a(Ha, "setTypeParser");
  Na.init(function(r, e) {
    Ze.text[r] = e;
  });
  qa.init(function(r, e) {
    Ze.binary[r] = e;
  });
});
var et = I((zh, tr) => {
  "use strict";
  p();
  tr.exports = {
    host: "localhost",
    user: m.platform === "win32" ? m.env.USERNAME : m.env.USER,
    database: void 0,
    password: null,
    connectionString: void 0,
    port: 5432,
    rows: 0,
    binary: false,
    max: 10,
    idleTimeoutMillis: 3e4,
    client_encoding: "",
    ssl: false,
    application_name: void 0,
    fallback_application_name: void 0,
    options: void 0,
    parseInputDatesAsUTC: false,
    statement_timeout: false,
    lock_timeout: false,
    idle_in_transaction_session_timeout: false,
    query_timeout: false,
    connect_timeout: 0,
    keepalives: 1,
    keepalives_idle: 0
  };
  var Me = Xe(), Ga = Me.getTypeParser(
    20,
    "text"
  ), $a = Me.getTypeParser(1016, "text");
  tr.exports.__defineSetter__("parseInt8", function(r) {
    Me.setTypeParser(20, "text", r ? Me.getTypeParser(23, "text") : Ga), Me.setTypeParser(1016, "text", r ? Me.getTypeParser(1007, "text") : $a);
  });
});
var tt = I((Zh, Ui) => {
  "use strict";
  p();
  var Va = (Ht(), O(Wt)), Ka = et();
  function za(r) {
    var e = r.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
    return '"' + e + '"';
  }
  __name(za, "za");
  a(za, "escapeElement");
  function ki(r) {
    for (var e = "{", t = 0; t < r.length; t++) t > 0 && (e = e + ","), r[t] === null || typeof r[t] > "u" ? e = e + "NULL" : Array.isArray(r[t]) ? e = e + ki(r[t]) : r[t] instanceof y ? e += "\\\\x" + r[t].toString("hex") : e += za(pt(r[t]));
    return e = e + "}", e;
  }
  __name(ki, "ki");
  a(ki, "arrayString");
  var pt = a(function(r, e) {
    if (r == null) return null;
    if (r instanceof y) return r;
    if (ArrayBuffer.isView(r)) {
      var t = y.from(r.buffer, r.byteOffset, r.byteLength);
      return t.length === r.byteLength ? t : t.slice(
        r.byteOffset,
        r.byteOffset + r.byteLength
      );
    }
    return r instanceof Date ? Ka.parseInputDatesAsUTC ? Ja(r) : Za(r) : Array.isArray(r) ? ki(r) : typeof r == "object" ? Ya(r, e) : r.toString();
  }, "prepareValue");
  function Ya(r, e) {
    if (r && typeof r.toPostgres == "function") {
      if (e = e || [], e.indexOf(r) !== -1) throw new Error('circular reference detected while preparing "' + r + '" for query');
      return e.push(r), pt(r.toPostgres(pt), e);
    }
    return JSON.stringify(r);
  }
  __name(Ya, "Ya");
  a(Ya, "prepareObject");
  function G(r, e) {
    for (r = "" + r; r.length < e; ) r = "0" + r;
    return r;
  }
  __name(G, "G");
  a(
    G,
    "pad"
  );
  function Za(r) {
    var e = -r.getTimezoneOffset(), t = r.getFullYear(), n = t < 1;
    n && (t = Math.abs(t) + 1);
    var i = G(t, 4) + "-" + G(r.getMonth() + 1, 2) + "-" + G(r.getDate(), 2) + "T" + G(r.getHours(), 2) + ":" + G(r.getMinutes(), 2) + ":" + G(r.getSeconds(), 2) + "." + G(
      r.getMilliseconds(),
      3
    );
    return e < 0 ? (i += "-", e *= -1) : i += "+", i += G(Math.floor(e / 60), 2) + ":" + G(e % 60, 2), n && (i += " BC"), i;
  }
  __name(Za, "Za");
  a(Za, "dateToString");
  function Ja(r) {
    var e = r.getUTCFullYear(), t = e < 1;
    t && (e = Math.abs(e) + 1);
    var n = G(e, 4) + "-" + G(r.getUTCMonth() + 1, 2) + "-" + G(r.getUTCDate(), 2) + "T" + G(r.getUTCHours(), 2) + ":" + G(r.getUTCMinutes(), 2) + ":" + G(r.getUTCSeconds(), 2) + "." + G(r.getUTCMilliseconds(), 3);
    return n += "+00:00", t && (n += " BC"), n;
  }
  __name(Ja, "Ja");
  a(Ja, "dateToStringUTC");
  function Xa(r, e, t) {
    return r = typeof r == "string" ? { text: r } : r, e && (typeof e == "function" ? r.callback = e : r.values = e), t && (r.callback = t), r;
  }
  __name(Xa, "Xa");
  a(Xa, "normalizeQueryConfig");
  var rr = a(function(r) {
    return Va.createHash("md5").update(r, "utf-8").digest("hex");
  }, "md5"), eu = a(function(r, e, t) {
    var n = rr(e + r), i = rr(y.concat([y.from(n), t]));
    return "md5" + i;
  }, "postgresMd5PasswordHash");
  Ui.exports = { prepareValue: a(function(e) {
    return pt(
      e
    );
  }, "prepareValueWrapper"), normalizeQueryConfig: Xa, postgresMd5PasswordHash: eu, md5: rr };
});
var ji = I((el, Qi) => {
  "use strict";
  p();
  var nr = (Ht(), O(Wt));
  function tu(r) {
    if (r.indexOf(
      "SCRAM-SHA-256"
    ) === -1) throw new Error("SASL: Only mechanism SCRAM-SHA-256 is currently supported");
    let e = nr.randomBytes(18).toString("base64");
    return { mechanism: "SCRAM-SHA-256", clientNonce: e, response: "n,,n=*,r=" + e, message: "SASLInitialResponse" };
  }
  __name(tu, "tu");
  a(tu, "startSession");
  function ru(r, e, t) {
    if (r.message !== "SASLInitialResponse") throw new Error(
      "SASL: Last message was not SASLInitialResponse"
    );
    if (typeof e != "string") throw new Error(
      "SASL: SCRAM-SERVER-FIRST-MESSAGE: client password must be a string"
    );
    if (typeof t != "string") throw new Error("SASL: SCRAM-SERVER-FIRST-MESSAGE: serverData must be a string");
    let n = su(t);
    if (n.nonce.startsWith(r.clientNonce)) {
      if (n.nonce.length === r.clientNonce.length) throw new Error("SASL: SCRAM-SERVER-FIRST-MESSAGE: server nonce is too short");
    } else throw new Error("SASL: SCRAM-SERVER-FIRST-MESSAGE: server nonce does not start with client nonce");
    var i = y.from(n.salt, "base64"), s = uu(
      e,
      i,
      n.iteration
    ), o = De(s, "Client Key"), u = au(o), c = "n=*,r=" + r.clientNonce, h = "r=" + n.nonce + ",s=" + n.salt + ",i=" + n.iteration, l = "c=biws,r=" + n.nonce, d = c + "," + h + "," + l, b = De(u, d), C = qi(
      o,
      b
    ), B = C.toString("base64"), Q = De(s, "Server Key"), X = De(Q, d);
    r.message = "SASLResponse", r.serverSignature = X.toString("base64"), r.response = l + ",p=" + B;
  }
  __name(ru, "ru");
  a(ru, "continueSession");
  function nu(r, e) {
    if (r.message !== "SASLResponse") throw new Error("SASL: Last message was not SASLResponse");
    if (typeof e != "string") throw new Error("SASL: SCRAM-SERVER-FINAL-MESSAGE: serverData must be a string");
    let { serverSignature: t } = ou(
      e
    );
    if (t !== r.serverSignature) throw new Error("SASL: SCRAM-SERVER-FINAL-MESSAGE: server signature does not match");
  }
  __name(nu, "nu");
  a(nu, "finalizeSession");
  function iu(r) {
    if (typeof r != "string") throw new TypeError("SASL: text must be a string");
    return r.split("").map(
      (e, t) => r.charCodeAt(t)
    ).every((e) => e >= 33 && e <= 43 || e >= 45 && e <= 126);
  }
  __name(iu, "iu");
  a(iu, "isPrintableChars");
  function Oi(r) {
    return /^(?:[a-zA-Z0-9+/]{4})*(?:[a-zA-Z0-9+/]{2}==|[a-zA-Z0-9+/]{3}=)?$/.test(r);
  }
  __name(Oi, "Oi");
  a(Oi, "isBase64");
  function Ni(r) {
    if (typeof r != "string") throw new TypeError(
      "SASL: attribute pairs text must be a string"
    );
    return new Map(r.split(",").map((e) => {
      if (!/^.=/.test(e)) throw new Error("SASL: Invalid attribute pair entry");
      let t = e[0], n = e.substring(2);
      return [t, n];
    }));
  }
  __name(Ni, "Ni");
  a(Ni, "parseAttributePairs");
  function su(r) {
    let e = Ni(
      r
    ), t = e.get("r");
    if (t) {
      if (!iu(t)) throw new Error("SASL: SCRAM-SERVER-FIRST-MESSAGE: nonce must only contain printable characters");
    } else throw new Error("SASL: SCRAM-SERVER-FIRST-MESSAGE: nonce missing");
    let n = e.get("s");
    if (n) {
      if (!Oi(n)) throw new Error(
        "SASL: SCRAM-SERVER-FIRST-MESSAGE: salt must be base64"
      );
    } else throw new Error("SASL: SCRAM-SERVER-FIRST-MESSAGE: salt missing");
    let i = e.get("i");
    if (i) {
      if (!/^[1-9][0-9]*$/.test(i)) throw new Error("SASL: SCRAM-SERVER-FIRST-MESSAGE: invalid iteration count");
    } else throw new Error("SASL: SCRAM-SERVER-FIRST-MESSAGE: iteration missing");
    let s = parseInt(i, 10);
    return { nonce: t, salt: n, iteration: s };
  }
  __name(su, "su");
  a(su, "parseServerFirstMessage");
  function ou(r) {
    let t = Ni(r).get("v");
    if (t) {
      if (!Oi(t)) throw new Error("SASL: SCRAM-SERVER-FINAL-MESSAGE: server signature must be base64");
    } else throw new Error(
      "SASL: SCRAM-SERVER-FINAL-MESSAGE: server signature is missing"
    );
    return { serverSignature: t };
  }
  __name(ou, "ou");
  a(ou, "parseServerFinalMessage");
  function qi(r, e) {
    if (!y.isBuffer(r)) throw new TypeError(
      "first argument must be a Buffer"
    );
    if (!y.isBuffer(e)) throw new TypeError("second argument must be a Buffer");
    if (r.length !== e.length) throw new Error("Buffer lengths must match");
    if (r.length === 0) throw new Error("Buffers cannot be empty");
    return y.from(r.map((t, n) => r[n] ^ e[n]));
  }
  __name(qi, "qi");
  a(qi, "xorBuffers");
  function au(r) {
    return nr.createHash(
      "sha256"
    ).update(r).digest();
  }
  __name(au, "au");
  a(au, "sha256");
  function De(r, e) {
    return nr.createHmac(
      "sha256",
      r
    ).update(e).digest();
  }
  __name(De, "De");
  a(De, "hmacSha256");
  function uu(r, e, t) {
    for (var n = De(
      r,
      y.concat([e, y.from([0, 0, 0, 1])])
    ), i = n, s = 0; s < t - 1; s++) n = De(r, n), i = qi(i, n);
    return i;
  }
  __name(uu, "uu");
  a(uu, "Hi");
  Qi.exports = { startSession: tu, continueSession: ru, finalizeSession: nu };
});
var ir = {};
se(ir, { join: /* @__PURE__ */ __name(() => cu, "join") });
function cu(...r) {
  return r.join("/");
}
__name(cu, "cu");
var sr = z(() => {
  "use strict";
  p();
  a(cu, "join");
});
var or = {};
se(or, { stat: /* @__PURE__ */ __name(() => hu, "stat") });
function hu(r, e) {
  e(new Error("No filesystem"));
}
__name(hu, "hu");
var ar = z(
  () => {
    "use strict";
    p();
    a(hu, "stat");
  }
);
var ur = {};
se(ur, { default: /* @__PURE__ */ __name(() => lu, "default") });
var lu;
var cr = z(() => {
  "use strict";
  p();
  lu = {};
});
var Wi = {};
se(Wi, { StringDecoder: /* @__PURE__ */ __name(() => hr, "StringDecoder") });
var lr;
var hr;
var Hi = z(() => {
  "use strict";
  p();
  lr = class lr {
    static {
      __name(this, "lr");
    }
    constructor(e) {
      _(this, "td");
      this.td = new TextDecoder(e);
    }
    write(e) {
      return this.td.decode(e, { stream: true });
    }
    end(e) {
      return this.td.decode(e);
    }
  };
  a(lr, "StringDecoder");
  hr = lr;
});
var Ki = I((hl, Vi) => {
  "use strict";
  p();
  var { Transform: fu } = (cr(), O(ur)), { StringDecoder: pu } = (Hi(), O(Wi)), we = /* @__PURE__ */ Symbol("last"), dt = /* @__PURE__ */ Symbol("decoder");
  function du(r, e, t) {
    let n;
    if (this.overflow) {
      if (n = this[dt].write(r).split(this.matcher), n.length === 1) return t();
      n.shift(), this.overflow = false;
    } else this[we] += this[dt].write(r), n = this[we].split(this.matcher);
    this[we] = n.pop();
    for (let i = 0; i < n.length; i++) try {
      $i(this, this.mapper(n[i]));
    } catch (s) {
      return t(
        s
      );
    }
    if (this.overflow = this[we].length > this.maxLength, this.overflow && !this.skipOverflow) {
      t(new Error("maximum buffer reached"));
      return;
    }
    t();
  }
  __name(du, "du");
  a(du, "transform");
  function yu(r) {
    if (this[we] += this[dt].end(), this[we]) try {
      $i(this, this.mapper(this[we]));
    } catch (e) {
      return r(e);
    }
    r();
  }
  __name(yu, "yu");
  a(yu, "flush");
  function $i(r, e) {
    e !== void 0 && r.push(e);
  }
  __name($i, "$i");
  a($i, "push");
  function Gi(r) {
    return r;
  }
  __name(Gi, "Gi");
  a(Gi, "noop");
  function mu(r, e, t) {
    switch (r = r || /\r?\n/, e = e || Gi, t = t || {}, arguments.length) {
      case 1:
        typeof r == "function" ? (e = r, r = /\r?\n/) : typeof r == "object" && !(r instanceof RegExp) && !r[Symbol.split] && (t = r, r = /\r?\n/);
        break;
      case 2:
        typeof r == "function" ? (t = e, e = r, r = /\r?\n/) : typeof e == "object" && (t = e, e = Gi);
    }
    t = Object.assign({}, t), t.autoDestroy = true, t.transform = du, t.flush = yu, t.readableObjectMode = true;
    let n = new fu(t);
    return n[we] = "", n[dt] = new pu("utf8"), n.matcher = r, n.mapper = e, n.maxLength = t.maxLength, n.skipOverflow = t.skipOverflow || false, n.overflow = false, n._destroy = function(i, s) {
      this._writableState.errorEmitted = false, s(i);
    }, n;
  }
  __name(mu, "mu");
  a(mu, "split");
  Vi.exports = mu;
});
var Zi = I((pl, fe) => {
  "use strict";
  p();
  var zi = (sr(), O(ir)), gu = (cr(), O(ur)).Stream, wu = Ki(), Yi = (Ge(), O(He)), bu = 5432, yt = m.platform === "win32", rt = m.stderr, Su = 56, xu = 7, Eu = 61440, vu = 32768;
  function _u(r) {
    return (r & Eu) == vu;
  }
  __name(_u, "_u");
  a(_u, "isRegFile");
  var ke = [
    "host",
    "port",
    "database",
    "user",
    "password"
  ], fr = ke.length, Au = ke[fr - 1];
  function pr() {
    var r = rt instanceof gu && rt.writable === true;
    if (r) {
      var e = Array.prototype.slice.call(arguments).concat(`
`);
      rt.write(Yi.format.apply(Yi, e));
    }
  }
  __name(pr, "pr");
  a(pr, "warn");
  Object.defineProperty(
    fe.exports,
    "isWin",
    { get: a(function() {
      return yt;
    }, "get"), set: a(function(r) {
      yt = r;
    }, "set") }
  );
  fe.exports.warnTo = function(r) {
    var e = rt;
    return rt = r, e;
  };
  fe.exports.getFileName = function(r) {
    var e = r || m.env, t = e.PGPASSFILE || (yt ? zi.join(e.APPDATA || "./", "postgresql", "pgpass.conf") : zi.join(e.HOME || "./", ".pgpass"));
    return t;
  };
  fe.exports.usePgPass = function(r, e) {
    return Object.prototype.hasOwnProperty.call(m.env, "PGPASSWORD") ? false : yt ? true : (e = e || "<unkn>", _u(r.mode) ? r.mode & (Su | xu) ? (pr('WARNING: password file "%s" has group or world access; permissions should be u=rw (0600) or less', e), false) : true : (pr('WARNING: password file "%s" is not a plain file', e), false));
  };
  var Cu = fe.exports.match = function(r, e) {
    return ke.slice(0, -1).reduce(function(t, n, i) {
      return i == 1 && Number(r[n] || bu) === Number(
        e[n]
      ) ? t && true : t && (e[n] === "*" || e[n] === r[n]);
    }, true);
  };
  fe.exports.getPassword = function(r, e, t) {
    var n, i = e.pipe(wu());
    function s(c) {
      var h = Tu(c);
      h && Iu(h) && Cu(r, h) && (n = h[Au], i.end());
    }
    __name(s, "s");
    a(s, "onLine");
    var o = a(function() {
      e.destroy(), t(n);
    }, "onEnd"), u = a(function(c) {
      e.destroy(), pr("WARNING: error on reading file: %s", c), t(void 0);
    }, "onErr");
    e.on("error", u), i.on("data", s).on("end", o).on("error", u);
  };
  var Tu = fe.exports.parseLine = function(r) {
    if (r.length < 11 || r.match(/^\s+#/)) return null;
    for (var e = "", t = "", n = 0, i = 0, s = 0, o = {}, u = false, c = a(function(l, d, b) {
      var C = r.substring(d, b);
      Object.hasOwnProperty.call(
        m.env,
        "PGPASS_NO_DEESCAPE"
      ) || (C = C.replace(/\\([:\\])/g, "$1")), o[ke[l]] = C;
    }, "addToObj"), h = 0; h < r.length - 1; h += 1) {
      if (e = r.charAt(h + 1), t = r.charAt(h), u = n == fr - 1, u) {
        c(n, i);
        break;
      }
      h >= 0 && e == ":" && t !== "\\" && (c(n, i, h + 1), i = h + 2, n += 1);
    }
    return o = Object.keys(o).length === fr ? o : null, o;
  }, Iu = fe.exports.isValidEntry = function(r) {
    for (var e = { 0: function(o) {
      return o.length > 0;
    }, 1: function(o) {
      return o === "*" ? true : (o = Number(o), isFinite(o) && o > 0 && o < 9007199254740992 && Math.floor(o) === o);
    }, 2: function(o) {
      return o.length > 0;
    }, 3: function(o) {
      return o.length > 0;
    }, 4: function(o) {
      return o.length > 0;
    } }, t = 0; t < ke.length; t += 1) {
      var n = e[t], i = r[ke[t]] || "", s = n(i);
      if (!s) return false;
    }
    return true;
  };
});
var Xi = I((gl, dr) => {
  "use strict";
  p();
  var ml = (sr(), O(ir)), Ji = (ar(), O(or)), mt = Zi();
  dr.exports = function(r, e) {
    var t = mt.getFileName();
    Ji.stat(t, function(n, i) {
      if (n || !mt.usePgPass(i, t)) return e(void 0);
      var s = Ji.createReadStream(t);
      mt.getPassword(
        r,
        s,
        e
      );
    });
  };
  dr.exports.warnTo = mt.warnTo;
});
var wt = I((bl, es) => {
  "use strict";
  p();
  var Pu = Xe();
  function gt(r) {
    this._types = r || Pu, this.text = {}, this.binary = {};
  }
  __name(gt, "gt");
  a(gt, "TypeOverrides");
  gt.prototype.getOverrides = function(r) {
    switch (r) {
      case "text":
        return this.text;
      case "binary":
        return this.binary;
      default:
        return {};
    }
  };
  gt.prototype.setTypeParser = function(r, e, t) {
    typeof e == "function" && (t = e, e = "text"), this.getOverrides(e)[r] = t;
  };
  gt.prototype.getTypeParser = function(r, e) {
    return e = e || "text", this.getOverrides(e)[r] || this._types.getTypeParser(r, e);
  };
  es.exports = gt;
});
var ts = {};
se(ts, { default: /* @__PURE__ */ __name(() => Bu, "default") });
var Bu;
var rs = z(() => {
  "use strict";
  p();
  Bu = {};
});
var ns = {};
se(ns, { parse: /* @__PURE__ */ __name(() => yr, "parse") });
function yr(r, e = false) {
  let { protocol: t } = new URL(r), n = "http:" + r.substring(t.length), {
    username: i,
    password: s,
    host: o,
    hostname: u,
    port: c,
    pathname: h,
    search: l,
    searchParams: d,
    hash: b
  } = new URL(n);
  s = decodeURIComponent(s), i = decodeURIComponent(
    i
  ), h = decodeURIComponent(h);
  let C = i + ":" + s, B = e ? Object.fromEntries(d.entries()) : l;
  return {
    href: r,
    protocol: t,
    auth: C,
    username: i,
    password: s,
    host: o,
    hostname: u,
    port: c,
    pathname: h,
    search: l,
    query: B,
    hash: b
  };
}
__name(yr, "yr");
var mr = z(() => {
  "use strict";
  p();
  a(yr, "parse");
});
var ss = I((Al, is) => {
  "use strict";
  p();
  var Lu = (mr(), O(ns)), gr = (ar(), O(or));
  function wr(r) {
    if (r.charAt(0) === "/") {
      var t = r.split(" ");
      return { host: t[0], database: t[1] };
    }
    var e = Lu.parse(/ |%[^a-f0-9]|%[a-f0-9][^a-f0-9]/i.test(r) ? encodeURI(r).replace(
      /\%25(\d\d)/g,
      "%$1"
    ) : r, true), t = e.query;
    for (var n in t) Array.isArray(t[n]) && (t[n] = t[n][t[n].length - 1]);
    var i = (e.auth || ":").split(":");
    if (t.user = i[0], t.password = i.splice(1).join(":"), t.port = e.port, e.protocol == "socket:") return t.host = decodeURI(e.pathname), t.database = e.query.db, t.client_encoding = e.query.encoding, t;
    t.host || (t.host = e.hostname);
    var s = e.pathname;
    if (!t.host && s && /^%2f/i.test(s)) {
      var o = s.split("/");
      t.host = decodeURIComponent(
        o[0]
      ), s = o.splice(1).join("/");
    }
    switch (s && s.charAt(0) === "/" && (s = s.slice(1) || null), t.database = s && decodeURI(s), (t.ssl === "true" || t.ssl === "1") && (t.ssl = true), t.ssl === "0" && (t.ssl = false), (t.sslcert || t.sslkey || t.sslrootcert || t.sslmode) && (t.ssl = {}), t.sslcert && (t.ssl.cert = gr.readFileSync(t.sslcert).toString()), t.sslkey && (t.ssl.key = gr.readFileSync(
      t.sslkey
    ).toString()), t.sslrootcert && (t.ssl.ca = gr.readFileSync(t.sslrootcert).toString()), t.sslmode) {
      case "disable": {
        t.ssl = false;
        break;
      }
      case "prefer":
      case "require":
      case "verify-ca":
      case "verify-full":
        break;
      case "no-verify": {
        t.ssl.rejectUnauthorized = false;
        break;
      }
    }
    return t;
  }
  __name(wr, "wr");
  a(wr, "parse");
  is.exports = wr;
  wr.parse = wr;
});
var bt = I((Il, us) => {
  "use strict";
  p();
  var Ru = (rs(), O(ts)), as = et(), os = ss().parse, V = a(
    function(r, e, t) {
      return t === void 0 ? t = m.env["PG" + r.toUpperCase()] : t === false || (t = m.env[t]), e[r] || t || as[r];
    },
    "val"
  ), Fu = a(function() {
    switch (m.env.PGSSLMODE) {
      case "disable":
        return false;
      case "prefer":
      case "require":
      case "verify-ca":
      case "verify-full":
        return true;
      case "no-verify":
        return { rejectUnauthorized: false };
    }
    return as.ssl;
  }, "readSSLConfigFromEnvironment"), Ue = a(
    function(r) {
      return "'" + ("" + r).replace(/\\/g, "\\\\").replace(/'/g, "\\'") + "'";
    },
    "quoteParamValue"
  ), ie = a(function(r, e, t) {
    var n = e[t];
    n != null && r.push(t + "=" + Ue(n));
  }, "add"), Sr = class Sr {
    static {
      __name(this, "Sr");
    }
    constructor(e) {
      e = typeof e == "string" ? os(e) : e || {}, e.connectionString && (e = Object.assign({}, e, os(e.connectionString))), this.user = V("user", e), this.database = V("database", e), this.database === void 0 && (this.database = this.user), this.port = parseInt(
        V("port", e),
        10
      ), this.host = V("host", e), Object.defineProperty(this, "password", {
        configurable: true,
        enumerable: false,
        writable: true,
        value: V("password", e)
      }), this.binary = V("binary", e), this.options = V("options", e), this.ssl = typeof e.ssl > "u" ? Fu() : e.ssl, typeof this.ssl == "string" && this.ssl === "true" && (this.ssl = true), this.ssl === "no-verify" && (this.ssl = { rejectUnauthorized: false }), this.ssl && this.ssl.key && Object.defineProperty(this.ssl, "key", { enumerable: false }), this.client_encoding = V("client_encoding", e), this.replication = V("replication", e), this.isDomainSocket = !(this.host || "").indexOf("/"), this.application_name = V("application_name", e, "PGAPPNAME"), this.fallback_application_name = V("fallback_application_name", e, false), this.statement_timeout = V("statement_timeout", e, false), this.lock_timeout = V(
        "lock_timeout",
        e,
        false
      ), this.idle_in_transaction_session_timeout = V("idle_in_transaction_session_timeout", e, false), this.query_timeout = V("query_timeout", e, false), e.connectionTimeoutMillis === void 0 ? this.connect_timeout = m.env.PGCONNECT_TIMEOUT || 0 : this.connect_timeout = Math.floor(e.connectionTimeoutMillis / 1e3), e.keepAlive === false ? this.keepalives = 0 : e.keepAlive === true && (this.keepalives = 1), typeof e.keepAliveInitialDelayMillis == "number" && (this.keepalives_idle = Math.floor(e.keepAliveInitialDelayMillis / 1e3));
    }
    getLibpqConnectionString(e) {
      var t = [];
      ie(t, this, "user"), ie(t, this, "password"), ie(t, this, "port"), ie(t, this, "application_name"), ie(t, this, "fallback_application_name"), ie(t, this, "connect_timeout"), ie(
        t,
        this,
        "options"
      );
      var n = typeof this.ssl == "object" ? this.ssl : this.ssl ? { sslmode: this.ssl } : {};
      if (ie(t, n, "sslmode"), ie(t, n, "sslca"), ie(t, n, "sslkey"), ie(t, n, "sslcert"), ie(t, n, "sslrootcert"), this.database && t.push("dbname=" + Ue(this.database)), this.replication && t.push("replication=" + Ue(this.replication)), this.host && t.push("host=" + Ue(this.host)), this.isDomainSocket) return e(null, t.join(" "));
      this.client_encoding && t.push("client_encoding=" + Ue(this.client_encoding)), Ru.lookup(this.host, function(i, s) {
        return i ? e(i, null) : (t.push("hostaddr=" + Ue(s)), e(null, t.join(" ")));
      });
    }
  };
  a(Sr, "ConnectionParameters");
  var br = Sr;
  us.exports = br;
});
var ls = I((Ll, hs) => {
  "use strict";
  p();
  var Mu = Xe(), cs = /^([A-Za-z]+)(?: (\d+))?(?: (\d+))?/, Er = class Er {
    static {
      __name(this, "Er");
    }
    constructor(e, t) {
      this.command = null, this.rowCount = null, this.oid = null, this.rows = [], this.fields = [], this._parsers = void 0, this._types = t, this.RowCtor = null, this.rowAsArray = e === "array", this.rowAsArray && (this.parseRow = this._parseRowAsArray);
    }
    addCommandComplete(e) {
      var t;
      e.text ? t = cs.exec(e.text) : t = cs.exec(e.command), t && (this.command = t[1], t[3] ? (this.oid = parseInt(t[2], 10), this.rowCount = parseInt(t[3], 10)) : t[2] && (this.rowCount = parseInt(
        t[2],
        10
      )));
    }
    _parseRowAsArray(e) {
      for (var t = new Array(e.length), n = 0, i = e.length; n < i; n++) {
        var s = e[n];
        s !== null ? t[n] = this._parsers[n](s) : t[n] = null;
      }
      return t;
    }
    parseRow(e) {
      for (var t = {}, n = 0, i = e.length; n < i; n++) {
        var s = e[n], o = this.fields[n].name;
        s !== null ? t[o] = this._parsers[n](
          s
        ) : t[o] = null;
      }
      return t;
    }
    addRow(e) {
      this.rows.push(e);
    }
    addFields(e) {
      this.fields = e, this.fields.length && (this._parsers = new Array(e.length));
      for (var t = 0; t < e.length; t++) {
        var n = e[t];
        this._types ? this._parsers[t] = this._types.getTypeParser(n.dataTypeID, n.format || "text") : this._parsers[t] = Mu.getTypeParser(n.dataTypeID, n.format || "text");
      }
    }
  };
  a(Er, "Result");
  var xr = Er;
  hs.exports = xr;
});
var ys = I((Ml, ds) => {
  "use strict";
  p();
  var { EventEmitter: Du } = ge(), fs = ls(), ps = tt(), _r = class _r extends Du {
    static {
      __name(this, "_r");
    }
    constructor(e, t, n) {
      super(), e = ps.normalizeQueryConfig(e, t, n), this.text = e.text, this.values = e.values, this.rows = e.rows, this.types = e.types, this.name = e.name, this.binary = e.binary, this.portal = e.portal || "", this.callback = e.callback, this._rowMode = e.rowMode, m.domain && e.callback && (this.callback = m.domain.bind(e.callback)), this._result = new fs(this._rowMode, this.types), this._results = this._result, this.isPreparedStatement = false, this._canceledDueToError = false, this._promise = null;
    }
    requiresPreparation() {
      return this.name || this.rows ? true : !this.text || !this.values ? false : this.values.length > 0;
    }
    _checkForMultirow() {
      this._result.command && (Array.isArray(this._results) || (this._results = [this._result]), this._result = new fs(
        this._rowMode,
        this.types
      ), this._results.push(this._result));
    }
    handleRowDescription(e) {
      this._checkForMultirow(), this._result.addFields(e.fields), this._accumulateRows = this.callback || !this.listeners("row").length;
    }
    handleDataRow(e) {
      let t;
      if (!this._canceledDueToError) {
        try {
          t = this._result.parseRow(e.fields);
        } catch (n) {
          this._canceledDueToError = n;
          return;
        }
        this.emit("row", t, this._result), this._accumulateRows && this._result.addRow(t);
      }
    }
    handleCommandComplete(e, t) {
      this._checkForMultirow(), this._result.addCommandComplete(e), this.rows && t.sync();
    }
    handleEmptyQuery(e) {
      this.rows && e.sync();
    }
    handleError(e, t) {
      if (this._canceledDueToError && (e = this._canceledDueToError, this._canceledDueToError = false), this.callback) return this.callback(e);
      this.emit("error", e);
    }
    handleReadyForQuery(e) {
      if (this._canceledDueToError) return this.handleError(
        this._canceledDueToError,
        e
      );
      if (this.callback) try {
        this.callback(null, this._results);
      } catch (t) {
        m.nextTick(() => {
          throw t;
        });
      }
      this.emit("end", this._results);
    }
    submit(e) {
      if (typeof this.text != "string" && typeof this.name != "string") return new Error("A query must have either text or a name. Supplying neither is unsupported.");
      let t = e.parsedStatements[this.name];
      return this.text && t && this.text !== t ? new Error(`Prepared statements must be unique - '${this.name}' was used for a different statement`) : this.values && !Array.isArray(this.values) ? new Error("Query values must be an array") : (this.requiresPreparation() ? this.prepare(e) : e.query(this.text), null);
    }
    hasBeenParsed(e) {
      return this.name && e.parsedStatements[this.name];
    }
    handlePortalSuspended(e) {
      this._getRows(e, this.rows);
    }
    _getRows(e, t) {
      e.execute(
        { portal: this.portal, rows: t }
      ), t ? e.flush() : e.sync();
    }
    prepare(e) {
      this.isPreparedStatement = true, this.hasBeenParsed(e) || e.parse({ text: this.text, name: this.name, types: this.types });
      try {
        e.bind({ portal: this.portal, statement: this.name, values: this.values, binary: this.binary, valueMapper: ps.prepareValue });
      } catch (t) {
        this.handleError(t, e);
        return;
      }
      e.describe(
        { type: "P", name: this.portal || "" }
      ), this._getRows(e, this.rows);
    }
    handleCopyInResponse(e) {
      e.sendCopyFail("No source stream defined");
    }
    handleCopyData(e, t) {
    }
  };
  a(_r, "Query");
  var vr = _r;
  ds.exports = vr;
});
var ws = {};
se(ws, { Socket: /* @__PURE__ */ __name(() => _e, "Socket"), isIP: /* @__PURE__ */ __name(() => ku, "isIP") });
function ku(r) {
  return 0;
}
__name(ku, "ku");
var gs;
var ms;
var v;
var _e;
var St = z(() => {
  "use strict";
  p();
  gs = Te(ge(), 1);
  a(ku, "isIP");
  ms = /^[^.]+\./, v = class v2 extends gs.EventEmitter {
    static {
      __name(this, "v");
    }
    constructor() {
      super(...arguments);
      _(this, "opts", {});
      _(this, "connecting", false);
      _(this, "pending", true);
      _(this, "writable", true);
      _(this, "encrypted", false);
      _(this, "authorized", false);
      _(this, "destroyed", false);
      _(this, "ws", null);
      _(this, "writeBuffer");
      _(this, "tlsState", 0);
      _(
        this,
        "tlsRead"
      );
      _(this, "tlsWrite");
    }
    static get poolQueryViaFetch() {
      return v2.opts.poolQueryViaFetch ?? v2.defaults.poolQueryViaFetch;
    }
    static set poolQueryViaFetch(t) {
      v2.opts.poolQueryViaFetch = t;
    }
    static get fetchEndpoint() {
      return v2.opts.fetchEndpoint ?? v2.defaults.fetchEndpoint;
    }
    static set fetchEndpoint(t) {
      v2.opts.fetchEndpoint = t;
    }
    static get fetchConnectionCache() {
      return true;
    }
    static set fetchConnectionCache(t) {
      console.warn("The `fetchConnectionCache` option is deprecated (now always `true`)");
    }
    static get fetchFunction() {
      return v2.opts.fetchFunction ?? v2.defaults.fetchFunction;
    }
    static set fetchFunction(t) {
      v2.opts.fetchFunction = t;
    }
    static get webSocketConstructor() {
      return v2.opts.webSocketConstructor ?? v2.defaults.webSocketConstructor;
    }
    static set webSocketConstructor(t) {
      v2.opts.webSocketConstructor = t;
    }
    get webSocketConstructor() {
      return this.opts.webSocketConstructor ?? v2.webSocketConstructor;
    }
    set webSocketConstructor(t) {
      this.opts.webSocketConstructor = t;
    }
    static get wsProxy() {
      return v2.opts.wsProxy ?? v2.defaults.wsProxy;
    }
    static set wsProxy(t) {
      v2.opts.wsProxy = t;
    }
    get wsProxy() {
      return this.opts.wsProxy ?? v2.wsProxy;
    }
    set wsProxy(t) {
      this.opts.wsProxy = t;
    }
    static get coalesceWrites() {
      return v2.opts.coalesceWrites ?? v2.defaults.coalesceWrites;
    }
    static set coalesceWrites(t) {
      v2.opts.coalesceWrites = t;
    }
    get coalesceWrites() {
      return this.opts.coalesceWrites ?? v2.coalesceWrites;
    }
    set coalesceWrites(t) {
      this.opts.coalesceWrites = t;
    }
    static get useSecureWebSocket() {
      return v2.opts.useSecureWebSocket ?? v2.defaults.useSecureWebSocket;
    }
    static set useSecureWebSocket(t) {
      v2.opts.useSecureWebSocket = t;
    }
    get useSecureWebSocket() {
      return this.opts.useSecureWebSocket ?? v2.useSecureWebSocket;
    }
    set useSecureWebSocket(t) {
      this.opts.useSecureWebSocket = t;
    }
    static get forceDisablePgSSL() {
      return v2.opts.forceDisablePgSSL ?? v2.defaults.forceDisablePgSSL;
    }
    static set forceDisablePgSSL(t) {
      v2.opts.forceDisablePgSSL = t;
    }
    get forceDisablePgSSL() {
      return this.opts.forceDisablePgSSL ?? v2.forceDisablePgSSL;
    }
    set forceDisablePgSSL(t) {
      this.opts.forceDisablePgSSL = t;
    }
    static get disableSNI() {
      return v2.opts.disableSNI ?? v2.defaults.disableSNI;
    }
    static set disableSNI(t) {
      v2.opts.disableSNI = t;
    }
    get disableSNI() {
      return this.opts.disableSNI ?? v2.disableSNI;
    }
    set disableSNI(t) {
      this.opts.disableSNI = t;
    }
    static get pipelineConnect() {
      return v2.opts.pipelineConnect ?? v2.defaults.pipelineConnect;
    }
    static set pipelineConnect(t) {
      v2.opts.pipelineConnect = t;
    }
    get pipelineConnect() {
      return this.opts.pipelineConnect ?? v2.pipelineConnect;
    }
    set pipelineConnect(t) {
      this.opts.pipelineConnect = t;
    }
    static get subtls() {
      return v2.opts.subtls ?? v2.defaults.subtls;
    }
    static set subtls(t) {
      v2.opts.subtls = t;
    }
    get subtls() {
      return this.opts.subtls ?? v2.subtls;
    }
    set subtls(t) {
      this.opts.subtls = t;
    }
    static get pipelineTLS() {
      return v2.opts.pipelineTLS ?? v2.defaults.pipelineTLS;
    }
    static set pipelineTLS(t) {
      v2.opts.pipelineTLS = t;
    }
    get pipelineTLS() {
      return this.opts.pipelineTLS ?? v2.pipelineTLS;
    }
    set pipelineTLS(t) {
      this.opts.pipelineTLS = t;
    }
    static get rootCerts() {
      return v2.opts.rootCerts ?? v2.defaults.rootCerts;
    }
    static set rootCerts(t) {
      v2.opts.rootCerts = t;
    }
    get rootCerts() {
      return this.opts.rootCerts ?? v2.rootCerts;
    }
    set rootCerts(t) {
      this.opts.rootCerts = t;
    }
    wsProxyAddrForHost(t, n) {
      let i = this.wsProxy;
      if (i === void 0) throw new Error("No WebSocket proxy is configured. Please see https://github.com/neondatabase/serverless/blob/main/CONFIG.md#wsproxy-string--host-string-port-number--string--string");
      return typeof i == "function" ? i(t, n) : `${i}?address=${t}:${n}`;
    }
    setNoDelay() {
      return this;
    }
    setKeepAlive() {
      return this;
    }
    ref() {
      return this;
    }
    unref() {
      return this;
    }
    connect(t, n, i) {
      this.connecting = true, i && this.once("connect", i);
      let s = a(() => {
        this.connecting = false, this.pending = false, this.emit("connect"), this.emit("ready");
      }, "handleWebSocketOpen"), o = a((c, h = false) => {
        c.binaryType = "arraybuffer", c.addEventListener("error", (l) => {
          this.emit("error", l), this.emit("close");
        }), c.addEventListener("message", (l) => {
          if (this.tlsState === 0) {
            let d = y.from(l.data);
            this.emit(
              "data",
              d
            );
          }
        }), c.addEventListener("close", () => {
          this.emit("close");
        }), h ? s() : c.addEventListener(
          "open",
          s
        );
      }, "configureWebSocket"), u;
      try {
        u = this.wsProxyAddrForHost(n, typeof t == "string" ? parseInt(t, 10) : t);
      } catch (c) {
        this.emit("error", c), this.emit("close");
        return;
      }
      try {
        let h = (this.useSecureWebSocket ? "wss:" : "ws:") + "//" + u;
        if (this.webSocketConstructor !== void 0) this.ws = new this.webSocketConstructor(h), o(this.ws);
        else try {
          this.ws = new WebSocket(
            h
          ), o(this.ws);
        } catch {
          this.ws = new __unstable_WebSocket(h), o(this.ws);
        }
      } catch (c) {
        let l = (this.useSecureWebSocket ? "https:" : "http:") + "//" + u;
        fetch(l, { headers: { Upgrade: "websocket" } }).then((d) => {
          if (this.ws = d.webSocket, this.ws == null) throw c;
          this.ws.accept(), o(
            this.ws,
            true
          );
        }).catch((d) => {
          this.emit("error", new Error(`All attempts to open a WebSocket to connect to the database failed. Please refer to https://github.com/neondatabase/serverless/blob/main/CONFIG.md#websocketconstructor-typeof-websocket--undefined. Details: ${d.message}`)), this.emit("close");
        });
      }
    }
    async startTls(t) {
      if (this.subtls === void 0) throw new Error("For Postgres SSL connections, you must set `neonConfig.subtls` to the subtls library. See https://github.com/neondatabase/serverless/blob/main/CONFIG.md for more information.");
      this.tlsState = 1;
      let n = this.subtls.TrustedCert.fromPEM(this.rootCerts), i = new this.subtls.WebSocketReadQueue(this.ws), s = i.read.bind(
        i
      ), o = this.rawWrite.bind(this), [u, c] = await this.subtls.startTls(t, n, s, o, { useSNI: !this.disableSNI, expectPreData: this.pipelineTLS ? new Uint8Array([83]) : void 0 });
      this.tlsRead = u, this.tlsWrite = c, this.tlsState = 2, this.encrypted = true, this.authorized = true, this.emit(
        "secureConnection",
        this
      ), this.tlsReadLoop();
    }
    async tlsReadLoop() {
      for (; ; ) {
        let t = await this.tlsRead();
        if (t === void 0) break;
        {
          let n = y.from(t);
          this.emit("data", n);
        }
      }
    }
    rawWrite(t) {
      if (!this.coalesceWrites) {
        this.ws.send(t);
        return;
      }
      if (this.writeBuffer === void 0) this.writeBuffer = t, setTimeout(
        () => {
          this.ws.send(this.writeBuffer), this.writeBuffer = void 0;
        },
        0
      );
      else {
        let n = new Uint8Array(this.writeBuffer.length + t.length);
        n.set(this.writeBuffer), n.set(t, this.writeBuffer.length), this.writeBuffer = n;
      }
    }
    write(t, n = "utf8", i = (s) => {
    }) {
      return t.length === 0 ? (i(), true) : (typeof t == "string" && (t = y.from(t, n)), this.tlsState === 0 ? (this.rawWrite(t), i()) : this.tlsState === 1 ? this.once("secureConnection", () => {
        this.write(
          t,
          n,
          i
        );
      }) : (this.tlsWrite(t), i()), true);
    }
    end(t = y.alloc(0), n = "utf8", i = () => {
    }) {
      return this.write(t, n, () => {
        this.ws.close(), i();
      }), this;
    }
    destroy() {
      return this.destroyed = true, this.end();
    }
  };
  a(v, "Socket"), _(v, "defaults", {
    poolQueryViaFetch: false,
    fetchEndpoint: a((t, n, i) => {
      let s;
      return i?.jwtAuth ? s = t.replace(ms, "apiauth.") : s = t.replace(ms, "api."), "https://" + s + "/sql";
    }, "fetchEndpoint"),
    fetchConnectionCache: true,
    fetchFunction: void 0,
    webSocketConstructor: void 0,
    wsProxy: a((t) => t + "/v2", "wsProxy"),
    useSecureWebSocket: true,
    forceDisablePgSSL: true,
    coalesceWrites: true,
    pipelineConnect: "password",
    subtls: void 0,
    rootCerts: "",
    pipelineTLS: false,
    disableSNI: false
  }), _(v, "opts", {});
  _e = v;
});
var Xr = I((T) => {
  "use strict";
  p();
  Object.defineProperty(T, "__esModule", { value: true });
  T.NoticeMessage = T.DataRowMessage = T.CommandCompleteMessage = T.ReadyForQueryMessage = T.NotificationResponseMessage = T.BackendKeyDataMessage = T.AuthenticationMD5Password = T.ParameterStatusMessage = T.ParameterDescriptionMessage = T.RowDescriptionMessage = T.Field = T.CopyResponse = T.CopyDataMessage = T.DatabaseError = T.copyDone = T.emptyQuery = T.replicationStart = T.portalSuspended = T.noData = T.closeComplete = T.bindComplete = T.parseComplete = void 0;
  T.parseComplete = { name: "parseComplete", length: 5 };
  T.bindComplete = { name: "bindComplete", length: 5 };
  T.closeComplete = { name: "closeComplete", length: 5 };
  T.noData = { name: "noData", length: 5 };
  T.portalSuspended = { name: "portalSuspended", length: 5 };
  T.replicationStart = { name: "replicationStart", length: 4 };
  T.emptyQuery = { name: "emptyQuery", length: 4 };
  T.copyDone = { name: "copyDone", length: 4 };
  var Nr = class Nr extends Error {
    static {
      __name(this, "Nr");
    }
    constructor(e, t, n) {
      super(
        e
      ), this.length = t, this.name = n;
    }
  };
  a(Nr, "DatabaseError");
  var Ar = Nr;
  T.DatabaseError = Ar;
  var qr = class qr {
    static {
      __name(this, "qr");
    }
    constructor(e, t) {
      this.length = e, this.chunk = t, this.name = "copyData";
    }
  };
  a(qr, "CopyDataMessage");
  var Cr = qr;
  T.CopyDataMessage = Cr;
  var Qr = class Qr {
    static {
      __name(this, "Qr");
    }
    constructor(e, t, n, i) {
      this.length = e, this.name = t, this.binary = n, this.columnTypes = new Array(i);
    }
  };
  a(Qr, "CopyResponse");
  var Tr = Qr;
  T.CopyResponse = Tr;
  var jr = class jr {
    static {
      __name(this, "jr");
    }
    constructor(e, t, n, i, s, o, u) {
      this.name = e, this.tableID = t, this.columnID = n, this.dataTypeID = i, this.dataTypeSize = s, this.dataTypeModifier = o, this.format = u;
    }
  };
  a(jr, "Field");
  var Ir = jr;
  T.Field = Ir;
  var Wr = class Wr {
    static {
      __name(this, "Wr");
    }
    constructor(e, t) {
      this.length = e, this.fieldCount = t, this.name = "rowDescription", this.fields = new Array(
        this.fieldCount
      );
    }
  };
  a(Wr, "RowDescriptionMessage");
  var Pr = Wr;
  T.RowDescriptionMessage = Pr;
  var Hr = class Hr {
    static {
      __name(this, "Hr");
    }
    constructor(e, t) {
      this.length = e, this.parameterCount = t, this.name = "parameterDescription", this.dataTypeIDs = new Array(this.parameterCount);
    }
  };
  a(Hr, "ParameterDescriptionMessage");
  var Br = Hr;
  T.ParameterDescriptionMessage = Br;
  var Gr = class Gr {
    static {
      __name(this, "Gr");
    }
    constructor(e, t, n) {
      this.length = e, this.parameterName = t, this.parameterValue = n, this.name = "parameterStatus";
    }
  };
  a(Gr, "ParameterStatusMessage");
  var Lr = Gr;
  T.ParameterStatusMessage = Lr;
  var $r = class $r {
    static {
      __name(this, "$r");
    }
    constructor(e, t) {
      this.length = e, this.salt = t, this.name = "authenticationMD5Password";
    }
  };
  a($r, "AuthenticationMD5Password");
  var Rr = $r;
  T.AuthenticationMD5Password = Rr;
  var Vr = class Vr {
    static {
      __name(this, "Vr");
    }
    constructor(e, t, n) {
      this.length = e, this.processID = t, this.secretKey = n, this.name = "backendKeyData";
    }
  };
  a(
    Vr,
    "BackendKeyDataMessage"
  );
  var Fr = Vr;
  T.BackendKeyDataMessage = Fr;
  var Kr = class Kr {
    static {
      __name(this, "Kr");
    }
    constructor(e, t, n, i) {
      this.length = e, this.processId = t, this.channel = n, this.payload = i, this.name = "notification";
    }
  };
  a(Kr, "NotificationResponseMessage");
  var Mr = Kr;
  T.NotificationResponseMessage = Mr;
  var zr = class zr {
    static {
      __name(this, "zr");
    }
    constructor(e, t) {
      this.length = e, this.status = t, this.name = "readyForQuery";
    }
  };
  a(zr, "ReadyForQueryMessage");
  var Dr = zr;
  T.ReadyForQueryMessage = Dr;
  var Yr = class Yr {
    static {
      __name(this, "Yr");
    }
    constructor(e, t) {
      this.length = e, this.text = t, this.name = "commandComplete";
    }
  };
  a(Yr, "CommandCompleteMessage");
  var kr = Yr;
  T.CommandCompleteMessage = kr;
  var Zr = class Zr {
    static {
      __name(this, "Zr");
    }
    constructor(e, t) {
      this.length = e, this.fields = t, this.name = "dataRow", this.fieldCount = t.length;
    }
  };
  a(Zr, "DataRowMessage");
  var Ur = Zr;
  T.DataRowMessage = Ur;
  var Jr = class Jr {
    static {
      __name(this, "Jr");
    }
    constructor(e, t) {
      this.length = e, this.message = t, this.name = "notice";
    }
  };
  a(Jr, "NoticeMessage");
  var Or = Jr;
  T.NoticeMessage = Or;
});
var bs = I((xt) => {
  "use strict";
  p();
  Object.defineProperty(xt, "__esModule", { value: true });
  xt.Writer = void 0;
  var tn = class tn {
    static {
      __name(this, "tn");
    }
    constructor(e = 256) {
      this.size = e, this.offset = 5, this.headerPosition = 0, this.buffer = y.allocUnsafe(e);
    }
    ensure(e) {
      var t = this.buffer.length - this.offset;
      if (t < e) {
        var n = this.buffer, i = n.length + (n.length >> 1) + e;
        this.buffer = y.allocUnsafe(
          i
        ), n.copy(this.buffer);
      }
    }
    addInt32(e) {
      return this.ensure(4), this.buffer[this.offset++] = e >>> 24 & 255, this.buffer[this.offset++] = e >>> 16 & 255, this.buffer[this.offset++] = e >>> 8 & 255, this.buffer[this.offset++] = e >>> 0 & 255, this;
    }
    addInt16(e) {
      return this.ensure(2), this.buffer[this.offset++] = e >>> 8 & 255, this.buffer[this.offset++] = e >>> 0 & 255, this;
    }
    addCString(e) {
      if (!e) this.ensure(1);
      else {
        var t = y.byteLength(e);
        this.ensure(t + 1), this.buffer.write(
          e,
          this.offset,
          "utf-8"
        ), this.offset += t;
      }
      return this.buffer[this.offset++] = 0, this;
    }
    addString(e = "") {
      var t = y.byteLength(e);
      return this.ensure(t), this.buffer.write(e, this.offset), this.offset += t, this;
    }
    add(e) {
      return this.ensure(e.length), e.copy(this.buffer, this.offset), this.offset += e.length, this;
    }
    join(e) {
      if (e) {
        this.buffer[this.headerPosition] = e;
        let t = this.offset - (this.headerPosition + 1);
        this.buffer.writeInt32BE(t, this.headerPosition + 1);
      }
      return this.buffer.slice(e ? 0 : 5, this.offset);
    }
    flush(e) {
      var t = this.join(e);
      return this.offset = 5, this.headerPosition = 0, this.buffer = y.allocUnsafe(this.size), t;
    }
  };
  a(tn, "Writer");
  var en = tn;
  xt.Writer = en;
});
var xs = I((vt) => {
  "use strict";
  p();
  Object.defineProperty(vt, "__esModule", { value: true });
  vt.serialize = void 0;
  var rn = bs(), M = new rn.Writer(), Uu = a((r) => {
    M.addInt16(3).addInt16(
      0
    );
    for (let n of Object.keys(r)) M.addCString(n).addCString(r[n]);
    M.addCString("client_encoding").addCString("UTF8");
    var e = M.addCString("").flush(), t = e.length + 4;
    return new rn.Writer().addInt32(t).add(e).flush();
  }, "startup"), Ou = a(() => {
    let r = y.allocUnsafe(8);
    return r.writeInt32BE(8, 0), r.writeInt32BE(80877103, 4), r;
  }, "requestSsl"), Nu = a((r) => M.addCString(r).flush(112), "password"), qu = a(function(r, e) {
    return M.addCString(r).addInt32(
      y.byteLength(e)
    ).addString(e), M.flush(112);
  }, "sendSASLInitialResponseMessage"), Qu = a(
    function(r) {
      return M.addString(r).flush(112);
    },
    "sendSCRAMClientFinalMessage"
  ), ju = a(
    (r) => M.addCString(r).flush(81),
    "query"
  ), Ss = [], Wu = a((r) => {
    let e = r.name || "";
    e.length > 63 && (console.error("Warning! Postgres only supports 63 characters for query names."), console.error("You supplied %s (%s)", e, e.length), console.error("This can cause conflicts and silent errors executing queries"));
    let t = r.types || Ss;
    for (var n = t.length, i = M.addCString(e).addCString(r.text).addInt16(n), s = 0; s < n; s++) i.addInt32(t[s]);
    return M.flush(80);
  }, "parse"), Oe = new rn.Writer(), Hu = a(function(r, e) {
    for (let t = 0; t < r.length; t++) {
      let n = e ? e(r[t], t) : r[t];
      n == null ? (M.addInt16(0), Oe.addInt32(-1)) : n instanceof y ? (M.addInt16(1), Oe.addInt32(n.length), Oe.add(n)) : (M.addInt16(0), Oe.addInt32(y.byteLength(
        n
      )), Oe.addString(n));
    }
  }, "writeValues"), Gu = a((r = {}) => {
    let e = r.portal || "", t = r.statement || "", n = r.binary || false, i = r.values || Ss, s = i.length;
    return M.addCString(e).addCString(t), M.addInt16(s), Hu(i, r.valueMapper), M.addInt16(s), M.add(Oe.flush()), M.addInt16(n ? 1 : 0), M.flush(66);
  }, "bind"), $u = y.from([69, 0, 0, 0, 9, 0, 0, 0, 0, 0]), Vu = a((r) => {
    if (!r || !r.portal && !r.rows) return $u;
    let e = r.portal || "", t = r.rows || 0, n = y.byteLength(e), i = 4 + n + 1 + 4, s = y.allocUnsafe(1 + i);
    return s[0] = 69, s.writeInt32BE(i, 1), s.write(e, 5, "utf-8"), s[n + 5] = 0, s.writeUInt32BE(t, s.length - 4), s;
  }, "execute"), Ku = a((r, e) => {
    let t = y.allocUnsafe(16);
    return t.writeInt32BE(16, 0), t.writeInt16BE(1234, 4), t.writeInt16BE(5678, 6), t.writeInt32BE(
      r,
      8
    ), t.writeInt32BE(e, 12), t;
  }, "cancel"), nn = a(
    (r, e) => {
      let n = 4 + y.byteLength(e) + 1, i = y.allocUnsafe(1 + n);
      return i[0] = r, i.writeInt32BE(n, 1), i.write(e, 5, "utf-8"), i[n] = 0, i;
    },
    "cstringMessage"
  ), zu = M.addCString("P").flush(68), Yu = M.addCString("S").flush(68), Zu = a((r) => r.name ? nn(68, `${r.type}${r.name || ""}`) : r.type === "P" ? zu : Yu, "describe"), Ju = a(
    (r) => {
      let e = `${r.type}${r.name || ""}`;
      return nn(67, e);
    },
    "close"
  ), Xu = a((r) => M.add(r).flush(
    100
  ), "copyData"), ec = a((r) => nn(102, r), "copyFail"), Et = a((r) => y.from([r, 0, 0, 0, 4]), "codeOnlyBuffer"), tc = Et(72), rc = Et(83), nc = Et(88), ic = Et(99), sc = {
    startup: Uu,
    password: Nu,
    requestSsl: Ou,
    sendSASLInitialResponseMessage: qu,
    sendSCRAMClientFinalMessage: Qu,
    query: ju,
    parse: Wu,
    bind: Gu,
    execute: Vu,
    describe: Zu,
    close: Ju,
    flush: a(() => tc, "flush"),
    sync: a(
      () => rc,
      "sync"
    ),
    end: a(() => nc, "end"),
    copyData: Xu,
    copyDone: a(() => ic, "copyDone"),
    copyFail: ec,
    cancel: Ku
  };
  vt.serialize = sc;
});
var Es = I((_t) => {
  "use strict";
  p();
  Object.defineProperty(_t, "__esModule", { value: true });
  _t.BufferReader = void 0;
  var oc = y.allocUnsafe(0), on = class on {
    static {
      __name(this, "on");
    }
    constructor(e = 0) {
      this.offset = e, this.buffer = oc, this.encoding = "utf-8";
    }
    setBuffer(e, t) {
      this.offset = e, this.buffer = t;
    }
    int16() {
      let e = this.buffer.readInt16BE(this.offset);
      return this.offset += 2, e;
    }
    byte() {
      let e = this.buffer[this.offset];
      return this.offset++, e;
    }
    int32() {
      let e = this.buffer.readInt32BE(this.offset);
      return this.offset += 4, e;
    }
    string(e) {
      let t = this.buffer.toString(this.encoding, this.offset, this.offset + e);
      return this.offset += e, t;
    }
    cstring() {
      let e = this.offset, t = e;
      for (; this.buffer[t++] !== 0; ) ;
      return this.offset = t, this.buffer.toString(this.encoding, e, t - 1);
    }
    bytes(e) {
      let t = this.buffer.slice(this.offset, this.offset + e);
      return this.offset += e, t;
    }
  };
  a(on, "BufferReader");
  var sn = on;
  _t.BufferReader = sn;
});
var As = I((At) => {
  "use strict";
  p();
  Object.defineProperty(At, "__esModule", { value: true });
  At.Parser = void 0;
  var D = Xr(), ac = Es(), an = 1, uc = 4, vs = an + uc, _s = y.allocUnsafe(0), cn = class cn {
    static {
      __name(this, "cn");
    }
    constructor(e) {
      if (this.buffer = _s, this.bufferLength = 0, this.bufferOffset = 0, this.reader = new ac.BufferReader(), e?.mode === "binary") throw new Error("Binary mode not supported yet");
      this.mode = e?.mode || "text";
    }
    parse(e, t) {
      this.mergeBuffer(e);
      let n = this.bufferOffset + this.bufferLength, i = this.bufferOffset;
      for (; i + vs <= n; ) {
        let s = this.buffer[i], o = this.buffer.readUInt32BE(
          i + an
        ), u = an + o;
        if (u + i <= n) {
          let c = this.handlePacket(i + vs, s, o, this.buffer);
          t(c), i += u;
        } else
          break;
      }
      i === n ? (this.buffer = _s, this.bufferLength = 0, this.bufferOffset = 0) : (this.bufferLength = n - i, this.bufferOffset = i);
    }
    mergeBuffer(e) {
      if (this.bufferLength > 0) {
        let t = this.bufferLength + e.byteLength;
        if (t + this.bufferOffset > this.buffer.byteLength) {
          let i;
          if (t <= this.buffer.byteLength && this.bufferOffset >= this.bufferLength) i = this.buffer;
          else {
            let s = this.buffer.byteLength * 2;
            for (; t >= s; ) s *= 2;
            i = y.allocUnsafe(s);
          }
          this.buffer.copy(
            i,
            0,
            this.bufferOffset,
            this.bufferOffset + this.bufferLength
          ), this.buffer = i, this.bufferOffset = 0;
        }
        e.copy(this.buffer, this.bufferOffset + this.bufferLength), this.bufferLength = t;
      } else this.buffer = e, this.bufferOffset = 0, this.bufferLength = e.byteLength;
    }
    handlePacket(e, t, n, i) {
      switch (t) {
        case 50:
          return D.bindComplete;
        case 49:
          return D.parseComplete;
        case 51:
          return D.closeComplete;
        case 110:
          return D.noData;
        case 115:
          return D.portalSuspended;
        case 99:
          return D.copyDone;
        case 87:
          return D.replicationStart;
        case 73:
          return D.emptyQuery;
        case 68:
          return this.parseDataRowMessage(
            e,
            n,
            i
          );
        case 67:
          return this.parseCommandCompleteMessage(e, n, i);
        case 90:
          return this.parseReadyForQueryMessage(e, n, i);
        case 65:
          return this.parseNotificationMessage(
            e,
            n,
            i
          );
        case 82:
          return this.parseAuthenticationResponse(e, n, i);
        case 83:
          return this.parseParameterStatusMessage(e, n, i);
        case 75:
          return this.parseBackendKeyData(e, n, i);
        case 69:
          return this.parseErrorMessage(e, n, i, "error");
        case 78:
          return this.parseErrorMessage(
            e,
            n,
            i,
            "notice"
          );
        case 84:
          return this.parseRowDescriptionMessage(e, n, i);
        case 116:
          return this.parseParameterDescriptionMessage(e, n, i);
        case 71:
          return this.parseCopyInMessage(
            e,
            n,
            i
          );
        case 72:
          return this.parseCopyOutMessage(e, n, i);
        case 100:
          return this.parseCopyData(
            e,
            n,
            i
          );
        default:
          return new D.DatabaseError("received invalid response: " + t.toString(
            16
          ), n, "error");
      }
    }
    parseReadyForQueryMessage(e, t, n) {
      this.reader.setBuffer(e, n);
      let i = this.reader.string(1);
      return new D.ReadyForQueryMessage(t, i);
    }
    parseCommandCompleteMessage(e, t, n) {
      this.reader.setBuffer(e, n);
      let i = this.reader.cstring();
      return new D.CommandCompleteMessage(
        t,
        i
      );
    }
    parseCopyData(e, t, n) {
      let i = n.slice(e, e + (t - 4));
      return new D.CopyDataMessage(
        t,
        i
      );
    }
    parseCopyInMessage(e, t, n) {
      return this.parseCopyMessage(e, t, n, "copyInResponse");
    }
    parseCopyOutMessage(e, t, n) {
      return this.parseCopyMessage(e, t, n, "copyOutResponse");
    }
    parseCopyMessage(e, t, n, i) {
      this.reader.setBuffer(e, n);
      let s = this.reader.byte() !== 0, o = this.reader.int16(), u = new D.CopyResponse(t, i, s, o);
      for (let c = 0; c < o; c++) u.columnTypes[c] = this.reader.int16();
      return u;
    }
    parseNotificationMessage(e, t, n) {
      this.reader.setBuffer(
        e,
        n
      );
      let i = this.reader.int32(), s = this.reader.cstring(), o = this.reader.cstring();
      return new D.NotificationResponseMessage(t, i, s, o);
    }
    parseRowDescriptionMessage(e, t, n) {
      this.reader.setBuffer(e, n);
      let i = this.reader.int16(), s = new D.RowDescriptionMessage(t, i);
      for (let o = 0; o < i; o++) s.fields[o] = this.parseField();
      return s;
    }
    parseField() {
      let e = this.reader.cstring(), t = this.reader.int32(), n = this.reader.int16(), i = this.reader.int32(), s = this.reader.int16(), o = this.reader.int32(), u = this.reader.int16() === 0 ? "text" : "binary";
      return new D.Field(e, t, n, i, s, o, u);
    }
    parseParameterDescriptionMessage(e, t, n) {
      this.reader.setBuffer(
        e,
        n
      );
      let i = this.reader.int16(), s = new D.ParameterDescriptionMessage(t, i);
      for (let o = 0; o < i; o++) s.dataTypeIDs[o] = this.reader.int32();
      return s;
    }
    parseDataRowMessage(e, t, n) {
      this.reader.setBuffer(e, n);
      let i = this.reader.int16(), s = new Array(i);
      for (let o = 0; o < i; o++) {
        let u = this.reader.int32();
        s[o] = u === -1 ? null : this.reader.string(u);
      }
      return new D.DataRowMessage(
        t,
        s
      );
    }
    parseParameterStatusMessage(e, t, n) {
      this.reader.setBuffer(e, n);
      let i = this.reader.cstring(), s = this.reader.cstring();
      return new D.ParameterStatusMessage(t, i, s);
    }
    parseBackendKeyData(e, t, n) {
      this.reader.setBuffer(e, n);
      let i = this.reader.int32(), s = this.reader.int32();
      return new D.BackendKeyDataMessage(t, i, s);
    }
    parseAuthenticationResponse(e, t, n) {
      this.reader.setBuffer(
        e,
        n
      );
      let i = this.reader.int32(), s = { name: "authenticationOk", length: t };
      switch (i) {
        case 0:
          break;
        case 3:
          s.length === 8 && (s.name = "authenticationCleartextPassword");
          break;
        case 5:
          if (s.length === 12) {
            s.name = "authenticationMD5Password";
            let u = this.reader.bytes(4);
            return new D.AuthenticationMD5Password(t, u);
          }
          break;
        case 10:
          s.name = "authenticationSASL", s.mechanisms = [];
          let o;
          do
            o = this.reader.cstring(), o && s.mechanisms.push(o);
          while (o);
          break;
        case 11:
          s.name = "authenticationSASLContinue", s.data = this.reader.string(t - 8);
          break;
        case 12:
          s.name = "authenticationSASLFinal", s.data = this.reader.string(t - 8);
          break;
        default:
          throw new Error("Unknown authenticationOk message type " + i);
      }
      return s;
    }
    parseErrorMessage(e, t, n, i) {
      this.reader.setBuffer(e, n);
      let s = {}, o = this.reader.string(1);
      for (; o !== "\0"; ) s[o] = this.reader.cstring(), o = this.reader.string(1);
      let u = s.M, c = i === "notice" ? new D.NoticeMessage(
        t,
        u
      ) : new D.DatabaseError(u, t, i);
      return c.severity = s.S, c.code = s.C, c.detail = s.D, c.hint = s.H, c.position = s.P, c.internalPosition = s.p, c.internalQuery = s.q, c.where = s.W, c.schema = s.s, c.table = s.t, c.column = s.c, c.dataType = s.d, c.constraint = s.n, c.file = s.F, c.line = s.L, c.routine = s.R, c;
    }
  };
  a(cn, "Parser");
  var un = cn;
  At.Parser = un;
});
var hn = I((be) => {
  "use strict";
  p();
  Object.defineProperty(be, "__esModule", { value: true });
  be.DatabaseError = be.serialize = be.parse = void 0;
  var cc = Xr();
  Object.defineProperty(
    be,
    "DatabaseError",
    { enumerable: true, get: a(function() {
      return cc.DatabaseError;
    }, "get") }
  );
  var hc = xs();
  Object.defineProperty(be, "serialize", { enumerable: true, get: a(function() {
    return hc.serialize;
  }, "get") });
  var lc = As();
  function fc(r, e) {
    let t = new lc.Parser();
    return r.on("data", (n) => t.parse(n, e)), new Promise((n) => r.on("end", () => n()));
  }
  __name(fc, "fc");
  a(fc, "parse");
  be.parse = fc;
});
var Cs = {};
se(Cs, { connect: /* @__PURE__ */ __name(() => pc, "connect") });
function pc({ socket: r, servername: e }) {
  return r.startTls(e), r;
}
__name(pc, "pc");
var Ts = z(() => {
  "use strict";
  p();
  a(pc, "connect");
});
var pn = I((of, Bs) => {
  "use strict";
  p();
  var Is = (St(), O(ws)), dc = ge().EventEmitter, {
    parse: yc,
    serialize: q
  } = hn(), Ps = q.flush(), mc = q.sync(), gc = q.end(), fn = class fn extends dc {
    static {
      __name(this, "fn");
    }
    constructor(e) {
      super(), e = e || {}, this.stream = e.stream || new Is.Socket(), this._keepAlive = e.keepAlive, this._keepAliveInitialDelayMillis = e.keepAliveInitialDelayMillis, this.lastBuffer = false, this.parsedStatements = {}, this.ssl = e.ssl || false, this._ending = false, this._emitMessage = false;
      var t = this;
      this.on("newListener", function(n) {
        n === "message" && (t._emitMessage = true);
      });
    }
    connect(e, t) {
      var n = this;
      this._connecting = true, this.stream.setNoDelay(true), this.stream.connect(
        e,
        t
      ), this.stream.once("connect", function() {
        n._keepAlive && n.stream.setKeepAlive(
          true,
          n._keepAliveInitialDelayMillis
        ), n.emit("connect");
      });
      let i = a(function(s) {
        n._ending && (s.code === "ECONNRESET" || s.code === "EPIPE") || n.emit("error", s);
      }, "reportStreamError");
      if (this.stream.on("error", i), this.stream.on("close", function() {
        n.emit("end");
      }), !this.ssl) return this.attachListeners(this.stream);
      this.stream.once("data", function(s) {
        var o = s.toString("utf8");
        switch (o) {
          case "S":
            break;
          case "N":
            return n.stream.end(), n.emit("error", new Error("The server does not support SSL connections"));
          default:
            return n.stream.end(), n.emit("error", new Error("There was an error establishing an SSL connection"));
        }
        var u = (Ts(), O(Cs));
        let c = { socket: n.stream };
        n.ssl !== true && (Object.assign(
          c,
          n.ssl
        ), "key" in n.ssl && (c.key = n.ssl.key)), Is.isIP(t) === 0 && (c.servername = t);
        try {
          n.stream = u.connect(c);
        } catch (h) {
          return n.emit("error", h);
        }
        n.attachListeners(n.stream), n.stream.on("error", i), n.emit("sslconnect");
      });
    }
    attachListeners(e) {
      e.on("end", () => {
        this.emit("end");
      }), yc(e, (t) => {
        var n = t.name === "error" ? "errorMessage" : t.name;
        this._emitMessage && this.emit("message", t), this.emit(n, t);
      });
    }
    requestSsl() {
      this.stream.write(q.requestSsl());
    }
    startup(e) {
      this.stream.write(q.startup(e));
    }
    cancel(e, t) {
      this._send(q.cancel(e, t));
    }
    password(e) {
      this._send(q.password(e));
    }
    sendSASLInitialResponseMessage(e, t) {
      this._send(q.sendSASLInitialResponseMessage(
        e,
        t
      ));
    }
    sendSCRAMClientFinalMessage(e) {
      this._send(q.sendSCRAMClientFinalMessage(e));
    }
    _send(e) {
      return this.stream.writable ? this.stream.write(e) : false;
    }
    query(e) {
      this._send(q.query(
        e
      ));
    }
    parse(e) {
      this._send(q.parse(e));
    }
    bind(e) {
      this._send(q.bind(e));
    }
    execute(e) {
      this._send(q.execute(e));
    }
    flush() {
      this.stream.writable && this.stream.write(Ps);
    }
    sync() {
      this._ending = true, this._send(Ps), this._send(mc);
    }
    ref() {
      this.stream.ref();
    }
    unref() {
      this.stream.unref();
    }
    end() {
      if (this._ending = true, !this._connecting || !this.stream.writable) {
        this.stream.end();
        return;
      }
      return this.stream.write(gc, () => {
        this.stream.end();
      });
    }
    close(e) {
      this._send(q.close(e));
    }
    describe(e) {
      this._send(q.describe(e));
    }
    sendCopyFromChunk(e) {
      this._send(q.copyData(e));
    }
    endCopyFrom() {
      this._send(q.copyDone());
    }
    sendCopyFail(e) {
      this._send(q.copyFail(e));
    }
  };
  a(fn, "Connection");
  var ln = fn;
  Bs.exports = ln;
});
var Fs = I((hf, Rs) => {
  "use strict";
  p();
  var wc = ge().EventEmitter, cf = (Ge(), O(He)), bc = tt(), dn = ji(), Sc = Xi(), xc = wt(), Ec = bt(), Ls = ys(), vc = et(), _c = pn(), yn = class yn extends wc {
    static {
      __name(this, "yn");
    }
    constructor(e) {
      super(), this.connectionParameters = new Ec(e), this.user = this.connectionParameters.user, this.database = this.connectionParameters.database, this.port = this.connectionParameters.port, this.host = this.connectionParameters.host, Object.defineProperty(this, "password", { configurable: true, enumerable: false, writable: true, value: this.connectionParameters.password }), this.replication = this.connectionParameters.replication;
      var t = e || {};
      this._Promise = t.Promise || S.Promise, this._types = new xc(t.types), this._ending = false, this._connecting = false, this._connected = false, this._connectionError = false, this._queryable = true, this.connection = t.connection || new _c({ stream: t.stream, ssl: this.connectionParameters.ssl, keepAlive: t.keepAlive || false, keepAliveInitialDelayMillis: t.keepAliveInitialDelayMillis || 0, encoding: this.connectionParameters.client_encoding || "utf8" }), this.queryQueue = [], this.binary = t.binary || vc.binary, this.processID = null, this.secretKey = null, this.ssl = this.connectionParameters.ssl || false, this.ssl && this.ssl.key && Object.defineProperty(this.ssl, "key", { enumerable: false }), this._connectionTimeoutMillis = t.connectionTimeoutMillis || 0;
    }
    _errorAllQueries(e) {
      let t = a(
        (n) => {
          m.nextTick(() => {
            n.handleError(e, this.connection);
          });
        },
        "enqueueError"
      );
      this.activeQuery && (t(this.activeQuery), this.activeQuery = null), this.queryQueue.forEach(t), this.queryQueue.length = 0;
    }
    _connect(e) {
      var t = this, n = this.connection;
      if (this._connectionCallback = e, this._connecting || this._connected) {
        let i = new Error("Client has already been connected. You cannot reuse a client.");
        m.nextTick(() => {
          e(i);
        });
        return;
      }
      this._connecting = true, this.connectionTimeoutHandle, this._connectionTimeoutMillis > 0 && (this.connectionTimeoutHandle = setTimeout(() => {
        n._ending = true, n.stream.destroy(new Error("timeout expired"));
      }, this._connectionTimeoutMillis)), this.host && this.host.indexOf("/") === 0 ? n.connect(this.host + "/.s.PGSQL." + this.port) : n.connect(this.port, this.host), n.on("connect", function() {
        t.ssl ? n.requestSsl() : n.startup(t.getStartupConf());
      }), n.on("sslconnect", function() {
        n.startup(t.getStartupConf());
      }), this._attachListeners(n), n.once("end", () => {
        let i = this._ending ? new Error("Connection terminated") : new Error("Connection terminated unexpectedly");
        clearTimeout(this.connectionTimeoutHandle), this._errorAllQueries(i), this._ending || (this._connecting && !this._connectionError ? this._connectionCallback ? this._connectionCallback(i) : this._handleErrorEvent(i) : this._connectionError || this._handleErrorEvent(
          i
        )), m.nextTick(() => {
          this.emit("end");
        });
      });
    }
    connect(e) {
      if (e) {
        this._connect(e);
        return;
      }
      return new this._Promise((t, n) => {
        this._connect((i) => {
          i ? n(i) : t();
        });
      });
    }
    _attachListeners(e) {
      e.on("authenticationCleartextPassword", this._handleAuthCleartextPassword.bind(this)), e.on("authenticationMD5Password", this._handleAuthMD5Password.bind(this)), e.on("authenticationSASL", this._handleAuthSASL.bind(this)), e.on("authenticationSASLContinue", this._handleAuthSASLContinue.bind(this)), e.on("authenticationSASLFinal", this._handleAuthSASLFinal.bind(this)), e.on("backendKeyData", this._handleBackendKeyData.bind(this)), e.on("error", this._handleErrorEvent.bind(this)), e.on(
        "errorMessage",
        this._handleErrorMessage.bind(this)
      ), e.on("readyForQuery", this._handleReadyForQuery.bind(this)), e.on("notice", this._handleNotice.bind(this)), e.on("rowDescription", this._handleRowDescription.bind(this)), e.on("dataRow", this._handleDataRow.bind(this)), e.on("portalSuspended", this._handlePortalSuspended.bind(this)), e.on(
        "emptyQuery",
        this._handleEmptyQuery.bind(this)
      ), e.on("commandComplete", this._handleCommandComplete.bind(this)), e.on("parseComplete", this._handleParseComplete.bind(this)), e.on("copyInResponse", this._handleCopyInResponse.bind(this)), e.on("copyData", this._handleCopyData.bind(this)), e.on("notification", this._handleNotification.bind(this));
    }
    _checkPgPass(e) {
      let t = this.connection;
      typeof this.password == "function" ? this._Promise.resolve().then(
        () => this.password()
      ).then((n) => {
        if (n !== void 0) {
          if (typeof n != "string") {
            t.emit("error", new TypeError("Password must be a string"));
            return;
          }
          this.connectionParameters.password = this.password = n;
        } else this.connectionParameters.password = this.password = null;
        e();
      }).catch((n) => {
        t.emit("error", n);
      }) : this.password !== null ? e() : Sc(
        this.connectionParameters,
        (n) => {
          n !== void 0 && (this.connectionParameters.password = this.password = n), e();
        }
      );
    }
    _handleAuthCleartextPassword(e) {
      this._checkPgPass(() => {
        this.connection.password(this.password);
      });
    }
    _handleAuthMD5Password(e) {
      this._checkPgPass(() => {
        let t = bc.postgresMd5PasswordHash(
          this.user,
          this.password,
          e.salt
        );
        this.connection.password(t);
      });
    }
    _handleAuthSASL(e) {
      this._checkPgPass(() => {
        this.saslSession = dn.startSession(e.mechanisms), this.connection.sendSASLInitialResponseMessage(
          this.saslSession.mechanism,
          this.saslSession.response
        );
      });
    }
    _handleAuthSASLContinue(e) {
      dn.continueSession(this.saslSession, this.password, e.data), this.connection.sendSCRAMClientFinalMessage(
        this.saslSession.response
      );
    }
    _handleAuthSASLFinal(e) {
      dn.finalizeSession(
        this.saslSession,
        e.data
      ), this.saslSession = null;
    }
    _handleBackendKeyData(e) {
      this.processID = e.processID, this.secretKey = e.secretKey;
    }
    _handleReadyForQuery(e) {
      this._connecting && (this._connecting = false, this._connected = true, clearTimeout(this.connectionTimeoutHandle), this._connectionCallback && (this._connectionCallback(null, this), this._connectionCallback = null), this.emit("connect"));
      let { activeQuery: t } = this;
      this.activeQuery = null, this.readyForQuery = true, t && t.handleReadyForQuery(this.connection), this._pulseQueryQueue();
    }
    _handleErrorWhileConnecting(e) {
      if (!this._connectionError) {
        if (this._connectionError = true, clearTimeout(this.connectionTimeoutHandle), this._connectionCallback) return this._connectionCallback(e);
        this.emit("error", e);
      }
    }
    _handleErrorEvent(e) {
      if (this._connecting) return this._handleErrorWhileConnecting(e);
      this._queryable = false, this._errorAllQueries(e), this.emit("error", e);
    }
    _handleErrorMessage(e) {
      if (this._connecting)
        return this._handleErrorWhileConnecting(e);
      let t = this.activeQuery;
      if (!t) {
        this._handleErrorEvent(
          e
        );
        return;
      }
      this.activeQuery = null, t.handleError(e, this.connection);
    }
    _handleRowDescription(e) {
      this.activeQuery.handleRowDescription(e);
    }
    _handleDataRow(e) {
      this.activeQuery.handleDataRow(
        e
      );
    }
    _handlePortalSuspended(e) {
      this.activeQuery.handlePortalSuspended(this.connection);
    }
    _handleEmptyQuery(e) {
      this.activeQuery.handleEmptyQuery(this.connection);
    }
    _handleCommandComplete(e) {
      this.activeQuery.handleCommandComplete(e, this.connection);
    }
    _handleParseComplete(e) {
      this.activeQuery.name && (this.connection.parsedStatements[this.activeQuery.name] = this.activeQuery.text);
    }
    _handleCopyInResponse(e) {
      this.activeQuery.handleCopyInResponse(
        this.connection
      );
    }
    _handleCopyData(e) {
      this.activeQuery.handleCopyData(e, this.connection);
    }
    _handleNotification(e) {
      this.emit("notification", e);
    }
    _handleNotice(e) {
      this.emit("notice", e);
    }
    getStartupConf() {
      var e = this.connectionParameters, t = { user: e.user, database: e.database }, n = e.application_name || e.fallback_application_name;
      return n && (t.application_name = n), e.replication && (t.replication = "" + e.replication), e.statement_timeout && (t.statement_timeout = String(parseInt(
        e.statement_timeout,
        10
      ))), e.lock_timeout && (t.lock_timeout = String(parseInt(e.lock_timeout, 10))), e.idle_in_transaction_session_timeout && (t.idle_in_transaction_session_timeout = String(parseInt(
        e.idle_in_transaction_session_timeout,
        10
      ))), e.options && (t.options = e.options), t;
    }
    cancel(e, t) {
      if (e.activeQuery === t) {
        var n = this.connection;
        this.host && this.host.indexOf("/") === 0 ? n.connect(this.host + "/.s.PGSQL." + this.port) : n.connect(this.port, this.host), n.on("connect", function() {
          n.cancel(
            e.processID,
            e.secretKey
          );
        });
      } else e.queryQueue.indexOf(t) !== -1 && e.queryQueue.splice(e.queryQueue.indexOf(t), 1);
    }
    setTypeParser(e, t, n) {
      return this._types.setTypeParser(e, t, n);
    }
    getTypeParser(e, t) {
      return this._types.getTypeParser(e, t);
    }
    escapeIdentifier(e) {
      return '"' + e.replace(
        /"/g,
        '""'
      ) + '"';
    }
    escapeLiteral(e) {
      for (var t = false, n = "'", i = 0; i < e.length; i++) {
        var s = e[i];
        s === "'" ? n += s + s : s === "\\" ? (n += s + s, t = true) : n += s;
      }
      return n += "'", t === true && (n = " E" + n), n;
    }
    _pulseQueryQueue() {
      if (this.readyForQuery === true) if (this.activeQuery = this.queryQueue.shift(), this.activeQuery) {
        this.readyForQuery = false, this.hasExecuted = true;
        let e = this.activeQuery.submit(this.connection);
        e && m.nextTick(() => {
          this.activeQuery.handleError(e, this.connection), this.readyForQuery = true, this._pulseQueryQueue();
        });
      } else this.hasExecuted && (this.activeQuery = null, this.emit("drain"));
    }
    query(e, t, n) {
      var i, s, o, u, c;
      if (e == null) throw new TypeError("Client was passed a null or undefined query");
      return typeof e.submit == "function" ? (o = e.query_timeout || this.connectionParameters.query_timeout, s = i = e, typeof t == "function" && (i.callback = i.callback || t)) : (o = this.connectionParameters.query_timeout, i = new Ls(
        e,
        t,
        n
      ), i.callback || (s = new this._Promise((h, l) => {
        i.callback = (d, b) => d ? l(d) : h(b);
      }))), o && (c = i.callback, u = setTimeout(() => {
        var h = new Error("Query read timeout");
        m.nextTick(
          () => {
            i.handleError(h, this.connection);
          }
        ), c(h), i.callback = () => {
        };
        var l = this.queryQueue.indexOf(i);
        l > -1 && this.queryQueue.splice(l, 1), this._pulseQueryQueue();
      }, o), i.callback = (h, l) => {
        clearTimeout(u), c(h, l);
      }), this.binary && !i.binary && (i.binary = true), i._result && !i._result._types && (i._result._types = this._types), this._queryable ? this._ending ? (m.nextTick(() => {
        i.handleError(
          new Error("Client was closed and is not queryable"),
          this.connection
        );
      }), s) : (this.queryQueue.push(i), this._pulseQueryQueue(), s) : (m.nextTick(
        () => {
          i.handleError(new Error("Client has encountered a connection error and is not queryable"), this.connection);
        }
      ), s);
    }
    ref() {
      this.connection.ref();
    }
    unref() {
      this.connection.unref();
    }
    end(e) {
      if (this._ending = true, !this.connection._connecting) if (e) e();
      else return this._Promise.resolve();
      if (this.activeQuery || !this._queryable ? this.connection.stream.destroy() : this.connection.end(), e) this.connection.once("end", e);
      else return new this._Promise((t) => {
        this.connection.once("end", t);
      });
    }
  };
  a(yn, "Client");
  var Ct = yn;
  Ct.Query = Ls;
  Rs.exports = Ct;
});
var Us = I((pf, ks) => {
  "use strict";
  p();
  var Ac = ge().EventEmitter, Ms = a(function() {
  }, "NOOP"), Ds = a(
    (r, e) => {
      let t = r.findIndex(e);
      return t === -1 ? void 0 : r.splice(t, 1)[0];
    },
    "removeWhere"
  ), wn = class wn {
    static {
      __name(this, "wn");
    }
    constructor(e, t, n) {
      this.client = e, this.idleListener = t, this.timeoutId = n;
    }
  };
  a(wn, "IdleItem");
  var mn = wn, bn = class bn {
    static {
      __name(this, "bn");
    }
    constructor(e) {
      this.callback = e;
    }
  };
  a(bn, "PendingItem");
  var Ne = bn;
  function Cc() {
    throw new Error("Release called on client which has already been released to the pool.");
  }
  __name(Cc, "Cc");
  a(Cc, "throwOnDoubleRelease");
  function Tt(r, e) {
    if (e) return { callback: e, result: void 0 };
    let t, n, i = a(function(o, u) {
      o ? t(o) : n(u);
    }, "cb"), s = new r(function(o, u) {
      n = o, t = u;
    }).catch((o) => {
      throw Error.captureStackTrace(
        o
      ), o;
    });
    return { callback: i, result: s };
  }
  __name(Tt, "Tt");
  a(Tt, "promisify");
  function Tc(r, e) {
    return a(
      /* @__PURE__ */ __name(function t(n) {
        n.client = e, e.removeListener("error", t), e.on("error", () => {
          r.log("additional client error after disconnection due to error", n);
        }), r._remove(e), r.emit("error", n, e);
      }, "t"),
      "idleListener"
    );
  }
  __name(Tc, "Tc");
  a(Tc, "makeIdleListener");
  var Sn = class Sn extends Ac {
    static {
      __name(this, "Sn");
    }
    constructor(e, t) {
      super(), this.options = Object.assign({}, e), e != null && "password" in e && Object.defineProperty(
        this.options,
        "password",
        { configurable: true, enumerable: false, writable: true, value: e.password }
      ), e != null && e.ssl && e.ssl.key && Object.defineProperty(this.options.ssl, "key", { enumerable: false }), this.options.max = this.options.max || this.options.poolSize || 10, this.options.maxUses = this.options.maxUses || 1 / 0, this.options.allowExitOnIdle = this.options.allowExitOnIdle || false, this.options.maxLifetimeSeconds = this.options.maxLifetimeSeconds || 0, this.log = this.options.log || function() {
      }, this.Client = this.options.Client || t || It().Client, this.Promise = this.options.Promise || S.Promise, typeof this.options.idleTimeoutMillis > "u" && (this.options.idleTimeoutMillis = 1e4), this._clients = [], this._idle = [], this._expired = /* @__PURE__ */ new WeakSet(), this._pendingQueue = [], this._endCallback = void 0, this.ending = false, this.ended = false;
    }
    _isFull() {
      return this._clients.length >= this.options.max;
    }
    _pulseQueue() {
      if (this.log("pulse queue"), this.ended) {
        this.log("pulse queue ended");
        return;
      }
      if (this.ending) {
        this.log(
          "pulse queue on ending"
        ), this._idle.length && this._idle.slice().map((t) => {
          this._remove(
            t.client
          );
        }), this._clients.length || (this.ended = true, this._endCallback());
        return;
      }
      if (!this._pendingQueue.length) {
        this.log("no queued requests");
        return;
      }
      if (!this._idle.length && this._isFull()) return;
      let e = this._pendingQueue.shift();
      if (this._idle.length) {
        let t = this._idle.pop();
        clearTimeout(t.timeoutId);
        let n = t.client;
        n.ref && n.ref();
        let i = t.idleListener;
        return this._acquireClient(n, e, i, false);
      }
      if (!this._isFull()) return this.newClient(e);
      throw new Error("unexpected condition");
    }
    _remove(e) {
      let t = Ds(this._idle, (n) => n.client === e);
      t !== void 0 && clearTimeout(t.timeoutId), this._clients = this._clients.filter((n) => n !== e), e.end(), this.emit("remove", e);
    }
    connect(e) {
      if (this.ending) {
        let i = new Error("Cannot use a pool after calling end on the pool");
        return e ? e(i) : this.Promise.reject(
          i
        );
      }
      let t = Tt(this.Promise, e), n = t.result;
      if (this._isFull() || this._idle.length) {
        if (this._idle.length && m.nextTick(() => this._pulseQueue()), !this.options.connectionTimeoutMillis)
          return this._pendingQueue.push(new Ne(t.callback)), n;
        let i = a((u, c, h) => {
          clearTimeout(
            o
          ), t.callback(u, c, h);
        }, "queueCallback"), s = new Ne(i), o = setTimeout(() => {
          Ds(
            this._pendingQueue,
            (u) => u.callback === i
          ), s.timedOut = true, t.callback(new Error("timeout exceeded when trying to connect"));
        }, this.options.connectionTimeoutMillis);
        return this._pendingQueue.push(s), n;
      }
      return this.newClient(new Ne(t.callback)), n;
    }
    newClient(e) {
      let t = new this.Client(this.options);
      this._clients.push(t);
      let n = Tc(this, t);
      this.log("checking client timeout");
      let i, s = false;
      this.options.connectionTimeoutMillis && (i = setTimeout(() => {
        this.log("ending client due to timeout"), s = true, t.connection ? t.connection.stream.destroy() : t.end();
      }, this.options.connectionTimeoutMillis)), this.log("connecting new client"), t.connect((o) => {
        if (i && clearTimeout(i), t.on("error", n), o) this.log("client failed to connect", o), this._clients = this._clients.filter((u) => u !== t), s && (o.message = "Connection terminated due to connection timeout"), this._pulseQueue(), e.timedOut || e.callback(
          o,
          void 0,
          Ms
        );
        else {
          if (this.log("new client connected"), this.options.maxLifetimeSeconds !== 0) {
            let u = setTimeout(() => {
              this.log("ending client due to expired lifetime"), this._expired.add(t), this._idle.findIndex((h) => h.client === t) !== -1 && this._acquireClient(
                t,
                new Ne((h, l, d) => d()),
                n,
                false
              );
            }, this.options.maxLifetimeSeconds * 1e3);
            u.unref(), t.once(
              "end",
              () => clearTimeout(u)
            );
          }
          return this._acquireClient(t, e, n, true);
        }
      });
    }
    _acquireClient(e, t, n, i) {
      i && this.emit("connect", e), this.emit("acquire", e), e.release = this._releaseOnce(e, n), e.removeListener("error", n), t.timedOut ? i && this.options.verify ? this.options.verify(
        e,
        e.release
      ) : e.release() : i && this.options.verify ? this.options.verify(e, (s) => {
        if (s) return e.release(s), t.callback(s, void 0, Ms);
        t.callback(void 0, e, e.release);
      }) : t.callback(
        void 0,
        e,
        e.release
      );
    }
    _releaseOnce(e, t) {
      let n = false;
      return (i) => {
        n && Cc(), n = true, this._release(
          e,
          t,
          i
        );
      };
    }
    _release(e, t, n) {
      if (e.on("error", t), e._poolUseCount = (e._poolUseCount || 0) + 1, this.emit("release", n, e), n || this.ending || !e._queryable || e._ending || e._poolUseCount >= this.options.maxUses) {
        e._poolUseCount >= this.options.maxUses && this.log("remove expended client"), this._remove(e), this._pulseQueue();
        return;
      }
      if (this._expired.has(e)) {
        this.log("remove expired client"), this._expired.delete(e), this._remove(e), this._pulseQueue();
        return;
      }
      let s;
      this.options.idleTimeoutMillis && (s = setTimeout(() => {
        this.log("remove idle client"), this._remove(e);
      }, this.options.idleTimeoutMillis), this.options.allowExitOnIdle && s.unref()), this.options.allowExitOnIdle && e.unref(), this._idle.push(new mn(e, t, s)), this._pulseQueue();
    }
    query(e, t, n) {
      if (typeof e == "function") {
        let s = Tt(this.Promise, e);
        return x(function() {
          return s.callback(new Error("Passing a function as the first parameter to pool.query is not supported"));
        }), s.result;
      }
      typeof t == "function" && (n = t, t = void 0);
      let i = Tt(this.Promise, n);
      return n = i.callback, this.connect((s, o) => {
        if (s)
          return n(s);
        let u = false, c = a((h) => {
          u || (u = true, o.release(h), n(h));
        }, "onError");
        o.once("error", c), this.log("dispatching query");
        try {
          o.query(e, t, (h, l) => {
            if (this.log("query dispatched"), o.removeListener("error", c), !u) return u = true, o.release(h), h ? n(h) : n(
              void 0,
              l
            );
          });
        } catch (h) {
          return o.release(h), n(h);
        }
      }), i.result;
    }
    end(e) {
      if (this.log("ending"), this.ending) {
        let n = new Error("Called end on pool more than once");
        return e ? e(n) : this.Promise.reject(n);
      }
      this.ending = true;
      let t = Tt(this.Promise, e);
      return this._endCallback = t.callback, this._pulseQueue(), t.result;
    }
    get waitingCount() {
      return this._pendingQueue.length;
    }
    get idleCount() {
      return this._idle.length;
    }
    get expiredCount() {
      return this._clients.reduce((e, t) => e + (this._expired.has(t) ? 1 : 0), 0);
    }
    get totalCount() {
      return this._clients.length;
    }
  };
  a(Sn, "Pool");
  var gn = Sn;
  ks.exports = gn;
});
var Os = {};
se(Os, { default: /* @__PURE__ */ __name(() => Ic, "default") });
var Ic;
var Ns = z(() => {
  "use strict";
  p();
  Ic = {};
});
var qs = I((gf, Pc) => {
  Pc.exports = { name: "pg", version: "8.8.0", description: "PostgreSQL client - pure javascript & libpq with the same API", keywords: [
    "database",
    "libpq",
    "pg",
    "postgre",
    "postgres",
    "postgresql",
    "rdbms"
  ], homepage: "https://github.com/brianc/node-postgres", repository: { type: "git", url: "git://github.com/brianc/node-postgres.git", directory: "packages/pg" }, author: "Brian Carlson <brian.m.carlson@gmail.com>", main: "./lib", dependencies: {
    "buffer-writer": "2.0.0",
    "packet-reader": "1.0.0",
    "pg-connection-string": "^2.5.0",
    "pg-pool": "^3.5.2",
    "pg-protocol": "^1.5.0",
    "pg-types": "^2.1.0",
    pgpass: "1.x"
  }, devDependencies: { async: "2.6.4", bluebird: "3.5.2", co: "4.6.0", "pg-copy-streams": "0.3.0" }, peerDependencies: { "pg-native": ">=3.0.1" }, peerDependenciesMeta: {
    "pg-native": { optional: true }
  }, scripts: { test: "make test-all" }, files: ["lib", "SPONSORS.md"], license: "MIT", engines: { node: ">= 8.0.0" }, gitHead: "c99fb2c127ddf8d712500db2c7b9a5491a178655" };
});
var Ws = I((wf, js) => {
  "use strict";
  p();
  var Qs = ge().EventEmitter, Bc = (Ge(), O(He)), xn = tt(), qe = js.exports = function(r, e, t) {
    Qs.call(this), r = xn.normalizeQueryConfig(r, e, t), this.text = r.text, this.values = r.values, this.name = r.name, this.callback = r.callback, this.state = "new", this._arrayMode = r.rowMode === "array", this._emitRowEvents = false, this.on("newListener", function(n) {
      n === "row" && (this._emitRowEvents = true);
    }.bind(this));
  };
  Bc.inherits(
    qe,
    Qs
  );
  var Lc = { sqlState: "code", statementPosition: "position", messagePrimary: "message", context: "where", schemaName: "schema", tableName: "table", columnName: "column", dataTypeName: "dataType", constraintName: "constraint", sourceFile: "file", sourceLine: "line", sourceFunction: "routine" };
  qe.prototype.handleError = function(r) {
    var e = this.native.pq.resultErrorFields();
    if (e) for (var t in e) {
      var n = Lc[t] || t;
      r[n] = e[t];
    }
    this.callback ? this.callback(r) : this.emit("error", r), this.state = "error";
  };
  qe.prototype.then = function(r, e) {
    return this._getPromise().then(r, e);
  };
  qe.prototype.catch = function(r) {
    return this._getPromise().catch(r);
  };
  qe.prototype._getPromise = function() {
    return this._promise ? this._promise : (this._promise = new Promise(function(r, e) {
      this._once("end", r), this._once(
        "error",
        e
      );
    }.bind(this)), this._promise);
  };
  qe.prototype.submit = function(r) {
    this.state = "running";
    var e = this;
    this.native = r.native, r.native.arrayMode = this._arrayMode;
    var t = a(
      function(s, o, u) {
        if (r.native.arrayMode = false, x(function() {
          e.emit("_done");
        }), s) return e.handleError(s);
        e._emitRowEvents && (u.length > 1 ? o.forEach((c, h) => {
          c.forEach((l) => {
            e.emit(
              "row",
              l,
              u[h]
            );
          });
        }) : o.forEach(function(c) {
          e.emit("row", c, u);
        })), e.state = "end", e.emit(
          "end",
          u
        ), e.callback && e.callback(null, u);
      },
      "after"
    );
    if (m.domain && (t = m.domain.bind(
      t
    )), this.name) {
      this.name.length > 63 && (console.error("Warning! Postgres only supports 63 characters for query names."), console.error(
        "You supplied %s (%s)",
        this.name,
        this.name.length
      ), console.error("This can cause conflicts and silent errors executing queries"));
      var n = (this.values || []).map(xn.prepareValue);
      if (r.namedQueries[this.name]) {
        if (this.text && r.namedQueries[this.name] !== this.text) {
          let s = new Error(`Prepared statements must be unique - '${this.name}' was used for a different statement`);
          return t(s);
        }
        return r.native.execute(this.name, n, t);
      }
      return r.native.prepare(
        this.name,
        this.text,
        n.length,
        function(s) {
          return s ? t(s) : (r.namedQueries[e.name] = e.text, e.native.execute(e.name, n, t));
        }
      );
    } else if (this.values) {
      if (!Array.isArray(this.values)) {
        let s = new Error("Query values must be an array");
        return t(s);
      }
      var i = this.values.map(xn.prepareValue);
      r.native.query(this.text, i, t);
    } else r.native.query(this.text, t);
  };
});
var Vs = I((Ef, $s) => {
  "use strict";
  p();
  var Rc = (Ns(), O(Os)), Fc = wt(), xf = qs(), Hs = ge().EventEmitter, Mc = (Ge(), O(He)), Dc = bt(), Gs = Ws(), J = $s.exports = function(r) {
    Hs.call(this), r = r || {}, this._Promise = r.Promise || S.Promise, this._types = new Fc(r.types), this.native = new Rc({ types: this._types }), this._queryQueue = [], this._ending = false, this._connecting = false, this._connected = false, this._queryable = true;
    var e = this.connectionParameters = new Dc(
      r
    );
    this.user = e.user, Object.defineProperty(this, "password", {
      configurable: true,
      enumerable: false,
      writable: true,
      value: e.password
    }), this.database = e.database, this.host = e.host, this.port = e.port, this.namedQueries = {};
  };
  J.Query = Gs;
  Mc.inherits(J, Hs);
  J.prototype._errorAllQueries = function(r) {
    let e = a(
      (t) => {
        m.nextTick(() => {
          t.native = this.native, t.handleError(r);
        });
      },
      "enqueueError"
    );
    this._hasActiveQuery() && (e(this._activeQuery), this._activeQuery = null), this._queryQueue.forEach(e), this._queryQueue.length = 0;
  };
  J.prototype._connect = function(r) {
    var e = this;
    if (this._connecting) {
      m.nextTick(() => r(new Error("Client has already been connected. You cannot reuse a client.")));
      return;
    }
    this._connecting = true, this.connectionParameters.getLibpqConnectionString(function(t, n) {
      if (t) return r(
        t
      );
      e.native.connect(n, function(i) {
        if (i) return e.native.end(), r(i);
        e._connected = true, e.native.on("error", function(s) {
          e._queryable = false, e._errorAllQueries(s), e.emit("error", s);
        }), e.native.on("notification", function(s) {
          e.emit("notification", { channel: s.relname, payload: s.extra });
        }), e.emit("connect"), e._pulseQueryQueue(true), r();
      });
    });
  };
  J.prototype.connect = function(r) {
    if (r) {
      this._connect(r);
      return;
    }
    return new this._Promise(
      (e, t) => {
        this._connect((n) => {
          n ? t(n) : e();
        });
      }
    );
  };
  J.prototype.query = function(r, e, t) {
    var n, i, s, o, u;
    if (r == null) throw new TypeError("Client was passed a null or undefined query");
    if (typeof r.submit == "function") s = r.query_timeout || this.connectionParameters.query_timeout, i = n = r, typeof e == "function" && (r.callback = e);
    else if (s = this.connectionParameters.query_timeout, n = new Gs(r, e, t), !n.callback) {
      let c, h;
      i = new this._Promise((l, d) => {
        c = l, h = d;
      }), n.callback = (l, d) => l ? h(l) : c(d);
    }
    return s && (u = n.callback, o = setTimeout(() => {
      var c = new Error("Query read timeout");
      m.nextTick(() => {
        n.handleError(c, this.connection);
      }), u(c), n.callback = () => {
      };
      var h = this._queryQueue.indexOf(n);
      h > -1 && this._queryQueue.splice(h, 1), this._pulseQueryQueue();
    }, s), n.callback = (c, h) => {
      clearTimeout(o), u(c, h);
    }), this._queryable ? this._ending ? (n.native = this.native, m.nextTick(() => {
      n.handleError(
        new Error("Client was closed and is not queryable")
      );
    }), i) : (this._queryQueue.push(
      n
    ), this._pulseQueryQueue(), i) : (n.native = this.native, m.nextTick(() => {
      n.handleError(
        new Error("Client has encountered a connection error and is not queryable")
      );
    }), i);
  };
  J.prototype.end = function(r) {
    var e = this;
    this._ending = true, this._connected || this.once(
      "connect",
      this.end.bind(this, r)
    );
    var t;
    return r || (t = new this._Promise(function(n, i) {
      r = a((s) => s ? i(s) : n(), "cb");
    })), this.native.end(function() {
      e._errorAllQueries(new Error(
        "Connection terminated"
      )), m.nextTick(() => {
        e.emit("end"), r && r();
      });
    }), t;
  };
  J.prototype._hasActiveQuery = function() {
    return this._activeQuery && this._activeQuery.state !== "error" && this._activeQuery.state !== "end";
  };
  J.prototype._pulseQueryQueue = function(r) {
    if (this._connected && !this._hasActiveQuery()) {
      var e = this._queryQueue.shift();
      if (!e) {
        r || this.emit("drain");
        return;
      }
      this._activeQuery = e, e.submit(this);
      var t = this;
      e.once(
        "_done",
        function() {
          t._pulseQueryQueue();
        }
      );
    }
  };
  J.prototype.cancel = function(r) {
    this._activeQuery === r ? this.native.cancel(function() {
    }) : this._queryQueue.indexOf(r) !== -1 && this._queryQueue.splice(this._queryQueue.indexOf(r), 1);
  };
  J.prototype.ref = function() {
  };
  J.prototype.unref = function() {
  };
  J.prototype.setTypeParser = function(r, e, t) {
    return this._types.setTypeParser(r, e, t);
  };
  J.prototype.getTypeParser = function(r, e) {
    return this._types.getTypeParser(r, e);
  };
});
var En = I((Af, Ks) => {
  "use strict";
  p();
  Ks.exports = Vs();
});
var It = I((Tf, nt) => {
  "use strict";
  p();
  var kc = Fs(), Uc = et(), Oc = pn(), Nc = Us(), { DatabaseError: qc } = hn(), Qc = a((r) => {
    var e;
    return e = class extends Nc {
      static {
        __name(this, "e");
      }
      constructor(n) {
        super(n, r);
      }
    }, a(e, "BoundPool"), e;
  }, "poolFactory"), vn = a(function(r) {
    this.defaults = Uc, this.Client = r, this.Query = this.Client.Query, this.Pool = Qc(this.Client), this._pools = [], this.Connection = Oc, this.types = Xe(), this.DatabaseError = qc;
  }, "PG");
  typeof m.env.NODE_PG_FORCE_NATIVE < "u" ? nt.exports = new vn(En()) : (nt.exports = new vn(kc), Object.defineProperty(nt.exports, "native", { configurable: true, enumerable: false, get() {
    var r = null;
    try {
      r = new vn(En());
    } catch (e) {
      if (e.code !== "MODULE_NOT_FOUND") throw e;
    }
    return Object.defineProperty(nt.exports, "native", { value: r }), r;
  } }));
});
p();
var Bt = Te(It());
St();
p();
St();
mr();
var Zs = Te(tt());
var Js = Te(wt());
function jc(r) {
  return r instanceof y ? "\\x" + r.toString("hex") : r;
}
__name(jc, "jc");
a(jc, "encodeBuffersAsBytea");
var Pt = class Pt2 extends Error {
  static {
    __name(this, "Pt");
  }
  constructor(t) {
    super(t);
    _(
      this,
      "name",
      "NeonDbError"
    );
    _(this, "severity");
    _(this, "code");
    _(this, "detail");
    _(this, "hint");
    _(this, "position");
    _(this, "internalPosition");
    _(this, "internalQuery");
    _(this, "where");
    _(this, "schema");
    _(this, "table");
    _(this, "column");
    _(this, "dataType");
    _(
      this,
      "constraint"
    );
    _(this, "file");
    _(this, "line");
    _(this, "routine");
    _(this, "sourceError");
    "captureStackTrace" in Error && typeof Error.captureStackTrace == "function" && Error.captureStackTrace(this, Pt2);
  }
};
a(Pt, "NeonDbError");
var pe = Pt;
var zs = "transaction() expects an array of queries, or a function returning an array of queries";
var Wc = ["severity", "code", "detail", "hint", "position", "internalPosition", "internalQuery", "where", "schema", "table", "column", "dataType", "constraint", "file", "line", "routine"];
function Xs(r, {
  arrayMode: e,
  fullResults: t,
  fetchOptions: n,
  isolationLevel: i,
  readOnly: s,
  deferrable: o,
  queryCallback: u,
  resultCallback: c,
  authToken: h
} = {}) {
  if (!r) throw new Error("No database connection string was provided to `neon()`. Perhaps an environment variable has not been set?");
  let l;
  try {
    l = yr(r);
  } catch {
    throw new Error("Database connection string provided to `neon()` is not a valid URL. Connection string: " + String(r));
  }
  let { protocol: d, username: b, hostname: C, port: B, pathname: Q } = l;
  if (d !== "postgres:" && d !== "postgresql:" || !b || !C || !Q) throw new Error("Database connection string format for `neon()` should be: postgresql://user:password@host.tld/dbname?option=value");
  function X(A, ...g) {
    let P, K;
    if (typeof A == "string") P = A, K = g[1], g = g[0] ?? [];
    else {
      P = "";
      for (let j = 0; j < A.length; j++)
        P += A[j], j < g.length && (P += "$" + (j + 1));
    }
    g = g.map((j) => jc((0, Zs.prepareValue)(j)));
    let k = {
      query: P,
      params: g
    };
    return u && u(k), Hc(de, k, K);
  }
  __name(X, "X");
  a(X, "resolve"), X.transaction = async (A, g) => {
    if (typeof A == "function" && (A = A(X)), !Array.isArray(A)) throw new Error(zs);
    A.forEach(
      (k) => {
        if (k[Symbol.toStringTag] !== "NeonQueryPromise") throw new Error(zs);
      }
    );
    let P = A.map((k) => k.parameterizedQuery), K = A.map((k) => k.opts ?? {});
    return de(P, K, g);
  };
  async function de(A, g, P) {
    let { fetchEndpoint: K, fetchFunction: k } = _e, j = Array.isArray(A) ? { queries: A } : A, ee = n ?? {}, oe = e ?? false, R = t ?? false, $ = i, ce = s, ye = o;
    P !== void 0 && (P.fetchOptions !== void 0 && (ee = {
      ...ee,
      ...P.fetchOptions
    }), P.arrayMode !== void 0 && (oe = P.arrayMode), P.fullResults !== void 0 && (R = P.fullResults), P.isolationLevel !== void 0 && ($ = P.isolationLevel), P.readOnly !== void 0 && (ce = P.readOnly), P.deferrable !== void 0 && (ye = P.deferrable)), g !== void 0 && !Array.isArray(
      g
    ) && g.fetchOptions !== void 0 && (ee = { ...ee, ...g.fetchOptions });
    let Se = h;
    !Array.isArray(
      g
    ) && g?.authToken !== void 0 && (Se = g.authToken);
    let je = typeof K == "function" ? K(C, B, { jwtAuth: Se !== void 0 }) : K, he = { "Neon-Connection-String": r, "Neon-Raw-Text-Output": "true", "Neon-Array-Mode": "true" }, it = await Gc(Se);
    it && (he.Authorization = `Bearer ${it}`), Array.isArray(
      A
    ) && ($ !== void 0 && (he["Neon-Batch-Isolation-Level"] = $), ce !== void 0 && (he["Neon-Batch-Read-Only"] = String(ce)), ye !== void 0 && (he["Neon-Batch-Deferrable"] = String(ye)));
    let te;
    try {
      te = await (k ?? fetch)(je, {
        method: "POST",
        body: JSON.stringify(j),
        headers: he,
        ...ee
      });
    } catch (W) {
      let H = new pe(`Error connecting to database: ${W.message}`);
      throw H.sourceError = W, H;
    }
    if (te.ok) {
      let W = await te.json();
      if (Array.isArray(A)) {
        let H = W.results;
        if (!Array.isArray(H)) throw new pe("Neon internal error: unexpected result format");
        return H.map((Ae, xe) => {
          let Lt = g[xe] ?? {}, ro = Lt.arrayMode ?? oe, no = Lt.fullResults ?? R;
          return Ys(Ae, {
            arrayMode: ro,
            fullResults: no,
            parameterizedQuery: A[xe],
            resultCallback: c,
            types: Lt.types
          });
        });
      } else {
        let H = g ?? {}, Ae = H.arrayMode ?? oe, xe = H.fullResults ?? R;
        return Ys(
          W,
          { arrayMode: Ae, fullResults: xe, parameterizedQuery: A, resultCallback: c, types: H.types }
        );
      }
    } else {
      let { status: W } = te;
      if (W === 400) {
        let H = await te.json(), Ae = new pe(H.message);
        for (let xe of Wc)
          Ae[xe] = H[xe] ?? void 0;
        throw Ae;
      } else {
        let H = await te.text();
        throw new pe(`Server error (HTTP status ${W}): ${H}`);
      }
    }
  }
  __name(de, "de");
  return a(de, "execute"), X;
}
__name(Xs, "Xs");
a(Xs, "neon");
function Hc(r, e, t) {
  return { [Symbol.toStringTag]: "NeonQueryPromise", parameterizedQuery: e, opts: t, then: a(
    (n, i) => r(e, t).then(n, i),
    "then"
  ), catch: a((n) => r(e, t).catch(n), "catch"), finally: a((n) => r(
    e,
    t
  ).finally(n), "finally") };
}
__name(Hc, "Hc");
a(Hc, "createNeonQueryPromise");
function Ys(r, {
  arrayMode: e,
  fullResults: t,
  parameterizedQuery: n,
  resultCallback: i,
  types: s
}) {
  let o = new Js.default(
    s
  ), u = r.fields.map((l) => l.name), c = r.fields.map((l) => o.getTypeParser(l.dataTypeID)), h = e === true ? r.rows.map((l) => l.map((d, b) => d === null ? null : c[b](d))) : r.rows.map((l) => Object.fromEntries(
    l.map((d, b) => [u[b], d === null ? null : c[b](d)])
  ));
  return i && i(n, r, h, { arrayMode: e, fullResults: t }), t ? (r.viaNeonFetch = true, r.rowAsArray = e, r.rows = h, r._parsers = c, r._types = o, r) : h;
}
__name(Ys, "Ys");
a(Ys, "processQueryResult");
async function Gc(r) {
  if (typeof r == "string") return r;
  if (typeof r == "function") try {
    return await Promise.resolve(r());
  } catch (e) {
    let t = new pe("Error getting auth token.");
    throw e instanceof Error && (t = new pe(`Error getting auth token: ${e.message}`)), t;
  }
}
__name(Gc, "Gc");
a(Gc, "getAuthToken");
var to = Te(bt());
var Qe = Te(It());
var An = class An2 extends Bt.Client {
  static {
    __name(this, "An");
  }
  constructor(t) {
    super(t);
    this.config = t;
  }
  get neonConfig() {
    return this.connection.stream;
  }
  connect(t) {
    let { neonConfig: n } = this;
    n.forceDisablePgSSL && (this.ssl = this.connection.ssl = false), this.ssl && n.useSecureWebSocket && console.warn("SSL is enabled for both Postgres (e.g. ?sslmode=require in the connection string + forceDisablePgSSL = false) and the WebSocket tunnel (useSecureWebSocket = true). Double encryption will increase latency and CPU usage. It may be appropriate to disable SSL in the Postgres connection parameters or set forceDisablePgSSL = true.");
    let i = this.config?.host !== void 0 || this.config?.connectionString !== void 0 || m.env.PGHOST !== void 0, s = m.env.USER ?? m.env.USERNAME;
    if (!i && this.host === "localhost" && this.user === s && this.database === s && this.password === null) throw new Error(`No database host or connection string was set, and key parameters have default values (host: localhost, user: ${s}, db: ${s}, password: null). Is an environment variable missing? Alternatively, if you intended to connect with these parameters, please set the host to 'localhost' explicitly.`);
    let o = super.connect(t), u = n.pipelineTLS && this.ssl, c = n.pipelineConnect === "password";
    if (!u && !n.pipelineConnect) return o;
    let h = this.connection;
    if (u && h.on("connect", () => h.stream.emit("data", "S")), c) {
      h.removeAllListeners(
        "authenticationCleartextPassword"
      ), h.removeAllListeners("readyForQuery"), h.once(
        "readyForQuery",
        () => h.on("readyForQuery", this._handleReadyForQuery.bind(this))
      );
      let l = this.ssl ? "sslconnect" : "connect";
      h.on(l, () => {
        this._handleAuthCleartextPassword(), this._handleReadyForQuery();
      });
    }
    return o;
  }
  async _handleAuthSASLContinue(t) {
    let n = this.saslSession, i = this.password, s = t.data;
    if (n.message !== "SASLInitialResponse" || typeof i != "string" || typeof s != "string") throw new Error("SASL: protocol error");
    let o = Object.fromEntries(s.split(",").map((te) => {
      if (!/^.=/.test(te)) throw new Error("SASL: Invalid attribute pair entry");
      let W = te[0], H = te.substring(2);
      return [W, H];
    })), u = o.r, c = o.s, h = o.i;
    if (!u || !/^[!-+--~]+$/.test(u)) throw new Error("SASL: SCRAM-SERVER-FIRST-MESSAGE: nonce missing/unprintable");
    if (!c || !/^(?:[a-zA-Z0-9+/]{4})*(?:[a-zA-Z0-9+/]{2}==|[a-zA-Z0-9+/]{3}=)?$/.test(c)) throw new Error("SASL: SCRAM-SERVER-FIRST-MESSAGE: salt missing/not base64");
    if (!h || !/^[1-9][0-9]*$/.test(h)) throw new Error("SASL: SCRAM-SERVER-FIRST-MESSAGE: missing/invalid iteration count");
    if (!u.startsWith(n.clientNonce)) throw new Error(
      "SASL: SCRAM-SERVER-FIRST-MESSAGE: server nonce does not start with client nonce"
    );
    if (u.length === n.clientNonce.length) throw new Error("SASL: SCRAM-SERVER-FIRST-MESSAGE: server nonce is too short");
    let l = parseInt(h, 10), d = y.from(c, "base64"), b = new TextEncoder(), C = b.encode(i), B = await w.subtle.importKey("raw", C, { name: "HMAC", hash: { name: "SHA-256" } }, false, ["sign"]), Q = new Uint8Array(await w.subtle.sign("HMAC", B, y.concat([d, y.from(
      [0, 0, 0, 1]
    )]))), X = Q;
    for (var de = 0; de < l - 1; de++) Q = new Uint8Array(await w.subtle.sign(
      "HMAC",
      B,
      Q
    )), X = y.from(X.map((te, W) => X[W] ^ Q[W]));
    let A = X, g = await w.subtle.importKey(
      "raw",
      A,
      { name: "HMAC", hash: { name: "SHA-256" } },
      false,
      ["sign"]
    ), P = new Uint8Array(await w.subtle.sign("HMAC", g, b.encode("Client Key"))), K = await w.subtle.digest(
      "SHA-256",
      P
    ), k = "n=*,r=" + n.clientNonce, j = "r=" + u + ",s=" + c + ",i=" + l, ee = "c=biws,r=" + u, oe = k + "," + j + "," + ee, R = await w.subtle.importKey(
      "raw",
      K,
      { name: "HMAC", hash: { name: "SHA-256" } },
      false,
      ["sign"]
    );
    var $ = new Uint8Array(await w.subtle.sign("HMAC", R, b.encode(oe))), ce = y.from(P.map((te, W) => P[W] ^ $[W])), ye = ce.toString("base64");
    let Se = await w.subtle.importKey(
      "raw",
      A,
      { name: "HMAC", hash: { name: "SHA-256" } },
      false,
      ["sign"]
    ), je = await w.subtle.sign(
      "HMAC",
      Se,
      b.encode("Server Key")
    ), he = await w.subtle.importKey("raw", je, { name: "HMAC", hash: { name: "SHA-256" } }, false, ["sign"]);
    var it = y.from(await w.subtle.sign(
      "HMAC",
      he,
      b.encode(oe)
    ));
    n.message = "SASLResponse", n.serverSignature = it.toString("base64"), n.response = ee + ",p=" + ye, this.connection.sendSCRAMClientFinalMessage(this.saslSession.response);
  }
};
a(An, "NeonClient");
var _n = An;
function $c(r, e) {
  if (e) return {
    callback: e,
    result: void 0
  };
  let t, n, i = a(function(o, u) {
    o ? t(o) : n(u);
  }, "cb"), s = new r(function(o, u) {
    n = o, t = u;
  });
  return { callback: i, result: s };
}
__name($c, "$c");
a($c, "promisify");
var Cn = class Cn2 extends Bt.Pool {
  static {
    __name(this, "Cn");
  }
  constructor() {
    super(...arguments);
    _(this, "Client", _n);
    _(this, "hasFetchUnsupportedListeners", false);
  }
  on(t, n) {
    return t !== "error" && (this.hasFetchUnsupportedListeners = true), super.on(t, n);
  }
  query(t, n, i) {
    if (!_e.poolQueryViaFetch || this.hasFetchUnsupportedListeners || typeof t == "function")
      return super.query(t, n, i);
    typeof n == "function" && (i = n, n = void 0);
    let s = $c(
      this.Promise,
      i
    );
    i = s.callback;
    try {
      let o = new to.default(this.options), u = encodeURIComponent, c = encodeURI, h = `postgresql://${u(o.user)}:${u(o.password)}@${u(o.host)}/${c(o.database)}`, l = typeof t == "string" ? t : t.text, d = n ?? t.values ?? [];
      Xs(h, { fullResults: true, arrayMode: t.rowMode === "array" })(l, d, { types: t.types ?? this.options?.types }).then((C) => i(void 0, C)).catch((C) => i(
        C
      ));
    } catch (o) {
      i(o);
    }
    return s.result;
  }
};
a(Cn, "NeonPool");
var export_ClientBase = Qe.ClientBase;
var export_Connection = Qe.Connection;
var export_DatabaseError = Qe.DatabaseError;
var export_Query = Qe.Query;
var export_defaults = Qe.defaults;
var export_types = Qe.types;

// node_modules/hono/dist/compose.js
var compose = /* @__PURE__ */ __name((middleware, onError, onNotFound) => {
  return (context, next) => {
    let index = -1;
    return dispatch(0);
    async function dispatch(i) {
      if (i <= index) {
        throw new Error("next() called multiple times");
      }
      index = i;
      let res;
      let isError = false;
      let handler;
      if (middleware[i]) {
        handler = middleware[i][0][0];
        context.req.routeIndex = i;
      } else {
        handler = i === middleware.length && next || void 0;
      }
      if (handler) {
        try {
          res = await handler(context, () => dispatch(i + 1));
        } catch (err) {
          if (err instanceof Error && onError) {
            context.error = err;
            res = await onError(err, context);
            isError = true;
          } else {
            throw err;
          }
        }
      } else {
        if (context.finalized === false && onNotFound) {
          res = await onNotFound(context);
        }
      }
      if (res && (context.finalized === false || isError)) {
        context.res = res;
      }
      return context;
    }
    __name(dispatch, "dispatch");
  };
}, "compose");

// node_modules/hono/dist/http-exception.js
var HTTPException = class extends Error {
  static {
    __name(this, "HTTPException");
  }
  res;
  status;
  /**
   * Creates an instance of `HTTPException`.
   * @param status - HTTP status code for the exception. Defaults to 500.
   * @param options - Additional options for the exception.
   */
  constructor(status = 500, options) {
    super(options?.message, { cause: options?.cause });
    this.res = options?.res;
    this.status = status;
  }
  /**
   * Returns the response object associated with the exception.
   * If a response object is not provided, a new response is created with the error message and status code.
   * @returns The response object.
   */
  getResponse() {
    if (this.res) {
      const newResponse = new Response(this.res.body, {
        status: this.status,
        headers: this.res.headers
      });
      return newResponse;
    }
    return new Response(this.message, {
      status: this.status
    });
  }
};

// node_modules/hono/dist/request/constants.js
var GET_MATCH_RESULT = /* @__PURE__ */ Symbol();

// node_modules/hono/dist/utils/body.js
var parseBody = /* @__PURE__ */ __name(async (request, options = /* @__PURE__ */ Object.create(null)) => {
  const { all = false, dot = false } = options;
  const headers = request instanceof HonoRequest ? request.raw.headers : request.headers;
  const contentType = headers.get("Content-Type");
  if (contentType?.startsWith("multipart/form-data") || contentType?.startsWith("application/x-www-form-urlencoded")) {
    return parseFormData(request, { all, dot });
  }
  return {};
}, "parseBody");
async function parseFormData(request, options) {
  const formData = await request.formData();
  if (formData) {
    return convertFormDataToBodyData(formData, options);
  }
  return {};
}
__name(parseFormData, "parseFormData");
function convertFormDataToBodyData(formData, options) {
  const form = /* @__PURE__ */ Object.create(null);
  formData.forEach((value, key) => {
    const shouldParseAllValues = options.all || key.endsWith("[]");
    if (!shouldParseAllValues) {
      form[key] = value;
    } else {
      handleParsingAllValues(form, key, value);
    }
  });
  if (options.dot) {
    Object.entries(form).forEach(([key, value]) => {
      const shouldParseDotValues = key.includes(".");
      if (shouldParseDotValues) {
        handleParsingNestedValues(form, key, value);
        delete form[key];
      }
    });
  }
  return form;
}
__name(convertFormDataToBodyData, "convertFormDataToBodyData");
var handleParsingAllValues = /* @__PURE__ */ __name((form, key, value) => {
  if (form[key] !== void 0) {
    if (Array.isArray(form[key])) {
      ;
      form[key].push(value);
    } else {
      form[key] = [form[key], value];
    }
  } else {
    if (!key.endsWith("[]")) {
      form[key] = value;
    } else {
      form[key] = [value];
    }
  }
}, "handleParsingAllValues");
var handleParsingNestedValues = /* @__PURE__ */ __name((form, key, value) => {
  if (/(?:^|\.)__proto__\./.test(key)) {
    return;
  }
  let nestedForm = form;
  const keys = key.split(".");
  keys.forEach((key2, index) => {
    if (index === keys.length - 1) {
      nestedForm[key2] = value;
    } else {
      if (!nestedForm[key2] || typeof nestedForm[key2] !== "object" || Array.isArray(nestedForm[key2]) || nestedForm[key2] instanceof File) {
        nestedForm[key2] = /* @__PURE__ */ Object.create(null);
      }
      nestedForm = nestedForm[key2];
    }
  });
}, "handleParsingNestedValues");

// node_modules/hono/dist/utils/url.js
var splitPath = /* @__PURE__ */ __name((path) => {
  const paths = path.split("/");
  if (paths[0] === "") {
    paths.shift();
  }
  return paths;
}, "splitPath");
var splitRoutingPath = /* @__PURE__ */ __name((routePath) => {
  const { groups, path } = extractGroupsFromPath(routePath);
  const paths = splitPath(path);
  return replaceGroupMarks(paths, groups);
}, "splitRoutingPath");
var extractGroupsFromPath = /* @__PURE__ */ __name((path) => {
  const groups = [];
  path = path.replace(/\{[^}]+\}/g, (match2, index) => {
    const mark = `@${index}`;
    groups.push([mark, match2]);
    return mark;
  });
  return { groups, path };
}, "extractGroupsFromPath");
var replaceGroupMarks = /* @__PURE__ */ __name((paths, groups) => {
  for (let i = groups.length - 1; i >= 0; i--) {
    const [mark] = groups[i];
    for (let j = paths.length - 1; j >= 0; j--) {
      if (paths[j].includes(mark)) {
        paths[j] = paths[j].replace(mark, groups[i][1]);
        break;
      }
    }
  }
  return paths;
}, "replaceGroupMarks");
var patternCache = {};
var getPattern = /* @__PURE__ */ __name((label, next) => {
  if (label === "*") {
    return "*";
  }
  const match2 = label.match(/^\:([^\{\}]+)(?:\{(.+)\})?$/);
  if (match2) {
    const cacheKey = `${label}#${next}`;
    if (!patternCache[cacheKey]) {
      if (match2[2]) {
        patternCache[cacheKey] = next && next[0] !== ":" && next[0] !== "*" ? [cacheKey, match2[1], new RegExp(`^${match2[2]}(?=/${next})`)] : [label, match2[1], new RegExp(`^${match2[2]}$`)];
      } else {
        patternCache[cacheKey] = [label, match2[1], true];
      }
    }
    return patternCache[cacheKey];
  }
  return null;
}, "getPattern");
var tryDecode = /* @__PURE__ */ __name((str, decoder2) => {
  try {
    return decoder2(str);
  } catch {
    return str.replace(/(?:%[0-9A-Fa-f]{2})+/g, (match2) => {
      try {
        return decoder2(match2);
      } catch {
        return match2;
      }
    });
  }
}, "tryDecode");
var tryDecodeURI = /* @__PURE__ */ __name((str) => tryDecode(str, decodeURI), "tryDecodeURI");
var getPath = /* @__PURE__ */ __name((request) => {
  const url = request.url;
  const start = url.indexOf("/", url.indexOf(":") + 4);
  let i = start;
  for (; i < url.length; i++) {
    const charCode = url.charCodeAt(i);
    if (charCode === 37) {
      const queryIndex = url.indexOf("?", i);
      const hashIndex = url.indexOf("#", i);
      const end = queryIndex === -1 ? hashIndex === -1 ? void 0 : hashIndex : hashIndex === -1 ? queryIndex : Math.min(queryIndex, hashIndex);
      const path = url.slice(start, end);
      return tryDecodeURI(path.includes("%25") ? path.replace(/%25/g, "%2525") : path);
    } else if (charCode === 63 || charCode === 35) {
      break;
    }
  }
  return url.slice(start, i);
}, "getPath");
var getPathNoStrict = /* @__PURE__ */ __name((request) => {
  const result = getPath(request);
  return result.length > 1 && result.at(-1) === "/" ? result.slice(0, -1) : result;
}, "getPathNoStrict");
var mergePath = /* @__PURE__ */ __name((base, sub, ...rest) => {
  if (rest.length) {
    sub = mergePath(sub, ...rest);
  }
  return `${base?.[0] === "/" ? "" : "/"}${base}${sub === "/" ? "" : `${base?.at(-1) === "/" ? "" : "/"}${sub?.[0] === "/" ? sub.slice(1) : sub}`}`;
}, "mergePath");
var checkOptionalParameter = /* @__PURE__ */ __name((path) => {
  if (path.charCodeAt(path.length - 1) !== 63 || !path.includes(":")) {
    return null;
  }
  const segments = path.split("/");
  const results = [];
  let basePath = "";
  segments.forEach((segment) => {
    if (segment !== "" && !/\:/.test(segment)) {
      basePath += "/" + segment;
    } else if (/\:/.test(segment)) {
      if (/\?/.test(segment)) {
        if (results.length === 0 && basePath === "") {
          results.push("/");
        } else {
          results.push(basePath);
        }
        const optionalSegment = segment.replace("?", "");
        basePath += "/" + optionalSegment;
        results.push(basePath);
      } else {
        basePath += "/" + segment;
      }
    }
  });
  return results.filter((v2, i, a2) => a2.indexOf(v2) === i);
}, "checkOptionalParameter");
var _decodeURI = /* @__PURE__ */ __name((value) => {
  if (!/[%+]/.test(value)) {
    return value;
  }
  if (value.indexOf("+") !== -1) {
    value = value.replace(/\+/g, " ");
  }
  return value.indexOf("%") !== -1 ? tryDecode(value, decodeURIComponent_) : value;
}, "_decodeURI");
var _getQueryParam = /* @__PURE__ */ __name((url, key, multiple) => {
  let encoded;
  if (!multiple && key && !/[%+]/.test(key)) {
    let keyIndex2 = url.indexOf("?", 8);
    if (keyIndex2 === -1) {
      return void 0;
    }
    if (!url.startsWith(key, keyIndex2 + 1)) {
      keyIndex2 = url.indexOf(`&${key}`, keyIndex2 + 1);
    }
    while (keyIndex2 !== -1) {
      const trailingKeyCode = url.charCodeAt(keyIndex2 + key.length + 1);
      if (trailingKeyCode === 61) {
        const valueIndex = keyIndex2 + key.length + 2;
        const endIndex = url.indexOf("&", valueIndex);
        return _decodeURI(url.slice(valueIndex, endIndex === -1 ? void 0 : endIndex));
      } else if (trailingKeyCode == 38 || isNaN(trailingKeyCode)) {
        return "";
      }
      keyIndex2 = url.indexOf(`&${key}`, keyIndex2 + 1);
    }
    encoded = /[%+]/.test(url);
    if (!encoded) {
      return void 0;
    }
  }
  const results = {};
  encoded ??= /[%+]/.test(url);
  let keyIndex = url.indexOf("?", 8);
  while (keyIndex !== -1) {
    const nextKeyIndex = url.indexOf("&", keyIndex + 1);
    let valueIndex = url.indexOf("=", keyIndex);
    if (valueIndex > nextKeyIndex && nextKeyIndex !== -1) {
      valueIndex = -1;
    }
    let name = url.slice(
      keyIndex + 1,
      valueIndex === -1 ? nextKeyIndex === -1 ? void 0 : nextKeyIndex : valueIndex
    );
    if (encoded) {
      name = _decodeURI(name);
    }
    keyIndex = nextKeyIndex;
    if (name === "") {
      continue;
    }
    let value;
    if (valueIndex === -1) {
      value = "";
    } else {
      value = url.slice(valueIndex + 1, nextKeyIndex === -1 ? void 0 : nextKeyIndex);
      if (encoded) {
        value = _decodeURI(value);
      }
    }
    if (multiple) {
      if (!(results[name] && Array.isArray(results[name]))) {
        results[name] = [];
      }
      ;
      results[name].push(value);
    } else {
      results[name] ??= value;
    }
  }
  return key ? results[key] : results;
}, "_getQueryParam");
var getQueryParam = _getQueryParam;
var getQueryParams = /* @__PURE__ */ __name((url, key) => {
  return _getQueryParam(url, key, true);
}, "getQueryParams");
var decodeURIComponent_ = decodeURIComponent;

// node_modules/hono/dist/request.js
var tryDecodeURIComponent = /* @__PURE__ */ __name((str) => tryDecode(str, decodeURIComponent_), "tryDecodeURIComponent");
var HonoRequest = class {
  static {
    __name(this, "HonoRequest");
  }
  /**
   * `.raw` can get the raw Request object.
   *
   * @see {@link https://hono.dev/docs/api/request#raw}
   *
   * @example
   * ```ts
   * // For Cloudflare Workers
   * app.post('/', async (c) => {
   *   const metadata = c.req.raw.cf?.hostMetadata?
   *   ...
   * })
   * ```
   */
  raw;
  #validatedData;
  // Short name of validatedData
  #matchResult;
  routeIndex = 0;
  /**
   * `.path` can get the pathname of the request.
   *
   * @see {@link https://hono.dev/docs/api/request#path}
   *
   * @example
   * ```ts
   * app.get('/about/me', (c) => {
   *   const pathname = c.req.path // `/about/me`
   * })
   * ```
   */
  path;
  bodyCache = {};
  constructor(request, path = "/", matchResult = [[]]) {
    this.raw = request;
    this.path = path;
    this.#matchResult = matchResult;
    this.#validatedData = {};
  }
  param(key) {
    return key ? this.#getDecodedParam(key) : this.#getAllDecodedParams();
  }
  #getDecodedParam(key) {
    const paramKey = this.#matchResult[0][this.routeIndex][1][key];
    const param = this.#getParamValue(paramKey);
    return param && /\%/.test(param) ? tryDecodeURIComponent(param) : param;
  }
  #getAllDecodedParams() {
    const decoded = {};
    const keys = Object.keys(this.#matchResult[0][this.routeIndex][1]);
    for (const key of keys) {
      const value = this.#getParamValue(this.#matchResult[0][this.routeIndex][1][key]);
      if (value !== void 0) {
        decoded[key] = /\%/.test(value) ? tryDecodeURIComponent(value) : value;
      }
    }
    return decoded;
  }
  #getParamValue(paramKey) {
    return this.#matchResult[1] ? this.#matchResult[1][paramKey] : paramKey;
  }
  query(key) {
    return getQueryParam(this.url, key);
  }
  queries(key) {
    return getQueryParams(this.url, key);
  }
  header(name) {
    if (name) {
      return this.raw.headers.get(name) ?? void 0;
    }
    const headerData = {};
    this.raw.headers.forEach((value, key) => {
      headerData[key] = value;
    });
    return headerData;
  }
  async parseBody(options) {
    return parseBody(this, options);
  }
  #cachedBody = /* @__PURE__ */ __name((key) => {
    const { bodyCache, raw: raw2 } = this;
    const cachedBody = bodyCache[key];
    if (cachedBody) {
      return cachedBody;
    }
    const anyCachedKey = Object.keys(bodyCache)[0];
    if (anyCachedKey) {
      return bodyCache[anyCachedKey].then((body) => {
        if (anyCachedKey === "json") {
          body = JSON.stringify(body);
        }
        return new Response(body)[key]();
      });
    }
    return bodyCache[key] = raw2[key]();
  }, "#cachedBody");
  /**
   * `.json()` can parse Request body of type `application/json`
   *
   * @see {@link https://hono.dev/docs/api/request#json}
   *
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.json()
   * })
   * ```
   */
  json() {
    return this.#cachedBody("text").then((text) => JSON.parse(text));
  }
  /**
   * `.text()` can parse Request body of type `text/plain`
   *
   * @see {@link https://hono.dev/docs/api/request#text}
   *
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.text()
   * })
   * ```
   */
  text() {
    return this.#cachedBody("text");
  }
  /**
   * `.arrayBuffer()` parse Request body as an `ArrayBuffer`
   *
   * @see {@link https://hono.dev/docs/api/request#arraybuffer}
   *
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.arrayBuffer()
   * })
   * ```
   */
  arrayBuffer() {
    return this.#cachedBody("arrayBuffer");
  }
  /**
   * Parses the request body as a `Blob`.
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.blob();
   * });
   * ```
   * @see https://hono.dev/docs/api/request#blob
   */
  blob() {
    return this.#cachedBody("blob");
  }
  /**
   * Parses the request body as `FormData`.
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.formData();
   * });
   * ```
   * @see https://hono.dev/docs/api/request#formdata
   */
  formData() {
    return this.#cachedBody("formData");
  }
  /**
   * Adds validated data to the request.
   *
   * @param target - The target of the validation.
   * @param data - The validated data to add.
   */
  addValidatedData(target, data) {
    this.#validatedData[target] = data;
  }
  valid(target) {
    return this.#validatedData[target];
  }
  /**
   * `.url()` can get the request url strings.
   *
   * @see {@link https://hono.dev/docs/api/request#url}
   *
   * @example
   * ```ts
   * app.get('/about/me', (c) => {
   *   const url = c.req.url // `http://localhost:8787/about/me`
   *   ...
   * })
   * ```
   */
  get url() {
    return this.raw.url;
  }
  /**
   * `.method()` can get the method name of the request.
   *
   * @see {@link https://hono.dev/docs/api/request#method}
   *
   * @example
   * ```ts
   * app.get('/about/me', (c) => {
   *   const method = c.req.method // `GET`
   * })
   * ```
   */
  get method() {
    return this.raw.method;
  }
  get [GET_MATCH_RESULT]() {
    return this.#matchResult;
  }
  /**
   * `.matchedRoutes()` can return a matched route in the handler
   *
   * @deprecated
   *
   * Use matchedRoutes helper defined in "hono/route" instead.
   *
   * @see {@link https://hono.dev/docs/api/request#matchedroutes}
   *
   * @example
   * ```ts
   * app.use('*', async function logger(c, next) {
   *   await next()
   *   c.req.matchedRoutes.forEach(({ handler, method, path }, i) => {
   *     const name = handler.name || (handler.length < 2 ? '[handler]' : '[middleware]')
   *     console.log(
   *       method,
   *       ' ',
   *       path,
   *       ' '.repeat(Math.max(10 - path.length, 0)),
   *       name,
   *       i === c.req.routeIndex ? '<- respond from here' : ''
   *     )
   *   })
   * })
   * ```
   */
  get matchedRoutes() {
    return this.#matchResult[0].map(([[, route]]) => route);
  }
  /**
   * `routePath()` can retrieve the path registered within the handler
   *
   * @deprecated
   *
   * Use routePath helper defined in "hono/route" instead.
   *
   * @see {@link https://hono.dev/docs/api/request#routepath}
   *
   * @example
   * ```ts
   * app.get('/posts/:id', (c) => {
   *   return c.json({ path: c.req.routePath })
   * })
   * ```
   */
  get routePath() {
    return this.#matchResult[0].map(([[, route]]) => route)[this.routeIndex].path;
  }
};

// node_modules/hono/dist/utils/html.js
var HtmlEscapedCallbackPhase = {
  Stringify: 1,
  BeforeStream: 2,
  Stream: 3
};
var raw = /* @__PURE__ */ __name((value, callbacks) => {
  const escapedString = new String(value);
  escapedString.isEscaped = true;
  escapedString.callbacks = callbacks;
  return escapedString;
}, "raw");
var resolveCallback = /* @__PURE__ */ __name(async (str, phase, preserveCallbacks, context, buffer) => {
  if (typeof str === "object" && !(str instanceof String)) {
    if (!(str instanceof Promise)) {
      str = str.toString();
    }
    if (str instanceof Promise) {
      str = await str;
    }
  }
  const callbacks = str.callbacks;
  if (!callbacks?.length) {
    return Promise.resolve(str);
  }
  if (buffer) {
    buffer[0] += str;
  } else {
    buffer = [str];
  }
  const resStr = Promise.all(callbacks.map((c) => c({ phase, buffer, context }))).then(
    (res) => Promise.all(
      res.filter(Boolean).map((str2) => resolveCallback(str2, phase, false, context, buffer))
    ).then(() => buffer[0])
  );
  if (preserveCallbacks) {
    return raw(await resStr, callbacks);
  } else {
    return resStr;
  }
}, "resolveCallback");

// node_modules/hono/dist/context.js
var TEXT_PLAIN = "text/plain; charset=UTF-8";
var setDefaultContentType = /* @__PURE__ */ __name((contentType, headers) => {
  return {
    "Content-Type": contentType,
    ...headers
  };
}, "setDefaultContentType");
var createResponseInstance = /* @__PURE__ */ __name((body, init) => new Response(body, init), "createResponseInstance");
var Context = class {
  static {
    __name(this, "Context");
  }
  #rawRequest;
  #req;
  /**
   * `.env` can get bindings (environment variables, secrets, KV namespaces, D1 database, R2 bucket etc.) in Cloudflare Workers.
   *
   * @see {@link https://hono.dev/docs/api/context#env}
   *
   * @example
   * ```ts
   * // Environment object for Cloudflare Workers
   * app.get('*', async c => {
   *   const counter = c.env.COUNTER
   * })
   * ```
   */
  env = {};
  #var;
  finalized = false;
  /**
   * `.error` can get the error object from the middleware if the Handler throws an error.
   *
   * @see {@link https://hono.dev/docs/api/context#error}
   *
   * @example
   * ```ts
   * app.use('*', async (c, next) => {
   *   await next()
   *   if (c.error) {
   *     // do something...
   *   }
   * })
   * ```
   */
  error;
  #status;
  #executionCtx;
  #res;
  #layout;
  #renderer;
  #notFoundHandler;
  #preparedHeaders;
  #matchResult;
  #path;
  /**
   * Creates an instance of the Context class.
   *
   * @param req - The Request object.
   * @param options - Optional configuration options for the context.
   */
  constructor(req, options) {
    this.#rawRequest = req;
    if (options) {
      this.#executionCtx = options.executionCtx;
      this.env = options.env;
      this.#notFoundHandler = options.notFoundHandler;
      this.#path = options.path;
      this.#matchResult = options.matchResult;
    }
  }
  /**
   * `.req` is the instance of {@link HonoRequest}.
   */
  get req() {
    this.#req ??= new HonoRequest(this.#rawRequest, this.#path, this.#matchResult);
    return this.#req;
  }
  /**
   * @see {@link https://hono.dev/docs/api/context#event}
   * The FetchEvent associated with the current request.
   *
   * @throws Will throw an error if the context does not have a FetchEvent.
   */
  get event() {
    if (this.#executionCtx && "respondWith" in this.#executionCtx) {
      return this.#executionCtx;
    } else {
      throw Error("This context has no FetchEvent");
    }
  }
  /**
   * @see {@link https://hono.dev/docs/api/context#executionctx}
   * The ExecutionContext associated with the current request.
   *
   * @throws Will throw an error if the context does not have an ExecutionContext.
   */
  get executionCtx() {
    if (this.#executionCtx) {
      return this.#executionCtx;
    } else {
      throw Error("This context has no ExecutionContext");
    }
  }
  /**
   * @see {@link https://hono.dev/docs/api/context#res}
   * The Response object for the current request.
   */
  get res() {
    return this.#res ||= createResponseInstance(null, {
      headers: this.#preparedHeaders ??= new Headers()
    });
  }
  /**
   * Sets the Response object for the current request.
   *
   * @param _res - The Response object to set.
   */
  set res(_res) {
    if (this.#res && _res) {
      _res = createResponseInstance(_res.body, _res);
      for (const [k, v2] of this.#res.headers.entries()) {
        if (k === "content-type") {
          continue;
        }
        if (k === "set-cookie") {
          const cookies = this.#res.headers.getSetCookie();
          _res.headers.delete("set-cookie");
          for (const cookie of cookies) {
            _res.headers.append("set-cookie", cookie);
          }
        } else {
          _res.headers.set(k, v2);
        }
      }
    }
    this.#res = _res;
    this.finalized = true;
  }
  /**
   * `.render()` can create a response within a layout.
   *
   * @see {@link https://hono.dev/docs/api/context#render-setrenderer}
   *
   * @example
   * ```ts
   * app.get('/', (c) => {
   *   return c.render('Hello!')
   * })
   * ```
   */
  render = /* @__PURE__ */ __name((...args) => {
    this.#renderer ??= (content) => this.html(content);
    return this.#renderer(...args);
  }, "render");
  /**
   * Sets the layout for the response.
   *
   * @param layout - The layout to set.
   * @returns The layout function.
   */
  setLayout = /* @__PURE__ */ __name((layout) => this.#layout = layout, "setLayout");
  /**
   * Gets the current layout for the response.
   *
   * @returns The current layout function.
   */
  getLayout = /* @__PURE__ */ __name(() => this.#layout, "getLayout");
  /**
   * `.setRenderer()` can set the layout in the custom middleware.
   *
   * @see {@link https://hono.dev/docs/api/context#render-setrenderer}
   *
   * @example
   * ```tsx
   * app.use('*', async (c, next) => {
   *   c.setRenderer((content) => {
   *     return c.html(
   *       <html>
   *         <body>
   *           <p>{content}</p>
   *         </body>
   *       </html>
   *     )
   *   })
   *   await next()
   * })
   * ```
   */
  setRenderer = /* @__PURE__ */ __name((renderer) => {
    this.#renderer = renderer;
  }, "setRenderer");
  /**
   * `.header()` can set headers.
   *
   * @see {@link https://hono.dev/docs/api/context#header}
   *
   * @example
   * ```ts
   * app.get('/welcome', (c) => {
   *   // Set headers
   *   c.header('X-Message', 'Hello!')
   *   c.header('Content-Type', 'text/plain')
   *
   *   return c.body('Thank you for coming')
   * })
   * ```
   */
  header = /* @__PURE__ */ __name((name, value, options) => {
    if (this.finalized) {
      this.#res = createResponseInstance(this.#res.body, this.#res);
    }
    const headers = this.#res ? this.#res.headers : this.#preparedHeaders ??= new Headers();
    if (value === void 0) {
      headers.delete(name);
    } else if (options?.append) {
      headers.append(name, value);
    } else {
      headers.set(name, value);
    }
  }, "header");
  status = /* @__PURE__ */ __name((status) => {
    this.#status = status;
  }, "status");
  /**
   * `.set()` can set the value specified by the key.
   *
   * @see {@link https://hono.dev/docs/api/context#set-get}
   *
   * @example
   * ```ts
   * app.use('*', async (c, next) => {
   *   c.set('message', 'Hono is hot!!')
   *   await next()
   * })
   * ```
   */
  set = /* @__PURE__ */ __name((key, value) => {
    this.#var ??= /* @__PURE__ */ new Map();
    this.#var.set(key, value);
  }, "set");
  /**
   * `.get()` can use the value specified by the key.
   *
   * @see {@link https://hono.dev/docs/api/context#set-get}
   *
   * @example
   * ```ts
   * app.get('/', (c) => {
   *   const message = c.get('message')
   *   return c.text(`The message is "${message}"`)
   * })
   * ```
   */
  get = /* @__PURE__ */ __name((key) => {
    return this.#var ? this.#var.get(key) : void 0;
  }, "get");
  /**
   * `.var` can access the value of a variable.
   *
   * @see {@link https://hono.dev/docs/api/context#var}
   *
   * @example
   * ```ts
   * const result = c.var.client.oneMethod()
   * ```
   */
  // c.var.propName is a read-only
  get var() {
    if (!this.#var) {
      return {};
    }
    return Object.fromEntries(this.#var);
  }
  #newResponse(data, arg, headers) {
    const responseHeaders = this.#res ? new Headers(this.#res.headers) : this.#preparedHeaders ?? new Headers();
    if (typeof arg === "object" && "headers" in arg) {
      const argHeaders = arg.headers instanceof Headers ? arg.headers : new Headers(arg.headers);
      for (const [key, value] of argHeaders) {
        if (key.toLowerCase() === "set-cookie") {
          responseHeaders.append(key, value);
        } else {
          responseHeaders.set(key, value);
        }
      }
    }
    if (headers) {
      for (const [k, v2] of Object.entries(headers)) {
        if (typeof v2 === "string") {
          responseHeaders.set(k, v2);
        } else {
          responseHeaders.delete(k);
          for (const v22 of v2) {
            responseHeaders.append(k, v22);
          }
        }
      }
    }
    const status = typeof arg === "number" ? arg : arg?.status ?? this.#status;
    return createResponseInstance(data, { status, headers: responseHeaders });
  }
  newResponse = /* @__PURE__ */ __name((...args) => this.#newResponse(...args), "newResponse");
  /**
   * `.body()` can return the HTTP response.
   * You can set headers with `.header()` and set HTTP status code with `.status`.
   * This can also be set in `.text()`, `.json()` and so on.
   *
   * @see {@link https://hono.dev/docs/api/context#body}
   *
   * @example
   * ```ts
   * app.get('/welcome', (c) => {
   *   // Set headers
   *   c.header('X-Message', 'Hello!')
   *   c.header('Content-Type', 'text/plain')
   *   // Set HTTP status code
   *   c.status(201)
   *
   *   // Return the response body
   *   return c.body('Thank you for coming')
   * })
   * ```
   */
  body = /* @__PURE__ */ __name((data, arg, headers) => this.#newResponse(data, arg, headers), "body");
  /**
   * `.text()` can render text as `Content-Type:text/plain`.
   *
   * @see {@link https://hono.dev/docs/api/context#text}
   *
   * @example
   * ```ts
   * app.get('/say', (c) => {
   *   return c.text('Hello!')
   * })
   * ```
   */
  text = /* @__PURE__ */ __name((text, arg, headers) => {
    return !this.#preparedHeaders && !this.#status && !arg && !headers && !this.finalized ? new Response(text) : this.#newResponse(
      text,
      arg,
      setDefaultContentType(TEXT_PLAIN, headers)
    );
  }, "text");
  /**
   * `.json()` can render JSON as `Content-Type:application/json`.
   *
   * @see {@link https://hono.dev/docs/api/context#json}
   *
   * @example
   * ```ts
   * app.get('/api', (c) => {
   *   return c.json({ message: 'Hello!' })
   * })
   * ```
   */
  json = /* @__PURE__ */ __name((object, arg, headers) => {
    return this.#newResponse(
      JSON.stringify(object),
      arg,
      setDefaultContentType("application/json", headers)
    );
  }, "json");
  html = /* @__PURE__ */ __name((html, arg, headers) => {
    const res = /* @__PURE__ */ __name((html2) => this.#newResponse(html2, arg, setDefaultContentType("text/html; charset=UTF-8", headers)), "res");
    return typeof html === "object" ? resolveCallback(html, HtmlEscapedCallbackPhase.Stringify, false, {}).then(res) : res(html);
  }, "html");
  /**
   * `.redirect()` can Redirect, default status code is 302.
   *
   * @see {@link https://hono.dev/docs/api/context#redirect}
   *
   * @example
   * ```ts
   * app.get('/redirect', (c) => {
   *   return c.redirect('/')
   * })
   * app.get('/redirect-permanently', (c) => {
   *   return c.redirect('/', 301)
   * })
   * ```
   */
  redirect = /* @__PURE__ */ __name((location, status) => {
    const locationString = String(location);
    this.header(
      "Location",
      // Multibyes should be encoded
      // eslint-disable-next-line no-control-regex
      !/[^\x00-\xFF]/.test(locationString) ? locationString : encodeURI(locationString)
    );
    return this.newResponse(null, status ?? 302);
  }, "redirect");
  /**
   * `.notFound()` can return the Not Found Response.
   *
   * @see {@link https://hono.dev/docs/api/context#notfound}
   *
   * @example
   * ```ts
   * app.get('/notfound', (c) => {
   *   return c.notFound()
   * })
   * ```
   */
  notFound = /* @__PURE__ */ __name(() => {
    this.#notFoundHandler ??= () => createResponseInstance();
    return this.#notFoundHandler(this);
  }, "notFound");
};

// node_modules/hono/dist/router.js
var METHOD_NAME_ALL = "ALL";
var METHOD_NAME_ALL_LOWERCASE = "all";
var METHODS = ["get", "post", "put", "delete", "options", "patch"];
var MESSAGE_MATCHER_IS_ALREADY_BUILT = "Can not add a route since the matcher is already built.";
var UnsupportedPathError = class extends Error {
  static {
    __name(this, "UnsupportedPathError");
  }
};

// node_modules/hono/dist/utils/constants.js
var COMPOSED_HANDLER = "__COMPOSED_HANDLER";

// node_modules/hono/dist/hono-base.js
var notFoundHandler = /* @__PURE__ */ __name((c) => {
  return c.text("404 Not Found", 404);
}, "notFoundHandler");
var errorHandler = /* @__PURE__ */ __name((err, c) => {
  if ("getResponse" in err) {
    const res = err.getResponse();
    return c.newResponse(res.body, res);
  }
  console.error(err);
  return c.text("Internal Server Error", 500);
}, "errorHandler");
var Hono = class _Hono {
  static {
    __name(this, "_Hono");
  }
  get;
  post;
  put;
  delete;
  options;
  patch;
  all;
  on;
  use;
  /*
    This class is like an abstract class and does not have a router.
    To use it, inherit the class and implement router in the constructor.
  */
  router;
  getPath;
  // Cannot use `#` because it requires visibility at JavaScript runtime.
  _basePath = "/";
  #path = "/";
  routes = [];
  constructor(options = {}) {
    const allMethods = [...METHODS, METHOD_NAME_ALL_LOWERCASE];
    allMethods.forEach((method) => {
      this[method] = (args1, ...args) => {
        if (typeof args1 === "string") {
          this.#path = args1;
        } else {
          this.#addRoute(method, this.#path, args1);
        }
        args.forEach((handler) => {
          this.#addRoute(method, this.#path, handler);
        });
        return this;
      };
    });
    this.on = (method, path, ...handlers) => {
      for (const p2 of [path].flat()) {
        this.#path = p2;
        for (const m2 of [method].flat()) {
          handlers.map((handler) => {
            this.#addRoute(m2.toUpperCase(), this.#path, handler);
          });
        }
      }
      return this;
    };
    this.use = (arg1, ...handlers) => {
      if (typeof arg1 === "string") {
        this.#path = arg1;
      } else {
        this.#path = "*";
        handlers.unshift(arg1);
      }
      handlers.forEach((handler) => {
        this.#addRoute(METHOD_NAME_ALL, this.#path, handler);
      });
      return this;
    };
    const { strict, ...optionsWithoutStrict } = options;
    Object.assign(this, optionsWithoutStrict);
    this.getPath = strict ?? true ? options.getPath ?? getPath : getPathNoStrict;
  }
  #clone() {
    const clone = new _Hono({
      router: this.router,
      getPath: this.getPath
    });
    clone.errorHandler = this.errorHandler;
    clone.#notFoundHandler = this.#notFoundHandler;
    clone.routes = this.routes;
    return clone;
  }
  #notFoundHandler = notFoundHandler;
  // Cannot use `#` because it requires visibility at JavaScript runtime.
  errorHandler = errorHandler;
  /**
   * `.route()` allows grouping other Hono instance in routes.
   *
   * @see {@link https://hono.dev/docs/api/routing#grouping}
   *
   * @param {string} path - base Path
   * @param {Hono} app - other Hono instance
   * @returns {Hono} routed Hono instance
   *
   * @example
   * ```ts
   * const app = new Hono()
   * const app2 = new Hono()
   *
   * app2.get("/user", (c) => c.text("user"))
   * app.route("/api", app2) // GET /api/user
   * ```
   */
  route(path, app2) {
    const subApp = this.basePath(path);
    app2.routes.map((r) => {
      let handler;
      if (app2.errorHandler === errorHandler) {
        handler = r.handler;
      } else {
        handler = /* @__PURE__ */ __name(async (c, next) => (await compose([], app2.errorHandler)(c, () => r.handler(c, next))).res, "handler");
        handler[COMPOSED_HANDLER] = r.handler;
      }
      subApp.#addRoute(r.method, r.path, handler);
    });
    return this;
  }
  /**
   * `.basePath()` allows base paths to be specified.
   *
   * @see {@link https://hono.dev/docs/api/routing#base-path}
   *
   * @param {string} path - base Path
   * @returns {Hono} changed Hono instance
   *
   * @example
   * ```ts
   * const api = new Hono().basePath('/api')
   * ```
   */
  basePath(path) {
    const subApp = this.#clone();
    subApp._basePath = mergePath(this._basePath, path);
    return subApp;
  }
  /**
   * `.onError()` handles an error and returns a customized Response.
   *
   * @see {@link https://hono.dev/docs/api/hono#error-handling}
   *
   * @param {ErrorHandler} handler - request Handler for error
   * @returns {Hono} changed Hono instance
   *
   * @example
   * ```ts
   * app.onError((err, c) => {
   *   console.error(`${err}`)
   *   return c.text('Custom Error Message', 500)
   * })
   * ```
   */
  onError = /* @__PURE__ */ __name((handler) => {
    this.errorHandler = handler;
    return this;
  }, "onError");
  /**
   * `.notFound()` allows you to customize a Not Found Response.
   *
   * @see {@link https://hono.dev/docs/api/hono#not-found}
   *
   * @param {NotFoundHandler} handler - request handler for not-found
   * @returns {Hono} changed Hono instance
   *
   * @example
   * ```ts
   * app.notFound((c) => {
   *   return c.text('Custom 404 Message', 404)
   * })
   * ```
   */
  notFound = /* @__PURE__ */ __name((handler) => {
    this.#notFoundHandler = handler;
    return this;
  }, "notFound");
  /**
   * `.mount()` allows you to mount applications built with other frameworks into your Hono application.
   *
   * @see {@link https://hono.dev/docs/api/hono#mount}
   *
   * @param {string} path - base Path
   * @param {Function} applicationHandler - other Request Handler
   * @param {MountOptions} [options] - options of `.mount()`
   * @returns {Hono} mounted Hono instance
   *
   * @example
   * ```ts
   * import { Router as IttyRouter } from 'itty-router'
   * import { Hono } from 'hono'
   * // Create itty-router application
   * const ittyRouter = IttyRouter()
   * // GET /itty-router/hello
   * ittyRouter.get('/hello', () => new Response('Hello from itty-router'))
   *
   * const app = new Hono()
   * app.mount('/itty-router', ittyRouter.handle)
   * ```
   *
   * @example
   * ```ts
   * const app = new Hono()
   * // Send the request to another application without modification.
   * app.mount('/app', anotherApp, {
   *   replaceRequest: (req) => req,
   * })
   * ```
   */
  mount(path, applicationHandler, options) {
    let replaceRequest;
    let optionHandler;
    if (options) {
      if (typeof options === "function") {
        optionHandler = options;
      } else {
        optionHandler = options.optionHandler;
        if (options.replaceRequest === false) {
          replaceRequest = /* @__PURE__ */ __name((request) => request, "replaceRequest");
        } else {
          replaceRequest = options.replaceRequest;
        }
      }
    }
    const getOptions = optionHandler ? (c) => {
      const options2 = optionHandler(c);
      return Array.isArray(options2) ? options2 : [options2];
    } : (c) => {
      let executionContext = void 0;
      try {
        executionContext = c.executionCtx;
      } catch {
      }
      return [c.env, executionContext];
    };
    replaceRequest ||= (() => {
      const mergedPath = mergePath(this._basePath, path);
      const pathPrefixLength = mergedPath === "/" ? 0 : mergedPath.length;
      return (request) => {
        const url = new URL(request.url);
        url.pathname = url.pathname.slice(pathPrefixLength) || "/";
        return new Request(url, request);
      };
    })();
    const handler = /* @__PURE__ */ __name(async (c, next) => {
      const res = await applicationHandler(replaceRequest(c.req.raw), ...getOptions(c));
      if (res) {
        return res;
      }
      await next();
    }, "handler");
    this.#addRoute(METHOD_NAME_ALL, mergePath(path, "*"), handler);
    return this;
  }
  #addRoute(method, path, handler) {
    method = method.toUpperCase();
    path = mergePath(this._basePath, path);
    const r = { basePath: this._basePath, path, method, handler };
    this.router.add(method, path, [handler, r]);
    this.routes.push(r);
  }
  #handleError(err, c) {
    if (err instanceof Error) {
      return this.errorHandler(err, c);
    }
    throw err;
  }
  #dispatch(request, executionCtx, env, method) {
    if (method === "HEAD") {
      return (async () => new Response(null, await this.#dispatch(request, executionCtx, env, "GET")))();
    }
    const path = this.getPath(request, { env });
    const matchResult = this.router.match(method, path);
    const c = new Context(request, {
      path,
      matchResult,
      env,
      executionCtx,
      notFoundHandler: this.#notFoundHandler
    });
    if (matchResult[0].length === 1) {
      let res;
      try {
        res = matchResult[0][0][0][0](c, async () => {
          c.res = await this.#notFoundHandler(c);
        });
      } catch (err) {
        return this.#handleError(err, c);
      }
      return res instanceof Promise ? res.then(
        (resolved) => resolved || (c.finalized ? c.res : this.#notFoundHandler(c))
      ).catch((err) => this.#handleError(err, c)) : res ?? this.#notFoundHandler(c);
    }
    const composed = compose(matchResult[0], this.errorHandler, this.#notFoundHandler);
    return (async () => {
      try {
        const context = await composed(c);
        if (!context.finalized) {
          throw new Error(
            "Context is not finalized. Did you forget to return a Response object or `await next()`?"
          );
        }
        return context.res;
      } catch (err) {
        return this.#handleError(err, c);
      }
    })();
  }
  /**
   * `.fetch()` will be entry point of your app.
   *
   * @see {@link https://hono.dev/docs/api/hono#fetch}
   *
   * @param {Request} request - request Object of request
   * @param {Env} Env - env Object
   * @param {ExecutionContext} - context of execution
   * @returns {Response | Promise<Response>} response of request
   *
   */
  fetch = /* @__PURE__ */ __name((request, ...rest) => {
    return this.#dispatch(request, rest[1], rest[0], request.method);
  }, "fetch");
  /**
   * `.request()` is a useful method for testing.
   * You can pass a URL or pathname to send a GET request.
   * app will return a Response object.
   * ```ts
   * test('GET /hello is ok', async () => {
   *   const res = await app.request('/hello')
   *   expect(res.status).toBe(200)
   * })
   * ```
   * @see https://hono.dev/docs/api/hono#request
   */
  request = /* @__PURE__ */ __name((input, requestInit, Env, executionCtx) => {
    if (input instanceof Request) {
      return this.fetch(requestInit ? new Request(input, requestInit) : input, Env, executionCtx);
    }
    input = input.toString();
    return this.fetch(
      new Request(
        /^https?:\/\//.test(input) ? input : `http://localhost${mergePath("/", input)}`,
        requestInit
      ),
      Env,
      executionCtx
    );
  }, "request");
  /**
   * `.fire()` automatically adds a global fetch event listener.
   * This can be useful for environments that adhere to the Service Worker API, such as non-ES module Cloudflare Workers.
   * @deprecated
   * Use `fire` from `hono/service-worker` instead.
   * ```ts
   * import { Hono } from 'hono'
   * import { fire } from 'hono/service-worker'
   *
   * const app = new Hono()
   * // ...
   * fire(app)
   * ```
   * @see https://hono.dev/docs/api/hono#fire
   * @see https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API
   * @see https://developers.cloudflare.com/workers/reference/migrate-to-module-workers/
   */
  fire = /* @__PURE__ */ __name(() => {
    addEventListener("fetch", (event) => {
      event.respondWith(this.#dispatch(event.request, event, void 0, event.request.method));
    });
  }, "fire");
};

// node_modules/hono/dist/router/reg-exp-router/matcher.js
var emptyParam = [];
function match(method, path) {
  const matchers = this.buildAllMatchers();
  const match2 = /* @__PURE__ */ __name(((method2, path2) => {
    const matcher = matchers[method2] || matchers[METHOD_NAME_ALL];
    const staticMatch = matcher[2][path2];
    if (staticMatch) {
      return staticMatch;
    }
    const match3 = path2.match(matcher[0]);
    if (!match3) {
      return [[], emptyParam];
    }
    const index = match3.indexOf("", 1);
    return [matcher[1][index], match3];
  }), "match2");
  this.match = match2;
  return match2(method, path);
}
__name(match, "match");

// node_modules/hono/dist/router/reg-exp-router/node.js
var LABEL_REG_EXP_STR = "[^/]+";
var ONLY_WILDCARD_REG_EXP_STR = ".*";
var TAIL_WILDCARD_REG_EXP_STR = "(?:|/.*)";
var PATH_ERROR = /* @__PURE__ */ Symbol();
var regExpMetaChars = new Set(".\\+*[^]$()");
function compareKey(a2, b) {
  if (a2.length === 1) {
    return b.length === 1 ? a2 < b ? -1 : 1 : -1;
  }
  if (b.length === 1) {
    return 1;
  }
  if (a2 === ONLY_WILDCARD_REG_EXP_STR || a2 === TAIL_WILDCARD_REG_EXP_STR) {
    return 1;
  } else if (b === ONLY_WILDCARD_REG_EXP_STR || b === TAIL_WILDCARD_REG_EXP_STR) {
    return -1;
  }
  if (a2 === LABEL_REG_EXP_STR) {
    return 1;
  } else if (b === LABEL_REG_EXP_STR) {
    return -1;
  }
  return a2.length === b.length ? a2 < b ? -1 : 1 : b.length - a2.length;
}
__name(compareKey, "compareKey");
var Node = class _Node {
  static {
    __name(this, "_Node");
  }
  #index;
  #varIndex;
  #children = /* @__PURE__ */ Object.create(null);
  insert(tokens, index, paramMap, context, pathErrorCheckOnly) {
    if (tokens.length === 0) {
      if (this.#index !== void 0) {
        throw PATH_ERROR;
      }
      if (pathErrorCheckOnly) {
        return;
      }
      this.#index = index;
      return;
    }
    const [token, ...restTokens] = tokens;
    const pattern = token === "*" ? restTokens.length === 0 ? ["", "", ONLY_WILDCARD_REG_EXP_STR] : ["", "", LABEL_REG_EXP_STR] : token === "/*" ? ["", "", TAIL_WILDCARD_REG_EXP_STR] : token.match(/^\:([^\{\}]+)(?:\{(.+)\})?$/);
    let node;
    if (pattern) {
      const name = pattern[1];
      let regexpStr = pattern[2] || LABEL_REG_EXP_STR;
      if (name && pattern[2]) {
        if (regexpStr === ".*") {
          throw PATH_ERROR;
        }
        regexpStr = regexpStr.replace(/^\((?!\?:)(?=[^)]+\)$)/, "(?:");
        if (/\((?!\?:)/.test(regexpStr)) {
          throw PATH_ERROR;
        }
      }
      node = this.#children[regexpStr];
      if (!node) {
        if (Object.keys(this.#children).some(
          (k) => k !== ONLY_WILDCARD_REG_EXP_STR && k !== TAIL_WILDCARD_REG_EXP_STR
        )) {
          throw PATH_ERROR;
        }
        if (pathErrorCheckOnly) {
          return;
        }
        node = this.#children[regexpStr] = new _Node();
        if (name !== "") {
          node.#varIndex = context.varIndex++;
        }
      }
      if (!pathErrorCheckOnly && name !== "") {
        paramMap.push([name, node.#varIndex]);
      }
    } else {
      node = this.#children[token];
      if (!node) {
        if (Object.keys(this.#children).some(
          (k) => k.length > 1 && k !== ONLY_WILDCARD_REG_EXP_STR && k !== TAIL_WILDCARD_REG_EXP_STR
        )) {
          throw PATH_ERROR;
        }
        if (pathErrorCheckOnly) {
          return;
        }
        node = this.#children[token] = new _Node();
      }
    }
    node.insert(restTokens, index, paramMap, context, pathErrorCheckOnly);
  }
  buildRegExpStr() {
    const childKeys = Object.keys(this.#children).sort(compareKey);
    const strList = childKeys.map((k) => {
      const c = this.#children[k];
      return (typeof c.#varIndex === "number" ? `(${k})@${c.#varIndex}` : regExpMetaChars.has(k) ? `\\${k}` : k) + c.buildRegExpStr();
    });
    if (typeof this.#index === "number") {
      strList.unshift(`#${this.#index}`);
    }
    if (strList.length === 0) {
      return "";
    }
    if (strList.length === 1) {
      return strList[0];
    }
    return "(?:" + strList.join("|") + ")";
  }
};

// node_modules/hono/dist/router/reg-exp-router/trie.js
var Trie = class {
  static {
    __name(this, "Trie");
  }
  #context = { varIndex: 0 };
  #root = new Node();
  insert(path, index, pathErrorCheckOnly) {
    const paramAssoc = [];
    const groups = [];
    for (let i = 0; ; ) {
      let replaced = false;
      path = path.replace(/\{[^}]+\}/g, (m2) => {
        const mark = `@\\${i}`;
        groups[i] = [mark, m2];
        i++;
        replaced = true;
        return mark;
      });
      if (!replaced) {
        break;
      }
    }
    const tokens = path.match(/(?::[^\/]+)|(?:\/\*$)|./g) || [];
    for (let i = groups.length - 1; i >= 0; i--) {
      const [mark] = groups[i];
      for (let j = tokens.length - 1; j >= 0; j--) {
        if (tokens[j].indexOf(mark) !== -1) {
          tokens[j] = tokens[j].replace(mark, groups[i][1]);
          break;
        }
      }
    }
    this.#root.insert(tokens, index, paramAssoc, this.#context, pathErrorCheckOnly);
    return paramAssoc;
  }
  buildRegExp() {
    let regexp = this.#root.buildRegExpStr();
    if (regexp === "") {
      return [/^$/, [], []];
    }
    let captureIndex = 0;
    const indexReplacementMap = [];
    const paramReplacementMap = [];
    regexp = regexp.replace(/#(\d+)|@(\d+)|\.\*\$/g, (_2, handlerIndex, paramIndex) => {
      if (handlerIndex !== void 0) {
        indexReplacementMap[++captureIndex] = Number(handlerIndex);
        return "$()";
      }
      if (paramIndex !== void 0) {
        paramReplacementMap[Number(paramIndex)] = ++captureIndex;
        return "";
      }
      return "";
    });
    return [new RegExp(`^${regexp}`), indexReplacementMap, paramReplacementMap];
  }
};

// node_modules/hono/dist/router/reg-exp-router/router.js
var nullMatcher = [/^$/, [], /* @__PURE__ */ Object.create(null)];
var wildcardRegExpCache = /* @__PURE__ */ Object.create(null);
function buildWildcardRegExp(path) {
  return wildcardRegExpCache[path] ??= new RegExp(
    path === "*" ? "" : `^${path.replace(
      /\/\*$|([.\\+*[^\]$()])/g,
      (_2, metaChar) => metaChar ? `\\${metaChar}` : "(?:|/.*)"
    )}$`
  );
}
__name(buildWildcardRegExp, "buildWildcardRegExp");
function clearWildcardRegExpCache() {
  wildcardRegExpCache = /* @__PURE__ */ Object.create(null);
}
__name(clearWildcardRegExpCache, "clearWildcardRegExpCache");
function buildMatcherFromPreprocessedRoutes(routes) {
  const trie = new Trie();
  const handlerData = [];
  if (routes.length === 0) {
    return nullMatcher;
  }
  const routesWithStaticPathFlag = routes.map(
    (route) => [!/\*|\/:/.test(route[0]), ...route]
  ).sort(
    ([isStaticA, pathA], [isStaticB, pathB]) => isStaticA ? 1 : isStaticB ? -1 : pathA.length - pathB.length
  );
  const staticMap = /* @__PURE__ */ Object.create(null);
  for (let i = 0, j = -1, len = routesWithStaticPathFlag.length; i < len; i++) {
    const [pathErrorCheckOnly, path, handlers] = routesWithStaticPathFlag[i];
    if (pathErrorCheckOnly) {
      staticMap[path] = [handlers.map(([h]) => [h, /* @__PURE__ */ Object.create(null)]), emptyParam];
    } else {
      j++;
    }
    let paramAssoc;
    try {
      paramAssoc = trie.insert(path, j, pathErrorCheckOnly);
    } catch (e) {
      throw e === PATH_ERROR ? new UnsupportedPathError(path) : e;
    }
    if (pathErrorCheckOnly) {
      continue;
    }
    handlerData[j] = handlers.map(([h, paramCount]) => {
      const paramIndexMap = /* @__PURE__ */ Object.create(null);
      paramCount -= 1;
      for (; paramCount >= 0; paramCount--) {
        const [key, value] = paramAssoc[paramCount];
        paramIndexMap[key] = value;
      }
      return [h, paramIndexMap];
    });
  }
  const [regexp, indexReplacementMap, paramReplacementMap] = trie.buildRegExp();
  for (let i = 0, len = handlerData.length; i < len; i++) {
    for (let j = 0, len2 = handlerData[i].length; j < len2; j++) {
      const map = handlerData[i][j]?.[1];
      if (!map) {
        continue;
      }
      const keys = Object.keys(map);
      for (let k = 0, len3 = keys.length; k < len3; k++) {
        map[keys[k]] = paramReplacementMap[map[keys[k]]];
      }
    }
  }
  const handlerMap = [];
  for (const i in indexReplacementMap) {
    handlerMap[i] = handlerData[indexReplacementMap[i]];
  }
  return [regexp, handlerMap, staticMap];
}
__name(buildMatcherFromPreprocessedRoutes, "buildMatcherFromPreprocessedRoutes");
function findMiddleware(middleware, path) {
  if (!middleware) {
    return void 0;
  }
  for (const k of Object.keys(middleware).sort((a2, b) => b.length - a2.length)) {
    if (buildWildcardRegExp(k).test(path)) {
      return [...middleware[k]];
    }
  }
  return void 0;
}
__name(findMiddleware, "findMiddleware");
var RegExpRouter = class {
  static {
    __name(this, "RegExpRouter");
  }
  name = "RegExpRouter";
  #middleware;
  #routes;
  constructor() {
    this.#middleware = { [METHOD_NAME_ALL]: /* @__PURE__ */ Object.create(null) };
    this.#routes = { [METHOD_NAME_ALL]: /* @__PURE__ */ Object.create(null) };
  }
  add(method, path, handler) {
    const middleware = this.#middleware;
    const routes = this.#routes;
    if (!middleware || !routes) {
      throw new Error(MESSAGE_MATCHER_IS_ALREADY_BUILT);
    }
    if (!middleware[method]) {
      ;
      [middleware, routes].forEach((handlerMap) => {
        handlerMap[method] = /* @__PURE__ */ Object.create(null);
        Object.keys(handlerMap[METHOD_NAME_ALL]).forEach((p2) => {
          handlerMap[method][p2] = [...handlerMap[METHOD_NAME_ALL][p2]];
        });
      });
    }
    if (path === "/*") {
      path = "*";
    }
    const paramCount = (path.match(/\/:/g) || []).length;
    if (/\*$/.test(path)) {
      const re = buildWildcardRegExp(path);
      if (method === METHOD_NAME_ALL) {
        Object.keys(middleware).forEach((m2) => {
          middleware[m2][path] ||= findMiddleware(middleware[m2], path) || findMiddleware(middleware[METHOD_NAME_ALL], path) || [];
        });
      } else {
        middleware[method][path] ||= findMiddleware(middleware[method], path) || findMiddleware(middleware[METHOD_NAME_ALL], path) || [];
      }
      Object.keys(middleware).forEach((m2) => {
        if (method === METHOD_NAME_ALL || method === m2) {
          Object.keys(middleware[m2]).forEach((p2) => {
            re.test(p2) && middleware[m2][p2].push([handler, paramCount]);
          });
        }
      });
      Object.keys(routes).forEach((m2) => {
        if (method === METHOD_NAME_ALL || method === m2) {
          Object.keys(routes[m2]).forEach(
            (p2) => re.test(p2) && routes[m2][p2].push([handler, paramCount])
          );
        }
      });
      return;
    }
    const paths = checkOptionalParameter(path) || [path];
    for (let i = 0, len = paths.length; i < len; i++) {
      const path2 = paths[i];
      Object.keys(routes).forEach((m2) => {
        if (method === METHOD_NAME_ALL || method === m2) {
          routes[m2][path2] ||= [
            ...findMiddleware(middleware[m2], path2) || findMiddleware(middleware[METHOD_NAME_ALL], path2) || []
          ];
          routes[m2][path2].push([handler, paramCount - len + i + 1]);
        }
      });
    }
  }
  match = match;
  buildAllMatchers() {
    const matchers = /* @__PURE__ */ Object.create(null);
    Object.keys(this.#routes).concat(Object.keys(this.#middleware)).forEach((method) => {
      matchers[method] ||= this.#buildMatcher(method);
    });
    this.#middleware = this.#routes = void 0;
    clearWildcardRegExpCache();
    return matchers;
  }
  #buildMatcher(method) {
    const routes = [];
    let hasOwnRoute = method === METHOD_NAME_ALL;
    [this.#middleware, this.#routes].forEach((r) => {
      const ownRoute = r[method] ? Object.keys(r[method]).map((path) => [path, r[method][path]]) : [];
      if (ownRoute.length !== 0) {
        hasOwnRoute ||= true;
        routes.push(...ownRoute);
      } else if (method !== METHOD_NAME_ALL) {
        routes.push(
          ...Object.keys(r[METHOD_NAME_ALL]).map((path) => [path, r[METHOD_NAME_ALL][path]])
        );
      }
    });
    if (!hasOwnRoute) {
      return null;
    } else {
      return buildMatcherFromPreprocessedRoutes(routes);
    }
  }
};

// node_modules/hono/dist/router/smart-router/router.js
var SmartRouter = class {
  static {
    __name(this, "SmartRouter");
  }
  name = "SmartRouter";
  #routers = [];
  #routes = [];
  constructor(init) {
    this.#routers = init.routers;
  }
  add(method, path, handler) {
    if (!this.#routes) {
      throw new Error(MESSAGE_MATCHER_IS_ALREADY_BUILT);
    }
    this.#routes.push([method, path, handler]);
  }
  match(method, path) {
    if (!this.#routes) {
      throw new Error("Fatal error");
    }
    const routers = this.#routers;
    const routes = this.#routes;
    const len = routers.length;
    let i = 0;
    let res;
    for (; i < len; i++) {
      const router = routers[i];
      try {
        for (let i2 = 0, len2 = routes.length; i2 < len2; i2++) {
          router.add(...routes[i2]);
        }
        res = router.match(method, path);
      } catch (e) {
        if (e instanceof UnsupportedPathError) {
          continue;
        }
        throw e;
      }
      this.match = router.match.bind(router);
      this.#routers = [router];
      this.#routes = void 0;
      break;
    }
    if (i === len) {
      throw new Error("Fatal error");
    }
    this.name = `SmartRouter + ${this.activeRouter.name}`;
    return res;
  }
  get activeRouter() {
    if (this.#routes || this.#routers.length !== 1) {
      throw new Error("No active router has been determined yet.");
    }
    return this.#routers[0];
  }
};

// node_modules/hono/dist/router/trie-router/node.js
var emptyParams = /* @__PURE__ */ Object.create(null);
var hasChildren = /* @__PURE__ */ __name((children) => {
  for (const _2 in children) {
    return true;
  }
  return false;
}, "hasChildren");
var Node2 = class _Node2 {
  static {
    __name(this, "_Node");
  }
  #methods;
  #children;
  #patterns;
  #order = 0;
  #params = emptyParams;
  constructor(method, handler, children) {
    this.#children = children || /* @__PURE__ */ Object.create(null);
    this.#methods = [];
    if (method && handler) {
      const m2 = /* @__PURE__ */ Object.create(null);
      m2[method] = { handler, possibleKeys: [], score: 0 };
      this.#methods = [m2];
    }
    this.#patterns = [];
  }
  insert(method, path, handler) {
    this.#order = ++this.#order;
    let curNode = this;
    const parts = splitRoutingPath(path);
    const possibleKeys = [];
    for (let i = 0, len = parts.length; i < len; i++) {
      const p2 = parts[i];
      const nextP = parts[i + 1];
      const pattern = getPattern(p2, nextP);
      const key = Array.isArray(pattern) ? pattern[0] : p2;
      if (key in curNode.#children) {
        curNode = curNode.#children[key];
        if (pattern) {
          possibleKeys.push(pattern[1]);
        }
        continue;
      }
      curNode.#children[key] = new _Node2();
      if (pattern) {
        curNode.#patterns.push(pattern);
        possibleKeys.push(pattern[1]);
      }
      curNode = curNode.#children[key];
    }
    curNode.#methods.push({
      [method]: {
        handler,
        possibleKeys: possibleKeys.filter((v2, i, a2) => a2.indexOf(v2) === i),
        score: this.#order
      }
    });
    return curNode;
  }
  #pushHandlerSets(handlerSets, node, method, nodeParams, params) {
    for (let i = 0, len = node.#methods.length; i < len; i++) {
      const m2 = node.#methods[i];
      const handlerSet = m2[method] || m2[METHOD_NAME_ALL];
      const processedSet = {};
      if (handlerSet !== void 0) {
        handlerSet.params = /* @__PURE__ */ Object.create(null);
        handlerSets.push(handlerSet);
        if (nodeParams !== emptyParams || params && params !== emptyParams) {
          for (let i2 = 0, len2 = handlerSet.possibleKeys.length; i2 < len2; i2++) {
            const key = handlerSet.possibleKeys[i2];
            const processed = processedSet[handlerSet.score];
            handlerSet.params[key] = params?.[key] && !processed ? params[key] : nodeParams[key] ?? params?.[key];
            processedSet[handlerSet.score] = true;
          }
        }
      }
    }
  }
  search(method, path) {
    const handlerSets = [];
    this.#params = emptyParams;
    const curNode = this;
    let curNodes = [curNode];
    const parts = splitPath(path);
    const curNodesQueue = [];
    const len = parts.length;
    let partOffsets = null;
    for (let i = 0; i < len; i++) {
      const part = parts[i];
      const isLast = i === len - 1;
      const tempNodes = [];
      for (let j = 0, len2 = curNodes.length; j < len2; j++) {
        const node = curNodes[j];
        const nextNode = node.#children[part];
        if (nextNode) {
          nextNode.#params = node.#params;
          if (isLast) {
            if (nextNode.#children["*"]) {
              this.#pushHandlerSets(handlerSets, nextNode.#children["*"], method, node.#params);
            }
            this.#pushHandlerSets(handlerSets, nextNode, method, node.#params);
          } else {
            tempNodes.push(nextNode);
          }
        }
        for (let k = 0, len3 = node.#patterns.length; k < len3; k++) {
          const pattern = node.#patterns[k];
          const params = node.#params === emptyParams ? {} : { ...node.#params };
          if (pattern === "*") {
            const astNode = node.#children["*"];
            if (astNode) {
              this.#pushHandlerSets(handlerSets, astNode, method, node.#params);
              astNode.#params = params;
              tempNodes.push(astNode);
            }
            continue;
          }
          const [key, name, matcher] = pattern;
          if (!part && !(matcher instanceof RegExp)) {
            continue;
          }
          const child = node.#children[key];
          if (matcher instanceof RegExp) {
            if (partOffsets === null) {
              partOffsets = new Array(len);
              let offset = path[0] === "/" ? 1 : 0;
              for (let p2 = 0; p2 < len; p2++) {
                partOffsets[p2] = offset;
                offset += parts[p2].length + 1;
              }
            }
            const restPathString = path.substring(partOffsets[i]);
            const m2 = matcher.exec(restPathString);
            if (m2) {
              params[name] = m2[0];
              this.#pushHandlerSets(handlerSets, child, method, node.#params, params);
              if (hasChildren(child.#children)) {
                child.#params = params;
                const componentCount = m2[0].match(/\//)?.length ?? 0;
                const targetCurNodes = curNodesQueue[componentCount] ||= [];
                targetCurNodes.push(child);
              }
              continue;
            }
          }
          if (matcher === true || matcher.test(part)) {
            params[name] = part;
            if (isLast) {
              this.#pushHandlerSets(handlerSets, child, method, params, node.#params);
              if (child.#children["*"]) {
                this.#pushHandlerSets(
                  handlerSets,
                  child.#children["*"],
                  method,
                  params,
                  node.#params
                );
              }
            } else {
              child.#params = params;
              tempNodes.push(child);
            }
          }
        }
      }
      const shifted = curNodesQueue.shift();
      curNodes = shifted ? tempNodes.concat(shifted) : tempNodes;
    }
    if (handlerSets.length > 1) {
      handlerSets.sort((a2, b) => {
        return a2.score - b.score;
      });
    }
    return [handlerSets.map(({ handler, params }) => [handler, params])];
  }
};

// node_modules/hono/dist/router/trie-router/router.js
var TrieRouter = class {
  static {
    __name(this, "TrieRouter");
  }
  name = "TrieRouter";
  #node;
  constructor() {
    this.#node = new Node2();
  }
  add(method, path, handler) {
    const results = checkOptionalParameter(path);
    if (results) {
      for (let i = 0, len = results.length; i < len; i++) {
        this.#node.insert(method, results[i], handler);
      }
      return;
    }
    this.#node.insert(method, path, handler);
  }
  match(method, path) {
    return this.#node.search(method, path);
  }
};

// node_modules/hono/dist/hono.js
var Hono2 = class extends Hono {
  static {
    __name(this, "Hono");
  }
  /**
   * Creates an instance of the Hono class.
   *
   * @param options - Optional configuration options for the Hono instance.
   */
  constructor(options = {}) {
    super(options);
    this.router = options.router ?? new SmartRouter({
      routers: [new RegExpRouter(), new TrieRouter()]
    });
  }
};

// node_modules/hono/dist/middleware/cors/index.js
var cors = /* @__PURE__ */ __name((options) => {
  const defaults = {
    origin: "*",
    allowMethods: ["GET", "HEAD", "PUT", "POST", "DELETE", "PATCH"],
    allowHeaders: [],
    exposeHeaders: []
  };
  const opts = {
    ...defaults,
    ...options
  };
  const findAllowOrigin = ((optsOrigin) => {
    if (typeof optsOrigin === "string") {
      if (optsOrigin === "*") {
        if (opts.credentials) {
          return (origin) => origin || null;
        }
        return () => optsOrigin;
      } else {
        return (origin) => optsOrigin === origin ? origin : null;
      }
    } else if (typeof optsOrigin === "function") {
      return optsOrigin;
    } else {
      return (origin) => optsOrigin.includes(origin) ? origin : null;
    }
  })(opts.origin);
  const findAllowMethods = ((optsAllowMethods) => {
    if (typeof optsAllowMethods === "function") {
      return optsAllowMethods;
    } else if (Array.isArray(optsAllowMethods)) {
      return () => optsAllowMethods;
    } else {
      return () => [];
    }
  })(opts.allowMethods);
  return /* @__PURE__ */ __name(async function cors2(c, next) {
    function set(key, value) {
      c.res.headers.set(key, value);
    }
    __name(set, "set");
    const allowOrigin = await findAllowOrigin(c.req.header("origin") || "", c);
    if (allowOrigin) {
      set("Access-Control-Allow-Origin", allowOrigin);
    }
    if (opts.credentials) {
      set("Access-Control-Allow-Credentials", "true");
    }
    if (opts.exposeHeaders?.length) {
      set("Access-Control-Expose-Headers", opts.exposeHeaders.join(","));
    }
    if (c.req.method === "OPTIONS") {
      if (opts.origin !== "*" || opts.credentials) {
        set("Vary", "Origin");
      }
      if (opts.maxAge != null) {
        set("Access-Control-Max-Age", opts.maxAge.toString());
      }
      const allowMethods = await findAllowMethods(c.req.header("origin") || "", c);
      if (allowMethods.length) {
        set("Access-Control-Allow-Methods", allowMethods.join(","));
      }
      let headers = opts.allowHeaders;
      if (!headers?.length) {
        const requestHeaders = c.req.header("Access-Control-Request-Headers");
        if (requestHeaders) {
          headers = requestHeaders.split(/\s*,\s*/);
        }
      }
      if (headers?.length) {
        set("Access-Control-Allow-Headers", headers.join(","));
        c.res.headers.append("Vary", "Access-Control-Request-Headers");
      }
      c.res.headers.delete("Content-Length");
      c.res.headers.delete("Content-Type");
      return new Response(null, {
        headers: c.res.headers,
        status: 204,
        statusText: "No Content"
      });
    }
    await next();
    if (opts.origin !== "*" || opts.credentials) {
      c.header("Vary", "Origin", { append: true });
    }
  }, "cors2");
}, "cors");

// node_modules/jose/dist/webapi/lib/buffer_utils.js
var encoder = new TextEncoder();
var decoder = new TextDecoder();
var MAX_INT32 = 2 ** 32;
function concat(...buffers) {
  const size = buffers.reduce((acc, { length }) => acc + length, 0);
  const buf = new Uint8Array(size);
  let i = 0;
  for (const buffer of buffers) {
    buf.set(buffer, i);
    i += buffer.length;
  }
  return buf;
}
__name(concat, "concat");
function encode(string) {
  const bytes = new Uint8Array(string.length);
  for (let i = 0; i < string.length; i++) {
    const code = string.charCodeAt(i);
    if (code > 127) {
      throw new TypeError("non-ASCII string encountered in encode()");
    }
    bytes[i] = code;
  }
  return bytes;
}
__name(encode, "encode");

// node_modules/jose/dist/webapi/lib/base64.js
function encodeBase64(input) {
  if (Uint8Array.prototype.toBase64) {
    return input.toBase64();
  }
  const CHUNK_SIZE = 32768;
  const arr = [];
  for (let i = 0; i < input.length; i += CHUNK_SIZE) {
    arr.push(String.fromCharCode.apply(null, input.subarray(i, i + CHUNK_SIZE)));
  }
  return btoa(arr.join(""));
}
__name(encodeBase64, "encodeBase64");
function decodeBase64(encoded) {
  if (Uint8Array.fromBase64) {
    return Uint8Array.fromBase64(encoded);
  }
  const binary = atob(encoded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}
__name(decodeBase64, "decodeBase64");

// node_modules/jose/dist/webapi/util/base64url.js
function decode(input) {
  if (Uint8Array.fromBase64) {
    return Uint8Array.fromBase64(typeof input === "string" ? input : decoder.decode(input), {
      alphabet: "base64url"
    });
  }
  let encoded = input;
  if (encoded instanceof Uint8Array) {
    encoded = decoder.decode(encoded);
  }
  encoded = encoded.replace(/-/g, "+").replace(/_/g, "/");
  try {
    return decodeBase64(encoded);
  } catch {
    throw new TypeError("The input to be decoded is not correctly encoded.");
  }
}
__name(decode, "decode");
function encode2(input) {
  let unencoded = input;
  if (typeof unencoded === "string") {
    unencoded = encoder.encode(unencoded);
  }
  if (Uint8Array.prototype.toBase64) {
    return unencoded.toBase64({ alphabet: "base64url", omitPadding: true });
  }
  return encodeBase64(unencoded).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}
__name(encode2, "encode");

// node_modules/jose/dist/webapi/lib/crypto_key.js
var unusable = /* @__PURE__ */ __name((name, prop = "algorithm.name") => new TypeError(`CryptoKey does not support this operation, its ${prop} must be ${name}`), "unusable");
var isAlgorithm = /* @__PURE__ */ __name((algorithm, name) => algorithm.name === name, "isAlgorithm");
function getHashLength(hash) {
  return parseInt(hash.name.slice(4), 10);
}
__name(getHashLength, "getHashLength");
function checkHashLength(algorithm, expected) {
  const actual = getHashLength(algorithm.hash);
  if (actual !== expected)
    throw unusable(`SHA-${expected}`, "algorithm.hash");
}
__name(checkHashLength, "checkHashLength");
function getNamedCurve(alg) {
  switch (alg) {
    case "ES256":
      return "P-256";
    case "ES384":
      return "P-384";
    case "ES512":
      return "P-521";
    default:
      throw new Error("unreachable");
  }
}
__name(getNamedCurve, "getNamedCurve");
function checkUsage(key, usage) {
  if (usage && !key.usages.includes(usage)) {
    throw new TypeError(`CryptoKey does not support this operation, its usages must include ${usage}.`);
  }
}
__name(checkUsage, "checkUsage");
function checkSigCryptoKey(key, alg, usage) {
  switch (alg) {
    case "HS256":
    case "HS384":
    case "HS512": {
      if (!isAlgorithm(key.algorithm, "HMAC"))
        throw unusable("HMAC");
      checkHashLength(key.algorithm, parseInt(alg.slice(2), 10));
      break;
    }
    case "RS256":
    case "RS384":
    case "RS512": {
      if (!isAlgorithm(key.algorithm, "RSASSA-PKCS1-v1_5"))
        throw unusable("RSASSA-PKCS1-v1_5");
      checkHashLength(key.algorithm, parseInt(alg.slice(2), 10));
      break;
    }
    case "PS256":
    case "PS384":
    case "PS512": {
      if (!isAlgorithm(key.algorithm, "RSA-PSS"))
        throw unusable("RSA-PSS");
      checkHashLength(key.algorithm, parseInt(alg.slice(2), 10));
      break;
    }
    case "Ed25519":
    case "EdDSA": {
      if (!isAlgorithm(key.algorithm, "Ed25519"))
        throw unusable("Ed25519");
      break;
    }
    case "ML-DSA-44":
    case "ML-DSA-65":
    case "ML-DSA-87": {
      if (!isAlgorithm(key.algorithm, alg))
        throw unusable(alg);
      break;
    }
    case "ES256":
    case "ES384":
    case "ES512": {
      if (!isAlgorithm(key.algorithm, "ECDSA"))
        throw unusable("ECDSA");
      const expected = getNamedCurve(alg);
      const actual = key.algorithm.namedCurve;
      if (actual !== expected)
        throw unusable(expected, "algorithm.namedCurve");
      break;
    }
    default:
      throw new TypeError("CryptoKey does not support this operation");
  }
  checkUsage(key, usage);
}
__name(checkSigCryptoKey, "checkSigCryptoKey");

// node_modules/jose/dist/webapi/lib/invalid_key_input.js
function message(msg, actual, ...types) {
  types = types.filter(Boolean);
  if (types.length > 2) {
    const last = types.pop();
    msg += `one of type ${types.join(", ")}, or ${last}.`;
  } else if (types.length === 2) {
    msg += `one of type ${types[0]} or ${types[1]}.`;
  } else {
    msg += `of type ${types[0]}.`;
  }
  if (actual == null) {
    msg += ` Received ${actual}`;
  } else if (typeof actual === "function" && actual.name) {
    msg += ` Received function ${actual.name}`;
  } else if (typeof actual === "object" && actual != null) {
    if (actual.constructor?.name) {
      msg += ` Received an instance of ${actual.constructor.name}`;
    }
  }
  return msg;
}
__name(message, "message");
var invalidKeyInput = /* @__PURE__ */ __name((actual, ...types) => message("Key must be ", actual, ...types), "invalidKeyInput");
var withAlg = /* @__PURE__ */ __name((alg, actual, ...types) => message(`Key for the ${alg} algorithm must be `, actual, ...types), "withAlg");

// node_modules/jose/dist/webapi/util/errors.js
var JOSEError = class extends Error {
  static {
    __name(this, "JOSEError");
  }
  static code = "ERR_JOSE_GENERIC";
  code = "ERR_JOSE_GENERIC";
  constructor(message2, options) {
    super(message2, options);
    this.name = this.constructor.name;
    Error.captureStackTrace?.(this, this.constructor);
  }
};
var JWTClaimValidationFailed = class extends JOSEError {
  static {
    __name(this, "JWTClaimValidationFailed");
  }
  static code = "ERR_JWT_CLAIM_VALIDATION_FAILED";
  code = "ERR_JWT_CLAIM_VALIDATION_FAILED";
  claim;
  reason;
  payload;
  constructor(message2, payload, claim = "unspecified", reason = "unspecified") {
    super(message2, { cause: { claim, reason, payload } });
    this.claim = claim;
    this.reason = reason;
    this.payload = payload;
  }
};
var JWTExpired = class extends JOSEError {
  static {
    __name(this, "JWTExpired");
  }
  static code = "ERR_JWT_EXPIRED";
  code = "ERR_JWT_EXPIRED";
  claim;
  reason;
  payload;
  constructor(message2, payload, claim = "unspecified", reason = "unspecified") {
    super(message2, { cause: { claim, reason, payload } });
    this.claim = claim;
    this.reason = reason;
    this.payload = payload;
  }
};
var JOSEAlgNotAllowed = class extends JOSEError {
  static {
    __name(this, "JOSEAlgNotAllowed");
  }
  static code = "ERR_JOSE_ALG_NOT_ALLOWED";
  code = "ERR_JOSE_ALG_NOT_ALLOWED";
};
var JOSENotSupported = class extends JOSEError {
  static {
    __name(this, "JOSENotSupported");
  }
  static code = "ERR_JOSE_NOT_SUPPORTED";
  code = "ERR_JOSE_NOT_SUPPORTED";
};
var JWSInvalid = class extends JOSEError {
  static {
    __name(this, "JWSInvalid");
  }
  static code = "ERR_JWS_INVALID";
  code = "ERR_JWS_INVALID";
};
var JWTInvalid = class extends JOSEError {
  static {
    __name(this, "JWTInvalid");
  }
  static code = "ERR_JWT_INVALID";
  code = "ERR_JWT_INVALID";
};
var JWSSignatureVerificationFailed = class extends JOSEError {
  static {
    __name(this, "JWSSignatureVerificationFailed");
  }
  static code = "ERR_JWS_SIGNATURE_VERIFICATION_FAILED";
  code = "ERR_JWS_SIGNATURE_VERIFICATION_FAILED";
  constructor(message2 = "signature verification failed", options) {
    super(message2, options);
  }
};

// node_modules/jose/dist/webapi/lib/is_key_like.js
var isCryptoKey = /* @__PURE__ */ __name((key) => {
  if (key?.[Symbol.toStringTag] === "CryptoKey")
    return true;
  try {
    return key instanceof CryptoKey;
  } catch {
    return false;
  }
}, "isCryptoKey");
var isKeyObject = /* @__PURE__ */ __name((key) => key?.[Symbol.toStringTag] === "KeyObject", "isKeyObject");
var isKeyLike = /* @__PURE__ */ __name((key) => isCryptoKey(key) || isKeyObject(key), "isKeyLike");

// node_modules/jose/dist/webapi/lib/helpers.js
function assertNotSet(value, name) {
  if (value) {
    throw new TypeError(`${name} can only be called once`);
  }
}
__name(assertNotSet, "assertNotSet");
function decodeBase64url(value, label, ErrorClass) {
  try {
    return decode(value);
  } catch {
    throw new ErrorClass(`Failed to base64url decode the ${label}`);
  }
}
__name(decodeBase64url, "decodeBase64url");

// node_modules/jose/dist/webapi/lib/type_checks.js
var isObjectLike = /* @__PURE__ */ __name((value) => typeof value === "object" && value !== null, "isObjectLike");
function isObject(input) {
  if (!isObjectLike(input) || Object.prototype.toString.call(input) !== "[object Object]") {
    return false;
  }
  if (Object.getPrototypeOf(input) === null) {
    return true;
  }
  let proto = input;
  while (Object.getPrototypeOf(proto) !== null) {
    proto = Object.getPrototypeOf(proto);
  }
  return Object.getPrototypeOf(input) === proto;
}
__name(isObject, "isObject");
function isDisjoint(...headers) {
  const sources = headers.filter(Boolean);
  if (sources.length === 0 || sources.length === 1) {
    return true;
  }
  let acc;
  for (const header of sources) {
    const parameters = Object.keys(header);
    if (!acc || acc.size === 0) {
      acc = new Set(parameters);
      continue;
    }
    for (const parameter of parameters) {
      if (acc.has(parameter)) {
        return false;
      }
      acc.add(parameter);
    }
  }
  return true;
}
__name(isDisjoint, "isDisjoint");
var isJWK = /* @__PURE__ */ __name((key) => isObject(key) && typeof key.kty === "string", "isJWK");
var isPrivateJWK = /* @__PURE__ */ __name((key) => key.kty !== "oct" && (key.kty === "AKP" && typeof key.priv === "string" || typeof key.d === "string"), "isPrivateJWK");
var isPublicJWK = /* @__PURE__ */ __name((key) => key.kty !== "oct" && key.d === void 0 && key.priv === void 0, "isPublicJWK");
var isSecretJWK = /* @__PURE__ */ __name((key) => key.kty === "oct" && typeof key.k === "string", "isSecretJWK");

// node_modules/jose/dist/webapi/lib/signing.js
function checkKeyLength(alg, key) {
  if (alg.startsWith("RS") || alg.startsWith("PS")) {
    const { modulusLength } = key.algorithm;
    if (typeof modulusLength !== "number" || modulusLength < 2048) {
      throw new TypeError(`${alg} requires key modulusLength to be 2048 bits or larger`);
    }
  }
}
__name(checkKeyLength, "checkKeyLength");
function subtleAlgorithm(alg, algorithm) {
  const hash = `SHA-${alg.slice(-3)}`;
  switch (alg) {
    case "HS256":
    case "HS384":
    case "HS512":
      return { hash, name: "HMAC" };
    case "PS256":
    case "PS384":
    case "PS512":
      return { hash, name: "RSA-PSS", saltLength: parseInt(alg.slice(-3), 10) >> 3 };
    case "RS256":
    case "RS384":
    case "RS512":
      return { hash, name: "RSASSA-PKCS1-v1_5" };
    case "ES256":
    case "ES384":
    case "ES512":
      return { hash, name: "ECDSA", namedCurve: algorithm.namedCurve };
    case "Ed25519":
    case "EdDSA":
      return { name: "Ed25519" };
    case "ML-DSA-44":
    case "ML-DSA-65":
    case "ML-DSA-87":
      return { name: alg };
    default:
      throw new JOSENotSupported(`alg ${alg} is not supported either by JOSE or your javascript runtime`);
  }
}
__name(subtleAlgorithm, "subtleAlgorithm");
async function getSigKey(alg, key, usage) {
  if (key instanceof Uint8Array) {
    if (!alg.startsWith("HS")) {
      throw new TypeError(invalidKeyInput(key, "CryptoKey", "KeyObject", "JSON Web Key"));
    }
    return crypto.subtle.importKey("raw", key, { hash: `SHA-${alg.slice(-3)}`, name: "HMAC" }, false, [usage]);
  }
  checkSigCryptoKey(key, alg, usage);
  return key;
}
__name(getSigKey, "getSigKey");
async function sign(alg, key, data) {
  const cryptoKey = await getSigKey(alg, key, "sign");
  checkKeyLength(alg, cryptoKey);
  const signature = await crypto.subtle.sign(subtleAlgorithm(alg, cryptoKey.algorithm), cryptoKey, data);
  return new Uint8Array(signature);
}
__name(sign, "sign");
async function verify(alg, key, signature, data) {
  const cryptoKey = await getSigKey(alg, key, "verify");
  checkKeyLength(alg, cryptoKey);
  const algorithm = subtleAlgorithm(alg, cryptoKey.algorithm);
  try {
    return await crypto.subtle.verify(algorithm, cryptoKey, signature, data);
  } catch {
    return false;
  }
}
__name(verify, "verify");

// node_modules/jose/dist/webapi/lib/jwk_to_key.js
var unsupportedAlg = 'Invalid or unsupported JWK "alg" (Algorithm) Parameter value';
function subtleMapping(jwk) {
  let algorithm;
  let keyUsages;
  switch (jwk.kty) {
    case "AKP": {
      switch (jwk.alg) {
        case "ML-DSA-44":
        case "ML-DSA-65":
        case "ML-DSA-87":
          algorithm = { name: jwk.alg };
          keyUsages = jwk.priv ? ["sign"] : ["verify"];
          break;
        default:
          throw new JOSENotSupported(unsupportedAlg);
      }
      break;
    }
    case "RSA": {
      switch (jwk.alg) {
        case "PS256":
        case "PS384":
        case "PS512":
          algorithm = { name: "RSA-PSS", hash: `SHA-${jwk.alg.slice(-3)}` };
          keyUsages = jwk.d ? ["sign"] : ["verify"];
          break;
        case "RS256":
        case "RS384":
        case "RS512":
          algorithm = { name: "RSASSA-PKCS1-v1_5", hash: `SHA-${jwk.alg.slice(-3)}` };
          keyUsages = jwk.d ? ["sign"] : ["verify"];
          break;
        case "RSA-OAEP":
        case "RSA-OAEP-256":
        case "RSA-OAEP-384":
        case "RSA-OAEP-512":
          algorithm = {
            name: "RSA-OAEP",
            hash: `SHA-${parseInt(jwk.alg.slice(-3), 10) || 1}`
          };
          keyUsages = jwk.d ? ["decrypt", "unwrapKey"] : ["encrypt", "wrapKey"];
          break;
        default:
          throw new JOSENotSupported(unsupportedAlg);
      }
      break;
    }
    case "EC": {
      switch (jwk.alg) {
        case "ES256":
        case "ES384":
        case "ES512":
          algorithm = {
            name: "ECDSA",
            namedCurve: { ES256: "P-256", ES384: "P-384", ES512: "P-521" }[jwk.alg]
          };
          keyUsages = jwk.d ? ["sign"] : ["verify"];
          break;
        case "ECDH-ES":
        case "ECDH-ES+A128KW":
        case "ECDH-ES+A192KW":
        case "ECDH-ES+A256KW":
          algorithm = { name: "ECDH", namedCurve: jwk.crv };
          keyUsages = jwk.d ? ["deriveBits"] : [];
          break;
        default:
          throw new JOSENotSupported(unsupportedAlg);
      }
      break;
    }
    case "OKP": {
      switch (jwk.alg) {
        case "Ed25519":
        case "EdDSA":
          algorithm = { name: "Ed25519" };
          keyUsages = jwk.d ? ["sign"] : ["verify"];
          break;
        case "ECDH-ES":
        case "ECDH-ES+A128KW":
        case "ECDH-ES+A192KW":
        case "ECDH-ES+A256KW":
          algorithm = { name: jwk.crv };
          keyUsages = jwk.d ? ["deriveBits"] : [];
          break;
        default:
          throw new JOSENotSupported(unsupportedAlg);
      }
      break;
    }
    default:
      throw new JOSENotSupported('Invalid or unsupported JWK "kty" (Key Type) Parameter value');
  }
  return { algorithm, keyUsages };
}
__name(subtleMapping, "subtleMapping");
async function jwkToKey(jwk) {
  if (!jwk.alg) {
    throw new TypeError('"alg" argument is required when "jwk.alg" is not present');
  }
  const { algorithm, keyUsages } = subtleMapping(jwk);
  const keyData = { ...jwk };
  if (keyData.kty !== "AKP") {
    delete keyData.alg;
  }
  delete keyData.use;
  return crypto.subtle.importKey("jwk", keyData, algorithm, jwk.ext ?? (jwk.d || jwk.priv ? false : true), jwk.key_ops ?? keyUsages);
}
__name(jwkToKey, "jwkToKey");

// node_modules/jose/dist/webapi/lib/normalize_key.js
var unusableForAlg = "given KeyObject instance cannot be used for this algorithm";
var cache;
var handleJWK = /* @__PURE__ */ __name(async (key, jwk, alg, freeze = false) => {
  cache ||= /* @__PURE__ */ new WeakMap();
  let cached = cache.get(key);
  if (cached?.[alg]) {
    return cached[alg];
  }
  const cryptoKey = await jwkToKey({ ...jwk, alg });
  if (freeze)
    Object.freeze(key);
  if (!cached) {
    cache.set(key, { [alg]: cryptoKey });
  } else {
    cached[alg] = cryptoKey;
  }
  return cryptoKey;
}, "handleJWK");
var handleKeyObject = /* @__PURE__ */ __name((keyObject, alg) => {
  cache ||= /* @__PURE__ */ new WeakMap();
  let cached = cache.get(keyObject);
  if (cached?.[alg]) {
    return cached[alg];
  }
  const isPublic = keyObject.type === "public";
  const extractable = isPublic ? true : false;
  let cryptoKey;
  if (keyObject.asymmetricKeyType === "x25519") {
    switch (alg) {
      case "ECDH-ES":
      case "ECDH-ES+A128KW":
      case "ECDH-ES+A192KW":
      case "ECDH-ES+A256KW":
        break;
      default:
        throw new TypeError(unusableForAlg);
    }
    cryptoKey = keyObject.toCryptoKey(keyObject.asymmetricKeyType, extractable, isPublic ? [] : ["deriveBits"]);
  }
  if (keyObject.asymmetricKeyType === "ed25519") {
    if (alg !== "EdDSA" && alg !== "Ed25519") {
      throw new TypeError(unusableForAlg);
    }
    cryptoKey = keyObject.toCryptoKey(keyObject.asymmetricKeyType, extractable, [
      isPublic ? "verify" : "sign"
    ]);
  }
  switch (keyObject.asymmetricKeyType) {
    case "ml-dsa-44":
    case "ml-dsa-65":
    case "ml-dsa-87": {
      if (alg !== keyObject.asymmetricKeyType.toUpperCase()) {
        throw new TypeError(unusableForAlg);
      }
      cryptoKey = keyObject.toCryptoKey(keyObject.asymmetricKeyType, extractable, [
        isPublic ? "verify" : "sign"
      ]);
    }
  }
  if (keyObject.asymmetricKeyType === "rsa") {
    let hash;
    switch (alg) {
      case "RSA-OAEP":
        hash = "SHA-1";
        break;
      case "RS256":
      case "PS256":
      case "RSA-OAEP-256":
        hash = "SHA-256";
        break;
      case "RS384":
      case "PS384":
      case "RSA-OAEP-384":
        hash = "SHA-384";
        break;
      case "RS512":
      case "PS512":
      case "RSA-OAEP-512":
        hash = "SHA-512";
        break;
      default:
        throw new TypeError(unusableForAlg);
    }
    if (alg.startsWith("RSA-OAEP")) {
      return keyObject.toCryptoKey({
        name: "RSA-OAEP",
        hash
      }, extractable, isPublic ? ["encrypt"] : ["decrypt"]);
    }
    cryptoKey = keyObject.toCryptoKey({
      name: alg.startsWith("PS") ? "RSA-PSS" : "RSASSA-PKCS1-v1_5",
      hash
    }, extractable, [isPublic ? "verify" : "sign"]);
  }
  if (keyObject.asymmetricKeyType === "ec") {
    const nist = /* @__PURE__ */ new Map([
      ["prime256v1", "P-256"],
      ["secp384r1", "P-384"],
      ["secp521r1", "P-521"]
    ]);
    const namedCurve = nist.get(keyObject.asymmetricKeyDetails?.namedCurve);
    if (!namedCurve) {
      throw new TypeError(unusableForAlg);
    }
    const expectedCurve = { ES256: "P-256", ES384: "P-384", ES512: "P-521" };
    if (expectedCurve[alg] && namedCurve === expectedCurve[alg]) {
      cryptoKey = keyObject.toCryptoKey({
        name: "ECDSA",
        namedCurve
      }, extractable, [isPublic ? "verify" : "sign"]);
    }
    if (alg.startsWith("ECDH-ES")) {
      cryptoKey = keyObject.toCryptoKey({
        name: "ECDH",
        namedCurve
      }, extractable, isPublic ? [] : ["deriveBits"]);
    }
  }
  if (!cryptoKey) {
    throw new TypeError(unusableForAlg);
  }
  if (!cached) {
    cache.set(keyObject, { [alg]: cryptoKey });
  } else {
    cached[alg] = cryptoKey;
  }
  return cryptoKey;
}, "handleKeyObject");
async function normalizeKey(key, alg) {
  if (key instanceof Uint8Array) {
    return key;
  }
  if (isCryptoKey(key)) {
    return key;
  }
  if (isKeyObject(key)) {
    if (key.type === "secret") {
      return key.export();
    }
    if ("toCryptoKey" in key && typeof key.toCryptoKey === "function") {
      try {
        return handleKeyObject(key, alg);
      } catch (err) {
        if (err instanceof TypeError) {
          throw err;
        }
      }
    }
    let jwk = key.export({ format: "jwk" });
    return handleJWK(key, jwk, alg);
  }
  if (isJWK(key)) {
    if (key.k) {
      return decode(key.k);
    }
    return handleJWK(key, key, alg, true);
  }
  throw new Error("unreachable");
}
__name(normalizeKey, "normalizeKey");

// node_modules/jose/dist/webapi/lib/validate_crit.js
function validateCrit(Err, recognizedDefault, recognizedOption, protectedHeader, joseHeader) {
  if (joseHeader.crit !== void 0 && protectedHeader?.crit === void 0) {
    throw new Err('"crit" (Critical) Header Parameter MUST be integrity protected');
  }
  if (!protectedHeader || protectedHeader.crit === void 0) {
    return /* @__PURE__ */ new Set();
  }
  if (!Array.isArray(protectedHeader.crit) || protectedHeader.crit.length === 0 || protectedHeader.crit.some((input) => typeof input !== "string" || input.length === 0)) {
    throw new Err('"crit" (Critical) Header Parameter MUST be an array of non-empty strings when present');
  }
  let recognized;
  if (recognizedOption !== void 0) {
    recognized = new Map([...Object.entries(recognizedOption), ...recognizedDefault.entries()]);
  } else {
    recognized = recognizedDefault;
  }
  for (const parameter of protectedHeader.crit) {
    if (!recognized.has(parameter)) {
      throw new JOSENotSupported(`Extension Header Parameter "${parameter}" is not recognized`);
    }
    if (joseHeader[parameter] === void 0) {
      throw new Err(`Extension Header Parameter "${parameter}" is missing`);
    }
    if (recognized.get(parameter) && protectedHeader[parameter] === void 0) {
      throw new Err(`Extension Header Parameter "${parameter}" MUST be integrity protected`);
    }
  }
  return new Set(protectedHeader.crit);
}
__name(validateCrit, "validateCrit");

// node_modules/jose/dist/webapi/lib/validate_algorithms.js
function validateAlgorithms(option, algorithms) {
  if (algorithms !== void 0 && (!Array.isArray(algorithms) || algorithms.some((s) => typeof s !== "string"))) {
    throw new TypeError(`"${option}" option must be an array of strings`);
  }
  if (!algorithms) {
    return void 0;
  }
  return new Set(algorithms);
}
__name(validateAlgorithms, "validateAlgorithms");

// node_modules/jose/dist/webapi/lib/check_key_type.js
var tag = /* @__PURE__ */ __name((key) => key?.[Symbol.toStringTag], "tag");
var jwkMatchesOp = /* @__PURE__ */ __name((alg, key, usage) => {
  if (key.use !== void 0) {
    let expected;
    switch (usage) {
      case "sign":
      case "verify":
        expected = "sig";
        break;
      case "encrypt":
      case "decrypt":
        expected = "enc";
        break;
    }
    if (key.use !== expected) {
      throw new TypeError(`Invalid key for this operation, its "use" must be "${expected}" when present`);
    }
  }
  if (key.alg !== void 0 && key.alg !== alg) {
    throw new TypeError(`Invalid key for this operation, its "alg" must be "${alg}" when present`);
  }
  if (Array.isArray(key.key_ops)) {
    let expectedKeyOp;
    switch (true) {
      case (usage === "sign" || usage === "verify"):
      case alg === "dir":
      case alg.includes("CBC-HS"):
        expectedKeyOp = usage;
        break;
      case alg.startsWith("PBES2"):
        expectedKeyOp = "deriveBits";
        break;
      case /^A\d{3}(?:GCM)?(?:KW)?$/.test(alg):
        if (!alg.includes("GCM") && alg.endsWith("KW")) {
          expectedKeyOp = usage === "encrypt" ? "wrapKey" : "unwrapKey";
        } else {
          expectedKeyOp = usage;
        }
        break;
      case (usage === "encrypt" && alg.startsWith("RSA")):
        expectedKeyOp = "wrapKey";
        break;
      case usage === "decrypt":
        expectedKeyOp = alg.startsWith("RSA") ? "unwrapKey" : "deriveBits";
        break;
    }
    if (expectedKeyOp && key.key_ops?.includes?.(expectedKeyOp) === false) {
      throw new TypeError(`Invalid key for this operation, its "key_ops" must include "${expectedKeyOp}" when present`);
    }
  }
  return true;
}, "jwkMatchesOp");
var symmetricTypeCheck = /* @__PURE__ */ __name((alg, key, usage) => {
  if (key instanceof Uint8Array)
    return;
  if (isJWK(key)) {
    if (isSecretJWK(key) && jwkMatchesOp(alg, key, usage))
      return;
    throw new TypeError(`JSON Web Key for symmetric algorithms must have JWK "kty" (Key Type) equal to "oct" and the JWK "k" (Key Value) present`);
  }
  if (!isKeyLike(key)) {
    throw new TypeError(withAlg(alg, key, "CryptoKey", "KeyObject", "JSON Web Key", "Uint8Array"));
  }
  if (key.type !== "secret") {
    throw new TypeError(`${tag(key)} instances for symmetric algorithms must be of type "secret"`);
  }
}, "symmetricTypeCheck");
var asymmetricTypeCheck = /* @__PURE__ */ __name((alg, key, usage) => {
  if (isJWK(key)) {
    switch (usage) {
      case "decrypt":
      case "sign":
        if (isPrivateJWK(key) && jwkMatchesOp(alg, key, usage))
          return;
        throw new TypeError(`JSON Web Key for this operation must be a private JWK`);
      case "encrypt":
      case "verify":
        if (isPublicJWK(key) && jwkMatchesOp(alg, key, usage))
          return;
        throw new TypeError(`JSON Web Key for this operation must be a public JWK`);
    }
  }
  if (!isKeyLike(key)) {
    throw new TypeError(withAlg(alg, key, "CryptoKey", "KeyObject", "JSON Web Key"));
  }
  if (key.type === "secret") {
    throw new TypeError(`${tag(key)} instances for asymmetric algorithms must not be of type "secret"`);
  }
  if (key.type === "public") {
    switch (usage) {
      case "sign":
        throw new TypeError(`${tag(key)} instances for asymmetric algorithm signing must be of type "private"`);
      case "decrypt":
        throw new TypeError(`${tag(key)} instances for asymmetric algorithm decryption must be of type "private"`);
    }
  }
  if (key.type === "private") {
    switch (usage) {
      case "verify":
        throw new TypeError(`${tag(key)} instances for asymmetric algorithm verifying must be of type "public"`);
      case "encrypt":
        throw new TypeError(`${tag(key)} instances for asymmetric algorithm encryption must be of type "public"`);
    }
  }
}, "asymmetricTypeCheck");
function checkKeyType(alg, key, usage) {
  switch (alg.substring(0, 2)) {
    case "A1":
    case "A2":
    case "di":
    case "HS":
    case "PB":
      symmetricTypeCheck(alg, key, usage);
      break;
    default:
      asymmetricTypeCheck(alg, key, usage);
  }
}
__name(checkKeyType, "checkKeyType");

// node_modules/jose/dist/webapi/jws/flattened/verify.js
async function flattenedVerify(jws, key, options) {
  if (!isObject(jws)) {
    throw new JWSInvalid("Flattened JWS must be an object");
  }
  if (jws.protected === void 0 && jws.header === void 0) {
    throw new JWSInvalid('Flattened JWS must have either of the "protected" or "header" members');
  }
  if (jws.protected !== void 0 && typeof jws.protected !== "string") {
    throw new JWSInvalid("JWS Protected Header incorrect type");
  }
  if (jws.payload === void 0) {
    throw new JWSInvalid("JWS Payload missing");
  }
  if (typeof jws.signature !== "string") {
    throw new JWSInvalid("JWS Signature missing or incorrect type");
  }
  if (jws.header !== void 0 && !isObject(jws.header)) {
    throw new JWSInvalid("JWS Unprotected Header incorrect type");
  }
  let parsedProt = {};
  if (jws.protected) {
    try {
      const protectedHeader = decode(jws.protected);
      parsedProt = JSON.parse(decoder.decode(protectedHeader));
    } catch {
      throw new JWSInvalid("JWS Protected Header is invalid");
    }
  }
  if (!isDisjoint(parsedProt, jws.header)) {
    throw new JWSInvalid("JWS Protected and JWS Unprotected Header Parameter names must be disjoint");
  }
  const joseHeader = {
    ...parsedProt,
    ...jws.header
  };
  const extensions = validateCrit(JWSInvalid, /* @__PURE__ */ new Map([["b64", true]]), options?.crit, parsedProt, joseHeader);
  let b64 = true;
  if (extensions.has("b64")) {
    b64 = parsedProt.b64;
    if (typeof b64 !== "boolean") {
      throw new JWSInvalid('The "b64" (base64url-encode payload) Header Parameter must be a boolean');
    }
  }
  const { alg } = joseHeader;
  if (typeof alg !== "string" || !alg) {
    throw new JWSInvalid('JWS "alg" (Algorithm) Header Parameter missing or invalid');
  }
  const algorithms = options && validateAlgorithms("algorithms", options.algorithms);
  if (algorithms && !algorithms.has(alg)) {
    throw new JOSEAlgNotAllowed('"alg" (Algorithm) Header Parameter value not allowed');
  }
  if (b64) {
    if (typeof jws.payload !== "string") {
      throw new JWSInvalid("JWS Payload must be a string");
    }
  } else if (typeof jws.payload !== "string" && !(jws.payload instanceof Uint8Array)) {
    throw new JWSInvalid("JWS Payload must be a string or an Uint8Array instance");
  }
  let resolvedKey = false;
  if (typeof key === "function") {
    key = await key(parsedProt, jws);
    resolvedKey = true;
  }
  checkKeyType(alg, key, "verify");
  const data = concat(jws.protected !== void 0 ? encode(jws.protected) : new Uint8Array(), encode("."), typeof jws.payload === "string" ? b64 ? encode(jws.payload) : encoder.encode(jws.payload) : jws.payload);
  const signature = decodeBase64url(jws.signature, "signature", JWSInvalid);
  const k = await normalizeKey(key, alg);
  const verified = await verify(alg, k, signature, data);
  if (!verified) {
    throw new JWSSignatureVerificationFailed();
  }
  let payload;
  if (b64) {
    payload = decodeBase64url(jws.payload, "payload", JWSInvalid);
  } else if (typeof jws.payload === "string") {
    payload = encoder.encode(jws.payload);
  } else {
    payload = jws.payload;
  }
  const result = { payload };
  if (jws.protected !== void 0) {
    result.protectedHeader = parsedProt;
  }
  if (jws.header !== void 0) {
    result.unprotectedHeader = jws.header;
  }
  if (resolvedKey) {
    return { ...result, key: k };
  }
  return result;
}
__name(flattenedVerify, "flattenedVerify");

// node_modules/jose/dist/webapi/jws/compact/verify.js
async function compactVerify(jws, key, options) {
  if (jws instanceof Uint8Array) {
    jws = decoder.decode(jws);
  }
  if (typeof jws !== "string") {
    throw new JWSInvalid("Compact JWS must be a string or Uint8Array");
  }
  const { 0: protectedHeader, 1: payload, 2: signature, length } = jws.split(".");
  if (length !== 3) {
    throw new JWSInvalid("Invalid Compact JWS");
  }
  const verified = await flattenedVerify({ payload, protected: protectedHeader, signature }, key, options);
  const result = { payload: verified.payload, protectedHeader: verified.protectedHeader };
  if (typeof key === "function") {
    return { ...result, key: verified.key };
  }
  return result;
}
__name(compactVerify, "compactVerify");

// node_modules/jose/dist/webapi/lib/jwt_claims_set.js
var epoch = /* @__PURE__ */ __name((date) => Math.floor(date.getTime() / 1e3), "epoch");
var minute = 60;
var hour = minute * 60;
var day = hour * 24;
var week = day * 7;
var year = day * 365.25;
var REGEX = /^(\+|\-)? ?(\d+|\d+\.\d+) ?(seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|weeks?|w|years?|yrs?|y)(?: (ago|from now))?$/i;
function secs(str) {
  const matched = REGEX.exec(str);
  if (!matched || matched[4] && matched[1]) {
    throw new TypeError("Invalid time period format");
  }
  const value = parseFloat(matched[2]);
  const unit = matched[3].toLowerCase();
  let numericDate;
  switch (unit) {
    case "sec":
    case "secs":
    case "second":
    case "seconds":
    case "s":
      numericDate = Math.round(value);
      break;
    case "minute":
    case "minutes":
    case "min":
    case "mins":
    case "m":
      numericDate = Math.round(value * minute);
      break;
    case "hour":
    case "hours":
    case "hr":
    case "hrs":
    case "h":
      numericDate = Math.round(value * hour);
      break;
    case "day":
    case "days":
    case "d":
      numericDate = Math.round(value * day);
      break;
    case "week":
    case "weeks":
    case "w":
      numericDate = Math.round(value * week);
      break;
    default:
      numericDate = Math.round(value * year);
      break;
  }
  if (matched[1] === "-" || matched[4] === "ago") {
    return -numericDate;
  }
  return numericDate;
}
__name(secs, "secs");
function validateInput(label, input) {
  if (!Number.isFinite(input)) {
    throw new TypeError(`Invalid ${label} input`);
  }
  return input;
}
__name(validateInput, "validateInput");
var normalizeTyp = /* @__PURE__ */ __name((value) => {
  if (value.includes("/")) {
    return value.toLowerCase();
  }
  return `application/${value.toLowerCase()}`;
}, "normalizeTyp");
var checkAudiencePresence = /* @__PURE__ */ __name((audPayload, audOption) => {
  if (typeof audPayload === "string") {
    return audOption.includes(audPayload);
  }
  if (Array.isArray(audPayload)) {
    return audOption.some(Set.prototype.has.bind(new Set(audPayload)));
  }
  return false;
}, "checkAudiencePresence");
function validateClaimsSet(protectedHeader, encodedPayload, options = {}) {
  let payload;
  try {
    payload = JSON.parse(decoder.decode(encodedPayload));
  } catch {
  }
  if (!isObject(payload)) {
    throw new JWTInvalid("JWT Claims Set must be a top-level JSON object");
  }
  const { typ } = options;
  if (typ && (typeof protectedHeader.typ !== "string" || normalizeTyp(protectedHeader.typ) !== normalizeTyp(typ))) {
    throw new JWTClaimValidationFailed('unexpected "typ" JWT header value', payload, "typ", "check_failed");
  }
  const { requiredClaims = [], issuer, subject, audience, maxTokenAge } = options;
  const presenceCheck = [...requiredClaims];
  if (maxTokenAge !== void 0)
    presenceCheck.push("iat");
  if (audience !== void 0)
    presenceCheck.push("aud");
  if (subject !== void 0)
    presenceCheck.push("sub");
  if (issuer !== void 0)
    presenceCheck.push("iss");
  for (const claim of new Set(presenceCheck.reverse())) {
    if (!(claim in payload)) {
      throw new JWTClaimValidationFailed(`missing required "${claim}" claim`, payload, claim, "missing");
    }
  }
  if (issuer && !(Array.isArray(issuer) ? issuer : [issuer]).includes(payload.iss)) {
    throw new JWTClaimValidationFailed('unexpected "iss" claim value', payload, "iss", "check_failed");
  }
  if (subject && payload.sub !== subject) {
    throw new JWTClaimValidationFailed('unexpected "sub" claim value', payload, "sub", "check_failed");
  }
  if (audience && !checkAudiencePresence(payload.aud, typeof audience === "string" ? [audience] : audience)) {
    throw new JWTClaimValidationFailed('unexpected "aud" claim value', payload, "aud", "check_failed");
  }
  let tolerance;
  switch (typeof options.clockTolerance) {
    case "string":
      tolerance = secs(options.clockTolerance);
      break;
    case "number":
      tolerance = options.clockTolerance;
      break;
    case "undefined":
      tolerance = 0;
      break;
    default:
      throw new TypeError("Invalid clockTolerance option type");
  }
  const { currentDate } = options;
  const now = epoch(currentDate || /* @__PURE__ */ new Date());
  if ((payload.iat !== void 0 || maxTokenAge) && typeof payload.iat !== "number") {
    throw new JWTClaimValidationFailed('"iat" claim must be a number', payload, "iat", "invalid");
  }
  if (payload.nbf !== void 0) {
    if (typeof payload.nbf !== "number") {
      throw new JWTClaimValidationFailed('"nbf" claim must be a number', payload, "nbf", "invalid");
    }
    if (payload.nbf > now + tolerance) {
      throw new JWTClaimValidationFailed('"nbf" claim timestamp check failed', payload, "nbf", "check_failed");
    }
  }
  if (payload.exp !== void 0) {
    if (typeof payload.exp !== "number") {
      throw new JWTClaimValidationFailed('"exp" claim must be a number', payload, "exp", "invalid");
    }
    if (payload.exp <= now - tolerance) {
      throw new JWTExpired('"exp" claim timestamp check failed', payload, "exp", "check_failed");
    }
  }
  if (maxTokenAge) {
    const age = now - payload.iat;
    const max = typeof maxTokenAge === "number" ? maxTokenAge : secs(maxTokenAge);
    if (age - tolerance > max) {
      throw new JWTExpired('"iat" claim timestamp check failed (too far in the past)', payload, "iat", "check_failed");
    }
    if (age < 0 - tolerance) {
      throw new JWTClaimValidationFailed('"iat" claim timestamp check failed (it should be in the past)', payload, "iat", "check_failed");
    }
  }
  return payload;
}
__name(validateClaimsSet, "validateClaimsSet");
var JWTClaimsBuilder = class {
  static {
    __name(this, "JWTClaimsBuilder");
  }
  #payload;
  constructor(payload) {
    if (!isObject(payload)) {
      throw new TypeError("JWT Claims Set MUST be an object");
    }
    this.#payload = structuredClone(payload);
  }
  data() {
    return encoder.encode(JSON.stringify(this.#payload));
  }
  get iss() {
    return this.#payload.iss;
  }
  set iss(value) {
    this.#payload.iss = value;
  }
  get sub() {
    return this.#payload.sub;
  }
  set sub(value) {
    this.#payload.sub = value;
  }
  get aud() {
    return this.#payload.aud;
  }
  set aud(value) {
    this.#payload.aud = value;
  }
  set jti(value) {
    this.#payload.jti = value;
  }
  set nbf(value) {
    if (typeof value === "number") {
      this.#payload.nbf = validateInput("setNotBefore", value);
    } else if (value instanceof Date) {
      this.#payload.nbf = validateInput("setNotBefore", epoch(value));
    } else {
      this.#payload.nbf = epoch(/* @__PURE__ */ new Date()) + secs(value);
    }
  }
  set exp(value) {
    if (typeof value === "number") {
      this.#payload.exp = validateInput("setExpirationTime", value);
    } else if (value instanceof Date) {
      this.#payload.exp = validateInput("setExpirationTime", epoch(value));
    } else {
      this.#payload.exp = epoch(/* @__PURE__ */ new Date()) + secs(value);
    }
  }
  set iat(value) {
    if (value === void 0) {
      this.#payload.iat = epoch(/* @__PURE__ */ new Date());
    } else if (value instanceof Date) {
      this.#payload.iat = validateInput("setIssuedAt", epoch(value));
    } else if (typeof value === "string") {
      this.#payload.iat = validateInput("setIssuedAt", epoch(/* @__PURE__ */ new Date()) + secs(value));
    } else {
      this.#payload.iat = validateInput("setIssuedAt", value);
    }
  }
};

// node_modules/jose/dist/webapi/jwt/verify.js
async function jwtVerify(jwt, key, options) {
  const verified = await compactVerify(jwt, key, options);
  if (verified.protectedHeader.crit?.includes("b64") && verified.protectedHeader.b64 === false) {
    throw new JWTInvalid("JWTs MUST NOT use unencoded payload");
  }
  const payload = validateClaimsSet(verified.protectedHeader, verified.payload, options);
  const result = { payload, protectedHeader: verified.protectedHeader };
  if (typeof key === "function") {
    return { ...result, key: verified.key };
  }
  return result;
}
__name(jwtVerify, "jwtVerify");

// node_modules/jose/dist/webapi/jws/flattened/sign.js
var FlattenedSign = class {
  static {
    __name(this, "FlattenedSign");
  }
  #payload;
  #protectedHeader;
  #unprotectedHeader;
  constructor(payload) {
    if (!(payload instanceof Uint8Array)) {
      throw new TypeError("payload must be an instance of Uint8Array");
    }
    this.#payload = payload;
  }
  setProtectedHeader(protectedHeader) {
    assertNotSet(this.#protectedHeader, "setProtectedHeader");
    this.#protectedHeader = protectedHeader;
    return this;
  }
  setUnprotectedHeader(unprotectedHeader) {
    assertNotSet(this.#unprotectedHeader, "setUnprotectedHeader");
    this.#unprotectedHeader = unprotectedHeader;
    return this;
  }
  async sign(key, options) {
    if (!this.#protectedHeader && !this.#unprotectedHeader) {
      throw new JWSInvalid("either setProtectedHeader or setUnprotectedHeader must be called before #sign()");
    }
    if (!isDisjoint(this.#protectedHeader, this.#unprotectedHeader)) {
      throw new JWSInvalid("JWS Protected and JWS Unprotected Header Parameter names must be disjoint");
    }
    const joseHeader = {
      ...this.#protectedHeader,
      ...this.#unprotectedHeader
    };
    const extensions = validateCrit(JWSInvalid, /* @__PURE__ */ new Map([["b64", true]]), options?.crit, this.#protectedHeader, joseHeader);
    let b64 = true;
    if (extensions.has("b64")) {
      b64 = this.#protectedHeader.b64;
      if (typeof b64 !== "boolean") {
        throw new JWSInvalid('The "b64" (base64url-encode payload) Header Parameter must be a boolean');
      }
    }
    const { alg } = joseHeader;
    if (typeof alg !== "string" || !alg) {
      throw new JWSInvalid('JWS "alg" (Algorithm) Header Parameter missing or invalid');
    }
    checkKeyType(alg, key, "sign");
    let payloadS;
    let payloadB;
    if (b64) {
      payloadS = encode2(this.#payload);
      payloadB = encode(payloadS);
    } else {
      payloadB = this.#payload;
      payloadS = "";
    }
    let protectedHeaderString;
    let protectedHeaderBytes;
    if (this.#protectedHeader) {
      protectedHeaderString = encode2(JSON.stringify(this.#protectedHeader));
      protectedHeaderBytes = encode(protectedHeaderString);
    } else {
      protectedHeaderString = "";
      protectedHeaderBytes = new Uint8Array();
    }
    const data = concat(protectedHeaderBytes, encode("."), payloadB);
    const k = await normalizeKey(key, alg);
    const signature = await sign(alg, k, data);
    const jws = {
      signature: encode2(signature),
      payload: payloadS
    };
    if (this.#unprotectedHeader) {
      jws.header = this.#unprotectedHeader;
    }
    if (this.#protectedHeader) {
      jws.protected = protectedHeaderString;
    }
    return jws;
  }
};

// node_modules/jose/dist/webapi/jws/compact/sign.js
var CompactSign = class {
  static {
    __name(this, "CompactSign");
  }
  #flattened;
  constructor(payload) {
    this.#flattened = new FlattenedSign(payload);
  }
  setProtectedHeader(protectedHeader) {
    this.#flattened.setProtectedHeader(protectedHeader);
    return this;
  }
  async sign(key, options) {
    const jws = await this.#flattened.sign(key, options);
    if (jws.payload === void 0) {
      throw new TypeError("use the flattened module for creating JWS with b64: false");
    }
    return `${jws.protected}.${jws.payload}.${jws.signature}`;
  }
};

// node_modules/jose/dist/webapi/jwt/sign.js
var SignJWT = class {
  static {
    __name(this, "SignJWT");
  }
  #protectedHeader;
  #jwt;
  constructor(payload = {}) {
    this.#jwt = new JWTClaimsBuilder(payload);
  }
  setIssuer(issuer) {
    this.#jwt.iss = issuer;
    return this;
  }
  setSubject(subject) {
    this.#jwt.sub = subject;
    return this;
  }
  setAudience(audience) {
    this.#jwt.aud = audience;
    return this;
  }
  setJti(jwtId) {
    this.#jwt.jti = jwtId;
    return this;
  }
  setNotBefore(input) {
    this.#jwt.nbf = input;
    return this;
  }
  setExpirationTime(input) {
    this.#jwt.exp = input;
    return this;
  }
  setIssuedAt(input) {
    this.#jwt.iat = input;
    return this;
  }
  setProtectedHeader(protectedHeader) {
    this.#protectedHeader = protectedHeader;
    return this;
  }
  async sign(key, options) {
    const sig = new CompactSign(this.#jwt.data());
    sig.setProtectedHeader(this.#protectedHeader);
    if (Array.isArray(this.#protectedHeader?.crit) && this.#protectedHeader.crit.includes("b64") && this.#protectedHeader.b64 === false) {
      throw new JWTInvalid("JWTs MUST NOT use unencoded payload");
    }
    return sig.sign(key, options);
  }
};

// src/finance-crypto.js
var PREFIX = "ff1:";
function hexToBytes(hex) {
  const len = hex.length / 2;
  const out = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return out;
}
__name(hexToBytes, "hexToBytes");
function base64ToBytes(b64) {
  const normalized = b64.replace(/-/g, "+").replace(/_/g, "/");
  const pad = normalized.length % 4 === 0 ? "" : "=".repeat(4 - normalized.length % 4);
  const bin = atob(normalized + pad);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}
__name(base64ToBytes, "base64ToBytes");
function bytesToBase64(bytes) {
  let binary = "";
  const chunk = 32768;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, Math.min(i + chunk, bytes.length)));
  }
  return btoa(binary);
}
__name(bytesToBase64, "bytesToBase64");
function decodeFinanceDataKey(secret) {
  if (!secret || typeof secret !== "string") return null;
  const s = secret.trim();
  if (/^[0-9a-fA-F]{64}$/.test(s)) {
    return hexToBytes(s);
  }
  try {
    const bytes = base64ToBytes(s);
    if (bytes.length === 32) return bytes;
  } catch {
  }
  return null;
}
__name(decodeFinanceDataKey, "decodeFinanceDataKey");
async function encryptFinancePayload(plainJsonString, rawKey) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    rawKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt"]
  );
  const cipherBuf = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    cryptoKey,
    new TextEncoder().encode(plainJsonString)
  );
  const cipher = new Uint8Array(cipherBuf);
  const combined = new Uint8Array(iv.length + cipher.length);
  combined.set(iv, 0);
  combined.set(cipher, iv.length);
  return PREFIX + bytesToBase64(combined);
}
__name(encryptFinancePayload, "encryptFinancePayload");
async function decryptFinancePayload(stored, rawKey) {
  if (typeof stored !== "string" || !stored.startsWith(PREFIX)) {
    throw new Error("Invalid encrypted finance payload");
  }
  const combined = base64ToBytes(stored.slice(PREFIX.length));
  if (combined.length < 12 + 16) throw new Error("Truncated encrypted finance payload");
  const iv = combined.subarray(0, 12);
  const ciphertext = combined.subarray(12);
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    rawKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["decrypt"]
  );
  const plainBuf = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, cryptoKey, ciphertext);
  return new TextDecoder().decode(plainBuf);
}
__name(decryptFinancePayload, "decryptFinancePayload");
async function encryptField(value, rawKey) {
  if (value == null) return null;
  return encryptFinancePayload(String(value), rawKey);
}
__name(encryptField, "encryptField");
async function decryptField(stored, rawKey) {
  if (stored == null || stored === "") return null;
  if (!stored.startsWith("ff1:")) return stored;
  return decryptFinancePayload(stored, rawKey);
}
__name(decryptField, "decryptField");

// src/tuya/client.js
var DATACENTERS = {
  eu: "https://openapi.tuyaeu.com",
  us: "https://openapi.tuyaus.com",
  cn: "https://openapi.tuyacn.com",
  in: "https://openapi.tuyain.com"
};
function tuyaBaseUrl(datacenter) {
  return DATACENTERS[String(datacenter || "").toLowerCase()] ?? DATACENTERS.eu;
}
__name(tuyaBaseUrl, "tuyaBaseUrl");
function toHex(buf) {
  const bytes = new Uint8Array(buf);
  let out = "";
  for (let i = 0; i < bytes.length; i++) {
    out += bytes[i].toString(16).padStart(2, "0");
  }
  return out;
}
__name(toHex, "toHex");
async function sha256Hex(data) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(data));
  return toHex(buf);
}
__name(sha256Hex, "sha256Hex");
async function buildStringToSign(method, path, bodyStr = "") {
  const contentHash = await sha256Hex(bodyStr);
  return `${method}
${contentHash}

${path}`;
}
__name(buildStringToSign, "buildStringToSign");
async function calcSign(secret, clientId, accessToken, t, n, stringToSign) {
  const str = accessToken ? `${clientId}${accessToken}${t}${n}${stringToSign}` : `${clientId}${t}${n}${stringToSign}`;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sigBuf = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(str));
  return toHex(sigBuf).toUpperCase();
}
__name(calcSign, "calcSign");
function nonce() {
  return crypto.randomUUID().replace(/-/g, "");
}
__name(nonce, "nonce");
async function tuyaFetch({ baseUrl, clientId, clientSecret, accessToken = null, method, path, body }) {
  const t = String(Date.now());
  const n = nonce();
  const bodyStr = body ? JSON.stringify(body) : "";
  const stringToSign = await buildStringToSign(method, path, bodyStr);
  const sig = await calcSign(clientSecret, clientId, accessToken, t, n, stringToSign);
  const headers = {
    client_id: clientId,
    sign: sig,
    t,
    sign_method: "HMAC-SHA256",
    nonce: n,
    "Content-Type": "application/json"
  };
  if (accessToken) headers.access_token = accessToken;
  const res = await fetch(`${baseUrl}${path}`, {
    method,
    headers,
    body: bodyStr || void 0
  });
  const json = await res.json();
  if (!json || json.success !== true) {
    const code = json?.code ?? "?";
    const msg = json?.msg ?? "unknown error";
    throw new Error(`Tuya API ${path}: [${code}] ${msg}`);
  }
  return json.result;
}
__name(tuyaFetch, "tuyaFetch");
async function getTuyaToken({ clientId, clientSecret, datacenter }) {
  const result = await tuyaFetch({
    baseUrl: tuyaBaseUrl(datacenter),
    clientId,
    clientSecret,
    method: "GET",
    path: "/v1.0/token?grant_type=1"
  });
  return {
    accessToken: result.access_token,
    expireTime: result.expire_time
  };
}
__name(getTuyaToken, "getTuyaToken");
function tuyaFetchWithToken(ctx, method, path, body) {
  return tuyaFetch({
    baseUrl: tuyaBaseUrl(ctx.datacenter),
    clientId: ctx.clientId,
    clientSecret: ctx.clientSecret,
    accessToken: ctx.accessToken,
    method,
    path,
    body
  });
}
__name(tuyaFetchWithToken, "tuyaFetchWithToken");
function getDeviceInfo(ctx, deviceId) {
  return tuyaFetchWithToken(ctx, "GET", `/v1.0/iot-03/devices/${deviceId}`);
}
__name(getDeviceInfo, "getDeviceInfo");
function getDeviceStatus(ctx, deviceId) {
  return tuyaFetchWithToken(ctx, "GET", `/v1.0/iot-03/devices/${deviceId}/status`);
}
__name(getDeviceStatus, "getDeviceStatus");
function getDeviceProperties(ctx, deviceId) {
  return tuyaFetchWithToken(ctx, "GET", `/v2.0/cloud/thing/${deviceId}/shadow/properties`);
}
__name(getDeviceProperties, "getDeviceProperties");
function getDeviceLogs(ctx, deviceId, { startMs, endMs, codes = "add_ele", size = 100, lastRowKey } = {}) {
  const qs2 = new URLSearchParams({
    type: "7",
    codes,
    start_time: String(startMs),
    end_time: String(endMs),
    size: String(size)
  });
  if (lastRowKey) qs2.set("last_row_key", lastRowKey);
  qs2.sort();
  return tuyaFetchWithToken(ctx, "GET", `/v1.0/devices/${deviceId}/logs?${qs2.toString()}`);
}
__name(getDeviceLogs, "getDeviceLogs");
async function getAddEleEvents(ctx, deviceId, { startMs, endMs, maxPages = 50 } = {}) {
  const out = [];
  let lastRowKey;
  for (let page = 0; page < maxPages; page++) {
    const r = await getDeviceLogs(ctx, deviceId, { startMs, endMs, codes: "add_ele", size: 100, lastRowKey });
    for (const l of r?.logs ?? []) {
      const eventMs = num(l.event_time);
      const raw2 = num(l.value);
      if (eventMs !== void 0 && raw2 !== void 0) out.push({ eventMs, kwh: raw2 / 1e3 });
    }
    if (!r?.has_more || !r?.last_row_key) break;
    lastRowKey = r.last_row_key;
  }
  return out;
}
__name(getAddEleEvents, "getAddEleEvents");
function getDeviceFunctions(ctx, deviceId) {
  return tuyaFetchWithToken(ctx, "GET", `/v1.0/iot-03/devices/${deviceId}/functions`);
}
__name(getDeviceFunctions, "getDeviceFunctions");
function listProjectDevices(ctx) {
  return tuyaFetchWithToken(ctx, "GET", "/v1.0/iot-01/associated-users/devices");
}
__name(listProjectDevices, "listProjectDevices");
function sendCommands(ctx, deviceId, commands) {
  return tuyaFetchWithToken(ctx, "POST", `/v1.0/iot-03/devices/${deviceId}/commands`, { commands });
}
__name(sendCommands, "sendCommands");
function getAcStatus(ctx, infraredId, remoteId) {
  return tuyaFetchWithToken(ctx, "GET", `/v2.0/infrareds/${infraredId}/remotes/${remoteId}/ac/status`);
}
__name(getAcStatus, "getAcStatus");
function sendAcCommand(ctx, infraredId, remoteId, code, value) {
  return tuyaFetchWithToken(
    ctx,
    "POST",
    `/v2.0/infrareds/${infraredId}/air-conditioners/${remoteId}/command`,
    { code, value }
  );
}
__name(sendAcCommand, "sendAcCommand");
function getRemoteKeys(ctx, infraredId, remoteId) {
  return tuyaFetchWithToken(ctx, "GET", `/v2.0/infrareds/${infraredId}/remotes/${remoteId}/keys`);
}
__name(getRemoteKeys, "getRemoteKeys");
function sendRemoteKey(ctx, infraredId, remoteId, { categoryId, key, keyId }) {
  return tuyaFetchWithToken(
    ctx,
    "POST",
    `/v2.0/infrareds/${infraredId}/remotes/${remoteId}/raw/command`,
    { category_id: categoryId, key, key_id: keyId }
  );
}
__name(sendRemoteKey, "sendRemoteKey");
function formatAcStatus(result) {
  return {
    power: num(result?.power),
    mode: num(result?.mode),
    temp: num(result?.temp),
    wind: num(result?.wind)
  };
}
__name(formatAcStatus, "formatAcStatus");
function round(n, decimals) {
  const f = 10 ** decimals;
  return Math.round(n * f) / f;
}
__name(round, "round");
function num(v2) {
  if (v2 === void 0 || v2 === null || v2 === "") return void 0;
  const n = Number(v2);
  return Number.isFinite(n) ? n : void 0;
}
__name(num, "num");
function formatStatuses(statuses) {
  const map = Object.fromEntries((statuses ?? []).map((s) => [s.code, s.value]));
  return formatMap(map);
}
__name(formatStatuses, "formatStatuses");
function formatProperties(result) {
  const props = result?.properties ?? result ?? [];
  const map = Object.fromEntries(props.map((p2) => [p2.code, p2.value]));
  const addEle = props.find((p2) => p2.code === "add_ele");
  const t = num(addEle?.time);
  return {
    ...formatMap(map),
    energyReportedAt: t !== void 0 ? new Date(t) : void 0
  };
}
__name(formatProperties, "formatProperties");
function formatMap(map) {
  const rawVoltage = num(map.cur_voltage);
  const rawPower = num(map.cur_power);
  const rawCurrent = num(map.cur_current);
  const rawEnergy = num(map.add_ele);
  return {
    switchOn: map.switch_1 ?? map.switch ?? map.switch_led,
    voltageV: rawVoltage !== void 0 ? round(rawVoltage / 10, 1) : void 0,
    powerW: rawPower !== void 0 ? round(rawPower / 10, 1) : void 0,
    currentA: rawCurrent !== void 0 ? round(rawCurrent / 1e3, 3) : void 0,
    energyKwh: rawEnergy !== void 0 ? round(rawEnergy / 1e3, 3) : void 0,
    raw: map
  };
}
__name(formatMap, "formatMap");

// src/tuya/commands.js
function parseValues(values) {
  if (values == null) return {};
  if (typeof values === "object") return values;
  try {
    return JSON.parse(values);
  } catch {
    return {};
  }
}
__name(parseValues, "parseValues");
function validateCommands(functionsJson, commands) {
  if (!Array.isArray(commands) || commands.length === 0) return "commands_required";
  const fns = functionsJson?.functions;
  if (!Array.isArray(fns) || fns.length === 0) return "no_functions_snapshot";
  const byCode = new Map(fns.map((f) => [f.code, f]));
  for (const cmd of commands) {
    if (!cmd || typeof cmd.code !== "string") return "command_not_allowed";
    const fn = byCode.get(cmd.code);
    if (!fn) return "command_not_allowed";
    const value = cmd.value;
    const type = String(fn.type || "").toLowerCase();
    if (type === "boolean") {
      if (typeof value !== "boolean") return "invalid_value";
    } else if (type === "enum") {
      const range = parseValues(fn.values).range;
      if (!Array.isArray(range) || !range.includes(value)) return "invalid_value";
    } else if (type === "integer") {
      const { min, max } = parseValues(fn.values);
      if (typeof value !== "number" || !Number.isFinite(value)) return "invalid_value";
      if (typeof min === "number" && value < min) return "invalid_value";
      if (typeof max === "number" && value > max) return "invalid_value";
    }
  }
  return null;
}
__name(validateCommands, "validateCommands");
var AC_CODES = {
  power: { min: 0, max: 1 },
  mode: { min: 0, max: 4 },
  temp: { min: 16, max: 30 },
  wind: { min: 0, max: 3 }
};
function validateAcCommands(commands) {
  if (!Array.isArray(commands) || commands.length === 0) return "commands_required";
  for (const cmd of commands) {
    if (!cmd || typeof cmd.code !== "string") return "command_not_allowed";
    const spec = AC_CODES[cmd.code];
    if (!spec) return "command_not_allowed";
    const value = cmd.value;
    if (typeof value !== "number" || !Number.isFinite(value)) return "invalid_value";
    if (value < spec.min || value > spec.max) return "invalid_value";
  }
  return null;
}
__name(validateAcCommands, "validateAcCommands");

// src/smartthings/oauth.js
var SMARTTHINGS_AUTHORIZE_URL = "https://oauthin-regional.api.smartthings.com/oauth/authorize";
var SMARTTHINGS_TOKEN_URL = "https://oauthin-regional.api.smartthings.com/oauth/token";
function parseTokenResponse(json, nowMs) {
  if (json.error) {
    const err = new Error(`SmartThings OAuth error: ${json.error}${json.error_description ? ` (${json.error_description})` : ""}`);
    err.code = json.error;
    throw err;
  }
  return {
    accessToken: json.access_token,
    refreshToken: json.refresh_token,
    scope: json.scope,
    expiresAt: nowMs + json.expires_in * 1e3
  };
}
__name(parseTokenResponse, "parseTokenResponse");
function basicAuthHeader(clientId, clientSecret) {
  return "Basic " + btoa(`${clientId}:${clientSecret}`);
}
__name(basicAuthHeader, "basicAuthHeader");
async function postTokenRequest(params, { clientId, clientSecret, fetchFn, nowMs }) {
  const res = await fetchFn(SMARTTHINGS_TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: basicAuthHeader(clientId, clientSecret),
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: new URLSearchParams(params).toString()
  });
  return parseTokenResponse(await res.json(), nowMs);
}
__name(postTokenRequest, "postTokenRequest");
async function exchangeCodeForTokens({ code, clientId, clientSecret, redirectUri }, { fetchFn = fetch, nowMs = Date.now() } = {}) {
  return postTokenRequest(
    { grant_type: "authorization_code", code, redirect_uri: redirectUri },
    { clientId, clientSecret, fetchFn, nowMs }
  );
}
__name(exchangeCodeForTokens, "exchangeCodeForTokens");
async function refreshAccessToken({ refreshToken, clientId, clientSecret }, { fetchFn = fetch, nowMs = Date.now() } = {}) {
  const tokens = await postTokenRequest(
    { grant_type: "refresh_token", refresh_token: refreshToken, client_id: clientId },
    { clientId, clientSecret, fetchFn, nowMs }
  );
  if (!tokens.refreshToken) tokens.refreshToken = refreshToken;
  return tokens;
}
__name(refreshAccessToken, "refreshAccessToken");
function isAccessTokenExpired(expiresAt, nowMs, skewSec = 60) {
  return nowMs >= expiresAt - skewSec * 1e3;
}
__name(isAccessTokenExpired, "isAccessTokenExpired");
async function ensureFreshAccessToken({ credential, clientId, clientSecret }, { nowMs = Date.now(), refreshFn = refreshAccessToken, onRefreshed } = {}) {
  if (!isAccessTokenExpired(credential.expiresAt, nowMs)) {
    return credential.accessToken;
  }
  const tokens = await refreshFn(
    { refreshToken: credential.refreshToken, clientId, clientSecret },
    { nowMs }
  );
  if (onRefreshed) await onRefreshed(tokens);
  return tokens.accessToken;
}
__name(ensureFreshAccessToken, "ensureFreshAccessToken");
function buildAuthorizeUrl({ clientId, redirectUri, scopes, state }) {
  const url = new URL(SMARTTHINGS_AUTHORIZE_URL);
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("scope", scopes.join(" "));
  url.searchParams.set("state", state);
  return url.toString();
}
__name(buildAuthorizeUrl, "buildAuthorizeUrl");

// src/smartthings/credentials.js
async function refreshExpiringTokens(sql, { clientId, clientSecret, rawKey }, { withinMs = 13 * 3600 * 1e3, nowMs = Date.now(), refreshFn = refreshAccessToken } = {}) {
  const cutoff = new Date(nowMs + withinMs).toISOString();
  const rows = await sql`
    SELECT household_id, refresh_token_enc, scopes, created_by
    FROM smartthings_credentials WHERE expires_at < ${cutoff}
  `;
  let refreshed = 0;
  let failed = 0;
  for (const row of rows) {
    try {
      const refreshToken = await decryptField(row.refresh_token_enc, rawKey);
      const tokens = await refreshFn({ refreshToken, clientId, clientSecret }, { nowMs });
      await saveTokens(sql, {
        householdId: row.household_id,
        tokens,
        scopes: row.scopes,
        createdBy: row.created_by,
        rawKey
      });
      refreshed++;
    } catch (err) {
      failed++;
      console.error("[smartthings] refresh failed for household", row.household_id, err?.code || err);
    }
  }
  return { due: rows.length, refreshed, failed };
}
__name(refreshExpiringTokens, "refreshExpiringTokens");
async function loadCredentialRow(sql, householdId) {
  const [row] = await sql`
    SELECT household_id, access_token_enc, refresh_token_enc, expires_at, scopes,
           location_id, samsung_account_id, verified_at
    FROM smartthings_credentials WHERE household_id = ${householdId}
  `;
  return row ?? null;
}
__name(loadCredentialRow, "loadCredentialRow");
async function saveTokens(sql, { householdId, tokens, scopes, createdBy, rawKey }) {
  const accessEnc = await encryptField(tokens.accessToken, rawKey);
  const refreshEnc = await encryptField(tokens.refreshToken, rawKey);
  const expiresAtIso = new Date(tokens.expiresAt).toISOString();
  await sql`
    INSERT INTO smartthings_credentials
      (household_id, access_token_enc, refresh_token_enc, expires_at, scopes, verified_at, created_by, updated_at)
    VALUES
      (${householdId}, ${accessEnc}, ${refreshEnc}, ${expiresAtIso}, ${scopes ?? null}, NOW(), ${createdBy ?? null}, NOW())
    ON CONFLICT (household_id) DO UPDATE SET
      access_token_enc = EXCLUDED.access_token_enc,
      refresh_token_enc = EXCLUDED.refresh_token_enc,
      expires_at = EXCLUDED.expires_at,
      scopes = COALESCE(EXCLUDED.scopes, smartthings_credentials.scopes),
      verified_at = NOW(),
      updated_at = NOW()
  `;
}
__name(saveTokens, "saveTokens");
async function getFreshAccessToken(sql, { householdId, clientId, clientSecret, rawKey }, opts = {}) {
  const row = await loadCredentialRow(sql, householdId);
  if (!row) return null;
  const credential = {
    accessToken: await decryptField(row.access_token_enc, rawKey),
    refreshToken: await decryptField(row.refresh_token_enc, rawKey),
    expiresAt: new Date(row.expires_at).getTime()
  };
  return ensureFreshAccessToken(
    { credential, clientId, clientSecret },
    {
      nowMs: opts.nowMs,
      refreshFn: opts.refreshFn ?? refreshAccessToken,
      onRefreshed: /* @__PURE__ */ __name(async (tokens) => saveTokens(sql, { householdId, tokens, scopes: row.scopes, createdBy: row.created_by, rawKey }), "onRefreshed")
    }
  );
}
__name(getFreshAccessToken, "getFreshAccessToken");

// src/smartthings/client.js
var SMARTTHINGS_API_BASE = "https://api.smartthings.com/v1";
async function stGet(ctx, path) {
  const res = await fetch(`${SMARTTHINGS_API_BASE}${path}`, {
    headers: { Authorization: `Bearer ${ctx.accessToken}`, Accept: "application/json" }
  });
  if (!res.ok) {
    const body = await res.text();
    const err = new Error(`SmartThings ${path} \u2192 ${res.status} ${res.statusText}`);
    err.status = res.status;
    err.body = body;
    throw err;
  }
  return res.json();
}
__name(stGet, "stGet");
async function getStDevices(ctx) {
  const json = await stGet(ctx, "/devices");
  return json?.items ?? [];
}
__name(getStDevices, "getStDevices");
async function getStDevice(ctx, deviceId) {
  return stGet(ctx, `/devices/${deviceId}`);
}
__name(getStDevice, "getStDevice");
async function getStDeviceStatus(ctx, deviceId) {
  return stGet(ctx, `/devices/${deviceId}/status`);
}
__name(getStDeviceStatus, "getStDeviceStatus");
async function sendStCommand(ctx, deviceId, command) {
  const res = await fetch(`${SMARTTHINGS_API_BASE}/devices/${deviceId}/commands`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${ctx.accessToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ commands: [command] })
  });
  if (!res.ok) {
    const body = await res.text();
    const err = new Error(`SmartThings command \u2192 ${res.status} ${res.statusText}`);
    err.status = res.status;
    err.body = body;
    throw err;
  }
  return res.json().catch(() => ({}));
}
__name(sendStCommand, "sendStCommand");

// src/smartthings/devices.js
var TYPE_BY_CAPABILITY = {
  washerOperatingState: "washer",
  dryerOperatingState: "dryer",
  dishwasherOperatingState: "dishwasher"
};
function capabilityIds(device) {
  const ids = [];
  for (const component of device?.components ?? []) {
    for (const cap of component?.capabilities ?? []) {
      if (cap?.id) ids.push(cap.id);
    }
  }
  return ids;
}
__name(capabilityIds, "capabilityIds");
function inferDeviceType(device) {
  const ids = capabilityIds(device);
  for (const id of ids) {
    if (TYPE_BY_CAPABILITY[id]) return TYPE_BY_CAPABILITY[id];
  }
  if (ids.includes("refrigeration")) return "fridge";
  if (ids.includes("airConditionerMode")) return "ac";
  if (ids.includes("tvChannel") || ids.includes("mediaInputSource")) return "tv";
  return "other";
}
__name(inferDeviceType, "inferDeviceType");
function summarizeDevices(response) {
  return (response?.items ?? []).map((device) => ({
    deviceId: device.deviceId,
    label: device.label ?? device.name ?? "(bez nazwy)",
    type: inferDeviceType(device)
  }));
}
__name(summarizeDevices, "summarizeDevices");

// src/smartthings/washer.js
function attr(status, capability, attribute) {
  return status?.components?.main?.[capability]?.[attribute]?.value ?? null;
}
__name(attr, "attr");
var WASHER_SETTINGS = {
  temperature: {
    capability: "custom.washerWaterTemperature",
    command: "setWasherWaterTemperature",
    currentAttr: "washerWaterTemperature",
    supportedAttr: "supportedWasherWaterTemperature"
  },
  spin: {
    capability: "custom.washerSpinLevel",
    command: "setWasherSpinLevel",
    currentAttr: "washerSpinLevel",
    supportedAttr: "supportedWasherSpinLevel"
  },
  rinse: {
    capability: "custom.washerRinseCycles",
    command: "setWasherRinseCycles",
    currentAttr: "washerRinseCycles",
    supportedAttr: "supportedWasherRinseCycles"
  },
  bubbleSoak: {
    capability: "samsungce.washerBubbleSoak",
    command: "setWasherBubbleSoak",
    currentAttr: "status",
    // Bez listy „supported" w statusie — namaczanie to zawsze on/off.
    staticOptions: ["off", "on"]
  },
  cycle: {
    capability: "samsungce.washerCycle",
    command: "setWasherCycle",
    // Aktualny cykl jest jak "Table_02_Course_1C" → interesuje nas sam kod kursu (1C).
    currentAttr: "washerCycle",
    // Lista kodów kursów żyje pod custom.supportedOptions.supportedCourses.
    coursesCapability: "custom.supportedOptions",
    coursesAttr: "supportedCourses"
  }
};
var TEMP_LABEL = { none: "Brak", cold: "Zimna", 20: "20\xB0C", 30: "30\xB0C", 40: "40\xB0C", 60: "60\xB0C", 70: "70\xB0C", 90: "90\xB0C" };
var SPIN_LABEL = { noSpin: "Bez wirowania", rinseHold: "Stop w wodzie", 400: "400 obr.", 800: "800 obr.", 1e3: "1000 obr.", 1200: "1200 obr.", 1400: "1400 obr." };
var BUBBLE_LABEL = { on: "W\u0142\u0105czone", off: "Wy\u0142\u0105czone" };
var COURSE_LABEL = {
  // ✓ potwierdzone przez usera (na sprzęcie) lub jednoznaczne po parametrach
  "1C": "Eco 40-60",
  // ✓ user
  "1B": "Bawe\u0142na",
  // ✓ user
  "1E": "Pranie szybkie 15",
  // ✓ user
  "1F": "Ekonomiczne",
  // ✓ user
  26: "Delikatne",
  // ✓ user
  20: "Higieniczna para",
  // ✓ user
  24: "Po\u015Bciel",
  // ✓ user
  25: "Syntetyki",
  // ✓ user
  32: "Koszule",
  // ✓ user
  22: "We\u0142na",
  // ✓ user
  28: "Wirowanie",
  // ✓ pewne (bez płukania)
  "3A": "Czyszczenie b\u0119bna",
  // ✓ pewne (70° zablokowane)
  27: "P\u0142ukanie i wirowanie",
  // ✓ pewne (bez prania, auto)
  // — poniżej: dopasowane po parametrach i zweryfikowane przez usera na sprzęcie —
  "2E": "Dzieci\u0119ce",
  // ? 90°/1400/4× płuk
  34: "Mieszane",
  // ? 40–60°/1400/3× płuk
  33: "R\u0119czniki",
  // ? 60°/1400/4× płuk
  "2A": "Jeansy",
  // ? 30°/800/4× płuk
  "2F": "Odzie\u017C sportowa",
  // ? 30°/800/3× płuk
  30: "Pochmurny dzie\u0144",
  // ? user (zamiana z 21)
  23: "Odzie\u017C wierzchnia",
  // ? user (zamiana z 2D)
  21: "Kolory",
  // ? zamiana z 30
  "2D": "Ciche pranie"
  // ? zamiana z 23
};
var CYCLE_ORDER = [
  "1C",
  "21",
  "33",
  "1E",
  "1B",
  "27",
  "3A",
  "1F",
  "25",
  "26",
  "24",
  "32",
  "20",
  "22",
  "23",
  "2F",
  "2A",
  "2E",
  "2D",
  "34",
  "30",
  "28"
];
var cycleRank = /* @__PURE__ */ __name((v2) => {
  const i = CYCLE_ORDER.indexOf(String(v2));
  return i === -1 ? CYCLE_ORDER.length : i;
}, "cycleRank");
function shortTemp(v2) {
  return v2 === "cold" ? "zimna" : `${v2}\xB0`;
}
__name(shortTemp, "shortTemp");
function shortSpin(v2) {
  return v2 === "noSpin" ? "bez wir." : v2 === "rinseHold" ? "stop w wodzie" : `${v2} obr`;
}
__name(shortSpin, "shortSpin");
function describeCourse(status, code) {
  const cycles = attr(status, "samsungce.washerCycle", "supportedCycles");
  const entry = Array.isArray(cycles) ? cycles.find((cyc) => cyc?.cycle === code) : null;
  if (!entry?.supportedOptions) return null;
  const o = entry.supportedOptions;
  const parts = [];
  if (o.waterTemperature?.default && o.waterTemperature.default !== "none") parts.push(shortTemp(o.waterTemperature.default));
  if (o.spinLevel?.default) parts.push(shortSpin(o.spinLevel.default));
  if (o.rinseCycle?.default && o.rinseCycle.default !== "0") parts.push(`${o.rinseCycle.default}\xD7 p\u0142uk`);
  return parts.length ? parts.join(" \xB7 ") : null;
}
__name(describeCourse, "describeCourse");
function labelFor(setting, value, ctx) {
  if (setting === "temperature") return TEMP_LABEL[value] ?? String(value);
  if (setting === "spin") return SPIN_LABEL[value] ?? String(value);
  if (setting === "rinse") return value === "0" ? "Bez p\u0142ukania" : `${value}\xD7 p\u0142ukanie`;
  if (setting === "bubbleSoak") return BUBBLE_LABEL[value] ?? String(value);
  if (setting === "cycle") {
    return ctx?.custom?.[value] ?? COURSE_LABEL[value] ?? describeCourse(ctx?.status, value) ?? `Program ${value}`;
  }
  return String(value);
}
__name(labelFor, "labelFor");
function courseCode(raw2) {
  if (!raw2) return null;
  const m2 = String(raw2).match(/Course_([0-9A-Za-z]+)$/);
  return m2 ? m2[1] : String(raw2);
}
__name(courseCode, "courseCode");
function supportedValues(status, setting) {
  const def = WASHER_SETTINGS[setting];
  if (!def) return [];
  if (def.staticOptions) {
    return attr(status, def.capability, def.currentAttr) != null ? def.staticOptions : [];
  }
  if (setting === "cycle") return attr(status, def.coursesCapability, def.coursesAttr) ?? [];
  return attr(status, def.capability, def.supportedAttr) ?? [];
}
__name(supportedValues, "supportedValues");
function readWasherSettings(status, customLabels) {
  const ctx = { custom: customLabels && typeof customLabels === "object" ? customLabels : null, status };
  const out = {};
  for (const setting of Object.keys(WASHER_SETTINGS)) {
    const def = WASHER_SETTINGS[setting];
    const raw2 = supportedValues(status, setting).filter((v2) => v2 !== "none");
    if (!raw2.length) continue;
    if (setting === "cycle") raw2.sort((a2, b) => cycleRank(a2) - cycleRank(b));
    const current = setting === "cycle" ? courseCode(attr(status, def.capability, def.currentAttr)) : attr(status, def.capability, def.currentAttr);
    out[setting] = {
      value: current != null ? String(current) : null,
      options: raw2.map((v2) => ({ value: String(v2), label: labelFor(setting, v2, ctx) }))
    };
  }
  return Object.keys(out).length ? out : null;
}
__name(readWasherSettings, "readWasherSettings");
function allowedWasherSettings(status) {
  const out = {};
  for (const setting of Object.keys(WASHER_SETTINGS)) {
    const raw2 = supportedValues(status, setting).filter((v2) => v2 !== "none").map(String);
    if (raw2.length) out[setting] = raw2;
  }
  return out;
}
__name(allowedWasherSettings, "allowedWasherSettings");

// src/smartthings/status.js
function attr2(status, capability, attribute) {
  return status?.components?.main?.[capability]?.[attribute]?.value ?? null;
}
__name(attr2, "attr");
var CYCLE_CAPABILITY = {
  washer: "washerOperatingState",
  dryer: "dryerOperatingState",
  dishwasher: "dishwasherOperatingState"
};
function isCycleJobComplete(jobState, operatingState) {
  if (jobState === "finished" || jobState === "finish") return true;
  if (operatingState === "finished") return true;
  return false;
}
__name(isCycleJobComplete, "isCycleJobComplete");
var ACTIVE_JOB_PHASES = /* @__PURE__ */ new Set([
  "wash",
  "washing",
  "rinse",
  "rinsing",
  "spin",
  "dry",
  "drying",
  "prewash",
  "cooling",
  "airwash"
]);
function isCycleActivelyRunning(signals) {
  if (!signals) return false;
  const { machineState, jobState, operatingState } = signals;
  if (machineState === "run" || machineState === "pause") return true;
  if (operatingState === "running" || operatingState === "paused") return true;
  if (jobState && ACTIVE_JOB_PHASES.has(jobState)) return true;
  return false;
}
__name(isCycleActivelyRunning, "isCycleActivelyRunning");
function extractCycleSignals(status, type) {
  const cap = CYCLE_CAPABILITY[type];
  if (!cap) return null;
  const samsungCap = `samsungce.${cap}`;
  return {
    machineState: attr2(status, cap, "machineState"),
    jobState: attr2(status, samsungCap, `${type}JobState`) ?? attr2(status, cap, `${type}JobState`),
    operatingState: attr2(status, samsungCap, "operatingState")
  };
}
__name(extractCycleSignals, "extractCycleSignals");
function mapCycleDevice(status, type, cycleLabels) {
  const cap = CYCLE_CAPABILITY[type];
  const samsungCap = `samsungce.${cap}`;
  const signals = extractCycleSignals(status, type);
  const machineState = signals?.machineState;
  const jobState = signals?.jobState;
  const operatingState = signals?.operatingState;
  const remainingMin = attr2(status, samsungCap, "remainingTime");
  const completionTime = attr2(status, cap, "completionTime");
  const settings = type === "washer" ? readWasherSettings(status, cycleLabels) : null;
  if (machineState === "run") {
    return { type, state: "running", label: "W trakcie", remainingMin, completionTime, settings };
  }
  if (machineState === "pause") {
    return { type, state: "paused", label: "Pauza", remainingMin, completionTime, settings };
  }
  if (isCycleJobComplete(jobState, operatingState)) {
    return { type, state: "finished", label: "Gotowe", remainingMin: null, completionTime: null, settings };
  }
  return { type, state: "idle", label: "Bezczynna", remainingMin: null, completionTime: null, settings };
}
__name(mapCycleDevice, "mapCycleDevice");
function mapFridge(status) {
  const door = attr2(status, "contactSensor", "contact");
  const tempC = attr2(status, "temperatureMeasurement", "temperature");
  return {
    type: "fridge",
    state: "on",
    label: door === "open" ? "Drzwi otwarte" : "Dzia\u0142a",
    door,
    tempC
  };
}
__name(mapFridge, "mapFridge");
var AC_MODE_LABEL = {
  cool: "Ch\u0142odzenie",
  heat: "Grzanie",
  dry: "Osuszanie",
  wind: "Wentylacja",
  fanOnly: "Wentylacja",
  auto: "Auto"
};
function mapAc(status) {
  const on = attr2(status, "switch", "switch") === "on";
  const mode = attr2(status, "airConditionerMode", "airConditionerMode");
  return {
    type: "ac",
    state: on ? "on" : "off",
    label: on ? AC_MODE_LABEL[mode] || "W\u0142\u0105czona" : "Wy\u0142\u0105czona",
    mode,
    targetTempC: attr2(status, "thermostatCoolingSetpoint", "coolingSetpoint"),
    tempC: attr2(status, "temperatureMeasurement", "temperature")
  };
}
__name(mapAc, "mapAc");
function mapTv(status) {
  const on = attr2(status, "switch", "switch") === "on";
  return {
    type: "tv",
    state: on ? "on" : "off",
    label: on ? "W\u0142\u0105czony" : "Wy\u0142\u0105czony",
    volume: attr2(status, "audioVolume", "volume"),
    channel: attr2(status, "tvChannel", "tvChannelName") ?? attr2(status, "tvChannel", "tvChannel")
  };
}
__name(mapTv, "mapTv");
function nativePower(status) {
  const pcr = attr2(status, "powerConsumptionReport", "powerConsumption");
  if (!pcr || typeof pcr !== "object") return null;
  return {
    ...pcr.power != null ? { nativeW: pcr.power } : {},
    ...pcr.energy != null ? { nativeEnergyKwh: pcr.energy / 1e3 } : {}
  };
}
__name(nativePower, "nativePower");
function mapStStatus(status, deviceType, cycleLabels) {
  const base = mapStType(status, deviceType, cycleLabels);
  const native = nativePower(status);
  return native ? { ...base, ...native } : base;
}
__name(mapStStatus, "mapStStatus");
function mapStType(status, deviceType, cycleLabels) {
  if (CYCLE_CAPABILITY[deviceType]) {
    return mapCycleDevice(status, deviceType, cycleLabels);
  }
  if (deviceType === "fridge") {
    return mapFridge(status);
  }
  if (deviceType === "ac") {
    return mapAc(status);
  }
  if (deviceType === "tv") {
    return mapTv(status);
  }
  return { type: deviceType || "other", state: "unknown", label: "Nieznany stan", remainingMin: null, completionTime: null, fallback: true };
}
__name(mapStType, "mapStType");

// src/smartthings/commands.js
var CYCLE_CAPABILITY2 = {
  washer: "washerOperatingState",
  dryer: "dryerOperatingState",
  dishwasher: "dishwasherOperatingState"
};
var ACTION_TO_STATE = { start: "run", pause: "pause", stop: "stop" };
function buildStCommand(deviceType, action) {
  const capability = CYCLE_CAPABILITY2[deviceType];
  const stateArg = ACTION_TO_STATE[action];
  if (!capability || !stateArg) return null;
  return { component: "main", capability, command: "setMachineState", arguments: [stateArg] };
}
__name(buildStCommand, "buildStCommand");
function attr3(status, capability, attribute) {
  return status?.components?.main?.[capability]?.[attribute]?.value ?? null;
}
__name(attr3, "attr");
var ACTIONS_BY_STATE = {
  run: ["pause", "stop"],
  pause: ["start", "stop"],
  stop: ["start"]
};
function allowedStActions(deviceType, status) {
  const capability = CYCLE_CAPABILITY2[deviceType];
  const remoteControlEnabled = attr3(status, "remoteControlStatus", "remoteControlEnabled") === "true";
  if (!capability || !remoteControlEnabled) {
    return { remoteControlEnabled, actions: [] };
  }
  const machineState = attr3(status, capability, "machineState");
  return { remoteControlEnabled, actions: ACTIONS_BY_STATE[machineState] ?? ["start"] };
}
__name(allowedStActions, "allowedStActions");
function buildStSettingCommand(deviceType, setting, value) {
  if (deviceType !== "washer") return null;
  const def = WASHER_SETTINGS[setting];
  if (!def || value == null) return null;
  return { component: "main", capability: def.capability, command: def.command, arguments: [String(value)] };
}
__name(buildStSettingCommand, "buildStSettingCommand");
function allowedStSetting(deviceType, status, setting, value) {
  if (deviceType !== "washer") return { ok: false, reason: "unsupported" };
  const remoteControlEnabled = attr3(status, "remoteControlStatus", "remoteControlEnabled") === "true";
  if (!remoteControlEnabled) return { ok: false, reason: "remote_control_disabled", remoteControlEnabled };
  const supported = allowedWasherSettings(status)[setting];
  if (!supported) return { ok: false, reason: "unsupported", remoteControlEnabled };
  if (!supported.includes(String(value))) return { ok: false, reason: "value_not_supported", remoteControlEnabled };
  return { ok: true, remoteControlEnabled };
}
__name(allowedStSetting, "allowedStSetting");

// src/finance-relational.js
var CURRENT_YEAR = 2026;
var ACTIVITY_LOG_MAX = 150;
function emptyMonth() {
  return { incomes: [], expenses: [], deletedFixed: { incomes: [], expenses: [] } };
}
__name(emptyMonth, "emptyMonth");
function pickDate(item, year2, month) {
  if (typeof item?.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(item.date)) {
    return item.date;
  }
  return `${year2}-${String(month + 1).padStart(2, "0")}-01`;
}
__name(pickDate, "pickDate");
async function readFinanceFromRelational(sql, householdId, rawKey) {
  const [txns, deleted, savings, categories, goalRows, activity] = await Promise.all([
    sql`SELECT id, kind, name, amount, txn_date, year, month, is_fixed, category, created_by, updated_at
        FROM transactions WHERE household_id = ${householdId}
        ORDER BY year, month, txn_date`,
    sql`SELECT year, month, kind, name FROM deleted_fixed_items WHERE household_id = ${householdId}`,
    sql`SELECT id, name, amount, icon, created_by, updated_at FROM savings_accounts WHERE household_id = ${householdId} ORDER BY created_at`,
    sql`SELECT id, name, monthly_limit, created_by, updated_at FROM category_budgets WHERE household_id = ${householdId} ORDER BY created_at`,
    sql`SELECT type, monthly_amount, yearly_amount, target_month FROM savings_goals WHERE household_id = ${householdId}`,
    sql`SELECT id, user_id, user_name, at, action, kind, label, amount, month
        FROM activity_log WHERE household_id = ${householdId}
        ORDER BY at DESC LIMIT ${ACTIVITY_LOG_MAX}`
  ]);
  const months = {};
  for (let m2 = 0; m2 < 12; m2++) months[m2] = emptyMonth();
  for (const t of txns) {
    const name = await decryptField(t.name, rawKey);
    const amountStr = await decryptField(t.amount, rawKey);
    const amount = amountStr == null ? 0 : Number(amountStr);
    const item = {
      id: t.id,
      name: name ?? "",
      amount: Number.isFinite(amount) ? amount : 0,
      isFixed: t.is_fixed,
      date: t.txn_date,
      createdBy: t.created_by ?? null,
      updatedAt: t.updated_at instanceof Date ? t.updated_at.toISOString() : String(t.updated_at)
    };
    if (t.kind === "expense" && !t.is_fixed && t.category) {
      item.category = t.category;
    }
    const monthBucket = months[t.month] ?? (months[t.month] = emptyMonth());
    if (t.kind === "income") monthBucket.incomes.push(item);
    else monthBucket.expenses.push(item);
  }
  for (const d of deleted) {
    const bucket = months[d.month] ?? (months[d.month] = emptyMonth());
    if (d.kind === "income") bucket.deletedFixed.incomes.push(d.name);
    else bucket.deletedFixed.expenses.push(d.name);
  }
  const savingsAccounts = [];
  for (const s of savings) {
    const name = await decryptField(s.name, rawKey);
    const amountStr = await decryptField(s.amount, rawKey);
    savingsAccounts.push({
      id: s.id,
      name: name ?? "",
      amount: amountStr == null ? 0 : Number(amountStr) || 0,
      icon: s.icon ?? "bank",
      createdBy: s.created_by ?? null,
      updatedAt: s.updated_at instanceof Date ? s.updated_at.toISOString() : String(s.updated_at)
    });
  }
  const categoryBudgets = [];
  for (const c of categories) {
    const name = await decryptField(c.name, rawKey);
    const limitStr = await decryptField(c.monthly_limit, rawKey);
    categoryBudgets.push({
      id: c.id,
      name: name ?? "",
      limit: limitStr == null ? 0 : Number(limitStr) || 0,
      createdBy: c.created_by ?? null,
      updatedAt: c.updated_at instanceof Date ? c.updated_at.toISOString() : String(c.updated_at)
    });
  }
  let savingsGoal = { type: "none", monthlyAmount: 0, yearlyAmount: 0, targetMonth: 11 };
  if (goalRows[0]) {
    const g = goalRows[0];
    const monthlyAmount = await decryptField(g.monthly_amount, rawKey);
    const yearlyAmount = await decryptField(g.yearly_amount, rawKey);
    savingsGoal = {
      type: g.type,
      monthlyAmount: monthlyAmount == null ? 0 : Number(monthlyAmount) || 0,
      yearlyAmount: yearlyAmount == null ? 0 : Number(yearlyAmount) || 0,
      targetMonth: g.target_month
    };
  }
  const activityLog = [];
  for (const a2 of activity) {
    const label = await decryptField(a2.label, rawKey);
    const amountStr = await decryptField(a2.amount, rawKey);
    const userName = await decryptField(a2.user_name, rawKey);
    activityLog.push({
      id: a2.id,
      at: a2.at instanceof Date ? a2.at.toISOString() : a2.at,
      userId: a2.user_id,
      userName: userName ?? "",
      action: a2.action,
      kind: a2.kind ?? void 0,
      ...label != null ? { label } : {},
      ...amountStr != null ? { amount: Number(amountStr) || 0 } : {},
      ...a2.month != null ? { month: a2.month } : {}
    });
  }
  activityLog.reverse();
  return { months, savingsGoal, savingsAccounts, categoryBudgets, activityLog };
}
__name(readFinanceFromRelational, "readFinanceFromRelational");
async function writeFinanceToRelational(sql, householdId, data, rawKey, options = {}) {
  const onlyActivity = options.onlyActivity === true;
  const skipTransactions = onlyActivity || options.skipTransactions === true;
  const skipSavings = onlyActivity;
  const skipCategories = onlyActivity;
  const skipGoal = onlyActivity;
  const months = data?.months ?? {};
  const savingsAccounts = Array.isArray(data?.savingsAccounts) ? data.savingsAccounts : [];
  const categoryBudgets = Array.isArray(data?.categoryBudgets) ? data.categoryBudgets : [];
  const activityLog = Array.isArray(data?.activityLog) ? data.activityLog.slice(-ACTIVITY_LOG_MAX) : [];
  const savingsGoal = data?.savingsGoal ?? null;
  const txnInserts = [];
  const deletedFixedInserts = [];
  for (let m2 = 0; m2 < 12; m2++) {
    const md = months[m2] ?? months[String(m2)];
    if (!md) continue;
    for (const inc of md.incomes ?? []) {
      txnInserts.push({
        kind: "income",
        nameEnc: await encryptField(inc.name, rawKey),
        amountEnc: await encryptField(inc.amount, rawKey),
        txn_date: pickDate(inc, CURRENT_YEAR, m2),
        year: CURRENT_YEAR,
        month: m2,
        is_fixed: !!inc.isFixed,
        category: null,
        legacy_id: inc.id != null ? String(inc.id) : null
      });
    }
    for (const exp of md.expenses ?? []) {
      txnInserts.push({
        kind: "expense",
        nameEnc: await encryptField(exp.name, rawKey),
        amountEnc: await encryptField(exp.amount, rawKey),
        txn_date: pickDate(exp, CURRENT_YEAR, m2),
        year: CURRENT_YEAR,
        month: m2,
        is_fixed: !!exp.isFixed,
        category: exp.isFixed ? null : exp.category ?? null,
        legacy_id: exp.id != null ? String(exp.id) : null
      });
    }
    const df = md.deletedFixed ?? {};
    for (const name of df.incomes ?? []) {
      deletedFixedInserts.push({ year: CURRENT_YEAR, month: m2, kind: "income", name });
    }
    for (const name of df.expenses ?? []) {
      deletedFixedInserts.push({ year: CURRENT_YEAR, month: m2, kind: "expense", name });
    }
  }
  const savingsInserts = [];
  for (const s of savingsAccounts) {
    savingsInserts.push({
      nameEnc: await encryptField(s.name, rawKey),
      amountEnc: await encryptField(s.amount, rawKey),
      icon: s.icon ?? null,
      legacy_id: s.id != null ? String(s.id) : null
    });
  }
  const categoryInserts = [];
  for (const c of categoryBudgets) {
    categoryInserts.push({
      nameEnc: await encryptField(c.name, rawKey),
      limitEnc: await encryptField(c.limit, rawKey),
      legacy_id: c.id != null ? String(c.id) : null
    });
  }
  const activityInserts = [];
  for (const a2 of activityLog) {
    activityInserts.push({
      user_id: a2.userId ?? null,
      userNameEnc: await encryptField(a2.userName, rawKey),
      at: a2.at ? new Date(a2.at).toISOString() : (/* @__PURE__ */ new Date()).toISOString(),
      action: a2.action ?? "unknown",
      kind: a2.kind ?? null,
      labelEnc: await encryptField(a2.label, rawKey),
      amountEnc: await encryptField(a2.amount, rawKey),
      month: Number.isInteger(a2.month) ? a2.month : null,
      legacy_id: a2.id != null ? String(a2.id) : null
    });
  }
  let goalInsert = null;
  if (savingsGoal && savingsGoal.type) {
    goalInsert = {
      type: savingsGoal.type,
      monthlyEnc: await encryptField(savingsGoal.monthlyAmount, rawKey),
      yearlyEnc: await encryptField(savingsGoal.yearlyAmount, rawKey),
      target_month: Number.isInteger(savingsGoal.targetMonth) ? savingsGoal.targetMonth : 11
    };
  }
  const queries = [sql`DELETE FROM activity_log WHERE household_id = ${householdId}`];
  if (!skipSavings) {
    queries.push(sql`DELETE FROM savings_accounts WHERE household_id = ${householdId}`);
  }
  if (!skipCategories) {
    queries.push(sql`DELETE FROM category_budgets WHERE household_id = ${householdId}`);
  }
  if (!skipGoal) {
    queries.push(sql`DELETE FROM savings_goals WHERE household_id = ${householdId}`);
  }
  if (!skipTransactions) {
    queries.unshift(
      sql`DELETE FROM transactions WHERE household_id = ${householdId}`,
      sql`DELETE FROM deleted_fixed_items WHERE household_id = ${householdId}`
    );
    for (const t of txnInserts) {
      queries.push(sql`
        INSERT INTO transactions
          (household_id, kind, name, amount, txn_date, year, month, is_fixed, category, legacy_id)
        VALUES
          (${householdId}, ${t.kind}, ${t.nameEnc}, ${t.amountEnc}, ${t.txn_date},
           ${t.year}, ${t.month}, ${t.is_fixed}, ${t.category}, ${t.legacy_id})
      `);
    }
    for (const d of deletedFixedInserts) {
      queries.push(sql`
        INSERT INTO deleted_fixed_items (household_id, year, month, kind, name)
        VALUES (${householdId}, ${d.year}, ${d.month}, ${d.kind}, ${d.name})
        ON CONFLICT DO NOTHING
      `);
    }
  }
  if (!skipSavings) {
    for (const s of savingsInserts) {
      queries.push(sql`
        INSERT INTO savings_accounts (household_id, name, amount, icon, legacy_id)
        VALUES (${householdId}, ${s.nameEnc}, ${s.amountEnc}, ${s.icon}, ${s.legacy_id})
      `);
    }
  }
  if (!skipCategories) {
    for (const c of categoryInserts) {
      queries.push(sql`
        INSERT INTO category_budgets (household_id, name, monthly_limit, legacy_id)
        VALUES (${householdId}, ${c.nameEnc}, ${c.limitEnc}, ${c.legacy_id})
      `);
    }
  }
  if (!skipGoal && goalInsert) {
    queries.push(sql`
      INSERT INTO savings_goals (household_id, type, monthly_amount, yearly_amount, target_month)
      VALUES (${householdId}, ${goalInsert.type}, ${goalInsert.monthlyEnc},
              ${goalInsert.yearlyEnc}, ${goalInsert.target_month})
    `);
  }
  for (const a2 of activityInserts) {
    queries.push(sql`
      INSERT INTO activity_log
        (household_id, user_id, user_name, at, action, kind, label, amount, month, legacy_id)
      VALUES
        (${householdId}, ${a2.user_id}, ${a2.userNameEnc}, ${a2.at}, ${a2.action},
         ${a2.kind}, ${a2.labelEnc}, ${a2.amountEnc}, ${a2.month}, ${a2.legacy_id})
    `);
  }
  await sql.transaction(queries);
  return {
    txn_count: txnInserts.length,
    deleted_fixed_count: deletedFixedInserts.length,
    savings_count: savingsInserts.length,
    category_count: categoryInserts.length,
    activity_count: activityInserts.length,
    has_goal: goalInsert != null
  };
}
__name(writeFinanceToRelational, "writeFinanceToRelational");

// src/action-log.js
var MAX_ENTRIES_PER_HOUSEHOLD = 20;
async function logAction(sql, {
  householdId,
  actorId,
  operation,
  resourceType,
  resourceId,
  before,
  after,
  undoesEntryId = null
}) {
  const [row] = await sql`
    INSERT INTO action_log
      (household_id, actor_id, operation, resource_type, resource_id, before, after, undoes_entry_id)
    VALUES
      (${householdId}, ${actorId}, ${operation}, ${resourceType}, ${resourceId ?? null},
       ${before == null ? null : JSON.stringify(before)},
       ${after == null ? null : JSON.stringify(after)},
       ${undoesEntryId})
    RETURNING id, at
  `;
  await sql`
    DELETE FROM action_log
    WHERE household_id = ${householdId}
      AND id NOT IN (
        SELECT id FROM action_log
        WHERE household_id = ${householdId}
        ORDER BY at DESC, id DESC
        LIMIT ${MAX_ENTRIES_PER_HOUSEHOLD}
      )
  `;
  return { id: row.id, at: row.at };
}
__name(logAction, "logAction");

// src/weather.js
var OPEN_METEO_URL = "https://api.open-meteo.com/v1/forecast";
var GOOGLE_WEATHER_URL = "https://weather.googleapis.com/v1/currentConditions:lookup";
var GEOCODING_URL = "https://geocoding-api.open-meteo.com/v1/search";
var FETCH_TIMEOUT_MS = 8e3;
var CONDITION_LABELS = {
  clear: "Bezchmurnie",
  "partly-cloudy": "Cz\u0119\u015Bciowe zachmurzenie",
  cloudy: "Zachmurzenie",
  fog: "Mg\u0142a",
  drizzle: "M\u017Cawka",
  rain: "Deszcz",
  sleet: "Deszcz ze \u015Bniegiem",
  snow: "\u015Anieg",
  thunder: "Burza"
};
function makeCondition(code, isDay) {
  const safe = CONDITION_LABELS[code] ? code : "cloudy";
  return { code: safe, isDay: isDay !== false, label: CONDITION_LABELS[safe] };
}
__name(makeCondition, "makeCondition");
function googleTypeToCode(type) {
  const t = String(type || "").toUpperCase();
  if (t.includes("THUNDER")) return "thunder";
  if (t.includes("RAIN_AND_SNOW") || t.includes("SLEET")) return "sleet";
  if (t.includes("SNOW") || t.includes("HAIL") || t.includes("BLIZZARD")) return "snow";
  if (t.includes("DRIZZLE")) return "drizzle";
  if (t.includes("RAIN") || t.includes("SHOWER")) return "rain";
  if (t.includes("FOG") || t.includes("MIST") || t.includes("HAZE")) return "fog";
  if (t.includes("CLOUDY")) return t.includes("PARTLY") ? "partly-cloudy" : "cloudy";
  if (t.includes("MOSTLY_CLEAR") || t.includes("PARTLY")) return "partly-cloudy";
  if (t.includes("CLEAR")) return "clear";
  return "cloudy";
}
__name(googleTypeToCode, "googleTypeToCode");
function wmoToCode(wmo) {
  const c = Number(wmo);
  if (c === 0) return "clear";
  if (c === 1 || c === 2) return "partly-cloudy";
  if (c === 3) return "cloudy";
  if (c === 45 || c === 48) return "fog";
  if (c >= 51 && c <= 57) return "drizzle";
  if (c >= 61 && c <= 65 || c >= 80 && c <= 82) return "rain";
  if (c === 66 || c === 67) return "sleet";
  if (c >= 71 && c <= 77 || c === 85 || c === 86) return "snow";
  if (c >= 95) return "thunder";
  return "cloudy";
}
__name(wmoToCode, "wmoToCode");
async function fetchOutdoorWeatherGoogle({ lat, lon }, apiKey) {
  const url = `${GOOGLE_WEATHER_URL}?key=${encodeURIComponent(apiKey)}&location.latitude=${lat}&location.longitude=${lon}&unitsSystem=METRIC&languageCode=pl`;
  const res = await fetch(url, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
  if (!res.ok) throw new Error(`Google Weather HTTP ${res.status}`);
  const data = await res.json();
  const temp = data?.temperature?.degrees;
  if (typeof temp !== "number" || !Number.isFinite(temp)) return null;
  const wc = data?.weatherCondition;
  const condition = wc?.type ? makeCondition(googleTypeToCode(wc.type), data?.isDaytime) : null;
  return { temp, condition };
}
__name(fetchOutdoorWeatherGoogle, "fetchOutdoorWeatherGoogle");
async function fetchOutdoorWeatherOpenMeteo({ lat, lon }) {
  const url = `${OPEN_METEO_URL}?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code,is_day`;
  const res = await fetch(url, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
  if (!res.ok) throw new Error(`Open-Meteo HTTP ${res.status}`);
  const data = await res.json();
  const temp = data?.current?.temperature_2m;
  if (typeof temp !== "number" || !Number.isFinite(temp)) return null;
  const code = data?.current?.weather_code;
  const condition = code == null ? null : makeCondition(wmoToCode(code), data?.current?.is_day !== 0);
  return { temp, condition };
}
__name(fetchOutdoorWeatherOpenMeteo, "fetchOutdoorWeatherOpenMeteo");
async function getOutdoorWeather({ lat, lon }, { apiKey } = {}) {
  if (apiKey) {
    try {
      return await fetchOutdoorWeatherGoogle({ lat, lon }, apiKey);
    } catch (err) {
      console.warn("[weather] Google Weather failed, fallback to Open-Meteo", err);
    }
  }
  return fetchOutdoorWeatherOpenMeteo({ lat, lon });
}
__name(getOutdoorWeather, "getOutdoorWeather");
async function getOutdoorTemp({ lat, lon }, opts) {
  const w2 = await getOutdoorWeather({ lat, lon }, opts);
  return w2 ? w2.temp : null;
}
__name(getOutdoorTemp, "getOutdoorTemp");
async function geocodeCity(name) {
  const q = (name ?? "").trim();
  if (!q) return null;
  const url = `${GEOCODING_URL}?name=${encodeURIComponent(q)}&count=1&language=pl&format=json`;
  const res = await fetch(url, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
  if (!res.ok) throw new Error(`Open-Meteo Geocoding HTTP ${res.status}`);
  const data = await res.json();
  const hit = data?.results?.[0];
  if (!hit || typeof hit.latitude !== "number" || typeof hit.longitude !== "number") return null;
  const label = [hit.name, hit.admin1, hit.country].filter(Boolean).join(", ");
  return { lat: hit.latitude, lon: hit.longitude, label };
}
__name(geocodeCity, "geocodeCity");

// src/ir-plug-power.js
var IR_PLUG_STANDBY_W = 20;
function acPowerOnFromPlugW(plugW) {
  if (plugW == null || !Number.isFinite(plugW)) return null;
  return plugW > IR_PLUG_STANDBY_W;
}
__name(acPowerOnFromPlugW, "acPowerOnFromPlugW");
function reconcileAcPower(ac, plugPowerOn) {
  if (plugPowerOn == null || !ac) return ac;
  const power = plugPowerOn ? 1 : 0;
  return ac.power === power ? ac : { ...ac, power };
}
__name(reconcileAcPower, "reconcileAcPower");
async function readPlugPowerW(ctx, plugTuyaId) {
  if (!plugTuyaId) return null;
  const f = formatStatuses(await getDeviceStatus(ctx, plugTuyaId));
  return f.powerW ?? 0;
}
__name(readPlugPowerW, "readPlugPowerW");

// src/ac-thermostat.js
function climateModeFromAc(acMode, stored = "cool") {
  if (acMode === 1) return "heat";
  if (acMode === 0) return "cool";
  return stored === "heat" ? "heat" : "cool";
}
__name(climateModeFromAc, "climateModeFromAc");
function decide({ temp, tempOn, tempOff, lastAction, acPowerOn = null, mode = "cool" }) {
  let desired = null;
  if (mode === "heat") {
    if (temp <= tempOn) desired = "on";
    else if (temp >= tempOff) desired = "off";
  } else {
    if (temp >= tempOn) desired = "on";
    else if (temp <= tempOff) desired = "off";
  }
  if (desired === null) return null;
  const current = acPowerOn === true ? "on" : acPowerOn === false ? "off" : lastAction;
  if (desired === current) return null;
  return desired;
}
__name(decide, "decide");
async function runAcThermostats(sql, rawKey, { readOutdoorTemp, notifyAcPower }) {
  const rows = await sql`
    SELECT th.id, th.household_id, th.device_id, th.lat, th.lon,
           th.climate_mode, th.temp_on, th.temp_off, th.last_action,
           sd.tuya_device_id, sd.ir_parent_id, sd.linked_plug_id, sd.display_name,
           plug.tuya_device_id AS plug_tuya_id,
           tc.client_id_enc, tc.client_secret_enc, tc.datacenter
    FROM ac_thermostats th
    JOIN smart_devices sd ON sd.id = th.device_id
    LEFT JOIN smart_devices plug ON plug.id = sd.linked_plug_id
    JOIN tuya_credentials tc ON tc.household_id = th.household_id
    WHERE th.enabled = true AND sd.device_type = 'ir_ac'
  `;
  const ctxByHousehold = /* @__PURE__ */ new Map();
  let checked = 0;
  let switched = 0;
  let failed = 0;
  for (const r of rows) {
    try {
      const temp = await readOutdoorTemp({ lat: Number(r.lat), lon: Number(r.lon) });
      if (temp == null || !Number.isFinite(temp)) {
        failed++;
        continue;
      }
      let ctx = ctxByHousehold.get(r.household_id);
      if (!ctx) {
        const clientId = await decryptField(r.client_id_enc, rawKey);
        const clientSecret = await decryptField(r.client_secret_enc, rawKey);
        const { accessToken } = await getTuyaToken({ clientId, clientSecret, datacenter: r.datacenter });
        ctx = { clientId, clientSecret, datacenter: r.datacenter, accessToken };
        ctxByHousehold.set(r.household_id, ctx);
      }
      let acPowerOn = null;
      let acModeNum = null;
      if (r.plug_tuya_id) {
        try {
          acPowerOn = acPowerOnFromPlugW(await readPlugPowerW(ctx, r.plug_tuya_id));
        } catch (err) {
          console.warn("[ac-thermostat] plug power read failed", r.plug_tuya_id, err);
        }
      }
      try {
        const ac = formatAcStatus(await getAcStatus(ctx, r.ir_parent_id, r.tuya_device_id));
        if (acPowerOn === null) {
          if (ac.power === 1) acPowerOn = true;
          else if (ac.power === 0) acPowerOn = false;
        }
        if (ac.mode === 0 || ac.mode === 1) acModeNum = ac.mode;
      } catch (err) {
        console.warn("[ac-thermostat] AC status read failed, falling back to last_action", r.tuya_device_id, err);
      }
      const climateMode = climateModeFromAc(acModeNum, r.climate_mode);
      const action = decide({
        temp,
        tempOn: Number(r.temp_on),
        tempOff: Number(r.temp_off),
        lastAction: r.last_action,
        acPowerOn,
        mode: climateMode
      });
      if (action) {
        await sendAcCommand(ctx, r.ir_parent_id, r.tuya_device_id, "power", action === "on" ? 1 : 0);
        await sql`
          UPDATE ac_thermostats
          SET last_action = ${action}, last_check_action = ${action},
              last_outdoor_temp = ${temp}, last_checked_at = NOW()
          WHERE id = ${r.id}
        `;
        switched++;
        if (notifyAcPower) {
          try {
            await notifyAcPower({
              householdId: r.household_id,
              action,
              deviceName: r.display_name,
              outdoorTemp: temp,
              source: "thermostat"
            });
          } catch (err) {
            console.warn("[ac-thermostat] push notify failed", err);
          }
        }
      } else {
        await sql`
          UPDATE ac_thermostats
          SET last_check_action = NULL, last_outdoor_temp = ${temp}, last_checked_at = NOW()
          WHERE id = ${r.id}
        `;
      }
      checked++;
    } catch (err) {
      console.error("[ac-thermostat] check failed", r.tuya_device_id, err);
      failed++;
    }
  }
  return { checked, switched, failed };
}
__name(runAcThermostats, "runAcThermostats");
function thermostatThresholdGap(mode, tempOn, tempOff) {
  return mode === "heat" ? tempOff - tempOn : tempOn - tempOff;
}
__name(thermostatThresholdGap, "thermostatThresholdGap");

// node_modules/@pushforge/builder/dist/lib/crypto.js
if (!globalThis.crypto?.subtle) {
  throw new Error("Web Crypto API not available. Ensure you are using Node.js 20+ or a modern runtime with globalThis.crypto support.");
}
var isomorphicCrypto = globalThis.crypto;
var crypto2 = {
  /**
   * Fills the given typed array with cryptographically secure random values.
   *
   * @param {T} array - The typed array to fill with random values.
   * @returns {T} The filled typed array.
   * @template T - The type of the typed array (e.g., Uint8Array).
   */
  getRandomValues(array) {
    return isomorphicCrypto.getRandomValues(array);
  },
  /**
   * Provides access to subtle cryptographic operations.
   *
   * @type {SubtleCrypto} The subtle cryptographic interface.
   */
  subtle: isomorphicCrypto.subtle
};

// node_modules/@pushforge/builder/dist/lib/utils.js
var stringFromArrayBuffer = /* @__PURE__ */ __name((s) => {
  let result = "";
  for (const code of new Uint8Array(s))
    result += String.fromCharCode(code);
  return result;
}, "stringFromArrayBuffer");
var base64Decode = /* @__PURE__ */ __name((base64String) => {
  const paddedBase64 = base64String.padEnd(base64String.length + (4 - (base64String.length % 4 || 4)) % 4, "=");
  if (typeof Buffer !== "undefined") {
    return Buffer.from(paddedBase64, "base64").toString("binary");
  }
  if (typeof atob === "function") {
    return atob(paddedBase64);
  }
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
  let result = "";
  let i = 0;
  while (i < paddedBase64.length) {
    const enc1 = characters.indexOf(paddedBase64.charAt(i++));
    const enc2 = characters.indexOf(paddedBase64.charAt(i++));
    const enc3 = characters.indexOf(paddedBase64.charAt(i++));
    const enc4 = characters.indexOf(paddedBase64.charAt(i++));
    const char1 = enc1 << 2 | enc2 >> 4;
    const char2 = (enc2 & 15) << 4 | enc3 >> 2;
    const char3 = (enc3 & 3) << 6 | enc4;
    result += String.fromCharCode(char1);
    if (enc3 !== 64)
      result += String.fromCharCode(char2);
    if (enc4 !== 64)
      result += String.fromCharCode(char3);
  }
  return result;
}, "base64Decode");
var getPublicKeyFromJwk = /* @__PURE__ */ __name((jwk) => base64UrlEncode(`${base64Decode(base64UrlDecodeString(jwk.x))}${base64Decode(base64UrlDecodeString(jwk.y))}`), "getPublicKeyFromJwk");
var concatTypedArrays = /* @__PURE__ */ __name((arrays) => {
  const length = arrays.reduce((accumulator, current) => accumulator + current.byteLength, 0);
  let index = 0;
  const targetArray = new Uint8Array(length);
  for (const array of arrays) {
    targetArray.set(array, index);
    index += array.byteLength;
  }
  return targetArray;
}, "concatTypedArrays");

// node_modules/@pushforge/builder/dist/lib/base64.js
var base64UrlEncode = /* @__PURE__ */ __name((input) => {
  const text = typeof input === "string" ? input : stringFromArrayBuffer(input);
  let base64;
  if (typeof globalThis !== "undefined" && "btoa" in globalThis) {
    base64 = globalThis.btoa(text);
  } else {
    base64 = Buffer.from(text, "binary").toString("base64");
  }
  return base64.replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}, "base64UrlEncode");
var base64UrlDecodeString = /* @__PURE__ */ __name((s) => {
  if (!s)
    throw new Error("Invalid input");
  return s.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - s.length % 4) % 4);
}, "base64UrlDecodeString");
var base64UrlDecode = /* @__PURE__ */ __name((input) => {
  const base64 = base64UrlDecodeString(input);
  if (typeof globalThis !== "undefined" && "atob" in globalThis) {
    const binaryString = globalThis.atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  }
  return Buffer.from(base64, "base64").buffer;
}, "base64UrlDecode");

// node_modules/@pushforge/builder/dist/lib/shared-secret.js
var deriveSharedSecret = /* @__PURE__ */ __name(async (clientPublicKey, localPrivateKey) => {
  const sharedSecretBytes = await crypto2.subtle.deriveBits({ name: "ECDH", public: clientPublicKey }, localPrivateKey, 256);
  return crypto2.subtle.importKey("raw", sharedSecretBytes, { name: "HKDF" }, false, ["deriveBits", "deriveKey"]);
}, "deriveSharedSecret");

// node_modules/@pushforge/builder/dist/lib/payload.js
var importClientKeys = /* @__PURE__ */ __name(async (keys) => {
  const auth = base64UrlDecode(keys.auth);
  if (auth.byteLength !== 16) {
    throw new Error(`Incorrect auth length, expected 16 bytes but got ${auth.byteLength}`);
  }
  let decodedKey;
  const base64Key = base64UrlDecodeString(keys.p256dh);
  if (typeof globalThis !== "undefined" && "atob" in globalThis) {
    const binaryStr = globalThis.atob(base64Key);
    decodedKey = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) {
      decodedKey[i] = binaryStr.charCodeAt(i);
    }
  } else {
    decodedKey = new Uint8Array(Buffer.from(base64Key, "base64"));
  }
  if (decodedKey.byteLength !== 65) {
    throw new Error(`Invalid p256dh key: expected 65 bytes but got ${decodedKey.byteLength} bytes`);
  }
  if (decodedKey[0] !== 4) {
    throw new Error(`Invalid p256dh key: expected uncompressed point format (0x04 prefix) but got 0x${decodedKey[0].toString(16).padStart(2, "0")}`);
  }
  const p256 = await crypto2.subtle.importKey("jwk", {
    kty: "EC",
    crv: "P-256",
    x: base64UrlEncode(decodedKey.slice(1, 33)),
    y: base64UrlEncode(decodedKey.slice(33, 65)),
    ext: true
  }, { name: "ECDH", namedCurve: "P-256" }, true, []);
  return { auth, p256 };
}, "importClientKeys");
var derivePseudoRandomKey = /* @__PURE__ */ __name(async (auth, sharedSecret) => {
  const pseudoRandomKeyBytes = await crypto2.subtle.deriveBits({
    name: "HKDF",
    hash: "SHA-256",
    salt: auth,
    // Adding Content-Encoding data info here is required by the Web Push API
    info: new TextEncoder().encode("Content-Encoding: auth\0")
  }, sharedSecret, 256);
  return crypto2.subtle.importKey("raw", pseudoRandomKeyBytes, "HKDF", false, [
    "deriveBits"
  ]);
}, "derivePseudoRandomKey");
var createContext = /* @__PURE__ */ __name(async (clientPublicKey, localPublicKey) => {
  const [clientKeyBytes, localKeyBytes] = await Promise.all([
    crypto2.subtle.exportKey("raw", clientPublicKey),
    crypto2.subtle.exportKey("raw", localPublicKey)
  ]);
  return concatTypedArrays([
    new TextEncoder().encode("P-256\0"),
    new Uint8Array([0, clientKeyBytes.byteLength]),
    new Uint8Array(clientKeyBytes),
    new Uint8Array([0, localKeyBytes.byteLength]),
    new Uint8Array(localKeyBytes)
  ]);
}, "createContext");
var deriveNonce = /* @__PURE__ */ __name(async (pseudoRandomKey, salt, context) => {
  const nonceInfo = concatTypedArrays([
    new TextEncoder().encode("Content-Encoding: nonce\0"),
    context
  ]);
  return crypto2.subtle.deriveBits({ name: "HKDF", hash: "SHA-256", salt, info: nonceInfo }, pseudoRandomKey, 12 * 8);
}, "deriveNonce");
var deriveContentEncryptionKey = /* @__PURE__ */ __name(async (pseudoRandomKey, salt, context) => {
  const info = concatTypedArrays([
    new TextEncoder().encode("Content-Encoding: aesgcm\0"),
    context
  ]);
  const bits = await crypto2.subtle.deriveBits({ name: "HKDF", hash: "SHA-256", salt, info }, pseudoRandomKey, 16 * 8);
  return crypto2.subtle.importKey("raw", bits, "AES-GCM", false, ["encrypt"]);
}, "deriveContentEncryptionKey");
var MAX_PAYLOAD_SIZE = 4078;
var PADDING_LENGTH_PREFIX_SIZE = 2;
var padPayload = /* @__PURE__ */ __name((payload) => {
  const maxPayloadContentSize = MAX_PAYLOAD_SIZE - PADDING_LENGTH_PREFIX_SIZE;
  if (payload.byteLength > maxPayloadContentSize) {
    throw new Error(`Payload too large. Maximum size is ${maxPayloadContentSize} bytes, but received ${payload.byteLength} bytes`);
  }
  const availableSpace = MAX_PAYLOAD_SIZE - PADDING_LENGTH_PREFIX_SIZE - payload.byteLength;
  const maxRandomPadding = Math.min(100, availableSpace);
  const paddingSize = maxRandomPadding > 0 ? Math.floor(Math.random() * (maxRandomPadding + 1)) : 0;
  const paddingArray = new ArrayBuffer(PADDING_LENGTH_PREFIX_SIZE + paddingSize);
  new DataView(paddingArray).setUint16(0, paddingSize);
  return concatTypedArrays([new Uint8Array(paddingArray), payload]);
}, "padPayload");
var encryptPayload = /* @__PURE__ */ __name(async (localKeys, salt, payload, target) => {
  const clientKeys = await importClientKeys(target.keys);
  const sharedSecret = await deriveSharedSecret(clientKeys.p256, localKeys.privateKey);
  const pseudoRandomKey = await derivePseudoRandomKey(clientKeys.auth, sharedSecret);
  const context = await createContext(clientKeys.p256, localKeys.publicKey);
  const nonce2 = await deriveNonce(pseudoRandomKey, salt, context);
  const contentEncryptionKey = await deriveContentEncryptionKey(pseudoRandomKey, salt, context);
  const encodedPayload = new TextEncoder().encode(payload);
  const paddedPayload = padPayload(encodedPayload);
  return crypto2.subtle.encrypt({ name: "AES-GCM", iv: nonce2 }, contentEncryptionKey, paddedPayload);
}, "encryptPayload");

// node_modules/@pushforge/builder/dist/lib/jwt.js
var createJwt = /* @__PURE__ */ __name(async (jwk, jwtData) => {
  const jwtInfo = {
    typ: "JWT",
    // Type of the token
    alg: "ES256"
    // Algorithm used for signing
  };
  const base64JwtInfo = base64UrlEncode(JSON.stringify(jwtInfo));
  const base64JwtData = base64UrlEncode(JSON.stringify(jwtData));
  const unsignedToken = `${base64JwtInfo}.${base64JwtData}`;
  const privateKey = await crypto2.subtle.importKey("jwk", jwk, { name: "ECDSA", namedCurve: "P-256" }, true, ["sign"]);
  const signature = await crypto2.subtle.sign({ name: "ECDSA", hash: { name: "SHA-256" } }, privateKey, new TextEncoder().encode(unsignedToken)).then((token) => base64UrlEncode(token));
  return `${base64JwtInfo}.${base64JwtData}.${signature}`;
}, "createJwt");

// node_modules/@pushforge/builder/dist/lib/vapid.js
var vapidHeaders = /* @__PURE__ */ __name(async (options, payloadLength, salt, localPublicKey) => {
  const localPublicKeyBase64 = await crypto2.subtle.exportKey("raw", localPublicKey).then((bytes) => base64UrlEncode(bytes));
  const serverPublicKey = getPublicKeyFromJwk(options.jwk);
  const jwt = await createJwt(options.jwk, options.jwt);
  const headerValues = {
    Encryption: `salt=${base64UrlEncode(salt)}`,
    "Crypto-Key": `dh=${localPublicKeyBase64}`,
    "Content-Length": payloadLength.toString(),
    "Content-Type": "application/octet-stream",
    "Content-Encoding": "aesgcm",
    Authorization: `vapid t=${jwt}, k=${serverPublicKey}`
  };
  let headers;
  if (options.ttl !== void 0)
    headerValues.TTL = options.ttl.toString();
  if (options.topic !== void 0)
    headerValues.Topic = options.topic;
  if (options.urgency !== void 0)
    headerValues.Urgency = options.urgency;
  if (typeof Headers !== "undefined") {
    headers = new Headers(headerValues);
  } else {
    headers = headerValues;
  }
  return headers;
}, "vapidHeaders");

// node_modules/@pushforge/builder/dist/lib/request.js
var validatePrivateJWK = /* @__PURE__ */ __name((jwk) => {
  if (jwk.kty !== "EC") {
    throw new Error(`Invalid JWK: 'kty' must be 'EC', received '${jwk.kty ?? "undefined"}'`);
  }
  if (jwk.crv !== "P-256") {
    throw new Error(`Invalid JWK: 'crv' must be 'P-256', received '${jwk.crv ?? "undefined"}'`);
  }
  if (!jwk.x || typeof jwk.x !== "string") {
    throw new Error("Invalid JWK: missing or invalid 'x' coordinate");
  }
  if (!jwk.y || typeof jwk.y !== "string") {
    throw new Error("Invalid JWK: missing or invalid 'y' coordinate");
  }
  if (!jwk.d || typeof jwk.d !== "string") {
    throw new Error("Invalid JWK: missing or invalid 'd' (private key)");
  }
}, "validatePrivateJWK");
var validateEndpoint = /* @__PURE__ */ __name((endpoint) => {
  let url;
  try {
    url = new URL(endpoint);
  } catch {
    throw new Error(`Invalid subscription endpoint: '${endpoint}' is not a valid URL`);
  }
  if (url.protocol !== "https:") {
    throw new Error(`Invalid subscription endpoint: push endpoints must use HTTPS, received '${url.protocol}'`);
  }
}, "validateEndpoint");
async function buildPushHTTPRequest({ privateJWK, message: message2, subscription }) {
  let jwk;
  try {
    jwk = typeof privateJWK === "string" ? JSON.parse(privateJWK) : privateJWK;
  } catch {
    throw new Error("Invalid privateJWK: failed to parse JSON string");
  }
  validatePrivateJWK(jwk);
  validateEndpoint(subscription.endpoint);
  const MAX_TTL = 24 * 60 * 60;
  if (message2.options?.ttl && message2.options.ttl > MAX_TTL) {
    throw new Error("TTL must be less than 24 hours");
  }
  const ttl = message2.options?.ttl && message2.options.ttl > 0 ? message2.options.ttl : MAX_TTL;
  const jwt = {
    aud: new URL(subscription.endpoint).origin,
    exp: Math.floor(Date.now() / 1e3) + ttl,
    sub: message2.adminContact
  };
  const options = {
    jwk,
    jwt,
    payload: JSON.stringify(message2.payload),
    ttl,
    ...message2.options?.urgency && {
      urgency: message2.options.urgency
    },
    ...message2.options?.topic && {
      topic: message2.options.topic
    }
  };
  const salt = crypto2.getRandomValues(new Uint8Array(16));
  const localKeys = await crypto2.subtle.generateKey({ name: "ECDH", namedCurve: "P-256" }, true, ["deriveBits"]);
  const body = await encryptPayload(localKeys, salt, options.payload, subscription);
  const headers = await vapidHeaders(options, body.byteLength, salt, localKeys.publicKey);
  return { endpoint: subscription.endpoint, body, headers };
}
__name(buildPushHTTPRequest, "buildPushHTTPRequest");

// src/push.js
function formatAcPowerPushMessage({ action, deviceName, outdoorTemp, source }) {
  const on = action === "on";
  const title = on ? "Klimatyzacja w\u0142\u0105czona" : "Klimatyzacja wy\u0142\u0105czona";
  const device = deviceName?.trim() || "Klima";
  const tempPart = outdoorTemp != null && Number.isFinite(Number(outdoorTemp)) ? ` \xB7 ${Number(outdoorTemp).toFixed(1).replace(/\.0$/, "")}\xB0C na zewn\u0105trz` : "";
  const sourcePart = source === "thermostat" ? " (termostat)" : source === "timer" ? " (wy\u0142\u0105cznik czasowy)" : source === "manual" ? " (r\u0119cznie)" : "";
  const body = `${device}${tempPart}${sourcePart}`;
  return { title, body };
}
__name(formatAcPowerPushMessage, "formatAcPowerPushMessage");
function formatCycleCompletePushMessage({ deviceName, deviceType }) {
  const typeLabel = deviceType === "dryer" ? "Suszarka" : deviceType === "dishwasher" ? "Zmywarka" : "Pralka";
  const title = `${typeLabel} \u2014 cykl zako\u0144czony`;
  const device = deviceName?.trim() || typeLabel;
  const body = `${device} zako\u0144czy\u0142a prac\u0119.`;
  return { title, body };
}
__name(formatCycleCompletePushMessage, "formatCycleCompletePushMessage");
function formatPlugPowerPushMessage({ deviceName, powerW, thresholdW, direction = "above" }) {
  const above = direction !== "below";
  const title = above ? "Gniazdko \u2014 wysoki pob\xF3r mocy" : "Gniazdko \u2014 niski pob\xF3r mocy";
  const device = deviceName?.trim() || "Gniazdko";
  const w2 = Number(powerW);
  const t = Number(thresholdW);
  const powerPart = Number.isFinite(w2) ? `${Math.round(w2)} W` : "\u2014";
  const thresholdPart = Number.isFinite(t) ? `${Math.round(t)} W` : "\u2014";
  const cmp = above ? ">" : "<";
  const body = `${device}: ${powerPart} (${cmp} ${thresholdPart})`;
  return { title, body };
}
__name(formatPlugPowerPushMessage, "formatPlugPowerPushMessage");
function parsePrivateJwk(raw2) {
  if (!raw2?.trim()) return null;
  try {
    return JSON.parse(raw2);
  } catch {
    return null;
  }
}
__name(parsePrivateJwk, "parsePrivateJwk");
function pushConfigured(env) {
  return Boolean(env?.VAPID_PUBLIC_KEY?.trim() && parsePrivateJwk(env?.VAPID_PRIVATE_JWK));
}
__name(pushConfigured, "pushConfigured");
async function sendPushToSubscriptions(sql, env, rows, { title, body, url, tag: tag2 = "ac-power" }) {
  if (!rows.length) return { sent: 0, failed: 0, removed: 0, reason: "no_subscriptions" };
  const privateJWK = parsePrivateJwk(env.VAPID_PRIVATE_JWK);
  const adminContact = env.PUSH_ADMIN_CONTACT?.trim() || "mailto:support@homecashflow.org";
  let sent = 0;
  let failed = 0;
  const staleIds = [];
  for (const row of rows) {
    try {
      const subscription = {
        endpoint: row.endpoint,
        keys: { p256dh: row.p256dh, auth: row.auth }
      };
      const { endpoint, headers, body: reqBody } = await buildPushHTTPRequest({
        privateJWK,
        subscription,
        message: {
          payload: { title, body, url, tag: tag2 },
          adminContact,
          options: { urgency: "normal", ttl: 86400, topic: tag2 }
        }
      });
      const res = await fetch(endpoint, { method: "POST", headers, body: reqBody });
      if (res.ok || res.status === 201) {
        sent++;
        continue;
      }
      if (res.status === 404 || res.status === 410) {
        staleIds.push(row.id);
        continue;
      }
      console.warn("[push] delivery failed", res.status, row.endpoint?.slice(0, 60));
      failed++;
    } catch (err) {
      console.warn("[push] send error", err);
      failed++;
    }
  }
  if (staleIds.length) {
    await sql`DELETE FROM push_subscriptions WHERE id = ANY(${staleIds}::uuid[])`;
  }
  return { sent, failed, removed: staleIds.length };
}
__name(sendPushToSubscriptions, "sendPushToSubscriptions");
async function notifyUserPush(sql, env, userId, { title, body, url = "/?view=urzadzenia" }) {
  if (!pushConfigured(env)) return { sent: 0, skipped: true, reason: "not_configured" };
  const rows = await sql`
    SELECT id, endpoint, p256dh, auth
    FROM push_subscriptions
    WHERE user_id = ${userId} AND ac_power_notify = true
  `;
  return sendPushToSubscriptions(sql, env, rows, { title, body, url, tag: "push-test" });
}
__name(notifyUserPush, "notifyUserPush");
async function notifyHouseholdAcPower(sql, env, payload) {
  if (!pushConfigured(env)) return { sent: 0, skipped: true, reason: "not_configured" };
  const { householdId, action, deviceName, outdoorTemp, source } = payload;
  if (action !== "on" && action !== "off") return { sent: 0, skipped: true, reason: "invalid_action" };
  const rows = await sql`
    SELECT ps.id, ps.endpoint, ps.p256dh, ps.auth
    FROM push_subscriptions ps
    JOIN household_members hm ON hm.user_id = ps.user_id
    WHERE hm.household_id = ${householdId}
      AND ps.ac_power_notify = true
  `;
  const { title, body } = formatAcPowerPushMessage({ action, deviceName, outdoorTemp, source });
  const result = await sendPushToSubscriptions(sql, env, rows, {
    title,
    body,
    url: "/?view=urzadzenia",
    tag: "ac-power"
  });
  if (result.sent === 0 && !result.skipped) {
    console.warn("[push] ac-power: nothing delivered", { householdId, action, ...result });
  }
  return result;
}
__name(notifyHouseholdAcPower, "notifyHouseholdAcPower");
async function notifyHouseholdCycleComplete(sql, env, payload) {
  if (!pushConfigured(env)) return { sent: 0, skipped: true, reason: "not_configured" };
  const { householdId, deviceName, deviceType } = payload;
  const rows = await sql`
    SELECT ps.id, ps.endpoint, ps.p256dh, ps.auth
    FROM push_subscriptions ps
    JOIN household_members hm ON hm.user_id = ps.user_id
    WHERE hm.household_id = ${householdId}
      AND ps.washer_cycle_notify = true
  `;
  const { title, body } = formatCycleCompletePushMessage({ deviceName, deviceType });
  const result = await sendPushToSubscriptions(sql, env, rows, {
    title,
    body,
    url: "/?view=urzadzenia",
    tag: "washer-cycle"
  });
  if (result.sent === 0 && !result.skipped) {
    console.warn("[push] cycle-complete: nothing delivered", { householdId, ...result });
  }
  return result;
}
__name(notifyHouseholdCycleComplete, "notifyHouseholdCycleComplete");
async function notifyHouseholdPlugPower(sql, env, payload) {
  if (!pushConfigured(env)) return { sent: 0, skipped: true, reason: "not_configured" };
  const { householdId, deviceName, powerW, thresholdW, direction = "above" } = payload;
  const rows = await sql`
    SELECT ps.id, ps.endpoint, ps.p256dh, ps.auth
    FROM push_subscriptions ps
    JOIN household_members hm ON hm.user_id = ps.user_id
    WHERE hm.household_id = ${householdId}
      AND ps.plug_power_notify = true
  `;
  const { title, body } = formatPlugPowerPushMessage({ deviceName, powerW, thresholdW, direction });
  const tag2 = direction === "below" ? "plug-power-below" : "plug-power-above";
  const result = await sendPushToSubscriptions(sql, env, rows, {
    title,
    body,
    url: "/?view=urzadzenia",
    tag: tag2
  });
  if (result.sent === 0 && !result.skipped) {
    console.warn("[push] plug-power: nothing delivered", { householdId, ...result });
  }
  return result;
}
__name(notifyHouseholdPlugPower, "notifyHouseholdPlugPower");

// src/device-notifications.js
var CYCLE_TYPES = /* @__PURE__ */ new Set(["washer", "dryer", "dishwasher"]);
function parseCycleSnapshot(raw2) {
  if (!raw2 || typeof raw2 !== "object") return null;
  return {
    machineState: raw2.machineState ?? null,
    jobState: raw2.jobState ?? null,
    operatingState: raw2.operatingState ?? null
  };
}
__name(parseCycleSnapshot, "parseCycleSnapshot");
function snapshotsEqual(a2, b) {
  if (!a2 && !b) return true;
  if (!a2 || !b) return false;
  return a2.machineState === b.machineState && a2.jobState === b.jobState && a2.operatingState === b.operatingState;
}
__name(snapshotsEqual, "snapshotsEqual");
function shouldNotifyCycleComplete(prev, curr) {
  if (!curr || !prev) return false;
  const prevActive = isCycleActivelyRunning(prev);
  const currComplete = isCycleJobComplete(curr.jobState, curr.operatingState);
  const prevComplete = isCycleJobComplete(prev.jobState, prev.operatingState);
  if (currComplete && !prevComplete && prevActive) return true;
  if (curr.operatingState === "finished" && prev.operatingState !== "finished" && prevActive) return true;
  if (prevActive && !isCycleActivelyRunning(curr) && (prev.machineState === "run" || prev.machineState === "pause") && curr.machineState === "stop") {
    return true;
  }
  return false;
}
__name(shouldNotifyCycleComplete, "shouldNotifyCycleComplete");
function cycleUiStateFromSignals(signals) {
  if (!signals) return "unknown";
  if (signals.machineState === "run") return "running";
  if (signals.machineState === "pause") return "paused";
  if (isCycleJobComplete(signals.jobState, signals.operatingState)) return "finished";
  return "idle";
}
__name(cycleUiStateFromSignals, "cycleUiStateFromSignals");
async function applyCycleStateUpdate(sql, device, rawStStatus, notifyCycleComplete) {
  const type = device.device_type;
  if (!CYCLE_TYPES.has(type)) return { notified: false };
  const curr = extractCycleSignals(rawStStatus, type);
  if (!curr) return { notified: false };
  const prev = parseCycleSnapshot(device.last_cycle_snapshot);
  let notified = false;
  if (device.cycle_notify_enabled && shouldNotifyCycleComplete(prev, curr) && notifyCycleComplete) {
    await notifyCycleComplete({
      householdId: device.household_id,
      deviceName: device.display_name,
      deviceType: type
    });
    notified = true;
  }
  const uiState = cycleUiStateFromSignals(curr);
  const snapshotJson = JSON.stringify(curr);
  if (!snapshotsEqual(prev, curr) || device.last_cycle_state !== uiState) {
    await sql`
      UPDATE smart_devices
      SET last_cycle_snapshot = ${snapshotJson}::jsonb,
          last_cycle_state = ${uiState},
          updated_at = NOW()
      WHERE id = ${device.id}
    `;
  }
  return { notified };
}
__name(applyCycleStateUpdate, "applyCycleStateUpdate");
function shouldNotifyPowerAbove(prevAbove, nowAbove) {
  return nowAbove === true && prevAbove !== true;
}
__name(shouldNotifyPowerAbove, "shouldNotifyPowerAbove");
function shouldNotifyPowerBelow(prevBelow, nowBelow) {
  return nowBelow === true && prevBelow !== true;
}
__name(shouldNotifyPowerBelow, "shouldNotifyPowerBelow");
async function pollCycleDevices(sql, rawKey, { clientId, clientSecret, notifyCycleComplete }) {
  const devices = await sql`
    SELECT sd.id, sd.household_id, sd.external_device_id, sd.display_name, sd.device_type,
           sd.last_cycle_state, sd.last_cycle_snapshot, sd.cycle_notify_enabled, sd.cycle_labels
    FROM smart_devices sd
    WHERE sd.is_active = true
      AND sd.provider = 'smartthings'
      AND sd.cycle_notify_enabled = true
      AND sd.device_type IN ('washer', 'dryer', 'dishwasher')
  `;
  const ctxByHousehold = /* @__PURE__ */ new Map();
  let checked = 0;
  let notified = 0;
  let failed = 0;
  for (const d of devices) {
    try {
      let accessToken = ctxByHousehold.get(d.household_id);
      if (accessToken === void 0) {
        accessToken = await getFreshAccessToken(sql, {
          householdId: d.household_id,
          clientId,
          clientSecret,
          rawKey
        });
        ctxByHousehold.set(d.household_id, accessToken);
      }
      if (!accessToken) {
        failed++;
        continue;
      }
      const status = await getStDeviceStatus({ accessToken }, d.external_device_id);
      const { notified: n } = await applyCycleStateUpdate(sql, d, status, notifyCycleComplete);
      if (n) notified++;
      checked++;
    } catch (err) {
      console.warn("[cycle-notify] device skipped", d.external_device_id, err);
      failed++;
    }
  }
  return { checked, notified, failed };
}
__name(pollCycleDevices, "pollCycleDevices");

// src/app.js
function snapshotTransaction(row) {
  return {
    id: row.id,
    kind: row.kind,
    name: row.name,
    amount: row.amount,
    txn_date: row.txn_date,
    year: row.year,
    month: row.month,
    is_fixed: row.is_fixed,
    category: row.category,
    created_by: row.created_by ?? null
  };
}
__name(snapshotTransaction, "snapshotTransaction");
function snapshotSavingsAccount(row) {
  return {
    id: row.id,
    name: row.name,
    amount: row.amount,
    icon: row.icon ?? null,
    created_by: row.created_by ?? null
  };
}
__name(snapshotSavingsAccount, "snapshotSavingsAccount");
function snapshotCategoryBudget(row) {
  return {
    id: row.id,
    name: row.name,
    monthly_limit: row.monthly_limit,
    created_by: row.created_by ?? null
  };
}
__name(snapshotCategoryBudget, "snapshotCategoryBudget");
function assertCanMutateResource({ isOwner, createdBy, userId }) {
  if (isOwner) return null;
  if (createdBy == null) return null;
  if (createdBy === userId) return null;
  return { status: 403, body: { error: "forbidden_not_owner_of_entry" } };
}
__name(assertCanMutateResource, "assertCanMutateResource");
function snapshotSavingsGoal(row) {
  return {
    type: row.type,
    monthly_amount: row.monthly_amount,
    yearly_amount: row.yearly_amount,
    target_month: row.target_month
  };
}
__name(snapshotSavingsGoal, "snapshotSavingsGoal");
var UNDO_WINDOW_MS = 24 * 60 * 60 * 1e3;
async function safeLogAction(sql, payload) {
  try {
    await logAction(sql, payload);
  } catch (err) {
    console.error("[action-log] insert failed", err);
  }
}
__name(safeLogAction, "safeLogAction");
var app = new Hono2();
app.onError((err, c) => {
  console.error("[hono onError]", err);
  if (err instanceof HTTPException) {
    return err.getResponse();
  }
  const msg = err instanceof Error ? err.message : String(err);
  return c.json({ error: "Server error", detail: msg }, 500);
});
function getEnv(c, key) {
  let v2 = c?.env?.[key];
  if (typeof v2 === "string") v2 = v2.trim();
  if (v2 !== void 0 && v2 !== null && v2 !== "") return v2;
  let p2 = process.env[key];
  if (typeof p2 === "string") p2 = p2.trim();
  if (p2 !== void 0 && p2 !== null && p2 !== "") return p2;
  return void 0;
}
__name(getEnv, "getEnv");
function pushEnv(c) {
  return {
    VAPID_PUBLIC_KEY: getEnv(c, "VAPID_PUBLIC_KEY"),
    VAPID_PRIVATE_JWK: getEnv(c, "VAPID_PRIVATE_JWK"),
    PUSH_ADMIN_CONTACT: getEnv(c, "PUSH_ADMIN_CONTACT")
  };
}
__name(pushEnv, "pushEnv");
function authFailureCode(message2) {
  const m2 = String(message2 || "");
  if (m2.includes("redirect_uri must be exactly")) return "oauth_redirect";
  if (m2.includes("Google token exchange failed")) return "google_token";
  if (m2.includes("DATABASE_URL")) return "config_db";
  if (m2.includes("GOOGLE_CLIENT")) return "config_oauth";
  if (m2.includes("Google profile missing")) return "profile";
  if (m2.includes("Google userinfo failed")) return "google_profile";
  return "unknown";
}
__name(authFailureCode, "authFailureCode");
app.use(
  "/api/*",
  cors({
    origin: /* @__PURE__ */ __name((origin, c) => {
      const allowed = getEnv(c, "FRONTEND_URL") || "http://localhost:5173";
      return origin === allowed ? origin : null;
    }, "origin"),
    credentials: true
  })
);
function getSecret(c) {
  return new TextEncoder().encode(
    getEnv(c, "NEXTAUTH_SECRET") || "test-secret"
  );
}
__name(getSecret, "getSecret");
function getDb(c) {
  const url = getEnv(c, "DATABASE_URL")?.trim();
  if (!url || !/^postgres(ql)?:\/\//i.test(url)) {
    throw new Error(
      "DATABASE_URL is missing or invalid (expected postgresql://\u2026)"
    );
  }
  return Xs(url);
}
__name(getDb, "getDb");
function getApiBaseUrl(c) {
  const raw2 = getEnv(c, "NEXTAUTH_URL") || "http://localhost:3000";
  return String(raw2).replace(/\/+$/, "");
}
__name(getApiBaseUrl, "getApiBaseUrl");
function getFinanceDataKey(c) {
  return decodeFinanceDataKey(getEnv(c, "FINANCE_DATA_KEY"));
}
__name(getFinanceDataKey, "getFinanceDataKey");
function parseCookie(header, name) {
  if (!header) return null;
  const match2 = header.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
  return match2 ? match2[1] : null;
}
__name(parseCookie, "parseCookie");
async function upsertUserAndHousehold(sql, profile) {
  const [user] = await sql`
    INSERT INTO users (google_id, email, name, avatar_url)
    VALUES (${profile.sub}, ${profile.email}, ${profile.name}, ${profile.picture || null})
    ON CONFLICT (google_id) DO UPDATE SET
      email = EXCLUDED.email,
      name = EXCLUDED.name,
      avatar_url = EXCLUDED.avatar_url
    RETURNING *
  `;
  const [existing] = await sql`
    SELECT household_id FROM household_members WHERE user_id = ${user.id}
  `;
  if (!existing) {
    const [household] = await sql`
      INSERT INTO households (owner_id) VALUES (${user.id}) RETURNING *
    `;
    await sql`
      INSERT INTO household_members (household_id, user_id) VALUES (${household.id}, ${user.id})
    `;
    await sql`
      INSERT INTO finance_data (household_id) VALUES (${household.id})
    `;
  }
  return user;
}
__name(upsertUserAndHousehold, "upsertUserAndHousehold");
async function exchangeCodeForProfile(c, code) {
  const redirectUri = `${getApiBaseUrl(c)}/api/auth/callback`;
  const clientId = getEnv(c, "GOOGLE_CLIENT_ID");
  const clientSecret = getEnv(c, "GOOGLE_CLIENT_SECRET");
  if (!clientId || !clientSecret) {
    throw new Error(
      "GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET is not configured"
    );
  }
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code"
    })
  });
  const tokenBody = await tokenRes.text();
  let tokens;
  try {
    tokens = JSON.parse(tokenBody);
  } catch {
    throw new Error(
      `Google token response was not JSON: ${tokenBody.slice(0, 200)}`
    );
  }
  if (!tokenRes.ok || tokens.error) {
    const hint = tokens.error_description || tokens.error || tokenRes.statusText;
    throw new Error(
      `Google token exchange failed: ${hint} (redirect_uri must be exactly: ${redirectUri})`
    );
  }
  if (!tokens.access_token) {
    throw new Error("Google token response had no access_token");
  }
  const profileRes = await fetch(
    "https://www.googleapis.com/oauth2/v3/userinfo",
    {
      headers: { Authorization: `Bearer ${tokens.access_token}` }
    }
  );
  const profile = await profileRes.json();
  if (!profileRes.ok || profile.error) {
    throw new Error(
      `Google userinfo failed: ${profile.error || profileRes.statusText}`
    );
  }
  if (!profile.sub || !profile.email) {
    throw new Error("Google profile missing sub or email");
  }
  return profile;
}
__name(exchangeCodeForProfile, "exchangeCodeForProfile");
app.get("/api/auth/google", (c) => {
  const clientId = getEnv(c, "GOOGLE_CLIENT_ID");
  const redirectUri = `${getApiBaseUrl(c)}/api/auth/callback`;
  const scope = "openid email profile";
  const inviteToken = c.req.query("invite");
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", scope);
  url.searchParams.set("access_type", "offline");
  url.searchParams.set("prompt", "consent");
  if (inviteToken) {
    url.searchParams.set("state", inviteToken);
  }
  return c.redirect(url.toString());
});
app.get("/api/auth/callback", async (c) => {
  const oauthErr = c.req.query("error");
  if (oauthErr) {
    return c.json(
      {
        error: "OAuth error",
        detail: c.req.query("error_description") || oauthErr
      },
      400
    );
  }
  const code = c.req.query("code");
  if (!code) {
    return c.json({ error: "Missing code" }, 400);
  }
  try {
    const profile = await exchangeCodeForProfile(c, code);
    const sql = getDb(c);
    const user = await upsertUserAndHousehold(sql, profile);
    const token = await new SignJWT({ userId: String(user.id) }).setProtectedHeader({ alg: "HS256" }).setExpirationTime("7d").sign(getSecret(c));
    const frontendUrl = String(
      getEnv(c, "FRONTEND_URL") || "http://localhost:5173"
    ).replace(/\/+$/, "");
    const inviteState = c.req.query("state");
    const redirectUrl = inviteState ? `${frontendUrl}?invite=${inviteState}` : frontendUrl;
    const cookieParts = [
      `token=${token}`,
      "HttpOnly",
      "Path=/",
      `Max-Age=${7 * 24 * 60 * 60}`,
      "SameSite=Lax"
    ];
    if (getApiBaseUrl(c).startsWith("https://")) {
      cookieParts.push("Secure");
    }
    return new Response(null, {
      status: 302,
      headers: {
        Location: redirectUrl,
        "Set-Cookie": cookieParts.join("; ")
      }
    });
  } catch (err) {
    console.error("[auth/callback]", err);
    const message2 = err instanceof Error ? err.message : String(err);
    const code2 = authFailureCode(message2);
    const frontendUrl = String(
      getEnv(c, "FRONTEND_URL") || "http://localhost:5173"
    ).replace(/\/+$/, "");
    const accept = c.req.header("Accept") || "";
    if (accept.includes("text/html")) {
      const u = new URL(frontendUrl);
      u.searchParams.set("auth_err", code2);
      const inviteState = c.req.query("state");
      if (inviteState) u.searchParams.set("invite", inviteState);
      return c.redirect(u.toString(), 302);
    }
    return c.json({ error: "Auth failed", detail: message2, code: code2 }, 500);
  }
});
app.post("/api/auth/logout", (c) => {
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Set-Cookie": "token=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax"
    }
  });
});
async function authMiddleware(c, next) {
  const token = parseCookie(c.req.header("cookie"), "token");
  if (!token) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  try {
    const { payload } = await jwtVerify(token, getSecret(c));
    const sql = getDb(c);
    const [user] = await sql`
      SELECT id, email, name, avatar_url FROM users WHERE id = ${payload.userId}
    `;
    if (!user) {
      return c.json({ error: "Unauthorized" }, 401);
    }
    c.set("user", user);
    await next();
  } catch (err) {
    console.error("[authMiddleware]", err);
    return c.json({ error: "Unauthorized" }, 401);
  }
}
__name(authMiddleware, "authMiddleware");
app.get("/api/auth/me", authMiddleware, (c) => {
  return c.json({ user: c.get("user") });
});
app.get("/api/finance", authMiddleware, async (c) => {
  const user = c.get("user");
  const sql = getDb(c);
  const [membership] = await sql`
    SELECT household_id FROM household_members WHERE user_id = ${user.id}
  `;
  if (!membership) {
    return c.json({ data: {} });
  }
  const rawKey = getFinanceDataKey(c);
  if (!rawKey) {
    return c.json(
      { error: "Server misconfiguration: FINANCE_DATA_KEY missing" },
      500
    );
  }
  try {
    const data = await readFinanceFromRelational(
      sql,
      membership.household_id,
      rawKey
    );
    return c.json({ data });
  } catch (err) {
    console.error("GET /api/finance read error:", err);
    return c.json({ error: "Failed to load finance data" }, 500);
  }
});
app.put("/api/finance", authMiddleware, async (c) => {
  const user = c.get("user");
  let body;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON body" }, 400);
  }
  if (!body || typeof body.data !== "object" || body.data === null || Array.isArray(body.data)) {
    return c.json({ error: 'Field "data" must be a JSON object' }, 400);
  }
  const sql = getDb(c);
  const [membership] = await sql`
    SELECT household_id FROM household_members WHERE user_id = ${user.id}
  `;
  if (!membership) {
    return c.json({ error: "No household" }, 400);
  }
  const rawKey = getFinanceDataKey(c);
  if (!rawKey) {
    return c.json(
      { error: "Server misconfiguration: FINANCE_DATA_KEY missing" },
      500
    );
  }
  try {
    await writeFinanceToRelational(
      sql,
      membership.household_id,
      body.data,
      rawKey,
      { onlyActivity: true }
    );
  } catch (err) {
    console.error("PUT /api/finance write error:", err);
    return c.json({ error: "Failed to save finance data" }, 500);
  }
  return c.json({ ok: true });
});
async function loadTransactionForMutation(sql, userId, id, ifMatch, rawKey) {
  const [row] = await sql`
    SELECT t.*, h.owner_id AS household_owner_id
    FROM transactions t
    JOIN household_members hm ON hm.household_id = t.household_id
    JOIN households h ON h.id = t.household_id
    WHERE t.id = ${id} AND hm.user_id = ${userId}
  `;
  if (!row) {
    const [exists] = await sql`SELECT 1 FROM transactions WHERE id = ${id}`;
    return {
      error: {
        status: exists ? 403 : 404,
        body: { error: exists ? "forbidden" : "not found" }
      }
    };
  }
  const updatedAtIso = row.updated_at instanceof Date ? row.updated_at.toISOString() : String(row.updated_at);
  if (updatedAtIso !== ifMatch) {
    return {
      error: {
        status: 409,
        body: {
          error: "conflict",
          current: {
            id: row.id,
            kind: row.kind,
            name: await decryptField(row.name, rawKey),
            amount: Number(await decryptField(row.amount, rawKey)),
            txnDate: row.txn_date,
            year: row.year,
            month: row.month,
            isFixed: row.is_fixed,
            category: row.category,
            updatedAt: updatedAtIso
          }
        }
      }
    };
  }
  return { ok: true, row, updatedAtIso };
}
__name(loadTransactionForMutation, "loadTransactionForMutation");
function validateTransactionInput(body) {
  if (!body || typeof body !== "object") return "Body must be a JSON object";
  if (body.kind !== "income" && body.kind !== "expense")
    return "kind must be 'income' or 'expense'";
  if (typeof body.name !== "string" || !body.name.trim())
    return "name is required";
  if (typeof body.amount !== "number" || !Number.isFinite(body.amount))
    return "amount must be a finite number";
  if (typeof body.txnDate !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(body.txnDate))
    return "txnDate must be YYYY-MM-DD";
  if (!Number.isInteger(body.year)) return "year must be an integer";
  if (!Number.isInteger(body.month) || body.month < 0 || body.month > 11)
    return "month must be 0-11";
  if (typeof body.isFixed !== "boolean") return "isFixed must be a boolean";
  return null;
}
__name(validateTransactionInput, "validateTransactionInput");
app.post("/api/transactions", authMiddleware, async (c) => {
  const user = c.get("user");
  const sql = getDb(c);
  let body;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON body" }, 400);
  }
  const validationError = validateTransactionInput(body);
  if (validationError) return c.json({ error: validationError }, 400);
  const [membership] = await sql`
    SELECT household_id FROM household_members WHERE user_id = ${user.id}
  `;
  if (!membership) return c.json({ error: "No household" }, 400);
  const rawKey = getFinanceDataKey(c);
  const nameEnc = await encryptField(body.name, rawKey);
  const amountEnc = await encryptField(body.amount, rawKey);
  const [row] = await sql`
    INSERT INTO transactions
      (household_id, kind, name, amount, txn_date, year, month, is_fixed, category, created_by)
    VALUES
      (${membership.household_id}, ${body.kind}, ${nameEnc}, ${amountEnc},
       ${body.txnDate}, ${body.year}, ${body.month}, ${body.isFixed},
       ${body.category ?? null}, ${user.id})
    RETURNING id, updated_at
  `;
  await safeLogAction(sql, {
    householdId: membership.household_id,
    actorId: user.id,
    operation: "CREATE",
    resourceType: "transaction",
    resourceId: row.id,
    before: null,
    after: snapshotTransaction({
      id: row.id,
      kind: body.kind,
      name: nameEnc,
      amount: amountEnc,
      txn_date: body.txnDate,
      year: body.year,
      month: body.month,
      is_fixed: body.isFixed,
      category: body.category ?? null,
      created_by: user.id
    })
  });
  return c.json(
    {
      id: row.id,
      kind: body.kind,
      name: body.name,
      amount: body.amount,
      txnDate: body.txnDate,
      year: body.year,
      month: body.month,
      isFixed: body.isFixed,
      category: body.category ?? null,
      createdBy: user.id,
      updatedAt: row.updated_at
    },
    201
  );
});
app.patch("/api/transactions/:id", authMiddleware, async (c) => {
  const user = c.get("user");
  const sql = getDb(c);
  const id = c.req.param("id");
  const ifMatch = c.req.header("if-match");
  if (!ifMatch) {
    return c.json({ error: "If-Match header is required" }, 400);
  }
  const body = await c.req.json();
  const rawKey = getFinanceDataKey(c);
  const result = await loadTransactionForMutation(
    sql,
    user.id,
    id,
    ifMatch,
    rawKey
  );
  if (result.error) return c.json(result.error.body, result.error.status);
  const { row } = result;
  const permErr = assertCanMutateResource({
    isOwner: row.household_owner_id === user.id,
    createdBy: row.created_by,
    userId: user.id
  });
  if (permErr) return c.json(permErr.body, permErr.status);
  const nextName = body.name !== void 0 ? body.name : null;
  const nextAmount = body.amount !== void 0 ? body.amount : null;
  const nextTxnDate = body.txnDate !== void 0 ? body.txnDate : null;
  if (nextTxnDate !== null && (typeof nextTxnDate !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(nextTxnDate))) {
    return c.json({ error: "txnDate must be YYYY-MM-DD" }, 400);
  }
  const nameEnc = nextName !== null ? await encryptField(nextName, rawKey) : row.name;
  const amountEnc = nextAmount !== null ? await encryptField(nextAmount, rawKey) : row.amount;
  const txnDateVal = nextTxnDate !== null ? nextTxnDate : row.txn_date;
  const [updated] = await sql`
    UPDATE transactions
    SET name = ${nameEnc},
        amount = ${amountEnc},
        txn_date = ${txnDateVal},
        updated_at = NOW()
    WHERE id = ${id}
    RETURNING id, kind, txn_date, year, month, is_fixed, category, updated_at
  `;
  await safeLogAction(sql, {
    householdId: row.household_id,
    actorId: user.id,
    operation: "UPDATE",
    resourceType: "transaction",
    resourceId: id,
    before: snapshotTransaction(row),
    after: snapshotTransaction({
      ...row,
      name: nameEnc,
      amount: amountEnc,
      txn_date: txnDateVal
    })
  });
  return c.json({
    id: updated.id,
    kind: updated.kind,
    name: nextName ?? await decryptField(row.name, rawKey),
    amount: nextAmount ?? Number(await decryptField(row.amount, rawKey)),
    txnDate: updated.txn_date,
    year: updated.year,
    month: updated.month,
    isFixed: updated.is_fixed,
    category: updated.category,
    createdBy: row.created_by ?? null,
    updatedAt: updated.updated_at
  });
});
app.delete("/api/transactions/:id", authMiddleware, async (c) => {
  const user = c.get("user");
  const sql = getDb(c);
  const id = c.req.param("id");
  const ifMatch = c.req.header("if-match");
  if (!ifMatch) {
    return c.json({ error: "If-Match header is required" }, 400);
  }
  const rawKey = getFinanceDataKey(c);
  const result = await loadTransactionForMutation(
    sql,
    user.id,
    id,
    ifMatch,
    rawKey
  );
  if (result.error) return c.json(result.error.body, result.error.status);
  const permErr = assertCanMutateResource({
    isOwner: result.row.household_owner_id === user.id,
    createdBy: result.row.created_by,
    userId: user.id
  });
  if (permErr) return c.json(permErr.body, permErr.status);
  await sql`DELETE FROM transactions WHERE id = ${id}`;
  await safeLogAction(sql, {
    householdId: result.row.household_id,
    actorId: user.id,
    operation: "DELETE",
    resourceType: "transaction",
    resourceId: id,
    before: snapshotTransaction(result.row),
    after: null
  });
  return c.body(null, 204);
});
function validateSavingsAccountInput(body) {
  if (!body || typeof body !== "object") return "Body must be a JSON object";
  if (typeof body.name !== "string" || !body.name.trim())
    return "name is required";
  if (typeof body.amount !== "number" || !Number.isFinite(body.amount))
    return "amount must be a finite number";
  return null;
}
__name(validateSavingsAccountInput, "validateSavingsAccountInput");
async function loadSavingsAccountForMutation(sql, userId, id, ifMatch, rawKey) {
  const [row] = await sql`
    SELECT s.*, h.owner_id AS household_owner_id
    FROM savings_accounts s
    JOIN household_members hm ON hm.household_id = s.household_id
    JOIN households h ON h.id = s.household_id
    WHERE s.id = ${id} AND hm.user_id = ${userId}
  `;
  if (!row) {
    const [exists] = await sql`SELECT 1 FROM savings_accounts WHERE id = ${id}`;
    return {
      error: {
        status: exists ? 403 : 404,
        body: { error: exists ? "forbidden" : "not found" }
      }
    };
  }
  const updatedAtIso = row.updated_at instanceof Date ? row.updated_at.toISOString() : String(row.updated_at);
  if (updatedAtIso !== ifMatch) {
    return {
      error: {
        status: 409,
        body: {
          error: "conflict",
          current: {
            id: row.id,
            name: await decryptField(row.name, rawKey),
            amount: Number(await decryptField(row.amount, rawKey)),
            icon: row.icon,
            updatedAt: updatedAtIso
          }
        }
      }
    };
  }
  return { ok: true, row, updatedAtIso };
}
__name(loadSavingsAccountForMutation, "loadSavingsAccountForMutation");
app.post("/api/savings-accounts", authMiddleware, async (c) => {
  const user = c.get("user");
  const sql = getDb(c);
  let body;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON body" }, 400);
  }
  const validationError = validateSavingsAccountInput(body);
  if (validationError) return c.json({ error: validationError }, 400);
  const [membership] = await sql`
    SELECT household_id FROM household_members WHERE user_id = ${user.id}
  `;
  if (!membership) return c.json({ error: "No household" }, 400);
  const rawKey = getFinanceDataKey(c);
  const nameEnc = await encryptField(body.name, rawKey);
  const amountEnc = await encryptField(body.amount, rawKey);
  const [row] = await sql`
    INSERT INTO savings_accounts (household_id, name, amount, icon, created_by)
    VALUES (${membership.household_id}, ${nameEnc}, ${amountEnc}, ${body.icon ?? null}, ${user.id})
    RETURNING id, updated_at
  `;
  await safeLogAction(sql, {
    householdId: membership.household_id,
    actorId: user.id,
    operation: "CREATE",
    resourceType: "savings_account",
    resourceId: row.id,
    before: null,
    after: snapshotSavingsAccount({
      id: row.id,
      name: nameEnc,
      amount: amountEnc,
      icon: body.icon ?? null,
      created_by: user.id
    })
  });
  return c.json(
    {
      id: row.id,
      name: body.name,
      amount: body.amount,
      icon: body.icon ?? null,
      createdBy: user.id,
      updatedAt: row.updated_at
    },
    201
  );
});
app.patch("/api/savings-accounts/:id", authMiddleware, async (c) => {
  const user = c.get("user");
  const sql = getDb(c);
  const id = c.req.param("id");
  const ifMatch = c.req.header("if-match");
  if (!ifMatch) return c.json({ error: "If-Match header is required" }, 400);
  const body = await c.req.json();
  const rawKey = getFinanceDataKey(c);
  const result = await loadSavingsAccountForMutation(
    sql,
    user.id,
    id,
    ifMatch,
    rawKey
  );
  if (result.error) return c.json(result.error.body, result.error.status);
  const { row } = result;
  const permErr = assertCanMutateResource({
    isOwner: row.household_owner_id === user.id,
    createdBy: row.created_by,
    userId: user.id
  });
  if (permErr) return c.json(permErr.body, permErr.status);
  const nextName = body.name !== void 0 ? body.name : null;
  const nextAmount = body.amount !== void 0 ? body.amount : null;
  const nextIcon = body.icon !== void 0 ? body.icon : row.icon;
  const nameEnc = nextName !== null ? await encryptField(nextName, rawKey) : row.name;
  const amountEnc = nextAmount !== null ? await encryptField(nextAmount, rawKey) : row.amount;
  const [updated] = await sql`
    UPDATE savings_accounts
    SET name = ${nameEnc}, amount = ${amountEnc}, icon = ${nextIcon}, updated_at = NOW()
    WHERE id = ${id}
    RETURNING id, icon, updated_at
  `;
  await safeLogAction(sql, {
    householdId: row.household_id,
    actorId: user.id,
    operation: "UPDATE",
    resourceType: "savings_account",
    resourceId: id,
    before: snapshotSavingsAccount(row),
    after: snapshotSavingsAccount({
      id,
      name: nameEnc,
      amount: amountEnc,
      icon: nextIcon,
      created_by: row.created_by
    })
  });
  return c.json({
    id: updated.id,
    name: nextName ?? await decryptField(row.name, rawKey),
    amount: nextAmount ?? Number(await decryptField(row.amount, rawKey)),
    icon: updated.icon,
    createdBy: row.created_by ?? null,
    updatedAt: updated.updated_at
  });
});
app.delete("/api/savings-accounts/:id", authMiddleware, async (c) => {
  const user = c.get("user");
  const sql = getDb(c);
  const id = c.req.param("id");
  const ifMatch = c.req.header("if-match");
  if (!ifMatch) return c.json({ error: "If-Match header is required" }, 400);
  const rawKey = getFinanceDataKey(c);
  const result = await loadSavingsAccountForMutation(
    sql,
    user.id,
    id,
    ifMatch,
    rawKey
  );
  if (result.error) return c.json(result.error.body, result.error.status);
  const permErr = assertCanMutateResource({
    isOwner: result.row.household_owner_id === user.id,
    createdBy: result.row.created_by,
    userId: user.id
  });
  if (permErr) return c.json(permErr.body, permErr.status);
  await sql`DELETE FROM savings_accounts WHERE id = ${id}`;
  await safeLogAction(sql, {
    householdId: result.row.household_id,
    actorId: user.id,
    operation: "DELETE",
    resourceType: "savings_account",
    resourceId: id,
    before: snapshotSavingsAccount(result.row),
    after: null
  });
  return c.body(null, 204);
});
function validateCategoryBudgetInput(body) {
  if (!body || typeof body !== "object") return "Body must be a JSON object";
  if (typeof body.name !== "string" || !body.name.trim())
    return "name is required";
  if (typeof body.limit !== "number" || !Number.isFinite(body.limit))
    return "limit must be a finite number";
  return null;
}
__name(validateCategoryBudgetInput, "validateCategoryBudgetInput");
async function loadCategoryBudgetForMutation(sql, userId, id, ifMatch, rawKey) {
  const [row] = await sql`
    SELECT c.*, h.owner_id AS household_owner_id
    FROM category_budgets c
    JOIN household_members hm ON hm.household_id = c.household_id
    JOIN households h ON h.id = c.household_id
    WHERE c.id = ${id} AND hm.user_id = ${userId}
  `;
  if (!row) {
    const [exists] = await sql`SELECT 1 FROM category_budgets WHERE id = ${id}`;
    return {
      error: {
        status: exists ? 403 : 404,
        body: { error: exists ? "forbidden" : "not found" }
      }
    };
  }
  const updatedAtIso = row.updated_at instanceof Date ? row.updated_at.toISOString() : String(row.updated_at);
  if (updatedAtIso !== ifMatch) {
    return {
      error: {
        status: 409,
        body: {
          error: "conflict",
          current: {
            id: row.id,
            name: await decryptField(row.name, rawKey),
            limit: Number(await decryptField(row.monthly_limit, rawKey)),
            updatedAt: updatedAtIso
          }
        }
      }
    };
  }
  return { ok: true, row, updatedAtIso };
}
__name(loadCategoryBudgetForMutation, "loadCategoryBudgetForMutation");
app.post("/api/category-budgets", authMiddleware, async (c) => {
  const user = c.get("user");
  const sql = getDb(c);
  let body;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON body" }, 400);
  }
  const validationError = validateCategoryBudgetInput(body);
  if (validationError) return c.json({ error: validationError }, 400);
  const [membership] = await sql`
    SELECT household_id FROM household_members WHERE user_id = ${user.id}
  `;
  if (!membership) return c.json({ error: "No household" }, 400);
  const rawKey = getFinanceDataKey(c);
  const nameEnc = await encryptField(body.name, rawKey);
  const limitEnc = await encryptField(body.limit, rawKey);
  const [row] = await sql`
    INSERT INTO category_budgets (household_id, name, monthly_limit, created_by)
    VALUES (${membership.household_id}, ${nameEnc}, ${limitEnc}, ${user.id})
    RETURNING id, updated_at
  `;
  await safeLogAction(sql, {
    householdId: membership.household_id,
    actorId: user.id,
    operation: "CREATE",
    resourceType: "category_budget",
    resourceId: row.id,
    before: null,
    after: snapshotCategoryBudget({
      id: row.id,
      name: nameEnc,
      monthly_limit: limitEnc,
      created_by: user.id
    })
  });
  return c.json(
    {
      id: row.id,
      name: body.name,
      limit: body.limit,
      createdBy: user.id,
      updatedAt: row.updated_at
    },
    201
  );
});
app.patch("/api/category-budgets/:id", authMiddleware, async (c) => {
  const user = c.get("user");
  const sql = getDb(c);
  const id = c.req.param("id");
  const ifMatch = c.req.header("if-match");
  if (!ifMatch) return c.json({ error: "If-Match header is required" }, 400);
  const body = await c.req.json();
  const rawKey = getFinanceDataKey(c);
  const result = await loadCategoryBudgetForMutation(
    sql,
    user.id,
    id,
    ifMatch,
    rawKey
  );
  if (result.error) return c.json(result.error.body, result.error.status);
  const { row } = result;
  const permErr = assertCanMutateResource({
    isOwner: row.household_owner_id === user.id,
    createdBy: row.created_by,
    userId: user.id
  });
  if (permErr) return c.json(permErr.body, permErr.status);
  const nextName = body.name !== void 0 ? body.name : null;
  const nextLimit = body.limit !== void 0 ? body.limit : null;
  const nameEnc = nextName !== null ? await encryptField(nextName, rawKey) : row.name;
  const limitEnc = nextLimit !== null ? await encryptField(nextLimit, rawKey) : row.monthly_limit;
  const [updated] = await sql`
    UPDATE category_budgets
    SET name = ${nameEnc}, monthly_limit = ${limitEnc}, updated_at = NOW()
    WHERE id = ${id}
    RETURNING id, updated_at
  `;
  await safeLogAction(sql, {
    householdId: row.household_id,
    actorId: user.id,
    operation: "UPDATE",
    resourceType: "category_budget",
    resourceId: id,
    before: snapshotCategoryBudget(row),
    after: snapshotCategoryBudget({
      id,
      name: nameEnc,
      monthly_limit: limitEnc,
      created_by: row.created_by
    })
  });
  return c.json({
    id: updated.id,
    name: nextName ?? await decryptField(row.name, rawKey),
    limit: nextLimit ?? Number(await decryptField(row.monthly_limit, rawKey)),
    createdBy: row.created_by ?? null,
    updatedAt: updated.updated_at
  });
});
app.delete("/api/category-budgets/:id", authMiddleware, async (c) => {
  const user = c.get("user");
  const sql = getDb(c);
  const id = c.req.param("id");
  const ifMatch = c.req.header("if-match");
  if (!ifMatch) return c.json({ error: "If-Match header is required" }, 400);
  const rawKey = getFinanceDataKey(c);
  const result = await loadCategoryBudgetForMutation(
    sql,
    user.id,
    id,
    ifMatch,
    rawKey
  );
  if (result.error) return c.json(result.error.body, result.error.status);
  const permErr = assertCanMutateResource({
    isOwner: result.row.household_owner_id === user.id,
    createdBy: result.row.created_by,
    userId: user.id
  });
  if (permErr) return c.json(permErr.body, permErr.status);
  await sql`DELETE FROM category_budgets WHERE id = ${id}`;
  await safeLogAction(sql, {
    householdId: result.row.household_id,
    actorId: user.id,
    operation: "DELETE",
    resourceType: "category_budget",
    resourceId: id,
    before: snapshotCategoryBudget(result.row),
    after: null
  });
  return c.body(null, 204);
});
function validateSavingsGoalInput(body) {
  if (!body || typeof body !== "object") return "Body must be a JSON object";
  if (body.type !== "none" && body.type !== "monthly" && body.type !== "yearly") {
    return "type must be 'none' | 'monthly' | 'yearly'";
  }
  return null;
}
__name(validateSavingsGoalInput, "validateSavingsGoalInput");
app.put("/api/savings-goal", authMiddleware, async (c) => {
  const user = c.get("user");
  const sql = getDb(c);
  let body;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON body" }, 400);
  }
  const validationError = validateSavingsGoalInput(body);
  if (validationError) return c.json({ error: validationError }, 400);
  const [membership] = await sql`
    SELECT hm.household_id, h.owner_id
    FROM household_members hm
    JOIN households h ON h.id = hm.household_id
    WHERE hm.user_id = ${user.id}
  `;
  if (!membership) return c.json({ error: "No household" }, 400);
  if (membership.owner_id !== user.id) {
    return c.json({ error: "forbidden_owner_only" }, 403);
  }
  const rawKey = getFinanceDataKey(c);
  const monthlyEnc = await encryptField(body.monthlyAmount ?? 0, rawKey);
  const yearlyEnc = await encryptField(body.yearlyAmount ?? 0, rawKey);
  const targetMonth = Number.isInteger(body.targetMonth) ? body.targetMonth : 11;
  const [existing] = await sql`
    SELECT type, monthly_amount, yearly_amount, target_month
    FROM savings_goals WHERE household_id = ${membership.household_id}
  `;
  await sql`
    INSERT INTO savings_goals (household_id, type, monthly_amount, yearly_amount, target_month, updated_at)
    VALUES (${membership.household_id}, ${body.type}, ${monthlyEnc}, ${yearlyEnc}, ${targetMonth}, NOW())
    ON CONFLICT (household_id) DO UPDATE SET
      type = EXCLUDED.type,
      monthly_amount = EXCLUDED.monthly_amount,
      yearly_amount = EXCLUDED.yearly_amount,
      target_month = EXCLUDED.target_month,
      updated_at = NOW()
  `;
  await safeLogAction(sql, {
    householdId: membership.household_id,
    actorId: user.id,
    operation: existing ? "UPDATE" : "CREATE",
    resourceType: "savings_goal",
    resourceId: membership.household_id,
    before: existing ? snapshotSavingsGoal(existing) : null,
    after: snapshotSavingsGoal({
      type: body.type,
      monthly_amount: monthlyEnc,
      yearly_amount: yearlyEnc,
      target_month: targetMonth
    })
  });
  return c.json({
    type: body.type,
    monthlyAmount: Number(body.monthlyAmount ?? 0),
    yearlyAmount: Number(body.yearlyAmount ?? 0),
    targetMonth
  });
});
var TUYA_DATACENTERS = ["eu", "us", "cn", "in"];
function validateTuyaCredentialsInput(body) {
  if (!body || typeof body !== "object") return "Body must be a JSON object";
  if (typeof body.clientId !== "string" || !body.clientId.trim())
    return "clientId is required";
  if (typeof body.clientSecret !== "string" || !body.clientSecret.trim())
    return "clientSecret is required";
  if (body.datacenter !== void 0 && !TUYA_DATACENTERS.includes(body.datacenter)) {
    return "datacenter must be one of eu|us|cn|in";
  }
  const price = body.energyPricePln;
  if (price !== void 0 && price !== null && (typeof price !== "number" || !Number.isFinite(price) || price < 0 || price > 100)) {
    return "energyPricePln must be a number 0-100 or null";
  }
  return null;
}
__name(validateTuyaCredentialsInput, "validateTuyaCredentialsInput");
async function getMembershipWithOwner(sql, userId) {
  const [m2] = await sql`
    SELECT hm.household_id, h.owner_id
    FROM household_members hm
    JOIN households h ON h.id = hm.household_id
    WHERE hm.user_id = ${userId}
  `;
  return m2 ?? null;
}
__name(getMembershipWithOwner, "getMembershipWithOwner");
var toIso = /* @__PURE__ */ __name((v2) => v2 instanceof Date ? v2.toISOString() : v2 == null ? null : String(v2), "toIso");
app.put("/api/tuya/credentials", authMiddleware, async (c) => {
  const user = c.get("user");
  const sql = getDb(c);
  let body;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON body" }, 400);
  }
  const validationError = validateTuyaCredentialsInput(body);
  if (validationError) return c.json({ error: validationError }, 400);
  const membership = await getMembershipWithOwner(sql, user.id);
  if (!membership) return c.json({ error: "No household" }, 400);
  if (membership.owner_id !== user.id)
    return c.json({ error: "forbidden_owner_only" }, 403);
  const datacenter = body.datacenter ?? "eu";
  try {
    await getTuyaToken({
      clientId: body.clientId,
      clientSecret: body.clientSecret,
      datacenter
    });
  } catch (err) {
    console.error("[tuya] credential verification failed", err);
    return c.json({ error: "tuya_auth_failed" }, 400);
  }
  const rawKey = getFinanceDataKey(c);
  const clientIdEnc = await encryptField(body.clientId, rawKey);
  const clientSecretEnc = await encryptField(body.clientSecret, rawKey);
  const energyPricePln = body.energyPricePln ?? null;
  const [row] = await sql`
    INSERT INTO tuya_credentials
      (household_id, client_id_enc, client_secret_enc, datacenter, energy_price_pln, verified_at, created_by, updated_at)
    VALUES
      (${membership.household_id}, ${clientIdEnc}, ${clientSecretEnc},
       ${datacenter}, ${energyPricePln}, NOW(), ${user.id}, NOW())
    ON CONFLICT (household_id) DO UPDATE SET
      client_id_enc = EXCLUDED.client_id_enc,
      client_secret_enc = EXCLUDED.client_secret_enc,
      datacenter = EXCLUDED.datacenter,
      energy_price_pln = EXCLUDED.energy_price_pln,
      verified_at = NOW(),
      updated_at = NOW()
    RETURNING datacenter, verified_at, energy_price_pln
  `;
  return c.json({
    configured: true,
    datacenter: row.datacenter,
    verifiedAt: toIso(row.verified_at),
    energyPricePln: row.energy_price_pln == null ? null : Number(row.energy_price_pln)
  });
});
app.patch("/api/tuya/credentials/price", authMiddleware, async (c) => {
  const user = c.get("user");
  const sql = getDb(c);
  let body;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON body" }, 400);
  }
  const membership = await getMembershipWithOwner(sql, user.id);
  if (!membership) return c.json({ error: "No household" }, 400);
  if (membership.owner_id !== user.id)
    return c.json({ error: "forbidden_owner_only" }, 403);
  const price = body?.energyPricePln ?? null;
  if (price !== null && (typeof price !== "number" || !Number.isFinite(price) || price < 0 || price > 100)) {
    return c.json({ error: "energyPricePln must be a number 0-100 or null" }, 400);
  }
  const [row] = await sql`
    UPDATE tuya_credentials
    SET energy_price_pln = ${price}, updated_at = NOW()
    WHERE household_id = ${membership.household_id}
    RETURNING energy_price_pln
  `;
  if (!row) return c.json({ error: "not_configured" }, 400);
  return c.json({
    energyPricePln: row.energy_price_pln == null ? null : Number(row.energy_price_pln)
  });
});
app.get("/api/tuya/credentials", authMiddleware, async (c) => {
  const user = c.get("user");
  const sql = getDb(c);
  const membership = await getMembershipWithOwner(sql, user.id);
  if (!membership) return c.json({ error: "No household" }, 400);
  if (membership.owner_id !== user.id)
    return c.json({ error: "forbidden_owner_only" }, 403);
  const [row] = await sql`
    SELECT datacenter, verified_at, energy_price_pln
    FROM tuya_credentials WHERE household_id = ${membership.household_id}
  `;
  if (!row) return c.json({ configured: false });
  return c.json({
    configured: true,
    datacenter: row.datacenter,
    verifiedAt: toIso(row.verified_at),
    energyPricePln: row.energy_price_pln == null ? null : Number(row.energy_price_pln)
  });
});
app.delete("/api/tuya/credentials", authMiddleware, async (c) => {
  const user = c.get("user");
  const sql = getDb(c);
  const membership = await getMembershipWithOwner(sql, user.id);
  if (!membership) return c.json({ error: "No household" }, 400);
  if (membership.owner_id !== user.id)
    return c.json({ error: "forbidden_owner_only" }, 403);
  await sql`DELETE FROM tuya_credentials WHERE household_id = ${membership.household_id}`;
  return c.body(null, 204);
});
var SMARTTHINGS_SCOPES = ["r:locations:*", "r:devices:*", "x:devices:*"];
function smartthingsRedirectUri(c) {
  return getEnv(c, "SMARTTHINGS_REDIRECT_URI") || `${getApiBaseUrl(c)}/api/smartthings/callback`;
}
__name(smartthingsRedirectUri, "smartthingsRedirectUri");
app.get("/api/smartthings/connect", authMiddleware, async (c) => {
  const user = c.get("user");
  const sql = getDb(c);
  const membership = await getMembershipWithOwner(sql, user.id);
  if (!membership) return c.json({ error: "No household" }, 400);
  if (membership.owner_id !== user.id)
    return c.json({ error: "forbidden_owner_only" }, 403);
  const clientId = getEnv(c, "SMARTTHINGS_CLIENT_ID");
  if (!clientId) return c.json({ error: "config_smartthings" }, 500);
  const url = buildAuthorizeUrl({
    clientId,
    redirectUri: smartthingsRedirectUri(c),
    scopes: SMARTTHINGS_SCOPES,
    state: crypto.randomUUID()
  });
  return c.redirect(url);
});
app.get("/api/smartthings/callback", async (c) => {
  const frontend = getEnv(c, "FRONTEND_URL") || "http://localhost:5173";
  const fail = /* @__PURE__ */ __name((st) => c.redirect(`${frontend}/?view=urzadzenia&st=${st}`), "fail");
  if (c.req.query("error")) return fail("error");
  const code = c.req.query("code");
  if (!code) return fail("error");
  try {
    const token = parseCookie(c.req.header("cookie"), "token");
    const { payload } = await jwtVerify(token, getSecret(c));
    const sql = getDb(c);
    const [user] = await sql`SELECT id FROM users WHERE id = ${payload.userId}`;
    if (!user) return fail("error");
    const membership = await getMembershipWithOwner(sql, user.id);
    if (!membership || membership.owner_id !== user.id) return fail("error");
    const tokens = await exchangeCodeForTokens({
      code,
      clientId: getEnv(c, "SMARTTHINGS_CLIENT_ID"),
      clientSecret: getEnv(c, "SMARTTHINGS_CLIENT_SECRET"),
      redirectUri: smartthingsRedirectUri(c)
    });
    await saveTokens(sql, {
      householdId: membership.household_id,
      tokens,
      scopes: tokens.scope,
      createdBy: user.id,
      rawKey: getFinanceDataKey(c)
    });
    return fail("connected");
  } catch (err) {
    console.error("[smartthings/callback]", err);
    return fail(err?.code === "invalid_grant" ? "reconnect" : "error");
  }
});
app.get("/api/smartthings/status", authMiddleware, async (c) => {
  const user = c.get("user");
  const sql = getDb(c);
  const membership = await getMembershipWithOwner(sql, user.id);
  if (!membership) return c.json({ connected: false });
  const [row] = await sql`
    SELECT verified_at FROM smartthings_credentials WHERE household_id = ${membership.household_id}
  `;
  if (!row) return c.json({ connected: false });
  return c.json({ connected: true, verifiedAt: toIso(row.verified_at) });
});
app.delete("/api/smartthings/disconnect", authMiddleware, async (c) => {
  const user = c.get("user");
  const sql = getDb(c);
  const membership = await getMembershipWithOwner(sql, user.id);
  if (!membership) return c.json({ error: "No household" }, 400);
  if (membership.owner_id !== user.id)
    return c.json({ error: "forbidden_owner_only" }, 403);
  await sql`DELETE FROM smart_devices WHERE household_id = ${membership.household_id} AND provider = 'smartthings'`;
  await sql`DELETE FROM smartthings_credentials WHERE household_id = ${membership.household_id}`;
  return c.body(null, 204);
});
async function loadTuyaContext(c, sql, householdId) {
  const [cred] = await sql`
    SELECT client_id_enc, client_secret_enc, datacenter
    FROM tuya_credentials WHERE household_id = ${householdId}
  `;
  if (!cred) return null;
  const rawKey = getFinanceDataKey(c);
  const clientId = await decryptField(cred.client_id_enc, rawKey);
  const clientSecret = await decryptField(cred.client_secret_enc, rawKey);
  const { accessToken } = await getTuyaToken({
    clientId,
    clientSecret,
    datacenter: cred.datacenter
  });
  return { clientId, clientSecret, datacenter: cred.datacenter, accessToken };
}
__name(loadTuyaContext, "loadTuyaContext");
function mapDevice(row) {
  return {
    id: row.id,
    provider: row.provider ?? "tuya",
    externalDeviceId: row.external_device_id ?? row.tuya_device_id ?? null,
    tuyaDeviceId: row.tuya_device_id ?? null,
    capabilitiesJson: row.capabilities_json ?? null,
    displayName: row.display_name,
    productName: row.product_name ?? null,
    productId: row.product_id ?? null,
    deviceType: row.device_type ?? null,
    irParentId: row.ir_parent_id ?? null,
    linkedPlugId: row.linked_plug_id ?? null,
    cycleLabels: row.cycle_labels ?? null,
    cycleNotifyEnabled: row.cycle_notify_enabled === true,
    plugNotifyEnabled: row.plug_notify_enabled === true,
    powerThresholdW: row.power_threshold_w != null ? Number(row.power_threshold_w) : null,
    powerThresholdMinW: row.power_threshold_min_w != null ? Number(row.power_threshold_min_w) : null,
    functionsJson: row.functions_json ?? null,
    isActive: row.is_active,
    createdBy: row.created_by ?? null,
    updatedAt: toIso(row.updated_at)
  };
}
__name(mapDevice, "mapDevice");
app.get("/api/smart-devices", authMiddleware, async (c) => {
  const user = c.get("user");
  const sql = getDb(c);
  const [membership] = await sql`
    SELECT household_id FROM household_members WHERE user_id = ${user.id}
  `;
  if (!membership) return c.json({ devices: [] });
  const rows = await sql`
    SELECT * FROM smart_devices WHERE household_id = ${membership.household_id}
    ORDER BY created_at ASC
  `;
  return c.json({ devices: rows.map(mapDevice) });
});
function deviceStatusPayload(row, formatted) {
  return {
    id: row.id,
    tuyaDeviceId: row.tuya_device_id ?? row.tuyaDeviceId,
    ok: true,
    online: true,
    ...formatted,
    updatedAt: (/* @__PURE__ */ new Date()).toISOString()
  };
}
__name(deviceStatusPayload, "deviceStatusPayload");
async function readDeviceStatus(ctx, row, sql) {
  if (row.device_type === "ir_ac") {
    let ac = formatAcStatus(
      await getAcStatus(ctx, row.ir_parent_id, row.tuya_device_id)
    );
    let switchOn = ac.power === 1;
    let plugW;
    if (row.linked_plug_id && sql) {
      try {
        const [plug] = await sql`SELECT tuya_device_id FROM smart_devices WHERE id = ${row.linked_plug_id}`;
        if (plug) {
          plugW = await readPlugPowerW(ctx, plug.tuya_device_id);
          const plugOn = acPowerOnFromPlugW(plugW);
          if (plugOn != null) {
            switchOn = plugOn;
            ac = reconcileAcPower(ac, plugOn);
          }
        }
      } catch (err) {
        console.warn("[smart-devices] ir_ac plug read failed", row.id, err);
      }
    }
    return {
      ...deviceStatusPayload(row, {
        ac,
        switchOn,
        ...plugW != null ? { plugW, linked: true } : {}
      })
    };
  }
  if (row.device_type === "ir_remote") {
    if (row.linked_plug_id && sql) {
      const [plug] = await sql`SELECT tuya_device_id FROM smart_devices WHERE id = ${row.linked_plug_id}`;
      if (plug) {
        const f = formatStatuses(
          await getDeviceStatus(ctx, plug.tuya_device_id)
        );
        const w2 = f.powerW ?? 0;
        return deviceStatusPayload(row, {
          plugW: w2,
          switchOn: w2 > IR_PLUG_STANDBY_W,
          linked: true
        });
      }
    }
    return deviceStatusPayload(row, {});
  }
  return deviceStatusPayload(
    row,
    formatStatuses(await getDeviceStatus(ctx, row.tuya_device_id))
  );
}
__name(readDeviceStatus, "readDeviceStatus");
var SNAPSHOT_INTERVAL_MIN = 15;
async function getTodayStatsByDevice(sql, deviceIds) {
  if (deviceIds.length === 0) return {};
  const energyRows = await sql`
    SELECT device_id, COALESCE(SUM(energy_kwh), 0)::float8 AS kwh FROM (
      SELECT DISTINCT ON (device_id, energy_reported_at) device_id, energy_kwh
      FROM device_energy_snapshots
      WHERE device_id = ANY(${deviceIds}) AND energy_reported_at IS NOT NULL
        AND energy_reported_at >= date_trunc('day', NOW() AT TIME ZONE 'Europe/Warsaw') AT TIME ZONE 'Europe/Warsaw'
      ORDER BY device_id, energy_reported_at, recorded_at
    ) s
    GROUP BY device_id
  `;
  const uptimeRows = await sql`
    SELECT device_id, count(*)::int AS on_samples
    FROM device_energy_snapshots
    WHERE device_id = ANY(${deviceIds}) AND energy_reported_at IS NULL
      AND recorded_at >= date_trunc('day', NOW() AT TIME ZONE 'Europe/Warsaw') AT TIME ZONE 'Europe/Warsaw'
      AND power_w > 0
    GROUP BY device_id
  `;
  const stats = {};
  for (const id of deviceIds) stats[id] = { kwh: 0, uptimeMin: 0 };
  for (const r of energyRows) stats[r.device_id].kwh = Number(r.kwh);
  for (const r of uptimeRows)
    stats[r.device_id].uptimeMin = Number(r.on_samples) * SNAPSHOT_INTERVAL_MIN;
  return stats;
}
__name(getTodayStatsByDevice, "getTodayStatsByDevice");
app.get("/api/smart-devices/discover", authMiddleware, async (c) => {
  const user = c.get("user");
  const sql = getDb(c);
  const membership = await getMembershipWithOwner(sql, user.id);
  if (!membership) return c.json({ error: "No household" }, 400);
  if (membership.owner_id !== user.id)
    return c.json({ error: "forbidden_owner_only" }, 403);
  const ctx = await loadTuyaContext(c, sql, membership.household_id);
  if (!ctx) return c.json({ error: "tuya_not_configured" }, 400);
  let result;
  try {
    result = await listProjectDevices(ctx);
  } catch (err) {
    console.error("[smart-devices] discover failed", err);
    return c.json({ error: "tuya_unavailable" }, 502);
  }
  const devices = (result?.devices ?? []).map((d) => ({
    id: d.id,
    name: d.name ?? null,
    online: d.online ?? d.isOnline ?? false
  }));
  return c.json({ devices });
});
async function loadStContext(c, sql, householdId) {
  const accessToken = await getFreshAccessToken(sql, {
    householdId,
    clientId: getEnv(c, "SMARTTHINGS_CLIENT_ID"),
    clientSecret: getEnv(c, "SMARTTHINGS_CLIENT_SECRET"),
    rawKey: getFinanceDataKey(c)
  });
  if (!accessToken) return null;
  return { accessToken };
}
__name(loadStContext, "loadStContext");
async function trackStCycleState(c, sql, row, rawStStatus) {
  await applyCycleStateUpdate(
    sql,
    row,
    rawStStatus,
    row.cycle_notify_enabled ? (payload) => notifyHouseholdCycleComplete(sql, pushEnv(c), payload) : null
  );
}
__name(trackStCycleState, "trackStCycleState");
function buildStStatusPayload(status, row) {
  return {
    id: row.id,
    provider: "smartthings",
    externalDeviceId: row.external_device_id,
    ok: true,
    online: true,
    ...mapStStatus(status, row.device_type, row.cycle_labels),
    controls: allowedStActions(row.device_type, status),
    updatedAt: (/* @__PURE__ */ new Date()).toISOString()
  };
}
__name(buildStStatusPayload, "buildStStatusPayload");
function stOfflinePayload(row) {
  return {
    id: row.id,
    provider: "smartthings",
    externalDeviceId: row.external_device_id,
    ok: false,
    online: false
  };
}
__name(stOfflinePayload, "stOfflinePayload");
async function enrichStWithPlug(base, row, tuyaCtx, sql) {
  if (!row.linked_plug_id || !tuyaCtx) return base;
  const [plug] = await sql`SELECT id, tuya_device_id FROM smart_devices WHERE id = ${row.linked_plug_id}`;
  if (!plug) return base;
  try {
    const f = formatStatuses(
      await getDeviceStatus(tuyaCtx, plug.tuya_device_id)
    );
    const today = await getTodayStatsByDevice(sql, [plug.id]);
    return {
      ...base,
      linked: true,
      plugW: f.powerW ?? 0,
      todayKwh: today[plug.id]?.kwh ?? 0
    };
  } catch (err) {
    console.error(
      "[smart-devices] ST plug read failed",
      plug.tuya_device_id,
      err
    );
    return base;
  }
}
__name(enrichStWithPlug, "enrichStWithPlug");
async function runStCommand(c, sql, user, row) {
  let body;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON body" }, 400);
  }
  const action = body?.action;
  const isSetting = body?.setting != null;
  const cmd = isSetting ? buildStSettingCommand(row.device_type, body.setting, body.value) : buildStCommand(row.device_type, action);
  if (!cmd) {
    return c.json(
      {
        error: "command_not_supported",
        message: "Tej akcji nie mo\u017Cna wykona\u0107 na tym urz\u0105dzeniu."
      },
      400
    );
  }
  const ctx = await loadStContext(c, sql, row.household_id);
  if (!ctx)
    return c.json(
      {
        error: "smartthings_not_connected",
        message: "Konto SmartThings nie jest po\u0142\u0105czone."
      },
      400
    );
  let status;
  try {
    status = await getStDeviceStatus(ctx, row.external_device_id);
  } catch (err) {
    console.error("[smart-devices] ST status before command failed", err);
    return c.json(
      {
        error: "device_unreachable",
        message: "Urz\u0105dzenie nie odpowiada (offline)."
      },
      502
    );
  }
  if (isSetting) {
    const allowed = allowedStSetting(
      row.device_type,
      status,
      body.setting,
      body.value
    );
    if (allowed.reason === "remote_control_disabled") {
      return c.json(
        {
          error: "remote_control_disabled",
          message: "W\u0142\u0105cz zdalne sterowanie na pralce, aby zmieni\u0107 ustawienia z aplikacji."
        },
        409
      );
    }
    if (!allowed.ok) {
      return c.json(
        {
          error: "setting_not_available",
          message: "Tej warto\u015Bci nie mo\u017Cna teraz ustawi\u0107 (sprawd\u017A program i stan pralki)."
        },
        409
      );
    }
  } else {
    const allowed = allowedStActions(row.device_type, status);
    if (!allowed.remoteControlEnabled) {
      return c.json(
        {
          error: "remote_control_disabled",
          message: "W\u0142\u0105cz zdalne sterowanie na pralce, aby sterowa\u0107 ni\u0105 z aplikacji."
        },
        409
      );
    }
    if (!allowed.actions.includes(action)) {
      return c.json(
        {
          error: "action_not_available",
          message: "Nie mo\u017Cna teraz wykona\u0107 tej akcji (sprawd\u017A stan urz\u0105dzenia)."
        },
        409
      );
    }
  }
  try {
    await sendStCommand(ctx, row.external_device_id, cmd);
  } catch (err) {
    console.error("[smart-devices] ST command failed", err);
    return c.json(
      {
        error: "command_failed",
        message: "Urz\u0105dzenie nie przyj\u0119\u0142o komendy (zaj\u0119te lub offline). Spr\xF3buj ponownie."
      },
      502
    );
  }
  const logCode = isSetting ? `setting:${body.setting}` : action;
  const logValue = isSetting ? String(body.value) : JSON.stringify(cmd);
  try {
    await sql`
      INSERT INTO device_command_log (household_id, device_id, actor_id, code, value)
      VALUES (${row.household_id}, ${row.id}, ${user.id}, ${logCode}, ${logValue})
    `;
  } catch (err) {
    console.error("[device-command-log] ST insert failed", err);
  }
  return c.json({ ok: true });
}
__name(runStCommand, "runStCommand");
app.get(
  "/api/smart-devices/discover-smartthings",
  authMiddleware,
  async (c) => {
    const user = c.get("user");
    const sql = getDb(c);
    const membership = await getMembershipWithOwner(sql, user.id);
    if (!membership) return c.json({ error: "No household" }, 400);
    if (membership.owner_id !== user.id)
      return c.json({ error: "forbidden_owner_only" }, 403);
    const ctx = await loadStContext(c, sql, membership.household_id);
    if (!ctx) return c.json({ error: "smartthings_not_connected" }, 400);
    let raw2;
    try {
      raw2 = await getStDevices(ctx);
    } catch (err) {
      console.error("[smart-devices] ST discover failed", err);
      if (err?.status === 401) return c.json({ error: "reconnect" }, 400);
      return c.json({ error: "smartthings_unavailable" }, 502);
    }
    const added = await sql`
    SELECT external_device_id FROM smart_devices
    WHERE household_id = ${membership.household_id} AND provider = 'smartthings'
  `;
    const addedIds = new Set(added.map((r) => r.external_device_id));
    const devices = summarizeDevices({ items: raw2 }).filter(
      (d) => !addedIds.has(d.deviceId)
    );
    return c.json({ devices });
  }
);
app.post("/api/smart-devices/smartthings", authMiddleware, async (c) => {
  const user = c.get("user");
  const sql = getDb(c);
  let body;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON body" }, 400);
  }
  if (typeof body?.externalDeviceId !== "string" || !body.externalDeviceId.trim()) {
    return c.json({ error: "externalDeviceId is required" }, 400);
  }
  const externalDeviceId = body.externalDeviceId.trim();
  const membership = await getMembershipWithOwner(sql, user.id);
  if (!membership) return c.json({ error: "No household" }, 400);
  if (membership.owner_id !== user.id)
    return c.json({ error: "forbidden_owner_only" }, 403);
  const [dupe] = await sql`
    SELECT 1 FROM smart_devices WHERE provider = 'smartthings' AND external_device_id = ${externalDeviceId}
  `;
  if (dupe) return c.json({ error: "device_already_linked" }, 409);
  const ctx = await loadStContext(c, sql, membership.household_id);
  if (!ctx) return c.json({ error: "smartthings_not_connected" }, 400);
  let device;
  try {
    device = await getStDevice(ctx, externalDeviceId);
  } catch (err) {
    console.error("[smart-devices] ST getDevice failed", err);
    return c.json({ error: "device_not_found_in_smartthings" }, 404);
  }
  const displayName = typeof body.displayName === "string" && body.displayName.trim() ? body.displayName.trim() : device?.label || device?.name || externalDeviceId;
  const deviceType = inferDeviceType(device);
  const [row] = await sql`
    INSERT INTO smart_devices
      (household_id, provider, external_device_id, display_name, product_name,
       device_type, capabilities_json, created_by)
    VALUES
      (${membership.household_id}, 'smartthings', ${externalDeviceId}, ${displayName},
       ${device?.deviceManufacturerCode ?? device?.manufacturerName ?? null},
       ${deviceType}, ${JSON.stringify(device?.components ?? [])}, ${user.id})
    RETURNING *
  `;
  return c.json(mapDevice(row), 201);
});
app.get("/api/smart-devices/status", authMiddleware, async (c) => {
  const user = c.get("user");
  const sql = getDb(c);
  const [membership] = await sql`
    SELECT household_id FROM household_members WHERE user_id = ${user.id}
  `;
  if (!membership) return c.json({ statuses: [] });
  const rows = await sql`
    SELECT id, household_id, display_name, provider, external_device_id, tuya_device_id, device_type,
           ir_parent_id, linked_plug_id, cycle_labels, cycle_notify_enabled,
           last_cycle_state, last_cycle_snapshot
    FROM smart_devices
    WHERE household_id = ${membership.household_id} AND is_active = true
    ORDER BY created_at ASC
  `;
  if (rows.length === 0) return c.json({ statuses: [] });
  const tuyaRows = rows.filter((r) => r.provider !== "smartthings");
  const stRows = rows.filter((r) => r.provider === "smartthings");
  let tuyaCtx = null;
  let tuyaStatuses = [];
  if (tuyaRows.length > 0) {
    tuyaCtx = await loadTuyaContext(c, sql, membership.household_id);
    if (!tuyaCtx) return c.json({ error: "tuya_not_configured" }, 400);
    const todayByDevice = await getTodayStatsByDevice(
      sql,
      tuyaRows.map((r) => r.id)
    );
    tuyaStatuses = await Promise.all(
      tuyaRows.map(async (r) => {
        try {
          const today = todayByDevice[r.id] ?? { kwh: 0, uptimeMin: 0 };
          return {
            ...await readDeviceStatus(tuyaCtx, r, sql),
            todayKwh: today.kwh,
            todayUptimeMin: today.uptimeMin
          };
        } catch (err) {
          console.error("[smart-devices] status failed", r.tuya_device_id, err);
          return {
            id: r.id,
            tuyaDeviceId: r.tuya_device_id,
            ok: false,
            online: false
          };
        }
      })
    );
  } else if (stRows.some((r) => r.linked_plug_id)) {
    tuyaCtx = await loadTuyaContext(c, sql, membership.household_id);
  }
  let stStatuses = [];
  if (stRows.length > 0) {
    const stCtx = await loadStContext(c, sql, membership.household_id);
    stStatuses = await Promise.all(
      stRows.map(async (r) => {
        if (!stCtx) return stOfflinePayload(r);
        try {
          const raw2 = await getStDeviceStatus(stCtx, r.external_device_id);
          await trackStCycleState(c, sql, r, raw2);
          const base = buildStStatusPayload(raw2, r);
          return await enrichStWithPlug(base, r, tuyaCtx, sql);
        } catch (err) {
          console.error(
            "[smart-devices] ST status failed",
            r.external_device_id,
            err
          );
          return stOfflinePayload(r);
        }
      })
    );
  }
  return c.json({ statuses: [...tuyaStatuses, ...stStatuses] });
});
app.get("/api/smart-devices/:id/status", authMiddleware, async (c) => {
  const user = c.get("user");
  const sql = getDb(c);
  const id = c.req.param("id");
  const result = await loadDeviceInHousehold(sql, user.id, id);
  if (result.error) return c.json(result.error.body, result.error.status);
  if (result.row.provider === "smartthings") {
    const stCtx = await loadStContext(c, sql, result.row.household_id);
    if (!stCtx) return c.json({ error: "smartthings_not_connected" }, 400);
    try {
      const tuyaCtx = result.row.linked_plug_id ? await loadTuyaContext(c, sql, result.row.household_id) : null;
      const raw2 = await getStDeviceStatus(stCtx, result.row.external_device_id);
      await trackStCycleState(c, sql, result.row, raw2);
      const base = buildStStatusPayload(raw2, result.row);
      return c.json(
        await enrichStWithPlug(base, result.row, tuyaCtx, sql)
      );
    } catch (err) {
      console.error("[smart-devices] single ST status failed", err);
      return c.json(stOfflinePayload(result.row));
    }
  }
  const ctx = await loadTuyaContext(c, sql, result.row.household_id);
  if (!ctx) return c.json({ error: "tuya_not_configured" }, 400);
  try {
    const todayByDevice = await getTodayStatsByDevice(sql, [result.row.id]);
    const today = todayByDevice[result.row.id] ?? { kwh: 0, uptimeMin: 0 };
    return c.json({
      ...await readDeviceStatus(ctx, result.row, sql),
      todayKwh: today.kwh,
      todayUptimeMin: today.uptimeMin
    });
  } catch (err) {
    console.error("[smart-devices] single status failed", err);
    return c.json({
      id: result.row.id,
      tuyaDeviceId: result.row.tuya_device_id,
      ok: false,
      online: false
    });
  }
});
var HISTORY_RANGES = {
  "1d": { interval: "1 day", bucketSec: 900 },
  // co 15 min (częstotliwość crona)
  "7d": { interval: "7 days", bucketSec: 3600 },
  // godzinowo
  "30d": { interval: "30 days", bucketSec: 21600 },
  // co 6h
  "90d": { interval: "90 days", bucketSec: 86400 },
  // dziennie
  "1y": { interval: "365 days", bucketSec: 604800 }
  // tygodniowo
};
app.get("/api/smart-devices/:id/history", authMiddleware, async (c) => {
  const user = c.get("user");
  const sql = getDb(c);
  const id = c.req.param("id");
  const range = c.req.query("range") || "30d";
  const cfg = HISTORY_RANGES[range];
  if (!cfg) return c.json({ error: "invalid_range" }, 400);
  const result = await loadDeviceInHousehold(sql, user.id, id);
  if (result.error) return c.json(result.error.body, result.error.status);
  const [series, [rangeEnergy], [lastHour], [peak], [priceRow]] = await Promise.all([
    // Wykres mocy: średnia/szczyt power_w per bucket (po recorded_at), wyrównany do
    // czasu warszawskiego (granice na czyste lokalne godziny/północe), nie do epoki UTC.
    sql`
      SELECT (to_timestamp(floor(extract(epoch from (recorded_at AT TIME ZONE 'Europe/Warsaw')) / ${cfg.bucketSec}::float8) * ${cfg.bucketSec}::float8)
                AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Warsaw') AS bucket,
             avg(power_w)::float8 AS avg_w,
             max(power_w)::float8 AS max_w
      FROM device_energy_snapshots
      WHERE device_id = ${id} AND power_w IS NOT NULL AND recorded_at >= NOW() - ${cfg.interval}::interval
      GROUP BY bucket
      ORDER BY bucket ASC
    `,
    // Energia z DISTINCT paczek add_ele (po energy_reported_at = event_time z logów),
    // każda raz. Zużycie w wybranym zakresie + w ostatniej godzinie (niezależne od zakresu).
    sql`
      SELECT COALESCE(SUM(energy_kwh), 0)::float8 AS kwh FROM (
        SELECT DISTINCT ON (energy_reported_at) energy_kwh
        FROM device_energy_snapshots
        WHERE device_id = ${id} AND energy_reported_at IS NOT NULL
          AND energy_reported_at >= NOW() - ${cfg.interval}::interval
        ORDER BY energy_reported_at, recorded_at
      ) s
    `,
    sql`
      SELECT COALESCE(SUM(energy_kwh), 0)::float8 AS kwh FROM (
        SELECT DISTINCT ON (energy_reported_at) energy_kwh
        FROM device_energy_snapshots
        WHERE device_id = ${id} AND energy_reported_at IS NOT NULL
          AND energy_reported_at >= NOW() - interval '1 hour'
        ORDER BY energy_reported_at, recorded_at
      ) s
    `,
    sql`
      SELECT max(power_w)::float8 AS peak_w
      FROM device_energy_snapshots
      WHERE device_id = ${id} AND recorded_at >= NOW() - ${cfg.interval}::interval
    `,
    sql`
      SELECT energy_price_pln FROM tuya_credentials WHERE household_id = ${result.row.household_id}
    `
  ]);
  const pricePln = priceRow?.energy_price_pln == null ? null : Number(priceRow.energy_price_pln);
  const energyKwh = rangeEnergy?.kwh == null ? 0 : Number(rangeEnergy.kwh);
  return c.json({
    range,
    series: series.map((r) => ({
      t: toIso(r.bucket),
      avgW: r.avg_w == null ? null : Number(r.avg_w),
      maxW: r.max_w == null ? null : Number(r.max_w)
    })),
    summary: {
      energyKwh,
      lastHourKwh: lastHour?.kwh == null ? 0 : Number(lastHour.kwh),
      peakW: peak?.peak_w == null ? null : Number(peak.peak_w),
      costPln: pricePln == null ? null : energyKwh * pricePln
    }
  });
});
var REPORT_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
app.get("/api/smart-devices/report", authMiddleware, async (c) => {
  const user = c.get("user");
  const sql = getDb(c);
  const from = c.req.query("from");
  const to2 = c.req.query("to");
  if (!REPORT_DATE_RE.test(from ?? "") || !REPORT_DATE_RE.test(to2 ?? "")) {
    return c.json({ error: "from and to must be YYYY-MM-DD" }, 400);
  }
  const spanDays = Math.round((Date.parse(to2) - Date.parse(from)) / 864e5) + 1;
  if (!(spanDays >= 1 && spanDays <= 366)) {
    return c.json({ error: "range must be 1-366 days, from <= to" }, 400);
  }
  const [membership] = await sql`
    SELECT household_id FROM household_members WHERE user_id = ${user.id}
  `;
  if (!membership) return c.json({ error: "No household" }, 400);
  const requestedIds = (c.req.query("deviceIds") ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  const devices = requestedIds.length === 0 ? await sql`
        SELECT id, display_name FROM smart_devices
        WHERE household_id = ${membership.household_id} AND is_active = true
        ORDER BY created_at ASC
      ` : await sql`
        SELECT id, display_name FROM smart_devices
        WHERE household_id = ${membership.household_id} AND id = ANY(${requestedIds})
        ORDER BY created_at ASC
      `;
  const ids = devices.map((d) => d.id);
  const [priceRow] = await sql`
    SELECT energy_price_pln FROM tuya_credentials WHERE household_id = ${membership.household_id}
  `;
  const pricePln = priceRow?.energy_price_pln == null ? null : Number(priceRow.energy_price_pln);
  const energyRows = ids.length === 0 ? [] : await sql`
    SELECT device_id, COALESCE(SUM(energy_kwh), 0)::float8 AS kwh FROM (
      SELECT DISTINCT ON (device_id, energy_reported_at) device_id, energy_kwh
      FROM device_energy_snapshots
      WHERE device_id = ANY(${ids}) AND energy_reported_at IS NOT NULL
        AND energy_reported_at >= ${from}::date AT TIME ZONE 'Europe/Warsaw'
        AND energy_reported_at < (${to2}::date + 1) AT TIME ZONE 'Europe/Warsaw'
      ORDER BY device_id, energy_reported_at, recorded_at
    ) s GROUP BY device_id
  `;
  const peakRows = ids.length === 0 ? [] : await sql`
    SELECT device_id, max(power_w)::float8 AS peak_w
    FROM device_energy_snapshots
    WHERE device_id = ANY(${ids})
      AND recorded_at >= ${from}::date AT TIME ZONE 'Europe/Warsaw'
      AND recorded_at < (${to2}::date + 1) AT TIME ZONE 'Europe/Warsaw'
    GROUP BY device_id
  `;
  const uptimeRows = ids.length === 0 ? [] : await sql`
    SELECT device_id, count(*)::int AS on_samples
    FROM device_energy_snapshots
    WHERE device_id = ANY(${ids}) AND energy_reported_at IS NULL
      AND recorded_at >= ${from}::date AT TIME ZONE 'Europe/Warsaw'
      AND recorded_at < (${to2}::date + 1) AT TIME ZONE 'Europe/Warsaw'
      AND power_w > 0
    GROUP BY device_id
  `;
  const dailyRows = ids.length === 0 ? [] : await sql`
    SELECT day, COALESCE(SUM(energy_kwh), 0)::float8 AS kwh FROM (
      SELECT DISTINCT ON (device_id, energy_reported_at)
        (energy_reported_at AT TIME ZONE 'Europe/Warsaw')::date AS day, energy_kwh
      FROM device_energy_snapshots
      WHERE device_id = ANY(${ids}) AND energy_reported_at IS NOT NULL
        AND energy_reported_at >= ${from}::date AT TIME ZONE 'Europe/Warsaw'
        AND energy_reported_at < (${to2}::date + 1) AT TIME ZONE 'Europe/Warsaw'
      ORDER BY device_id, energy_reported_at, recorded_at
    ) s GROUP BY day ORDER BY day ASC
  `;
  const kwhBy = Object.fromEntries(
    energyRows.map((r) => [r.device_id, Number(r.kwh)])
  );
  const peakBy = Object.fromEntries(
    peakRows.map((r) => [r.device_id, Number(r.peak_w)])
  );
  const samplesBy = Object.fromEntries(
    uptimeRows.map((r) => [r.device_id, Number(r.on_samples)])
  );
  return c.json({
    from,
    to: to2,
    days: spanDays,
    energyPricePln: pricePln,
    devices: devices.map((d) => {
      const kwh = kwhBy[d.id] ?? 0;
      return {
        id: d.id,
        name: d.display_name,
        energyKwh: kwh,
        costPln: pricePln == null ? null : kwh * pricePln,
        peakW: peakBy[d.id] ?? null,
        uptimeMin: (samplesBy[d.id] ?? 0) * SNAPSHOT_INTERVAL_MIN
      };
    }),
    daily: dailyRows.map((r) => ({
      date: typeof r.day === "string" ? r.day : new Date(r.day).toISOString().slice(0, 10),
      kwh: Number(r.kwh)
    }))
  });
});
var REPORT_PDF_MAX_BASE64_CHARS = 4 * 1024 * 1024;
app.post("/api/smart-devices/report/email", authMiddleware, async (c) => {
  const user = c.get("user");
  let body;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON body" }, 400);
  }
  const { pdfBase64, from, to: to2 } = body ?? {};
  if (typeof pdfBase64 !== "string" || pdfBase64.length === 0) {
    return c.json({ error: "pdfBase64 is required" }, 400);
  }
  if (pdfBase64.length > REPORT_PDF_MAX_BASE64_CHARS)
    return c.json({ error: "pdf_too_large" }, 413);
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(pdfBase64))
    return c.json({ error: "pdfBase64 must be base64" }, 400);
  const period = REPORT_DATE_RE.test(from ?? "") && REPORT_DATE_RE.test(to2 ?? "") ? `${from} \u2013 ${to2}` : null;
  const resendKey = getEnv(c, "RESEND_API_KEY");
  if (!resendKey) return c.json({ error: "email_not_configured" }, 503);
  const dateStr = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from: "HomeCashflow <noreply@homecashflow.org>",
      to: [user.email],
      subject: period ? `Raport energii ${period}` : "Raport energii",
      html: `<p>Cze\u015B\u0107${user.name ? ` ${user.name}` : ""}!</p><p>W za\u0142\u0105czniku raport zu\u017Cycia energii${period ? ` za okres ${period}` : ""} wygenerowany w HomeCashflow.</p>`,
      attachments: [
        { filename: `raport-energii-${dateStr}.pdf`, content: pdfBase64 }
      ]
    })
  });
  if (!res.ok) {
    console.error(
      "[report-email] Resend error",
      res.status,
      await res.text().catch(() => "")
    );
    return c.json({ error: "email_send_failed" }, 502);
  }
  return c.json({ sent: true, to: user.email });
});
app.post("/api/smart-devices", authMiddleware, async (c) => {
  const user = c.get("user");
  const sql = getDb(c);
  let body;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON body" }, 400);
  }
  if (typeof body?.tuyaDeviceId !== "string" || !body.tuyaDeviceId.trim()) {
    return c.json({ error: "tuyaDeviceId is required" }, 400);
  }
  const tuyaDeviceId = body.tuyaDeviceId.trim();
  const membership = await getMembershipWithOwner(sql, user.id);
  if (!membership) return c.json({ error: "No household" }, 400);
  if (membership.owner_id !== user.id)
    return c.json({ error: "forbidden_owner_only" }, 403);
  const [dupe] = await sql`SELECT 1 FROM smart_devices WHERE tuya_device_id = ${tuyaDeviceId}`;
  if (dupe) return c.json({ error: "device_already_linked" }, 409);
  const ctx = await loadTuyaContext(c, sql, membership.household_id);
  if (!ctx) return c.json({ error: "tuya_not_configured" }, 400);
  let info;
  try {
    info = await getDeviceInfo(ctx, tuyaDeviceId);
  } catch (err) {
    console.error("[smart-devices] getDeviceInfo failed", err);
    return c.json({ error: "device_not_found_in_tuya" }, 404);
  }
  let functions = null;
  try {
    functions = await getDeviceFunctions(ctx, tuyaDeviceId);
  } catch (err) {
    console.error("[smart-devices] getDeviceFunctions failed (non-fatal)", err);
  }
  const displayName = info?.name || tuyaDeviceId;
  const category = info?.category ?? "";
  const isIr = category.startsWith("infrared_");
  const isIrAc = category === "infrared_ac";
  const irParentId = isIr ? info?.gateway_id ?? null : null;
  if (isIr && !irParentId) {
    return c.json({ error: "ir_parent_missing" }, 400);
  }
  const deviceType = isIrAc ? "ir_ac" : isIr ? "ir_remote" : "plug";
  const [row] = await sql`
    INSERT INTO smart_devices
      (household_id, provider, external_device_id, tuya_device_id, display_name, product_name, product_id,
       device_type, ir_parent_id, functions_json, created_by)
    VALUES
      (${membership.household_id}, 'tuya', ${tuyaDeviceId}, ${tuyaDeviceId}, ${displayName},
       ${info?.product_name ?? null}, ${info?.product_id ?? null},
       ${deviceType}, ${irParentId},
       ${functions == null ? null : JSON.stringify(functions)}, ${user.id})
    RETURNING *
  `;
  return c.json(mapDevice(row), 201);
});
async function loadDeviceInHousehold(sql, userId, id) {
  const [row] = await sql`
    SELECT sd.*, h.owner_id AS household_owner_id
    FROM smart_devices sd
    JOIN household_members hm ON hm.household_id = sd.household_id
    JOIN households h ON h.id = sd.household_id
    WHERE sd.id = ${id} AND hm.user_id = ${userId}
  `;
  if (!row) {
    const [exists] = await sql`SELECT 1 FROM smart_devices WHERE id = ${id}`;
    return {
      error: {
        status: exists ? 403 : 404,
        body: { error: exists ? "forbidden" : "not found" }
      }
    };
  }
  return { ok: true, row };
}
__name(loadDeviceInHousehold, "loadDeviceInHousehold");
app.patch("/api/smart-devices/:id", authMiddleware, async (c) => {
  const user = c.get("user");
  const sql = getDb(c);
  const id = c.req.param("id");
  let body;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON body" }, 400);
  }
  const result = await loadDeviceInHousehold(sql, user.id, id);
  if (result.error) return c.json(result.error.body, result.error.status);
  if (result.row.household_owner_id !== user.id)
    return c.json({ error: "forbidden_owner_only" }, 403);
  const nextName = typeof body.displayName === "string" && body.displayName.trim() ? body.displayName.trim() : result.row.display_name;
  const nextActive = typeof body.isActive === "boolean" ? body.isActive : result.row.is_active;
  let nextPlug = result.row.linked_plug_id;
  if ("linkedPlugId" in body) {
    const canLink = IR_TIMER_TYPES.has(result.row.device_type) || result.row.provider === "smartthings";
    if (!canLink) return c.json({ error: "link_not_supported" }, 400);
    if (body.linkedPlugId == null) {
      nextPlug = null;
    } else {
      const [plug] = await sql`
        SELECT id, device_type FROM smart_devices
        WHERE id = ${body.linkedPlugId} AND household_id = ${result.row.household_id}
      `;
      if (!plug) return c.json({ error: "plug_not_found" }, 400);
      if (plug.device_type && plug.device_type !== "plug")
        return c.json({ error: "not_a_plug" }, 400);
      nextPlug = plug.id;
    }
  }
  let nextCycleLabels = result.row.cycle_labels;
  if ("cycleLabels" in body) {
    const src = body.cycleLabels;
    if (src != null && (typeof src !== "object" || Array.isArray(src))) {
      return c.json({ error: "invalid_cycle_labels" }, 400);
    }
    const clean = {};
    for (const [code, name] of Object.entries(src ?? {}).slice(0, 60)) {
      if (typeof name !== "string") continue;
      const trimmed = name.trim().slice(0, 40);
      if (trimmed) clean[String(code).slice(0, 16)] = trimmed;
    }
    nextCycleLabels = Object.keys(clean).length ? clean : null;
  }
  const CYCLE_TYPES2 = /* @__PURE__ */ new Set(["washer", "dryer", "dishwasher"]);
  let nextCycleNotify = result.row.cycle_notify_enabled;
  if ("cycleNotifyEnabled" in body) {
    if (!CYCLE_TYPES2.has(result.row.device_type))
      return c.json({ error: "cycle_notify_not_supported" }, 400);
    if (typeof body.cycleNotifyEnabled !== "boolean")
      return c.json({ error: "invalid_cycle_notify" }, 400);
    nextCycleNotify = body.cycleNotifyEnabled;
  }
  let nextPlugNotify = result.row.plug_notify_enabled;
  let nextThreshold = result.row.power_threshold_w;
  let nextThresholdMin = result.row.power_threshold_min_w;
  if ("plugNotifyEnabled" in body) {
    if (result.row.device_type !== "plug")
      return c.json({ error: "plug_notify_not_supported" }, 400);
    if (typeof body.plugNotifyEnabled !== "boolean")
      return c.json({ error: "invalid_plug_notify" }, 400);
    nextPlugNotify = body.plugNotifyEnabled;
  }
  const parseThreshold = /* @__PURE__ */ __name((val) => {
    if (val == null || val === "") return null;
    const t = Number(val);
    if (!Number.isFinite(t) || t <= 0 || t > 1e5) return NaN;
    return t;
  }, "parseThreshold");
  if ("powerThresholdW" in body) {
    if (result.row.device_type !== "plug")
      return c.json({ error: "plug_notify_not_supported" }, 400);
    const t = parseThreshold(body.powerThresholdW);
    if (Number.isNaN(t)) return c.json({ error: "invalid_power_threshold" }, 400);
    nextThreshold = t;
  }
  if ("powerThresholdMinW" in body) {
    if (result.row.device_type !== "plug")
      return c.json({ error: "plug_notify_not_supported" }, 400);
    const t = parseThreshold(body.powerThresholdMinW);
    if (Number.isNaN(t)) return c.json({ error: "invalid_power_threshold" }, 400);
    nextThresholdMin = t;
  }
  const [row] = await sql`
    UPDATE smart_devices
    SET display_name = ${nextName}, is_active = ${nextActive},
        linked_plug_id = ${nextPlug},
        cycle_labels = ${nextCycleLabels == null ? null : JSON.stringify(nextCycleLabels)},
        cycle_notify_enabled = ${nextCycleNotify},
        plug_notify_enabled = ${nextPlugNotify},
        power_threshold_w = ${nextThreshold},
        power_threshold_min_w = ${nextThresholdMin},
        updated_at = NOW()
    WHERE id = ${id}
    RETURNING *
  `;
  return c.json(mapDevice(row));
});
app.delete("/api/smart-devices/:id", authMiddleware, async (c) => {
  const user = c.get("user");
  const sql = getDb(c);
  const id = c.req.param("id");
  const result = await loadDeviceInHousehold(sql, user.id, id);
  if (result.error) return c.json(result.error.body, result.error.status);
  if (result.row.household_owner_id !== user.id)
    return c.json({ error: "forbidden_owner_only" }, 403);
  await sql`DELETE FROM smart_devices WHERE id = ${id}`;
  return c.body(null, 204);
});
app.post("/api/smart-devices/:id/commands", authMiddleware, async (c) => {
  const user = c.get("user");
  const sql = getDb(c);
  const id = c.req.param("id");
  const result = await loadDeviceInHousehold(sql, user.id, id);
  if (result.error) return c.json(result.error.body, result.error.status);
  if (result.row.provider === "smartthings") {
    return runStCommand(c, sql, user, result.row);
  }
  let body;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON body" }, 400);
  }
  const commands = body?.commands;
  const isIrAc = result.row.device_type === "ir_ac";
  const validationError = isIrAc ? validateAcCommands(commands) : validateCommands(result.row.functions_json, commands);
  if (validationError)
    return c.json(
      { error: "command_not_allowed", detail: validationError },
      400
    );
  const ctx = await loadTuyaContext(c, sql, result.row.household_id);
  if (!ctx) return c.json({ error: "tuya_not_configured" }, 400);
  try {
    if (isIrAc) {
      for (const cmd of commands) {
        await sendAcCommand(
          ctx,
          result.row.ir_parent_id,
          result.row.tuya_device_id,
          cmd.code,
          cmd.value
        );
      }
    } else {
      await sendCommands(ctx, result.row.tuya_device_id, commands);
    }
  } catch (err) {
    console.error("[smart-devices] command failed", err);
    return c.json({ error: "command_failed" }, 502);
  }
  for (const cmd of commands) {
    try {
      await sql`
        INSERT INTO device_command_log (household_id, device_id, actor_id, code, value)
        VALUES (${result.row.household_id}, ${result.row.id}, ${user.id}, ${cmd.code}, ${JSON.stringify(cmd.value ?? null)})
      `;
    } catch (err) {
      console.error("[device-command-log] insert failed", err);
    }
  }
  if (isIrAc) {
    const powerCmd = commands.find((cmd) => cmd.code === "power");
    if (powerCmd != null) {
      const v2 = powerCmd.value;
      const action = v2 === 1 || v2 === true || v2 === "1" ? "on" : v2 === 0 || v2 === false || v2 === "0" ? "off" : null;
      if (action) {
        const pushResult = await notifyHouseholdAcPower(sql, pushEnv(c), {
          householdId: result.row.household_id,
          action,
          deviceName: result.row.display_name,
          source: "manual"
        }).catch((err) => {
          console.warn("[push] manual AC notify failed", err);
          return { sent: 0, failed: 1, error: String(err.message || err) };
        });
        return c.json({ ok: true, push: pushResult });
      }
    }
  }
  return c.json({ ok: true });
});
app.get("/api/smart-devices/:id/ir-keys", authMiddleware, async (c) => {
  const user = c.get("user");
  const sql = getDb(c);
  const id = c.req.param("id");
  const result = await loadDeviceInHousehold(sql, user.id, id);
  if (result.error) return c.json(result.error.body, result.error.status);
  if (result.row.device_type !== "ir_remote")
    return c.json({ error: "not_ir_remote" }, 400);
  const ctx = await loadTuyaContext(c, sql, result.row.household_id);
  if (!ctx) return c.json({ error: "tuya_not_configured" }, 400);
  try {
    const r = await getRemoteKeys(
      ctx,
      result.row.ir_parent_id,
      result.row.tuya_device_id
    );
    return c.json({
      categoryId: r?.category_id ?? null,
      keys: r?.key_list ?? []
    });
  } catch (err) {
    console.error("[smart-devices] ir-keys failed", err);
    return c.json({ error: "ir_keys_failed" }, 502);
  }
});
app.post("/api/smart-devices/:id/ir-key", authMiddleware, async (c) => {
  const user = c.get("user");
  const sql = getDb(c);
  const id = c.req.param("id");
  let body;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON body" }, 400);
  }
  const result = await loadDeviceInHousehold(sql, user.id, id);
  if (result.error) return c.json(result.error.body, result.error.status);
  if (result.row.device_type !== "ir_remote")
    return c.json({ error: "not_ir_remote" }, 400);
  const key = typeof body?.key === "string" ? body.key : null;
  const keyId = typeof body?.keyId === "number" ? body.keyId : null;
  const categoryId = typeof body?.categoryId === "number" ? body.categoryId : null;
  if (!key && keyId == null) return c.json({ error: "key_required" }, 400);
  const ctx = await loadTuyaContext(c, sql, result.row.household_id);
  if (!ctx) return c.json({ error: "tuya_not_configured" }, 400);
  try {
    await sendRemoteKey(
      ctx,
      result.row.ir_parent_id,
      result.row.tuya_device_id,
      { categoryId, key, keyId }
    );
  } catch (err) {
    console.error("[smart-devices] ir-key failed", err);
    return c.json({ error: "command_failed" }, 502);
  }
  try {
    await sql`
      INSERT INTO device_command_log (household_id, device_id, actor_id, code, value)
      VALUES (${result.row.household_id}, ${result.row.id}, ${user.id}, ${key ?? String(keyId)}, ${JSON.stringify({ keyId, categoryId })})
    `;
  } catch (err) {
    console.error("[device-command-log] insert failed", err);
  }
  return c.json({ ok: true });
});
var IR_TIMER_TYPES = /* @__PURE__ */ new Set(["ir_ac", "ir_remote"]);
var MAX_TIMER_MINUTES = 24 * 60;
app.get("/api/smart-devices/:id/timer", authMiddleware, async (c) => {
  const user = c.get("user");
  const sql = getDb(c);
  const id = c.req.param("id");
  const result = await loadDeviceInHousehold(sql, user.id, id);
  if (result.error) return c.json(result.error.body, result.error.status);
  const [t] = await sql`
    SELECT fire_at FROM device_timers
    WHERE device_id = ${id} AND status = 'pending'
    ORDER BY fire_at ASC LIMIT 1
  `;
  if (!t) return c.json({ timer: null });
  const minutesLeft = Math.max(
    0,
    Math.round((new Date(t.fire_at).getTime() - Date.now()) / 6e4)
  );
  return c.json({ timer: { fireAt: toIso(t.fire_at), minutesLeft } });
});
app.post("/api/smart-devices/:id/timer", authMiddleware, async (c) => {
  const user = c.get("user");
  const sql = getDb(c);
  const id = c.req.param("id");
  let body;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON body" }, 400);
  }
  const result = await loadDeviceInHousehold(sql, user.id, id);
  if (result.error) return c.json(result.error.body, result.error.status);
  if (!IR_TIMER_TYPES.has(result.row.device_type))
    return c.json({ error: "timer_not_supported" }, 400);
  const minutes = Number(body?.minutes);
  if (!Number.isFinite(minutes))
    return c.json({ error: "minutes_required" }, 400);
  await sql`UPDATE device_timers SET status = 'canceled' WHERE device_id = ${id} AND status = 'pending'`;
  if (minutes <= 0) return c.json({ timer: null });
  const clamped = Math.min(Math.round(minutes), MAX_TIMER_MINUTES);
  const [t] = await sql`
    INSERT INTO device_timers (device_id, household_id, fire_at, action, created_by)
    VALUES (${id}, ${result.row.household_id}, NOW() + (${clamped} || ' minutes')::interval, 'off', ${user.id})
    RETURNING fire_at
  `;
  return c.json({ timer: { fireAt: toIso(t.fire_at), minutesLeft: clamped } });
});
var THERMOSTAT_MIN_DEADZONE = 1;
function serializeThermostat(t) {
  const num2 = /* @__PURE__ */ __name((v2) => v2 == null ? null : Number(v2), "num");
  return {
    enabled: t.enabled,
    mode: t.climate_mode === "heat" ? "heat" : "cool",
    locationLabel: t.location_label,
    lat: num2(t.lat),
    lon: num2(t.lon),
    tempOn: num2(t.temp_on),
    tempOff: num2(t.temp_off),
    lastAction: t.last_action,
    lastCheckAction: t.last_check_action,
    lastOutdoorTemp: num2(t.last_outdoor_temp),
    lastCheckedAt: t.last_checked_at ? toIso(t.last_checked_at) : null
  };
}
__name(serializeThermostat, "serializeThermostat");
app.get("/api/smart-devices/:id/thermostat", authMiddleware, async (c) => {
  const user = c.get("user");
  const sql = getDb(c);
  const id = c.req.param("id");
  const result = await loadDeviceInHousehold(sql, user.id, id);
  if (result.error) return c.json(result.error.body, result.error.status);
  const [t] = await sql`
    SELECT enabled, climate_mode, location_label, lat, lon, temp_on, temp_off,
           last_action, last_check_action, last_outdoor_temp, last_checked_at
    FROM ac_thermostats WHERE device_id = ${id}
  `;
  if (!t) return c.json({ thermostat: null });
  return c.json({ thermostat: serializeThermostat(t) });
});
app.get("/api/smart-devices/:id/thermostat/temperature", authMiddleware, async (c) => {
  const user = c.get("user");
  const sql = getDb(c);
  const id = c.req.param("id");
  const result = await loadDeviceInHousehold(sql, user.id, id);
  if (result.error) return c.json(result.error.body, result.error.status);
  const [t] = await sql`SELECT lat, lon FROM ac_thermostats WHERE device_id = ${id}`;
  if (!t || t.lat == null || t.lon == null)
    return c.json({ error: "no_location" }, 400);
  try {
    const w2 = await getOutdoorWeather(
      { lat: Number(t.lat), lon: Number(t.lon) },
      { apiKey: c.env.WEATHER_GOOGLE_API_KEY }
    );
    return c.json({ temp: w2?.temp ?? null, condition: w2?.condition ?? null });
  } catch (err) {
    console.error("[thermostat] temperature fetch failed", err);
    return c.json({ error: "weather_failed" }, 502);
  }
});
app.put("/api/smart-devices/:id/thermostat", authMiddleware, async (c) => {
  const user = c.get("user");
  const sql = getDb(c);
  const id = c.req.param("id");
  let body;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON body" }, 400);
  }
  const result = await loadDeviceInHousehold(sql, user.id, id);
  if (result.error) return c.json(result.error.body, result.error.status);
  if (result.row.device_type !== "ir_ac")
    return c.json({ error: "thermostat_not_supported" }, 400);
  const tempOn = Number(body?.tempOn);
  const tempOff = Number(body?.tempOff);
  if (!Number.isFinite(tempOn) || !Number.isFinite(tempOff))
    return c.json({ error: "thresholds_required" }, 400);
  const mode = body?.mode === "heat" ? "heat" : "cool";
  if (thermostatThresholdGap(mode, tempOn, tempOff) < THERMOSTAT_MIN_DEADZONE)
    return c.json({ error: "threshold_order" }, 400);
  const enabled = body?.enabled === true;
  let locationLabel = typeof body?.locationLabel === "string" ? body.locationLabel.trim() || null : null;
  let lat = body?.lat == null ? null : Number(body.lat);
  let lon = body?.lon == null ? null : Number(body.lon);
  if (typeof body?.city === "string" && body.city.trim()) {
    let geo;
    try {
      geo = await geocodeCity(body.city);
    } catch (err) {
      console.error("[thermostat] geocoding failed", err);
      return c.json({ error: "geocode_failed" }, 502);
    }
    if (!geo) return c.json({ error: "geocode_no_result" }, 400);
    lat = geo.lat;
    lon = geo.lon;
    locationLabel = geo.label;
  }
  if (lat != null && !Number.isFinite(lat) || lon != null && !Number.isFinite(lon))
    return c.json({ error: "invalid_coordinates" }, 400);
  const [t] = await sql`
    INSERT INTO ac_thermostats
      (device_id, household_id, enabled, climate_mode, location_label, lat, lon, temp_on, temp_off)
    VALUES
      (${id}, ${result.row.household_id}, ${enabled}, ${mode}, ${locationLabel}, ${lat}, ${lon}, ${tempOn}, ${tempOff})
    ON CONFLICT (device_id) DO UPDATE SET
      enabled = EXCLUDED.enabled,
      climate_mode = EXCLUDED.climate_mode,
      location_label = EXCLUDED.location_label,
      lat = EXCLUDED.lat,
      lon = EXCLUDED.lon,
      temp_on = EXCLUDED.temp_on,
      temp_off = EXCLUDED.temp_off,
      updated_at = NOW()
    RETURNING enabled, climate_mode, location_label, lat, lon, temp_on, temp_off,
              last_action, last_check_action, last_outdoor_temp, last_checked_at
  `;
  return c.json({ thermostat: serializeThermostat(t) });
});
app.get("/api/push/vapid-public-key", async (c) => {
  const publicKey = pushEnv(c).VAPID_PUBLIC_KEY;
  if (!publicKey) return c.json({ error: "push_not_configured" }, 503);
  return c.json({ publicKey });
});
app.get("/api/push/status", authMiddleware, async (c) => {
  const user = c.get("user");
  const sql = getDb(c);
  try {
    const [row] = await sql`
      SELECT COUNT(*)::int AS count,
             COALESCE(BOOL_OR(ac_power_notify), false) AS ac_power_notify,
             COALESCE(BOOL_OR(washer_cycle_notify), false) AS washer_cycle_notify,
             COALESCE(BOOL_OR(plug_power_notify), false) AS plug_power_notify
      FROM push_subscriptions
      WHERE user_id = ${user.id}
    `;
    const count = row?.count ?? 0;
    return c.json({
      configured: pushConfigured(pushEnv(c)),
      subscribed: count > 0,
      acPowerNotify: count > 0 ? row.ac_power_notify === true : false,
      washerCycleNotify: count > 0 ? row.washer_cycle_notify === true : false,
      plugPowerNotify: count > 0 ? row.plug_power_notify === true : false
    });
  } catch (err) {
    console.error("[push] status db failed", err);
    return c.json({
      configured: pushConfigured(pushEnv(c)),
      subscribed: false,
      acPowerNotify: false,
      washerCycleNotify: false,
      plugPowerNotify: false,
      dbError: true
    });
  }
});
app.post("/api/push/subscribe", authMiddleware, async (c) => {
  const user = c.get("user");
  const sql = getDb(c);
  if (!pushConfigured(pushEnv(c))) return c.json({ error: "push_not_configured" }, 503);
  let body;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON body" }, 400);
  }
  const endpoint = typeof body?.endpoint === "string" ? body.endpoint.trim() : "";
  const p256dh = typeof body?.keys?.p256dh === "string" ? body.keys.p256dh.trim() : "";
  const auth = typeof body?.keys?.auth === "string" ? body.keys.auth.trim() : "";
  if (!endpoint || !p256dh || !auth)
    return c.json({ error: "invalid_subscription" }, 400);
  const acPowerNotify = body?.acPowerNotify !== false;
  const washerCycleNotify = body?.washerCycleNotify !== false;
  const plugPowerNotify = body?.plugPowerNotify !== false;
  try {
    await sql`
      INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth, ac_power_notify, washer_cycle_notify, plug_power_notify)
      VALUES (${user.id}, ${endpoint}, ${p256dh}, ${auth}, ${acPowerNotify}, ${washerCycleNotify}, ${plugPowerNotify})
      ON CONFLICT (endpoint) DO UPDATE SET
        user_id = EXCLUDED.user_id,
        p256dh = EXCLUDED.p256dh,
        auth = EXCLUDED.auth,
        ac_power_notify = EXCLUDED.ac_power_notify,
        washer_cycle_notify = EXCLUDED.washer_cycle_notify,
        plug_power_notify = EXCLUDED.plug_power_notify,
        updated_at = NOW()
    `;
  } catch (err) {
    console.error("[push] subscribe db failed", err);
    return c.json({ error: "push_db_error", message: String(err.message || err) }, 500);
  }
  return c.json({ ok: true, acPowerNotify, washerCycleNotify, plugPowerNotify });
});
app.post("/api/push/test", authMiddleware, async (c) => {
  const user = c.get("user");
  const sql = getDb(c);
  if (!pushConfigured(pushEnv(c))) return c.json({ error: "push_not_configured" }, 503);
  const result = await notifyUserPush(sql, pushEnv(c), user.id, {
    title: "HomeCashflow \u2014 test",
    body: "Powiadomienia push dzia\u0142aj\u0105 poprawnie.",
    url: "/?view=urzadzenia"
  });
  if (result.reason === "no_subscriptions") {
    return c.json(
      {
        error: "no_subscription",
        message: "Brak aktywnej subskrypcji push \u2014 w\u0142\u0105cz powiadomienia checkboxem."
      },
      400
    );
  }
  if (result.sent === 0) {
    return c.json(
      {
        error: "push_delivery_failed",
        message: "Nie uda\u0142o si\u0119 dostarczy\u0107 powiadomienia.",
        detail: result
      },
      502
    );
  }
  return c.json({ ok: true, ...result });
});
app.delete("/api/push/subscribe", authMiddleware, async (c) => {
  const user = c.get("user");
  const sql = getDb(c);
  let endpoint = null;
  try {
    const body = await c.req.json();
    endpoint = typeof body?.endpoint === "string" ? body.endpoint.trim() : null;
  } catch {
  }
  if (endpoint) {
    await sql`
      DELETE FROM push_subscriptions
      WHERE user_id = ${user.id} AND endpoint = ${endpoint}
    `;
  } else {
    await sql`DELETE FROM push_subscriptions WHERE user_id = ${user.id}`;
  }
  return c.json({ ok: true });
});
app.put("/api/push/preferences", authMiddleware, async (c) => {
  const user = c.get("user");
  const sql = getDb(c);
  let body;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON body" }, 400);
  }
  if (typeof body?.acPowerNotify !== "boolean" && typeof body?.washerCycleNotify !== "boolean" && typeof body?.plugPowerNotify !== "boolean") {
    return c.json({ error: "push_preference_required" }, 400);
  }
  const updates = [];
  if (typeof body.acPowerNotify === "boolean") updates.push(["ac_power_notify", body.acPowerNotify]);
  if (typeof body.washerCycleNotify === "boolean") updates.push(["washer_cycle_notify", body.washerCycleNotify]);
  if (typeof body.plugPowerNotify === "boolean") updates.push(["plug_power_notify", body.plugPowerNotify]);
  for (const [col, val] of updates) {
    if (col === "ac_power_notify") {
      await sql`UPDATE push_subscriptions SET ac_power_notify = ${val}, updated_at = NOW() WHERE user_id = ${user.id}`;
    } else if (col === "washer_cycle_notify") {
      await sql`UPDATE push_subscriptions SET washer_cycle_notify = ${val}, updated_at = NOW() WHERE user_id = ${user.id}`;
    } else if (col === "plug_power_notify") {
      await sql`UPDATE push_subscriptions SET plug_power_notify = ${val}, updated_at = NOW() WHERE user_id = ${user.id}`;
    }
  }
  const [row] = await sql`
    SELECT COALESCE(BOOL_OR(ac_power_notify), false) AS ac_power_notify,
           COALESCE(BOOL_OR(washer_cycle_notify), false) AS washer_cycle_notify,
           COALESCE(BOOL_OR(plug_power_notify), false) AS plug_power_notify
    FROM push_subscriptions WHERE user_id = ${user.id}
  `;
  return c.json({
    ok: true,
    acPowerNotify: row?.ac_power_notify === true,
    washerCycleNotify: row?.washer_cycle_notify === true,
    plugPowerNotify: row?.plug_power_notify === true
  });
});
app.get("/api/action-log", authMiddleware, async (c) => {
  const user = c.get("user");
  const sql = getDb(c);
  const [membership] = await sql`
    SELECT household_id FROM household_members WHERE user_id = ${user.id}
  `;
  if (!membership) return c.json({ entries: [] });
  const rawKey = getFinanceDataKey(c);
  const rows = await sql`
    SELECT al.id, al.actor_id, al.at, al.operation, al.resource_type, al.resource_id,
           al.before, al.after, al.undone_at, al.undone_by, al.undoes_entry_id,
           u.name AS actor_name, u.email AS actor_email,
           u2.name AS undone_by_name
    FROM action_log al
    LEFT JOIN users u ON u.id = al.actor_id
    LEFT JOIN users u2 ON u2.id = al.undone_by
    WHERE al.household_id = ${membership.household_id}
    ORDER BY al.at DESC, al.id DESC
    LIMIT 20
  `;
  const parseSnapshot = /* @__PURE__ */ __name((raw2) => {
    if (raw2 == null) return {};
    if (typeof raw2 === "object") return raw2;
    if (typeof raw2 === "string") {
      try {
        return JSON.parse(raw2);
      } catch {
        return {};
      }
    }
    return {};
  }, "parseSnapshot");
  const entries = [];
  for (const r of rows) {
    const snapshotForLabel = parseSnapshot(r.after ?? r.before);
    let label = null;
    if (snapshotForLabel.name) {
      try {
        label = await decryptField(snapshotForLabel.name, rawKey);
      } catch {
        label = null;
      }
    }
    let amount = null;
    if (snapshotForLabel.amount != null) {
      try {
        amount = Number(await decryptField(snapshotForLabel.amount, rawKey));
      } catch {
        amount = null;
      }
    }
    if (amount == null && snapshotForLabel.monthly_limit != null) {
      try {
        amount = Number(
          await decryptField(snapshotForLabel.monthly_limit, rawKey)
        );
      } catch {
        amount = null;
      }
    }
    const txnKind = r.resource_type === "transaction" && snapshotForLabel.kind ? String(snapshotForLabel.kind) : null;
    const monthRaw = snapshotForLabel.month;
    const monthNum = monthRaw != null && monthRaw !== "" ? Number(monthRaw) : NaN;
    const month = r.resource_type === "transaction" && Number.isInteger(monthNum) && monthNum >= 0 && monthNum <= 11 ? monthNum : null;
    entries.push({
      id: r.id,
      at: r.at instanceof Date ? r.at.toISOString() : String(r.at),
      operation: r.operation,
      resourceType: r.resource_type,
      resourceId: r.resource_id,
      actorId: r.actor_id,
      actorName: r.actor_name ?? r.actor_email ?? null,
      undoneAt: r.undone_at == null ? null : r.undone_at instanceof Date ? r.undone_at.toISOString() : String(r.undone_at),
      undoneBy: r.undone_by ?? null,
      undoneByName: r.undone_by_name ?? null,
      undoesEntryId: r.undoes_entry_id ?? null,
      label,
      amount,
      txnKind,
      month
    });
  }
  return c.json({ entries });
});
app.post("/api/action-log/:id/undo", authMiddleware, async (c) => {
  const user = c.get("user");
  const sql = getDb(c);
  const id = c.req.param("id");
  const [entry] = await sql`
    SELECT al.*, h.owner_id
    FROM action_log al
    JOIN households h ON h.id = al.household_id
    WHERE al.id = ${id}
  `;
  if (!entry) return c.json({ error: "not found" }, 404);
  const [membership] = await sql`
    SELECT 1 FROM household_members WHERE household_id = ${entry.household_id} AND user_id = ${user.id}
  `;
  if (!membership) return c.json({ error: "forbidden" }, 403);
  const isOwner = entry.owner_id === user.id;
  const isOwnEntry = entry.actor_id === user.id;
  if (!isOwner && !isOwnEntry) {
    return c.json({ error: "forbidden" }, 403);
  }
  if (entry.undone_at != null) {
    return c.json({
      ok: true,
      alreadyUndone: true,
      notice: "Akcja by\u0142a ju\u017C cofni\u0119ta"
    });
  }
  if (entry.operation === "UNDO") {
    return c.json({ error: "Cannot undo an undo entry" }, 400);
  }
  const entryAtMs = entry.at instanceof Date ? entry.at.getTime() : new Date(entry.at).getTime();
  if (Number.isFinite(entryAtMs) && Date.now() - entryAtMs > UNDO_WINDOW_MS) {
    return c.json(
      { error: "undo_window_expired", notice: "Okno cofania (24h) wygas\u0142o" },
      400
    );
  }
  const before = entry.before;
  const after = entry.after;
  const rt = entry.resource_type;
  const op = entry.operation;
  const resourceId = entry.resource_id;
  let notice = null;
  try {
    if (op === "CREATE") {
      const deleted = await applyCreateRevert(
        sql,
        rt,
        entry.household_id,
        resourceId
      );
      if (!deleted)
        notice = "Zas\xF3b ju\u017C nie istnia\u0142 \u2014 wpis oznaczony jako cofni\u0119ty.";
    } else if (op === "UPDATE") {
      if (!before)
        return c.json(
          { error: "Cannot undo UPDATE without 'before' snapshot" },
          500
        );
      await applyUpdateRevert(sql, rt, entry.household_id, resourceId, before);
    } else if (op === "DELETE") {
      if (!before)
        return c.json(
          { error: "Cannot undo DELETE without 'before' snapshot" },
          500
        );
      await applyDeleteRevert(sql, rt, entry.household_id, before);
    } else {
      return c.json({ error: `Unsupported operation: ${op}` }, 400);
    }
  } catch (err) {
    console.error("[undo] reverse op failed", err);
    return c.json({ error: "Undo failed", detail: err.message }, 500);
  }
  await sql`
    UPDATE action_log SET undone_at = NOW(), undone_by = ${user.id} WHERE id = ${id}
  `;
  await safeLogAction(sql, {
    householdId: entry.household_id,
    actorId: user.id,
    operation: "UNDO",
    resourceType: rt,
    resourceId,
    before: after,
    after: before,
    undoesEntryId: id
  });
  return c.json({ ok: true, ...notice ? { notice } : {} });
});
async function applyCreateRevert(sql, rt, householdId, resourceId) {
  if (rt === "savings_goal") {
    await sql`DELETE FROM savings_goals WHERE household_id = ${householdId}`;
    return true;
  }
  if (rt === "transaction") {
    const [exists] = await sql`SELECT 1 FROM transactions WHERE id = ${resourceId}`;
    if (!exists) return false;
    await sql`DELETE FROM transactions WHERE id = ${resourceId}`;
    return true;
  }
  if (rt === "savings_account") {
    const [exists] = await sql`SELECT 1 FROM savings_accounts WHERE id = ${resourceId}`;
    if (!exists) return false;
    await sql`DELETE FROM savings_accounts WHERE id = ${resourceId}`;
    return true;
  }
  if (rt === "category_budget") {
    const [exists] = await sql`SELECT 1 FROM category_budgets WHERE id = ${resourceId}`;
    if (!exists) return false;
    await sql`DELETE FROM category_budgets WHERE id = ${resourceId}`;
    return true;
  }
  throw new Error(`CREATE revert not implemented for ${rt}`);
}
__name(applyCreateRevert, "applyCreateRevert");
async function applyUpdateRevert(sql, rt, householdId, resourceId, before) {
  if (rt === "transaction") {
    const [exists] = await sql`SELECT 1 FROM transactions WHERE id = ${resourceId}`;
    if (!exists) return;
    await sql`
      UPDATE transactions
      SET kind = ${before.kind},
          name = ${before.name},
          amount = ${before.amount},
          txn_date = ${before.txn_date},
          year = ${before.year},
          month = ${before.month},
          is_fixed = ${before.is_fixed},
          category = ${before.category ?? null},
          updated_at = NOW()
      WHERE id = ${resourceId}
    `;
  } else if (rt === "savings_account") {
    const [exists] = await sql`SELECT 1 FROM savings_accounts WHERE id = ${resourceId}`;
    if (!exists) return;
    await sql`
      UPDATE savings_accounts
      SET name = ${before.name}, amount = ${before.amount}, icon = ${before.icon ?? null}, updated_at = NOW()
      WHERE id = ${resourceId}
    `;
  } else if (rt === "category_budget") {
    const [exists] = await sql`SELECT 1 FROM category_budgets WHERE id = ${resourceId}`;
    if (!exists) return;
    await sql`
      UPDATE category_budgets
      SET name = ${before.name}, monthly_limit = ${before.monthly_limit}, updated_at = NOW()
      WHERE id = ${resourceId}
    `;
  } else if (rt === "savings_goal") {
    await sql`
      INSERT INTO savings_goals (household_id, type, monthly_amount, yearly_amount, target_month, updated_at)
      VALUES (${householdId}, ${before.type}, ${before.monthly_amount}, ${before.yearly_amount}, ${before.target_month}, NOW())
      ON CONFLICT (household_id) DO UPDATE SET
        type = EXCLUDED.type, monthly_amount = EXCLUDED.monthly_amount,
        yearly_amount = EXCLUDED.yearly_amount, target_month = EXCLUDED.target_month,
        updated_at = NOW()
    `;
  } else {
    throw new Error(`UPDATE revert not implemented for ${rt}`);
  }
}
__name(applyUpdateRevert, "applyUpdateRevert");
async function applyDeleteRevert(sql, rt, householdId, before) {
  if (rt === "transaction") {
    const [exists] = await sql`SELECT 1 FROM transactions WHERE id = ${before.id}`;
    if (!exists) {
      await sql`
        INSERT INTO transactions (id, household_id, kind, name, amount, txn_date, year, month, is_fixed, category, created_by)
        VALUES (${before.id}, ${householdId}, ${before.kind}, ${before.name}, ${before.amount}, ${before.txn_date},
                ${before.year}, ${before.month}, ${before.is_fixed}, ${before.category ?? null}, ${before.created_by ?? null})
      `;
    } else {
      await sql`
        INSERT INTO transactions (household_id, kind, name, amount, txn_date, year, month, is_fixed, category, created_by)
        VALUES (${householdId}, ${before.kind}, ${before.name}, ${before.amount}, ${before.txn_date},
                ${before.year}, ${before.month}, ${before.is_fixed}, ${before.category ?? null}, ${before.created_by ?? null})
      `;
    }
  } else if (rt === "savings_account") {
    const [exists] = await sql`SELECT 1 FROM savings_accounts WHERE id = ${before.id}`;
    if (!exists) {
      await sql`INSERT INTO savings_accounts (id, household_id, name, amount, icon) VALUES (${before.id}, ${householdId}, ${before.name}, ${before.amount}, ${before.icon ?? null})`;
    } else {
      await sql`INSERT INTO savings_accounts (household_id, name, amount, icon) VALUES (${householdId}, ${before.name}, ${before.amount}, ${before.icon ?? null})`;
    }
  } else if (rt === "category_budget") {
    const [exists] = await sql`SELECT 1 FROM category_budgets WHERE id = ${before.id}`;
    if (!exists) {
      await sql`INSERT INTO category_budgets (id, household_id, name, monthly_limit) VALUES (${before.id}, ${householdId}, ${before.name}, ${before.monthly_limit})`;
    } else {
      await sql`INSERT INTO category_budgets (household_id, name, monthly_limit) VALUES (${householdId}, ${before.name}, ${before.monthly_limit})`;
    }
  } else if (rt === "savings_goal") {
    await sql`
      INSERT INTO savings_goals (household_id, type, monthly_amount, yearly_amount, target_month)
      VALUES (${householdId}, ${before.type}, ${before.monthly_amount}, ${before.yearly_amount}, ${before.target_month})
      ON CONFLICT (household_id) DO UPDATE SET
        type = EXCLUDED.type, monthly_amount = EXCLUDED.monthly_amount,
        yearly_amount = EXCLUDED.yearly_amount, target_month = EXCLUDED.target_month, updated_at = NOW()
    `;
  } else {
    throw new Error(`DELETE revert not implemented for ${rt}`);
  }
}
__name(applyDeleteRevert, "applyDeleteRevert");
app.get("/api/household", authMiddleware, async (c) => {
  const user = c.get("user");
  const sql = getDb(c);
  const [membership] = await sql`
    SELECT household_id FROM household_members WHERE user_id = ${user.id}
  `;
  if (!membership) {
    return c.json({ error: "No household" }, 400);
  }
  const [household] = await sql`
    SELECT id, name, owner_id, created_at FROM households WHERE id = ${membership.household_id}
  `;
  const members = await sql`
    SELECT u.id, u.email, u.name, u.avatar_url, hm.joined_at
    FROM household_members hm
    JOIN users u ON u.id = hm.user_id
    WHERE hm.household_id = ${household.id}
    ORDER BY hm.joined_at
  `;
  const pendingInvitations = await sql`
    SELECT id, email, created_at FROM invitations
    WHERE household_id = ${household.id} AND status = 'pending'
  `;
  return c.json({
    household,
    members,
    pendingInvitations,
    isOwner: household.owner_id === user.id
  });
});
app.patch("/api/household", authMiddleware, async (c) => {
  const user = c.get("user");
  const { name } = await c.req.json();
  const sql = getDb(c);
  if (!name || !name.trim()) {
    return c.json({ error: "Nazwa jest wymagana" }, 400);
  }
  const [membership] = await sql`
    SELECT household_id FROM household_members WHERE user_id = ${user.id}
  `;
  if (!membership) return c.json({ error: "No household" }, 400);
  const [household] = await sql`
    SELECT owner_id FROM households WHERE id = ${membership.household_id}
  `;
  if (household.owner_id !== user.id) {
    return c.json({ error: "Tylko w\u0142a\u015Bciciel mo\u017Ce zmieni\u0107 nazw\u0119" }, 403);
  }
  await sql`
    UPDATE households SET name = ${name.trim()} WHERE id = ${membership.household_id}
  `;
  return c.json({ ok: true });
});
app.post("/api/household/invite", authMiddleware, async (c) => {
  const user = c.get("user");
  const { email } = await c.req.json();
  const sql = getDb(c);
  const [household] = await sql`
    SELECT h.id FROM households h
    JOIN household_members hm ON hm.household_id = h.id
    WHERE hm.user_id = ${user.id} AND h.owner_id = ${user.id}
  `;
  if (!household) {
    return c.json({ error: "Only owner can invite" }, 403);
  }
  const token = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1e3);
  const [invitation] = await sql`
    INSERT INTO invitations (household_id, email, invited_by, token, expires_at)
    VALUES (${household.id}, ${email}, ${user.id}, ${token}, ${expiresAt.toISOString()})
    RETURNING id, email, token, expires_at, created_at
  `;
  const resendKey = getEnv(c, "RESEND_API_KEY");
  const frontendUrl = getEnv(c, "FRONTEND_URL") || "http://localhost:5173";
  const inviteLink = `${frontendUrl}?invite=${token}`;
  if (resendKey) {
    try {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          from: "HomeCashflow <noreply@homecashflow.org>",
          to: [email],
          subject: `${user.name || user.email} zaprasza Ci\u0119 do wsp\xF3lnego gospodarstwa`,
          html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin: 0; padding: 0; background-color: #0f172a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0f172a; padding: 40px 20px;">
    <tr><td align="center">
      <table width="500" cellpadding="0" cellspacing="0" style="max-width: 500px; width: 100%;">
        <!-- Logo -->
        <tr><td align="center" style="padding-bottom: 32px;">
          <table cellpadding="0" cellspacing="0"><tr>
            <td style="background: linear-gradient(135deg, #6366f1, #9333ea); padding: 12px; border-radius: 16px;">
              <span style="font-size: 24px; color: white;">\u26A1</span>
            </td>
            <td style="padding-left: 12px;">
              <span style="font-size: 22px; font-weight: bold; color: white;">HomeCashflow</span>
            </td>
          </tr></table>
        </td></tr>
        <!-- Card -->
        <tr><td style="background-color: #1e293b; border: 1px solid #334155; border-radius: 16px; padding: 40px 32px;">
          <h1 style="margin: 0 0 8px; font-size: 24px; color: white; text-align: center;">Zaproszenie do gospodarstwa</h1>
          <p style="margin: 0 0 24px; color: #94a3b8; text-align: center; font-size: 15px;">Wsp\xF3lne zarz\u0105dzanie bud\u017Cetem domowym</p>
          <div style="background-color: #0f172a; border: 1px solid #334155; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
            <p style="margin: 0 0 4px; color: #94a3b8; font-size: 13px;">Zaprasza:</p>
            <p style="margin: 0; color: white; font-size: 16px; font-weight: 600;">${user.name || user.email}</p>
          </div>
          <p style="color: #cbd5e1; font-size: 15px; line-height: 1.6; margin: 0 0 28px;">
            Zosta\u0142e\u015B zaproszony do wsp\xF3lnego gospodarstwa domowego. Do\u0142\u0105cz, aby razem \u015Bledzi\u0107 przychody, wydatki i oszcz\u0119dno\u015Bci.
          </p>
          <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
            <a href="${inviteLink}" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; text-decoration: none; border-radius: 12px; font-weight: 600; font-size: 16px;">Do\u0142\u0105cz do gospodarstwa</a>
          </td></tr></table>
          <div style="margin-top: 28px; padding-top: 20px; border-top: 1px solid #334155;">
            <p style="margin: 0 0 8px; color: #64748b; font-size: 13px;">\u26A0\uFE0F Zaloguj si\u0119 kontem Google z adresem:</p>
            <p style="margin: 0; color: #818cf8; font-size: 14px; font-weight: 500;">${email}</p>
            <p style="margin: 8px 0 0; color: #475569; font-size: 12px;">Link wa\u017Cny 7 dni</p>
          </div>
        </td></tr>
        <!-- Footer -->
        <tr><td style="padding-top: 24px; text-align: center;">
          <p style="margin: 0; color: #475569; font-size: 12px;">HomeCashflow \u2014 zarz\u0105dzaj finansami inteligentnie</p>
          <p style="margin: 4px 0 0; color: #334155; font-size: 11px;">Ten email zosta\u0142 wys\u0142any automatycznie. Nie odpowiadaj na niego.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>
          `
        })
      });
    } catch (err) {
      console.error("Resend error:", err);
    }
  }
  return c.json({ invitation });
});
app.post("/api/household/invite/:token/accept", authMiddleware, async (c) => {
  const user = c.get("user");
  const inviteToken = c.req.param("token");
  const sql = getDb(c);
  const [invitation] = await sql`
    SELECT * FROM invitations
    WHERE token = ${inviteToken} AND status = 'pending' AND expires_at > NOW()
  `;
  if (!invitation) {
    return c.json({ error: "Invalid or expired invitation" }, 404);
  }
  if (invitation.email !== user.email) {
    return c.json({ error: "Email does not match invitation" }, 403);
  }
  const [currentMembership] = await sql`
    SELECT household_id FROM household_members WHERE user_id = ${user.id}
  `;
  if (currentMembership) {
    const [currentHousehold] = await sql`
      SELECT id, owner_id FROM households WHERE id = ${currentMembership.household_id}
    `;
    if (currentHousehold && currentHousehold.owner_id === user.id) {
      const memberCount = await sql`
        SELECT count(*) as cnt FROM household_members WHERE household_id = ${currentHousehold.id}
      `;
      if (parseInt(memberCount[0].cnt) === 1) {
        await sql`DELETE FROM finance_data WHERE household_id = ${currentHousehold.id}`;
        await sql`DELETE FROM household_members WHERE household_id = ${currentHousehold.id}`;
        await sql`DELETE FROM households WHERE id = ${currentHousehold.id}`;
      }
    } else {
      await sql`DELETE FROM household_members WHERE user_id = ${user.id} AND household_id = ${currentMembership.household_id}`;
    }
  }
  await sql`
    INSERT INTO household_members (household_id, user_id)
    VALUES (${invitation.household_id}, ${user.id})
    ON CONFLICT DO NOTHING
  `;
  await sql`
    UPDATE invitations SET status = 'accepted' WHERE id = ${invitation.id}
  `;
  return c.json({ ok: true });
});
async function createFreshHousehold(sql, userId) {
  const [household] = await sql`
    INSERT INTO households (owner_id) VALUES (${userId}) RETURNING *
  `;
  await sql`
    INSERT INTO household_members (household_id, user_id) VALUES (${household.id}, ${userId})
  `;
  await sql`
    INSERT INTO finance_data (household_id) VALUES (${household.id})
  `;
  return household;
}
__name(createFreshHousehold, "createFreshHousehold");
app.delete("/api/household/members/:userId", authMiddleware, async (c) => {
  const user = c.get("user");
  const targetUserId = c.req.param("userId");
  const sql = getDb(c);
  if (targetUserId === user.id) {
    return c.json({ error: "Cannot remove yourself" }, 400);
  }
  const [household] = await sql`
    SELECT h.id, h.owner_id FROM households h
    JOIN household_members hm ON hm.household_id = h.id
    WHERE hm.user_id = ${user.id} AND h.owner_id = ${user.id}
  `;
  if (!household) {
    return c.json({ error: "Only owner can remove members" }, 403);
  }
  await sql`
    DELETE FROM household_members WHERE user_id = ${targetUserId} AND household_id = ${household.id}
  `;
  await createFreshHousehold(sql, targetUserId);
  return c.json({ ok: true });
});
app.post("/api/household/leave", authMiddleware, async (c) => {
  const user = c.get("user");
  const sql = getDb(c);
  const [membership] = await sql`
    SELECT hm.household_id, h.owner_id FROM household_members hm
    JOIN households h ON h.id = hm.household_id
    WHERE hm.user_id = ${user.id}
  `;
  if (!membership) {
    return c.json({ error: "No household" }, 400);
  }
  if (membership.owner_id === user.id) {
    return c.json({ error: "Owner cannot leave" }, 400);
  }
  await sql`
    DELETE FROM household_members WHERE user_id = ${user.id} AND household_id = ${membership.household_id}
  `;
  await createFreshHousehold(sql, user.id);
  return c.json({ ok: true });
});
app.delete("/api/household", authMiddleware, async (c) => {
  const user = c.get("user");
  const sql = getDb(c);
  const [household] = await sql`
    SELECT h.id, h.owner_id FROM households h
    JOIN household_members hm ON hm.household_id = h.id
    WHERE hm.user_id = ${user.id}
  `;
  if (!household || household.owner_id !== user.id) {
    return c.json({ error: "Only owner can delete household" }, 403);
  }
  const members = await sql`
    SELECT user_id FROM household_members WHERE household_id = ${household.id}
  `;
  await sql`DELETE FROM households WHERE id = ${household.id}`;
  for (const member of members) {
    await createFreshHousehold(sql, member.user_id);
  }
  return c.json({ ok: true });
});

// src/smart-devices-sync.js
var BACKFILL_WINDOW_MS = 24 * 60 * 60 * 1e3;
async function collectEnergySnapshots(sql, rawKey, { householdId, notifyPlugPower } = {}) {
  const devices = householdId ? await sql`
        SELECT sd.id, sd.tuya_device_id, sd.household_id, sd.display_name,
               sd.plug_notify_enabled, sd.power_threshold_w, sd.power_threshold_min_w,
               sd.last_power_above, sd.last_power_below,
               tc.client_id_enc, tc.client_secret_enc, tc.datacenter
        FROM smart_devices sd
        JOIN tuya_credentials tc ON tc.household_id = sd.household_id
        WHERE sd.is_active = true AND COALESCE(sd.device_type, '') NOT LIKE 'ir_%' AND sd.household_id = ${householdId}
      ` : await sql`
        SELECT sd.id, sd.tuya_device_id, sd.household_id, sd.display_name,
               sd.plug_notify_enabled, sd.power_threshold_w, sd.power_threshold_min_w,
               sd.last_power_above, sd.last_power_below,
               tc.client_id_enc, tc.client_secret_enc, tc.datacenter
        FROM smart_devices sd
        JOIN tuya_credentials tc ON tc.household_id = sd.household_id
        WHERE sd.is_active = true AND COALESCE(sd.device_type, '') NOT LIKE 'ir_%'
      `;
  const ctxByHousehold = /* @__PURE__ */ new Map();
  let inserted = 0;
  let events = 0;
  let skipped = 0;
  let powerAlerts = 0;
  for (const d of devices) {
    try {
      let ctx = ctxByHousehold.get(d.household_id);
      if (!ctx) {
        const clientId = await decryptField(d.client_id_enc, rawKey);
        const clientSecret = await decryptField(d.client_secret_enc, rawKey);
        const { accessToken } = await getTuyaToken({ clientId, clientSecret, datacenter: d.datacenter });
        ctx = { clientId, clientSecret, datacenter: d.datacenter, accessToken };
        ctxByHousehold.set(d.household_id, ctx);
      }
      const f = formatProperties(await getDeviceProperties(ctx, d.tuya_device_id));
      await sql`
        INSERT INTO device_energy_snapshots (device_id, power_w, switch_on, is_online)
        VALUES (${d.id}, ${f.powerW ?? null}, ${f.switchOn ?? null}, true)
      `;
      inserted++;
      const thresholdMax = Number(d.power_threshold_w);
      const thresholdMin = Number(d.power_threshold_min_w);
      const powerW = f.powerW != null ? Number(f.powerW) : null;
      if (d.plug_notify_enabled && powerW != null && Number.isFinite(powerW)) {
        let nextAbove = d.last_power_above;
        let nextBelow = d.last_power_below;
        let stateChanged = false;
        if (Number.isFinite(thresholdMax) && thresholdMax > 0) {
          const nowAbove = powerW >= thresholdMax;
          const prevAbove = d.last_power_above === true;
          if (shouldNotifyPowerAbove(prevAbove, nowAbove) && notifyPlugPower) {
            await notifyPlugPower({
              householdId: d.household_id,
              deviceName: d.display_name,
              powerW,
              thresholdW: thresholdMax,
              direction: "above"
            });
            powerAlerts++;
          }
          if (nowAbove !== prevAbove) {
            nextAbove = nowAbove;
            stateChanged = true;
          }
        }
        if (Number.isFinite(thresholdMin) && thresholdMin > 0) {
          const nowBelow = powerW <= thresholdMin;
          const prevBelow = d.last_power_below === true;
          if (shouldNotifyPowerBelow(prevBelow, nowBelow) && notifyPlugPower) {
            await notifyPlugPower({
              householdId: d.household_id,
              deviceName: d.display_name,
              powerW,
              thresholdW: thresholdMin,
              direction: "below"
            });
            powerAlerts++;
          }
          if (nowBelow !== prevBelow) {
            nextBelow = nowBelow;
            stateChanged = true;
          }
        }
        if (stateChanged) {
          await sql`
            UPDATE smart_devices
            SET last_power_above = ${nextAbove}, last_power_below = ${nextBelow}, updated_at = NOW()
            WHERE id = ${d.id}
          `;
        }
      }
      const [last] = await sql`
        SELECT max(energy_reported_at) AS m FROM device_energy_snapshots
        WHERE device_id = ${d.id} AND energy_reported_at IS NOT NULL
      `;
      const startMs = last?.m ? new Date(last.m).getTime() + 1 : Date.now() - BACKFILL_WINDOW_MS;
      const packets = await getAddEleEvents(ctx, d.tuya_device_id, { startMs, endMs: Date.now() });
      for (const p2 of packets) {
        const res = await sql`
          INSERT INTO device_energy_snapshots (device_id, energy_kwh, energy_reported_at)
          VALUES (${d.id}, ${p2.kwh}, ${new Date(p2.eventMs)})
          ON CONFLICT (device_id, energy_reported_at) WHERE energy_reported_at IS NOT NULL DO NOTHING
          RETURNING id
        `;
        events += res.length;
      }
    } catch (err) {
      console.error("[energy-sync] device skipped", d.tuya_device_id, err);
      skipped++;
    }
  }
  return { inserted, events, skipped, powerAlerts };
}
__name(collectEnergySnapshots, "collectEnergySnapshots");

// src/device-timers.js
var IR_PLUG_STANDBY_W2 = 20;
function findPowerKey(keyList) {
  return (keyList ?? []).find((k) => /power/i.test(k.key) || /power/i.test(k.key_name)) || null;
}
__name(findPowerKey, "findPowerKey");
async function fireDueTimers(sql, rawKey, { notifyAcPower } = {}) {
  const due = await sql`
    SELECT t.id, t.device_id, t.household_id,
           sd.tuya_device_id, sd.device_type, sd.ir_parent_id, sd.linked_plug_id,
           sd.display_name,
           plug.tuya_device_id AS plug_tuya_id,
           tc.client_id_enc, tc.client_secret_enc, tc.datacenter
    FROM device_timers t
    JOIN smart_devices sd ON sd.id = t.device_id
    LEFT JOIN smart_devices plug ON plug.id = sd.linked_plug_id
    JOIN tuya_credentials tc ON tc.household_id = t.household_id
    WHERE t.status = 'pending' AND t.fire_at <= NOW()
    ORDER BY t.fire_at ASC
  `;
  const ctxByHousehold = /* @__PURE__ */ new Map();
  let fired = 0;
  let failed = 0;
  for (const d of due) {
    try {
      let ctx = ctxByHousehold.get(d.household_id);
      if (!ctx) {
        const clientId = await decryptField(d.client_id_enc, rawKey);
        const clientSecret = await decryptField(d.client_secret_enc, rawKey);
        const { accessToken } = await getTuyaToken({ clientId, clientSecret, datacenter: d.datacenter });
        ctx = { clientId, clientSecret, datacenter: d.datacenter, accessToken };
        ctxByHousehold.set(d.household_id, ctx);
      }
      if (d.device_type === "ir_ac") {
        await sendAcCommand(ctx, d.ir_parent_id, d.tuya_device_id, "power", 0);
        if (notifyAcPower) {
          try {
            await notifyAcPower({
              householdId: d.household_id,
              action: "off",
              deviceName: d.display_name,
              source: "timer"
            });
          } catch (err) {
            console.warn("[timers] push notify failed", err);
          }
        }
      } else if (d.device_type === "ir_remote") {
        if (d.plug_tuya_id) {
          const f = formatStatuses(await getDeviceStatus(ctx, d.plug_tuya_id));
          if ((f.powerW ?? 0) <= IR_PLUG_STANDBY_W2) {
            await sql`UPDATE device_timers SET status = 'done' WHERE id = ${d.id}`;
            fired++;
            continue;
          }
        }
        const r = await getRemoteKeys(ctx, d.ir_parent_id, d.tuya_device_id);
        const powerKey = findPowerKey(r?.key_list);
        if (!powerKey) throw new Error("no power key on remote");
        await sendRemoteKey(ctx, d.ir_parent_id, d.tuya_device_id, {
          categoryId: r?.category_id ?? null,
          key: powerKey.key,
          keyId: powerKey.key_id ?? null
        });
      } else {
        throw new Error(`unsupported device_type for timer: ${d.device_type}`);
      }
      await sql`UPDATE device_timers SET status = 'done' WHERE id = ${d.id}`;
      fired++;
    } catch (err) {
      console.error("[timers] fire failed", d.tuya_device_id, err);
      await sql`UPDATE device_timers SET status = 'failed' WHERE id = ${d.id}`;
      failed++;
    }
  }
  return { fired, failed };
}
__name(fireDueTimers, "fireDueTimers");

// src/worker.js
var worker_default = {
  fetch: app.fetch,
  // Cron co 5 min: wyłączniki czasowe IR (±5 min — krok suwaka to i tak 30 min).
  // Snapshot zużycia + retencja tylko co 15 min (minuta % 15 == 0).
  async scheduled(event, env, ctx) {
    ctx.waitUntil((async () => {
      const sql = Xs(env.DATABASE_URL);
      const rawKey = decodeFinanceDataKey(env.FINANCE_DATA_KEY);
      const notifyAcPower = /* @__PURE__ */ __name((payload) => notifyHouseholdAcPower(sql, env, payload), "notifyAcPower");
      const notifyCycleComplete = /* @__PURE__ */ __name((payload) => notifyHouseholdCycleComplete(sql, env, payload), "notifyCycleComplete");
      const notifyPlugPower = /* @__PURE__ */ __name((payload) => notifyHouseholdPlugPower(sql, env, payload), "notifyPlugPower");
      try {
        const t = await fireDueTimers(sql, rawKey, { notifyAcPower });
        if (t.fired || t.failed) console.log("[cron] timers", t);
      } catch (err) {
        console.error("[cron] timers failed", err);
      }
      try {
        const c = await pollCycleDevices(sql, rawKey, {
          clientId: env.SMARTTHINGS_CLIENT_ID,
          clientSecret: env.SMARTTHINGS_CLIENT_SECRET,
          notifyCycleComplete
        });
        if (c.checked || c.notified || c.failed) console.log("[cron] cycle devices", c);
      } catch (err) {
        console.error("[cron] cycle devices failed", err);
      }
      if (new Date(event.scheduledTime).getUTCMinutes() % 15 === 0) {
        try {
          const res = await collectEnergySnapshots(sql, rawKey, { notifyPlugPower });
          await sql`DELETE FROM device_energy_snapshots WHERE recorded_at < NOW() - interval '400 days'`;
          console.log("[cron] energy snapshots", res);
        } catch (err) {
          console.error("[cron] energy snapshots failed", err);
        }
      }
      if (new Date(event.scheduledTime).getUTCMinutes() % 30 === 0) {
        try {
          const res = await runAcThermostats(sql, rawKey, {
            readOutdoorTemp: /* @__PURE__ */ __name((coords) => getOutdoorTemp(coords, { apiKey: env.WEATHER_GOOGLE_API_KEY }), "readOutdoorTemp"),
            notifyAcPower
          });
          if (res.checked || res.switched || res.failed) console.log("[cron] ac thermostats", res);
        } catch (err) {
          console.error("[cron] ac thermostats failed", err);
        }
      }
      const st = new Date(event.scheduledTime);
      if (st.getHours() % 12 === 0 && st.getMinutes() < 5) {
        try {
          const res = await refreshExpiringTokens(sql, {
            clientId: env.SMARTTHINGS_CLIENT_ID,
            clientSecret: env.SMARTTHINGS_CLIENT_SECRET,
            rawKey
          });
          if (res.due) console.log("[cron] smartthings tokens", res);
        } catch (err) {
          console.error("[cron] smartthings refresh failed", err);
        }
      }
    })());
  }
};
export {
  worker_default as default
};
/*! Bundled license information:

@neondatabase/serverless/index.mjs:
  (*! Bundled license information:
  
  ieee754/index.js:
    (*! ieee754. BSD-3-Clause License. Feross Aboukhadijeh <https://feross.org/opensource> *)
  
  buffer/index.js:
    (*!
     * The buffer module from node.js, for the browser.
     *
     * @author   Feross Aboukhadijeh <https://feross.org>
     * @license  MIT
     *)
  *)
*/
//# sourceMappingURL=worker.js.map

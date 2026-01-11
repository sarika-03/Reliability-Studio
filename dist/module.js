define(["exports","@grafana/data","react"],function(qe,Ht,P){"use strict";var Me={exports:{}},pe={};/**
 * @license React
 * react-jsx-runtime.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */var et;function Ut(){if(et)return pe;et=1;var e=P,t=Symbol.for("react.element"),n=Symbol.for("react.fragment"),a=Object.prototype.hasOwnProperty,s=e.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentOwner,o={key:!0,ref:!0,__self:!0,__source:!0};function g(f,p,m){var u,h={},E=null,L=null;m!==void 0&&(E=""+m),p.key!==void 0&&(E=""+p.key),p.ref!==void 0&&(L=p.ref);for(u in p)a.call(p,u)&&!o.hasOwnProperty(u)&&(h[u]=p[u]);if(f&&f.defaultProps)for(u in p=f.defaultProps,p)h[u]===void 0&&(h[u]=p[u]);return{$$typeof:t,type:f,key:E,ref:L,props:h,_owner:s.current}}return pe.Fragment=n,pe.jsx=g,pe.jsxs=g,pe}var he={};/**
 * @license React
 * react-jsx-runtime.development.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */var tt;function Jt(){return tt||(tt=1,{}.NODE_ENV!=="production"&&function(){var e=P,t=Symbol.for("react.element"),n=Symbol.for("react.portal"),a=Symbol.for("react.fragment"),s=Symbol.for("react.strict_mode"),o=Symbol.for("react.profiler"),g=Symbol.for("react.provider"),f=Symbol.for("react.context"),p=Symbol.for("react.forward_ref"),m=Symbol.for("react.suspense"),u=Symbol.for("react.suspense_list"),h=Symbol.for("react.memo"),E=Symbol.for("react.lazy"),L=Symbol.for("react.offscreen"),M=Symbol.iterator,T="@@iterator";function B(r){if(r===null||typeof r!="object")return null;var c=M&&r[M]||r[T];return typeof c=="function"?c:null}var b=e.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED;function l(r){{for(var c=arguments.length,d=new Array(c>1?c-1:0),x=1;x<c;x++)d[x-1]=arguments[x];v("error",r,d)}}function v(r,c,d){{var x=b.ReactDebugCurrentFrame,_=x.getStackAddendum();_!==""&&(c+="%s",d=d.concat([_]));var O=d.map(function(C){return String(C)});O.unshift("Warning: "+c),Function.prototype.apply.call(console[r],console,O)}}var F=!1,A=!1,J=!1,$=!1,tn=!1,St;St=Symbol.for("react.module.reference");function rn(r){return!!(typeof r=="string"||typeof r=="function"||r===a||r===o||tn||r===s||r===m||r===u||$||r===L||F||A||J||typeof r=="object"&&r!==null&&(r.$$typeof===E||r.$$typeof===h||r.$$typeof===g||r.$$typeof===f||r.$$typeof===p||r.$$typeof===St||r.getModuleId!==void 0))}function nn(r,c,d){var x=r.displayName;if(x)return x;var _=c.displayName||c.name||"";return _!==""?d+"("+_+")":d}function kt(r){return r.displayName||"Context"}function ne(r){if(r==null)return null;if(typeof r.tag=="number"&&l("Received an unexpected object in getComponentNameFromType(). This is likely a bug in React. Please file an issue."),typeof r=="function")return r.displayName||r.name||null;if(typeof r=="string")return r;switch(r){case a:return"Fragment";case n:return"Portal";case o:return"Profiler";case s:return"StrictMode";case m:return"Suspense";case u:return"SuspenseList"}if(typeof r=="object")switch(r.$$typeof){case f:var c=r;return kt(c)+".Consumer";case g:var d=r;return kt(d._context)+".Provider";case p:return nn(r,r.render,"ForwardRef");case h:var x=r.displayName||null;return x!==null?x:ne(r.type)||"Memo";case E:{var _=r,O=_._payload,C=_._init;try{return ne(C(O))}catch{return null}}}return null}var ie=Object.assign,ye=0,Et,Ct,jt,Rt,Tt,_t,$t;function Ot(){}Ot.__reactDisabledLog=!0;function an(){{if(ye===0){Et=console.log,Ct=console.info,jt=console.warn,Rt=console.error,Tt=console.group,_t=console.groupCollapsed,$t=console.groupEnd;var r={configurable:!0,enumerable:!0,value:Ot,writable:!0};Object.defineProperties(console,{info:r,log:r,warn:r,error:r,group:r,groupCollapsed:r,groupEnd:r})}ye++}}function sn(){{if(ye--,ye===0){var r={configurable:!0,enumerable:!0,writable:!0};Object.defineProperties(console,{log:ie({},r,{value:Et}),info:ie({},r,{value:Ct}),warn:ie({},r,{value:jt}),error:ie({},r,{value:Rt}),group:ie({},r,{value:Tt}),groupCollapsed:ie({},r,{value:_t}),groupEnd:ie({},r,{value:$t})})}ye<0&&l("disabledDepth fell below zero. This is a bug in React. Please file an issue.")}}var Ge=b.ReactCurrentDispatcher,Ve;function Ae(r,c,d){{if(Ve===void 0)try{throw Error()}catch(_){var x=_.stack.trim().match(/\n( *(at )?)/);Ve=x&&x[1]||""}return`
`+Ve+r}}var He=!1,Pe;{var on=typeof WeakMap=="function"?WeakMap:Map;Pe=new on}function At(r,c){if(!r||He)return"";{var d=Pe.get(r);if(d!==void 0)return d}var x;He=!0;var _=Error.prepareStackTrace;Error.prepareStackTrace=void 0;var O;O=Ge.current,Ge.current=null,an();try{if(c){var C=function(){throw Error()};if(Object.defineProperty(C.prototype,"props",{set:function(){throw Error()}}),typeof Reflect=="object"&&Reflect.construct){try{Reflect.construct(C,[])}catch(K){x=K}Reflect.construct(r,[],C)}else{try{C.call()}catch(K){x=K}r.call(C.prototype)}}else{try{throw Error()}catch(K){x=K}r()}}catch(K){if(K&&x&&typeof K.stack=="string"){for(var w=K.stack.split(`
`),H=x.stack.split(`
`),I=w.length-1,z=H.length-1;I>=1&&z>=0&&w[I]!==H[z];)z--;for(;I>=1&&z>=0;I--,z--)if(w[I]!==H[z]){if(I!==1||z!==1)do if(I--,z--,z<0||w[I]!==H[z]){var Z=`
`+w[I].replace(" at new "," at ");return r.displayName&&Z.includes("<anonymous>")&&(Z=Z.replace("<anonymous>",r.displayName)),typeof r=="function"&&Pe.set(r,Z),Z}while(I>=1&&z>=0);break}}}finally{He=!1,Ge.current=O,sn(),Error.prepareStackTrace=_}var fe=r?r.displayName||r.name:"",oe=fe?Ae(fe):"";return typeof r=="function"&&Pe.set(r,oe),oe}function cn(r,c,d){return At(r,!1)}function ln(r){var c=r.prototype;return!!(c&&c.isReactComponent)}function De(r,c,d){if(r==null)return"";if(typeof r=="function")return At(r,ln(r));if(typeof r=="string")return Ae(r);switch(r){case m:return Ae("Suspense");case u:return Ae("SuspenseList")}if(typeof r=="object")switch(r.$$typeof){case p:return cn(r.render);case h:return De(r.type,c,d);case E:{var x=r,_=x._payload,O=x._init;try{return De(O(_),c,d)}catch{}}}return""}var we=Object.prototype.hasOwnProperty,Pt={},Dt=b.ReactDebugCurrentFrame;function Ne(r){if(r){var c=r._owner,d=De(r.type,r._source,c?c.type:null);Dt.setExtraStackFrame(d)}else Dt.setExtraStackFrame(null)}function un(r,c,d,x,_){{var O=Function.call.bind(we);for(var C in r)if(O(r,C)){var w=void 0;try{if(typeof r[C]!="function"){var H=Error((x||"React class")+": "+d+" type `"+C+"` is invalid; it must be a function, usually from the `prop-types` package, but received `"+typeof r[C]+"`.This often happens because of typos such as `PropTypes.function` instead of `PropTypes.func`.");throw H.name="Invariant Violation",H}w=r[C](c,C,x,d,null,"SECRET_DO_NOT_PASS_THIS_OR_YOU_WILL_BE_FIRED")}catch(I){w=I}w&&!(w instanceof Error)&&(Ne(_),l("%s: type specification of %s `%s` is invalid; the type checker function must return `null` or an `Error` but returned a %s. You may have forgotten to pass an argument to the type checker creator (arrayOf, instanceOf, objectOf, oneOf, oneOfType, and shape all require an argument).",x||"React class",d,C,typeof w),Ne(null)),w instanceof Error&&!(w.message in Pt)&&(Pt[w.message]=!0,Ne(_),l("Failed %s type: %s",d,w.message),Ne(null))}}}var dn=Array.isArray;function Ue(r){return dn(r)}function fn(r){{var c=typeof Symbol=="function"&&Symbol.toStringTag,d=c&&r[Symbol.toStringTag]||r.constructor.name||"Object";return d}}function pn(r){try{return Nt(r),!1}catch{return!0}}function Nt(r){return""+r}function Mt(r){if(pn(r))return l("The provided key is an unsupported type %s. This value must be coerced to a string before before using it here.",fn(r)),Nt(r)}var Se=b.ReactCurrentOwner,hn={key:!0,ref:!0,__self:!0,__source:!0},Ft,It,Je;Je={};function gn(r){if(we.call(r,"ref")){var c=Object.getOwnPropertyDescriptor(r,"ref").get;if(c&&c.isReactWarning)return!1}return r.ref!==void 0}function mn(r){if(we.call(r,"key")){var c=Object.getOwnPropertyDescriptor(r,"key").get;if(c&&c.isReactWarning)return!1}return r.key!==void 0}function xn(r,c){if(typeof r.ref=="string"&&Se.current&&c&&Se.current.stateNode!==c){var d=ne(Se.current.type);Je[d]||(l('Component "%s" contains the string ref "%s". Support for string refs will be removed in a future major release. This case cannot be automatically converted to an arrow function. We ask you to manually fix this case by using useRef() or createRef() instead. Learn more about using refs safely here: https://reactjs.org/link/strict-mode-string-ref',ne(Se.current.type),r.ref),Je[d]=!0)}}function bn(r,c){{var d=function(){Ft||(Ft=!0,l("%s: `key` is not a prop. Trying to access it will result in `undefined` being returned. If you need to access the same value within the child component, you should pass it as a different prop. (https://reactjs.org/link/special-props)",c))};d.isReactWarning=!0,Object.defineProperty(r,"key",{get:d,configurable:!0})}}function vn(r,c){{var d=function(){It||(It=!0,l("%s: `ref` is not a prop. Trying to access it will result in `undefined` being returned. If you need to access the same value within the child component, you should pass it as a different prop. (https://reactjs.org/link/special-props)",c))};d.isReactWarning=!0,Object.defineProperty(r,"ref",{get:d,configurable:!0})}}var yn=function(r,c,d,x,_,O,C){var w={$$typeof:t,type:r,key:c,ref:d,props:C,_owner:O};return w._store={},Object.defineProperty(w._store,"validated",{configurable:!1,enumerable:!1,writable:!0,value:!1}),Object.defineProperty(w,"_self",{configurable:!1,enumerable:!1,writable:!1,value:x}),Object.defineProperty(w,"_source",{configurable:!1,enumerable:!1,writable:!1,value:_}),Object.freeze&&(Object.freeze(w.props),Object.freeze(w)),w};function wn(r,c,d,x,_){{var O,C={},w=null,H=null;d!==void 0&&(Mt(d),w=""+d),mn(c)&&(Mt(c.key),w=""+c.key),gn(c)&&(H=c.ref,xn(c,_));for(O in c)we.call(c,O)&&!hn.hasOwnProperty(O)&&(C[O]=c[O]);if(r&&r.defaultProps){var I=r.defaultProps;for(O in I)C[O]===void 0&&(C[O]=I[O])}if(w||H){var z=typeof r=="function"?r.displayName||r.name||"Unknown":r;w&&bn(C,z),H&&vn(C,z)}return yn(r,w,H,_,x,Se.current,C)}}var Ke=b.ReactCurrentOwner,Wt=b.ReactDebugCurrentFrame;function de(r){if(r){var c=r._owner,d=De(r.type,r._source,c?c.type:null);Wt.setExtraStackFrame(d)}else Wt.setExtraStackFrame(null)}var Xe;Xe=!1;function Ze(r){return typeof r=="object"&&r!==null&&r.$$typeof===t}function Lt(){{if(Ke.current){var r=ne(Ke.current.type);if(r)return`

Check the render method of \``+r+"`."}return""}}function Sn(r){{if(r!==void 0){var c=r.fileName.replace(/^.*[\\\/]/,""),d=r.lineNumber;return`

Check your code at `+c+":"+d+"."}return""}}var Bt={};function kn(r){{var c=Lt();if(!c){var d=typeof r=="string"?r:r.displayName||r.name;d&&(c=`

Check the top-level render call using <`+d+">.")}return c}}function zt(r,c){{if(!r._store||r._store.validated||r.key!=null)return;r._store.validated=!0;var d=kn(c);if(Bt[d])return;Bt[d]=!0;var x="";r&&r._owner&&r._owner!==Ke.current&&(x=" It was passed a child from "+ne(r._owner.type)+"."),de(r),l('Each child in a list should have a unique "key" prop.%s%s See https://reactjs.org/link/warning-keys for more information.',d,x),de(null)}}function Yt(r,c){{if(typeof r!="object")return;if(Ue(r))for(var d=0;d<r.length;d++){var x=r[d];Ze(x)&&zt(x,c)}else if(Ze(r))r._store&&(r._store.validated=!0);else if(r){var _=B(r);if(typeof _=="function"&&_!==r.entries)for(var O=_.call(r),C;!(C=O.next()).done;)Ze(C.value)&&zt(C.value,c)}}}function En(r){{var c=r.type;if(c==null||typeof c=="string")return;var d;if(typeof c=="function")d=c.propTypes;else if(typeof c=="object"&&(c.$$typeof===p||c.$$typeof===h))d=c.propTypes;else return;if(d){var x=ne(c);un(d,r.props,"prop",x,r)}else if(c.PropTypes!==void 0&&!Xe){Xe=!0;var _=ne(c);l("Component %s declared `PropTypes` instead of `propTypes`. Did you misspell the property assignment?",_||"Unknown")}typeof c.getDefaultProps=="function"&&!c.getDefaultProps.isReactClassApproved&&l("getDefaultProps is only used on classic React.createClass definitions. Use a static property named `defaultProps` instead.")}}function Cn(r){{for(var c=Object.keys(r.props),d=0;d<c.length;d++){var x=c[d];if(x!=="children"&&x!=="key"){de(r),l("Invalid prop `%s` supplied to `React.Fragment`. React.Fragment can only have `key` and `children` props.",x),de(null);break}}r.ref!==null&&(de(r),l("Invalid attribute `ref` supplied to `React.Fragment`."),de(null))}}var Gt={};function Vt(r,c,d,x,_,O){{var C=rn(r);if(!C){var w="";(r===void 0||typeof r=="object"&&r!==null&&Object.keys(r).length===0)&&(w+=" You likely forgot to export your component from the file it's defined in, or you might have mixed up default and named imports.");var H=Sn(_);H?w+=H:w+=Lt();var I;r===null?I="null":Ue(r)?I="array":r!==void 0&&r.$$typeof===t?(I="<"+(ne(r.type)||"Unknown")+" />",w=" Did you accidentally export a JSX literal instead of a component?"):I=typeof r,l("React.jsx: type is invalid -- expected a string (for built-in components) or a class/function (for composite components) but got: %s.%s",I,w)}var z=wn(r,c,d,_,O);if(z==null)return z;if(C){var Z=c.children;if(Z!==void 0)if(x)if(Ue(Z)){for(var fe=0;fe<Z.length;fe++)Yt(Z[fe],r);Object.freeze&&Object.freeze(Z)}else l("React.jsx: Static children should always be an array. You are likely explicitly calling React.jsxs or React.jsxDEV. Use the Babel transform instead.");else Yt(Z,r)}if(we.call(c,"key")){var oe=ne(r),K=Object.keys(c).filter(function(On){return On!=="key"}),Qe=K.length>0?"{key: someKey, "+K.join(": ..., ")+": ...}":"{key: someKey}";if(!Gt[oe+Qe]){var $n=K.length>0?"{"+K.join(": ..., ")+": ...}":"{}";l(`A props object containing a "key" prop is being spread into JSX:
  let props = %s;
  <%s {...props} />
React keys must be passed directly to JSX without using spread:
  let props = %s;
  <%s key={someKey} {...props} />`,Qe,oe,$n,oe),Gt[oe+Qe]=!0}}return r===a?Cn(z):En(z),z}}function jn(r,c,d){return Vt(r,c,d,!0)}function Rn(r,c,d){return Vt(r,c,d,!1)}var Tn=Rn,_n=jn;he.Fragment=a,he.jsx=Tn,he.jsxs=_n}()),he}({}).NODE_ENV==="production"?Me.exports=Ut():Me.exports=Jt();var i=Me.exports,Kt=!1;function Xt(e){if(e.sheet)return e.sheet;for(var t=0;t<document.styleSheets.length;t++)if(document.styleSheets[t].ownerNode===e)return document.styleSheets[t]}function Zt(e){var t=document.createElement("style");return t.setAttribute("data-emotion",e.key),e.nonce!==void 0&&t.setAttribute("nonce",e.nonce),t.appendChild(document.createTextNode("")),t.setAttribute("data-s",""),t}var Qt=function(){function e(n){var a=this;this._insertTag=function(s){var o;a.tags.length===0?a.insertionPoint?o=a.insertionPoint.nextSibling:a.prepend?o=a.container.firstChild:o=a.before:o=a.tags[a.tags.length-1].nextSibling,a.container.insertBefore(s,o),a.tags.push(s)},this.isSpeedy=n.speedy===void 0?!Kt:n.speedy,this.tags=[],this.ctr=0,this.nonce=n.nonce,this.key=n.key,this.container=n.container,this.prepend=n.prepend,this.insertionPoint=n.insertionPoint,this.before=null}var t=e.prototype;return t.hydrate=function(a){a.forEach(this._insertTag)},t.insert=function(a){this.ctr%(this.isSpeedy?65e3:1)===0&&this._insertTag(Zt(this));var s=this.tags[this.tags.length-1];if(this.isSpeedy){var o=Xt(s);try{o.insertRule(a,o.cssRules.length)}catch{}}else s.appendChild(document.createTextNode(a));this.ctr++},t.flush=function(){this.tags.forEach(function(a){var s;return(s=a.parentNode)==null?void 0:s.removeChild(a)}),this.tags=[],this.ctr=0},e}(),V="-ms-",ke="-moz-",j="-webkit-",rt="comm",Fe="rule",Ie="decl",qt="@import",nt="@keyframes",er="@layer",tr=Math.abs,Ee=String.fromCharCode,rr=Object.assign;function nr(e,t){return Y(e,0)^45?(((t<<2^Y(e,0))<<2^Y(e,1))<<2^Y(e,2))<<2^Y(e,3):0}function at(e){return e.trim()}function ar(e,t){return(e=t.exec(e))?e[0]:e}function R(e,t,n){return e.replace(t,n)}function We(e,t){return e.indexOf(t)}function Y(e,t){return e.charCodeAt(t)|0}function ge(e,t,n){return e.slice(t,n)}function ee(e){return e.length}function Le(e){return e.length}function Ce(e,t){return t.push(e),e}function sr(e,t){return e.map(t).join("")}var je=1,ce=1,st=0,U=0,W=0,le="";function Re(e,t,n,a,s,o,g){return{value:e,root:t,parent:n,type:a,props:s,children:o,line:je,column:ce,length:g,return:""}}function me(e,t){return rr(Re("",null,null,"",null,null,0),e,{length:-e.length},t)}function ir(){return W}function or(){return W=U>0?Y(le,--U):0,ce--,W===10&&(ce=1,je--),W}function X(){return W=U<st?Y(le,U++):0,ce++,W===10&&(ce=1,je++),W}function te(){return Y(le,U)}function Te(){return U}function xe(e,t){return ge(le,e,t)}function be(e){switch(e){case 0:case 9:case 10:case 13:case 32:return 5;case 33:case 43:case 44:case 47:case 62:case 64:case 126:case 59:case 123:case 125:return 4;case 58:return 3;case 34:case 39:case 40:case 91:return 2;case 41:case 93:return 1}return 0}function it(e){return je=ce=1,st=ee(le=e),U=0,[]}function ot(e){return le="",e}function _e(e){return at(xe(U-1,Be(e===91?e+2:e===40?e+1:e)))}function cr(e){for(;(W=te())&&W<33;)X();return be(e)>2||be(W)>3?"":" "}function lr(e,t){for(;--t&&X()&&!(W<48||W>102||W>57&&W<65||W>70&&W<97););return xe(e,Te()+(t<6&&te()==32&&X()==32))}function Be(e){for(;X();)switch(W){case e:return U;case 34:case 39:e!==34&&e!==39&&Be(W);break;case 40:e===41&&Be(e);break;case 92:X();break}return U}function ur(e,t){for(;X()&&e+W!==47+10;)if(e+W===42+42&&te()===47)break;return"/*"+xe(t,U-1)+"*"+Ee(e===47?e:X())}function dr(e){for(;!be(te());)X();return xe(e,U)}function fr(e){return ot($e("",null,null,null,[""],e=it(e),0,[0],e))}function $e(e,t,n,a,s,o,g,f,p){for(var m=0,u=0,h=g,E=0,L=0,M=0,T=1,B=1,b=1,l=0,v="",F=s,A=o,J=a,$=v;B;)switch(M=l,l=X()){case 40:if(M!=108&&Y($,h-1)==58){We($+=R(_e(l),"&","&\f"),"&\f")!=-1&&(b=-1);break}case 34:case 39:case 91:$+=_e(l);break;case 9:case 10:case 13:case 32:$+=cr(M);break;case 92:$+=lr(Te()-1,7);continue;case 47:switch(te()){case 42:case 47:Ce(pr(ur(X(),Te()),t,n),p);break;default:$+="/"}break;case 123*T:f[m++]=ee($)*b;case 125*T:case 59:case 0:switch(l){case 0:case 125:B=0;case 59+u:b==-1&&($=R($,/\f/g,"")),L>0&&ee($)-h&&Ce(L>32?lt($+";",a,n,h-1):lt(R($," ","")+";",a,n,h-2),p);break;case 59:$+=";";default:if(Ce(J=ct($,t,n,m,u,s,f,v,F=[],A=[],h),o),l===123)if(u===0)$e($,t,J,J,F,o,h,f,A);else switch(E===99&&Y($,3)===110?100:E){case 100:case 108:case 109:case 115:$e(e,J,J,a&&Ce(ct(e,J,J,0,0,s,f,v,s,F=[],h),A),s,A,h,f,a?F:A);break;default:$e($,J,J,J,[""],A,0,f,A)}}m=u=L=0,T=b=1,v=$="",h=g;break;case 58:h=1+ee($),L=M;default:if(T<1){if(l==123)--T;else if(l==125&&T++==0&&or()==125)continue}switch($+=Ee(l),l*T){case 38:b=u>0?1:($+="\f",-1);break;case 44:f[m++]=(ee($)-1)*b,b=1;break;case 64:te()===45&&($+=_e(X())),E=te(),u=h=ee(v=$+=dr(Te())),l++;break;case 45:M===45&&ee($)==2&&(T=0)}}return o}function ct(e,t,n,a,s,o,g,f,p,m,u){for(var h=s-1,E=s===0?o:[""],L=Le(E),M=0,T=0,B=0;M<a;++M)for(var b=0,l=ge(e,h+1,h=tr(T=g[M])),v=e;b<L;++b)(v=at(T>0?E[b]+" "+l:R(l,/&\f/g,E[b])))&&(p[B++]=v);return Re(e,t,n,s===0?Fe:f,p,m,u)}function pr(e,t,n){return Re(e,t,n,rt,Ee(ir()),ge(e,2,-2),0)}function lt(e,t,n,a){return Re(e,t,n,Ie,ge(e,0,a),ge(e,a+1,-1),a)}function ue(e,t){for(var n="",a=Le(e),s=0;s<a;s++)n+=t(e[s],s,e,t)||"";return n}function hr(e,t,n,a){switch(e.type){case er:if(e.children.length)break;case qt:case Ie:return e.return=e.return||e.value;case rt:return"";case nt:return e.return=e.value+"{"+ue(e.children,a)+"}";case Fe:e.value=e.props.join(",")}return ee(n=ue(e.children,a))?e.return=e.value+"{"+n+"}":""}function gr(e){var t=Le(e);return function(n,a,s,o){for(var g="",f=0;f<t;f++)g+=e[f](n,a,s,o)||"";return g}}function mr(e){return function(t){t.root||(t=t.return)&&e(t)}}function xr(e){var t=Object.create(null);return function(n){return t[n]===void 0&&(t[n]=e(n)),t[n]}}var br=function(t,n,a){for(var s=0,o=0;s=o,o=te(),s===38&&o===12&&(n[a]=1),!be(o);)X();return xe(t,U)},vr=function(t,n){var a=-1,s=44;do switch(be(s)){case 0:s===38&&te()===12&&(n[a]=1),t[a]+=br(U-1,n,a);break;case 2:t[a]+=_e(s);break;case 4:if(s===44){t[++a]=te()===58?"&\f":"",n[a]=t[a].length;break}default:t[a]+=Ee(s)}while(s=X());return t},yr=function(t,n){return ot(vr(it(t),n))},ut=new WeakMap,wr=function(t){if(!(t.type!=="rule"||!t.parent||t.length<1)){for(var n=t.value,a=t.parent,s=t.column===a.column&&t.line===a.line;a.type!=="rule";)if(a=a.parent,!a)return;if(!(t.props.length===1&&n.charCodeAt(0)!==58&&!ut.get(a))&&!s){ut.set(t,!0);for(var o=[],g=yr(n,o),f=a.props,p=0,m=0;p<g.length;p++)for(var u=0;u<f.length;u++,m++)t.props[m]=o[p]?g[p].replace(/&\f/g,f[u]):f[u]+" "+g[p]}}},Sr=function(t){if(t.type==="decl"){var n=t.value;n.charCodeAt(0)===108&&n.charCodeAt(2)===98&&(t.return="",t.value="")}};function dt(e,t){switch(nr(e,t)){case 5103:return j+"print-"+e+e;case 5737:case 4201:case 3177:case 3433:case 1641:case 4457:case 2921:case 5572:case 6356:case 5844:case 3191:case 6645:case 3005:case 6391:case 5879:case 5623:case 6135:case 4599:case 4855:case 4215:case 6389:case 5109:case 5365:case 5621:case 3829:return j+e+e;case 5349:case 4246:case 4810:case 6968:case 2756:return j+e+ke+e+V+e+e;case 6828:case 4268:return j+e+V+e+e;case 6165:return j+e+V+"flex-"+e+e;case 5187:return j+e+R(e,/(\w+).+(:[^]+)/,j+"box-$1$2"+V+"flex-$1$2")+e;case 5443:return j+e+V+"flex-item-"+R(e,/flex-|-self/,"")+e;case 4675:return j+e+V+"flex-line-pack"+R(e,/align-content|flex-|-self/,"")+e;case 5548:return j+e+V+R(e,"shrink","negative")+e;case 5292:return j+e+V+R(e,"basis","preferred-size")+e;case 6060:return j+"box-"+R(e,"-grow","")+j+e+V+R(e,"grow","positive")+e;case 4554:return j+R(e,/([^-])(transform)/g,"$1"+j+"$2")+e;case 6187:return R(R(R(e,/(zoom-|grab)/,j+"$1"),/(image-set)/,j+"$1"),e,"")+e;case 5495:case 3959:return R(e,/(image-set\([^]*)/,j+"$1$`$1");case 4968:return R(R(e,/(.+:)(flex-)?(.*)/,j+"box-pack:$3"+V+"flex-pack:$3"),/s.+-b[^;]+/,"justify")+j+e+e;case 4095:case 3583:case 4068:case 2532:return R(e,/(.+)-inline(.+)/,j+"$1$2")+e;case 8116:case 7059:case 5753:case 5535:case 5445:case 5701:case 4933:case 4677:case 5533:case 5789:case 5021:case 4765:if(ee(e)-1-t>6)switch(Y(e,t+1)){case 109:if(Y(e,t+4)!==45)break;case 102:return R(e,/(.+:)(.+)-([^]+)/,"$1"+j+"$2-$3$1"+ke+(Y(e,t+3)==108?"$3":"$2-$3"))+e;case 115:return~We(e,"stretch")?dt(R(e,"stretch","fill-available"),t)+e:e}break;case 4949:if(Y(e,t+1)!==115)break;case 6444:switch(Y(e,ee(e)-3-(~We(e,"!important")&&10))){case 107:return R(e,":",":"+j)+e;case 101:return R(e,/(.+:)([^;!]+)(;|!.+)?/,"$1"+j+(Y(e,14)===45?"inline-":"")+"box$3$1"+j+"$2$3$1"+V+"$2box$3")+e}break;case 5936:switch(Y(e,t+11)){case 114:return j+e+V+R(e,/[svh]\w+-[tblr]{2}/,"tb")+e;case 108:return j+e+V+R(e,/[svh]\w+-[tblr]{2}/,"tb-rl")+e;case 45:return j+e+V+R(e,/[svh]\w+-[tblr]{2}/,"lr")+e}return j+e+V+e+e}return e}var kr=function(t,n,a,s){if(t.length>-1&&!t.return)switch(t.type){case Ie:t.return=dt(t.value,t.length);break;case nt:return ue([me(t,{value:R(t.value,"@","@"+j)})],s);case Fe:if(t.length)return sr(t.props,function(o){switch(ar(o,/(::plac\w+|:read-\w+)/)){case":read-only":case":read-write":return ue([me(t,{props:[R(o,/:(read-\w+)/,":"+ke+"$1")]})],s);case"::placeholder":return ue([me(t,{props:[R(o,/:(plac\w+)/,":"+j+"input-$1")]}),me(t,{props:[R(o,/:(plac\w+)/,":"+ke+"$1")]}),me(t,{props:[R(o,/:(plac\w+)/,V+"input-$1")]})],s)}return""})}},Er=[kr],Cr=function(t){var n=t.key;if(n==="css"){var a=document.querySelectorAll("style[data-emotion]:not([data-s])");Array.prototype.forEach.call(a,function(T){var B=T.getAttribute("data-emotion");B.indexOf(" ")!==-1&&(document.head.appendChild(T),T.setAttribute("data-s",""))})}var s=t.stylisPlugins||Er,o={},g,f=[];g=t.container||document.head,Array.prototype.forEach.call(document.querySelectorAll('style[data-emotion^="'+n+' "]'),function(T){for(var B=T.getAttribute("data-emotion").split(" "),b=1;b<B.length;b++)o[B[b]]=!0;f.push(T)});var p,m=[wr,Sr];{var u,h=[hr,mr(function(T){u.insert(T)})],E=gr(m.concat(s,h)),L=function(B){return ue(fr(B),E)};p=function(B,b,l,v){u=l,L(B?B+"{"+b.styles+"}":b.styles),v&&(M.inserted[b.name]=!0)}}var M={key:n,sheet:new Qt({key:n,container:g,nonce:t.nonce,speedy:t.speedy,prepend:t.prepend,insertionPoint:t.insertionPoint}),nonce:t.nonce,inserted:o,registered:{},insert:p};return M.sheet.hydrate(f),M};function jr(e){for(var t=0,n,a=0,s=e.length;s>=4;++a,s-=4)n=e.charCodeAt(a)&255|(e.charCodeAt(++a)&255)<<8|(e.charCodeAt(++a)&255)<<16|(e.charCodeAt(++a)&255)<<24,n=(n&65535)*1540483477+((n>>>16)*59797<<16),n^=n>>>24,t=(n&65535)*1540483477+((n>>>16)*59797<<16)^(t&65535)*1540483477+((t>>>16)*59797<<16);switch(s){case 3:t^=(e.charCodeAt(a+2)&255)<<16;case 2:t^=(e.charCodeAt(a+1)&255)<<8;case 1:t^=e.charCodeAt(a)&255,t=(t&65535)*1540483477+((t>>>16)*59797<<16)}return t^=t>>>13,t=(t&65535)*1540483477+((t>>>16)*59797<<16),((t^t>>>15)>>>0).toString(36)}var Rr={animationIterationCount:1,aspectRatio:1,borderImageOutset:1,borderImageSlice:1,borderImageWidth:1,boxFlex:1,boxFlexGroup:1,boxOrdinalGroup:1,columnCount:1,columns:1,flex:1,flexGrow:1,flexPositive:1,flexShrink:1,flexNegative:1,flexOrder:1,gridRow:1,gridRowEnd:1,gridRowSpan:1,gridRowStart:1,gridColumn:1,gridColumnEnd:1,gridColumnSpan:1,gridColumnStart:1,msGridRow:1,msGridRowSpan:1,msGridColumn:1,msGridColumnSpan:1,fontWeight:1,lineHeight:1,opacity:1,order:1,orphans:1,scale:1,tabSize:1,widows:1,zIndex:1,zoom:1,WebkitLineClamp:1,fillOpacity:1,floodOpacity:1,stopOpacity:1,strokeDasharray:1,strokeDashoffset:1,strokeMiterlimit:1,strokeOpacity:1,strokeWidth:1},Tr=!1,_r=/[A-Z]|^ms/g,$r=/_EMO_([^_]+?)_([^]*?)_EMO_/g,ft=function(t){return t.charCodeAt(1)===45},pt=function(t){return t!=null&&typeof t!="boolean"},ze=xr(function(e){return ft(e)?e:e.replace(_r,"-$&").toLowerCase()}),ht=function(t,n){switch(t){case"animation":case"animationName":if(typeof n=="string")return n.replace($r,function(a,s,o){return re={name:s,styles:o,next:re},s})}return Rr[t]!==1&&!ft(t)&&typeof n=="number"&&n!==0?n+"px":n},Or="Component selectors can only be used in conjunction with @emotion/babel-plugin, the swc Emotion plugin, or another Emotion-aware compiler transform.";function ve(e,t,n){if(n==null)return"";var a=n;if(a.__emotion_styles!==void 0)return a;switch(typeof n){case"boolean":return"";case"object":{var s=n;if(s.anim===1)return re={name:s.name,styles:s.styles,next:re},s.name;var o=n;if(o.styles!==void 0){var g=o.next;if(g!==void 0)for(;g!==void 0;)re={name:g.name,styles:g.styles,next:re},g=g.next;var f=o.styles+";";return f}return Ar(e,t,n)}case"function":{if(e!==void 0){var p=re,m=n(e);return re=p,ve(e,t,m)}break}}var u=n;if(t==null)return u;var h=t[u];return h!==void 0?h:u}function Ar(e,t,n){var a="";if(Array.isArray(n))for(var s=0;s<n.length;s++)a+=ve(e,t,n[s])+";";else for(var o in n){var g=n[o];if(typeof g!="object"){var f=g;t!=null&&t[f]!==void 0?a+=o+"{"+t[f]+"}":pt(f)&&(a+=ze(o)+":"+ht(o,f)+";")}else{if(o==="NO_COMPONENT_SELECTOR"&&Tr)throw new Error(Or);if(Array.isArray(g)&&typeof g[0]=="string"&&(t==null||t[g[0]]===void 0))for(var p=0;p<g.length;p++)pt(g[p])&&(a+=ze(o)+":"+ht(o,g[p])+";");else{var m=ve(e,t,g);switch(o){case"animation":case"animationName":{a+=ze(o)+":"+m+";";break}default:a+=o+"{"+m+"}"}}}}return a}var gt=/label:\s*([^\s;{]+)\s*(;|$)/g,re;function Ye(e,t,n){if(e.length===1&&typeof e[0]=="object"&&e[0]!==null&&e[0].styles!==void 0)return e[0];var a=!0,s="";re=void 0;var o=e[0];if(o==null||o.raw===void 0)a=!1,s+=ve(n,t,o);else{var g=o;s+=g[0]}for(var f=1;f<e.length;f++)if(s+=ve(n,t,e[f]),a){var p=o;s+=p[f]}gt.lastIndex=0;for(var m="",u;(u=gt.exec(s))!==null;)m+="-"+u[1];var h=jr(s)+m;return{name:h,styles:s,next:re}}var Pr=!0;function mt(e,t,n){var a="";return n.split(" ").forEach(function(s){e[s]!==void 0?t.push(e[s]+";"):s&&(a+=s+" ")}),a}var Dr=function(t,n,a){var s=t.key+"-"+n.name;(a===!1||Pr===!1)&&t.registered[s]===void 0&&(t.registered[s]=n.styles)},Nr=function(t,n,a){Dr(t,n,a);var s=t.key+"-"+n.name;if(t.inserted[n.name]===void 0){var o=n;do t.insert(n===o?"."+s:"",o,t.sheet,!0),o=o.next;while(o!==void 0)}};function xt(e,t){if(e.inserted[t.name]===void 0)return e.insert("",t,e.sheet,!0)}function bt(e,t,n){var a=[],s=mt(e,a,n);return a.length<2?n:s+t(a)}var Mr=function(t){var n=Cr(t);n.sheet.speedy=function(f){this.isSpeedy=f},n.compat=!0;var a=function(){for(var p=arguments.length,m=new Array(p),u=0;u<p;u++)m[u]=arguments[u];var h=Ye(m,n.registered,void 0);return Nr(n,h,!1),n.key+"-"+h.name},s=function(){for(var p=arguments.length,m=new Array(p),u=0;u<p;u++)m[u]=arguments[u];var h=Ye(m,n.registered),E="animation-"+h.name;return xt(n,{name:h.name,styles:"@keyframes "+E+"{"+h.styles+"}"}),E},o=function(){for(var p=arguments.length,m=new Array(p),u=0;u<p;u++)m[u]=arguments[u];var h=Ye(m,n.registered);xt(n,h)},g=function(){for(var p=arguments.length,m=new Array(p),u=0;u<p;u++)m[u]=arguments[u];return bt(n.registered,a,Fr(m))};return{css:a,cx:g,injectGlobal:o,keyframes:s,hydrate:function(p){p.forEach(function(m){n.inserted[m]=!0})},flush:function(){n.registered={},n.inserted={},n.sheet.flush()},sheet:n.sheet,cache:n,getRegisteredStyles:mt.bind(null,n.registered),merge:bt.bind(null,n.registered,a)}},Fr=function e(t){for(var n="",a=0;a<t.length;a++){var s=t[a];if(s!=null){var o=void 0;switch(typeof s){case"boolean":break;case"object":{if(Array.isArray(s))o=e(s);else{o="";for(var g in s)s[g]&&g&&(o&&(o+=" "),o+=g)}break}default:o=s}o&&(n&&(n+=" "),n+=o)}}return n},vt=Mr({key:"css"}),yt=vt.keyframes,S=vt.css;class Ir{constructor(t={}){this.state="closed",this.failureCount=0,this.lastFailureTime=null,this.successCount=0,this.failureThreshold=t.failureThreshold||5,this.timeout=t.timeout||6e4}canExecute(){return this.state==="closed"?!0:this.state==="open"?this.lastFailureTime&&Date.now()-this.lastFailureTime>=this.timeout?(this.state="half-open",this.successCount=0,console.log("[CircuitBreaker] Transitioning to half-open state"),!0):!1:!0}recordSuccess(){this.failureCount=0,this.state==="half-open"&&(this.successCount++,this.successCount>=2&&(this.state="closed",console.log("[CircuitBreaker] Circuit closed - service recovered")))}recordFailure(){if(this.failureCount++,this.lastFailureTime=Date.now(),this.state==="half-open"){this.state="open",console.log("[CircuitBreaker] Half-open failure - reopening circuit");return}this.failureCount>=this.failureThreshold&&this.state==="closed"&&(this.state="open",console.log(`[CircuitBreaker] Failure threshold reached (${this.failureCount}/${this.failureThreshold}) - opening circuit`))}getState(){return this.state}getFailureCount(){return this.failureCount}reset(){this.state="closed",this.failureCount=0,this.successCount=0,this.lastFailureTime=null}}class Wr{constructor(t={}){this.breakers=new Map,this.config=t}getBreaker(t){return this.breakers.has(t)||this.breakers.set(t,new Ir(this.config)),this.breakers.get(t)}canExecute(t){return this.getBreaker(t).canExecute()}recordSuccess(t){this.getBreaker(t).recordSuccess()}recordFailure(t){this.getBreaker(t).recordFailure()}getAllStates(){const t={};return this.breakers.forEach((n,a)=>{t[a]=n.getState()}),t}resetAll(){this.breakers.forEach(t=>{t.reset()})}reset(t){var n;(n=this.breakers.get(t))==null||n.reset()}}const Oe=new Wr({failureThreshold:5,timeout:6e4});function wt(e){if(e instanceof TypeError){const t=e.message.toLowerCase();return t.includes("failed to fetch")||t.includes("network")||t.includes("timeout")||t.includes("connection")||t.includes("refused")}if(e instanceof Error){const t=e.message.toLowerCase();return t.includes("econnrefused")||t.includes("econnreset")||t.includes("etimedout")||t.includes("ehostunreach")||t.includes("enetunreach")}return!1}function Lr(e,t){const n=Math.min(t.initialDelay*Math.pow(t.backoffMultiplier,e),t.maxDelay);if(!t.jitter)return n;const a=Math.random()*(n*.5);return n+a}async function Br(e,t="unknown",n={}){const a={maxAttempts:n.maxAttempts||3,initialDelay:n.initialDelay||1e3,maxDelay:n.maxDelay||32e3,backoffMultiplier:n.backoffMultiplier||2,jitter:n.jitter!==!1},s=Date.now();let o=null;for(let g=0;g<a.maxAttempts;g++){if(!Oe.canExecute(t)){const f=new Error(`Circuit breaker open for ${t}`);return console.warn(`[Retry] ${f.message}`),{data:null,error:f,attempts:g+1,totalDuration:Date.now()-s,success:!1}}try{const f=await e();return Oe.recordSuccess(t),{data:f,error:null,attempts:g+1,totalDuration:Date.now()-s,success:!0}}catch(f){if(o=f instanceof Error?f:new Error(String(f)),!wt(f)||g===a.maxAttempts-1)return Oe.recordFailure(t),console.error(`[Retry] Failed after ${g+1} attempt(s) for ${t}:`,o.message),{data:null,error:o,attempts:g+1,totalDuration:Date.now()-s,success:!1};const m=Lr(g,a);console.warn(`[Retry] Attempt ${g+1} failed for ${t}, retrying in ${Math.round(m)}ms:`,o.message),await new Promise(u=>setTimeout(u,m))}}return Oe.recordFailure(t),{data:null,error:o||new Error("Unknown error"),attempts:a.maxAttempts,totalDuration:Date.now()-s,success:!1}}const zr="http://localhost:9000/api";class Yr{static async handle(t){const n=await t.json().catch(()=>({error:"Unknown error"}));return t.status===401?{status:t.status,message:"Your session has expired. Please login again.",isTokenExpired:!0}:t.status===429?{status:t.status,message:"Too many requests. Please wait a moment and try again.",isTokenExpired:!1}:t.status===403?{status:t.status,message:"Access forbidden. Your account may be locked due to failed login attempts.",isTokenExpired:!1}:{status:t.status,message:n.error||`API error: ${t.statusText}`,isTokenExpired:!1}}}let Gr=null;async function y(e,t={}){const{body:n,serviceName:a="backend-api",...s}=t,o=localStorage.getItem("access_token"),g={"Content-Type":"application/json",...o?{Authorization:`Bearer ${o}`}:{},...s.headers},f={...s,headers:g};return n&&(f.body=JSON.stringify(n)),Br(async()=>{const p=await fetch(`${zr}${e}`,f);if(!p.ok){const m=await Yr.handle(p);m.isTokenExpired&&(localStorage.removeItem("access_token"),localStorage.removeItem("user"));const u=new Error(m.message);throw u.status=m.status,u.isTokenExpired=m.isTokenExpired,!wt(u)&&m.status!==503,u}return await p.json()},a,{maxAttempts:3,initialDelay:1e3,maxDelay:8e3}).then(p=>{if(p.success)return p.data;const m=p.error||new Error("Failed to fetch data");throw console.error(`[API] Request failed for ${e}:`,m),m})}const ae={auth:{login:(e,t)=>y("/auth/login",{method:"POST",body:{username:e,password:t}}),register:(e,t,n)=>y("/auth/register",{method:"POST",body:{username:e,email:t,password:n}}),refresh:()=>y("/auth/refresh",{method:"POST"})},incidents:{list:()=>y("/incidents"),get:e=>y(`/incidents/${e}`),create:e=>y("/incidents",{method:"POST",body:e}),update:(e,t)=>y(`/incidents/${e}`,{method:"PATCH",body:t}),getTimeline:e=>y(`/incidents/${e}/timeline`),getCorrelations:e=>y(`/incidents/${e}/correlations`),getAnalysis:e=>y(`/incidents/${e}/analysis`)},services:{list:()=>y("/services"),get:e=>y(`/services/${e}`),create:e=>y("/services",{method:"POST",body:e}),update:(e,t)=>y(`/services/${e}`,{method:"PATCH",body:t})},slos:{list:()=>y("/slos"),get:e=>y(`/slos/${e}`),create:e=>y("/slos",{method:"POST",body:e}),update:(e,t)=>y(`/slos/${e}`,{method:"PATCH",body:t}),delete:e=>y(`/slos/${e}`,{method:"DELETE"}),calculate:e=>y(`/slos/${e}/calculate`,{method:"POST"}),getHistory:e=>y(`/slos/${e}/history`)},metrics:{getAvailability:e=>y(`/metrics/availability/${e}`),getErrorRate:e=>y(`/metrics/error-rate/${e}`),getLatency:e=>y(`/metrics/latency/${e}`)},kubernetes:{getPods:(e,t)=>y(`/kubernetes/pods/${e}/${t}`),getDeployments:(e,t)=>y(`/kubernetes/deployments/${e}/${t}`),getEvents:(e,t)=>y(`/kubernetes/events/${e}/${t}`)},logs:{getErrors:e=>y(`/logs/${e}/errors`),search:(e,t)=>y(`/logs/${e}/search?q=${encodeURIComponent(t)}`)},detection:{getRules:()=>y("/detection/rules"),getStatus:()=>y("/detection/status")},investigation:{getHypotheses:e=>y(`/incidents/${e}/investigation/hypotheses`),createHypothesis:(e,t)=>y(`/incidents/${e}/investigation/hypotheses`,{method:"POST",body:t}),getSteps:e=>y(`/incidents/${e}/investigation/steps`),createStep:(e,t)=>y(`/incidents/${e}/investigation/steps`,{method:"POST",body:t}),getRCA:e=>y(`/incidents/${e}/investigation/rca`),getRecommendedActions:e=>y(`/incidents/${e}/investigation/recommended-actions`)}};function Vr({url:e={}.VITE_WS_URL||"ws://localhost:9000/api/realtime",onIncidentCreated:t,onIncidentUpdated:n,onCorrelationFound:a,onTimelineEvent:s,onAlert:o}={}){const[g,f]=P.useState(!1),[p,m]=P.useState(null),[u,h]=P.useState(null),[E,L]=P.useState(null),[M,T]=P.useState(0);P.useEffect(()=>{let b=!1,l;const v=()=>{b||(console.log(`[WebSocket] Connecting to ${e}...`),l=new WebSocket(e),l.onopen=()=>{b||(console.log("[WebSocket] Connected to realtime server"),f(!0),h(null),T(0))},l.onmessage=F=>{if(!b)try{const A=JSON.parse(F.data);switch(m(A),A.type){case"incident_created":t==null||t(A.payload);break;case"incident_updated":n==null||n(A.payload);break;case"correlation_found":a==null||a(A.payload);break;case"timeline_event":s==null||s(A.payload);break;case"alert":o==null||o(A.payload);break;default:console.log("[WebSocket] Unknown message type:",A.type)}}catch(A){console.error("[WebSocket] Failed to parse message:",A)}},l.onerror=F=>{b||(console.error("[WebSocket] Error:",F),h("WebSocket connection error"),f(!1))},l.onclose=F=>{if(b)return;console.log("[WebSocket] Connection closed:",F.code,F.reason),f(!1);const A=Math.min(1e3*Math.pow(2,M),3e4);console.log(`[WebSocket] Attempting reconnection in ${A}ms...`),setTimeout(()=>{b||(T(J=>J+1),v())},A)},L(l))};return v(),()=>{b=!0,l&&l.readyState===WebSocket.OPEN&&l.close()}},[e,M]);const B=P.useCallback(b=>{(E==null?void 0:E.readyState)===WebSocket.OPEN?E.send(JSON.stringify(b)):console.warn("[WebSocket] Cannot send - not connected")},[E]);return{connected:g,lastMessage:p,error:u,send:B}}const Q={border:"#2d333d",text:"#e6e8eb",textMuted:"#9fa6b2",accent:"#00d2ff",surface:"#1a1d23"},q={container:S`
    padding: 24px;
    overflow-y: auto;
    background: #0d0e12;
    &::-webkit-scrollbar {
      width: 4px;
    }
    &::-webkit-scrollbar-thumb {
      background: ${Q.border};
      border-radius: 2px;
    }
  `,sectionTitle:S`
    font-size: 16px;
    font-weight: 700;
    margin-bottom: 24px;
    color: ${Q.text};
    text-transform: uppercase;
    letter-spacing: 1px;
    display: flex;
    align-items: center;
    gap: 10px;

    &::after {
      content: '';
      flex: 1;
      height: 1px;
      background: ${Q.border};
    }
  `,timeline:S`
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
      background: ${Q.border};
    }
  `,event:S`
    position: relative;
    padding-bottom: 30px;
    padding-left: 24px;

    &:last-child {
      padding-bottom: 0;
    }
  `,iconWrapper:e=>S`
    position: absolute;
    left: -24px;
    top: 0;
    width: 32px;
    height: 32px;
    background: #1a1d23;
    border: 1px solid ${Q.border};
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    z-index: 1;
    box-shadow: 0 0 0 4px #0d0e12;
  `,eventContent:S`
    background: ${Q.surface};
    border: 1px solid ${Q.border};
    border-radius: 8px;
    padding: 16px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.2);
  `,eventHeader:S`
    display: flex;
    justify-content: space-between;
    margin-bottom: 8px;
  `,eventTitle:S`
    font-weight: 600;
    font-size: 14px;
    color: ${Q.text};
  `,eventTime:S`
    font-size: 11px;
    color: ${Q.textMuted};
  `,eventDesc:S`
    font-size: 13px;
    color: ${Q.textMuted};
    line-height: 1.5;
  `,metadata:S`
    margin-top: 12px;
    padding: 8px;
    background: #0b0c10;
    border-radius: 4px;
    font-family: 'Berkeley Mono', 'Fira Code', monospace;
    font-size: 11px;
    color: #00ff41;
    overflow-x: auto;
  `},Hr=e=>({alert:"🚨",metric_anomaly:"📊",log_event:"📝",deployment:"🚀",mitigation:"🔧",resolution:"✅",trace_anomaly:"🔍",system:"⚙️"})[e]||"•";function Ur({events:e}){return i.jsxs("div",{className:q.container,children:[i.jsx("h3",{className:q.sectionTitle,children:"Incident Timeline"}),i.jsx("div",{className:q.timeline,children:e.length===0?i.jsx("div",{style:{color:Q.textMuted,fontSize:"13px"},children:"No events recorded for this incident yet."}):e.map(t=>i.jsxs("div",{className:q.event,children:[i.jsx("div",{className:q.iconWrapper(t.type),children:Hr(t.type)}),i.jsxs("div",{className:q.eventContent,children:[i.jsxs("div",{className:q.eventHeader,children:[i.jsx("div",{className:q.eventTitle,children:t.title}),i.jsx("div",{className:q.eventTime,children:new Date(t.timestamp).toLocaleTimeString()})]}),i.jsx("div",{className:q.eventDesc,children:t.description}),t.metadata&&Object.keys(t.metadata).length>0&&i.jsx("pre",{className:q.metadata,children:JSON.stringify(t.metadata,null,2)})]})]},t.id))})]})}const G={bg:"#0b0c10",surface:"#1a1d23",border:"#2d333d",accent:"#00d2ff",text:"#e6e8eb",textMuted:"#9fa6b2"},se={container:S`
    display: flex;
    flex-direction: column;
    height: 100%;
    background: ${G.surface};
  `,tabs:S`
    display: flex;
    padding: 0 10px;
    border-bottom: 1px solid ${G.border};
    background: #0d0e12;
  `,tab:e=>S`
    padding: 12px 20px;
    font-size: 13px;
    font-weight: 600;
    color: ${e?G.accent:G.textMuted};
    cursor: pointer;
    border-bottom: 2px solid ${e?G.accent:"transparent"};
    transition: all 0.2s;

    &:hover {
      color: ${G.text};
    }
  `,content:S`
    flex: 1;
    overflow-y: auto;
    padding: 20px;
  `,dataCard:S`
    background: ${G.bg};
    border: 1px solid ${G.border};
    border-radius: 8px;
    padding: 16px;
    margin-bottom: 12px;
  `,logEntry:e=>S`
    font-family: 'Berkeley Mono', monospace;
    font-size: 12px;
    padding: 8px;
    border-bottom: 1px solid ${G.border};
    display: flex;
    gap: 12px;
    
    &::before {
      content: '';
      width: 4px;
      height: 100%;
      background: ${e==="error"?"#f44336":e==="warn"?"#ff9800":"#4caf50"};
    }
  `};function Jr({incidentId:e,service:t}){var m,u;const[n,a]=P.useState("metrics"),[s,o]=P.useState(null),[g,f]=P.useState(!1);P.useEffect(()=>{p()},[n,e,t]);const p=async()=>{f(!0);try{let h;switch(n){case"metrics":const E=await ae.metrics.getErrorRate(t),L=await ae.metrics.getLatency(t);h={errorRate:E,latency:L};break;case"logs":h=await ae.logs.getErrors(t);break;case"traces":h=[];break;case"k8s":h=await ae.kubernetes.getPods("default",t);break}o(h)}catch(h){console.error("Failed to load telemetry",h)}finally{f(!1)}};return i.jsxs("div",{className:se.container,children:[i.jsx("div",{className:se.tabs,children:["metrics","logs","traces","k8s"].map(h=>i.jsx("div",{className:se.tab(n===h),onClick:()=>a(h),children:h.toUpperCase()},h))}),i.jsx("div",{className:se.content,children:g?i.jsxs("div",{style:{color:G.textMuted},children:["Loading ",n,"..."]}):i.jsxs("div",{children:[n==="metrics"&&s&&i.jsxs(i.Fragment,{children:[i.jsxs("div",{className:se.dataCard,children:[i.jsx("div",{style:{color:G.textMuted,fontSize:"12px",marginBottom:"8px"},children:"Error Rate"}),i.jsxs("div",{style:{fontSize:"24px",fontWeight:700,color:"#f44336"},children:[(((m=s.errorRate)==null?void 0:m.value)||0).toFixed(2),"%"]})]}),i.jsxs("div",{className:se.dataCard,children:[i.jsx("div",{style:{color:G.textMuted,fontSize:"12px",marginBottom:"8px"},children:"P95 Latency"}),i.jsxs("div",{style:{fontSize:"24px",fontWeight:700,color:"#00d2ff"},children:[(((u=s.latency)==null?void 0:u.value)||0).toFixed(3),"s"]})]})]}),n==="logs"&&Array.isArray(s)&&i.jsx("div",{className:se.dataCard,style:{padding:0},children:s.length===0?i.jsx("div",{style:{padding:"20px",color:G.textMuted},children:"No error logs found."}):s.map((h,E)=>i.jsxs("div",{className:se.logEntry(h.level||"error"),children:[i.jsx("span",{style:{color:G.textMuted,whiteSpace:"nowrap"},children:new Date(h.timestamp).toLocaleTimeString()}),i.jsx("span",{style:{color:G.text},children:h.message})]},E))}),n==="k8s"&&Array.isArray(s)&&i.jsxs("div",{className:se.dataCard,children:[i.jsx("h4",{style:{margin:"0 0 10px 0",fontSize:"14px"},children:"System Resources"}),s.map((h,E)=>i.jsxs("div",{style:{display:"flex",justifyContent:"space-between",padding:"8px 0",borderBottom:`1px solid ${G.border}`},children:[i.jsx("span",{style:{fontSize:"13px"},children:h.name}),i.jsx("span",{style:{fontSize:"11px",background:h.status==="Running"?"#4caf5020":"#f4433620",color:h.status==="Running"?"#4caf50":"#f44336",padding:"2px 6px",borderRadius:"4px"},children:h.status})]},E))]}),n==="traces"&&i.jsx("div",{style:{color:G.textMuted,textAlign:"center",padding:"40px 0"},children:"Distributed tracing investigation is coming soon."})]})})]})}const Kr=yt`
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
`,Xr=yt`
  0% { box-shadow: 0 0 0 0 rgba(244, 67, 54, 0.4); }
  70% { box-shadow: 0 0 0 10px rgba(244, 67, 54, 0); }
  100% { box-shadow: 0 0 0 0 rgba(244, 67, 54, 0); }
`,k={bg:"#0b0c10",surface:"#1a1d23",surfaceLight:"#252932",border:"#2d333d",accent:"#00d2ff",accentGradient:"linear-gradient(135deg, #00d2ff 0%, #3a7bd5 100%)",critical:"#f44336",high:"#ff9800",medium:"#ffeb3b",low:"#4caf50",text:"#e6e8eb",textMuted:"#9fa6b2"},D={container:S`
    display: flex;
    height: calc(100vh - 100px);
    background: ${k.bg};
    color: ${k.text};
    font-family: 'Inter', system-ui, -apple-system, sans-serif;
    overflow: hidden;
    animation: ${Kr} 0.5s ease-out;
  `,sidebar:S`
    width: 320px;
    border-right: 1px solid ${k.border};
    display: flex;
    flex-direction: column;
    background: ${k.surface};
  `,sidebarHeader:S`
    padding: 20px;
    border-bottom: 1px solid ${k.border};
    font-size: 18px;
    font-weight: 700;
    letter-spacing: -0.5px;
    display: flex;
    align-items: center;
    gap: 10px;
  `,incidentList:S`
    flex: 1;
    overflow-y: auto;
    padding: 10px;
    &::-webkit-scrollbar {
      width: 4px;
    }
    &::-webkit-scrollbar-thumb {
      background: ${k.border};
      border-radius: 2px;
    }
  `,incidentCard:(e,t)=>S`
    padding: 16px;
    border-radius: 8px;
    margin-bottom: 10px;
    background: ${e?k.surfaceLight:"transparent"};
    border: 1px solid ${e?k.accent:k.border};
    cursor: pointer;
    transition: all 0.2s ease;
    position: relative;
    overflow: hidden;

    &:hover {
      background: ${k.surfaceLight};
      transform: translateX(4px);
    }

    &::before {
      content: '';
      position: absolute;
      left: 0;
      top: 0;
      bottom: 0;
      width: 4px;
      background: ${t==="critical"?k.critical:t==="high"?k.high:t==="medium"?k.medium:k.low};
    }
  `,cardTitle:S`
    font-size: 14px;
    font-weight: 600;
    margin-bottom: 6px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  `,cardMeta:S`
    display: flex;
    justify-content: space-between;
    font-size: 11px;
    color: ${k.textMuted};
  `,mainContent:S`
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  `,header:S`
    padding: 24px;
    border-bottom: 1px solid ${k.border};
    background: ${k.surface};
    display: flex;
    justify-content: space-between;
    align-items: center;
  `,headerInfo:S`
    display: flex;
    flex-direction: column;
    gap: 4px;
  `,headerTitle:S`
    font-size: 24px;
    font-weight: 800;
    letter-spacing: -1px;
  `,badge:e=>S`
    padding: 4px 10px;
    border-radius: 12px;
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    background: ${e}20;
    color: ${e};
    border: 1px solid ${e}40;
  `,actions:S`
    display: flex;
    gap: 12px;
  `,button:e=>S`
    padding: 10px 20px;
    border-radius: 6px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    background: ${e?k.accentGradient:"transparent"};
    border: 1px solid ${e?"transparent":k.border};
    color: ${k.text};

    &:hover {
      transform: translateY(-2px);
      box-shadow: ${e?"0 4px 15px rgba(0, 210, 255, 0.3)":"none"};
      background: ${e?k.accentGradient:k.surfaceLight};
    }
  `,contentGrid:S`
    display: grid;
    grid-template-columns: 1fr 400px;
    flex: 1;
    overflow: hidden;
  `,tabContainer:S`
    border-left: 1px solid ${k.border};
    display: flex;
    flex-direction: column;
    overflow: hidden;
  `,emptyState:S`
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    color: ${k.textMuted};
    gap: 20px;
  `,liveDot:S`
    width: 10px;
    height: 10px;
    background: ${k.critical};
    border-radius: 50%;
    animation: ${Xr} 2s infinite;
  `};function Zr(){const[e,t]=P.useState([]),[n,a]=P.useState(null),[s,o]=P.useState([]),[g,f]=P.useState(!0),[p,m]=P.useState([]),[u,h]=P.useState(()=>localStorage.getItem("selectedService")||"payment-service");P.useEffect(()=>{E()},[]),P.useEffect(()=>{M()},[u]);const E=async()=>{try{const v=(await ae.services.list()).map(F=>F.name);m(v),v.includes("payment-service")&&!localStorage.getItem("selectedService")&&L("payment-service")}catch(l){console.error("Failed to load services",l),m(["payment-service","api-gateway","user-service","frontend-web"])}},L=l=>{h(l),localStorage.setItem("selectedService",l),a(null)},M=async()=>{try{const l=await ae.incidents.list(),v=u?l.filter(F=>F.service===u):l;t(v),v.length>0&&!n&&T(v[0])}catch(l){console.error("Failed to load incidents",l)}finally{f(!1)}},T=async l=>{a(l);try{const v=await ae.incidents.getTimeline(l.id);o(v)}catch(v){console.error("Failed to load timeline",v)}};Vr({onIncidentCreated:l=>{t(v=>[l,...v]),n||T(l)},onIncidentUpdated:l=>{t(v=>v.map(F=>F.id===l.id?{...F,...l}:F)),(n==null?void 0:n.id)===l.id&&a(v=>({...v,...l}))},onTimelineEvent:l=>{(n==null?void 0:n.id)===l.incident_id&&o(v=>[l,...v])}});const B=async l=>{try{await ae.incidents.update(l,{status:"investigating"})}catch(v){console.error("Failed to acknowledge",v)}},b=async l=>{try{await ae.incidents.update(l,{status:"resolved"})}catch(v){console.error("Failed to resolve",v)}};return g?i.jsx("div",{className:D.emptyState,children:"Initializing Control Room..."}):i.jsxs("div",{className:D.container,children:[i.jsxs("div",{className:D.sidebar,children:[i.jsxs("div",{className:D.sidebarHeader,children:[i.jsx("div",{className:D.liveDot}),i.jsx("span",{children:"Active Incidents"})]}),i.jsxs("div",{style:{padding:"10px 20px",borderBottom:`1px solid ${k.border}`},children:[i.jsx("label",{style:{fontSize:"11px",color:k.textMuted,marginBottom:"6px",display:"block"},children:"Service Filter"}),i.jsxs("select",{value:u,onChange:l=>L(l.target.value),style:{width:"100%",padding:"8px 12px",background:k.surfaceLight,border:`1px solid ${k.border}`,borderRadius:"6px",color:k.text,fontSize:"13px",fontWeight:600,cursor:"pointer",outline:"none"},children:[i.jsx("option",{value:"",children:"All Services"}),p.map(l=>i.jsx("option",{value:l,children:l},l))]})]}),i.jsx("div",{className:D.incidentList,children:e.length===0?i.jsx("div",{className:D.emptyState,children:"No active incidents"}):e.map(l=>i.jsxs("div",{className:D.incidentCard((n==null?void 0:n.id)===l.id,l.severity),onClick:()=>T(l),children:[i.jsx("div",{className:D.cardTitle,children:l.title}),i.jsxs("div",{className:D.cardMeta,children:[i.jsx("span",{children:l.service}),i.jsx("span",{children:new Date(l.started_at).toLocaleTimeString()})]})]},l.id))})]}),i.jsx("div",{className:D.mainContent,children:n?i.jsxs(i.Fragment,{children:[i.jsxs("div",{className:D.header,children:[i.jsxs("div",{className:D.headerInfo,children:[i.jsxs("div",{style:{display:"flex",alignItems:"center",gap:"12px",marginBottom:"8px"},children:[i.jsx("div",{className:D.badge(n.severity==="critical"?k.critical:n.severity==="high"?k.high:k.medium),children:n.severity}),i.jsx("div",{className:D.badge(k.accent),children:n.status})]}),i.jsx("div",{className:D.headerTitle,children:n.title}),i.jsxs("div",{style:{color:k.textMuted,fontSize:"14px"},children:["Detected for ",i.jsx("strong",{children:n.service})," at ",new Date(n.started_at).toLocaleString()]})]}),i.jsxs("div",{className:D.actions,children:[n.status==="open"&&i.jsx("button",{className:D.button(!0),onClick:()=>B(n.id),children:"Acknowledge"}),n.status!=="resolved"&&i.jsx("button",{className:D.button(!1),onClick:()=>b(n.id),children:"Mark Resolved"})]})]}),i.jsxs("div",{className:D.contentGrid,children:[i.jsx(Ur,{events:s}),i.jsx("div",{className:D.tabContainer,children:i.jsx(Jr,{incidentId:n.id,service:n.service})})]})]}):i.jsxs("div",{className:D.emptyState,children:[i.jsx("h2",{children:"Select an incident to investigate"}),i.jsx("p",{children:"Ready to monitor your infrastructure reliability."})]})})]})}class Qr extends P.Component{constructor(t){super(t),this.handleRetry=()=>{this.setState({hasError:!1,error:void 0,errorInfo:void 0})},this.state={hasError:!1,attemptNumber:0}}static getDerivedStateFromError(t){return{hasError:!0,error:t}}componentDidCatch(t,n){console.error("[ErrorBoundary] Error caught:",t),console.error("[ErrorBoundary] Error info:",n),this.props.onError&&this.props.onError(t,n);try{const a=JSON.parse(localStorage.getItem("errorLogs")||"[]");a.push({timestamp:new Date().toISOString(),message:t.message,stack:t.stack,componentStack:n.componentStack}),localStorage.setItem("errorLogs",JSON.stringify(a.slice(-50)))}catch(a){console.error("[ErrorBoundary] Failed to log error:",a)}this.setState(a=>({errorInfo:n,attemptNumber:a.attemptNumber+1}))}render(){if(this.state.hasError){const{level:t="component"}=this.props;return this.state,this.props.fallback?this.props.fallback:t==="page"?this.renderPageError():t==="section"?this.renderSectionError():this.renderComponentError()}return this.props.children}renderPageError(){var t;return i.jsx("div",{style:N.pageContainer,children:i.jsxs("div",{style:N.errorBox,children:[i.jsx("div",{style:N.errorIcon,children:"⚠️"}),i.jsx("h1",{style:N.pageTitle,children:"Application Error"}),i.jsx("p",{style:N.message,children:((t=this.state.error)==null?void 0:t.message)||"An unexpected error occurred."}),this.state.errorInfo&&i.jsxs("details",{style:N.details,children:[i.jsx("summary",{style:N.summary,children:"Error Details"}),i.jsx("pre",{style:N.pre,children:this.state.errorInfo.componentStack})]}),i.jsxs("div",{style:N.buttonGroup,children:[i.jsx("button",{onClick:this.handleRetry,style:{...N.button,...N.retryButton},children:"Try Again"}),i.jsx("button",{onClick:()=>window.location.reload(),style:{...N.button,...N.reloadButton},children:"Reload Page"})]})]})})}renderSectionError(){var t;return i.jsx("div",{style:N.sectionContainer,children:i.jsxs("div",{style:N.sectionError,children:[i.jsx("div",{style:N.sectionIcon,children:"⚠️"}),i.jsx("h3",{style:N.sectionTitle,children:"Section Unavailable"}),i.jsx("p",{style:N.message,children:((t=this.state.error)==null?void 0:t.message)||"This section encountered an error."}),i.jsx("button",{onClick:this.handleRetry,style:N.button,children:"Try Again"})]})})}renderComponentError(){var t;return i.jsxs("div",{style:N.componentError,children:[i.jsx("span",{style:N.componentIcon,children:"❌"}),i.jsx("span",{style:N.componentMessage,children:((t=this.state.error)==null?void 0:t.message)||"Component error"})]})}}const N={pageContainer:{display:"flex",alignItems:"center",justifyContent:"center",minHeight:"100vh",backgroundColor:"#f9fafb",padding:"16px"},errorBox:{backgroundColor:"white",borderRadius:"12px",padding:"48px 32px",boxShadow:"0 10px 15px -3px rgba(0,0,0,0.1)",textAlign:"center",maxWidth:"600px",borderLeft:"4px solid #ef4444"},errorIcon:{fontSize:"48px",marginBottom:"16px"},pageTitle:{margin:"0 0 12px 0",fontSize:"28px",fontWeight:"700",color:"#1f2937"},sectionIcon:{fontSize:"32px",marginRight:"8px"},componentIcon:{fontSize:"16px",marginRight:"6px"},message:{margin:"0 0 24px 0",fontSize:"15px",color:"#6b7280",lineHeight:"1.6"},details:{marginBottom:"24px",textAlign:"left",backgroundColor:"#f9fafb",borderRadius:"8px",padding:"12px"},summary:{cursor:"pointer",fontWeight:"600",color:"#374151",marginBottom:"8px"},pre:{margin:"0",fontSize:"12px",color:"#6b7280",overflow:"auto",maxHeight:"200px",fontFamily:"monospace"},buttonGroup:{display:"flex",gap:"12px",justifyContent:"center",flexWrap:"wrap"},button:{padding:"10px 20px",backgroundColor:"#3b82f6",color:"white",border:"none",borderRadius:"6px",cursor:"pointer",fontSize:"14px",fontWeight:600,transition:"all 0.2s"},retryButton:{backgroundColor:"#10b981"},reloadButton:{backgroundColor:"#ef4444"},sectionContainer:{width:"100%",padding:"24px",backgroundColor:"white",borderRadius:"8px",minHeight:"200px",display:"flex",alignItems:"center",justifyContent:"center"},sectionError:{textAlign:"center",maxWidth:"400px"},sectionTitle:{margin:"8px 0 12px 0",fontSize:"18px",fontWeight:"600",color:"#1f2937"},componentError:{display:"inline-flex",alignItems:"center",gap:"8px",padding:"8px 12px",backgroundColor:"#fee2e2",color:"#991b1b",borderRadius:"4px",fontSize:"13px",fontWeight:"500"},componentMessage:{maxWidth:"300px",overflow:"hidden",textOverflow:"ellipsis"}},qr=()=>i.jsx(Qr,{children:i.jsx("div",{style:{height:"100%",width:"100%"},children:i.jsx(Zr,{})})}),en=new Ht.AppPlugin().setRootPage(qr);qe.plugin=en,Object.defineProperty(qe,Symbol.toStringTag,{value:"Module"})});

define(["exports","@grafana/data","react"],function(Ze,Ht,C){"use strict";var $e={exports:{}},le={};/**
 * @license React
 * react-jsx-runtime.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */var Qe;function Yt(){if(Qe)return le;Qe=1;var e=C,t=Symbol.for("react.element"),n=Symbol.for("react.fragment"),a=Object.prototype.hasOwnProperty,s=e.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentOwner,i={key:!0,ref:!0,__self:!0,__source:!0};function u(h,l,m){var f,x={},E=null,M=null;m!==void 0&&(E=""+m),l.key!==void 0&&(E=""+l.key),l.ref!==void 0&&(M=l.ref);for(f in l)a.call(l,f)&&!i.hasOwnProperty(f)&&(x[f]=l[f]);if(h&&h.defaultProps)for(f in l=h.defaultProps,l)x[f]===void 0&&(x[f]=l[f]);return{$$typeof:t,type:h,key:E,ref:M,props:x,_owner:s.current}}return le.Fragment=n,le.jsx=u,le.jsxs=u,le}var ue={};/**
 * @license React
 * react-jsx-runtime.development.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */var qe;function Ut(){return qe||(qe=1,{}.NODE_ENV!=="production"&&function(){var e=C,t=Symbol.for("react.element"),n=Symbol.for("react.portal"),a=Symbol.for("react.fragment"),s=Symbol.for("react.strict_mode"),i=Symbol.for("react.profiler"),u=Symbol.for("react.provider"),h=Symbol.for("react.context"),l=Symbol.for("react.forward_ref"),m=Symbol.for("react.suspense"),f=Symbol.for("react.suspense_list"),x=Symbol.for("react.memo"),E=Symbol.for("react.lazy"),M=Symbol.for("react.offscreen"),$=Symbol.iterator,g="@@iterator";function j(r){if(r===null||typeof r!="object")return null;var c=$&&r[$]||r[g];return typeof c=="function"?c:null}var P=e.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED;function T(r){{for(var c=arguments.length,p=new Array(c>1?c-1:0),y=1;y<c;y++)p[y-1]=arguments[y];z("error",r,p)}}function z(r,c,p){{var y=P.ReactDebugCurrentFrame,A=y.getStackAddendum();A!==""&&(c+="%s",p=p.concat([A]));var D=p.map(function(_){return String(_)});D.unshift("Warning: "+c),Function.prototype.apply.call(console[r],console,D)}}var w=!1,H=!1,Y=!1,R=!1,xe=!1,ie;ie=Symbol.for("react.module.reference");function Qr(r){return!!(typeof r=="string"||typeof r=="function"||r===a||r===i||xe||r===s||r===m||r===f||R||r===M||w||H||Y||typeof r=="object"&&r!==null&&(r.$$typeof===E||r.$$typeof===x||r.$$typeof===u||r.$$typeof===h||r.$$typeof===l||r.$$typeof===ie||r.getModuleId!==void 0))}function qr(r,c,p){var y=r.displayName;if(y)return y;var A=c.displayName||c.name||"";return A!==""?p+"("+A+")":p}function yt(r){return r.displayName||"Context"}function ee(r){if(r==null)return null;if(typeof r.tag=="number"&&T("Received an unexpected object in getComponentNameFromType(). This is likely a bug in React. Please file an issue."),typeof r=="function")return r.displayName||r.name||null;if(typeof r=="string")return r;switch(r){case a:return"Fragment";case n:return"Portal";case i:return"Profiler";case s:return"StrictMode";case m:return"Suspense";case f:return"SuspenseList"}if(typeof r=="object")switch(r.$$typeof){case h:var c=r;return yt(c)+".Consumer";case u:var p=r;return yt(p._context)+".Provider";case l:return qr(r,r.render,"ForwardRef");case x:var y=r.displayName||null;return y!==null?y:ee(r.type)||"Memo";case E:{var A=r,D=A._payload,_=A._init;try{return ee(_(D))}catch{return null}}}return null}var te=Object.assign,ve=0,wt,St,kt,Ct,Et,jt,Tt;function Rt(){}Rt.__reactDisabledLog=!0;function en(){{if(ve===0){wt=console.log,St=console.info,kt=console.warn,Ct=console.error,Et=console.group,jt=console.groupCollapsed,Tt=console.groupEnd;var r={configurable:!0,enumerable:!0,value:Rt,writable:!0};Object.defineProperties(console,{info:r,log:r,warn:r,error:r,group:r,groupCollapsed:r,groupEnd:r})}ve++}}function tn(){{if(ve--,ve===0){var r={configurable:!0,enumerable:!0,writable:!0};Object.defineProperties(console,{log:te({},r,{value:wt}),info:te({},r,{value:St}),warn:te({},r,{value:kt}),error:te({},r,{value:Ct}),group:te({},r,{value:Et}),groupCollapsed:te({},r,{value:jt}),groupEnd:te({},r,{value:Tt})})}ve<0&&T("disabledDepth fell below zero. This is a bug in React. Please file an issue.")}}var ze=P.ReactCurrentDispatcher,He;function Ne(r,c,p){{if(He===void 0)try{throw Error()}catch(A){var y=A.stack.trim().match(/\n( *(at )?)/);He=y&&y[1]||""}return`
`+He+r}}var Ye=!1,Oe;{var rn=typeof WeakMap=="function"?WeakMap:Map;Oe=new rn}function _t(r,c){if(!r||Ye)return"";{var p=Oe.get(r);if(p!==void 0)return p}var y;Ye=!0;var A=Error.prepareStackTrace;Error.prepareStackTrace=void 0;var D;D=ze.current,ze.current=null,en();try{if(c){var _=function(){throw Error()};if(Object.defineProperty(_.prototype,"props",{set:function(){throw Error()}}),typeof Reflect=="object"&&Reflect.construct){try{Reflect.construct(_,[])}catch(G){y=G}Reflect.construct(r,[],_)}else{try{_.call()}catch(G){y=G}r.call(_.prototype)}}else{try{throw Error()}catch(G){y=G}r()}}catch(G){if(G&&y&&typeof G.stack=="string"){for(var k=G.stack.split(`
`),U=y.stack.split(`
`),L=k.length-1,I=U.length-1;L>=1&&I>=0&&k[L]!==U[I];)I--;for(;L>=1&&I>=0;L--,I--)if(k[L]!==U[I]){if(L!==1||I!==1)do if(L--,I--,I<0||k[L]!==U[I]){var K=`
`+k[L].replace(" at new "," at ");return r.displayName&&K.includes("<anonymous>")&&(K=K.replace("<anonymous>",r.displayName)),typeof r=="function"&&Oe.set(r,K),K}while(L>=1&&I>=0);break}}}finally{Ye=!1,ze.current=D,tn(),Error.prepareStackTrace=A}var ce=r?r.displayName||r.name:"",re=ce?Ne(ce):"";return typeof r=="function"&&Oe.set(r,re),re}function nn(r,c,p){return _t(r,!1)}function an(r){var c=r.prototype;return!!(c&&c.isReactComponent)}function Pe(r,c,p){if(r==null)return"";if(typeof r=="function")return _t(r,an(r));if(typeof r=="string")return Ne(r);switch(r){case m:return Ne("Suspense");case f:return Ne("SuspenseList")}if(typeof r=="object")switch(r.$$typeof){case l:return nn(r.render);case x:return Pe(r.type,c,p);case E:{var y=r,A=y._payload,D=y._init;try{return Pe(D(A),c,p)}catch{}}}return""}var be=Object.prototype.hasOwnProperty,Nt={},Ot=P.ReactDebugCurrentFrame;function Ae(r){if(r){var c=r._owner,p=Pe(r.type,r._source,c?c.type:null);Ot.setExtraStackFrame(p)}else Ot.setExtraStackFrame(null)}function sn(r,c,p,y,A){{var D=Function.call.bind(be);for(var _ in r)if(D(r,_)){var k=void 0;try{if(typeof r[_]!="function"){var U=Error((y||"React class")+": "+p+" type `"+_+"` is invalid; it must be a function, usually from the `prop-types` package, but received `"+typeof r[_]+"`.This often happens because of typos such as `PropTypes.function` instead of `PropTypes.func`.");throw U.name="Invariant Violation",U}k=r[_](c,_,y,p,null,"SECRET_DO_NOT_PASS_THIS_OR_YOU_WILL_BE_FIRED")}catch(L){k=L}k&&!(k instanceof Error)&&(Ae(A),T("%s: type specification of %s `%s` is invalid; the type checker function must return `null` or an `Error` but returned a %s. You may have forgotten to pass an argument to the type checker creator (arrayOf, instanceOf, objectOf, oneOf, oneOfType, and shape all require an argument).",y||"React class",p,_,typeof k),Ae(null)),k instanceof Error&&!(k.message in Nt)&&(Nt[k.message]=!0,Ae(A),T("Failed %s type: %s",p,k.message),Ae(null))}}}var on=Array.isArray;function Ue(r){return on(r)}function cn(r){{var c=typeof Symbol=="function"&&Symbol.toStringTag,p=c&&r[Symbol.toStringTag]||r.constructor.name||"Object";return p}}function ln(r){try{return Pt(r),!1}catch{return!0}}function Pt(r){return""+r}function At(r){if(ln(r))return T("The provided key is an unsupported type %s. This value must be coerced to a string before before using it here.",cn(r)),Pt(r)}var ye=P.ReactCurrentOwner,un={key:!0,ref:!0,__self:!0,__source:!0},$t,Dt,Ve;Ve={};function dn(r){if(be.call(r,"ref")){var c=Object.getOwnPropertyDescriptor(r,"ref").get;if(c&&c.isReactWarning)return!1}return r.ref!==void 0}function fn(r){if(be.call(r,"key")){var c=Object.getOwnPropertyDescriptor(r,"key").get;if(c&&c.isReactWarning)return!1}return r.key!==void 0}function hn(r,c){if(typeof r.ref=="string"&&ye.current&&c&&ye.current.stateNode!==c){var p=ee(ye.current.type);Ve[p]||(T('Component "%s" contains the string ref "%s". Support for string refs will be removed in a future major release. This case cannot be automatically converted to an arrow function. We ask you to manually fix this case by using useRef() or createRef() instead. Learn more about using refs safely here: https://reactjs.org/link/strict-mode-string-ref',ee(ye.current.type),r.ref),Ve[p]=!0)}}function pn(r,c){{var p=function(){$t||($t=!0,T("%s: `key` is not a prop. Trying to access it will result in `undefined` being returned. If you need to access the same value within the child component, you should pass it as a different prop. (https://reactjs.org/link/special-props)",c))};p.isReactWarning=!0,Object.defineProperty(r,"key",{get:p,configurable:!0})}}function mn(r,c){{var p=function(){Dt||(Dt=!0,T("%s: `ref` is not a prop. Trying to access it will result in `undefined` being returned. If you need to access the same value within the child component, you should pass it as a different prop. (https://reactjs.org/link/special-props)",c))};p.isReactWarning=!0,Object.defineProperty(r,"ref",{get:p,configurable:!0})}}var gn=function(r,c,p,y,A,D,_){var k={$$typeof:t,type:r,key:c,ref:p,props:_,_owner:D};return k._store={},Object.defineProperty(k._store,"validated",{configurable:!1,enumerable:!1,writable:!0,value:!1}),Object.defineProperty(k,"_self",{configurable:!1,enumerable:!1,writable:!1,value:y}),Object.defineProperty(k,"_source",{configurable:!1,enumerable:!1,writable:!1,value:A}),Object.freeze&&(Object.freeze(k.props),Object.freeze(k)),k};function xn(r,c,p,y,A){{var D,_={},k=null,U=null;p!==void 0&&(At(p),k=""+p),fn(c)&&(At(c.key),k=""+c.key),dn(c)&&(U=c.ref,hn(c,A));for(D in c)be.call(c,D)&&!un.hasOwnProperty(D)&&(_[D]=c[D]);if(r&&r.defaultProps){var L=r.defaultProps;for(D in L)_[D]===void 0&&(_[D]=L[D])}if(k||U){var I=typeof r=="function"?r.displayName||r.name||"Unknown":r;k&&pn(_,I),U&&mn(_,I)}return gn(r,k,U,A,y,ye.current,_)}}var Ge=P.ReactCurrentOwner,Mt=P.ReactDebugCurrentFrame;function oe(r){if(r){var c=r._owner,p=Pe(r.type,r._source,c?c.type:null);Mt.setExtraStackFrame(p)}else Mt.setExtraStackFrame(null)}var Je;Je=!1;function Ke(r){return typeof r=="object"&&r!==null&&r.$$typeof===t}function Lt(){{if(Ge.current){var r=ee(Ge.current.type);if(r)return`

Check the render method of \``+r+"`."}return""}}function vn(r){{if(r!==void 0){var c=r.fileName.replace(/^.*[\\\/]/,""),p=r.lineNumber;return`

Check your code at `+c+":"+p+"."}return""}}var Ft={};function bn(r){{var c=Lt();if(!c){var p=typeof r=="string"?r:r.displayName||r.name;p&&(c=`

Check the top-level render call using <`+p+">.")}return c}}function It(r,c){{if(!r._store||r._store.validated||r.key!=null)return;r._store.validated=!0;var p=bn(c);if(Ft[p])return;Ft[p]=!0;var y="";r&&r._owner&&r._owner!==Ge.current&&(y=" It was passed a child from "+ee(r._owner.type)+"."),oe(r),T('Each child in a list should have a unique "key" prop.%s%s See https://reactjs.org/link/warning-keys for more information.',p,y),oe(null)}}function Wt(r,c){{if(typeof r!="object")return;if(Ue(r))for(var p=0;p<r.length;p++){var y=r[p];Ke(y)&&It(y,c)}else if(Ke(r))r._store&&(r._store.validated=!0);else if(r){var A=j(r);if(typeof A=="function"&&A!==r.entries)for(var D=A.call(r),_;!(_=D.next()).done;)Ke(_.value)&&It(_.value,c)}}}function yn(r){{var c=r.type;if(c==null||typeof c=="string")return;var p;if(typeof c=="function")p=c.propTypes;else if(typeof c=="object"&&(c.$$typeof===l||c.$$typeof===x))p=c.propTypes;else return;if(p){var y=ee(c);sn(p,r.props,"prop",y,r)}else if(c.PropTypes!==void 0&&!Je){Je=!0;var A=ee(c);T("Component %s declared `PropTypes` instead of `propTypes`. Did you misspell the property assignment?",A||"Unknown")}typeof c.getDefaultProps=="function"&&!c.getDefaultProps.isReactClassApproved&&T("getDefaultProps is only used on classic React.createClass definitions. Use a static property named `defaultProps` instead.")}}function wn(r){{for(var c=Object.keys(r.props),p=0;p<c.length;p++){var y=c[p];if(y!=="children"&&y!=="key"){oe(r),T("Invalid prop `%s` supplied to `React.Fragment`. React.Fragment can only have `key` and `children` props.",y),oe(null);break}}r.ref!==null&&(oe(r),T("Invalid attribute `ref` supplied to `React.Fragment`."),oe(null))}}var Bt={};function zt(r,c,p,y,A,D){{var _=Qr(r);if(!_){var k="";(r===void 0||typeof r=="object"&&r!==null&&Object.keys(r).length===0)&&(k+=" You likely forgot to export your component from the file it's defined in, or you might have mixed up default and named imports.");var U=vn(A);U?k+=U:k+=Lt();var L;r===null?L="null":Ue(r)?L="array":r!==void 0&&r.$$typeof===t?(L="<"+(ee(r.type)||"Unknown")+" />",k=" Did you accidentally export a JSX literal instead of a component?"):L=typeof r,T("React.jsx: type is invalid -- expected a string (for built-in components) or a class/function (for composite components) but got: %s.%s",L,k)}var I=xn(r,c,p,A,D);if(I==null)return I;if(_){var K=c.children;if(K!==void 0)if(y)if(Ue(K)){for(var ce=0;ce<K.length;ce++)Wt(K[ce],r);Object.freeze&&Object.freeze(K)}else T("React.jsx: Static children should always be an array. You are likely explicitly calling React.jsxs or React.jsxDEV. Use the Babel transform instead.");else Wt(K,r)}if(be.call(c,"key")){var re=ee(r),G=Object.keys(c).filter(function(Tn){return Tn!=="key"}),Xe=G.length>0?"{key: someKey, "+G.join(": ..., ")+": ...}":"{key: someKey}";if(!Bt[re+Xe]){var jn=G.length>0?"{"+G.join(": ..., ")+": ...}":"{}";T(`A props object containing a "key" prop is being spread into JSX:
  let props = %s;
  <%s {...props} />
React keys must be passed directly to JSX without using spread:
  let props = %s;
  <%s key={someKey} {...props} />`,Xe,re,jn,re),Bt[re+Xe]=!0}}return r===a?wn(I):yn(I),I}}function Sn(r,c,p){return zt(r,c,p,!0)}function kn(r,c,p){return zt(r,c,p,!1)}var Cn=kn,En=Sn;ue.Fragment=a,ue.jsx=Cn,ue.jsxs=En}()),ue}({}).NODE_ENV==="production"?$e.exports=Yt():$e.exports=Ut();var o=$e.exports,Vt=!1;function Gt(e){if(e.sheet)return e.sheet;for(var t=0;t<document.styleSheets.length;t++)if(document.styleSheets[t].ownerNode===e)return document.styleSheets[t]}function Jt(e){var t=document.createElement("style");return t.setAttribute("data-emotion",e.key),e.nonce!==void 0&&t.setAttribute("nonce",e.nonce),t.appendChild(document.createTextNode("")),t.setAttribute("data-s",""),t}var Kt=function(){function e(n){var a=this;this._insertTag=function(s){var i;a.tags.length===0?a.insertionPoint?i=a.insertionPoint.nextSibling:a.prepend?i=a.container.firstChild:i=a.before:i=a.tags[a.tags.length-1].nextSibling,a.container.insertBefore(s,i),a.tags.push(s)},this.isSpeedy=n.speedy===void 0?!Vt:n.speedy,this.tags=[],this.ctr=0,this.nonce=n.nonce,this.key=n.key,this.container=n.container,this.prepend=n.prepend,this.insertionPoint=n.insertionPoint,this.before=null}var t=e.prototype;return t.hydrate=function(a){a.forEach(this._insertTag)},t.insert=function(a){this.ctr%(this.isSpeedy?65e3:1)===0&&this._insertTag(Jt(this));var s=this.tags[this.tags.length-1];if(this.isSpeedy){var i=Gt(s);try{i.insertRule(a,i.cssRules.length)}catch{}}else s.appendChild(document.createTextNode(a));this.ctr++},t.flush=function(){this.tags.forEach(function(a){var s;return(s=a.parentNode)==null?void 0:s.removeChild(a)}),this.tags=[],this.ctr=0},e}(),B="-ms-",we="-moz-",N="-webkit-",et="comm",De="rule",Me="decl",Xt="@import",tt="@keyframes",Zt="@layer",Qt=Math.abs,Se=String.fromCharCode,qt=Object.assign;function er(e,t){return W(e,0)^45?(((t<<2^W(e,0))<<2^W(e,1))<<2^W(e,2))<<2^W(e,3):0}function rt(e){return e.trim()}function tr(e,t){return(e=t.exec(e))?e[0]:e}function O(e,t,n){return e.replace(t,n)}function Le(e,t){return e.indexOf(t)}function W(e,t){return e.charCodeAt(t)|0}function de(e,t,n){return e.slice(t,n)}function X(e){return e.length}function Fe(e){return e.length}function ke(e,t){return t.push(e),e}function rr(e,t){return e.map(t).join("")}var Ce=1,ne=1,nt=0,V=0,F=0,ae="";function Ee(e,t,n,a,s,i,u){return{value:e,root:t,parent:n,type:a,props:s,children:i,line:Ce,column:ne,length:u,return:""}}function fe(e,t){return qt(Ee("",null,null,"",null,null,0),e,{length:-e.length},t)}function nr(){return F}function ar(){return F=V>0?W(ae,--V):0,ne--,F===10&&(ne=1,Ce--),F}function J(){return F=V<nt?W(ae,V++):0,ne++,F===10&&(ne=1,Ce++),F}function Z(){return W(ae,V)}function je(){return V}function he(e,t){return de(ae,e,t)}function pe(e){switch(e){case 0:case 9:case 10:case 13:case 32:return 5;case 33:case 43:case 44:case 47:case 62:case 64:case 126:case 59:case 123:case 125:return 4;case 58:return 3;case 34:case 39:case 40:case 91:return 2;case 41:case 93:return 1}return 0}function at(e){return Ce=ne=1,nt=X(ae=e),V=0,[]}function st(e){return ae="",e}function Te(e){return rt(he(V-1,Ie(e===91?e+2:e===40?e+1:e)))}function sr(e){for(;(F=Z())&&F<33;)J();return pe(e)>2||pe(F)>3?"":" "}function ir(e,t){for(;--t&&J()&&!(F<48||F>102||F>57&&F<65||F>70&&F<97););return he(e,je()+(t<6&&Z()==32&&J()==32))}function Ie(e){for(;J();)switch(F){case e:return V;case 34:case 39:e!==34&&e!==39&&Ie(F);break;case 40:e===41&&Ie(e);break;case 92:J();break}return V}function or(e,t){for(;J()&&e+F!==47+10;)if(e+F===42+42&&Z()===47)break;return"/*"+he(t,V-1)+"*"+Se(e===47?e:J())}function cr(e){for(;!pe(Z());)J();return he(e,V)}function lr(e){return st(Re("",null,null,null,[""],e=at(e),0,[0],e))}function Re(e,t,n,a,s,i,u,h,l){for(var m=0,f=0,x=u,E=0,M=0,$=0,g=1,j=1,P=1,T=0,z="",w=s,H=i,Y=a,R=z;j;)switch($=T,T=J()){case 40:if($!=108&&W(R,x-1)==58){Le(R+=O(Te(T),"&","&\f"),"&\f")!=-1&&(P=-1);break}case 34:case 39:case 91:R+=Te(T);break;case 9:case 10:case 13:case 32:R+=sr($);break;case 92:R+=ir(je()-1,7);continue;case 47:switch(Z()){case 42:case 47:ke(ur(or(J(),je()),t,n),l);break;default:R+="/"}break;case 123*g:h[m++]=X(R)*P;case 125*g:case 59:case 0:switch(T){case 0:case 125:j=0;case 59+f:P==-1&&(R=O(R,/\f/g,"")),M>0&&X(R)-x&&ke(M>32?ot(R+";",a,n,x-1):ot(O(R," ","")+";",a,n,x-2),l);break;case 59:R+=";";default:if(ke(Y=it(R,t,n,m,f,s,h,z,w=[],H=[],x),i),T===123)if(f===0)Re(R,t,Y,Y,w,i,x,h,H);else switch(E===99&&W(R,3)===110?100:E){case 100:case 108:case 109:case 115:Re(e,Y,Y,a&&ke(it(e,Y,Y,0,0,s,h,z,s,w=[],x),H),s,H,x,h,a?w:H);break;default:Re(R,Y,Y,Y,[""],H,0,h,H)}}m=f=M=0,g=P=1,z=R="",x=u;break;case 58:x=1+X(R),M=$;default:if(g<1){if(T==123)--g;else if(T==125&&g++==0&&ar()==125)continue}switch(R+=Se(T),T*g){case 38:P=f>0?1:(R+="\f",-1);break;case 44:h[m++]=(X(R)-1)*P,P=1;break;case 64:Z()===45&&(R+=Te(J())),E=Z(),f=x=X(z=R+=cr(je())),T++;break;case 45:$===45&&X(R)==2&&(g=0)}}return i}function it(e,t,n,a,s,i,u,h,l,m,f){for(var x=s-1,E=s===0?i:[""],M=Fe(E),$=0,g=0,j=0;$<a;++$)for(var P=0,T=de(e,x+1,x=Qt(g=u[$])),z=e;P<M;++P)(z=rt(g>0?E[P]+" "+T:O(T,/&\f/g,E[P])))&&(l[j++]=z);return Ee(e,t,n,s===0?De:h,l,m,f)}function ur(e,t,n){return Ee(e,t,n,et,Se(nr()),de(e,2,-2),0)}function ot(e,t,n,a){return Ee(e,t,n,Me,de(e,0,a),de(e,a+1,-1),a)}function se(e,t){for(var n="",a=Fe(e),s=0;s<a;s++)n+=t(e[s],s,e,t)||"";return n}function dr(e,t,n,a){switch(e.type){case Zt:if(e.children.length)break;case Xt:case Me:return e.return=e.return||e.value;case et:return"";case tt:return e.return=e.value+"{"+se(e.children,a)+"}";case De:e.value=e.props.join(",")}return X(n=se(e.children,a))?e.return=e.value+"{"+n+"}":""}function fr(e){var t=Fe(e);return function(n,a,s,i){for(var u="",h=0;h<t;h++)u+=e[h](n,a,s,i)||"";return u}}function hr(e){return function(t){t.root||(t=t.return)&&e(t)}}function pr(e){var t=Object.create(null);return function(n){return t[n]===void 0&&(t[n]=e(n)),t[n]}}var mr=function(t,n,a){for(var s=0,i=0;s=i,i=Z(),s===38&&i===12&&(n[a]=1),!pe(i);)J();return he(t,V)},gr=function(t,n){var a=-1,s=44;do switch(pe(s)){case 0:s===38&&Z()===12&&(n[a]=1),t[a]+=mr(V-1,n,a);break;case 2:t[a]+=Te(s);break;case 4:if(s===44){t[++a]=Z()===58?"&\f":"",n[a]=t[a].length;break}default:t[a]+=Se(s)}while(s=J());return t},xr=function(t,n){return st(gr(at(t),n))},ct=new WeakMap,vr=function(t){if(!(t.type!=="rule"||!t.parent||t.length<1)){for(var n=t.value,a=t.parent,s=t.column===a.column&&t.line===a.line;a.type!=="rule";)if(a=a.parent,!a)return;if(!(t.props.length===1&&n.charCodeAt(0)!==58&&!ct.get(a))&&!s){ct.set(t,!0);for(var i=[],u=xr(n,i),h=a.props,l=0,m=0;l<u.length;l++)for(var f=0;f<h.length;f++,m++)t.props[m]=i[l]?u[l].replace(/&\f/g,h[f]):h[f]+" "+u[l]}}},br=function(t){if(t.type==="decl"){var n=t.value;n.charCodeAt(0)===108&&n.charCodeAt(2)===98&&(t.return="",t.value="")}};function lt(e,t){switch(er(e,t)){case 5103:return N+"print-"+e+e;case 5737:case 4201:case 3177:case 3433:case 1641:case 4457:case 2921:case 5572:case 6356:case 5844:case 3191:case 6645:case 3005:case 6391:case 5879:case 5623:case 6135:case 4599:case 4855:case 4215:case 6389:case 5109:case 5365:case 5621:case 3829:return N+e+e;case 5349:case 4246:case 4810:case 6968:case 2756:return N+e+we+e+B+e+e;case 6828:case 4268:return N+e+B+e+e;case 6165:return N+e+B+"flex-"+e+e;case 5187:return N+e+O(e,/(\w+).+(:[^]+)/,N+"box-$1$2"+B+"flex-$1$2")+e;case 5443:return N+e+B+"flex-item-"+O(e,/flex-|-self/,"")+e;case 4675:return N+e+B+"flex-line-pack"+O(e,/align-content|flex-|-self/,"")+e;case 5548:return N+e+B+O(e,"shrink","negative")+e;case 5292:return N+e+B+O(e,"basis","preferred-size")+e;case 6060:return N+"box-"+O(e,"-grow","")+N+e+B+O(e,"grow","positive")+e;case 4554:return N+O(e,/([^-])(transform)/g,"$1"+N+"$2")+e;case 6187:return O(O(O(e,/(zoom-|grab)/,N+"$1"),/(image-set)/,N+"$1"),e,"")+e;case 5495:case 3959:return O(e,/(image-set\([^]*)/,N+"$1$`$1");case 4968:return O(O(e,/(.+:)(flex-)?(.*)/,N+"box-pack:$3"+B+"flex-pack:$3"),/s.+-b[^;]+/,"justify")+N+e+e;case 4095:case 3583:case 4068:case 2532:return O(e,/(.+)-inline(.+)/,N+"$1$2")+e;case 8116:case 7059:case 5753:case 5535:case 5445:case 5701:case 4933:case 4677:case 5533:case 5789:case 5021:case 4765:if(X(e)-1-t>6)switch(W(e,t+1)){case 109:if(W(e,t+4)!==45)break;case 102:return O(e,/(.+:)(.+)-([^]+)/,"$1"+N+"$2-$3$1"+we+(W(e,t+3)==108?"$3":"$2-$3"))+e;case 115:return~Le(e,"stretch")?lt(O(e,"stretch","fill-available"),t)+e:e}break;case 4949:if(W(e,t+1)!==115)break;case 6444:switch(W(e,X(e)-3-(~Le(e,"!important")&&10))){case 107:return O(e,":",":"+N)+e;case 101:return O(e,/(.+:)([^;!]+)(;|!.+)?/,"$1"+N+(W(e,14)===45?"inline-":"")+"box$3$1"+N+"$2$3$1"+B+"$2box$3")+e}break;case 5936:switch(W(e,t+11)){case 114:return N+e+B+O(e,/[svh]\w+-[tblr]{2}/,"tb")+e;case 108:return N+e+B+O(e,/[svh]\w+-[tblr]{2}/,"tb-rl")+e;case 45:return N+e+B+O(e,/[svh]\w+-[tblr]{2}/,"lr")+e}return N+e+B+e+e}return e}var yr=function(t,n,a,s){if(t.length>-1&&!t.return)switch(t.type){case Me:t.return=lt(t.value,t.length);break;case tt:return se([fe(t,{value:O(t.value,"@","@"+N)})],s);case De:if(t.length)return rr(t.props,function(i){switch(tr(i,/(::plac\w+|:read-\w+)/)){case":read-only":case":read-write":return se([fe(t,{props:[O(i,/:(read-\w+)/,":"+we+"$1")]})],s);case"::placeholder":return se([fe(t,{props:[O(i,/:(plac\w+)/,":"+N+"input-$1")]}),fe(t,{props:[O(i,/:(plac\w+)/,":"+we+"$1")]}),fe(t,{props:[O(i,/:(plac\w+)/,B+"input-$1")]})],s)}return""})}},wr=[yr],Sr=function(t){var n=t.key;if(n==="css"){var a=document.querySelectorAll("style[data-emotion]:not([data-s])");Array.prototype.forEach.call(a,function(g){var j=g.getAttribute("data-emotion");j.indexOf(" ")!==-1&&(document.head.appendChild(g),g.setAttribute("data-s",""))})}var s=t.stylisPlugins||wr,i={},u,h=[];u=t.container||document.head,Array.prototype.forEach.call(document.querySelectorAll('style[data-emotion^="'+n+' "]'),function(g){for(var j=g.getAttribute("data-emotion").split(" "),P=1;P<j.length;P++)i[j[P]]=!0;h.push(g)});var l,m=[vr,br];{var f,x=[dr,hr(function(g){f.insert(g)})],E=fr(m.concat(s,x)),M=function(j){return se(lr(j),E)};l=function(j,P,T,z){f=T,M(j?j+"{"+P.styles+"}":P.styles),z&&($.inserted[P.name]=!0)}}var $={key:n,sheet:new Kt({key:n,container:u,nonce:t.nonce,speedy:t.speedy,prepend:t.prepend,insertionPoint:t.insertionPoint}),nonce:t.nonce,inserted:i,registered:{},insert:l};return $.sheet.hydrate(h),$};function kr(e){for(var t=0,n,a=0,s=e.length;s>=4;++a,s-=4)n=e.charCodeAt(a)&255|(e.charCodeAt(++a)&255)<<8|(e.charCodeAt(++a)&255)<<16|(e.charCodeAt(++a)&255)<<24,n=(n&65535)*1540483477+((n>>>16)*59797<<16),n^=n>>>24,t=(n&65535)*1540483477+((n>>>16)*59797<<16)^(t&65535)*1540483477+((t>>>16)*59797<<16);switch(s){case 3:t^=(e.charCodeAt(a+2)&255)<<16;case 2:t^=(e.charCodeAt(a+1)&255)<<8;case 1:t^=e.charCodeAt(a)&255,t=(t&65535)*1540483477+((t>>>16)*59797<<16)}return t^=t>>>13,t=(t&65535)*1540483477+((t>>>16)*59797<<16),((t^t>>>15)>>>0).toString(36)}var Cr={animationIterationCount:1,aspectRatio:1,borderImageOutset:1,borderImageSlice:1,borderImageWidth:1,boxFlex:1,boxFlexGroup:1,boxOrdinalGroup:1,columnCount:1,columns:1,flex:1,flexGrow:1,flexPositive:1,flexShrink:1,flexNegative:1,flexOrder:1,gridRow:1,gridRowEnd:1,gridRowSpan:1,gridRowStart:1,gridColumn:1,gridColumnEnd:1,gridColumnSpan:1,gridColumnStart:1,msGridRow:1,msGridRowSpan:1,msGridColumn:1,msGridColumnSpan:1,fontWeight:1,lineHeight:1,opacity:1,order:1,orphans:1,scale:1,tabSize:1,widows:1,zIndex:1,zoom:1,WebkitLineClamp:1,fillOpacity:1,floodOpacity:1,stopOpacity:1,strokeDasharray:1,strokeDashoffset:1,strokeMiterlimit:1,strokeOpacity:1,strokeWidth:1},Er=!1,jr=/[A-Z]|^ms/g,Tr=/_EMO_([^_]+?)_([^]*?)_EMO_/g,ut=function(t){return t.charCodeAt(1)===45},dt=function(t){return t!=null&&typeof t!="boolean"},We=pr(function(e){return ut(e)?e:e.replace(jr,"-$&").toLowerCase()}),ft=function(t,n){switch(t){case"animation":case"animationName":if(typeof n=="string")return n.replace(Tr,function(a,s,i){return Q={name:s,styles:i,next:Q},s})}return Cr[t]!==1&&!ut(t)&&typeof n=="number"&&n!==0?n+"px":n},Rr="Component selectors can only be used in conjunction with @emotion/babel-plugin, the swc Emotion plugin, or another Emotion-aware compiler transform.";function me(e,t,n){if(n==null)return"";var a=n;if(a.__emotion_styles!==void 0)return a;switch(typeof n){case"boolean":return"";case"object":{var s=n;if(s.anim===1)return Q={name:s.name,styles:s.styles,next:Q},s.name;var i=n;if(i.styles!==void 0){var u=i.next;if(u!==void 0)for(;u!==void 0;)Q={name:u.name,styles:u.styles,next:Q},u=u.next;var h=i.styles+";";return h}return _r(e,t,n)}case"function":{if(e!==void 0){var l=Q,m=n(e);return Q=l,me(e,t,m)}break}}var f=n;if(t==null)return f;var x=t[f];return x!==void 0?x:f}function _r(e,t,n){var a="";if(Array.isArray(n))for(var s=0;s<n.length;s++)a+=me(e,t,n[s])+";";else for(var i in n){var u=n[i];if(typeof u!="object"){var h=u;t!=null&&t[h]!==void 0?a+=i+"{"+t[h]+"}":dt(h)&&(a+=We(i)+":"+ft(i,h)+";")}else{if(i==="NO_COMPONENT_SELECTOR"&&Er)throw new Error(Rr);if(Array.isArray(u)&&typeof u[0]=="string"&&(t==null||t[u[0]]===void 0))for(var l=0;l<u.length;l++)dt(u[l])&&(a+=We(i)+":"+ft(i,u[l])+";");else{var m=me(e,t,u);switch(i){case"animation":case"animationName":{a+=We(i)+":"+m+";";break}default:a+=i+"{"+m+"}"}}}}return a}var ht=/label:\s*([^\s;{]+)\s*(;|$)/g,Q;function Be(e,t,n){if(e.length===1&&typeof e[0]=="object"&&e[0]!==null&&e[0].styles!==void 0)return e[0];var a=!0,s="";Q=void 0;var i=e[0];if(i==null||i.raw===void 0)a=!1,s+=me(n,t,i);else{var u=i;s+=u[0]}for(var h=1;h<e.length;h++)if(s+=me(n,t,e[h]),a){var l=i;s+=l[h]}ht.lastIndex=0;for(var m="",f;(f=ht.exec(s))!==null;)m+="-"+f[1];var x=kr(s)+m;return{name:x,styles:s,next:Q}}var Nr=!0;function pt(e,t,n){var a="";return n.split(" ").forEach(function(s){e[s]!==void 0?t.push(e[s]+";"):s&&(a+=s+" ")}),a}var Or=function(t,n,a){var s=t.key+"-"+n.name;(a===!1||Nr===!1)&&t.registered[s]===void 0&&(t.registered[s]=n.styles)},Pr=function(t,n,a){Or(t,n,a);var s=t.key+"-"+n.name;if(t.inserted[n.name]===void 0){var i=n;do t.insert(n===i?"."+s:"",i,t.sheet,!0),i=i.next;while(i!==void 0)}};function mt(e,t){if(e.inserted[t.name]===void 0)return e.insert("",t,e.sheet,!0)}function gt(e,t,n){var a=[],s=pt(e,a,n);return a.length<2?n:s+t(a)}var Ar=function(t){var n=Sr(t);n.sheet.speedy=function(h){this.isSpeedy=h},n.compat=!0;var a=function(){for(var l=arguments.length,m=new Array(l),f=0;f<l;f++)m[f]=arguments[f];var x=Be(m,n.registered,void 0);return Pr(n,x,!1),n.key+"-"+x.name},s=function(){for(var l=arguments.length,m=new Array(l),f=0;f<l;f++)m[f]=arguments[f];var x=Be(m,n.registered),E="animation-"+x.name;return mt(n,{name:x.name,styles:"@keyframes "+E+"{"+x.styles+"}"}),E},i=function(){for(var l=arguments.length,m=new Array(l),f=0;f<l;f++)m[f]=arguments[f];var x=Be(m,n.registered);mt(n,x)},u=function(){for(var l=arguments.length,m=new Array(l),f=0;f<l;f++)m[f]=arguments[f];return gt(n.registered,a,$r(m))};return{css:a,cx:u,injectGlobal:i,keyframes:s,hydrate:function(l){l.forEach(function(m){n.inserted[m]=!0})},flush:function(){n.registered={},n.inserted={},n.sheet.flush()},sheet:n.sheet,cache:n,getRegisteredStyles:pt.bind(null,n.registered),merge:gt.bind(null,n.registered,a)}},$r=function e(t){for(var n="",a=0;a<t.length;a++){var s=t[a];if(s!=null){var i=void 0;switch(typeof s){case"boolean":break;case"object":{if(Array.isArray(s))i=e(s);else{i="";for(var u in s)s[u]&&u&&(i&&(i+=" "),i+=u)}break}default:i=s}i&&(n&&(n+=" "),n+=i)}}return n},xt=Ar({key:"css"}),ge=xt.cx,v=xt.css;class Dr{constructor(t={}){this.state="closed",this.failureCount=0,this.lastFailureTime=null,this.successCount=0,this.failureThreshold=t.failureThreshold||5,this.timeout=t.timeout||6e4}canExecute(){return this.state==="closed"?!0:this.state==="open"?this.lastFailureTime&&Date.now()-this.lastFailureTime>=this.timeout?(this.state="half-open",this.successCount=0,console.log("[CircuitBreaker] Transitioning to half-open state"),!0):!1:!0}recordSuccess(){this.failureCount=0,this.state==="half-open"&&(this.successCount++,this.successCount>=2&&(this.state="closed",console.log("[CircuitBreaker] Circuit closed - service recovered")))}recordFailure(){if(this.failureCount++,this.lastFailureTime=Date.now(),this.state==="half-open"){this.state="open",console.log("[CircuitBreaker] Half-open failure - reopening circuit");return}this.failureCount>=this.failureThreshold&&this.state==="closed"&&(this.state="open",console.log(`[CircuitBreaker] Failure threshold reached (${this.failureCount}/${this.failureThreshold}) - opening circuit`))}getState(){return this.state}getFailureCount(){return this.failureCount}reset(){this.state="closed",this.failureCount=0,this.successCount=0,this.lastFailureTime=null}}class Mr{constructor(t={}){this.breakers=new Map,this.config=t}getBreaker(t){return this.breakers.has(t)||this.breakers.set(t,new Dr(this.config)),this.breakers.get(t)}canExecute(t){return this.getBreaker(t).canExecute()}recordSuccess(t){this.getBreaker(t).recordSuccess()}recordFailure(t){this.getBreaker(t).recordFailure()}getAllStates(){const t={};return this.breakers.forEach((n,a)=>{t[a]=n.getState()}),t}resetAll(){this.breakers.forEach(t=>{t.reset()})}reset(t){var n;(n=this.breakers.get(t))==null||n.reset()}}const _e=new Mr({failureThreshold:5,timeout:6e4});function vt(e){if(e instanceof TypeError){const t=e.message.toLowerCase();return t.includes("failed to fetch")||t.includes("network")||t.includes("timeout")||t.includes("connection")||t.includes("refused")}if(e instanceof Error){const t=e.message.toLowerCase();return t.includes("econnrefused")||t.includes("econnreset")||t.includes("etimedout")||t.includes("ehostunreach")||t.includes("enetunreach")}return!1}function Lr(e,t){const n=Math.min(t.initialDelay*Math.pow(t.backoffMultiplier,e),t.maxDelay);if(!t.jitter)return n;const a=Math.random()*(n*.5);return n+a}async function Fr(e,t="unknown",n={}){const a={maxAttempts:n.maxAttempts||3,initialDelay:n.initialDelay||1e3,maxDelay:n.maxDelay||32e3,backoffMultiplier:n.backoffMultiplier||2,jitter:n.jitter!==!1},s=Date.now();let i=null;for(let u=0;u<a.maxAttempts;u++){if(!_e.canExecute(t)){const h=new Error(`Circuit breaker open for ${t}`);return console.warn(`[Retry] ${h.message}`),{data:null,error:h,attempts:u+1,totalDuration:Date.now()-s,success:!1}}try{const h=await e();return _e.recordSuccess(t),{data:h,error:null,attempts:u+1,totalDuration:Date.now()-s,success:!0}}catch(h){if(i=h instanceof Error?h:new Error(String(h)),!vt(h)||u===a.maxAttempts-1)return _e.recordFailure(t),console.error(`[Retry] Failed after ${u+1} attempt(s) for ${t}:`,i.message),{data:null,error:i,attempts:u+1,totalDuration:Date.now()-s,success:!1};const m=Lr(u,a);console.warn(`[Retry] Attempt ${u+1} failed for ${t}, retrying in ${Math.round(m)}ms:`,i.message),await new Promise(f=>setTimeout(f,m))}}return _e.recordFailure(t),{data:null,error:i||new Error("Unknown error"),attempts:a.maxAttempts,totalDuration:Date.now()-s,success:!1}}const Ir="http://localhost:9000/api";class Wr{static async handle(t){const n=await t.json().catch(()=>({error:"Unknown error"}));return t.status===401?{status:t.status,message:"Your session has expired. Please login again.",isTokenExpired:!0}:t.status===429?{status:t.status,message:"Too many requests. Please wait a moment and try again.",isTokenExpired:!1}:t.status===403?{status:t.status,message:"Access forbidden. Your account may be locked due to failed login attempts.",isTokenExpired:!1}:{status:t.status,message:n.error||`API error: ${t.statusText}`,isTokenExpired:!1}}}let Br=null;async function S(e,t={}){const{body:n,serviceName:a="backend-api",...s}=t,i=localStorage.getItem("access_token"),u={"Content-Type":"application/json",...i?{Authorization:`Bearer ${i}`}:{},...s.headers},h={...s,headers:u};return n&&(h.body=JSON.stringify(n)),Fr(async()=>{const l=await fetch(`${Ir}${e}`,h);if(!l.ok){const m=await Wr.handle(l);m.isTokenExpired&&(localStorage.removeItem("access_token"),localStorage.removeItem("user"));const f=new Error(m.message);throw f.status=m.status,f.isTokenExpired=m.isTokenExpired,!vt(f)&&m.status!==503,f}return await l.json()},a,{maxAttempts:3,initialDelay:1e3,maxDelay:8e3}).then(l=>{if(l.success&&l.data)return l.data;throw l.error||new Error("Failed to fetch data")})}const q={auth:{login:(e,t)=>S("/auth/login",{method:"POST",body:{username:e,password:t}}),register:(e,t,n)=>S("/auth/register",{method:"POST",body:{username:e,email:t,password:n}}),refresh:()=>S("/auth/refresh",{method:"POST"})},incidents:{list:()=>S("/incidents"),get:e=>S(`/incidents/${e}`),create:e=>S("/incidents",{method:"POST",body:e}),update:(e,t)=>S(`/incidents/${e}`,{method:"PATCH",body:t}),getTimeline:e=>S(`/incidents/${e}/timeline`),getCorrelations:e=>S(`/incidents/${e}/correlations`)},services:{list:()=>S("/services"),get:e=>S(`/services/${e}`),create:e=>S("/services",{method:"POST",body:e}),update:(e,t)=>S(`/services/${e}`,{method:"PATCH",body:t})},slos:{list:()=>S("/slos"),get:e=>S(`/slos/${e}`),create:e=>S("/slos",{method:"POST",body:e}),update:(e,t)=>S(`/slos/${e}`,{method:"PATCH",body:t}),delete:e=>S(`/slos/${e}`,{method:"DELETE"}),calculate:e=>S(`/slos/${e}/calculate`,{method:"POST"}),getHistory:e=>S(`/slos/${e}/history`)},metrics:{getAvailability:e=>S(`/metrics/availability/${e}`),getErrorRate:e=>S(`/metrics/error-rate/${e}`),getLatency:e=>S(`/metrics/latency/${e}`)},kubernetes:{getPods:(e,t)=>S(`/kubernetes/pods/${e}/${t}`),getDeployments:(e,t)=>S(`/kubernetes/deployments/${e}/${t}`),getEvents:(e,t)=>S(`/kubernetes/events/${e}/${t}`)},logs:{getErrors:e=>S(`/logs/${e}/errors`),search:(e,t)=>S(`/logs/${e}/search?q=${encodeURIComponent(t)}`)},detection:{getRules:()=>S("/detection/rules"),getStatus:()=>S("/detection/status")},investigation:{getHypotheses:e=>S(`/incidents/${e}/investigation/hypotheses`),createHypothesis:(e,t)=>S(`/incidents/${e}/investigation/hypotheses`,{method:"POST",body:t}),getSteps:e=>S(`/incidents/${e}/investigation/steps`),createStep:(e,t)=>S(`/incidents/${e}/investigation/steps`,{method:"POST",body:t}),getRCA:e=>S(`/incidents/${e}/investigation/rca`),getRecommendedActions:e=>S(`/incidents/${e}/investigation/recommended-actions`)}},zr=({healthCheckInterval:e=6e4,healthEndpoint:t="/api/health",showDetails:n=!0})=>{const[a,s]=C.useState(null),[i,u]=C.useState(!0),[h,l]=C.useState(!1),[m,f]=C.useState(null),x=async()=>{try{const g=await fetch(t);if(!g.ok)throw new Error(`Health check failed: ${g.status}`);const j=await g.json();s(j),f(new Date),u(!1)}catch(g){console.error("[HealthIndicator] Failed to check health:",g),s({status:"unhealthy",components:[{name:"system",status:"unhealthy",message:g instanceof Error?g.message:"Unknown error",responseTime:0}],timestamp:Date.now()}),u(!1)}};if(C.useEffect(()=>{x();const g=setInterval(x,e);return()=>clearInterval(g)},[e,t]),!a)return null;const E=g=>{switch(g){case"healthy":return"#10b981";case"degraded":return"#f59e0b";case"unhealthy":return"#ef4444";default:return"#6b7280"}},M=g=>{switch(g){case"healthy":return"✓";case"degraded":return"⚠";case"unhealthy":return"✕";default:return"?"}},$=m?Math.round((Date.now()-m.getTime())/1e3):"unknown";return o.jsxs("div",{className:"health-indicator-container",style:{position:"relative",display:"inline-block",marginRight:"16px"},children:[o.jsxs("div",{className:"health-indicator",onClick:()=>l(!h),title:`System Status: ${a.status}`,style:{display:"inline-flex",alignItems:"center",gap:"8px",padding:"8px 12px",borderRadius:"6px",backgroundColor:"rgba(0, 0, 0, 0.05)",cursor:"pointer",transition:"all 0.2s",border:`2px solid ${E(a.status)}`},onMouseEnter:g=>{g.currentTarget.style.backgroundColor="rgba(0, 0, 0, 0.1)"},onMouseLeave:g=>{g.currentTarget.style.backgroundColor="rgba(0, 0, 0, 0.05)"},children:[o.jsxs("div",{style:{display:"inline-flex",alignItems:"center",justifyContent:"center",width:"20px",height:"20px",borderRadius:"50%",backgroundColor:E(a.status),color:"white",fontSize:"12px",fontWeight:"bold",position:"relative"},children:[M(a.status),(a.status==="degraded"||a.status==="unhealthy")&&o.jsx("div",{style:{position:"absolute",inset:"-4px",borderRadius:"50%",border:`2px solid ${E(a.status)}`,opacity:.5,animation:"pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite"}})]}),o.jsx("span",{style:{fontSize:"13px",fontWeight:"500",textTransform:"capitalize",color:"#1f2937"},children:a.status}),o.jsxs("span",{style:{fontSize:"11px",color:"#6b7280",marginLeft:"4px"},children:[$,"s ago"]})]}),n&&h&&o.jsxs("div",{className:"health-popup",style:{position:"absolute",top:"100%",right:0,marginTop:"8px",backgroundColor:"white",border:"1px solid #e5e7eb",borderRadius:"8px",boxShadow:"0 10px 25px -5px rgba(0, 0, 0, 0.1)",zIndex:1e3,minWidth:"300px",maxWidth:"400px"},children:[o.jsx("div",{style:{padding:"12px 16px",borderBottom:"1px solid #e5e7eb",fontWeight:"600",color:"#1f2937",fontSize:"14px"},children:"System Health Status"}),o.jsx("div",{style:{padding:"8px 0"},children:(a.components||[]).map((g,j)=>o.jsxs("div",{style:{padding:"8px 16px",borderBottom:j<(a.components||[]).length-1?"1px solid #f3f4f6":"none",display:"flex",alignItems:"center",gap:"8px"},children:[o.jsx("div",{style:{width:"12px",height:"12px",borderRadius:"50%",backgroundColor:E(g.status),flexShrink:0}}),o.jsxs("div",{style:{flex:1},children:[o.jsx("div",{style:{fontSize:"13px",fontWeight:"500",color:"#1f2937",textTransform:"capitalize"},children:g.name}),o.jsx("div",{style:{fontSize:"11px",color:"#6b7280",marginTop:"2px",wordBreak:"break-word"},children:g.message||g.status}),g.responseTime>0&&o.jsxs("div",{style:{fontSize:"10px",color:"#9ca3af",marginTop:"2px"},children:["\\n                      Response: ",g.responseTime,"ms"]})]}),o.jsx("div",{style:{fontSize:"11px",padding:"2px 6px",borderRadius:"3px",backgroundColor:`${E(g.status)}20`,color:E(g.status),fontWeight:"600",textTransform:"uppercase",flexShrink:0},children:g.status==="unknown"?"?":M(g.status)})]},g.name))}),o.jsxs("div",{style:{padding:"8px 16px",borderTop:"1px solid #e5e7eb",fontSize:"11px",color:"#6b7280",display:"flex",justifyContent:"space-between"},children:[o.jsxs("span",{children:["Last checked: ",m==null?void 0:m.toLocaleTimeString()]}),o.jsx("button",{onClick:()=>{x(),l(!1)},style:{background:"none",border:"none",color:"#3b82f6",cursor:"pointer",fontSize:"11px",fontWeight:"500",padding:0},children:"Refresh"})]})]}),o.jsx("style",{children:`
        @keyframes pulse {
          0%, 100% {
            opacity: 0.5;
          }
          50% {
            opacity: 0;
          }
        }
      `})]})};function Hr({url:e="ws://localhost:9000/api/realtime",onIncidentCreated:t,onIncidentUpdated:n,onCorrelationFound:a,onAlert:s}={}){const[i,u]=C.useState(!1),[h,l]=C.useState(null),[m,f]=C.useState(null),[x,E]=C.useState(null);C.useEffect(()=>{const $=new WebSocket(e);return $.onopen=()=>{console.log("[WebSocket] Connected to realtime server"),u(!0),f(null)},$.onmessage=g=>{try{const j=JSON.parse(g.data);switch(l(j),j.type){case"incident_created":t==null||t(j.payload);break;case"incident_updated":n==null||n(j.payload);break;case"correlation_found":a==null||a(j.payload);break;case"alert":s==null||s(j.payload);break;default:console.log("[WebSocket] Unknown message type:",j.type)}}catch(j){console.error("[WebSocket] Failed to parse message:",j)}},$.onerror=g=>{console.error("[WebSocket] Error:",g),f("WebSocket connection error"),u(!1)},$.onclose=()=>{console.log("[WebSocket] Connection closed"),u(!1),setTimeout(()=>{console.log("[WebSocket] Attempting reconnection...")},5e3)},E($),()=>{$.readyState===WebSocket.OPEN&&$.close()}},[e]);const M=C.useCallback($=>{(x==null?void 0:x.readyState)===WebSocket.OPEN?x.send(JSON.stringify($)):console.warn("[WebSocket] Cannot send - not connected")},[x]);return{connected:i,lastMessage:h,error:m,send:M}}const b={bg:"#0d0e12",surface:"#16191d",surfaceHeader:"#1c1f24",border:"#2a2d33",text:"#d1d2d3",textMuted:"#8b8e92",healthy:"#4caf50",warning:"#ff9800",critical:"#f44336",fontFamily:'"Inter", "Segoe UI", Roboto, Helvetica, Arial, sans-serif',monoFont:'"JetBrains Mono", "SFMono-Regular", Consolas, monospace'},d={appContainer:v`
    background-color: ${b.bg};
    color: ${b.text};
    font-family: ${b.fontFamily};
    min-height: 100vh;
    font-size: 13px;
  `,header:v`
    height: 44px;
    background-color: ${b.surfaceHeader};
    border-bottom: 1px solid ${b.border};
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 20px;
  `,flexCenter:v`
    display: flex;
    align-items: center;
    gap: 12px;
  `,brand:v`
    font-weight: 700;
    color: #fff;
    font-size: 15px;
  `,divider:v`
    color: ${b.border};
  `,metaItem:v`
    font-size: 11px;
    color: ${b.textMuted};
    text-transform: uppercase;
    font-weight: 500;
  `,metaHigh:v`
    color: ${b.text};
    text-transform: none;
    font-weight: 600;
  `,contentWrapper:v`
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 20px;
    max-width: 1400px;
    margin: 0 auto;
  `,kpiGrid:v`
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
  `,kpiBox:v`
    background: ${b.surface};
    border: 1px solid ${b.border};
    padding: 16px;
    border-radius: 4px;
    display: flex;
    flex-direction: column;
    gap: 4px;
    align-items: center;
  `,kpiLabel:v`
    font-size: 11px;
    font-weight: 600;
    color: ${b.textMuted};
    text-transform: uppercase;
  `,kpiValue:v`
    font-size: 22px;
    font-weight: 700;
  `,mainBoard:v`
    display: grid;
    grid-template-columns: 320px 1fr;
    gap: 20px;
    min-height: 480px;
  `,rightColumn:v`
    display: flex;
    flex-direction: column;
    gap: 20px;
  `,panel:v`
    background: ${b.surface};
    border: 1px solid ${b.border};
    border-radius: 4px;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  `,panelHeader:v`
    background: ${b.surfaceHeader};
    padding: 10px 16px;
    border-bottom: 1px solid ${b.border};
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    color: ${b.textMuted};
  `,incidentList:v`
    flex: 1;
    overflow-y: auto;
    padding: 8px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  `,incidentCard:v`
    background: rgba(0, 0, 0, 0.2);
    border: 1px solid ${b.border};
    border-radius: 4px;
    padding: 12px;
    cursor: pointer;
    transition: all 0.2s;
    &:hover {
      background: rgba(0, 0, 0, 0.4);
      border-color: ${b.healthy};
    }
  `,incidentCardSelected:v`
    background: rgba(76, 175, 80, 0.1);
    border-color: ${b.healthy};
  `,incidentHeader:v`
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;
  `,severityDot:v`
    width: 8px;
    height: 8px;
    border-radius: 50%;
  `,incidentTitle:v`
    font-size: 12px;
    font-weight: 600;
  `,incidentMeta:v`
    display: flex;
    gap: 12px;
    font-size: 11px;
    color: ${b.textMuted};
  `,incidentTime:v`
    font-size: 10px;
    color: ${b.textMuted};
    font-family: ${b.monoFont};
  `,detailsContent:v`
    padding: 16px;
    flex: 1;
  `,detailsGrid:v`
    display: flex;
    flex-direction: column;
    gap: 12px;
  `,detailRow:v`
    display: flex;
    justify-content: space-between;
    padding: 8px 0;
    border-bottom: 1px solid ${b.border};
  `,detailLabel:v`
    font-size: 11px;
    color: ${b.textMuted};
    text-transform: uppercase;
    font-weight: 600;
  `,detailValue:v`
    font-size: 12px;
    color: ${b.text};
    font-family: ${b.monoFont};
  `,timelineContent:v`
    padding: 16px;
    flex: 1;
    max-height: 300px;
    overflow-y: auto;
  `,timelineList:v`
    display: flex;
    flex-direction: column;
    gap: 12px;
  `,timelineEvent:v`
    display: grid;
    grid-template-columns: 80px 120px 1fr;
    gap: 12px;
    padding: 8px;
    background: rgba(0, 0, 0, 0.2);
    border-radius: 4px;
    font-size: 11px;
  `,timelineTime:v`
    color: ${b.textMuted};
    font-family: ${b.monoFont};
  `,timelineSource:v`
    color: ${b.healthy};
    font-weight: 600;
  `,timelineMessage:v`
    color: ${b.text};
  `,emptyContent:v`
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 40px;
  `,tabBar:v`
    display: flex;
    background: ${b.surfaceHeader};
    border-bottom: 1px solid ${b.border};
  `,tabBtn:v`
    background: none;
    border: none;
    border-right: 1px solid ${b.border};
    padding: 12px 24px;
    color: ${b.textMuted};
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    &:hover {
      background: #22252a;
      color: #fff;
    }
  `,tabActive:v`
    background: ${b.surface};
    color: #fff;
    border-bottom: 2px solid ${b.healthy};
  `,consoleBody:v`
    padding: 24px;
    background: #090a0d;
    min-height: 200px;
  `,consolePlaceholder:v`
    font-family: ${b.monoFont};
  `,consoleText:v`
    color: ${b.text};
    font-size: 11px;
    margin: 0;
  `,textHealthy:v`
    color: ${b.healthy};
  `,textWarning:v`
    color: ${b.warning};
  `,textCritical:v`
    color: ${b.critical};
  `,textMuted:v`
    color: ${b.textMuted};
  `,actionBtn:v`
    background: ${b.healthy};
    color: #fff;
    border: none;
    padding: 4px 12px;
    border-radius: 4px;
    font-size: 11px;
    font-weight: 600;
    cursor: pointer;
    &:hover {
      opacity: 0.9;
    }
  `,correlationList:v`
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-top: 8px;
  `,correlationItem:v`
    background: rgba(0, 0, 0, 0.2);
    padding: 8px;
    border-radius: 4px;
    font-size: 11px;
    border-left: 2px solid ${b.healthy};
  `},Yr=({onLogin:e})=>{const[t,n]=C.useState(""),[a,s]=C.useState(""),[i,u]=C.useState(""),[h,l]=C.useState(!1),m=async f=>{f.preventDefault(),l(!0),u("");try{const x=await fetch("http://localhost:9000/api/auth/login",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({username:t,password:a})}),E=await x.json();if(!x.ok)throw new Error(E.error||"Login failed");e(E.token,E.user)}catch(x){u(x.message)}finally{l(!1)}};return o.jsx("div",{className:v`
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100vh;
      background: ${b.bg};
    `,children:o.jsxs("form",{onSubmit:m,className:v`
        background: ${b.surface};
        padding: 40px;
        border-radius: 8px;
        border: 1px solid ${b.border};
        width: 100%;
        max-width: 400px;
        display: flex;
        flex-direction: column;
        gap: 20px;
      `,children:[o.jsx("h2",{className:d.brand,children:"Reliability Studio Login"}),i&&o.jsx("div",{className:d.textCritical,children:i}),o.jsx("input",{type:"text",placeholder:"Username or Email",value:t,onChange:f=>n(f.target.value),className:v`
            padding: 12px;
            background: #000;
            border: 1px solid ${b.border};
            color: #fff;
            border-radius: 4px;
          `}),o.jsx("input",{type:"password",placeholder:"Password",value:a,onChange:f=>s(f.target.value),className:v`
            padding: 12px;
            background: #000;
            border: 1px solid ${b.border};
            color: #fff;
            border-radius: 4px;
          `}),o.jsx("button",{type:"submit",disabled:h,className:ge(d.actionBtn,v`padding: 12px; font-size: 14px;`),children:h?"Logging in...":"Sign In"}),o.jsx("div",{className:d.textMuted,style:{fontSize:"11px",textAlign:"center"},children:"Default: admin / (see seed data)"})]})})},bt=({user:e,onLogout:t})=>{const[n,a]=C.useState(new Date);return C.useEffect(()=>{const s=setInterval(()=>a(new Date),1e3);return()=>clearInterval(s)},[]),o.jsxs("header",{className:d.header,children:[o.jsxs("div",{className:d.flexCenter,children:[o.jsx("span",{className:d.brand,children:"Reliability Studio"}),o.jsx("span",{className:d.divider,children:"|"}),o.jsxs("span",{className:d.metaItem,children:["Env: ",o.jsx("span",{className:d.metaHigh,children:"Monitoring"})]}),o.jsx("span",{className:d.divider,children:"|"}),o.jsxs("span",{className:d.metaItem,children:["Local Time: ",o.jsx("span",{className:d.metaHigh,children:n.toLocaleTimeString()})]})]}),o.jsxs("div",{className:d.flexCenter,children:[o.jsx(zr,{healthCheckInterval:6e4,showDetails:!0}),e&&o.jsxs("div",{className:d.flexCenter,children:[o.jsx("span",{className:d.metaItem,children:e.username}),o.jsx("span",{className:d.divider,children:"|"}),o.jsx("button",{onClick:t,className:v`
                background: none;
                border: none;
                color: ${b.textMuted};
                cursor: pointer;
                font-size: 11px;
                &:hover { color: #fff; }
              `,children:"LOGOUT"})]})]})]})},Ur=({data:e})=>{if(!e||e.length<2)return null;const t=Math.min(...e),a=Math.max(...e)-t||1,s=100,i=30,u=e.map((h,l)=>{const m=l/(e.length-1)*s,f=i-(h-t)/a*i;return`${m},${f}`}).join(" ");return o.jsx("svg",{width:s,height:i,style:{marginTop:"8px"},children:o.jsx("polyline",{fill:"none",stroke:b.healthy,strokeWidth:"1.5",points:u})})},Vr=({slo:e})=>{const[t,n]=C.useState([]);return C.useEffect(()=>{q.slos.getHistory(e.id).then(a=>{Array.isArray(a)&&n(a.map(s=>s.value))}).catch(console.error)},[e.id]),o.jsxs("div",{className:d.kpiBox,children:[o.jsx("span",{className:d.kpiLabel,children:e.name}),o.jsxs("span",{className:ge(d.kpiValue,e.status==="healthy"?d.textHealthy:d.textCritical),children:[e.current_percentage.toFixed(2),"%"]}),o.jsxs("span",{className:d.metaItem,children:["Budget: ",e.error_budget_remaining.toFixed(1),"%"]}),o.jsx(Ur,{data:t})]})},Gr=({incident:e,isSelected:t,onClick:n})=>{const a=e.severity==="critical"?b.critical:e.severity==="high"||e.severity==="medium"?b.warning:b.healthy;return o.jsxs("div",{className:ge(d.incidentCard,t&&d.incidentCardSelected),onClick:n,children:[o.jsxs("div",{className:d.incidentHeader,children:[o.jsx("span",{className:d.severityDot,style:{backgroundColor:a}}),o.jsx("span",{className:d.incidentTitle,children:e.title})]}),o.jsxs("div",{className:d.incidentMeta,children:[o.jsx("span",{children:e.service}),o.jsx("span",{className:ge(e.status==="open"||e.status==="investigating"?d.textCritical:d.textHealthy),children:e.status})]}),o.jsx("div",{className:d.incidentTime,children:new Date(e.started_at).toLocaleString()})]})},Jr=({incidents:e,selectedIncident:t,onSelectIncident:n,timeline:a,correlations:s})=>o.jsxs("div",{className:d.mainBoard,children:[o.jsxs("div",{className:d.panel,children:[o.jsx("div",{className:d.panelHeader,children:"Active & Recent Incidents"}),o.jsx("div",{className:d.incidentList,children:Array.isArray(e)&&e.length>0?e.map(i=>o.jsx(Gr,{incident:i,isSelected:(t==null?void 0:t.id)===i.id,onClick:()=>n(i)},i.id)):o.jsx("div",{className:d.emptyContent,children:o.jsx("span",{className:d.textMuted,children:"No incidents found"})})})]}),o.jsxs("div",{className:d.rightColumn,children:[o.jsxs("div",{className:d.panel,children:[o.jsxs("div",{className:d.panelHeader,children:["Incident Context: ",(t==null?void 0:t.title)||"None Selected"]}),o.jsx("div",{className:d.detailsContent,children:t?o.jsxs("div",{className:d.detailsGrid,children:[o.jsxs("div",{className:d.detailRow,children:[o.jsx("span",{className:d.detailLabel,children:"Root Cause Analysis:"}),o.jsx("div",{style:{display:"flex",gap:"8px"},children:o.jsx("button",{className:d.actionBtn,onClick:async()=>{t&&await q.incidents.update(t.id,{status:"investigating"})},children:"Analyze"})})]}),o.jsxs("div",{className:d.detailRow,children:[o.jsx("span",{className:d.detailLabel,children:"Correlations:"}),o.jsx("div",{className:d.correlationList,children:s.length>0?s.map(i=>o.jsxs("div",{className:d.correlationItem,children:[o.jsxs("span",{className:d.textHealthy,children:["[",i.correlation_type,"]"]})," ",i.source_id," (",(i.confidence_score*100).toFixed(0),"% confidence)"]},i.id)):o.jsx("span",{className:d.textMuted,children:"No correlations detected yet"})})]})]}):o.jsx("div",{className:d.emptyContent,children:o.jsx("span",{className:d.textMuted,children:"Select an incident to view deep context"})})})]}),o.jsxs("div",{className:d.panel,children:[o.jsx("div",{className:d.panelHeader,children:"Timeline Events"}),o.jsx("div",{className:d.timelineContent,children:t?o.jsx("div",{className:d.timelineList,children:a.length>0?a.map((i,u)=>o.jsxs("div",{className:d.timelineEvent,children:[o.jsx("span",{className:d.timelineTime,children:new Date(i.created_at).toLocaleTimeString()}),o.jsx("span",{className:d.timelineSource,children:i.source}),o.jsx("span",{className:d.timelineMessage,children:i.title})]},u)):o.jsxs("div",{className:d.timelineEvent,children:[o.jsx("span",{className:d.timelineTime,children:new Date(t.started_at).toLocaleTimeString()}),o.jsx("span",{className:d.timelineSource,children:"System"}),o.jsx("span",{className:d.timelineMessage,children:"Incident reported"})]})}):o.jsx("div",{className:d.emptyContent,children:o.jsx("span",{className:d.textMuted,children:"No timeline data available"})})})]})]})]}),Kr=({selectedIncident:e})=>{const[t,n]=C.useState("Metrics"),[a,s]=C.useState(null),i=["Metrics","Logs","Traces","Kubernetes"];return C.useEffect(()=>{if(!e)return;(async()=>{if(t==="Metrics"){const h=await q.metrics.getErrorRate(e.service);s(h)}else if(t==="Logs"){const h=await q.logs.getErrors(e.service);s(h)}else if(t==="Kubernetes"){const h=await q.kubernetes.getPods("default",e.service);s(h)}else s(null)})()},[e,t]),o.jsxs("div",{className:d.panel,children:[o.jsx("div",{className:d.tabBar,children:i.map(u=>o.jsx("button",{className:ge(d.tabBtn,t===u&&d.tabActive),onClick:()=>n(u),children:u},u))}),o.jsx("div",{className:d.consoleBody,children:o.jsx("pre",{className:d.consoleText,children:a?JSON.stringify(a,null,2):`No active ${t.toLowerCase()} signal for this service...`})})]})},Xr=()=>{const[e,t]=C.useState(localStorage.getItem("token")),[n,a]=C.useState(JSON.parse(localStorage.getItem("user")||"null")),[s,i]=C.useState([]),[u,h]=C.useState([]),[l,m]=C.useState(null),[f,x]=C.useState([]),[E,M]=C.useState([]),[$,g]=C.useState(!0);C.useEffect(()=>{e&&(window.AUTH_TOKEN=e)},[e]);const j=async()=>{if(!e){g(!1);return}try{const[w,H]=await Promise.all([q.incidents.list(),q.slos.list()]);h(w||[]),i(H||[]);const Y=(w||[]).filter(R=>R.status==="open"||R.status==="active"||R.status==="investigating");if(!l&&Y.length>0){const R=Y.sort((xe,ie)=>new Date(ie.started_at).getTime()-new Date(xe.started_at).getTime())[0];m(R)}else if(!l&&w&&w.length>0){const R=[...w].sort((xe,ie)=>new Date(ie.started_at).getTime()-new Date(xe.started_at).getTime());m(R[0])}}catch(w){console.error(w),w.message&&w.message.includes("Unauthorized")&&z()}finally{g(!1)}};Hr({onIncidentCreated:w=>{console.log("[Real-time] New incident created:",w),j().then(()=>{(w.status==="open"||w.status==="active"||w.status==="investigating")&&m(w)})},onIncidentUpdated:w=>{console.log("[Real-time] Incident updated:",w),l&&l.id===w.id?(m(w),P()):j()},onCorrelationFound:w=>{console.log("[Real-time] Correlation found:",w),l&&l.id===w.incident_id&&(q.incidents.getCorrelations(l.id).then(M).catch(console.error),P())}});const P=async()=>{if(l&&e){const[w,H]=await Promise.all([q.incidents.getTimeline(l.id),q.incidents.getCorrelations(l.id)]);x(w||[]),M(H||[])}};C.useEffect(()=>{j();const w=setInterval(j,1e4);return()=>clearInterval(w)},[e]),C.useEffect(()=>{P()},[l,e]);const T=(w,H)=>{localStorage.setItem("token",w),localStorage.setItem("user",JSON.stringify(H)),t(w),a(H)},z=()=>{localStorage.removeItem("token"),localStorage.removeItem("user"),t(null),a(null)};return e?$?o.jsxs("div",{className:d.appContainer,children:[o.jsx(bt,{user:n,onLogout:z}),o.jsx("div",{className:d.contentWrapper,children:o.jsx("div",{style:{textAlign:"center",padding:"100px"},children:o.jsx("span",{className:d.textHealthy,children:"Authenticating and linking reliability matrix..."})})})]}):o.jsxs("div",{className:d.appContainer,children:[o.jsx(bt,{user:n,onLogout:z}),o.jsxs("div",{className:d.contentWrapper,children:[o.jsx("div",{className:d.kpiGrid,children:Array.isArray(s)&&s.length>0?s.map(w=>o.jsx(Vr,{slo:w},w.id)):o.jsx("div",{className:d.textMuted,style:{gridColumn:"span 4"},children:"No SLOs configured."})}),o.jsx(Jr,{incidents:u,selectedIncident:l,onSelectIncident:m,timeline:f,correlations:E}),o.jsx(Kr,{selectedIncident:l})]})]}):o.jsx(Yr,{onLogin:T})},Zr=new Ht.AppPlugin().setRootPage(Xr);Ze.plugin=Zr,Object.defineProperty(Ze,Symbol.toStringTag,{value:"Module"})});

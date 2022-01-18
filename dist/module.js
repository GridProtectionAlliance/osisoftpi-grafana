define(["@grafana/data","@grafana/runtime","@grafana/ui","lodash","react"], function(__WEBPACK_EXTERNAL_MODULE__grafana_data__, __WEBPACK_EXTERNAL_MODULE__grafana_runtime__, __WEBPACK_EXTERNAL_MODULE__grafana_ui__, __WEBPACK_EXTERNAL_MODULE_lodash__, __WEBPACK_EXTERNAL_MODULE_react__) { return /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, { enumerable: true, get: getter });
/******/ 		}
/******/ 	};
/******/
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = function(exports) {
/******/ 		if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 			Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 		}
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/
/******/ 	// create a fake namespace object
/******/ 	// mode & 1: value is a module id, require it
/******/ 	// mode & 2: merge all properties of value into the ns
/******/ 	// mode & 4: return value when already ns object
/******/ 	// mode & 8|1: behave like require
/******/ 	__webpack_require__.t = function(value, mode) {
/******/ 		if(mode & 1) value = __webpack_require__(value);
/******/ 		if(mode & 8) return value;
/******/ 		if((mode & 4) && typeof value === 'object' && value && value.__esModule) return value;
/******/ 		var ns = Object.create(null);
/******/ 		__webpack_require__.r(ns);
/******/ 		Object.defineProperty(ns, 'default', { enumerable: true, value: value });
/******/ 		if(mode & 2 && typeof value != 'string') for(var key in value) __webpack_require__.d(ns, key, function(key) { return value[key]; }.bind(null, key));
/******/ 		return ns;
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "/";
/******/
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = "./module.ts");
/******/ })
/************************************************************************/
/******/ ({

/***/ "../node_modules/tslib/tslib.es6.js":
/*!******************************************!*\
  !*** ../node_modules/tslib/tslib.es6.js ***!
  \******************************************/
/*! exports provided: __extends, __assign, __rest, __decorate, __param, __metadata, __awaiter, __generator, __createBinding, __exportStar, __values, __read, __spread, __spreadArrays, __spreadArray, __await, __asyncGenerator, __asyncDelegator, __asyncValues, __makeTemplateObject, __importStar, __importDefault, __classPrivateFieldGet, __classPrivateFieldSet */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "__extends", function() { return __extends; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "__assign", function() { return __assign; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "__rest", function() { return __rest; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "__decorate", function() { return __decorate; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "__param", function() { return __param; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "__metadata", function() { return __metadata; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "__awaiter", function() { return __awaiter; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "__generator", function() { return __generator; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "__createBinding", function() { return __createBinding; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "__exportStar", function() { return __exportStar; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "__values", function() { return __values; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "__read", function() { return __read; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "__spread", function() { return __spread; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "__spreadArrays", function() { return __spreadArrays; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "__spreadArray", function() { return __spreadArray; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "__await", function() { return __await; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "__asyncGenerator", function() { return __asyncGenerator; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "__asyncDelegator", function() { return __asyncDelegator; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "__asyncValues", function() { return __asyncValues; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "__makeTemplateObject", function() { return __makeTemplateObject; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "__importStar", function() { return __importStar; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "__importDefault", function() { return __importDefault; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "__classPrivateFieldGet", function() { return __classPrivateFieldGet; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "__classPrivateFieldSet", function() { return __classPrivateFieldSet; });
/*! *****************************************************************************
Copyright (c) Microsoft Corporation.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
***************************************************************************** */
/* global Reflect, Promise */

var extendStatics = function(d, b) {
    extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
    return extendStatics(d, b);
};

function __extends(d, b) {
    if (typeof b !== "function" && b !== null)
        throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
    extendStatics(d, b);
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
}

var __assign = function() {
    __assign = Object.assign || function __assign(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
        }
        return t;
    }
    return __assign.apply(this, arguments);
}

function __rest(s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
}

function __decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}

function __param(paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
}

function __metadata(metadataKey, metadataValue) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(metadataKey, metadataValue);
}

function __awaiter(thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
}

function __generator(thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
}

var __createBinding = Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
});

function __exportStar(m, o) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(o, p)) __createBinding(o, m, p);
}

function __values(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m) return m.call(o);
    if (o && typeof o.length === "number") return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
}

function __read(o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
}

/** @deprecated */
function __spread() {
    for (var ar = [], i = 0; i < arguments.length; i++)
        ar = ar.concat(__read(arguments[i]));
    return ar;
}

/** @deprecated */
function __spreadArrays() {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
}

function __spreadArray(to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
}

function __await(v) {
    return this instanceof __await ? (this.v = v, this) : new __await(v);
}

function __asyncGenerator(thisArg, _arguments, generator) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var g = generator.apply(thisArg, _arguments || []), i, q = [];
    return i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i;
    function verb(n) { if (g[n]) i[n] = function (v) { return new Promise(function (a, b) { q.push([n, v, a, b]) > 1 || resume(n, v); }); }; }
    function resume(n, v) { try { step(g[n](v)); } catch (e) { settle(q[0][3], e); } }
    function step(r) { r.value instanceof __await ? Promise.resolve(r.value.v).then(fulfill, reject) : settle(q[0][2], r); }
    function fulfill(value) { resume("next", value); }
    function reject(value) { resume("throw", value); }
    function settle(f, v) { if (f(v), q.shift(), q.length) resume(q[0][0], q[0][1]); }
}

function __asyncDelegator(o) {
    var i, p;
    return i = {}, verb("next"), verb("throw", function (e) { throw e; }), verb("return"), i[Symbol.iterator] = function () { return this; }, i;
    function verb(n, f) { i[n] = o[n] ? function (v) { return (p = !p) ? { value: __await(o[n](v)), done: n === "return" } : f ? f(v) : v; } : f; }
}

function __asyncValues(o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
}

function __makeTemplateObject(cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};

var __setModuleDefault = Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
};

function __importStar(mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
}

function __importDefault(mod) {
    return (mod && mod.__esModule) ? mod : { default: mod };
}

function __classPrivateFieldGet(receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
}

function __classPrivateFieldSet(receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
}


/***/ }),

/***/ "./AnnotationsQueryCtrl.ts":
/*!*********************************!*\
  !*** ./AnnotationsQueryCtrl.ts ***!
  \*********************************/
/*! exports provided: AnnotationsQueryCtrl */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "AnnotationsQueryCtrl", function() { return AnnotationsQueryCtrl; });
var AnnotationsQueryCtrl =
/** @class */
function () {
  /** @ngInject */
  function AnnotationsQueryCtrl() {
    this.annotation.query = this.annotation.query || {};
    this.annotation.databases = this.annotation.databases || [];
    this.annotation.templates = this.annotation.templates || [];
    this.annotation.regex = this.annotation.regex || {};
    this.annotation.attribute = this.annotation.attribute || {};
    this.annotation.showEndTime = this.annotation.showEndTime || false;
    this.getDatabases();
  }

  AnnotationsQueryCtrl.prototype.templateChanged = function () {};

  AnnotationsQueryCtrl.prototype.databaseChanged = function () {
    this.getEventFrames();
  };

  AnnotationsQueryCtrl.prototype.getDatabases = function () {
    var ctrl = this; // @ts-ignore

    return ctrl.datasource.getDatabases(ctrl.datasource.afserver.webid).then(function (dbs) {
      ctrl.annotation.databases = dbs;
    });
  };

  AnnotationsQueryCtrl.prototype.getEventFrames = function () {
    var ctrl = this; // @ts-ignore

    return ctrl.datasource.getEventFrameTemplates(this.annotation.database.WebId).then(function (templates) {
      ctrl.annotation.templates = templates;
    });
  };

  AnnotationsQueryCtrl.templateUrl = 'partials/annotations.editor.html';
  return AnnotationsQueryCtrl;
}();



/***/ }),

/***/ "./ConfigEditor.tsx":
/*!**************************!*\
  !*** ./ConfigEditor.tsx ***!
  \**************************/
/*! exports provided: PIWebAPIConfigEditor */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "PIWebAPIConfigEditor", function() { return PIWebAPIConfigEditor; });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! tslib */ "../node_modules/tslib/tslib.es6.js");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! react */ "react");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _grafana_ui__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @grafana/ui */ "@grafana/ui");
/* harmony import */ var _grafana_ui__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(_grafana_ui__WEBPACK_IMPORTED_MODULE_2__);



var FormField = _grafana_ui__WEBPACK_IMPORTED_MODULE_2__["LegacyForms"].FormField;

var coerceOptions = function coerceOptions(options) {
  return Object(tslib__WEBPACK_IMPORTED_MODULE_0__["__assign"])(Object(tslib__WEBPACK_IMPORTED_MODULE_0__["__assign"])({}, options), {
    jsonData: Object(tslib__WEBPACK_IMPORTED_MODULE_0__["__assign"])(Object(tslib__WEBPACK_IMPORTED_MODULE_0__["__assign"])({}, options.jsonData), {
      url: options.url
    })
  });
};

var PIWebAPIConfigEditor =
/** @class */
function (_super) {
  Object(tslib__WEBPACK_IMPORTED_MODULE_0__["__extends"])(PIWebAPIConfigEditor, _super);

  function PIWebAPIConfigEditor() {
    var _this = _super !== null && _super.apply(this, arguments) || this;

    _this.onPIServerChange = function (event) {
      var _a = _this.props,
          onOptionsChange = _a.onOptionsChange,
          options = _a.options;

      var jsonData = Object(tslib__WEBPACK_IMPORTED_MODULE_0__["__assign"])(Object(tslib__WEBPACK_IMPORTED_MODULE_0__["__assign"])({}, options.jsonData), {
        piserver: event.target.value
      });

      onOptionsChange(Object(tslib__WEBPACK_IMPORTED_MODULE_0__["__assign"])(Object(tslib__WEBPACK_IMPORTED_MODULE_0__["__assign"])({}, options), {
        jsonData: jsonData
      }));
    };

    _this.onAFServerChange = function (event) {
      var _a = _this.props,
          onOptionsChange = _a.onOptionsChange,
          options = _a.options;

      var jsonData = Object(tslib__WEBPACK_IMPORTED_MODULE_0__["__assign"])(Object(tslib__WEBPACK_IMPORTED_MODULE_0__["__assign"])({}, options.jsonData), {
        afserver: event.target.value
      });

      onOptionsChange(Object(tslib__WEBPACK_IMPORTED_MODULE_0__["__assign"])(Object(tslib__WEBPACK_IMPORTED_MODULE_0__["__assign"])({}, options), {
        jsonData: jsonData
      }));
    };

    _this.onAFDatabaseChange = function (event) {
      var _a = _this.props,
          onOptionsChange = _a.onOptionsChange,
          options = _a.options;

      var jsonData = Object(tslib__WEBPACK_IMPORTED_MODULE_0__["__assign"])(Object(tslib__WEBPACK_IMPORTED_MODULE_0__["__assign"])({}, options.jsonData), {
        afdatabase: event.target.value
      });

      onOptionsChange(Object(tslib__WEBPACK_IMPORTED_MODULE_0__["__assign"])(Object(tslib__WEBPACK_IMPORTED_MODULE_0__["__assign"])({}, options), {
        jsonData: jsonData
      }));
    };

    return _this;
  }

  PIWebAPIConfigEditor.prototype.componentDidUpdate = function () {
    var options = this.props.options;
    coerceOptions(options);
  };

  PIWebAPIConfigEditor.prototype.render = function () {
    var _a = this.props,
        onOptionsChange = _a.onOptionsChange,
        originalOptions = _a.options;
    var options = coerceOptions(originalOptions);
    return react__WEBPACK_IMPORTED_MODULE_1___default.a.createElement("div", null, react__WEBPACK_IMPORTED_MODULE_1___default.a.createElement(_grafana_ui__WEBPACK_IMPORTED_MODULE_2__["DataSourceHttpSettings"], {
      defaultUrl: "https://server.name/webapi",
      dataSourceConfig: options,
      onChange: onOptionsChange,
      showAccessOptions: true
    }), react__WEBPACK_IMPORTED_MODULE_1___default.a.createElement("h3", {
      className: "page-heading"
    }, "PI/AF Connection Details"), react__WEBPACK_IMPORTED_MODULE_1___default.a.createElement("div", {
      className: "gf-form-group"
    }, react__WEBPACK_IMPORTED_MODULE_1___default.a.createElement("div", {
      className: "gf-form"
    }, react__WEBPACK_IMPORTED_MODULE_1___default.a.createElement(FormField, {
      label: "PI Server",
      labelWidth: 10,
      inputWidth: 25,
      onChange: this.onPIServerChange,
      value: options.jsonData.piserver || '',
      placeholder: "Default PI Server to use for data requests"
    })), react__WEBPACK_IMPORTED_MODULE_1___default.a.createElement("div", {
      className: "gf-form"
    }, react__WEBPACK_IMPORTED_MODULE_1___default.a.createElement(FormField, {
      label: "AF Server",
      labelWidth: 10,
      inputWidth: 25,
      onChange: this.onAFServerChange,
      value: options.jsonData.afserver || '',
      placeholder: "Default AF Server to use for data requests"
    })), react__WEBPACK_IMPORTED_MODULE_1___default.a.createElement("div", {
      className: "gf-form"
    }, react__WEBPACK_IMPORTED_MODULE_1___default.a.createElement(FormField, {
      label: "AF Database",
      labelWidth: 10,
      inputWidth: 25,
      onChange: this.onAFDatabaseChange,
      value: options.jsonData.afdatabase || '',
      placeholder: "Default AF Database server for AF queries"
    }))));
  };

  return PIWebAPIConfigEditor;
}(react__WEBPACK_IMPORTED_MODULE_1__["PureComponent"]);



/***/ }),

/***/ "./QueryEditor.tsx":
/*!*************************!*\
  !*** ./QueryEditor.tsx ***!
  \*************************/
/*! exports provided: PIWebAPIQueryEditor */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "PIWebAPIQueryEditor", function() { return PIWebAPIQueryEditor; });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! tslib */ "../node_modules/tslib/tslib.es6.js");
/* harmony import */ var lodash__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! lodash */ "lodash");
/* harmony import */ var lodash__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(lodash__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! react */ "react");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var _grafana_ui__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! @grafana/ui */ "@grafana/ui");
/* harmony import */ var _grafana_ui__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(_grafana_ui__WEBPACK_IMPORTED_MODULE_3__);
/* harmony import */ var _components_Forms__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./components/Forms */ "./components/Forms.tsx");
/* harmony import */ var _types__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./types */ "./types.ts");






var Input = _grafana_ui__WEBPACK_IMPORTED_MODULE_3__["LegacyForms"].Input,
    Switch = _grafana_ui__WEBPACK_IMPORTED_MODULE_3__["LegacyForms"].Switch;
var REMOVE_LABEL = '-REMOVE-';

var CustomLabelComponent = function CustomLabelComponent(props) {
  var _a;

  if (props.value) {
    return react__WEBPACK_IMPORTED_MODULE_2___default.a.createElement("div", {
      className: "gf-form-label"
    }, (_a = props.label) !== null && _a !== void 0 ? _a : '---no label--');
  }

  return react__WEBPACK_IMPORTED_MODULE_2___default.a.createElement("a", {
    className: "gf-form-label query-part"
  }, react__WEBPACK_IMPORTED_MODULE_2___default.a.createElement(_grafana_ui__WEBPACK_IMPORTED_MODULE_3__["Icon"], {
    name: "plus"
  }));
};

var PIWebAPIQueryEditor =
/** @class */
function (_super) {
  Object(tslib__WEBPACK_IMPORTED_MODULE_0__["__extends"])(PIWebAPIQueryEditor, _super);

  function PIWebAPIQueryEditor(props) {
    var _this = _super.call(this, props) || this;

    _this.piServer = [];
    _this.availableAttributes = {};
    _this.state = {
      segments: [],
      attributes: [],
      summaries: [],
      attributeSegment: {},
      summarySegment: {},
      calculationBasisSegment: {},
      noDataReplacementSegment: {}
    }; // pi point change event

    _this.onPiPointChange = function (item, index) {
      var attributes = _this.state.attributes.slice(0);

      if (item.label === REMOVE_LABEL) {
        Object(lodash__WEBPACK_IMPORTED_MODULE_1__["remove"])(attributes, function (value, n) {
          return n === index;
        });
      } else {
        // set current value
        attributes[index] = item;
      }

      _this.checkPiPointSegments(item, attributes);
    }; // attribute change event


    _this.onAttributeChange = function (item, index) {
      var attributes = _this.state.attributes.slice(0); // set current value


      attributes[index] = item;

      _this.checkAttributeSegments(attributes, _this.state.segments);
    }; // segment change


    _this.onSegmentChange = function (item, index) {
      var _a, _b;

      var query = _this.props.query;

      var segments = _this.state.segments.slice(0);

      if (item.label === REMOVE_LABEL) {
        segments = Object(lodash__WEBPACK_IMPORTED_MODULE_1__["slice"])(segments, 0, index);

        _this.checkAttributeSegments([], segments);

        if (segments.length > 0 && !!((_a = segments[segments.length - 1].value) === null || _a === void 0 ? void 0 : _a.expandable)) {
          segments.push({
            label: 'Select Element',
            value: {
              value: '-Select Element-'
            }
          });
        }

        if (query.isPiPoint) {
          _this.piServer = [];
        }

        _this.segmentChangeValue(segments);

        return;
      } // set current value


      segments[index] = item; // Accept only one PI server

      if (query.isPiPoint) {
        _this.piServer.push(item);

        _this.segmentChangeValue(segments);

        return;
      } // changed internal selection


      if (index < segments.length - 1) {
        segments = Object(lodash__WEBPACK_IMPORTED_MODULE_1__["slice"])(segments, 0, index + 1);
      }

      _this.checkAttributeSegments([], segments); // add new options


      if (!!((_b = item.value) === null || _b === void 0 ? void 0 : _b.expandable)) {
        segments.push({
          label: 'Select Element',
          value: {
            value: '-Select Element-'
          }
        });
      }

      if (query.isPiPoint) {
        _this.piServer.push(item);
      }

      _this.segmentChangeValue(segments);
    }; // get a ui segment for the attributes


    _this.getElementSegments = function (index) {
      var _a = _this.props,
          datasource = _a.datasource,
          query = _a.query;
      var ctrl = _this;
      var findQuery = {
        path: _this.getSegmentPathUpTo(_this.state.segments.slice(0), index)
      };
      return datasource.metricFindQuery(findQuery, query.isPiPoint).then(function (items) {
        var altSegments = Object(lodash__WEBPACK_IMPORTED_MODULE_1__["map"])(items, function (item) {
          var selectableValue = {
            webId: item.WebId,
            label: item.text,
            value: {
              value: item.text,
              expandable: !query.isPiPoint && item.expandable
            }
          };
          return selectableValue;
        });

        if (altSegments.length === 0) {
          return altSegments;
        } // add template variables


        var variables = datasource.templateSrv.getVariables();
        Object(lodash__WEBPACK_IMPORTED_MODULE_1__["each"])(variables, function (variable) {
          var selectableValue = {
            label: "[[" + variable.name + "]]",
            value: {
              type: 'template',
              value: "[[" + variable.name + "]]",
              expandable: !query.isPiPoint
            }
          };
          altSegments.unshift(selectableValue);
        });
        altSegments.unshift({
          label: REMOVE_LABEL,
          value: {
            value: REMOVE_LABEL
          }
        });
        return altSegments;
      })["catch"](function (err) {
        ctrl.error = err.message || 'Failed to issue metric query';
        return [];
      });
    }; // get the list of attributes for the user interface - PI


    _this.getAttributeSegmentsPI = function (attributeText) {
      var _a = _this.props,
          datasource = _a.datasource,
          query = _a.query;
      var ctrl = _this;
      var segments = [];
      var findQuery = {
        path: '',
        webId: ctrl.getSelectedPIServer(),
        pointName: datasource.templateSrv.replace(attributeText) + '*',
        type: 'dataserver'
      };
      return datasource.metricFindQuery(findQuery, query.isPiPoint).then(function (items) {
        segments = Object(lodash__WEBPACK_IMPORTED_MODULE_1__["map"])(items, function (item) {
          var selectableValue = {
            path: item.Path,
            label: item.text,
            value: {
              value: item.text,
              expandable: false
            }
          };
          return selectableValue;
        });
        segments.unshift({
          label: attributeText,
          value: {
            value: attributeText,
            expandable: false
          }
        });
        segments.unshift({
          label: REMOVE_LABEL,
          value: {
            value: REMOVE_LABEL
          }
        });
        return segments;
      })["catch"](function (err) {
        ctrl.error = err.message || 'Failed to issue metric query';
        return segments;
      });
    }; // get the list of attributes for the user interface - AF


    _this.getAttributeSegmentsAF = function (attributeText) {
      var ctrl = _this;
      var segments = [];
      Object(lodash__WEBPACK_IMPORTED_MODULE_1__["forOwn"])(ctrl.availableAttributes, function (val, key) {
        var selectableValue = {
          label: key,
          value: {
            value: key,
            expandable: true
          }
        };
        segments.push(selectableValue);
      });
      segments.unshift({
        label: REMOVE_LABEL,
        value: {
          value: REMOVE_LABEL
        }
      });
      return segments;
    };

    _this.componentDidMount = function () {
      var _a, _b, _c;

      var query = _this.props.query;
      var metricsQuery = Object(lodash__WEBPACK_IMPORTED_MODULE_1__["defaults"])(query, _types__WEBPACK_IMPORTED_MODULE_5__["defaultQuery"]);
      var segments = metricsQuery.segments,
          attributes = metricsQuery.attributes,
          summary = metricsQuery.summary;
      var segmentsArray = (_a = segments === null || segments === void 0 ? void 0 : segments.slice(0)) !== null && _a !== void 0 ? _a : [];

      if (segmentsArray.length === 0) {
        segmentsArray.push({});
      }

      var attributesArray = (_b = attributes === null || attributes === void 0 ? void 0 : attributes.slice(0)) !== null && _b !== void 0 ? _b : [];
      var summariesArray = (_c = summary === null || summary === void 0 ? void 0 : summary.types) !== null && _c !== void 0 ? _c : [];

      if (query.isPiPoint && segmentsArray.length > 0) {
        _this.piServer = segmentsArray; // pi server assignment
      }

      _this.setState({
        segments: segmentsArray,
        attributes: attributesArray,
        summaries: summariesArray
      });
    };

    _this.segmentChangeValue = function (segments) {
      var query = _this.props.query;

      _this.setState({
        segments: segments
      });

      _this.onChange(Object(tslib__WEBPACK_IMPORTED_MODULE_0__["__assign"])(Object(tslib__WEBPACK_IMPORTED_MODULE_0__["__assign"])({}, query), {
        segments: segments
      }));
    };

    _this.attributeChangeValue = function (attributes) {
      var query = _this.props.query;

      _this.setState({
        attributes: attributes
      });

      _this.onChange(Object(tslib__WEBPACK_IMPORTED_MODULE_0__["__assign"])(Object(tslib__WEBPACK_IMPORTED_MODULE_0__["__assign"])({}, query), {
        attributes: attributes
      }));
    };

    _this.onChange = function (query) {
      var _a = _this.props,
          onChange = _a.onChange,
          onRunQuery = _a.onRunQuery;
      query.summary.types = _this.state.summaries;
      query.elementPath = _this.getSegmentPathUpTo(_this.state.segments, _this.state.segments.length);
      query.target = query.elementPath + ';' + Object(lodash__WEBPACK_IMPORTED_MODULE_1__["join"])(query.attributes.map(function (s) {
        var _a;

        return (_a = s.value) === null || _a === void 0 ? void 0 : _a.value;
      }), ';');
      onChange(query);

      if (query.target && query.target.length > 0 && query.attributes.length > 0) {
        onRunQuery();
      }
    };

    _this.onSegmentChange = _this.onSegmentChange.bind(_this);
    _this.calcBasisValueChanged = _this.calcBasisValueChanged.bind(_this);
    _this.calcNoDataValueChanged = _this.calcNoDataValueChanged.bind(_this);
    _this.onSummaryAction = _this.onSummaryAction.bind(_this);
    _this.onSummaryValueChanged = _this.onSummaryValueChanged.bind(_this);
    _this.onAttributeAction = _this.onAttributeAction.bind(_this);
    _this.onAttributeChange = _this.onAttributeChange.bind(_this);
    _this.summaryTypes = [// 'None', // A summary type is not specified.
    'Total', 'Average', 'Minimum', 'Maximum', 'Range', 'StdDev', 'PopulationStdDev', 'Count', 'PercentGood', 'All', 'AllForNonNumeric' // A convenience for requesting all available summary calculations for non-numeric data.
    ];
    _this.calculationBasis = ['TimeWeighted', 'EventWeighted', 'TimeWeightedContinuous', 'TimeWeightedDiscrete', 'EventWeightedExcludeMostRecentEvent', 'EventWeightedExcludeEarliestEvent', 'EventWeightedIncludeBothEnds' // Events at both ends of the interval boundaries are included in the event weighted calculation.
    ];
    _this.noDataReplacement = ['Null', 'Drop', 'Previous', '0', 'Keep' // Keep value      
    ];
    return _this;
  } // is selected segment empty


  PIWebAPIQueryEditor.prototype.isValueEmpty = function (value) {
    return !value || !value.value || !value.value.length || value.value === REMOVE_LABEL;
  }; // summary calculation change event


  PIWebAPIQueryEditor.prototype.calcBasisValueChanged = function (segment) {
    var _a;

    var metricsQuery = this.props.query;
    var summary = metricsQuery.summary;
    summary.basis = (_a = segment.value) === null || _a === void 0 ? void 0 : _a.value;
    this.onChange(Object(tslib__WEBPACK_IMPORTED_MODULE_0__["__assign"])(Object(tslib__WEBPACK_IMPORTED_MODULE_0__["__assign"])({}, metricsQuery), {
      summary: summary
    }));
  }; // get summary calculation basis user interface segments


  PIWebAPIQueryEditor.prototype.getCalcBasisSegments = function () {
    var segments = Object(lodash__WEBPACK_IMPORTED_MODULE_1__["map"])(this.calculationBasis, function (item) {
      var selectableValue = {
        label: item,
        value: {
          value: item,
          expandable: true
        }
      };
      return selectableValue;
    });
    return segments;
  }; // no data change event


  PIWebAPIQueryEditor.prototype.calcNoDataValueChanged = function (segment) {
    var _a;

    var metricsQuery = this.props.query;
    var summary = metricsQuery.summary;
    summary.nodata = (_a = segment.value) === null || _a === void 0 ? void 0 : _a.value;
    this.onChange(Object(tslib__WEBPACK_IMPORTED_MODULE_0__["__assign"])(Object(tslib__WEBPACK_IMPORTED_MODULE_0__["__assign"])({}, metricsQuery), {
      summary: summary
    }));
  }; // get summary calculation basis user interface segments


  PIWebAPIQueryEditor.prototype.getNoDataSegments = function () {
    var segments = Object(lodash__WEBPACK_IMPORTED_MODULE_1__["map"])(this.noDataReplacement, function (item) {
      var selectableValue = {
        label: item,
        value: {
          value: item,
          expandable: true
        }
      };
      return selectableValue;
    });
    return segments;
  }; // remove a summary from the user interface and the query


  PIWebAPIQueryEditor.prototype.removeSummary = function (part) {
    var summaries = Object(lodash__WEBPACK_IMPORTED_MODULE_1__["filter"])(this.state.summaries, function (item) {
      return item !== part;
    });
    this.setState({
      summaries: summaries
    });
  }; // add a new summary to the query


  PIWebAPIQueryEditor.prototype.onSummaryAction = function (item) {
    var _a;

    var summaries = this.state.summaries.slice(0); // if value is not empty, add new attribute segment

    if (!this.isValueEmpty(item.value)) {
      var selectableValue = {
        label: item.label,
        value: {
          value: (_a = item.value) === null || _a === void 0 ? void 0 : _a.value,
          expandable: true
        }
      };
      summaries.push(selectableValue);
    }

    this.setState({
      summarySegment: {},
      summaries: summaries
    });
  }; // summary query change event


  PIWebAPIQueryEditor.prototype.onSummaryValueChanged = function (item, index) {
    var summaries = this.state.summaries.slice(0);
    summaries[index].value = item.value;

    if (this.isValueEmpty(item.value)) {
      summaries.splice(index, 1);
    }

    this.setState({
      summaries: summaries
    });
  }; // get the list of summaries available


  PIWebAPIQueryEditor.prototype.getSummarySegments = function () {
    var _this = this;

    var ctrl = this;
    var summaryTypes = Object(lodash__WEBPACK_IMPORTED_MODULE_1__["filter"])(ctrl.summaryTypes, function (type) {
      return _this.state.summaries.map(function (s) {
        var _a;

        return (_a = s.value) === null || _a === void 0 ? void 0 : _a.value;
      }).indexOf(type) === -1.;
    });
    var segments = Object(lodash__WEBPACK_IMPORTED_MODULE_1__["map"])(summaryTypes, function (item) {
      var selectableValue = {
        label: item,
        value: {
          value: item,
          expandable: true
        }
      };
      return selectableValue;
    });
    segments.unshift({
      label: REMOVE_LABEL,
      value: {
        value: REMOVE_LABEL
      }
    });
    return segments;
  }; // remove an af attribute from the query


  PIWebAPIQueryEditor.prototype.removeAttribute = function (part) {
    var attributes = Object(lodash__WEBPACK_IMPORTED_MODULE_1__["filter"])(this.state.attributes, function (item) {
      return item !== part;
    });
    this.attributeChangeValue(attributes);
  }; // add an attribute to the query


  PIWebAPIQueryEditor.prototype.onAttributeAction = function (item) {
    var _a;

    var query = this.props.query;
    var attributes = this.state.attributes.slice(0); // if value is not empty, add new attribute segment

    if (!this.isValueEmpty(item.value)) {
      var selectableValue = {
        label: item.label,
        value: {
          value: (_a = item.value) === null || _a === void 0 ? void 0 : _a.value,
          expandable: !query.isPiPoint
        }
      };
      attributes.push(selectableValue);
    }

    this.attributeChangeValue(attributes);
  };
  /**
   * Gets the segment information and parses it to a string.
   *
   * @param {any} index - Last index of segment to use.
   * @returns - AF Path or PI Point name.
   *
   * @memberOf PiWebApiDatasourceQueryCtrl
   */


  PIWebAPIQueryEditor.prototype.getSegmentPathUpTo = function (segments, index) {
    var arr = segments.slice(0, index);
    return Object(lodash__WEBPACK_IMPORTED_MODULE_1__["reduce"])(arr, function (result, segment) {
      if (!segment.value) return '';

      if (!segment.value.value.startsWith('-Select')) {
        return result ? result + '\\' + segment.value.value : segment.value.value;
      }

      return result;
    }, '');
  };
  /**
   * Get the current AF Element's child attributes. Validates when the element selection changes.
   *
   * @returns - Collection of attributes.
   *
   * @memberOf PiWebApiDatasourceQueryCtrl
   */


  PIWebAPIQueryEditor.prototype.checkAttributeSegments = function (attributes, segments) {
    var _this = this;

    var datasource = this.props.datasource;
    var ctrl = this;
    var findQuery = {
      path: this.getSegmentPathUpTo(segments.slice(0), segments.length),
      type: 'attributes'
    };
    return datasource.metricFindQuery(findQuery, false).then(function (attributesResponse) {
      var validAttributes = {};
      Object(lodash__WEBPACK_IMPORTED_MODULE_1__["each"])(attributesResponse, function (attribute) {
        validAttributes[attribute.Path.substring(attribute.Path.indexOf('|') + 1)] = attribute.WebId;
      });
      var filteredAttributes = Object(lodash__WEBPACK_IMPORTED_MODULE_1__["filter"])(attributes, function (attrib) {
        var _a;

        var changedValue = datasource.templateSrv.replace((_a = attrib.value) === null || _a === void 0 ? void 0 : _a.value);
        return validAttributes[changedValue] !== undefined;
      });
      ctrl.availableAttributes = validAttributes;

      _this.attributeChangeValue(filteredAttributes);
    })["catch"](function (err) {
      ctrl.error = err.message || 'Failed to issue metric query';

      _this.attributeChangeValue([]);
    });
  };
  /**
   * Get PI points from server.
   *
   * @returns - Collection of attributes.
   *
   * @memberOf PiWebApiDatasourceQueryCtrl
   */


  PIWebAPIQueryEditor.prototype.checkPiPointSegments = function (attribute, attributes) {
    var _this = this;

    var datasource = this.props.datasource;
    var ctrl = this;
    var findQuery = {
      path: attribute.path,
      webId: ctrl.getSelectedPIServer(),
      pointName: datasource.templateSrv.replace(attribute.label),
      type: 'pipoint'
    };
    return datasource.metricFindQuery(findQuery, true).then(function () {
      _this.attributeChangeValue(attributes);
    })["catch"](function (err) {
      ctrl.error = err.message || 'Failed to issue metric query';

      _this.attributeChangeValue([]);
    });
  };
  /**
   * Gets the webid of the current selected pi data server.
   *
   * @memberOf PiWebApiDatasourceQueryCtrl
   */


  PIWebAPIQueryEditor.prototype.getSelectedPIServer = function () {
    var _this = this;

    var webID = '';
    this.piServer.forEach(function (s) {
      var parts = _this.props.query.target.split(';');

      if (parts.length >= 2) {
        if (parts[0] === s.text) {
          webID = s.WebId;
          return;
        }
      }
    });
    return this.piServer.length > 0 ? this.piServer[0].webId : webID;
  };

  PIWebAPIQueryEditor.prototype.render = function () {
    var _this = this;

    var _a = this.props,
        query = _a.query,
        onRunQuery = _a.onRunQuery;
    var metricsQuery = Object(lodash__WEBPACK_IMPORTED_MODULE_1__["defaults"])(query, _types__WEBPACK_IMPORTED_MODULE_5__["defaultQuery"]);
    var interpolate = metricsQuery.interpolate,
        digitalStates = metricsQuery.digitalStates,
        recordedValues = metricsQuery.recordedValues,
        expression = metricsQuery.expression,
        isPiPoint = metricsQuery.isPiPoint,
        summary = metricsQuery.summary,
        display = metricsQuery.display,
        regex = metricsQuery.regex;
    return react__WEBPACK_IMPORTED_MODULE_2___default.a.createElement(react__WEBPACK_IMPORTED_MODULE_2___default.a.Fragment, null, react__WEBPACK_IMPORTED_MODULE_2___default.a.createElement("div", {
      className: "gf-form"
    }, react__WEBPACK_IMPORTED_MODULE_2___default.a.createElement(Switch, {
      className: "gf-form-inline",
      label: "PI Point Search",
      labelClass: "query-keyword",
      checked: isPiPoint,
      onChange: function onChange() {
        return _this.onChange(Object(tslib__WEBPACK_IMPORTED_MODULE_0__["__assign"])(Object(tslib__WEBPACK_IMPORTED_MODULE_0__["__assign"])({}, metricsQuery), {
          isPiPoint: !isPiPoint
        }));
      }
    })), react__WEBPACK_IMPORTED_MODULE_2___default.a.createElement(_components_Forms__WEBPACK_IMPORTED_MODULE_4__["QueryInlineField"], {
      label: isPiPoint ? "Element" : "Data Server"
    }, this.state.segments.map(function (segment, index) {
      return react__WEBPACK_IMPORTED_MODULE_2___default.a.createElement(_grafana_ui__WEBPACK_IMPORTED_MODULE_3__["SegmentAsync"], {
        Component: react__WEBPACK_IMPORTED_MODULE_2___default.a.createElement(CustomLabelComponent, {
          value: segment.value,
          label: segment.label
        }),
        onChange: function onChange(item) {
          _this.onSegmentChange(item, index);
        },
        loadOptions: function loadOptions(query) {
          return _this.getElementSegments(index);
        },
        allowCustomValue: true
      });
    })), react__WEBPACK_IMPORTED_MODULE_2___default.a.createElement(_components_Forms__WEBPACK_IMPORTED_MODULE_4__["QueryInlineField"], {
      label: isPiPoint ? "Pi Points" : "Attributes"
    }, this.state.attributes.map(function (attribute, index) {
      if (isPiPoint) {
        return react__WEBPACK_IMPORTED_MODULE_2___default.a.createElement(_grafana_ui__WEBPACK_IMPORTED_MODULE_3__["SegmentAsync"], {
          Component: react__WEBPACK_IMPORTED_MODULE_2___default.a.createElement(CustomLabelComponent, {
            value: attribute.value,
            label: attribute.label
          }),
          onChange: function onChange(item) {
            return _this.onPiPointChange(item, index);
          },
          loadOptions: _this.getAttributeSegmentsPI,
          reloadOptionsOnChange: true,
          allowCustomValue: true
        });
      }

      return react__WEBPACK_IMPORTED_MODULE_2___default.a.createElement(_grafana_ui__WEBPACK_IMPORTED_MODULE_3__["Segment"], {
        Component: react__WEBPACK_IMPORTED_MODULE_2___default.a.createElement(CustomLabelComponent, {
          value: attribute.value,
          label: attribute.label
        }),
        onChange: function onChange(item) {
          return _this.onAttributeChange(item, index);
        },
        options: _this.getAttributeSegmentsAF(),
        allowCustomValue: true
      });
    }), isPiPoint && react__WEBPACK_IMPORTED_MODULE_2___default.a.createElement(_grafana_ui__WEBPACK_IMPORTED_MODULE_3__["SegmentAsync"], {
      Component: react__WEBPACK_IMPORTED_MODULE_2___default.a.createElement(CustomLabelComponent, {
        value: this.state.attributeSegment.value,
        label: this.state.attributeSegment.label
      }),
      onChange: this.onAttributeAction,
      loadOptions: this.getAttributeSegmentsPI,
      reloadOptionsOnChange: true,
      allowCustomValue: true
    }), !isPiPoint && react__WEBPACK_IMPORTED_MODULE_2___default.a.createElement(_grafana_ui__WEBPACK_IMPORTED_MODULE_3__["Segment"], {
      Component: react__WEBPACK_IMPORTED_MODULE_2___default.a.createElement(CustomLabelComponent, {
        value: this.state.attributeSegment.value,
        label: this.state.attributeSegment.label
      }),
      onChange: this.onAttributeAction,
      options: this.getAttributeSegmentsAF(),
      allowCustomValue: true
    })), react__WEBPACK_IMPORTED_MODULE_2___default.a.createElement("div", {
      className: "gf-form-inline"
    }, react__WEBPACK_IMPORTED_MODULE_2___default.a.createElement("div", {
      className: "gf-form"
    }, react__WEBPACK_IMPORTED_MODULE_2___default.a.createElement("label", {
      className: "gf-form-label query-keyword width-11"
    }, "Calculation", react__WEBPACK_IMPORTED_MODULE_2___default.a.createElement("i", {
      className: "fa fa-question-circle",
      "bs-tooltip": "'Modify all attributes by an equation. Use \\'.\\' for current item. Leave Attributes empty if you wish to perform element based calculations.'",
      "data-placement": "top"
    })), react__WEBPACK_IMPORTED_MODULE_2___default.a.createElement(Input, {
      className: "gf-form-input",
      onBlur: onRunQuery,
      value: expression,
      onChange: function onChange(event) {
        return _this.onChange(Object(tslib__WEBPACK_IMPORTED_MODULE_0__["__assign"])(Object(tslib__WEBPACK_IMPORTED_MODULE_0__["__assign"])({}, metricsQuery), {
          expression: event.target.value
        }));
      },
      placeholder: "'.'*2"
    }))), react__WEBPACK_IMPORTED_MODULE_2___default.a.createElement("div", {
      className: "gf-form-inline"
    }, react__WEBPACK_IMPORTED_MODULE_2___default.a.createElement("div", {
      className: "gf-form"
    }, react__WEBPACK_IMPORTED_MODULE_2___default.a.createElement("label", {
      className: "gf-form-label query-keyword width-11"
    }, "Max Recorded Values", react__WEBPACK_IMPORTED_MODULE_2___default.a.createElement("i", {
      className: "fa fa-question-circle",
      "bs-tooltip": "'Maximum number of recorded value to retrive from the data archive, without using interpolation.'",
      "data-placement": "top"
    })), react__WEBPACK_IMPORTED_MODULE_2___default.a.createElement(Input, {
      className: "gf-form-input width-6",
      onBlur: onRunQuery,
      value: recordedValues.maxNumber,
      onChange: function onChange(event) {
        return _this.onChange(Object(tslib__WEBPACK_IMPORTED_MODULE_0__["__assign"])(Object(tslib__WEBPACK_IMPORTED_MODULE_0__["__assign"])({}, metricsQuery), {
          recordedValues: Object(tslib__WEBPACK_IMPORTED_MODULE_0__["__assign"])(Object(tslib__WEBPACK_IMPORTED_MODULE_0__["__assign"])({}, recordedValues), {
            maxNumber: parseInt(event.target.value)
          })
        }));
      },
      type: "number",
      placeholder: "150000"
    })), react__WEBPACK_IMPORTED_MODULE_2___default.a.createElement("div", {
      className: "gf-form"
    }, react__WEBPACK_IMPORTED_MODULE_2___default.a.createElement(Switch, {
      className: "gf-form-inline",
      label: "Recorded Values",
      labelClass: "query-keyword",
      checked: recordedValues.enable,
      onChange: function onChange() {
        _this.onChange(Object(tslib__WEBPACK_IMPORTED_MODULE_0__["__assign"])(Object(tslib__WEBPACK_IMPORTED_MODULE_0__["__assign"])({}, metricsQuery), {
          recordedValues: Object(tslib__WEBPACK_IMPORTED_MODULE_0__["__assign"])(Object(tslib__WEBPACK_IMPORTED_MODULE_0__["__assign"])({}, recordedValues), {
            enable: !recordedValues.enable
          })
        }));
      }
    })), react__WEBPACK_IMPORTED_MODULE_2___default.a.createElement("div", {
      className: "gf-form"
    }, react__WEBPACK_IMPORTED_MODULE_2___default.a.createElement(Switch, {
      className: "gf-form-inline",
      label: "Digital States",
      labelClass: "query-keyword",
      checked: digitalStates.enable,
      onChange: function onChange() {
        _this.onChange(Object(tslib__WEBPACK_IMPORTED_MODULE_0__["__assign"])(Object(tslib__WEBPACK_IMPORTED_MODULE_0__["__assign"])({}, metricsQuery), {
          digitalStates: Object(tslib__WEBPACK_IMPORTED_MODULE_0__["__assign"])(Object(tslib__WEBPACK_IMPORTED_MODULE_0__["__assign"])({}, digitalStates), {
            enable: !digitalStates.enable
          })
        }));
      }
    }))), react__WEBPACK_IMPORTED_MODULE_2___default.a.createElement("div", {
      className: "gf-form-inline"
    }, react__WEBPACK_IMPORTED_MODULE_2___default.a.createElement("div", {
      className: "gf-form"
    }, react__WEBPACK_IMPORTED_MODULE_2___default.a.createElement("label", {
      className: "gf-form-label query-keyword width-11"
    }, "Interpolate Period", react__WEBPACK_IMPORTED_MODULE_2___default.a.createElement("i", {
      className: "fa fa-question-circle",
      "bs-tooltip": "'Override time between sampling, e.g. \\'30s\\'. Defaults to timespan/chart width.'",
      "data-placement": "top"
    })), react__WEBPACK_IMPORTED_MODULE_2___default.a.createElement(Input, {
      className: "gf-form-input width-5",
      onBlur: onRunQuery,
      value: interpolate.interval,
      onChange: function onChange(event) {
        return _this.onChange(Object(tslib__WEBPACK_IMPORTED_MODULE_0__["__assign"])(Object(tslib__WEBPACK_IMPORTED_MODULE_0__["__assign"])({}, metricsQuery), {
          interpolate: Object(tslib__WEBPACK_IMPORTED_MODULE_0__["__assign"])(Object(tslib__WEBPACK_IMPORTED_MODULE_0__["__assign"])({}, interpolate), {
            interval: event.target.value
          })
        }));
      },
      placeholder: "30s"
    })), react__WEBPACK_IMPORTED_MODULE_2___default.a.createElement("div", {
      className: "gf-form"
    }, react__WEBPACK_IMPORTED_MODULE_2___default.a.createElement(Switch, {
      className: "gf-form-inline",
      label: "Interpolate",
      labelClass: "query-keyword",
      checked: interpolate.enable,
      onChange: function onChange() {
        _this.onChange(Object(tslib__WEBPACK_IMPORTED_MODULE_0__["__assign"])(Object(tslib__WEBPACK_IMPORTED_MODULE_0__["__assign"])({}, metricsQuery), {
          interpolate: Object(tslib__WEBPACK_IMPORTED_MODULE_0__["__assign"])(Object(tslib__WEBPACK_IMPORTED_MODULE_0__["__assign"])({}, interpolate), {
            enable: !interpolate.enable
          })
        }));
      }
    })), react__WEBPACK_IMPORTED_MODULE_2___default.a.createElement("div", {
      className: "gf-form"
    }, react__WEBPACK_IMPORTED_MODULE_2___default.a.createElement("label", {
      className: "gf-form-label query-keyword  width-8"
    }, react__WEBPACK_IMPORTED_MODULE_2___default.a.createElement("span", null, "Replace Bad Data"), react__WEBPACK_IMPORTED_MODULE_2___default.a.createElement("i", {
      className: "fa fa-question-circle",
      "bs-tooltip": "'Replacement for bad quality values.'",
      "data-placement": "top"
    })), react__WEBPACK_IMPORTED_MODULE_2___default.a.createElement(_grafana_ui__WEBPACK_IMPORTED_MODULE_3__["Segment"], {
      Component: react__WEBPACK_IMPORTED_MODULE_2___default.a.createElement(CustomLabelComponent, {
        value: {
          value: summary.nodata
        },
        label: summary.nodata
      }),
      onChange: this.calcNoDataValueChanged,
      options: this.getNoDataSegments(),
      allowCustomValue: true
    }))), react__WEBPACK_IMPORTED_MODULE_2___default.a.createElement("div", {
      className: "gf-form-inline"
    }, react__WEBPACK_IMPORTED_MODULE_2___default.a.createElement("div", {
      className: "gf-form"
    }, react__WEBPACK_IMPORTED_MODULE_2___default.a.createElement("label", {
      className: "gf-form-label query-keyword width-11"
    }, "Summary Period", react__WEBPACK_IMPORTED_MODULE_2___default.a.createElement("i", {
      className: "fa fa-question-circle",
      "bs-tooltip": "'Override time between sampling, e.g. \\'30s\\'.'",
      "data-placement": "top"
    })), react__WEBPACK_IMPORTED_MODULE_2___default.a.createElement(Input, {
      className: "gf-form-input width-5",
      onBlur: onRunQuery,
      value: summary.interval,
      onChange: function onChange(event) {
        return _this.onChange(Object(tslib__WEBPACK_IMPORTED_MODULE_0__["__assign"])(Object(tslib__WEBPACK_IMPORTED_MODULE_0__["__assign"])({}, metricsQuery), {
          summary: Object(tslib__WEBPACK_IMPORTED_MODULE_0__["__assign"])(Object(tslib__WEBPACK_IMPORTED_MODULE_0__["__assign"])({}, summary), {
            interval: event.target.value
          })
        }));
      },
      placeholder: "30s"
    })), react__WEBPACK_IMPORTED_MODULE_2___default.a.createElement("div", {
      className: "gf-form"
    }, react__WEBPACK_IMPORTED_MODULE_2___default.a.createElement("label", {
      className: "gf-form-label query-keyword  width-8"
    }, react__WEBPACK_IMPORTED_MODULE_2___default.a.createElement("span", null, "Basis"), react__WEBPACK_IMPORTED_MODULE_2___default.a.createElement("i", {
      className: "fa fa-question-circle",
      "bs-tooltip": "'Defines the possible calculation options when performing summary calculations over time-series data.'",
      "data-placement": "top"
    })), react__WEBPACK_IMPORTED_MODULE_2___default.a.createElement(_grafana_ui__WEBPACK_IMPORTED_MODULE_3__["Segment"], {
      Component: react__WEBPACK_IMPORTED_MODULE_2___default.a.createElement(CustomLabelComponent, {
        value: {
          value: summary.basis
        },
        label: summary.basis
      }),
      onChange: this.calcBasisValueChanged,
      options: this.getCalcBasisSegments(),
      allowCustomValue: true
    })), react__WEBPACK_IMPORTED_MODULE_2___default.a.createElement("div", {
      className: "gf-form gf-form--grow"
    }, react__WEBPACK_IMPORTED_MODULE_2___default.a.createElement("label", {
      className: "gf-form-label query-keyword  width-8"
    }, react__WEBPACK_IMPORTED_MODULE_2___default.a.createElement("span", null, "Summaries")), this.state.summaries.map(function (s, index) {
      return react__WEBPACK_IMPORTED_MODULE_2___default.a.createElement(_grafana_ui__WEBPACK_IMPORTED_MODULE_3__["Segment"], {
        Component: react__WEBPACK_IMPORTED_MODULE_2___default.a.createElement(CustomLabelComponent, {
          value: s.data,
          label: s.label
        }),
        onChange: function onChange(item) {
          _this.onSummaryValueChanged(item, index);
        },
        options: _this.getSummarySegments(),
        allowCustomValue: true
      });
    }), react__WEBPACK_IMPORTED_MODULE_2___default.a.createElement(_grafana_ui__WEBPACK_IMPORTED_MODULE_3__["Segment"], {
      Component: react__WEBPACK_IMPORTED_MODULE_2___default.a.createElement(CustomLabelComponent, {
        value: this.state.summarySegment.value,
        lable: this.state.summarySegment.label
      }),
      onChange: this.onSummaryAction,
      options: this.getSummarySegments(),
      allowCustomValue: true
    }), react__WEBPACK_IMPORTED_MODULE_2___default.a.createElement(_components_Forms__WEBPACK_IMPORTED_MODULE_4__["QueryRowTerminator"], null))), react__WEBPACK_IMPORTED_MODULE_2___default.a.createElement("div", {
      className: "gf-form-inline"
    }, react__WEBPACK_IMPORTED_MODULE_2___default.a.createElement("div", {
      className: "gf-form"
    }, react__WEBPACK_IMPORTED_MODULE_2___default.a.createElement("div", {
      className: "gf-form max-width-30"
    }, react__WEBPACK_IMPORTED_MODULE_2___default.a.createElement("label", {
      className: "gf-form-label query-keyword width-11"
    }, "Display Name", react__WEBPACK_IMPORTED_MODULE_2___default.a.createElement("i", {
      className: "fa fa-question-circle",
      "bs-tooltip": "'If single attribute, modify display name. Otherwise use regex to modify display name.'",
      "data-placement": "top"
    })), react__WEBPACK_IMPORTED_MODULE_2___default.a.createElement(Input, {
      className: "gf-form-input width-5",
      onBlur: onRunQuery,
      value: display,
      onChange: function onChange(event) {
        return _this.onChange(Object(tslib__WEBPACK_IMPORTED_MODULE_0__["__assign"])(Object(tslib__WEBPACK_IMPORTED_MODULE_0__["__assign"])({}, metricsQuery), {
          display: event.target.value
        }));
      },
      placeholder: "Display"
    }))), react__WEBPACK_IMPORTED_MODULE_2___default.a.createElement("div", {
      className: "gf-form"
    }, react__WEBPACK_IMPORTED_MODULE_2___default.a.createElement(Switch, {
      className: "gf-form",
      label: "Enable Regex Replace",
      labelClass: "query-keyword",
      checked: regex.enable,
      onChange: function onChange() {
        _this.onChange(Object(tslib__WEBPACK_IMPORTED_MODULE_0__["__assign"])(Object(tslib__WEBPACK_IMPORTED_MODULE_0__["__assign"])({}, metricsQuery), {
          regex: Object(tslib__WEBPACK_IMPORTED_MODULE_0__["__assign"])(Object(tslib__WEBPACK_IMPORTED_MODULE_0__["__assign"])({}, regex), {
            enable: !regex.enable
          })
        }));
      }
    })), react__WEBPACK_IMPORTED_MODULE_2___default.a.createElement("div", {
      className: "gf-form"
    }, react__WEBPACK_IMPORTED_MODULE_2___default.a.createElement("div", {
      className: "gf-form max-width-30"
    }, react__WEBPACK_IMPORTED_MODULE_2___default.a.createElement("label", {
      className: "gf-form-label query-keyword"
    }, "Search"), react__WEBPACK_IMPORTED_MODULE_2___default.a.createElement(Input, {
      className: "gf-form-input width-5",
      onBlur: onRunQuery,
      value: regex.search,
      onChange: function onChange(event) {
        return _this.onChange(Object(tslib__WEBPACK_IMPORTED_MODULE_0__["__assign"])(Object(tslib__WEBPACK_IMPORTED_MODULE_0__["__assign"])({}, metricsQuery), {
          regex: Object(tslib__WEBPACK_IMPORTED_MODULE_0__["__assign"])(Object(tslib__WEBPACK_IMPORTED_MODULE_0__["__assign"])({}, regex), {
            search: event.target.value
          })
        }));
      },
      placeholder: "(.*)"
    }))), react__WEBPACK_IMPORTED_MODULE_2___default.a.createElement("div", {
      className: "gf-form"
    }, react__WEBPACK_IMPORTED_MODULE_2___default.a.createElement("div", {
      className: "gf-form max-width-30"
    }, react__WEBPACK_IMPORTED_MODULE_2___default.a.createElement("label", {
      className: "gf-form-label query-keyword"
    }, "Replace"), react__WEBPACK_IMPORTED_MODULE_2___default.a.createElement(Input, {
      className: "gf-form-input width-5",
      onBlur: onRunQuery,
      value: regex.replace,
      onChange: function onChange(event) {
        return _this.onChange(Object(tslib__WEBPACK_IMPORTED_MODULE_0__["__assign"])(Object(tslib__WEBPACK_IMPORTED_MODULE_0__["__assign"])({}, metricsQuery), {
          regex: Object(tslib__WEBPACK_IMPORTED_MODULE_0__["__assign"])(Object(tslib__WEBPACK_IMPORTED_MODULE_0__["__assign"])({}, regex), {
            replace: event.target.value
          })
        }));
      },
      placeholder: "$1"
    }))), react__WEBPACK_IMPORTED_MODULE_2___default.a.createElement(_components_Forms__WEBPACK_IMPORTED_MODULE_4__["QueryRowTerminator"], null)));
  };

  return PIWebAPIQueryEditor;
}(react__WEBPACK_IMPORTED_MODULE_2__["PureComponent"]);



/***/ }),

/***/ "./components/Forms.tsx":
/*!******************************!*\
  !*** ./components/Forms.tsx ***!
  \******************************/
/*! exports provided: QueryField, QueryRowTerminator, QueryInlineField, QueryEditorRow */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "QueryField", function() { return QueryField; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "QueryRowTerminator", function() { return QueryRowTerminator; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "QueryInlineField", function() { return QueryInlineField; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "QueryEditorRow", function() { return QueryEditorRow; });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! tslib */ "../node_modules/tslib/tslib.es6.js");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! react */ "react");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _grafana_ui__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @grafana/ui */ "@grafana/ui");
/* harmony import */ var _grafana_ui__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(_grafana_ui__WEBPACK_IMPORTED_MODULE_2__);



var QueryField = function QueryField(_a) {
  var label = _a.label,
      _b = _a.labelWidth,
      labelWidth = _b === void 0 ? 8 : _b,
      tooltip = _a.tooltip,
      children = _a.children;
  return react__WEBPACK_IMPORTED_MODULE_1___default.a.createElement(react__WEBPACK_IMPORTED_MODULE_1___default.a.Fragment, null, react__WEBPACK_IMPORTED_MODULE_1___default.a.createElement(_grafana_ui__WEBPACK_IMPORTED_MODULE_2__["InlineFormLabel"], {
    width: labelWidth,
    className: "query-keyword",
    tooltip: tooltip
  }, label), children);
};
var QueryRowTerminator = function QueryRowTerminator() {
  return react__WEBPACK_IMPORTED_MODULE_1___default.a.createElement("div", {
    className: "gf-form gf-form--grow"
  }, react__WEBPACK_IMPORTED_MODULE_1___default.a.createElement("div", {
    className: "gf-form-label gf-form-label--grow"
  }));
};
var QueryInlineField = function QueryInlineField(_a) {
  var props = Object(tslib__WEBPACK_IMPORTED_MODULE_0__["__rest"])(_a, []);

  return react__WEBPACK_IMPORTED_MODULE_1___default.a.createElement(QueryEditorRow, null, react__WEBPACK_IMPORTED_MODULE_1___default.a.createElement(QueryField, Object(tslib__WEBPACK_IMPORTED_MODULE_0__["__assign"])({}, props)));
};
var QueryEditorRow = function QueryEditorRow(props) {
  return react__WEBPACK_IMPORTED_MODULE_1___default.a.createElement("div", {
    className: "gf-form-inline"
  }, props.children, react__WEBPACK_IMPORTED_MODULE_1___default.a.createElement(QueryRowTerminator, null));
};

/***/ }),

/***/ "./datasource.ts":
/*!***********************!*\
  !*** ./datasource.ts ***!
  \***********************/
/*! exports provided: PiWebAPIDatasource */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "PiWebAPIDatasource", function() { return PiWebAPIDatasource; });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! tslib */ "../node_modules/tslib/tslib.es6.js");
/* harmony import */ var lodash__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! lodash */ "lodash");
/* harmony import */ var lodash__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(lodash__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _grafana_data__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @grafana/data */ "@grafana/data");
/* harmony import */ var _grafana_data__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(_grafana_data__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var _grafana_runtime__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! @grafana/runtime */ "@grafana/runtime");
/* harmony import */ var _grafana_runtime__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(_grafana_runtime__WEBPACK_IMPORTED_MODULE_3__);
function _typeof(obj) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) { return typeof obj; } : function (obj) { return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }, _typeof(obj); }






var PiWebAPIDatasource =
/** @class */
function (_super) {
  Object(tslib__WEBPACK_IMPORTED_MODULE_0__["__extends"])(PiWebAPIDatasource, _super);

  function PiWebAPIDatasource(instanceSettings, backendSrv) {
    var _a;

    var _this = _super.call(this, instanceSettings) || this;

    _this.backendSrv = backendSrv;
    _this.isProxy = false;
    _this.webidCache = new Map();
    _this.basicAuth = instanceSettings.basicAuth;
    _this.withCredentials = instanceSettings.withCredentials;
    _this.url = instanceSettings.url;
    _this.name = instanceSettings.name;
    _this.templateSrv = Object(_grafana_runtime__WEBPACK_IMPORTED_MODULE_3__["getTemplateSrv"])();
    _this.piwebapiurl = (_a = instanceSettings.jsonData.url) === null || _a === void 0 ? void 0 : _a.toString();
    _this.isProxy = /^http(s)?:\/\//.test(_this.url) || instanceSettings.jsonData.access === 'proxy';
    _this.piserver = {
      name: (instanceSettings.jsonData || {}).piserver,
      webid: undefined
    };
    _this.afserver = {
      name: (instanceSettings.jsonData || {}).afserver,
      webid: undefined
    };
    _this.afdatabase = {
      name: (instanceSettings.jsonData || {}).afdatabase,
      webid: undefined
    };
    Promise.all([_this.getAssetServer(_this.afserver.name).then(function (result) {
      _this.afserver.webid = result.WebId;
    }), _this.getDataServer(_this.piserver.name).then(function (result) {
      _this.piserver.webid = result.WebId;
    }), _this.getDatabase(_this.afserver.name + '\\' + _this.afdatabase.name).then(function (result) {
      _this.afdatabase.webid = result.WebId;
    })]);
    return _this;
  }
  /**
   * Converts a PIWebAPI Event Frame response to a Grafana Annotation
   *
   * @param {any} annotationOptions - Options data from configuration panel.
   * @param {any} endTime - End time of the Event Frame.
   * @param {any} eventFrame - The Event Frame data.
   * @returns - Grafana Annotation
   *
   * @memberOf PiWebApiDatasource
   */


  PiWebAPIDatasource.prototype.eventFrameToAnnotation = function (annotationOptions, endTime, eventFrame, attributeDataItems) {
    if (annotationOptions.regex && annotationOptions.regex.enable) {
      eventFrame.Name = eventFrame.Name.replace(new RegExp(annotationOptions.regex.search), annotationOptions.regex.replace);
    }

    var attributeText = '';

    if (attributeDataItems) {
      Object(lodash__WEBPACK_IMPORTED_MODULE_1__["each"])(attributeDataItems, function (attributeData) {
        var attributeValue = attributeData.Value.Value ? attributeData.Value.Value.Name || attributeData.Value.Value.Value || attributeData.Value.Value : null;
        attributeText += '<br />' + attributeData.Name + ': ' + attributeValue;
      });
    }

    return {
      annotation: annotationOptions,
      title: (endTime ? 'END ' : annotationOptions.showEndTime ? 'START ' : '') + annotationOptions.name,
      time: new Date(endTime ? eventFrame.EndTime : eventFrame.StartTime).getTime(),
      text: eventFrame.Name + attributeText + '<br />Start: ' + eventFrame.StartTime + '<br />End: ' + eventFrame.EndTime // tags: eventFrame.CategoryNames.join()

    };
  };
  /**
   * Builds the PIWebAPI query parameters.
   *
   * @param {any} options - Grafana query and panel options.
   * @returns - PIWebAPI query parameters.
   *
   * @memberOf PiWebApiDatasource
   */


  PiWebAPIDatasource.prototype.buildQueryParameters = function (options) {
    var _this = this;

    options.targets = Object(lodash__WEBPACK_IMPORTED_MODULE_1__["filter"])(options.targets, function (target) {
      if (!target || !target.target) return false;
      return !target.target.startsWith('Select AF');
    });
    options.targets = Object(lodash__WEBPACK_IMPORTED_MODULE_1__["map"])(options.targets, function (target) {
      var tar = {
        target: _this.templateSrv.replace(target.elementPath, options.scopedVars),
        elementPath: _this.templateSrv.replace(target.elementPath, options.scopedVars),
        attributes: Object(lodash__WEBPACK_IMPORTED_MODULE_1__["map"])(target.attributes, function (att) {
          var _a;

          return _this.templateSrv.replace((_a = att.value) === null || _a === void 0 ? void 0 : _a.value, options.scopedVars);
        }),
        segments: Object(lodash__WEBPACK_IMPORTED_MODULE_1__["map"])(target.segments, function (att) {
          var _a;

          return _this.templateSrv.replace((_a = att.value) === null || _a === void 0 ? void 0 : _a.value, options.scopedVars);
        }),
        display: target.display,
        refId: target.refId,
        hide: target.hide,
        interpolate: target.interpolate || {
          enable: false
        },
        recordedValues: target.recordedValues || {
          enable: false
        },
        digitalStates: target.digitalStates || {
          enable: false
        },
        webid: target.webid,
        webids: target.webids || [],
        regex: target.regex || {
          enable: false
        },
        expression: target.expression || '',
        summary: target.summary || {
          types: []
        },
        startTime: options.range.from,
        endTime: options.range.to,
        isPiPoint: target.isPiPoint
      };

      if (tar.expression) {
        tar.expression = _this.templateSrv.replace(tar.expression, options.scopedVars);
      }

      if (tar.summary.types !== undefined) {
        tar.summary.types = Object(lodash__WEBPACK_IMPORTED_MODULE_1__["filter"])(tar.summary.types, function (item) {
          return item !== undefined && item !== null && item !== '';
        });
      }

      var varsKeys = Object(lodash__WEBPACK_IMPORTED_MODULE_1__["keys"])(options.scopedVars);

      _this.templateSrv.getVariables().forEach(function (v) {
        if (v.current && v.current.text === 'All' && varsKeys.indexOf(v.name) < 0) {
          tar.attributes = tar.attributes.map(function (attr) {
            var variables = v.options.filter(function (o) {
              return !o.selected;
            });
            var newAttr = variables.map(function (vv) {
              return attr.replace('{' + v.query + '}', vv.text);
            });
            return newAttr;
          });
          tar.attributes = Object(lodash__WEBPACK_IMPORTED_MODULE_1__["uniq"])(Object(lodash__WEBPACK_IMPORTED_MODULE_1__["flatten"])(tar.attributes));
        }
      });

      return tar;
    });
    return options;
  };
  /**
   * Datasource Implementation. Primary entry point for data source.
   * This takes the panel configuration and queries, sends them to PI Web API and parses the response.
   *
   * @param {any} options - Grafana query and panel options.
   * @returns - Promise of data in the format for Grafana panels.
   *
   * @memberOf PiWebApiDatasource
   */


  PiWebAPIDatasource.prototype.query = function (options) {
    return Object(tslib__WEBPACK_IMPORTED_MODULE_0__["__awaiter"])(this, void 0, Promise, function () {
      var ds, query;
      return Object(tslib__WEBPACK_IMPORTED_MODULE_0__["__generator"])(this, function (_a) {
        ds = this;
        query = this.buildQueryParameters(options);
        query.targets = Object(lodash__WEBPACK_IMPORTED_MODULE_1__["filter"])(query.targets, function (t) {
          return !t.hide;
        });

        if (query.targets.length <= 0) {
          return [2
          /*return*/
          , Promise.resolve({
            data: []
          })];
        } else {
          return [2
          /*return*/
          , Promise.all(ds.getStream(query)).then(function (targetResponses) {
            var flattened = [];
            Object(lodash__WEBPACK_IMPORTED_MODULE_1__["each"])(targetResponses, function (tr) {
              Object(lodash__WEBPACK_IMPORTED_MODULE_1__["each"])(tr, function (item) {
                return flattened.push(item);
              });
            });
            var response = {
              data: flattened.sort(function (a, b) {
                return +(a.target > b.target) || +(a.target === b.target) - 1;
              }).map(function (d) {
                return Object(_grafana_data__WEBPACK_IMPORTED_MODULE_2__["toDataFrame"])(d);
              })
            };
            return response;
          })];
        }

        return [2
        /*return*/
        ];
      });
    });
  };
  /**
   * Datasource Implementation.
   * Used for testing datasource in datasource configuration pange
   *
   * @returns - Success or failure message.
   *
   * @memberOf PiWebApiDatasource
   */


  PiWebAPIDatasource.prototype.testDatasource = function () {
    return this.backendSrv.datasourceRequest({
      url: this.url + '/',
      method: 'GET'
    }).then(function (response) {
      if (response.status === 200) {
        return {
          status: 'success',
          message: 'Data source is working',
          title: 'Success'
        };
      }

      throw new Error('Failed');
    });
  };
  /**
   * Datasource Implementation.
   * This queries PI Web API for Event Frames and converts them into annotations.
   *
   * @param {any} options - Annotation options, usually the Event Frame Category.
   * @returns - A Grafana annotation.
   *
   * @memberOf PiWebApiDatasource
   */


  PiWebAPIDatasource.prototype.annotationQuery = function (options) {
    var _this = this;

    if (!this.afdatabase.webid) {
      return Promise.resolve([]);
    }

    var categoryName = options.annotation.query.categoryName ? this.templateSrv.replace(options.annotation.query.categoryName, options.scopedVars, 'glob') : null;
    var nameFilter = options.annotation.query.nameFilter ? this.templateSrv.replace(options.annotation.query.nameFilter, options.scopedVars, 'glob') : null;
    var templateName = options.annotation.template ? options.annotation.template.Name : null;
    var annotationOptions = {
      name: options.annotation.name,
      datasource: options.annotation.datasource,
      enable: options.annotation.enable,
      iconColor: options.annotation.iconColor,
      showEndTime: options.annotation.showEndTime,
      regex: options.annotation.regex,
      attribute: options.annotation.attribute,
      categoryName: categoryName,
      templateName: templateName,
      nameFilter: nameFilter
    };
    var filter = [];

    if (!!annotationOptions.categoryName) {
      filter.push('categoryName=' + annotationOptions.categoryName);
    }

    if (!!annotationOptions.nameFilter) {
      filter.push('nameFilter=' + annotationOptions.nameFilter);
    }

    if (!!annotationOptions.templateName) {
      filter.push('templateName=' + annotationOptions.templateName);
    }

    if (!filter.length) {
      return Promise.resolve([]);
    }

    filter.push('startTime=' + options.range.from.toJSON());
    filter.push('endTime=' + options.range.to.toJSON());

    if (annotationOptions.attribute && annotationOptions.attribute.enable) {
      var resourceUrl = this.piwebapiurl + '/streamsets/{0}/value?selectedFields=Items.WebId;Items.Value;Items.Name';

      if (!!annotationOptions.attribute.name) {
        resourceUrl = this.piwebapiurl + '/streamsets/{0}/value?nameFilter=' + annotationOptions.attribute.name + '&selectedFields=Items.WebId;Items.Value;Items.Name';
      }

      var query = {};
      query['1'] = {
        'Method': 'GET',
        'Resource': this.piwebapiurl + '/assetdatabases/' + this.afdatabase.webid + '/eventframes?' + filter.join('&')
      }, query['2'] = {
        'Method': 'GET',
        'RequestTemplate': {
          'Resource': resourceUrl
        },
        'Parameters': ['$.1.Content.Items[*].WebId'],
        'ParentIds': ['1']
      };
      return this.restBatch(query).then(function (result) {
        var data = result.data['1'].Content;
        var valueData = result.data['2'].Content;
        var annotations = Object(lodash__WEBPACK_IMPORTED_MODULE_1__["map"])(data.Items, function (item, index) {
          return Object(lodash__WEBPACK_IMPORTED_MODULE_1__["curry"])(_this.eventFrameToAnnotation)(annotationOptions, false, item, valueData.Items[index].Content.Items);
        });

        if (options.annotation.showEndTime) {
          var ends = Object(lodash__WEBPACK_IMPORTED_MODULE_1__["map"])(data.Items, function (item, index) {
            return Object(lodash__WEBPACK_IMPORTED_MODULE_1__["curry"])(_this.eventFrameToAnnotation)(annotationOptions, true, item, valueData.Items[index].Content.Items);
          });
          Object(lodash__WEBPACK_IMPORTED_MODULE_1__["each"])(ends, function (end) {
            annotations.push(end);
          });
        }

        return annotations;
      });
    } else {
      return this.restGet('/assetdatabases/' + this.afdatabase.webid + '/eventframes?' + filter.join('&')).then(function (result) {
        var annotations = Object(lodash__WEBPACK_IMPORTED_MODULE_1__["map"])(result.data.Items, Object(lodash__WEBPACK_IMPORTED_MODULE_1__["curry"])(_this.eventFrameToAnnotation)(annotationOptions, false));

        if (options.annotation.showEndTime) {
          var ends = Object(lodash__WEBPACK_IMPORTED_MODULE_1__["map"])(result.data.Items, Object(lodash__WEBPACK_IMPORTED_MODULE_1__["curry"])(_this.eventFrameToAnnotation)(annotationOptions, true));
          Object(lodash__WEBPACK_IMPORTED_MODULE_1__["each"])(ends, function (end) {
            annotations.push(end);
          });
        }

        return annotations;
      });
    }
  };
  /**
   * Builds the Grafana metric segment for use on the query user interface.
   *
   * @param {any} response - response from PI Web API.
   * @returns - Grafana metric segment.
   *
   * @memberOf PiWebApiDatasource
   */


  PiWebAPIDatasource.prototype.metricQueryTransform = function (response) {
    return Object(lodash__WEBPACK_IMPORTED_MODULE_1__["map"])(response, function (item) {
      var _a, _b;

      return {
        text: item.Name,
        expandable: item.HasChildren === undefined || item.HasChildren === true || ((_a = item.Path) !== null && _a !== void 0 ? _a : '').split('\\').length <= 3,
        HasChildren: item.HasChildren,
        Items: (_b = item.Items) !== null && _b !== void 0 ? _b : [],
        Path: item.Path,
        WebId: item.WebId
      };
    });
  };
  /**
   * This method does the discovery of the AF Hierarchy and populates the query user interface segments.
   *
   * @param {any} query - Parses the query configuration and builds a PI Web API query.
   * @returns - Segment information.
   *
   * @memberOf PiWebApiDatasource
   */


  PiWebAPIDatasource.prototype.metricFindQuery = function (query, isPiPoint) {
    var ds = this;
    var querydepth = ['servers', 'databases', 'databaseElements', 'elements'];

    if (!isPiPoint) {
      if (query.path === '') {
        query.type = querydepth[0];
      } else if (query.type !== 'attributes') {
        query.type = querydepth[Math.max(0, Math.min(query.path.split('\\').length, querydepth.length - 1))];
      }
    }

    query.path = this.templateSrv.replace(query.path);

    if (query.type === 'servers') {
      return ds.getAssetServers().then(ds.metricQueryTransform);
    } else if (query.type === 'databases') {
      return ds.getAssetServer(query.path).then(function (server) {
        var _a;

        return ds.getDatabases((_a = server.WebId) !== null && _a !== void 0 ? _a : '', {});
      }).then(ds.metricQueryTransform);
    } else if (query.type === 'databaseElements') {
      return ds.getDatabase(query.path).then(function (db) {
        var _a;

        return ds.getDatabaseElements((_a = db.WebId) !== null && _a !== void 0 ? _a : '', {
          selectedFields: 'Items.WebId;Items.Name;Items.Items;Items.Path;Items.HasChildren'
        });
      }).then(ds.metricQueryTransform);
    } else if (query.type === 'elements') {
      return ds.getElement(query.path).then(function (element) {
        var _a;

        return ds.getElements((_a = element.WebId) !== null && _a !== void 0 ? _a : '', {
          selectedFields: 'Items.WebId;Items.Name;Items.Items;Items.Path;Items.HasChildren'
        });
      }).then(ds.metricQueryTransform);
    } else if (query.type === 'attributes') {
      return ds.getElement(query.path).then(function (element) {
        var _a;

        return ds.getAttributes((_a = element.WebId) !== null && _a !== void 0 ? _a : '', {
          searchFullHierarchy: 'true',
          selectedFields: 'Items.WebId;Items.Name;Items.Path'
        });
      }).then(ds.metricQueryTransform);
    } else if (query.type === 'dataserver') {
      return ds.getDataServers().then(ds.metricQueryTransform);
    } else if (query.type === 'pipoint') {
      return ds.piPointSearch(query.webId, query.pointName).then(ds.metricQueryTransform);
    }
  };
  /**
   * Gets the url of summary data from the query configuration.
   *
   * @param {any} summary - Query summary configuration.
   * @returns - URL append string.
   *
   * @memberOf PiWebApiDatasource
   */


  PiWebAPIDatasource.prototype.getSummaryUrl = function (summary) {
    if (summary.interval == "") {
      return '&summaryType=' + summary.types.join('&summaryType=') + '&calculationBasis=' + summary.basis;
    }

    return '&summaryType=' + summary.types.join('&summaryType=') + '&calculationBasis=' + summary.basis + '&summaryDuration=' + summary.interval;
  };
  /**
   * Resolve a Grafana query into a PI Web API webid. Uses client side cache when possible to reduce lookups.
   *
   * @param {any} query - Grafana query configuration.
   *
   * @memberOf PiWebApiDatasource
   */


  PiWebAPIDatasource.prototype.resolveWebIds = function (query) {
    var batchQuery = {};
    var batchIndex = 1;
    Object(lodash__WEBPACK_IMPORTED_MODULE_1__["each"])(query.targets, function (target) {
      var hasAttributes = target.attributes.length > 0;
      var elementBatchId = batchIndex++;
      batchQuery[elementBatchId.toString()] = {
        'Method': 'GET',
        'Resource': '/elements?selectedFields=WebId;Name;Path&path=\\\\' + encodeURIComponent(target.elementPath)
      };

      if (hasAttributes) {
        Object(lodash__WEBPACK_IMPORTED_MODULE_1__["each"])(target.attributes, function (attribute) {
          batchQuery[(batchIndex++).toString()] = {
            'Method': 'GET',
            'Resource': '/elements/{0}/attributes?selectedFields=WebId;Name;Path&nameFilter=' + encodeURIComponent(target.elementPath),
            'Parameters': ['$.' + elementBatchId + '.Content.WebId'],
            'ParentIds': [elementBatchId.toString()]
          };
        });
      } else {// do nothing
      }

      target.attributes;
    });
  };
  /**
   * Resolve PIWebAPI response 'value' data to value - timestamp pairs.
   *
   * @param {any} value - A list of PIWebAPI values.
   * @param {any} target - The target Grafana metric.
   * @param {any} isSummary - Boolean for tracking if data is of summary class.
   * @returns - An array of Grafana value, timestamp pairs.
   *
   */


  PiWebAPIDatasource.prototype.parsePiPointValueList = function (value, target, isSummary) {
    var _this = this;

    var api = this;
    var datapoints = [];
    Object(lodash__WEBPACK_IMPORTED_MODULE_1__["each"])(value, function (item) {
      var grafanaDataPoint = api.parsePiPointValue(item, target, isSummary);
      var drop = false;

      if (isSummary) {
        // @ts-ignore
        var _a = _this.noDataReplace(item.Value, target.summary.nodata, grafanaDataPoint),
            grafanaDataPoint = _a.grafanaDataPoint,
            previousValue = _a.previousValue,
            drop = _a.drop;
      } else {
        // @ts-ignore
        var _b = _this.noDataReplace(item, target.summary.nodata, grafanaDataPoint),
            grafanaDataPoint = _b.grafanaDataPoint,
            previousValue = _b.previousValue,
            drop = _b.drop;
      }

      if (!drop) {
        datapoints.push(grafanaDataPoint);
      }
    });
    return datapoints;
  };
  /**
   * Convert a PI Point value to use Grafana value/timestamp.
   *
   * @param {any} value - PI Point value.
   * @param {any} isSummary - Boolean for tracking if data is of summary class.
   * @param {any} target - The target grafana metric.
   * @returns - Grafana value pair.
   *
   */


  PiWebAPIDatasource.prototype.parsePiPointValue = function (value, target, isSummary) {
    var num = !isSummary && _typeof(value.Value) === "object" ? Number(value.Value.Value) : Number(value.Value);
    var text = value.Value;

    if (target.digitalStates && target.digitalStates.enable) {
      num = value.Value.Name;
    }

    if (!value.Good) {
      num = value.Value.Name;
    }

    if (!!isSummary) {
      num = Number(value.Value.Value);
      text = value.Value.Value;

      if (target.digitalStates && target.digitalStates.enable) {
        num = value.Value.Name;
      }

      if (!value.Value.Good) {
        num = value.Value.Name;
      }

      if (target.summary.interval == "") {
        if (target.digitalStates && target.digitalStates.enable) {
          return [num, new Date(value.Timestamp).getTime()];
        } else if (!value.Good) {
          return [num, new Date(value.Timestamp).getTime()];
        } else {
          return [!isNaN(num) ? num : text, new Date(target.endTime).getTime()];
        }
      }

      if (target.digitalStates && target.digitalStates.enable) {
        return [num, new Date(value.Timestamp).getTime()];
      } else if (!value.Good) {
        return [num, new Date(value.Timestamp).getTime()];
      } else {
        return [!isNaN(num) ? num : text, new Date(value.Value.Timestamp).getTime()];
      }
    }

    if (target.digitalStates && target.digitalStates.enable) {
      return [num, new Date(value.Timestamp).getTime()];
    } else if (!value.Good) {
      return [num, new Date(value.Timestamp).getTime()];
    } else {
      return [!isNaN(num) ? num : text, new Date(value.Timestamp).getTime()];
    }

    return [!isNaN(num) ? num : 0, new Date(value.Timestamp).getTime()];
  };
  /**
   * Resolve PIWebAPI response 'value' data to value - timestamp pairs.
   *
   * @param {any} item - 'Item' object from PIWebAPI
   * @param {any} noDataReplacementMode - String state of how to replace 'No Data'
   * @param {any} grafanaDataPoint - Single Grafana value pair (value, timestamp).
   * @returns grafanaDataPoint - Single Grafana value pair (value, timestamp).
   * @returns perviousValue - {any} Grafana value (value only).
   *
   */


  PiWebAPIDatasource.prototype.noDataReplace = function (item, noDataReplacementMode, grafanaDataPoint) {
    var previousValue = null;
    var drop = false;

    if (item.Value === 'No Data' || item.Value.Name && item.Value.Name === 'No Data' || !item.Good) {
      if (noDataReplacementMode === 'Drop') {
        drop = true;
      } else if (noDataReplacementMode === '0') {
        grafanaDataPoint[0] = 0;
      } else if (noDataReplacementMode === 'Keep') {// Do nothing keep
      } else if (noDataReplacementMode === 'Null') {
        grafanaDataPoint[0] = null;
      } else if (noDataReplacementMode === 'Previous' && previousValue !== null) {
        grafanaDataPoint[0] = previousValue;
      }
    } else {
      previousValue = item.Value;
    }

    return {
      grafanaDataPoint: grafanaDataPoint,
      previousValue: previousValue,
      drop: drop
    };
  };
  /**
   * Process the response from PI Web API for a single item.
   *
   * @param {any} content - Web response data.
   * @param {any} target - The target grafana metric.
   * @param {any} name - The target metric name.
   * @returns - Parsed metric in target/datapoint json format.
   *
   * @memberOf PiWebApiDatasource
   */


  PiWebAPIDatasource.prototype.processResults = function (content, target, name) {
    var api = this;
    var isSummary = target.summary && target.summary.types && target.summary.types.length > 0;

    if (target.regex && target.regex.enable) {
      name = name.replace(new RegExp(target.regex.search), target.regex.replace);
    }

    if (isSummary) {
      var innerResults = [];
      var groups = Object(lodash__WEBPACK_IMPORTED_MODULE_1__["groupBy"])(content.Items, function (item) {
        return item.Type;
      });
      Object(lodash__WEBPACK_IMPORTED_MODULE_1__["forOwn"])(groups, function (value, key) {
        innerResults.push({
          'target': name + '[' + key + ']',
          'refId': target.refId,
          'datapoints': api.parsePiPointValueList(value, target, isSummary)
        });
      });
      return innerResults;
    }

    return [{
      'target': name,
      'refId': target.refId,
      'datapoints': api.parsePiPointValueList(content.Items, target, isSummary)
    }];
  };
  /**
   * Gets historical data from a PI Web API stream source.
   *
   * @param {any} query - Grafana query.
   * @returns - Metric data.
   *
   * @memberOf PiWebApiDatasource
   */


  PiWebAPIDatasource.prototype.getStream = function (query) {
    var _this = this;

    var api = this;
    var results = [];
    Object(lodash__WEBPACK_IMPORTED_MODULE_1__["each"])(query.targets, function (target) {
      target.attributes = Object(lodash__WEBPACK_IMPORTED_MODULE_1__["filter"])(target.attributes || [], function (attribute) {
        return  true && attribute;
      });
      var url = '';
      var isSummary = target.summary && target.summary.types && target.summary.types.length > 0;
      var isInterpolated = target.interpolate && target.interpolate.enable; // perhaps add a check to see if interpolate override time < query.interval

      var intervalTime = target.interpolate.interval ? target.interpolate.interval : query.interval;
      var timeRange = '?startTime=' + query.range.from.toJSON() + '&endTime=' + query.range.to.toJSON();
      var targetName = target.expression || target.elementPath;

      if (target.expression) {
        url += '/calculation';

        if (isSummary) {
          url += '/summary' + timeRange + (isInterpolated ? '&sampleType=Interval&sampleInterval=' + intervalTime : '');
        } else {
          url += '/intervals' + timeRange + '&sampleInterval=' + intervalTime;
        }

        url += '&expression=' + encodeURIComponent(target.expression);
        url += '&webid=';

        if (target.attributes.length > 0) {
          Object(lodash__WEBPACK_IMPORTED_MODULE_1__["each"])(target.attributes, function (attribute) {
            results.push(api.restGetWebId(target.elementPath + '|' + attribute, target.isPiPoint).then(function (webidresponse) {
              return api.restPost(url + webidresponse.WebId).then(function (response) {
                return api.processResults(response.data, target, target.display || attribute || targetName);
              })["catch"](function (err) {
                api.error = err;
              });
            }));
          });
        } else {
          results.push(api.restGetWebId(target.elementPath, target.isPiPoint).then(function (webidresponse) {
            return api.restPost(url + webidresponse.WebId).then(function (response) {
              return api.processResults(response.data, target, target.display || targetName);
            })["catch"](function (err) {
              api.error = err;
            });
          }));
        }
      } else {
        url += '/streamsets';

        if (isSummary) {
          url += '/summary' + timeRange + '&intervals=' + query.maxDataPoints + _this.getSummaryUrl(target.summary);
        } else if (target.interpolate && target.interpolate.enable) {
          url += '/interpolated' + timeRange + '&interval=' + intervalTime;
        } else if (target.recordedValues && target.recordedValues.enable) {
          url += '/recorded' + timeRange + '&maxCount=' + target.recordedValues.maxNumber;
        } else {
          url += '/plot' + timeRange + '&intervals=' + query.maxDataPoints;
        }

        results.push(Promise.all(Object(lodash__WEBPACK_IMPORTED_MODULE_1__["map"])(target.attributes, function (attribute) {
          return api.restGetWebId(target.elementPath + '|' + attribute, target.isPiPoint);
        })).then(function (webidresponse) {
          var query = {};
          Object(lodash__WEBPACK_IMPORTED_MODULE_1__["each"])(webidresponse, function (webid, index) {
            query[index + 1] = {
              "Method": "GET",
              "Resource": api.piwebapiurl + url + '&webid=' + webid.WebId
            };
          });
          return api.restBatch(query).then(function (response) {
            var targetResults = [];
            Object(lodash__WEBPACK_IMPORTED_MODULE_1__["each"])(response.data, function (value, key) {
              Object(lodash__WEBPACK_IMPORTED_MODULE_1__["each"])(value.Content.Items, function (item) {
                Object(lodash__WEBPACK_IMPORTED_MODULE_1__["each"])(api.processResults(item, target, target.display || item.Name || targetName), function (targetResult) {
                  targetResults.push(targetResult);
                });
              });
            });
            return targetResults;
          })["catch"](function (err) {
            api.error = err;
          });
        }));
      }
    });
    return results;
  };
  /** PRIVATE SECTION */

  /**
   * Abstraction for calling the PI Web API REST endpoint
   *
   * @param {any} path - the path to append to the base server URL.
   * @returns - The full URL.
   *
   * @memberOf PiWebApiDatasource
   */


  PiWebAPIDatasource.prototype.restGet = function (path) {
    return this.backendSrv.datasourceRequest({
      url: this.url + path,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    }).then(function (response) {
      return response;
    });
  };
  /**
   * Resolve a Grafana query into a PI Web API webid. Uses client side cache when possible to reduce lookups.
   *
   * @param {string} assetPath - The AF Path or the Pi Point Path (\\ServerName\piPointName) to the asset.
   * @param {boolean} isPiPoint - Flag indicating it's a PI Point
   * @returns - URL query parameters.
   *
   * @memberOf PiWebApiDatasource
   */


  PiWebAPIDatasource.prototype.restGetWebId = function (assetPath, isPiPoint) {
    var ds = this; // check cache

    var cachedWebId = ds.webidCache.get(assetPath);

    if (cachedWebId) {
      return Promise.resolve({
        Path: assetPath,
        WebId: cachedWebId
      });
    }

    if (isPiPoint) {
      var path = '/points?selectedFields=WebId;Name;Path&path=\\\\' + assetPath.replace('|', '\\');
    } else {
      // no cache hit, query server
      var path = (assetPath.indexOf('|') >= 0 ? '/attributes?selectedFields=WebId;Name;Path&path=\\\\' : '/elements?selectedFields=WebId;Name;Path&path=\\\\') + assetPath;
    }

    return this.backendSrv.datasourceRequest({
      url: this.url + path,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    }).then(function (response) {
      ds.webidCache.set(assetPath, response.data.WebId);
      return {
        Path: assetPath,
        WebId: response.data.WebId
      };
    });
  };
  /**
   * Execute a batch query on the PI Web API.
   *
   * @param {any} batch - Batch JSON query data.
   * @returns - Batch response.
   *
   * @memberOf PiWebApiDatasource
   */


  PiWebAPIDatasource.prototype.restBatch = function (batch) {
    return this.backendSrv.datasourceRequest({
      url: this.url + '/batch',
      data: batch,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'message/http'
      }
    });
  };
  /**
   * Execute a POST on the PI Web API.
   *
   * @param {string} path - The full url of the POST.
   * @returns - POST response data.
   *
   * @memberOf PiWebApiDatasource
   */


  PiWebAPIDatasource.prototype.restPost = function (path) {
    return this.backendSrv.datasourceRequest({
      url: this.url,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'message/http',
        'X-PIWEBAPI-HTTP-METHOD': 'GET',
        'X-PIWEBAPI-RESOURCE-ADDRESS': path
      }
    });
  }; // Get a list of all data (PI) servers


  PiWebAPIDatasource.prototype.getDataServers = function () {
    return this.restGet('/dataservers').then(function (response) {
      var _a;

      return (_a = response.data.Items) !== null && _a !== void 0 ? _a : [];
    });
  };

  PiWebAPIDatasource.prototype.getDataServer = function (name) {
    if (!name) return Promise.resolve({});
    return this.restGet('/dataservers?name=' + name).then(function (response) {
      return response.data;
    });
  }; // Get a list of all asset (AF) servers


  PiWebAPIDatasource.prototype.getAssetServers = function () {
    return this.restGet('/assetservers').then(function (response) {
      var _a;

      return (_a = response.data.Items) !== null && _a !== void 0 ? _a : [];
    });
  };

  PiWebAPIDatasource.prototype.getAssetServer = function (name) {
    if (!name) return Promise.resolve({});
    return this.restGet('/assetservers?path=\\\\' + name).then(function (response) {
      return response.data;
    });
  };

  PiWebAPIDatasource.prototype.getDatabase = function (path) {
    if (!path) return Promise.resolve({});
    return this.restGet('/assetdatabases?path=\\\\' + path).then(function (response) {
      return response.data;
    });
  };

  PiWebAPIDatasource.prototype.getDatabases = function (serverId, options) {
    return this.restGet('/assetservers/' + serverId + '/assetdatabases').then(function (response) {
      var _a;

      return (_a = response.data.Items) !== null && _a !== void 0 ? _a : [];
    });
  };

  PiWebAPIDatasource.prototype.getElement = function (path) {
    return this.restGet('/elements?path=\\\\' + path).then(function (response) {
      return response.data;
    });
  };

  PiWebAPIDatasource.prototype.getEventFrameTemplates = function (databaseId) {
    return this.restGet('/assetdatabases/' + databaseId + '/elementtemplates?selectedFields=Items.InstanceType;Items.Name;Items.WebId').then(function (response) {
      var _a;

      return Object(lodash__WEBPACK_IMPORTED_MODULE_1__["filter"])((_a = response.data.Items) !== null && _a !== void 0 ? _a : [], function (item) {
        return item.InstanceType === 'EventFrame';
      });
    });
  };

  PiWebAPIDatasource.prototype.getElementTemplates = function (databaseId) {
    return this.restGet('/assetdatabases/' + databaseId + '/elementtemplates?selectedFields=Items.InstanceType;Items.Name;Items.WebId').then(function (response) {
      var _a;

      return Object(lodash__WEBPACK_IMPORTED_MODULE_1__["filter"])((_a = response.data.Items) !== null && _a !== void 0 ? _a : [], function (item) {
        return item.InstanceType === 'Element';
      });
    });
  };
  /**
   * @description
   * Get the child attributes of the current resource.
   * GET attributes/{webId}/attributes
   * @param {string} elementId - The ID of the parent resource. See WebID for more information.
   * @param {Object} options - Query Options
   * @param {string} options.nameFilter - The name query string used for finding attributes. The default is no filter. See Query String for more information.
   * @param {string} options.categoryName - Specify that returned attributes must have this category. The default is no category filter.
   * @param {string} options.templateName - Specify that returned attributes must be members of this template. The default is no template filter.
   * @param {string} options.valueType - Specify that returned attributes' value type must be the given value type. The default is no value type filter.
   * @param {string} options.searchFullHierarchy - Specifies if the search should include attributes nested further than the immediate attributes of the searchRoot. The default is 'false'.
   * @param {string} options.sortField - The field or property of the object used to sort the returned collection. The default is 'Name'.
   * @param {string} options.sortOrder - The order that the returned collection is sorted. The default is 'Ascending'.
   * @param {string} options.startIndex - The starting index (zero based) of the items to be returned. The default is 0.
   * @param {string} options.showExcluded - Specified if the search should include attributes with the Excluded property set. The default is 'false'.
   * @param {string} options.showHidden - Specified if the search should include attributes with the Hidden property set. The default is 'false'.
   * @param {string} options.maxCount - The maximum number of objects to be returned per call (page size). The default is 1000.
   * @param {string} options.selectedFields - List of fields to be returned in the response, separated by semicolons (;). If this parameter is not specified, all available fields will be returned. See Selected Fields for more information.
   */


  PiWebAPIDatasource.prototype.getAttributes = function (elementId, options) {
    var querystring = '?' + Object(lodash__WEBPACK_IMPORTED_MODULE_1__["map"])(options, function (value, key) {
      return key + '=' + value;
    }).join('&');

    if (querystring === '?') {
      querystring = '';
    }

    return this.restGet('/elements/' + elementId + '/attributes' + querystring).then(function (response) {
      var _a;

      return (_a = response.data.Items) !== null && _a !== void 0 ? _a : [];
    });
  };
  /**
   * @description
   * Retrieve elements based on the specified conditions. By default, this method selects immediate children of the current resource.
   * Users can search for the elements based on specific search parameters. If no parameters are specified in the search, the default values for each parameter will be used and will return the elements that match the default search.
   * GET assetdatabases/{webId}/elements
   * @param {string} databaseId - The ID of the parent resource. See WebID for more information.
   * @param {Object} options - Query Options
   * @param {string} options.webId - The ID of the resource to use as the root of the search. See WebID for more information.
   * @param {string} options.nameFilter - The name query string used for finding objects. The default is no filter. See Query String for more information.
   * @param {string} options.categoryName - Specify that returned elements must have this category. The default is no category filter.
   * @param {string} options.templateName - Specify that returned elements must have this template or a template derived from this template. The default is no template filter.
   * @param {string} options.elementType - Specify that returned elements must have this type. The default type is 'Any'. See Element Type for more information.
   * @param {string} options.searchFullHierarchy - Specifies if the search should include objects nested further than the immediate children of the searchRoot. The default is 'false'.
   * @param {string} options.sortField - The field or property of the object used to sort the returned collection. The default is 'Name'.
   * @param {string} options.sortOrder - The order that the returned collection is sorted. The default is 'Ascending'.
   * @param {number} options.startIndex - The starting index (zero based) of the items to be returned. The default is 0.
   * @param {number} options.maxCount - The maximum number of objects to be returned per call (page size). The default is 1000.
   * @param {string} options.selectedFields -  List of fields to be returned in the response, separated by semicolons (;). If this parameter is not specified, all available fields will be returned. See Selected Fields for more information.
   */


  PiWebAPIDatasource.prototype.getDatabaseElements = function (databaseId, options) {
    var querystring = '?' + Object(lodash__WEBPACK_IMPORTED_MODULE_1__["map"])(options, function (value, key) {
      return key + '=' + value;
    }).join('&');

    if (querystring === '?') {
      querystring = '';
    }

    return this.restGet('/assetdatabases/' + databaseId + '/elements' + querystring).then(function (response) {
      var _a;

      return (_a = response.data.Items) !== null && _a !== void 0 ? _a : [];
    });
  };
  /**
   * @description
   * Retrieve elements based on the specified conditions. By default, this method selects immediate children of the current resource.
   * Users can search for the elements based on specific search parameters. If no parameters are specified in the search, the default values for each parameter will be used and will return the elements that match the default search.
   * GET elements/{webId}/elements
   * @param {string} databaseId - The ID of the resource to use as the root of the search. See WebID for more information.
   * @param {Object} options - Query Options
   * @param {string} options.webId - The ID of the resource to use as the root of the search. See WebID for more information.
   * @param {string} options.nameFilter - The name query string used for finding objects. The default is no filter. See Query String for more information.
   * @param {string} options.categoryName - Specify that returned elements must have this category. The default is no category filter.
   * @param {string} options.templateName - Specify that returned elements must have this template or a template derived from this template. The default is no template filter.
   * @param {string} options.elementType - Specify that returned elements must have this type. The default type is 'Any'. See Element Type for more information.
   * @param {string} options.searchFullHierarchy - Specifies if the search should include objects nested further than the immediate children of the searchRoot. The default is 'false'.
   * @param {string} options.sortField - The field or property of the object used to sort the returned collection. The default is 'Name'.
   * @param {string} options.sortOrder - The order that the returned collection is sorted. The default is 'Ascending'.
   * @param {number} options.startIndex - The starting index (zero based) of the items to be returned. The default is 0.
   * @param {number} options.maxCount - The maximum number of objects to be returned per call (page size). The default is 1000.
   * @param {string} options.selectedFields -  List of fields to be returned in the response, separated by semicolons (;). If this parameter is not specified, all available fields will be returned. See Selected Fields for more information.
   */


  PiWebAPIDatasource.prototype.getElements = function (elementId, options) {
    var querystring = '?' + Object(lodash__WEBPACK_IMPORTED_MODULE_1__["map"])(options, function (value, key) {
      return key + '=' + value;
    }).join('&');

    if (querystring === '?') {
      querystring = '';
    }

    return this.restGet('/elements/' + elementId + '/elements' + querystring).then(function (response) {
      var _a;

      return (_a = response.data.Items) !== null && _a !== void 0 ? _a : [];
    });
  };
  /**
   * Retrieve a list of points on a specified Data Server.
   *
   * @param {string} serverId - The ID of the server. See WebID for more information.
   * @param {string} nameFilter - A query string for filtering by point name. The default is no filter. *, ?, [ab], [!ab]
   */


  PiWebAPIDatasource.prototype.piPointSearch = function (serverId, nameFilter) {
    return this.restGet('/dataservers/' + serverId + '/points?maxCount=20&nameFilter=' + nameFilter).then(function (results) {
      var _a;

      return (_a = results.data.Items) !== null && _a !== void 0 ? _a : [];
    });
  };
  /**
   * Get the PI Web API webid or PI Point.
   *
   * @param {any} target - AF Path or Point name.
   * @returns - webid.
   *
   * @memberOf PiWebApiDatasource
   */


  PiWebAPIDatasource.prototype.getWebId = function (target) {
    var api = this;
    var isAf = target.target.indexOf('\\') >= 0;
    var isAttribute = target.target.indexOf('|') >= 0;

    if (!isAf && target.target.indexOf('.') === -1) {
      return Promise.resolve([{
        WebId: target.target,
        Name: target.display || target.target
      }]);
    }

    if (!isAf) {
      // pi point lookup
      return api.piPointSearch(this.piserver.webid, target.target).then(function (results) {
        if (results === undefined || results.length === 0) {
          return [{
            WebId: target.target,
            Name: target.display || target.target
          }];
        }

        return results;
      });
    } else if (isAf && isAttribute) {
      // af attribute lookup
      return api.restGet('/attributes?path=\\\\' + target.target).then(function (results) {
        if (results.data === undefined || results.status !== 200) {
          return [{
            WebId: target.target,
            Name: target.display || target.target
          }];
        } // rewrite name if specified


        results.data.Name = target.display || results.data.Name;
        return [results.data];
      });
    } else {
      // af element lookup
      return api.restGet('/elements?path=\\\\' + target.target).then(function (results) {
        if (results.data === undefined || results.status !== 200) {
          return [{
            WebId: target.target,
            Name: target.display || target.target
          }];
        } // rewrite name if specified


        results.data.Name = target.display || results.data.Name;
        return [results.data];
      });
    }
  };

  return PiWebAPIDatasource;
}(_grafana_data__WEBPACK_IMPORTED_MODULE_2__["DataSourceApi"]);



/***/ }),

/***/ "./module.ts":
/*!*******************!*\
  !*** ./module.ts ***!
  \*******************/
/*! exports provided: plugin */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "plugin", function() { return plugin; });
/* harmony import */ var _grafana_data__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @grafana/data */ "@grafana/data");
/* harmony import */ var _grafana_data__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_grafana_data__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _AnnotationsQueryCtrl__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./AnnotationsQueryCtrl */ "./AnnotationsQueryCtrl.ts");
/* harmony import */ var _ConfigEditor__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./ConfigEditor */ "./ConfigEditor.tsx");
/* harmony import */ var _QueryEditor__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./QueryEditor */ "./QueryEditor.tsx");
/* harmony import */ var _datasource__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./datasource */ "./datasource.ts");





var plugin = new _grafana_data__WEBPACK_IMPORTED_MODULE_0__["DataSourcePlugin"](_datasource__WEBPACK_IMPORTED_MODULE_4__["PiWebAPIDatasource"]).setConfigEditor(_ConfigEditor__WEBPACK_IMPORTED_MODULE_2__["PIWebAPIConfigEditor"]).setQueryEditor(_QueryEditor__WEBPACK_IMPORTED_MODULE_3__["PIWebAPIQueryEditor"]).setAnnotationQueryCtrl(_AnnotationsQueryCtrl__WEBPACK_IMPORTED_MODULE_1__["AnnotationsQueryCtrl"]);

/***/ }),

/***/ "./types.ts":
/*!******************!*\
  !*** ./types.ts ***!
  \******************/
/*! exports provided: defaultQuery */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "defaultQuery", function() { return defaultQuery; });
var defaultQuery = {
  target: ';',
  attributes: [],
  segments: [],
  regex: {
    enable: false
  },
  summary: {
    types: [],
    basis: 'EventWeighted',
    interval: '',
    nodata: 'Null'
  },
  expression: '',
  interpolate: {
    enable: false
  },
  recordedValues: {
    enable: false
  },
  digitalStates: {
    enable: false
  },
  isPiPoint: false
};

/***/ }),

/***/ "@grafana/data":
/*!********************************!*\
  !*** external "@grafana/data" ***!
  \********************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = __WEBPACK_EXTERNAL_MODULE__grafana_data__;

/***/ }),

/***/ "@grafana/runtime":
/*!***********************************!*\
  !*** external "@grafana/runtime" ***!
  \***********************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = __WEBPACK_EXTERNAL_MODULE__grafana_runtime__;

/***/ }),

/***/ "@grafana/ui":
/*!******************************!*\
  !*** external "@grafana/ui" ***!
  \******************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = __WEBPACK_EXTERNAL_MODULE__grafana_ui__;

/***/ }),

/***/ "lodash":
/*!*************************!*\
  !*** external "lodash" ***!
  \*************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = __WEBPACK_EXTERNAL_MODULE_lodash__;

/***/ }),

/***/ "react":
/*!************************!*\
  !*** external "react" ***!
  \************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = __WEBPACK_EXTERNAL_MODULE_react__;

/***/ })

/******/ })});;
//# sourceMappingURL=module.js.map
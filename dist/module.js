define(["@grafana/data","@grafana/runtime","@grafana/ui","lodash","react","rxjs"], (__WEBPACK_EXTERNAL_MODULE__grafana_data__, __WEBPACK_EXTERNAL_MODULE__grafana_runtime__, __WEBPACK_EXTERNAL_MODULE__grafana_ui__, __WEBPACK_EXTERNAL_MODULE_lodash__, __WEBPACK_EXTERNAL_MODULE_react__, __WEBPACK_EXTERNAL_MODULE_rxjs__) => { return /******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./components/Forms.tsx":
/*!******************************!*\
  !*** ./components/Forms.tsx ***!
  \******************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "QueryEditorRow": () => (/* binding */ QueryEditorRow),
/* harmony export */   "QueryField": () => (/* binding */ QueryField),
/* harmony export */   "QueryInlineField": () => (/* binding */ QueryInlineField),
/* harmony export */   "QueryRawEditorRow": () => (/* binding */ QueryRawEditorRow),
/* harmony export */   "QueryRawInlineField": () => (/* binding */ QueryRawInlineField),
/* harmony export */   "QueryRowTerminator": () => (/* binding */ QueryRowTerminator)
/* harmony export */ });
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react */ "react");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _grafana_ui__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @grafana/ui */ "@grafana/ui");
/* harmony import */ var _grafana_ui__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_grafana_ui__WEBPACK_IMPORTED_MODULE_1__);
var _div, _QueryRowTerminator;
function _extends() { _extends = Object.assign ? Object.assign.bind() : function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; }; return _extends.apply(this, arguments); }


var QueryField = function QueryField(_ref) {
  var label = _ref.label,
    _ref$labelWidth = _ref.labelWidth,
    labelWidth = _ref$labelWidth === void 0 ? 12 : _ref$labelWidth,
    tooltip = _ref.tooltip,
    children = _ref.children;
  return /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement((react__WEBPACK_IMPORTED_MODULE_0___default().Fragment), null, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(_grafana_ui__WEBPACK_IMPORTED_MODULE_1__.InlineFormLabel, {
    width: labelWidth,
    tooltip: tooltip
  }, label), children);
};
var QueryRowTerminator = function QueryRowTerminator() {
  return _div || (_div = /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", {
    className: "gf-form gf-form--grow"
  }, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", {
    className: "gf-form-label gf-form-label--grow"
  })));
};
var QueryInlineField = function QueryInlineField(_ref2) {
  var props = _extends({}, _ref2);
  return /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(QueryEditorRow, null, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(QueryField, props));
};
var QueryEditorRow = function QueryEditorRow(props) {
  return /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", {
    className: "gf-form-inline"
  }, props.children, _QueryRowTerminator || (_QueryRowTerminator = /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(QueryRowTerminator, null)));
};
var QueryRawInlineField = function QueryRawInlineField(_ref3) {
  var props = _extends({}, _ref3);
  return /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(QueryRawEditorRow, null, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(QueryField, props));
};
var QueryRawEditorRow = function QueryRawEditorRow(props) {
  return /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement((react__WEBPACK_IMPORTED_MODULE_0___default().Fragment), null, props.children);
};

/***/ }),

/***/ "./components/QueryEditorModeSwitcher.tsx":
/*!************************************************!*\
  !*** ./components/QueryEditorModeSwitcher.tsx ***!
  \************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "QueryEditorModeSwitcher": () => (/* binding */ QueryEditorModeSwitcher)
/* harmony export */ });
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react */ "react");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _grafana_ui__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @grafana/ui */ "@grafana/ui");
/* harmony import */ var _grafana_ui__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_grafana_ui__WEBPACK_IMPORTED_MODULE_1__);
function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _unsupportedIterableToArray(arr, i) || _nonIterableRest(); }
function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }
function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }
function _iterableToArrayLimit(arr, i) { var _i = arr == null ? null : typeof Symbol !== "undefined" && arr[Symbol.iterator] || arr["@@iterator"]; if (_i == null) return; var _arr = []; var _n = true; var _d = false; var _s, _e; try { for (_i = _i.call(arr); !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }
function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }


var QueryEditorModeSwitcher = function QueryEditorModeSwitcher(_ref) {
  var isRaw = _ref.isRaw,
    onChange = _ref.onChange;
  var _useState = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)(false),
    _useState2 = _slicedToArray(_useState, 2),
    isModalOpen = _useState2[0],
    setModalOpen = _useState2[1];
  (0,react__WEBPACK_IMPORTED_MODULE_0__.useEffect)(function () {
    // if the isRaw changes, we hide the modal
    setModalOpen(false);
  }, [isRaw]);
  if (isRaw) {
    return /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement((react__WEBPACK_IMPORTED_MODULE_0___default().Fragment), null, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(_grafana_ui__WEBPACK_IMPORTED_MODULE_1__.Button, {
      "aria-label": "Switch to visual editor",
      icon: "pen",
      variant: "secondary",
      type: "button",
      onClick: function onClick() {
        // we show the are-you-sure modal
        setModalOpen(true);
      }
    }), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(_grafana_ui__WEBPACK_IMPORTED_MODULE_1__.ConfirmModal, {
      isOpen: isModalOpen,
      title: "Switch to visual editor mode",
      body: "Are you sure to switch to visual editor mode? You will lose the changes done in raw query mode.",
      confirmText: "Yes, switch to editor mode",
      dismissText: "No, stay in raw query mode",
      onConfirm: function onConfirm() {
        onChange(false);
      },
      onDismiss: function onDismiss() {
        setModalOpen(false);
      }
    }));
  } else {
    return /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(_grafana_ui__WEBPACK_IMPORTED_MODULE_1__.Button, {
      "aria-label": "Switch to text editor",
      icon: "pen",
      variant: "secondary",
      type: "button",
      onClick: function onClick() {
        onChange(true);
      }
    });
  }
};

/***/ }),

/***/ "./config/ConfigEditor.tsx":
/*!*********************************!*\
  !*** ./config/ConfigEditor.tsx ***!
  \*********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "PIWebAPIConfigEditor": () => (/* binding */ PIWebAPIConfigEditor)
/* harmony export */ });
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react */ "react");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _grafana_ui__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @grafana/ui */ "@grafana/ui");
/* harmony import */ var _grafana_ui__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_grafana_ui__WEBPACK_IMPORTED_MODULE_1__);
function _typeof(obj) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) { return typeof obj; } : function (obj) { return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }, _typeof(obj); }
var _h, _h2;
function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }
function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }
function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); Object.defineProperty(Constructor, "prototype", { writable: false }); return Constructor; }
function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); Object.defineProperty(subClass, "prototype", { writable: false }); if (superClass) _setPrototypeOf(subClass, superClass); }
function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }
function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = _getPrototypeOf(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = _getPrototypeOf(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return _possibleConstructorReturn(this, result); }; }
function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } else if (call !== void 0) { throw new TypeError("Derived constructors may only return object or undefined"); } return _assertThisInitialized(self); }
function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }
function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); return true; } catch (e) { return false; } }
function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf.bind() : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }
function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
function _extends() { _extends = Object.assign ? Object.assign.bind() : function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; }; return _extends.apply(this, arguments); }


var FormField = _grafana_ui__WEBPACK_IMPORTED_MODULE_1__.LegacyForms.FormField;
var coerceOptions = function coerceOptions(options) {
  return _extends({}, options, {
    jsonData: _extends({}, options.jsonData, {
      url: options.url
    })
  });
};
var PIWebAPIConfigEditor = /*#__PURE__*/function (_PureComponent) {
  _inherits(PIWebAPIConfigEditor, _PureComponent);
  var _super = _createSuper(PIWebAPIConfigEditor);
  function PIWebAPIConfigEditor() {
    var _this;
    _classCallCheck(this, PIWebAPIConfigEditor);
    for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }
    _this = _super.call.apply(_super, [this].concat(args));
    _defineProperty(_assertThisInitialized(_this), "onPIServerChange", function (event) {
      var _this$props = _this.props,
        onOptionsChange = _this$props.onOptionsChange,
        options = _this$props.options;
      var jsonData = _extends({}, options.jsonData, {
        piserver: event.target.value
      });
      onOptionsChange(_extends({}, options, {
        jsonData: jsonData
      }));
    });
    _defineProperty(_assertThisInitialized(_this), "onAFServerChange", function (event) {
      var _this$props2 = _this.props,
        onOptionsChange = _this$props2.onOptionsChange,
        options = _this$props2.options;
      var jsonData = _extends({}, options.jsonData, {
        afserver: event.target.value
      });
      onOptionsChange(_extends({}, options, {
        jsonData: jsonData
      }));
    });
    _defineProperty(_assertThisInitialized(_this), "onAFDatabaseChange", function (event) {
      var _this$props3 = _this.props,
        onOptionsChange = _this$props3.onOptionsChange,
        options = _this$props3.options;
      var jsonData = _extends({}, options.jsonData, {
        afdatabase: event.target.value
      });
      onOptionsChange(_extends({}, options, {
        jsonData: jsonData
      }));
    });
    _defineProperty(_assertThisInitialized(_this), "onHttpOptionsChange", function (options) {
      var onOptionsChange = _this.props.onOptionsChange;
      onOptionsChange(coerceOptions(options));
    });
    _defineProperty(_assertThisInitialized(_this), "onPiPointChange", function (event) {
      var _this$props4 = _this.props,
        onOptionsChange = _this$props4.onOptionsChange,
        options = _this$props4.options;
      var jsonData = _extends({}, options.jsonData, {
        piserver: event.target.checked ? options.jsonData.piserver : '',
        pipoint: event.target.checked
      });
      onOptionsChange(_extends({}, options, {
        jsonData: jsonData
      }));
    });
    _defineProperty(_assertThisInitialized(_this), "onNewFormatChange", function (event) {
      var _this$props5 = _this.props,
        onOptionsChange = _this$props5.onOptionsChange,
        options = _this$props5.options;
      var jsonData = _extends({}, options.jsonData, {
        newFormat: event.target.checked
      });
      onOptionsChange(_extends({}, options, {
        jsonData: jsonData
      }));
    });
    _defineProperty(_assertThisInitialized(_this), "onUseUnitChange", function (event) {
      var _this$props6 = _this.props,
        onOptionsChange = _this$props6.onOptionsChange,
        options = _this$props6.options;
      var jsonData = _extends({}, options.jsonData, {
        useUnit: event.target.checked
      });
      onOptionsChange(_extends({}, options, {
        jsonData: jsonData
      }));
    });
    _defineProperty(_assertThisInitialized(_this), "onUseExperimentalChange", function (event) {
      var _this$props7 = _this.props,
        onOptionsChange = _this$props7.onOptionsChange,
        options = _this$props7.options;
      var jsonData = _extends({}, options.jsonData, {
        useExperimental: event.target.checked,
        useStreaming: event.target.checked ? options.jsonData.useStreaming : false
      });
      onOptionsChange(_extends({}, options, {
        jsonData: jsonData
      }));
    });
    _defineProperty(_assertThisInitialized(_this), "onUseStreamingChange", function (event) {
      var _this$props8 = _this.props,
        onOptionsChange = _this$props8.onOptionsChange,
        options = _this$props8.options;
      var jsonData = _extends({}, options.jsonData, {
        useStreaming: event.target.checked
      });
      onOptionsChange(_extends({}, options, {
        jsonData: jsonData
      }));
    });
    return _this;
  }
  _createClass(PIWebAPIConfigEditor, [{
    key: "render",
    value: function render() {
      var originalOptions = this.props.options;
      var options = coerceOptions(originalOptions);
      return /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", null, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(_grafana_ui__WEBPACK_IMPORTED_MODULE_1__.DataSourceHttpSettings, {
        defaultUrl: "https://server.name/piwebapi",
        dataSourceConfig: options,
        onChange: this.onHttpOptionsChange,
        showAccessOptions: true
      }), _h || (_h = /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("h3", {
        className: "page-heading"
      }, "Custom Configuration")), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", {
        className: "gf-form-group"
      }, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", {
        className: "gf-form-inline"
      }, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(_grafana_ui__WEBPACK_IMPORTED_MODULE_1__.InlineField, {
        label: "Enable PI Points in Query",
        labelWidth: 24
      }, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(_grafana_ui__WEBPACK_IMPORTED_MODULE_1__.InlineSwitch, {
        value: options.jsonData.pipoint,
        onChange: this.onPiPointChange
      }))), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", {
        className: "gf-form-inline"
      }, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(_grafana_ui__WEBPACK_IMPORTED_MODULE_1__.InlineField, {
        label: "Enable New Data Format",
        labelWidth: 24
      }, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(_grafana_ui__WEBPACK_IMPORTED_MODULE_1__.InlineSwitch, {
        value: options.jsonData.newFormat,
        onChange: this.onNewFormatChange
      }))), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", {
        className: "gf-form-inline"
      }, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(_grafana_ui__WEBPACK_IMPORTED_MODULE_1__.InlineField, {
        label: "Enable Unit in Data",
        labelWidth: 24
      }, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(_grafana_ui__WEBPACK_IMPORTED_MODULE_1__.InlineSwitch, {
        value: options.jsonData.useUnit,
        onChange: this.onUseUnitChange
      }))), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", {
        className: "gf-form-inline"
      }, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(_grafana_ui__WEBPACK_IMPORTED_MODULE_1__.InlineField, {
        label: "Enable Experimental Features",
        labelWidth: 24
      }, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(_grafana_ui__WEBPACK_IMPORTED_MODULE_1__.InlineSwitch, {
        value: options.jsonData.useExperimental,
        onChange: this.onUseExperimentalChange
      }))), options.jsonData.useExperimental && /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", {
        className: "gf-form-inline"
      }, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(_grafana_ui__WEBPACK_IMPORTED_MODULE_1__.InlineField, {
        label: "Enable Steaming Support",
        labelWidth: 24
      }, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(_grafana_ui__WEBPACK_IMPORTED_MODULE_1__.InlineSwitch, {
        value: options.jsonData.useStreaming,
        onChange: this.onUseStreamingChange
      })))), _h2 || (_h2 = /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("h3", {
        className: "page-heading"
      }, "PI/AF Connection Details")), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", {
        className: "gf-form-group"
      }, options.jsonData.pipoint && /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", {
        className: "gf-form"
      }, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(FormField, {
        label: "PI Server",
        labelWidth: 10,
        inputWidth: 25,
        onChange: this.onPIServerChange,
        value: options.jsonData.piserver || '',
        placeholder: "Default PI Server to use for data requests"
      })), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", {
        className: "gf-form"
      }, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(FormField, {
        label: "AF Server",
        labelWidth: 10,
        inputWidth: 25,
        onChange: this.onAFServerChange,
        value: options.jsonData.afserver || '',
        placeholder: "Default AF Server to use for data requests"
      })), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", {
        className: "gf-form"
      }, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(FormField, {
        label: "AF Database",
        labelWidth: 10,
        inputWidth: 25,
        onChange: this.onAFDatabaseChange,
        value: options.jsonData.afdatabase || '',
        placeholder: "Default AF Database server for AF queries"
      }))));
    }
  }]);
  return PIWebAPIConfigEditor;
}(react__WEBPACK_IMPORTED_MODULE_0__.PureComponent);

/***/ }),

/***/ "./datasource.ts":
/*!***********************!*\
  !*** ./datasource.ts ***!
  \***********************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "PiWebAPIDatasource": () => (/* binding */ PiWebAPIDatasource)
/* harmony export */ });
/* harmony import */ var lodash__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! lodash */ "lodash");
/* harmony import */ var lodash__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(lodash__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var rxjs__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! rxjs */ "rxjs");
/* harmony import */ var rxjs__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(rxjs__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _grafana_runtime__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @grafana/runtime */ "@grafana/runtime");
/* harmony import */ var _grafana_runtime__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(_grafana_runtime__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var helper__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! helper */ "./helper.ts");
/* harmony import */ var query_AnnotationsQueryEditor__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! query/AnnotationsQueryEditor */ "./query/AnnotationsQueryEditor.tsx");
function _typeof(obj) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) { return typeof obj; } : function (obj) { return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }, _typeof(obj); }
function _extends() { _extends = Object.assign ? Object.assign.bind() : function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; }; return _extends.apply(this, arguments); }
function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }
function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }
function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); Object.defineProperty(Constructor, "prototype", { writable: false }); return Constructor; }
function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); Object.defineProperty(subClass, "prototype", { writable: false }); if (superClass) _setPrototypeOf(subClass, superClass); }
function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }
function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = _getPrototypeOf(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = _getPrototypeOf(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return _possibleConstructorReturn(this, result); }; }
function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } else if (call !== void 0) { throw new TypeError("Derived constructors may only return object or undefined"); } return _assertThisInitialized(self); }
function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }
function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); return true; } catch (e) { return false; } }
function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf.bind() : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }
function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }





var PiWebAPIDatasource = /*#__PURE__*/function (_DataSourceWithBacken) {
  _inherits(PiWebAPIDatasource, _DataSourceWithBacken);
  var _super = _createSuper(PiWebAPIDatasource);
  function PiWebAPIDatasource(instanceSettings) {
    var _instanceSettings$jso;
    var _this;
    var templateSrv = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : (0,_grafana_runtime__WEBPACK_IMPORTED_MODULE_2__.getTemplateSrv)();
    var backendSrv = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : (0,_grafana_runtime__WEBPACK_IMPORTED_MODULE_2__.getBackendSrv)();
    _classCallCheck(this, PiWebAPIDatasource);
    _this = _super.call(this, instanceSettings);
    _defineProperty(_assertThisInitialized(_this), "piserver", void 0);
    _defineProperty(_assertThisInitialized(_this), "afserver", void 0);
    _defineProperty(_assertThisInitialized(_this), "afdatabase", void 0);
    _defineProperty(_assertThisInitialized(_this), "piPointConfig", void 0);
    _defineProperty(_assertThisInitialized(_this), "newFormatConfig", void 0);
    _defineProperty(_assertThisInitialized(_this), "useUnitConfig", void 0);
    _defineProperty(_assertThisInitialized(_this), "useExperimental", void 0);
    _defineProperty(_assertThisInitialized(_this), "useStreaming", void 0);
    _defineProperty(_assertThisInitialized(_this), "url", void 0);
    _defineProperty(_assertThisInitialized(_this), "name", void 0);
    _defineProperty(_assertThisInitialized(_this), "isProxy", false);
    _defineProperty(_assertThisInitialized(_this), "piwebapiurl", void 0);
    _defineProperty(_assertThisInitialized(_this), "webidCache", new Map());
    _defineProperty(_assertThisInitialized(_this), "error", void 0);
    _this.templateSrv = templateSrv;
    _this.backendSrv = backendSrv;
    _this.url = instanceSettings.url;
    _this.name = instanceSettings.name;
    _this.piwebapiurl = (_instanceSettings$jso = instanceSettings.jsonData.url) === null || _instanceSettings$jso === void 0 ? void 0 : _instanceSettings$jso.toString();
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
    _this.piPointConfig = instanceSettings.jsonData.pipoint || false;
    _this.newFormatConfig = instanceSettings.jsonData.newFormat || false;
    _this.useUnitConfig = instanceSettings.jsonData.useUnit || false;
    _this.useExperimental = instanceSettings.jsonData.useExperimental || false;
    _this.useStreaming = instanceSettings.jsonData.useStreaming || false;
    _this.annotations = {
      QueryEditor: query_AnnotationsQueryEditor__WEBPACK_IMPORTED_MODULE_4__.PiWebAPIAnnotationsQueryEditor,
      prepareQuery: function prepareQuery(anno) {
        if (anno.target) {
          anno.target.queryType = 'Annotation';
          anno.target.isAnnotation = true;
        }
        return anno.target;
      },
      processEvents: function processEvents(anno, data) {
        return (0,rxjs__WEBPACK_IMPORTED_MODULE_1__.of)(_this.eventFrameToAnnotation(anno, data));
      }
    };
    Promise.all([_this.getDataServer(_this.piserver.name).then(function (result) {
      return _this.piserver.webid = result.WebId;
    }), _this.getAssetServer(_this.afserver.name).then(function (result) {
      return _this.afserver.webid = result.WebId;
    }), _this.getDatabase(_this.afserver.name && _this.afdatabase.name ? _this.afserver.name + '\\' + _this.afdatabase.name : undefined).then(function (result) {
      return _this.afdatabase.webid = result.WebId;
    })]);
    return _this;
  }

  /**
   * This method overrides the applyTemplateVariables() method from the DataSourceWithBackend class.
   * It is responsible for replacing the template variables in the query configuration prior 
   * to sending the query to the backend. Templated variables are not able to be used for alerts
   * or public facing dashboards.
   * 
   * @param {PIWebAPIQuery} query - The raw query configuration from the frontend as defined in the query editor.
   * @param {ScopedVars} scopedVars - The template variables that are defined in the query editor and dashboard.
   * @returns - PIWebAPIQuery.
   *
   * @memberOf PiWebApiDatasource
   */
  _createClass(PiWebAPIDatasource, [{
    key: "applyTemplateVariables",
    value: function applyTemplateVariables(query, scopedVars) {
      return _extends({}, query, {
        target: query.target ? this.templateSrv.replace(query.target, scopedVars) : ''
      });
    }

    /**
     * This method does the discovery of the AF Hierarchy and populates the query user interface segments.
     *
     * @param {any} query - Parses the query configuration and builds a PI Web API query.
     * @returns - Segment information.
     *
     * @memberOf PiWebApiDatasource
     */
  }, {
    key: "metricFindQuery",
    value: function metricFindQuery(query, queryOptions) {
      var _query$filter;
      var ds = this;
      var querydepth = ['servers', 'databases', 'databaseElements', 'elements'];
      if (typeof query === 'string') {
        query = JSON.parse(query);
      }
      if (queryOptions.isPiPoint) {
        query.path = this.templateSrv.replace(query.path, queryOptions);
      } else {
        if (query.path === '') {
          query.type = querydepth[0];
        } else {
          query.path = this.templateSrv.replace(query.path, queryOptions); // replace variables in the path
          query.path = query.path.split(';')[0]; // if the attribute is in the path, let's remote it
          if (query.type !== 'attributes') {
            query.type = querydepth[Math.max(0, Math.min(query.path.split('\\').length, querydepth.length - 1))];
          }
        }
        query.path = query.path.replace(/\{([^\\])*\}/gi, function (r) {
          return r.substring(1, r.length - 2).split(',')[0];
        });
      }
      query.filter = (_query$filter = query.filter) !== null && _query$filter !== void 0 ? _query$filter : '*';
      if (query.type === 'servers') {
        var _ds$afserver;
        return (_ds$afserver = ds.afserver) !== null && _ds$afserver !== void 0 && _ds$afserver.name ? ds.getAssetServer(ds.afserver.name).then(function (result) {
          return [result];
        }).then(helper__WEBPACK_IMPORTED_MODULE_3__.metricQueryTransform) : ds.getAssetServers().then(helper__WEBPACK_IMPORTED_MODULE_3__.metricQueryTransform);
      } else if (query.type === 'databases' && !!query.afServerWebId) {
        return ds.getDatabases(query.afServerWebId, {}).then(helper__WEBPACK_IMPORTED_MODULE_3__.metricQueryTransform);
      } else if (query.type === 'databases') {
        return ds.getAssetServer(query.path).then(function (server) {
          var _server$WebId;
          return ds.getDatabases((_server$WebId = server.WebId) !== null && _server$WebId !== void 0 ? _server$WebId : '', {});
        }).then(helper__WEBPACK_IMPORTED_MODULE_3__.metricQueryTransform);
      } else if (query.type === 'databaseElements') {
        return ds.getDatabase(query.path).then(function (db) {
          var _db$WebId;
          return ds.getDatabaseElements((_db$WebId = db.WebId) !== null && _db$WebId !== void 0 ? _db$WebId : '', {
            selectedFields: 'Items.WebId%3BItems.Name%3BItems.Items%3BItems.Path%3BItems.HasChildren'
          });
        }).then(helper__WEBPACK_IMPORTED_MODULE_3__.metricQueryTransform);
      } else if (query.type === 'elements') {
        return ds.getElement(query.path).then(function (element) {
          var _element$WebId;
          return ds.getElements((_element$WebId = element.WebId) !== null && _element$WebId !== void 0 ? _element$WebId : '', {
            selectedFields: 'Items.Description%3BItems.WebId%3BItems.Name%3BItems.Items%3BItems.Path%3BItems.HasChildren',
            nameFilter: query.filter
          });
        }).then(helper__WEBPACK_IMPORTED_MODULE_3__.metricQueryTransform);
      } else if (query.type === 'attributes') {
        return ds.getElement(query.path).then(function (element) {
          var _element$WebId2;
          return ds.getAttributes((_element$WebId2 = element.WebId) !== null && _element$WebId2 !== void 0 ? _element$WebId2 : '', {
            searchFullHierarchy: 'true',
            selectedFields: 'Items.Type%3BItems.DefaultUnitsName%3BItems.Description%3BItems.WebId%3BItems.Name%3BItems.Path',
            nameFilter: query.filter
          });
        }).then(helper__WEBPACK_IMPORTED_MODULE_3__.metricQueryTransform);
      } else if (query.type === 'dataserver') {
        return ds.getDataServers().then(helper__WEBPACK_IMPORTED_MODULE_3__.metricQueryTransform);
      } else if (query.type === 'pipoint') {
        return ds.piPointSearch(query.webId, query.pointName).then(helper__WEBPACK_IMPORTED_MODULE_3__.metricQueryTransform);
      }
      return Promise.reject('Bad type');
    }

    /**
     * Gets the url of summary data from the query configuration.
     *
     * @param {any} summary - Query summary configuration.
     * @returns - URL append string.
     *
     * @memberOf PiWebApiDatasource
     */
  }, {
    key: "getSummaryUrl",
    value: function getSummaryUrl(summary) {
      if (summary.interval.trim() === '') {
        return '&summaryType=' + summary.types.map(function (s) {
          var _s$value;
          return (_s$value = s.value) === null || _s$value === void 0 ? void 0 : _s$value.value;
        }).join('&summaryType=') + '&calculationBasis=' + summary.basis;
      }
      return '&summaryType=' + summary.types.map(function (s) {
        var _s$value2;
        return (_s$value2 = s.value) === null || _s$value2 === void 0 ? void 0 : _s$value2.value;
      }).join('&summaryType=') + '&calculationBasis=' + summary.basis + '&summaryDuration=' + summary.interval.trim();
    }

    /** PRIVATE SECTION */

    /**
     * Localize the eventFrame dataFrame records to Grafana Annotations.
     * @param {any} annon - The annotation object.
     * @param {any} data - The dataframe recrords.
     * @returns - Grafana Annotation
     *
     * @memberOf PiWebApiDatasource
     */
  }, {
    key: "eventFrameToAnnotation",
    value: function eventFrameToAnnotation(annon, data) {
      var _this2 = this;
      var annotationOptions = annon.target;
      var events = [];
      var currentLocale = Intl.DateTimeFormat().resolvedOptions().locale;
      data.forEach(function (d) {
        var values = _this2.transformDataFrameToMap(d);
        for (var i = 0; i < values['time'].length; i++) {
          // replace Dataframe name using Regex
          var title = values['title'][i];
          if (annotationOptions.regex && annotationOptions.regex.enable) {
            title = title.replace(new RegExp(annotationOptions.regex.search), annotationOptions.regex.replace);
          }

          // test if timeEnd is negative and if so, set it to null
          if (values['timeEnd'][i] < 0) {
            values['timeEnd'][i] = null;
          }

          // format the text and localize the dates to browser locale
          var text = "Tag: " + title;
          if (annotationOptions.attribute && annotationOptions.attribute.enable) {
            text += values['attributeText'][i];
          }
          text += '<br />Start: ' + new Date(values['time'][i]).toLocaleString(currentLocale) + '<br />End: ';
          if (values['timeEnd'][i]) {
            text += new Date(values['timeEnd'][i]).toLocaleString(currentLocale);
          } else {
            text += 'Eventframe is open';
          }
          var event = {
            time: values['time'][i],
            timeEnd: !!annotationOptions.showEndTime ? values['timeEnd'][i] : undefined,
            title: title,
            id: values['id'][i],
            text: text,
            tags: ['OSISoft PI']
          };
          events.push(event);
        }
      });
      return events;
    }

    /**
     * 
     */
  }, {
    key: "transformDataFrameToMap",
    value: function transformDataFrameToMap(dataFrame) {
      var map = {};
      dataFrame.fields.forEach(function (field) {
        map[field.name] = field.values.toArray();
      });
      return map;
    }

    /**
     * Abstraction for calling the PI Web API REST endpoint
     *
     * @param {any} path - the path to append to the base server URL.
     * @returns - The full URL.
     *
     * @memberOf PiWebApiDatasource
     */
  }, {
    key: "restGet",
    value: function restGet(path) {
      return this.backendSrv.datasourceRequest({
        url: this.url + path,
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      }).then(function (response) {
        return response;
      });
    }

    // Get a list of all data (PI) servers
  }, {
    key: "getDataServers",
    value: function getDataServers() {
      return this.restGet('/dataservers').then(function (response) {
        var _response$data$Items;
        return (_response$data$Items = response.data.Items) !== null && _response$data$Items !== void 0 ? _response$data$Items : [];
      });
    }
  }, {
    key: "getDataServer",
    value: function getDataServer(name) {
      if (!name) {
        return Promise.resolve({});
      }
      return this.restGet('/dataservers?name=' + name).then(function (response) {
        return response.data;
      });
    }
    // Get a list of all asset (AF) servers
  }, {
    key: "getAssetServers",
    value: function getAssetServers() {
      return this.restGet('/assetservers').then(function (response) {
        var _response$data$Items2;
        return (_response$data$Items2 = response.data.Items) !== null && _response$data$Items2 !== void 0 ? _response$data$Items2 : [];
      });
    }
  }, {
    key: "getAssetServer",
    value: function getAssetServer(name) {
      if (!name) {
        return Promise.resolve({});
      }
      return this.restGet('/assetservers?path=\\\\' + name).then(function (response) {
        return response.data;
      });
    }
  }, {
    key: "getDatabase",
    value: function getDatabase(path) {
      if (!path) {
        return Promise.resolve({});
      }
      return this.restGet('/assetdatabases?path=\\\\' + path).then(function (response) {
        return response.data;
      });
    }
  }, {
    key: "getDatabases",
    value: function getDatabases(serverId, options) {
      if (!serverId) {
        return Promise.resolve([]);
      }
      return this.restGet('/assetservers/' + serverId + '/assetdatabases').then(function (response) {
        var _response$data$Items3;
        return (_response$data$Items3 = response.data.Items) !== null && _response$data$Items3 !== void 0 ? _response$data$Items3 : [];
      });
    }
  }, {
    key: "getElement",
    value: function getElement(path) {
      if (!path) {
        return Promise.resolve({});
      }
      return this.restGet('/elements?path=\\\\' + path).then(function (response) {
        return response.data;
      });
    }
  }, {
    key: "getEventFrameTemplates",
    value: function getEventFrameTemplates(databaseId) {
      if (!databaseId) {
        return Promise.resolve([]);
      }
      return this.restGet('/assetdatabases/' + databaseId + '/elementtemplates?selectedFields=Items.InstanceType%3BItems.Name%3BItems.WebId').then(function (response) {
        var _response$data$Items4;
        return (0,lodash__WEBPACK_IMPORTED_MODULE_0__.filter)((_response$data$Items4 = response.data.Items) !== null && _response$data$Items4 !== void 0 ? _response$data$Items4 : [], function (item) {
          return item.InstanceType === 'EventFrame';
        });
      });
    }
  }, {
    key: "getElementTemplates",
    value: function getElementTemplates(databaseId) {
      if (!databaseId) {
        return Promise.resolve([]);
      }
      return this.restGet('/assetdatabases/' + databaseId + '/elementtemplates?selectedFields=Items.InstanceType%3BItems.Name%3BItems.WebId').then(function (response) {
        var _response$data$Items5;
        return (0,lodash__WEBPACK_IMPORTED_MODULE_0__.filter)((_response$data$Items5 = response.data.Items) !== null && _response$data$Items5 !== void 0 ? _response$data$Items5 : [], function (item) {
          return item.InstanceType === 'Element';
        });
      });
    }

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
  }, {
    key: "getAttributes",
    value: function getAttributes(elementId, options) {
      var querystring = '?' + (0,lodash__WEBPACK_IMPORTED_MODULE_0__.map)(options, function (value, key) {
        return key + '=' + value;
      }).join('&');
      if (querystring === '?') {
        querystring = '';
      }
      return this.restGet('/elements/' + elementId + '/attributes' + querystring).then(function (response) {
        var _response$data$Items6;
        return (_response$data$Items6 = response.data.Items) !== null && _response$data$Items6 !== void 0 ? _response$data$Items6 : [];
      });
    }

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
  }, {
    key: "getDatabaseElements",
    value: function getDatabaseElements(databaseId, options) {
      var querystring = '?' + (0,lodash__WEBPACK_IMPORTED_MODULE_0__.map)(options, function (value, key) {
        return key + '=' + value;
      }).join('&');
      if (querystring === '?') {
        querystring = '';
      }
      return this.restGet('/assetdatabases/' + databaseId + '/elements' + querystring).then(function (response) {
        var _response$data$Items7;
        return (_response$data$Items7 = response.data.Items) !== null && _response$data$Items7 !== void 0 ? _response$data$Items7 : [];
      });
    }

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
  }, {
    key: "getElements",
    value: function getElements(elementId, options) {
      var querystring = '?' + (0,lodash__WEBPACK_IMPORTED_MODULE_0__.map)(options, function (value, key) {
        return key + '=' + value;
      }).join('&');
      if (querystring === '?') {
        querystring = '';
      }
      return this.restGet('/elements/' + elementId + '/elements' + querystring).then(function (response) {
        var _response$data$Items8;
        return (_response$data$Items8 = response.data.Items) !== null && _response$data$Items8 !== void 0 ? _response$data$Items8 : [];
      });
    }

    /**
     * Retrieve a list of points on a specified Data Server.
     *
     * @param {string} serverId - The ID of the server. See WebID for more information.
     * @param {string} nameFilter - A query string for filtering by point name. The default is no filter. *, ?, [ab], [!ab]
     */
  }, {
    key: "piPointSearch",
    value: function piPointSearch(serverId, nameFilter) {
      var filter1 = this.templateSrv.replace(nameFilter);
      var filter2 = "".concat(filter1);
      var doFilter = false;
      if (filter1 !== nameFilter) {
        var regex = /\{(\w|,)+\}/g;
        var m;
        while ((m = regex.exec(filter1)) !== null) {
          // This is necessary to avoid infinite loops with zero-width matches
          if (m.index === regex.lastIndex) {
            regex.lastIndex++;
          }

          // The result can be accessed through the `m`-variable.
          m.forEach(function (match, groupIndex) {
            if (groupIndex === 0) {
              filter1 = filter1.replace(match, match.replace('{', '(').replace('}', ')').replace(',', '|'));
              filter2 = filter2.replace(match, '*');
              doFilter = true;
            }
          });
        }
      }
      return this.restGet('/dataservers/' + serverId + '/points?maxCount=50&nameFilter=' + filter2).then(function (results) {
        var _results$data;
        if (!!results && !!((_results$data = results.data) !== null && _results$data !== void 0 && _results$data.Items)) {
          return doFilter ? results.data.Items.filter(function (item) {
            var _item$Name;
            return (_item$Name = item.Name) === null || _item$Name === void 0 ? void 0 : _item$Name.match(filter1);
          }) : results.data.Items;
        }
        return [];
      });
    }
  }]);
  return PiWebAPIDatasource;
}(_grafana_runtime__WEBPACK_IMPORTED_MODULE_2__.DataSourceWithBackend);

/***/ }),

/***/ "./helper.ts":
/*!*******************!*\
  !*** ./helper.ts ***!
  \*******************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "checkNumber": () => (/* binding */ checkNumber),
/* harmony export */   "convertTimeSeriesToDataFrame": () => (/* binding */ convertTimeSeriesToDataFrame),
/* harmony export */   "convertToTableData": () => (/* binding */ convertToTableData),
/* harmony export */   "getFinalUrl": () => (/* binding */ getFinalUrl),
/* harmony export */   "getLastPath": () => (/* binding */ getLastPath),
/* harmony export */   "getPath": () => (/* binding */ getPath),
/* harmony export */   "isAllSelected": () => (/* binding */ isAllSelected),
/* harmony export */   "lowerCaseFirstLetter": () => (/* binding */ lowerCaseFirstLetter),
/* harmony export */   "metricQueryTransform": () => (/* binding */ metricQueryTransform),
/* harmony export */   "noDataReplace": () => (/* binding */ noDataReplace),
/* harmony export */   "parseRawQuery": () => (/* binding */ parseRawQuery),
/* harmony export */   "processAnnotationQuery": () => (/* binding */ processAnnotationQuery)
/* harmony export */ });
/* harmony import */ var lodash__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! lodash */ "lodash");
/* harmony import */ var lodash__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(lodash__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _grafana_data__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @grafana/data */ "@grafana/data");
/* harmony import */ var _grafana_data__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_grafana_data__WEBPACK_IMPORTED_MODULE_1__);
function _createForOfIteratorHelper(o, allowArrayLike) { var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"]; if (!it) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e) { throw _e; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = it.call(o); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e2) { didErr = true; err = _e2; }, f: function f() { try { if (!normalCompletion && it["return"] != null) it["return"](); } finally { if (didErr) throw err; } } }; }
function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }
function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }


function parseRawQuery(tr) {
  var splitAttributes = tr.split(';');
  var splitElements = splitAttributes[0].split('\\');

  // remove element hierarchy from attribute collection
  splitAttributes.splice(0, 1);
  var attributes = [];
  if (splitElements.length > 1 || splitElements.length === 1 && splitElements[0] !== '') {
    var elementPath = splitElements.join('\\');
    (0,lodash__WEBPACK_IMPORTED_MODULE_0__.each)(splitAttributes, function (item, index) {
      if (item !== '') {
        attributes.push({
          label: item,
          value: {
            value: item,
            expandable: false
          }
        });
      }
    });
    return {
      attributes: attributes,
      elementPath: elementPath
    };
  }
  return {
    attributes: attributes,
    elementPath: null
  };
}
function lowerCaseFirstLetter(string) {
  return string.charAt(0).toLocaleLowerCase() + string.slice(1);
}
function convertTimeSeriesToDataFrame(timeSeries) {
  var _timeSeries$target;
  var times = [];
  var values = [];

  // Sometimes the points are sent as datapoints
  var points = timeSeries.datapoints;
  var _iterator = _createForOfIteratorHelper(points),
    _step;
  try {
    for (_iterator.s(); !(_step = _iterator.n()).done;) {
      var point = _step.value;
      values.push(point[0]);
      times.push(point[1]);
    }
  } catch (err) {
    _iterator.e(err);
  } finally {
    _iterator.f();
  }
  var fields = [{
    name: _grafana_data__WEBPACK_IMPORTED_MODULE_1__.TIME_SERIES_TIME_FIELD_NAME,
    type: _grafana_data__WEBPACK_IMPORTED_MODULE_1__.FieldType.time,
    config: {},
    values: new _grafana_data__WEBPACK_IMPORTED_MODULE_1__.ArrayVector(times)
  }, {
    name: (_timeSeries$target = timeSeries.target) !== null && _timeSeries$target !== void 0 ? _timeSeries$target : _grafana_data__WEBPACK_IMPORTED_MODULE_1__.TIME_SERIES_VALUE_FIELD_NAME,
    type: _grafana_data__WEBPACK_IMPORTED_MODULE_1__.FieldType.number,
    config: {
      unit: timeSeries.unit
    },
    values: new _grafana_data__WEBPACK_IMPORTED_MODULE_1__.ArrayVector(values),
    labels: timeSeries.tags
  }];
  if (timeSeries.title) {
    fields[1].config.displayNameFromDS = timeSeries.title;
  }
  return {
    name: '',
    refId: timeSeries.refId,
    meta: timeSeries.meta,
    fields: fields,
    length: values.length
  };
}

/**
 * Builds the Grafana metric segment for use on the query user interface.
 *
 * @param {any} response - response from PI Web API.
 * @returns - Grafana metric segment.
 *
 * @memberOf PiWebApiDatasource
 */
function metricQueryTransform(response) {
  return (0,lodash__WEBPACK_IMPORTED_MODULE_0__.map)(response, function (item) {
    var _item$Path, _item$Items;
    return {
      text: item.Name,
      expandable: item.HasChildren === undefined || item.HasChildren === true || ((_item$Path = item.Path) !== null && _item$Path !== void 0 ? _item$Path : '').split('\\').length <= 3,
      HasChildren: item.HasChildren,
      Items: (_item$Items = item.Items) !== null && _item$Items !== void 0 ? _item$Items : [],
      Path: item.Path,
      WebId: item.WebId
    };
  });
}

/**
 * Check if all items are selected.
 *
 * @param {any} current the current variable selection
 * @return {boolean} true if all value is selected, false otherwise
 */
function isAllSelected(current) {
  if (!current) {
    return false;
  }
  if (Array.isArray(current.text)) {
    return current.text.indexOf('All') >= 0;
  }
  return current.text === 'All';
}
function processAnnotationQuery(annon, data) {
  var processedFrames = [];
  data.forEach(function (d) {
    d.fields.forEach(function (f) {
      // check if the label has been set, if it hasn't been set then the eventframe annotation is not valid. 
      if (!f.labels) {
        return;
      }
      if (!('eventframe' in f.labels)) {
        return;
      }
      var attribute = ('attribute' in f.labels);

      // Check whether f.values is an array or not to allow for each.
      // Check whether f.values is an array or not to allow for each.
      if (Array.isArray(f.values)) {
        console.log(f.values);
        f.values.forEach(function (value) {
          if (attribute) {
            var annotation = value['1'].Content;
            var valueData = [];
            for (var i = 2; (i in value); i++) {
              valueData.push(value[i].Content.Items);
            }
            var processedFrame = convertToTableData(annotation.Items, valueData).map(function (r) {
              return (0,_grafana_data__WEBPACK_IMPORTED_MODULE_1__.toDataFrame)(r);
            });
            processedFrames = processedFrames.concat(processedFrame);
          } else {
            var _annotation = value['1'].Content;
            var _processedFrame = convertToTableData(_annotation.Items).map(function (r) {
              return (0,_grafana_data__WEBPACK_IMPORTED_MODULE_1__.toDataFrame)(r);
            });
            processedFrames = processedFrames.concat(_processedFrame);
          }
        });
      }
    });
  });
  return processedFrames;
}
function convertToTableData(items, valueData) {
  console.log("items", items);
  var response = items.map(function (item, index) {
    console.log("item", item);
    var columns = [{
      text: 'StartTime'
    }, {
      text: 'EndTime'
    }];
    var rows = [item.StartTime, item.EndTime];
    if (valueData) {
      for (var attributeIndex = 0; attributeIndex < valueData.length; attributeIndex++) {
        var attributeData = valueData[attributeIndex];
        var eventframeAributeData = attributeData[index].Content.Items;
        eventframeAributeData.forEach(function (attribute) {
          columns.push({
            text: attribute.Name
          });
          rows.push(String(attribute.Value.Value ? attribute.Value.Value.Name || attribute.Value.Value.Value || attribute.Value.Value : ''));
        });
      }
    }
    return {
      name: item.Name,
      columns: columns,
      rows: [rows]
    };
  });
  console.log("response", response);
  return response;
}

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
function noDataReplace(item, noDataReplacementMode, grafanaDataPoint) {
  var _item$Value, _item$Value2;
  var previousValue = null;
  var drop = false;
  if (!item.Good || item.Value === 'No Data' || (_item$Value = item.Value) !== null && _item$Value !== void 0 && _item$Value.Name && ((_item$Value2 = item.Value) === null || _item$Value2 === void 0 ? void 0 : _item$Value2.Name) === 'No Data') {
    if (noDataReplacementMode === 'Drop') {
      drop = true;
    } else if (noDataReplacementMode === '0') {
      grafanaDataPoint[0] = 0;
    } else if (noDataReplacementMode === 'Keep') {
      // Do nothing keep
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
}

/**
 * Check if the value is a number.
 *
 * @param {any} number the value to check
 * @returns {boolean} true if the value is a number, false otherwise
 */
function checkNumber(number) {
  return typeof number === 'number' && !Number.isNaN(number) && Number.isFinite(number);
}

/**
 * Returns the last item of the element path.
 *
 * @param {string} path element path
 * @returns {string} last item of the element path
 */
function getLastPath(path) {
  var _splitPath$pop;
  var splitPath = path.split('|');
  if (splitPath.length === 0) {
    return '';
  }
  splitPath = splitPath[0].split('\\');
  return splitPath.length === 0 ? '' : (_splitPath$pop = splitPath.pop()) !== null && _splitPath$pop !== void 0 ? _splitPath$pop : '';
}

/**
 * Returns the last item of the element path plus variable.
 *
 * @param {PiwebapiElementPath[]} elementPathArray array of element paths
 * @param {string} path element path
 * @returns {string} last item of the element path
 */
function getPath(elementPathArray, path) {
  var _elementPathArray$fin;
  if (!path || elementPathArray.length === 0) {
    return '';
  }
  var splitStr = getLastPath(path);
  var foundElement = (_elementPathArray$fin = elementPathArray.find(function (e) {
    return path.indexOf(e.path) >= 0;
  })) === null || _elementPathArray$fin === void 0 ? void 0 : _elementPathArray$fin.variable;
  return foundElement ? foundElement + '|' + splitStr : splitStr;
}

/**
 * Replace calculation dot in expression with PI point name.
 *
 * @param {boolean} replace - is pi point and calculation.
 * @param {PiwebapiRsp} webid - Pi web api response object.
 * @param {string} url - original url.
 * @returns Modified url
 */
function getFinalUrl(replace, webid, url) {
  var newUrl = replace ? url.replace(/'\.'/g, "'".concat(webid.Name, "'")) : url;
  return newUrl;
}

/***/ }),

/***/ "./query/AnnotationsQueryEditor.tsx":
/*!******************************************!*\
  !*** ./query/AnnotationsQueryEditor.tsx ***!
  \******************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "PiWebAPIAnnotationsQueryEditor": () => (/* binding */ PiWebAPIAnnotationsQueryEditor)
/* harmony export */ });
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react */ "react");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _grafana_ui__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @grafana/ui */ "@grafana/ui");
/* harmony import */ var _grafana_ui__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_grafana_ui__WEBPACK_IMPORTED_MODULE_1__);
function _extends() { _extends = Object.assign ? Object.assign.bind() : function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; }; return _extends.apply(this, arguments); }
function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _unsupportedIterableToArray(arr, i) || _nonIterableRest(); }
function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }
function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }
function _iterableToArrayLimit(arr, i) { var _i = arr == null ? null : typeof Symbol !== "undefined" && arr[Symbol.iterator] || arr["@@iterator"]; if (_i == null) return; var _arr = []; var _n = true; var _d = false; var _s, _e; try { for (_i = _i.call(arr); !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }
function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }


var SMALL_LABEL_WIDTH = 20;
var LABEL_WIDTH = 30;
var MIN_INPUT_WIDTH = 50;
var PiWebAPIAnnotationsQueryEditor = /*#__PURE__*/(0,react__WEBPACK_IMPORTED_MODULE_0__.memo)(function PiWebAPIAnnotationQueryEditor(props) {
  var _annotation$target$da, _annotation$target, _database$WebId, _query$regex, _query$regex2, _query$regex3, _query$attribute, _query$attribute2;
  var query = props.query,
    datasource = props.datasource,
    annotation = props.annotation,
    _onChange = props.onChange,
    onRunQuery = props.onRunQuery;
  var _useState = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)(''),
    _useState2 = _slicedToArray(_useState, 2),
    afWebId = _useState2[0],
    setAfWebId = _useState2[1];
  var _useState3 = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)((_annotation$target$da = annotation === null || annotation === void 0 ? void 0 : (_annotation$target = annotation.target) === null || _annotation$target === void 0 ? void 0 : _annotation$target.database) !== null && _annotation$target$da !== void 0 ? _annotation$target$da : {}),
    _useState4 = _slicedToArray(_useState3, 2),
    database = _useState4[0],
    setDatabase = _useState4[1];

  // this should never happen, but we want to keep typescript happy
  if (annotation === undefined) {
    return null;
  }
  var getEventFrames = function getEventFrames() {
    return datasource.getEventFrameTemplates(database === null || database === void 0 ? void 0 : database.WebId).then(function (templ) {
      return templ.map(function (d) {
        return {
          label: d.Name,
          value: d
        };
      });
    });
  };
  var getDatabases = function getDatabases() {
    return datasource.getDatabases(afWebId).then(function (dbs) {
      return dbs.map(function (d) {
        return {
          label: d.Name,
          value: d
        };
      });
    });
  };
  var getValue = function getValue(key) {
    var query = annotation.target;
    if (!query || !query[key]) {
      return;
    }
    return {
      label: query[key].Name,
      value: query[key]
    };
  };
  datasource.getAssetServer(datasource.afserver.name).then(function (result) {
    setAfWebId(result.WebId);
  });
  return /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement((react__WEBPACK_IMPORTED_MODULE_0___default().Fragment), null, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", {
    className: "gf-form-group"
  }, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(_grafana_ui__WEBPACK_IMPORTED_MODULE_1__.InlineFieldRow, null, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(_grafana_ui__WEBPACK_IMPORTED_MODULE_1__.InlineField, {
    label: "Database",
    labelWidth: LABEL_WIDTH,
    grow: true
  }, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(_grafana_ui__WEBPACK_IMPORTED_MODULE_1__.AsyncSelect, {
    key: afWebId !== null && afWebId !== void 0 ? afWebId : 'database-key',
    loadOptions: getDatabases,
    loadingMessage: 'Loading',
    value: getValue('database'),
    onChange: function onChange(e) {
      setDatabase(e.value);
      _onChange(_extends({}, query, {
        database: e.value,
        template: undefined
      }));
    },
    defaultOptions: true
  })), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(_grafana_ui__WEBPACK_IMPORTED_MODULE_1__.InlineField, {
    label: "Event Frames",
    labelWidth: LABEL_WIDTH,
    grow: true
  }, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(_grafana_ui__WEBPACK_IMPORTED_MODULE_1__.AsyncSelect, {
    key: (_database$WebId = database === null || database === void 0 ? void 0 : database.WebId) !== null && _database$WebId !== void 0 ? _database$WebId : 'default-template-key',
    loadOptions: getEventFrames,
    loadingMessage: 'Loading',
    value: getValue('template'),
    onChange: function onChange(e) {
      return _onChange(_extends({}, query, {
        template: e.value
      }));
    },
    defaultOptions: true
  })), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(_grafana_ui__WEBPACK_IMPORTED_MODULE_1__.InlineField, {
    label: "Show Start and End Time",
    labelWidth: LABEL_WIDTH,
    grow: true
  }, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(_grafana_ui__WEBPACK_IMPORTED_MODULE_1__.InlineSwitch, {
    value: !!query.showEndTime,
    onChange: function onChange(e) {
      return _onChange(_extends({}, query, {
        showEndTime: e.currentTarget.checked
      }));
    }
  }))), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(_grafana_ui__WEBPACK_IMPORTED_MODULE_1__.InlineFieldRow, null, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(_grafana_ui__WEBPACK_IMPORTED_MODULE_1__.InlineField, {
    label: "Category name",
    labelWidth: LABEL_WIDTH,
    grow: true
  }, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(_grafana_ui__WEBPACK_IMPORTED_MODULE_1__.Input, {
    type: "text",
    value: query.categoryName,
    onBlur: function onBlur(e) {
      return onRunQuery();
    },
    onChange: function onChange(e) {
      return _onChange(_extends({}, query, {
        categoryName: e.currentTarget.value
      }));
    },
    placeholder: "Enter category name"
  })), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(_grafana_ui__WEBPACK_IMPORTED_MODULE_1__.InlineField, {
    label: "Name Filter",
    labelWidth: LABEL_WIDTH,
    grow: true
  }, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(_grafana_ui__WEBPACK_IMPORTED_MODULE_1__.Input, {
    type: "text",
    value: query.nameFilter,
    onBlur: function onBlur(e) {
      return onRunQuery();
    },
    onChange: function onChange(e) {
      return _onChange(_extends({}, query, {
        nameFilter: e.currentTarget.value
      }));
    },
    placeholder: "Enter name filter"
  }))), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(_grafana_ui__WEBPACK_IMPORTED_MODULE_1__.InlineFieldRow, null, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(_grafana_ui__WEBPACK_IMPORTED_MODULE_1__.InlineField, {
    label: "Enable Name Regex Replacement",
    labelWidth: LABEL_WIDTH,
    grow: false
  }, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(_grafana_ui__WEBPACK_IMPORTED_MODULE_1__.InlineSwitch, {
    value: (_query$regex = query.regex) === null || _query$regex === void 0 ? void 0 : _query$regex.enable,
    onChange: function onChange(e) {
      return _onChange(_extends({}, query, {
        regex: _extends({}, query.regex, {
          enable: e.currentTarget.checked
        })
      }));
    }
  })), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(_grafana_ui__WEBPACK_IMPORTED_MODULE_1__.InlineField, {
    label: "Name Filter",
    labelWidth: SMALL_LABEL_WIDTH,
    grow: false
  }, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(_grafana_ui__WEBPACK_IMPORTED_MODULE_1__.Input, {
    type: "text",
    value: (_query$regex2 = query.regex) === null || _query$regex2 === void 0 ? void 0 : _query$regex2.search,
    onBlur: function onBlur(e) {
      return onRunQuery();
    },
    onChange: function onChange(e) {
      return _onChange(_extends({}, query, {
        regex: _extends({}, query.regex, {
          search: e.currentTarget.value
        })
      }));
    },
    placeholder: "(.*)",
    width: MIN_INPUT_WIDTH
  })), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(_grafana_ui__WEBPACK_IMPORTED_MODULE_1__.InlineField, {
    label: "Replace",
    labelWidth: SMALL_LABEL_WIDTH,
    grow: true
  }, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(_grafana_ui__WEBPACK_IMPORTED_MODULE_1__.Input, {
    type: "text",
    value: query === null || query === void 0 ? void 0 : (_query$regex3 = query.regex) === null || _query$regex3 === void 0 ? void 0 : _query$regex3.replace,
    onBlur: function onBlur(e) {
      return onRunQuery();
    },
    onChange: function onChange(e) {
      return _onChange(_extends({}, query, {
        regex: _extends({}, query.regex, {
          replace: e.currentTarget.value
        })
      }));
    },
    placeholder: "$1"
  }))), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(_grafana_ui__WEBPACK_IMPORTED_MODULE_1__.InlineFieldRow, null, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(_grafana_ui__WEBPACK_IMPORTED_MODULE_1__.InlineField, {
    label: "Enable Attribute Usage",
    labelWidth: LABEL_WIDTH,
    grow: false
  }, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(_grafana_ui__WEBPACK_IMPORTED_MODULE_1__.InlineSwitch, {
    value: (_query$attribute = query.attribute) === null || _query$attribute === void 0 ? void 0 : _query$attribute.enable,
    onChange: function onChange(e) {
      return _onChange(_extends({}, query, {
        attribute: _extends({}, query.attribute, {
          enable: e.currentTarget.checked
        })
      }));
    }
  })), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(_grafana_ui__WEBPACK_IMPORTED_MODULE_1__.InlineField, {
    label: "Attribute Name",
    labelWidth: LABEL_WIDTH,
    grow: true
  }, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(_grafana_ui__WEBPACK_IMPORTED_MODULE_1__.Input, {
    type: "text",
    value: (_query$attribute2 = query.attribute) === null || _query$attribute2 === void 0 ? void 0 : _query$attribute2.name,
    onBlur: function onBlur(e) {
      return onRunQuery();
    },
    onChange: function onChange(e) {
      return _onChange(_extends({}, query, {
        attribute: _extends({}, query.attribute, {
          name: e.currentTarget.value
        })
      }));
    },
    placeholder: "Enter name"
  })))));
});

/***/ }),

/***/ "./query/QueryEditor.tsx":
/*!*******************************!*\
  !*** ./query/QueryEditor.tsx ***!
  \*******************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "PIWebAPIQueryEditor": () => (/* binding */ PIWebAPIQueryEditor)
/* harmony export */ });
/* harmony import */ var lodash__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! lodash */ "lodash");
/* harmony import */ var lodash__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(lodash__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! react */ "react");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _grafana_ui__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @grafana/ui */ "@grafana/ui");
/* harmony import */ var _grafana_ui__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(_grafana_ui__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var _components_Forms__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../components/Forms */ "./components/Forms.tsx");
/* harmony import */ var _types__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../types */ "./types.ts");
/* harmony import */ var components_QueryEditorModeSwitcher__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! components/QueryEditorModeSwitcher */ "./components/QueryEditorModeSwitcher.tsx");
function _typeof(obj) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) { return typeof obj; } : function (obj) { return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }, _typeof(obj); }
var _a, _QueryRowTerminator;
function _extends() { _extends = Object.assign ? Object.assign.bind() : function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; }; return _extends.apply(this, arguments); }
function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }
function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }
function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); Object.defineProperty(Constructor, "prototype", { writable: false }); return Constructor; }
function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); Object.defineProperty(subClass, "prototype", { writable: false }); if (superClass) _setPrototypeOf(subClass, superClass); }
function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }
function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = _getPrototypeOf(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = _getPrototypeOf(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return _possibleConstructorReturn(this, result); }; }
function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } else if (call !== void 0) { throw new TypeError("Derived constructors may only return object or undefined"); } return _assertThisInitialized(self); }
function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }
function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); return true; } catch (e) { return false; } }
function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf.bind() : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }
function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }






var LABEL_WIDTH = 24;
var MIN_ELEM_INPUT_WIDTH = 200;
var MIN_ATTR_INPUT_WIDTH = 250;
var REMOVE_LABEL = '-REMOVE-';
var CustomLabelComponent = function CustomLabelComponent(props) {
  if (props.value) {
    var _props$label;
    return /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_1___default().createElement("div", {
      className: "gf-form-label ".concat(props.value.type === 'template' ? 'query-keyword' : '')
    }, (_props$label = props.label) !== null && _props$label !== void 0 ? _props$label : '--no label--');
  }
  return _a || (_a = /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_1___default().createElement("a", {
    className: "gf-form-label query-part"
  }, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_1___default().createElement(_grafana_ui__WEBPACK_IMPORTED_MODULE_2__.Icon, {
    name: "plus"
  })));
};
var PIWebAPIQueryEditor = /*#__PURE__*/function (_PureComponent) {
  _inherits(PIWebAPIQueryEditor, _PureComponent);
  var _super = _createSuper(PIWebAPIQueryEditor);
  function PIWebAPIQueryEditor(props) {
    var _this;
    _classCallCheck(this, PIWebAPIQueryEditor);
    _this = _super.call(this, props);
    _defineProperty(_assertThisInitialized(_this), "error", void 0);
    _defineProperty(_assertThisInitialized(_this), "piServer", []);
    _defineProperty(_assertThisInitialized(_this), "availableAttributes", {});
    _defineProperty(_assertThisInitialized(_this), "summaryTypes", void 0);
    _defineProperty(_assertThisInitialized(_this), "calculationBasis", void 0);
    _defineProperty(_assertThisInitialized(_this), "noDataReplacement", void 0);
    _defineProperty(_assertThisInitialized(_this), "state", {
      isPiPoint: false,
      segments: [],
      attributes: [],
      summaries: [],
      attributeSegment: {},
      summarySegment: {},
      calculationBasisSegment: {},
      noDataReplacementSegment: {}
    });
    _defineProperty(_assertThisInitialized(_this), "segmentChangeValue", function (segments) {
      var query = _this.props.query;
      _this.setState({
        segments: segments
      }, function () {
        return _this.onChange(_extends({}, query, {
          segments: segments
        }));
      });
    });
    _defineProperty(_assertThisInitialized(_this), "attributeChangeValue", function (attributes) {
      var query = _this.props.query;
      _this.setState({
        attributes: attributes
      }, function () {
        return _this.onChange(_extends({}, query, {
          attributes: attributes
        }));
      });
    });
    _defineProperty(_assertThisInitialized(_this), "onPiPointChange", function (item, index) {
      var attributes = _this.state.attributes.slice(0);
      if (item.label === REMOVE_LABEL) {
        (0,lodash__WEBPACK_IMPORTED_MODULE_0__.remove)(attributes, function (value, n) {
          return n === index;
        });
      } else {
        // set current value
        attributes[index] = item;
      }
      _this.checkPiPointSegments(item, attributes);
    });
    _defineProperty(_assertThisInitialized(_this), "onAttributeChange", function (item, index) {
      var _item$value;
      var attributes = _this.state.attributes.slice(0);

      // ignore if no change
      if (attributes[index].label === ((_item$value = item.value) === null || _item$value === void 0 ? void 0 : _item$value.value)) {
        return;
      }

      // set current value
      attributes[index] = item;
      _this.checkAttributeSegments(attributes, _this.state.segments);
    });
    _defineProperty(_assertThisInitialized(_this), "onSegmentChange", function (item, index) {
      var _item$value2;
      var query = _this.props.query;
      var segments = _this.state.segments.slice(0);

      // ignore if no change
      if (segments[index].label === ((_item$value2 = item.value) === null || _item$value2 === void 0 ? void 0 : _item$value2.value)) {
        return;
      }

      // reset attributes list
      _this.setState({
        attributes: []
      }, function () {
        if (item.label === REMOVE_LABEL) {
          segments = (0,lodash__WEBPACK_IMPORTED_MODULE_0__.slice)(segments, 0, index);
          _this.checkAttributeSegments([], segments).then(function () {
            var _segments$value;
            if (segments.length === 0) {
              segments.push({
                label: ''
              });
            } else if (!!((_segments$value = segments[segments.length - 1].value) !== null && _segments$value !== void 0 && _segments$value.expandable)) {
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
          });
          return;
        }

        // set current value
        segments[index] = item;

        // Accept only one PI server
        if (query.isPiPoint) {
          _this.piServer.push(item);
          _this.segmentChangeValue(segments);
          return;
        }

        // changed internal selection
        if (index < segments.length - 1) {
          segments = (0,lodash__WEBPACK_IMPORTED_MODULE_0__.slice)(segments, 0, index + 1);
        }
        _this.checkAttributeSegments([], segments).then(function () {
          var _item$value3;
          // add new options
          if (!!((_item$value3 = item.value) !== null && _item$value3 !== void 0 && _item$value3.expandable)) {
            segments.push({
              label: 'Select Element',
              value: {
                value: '-Select Element-'
              }
            });
          }
          _this.segmentChangeValue(segments);
        });
      });
    });
    _defineProperty(_assertThisInitialized(_this), "getElementSegments", function (index, currentSegment) {
      var _data$request$scopedV, _data$request;
      var _this$props = _this.props,
        datasource = _this$props.datasource,
        query = _this$props.query,
        data = _this$props.data;
      var ctrl = _assertThisInitialized(_this);
      var findQuery = query.isPiPoint ? {
        type: 'dataserver'
      } : {
        path: _this.getSegmentPathUpTo(currentSegment !== null && currentSegment !== void 0 ? currentSegment : _this.state.segments.slice(0), index),
        afServerWebId: _this.state.segments.length > 0 && _this.state.segments[0].value ? _this.state.segments[0].value.webId : undefined
      };
      if (!query.isPiPoint) {
        var _datasource$afserver, _datasource$afserver2, _datasource$afdatabas;
        if ((_datasource$afserver = datasource.afserver) !== null && _datasource$afserver !== void 0 && _datasource$afserver.name && index === 0) {
          return Promise.resolve([{
            label: datasource.afserver.name,
            value: {
              value: datasource.afserver.name,
              expandable: true
            }
          }]);
        }
        if ((_datasource$afserver2 = datasource.afserver) !== null && _datasource$afserver2 !== void 0 && _datasource$afserver2.name && (_datasource$afdatabas = datasource.afdatabase) !== null && _datasource$afdatabas !== void 0 && _datasource$afdatabas.name && index === 1) {
          return Promise.resolve([{
            label: datasource.afdatabase.name,
            value: {
              value: datasource.afdatabase.name,
              expandable: true
            }
          }]);
        }
      }
      return datasource.metricFindQuery(findQuery, Object.assign((_data$request$scopedV = data === null || data === void 0 ? void 0 : (_data$request = data.request) === null || _data$request === void 0 ? void 0 : _data$request.scopedVars) !== null && _data$request$scopedV !== void 0 ? _data$request$scopedV : {}, {
        isPiPoint: query.isPiPoint
      })).then(function (items) {
        var altSegments = (0,lodash__WEBPACK_IMPORTED_MODULE_0__.map)(items, function (item) {
          var selectableValue = {
            label: item.text,
            value: {
              webId: item.WebId,
              value: item.text,
              expandable: !query.isPiPoint && item.expandable
            }
          };
          return selectableValue;
        });
        if (altSegments.length === 0) {
          return altSegments;
        }

        // add template variables
        var variables = datasource.templateSrv.getVariables();
        (0,lodash__WEBPACK_IMPORTED_MODULE_0__.each)(variables, function (variable) {
          var selectableValue = {
            label: '${' + variable.name + '}',
            value: {
              type: 'template',
              value: '${' + variable.name + '}',
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
    });
    _defineProperty(_assertThisInitialized(_this), "getAttributeSegmentsPI", function (attributeText) {
      var _data$request$scopedV2, _data$request2;
      var _this$props2 = _this.props,
        datasource = _this$props2.datasource,
        query = _this$props2.query,
        data = _this$props2.data;
      var ctrl = _assertThisInitialized(_this);
      var findQuery = {
        path: '',
        webId: _this.getSelectedPIServer(),
        pointName: (attributeText !== null && attributeText !== void 0 ? attributeText : '') + '*',
        type: 'pipoint'
      };
      var segments = [];
      segments.push({
        label: REMOVE_LABEL,
        value: {
          value: REMOVE_LABEL
        }
      });
      return datasource.metricFindQuery(findQuery, Object.assign((_data$request$scopedV2 = data === null || data === void 0 ? void 0 : (_data$request2 = data.request) === null || _data$request2 === void 0 ? void 0 : _data$request2.scopedVars) !== null && _data$request$scopedV2 !== void 0 ? _data$request$scopedV2 : {}, {
        isPiPoint: query.isPiPoint
      })).then(function (items) {
        segments = (0,lodash__WEBPACK_IMPORTED_MODULE_0__.map)(items, function (item) {
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
        if (!!attributeText && attributeText.length > 0) {
          segments.unshift({
            label: attributeText,
            value: {
              value: attributeText,
              expandable: false
            }
          });
        }
        // add template variables
        var variables = datasource.templateSrv.getVariables();
        (0,lodash__WEBPACK_IMPORTED_MODULE_0__.each)(variables, function (variable) {
          var selectableValue = {
            label: '${' + variable.name + '}',
            value: {
              type: 'template',
              value: '${' + variable.name + '}',
              expandable: !query.isPiPoint
            }
          };
          segments.unshift(selectableValue);
        });
        return segments;
      })["catch"](function (err) {
        ctrl.error = err.message || 'Failed to issue metric query';
        return segments;
      });
    });
    _defineProperty(_assertThisInitialized(_this), "getAttributeSegmentsAF", function (attributeText) {
      var ctrl = _assertThisInitialized(_this);
      var segments = [];
      segments.push({
        label: REMOVE_LABEL,
        value: {
          value: REMOVE_LABEL
        }
      });
      (0,lodash__WEBPACK_IMPORTED_MODULE_0__.forOwn)(ctrl.availableAttributes, function (val, key) {
        var selectableValue = {
          label: key,
          value: {
            value: key,
            expandable: true
          }
        };
        segments.push(selectableValue);
      });
      return segments;
    });
    _defineProperty(_assertThisInitialized(_this), "buildFromTarget", function (query, segmentsArray, attributesArray) {
      var splitAttributes = query.target.split(';');
      var splitElements = splitAttributes.length > 0 ? splitAttributes[0].split('\\') : [];
      if (splitElements.length > 1 || splitElements.length === 1 && splitElements[0] !== '') {
        // remove element hierarchy from attribute collection
        splitAttributes.splice(0, 1);
        (0,lodash__WEBPACK_IMPORTED_MODULE_0__.each)(splitElements, function (item, _) {
          segmentsArray.push({
            label: item,
            value: {
              type: item.match(/\${\w+}/gi) ? 'template' : undefined,
              value: item,
              expandable: true
            }
          });
        });
        (0,lodash__WEBPACK_IMPORTED_MODULE_0__.each)(splitAttributes, function (item, _) {
          if (item !== '') {
            // set current value
            attributesArray.push({
              label: item,
              value: {
                value: item,
                expandable: false
              }
            });
          }
        });
        return _this.getElementSegments(splitElements.length + 1, segmentsArray).then(function (elements) {
          if (elements.length > 0) {
            segmentsArray.push({
              label: 'Select Element',
              value: {
                value: '-Select Element-'
              }
            });
          }
          return segmentsArray;
        });
      }
      return Promise.resolve(segmentsArray);
    });
    _defineProperty(_assertThisInitialized(_this), "checkAfServer", function () {
      var _datasource$afserver3;
      var datasource = _this.props.datasource;
      var segmentsArray = [];
      if ((_datasource$afserver3 = datasource.afserver) !== null && _datasource$afserver3 !== void 0 && _datasource$afserver3.name) {
        var _datasource$afdatabas2;
        segmentsArray.push({
          label: datasource.afserver.name,
          value: {
            value: datasource.afserver.name,
            expandable: true
          }
        });
        if ((_datasource$afdatabas2 = datasource.afdatabase) !== null && _datasource$afdatabas2 !== void 0 && _datasource$afdatabas2.name) {
          segmentsArray.push({
            label: datasource.afdatabase.name,
            value: {
              value: datasource.afdatabase.name,
              expandable: true
            }
          });
        }
        segmentsArray.push({
          label: 'Select Element',
          value: {
            value: '-Select Element-'
          }
        });
      } else {
        segmentsArray.push({
          label: ''
        });
      }
      return segmentsArray;
    });
    _defineProperty(_assertThisInitialized(_this), "updateArray", function (segmentsArray, attributesArray, summariesArray, isPiPoint, cb) {
      _this.setState({
        segments: segmentsArray,
        attributes: attributesArray,
        summaries: summariesArray,
        isPiPoint: isPiPoint
      }, function () {
        if (!isPiPoint) {
          _this.checkAttributeSegments(attributesArray, _this.state.segments).then(function () {
            if (cb) {
              cb();
            }
          });
        }
      });
    });
    _defineProperty(_assertThisInitialized(_this), "scopedVarsDone", false);
    _defineProperty(_assertThisInitialized(_this), "componentDidMount", function () {
      _this.initialLoad(false);
    });
    _defineProperty(_assertThisInitialized(_this), "componentDidUpdate", function () {
      var _this$props$data, _this$props$data2, _this$props$data2$req;
      var query = _this.props.query;
      if (((_this$props$data = _this.props.data) === null || _this$props$data === void 0 ? void 0 : _this$props$data.state) === 'Done' && !!((_this$props$data2 = _this.props.data) !== null && _this$props$data2 !== void 0 && (_this$props$data2$req = _this$props$data2.request) !== null && _this$props$data2$req !== void 0 && _this$props$data2$req.scopedVars) && !_this.scopedVarsDone) {
        _this.scopedVarsDone = true;
        _this.initialLoad(!query.isPiPoint);
      }
    });
    _defineProperty(_assertThisInitialized(_this), "initialLoad", function (force) {
      var _segments$slice, _attributes$slice, _summary$types;
      var query = _this.props.query;
      var metricsQuery = (0,lodash__WEBPACK_IMPORTED_MODULE_0__.defaults)(query, _types__WEBPACK_IMPORTED_MODULE_4__.defaultQuery);
      var segments = metricsQuery.segments,
        attributes = metricsQuery.attributes,
        summary = metricsQuery.summary,
        isPiPoint = metricsQuery.isPiPoint;
      var segmentsArray = force ? [] : (_segments$slice = segments === null || segments === void 0 ? void 0 : segments.slice(0)) !== null && _segments$slice !== void 0 ? _segments$slice : [];
      var attributesArray = force ? [] : (_attributes$slice = attributes === null || attributes === void 0 ? void 0 : attributes.slice(0)) !== null && _attributes$slice !== void 0 ? _attributes$slice : [];
      var summariesArray = (_summary$types = summary === null || summary === void 0 ? void 0 : summary.types) !== null && _summary$types !== void 0 ? _summary$types : [];
      if (!isPiPoint && segmentsArray.length === 0) {
        if (query.target && query.target.length > 0 && query.target !== ';') {
          attributesArray = [];
          // Build query from target
          _this.buildFromTarget(query, segmentsArray, attributesArray).then(function (_segmentsArray) {
            _this.updateArray(_segmentsArray, attributesArray, summariesArray, false);
          })["catch"](function (e) {
            return console.error(e);
          });
          return;
        } else {
          segmentsArray = _this.checkAfServer();
        }
      } else if (isPiPoint && segmentsArray.length > 0) {
        _this.piServer = segmentsArray;
      }
      _this.updateArray(segmentsArray, attributesArray, summariesArray, !!isPiPoint, function () {
        _this.onChange(query);
      });
    });
    _defineProperty(_assertThisInitialized(_this), "onChange", function (query) {
      var _this$props3 = _this.props,
        onChange = _this$props3.onChange,
        onRunQuery = _this$props3.onRunQuery;
      query.summary.types = _this.state.summaries;
      if (query.rawQuery) {
        var _query$query;
        query.target = (_query$query = query.query) !== null && _query$query !== void 0 ? _query$query : '';
      } else {
        var _query$attributes;
        query.elementPath = _this.getSegmentPathUpTo(_this.state.segments, _this.state.segments.length);
        query.target = query.elementPath + ';' + (0,lodash__WEBPACK_IMPORTED_MODULE_0__.join)((_query$attributes = query.attributes) === null || _query$attributes === void 0 ? void 0 : _query$attributes.map(function (s) {
          var _s$value;
          return (_s$value = s.value) === null || _s$value === void 0 ? void 0 : _s$value.value;
        }), ';');
      }
      onChange(query);
      if (query.target && query.target.length > 0) {
        onRunQuery();
      }
    });
    _defineProperty(_assertThisInitialized(_this), "stateCallback", function () {
      var query = _this.props.query;
      _this.onChange(query);
    });
    _defineProperty(_assertThisInitialized(_this), "onIsPiPointChange", function (event) {
      var queryChange = _this.props.query;
      var isPiPoint = !queryChange.isPiPoint;
      _this.setState({
        segments: isPiPoint ? [{
          label: ''
        }] : _this.checkAfServer(),
        attributes: [],
        isPiPoint: isPiPoint
      }, function () {
        _this.onChange(_extends({}, queryChange, {
          expression: '',
          attributes: _this.state.attributes,
          segments: _this.state.segments,
          isPiPoint: isPiPoint
        }));
      });
    });
    _this.onSegmentChange = _this.onSegmentChange.bind(_assertThisInitialized(_this));
    _this.calcBasisValueChanged = _this.calcBasisValueChanged.bind(_assertThisInitialized(_this));
    _this.calcNoDataValueChanged = _this.calcNoDataValueChanged.bind(_assertThisInitialized(_this));
    _this.onSummaryAction = _this.onSummaryAction.bind(_assertThisInitialized(_this));
    _this.onSummaryValueChanged = _this.onSummaryValueChanged.bind(_assertThisInitialized(_this));
    _this.onAttributeAction = _this.onAttributeAction.bind(_assertThisInitialized(_this));
    _this.onAttributeChange = _this.onAttributeChange.bind(_assertThisInitialized(_this));
    _this.summaryTypes = [
    // 'None', // A summary type is not specified.
    'Total',
    // A totalization over the time range.
    'Average',
    // The average value over the time range.
    'Minimum',
    // The minimum value over the time range.
    'Maximum',
    // The maximum value over the time range.
    'Range',
    // The range value over the time range (minimum-maximum).
    'StdDev',
    // The standard deviation over the time range.
    'PopulationStdDev',
    // The population standard deviation over the time range.
    'Count',
    // The sum of event count over the time range when calculation basis is event weighted. The sum of event time duration over the time range when calculation basis is time weighted.
    'PercentGood',
    // Percent of data with good value during the calculation period. For time weighted calculations, the percentage is based on time. For event weighted calculations, the percent is based on event count.
    'All',
    // A convenience for requesting all available summary calculations.
    'AllForNonNumeric' // A convenience for requesting all available summary calculations for non-numeric data.
    ];

    _this.calculationBasis = ['TimeWeighted',
    // Weight the values in the calculation by the time over which they apply. Interpolation is based on whether the attribute is stepped. Interpolated events are generated at the boundaries if necessary.
    'EventWeighted',
    // Evaluate values with equal weighting for each event. No interpolation is done. There must be at least one event within the time range to perform a successful calculation. Two events are required for standard deviation. In handling events at the boundary of the calculation, the AFSDK uses following rules:
    'TimeWeightedContinuous',
    // Apply weighting as in TimeWeighted, but do all interpolation between values as if they represent continuous data, (standard interpolation) regardless of whether the attribute is stepped.
    'TimeWeightedDiscrete',
    // Apply weighting as in TimeWeighted but interpolation between values is performed as if they represent discrete, unrelated values (stair step plot) regardless of the attribute is stepped.
    'EventWeightedExcludeMostRecentEvent',
    // The calculation behaves the same as _EventWeighted_, except in the handling of events at the boundary of summary intervals in a multiple intervals calculation. Use this option to prevent events at the intervals boundary from being double count at both intervals. With this option, events at the end time (most recent time) of an interval is not used in that interval.
    'EventWeightedExcludeEarliestEvent',
    // Similar to the option _EventWeightedExcludeMostRecentEvent_. Events at the start time(earliest time) of an interval is not used in that interval.
    'EventWeightedIncludeBothEnds' // Events at both ends of the interval boundaries are included in the event weighted calculation.
    ];

    _this.noDataReplacement = ['Null',
    // replace with nulls
    'Drop',
    // drop items
    'Previous',
    // use previous value if available
    '0',
    // replace with 0
    'Keep' // Keep value
    ];
    return _this;
  }

  // is selected segment empty
  _createClass(PIWebAPIQueryEditor, [{
    key: "isValueEmpty",
    value: function isValueEmpty(value) {
      return !value || !value.value || !value.value.length || value.value === REMOVE_LABEL;
    }
  }, {
    key: "calcBasisValueChanged",
    value:
    // summary calculation basis change event
    function calcBasisValueChanged(segment) {
      var _segment$value;
      var metricsQuery = this.props.query;
      var summary = metricsQuery.summary;
      summary.basis = (_segment$value = segment.value) === null || _segment$value === void 0 ? void 0 : _segment$value.value;
      this.onChange(_extends({}, metricsQuery, {
        summary: summary
      }));
    }
    // get summary calculation basis user interface segments
  }, {
    key: "getCalcBasisSegments",
    value: function getCalcBasisSegments() {
      var segments = (0,lodash__WEBPACK_IMPORTED_MODULE_0__.map)(this.calculationBasis, function (item) {
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
    }

    // no data change event
  }, {
    key: "calcNoDataValueChanged",
    value: function calcNoDataValueChanged(segment) {
      var _segment$value2;
      var metricsQuery = this.props.query;
      var summary = metricsQuery.summary;
      summary.nodata = (_segment$value2 = segment.value) === null || _segment$value2 === void 0 ? void 0 : _segment$value2.value;
      this.onChange(_extends({}, metricsQuery, {
        summary: summary
      }));
    }
    // get no data user interface segments
  }, {
    key: "getNoDataSegments",
    value: function getNoDataSegments() {
      var segments = (0,lodash__WEBPACK_IMPORTED_MODULE_0__.map)(this.noDataReplacement, function (item) {
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
    }

    // summary query change event
  }, {
    key: "onSummaryValueChanged",
    value: function onSummaryValueChanged(item, index) {
      var summaries = this.state.summaries.slice(0);
      summaries[index] = item;
      if (this.isValueEmpty(item.value)) {
        summaries.splice(index, 1);
      }
      this.setState({
        summaries: summaries
      }, this.stateCallback);
    }
    // get the list of summaries available
  }, {
    key: "getSummarySegments",
    value: function getSummarySegments() {
      var _this2 = this;
      var summaryTypes = (0,lodash__WEBPACK_IMPORTED_MODULE_0__.filter)(this.summaryTypes, function (type) {
        return _this2.state.summaries.map(function (s) {
          var _s$value2;
          return (_s$value2 = s.value) === null || _s$value2 === void 0 ? void 0 : _s$value2.value;
        }).indexOf(type) === -1;
      });
      var segments = (0,lodash__WEBPACK_IMPORTED_MODULE_0__.map)(summaryTypes, function (item) {
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
    }

    // remove a summary from the user interface and the query
  }, {
    key: "removeSummary",
    value: function removeSummary(part) {
      var summaries = (0,lodash__WEBPACK_IMPORTED_MODULE_0__.filter)(this.state.summaries, function (item) {
        return item !== part;
      });
      this.setState({
        summaries: summaries
      });
    }
    // add a new summary to the query
  }, {
    key: "onSummaryAction",
    value: function onSummaryAction(item) {
      var summaries = this.state.summaries.slice(0);
      // if value is not empty, add new attribute segment
      if (!this.isValueEmpty(item.value)) {
        var _item$value4;
        var selectableValue = {
          label: item.label,
          value: {
            value: (_item$value4 = item.value) === null || _item$value4 === void 0 ? void 0 : _item$value4.value,
            expandable: true
          }
        };
        summaries.push(selectableValue);
      }
      this.setState({
        summarySegment: {},
        summaries: summaries
      }, this.stateCallback);
    }

    // remove an attribute from the query
  }, {
    key: "removeAttribute",
    value: function removeAttribute(part) {
      var attributes = (0,lodash__WEBPACK_IMPORTED_MODULE_0__.filter)(this.state.attributes, function (item) {
        return item !== part;
      });
      this.attributeChangeValue(attributes);
    }
    // add an attribute to the query
  }, {
    key: "onAttributeAction",
    value: function onAttributeAction(item) {
      var query = this.props.query;
      var attributes = this.state.attributes.slice(0);
      // if value is not empty, add new attribute segment
      if (!this.isValueEmpty(item.value)) {
        var _item$value5;
        var selectableValue = {
          label: item.label,
          value: {
            value: (_item$value5 = item.value) === null || _item$value5 === void 0 ? void 0 : _item$value5.value,
            expandable: !query.isPiPoint
          }
        };
        attributes.push(selectableValue);
      }
      this.attributeChangeValue(attributes);
    }

    // pi point change event
  }, {
    key: "getSegmentPathUpTo",
    value:
    /**
     * Gets the segment information and parses it to a string.
     *
     * @param {any} index - Last index of segment to use.
     * @returns - AF Path or PI Point name.
     *
     * @memberOf PIWebAPIQueryEditor
     */
    function getSegmentPathUpTo(segments, index) {
      var arr = segments.slice(0, index);
      return (0,lodash__WEBPACK_IMPORTED_MODULE_0__.reduce)(arr, function (result, segment) {
        var _segment$value$value;
        if (!segment.value) {
          return '';
        }
        if (!((_segment$value$value = segment.value.value) !== null && _segment$value$value !== void 0 && _segment$value$value.startsWith('-Select'))) {
          return result ? result + '\\' + segment.value.value : segment.value.value;
        }
        return result;
      }, '');
    }

    /**
     * Get the current AF Element's child attributes. Validates when the element selection changes.
     *
     * @returns - Collection of attributes.
     *
     * @memberOf PIWebAPIQueryEditor
     */
  }, {
    key: "checkAttributeSegments",
    value: function checkAttributeSegments(attributes, segments) {
      var _data$request$scopedV3,
        _data$request3,
        _this3 = this;
      var _this$props4 = this.props,
        datasource = _this$props4.datasource,
        data = _this$props4.data;
      var ctrl = this;
      var findQuery = {
        path: this.getSegmentPathUpTo(segments.slice(0), segments.length),
        type: 'attributes'
      };
      return datasource.metricFindQuery(findQuery, Object.assign((_data$request$scopedV3 = data === null || data === void 0 ? void 0 : (_data$request3 = data.request) === null || _data$request3 === void 0 ? void 0 : _data$request3.scopedVars) !== null && _data$request$scopedV3 !== void 0 ? _data$request$scopedV3 : {}, {
        isPiPoint: false
      })).then(function (attributesResponse) {
        var validAttributes = {};
        (0,lodash__WEBPACK_IMPORTED_MODULE_0__.each)(attributesResponse, function (attribute) {
          validAttributes[attribute.Path.substring(attribute.Path.indexOf('|') + 1)] = attribute.WebId;
        });
        var filteredAttributes = (0,lodash__WEBPACK_IMPORTED_MODULE_0__.filter)(attributes, function (attrib) {
          var _attrib$value;
          var changedValue = datasource.templateSrv.replace((_attrib$value = attrib.value) === null || _attrib$value === void 0 ? void 0 : _attrib$value.value);
          return validAttributes[changedValue] !== undefined;
        });
        ctrl.availableAttributes = validAttributes;
        _this3.attributeChangeValue(filteredAttributes);
      })["catch"](function (err) {
        ctrl.error = err.message || 'Failed to issue metric query';
        _this3.attributeChangeValue(attributes);
      });
    }

    /**
     * Get PI points from server.
     *
     * @returns - Collection of attributes.
     *
     * @memberOf PIWebAPIQueryEditor
     */
  }, {
    key: "checkPiPointSegments",
    value: function checkPiPointSegments(attribute, attributes) {
      var _data$request$scopedV4, _data$request4;
      var _this$props5 = this.props,
        datasource = _this$props5.datasource,
        data = _this$props5.data;
      var ctrl = this;
      var findQuery = {
        path: attribute.path,
        webId: ctrl.getSelectedPIServer(),
        pointName: attribute.label,
        type: 'pipoint'
      };
      return datasource.metricFindQuery(findQuery, Object.assign((_data$request$scopedV4 = data === null || data === void 0 ? void 0 : (_data$request4 = data.request) === null || _data$request4 === void 0 ? void 0 : _data$request4.scopedVars) !== null && _data$request$scopedV4 !== void 0 ? _data$request$scopedV4 : {}, {
        isPiPoint: true
      })).then(function () {
        ctrl.attributeChangeValue(attributes);
      })["catch"](function (err) {
        ctrl.error = err.message || 'Failed to issue metric query';
        ctrl.attributeChangeValue([]);
      });
    }

    /**
     * Gets the webid of the current selected pi data server.
     *
     * @memberOf PIWebAPIQueryEditor
     */
  }, {
    key: "getSelectedPIServer",
    value: function getSelectedPIServer() {
      var _this4 = this,
        _this$piServer$0$valu;
      var webID = '';
      this.piServer.forEach(function (s) {
        var parts = _this4.props.query.target.split(';');
        if (parts.length >= 2) {
          if (parts[0] === s.text) {
            webID = s.WebId;
            return;
          }
        }
      });
      return this.piServer.length > 0 ? (_this$piServer$0$valu = this.piServer[0].value) === null || _this$piServer$0$valu === void 0 ? void 0 : _this$piServer$0$valu.webId : webID;
    }

    /**
     * Queries PI Web API for child elements and attributes when the raw query text editor is changed.
     *
     * @memberOf PIWebAPIQueryEditor
     */
  }, {
    key: "textEditorChanged",
    value: function textEditorChanged() {
      var _this5 = this;
      var _this$props6 = this.props,
        query = _this$props6.query,
        onChange = _this$props6.onChange;
      var splitAttributes = query.target.split(';');
      var splitElements = splitAttributes.length > 0 ? splitAttributes[0].split('\\') : [];
      var segments = [];
      var attributes = [];
      if (splitElements.length > 1 || splitElements.length === 1 && splitElements[0] !== '') {
        // remove element hierarchy from attribute collection
        splitAttributes.splice(0, 1);
        (0,lodash__WEBPACK_IMPORTED_MODULE_0__.each)(splitElements, function (item, _) {
          segments.push({
            label: item,
            value: {
              type: item.match(/\${\w+}/gi) ? 'template' : undefined,
              value: item,
              expandable: true
            }
          });
        });
        (0,lodash__WEBPACK_IMPORTED_MODULE_0__.each)(splitAttributes, function (item, index) {
          if (item !== '') {
            attributes.push({
              label: item,
              value: {
                value: item,
                expandable: false
              }
            });
          }
        });
        this.getElementSegments(splitElements.length + 1, segments).then(function (elements) {
          if (elements.length > 0) {
            segments.push({
              label: 'Select Element',
              value: {
                value: '-Select Element-'
              }
            });
          }
        }).then(function () {
          _this5.updateArray(segments, attributes, _this5.state.summaries, query.isPiPoint, function () {
            onChange(_extends({}, query, {
              query: undefined,
              rawQuery: false
            }));
          });
        });
      } else {
        segments = this.checkAfServer();
        this.updateArray(segments, this.state.attributes, this.state.summaries, query.isPiPoint, function () {
          _this5.onChange(_extends({}, query, {
            query: undefined,
            rawQuery: false,
            attributes: _this5.state.attributes,
            segments: _this5.state.segments
          }));
        });
      }
    }

    /**
     * Check if the AF server and database are configured in the datasoure config.
     *
     * @returns the segments array
     *
     * @memberOf PIWebAPIQueryEditor
     */
  }, {
    key: "render",
    value: function render() {
      var _this6 = this;
      var _this$props7 = this.props,
        queryProps = _this$props7.query,
        _onChange = _this$props7.onChange,
        onRunQuery = _this$props7.onRunQuery;
      var metricsQuery = (0,lodash__WEBPACK_IMPORTED_MODULE_0__.defaults)(queryProps, _types__WEBPACK_IMPORTED_MODULE_4__.defaultQuery);
      var useLastValue = metricsQuery.useLastValue,
        useUnit = metricsQuery.useUnit,
        interpolate = metricsQuery.interpolate,
        query = metricsQuery.query,
        rawQuery = metricsQuery.rawQuery,
        digitalStates = metricsQuery.digitalStates,
        enableStreaming = metricsQuery.enableStreaming,
        recordedValues = metricsQuery.recordedValues,
        expression = metricsQuery.expression,
        isPiPoint = metricsQuery.isPiPoint,
        summary = metricsQuery.summary,
        display = metricsQuery.display,
        regex = metricsQuery.regex;
      return /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_1___default().createElement((react__WEBPACK_IMPORTED_MODULE_1___default().Fragment), null, this.props.datasource.piPointConfig && /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_1___default().createElement(_grafana_ui__WEBPACK_IMPORTED_MODULE_2__.InlineField, {
        label: "Is Pi Point?",
        labelWidth: LABEL_WIDTH
      }, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_1___default().createElement(_grafana_ui__WEBPACK_IMPORTED_MODULE_2__.InlineSwitch, {
        value: isPiPoint,
        onChange: this.onIsPiPointChange
      })), !!rawQuery && /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_1___default().createElement(_grafana_ui__WEBPACK_IMPORTED_MODULE_2__.InlineFieldRow, null, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_1___default().createElement(_grafana_ui__WEBPACK_IMPORTED_MODULE_2__.InlineField, {
        label: "Raw Query",
        labelWidth: LABEL_WIDTH,
        grow: true
      }, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_1___default().createElement(_grafana_ui__WEBPACK_IMPORTED_MODULE_2__.Input, {
        onBlur: this.stateCallback,
        value: query,
        onChange: function onChange(event) {
          return _onChange(_extends({}, metricsQuery, {
            query: event.target.value
          }));
        },
        placeholder: "enter query"
      })), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_1___default().createElement(components_QueryEditorModeSwitcher__WEBPACK_IMPORTED_MODULE_5__.QueryEditorModeSwitcher, {
        isRaw: true,
        onChange: function onChange(value) {
          return _this6.textEditorChanged();
        }
      })), !rawQuery && /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_1___default().createElement((react__WEBPACK_IMPORTED_MODULE_1___default().Fragment), null, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_1___default().createElement("div", {
        className: "gf-form-inline"
      }, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_1___default().createElement(_components_Forms__WEBPACK_IMPORTED_MODULE_3__.QueryRawInlineField, {
        label: isPiPoint ? 'PI Server' : 'AF Elements',
        tooltip: isPiPoint ? 'Select PI server.' : 'Select AF Element.'
      }, this.state.segments.map(function (segment, index) {
        return /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_1___default().createElement(_grafana_ui__WEBPACK_IMPORTED_MODULE_2__.SegmentAsync, {
          key: 'element-' + index,
          Component: /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_1___default().createElement(CustomLabelComponent, {
            value: segment.value,
            label: segment.label
          }),
          onChange: function onChange(item) {
            return _this6.onSegmentChange(item, index);
          },
          loadOptions: function loadOptions(query) {
            return _this6.getElementSegments(index);
          },
          allowCustomValue: true,
          inputMinWidth: MIN_ELEM_INPUT_WIDTH
        });
      }), _QueryRowTerminator || (_QueryRowTerminator = /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_1___default().createElement(_components_Forms__WEBPACK_IMPORTED_MODULE_3__.QueryRowTerminator, null)), !isPiPoint && /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_1___default().createElement(components_QueryEditorModeSwitcher__WEBPACK_IMPORTED_MODULE_5__.QueryEditorModeSwitcher, {
        isRaw: false,
        onChange: function onChange(value) {
          _onChange(_extends({}, metricsQuery, {
            query: metricsQuery.target,
            rawQuery: value
          }));
        }
      }))), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_1___default().createElement(_components_Forms__WEBPACK_IMPORTED_MODULE_3__.QueryInlineField, {
        label: isPiPoint ? 'Pi Points' : 'Attributes'
      }, this.state.attributes.map(function (attribute, index) {
        if (isPiPoint) {
          return /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_1___default().createElement(_grafana_ui__WEBPACK_IMPORTED_MODULE_2__.SegmentAsync, {
            key: 'attributes-' + index,
            Component: /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_1___default().createElement(CustomLabelComponent, {
              value: attribute.value,
              label: attribute.label
            }),
            disabled: _this6.piServer.length === 0,
            onChange: function onChange(item) {
              return _this6.onPiPointChange(item, index);
            },
            loadOptions: _this6.getAttributeSegmentsPI,
            reloadOptionsOnChange: true,
            allowCustomValue: true,
            inputMinWidth: MIN_ATTR_INPUT_WIDTH
          });
        }
        return /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_1___default().createElement(_grafana_ui__WEBPACK_IMPORTED_MODULE_2__.Segment, {
          key: 'attributes-' + index,
          Component: /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_1___default().createElement(CustomLabelComponent, {
            value: attribute.value,
            label: attribute.label
          }),
          disabled: _this6.state.segments.length <= 2,
          onChange: function onChange(item) {
            return _this6.onAttributeChange(item, index);
          },
          options: _this6.getAttributeSegmentsAF(),
          allowCustomValue: true,
          inputMinWidth: MIN_ATTR_INPUT_WIDTH
        });
      }), isPiPoint && /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_1___default().createElement(_grafana_ui__WEBPACK_IMPORTED_MODULE_2__.SegmentAsync, {
        Component: /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_1___default().createElement(CustomLabelComponent, {
          value: this.state.attributeSegment.value,
          label: this.state.attributeSegment.label
        }),
        disabled: this.piServer.length === 0,
        onChange: this.onAttributeAction,
        loadOptions: this.getAttributeSegmentsPI,
        reloadOptionsOnChange: true,
        allowCustomValue: true,
        inputMinWidth: MIN_ATTR_INPUT_WIDTH
      }), !isPiPoint && /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_1___default().createElement(_grafana_ui__WEBPACK_IMPORTED_MODULE_2__.Segment, {
        Component: /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_1___default().createElement(CustomLabelComponent, {
          value: this.state.attributeSegment.value,
          label: this.state.attributeSegment.label
        }),
        disabled: this.state.segments.length <= 2,
        onChange: this.onAttributeAction,
        options: this.getAttributeSegmentsAF(),
        allowCustomValue: true,
        inputMinWidth: MIN_ATTR_INPUT_WIDTH
      }))), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_1___default().createElement(_grafana_ui__WEBPACK_IMPORTED_MODULE_2__.InlineFieldRow, null, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_1___default().createElement(_grafana_ui__WEBPACK_IMPORTED_MODULE_2__.InlineField, {
        label: "Use Last Value",
        tooltip: "Fetch only last value from time range",
        labelWidth: LABEL_WIDTH
      }, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_1___default().createElement(_grafana_ui__WEBPACK_IMPORTED_MODULE_2__.InlineSwitch, {
        value: useLastValue.enable,
        onChange: function onChange() {
          return _this6.onChange(_extends({}, metricsQuery, {
            useLastValue: _extends({}, useLastValue, {
              enable: !useLastValue.enable
            })
          }));
        }
      })), this.props.datasource.useUnitConfig && /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_1___default().createElement(_grafana_ui__WEBPACK_IMPORTED_MODULE_2__.InlineField, {
        label: "Use unit from datapoints",
        tooltip: "Use unit in label from PI tag or PI AF attribute",
        labelWidth: LABEL_WIDTH
      }, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_1___default().createElement(_grafana_ui__WEBPACK_IMPORTED_MODULE_2__.InlineSwitch, {
        value: useUnit.enable,
        onChange: function onChange() {
          return _this6.onChange(_extends({}, metricsQuery, {
            useUnit: _extends({}, useUnit, {
              enable: !useUnit.enable
            })
          }));
        }
      })), this.props.datasource.useStreaming && /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_1___default().createElement(_grafana_ui__WEBPACK_IMPORTED_MODULE_2__.InlineField, {
        label: "Enable Streaming",
        labelWidth: LABEL_WIDTH,
        tooltip: 'Enable streaming data if it is supported for the point type.'
      }, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_1___default().createElement(_grafana_ui__WEBPACK_IMPORTED_MODULE_2__.InlineSwitch, {
        value: enableStreaming.enable,
        onChange: function onChange() {
          return _this6.onChange(_extends({}, metricsQuery, {
            enableStreaming: _extends({}, enableStreaming, {
              enable: !enableStreaming.enable
            })
          }));
        }
      }))), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_1___default().createElement(_grafana_ui__WEBPACK_IMPORTED_MODULE_2__.InlineFieldRow, null, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_1___default().createElement(_grafana_ui__WEBPACK_IMPORTED_MODULE_2__.InlineField, {
        label: "Calculation",
        labelWidth: LABEL_WIDTH,
        tooltip: "Modify all attributes by an equation. Use '.' for current item. Leave Attributes empty if you wish to perform element based calculations."
      }, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_1___default().createElement(_grafana_ui__WEBPACK_IMPORTED_MODULE_2__.Input, {
        onBlur: onRunQuery,
        value: expression,
        onChange: function onChange(event) {
          return _onChange(_extends({}, metricsQuery, {
            expression: event.target.value
          }));
        },
        placeholder: "'.'*2"
      }))), !useLastValue.enable && /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_1___default().createElement((react__WEBPACK_IMPORTED_MODULE_1___default().Fragment), null, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_1___default().createElement(_grafana_ui__WEBPACK_IMPORTED_MODULE_2__.InlineFieldRow, null, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_1___default().createElement(_grafana_ui__WEBPACK_IMPORTED_MODULE_2__.InlineField, {
        label: "Max Recorded Values",
        labelWidth: LABEL_WIDTH,
        tooltip: 'Maximum number of recorded value to retrive from the data archive, without using interpolation.'
      }, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_1___default().createElement(_grafana_ui__WEBPACK_IMPORTED_MODULE_2__.Input, {
        onBlur: onRunQuery,
        value: recordedValues.maxNumber,
        onChange: function onChange(event) {
          return _onChange(_extends({}, metricsQuery, {
            recordedValues: _extends({}, recordedValues, {
              maxNumber: parseInt(event.target.value, 10)
            })
          }));
        },
        type: "number",
        placeholder: "1000"
      })), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_1___default().createElement(_grafana_ui__WEBPACK_IMPORTED_MODULE_2__.InlineField, {
        label: "Recorded Values",
        labelWidth: LABEL_WIDTH
      }, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_1___default().createElement(_grafana_ui__WEBPACK_IMPORTED_MODULE_2__.InlineSwitch, {
        value: recordedValues.enable,
        onChange: function onChange() {
          return _this6.onChange(_extends({}, metricsQuery, {
            recordedValues: _extends({}, recordedValues, {
              enable: !recordedValues.enable
            })
          }));
        }
      })), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_1___default().createElement(_grafana_ui__WEBPACK_IMPORTED_MODULE_2__.InlineField, {
        label: "Digital States",
        labelWidth: LABEL_WIDTH
      }, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_1___default().createElement(_grafana_ui__WEBPACK_IMPORTED_MODULE_2__.InlineSwitch, {
        value: digitalStates.enable,
        onChange: function onChange() {
          return _this6.onChange(_extends({}, metricsQuery, {
            digitalStates: _extends({}, digitalStates, {
              enable: !digitalStates.enable
            })
          }));
        }
      }))), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_1___default().createElement(_grafana_ui__WEBPACK_IMPORTED_MODULE_2__.InlineFieldRow, null, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_1___default().createElement(_grafana_ui__WEBPACK_IMPORTED_MODULE_2__.InlineField, {
        label: !!expression ? "Interval Period" : "Interpolate Period",
        labelWidth: LABEL_WIDTH,
        tooltip: "Override time between sampling, e.g. '30s'. Defaults to timespan/chart width."
      }, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_1___default().createElement(_grafana_ui__WEBPACK_IMPORTED_MODULE_2__.Input, {
        onBlur: onRunQuery,
        value: interpolate.interval,
        onChange: function onChange(event) {
          return _onChange(_extends({}, metricsQuery, {
            interpolate: _extends({}, interpolate, {
              interval: event.target.value
            })
          }));
        },
        placeholder: "30s"
      })), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_1___default().createElement(_grafana_ui__WEBPACK_IMPORTED_MODULE_2__.InlineField, {
        label: !!expression ? "Interval Values" : "Interpolate",
        labelWidth: LABEL_WIDTH
      }, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_1___default().createElement(_grafana_ui__WEBPACK_IMPORTED_MODULE_2__.InlineSwitch, {
        value: interpolate.enable,
        onChange: function onChange() {
          return _this6.onChange(_extends({}, metricsQuery, {
            interpolate: _extends({}, interpolate, {
              enable: !interpolate.enable
            })
          }));
        }
      })), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_1___default().createElement(_grafana_ui__WEBPACK_IMPORTED_MODULE_2__.InlineField, {
        label: "Replace Bad Data",
        labelWidth: LABEL_WIDTH,
        tooltip: 'Replacement for bad quality values.'
      }, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_1___default().createElement(_grafana_ui__WEBPACK_IMPORTED_MODULE_2__.Segment, {
        Component: /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_1___default().createElement(CustomLabelComponent, {
          value: {
            value: summary.nodata
          },
          label: summary.nodata
        }),
        onChange: this.calcNoDataValueChanged,
        options: this.getNoDataSegments(),
        allowCustomValue: true
      }))), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_1___default().createElement(_grafana_ui__WEBPACK_IMPORTED_MODULE_2__.InlineFieldRow, null, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_1___default().createElement(_grafana_ui__WEBPACK_IMPORTED_MODULE_2__.InlineField, {
        label: "Summary Period",
        labelWidth: LABEL_WIDTH,
        tooltip: "Define the summary period, e.g. '30s'."
      }, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_1___default().createElement(_grafana_ui__WEBPACK_IMPORTED_MODULE_2__.Input, {
        onBlur: onRunQuery,
        value: summary.interval,
        onChange: function onChange(event) {
          return _onChange(_extends({}, metricsQuery, {
            summary: _extends({}, summary, {
              interval: event.target.value
            })
          }));
        },
        placeholder: "30s"
      })), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_1___default().createElement(_grafana_ui__WEBPACK_IMPORTED_MODULE_2__.InlineField, {
        label: "Basis",
        labelWidth: LABEL_WIDTH,
        tooltip: 'Defines the possible calculation options when performing summary calculations over time-series data.'
      }, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_1___default().createElement(_grafana_ui__WEBPACK_IMPORTED_MODULE_2__.Segment, {
        Component: /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_1___default().createElement(CustomLabelComponent, {
          value: {
            value: summary.basis
          },
          label: summary.basis
        }),
        onChange: this.calcBasisValueChanged,
        options: this.getCalcBasisSegments(),
        allowCustomValue: true
      })), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_1___default().createElement(_grafana_ui__WEBPACK_IMPORTED_MODULE_2__.InlineField, {
        label: "Summaries",
        labelWidth: LABEL_WIDTH,
        tooltip: 'PI Web API summary options.'
      }, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_1___default().createElement(_grafana_ui__WEBPACK_IMPORTED_MODULE_2__.InlineFieldRow, null, this.state.summaries.map(function (s, index) {
        return /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_1___default().createElement(_grafana_ui__WEBPACK_IMPORTED_MODULE_2__.Segment, {
          key: 'summaries-' + index,
          Component: /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_1___default().createElement(CustomLabelComponent, {
            value: s.value,
            label: s.label
          }),
          onChange: function onChange(item) {
            return _this6.onSummaryValueChanged(item, index);
          },
          options: _this6.getSummarySegments(),
          allowCustomValue: true
        });
      }), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_1___default().createElement(_grafana_ui__WEBPACK_IMPORTED_MODULE_2__.Segment, {
        Component: /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_1___default().createElement(CustomLabelComponent, {
          value: this.state.summarySegment.value,
          label: this.state.summarySegment.label
        }),
        onChange: this.onSummaryAction,
        options: this.getSummarySegments(),
        allowCustomValue: true
      }))))), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_1___default().createElement(_grafana_ui__WEBPACK_IMPORTED_MODULE_2__.InlineFieldRow, null, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_1___default().createElement(_grafana_ui__WEBPACK_IMPORTED_MODULE_2__.InlineField, {
        label: "Display Name",
        labelWidth: LABEL_WIDTH,
        tooltip: 'If single attribute, modify display name. Otherwise use regex to modify display name.'
      }, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_1___default().createElement(_grafana_ui__WEBPACK_IMPORTED_MODULE_2__.Input, {
        onBlur: onRunQuery,
        value: display,
        onChange: function onChange(event) {
          return _onChange(_extends({}, metricsQuery, {
            display: event.target.value
          }));
        },
        placeholder: "Display"
      })), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_1___default().createElement(_grafana_ui__WEBPACK_IMPORTED_MODULE_2__.InlineField, {
        label: "Enable Regex Replace",
        labelWidth: LABEL_WIDTH
      }, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_1___default().createElement(_grafana_ui__WEBPACK_IMPORTED_MODULE_2__.InlineSwitch, {
        value: regex.enable,
        onChange: function onChange() {
          _this6.onChange(_extends({}, metricsQuery, {
            regex: _extends({}, regex, {
              enable: !regex.enable
            })
          }));
        }
      })), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_1___default().createElement(_grafana_ui__WEBPACK_IMPORTED_MODULE_2__.InlineField, {
        label: "Search",
        labelWidth: LABEL_WIDTH - 8
      }, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_1___default().createElement(_grafana_ui__WEBPACK_IMPORTED_MODULE_2__.Input, {
        onBlur: onRunQuery,
        value: regex.search,
        onChange: function onChange(event) {
          return _onChange(_extends({}, metricsQuery, {
            regex: _extends({}, regex, {
              search: event.target.value
            })
          }));
        },
        placeholder: "(.*)"
      })), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_1___default().createElement(_grafana_ui__WEBPACK_IMPORTED_MODULE_2__.InlineField, {
        label: "Replace",
        labelWidth: LABEL_WIDTH - 8
      }, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_1___default().createElement(_grafana_ui__WEBPACK_IMPORTED_MODULE_2__.Input, {
        onBlur: onRunQuery,
        value: regex.replace,
        onChange: function onChange(event) {
          return _onChange(_extends({}, metricsQuery, {
            regex: _extends({}, regex, {
              replace: event.target.value
            })
          }));
        },
        placeholder: "$1"
      }))));
    }
  }]);
  return PIWebAPIQueryEditor;
}(react__WEBPACK_IMPORTED_MODULE_1__.PureComponent);

/***/ }),

/***/ "./types.ts":
/*!******************!*\
  !*** ./types.ts ***!
  \******************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "defaultQuery": () => (/* binding */ defaultQuery)
/* harmony export */ });
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
  useLastValue: {
    enable: false
  },
  recordedValues: {
    enable: false
  },
  digitalStates: {
    enable: false
  },
  enableStreaming: {
    enable: false
  },
  useUnit: {
    enable: false
  },
  isPiPoint: false
};

/**
 * These are options configured for each DataSource instance
 */

/***/ }),

/***/ "@grafana/data":
/*!********************************!*\
  !*** external "@grafana/data" ***!
  \********************************/
/***/ ((module) => {

module.exports = __WEBPACK_EXTERNAL_MODULE__grafana_data__;

/***/ }),

/***/ "@grafana/runtime":
/*!***********************************!*\
  !*** external "@grafana/runtime" ***!
  \***********************************/
/***/ ((module) => {

module.exports = __WEBPACK_EXTERNAL_MODULE__grafana_runtime__;

/***/ }),

/***/ "@grafana/ui":
/*!******************************!*\
  !*** external "@grafana/ui" ***!
  \******************************/
/***/ ((module) => {

module.exports = __WEBPACK_EXTERNAL_MODULE__grafana_ui__;

/***/ }),

/***/ "lodash":
/*!*************************!*\
  !*** external "lodash" ***!
  \*************************/
/***/ ((module) => {

module.exports = __WEBPACK_EXTERNAL_MODULE_lodash__;

/***/ }),

/***/ "react":
/*!************************!*\
  !*** external "react" ***!
  \************************/
/***/ ((module) => {

module.exports = __WEBPACK_EXTERNAL_MODULE_react__;

/***/ }),

/***/ "rxjs":
/*!***********************!*\
  !*** external "rxjs" ***!
  \***********************/
/***/ ((module) => {

module.exports = __WEBPACK_EXTERNAL_MODULE_rxjs__;

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/compat get default export */
/******/ 	(() => {
/******/ 		// getDefaultExport function for compatibility with non-harmony modules
/******/ 		__webpack_require__.n = (module) => {
/******/ 			var getter = module && module.__esModule ?
/******/ 				() => (module['default']) :
/******/ 				() => (module);
/******/ 			__webpack_require__.d(getter, { a: getter });
/******/ 			return getter;
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry need to be wrapped in an IIFE because it need to be isolated against other modules in the chunk.
(() => {
/*!*******************!*\
  !*** ./module.ts ***!
  \*******************/
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "plugin": () => (/* binding */ plugin)
/* harmony export */ });
/* harmony import */ var _grafana_data__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @grafana/data */ "@grafana/data");
/* harmony import */ var _grafana_data__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_grafana_data__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _config_ConfigEditor__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./config/ConfigEditor */ "./config/ConfigEditor.tsx");
/* harmony import */ var _query_QueryEditor__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./query/QueryEditor */ "./query/QueryEditor.tsx");
/* harmony import */ var _datasource__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./datasource */ "./datasource.ts");




var plugin = new _grafana_data__WEBPACK_IMPORTED_MODULE_0__.DataSourcePlugin(_datasource__WEBPACK_IMPORTED_MODULE_3__.PiWebAPIDatasource).setQueryEditor(_query_QueryEditor__WEBPACK_IMPORTED_MODULE_2__.PIWebAPIQueryEditor).setConfigEditor(_config_ConfigEditor__WEBPACK_IMPORTED_MODULE_1__.PIWebAPIConfigEditor);
})();

/******/ 	return __webpack_exports__;
/******/ })()
;
});;
//# sourceMappingURL=module.js.map
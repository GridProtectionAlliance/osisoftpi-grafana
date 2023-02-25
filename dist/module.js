define(["@grafana/data","@grafana/runtime","@grafana/ui","lodash","react","rxjs"], (__WEBPACK_EXTERNAL_MODULE__grafana_data__, __WEBPACK_EXTERNAL_MODULE__grafana_runtime__, __WEBPACK_EXTERNAL_MODULE__grafana_ui__, __WEBPACK_EXTERNAL_MODULE_lodash__, __WEBPACK_EXTERNAL_MODULE_react__, __WEBPACK_EXTERNAL_MODULE_rxjs__) => { return /******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./AnnotationsQueryEditor.tsx":
/*!************************************!*\
  !*** ./AnnotationsQueryEditor.tsx ***!
  \************************************/
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
    onAnnotationChange = props.onAnnotationChange,
    _onChange = props.onChange,
    onRunQuery = props.onRunQuery;

  // this should never happen, but we want to keep typescript happy
  if (annotation === undefined || onAnnotationChange === undefined) {
    return null;
  }
  var _useState = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)(''),
    _useState2 = _slicedToArray(_useState, 2),
    afWebId = _useState2[0],
    setAfWebId = _useState2[1];
  var _useState3 = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)((_annotation$target$da = (_annotation$target = annotation.target) === null || _annotation$target === void 0 ? void 0 : _annotation$target.database) !== null && _annotation$target$da !== void 0 ? _annotation$target$da : {}),
    _useState4 = _slicedToArray(_useState3, 2),
    database = _useState4[0],
    setDatabase = _useState4[1];
  var getEventFrames = function getEventFrames() {
    console.log('get event frames', database);
    return datasource.getEventFrameTemplates(database === null || database === void 0 ? void 0 : database.WebId).then(function (templ) {
      var templatesMap = templ.map(function (d) {
        return {
          label: d.Name,
          value: d
        };
      });
      return templatesMap;
    });
  };
  var getDatabases = function getDatabases() {
    console.log('get databases', afWebId);
    return datasource.getDatabases(afWebId).then(function (dbs) {
      var databasesMap = dbs.map(function (d) {
        return {
          label: d.Name,
          value: d
        };
      });
      return databasesMap;
    });
  };
  datasource.getAssetServer(datasource.afserver.name).then(function (result) {
    setAfWebId(result.WebId);
  });
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
  var onChangeQuery = function onChangeQuery(query) {
    _onChange(query);
  };
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
      return onChangeQuery(_extends({}, query, {
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

/***/ "./ConfigEditor.tsx":
/*!**************************!*\
  !*** ./ConfigEditor.tsx ***!
  \**************************/
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

/***/ "./QueryEditor.tsx":
/*!*************************!*\
  !*** ./QueryEditor.tsx ***!
  \*************************/
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
/* harmony import */ var _components_Forms__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./components/Forms */ "./components/Forms.tsx");
/* harmony import */ var _types__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./types */ "./types.ts");
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
        path: _this.getSegmentPathUpTo(currentSegment !== null && currentSegment !== void 0 ? currentSegment : _this.state.segments.slice(0), index)
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

        // if (!findQuery.path?.length) {
        //   return Promise.resolve([]);
        // }
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
    });
    _defineProperty(_assertThisInitialized(_this), "getAttributeSegmentsAF", function (attributeText) {
      var ctrl = _assertThisInitialized(_this);
      var segments = [];
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
      segments.unshift({
        label: REMOVE_LABEL,
        value: {
          value: REMOVE_LABEL
        }
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
      _this.updateArray(segmentsArray, attributesArray, summariesArray, true, function () {
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
      var ctrl = this;
      var summaryTypes = (0,lodash__WEBPACK_IMPORTED_MODULE_0__.filter)(ctrl.summaryTypes, function (type) {
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
        interpolate = metricsQuery.interpolate,
        query = metricsQuery.query,
        rawQuery = metricsQuery.rawQuery,
        digitalStates = metricsQuery.digitalStates,
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
      }))), !useLastValue.enable && /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_1___default().createElement((react__WEBPACK_IMPORTED_MODULE_1___default().Fragment), null, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_1___default().createElement(_grafana_ui__WEBPACK_IMPORTED_MODULE_2__.InlineField, {
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
      })), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_1___default().createElement(_grafana_ui__WEBPACK_IMPORTED_MODULE_2__.InlineFieldRow, null, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_1___default().createElement(_grafana_ui__WEBPACK_IMPORTED_MODULE_2__.InlineField, {
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
        label: "Interpolate Period",
        labelWidth: LABEL_WIDTH,
        tooltip: "Override time in seconds between sampling, e.g. '30'. Defaults to timespan/chart width."
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
        placeholder: "30"
      })), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_1___default().createElement(_grafana_ui__WEBPACK_IMPORTED_MODULE_2__.InlineField, {
        label: "Interpolate",
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
        tooltip: "Override time between sampling, e.g. '30s'."
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
        tooltip: 'Replacement for bad quality values.'
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
/* harmony import */ var _grafana_data__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @grafana/data */ "@grafana/data");
/* harmony import */ var _grafana_data__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(_grafana_data__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var _grafana_runtime__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! @grafana/runtime */ "@grafana/runtime");
/* harmony import */ var _grafana_runtime__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(_grafana_runtime__WEBPACK_IMPORTED_MODULE_3__);
/* harmony import */ var helper__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! helper */ "./helper.ts");
/* harmony import */ var AnnotationsQueryEditor__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! AnnotationsQueryEditor */ "./AnnotationsQueryEditor.tsx");
function _extends() { _extends = Object.assign ? Object.assign.bind() : function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; }; return _extends.apply(this, arguments); }
function _createForOfIteratorHelper(o, allowArrayLike) { var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"]; if (!it) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e) { throw _e; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = it.call(o); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e2) { didErr = true; err = _e2; }, f: function f() { try { if (!normalCompletion && it["return"] != null) it["return"](); } finally { if (didErr) throw err; } } }; }
function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }
function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }
function _typeof(obj) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) { return typeof obj; } : function (obj) { return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }, _typeof(obj); }
function _regeneratorRuntime() { "use strict"; /*! regenerator-runtime -- Copyright (c) 2014-present, Facebook, Inc. -- license (MIT): https://github.com/facebook/regenerator/blob/main/LICENSE */ _regeneratorRuntime = function _regeneratorRuntime() { return exports; }; var exports = {}, Op = Object.prototype, hasOwn = Op.hasOwnProperty, $Symbol = "function" == typeof Symbol ? Symbol : {}, iteratorSymbol = $Symbol.iterator || "@@iterator", asyncIteratorSymbol = $Symbol.asyncIterator || "@@asyncIterator", toStringTagSymbol = $Symbol.toStringTag || "@@toStringTag"; function define(obj, key, value) { return Object.defineProperty(obj, key, { value: value, enumerable: !0, configurable: !0, writable: !0 }), obj[key]; } try { define({}, ""); } catch (err) { define = function define(obj, key, value) { return obj[key] = value; }; } function wrap(innerFn, outerFn, self, tryLocsList) { var protoGenerator = outerFn && outerFn.prototype instanceof Generator ? outerFn : Generator, generator = Object.create(protoGenerator.prototype), context = new Context(tryLocsList || []); return generator._invoke = function (innerFn, self, context) { var state = "suspendedStart"; return function (method, arg) { if ("executing" === state) throw new Error("Generator is already running"); if ("completed" === state) { if ("throw" === method) throw arg; return doneResult(); } for (context.method = method, context.arg = arg;;) { var delegate = context.delegate; if (delegate) { var delegateResult = maybeInvokeDelegate(delegate, context); if (delegateResult) { if (delegateResult === ContinueSentinel) continue; return delegateResult; } } if ("next" === context.method) context.sent = context._sent = context.arg;else if ("throw" === context.method) { if ("suspendedStart" === state) throw state = "completed", context.arg; context.dispatchException(context.arg); } else "return" === context.method && context.abrupt("return", context.arg); state = "executing"; var record = tryCatch(innerFn, self, context); if ("normal" === record.type) { if (state = context.done ? "completed" : "suspendedYield", record.arg === ContinueSentinel) continue; return { value: record.arg, done: context.done }; } "throw" === record.type && (state = "completed", context.method = "throw", context.arg = record.arg); } }; }(innerFn, self, context), generator; } function tryCatch(fn, obj, arg) { try { return { type: "normal", arg: fn.call(obj, arg) }; } catch (err) { return { type: "throw", arg: err }; } } exports.wrap = wrap; var ContinueSentinel = {}; function Generator() {} function GeneratorFunction() {} function GeneratorFunctionPrototype() {} var IteratorPrototype = {}; define(IteratorPrototype, iteratorSymbol, function () { return this; }); var getProto = Object.getPrototypeOf, NativeIteratorPrototype = getProto && getProto(getProto(values([]))); NativeIteratorPrototype && NativeIteratorPrototype !== Op && hasOwn.call(NativeIteratorPrototype, iteratorSymbol) && (IteratorPrototype = NativeIteratorPrototype); var Gp = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(IteratorPrototype); function defineIteratorMethods(prototype) { ["next", "throw", "return"].forEach(function (method) { define(prototype, method, function (arg) { return this._invoke(method, arg); }); }); } function AsyncIterator(generator, PromiseImpl) { function invoke(method, arg, resolve, reject) { var record = tryCatch(generator[method], generator, arg); if ("throw" !== record.type) { var result = record.arg, value = result.value; return value && "object" == _typeof(value) && hasOwn.call(value, "__await") ? PromiseImpl.resolve(value.__await).then(function (value) { invoke("next", value, resolve, reject); }, function (err) { invoke("throw", err, resolve, reject); }) : PromiseImpl.resolve(value).then(function (unwrapped) { result.value = unwrapped, resolve(result); }, function (error) { return invoke("throw", error, resolve, reject); }); } reject(record.arg); } var previousPromise; this._invoke = function (method, arg) { function callInvokeWithMethodAndArg() { return new PromiseImpl(function (resolve, reject) { invoke(method, arg, resolve, reject); }); } return previousPromise = previousPromise ? previousPromise.then(callInvokeWithMethodAndArg, callInvokeWithMethodAndArg) : callInvokeWithMethodAndArg(); }; } function maybeInvokeDelegate(delegate, context) { var method = delegate.iterator[context.method]; if (undefined === method) { if (context.delegate = null, "throw" === context.method) { if (delegate.iterator["return"] && (context.method = "return", context.arg = undefined, maybeInvokeDelegate(delegate, context), "throw" === context.method)) return ContinueSentinel; context.method = "throw", context.arg = new TypeError("The iterator does not provide a 'throw' method"); } return ContinueSentinel; } var record = tryCatch(method, delegate.iterator, context.arg); if ("throw" === record.type) return context.method = "throw", context.arg = record.arg, context.delegate = null, ContinueSentinel; var info = record.arg; return info ? info.done ? (context[delegate.resultName] = info.value, context.next = delegate.nextLoc, "return" !== context.method && (context.method = "next", context.arg = undefined), context.delegate = null, ContinueSentinel) : info : (context.method = "throw", context.arg = new TypeError("iterator result is not an object"), context.delegate = null, ContinueSentinel); } function pushTryEntry(locs) { var entry = { tryLoc: locs[0] }; 1 in locs && (entry.catchLoc = locs[1]), 2 in locs && (entry.finallyLoc = locs[2], entry.afterLoc = locs[3]), this.tryEntries.push(entry); } function resetTryEntry(entry) { var record = entry.completion || {}; record.type = "normal", delete record.arg, entry.completion = record; } function Context(tryLocsList) { this.tryEntries = [{ tryLoc: "root" }], tryLocsList.forEach(pushTryEntry, this), this.reset(!0); } function values(iterable) { if (iterable) { var iteratorMethod = iterable[iteratorSymbol]; if (iteratorMethod) return iteratorMethod.call(iterable); if ("function" == typeof iterable.next) return iterable; if (!isNaN(iterable.length)) { var i = -1, next = function next() { for (; ++i < iterable.length;) { if (hasOwn.call(iterable, i)) return next.value = iterable[i], next.done = !1, next; } return next.value = undefined, next.done = !0, next; }; return next.next = next; } } return { next: doneResult }; } function doneResult() { return { value: undefined, done: !0 }; } return GeneratorFunction.prototype = GeneratorFunctionPrototype, define(Gp, "constructor", GeneratorFunctionPrototype), define(GeneratorFunctionPrototype, "constructor", GeneratorFunction), GeneratorFunction.displayName = define(GeneratorFunctionPrototype, toStringTagSymbol, "GeneratorFunction"), exports.isGeneratorFunction = function (genFun) { var ctor = "function" == typeof genFun && genFun.constructor; return !!ctor && (ctor === GeneratorFunction || "GeneratorFunction" === (ctor.displayName || ctor.name)); }, exports.mark = function (genFun) { return Object.setPrototypeOf ? Object.setPrototypeOf(genFun, GeneratorFunctionPrototype) : (genFun.__proto__ = GeneratorFunctionPrototype, define(genFun, toStringTagSymbol, "GeneratorFunction")), genFun.prototype = Object.create(Gp), genFun; }, exports.awrap = function (arg) { return { __await: arg }; }, defineIteratorMethods(AsyncIterator.prototype), define(AsyncIterator.prototype, asyncIteratorSymbol, function () { return this; }), exports.AsyncIterator = AsyncIterator, exports.async = function (innerFn, outerFn, self, tryLocsList, PromiseImpl) { void 0 === PromiseImpl && (PromiseImpl = Promise); var iter = new AsyncIterator(wrap(innerFn, outerFn, self, tryLocsList), PromiseImpl); return exports.isGeneratorFunction(outerFn) ? iter : iter.next().then(function (result) { return result.done ? result.value : iter.next(); }); }, defineIteratorMethods(Gp), define(Gp, toStringTagSymbol, "Generator"), define(Gp, iteratorSymbol, function () { return this; }), define(Gp, "toString", function () { return "[object Generator]"; }), exports.keys = function (object) { var keys = []; for (var key in object) { keys.push(key); } return keys.reverse(), function next() { for (; keys.length;) { var key = keys.pop(); if (key in object) return next.value = key, next.done = !1, next; } return next.done = !0, next; }; }, exports.values = values, Context.prototype = { constructor: Context, reset: function reset(skipTempReset) { if (this.prev = 0, this.next = 0, this.sent = this._sent = undefined, this.done = !1, this.delegate = null, this.method = "next", this.arg = undefined, this.tryEntries.forEach(resetTryEntry), !skipTempReset) for (var name in this) { "t" === name.charAt(0) && hasOwn.call(this, name) && !isNaN(+name.slice(1)) && (this[name] = undefined); } }, stop: function stop() { this.done = !0; var rootRecord = this.tryEntries[0].completion; if ("throw" === rootRecord.type) throw rootRecord.arg; return this.rval; }, dispatchException: function dispatchException(exception) { if (this.done) throw exception; var context = this; function handle(loc, caught) { return record.type = "throw", record.arg = exception, context.next = loc, caught && (context.method = "next", context.arg = undefined), !!caught; } for (var i = this.tryEntries.length - 1; i >= 0; --i) { var entry = this.tryEntries[i], record = entry.completion; if ("root" === entry.tryLoc) return handle("end"); if (entry.tryLoc <= this.prev) { var hasCatch = hasOwn.call(entry, "catchLoc"), hasFinally = hasOwn.call(entry, "finallyLoc"); if (hasCatch && hasFinally) { if (this.prev < entry.catchLoc) return handle(entry.catchLoc, !0); if (this.prev < entry.finallyLoc) return handle(entry.finallyLoc); } else if (hasCatch) { if (this.prev < entry.catchLoc) return handle(entry.catchLoc, !0); } else { if (!hasFinally) throw new Error("try statement without catch or finally"); if (this.prev < entry.finallyLoc) return handle(entry.finallyLoc); } } } }, abrupt: function abrupt(type, arg) { for (var i = this.tryEntries.length - 1; i >= 0; --i) { var entry = this.tryEntries[i]; if (entry.tryLoc <= this.prev && hasOwn.call(entry, "finallyLoc") && this.prev < entry.finallyLoc) { var finallyEntry = entry; break; } } finallyEntry && ("break" === type || "continue" === type) && finallyEntry.tryLoc <= arg && arg <= finallyEntry.finallyLoc && (finallyEntry = null); var record = finallyEntry ? finallyEntry.completion : {}; return record.type = type, record.arg = arg, finallyEntry ? (this.method = "next", this.next = finallyEntry.finallyLoc, ContinueSentinel) : this.complete(record); }, complete: function complete(record, afterLoc) { if ("throw" === record.type) throw record.arg; return "break" === record.type || "continue" === record.type ? this.next = record.arg : "return" === record.type ? (this.rval = this.arg = record.arg, this.method = "return", this.next = "end") : "normal" === record.type && afterLoc && (this.next = afterLoc), ContinueSentinel; }, finish: function finish(finallyLoc) { for (var i = this.tryEntries.length - 1; i >= 0; --i) { var entry = this.tryEntries[i]; if (entry.finallyLoc === finallyLoc) return this.complete(entry.completion, entry.afterLoc), resetTryEntry(entry), ContinueSentinel; } }, "catch": function _catch(tryLoc) { for (var i = this.tryEntries.length - 1; i >= 0; --i) { var entry = this.tryEntries[i]; if (entry.tryLoc === tryLoc) { var record = entry.completion; if ("throw" === record.type) { var thrown = record.arg; resetTryEntry(entry); } return thrown; } } throw new Error("illegal catch attempt"); }, delegateYield: function delegateYield(iterable, resultName, nextLoc) { return this.delegate = { iterator: values(iterable), resultName: resultName, nextLoc: nextLoc }, "next" === this.method && (this.arg = undefined), ContinueSentinel; } }, exports; }
function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }
function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }
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






var PiWebAPIDatasource = /*#__PURE__*/function (_DataSourceApi) {
  _inherits(PiWebAPIDatasource, _DataSourceApi);
  var _super = _createSuper(PiWebAPIDatasource);
  function PiWebAPIDatasource(instanceSettings) {
    var _instanceSettings$jso;
    var _this;
    var templateSrv = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : (0,_grafana_runtime__WEBPACK_IMPORTED_MODULE_3__.getTemplateSrv)();
    var backendSrv = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : (0,_grafana_runtime__WEBPACK_IMPORTED_MODULE_3__.getBackendSrv)();
    _classCallCheck(this, PiWebAPIDatasource);
    _this = _super.call(this, instanceSettings);
    _defineProperty(_assertThisInitialized(_this), "piserver", void 0);
    _defineProperty(_assertThisInitialized(_this), "afserver", void 0);
    _defineProperty(_assertThisInitialized(_this), "afdatabase", void 0);
    _defineProperty(_assertThisInitialized(_this), "piPointConfig", void 0);
    _defineProperty(_assertThisInitialized(_this), "newFormatConfig", void 0);
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
    _this.annotations = {
      QueryEditor: AnnotationsQueryEditor__WEBPACK_IMPORTED_MODULE_5__.PiWebAPIAnnotationsQueryEditor,
      prepareQuery: function prepareQuery(anno) {
        if (anno.target) {
          anno.target.isAnnotation = true;
        }
        return anno.target;
      },
      processEvents: function processEvents(anno, data) {
        return (0,rxjs__WEBPACK_IMPORTED_MODULE_1__.of)(_this.eventFrameToAnnotation(anno, data));
      }
    };
    console.info('OSISoft PI Plugin v4.0.0');
    Promise.all([_this.getDataServer(_this.piserver.name).then(function (result) {
      return _this.piserver.webid = result.WebId;
    }), _this.getAssetServer(_this.afserver.name).then(function (result) {
      return _this.afserver.webid = result.WebId;
    }), _this.getDatabase(_this.afserver.name && _this.afdatabase.name ? _this.afserver.name + '\\' + _this.afdatabase.name : undefined).then(function (result) {
      return _this.afdatabase.webid = result.WebId;
    })]).then(function () {
      return console.info('Datasource configured');
    });
    return _this;
  }

  /**
   * Datasource Implementation. Primary entry point for data source.
   * This takes the panel configuration and queries, sends them to PI Web API and parses the response.
   *
   * @param {any} options - Grafana query and panel options.
   * @returns - Promise of data in the format for Grafana panels.
   *
   * @memberOf PiWebApiDatasource
   */
  _createClass(PiWebAPIDatasource, [{
    key: "query",
    value: function () {
      var _query = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee(options) {
        var ds, query;
        return _regeneratorRuntime().wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                if (!(options.targets.length === 1 && !!options.targets[0].isAnnotation)) {
                  _context.next = 2;
                  break;
                }
                return _context.abrupt("return", this.processAnnotationQuery(options));
              case 2:
                ds = this;
                query = this.buildQueryParameters(options);
                if (!(query.targets.length <= 0)) {
                  _context.next = 8;
                  break;
                }
                return _context.abrupt("return", Promise.resolve({
                  data: []
                }));
              case 8:
                return _context.abrupt("return", Promise.all(ds.getStream(query)).then(function (targetResponses) {
                  var flattened = [];
                  (0,lodash__WEBPACK_IMPORTED_MODULE_0__.each)(targetResponses, function (tr) {
                    (0,lodash__WEBPACK_IMPORTED_MODULE_0__.each)(tr, function (item) {
                      return flattened.push(item);
                    });
                  });
                  flattened = flattened.filter(function (v) {
                    return v.datapoints.length > 0;
                  });
                  // handle no data properly
                  if (flattened.length === 0) {
                    return {
                      data: []
                    };
                  }
                  var response = {
                    data: flattened.sort(function (a, b) {
                      return +(a.target > b.target) || +(a.target === b.target) - 1;
                    }).map(function (d) {
                      return (0,helper__WEBPACK_IMPORTED_MODULE_4__.convertTimeSeriesToDataFrame)(d);
                    })
                  };
                  return response;
                }));
              case 9:
              case "end":
                return _context.stop();
            }
          }
        }, _callee, this);
      }));
      function query(_x) {
        return _query.apply(this, arguments);
      }
      return query;
    }()
    /**
     * Datasource Implementation.
     * Used for testing datasource in datasource configuration pange
     *
     * @returns - Success or failure message.
     *
     * @memberOf PiWebApiDatasource
     */
  }, {
    key: "testDatasource",
    value: function testDatasource() {
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
        }).then(ds.metricQueryTransform) : ds.getAssetServers().then(ds.metricQueryTransform);
      } else if (query.type === 'databases') {
        return ds.getAssetServer(query.path).then(function (server) {
          var _server$WebId;
          return ds.getDatabases((_server$WebId = server.WebId) !== null && _server$WebId !== void 0 ? _server$WebId : '', {});
        }).then(ds.metricQueryTransform);
      } else if (query.type === 'databaseElements') {
        return ds.getDatabase(query.path).then(function (db) {
          var _db$WebId;
          return ds.getDatabaseElements((_db$WebId = db.WebId) !== null && _db$WebId !== void 0 ? _db$WebId : '', {
            selectedFields: 'Items.WebId%3BItems.Name%3BItems.Items%3BItems.Path%3BItems.HasChildren'
          });
        }).then(ds.metricQueryTransform);
      } else if (query.type === 'elements') {
        return ds.getElement(query.path).then(function (element) {
          var _element$WebId;
          return ds.getElements((_element$WebId = element.WebId) !== null && _element$WebId !== void 0 ? _element$WebId : '', {
            selectedFields: 'Items.Description%3BItems.WebId%3BItems.Name%3BItems.Items%3BItems.Path%3BItems.HasChildren',
            nameFilter: query.filter
          });
        }).then(ds.metricQueryTransform);
      } else if (query.type === 'attributes') {
        return ds.getElement(query.path).then(function (element) {
          var _element$WebId2;
          return ds.getAttributes((_element$WebId2 = element.WebId) !== null && _element$WebId2 !== void 0 ? _element$WebId2 : '', {
            searchFullHierarchy: 'true',
            selectedFields: 'Items.Type%3BItems.DefaultUnitsName%3BItems.Description%3BItems.WebId%3BItems.Name%3BItems.Path',
            nameFilter: query.filter
          });
        }).then(ds.metricQueryTransform);
      } else if (query.type === 'dataserver') {
        return ds.getDataServers().then(ds.metricQueryTransform);
      } else if (query.type === 'pipoint') {
        return ds.piPointSearch(query.webId, query.pointName).then(ds.metricQueryTransform);
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
     * Datasource Implementation.
     * This queries PI Web API for Event Frames and converts them into annotations.
     *
     * @param {any} options - Annotation options, usually the Event Frame Category.
     * @returns - A Grafana annotation.
     *
     * @memberOf PiWebApiDatasource
     */
  }, {
    key: "processAnnotationQuery",
    value: function processAnnotationQuery(options) {
      var annotationQuery = options.targets[0];
      var categoryName = annotationQuery.categoryName ? this.templateSrv.replace(annotationQuery.categoryName, options.scopedVars, 'glob') : null;
      var nameFilter = annotationQuery.nameFilter ? this.templateSrv.replace(annotationQuery.nameFilter, options.scopedVars, 'glob') : null;
      var templateName = annotationQuery.template ? annotationQuery.template.Name : null;
      var annotationOptions = {
        datasource: annotationQuery.datasource,
        showEndTime: annotationQuery.showEndTime,
        regex: annotationQuery.regex,
        attribute: annotationQuery.attribute,
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
        return Promise.resolve({
          data: []
        });
      }
      filter.push('startTime=' + options.range.from.toISOString());
      filter.push('endTime=' + options.range.to.toISOString());
      if (annotationOptions.attribute && annotationOptions.attribute.enable) {
        var _annotationQuery$data;
        var resourceUrl = this.piwebapiurl + '/streamsets/{0}/value?selectedFields=Items.WebId%3BItems.Value%3BItems.Name';
        if (!!annotationOptions.attribute.name) {
          resourceUrl = this.piwebapiurl + '/streamsets/{0}/value?nameFilter=' + annotationOptions.attribute.name + '&selectedFields=Items.WebId%3BItems.Value%3BItems.Name';
        }
        var query = {};
        query['1'] = {
          Method: 'GET',
          Resource: this.piwebapiurl + '/assetdatabases/' + ((_annotationQuery$data = annotationQuery.database) === null || _annotationQuery$data === void 0 ? void 0 : _annotationQuery$data.WebId) + '/eventframes?' + filter.join('&')
        };
        query['2'] = {
          Method: 'GET',
          RequestTemplate: {
            Resource: resourceUrl
          },
          Parameters: ['$.1.Content.Items[*].WebId'],
          ParentIds: ['1']
        };
        return this.restBatch(query).then(function (result) {
          var data = result.data['1'].Content;
          var valueData = result.data['2'].Content;
          var response = data.Items.map(function (item, index) {
            var columns = [{
              text: 'StartTime'
            }, {
              text: 'EndTime'
            }];
            var rows = [item.StartTime, item.EndTime];
            valueData.Items[index].Content.Items.forEach(function (it) {
              columns.push({
                text: it.Name
              });
              rows.push(String(it.Value.Value ? it.Value.Value.Name || it.Value.Value.Value || it.Value.Value : ''));
            });
            return {
              name: item.Name,
              columns: columns,
              rows: [rows]
            };
          });
          return {
            data: response.map(function (r) {
              return (0,_grafana_data__WEBPACK_IMPORTED_MODULE_2__.toDataFrame)(r);
            })
          };
        });
      } else {
        var _annotationQuery$data2;
        return this.restGet('/assetdatabases/' + ((_annotationQuery$data2 = annotationQuery.database) === null || _annotationQuery$data2 === void 0 ? void 0 : _annotationQuery$data2.WebId) + '/eventframes?' + filter.join('&')).then(function (result) {
          var response = result.data.Items.map(function (item) {
            return {
              name: item.Name,
              columns: [{
                text: 'StartTime'
              }, {
                text: 'EndTime'
              }],
              rows: [[item.StartTime, item.EndTime]]
            };
          });
          return {
            data: response.map(function (r) {
              return (0,_grafana_data__WEBPACK_IMPORTED_MODULE_2__.toDataFrame)(r);
            })
          };
        });
      }
    }

    /**
     * Converts a PIWebAPI Event Frame response to a Grafana Annotation
     *
     * @param {any} annon - The annotation object.
     * @param {any} data - The dataframe recrords. 
     * @returns - Grafana Annotation
     *
     * @memberOf PiWebApiDatasource
     */
  }, {
    key: "eventFrameToAnnotation",
    value: function eventFrameToAnnotation(annon, data) {
      var annotationOptions = annon.target;
      var events = [];
      data.forEach(function (d) {
        var _d$fields$find, _d$fields$find2, _annotationOptions$da;
        var attributeText = '';
        var endTime = (_d$fields$find = d.fields.find(function (f) {
          return f.name === 'EndTime';
        })) === null || _d$fields$find === void 0 ? void 0 : _d$fields$find.values.get(0);
        var startTime = (_d$fields$find2 = d.fields.find(function (f) {
          return f.name === 'StartTime';
        })) === null || _d$fields$find2 === void 0 ? void 0 : _d$fields$find2.values.get(0);
        var attributeDataItems = d.fields.filter(function (f) {
          return ['StartTime', 'EndTime'].indexOf(f.name) < 0;
        });
        if (attributeDataItems) {
          (0,lodash__WEBPACK_IMPORTED_MODULE_0__.each)(attributeDataItems, function (attributeData) {
            attributeText += '<br />' + attributeData.name + ': ' + attributeData.values.get(0);
          });
        }
        var name = d.name;
        if (annotationOptions.regex && annotationOptions.regex.enable) {
          name = name.replace(new RegExp(annotationOptions.regex.search), annotationOptions.regex.replace);
        }
        events.push({
          id: (_annotationOptions$da = annotationOptions.database) === null || _annotationOptions$da === void 0 ? void 0 : _annotationOptions$da.WebId,
          annotation: annon,
          title: "Name: ".concat(annon.name),
          time: new Date(startTime).getTime(),
          timeEnd: !!annotationOptions.showEndTime ? new Date(endTime).getTime() : undefined,
          text: "Tag: ".concat(name) + attributeText + '<br />Start: ' + new Date(startTime).toLocaleString('pt-BR') + '<br />End: ' + new Date(endTime).toLocaleString('pt-BR'),
          tags: ['OSISoft PI']
        });
      });
      return events;
    }

    /**
     * Builds the PIWebAPI query parameters.
     *
     * @param {any} options - Grafana query and panel options.
     * @returns - PIWebAPI query parameters.
     *
     * @memberOf PiWebApiDatasource
     */
  }, {
    key: "buildQueryParameters",
    value: function buildQueryParameters(options) {
      var _this2 = this;
      options.targets = (0,lodash__WEBPACK_IMPORTED_MODULE_0__.filter)(options.targets, function (target) {
        if (!target || !target.target || !!target.hide) {
          return false;
        }
        return !target.target.startsWith('Select AF');
      });
      options.targets = (0,lodash__WEBPACK_IMPORTED_MODULE_0__.map)(options.targets, function (target) {
        var _target$webid;
        if (!!target.rawQuery && !!target.target) {
          var _parseRawQuery = (0,helper__WEBPACK_IMPORTED_MODULE_4__.parseRawQuery)(_this2.templateSrv.replace(target.target, options.scopedVars)),
            attributes = _parseRawQuery.attributes,
            elementPath = _parseRawQuery.elementPath;
          target.attributes = attributes;
          target.elementPath = elementPath;
        }
        var ds = _this2;
        var tar = {
          target: _this2.templateSrv.replace(target.elementPath, options.scopedVars),
          elementPath: _this2.templateSrv.replace(target.elementPath, options.scopedVars),
          elementPathArray: [{
            path: _this2.templateSrv.replace(target.elementPath, options.scopedVars),
            variable: ''
          }],
          attributes: (0,lodash__WEBPACK_IMPORTED_MODULE_0__.map)(target.attributes, function (att) {
            var _att$value;
            return _this2.templateSrv.replace(((_att$value = att.value) === null || _att$value === void 0 ? void 0 : _att$value.value) || att, options.scopedVars);
          }),
          isAnnotation: !!target.isAnnotation,
          segments: (0,lodash__WEBPACK_IMPORTED_MODULE_0__.map)(target.segments, function (att) {
            var _att$value2;
            return _this2.templateSrv.replace((_att$value2 = att.value) === null || _att$value2 === void 0 ? void 0 : _att$value2.value, options.scopedVars);
          }),
          display: target.display,
          refId: target.refId,
          hide: target.hide,
          interpolate: target.interpolate || {
            enable: false
          },
          useLastValue: target.useLastValue || {
            enable: false
          },
          recordedValues: target.recordedValues || {
            enable: false
          },
          digitalStates: target.digitalStates || {
            enable: false
          },
          webid: (_target$webid = target.webid) !== null && _target$webid !== void 0 ? _target$webid : '',
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
          isPiPoint: !!target.isPiPoint,
          scopedVars: options.scopedVars
        };
        if (tar.expression) {
          tar.expression = _this2.templateSrv.replace(tar.expression, options.scopedVars);
        }
        if (tar.summary.types !== undefined) {
          tar.summary.types = (0,lodash__WEBPACK_IMPORTED_MODULE_0__.filter)(tar.summary.types, function (item) {
            return item !== undefined && item !== null && item !== '';
          });
        }

        // explode All or Multi-selection
        var varsKeys = (0,lodash__WEBPACK_IMPORTED_MODULE_0__.keys)(options.scopedVars);
        _this2.templateSrv.getVariables().forEach(function (v) {
          if (ds.isAllSelected(v.current) && varsKeys.indexOf(v.name) < 0) {
            // All selection
            var variables = v.options.filter(function (o) {
              return !o.selected;
            });
            // attributes
            tar.attributes = tar.attributes.map(function (attr) {
              return variables.map(function (vv) {
                return !!v.allValue ? attr.replace(v.allValue, vv.value) : attr.replace(/{[a-zA-z0-9,-_]+}/gi, vv.value);
              });
            });
            tar.attributes = (0,lodash__WEBPACK_IMPORTED_MODULE_0__.uniq)((0,lodash__WEBPACK_IMPORTED_MODULE_0__.flatten)(tar.attributes));
            // elementPath
            tar.elementPathArray = ds.getElementPath(tar.elementPathArray, variables, v.allValue);
          } else if (Array.isArray(v.current.text) && varsKeys.indexOf(v.name) < 0) {
            // Multi-selection
            var _variables = v.options.filter(function (o) {
              return o.selected;
            });
            // attributes
            var query = v.current.value.join(',');
            tar.attributes = tar.attributes.map(function (attr) {
              return _variables.map(function (vv) {
                return attr.replace("{".concat(query, "}"), vv.value);
              });
            });
            tar.attributes = (0,lodash__WEBPACK_IMPORTED_MODULE_0__.uniq)((0,lodash__WEBPACK_IMPORTED_MODULE_0__.flatten)(tar.attributes));
            // elementPath
            tar.elementPathArray = ds.getElementPath(tar.elementPathArray, _variables, "{".concat(query, "}"));
          }
        });
        return tar;
      });
      return options;
    }

    /**
     * Builds the Grafana metric segment for use on the query user interface.
     *
     * @param {any} response - response from PI Web API.
     * @returns - Grafana metric segment.
     *
     * @memberOf PiWebApiDatasource
     */
  }, {
    key: "metricQueryTransform",
    value: function metricQueryTransform(response) {
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
     * Resolve PIWebAPI response 'value' data to value - timestamp pairs.
     *
     * @param {any} value - A list of PIWebAPI values.
     * @param {any} target - The target Grafana metric.
     * @param {boolean} isSummary - Boolean for tracking if data is of summary class.
     * @returns - An array of Grafana value, timestamp pairs.
     *
     */
  }, {
    key: "parsePiPointValueData",
    value: function parsePiPointValueData(value, target, isSummary) {
      var _this3 = this;
      var datapoints = [];
      if (Array.isArray(value)) {
        (0,lodash__WEBPACK_IMPORTED_MODULE_0__.each)(value, function (item) {
          _this3.piPointValue(isSummary ? item.Value : item, target, isSummary, datapoints);
        });
      } else {
        this.piPointValue(value, target, isSummary, datapoints);
      }
      return datapoints;
    }

    /**
     * Resolve PIWebAPI response 'value' data to value - timestamp pairs.
     *
     * @param {any} value - PI Point value.
     * @param {any} target - The target grafana metric.
     * @param {boolean} isSummary - Boolean for tracking if data is of summary class.
     * @param {any[]} datapoints - Array with Grafana datapoints.
     *
     */
  }, {
    key: "piPointValue",
    value: function piPointValue(value, target, isSummary, datapoints) {
      // @ts-ignore
      var _noDataReplace = (0,helper__WEBPACK_IMPORTED_MODULE_4__.noDataReplace)(value, target.summary.nodata, this.parsePiPointValue(value, target, isSummary)),
        grafanaDataPoint = _noDataReplace.grafanaDataPoint,
        previousValue = _noDataReplace.previousValue,
        drop = _noDataReplace.drop;
      if (!drop) {
        datapoints.push(grafanaDataPoint);
      }
    }

    /**
     * Convert a PI Point value to use Grafana value/timestamp.
     *
     * @param {any} value - PI Point value.
     * @param {any} target - The target grafana metric.
     * @param {boolean} isSummary - Boolean for tracking if data is of summary class.
     * @returns - Grafana value pair.
     *
     */
  }, {
    key: "parsePiPointValue",
    value: function parsePiPointValue(value, target, isSummary) {
      var _value$Value, _target$digitalStates;
      var num = !isSummary && _typeof(value.Value) === 'object' ? (_value$Value = value.Value) === null || _value$Value === void 0 ? void 0 : _value$Value.Value : value.Value;
      if (!value.Good || !!((_target$digitalStates = target.digitalStates) !== null && _target$digitalStates !== void 0 && _target$digitalStates.enable)) {
        var _ref, _value$Value2;
        num = (_ref = !isSummary && _typeof(value.Value) === 'object' ? (_value$Value2 = value.Value) === null || _value$Value2 === void 0 ? void 0 : _value$Value2.Name : value.Name) !== null && _ref !== void 0 ? _ref : '';
        return [(0,helper__WEBPACK_IMPORTED_MODULE_4__.checkNumber)(num) ? Number(num) : num.trim(), new Date(value.Timestamp).getTime()];
      }
      return [(0,helper__WEBPACK_IMPORTED_MODULE_4__.checkNumber)(num) ? Number(num) : num.trim(), new Date(value.Timestamp).getTime()];
    }

    /**
     * Convert the Pi web api response object to the Grafana Labels object.
     *
     * @param {PiwebapiRsp} webid - Pi web api response object.
     * @returns The converted Labels object.
     */
  }, {
    key: "toTags",
    value: function toTags(webid, isPiPoint) {
      var _webid$Path;
      var omitArray = ['Path', 'WebId', 'Id', 'ServerTime', 'ServerVersion'];
      var obj = (0,lodash__WEBPACK_IMPORTED_MODULE_0__.omitBy)(webid, function (value, key) {
        return !value || !value.length || omitArray.indexOf(key) >= 0;
      });
      obj.Element = isPiPoint ? this.piserver.name : (0,helper__WEBPACK_IMPORTED_MODULE_4__.getLastPath)((_webid$Path = webid.Path) !== null && _webid$Path !== void 0 ? _webid$Path : '');
      var sorted = Object.keys(obj).sort().reduce(function (accumulator, key) {
        accumulator[(0,helper__WEBPACK_IMPORTED_MODULE_4__.lowerCaseFirstLetter)(key)] = obj[key];
        return accumulator;
      }, {});
      return sorted;
    }

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
  }, {
    key: "processResults",
    value: function processResults(content, target, name, noTemplate, webid) {
      var _this4 = this;
      var api = this;
      var isSummary = target.summary && target.summary.types && target.summary.types.length > 0;
      if (!target.isPiPoint && !target.display) {
        if (this.newFormatConfig) {
          name = (noTemplate ? (0,helper__WEBPACK_IMPORTED_MODULE_4__.getLastPath)(content.Path) : (0,helper__WEBPACK_IMPORTED_MODULE_4__.getPath)(target.elementPathArray, content.Path)) + '|' + name;
        } else {
          name = noTemplate ? name : (0,helper__WEBPACK_IMPORTED_MODULE_4__.getPath)(target.elementPathArray, content.Path) + '|' + name;
        }
      }
      if (target.regex && target.regex.enable && target.regex.search.length && target.regex.replace.length) {
        name = name.replace(new RegExp(target.regex.search), target.regex.replace);
      }
      if (isSummary) {
        var innerResults = [];
        var groups = (0,lodash__WEBPACK_IMPORTED_MODULE_0__.groupBy)(content.Items, function (item) {
          return item.Type;
        });
        (0,lodash__WEBPACK_IMPORTED_MODULE_0__.forOwn)(groups, function (value, key) {
          innerResults.push({
            refId: target.refId,
            target: name + '[' + key + ']',
            meta: {
              path: webid.Path,
              pathSeparator: '\\'
            },
            tags: _this4.newFormatConfig ? api.toTags(webid, target.isPiPoint) : {},
            datapoints: api.parsePiPointValueData(value, target, isSummary),
            path: webid.Path,
            unit: webid.DefaultUnitsName
          });
        });
        return innerResults;
      }
      var results = [{
        refId: target.refId,
        target: name,
        meta: {
          path: webid.Path,
          pathSeparator: '\\'
        },
        tags: this.newFormatConfig ? api.toTags(webid, target.isPiPoint) : {},
        datapoints: api.parsePiPointValueData(content.Items || content.Value, target, isSummary),
        path: webid.Path,
        unit: webid.DefaultUnitsName
      }];
      return results;
    }

    /**
     * Check if all items are selected.
     *
     * @param {any} current the current variable selection
     * @return {boolean} true if all value is selected, false otherwise
     */
  }, {
    key: "isAllSelected",
    value: function isAllSelected(current) {
      if (!current) {
        return false;
      }
      if (Array.isArray(current.text)) {
        return current.text.indexOf('All') >= 0;
      }
      return current.text === 'All';
    }

    /**
     * Returns a new element path list based on the panel variables.
     *
     * @param {string} elementPathArray array of element paths
     * @param {string} variables the list of variable values
     * @param {string} allValue the all value value for the variable
     * @returns {PiwebapiElementPath[]} new element path list
     */
  }, {
    key: "getElementPath",
    value: function getElementPath(elementPathArray, variables, allValue) {
      // elementPath
      var newElementPathArray = [];
      elementPathArray.forEach(function (elem) {
        if (!!allValue && elem.path.indexOf(allValue) >= 0 || !allValue && elem.path.match(/{[a-zA-z0-9,-_]+}/gi)) {
          var temp = variables.map(function (vv) {
            return {
              path: !!allValue ? elem.path.replace(allValue, vv.value) : elem.path.replace(/{[a-zA-z0-9,-_]+}/gi, vv.value),
              variable: vv.value
            };
          });
          newElementPathArray = newElementPathArray.concat(temp);
        }
      });
      if (newElementPathArray.length) {
        return (0,lodash__WEBPACK_IMPORTED_MODULE_0__.uniq)((0,lodash__WEBPACK_IMPORTED_MODULE_0__.flatten)(newElementPathArray));
      }
      return elementPathArray;
    }

    /**
     * Gets historical data from a PI Web API stream source.
     *
     * @param {any} query - Grafana query.
     * @returns - Metric data.
     *
     * @memberOf PiWebApiDatasource
     */
  }, {
    key: "getStream",
    value: function getStream(query) {
      var _this5 = this;
      var ds = this;
      var results = [];
      (0,lodash__WEBPACK_IMPORTED_MODULE_0__.each)(query.targets, function (target) {
        // pi point config disabled
        if (target.isPiPoint && !ds.piPointConfig) {
          console.error('Trying to call Pi Point server with Pi Point config disabled');
          return;
        }
        target.attributes = (0,lodash__WEBPACK_IMPORTED_MODULE_0__.filter)(target.attributes || [], function (attribute) {
          return  true && attribute;
        });
        var url = '';
        var isSummary = target.summary && target.summary.types && target.summary.types.length > 0;
        var isInterpolated = target.interpolate && target.interpolate.enable;
        // perhaps add a check to see if interpolate override time < query.interval
        var intervalTime = target.interpolate.interval ? target.interpolate.interval : query.interval;
        var timeRange = '?startTime=' + query.range.from.toJSON() + '&endTime=' + query.range.to.toJSON();
        var targetName = target.expression || target.elementPath;
        var displayName = target.display ? _this5.templateSrv.replace(target.display, query.scopedVars) : null;
        if (target.expression) {
          url += '/calculation';
          if (isSummary) {
            url += '/summary' + timeRange + (isInterpolated ? '&sampleType=Interval&sampleInterval=' + intervalTime : '');
          } else if (isInterpolated) {
            url += '/intervals' + timeRange + '&sampleInterval=' + intervalTime;
          } else {
            url += '/recorded' + timeRange;
          }
          url += '&expression=' + encodeURIComponent(target.expression.replace(/\${intervalTime}/g, intervalTime));
          if (target.attributes.length > 0) {
            results.push(ds.createBatchGetWebId(target, url, displayName));
          } else {
            results.push(ds.restGetWebId(target.elementPath, false).then(function (webidresponse) {
              return ds.restPost(url + webidresponse.WebId).then(function (response) {
                return ds.processResults(response.data, target, displayName || targetName, false, webidresponse);
              })["catch"](function (err) {
                return ds.error = err;
              });
            }));
          }
        } else {
          var _target$useLastValue;
          url += '/streamsets';
          if (isSummary) {
            url += '/summary' + timeRange + '&intervals=' + query.maxDataPoints + _this5.getSummaryUrl(target.summary);
          } else if (isInterpolated) {
            url += '/interpolated' + timeRange + '&interval=' + intervalTime;
          } else if (target.recordedValues && target.recordedValues.enable) {
            var maxNumber = target.recordedValues.maxNumber && !isNaN(target.recordedValues.maxNumber) ? target.recordedValues.maxNumber : query.maxDataPoints;
            url += '/recorded' + timeRange + '&maxCount=' + maxNumber;
          } else if ((_target$useLastValue = target.useLastValue) !== null && _target$useLastValue !== void 0 && _target$useLastValue.enable) {
            url += '/value?time=' + query.range.to.toJSON();
          } else {
            url += '/plot' + timeRange + '&intervals=' + query.maxDataPoints;
          }
          results.push(ds.createBatchGetWebId(target, url, displayName));
        }
      });
      return results;
    }

    /**
     * Process batch response to metric data.
     *
     * @param {any} response - The batch response.
     * @param {any} target - Grafana query target.
     * @param {string} displayName - The display name.
     * @returns - Process metric data.
     */
  }, {
    key: "handleBatchResponse",
    value: function handleBatchResponse(response, target, displayName) {
      var _this6 = this;
      var targetName = target.expression || target.elementPath;
      var noTemplate = target.elementPathArray.length === 1 && target.elementPath === target.elementPathArray[0].path;
      var index = 1;
      var targetResults = [];
      var _iterator = _createForOfIteratorHelper(target.attributes),
        _step;
      try {
        var _loop = function _loop() {
          var _ = _step.value;
          var dataKey = "Req".concat(index + 1000);
          var path = response.config.data[dataKey].Headers ? response.config.data[dataKey].Headers['Asset-Path'] : null;
          var data = response.data[dataKey];
          if (data.Status >= 400) {
            return "continue";
          }
          var webid = void 0;
          if (!!path) {
            webid = _this6.webidCache.get(path);
          } else {
            var respData = response.data["Req".concat(index)].Content;
            webid = {
              Path: respData.Path,
              Type: respData.Type || respData.PointType,
              DefaultUnitsName: respData.DefaultUnitsName || respData.EngineeringUnits,
              Description: respData.Description || respData.Descriptor,
              WebId: respData.WebId,
              Name: respData.Name
            };
            _this6.webidCache.set(webid.Path, webid);
          }
          if (target.expression) {
            (0,lodash__WEBPACK_IMPORTED_MODULE_0__.each)(_this6.processResults(data.Content, target, displayName || webid.Name || targetName, noTemplate, webid), function (targetResult) {
              return targetResults.push(targetResult);
            });
          } else {
            (0,lodash__WEBPACK_IMPORTED_MODULE_0__.each)(data.Content.Items, function (item) {
              (0,lodash__WEBPACK_IMPORTED_MODULE_0__.each)(_this6.processResults(item, target, displayName || item.Name || targetName, noTemplate, webid), function (targetResult) {
                return targetResults.push(targetResult);
              });
            });
          }
          index++;
        };
        for (_iterator.s(); !(_step = _iterator.n()).done;) {
          var _ret = _loop();
          if (_ret === "continue") continue;
        }
      } catch (err) {
        _iterator.e(err);
      } finally {
        _iterator.f();
      }
      return Promise.resolve(targetResults);
    }

    /**
     * Creates a batch query pair.
     *
     * @param {boolean} isPiPoint - is Pi point flag.
     * @param {string} elementPath - the PI element path or PI Data server name.
     * @param {string} attribute - the attribute or PI point name.
     * @param {any} query - the batch query to build.
     * @param {number} index - the current query index.
     * @param {boolean} replace - is pi point and calculation.
     * @param {string} url - the base url to call. 
     */
  }, {
    key: "createQueryPair",
    value: function createQueryPair(isPiPoint, elementPath, attribute, query, index, replace, url) {
      var path = '';
      var assetPath = '';
      if (isPiPoint) {
        assetPath = '\\\\' + elementPath + '\\' + attribute;
        path = '/points?selectedFields=Descriptor%3BPointType%3BEngineeringUnits%3BWebId%3BName%3BPath&path=' + assetPath;
      } else {
        assetPath = '\\\\' + elementPath + '|' + attribute;
        path = '/attributes?selectedFields=Type%3BDefaultUnitsName%3BDescription%3BWebId%3BName%3BPath&path=' + assetPath;
      }
      var data = this.webidCache.get(assetPath);
      if (!!data) {
        query["Req".concat(index + 1000)] = {
          Method: 'GET',
          Resource: this.piwebapiurl + (0,helper__WEBPACK_IMPORTED_MODULE_4__.getFinalUrl)(replace, {
            Name: attribute
          }, url) + '&webId=' + (replace ? this.piserver.webid : data.WebId),
          Headers: {
            'Asset-Path': assetPath
          }
        };
      } else {
        query["Req".concat(index)] = {
          Method: 'GET',
          Resource: this.piwebapiurl + path
        };
        query["Req".concat(index + 1000)] = {
          Method: 'GET',
          ParentIds: ["Req".concat(index)],
          Parameters: ["$.Req".concat(index, ".Content.WebId")],
          Resource: this.piwebapiurl + (0,helper__WEBPACK_IMPORTED_MODULE_4__.getFinalUrl)(replace, {
            Name: attribute
          }, url) + (replace ? '&webId=' + this.piserver.webid : '&webId={0}')
        };
      }
    }

    /**
     * Get metric data using Batch.
     *
     * @param {any} target - Grafana query target.
     * @param {string} url The base URL for the query.
     * @param {string} displayName - The display name.
     * @returns - Metric data.
     */
  }, {
    key: "createBatchGetWebId",
    value: function createBatchGetWebId(target, url, displayName) {
      var _this7 = this;
      var noTemplate = target.elementPathArray.length === 1 && target.elementPath === target.elementPathArray[0].path;
      var replace = target.isPiPoint && !!target.expression;
      var query = {};
      var index = 1;
      var _iterator2 = _createForOfIteratorHelper(target.attributes),
        _step2;
      try {
        var _loop2 = function _loop2() {
          var attribute = _step2.value;
          if (noTemplate) {
            _this7.createQueryPair(target.isPiPoint, target.elementPath, attribute, query, index, replace, url);
            index++;
          } else {
            target.elementPathArray.forEach(function (elementPath) {
              _this7.createQueryPair(target.isPiPoint, elementPath.path, attribute, query, index, replace, url);
              index++;
            });
          }
        };
        for (_iterator2.s(); !(_step2 = _iterator2.n()).done;) {
          _loop2();
        }
      } catch (err) {
        _iterator2.e(err);
      } finally {
        _iterator2.f();
      }
      return this.restBatch(query).then(function (response) {
        return _this7.handleBatchResponse(response, target, displayName);
      });
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

    /**
     * Resolve a Grafana query into a PI Web API webid. Uses client side cache when possible to reduce lookups.
     *
     * @param {string} assetPath - The AF Path or the Pi Point Path (\\ServerName\piPointName) to the asset.
     * @param {boolean} isPiPoint - Flag indicating it's a PI Point
     * @returns - URL query parameters.
     *
     * @memberOf PiWebApiDatasource
     */
  }, {
    key: "restGetWebId",
    value: function restGetWebId(assetPath, isPiPoint) {
      var ds = this;

      // check cache
      var cachedWebId = ds.webidCache.get(assetPath);
      if (cachedWebId) {
        return Promise.resolve(_extends({}, cachedWebId));
      }

      // no cache hit, query server
      var path = '';
      if (isPiPoint) {
        path = '/points?selectedFields=Descriptor%3BPointType%3BEngineeringUnits%3BWebId%3BName%3BPath&path=\\\\' + assetPath.replace('|', '\\');
      } else {
        path = (assetPath.indexOf('|') >= 0 ? '/attributes?selectedFields=Type%3BDefaultUnitsName%3BDescription%3BWebId%3BName%3BPath&path=\\\\' : '/elements?selectedFields=Description%3BWebId%3BName%3BPath&path=\\\\') + assetPath;
      }
      return this.backendSrv.datasourceRequest({
        url: this.url + path,
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      }).then(function (response) {
        var data = {
          Path: assetPath,
          Type: response.data.Type || response.data.PointType,
          DefaultUnitsName: response.data.DefaultUnitsName || response.data.EngineeringUnits,
          Description: response.data.Description || response.data.Descriptor,
          WebId: response.data.WebId,
          Name: response.data.Name
        };
        ds.webidCache.set(assetPath, data);
        return _extends({}, data);
      });
    }

    /**
     * Execute a batch query on the PI Web API.
     *
     * @param {any} batch - Batch JSON query data.
     * @returns - Batch response.
     *
     * @memberOf PiWebApiDatasource
     */
  }, {
    key: "restBatch",
    value: function restBatch(batch) {
      return this.backendSrv.datasourceRequest({
        url: this.url + '/batch',
        data: batch,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'message/http'
        }
      });
    }

    /**
     * Execute a POST on the PI Web API.
     *
     * @param {string} path - The full url of the POST.
     * @returns - POST response data.
     *
     * @memberOf PiWebApiDatasource
     */
  }, {
    key: "restPost",
    value: function restPost(path) {
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

    /**
     * Get the PI Web API webid or PI Point.
     *
     * @param {any} target - AF Path or Point name.
     * @returns - webid.
     *
     * @memberOf PiWebApiDatasource
     */
  }, {
    key: "getWebId",
    value: function getWebId(target) {
      var ds = this;
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
        return ds.piPointSearch(this.piserver.webid, target.target).then(function (results) {
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
        return ds.restGet('/attributes?path=\\\\' + target.target).then(function (results) {
          if (results.data === undefined || results.status !== 200) {
            return [{
              WebId: target.target,
              Name: target.display || target.target
            }];
          }
          // rewrite name if specified
          results.data.Name = target.display || results.data.Name;
          return [results.data];
        });
      } else {
        // af element lookup
        return ds.restGet('/elements?path=\\\\' + target.target).then(function (results) {
          if (results.data === undefined || results.status !== 200) {
            return [{
              WebId: target.target,
              Name: target.display || target.target
            }];
          }
          // rewrite name if specified
          results.data.Name = target.display || results.data.Name;
          return [results.data];
        });
      }
    }
  }]);
  return PiWebAPIDatasource;
}(_grafana_data__WEBPACK_IMPORTED_MODULE_2__.DataSourceApi);

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
/* harmony export */   "getFinalUrl": () => (/* binding */ getFinalUrl),
/* harmony export */   "getLastPath": () => (/* binding */ getLastPath),
/* harmony export */   "getPath": () => (/* binding */ getPath),
/* harmony export */   "lowerCaseFirstLetter": () => (/* binding */ lowerCaseFirstLetter),
/* harmony export */   "noDataReplace": () => (/* binding */ noDataReplace),
/* harmony export */   "parseRawQuery": () => (/* binding */ parseRawQuery)
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
  var splitStr = getLastPath(path);
  if (elementPathArray.length === 0) {
    return '';
  }
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
/* harmony import */ var _ConfigEditor__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./ConfigEditor */ "./ConfigEditor.tsx");
/* harmony import */ var _QueryEditor__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./QueryEditor */ "./QueryEditor.tsx");
/* harmony import */ var _datasource__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./datasource */ "./datasource.ts");




var plugin = new _grafana_data__WEBPACK_IMPORTED_MODULE_0__.DataSourcePlugin(_datasource__WEBPACK_IMPORTED_MODULE_3__.PiWebAPIDatasource).setQueryEditor(_QueryEditor__WEBPACK_IMPORTED_MODULE_2__.PIWebAPIQueryEditor).setConfigEditor(_ConfigEditor__WEBPACK_IMPORTED_MODULE_1__.PIWebAPIConfigEditor);
})();

/******/ 	return __webpack_exports__;
/******/ })()
;
});;
//# sourceMappingURL=module.js.map
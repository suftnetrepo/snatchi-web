"use strict";
(() => {
var exports = {};
exports.id = 456;
exports.ids = [456];
exports.modules = {

/***/ 9019:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ ping)
/* harmony export */ });
function ping(_, res) {
    res.status(200).json(new Date());
}


/***/ })

};
;

// load runtime
var __webpack_require__ = require("../../webpack-api-runtime.js");
__webpack_require__.C(exports);
var __webpack_exec__ = (moduleId) => (__webpack_require__(__webpack_require__.s = moduleId))
var __webpack_exports__ = (__webpack_exec__(9019));
module.exports = __webpack_exports__;

})();
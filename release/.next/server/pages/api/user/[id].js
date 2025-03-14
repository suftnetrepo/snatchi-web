"use strict";
(() => {
var exports = {};
exports.id = 438;
exports.ids = [438];
exports.modules = {

/***/ 9344:
/***/ ((module) => {

module.exports = require("jsonwebtoken");

/***/ }),

/***/ 1185:
/***/ ((module) => {

module.exports = require("mongoose");

/***/ }),

/***/ 8930:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "Z": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var jsonwebtoken__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(9344);
/* harmony import */ var jsonwebtoken__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(jsonwebtoken__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _model_user__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(6854);


const auth = async (req, res)=>{
    const token = req.headers.authorization;
    if (!token) return res.status(400).json({
        err: "Invalid Authentication."
    });
    const decoded = jsonwebtoken__WEBPACK_IMPORTED_MODULE_0___default().verify(token, "KDJHF7823RHIU3289FJ9321456777I2G8FG239");
    if (!decoded) return res.status(400).json({
        err: "Invalid Authentication."
    });
    const user = await _model_user__WEBPACK_IMPORTED_MODULE_1__/* ["default"].findOne */ .Z.findOne({
        _id: decoded.id
    });
    return {
        id: user._id,
        role: user.role,
        root: user.root
    };
};
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (auth);


/***/ }),

/***/ 2761:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _utils_connectDb__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(4035);
/* harmony import */ var _model_user__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(6854);
/* harmony import */ var _middleware_auth__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(8930);



(0,_utils_connectDb__WEBPACK_IMPORTED_MODULE_0__/* .mongoConnect */ .y)();
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (async (req, res)=>{
    switch(req.method){
        case "PATCH":
            await updateRole(req, res);
            break;
        case "DELETE":
            await deleteUser(req, res);
            break;
    }
});
const updateRole = async (req, res)=>{
    try {
        const result = await (0,_middleware_auth__WEBPACK_IMPORTED_MODULE_2__/* ["default"] */ .Z)(req, res);
        if (result.role !== "admin" || !result.root) return res.status(400).json({
            err: "Authentication is not valid"
        });
        const { id  } = req.query;
        const { role  } = req.body;
        await _model_user__WEBPACK_IMPORTED_MODULE_1__/* ["default"].findOneAndUpdate */ .Z.findOneAndUpdate({
            _id: id
        }, {
            role
        });
        res.json({
            msg: "Update Success!"
        });
    } catch (err) {
        return res.status(500).json({
            err: "Sorry. Please Login Again or Contact Us!"
        });
    }
};
const deleteUser = async (req, res)=>{
    try {
        const result = await (0,_middleware_auth__WEBPACK_IMPORTED_MODULE_2__/* ["default"] */ .Z)(req, res);
        if (result.role !== "admin" || !result.root) return res.status(400).json({
            err: "Authentication is not valid"
        });
        const { id  } = req.query;
        await _model_user__WEBPACK_IMPORTED_MODULE_1__/* ["default"].findByIdAndDelete */ .Z.findByIdAndDelete(id);
        res.json({
            msg: "Deleted Success!"
        });
    } catch (err) {
        return res.status(500).json({
            err: "Sorry. Please Login Again or Contact Us!"
        });
    }
};


/***/ })

};
;

// load runtime
var __webpack_require__ = require("../../../webpack-api-runtime.js");
__webpack_require__.C(exports);
var __webpack_exec__ = (moduleId) => (__webpack_require__(__webpack_require__.s = moduleId))
var __webpack_exports__ = __webpack_require__.X(0, [395], () => (__webpack_exec__(2761)));
module.exports = __webpack_exports__;

})();
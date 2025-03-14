"use strict";
(() => {
var exports = {};
exports.id = 7;
exports.ids = [7];
exports.modules = {

/***/ 7096:
/***/ ((module) => {

module.exports = require("bcrypt");

/***/ }),

/***/ 9344:
/***/ ((module) => {

module.exports = require("jsonwebtoken");

/***/ }),

/***/ 1185:
/***/ ((module) => {

module.exports = require("mongoose");

/***/ }),

/***/ 8567:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _utils_connectDb__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(4035);
/* harmony import */ var _model_user__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(6854);
/* harmony import */ var _utils_errors__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(8126);
/* harmony import */ var bcrypt__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(7096);
/* harmony import */ var bcrypt__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(bcrypt__WEBPACK_IMPORTED_MODULE_3__);
/* harmony import */ var _utils_generateToken__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(9455);





(0,_utils_connectDb__WEBPACK_IMPORTED_MODULE_0__/* .mongoConnect */ .y)();
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (async (req, res)=>{
    if (req.method === "POST") {
        return await register(req, res);
    }
    res.status(405).json({
        err: "Method not allowed"
    });
});
const register = async (req, res)=>{
    try {
        const emailAddress = req.body.email.toLowerCase();
        const isUser = await _model_user__WEBPACK_IMPORTED_MODULE_1__/* ["default"].findOne */ .Z.findOne({
            email: emailAddress
        });
        if (isUser) {
            return res.status(401).json({
                error: "Sorry, the email address you entered is already in use. Please choose a different email address. "
            });
        }
        const body = {
            ...req.body,
            password: await bcrypt__WEBPACK_IMPORTED_MODULE_3___default().hash(req.body.password, 12)
        };
        const user = new _model_user__WEBPACK_IMPORTED_MODULE_1__/* ["default"] */ .Z(body);
        const newUser = await user.save();
        const accessToken = (0,_utils_generateToken__WEBPACK_IMPORTED_MODULE_4__/* .getAccessToken */ .h)({
            id: newUser._id
        });
        const refreshToken = (0,_utils_generateToken__WEBPACK_IMPORTED_MODULE_4__/* .getRefreshToken */ .Y)({
            id: newUser._id
        });
        const payload = {
            msg: "Register Success!",
            accessToken,
            refreshToken,
            user: {
                first_name: newUser.first_name,
                last_name: newUser.last_name,
                mobile: newUser.mobile,
                email: newUser.email,
                role: newUser.role,
                secure_url: newUser.secure_url,
                public_id: newUser.public_id
            }
        };
        res.status(200).json(payload);
    } catch (err) {
        return res.status(500).json({
            error: (0,_utils_errors__WEBPACK_IMPORTED_MODULE_2__/* .errorHandler */ .P)(err)
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
var __webpack_exports__ = __webpack_require__.X(0, [395,993], () => (__webpack_exec__(8567)));
module.exports = __webpack_exports__;

})();
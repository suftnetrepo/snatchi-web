"use strict";
(() => {
var exports = {};
exports.id = 210;
exports.ids = [210];
exports.modules = {

/***/ 9344:
/***/ ((module) => {

module.exports = require("jsonwebtoken");

/***/ }),

/***/ 1185:
/***/ ((module) => {

module.exports = require("mongoose");

/***/ }),

/***/ 857:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var jsonwebtoken__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(9344);
/* harmony import */ var jsonwebtoken__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(jsonwebtoken__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _utils_connectDb__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(4035);
/* harmony import */ var _model_user__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(6854);
/* harmony import */ var _utils_errors__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(8126);
/* harmony import */ var _utils_generateToken__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(9455);





(0,_utils_connectDb__WEBPACK_IMPORTED_MODULE_1__/* .mongoConnect */ .y)();
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (async (req, res)=>{
    try {
        const refresh_token = req.cookies.refreshtoken;
        if (!refresh_token) {
            return res.status(400).json({
                err: "Please login now!"
            });
        }
        const result = jsonwebtoken__WEBPACK_IMPORTED_MODULE_0___default().verify(refresh_token, "946acb540311776067cadad0976d65c086673babcd8e8298b323ae85823f34b3");
        if (!result) {
            return res.status(400).json({
                err: "Your login session has expired. Please try again!"
            });
        }
        const user = await _model_user__WEBPACK_IMPORTED_MODULE_2__/* ["default"].findById */ .Z.findById(result.id);
        if (!user) {
            return res.status(401).json({
                error: "Sorry, we couldn't find a user with that email address. Please sign up to create a new account. "
            });
        }
        const access_token = (0,_utils_generateToken__WEBPACK_IMPORTED_MODULE_4__/* .getAccessToken */ .h)({
            id: user._id
        });
        const payload = {
            msg: "Refresh token Success!",
            access_token,
            user: {
                first_name: user.first_name,
                last_name: user.last_name,
                mobile: user.mobile,
                email: user.email,
                role: user.role,
                secure_url: user.secure_url,
                public_id: user.public_id
            }
        };
        res.status(200).json(payload);
    } catch (err) {
        return res.status(500).json({
            error: (0,_utils_errors__WEBPACK_IMPORTED_MODULE_3__/* .errorHandler */ .P)(err)
        });
    }
});


/***/ })

};
;

// load runtime
var __webpack_require__ = require("../../../webpack-api-runtime.js");
__webpack_require__.C(exports);
var __webpack_exec__ = (moduleId) => (__webpack_require__(__webpack_require__.s = moduleId))
var __webpack_exports__ = __webpack_require__.X(0, [395,993], () => (__webpack_exec__(857)));
module.exports = __webpack_exports__;

})();
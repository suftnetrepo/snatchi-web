exports.id = 993;
exports.ids = [993];
exports.modules = {

/***/ 305:
/***/ ((module) => {

"use strict";

class Exception extends Error {
    constructor(message, statusCode){
        super(message);
        this.statusCode = statusCode;
        this.status = `${statusCode}`.startsWith("4") ? "fail" : "error";
        this.isOperational = true;
        Error.captureStackTrace(this, this.constructor);
    }
}
module.exports = Exception;


/***/ }),

/***/ 8126:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

var __webpack_unused_export__;
// const { logger } = require("../logger");
const Exception = __webpack_require__(305);
// const Sentry = require("@sentry/node");
const handleCastErrorDB = (error)=>{
    const message = `Invalid ${error.path}: ${error.value}.`;
    return new Exception(message, 400);
};
const handleDuplicateFieldsDB = (error)=>{
    const value = error?.message.match(/(["'])(\\?.)*?\1/)[0];
    const message = `Duplicate field value: ${value}. Please use another value!`;
    return new Exception(message, 400);
};
const handleValidationErrorDB = (error, msg = "")=>{
    const errors = Object.values(error?.errors).map((el)=>el.message);
    const message = `Invalid input data. ${errors.join(". ")}`;
    return new Exception(msg.length ? msg : message, 400);
};
const handleJWTError = ()=>{
    return new Exception("Invalid token. Please log in again!", 401);
};
const handleJWTExpiredError = ()=>{
    return new Exception("Your token has expired! Please log in again.", 401);
};
const handleUnknown = ()=>{
    return new Exception("An Internal Error has occurred, Please try later", 500);
};
__webpack_unused_export__ = (message)=>{
    var error = new Exception(message, 406);
// Sentry.captureException(error);
};
exports.P = (error, msg = "Unknown Error has occurred, Please try later")=>{
    // logger.error(error)
    if (error === null || error === undefined) return msg;
    switch(error.code || error.statusCode){
        case 11000:
            error = handleDuplicateFieldsDB(error);
            break;
        case 400:
            error = error;
            break;
        default:
            error = handleUnknown();
            break;
    }
    if (error.name === "CastError") error = handleCastErrorDB(error);
    if (error.name === "ValidationError") error = handleValidationErrorDB(error, msg);
    if (error.name === "JsonWebTokenError") error = handleJWTError();
    if (error.name === "TokenExpiredError") error = handleJWTExpiredError();
    console.log(error);
    // Sentry.captureException(error);
    return error?.message;
};


/***/ }),

/***/ 9455:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "Y": () => (/* binding */ getRefreshToken),
/* harmony export */   "h": () => (/* binding */ getAccessToken)
/* harmony export */ });
/* harmony import */ var jsonwebtoken__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(9344);
/* harmony import */ var jsonwebtoken__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(jsonwebtoken__WEBPACK_IMPORTED_MODULE_0__);

const getAccessToken = (payload)=>{
    console.log("KDJHF7823RHIU3289FJ9321456777I2G8FG239");
    return jsonwebtoken__WEBPACK_IMPORTED_MODULE_0___default().sign(payload, "KDJHF7823RHIU3289FJ9321456777I2G8FG239", {
        expiresIn: "30m"
    });
};
const getRefreshToken = (payload)=>{
    return jsonwebtoken__WEBPACK_IMPORTED_MODULE_0___default().sign(payload, "946acb540311776067cadad0976d65c086673babcd8e8298b323ae85823f34b3", {
        expiresIn: "7d"
    });
};


/***/ })

};
;
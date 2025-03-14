"use strict";
exports.id = 81;
exports.ids = [81];
exports.modules = {

/***/ 7274:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "M": () => (/* binding */ HOST),
/* harmony export */   "z": () => (/* binding */ VERBS)
/* harmony export */ });
const HOST = "http://localhost:3000/api/";
const VERBS = {
    POST: "POST",
    GET: "GET",
    DELETE: "DELETE",
    PUT: "PUT"
};



/***/ }),

/***/ 3366:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "Z": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(997);
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var components_reuseable_links_NextLink__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(9472);


// ========================================================
const breadcrumb = [
    {
        id: 1,
        title: "Home",
        url: "/"
    },
    {
        id: 2,
        title: "Shop",
        url: "/shop"
    }
];
const Breadcrumb = ({ data =breadcrumb , className =""  })=>{
    return /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("nav", {
        className: "d-inline-block",
        "aria-label": "breadcrumb",
        children: /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("ol", {
            className: `breadcrumb ${className}`,
            children: data.map(({ id , title , url  }, i)=>{
                return data.length - 1 === i ? /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("li", {
                    className: "breadcrumb-item active",
                    "aria-current": "page",
                    children: title
                }, id) : /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("li", {
                    className: "breadcrumb-item",
                    children: /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(components_reuseable_links_NextLink__WEBPACK_IMPORTED_MODULE_1__/* ["default"] */ .Z, {
                        title: title,
                        href: url
                    })
                }, id);
            })
        })
    });
};
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (Breadcrumb);


/***/ }),

/***/ 69:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "Z": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(997);
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var components_blocks_navbar__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(5297);


// ==============================================================
const NavBarLink = ({ stickyBox =false , className , button  })=>{
    return /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(components_blocks_navbar__WEBPACK_IMPORTED_MODULE_1__/* .Navbar */ .w, {
        stickyBox: stickyBox,
        logoAlt: "logo-purple",
        navOtherClass: "navbar-other ms-lg-4",
        navClassName: className,
        button: button
    });
};
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (NavBarLink);


/***/ }),

/***/ 9473:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "A": () => (/* binding */ zat)
/* harmony export */ });
const defaultHeaders = {
    "content-type": "application/json"
};
const zat = async (url, body, method, token = null, queryParams = null)=>{
    try {
        const headers = {
            ...defaultHeaders
        };
        if (token) {
            headers["Authorization"] = `Bearer ${token}`;
        }
        const requestOptions = {
            method,
            headers
        };
        if (method === "GET" && queryParams) {
            const params = new URLSearchParams(queryParams);
            url += `?${params.toString()}`;
        }
        if (body) {
            requestOptions.body = JSON.stringify(body);
        }
        const response = await fetch(url, requestOptions);
        if (response.status === 400 || response.status === 401) {
            const errorData = await response.json();
            return {
                success: false,
                data: errorData.error
            };
        }
        if (!response.ok) {
            throw new Error(`Network response was not ok: ${response.statusText}`);
        }
        const results = method === "DELETE" ? true : await response.json();
        return {
            success: true,
            data: results
        };
    } catch (error) {
        console.error(`Fetch error: ${error}`);
        return {
            success: false,
            errorMessage: error.message
        };
    }
};


/***/ }),

/***/ 7809:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "y": () => (/* binding */ ACCOUNT)
/* harmony export */ });
/* unused harmony export USER */
/* harmony import */ var _config__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(7274);

const ACCOUNT = {
    register: `${_config__WEBPACK_IMPORTED_MODULE_0__/* .HOST */ .M}auth/register`,
    login: `${_config__WEBPACK_IMPORTED_MODULE_0__/* .HOST */ .M}auth/login`,
    accessToken: `${_config__WEBPACK_IMPORTED_MODULE_0__/* .HOST */ .M}auth/accessToken`
};
const USER = {
    createUser: `${_config__WEBPACK_IMPORTED_MODULE_0__/* .HOST */ .M}user/create`,
    updateOne: `${_config__WEBPACK_IMPORTED_MODULE_0__/* .HOST */ .M}user`,
    fetchUsers: `${_config__WEBPACK_IMPORTED_MODULE_0__/* .HOST */ .M}users`,
    removeOne: `${_config__WEBPACK_IMPORTED_MODULE_0__/* .HOST */ .M}user`,
    fetchUserByPaging: `${_config__WEBPACK_IMPORTED_MODULE_0__/* .HOST */ .M}user/fetch-users-by-paging`
};


/***/ }),

/***/ 7822:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "G": () => (/* binding */ validate)
/* harmony export */ });
// Define the structure for a single rule
/**
 * Validates a value against provided rules.
 * @param value - The value to validate.
 * @param rules - The array of validation rules.
 * @returns The error message if the value is invalid, otherwise undefined.
 */ const validateField = (value, rules)=>{
    for (const rule of rules){
        if (rule.array) {
            // Checks if value is a non-empty array
            if (Array.isArray(value) && value.length === 0) {
                return rule.message;
            }
        } else if (rule.pattern && !rule.pattern.test(value)) {
            // Checks if value matches the rule pattern
            return rule.message;
        }
    }
    return undefined;
};
/**
 * Validates a set of values against a set of field rules.
 * @param values - The object of field values.
 * @param rules - The object of field rules.
 * @returns An object containing a boolean indicating if there are errors, and an object of errors.
 */ const validate = (values, rules)=>{
    const errors = {};
    let hasError = false;
    for(const field in rules){
        const fieldRules = rules[field];
        const value = values[field];
        const error = validateField(value, fieldRules);
        if (error) {
            hasError = true;
            errors[field] = {
                message: error
            };
        }
    }
    return {
        hasError,
        errors
    };
};



/***/ })

};
;
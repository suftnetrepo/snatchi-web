"use strict";
exports.id = 396;
exports.ids = [396];
exports.modules = {

/***/ 4924:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "Z": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(997);
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(6689);
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_1__);


const PageProgress = ()=>{
    const progressWrapRef = (0,react__WEBPACK_IMPORTED_MODULE_1__.useRef)(null);
    const progressPathRef = (0,react__WEBPACK_IMPORTED_MODULE_1__.useRef)(null);
    (0,react__WEBPACK_IMPORTED_MODULE_1__.useEffect)(()=>{
        if (progressPathRef.current && progressWrapRef.current) {
            const offset = 50;
            const progressPath = progressPathRef.current;
            const progressWrap = progressWrapRef.current;
            const pathLength = progressPath.getTotalLength();
            progressPath.style.transition = progressPath.style.transition = "none";
            progressPath.style.strokeDasharray = pathLength + " " + pathLength;
            progressPath.style.strokeDashoffset = pathLength.toString();
            progressPath.getBoundingClientRect();
            progressPath.style.transition = progressPath.style.transition = "stroke-dashoffset 10ms linear";
            window.addEventListener("scroll", function() {
                const scroll = document.body.scrollTop || document.documentElement.scrollTop;
                const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
                const progress = pathLength - scroll * pathLength / height;
                progressPath.style.strokeDashoffset = progress.toString();
                const scrollElementPos = document.body.scrollTop || document.documentElement.scrollTop;
                // added classname
                if (scrollElementPos >= offset) {
                    progressWrap.classList.add("active-progress");
                } else {
                    progressWrap.classList.remove("active-progress");
                }
            });
            progressWrap.addEventListener("click", function(e) {
                e.preventDefault();
                window.scroll({
                    top: 0,
                    left: 0,
                    behavior: "smooth"
                });
            });
        }
    }, []);
    return /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("div", {
        className: "progress-wrap",
        ref: progressWrapRef,
        children: /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("svg", {
            className: "progress-circle svg-content",
            width: "100%",
            height: "100%",
            viewBox: "-1 -1 102 102",
            children: /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("path", {
                d: "M50,1 a49,49 0 0,1 0,98 a49,49 0 0,1 0,-98",
                ref: progressPathRef
            })
        })
    });
};
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (PageProgress);


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


/***/ })

};
;
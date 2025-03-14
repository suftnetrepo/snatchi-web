"use strict";
exports.id = 632;
exports.ids = [632];
exports.modules = {

/***/ 7632:
/***/ ((module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.a(module, async (__webpack_handle_async_dependencies__, __webpack_async_result__) => { try {
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "Z": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(997);
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(6689);
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var swiper__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(3877);
/* harmony import */ var swiper_react__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(3015);
var __webpack_async_dependencies__ = __webpack_handle_async_dependencies__([swiper__WEBPACK_IMPORTED_MODULE_2__, swiper_react__WEBPACK_IMPORTED_MODULE_3__]);
([swiper__WEBPACK_IMPORTED_MODULE_2__, swiper_react__WEBPACK_IMPORTED_MODULE_3__] = __webpack_async_dependencies__.then ? (await __webpack_async_dependencies__)() : __webpack_async_dependencies__);




// ==================================================================
const Carousel = (props)=>{
    const { children , slideClassName , spaceBetween =30 , slidesPerView =3 , pagination =true , navigation =true , ...others } = props;
    const { 0: prevEl , 1: setPrevEl  } = (0,react__WEBPACK_IMPORTED_MODULE_1__.useState)(null);
    const { 0: nextEl , 1: setNextEl  } = (0,react__WEBPACK_IMPORTED_MODULE_1__.useState)(null);
    return /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(swiper_react__WEBPACK_IMPORTED_MODULE_3__.Swiper, {
        spaceBetween: spaceBetween,
        slidesPerView: slidesPerView,
        modules: [
            swiper__WEBPACK_IMPORTED_MODULE_2__.Pagination,
            swiper__WEBPACK_IMPORTED_MODULE_2__.Navigation,
            swiper__WEBPACK_IMPORTED_MODULE_2__.Autoplay
        ],
        navigation: navigation ? {
            prevEl,
            nextEl
        } : false,
        pagination: pagination ? {
            clickable: true
        } : false,
        ...others,
        children: [
            children.map((slide, i)=>/*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(swiper_react__WEBPACK_IMPORTED_MODULE_3__.SwiperSlide, {
                    className: slideClassName,
                    children: slide
                }, i)),
            navigation && /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                className: "swiper-navigation",
                children: [
                    /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("div", {
                        role: "button",
                        ref: (node)=>setPrevEl(node),
                        className: "swiper-button swiper-button-prev swiper-button-disabled"
                    }),
                    /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("div", {
                        role: "button",
                        ref: (node)=>setNextEl(node),
                        className: "swiper-button swiper-button-next"
                    })
                ]
            })
        ]
    });
};
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (Carousel);

__webpack_async_result__();
} catch(e) { __webpack_async_result__(e); } });

/***/ })

};
;
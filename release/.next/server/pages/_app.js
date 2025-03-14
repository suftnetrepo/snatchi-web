"use strict";
(() => {
var exports = {};
exports.id = 888;
exports.ids = [888];
exports.modules = {

/***/ 6006:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

// ESM COMPAT FLAG
__webpack_require__.r(__webpack_exports__);

// EXPORTS
__webpack_require__.d(__webpack_exports__, {
  "default": () => (/* binding */ _app)
});

// EXTERNAL MODULE: external "react/jsx-runtime"
var jsx_runtime_ = __webpack_require__(997);
;// CONCATENATED MODULE: external "next/head"
const head_namespaceObject = require("next/head");
var head_default = /*#__PURE__*/__webpack_require__.n(head_namespaceObject);
// EXTERNAL MODULE: external "next/router"
var router_ = __webpack_require__(1853);
// EXTERNAL MODULE: external "react"
var external_react_ = __webpack_require__(6689);
;// CONCATENATED MODULE: ./src/theme/themeOptions.ts
const changeColor = (colorPath, fontPath)=>{
    // remove previous link
    document.getElementById("custom-theme")?.remove();
    document.getElementById("custom-font")?.remove();
    // add new color link
    if (colorPath) {
        const link = document.createElement("link");
        link.setAttribute("href", colorPath);
        link.setAttribute("rel", "stylesheet");
        link.setAttribute("id", "custom-theme");
        document.querySelector("head")?.appendChild(link);
    }
    // add new custom font
    if (fontPath) {
        const link1 = document.createElement("link");
        link1.setAttribute("href", fontPath);
        link1.setAttribute("rel", "preload");
        link1.setAttribute("as", "style");
        link1.setAttribute("onload", "this.rel='stylesheet'");
        link1.setAttribute("id", "custom-font");
        document.querySelector("head")?.appendChild(link1);
    }
};
const changeTheme = (pathname)=>{
    switch(pathname){
        case "/":
            changeColor("/css/colors/purple.css", "/css/fonts/thicccboi.css");
            break;
        case "/demo-1":
            changeColor("/css/colors/yellow.css", "/css/fonts/thicccboi.css");
            break;
        case "/demo-2":
            changeColor(null, "/css/fonts/dm.css");
            break;
        case "/demo-3":
            changeColor("/css/colors/aqua.css", "/css/fonts/thicccboi.css");
            break;
        case "/demo-4":
            changeColor("/css/colors/violet.css", "/css/fonts/dm.css");
            break;
        case "/demo-6":
            changeColor("/css/colors/aqua.css", "/css/fonts/thicccboi.css");
            break;
        case "/demo-7":
            changeColor("/css/colors/purple.css", "/css/fonts/thicccboi.css");
            break;
        case "/demo-8":
            changeColor("/css/colors/aqua.css", "/css/fonts/dm.css");
            break;
        case "/demo-9":
            changeColor(null, "/css/fonts/dm.css");
            break;
        case "/demo-10":
            changeColor("/css/colors/orange.css", "/css/fonts/thicccboi.css");
            break;
        case "/demo-11":
            changeColor("/css/colors/purple.css", null);
            break;
        case "/demo-12":
            changeColor("/css/colors/orange.css", null);
            break;
        case "/demo-13":
            changeColor("/css/colors/purple.css", null);
            break;
        case "/demo-14":
            changeColor("/css/colors/violet.css", "/css/fonts/thicccboi.css");
            break;
        case "/demo-16":
            changeColor("/css/colors/pink.css", null);
            break;
        case "/demo-17":
            changeColor("/css/colors/navy.css", null);
            break;
        case "/demo-18":
            changeColor("/css/colors/grape.css", "/css/fonts/urbanist.css");
            break;
        case "/demo-19":
            changeColor("/css/colors/violet.css", "/css/fonts/urbanist.css");
            break;
        case "/demo-20":
            changeColor("/css/colors/purple.css", "/css/fonts/urbanist.css");
            break;
        case "/demo-21":
            changeColor("/css/colors/sky.css", "/css/fonts/urbanist.css");
            break;
        case "/demo-22":
            changeColor("/css/colors/purple.css", "/css/fonts/urbanist.css");
            break;
        case "/demo-23":
            changeColor("/css/colors/leaf.css", "/css/fonts/urbanist.css");
            break;
        case "/demo-24":
            changeColor("/css/colors/yellow.css", "/css/fonts/urbanist.css");
            break;
        case "/demo-25":
            changeColor("/css/colors/pink.css", "/css/fonts/urbanist.css");
            break;
        case "/demo-26":
            changeColor("/css/colors/grape.css", "/css/fonts/urbanist.css");
            break;
        case "/demo-27":
            changeColor("/css/colors/navy.css", null);
            break;
        default:
            changeColor();
            return;
    }
};
/* harmony default export */ const themeOptions = (changeTheme);

;// CONCATENATED MODULE: ./src/theme/ThemeProvider.tsx




const ThemeProvider = ({ children  })=>{
    const { pathname  } = (0,router_.useRouter)();
    const removePageLoader = ()=>{
        const pageLoader = document.querySelector(".page-loader");
        if (pageLoader) {
            pageLoader.remove();
        }
    };
    (0,external_react_.useEffect)(()=>{
        if (false) {}
        // Change the color and font based on route
        themeOptions(pathname);
        // Hide loader
        // If you don't want loader remove <div className="page-loader" /> element form _app.tsx
        let timer;
        timer = setTimeout(()=>removePageLoader(), 1000);
        return ()=>clearTimeout(timer);
    }, [
        pathname
    ]);
    return /*#__PURE__*/ jsx_runtime_.jsx(jsx_runtime_.Fragment, {
        children: children
    });
};
/* harmony default export */ const theme_ThemeProvider = (ThemeProvider);

// EXTERNAL MODULE: ./Store/AppContext.tsx
var AppContext = __webpack_require__(4566);
;// CONCATENATED MODULE: ./pages/_app.tsx





// Bootstrap and custom scss

// animate css

// import swiper css





// video player css

// glightbox css

// custom scrollcue css


function MyApp({ Component , pageProps  }) {
    const { pathname  } = (0,router_.useRouter)();
    (0,external_react_.useEffect)(()=>{
        if (false) {}
    }, []);
    // scroll animation added
    (0,external_react_.useEffect)(()=>{
        (async ()=>{
            const scrollCue = (await __webpack_require__.e(/* import() */ 926).then(__webpack_require__.bind(__webpack_require__, 1926))).default;
            scrollCue.init({
                interval: -400,
                duration: 700,
                percentage: 0.8
            });
            scrollCue.update();
        })();
    }, [
        pathname
    ]);
    return /*#__PURE__*/ (0,jsx_runtime_.jsxs)(external_react_.Fragment, {
        children: [
            /*#__PURE__*/ (0,jsx_runtime_.jsxs)((head_default()), {
                children: [
                    /*#__PURE__*/ jsx_runtime_.jsx("meta", {
                        charSet: "utf-8"
                    }),
                    /*#__PURE__*/ jsx_runtime_.jsx("meta", {
                        name: "viewport",
                        content: "width=device-width, initial-scale=1.0"
                    }),
                    /*#__PURE__*/ jsx_runtime_.jsx("link", {
                        href: "https://unpkg.com/boxicons@2.1.4/css/boxicons.min.css",
                        rel: "stylesheet"
                    }),
                    /*#__PURE__*/ jsx_runtime_.jsx("title", {
                        children: "TFF"
                    })
                ]
            }),
            /*#__PURE__*/ jsx_runtime_.jsx(theme_ThemeProvider, {
                children: /*#__PURE__*/ jsx_runtime_.jsx(AppContext/* AppProvider */.wI, {
                    children: /*#__PURE__*/ jsx_runtime_.jsx(Component, {
                        ...pageProps
                    })
                })
            })
        ]
    });
}
/* harmony default export */ const _app = (MyApp);


/***/ }),

/***/ 1853:
/***/ ((module) => {

module.exports = require("next/router");

/***/ }),

/***/ 6689:
/***/ ((module) => {

module.exports = require("react");

/***/ }),

/***/ 997:
/***/ ((module) => {

module.exports = require("react/jsx-runtime");

/***/ })

};
;

// load runtime
var __webpack_require__ = require("../webpack-runtime.js");
__webpack_require__.C(exports);
var __webpack_exec__ = (moduleId) => (__webpack_require__(__webpack_require__.s = moduleId))
var __webpack_exports__ = __webpack_require__.X(0, [566], () => (__webpack_exec__(6006)));
module.exports = __webpack_exports__;

})();
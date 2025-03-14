"use strict";
exports.id = 566;
exports.ids = [566];
exports.modules = {

/***/ 4566:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "Il": () => (/* binding */ AppContext),
/* harmony export */   "wI": () => (/* binding */ AppProvider)
/* harmony export */ });
/* unused harmony export useAppContext */
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(997);
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(6689);
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_1__);


const defaultContextValue = {
    token: null,
    currentUser: null,
    login: ()=>{},
    signOut: ()=>{},
    updateCurrentUser: ()=>{}
};
// Initialize the context with a default state
const AppContext = /*#__PURE__*/ (0,react__WEBPACK_IMPORTED_MODULE_1__.createContext)(defaultContextValue);
// Custom hook for using the context
const useAppContext = ()=>{
    const context = useContext(AppContext);
    return context;
};
const AppProvider = ({ children  })=>{
    const initialState = {
        token: null,
        currentUser: null
    };
    const { 0: state , 1: setState  } = (0,react__WEBPACK_IMPORTED_MODULE_1__.useState)(initialState);
    (0,react__WEBPACK_IMPORTED_MODULE_1__.useEffect)(()=>{
        try {
            const user = JSON.parse(window.localStorage.getItem("user") || "{}");
            const token = JSON.parse(window.localStorage.getItem("token") || "{}");
            if (user && token) {
                setState({
                    token,
                    currentUser: user
                });
            }
        } catch (error) {
            console.error("Failed to load state from local storage:", error);
        }
    }, []);
    const action = {
        login: (params)=>{
            const { token , user  } = params;
            try {
                window.localStorage.setItem("token", JSON.stringify(token));
                window.localStorage.setItem("user", JSON.stringify(user));
                setState({
                    token,
                    currentUser: user
                });
            } catch (error) {
                console.error("Failed to save state to local storage:", error);
            }
        },
        signOut: ()=>{
            try {
                window.localStorage.removeItem("user");
                window.localStorage.removeItem("token");
                setState(initialState);
            } catch (error) {
                console.error("Failed to remove state from local storage:", error);
            }
        },
        updateCurrentUser: (currentUser)=>{
            setState((prevState)=>({
                    ...prevState,
                    currentUser
                }));
            window.localStorage.setItem("user", JSON.stringify(currentUser));
        }
    };
    return /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(AppContext.Provider, {
        value: {
            ...action,
            ...state
        },
        children: children
    });
};


/***/ })

};
;
"use strict";
exports.id = 868;
exports.ids = [868];
exports.modules = {

/***/ 3868:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {


// EXPORTS
__webpack_require__.d(__webpack_exports__, {
  "Z": () => (/* binding */ admin_layout)
});

// EXTERNAL MODULE: external "react/jsx-runtime"
var jsx_runtime_ = __webpack_require__(997);
// EXTERNAL MODULE: external "next/router"
var router_ = __webpack_require__(1853);
;// CONCATENATED MODULE: ./src/components/layouts/admin-layout/header.tsx


const Header = ()=>{
    const router = (0,router_.useRouter)();
    const logOut = ()=>{
        router.push("/");
    };
    return /*#__PURE__*/ (0,jsx_runtime_.jsxs)("header", {
        className: " flex-md-nowrap shadow",
        children: [
            /*#__PURE__*/ jsx_runtime_.jsx("a", {
                className: "navbar-brand col-md-3 col-lg-2 me-0 px-3",
                href: "#",
                children: "Company name"
            }),
            /*#__PURE__*/ jsx_runtime_.jsx("div", {
                className: "navbar-nav ",
                children: /*#__PURE__*/ jsx_runtime_.jsx("div", {
                    className: "nav-item text-nowrap",
                    children: /*#__PURE__*/ jsx_runtime_.jsx("a", {
                        className: "nav-link px-3",
                        onClick: logOut,
                        href: "#",
                        children: "Sign out"
                    })
                })
            })
        ]
    });
};
/* harmony default export */ const header = (Header);

;// CONCATENATED MODULE: ./src/components/layouts/admin-layout/footer.tsx

const Footer = ()=>{
    return /*#__PURE__*/ jsx_runtime_.jsx("footer", {
        children: "Admin Footer"
    });
};
/* harmony default export */ const footer = (Footer);

;// CONCATENATED MODULE: ./src/components/layouts/admin-layout/side-bar.tsx

const SideBar = ()=>{
    return /*#__PURE__*/ (0,jsx_runtime_.jsxs)("aside", {
        children: [
            /*#__PURE__*/ (0,jsx_runtime_.jsxs)("div", {
                className: "sidebar open",
                children: [
                    /*#__PURE__*/ (0,jsx_runtime_.jsxs)("div", {
                        className: "logo_details",
                        children: [
                            /*#__PURE__*/ jsx_runtime_.jsx("i", {
                                className: "bx bxl-audible icon"
                            }),
                            /*#__PURE__*/ jsx_runtime_.jsx("div", {
                                className: "logo_name",
                                children: "Code Effect"
                            }),
                            /*#__PURE__*/ jsx_runtime_.jsx("i", {
                                className: "bx bx-menu",
                                id: "btn"
                            })
                        ]
                    }),
                    /*#__PURE__*/ (0,jsx_runtime_.jsxs)("ul", {
                        className: "nav-list",
                        children: [
                            /*#__PURE__*/ (0,jsx_runtime_.jsxs)("li", {
                                children: [
                                    /*#__PURE__*/ jsx_runtime_.jsx("i", {
                                        className: "bx bx-search"
                                    }),
                                    /*#__PURE__*/ jsx_runtime_.jsx("input", {
                                        type: "text",
                                        placeholder: "Search..."
                                    }),
                                    /*#__PURE__*/ jsx_runtime_.jsx("span", {
                                        className: "tooltip",
                                        children: "Search"
                                    })
                                ]
                            }),
                            /*#__PURE__*/ (0,jsx_runtime_.jsxs)("li", {
                                children: [
                                    /*#__PURE__*/ (0,jsx_runtime_.jsxs)("a", {
                                        href: "#",
                                        children: [
                                            /*#__PURE__*/ jsx_runtime_.jsx("i", {
                                                className: "bx bx-grid-alt"
                                            }),
                                            /*#__PURE__*/ jsx_runtime_.jsx("span", {
                                                className: "link_name",
                                                children: "Dashboard"
                                            })
                                        ]
                                    }),
                                    /*#__PURE__*/ jsx_runtime_.jsx("span", {
                                        className: "tooltip",
                                        children: "Dashboard"
                                    })
                                ]
                            }),
                            /*#__PURE__*/ (0,jsx_runtime_.jsxs)("li", {
                                children: [
                                    /*#__PURE__*/ (0,jsx_runtime_.jsxs)("a", {
                                        href: "#",
                                        children: [
                                            /*#__PURE__*/ jsx_runtime_.jsx("i", {
                                                className: "bx bx-user"
                                            }),
                                            /*#__PURE__*/ jsx_runtime_.jsx("span", {
                                                className: "link_name",
                                                children: "User"
                                            })
                                        ]
                                    }),
                                    /*#__PURE__*/ jsx_runtime_.jsx("span", {
                                        className: "tooltip",
                                        children: "User"
                                    })
                                ]
                            }),
                            /*#__PURE__*/ (0,jsx_runtime_.jsxs)("li", {
                                children: [
                                    /*#__PURE__*/ (0,jsx_runtime_.jsxs)("a", {
                                        href: "#",
                                        children: [
                                            /*#__PURE__*/ jsx_runtime_.jsx("i", {
                                                className: "bx bx-chat"
                                            }),
                                            /*#__PURE__*/ jsx_runtime_.jsx("span", {
                                                className: "link_name",
                                                children: "Message"
                                            })
                                        ]
                                    }),
                                    /*#__PURE__*/ jsx_runtime_.jsx("span", {
                                        className: "tooltip",
                                        children: "Message"
                                    })
                                ]
                            }),
                            /*#__PURE__*/ (0,jsx_runtime_.jsxs)("li", {
                                children: [
                                    /*#__PURE__*/ (0,jsx_runtime_.jsxs)("a", {
                                        href: "#",
                                        children: [
                                            /*#__PURE__*/ jsx_runtime_.jsx("i", {
                                                className: "bx bx-pie-chart-alt-2"
                                            }),
                                            /*#__PURE__*/ jsx_runtime_.jsx("span", {
                                                className: "link_name",
                                                children: "Analytics"
                                            })
                                        ]
                                    }),
                                    /*#__PURE__*/ jsx_runtime_.jsx("span", {
                                        className: "tooltip",
                                        children: "Analytics"
                                    })
                                ]
                            }),
                            /*#__PURE__*/ (0,jsx_runtime_.jsxs)("li", {
                                children: [
                                    /*#__PURE__*/ (0,jsx_runtime_.jsxs)("a", {
                                        href: "#",
                                        children: [
                                            /*#__PURE__*/ jsx_runtime_.jsx("i", {
                                                className: "bx bx-folder"
                                            }),
                                            /*#__PURE__*/ jsx_runtime_.jsx("span", {
                                                className: "link_name",
                                                children: "File Manger"
                                            })
                                        ]
                                    }),
                                    /*#__PURE__*/ jsx_runtime_.jsx("span", {
                                        className: "tooltip",
                                        children: "File Manger"
                                    })
                                ]
                            }),
                            /*#__PURE__*/ (0,jsx_runtime_.jsxs)("li", {
                                children: [
                                    /*#__PURE__*/ (0,jsx_runtime_.jsxs)("a", {
                                        href: "#",
                                        children: [
                                            /*#__PURE__*/ jsx_runtime_.jsx("i", {
                                                className: "bx bx-cart-alt"
                                            }),
                                            /*#__PURE__*/ jsx_runtime_.jsx("span", {
                                                className: "link_name",
                                                children: "Order"
                                            })
                                        ]
                                    }),
                                    /*#__PURE__*/ jsx_runtime_.jsx("span", {
                                        className: "tooltip",
                                        children: "Order"
                                    })
                                ]
                            }),
                            /*#__PURE__*/ (0,jsx_runtime_.jsxs)("li", {
                                children: [
                                    /*#__PURE__*/ (0,jsx_runtime_.jsxs)("a", {
                                        href: "#",
                                        children: [
                                            /*#__PURE__*/ jsx_runtime_.jsx("i", {
                                                className: "bx bx-cog"
                                            }),
                                            /*#__PURE__*/ jsx_runtime_.jsx("span", {
                                                className: "link_name",
                                                children: "Settings"
                                            })
                                        ]
                                    }),
                                    /*#__PURE__*/ jsx_runtime_.jsx("span", {
                                        className: "tooltip",
                                        children: "Settings"
                                    })
                                ]
                            })
                        ]
                    })
                ]
            }),
            /*#__PURE__*/ jsx_runtime_.jsx("section", {
                className: "home-section",
                children: /*#__PURE__*/ jsx_runtime_.jsx("div", {
                    className: "text",
                    children: "Dashboard"
                })
            })
        ]
    });
};
/* harmony default export */ const side_bar = (SideBar);

;// CONCATENATED MODULE: ./src/components/layouts/admin-layout/index.tsx




const AdminLayout = ({ children  })=>{
    return /*#__PURE__*/ (0,jsx_runtime_.jsxs)("div", {
        className: "admin_container",
        children: [
            /*#__PURE__*/ jsx_runtime_.jsx(side_bar, {}),
            /*#__PURE__*/ (0,jsx_runtime_.jsxs)("main", {
                children: [
                    /*#__PURE__*/ jsx_runtime_.jsx(header, {}),
                    children
                ]
            }),
            /*#__PURE__*/ jsx_runtime_.jsx(footer, {})
        ]
    });
};
/* harmony default export */ const admin_layout = (AdminLayout);


/***/ })

};
;
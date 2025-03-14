"use strict";
exports.id = 860;
exports.ids = [860];
exports.modules = {

/***/ 7102:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {


// EXPORTS
__webpack_require__.d(__webpack_exports__, {
  "$": () => (/* reexport */ Footer)
});

// EXTERNAL MODULE: external "react/jsx-runtime"
var jsx_runtime_ = __webpack_require__(997);
// EXTERNAL MODULE: ./src/components/reuseable/links/NextLink.tsx
var NextLink = __webpack_require__(9472);
// EXTERNAL MODULE: ./src/components/reuseable/SocialLinks.tsx
var SocialLinks = __webpack_require__(5970);
;// CONCATENATED MODULE: ./src/data/footer.ts
const footerNav = [
    {
        title: "About Us",
        url: "#"
    },
    {
        title: "Our Story",
        url: "#"
    },
    {
        title: "Projects",
        url: "#"
    },
    {
        title: "Terms of Use",
        url: "#"
    },
    {
        title: "Privacy Policy",
        url: "#"
    }
];
const helps = [
    {
        id: 1,
        title: "Support",
        url: "#"
    },
    {
        id: 2,
        title: "Get Started",
        url: "#"
    },
    {
        id: 3,
        title: "Terms of Use",
        url: "#"
    },
    {
        id: 4,
        title: "Privacy Policy",
        url: "#"
    }
];
const learnMore = [
    {
        id: 1,
        title: "About Us",
        url: "#"
    },
    {
        id: 2,
        title: "Our Story",
        url: "#"
    },
    {
        id: 3,
        title: "Projects",
        url: "#"
    },
    {
        id: 4,
        title: "Pricing",
        url: "#"
    },
    {
        id: 5,
        title: "Features",
        url: "#"
    }
];
const tags = [
    {
        id: 1,
        title: "Still Life",
        url: "#"
    },
    {
        id: 2,
        title: "Urban",
        url: "#"
    },
    {
        id: 3,
        title: "Nature",
        url: "#"
    },
    {
        id: 4,
        title: "Landscape",
        url: "#"
    }
];
const categories = [
    {
        id: 1,
        post: 21,
        title: "Lifestyle",
        url: "#"
    },
    {
        id: 2,
        post: 19,
        title: "Photography",
        url: "#"
    },
    {
        id: 3,
        post: 16,
        title: "Journal",
        url: "#"
    }
];
/* harmony default export */ const footer = (footerNav);

;// CONCATENATED MODULE: ./src/components/blocks/footer/Footer.tsx

// -------- custom component -------- //


// -------- data -------- //

const Footer8 = ()=>{
    return /*#__PURE__*/ jsx_runtime_.jsx("footer", {
        className: "bg-dark text-inverse",
        children: /*#__PURE__*/ jsx_runtime_.jsx("div", {
            className: "container py-13 py-md-15",
            children: /*#__PURE__*/ (0,jsx_runtime_.jsxs)("div", {
                className: "row gy-6 gy-lg-0",
                children: [
                    /*#__PURE__*/ jsx_runtime_.jsx("div", {
                        className: "col-md-4 col-lg-3",
                        children: /*#__PURE__*/ (0,jsx_runtime_.jsxs)("div", {
                            className: "widget",
                            children: [
                                /*#__PURE__*/ jsx_runtime_.jsx("img", {
                                    className: "mb-4",
                                    src: "/img/logo.png",
                                    srcSet: "/img/logo.png 2x",
                                    alt: ""
                                }),
                                /*#__PURE__*/ (0,jsx_runtime_.jsxs)("p", {
                                    className: "mb-4",
                                    children: [
                                        "\xa9 2024 Tech First Foundation (TFF). ",
                                        /*#__PURE__*/ jsx_runtime_.jsx("br", {
                                            className: "d-none d-lg-block"
                                        }),
                                        "All rights reserved."
                                    ]
                                }),
                                /*#__PURE__*/ jsx_runtime_.jsx(SocialLinks/* default */.Z, {
                                    className: "nav social social-white"
                                })
                            ]
                        })
                    }),
                    /*#__PURE__*/ jsx_runtime_.jsx("div", {
                        className: "col-md-4 col-lg-3",
                        children: /*#__PURE__*/ (0,jsx_runtime_.jsxs)("div", {
                            className: "widget",
                            children: [
                                /*#__PURE__*/ jsx_runtime_.jsx("h4", {
                                    className: "widget-title text-white mb-3",
                                    children: "Get in Touch"
                                }),
                                /*#__PURE__*/ jsx_runtime_.jsx("address", {
                                    className: "pe-xl-15 pe-xxl-17",
                                    children: "113 -115 Fonthill Road, Finsbury Park, London, N4 3HH, United Kingdom"
                                }),
                                /*#__PURE__*/ jsx_runtime_.jsx(NextLink/* default */.Z, {
                                    title: "techfirstfoundation@gmail.com",
                                    href: "mailto:#"
                                }),
                                /*#__PURE__*/ jsx_runtime_.jsx("br", {}),
                                " +44 7404 522 280"
                            ]
                        })
                    }),
                    /*#__PURE__*/ jsx_runtime_.jsx("div", {
                        className: "col-md-4 col-lg-3",
                        children: /*#__PURE__*/ (0,jsx_runtime_.jsxs)("div", {
                            className: "widget",
                            children: [
                                /*#__PURE__*/ jsx_runtime_.jsx("h4", {
                                    className: "widget-title text-white mb-3",
                                    children: "Learn More"
                                }),
                                /*#__PURE__*/ jsx_runtime_.jsx("ul", {
                                    className: "list-unstyled mb-0",
                                    children: footer.map(({ title , url  })=>/*#__PURE__*/ jsx_runtime_.jsx("li", {
                                            children: /*#__PURE__*/ jsx_runtime_.jsx(NextLink/* default */.Z, {
                                                title: title,
                                                href: url
                                            })
                                        }, title))
                                })
                            ]
                        })
                    }),
                    /*#__PURE__*/ jsx_runtime_.jsx("div", {
                        className: "col-md-12 col-lg-3",
                        children: /*#__PURE__*/ (0,jsx_runtime_.jsxs)("div", {
                            className: "widget",
                            children: [
                                /*#__PURE__*/ jsx_runtime_.jsx("h4", {
                                    className: "widget-title text-white mb-3",
                                    children: "Our Newsletter"
                                }),
                                /*#__PURE__*/ jsx_runtime_.jsx("p", {
                                    className: "mb-5",
                                    children: "Subscribe to our newsletter to get our news & deals delivered to you."
                                }),
                                /*#__PURE__*/ jsx_runtime_.jsx("div", {
                                    className: "newsletter-wrapper",
                                    children: /*#__PURE__*/ jsx_runtime_.jsx("div", {
                                        id: "mc_embed_signup2",
                                        children: /*#__PURE__*/ jsx_runtime_.jsx("form", {
                                            method: "post",
                                            target: "_blank",
                                            className: "validate dark-fields",
                                            id: "mc-embedded-subscribe-form2",
                                            name: "mc-embedded-subscribe-form",
                                            action: "https://elemisfreebies.us20.list-manage.com/subscribe/post?u=aa4947f70a475ce162057838d&id=b49ef47a9a",
                                            children: /*#__PURE__*/ (0,jsx_runtime_.jsxs)("div", {
                                                id: "mc_embed_signup_scroll2",
                                                children: [
                                                    /*#__PURE__*/ (0,jsx_runtime_.jsxs)("div", {
                                                        className: "mc-field-group input-group form-floating",
                                                        children: [
                                                            /*#__PURE__*/ jsx_runtime_.jsx("input", {
                                                                type: "email",
                                                                name: "EMAIL",
                                                                id: "mce-EMAIL2",
                                                                placeholder: "Email Address",
                                                                className: "required email form-control"
                                                            }),
                                                            /*#__PURE__*/ jsx_runtime_.jsx("label", {
                                                                htmlFor: "mce-EMAIL2",
                                                                children: "Email Address"
                                                            }),
                                                            /*#__PURE__*/ jsx_runtime_.jsx("input", {
                                                                value: "Join",
                                                                type: "button",
                                                                name: "subscribe",
                                                                id: "mc-embedded-subscribe2",
                                                                className: "btn btn-leaf"
                                                            })
                                                        ]
                                                    }),
                                                    /*#__PURE__*/ (0,jsx_runtime_.jsxs)("div", {
                                                        id: "mce-responses2",
                                                        className: "clear",
                                                        children: [
                                                            /*#__PURE__*/ jsx_runtime_.jsx("div", {
                                                                className: "response",
                                                                id: "mce-error-response2",
                                                                style: {
                                                                    display: "none"
                                                                }
                                                            }),
                                                            /*#__PURE__*/ jsx_runtime_.jsx("div", {
                                                                className: "response",
                                                                id: "mce-success-response2",
                                                                style: {
                                                                    display: "none"
                                                                }
                                                            })
                                                        ]
                                                    }),
                                                    /*#__PURE__*/ jsx_runtime_.jsx("div", {
                                                        style: {
                                                            position: "absolute",
                                                            left: "-5000px"
                                                        },
                                                        "aria-hidden": "true",
                                                        children: /*#__PURE__*/ jsx_runtime_.jsx("input", {
                                                            type: "text",
                                                            tabIndex: -1,
                                                            name: "b_ddc180777a163e0f9f66ee014_4b1bcfa0bc"
                                                        })
                                                    }),
                                                    /*#__PURE__*/ jsx_runtime_.jsx("div", {
                                                        className: "clear"
                                                    })
                                                ]
                                            })
                                        })
                                    })
                                })
                            ]
                        })
                    })
                ]
            })
        })
    });
};
/* harmony default export */ const Footer = (Footer8);

;// CONCATENATED MODULE: ./src/components/blocks/footer/index.ts




/***/ }),

/***/ 5297:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {


// EXPORTS
__webpack_require__.d(__webpack_exports__, {
  "w": () => (/* reexport */ navbar_Navbar)
});

// EXTERNAL MODULE: external "react/jsx-runtime"
var jsx_runtime_ = __webpack_require__(997);
// EXTERNAL MODULE: external "react"
var external_react_ = __webpack_require__(6689);
;// CONCATENATED MODULE: ./src/hooks/useSticky.ts

const useSticky = (height = 100)=>{
    const { 0: sticky , 1: setSticky  } = (0,external_react_.useState)(false);
    // scroll listener
    const listener = (0,external_react_.useCallback)(()=>{
        if (window.scrollY > height) setSticky(true);
        else setSticky(false);
    }, [
        height
    ]);
    (0,external_react_.useEffect)(()=>{
        if (!window) return;
        window.addEventListener("scroll", listener);
        return ()=>window.removeEventListener("scroll", listener);
    }, [
        listener
    ]);
    return sticky;
};
/* harmony default export */ const hooks_useSticky = (useSticky);

// EXTERNAL MODULE: ./src/components/reuseable/links/NextLink.tsx
var NextLink = __webpack_require__(9472);
// EXTERNAL MODULE: ./src/components/reuseable/SocialLinks.tsx
var SocialLinks = __webpack_require__(5970);
;// CONCATENATED MODULE: ./src/components/blocks/navbar/partials/Social.tsx

const Social = ()=>{
    return /*#__PURE__*/ jsx_runtime_.jsx("li", {
        className: "nav-item",
        children: /*#__PURE__*/ (0,jsx_runtime_.jsxs)("nav", {
            className: "nav social social-muted justify-content-end text-end",
            children: [
                /*#__PURE__*/ jsx_runtime_.jsx("a", {
                    href: "#",
                    children: /*#__PURE__*/ jsx_runtime_.jsx("i", {
                        className: "uil uil-twitter"
                    })
                }),
                /*#__PURE__*/ jsx_runtime_.jsx("a", {
                    href: "#",
                    children: /*#__PURE__*/ jsx_runtime_.jsx("i", {
                        className: "uil uil-facebook-f"
                    })
                }),
                /*#__PURE__*/ jsx_runtime_.jsx("a", {
                    href: "#",
                    children: /*#__PURE__*/ jsx_runtime_.jsx("i", {
                        className: "uil uil-dribbble"
                    })
                }),
                /*#__PURE__*/ jsx_runtime_.jsx("a", {
                    href: "#",
                    children: /*#__PURE__*/ jsx_runtime_.jsx("i", {
                        className: "uil uil-instagram"
                    })
                })
            ]
        })
    });
};
/* harmony default export */ const partials_Social = (Social);

;// CONCATENATED MODULE: ./src/components/blocks/navbar/Navbar.tsx


// -------- custom hook -------- //

// -------- custom component -------- //


// -------- partial header component -------- //

// ===================================================================
const Navbar = (props)=>{
    const { navClassName , social , button , fancy , navOtherClass , stickyBox , logoAlt  } = props;
    const sticky = hooks_useSticky(350);
    const navbarRef = (0,external_react_.useRef)(null);
    // dynamically render the logo
    const logo = sticky ? "logo" : logoAlt ?? "logo";
    // dynamically added navbar classname
    const fixedClassName = "navbar navbar-expand-lg center-nav transparent navbar-light navbar-clone fixed";
    // all main header contents
    const headerContent = /*#__PURE__*/ (0,jsx_runtime_.jsxs)(external_react_.Fragment, {
        children: [
            /*#__PURE__*/ jsx_runtime_.jsx("div", {
                className: "navbar-brand",
                children: /*#__PURE__*/ jsx_runtime_.jsx(NextLink/* default */.Z, {
                    href: "/",
                    title: /*#__PURE__*/ jsx_runtime_.jsx("img", {
                        alt: "logo",
                        src: `/img/logo.png`,
                        srcSet: `/img/logo.png 2x`,
                        className: "img-fluid"
                    })
                })
            }),
            /*#__PURE__*/ (0,jsx_runtime_.jsxs)("div", {
                id: "offcanvas-nav",
                "data-bs-scroll": "true",
                className: "navbar-collapse offcanvas offcanvas-nav offcanvas-start",
                children: [
                    /*#__PURE__*/ (0,jsx_runtime_.jsxs)("div", {
                        className: "offcanvas-header d-lg-none",
                        children: [
                            /*#__PURE__*/ jsx_runtime_.jsx("h3", {
                                className: "text-white fs-30 mb-0",
                                children: "TFF"
                            }),
                            /*#__PURE__*/ jsx_runtime_.jsx("button", {
                                type: "button",
                                "aria-label": "Close",
                                "data-bs-dismiss": "offcanvas",
                                className: "btn-close btn-close-white"
                            })
                        ]
                    }),
                    /*#__PURE__*/ (0,jsx_runtime_.jsxs)("div", {
                        className: "offcanvas-body ms-lg-auto d-flex flex-column h-100",
                        children: [
                            /*#__PURE__*/ (0,jsx_runtime_.jsxs)("ul", {
                                className: "navbar-nav",
                                children: [
                                    /*#__PURE__*/ jsx_runtime_.jsx("li", {
                                        className: "nav-item dropdown dropdown-mega",
                                        children: /*#__PURE__*/ jsx_runtime_.jsx(NextLink/* default */.Z, {
                                            title: "Home",
                                            className: "nav-link",
                                            href: "/"
                                        })
                                    }),
                                    /*#__PURE__*/ jsx_runtime_.jsx("li", {
                                        className: "nav-item dropdown",
                                        children: /*#__PURE__*/ jsx_runtime_.jsx(NextLink/* default */.Z, {
                                            title: "About us",
                                            className: "nav-link",
                                            href: "/about"
                                        })
                                    }),
                                    /*#__PURE__*/ jsx_runtime_.jsx("li", {
                                        className: "nav-item dropdown",
                                        children: /*#__PURE__*/ jsx_runtime_.jsx(NextLink/* default */.Z, {
                                            title: "Causes",
                                            className: "nav-link",
                                            href: "/projects"
                                        })
                                    }),
                                    /*#__PURE__*/ jsx_runtime_.jsx("li", {
                                        className: "nav-item dropdown dropdown-mega",
                                        children: /*#__PURE__*/ jsx_runtime_.jsx(NextLink/* default */.Z, {
                                            title: "Contact",
                                            className: "nav-link",
                                            href: "/contact"
                                        })
                                    })
                                ]
                            }),
                            /*#__PURE__*/ jsx_runtime_.jsx("div", {
                                className: "offcanvas-footer d-lg-none",
                                children: /*#__PURE__*/ (0,jsx_runtime_.jsxs)("div", {
                                    children: [
                                        /*#__PURE__*/ jsx_runtime_.jsx(NextLink/* default */.Z, {
                                            title: " techfirstfoundation@gmail.com",
                                            className: "link-inverse",
                                            href: "mailto: techfirstfoundation@gmail.com"
                                        }),
                                        /*#__PURE__*/ jsx_runtime_.jsx("br", {}),
                                        /*#__PURE__*/ jsx_runtime_.jsx(NextLink/* default */.Z, {
                                            href: "tel:+447404522280",
                                            title: "+44 7404 522 280"
                                        }),
                                        /*#__PURE__*/ jsx_runtime_.jsx("br", {}),
                                        /*#__PURE__*/ jsx_runtime_.jsx(SocialLinks/* default */.Z, {})
                                    ]
                                })
                            })
                        ]
                    })
                ]
            }),
            /*#__PURE__*/ jsx_runtime_.jsx("div", {
                className: navOtherClass,
                children: /*#__PURE__*/ (0,jsx_runtime_.jsxs)("ul", {
                    className: "navbar-nav flex-row align-items-center ms-auto",
                    children: [
                        button && /*#__PURE__*/ jsx_runtime_.jsx("li", {
                            className: "nav-item d-none d-md-block",
                            children: button
                        }),
                        social && /*#__PURE__*/ jsx_runtime_.jsx(partials_Social, {}),
                        /*#__PURE__*/ jsx_runtime_.jsx("li", {
                            className: "nav-item d-lg-none",
                            children: /*#__PURE__*/ jsx_runtime_.jsx("button", {
                                "data-bs-toggle": "offcanvas",
                                "data-bs-target": "#offcanvas-nav",
                                className: "hamburger offcanvas-nav-btn",
                                children: /*#__PURE__*/ jsx_runtime_.jsx("span", {})
                            })
                        })
                    ]
                })
            })
        ]
    });
    return /*#__PURE__*/ (0,jsx_runtime_.jsxs)(external_react_.Fragment, {
        children: [
            stickyBox && /*#__PURE__*/ jsx_runtime_.jsx("div", {
                style: {
                    paddingTop: sticky ? navbarRef.current?.clientHeight : 0
                }
            }),
            /*#__PURE__*/ jsx_runtime_.jsx("nav", {
                ref: navbarRef,
                className: sticky ? fixedClassName : navClassName,
                children: fancy ? /*#__PURE__*/ jsx_runtime_.jsx("div", {
                    className: "container",
                    children: /*#__PURE__*/ jsx_runtime_.jsx("div", {
                        className: "navbar-collapse-wrapper bg-white d-flex flex-row flex-nowrap w-100 justify-content-between align-items-center",
                        children: headerContent
                    })
                }) : /*#__PURE__*/ jsx_runtime_.jsx("div", {
                    className: "container flex-lg-row flex-nowrap align-items-center",
                    children: headerContent
                })
            })
        ]
    });
};
// set deafult Props
Navbar.defaultProps = {
    social: false,
    stickyBox: true,
    navOtherClass: "navbar-other w-100 d-flex ms-auto",
    navClassName: "navbar navbar-expand-lg center-nav transparent navbar-light"
};
/* harmony default export */ const navbar_Navbar = (Navbar);

;// CONCATENATED MODULE: ./src/components/blocks/navbar/index.ts




/***/ }),

/***/ 5970:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "Z": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(997);
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__);

// ========================================================
const links = [
    {
        id: 1,
        icon: "uil uil-twitter",
        url: "https://twitter.com/uilibofficial"
    },
    {
        id: 2,
        icon: "uil uil-facebook-f",
        url: "https://facebook.com/uiLibOfficial/"
    },
    {
        id: 3,
        icon: "uil uil-dribbble",
        url: "#"
    },
    {
        id: 4,
        icon: "uil uil-instagram",
        url: "https://www.instagram.com/uilibofficial/"
    },
    {
        id: 5,
        icon: "uil uil-youtube",
        url: "https://www.youtube.com/channel/UCsIyD-TSO1wQFz-n2Y4i3Rg"
    }
];
const SocialLinks = ({ className ="nav social social-white mt-4"  })=>{
    return /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("nav", {
        className: className,
        children: links.map(({ id , icon , url  })=>/*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("a", {
                href: url,
                target: "_blank",
                rel: "noreferrer",
                children: /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("i", {
                    className: icon
                })
            }, id))
    });
};
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (SocialLinks);


/***/ }),

/***/ 9472:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "Z": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(997);
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var next_link__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(1664);
/* harmony import */ var next_link__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(next_link__WEBPACK_IMPORTED_MODULE_1__);


// ==============================================================
const NextLink = (props)=>{
    const { href , className , title  } = props;
    return /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx((next_link__WEBPACK_IMPORTED_MODULE_1___default()), {
        href: href,
        children: /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("a", {
            className: className,
            children: title
        })
    });
};
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (NextLink);


/***/ })

};
;
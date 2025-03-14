import React from "react";

const ToggleSwitch = ({
    checked = false,
    onChange,
    size = "medium",
    onColor = "#6366f1",
    offColor = "#d1d5db", 
}) => {
    return (
        <div
            className={`toggle-switch ${size}`}
            style={{
                "--on-color": onColor,
                "--off-color": offColor,
            }}
        >
            <input
                type="checkbox"
                id="toggle"
                className="toggle-input"
                checked={checked}
                onChange={onChange}
            />
            <label htmlFor="toggle" className="toggle-label"></label>
        </div>
    );
};

export default ToggleSwitch;

import React from 'react';

const ProgressBar = ({ value, size, animated, striped }) => {
    const progressClass = `progress ${size ? `progress-${size}` : ''} ${animated ? 'progress-animate' : ''
        }`;

    const progressBarClass = ` ps-2 progress-bar ${striped ? 'progress-bar-striped' : ''
        } ${animated ? 'progress-bar-animated' : ''}`;

    return (
        <div className={progressClass}>
            <div
                className={progressBarClass}
                style={{ width: `${value}%` }}
                role="progressbar"
                aria-valuenow={value}
                aria-valuemin={0}
                aria-valuemax={100}
            >
                {value}%
            </div>
        </div>
    );
};

export default ProgressBar;

import React, { FC} from 'react';

type prop = {
    value : number,
    max : number
}
const ProgressBar: FC<prop>= ({ value = 0, max =0 }) => {
    const width = (value / max) * 100;

    const getColorAndTextStyle = (progress : number = 0) => {
        let color = '#4caf50'; // Default color for green
        let textStyle = { color: 'white', fontWeight: 'bold' }; // Default text style for green

        if (progress < 50) {
            color = '#f76c6c'; // Red
            textStyle = { ...textStyle }; // Keep text white and bold for red
        } else if (progress >= 50 && progress < 75) {
            color = '#ffdf65'; // Yellow
            textStyle = { ...textStyle, color: 'black' }; // Text should be black for better readability on yellow
        }

        return { backgroundColor: color, textStyle };
    };

    const { backgroundColor, textStyle } = getColorAndTextStyle(width);

    return (
        <div className="progress-container">
            <div className="progress-bar">
                <div className="progress-bar__inner" style={{ width: `${width}%`, backgroundColor }}>
                    <span className="progress-bar__text" style={textStyle}>
                        {`${Math.round(width)}%`}
                    </span>
                </div>
            </div>
            {/* <div className="progress-labels">
                <span className="progress-label">Raised: ${value.toLocaleString()}</span>
                <span className="progress-label">Goal: ${max.toLocaleString()}</span>
            </div> */}
        </div>
    );
};

export default ProgressBar;

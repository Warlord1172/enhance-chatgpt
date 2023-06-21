import React, { useState } from "react";

const NumberSlider = ({ minValue, maxValue, initialValue, onChange }) => {
    const [value, setValue] = useState(initialValue);

    const handleIncrement = () => {
        const newValue = Math.min(maxValue, parseFloat((value + 0.1).toFixed(1)));
        setValue(newValue);
        onChange(newValue);
    };

    const handleDecrement = () => {
        const newValue = Math.max(minValue, parseFloat((value - 0.1).toFixed(1)));
        setValue(newValue);
        onChange(newValue);
    };

    return (
        <div className="number-slider">
            <p>Conscience</p>
            <div className="circle">{value}</div>
            <div className="buttons">
                <button onClick={handleDecrement}>-</button>
                <button onClick={handleIncrement}>+</button>
            </div>
        </div>
    );
}

export default NumberSlider;

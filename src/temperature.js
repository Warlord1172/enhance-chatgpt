import React, { useState } from "react";

function NumberSlider({ minValue, maxValue, initialValue,setTemperature}) {
    const [value, setValue] = useState(initialValue);

    const incrementValue = () => {
        const newValue = (value + 0.1).toFixed(1); // Round to tenths decimal place
        if (parseFloat(newValue) <= maxValue) {
            setValue(parseFloat(newValue));
            setTemperature(parseFloat(newValue));
        }
    };

    const decrementValue = () => {
        const newValue = (value - 0.1).toFixed(1); // Round to tenths decimal place
        if (parseFloat(newValue) >= minValue) {
            setValue(parseFloat(newValue));
            setTemperature(parseFloat(newValue));
        }
    };

    return (
    <div className="number-slider">
        <p>Conscience</p>
        <div className="circle">{value}</div>
        <div className="buttons">
        <button onClick={decrementValue}>-</button>
        <button onClick={incrementValue}>+</button>
        </div>
    </div>
    );
}
export default NumberSlider;

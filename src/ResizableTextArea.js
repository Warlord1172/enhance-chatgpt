import React, { useEffect, useRef } from "react";

const ResizableInput = ({ value, onChange, placeholder, className, handleSubmit }) => {
  const textAreaRef = useRef(null);

  useEffect(() => {
    textAreaRef.current.style.height = "auto";
    textAreaRef.current.style.height = `${textAreaRef.current.scrollHeight}px`;
  }, [value]);

  const handleChange = (event) => {
    textAreaRef.current.style.height = "auto";
    textAreaRef.current.style.height = `${textAreaRef.current.scrollHeight}px`;
    onChange(event);
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSubmit(textAreaRef.current.value); // Call handleSubmit function passed from the parent
    }
  };

  return (
    <textarea
      ref={textAreaRef}
      value={value}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      className={className}
      placeholder={placeholder}
      style={{
        resize: "none",
        overflow: "hidden",
        border: "2px solid #ccc",
        borderRadius: "4px",
        padding: "6px 12px",
        fontSize: "16px",
        lineHeight: "1.42857143",
      }}
    />
  );
};

export default ResizableInput;
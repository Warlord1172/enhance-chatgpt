import React, { useEffect, useRef } from "react";

const ResizableTextArea = ({ value, onChange, placeholder, className }) => {
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

  return (
    <input
      ref={textAreaRef}
      value={value}
      onChange={handleChange}
      className={className}
      placeholder={placeholder}
    />
  );
};

export default ResizableTextArea;

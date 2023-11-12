import React, { useState, useEffect } from "react";
import Modal from "react-modal";

const WindowClosePrompt = ({ message, onConfirm }) => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleBeforeUnload = (event) => {
      event.preventDefault();
      event.returnValue = "";
      setIsOpen(true);
    };

    const handleWindowClose = () => {
      setIsOpen(true);
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("unload", handleWindowClose);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("unload", handleWindowClose);
    };
  }, []);

  const handleConfirm = () => {
    setIsOpen(false);
    onConfirm();
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  return (
    <Modal isOpen={isOpen}>
      <div>
        <p>{message}</p>
        <button onClick={handleConfirm}>Yes</button>
        <button onClick={handleClose}>No</button>
      </div>
    </Modal>
  );
};

export default WindowClosePrompt;

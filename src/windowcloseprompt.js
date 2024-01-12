import React, { useState, useEffect } from "react";
import { Modal } from "react-bootstrap";

const WindowClosePrompt = ({ message }) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleClose = () => {
    setIsOpen(false);
  };

  useEffect(() => {
    const handleBeforeUnload = (event) => {
      event.preventDefault();
      event.returnValue = message;
      setIsOpen(true);
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [message]);

  if (isOpen) {
    return (
     <Modal show={isOpen} onHide={() => {}} backdrop="static">
        <Modal.Body>{message}</Modal.Body>
        <Modal.Footer>
          <button onClick={handleClose}>Yes</button>
          <button onClick={handleClose}>No</button>
        </Modal.Footer>
      </Modal> 
    );
  }

  return null;
};

export default WindowClosePrompt;
import React, { useState } from "react";
import { Modal } from "react-bootstrap";

const WindowClosePrompt = ({ message, onConfirm }) => {
  const [isOpen, setIsOpen] = useState(true);

  const handleConfirm = () => {
    setIsOpen(false);
    onConfirm();
  };

  const handleClose = () => {
    setIsOpen(false);
    window.close(); // Force close the window
  };

  return (
    <Modal show={isOpen} onHide={handleClose} backdrop="static">
      <Modal.Body>{message}</Modal.Body>
      <Modal.Footer>
        <button onClick={handleConfirm}>Yes</button>
        <button onClick={handleClose}>No</button>
      </Modal.Footer>
    </Modal>
  );
};

export default WindowClosePrompt;
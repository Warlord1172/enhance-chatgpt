import './Loading.css';
import React, { useState, useEffect } from 'react';

const Loading = () => {
  return (
    <div className="main-loading-container">
      <div className="main-loading-animation">
        <div className="main-loading-text">Deploying Application, please wait.</div>
      </div>
    </div>
  );
};

export default Loading;
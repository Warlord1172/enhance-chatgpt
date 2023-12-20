import logo from './logo.svg';
import './App.css';
import { Route } from "react-router-dom";
function APC() {
  return (
    <Route>
    <div className="APC">
      <header className="APC-header">
        <img src={logo} className="APC-logo" alt="logo" />
        <p>
          Edit <code>src/APC.js</code> and save to reload.
        </p>
        <a
          className="APC-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
      </header>
    </div></Route>
  );
}

export default APC;

import logo from './logo.svg';
import './App.css';
import { Route } from "react-router-dom";
function IPC() {
  return (
    <Route>
    <div className="IPC">
      <header className="IPC-header">
        <img src={logo} className="IPC-logo" alt="logo" />
        <p>
          Edit <code>src/App.js</code> and save to reload.
        </p>
        <a
          className="IPC-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
      </header>
    </div>
    </Route>
  );
}

export default IPC;

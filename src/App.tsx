// import React from 'react';
import logo from "./logo.svg";
import "./App.css";
import PDW from "./PDW-Lib";

function App() {
  let pdw = new PDW();
  console.log(pdw.testFun("pretty similar to VS Code?"));
  // console.log(pdw._testManifest.getMid());
  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.tsx</code> and save to reload. Adding the library
          doesn't fail.
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React... slowly.
        </a>
      </header>
    </div>
  );
}

export default App;

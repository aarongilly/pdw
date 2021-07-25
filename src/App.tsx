// import React from 'react';
import logo from "./logo.svg";
import "./App.css";
import PDW from "./PDW-Lib";

function App() {
  let pdw = new PDW();
  // console.log(pdw._testManifest.getMid());
  console.log(pdw.testFun("Boom"));
  let x = "This is how React works, oh yeah";
  let testP = pdw.makeId();
  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>{x}</p>
        <p>{testP}</p>
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

// import React from 'react';
//@ts-ignore
import logo from "./logo.svg";
import "./App.css";
import PDW, { outsideFun } from "./PDW-Lib";

function App() {
  let pdw = new PDW();
  console.log(outsideFun());
  let x = PDW.scopes.day.isScope("2021-08-09");
  let testP = pdw.makeId();
  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>{x.toString()}</p>
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

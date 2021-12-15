import React, {useState} from 'react';
//@ts-ignore
import logo from "./logo.svg";
import "./App.css";
import {PDW} from "./PDW-Lib";

function HooksExample() {
  // Declare a new state variable, which we'll call "count"
  const [count, setCount] = useState(0);
  return (
    <div >
      <p>You clicked {count} times</p>
      <button onClick={() => setCount(count + 1)}>
        Click me
      </button>
    </div>
  );
}

function MyHookTry(){
  const [manifestsLoaded, setCount] = useState(0);
  let pdw = new PDW();
  setCount(manifestsLoaded + 1) //infinite loop, possibly because 
  //this whole function is called every time the State Changes?
  //so self-initiating state changes = infinite loops.
  return(
    <p>Loaded exactly {manifestsLoaded} manifests.</p>
  )
}

function App() {
  // let manifestList = await fetch('https://lifeline-journal.glitch.me/api/getManifests').then(response => response.json());
  let pdw = new PDW();
  let x = PDW.scopes.day.isScope("2021-08-09");
  let testP = PDW.makeId();
  // const [test, ]
  let test = [];
  pdw.getManifests().then(d => {
    console.log("then this")
    test = d;
    console.warn(test);
  });
  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>{x.toString()}</p>
        <p>{test.length.toString()}</p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React... slowly.
        </a>
        <HooksExample/>
      </header>
    </div>
  );
}

export default App;

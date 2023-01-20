import './style.css'
import { makeTemp } from './pdw'
import { createXLSXFile } from './connectors/excelConnector';

//This is not the library, but instead what drives the html view & imports the library.

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <div>
    <h1>Personal Data Warehouse Library Development</h1>
    <p>
      See the <a href="/docs/">TypeDoc-generated documentation</a> for the documentation.
    </p>
    <h2>Reminders</h2>
    <ul>
      <li>Don't inject dependencies to front end stuff or database stuff!</li>
      <li>Utilize Temporal</li>
    </ul>
  </div>
  <h2>Basic Tester Button</h2>
`
makeTemp();

let button = document.createElement('button');
button.textContent = "Click me, yo";

button.onclick = ()=>{
  createXLSXFile();
}

document.querySelector<HTMLDivElement>('#app')!.appendChild(button);
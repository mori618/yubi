const fs = require('fs');
const jsdom = require('jsdom');
const { JSDOM } = jsdom;
const html = fs.readFileSync('index.html', 'utf8');
const dom = new JSDOM(html, { runScripts: "dangerously", resources: "usable" });
const document = dom.window.document;

setTimeout(() => {
  const script = dom.window;
  let state = script.gameState;
  state.cards.p1.A = 2;
  state.cards.p2.A = 0; // dead card
  script.updateDisplay();
  
  console.log("Before attack p2.A:", state.cards.p2.A, document.getElementById('p2-card-A').querySelector('.card-value').textContent);
  
  // mimic dragging p1.A to p2.A
  script.executeAttack('p1', 'p2', 'A', 'A');
  script.updateDisplay();
  
  console.log("After attack p2.A:", state.cards.p2.A, document.getElementById('p2-card-A').querySelector('.card-value').textContent);
}, 500);

import { createElement, render } from "../micro-react";

const element = createElement(
  'h1',
  { id: 'title', style: 'background: blue'},
  'hello world',
  createElement('h2')
)

const container = document.querySelector('#root')

render(element, container)

console.log(element)
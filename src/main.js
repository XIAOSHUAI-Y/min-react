import { createElement, render } from "../micro-react";

const handleInput = (e) => {
  renderer(e.target.value)
}

const renderer = (value) => {
  const container = document.querySelector('#root')
  const element = createElement(
    'dev',
    null,
    createElement('input', { oninput: (e) => handleInput(e) }, null),
    createElement('h1', null, value)
  )
  render(element, container)
}

renderer('hello')
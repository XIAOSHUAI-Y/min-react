import { createElement, render } from "../micro-react";
import { useState } from "../micro-react/render";

const container = document.querySelector('#root')

const Counter = () => {
  const [state, setState] = useState(0)
  return createElement(
    'h1',
    { onclick: () => setState((prev) => prev + 1) },
    state
  )
}

const element = createElement(Counter)
render(element, container)
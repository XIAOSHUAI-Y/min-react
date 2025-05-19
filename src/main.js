import { createElement, render } from "../micro-react";

const App = (props) => {
  return createElement('h1', null, 'Hi', props.name)
}

const container = document.querySelector('#root')

const element = createElement(App, { name: 'aaa' })
render(element, container)
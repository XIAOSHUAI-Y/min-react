function render(element, container) {
	// 创建节点
	const dom =
		element.type === 'TEXT_ELEMENT'
			? document.createTextNode('')
			: document.createElement(element.type);
  
  // 赋予属性
  Object.keys(element.props)
    .filter((key) => key !== 'children')
    .forEach((key) => (dom[key] = element.props[key]))

  // // 递归渲染子元素
  // 每次都会从头遍历到尾，没有优先级，会耽误类似于用户交互这种高优先级的渲染
  // element.props.children.forEach((child) => render(child, dom))
  
  // 追加到父节点
  container.append(dom)
}

let nextUnitOfWork = null // 下一个渲染的节点

// 调度函数
function workLopp(deadLine) {
  let shoulYield = false //是否退出
  // 有工作且不退出
  while (nextUnitOfWork && !shoulYield) {
    // 做工作
    nextUnitOfWork = performUnitOfWork(nextUnitOfWork)
    shoulYield = deadLine.timeRemaining() < 1 // 做完这个调度如果没有时间了就退出
  }
  // 没有足够的时间，就请求下一次浏览器空闲的时候执行
  requestIdleCallback(workLopp)
}

// 第一次请求
requestIdleCallback(workLopp)

function performUnitOfWork(work) {}

export default render;

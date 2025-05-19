function createDom(fiber) {
	// 创建节点
	const dom =
		fiber.type === 'TEXT_ELEMENT'
			? document.createTextNode('')
			: document.createElement(fiber.type);

	// 赋予属性
	Object.keys(fiber.props)
		.filter((key) => key !== 'children')
		.forEach((key) => (dom[key] = fiber.props[key]));

	// // 递归渲染子元素
	// 每次都会从头遍历到尾，没有优先级，会耽误类似于用户交互这种高优先级的渲染
	// element.props.children.forEach((child) => render(child, dom))

  return dom
}

// 发出第一个Fiber，root fiber
function render(element, container) {
  nextUnitOfWork = {
    dom: container,
    props: {
      children: [element],
    },
    sibling: null,
    child: null,
    parent: null,
  }
}

let nextUnitOfWork = null; // 下一个渲染的节点

// 调度函数
function workLopp(deadLine) {
	let shoulYield = false; //是否退出
	// 有工作且不退出
	while (nextUnitOfWork && !shoulYield) {
		// 做工作
		nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
		shoulYield = deadLine.timeRemaining() < 1; // 做完这个调度如果没有时间了就退出
	}
	// 没有足够的时间，就请求下一次浏览器空闲的时候执行
	requestIdleCallback(workLopp);
}

// 第一次请求
requestIdleCallback(workLopp);

function performUnitOfWork(fiber) {
  // 创建dom元素
  if (!fiber.dom) {
    fiber.dom = createDom(fiber)
  }

  // 追加父节点
  if (fiber.parent) {
    fiber.parent.dom.append(fiber.dom)
  }

  // 给children新建fiber
  const elements = fiber.props.children
  let prevSibling = null

  // 建立fiber之间的联系，构建Fiber Tree 
  for (let i = 0; i < elements.length; i++) {
    const newFiber = {
      type: elements[i].type,
      props: elements[i].props,
      parent: fiber,
      dom: null,
      child: null,
      sibling: null
    }

    // 如果是第一个子节点，则作为孩子
    if (i === 0) {
      fiber.child = newFiber
    } else { //其余子节点作为第一个子节点的兄弟
      prevSibling.sibling = newFiber
    }
    prevSibling = newFiber
  }

  // 返回下一个fiber
  if (fiber.child) {
    return fiber.child
  }
  let nextFiber = fiber
  while (nextFiber) {
    if (nextFiber.sibling) {
      return nextFiber.sibling
    }
    nextFiber = nextFiber.parent
  }
}

export default render;

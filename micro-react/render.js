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

	return dom;
}

// 发出第一个Fiber，root fiber
function render(element, container) {
	wipRoot = {
		dom: container,
		props: {
			children: [element],
		},
		sibling: null,
		child: null,
		parent: null,
		alternate: currentRoot,
	};

	deletion = [];
	nextUnitOfWork = wipRoot;
}

let nextUnitOfWork = null; // 下一个渲染的节点
let wipRoot = null;
let currentRoot = null;
let deletion = null;

// Commit阶段
function commitRoot() {
	deletion.forEach(commitWork);
	// 从第一个孩子开始渲染
	commitWork(wipRoot.child);
	currentRoot = wipRoot;
	// 渲染结束后，清空逻辑
	wipRoot = null;
}

function commitWork(fiber) {
	if (!fiber) return;

	let domParentFiber = fiber.parent;
	while (!domParentFiber.dom) {
		domParentFiber = domParentFiber.parent;
	}
	const parentDom = domParentFiber.dom;

	if (fiber.effectTag === 'PLACEMENT' && fiber.dom) {
		parentDom.append(fiber.dom);
	} else if (fiber.effectTag == 'DELETION' && fiber.dom) {
		commitDeletion(fiber, parentDom);
	} else if (fiber.effectTag === 'UPDATE' && fiber.dom) {
		updateDom(fiber.dom, fiber.alternate.props, fiber.props);
	}
	commitWork(fiber.child);
	commitWork(fiber.sibling);
}

function commitDeletion(fiber, domParent) {
	if (fiber.dom) {
		domParent.removeChild(fiber.dom);
	} else {
		commitDeletion(filter.child, domParent);
	}
}

function updateDom(dom, prevProps, nextProps) {
	const isEvent = (key) => key.startsWith('on');
	// 删除已经没有的或者发生变化的事情处理函数
	Object.keys(prevProps)
		.filter(isEvent)
		.filter((key) => !key in nextProps || prevProps[key] !== nextProps[key])
		.forEach((key) => {
			const eventType = key.toLowerCase().substring(2);
			dom.removeEventListener(eventType, prevProps[key]);
		});

	// 添加事件处理函数
	Object.keys(nextProps)
		.filter(isEvent)
		.filter((key) => prevProps[key] !== nextProps[key])
		.forEach((key) => {
			const eventType = key.toLowerCase().substring(2);
			dom.addEventListener(eventType, nextProps[key]);
		});

	// 删除已经没有的props
	Object.keys(prevProps)
		.filter((key) => key !== 'children')
		.filter((key) => !key in nextProps)
		.forEach((key) => {
			dom[key] = '';
		});

	// 赋予新的或者改变的props
	Object.keys(nextProps)
		.filter((key) => key !== 'children')
		.filter((key) => !key in prevProps || prevProps[key] !== nextProps[key])
		.forEach((key) => {
			dom[key] = nextProps[key];
		});
}

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

	// Commit阶段
	if (!nextUnitOfWork && wipRoot) {
		commitRoot();
	}
}

// 第一次请求
requestIdleCallback(workLopp);

function performUnitOfWork(fiber) {
	const isFunctionComponent = fiber.type instanceof Function;
	if (isFunctionComponent) {
		updateFunctionComponent(fiber);
	} else {
		updateHostComponent(fiber);
	}

	// // 追加父节点
	// if (fiber.parent) {
	//   fiber.parent.dom.append(fiber.dom)
	// }

	// 返回下一个fiber
	if (fiber.child) {
		return fiber.child;
	}
	let nextFiber = fiber;
	while (nextFiber) {
		if (nextFiber.sibling) {
			return nextFiber.sibling;
		}
		nextFiber = nextFiber.parent;
	}
}

// 处理非函数式组件
function updateHostComponent(fiber) {
	// 创建dom元素
	if (!fiber.dom) {
		fiber.dom = createDom(fiber);
	}

	// 给children新建fiber
	const elements = fiber.props.children;
	// 新建newFiber，构建fiber
	reconcileChildren(fiber, elements);
}

// 记住上一次的fiber
let wipFiber = null;
let hookIndex = null;

// 处理函数式组件
function updateFunctionComponent(fiber) {
	wipFiber = fiber;
	hookIndex = 0;
	wipFiber.hooks = [];
	const children = [fiber.type(fiber.props)];
	reconcileChildren(fiber, children);
}

export function useState(init) {
	const oldHook =
		wipFiber.alternate &&
		wipFiber.alternate.hooks &&
		wipFiber.alternate.hooks[hookIndex];

  const hook = {
    state: oldHook ? oldHook.state : init,
    queue: []
  }

  const actions = oldHook ? oldHook.queue : []
  actions.forEach((action) => {
    hook.state = action(hook.state)
  })

  const setState = (action) => {
    hook.queue.push(action)
    wipRoot = {
      dom: currentRoot.dom,
      props: currentRoot.props,
      alternate: currentRoot
    }
    nextUnitOfWork = wipRoot
    deletion = []
  }

  wipFiber.hooks.push(hook)
  hookIndex++
  return [hook.state, setState]
}

function reconcileChildren(wipFiber, elements) {
	let index = 0;
	let oldFiber = wipFiber.alternate && wipFiber.alternate.child;
	let prevSibling = null;

	while (index < elements.length || oldFiber) {
		const element = elements[index];
		const sameType = element && oldFiber && element.type === oldFiber.type;
		let newFiber = null;

		if (sameType) {
			// 更新
			newFiber = {
				type: oldFiber.type,
				props: element.props,
				dom: oldFiber.dom,
				parent: wipFiber,
				alternate: oldFiber,
				effectTag: 'UPDATE',
			};
		}
		if (element && !sameType) {
			// 新建
			newFiber = {
				type: element.type,
				props: element.props,
				dom: null,
				parent: wipFiber,
				alternate: null,
				effectTag: 'PLACEMENT',
			};
		}
		if (oldFiber && !sameType) {
			// 删除
			oldFiber.effectTag = 'DELETION';
			deletion.push(oldFiber);
		}

		if (oldFiber) {
			oldFiber = oldFiber.sibling;
		}

		// 如果是第一个子节点，则作为孩子
		if (index === 0) {
			wipFiber.child = newFiber;
		} else {
			//其余子节点作为第一个子节点的兄弟
			prevSibling.sibling = newFiber;
		}
		prevSibling = newFiber;

		index++;
	}
}

export default render;

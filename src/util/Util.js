
export function isScrolledIntoView(element, isClient) {
	if (!isClient) {
		return false;
	}
	const elementTop = element.getBoundingClientRect().top;
	const elementBottom = element.getBoundingClientRect().bottom;
	return elementTop <= 0 && elementBottom >= 0 ||
			elementTop >= 0 && elementBottom <= window.innerHeight ||
			elementTop <= window.innerHeight && elementBottom >= window.innerHeight;
}

export function getWindowHeight(isClient) {
	if (!isClient) {
		return 0;
	}

	const w = window;
	const d = document;
	const e = d.documentElement;
	const g = d.getElementsByTagName('body')[0];

	return w.innerHeight || e.clientHeight || g.clientHeight;
}

export function canUseDOM() {
	return !!((typeof window !== 'undefined' && window.document && window.document.createElement));
}

export function getPercentage(startpos, endpos, currentpos) {
     const distance = endpos - startpos;
     const displacement = currentpos - startpos;
     return displacement / distance;
}

export function getRelativePosition(node, isClient) {
    if (!isClient) {
        return 0;
    }
    const element = node;
    // const height = node.getBoundingClientRect().height;
    let y = Math.round(element.getBoundingClientRect().top);

    y = y > window.innerHeight ? window.innerHeight : y;

    return getPercentage(0, window.innerHeight, y);
}


export function setStyleProp(node, style, value, isClient) {
	// if (!canUseDOM) {
	// 	return;
	// }
	// switch(style.property) {
	// 	case 'blur':
	// 		node.style.filter = 'blur(' + value + (style.unit || 'px') + ')';
	// }
}

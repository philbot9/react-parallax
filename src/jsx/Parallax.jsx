import React from 'react';
import ReactDOM from 'react-dom';

import { isScrolledIntoView, getWindowHeight, canUseDOM, getRelativePosition, setStyleProp } from '../util/Util';

class Parallax extends React.Component {

	constructor(props) {
		super(props);

		this.state = {
			childStyle: {
				position: 'relative'
			}
		};

		this.canUseDOM = canUseDOM();

		// make dom functionality depend on the installed react version
		this.ReactDOM = ReactDOM.findDOMNode ? ReactDOM : React;

		this.node = null;
		this.content = null;
		this.splitChildren = this.getSplitChildren(props);

		this.windowHeight = getWindowHeight(this.canUseDOM);
		this.timestamp = Date.now();
		this.dynamicBlur = !!(props.blur && props.blur.min !== undefined && props.blur.max !== undefined);
		this.autobind();
	}

	componentWillReceiveProps(nextProps) {
		this.splitChildren = this.getSplitChildren(nextProps);
	}

	/**
	 * bind scope to all functions that will be called via eventlistener
	 */
	autobind() {
		this.onScroll = this.onScroll.bind(this);
		this.onWindowResize = this.onWindowResize.bind(this);
		this.updatePosition = this.updatePosition.bind(this);
		this.onWindowLoad = this.onWindowLoad.bind(this);
	}

	render() {
		return (
			<div className={'react-parallax ' + (this.props.className ? this.props.className : '')}>
				{this.props.bgImage ? (
					<img className="react-parallax-bgimage" src={this.props.bgImage} ref="bgImage" alt=""/>
				) : null}
				{this.splitChildren.bgChildren.length > 0 ? (
					<div className="react-parallax-background-children" ref={(bg) => this.bgMounted(bg)}>
						{this.splitChildren.bgChildren}
					</div>
				) : null}
				<div className="react-parallax-content" style={this.state.childStyle} ref="content">
					{this.splitChildren.children}
				</div>
			</div>
		);
	}


	/**
	 * remove all eventlisteners before component is destroyed
	 */
	componentWillUnmount() {
		if (this.canUseDOM) {
			document.removeEventListener('scroll', this.onScroll, false);
			window.removeEventListener("resize", this.onWindowResize, false);
			window.removeEventListener("load", this.onWindowLoad, false);
		}
	}

	/**
	 * bind some eventlisteners for page load, scroll and resize
	 * save component ref after rendering, update all values and set static style values
	 */
	componentDidMount() {
		if (this.canUseDOM) {
			const { parentNode } = this.props

			if (parentNode) {
				parentNode.addEventListener('scroll', this.onScroll, false)
				parentNode.addEventListener("resize", this.onWindowResize, false);
				parentNode.addEventListener("load", this.onWindowLoad, false);
			} else {
				document.addEventListener('scroll', this.onScroll, false);
				window.addEventListener("resize", this.onWindowResize, false);
				window.addEventListener("load", this.onWindowLoad, false);
			}
		}
		// ref to component itself
		this.node = this.ReactDOM.findDOMNode(this);
		// bg image ref
		this.img = this.refs.bgImage ? this.ReactDOM.findDOMNode(this.refs.bgImage) : null;

		if (this.props.bgImage) {
			let image = new Image();
			image.onload = image.onerror = (img) => {
				this.updatePosition();
			}
			image.src = this.props.bgImage;
		} else {
			this.updatePosition();
		}
		this.setParallaxStyle();
		this.setInitialBackgroundStyles(this.img);
		this.setInitialBackgroundStyles(this.bg);
	}

	bgMounted(bg) {
		// ref to wrapp with Background children
		this.bg = this.ReactDOM.findDOMNode(bg);
	}

	onScroll(event) {
		if (!this.canUseDOM) {
			return;
		}
		let stamp = Date.now();
		if (stamp - this.timestamp >= 10 /*&& isScrolledIntoView(this.node, this.canUseDOM)*/) {
			window.requestAnimationFrame(this.updatePosition);
			this.timestamp = stamp;
		}
	}

	onWindowLoad() {
		this.updatePosition();
	}

	/**
	 * Extracts children with type Background from others and returns an object with both arrays:
	 * 	 {
	 * 		bgChildren: bgChildren, // typeof child === 'Background'
	 * 	 	children: children // rest of this.props.children
	 *   }
	 * @return {Object} splitchildren object
	 */
	getSplitChildren(props) {
		let bgChildren = [];
		let children = React.Children.toArray(props.children);
		children.forEach(function(child, index) {
			if (child.type && child.type.prototype && child.type.prototype.isParallaxBackground) {
				bgChildren = bgChildren.concat(children.splice(index, 1));
			}
		});
		return {
			bgChildren: bgChildren,
			children: children
		};
	}

	/**
	 * updates scroll position of this component and also its width and height.
	 * defines, if the background image should have autoHeight or autoWidth to
	 * fit the component space optimally
	 */
	updatePosition() {
		let autoHeight = false;
		this.content = this.ReactDOM.findDOMNode(this.refs.content);
		this.contentHeight = this.content.getBoundingClientRect().height;
		this.contentWidth = this.node.getBoundingClientRect().width;

		// set autoHeight or autoWidth
		if (this.img && (this.img.naturalWidth / this.img.naturalHeight < this.contentWidth / this.getImageHeight() )) {
			autoHeight = true;
		}

		// get relative scroll-y position of parallax component in percentage
		let percentage = getRelativePosition(this.node, this.canUseDOM);

		// update bg image position if set
		if (this.img) {
			this.setImagePosition(percentage, autoHeight);
		}
		// update position of Background children if exist
		if (this.bg && this.splitChildren.bgChildren.length > 0) {
			this.setBackgroundPosition(percentage);
		}
	}

	/**
	 * The image height depends on parallax direction. If strength value is negative we have to give it more height
	 * so there is no white space at start/end of container visiblility.
	 */
	getImageHeight() {
		const inverse = this.props.strength < 0;
		return Math.floor(this.contentHeight + ((inverse ? 2.5 : 1) * Math.abs(this.props.strength)));
	}

	/**
	 * sets position for the background image
	 */
	setImagePosition(percentage, autoHeight=false) {

		const height = this.props.bgHeight || (autoHeight ? 'auto' : this.getImageHeight() + 'px');
		const width = this.props.bgWidth || (!autoHeight ? 'auto' : this.contentWidth + 'px');
		this.img.style.height = height;
		this.img.style.width = width;

		// don't do unneccessary style processing if parallax is disabled
		if (this.props.disabled === true) {
			return;
		}

		const inverse = this.props.strength < 0;
		const pos = (inverse ? this.props.strength : 0) - (this.props.strength * percentage);

		this.img.style.WebkitTransform = 'translate3d(-50%, ' + pos + 'px, 0)';
		this.img.style.transform = 'translate3d(-50%, ' + pos + 'px, 0)';
		if (this.props.blur) {
			let blur = this.dynamicBlur ? this.props.blur.min + ((1 - percentage) * this.props.blur.max) : this.props.blur;
			this.setBlur(this.img, blur);
		}
	}

	setBlur(node, blur) {
		node.style.WebkitFilter = 'blur(' + blur + 'px)';
		node.style.filter = 'blur(' + blur + 'px)';
	}

	setBackgroundPosition(percentage) {
		// don't do unneccessary style processing if parallax is disabled
		if (this.props.disabled === true) {
			return;
		}

		const inverse = this.props.strength < 0;
		const pos = (inverse ? this.props.strength : 0) - (this.props.strength * percentage);

		this.bg.style.WebkitTransform = 'translate3d(-50%, ' + pos + 'px, 0)';
		this.bg.style.transform = 'translate3d(-50%, ' + pos + 'px, 0)';
	}

	/**
	 * defines all static values for the background image
	 */
	setInitialBackgroundStyles(node) {
		if (node) {
			node.style.position = 'absolute';
			node.style.left = '50%';
			node.style.WebkitTransform = 'translate3d(-50%, 0, 0)';
			node.style.transform = 'translate3d(-50%, 0, 0)';
			node.style.WebkitTransformStyle = 'preserve-3d';
			node.style.WebkitBackfaceVisibility = 'hidden';
			node.style.MozBackfaceVisibility = 'hidden';
			node.style.MsBackfaceVisibility = 'hidden';

			if (this.props.bgStyle) {
				Object.keys(this.props.bgStyle).forEach((styleKey) => {
					node.style[styleKey] = this.props.bgStyle[styleKey];
				});
			}
		}
	}

	/**
	 * update window height and positions on window resize
	 */
	onWindowResize() {
		this.windowHeight = getWindowHeight(this.canUseDOM);
		this.updatePosition();
	}


	/**
	 * defines styles for the parallax node that do not change during use
	 */
	setParallaxStyle() {
		if (this.node) {
			this.node.style.position = 'relative';
			this.node.style.overflow = 'hidden';
		}
	}

	log() {
		if (this.props.log) {
			console.log(...arguments);
		}
	}
}
/**
 * @param {String} bgImage - path to the background image that makes parallax effect visible
 * @param {String} bgStyle - additional style object for the bg image/children
 * @param {String} bgWidth - set bgImage width manually
 * @param {String} bgHeight - set bgImage height manually
 * @param {Number} strength - parallax effect strength (in pixel), default 100
 * @param {Number} blur - pixel value for background image blur, default: 0
 */
Parallax.propTypes = {
	bgImage: React.PropTypes.string,
	bgStyle: React.PropTypes.object,
	bgWidth: React.PropTypes.string,
	bgHeight: React.PropTypes.string,
	strength: React.PropTypes.number,
	blur: React.PropTypes.oneOfType([React.PropTypes.number, React.PropTypes.object]),
	className: React.PropTypes.string,
	parentNode: React.PropTypes.node
};
Parallax.defaultProps = {
	strength: 100,
	log: false,
	disabled: false
};

export default Parallax;

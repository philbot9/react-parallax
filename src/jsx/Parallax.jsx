import React from 'react';
import ReactDOM from 'react-dom';

import { isScrolledIntoView, getWindowHeight, canUseDOM, getRelativePosition } from '../util/Util';

class Parallax extends React.Component {

    /**
     * Extracts children with type Background from others and returns an object with both arrays:
     *   {
     *      bgChildren: bgChildren, // typeof child === 'Background'
     *      children: children // rest of this.props.children
     *   }
     * @return {Object} splitchildren object
     */
    static getSplitChildren(props) {
        let bgChildren = [];
        const children = React.Children.toArray(props.children);
        children.forEach((child, index) => {
            if (child.type && child.type.isParallaxBackground) {
                bgChildren = bgChildren.concat(children.splice(index, 1));
            }
        });
        return {
            bgChildren,
            children
        };
    }

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
        this.splitChildren = Parallax.getSplitChildren(props);

        this.windowHeight = getWindowHeight(this.canUseDOM);
        this.timestamp = Date.now();
        this.autobind();
    }

    /**
     * bind some eventlisteners for page load, scroll and resize
     * save component ref after rendering, update all values and set static style values
     */
    componentDidMount() {
        if (this.canUseDOM) {
            document.addEventListener('scroll', this.onScroll, false);
            window.addEventListener('resize', this.onWindowResize, false);
            window.addEventListener('load', this.onWindowLoad, false);
        }
        // ref to component itself
        this.node = this.ReactDOM.findDOMNode(this);
        // bg image ref
        this.img = this.bgImage ? this.bgImage : null;

        if (this.props.bgImage) {
            const image = new Image();
            image.onload = image.onerror = (img) => {
                this.updatePosition();
            };
            image.src = this.props.bgImage;
        } else {
            this.updatePosition();
        }
        this.setParallaxStyle();
        this.setInitialBackgroundStyles(this.img);
        this.setInitialBackgroundStyles(this.bg);
    }

    componentWillReceiveProps(nextProps) {
        this.splitChildren = Parallax.getSplitChildren(nextProps);
    }

    /**
     * remove all eventlisteners before component is destroyed
     */
    componentWillUnmount() {
        if (this.canUseDOM) {
            document.removeEventListener('scroll', this.onScroll, false);
            window.removeEventListener('resize', this.onWindowResize, false);
            window.removeEventListener('load', this.onWindowLoad, false);
        }
    }

    onScroll(event) {
        if (!this.canUseDOM) {
            return;
        }
        const stamp = Date.now();
        if (stamp - this.timestamp >= 10 && isScrolledIntoView(this.node, this.canUseDOM)) {
            window.requestAnimationFrame(this.updatePosition);
            this.timestamp = stamp;
        }
    }

    onWindowLoad() {
        this.updatePosition();
    }

    /**
     * update window height and positions on window resize
     */
    onWindowResize() {
        this.windowHeight = getWindowHeight(this.canUseDOM);
        this.updatePosition();
    }

    setBackgroundPosition(percentage) {
        // don't do unneccessary style processing if parallax is disabled
        if (this.props.disabled === true) {
            return;
        }

        const maxHeight = Math.floor(this.contentHeight + Math.abs(this.props.strength));
        const maxTranslation = maxHeight - this.contentHeight;
        const pos = 0 - (maxTranslation * percentage);

        this.bg.style.WebkitTransform = `translate3d(-50%, ${pos}px, 0)`;
        this.bg.style.transform = `translate3d(-50%, ${pos}px, 0)`;
    }

    /**
     * sets position for the background image
     */
    setImagePosition(percentage, autoHeight = false) {

        const maxHeight = Math.floor(this.contentHeight + Math.abs(this.props.strength));
        const height = this.props.bgHeight || (autoHeight ? 'auto' : `${maxHeight}px`);
        const width = this.props.bgWidth || (!autoHeight ? 'auto' : `${this.contentWidth}px`);
        this.img.style.height = height;
        this.img.style.width = width;

        // don't do unneccessary style processing if parallax is disabled
        if (this.props.disabled === true) {
            return;
        }

        const maxTranslation = maxHeight - this.contentHeight;
        const pos = 0 - (maxTranslation * percentage);

        this.img.style.WebkitTransform = `translate3d(-50%, ${pos}px, 0)`;
        this.img.style.transform = `translate3d(-50%, ${pos}px, 0)`;

        if (this.props.blur) {
            this.img.style.WebkitFilter = `blur(${this.props.blur}px)`;
            this.img.style.filter = `blur(${this.props.blur}px)`;
        }
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
     * defines styles for the parallax node that do not change during use
     */
    setParallaxStyle() {
        if (this.node) {
            this.node.style.position = 'relative';
            this.node.style.overflow = 'hidden';
        }
    }

    /**
     * updates scroll position of this component and also its width and height.
     * defines, if the background image should have autoHeight or autoWidth to
     * fit the component space optimally
     */
    updatePosition() {
        let autoHeight = false;
        this.contentHeight = this.content.getBoundingClientRect().height;
        this.contentWidth = this.node.getBoundingClientRect().width;

        // set autoHeight or autoWidth
        if (this.img) {
            const imgRatio = this.img.naturalWidth / this.img.naturalHeight;
            const contentRatio = this.contentWidth / (this.contentHeight + this.props.strength);
            if (imgRatio < contentRatio) {
                autoHeight = true;
            }
        }

        // get relative scroll-y position of parallax component in percentage
        const percentage = getRelativePosition(this.node, this.canUseDOM);

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
     * bind scope to all functions that will be called via eventlistener
     */
    autobind() {
        this.onScroll = this.onScroll.bind(this);
        this.onWindowResize = this.onWindowResize.bind(this);
        this.updatePosition = this.updatePosition.bind(this);
        this.onWindowLoad = this.onWindowLoad.bind(this);
    }

    log(...args) {
        if (this.props.log) {
            console.log(...args);
        }
    }

    render() {
        return (
            <div className={`react-parallax #${(this.props.className ? this.props.className : '')}`}>
                {this.props.bgImage ? (
                    <img
                      className="react-parallax-bgimage"
                      src={this.props.bgImage}
                      ref={ref => this.bgImage = ref} alt=""
                    />
                ) : ''}
                {this.splitChildren.bgChildren.length > 0 ? (
                    <div
                      className="react-parallax-background-children"
                      ref={ref => this.bg = ref}
                    >
                        {this.splitChildren.bgChildren}
                    </div>
                ) : ''}
                <div
                  className="react-parallax-content"
                  style={this.state.childStyle}
                  ref={ref => this.content = ref}
                >
                    {this.splitChildren.children}
                </div>
            </div>
        );
    }
}
/**
 * @param {String} bgImage - path to the background image that makes parallax effect visible
 * @param {String} bgStyle - additional style object for the bg image/children
 * @param {String} bgWidth - set bgImage width manually
 * @param {String} bgHeight - set bgImage height manually
 * @param {Number} strength - parallax effect strength (in pixel), default 100
 * @param {Number} blur - pixel value for background image blur, default: 0
 * @param {Boolean} log - allow logging - just for dev mode
 * @param {Boolean} disabled - disable parallax, default: false
 */
Parallax.propTypes = {
    bgImage: React.PropTypes.string,
    bgStyle: React.PropTypes.object,
    bgWidth: React.PropTypes.string,
    bgHeight: React.PropTypes.string,
    strength: React.PropTypes.number,
    blur: React.PropTypes.number,
    className: React.PropTypes.string,
    log: React.PropTypes.bool,
    disabled: React.PropTypes.bool,
};
Parallax.defaultProps = {
    strength: 100,
    blur: 0,
    log: false,
    disabled: false
};

export default Parallax;

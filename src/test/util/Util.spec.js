import { setAppAnchor, setPlaceHolderDivs } from '../DomHelper';
import {
	isScrolledIntoView,
	getWindowHeight,
	canUseDOM
} from '../../util/Util';

describe('Util', function() {
	let anchor = null;

	beforeEach(function(done) {
		anchor = setAppAnchor();
		done();
	});

	it('can detect if element is in viewport - positive', function(done) {
		const elementId = 'myelement';
		setPlaceHolderDivs(anchor, elementId, 1);
		setPlaceHolderDivs(anchor, 'myplaceholder', 300);
		expect(isScrolledIntoView(document.getElementById(elementId), true)).toBe(true);

		done();
	});

	it('can detect if element is in viewport - negative', function(done) {
		const elementId = 'myelement';
		setPlaceHolderDivs(anchor, 'myplaceholder', 300);
		setPlaceHolderDivs(anchor, elementId, 1);
		expect(isScrolledIntoView(document.getElementById(elementId), true)).toBe(false);

		done();
	});

	it('can detect window height', function (done) {
		// @TODO height 400 is set in karma.conf, need to find a more dynamic way
		expect(getWindowHeight(true)).toBe(400);
		done();
	})

	it('can detect if DOM can be used', function (done) {
		expect(canUseDOM()).toBe(true);
		done();
	})


});

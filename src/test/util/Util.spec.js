import { setAppAnchor, setPlaceHolderDivs } from '../DomHelper';
import {
	isScrolledIntoView
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
});

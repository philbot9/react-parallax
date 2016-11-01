import React from 'react';
import ReactDOM from 'react-dom';

export function setAppAnchor(id='anchor') {
	let existingAnchor = document.getElementById(id);
	if (existingAnchor) {
		existingAnchor.innerHTML = '';
		return existingAnchor;
	}
	let el = document.createElement('div');
	el.id = id;
	return document.body.appendChild(el);
}
export function setPlaceHolderDivs(target, id='', numberOfRows) {

	let el = document.createElement('div');
	el.id = id;
	el = target.appendChild(el);

	for (var i = 0; i <= numberOfRows; i++) {
		let row = document.createElement('div');
		row.id = id + i;
		row.innerHTML = id + '-' + i;
		el.appendChild(row);
	}
}

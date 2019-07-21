'use strict';

module.exports = (url) => {
	return ['.jpg', '.jpeg', '.png', '.bmp', '.tiff', '.gif'].findIndex((i) => url.includes(i)) >= 0;
};

'use strict';

module.exports = (url) => {
    return ['youtube', 'gfycat', 'youtu'].findIndex((i) => url.includes(i)) >= 0;
}
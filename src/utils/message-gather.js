'use strict'

const fetch = require('node-fetch');

module.exports = async (userId) => {
    const response = await fetch(`http://statsAPI:9000/messages?authors=${JSON.stringify(userId)}`, {
        method: 'GET'
    });
    const json = await response.json();
    return new Promise((resolve) =>{
        resolve(json);
    });
}
'use strict';
const CryptoJS = require('crypto-js');

/**
 * encoder service
 */

module.exports = {
  async encrypt(dataString) {
    const key = CryptoJS.enc.Base64.parse('KHUKFEI42424HFAFHEHUHF');
    const iv = CryptoJS.enc.Base64.parse('FEFEF45343MNNJNJ353555');

    const encrypted = CryptoJS.AES.encrypt(dataString, key, {
      iv: iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    });

    const encryptedHex = CryptoJS.enc.Hex.stringify(CryptoJS.enc.Base64.parse(encrypted.toString()));
    return encryptedHex;
  },  
};

'use strict';
const CryptoJS = require('crypto-js');

/**
 * encoder service
 */

module.exports = {
  async encrypt(dataString) {
    const key = CryptoJS.enc.Base64.parse(process.env.ENCRYPT_KEY);
    const iv = CryptoJS.enc.Base64.parse(process.env.ENCRYPT_IV);

    const encrypted = CryptoJS.AES.encrypt(dataString, key, {
      iv: iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    });

    const encryptedHex = CryptoJS.enc.Hex.stringify(CryptoJS.enc.Base64.parse(encrypted.toString()));
    return encryptedHex;
  },  
};

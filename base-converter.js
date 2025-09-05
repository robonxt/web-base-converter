(function (global) {
  'use strict';

  /**
   * Validate that a given input string is valid for a specific base.
   * Supports bases 2, 8, 10, 16.
   * @param {string} input
   * @param {number} base
   * @returns {boolean}
   */
  function isValidForBase(input, base) {
    if (typeof input !== 'string' || !input.trim()) return false;
    const s = input.trim();
    switch (base) {
      case 2:
        return /^[01]+$/i.test(s);
      case 8:
        return /^[0-7]+$/i.test(s);
      case 10:
        return /^[-+]?\d+$/.test(s);
      case 16:
        return /^[0-9a-f]+$/i.test(s);
      default:
        return false;
    }
  }

  /**
   * Convert an input string from a given base to a decimal number.
   * @param {string} input
   * @param {number} fromBase
   * @returns {number}
   * @throws {Error} if input is invalid for the base
   */
  function toDecimal(input, fromBase) {
    if (![2, 8, 10, 16].includes(fromBase)) {
      throw new Error('Unsupported base');
    }
    if (!isValidForBase(input, fromBase)) {
      throw new Error('Invalid input');
    }
    // parseInt handles optional leading +/-, but for non-decimal bases we already validated characters
    const n = parseInt(input.trim(), fromBase);
    if (Number.isNaN(n)) {
      throw new Error('Invalid input');
    }
    return n;
  }

  /**
   * Convert an input string from one base to another and return the string result.
   * For non-decimal targets, output is uppercase (e.g., hex digits).
   * @param {string} input
   * @param {number} fromBase
   * @param {number} toBase
   * @returns {string}
   */
  function convert(input, fromBase, toBase) {
    const dec = toDecimal(input, fromBase);
    if (toBase === 10) {
      return dec.toString(10);
    }
    if (![2, 8, 10, 16].includes(toBase)) {
      throw new Error('Unsupported base');
    }
    return dec.toString(toBase).toUpperCase();
  }

  // Expose a minimal API with no UI concerns
  global.BaseConverter = {
    convert,
    toDecimal,
    isValidForBase,
  };
})(window);

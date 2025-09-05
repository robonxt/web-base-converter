(function (global) {
  'use strict';

  /**
   * Validates if input string is valid for the specified base (2, 8, 10, 16)
   * @param {string} input - The input string to validate
   * @param {number} base - The numeric base to validate against (2, 8, 10, 16)
   * @returns {boolean} True if input is valid for the specified base
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
   * Converts input string from specified base to decimal number
   * @param {string} input - The number string to convert
   * @param {number} fromBase - The base of the input number (2, 8, 10, 16)
   * @returns {number} The decimal equivalent of the input
   * @throws {Error} If input is invalid or base is unsupported
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
   * Converts a number string between different bases (2, 8, 10, 16)
   * @param {string} input - The number string to convert
   * @param {number} fromBase - Source base (2, 8, 10, 16)
   * @param {number} toBase - Target base (2, 8, 10, 16)
   * @returns {string} The converted number string in uppercase for bases > 10
   * @throws {Error} For unsupported bases
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

  // Public API
  global.BaseConverter = {
    convert,
    toDecimal,
    isValidForBase,
  };
})(window);

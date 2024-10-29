function valueToString(value) {
  return value.toLocaleString('es').replace(/,/g, ".");
}

module.exports = { valueToString };
function setLocalDateTime() {
  const DateUTC = new Date();
  const bogotaUTC = -5 * 60 * 60 * 1000; 
  const dateLocalUTC = new Date(DateUTC.getTime() + bogotaUTC);

  return dateLocalUTC;
}

module.exports = { setLocalDateTime }
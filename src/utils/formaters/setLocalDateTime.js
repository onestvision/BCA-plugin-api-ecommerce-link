function setLocalDateTime() {
  const dateUTC = new Date();
  const bogotaOffset = -5;
  const dateLocalUTC = new Date(dateUTC.getTime() + bogotaOffset * 60 * 60 * 1000);

  return dateLocalUTC;
}

module.exports = { setLocalDateTime }
function setLocalDateTime() {
  const dateUTC = new Date();
  const bogotaOffset = -5;
  const dateLocalUTC = dateUTC.setHours(dateUTC.getHours() + bogotaOffset);

  return dateLocalUTC;
}

module.exports = { setLocalDateTime }
function generateRandomCode(phoneNumber) {
  const prefix = "HBgM"
  const suffix = "ONEST";

  let encoded;
  const randomHex = Array.from({ length: 20 }, () =>
    Math.floor(Math.random() * 16).toString(16)
  ).join("").toUpperCase();

  const rawData = `${phoneNumber}\x15\x02\x00\x12\x18\x14${randomHex}`;

  encoded = Buffer.from(rawData, "utf-8").toString("base64");
  
  return `wamid.${prefix}${encoded}${suffix}`;
}

module.exports = {
  generateRandomCode,
};
function splitFullName(fullName) {
  const nameParts = fullName.trim().split(/\s+/); 
  if (nameParts.length === 1) {
    return { firstName: nameParts[0], lastName: '' };
  } else if (nameParts.length === 2) {
    return { firstName: nameParts[0], lastName: nameParts[1] };
  } else {
    const firstName = nameParts.slice(0, nameParts.length - 2).join(' '); 
    const lastName = nameParts.slice(-2).join(' '); 
    return { firstName, lastName };
  }
}
module.exports = { splitFullName };
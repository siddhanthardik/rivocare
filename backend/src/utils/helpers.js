/**
 * Masks a phone number by replacing middle digits with X.
 * Keeps the country code, first 2 digits of the number, and last 2 digits.
 * Example: "+91 9876543210" -> "+91 98XXXXXX10"
 * Example: "9876543210" -> "98XXXXXX10"
 */
exports.maskPhone = (phone) => {
  if (!phone) return phone;
  const parts = phone.split(' ');
  const number = parts[parts.length - 1];
  
  if (number.length < 10) return phone;
  
  const maskedNumber = number.slice(0, 2) + 'XXXXXX' + number.slice(-2);
  
  if (parts.length > 1) {
    return parts[0] + ' ' + maskedNumber;
  }
  return maskedNumber;
};

/**
 * Masks the specific building/flat from an address, keeping the street/area.
 * Heuristic: Masks alphanumeric characters in the first comma-separated segment.
 * Example: "Flat 402, Sunshine Apts, Linking Road" -> "**** ***, Sunshine Apts, Linking Road"
 */
exports.maskAddress = (address) => {
  if (!address) return address;
  const parts = address.split(',');
  if (parts.length > 1) {
    parts[0] = parts[0].replace(/[a-zA-Z0-9]/g, '*');
    return parts.join(',');
  }
  return address.replace(/^.{8}/, '********');
};

function addShippingDetails(items) {
  console.log(items);
  
  return items.reduce((acc, item) => {
    acc.height += item.alto || 0;
    acc.width += item.ancho || 0;
    acc.length += item.largo || 0;
    acc.weight += item.peso || 0;
    return acc;
  }, { height: 0, width: 0, length: 0, weight: 0 });
}

module.exports = { addShippingDetails };
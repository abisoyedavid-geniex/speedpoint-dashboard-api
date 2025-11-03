const jsonata = require("jsonata");

const transformData = (data, expression, context = {}) => {
  if (!expression) return data;
  const exp = jsonata(expression);
  // bind context keys if present
  Object.keys(context || {}).forEach((k) => exp.assign(k, context[k]));
  return exp.evaluate(data);
};

module.exports = {
  transformData,
};

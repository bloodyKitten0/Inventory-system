const { positiveInteger, nonNegativeNumber } = require("./common");

const id = {
  params: {
    id: positiveInteger,
  },
};

const create = {
  body: {
    pid: positiveInteger,
    wid: positiveInteger,
    amo: nonNegativeNumber,
  },
};

const update = {
  params: {
    id: positiveInteger,
  },

  body: {
    pid: positiveInteger,
    wid: positiveInteger,
    amo: nonNegativeNumber,
  },
};

const adjust = {
  params: {
    id: positiveInteger,
  },

  body: {
    change: {
      type: "number",
      finite: true,
      notEqual: 0,
    },
  },
};

const lowStock = {
  params: {
    below: nonNegativeNumber,
  },
};

const checkAvailability = {
  body: {
    amount: nonNegativeNumber,
    pid: positiveInteger,
    wid: positiveInteger,
  },
};

module.exports = {
  id,
  create,
  update,
  adjust,
  lowStock,
  checkAvailability,
};
//

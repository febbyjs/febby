module.exports = {
  middleware1: (req, res, next) => {
    console.log("middleware 1");
    next();
  },
  middleware2: (req, res, next) => {
    console.log("middleware 2");
    next();
  },
};

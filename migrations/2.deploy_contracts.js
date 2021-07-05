// this is the  migration file i've created, we will use it to migrate our contracts

var LunaToken = artifacts.require("LunaToken.sol");
var LunaTokenSale = artifacts.require("LunaTokenSale.sol");

module.exports = function (deployer) {
  deployer.deploy(LunaToken).then(function() {
    tokenPrice = 1000000000000000; // token price es 0.001 ether
    return deployer.deploy(LunaTokenSale, LunaToken.address, tokenPrice);
  });
};

App = {
  web3Provider: null,
  contracts: {},
  account: "0x0",
  loading: false,
  tokenPrice: 1000000000000000,
  tokensSold: 0,
  tokensAvailable: 750000,

  initMetaMask: function() {

      async function enableUser() {
          const accounts = await ethereum.enable();
          const account = accounts[0];
          App.account = account;
      }
      enableUser();
  },
  const ethereumButton = document.querySelector('.enableEthereumButton');

ethereumButton.addEventListener('click', () => {
  //Will Start the metamask extension
  ethereum.request({ method: 'eth_requestAccounts' });
});,

  init: function() {
    console.log("App initialized...")
    return App.initWeb3();
  },

  initWeb3: function() {

			// Is there is an injected web3 instance?

			if (typeof web3 !== 'undefined') {

			ethereum.enable().then(() => {
			web3 = new Web3(web3.currentProvider);

			});

			} else {

			// If no injected web3 instance is detected, fallback to the TestRPC

			web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
			}

			App.web3Provider=web3.currentProvider;

			App.populateAddress();

			return App.initContract();

			},

  initContracts: function() {
    $.getJSON("LunaTokenSale.json", function(LunaTokenSale) {
      App.contracts.LunaTokenSale = TruffleContract(LunaTokenSale)
      App.contracts.LunaTokenSale.setProvider(App.web3Provider);
      App.contracts.LunaTokenSale.deployed().then(function(LunaTokenSale) {
        console.log("Luna Token Sale Address:", LunaTokenSale.address);
      });
      }).done(function() {
        $.getJSON("LunaToken.json", function(LunaToken) {
          App.contracts.LunaToken = TruffleContract(LunaToken)
          App.contracts.LunaToken.setProvider(App.web3Provider);
          App.contracts.LunaToken.deployed().then(function(LunaToken) {
            console.log("Luna Token Address:", LunaToken.address);
          });
          App.listenForEvents();
          return App.render();
      });
    });
  },

  listenForEvents: function() {
    App.contracts.LunaTokenSale.deployed().then(function(instance) {
      instance.Sell({}, {
        fromBlock: 0,
        toBlock: "latest",
      }).watch(function(error, event) {
        console.log("event triggered", event);
        App.render();
      })
    })
  },

  render: function() {
    if(App.loading) {
      return;
    }
    App.loading = true;

    var loader = $("#loader");
    var content = $("#content");

    loader.show();
    content.hide();

    // Load account data
    web3.eth.getCoinbase(function(err, account) {
      if(err == null) {
        console.log("account", account);
        App.account = account;
        $("#accountAddress").html("Your Account is: " + account);
      }
    })

      App.contracts.LunaTokenSale.deployed().then(function(instance) {
        LunaTokenSaleInstance = instance;
        return LunaTokenSaleInstance.tokenPrice();
      }).then(function(tokenPrice) {
        App.tokenPrice = tokenPrice;
        $(".token-price").html(web3.fromWei(App.tokenPrice, "ether").toNumber());
        return LunaTokenSaleInstance.tokensSold();
      }).then(function(tokensSold) {
        App.tokensSold = tokensSold.toNumber();
        $(".tokens-sold").html(App.tokensSold);
        $(".tokens-available").html(App.tokensAvailable);

        var progressPercent = (Math.ceil(App.tokensSold) / App.tokensAvailable) * 100;
        $('#progress').css('width', progressPercent + '%');

        // Load token contract
        App.contracts.LunaToken.deployed().then(function(instance) {
          LunaTokenInstance = instance;
          return LunaTokenInstance.balanceOf(App.account);
        }).then(function(balance) {
          $(".luna-balance").html(balance.toNumber());
          App.loading = false;
          loader.hide();
          content.show();
        })
      });
    },

  buyTokens: function() {
    $("#content").hide();
    $("#loader").show();
    var numberOfTokens = $("#numberOfTokens").val()
    App.contracts.LunaTokenSale.deployed().then(function(instance) {
      return instance.buyTokens(numberOfTokens, {
        from: App.account,
        value: numberOfTokens * App.tokenPrice,
        gas: 5000000
      });
    }).then(function(result) {
      console.log("Tokens bought...")
      $("form").trigger("reset") // reset number of tokens in form
      // wait for sell event
    });
  }
}
$(function() {
  $(window).load(function() {
    App.initMetaMask();
    App.init();
  })
});

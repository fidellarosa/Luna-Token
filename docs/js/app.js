App = {
  web3Provider: null,
  contracts: {},
  account: "0x0",
  loading: false,
  tokenPrice: 1000000000000000,
  tokensSold: 0,
  tokensAvailable: 750000,
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
    if(typeof web3 !== "undefined") {
      // If a web3 instance is already provided by meta mask
      App.web3Provider = web3.currentProvider;
      web3 = new Web3(web3.currentProvider);
    } else {
      // specify default intance if no web3 instance provided
      web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:7545"));
      web3 = new Web3(App.web3Provider);
    }

    return App.initContracts();
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

  // Listen for events emitted from the contract
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
        //console.log("account", account);
        App.account = account;
        $("#accountAddress").html("Your Account is: " + account);
      }
    })

    // Load token sale contract
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
    App.init();
  })
});

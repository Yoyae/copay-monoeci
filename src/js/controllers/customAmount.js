'use strict';

angular.module('copayApp.controllers').controller('customAmountController', function($scope, $ionicHistory, txFormatService, platformInfo, configService, profileService, walletService, popupService, $http) {

  var showErrorAndBack = function(title, msg) {
    popupService.showAlert(title, msg, function() {
      $scope.close();
    });
  };

  $scope.$on("$ionicView.beforeEnter", function(event, data) {
    var walletId = data.stateParams.id;

    if (!walletId) {
      showErrorAndBack('Error', 'No wallet selected');
      return;
    }

    $scope.showShareButton = platformInfo.isCordova ? (platformInfo.isIOS ? 'iOS' : 'Android') : null;

    $scope.wallet = profileService.getWallet(walletId);

    walletService.getAddress($scope.wallet, false, function(err, addr) {
      if (!addr) {
        showErrorAndBack('Error', 'Could not get the address');
        return;
      }

      $scope.address = walletService.getAddressView($scope.wallet, addr);
      $scope.protoAddr = walletService.getProtoAddress($scope.wallet, $scope.address);

      $scope.coin = data.stateParams.coin;
      var parsedAmount = txFormatService.parseAmount(
        $scope.wallet.coin,
        data.stateParams.amount,
        data.stateParams.currency);

      // Amount in USD or BTC
      var amount = parsedAmount.amount;
      var currency = parsedAmount.currency;
      $scope.amountUnitStr = parsedAmount.amountUnitStr;

      if (currency != 'BTC' && currency != 'BCH') {
        // Convert to BTC or BCH
        var config = configService.getSync().wallet.settings;
        var amountUnit = txFormatService.satToUnit(parsedAmount.amountSat);

        $http.get('https://api.coinmarketcap.com/v1/ticker/Monacocoin/').then(function (response) {
          var value_object = response.data[0];
          var xmcc_to_btc = parseFloat(value_object.price_btc);

          amountUnit = parseFloat(amountUnit / xmcc_to_btc);

          // var btcParsedAmount = txFormatService.parseAmount($scope.wallet.coin, amountUnit, $scope.wallet.coin);
          var btcParsedAmount = txFormatService.parseAmount($scope.coin, amountUnit, 'XMCC');

          $scope.amountBtc = btcParsedAmount.amount;
          $scope.altAmountStr = btcParsedAmount.amountUnitStr;

        },function (err) {
          conosle.log(err);
        });
      } else {
        $http.get('https://api.coinmarketcap.com/v1/ticker/Monacocoin/').then(function (response) {
          var value_object = response.data[0];
          var xmcc_to_btc = parseFloat(value_object.price_btc);

          $scope.amountBtc = parseFloat(amount / xmcc_to_btc);;
          // $scope.altAmountStr = txFormatService.formatAlternativeStr($scope.wallet.coin, parsedAmount.amountSat);

          $scope.altAmountStr = txFormatService.formatAlternativeStr($scope.coin, parsedAmount.amountSat);
        });
      }
    });
  });

  $scope.close = function() {
    $ionicHistory.nextViewOptions({
      disableAnimate: true
    });
    $ionicHistory.goBack(-2);
  };

  $scope.shareAddress = function() {
    if (!platformInfo.isCordova) return;
    var data = $scope.protoAddr + '?amount=' + $scope.amountBtc;
    window.plugins.socialsharing.share(data, null, null, null);
  }

  $scope.copyToClipboard = function() {
    return $scope.protoAddr + '?amount=' + $scope.amountBtc;
  };

});

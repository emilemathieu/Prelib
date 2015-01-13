// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'

"user strict";
var app = angular.module('starter', ['ionic'])

app.run(function($ionicPlatform) {
  $ionicPlatform.ready(function() {
    // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
    // for form inputs)
    if(window.cordova && window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
    }
    if(window.StatusBar) {
      StatusBar.styleDefault();
    }
  });
})

app.factory('VelibAPI', function($http) {
	var stations=[];

	return {
		getStations: function(){
			return $http({
    url: 'https://api.jcdecaux.com/vls/v1/stations', 
    method: "GET",
    params: {contract:'Paris', apiKey: '9bf9a1b35a26563496adb00c856e095664084c78'}
    }).then(function(data){
				return data;
			});
		}
	}
})

app.controller('StoreController', function($scope,$http){
	
	var onGeolocationSuccess = function(position) {
		$scope.userPosition = google.maps.LatLng(position.coords.latitude, position.coords.longitude);
		
		var getNearestStation = function(data) {
			$scope.stations = data;
			var stationPosition;
			var distanceToStation;
			for (var i=0; i<$scope.stations.length; i++) {
			   stationPosition = new google.maps.LatLng($scope.stations[i].position.lat, $scope.stations[i].position.lng);
			   distanceToStation = google.maps.geometry.spherical.computeDistanceBetween($scope.userPosition, stationPosition);
			   $scope.stations[i].distance = distanceToStation;
			}
		}
		
		$http({
		url: 'https://api.jcdecaux.com/vls/v1/stations', 
		method: "GET",
		params: {contract:'Paris', apiKey: '9bf9a1b35a26563496adb00c856e095664084c78'}
		}).success(getNearestStation)
		
		$scope.sortAccordingTo = 'distance';
	};

	function onError(error) {
		alert('code: '    + error.code    + '\n' +
			  'message: ' + error.message + '\n');
	}

	navigator.geolocation.getCurrentPosition(onGeolocationSuccess, onError);
});

app.directive("stationName", function() {
    return {
      restrict: 'E',
      templateUrl: "templates/station-name.html"
    };
});
                                                                                                        
var app = angular.module('myApp', ['ionic']);
app.config(function($stateProvider) {
  $stateProvider
  .state('index', {
    url: '/',
    templateUrl: 'index.html'
  })
  .state('infos', {
    url: '/infos',
    templateUrl: 'infos.html'
  });
});                                                                                                                    

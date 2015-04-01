// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'

'use strict';
var app = angular.module('starter', ['ionic','leaflet-directive'])

//A remplacer par une fonction angular directement
//On peut avec angular utiliser des 'views' ce qui permet de naviguer dans la même page et ainsi avoir toujours accès aux variables

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

app.factory('PrelibAPI', function($http) {

	return {
		report: function(stationName,numberOfBike){
			return $http({
    url: 'prelib-api.herokuapp.com/create_report', 
    method: "POST",
    params: {stationName:stationName, numberOfBike:numberOfBike}
    })
		},
        
        getPredictionOfStations: function(stationId){
            return $http({
    url: 'prelib-api.herokuapp.com/stations', 
    method: "POST",
    params: {stationName:stationId}
    })
		}
	}
})

app.factory('VelibAPI', function($http) {

	return {
		getStationsfromAPI: function(){
			return $http({
    url: 'https://api.jcdecaux.com/vls/v1/stations', 
    method: "GET",
    params: {contract:'Paris', apiKey: '9bf9a1b35a26563496adb00c856e095664084c78'}
    })
		},
        getStationfromAPI: function(id){
			return $http({
    url: 'https://api.jcdecaux.com/vls/v1/stations/'+id, 
    method: "GET",
    params: {contract:'Paris', apiKey: '9bf9a1b35a26563496adb00c856e095664084c78'}
    })
		}
	}
})

app.factory('$localstorage', ['$window', function($window) {
  return {
    set: function(key, value) {
      $window.localStorage[key] = value;
    },
    get: function(key, defaultValue) {
      return $window.localStorage[key] || defaultValue;
    },
    setObject: function(key, value) {
      $window.localStorage[key] = JSON.stringify(value);
    },
    getObject: function(key) {
        if ($window.localStorage[key]==undefined) {
            return null; }
        else {
      return JSON.parse($window.localStorage[key]);
        }
    }
  }
}]);

app.factory('LoaderService', function($rootScope, $ionicLoading) {
  return {
        show : function() {
            $rootScope.loading = $ionicLoading.show({
              // The text to display in the loading indicator
              content: '<i class="icon ion-looping"></i> Loading',
              // The animation to use
              animation: 'fade-in',
              // Will a dark overlay or backdrop cover the entire view
              showBackdrop: true,
              // The maximum width of the loading indicator
              // Text will be wrapped if longer than maxWidth
              maxWidth: 400,
              // The delay in showing the indicator
              showDelay: 0
            });
        },

        hide : function(){
            $rootScope.loading.hide();
        }
    }
});

app.controller('StationsController', function($scope,$rootScope,VelibAPI,$localstorage,LoaderService,$ionicLoading,$window,stations ){
    LoaderService.show();
    if ($rootScope.nbStationsToDisplay!= undefined) { $scope.nbStationsToDisplay = $rootScope.nbStationsToDisplay;}
    else { $scope.nbStationsToDisplay = 5;}
    
    $scope.stations = stations;
    
    $scope.formatDate = function(){
        var d = $scope.date;
        if (d!=undefined) { return d.getDate()+"-"+(d.getMonth()+1)+"-"+d.getFullYear()+" "+d.getHours()+":"+d.getMinutes()+":"+d.getSeconds(); }
        else { return "calculating...";}
    }
    
     $scope.distanceToDisplay = function(distance){
        if (distance>=1000) { return "(à "+(distance/1000).toFixed(2)+" km)"; }
        else { return "(à "+distance.toFixed(0)+" m)"; }
    }
    
    var getNearestStation = function(data) {
			$scope.stations = data;
			var stationPosition;
			var distanceToStation;
			for (var i=0; i<$scope.stations.length; i++) {
               stationPosition = new google.maps.LatLng($scope.stations[i].position.lat, $scope.stations[i].position.lng);
			   distanceToStation = google.maps.geometry.spherical.computeDistanceBetween($scope.userPosition, stationPosition);
			   $scope.stations[i].distance = distanceToStation;
			}
            $localstorage.setObject('stations',data);
    }
    
    var onGeolocationSuccessDistancedRecomputed = function(position) {
        console.log(diff/1000);
		$scope.userPosition = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
        $scope.date = new Date();
        $localstorage.setObject('last_connection',new Date().getTime());
        console.log("stations data load from storage but distance recomputed");
        var data = JSON.parse($localstorage.get('stations'));
        getNearestStation(data);
	};
    
    var onGeolocationSuccessRefresh = function(position) {
        console.log(diff/1000);
		$scope.userPosition = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
        $scope.date = new Date();
        $localstorage.setObject('last_connection',new Date().getTime());
        console.log("all recomputed");
        VelibAPI.getStationsfromAPI().success(function(data){getNearestStation(data); });
	};

	var onError = function(error) {
		alert('code: '    + error.code    + '\n' +
			 'message: ' + error.message + '\n' +
              'You need to accept geolocalisation to use this application'
             );
	}
	
    $scope.doRefresh = function() {
        navigator.geolocation.getCurrentPosition(onGeolocationSuccessRefresh, onError,{enableHighAccuracy: true});
        $scope.$broadcast('scroll.refreshComplete');
    };    
    
    var date = new Date().getTime();
    $scope.date = new Date();
    var last_connection = $localstorage.getObject('last_connection');
    $localstorage.setObject('last_connection',date);
    var diff = date - last_connection;
        
    if (last_connection != null && $localstorage.get('stations') != null && diff < 10000){
        console.log("stations data load from storage");
        $scope.stations = JSON.parse($localstorage.get('stations'));
    }
    else if(last_connection != null && $localstorage.get('stations') != null && diff < 20000){
        navigator.geolocation.getCurrentPosition(onGeolocationSuccessDistancedRecomputed, onError,{enableHighAccuracy: true});
    }
    else {
        navigator.geolocation.getCurrentPosition(onGeolocationSuccessRefresh, onError,{enableHighAccuracy: true});
    }
    $ionicLoading.hide();  	
	
});

app.service('TodosService', function($q,$localstorage,LoaderService,VelibAPI) {
    LoaderService.show();
   
    var stationsData = null;
    
  return {
    stations: stationsData,
    getStations: function() {
        console.log("getStations");
      return this.stations
    },
    getStation: function(todoId) {
        console.log("getStation");
      /*var dfd = $q.defer()
      this.stations.forEach(function(station) {
        if (station.number == todoId) {
            dfd.resolve(station)}
      })
      return dfd.promise*/
        if ($localstorage.get('stations') != null) {
        console.log("NOT NULL");
        stationsData = JSON.parse($localstorage.get('stations'));
        var dfd = $q.defer()
        stationsData.forEach(function(station) {
        if (station.number == todoId) {
            dfd.resolve(station)}
      })
      return dfd.promise
    }
    else {
        console.log("NULL");
        VelibAPI.getStationsfromAPI().success(function(data){
            stationsData = data;
            var dfd = $q.defer()
             stationsData.forEach(function(station) {
        if (station.number == todoId) {
            dfd.resolve(station)}
      })
      return dfd.promise                                               
        });
    }
    }
  }
})
app.controller('ReportController', function($scope,$stateParams,$ionicPopup,PrelibAPI,$localstorage,station){
    
    $scope.station = station;
    
    function showAlert(numberOfBike) {
        var textToDisplay = "";
        if (numberOfBike==1){textToDisplay = "Merci d'avoir reporté un vélo";}
        else if (numberOfBike>1){textToDisplay = "Merci d'avoir signalé "+numberOfBike +" vélos";}
       var alertPopup = $ionicPopup.alert({
            title: "Prelib'",
            template: textToDisplay
        });
    };
    
    $scope.report = function(idStation,numberOfBike) {
        console.log([idStation,numberOfBike]);
        PrelibAPI.report(idStation,numberOfBike).success(function(data){
            console.log('POST resquest successfull');
            console.log(data);
        })
        .error(function(data){
            console.log('POST request failure');
            console.log(data);
        });
        showAlert(numberOfBike);
    }
    
    $scope.formatAddress = function() {
        var first = $scope.station.address.split("-")[0].toLowerCase();
        first = first.substr(0, 1).toUpperCase() + first.substr(1);
        return first + "-" + $scope.station.address.split("-")[1];
    }
    
    var devList = new Array(50);
    for (var i = 0; i < devList.length; i++) { devList[i]={name: i, id: i}; }
    $scope.devList = devList;
    
    var isIOS = ionic.Platform.isIOS();
    var isAndroid = ionic.Platform.isAndroid();
    var isWindowsPhone = ionic.Platform.isWindowsPhone();
    
    var mapsUrl = "https://maps.google.com?saddr=Current+Location&daddr="+$scope.station.position.lat+","+$scope.station.position.lng;
    if (isIOS) { mapsUrl = "https://maps.apple.com?saddr=Current+Location&daddr="+$scope.station.position.lat+","+$scope.station.position.lng;}
    else if (isAndroid) { mapsUrl = "https://maps.google.com?saddr=Current+Location&daddr="+$scope.station.position.lat+","+$scope.station.position.lng; }
    else if (isWindowsPhone) { mapsUrl = "maps:saddr=Current+Location&daddr="+$scope.station.position.lat+","+$scope.station.position.lng; }
    $scope.mapsUrl = mapsUrl;
    
});

app.service('mapService', function($rootScope) {
    return {
    getCenter: function() {
        if ($rootScope.center!=undefined) { return $rootScope.center; }
        else {return null; }
    },
    getZoom: function() {
        if ($rootScope.zoom!=undefined) { return $rootScope.zoom; }
        else {return null; }
    },
    getBounds: function() {
        if ($rootScope.bounds!=undefined) { return $rootScope.bounds; }
        else {return null; }
    },
    setCenter: function(center) {
        //console.log(center);
        $rootScope.center = center;
    },
    setZoom: function(zoom) {
        //console.log(zoom);
        $rootScope.zoom = zoom;
    },
    setBounds: function(bounds) {
        //console.log(bounds);
        $rootScope.bounds = bounds;
    }
    }
})

app.controller("MapCtrl", function($scope,VelibAPI,mapService) {
    
    var map;
    if (map == undefined) { 
    console.log('initializing map');
    map = L.map('map',{ zoomControl:false });
    L.tileLayer('http://api.tiles.mapbox.com/v4/mapbox.streets/{z}/{x}/{y}@2x.png?access_token=pk.eyJ1IjoiZW1pbGVtYXRoaWV1IiwiYSI6IkhURVU2SFUifQ.1K2LjZmtAhfY-VmuAKXS_w', {
            zoom : 16,
			maxZoom: 17,
            minZoom: 12/*,
			attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, ' +
				'<a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
				'Imagery © <a href="http://mapbox.com">Mapbox</a>',*/
    }).addTo(map);
    }
    
    
    var centerIcon = L.AwesomeMarkers.icon({
                    icon: '',
                    markerColor: 'darkblue',
                    prefix: 'fa',
                    html: 'you'
                });
    
    var markerCenter = L.marker();
    var circleCenter = L.circle();
    
    
    function onLocationFound(e) {
        var radius = e.accuracy / 2;
        circleCenter.setLatLng(e.latlng);
        circleCenter.setRadius(radius);
        circleCenter.addTo(map);
        markerCenter.setLatLng(e.latlng);
        markerCenter.setIcon(centerIcon);
        markerCenter.addTo(map);
        map.setView(markerCenter.getLatLng(),16); 
        markerCenter.bindPopup("You are within " + radius.toFixed(0) + " meters from this point").openPopup();
    }
    map.on('locationfound', onLocationFound);
    
    function onLocationError(e) {
        alert(e.message);
    }
    map.on('locationerror', onLocationError);
    
    $scope.locate = function(){
        map.locate({setView: true, enableHighAccuracy: true, maxZoom :16});
    }
    
    $scope.refresh = function(){
        VelibAPI.getStationsfromAPI().success(function(data){ $scope.stations = data;})
        loadStationsMarkers();
    }
    
    if (mapService.getCenter()!=null && mapService.getZoom()!=null) {
        map.locate({setView: true, enableHighAccuracy: true, maxZoom :16});
        //map.setView(mapService.getCenter(),17); 
        //map.fitBounds(mapService.getBounds());
        //map.panTo(mapService.getCenter());
    }
    else { 
        map.locate({setView: true, enableHighAccuracy: true, maxZoom :16});
    }
    
    VelibAPI.getStationsfromAPI().success(function(data){ $scope.stations = data; })    
 
    var markers1 = new L.layerGroup();
    var markers2 = new L.layerGroup();
    
    var loadStationsMarkers = function() {
        console.log('markers reloaded');
        if (markers1.getLayers().length>0) {
            map.removeLayer(markers1);
            markers1.clearLayers();  
        }
        markers1 = new L.layerGroup();
        angular.forEach($scope.stations, function(station) {
            var stationShouldBeDispayedInlargeZoom = map.getZoom()>=15 && station.position.lat>=map.getBounds()._southWest.lat && station.position.lat<=map.getBounds()._northEast.lat && station.position.lng>= map.getBounds()._southWest.lng && station.position.lng<= map.getBounds()._northEast.lng;
            var stationShouldBeDispayedInSmallZoom = map.getZoom()<15 && Math.abs(map.getCenter().lat-station.position.lat)<0.005 && Math.abs(map.getCenter().lng-station.position.lng)<0.01;
            if (stationShouldBeDispayedInlargeZoom || stationShouldBeDispayedInSmallZoom) {
                var color;
                if (station.available_bikes==0) {color='red';}
                else if (station.available_bikes==station.bike_stands)  {color='orange';}
                else  {color='lightblue';}
                var customIcon = L.AwesomeMarkers.icon({
                    icon: '',
                    markerColor: color,
                    prefix: 'fa',
                    html: station.available_bikes
                }); 
                var marker = L.marker([station.position.lat, station.position.lng],{clickable:true,icon: customIcon});
                marker.bindPopup("<b>"+station.name.slice(8)+"</b>"+"<br>"+station.available_bikes+" / "+station.bike_stands);
                markers1.addLayer(marker);
            }
        })
        map.addLayer(markers1);
    }
    
     map.on('moveend', function(e) {
        loadStationsMarkers();
        mapService.setZoom(map.getZoom());
        mapService.setCenter(map.getCenter());
        mapService.setBounds(map.getBounds());
    });
})

app.controller("settingsCtrl", function($scope,$rootScope) {
    if ($rootScope.nbStationsToDisplay == undefined) {$scope.data = { 'nbStationsToDisplay' : '5' };}
    else {$scope.data = { 'nbStationsToDisplay' :  $rootScope.nbStationsToDisplay};}
    $scope.$watch('data.nbStationsToDisplay', function() {
        $rootScope.nbStationsToDisplay = $scope.data.nbStationsToDisplay;
    })
})

app.config(function($stateProvider,$urlRouterProvider) {
  $stateProvider
  .state('tabs', {
      url: "/tab",
      abstract: true,
      templateUrl: "tabs.html"
    })
  .state('tabs.stations', {
    url: '/stations',
      views: {
        'stations-tab': {
          controller: 'StationsController',
          templateUrl: 'stations.html'
        }
    },
    resolve: {
      stations: function(TodosService) {
        return TodosService.getStations()
      }
    }
  })
  .state('tabs.station', {
    url: '/stations/:stationID',
      views: {
          'stations-tab': {
            controller: 'ReportController',
            templateUrl: 'station.html'
          }
      },
    resolve: {
      station: function($stateParams, TodosService) {
        return TodosService.getStation($stateParams.stationID)
      }
    }
  })
  .state('tabs.maps', {
      url: "/maps",
      views: {
        'maps-tab': {
          templateUrl: "maps.html",
          controller: "MapCtrl"
        }
      }
    })
    .state('tabs.settings', {
      url: "/settings",
      views: {
        'settings-tab': {
          templateUrl: "settings.html",
            controller: "settingsCtrl"
        }
      }
  })
    $urlRouterProvider.otherwise("/tab/stations");
});          

var mapController = function($scope, $modalInstance, GeocodeService, geolocation, inputData) {
	var mapInstance;
	$scope.location = null;
	$scope.canSelect = !inputData.readonly;
	$scope.map = {
		zoom: 6
	};

	$scope.$on('mapInitialized', function(evt, map) {
		if (inputData.location &&
			inputData.location.coordinates.length == 2 &&
			inputData.location.coordinates[0] !== 0 &&
			inputData.location.coordinates[1] !== 0 ) {
			var initialPoint = [ 
				inputData.location.coordinates[1] || 40.7127837,   //No info: starting point = NY
				inputData.location.coordinates[0] || -74.00594130000002
			];
			init(map, initialPoint, 16);
		} else {
			//resolveGeoLocation
			var cachedData = geolocation.getLocation()
			.then(function(data) {
				init(map, [
					data.coords.latitude, 
					data.coords.longitude
				], 13);
			}, function() {
				init(map, [39, -121], 6);
			});

			if (cachedData && cachedData.data) {
				init(map, [ 
					cachedData.data.coords.latitude, 
					cachedData.data.coords.longitude
				], 13);
			}
			else {
				init(map, [37, -5.9], 6);
			}
		}
	});

	function init(map, initialPoint, zoom) {
		mapInstance = map;
		var position = new google.maps.LatLng(initialPoint[0], initialPoint[1]); 

		var marker = getMarker(mapInstance);
		if (marker) {
			if (inputData.readonly) {
				marker.setDraggable(false);
			}
			marker.setPosition(position);
			map.panTo(position);
			map.setZoom(zoom);
		}
		$scope.address= null;
	}

	$scope.onType = function() {
		if ($scope.address) {
			GeocodeService.getGeoFromAddress($scope.address)
			.then(onGeoResult, errorHandler);
		}
	};

	function onGeoResult(httpData) {
		if (httpData.data.results && httpData.data.results[0]) {
			var response = httpData.data.results[0];
			var loc = new google.maps.LatLng(
				response.geometry.location.lat, 
				response.geometry.location.lng
			); 
			var marker = getMarker(mapInstance);
			if (marker) {
				$scope.formattedAddress = response.formatted_address;
				marker.setPosition(loc);
				mapInstance.panTo(loc);

				if (response.types) {
					if (contains(response.types, 'street_address')) {
						mapInstance.setZoom(17);
					} 
					else if (contains(response.types, 'route')) {
						mapInstance.setZoom(16);
					}
					else if (contains(response.types, 'locality')) {
						mapInstance.setZoom(13);
					} 
					else if (contains(response.types, 'airoport') ||
  						     contains(response.types, 'transit_station')
						) {
						mapInstance.setZoom(12);
					} 
					else if (contains(response.types, 'country')) {
						mapInstance.setZoom(6);
					}
					else if (contains(response.types, 'continent')) {
						mapInstance.setZoom(4);
					}
					else {
						mapInstance.setZoom(6);
					}
				}
			}
		}
	}

	function contains(array, value) {
		var i = array.length;
		while (i--) {
			if (array[i] === value) {
				return true;
			}
		}
		return false;
	}

	function errorHandler() {
	}

	$scope.select = function() {

		$scope.location = buildLocation(); 
		$modalInstance.close( {result : 'select', location: $scope.location });
	};
	$scope.cancel = function() {
		$modalInstance.close( {result : 'cancel', location: null });
	};
	$scope.close = function() {
		$modalInstance.close( {result : 'close' });
	};

	function getMarker(map) {
		if (map.markers['0']) {
			var marker = map.markers['0'];
			return marker;
		}
		return null;
	}

	function buildLocation() {
		if (mapInstance.markers['0']) {
			var marker = mapInstance.markers['0'];

			var pos = marker.getPosition();
			if (marker) {
				return {
					type :'Point',
					coordinates: [pos.lng(), pos.lat()]
				};
			}
		}
		return {
			type :'Point',
			coordinates: null
		};
	}
};
mapController.$inject = ['$scope', '$modalInstance', 'GeocodeService', 'geolocation', 'inputData'];


var geopointSelectorController = function ($scope, $modal) {

	$scope.openMap = function($event) {
		$event.preventDefault();
		$event.stopPropagation();

		//open modal pick position and return
		var modalInstance = $modal.open({
			animation: true,
			templateUrl: 'mapModal.html',
			controller: mapController,
			size: 'lg',
			resolve: {
				inputData: function () {
				return { 
					location : $scope.location,
					readonly : $scope.readonly
					};
				}
			}
		});
		$scope.opened = true;

		modalInstance.result.then(function (res) {
				if (!$scope.readonly) {
					if (res.result === 'select') {
						$scope.location = res.location;						
					}
					else if (res.result === 'cancel') {
						$scope.location = null;						
					}
					//else if (res.result === 'close') {
					//}
					$scope.opened = false;
				}
			}, function () {
				//canceled selection
				$scope.opened = false;
			});
		};	
};

geopointSelectorController.$inject = ['$scope', '$modal'];

angular.module('myApp').directive("geopointSelector", [function () {
	var uniqueId = 1;

	return {
		require: ['ngModel'],
		controller: geopointSelectorController,
		restrict: 'E',
		replace: true,
		scope: {
			location: "=ngModel",
			id: "@",
			placeholder: "@",
			opts: "@",
			readonly : "=ngReadonly",
			required : "=ngRequired"
		},
		templateUrl: '/app/directives/geopointSelector.html',

		link: function (scope, elem) {  //, attr

			if (scope.id === null) {
				scope.id = 'geopointSelector' + uniqueId++;
			}
			elem.find('input01').attr('id' , scope.id + 'Lat');		
			elem.find('input02').attr('id' , scope.id + 'Lng');		
			elem.find('input01').attr('placeholder' , 'Latitude');
			elem.find('input02').attr('placeholder' , 'Longitude');

			if (scope.location === null) {
				scope.location = {
					type : "Point",
					coordinates: [null, null]
				};
			}
		}
	};
	
}]);
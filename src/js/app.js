/**
 * Includes functionality to setup the Google Map, use geolocation, and stores
 * map options.
 */
var MyMap = {
	latLng: null,
	mapOptions: {},
	myMap: null,
	observablePlacesArray: null,

  init: function(observablePlacesArray) {
		this.observablePlacesArray = observablePlacesArray;

    if(typeof google === 'object' && typeof google.maps === 'object') {
      this.createMap();
			//this.findUserLocation();
		} else {
			$('#map-canvas').append('Oops...something went wrong. Try back later!');
		}
	},

  createMap: function() {
		this.latLng = new google.maps.LatLng(53.348, -6.2597);
		this.mapOptions = {
			center: this.latLng,
			zoom: 15,
			mapTypeId: google.maps.MapTypeId.ROADMAP,
			zoomControl: true,
			zoomControlOptions: {
		    style: google.maps.ZoomControlStyle.DEFAULT
		  }
		};

    this.map = new google.maps.Map(document.getElementById("map-canvas"), this.mapOptions);
    google.maps.event.addListener(MyMap.map, 'idle', function() {
        Places.getPlaces();
    });
	},

  findUserLocation: function() {
		/**
		* Try HTML5 geolocation, if request to share location is not granted by the
		* user, this code will not run and default latLng will be used.
		*/
		if(navigator.geolocation) {
			navigator.geolocation.getCurrentPosition(function(position) {
				var pos = new google.maps.LatLng(position.coords.latitude,
																				position.coords.longitude);
				var infowindow = new google.maps.InfoWindow({
					map: map,
					position: pos,
					content: 'Location found!'
				});

        map.setCenter(pos);
			}, function() {
				handleNoGeolocation(true);
			});
		} else {
			// Browser doesn't support Geolocation
			handleNoGeolocation(false);
		}

		var handleNoGeolocation = function(errorFlag) {
			var content = '';

      if(errorFlag) {
				content = 'Error: The Geolocation service failed :/';
			} else {
				content = 'Error: Your browser doesn\'t support geolocation :(';
			}

      var options = {
				map: map,
				position: latLng,
				content: content
			};

      var infowindow = new google.maps.InfoWindow(options);
			map.setCenter(options.position);
		};
	}
};

/**
 * Gets and stores places using Google Places API based on the map's current
 * bounds.
 */
var Places = {
  myPlaces: [],
  placeIds: new Set(),

  getPlaces: function() {
    var services;
    var mapBounds = MyMap.map.getBounds();

    var request = {
      location: MyMap.latLng,
      bounds: mapBounds,
      rankBy: google.maps.places.RankBy.PROMINENCE,
      types: ['museum']
    };

    service = new google.maps.places.PlacesService(MyMap.map);
    service.nearbySearch(request, this.callback);
  },

  callback: function(results, status) {
    if(status == google.maps.places.PlacesServiceStatus.OK) {
      for(var i = 0; i < results.length; i++) {
        var myPlace = results[i];

        if(!Places.placeIds.has(myPlace.place_id)) {
          Places.placeIds.add(myPlace.place_id);
          Places.myPlaces.push(myPlace);
          console.log(myPlace.name);

					MyMap.observablePlacesArray.push(new Place(myPlace));
        }
      }
    }
  }
};

var Place = function(data) {
	var self = this;

	this.name = ko.observable(data.name);
  this.latLng = ko.observable(data.geometry.location);

	this.marker = new google.maps.Marker({
									position: data.geometry.location,
									map: MyMap.map,
									title: data.name
								});
};




var ViewModel = function() {
	var self = this;

  this.places = ko.observableArray([]);
  this.currentPlace = ko.observable();

  MyMap.init(self.places);
};

$(function() {
  ko.applyBindings(new ViewModel());
});

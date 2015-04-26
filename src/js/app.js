$(function() {
  /**
   * Includes functionality to setup the Google Map, use geolocation, and stores
   * map options.
   */
  var MyMap = {
  	latLng: null,
  	mapOptions: {},
  	myMap: null,

  	init: function() {
  		if(typeof google === 'object' && typeof google.maps === 'object') {
        this.createMap();
  			//this.findUserLocation();
  		} else {
  			$('#map-canvas').append('Oops...something went wrong. Try back later!');
  		}
  	},

  	createMap: function() {
  		latLng = new google.maps.LatLng(53.2734, -7.778320310000026);
  		mapOptions = {
  									  center: latLng,
  										zoom: 8,
  										mapTypeId: google.maps.MapTypeId.ROADMAP,
  										zoomControl: true,
  										zoomControlOptions: {
  										style: google.maps.ZoomControlStyle.DEFAULT
  										}
  									};

  		this.map = new google.maps.Map(document.getElementById("map-canvas"), mapOptions);
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

	var ViewModel = function() {
		var self = this;
	};

  MyMap.init();
  ko.applyBindings(new ViewModel());
});

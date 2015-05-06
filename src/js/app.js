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
			$('#search-bar').css({'display': 'none'});
			$('#list-view-control').css({'display': 'none'});
			$('#map-canvas').append('<h2 class="error-message">We had trouble loading Google Maps. Please try refreshing the page or try again later.</h2>');
		}
	},

	createMap: function() {
		this.latLng = new google.maps.LatLng(53.348, -6.2597);
		this.mapOptions = {
			center: this.latLng,
			zoom: 12,
			mapTypeId: google.maps.MapTypeId.ROADMAP,
			disableDefaultUI: true
		};

    this.map = new google.maps.Map(document.getElementById("map-canvas"), this.mapOptions);

		google.maps.event.addListener(MyMap.map, 'idle', function() {
			Places.getPlaces();
    });

		google.maps.event.addDomListener(window, 'resize', function() {
			var center = MyMap.map.getCenter();

			google.maps.event.trigger(MyMap.map, "resize");
      MyMap.map.setCenter(center);
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
          Places.myPlaces.push(new Place(myPlace));
					MyMap.observablePlacesArray.push(Places.myPlaces[Places.myPlaces.length-1]);

					console.log(myPlace.name);
        }
      }
    }
  }
};

var Place = function(data) {
	var self = this;

	this.name = ko.observable(data.name);
  this.latLng = ko.observable(data.geometry.location);
	this.infowindowContent =  null;
	this.infowindow = new google.maps.InfoWindow();
	this.hasWikiResponse = false;

	this.marker = new google.maps.Marker({
									position: data.geometry.location,
									map: MyMap.map,
									title: data.name
								});

	google.maps.event.addListener(self.marker, 'click', function() {
		self.openInfowindow();
	});

	this.openInfowindow = function() {
		if(self.hasWikiResponse === false) {
			self.getWikiArticle();
		}

		MyMap.map.setCenter(self.marker.position);
		MyMap.map.panBy(0, -150);

		self.marker.setAnimation(google.maps.Animation.BOUNCE);
		setTimeout(function(){self.marker.setAnimation(null); }, 1350);

		self.infowindow.open(MyMap.map, self.marker);
	};

	this.getWikiArticle = function() {
    var wikiUrl = 'http://en.wikipedia.org/w/api.php?action=opensearch&search=' + data.name + '&format=json&callback=wikiCallback';
    var infowindowStartTags = '<div class="infowindow">';
		var infowindowEndTags = '</div>';

		infowindowContent = '<h3>' + data.name + '</h3>';

		/**
		 * Sets infowindow content to be an error message in the event that the
		 * Wikipedia Ajax request does not recieve a response within 1 sec.
		 */
		var wikiRequestTimeout = setTimeout(function() {
      self.infowindowContent = infowindowStartTags +
			                         infowindowContent +
			                         '<p>Failed to reach Wikipedia</p>' +
															 infowindowEndTags;
			self.infowindow.setContent(self.infowindowContent);
    }, 1000);

		/**
		 * JSONP Ajax request to Wikipedia. Sets infowindow content according to the
		 * response.
		 */
		$.ajax({
      url: wikiUrl,
      dataType: 'jsonp',
      success: function(response) {
        var entry = response;

				if(entry[2][0] != null) {
				  self.infowindowContent = infowindowStartTags +
					                         infowindowContent +
																	 '<p>' + entry[2][0] + '</p>' +
				  												 '<a href="' + entry[3][0] + '" target="_blank">Read the full Wikipedia article</a>' +
																	 infowindowEndTags;
				} else {
					self.infowindowContent = infowindowStartTags +
					                         infowindowContent +
					                         '<p>No wikipedia article found for this location. ' +
																	 'Please consider requesting an article be created. </p>' +
																	 '<a href="http://en.wikipedia.org/wiki/Wikipedia:Requested_articles" target="_blank">Find out how to request an article</a>' +
																	 infowindowEndTags;
				}

				self.infowindow.setContent(self.infowindowContent);
				self.hasWikiResponse === true;
				clearTimeout(wikiRequestTimeout);
      }
    });

    self.infowindow.setContent(self.infowindowContent);
	};
};

var ViewModel = function() {
	var self = this;

  self.places = ko.observableArray([]);
  self.currentPlace = ko.observable();
	self.query = ko.observable('');
	self.listViewVisible = ko.observable(false);

  /**
	 * Searches for input in the names of all places and adds them to the
	 * ViewModels's list of places, shown in the listView, if there is match.
	 */
	self.search = function(value) {
		self.places.removeAll();

		for(var i = 0 ; i < Places.myPlaces.length; i++) {
      if(Places.myPlaces[i].name().toLowerCase().indexOf(value.toLowerCase()) >= 0) {
				Places.myPlaces[i].marker.setVisible(true);
				self.places.push(Places.myPlaces[i]);
      } else {
				Places.myPlaces[i].marker.setVisible(false);
			}
    }

		// The listView will be set to visible as long as there is something input.
		if(value.length > 0) {
			self.listViewVisible(true);
		}
	};

	self.query.subscribe(self.search);

	self.selectCurrentPlace = function(place) {
		place.openInfowindow();

		if(!window.matchMedia("(min-width: 1200px)").matches) {
			self.toggleListViewVisibility();
		} else {
			MyMap.map.panBy(-300, 0);
		}
	};

	self.toggleListViewVisibility = function() {
		self.listViewVisible(!self.listViewVisible());
	};

  MyMap.init(self.places);
};

$(function() {
  ko.applyBindings(new ViewModel());
});

//Restaurant object

var Restaurant = function(name, vicinity, rating, currentMap, markerLocation) {
	this.name = name;
	this.address = vicinity;
	this.rating = rating;
	this.map = currentMap;
	this.marker = markerLocation;
}


//View Model

var ViewModelMapApp = function() {
	var self = this;
	self.searchStr  = ko.observable("");
	//the current restaurant list according to search results
	self.RestaurantsList = ko.observableArray();
	self.removedRestaurants = [];
	self.markers = [];
	self.cityExists = ko.observable(false);
	self.city = "";
	self.modal = ko.observable("");
	self.setMapOnAll = function(map) {
	  for (var i = 0; i < self.markers.length; i++) {
	    self.markers[i].setMap(map);
	  }
	}

	//Init map, markers and initialRestaurants
	self.initMap = function() {
		//use the city that the user provides
		self.city = $("#city").val();
		var APIstr = 'https://maps.googleapis.com/maps/api/geocode/json?address=' + self.city + '&key=AIzaSyB3s6wU-Afuxk4TObkyqm6oXctRAnksNNg';
		var lat, lng;

		//initialize all arrays and values

		self.RestaurantsList([]);
		self.removedRestaurants = [];
		self.markers = [];

		//Ajax request to get coordinates of the requested city and load the map
		$.getJSON(APIstr).done(function(data) {
			lat = data.results[0].geometry.location.lat;
			lng = data.results[0].geometry.location.lng;
			self.cityExists(true);
			var loc = new google.maps.LatLng(lat, lng);
			var map = new google.maps.Map(document.getElementById('map'), {
			  center: loc,
			  scrollwheel: false,
			  zoom: 10
			});

			var request = {
			    location: loc,
			    radius: '500',
			    types: ['restaurant'],
			    maxprice: 1
			  };

			// Create the PlaceService and send the request.
			// Handle the callback with an anonymous function.
			var service = new google.maps.places.PlacesService(map);
			service.nearbySearch(request, function(results, status) {
				// If the request succeeds, draw the place location on
				// the map as a marker, and register an event to handle a
				// click on the marker.
				if (status == google.maps.places.PlacesServiceStatus.OK) {
					for (var i = 0; i < results.length; i++) {
					  	var place = results[i];
					  	//I check if rating for restaurant exists
					   	if (!place.rating) {
						    place.rating = "No rating provided";
					   	}
				   	   	else {
					    	place.rating = place.rating.toString();
					   	}

					   	//create markers and add them to an array for manipulation
					   	var markers = [];
					    var marker = new google.maps.Marker({
						    map: map,
					     	position: place.geometry.location
						});
						self.markers.push(marker);



				   		//create new Restaurant and add it to my list of restaurants
					    self.RestaurantsList.push( new Restaurant(place.name, place.vicinity, place.rating, map, marker.position) );

					    //display streetview thumbnail when user hovers on marker
					    (function (i) {
							google.maps.event.addListener(self.markers[i], 'mouseover', function() {
								console.log(self.markers[i].position.lng());
								var contentStr = '<h5><strong>' + self.RestaurantsList()[i].name + '</strong></h5>' + 
											  '<div id="infoWindowStreetview"><img src="https://maps.googleapis.com/maps/api/streetview?size=200x200&location=' + self.RestaurantsList()[i].marker.lat() + ',' + self.RestaurantsList()[i].marker.lng() + '&heading=151.78&pitch=-0.76&key=AIzaSyBS025Zl1N-CLVM05-O0_vVO-4heTIpP38"></div>';
									
											  console.log(contentStr);
								var infowindow = new google.maps.InfoWindow({
								    	content: contentStr
								  	});

								infowindow.open(map, self.markers[i]);
								//close infoWindow on mouseout
								google.maps.event.addListener(self.markers[i], 'mouseout', function() {
									infowindow.close();
								});
							});
						})(i);

					}
				}
			});
			}).error(function() {
				console.log("error");
				self.cityExists(false);
		});
		
		//Add an h2 DOM element
		self.city = self.city.toLowerCase();
		var cityRefinded = self.city.charAt(0).toUpperCase() + self.city.slice(1);
		$('#restaurantHeader').text('Restaurants in downtown ' + cityRefinded + '');
		
	};	

	//search through initialRestaurants function using the updated searchStr


	self.search = function() {
		//Hide all markers from map
		self.setMapOnAll(null);
		var str, strRestaurant;
		str = self.searchStr().toLowerCase();
		//check first if the name exists in the current restaurant list
		//if not remove the elements
		for (var i=0; i<self.RestaurantsList().length; i++) {
			strRestaurant = self.RestaurantsList()[i].name.toLowerCase();
			if (strRestaurant.indexOf(str) == -1) {
				self.restaurant = self.RestaurantsList()[i];
				self.removedRestaurants.push(self.restaurant);
				self.RestaurantsList.splice(i, 1);
				i--;
			}
		}
		
		//or if the subString is found on the initial Restaurants list
		//add the restaurant again to the current list
		//and remove it from the removedRestaurants list
		for (var j=0; j<self.removedRestaurants.length; j++) {
			strRestaurant = self.removedRestaurants[j].name.toLowerCase();
			if (strRestaurant.indexOf(str) > -1) {
				self.restaurant = self.removedRestaurants[j];
				self.RestaurantsList.push(self.restaurant);
				self.removedRestaurants.splice(j, 1);
				j--;
			}
		}

		//Make the corresponding markers visible
		for (i in self.RestaurantsList()) {
			self.markers[i].setMap(self.RestaurantsList()[i].map);
		}
	}

}



ko.applyBindings(new ViewModelMapApp());

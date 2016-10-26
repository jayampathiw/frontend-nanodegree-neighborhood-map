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
			  zoom: 16
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
				if (status === google.maps.places.PlacesServiceStatus.OK) {
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
			if (strRestaurant.indexOf(str) === -1) {
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
	
	self.infoFunction = function(restaurant) {
		$('.modal-title').text("Information and review about " + restaurant.name + "");
		self.YelpRequest(restaurant.name, restaurant.address);
	}

	self.YelpRequest = function(name, address) {
		function nonce_generate() {
			return (Math.floor(Math.random() * 1e12).toString());
		};

		var yelp_url = 'https://api.yelp.com/v2/search?';

	    var parameters = {
	   		term: "restaurant",
	    	location: address,
	    	radius_filter: "0.1",
	    	limit: 1,
	    	oauth_consumer_key: 'wpu8WCsLsM8HWhWKBevgoQ',
	    	oauth_token: 'zFrQV7GKkgtDmbSMrMMFOZ5xyPVB_Ps8',
	    	oauth_nonce: nonce_generate(),
	    	oauth_timestamp: Math.floor(Date.now()/1000),
	    	oauth_signature_method: 'HMAC-SHA1',
	    	oauth_version: '1.0',
	    	callback: 'cb'             // This is crucial to include for jsonp implementation in AJAX or else the oauth-signature will be wrong.
	  	};
		  
		var consumer_secret = 'trm_jAkT2XCvzDDgxPo2Uuj5vvg',
		    token_secret = 'y8W6EkCA9o-DR4t5m14RZ30ePlg';
		      
		var encodedSignature = oauthSignature.generate('GET', yelp_url, parameters, consumer_secret, token_secret);
		  parameters.oauth_signature = encodedSignature;

		// Send AJAX query via jQuery library.
		$.ajax({
		    url: yelp_url,
		    data: parameters,
		    cache: true,                // This is crucial to include as well to prevent jQuery from adding on a cache-buster parameter "_=23489489749837", invalidating our oauth-signature
		    dataType: 'jsonp',
		    //jsonpCallback: 'cb',
		    success: function(results) {
		      self.modal("<p>Please wait untill Yelp find the requested restaurant!</p>");
		      // Do stuff with results
		      //See if the requested restaurant exists in Yelp database
		      try {
			      var location = results.businesses[0].location.address[0];
			      var locationArray, categories;
			      console.log("SUCCCESS! %o", results);
			      if (location === undefined || location === null) {
			    	  self.modal("<p>no information available for this location from Yelp</p>");
			      }
			      else {
				      locationArray = location.split(" ");
				      location = locationArray[0] + " " + locationArray[1];
				      if (address.indexOf(location) >= 0) {
				      	categories = results.businesses[0].categories[0][1];
				      	self.modal('<h3>' + name + '</h3><p>Category: ' + categories + '</p>'
				      				+ '<img src="' + results.businesses[0].rating_img_url + '"><br>'
				      				+ '<img src="' + results.businesses[0].image_url + '"><br><br>'
				      				+ "<p>Visit the restaurant's Yelp " + '<a href="' + results.businesses[0].url + '">page</a><br>' 
				      				+ '<p>And a review snippet:<br><br> "' + results.businesses[0].snippet_text + '"</p>');
				      }
	
				      else {
				      	self.modal("<p>Sorry, Yelp couldn't find the requested restaurant!</p>");
				      }
			      } 
		      }
		      catch(err) {
		    	  console.log("error");
			      self.modal("<p>no information available for this location from Yelp</p>");
		      }
		    },
		    error: function(error) {
		      // Do stuff on fail
		      console.log("error");
		      self.modal("<p>Sorry, Yelp doesn't support your city!</p>");
		    }
		});

	}

	$("#city").val("Colombo");
	self.initMap();
}



ko.applyBindings(new ViewModelMapApp());

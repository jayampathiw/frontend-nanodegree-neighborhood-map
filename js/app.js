//Restaurant object

var Restaurant = function(name, vicinity, rating, currentMap, marker) {
	this.name = name;
	this.address = vicinity;
	this.rating = rating;
	this.map = currentMap;
	this.marker = marker;
}

var basicInfowindow, defaultIcon, clickedIcon;

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
	
	basicInfowindow = new google.maps.InfoWindow();
	defaultIcon = makeMarkerIcon('a82848');
	clickedIcon = makeMarkerIcon('f79336');

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
						
						self.clearClickedMarkers();



				   		//create new Restaurant and add it to my list of restaurants
					    self.RestaurantsList.push( new Restaurant(place.name, place.vicinity, place.rating, map, marker) );

					    //display streetview thumbnail when user hovers on marker
					    (function (i) {
							google.maps.event.addListener(self.markers[i], 'mouseover', function() {
								self.clearClickedMarkers();
								console.log(self.markers[i].position.lng());
								var contentStr = '<h5><strong>' + self.RestaurantsList()[i].name + '</strong></h5>' + 
											  '<div id="infoWindowStreetview"><img src="https://maps.googleapis.com/maps/api/streetview?size=200x200&location=' + self.RestaurantsList()[i].marker.position.lat() + ',' + self.RestaurantsList()[i].marker.position.lng() + '&heading=151.78&pitch=-0.76&key=AIzaSyBS025Zl1N-CLVM05-O0_vVO-4heTIpP38"></div>';
									
								console.log(contentStr);
								if(basicInfowindow === null || basicInfowindow === undefined){
									basicInfowindow = new google.maps.InfoWindow();
								} else {
									basicInfowindow.close();
								}
								basicInfowindow.setContent(contentStr); 

								basicInfowindow.open(map, self.RestaurantsList()[i].marker);
								//close infoWindow on mouseout
								google.maps.event.addListener(self.markers[i], 'mouseout', function() {
									basicInfowindow.close();
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
		//self.YelpRequest(restaurant.name, restaurant.address);
		self.showmakerInfowindow(restaurant);
	}
	
	self.showmakerInfowindow = function(restaurant) {
		self.clearClickedMarkers();
		console.log(restaurant.marker.position.lng());
		
		self.YelpRequest(restaurant.name, restaurant.address, restaurant.marker);
		
		restaurant.marker.clicked = true;
		restaurant.marker.setIcon(clickedIcon);

	}
	
	self.clearClickedMarkers = function() {
		for (var i = 0; i < self.markers.length; i++) {
		    self.markers[i].setIcon(defaultIcon);
		}
	};
	
	self.YelpRequest = function(name, address, marker){
		var auth = {
                //
                // Update with your auth tokens.
                //
                consumerKey: "GxDpARmBNKqhlcndGphepQ",
                consumerSecret: "NuvRdCz-quyCL9mFKTX-nRXA6yE",
                accessToken: "4yfVCfvWUDAkAUOJiPw0XGawdbX6mcuR",
                accessTokenSecret: "Gk7hczpEfoeVj-CDOEZY-vcKPSM",
                serviceProvider : {
                    signatureMethod : "HMAC-SHA1"
                }
            };
    
            var terms = 'restaurant';
            var near = address;
            
    
            var accessor = {
                consumerSecret : auth.consumerSecret,
                tokenSecret : auth.accessTokenSecret
            };

            var parameters = [];
            parameters.push(['term', terms]);
            parameters.push(['location', near]);
            parameters.push(['radius_filter', '0.1']);
            parameters.push(['limit', 1]);
            parameters.push(['callback', 'cb']);
            parameters.push(['oauth_consumer_key', auth.consumerKey]);
            parameters.push(['oauth_consumer_secret', auth.consumerSecret]);
            parameters.push(['oauth_token', auth.accessToken]);
            parameters.push(['oauth_signature_method', 'HMAC-SHA1']);

            var message = {
                'action' : 'https://api.yelp.com/v2/search',
                'method' : 'GET',
                'parameters' : parameters
            };
    
            OAuth.setTimestampAndNonce(message);
            OAuth.SignatureMethod.sign(message, accessor);
    
            var parameterMap = OAuth.getParameterMap(message.parameters);
                
            $.ajax({
                url : message.action,
                data : parameterMap,
                dataType : 'jsonp',
                success : function (results){
                	if (results.businesses && results.businesses.length > 0) {
                   	 var business = results.businesses[0],
                        name = business.name,
                        img = business.image_url,
                        rating_img = business.rating_img_url,
                        phone = /^\+1/.test(business.display_phone) ? business.display_phone : '',
                        url = business.url,
                        count = business.review_count,
                        stars = business.rating_img_url,
                        rate = business.rating,
                        snippet_text = business.snippet_text
                        loc = {
                            lat: business.location.coordinate.latitude,
                            lon: business.location.coordinate.longitude,
                            address: business.location.display_address[0] + '<br>' + business.location.display_address[business.location.display_address.length - 1]
                        },
                        review = {
                            img: business.snippet_image_url,
                            txt: business.snippet_text
                        };
                    
               	     var address = loc.address;
               	     var contentStr = '<h3>' + name + '</h3><p>Name: ' + name + '</p>'
	      				+ '<img src="' + rating_img + '"><br>'
	      				+ '<img src="' + img + '"><br><br>'
	      				+ "<p>Visit the restaurant's Yelp " + '<a href="' + url + '">page</a><br>' 
	      				+ '<p>And a review snippet:<br><br> "' + snippet_text + '"</p>';
               	     
               	     	console.log("cb: " + contentStr);
               	     
               	     	if(basicInfowindow === null || basicInfowindow === undefined){
	            			basicInfowindow = new google.maps.InfoWindow();
	            		} else {
	            			basicInfowindow.close();
	            		}
	            		basicInfowindow.setContent(contentStr); 
	
	            		basicInfowindow.open(map, marker);
                   } else {
                	    var searchedFor = $('input').val();
                	    
	   		            if(basicInfowindow === null || basicInfowindow === undefined){
	   	        			basicInfowindow = new google.maps.InfoWindow();
	   	        	    } else {
	   	        			basicInfowindow.close();
	   	        	    }
	   	        	    basicInfowindow.setContent("<p>Sorry, Yelp couldn't find the requested restaurant!</p>"); 
	   
	   	        	    basicInfowindow.open(map, marker);
                   }
                },
                cache: true
            })
            .done(function(data, textStatus, jqXHR) {
                    console.log('success[' + data + '], status[' + textStatus + '], jqXHR[' + JSON.stringify(jqXHR) + ']');
                }
            )
            .fail(function(jqXHR, textStatus, errorThrown) {
                                console.log('error[' + errorThrown + '], status[' + textStatus + '], jqXHR[' + JSON.stringify(jqXHR) + ']');
                    }
            );
	}

	$("#city").val("San Francisco");
	self.initMap();
}



ko.applyBindings(new ViewModelMapApp());


//Create a new marker with the passed in color
function makeMarkerIcon(markerColor) {
  var markerImage = new google.maps.MarkerImage(
    'http://chart.googleapis.com/chart?chst=d_map_spin&chld=1.15|0|'+ markerColor +
    '|40|_|%E2%80%A2',
    new google.maps.Size(21, 34),
    new google.maps.Point(0, 0),
    new google.maps.Point(10, 34),
    new google.maps.Size(21,34));
  return markerImage;
}

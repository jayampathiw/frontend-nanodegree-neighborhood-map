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
	self.city = ko.observable("");
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
		var APIstr = 'https://maps.googleapis.com/maps/api/geocode/json?address=' + self.city() + '&key=AIzaSyB3s6wU-Afuxk4TObkyqm6oXctRAnksNNg';
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
							google.maps.event.addListener(self.markers[i], 'click', function() {								
								self.showmakerInfowindow(self.RestaurantsList()[i]);
							});
						})(i);

					}
				} else {
					console.log("error");
					self.cityExists(false);
					$("#modelHeadder").text("Worning");
					$("#message").html("<p>Couldn't find the requested restaurants!</p>");
					$("#infoModal").modal({backdrop: "static"});
					
				}
			});
			}).fail(function(jqXHR, status, error){
				console.log('error[' + error + '], status[' + status + '], jqXHR[' + JSON.stringify(jqXHR) + ']');
				self.cityExists(false);
				$("#modelHeadder").text("Error");
				$("#message").html("<p>Error occurred while searching the requested restaurants!</p>");
				$("#infoModal").modal({backdrop: "static"});
		});
		
		//Add an h2 DOM element
		self.city(self.city().toLowerCase());
		var cityRefinded = self.city().charAt(0).toUpperCase() + self.city().slice(1);
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
		
		//Opening the info window
		if(basicInfowindow === null || basicInfowindow === undefined){
			basicInfowindow = new google.maps.InfoWindow();
		} else {
			basicInfowindow.close();
		}
		basicInfowindow.setContent(""); 
		basicInfowindow.open(map, restaurant.marker);
		
		
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
                
            var request = $.ajax({
                url : message.action,
                data : parameterMap,
                dataType : 'jsonp',
                cache: true
            })
            .done(function(results, textStatus, jqXHR) {
                    console.log('success[' + results + '], status[' + textStatus + '], jqXHR[' + JSON.stringify(jqXHR) + ']');
                    if(textStatus === "success"){
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

		    		         var contentStr = '<div class="yelpInfoWindow"><div class="media">';
		    		          	 contentStr += '<a class="media-left" href="#">';
		    		          	 contentStr += '<img class="media-object" src="'+ img +'" alt="Generic placeholder image">';
		    		          	 contentStr += '</a><div class="media-body">';
		    		          	 contentStr += '<h4 class="media-heading">Media heading</h4>';
		    		          	 contentStr += '<span>' + count + ' Reviews </span>';
		    		          	 //contentStr += '<p>' + snippet_text + '</p>';
		    		          	 contentStr += '<img src="' + stars + '" height=17 width=84 alt="Yelp Rating" class="img-responsive">';
		    		          	 contentStr += '<p><a class="btn btn-default btn-small" href="' + url + '" target="_blank">Yelp it!</a></p>';
		    		          	 contentStr += '</div></div></div>';
		    		          	 
    		          	     
    		          	     console.log("cb: " + contentStr);
    		          	     
    		          	     basicInfowindow.setContent(contentStr); 
    		
    		              } else {
    		            	  basicInfowindow.setContent("<p>Sorry, Yelp couldn't find the requested restaurant!</p>"); 
    		              }
                    }
                }
            )
            .fail(function(jqXHR, textStatus, errorThrown) {
            	console.log('error[' + errorThrown + '], status[' + textStatus + '], jqXHR[' + JSON.stringify(jqXHR) + ']');
                basicInfowindow.setContent("<p>Sorry, Error occurred while Yelp requested restaurant!</p>"); 
            });
	}

	self.city("San Francisco");
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
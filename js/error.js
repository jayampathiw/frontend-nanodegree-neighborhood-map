function googleMapError(){
	$("#modelHeadder").text("Error");
	$("#message").html("<p>Error occurred while loading google maps!</p>");
	$("#infoModal").modal({backdrop: "static"});
}
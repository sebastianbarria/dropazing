<?php
	/*
	This is a demo file
	You should recieve each uploaded file using $_FILES (with the name defined on uploadUrl) and then process it
	After that you should show some message on screen (that will be the ajax response)
	
	In this advanced example you could show on screen a json response. That way you could pass a lot more information to the javascript function (defined on onSuccess and onError) that will process the response
	*/
	
	$response=array(
		0=>array(
			"status"=>false,
			"message"=>"Error uploading file",
			"size"=>0
		),
		1=>array(
			"status"=>true,
			"message"=>"File uploaded correctly",
			"size"=>35603
		)
	);
	
	//this line will return a random message (success or error), so you could try the demo
	echo json_encode($response[rand(0,1)]);
?>
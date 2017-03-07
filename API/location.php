<?php
session_start();
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Origin");

if( !isset($_SESSION["first"]) ){
	$_SESSION["first"] = time();
}
$sId = session_id();

/*
* Je n'ai pas réussi à paramétrer Easy-PHP pour éviter que la session ne soit
* détruite et recréé à chaque appel du fichier php, et j'ai eu le même problème
* sur un hevergeur internet gratuit.
* J'ai donc été obligé de stocker le temps de première connexion en js
*/

if( isset($_GET["first_time"]) && isset($_GET["time_factor"]) ){
	$time_factor = $_GET["time_factor"];
  $location = update_iss($time_factor);
  $result = json_encode($location);

  echo $result;
}
exit();


function update_iss($time_factor){
	$earth = array("radius" => 6371,    //km
                "speed" => 1/240,   //rad/sec
                "rotation" => 0);	// rad

	$iss = array("speed" => 7+2/3,    // km/sec
				"altitude" => 400,
				"angle" => 51.64,       // deg

				"polar" => 0.5*pi(),   // rad
				"azimuth" => 0);		// rad

  $time = time();
  $dt = ($time - $_GET["first_time"]);    // sec

  $iss["azimuth"] = $time_factor*$dt * $iss["speed"]/($iss["altitude"] + $earth["radius"]);		//rotation de l'ISS

  $x = $earth["radius"] * cos($iss["azimuth"])*sin($iss["polar"]);   //coordonnées dans le repère lié à l'ISS
  $y = $earth["radius"] * sin($iss["azimuth"])*sin($iss["polar"]);
  $z = $earth["radius"] * cos($iss["polar"]);

  $rot_angle = deg_rad($iss["angle"]);   // rotation pour l'inclinaison de l'ISS
  $rotation = rotate($x,$y,$z,$rot_angle,"y");
  $x = $rotation[0]; $y = $rotation[1]; $z = $rotation[2];

  $earth["rotation"] = $time_factor*$dt * 2*pi()/86400;   // rotation de la Terre

  $rotation = rotate($x,$y,$z,$earth["rotation"],"z");
  $x = $rotation[0]; $y = $rotation[1]; $z = $rotation[2];

  $temp = ($z/$earth["radius"]);
  $latitude= rad_deg( asin($temp) );
  $longitude = rad_deg( atan2($y,$x) );

	if($longitude > 180){ $longitude -= 360; }

  return array("latitude" => $latitude, "longitude" => $longitude);
}

function rotate($x,$y,$z,$angle,$axis){
  switch($axis){
    case 'x':
      $x_ = $x;
      $y_ = $y*cos($angle) - $z*sin($angle);
      $z_ = $y*sin($angle) + $z*cos($angle);
      break;

    case 'y':
      $x_ = $z*sin($angle) + $x*cos($angle);
      $y_ = $y;
      $z_ = $z*cos($angle) - $x*sin($angle);
      break;

    case 'z':
      $x_ = $x*cos($angle) - $y*sin($angle);
      $y_ = $x*sin($angle) + $y*cos($angle);
      $z_ = $z;
      break;
  }
  return array($x_,$y_,$z_);
}

function rad_deg($rad){
	$deg = $rad*180/pi();
	return fmod($deg,360.0);
}

function deg_rad($deg){
	$rad = $deg*180/pi();
	return fmod($rad,2*pi());
}
?>

<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Origin");

if(isset($_POST['lat']) && isset($_POST['lng'])){
  $result = callAPI($_POST['lat'],$_POST['lng']);
  $xml = new SimpleXMLElement($result);
  $geoname = json_encode($xml);

  echo $geoname;
  exit();
}

function callAPI($lat,$lng){
  $url = "http://api.geonames.org/extendedFindNearby?lat=".strval($lat)."&lng=".strval($lng)."&username=cocyte";
  $result = file_get_contents($url);
  return $result;
}
?>

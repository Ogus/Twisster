window.onload = function(){
  //Création des objets JS associé aux éléments DOM
  var map_element = document.getElementById("map");
  var lat_text = document.getElementById("lat");
  var long_text = document.getElementById("long");

  var debug_option = document.getElementById("debug_checkbox");
  var time_factor = document.getElementById("time_factor");

  var tile_list = document.getElementsByName("tile");
  var zoom_list = document.getElementsByName("zoom");
  var follow_option = document.getElementById("follow");
  var tweet_button = document.getElementById("tweet_button");

  var prev_dismiss = document.getElementById("preview_dismiss");
  var prev_accept = document.getElementById("preview_accept");

  var map_layer, tile_layer, marker,polyline;
  var ajax_position, ajax_geoname;
  var position={lat: 999, lng: 0}, old_position={lat: 0, lng: 0}, zoom_level = 3, tile_layer_option = "street";
  var first_time;

  var loaded = false;

  //icone personnalisé
  var station_icon = L.icon({
      iconUrl: 'img/ic_station.png',
      shadowUrl: 'img/ic_shadow.png',
      iconSize:     [30, 30],
      shadowSize:   [30, 30],
      iconAnchor:   [15, 15],
      shadowAnchor: [15, 15],
      popupAnchor:  [0, -15]
  });



  init();
  function init(){    //initialisation des écouteurs d'évènements et de la carte
    for(var i=0; i<tile_list.length; i++){
      tile_list[i].addEventListener('click', set_tile_layer, false);
    }

    for(var i=0; i<zoom_list.length; i++){
      zoom_list[i].addEventListener('click', set_zoom, false);
    }

    follow_option.addEventListener('click', function(){
      if(follow_option.checked == true){ map_layer.panTo(position); }
    }, false);

    tweet_button.addEventListener('click', generate_tweet, false);    //bouton pour lancer la génération du tweet

    prev_dismiss.addEventListener('click', function(){    //bouton pour annuler le tweet
    window.setTimeout(function(){ document.getElementById("overlay").style.top = "100%"; }, 800);
      document.getElementById("preview").style.top = "150%";
    });

    debug_option.addEventListener('change', function(){
      set_debug();
    }, false);


    map_layer = L.map('map').setView([48.853, 2.345], zoom_level);
    // map_layer.remove();
    marker = L.marker([], {icon: station_icon});
    marker.bindPopup("Position de l'ISS");
    polyline = L.polyline([], {color: 'green', smoothFactor: 3.0});

    tile_layer = L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}', {
		attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://mapbox.com">Mapbox</a>',
		maxZoom:18,
		minZoom:1,
		id:tile_layer_option,   //mapbox.mapbox-streets-v7  //mapbox.mapbox-terrain-v2  //mapbox.satellite   //mapbox.streets
		accessToken: 'pk.eyJ1IjoiY2FzdG9yYm90IiwiYSI6ImNpaWkweWQ5ajAwaHV1NmtueHV1MHowcHgifQ.2l9JrRXro_ve9S_pMdTB0Q'
	});
    tile_layer.addTo(map_layer);

    set_zoom();
    set_debug();
    set_tile_layer();
    update();
  }


  //change le zoom de la carte lors du clique sur un radio button
  function set_zoom(){
    for(var i=0; i<zoom_list.length; i++){
      if(zoom_list[i].checked == true){
        zoom_level = zoom_list[i].value;
      }
    }
    map_layer.setZoom(zoom_level);

    if(follow_option.checked == true){ map_layer.panTo(position); }
  }

  function set_debug(){
    clear_map();
    if(debug_option.checked){
      // document.getElementById("debug").style.transform = "translate(0, -50%)";
      // document.getElementById("debug").style.webkitTransform = "translate(0, -50%)";
      document.getElementById("debug").classList.add("hidden");
    }
    else{
      // document.getElementById("debug").style.transform = "translate(205px, -50%)";
      // document.getElementById("debug").style.webkitTransform = "translate(205px, -50%)";%)";
      document.getElementById("debug").classList.remove("hidden");
    }
  }

  function set_tile_layer(){
    for(var i=0; i<tile_list.length; i++){
      if(tile_list[i].checked == true){
        if(tile_layer_option == tile_list[i].value){ return; }
        else{ tile_layer_option = tile_list[i].value; }
      }
    }
    map_layer.removeLayer(tile_layer);

    tile_layer = L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}', {
      attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://mapbox.com">Mapbox</a>',
      maxZoom:18,
    	minZoom:1,
    	id:tile_layer_option,
    	accessToken: 'pk.eyJ1IjoiY2FzdG9yYm90IiwiYSI6ImNpaWkweWQ5ajAwaHV1NmtueHV1MHowcHgifQ.2l9JrRXro_ve9S_pMdTB0Q'
    	});
    map_layer.addLayer(tile_layer);
  }

  function clear_map(){
    for(i in map_layer._layers) {
      if(map_layer._layers[i]._path != undefined){
        try { map_layer.removeLayer(map_layer._layers[i]); }
        catch(e){ console.log("problem with " + e + map_layer._layers[i]); }
      }
    }
  }



  //boucle de requêtes sur la position de l'ISS
  function update(){
    ajax_position = new XMLHttpRequest();

    var url, data;
    if(debug_option.checked){
      if(first_time == undefined){ first_time = parseInt(Date.now()/1000); }
      data = "?time_factor="+time_factor.value+"&first_time="+first_time;
      url = "https://woodbox.000webhostapp.com/location.php"+data;
    }
    else{
      url = "https://api.wheretheiss.at/v1/satellites/25544";		// ou http://api.open-notify.org/iss-now.json
    }

    ajax_position.open("GET",url,true);
    ajax_position.onreadystatechange = function(){
      if(ajax_position.readyState == 4 && ajax_position.status == 200){
        console.log(ajax_position.responseText);
        var json_result = JSON.parse(ajax_position.responseText);    //on récupère la position au format json

        old_position.lat = position.lat;
        old_position.lng = position.lng;
        position.lat = (json_result.latitude).toFixed(6);
        position.lng = (json_result.longitude).toFixed(6);
        update_map();
      }
    };
    ajax_position.send();

    window.setTimeout(update, 2000);    //màj toute les 2 secondes
  }

  //màj de la carte à chaque nouvelle position de l'ISS
  function update_map(){
    marker.setLatLng(position).addTo(map_layer);    //on change la positon du marker

    if(follow_option.checked == true){ map_layer.panTo(position); }     //on change l'emprise de la carte pour suivre l'ISS

    if( !(Math.sign(old_position.lng) != Math.sign(position.lng) && Math.abs(position.lng) > 150) && Math.abs(position.lat - old_position.lat) < 7){
      L.polyline([old_position,position], {color: 'green'}).addTo(map_layer);
    }

    lat_text.innerHTML = "<span>Latitude: </span>"+String(position.lat);
    long_text.innerHTML = "<span>Longitude: </span>"+String(position.lng);
  }




  //génère un faux tweet lors du clique sur le bouton 'tweet comme pesquet'
  function generate_tweet(e){
    e.preventDefault();
    if(position.lat != 999){
      document.getElementById("overlay").style.top = "0";
      document.getElementsByClassName("loading")[0].style.display = "flex";
      load_image();
      load_geoname();
    }
  }

  //charge l'image satellite
  function load_image(){
    zoom_level = map_layer.getZoom();

    var bearing = 90 - Math.floor(180*Math.random());   // entre -180 et 180 degrés, pour garder la photo 'à l'endroit'
    var url = "https://api.mapbox.com/styles/v1/castorbot/ciylak035004z2ro27w5r5p5s/static/"
                +String(position.lng)+","    //position
                +String(position.lat)+","
                +String(zoom_level)+","   //zoom
                +String(bearing)        //bearing
                // +","+String(0.0)          //pitch
                +"/800x800"
                +"?access_token=pk.eyJ1IjoiY2FzdG9yYm90IiwiYSI6ImNpaWkweWQ5ajAwaHV1NmtueHV1MHowcHgifQ.2l9JrRXro_ve9S_pMdTB0Q&attribution=true&logo=false";

    var img = document.getElementById("preview_img");
    img.src = url;
    loaded = false;
    img.addEventListener('load', function(){      //on attend que l'image soit chargé avant de montrer le faux tweet
      if(loaded){
        document.getElementById("preview").style.top = "50%";
        document.getElementsByClassName("loading")[0].style.display = "none";
      }
      else{ loaded = true; }
    }, false);
  }

  //charge la localisation la plus proche
  function load_geoname(){
    var url = "https://woodbox.000webhostapp.com/geoname.php";
    var ajax_geoname = new XMLHttpRequest();
    ajax_geoname.open("POST",url,true);
    ajax_geoname.setRequestHeader("Content-type", "application/x-www-form-urlencoded");

    ajax_geoname.onreadystatechange = function(){
      if(ajax_geoname.readyState == 4 && ajax_geoname.status == 200){
        var json_text = ajax_geoname.responseText;
        var geo = JSON.parse(json_text);

        var text = set_tweet_text(geo);
        document.getElementById("preview_txt").innerHTML = text;

        if(loaded){
          document.getElementById("preview").style.top = "50%";
          document.getElementsByClassName("loading")[0].style.display = "none";
        }
        else{ loaded = true; }
      }
    };

    var data="lat="+String(position.lat)+"&lng="+String(position.lng);
    ajax_geoname.send(data);
    loaded = false;
  }


  function set_tweet_text(geo){
    var location, hashtag;

    //définis le type de localisation et le type de texte du tweet
    if(geo.address != undefined){
      location = geo.address.adminName2;
      hashtag = "#"+(geo.address.adminName1).replace(" ","");
    }
    else if(geo.ocean != undefined){
      location = "the "+geo.ocean.name;
      hashtag = "#BluePlanet"
    }
    else if(geo.geoname != undefined){
      var geo_list = geo.geoname;
      location = geo_list[geo_list.length-1].name;
      hashtag = "#"+(geo.geoname[geo_list.length-1].countryName).replace(" ","");
    }
    else{
      location = geo.countryName;
      hashtag = "";
    }

    var text = "Nice view above "+location+" ! <span class='hashtag'>@Thom_astro "+hashtag+" #ISS</span>";
    return text;
  }




  //function recursive pour convertir un fichier xml en json (non utilisé)
  function xml_to_json(xml){
    var obj = {};

    if(xml.hasChildNodes()){
      for(var i=0; i<xml.childNodes.length; i++){
        var item = xml.childNodes[i];
          if(item.nodeType == 1){ obj[item.nodeName] = xml_to_json(item); }
          else if(item.nodeType == 3 && item.nodeValue != "\n"){ obj = item.nodeValue; }
  		}
    }
    return obj;
  }

}

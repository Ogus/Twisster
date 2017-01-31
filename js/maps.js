window.onload = function(){
  //Création des objets JS associé aux éléments DOM
  var map_element = document.getElementById("map");
  var lat_text = document.getElementById("lat");
  var long_text = document.getElementById("long");

  var zoom_list = document.getElementsByName("zoom");
  var follow_option = document.getElementById("follow");
  var tweet_button = document.getElementById("tweet_button");

  var prev_dismiss = document.getElementById("preview_dismiss");
    var prev_accept = document.getElementById("preview_accept");

  var map_layer, tile_layer, marker,polyline;
  var ajax, json_result, position={lat: 0, lng: 0}, zoom_level = 3;

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
    for(var i=0; i<zoom_list.length; i++){
      zoom_list[i].addEventListener('click', set_zoom, false);
    }

    follow_option.addEventListener('click', function(){
      if(follow_option.checked == true){
        map_layer.panTo(position);
      }
    }, false);

    tweet_button.addEventListener('click', generate_tweet, false);    //bouton pour lancer la génération du tweet

    prev_dismiss.addEventListener('click', function(){    //bouton pour annuler le tweet
      document.getElementById("preview").style.top = "150%";
      document.getElementById("overlay").style.top = "100%";
    })


    map_layer = L.map('map').setView([48.853, 2.345], zoom_level);
    marker = L.marker([], {icon: station_icon});
    polyline = L.polyline([], {color: 'green', smoothFactor: 3.0}).addTo(map_layer);

    tile_layer = L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}', {
      attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://mapbox.com">Mapbox</a>',
      maxZoom:18,
    	minZoom:3,
    	id:'mapbox.streets',   //mapbox.mapbox-streets-v7  //mapbox.mapbox-terrain-v2  //mapbox.satellite
    	accessToken: 'pk.eyJ1IjoiY2FzdG9yYm90IiwiYSI6ImNpaWkweWQ5ajAwaHV1NmtueHV1MHowcHgifQ.2l9JrRXro_ve9S_pMdTB0Q'
    	});
    tile_layer.addTo(map_layer);

    marker.bindPopup("Position de l'ISS");

    set_zoom();
    update();
  }

  window.onload = set_size();
  window.onresize = set_size;

  //recalcule les dimensions de certains éléments
  function set_size(){
    var window_w = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
    var window_h = window.innerHeight || document.documentElement.clientHeight || document.body.clienHeight;
    var scale = Math.min(window_h*0.7,window_w*0.35);

    var temp = document.getElementsByTagName("section");
    for(var i=0; i<temp.length; i++){
      temp[i].style.width = String(scale) + "px";
      temp[i].style.height = String(scale) + "px";
    }
  }

  //change le zoom de la carte lors du clique sur un radio button
  function set_zoom(){
    for(var i=0; i<zoom_list.length; i++){
      if(zoom_list[i].checked == true){
        zoom_level = zoom_list[i].value;
      }
    }
    map_layer.setZoom(zoom_level);
  }

  //boucle de requêtes sur la position de l'ISS
  function update(){
    ajax = new XMLHttpRequest();
    ajax.open("GET","http://api.open-notify.org/iss-now.json",true);
    ajax.onreadystatechange = update_map;
    ajax.send();

    window.setTimeout(update, 5000);    //màj toute les 5 secondes
  }

  //màj de la carte à chaque nouvelle position de l'ISS
  function update_map(){
    if(ajax.readyState == 4 && ajax.status == 200){
      json_result = JSON.parse(ajax.responseText);    //on récupère la position au format json
      position.lat = json_result.iss_position.latitude;
      position.lng = json_result.iss_position.longitude;

      marker.setLatLng(position).addTo(map_layer);    //on change la positon du marker
      polyline.addLatLng(position);                   //on ajoute le point à la polyligne
      if(follow_option.checked == true){ map_layer.panTo(position); }     //on change le cadrage de la carte pour suivre l'ISS

      lat_text.innerHTML = "<span>Latitude: </span>"+String(position.lat);
      long_text.innerHTML = "<span>Longitude: </span>"+String(position.lng);
    }
  }

  //génère un faux tweet lors du clique sur le bouton 'tweet comme pesquet'
  function generate_tweet(){
    document.getElementById("overlay").style.top = "0";
    zoom_level = map_layer.getZoom();

    var bearing = Math.floor(360*Math.random());
    var url = "https://api.mapbox.com/styles/v1/castorbot/ciylak035004z2ro27w5r5p5s/static/"    //url de l'image statique
                +String(position.lng)+","    //position
                +String(position.lat)+","
                +String(zoom_level)+","   //zoom
                +String(bearing)//+","      //bearing
                // +String(0.0)          //pitch
                +"/400x400?access_token=pk.eyJ1IjoiY2FzdG9yYm90IiwiYSI6ImNpaWkweWQ5ajAwaHV1NmtueHV1MHowcHgifQ.2l9JrRXro_ve9S_pMdTB0Q";

    var img = document.getElementById("preview_img");
    img.src = url;
    img.addEventListener('load', function(){      //on attend que l'image soit chargé avant de montrer le faux tweet
      document.getElementById("preview").style.top = "50%";
    }, false);
  }



}

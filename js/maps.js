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
  var ajax_position, ajax_geoname, json_resul;
  var position={lat: 999, lng: 0}, old_position={lat: 0, lng: 0}, zoom_level = 3;

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
    window.setTimeout(function(){ document.getElementById("overlay").style.top = "100%"; }, 800);
      document.getElementById("preview").style.top = "150%";
    })


    map_layer = L.map('map').setView([48.853, 2.345], zoom_level);
    // map_layer.remove();
    marker = L.marker([], {icon: station_icon});
    marker.bindPopup("Position de l'ISS");
    polyline = L.polyline([], {color: 'green', smoothFactor: 3.0});

    tile_layer = L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}', {
      attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://mapbox.com">Mapbox</a>',
      maxZoom:18,
    	minZoom:1,
    	id:'mapbox.streets',   //mapbox.mapbox-streets-v7  //mapbox.mapbox-terrain-v2  //mapbox.satellite
    	accessToken: 'pk.eyJ1IjoiY2FzdG9yYm90IiwiYSI6ImNpaWkweWQ5ajAwaHV1NmtueHV1MHowcHgifQ.2l9JrRXro_ve9S_pMdTB0Q'
    	});
    tile_layer.addTo(map_layer);

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

    if(follow_option.checked == true){ map_layer.panTo(position); }
  }

  //boucle de requêtes sur la position de l'ISS
  function update(){
    ajax_position = new XMLHttpRequest();
    ajax_position.open("GET","http://api.open-notify.org/iss-now.json",true);

    ajax_position.onreadystatechange = function(){
      if(ajax_position.readyState == 4 && ajax_position.status == 200){
        json_result = JSON.parse(ajax_position.responseText);    //on récupère la position au format json

        old_position.lat = position.lat;
        old_position.lng = position.lng;
        position.lat = json_result.iss_position.latitude;
        position.lng = json_result.iss_position.longitude;
        update_map();
      }
    };
    ajax_position.send();

    window.setTimeout(update, 3000);    //màj toute les 3 secondes
  }

  //màj de la carte à chaque nouvelle position de l'ISS
  function update_map(){
    marker.setLatLng(position).addTo(map_layer);    //on change la positon du marker

    if(follow_option.checked == true){ map_layer.panTo(position); }     //on change le cadrage de la carte pour suivre l'ISS

    if( !(Math.sign(old_position) != Math.sign(position) && Math.abs(position) > 150) && old_position.lat != 999){
      L.polyline([old_position,position], {color: 'green'}).addTo(map_layer);
    }

    lat_text.innerHTML = "<span>Latitude: </span>"+String(position.lat);
    long_text.innerHTML = "<span>Longitude: </span>"+String(position.lng);
  }


  //génère un faux tweet lors du clique sur le bouton 'tweet comme pesquet'
  function generate_tweet(){
    document.getElementById("overlay").style.top = "0";
    document.getElementsByClassName("loading")[0].style.display = "flex";
    load_image();
    load_geoname();
  }

  //charge l'image satellite
  function load_image(){
    zoom_level = map_layer.getZoom();

    var bearing = 360*Math.random();
    var url = "https://api.mapbox.com/styles/v1/castorbot/ciylak035004z2ro27w5r5p5s/static/"    //url de l'image statique
                +String(position.lng)+","    //position
                +String(position.lat)+","
                +String(zoom_level)+","   //zoom
                +String(bearing)     //bearing
                // +","+String(0.0)          //pitch
                +"/400x400"
                +"?access_token=pk.eyJ1IjoiY2FzdG9yYm90IiwiYSI6ImNpaWkweWQ5ajAwaHV1NmtueHV1MHowcHgifQ.2l9JrRXro_ve9S_pMdTB0Q&attribution=false&logo=false";

    var img = document.getElementById("preview_img");
    img.src = url;
    img.addEventListener('load', function(){      //on attend que l'image soit chargé avant de montrer le faux tweet
      if(loaded){
        document.getElementById("preview").style.top = "50%";
        document.getElementsByClassName("loading")[0].style.display = "none";
        loaded = false;
      }
      else{ loaded = true; }
    }, false);
  }

  //charge la localisation la plus proche
  function load_geoname(){
    url = "http://api.geonames.org/extendedFindNearby?"
          +"lat="+String(position.lat)+"&"
          +"lng="+String(position.lng)+"&username=cocyte";

    ajax_geoname = new XMLHttpRequest();
    ajax_geoname.open("GET",url,true);

    ajax_geoname.onreadystatechange = function(){
      if(ajax_geoname.readyState == 4 && ajax_geoname.status == 200){
        var xml = ajax_geoname.responseXML;
        var json_text = JSON.stringify(xml_to_json(xml));   //conversion du xml en json
        // console.log(json_text);
        var geonames = JSON.parse(json_text).geonames;
        var location, hashtag;

        //définis le type de localisation et le type de texte du tweet
        if(geonames.address != undefined){
          location = geonames.address.adminName2;
          hashtag = "#"+geonames.address.adminName1;
        }
        else if(geonames.ocean != undefined){
          location = "the "+geonames.ocean.name;
          hashtag = "#BluePlanet"
        }
        else if(geonames.geoname.name != null){
          location = geonames.geoname.name;
          hashtag = "#"+geonames.geoname.countryName;
        }
        else{
          location = geonames.countryName;
          hashtag = "";
        }
        document.getElementById("preview_txt").innerHTML = "Nice view above "+location+" ! <span class='hashtag'>"+hashtag+" #ISS</span>";

        if(loaded){
          document.getElementById("preview").style.top = "50%";
          document.getElementsByClassName("loading")[0].style.display = "none";
          loaded = false;
        }
        else{ loaded = true; }
      }
    };

    ajax_geoname.send();
  }


  //function recursive pour convertir un fichier xml en json
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

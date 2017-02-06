(function(){
  var earth = {
    radius: 6371,   // km
    speed: 1/240,   // deg/sec
    rotation: 0
  };

  var iss = {
    speed: 7+2/3,    // km/sec
    altitude: 400,
    angle: 51.64,       // deg

    latitude: null,     // deg
    longitude: null,    // deg

    polar: Math.PI/2,   // rad
    azimuth: 0,         // rad
    time: 0
  };

  function update_iss(time_factor=1){
    if(iss.time == 0){ init(); }
    
    var time = Date.now();
    var dt = (time - iss.time)/1000;    // sec
    iss.time = time;

    iss.azimuth += time_factor*dt * iss.speed/(iss.altitude + earth.radius);
    iss.azimuth = iss.azimuth%(2*Math.PI);

    var x = earth.radius * Math.cos(iss.azimuth)*Math.sin(iss.polar);   //coordonnées dans le repère lié à l'ISS
    var y = earth.radius * Math.sin(iss.azimuth)*Math.sin(iss.polar);
    var z = earth.radius * Math.cos(iss.polar);

    var rot_angle = deg_rad(iss.angle);   // rotation pour l'inclinaison de l'ISS
    var rotation = rotate(x,y,z,rot_angle,'y');
    x = rotation[0], y = rotation[1], z = rotation[2];

    earth.rotation += time_factor*dt * 2*Math.PI/86400;   // rotation de la Terre
    earth.rotation = earth.rotation%(2*Math.PI);
    rotation = rotate(x,y,z,earth.rotation,'z');
    x = rotation[0], y = rotation[1], z = rotation[2];

    var temp = (z/earth.radius);
    iss.latitude = rad_deg( Math.asin(temp) );
    iss.longitude = rad_deg( Math.atan2(y,x) );

    return {latitude: iss.latitude, longitude: iss.longitude};
  }

  function rotate(x,y,z,angle,axis){
    var x_, y_, z_;
    switch(axis){
      case 'x':
        x_ = x;
        y_ = y*Math.cos(angle) - z*Math.sin(angle);
        z_ = y*Math.sin(angle) + z*Math.cos(angle)
        break;

      case 'y':
        x_ = z*Math.sin(angle) + x*Math.cos(angle);
        y_ = y;
        z_ = z*Math.cos(angle) - x*Math.sin(angle);
        break;

      case 'z':
        x_ = x*Math.cos(angle) - y*Math.sin(angle);
        y_ = x*Math.sin(angle) + y*Math.cos(angle);
        z_ = z;
        break;
    }
    return [x_,y_,z_];
  }

  function init(){
    iss.latitude = 0;
    iss.longitude = 0;
    iss.polar = Math.PI/2;
    iss.azimuth = 0;
    iss.time = Date.now();
  }

  function rad_deg(rad){ return (rad*180/3.141592653589793)%360; }    //convertis les radians en degrés
  function deg_rad(deg){ return (deg*3.141592653589793/180)%(2*Math.PI); }    // et inversement

  window.Location = {update_iss: update_iss};
})();

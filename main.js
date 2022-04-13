import TileWMS from 'ol/source/TileWMS';
import { FullScreen, defaults as defaultControls, ScaleLine, ZoomToExtent } from 'ol/control';

import { register } from 'ol/proj/proj4';
import { Projection, getTransform, get, transform, addProjection, addCoordinateTransforms } from 'ol/proj';
import { getDistance } from 'ol/sphere';
import proj4 from 'proj4';

import MousePosition from 'ol/control/MousePosition';
import {createStringXY} from 'ol/coordinate';

import './style.css';
import {Map, View} from 'ol';
import TileLayer from 'ol/layer/Tile';

proj4.defs("EPSG:49901", "+proj=longlat +R=3396190 +no_defs");
proj4.defs("EPSG:49911", "+proj=eqc +lat_ts=0 +lat_0=0 +lon_0=0 +x_0=0 +y_0=0 +R=3396190 +units=m +no_defs");
register(proj4);
//https://maps.planet.fu-berlin.de/jez-bin/wms?
var projection49911 = new Projection({
  code: "EPSG:49911",
  global: true,
  units: 'm',
  //extent: [4000000, 0, 4500000, 500000],
  extent: [-10668848.652, -5215881.563, 10668848.652, 5215881.563],
  //extent: [4536590.000, 1013775.000, 4683160.000, 1180560.000],
  //extent: [4363662.941221565, 859975.4272094945, 4808874.452132847, 1296750.544287833],
  getPointResolution: function(resolution, point) {
    var toEPSG49901 = getTransform(get("EPSG:49911"), get("EPSG:49901"));
    var vertices = [ point[0] - resolution / 2, point[1], point[0] + resolution / 2, point[1] ];
    vertices = toEPSG49901(vertices, vertices, 2);
    //console.log(vertices);
    return getDistance(vertices.slice(0, 2), vertices.slice(2, 4), 3396190);
  }
});
addProjection(projection49911);
var projection49901 = new Projection({
    code: 'EPSG:49901',
    extent: [-180, -90, 180, 90],
    units: 'degrees'
});
addProjection(projection49901);

addCoordinateTransforms(
  projection49901,
  projection49911,
  function (coordinate) {
    var xdst=3396190*(coordinate[0]/180*Math.PI);
    var ydst=3396190*(coordinate[1]/180*Math.PI);
    return [ xdst, ydst ];
  },
  function (coordinate) {
    var xdst=(coordinate[0]*180/Math.PI)/3396190;
    var ydst=(coordinate[1]*180/Math.PI)/3396190;
    return [ xdst, ydst ];
  }
);

var myExtent=[-31.250, -1778146.875, 1333606.250, 3.125];
var zoom = 7;
var mapCenter = transform([11.25,-20], projection49901, projection49911);
//var mapCenter = transform([77.6790,18.4022], projection49901, projection49911);
var rotation = 0;

var mainview = new View({
    center: mapCenter,
    zoom: zoom,
    minZoom: 2,
    maxZoom: 20,
    constrainResolution: true,
    //extent: [4504877, 1007670, 4741975, 1185493],
    extent: myExtent,
    projection: projection49911,
    //maxResolution: 0.3179564670324326
  })

var mousePositionControl = new MousePosition({
  coordinateFormat: createStringXY(3),
  projection: projection49901
});

const map = new Map({
  target: 'map',
    layers: [
    new TileLayer({
      title: "CTX",
      type: 'base',
      visible: true,
      source: new TileWMS({
        url: "https://maps.planet.fu-berlin.de/jez/?",
        params: { LAYERS: "ctx-mc20w" }
      })
    }),
    // new TileLayer({
    //   title: "Lat/Lon GRID",
    //   source: new TileWMS({
    //     url: "https://maps.planet.fu-berlin.de/jez-bin/wms?",
    //     params: { LAYERS: "grid" }
    //   })
    //}),
  ],
  controls: defaultControls().extend([
    new ScaleLine({
      units: "metric",
      //bar: true,
      //text: true,
      minWidth: 125
    }),
    new FullScreen,
    mousePositionControl,
    new ZoomToExtent({label: 'O', extent: myExtent})
  ]),
  view: mainview
});


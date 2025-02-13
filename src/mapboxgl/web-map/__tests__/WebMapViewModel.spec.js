import WebMapViewModel from '../WebMapViewModel.ts';
import flushPromises from 'flush-promises';
import iportal_serviceProxy from 'vue-iclient/test/unit/mocks/data/iportal_serviceProxy.json';
import layerData_CSV from 'vue-iclient/test/unit/mocks/data/layerData.json';
import layerData_geojson from 'vue-iclient/test/unit/mocks/data/layerData_geojson.json';
import uniqueLayer_polygon from 'vue-iclient/test/unit/mocks/data/WebMap/uniqueLayer_polygon.json';
import uniqueLayer_point from 'vue-iclient/test/unit/mocks/data/WebMap/uniqueLayer_multi_points.json';
import vectorLayer_point from 'vue-iclient/test/unit/mocks/data/WebMap/vectorLayer_point.json';
import vectorLayer_line from 'vue-iclient/test/unit/mocks/data/WebMap/vectorLayer_line.json';
import vectorLayer_polygon from 'vue-iclient/test/unit/mocks/data//WebMap/vectorLayer_polygon.json';
import rangeLayer from 'vue-iclient/test/unit/mocks/data//WebMap/rangeLayer.json';
import heatLayer from 'vue-iclient/test/unit/mocks/data//WebMap/heatLayer.json';
import markerLayer from 'vue-iclient/test/unit/mocks/data//WebMap/markerLayer.json';
import migrationLayer from 'vue-iclient/test/unit/mocks/data//WebMap/migrationLayer.json';
import ranksymbolLayer from 'vue-iclient/test/unit/mocks/data//WebMap/ranksymbolLayer.json';
import baseLayers from 'vue-iclient/test/unit/mocks/data/WebMap/baseLayers.json';
import wmsLayer from 'vue-iclient/test/unit/mocks/data/WebMap/wmsLayer.json';
import wmtsLayer from 'vue-iclient/test/unit/mocks/data/WebMap/wmtsLayer.json';
import {
  wmtsCapabilitiesText,
  wmsCapabilitiesTextWithoutVersion,
  wmsCapabilitiesTextWith130
} from 'vue-iclient/test/unit/mocks/data/CapabilitiesText.js';
import restmapLayer from 'vue-iclient/test/unit/mocks/data/WebMap/restmapLayer.json';
import dataflowLayer from 'vue-iclient/test/unit/mocks/data/WebMap/dataflowLayer.json';
import dataflowLayerData from 'vue-iclient/test/unit/mocks/data/dataflowLayerData.json';
import mockFetch from 'vue-iclient/test/unit/mocks/FetchRequest';
import { webmap_MAPBOXSTYLE_Tile } from 'vue-iclient/test/unit/mocks/services';

const CRS = require('vue-iclient/test/unit/mocks/crs');

const commonId = 123;
const commonOption = {
  accessKey: undefined,
  accessToken: undefined,
  excludePortalProxyUrl: undefined,
  iportalServiceProxyUrlPrefix: undefined,
  isSuperMapOnline: undefined,
  proxy: undefined,
  serverUrl: 'https://fakeiportal.supermap.io/iportal',
  target: 'map',
  tiandituKey: undefined,
  withCredentials: false
};
let layerIdMapList = {};
let sourceIdMapList = {};
const commonMap = {
  resize: () => jest.fn(),
  getZoom: () => jest.fn(),
  setZoom: () => jest.fn(),
  setCRS: () => jest.fn(),
  getCenter: () => {
    return {
      lng: 1,
      lat: 2
    };
  },
  setCenter: () => jest.fn(),
  getBearing: () => 2,
  setBearing: () => jest.fn(),
  getPitch: () => 2,
  setPitch: () => jest.fn(),
  getStyle: () => {
    let layers = [];
    if (layerIdMapList) {
      for (const key in layerIdMapList) {
        layers.push(layerIdMapList[key]);
      }
    }
    return {
      sources: sourceIdMapList,
      layers
    };
  },
  addSource: (sourceId, sourceInfo) => {
    sourceIdMapList[sourceId] = sourceInfo;
    if (sourceInfo.type === 'geojson') {
      sourceIdMapList[sourceId]._data = sourceInfo.data;
      sourceIdMapList[sourceId].setData = (function (sourceId) {
        return function (data) {
          sourceIdMapList[sourceId]._data = data;
        };
      })(sourceId);
    }
  },
  getSource: sourceId => {
    return sourceIdMapList[sourceId];
  },
  removeSource: sourceId => {
    delete sourceIdMapList[sourceId];
  },
  triggerRepaint: () => jest.fn(),
  style: {
    sourceCaches: sourceIdMapList
  },
  getLayer: layerId => {
    return layerIdMapList[layerId];
  },
  removeLayer: layerId => {
    delete layerIdMapList[layerId];
  },
  getCRS: () => {
    return {
      epsgCode: 'EPSG:3857',
      getExtent: () => jest.fn()
    };
  },
  addLayer: layerInfo => {
    layerIdMapList[layerInfo.id] = layerInfo;
    if (typeof layerInfo.source === 'object') {
      const source = layerInfo.source;
      sourceIdMapList[layerInfo.id] = layerInfo.source;
      if (layerInfo.source.type === 'raster' && layerInfo.source.rasterSource === 'iserver') {
        sourceIdMapList[layerInfo.id] = {
          ...layerInfo.source,
          clearTiles: () => jest.fn(),
          update: () => jest.fn()
        };
      }
    }
  },
  moveLayer: () => jest.fn(),
  overlayLayersManager: {},
  on: () => { },
  fire: () => { },
  setLayoutProperty: () => jest.fn(),
  addStyle: () => jest.fn(),
  remove: () => jest.fn(),
  setRenderWorldCopies: () => jest.fn(),
  setStyle: () => jest.fn(),
  loadImage: function (src, callback) {
    callback(null, { width: 15 });
  },
  addImage: function () { },
  hasImage: function () {
    return false;
  }
};
window.canvg = (a, b, c) => {
  c.renderCallback();
};

const commonMapOptions = {
  container: 'map',
  style: {
    version: 8,
    sources: {
      'raster-tiles': {
        type: 'raster',
        tiles: ['https://test'],
        tileSize: 256
      }
    },
    layers: [
      {
        id: 'simple-tiles',
        type: 'raster',
        source: 'raster-tiles',
        minzoom: 5,
        maxzoom: 20
      }
    ]
  },
  center: [120.143, 30.236],
  zoom: 3,
  bounds: {
    getEast: () => 2,
    getWest: () => -1,
    getSouth: () => 2,
    getNorth: () => -1
  }
};
document.getElementById = () => {
  return {
    classList: {
      add: () => jest.fn()
    },
    style: {}
  };
};

document.getElementsByClassName = () => {
  return [
    {
      style: {
        left: 0,
        top: 0
      }
    }
  ];
};

describe('WebMapViewModel.spec', () => {
  beforeEach(() => {
    jest.setTimeout(30000);
  });
  afterEach(() => {
    sourceIdMapList = {};
    layerIdMapList = {};
    commonMap.style.sourceCaches = sourceIdMapList;
    jest.restoreAllMocks();
  });

  it('test baseLayer layers count maploaded', done => {
    const fetchResource = {
      'https://fakeiportal.supermap.io/iportal/web/config/portal.json': iportal_serviceProxy,
      'https://fakeiportal.supermap.io/iportal/web/maps/123/map.json': webmap_MAPBOXSTYLE_Tile,
      'https://fakeiportal.supermap.io/iserver/services/map-china400/restjsr/v1/vectortile/maps/China_4326/style.json': {
        "version": 8,
        "sources": {
          "raster-tiles": {
            "type": "raster",
            "tiles": ['http://fakeiportal.supermap.io/iserver/services/map-china400/rest/maps/China/zxyTileImage.png?z={z}&x={x}&y={y}'],
            "tileSize": 256
          }
        },
        "layers": [{
          "id": "simple-tiles",
          "type": "raster",
          "source": "raster-tiles",
          "minzoom": 0,
          "maxzoom": 22
        }]
      }
    };
    mockFetch(fetchResource);
    const viewModel = new WebMapViewModel(
      commonId,
      { ...commonOption },
      {
        style: {
          version: 8,
          sources: {},
          layers: []
        },
        center: [117.0514, 40.0387],
        zoom: 7,
        bearing: 0,
        pitch: 0,
        rasterTileSize: 256,
        preserveDrawingBuffer: true,
        container: 'map',
        tileSize: 256
      }
    );
    let addStyleSpy;
    viewModel.on({
      mapinitialized: (data) => {
        addStyleSpy = jest.spyOn(data.map, 'addStyle');
      },
      addlayerssucceeded: (data) => {
        expect(addStyleSpy).toHaveBeenCalledTimes(1);
        expect(data.layers.length).toBe(webmap_MAPBOXSTYLE_Tile.layers.length);
        expect(viewModel.expectLayerLen).toBe(2);
        expect(viewModel.layerAdded).toBe(2);
        done();
      }
    });
  });
  it('add uniqueLayer with id is num', async done => {
    const fetchResource = {
      'https://fakeiportal.supermap.io/iportal/web/config/portal.json': iportal_serviceProxy,
      'https://fakeiportal.supermap.io/iportal/web/maps/123/map.json': uniqueLayer_polygon,
      'https://fakeiportal.supermap.io/iportal/web/datas/1960447494/content.json?pageSize=9999999&currentPage=1&parentResType=MAP&parentResId=123':
        layerData_CSV,
      'https://fakeiportal.supermap.io/iportal/web/datas/144371940/content.json?pageSize=9999999&currentPage=1&parentResType=MAP&parentResId=123':
        layerData_geojson['LINE_GEOJSON']
    };
    mockFetch(fetchResource);
    const callback = function (data) {
      expect(data.layers.length).toBe(uniqueLayer_polygon.layers.length);
      done();
    };
    const viewModel = new WebMapViewModel(commonId, { ...commonOption }, undefined, { ...commonMap });
    viewModel.on({ addlayerssucceeded: callback });
  });

  it('add uniqueLayer point', async done => {
    const fetchResource = {
      'https://fakeiportal.supermap.io/iportal/web/datas/676516522/content.json?pageSize=9999999&currentPage=1&parentResType=MAP&parentResId=undefined':
        layerData_CSV,
      'https://fakeiportal.supermap.io/iportal/web/datas/13136933/content.json?pageSize=9999999&currentPage=1&parentResType=MAP&parentResId=undefined':
        layerData_geojson['POINT_GEOJSON']
    };
    mockFetch(fetchResource);
    const id = {
      ...uniqueLayer_point,
      level: '',
      visibleExtent: [0, 1, 2, 3]
    };
    const callback = function (data) {
      expect(viewModel.map).not.toBeUndefined();
      expect(viewModel.map.options.bounds).not.toBeUndefined();
      expect(data.layers.length).toBe(id.layers.length);
      done();
    };
    const viewModel = new WebMapViewModel(id, { ...commonOption });
    viewModel.on({ addlayerssucceeded: callback });
  });

  describe('test custom wkt', () => {
    const commonFetchResource = {
      'https://fakeiportal.supermap.io/iportal/web/datas/676516522/content.json?pageSize=9999999&currentPage=1&parentResType=MAP&parentResId=undefined':
        layerData_CSV,
      'https://fakeiportal.supermap.io/iportal/web/datas/13136933/content.json?pageSize=9999999&currentPage=1&parentResType=MAP&parentResId=undefined':
        layerData_geojson['POINT_GEOJSON']
    };
    it('request wkt info with EPSFG Prefix and test visibleExtend', async done => {
      const get = jest.spyOn(CRS, 'get');
      get.mockImplementation(() => {
        return '';
      });
      const epsgeCode = 'EPSG:1000';
      const fetchResource = {
        ...commonFetchResource,
        'https://iserver.supermap.io/iserver/services/map-china400/rest/maps/ChinaDark/prjCoordSys.wkt': epsgeCode
      };
      mockFetch(fetchResource);
      const mapOptions = {
        ...commonMapOptions,
        bounds: undefined,
        interactive: true,
        minZoom: 22,
        maxZoom: 0
      };
      const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => { });
      new WebMapViewModel(uniqueLayer_point, { ...commonOption }, mapOptions, { ...commonMap });
      await flushPromises();
      expect(errorSpy.mock.calls).toHaveLength(1);
      expect(errorSpy.mock.calls[0][0]).toMatch(`${epsgeCode} not define`);
      done();
    });
    it('request wkt info and visibleExtend without EPSFG Prefix ', done => {
      const epsgeCode =
        'PROJCS["Google Maps Global Mercator",GEOGCS["WGS 84",DATUM["WGS_1984",SPHEROID["WGS 84",6378137,298.257223563,AUTHORITY["EPSG","7030"]],AUTHORITY["EPSG","6326"]],PRIMEM["Greenwich",0,AUTHORITY["EPSG","8901"]],UNIT["degree",0.01745329251994328,AUTHORITY["EPSG","9122"]],AUTHORITY["EPSG","4326"]],PROJECTION["Mercator_2SP"],PARAMETER["standard_parallel_1",0],PARAMETER["latitude_of_origin",0],PARAMETER["central_meridian",0],PARAMETER["false_easting",0],PARAMETER["false_northing",0],AXIS["Northing", "NORTH"],AXIS["Easting", "EAST"],UNIT["Meter",1],EXTENSION["PROJ4","+proj=merc +a=6378137 +b=6378137 +lat_ts=0.0 +lon_0=0.0 +x_0=0.0 +y_0=0 +k=1.0 +units=m +nadgrids=@null +wktext  +no_defs"],AUTHORITY["EPSG","900913"]]';
      mockFetch(commonFetchResource);
      const id = { ...uniqueLayer_point, projection: epsgeCode };
      const callback = function (data) {
        expect(data.layers.length).toBe(id.layers.length);
        done();
      };
      const viewModel = new WebMapViewModel(id, { ...commonOption });
      viewModel.on({ addlayerssucceeded: callback });
    });
  });

  it('layerType is VECTOR and multi style points', async done => {
    const fetchResource = {
      'https://fakeiportal.supermap.io/iportal/web/datas/1920557079/content.json?pageSize=9999999&currentPage=1&parentResType=MAP&parentResId=undefined':
        layerData_CSV,
      'https://fakeiportal.supermap.io/iportal/web/datas/13136933/content.json?pageSize=9999999&currentPage=1&parentResType=MAP&parentResId=undefined':
        layerData_geojson['POINT_GEOJSON']
    };
    mockFetch(fetchResource);
    const id = vectorLayer_point;
    const callback = function (data) {
      expect(data.layers.length).toBe(id.layers.length);
      done();
    };
    const viewModel = new WebMapViewModel(id, { ...commonOption }, undefined, { ...commonMap });
    viewModel.on({ addlayerssucceeded: callback });
  });

  it('test getSource is empty', done => {
    const fetchResource = {
      'https://fakeiportal.supermap.io/iportal/web/datas/1920557079/content.json?pageSize=9999999&currentPage=1&parentResType=MAP&parentResId=undefined':
        layerData_CSV
    };
    mockFetch(fetchResource);
    const style = vectorLayer_line.layers[0].style;
    const roadId = {
      ...vectorLayer_line,
      layers: [
        {
          ...vectorLayer_line.layers[0],
          style: [style, style]
        }
      ]
    };
    const mapOptions = undefined;
    const map = {
      ...commonMap,
      getSource: () => ''
    };
    const callback = function (data) {
      expect(data.layers.length).toBe(roadId.layers.length);
      done();
    };
    const viewModel = new WebMapViewModel(roadId, { ...commonOption }, mapOptions, map);
    viewModel.on({ addlayerssucceeded: callback });
  });

  it('add vectorLayer_line subway and set dash style', async done => {
    const fetchResource = {
      'https://fakeiportal.supermap.io/iportal/web/datas/1920557079/content.json?pageSize=9999999&currentPage=1&parentResType=MAP&parentResId=undefined':
        layerData_CSV
    };
    mockFetch(fetchResource);
    const style = vectorLayer_line.layers[0].style;
    const subwayId = {
      ...vectorLayer_line,
      layers: [
        {
          ...vectorLayer_line.layers[0],
          style: [
            style,
            {
              ...style,
              lineDash: 'dash'
            }
          ]
        }
      ]
    };
    const callback = async function (data) {
      await flushPromises();
      expect(data.layers.length).toBe(subwayId.layers.length);
      done();
    };
    const viewModel = new WebMapViewModel(subwayId, { ...commonOption }, undefined, { ...commonMap });
    viewModel.on({ addlayerssucceeded: callback });
  });

  it('add vectorLayer_polygon', done => {
    const id = vectorLayer_polygon;
    const callback = async function (data) {
      await flushPromises();
      expect(data.layers.length).toBe(id.layers.length);
      done();
    };
    const viewModel = new WebMapViewModel(id, { ...commonOption });
    viewModel.on({ addlayerssucceeded: callback });
  });

  // _initGraticuleLayer
  it('add rangeLayer', done => {
    const fetchResource = {
      'https://fakeiportal.supermap.io/iportal/web/datas/1171594968/content.json?pageSize=9999999&currentPage=1&parentResType=MAP&parentResId=undefined':
        layerData_CSV
    };
    mockFetch(fetchResource);
    const id = rangeLayer;
    const callback = function (data) {
      viewModel.setZoom(2);
      viewModel.map.getZoom = function () {
        return 2;
      };
      viewModel.map.fire('zoomend');
      viewModel.setZoom(5);
      viewModel.map.getZoom = function () {
        return 5;
      };
      viewModel.map.fire('zoomend');
      expect(data).not.toBeUndefined();
      done();
    };
    const viewModel = new WebMapViewModel(id, { ...commonOption });
    viewModel.on({ addlayerssucceeded: callback });
  });

  it('add heatLayer', done => {
    const fetchResource = {
      'https://fakeiportal.supermap.io/iportal/web/datas/1920557079/content.json?pageSize=9999999&currentPage=1&parentResType=MAP&parentResId=undefined':
        layerData_CSV
    };
    mockFetch(fetchResource);
    const id = heatLayer;
    const callback = function (data) {
      expect(data.layers.length).toBe(id.layers.length);
      done();
    };
    const viewModel = new WebMapViewModel(id, { ...commonOption });
    viewModel.on({ addlayerssucceeded: callback });
  });

  it('add markerLayer correctly', done => {
    const fetchResource = {
      'https://fakeiportal.supermap.io/iportal/web/datas/123456/content.json?pageSize=9999999&currentPage=1&parentResType=MAP&parentResId=undefined':
        layerData_geojson['MARKER_GEOJSON']
    };
    mockFetch(fetchResource);
    const id = markerLayer;
    const callback = function (data) {
      expect(data.layers.length).toBe(id.layers.length);
      done();
    };
    const viewModel = new WebMapViewModel(id, { ...commonOption });
    viewModel.on({ addlayerssucceeded: callback });
  });

  it('add markerLayer layerOrder correctly', done => {
    const fetchResource = {
      'https://fakeiportal.supermap.io/iportal/web/datas/123456/content.json?pageSize=9999999&currentPage=1&parentResType=MAP&parentResId=undefined':
        layerData_geojson['MARKER_GEOJSON']
    };
    mockFetch(fetchResource);
    const id = markerLayer;
    const callback = function (data) {
      expect(data.layers.length).toBe(id.layers.length);
      const layers = data.map.getStyle().layers;
      expect(layers[layers.length - 1].id).toBe('民航数-TEXT-7');
      done();
    };
    const viewModel = new WebMapViewModel(id, { ...commonOption }, { ...commonMapOptions }, { ...commonMap });
    viewModel.on({ addlayerssucceeded: callback });
  });

  it('markerLayer url is error', done => {
    const newLayerData_geojson = {
      ...layerData_geojson['MARKER_GEOJSON'],
      content:
        '{"type":"FeatureCollection","crs":{"type":"name","properties":{"name":"urn:ogc:def:crs:OGC:1.3:CRS84"}},"features":[{"type":"Feature","properties":{"dataViz_title":"","dataViz_description":"","dataViz_imgUrl":"","dataViz_url":"","dataViz_videoUrl":""},"dv_v5_markerStyle":{"fillColor":"#FFF","fillOpacity":"0.6","strokeColor":"#fff","strokeOpacity":"0,6","strokeWidth":"400","src":"apps/dataviz/static/imgs/markers/mark_red.svg","scale":1,"anchor":[0.5,0.5],"imgWidth":48,"imgHeight":43},"dv_v5_markerInfo":{"dataViz_title":"","dataViz_description":"","dataViz_imgUrl":"","dataViz_url":"","dataViz_videoUrl":""},"geometry":{"type":"Point","coordinates":[103.59008789062496,30.31598771855792]}}]}'
    };
    const fetchResource = {
      'https://fakeiportal.supermap.io/iportal/web/datas/123456/content.json?pageSize=9999999&currentPage=1&parentResType=MAP&parentResId=undefined':
        newLayerData_geojson
    };
    mockFetch(fetchResource);
    const id = markerLayer;
    const callback = function (data) {
      expect(data.layers.length).toBe(id.layers.length);
      done();
    };
    const viewModel = new WebMapViewModel(id, { ...commonOption });
    viewModel.on({ addlayerssucceeded: callback });
  });

  it('add migrationLayer', done => {
    const fetchResource = {
      'https://fakeiportal.supermap.io/iportal/web/datas/516597759/content.json?pageSize=9999999&currentPage=1&parentResType=MAP&parentResId=undefined':
        layerData_CSV
    };
    mockFetch(fetchResource);
    const id = migrationLayer;
    const callback = function (data) {
      expect(data.layers.length).toBe(id.layers.length);
      done();
    };
    const viewModel = new WebMapViewModel(id, { ...commonOption });
    viewModel.on({ addlayerssucceeded: callback });
  });

  it('add ranksymbolLayer', done => {
    const fetchResource = {
      'https://fakeiportal.supermap.io/iportal/web/datas/676516522/content.json?pageSize=9999999&currentPage=1&parentResType=MAP&parentResId=undefined':
        layerData_CSV
    };
    mockFetch(fetchResource);
    const id = ranksymbolLayer;
    const callback = function (data) {
      expect(data.layers.length).toBe(id.layers.length);
      done();
    };
    const viewModel = new WebMapViewModel(id, { ...commonOption });
    viewModel.on({ addlayerssucceeded: callback });
  });

  it('add dataflow and update', done => {
    window.jsonsql.query = () => {
      return [{}];
    };
    const fetchResource = {
      'https://fakeiportal.supermap.io/iportal/web/datas/676516522/content.json?pageSize=9999999&currentPage=1&parentResType=MAP&parentResId=undefined':
        layerData_CSV,
      'https://fakeiserver.supermap.io/iserver/services/dataflowTest/dataflow.json?token=FjOwvGbO9L1MOpV22Bx12_UNy5uVuEXoxoRQe_UyKJtvKQ0fyCZoeGMlq5IVDbLDvhxzu3w8_DawMHFC9kOeGA..':
        dataflowLayerData.dataflow,
      'https://fakeiserver.supermap.io/iserver/services/dataflowTest/dataflow/broadcast?token=FjOwvGbO9L1MOpV22Bx12_UNy5uVuEXoxoRQe_UyKJtvKQ0fyCZoeGMlq5IVDbLDvhxzu3w8_DawMHFC9kOeGA..':
        dataflowLayerData.broadcast,
      'https://fakeiserver.supermap.io/iserver/services/dataflowTest/dataflow/subscribe?token=FjOwvGbO9L1MOpV22Bx12_UNy5uVuEXoxoRQe_UyKJtvKQ0fyCZoeGMlq5IVDbLDvhxzu3w8_DawMHFC9kOeGA..':
        dataflowLayerData.subscribe
    };
    mockFetch(fetchResource);
    const callback = function (data) {
      expect(data.layers.length).toBe(dataflowLayer.layers.length);
      viewModel.updateOverlayLayer(dataflowLayer.layers[0]);
      expect(() => {
        viewModel.updateOverlayLayer(dataflowLayer.layers[0]);
      }).not.toThrow();
      done();
    };
    const viewModel = new WebMapViewModel(dataflowLayer, { ...commonOption }, undefined, { ...commonMap });
    viewModel.on({ addlayerssucceeded: callback });
  });

  // public Func
  describe('resize', () => {
    it('resize normal', async done => {
      const fetchResource = {
        'https://fakeiportal.supermap.io/iportal/web/datas/516597759/content.json?pageSize=9999999&currentPage=1&parentResType=MAP&parentResId=undefined':
          layerData_CSV
      };
      mockFetch(fetchResource);
      const id = migrationLayer;
      const viewModel = new WebMapViewModel(id, { ...commonOption });
      const spy = jest.spyOn(viewModel, 'echartsLayerResize');
      await flushPromises();
      viewModel.resize();
      expect(spy).toBeCalled();
      done();
    });

    it('resize keepbounds', async done => {
      const fetchResource = {
        'https://fakeiportal.supermap.io/iportal/web/config/portal.json': iportal_serviceProxy,
        'https://fakeiportal.supermap.io/iportal/web/maps/123/map.json': uniqueLayer_polygon,
        'https://fakeiportal.supermap.io/iportal/web/datas/1960447494/content.json?pageSize=9999999&currentPage=1&parentResType=MAP&parentResId=123':
          layerData_CSV,
        'https://fakeiportal.supermap.io/iportal/web/datas/144371940/content.json?pageSize=9999999&currentPage=1&parentResType=MAP&parentResId=123':
          layerData_geojson['LINE_GEOJSON']
      };
      mockFetch(fetchResource);
      const viewModel = new WebMapViewModel(commonId, { ...commonOption }, { ...commonMapOptions }, { ...commonMap });
      const spy = jest.spyOn(viewModel.map, 'setZoom');
      await flushPromises();
      viewModel.resize(true);
      expect(spy).toBeCalled();
      done();
    });
  });

  describe('setCrs', () => {
    beforeEach(() => {
      const fetchResource = {
        'https://fakeiportal.supermap.io/iportal/web/config/portal.json': iportal_serviceProxy,
        'https://fakeiportal.supermap.io/iportal/web/maps/123/map.json': uniqueLayer_polygon,
        'https://fakeiportal.supermap.io/iportal/web/datas/1960447494/content.json?pageSize=9999999&currentPage=1&parentResType=MAP&parentResId=123':
          layerData_CSV,
        'https://fakeiportal.supermap.io/iportal/web/datas/144371940/content.json?pageSize=9999999&currentPage=1&parentResType=MAP&parentResId=123':
          layerData_geojson['LINE_GEOJSON']
      };
      mockFetch(fetchResource);
    });

    const crs = {
      extent: {
        leftBottom: {
          x: 0,
          y: 1
        },
        rightTop: {
          x: 1,
          y: 2
        }
      },
      unit: 'm'
    };
    it('take epsgcode', async done => {
      const crsWithEpsgcode = {
        ...crs,
        epsgCode: 'EPSG:4326'
      };
      const viewModel = new WebMapViewModel(commonId, { ...commonOption }, { ...commonMapOptions }, { ...commonMap });
      const spy = jest.spyOn(viewModel.map, 'setCRS');
      await flushPromises();
      expect(viewModel.mapOptions.crs).toBeUndefined();
      viewModel.setCrs(crsWithEpsgcode);
      expect(viewModel.mapOptions.crs).not.toBeUndefined();
      expect(spy).toBeCalled();
      done();
    });

    it('do not take epsgcode', async done => {
      const viewModel = new WebMapViewModel(commonId, { ...commonOption }, { ...commonMapOptions }, { ...commonMap });
      const spy = jest.spyOn(viewModel.map, 'setCRS');
      await flushPromises();
      expect(viewModel.mapOptions.crs).toBeUndefined();
      viewModel.setCrs(crs);
      expect(viewModel.mapOptions.crs).toEqual(crs);
      expect(spy).toBeCalled();
      done();
    });
  });

  describe('setCenter', () => {
    beforeEach(() => {
      const fetchResource = {
        'https://fakeiportal.supermap.io/iportal/web/config/portal.json': iportal_serviceProxy,
        'https://fakeiportal.supermap.io/iportal/web/maps/123/map.json': uniqueLayer_polygon,
        'https://fakeiportal.supermap.io/iportal/web/datas/1960447494/content.json?pageSize=9999999&currentPage=1&parentResType=MAP&parentResId=123':
          layerData_CSV,
        'https://fakeiportal.supermap.io/iportal/web/datas/144371940/content.json?pageSize=9999999&currentPage=1&parentResType=MAP&parentResId=123':
          layerData_geojson['LINE_GEOJSON']
      };
      mockFetch(fetchResource);
    });
    it('set invalid data', async done => {
      const center = [];
      const viewModel = new WebMapViewModel(commonId, { ...commonOption }, { ...commonMapOptions }, { ...commonMap });
      const spy = jest.spyOn(viewModel.map, 'getCenter');
      await flushPromises();
      expect(spy).not.toBeCalled();
      viewModel.setCenter(center);
      expect(spy).not.toBeCalled();
      done();
    });

    it('set valid data', async done => {
      const center = [1, 1];
      const viewModel = new WebMapViewModel(commonId, { ...commonOption }, { ...commonMapOptions }, { ...commonMap });
      const spy = jest.spyOn(viewModel.map, 'setCenter');
      await flushPromises();
      expect(spy).not.toBeCalled();
      viewModel.setCenter(center);
      expect(spy).toBeCalled();
      done();
    });
  });

  it('setRenderWorldCopies', async done => {
    const fetchResource = {
      'https://fakeiportal.supermap.io/iportal/web/config/portal.json': iportal_serviceProxy,
      'https://fakeiportal.supermap.io/iportal/web/maps/123/map.json': uniqueLayer_polygon,
      'https://fakeiportal.supermap.io/iportal/web/datas/1960447494/content.json?pageSize=9999999&currentPage=1&parentResType=MAP&parentResId=123':
        layerData_CSV,
      'https://fakeiportal.supermap.io/iportal/web/datas/144371940/content.json?pageSize=9999999&currentPage=1&parentResType=MAP&parentResId=123':
        layerData_geojson['LINE_GEOJSON']
    };
    mockFetch(fetchResource);
    const renderWorldCopies = true;
    const viewModel = new WebMapViewModel(commonId, { ...commonOption }, { ...commonMapOptions }, { ...commonMap });
    const spy = jest.spyOn(viewModel.map, 'setRenderWorldCopies');
    await flushPromises();
    expect(spy).not.toBeCalled();
    viewModel.setRenderWorldCopies(renderWorldCopies);
    expect(spy).toBeCalled();
    done();
  });

  it('setBearing', async done => {
    const fetchResource = {
      'https://fakeiportal.supermap.io/iportal/web/config/portal.json': iportal_serviceProxy,
      'https://fakeiportal.supermap.io/iportal/web/maps/123/map.json': uniqueLayer_polygon,
      'https://fakeiportal.supermap.io/iportal/web/datas/1960447494/content.json?pageSize=9999999&currentPage=1&parentResType=MAP&parentResId=123':
        layerData_CSV,
      'https://fakeiportal.supermap.io/iportal/web/datas/144371940/content.json?pageSize=9999999&currentPage=1&parentResType=MAP&parentResId=123':
        layerData_geojson['LINE_GEOJSON']
    };
    mockFetch(fetchResource);
    const bearing = 0;
    const viewModel = new WebMapViewModel(commonId, { ...commonOption }, { ...commonMapOptions }, { ...commonMap });
    const spy = jest.spyOn(viewModel.map, 'setBearing');
    await flushPromises();
    expect(viewModel.mapOptions.bearing).toBeUndefined();
    viewModel.setBearing();
    expect(viewModel.mapOptions.bearing).toBeUndefined();
    expect(spy).not.toBeCalled();
    viewModel.setBearing(bearing);
    expect(viewModel.mapOptions.bearing).not.toBeUndefined();
    expect(spy).toBeCalled();
    done();
  });

  it('setPitch', async done => {
    const fetchResource = {
      'https://fakeiportal.supermap.io/iportal/web/config/portal.json': iportal_serviceProxy,
      'https://fakeiportal.supermap.io/iportal/web/maps/123/map.json': uniqueLayer_polygon,
      'https://fakeiportal.supermap.io/iportal/web/datas/1960447494/content.json?pageSize=9999999&currentPage=1&parentResType=MAP&parentResId=123':
        layerData_CSV,
      'https://fakeiportal.supermap.io/iportal/web/datas/144371940/content.json?pageSize=9999999&currentPage=1&parentResType=MAP&parentResId=123':
        layerData_geojson['LINE_GEOJSON']
    };
    mockFetch(fetchResource);
    const pitch = 0;
    const viewModel = new WebMapViewModel(commonId, { ...commonOption }, { ...commonMapOptions }, { ...commonMap });
    const spy = jest.spyOn(viewModel.map, 'setPitch');
    await flushPromises();
    expect(viewModel.mapOptions.pitch).toBeUndefined();
    viewModel.setPitch();
    expect(spy).not.toBeCalled();
    viewModel.setPitch(pitch);
    expect(viewModel.mapOptions.pitch).not.toBeUndefined();
    expect(spy).toBeCalled();
    done();
  });

  it('setStyle', async done => {
    const fetchResource = {
      'https://fakeiportal.supermap.io/iportal/web/config/portal.json': iportal_serviceProxy,
      'https://fakeiportal.supermap.io/iportal/web/maps/123/map.json': uniqueLayer_polygon,
      'https://fakeiportal.supermap.io/iportal/web/datas/1960447494/content.json?pageSize=9999999&currentPage=1&parentResType=MAP&parentResId=123':
        layerData_CSV,
      'https://fakeiportal.supermap.io/iportal/web/datas/144371940/content.json?pageSize=9999999&currentPage=1&parentResType=MAP&parentResId=123':
        layerData_geojson['LINE_GEOJSON']
    };
    mockFetch(fetchResource);
    const style = {
      color: '#fff'
    };
    const viewModel = new WebMapViewModel(commonId, { ...commonOption }, { ...commonMapOptions }, { ...commonMap });
    const spy = jest.spyOn(viewModel.map, 'setStyle');
    await flushPromises();
    expect(spy).not.toBeCalled();
    viewModel.setStyle(style);
    expect(viewModel.mapOptions.style).toEqual(style);
    expect(spy).toBeCalled();
    done();
  });

  it('setRasterTileSize', async done => {
    const fetchResource = {
      'https://fakeiportal.supermap.io/iportal/web/config/portal.json': iportal_serviceProxy,
      'https://fakeiportal.supermap.io/iportal/web/maps/123/map.json': uniqueLayer_polygon,
      'https://fakeiportal.supermap.io/iportal/web/datas/1960447494/content.json?pageSize=9999999&currentPage=1&parentResType=MAP&parentResId=123':
        layerData_CSV,
      'https://fakeiportal.supermap.io/iportal/web/datas/144371940/content.json?pageSize=9999999&currentPage=1&parentResType=MAP&parentResId=123':
        layerData_geojson['LINE_GEOJSON']
    };
    mockFetch(fetchResource);
    const viewModel = new WebMapViewModel(commonId, { ...commonOption }, { ...commonMapOptions }, { ...commonMap });
    const spy = jest.spyOn(viewModel, '_updateRasterSource');
    await flushPromises();
    viewModel.setRasterTileSize(-1);
    expect(spy).not.toBeCalled();
    viewModel.setRasterTileSize(2);
    expect(spy).toBeCalled();
    done();
  });

  it('setLayersVisible', done => {
    const fetchResource = {
      'https://fakeiportal.supermap.io/iportal/web/config/portal.json': iportal_serviceProxy,
      'https://fakeiportal.supermap.io/iportal/web/maps/123/map.json': uniqueLayer_polygon,
      'https://fakeiportal.supermap.io/iportal/web/datas/1960447494/content.json?pageSize=9999999&currentPage=1&parentResType=MAP&parentResId=123':
        layerData_CSV,
      'https://fakeiportal.supermap.io/iportal/web/datas/144371940/content.json?pageSize=9999999&currentPage=1&parentResType=MAP&parentResId=123':
        layerData_geojson['LINE_GEOJSON']
    };
    mockFetch(fetchResource);
    const callback = function (data) {
      expect(data.layers.length).toBe(uniqueLayer_polygon.layers.length);
      const isShow = false;
      const changeShow = true;
      const ignoreIds = ['China'];
      const spy1 = jest.spyOn(viewModel.map, 'setLayoutProperty');
      viewModel.setLayersVisible(isShow, ignoreIds);
      expect(spy1.mock.calls.length).toBe(viewModel._cacheLayerId.length - 1);
      spy1.mockClear();
      const spy2 = jest.spyOn(viewModel.map, 'setLayoutProperty');
      viewModel.setLayersVisible(changeShow);
      expect(spy2.mock.calls.length).toBe(viewModel._cacheLayerId.length);
      done();
    };
    const viewModel = new WebMapViewModel(commonId, { ...commonOption }, { ...commonMapOptions }, { ...commonMap });
    viewModel.on({ addlayerssucceeded: callback });
  });

  it('cleanLayers', done => {
    const fetchResource = {
      'https://fakeiportal.supermap.io/iportal/web/config/portal.json': iportal_serviceProxy,
      'https://fakeiportal.supermap.io/iportal/web/maps/123/map.json': uniqueLayer_polygon,
      'https://fakeiportal.supermap.io/iportal/web/datas/1960447494/content.json?pageSize=9999999&currentPage=1&parentResType=MAP&parentResId=123':
        layerData_CSV,
      'https://fakeiportal.supermap.io/iportal/web/datas/144371940/content.json?pageSize=9999999&currentPage=1&parentResType=MAP&parentResId=123':
        layerData_geojson['LINE_GEOJSON']
    };
    mockFetch(fetchResource);
    const callback = function (data) {
      expect(data.layers.length).toBe(uniqueLayer_polygon.layers.length);
      const spyLayer = jest.spyOn(viewModel.map, 'removeLayer');
      const spySource = jest.spyOn(viewModel.map, 'removeSource');
      const layersLen = Object.keys(layerIdMapList).length;
      const sourcesLen = Object.keys(sourceIdMapList).length;
      expect(viewModel._cacheLayerId.length).not.toBe(0);
      viewModel.cleanLayers();
      expect(spyLayer.mock.calls.length).toBe(layersLen);
      expect(spySource.mock.calls.length).toBe(sourcesLen);
      expect(viewModel._cacheLayerId.length).toBe(0);
      done();
    };
    const viewModel = new WebMapViewModel(commonId, { ...commonOption }, { ...commonMapOptions }, { ...commonMap });
    viewModel.on({ addlayerssucceeded: callback });
  });

  // 在 MD 调用
  it('updateOverlayLayer mvt', done => {
    const fetchResource = {
      'https://fakeiportal.supermap.io/iportal/web/config/portal.json': iportal_serviceProxy,
      'https://fakeiportal.supermap.io/iportal/web/maps/123/map.json': uniqueLayer_polygon,
      'https://fakeiportal.supermap.io/iportal/web/datas/1960447494/content.json?pageSize=9999999&currentPage=1&parentResType=MAP&parentResId=123':
        layerData_CSV,
      'https://fakeiportal.supermap.io/iportal/web/datas/144371940/content.json?pageSize=9999999&currentPage=1&parentResType=MAP&parentResId=123':
        layerData_geojson['LINE_GEOJSON']
    };
    mockFetch(fetchResource);
    const viewModel = new WebMapViewModel(commonId, { ...commonOption }, { ...commonMapOptions }, { ...commonMap });
    const callback = function (data) {
      expect(data.layers.length).toBe(uniqueLayer_polygon.layers.length);
      const mvtLayerInfo = {
        layerID: 'style1',
        layerType: 'mvt',
        visible: false,
        featureType: 'POLYGON',
        style: {
          radius: 6,
          fillColor: '#ff0000',
          fillOpacity: 0.9,
          strokeColor: '#ffffff',
          strokeWidth: 1,
          strokeOpacity: 1,
          lineDash: 'solid',
          symbolType: 'svg',
          type: 'POLYGON'
        },
        labelStyle: {},
        projection: 'EPSG:3857',
        featureType: 'POLYGON'
      };
      const mvtFeatures = {
        info: { url: 'http://fack/iserver/services/mvt-example' },
        featureType: 'POLYGON'
      };
      const spy = jest.spyOn(viewModel, '_initOverlayLayer');
      viewModel.updateOverlayLayer(mvtLayerInfo, mvtFeatures);
      expect(spy).toBeCalled();
      done();
    };
    viewModel.on({ addlayerssucceeded: callback });
  });

  it('add baselayer which is baidu', done => {
    const callback = function (data) {
      expect(data).not.toBeUndefined();
      done();
    };
    const viewModel = new WebMapViewModel(baseLayers['BAIDU']);
    viewModel.on({ notsupportbaidumap: callback });
  });

  it('crs not support', done => {
    const get = jest.spyOn(CRS, 'get');
    get.mockImplementation(() => {
      return '';
    });
    try {
      new WebMapViewModel(baseLayers['BAIDU']);
    } catch (error) {
      expect(error.message).toBe('webmap.crsNotSupport');
      done();
    }
  });

  it('add baselayer which is bing', done => {
    const callback = function (data) {
      expect(data).not.toBeUndefined();
      done();
    };
    const viewModel = new WebMapViewModel(baseLayers['BING']);
    viewModel.on({ addlayerssucceeded: callback });
  });

  it('add baselayer which is goole_cn', done => {
    const callback = function (data) {
      expect(data).not.toBeUndefined();
      done();
    };
    const viewModel = new WebMapViewModel(baseLayers['GOOGLE']);
    viewModel.on({ addlayerssucceeded: callback });
  });

  it('add wmsLayer with correct url and version is less than 1.3', done => {
    const fetchResource = {
      'http://fake/iserver/services/map-world/wms130/%E4%B8%96%E7%95%8C%E5%9C%B0%E5%9B%BE_Day?REQUEST=GetCapabilities&SERVICE=WMS':
        wmsCapabilitiesTextWithoutVersion
    };
    mockFetch(fetchResource);
    const viewModel = new WebMapViewModel({
      ...wmsLayer,
      layers: [
        {
          ...wmsLayer.layers[0],
          url: 'http://fake/iserver/services/map-world/wms130/%E4%B8%96%E7%95%8C%E5%9C%B0%E5%9B%BE_Day?MAP=%E4%B8%96%E7%95%8C%E5%9C%B0%E5%9B%BE_Day&'
        }
      ]
    });
    const addLayerSpy = jest.spyOn(viewModel.map, 'addLayer');
    const callback = function (data) {
      expect(addLayerSpy).toHaveBeenCalledTimes(2);
      expect(data).not.toBeUndefined();
      done();
    };
    viewModel.on({ addlayerssucceeded: callback });
  });

  it('add wmsLayer with correct url and version is 1.3.0', async done => {
    const fetchResource = {
      'http://fack/iserver/services/map-world/wms130/%E4%B8%96%E7%95%8C%E5%9C%B0%E5%9B%BE_Day?REQUEST=GetCapabilities&SERVICE=WMS':
        wmsCapabilitiesTextWith130
    };
    mockFetch(fetchResource);
    const callback = async function (data) {
      await flushPromises()
      expect(data).not.toBeUndefined();
      expect(data.map.overlayLayersManager['世界地图_Day'].source.tiles[0].indexOf('{bbox-wms-1.3.0}')).toBeGreaterThan(-1)
      done();
    };
    const viewModel = new WebMapViewModel({
      ...wmsLayer,
      projection: "EPSG:4326",
      center: { x: 0, y: 0 },
      layers: [
        {
          ...wmsLayer.layers[0],
          url: 'http://fack/iserver/services/map-world/wms130/%E4%B8%96%E7%95%8C%E5%9C%B0%E5%9B%BE_Day?MAP=%E4%B8%96%E7%95%8C%E5%9C%B0%E5%9B%BE_Day&'
        }
      ]
    });
    viewModel.on({ addlayerssucceeded: callback });
  });

  it('add wmtsLayer with correct url', done => {
    const fetchResource = {
      'http://fack/iserver/services/map-china400/wmts100?REQUEST=GetCapabilities&SERVICE=WMTS&VERSION=1.0.0':
        wmtsCapabilitiesText
    };
    mockFetch(fetchResource);
    const viewModel = new WebMapViewModel(baseLayers['WMTS'], { ...commonOption });
    const addLayerSpy = jest.spyOn(viewModel.map, 'addLayer');
    const callback = function (data) {
      expect(addLayerSpy).toHaveBeenCalledTimes(2);
      expect(data).not.toBeUndefined();
      expect(viewModel.getSourceListModel).not.toBeNull();
      done();
    };
    viewModel.on({ addlayerssucceeded: callback });
  });

  it('add wmtsLayer with error url', done => {
    const callback = async function (data) {
      expect(data).not.toBeUndefined();
      done();
    };
    const viewModel = new WebMapViewModel({
      ...wmtsLayer,
      layers: [{ ...wmtsLayer.layers[0], url: '/iserver/services/map-china400/wmts100' }]
    });
    viewModel.on({ getmapinfofailed: callback });
  });

  describe('test layer autorefresh and visblescale', () => {
    it('tile layer', async done => {
      const viewModel = new WebMapViewModel(
        restmapLayer,
        { ...commonOption },
        { ...commonMapOptions },
        { ...commonMap }
      );
      jest.useFakeTimers();
      expect(viewModel._layerTimerList.length).toBe(0);
      await flushPromises();
      jest.advanceTimersByTime(1000);
      expect(viewModel._layerTimerList.length).not.toBe(0);
      jest.useRealTimers();
      done();
    });
    it('other layer except tile layer', async done => {
      const viewModel = new WebMapViewModel(heatLayer, { ...commonOption }, { ...commonMapOptions }, { ...commonMap });
      jest.useFakeTimers();
      expect(viewModel._layerTimerList.length).toBe(0);
      await flushPromises();
      jest.advanceTimersByTime(1000);
      expect(viewModel._layerTimerList.length).not.toBe(0);
      jest.useRealTimers();
      done();
    });
  });

  it('different projection', done => {
    const callback = function (data) {
      expect(data).not.toBeUndefined();
      done();
    };
    const map = {
      ...commonMap,
      getCRS: () => {
        return {
          epsgCode: 'EPSG:4326',
          getExtent: () => jest.fn()
        };
      }
    };
    const viewModel = new WebMapViewModel(restmapLayer, { ...commonOption }, {}, map);
    viewModel.on({ projectionIsNotMatch: callback });
  });

  describe('test transformRequest', () => {
    const proxyStr = 'http://localhost:8080/iportal/apps/viewer/getUrlResource.png?url=';
    it('add online map', done => {
      const viewModel = new WebMapViewModel(baseLayers['TILE'], {
        isSuperMapOnline: true,
        serverUrl: 'https://www.supermapol.com'
      });
      const {
        baseLayer: { url }
      } = baseLayers['TILE'];
      const mockTileUrl =
        `${url}/tileimage.png?scale=3.380327143205318e-9&x=1&y=0&width=256&height=256&transparent=true&redirect=false&cacheEnabled=true&origin=%7B%22x%22%3A-20037508.3427892%2C%22y%22%3A20037508.3427892%7D`.replace(
          'https://',
          'http://'
        );
      const transformed = viewModel.map.options.transformRequest(mockTileUrl, 'Tile');
      expect(transformed.url).toMatch('https://www.supermapol.com/apps/viewer/getUrlResource.png?url=');
      done();
    });
    it('add iportal map', done => {
      const viewModel = new WebMapViewModel(baseLayers['BAIDU']);
      const mockTileUrl = '';
      const transformed = viewModel.map.options.transformRequest(mockTileUrl);
      expect(transformed.url).toBe(mockTileUrl);
      done();
    });

    describe('add internet map', () => {
      const tiles = [
        'https://t0.tianditu.gov.cn/ter_w/wmts?tk=1d109683f4d84198e37a38c442d68311&service=WMTS&request=GetTile&version=1.0.0&style=default&tilematrixSet=w&format=tiles&width=256&height=256&layer=ter&tilematrix={z}&tilerow={y}&tilecol={x}',
        'https://t1.tianditu.gov.cn/ter_w/wmts?tk=1d109683f4d84198e37a38c442d68311&service=WMTS&request=GetTile&version=1.0.0&style=default&tilematrixSet=w&format=tiles&width=256&height=256&layer=ter&tilematrix={z}&tilerow={y}&tilecol={x}',
        'https://t2.tianditu.gov.cn/ter_w/wmts?tk=1d109683f4d84198e37a38c442d68311&service=WMTS&request=GetTile&version=1.0.0&style=default&tilematrixSet=w&format=tiles&width=256&height=256&layer=ter&tilematrix={z}&tilerow={y}&tilecol={x}',
        'https://t3.tianditu.gov.cn/ter_w/wmts?tk=1d109683f4d84198e37a38c442d68311&service=WMTS&request=GetTile&version=1.0.0&style=default&tilematrixSet=w&format=tiles&width=256&height=256&layer=ter&tilematrix={z}&tilerow={y}&tilecol={x}',
        'https://t4.tianditu.gov.cn/ter_w/wmts?tk=1d109683f4d84198e37a38c442d68311&service=WMTS&request=GetTile&version=1.0.0&style=default&tilematrixSet=w&format=tiles&width=256&height=256&layer=ter&tilematrix={z}&tilerow={y}&tilecol={x}',
        'https://t5.tianditu.gov.cn/ter_w/wmts?tk=1d109683f4d84198e37a38c442d68311&service=WMTS&request=GetTile&version=1.0.0&style=default&tilematrixSet=w&format=tiles&width=256&height=256&layer=ter&tilematrix={z}&tilerow={y}&tilecol={x}',
        'https://t6.tianditu.gov.cn/ter_w/wmts?tk=1d109683f4d84198e37a38c442d68311&service=WMTS&request=GetTile&version=1.0.0&style=default&tilematrixSet=w&format=tiles&width=256&height=256&layer=ter&tilematrix={z}&tilerow={y}&tilecol={x}',
        'https://t7.tianditu.gov.cn/ter_w/wmts?tk=1d109683f4d84198e37a38c442d68311&service=WMTS&request=GetTile&version=1.0.0&style=default&tilematrixSet=w&format=tiles&width=256&height=256&layer=ter&tilematrix={z}&tilerow={y}&tilecol={x}'
      ];
      const mapOptions = {
        style: {
          version: 8,
          sources: {
            baseLayer: {
              type: 'raster',
              tiles,
              tileSize: 256
            }
          },
          layers: [{ id: 'baseLayer', type: 'raster', source: 'baseLayer' }]
        },
        center: [107.7815, 39.9788],
        zoom: 5,
        renderWorldCopies: false,
        crs: {
          epsgCode: 'EPSG:3857'
        },
        minzoom: 0,
        maxzoom: 22
      };
      it('test fadeDuration', done => {
        jest.useFakeTimers();
        const viewModel = new WebMapViewModel('', { ...commonOption }, { ...mapOptions, fadeDuration: 300 });
        expect(viewModel.map).toBeUndefined();
        jest.advanceTimersByTime(0);
        expect(viewModel.map).not.toBeUndefined();
        jest.useRealTimers();
        done();
      });
      it('test transformRequest when proxy is string', done => {
        const viewModel = new WebMapViewModel('', { ...commonOption, proxy: proxyStr }, { ...mapOptions });
        const mockTileUrl = tiles[0].replace('{x}', 6).replace('{y}', 8).replace('{z}', 10);
        const transformed = viewModel.mapOptions.transformRequest(mockTileUrl, 'Tile');
        expect(transformed.url).toMatch(proxyStr);
        done();
      });
      it('test transformRequest when proxy is false', done => {
        const viewModel = new WebMapViewModel('', { ...commonOption }, { ...mapOptions });
        const mockTileUrl = tiles[0].replace('{x}', 6).replace('{y}', 8).replace('{z}', 10);
        const transformed = viewModel.mapOptions.transformRequest(mockTileUrl, 'Tile');
        expect(transformed.url).toBe(mockTileUrl);
        done();
      });
    });
  });
  it('layerFilter', done => {
    const callback = function (data) {
      expect(data.layers.length).toBe(1);
      done();
    };
    const viewModel = new WebMapViewModel(vectorLayer_line, {}, undefined, null, function (layer) {
      return layer.name === '浙江省高等院校(3)'
    });
    viewModel.on({ addlayerssucceeded: callback });
  });
});

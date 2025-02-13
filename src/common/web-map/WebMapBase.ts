import { Events } from 'vue-iclient/src/common/_types/event/Events';
import municipalCenterData from './config/MunicipalCenter.json';
import provincialCenterData from './config/ProvinceCenter.json';
import 'vue-iclient/static/libs/geostats/geostats';
import 'vue-iclient/static/libs/json-sql/jsonsql';
import isNumber from 'lodash.isnumber';
import canvg from 'canvg';

import WebMapService from '../_utils/WebMapService';
import { getColorWithOpacity } from '../_utils/util';
import { getProjection, registerProjection } from '../../common/_utils/epsg-define';
import { coordEach } from '@turf/meta';

// 迁徙图最大支持要素数量
const MAX_MIGRATION_ANIMATION_COUNT = 1000;
export default abstract class WebMapBase extends Events {
  map: any;

  mapId: string | number | Object;

  webMapInfo: any;

  mapOptions: any;

  serverUrl: string;

  accessToken: string;

  accessKey: string;

  tiandituKey: string;

  withCredentials: boolean;

  proxy: string | boolean;

  target: string;

  excludePortalProxyUrl: boolean;

  isSuperMapOnline: boolean;

  zoom: number;

  mapParams: { title?: string; description?: string };

  baseProjection: string;

  ignoreBaseProjection: boolean;

  on: any;

  echartslayer: any = [];

  eventTypes: any;

  triggerEvent: any;

  protected webMapService: WebMapService;

  protected _layers: any = [];

  protected _svgDiv: HTMLElement;

  protected _taskID: Date;

  protected layerAdded: number;

  protected expectLayerLen: number;

  constructor(id, options?, mapOptions?) {
    super();
    this.serverUrl = options.serverUrl || 'https://www.supermapol.com';
    this.accessToken = options.accessToken;
    this.accessKey = options.accessKey;
    this.tiandituKey = options.tiandituKey || '';
    this.withCredentials = options.withCredentials || false;
    this.proxy = options.proxy;
    this.target = options.target || 'map';
    this.excludePortalProxyUrl = options.excludePortalProxyUrl;
    this.isSuperMapOnline = options.isSuperMapOnline;
    this.ignoreBaseProjection = options.ignoreBaseProjection;
    this.echartslayer = [];
    this.webMapService = new WebMapService(id, options);
    this.mapOptions = mapOptions;
    this.eventTypes = [
      'getmapinfofailed',
      'crsnotsupport',
      'getlayerdatasourcefailed',
      'addlayerssucceeded',
      'notsupportmvt',
      'notsupportbaidumap',
      'projectionIsNotMatch',
      'beforeremovemap',
      'mapinitialized'
    ];
    this.mapId = id;
  }

  abstract _initWebMap(): void;
  abstract _getMapInfo(data, _taskID?);
  abstract _createMap();
  // TODO 重构子类 webmap layer 添加逻辑，只重写具体添加某个layer的方法，基类实现 initxxxx
  abstract _initBaseLayer(mapInfo);
  abstract _initOverlayLayer(layer, features?);

  abstract _addLayerSucceeded();
  abstract _unproject(point: [number, number]): [number, number];
  abstract cleanWebMap();

  public echartsLayerResize(): void {
    this.echartslayer.forEach(echartslayer => {
      echartslayer.chart.resize();
    });
  }

  public setMapId(mapId: string | number): void {
    if (typeof mapId === 'string' || typeof mapId === 'number') {
      this.mapId = mapId;
      this.webMapInfo = null;
    } else if (mapId !== null && typeof mapId === 'object') {
      this.webMapInfo = mapId;
    }
    this.webMapService.setMapId(mapId);
    setTimeout(() => {
      this._initWebMap();
    }, 0);
  }

  public setServerUrl(serverUrl: string): void {
    this.serverUrl = serverUrl;
    this.webMapService.setServerUrl(serverUrl);
  }

  public setWithCredentials(withCredentials) {
    this.withCredentials = withCredentials;
    this.webMapService.setWithCredentials(withCredentials);
  }

  public setProxy(proxy) {
    this.proxy = proxy;
    this.webMapService.setProxy(proxy);
  }

  public setZoom(zoom) {
    if (this.map) {
      this.mapOptions.zoom = zoom;
      if (zoom !== +this.map.getZoom().toFixed(2)) {
        (zoom || zoom === 0) && this.map.setZoom(zoom, { from: 'setZoom' });
      }
    }
  }

  public setMaxBounds(maxBounds): void {
    if (this.map) {
      this.mapOptions.maxBounds = maxBounds;
      maxBounds && this.map.setMaxBounds(maxBounds);
    }
  }

  public setMinZoom(minZoom): void {
    if (this.map) {
      this.mapOptions.minZoom = minZoom;
      (minZoom || minZoom === 0) && this.map.setMinZoom(minZoom);
    }
  }

  public setMaxZoom(maxZoom): void {
    if (this.map) {
      this.mapOptions.maxZoom = maxZoom;
      (maxZoom || maxZoom === 0) && this.map.setMaxZoom(maxZoom);
    }
  }

  protected initWebMap() {
    this.cleanWebMap();
    this.serverUrl = this.serverUrl && this.webMapService.handleServerUrl(this.serverUrl);
    if (this.webMapInfo) {
      // 传入是webmap对象
      const mapInfo = this.webMapInfo;
      mapInfo.mapParams = {
        title: this.webMapInfo.title,
        description: this.webMapInfo.description
      };
      this.mapParams = mapInfo.mapParams;
      this._getMapInfo(mapInfo);
      return;
    } else if (!this.mapId || !this.serverUrl) {
      this._createMap();
      return;
    }
    this._taskID = new Date();
    this.getMapInfo(this._taskID);
  }

  protected getMapInfo(_taskID) {
    this.serverUrl = this.serverUrl && this.webMapService.handleServerUrl(this.serverUrl);
    this.webMapService
      .getMapInfo()
      .then(
        (mapInfo: any) => {
          if (this._taskID !== _taskID) {
            return;
          }
          // 存储地图的名称以及描述等信息，返回给用户
          this.mapParams = mapInfo.mapParams;
          this._getMapInfo(mapInfo, _taskID);
        },
        error => {
          throw error;
        }
      )
      .catch(error => {
        this.triggerEvent('getmapinfofailed', { error });
        console.log(error);
      });
  }

  protected getBaseLayerType(layerInfo) {
    let layerType = layerInfo.layerType; // 底图和rest地图兼容

    if (
      layerType.indexOf('TIANDITU_VEC') > -1 ||
      layerType.indexOf('TIANDITU_IMG') > -1 ||
      layerType.indexOf('TIANDITU_TER') > -1
    ) {
      layerType = 'TIANDITU';
    }

    switch (layerType) {
      case 'TILE':
      case 'SUPERMAP_REST':
        return 'TILE';
      case 'CLOUD':
      case 'CLOUD_BLACK':
        return 'CLOUD';
      case 'OSM':
      case 'JAPAN_ORT':
      case 'JAPAN_RELIEF':
      case 'JAPAN_PALE':
      case 'JAPAN_STD':
      case 'GOOGLE_CN':
      case 'GOOGLE':
        return 'XYZ';
      default:
        return layerType;
    }
  }

  protected getMapurls(mapurl: { CLOUD?: string; CLOUD_BLACK?: string; OSM?: string } = {}) {
    const mapUrls = {
      CLOUD: mapurl.CLOUD || 'http://t2.dituhui.com/FileService/image?map=quanguo&type=web&x={x}&y={y}&z={z}',
      CLOUD_BLACK: mapurl.CLOUD_BLACK || 'http://t3.dituhui.com/MapService/getGdp?x={x}&y={y}&z={z}',
      OSM: mapurl.OSM || 'https://{a-c}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      GOOGLE:
        'https://www.google.cn/maps/vt/pb=!1m4!1m3!1i{z}!2i{x}!3i{y}!2m3!1e0!2sm!3i380072576!3m8!2szh-CN!3scn!5e1105!12m4!1e68!2m2!1sset!2sRoadmap!4e0!5m1!1e0',
      GOOGLE_CN: 'https://mt{0-3}.google.cn/vt/lyrs=m&hl=zh-CN&gl=cn&x={x}&y={y}&z={z}',
      JAPAN_STD: 'https://cyberjapandata.gsi.go.jp/xyz/std/{z}/{x}/{y}.png',
      JAPAN_PALE: 'https://cyberjapandata.gsi.go.jp/xyz/pale/{z}/{x}/{y}.png',
      JAPAN_RELIEF: 'https://cyberjapandata.gsi.go.jp/xyz/relief/{z}/{x}/{y}.png',
      JAPAN_ORT: 'https://cyberjapandata.gsi.go.jp/xyz/ort/{z}/{x}/{y}.jpg'
    };

    return mapUrls;
  }

  protected getLayerFeatures(layer, _taskID, type) {
    const getLayerFunc = this.webMapService.getLayerFeatures(type, layer, this.baseProjection);
    getLayerFunc &&
      getLayerFunc
        .then(
          async result => {
            if (this.mapId && this._taskID !== _taskID) {
              return;
            }
            if (result && layer.projection) {
              if (!getProjection(layer.projection)) {
                const epsgWKT = await this.webMapService.getEpsgCodeInfo(
                  layer.projection.split(':')[1],
                  this.serverUrl
                );
                if (epsgWKT) {
                  registerProjection(layer.projection, epsgWKT);
                }
              }
            }

            this._getLayerFeaturesSucceeded(result, layer);
          },
          error => {
            throw new Error(error);
          }
        )
        .catch(error => {
          this._addLayerSucceeded();
          this.triggerEvent('getlayerdatasourcefailed', { error, layer, map: this.map });
          console.log(error);
        });
  }

  protected setFeatureInfo(feature: any): any {
    let featureInfo;
    const info = feature.dv_v5_markerInfo;
    if (info && info.dataViz_title) {
      // 有featureInfo信息就不需要再添加
      featureInfo = info;
    } else {
      // featureInfo = this.getDefaultAttribute();
      return info;
    }
    const properties = feature.properties;
    for (const key in featureInfo) {
      if (properties[key]) {
        featureInfo[key] = properties[key];
        delete properties[key];
      }
    }
    return featureInfo;
  }

  protected getRankStyleGroup(themeField, features, parameters) {
    // 找出所有的单值
    const values = [];
    let segements = [];
    const style = parameters.style;
    const themeSetting = parameters.themeSetting;
    const segmentMethod = themeSetting.segmentMethod;
    const segmentCount = themeSetting.segmentCount;
    const customSettings = themeSetting.customSettings;
    const minR = parameters.themeSetting.minRadius;
    const maxR = parameters.themeSetting.maxRadius;
    const colors = themeSetting.colors;
    const fillColor = style.fillColor;
    features.forEach(feature => {
      const properties = feature.properties;
      const value = properties[themeField];
      // 过滤掉空值和非数值
      if (value == null || value === '' || !isNumber(+value)) {
        return;
      }
      values.push(Number(value));
    });
    try {
      segements = SuperMap.ArrayStatistic.getArraySegments(values, segmentMethod, segmentCount);
    } catch (error) {
      console.log(error);
    }

    // 处理自定义 分段
    for (let i = 0; i < segmentCount; i++) {
      if (i in customSettings) {
        const startValue = customSettings[i].segment.start;
        const endValue = customSettings[i].segment.end;
        startValue != null && (segements[i] = startValue);
        endValue != null && (segements[i + 1] = endValue);
      }
    }

    // 生成styleGroup
    const styleGroup = [];
    if (segements && segements.length) {
      const len = segements.length;
      const incrementR = (maxR - minR) / (len - 1); // 半径增量
      let start;
      let end;
      let radius = Number(((maxR + minR) / 2).toFixed(2));
      let color = '';
      const rangeColors = colors ? SuperMap.ColorsPickerUtil.getGradientColors(colors, len, 'RANGE') : [];
      for (let i = 0; i < len - 1; i++) {
        // 处理radius
        start = Number(segements[i].toFixed(2));
        end = Number(segements[i + 1].toFixed(2));
        // 这里特殊处理以下分段值相同的情况（即所有字段值相同）
        radius = start === end ? radius : minR + Math.round(incrementR * i);
        // 最后一个分段时将end+0.01，避免取不到最大值
        end = i === len - 2 ? end + 0.01 : end;
        // 处理自定义 半径
        radius = customSettings[i] && customSettings[i].radius ? customSettings[i].radius : radius;
        style.radius = radius;
        // 处理颜色
        if (colors && colors.length > 0) {
          color = customSettings[i] && customSettings[i].color ? customSettings[i].color : rangeColors[i] || fillColor;
          style.fillColor = color;
        }
        styleGroup.push({ radius, color, start, end, style });
      }
      return styleGroup;
    } else {
      return false;
    }
  }

  protected createRankStyleSource(parameters, features) {
    const themeSetting = parameters.themeSetting;
    const themeField = themeSetting.themeField;
    const styleGroups = this.getRankStyleGroup(themeField, features, parameters);
    // @ts-ignore
    return styleGroups ? { parameters, styleGroups } : false;
  }

  protected isMatchAdministrativeName(featureName, fieldName) {
    const isString = typeof fieldName === 'string' && fieldName.constructor === String;
    if (isString) {
      let shortName = featureName.substr(0, 2);
      // 张家口市和张家界市 特殊处理
      if (shortName === '张家') {
        shortName = featureName.substr(0, 3);
      }
      return !!fieldName.match(new RegExp(shortName));
    }
    return false;
  }

  protected getRestMapLayerInfo(restMapInfo, layer) {
    const { bounds, coordUnit, visibleScales, url } = restMapInfo;
    layer.layerType = 'TILE';
    layer.orginEpsgCode = this.baseProjection;
    layer.units = coordUnit && coordUnit.toLowerCase();
    layer.extent = [bounds.left, bounds.bottom, bounds.right, bounds.top];
    layer.visibleScales = visibleScales;
    layer.url = url;
    layer.sourceType = 'TILE';
    return layer;
  }

  protected handleLayerFeatures(features, layerInfo) {
    const { layerType, style, themeSetting, filterCondition } = layerInfo;
    if ((style || themeSetting) && filterCondition) {
      // 将 feature 根据过滤条件进行过滤, 分段专题图和单值专题图因为要计算 styleGroup 所以暂时不过滤
      if (layerType !== 'RANGE' && layerType !== 'UNIQUE' && layerType !== 'RANK_SYMBOL') {
        features = this.getFilterFeatures(filterCondition, features);
      }
    }

    return features;
  }

  protected mergeFeatures(layerId: string, features: any, mergeByField?: string): any {
    if (!(features instanceof Array)) {
      return features;
    }
    features = features.map((feature: any, index: any) => {
      if (!Object.prototype.hasOwnProperty.call(feature.properties, 'index')) {
        feature.properties.index = index;
      }
      return feature;
    });
    if (!features.length || !mergeByField && features[0].geometry) {
      return features;
    }
    const source = this.map.getSource(layerId);
    if ((!source || !source._data.features) && features[0].geometry) {
      return features;
    }
    const prevFeatures = source && source._data && source._data.features;
    const nextFeatures = [];
    if (!mergeByField && prevFeatures) {
      return prevFeatures;
    }
    features.forEach((feature: any) => {
      const prevFeature = prevFeatures.find((item: any) => {
        if (isNaN(+item.properties[mergeByField]) && isNaN(+feature.properties[mergeByField])) {
          return (
            JSON.stringify(item.properties[mergeByField] || '') ===
            JSON.stringify(feature.properties[mergeByField] || '')
          );
        } else {
          return +item.properties[mergeByField] === +feature.properties[mergeByField];
        }
      });
      if (prevFeature) {
        nextFeatures.push({
          ...prevFeature,
          ...feature
        });
      } else if (feature.geometry) {
        nextFeatures.push(feature);
      }
    });
    return nextFeatures;
  }

  protected getFilterFeatures(filterCondition: string, allFeatures): any {
    if (!filterCondition) {
      return allFeatures;
    }
    const condition = this.replaceFilterCharacter(filterCondition);
    const sql = 'select * from json where (' + condition + ')';
    const filterFeatures = [];
    for (let i = 0; i < allFeatures.length; i++) {
      const feature = allFeatures[i];
      let filterResult: any;
      try {
        filterResult = window.jsonsql.query(sql, {
          properties: feature.properties
        });
      } catch (err) {
        // 必须把要过滤得内容封装成一个对象,主要是处理jsonsql(line : 62)中由于with语句遍历对象造成的问题
        continue;
      }
      if (filterResult && filterResult.length > 0) {
        // afterFilterFeatureIdx.push(i);
        filterFeatures.push(feature);
      }
    }
    return filterFeatures;
  }

  protected replaceFilterCharacter(filterString: string): string {
    filterString = filterString
      .replace(/=/g, '==')
      .replace(/AND|and/g, '&&')
      .replace(/or|OR/g, '||')
      .replace(/<==/g, '<=')
      .replace(/>==/g, '>=');
    return filterString;
  }

  protected getEchartsLayerOptions(layerInfo, features, coordinateSystem) {
    const properties = this.webMapService.getFeatureProperties(features);
    const lineData = this._createLinesData(layerInfo, properties);
    const pointData = this._createPointsData(lineData, layerInfo, properties);
    const options = this._createOptions(layerInfo, lineData, pointData, coordinateSystem);
    return options;
  }

  protected getDashStyle(str, strokeWidth = 1, type = 'array') {
    if (!str) {
      return type === 'array' ? [] : '';
    }

    const w = strokeWidth;
    let dashArr;
    switch (str) {
      case 'solid':
        dashArr = [];
        break;
      case 'dot':
        dashArr = [1, 4 * w];
        break;
      case 'dash':
        dashArr = [4 * w, 4 * w];
        break;
      case 'dashrailway':
        dashArr = [8 * w, 12 * w];
        break;
      case 'dashdot':
        dashArr = [4 * w, 4 * w, 1 * w, 4 * w];
        break;
      case 'longdash':
        dashArr = [8 * w, 4 * w];
        break;
      case 'longdashdot':
        dashArr = [8 * w, 4 * w, 1, 4 * w];
        break;
      default:
        if (SuperMap.Util.isArray(str)) {
          dashArr = str;
        }
        str = SuperMap.String.trim(str).replace(/\s+/g, ',');
        dashArr = str.replace(/\[|\]/gi, '').split(',');
        break;
    }
    dashArr = type === 'array' ? dashArr : dashArr.join(',');
    return dashArr;
  }

  protected getCanvasFromSVG(svgUrl: string, divDom: HTMLElement, callBack: Function): void {
    const canvas = document.createElement('canvas');
    canvas.id = `dataviz-canvas-${new Date().getTime()}`;
    canvas.style.display = 'none';
    divDom.appendChild(canvas);
    if (svgUrl) {
      const canvgs = window.canvg ? window.canvg : canvg;
      canvgs(canvas.id, svgUrl, {
        ignoreMouse: true,
        ignoreAnimation: true,
        renderCallback: () => {
          if (canvas.width > 300 || canvas.height > 300) {
            return;
          }
          callBack(canvas);
        },
        forceRedraw: () => {
          return false;
        }
      });
    } else {
      callBack(canvas);
    }
  }

  protected getRangeStyleGroup(layerInfo: any, features: any): Array<any> | void {
    const { featureType, style, themeSetting } = layerInfo;
    const { customSettings, themeField, segmentCount, segmentMethod, colors } = themeSetting;

    // 找出分段值
    const values = [];
    let attributes;

    features.forEach(feature => {
      attributes = feature.properties;
      if (attributes) {
        // 过滤掉非数值的数据
        const val = attributes[themeField];
        (val || val === 0) && isNumber(+val) && values.push(parseFloat(val));
      }
    }, this);

    let segements =
      values && values.length && SuperMap.ArrayStatistic.getArraySegments(values, segmentMethod, segmentCount);
    if (segements) {
      let itemNum = segmentCount;
      if (attributes && segements[0] === segements[attributes.length - 1]) {
        itemNum = 1;
        segements.length = 2;
      }

      // 保留两位有效数
      for (let i = 0; i < segements.length; i++) {
        let value = segements[i];
        value = i === 0 ? Math.floor(value * 100) / 100 : Math.ceil(value * 100) / 100 + 0.1; // 加0.1 解决最大值没有样式问题
        segements[i] = Number(value.toFixed(2));
      }

      // 获取一定量的颜色
      let curentColors = colors;
      curentColors = SuperMap.ColorsPickerUtil.getGradientColors(curentColors, itemNum, 'RANGE');
      for (let index = 0; index < itemNum; index++) {
        if (index in customSettings) {
          if (customSettings[index].segment.start) {
            segements[index] = customSettings[index].segment.start;
          }
          if (customSettings[index].segment.end) {
            segements[index + 1] = customSettings[index].segment.end;
          }
        }
      }
      // 生成styleGroup
      const styleGroups = [];
      for (let i = 0; i < itemNum; i++) {
        let color = curentColors[i];
        if (i in customSettings) {
          if (customSettings[i].color) {
            color = customSettings[i].color;
          }
        }
        if (featureType === 'LINE') {
          style.strokeColor = color;
        } else {
          style.fillColor = color;
        }

        const start = segements[i];
        const end = segements[i + 1];
        const styleObj = JSON.parse(JSON.stringify(style));
        styleGroups.push({
          style: styleObj,
          color: color,
          start: start,
          end: end
        });
      }
      return styleGroups;
    }
  }

  protected getUniqueStyleGroup(parameters: any, features: any) {
    const { featureType, style, themeSetting } = parameters;
    const { colors, customSettings } = themeSetting;
    let themeField = themeSetting.themeField;
    // 找出所有的单值
    const featurePropertie = (features && features[0] && features[0].properties) || {};
    Object.keys(featurePropertie).forEach(key => {
      key.toLocaleUpperCase() === themeField.toLocaleUpperCase() && (themeField = key);
    });
    const names = [];
    for (const i in features) {
      const properties = features[i].properties;
      const name = properties[themeField];
      let isSaved = false;
      for (const j in names) {
        if (names[j] === name) {
          isSaved = true;
          break;
        }
      }
      if (!isSaved) {
        names.push(name || '0');
      }
    }

    // 获取一定量的颜色
    let curentColors = colors;
    curentColors = SuperMap.ColorsPickerUtil.getGradientColors(curentColors, names.length);

    const styleGroup = [];
    names.forEach((name, index) => {
      let color = curentColors[index];
      let itemStyle = { ...style };
      if (name in customSettings) {
        const customStyle = customSettings[name];
        if (typeof customStyle === 'object') {
          itemStyle = Object.assign(itemStyle, customStyle);
        } else {
          if (typeof customStyle === 'string') {
            color = customSettings[name];
          }
          if (featureType === 'LINE') {
            itemStyle.strokeColor = color;
          } else {
            itemStyle.fillColor = color;
          }
        }
      }

      styleGroup.push({
        color: color,
        style: itemStyle,
        value: name,
        themeField: themeField
      });
    }, this);

    return styleGroup;
  }

  protected transformFeatures(features) {
    features &&
      features.forEach((feature, index) => {
        let coordinates = feature.geometry && feature.geometry.coordinates;
        if (!coordinates || coordinates.length === 0) {
          return;
        }
        coordEach(feature, (coordinates) => {
          // @ts-ignore
          let transCoordinates = this._unproject(coordinates);
          coordinates[0] = transCoordinates[0];
          coordinates[1] = transCoordinates[1];
        });
        features[index] = feature;
      });

    return features;
  }

  private _drawTextRectAndGetSize({ context, style, textArray, lineHeight, doublePadding, canvas }) {
    let backgroundFill = style.backgroundFill;
    const maxWidth = style.maxWidth - doublePadding;
    let width = 0;
    let height = 0;
    let lineCount = 0;
    let lineWidths = [];
    // 100的宽度，去掉左右两边3padding
    textArray.forEach((arrText: string) => {
      let line = '';
      let isOverMax = false;
      lineCount++;
      for (let n = 0; n < arrText.length; n++) {
        let textLine = line + arrText[n];
        let metrics = context.measureText(textLine);
        let textWidth = metrics.width;
        if ((textWidth > maxWidth && n > 0) || arrText[n] === '\n') {
          line = arrText[n];
          lineCount++;
          // 有换行，记录当前换行的width
          isOverMax = true;
        } else {
          line = textLine;
          width = textWidth;
        }
      }
      if(isOverMax) {
        lineWidths.push(maxWidth);
      } else {
        lineWidths.push(width);
      }
    }, this);
    for (let i = 0; i < lineWidths.length; i++) {
      let lineW = lineWidths[i];
      if(lineW >= maxWidth) {
        // 有任何一行超过最大高度，就用最大高度
        width = maxWidth;
        break;
      } else if(lineW > width) {
        // 自己换行，就要比较每行的最大宽度
        width = lineW;
      }
    }
    width += doublePadding;
    // -6 是为了去掉canvas下方多余空白，让文本垂直居中
    height = lineCount * lineHeight + doublePadding - 6;
    canvas.width = width;
    canvas.height = height;
    context.fillStyle = backgroundFill;
    context.fillRect(0, 0, width, height);
    context.lineWidth = style.borderWidth;
    context.strokeStyle = style.borderColor;
    context.strokeRect(0, 0, width, height);
    return {
      width: width,
      height: height
    };
  }

  private _drawTextWithCanvas({ context, canvas, style }) {
    const padding = 8;
    const doublePadding = padding * 2;
    const lineHeight = Number(style.font.replace(/[^0-9]/ig, '')) + 3;
    const textArray = style.text.split('\r\n');
    context.font = style.font;
    const size = this._drawTextRectAndGetSize({ context, style, textArray, lineHeight, doublePadding, canvas });
    let positionY = padding;
    textArray.forEach((text: string, i: number) => {
      if(i !== 0) {
        positionY = positionY + lineHeight;
      }
      context.font = style.font;
      let textAlign = style.textAlign;
      let x: number;
      const width = size.width - doublePadding; // 减去padding
      switch (textAlign) {
        case 'center':
          x = width / 2;
          break;
        case 'right':
          x = width;
          break;
        default:
          x = 8;
          break;
      }
      // 字符分隔为数组
      const arrText = text.split('');
      let line = '';
      const fillColor = style.fillColor;
      // 每一行限制的高度
      let maxWidth = style.maxWidth - doublePadding;
      for (let n = 0; n < arrText.length; n++) {
        let testLine = line + arrText[n];
        let metrics = context.measureText(testLine);
        let testWidth = metrics.width;
        if ((testWidth > maxWidth && n > 0) || arrText[n] === '\n') {
          context.fillStyle = fillColor;
          context.textAlign = textAlign;
          context.textBaseline = 'top';
          context.fillText(line, x, positionY);
          line = arrText[n];
          positionY += lineHeight;
        } else {
          line = testLine;
        }
      }
      context.fillStyle = fillColor;
      context.textAlign = textAlign;
      context.textBaseline = 'top';
      context.fillText(line, x, positionY);
    }, this);
  }

  protected handleSvgColor(style, canvas) {
    const { fillColor, fillOpacity, strokeColor, strokeOpacity, strokeWidth } = style;
    const context = canvas.getContext('2d');
    if (style.text) {
      this._drawTextWithCanvas({ context, canvas, style });
      return;
    }
    if (fillColor) {
      context.fillStyle = getColorWithOpacity(fillColor, fillOpacity);
      context.fill();
    }

    if (strokeColor || strokeWidth) {
      context.strokeStyle = getColorWithOpacity(strokeColor, strokeOpacity);
      context.lineWidth = strokeWidth;
      context.stroke();
    }
  }

  private _createLinesData(layerInfo, properties) {
    const data = [];
    if (properties && properties.length) {
      // 重新获取数据
      const from = layerInfo.from;
      const to = layerInfo.to;
      let fromCoord;
      let toCoord;
      if (from.type === 'XY_FIELD' && from.xField && from.yField && to.xField && to.yField) {
        properties.forEach(property => {
          const fromX = property[from.xField];
          const fromY = property[from.yField];
          const toX = property[to.xField];
          const toY = property[to.yField];
          if (!fromX || !fromY || !toX || !toY) {
            return;
          }

          fromCoord = [property[from.xField], property[from.yField]];
          toCoord = [property[to.xField], property[to.yField]];
          data.push({
            coords: [fromCoord, toCoord]
          });
        });
      } else if (from.type === 'PLACE_FIELD' && from.field && to.field) {
        const centerDatas = provincialCenterData.concat(municipalCenterData);

        properties.forEach(property => {
          const fromField = property[from.field];
          const toField = property[to.field];
          fromCoord = centerDatas.find(item => {
            return this.isMatchAdministrativeName(item.name, fromField);
          });
          toCoord = centerDatas.find(item => {
            return this.isMatchAdministrativeName(item.name, toField);
          });
          if (!fromCoord || !toCoord) {
            return;
          }
          data.push({
            coords: [fromCoord.coord, toCoord.coord]
          });
        });
      }
    }
    return data;
  }

  private _createPointsData(lineData, layerInfo, properties) {
    let data = [];
    const labelSetting = layerInfo.labelSetting;
    // 标签隐藏则直接返回
    if (!labelSetting.show || !lineData.length) {
      return data;
    }
    const fromData = [];
    const toData = [];
    lineData.forEach((item, idx) => {
      const coords = item.coords;
      const fromCoord = coords[0];
      const toCoord = coords[1];
      const fromProperty = properties[idx][labelSetting.from];
      const toProperty = properties[idx][labelSetting.to];
      // 起始字段去重
      const f = fromData.find(d => {
        return d.value[0] === fromCoord[0] && d.value[1] === fromCoord[1];
      });
      !f &&
        fromData.push({
          name: fromProperty,
          value: fromCoord
        });
      // 终点字段去重
      const t = toData.find(d => {
        return d.value[0] === toCoord[0] && d.value[1] === toCoord[1];
      });
      !t &&
        toData.push({
          name: toProperty,
          value: toCoord
        });
    });
    data = fromData.concat(toData);
    return data;
  }

  private _createOptions(layerInfo, lineData, pointData, coordinateSystem) {
    let series;
    const lineSeries = this._createLineSeries(layerInfo, lineData, coordinateSystem);
    if (pointData && pointData.length) {
      const pointSeries: any = this._createPointSeries(layerInfo, pointData, coordinateSystem);
      series = lineSeries.concat(pointSeries);
    } else {
      series = lineSeries.slice();
    }
    return { series };
  }

  private _createPointSeries(layerInfo, pointData, coordinateSystem) {
    const lineSetting = layerInfo.lineSetting;
    const animationSetting = layerInfo.animationSetting;
    const labelSetting = layerInfo.labelSetting;
    const pointSeries = [
      {
        name: 'point-series',
        coordinateSystem: coordinateSystem,
        zlevel: 2,
        label: {
          normal: {
            show: labelSetting.show,
            position: 'right',
            formatter: '{b}',
            color: labelSetting.color,
            fontFamily: labelSetting.fontFamily
          }
        },
        itemStyle: {
          normal: {
            color: lineSetting.color || labelSetting.color
          }
        },
        data: pointData
      }
    ];

    if (animationSetting.show) {
      // 开启动画
      // @ts-ignore
      pointSeries[0].type = 'effectScatter';
      // @ts-ignore
      pointSeries[0].rippleEffect = {
        brushType: 'stroke'
      };
    } else {
      // 关闭动画
      // @ts-ignore
      pointSeries[0].type = 'scatter';
    }

    return pointSeries;
  }

  private _createLineSeries(layerInfo, lineData, coordinateSystem) {
    const lineSetting = layerInfo.lineSetting;
    const animationSetting = layerInfo.animationSetting;
    const linesSeries = [
      // 轨迹线样式
      {
        name: 'line-series',
        coordinateSystem: coordinateSystem,
        type: 'lines',
        zlevel: 1,
        effect: {
          show: animationSetting.show,
          constantSpeed: animationSetting.constantSpeed,
          trailLength: 0,
          symbol: animationSetting.symbol,
          symbolSize: animationSetting.symbolSize
        },
        lineStyle: {
          normal: {
            color: lineSetting.color,
            type: lineSetting.type,
            width: lineSetting.width,
            opacity: lineSetting.opacity,
            curveness: lineSetting.curveness
          }
        },
        data: lineData
      }
    ];

    if (lineData.length >= MAX_MIGRATION_ANIMATION_COUNT) {
      // @ts-ignore
      linesSeries[0].large = true;
      // @ts-ignore
      linesSeries[0].largeThreshold = 100;
      // @ts-ignore
      linesSeries[0].blendMode = 'lighter';
    }

    return linesSeries;
  }

  private _getLayerFeaturesSucceeded(result, layer) {
    switch (result.type) {
      case 'feature':
        this._initOverlayLayer(layer, result.features);
        break;
      case 'restMap':
        layer.layerType = 'restMap';
        this._initOverlayLayer(layer, result.restMaps);
        break;
      case 'mvt':
        layer.layerType = 'mvt';
        this._initOverlayLayer(layer, result);
        break;
      case 'dataflow':
      case 'noServerId':
        this._initOverlayLayer(layer);
        break;
    }
  }
}

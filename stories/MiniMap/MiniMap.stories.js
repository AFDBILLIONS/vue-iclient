import { toI18n } from '../../.storybook/lang';

export default {
  title: 'Gis Component/miniMap'
};
export const miniMap = () => ({
  template: `
  <sm-web-map style="height:700px" serverUrl='https://iportal.supermap.io/iportal' mapId="1329428269">
    <sm-mini-map :collapsed="false"></sm-mini-map>
  </sm-web-map>
    `
});
miniMap.story = {
  name: toI18n('gisComponent.miniMap')
};

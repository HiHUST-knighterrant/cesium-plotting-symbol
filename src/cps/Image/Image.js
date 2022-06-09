import Graph from '../Graph'
import Rectangle from '../Polygon/Rectangle'
import * as Cesium from 'cesium';

export default class Image extends Rectangle {
  
  constructor (p, viewer, layer) {
    super({
      type: '图',
      color: '#fff',
      alpha: 1,
      image: 'th1.jpg',
      outline: false,
      ...p
    }, viewer, layer)
  }

  initProps (defs) {
    super.initProps([
      {name: 'image', title: '图形', type: 'string'},
      ...defs
    ])
  }

  initShape() {
    this.ent = this.entities.add(new Cesium.Entity({polygon: {}}))
    super.fillShape(this.ent)
    Object.assign(this.ent.polygon, {
      fill: new Cesium.CallbackProperty((time, result) => this.ent.propx.fill.value, true),
      material: new Cesium.ImageMaterialProperty({
        image: new Cesium.CallbackProperty((time, result) => '../../../static/img/' + this.ent.propx.image.value, true),
        color: new Cesium.CallbackProperty((time, result) => {
          let c = Cesium.Color.fromCssColorString(this.ent.propx.color.value).withAlpha(this.ent.propx.alpha.value)
          return this.ent.highLighted ? c.brighten(0.6, new Cesium.Color()) : c
        }, true),
        transparent: true
      }),
      outline: new Cesium.CallbackProperty((time, result) => this.ent.propx.outline.value, true),
      outlineColor: new Cesium.CallbackProperty((time, result) => {
        return Cesium.Color.fromCssColorString(this.ent.propx.outlineColor.value).withAlpha(this.ent.propx.alpha.value)
      }, true),
      height: 0,
      outlineWidth: new Cesium.CallbackProperty((time, result) => this.ent.propx.outlineWidth.value, true),
      hierarchy: new Cesium.CallbackProperty((time, result) => {
        return this.calcuteShape(this.graph.ctl._children.concat(window.cursor), time)
      }, false)
    })
  }
}

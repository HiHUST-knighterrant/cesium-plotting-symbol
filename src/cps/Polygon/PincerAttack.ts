import * as turf from '@turf/turf'
import * as mu from '../mapUtil'
import Polygon from './Polygon'
import _ from 'lodash'
import * as Cesium from "cesium"
import { Bezier } from 'bezier-js';
import { baseParse } from '@vue/compiler-core'

type Pot = turf.Feature<turf.Point, turf.Properties>

export default class PincerAttack extends Polygon {

  minPointNum = 2
  maxPointNum = 8

  constructor(p: {}, viewer: Cesium.Viewer, layer: Cesium.Entity){
    super({
      type: '钳击',
      ...p}, viewer, layer)
  }
  options: {units: turf.helpers.Units | undefined } = { units:  'kilometers' }

   createEndArrow(ep: Pot, bearing: number, width: number) {
    let innerDeg = 160
    let innerDis = width / 2 / Math.cos((innerDeg - 90) / 180 * Math.PI)
    let outerDeg = 150
    let outerDis = width / Math.cos((outerDeg - 90) / 180 * Math.PI)
    return [
      turf.destination(ep, innerDis, bearing + innerDeg, this.options),
      turf.destination(ep, outerDis, bearing + outerDeg, this.options),
      turf.destination(ep, 0, bearing, this.options),
      turf.destination(ep, outerDis, bearing - outerDeg, this.options),
      turf.destination(ep, innerDis, bearing - innerDeg, this.options)
    ]
  }

  // private calcEdge(p0: Pot, p1: Pot, p2: Pot, width: number, ebear: number) {
  //   let midPoint = turf.midpoint(p1, p2)
  //   let dis = turf.distance(p0, p1, {units: 'kilometers'}) / 5
  //   let tp = turf.destination(midPoint, dis, width>0 ? 90+ebear : -90+ ebear, {units: 'kilometers'})

  //   let lonlat = [p1, tp, p2].map(p => {
  //     let c = turf.getCoord(p);
  //     return { x:c[0] , y: c[1] } })
  //   let curvePoints = new Bezier(lonlat).getLUT()
  //   return curvePoints.map( p => [p.x, p.y])
  // }

  private calcEdge2(px: Array<Pot>) {
    let lonlat = px
                   .filter(x => { return x != undefined })
                   .map ( p => {
      let c = turf.getCoord(p);
      return { x: c[0], y: c[1] }
    })
   let curvePoints = new Bezier(lonlat).getLUT()
    return curvePoints.map(p => [p.x, p.y])
  }

  private calcMid(ps: Array<Pot|undefined>) {
    let midPs = ps
      .filter( x => x!=undefined)
      .map(pt => turf.getCoord(pt)).map( p => {return {x: p[0], y: p[1]} })
    let res = new Bezier(midPs).getLUT()
    return res.map(p => [p.x, p.y])
  }

  calcuteShape (points: Array<Cesium.Entity>, time: Cesium.JulianDate) {
    if (points.length < this.minPointNum) {
      return []
    } else if (points.length == 2) {
      return points.map((pt) => pt.position.getValue(time))
    } else {
      let posis = points.map(ent => ent.position.getValue(time))
      let turfPoints = posis.map(cartesian3 => {
        let longLat = mu.cartesian2lonlat(cartesian3)
        return turf.point(longLat)
      })
      let ps = []
      if (turfPoints.length >= this.maxPointNum-1) {
        let baseLeft = turfPoints[0]
        let baseRight = turfPoints[1]
        let ctlRight = turfPoints[2]
        let arrow1p = turfPoints[3]
        let arrow2p = turfPoints[4]
        let ctlLeft = turfPoints[5]
        let ctlLeft2 = turfPoints[6]
        let ctlRight2 = turfPoints.length == this.maxPointNum ? turfPoints[7] : undefined
        let ebear1 = turf.bearing(ctlRight, arrow1p)
        let endArrow1 = this.createEndArrow(arrow1p, ebear1, 20)
        let rightEdge = this.calcEdge2([baseRight, ctlRight, endArrow1[0]])
        let ebear2 = turf.bearing(ctlLeft, arrow2p)
        let endArrow2 = this.createEndArrow(arrow2p, ebear2, 20)
        let leftEdge = this.calcEdge2([baseLeft, ctlLeft, endArrow2[4]]).reverse()
        let midEdge = this.calcMid([endArrow1[4], ctlRight2, ctlLeft2, endArrow2[0]])
        ps = [
          ...rightEdge, ...endArrow1,
          ...midEdge,
          ...endArrow2, ...leftEdge
        ]
      } else if (turfPoints.length == 6) {
        let baseLeft = turfPoints[0]
        let baseRight = turfPoints[1]
        let ctlRight = turfPoints[2]
        let arrow1p = turfPoints[3]
        let arrow2p = turfPoints[4]
        let ctlLeft = turfPoints[5]
        let ebear1 = turf.bearing(ctlRight, arrow1p)
        let endArrow1 = this.createEndArrow(arrow1p, ebear1, 20)
        let rightEdge = this.calcEdge2([baseRight, ctlRight, endArrow1[0]])
        let ebear2 = turf.bearing(ctlLeft, arrow2p)
        let endArrow2 = this.createEndArrow(arrow2p, ebear2, 20)
        let leftEdge = this.calcEdge2([baseLeft, ctlLeft, endArrow2[4]]).reverse()
        ps = [
          ...rightEdge, ...endArrow1,
          ...endArrow2, ...leftEdge
        ]
      } else if (turfPoints.length >= 4) {
        let baseLeft = turfPoints[0]
        let baseRight = turfPoints[1]
        let ctlRight = turfPoints[2]
        let arrow1p = turfPoints[3]
        let ebear1 = turf.bearing(ctlRight, arrow1p)
        let endArrow1 = this.createEndArrow(arrow1p, ebear1, 20)
        let rightEdge = this.calcEdge2([baseRight, ctlRight, endArrow1[0]])
        ps = [
          ...rightEdge, ...endArrow1
          ]
      }
      return ps.map(tgt => mu.lonlat2Cartesian(turf.getCoord(tgt)))
    }
  }
}

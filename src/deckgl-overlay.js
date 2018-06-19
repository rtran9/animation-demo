import React, {Component} from 'react';
import DeckGL, {ArcLayer, ScatterplotLayer} from 'deck.gl';
import ModifiedArcLayer from './modified-arc-layer';

export default class DeckGLOverlay extends Component {

  render() {
    if (!this.props.data) {
      return null;
    }

    const layers = [
      new ScatterplotLayer({
        id: `pickup`,
        data: this.props.data,
        getPosition: d => [d.pickup_longitude, d.pickup_latitude],
        getColor: d => [0, 128, 255],
        radiusScale: 40
      }),
      new ScatterplotLayer({
        id: `dropoff`,
        data: this.props.data,
        getPosition: d => [d.dropoff_longitude, d.dropoff_latitude],
        getColor: d => [255, 0, 128],
        radiusScale: 40
      }),
      // hint arc line
      new ArcLayer({
        id: 'arc-layer',
        data: this.props.data,
        getSourcePosition: d => [d.pickup_longitude, d.pickup_latitude],
        getTargetPosition: d => [d.dropoff_longitude, d.dropoff_latitude],
        getSourceColor: d => [0, 128, 255],
        getTargetColor: d => [255, 0, 128],
        getStrokeWidth: 4,
      }),
      new ModifiedArcLayer({
        id: 'modified-arc-layer',
        data: this.props.data,
        getSourcePosition: d => [d.pickup_longitude, d.pickup_latitude],
        getTargetPosition: d => [d.dropoff_longitude, d.dropoff_latitude],
        getSourceColor: d => [0, 128, 255],
        getTargetColor: d => [255, 0, 128],
        getStrokeWidth: 4,
        currentTime: (Date.now() / 1000) % 10.0
      })
      // // arc animiation layer
      // new TripsArcLayer({
      //   id: 'taxi-trips',
      //   data: this.props.data,
      //   pickupColor: [0, 128, 255],
      //   dropoffColor: [255, 0, 128],
      //   getPickupLocation: d => [d.pickup_longitude, d.pickup_latitude],
      //   getDropoffLocation: d => [d.dropoff_longitude, d.dropoff_latitude],
      //   getSourcePosition: d => [d.pickup_longitude, d.pickup_latitude],
      //   getTargetPosition: d => [d.dropoff_longitude, d.dropoff_latitude],
      //   getSourceColor: d => [0, 128, 255],
      //   getTargetColor: d => [255, 0, 128],
      //   currentTime: (Date.now() / 1000) % 6.0,
      //   strokeWidth: 30
      // })
    ];

    return (
      <DeckGL {...this.props.viewport} layers={layers} />
    );
  }
}

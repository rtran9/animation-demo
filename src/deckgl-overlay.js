import React, {Component} from 'react';
import DeckGL, {ScatterplotLayer} from 'deck.gl';
import TripsArcLayer from './trips-arc-layer';

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
      new TripsArcLayer({
        id: 'taxi-trips',
        data: this.props.data,
        pickupColor: [0, 128, 255],
        dropoffColor: [255, 0, 128],
        getPickupLocation: d => [d.pickup_longitude, d.pickup_latitude],
        getDropoffLocation: d => [d.dropoff_longitude, d.dropoff_latitude],
        getSourcePosition: d => [d.pickup_longitude, d.pickup_latitude],
        getTargetPosition: d => [d.dropoff_longitude, d.dropoff_latitude],
        getSourceColor: d => [0, 128, 255],
        getTargetColor: d => [255, 0, 128],
        getTime: d => {
          const pickupDate = new Date(d.pickup_datetime);
          return pickupDate.getUTCHours() + pickupDate.getMinutes() / 60;
        },
        currentTime: (Date.now() / 1000) % 24,
        strokeWidth: 2
      })
    ];

    return (
      <DeckGL {...this.props.viewport} layers={layers} />
    );
  }
}

import DeckGL, {ArcLayer, CompositeLayer, ScatterplotLayer} from 'deck.gl';

export default class TaxiLayer extends CompositeLayer {
	renderLayers() {
		const timeOfDay = Date.now();

    return [
			new ArcLayer({
        id: `${this.props.id}-arc`,
        data: this.props.data,
        getSourcePosition: this.props.getPickupLocation,
        getTargetPosition: this.props.getDropoffLocation,
        getSourceColor: d => this.props.pickupColor,
        getTargetColor: d => this.props.dropoffColor,
        strokeWidth: 2
      })
    ]
  }
}

import DeckGL, {ArcLayer} from 'deck.gl';

import vertexShader from './trips-arc-layer-vertex.glsl';
import fragmentShader from './trips-arc-layer-fragment.glsl';

export default class TripsArcLayer extends ArcLayer {
	initializeState() {
    super.initializeState(...arguments);

    this.state.attributeManager.addInstanced({
      instanceTimes: {size: 1, accessor: 'getTime'}
    });
  }

	updateState({props}) {
    super.updateState(...arguments);

    this.state.model.setUniforms({
      currentTime: props.currentTime
    });
  }

	getShaders() {
		return {
      ...super.getShaders(),
			vs: vertexShader,
      fs: fragmentShader
    };
  }
}

TripsArcLayer.layerName = 'TripsArcLayer';

import {COORDINATE_SYSTEM, Layer} from 'deck.gl';
import {Geometry, GL, loadTextures, Model} from 'luma.gl';
import {Matrix4} from 'math.gl';

import vs from './trips-arc-layer-vertex.glsl';
import fs from './trips-arc-layer-fragment.glsl';

const defaultProps = {
  getSourcePosition: x => x.sourcePosition,
  getTargetPosition: x => x.targetPosition
};

export default class TripsArcLayer extends Layer {
  constructor(props) {
    let overrideProps = null;
    if (Number.isFinite(props.strokeWidth)) {
      overrideProps = {
        getStrokeWidth: props.strokeWidth
      };
    }
    super(props, overrideProps);
  }

  getShaders() {
    return {
			vs,
			fs,
			modules: ['picking']
		};
  }

  initializeState() {
    const attributeManager = this.getAttributeManager();
    const {gl} = this.context;

    /* eslint-disable max-len */
    attributeManager.addInstanced({
      instancePositions: {
        size: 4,
        transition: true,
        accessor: ['getSourcePosition', 'getTargetPosition'],
        update: this.calculateInstancePositions
      }
    });

		this.setState({
			model: this._getModel(gl)
		});

		loadTextures(gl, {
			// https://www.iconfinder.com/icons/2714753/2107_auto_automobile_avtovaz_car_lada_vehicle_icon
			urls: ['car.svg']
		}).then(textures => {
			this.state.model.setUniforms({
				uSampler: textures[0]
			})
		});
  }

  updateAttribute({props, oldProps, changeFlags}) {
    const attributeManager = this.getAttributeManager();
    attributeManager.invalidateAll();
  }

  updateState({props, oldProps, changeFlags}) {
		super.updateState({props, oldProps, changeFlags});

    this.state.model.setUniforms({
			currentTime: props.currentTime
		});

    this.updateAttribute({props, oldProps, changeFlags});
  }

  _getModel(gl) {
    const NUM_SEGMENTS = 2;

    let positions = [];
    let texCoords = [];
    let indices = [];

    for (let i = 0; i < NUM_SEGMENTS; i++) {
      positions = positions.concat([
        i + 0.1, -1, -1,
        i + 0.1, 1, -1,
        i + 0.1, 1, 1,
        i + 0.1, -1, 1,

        i + 0.9, -1, -1,
        i + 0.9, 1, -1,
        i + 0.9, 1, 1,
        i + 0.9, -1, 1,
      ]);
    }

    for (let i = 0; i < 2*NUM_SEGMENTS; i++) {
      texCoords = texCoords.concat([
        1.0, 0.0,
        1.0, 1.0,
        0.0, 1.0,
        0.0, 0.0,
      ]);
    }

    for (let i = 0; i < NUM_SEGMENTS; i++) {
      indices = indices.concat([
        i + 0, i + 1, i + 2,
        i + 0, i + 2, i + 3,
        i + 4, i + 5, i + 6,
        i + 4, i + 6, i + 7,
      ]);
    }

		const model = new Model(
      gl,
      Object.assign({}, this.getShaders(), {
        id: this.props.id,
        geometry: new Geometry({
          drawMode: GL.TRIANGLES,
					attributes: {
						positions: new Float32Array(positions),
						texCoords: new Float32Array(texCoords),
						indices: new Uint16Array(indices)
          }
      	}),
      	isInstanced: true,
      	shaderCache: this.context.shaderCache
  		})
		);

    const scaleFactor = 0.05;
    const scaler = new Matrix4().scale([0.001, scaleFactor, scaleFactor]);

    model.setUniforms({
      uSMatrix: scaler
    });

    return model;
  }

  calculateInstancePositions(attribute) {
    const {data, getSourcePosition, getTargetPosition} = this.props;
    const {value, size} = attribute;

    let i = 0;
    for (let j = 0; j < data.length; j++) {
			const object = data[j];

      const sourcePosition = getSourcePosition(object);
      const targetPosition = getTargetPosition(object);

			value[i + 0] = sourcePosition[0];
      value[i + 1] = sourcePosition[1];
      value[i + 2] = targetPosition[0];
      value[i + 3] = targetPosition[1];

      i += size;
    }
  }
}

TripsArcLayer.layerName = 'TripsArcLayer';
TripsArcLayer.defaultProps = defaultProps;

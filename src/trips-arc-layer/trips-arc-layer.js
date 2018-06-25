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
    super(props);
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
			urls: [this.props.url]
		}).then(textures => {
			this.state.model.setUniforms({
				uTexture: textures[0]
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
    const NUM_SEGMENTS = 1;

    let positions = [];
    let texCoords = [];
    let indices = [];

    for (let i = 0; i < NUM_SEGMENTS; i++) {
      positions = positions.concat([
        2*i, -1, -1,
        2*i, 1, -1,
        2*i, 1, 1,
        2*i, -1, 1,

        2*i + 1.0, -1, -1,
        2*i + 1.0, 1, -1,
        2*i + 1.0, 1, 1,
        2*i + 1.0, -1, 1,
      ]);
    }

    for (let i = 0; i < NUM_SEGMENTS; i++) {
      texCoords = texCoords.concat([
        0.0, 0.0,
        0.0, 1.0,
        1.0, 1.0,
        1.0, 0.0,

        0.0, 0.0,
        0.0, 1.0,
        1.0, 1.0,
        1.0, 0.0,
      ]);
    }

    for (let i = 0; i < 2*NUM_SEGMENTS; i++) {
      indices = indices.concat([
        4*i + 0, 4*i + 1, 4*i + 2,
        4*i + 0, 4*i + 2, 4*i + 3,
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

    const scaleX = 0.005;
    const scaleY = 0.05;
    const scaleZ = 0.05;

    const scalerMatrix = new Matrix4().scale([
      scaleX,
      scaleY,
      scaleZ
    ]);

    model.setUniforms({
      uSMatrix: scalerMatrix
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

import {COORDINATE_SYSTEM, Layer} from 'deck.gl';
import {Geometry, GL, Model} from 'luma.gl';
import {Matrix4} from 'math.gl';

import vs from './cube-arc-layer-vertex.glsl';
import fs from './cube-arc-layer-fragment.glsl';

const DEFAULT_COLOR = [0, 0, 0, 255];

const defaultProps = {
  getSourcePosition: x => x.sourcePosition,
  getTargetPosition: x => x.targetPosition
};

export default class CubeArcLayer extends Layer {
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
		}; // 'project' module added by default.
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

    /* eslint-enable max-len */
  }

  updateAttribute({props, oldProps, changeFlags}) {
    const attributeManager = this.getAttributeManager();
    attributeManager.invalidateAll();
  }

  updateState({props, oldProps, changeFlags}) {
    super.updateState({props, oldProps, changeFlags});

		const {gl} = this.context;
		if (this.state.model) {
			this.state.model.delete();
		}
		this.setState({
			model: this._getModel(gl)
		});

    this.state.model.setUniforms({
			currentTime: props.currentTime
		});

    this.updateAttribute({props, oldProps, changeFlags});
  }

  _getModel(gl) {
		const model = new Model(
      gl,
      Object.assign({}, this.getShaders(), {
        id: this.props.id,
        geometry: new Geometry({
          drawMode: GL.TRIANGLE_STRIP,
          attributes: {
            positions: new Float32Array([
              -1, -1,  1,
               1, -1,  1,
               1,  1,  1,
              -1,  1,  1,

              -1, -1, -1,
              -1,  1, -1,
               1,  1, -1,
               1, -1, -1,

              -1,  1, -1,
              -1,  1,  1,
               1,  1,  1,
               1,  1, -1,

              -1, -1, -1,
               1, -1, -1,
               1, -1,  1,
              -1, -1,  1,

               1, -1, -1,
               1,  1, -1,
               1,  1,  1,
               1, -1,  1,

              -1, -1, -1,
              -1, -1,  1,
              -1,  1,  1,
              -1,  1, -1
						]),

            colors: {
              size: 4,
              value: new Float32Array([
                1, 0, 0, 1,
                1, 0, 0, 1,
                1, 0, 0, 1,
                1, 0, 0, 1,

                1, 1, 0, 1,
                1, 1, 0, 1,
                1, 1, 0, 1,
                1, 1, 0, 1,

                0, 1, 0, 1,
                0, 1, 0, 1,
                0, 1, 0, 1,
                0, 1, 0, 1,

                1, 0.5, 0.5, 1,
                1, 0.5, 0.5, 1,
                1, 0.5, 0.5, 1,
                1, 0.5, 0.5, 1,

                1, 0, 1, 1,
                1, 0, 1, 1,
                1, 0, 1, 1,
                1, 0, 1, 1,

                0, 0, 1, 1,
                0, 0, 1, 1,
                0, 0, 1, 1,
                0, 0, 1, 1
              ])
            },

            indices: new Uint16Array([
              0, 1, 2, 0, 2, 3,
              4, 5, 6, 4, 6, 7,
              8, 9, 10, 8, 10, 11,
              12, 13, 14, 12, 14, 15,
              16, 17, 18, 16, 18, 19,
              20, 21, 22, 20, 22, 23
            ])
          }
      	}),
      	isInstanced: true,
      	shaderCache: this.context.shaderCache
  		})
		);

    const scaleFactor = 0.03;
    const scaler = new Matrix4().scale([scaleFactor, scaleFactor, scaleFactor]);

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

CubeArcLayer.layerName = 'CubeArcLayer';
CubeArcLayer.defaultProps = defaultProps;

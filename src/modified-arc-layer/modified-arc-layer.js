import {COORDINATE_SYSTEM, Layer} from 'deck.gl';
import {GL, Model, Geometry, fp64, setParameters} from 'luma.gl';
import {Matrix4} from 'math.gl';

const {fp64LowPart} = fp64;

import vs from './modified-arc-layer-vertex.glsl';
import vs64 from './modified-arc-layer-vertex-64.glsl';
import fs from './modified-arc-layer-fragment.glsl';

import vsCube from './cube-vertex.glsl';
import fsCube from './cube-fragment.glsl';

const DEFAULT_COLOR = [0, 0, 0, 255];

const defaultProps = {
  fp64: false,

  getSourcePosition: x => x.sourcePosition,
  getTargetPosition: x => x.targetPosition,
  getSourceColor: x => x.color || DEFAULT_COLOR,
  getTargetColor: x => x.color || DEFAULT_COLOR,
  getStrokeWidth: 1
};

export default class ModifiedArcLayer extends Layer {
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
    return this.is64bitEnabled()
      ? {vs: vs64, fs, modules: ['project64', 'picking']}
      : {vs: vsCube, fs: fsCube, modules: ['picking']}; // 'project' module added by default.
  }

  initializeState() {
    const attributeManager = this.getAttributeManager();

    /* eslint-disable max-len */
    attributeManager.addInstanced({
      instancePositions: {
        size: 4,
        transition: true,
        accessor: ['getSourcePosition', 'getTargetPosition'],
        update: this.calculateInstancePositions
      },
      instanceSourceColors: {
        size: 4,
        type: GL.UNSIGNED_BYTE,
        transition: true,
        accessor: 'getSourceColor',
        defaultValue: DEFAULT_COLOR
      },
      instanceTargetColors: {
        size: 4,
        type: GL.UNSIGNED_BYTE,
        transition: true,
        accessor: 'getTargetColor',
        defaultValue: DEFAULT_COLOR
      },
      instanceWidths: {
        size: 1,
        transition: true,
        accessor: 'getStrokeWidth',
        defaultValue: 1
      }
    });
    /* eslint-enable max-len */
  }

  updateAttribute({props, oldProps, changeFlags}) {
    if (props.fp64 !== oldProps.fp64) {
      const attributeManager = this.getAttributeManager();
      attributeManager.invalidateAll();

      if (props.fp64 && props.coordinateSystem === COORDINATE_SYSTEM.LNGLAT) {
        attributeManager.addInstanced({
          instancePositions64Low: {
            size: 4,
            accessor: ['getSourcePosition', 'getTargetPosition'],
            update: this.calculateInstancePositions64Low
          }
        });
      } else {
        attributeManager.remove(['instancePositions64Low']);
      }
    }
  }

  updateState({props, oldProps, changeFlags}) {
    super.updateState({props, oldProps, changeFlags});
    // Re-generate model if geometry changed
    if (props.fp64 !== oldProps.fp64) {
      const {gl} = this.context;
      if (this.state.model) {
        this.state.model.delete();
      }
      this.setState({
        model: this._getModel(gl)
      });
    }

    this.state.model.setUniforms({
			currentTime: props.currentTime
		});

    this.updateAttribute({props, oldProps, changeFlags});
  }

  _getModel(gl) {
    let positions = [];
    const NUM_SEGMENTS = 50;
    /*
     *  (0, -1)-------------_(1, -1)
     *       |          _,-"  |
     *       o      _,-"      o
     *       |  _,-"          |
     *   (0, 1)"-------------(1, 1)
     */
    for (let i = 0; i < NUM_SEGMENTS; i++) {
      positions = positions.concat([i, -1, 0, i, 1, 0]);
    }

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
              -1,  1, -1]),

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

    const projection = new Matrix4().perspective({aspect: 2});
    const view = new Matrix4();
    const scaleFactor = 0.05;
    const scaler = new Matrix4().scale([scaleFactor, scaleFactor, scaleFactor]);

    model.setUniforms({
      numSegments: NUM_SEGMENTS,
      uPMatrix: projection,
      uMVMatrix: view,
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

  calculateInstancePositions64Low(attribute) {
    const {data, getSourcePosition, getTargetPosition} = this.props;
    const {value, size} = attribute;

    let i = 0;
    for (let j = 0; j < data.length; j++) {
			const object = data[j];

      const sourcePosition = getSourcePosition(object);
      const targetPosition = getTargetPosition(object);

      value[i + 0] = fp64LowPart(sourcePosition[0]);
      value[i + 1] = fp64LowPart(sourcePosition[1]);
      value[i + 2] = fp64LowPart(targetPosition[0]);
      value[i + 3] = fp64LowPart(targetPosition[1]);

      i += size;
    }
  }

  /*
  calculateInstanceSourceColors(attribute) {
    const {data, getSourceColor} = this.props;
    const {value, size} = attribute;
    let i = 0;
    for (const object of data) {
      const color = getSourceColor(object);
      value[i + 0] = color[0];
      value[i + 1] = color[1];
      value[i + 2] = color[2];
      value[i + 3] = isNaN(color[3]) ? 255 : color[3];
      i += size;
    }
  }

  calculateInstanceTargetColors(attribute) {
    const {data, getTargetColor} = this.props;
    const {value, size} = attribute;
    let i = 0;
    for (const object of data) {
      const color = getTargetColor(object);
      value[i + 0] = color[0];
      value[i + 1] = color[1];
      value[i + 2] = color[2];
      value[i + 3] = isNaN(color[3]) ? 255 : color[3];
      i += size;
    }
  }
  */
}

ModifiedArcLayer.layerName = 'ModifiedArcLayer';
ModifiedArcLayer.defaultProps = defaultProps;

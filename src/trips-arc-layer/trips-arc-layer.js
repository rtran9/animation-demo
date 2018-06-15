import DeckGL, {ArcLayer} from 'deck.gl';
import {GL, AnimationLoop, loadTextures, Cube, setParameters} from 'luma.gl';

import vertexShader from './trips-arc-layer-vertex.glsl';
import fragmentShader from './trips-arc-layer-fragment.glsl';

const VERTEX_SHADER = `\
attribute vec3 positions;
attribute vec2 texCoords;
uniform mat4 uMVMatrix;
uniform mat4 uPMatrix;
varying vec2 vTextureCoord;

void main(void) {
  gl_Position = uPMatrix * uMVMatrix * vec4(positions, 1.0);
  vTextureCoord = texCoords;
}
`;

const FRAGMENT_SHADER = `\
#ifdef GL_ES
precision highp float;
#endif

varying vec4 vColor;
varying float vAlpha;
uniform sampler2D uSampler;
varying vec2 vTextureCoord;

void main(void) {
  gl_FragColor = texture2D(uSampler, vec2(vTextureCoord.s, vTextureCoord.t));
}
`;

export default class TripsArcLayer extends ArcLayer {
	initializeState() {
    super.initializeState(...arguments);
		const {gl} = this.context;

    this.state.attributeManager.addInstanced({
      instanceTimes: {size: 1, accessor: 'getTime'}
    });
  }

	updateState({props}) {
		const {gl} = this.context;

    super.updateState(...arguments);

		loadTextures(gl, {
			urls: ['nehe.gif']
		}).then(textures => {
			this.state.model.setUniforms({
				currentTime: props.currentTime,
				uSampler: textures[0]
			})
		})
    // this.state.model.setUniforms({
    //   currentTime: props.currentTime,
		// 	uSampler: loadTextures(gl, {
		//
		// 	}).then(textures => {
		// 		return textures[0]
		// 	})
    // });
  }

	getShaders() {
		return {
      ...super.getShaders(),
			vs: vertexShader,
      fs: FRAGMENT_SHADER
    };
  }
}

TripsArcLayer.layerName = 'TripsArcLayer';

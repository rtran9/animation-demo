import DeckGL, {ArcLayer} from 'deck.gl';
import {GL, AnimationLoop, loadTextures, Cube, setParameters} from 'luma.gl';
import {Matrix4} from 'math.gl';

import vertexShader from './trips-arc-layer-vertex.glsl';
import fragmentShader from './trips-arc-layer-fragment.glsl';

// https://github.com/uber/luma.gl/blob/5.3-release/examples/lessons/05/app.js
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

uniform sampler2D uSampler;
varying vec2 vTextureCoord;

void main(void) {
  gl_FragColor = texture2D(uSampler, vec2(vTextureCoord.x, vTextureCoord.y));
}
`;

export default class TripsArcLayer extends ArcLayer {
	initializeState() {
    super.initializeState(...arguments);
		const {gl} = this.context;
  }

	updateState({props}) {
		const {gl} = this.context;

    super.updateState(...arguments);

    // load the texture
    // idea is to import any image, e.g. bike, airplane
		loadTextures(gl, {
			urls: ['nehe.gif']
		}).then(textures => {
			this.state.model.setUniforms({
				currentTime: props.currentTime,
				uSampler: textures[0]
			})
		})
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

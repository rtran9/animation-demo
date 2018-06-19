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
  gl_FragColor = texture2D(uSampler, vTextureCoord);
}
`;

export default class TripsArcLayer extends ArcLayer {
	initializeState() {
    super.initializeState(...arguments);

    this.setState({
      model: this.getModel(gl)
    });
  }

	updateState({props}) {
		const {gl} = this.context;

    super.updateState(...arguments);

    // load the texture
    // idea is to import any image, e.g. bike, airplane
		// loadTextures(gl, {
		// 	urls: ['bike-3-256.gif']
		// }).then(textures => {
		// 	this.state.model.setUniforms({
		// 		currentTime: props.currentTime,
		// 		uSampler: textures[0]
		// 	})
		// })
  }

	getShaders() {
		return {
      ...super.getShaders(),
			vs: vertexShader,
      fs: fragmentShader
    };
  }

  getModel(gl) {
   const shaders = assembleShaders(gl, this.getShaders());

   return new Model({
     gl,
     id: this.props.id,
     vs: shaders.vs,
     fs: shaders.fs,
     geometry: new CubeGeometry(),
     isInstanced: true
   });
 }
}

TripsArcLayer.layerName = 'TripsArcLayer';

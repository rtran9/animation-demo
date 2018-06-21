export default `\
#ifdef GL_ES
precision highp float;
#endif

varying vec2 vTextureCoord;
varying vec4 vColor;
uniform sampler2D uSampler;

void main(void) {
  // gl_FragColor = vColor;
  gl_FragColor = texture2D(uSampler, vec2(vTextureCoord.s, vTextureCoord.t));
}
`;

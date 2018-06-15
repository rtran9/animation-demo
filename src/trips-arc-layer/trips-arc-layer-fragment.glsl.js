export default `\
#define SHADER_NAME arc-layer-fragment-shader

#ifdef GL_ES
precision highp float;
#endif

varying vec4 vColor;
varying float vAlpha;

void main(void) {
  gl_FragColor = vec4(vColor.rgb, vAlpha);

  // use highlight color if this fragment belongs to the selected object.
  gl_FragColor = picking_filterHighlightColor(gl_FragColor);

  // use picking color if rendering to picking FBO.
  gl_FragColor = picking_filterPickingColor(gl_FragColor);
}
`;

export default `\
attribute vec4 colors;
attribute vec3 positions;
attribute vec4 instanceSourceColors;
attribute vec4 instanceTargetColors;
attribute vec4 instancePositions;
attribute vec3 instancePickingColors;
attribute float instanceWidths;

uniform mat4 uMVMatrix;
uniform mat4 uPMatrix;
uniform mat4 uSMatrix;

uniform float numSegments;
uniform float opacity;

varying vec4 vColor;

float paraboloid(vec2 source, vec2 target, float ratio) {

  vec2 x = mix(source, target, ratio);
  vec2 center = mix(source, target, 0.5);

  float dSourceCenter = distance(source, center);
  float dXCenter = distance(x, center);
  return (dSourceCenter + dXCenter) * (dSourceCenter - dXCenter);
}

float getSegmentRatio(float index) {
  return smoothstep(0.0, 1.0, index / (numSegments - 1.0));
}

vec3 getPos(vec2 source, vec2 target, float segmentRatio) {
  float vertex_height = paraboloid(source, target, segmentRatio);

  return vec3(
    mix(source, target, segmentRatio),
    sqrt(max(0.0, vertex_height))
  );
}

void main(void) {
	vec2 source = project_position(instancePositions.xy);
  vec2 target = project_position(instancePositions.zw);

	vec3 currPos = getPos(source, target, 0.5);
  vec4 curr = project_to_clipspace(vec4(currPos, 1.0));

	mat4 m1 = mat4(
		vec4(1.0, 0, 0, 0),
		vec4(0, 1.0, 0, 0),
		vec4(0, 0, 1.0, 0),
		curr
	);

	gl_Position = m1 * uSMatrix * vec4(positions, 1.0);
  vColor = colors;
}
`;

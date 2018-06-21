export default `\
#define SHADER_NAME trips-arc-layer-vertex-shader

attribute vec4 colors;
attribute vec3 positions;
attribute vec2 texCoords;
attribute vec4 instanceSourceColors;
attribute vec4 instanceTargetColors;
attribute vec4 instancePositions;
attribute vec3 instancePickingColors;
attribute float instanceWidths;

uniform mat4 uSMatrix;
uniform float currentTime;

varying vec4 vColor;
varying vec2 vTextureCoord;

float paraboloid(vec2 source, vec2 target, float ratio) {

  vec2 x = mix(source, target, ratio);
  vec2 center = mix(source, target, 0.5);

  float dSourceCenter = distance(source, center);
  float dXCenter = distance(x, center);
  return (dSourceCenter + dXCenter) * (dSourceCenter - dXCenter);
}

float getSegmentRatio(float index) {
  return smoothstep(0.1, 0.9, index / 4.0);
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

  float segmentRatioIndex = floor(positions.x);
  float segmentRatio = getSegmentRatio(segmentRatioIndex);

	vec3 currPos = getPos(source, target, segmentRatio + 0.01);
	vec3 nextPos = getPos(source, target, segmentRatio - 0.01);
  vec4 curr = project_to_clipspace(vec4(currPos, 1.0));
	vec4 next = project_to_clipspace(vec4(nextPos, 1.0));

	mat4 translationMatrix = mat4(
		vec4(1.0, 0, 0, 0),
		vec4(0, 1.0, 0, 0),
		vec4(0, 0, 1.0, 0),
		curr
	);

  vec3 lookat = next.xyz;
  vec3 pos = curr.xyz;
  vec3 upVector = vec3(0.0, 1.0, 0.0);

  vec3 orientZ = normalize(next.xyz - curr.xyz);
  vec3 orientX = normalize(cross(upVector, orientZ));
  vec3 orientY = cross(orientZ, orientX);

  mat4 orientationMatrix = mat4(
    vec4(orientX, 1.0),
    vec4(orientY, 1.0),
    vec4(orientZ, 1.0),
    vec4(0, 0, 0, 1.0)
  );

	gl_Position = translationMatrix * orientationMatrix * uSMatrix * vec4(positions, 1.0);
  vColor = colors;
  vTextureCoord = texCoords;
}
`;

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
uniform float currentTime;

varying vec4 vColor;

float paraboloid(vec2 source, vec2 target, float ratio) {

  vec2 x = mix(source, target, ratio);
  vec2 center = mix(source, target, 0.5);

  float dSourceCenter = distance(source, center);
  float dXCenter = distance(x, center);
  return (dSourceCenter + dXCenter) * (dSourceCenter - dXCenter);
}

float getSegmentRatio(float index) {
  return smoothstep(0.0, 1.0, index / (50.0 - 1.0));
}

vec3 getPos(vec2 source, vec2 target, float segmentRatio) {
  float vertex_height = paraboloid(source, target, segmentRatio);

  return vec3(
    mix(source, target, segmentRatio),
    sqrt(max(0.0, vertex_height))
  );
}

mat4 rotationMatrix(vec3 axis, float angle) {
    axis = normalize(axis);
    float s = sin(angle);
    float c = cos(angle);
    float oc = 1.0 - c;

    return mat4(oc * axis.x * axis.x + c,           oc * axis.x * axis.y - axis.z * s,  oc * axis.z * axis.x + axis.y * s,  0.0,
                oc * axis.x * axis.y + axis.z * s,  oc * axis.y * axis.y + c,           oc * axis.y * axis.z - axis.x * s,  0.0,
                oc * axis.z * axis.x - axis.y * s,  oc * axis.y * axis.z + axis.x * s,  oc * axis.z * axis.z + c,           0.0,
                0.0,                                0.0,                                0.0,                                1.0);
}

void main(void) {
	vec2 source = project_position(instancePositions.xy);
  vec2 target = project_position(instancePositions.zw);

	// float segmentRatio = getSegmentRatio(25.0);
	// float indexDir = mix(-1.0, 1.0, step(25.0, 0.0));
	// float nextSegmentRatio = getSegmentRatio(25.0 + indexDir);

	float vAlpha = currentTime / 10.0;

	vec3 currPos = getPos(source, target, vAlpha + 0.001);
	vec3 nextPos = getPos(source, target, vAlpha - 0.001);
  vec4 curr = project_to_clipspace(vec4(currPos, 1.0));
	vec4 next = project_to_clipspace(vec4(nextPos, 1.0));

	vec3 line_clipspace = normalize((next.xyz - curr.xyz));
	// normalized direction of the line

	vec2 dir_screenspace = normalize((next.xy - curr.xy) * 1.0 * project_uViewportSize);

	// mat4 rotate = mat4(
	// 	vec4(dir_screenspace.x, 0, 0, 0),
	// 	vec4(0, dir_screenspace.y, 0, 0),
	// 	vec4(0, 0, 1.0, 0),
	// 	vec4(0, 0, 0, 1.0)
	// );

	mat4 m1 = mat4(
		vec4(1.0, 0, 0, 0),
		vec4(0, 1.0, 0, 0),
		vec4(0, 0, 1.0, 0),
		curr
	);

  vec3 xAxis = vec3(1.0, 0, 0);
  vec3 yAxis = vec3(0, 1.0, 0);
  vec3 zAxis = vec3(0, 0, 1.0);

	float x = line_clipspace.x;
	float y = line_clipspace.y;
	float z = line_clipspace.z;

  float dX = -atan(sqrt(pow(y, 2.0) + pow(z, 2.0)), x);
  float dY = -atan(sqrt(pow(z, 2.0) + pow(x, 2.0)), y);
  float dZ = -atan(sqrt(pow(x, 2.0) + pow(y, 2.0)), z);

	mat4 rotateX = rotationMatrix(xAxis, dX);
	mat4 rotateY = rotationMatrix(yAxis, dY);
	mat4 rotateZ = rotationMatrix(zAxis, dZ);
	mat4 rotate = rotateZ * rotateY * rotateX;

	vColor = colors;
	gl_Position = m1 * rotate * uSMatrix * vec4(positions, 1.0);

}
`;

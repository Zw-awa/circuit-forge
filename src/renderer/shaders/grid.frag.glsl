#version 300 es
precision highp float;
in vec2 v_clipPos;
out vec4 fragColor;
uniform mat4 u_invProjection;
uniform float u_zoom;
uniform float u_gridOpacity;
uniform vec3 u_bgColor;
uniform vec3 u_minorColor;
uniform vec3 u_majorColor;
uniform vec3 u_axisColor;
void main() {
  vec4 worldPos = u_invProjection * vec4(v_clipPos, 0.0, 1.0);
  vec2 world = worldPos.xy;
  vec2 grid = abs(fract(world - 0.5) - 0.5);
  vec2 pixelDist = grid * u_zoom;
  float minorLine = min(pixelDist.x, pixelDist.y);
  float minorAlpha = 1.0 - smoothstep(0.0, 1.5, minorLine);
  vec2 grid5 = abs(fract(world / 5.0 - 0.5) - 0.5) * 5.0;
  vec2 pixelDist5 = grid5 * u_zoom;
  float majorLine = min(pixelDist5.x, pixelDist5.y);
  float majorAlpha = 1.0 - smoothstep(0.0, 1.5, majorLine);
  float minorFade = smoothstep(15.0, 25.0, u_zoom);
  minorAlpha *= minorFade;
  float axisLine = min(abs(world.x) * u_zoom, abs(world.y) * u_zoom);
  float axisAlpha = 1.0 - smoothstep(0.0, 2.0, axisLine);
  vec3 color = u_bgColor;
  color = mix(color, u_minorColor, minorAlpha * 0.5 * u_gridOpacity);
  color = mix(color, u_majorColor, majorAlpha * 0.7 * u_gridOpacity);
  color = mix(color, u_axisColor, axisAlpha * 0.8 * u_gridOpacity);
  fragColor = vec4(color, 1.0);
}

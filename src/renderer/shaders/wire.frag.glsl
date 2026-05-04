#version 300 es
precision highp float;
in vec3 v_color;
in float v_along;
in float v_across;
in float v_wireLen;
out vec4 fragColor;
uniform float u_dashLength;
uniform float u_gapLength;
uniform float u_glowIntensity;
void main() {
  float dashAlpha = 1.0;
  if (u_dashLength > 0.0 && u_gapLength > 0.0 && v_wireLen > 0.0) {
    float cycle = u_dashLength + u_gapLength;
    float phase = mod(v_along * v_wireLen, cycle);
    if (phase > u_dashLength) {
      discard;
    }
  }
  float glow = u_glowIntensity * (1.0 - abs(v_across) * 2.0);
  glow = clamp(glow, 0.0, 1.0) * 0.3;
  fragColor = vec4(v_color * (1.0 + glow), 1.0);
}

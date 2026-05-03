#version 300 es
precision highp float;
in vec2 v_texcoord;
in vec4 v_tint;
out vec4 fragColor;
uniform sampler2D u_atlas;
void main() {
  vec4 texColor = texture(u_atlas, v_texcoord);
  fragColor = texColor * v_tint;
  if (fragColor.a < 0.01) discard;
}

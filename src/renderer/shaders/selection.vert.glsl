#version 300 es
in vec2 a_position;
in vec2 a_offset;
in vec2 a_size;
in vec4 a_color;
uniform mat4 u_projection;
out vec4 v_color;
void main() {
  vec2 worldPos = a_position * a_size + a_offset;
  gl_Position = u_projection * vec4(worldPos, 0.0, 1.0);
  v_color = a_color;
}

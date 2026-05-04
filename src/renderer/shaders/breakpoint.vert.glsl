#version 300 es
in vec2 a_vertex;
in vec2 a_position;
in float a_size;
uniform mat4 u_projection;

void main() {
  vec2 worldPos = a_vertex * a_size + a_position;
  gl_Position = u_projection * vec4(worldPos, 0.0, 1.0);
}

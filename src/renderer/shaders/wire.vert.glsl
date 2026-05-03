#version 300 es
in vec2 a_position;
in vec2 a_start;
in vec2 a_end;
in float a_thickness;
in vec3 a_color;
uniform mat4 u_projection;
uniform vec2 u_resolution;
out vec3 v_color;
void main() {
  vec2 dir = a_end - a_start;
  if (length(dir) < 0.001) {
    gl_Position = u_projection * vec4(a_start, 0.0, 1.0);
    v_color = a_color;
    return;
  }
  vec2 along = normalize(dir);
  vec2 normal = vec2(-along.y, along.x);
  vec2 basePos = mix(a_start, a_end, a_position.x);
  vec4 p0 = u_projection * vec4(a_start, 0.0, 1.0);
  vec4 p1 = u_projection * vec4(a_start + normal, 0.0, 1.0);
  vec2 sn = (p1.xy / p1.w - p0.xy / p0.w) * u_resolution * 0.5;
  float worldThickness = a_thickness / max(length(sn), 0.001);
  vec2 worldPos = basePos + normal * (a_position.y - 0.5) * worldThickness;
  gl_Position = u_projection * vec4(worldPos, 0.0, 1.0);
  v_color = a_color;
}

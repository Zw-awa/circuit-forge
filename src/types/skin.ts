export interface WireStyle {
  thickness: number;
  high_color: [number, number, number];
  low_color: [number, number, number];
  dash_length?: number;
  gap_length?: number;
  glow_intensity?: number;
}

export interface GridStyle {
  bg_color: [number, number, number, number];
  minor_color: [number, number, number, number];
  major_color: [number, number, number, number];
  axis_color: [number, number, number, number];
  pattern: 'Line' | 'Dot' | 'Cross';
  opacity: number;
  bg_texture?: string;
}

export interface SkinManifest {
  id: string;
  name: string;
  author: string;
  version: string;
  description: string;
  component_textures: Record<string, string>;
  wire_style: WireStyle;
  grid_style: GridStyle;
}

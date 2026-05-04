export interface PluginInfo {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  enabled: boolean;
}

export interface PinDef {
  name: string;
  is_output: boolean;
  offset_x: number;
  offset_y: number;
}

export interface ComponentRegistration {
  kind_name: string;
  icon_label: string;
  input_pins: PinDef[];
  output_pins: PinDef[];
}

export interface MenuItem {
  id: number;
  label: string;
}

export interface ExportFormat {
  format_id: string;
  display_name: string;
  extension: string;
}

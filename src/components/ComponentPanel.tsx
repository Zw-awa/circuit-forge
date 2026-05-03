import { useTranslation } from 'react-i18next';
import { useEditorStore } from '../stores/editorStore';
import type { ComponentKind } from '../types/circuit';

const COMPONENT_KINDS: Array<{ key: string; kind: ComponentKind }> = [
  { key: 'and', kind: 'And' },
  { key: 'or', kind: 'Or' },
  { key: 'not', kind: 'Not' },
  { key: 'nand', kind: 'Nand' },
  { key: 'xor', kind: 'Xor' },
  { key: 'switch', kind: 'Switch' },
  { key: 'led', kind: 'Led' },
  { key: 'button', kind: 'Button' },
  { key: 'clock', kind: 'Clock' },
  { key: 'random', kind: 'Random' },
  { key: 'constant', kind: 'Constant' },
  { key: 'sevenSegment', kind: 'SevenSegment' },
  { key: 'oscilloscope', kind: 'Oscilloscope' },
  { key: 'delayLine', kind: 'DelayLine' },
  { key: 'splitter', kind: 'Splitter' },
  { key: 'merger', kind: 'Merger' },
];

function ComponentPanel() {
  const { t } = useTranslation();
  const activeTool = useEditorStore((s) => s.activeTool);
  const placingComponentKind = useEditorStore((s) => s.placingComponentKind);
  const setActiveTool = useEditorStore((s) => s.setActiveTool);
  const setPlacingComponentKind = useEditorStore((s) => s.setPlacingComponentKind);

  const handleClick = (kind: ComponentKind) => {
    setActiveTool('place');
    setPlacingComponentKind(kind);
  };

  return (
    <div className="component-panel">
      <div className="panel-header">{t('panel.components')}</div>
      <div className="component-list">
        {COMPONENT_KINDS.map(({ key, kind }) => (
          <div
            key={key}
            className={
              'component-item' +
              (activeTool === 'place' && placingComponentKind === kind ? ' active' : '')
            }
            onClick={() => handleClick(kind)}
          >
            {t(`components.${key}`)}
          </div>
        ))}
      </div>
    </div>
  );
}

export default ComponentPanel;

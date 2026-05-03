import { useTranslation } from 'react-i18next';
import { useEditorStore } from '../stores/editorStore';

function Breadcrumb() {
  const { t } = useTranslation();
  const subCircuitStack = useEditorStore((s) => s.subCircuitStack);
  const exitToLevel = useEditorStore((s) => s.exitToLevel);

  if (subCircuitStack.length === 0) return null;

  return (
    <div className="breadcrumb-bar">
      <span
        className="breadcrumb-item"
        onClick={() => exitToLevel(0)}
      >
        {t('subcircuit.breadcrumbTop')}
      </span>
      {subCircuitStack.map((frame, i) => (
        <span key={frame.defId} className="breadcrumb-segment">
          <span className="breadcrumb-separator">›</span>
          <span
            className="breadcrumb-item"
            onClick={() => exitToLevel(i + 1)}
          >
            {frame.defName}
          </span>
        </span>
      ))}
    </div>
  );
}

export default Breadcrumb;

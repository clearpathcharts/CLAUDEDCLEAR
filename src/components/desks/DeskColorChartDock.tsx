import React from 'react';
import { clampOpacity } from '../../lib/deskColorChart';
import { TRADER_DESKS, type TraderDeskId } from '../../lib/traderDesks';
import ColorChartPicker from './ColorChartPicker';
import { useDeskAppearance } from './DeskAppearanceContext';

export default function DeskColorChartDock({ deskId }: { deskId: TraderDeskId }) {
  const {
    pickerOpen,
    setPickerOpen,
    target,
    setTarget,
    overrides,
    recents,
    applyColor,
    setOpacity,
    resetVisual,
    saveDesk,
    saveAllDesks,
    discardDraft,
    isDirty,
    savedAt,
    lastSaveScope,
  } = useDeskAppearance();
  const meta = TRADER_DESKS[deskId];

  return (
    <div data-color-chart-dock className="color-chart-dock" id="desk-color-chart">
      {pickerOpen ? (
        <ColorChartPicker
          target={target}
          onTargetChange={setTarget}
          selected={overrides[target]}
          recents={recents}
          opacity={clampOpacity(overrides.opacity ?? 100)}
          onPick={applyColor}
          onOpacity={setOpacity}
          onReset={resetVisual}
          onSave={saveDesk}
          onSaveAll={saveAllDesks}
          onDiscard={discardDraft}
          isDirty={isDirty}
          savedAt={savedAt}
          lastSaveScope={lastSaveScope}
          overrides={overrides}
          deskLabel={meta.title}
          showPastels={deskId === 'neurodivergent'}
          noPlotOnDesk={deskId === 'fundamental'}
        />
      ) : (
        <button
          type="button"
          data-color-chart-teaser
          className="color-chart-teaser"
          onClick={() => setPickerOpen(true)}
        >
          <span className="color-chart-teaser-rainbow" aria-hidden="true" />
          Colors · full rainbow · tap to open
        </button>
      )}
    </div>
  );
}

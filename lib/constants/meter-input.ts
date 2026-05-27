export type MeterInputView = 'cards' | 'spreadsheet'

export const METER_INPUT_VIEW_KEY = 'meter-input-view'

export const METER_INPUT_VIEW_EVENT = 'meter-input-view-change'

export function readMeterInputView(): MeterInputView {
  if (typeof window === 'undefined') return 'spreadsheet'
  const saved = localStorage.getItem(METER_INPUT_VIEW_KEY)
  return saved === 'cards' || saved === 'spreadsheet' ? saved : 'spreadsheet'
}

export function writeMeterInputView(view: MeterInputView) {
  localStorage.setItem(METER_INPUT_VIEW_KEY, view)
  document.documentElement.dataset.meterInputView = view
  window.dispatchEvent(new CustomEvent(METER_INPUT_VIEW_EVENT, { detail: view }))
}

export function syncMeterInputViewDataset(view: MeterInputView) {
  document.documentElement.dataset.meterInputView = view
}

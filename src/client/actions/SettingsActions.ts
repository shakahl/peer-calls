import { SETTINGS_SHOW_MINIMIZED_TOOLBAR_TOGGLE, SETTINGS_USE_FLEX_LAYOUT_TOGGLE } from '../constants'

export interface ShowMinimizedToolbarToggleAction {
  type: 'SETTINGS_SHOW_MINIMIZED_TOOLBAR_TOGGLE'
}

export interface UseFlexLayoutToggleAction {
  type: 'SETTINGS_USE_FLEX_LAYOUT_TOGGLE'
}

export function showMinimizedToolbarToggle(
): ShowMinimizedToolbarToggleAction {
  return {
    type: SETTINGS_SHOW_MINIMIZED_TOOLBAR_TOGGLE,
  }
}

export function useFlexLayoutToggle(
): UseFlexLayoutToggleAction {
  return {
    type: SETTINGS_USE_FLEX_LAYOUT_TOGGLE,
  }
}

export type SettingsAction =
  ShowMinimizedToolbarToggleAction |
  UseFlexLayoutToggleAction

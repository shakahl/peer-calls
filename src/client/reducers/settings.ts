import { SettingsAction } from '../actions/SettingsActions'
import { SETTINGS_SHOW_MINIMIZED_TOOLBAR_TOGGLE, SETTINGS_USE_FLEX_LAYOUT_TOGGLE } from '../constants'
import { localStorage } from '../window'

export interface SettingsState {
  showMinimizedToolbar: boolean
  useFlexLayout: boolean
}

const settingsKey = 'settings'

function init(): SettingsState {
  return {
    showMinimizedToolbar: true,
    useFlexLayout: false,
  }
}

function withDefault(
  state: Partial<SettingsState> | null, init: SettingsState,
): SettingsState {

  if (!state) {
    return init
  }

  return {
    showMinimizedToolbar:
      typeof state.showMinimizedToolbar === 'boolean'
        ? state.showMinimizedToolbar
        : init.showMinimizedToolbar,
    useFlexLayout:
      typeof state.useFlexLayout === 'boolean'
        ? state.useFlexLayout
        : init.useFlexLayout,
  }
}

function load(): SettingsState {
  const def = init()

  let loaded: Partial<SettingsState> | null = null

  try {
    loaded = JSON.parse(localStorage.getItem(settingsKey)!)
  } catch {
    // Do nothing
  }

  if (!loaded) {
    return def
  }

  return withDefault(loaded, def)
}

function save(state: SettingsState): SettingsState {
  try {
    localStorage.setItem(settingsKey, JSON.stringify(state))
  } catch {
    // Do nothing.
  }

  return state
}

export default function settings(
  state: SettingsState = load(),
    action: SettingsAction,
): SettingsState {
  switch (action.type) {
  case SETTINGS_SHOW_MINIMIZED_TOOLBAR_TOGGLE:
    return save({
      ...state,
      showMinimizedToolbar: !state.showMinimizedToolbar,
    })
  case SETTINGS_USE_FLEX_LAYOUT_TOGGLE:
    return save({
      ...state,
      useFlexLayout: !state.useFlexLayout,
    })
  default:
    return state
  }
}

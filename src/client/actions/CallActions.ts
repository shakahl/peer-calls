import socket from '../socket'
import { ThunkResult } from '../store'
import { callId } from '../window'
import * as NotifyActions from './NotifyActions'
import * as SocketActions from './SocketActions'

export interface InitAction {
  type: 'INIT'
  payload: Promise<void>
}

interface InitializeAction {
  type: 'INIT'
}

const initialize = (): InitializeAction => ({
  type: 'INIT',
})

export const init = (): ThunkResult<Promise<void>> =>
async (dispatch, getState) => {
  socket.on('connect', () => {
    dispatch(NotifyActions.warning('Connected to server socket'))
    dispatch(SocketActions.handshake({
      socket,
      roomName: callId,
    }))
    dispatch(initialize())
  })
  socket.on('disconnect', () => {
    dispatch(NotifyActions.error('Server socket disconnected'))
  })
}

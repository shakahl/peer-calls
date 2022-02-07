import React from 'react'
import { connect } from 'react-redux'
import { MaximizeParams, MinimizeTogglePayload } from '../actions/StreamActions'
import { Dim, Frame } from '../frame'
import { getStreamsByState, StreamProps } from '../selectors'
import { State } from '../store'
import Video from './Video'

export interface VideosProps {
  maximized: StreamProps[]
  minimized: StreamProps[]
  play: () => void
  onMaximize: (payload: MaximizeParams) => void
  onMinimizeToggle: (payload: MinimizeTogglePayload) => void
  showMinimizedToolbar: boolean
  aspectRatio: number
  debug: boolean
}

export interface VideosState {
  videoSize: Dim
  multiplier: string
}

export class Videos extends React.PureComponent<VideosProps, VideosState> {
  private gridRef = React.createRef<HTMLDivElement>()
  private frame: Frame
  private videoStyle?: React.CSSProperties
  private resizeObserver: ResizeObserver

  constructor(props: VideosProps) {
    super(props)

    this.state = {
      videoSize: {x: 0, y: 0},
      multiplier: '1',
    }

    this.frame = new Frame(this.props.aspectRatio || 16/9)

    this.resizeObserver = new ResizeObserver(this.handleResize)
  }
  componentDidMount = () => {
    this.handleResize()

    // FIXME if we change style the current might change.
    // Maybe not because it uses the same key.
    this.resizeObserver.observe(this.gridRef.current!)
  }
  componentWillUnmount = () => {
    this.resizeObserver.disconnect()
  }
  handleResize = () => {
    const size = this.getSize()
    if (!size) {
      return
    }

    this.frame.setSize(size)

    this.setState({
      videoSize: size,
    })
  }
  getSize = () => {
    if (!this.gridRef.current) {
      return
    }

    const { width: x, height: y } =
      this.gridRef.current.getBoundingClientRect()

    const size = {x, y}

    return size
  }
  componentDidUpdate() {
    if (this.props.aspectRatio) {
      return
    }

    const videos = this.gridRef.current!
    .querySelectorAll('.video-container') as unknown as HTMLElement[]
    const size = videos.length
    const x = (1 / Math.ceil(Math.sqrt(size))) * 100

    videos.forEach(v => {
      v.style.flexBasis = x + '%'
    })
  }
  maybeUpdateSizeStyle() {
    const {aspectRatio, maximized} = this.props
    const multiplier = parseInt(this.state.multiplier) || 1

    if (!this.props.aspectRatio) {
      this.videoStyle = undefined
      return
    }

    this.frame.setAspectRatio(aspectRatio)
    this.frame.setNumWindows(maximized.length * multiplier)

    if (this.frame.needsCalc() || !this.videoStyle) {
      const size = this.frame.calcSize()

      this.videoStyle = {
        width: size.x,
        height: size.y,
      }
    }
  }
  render() {
    const { minimized, maximized, showMinimizedToolbar } = this.props

    let windows = maximized

    // debug {{{
    const multiplier = parseInt(this.state.multiplier) || 1

    let input: JSX.Element | undefined

    if (this.props.debug) {
      windows = []

      for (let i = 0; i < multiplier ; i++) {
        maximized.forEach(props =>
          windows.push({...props, key: props.key + '_' + i}))
      }

      input = <input
        key='input'
        value={this.state.multiplier}
        onChange={e => this.setState({ multiplier: e.target.value})}
        type='number'
        style={{
          position: 'absolute', top: 0, left: 0, opacity: 0.5, zIndex: 100000}}
      />
    }
    // }}}

    this.maybeUpdateSizeStyle()

    const videosToolbar = showMinimizedToolbar && minimized.length > 0
    ? (
      <div className="videos videos-toolbar" key="videos-toolbar">
        {minimized.map(props => (
          <Video
            {...props}
            key={props.key}
            onMaximize={this.props.onMaximize}
            onMinimizeToggle={this.props.onMinimizeToggle}
            play={this.props.play}
          />
        ))}
      </div>
    ) : undefined

    const isAspectRatio = this.props.aspectRatio > 0

    // windows = []

    const maximizedVideos = windows.map(props => (
      <Video
        {...props}
        key={props.key}
        onMaximize={this.props.onMaximize}
        onMinimizeToggle={this.props.onMinimizeToggle}
        play={this.props.play}
        style={this.videoStyle}
      />
    ))

    const videosGrid = isAspectRatio
    ? (
      <div
        className='videos-grid-aspect-ratio'
        key='videos-grid'
        ref={this.gridRef}
      >
        <div className='videos-grid-aspect-ratio-container'>
          {maximizedVideos}
        </div>
      </div>
    )
    : (
      <div
        className='videos-grid-flex'
        key='videos-grid'
        ref={this.gridRef}
      >
        {maximizedVideos}
      </div>
    )

    return [input, videosToolbar, videosGrid]
  }
}

function mapStateToProps(state: State) {
  const { minimized, maximized } = getStreamsByState(state)

  return {
    minimized,
    maximized,
    aspectRatio: 16/9,
    debug: true,
  }
}

export default connect(mapStateToProps)(Videos)

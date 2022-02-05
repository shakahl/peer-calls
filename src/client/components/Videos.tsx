import React from 'react'
import { connect } from 'react-redux'
import classnames from 'classnames'
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

  constructor(props: VideosProps) {
    super(props)

    this.state = {
      videoSize: {x: 0, y: 0},
      multiplier: '1',
    }

    this.frame = new Frame(this.props.aspectRatio || 16/9)
  }
  componentDidMount = () => {
    this.handleResize()
    window.addEventListener('resize', this.handleResize)
  }
  componentWillUnmount = () => {
    window.removeEventListener('resize', this.handleResize)
  }
  handleResize = () => {
    // We use document.body and not this.gridRef.current! because in certain
    // scenarios it might stop scaling.
    const { width: x, height: y } = document.body.getBoundingClientRect()

    const size = {x, y}

    this.frame.setSize(size)

    this.setState({
      videoSize: size,
    })
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
  updateSizeStyle() {
    const {aspectRatio, maximized} = this.props
    const multiplier = parseInt(this.state.multiplier) || 1

    if (!this.props.aspectRatio) {
      this.videoStyle = undefined
      return
    }

    if (this.props.aspectRatio) {
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
  }
  render() {
    const { minimized, maximized, showMinimizedToolbar } = this.props

    const multiplier = parseInt(this.state.multiplier) || 1

    this.updateSizeStyle()

    const videosToolbar = showMinimizedToolbar
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

    let input: JSX.Element | undefined
    let windows = maximized

    // debug
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

    const classNames = classnames('videos videos-grid', {
      'videos-grid-aspect-ratio': this.props.aspectRatio > 0,
    })

    const videosGrid = (
      <div className={classNames} key="videos-grid" ref={this.gridRef}>
        {windows.map(props => (
          <Video
            {...props}
            key={props.key}
            onMaximize={this.props.onMaximize}
            onMinimizeToggle={this.props.onMinimizeToggle}
            play={this.props.play}
            style={this.videoStyle}
          />
        ))}
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

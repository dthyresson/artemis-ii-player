export interface PlayerState {
  missionTime: number
  isPlaying: boolean
  speed: number
}

export class Player {
  private missionStart: number
  private missionEnd: number
  private missionDuration: number

  private _missionTime: number
  private _isPlaying = false
  private _speed = 15000

  private lastRealTime = 0

  private scrubber: HTMLInputElement
  private btnPlay: HTMLElement
  private btnRestart: HTMLElement
  private btnEnd: HTMLElement
  private speedBtns: NodeListOf<HTMLElement>

  private onSeek?: (time: number) => void

  constructor(missionStart: number, missionEnd: number) {
    this.missionStart = missionStart
    this.missionEnd = missionEnd
    this.missionDuration = missionEnd - missionStart
    this._missionTime = missionStart

    this.scrubber = document.getElementById('scrubber') as HTMLInputElement
    this.btnPlay = document.getElementById('btn-play')!
    this.btnRestart = document.getElementById('btn-restart')!
    this.btnEnd = document.getElementById('btn-end')!
    this.speedBtns = document.querySelectorAll('.speed-btn')

    this.bindEvents()
  }

  private bindEvents(): void {
    this.btnPlay.addEventListener('click', () => this.togglePlay())

    this.btnRestart.addEventListener('click', () => {
      this._missionTime = this.missionStart
      this._isPlaying = false
      this.updatePlayBtn()
      this.updateScrubber()
      this.onSeek?.(this._missionTime)
    })

    this.btnEnd.addEventListener('click', () => {
      this._missionTime = this.missionEnd
      this._isPlaying = false
      this.updatePlayBtn()
      this.updateScrubber()
      this.onSeek?.(this._missionTime)
    })

    this.scrubber.addEventListener('input', () => {
      const t = parseFloat(this.scrubber.value) / 1000
      this._missionTime = this.missionStart + t * this.missionDuration
      this.onSeek?.(this._missionTime)
    })

    this.scrubber.addEventListener('mousedown', () => {
      this._isPlaying = false
      this.updatePlayBtn()
    })

    this.speedBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        this._speed = parseInt(btn.dataset.speed ?? '1000', 10)
        this.speedBtns.forEach(b => b.classList.remove('active'))
        btn.classList.add('active')
      })
    })

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.target instanceof HTMLInputElement) return
      if (e.code === 'Space') { e.preventDefault(); this.togglePlay() }
      if (e.code === 'ArrowLeft') this.nudge(-3600 * 1000)
      if (e.code === 'ArrowRight') this.nudge(3600 * 1000)
      if (e.code === 'Home') { this._missionTime = this.missionStart; this.updateScrubber(); this.onSeek?.(this._missionTime) }
      if (e.code === 'End') { this._missionTime = this.missionEnd; this.updateScrubber(); this.onSeek?.(this._missionTime) }
    })
  }

  private nudge(deltaMs: number): void {
    this._missionTime = Math.max(this.missionStart, Math.min(this.missionEnd, this._missionTime + deltaMs))
    this.updateScrubber()
    this.onSeek?.(this._missionTime)
  }

  private togglePlay(): void {
    this._isPlaying = !this._isPlaying
    if (this._isPlaying) this.lastRealTime = performance.now()
    this.updatePlayBtn()
  }

  private static readonly PLAY_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" class="w-4 h-4 pointer-events-none"><path d="M4 2.5l9 5.5-9 5.5z"/></svg>`
  private static readonly PAUSE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" class="w-4 h-4 pointer-events-none"><rect x="3" y="2" width="4" height="12" rx="1"/><rect x="9" y="2" width="4" height="12" rx="1"/></svg>`

  private updatePlayBtn(): void {
    this.btnPlay.innerHTML = this._isPlaying ? Player.PAUSE_SVG : Player.PLAY_SVG
  }

  private updateScrubber(): void {
    const t = (this._missionTime - this.missionStart) / this.missionDuration
    this.scrubber.value = String(t * 1000)
    this.scrubber.style.setProperty('--progress', `${t * 100}%`)
  }

  onSeekCallback(cb: (time: number) => void): void {
    this.onSeek = cb
  }

  tick(realNow: number): number {
    if (!this._isPlaying) {
      this.lastRealTime = realNow
      return this._missionTime
    }

    const realDelta = realNow - this.lastRealTime
    this.lastRealTime = realNow

    this._missionTime += realDelta * this._speed
    if (this._missionTime >= this.missionEnd) {
      this._missionTime = this.missionEnd
      this._isPlaying = false
      this.updatePlayBtn()
    }

    this.updateScrubber()
    return this._missionTime
  }

  get missionTime(): number { return this._missionTime }
  get isPlaying(): boolean { return this._isPlaying }
  get speed(): number { return this._speed }
}

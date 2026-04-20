export class LoadingScreen {
  private el: HTMLElement
  private bar: HTMLElement
  private status: HTMLElement

  constructor() {
    this.el = document.getElementById('loading')!
    this.bar = document.getElementById('loading-bar')!
    this.status = document.getElementById('loading-status')!
  }

  update(message: string, percent: number): void {
    this.status.textContent = message
    this.bar.style.width = `${Math.min(100, percent)}%`
  }

  hide(): void {
    this.el.style.transition = 'opacity 0.8s ease'
    this.el.style.opacity = '0'
    setTimeout(() => {
      this.el.style.display = 'none'
    }, 800)
  }

  showError(message: string): void {
    this.status.textContent = `Error: ${message}`
    this.status.style.color = '#FC3D21'
    this.bar.style.background = '#FC3D21'
  }
}

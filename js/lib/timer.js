//
// Helper class accurate timer for JS
// Taken from https://www.youtube.com/watch?v=x8PBWobv6NY
//

export function Timer(callback, timeInterval) {
  this.timeInterval = timeInterval

  this.start = () => {
    this.expectedTime = Date.now() + this.timeInterval
    this.timeout = setTimeout(this.timeAdjustWrapper, this.timeInterval)
  }

  this.stop = () => {
    clearTimeout(this.timeout)
  }

  this.timeAdjustWrapper = () => {
    let drift = Date.now() - this.expectedTime
    callback()
    this.expectedTime += this.timeInterval
    this.timeout = setTimeout(this.timeAdjustWrapper, this.timeInterval - drift)
  }
}

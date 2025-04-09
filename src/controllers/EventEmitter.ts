class EventEmitter {
  className: string;

  constructor(className: string) {
    this.className = className;
    this.addListener = this.addListener.bind(this);
    this.unsubscribe = this.unsubscribe.bind(this);
    this.emit = this.emit.bind(this);
    this.removeListener = this.removeListener.bind(this);
  }

  addListener(
    eventName: string,
    listener: EventListenerOrEventListenerObject
  ): { remove: () => void } {
    const eventNameString = eventName + this.className;
    document.addEventListener(eventNameString, listener);
    return { remove: () => this.unsubscribe(eventNameString, listener) };
  }

  unsubscribe(
    eventName: string,
    listener: EventListenerOrEventListenerObject
  ): void {
    const eventNameString = eventName + this.className;
    document.removeEventListener(eventNameString, listener);
  }

  emit(eventName: string, data: unknown): void {
    const eventNameString = eventName + this.className;
    const event = new CustomEvent(eventNameString, { detail: data });
    document.dispatchEvent(event);
  }

  removeListener(
    eventName: string,
    listener: EventListenerOrEventListenerObject
  ): void {
    this.unsubscribe(eventName, listener);
  }
}

export const AppEmitter = new EventEmitter('');
export const appListen = (
  ...args: [string, EventListenerOrEventListenerObject]
) => AppEmitter.addListener(...args);
export default EventEmitter;

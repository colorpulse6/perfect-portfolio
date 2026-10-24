/** Register all engine input in one place so a route change can remove it. */
export function createInput() {
  const disposers: Array<() => void> = []
  function listen(target: EventTarget, type: string, fn: EventListenerOrEventListenerObject, options?: AddEventListenerOptions | boolean) {
    target.addEventListener(type, fn, options)
    disposers.push(() => target.removeEventListener(type, fn, options))
  }
  return { listen, dispose() { for (const remove of disposers.splice(0).reverse()) remove() } }
}

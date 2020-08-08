export function debounce (func, wait = 100) {
  let timeout
  const ret = function (...args) {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
  ret.cancel = () => clearTimeout(timeout)
  return ret
}

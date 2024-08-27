import type { OptionType, ParentExtendType } from './types'

export function getUnit(prop: string | string[], opts: OptionType) {
  return !prop.includes('font') ? opts.viewportUnit : opts.fontViewportUnit
}

export function createPxReplace(opts: OptionType, viewportUnit: string | number, viewportSize: number) {
  return function (m: any, $1: string) {
    if (!$1)
      return m
    const pixels = Number.parseFloat($1)
    if (pixels <= opts.minPixelValue!)
      return m
    const parsedVal = toFixed(
      (pixels / viewportSize) * 100,
      opts.unitPrecision!,
    )
    return parsedVal === 0 ? '0' : `${parsedVal}${viewportUnit}`
  }
}

export function toFixed(number: number, precision: number) {
  const multiplier = 10 ** (precision + 1)
  const wholeNumber = Math.floor(number * multiplier)
  return (Math.round(wholeNumber / 10) * 10) / multiplier
}

export function blacklistedSelector(blacklist: string[], selector: string) {
  if (typeof selector !== 'string')
    return
  return blacklist.some((regex) => {
    if (typeof regex === 'string')
      return selector.includes(regex)
    return selector.match(regex)
  })
}

export function isExclude(reg: RegExp, file: string) {
  if (Object.prototype.toString.call(reg) !== '[object RegExp]') {
    throw new Error('options.exclude should be RegExp.')
  }
  return file.match(reg) !== null
}

export function declarationExists(decls: ParentExtendType[], prop: string, value: string) {
  return decls?.some((decl: ParentExtendType) => {
    return decl.prop === prop && decl.value === value
  })
}

export function validateParams(params: string, mediaQuery: boolean) {
  return !params || (params && mediaQuery)
}

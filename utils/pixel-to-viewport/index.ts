import postcss from 'postcss'
import type { AtRule, Root } from 'postcss'

import { getUnitRegexp } from './pixel-unit-regexp'
import { createPropListMatcher } from './prop-list-matcher'
import type { OptionType, ParentExtendType, RuleType } from './types'
import {
  blacklistedSelector,
  createPxReplace,
  declarationExists,
  getUnit,
  isExclude,
  validateParams,
} from './utils'

const defaults: Required<Omit<OptionType, 'exclude' | 'include'>> = {
  unitToConvert: 'px',
  viewportWidth: 320,
  viewportHeight: 568,
  unitPrecision: 10,
  viewportUnit: 'vw',
  fontViewportUnit: 'vw',
  selectorBlackList: [],
  propList: ['*'],
  minPixelValue: 1,
  mediaQuery: false,
  replace: true,
  landscape: false,
  landscapeUnit: 'vw',
  landscapeWidth: 568,
}

const ignoreNextComment = 'px-to-viewport-ignore-next'
const ignorePrevComment = 'px-to-viewport-ignore'

function postcssPxToViewport(options: OptionType) {
  const opts = Object.assign({}, defaults, options)

  const pxRegex = getUnitRegexp(opts.unitToConvert)
  const satisfyPropList = createPropListMatcher(opts.propList)
  const landscapeRules: AtRule[] = []

  return {
    postcssPlugin: 'postcss-px-to-viewport',
    Once(css: Root, { result }: { result: any }) {
      css.walkRules((rule: RuleType) => {
        // Add exclude option to ignore some files like 'node_modules'
        const file = rule.source?.input.file || ''

        if (opts.exclude && file) {
          if (
            Object.prototype.toString.call(opts.exclude) === '[object RegExp]'
          ) {
            if (isExclude(opts.exclude as RegExp, file))
              return
          }
          else if (
            // Object.prototype.toString.call(opts.exclude) === '[object Array]' &&
            Array.isArray(opts.exclude)
          ) {
            for (let i = 0; i < opts.exclude.length; i++) {
              if (isExclude(opts.exclude[i], file))
                return
            }
          }
          else {
            throw new TypeError('options.exclude should be RegExp or Array.')
          }
        }

        if (blacklistedSelector(opts.selectorBlackList, rule.selector))
          return

        if (opts.landscape && !rule.parent?.params) {
          const landscapeRule = rule.clone().removeAll()

          rule.walkDecls((decl) => {
            if (!decl.value.includes(opts.unitToConvert))
              return
            if (!satisfyPropList(decl.prop))
              return

            landscapeRule.append(
              decl.clone({
                value: decl.value.replace(
                  pxRegex,
                  createPxReplace(opts, opts.landscapeUnit, opts.landscapeWidth),
                ),
              }),
            )
          })

          if (landscapeRule.nodes.length > 0) {
            landscapeRules.push(landscapeRule as unknown as AtRule)
          }
        }

        if (!validateParams(rule.parent?.params, opts.mediaQuery))
          return

        rule.walkDecls((decl, i) => {
          if (!decl.value.includes(opts.unitToConvert))
            return
          if (!satisfyPropList(decl.prop))
            return

          const prev = decl.prev()
          // prev declaration is ignore conversion comment at same line
          if (
            prev
            && prev.type === 'comment'
            && prev.text === ignoreNextComment
          ) {
            // remove comment
            prev.remove()
            return
          }
          const next = decl.next()
          // next declaration is ignore conversion comment at same line
          if (
            next
            && next.type === 'comment'
            && next.text === ignorePrevComment
          ) {
            if (/\n/.test(next.raws.before!)) {
              result.warn(
                `Unexpected comment /* ${ignorePrevComment} */ must be after declaration at same line.`,
                { node: next },
              )
            }
            else {
              // remove comment
              next.remove()
              return
            }
          }

          let unit
          let size
          const { params } = rule.parent

          if (opts.landscape && params && params.includes('landscape')) {
            unit = opts.landscapeUnit
            size = opts.landscapeWidth
          }
          else {
            unit = getUnit(decl.prop, opts)
            if (typeof opts.viewportWidth === 'function') {
              // @ts-ignore default number
              size = opts.viewportWidth(file)
            }
            else {
              size = opts.viewportWidth
            }
          }

          const value = decl.value.replace(
            pxRegex,
            createPxReplace(opts, unit!, size),
          )

          if (
            declarationExists(
              decl.parent as unknown as ParentExtendType[],
              decl.prop,
              value,
            )
          ) {
            return
          }

          if (opts.replace) {
            decl.value = value
          }
          else {
            decl.parent?.insertAfter(i, decl.clone({ value }))
          }
        })
      })

      if (landscapeRules.length > 0) {
        const landscapeRoot = new postcss.AtRule({
          params: '(orientation: landscape)',
          name: 'media',
        })

        landscapeRules.forEach((rule) => {
          landscapeRoot.append(rule)
        })
        css.append(landscapeRoot)
      }
    },
  }
}

export default postcssPxToViewport

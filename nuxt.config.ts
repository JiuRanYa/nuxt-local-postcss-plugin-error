import postcssPxToViewport from "./utils/pixel-to-viewport";

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-04-03',
  devtools: { enabled: true },
  postcss: {
    plugins: [
      postcssPxToViewport({
        unitToConvert: 'px',
        viewportWidth: 1920,
        unitPrecision: 10,
        propList: ['*'],
        viewportUnit: 'vw',
        fontViewportUnit: 'vw',
        selectorBlackList: [
          '[data-cc-device=mobile]',
          '[data-cc-device=desktop-lg]',
        ],
        minPixelValue: 1,
        mediaQuery: false,
        replace: true,
        exclude: [],
        landscape: false,
      }),
    ],
  },
})

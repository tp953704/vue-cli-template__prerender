module.exports = {
  presets: [
    '@vue/cli-plugin-babel/preset',
    {
      polyfills: [
          'es.promise',
          'es.symbol',
          'es.array.iterator',
          'es.object.assign',
          'es.promise.finally',
      ],
  },
  ]
}

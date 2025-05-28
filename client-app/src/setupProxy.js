// src/setupProxy.js
const { createProxyMiddleware } = require('http-proxy-middleware')

module.exports = function (app) {
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'https://multiply-darling-walrus.ngrok-free.app',
      changeOrigin: true,
      secure: false,
    }),
  )
}

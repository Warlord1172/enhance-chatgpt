const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
    app.use(
    '/api',
    createProxyMiddleware({
        target: 'https://chatgpt-playground.onrender.com:10010',
        changeOrigin: true,
    })
    );
};
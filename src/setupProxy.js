const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
    app.use(
    '/api',
    createProxyMiddleware({
        target: 'https://chatgpt-unleashed.onrender.com:10080',
        changeOrigin: true,
    })
    );
    /*
    app.use(
        '/API',
        createProxyMiddleware({
        target: 'http://localhost:3080',
        changeOrigin: true,
    })
    ) */
};
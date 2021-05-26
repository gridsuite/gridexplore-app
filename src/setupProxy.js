const { createProxyMiddleware } = require('http-proxy-middleware');
module.exports = function (app) {
    app.use(
        createProxyMiddleware('http://localhost:9000/api/gateway', {
            pathRewrite: { '^/api/gateway/': '/' },
        })
    );
    app.use(
        createProxyMiddleware('http://localhost:9000/ws/gateway', {
            pathRewrite: { '^/ws/gateway/': '/' },
            ws: true,
        })
    );
    app.use(
        createProxyMiddleware('http://localhost:5026/api/directory-server', {
            pathRewrite: { '^/api/directory-server': '/' },
            headers: { userId: 'John' },
        })
    );
};

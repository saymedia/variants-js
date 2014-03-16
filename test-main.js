require.config({
    baseUrl: '/base',
    deps: ['angular-variants', 'test'],
    callback: function() {
        window.__karma__.start();
    }
});
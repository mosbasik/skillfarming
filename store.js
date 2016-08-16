
(function (exports) {

    exports.storage = {
        fetch: function(key) {
            return JSON.parse(localStorage.getItem(key) || '[]');
        },
        save: function(key, value) {
            localStorage.setItem(key, JSON.stringify(value));
        }
    };

})(window);
!function (assert, path) {
    'use strict';

    require('vows').describe('Integration test').addBatch({
        'When minifying a CSS file': {
            topic: function () {
                var callback = this.callback,
                    topic;

                require('publishjs')({
                    cache: false,
                    log: false,
                    processors: {
                        jsx: require('../index')
                    }
                }).build(function (pipe, callback) {
                    pipe.from(path.resolve(path.dirname(module.filename), 'integration-test-files'))
                        .jsx()
                        .run(callback);
                }, callback);
            },

            'should returns a minified copy': function (topic) {
                assert.equal(Object.getOwnPropertyNames(topic).length, 2);
                assert.equal(topic['index.js'].toString().replace(/\r/g, ''), '!function () {\n    \'use strict\';\n\n    console.log(React.createElement("div", null, "Hello, World!"));\n}();');
                assert.equal(topic['index.html'].toString().replace(/\r/g, ''), '<!DOCTYPE html>\n<html lang="en-US">\n<head>\n    <script type="text/javascript">\n    !function () {\n        \'use strict\';\n\n        console.log(React.createElement("div", null, "Hello, World!"));\n    }();\n    </script>\n</head>\n</html>');
            }
        }
    }).export(module);
}(
    require('assert'),
    require('path')
);
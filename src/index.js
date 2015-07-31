!function (babel, path, util) {
    'use strict';

    var number = util.number,
        replaceMultiple = util.regexp.replaceMultiple,
        time = util.time;

    module.exports = function (inputs, outputs, args, callback) {
        if (arguments.length === 3) {
            callback = arguments[2];
            args = null;
        }

        var that = this;

        inputs.deleted.forEach(function (filename) {
            outputs[filename] = null;
        });

        inputs = inputs.newOrChanged;

        Object.getOwnPropertyNames(inputs).forEach(function (filename) {
            var startTime = Date.now(),
                original = inputs[filename],
                transformed;

            try {
                transformed = processFile(filename, original.toString(), args);
            } catch (ex) {
                that.log('Failed to process ' + filename + ' due to ' + ex.message);
                throw ex;
            }

            if (transformed) {
                var transformedBuffer = outputs[filename] = new Buffer(transformed);

                that.log([
                    'Transformed ',
                    filename,
                    ', took ',
                    time.humanize(Date.now() - startTime),
                    ' (',
                    number.bytes(original.length),
                    ' -> ',
                    number.bytes(transformedBuffer.length),
                    ', ',
                    (((transformedBuffer.length / original.length) - 1) * 100).toFixed(1),
                    '%)'
                ].join(''));
            } else {
                outputs[filename] = original;
            }
        });

        callback(null, outputs);
    };

    function processFile(filename, content, args) {
        var extname = (path.extname(filename) || '').toLowerCase();

        if (extname === '.html' || extname === '.htm') {
            return processHTML(content, args, filename);
        } else if (extname === '.js' || extname === '.jsx') {
            return processJS(content, args, filename);
        }
    }

    function processHTML(html, args, filename) {
        return replaceMultiple(
            html,
            [
                [
                    /(<script [^>]*?type=")(text\/jsx)([^"]*)("[^>]*>)([\s\S]*?)(<\/script>)/gmi,
                    function (match0, match1, match2, match3, match4, match5, match6, index, input) {
                        return match1 + 'text/javascript' + match4 + babel.transform(match5, extend({ filename: filename, whitelist: ['react'] }, args, parseSwitches(match3))).code + match6;
                    }
                ]
            ]
        );
    }

    function processJS(code, args, filename) {
        return babel.transform(code, extend({ filename: filename, whitelist: ['react'] }, args)).code;
    }

    function parseSwitches(str) {
        var switchPattern = /;([^=]+)(?:=([^;]+))?/g,
            switchMatch,
            output = {};

        while ((switchMatch = switchPattern.exec(str))) {
            var value = switchMatch[2];

            switch (value) {
            case 'true':
                value = true;
                break;

            case 'false':
                value = false;
                break;
            }

            output[switchMatch[1]] = value;
        }

        return output;
    }

    function extend() {
        var froms = [].slice.call(arguments),
            target = froms.shift();

        froms.forEach(function (from) {
            from && Object.getOwnPropertyNames(from).forEach(function (name) {
                target[name] = from[name];
            });
        });

        return target;
    }

    function countLines(text) {
        return Math.max(0, text.split('\n').length - 3);
    }
}(
    require('babel-core'),
    require('path'),
    require('publishjs').util
);
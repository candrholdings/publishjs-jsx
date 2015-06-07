!function (jsx, path, util) {
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

        inputs = inputs.newOrChanged;

        Object.getOwnPropertyNames(inputs).forEach(function (filename) {
            var startTime = Date.now(),
                original = inputs[filename],
                transformed = outputs[filename] = new Buffer(processFile(filename, original.toString(), args));

            that.log([
                'Transformed ',
                filename,
                ', took ',
                time.humanize(Date.now() - startTime),
                ' (',
                number.bytes(original.length),
                ' -> ',
                number.bytes(transformed.length),
                ', ',
                (((transformed.length / original.length) - 1) * 100).toFixed(1),
                '%)'
            ].join(''));
        });

        callback(null, outputs);
    };

    function processFile(filename, content, args) {
        if ((path.extname(filename) || '').toLowerCase() === '.html') {
            return processHTML(content, args);
        } else  {
            return processCSS(content, args);
        }
    }

    function processHTML(html, args) {
        return replaceMultiple(
            html,
            [
                [
                    /(<script [^>]*?type=")(text\/jsx)([^"]*)("[^>]*>)([\s\S]*?)(<\/script>)/gmi,
                    function (match0, match1, match2, match3, match4, match5, match6, index, input) {
                        return match1 + 'text/javascript' + match4 + jsx.transform(match5, extend({}, args, parseSwitches(match3))) + match6;
                    }
                ]
            ]
        );
    }

    function processCSS(code, args) {
        return jsx.transform(code, args);
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
    require('react-tools'),
    require('path'),
    require('publishjs').util
);
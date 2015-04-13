var Prototype = {
    Version: '1.7',
    Browser: (function () {
        var ua = navigator.userAgent;
        var isOpera = Object.prototype.toString.call(window.opera) == '[object Opera]';
        return {
            IE: !! window.attachEvent && !isOpera,
            IE9: ('documentMode' in document) && document.documentMode == 9,
            IE10: ('documentMode' in document) && document.documentMode == 10,
            Opera: isOpera,
            WebKit: ua.indexOf('AppleWebKit/') > -1,
            Gecko: ua.indexOf('Gecko') > -1 && ua.indexOf('KHTML') === -1,
            MobileSafari: /Apple.*Mobile/.test(ua)
        }
    })(),
    BrowserFeatures: {
        XPath: !! document.evaluate,
        SelectorsAPI: !! document.querySelector,
        ElementExtensions: (function () {
            var constructor = window.Element || window.HTMLElement;
            return !!(constructor && constructor.prototype);
        })(),
        SpecificElementExtensions: (function () {
            if (typeof window.HTMLDivElement !== 'undefined') return true;
            var div = document.createElement('div'),
                form = document.createElement('form'),
                isSupported = false;
            if (div['__proto__'] && (div['__proto__'] !== form['__proto__'])) {
                isSupported = true;
            }
            div = form = null;
            return isSupported;
        })()
    },
    ScriptFragment: '<script[^>]*>([\\S\\s]*?)<\/script>',
    JSONFilter: /^\/\*-secure-([\s\S]*)\*\/\s*$/,
    emptyFunction: function () {},
    K: function (x) {
        return x
    }
};
if (Prototype.Browser.MobileSafari) Prototype.BrowserFeatures.SpecificElementExtensions = false;
var Abstract = {};
var Try = {
    these: function () {
        var returnValue;
        for (var i = 0, length = arguments.length; i < length; i++) {
            var lambda = arguments[i];
            try {
                returnValue = lambda();
                break;
            } catch (e) {}
        }
        return returnValue;
    }
};
var Class = (function () {
    var IS_DONTENUM_BUGGY = (function () {
        for (var p in {
            toString: 1
        }) {
            if (p === 'toString') return false;
        }
        return true;
    })();

    function subclass() {};

    function create() {
        var parent = null,
            properties = $A(arguments);
        if (Object.isFunction(properties[0])) parent = properties.shift();

        function klass() {
            this.initialize.apply(this, arguments);
        }
        Object.extend(klass, Class.Methods);
        klass.superclass = parent;
        klass.subclasses = [];
        if (parent) {
            subclass.prototype = parent.prototype;
            klass.prototype = new subclass;
            parent.subclasses.push(klass);
        }
        for (var i = 0, length = properties.length; i < length; i++)
        klass.addMethods(properties[i]);
        if (!klass.prototype.initialize) klass.prototype.initialize = Prototype.emptyFunction;
        klass.prototype.constructor = klass;
        return klass;
    }

    function addMethods(source) {
        var ancestor = this.superclass && this.superclass.prototype,
            properties = Object.keys(source);
        if (IS_DONTENUM_BUGGY) {
            if (source.toString != Object.prototype.toString) properties.push("toString");
            if (source.valueOf != Object.prototype.valueOf) properties.push("valueOf");
        }
        for (var i = 0, length = properties.length; i < length; i++) {
            var property = properties[i],
                value = source[property];
            if (ancestor && Object.isFunction(value) && value.argumentNames()[0] == "$super") {
                var method = value;
                value = (function (m) {
                    return function () {
                        return ancestor[m].apply(this, arguments);
                    };
                })(property).wrap(method);
                value.valueOf = method.valueOf.bind(method);
                value.toString = method.toString.bind(method);
            }
            this.prototype[property] = value;
        }
        return this;
    }
    return {
        create: create,
        Methods: {
            addMethods: addMethods
        }
    };
})();
(function () {
    var _toString = Object.prototype.toString,
        NULL_TYPE = 'Null',
        UNDEFINED_TYPE = 'Undefined',
        BOOLEAN_TYPE = 'Boolean',
        NUMBER_TYPE = 'Number',
        STRING_TYPE = 'String',
        OBJECT_TYPE = 'Object',
        FUNCTION_CLASS = '[object Function]',
        BOOLEAN_CLASS = '[object Boolean]',
        NUMBER_CLASS = '[object Number]',
        STRING_CLASS = '[object String]',
        ARRAY_CLASS = '[object Array]',
        DATE_CLASS = '[object Date]',
        NATIVE_JSON_STRINGIFY_SUPPORT = window.JSON && typeof JSON.stringify === 'function' && JSON.stringify(0) === '0' && typeof JSON.stringify(Prototype.K) === 'undefined';

    function Type(o) {
        switch (o) {
            case null:
                return NULL_TYPE;
            case (void 0):
                return UNDEFINED_TYPE;
        }
        var type = typeof o;
        switch (type) {
            case 'boolean':
                return BOOLEAN_TYPE;
            case 'number':
                return NUMBER_TYPE;
            case 'string':
                return STRING_TYPE;
        }
        return OBJECT_TYPE;
    }

    function extend(destination, source) {
        for (var property in source)
        destination[property] = source[property];
        return destination;
    }

    function inspect(object) {
        try {
            if (isUndefined(object)) return 'undefined';
            if (object === null) return 'null';
            return object.inspect ? object.inspect() : String(object);
        } catch (e) {
            if (e instanceof RangeError) return '...';
            throw e;
        }
    }

    function toJSON(value) {
        return Str('', {
            '': value
        }, []);
    }

    function Str(key, holder, stack) {
        var value = holder[key],
            type = typeof value;
        if (Type(value) === OBJECT_TYPE && typeof value.toJSON === 'function') {
            value = value.toJSON(key);
        }
        var _class = _toString.call(value);
        switch (_class) {
            case NUMBER_CLASS:
            case BOOLEAN_CLASS:
            case STRING_CLASS:
                value = value.valueOf();
        }
        switch (value) {
            case null:
                return 'null';
            case true:
                return 'true';
            case false:
                return 'false';
        }
        type = typeof value;
        switch (type) {
            case 'string':
                return value.inspect(true);
            case 'number':
                return isFinite(value) ? String(value) : 'null';
            case 'object':
                for (var i = 0, length = stack.length; i < length; i++) {
                    if (stack[i] === value) {
                        throw new TypeError();
                    }
                }
                stack.push(value);
                var partial = [];
                if (_class === ARRAY_CLASS) {
                    for (var i = 0, length = value.length; i < length; i++) {
                        var str = Str(i, value, stack);
                        partial.push(typeof str === 'undefined' ? 'null' : str);
                    }
                    partial = '[' + partial.join(',') + ']';
                } else {
                    var keys = Object.keys(value);
                    for (var i = 0, length = keys.length; i < length; i++) {
                        var key = keys[i],
                            str = Str(key, value, stack);
                        if (typeof str !== "undefined") {
                            partial.push(key.inspect(true) + ':' + str);
                        }
                    }
                    partial = '{' + partial.join(',') + '}';
                }
                stack.pop();
                return partial;
        }
    }

    function stringify(object) {
        return JSON.stringify(object);
    }

    function toQueryString(object) {
        return $H(object).toQueryString();
    }

    function toHTML(object) {
        return object && object.toHTML ? object.toHTML() : String.interpret(object);
    }

    function keys(object) {
        if (Type(object) !== OBJECT_TYPE) {
            throw new TypeError();
        }
        var results = [];
        for (var property in object) {
            if (object.hasOwnProperty(property)) {
                results.push(property);
            }
        }
        return results;
    }

    function values(object) {
        var results = [];
        for (var property in object)
        results.push(object[property]);
        return results;
    }

    function clone(object) {
        return extend({}, object);
    }

    function isElement(object) {
        return !!(object && object.nodeType == 1);
    }

    function isArray(object) {
        return _toString.call(object) === ARRAY_CLASS;
    }
    var hasNativeIsArray = (typeof Array.isArray == 'function') && Array.isArray([]) && !Array.isArray({});
    if (hasNativeIsArray) {
        isArray = Array.isArray;
    }

    function isHash(object) {
        return object instanceof Hash;
    }

    function isFunction(object) {
        return _toString.call(object) === FUNCTION_CLASS;
    }

    function isString(object) {
        return _toString.call(object) === STRING_CLASS;
    }

    function isNumber(object) {
        return _toString.call(object) === NUMBER_CLASS;
    }

    function isDate(object) {
        return _toString.call(object) === DATE_CLASS;
    }

    function isUndefined(object) {
        return typeof object === "undefined";
    }
    extend(Object, {
        extend: extend,
        inspect: inspect,
        toJSON: NATIVE_JSON_STRINGIFY_SUPPORT ? stringify : toJSON,
        toQueryString: toQueryString,
        toHTML: toHTML,
        keys: Object.keys || keys,
        values: values,
        clone: clone,
        isElement: isElement,
        isArray: isArray,
        isHash: isHash,
        isFunction: isFunction,
        isString: isString,
        isNumber: isNumber,
        isDate: isDate,
        isUndefined: isUndefined
    });
})();
Object.extend(Function.prototype, (function () {
    var slice = Array.prototype.slice;

    function update(array, args) {
        var arrayLength = array.length,
            length = args.length;
        while (length--) array[arrayLength + length] = args[length];
        return array;
    }

    function merge(array, args) {
        array = slice.call(array, 0);
        return update(array, args);
    }

    function argumentNames() {
        var names = this.toString().match(/^[\s\(]*function[^(]*\(([^)]*)\)/)[1].replace(/\/\/.*?[\r\n]|\/\*(?:.|[\r\n])*?\*\//g, '').replace(/\s+/g, '').split(',');
        return names.length == 1 && !names[0] ? [] : names;
    }

    function bind(context) {
        if (arguments.length < 2 && Object.isUndefined(arguments[0])) return this;
        var __method = this,
            args = slice.call(arguments, 1);
        return function () {
            var a = merge(args, arguments);
            return __method.apply(context, a);
        }
    }

    function bindAsEventListener(context) {
        var __method = this,
            args = slice.call(arguments, 1);
        return function (event) {
            var a = update([event || window.event], args);
            return __method.apply(context, a);
        }
    }

    function curry() {
        if (!arguments.length) return this;
        var __method = this,
            args = slice.call(arguments, 0);
        return function () {
            var a = merge(args, arguments);
            return __method.apply(this, a);
        }
    }

    function delay(timeout) {
        var __method = this,
            args = slice.call(arguments, 1);
        timeout = timeout * 1000;
        return window.setTimeout(function () {
            return __method.apply(__method, args);
        }, timeout);
    }

    function defer() {
        var args = update([0.01], arguments);
        return this.delay.apply(this, args);
    }

    function wrap(wrapper) {
        var __method = this;
        return function () {
            var a = update([__method.bind(this)], arguments);
            return wrapper.apply(this, a);
        }
    }

    function methodize() {
        if (this._methodized) return this._methodized;
        var __method = this;
        return this._methodized = function () {
            var a = update([this], arguments);
            return __method.apply(null, a);
        };
    }
    return {
        argumentNames: argumentNames,
        bind: bind,
        bindAsEventListener: bindAsEventListener,
        curry: curry,
        delay: delay,
        p_defer: defer,
        wrap: wrap,
        methodize: methodize
    }
})());
(function (proto) {
    function toISOString() {
        return this.getUTCFullYear() + '-' + (this.getUTCMonth() + 1).toPaddedString(2) + '-' + this.getUTCDate().toPaddedString(2) + 'T' + this.getUTCHours().toPaddedString(2) + ':' + this.getUTCMinutes().toPaddedString(2) + ':' + this.getUTCSeconds().toPaddedString(2) + 'Z';
    }

    function toJSON() {
        return this.toISOString();
    }
    if (!proto.toISOString) proto.toISOString = toISOString;
    if (!proto.toJSON) proto.toJSON = toJSON;
})(Date.prototype);
RegExp.prototype.match = RegExp.prototype.test;
RegExp.escape = function (str) {
    return String(str).replace(/([.*+?^=!:${}()|[\]\/\\])/g, '\\$1');
};
var PeriodicalExecuter = Class.create({
    initialize: function (callback, frequency) {
        this.callback = callback;
        this.frequency = frequency;
        this.currentlyExecuting = false;
        this.registerCallback();
    },
    registerCallback: function () {
        this.timer = setInterval(this.onTimerEvent.bind(this), this.frequency * 1000);
    },
    execute: function () {
        this.callback(this);
    },
    stop: function () {
        if (!this.timer) return;
        clearInterval(this.timer);
        this.timer = null;
    },
    onTimerEvent: function () {
        if (!this.currentlyExecuting) {
            try {
                this.currentlyExecuting = true;
                this.execute();
                this.currentlyExecuting = false;
            } catch (e) {
                this.currentlyExecuting = false;
                throw e;
            }
        }
    }
});
Object.extend(String, {
    interpret: function (value) {
        return value == null ? '' : String(value);
    },
    specialChar: {
        '\b': '\\b',
        '\t': '\\t',
        '\n': '\\n',
        '\f': '\\f',
        '\r': '\\r',
        '\\': '\\\\'
    }
});
Object.extend(String.prototype, (function () {
    var NATIVE_JSON_PARSE_SUPPORT = window.JSON && typeof JSON.parse === 'function' && JSON.parse('{"test": true}').test;

    function prepareReplacement(replacement) {
        if (Object.isFunction(replacement)) return replacement;
        var template = new Template(replacement);
        return function (match) {
            return template.evaluate(match)
        };
    }

    function gsub(pattern, replacement) {
        var result = '',
            source = this,
            match;
        replacement = prepareReplacement(replacement);
        if (Object.isString(pattern)) pattern = RegExp.escape(pattern);
        if (!(pattern.length || pattern.source)) {
            replacement = replacement('');
            return replacement + source.split('').join(replacement) + replacement;
        }
        while (source.length > 0) {
            if (match = source.match(pattern)) {
                result += source.slice(0, match.index);
                result += String.interpret(replacement(match));
                source = source.slice(match.index + match[0].length);
            } else {
                result += source, source = '';
            }
        }
        return result;
    }

    function sub(pattern, replacement, count) {
        replacement = prepareReplacement(replacement);
        count = Object.isUndefined(count) ? 1 : count;
        return this.gsub(pattern, function (match) {
            if (--count < 0) return match[0];
            return replacement(match);
        });
    }

    function scan(pattern, iterator) {
        this.gsub(pattern, iterator);
        return String(this);
    }

    function truncate(length, truncation) {
        length = length || 30;
        truncation = Object.isUndefined(truncation) ? '...' : truncation;
        return this.length > length ? this.slice(0, length - truncation.length) + truncation : String(this);
    }

    function strip() {
        return this.replace(/^\s+/, '').replace(/\s+$/, '');
    }

    function stripTags() {
        return this.replace(/<\w+(\s+("[^"]*"|'[^']*'|[^>])+)?>|<\/\w+>/gi, '');
    }

    function stripScripts() {
        return this.replace(new RegExp(Prototype.ScriptFragment, 'img'), '');
    }

    function extractScripts() {
        var matchAll = new RegExp(Prototype.ScriptFragment, 'img'),
            matchOne = new RegExp(Prototype.ScriptFragment, 'im');
        return (this.match(matchAll) || []).map(function (scriptTag) {
            return (scriptTag.match(matchOne) || ['', ''])[1];
        });
    }

    function evalScripts() {
        return this.extractScripts().map(function (script) {
            return eval(script)
        });
    }

    function escapeHTML() {
        return this.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    function unescapeHTML() {
        return this.stripTags().replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
    }

    function toQueryParams(separator) {
        var match = this.strip().match(/([^?#]*)(#.*)?$/);
        if (!match) return {};
        return match[1].split(separator || '&').inject({}, function (hash, pair) {
            if ((pair = pair.split('='))[0]) {
                var key = decodeURIComponent(pair.shift()),
                    value = pair.length > 1 ? pair.join('=') : pair[0];
                if (value != undefined) value = decodeURIComponent(value);
                if (key in hash) {
                    if (!Object.isArray(hash[key])) hash[key] = [hash[key]];
                    hash[key].push(value);
                } else hash[key] = value;
            }
            return hash;
        });
    }

    function toArray() {
        return this.split('');
    }

    function succ() {
        return this.slice(0, this.length - 1) + String.fromCharCode(this.charCodeAt(this.length - 1) + 1);
    }

    function times(count) {
        return count < 1 ? '' : new Array(count + 1).join(this);
    }

    function camelize() {
        return this.replace(/-+(.)?/g, function (match, chr) {
            return chr ? chr.toUpperCase() : '';
        });
    }

    function capitalize() {
        return this.charAt(0).toUpperCase() + this.substring(1).toLowerCase();
    }

    function underscore() {
        return this.replace(/::/g, '/').replace(/([A-Z]+)([A-Z][a-z])/g, '$1_$2').replace(/([a-z\d])([A-Z])/g, '$1_$2').replace(/-/g, '_').toLowerCase();
    }

    function dasherize() {
        return this.replace(/_/g, '-');
    }

    function inspect(useDoubleQuotes) {
        var escapedString = this.replace(/[\x00-\x1f\\]/g, function (character) {
            if (character in String.specialChar) {
                return String.specialChar[character];
            }
            return '\\u00' + character.charCodeAt().toPaddedString(2, 16);
        });
        if (useDoubleQuotes) return '"' + escapedString.replace(/"/g, '\\"') + '"';
        return "'" + escapedString.replace(/'/g, '\\\'') + "'";
    }

    function unfilterJSON(filter) {
        return this.replace(filter || Prototype.JSONFilter, '$1');
    }

    function isJSON() {
        var str = this;
        if (str.blank()) return false;
        str = str.replace(/\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g, '@');
        str = str.replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, ']');
        str = str.replace(/(?:^|:|,)(?:\s*\[)+/g, '');
        return (/^[\],:{}\s]*$/).test(str);
    }

    function evalJSON(sanitize) {
        var json = this.unfilterJSON(),
            cx = /[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g;
        if (cx.test(json)) {
            json = json.replace(cx, function (a) {
                return '\\u' + ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
            });
        }
        try {
            if (!sanitize || json.isJSON()) return eval('(' + json + ')');
        } catch (e) {}
        throw new SyntaxError('Badly formed JSON string: ' + this.inspect());
    }

    function parseJSON() {
        var json = this.unfilterJSON();
        return JSON.parse(json);
    }

    function include(pattern) {
        return this.indexOf(pattern) > -1;
    }

    function startsWith(pattern) {
        return this.lastIndexOf(pattern, 0) === 0;
    }

    function endsWith(pattern) {
        var d = this.length - pattern.length;
        return d >= 0 && this.indexOf(pattern, d) === d;
    }

    function empty() {
        return this == '';
    }

    function blank() {
        return /^\s*$/.test(this);
    }

    function interpolate(object, pattern) {
        return new Template(this, pattern).evaluate(object);
    }
    return {
        gsub: gsub,
        sub: sub,
        scan: scan,
        truncate: truncate,
        strip: String.prototype.trim || strip,
        stripTags: stripTags,
        stripScripts: stripScripts,
        extractScripts: extractScripts,
        evalScripts: evalScripts,
        escapeHTML: escapeHTML,
        unescapeHTML: unescapeHTML,
        toQueryParams: toQueryParams,
        parseQuery: toQueryParams,
        toArray: toArray,
        succ: succ,
        times: times,
        camelize: camelize,
        capitalize: capitalize,
        underscore: underscore,
        dasherize: dasherize,
        inspect: inspect,
        unfilterJSON: unfilterJSON,
        isJSON: isJSON,
        evalJSON: NATIVE_JSON_PARSE_SUPPORT ? parseJSON : evalJSON,
        include: include,
        startsWith: startsWith,
        endsWith: endsWith,
        empty: empty,
        blank: blank,
        interpolate: interpolate
    };
})());
var Template = Class.create({
    initialize: function (template, pattern) {
        this.template = template.toString();
        this.pattern = pattern || Template.Pattern;
    },
    evaluate: function (object) {
        if (object && Object.isFunction(object.toTemplateReplacements)) object = object.toTemplateReplacements();
        return this.template.gsub(this.pattern, function (match) {
            if (object == null) return (match[1] + '');
            var before = match[1] || '';
            if (before == '\\') return match[2];
            var ctx = object,
                expr = match[3],
                pattern = /^([^.[]+|\[((?:.*?[^\\])?)\])(\.|\[|$)/;
            match = pattern.exec(expr);
            if (match == null) return before;
            while (match != null) {
                var comp = match[1].startsWith('[') ? match[2].replace(/\\\\]/g, ']') : match[1];
                ctx = ctx[comp];
                if (null == ctx || '' == match[3]) break;
                expr = expr.substring('[' == match[3] ? match[1].length : match[0].length);
                match = pattern.exec(expr);
            }
            return before + String.interpret(ctx);
        });
    }
});
Template.Pattern = /(^|.|\r|\n)(#\{(.*?)\})/;
var $break = {};
var Enumerable = (function () {
    function each(iterator, context) {
        var index = 0;
        try {
            this._each(function (value) {
                iterator.call(context, value, index++);
            });
        } catch (e) {
            if (e != $break) throw e;
        }
        return this;
    }

    function eachSlice(number, iterator, context) {
        var index = -number,
            slices = [],
            array = this.toArray();
        if (number < 1) return array;
        while ((index += number) < array.length)
        slices.push(array.slice(index, index + number));
        return slices.collect(iterator, context);
    }

    function all(iterator, context) {
        iterator = iterator || Prototype.K;
        var result = true;
        this.each(function (value, index) {
            result = result && !! iterator.call(context, value, index);
            if (!result) throw $break;
        });
        return result;
    }

    function any(iterator, context) {
        iterator = iterator || Prototype.K;
        var result = false;
        this.each(function (value, index) {
            if (result = !! iterator.call(context, value, index)) throw $break;
        });
        return result;
    }

    function collect(iterator, context) {
        iterator = iterator || Prototype.K;
        var results = [];
        this.each(function (value, index) {
            results.push(iterator.call(context, value, index));
        });
        return results;
    }

    function detect(iterator, context) {
        var result;
        this.each(function (value, index) {
            if (iterator.call(context, value, index)) {
                result = value;
                throw $break;
            }
        });
        return result;
    }

    function findAll(iterator, context) {
        var results = [];
        this.each(function (value, index) {
            if (iterator.call(context, value, index)) results.push(value);
        });
        return results;
    }

    function grep(filter, iterator, context) {
        iterator = iterator || Prototype.K;
        var results = [];
        if (Object.isString(filter)) filter = new RegExp(RegExp.escape(filter));
        this.each(function (value, index) {
            if (filter.match(value)) results.push(iterator.call(context, value, index));
        });
        return results;
    }

    function include(object) {
        if (Object.isFunction(this.indexOf)) if (this.indexOf(object) != -1) return true;
        var found = false;
        this.each(function (value) {
            if (value == object) {
                found = true;
                throw $break;
            }
        });
        return found;
    }

    function inGroupsOf(number, fillWith) {
        fillWith = Object.isUndefined(fillWith) ? null : fillWith;
        return this.eachSlice(number, function (slice) {
            while (slice.length < number) slice.push(fillWith);
            return slice;
        });
    }

    function inject(memo, iterator, context) {
        this.each(function (value, index) {
            memo = iterator.call(context, memo, value, index);
        });
        return memo;
    }

    function invoke(method) {
        var args = $A(arguments).slice(1);
        return this.map(function (value) {
            return value[method].apply(value, args);
        });
    }

    function max(iterator, context) {
        iterator = iterator || Prototype.K;
        var result;
        this.each(function (value, index) {
            value = iterator.call(context, value, index);
            if (result == null || value >= result) result = value;
        });
        return result;
    }

    function min(iterator, context) {
        iterator = iterator || Prototype.K;
        var result;
        this.each(function (value, index) {
            value = iterator.call(context, value, index);
            if (result == null || value < result) result = value;
        });
        return result;
    }

    function partition(iterator, context) {
        iterator = iterator || Prototype.K;
        var trues = [],
            falses = [];
        this.each(function (value, index) {
            (iterator.call(context, value, index) ? trues : falses).push(value);
        });
        return [trues, falses];
    }

    function pluck(property) {
        var results = [];
        this.each(function (value) {
            results.push(value[property]);
        });
        return results;
    }

    function reject(iterator, context) {
        var results = [];
        this.each(function (value, index) {
            if (!iterator.call(context, value, index)) results.push(value);
        });
        return results;
    }

    function sortBy(iterator, context) {
        return this.map(function (value, index) {
            return {
                value: value,
                criteria: iterator.call(context, value, index)
            };
        }).sort(function (left, right) {
            var a = left.criteria,
                b = right.criteria;
            return a < b ? -1 : a > b ? 1 : 0;
        }).pluck('value');
    }

    function toArray() {
        return this.map();
    }

    function zip() {
        var iterator = Prototype.K,
            args = $A(arguments);
        if (Object.isFunction(args.last())) iterator = args.pop();
        var collections = [this].concat(args).map($A);
        return this.map(function (value, index) {
            return iterator(collections.pluck(index));
        });
    }

    function size() {
        return this.toArray().length;
    }

    function inspect() {
        return '#<Enumerable:' + this.toArray().inspect() + '>';
    }
    return {
        each: each,
        eachSlice: eachSlice,
        all: all,
        every: all,
        any: any,
        some: any,
        collect: collect,
        map: collect,
        detect: detect,
        findAll: findAll,
        select: findAll,
        filter: findAll,
        grep: grep,
        include: include,
        member: include,
        inGroupsOf: inGroupsOf,
        inject: inject,
        invoke: invoke,
        max: max,
        min: min,
        partition: partition,
        pluck: pluck,
        reject: reject,
        sortBy: sortBy,
        toArray: toArray,
        entries: toArray,
        zip: zip,
        size: size,
        inspect: inspect,
        find: detect
    };
})();

function $A(iterable) {
    if (!iterable) return [];
    if ('toArray' in Object(iterable)) return iterable.toArray();
    var length = iterable.length || 0,
        results = new Array(length);
    while (length--) results[length] = iterable[length];
    return results;
}

function $w(string) {
    if (!Object.isString(string)) return [];
    string = string.strip();
    return string ? string.split(/\s+/) : [];
}
Array.from = $A;
(function () {
    var arrayProto = Array.prototype,
        slice = arrayProto.slice,
        _each = arrayProto.forEach;

    function each(iterator, context) {
        for (var i = 0, length = this.length >>> 0; i < length; i++) {
            if (i in this) iterator.call(context, this[i], i, this);
        }
    }
    if (!_each) _each = each;

    function clear() {
        this.length = 0;
        return this;
    }

    function first() {
        return this[0];
    }

    function last() {
        return this[this.length - 1];
    }

    function compact() {
        return this.select(function (value) {
            return value != null;
        });
    }

    function flatten() {
        return this.inject([], function (array, value) {
            if (Object.isArray(value)) return array.concat(value.flatten());
            array.push(value);
            return array;
        });
    }

    function without() {
        var values = slice.call(arguments, 0);
        return this.select(function (value) {
            return !values.include(value);
        });
    }

    function reverse(inline) {
        return (inline === false ? this.toArray() : this)._reverse();
    }

    function uniq(sorted) {
        return this.inject([], function (array, value, index) {
            if (0 == index || (sorted ? array.last() != value : !array.include(value))) array.push(value);
            return array;
        });
    }

    function intersect(array) {
        return this.uniq().findAll(function (item) {
            return array.detect(function (value) {
                return item === value
            });
        });
    }

    function clone() {
        return slice.call(this, 0);
    }

    function size() {
        return this.length;
    }

    function inspect() {
        return '[' + this.map(Object.inspect).join(', ') + ']';
    }

    function indexOf(item, i) {
        i || (i = 0);
        var length = this.length;
        if (i < 0) i = length + i;
        for (; i < length; i++)
        if (this[i] === item) return i;
        return -1;
    }

    function lastIndexOf(item, i) {
        i = isNaN(i) ? this.length : (i < 0 ? this.length + i : i) + 1;
        var n = this.slice(0, i).reverse().indexOf(item);
        return (n < 0) ? n : i - n - 1;
    }

    function concat() {
        var array = slice.call(this, 0),
            item;
        for (var i = 0, length = arguments.length; i < length; i++) {
            item = arguments[i];
            if (Object.isArray(item) && !('callee' in item)) {
                for (var j = 0, arrayLength = item.length; j < arrayLength; j++)
                array.push(item[j]);
            } else {
                array.push(item);
            }
        }
        return array;
    }
    Object.extend(arrayProto, Enumerable);
    if (!arrayProto._reverse) arrayProto._reverse = arrayProto.reverse;
    Object.extend(arrayProto, {
        _each: _each,
        clear: clear,
        first: first,
        last: last,
        compact: compact,
        flatten: flatten,
        without: without,
        reverse: reverse,
        uniq: uniq,
        intersect: intersect,
        clone: clone,
        toArray: clone,
        size: size,
        inspect: inspect
    });
    var CONCAT_ARGUMENTS_BUGGY = (function () {
        return [].concat(arguments)[0][0] !== 1;
    })(1, 2)
    if (CONCAT_ARGUMENTS_BUGGY) arrayProto.concat = concat;
    if (!arrayProto.indexOf) arrayProto.indexOf = indexOf;
    if (!arrayProto.lastIndexOf) arrayProto.lastIndexOf = lastIndexOf;
})();

function $H(object) {
    return new Hash(object);
};
var Hash = Class.create(Enumerable, (function () {
    function initialize(object) {
        this._object = Object.isHash(object) ? object.toObject() : Object.clone(object);
    }

    function _each(iterator) {
        for (var key in this._object) {
            var value = this._object[key],
                pair = [key, value];
            pair.key = key;
            pair.value = value;
            iterator(pair);
        }
    }

    function set(key, value) {
        return this._object[key] = value;
    }

    function get(key) {
        if (this._object[key] !== Object.prototype[key]) return this._object[key];
    }

    function unset(key) {
        var value = this._object[key];
        delete this._object[key];
        return value;
    }

    function toObject() {
        return Object.clone(this._object);
    }

    function keys() {
        return this.pluck('key');
    }

    function values() {
        return this.pluck('value');
    }

    function index(value) {
        var match = this.detect(function (pair) {
            return pair.value === value;
        });
        return match && match.key;
    }

    function merge(object) {
        return this.clone().update(object);
    }

    function update(object) {
        return new Hash(object).inject(this, function (result, pair) {
            result.set(pair.key, pair.value);
            return result;
        });
    }

    function toQueryPair(key, value) {
        if (Object.isUndefined(value)) return key;
        return key + '=' + encodeURIComponent(String.interpret(value));
    }

    function toQueryString() {
        return this.inject([], function (results, pair) {
            var key = encodeURIComponent(pair.key),
                values = pair.value;
            if (values && typeof values == 'object') {
                if (Object.isArray(values)) {
                    var queryValues = [];
                    for (var i = 0, len = values.length, value; i < len; i++) {
                        value = values[i];
                        queryValues.push(toQueryPair(key, value));
                    }
                    return results.concat(queryValues);
                }
            } else results.push(toQueryPair(key, values));
            return results;
        }).join('&');
    }

    function inspect() {
        return '#<Hash:{' + this.map(function (pair) {
            return pair.map(Object.inspect).join(': ');
        }).join(', ') + '}>';
    }

    function clone() {
        return new Hash(this);
    }
    return {
        initialize: initialize,
        _each: _each,
        set: set,
        get: get,
        unset: unset,
        toObject: toObject,
        toTemplateReplacements: toObject,
        keys: keys,
        values: values,
        index: index,
        merge: merge,
        update: update,
        toQueryString: toQueryString,
        inspect: inspect,
        toJSON: toObject,
        clone: clone
    };
})());
Hash.from = $H;
Object.extend(Number.prototype, (function () {
    function toColorPart() {
        return this.toPaddedString(2, 16);
    }

    function succ() {
        return this + 1;
    }

    function times(iterator, context) {
        $R(0, this, true).each(iterator, context);
        return this;
    }

    function toPaddedString(length, radix) {
        var string = this.toString(radix || 10);
        return '0'.times(length - string.length) + string;
    }

    function abs() {
        return Math.abs(this);
    }

    function round() {
        return Math.round(this);
    }

    function ceil() {
        return Math.ceil(this);
    }

    function floor() {
        return Math.floor(this);
    }
    return {
        toColorPart: toColorPart,
        succ: succ,
        times: times,
        toPaddedString: toPaddedString,
        abs: abs,
        round: round,
        ceil: ceil,
        floor: floor
    };
})());

function $R(start, end, exclusive) {
    return new ObjectRange(start, end, exclusive);
}
var ObjectRange = Class.create(Enumerable, (function () {
    function initialize(start, end, exclusive) {
        this.start = start;
        this.end = end;
        this.exclusive = exclusive;
    }

    function _each(iterator) {
        var value = this.start;
        while (this.include(value)) {
            iterator(value);
            value = value.succ();
        }
    }

    function include(value) {
        if (value < this.start) return false;
        if (this.exclusive) return value < this.end;
        return value <= this.end;
    }
    return {
        initialize: initialize,
        _each: _each,
        include: include
    };
})());
var Ajax = {
    getTransport: function () {
        return Try.these(function () {
            return new XMLHttpRequest()
        }, function () {
            return new ActiveXObject('Msxml2.XMLHTTP')
        }, function () {
            return new ActiveXObject('Microsoft.XMLHTTP')
        }) || false;
    },
    activeRequestCount: 0
};
Ajax.Responders = {
    responders: [],
    _each: function (iterator) {
        this.responders._each(iterator);
    },
    register: function (responder) {
        if (!this.include(responder)) this.responders.push(responder);
    },
    unregister: function (responder) {
        this.responders = this.responders.without(responder);
    },
    dispatch: function (callback, request, transport, json) {
        this.each(function (responder) {
            if (Object.isFunction(responder[callback])) {
                try {
                    responder[callback].apply(responder, [request, transport, json]);
                } catch (e) {}
            }
        });
    }
};
Object.extend(Ajax.Responders, Enumerable);
Ajax.Responders.register({
    onCreate: function () {
        Ajax.activeRequestCount++
    },
    onComplete: function () {
        Ajax.activeRequestCount--
    }
});
Ajax.Base = Class.create({
    initialize: function (options) {
        this.options = {
            method: 'post',
            asynchronous: true,
            contentType: 'application/x-www-form-urlencoded',
            encoding: 'UTF-8',
            parameters: '',
            evalJSON: true,
            evalJS: true
        };
        Object.extend(this.options, options || {});
        this.options.method = this.options.method.toLowerCase();
        if (Object.isHash(this.options.parameters)) this.options.parameters = this.options.parameters.toObject();
    }
});
Ajax.Request = Class.create(Ajax.Base, {
    _complete: false,
    initialize: function ($super, url, options) {
        $super(options);
        this.transport = Ajax.getTransport();
        this.request(url);
    },
    request: function (url) {
        this.url = url;
        this.method = this.options.method;
        var params = Object.isString(this.options.parameters) ? this.options.parameters : Object.toQueryString(this.options.parameters);
        if (!['get', 'post'].include(this.method)) {
            params += (params ? '&' : '') + "_method=" + this.method;
            this.method = 'post';
        }
        if (params && this.method === 'get') {
            this.url += (this.url.include('?') ? '&' : '?') + params;
        }
        this.parameters = params.toQueryParams();
        try {
            var response = new Ajax.Response(this);
            if (this.options.onCreate) this.options.onCreate(response);
            Ajax.Responders.dispatch('onCreate', this, response);
            this.transport.open(this.method.toUpperCase(), this.url, this.options.asynchronous);
            if (this.options.asynchronous) this.respondToReadyState.bind(this).p_defer(1);
            this.transport.onreadystatechange = this.onStateChange.bind(this);
            this.setRequestHeaders();
            this.body = this.method == 'post' ? (this.options.postBody || params) : null;
            this.transport.send(this.body);
            if (!this.options.asynchronous && this.transport.overrideMimeType) this.onStateChange();
        } catch (e) {
            this.dispatchException(e);
        }
    },
    onStateChange: function () {
        var readyState = this.transport.readyState;
        if (readyState > 1 && !((readyState == 4) && this._complete)) this.respondToReadyState(this.transport.readyState);
    },
    setRequestHeaders: function () {
        var headers = {
            'X-Requested-With': 'XMLHttpRequest',
            'X-Prototype-Version': Prototype.Version,
            'Accept': 'text/javascript, text/html, application/xml, text/xml, */*'
        };
        if (this.method == 'post') {
            headers['Content-type'] = this.options.contentType + (this.options.encoding ? '; charset=' + this.options.encoding : '');
            if (this.transport.overrideMimeType && (navigator.userAgent.match(/Gecko\/(\d{4})/) || [0, 2005])[1] < 2005) headers['Connection'] = 'close';
        }
        if (typeof this.options.requestHeaders == 'object') {
            var extras = this.options.requestHeaders;
            if (Object.isFunction(extras.push)) for (var i = 0, length = extras.length; i < length; i += 2)
            headers[extras[i]] = extras[i + 1];
            else $H(extras).each(function (pair) {
                headers[pair.key] = pair.value
            });
        }
        for (var name in headers)
        this.transport.setRequestHeader(name, headers[name]);
    },
    success: function () {
        var status = this.getStatus();
        return !status || (status >= 200 && status < 300) || status == 304;
    },
    getStatus: function () {
        try {
            if (this.transport.status === 1223) return 204;
            return this.transport.status || 0;
        } catch (e) {
            return 0
        }
    },
    respondToReadyState: function (readyState) {
        var state = Ajax.Request.Events[readyState],
            response = new Ajax.Response(this);
        if (state == 'Complete') {
            try {
                this._complete = true;
                (this.options['on' + response.status] || this.options['on' + (this.success() ? 'Success' : 'Failure')] || Prototype.emptyFunction)(response, response.headerJSON);
            } catch (e) {
                this.dispatchException(e);
            }
            var contentType = response.getHeader('Content-type');
            if (this.options.evalJS == 'force' || (this.options.evalJS && this.isSameOrigin() && contentType && contentType.match(/^\s*(text|application)\/(x-)?(java|ecma)script(;.*)?\s*$/i))) this.evalResponse();
        }
        try {
            (this.options['on' + state] || Prototype.emptyFunction)(response, response.headerJSON);
            Ajax.Responders.dispatch('on' + state, this, response, response.headerJSON);
        } catch (e) {
            this.dispatchException(e);
        }
        if (state == 'Complete') {
            this.transport.onreadystatechange = Prototype.emptyFunction;
        }
    },
    isSameOrigin: function () {
        var m = this.url.match(/^\s*https?:\/\/[^\/]*/);
        return !m || (m[0] == '#{protocol}//#{domain}#{port}'.interpolate({
            protocol: location.protocol,
            domain: document.domain,
            port: location.port ? ':' + location.port : ''
        }));
    },
    getHeader: function (name) {
        try {
            return this.transport.getResponseHeader(name) || null;
        } catch (e) {
            return null;
        }
    },
    evalResponse: function () {
        try {
            return eval((this.transport.responseText || '').unfilterJSON());
        } catch (e) {
            this.dispatchException(e);
        }
    },
    dispatchException: function (exception) {
        (this.options.onException || Prototype.emptyFunction)(this, exception);
        Ajax.Responders.dispatch('onException', this, exception);
    }
});
Ajax.Request.Events = ['Uninitialized', 'Loading', 'Loaded', 'Interactive', 'Complete'];
Ajax.Response = Class.create({
    initialize: function (request) {
        this.request = request;
        var transport = this.transport = request.transport,
            readyState = this.readyState = transport.readyState;
        if ((readyState > 2 && !Prototype.Browser.IE) || readyState == 4) {
            this.status = this.getStatus();
            this.statusText = this.getStatusText();
            this.responseText = String.interpret(transport.responseText);
            this.headerJSON = this._getHeaderJSON();
        }
        if (readyState == 4) {
            var xml = transport.responseXML;
            this.responseXML = Object.isUndefined(xml) ? null : xml;
            this.responseJSON = this._getResponseJSON();
        }
    },
    status: 0,
    statusText: '',
    getStatus: Ajax.Request.prototype.getStatus,
    getStatusText: function () {
        try {
            return this.transport.statusText || '';
        } catch (e) {
            return ''
        }
    },
    getHeader: Ajax.Request.prototype.getHeader,
    getAllHeaders: function () {
        try {
            return this.getAllResponseHeaders();
        } catch (e) {
            return null
        }
    },
    getResponseHeader: function (name) {
        return this.transport.getResponseHeader(name);
    },
    getAllResponseHeaders: function () {
        return this.transport.getAllResponseHeaders();
    },
    _getHeaderJSON: function () {
        var json = this.getHeader('X-JSON');
        if (!json) return null;
        json = decodeURIComponent(escape(json));
        try {
            return json.evalJSON(this.request.options.sanitizeJSON || !this.request.isSameOrigin());
        } catch (e) {
            this.request.dispatchException(e);
        }
    },
    _getResponseJSON: function () {
        var options = this.request.options;
        if (!options.evalJSON || (options.evalJSON != 'force' && !(this.getHeader('Content-type') || '').include('application/json')) || this.responseText.blank()) return null;
        try {
            return this.responseText.evalJSON(options.sanitizeJSON || !this.request.isSameOrigin());
        } catch (e) {
            this.request.dispatchException(e);
        }
    }
});
Ajax.Updater = Class.create(Ajax.Request, {
    initialize: function ($super, container, url, options) {
        this.container = {
            success: (container.success || container),
            failure: (container.failure || (container.success ? null : container))
        };
        options = Object.clone(options);
        var onComplete = options.onComplete;
        options.onComplete = (function (response, json) {
            this.updateContent(response.responseText);
            if (Object.isFunction(onComplete)) onComplete(response, json);
        }).bind(this);
        $super(url, options);
    },
    updateContent: function (responseText) {
        var receiver = this.container[this.success() ? 'success' : 'failure'],
            options = this.options;
        if (!options.evalScripts) responseText = responseText.stripScripts();
        if (receiver = $(receiver)) {
            if (options.insertion) {
                if (Object.isString(options.insertion)) {
                    var insertion = {};
                    insertion[options.insertion] = responseText;
                    receiver.insert(insertion);
                } else options.insertion(receiver, responseText);
            } else receiver.update(responseText);
        }
    }
});
Ajax.PeriodicalUpdater = Class.create(Ajax.Base, {
    initialize: function ($super, container, url, options) {
        $super(options);
        this.onComplete = this.options.onComplete;
        this.frequency = (this.options.frequency || 2);
        this.decay = (this.options.decay || 1);
        this.updater = {};
        this.container = container;
        this.url = url;
        this.start();
    },
    start: function () {
        this.options.onComplete = this.updateComplete.bind(this);
        this.onTimerEvent();
    },
    stop: function () {
        this.updater.options.onComplete = undefined;
        clearTimeout(this.timer);
        (this.onComplete || Prototype.emptyFunction).apply(this, arguments);
    },
    updateComplete: function (response) {
        if (this.options.decay) {
            this.decay = (response.responseText == this.lastText ? this.decay * this.options.decay : 1);
            this.lastText = response.responseText;
        }
        this.timer = this.onTimerEvent.bind(this).delay(this.decay * this.frequency);
    },
    onTimerEvent: function () {
        this.updater = new Ajax.Updater(this.container, this.url, this.options);
    }
});

function $(element) {
    if (arguments.length > 1) {
        for (var i = 0, elements = [], length = arguments.length; i < length; i++)
        elements.push($(arguments[i]));
        return elements;
    }
    if (Object.isString(element)) element = document.getElementById(element);
    return Element.extend(element);
}
if (Prototype.BrowserFeatures.XPath) {
    document._getElementsByXPath = function (expression, parentElement) {
        var results = [];
        var query = document.evaluate(expression, $(parentElement) || document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
        for (var i = 0, length = query.snapshotLength; i < length; i++)
        results.push(Element.extend(query.snapshotItem(i)));
        return results;
    };
}
if (!Node) var Node = {};
if (!Node.ELEMENT_NODE) {
    Object.extend(Node, {
        ELEMENT_NODE: 1,
        ATTRIBUTE_NODE: 2,
        TEXT_NODE: 3,
        CDATA_SECTION_NODE: 4,
        ENTITY_REFERENCE_NODE: 5,
        ENTITY_NODE: 6,
        PROCESSING_INSTRUCTION_NODE: 7,
        COMMENT_NODE: 8,
        DOCUMENT_NODE: 9,
        DOCUMENT_TYPE_NODE: 10,
        DOCUMENT_FRAGMENT_NODE: 11,
        NOTATION_NODE: 12
    });
}
(function (global) {
    function shouldUseCache(tagName, attributes) {
        if (tagName === 'select') return false;
        if ('type' in attributes) return false;
        return true;
    }
    var HAS_EXTENDED_CREATE_ELEMENT_SYNTAX = (function () {
        try {
            var el = document.createElement('<input name="x">');
            return el.tagName.toLowerCase() === 'input' && el.name === 'x';
        } catch (err) {
            return false;
        }
    })();
    var element = global.Element;
    global.Element = function (tagName, attributes) {
        attributes = attributes || {};
        tagName = tagName.toLowerCase();
        var cache = Element.cache;
        if (HAS_EXTENDED_CREATE_ELEMENT_SYNTAX && attributes.name) {
            tagName = '<' + tagName + ' name="' + attributes.name + '">';
            delete attributes.name;
            return Element.writeAttribute(document.createElement(tagName), attributes);
        }
        if (!cache[tagName]) cache[tagName] = Element.extend(document.createElement(tagName));
        var node = shouldUseCache(tagName, attributes) ? cache[tagName].cloneNode(false) : document.createElement(tagName);
        return Element.writeAttribute(node, attributes);
    };
    Object.extend(global.Element, element || {});
    if (element) global.Element.prototype = element.prototype;
})(this);
Element.idCounter = 1;
Element.cache = {};
Element._purgeElement = function (element) {
    var uid = element._prototypeUID;
    if (uid) {
        Element.stopObserving(element);
        element._prototypeUID = void 0;
        delete Element.Storage[uid];
    }
}
Element.Methods = {
    visible: function (element) {
        return $(element).style.display != 'none';
    },
    toggle: function (element) {
        element = $(element);
        Element[Element.visible(element) ? 'hide' : 'show'](element);
        return element;
    },
    hide: function (element) {
        element = $(element);
        element.style.display = 'none';
        return element;
    },
    show: function (element) {
        element = $(element);
        element.style.display = '';
        return element;
    },
    remove: function (element) {
        element = $(element);
        element.parentNode.removeChild(element);
        return element;
    },
    update: (function () {
        var SELECT_ELEMENT_INNERHTML_BUGGY = (function () {
            var el = document.createElement("select"),
                isBuggy = true;
            el.innerHTML = "<option value=\"test\">test</option>";
            if (el.options && el.options[0]) {
                isBuggy = el.options[0].nodeName.toUpperCase() !== "OPTION";
            }
            el = null;
            return isBuggy;
        })();
        var TABLE_ELEMENT_INNERHTML_BUGGY = (function () {
            try {
                var el = document.createElement("table");
                if (el && el.tBodies) {
                    el.innerHTML = "<tbody><tr><td>test</td></tr></tbody>";
                    var isBuggy = typeof el.tBodies[0] == "undefined";
                    el = null;
                    return isBuggy;
                }
            } catch (e) {
                return true;
            }
        })();
        var LINK_ELEMENT_INNERHTML_BUGGY = (function () {
            try {
                var el = document.createElement('div');
                el.innerHTML = "<link>";
                var isBuggy = (el.childNodes.length === 0);
                el = null;
                return isBuggy;
            } catch (e) {
                return true;
            }
        })();
        var ANY_INNERHTML_BUGGY = SELECT_ELEMENT_INNERHTML_BUGGY || TABLE_ELEMENT_INNERHTML_BUGGY || LINK_ELEMENT_INNERHTML_BUGGY;
        var SCRIPT_ELEMENT_REJECTS_TEXTNODE_APPENDING = (function () {
            var s = document.createElement("script"),
                isBuggy = false;
            try {
                s.appendChild(document.createTextNode(""));
                isBuggy = !s.firstChild || s.firstChild && s.firstChild.nodeType !== 3;
            } catch (e) {
                isBuggy = true;
            }
            s = null;
            return isBuggy;
        })();

        function update(element, content) {
            element = $(element);
            var purgeElement = Element._purgeElement;
            var descendants = element.getElementsByTagName('*'),
                i = descendants.length;
            while (i--) purgeElement(descendants[i]);
            if (content && content.toElement) content = content.toElement();
            if (Object.isElement(content)) return element.update().insert(content);
            content = Object.toHTML(content);
            var tagName = element.tagName.toUpperCase();
            if (tagName === 'SCRIPT' && SCRIPT_ELEMENT_REJECTS_TEXTNODE_APPENDING) {
                element.text = content;
                return element;
            }
            if (ANY_INNERHTML_BUGGY) {
                if (tagName in Element._insertionTranslations.tags) {
                    while (element.firstChild) {
                        element.removeChild(element.firstChild);
                    }
                    Element._getContentFromAnonymousElement(tagName, content.stripScripts()).each(function (node) {
                        element.appendChild(node)
                    });
                } else if (LINK_ELEMENT_INNERHTML_BUGGY && Object.isString(content) && content.indexOf('<link') > -1) {
                    while (element.firstChild) {
                        element.removeChild(element.firstChild);
                    }
                    var nodes = Element._getContentFromAnonymousElement(tagName, content.stripScripts(), true);
                    nodes.each(function (node) {
                        element.appendChild(node)
                    });
                } else {
                    element.innerHTML = content.stripScripts();
                }
            } else {
                element.innerHTML = content.stripScripts();
            }
            content.evalScripts.bind(content).p_defer();
            return element;
        }
        return update;
    })(),
    replace: function (element, content) {
        element = $(element);
        if (content && content.toElement) content = content.toElement();
        else if (!Object.isElement(content)) {
            content = Object.toHTML(content);
            var range = element.ownerDocument.createRange();
            range.selectNode(element);
            content.evalScripts.bind(content).p_defer();
            content = range.createContextualFragment(content.stripScripts());
        }
        element.parentNode.replaceChild(content, element);
        return element;
    },
    insert: function (element, insertions) {
        element = $(element);
        if (Object.isString(insertions) || Object.isNumber(insertions) || Object.isElement(insertions) || (insertions && (insertions.toElement || insertions.toHTML))) insertions = {
            bottom: insertions
        };
        var content, insert, tagName, childNodes;
        for (var position in insertions) {
            content = insertions[position];
            position = position.toLowerCase();
            insert = Element._insertionTranslations[position];
            if (content && content.toElement) content = content.toElement();
            if (Object.isElement(content)) {
                insert(element, content);
                continue;
            }
            content = Object.toHTML(content);
            tagName = ((position == 'before' || position == 'after') ? element.parentNode : element).tagName.toUpperCase();
            childNodes = Element._getContentFromAnonymousElement(tagName, content.stripScripts());
            if (position == 'top' || position == 'after') childNodes.reverse();
            childNodes.each(insert.curry(element));
            content.evalScripts.bind(content).p_defer();
        }
        return element;
    },
    wrap: function (element, wrapper, attributes) {
        element = $(element);
        if (Object.isElement(wrapper)) $(wrapper).writeAttribute(attributes || {});
        else if (Object.isString(wrapper)) wrapper = new Element(wrapper, attributes);
        else wrapper = new Element('div', wrapper);
        if (element.parentNode) element.parentNode.replaceChild(wrapper, element);
        wrapper.appendChild(element);
        return wrapper;
    },
    inspect: function (element) {
        element = $(element);
        var result = '<' + element.tagName.toLowerCase();
        $H({
            'id': 'id',
            'className': 'class'
        }).each(function (pair) {
            var property = pair.first(),
                attribute = pair.last(),
                value = (element[property] || '').toString();
            if (value) result += ' ' + attribute + '=' + value.inspect(true);
        });
        return result + '>';
    },
    recursivelyCollect: function (element, property, maximumLength) {
        element = $(element);
        maximumLength = maximumLength || -1;
        var elements = [];
        while (element = element[property]) {
            if (element.nodeType == 1) elements.push(Element.extend(element));
            if (elements.length == maximumLength) break;
        }
        return elements;
    },
    ancestors: function (element) {
        return Element.recursivelyCollect(element, 'parentNode');
    },
    descendants: function (element) {
        return Element.select(element, "*");
    },
    firstDescendant: function (element) {
        element = $(element).firstChild;
        while (element && element.nodeType != 1) element = element.nextSibling;
        return $(element);
    },
    immediateDescendants: function (element) {
        var results = [],
            child = $(element).firstChild;
        while (child) {
            if (child.nodeType === 1) {
                results.push(Element.extend(child));
            }
            child = child.nextSibling;
        }
        return results;
    },
    previousSiblings: function (element, maximumLength) {
        return Element.recursivelyCollect(element, 'previousSibling');
    },
    nextSiblings: function (element) {
        return Element.recursivelyCollect(element, 'nextSibling');
    },
    siblings: function (element) {
        element = $(element);
        return Element.previousSiblings(element).reverse().concat(Element.nextSiblings(element));
    },
    match: function (element, selector) {
        element = $(element);
        if (Object.isString(selector)) return Prototype.Selector.match(element, selector);
        return selector.match(element);
    },
    up: function (element, expression, index) {
        element = $(element);
        if (arguments.length == 1) return $(element.parentNode);
        var ancestors = Element.ancestors(element);
        return Object.isNumber(expression) ? ancestors[expression] : Prototype.Selector.find(ancestors, expression, index);
    },
    down: function (element, expression, index) {
        element = $(element);
        if (arguments.length == 1) return Element.firstDescendant(element);
        return Object.isNumber(expression) ? Element.descendants(element)[expression] : Element.select(element, expression)[index || 0];
    },
    previous: function (element, expression, index) {
        element = $(element);
        if (Object.isNumber(expression)) index = expression, expression = false;
        if (!Object.isNumber(index)) index = 0;
        if (expression) {
            return Prototype.Selector.find(element.previousSiblings(), expression, index);
        } else {
            return element.recursivelyCollect("previousSibling", index + 1)[index];
        }
    },
    next: function (element, expression, index) {
        element = $(element);
        if (Object.isNumber(expression)) index = expression, expression = false;
        if (!Object.isNumber(index)) index = 0;
        if (expression) {
            return Prototype.Selector.find(element.nextSiblings(), expression, index);
        } else {
            var maximumLength = Object.isNumber(index) ? index + 1 : 1;
            return element.recursivelyCollect("nextSibling", index + 1)[index];
        }
    },
    select: function (element) {
        element = $(element);
        var expressions = Array.prototype.slice.call(arguments, 1).join(', ');
        return Prototype.Selector.select(expressions, element);
    },
    adjacent: function (element) {
        element = $(element);
        var expressions = Array.prototype.slice.call(arguments, 1).join(', ');
        return Prototype.Selector.select(expressions, element.parentNode).without(element);
    },
    identify: function (element) {
        element = $(element);
        var id = Element.readAttribute(element, 'id');
        if (id) return id;
        do {
            id = 'anonymous_element_' + Element.idCounter++
        } while ($(id));
        Element.writeAttribute(element, 'id', id);
        return id;
    },
    readAttribute: function (element, name) {
        element = $(element);
        if (Prototype.Browser.IE) {
            var t = Element._attributeTranslations.read;
            if (t.values[name]) return t.values[name](element, name);
            if (t.names[name]) name = t.names[name];
            if (name.include(':')) {
                return (!element.attributes || !element.attributes[name]) ? null : element.attributes[name].value;
            }
        }
        return element.getAttribute(name);
    },
    writeAttribute: function (element, name, value) {
        element = $(element);
        var attributes = {}, t = Element._attributeTranslations.write;
        if (typeof name == 'object') attributes = name;
        else attributes[name] = Object.isUndefined(value) ? true : value;
        for (var attr in attributes) {
            name = t.names[attr] || attr;
            value = attributes[attr];
            if (t.values[attr]) name = t.values[attr](element, value);
            if (value === false || value === null) element.removeAttribute(name);
            else if (value === true) element.setAttribute(name, name);
            else element.setAttribute(name, value);
        }
        return element;
    },
    getHeight: function (element) {
        return Element.getDimensions(element).height;
    },
    getWidth: function (element) {
        return Element.getDimensions(element).width;
    },
    classNames: function (element) {
        return new Element.ClassNames(element);
    },
    hasClassName: function (element, className) {
        if (!(element = $(element))) return;
        var elementClassName = element.className;
        return (elementClassName.length > 0 && (elementClassName == className || new RegExp("(^|\\s)" + className + "(\\s|$)").test(elementClassName)));
    },
    addClassName: function (element, className) {
        if (!(element = $(element))) return;
        if (!Element.hasClassName(element, className)) element.className += (element.className ? ' ' : '') + className;
        return element;
    },
    removeClassName: function (element, className) {
        if (!(element = $(element))) return;
        element.className = element.className.replace(new RegExp("(^|\\s+)" + className + "(\\s+|$)"), ' ').strip();
        return element;
    },
    toggleClassName: function (element, className) {
        if (!(element = $(element))) return;
        return Element[Element.hasClassName(element, className) ? 'removeClassName' : 'addClassName'](element, className);
    },
    cleanWhitespace: function (element) {
        element = $(element);
        var node = element.firstChild;
        while (node) {
            var nextNode = node.nextSibling;
            if (node.nodeType == 3 && !/\S/.test(node.nodeValue)) element.removeChild(node);
            node = nextNode;
        }
        return element;
    },
    empty: function (element) {
        return $(element).innerHTML.blank();
    },
    descendantOf: function (element, ancestor) {
        element = $(element), ancestor = $(ancestor);
        if (element.compareDocumentPosition) return (element.compareDocumentPosition(ancestor) & 8) === 8;
        if (ancestor.contains) return ancestor.contains(element) && ancestor !== element;
        while (element = element.parentNode)
        if (element == ancestor) return true;
        return false;
    },
    scrollTo: function (element) {
        element = $(element);
        var pos = Element.cumulativeOffset(element);
        window.scrollTo(pos[0], pos[1]);
        return element;
    },
    getStyle: function (element, style) {
        element = $(element);
        style = style == 'float' ? 'cssFloat' : style.camelize();
        var value = element.style[style];
        if (!value || value == 'auto') {
            var css = document.defaultView.getComputedStyle(element, null);
            value = css ? css[style] : null;
        }
        if (style == 'opacity') return value ? parseFloat(value) : 1.0;
        return value == 'auto' ? null : value;
    },
    getOpacity: function (element) {
        return $(element).getStyle('opacity');
    },
    setStyle: function (element, styles) {
        element = $(element);
        var elementStyle = element.style,
            match;
        if (Object.isString(styles)) {
            element.style.cssText += ';' + styles;
            return styles.include('opacity') ? element.setOpacity(styles.match(/opacity:\s*(\d?\.?\d*)/)[1]) : element;
        }
        for (var property in styles)
        if (property == 'opacity') element.setOpacity(styles[property]);
        else elementStyle[(property == 'float' || property == 'cssFloat') ? (Object.isUndefined(elementStyle.styleFloat) ? 'cssFloat' : 'styleFloat') : property] = styles[property];
        return element;
    },
    setOpacity: function (element, value) {
        element = $(element);
        element.style.opacity = (value == 1 || value === '') ? '' : (value < 0.00001) ? 0 : value;
        return element;
    },
    makePositioned: function (element) {
        element = $(element);
        var pos = Element.getStyle(element, 'position');
        if (pos == 'static' || !pos) {
            element._madePositioned = true;
            element.style.position = 'relative';
            if (Prototype.Browser.Opera) {
                element.style.top = 0;
                element.style.left = 0;
            }
        }
        return element;
    },
    undoPositioned: function (element) {
        element = $(element);
        if (element._madePositioned) {
            element._madePositioned = undefined;
            element.style.position = element.style.top = element.style.left = element.style.bottom = element.style.right = '';
        }
        return element;
    },
    makeClipping: function (element) {
        element = $(element);
        if (element._overflow) return element;
        element._overflow = Element.getStyle(element, 'overflow') || 'auto';
        if (element._overflow !== 'hidden') element.style.overflow = 'hidden';
        return element;
    },
    undoClipping: function (element) {
        element = $(element);
        if (!element._overflow) return element;
        element.style.overflow = element._overflow == 'auto' ? '' : element._overflow;
        element._overflow = null;
        return element;
    },
    clonePosition: function (element, source) {
        var options = Object.extend({
            setLeft: true,
            setTop: true,
            setWidth: true,
            setHeight: true,
            offsetTop: 0,
            offsetLeft: 0
        }, arguments[2] || {});
        source = $(source);
        var p = Element.viewportOffset(source),
            delta = [0, 0],
            parent = null;
        element = $(element);
        if (Element.getStyle(element, 'position') == 'absolute') {
            parent = Element.getOffsetParent(element);
            delta = Element.viewportOffset(parent);
        }
        if (parent == document.body) {
            delta[0] -= document.body.offsetLeft;
            delta[1] -= document.body.offsetTop;
        }
        if (options.setLeft) element.style.left = (p[0] - delta[0] + options.offsetLeft) + 'px';
        if (options.setTop) element.style.top = (p[1] - delta[1] + options.offsetTop) + 'px';
        if (options.setWidth) element.style.width = source.offsetWidth + 'px';
        if (options.setHeight) element.style.height = source.offsetHeight + 'px';
        return element;
    }
};
Object.extend(Element.Methods, {
    getElementsBySelector: Element.Methods.select,
    childElements: Element.Methods.immediateDescendants
});
Element._attributeTranslations = {
    write: {
        names: {
            className: 'class',
            htmlFor: 'for'
        },
        values: {}
    }
};
if (Prototype.Browser.Opera) {
    Element.Methods.getStyle = Element.Methods.getStyle.wrap(function (proceed, element, style) {
        switch (style) {
            case 'height':
            case 'width':
                if (!Element.visible(element)) return null;
                var dim = parseInt(proceed(element, style), 10);
                if (dim !== element['offset' + style.capitalize()]) return dim + 'px';
                var properties;
                if (style === 'height') {
                    properties = ['border-top-width', 'padding-top', 'padding-bottom', 'border-bottom-width'];
                } else {
                    properties = ['border-left-width', 'padding-left', 'padding-right', 'border-right-width'];
                }
                return properties.inject(dim, function (memo, property) {
                    var val = proceed(element, property);
                    return val === null ? memo : memo - parseInt(val, 10);
                }) + 'px';
            default:
                return proceed(element, style);
        }
    });
    Element.Methods.readAttribute = Element.Methods.readAttribute.wrap(function (proceed, element, attribute) {
        if (attribute === 'title') return element.title;
        return proceed(element, attribute);
    });
} else if (Prototype.Browser.IE) {
    Element.Methods.getStyle = function (element, style) {
        element = $(element);
        style = (style == 'float' || style == 'cssFloat') ? 'styleFloat' : style.camelize();
        var value = element.style[style];
        if (!value && element.currentStyle) value = element.currentStyle[style];
        if (style == 'opacity') {
            if (value = (element.getStyle('filter') || '').match(/alpha\(opacity=(.*)\)/)) if (value[1]) return parseFloat(value[1]) / 100;
            return 1.0;
        }
        if (value == 'auto') {
            if ((style == 'width' || style == 'height') && (element.getStyle('display') != 'none')) return element['offset' + style.capitalize()] + 'px';
            return null;
        }
        return value;
    };
    Element.Methods.setOpacity = function (element, value) {
        function stripAlpha(filter) {
            return filter.replace(/alpha\([^\)]*\)/gi, '');
        }
        element = $(element);
        var currentStyle = element.currentStyle;
        if ((currentStyle && !currentStyle.hasLayout) || (!currentStyle && element.style.zoom == 'normal')) element.style.zoom = 1;
        var filter = element.getStyle('filter'),
            style = element.style;
        if (value == 1 || value === '') {
            (filter = stripAlpha(filter)) ? style.filter = filter : style.removeAttribute('filter');
            return element;
        } else if (value < 0.00001) value = 0;
        style.filter = stripAlpha(filter) + 'alpha(opacity=' + (value * 100) + ')';
        return element;
    };
    Element._attributeTranslations = (function () {
        var classProp = 'className',
            forProp = 'for',
            el = document.createElement('div');
        el.setAttribute(classProp, 'x');
        if (el.className !== 'x') {
            el.setAttribute('class', 'x');
            if (el.className === 'x') {
                classProp = 'class';
            }
        }
        el = null;
        el = document.createElement('label');
        el.setAttribute(forProp, 'x');
        if (el.htmlFor !== 'x') {
            el.setAttribute('htmlFor', 'x');
            if (el.htmlFor === 'x') {
                forProp = 'htmlFor';
            }
        }
        el = null;
        return {
            read: {
                names: {
                    'class': classProp,
                    'className': classProp,
                    'for': forProp,
                    'htmlFor': forProp
                },
                values: {
                    _getAttr: function (element, attribute) {
                        return element.getAttribute(attribute);
                    },
                    _getAttr2: function (element, attribute) {
                        return element.getAttribute(attribute, 2);
                    },
                    _getAttrNode: function (element, attribute) {
                        var node = element.getAttributeNode(attribute);
                        return node ? node.value : "";
                    },
                    _getEv: (function () {
                        var el = document.createElement('div'),
                            f;
                        el.onclick = Prototype.emptyFunction;
                        var value = el.getAttribute('onclick');
                        if (String(value).indexOf('{') > -1) {
                            f = function (element, attribute) {
                                attribute = element.getAttribute(attribute);
                                if (!attribute) return null;
                                attribute = attribute.toString();
                                attribute = attribute.split('{')[1];
                                attribute = attribute.split('}')[0];
                                return attribute.strip();
                            };
                        } else if (value === '') {
                            f = function (element, attribute) {
                                attribute = element.getAttribute(attribute);
                                if (!attribute) return null;
                                return attribute.strip();
                            };
                        }
                        el = null;
                        return f;
                    })(),
                    _flag: function (element, attribute) {
                        return $(element).hasAttribute(attribute) ? attribute : null;
                    },
                    style: function (element) {
                        return element.style.cssText.toLowerCase();
                    },
                    title: function (element) {
                        return element.title;
                    }
                }
            }
        }
    })();
    Element._attributeTranslations.write = {
        names: Object.extend({
            cellpadding: 'cellPadding',
            cellspacing: 'cellSpacing'
        }, Element._attributeTranslations.read.names),
        values: {
            checked: function (element, value) {
                element.checked = !! value;
            },
            style: function (element, value) {
                element.style.cssText = value ? value : '';
            }
        }
    };
    Element._attributeTranslations.has = {};
    $w('colSpan rowSpan vAlign dateTime accessKey tabIndex ' + 'encType maxLength readOnly longDesc frameBorder').each(function (attr) {
        Element._attributeTranslations.write.names[attr.toLowerCase()] = attr;
        Element._attributeTranslations.has[attr.toLowerCase()] = attr;
    });
    (function (v) {
        Object.extend(v, {
            href: v._getAttr2,
            src: v._getAttr2,
            type: v._getAttr,
            action: v._getAttrNode,
            disabled: v._flag,
            checked: v._flag,
            readonly: v._flag,
            multiple: v._flag,
            onload: v._getEv,
            onunload: v._getEv,
            onclick: v._getEv,
            ondblclick: v._getEv,
            onmousedown: v._getEv,
            onmouseup: v._getEv,
            onmouseover: v._getEv,
            onmousemove: v._getEv,
            onmouseout: v._getEv,
            onfocus: v._getEv,
            onblur: v._getEv,
            onkeypress: v._getEv,
            onkeydown: v._getEv,
            onkeyup: v._getEv,
            onsubmit: v._getEv,
            onreset: v._getEv,
            onselect: v._getEv,
            onchange: v._getEv
        });
    })(Element._attributeTranslations.read.values);
    if (Prototype.BrowserFeatures.ElementExtensions) {
        (function () {
            function _descendants(element) {
                var nodes = element.getElementsByTagName('*'),
                    results = [];
                for (var i = 0, node; node = nodes[i]; i++)
                if (node.tagName !== "!") results.push(node);
                return results;
            }
            Element.Methods.down = function (element, expression, index) {
                element = $(element);
                if (arguments.length == 1) return element.firstDescendant();
                return Object.isNumber(expression) ? _descendants(element)[expression] : Element.select(element, expression)[index || 0];
            }
        })();
    }
} else if (Prototype.Browser.Gecko && /rv:1\.8\.0/.test(navigator.userAgent)) {
    Element.Methods.setOpacity = function (element, value) {
        element = $(element);
        element.style.opacity = (value == 1) ? 0.999999 : (value === '') ? '' : (value < 0.00001) ? 0 : value;
        return element;
    };
} else if (Prototype.Browser.WebKit) {
    Element.Methods.setOpacity = function (element, value) {
        element = $(element);
        element.style.opacity = (value == 1 || value === '') ? '' : (value < 0.00001) ? 0 : value;
        if (value == 1) if (element.tagName.toUpperCase() == 'IMG' && element.width) {
            element.width++;
            element.width--;
        } else try {
            var n = document.createTextNode(' ');
            element.appendChild(n);
            element.removeChild(n);
        } catch (e) {}
        return element;
    };
}
if ('outerHTML' in document.documentElement) {
    Element.Methods.replace = function (element, content) {
        element = $(element);
        if (content && content.toElement) content = content.toElement();
        if (Object.isElement(content)) {
            element.parentNode.replaceChild(content, element);
            return element;
        }
        content = Object.toHTML(content);
        var parent = element.parentNode,
            tagName = parent.tagName.toUpperCase();
        if (Element._insertionTranslations.tags[tagName]) {
            var nextSibling = element.next(),
                fragments = Element._getContentFromAnonymousElement(tagName, content.stripScripts());
            parent.removeChild(element);
            if (nextSibling) fragments.each(function (node) {
                parent.insertBefore(node, nextSibling)
            });
            else fragments.each(function (node) {
                parent.appendChild(node)
            });
        } else element.outerHTML = content.stripScripts();
        content.evalScripts.bind(content).p_defer();
        return element;
    };
}
Element._returnOffset = function (l, t) {
    var result = [l, t];
    result.left = l;
    result.top = t;
    return result;
};
Element._getContentFromAnonymousElement = function (tagName, html, force) {
    var div = new Element('div'),
        t = Element._insertionTranslations.tags[tagName];
    var workaround = false;
    if (t) workaround = true;
    else if (force) {
        workaround = true;
        t = ['', '', 0];
    }
    if (workaround) {
        div.innerHTML = '&nbsp;' + t[0] + html + t[1];
        div.removeChild(div.firstChild);
        for (var i = t[2]; i--;) {
            div = div.firstChild;
        }
    } else {
        div.innerHTML = html;
    }
    return $A(div.childNodes);
};
Element._insertionTranslations = {
    before: function (element, node) {
        element.parentNode.insertBefore(node, element);
    },
    top: function (element, node) {
        element.insertBefore(node, element.firstChild);
    },
    bottom: function (element, node) {
        element.appendChild(node);
    },
    after: function (element, node) {
        element.parentNode.insertBefore(node, element.nextSibling);
    },
    tags: {
        TABLE: ['<table>', '</table>', 1],
        TBODY: ['<table><tbody>', '</tbody></table>', 2],
        TR: ['<table><tbody><tr>', '</tr></tbody></table>', 3],
        TD: ['<table><tbody><tr><td>', '</td></tr></tbody></table>', 4],
        SELECT: ['<select>', '</select>', 1]
    }
};
(function () {
    var tags = Element._insertionTranslations.tags;
    Object.extend(tags, {
        THEAD: tags.TBODY,
        TFOOT: tags.TBODY,
        TH: tags.TD
    });
})();
Element.Methods.Simulated = {
    hasAttribute: function (element, attribute) {
        attribute = Element._attributeTranslations.has[attribute] || attribute;
        var node = $(element).getAttributeNode(attribute);
        return !!(node && node.specified);
    }
};
Element.Methods.ByTag = {};
Object.extend(Element, Element.Methods);
(function (div) {
    if (!Prototype.BrowserFeatures.ElementExtensions && div['__proto__']) {
        window.HTMLElement = {};
        window.HTMLElement.prototype = div['__proto__'];
        Prototype.BrowserFeatures.ElementExtensions = true;
    }
    div = null;
})(document.createElement('div'));
Element.extend = (function () {
    function checkDeficiency(tagName) {
        if (typeof window.Element != 'undefined') {
            var proto = window.Element.prototype;
            if (proto) {
                var id = '_' + (Math.random() + '').slice(2),
                    el = document.createElement(tagName);
                proto[id] = 'x';
                var isBuggy = (el[id] !== 'x');
                delete proto[id];
                el = null;
                return isBuggy;
            }
        }
        return false;
    }

    function extendElementWith(element, methods) {
        for (var property in methods) {
            var value = methods[property];
            if (Object.isFunction(value) && !(property in element)) element[property] = value.methodize();
        }
    }
    var HTMLOBJECTELEMENT_PROTOTYPE_BUGGY = checkDeficiency('object');
    if (Prototype.BrowserFeatures.SpecificElementExtensions) {
        if (HTMLOBJECTELEMENT_PROTOTYPE_BUGGY) {
            return function (element) {
                if (element && typeof element._extendedByPrototype == 'undefined') {
                    var t = element.tagName;
                    if (t && (/^(?:object|applet|embed)$/i.test(t))) {
                        extendElementWith(element, Element.Methods);
                        extendElementWith(element, Element.Methods.Simulated);
                        extendElementWith(element, Element.Methods.ByTag[t.toUpperCase()]);
                    }
                }
                return element;
            }
        }
        return Prototype.K;
    }
    var Methods = {}, ByTag = Element.Methods.ByTag;
    var extend = Object.extend(function (element) {
        if (!element || typeof element._extendedByPrototype != 'undefined' || element.nodeType != 1 || element == window) return element;
        var methods = Object.clone(Methods),
            tagName = element.tagName.toUpperCase();
        if (ByTag[tagName]) Object.extend(methods, ByTag[tagName]);
        extendElementWith(element, methods);
        element._extendedByPrototype = Prototype.emptyFunction;
        return element;
    }, {
        refresh: function () {
            if (!Prototype.BrowserFeatures.ElementExtensions) {
                Object.extend(Methods, Element.Methods);
                Object.extend(Methods, Element.Methods.Simulated);
            }
        }
    });
    extend.refresh();
    return extend;
})();
if (document.documentElement.hasAttribute) {
    Element.hasAttribute = function (element, attribute) {
        return element.hasAttribute(attribute);
    };
} else {
    Element.hasAttribute = Element.Methods.Simulated.hasAttribute;
}
Element.addMethods = function (methods) {
    var F = Prototype.BrowserFeatures,
        T = Element.Methods.ByTag;
    if (!methods) {
        Object.extend(Form, Form.Methods);
        Object.extend(Form.Element, Form.Element.Methods);
        Object.extend(Element.Methods.ByTag, {
            "FORM": Object.clone(Form.Methods),
            "INPUT": Object.clone(Form.Element.Methods),
            "SELECT": Object.clone(Form.Element.Methods),
            "TEXTAREA": Object.clone(Form.Element.Methods),
            "BUTTON": Object.clone(Form.Element.Methods)
        });
    }
    if (arguments.length == 2) {
        var tagName = methods;
        methods = arguments[1];
    }
    if (!tagName) Object.extend(Element.Methods, methods || {});
    else {
        if (Object.isArray(tagName)) tagName.each(extend);
        else extend(tagName);
    }

    function extend(tagName) {
        tagName = tagName.toUpperCase();
        if (!Element.Methods.ByTag[tagName]) Element.Methods.ByTag[tagName] = {};
        Object.extend(Element.Methods.ByTag[tagName], methods);
    }

    function copy(methods, destination, onlyIfAbsent) {
        onlyIfAbsent = onlyIfAbsent || false;
        for (var property in methods) {
            var value = methods[property];
            if (!Object.isFunction(value)) continue;
            if (!onlyIfAbsent || !(property in destination)) destination[property] = value.methodize();
        }
    }

    function findDOMClass(tagName) {
        var klass;
        var trans = {
            "OPTGROUP": "OptGroup",
            "TEXTAREA": "TextArea",
            "P": "Paragraph",
            "FIELDSET": "FieldSet",
            "UL": "UList",
            "OL": "OList",
            "DL": "DList",
            "DIR": "Directory",
            "H1": "Heading",
            "H2": "Heading",
            "H3": "Heading",
            "H4": "Heading",
            "H5": "Heading",
            "H6": "Heading",
            "Q": "Quote",
            "INS": "Mod",
            "DEL": "Mod",
            "A": "Anchor",
            "IMG": "Image",
            "CAPTION": "TableCaption",
            "COL": "TableCol",
            "COLGROUP": "TableCol",
            "THEAD": "TableSection",
            "TFOOT": "TableSection",
            "TBODY": "TableSection",
            "TR": "TableRow",
            "TH": "TableCell",
            "TD": "TableCell",
            "FRAMESET": "FrameSet",
            "IFRAME": "IFrame"
        };
        if (trans[tagName]) klass = 'HTML' + trans[tagName] + 'Element';
        if (window[klass]) return window[klass];
        klass = 'HTML' + tagName + 'Element';
        if (window[klass]) return window[klass];
        klass = 'HTML' + tagName.capitalize() + 'Element';
        if (window[klass]) return window[klass];
        var element = document.createElement(tagName),
            proto = element['__proto__'] || element.constructor.prototype;
        element = null;
        return proto;
    }
    var elementPrototype = window.HTMLElement ? HTMLElement.prototype : Element.prototype;
    if (F.ElementExtensions) {
        copy(Element.Methods, elementPrototype);
        copy(Element.Methods.Simulated, elementPrototype, true);
    }
    if (F.SpecificElementExtensions) {
        for (var tag in Element.Methods.ByTag) {
            var klass = findDOMClass(tag);
            if (Object.isUndefined(klass)) continue;
            copy(T[tag], klass.prototype);
        }
    }
    Object.extend(Element, Element.Methods);
    delete Element.ByTag;
    if (Element.extend.refresh) Element.extend.refresh();
    Element.cache = {};
};
document.viewport = {
    getDimensions: function () {
        return {
            width: this.getWidth(),
            height: this.getHeight()
        };
    },
    getScrollOffsets: function () {
        return Element._returnOffset(window.pageXOffset || document.documentElement.scrollLeft || document.body.scrollLeft, window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop);
    }
};
(function (viewport) {
    var B = Prototype.Browser,
        doc = document,
        element, property = {};

    function getRootElement() {
        if (B.WebKit && !doc.evaluate) return document;
        if (B.Opera && window.parseFloat(window.opera.version()) < 9.5) return document.body;
        return document.documentElement;
    }

    function define(D) {
        if (!element) element = getRootElement();
        property[D] = 'client' + D;
        viewport['get' + D] = function () {
            return element[property[D]]
        };
        return viewport['get' + D]();
    }
    viewport.getWidth = define.curry('Width');
    viewport.getHeight = define.curry('Height');
})(document.viewport);
Element.Storage = {
    UID: 1
};
Element.addMethods({
    getStorage: function (element) {
        if (!(element = $(element))) return;
        var uid;
        if (element === window) {
            uid = 0;
        } else {
            if (typeof element._prototypeUID === "undefined") element._prototypeUID = Element.Storage.UID++;
            uid = element._prototypeUID;
        }
        if (!Element.Storage[uid]) Element.Storage[uid] = $H();
        return Element.Storage[uid];
    },
    store: function (element, key, value) {
        if (!(element = $(element))) return;
        if (arguments.length === 2) {
            Element.getStorage(element).update(key);
        } else {
            Element.getStorage(element).set(key, value);
        }
        return element;
    },
    retrieve: function (element, key, defaultValue) {
        if (!(element = $(element))) return;
        var hash = Element.getStorage(element),
            value = hash.get(key);
        if (Object.isUndefined(value)) {
            hash.set(key, defaultValue);
            value = defaultValue;
        }
        return value;
    },
    clone: function (element, deep) {
        if (!(element = $(element))) return;
        var clone = element.cloneNode(deep);
        clone._prototypeUID = void 0;
        if (deep) {
            var descendants = Element.select(clone, '*'),
                i = descendants.length;
            while (i--) {
                descendants[i]._prototypeUID = void 0;
            }
        }
        return Element.extend(clone);
    },
    purge: function (element) {
        if (!(element = $(element))) return;
        var purgeElement = Element._purgeElement;
        purgeElement(element);
        var descendants = element.getElementsByTagName('*'),
            i = descendants.length;
        while (i--) purgeElement(descendants[i]);
        return null;
    }
});
(function () {
    function toDecimal(pctString) {
        var match = pctString.match(/^(\d+)%?$/i);
        if (!match) return null;
        return (Number(match[1]) / 100);
    }

    function getPixelValue(value, property, context) {
        var element = null;
        if (Object.isElement(value)) {
            element = value;
            value = element.getStyle(property);
        }
        if (value === null) {
            return null;
        }
        if ((/^(?:-)?\d+(\.\d+)?(px)?$/i).test(value)) {
            return window.parseFloat(value);
        }
        var isPercentage = value.include('%'),
            isViewport = (context === document.viewport);
        if (/\d/.test(value) && element && element.runtimeStyle && !(isPercentage && isViewport)) {
            var style = element.style.left,
                rStyle = element.runtimeStyle.left;
            element.runtimeStyle.left = element.currentStyle.left;
            element.style.left = value || 0;
            value = element.style.pixelLeft;
            element.style.left = style;
            element.runtimeStyle.left = rStyle;
            return value;
        }
        if (element && isPercentage) {
            context = context || element.parentNode;
            var decimal = toDecimal(value);
            var whole = null;
            var position = element.getStyle('position');
            var isHorizontal = property.include('left') || property.include('right') || property.include('width');
            var isVertical = property.include('top') || property.include('bottom') || property.include('height');
            if (context === document.viewport) {
                if (isHorizontal) {
                    whole = document.viewport.getWidth();
                } else if (isVertical) {
                    whole = document.viewport.getHeight();
                }
            } else {
                if (isHorizontal) {
                    whole = $(context).measure('width');
                } else if (isVertical) {
                    whole = $(context).measure('height');
                }
            }
            return (whole === null) ? 0 : whole * decimal;
        }
        return 0;
    }

    function toCSSPixels(number) {
        if (Object.isString(number) && number.endsWith('px')) {
            return number;
        }
        return number + 'px';
    }

    function isDisplayed(element) {
        var originalElement = element;
        while (element && element.parentNode) {
            var display = element.getStyle('display');
            if (display === 'none') {
                return false;
            }
            element = $(element.parentNode);
        }
        return true;
    }
    var hasLayout = Prototype.K;
    if ('currentStyle' in document.documentElement) {
        hasLayout = function (element) {
            if (!element.currentStyle.hasLayout) {
                element.style.zoom = 1;
            }
            return element;
        };
    }

    function cssNameFor(key) {
        if (key.include('border')) key = key + '-width';
        return key.camelize();
    }
    Element.Layout = Class.create(Hash, {
        initialize: function ($super, element, preCompute) {
            $super();
            this.element = $(element);
            Element.Layout.PROPERTIES.each(function (property) {
                this._set(property, null);
            }, this);
            if (preCompute) {
                this._preComputing = true;
                this._begin();
                Element.Layout.PROPERTIES.each(this._compute, this);
                this._end();
                this._preComputing = false;
            }
        },
        _set: function (property, value) {
            return Hash.prototype.set.call(this, property, value);
        },
        set: function (property, value) {
            throw "Properties of Element.Layout are read-only.";
        },
        get: function ($super, property) {
            var value = $super(property);
            return value === null ? this._compute(property) : value;
        },
        _begin: function () {
            if (this._prepared) return;
            var element = this.element;
            if (isDisplayed(element)) {
                this._prepared = true;
                return;
            }
            var originalStyles = {
                position: element.style.position || '',
                width: element.style.width || '',
                visibility: element.style.visibility || '',
                display: element.style.display || ''
            };
            element.store('prototype_original_styles', originalStyles);
            var position = element.getStyle('position'),
                width = element.getStyle('width');
            if (width === "0px" || width === null) {
                element.style.display = 'block';
                width = element.getStyle('width');
            }
            var context = (position === 'fixed') ? document.viewport : element.parentNode;
            element.setStyle({
                position: 'absolute',
                visibility: 'hidden',
                display: 'block'
            });
            var positionedWidth = element.getStyle('width');
            var newWidth;
            if (width && (positionedWidth === width)) {
                newWidth = getPixelValue(element, 'width', context);
            } else if (position === 'absolute' || position === 'fixed') {
                newWidth = getPixelValue(element, 'width', context);
            } else {
                var parent = element.parentNode,
                    pLayout = $(parent).getLayout();
                newWidth = pLayout.get('width') - this.get('margin-left') - this.get('border-left') - this.get('padding-left') - this.get('padding-right') - this.get('border-right') - this.get('margin-right');
            }
            element.setStyle({
                width: newWidth + 'px'
            });
            this._prepared = true;
        },
        _end: function () {
            var element = this.element;
            var originalStyles = element.retrieve('prototype_original_styles');
            element.store('prototype_original_styles', null);
            element.setStyle(originalStyles);
            this._prepared = false;
        },
        _compute: function (property) {
            var COMPUTATIONS = Element.Layout.COMPUTATIONS;
            if (!(property in COMPUTATIONS)) {
                throw "Property not found.";
            }
            return this._set(property, COMPUTATIONS[property].call(this, this.element));
        },
        toObject: function () {
            var args = $A(arguments);
            var keys = (args.length === 0) ? Element.Layout.PROPERTIES : args.join(' ').split(' ');
            var obj = {};
            keys.each(function (key) {
                if (!Element.Layout.PROPERTIES.include(key)) return;
                var value = this.get(key);
                if (value != null) obj[key] = value;
            }, this);
            return obj;
        },
        toHash: function () {
            var obj = this.toObject.apply(this, arguments);
            return new Hash(obj);
        },
        toCSS: function () {
            var args = $A(arguments);
            var keys = (args.length === 0) ? Element.Layout.PROPERTIES : args.join(' ').split(' ');
            var css = {};
            keys.each(function (key) {
                if (!Element.Layout.PROPERTIES.include(key)) return;
                if (Element.Layout.COMPOSITE_PROPERTIES.include(key)) return;
                var value = this.get(key);
                if (value != null) css[cssNameFor(key)] = value + 'px';
            }, this);
            return css;
        },
        inspect: function () {
            return "#<Element.Layout>";
        }
    });
    Object.extend(Element.Layout, {
        PROPERTIES: $w('height width top left right bottom border-left border-right border-top border-bottom padding-left padding-right padding-top padding-bottom margin-top margin-bottom margin-left margin-right padding-box-width padding-box-height border-box-width border-box-height margin-box-width margin-box-height cumulative-left cumulative-top'),
        COMPOSITE_PROPERTIES: $w('padding-box-width padding-box-height margin-box-width margin-box-height border-box-width border-box-height'),
        COMPUTATIONS: {
            'height': function (element) {
                if (!this._preComputing) this._begin();
                var bHeight = this.get('border-box-height');
                if (bHeight <= 0) {
                    if (!this._preComputing) this._end();
                    return 0;
                }
                var bTop = this.get('border-top'),
                    bBottom = this.get('border-bottom');
                var pTop = this.get('padding-top'),
                    pBottom = this.get('padding-bottom');
                if (!this._preComputing) this._end();
                return bHeight - bTop - bBottom - pTop - pBottom;
            },
            'width': function (element) {
                if (!this._preComputing) this._begin();
                var bWidth = this.get('border-box-width');
                if (bWidth <= 0) {
                    if (!this._preComputing) this._end();
                    return 0;
                }
                var bLeft = this.get('border-left'),
                    bRight = this.get('border-right');
                var pLeft = this.get('padding-left'),
                    pRight = this.get('padding-right');
                if (!this._preComputing) this._end();
                return bWidth - bLeft - bRight - pLeft - pRight;
            },
            'padding-box-height': function (element) {
                var height = this.get('height'),
                    pTop = this.get('padding-top'),
                    pBottom = this.get('padding-bottom');
                return height + pTop + pBottom;
            },
            'padding-box-width': function (element) {
                var width = this.get('width'),
                    pLeft = this.get('padding-left'),
                    pRight = this.get('padding-right');
                return width + pLeft + pRight;
            },
            'border-box-height': function (element) {
                if (!this._preComputing) this._begin();
                var height = element.offsetHeight;
                if (!this._preComputing) this._end();
                return height;
            },
            'cumulative-left': function (element) {
                return element.cumulativeOffset().left;
            },
            'cumulative-top': function (element) {
                return element.cumulativeOffset().top;
            },
            'border-box-width': function (element) {
                if (!this._preComputing) this._begin();
                var width = element.offsetWidth;
                if (!this._preComputing) this._end();
                return width;
            },
            'margin-box-height': function (element) {
                var bHeight = this.get('border-box-height'),
                    mTop = this.get('margin-top'),
                    mBottom = this.get('margin-bottom');
                if (bHeight <= 0) return 0;
                return bHeight + mTop + mBottom;
            },
            'margin-box-width': function (element) {
                var bWidth = this.get('border-box-width'),
                    mLeft = this.get('margin-left'),
                    mRight = this.get('margin-right');
                if (bWidth <= 0) return 0;
                return bWidth + mLeft + mRight;
            },
            'top': function (element) {
                var offset = element.positionedOffset();
                return offset.top;
            },
            'bottom': function (element) {
                var offset = element.positionedOffset(),
                    parent = element.getOffsetParent(),
                    pHeight = parent.measure('height');
                var mHeight = this.get('border-box-height');
                return pHeight - mHeight - offset.top;
            },
            'left': function (element) {
                var offset = element.positionedOffset();
                return offset.left;
            },
            'right': function (element) {
                var offset = element.positionedOffset(),
                    parent = element.getOffsetParent(),
                    pWidth = parent.measure('width');
                var mWidth = this.get('border-box-width');
                return pWidth - mWidth - offset.left;
            },
            'padding-top': function (element) {
                return getPixelValue(element, 'paddingTop');
            },
            'padding-bottom': function (element) {
                return getPixelValue(element, 'paddingBottom');
            },
            'padding-left': function (element) {
                return getPixelValue(element, 'paddingLeft');
            },
            'padding-right': function (element) {
                return getPixelValue(element, 'paddingRight');
            },
            'border-top': function (element) {
                return getPixelValue(element, 'borderTopWidth');
            },
            'border-bottom': function (element) {
                return getPixelValue(element, 'borderBottomWidth');
            },
            'border-left': function (element) {
                return getPixelValue(element, 'borderLeftWidth');
            },
            'border-right': function (element) {
                return getPixelValue(element, 'borderRightWidth');
            },
            'margin-top': function (element) {
                return getPixelValue(element, 'marginTop');
            },
            'margin-bottom': function (element) {
                return getPixelValue(element, 'marginBottom');
            },
            'margin-left': function (element) {
                return getPixelValue(element, 'marginLeft');
            },
            'margin-right': function (element) {
                return getPixelValue(element, 'marginRight');
            }
        }
    });
    if ('getBoundingClientRect' in document.documentElement) {
        Object.extend(Element.Layout.COMPUTATIONS, {
            'right': function (element) {
                var parent = hasLayout(element.getOffsetParent());
                var rect = element.getBoundingClientRect(),
                    pRect = parent.getBoundingClientRect();
                return (pRect.right - rect.right).round();
            },
            'bottom': function (element) {
                var parent = hasLayout(element.getOffsetParent());
                var rect = element.getBoundingClientRect(),
                    pRect = parent.getBoundingClientRect();
                return (pRect.bottom - rect.bottom).round();
            }
        });
    }
    Element.Offset = Class.create({
        initialize: function (left, top) {
            this.left = left.round();
            this.top = top.round();
            this[0] = this.left;
            this[1] = this.top;
        },
        relativeTo: function (offset) {
            return new Element.Offset(this.left - offset.left, this.top - offset.top);
        },
        inspect: function () {
            return "#<Element.Offset left: #{left} top: #{top}>".interpolate(this);
        },
        toString: function () {
            return "[#{left}, #{top}]".interpolate(this);
        },
        toArray: function () {
            return [this.left, this.top];
        }
    });

    function getLayout(element, preCompute) {
        return new Element.Layout(element, preCompute);
    }

    function measure(element, property) {
        return $(element).getLayout().get(property);
    }

    function getDimensions(element) {
        element = $(element);
        var display = Element.getStyle(element, 'display');
        if (display && display !== 'none') {
            return {
                width: element.offsetWidth,
                height: element.offsetHeight
            };
        }
        var style = element.style;
        var originalStyles = {
            visibility: style.visibility,
            position: style.position,
            display: style.display
        };
        var newStyles = {
            visibility: 'hidden',
            display: 'block'
        };
        if (originalStyles.position !== 'fixed') newStyles.position = 'absolute';
        Element.setStyle(element, newStyles);
        var dimensions = {
            width: element.offsetWidth,
            height: element.offsetHeight
        };
        Element.setStyle(element, originalStyles);
        return dimensions;
    }

    function getOffsetParent(element) {
        element = $(element);
        if (isDocument(element) || isDetached(element) || isBody(element) || isHtml(element)) return $(document.body);
        var isInline = (Element.getStyle(element, 'display') === 'inline');
        if (!isInline && element.offsetParent) return $(element.offsetParent);
        while ((element = element.parentNode) && element !== document.body) {
            if (Element.getStyle(element, 'position') !== 'static') {
                return isHtml(element) ? $(document.body) : $(element);
            }
        }
        return $(document.body);
    }

    function cumulativeOffset(element) {
        element = $(element);
        var valueT = 0,
            valueL = 0;
        if (element.parentNode) {
            do {
                valueT += element.offsetTop || 0;
                valueL += element.offsetLeft || 0;
                element = element.offsetParent;
            } while (element);
        }
        return new Element.Offset(valueL, valueT);
    }

    function positionedOffset(element) {
        element = $(element);
        var layout = element.getLayout();
        var valueT = 0,
            valueL = 0;
        do {
            valueT += element.offsetTop || 0;
            valueL += element.offsetLeft || 0;
            element = element.offsetParent;
            if (element) {
                if (isBody(element)) break;
                var p = Element.getStyle(element, 'position');
                if (p !== 'static') break;
            }
        } while (element);
        valueL -= layout.get('margin-top');
        valueT -= layout.get('margin-left');
        return new Element.Offset(valueL, valueT);
    }

    function cumulativeScrollOffset(element) {
        var valueT = 0,
            valueL = 0;
        do {
            valueT += element.scrollTop || 0;
            valueL += element.scrollLeft || 0;
            element = element.parentNode;
        } while (element);
        return new Element.Offset(valueL, valueT);
    }

    function viewportOffset(forElement) {
        element = $(element);
        var valueT = 0,
            valueL = 0,
            docBody = document.body;
        var element = forElement;
        do {
            valueT += element.offsetTop || 0;
            valueL += element.offsetLeft || 0;
            if (element.offsetParent == docBody && Element.getStyle(element, 'position') == 'absolute') break;
        } while (element = element.offsetParent);
        element = forElement;
        do {
            if (element != docBody) {
                valueT -= element.scrollTop || 0;
                valueL -= element.scrollLeft || 0;
            }
        } while (element = element.parentNode);
        return new Element.Offset(valueL, valueT);
    }

    function absolutize(element) {
        element = $(element);
        if (Element.getStyle(element, 'position') === 'absolute') {
            return element;
        }
        var offsetParent = getOffsetParent(element);
        var eOffset = element.viewportOffset(),
            pOffset = offsetParent.viewportOffset();
        var offset = eOffset.relativeTo(pOffset);
        var layout = element.getLayout();
        element.store('prototype_absolutize_original_styles', {
            left: element.getStyle('left'),
            top: element.getStyle('top'),
            width: element.getStyle('width'),
            height: element.getStyle('height')
        });
        element.setStyle({
            position: 'absolute',
            top: offset.top + 'px',
            left: offset.left + 'px',
            width: layout.get('width') + 'px',
            height: layout.get('height') + 'px'
        });
        return element;
    }

    function relativize(element) {
        element = $(element);
        if (Element.getStyle(element, 'position') === 'relative') {
            return element;
        }
        var originalStyles = element.retrieve('prototype_absolutize_original_styles');
        if (originalStyles) element.setStyle(originalStyles);
        return element;
    }
    if (Prototype.Browser.IE) {
        getOffsetParent = getOffsetParent.wrap(function (proceed, element) {
            element = $(element);
            if (isDocument(element) || isDetached(element) || isBody(element) || isHtml(element)) return $(document.body);
            var position = element.getStyle('position');
            if (position !== 'static') return proceed(element);
            element.setStyle({
                position: 'relative'
            });
            var value = proceed(element);
            element.setStyle({
                position: position
            });
            return value;
        });
        positionedOffset = positionedOffset.wrap(function (proceed, element) {
            element = $(element);
            if (!element.parentNode) return new Element.Offset(0, 0);
            var position = element.getStyle('position');
            if (position !== 'static') return proceed(element);
            var offsetParent = element.getOffsetParent();
            if (offsetParent && offsetParent.getStyle('position') === 'fixed') hasLayout(offsetParent);
            element.setStyle({
                position: 'relative'
            });
            var value = proceed(element);
            element.setStyle({
                position: position
            });
            return value;
        });
    } else if (Prototype.Browser.Webkit) {
        cumulativeOffset = function (element) {
            element = $(element);
            var valueT = 0,
                valueL = 0;
            do {
                valueT += element.offsetTop || 0;
                valueL += element.offsetLeft || 0;
                if (element.offsetParent == document.body) if (Element.getStyle(element, 'position') == 'absolute') break;
                element = element.offsetParent;
            } while (element);
            return new Element.Offset(valueL, valueT);
        };
    }
    Element.addMethods({
        getLayout: getLayout,
        measure: measure,
        getDimensions: getDimensions,
        getOffsetParent: getOffsetParent,
        cumulativeOffset: cumulativeOffset,
        positionedOffset: positionedOffset,
        cumulativeScrollOffset: cumulativeScrollOffset,
        viewportOffset: viewportOffset,
        absolutize: absolutize,
        relativize: relativize
    });

    function isBody(element) {
        return element.nodeName.toUpperCase() === 'BODY';
    }

    function isHtml(element) {
        return element.nodeName.toUpperCase() === 'HTML';
    }

    function isDocument(element) {
        return element.nodeType === Node.DOCUMENT_NODE;
    }

    function isDetached(element) {
        return element !== document.body && !Element.descendantOf(element, document.body);
    }
    if ('getBoundingClientRect' in document.documentElement) {
        Element.addMethods({
            viewportOffset: function (element) {
                element = $(element);
                if (isDetached(element)) return new Element.Offset(0, 0);
                var rect = element.getBoundingClientRect(),
                    docEl = document.documentElement;
                return new Element.Offset(rect.left - docEl.clientLeft, rect.top - docEl.clientTop);
            }
        });
    }
})();
window.$$ = function () {
    var expression = $A(arguments).join(', ');
    return Prototype.Selector.select(expression, document);
};
Prototype.Selector = (function () {
    function select() {
        throw new Error('Method "Prototype.Selector.select" must be defined.');
    }

    function match() {
        throw new Error('Method "Prototype.Selector.match" must be defined.');
    }

    function find(elements, expression, index) {
        index = index || 0;
        var match = Prototype.Selector.match,
            length = elements.length,
            matchIndex = 0,
            i;
        for (i = 0; i < length; i++) {
            if (match(elements[i], expression) && index == matchIndex++) {
                return Element.extend(elements[i]);
            }
        }
    }

    function extendElements(elements) {
        for (var i = 0, length = elements.length; i < length; i++) {
            Element.extend(elements[i]);
        }
        return elements;
    }
    var K = Prototype.K;
    return {
        select: select,
        match: match,
        find: find,
        extendElements: (Element.extend === K) ? K : extendElements,
        extendElement: Element.extend
    };
})();
Prototype._original_property = window.Sizzle;
/*
 * Sizzle CSS Selector Engine - v1.0
 *  Copyright 2009, The Dojo Foundation
 *  Released under the MIT, BSD, and GPL Licenses.
 *  More information: http://sizzlejs.com/
 */ (function () {
    var chunker = /((?:\((?:\([^()]+\)|[^()]+)+\)|\[(?:\[[^[\]]*\]|['"][^'"]*['"]|[^[\]'"]+)+\]|\\.|[^ >+~,(\[\\]+)+|[>+~])(\s*,\s*)?((?:.|\r|\n)*)/g,
        done = 0,
        toString = Object.prototype.toString,
        hasDuplicate = false,
        baseHasDuplicate = true;
    [0, 0].sort(function () {
        baseHasDuplicate = false;
        return 0;
    });
    var Sizzle = function (selector, context, results, seed) {
        results = results || [];
        var origContext = context = context || document;
        if (context.nodeType !== 1 && context.nodeType !== 9) {
            return [];
        }
        if (!selector || typeof selector !== "string") {
            return results;
        }
        var parts = [],
            m, set, checkSet, check, mode, extra, prune = true,
            contextXML = isXML(context),
            soFar = selector;
        while ((chunker.exec(""), m = chunker.exec(soFar)) !== null) {
            soFar = m[3];
            parts.push(m[1]);
            if (m[2]) {
                extra = m[3];
                break;
            }
        }
        if (parts.length > 1 && origPOS.exec(selector)) {
            if (parts.length === 2 && Expr.relative[parts[0]]) {
                set = posProcess(parts[0] + parts[1], context);
            } else {
                set = Expr.relative[parts[0]] ? [context] : Sizzle(parts.shift(), context);
                while (parts.length) {
                    selector = parts.shift();
                    if (Expr.relative[selector]) selector += parts.shift();
                    set = posProcess(selector, set);
                }
            }
        } else {
            if (!seed && parts.length > 1 && context.nodeType === 9 && !contextXML && Expr.match.ID.test(parts[0]) && !Expr.match.ID.test(parts[parts.length - 1])) {
                var ret = Sizzle.find(parts.shift(), context, contextXML);
                context = ret.expr ? Sizzle.filter(ret.expr, ret.set)[0] : ret.set[0];
            }
            if (context) {
                var ret = seed ? {
                    expr: parts.pop(),
                    set: makeArray(seed)
                } : Sizzle.find(parts.pop(), parts.length === 1 && (parts[0] === "~" || parts[0] === "+") && context.parentNode ? context.parentNode : context, contextXML);
                set = ret.expr ? Sizzle.filter(ret.expr, ret.set) : ret.set;
                if (parts.length > 0) {
                    checkSet = makeArray(set);
                } else {
                    prune = false;
                }
                while (parts.length) {
                    var cur = parts.pop(),
                        pop = cur;
                    if (!Expr.relative[cur]) {
                        cur = "";
                    } else {
                        pop = parts.pop();
                    }
                    if (pop == null) {
                        pop = context;
                    }
                    Expr.relative[cur](checkSet, pop, contextXML);
                }
            } else {
                checkSet = parts = [];
            }
        }
        if (!checkSet) {
            checkSet = set;
        }
        if (!checkSet) {
            throw "Syntax error, unrecognized expression: " + (cur || selector);
        }
        if (toString.call(checkSet) === "[object Array]") {
            if (!prune) {
                results.push.apply(results, checkSet);
            } else if (context && context.nodeType === 1) {
                for (var i = 0; checkSet[i] != null; i++) {
                    if (checkSet[i] && (checkSet[i] === true || checkSet[i].nodeType === 1 && contains(context, checkSet[i]))) {
                        results.push(set[i]);
                    }
                }
            } else {
                for (var i = 0; checkSet[i] != null; i++) {
                    if (checkSet[i] && checkSet[i].nodeType === 1) {
                        results.push(set[i]);
                    }
                }
            }
        } else {
            makeArray(checkSet, results);
        }
        if (extra) {
            Sizzle(extra, origContext, results, seed);
            Sizzle.uniqueSort(results);
        }
        return results;
    };
    Sizzle.uniqueSort = function (results) {
        if (sortOrder) {
            hasDuplicate = baseHasDuplicate;
            results.sort(sortOrder);
            if (hasDuplicate) {
                for (var i = 1; i < results.length; i++) {
                    if (results[i] === results[i - 1]) {
                        results.splice(i--, 1);
                    }
                }
            }
        }
        return results;
    };
    Sizzle.matches = function (expr, set) {
        return Sizzle(expr, null, null, set);
    };
    Sizzle.find = function (expr, context, isXML) {
        var set, match;
        if (!expr) {
            return [];
        }
        for (var i = 0, l = Expr.order.length; i < l; i++) {
            var type = Expr.order[i],
                match;
            if ((match = Expr.leftMatch[type].exec(expr))) {
                var left = match[1];
                match.splice(1, 1);
                if (left.substr(left.length - 1) !== "\\") {
                    match[1] = (match[1] || "").replace(/\\/g, "");
                    set = Expr.find[type](match, context, isXML);
                    if (set != null) {
                        expr = expr.replace(Expr.match[type], "");
                        break;
                    }
                }
            }
        }
        if (!set) {
            set = context.getElementsByTagName("*");
        }
        return {
            set: set,
            expr: expr
        };
    };
    Sizzle.filter = function (expr, set, inplace, not) {
        var old = expr,
            result = [],
            curLoop = set,
            match, anyFound, isXMLFilter = set && set[0] && isXML(set[0]);
        while (expr && set.length) {
            for (var type in Expr.filter) {
                if ((match = Expr.match[type].exec(expr)) != null) {
                    var filter = Expr.filter[type],
                        found, item;
                    anyFound = false;
                    if (curLoop == result) {
                        result = [];
                    }
                    if (Expr.preFilter[type]) {
                        match = Expr.preFilter[type](match, curLoop, inplace, result, not, isXMLFilter);
                        if (!match) {
                            anyFound = found = true;
                        } else if (match === true) {
                            continue;
                        }
                    }
                    if (match) {
                        for (var i = 0;
                        (item = curLoop[i]) != null; i++) {
                            if (item) {
                                found = filter(item, match, i, curLoop);
                                var pass = not ^ !! found;
                                if (inplace && found != null) {
                                    if (pass) {
                                        anyFound = true;
                                    } else {
                                        curLoop[i] = false;
                                    }
                                } else if (pass) {
                                    result.push(item);
                                    anyFound = true;
                                }
                            }
                        }
                    }
                    if (found !== undefined) {
                        if (!inplace) {
                            curLoop = result;
                        }
                        expr = expr.replace(Expr.match[type], "");
                        if (!anyFound) {
                            return [];
                        }
                        break;
                    }
                }
            }
            if (expr == old) {
                if (anyFound == null) {
                    throw "Syntax error, unrecognized expression: " + expr;
                } else {
                    break;
                }
            }
            old = expr;
        }
        return curLoop;
    };
    var Expr = Sizzle.selectors = {
        order: ["ID", "NAME", "TAG"],
        match: {
            ID: /#((?:[\w\u00c0-\uFFFF-]|\\.)+)/,
            CLASS: /\.((?:[\w\u00c0-\uFFFF-]|\\.)+)/,
            NAME: /\[name=['"]*((?:[\w\u00c0-\uFFFF-]|\\.)+)['"]*\]/,
            ATTR: /\[\s*((?:[\w\u00c0-\uFFFF-]|\\.)+)\s*(?:(\S?=)\s*(['"]*)(.*?)\3|)\s*\]/,
            TAG: /^((?:[\w\u00c0-\uFFFF\*-]|\\.)+)/,
            CHILD: /:(only|nth|last|first)-child(?:\((even|odd|[\dn+-]*)\))?/,
            POS: /:(nth|eq|gt|lt|first|last|even|odd)(?:\((\d*)\))?(?=[^-]|$)/,
            PSEUDO: /:((?:[\w\u00c0-\uFFFF-]|\\.)+)(?:\((['"]*)((?:\([^\)]+\)|[^\2\(\)]*)+)\2\))?/
        },
        leftMatch: {},
        attrMap: {
            "class": "className",
            "for": "htmlFor"
        },
        attrHandle: {
            href: function (elem) {
                return elem.getAttribute("href");
            }
        },
        relative: {
            "+": function (checkSet, part, isXML) {
                var isPartStr = typeof part === "string",
                    isTag = isPartStr && !/\W/.test(part),
                    isPartStrNotTag = isPartStr && !isTag;
                if (isTag && !isXML) {
                    part = part.toUpperCase();
                }
                for (var i = 0, l = checkSet.length, elem; i < l; i++) {
                    if ((elem = checkSet[i])) {
                        while ((elem = elem.previousSibling) && elem.nodeType !== 1) {}
                        checkSet[i] = isPartStrNotTag || elem && elem.nodeName === part ? elem || false : elem === part;
                    }
                }
                if (isPartStrNotTag) {
                    Sizzle.filter(part, checkSet, true);
                }
            },
            ">": function (checkSet, part, isXML) {
                var isPartStr = typeof part === "string";
                if (isPartStr && !/\W/.test(part)) {
                    part = isXML ? part : part.toUpperCase();
                    for (var i = 0, l = checkSet.length; i < l; i++) {
                        var elem = checkSet[i];
                        if (elem) {
                            var parent = elem.parentNode;
                            checkSet[i] = parent.nodeName === part ? parent : false;
                        }
                    }
                } else {
                    for (var i = 0, l = checkSet.length; i < l; i++) {
                        var elem = checkSet[i];
                        if (elem) {
                            checkSet[i] = isPartStr ? elem.parentNode : elem.parentNode === part;
                        }
                    }
                    if (isPartStr) {
                        Sizzle.filter(part, checkSet, true);
                    }
                }
            },
            "": function (checkSet, part, isXML) {
                var doneName = done++,
                    checkFn = dirCheck;
                if (!/\W/.test(part)) {
                    var nodeCheck = part = isXML ? part : part.toUpperCase();
                    checkFn = dirNodeCheck;
                }
                checkFn("parentNode", part, doneName, checkSet, nodeCheck, isXML);
            },
            "~": function (checkSet, part, isXML) {
                var doneName = done++,
                    checkFn = dirCheck;
                if (typeof part === "string" && !/\W/.test(part)) {
                    var nodeCheck = part = isXML ? part : part.toUpperCase();
                    checkFn = dirNodeCheck;
                }
                checkFn("previousSibling", part, doneName, checkSet, nodeCheck, isXML);
            }
        },
        find: {
            ID: function (match, context, isXML) {
                if (typeof context.getElementById !== "undefined" && !isXML) {
                    var m = context.getElementById(match[1]);
                    return m ? [m] : [];
                }
            },
            NAME: function (match, context, isXML) {
                if (typeof context.getElementsByName !== "undefined") {
                    var ret = [],
                        results = context.getElementsByName(match[1]);
                    for (var i = 0, l = results.length; i < l; i++) {
                        if (results[i].getAttribute("name") === match[1]) {
                            ret.push(results[i]);
                        }
                    }
                    return ret.length === 0 ? null : ret;
                }
            },
            TAG: function (match, context) {
                return context.getElementsByTagName(match[1]);
            }
        },
        preFilter: {
            CLASS: function (match, curLoop, inplace, result, not, isXML) {
                match = " " + match[1].replace(/\\/g, "") + " ";
                if (isXML) {
                    return match;
                }
                for (var i = 0, elem;
                (elem = curLoop[i]) != null; i++) {
                    if (elem) {
                        if (not ^ (elem.className && (" " + elem.className + " ").indexOf(match) >= 0)) {
                            if (!inplace) result.push(elem);
                        } else if (inplace) {
                            curLoop[i] = false;
                        }
                    }
                }
                return false;
            },
            ID: function (match) {
                return match[1].replace(/\\/g, "");
            },
            TAG: function (match, curLoop) {
                for (var i = 0; curLoop[i] === false; i++) {}
                return curLoop[i] && isXML(curLoop[i]) ? match[1] : match[1].toUpperCase();
            },
            CHILD: function (match) {
                if (match[1] == "nth") {
                    var test = /(-?)(\d*)n((?:\+|-)?\d*)/.exec(match[2] == "even" && "2n" || match[2] == "odd" && "2n+1" || !/\D/.test(match[2]) && "0n+" + match[2] || match[2]);
                    match[2] = (test[1] + (test[2] || 1)) - 0;
                    match[3] = test[3] - 0;
                }
                match[0] = done++;
                return match;
            },
            ATTR: function (match, curLoop, inplace, result, not, isXML) {
                var name = match[1].replace(/\\/g, "");
                if (!isXML && Expr.attrMap[name]) {
                    match[1] = Expr.attrMap[name];
                }
                if (match[2] === "~=") {
                    match[4] = " " + match[4] + " ";
                }
                return match;
            },
            PSEUDO: function (match, curLoop, inplace, result, not) {
                if (match[1] === "not") {
                    if ((chunker.exec(match[3]) || "").length > 1 || /^\w/.test(match[3])) {
                        match[3] = Sizzle(match[3], null, null, curLoop);
                    } else {
                        var ret = Sizzle.filter(match[3], curLoop, inplace, true ^ not);
                        if (!inplace) {
                            result.push.apply(result, ret);
                        }
                        return false;
                    }
                } else if (Expr.match.POS.test(match[0]) || Expr.match.CHILD.test(match[0])) {
                    return true;
                }
                return match;
            },
            POS: function (match) {
                match.unshift(true);
                return match;
            }
        },
        filters: {
            enabled: function (elem) {
                return elem.disabled === false && elem.type !== "hidden";
            },
            disabled: function (elem) {
                return elem.disabled === true;
            },
            checked: function (elem) {
                return elem.checked === true;
            },
            selected: function (elem) {
                elem.parentNode.selectedIndex;
                return elem.selected === true;
            },
            parent: function (elem) {
                return !!elem.firstChild;
            },
            empty: function (elem) {
                return !elem.firstChild;
            },
            has: function (elem, i, match) {
                return !!Sizzle(match[3], elem).length;
            },
            header: function (elem) {
                return /h\d/i.test(elem.nodeName);
            },
            text: function (elem) {
                return "text" === elem.type;
            },
            radio: function (elem) {
                return "radio" === elem.type;
            },
            checkbox: function (elem) {
                return "checkbox" === elem.type;
            },
            file: function (elem) {
                return "file" === elem.type;
            },
            password: function (elem) {
                return "password" === elem.type;
            },
            submit: function (elem) {
                return "submit" === elem.type;
            },
            image: function (elem) {
                return "image" === elem.type;
            },
            reset: function (elem) {
                return "reset" === elem.type;
            },
            button: function (elem) {
                return "button" === elem.type || elem.nodeName.toUpperCase() === "BUTTON";
            },
            input: function (elem) {
                return /input|select|textarea|button/i.test(elem.nodeName);
            }
        },
        setFilters: {
            first: function (elem, i) {
                return i === 0;
            },
            last: function (elem, i, match, array) {
                return i === array.length - 1;
            },
            even: function (elem, i) {
                return i % 2 === 0;
            },
            odd: function (elem, i) {
                return i % 2 === 1;
            },
            lt: function (elem, i, match) {
                return i < match[3] - 0;
            },
            gt: function (elem, i, match) {
                return i > match[3] - 0;
            },
            nth: function (elem, i, match) {
                return match[3] - 0 == i;
            },
            eq: function (elem, i, match) {
                return match[3] - 0 == i;
            }
        },
        filter: {
            PSEUDO: function (elem, match, i, array) {
                var name = match[1],
                    filter = Expr.filters[name];
                if (filter) {
                    return filter(elem, i, match, array);
                } else if (name === "contains") {
                    return (elem.textContent || elem.innerText || "").indexOf(match[3]) >= 0;
                } else if (name === "not") {
                    var not = match[3];
                    for (var i = 0, l = not.length; i < l; i++) {
                        if (not[i] === elem) {
                            return false;
                        }
                    }
                    return true;
                }
            },
            CHILD: function (elem, match) {
                var type = match[1],
                    node = elem;
                switch (type) {
                    case 'only':
                    case 'first':
                        while ((node = node.previousSibling)) {
                            if (node.nodeType === 1) return false;
                        }
                        if (type == 'first') return true;
                        node = elem;
                    case 'last':
                        while ((node = node.nextSibling)) {
                            if (node.nodeType === 1) return false;
                        }
                        return true;
                    case 'nth':
                        var first = match[2],
                            last = match[3];
                        if (first == 1 && last == 0) {
                            return true;
                        }
                        var doneName = match[0],
                            parent = elem.parentNode;
                        if (parent && (parent.sizcache !== doneName || !elem.nodeIndex)) {
                            var count = 0;
                            for (node = parent.firstChild; node; node = node.nextSibling) {
                                if (node.nodeType === 1) {
                                    node.nodeIndex = ++count;
                                }
                            }
                            parent.sizcache = doneName;
                        }
                        var diff = elem.nodeIndex - last;
                        if (first == 0) {
                            return diff == 0;
                        } else {
                            return (diff % first == 0 && diff / first >= 0);
                        }
                }
            },
            ID: function (elem, match) {
                return elem.nodeType === 1 && elem.getAttribute("id") === match;
            },
            TAG: function (elem, match) {
                return (match === "*" && elem.nodeType === 1) || elem.nodeName === match;
            },
            CLASS: function (elem, match) {
                return (" " + (elem.className || elem.getAttribute("class")) + " ").indexOf(match) > -1;
            },
            ATTR: function (elem, match) {
                var name = match[1],
                    result = Expr.attrHandle[name] ? Expr.attrHandle[name](elem) : elem[name] != null ? elem[name] : elem.getAttribute(name),
                    value = result + "",
                    type = match[2],
                    check = match[4];
                return result == null ? type === "!=" : type === "=" ? value === check : type === "*=" ? value.indexOf(check) >= 0 : type === "~=" ? (" " + value + " ").indexOf(check) >= 0 : !check ? value && result !== false : type === "!=" ? value != check : type === "^=" ? value.indexOf(check) === 0 : type === "$=" ? value.substr(value.length - check.length) === check : type === "|=" ? value === check || value.substr(0, check.length + 1) === check + "-" : false;
            },
            POS: function (elem, match, i, array) {
                var name = match[2],
                    filter = Expr.setFilters[name];
                if (filter) {
                    return filter(elem, i, match, array);
                }
            }
        }
    };
    var origPOS = Expr.match.POS;
    for (var type in Expr.match) {
        Expr.match[type] = new RegExp(Expr.match[type].source + /(?![^\[]*\])(?![^\(]*\))/.source);
        Expr.leftMatch[type] = new RegExp(/(^(?:.|\r|\n)*?)/.source + Expr.match[type].source);
    }
    var makeArray = function (array, results) {
        array = Array.prototype.slice.call(array, 0);
        if (results) {
            results.push.apply(results, array);
            return results;
        }
        return array;
    };
    try {
        Array.prototype.slice.call(document.documentElement.childNodes, 0);
    } catch (e) {
        makeArray = function (array, results) {
            var ret = results || [];
            if (toString.call(array) === "[object Array]") {
                Array.prototype.push.apply(ret, array);
            } else {
                if (typeof array.length === "number") {
                    for (var i = 0, l = array.length; i < l; i++) {
                        ret.push(array[i]);
                    }
                } else {
                    for (var i = 0; array[i]; i++) {
                        ret.push(array[i]);
                    }
                }
            }
            return ret;
        };
    }
    var sortOrder;
    if (document.documentElement.compareDocumentPosition) {
        sortOrder = function (a, b) {
            if (!a.compareDocumentPosition || !b.compareDocumentPosition) {
                if (a == b) {
                    hasDuplicate = true;
                }
                return 0;
            }
            var ret = a.compareDocumentPosition(b) & 4 ? -1 : a === b ? 0 : 1;
            if (ret === 0) {
                hasDuplicate = true;
            }
            return ret;
        };
    } else if ("sourceIndex" in document.documentElement) {
        sortOrder = function (a, b) {
            if (!a.sourceIndex || !b.sourceIndex) {
                if (a == b) {
                    hasDuplicate = true;
                }
                return 0;
            }
            var ret = a.sourceIndex - b.sourceIndex;
            if (ret === 0) {
                hasDuplicate = true;
            }
            return ret;
        };
    } else if (document.createRange) {
        sortOrder = function (a, b) {
            if (!a.ownerDocument || !b.ownerDocument) {
                if (a == b) {
                    hasDuplicate = true;
                }
                return 0;
            }
            var aRange = a.ownerDocument.createRange(),
                bRange = b.ownerDocument.createRange();
            aRange.setStart(a, 0);
            aRange.setEnd(a, 0);
            bRange.setStart(b, 0);
            bRange.setEnd(b, 0);
            var ret = aRange.compareBoundaryPoints(Range.START_TO_END, bRange);
            if (ret === 0) {
                hasDuplicate = true;
            }
            return ret;
        };
    }
    (function () {
        var form = document.createElement("div"),
            id = "script" + (new Date).getTime();
        form.innerHTML = "<a name='" + id + "'/>";
        var root = document.documentElement;
        root.insertBefore(form, root.firstChild);
        if ( !! document.getElementById(id)) {
            Expr.find.ID = function (match, context, isXML) {
                if (typeof context.getElementById !== "undefined" && !isXML) {
                    var m = context.getElementById(match[1]);
                    return m ? m.id === match[1] || typeof m.getAttributeNode !== "undefined" && m.getAttributeNode("id").nodeValue === match[1] ? [m] : undefined : [];
                }
            };
            Expr.filter.ID = function (elem, match) {
                var node = typeof elem.getAttributeNode !== "undefined" && elem.getAttributeNode("id");
                return elem.nodeType === 1 && node && node.nodeValue === match;
            };
        }
        root.removeChild(form);
        root = form = null;
    })();
    (function () {
        var div = document.createElement("div");
        div.appendChild(document.createComment(""));
        if (div.getElementsByTagName("*").length > 0) {
            Expr.find.TAG = function (match, context) {
                var results = context.getElementsByTagName(match[1]);
                if (match[1] === "*") {
                    var tmp = [];
                    for (var i = 0; results[i]; i++) {
                        if (results[i].nodeType === 1) {
                            tmp.push(results[i]);
                        }
                    }
                    results = tmp;
                }
                return results;
            };
        }
        div.innerHTML = "<a href='#'></a>";
        if (div.firstChild && typeof div.firstChild.getAttribute !== "undefined" && div.firstChild.getAttribute("href") !== "#") {
            Expr.attrHandle.href = function (elem) {
                return elem.getAttribute("href", 2);
            };
        }
        div = null;
    })();
    if (document.querySelectorAll)(function () {
        var oldSizzle = Sizzle,
            div = document.createElement("div");
        div.innerHTML = "<p class='TEST'></p>";
        if (div.querySelectorAll && div.querySelectorAll(".TEST").length === 0) {
            return;
        }
        Sizzle = function (query, context, extra, seed) {
            context = context || document;
            if (!seed && context.nodeType === 9 && !isXML(context)) {
                try {
                    return makeArray(context.querySelectorAll(query), extra);
                } catch (e) {}
            }
            return oldSizzle(query, context, extra, seed);
        };
        for (var prop in oldSizzle) {
            Sizzle[prop] = oldSizzle[prop];
        }
        div = null;
    })();
    if (document.getElementsByClassName && document.documentElement.getElementsByClassName)(function () {
        var div = document.createElement("div");
        div.innerHTML = "<div class='test e'></div><div class='test'></div>";
        if (div.getElementsByClassName("e").length === 0) return;
        div.lastChild.className = "e";
        if (div.getElementsByClassName("e").length === 1) return;
        Expr.order.splice(1, 0, "CLASS");
        Expr.find.CLASS = function (match, context, isXML) {
            if (typeof context.getElementsByClassName !== "undefined" && !isXML) {
                return context.getElementsByClassName(match[1]);
            }
        };
        div = null;
    })();

    function dirNodeCheck(dir, cur, doneName, checkSet, nodeCheck, isXML) {
        var sibDir = dir == "previousSibling" && !isXML;
        for (var i = 0, l = checkSet.length; i < l; i++) {
            var elem = checkSet[i];
            if (elem) {
                if (sibDir && elem.nodeType === 1) {
                    elem.sizcache = doneName;
                    elem.sizset = i;
                }
                elem = elem[dir];
                var match = false;
                while (elem) {
                    if (elem.sizcache === doneName) {
                        match = checkSet[elem.sizset];
                        break;
                    }
                    if (elem.nodeType === 1 && !isXML) {
                        elem.sizcache = doneName;
                        elem.sizset = i;
                    }
                    if (elem.nodeName === cur) {
                        match = elem;
                        break;
                    }
                    elem = elem[dir];
                }
                checkSet[i] = match;
            }
        }
    }

    function dirCheck(dir, cur, doneName, checkSet, nodeCheck, isXML) {
        var sibDir = dir == "previousSibling" && !isXML;
        for (var i = 0, l = checkSet.length; i < l; i++) {
            var elem = checkSet[i];
            if (elem) {
                if (sibDir && elem.nodeType === 1) {
                    elem.sizcache = doneName;
                    elem.sizset = i;
                }
                elem = elem[dir];
                var match = false;
                while (elem) {
                    if (elem.sizcache === doneName) {
                        match = checkSet[elem.sizset];
                        break;
                    }
                    if (elem.nodeType === 1) {
                        if (!isXML) {
                            elem.sizcache = doneName;
                            elem.sizset = i;
                        }
                        if (typeof cur !== "string") {
                            if (elem === cur) {
                                match = true;
                                break;
                            }
                        } else if (Sizzle.filter(cur, [elem]).length > 0) {
                            match = elem;
                            break;
                        }
                    }
                    elem = elem[dir];
                }
                checkSet[i] = match;
            }
        }
    }
    var contains = document.compareDocumentPosition ? function (a, b) {
            return a.compareDocumentPosition(b) & 16;
        } : function (a, b) {
            return a !== b && (a.contains ? a.contains(b) : true);
        };
    var isXML = function (elem) {
        return elem.nodeType === 9 && elem.documentElement.nodeName !== "HTML" || !! elem.ownerDocument && elem.ownerDocument.documentElement.nodeName !== "HTML";
    };
    var posProcess = function (selector, context) {
        var tmpSet = [],
            later = "",
            match, root = context.nodeType ? [context] : context;
        while ((match = Expr.match.PSEUDO.exec(selector))) {
            later += match[0];
            selector = selector.replace(Expr.match.PSEUDO, "");
        }
        selector = Expr.relative[selector] ? selector + "*" : selector;
        for (var i = 0, l = root.length; i < l; i++) {
            Sizzle(selector, root[i], tmpSet);
        }
        return Sizzle.filter(later, tmpSet);
    };
    window.Sizzle = Sizzle;
})();;
(function (engine) {
    var extendElements = Prototype.Selector.extendElements;

    function select(selector, scope) {
        return extendElements(engine(selector, scope || document));
    }

    function match(element, selector) {
        return engine.matches(selector, [element]).length == 1;
    }
    Prototype.Selector.engine = engine;
    Prototype.Selector.select = select;
    Prototype.Selector.match = match;
})(Sizzle);
window.Sizzle = Prototype._original_property;
delete Prototype._original_property;
var Form = {
    reset: function (form) {
        form = $(form);
        form.reset();
        return form;
    },
    serializeElements: function (elements, options) {
        if (typeof options != 'object') options = {
            hash: !! options
        };
        else if (Object.isUndefined(options.hash)) options.hash = true;
        var key, value, submitted = false,
            submit = options.submit,
            accumulator, initial;
        if (options.hash) {
            initial = {};
            accumulator = function (result, key, value) {
                if (key in result) {
                    if (!Object.isArray(result[key])) result[key] = [result[key]];
                    result[key].push(value);
                } else result[key] = value;
                return result;
            };
        } else {
            initial = '';
            accumulator = function (result, key, value) {
                return result + (result ? '&' : '') + encodeURIComponent(key) + '=' + encodeURIComponent(value);
            }
        }
        return elements.inject(initial, function (result, element) {
            if (!element.disabled && element.name) {
                key = element.name;
                value = $(element).getValue();
                if (value != null && element.type != 'file' && (element.type != 'submit' || (!submitted && submit !== false && (!submit || key == submit) && (submitted = true)))) {
                    result = accumulator(result, key, value);
                }
            }
            return result;
        });
    }
};
Form.Methods = {
    serialize: function (form, options) {
        return Form.serializeElements(Form.getElements(form), options);
    },
    getElements: function (form) {
        var elements = $(form).getElementsByTagName('*'),
            element, arr = [],
            serializers = Form.Element.Serializers;
        for (var i = 0; element = elements[i]; i++) {
            arr.push(element);
        }
        return arr.inject([], function (elements, child) {
            if (serializers[child.tagName.toLowerCase()]) elements.push(Element.extend(child));
            return elements;
        })
    },
    getInputs: function (form, typeName, name) {
        form = $(form);
        var inputs = form.getElementsByTagName('input');
        if (!typeName && !name) return $A(inputs).map(Element.extend);
        for (var i = 0, matchingInputs = [], length = inputs.length; i < length; i++) {
            var input = inputs[i];
            if ((typeName && input.type != typeName) || (name && input.name != name)) continue;
            matchingInputs.push(Element.extend(input));
        }
        return matchingInputs;
    },
    disable: function (form) {
        form = $(form);
        Form.getElements(form).invoke('disable');
        return form;
    },
    enable: function (form) {
        form = $(form);
        Form.getElements(form).invoke('enable');
        return form;
    },
    findFirstElement: function (form) {
        var elements = $(form).getElements().findAll(function (element) {
            return 'hidden' != element.type && !element.disabled;
        });
        var firstByIndex = elements.findAll(function (element) {
            return element.hasAttribute('tabIndex') && element.tabIndex >= 0;
        }).sortBy(function (element) {
            return element.tabIndex
        }).first();
        return firstByIndex ? firstByIndex : elements.find(function (element) {
            return /^(?:input|select|textarea)$/i.test(element.tagName);
        });
    },
    focusFirstElement: function (form) {
        form = $(form);
        var element = form.findFirstElement();
        if (element) element.activate();
        return form;
    },
    request: function (form, options) {
        form = $(form), options = Object.clone(options || {});
        var params = options.parameters,
            action = form.readAttribute('action') || '';
        if (action.blank()) action = window.location.href;
        options.parameters = form.serialize(true);
        if (params) {
            if (Object.isString(params)) params = params.toQueryParams();
            Object.extend(options.parameters, params);
        }
        if (form.hasAttribute('method') && !options.method) options.method = form.method;
        return new Ajax.Request(action, options);
    }
};
Form.Element = {
    focus: function (element) {
        $(element).focus();
        return element;
    },
    select: function (element) {
        $(element).select();
        return element;
    }
};
Form.Element.Methods = {
    serialize: function (element) {
        element = $(element);
        if (!element.disabled && element.name) {
            var value = element.getValue();
            if (value != undefined) {
                var pair = {};
                pair[element.name] = value;
                return Object.toQueryString(pair);
            }
        }
        return '';
    },
    getValue: function (element) {
        element = $(element);
        var method = element.tagName.toLowerCase();
        return Form.Element.Serializers[method](element);
    },
    setValue: function (element, value) {
        element = $(element);
        var method = element.tagName.toLowerCase();
        Form.Element.Serializers[method](element, value);
        return element;
    },
    clear: function (element) {
        $(element).value = '';
        return element;
    },
    present: function (element) {
        return $(element).value != '';
    },
    activate: function (element) {
        element = $(element);
        try {
            element.focus();
            if (element.select && (element.tagName.toLowerCase() != 'input' || !(/^(?:button|reset|submit)$/i.test(element.type)))) element.select();
        } catch (e) {}
        return element;
    },
    disable: function (element) {
        element = $(element);
        element.disabled = true;
        return element;
    },
    enable: function (element) {
        element = $(element);
        element.disabled = false;
        return element;
    }
};
var Field = Form.Element;
var $F = Form.Element.Methods.getValue;
Form.Element.Serializers = (function () {
    function input(element, value) {
        switch (element.type.toLowerCase()) {
            case 'checkbox':
            case 'radio':
                return inputSelector(element, value);
            default:
                return valueSelector(element, value);
        }
    }

    function inputSelector(element, value) {
        if (Object.isUndefined(value)) return element.checked ? element.value : null;
        else element.checked = !! value;
    }

    function valueSelector(element, value) {
        if (Object.isUndefined(value)) return element.value;
        else element.value = value;
    }

    function select(element, value) {
        if (Object.isUndefined(value)) return (element.type === 'select-one' ? selectOne : selectMany)(element);
        var opt, currentValue, single = !Object.isArray(value);
        for (var i = 0, length = element.length; i < length; i++) {
            opt = element.options[i];
            currentValue = this.optionValue(opt);
            if (single) {
                if (currentValue == value) {
                    opt.selected = true;
                    return;
                }
            } else opt.selected = value.include(currentValue);
        }
    }

    function selectOne(element) {
        var index = element.selectedIndex;
        return index >= 0 ? optionValue(element.options[index]) : null;
    }

    function selectMany(element) {
        var values, length = element.length;
        if (!length) return null;
        for (var i = 0, values = []; i < length; i++) {
            var opt = element.options[i];
            if (opt.selected) values.push(optionValue(opt));
        }
        return values;
    }

    function optionValue(opt) {
        return Element.hasAttribute(opt, 'value') ? opt.value : opt.text;
    }
    return {
        input: input,
        inputSelector: inputSelector,
        textarea: valueSelector,
        select: select,
        selectOne: selectOne,
        selectMany: selectMany,
        optionValue: optionValue,
        button: valueSelector
    };
})();
Abstract.TimedObserver = Class.create(PeriodicalExecuter, {
    initialize: function ($super, element, frequency, callback) {
        $super(callback, frequency);
        this.element = $(element);
        this.lastValue = this.getValue();
    },
    execute: function () {
        var value = this.getValue();
        if (Object.isString(this.lastValue) && Object.isString(value) ? this.lastValue != value : String(this.lastValue) != String(value)) {
            this.callback(this.element, value);
            this.lastValue = value;
        }
    }
});
Form.Element.Observer = Class.create(Abstract.TimedObserver, {
    getValue: function () {
        return Form.Element.getValue(this.element);
    }
});
Form.Observer = Class.create(Abstract.TimedObserver, {
    getValue: function () {
        return Form.serialize(this.element);
    }
});
Abstract.EventObserver = Class.create({
    initialize: function (element, callback) {
        this.element = $(element);
        this.callback = callback;
        this.lastValue = this.getValue();
        if (this.element.tagName.toLowerCase() == 'form') this.registerFormCallbacks();
        else this.registerCallback(this.element);
    },
    onElementEvent: function () {
        var value = this.getValue();
        if (this.lastValue != value) {
            this.callback(this.element, value);
            this.lastValue = value;
        }
    },
    registerFormCallbacks: function () {
        Form.getElements(this.element).each(this.registerCallback, this);
    },
    registerCallback: function (element) {
        if (element.type) {
            switch (element.type.toLowerCase()) {
                case 'checkbox':
                case 'radio':
                    Event.observe(element, 'click', this.onElementEvent.bind(this));
                    break;
                default:
                    Event.observe(element, 'change', this.onElementEvent.bind(this));
                    break;
            }
        }
    }
});
Form.Element.EventObserver = Class.create(Abstract.EventObserver, {
    getValue: function () {
        return Form.Element.getValue(this.element);
    }
});
Form.EventObserver = Class.create(Abstract.EventObserver, {
    getValue: function () {
        return Form.serialize(this.element);
    }
});
(function () {
    var Event = {
        KEY_BACKSPACE: 8,
        KEY_TAB: 9,
        KEY_RETURN: 13,
        KEY_ESC: 27,
        KEY_LEFT: 37,
        KEY_UP: 38,
        KEY_RIGHT: 39,
        KEY_DOWN: 40,
        KEY_DELETE: 46,
        KEY_HOME: 36,
        KEY_END: 35,
        KEY_PAGEUP: 33,
        KEY_PAGEDOWN: 34,
        KEY_INSERT: 45,
        cache: {}
    };
    var docEl = document.documentElement;
    var MOUSEENTER_MOUSELEAVE_EVENTS_SUPPORTED = 'onmouseenter' in docEl && 'onmouseleave' in docEl;
    var isIELegacyEvent = function (event) {
        return false;
    };
    if (window.attachEvent) {
        if (window.addEventListener) {
            isIELegacyEvent = function (event) {
                return !(event instanceof window.Event);
            };
        } else {
            isIELegacyEvent = function (event) {
                return true;
            };
        }
    }
    var _isButton;

    function _isButtonForDOMEvents(event, code) {
        return event.which ? (event.which === code + 1) : (event.button === code);
    }
    var legacyButtonMap = {
        0: 1,
        1: 4,
        2: 2
    };

    function _isButtonForLegacyEvents(event, code) {
        return event.button === legacyButtonMap[code];
    }

    function _isButtonForWebKit(event, code) {
        switch (code) {
            case 0:
                return event.which == 1 && !event.metaKey;
            case 1:
                return event.which == 2 || (event.which == 1 && event.metaKey);
            case 2:
                return event.which == 3;
            default:
                return false;
        }
    }
    if (window.attachEvent) {
        if (!window.addEventListener) {
            _isButton = _isButtonForLegacyEvents;
        } else {
            _isButton = function (event, code) {
                return isIELegacyEvent(event) ? _isButtonForLegacyEvents(event, code) : _isButtonForDOMEvents(event, code);
            }
        }
    } else if (Prototype.Browser.WebKit) {
        _isButton = _isButtonForWebKit;
    } else {
        _isButton = _isButtonForDOMEvents;
    }

    function isLeftClick(event) {
        return _isButton(event, 0)
    }

    function isMiddleClick(event) {
        return _isButton(event, 1)
    }

    function isRightClick(event) {
        return _isButton(event, 2)
    }

    function element(event) {
        event = Event.extend(event);
        var node = event.target,
            type = event.type,
            currentTarget = event.currentTarget;
        if (currentTarget && currentTarget.tagName) {
            if (type === 'load' || type === 'error' || (type === 'click' && currentTarget.tagName.toLowerCase() === 'input' && currentTarget.type === 'radio')) node = currentTarget;
        }
        if (node.nodeType == Node.TEXT_NODE) node = node.parentNode;
        return Element.extend(node);
    }

    function findElement(event, expression) {
        var element = Event.element(event);
        if (!expression) return element;
        while (element) {
            if (Object.isElement(element) && Prototype.Selector.match(element, expression)) {
                return Element.extend(element);
            }
            element = element.parentNode;
        }
    }

    function pointer(event) {
        return {
            x: pointerX(event),
            y: pointerY(event)
        };
    }

    function pointerX(event) {
        var docElement = document.documentElement,
            body = document.body || {
                scrollLeft: 0
            };
        if (('createTouch' in document) && event.touches) {
            if (event.touches[0]) {
                return event.touches[0].pageX;
            } else {
                return event.pageX;
            }
        }
        return event.pageX || (event.clientX + (docElement.scrollLeft || body.scrollLeft) - (docElement.clientLeft || 0));
    }

    function pointerY(event) {
        var docElement = document.documentElement,
            body = document.body || {
                scrollTop: 0
            };
        if (('createTouch' in document) && event.touches) {
            if (event.touches[0]) {
                return event.touches[0].pageY;
            } else {
                return event.pageY;
            }
        }
        return event.pageY || (event.clientY + (docElement.scrollTop || body.scrollTop) - (docElement.clientTop || 0));
    }

    function stop(event) {
        Event.extend(event);
        event.preventDefault();
        event.stopPropagation();
        event.stopped = true;
    }
    Event.Methods = {
        isLeftClick: isLeftClick,
        isMiddleClick: isMiddleClick,
        isRightClick: isRightClick,
        element: element,
        findElement: findElement,
        pointer: pointer,
        pointerX: pointerX,
        pointerY: pointerY,
        stop: stop
    };
    var methods = Object.keys(Event.Methods).inject({}, function (m, name) {
        m[name] = Event.Methods[name].methodize();
        return m;
    });
    if (window.attachEvent) {
        function _relatedTarget(event) {
            var element;
            switch (event.type) {
                case 'mouseover':
                case 'mouseenter':
                    element = event.fromElement;
                    break;
                case 'mouseout':
                case 'mouseleave':
                    element = event.toElement;
                    break;
                default:
                    return null;
            }
            return Element.extend(element);
        }
        var additionalMethods = {
            stopPropagation: function () {
                this.cancelBubble = true
            },
            preventDefault: function () {
                this.returnValue = false
            },
            inspect: function () {
                return '[object Event]'
            }
        };
        Event.extend = function (event, element) {
            if (!event) return false;
            if (!isIELegacyEvent(event)) return event;
            if (event._extendedByPrototype) return event;
            event._extendedByPrototype = Prototype.emptyFunction;
            var pointer = Event.pointer(event);
            Object.extend(event, {
                target: event.srcElement || element,
                relatedTarget: _relatedTarget(event),
                pageX: pointer.x,
                pageY: pointer.y
            });
            Object.extend(event, methods);
            Object.extend(event, additionalMethods);
            return event;
        };
    } else {
        Event.extend = Prototype.K;
    }
    if (window.addEventListener) {
        Event.prototype = window.Event.prototype || document.createEvent('HTMLEvents').__proto__;
        Object.extend(Event.prototype, methods);
    }

    function _createResponder(element, eventName, handler) {
        var registry = Element.retrieve(element, 'prototype_event_registry');
        if (Object.isUndefined(registry)) {
            CACHE.push(element);
            registry = Element.retrieve(element, 'prototype_event_registry', $H());
        }
        var respondersForEvent;
        try {
            respondersForEvent = registry.get(eventName);
        } catch (e) {
            return false;
        }
        if (Object.isUndefined(respondersForEvent)) {
            respondersForEvent = [];
            registry.set(eventName, respondersForEvent);
        }
        if (respondersForEvent.pluck('handler').include(handler)) return false;
        var responder;
        if (eventName.include(":")) {
            responder = function (event) {
                if (Object.isUndefined(event.eventName)) return false;
                if (event.eventName !== eventName) return false;
                Event.extend(event, element);
                handler.call(element, event);
            };
        } else {
            if (!MOUSEENTER_MOUSELEAVE_EVENTS_SUPPORTED && (eventName === "mouseenter" || eventName === "mouseleave")) {
                if (eventName === "mouseenter" || eventName === "mouseleave") {
                    responder = function (event) {
                        Event.extend(event, element);
                        var parent = event.relatedTarget;
                        while (parent && parent !== element) {
                            try {
                                parent = parent.parentNode;
                            } catch (e) {
                                parent = element;
                            }
                        }
                        if (parent === element) return;
                        handler.call(element, event);
                    };
                }
            } else {
                responder = function (event) {
                    Event.extend(event, element);
                    handler.call(element, event);
                };
            }
        }
        responder.handler = handler;
        respondersForEvent.push(responder);
        return responder;
    }

    function _destroyCache() {
        for (var i = 0, length = CACHE.length; i < length; i++) {
            Event.stopObserving(CACHE[i]);
            CACHE[i] = null;
        }
    }
    var CACHE = [];
    if (Prototype.Browser.IE) window.attachEvent('onunload', _destroyCache);
    if (Prototype.Browser.WebKit) window.addEventListener('unload', Prototype.emptyFunction, false);
    var _getDOMEventName = Prototype.K,
        translations = {
            mouseenter: "mouseover",
            mouseleave: "mouseout"
        };
    if (!MOUSEENTER_MOUSELEAVE_EVENTS_SUPPORTED) {
        _getDOMEventName = function (eventName) {
            return (translations[eventName] || eventName);
        };
    }

    function observe(element, eventName, handler) {
        element = $(element);
        var responder = _createResponder(element, eventName, handler);
        if (!responder) return element;
        if (eventName.include(':')) {
            if (element.addEventListener) element.addEventListener("dataavailable", responder, false);
            else {
                element.attachEvent("ondataavailable", responder);
                element.attachEvent("onlosecapture", responder);
            }
        } else {
            var actualEventName = _getDOMEventName(eventName);
            if (element.addEventListener) element.addEventListener(actualEventName, responder, false);
            else element.attachEvent("on" + actualEventName, responder);
        }
        return element;
    }

    function stopObserving(element, eventName, handler) {
        element = $(element);
        var registry = Element.retrieve(element, 'prototype_event_registry');
        if (!registry) return element;
        if (!eventName) {
            registry.each(function (pair) {
                var eventName = pair.key;
                stopObserving(element, eventName);
            });
            return element;
        }
        var responders = registry.get(eventName);
        if (!responders) return element;
        if (!handler) {
            responders.each(function (r) {
                stopObserving(element, eventName, r.handler);
            });
            return element;
        }
        var i = responders.length,
            responder;
        while (i--) {
            if (responders[i].handler === handler) {
                responder = responders[i];
                break;
            }
        }
        if (!responder) return element;
        if (eventName.include(':')) {
            if (element.removeEventListener) element.removeEventListener("dataavailable", responder, false);
            else {
                element.detachEvent("ondataavailable", responder);
                element.detachEvent("onlosecapture", responder);
            }
        } else {
            var actualEventName = _getDOMEventName(eventName);
            if (element.removeEventListener) element.removeEventListener(actualEventName, responder, false);
            else element.detachEvent('on' + actualEventName, responder);
        }
        registry.set(eventName, responders.without(responder));
        return element;
    }

    function fire(element, eventName, memo, bubble) {
        element = $(element);
        if (Object.isUndefined(bubble)) bubble = true;
        if (element == document && document.createEvent && !element.dispatchEvent) element = document.documentElement;
        var event;
        if (document.createEvent) {
            event = document.createEvent('HTMLEvents');
            event.initEvent('dataavailable', bubble, true);
        } else {
            event = document.createEventObject();
            event.eventType = bubble ? 'ondataavailable' : 'onlosecapture';
        }
        event.eventName = eventName;
        event.memo = memo || {};
        if (document.createEvent) element.dispatchEvent(event);
        else element.fireEvent(event.eventType, event);
        return Event.extend(event);
    }
    Event.Handler = Class.create({
        initialize: function (element, eventName, selector, callback) {
            this.element = $(element);
            this.eventName = eventName;
            this.selector = selector;
            this.callback = callback;
            this.handler = this.handleEvent.bind(this);
        },
        start: function () {
            Event.observe(this.element, this.eventName, this.handler);
            return this;
        },
        stop: function () {
            Event.stopObserving(this.element, this.eventName, this.handler);
            return this;
        },
        handleEvent: function (event) {
            var element = Event.findElement(event, this.selector);
            if (element) this.callback.call(this.element, event, element);
        }
    });

    function on(element, eventName, selector, callback) {
        element = $(element);
        if (Object.isFunction(selector) && Object.isUndefined(callback)) {
            callback = selector, selector = null;
        }
        return new Event.Handler(element, eventName, selector, callback).start();
    }
    Object.extend(Event, Event.Methods);
    Object.extend(Event, {
        fire: fire,
        observe: observe,
        stopObserving: stopObserving,
        on: on
    });
    Element.addMethods({
        fire: fire,
        observe: observe,
        stopObserving: stopObserving,
        on: on
    });
    Object.extend(document, {
        fire: fire.methodize(),
        observe: observe.methodize(),
        stopObserving: stopObserving.methodize(),
        on: on.methodize(),
        loaded: false
    });
    if (window.Event) Object.extend(window.Event, Event);
    else window.Event = Event;
})();
(function () {
    var timer;

    function fireContentLoadedEvent() {
        if (document.loaded) return;
        if (timer) window.clearTimeout(timer);
        document.loaded = true;
        document.fire('dom:loaded');
    }

    function checkReadyState() {
        if (document.readyState === 'complete') {
            document.stopObserving('readystatechange', checkReadyState);
            fireContentLoadedEvent();
        }
    }

    function pollDoScroll() {
        try {
            document.documentElement.doScroll('left');
        } catch (e) {
            timer = pollDoScroll.p_defer();
            return;
        }
        fireContentLoadedEvent();
    }
    if (document.addEventListener) {
        document.addEventListener('DOMContentLoaded', fireContentLoadedEvent, false);
    } else {
        document.observe('readystatechange', checkReadyState);
        if (window == top) timer = pollDoScroll.p_defer();
    }
    Event.observe(window, 'load', fireContentLoadedEvent);
})();
Element.addMethods();
Hash.toQueryString = Object.toQueryString;
var Toggle = {
    display: Element.toggle
};
Element.Methods.childOf = Element.Methods.descendantOf;
var Insertion = {
    Before: function (element, content) {
        return Element.insert(element, {
            before: content
        });
    },
    Top: function (element, content) {
        return Element.insert(element, {
            top: content
        });
    },
    Bottom: function (element, content) {
        return Element.insert(element, {
            bottom: content
        });
    },
    After: function (element, content) {
        return Element.insert(element, {
            after: content
        });
    }
};
var $continue = new Error('"throw $continue" is deprecated, use "return" instead');
var Position = {
    includeScrollOffsets: false,
    prepare: function () {
        this.deltaX = window.pageXOffset || document.documentElement.scrollLeft || document.body.scrollLeft || 0;
        this.deltaY = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
    },
    within: function (element, x, y) {
        if (this.includeScrollOffsets) return this.withinIncludingScrolloffsets(element, x, y);
        this.xcomp = x;
        this.ycomp = y;
        this.offset = Element.cumulativeOffset(element);
        return (y >= this.offset[1] && y < this.offset[1] + element.offsetHeight && x >= this.offset[0] && x < this.offset[0] + element.offsetWidth);
    },
    withinIncludingScrolloffsets: function (element, x, y) {
        var offsetcache = Element.cumulativeScrollOffset(element);
        this.xcomp = x + offsetcache[0] - this.deltaX;
        this.ycomp = y + offsetcache[1] - this.deltaY;
        this.offset = Element.cumulativeOffset(element);
        return (this.ycomp >= this.offset[1] && this.ycomp < this.offset[1] + element.offsetHeight && this.xcomp >= this.offset[0] && this.xcomp < this.offset[0] + element.offsetWidth);
    },
    overlap: function (mode, element) {
        if (!mode) return 0;
        if (mode == 'vertical') return ((this.offset[1] + element.offsetHeight) - this.ycomp) / element.offsetHeight;
        if (mode == 'horizontal') return ((this.offset[0] + element.offsetWidth) - this.xcomp) / element.offsetWidth;
    },
    cumulativeOffset: Element.Methods.cumulativeOffset,
    positionedOffset: Element.Methods.positionedOffset,
    absolutize: function (element) {
        Position.prepare();
        return Element.absolutize(element);
    },
    relativize: function (element) {
        Position.prepare();
        return Element.relativize(element);
    },
    realOffset: Element.Methods.cumulativeScrollOffset,
    offsetParent: Element.Methods.getOffsetParent,
    page: Element.Methods.viewportOffset,
    clone: function (source, target, options) {
        options = options || {};
        return Element.clonePosition(target, source, options);
    }
};
if (!document.getElementsByClassName) document.getElementsByClassName = function (instanceMethods) {
    function iter(name) {
        return name.blank() ? null : "[contains(concat(' ', @class, ' '), ' " + name + " ')]";
    }
    instanceMethods.getElementsByClassName = Prototype.BrowserFeatures.XPath ? function (element, className) {
        className = className.toString().strip();
        var cond = /\s/.test(className) ? $w(className).map(iter).join('') : iter(className);
        return cond ? document._getElementsByXPath('.//*' + cond, element) : [];
    } : function (element, className) {
        className = className.toString().strip();
        var elements = [],
            classNames = (/\s/.test(className) ? $w(className) : null);
        if (!classNames && !className) return elements;
        var nodes = $(element).getElementsByTagName('*');
        className = ' ' + className + ' ';
        for (var i = 0, child, cn; child = nodes[i]; i++) {
            if (child.className && (cn = ' ' + child.className + ' ') && (cn.include(className) || (classNames && classNames.all(function (name) {
                return !name.toString().blank() && cn.include(' ' + name + ' ');
            })))) elements.push(Element.extend(child));
        }
        return elements;
    };
    return function (className, parentElement) {
        return $(parentElement || document.body).getElementsByClassName(className);
    };
}(Element.Methods);
Element.ClassNames = Class.create();
Element.ClassNames.prototype = {
    initialize: function (element) {
        this.element = $(element);
    },
    _each: function (iterator) {
        this.element.className.split(/\s+/).select(function (name) {
            return name.length > 0;
        })._each(iterator);
    },
    set: function (className) {
        this.element.className = className;
    },
    add: function (classNameToAdd) {
        if (this.include(classNameToAdd)) return;
        this.set($A(this).concat(classNameToAdd).join(' '));
    },
    remove: function (classNameToRemove) {
        if (!this.include(classNameToRemove)) return;
        this.set($A(this).without(classNameToRemove).join(' '));
    },
    toString: function () {
        return $A(this).join(' ');
    }
};
Object.extend(Element.ClassNames.prototype, Enumerable);
(function () {
    window.Selector = Class.create({
        initialize: function (expression) {
            this.expression = expression.strip();
        },
        findElements: function (rootElement) {
            return Prototype.Selector.select(this.expression, rootElement);
        },
        match: function (element) {
            return Prototype.Selector.match(element, this.expression);
        },
        toString: function () {
            return this.expression;
        },
        inspect: function () {
            return "#<Selector: " + this.expression + ">";
        }
    });
    Object.extend(Selector, {
        matchElements: function (elements, expression) {
            var match = Prototype.Selector.match,
                results = [];
            for (var i = 0, length = elements.length; i < length; i++) {
                var element = elements[i];
                if (match(element, expression)) {
                    results.push(Element.extend(element));
                }
            }
            return results;
        },
        findElement: function (elements, expression, index) {
            index = index || 0;
            var matchIndex = 0,
                element;
            for (var i = 0, length = elements.length; i < length; i++) {
                element = elements[i];
                if (Prototype.Selector.match(element, expression) && index === matchIndex++) {
                    return Element.extend(element);
                }
            }
        },
        findChildElements: function (element, expressions) {
            var selector = expressions.toArray().join(', ');
            return Prototype.Selector.select(selector, element || document);
        }
    });
})();;
if (window.console === undefined) {
    if (!window.console || !console.firebug) {
        (function (m, i) {
            window.console = {};
            var e = function () {};
            while (i--) {
                window.console[m[i]] = e;
            }
        })('log debug info warn error assert dir dirxml trace group groupEnd time timeEnd profile profileEnd count'.split(' '), 16);
    }
    window.console.error = function (e) {
        throw (e);
    };
}
window.requestAnimFrame = (function () {
    return window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.oRequestAnimationFrame || window.msRequestAnimationFrame || function (callback) {
        window.setTimeout(callback, 1000 / 60);
    };
})();
if (window.Prototype === undefined) {
    throw ("Error:prototype.js is required by protoplus.js. Go to prototypejs.org and download lates version.");
}
Protoplus = {
    Version: "0.9.9",
    exec: function (code) {
        return eval(code);
    },
    REFIDCOUNT: 100,
    references: {},
    getIEVersion: function () {
        var rv = -1;
        if (navigator.appName == 'Microsoft Internet Explorer') {
            var ua = navigator.userAgent;
            var re = new RegExp("MSIE ([0-9]{1,}[\\.0-9]{0,})");
            if (re.exec(ua) !== null) {
                rv = parseFloat(RegExp.$1);
            }
        }
        return rv;
    },
    Transitions: {
        linear: function (x) {
            return x;
        },
        sineIn: function (x) {
            return 1 - Math.cos(x * Math.PI / 2);
        },
        sineOut: function (x) {
            return Math.sin(x * Math.PI / 2);
        },
        sineInOut: function (x) {
            return 0.5 - Math.cos(x * Math.PI) / 2;
        },
        backIn: function (b) {
            var a = 1.70158;
            return (b) * b * ((a + 1) * b - a);
        },
        backOut: function (b) {
            var a = 1.70158;
            return (b = b - 1) * b * ((a + 1) * b + a) + 1;
        },
        backInOut: function (b) {
            var a = 1.70158;
            if ((b /= 0.5) < 1) {
                return 0.5 * (b * b * (((a *= (1.525)) + 1) * b - a));
            }
            return 0.5 * ((b -= 2) * b * (((a *= (1.525)) + 1) * b + a) + 2);
        },
        cubicIn: function (x) {
            return Math.pow(x, 3);
        },
        cubicOut: function (x) {
            return 1 + Math.pow(x - 1, 3);
        },
        cubicInOut: function (x) {
            return x < 0.5 ? 4 * Math.pow(x, 3) : 1 + 4 * Math.pow(x - 1, 3);
        },
        quadIn: function (x) {
            return Math.pow(x, 2);
        },
        quadOut: function (x) {
            return 1 - Math.pow(x - 1, 2);
        },
        quadInOut: function (x) {
            return x < 0.5 ? 2 * Math.pow(x, 2) : 1 - 2 * Math.pow(x - 1, 2);
        },
        quartIn: function (x) {
            return Math.pow(x, 4);
        },
        quartOut: function (x) {
            return 1 - Math.pow(x - 1, 4);
        },
        quartInOut: function (x) {
            return x < 0.5 ? 8 * Math.pow(x, 4) : 1 - 8 * Math.pow(x - 1, 4);
        },
        quintIn: function (x) {
            return Math.pow(x, 5);
        },
        quintOut: function (x) {
            return 1 + Math.pow(x - 1, 5);
        },
        quintInOut: function (x) {
            return x < 0.5 ? 16 * Math.pow(x, 5) : 1 + 16 * Math.pow(x - 1, 5);
        },
        circIn: function (x) {
            return 1 - Math.sqrt(1 - Math.pow(x, 2));
        },
        circOut: function (x) {
            return Math.sqrt(1 - Math.pow(x - 1, 2));
        },
        circInOut: function (x) {
            return x < 0.5 ? 0.5 - Math.sqrt(1 - Math.pow(2 * x, 2)) * 0.5 : 0.5 + Math.sqrt(1 - Math.pow(2 * x - 2, 2)) * 0.5;
        },
        expoIn: function (x) {
            return Math.pow(2, 10 * (x - 1));
        },
        expoOut: function (x) {
            return 1 - Math.pow(2, -10 * x);
        },
        expoInOut: function (x) {
            x = 2 * x - 1;
            return x < 0 ? Math.pow(2, 10 * x) / 2 : 1 - Math.pow(2, -10 * x) / 2;
        },
        swingFrom: function (b) {
            var a = 1.70158;
            return b * b * ((a + 1) * b - a);
        },
        swingTo: function (b) {
            var a = 1.70158;
            return (b -= 1) * b * ((a + 1) * b + a) + 1;
        },
        swingFromTo: function (b) {
            var a = 1.70158;
            return ((b /= 0.5) < 1) ? 0.5 * (b * b * (((a *= (1.525)) + 1) * b - a)) : 0.5 * ((b -= 2) * b * (((a *= (1.525)) + 1) * b + a) + 2);
        },
        easeFrom: function (a) {
            return Math.pow(a, 4);
        },
        easeTo: function (a) {
            return Math.pow(a, 0.25);
        },
        easeFromTo: function (a) {
            if ((a /= 0.5) < 1) {
                return 0.5 * Math.pow(a, 4);
            }
            return -0.5 * ((a -= 2) * Math.pow(a, 3) - 2);
        },
        pulse: function (x, n) {
            if (!n) {
                n = 1;
            }
            return 0.5 - Math.cos(x * n * 2 * Math.PI) / 2;
        },
        wobble: function (x, n) {
            if (!n) {
                n = 3;
            }
            return 0.5 - Math.cos((2 * n - 1) * x * x * Math.PI) / 2;
        },
        elastic: function (x, e) {
            var a;
            if (!e) {
                a = 30;
            } else {
                e = Math.round(Math.max(1, Math.min(10, e)));
                a = (11 - e) * 5;
            }
            return 1 - Math.cos(x * 8 * Math.PI) / (a * x + 1) * (1 - x);
        },
        bounce: function (x, n) {
            n = n ? Math.round(n) : 4;
            var c = 3 - Math.pow(2, 2 - n);
            var m = -1,
                d = 0,
                i = 0;
            while (m / c < x) {
                d = Math.pow(2, 1 - i++);
                m += d;
            }
            if (m - d > 0) {
                x -= ((m - d) + d / 2) / c;
            }
            return c * c * Math.pow(x, 2) + (1 - Math.pow(0.25, i - 1));
        },
        bouncePast: function (a) {
            if (a < (1 / 2.75)) {
                return (7.5625 * a * a);
            } else {
                if (a < (2 / 2.75)) {
                    return 2 - (7.5625 * (a -= (1.5 / 2.75)) * a + 0.75);
                } else {
                    if (a < (2.5 / 2.75)) {
                        return 2 - (7.5625 * (a -= (2.25 / 2.75)) * a + 0.9375);
                    } else {
                        return 2 - (7.5625 * (a -= (2.625 / 2.75)) * a + 0.984375);
                    }
                }
            }
        }
    },
    Colors: {
        colorNames: {
            "Black": "#000000",
            "MidnightBlue": "#191970",
            "Navy": "#000080",
            "DarkBlue": "#00008B",
            "MediumBlue": "#0000CD",
            "Blue": "#0000FF",
            "DodgerBlue": "#1E90FF",
            "RoyalBlue": "#4169E1",
            "SlateBlue": "#6A5ACD",
            "SteelBlue": "#4682B4",
            "CornflowerBlue": "#6495ED",
            "Teal": "#008080",
            "DarkCyan": "#008B8B",
            "MediumSlateBlue": "#7B68EE",
            "CadetBlue": "#5F9EA0",
            "DeepSkyBlue": "#00BFFF",
            "DarkTurquoise": "#00CED1",
            "MediumAquaMarine": "#66CDAA",
            "MediumTurquoise": "#48D1CC",
            "Turquoise": "#40E0D0",
            "LightSkyBlue": "#87CEFA",
            "SkyBlue": "#87CEEB",
            "Aqua": "#00FFFF",
            "Cyan": "#00FFFF",
            "Aquamarine": "#7FFFD4",
            "PaleTurquoise": "#AFEEEE",
            "PowderBlue": "#B0E0E6",
            "LightBlue": "#ADD8E6",
            "LightSteelBlue": "#B0C4DE",
            "Salmon": "#FA8072",
            "LightSalmon": "#FFA07A",
            "Coral": "#FF7F50",
            "Brown": "#A52A2A",
            "Sienna": "#A0522D",
            "Tomato": "#FF6347",
            "Maroon": "#800000",
            "DarkRed": "#8B0000",
            "Red": "#FF0000",
            "OrangeRed": "#FF4500",
            "Darkorange": "#FF8C00",
            "DarkGoldenRod": "#B8860B",
            "GoldenRod": "#DAA520",
            "Orange": "#FFA500",
            "Gold": "#FFD700",
            "Yellow": "#FFFF00",
            "LemonChiffon": "#FFFACD",
            "LightGoldenRodYellow": "#FAFAD2",
            "LightYellow": "#FFFFE0",
            "DarkOliveGreen": "#556B2F",
            "DarkSeaGreen": "#8FBC8F",
            "DarkGreen": "#006400",
            "MediumSeaGreen": "#3CB371",
            "DarkKhaki": "#BDB76B",
            "Green": "#008000",
            "Olive": "#808000",
            "OliveDrab": "#6B8E23",
            "ForestGreen": "#228B22",
            "LawnGreen": "#7CFC00",
            "Lime": "#00FF00",
            "YellowGreen": "#9ACD32",
            "LimeGreen": "#32CD32",
            "Chartreuse": "#7FFF00",
            "GreenYellow": "#ADFF2F",
            "LightSeaGreen": "#20B2AA",
            "SeaGreen": "#2E8B57",
            "SandyBrown": "#F4A460",
            "DarkSlateGray": "#2F4F4F",
            "DimGray": "#696969",
            "Gray": "#808080",
            "SlateGray": "#708090",
            "LightSlateGray": "#778899",
            "DarkGray": "#A9A9A9",
            "Silver": "#C0C0C0",
            "Indigo": "#4B0082",
            "Purple": "#800080",
            "DarkMagenta": "#8B008B",
            "BlueViolet": "#8A2BE2",
            "DarkOrchid": "#9932CC",
            "DarkViolet": "#9400D3",
            "DarkSlateBlue": "#483D8B",
            "MediumPurple": "#9370D8",
            "MediumOrchid": "#BA55D3",
            "Fuchsia": "#FF00FF",
            "Magenta": "#FF00FF",
            "Orchid": "#DA70D6",
            "Violet": "#EE82EE",
            "DeepPink": "#FF1493",
            "Pink": "#FFC0CB",
            "MistyRose": "#FFE4E1",
            "LightPink": "#FFB6C1",
            "Plum": "#DDA0DD",
            "HotPink": "#FF69B4",
            "SpringGreen": "#00FF7F",
            "MediumSpringGreen": "#00FA9A",
            "LightGreen": "#90EE90",
            "PaleGreen": "#98FB98",
            "RosyBrown": "#BC8F8F",
            "MediumVioletRed": "#C71585",
            "IndianRed": "#CD5C5C",
            "SaddleBrown": "#8B4513",
            "Peru": "#CD853F",
            "Chocolate": "#D2691E",
            "Tan": "#D2B48C",
            "LightGrey": "#D3D3D3",
            "PaleVioletRed": "#D87093",
            "Thistle": "#D8BFD8",
            "Crimson": "#DC143C",
            "FireBrick": "#B22222",
            "Gainsboro": "#DCDCDC",
            "BurlyWood": "#DEB887",
            "LightCoral": "#F08080",
            "DarkSalmon": "#E9967A",
            "Lavender": "#E6E6FA",
            "LavenderBlush": "#FFF0F5",
            "SeaShell": "#FFF5EE",
            "Linen": "#FAF0E6",
            "Khaki": "#F0E68C",
            "PaleGoldenRod": "#EEE8AA",
            "Wheat": "#F5DEB3",
            "NavajoWhite": "#FFDEAD",
            "Moccasin": "#FFE4B5",
            "PeachPuff": "#FFDAB9",
            "Bisque": "#FFE4C4",
            "BlanchedAlmond": "#FFEBCD",
            "AntiqueWhite": "#FAEBD7",
            "PapayaWhip": "#FFEFD5",
            "Beige": "#F5F5DC",
            "OldLace": "#FDF5E6",
            "Cornsilk": "#FFF8DC",
            "Ivory": "#FFFFF0",
            "FloralWhite": "#FFFAF0",
            "HoneyDew": "#F0FFF0",
            "WhiteSmoke": "#F5F5F5",
            "AliceBlue": "#F0F8FF",
            "LightCyan": "#E0FFFF",
            "GhostWhite": "#F8F8FF",
            "MintCream": "#F5FFFA",
            "Azure": "#F0FFFF",
            "Snow": "#FFFAFA",
            "White": "#FFFFFF"
        },
        getPalette: function () {
            var generated = {};
            var cr = ['00', '44', '77', '99', 'BB', 'EE', 'FF'];
            var i = 0;
            for (var r = 0; r < cr.length; r++) {
                for (var g = 0; g < cr.length; g++) {
                    for (var b = 0; b < cr.length; b++) {
                        generated[(i++) + "_"] = '#' + cr[r] + cr[g] + cr[b];
                    }
                }
            }
            return generated;
        },
        getRGBarray: function (color) {
            if (typeof color == "string") {
                if (color.indexOf("rgb") > -1) {
                    color = color.replace(/rgb\(|\).*?$/g, "").split(/,\s*/, 3);
                } else {
                    color = color.replace("#", "");
                    if (color.length == 3) {
                        color = color.replace(/(.)/g, function (n) {
                            return parseInt(n + n, 16) + ", ";
                        }).replace(/,\s*$/, "").split(/,\s+/);
                    } else {
                        color = color.replace(/(..)/g, function (n) {
                            return parseInt(n, 16) + ", ";
                        }).replace(/,\s*$/, "").split(/,\s+/);
                    }
                }
            }
            for (var x = 0; x < color.length; x++) {
                color[x] = Number(color[x]);
            }
            return color;
        },
        rgbToHex: function () {
            var ret = [];
            var ret2 = [];
            for (var i = 0; i < arguments.length; i++) {
                ret.push((arguments[i] < 16 ? "0" : "") + Math.round(arguments[i]).toString(16));
            }
            return "#" + ret.join('').toUpperCase();
        },
        hexToRgb: function (str) {
            str = str.replace("#", "");
            var ret = [];
            if (str.length == 3) {
                str.replace(/(.)/g, function (str) {
                    ret.push(parseInt(str + str, 16));
                });
            } else {
                str.replace(/(..)/g, function (str) {
                    ret.push(parseInt(str, 16));
                });
            }
            return ret;
        },
        invert: function (hex) {
            var rgb = Protoplus.Colors.hexToRgb(hex);
            return Protoplus.Colors.rgbToHex(255 - rgb[0], 255 - rgb[1], 255 - rgb[2]);
        }
    },
    Profiler: {
        stimes: {},
        start: function (title) {
            Protoplus.Profiler.stimes[title] = (new Date()).getTime();
        },
        end: function (title, ret) {
            var res = (((new Date()).getTime() - Protoplus.Profiler.stimes[title]) / 1000).toFixed(3);
            if (ret) {
                return res;
            }
            msg = title + ' took ' + res;
            if ('console' in window) {
                console.log(msg);
            }
        }
    }
};
Object.extend(Hash.prototype, {
    debug: function (opts) {
        opts = opts ? opts : {};
        node = this._object;
        text = opts.text ? opts.text + "\n" : "";
        for (var e in node) {
            if (typeof node[e] == "function" && !opts.showFunctions) {
                continue;
            }
            if (opts.skipBlanks && (node[e] === "" || node[e] === undefined)) {
                continue;
            }
            var stophere = confirm(text + e + " => " + node[e]);
            if (stophere) {
                return node[e];
            }
        }
    }
});
Object.extend(Object, {
    deepClone: function (obj) {
        if (typeof obj !== 'object' || obj === null) {
            return obj;
        }
        var clone = Object.isArray(obj) ? [] : {};
        for (var i in obj) {
            var node = obj[i];
            if (typeof node == 'object') {
                if (Object.isArray(node)) {
                    clone[i] = [];
                    for (var j = 0; j < node.length; j++) {
                        if (typeof node[j] != 'object') {
                            clone[i].push(node[j]);
                        } else {
                            clone[i].push(this.deepClone(node[j]));
                        }
                    }
                } else {
                    clone[i] = this.deepClone(node);
                }
            } else {
                clone[i] = node;
            }
        }
        return clone;
    },
    isBoolean: function (bool) {
        return (bool === true || bool === false);
    },
    isRegExp: function (obj) {
        return !!(obj && obj.test && obj.exec && (obj.ignoreCase || obj.ignoreCase === false));
    }
});
Object.extend(String.prototype, {
    cleanJSON: function () {
        return this.replace(/(\"?)(\:|\,)\s+(\"?)/g, '$1$2$3');
    },
    shorten: function (length, closure) {
        length = length ? length : "30";
        closure = closure ? closure : "...";
        var sh = this.substr(0, length);
        sh += (this.length > length) ? closure : "";
        return sh;
    },
    squeeze: function (length) {
        length = length ? length : "30";
        var join = "...";
        if ((length - join.length) >= this.length) {
            return this;
        }
        var l = Math.floor((length - join.length) / 2);
        var start = this.substr(0, l + 1);
        var end = this.substr(-(l), l);
        return start + join + end;
    },
    printf: function () {
        var args = arguments;
        var word = this.toString(),
            i = 0;
        return word.replace(/(\%(\w))/gim, function (word, match, tag, count) {
            var s = args[i] !== undefined ? args[i] : '';
            i++;
            switch (tag) {
                case "f":
                    return parseFloat(s).toFixed(2);
                case "d":
                    return parseInt(s, 10);
                case "x":
                    return s.toString(16);
                case "X":
                    return s.toString(16).toUpperCase();
                case "s":
                    return s;
                default:
                    return match;
            }
        });
    },
    sanitize: function () {
        var str = this;
        return (str + '').replace(/[\\"']/g, '\\$&').replace(/\u0000/g, '\\0');
    },
    nl2br: function (is_xhtml) {
        var str = this;
        var breakTag = (is_xhtml || typeof is_xhtml === 'undefined') ? '<br />' : '<br>';
        return (str + '').replace(/([^>\r\n]?)(\r\n|\n\r|\r|\n)/g, '$1' + breakTag + '');
    },
    stripslashes: function () {
        var str = this;
        return (str + '').replace(/\\(.?)/g, function (s, n1) {
            switch (n1) {
                case '\\':
                    return '\\';
                case '0':
                    return '\u0000';
                case '':
                    return '';
                default:
                    return n1;
            }
        });
    },
    turkishToUpper: function () {
        var string = this;
        var letters = {
            "i": "İ",
            "ş": "Ş",
            "ğ": "Ğ",
            "ü": "Ü",
            "ö": "Ö",
            "ç": "Ç",
            "ı": "I"
        };
        string = string.replace(/([iışğüçö])+/g, function (letter) {
            return letters[letter];
        });
        return string.toUpperCase();
    },
    turkishToLower: function () {
        var string = this;
        var letters = {
            "İ": "i",
            "I": "ı",
            "Ş": "ş",
            "Ğ": "ğ",
            "Ü": "ü",
            "Ö": "ö",
            "Ç": "ç"
        };
        string = string.replace(/([İIŞĞÜÇÖ])+/g, function (letter) {
            return letters[letter];
        });
        return string.toLowerCase();
    },
    toCamelCase: function () {
        var str = this;
        newStr = str.replace(/\s+/g, '_');
        strArr = newStr.split('_');
        if (strArr.length === 0) {
            return newStr;
        }
        newStr = "";
        for (var i = 0; i < strArr.length; i++) {
            newStr += strArr[i][0].toUpperCase();
            newStr += strArr[i].substr(1);
        }
        return newStr;
    },
    fixUTF: function () {
        var lowerCase = {
            "a": "00E1:0103:01CE:00E2:00E4:0227:1EA1:0201:00E0:1EA3:0203:0101:0105:1D8F:1E9A:00E5:1E01:2C65:00E3:0251:1D90",
            "b": "1E03:1E05:0253:1E07:1D6C:1D80:0180:0183",
            "c": "0107:010D:00E7:0109:0255:010B:0188:023C",
            "d": "010F:1E11:1E13:0221:1E0B:1E0D:0257:1E0F:1D6D:1D81:0111:0256:018C",
            "e": "00E9:0115:011B:0229:00EA:1E19:00EB:0117:1EB9:0205:00E8:1EBB:0207:0113:2C78:0119:1D92:0247:1EBD:1E1B",
            "f": "1E1F:0192:1D6E:1D82",
            "g": "01F5:011F:01E7:0123:011D:0121:0260:1E21:1D83:01E5",
            "h": "1E2B:021F:1E29:0125:2C68:1E27:1E23:1E25:0266:1E96:0127",
            "i": "0131:00ED:012D:01D0:00EE:00EF:1ECB:0209:00EC:1EC9:020B:012B:012F:1D96:0268:0129:1E2D",
            "j": "01F0:0135:029D:0249",
            "k": "1E31:01E9:0137:2C6A:A743:1E33:0199:1E35:1D84:A741",
            "l": "013A:019A:026C:013E:013C:1E3D:0234:1E37:2C61:A749:1E3B:0140:026B:1D85:026D:0142:0269:1D7C",
            "m": "1E3F:1E41:1E43:0271:1D6F:1D86",
            "n": "0144:0148:0146:1E4B:0235:1E45:1E47:01F9:0272:1E49:019E:1D70:1D87:0273:00F1",
            "o": "00F3:014F:01D2:00F4:00F6:022F:1ECD:0151:020D:00F2:1ECF:01A1:020F:A74B:A74D:2C7A:014D:01EB:00F8:00F5",
            "p": "1E55:1E57:A753:01A5:1D71:1D88:A755:1D7D:A751",
            "q": "A759:02A0:024B:A757",
            "r": "0155:0159:0157:1E59:1E5B:0211:027E:0213:1E5F:027C:1D72:1D89:024D:027D",
            "s": "015B:0161:015F:015D:0219:1E61:1E63:0282:1D74:1D8A:023F",
            "t": "0165:0163:1E71:021B:0236:1E97:2C66:1E6B:1E6D:01AD:1E6F:1D75:01AB:0288:0167",
            "u": "00FA:016D:01D4:00FB:1E77:00FC:1E73:1EE5:0171:0215:00F9:1EE7:01B0:0217:016B:0173:1D99:016F:0169:1E75:1D1C:1D7E",
            "v": "2C74:A75F:1E7F:028B:1D8C:2C71:1E7D",
            "w": "1E83:0175:1E85:1E87:1E89:1E81:2C73:1E98",
            "x": "1E8D:1E8B:1D8D",
            "y": "00FD:0177:00FF:1E8F:1EF5:1EF3:01B4:1EF7:1EFF:0233:1E99:024F:1EF9",
            "z": "017A:017E:1E91:0291:2C6C:017C:1E93:0225:1E95:1D76:1D8E:0290:01B6:0240",
            "ae": "00E6:01FD:01E3",
            "dz": "01F3:01C6",
            "3": "0292:01EF:0293:1D9A:01BA:01B7:01EE"
        };
        var upperCase = {
            "A": "00C1:0102:01CD:00C2:00C4:0226:1EA0:0200:00C0:1EA2:0202:0100:0104:00C5:1E00:023A:00C3",
            "B": "1E02:1E04:0181:1E06:0243:0182",
            "C": "0106:010C:00C7:0108:010A:0187:023B",
            "D": "010E:1E10:1E12:1E0A:1E0C:018A:1E0E:0110:018B",
            "E": "00C9:0114:011A:0228:00CA:1E18:00CB:0116:1EB8:0204:00C8:1EBA:0206:0112:0118:0246:1EBC:1E1A",
            "F": "1E1E:0191",
            "G": "01F4:011E:01E6:0122:011C:0120:0193:1E20:01E4:0262:029B",
            "H": "1E2A:021E:1E28:0124:2C67:1E26:1E22:1E24:0126",
            "I": "00CD:012C:01CF:00CE:00CF:0130:1ECA:0208:00CC:1EC8:020A:012A:012E:0197:0128:1E2C:026A:1D7B",
            "J": "0134:0248",
            "K": "1E30:01E8:0136:2C69:A742:1E32:0198:1E34:A740",
            "L": "0139:023D:013D:013B:1E3C:1E36:2C60:A748:1E3A:013F:2C62:0141:029F:1D0C",
            "M": "1E3E:1E40:1E42:2C6E",
            "N": "0143:0147:0145:1E4A:1E44:1E46:01F8:019D:1E48:0220:00D1",
            "O": "00D3:014E:01D1:00D4:00D6:022E:1ECC:0150:020C:00D2:1ECE:01A0:020E:A74A:A74C:014C:019F:01EA:00D8:00D5",
            "P": "1E54:1E56:A752:01A4:A754:2C63:A750",
            "Q": "A758:A756",
            "R": "0154:0158:0156:1E58:1E5A:0210:0212:1E5E:024C:2C64",
            "S": "015A:0160:015E:015C:0218:1E60:1E62",
            "T": "0164:0162:1E70:021A:023E:1E6A:1E6C:01AC:1E6E:01AE:0166",
            "U": "00DA:016C:01D3:00DB:1E76:00DC:1E72:1EE4:0170:0214:00D9:1EE6:01AF:0216:016A:0172:016E:0168:1E74",
            "V": "A75E:1E7E:01B2:1E7C",
            "W": "1E82:0174:1E84:1E86:1E88:1E80:2C72",
            "X": "1E8C:1E8A",
            "Y": "00DD:0176:0178:1E8E:1EF4:1EF2:01B3:1EF6:1EFE:0232:024E:1EF8",
            "Z": "0179:017D:1E90:2C6B:017B:1E92:0224:1E94:01B5",
            "AE": "00C6:01FC:01E2",
            "DZ": "01F1:01C4"
        };
        var str = this.toString();
        for (var lk in lowerCase) {
            var lvalue = '\\u' + lowerCase[lk].split(':').join('|\\u');
            str = str.replace(new RegExp(lvalue, 'gm'), lk);
        }
        for (var uk in upperCase) {
            var uvalue = '\\u' + upperCase[uk].split(':').join('|\\u');
            str = str.replace(new RegExp(uvalue, 'gm'), uk);
        }
        return str;
    },
    ucFirst: function () {
        return this.charAt(0).toUpperCase() + this.substr(1, this.length + 1);
    }
});
var __result = document.URL.toQueryParams();
Object.extend(document, {
    createCSS: function (selector, declaration) {
        var id = "style-" + selector.replace(/\W/gim, '');
        if ($(id)) {
            $(id).remove();
        }
        var ua = navigator.userAgent.toLowerCase();
        var isIE = (/msie/.test(ua)) && !(/opera/.test(ua)) && (/win/.test(ua));
        var style_node = document.createElement("style");
        style_node.id = id;
        style_node.setAttribute("type", "text/css");
        style_node.setAttribute("media", "screen");
        if (!isIE) {
            style_node.appendChild(document.createTextNode(selector + " {" + declaration + "}"));
        }
        document.getElementsByTagName("head")[0].appendChild(style_node);
        if (isIE && document.styleSheets && document.styleSheets.length > 0) {
            var last_style_node = document.styleSheets[document.styleSheets.length - 1];
            if (typeof (last_style_node.addRule) == "object") {
                last_style_node.addRule(selector, declaration);
            }
        }
    },
    selectRadioOption: function (options, value) {
        options.each(function (ele) {
            if (ele.value === value) {
                ele.checked = true;
            }
        });
    },
    preloadImages: function (images) {
        var args = arguments;
        if (Object.isArray(images)) {
            args = images;
        }
        var i = 0;
        for (i = 0, images = [];
        (src = args[i]); i++) {
            images.push(new Image());
            images.last().src = src;
        }
    },
    readRadioOption: function (options) {
        for (var i = 0; i < options.length; i++) {
            var ele = options[i];
            if (ele.checked === true) {
                return ele.value;
            }
        }
        return false;
    },
    getEvent: function (ev) {
        if (!ev) {
            ev = window.event;
        }
        if (!ev.keyCode && ev.keyCode !== 0) {
            ev.keyCode = ev.which;
        }
        return ev;
    },
    parameters: __result,
    get: __result,
    ready: function (func) {
        document.observe("dom:loaded", func);
    },
    getUnderneathElement: function (e) {
        var pointX = (Prototype.Browser.WebKit) ? Event.pointerX(e) : e.clientX;
        var pointY = (Prototype.Browser.WebKit) ? Event.pointerY(e) : e.clientY;
        return document.elementFromPoint(pointX, pointY);
    },
    createCookie: function (name, value, days, path) {
        path = path ? path : "/";
        var expires = "";
        if (days) {
            var date = new Date();
            date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
            expires = ";expires=" + date.toGMTString();
        }
        document.cookie = name + "=" + escape(value) + expires + ";path=" + path;
    },
    readCookie: function (name) {
        var nameEQ = name + "=";
        var ca = document.cookie.split(';');
        for (var i = 0; i < ca.length; i++) {
            var c = ca[i];
            while (c.charAt(0) == ' ') {
                c = c.substring(1, c.length);
            }
            if (c.indexOf(nameEQ) === 0) {
                return decodeURIComponent(c.substring(nameEQ.length, c.length));
            }
        }
        return null;
    },
    eraseCookie: function (name) {
        document.createCookie(name, "", -1);
    },
    storeJsonCookie: function (name, value, days) {
        var val = Object.toJSON(value).cleanJSON();
        document.createCookie(name, val, days);
    },
    readJsonCookie: function (name) {
        if (document.readCookie(name)) {
            return document.readCookie(name).toString().evalJSON();
        } else {
            return {};
        }
    },
    getClientDimensions: function () {
        var head = document.body.parentNode;
        return {
            height: head.scrollHeight,
            width: head.scrollWidth
        };
    },
    keyboardMap: function (map) {
        document.keyMap = map;
        var shortcut = {
            'all_shortcuts': {},
            'add': function (shortcut_combination, callback, opt) {
                var default_options = {
                    'type': 'keydown',
                    'propagate': false,
                    'disable_in_input': false,
                    'target': document,
                    'keycode': false
                };
                if (!opt) {
                    opt = default_options;
                } else {
                    for (var dfo in default_options) {
                        if (typeof opt[dfo] == 'undefined') {
                            opt[dfo] = default_options[dfo];
                        }
                    }
                }
                var ele = opt.target;
                if (typeof opt.target == 'string') {
                    ele = document.getElementById(opt.target);
                }
                var ths = this;
                shortcut_combination = shortcut_combination.toLowerCase();
                var func = function (e) {
                    e = e || window.event;
                    if (opt.disable_in_input) {
                        var element;
                        if (e.target) {
                            element = e.target;
                        } else if (e.srcElement) {
                            element = e.srcElement;
                        }
                        if (element.nodeType == 3) {
                            element = element.parentNode;
                        }
                        if (element.tagName == 'INPUT' || element.tagName == 'TEXTAREA' || document._onedit) {
                            return;
                        }
                    }
                    if (e.keyCode) {
                        code = e.keyCode;
                    } else if (e.which) {
                        code = e.which;
                    }
                    var character = String.fromCharCode(code).toLowerCase();
                    if (code == 188) {
                        character = ",";
                    }
                    if (code == 190) {
                        character = ".";
                    }
                    var keys = shortcut_combination.split("+");
                    var kp = 0;
                    var shift_nums = {
                        "`": "~",
                        "1": "!",
                        "2": "@",
                        "3": "#",
                        "4": "$",
                        "5": "%",
                        "6": "^",
                        "7": "&",
                        "8": "*",
                        "9": "(",
                        "0": ")",
                        "-": "_",
                        "=": "+",
                        ";": ":",
                        "'": "\"",
                        ",": "<",
                        ".": ">",
                        "/": "?",
                        "\\": "|"
                    };
                    var special_keys = {
                        'esc': 27,
                        'escape': 27,
                        'tab': 9,
                        'space': 32,
                        'return': 13,
                        'enter': 13,
                        'backspace': 8,
                        'scrolllock': 145,
                        'scroll_lock': 145,
                        'scroll': 145,
                        'capslock': 20,
                        'caps_lock': 20,
                        'caps': 20,
                        'numlock': 144,
                        'num_lock': 144,
                        'num': 144,
                        'pause': 19,
                        'break': 19,
                        'insert': 45,
                        'home': 36,
                        'delete': 46,
                        'end': 35,
                        'pageup': 33,
                        'page_up': 33,
                        'pu': 33,
                        'pagedown': 34,
                        'page_down': 34,
                        'pd': 34,
                        'left': 37,
                        'up': 38,
                        'right': 39,
                        'down': 40,
                        'f1': 112,
                        'f2': 113,
                        'f3': 114,
                        'f4': 115,
                        'f5': 116,
                        'f6': 117,
                        'f7': 118,
                        'f8': 119,
                        'f9': 120,
                        'f10': 121,
                        'f11': 122,
                        'f12': 123
                    };
                    var modifiers = {
                        shift: {
                            wanted: false,
                            pressed: false
                        },
                        ctrl: {
                            wanted: false,
                            pressed: false
                        },
                        alt: {
                            wanted: false,
                            pressed: false
                        },
                        meta: {
                            wanted: false,
                            pressed: false
                        }
                    };
                    if (e.ctrlKey) {
                        modifiers.ctrl.pressed = true;
                    }
                    if (e.shiftKey) {
                        modifiers.shift.pressed = true;
                    }
                    if (e.altKey) {
                        modifiers.alt.pressed = true;
                    }
                    if (e.metaKey) {
                        modifiers.meta.pressed = true;
                    }
                    for (var i = 0; i < keys.length; i++) {
                        k = keys[i];
                        if (k == 'ctrl' || k == 'control') {
                            kp++;
                            modifiers.ctrl.wanted = true;
                        } else if (k == 'shift') {
                            kp++;
                            modifiers.shift.wanted = true;
                        } else if (k == 'alt') {
                            kp++;
                            modifiers.alt.wanted = true;
                        } else if (k == 'meta') {
                            kp++;
                            modifiers.meta.wanted = true;
                        } else if (k.length > 1) {
                            if (special_keys[k] == code) {
                                kp++;
                            }
                        } else if (opt.keycode) {
                            if (opt.keycode == code) {
                                kp++;
                            }
                        } else {
                            if (character == k) {
                                kp++;
                            } else {
                                if (shift_nums[character] && e.shiftKey) {
                                    character = shift_nums[character];
                                    if (character == k) {
                                        kp++;
                                    }
                                }
                            }
                        }
                    }
                    if (kp == keys.length && modifiers.ctrl.pressed == modifiers.ctrl.wanted && modifiers.shift.pressed == modifiers.shift.wanted && modifiers.alt.pressed == modifiers.alt.wanted && modifiers.meta.pressed == modifiers.meta.wanted) {
                        callback(e);
                        if (!opt.propagate) {
                            e.cancelBubble = true;
                            e.returnValue = false;
                            if (e.stopPropagation) {
                                e.stopPropagation();
                                e.preventDefault();
                            }
                            return false;
                        }
                    }
                };
                this.all_shortcuts[shortcut_combination] = {
                    'callback': func,
                    'target': ele,
                    'event': opt.type
                };
                if (ele.addEventListener) {
                    ele.addEventListener(opt.type, func, false);
                } else if (ele.attachEvent) {
                    ele.attachEvent('on' + opt.type, func);
                } else {
                    ele['on' + opt.type] = func;
                }
            },
            'remove': function (shortcut_combination) {
                shortcut_combination = shortcut_combination.toLowerCase();
                var binding = this.all_shortcuts[shortcut_combination];
                delete(this.all_shortcuts[shortcut_combination]);
                if (!binding) {
                    return;
                }
                var type = binding.event;
                var ele = binding.target;
                var callback = binding.callback;
                if (ele.detachEvent) {
                    ele.detachEvent('on' + type, callback);
                } else if (ele.removeEventListener) {
                    ele.removeEventListener(type, callback, false);
                } else {
                    ele['on' + type] = false;
                }
            }
        };
        $H(map).each(function (pair) {
            var key = pair.key;
            var opts = pair.value;
            shortcut.add(key, opts.handler, {
                disable_in_input: opts.disableOnInputs
            });
        });
    },
    checkDocType: function () {
        if (document.doctype === null) {
            return false;
        }
        var publicId = document.doctype.publicId.toLowerCase();
        return (publicId.indexOf("html 4") > 0) || (publicId.indexOf("xhtml") > 0);
    }
});
Object.extend(Event, {
    mousewheel: Prototype.Browser.Gecko ? 'DOMMouseScroll' : 'mousewheel',
    wheel: function (event) {
        var delta = 0;
        if (!event) {
            event = window.event;
        }
        if (event.wheelDelta) {
            delta = event.wheelDelta / 120;
            if (window.opera) {
                delta = -delta;
            }
        } else if (event.detail) {
            delta = -event.detail / 3;
        }
        return Math.round(delta);
    },
    isInput: function (e) {
        var element;
        if (e.target) {
            element = e.target;
        } else if (e.srcElement) {
            element = e.srcElement;
        }
        if (element.nodeType == 3) {
            element = element.parentNode;
        }
        if (element.tagName == 'INPUT' || element.tagName == 'TEXTAREA') {
            return true;
        }
        return false;
    },
    isRightClick: function (event) {
        var _isButton;
        if (Prototype.Browser.IE) {
            var buttonMap = {
                0: 1,
                1: 4,
                2: 2
            };
            _isButton = function (event, code) {
                return event.button === buttonMap[code];
            };
        } else if (Prototype.Browser.WebKit) {
            _isButton = function (event, code) {
                switch (code) {
                    case 0:
                        return event.which == 1 && !event.metaKey;
                    case 1:
                        return event.which == 1 && event.metaKey;
                    case 2:
                        return event.which == 3 && !event.metaKey;
                    default:
                        return false;
                }
            };
        } else {
            _isButton = function (event, code) {
                return event.which ? (event.which === code + 1) : (event.button === code);
            };
        }
        return _isButton(event, 2);
    }
});
Protoplus.utils = {
    cloneElem: function (element) {
        if (Prototype.Browser.IE) {
            var div = document.createElement('div');
            div.innerHTML = element.outerHTML;
            return $(div.firstChild);
        }
        return element.cloneNode(true);
    },
    openInNewTab: function (element, link) {
        element.observe('mouseover', function (e) {
            if (!element.tabLink) {
                var a = new Element('a', {
                    href: link,
                    target: '_blank'
                }).insert('&nbsp;&nbsp;');
                a.setStyle('opacity:0; z-index:100000; height:5px; width:5px; position:absolute; top:' + (Event.pointerY(e) - 2.5) + 'px;left:' + (Event.pointerX(e) - 2.5) + 'px');
                a.observe('click', function () {
                    element.tabLinked = false;
                    a.remove();
                });
                $(document.body).insert(a);
                element.tabLink = a;
                element.observe('mousemove', function (e) {
                    element.tabLink.setStyle('top:' + (Event.pointerY(e) - 2.5) + 'px;left:' + (Event.pointerX(e) - 2.5) + 'px');
                });
            }
        });
        return element;
    },
    hasFixedContainer: function (element) {
        var result = false;
        element.ancestors().each(function (el) {
            if (result) {
                return;
            }
            if (el.style.position == "fixed") {
                result = true;
            }
        });
        return result;
    },
    getCurrentStyle: function (element, name) {
        if (element.style[name]) {
            return element.style[name];
        } else if (element.currentStyle) {
            return element.currentStyle[name];
        } else if (document.defaultView && document.defaultView.getComputedStyle) {
            name = name.replace(/([A-Z])/g, "-$1");
            name = name.toLowerCase();
            s = document.defaultView.getComputedStyle(element, "");
            return s && s.getPropertyValue(name);
        } else {
            return null;
        }
    },
    isOverflow: function (element) {
        if (element.resized) {
            element.hideHandlers();
        }
        var curOverflow = element.style.overflow;
        if (!curOverflow || curOverflow === "visible") {
            element.style.overflow = "hidden";
        }
        var leftOverflowing = element.clientWidth < element.scrollWidth;
        var topOverflowing = element.clientHeight < element.scrollHeight;
        var isOverflowing = leftOverflowing || topOverflowing;
        element.style.overflow = curOverflow;
        if (element.resized) {
            element.showHandlers();
        }
        return isOverflowing ? {
            top: topOverflowing ? element.scrollHeight : false,
            left: leftOverflowing ? element.scrollWidth : false,
            both: leftOverflowing && topOverflowing
        } : false;
    },
    setUnselectable: function (target) {
        if (typeof target.style.MozUserSelect != "undefined" && target.className == "form-section-closed") {
            target.style.MozUserSelect = "normal";
        } else if (typeof target.onselectstart != "undefined") {
            target.onselectstart = function () {
                return false;
            };
        } else if (typeof target.style.MozUserSelect != "undefined") {
            target.style.MozUserSelect = "none";
        } else {
            target.onmousedown = function () {
                return false;
            };
        }
        target.__oldCursor = target.style.cursor;
        target.style.cursor = 'default';
        return target;
    },
    setSelectable: function (target) {
        if (typeof target.onselectstart != "undefined") {
            target.onselectstart = document.createElement("div").onselectstart;
        } else if (typeof target.style.MozUserSelect != "undefined") {
            target.style.MozUserSelect = document.createElement("div").style.MozUserSelect;
        } else {
            target.onmousedown = "";
        }
        if (target.__oldCursor) {
            target.style.cursor = target.__oldCursor;
        } else {
            target.style.cursor = '';
        }
        return target;
    },
    selectText: function (element) {
        var r1 = "";
        if (document.selection) {
            r1 = document.body.createTextRange();
            r1.moveToElementText(element);
            r1.setEndPoint("EndToEnd", r1);
            r1.moveStart('character', 4);
            r1.moveEnd('character', 8);
            r1.select();
        } else {
            s = window.getSelection();
            r1 = document.createRange();
            r1.setStartBefore(element);
            r1.setEndAfter(element);
            s.addRange(r1);
        }
        return element;
    },
    hover: function (elem, over, out) {
        $(elem).observe("mouseover", function (evt) {
            if (typeof over == "function") {
                if (elem.innerHTML) {
                    if (elem.descendants().include(evt.relatedTarget)) {
                        return true;
                    }
                }
                over(elem, evt);
            } else if (typeof over == "string") {
                $(elem).addClassName(over);
            }
        });
        $(elem).observe("mouseout", function (evt) {
            if (typeof out == "function") {
                if (elem.innerHTML) {
                    if (elem.descendants().include(evt.relatedTarget)) {
                        return true;
                    }
                }
                out(elem, evt);
            } else if (typeof over == "string") {
                $(elem).removeClassName(over);
            }
        });
        return elem;
    },
    mouseEnter: function (elem, over, out) {
        $(elem).observe("mouseenter", function (evt) {
            if (typeof over == "function") {
                over(elem, evt);
            } else if (typeof over == "string") {
                $(elem).addClassName(over);
            }
        });
        $(elem).observe("mouseleave", function (evt) {
            if (typeof out == "function") {
                out(elem, evt);
            } else if (typeof over == "string") {
                $(elem).removeClassName(over);
            }
        });
        return elem;
    },
    setScroll: function (element, amounts) {
        if (amounts.x !== undefined) {
            element.scrollLeft = amounts.x;
        }
        if (amounts.y !== undefined) {
            element.scrollTop = amounts.y;
        }
    },
    scrollInto: function (element, options) {
        options = Object.extend({
            offset: [100, 100],
            direction: 'bottom'
        }, options || {});
        element = $(element);
        var pos = Element.cumulativeOffset(element);
        var vp = document.viewport.getDimensions();
        var ed = Element.getDimensions(element);
        switch (options.direction) {
            case 'bottom':
                if (pos[1] + options.offset[1] >= vp.height + window.scrollY) {
                    window.scrollTo(window.scrollX, (pos[1] + options.offset[1]) - vp.height);
                } else if (window.scrollY !== 0 && (pos[1] + options.offset[1] <= Math.abs(vp.height - window.scrollY))) {
                    window.scrollTo(window.scrollX, (pos[1] + options.offset[1]) - vp.height);
                }
                break;
            case "top":
                var height = element.getHeight();
                if (window.scrollY !== 0 && pos[1] <= window.scrollY + options.offset[1]) {
                    window.scrollTo(window.scrollX, pos[1] - options.offset[1]);
                } else if (window.scrollY !== 0 && (pos[1] + options.offset[1] <= Math.abs(vp.height - window.scrollY))) {
                    window.scrollTo(window.scrollX, pos[1] - options.offset[1]);
                }
                break;
        }
        return element;
    },
    getScroll: function (element) {
        return {
            x: parseFloat(element.scrollLeft),
            y: parseFloat(element.scrollTop)
        };
    },
    setText: function (element, value) {
        element.innerHTML = value;
        return element;
    },
    putValue: function (element, value) {
        if (element.clearHint) {
            element.clearHint();
        }
        element.value = value;
        return element;
    },
    resetUpload: function (element) {
        if (Prototype.Browser.IE) {
            var p = element.parentNode;
            var c = element.cloneNode(true);
            p.replaceChild(c, element);
            return c;
        }
        element.value = '';
        return element;
    },
    run: function (element, event) {
        if (event.include(':')) {
            element.fire(event);
        } else {
            var evt;
            if (document.createEventObject && !Prototype.Browser.IE9 && !Prototype.Browser.IE10) {
                evt = document.createEventObject();
                element.fireEvent('on' + event, evt);
            } else {
                evt = document.createEvent("HTMLEvents");
                evt.initEvent(event, true, true);
                element.dispatchEvent(evt);
            }
        }
        return element;
    },
    setCSSBorderRadius: function (element, value) {
        return element.setStyle({
            MozBorderRadius: value,
            borderRadius: value,
            '-webkit-border-radius': value
        });
    },
    getSelected: function (element) {
        if (!element.options) {
            if (element.innerHTML) {
                return element.innerHTML;
            } else {
                return element.value;
            }
        }
        var selected = element.selectedIndex >= 0 ? element.options[element.selectedIndex] : element;
        return selected;
    },
    selectOption: function (element, val) {
        if (!val) {
            return element;
        }
        $A(element.options).each(function (option) {
            if (Object.isRegExp(val) && (val.test(option.value) || val.test(option.text))) {
                option.selected = true;
                throw $break;
            }
            if (val == option.value || val == option.text) {
                option.selected = true;
            }
        });
        element.run('change');
        return element;
    },
    stopAnimation: function (element) {
        element.__stopAnimation = true;
        return element;
    },
    shift: function (element, options) {
        options = Object.extend({
            duration: 1,
            onEnd: Prototype.K,
            onStart: Prototype.K,
            onStep: Prototype.K,
            onCreate: Prototype.K,
            delay: 0,
            link: 'cancel',
            transparentColor: '#ffffff',
            remove: false,
            easingCustom: false,
            propertyEasings: {},
            easing: Protoplus.Transitions.sineOut
        }, options || {});
        if (!element.queue) {
            element.queue = [];
        }
        options.onCreate(element, options);
        if (options.link == "ignore" && element.timer) {
            return element;
        } else if ((options.link == "chain" || options.link == "queue") && element.timer) {
            element.queue.push(options);
            return element;
        }
        if (element.timer) {
            clearInterval(element.timer);
        }
        if (element.delayTime) {
            clearTimeout(element.delayTime);
        }
        if (typeof options.easing == 'string') {
            if (options.easing in Protoplus.Transitions) {
                options.easing = Protoplus.Transitions[options.easing];
            } else {
                options.easing = Protoplus.Transitions.sineOut;
            }
        } else if (typeof options.easing == 'object') {
            options.propertyEasings = options.easing;
            options.easing = Protoplus.Transitions.sineOut;
        } else if (typeof options.easing != 'function') {
            options.easing = Protoplus.Transitions.sineOut;
        }
        options.duration *= 1000;
        options.delay *= 1000;
        element.timer = false;
        var properties = {}, begin, end, init = function () {
            begin = new Date().getTime();
            end = begin + options.duration;
            options.onStart(element);
        };
        for (var x in options) {
            if (!["duration", "onStart", "onStep", "transparentColor", "onEnd", "onCreate", "remove", "easing", "link", "delay", "easingCustom", "propertyEasings"].include(x) && options[x] !== false) {
                properties[x] = options[x];
            }
        }
        var unitRex = /\d+([a-zA-Z%]+)$/;
        for (var i in properties) {
            var okey = i,
                oval = properties[i];
            var to, from, key, unit, s = [],
                easing = options.easing;
            if (["scrollX", "scrollLeft", "scrollY", "scrollTop"].include(okey)) {
                to = parseFloat(oval);
                key = (okey == "scrollX") ? "scrollLeft" : (okey == "scrollY") ? "scrollTop" : okey;
                if (element.tagName == "BODY") {
                    from = (okey == "scrollX" || okey == "scrollLeft") ? window.scrollX : window.scrollY;
                } else {
                    from = (okey == "scrollX" || okey == "scrollLeft") ? element.scrollLeft : element.scrollTop;
                }
                unit = '';
            } else if (okey == "rotate") {
                to = parseFloat(oval);
                key = "-webkit-transform";
                from = Element.getStyle(element, '-webkit-transform') ? parseInt(Element.getStyle(element, '-webkit-transform').replace(/rotate\(|\)/gim, ""), 10) : 0;
                unit = 'deg';
            } else if (["background", "color", "borderColor", "backgroundColor"].include(okey)) {
                if (oval == 'transparent') {
                    oval = options.transparentColor;
                }
                to = Protoplus.Colors.hexToRgb(oval);
                key = okey == "background" ? "backgroundColor" : okey;
                var bgcolor = Element.getStyle(element, key);
                if (!bgcolor || bgcolor == 'transparent') {
                    bgcolor = options.transparentColor;
                }
                from = Protoplus.Colors.getRGBarray(bgcolor);
                unit = '';
            } else if (okey == "opacity") {
                to = (typeof oval == "string") ? parseInt(oval, 10) : oval;
                key = okey;
                from = Element.getStyle(element, okey);
                unit = '';
                from = parseFloat(from);
            } else {
                to = (typeof oval == "string") ? parseInt(oval, 10) : oval;
                key = okey;
                from = Element.getStyle(element, okey.replace("-webkit-", "").replace("-moz-", "")) || "0px";
                unit = okey == 'opacity' ? '' : (unitRex.test(from)) ? from.match(unitRex)[1] : 'px';
                from = parseFloat(from);
            }
            if (okey in options.propertyEasings) {
                easing = Protoplus.Transitions[options.propertyEasings[okey]];
            }
            if (!to && to !== 0) {
                try {
                    s[key] = oval;
                    element.style[key] = oval;
                } catch (e) {}
            } else {
                properties[okey] = {
                    key: key,
                    to: to,
                    from: from,
                    unit: unit,
                    easing: easing
                };
            }
        }
        var fn = function (ease, option, arr) {
            var val = 0;
            if (arr !== false) {
                return Math.round(option.from[arr] + ease * (option.to[arr] - option.from[arr]));
            }
            return (option.from + ease * (option.to - option.from));
        };
        element.__stopAnimation = false;
        var step = function () {
            var time = new Date().getTime(),
                okey, oval, rgb;
            if (element.__stopAnimation === true) {
                clearInterval(element.timer);
                element.timer = false;
                element.__stopAnimation = false;
                return;
            }
            if (time >= end) {
                clearInterval(element.timer);
                element.timer = false;
                var valTo = (options.easing == "pulse" || options.easing == Protoplus.Transitions.pulse) ? "from" : "to";
                for (okey in properties) {
                    oval = properties[okey];
                    if (["scrollX", "scrollLeft", "scrollY", "scrollTop"].include(okey)) {
                        if (element.tagName.toUpperCase() == "BODY") {
                            if (oval.key == "scrollLeft") {
                                window.scrollTo(oval[valTo], window.scrollY);
                            } else {
                                window.scrollTo(window.scrollX, oval[valTo]);
                            }
                        } else {
                            element[oval.key] = oval[valTo] + oval.unit;
                        }
                    } else if (["background", "color", "borderColor", "backgroundColor"].include(okey)) {
                        element.style[oval.key] = 'rgb(' + oval[valTo].join(', ') + ")";
                    } else if (okey == "opacity") {
                        Element.setOpacity(element, oval[valTo]);
                    } else if (okey == "rotate") {
                        element.style[okey] = "rotate(" + oval[valTo] + oval.unit + ")";
                    } else {
                        element.style[okey] = oval[valTo] + oval.unit;
                    }
                }
                if (options.onEnd) {
                    options.onEnd(element);
                }
                if (options.remove) {
                    element.remove();
                }
                if (element.queue.length > 0) {
                    var que = element.queue.splice(0, 1);
                    element.shift(que[0]);
                }
                return element;
            }
            if (options.onStep) {
                options.onStep(element);
            }
            for (okey in properties) {
                oval = properties[okey];
                if (oval.key == "scrollLeft" || oval.key == "scrollTop") {
                    if (element.tagName.toUpperCase() == "BODY") {
                        var scroll = parseInt(fn(oval.easing((time - begin) / options.duration, options.easingCustom), oval, false), 10) + oval.unit;
                        if (oval.key == "scrollLeft") {
                            window.scrollTo(scroll, window.scrollY);
                        } else {
                            window.scrollTo(window.scrollX, scroll);
                        }
                    } else {
                        element[oval.key] = parseInt(fn(oval.easing((time - begin) / options.duration, options.easingCustom), oval, false), 10) + oval.unit;
                    }
                } else if (okey == "background" || okey == "color" || okey == "borderColor" || okey == "backgroundColor") {
                    rgb = [];
                    for (var x = 0; x < 3; x++) {
                        rgb[x] = fn(oval.easing((time - begin) / options.duration, options.easingCustom), oval, x);
                    }
                    element.style[oval.key] = 'rgb(' + rgb.join(', ') + ')';
                } else if (okey == "opacity") {
                    Element.setOpacity(element, fn(oval.easing((time - begin) / options.duration, options.easingCustom), oval, false));
                } else if (okey == "rotate") {
                    element.style[oval.key] = "rotate(" + fn(oval.easing((time - begin) / options.duration, options.easingCustom), oval, false) + oval.unit + ")";
                } else {
                    element.style[okey] = fn(oval.easing((time - begin) / options.duration, options.easingCustom), oval, false) + oval.unit;
                }
            }
        };
        if (options.delay) {
            element.delayTime = setTimeout(function () {
                init();
                element.timer = setInterval(step, 10);
            }, options.delay);
        } else {
            init();
            element.timer = setInterval(step, 10);
        }
        return element;
    },
    fade: function (element, options) {
        options = Object.extend({
            duration: 0.5,
            onEnd: function (e) {
                e.setStyle({
                    display: "none"
                });
            },
            onStart: Prototype.K,
            opacity: 0
        }, options || {});
        element.shift(options);
    },
    appear: function (element, options) {
        options = Object.extend({
            duration: 0.5,
            onEnd: Prototype.K,
            onStart: Prototype.K,
            opacity: 1
        }, options || {});
        element.setStyle({
            opacity: 0,
            display: "block"
        });
        element.shift(options);
    },
    disable: function (element) {
        element = $(element);
        element.disabled = true;
        return element;
    },
    enable: function (element) {
        element = $(element);
        element.disabled = false;
        return element;
    },
    setReference: function (element, name, reference) {
        if (!element.REFID) {
            element.REFID = Protoplus.REFIDCOUNT++;
        }
        if (!Protoplus.references[element.REFID]) {
            Protoplus.references[element.REFID] = {};
        }
        Protoplus.references[element.REFID][name] = $(reference);
        return element;
    },
    getReference: function (element, name) {
        if (!element.REFID) {
            return false;
        }
        return Protoplus.references[element.REFID][name];
    },
    remove: function (element) {
        if (element.REFID) {
            delete Protoplus.references[element.REFID];
        }
        if (element.parentNode) {
            element.parentNode.removeChild(element);
        }
        return element;
    }
};
(function (emile, container) {
    var parseEl = document.createElement('div'),
        props = ('backgroundColor borderBottomColor borderBottomWidth borderLeftColor borderLeftWidth ' + 'borderRightColor borderRightWidth borderSpacing borderTopColor borderTopWidth bottom color fontSize ' + 'fontWeight height left letterSpacing lineHeight marginBottom marginLeft marginRight marginTop maxHeight ' + 'maxWidth minHeight minWidth opacity outlineColor outlineOffset outlineWidth paddingBottom paddingLeft ' + 'paddingRight paddingTop right textIndent top width wordSpacing zIndex').split(' ');

    function interpolate(source, target, pos) {
        return (source + (target - source) * pos).toFixed(3);
    }

    function s(str, p, c) {
        return str.substr(p, c || 1);
    }

    function color(source, target, pos) {
        var i = 2,
            j = 3,
            c, tmp, v = [],
            r = [];
        j = 3;
        c = arguments[i - 1];
        while (i--) {
            if (s(c, 0) == 'r') {
                c = c.match(/\d+/g);
                while (j--) {
                    v.push(~~c[j]);
                }
            } else {
                if (c.length == 4) {
                    c = '#' + s(c, 1) + s(c, 1) + s(c, 2) + s(c, 2) + s(c, 3) + s(c, 3);
                }
                while (j--) {
                    v.push(parseInt(s(c, 1 + j * 2, 2), 16));
                }
            }
            j = 3;
            c = arguments[i - 1];
        }
        while (j--) {
            tmp = ~~ (v[j + 3] + (v[j] - v[j + 3]) * pos);
            r.push(tmp < 0 ? 0 : tmp > 255 ? 255 : tmp);
        }
        return 'rgb(' + r.join(',') + ')';
    }

    function parse(prop) {
        var p = parseFloat(prop),
            q = prop.replace(/^[\-\d\.]+/, '');
        return isNaN(p) ? {
            v: q,
            f: color,
            u: ''
        } : {
            v: p,
            f: interpolate,
            u: q
        };
    }

    function normalize(style) {
        var css, rules = {}, i = props.length,
            v;
        parseEl.innerHTML = '<div style="' + style + '"></div>';
        css = parseEl.childNodes[0].style;
        while (i--) {
            v = css[props[i]];
            if (v) {
                rules[props[i]] = parse(v);
            }
        }
        return rules;
    }
    container[emile] = function (el, style, opts) {
        el = typeof el == 'string' ? document.getElementById(el) : el;
        opts = opts || {};
        var target = normalize(style),
            comp = el.currentStyle ? el.currentStyle : getComputedStyle(el, null),
            prop, current = {}, start = +new Date(),
            dur = opts.duration || 200,
            finish = start + dur,
            interval, easing = opts.easing || function (pos) {
                return (-Math.cos(pos * Math.PI) / 2) + 0.5;
            };
        for (prop in target) {
            current[prop] = parse(comp[prop]);
        }
        interval = setInterval(function () {
            var time = +new Date(),
                pos = time > finish ? 1 : (time - start) / dur;
            for (var prop in target) {
                el.style[prop] = target[prop].f(current[prop].v, target[prop].v, easing(pos)) + target[prop].u;
            }
            if (time > finish) {
                clearInterval(interval);
                if (opts.after) {
                    opts.after();
                }
            }
        }, 10);
    };
})('emile', Protoplus.utils);
Element.addMethods(Protoplus.utils);
Event.observe(window, 'unload', function () {
    Protoplus = null;
});
Ajax = Object.extend(Ajax, {
    Jsonp: function (url, options) {
        this.options = Object.extend({
            method: 'post',
            timeout: 60,
            parameters: '',
            force: false,
            onComplete: Prototype.K,
            onSuccess: Prototype.K,
            onFail: Prototype.K
        }, options || {});
        var parameterString = url.match(/\?/) ? '&' : '?';
        this.response = false;
        Ajax.callback = function (response) {
            this.response = response;
        }.bind(this);
        this.callback = Ajax.callback;
        if (typeof this.options.parameters == "string") {
            parameterString += this.options.parameters;
        } else {
            $H(this.options.parameters).each(function (p) {
                parameterString += p.key + '=' + encodeURIComponent(p.value) + '&';
            });
        }
        var matches = /^(\w+:)?\/\/([^\/?#]+)/.exec(url);
        var sameDomain = (matches && (matches[1] && matches[1] != location.protocol || matches[2] != location.host));
        if (!sameDomain && this.options.force === false) {
            return new Ajax.Request(url, this.options);
        }
        this.url = url + parameterString + 'callbackName=Ajax.callback&nocache=' + new Date().getTime();
        this.script = new Element('script', {
            type: 'text/javascript',
            src: this.url
        });
        var errored = false;
        this.onError = function (e, b, c) {
            errored = true;
            this.options.onComplete({
                success: false,
                error: e || "Not Found"
            });
            this.options.onFail({
                success: false,
                error: e || "Not Found",
                args: [e, b, c]
            });
            this.script.remove();
            window.onerror = null;
            this.response = false;
        }.bind(this);
        this.onLoad = function (e) {
            if (errored) {
                return;
            }
            clearTimeout(timer);
            this.script.onreadystatechange = null;
            this.script.onload = null;
            var res = this.script;
            this.script.remove();
            window.onerror = null;
            if (this.response) {
                setTimeout(function () {
                    this.options.onComplete({
                        responseJSON: this.response
                    });
                    this.options.onSuccess({
                        responseJSON: this.response
                    });
                }.bind(this), 20);
            } else {
                this.onError({
                    error: 'Callback error'
                });
            }
        }.bind(this);
        this.readyState = function (e) {
            var rs = this.script.readyState;
            if (rs == 'loaded' || rs == 'complete') {
                this.onLoad();
            }
        }.bind(this);
        var timer = setTimeout(this.onError, this.options.timeout * 1000);
        this.script.onreadystatechange = this.readyState;
        this.script.onload = this.onLoad;
        window.onerror = function (e, b, c) {
            clearTimeout(timer);
            this.onError(e, b, c);
            return true;
        }.bind(this);
        $$('head')[0].appendChild(this.script);
        return this;
    }
});
var _alert = window.alert;
window.alert = function () {
    var args = arguments;
    var i = 1;
    var first = args[0];
    if (typeof first == "object") {
        $H(first).debug();
        return first;
    } else if (typeof first == "string") {
        var msg = first.replace(/(\%s)/gim, function (e) {
            return args[i++] || "";
        });
        _alert(msg);
        return true;
    }
    _alert(first);
};
var rand = function (min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
};
if ("__protoinit" in window) {
    document.ready(function (e) {
        $A(__protoinit).each(function (f) {
            f(e);
        });
    });
}
(function () {
    if (Prototype.Browser.WebKit) {
        var FIX_WEBKIT_FOCUS = function (e) {
            e.target.focus();
        };
        document.addEventListener('DOMNodeInserted', function (e) {
            if (e.target.tagName === 'BUTTON' || (e.target.tagName === 'INPUT' && e.target.type !== 'text')) {
                e.target.observe('click', FIX_WEBKIT_FOCUS);
            }
        }, false);
        document.observe('dom:loaded', function () {
            $$('button, input:not(input[type="text"])').invoke('observe', 'click', FIX_WEBKIT_FOCUS);
        });
    }
})();;
if (window.Protoplus === undefined) {
    throw ("Error: ProtoPlus is required by ProtoPlus-UI.js");
}
Object.extend(document, {
    getViewPortDimensions: function () {
        var height;
        var width;
        if (typeof window.innerWidth != 'undefined') {
            width = window.innerWidth;
            height = window.innerHeight;
        } else if (typeof document.documentElement != 'undefined' && typeof document.documentElement.clientWidth != 'undefined' && document.documentElement.clientWidth !== 0) {
            width = document.documentElement.clientWidth;
            height = document.documentElement.clientHeight;
        } else {
            width = document.getElementsByTagName('body')[0].clientWidth;
            height = document.getElementsByTagName('body')[0].clientHeight;
        }
        return {
            height: height,
            width: width
        };
    },
    stopTooltips: function () {
        document.stopTooltip = true;
        $$(".pp_tooltip_").each(function (t) {
            t.remove();
        });
        return true;
    },
    startTooltips: function () {
        document.stopTooltip = false;
    },
    windowDefaults: {
        height: false,
        width: 400,
        title: '&nbsp;',
        titleBackground: '#F5F5F5',
        buttonsBackground: '#F5F5F5',
        background: '#FFFFFF',
        top: '25%',
        left: '25%',
        winZindex: 10001,
        borderWidth: 10,
        borderColor: '#000',
        titleTextColor: '#777',
        resizable: false,
        borderOpacity: 0.3,
        borderRadius: "5px",
        titleClass: false,
        contentClass: false,
        buttonsClass: false,
        closeButton: 'X',
        openEffect: true,
        closeEffect: true,
        dim: true,
        modal: true,
        dimColor: '#fff',
        dimOpacity: 0.8,
        dimZindex: 10000,
        dynamic: true,
        contentPadding: '8',
        closeTo: false,
        buttons: false,
        buttonsAlign: 'right',
        hideTitle: false
    },
    window: function (options) {
        options = Object.extend(Object.deepClone(document.windowDefaults), options || {});
        options = Object.extend({
            onClose: Prototype.K,
            onInsert: Prototype.K,
            onDisplay: Prototype.K
        }, options, {});
        options.dim = (options.modal !== true) ? false : options.dim;
        options.width = options.width ? parseInt(options.width, 10) : '';
        options.height = (options.height) ? parseInt(options.height, 10) : false;
        options.borderWidth = parseInt(options.borderWidth, 10);
        var winWidth = (options.width ? (options.width == 'auto' ? 'auto' : options.width + 'px') : '');
        var titleStyle = {
            background: options.titleBackground,
            zIndex: 1000,
            position: 'relative',
            padding: '2px',
            borderBottom: '1px solid #C27A00',
            height: '35px',
            MozBorderRadius: '3px 3px 0px 0px',
            WebkitBorderRadius: '3px 3px 0px 0px',
            borderRadius: '3px 3px 0px 0px'
        };
        var dimmerStyle = {
            background: options.dimColor,
            height: '100%',
            width: '100%',
            position: 'fixed',
            top: '0px',
            left: '0px',
            opacity: options.dimOpacity,
            zIndex: options.dimZindex
        };
        var windowStyle = {
            top: options.top,
            left: options.left,
            position: 'absolute',
            padding: options.borderWidth + 'px',
            height: "auto",
            width: winWidth,
            zIndex: options.winZindex
        };
        var buttonsStyle = {
            padding: '0px',
            display: 'inline-block',
            width: '100%',
            borderTop: '1px solid #ffffff',
            background: options.buttonsBackground,
            zIndex: 999,
            position: 'relative',
            textAlign: options.buttonsAlign,
            MozBorderRadius: '0 0 3px 3px',
            WebkitBorderRadius: '0px 0px 3px 3px',
            borderRadius: '0px 0px 3px 3px'
        };
        var contentStyle = {
            zIndex: 1000,
            height: options.height !== false ? options.height + 'px' : "auto",
            position: 'relative',
            display: 'inline-block',
            width: '100%'
        };
        var wrapperStyle = {
            zIndex: 600,
            MozBorderRadius: '3px',
            WebkitBorderRadius: '3px',
            borderRadius: '3px'
        };
        var titleTextStyle = {
            fontWeight: 'bold',
            color: options.titleTextColor,
            textShadow: '0 1px 1px rgba(0, 0, 0, 0.5)',
            paddingLeft: '10px',
            fontSize: '13px'
        };
        var backgroundStyle = {
            height: '100%',
            width: '100%',
            background: options.borderColor,
            position: 'absolute',
            top: '0px',
            left: '0px',
            zIndex: -1,
            opacity: options.borderOpacity
        };
        var titleCloseStyle = {
            fontFamily: 'Arial, Helvetica, sans-serif',
            color: '#aaa',
            cursor: 'default'
        };
        var contentWrapperStyle = {
            padding: options.contentPadding + 'px',
            background: options.background
        };
        var dimmer;
        if (options.dim) {
            dimmer = new Element('div', {
                className: 'protoplus-dim'
            });
            dimmer.onmousedown = function () {
                return false;
            };
            dimmer.setStyle(dimmerStyle);
        }
        var win, tbody, tr, wrapper, background, title, title_table, title_text, title_close, content, buttons, contentWrapper, block = {};
        win = new Element('div');
        win.insert(background = new Element('div'));
        win.insert(wrapper = new Element('div'));
        wrapper.insert(title = new Element('div'));
        title.insert(title_table = new Element('table', {
            width: '100%',
            height: '100%'
        }).insert(tbody = new Element('tbody').insert(tr = new Element('tr'))));
        tr.insert(title_text = new Element('td', {
            valign: 'middle'
        }).setStyle('vertical-align: middle;'));
        tr.insert(title_close = new Element('td', {
            width: 20,
            align: 'center'
        }).setStyle('vertical-align: middle;'));
        wrapper.insert(contentWrapper = new Element('div', {
            className: 'window-content-wrapper'
        }).insert(content = new Element('div')).setStyle(contentWrapperStyle));
        win.setTitle = function (title) {
            title_text.update(title);
            return win;
        };
        win.blockWindow = function () {
            wrapper.insert(block = new Element('div').setStyle('position:absolute; top:0px; left:0px; height:100%; width:100%; opacity:0.5; background:#000; z-index:10000'));
            block.onclick = block.onmousedown = block.onmousemove = function () {
                return false;
            };
            return block;
        };
        win.unblockWindow = function () {
            block.remove();
            return win;
        };
        if (options.hideTitle) {
            title.hide();
            title_close = new Element('div').setStyle('text-align:center;');
            wrapper.insert(title_close.setStyle('position:absolute;z-index:1111000; right:5px; top:5px;'));
            contentWrapper.setStyle({
                MozBorderRadius: titleStyle.MozBorderRadius,
                WebkitBorderRadius: titleStyle.WebkitBorderRadius,
                borderRadius: titleStyle.borderRadius
            });
        }
        win.buttons = {};
        var buttonsDiv;
        if (options.buttons && options.buttons.length > 0) {
            wrapper.insert(buttons = new Element('div', {
                className: 'window-buttons-wrapper'
            }));
            if (!options.buttonsClass) {
                buttons.setStyle(buttonsStyle);
            } else {
                buttons.addClassName(options.buttonsClass);
            }
            buttons.insert(buttonsDiv = new Element('div').setStyle('padding:12px;height:23px;'));
            $A(options.buttons).each(function (button, i) {
                var color = button.color || 'grey';
                var but = new Element('button', {
                    className: 'big-button buttons buttons-' + color,
                    type: 'button',
                    name: button.name || "button-" + i,
                    id: button.id || "button-" + i
                }).observe('click', function () {
                    button.handler(win, but);
                });
                if (button.className) {
                    but.addClassName(button.className);
                }
                var butTitle = new Element('span').insert(button.title);
                if (button.icon) {
                    button.iconAlign = button.iconAlign || 'left';
                    var butIcon = new Element('img', {
                        src: button.icon,
                        align: button.iconAlign == 'right' ? 'absmiddle' : 'left'
                    }).addClassName("icon-" + button.iconAlign);
                    if (button.iconAlign == 'left') {
                        but.insert(butIcon);
                    }
                    but.insert(butTitle);
                    if (button.iconAlign == 'right') {
                        but.insert(butIcon);
                    }
                } else {
                    but.insert(butTitle);
                }
                if (button.align == 'left') {
                    but.setStyle('float:left');
                }
                but.changeTitle = function (title) {
                    butTitle.update(title);
                    return but;
                };
                but.updateImage = function (options) {
                    butIcon.src = options.icon;
                    options.iconAlign = options.iconAlign || button.iconAlign;
                    if (options.iconAlign == 'right') {
                        butIcon.removeClassName('icon-left');
                        butIcon.addClassName('icon-right');
                    } else {
                        butIcon.removeClassName('icon-right');
                        butIcon.addClassName('icon-left');
                    }
                };
                win.buttons[button.name] = but;
                if (button.hidden === true) {
                    but.hide();
                }
                if (button.disabled === true) {
                    but.disable();
                }
                if (button.style) {
                    but.setStyle(button.style);
                }
                buttonsDiv.insert(but);
            });
        } else {
            contentWrapper.setStyle({
                MozBorderRadius: buttonsStyle.MozBorderRadius,
                WebkitBorderRadius: buttonsStyle.WebkitBorderRadius,
                borderRadius: buttonsStyle.borderRadius
            });
        }
        win.setStyle(windowStyle);
        background.setStyle(backgroundStyle).setCSSBorderRadius(options.borderRadius);
        if (!options.titleClass) {
            title.setStyle(titleStyle);
        } else {
            title.addClassName(options.titleClass);
        }
        if (!options.contentClass) {
            content.setStyle(contentStyle).addClassName('window-content');
        } else {
            content.addClassName(options.contentClass);
        }
        wrapper.setStyle(wrapperStyle);
        title_text.setStyle(titleTextStyle);
        title_close.setStyle(titleCloseStyle);
        var closebox = function (key) {
            document._onedit = false;
            if (options.onClose(win, key) !== false) {
                var close = function () {
                    if (dimmer) {
                        dimmer.remove();
                        document.dimmed = false;
                    }
                    win.remove();
                    $(document.body).setStyle({
                        overflow: ''
                    });
                };
                if (options.closeEffect === true) {
                    win.shift({
                        opacity: 0,
                        duration: 0.3,
                        onEnd: close
                    });
                } else {
                    close();
                }
                Event.stopObserving(window, 'resize', win.reCenter);
                document.openWindows = $A(document.openWindows).collect(function (w) {
                    if (w !== win) {
                        return w;
                    }
                }).compact();
            }
        };
        if (options.dim) {
            $(document.body).insert(dimmer);
            document.dimmed = true;
        }
        title_text.insert(options.title);
        title_close.insert(options.closeButton);
        title_close.onclick = function () {
            closebox("CROSS");
        };
        content.insert(options.content);
        $(document.body).insert(win);
        if (options.openEffect === true) {
            win.setStyle({
                opacity: 0
            });
            win.shift({
                opacity: 1,
                duration: 0.5
            });
        }
        try {
            document._onedit = true;
            options.onInsert(win);
        } catch (e) {
            console.error(e);
        }
        var vp = document.viewport.getDimensions();
        var vso = $(document.body).cumulativeScrollOffset();
        var bvp = win.getDimensions();
        var top = ((vp.height - bvp.height) / 2) + vso.top;
        var left = ((vp.width - bvp.width) / 2) + vso.left;
        win.setStyle({
            top: top + "px",
            left: left + "px"
        });
        if (dimmer) {
            dimmer.setStyle({
                height: vp.height + 'px',
                width: vp.width + 'px'
            });
        }
        win.reCenter = function () {
            var vp = document.viewport.getDimensions();
            var vso = $(document.body).cumulativeScrollOffset();
            var bvp = win.getDimensions();
            var top = ((vp.height - bvp.height) / 2) + vso.top;
            var left = ((vp.width - bvp.width) / 2) + vso.left;
            win.setStyle({
                top: top + "px",
                left: left + "px"
            });
            if (dimmer) {
                dimmer.setStyle({
                    height: vp.height + 'px',
                    width: vp.width + 'px'
                });
            }
        };
        options.onDisplay(win);
        Event.observe(window, 'resize', win.reCenter);
        if (options.resizable) {
            wrapper.resizable({
                constrainViewport: true,
                element: content,
                sensitivity: 20,
                onResize: function (h, w, type) {
                    if (type != 'vertical') {
                        win.setStyle({
                            width: (w + (options.borderWidth * 2) - 10) + 'px'
                        });
                    }
                    if (content.isOverflow()) {
                        content.setStyle({
                            overflow: 'auto'
                        });
                    } else {
                        content.setStyle({
                            overflow: ''
                        });
                    }
                }
            });
        }
        win.setDraggable({
            handler: title_text,
            constrainViewport: true,
            dynamic: options.dynamic,
            dragEffect: false
        });
        win.close = closebox;
        document.openWindows.push(win);
        return win;
    }
});
document.observe('keyup', function (e) {
    e = document.getEvent(e);
    if (Event.isInput(e)) {
        return;
    }
    if (document.openWindows.length > 0) {
        if (e.keyCode == 27) {
            document.openWindows.pop().close('ESC');
        }
    }
});
document.openWindows = [];
document.createNewWindow = document.window;
Protoplus.ui = {
    isVisible: function (element) {
        element = $(element);
        if (!element.parentNode) {
            return false;
        }
        if (element && element.tagName == "BODY") {
            return true;
        }
        if (element.style.display == "none" || element.style.visibility == "hidden") {
            return false;
        }
        return Protoplus.ui.isVisible(element.parentNode);
    },
    editable: function (elem, options) {
        elem = $(elem);
        options = Object.extend({
            defaultText: " ",
            onStart: Prototype.K,
            onEnd: Prototype.K,
            processAfter: Prototype.K,
            processBefore: Prototype.K,
            onBeforeStart: Prototype.K,
            escapeHTML: false,
            doubleClick: false,
            onKeyUp: Prototype.K,
            className: false,
            options: [{
                text: "Please Select",
                value: "0"
            }],
            style: {
                background: "none",
                border: "none",
                color: "#333",
                fontStyle: "italic",
                width: "99%"
            },
            type: "text"
        }, options || {});
        elem.onStart = options.onStart;
        elem.onEnd = options.onEnd;
        elem.defaultText = options.defaultText;
        elem.processAfter = options.processAfter;
        elem.cleanWhitespace();
        try {
            elem.innerHTML = elem.innerHTML || elem.defaultText;
        } catch (e) {}
        var clickareas = [elem];
        if (options.labelEl) {
            clickareas.push($(options.labelEl));
        }
        $A(clickareas).invoke('observe', options.doubleClick ? "dblclick" : "click", function (e) {
            if (options.onBeforeStart(elem) === false) {
                return;
            }
            if (elem.onedit) {
                return;
            }
            elem.onedit = true;
            if (document.stopEditables) {
                return true;
            }
            document._onedit = true;
            document.stopTooltips();
            var currentValue = elem.innerHTML.replace(/^\s+|\s+$/gim, "");
            var type = options.type;
            var op = $A(options.options);
            var blur = function (e) {
                if (elem.keyEventFired) {
                    elem.keyEventFired = false;
                    return;
                }
                if (input.colorPickerEnabled) {
                    return;
                }
                input.stopObserving("blur", blur);
                elem.stopObserving("keypress", keypress);
                finish(e, currentValue);
            };
            var input = "";
            var keypress = function (e) {
                if (type == "textarea") {
                    return true;
                }
                if (e.shiftKey) {
                    return true;
                }
                if (input.colorPickerEnabled) {
                    return;
                }
                e = document.getEvent(e);
                if (e.keyCode == 13 || e.keyCode == 3) {
                    elem.keyEventFired = true;
                    elem.stopObserving("keypress", keypress);
                    input.stopObserving("blur", blur);
                    finish(e, currentValue);
                }
            };
            if (type.toLowerCase() == "textarea") {
                currentValue = currentValue.replace(/<br>/gi, "&lt;br&gt;");
            }
            currentValue = currentValue.unescapeHTML();
            currentValue = (currentValue == options.defaultText) ? "" : currentValue;
            currentValue = options.processBefore(currentValue, elem);
            if (type.toLowerCase() == "textarea") {
                input = new Element("textarea");
                input.value = currentValue;
                input.observe("blur", blur);
                input.observe('keyup', options.onKeyUp);
                try {
                    input.select();
                } catch (e) {}
            } else if (["select", "dropdown", "combo", "combobox"].include(type.toLowerCase())) {
                input = new Element("select").observe("change", function (e) {
                    elem.keyEventFired = true;
                    finish(e, currentValue);
                });
                if (typeof op[0] == "string") {
                    op.each(function (text) {
                        input.insert(new Element("option").insert(text));
                    });
                } else {
                    op.each(function (pair, i) {
                        input.insert(new Element("option", {
                            value: pair.value ? pair.value : i
                        }).insert(pair.text));
                    });
                }
                input.selectOption(currentValue);
                input.observe("blur", blur);
            } else if (["radio", "checkbox"].include(type.toLowerCase())) {
                input = new Element("div");
                if (typeof op[0] == "string") {
                    op.each(function (text, i) {
                        input.insert(new Element("input", {
                            type: type,
                            name: "pp",
                            id: "pl_" + i
                        })).insert(new Element("label", {
                            htmlFor: "pl_" + i,
                            id: "lb_" + i
                        }).insert(text)).insert("<br>");
                    });
                } else {
                    op.each(function (pair, i) {
                        input.insert(new Element("input", {
                            type: type,
                            name: "pp",
                            value: pair.value ? pair.value : i,
                            id: "pl_" + i
                        })).insert(new Element("label", {
                            htmlFor: "pl_" + i,
                            id: "lb_" + i
                        }).insert(pair.text)).insert("<br>");
                    });
                }
            } else {
                input = new Element("input", {
                    type: type,
                    value: currentValue
                });
                input.observe("blur", blur);
                input.observe('keyup', options.onKeyUp);
                input.select();
            }
            if (options.className !== false) {
                input.addClassName(options.className);
            } else {
                input.setStyle(options.style);
            }
            elem.update(input);
            elem.finishEdit = function () {
                blur({
                    target: input
                });
            };
            document._stopEdit = function () {
                elem.keyEventFired = true;
                finish({
                    target: input
                }, currentValue);
            };
            elem.onStart(elem, currentValue, input);
            setTimeout(function () {
                input.select();
            }, 100);
            elem.observe("keypress", keypress);
        });
        var finish = function (e, oldValue) {
            document._stopEdit = false;
            var elem = $(e.target);
            var val = "";
            if (!elem.parentNode) {
                return true;
            }
            var outer = $(elem.parentNode);
            outer.onedit = false;
            if ("select" == elem.nodeName.toLowerCase()) {
                val = elem.options[elem.selectedIndex].text;
            } else if (["checkbox", "radio"].include(elem.type && elem.type.toLowerCase())) {
                outer = $(elem.parentNode.parentNode);
                val = "";
                $(elem.parentNode).descendants().findAll(function (el) {
                    return el.checked === true;
                }).each(function (ch) {
                    if ($(ch.id.replace("pl_", "lb_"))) {
                        val += $(ch.id.replace("pl_", "lb_")).innerHTML + "<br>";
                    }
                });
            } else {
                val = elem.value;
            }
            if (val === "" && outer.defaultText) {
                outer.update(outer.defaultText);
            } else {
                outer.update(outer.processAfter(val, outer, elem.getSelected() || val, oldValue));
            }
            document._onedit = false;
            document.startTooltips();
            outer.onEnd(outer, outer.innerHTML, oldValue, elem.getSelected() || val);
        };
        return elem;
    },
    setShadowColor: function (elem, color) {
        elem = $(elem);
        $A(elem.descendants()).each(function (node) {
            if (node.nodeType == Node.ELEMENT_NODE) {
                node.setStyle({
                    color: color
                });
            }
        });
        return elem;
    },
    cleanShadow: function (elem) {
        elem = $(elem);
        elem.descendants().each(function (e) {
            if (e.className == "pp_shadow") {
                e.remove();
            }
        });
        return elem;
    },
    getParentContext: function (element) {
        element = $(element);
        try {
            if (!element.parentNode) {
                return false;
            }
            if (element._contextMenuEnabled) {
                return element;
            }
            if (element.tagName == 'BODY') {
                return false;
            }
            return $(element.parentNode).getParentContext();
        } catch (e) {
            alert(e);
        }
    },
    hasContextMenu: function (element) {
        return !!element._contextMenuEnabled;
    },
    setContextMenu: function (element, options) {
        element = $(element);
        options = Object.extend({
            others: []
        }, options || {});
        element._contextMenuEnabled = true;
        element.items = {};
        $A(options.menuItems).each(function (item, i) {
            if (item == '-') {
                element.items["seperator_" + i] = item;
            } else {
                if (!item.name) {
                    element.items["item_" + i] = item;
                } else {
                    element.items[item.name] = item;
                }
            }
        });
        element.changeButtonText = function (button, text) {
            element.items[button].title = text;
            return $(element.items[button].elem).select('.context-menu-item-text')[0].update(text);
        };
        element.getButton = function (button) {
            return element.items[button].elem;
        };
        element.showButton = function (button) {
            element.items[button].hidden = false;
        };
        element.hideButton = function (button) {
            element.items[button].hidden = true;
        };
        element.enableButton = function (button) {
            element.items[button].disabled = false;
        };
        element.disableButton = function (button) {
            element.items[button].disabled = true;
        };
        element.options = options;
        options.others.push(element);
        var createListItem = function (context, item) {
            var liItem = new Element('li').observe('contextmenu', Event.stop);
            if (Object.isString(item) && item == "-") {
                liItem.insert("<hr>");
                liItem.addClassName('context-menu-separator');
                context.insert(liItem);
            } else {
                if (item.icon) {
                    var img = new Element('img', {
                        src: item.icon,
                        className: (item.iconClassName || ''),
                        align: 'left'
                    }).setStyle('margin:0 4px 0 0;');
                    liItem.insert(img);
                } else {
                    liItem.setStyle('padding-left:24px');
                }
                item.handler = item.handler || Prototype.K;
                if (!item.disabled) {
                    liItem.addClassName('context-menu-item');
                    liItem.observe('click', function (e) {
                        Event.stop(e);
                        item.handler.bind(element)();
                        $$('.context-menu-all').invoke('remove');
                    });
                } else {
                    liItem.addClassName('context-menu-item-disabled');
                }
                if (item.items) {
                    liItem.insert('<img align="right" src="images/right-handle.png" style="margin-top:2px;" />');
                    createInnerList(liItem, item);
                }
                if (item.hidden) {
                    liItem.hide();
                }
                liItem.insert(new Element('span', {
                    className: 'context-menu-item-text'
                }).update(item.title.shorten(26)));
                context.insert(liItem);
            }
            return liItem;
        };
        var getContPosition = function (container) {
            var w = document.viewport.getWidth();
            var l = container.getLayout();
            var p = container.up('.context-menu-all');
            var isNotFit = (l.get('width') + l.get('cumulative-left')) > (w - 200);
            if (!isNotFit && p && p.__pos) {
                pos = p.__pos;
            } else if (isNotFit) {
                pos = "left";
            } else {
                pos = "right";
            }
            container.__pos = pos;
            return pos;
        };
        var createInnerList = function (cont, itemConf) {
            var container = new Element('div', {
                className: 'context-menu-all'
            }).setStyle('z-index:1000000');
            var backPanel = new Element('div', {
                className: 'context-menu-back'
            }).setOpacity(0.98);
            var context = new Element('div', {
                className: 'context-menu'
            });
            container.insert(backPanel).insert(context);
            var title = new Element('div', {
                className: 'context-menu-title'
            }).observe('contextmenu', Event.stop);
            title.insert(itemConf.title.shorten(26));
            context.insert(title);
            var it = itemConf.items;
            if (Object.isFunction(itemConf.items)) {
                it = itemConf.items();
            }
            $A(it).each(function (item) {
                var liItem = createListItem(context, item);
            });
            cont.insert(container.hide());
            container.setStyle({
                position: 'absolute',
                top: '0px'
            });
            var t;
            var listopen = false;
            cont.mouseEnter(function () {
                if (itemConf.disabled) {
                    return;
                }
                if (listopen) {
                    return;
                }
                clearTimeout(t);
                container.show();
                listopen = true;
                var pos = getContPosition(container);
                container.style[pos] = '-' + (container.getWidth() - 5) + 'px';
            }, function () {
                clearTimeout(t);
                container.style.left = container.style.right = "";
                container.hide();
                listopen = false;
            });
        };
        var openMenu = function (e, local, opt) {
            opt = opt || {};
            Event.stop(e);
            if (local || (Prototype.Browser.Opera && e.ctrlKey) || Event.isRightClick(e) || Prototype.Browser.IE) {
                $$('.context-menu-all').invoke('remove');
                var element = e.target;
                element = element.getParentContext();
                if (element !== false) {
                    if (element.options.onStart) {
                        element.options.onStart();
                    }
                    var menuItems = element.menuItems;
                    var container = new Element('div', {
                        className: 'context-menu-all'
                    }).setStyle('z-index:1000000');
                    var backPanel = new Element('div', {
                        className: 'context-menu-back'
                    }).setOpacity(0.98);
                    var context = new Element('div', {
                        className: 'context-menu'
                    });
                    container.insert(backPanel).insert(context);
                    if (element.options.title) {
                        var title = new Element('div', {
                            className: 'context-menu-title'
                        }).observe('contextmenu', Event.stop);
                        title.insert(element.options.title);
                        context.insert(title);
                    }
                    $H(element.items).each(function (pair) {
                        var item = pair.value;
                        var liItem = createListItem(context, item);
                        element.items[pair.key].elem = liItem;
                    });
                    $(document.body).insert(container.hide());
                    var x = Event.pointer(e).x;
                    var y = Event.pointer(e).y;
                    var dim = document.viewport.getDimensions();
                    var cDim = context.getDimensions();
                    var sOff = document.viewport.getScrollOffsets();
                    var top = (y - sOff.top + cDim.height) > dim.height && (y - sOff.top) > cDim.height ? (y - cDim.height) - 20 : y;
                    var left = (x + cDim.width) > dim.width ? (dim.width - cDim.width) - 20 : x;
                    container.setStyle({
                        position: 'absolute',
                        top: (opt.top ? opt.top : top) + 'px',
                        left: (opt.left ? opt.left : left) + 'px'
                    });
                    if (element.options.onOpen) {
                        element.options.onOpen(context);
                    }
                    container.show();
                }
            }
        };
        element.openMenu = openMenu;
        $A(options.others).invoke('observe', Prototype.Browser.Opera ? 'click' : 'contextmenu', function (e) {
            e.stop();
            var ev = {};
            if (Prototype.Browser.IE) {
                for (var k in e) {
                    ev[k] = e[k];
                }
            } else {
                ev = e;
            }
            setTimeout(function () {
                openMenu(ev);
            }, 0);
        });
        if (!document.contextMenuHandlerSet) {
            document.contextMenuHandlerSet = true;
            $(document).observe('click', function (e) {
                $$('.context-menu-all').invoke('remove');
            });
        }
        return element;
    },
    textshadow: function (element, options) {
        element = $(element);
        options = Object.extend({
            light: "upleft",
            color: "#666",
            offset: 1,
            opacity: 1,
            padding: 0,
            glowOpacity: 0.1,
            align: undefined,
            imageLike: false
        }, options || {});
        var light = options.light;
        var color = options.color;
        var dist = options.offset;
        var opacity = options.opacity;
        var textalign = (options.align) ? options.align : $(elem).getStyle("textAlign");
        var padding = (options.padding) ? options.padding + "px" : $(elem).getStyle("padding");
        var text = elem.innerHTML;
        var container = new Element("div");
        var textdiv = new Element("div");
        var style = {
            color: color,
            height: element.getStyle("height"),
            width: element.getStyle("width"),
            "text-align": textalign,
            padding: padding,
            position: "absolute",
            "z-index": 100,
            opacity: opacity
        };
        elem.innerValue = text;
        elem.update("");
        container.setStyle({
            position: "relative"
        });
        textdiv.update(text);
        container.appendChild(textdiv);
        for (var i = 0; i < dist; i++) {
            var shadowdiv = new Element("div", {
                className: "pp_shadow"
            });
            shadowdiv.update(text);
            shadowdiv.setUnselectable();
            d = dist - i;
            shadowdiv.setStyle(style);
            switch (light) {
                case "down":
                    shadowdiv.setStyle({
                        top: "-" + d + "px"
                    });
                    break;
                case "up":
                    shadowdiv.setStyle({
                        top: d + "px"
                    });
                    break;
                case "left":
                    shadowdiv.setStyle({
                        top: "0px",
                        left: d + "px"
                    });
                    break;
                case "right":
                    shadowdiv.setStyle({
                        top: "0px",
                        left: "-" + d + "px"
                    });
                    break;
                case "upright":
                    shadowdiv.setStyle({
                        top: d + "px",
                        left: "-" + d + "px"
                    });
                    break;
                case "downleft":
                    shadowdiv.setStyle({
                        top: "-" + d + "px",
                        left: d + "px"
                    });
                    break;
                case "downright":
                    shadowdiv.setStyle({
                        top: "-" + d + "px",
                        left: "-" + d + "px"
                    });
                    break;
                case "wide":
                    shadowdiv.setStyle({
                        top: "0px",
                        left: "0px"
                    });
                    container.appendChild(new Element("div").setStyle(Object.extend(style, {
                        top: "0px",
                        left: "-" + d + "px"
                    })).update(text).setShadowColor(color).setUnselectable());
                    container.appendChild(new Element("div").setStyle(Object.extend(style, {
                        top: "0px",
                        left: d + "px"
                    })).update(text).setShadowColor(color).setUnselectable());
                    break;
                case "glow":
                    shadowdiv.setStyle({
                        top: "0px",
                        left: "0px"
                    });
                    container.appendChild(new Element("div").setStyle(Object.extend(style, {
                        top: d + "px",
                        opacity: options.glowOpacity
                    })).update(text).setShadowColor(color).setUnselectable());
                    container.appendChild(new Element("div").setStyle(Object.extend(style, {
                        top: "-" + d + "px",
                        opacity: options.glowOpacity
                    })).update(text).setShadowColor(color).setUnselectable());
                    container.appendChild(new Element("div").setStyle(Object.extend(style, {
                        top: d + "px",
                        left: "-" + d + "px",
                        opacity: options.glowOpacity
                    })).update(text).setShadowColor(color).setUnselectable());
                    container.appendChild(new Element("div").setStyle(Object.extend(style, {
                        top: d + "px",
                        left: d + "px",
                        opacity: options.glowOpacity
                    })).update(text).setShadowColor(color).setUnselectable());
                    container.appendChild(new Element("div").setStyle(Object.extend(style, {
                        top: "-" + d + "px",
                        left: "-" + d + "px",
                        opacity: options.glowOpacity
                    })).update(text).setShadowColor(color).setUnselectable());
                    container.appendChild(new Element("div").setStyle(Object.extend(style, {
                        top: "-" + d + "px",
                        left: d + "px",
                        opacity: options.glowOpacity
                    })).update(text).setShadowColor(color).setUnselectable());
                    break;
                default:
                    shadowdiv.setStyle({
                        top: d + "px",
                        left: d + "px"
                    });
            }
            shadowdiv.setShadowColor(color).setUnselectable();
            container.appendChild(shadowdiv);
        }
        textdiv.setStyle({
            position: "relative",
            zIndex: "120"
        });
        elem.appendChild(container);
        if (options.imageLike) {
            elem.setUnselectable().setStyle({
                cursor: "default"
            });
        }
        return element;
    },
    tooltip: function (element, text, options) {
        element = $(element);
        if ('Prototip' in window) {
            options = Object.extend({
                delay: 0.01
            }, options || {});
            var T = new Tip(element, text, options);
            return element;
        }
        if (typeof text != "string") {
            return element;
        }
        options = Object.extend({
            className: false,
            fixed: false,
            opacity: 1,
            title: false,
            width: 200,
            height: 100,
            offset: false,
            zIndex: 100000,
            delay: false,
            duration: false,
            fadeIn: false,
            fadeOut: false,
            shadow: false
        }, options || {});
        text = (options.title) ? "<b>" + options.title + "</b><br>" + text : text;
        element.hover(function (el, evt) {
            var vpd = document.viewport.getDimensions();
            var getBoxLocation = function (e) {
                var offTop = options.offset.top ? options.offset.top : 15;
                var offLeft = options.offset.left ? options.offset.left : 15;
                var top = (Event.pointerY(e) + offTop);
                var left = (Event.pointerX(e) + offLeft);
                var dim = tooldiv.getDimensions();
                if (left + dim.width > (vpd.width - 20)) {
                    left -= dim.width + 20 + offLeft;
                }
                if (top + dim.height > (vpd.height - 20)) {
                    top -= dim.height + offTop;
                }
                return {
                    top: top,
                    left: left
                };
            };
            if (document.stopTooltip) {
                $$(".pp_tooltip_").each(function (t) {
                    t.remove();
                });
                return true;
            }
            outer = new Element("div", {
                className: 'pp_tooltip_'
            }).setStyle({
                opacity: options.opacity,
                position: "absolute",
                zIndex: options.zIndex
            });
            if (options.className) {
                tooldiv = new Element("div", {
                    className: options.className
                }).setStyle({
                    position: "relative",
                    top: "0px",
                    left: "0px",
                    zIndex: 10
                }).update(text);
            } else {
                tooldiv = new Element("div").setStyle({
                    padding: "4px",
                    background: "#eee",
                    width: (options.width == "auto" ? "auto" : options.width + "px"),
                    border: "1px solid #333",
                    position: "absolute",
                    top: "0px",
                    left: "0px",
                    zIndex: 10
                }).update(text);
                tooldiv.setCSSBorderRadius('5px');
            }
            if (options.shadow) {
                shadTop = options.shadow.top ? parseInt(options.shadow.top, 10) : 4;
                shadLeft = options.shadow.left ? parseInt(options.shadow.left, 10) : 4;
                shadBack = options.shadow.back ? options.shadow.back : "#000";
                shadOp = options.shadow.opacity ? options.shadow.opacity : 0.2;
                if (options.className) {
                    shadow = new Element("div", {
                        className: options.className || ""
                    }).setStyle({
                        position: "absolute",
                        borderColor: "#000",
                        color: "#000",
                        top: shadTop + "px",
                        left: shadLeft + "px",
                        zIndex: 9,
                        background: shadBack,
                        opacity: shadOp
                    });
                    shadow.update(text);
                } else {
                    shadow = new Element("div", {
                        className: options.className || ""
                    }).setStyle({
                        padding: "4px",
                        border: "1px solid black",
                        color: "#000",
                        width: options.width + "px",
                        position: "absolute",
                        top: shadTop + "px",
                        left: shadLeft + "px",
                        zIndex: 9,
                        background: shadBack,
                        opacity: shadOp
                    });
                    shadow.setCSSBorderRadius('5px');
                    shadow.update(text);
                }
                outer.appendChild(shadow);
            }
            outer.appendChild(tooldiv);
            var makeItAppear = function () {
                if (options.fixed) {
                    var fixTop = options.fixed.top ? parseInt(options.fixed.top, 10) : element.getHeight();
                    var fixLeft = options.fixed.left ? parseInt(options.fixed.left, 10) : element.getWidth() - 50;
                    outer.setStyle({
                        top: fixTop + "px",
                        left: fixLeft + "px"
                    });
                } else {
                    element.observe("mousemove", function (e) {
                        if (document.stopTooltip) {
                            $$(".pp_tooltip_").each(function (t) {
                                t.remove();
                            });
                            return true;
                        }
                        var loc = getBoxLocation(e);
                        outer.setStyle({
                            top: loc.top + "px",
                            left: loc.left + "px"
                        });
                    });
                }
            };
            outer.delay = setTimeout(function () {
                if (options.fadeIn) {
                    document.body.appendChild(outer);
                    var fl = getBoxLocation(evt);
                    outer.setStyle({
                        opacity: 0,
                        top: fl.top + "px",
                        left: fl.left + "px"
                    });
                    dur = options.fadeIn.duration ? options.fadeIn.duration : 1;
                    outer.appear({
                        duration: dur,
                        onEnd: makeItAppear()
                    });
                } else {
                    document.body.appendChild(outer);
                    var l = getBoxLocation(evt);
                    outer.setStyle({
                        top: l.top + "px",
                        left: l.left + "px"
                    });
                    setTimeout(makeItAppear, 100);
                }
                if (options.duration) {
                    outer.duration = setTimeout(function () {
                        if (options.fadeOut) {
                            dur = options.fadeOut.duration ? options.fadeOut.duration : 1;
                            outer.fade({
                                duration: dur,
                                onEnd: function () {
                                    if (outer.parentNode) {
                                        outer.remove();
                                    }
                                }
                            });
                        } else {
                            if (outer.parentNode) {
                                outer.remove();
                            }
                        }
                    }, options.duration * 1000 || 0);
                }
            }, options.delay * 1000 || 0);
        }, function () {
            if (document.stopTooltip) {
                $$(".pp_tooltip_").each(function (t) {
                    t.remove();
                });
                return true;
            }
            if (outer) {
                clearTimeout(outer.delay);
                clearTimeout(outer.duration);
            }
            if (options.fadeOut) {
                dur = options.fadeOut.duration ? options.fadeOut.duration : 0.2;
                outer.fade({
                    duration: dur,
                    onEnd: function () {
                        if (outer.parentNode) {
                            outer.remove();
                        }
                    }
                });
            } else {
                if (outer.parentNode) {
                    outer.remove();
                }
            }
        });
        return element;
    },
    softScroll: function (element, options) {
        options = Object.extend({
            scrollSpeed: 50
        }, options || {});
        var scroll = new Element('div', {
            className: 'scroll-bar'
        });
        var scrollStyle = new Element('div', {
            className: 'scroll-style'
        });
        var table = new Element('table', {
            cellpadding: 0,
            cellspacing: 0,
            height: '100%'
        }).insert(new Element('tbody').insert(new Element('tr').insert(new Element('td', {
            valign: 'top'
        }).setStyle('height:100%;padding:5px;').insert(scrollStyle))));
        scroll.insert(table);
        element.setStyle('overflow:hidden;');
        scroll.setStyle('position:absolute; top:0px; right:1px; width:16px; opacity:0; height:50%;');
        var container = element.wrap('div');
        element.updateScrollSize = function () {
            var ch;
            try {
                ch = container.measure('margin-box-height');
            } catch (e) {
                ch = container.getHeight() + (parseInt(container.getStyle('padding-top'), 10) || 0) + (parseInt(container.getStyle('padding-bottom'), 10) || 0) + (parseInt(container.getStyle('margin-top'), 10) || 0) + (parseInt(container.getStyle('margin-bottom'), 10) || 0);
            }
            var sh = element.scrollHeight;
            if (sh <= 0) {
                return;
            }
            var per = ch * 100 / sh;
            if (per > 100) {
                scroll.hide();
            } else {
                scroll.show();
            }
            scroll.style.height = per + "%";
        };
        element.updateScrollSize();
        scroll.setDraggable({
            constraint: 'vertical',
            dragClass: 'scroll-onpress',
            onDrag: function (el) {
                var top = parseInt(el.style.top, 10);
                if (top < 0) {
                    el.style.top = "0px";
                    return false;
                }
                var h = container.getHeight();
                var sh = scroll.getHeight();
                if ((top + sh) > h) {
                    el.style.top = (h - (sh)) + "px";
                    return false;
                }
                scrollArea(top);
            }
        });

        function scrollArea(pos) {
            var ch = container.getHeight();
            var sh = element.scrollHeight;
            var per = ch * 100 / sh;
            var posPer = pos * 100 / ch;
            var position = sh * posPer / 100;
            element.scrollTop = Math.round(position);
        }

        function updateScrollBar(pos) {
            var sh = element.scrollHeight;
            var ch = container.getHeight();
            var per = pos * 100 / sh;
            var position = ch * per / 100;
            scroll.style.top = Math.round(position) + "px";
        }
        container.hover(function () {
            element.updateScrollSize();
            scroll.shift({
                opacity: 1,
                duration: 0.5
            });
        }, function () {
            if (scroll.__dragging === true) {
                return;
            }
            scroll.shift({
                opacity: 0,
                duration: 0.5
            });
        });
        container.setStyle('position:relative; display:inline-block;');
        container.insert(scroll);
        var stime;
        element.observe(Event.mousewheel, function (e) {
            e.stop();
            var w = Event.wheel(e);
            if (w > 0) {
                element.scrollTop = element.scrollTop - options.scrollSpeed;
            } else if (w < 0) {
                element.scrollTop = element.scrollTop + options.scrollSpeed;
            }
            updateScrollBar(element.scrollTop);
        });
    },
    setDraggable: function (element, options) {
        options = Object.extend({
            dragClass: "",
            handler: false,
            dragFromOriginal: false,
            onStart: Prototype.K,
            changeClone: Prototype.K,
            onDrag: Prototype.K,
            onDragEnd: Prototype.K,
            onEnd: Prototype.K,
            dragEffect: false,
            revert: false,
            clone: false,
            snap: false,
            cursor: "move",
            offset: false,
            constraint: false,
            constrainLeft: false,
            constrainRight: false,
            constrainTop: false,
            constrainBottom: false,
            constrainOffset: false,
            constrainViewport: false,
            constrainParent: false,
            dynamic: true
        }, options || {});
        if (options.snap && (typeof options.snap == "number" || typeof options.snap == "string")) {
            options.snap = [options.snap, options.snap];
        }
        var mouseUp = "mouseup",
            mouseDown = "mousedown",
            mouseMove = "mousemove";
        if (options.constrainOffset) {
            if (options.constrainOffset.length == 4) {
                options.constrainTop = options.constrainTop ? options.constrainTop : options.constrainOffset[0];
                options.constrainRight = options.constrainRight ? options.constrainRight : options.constrainOffset[1];
                options.constrainBottom = options.constrainBottom ? options.constrainBottom : options.constrainOffset[2];
                options.constrainLeft = options.constrainLeft ? options.constrainLeft : options.constrainOffset[3];
            }
        }
        var handler;
        var stopDragTimer = false;
        var drag = function (e) {
            Event.stop(e);
            if (mouseMove == "touchmove") {
                e = e.touches[0];
            }
            if (options.onDrag(drag_element, handler, e) === false) {
                return;
            }
            var top = startY + (Number(Event.pointerY(e) - mouseY));
            var left = startX + (Number(Event.pointerX(e) - mouseX));
            if (options.offset) {
                top = options.offset[1] + Event.pointerY(e);
                left = options.offset[0] + Event.pointerX(e);
            }
            if (options.snap) {
                top = (top / options.snap[1]).round() * options.snap[1];
                left = (left / options.snap[0]).round() * options.snap[0];
            }
            top = (options.constrainBottom !== false && top >= options.constrainBottom) ? options.constrainBottom : top;
            top = (options.constrainTop !== false && top <= options.constrainTop) ? options.constrainTop : top;
            left = (options.constrainRight !== false && left >= options.constrainRight) ? options.constrainRight : left;
            left = (options.constrainLeft !== false && left <= options.constrainLeft) ? options.constrainLeft : left;
            if (options.constraint == "vertical") {
                drag_element.setStyle({
                    top: top + "px"
                });
            } else if (options.constraint == "horizontal") {
                drag_element.setStyle({
                    left: left + "px"
                });
            } else {
                drag_element.setStyle({
                    top: top + "px",
                    left: left + "px"
                });
            }
            if (stopDragTimer) {
                clearTimeout(stopDragTimer);
            }
            options.onDrag(drag_element, handler, e);
            stopDragTimer = setTimeout(function () {
                options.onDragEnd(drag_element, handler, e);
            }, 50);
        };
        var mouseup = function (ev) {
            Event.stop(ev);
            if (mouseUp == "touchend") {
                ev = e.touches[0];
            }
            if (options.dynamic !== true) {
                document.temp.setStyle({
                    top: element.getStyle('top'),
                    left: element.getStyle('left')
                });
                element.parentNode.replaceChild(document.temp, element);
                document.temp.oldZIndex = element.oldZIndex;
                element = document.temp;
            }
            if (options.onEnd(drag_element, handler, ev) !== false) {
                if (element.oldZIndex) {
                    drag_element.setStyle({
                        zIndex: element.oldZIndex
                    });
                } else {
                    drag_element.setStyle({
                        zIndex: ''
                    });
                }
                if (options.revert) {
                    if (options.revert === true) {
                        options.revert = {
                            easing: "sineIn",
                            duration: 0.5
                        };
                    }
                    options.revert = Object.extend({
                        left: drag_element.startX,
                        top: drag_element.startY,
                        opacity: 1,
                        duration: 0.5,
                        easing: 'sineIn'
                    }, options.revert || {});
                    drag_element.shift(options.revert);
                    drag_element.startX = false;
                    drag_element.startY = false;
                } else {
                    if (options.dragEffect) {
                        drag_element.shift({
                            opacity: 1,
                            duration: 0.2
                        });
                    }
                }
            }
            element.__dragging = false;
            drag_element.removeClassName(options.dragClass);
            handler.setSelectable();
            drag_element.setSelectable();
            $(document.body).setSelectable();
            document.stopObserving(mouseMove, drag);
            document.stopObserving(mouseUp, mouseup);
        };
        if (options.handler) {
            if (typeof options.handler == "string") {
                handler = (options.handler.startsWith(".")) ? element.descendants().find(function (h) {
                    return h.className == options.handler.replace(/^\./, "");
                }) : $(options.handler);
            } else {
                handler = $(options.handler);
            }
        } else {
            handler = element;
        }
        handler.setStyle({
            cursor: options.cursor
        });
        handler.observe(mouseDown, function (e) {
            Event.stop(e);
            var evt = e;
            if (mouseDown == "touchstart") {
                e = e.touches[0];
            }
            element.__dragging = true;
            if (document.stopDrag) {
                return true;
            }
            if (options.dragFromOriginal && e.target != handler) {
                return false;
            }
            var vdim = false,
                voff = false;
            if (options.constrainElement) {
                voff = (Prototype.Browser.IE) ? {
                    top: 0,
                    left: 0
                } : $(options.constrainElement).cumulativeOffset();
                vdim = $(options.constrainElement).getDimensions();
            }
            if (options.constrainParent) {
                if ($(element.parentNode).getStyle('position') == "relative" || $(element.parentNode).getStyle('position') == "absolute") {
                    voff = {
                        top: 0,
                        left: 0
                    };
                } else {
                    voff = (Prototype.Browser.IE) ? {
                        top: 0,
                        left: 0
                    } : $(element.parentNode).cumulativeOffset();
                }
                vdim = $(element.parentNode).getDimensions();
            }
            if (options.constrainViewport) {
                voff = $(document.body).cumulativeScrollOffset();
                vdim = document.viewport.getDimensions();
            }
            if (vdim) {
                vdim.height += voff.top;
                vdim.width += voff.left;
                options.constrainTop = voff.top + 1;
                options.constrainBottom = vdim.height - (element.getHeight() + 3);
                options.constrainRight = vdim.width - (element.getWidth() + 3);
                options.constrainLeft = voff.left + 1;
            }
            var temp_div;
            if (options.dynamic !== true) {
                try {
                    document.temp = element;
                    temp_div = new Element('div').setStyle({
                        height: element.getHeight() + "px",
                        width: element.getWidth() + "px",
                        border: '1px dashed black',
                        top: element.getStyle('top') || 0,
                        left: element.getStyle('left') || 0,
                        zIndex: element.getStyle('zIndex') || 0,
                        position: element.getStyle('position'),
                        background: '#f5f5f5',
                        opacity: 0.3
                    });
                } catch (err) {}
                element.parentNode.replaceChild(temp_div, element);
                element = temp_div;
            }
            if (["relative", "absolute"].include($(element.parentNode).getStyle('position'))) {
                startX = element.getStyle("left") ? parseInt(element.getStyle("left"), 10) : element.offsetLeft;
                startY = element.getStyle("top") ? parseInt(element.getStyle("top"), 10) : element.offsetTop;
            } else {
                var eloff = element.cumulativeOffset();
                startX = eloff.left;
                startY = eloff.top;
            }
            mouseX = Number(Event.pointerX(e));
            mouseY = Number(Event.pointerY(e));
            if (options.clone) {
                drag_element = options.changeClone(element.cloneNode({
                    deep: true
                }), startX, startY);
                $(document.body).insert(drag_element);
            } else {
                drag_element = element;
            }
            options.onStart(drag_element, handler, e);
            drag_element.addClassName(options.dragClass);
            element.oldZIndex = element.getStyle("z-index") || 0;
            if (options.dragEffect) {
                drag_element.shift({
                    opacity: 0.7,
                    duration: 0.2
                });
            }
            drag_element.setStyle({
                position: "absolute",
                zIndex: 99998
            });
            if (options.revert && !drag_element.startX && !drag_element.startY) {
                drag_element.startX = startX;
                drag_element.startY = startY;
            }
            drag_element.setUnselectable();
            handler.setUnselectable();
            $(document.body).setUnselectable();
            document.observe(mouseMove, drag);
            document.observe(mouseUp, mouseup);
        });
        return element;
    },
    rating: function (element, options) {
        element = $(element);
        options = Object.extend({
            imagePath: "stars.png",
            onRate: Prototype.K,
            resetButtonImage: false,
            resetButtonTitle: 'Cancel Your Rating',
            resetButton: true,
            inputClassName: '',
            titles: [],
            disable: false,
            disabled: element.getAttribute("disabled") ? element.getAttribute("disabled") : false,
            stars: element.getAttribute("stars") ? element.getAttribute("stars") : 5,
            name: element.getAttribute("name") ? element.getAttribute("name") : "rating",
            value: element.getAttribute("value") ? element.getAttribute("value") : 0,
            cleanFirst: false
        }, options || {});
        if (element.converted) {
            return element;
        }
        element.converted = true;
        element.addClassName('form-star-rating');
        var image = {
            blank: "0px 0px",
            over: "-16px 0px",
            clicked: "-32px 0px",
            half: "-48px 0px"
        };
        var hidden = new Element("input", {
            type: "hidden",
            name: options.name,
            className: options.inputClassName
        });
        var stardivs = $A([]);
        element.disabled = (options.disabled == "true" || options.disabled === true) ? true : false;
        element.setStyle({
            display: 'inline-block',
            width: ((parseInt(options.stars, 10) + (options.resetButton ? 1 : 0)) * 20) + "px",
            cursor: options.disabled ? "default" : "pointer"
        });
        element.setUnselectable();
        if (options.cleanFirst) {
            element.update();
        }
        var setStar = function (i) {
            var elval = i;
            i = i || 0;
            var desc = $A(element.descendants());
            desc.each(function (e) {
                e.setStyle({
                    backgroundPosition: image.blank
                }).removeClassName("rated");
            });
            desc.each(function (e, c) {
                if (c < i) {
                    e.setStyle({
                        backgroundPosition: image.clicked
                    }).addClassName("rated");
                }
            });
            hidden.value = i || "";
            if (options.disable) {
                element.disabled = true;
                element.setStyle({
                    cursor: "default"
                });
            }
            element.value = elval;
            options.onRate(element, options.name, i);
            element.run('keyup');
            hidden.run('change');
            if (options.resetButton) {
                cross[(i === 0) ? "hide" : "show"]();
            }
        };
        element.setRating = setStar;
        $A($R(1, options.stars)).each(function (i) {
            var star = new Element("div").setStyle({
                height: "16px",
                width: "16px",
                margin: "0.5px",
                cssFloat: "left",
                backgroundImage: "url(" + options.imagePath + ")"
            });
            star.observe("mouseover", function () {
                if (!element.disabled) {
                    var desc = $A(element.descendants());
                    desc.each(function (e, c) {
                        if (c < i) {
                            e.setStyle({
                                backgroundPosition: e.hasClassName("rated") ? image.clicked : image.over
                            });
                        }
                    });
                }
            }).observe("click", function () {
                if (!element.disabled) {
                    setStar(i);
                }
            });
            if (options.titles && options.titles[i - 1]) {
                star.title = options.titles[i - 1];
            }
            stardivs.push(star);
        });
        if (!options.disabled) {
            element.observe("mouseout", function () {
                element.descendants().each(function (e) {
                    e.setStyle({
                        backgroundPosition: e.hasClassName("rated") ? image.clicked : image.blank
                    });
                });
            });
        }
        if (options.resetButton) {
            var cross = new Element("div").setStyle({
                height: "16px",
                width: "16px",
                margin: "0.5px",
                cssFloat: "left",
                color: '#999',
                fontSize: '12px',
                textAlign: 'center'
            });
            if (options.resetButtonImage) {
                cross.insert(new Element('img', {
                    src: options.resetButtonImage,
                    align: 'absmiddle'
                }));
            } else {
                cross.insert(' x ');
            }
            cross.title = options.resetButtonTitle;
            cross.hide();
            cross.observe('click', function () {
                setStar(undefined);
            });
            stardivs.push(cross);
        }
        stardivs.each(function (star) {
            element.insert(star);
        });
        element.insert(hidden);
        if (options.value > 0) {
            element.descendants().each(function (e, c) {
                c++;
                if (c <= options.value) {
                    e.setStyle({
                        backgroundPosition: image.clicked
                    }).addClassName("rated");
                }
                if (options.value > c - 1 && options.value < c) {
                    e.setStyle({
                        backgroundPosition: image.half
                    }).addClassName("rated");
                }
            });
            hidden.value = options.value;
        }
        return element;
    },
    makeSearchBox: function (element, options) {
        element = $(element);
        if (element.up('.searchbox')) {
            return element;
        }
        options = Object.extend({
            defaultText: "Search",
            onWrite: Prototype.K,
            onClear: Prototype.K,
            imagePath: "images/apple_search.png"
        }, options || {});
        element.observe("keyup", function (e) {
            if (cross) {
                cross.setStyle({
                    backgroundPosition: element.value !== "" ? "0 -57px" : "0 -38px"
                });
            }
            options.onWrite(element.value, e);
        }).observe("focus", function () {
            if (element.value == options.defaultText) {
                element.value = "";
                element.setStyle({
                    color: "#666"
                });
            }
        }).observe("blur", function () {
            if (element.value === "") {
                element.setStyle({
                    color: "#999"
                });
                element.value = options.defaultText;
                if (cross) {
                    cross.setStyle({
                        backgroundPosition: element.value !== "" ? "0 -57px" : "0 -38px"
                    });
                }
            }
        });
        element.value = options.defaultText;
        element.setStyle({
            color: "#999"
        });
        if (element.type !== 'text') {
            element.addClassName("searchbox");
            element.observe('search', function () {
                element.run('keyup');
            });
            return element;
        }
        element.setStyle({
            border: "none",
            background: "none",
            height: "14px",
            outline: 'none',
            width: (parseInt(element.getStyle("width"), 10) - 32) + "px"
        });
        var tbody;
        var table = new Element("table", {
            cellpadding: 0,
            cellspacing: 0,
            className: "searchbox"
        }).setStyle({
            height: "19px",
            fontFamily: "Verdana, Geneva, Arial, Helvetica, sans-serif",
            fontSize: "12px"
        }).insert(tbody = new Element("tbody"));
        var tr = new Element("tr");
        var cont = new Element("td").setStyle({
            backgroundImage: "url(" + options.imagePath + ")",
            backgroundPosition: "0 -19px"
        });
        var cross = new Element("td").insert("&nbsp;").setStyle({
            cursor: 'default'
        });
        tbody.insert(tr.insert(new Element("td").setStyle({
            backgroundImage: "url(" + options.imagePath + ")",
            backgroundPosition: "0 0",
            width: "10px"
        }).insert("&nbsp;")).insert(cont).insert(cross));
        cross.setStyle({
            backgroundImage: "url(" + options.imagePath + ")",
            backgroundPosition: element.value !== "" ? "0 -57px" : "0 -38px",
            width: "17px"
        });
        cross.observe("click", function () {
            element.value = "";
            element.focus();
            element.setStyle({
                color: "#333"
            });
            cross.setStyle({
                backgroundPosition: "0 -38px"
            });
            options.onClear(element);
            element.run('keyup');
        });
        element.parentNode.replaceChild(table, element);
        cont.insert(element);
        return element;
    },
    slider: function (element, options) {
        element = $(element);
        options = Object.extend({
            width: 100,
            onUpdate: Prototype.K,
            maxValue: 100,
            value: 0,
            buttonBack: 'url("../images/ball.png") no-repeat scroll 0px 0px transparent'
        }, options || {});
        if ("JotForm" in window && "url" in JotForm) {
            options.buttonBack = 'url("' + JotForm.url + 'images/ball.png") no-repeat scroll 0px 0px transparent';
        }
        var valueToPixel = function (value) {
            var val = (value * 100 / options.maxValue) * barWidth / 100;
            val = val < 3 ? 3 : val;
            return Math.round(val);
        };
        var sliderOut = new Element('div', {
            tabindex: 1
        });
        var sliderBar = new Element('div');
        var sliderButton = new Element('div', {
            id: new Date().getTime()
        });
        var sliderTable = new Element('table', {
            cellpadding: 0,
            cellspacing: 1,
            border: 0,
            width: options.width,
            className: element.className
        });
        var tbody = new Element('tbody');
        var tr = new Element('tr');
        var tr2 = new Element('tr');
        var sliderTD = new Element('td', {
            colspan: 3
        });
        var startTD = new Element('td', {
            align: 'center',
            width: 20
        }).insert('0');
        var statTD = new Element('td', {
            align: 'center',
            width: options.width - 40
        }).insert(options.value).setStyle('font-weight:bold');
        var endTD = new Element('td', {
            align: 'center',
            width: 20
        }).insert(options.maxValue);
        var barWidth = options.width - 18;
        var defaultValue = options.value;
        options.value = valueToPixel(options.value);
        var moveLEFT = function (amount) {
            var l = parseInt(sliderButton.getStyle('left'), 10) - amount;
            l = (l <= 3) ? 3 : l;
            sliderButton.setStyle({
                left: l + "px"
            });
            updateValue(l);
        };
        var moveRIGTH = function (amount) {
            var l = parseInt(sliderButton.getStyle('left'), 10) + amount;
            l = (l >= barWidth) ? barWidth : l;
            sliderButton.setStyle({
                left: l + "px"
            });
            updateValue(l);
        };
        var sliderKeys = function (e) {
            e = document.getEvent(e);
            if (e.keyCode == 37) {
                moveLEFT(5);
            } else if (e.keyCode == 39) {
                moveRIGTH(5);
            }
        };
        var sliderWheel = function (e) {
            if (!sliderOut.__hasFocus) {
                return true;
            }
            e.stop();
            sliderOut.focus();
            var w = Event.wheel(e);
            if (w > 0) {
                moveRIGTH(5);
            } else if (w < 0) {
                moveLEFT(5);
            }
        };
        var updateValue = function (pos) {
            var total = barWidth;
            if (parseInt(pos, 10) <= 3) {
                element.value = 0;
            } else {
                element.value = parseInt(((parseInt(pos, 10) * options.maxValue) / total), 10);
            }
            sliderOut.value = element.value === 0 ? "" : element.value;
            sliderTable.value = sliderOut.value;
            options.onUpdate(element.value);
            statTD.innerHTML = element.value;
            element.run('keyup');
            return element.value;
        };
        sliderOut.setStyle({
            width: options.width + 'px',
            position: 'relative',
            overflow: 'hidden',
            outline: 'none'
        });
        sliderBar.setStyle({
            border: '1px solid #999',
            background: '#eee',
            margin: '8px',
            overflow: 'hidden',
            height: '3px'
        }).setCSSBorderRadius('4px');
        sliderButton.setStyle({
            position: 'absolute',
            height: '13px',
            width: '13px',
            background: options.buttonBack,
            overflow: 'hidden',
            border: '1px solid transparent',
            top: '3px',
            left: options.value + 'px'
        }).setCSSBorderRadius('8px');
        startTD.setStyle({
            fontFamily: 'Verdana',
            fontSize: '9px'
        });
        statTD.setStyle({
            fontFamily: 'Verdana',
            fontSize: '9px'
        });
        endTD.setStyle({
            fontFamily: 'Verdana',
            fontSize: '9px'
        });
        sliderOut.insert(sliderBar).insert(sliderButton);
        sliderTable.insert(tbody.insert(tr).insert(tr2));
        sliderTD.insert(sliderOut);
        tr.insert(sliderTD);
        tr2.insert(startTD).insert(statTD).insert(endTD);
        sliderButton.setDraggable({
            constraint: 'horizontal',
            dragEffect: false,
            cursor: 'default',
            constrainLeft: 3,
            constrainRight: barWidth,
            onDrag: function (i) {
                updateValue(i.getStyle('left'));
            }
        });
        sliderOut.observe('focus', function () {
            sliderOut.__hasFocus = true;
            sliderOut.setStyle({
                borderColor: '#333'
            });
        }).observe('blur', function () {
            sliderOut.__hasFocus = false;
            sliderOut.setStyle({
                borderColor: '#ccc'
            });
        });
        sliderOut.observe('keypress', sliderKeys).observe(Event.mousewheel, sliderWheel);
        sliderOut.observe('click', function (e) {
            if (e.target.id == sliderButton.id) {
                return false;
            }
            var l = (Event.pointerX(e) - sliderBar.cumulativeOffset().left);
            l = l < 3 ? 3 : l;
            l = l > barWidth ? barWidth : l;
            sliderButton.shift({
                left: l,
                duration: 0.5
            });
            updateValue(l);
        });
        var hidden = new Element('input', {
            type: 'hidden',
            name: element.name,
            value: defaultValue,
            id: element.id
        });
        element.parentNode.replaceChild(hidden, element);
        element = hidden;
        $(hidden.parentNode).insert(sliderTable.setUnselectable());
        hidden.setSliderValue = function (val) {
            var v = valueToPixel(val);
            sliderButton.shift({
                left: v,
                duration: 0.5
            });
            updateValue(v);
        };
        return hidden;
    },
    spinner: function (element, options) {
        element = $(element);
        options = Object.extend({
            width: 60,
            cssFloat: false,
            allowNegative: false,
            addAmount: 1,
            maxValue: false,
            minValue: false,
            readonly: false,
            value: false,
            size: 5,
            imgPath: 'images/',
            onChange: Prototype.K
        }, options || {});
        element.size = options.size;
        if (options.value === false) {
            element.value = parseFloat(element.value) || '0';
        } else {
            element.value = options.value;
        }
        if (element.value < options.minValue) {
            element.value = options.minValue;
        }
        element.writeAttribute('autocomplete', 'off');
        var buttonStyles = {
            height: '10px',
            cursor: 'default',
            textAlign: 'center',
            width: '7px',
            fontSize: '9px',
            paddingLeft: '4px',
            paddingRight: '2px',
            border: '1px solid #ccc',
            background: '#f5f5f5'
        };
        var spinnerContainer = new Element('div', {
            tabindex: '1'
        });
        if (options.cssFloat) {
            spinnerContainer.setStyle({
                cssFloat: options.cssFloat,
                marginRight: '5px'
            });
        }
        spinnerContainer.setStyle({
            width: options.width + "px"
        });
        var spinnerTable, tbody, tr, tr2, inputTD, upTD, downTD;
        spinnerTable = new Element('table', {
            className: 'form-spinner',
            cellpadding: 0,
            cellspacing: 0,
            border: 0,
            height: 20,
            width: options.width
        });
        tbody = new Element('tbody').insert(tr = new Element('tr'));
        spinnerContainer.insert(spinnerTable);
        spinnerTable.insert(tbody);
        element.parentNode.replaceChild(spinnerContainer, element);
        tr.insert(inputTD = new Element('td', {
            className: 'form-spinner-input-td',
            rowspan: 2
        }).insert(element)).insert(upTD = new Element('td', {
            className: 'form-spinner-up'
        }).insert(new Element('img', {
            src: options.imgPath + 'bullet_arrow_up.png',
            align: 'right'
        })));
        tbody.insert(tr2 = new Element('tr').insert(downTD = new Element('td', {
            className: 'form-spinner-down'
        }).insert(new Element('img', {
            src: options.imgPath + 'bullet_arrow_down.png',
            align: 'right'
        }))));
        spinnerTable.setStyle({
            border: '1px solid #ccc',
            borderCollapse: 'collapse',
            background: '#fff'
        });
        upTD.setStyle(buttonStyles);
        downTD.setStyle(buttonStyles);
        inputTD.setStyle({
            paddingRight: '2px'
        });
        element.setStyle({
            height: '100%',
            width: '100%',
            border: 'none',
            padding: '0px',
            fontSize: '14px',
            textAlign: 'right',
            outline: 'none'
        });
        var numberUP = function (e) {
            if (!parseFloat(element.value)) {
                element.value = 0;
            }
            if (options.maxValue && Number(element.value) >= Number(options.maxValue)) {
                return;
            }
            element.value = parseFloat(element.value) + parseInt(options.addAmount, 10);
            options.onChange(element.value);
        };
        var numberDOWN = function (e) {
            if (!parseFloat(element.value)) {
                element.value = 0;
            }
            if (options.minValue && Number(element.value) <= Number(options.minValue)) {
                return;
            }
            if (!options.allowNegative && element.value == '0') {
                return;
            }
            element.value = parseFloat(element.value) - options.addAmount;
            options.onChange(element.value);
        };
        var spinnerKeys = function (e, mode) {
            if (e.target.tagName == "INPUT" && mode == 2) {
                return;
            }
            e = document.getEvent(e);
            if (e.keyCode == 38) {
                numberUP(e);
            } else if (e.keyCode == 40) {
                numberDOWN(e);
            }
        };
        upTD.observe('click', function (e) {
            numberUP(e);
            element.run('keyup');
        }).setUnselectable();
        downTD.observe('click', function (e) {
            numberDOWN(e);
            element.run('keyup');
        }).setUnselectable();
        element.observe(Prototype.Browser.Gecko ? 'keypress' : 'keydown', function (e) {
            spinnerKeys(e, 1);
        });
        spinnerContainer.observe(Prototype.Browser.Gecko ? 'keypress' : 'keydown', function (e) {
            spinnerKeys(e, 2);
        });
        if (options.readonly) {
            element.writeAttribute('readonly', "readonly");
        }
        element.observe('change', function () {
            options.onChange(element.value);
        });
        return element;
    },
    colorPicker: function (element, options) {
        options = Object.extend({
            title: 'Pick a Color',
            background: '#eee',
            trigger: false,
            onPicked: Prototype.K,
            onComplete: Prototype.K,
            onStart: Prototype.K,
            onEnd: Prototype.K
        }, options || {});

        function sortColors(cols) {
            var obj = {};
            $H(cols).sortBy(function (p) {
                var rgb = Protoplus.Colors.hexToRgb(p.value);
                return rgb[0] + rgb[1] + rgb[2];
            }).each(function (item) {
                obj[item[0]] = item[1];
            });
            return obj;
        }
        $(options.trigger || element).observe('click', function () {
            if (options.onStart() === false) {
                element.colorPickerEnabled = false;
                return element;
            }
            var validCSSColors = Protoplus.Colors.getPalette();
            if (element.colorPickerEnabled) {
                return false;
            }
            var colorTD, colorTD2, selectTD, tr, colorTR, selectTR, tbody;
            var table = new Element('table', {
                cellpadding: 4,
                cellspacing: 0,
                border: 0,
                width: 140
            }).setStyle({
                zIndex: 100000
            }).insert(tbody = new Element('tbody'));
            if (options.className) {
                table.addClassName(options.className);
            } else {
                table.setStyle({
                    background: options.background,
                    outline: '1px solid #aaa',
                    border: '1px solid #fff'
                });
            }
            tbody.insert(tr = new Element('tr').insert(new Element('th', {
                className: 'titleHandler',
                colspan: '2',
                height: '10'
            }).setText(options.title).setStyle({
                paddingTop: '2px',
                paddingBottom: '0px',
                color: '#333',
                fontSize: '14px'
            }))).insert(colorTR = new Element('tr')).insert(selectTR = new Element('tr'));
            colorTR.insert(colorTD = new Element('td'));
            colorTR.insert(colorTD2 = new Element('td'));
            selectTR.insert(selectTD = new Element('td', {
                colspan: 2
            }));
            var box = new Element('input', {
                type: 'text'
            }).setStyle({
                width: '48px',
                margin: '1px'
            });
            box.observe('keyup', function () {
                box.setStyle({
                    background: box.value,
                    color: Protoplus.Colors.invert(box.value)
                });
            });
            var flip = new Element('input', {
                type: 'button',
                value: 'Flip'
            });
            flip.observe('click', function () {
                var sc = overFlowDiv.getScroll();
                scr = 0;
                if (sc.y >= 0) {
                    scr = 140;
                }
                if (sc.y >= colorTable.getHeight() - 140) {
                    scr = 0;
                } else {
                    scr = sc.y + 140;
                }
                overFlowDiv.shift({
                    scrollTop: scr,
                    link: 'ignore',
                    duration: 0.3
                });
            });
            var OK = new Element('input', {
                type: 'button',
                value: 'OK'
            }).observe('click', function () {
                if (element.tagName == "INPUT") {
                    element.value = box.value;
                    element.focus();
                }
                table.remove();
                setTimeout(function () {
                    element.colorPickerEnabled = false;
                    options.onComplete(box.value, element, table);
                }, 100);
            });
            if (options.buttonClass) {
                $(flip, OK).invoke('addClassName', options.buttonClass);
            } else {
                $(flip, OK).invoke('setStyle', {
                    padding: '1px',
                    margin: '1px',
                    background: '#f5f5f5',
                    border: '1px solid #ccc'
                });
            }
            element.closeColorPicker = function () {
                OK.run('click');
            };
            selectTD.insert(box).insert(flip).insert(OK);
            var colorTable = new Element('table', {
                cellpadding: 0,
                cellspacing: 0,
                border: 0,
                width: 140
            });
            var colorTbody = new Element('tbody'),
                colCount = 0,
                colTR;
            $H(validCSSColors).each(function (color) {
                if (colCount == 7) {
                    colCount = 0;
                }
                if (colCount++ === 0) {
                    colTR = new Element('tr');
                    colorTbody.insert(colTR);
                }
                var tdSize = 20;
                var pick = function (e) {
                    box.value = color.value;
                    box.setStyle({
                        background: box.value,
                        color: Protoplus.Colors.invert(box.value)
                    });
                    options.onPicked(box.value, element, table);
                };
                if (color.value === false) {
                    colTR.insert(new Element('td', {
                        width: tdSize,
                        height: tdSize
                    }).setStyle({
                        background: '#fff'
                    }).setStyle({}));
                } else {
                    colTR.insert(new Element('td', {
                        width: tdSize,
                        height: tdSize
                    }).setStyle({
                        background: color.value
                    }).observe('click', pick).tooltip(color.value, {
                        delay: 0.6,
                        width: 'auto'
                    }));
                }
            });
            colorTable.insert(colorTbody);
            var overFlowDiv = new Element('div').setStyle({
                outline: '1px solid #fff',
                border: '1px solid #666',
                overflow: 'hidden',
                height: '140px'
            });
            var preTable = new Element('table', {
                cellPadding: 0,
                cellspacing: 0,
                width: 40
            }).setStyle({
                outline: '1px solid #fff',
                border: '1px solid #666',
                overflow: 'hidden',
                height: '140px'
            });
            var preTbody = new Element('tbody');
            preTable.insert(preTbody);
            colorTD2.insert(preTable);
            colorTD.insert(overFlowDiv.insert(colorTable));
            var preColors = [
                ["Black:#000000", "Navy:#000080"],
                ["Blue:#0000FF", "Magenta:#FF00FF"],
                ["Red:#FF0000", "Brown:#A52A2A"],
                ["Pink:#FFC0CB", "Orange:#FFA500"],
                ["Green:#008000", "Yellow:#FFFF00"],
                ["Gray:#808080", "Turquoise:#40E0D0"],
                ["Cyan:#00FFFF", "White:#FFFFFF"]
            ];
            $R(0, 6).each(function (i) {
                var tr = new Element('tr');
                preTbody.insert(tr);
                tr.insert(new Element('td', {
                    height: 20,
                    width: 20
                }).setText('&nbsp;').setStyle({
                    background: preColors[i][0].split(':')[1]
                }).tooltip(preColors[i][0].split(':')[0], {
                    delay: 0.6,
                    width: 'auto'
                }).observe('click', function () {
                    box.value = preColors[i][0].split(':')[1];
                    box.setStyle({
                        background: box.value,
                        color: Protoplus.Colors.invert(box.value)
                    });
                    options.onPicked(box.value, element, table);
                }));
                tr.insert(new Element('td', {
                    height: 20,
                    width: 20
                }).setText('&nbsp;').setStyle({
                    background: preColors[i][1].split(':')[1]
                }).tooltip(preColors[i][1].split(':')[0], {
                    delay: 0.6,
                    width: 'auto'
                }).observe('click', function () {
                    box.value = preColors[i][1].split(':')[1];
                    box.setStyle({
                        background: box.value,
                        color: Protoplus.Colors.invert(box.value)
                    });
                    options.onPicked(box.value, element, table);
                }));
            });
            var top = element.cumulativeOffset().top + element.getHeight();
            var left = element.cumulativeOffset().left;
            table.setStyle({
                position: 'absolute',
                top: top + 3 + "px",
                left: left + 2 + 'px'
            });
            table.setDraggable({
                handler: table.select('.titleHandler')[0],
                dragEffect: false
            });
            $(document.body).insert(table);
            options.onEnd(element, table);
            overFlowDiv.setScroll({
                y: '0'
            });
            element.colorPickerEnabled = true;
        });
        return element;
    },
    colorPicker2: function (element, options) {
        options = Object.extend({
            onStart: Prototype.K,
            onEnd: Prototype.K,
            trigger: false,
            onPicked: Prototype.K,
            onComplete: Prototype.K,
            hideOnBlur: false,
            buttonClass: 'big-button buttons'
        }, options || {});
        $(options.trigger || element).observe('click', function () {
            var docEvent = false;
            if (element.colorPickerEnabled) {
                return element;
            }
            if (options.onStart() === false) {
                return element;
            }
            if (options.hideOnBlur) {
                setTimeout(function () {
                    docEvent = Element.on(document, 'click', function (e) {
                        var el = Event.findElement(e, '.plugin, ');
                        if (!el) {
                            element.closeColorPicker();
                        }
                    });
                }, 0);
            }
            element.colorPickerEnabled = true;
            var scrollOffset = element.cumulativeScrollOffset();
            var stop = 1;
            var top = element.measure('cumulative-top') + 2;
            var left = element.measure('cumulative-left') + 1 - scrollOffset.left;
            var height = element.measure('border-box-height');
            var plugin = new Element('div', {
                className: 'plugin edit-box'
            });
            var plugCUR = new Element('div', {
                className: 'plugCUR'
            });
            var plugHEX = new Element('input', {
                type: 'text',
                size: '10',
                className: 'plugHEX'
            });
            var SV = new Element('div', {
                className: 'SV'
            }).setUnselectable();
            var SVslide = new Element('div', {
                className: 'SVslide'
            });
            var H = new Element('form', {
                className: 'H'
            }).setUnselectable();
            var Hslide = new Element('div', {
                className: 'Hslide'
            });
            var Hmodel = new Element('div', {
                className: 'Hmodel'
            });
            var complete = new Element('button', {
                type: 'button',
                className: ''
            });
            plugin.insert('<br>').insert(SV).insert(H);
            plugin.insert(plugCUR).insert(plugHEX.setValue('#FFFFFF')).insert(complete.update('OK'));
            SV.insert(SVslide.update('<br>'));
            H.insert(Hslide.update('<br>')).insert(Hmodel);
            plugin.setStyle({
                position: 'absolute',
                top: (top + height) + 'px',
                left: left + 'px',
                zIndex: '10000000'
            });
            SVslide.setStyle('top:-4px; left:-4px;');
            Hslide.setStyle('top:0px; left:-8px;');
            complete.setStyle('float:right;margin-top:8px;').addClassName(options.buttonClass);
            plugin.observe('mousedown', function (e) {
                HSVslide('drag', plugin, e);
            });
            plugHEX.observe('mousedown', function (e) {
                stop = 0;
                setTimeout(function () {
                    stop = 1;
                }, 100);
            });
            SV.observe('mousedown', function (e) {
                HSVslide(SVslide, plugin, e);
            });
            H.observe('mousedown', function (e) {
                HSVslide(Hslide, plugin, e);
            });
            complete.observe('click', function () {
                plugin.remove();
                element.colorPickerEnabled = false;
                if (docEvent) {
                    docEvent.stop();
                }
                options.onComplete(plugHEX.value);
            });
            element.closeColorPicker = function () {
                complete.run('click');
            };

            function abPos(o) {
                o = (typeof (o) == 'object' ? o : $(o));
                var z = {
                    X: 0,
                    Y: 0
                };
                while (o !== null) {
                    z.X += o.offsetLeft;
                    z.Y += o.offsetTop;
                    o = o.offsetParent;
                }
                return (z);
            }

            function within(v, a, z) {
                return ((v >= a && v <= z) ? true : false);
            }

            function XY(e, v) {
                var evt = e || window.event;
                var z = [Event.pointerX(evt), Event.pointerY(evt)];
                v = parseInt(v, 10);
                return (z[!isNaN(v) ? v : 0]);
            }
            var maxValue = {
                'H': 360,
                'S': 100,
                'V': 100
            };
            var HSV = {
                H: 360,
                S: 100,
                V: 100
            };
            var slideHSV = {
                H: 360,
                S: 100,
                V: 100
            };

            function HSVslide(d, o, e) {
                function tXY(e) {
                    tY = XY(e, 1) - ab.Y;
                    tX = XY(e) - ab.X;
                }

                function mkHSV(a, b, c) {
                    return (Math.min(a, Math.max(0, Math.ceil((parseInt(c, 10) / b) * a))));
                }

                function ckHSV(a, b) {
                    if (within(a, 0, b)) {
                        return (a);
                    } else if (a > b) {
                        return (b);
                    } else if (a < 0) {
                        return ('-' + oo);
                    }
                }

                function drag(e) {
                    if (!stop) {
                        if (d != 'drag') {
                            tXY(e);
                        }
                        if (d == SVslide) {
                            ds.left = ckHSV(tX - oo, 162) + 'px';
                            ds.top = ckHSV(tY - oo, 162) + 'px';
                            slideHSV.S = mkHSV(100, 162, ds.left);
                            slideHSV.V = 100 - mkHSV(100, 162, ds.top);
                            HSVupdate();
                        } else if (d == Hslide) {
                            var ck = ckHSV(tY - oo, 163),
                                r = 'HSV',
                                z = {};
                            ds.top = (ck) + 'px';
                            slideHSV.H = mkHSV(360, 163, ck);
                            z.H = maxValue.H - mkHSV(maxValue.H, 163, ck);
                            z.S = HSV.S;
                            z.V = HSV.V;
                            HSVupdate(z);
                            SV.style.backgroundColor = '#' + color.HSV_HEX({
                                H: HSV.H,
                                S: 100,
                                V: 100
                            });
                        } else if (d == 'drag') {
                            ds.left = XY(e) + oX - eX + 'px';
                            ds.top = XY(e, 1) + oY - eY + 'px';
                        }
                    }
                }
                if (stop) {
                    stop = '';
                    var ds = $(d != 'drag' ? d : o).style;
                    if (d == 'drag') {
                        var oX = parseInt(ds.left, 10),
                            oY = parseInt(ds.top, 10),
                            eX = XY(e),
                            eY = XY(e, 1);
                    } else {
                        var ab = abPos($(o)),
                            tX, tY, oo = (d == Hslide) ? 0 : 4;
                        ab.X += 10;
                        ab.Y += 22;
                        if (d == SVslide) {
                            slideHSV.H = HSV.H;
                        }
                    }
                    document.onmousemove = drag;
                    document.onmouseup = function () {
                        stop = 1;
                        document.onmousemove = '';
                        document.onmouseup = '';
                    };
                    drag(e);
                }
            }

            function HSVupdate(v) {
                v = HSV = v ? v : slideHSV;
                v = color.HSV_HEX(v);
                plugHEX.value = '#' + v;
                plugCUR.style.background = '#' + v;
                if (element.tagName == 'BUTTON') {
                    element.__colorvalue = '#' + v;
                } else {
                    element.value = '#' + v;
                }
                options.onPicked('#' + v, element, plugin);
                return (v);
            }

            function setValue(colorcode) {
                var rgb = Protoplus.Colors.getRGBarray(colorcode);
                var hsv = color.RGB_HSV(rgb[0], rgb[1], rgb[2]);
                SV.style.backgroundColor = '#' + color.HSV_HEX({
                    H: hsv.H,
                    S: 100,
                    V: 100
                });
                Hslide.style.top = Math.abs(Math.ceil((hsv.H * 163) / 360) - 163) + "px";
                var t = Math.abs((Math.floor((hsv.V * 162) / 100)) - 162);
                var l = Math.abs((Math.floor((hsv.S * 162) / 100)));
                if (t <= 0) {
                    t = t - 4;
                }
                if (l <= 0) {
                    l = l - 4;
                }
                SVslide.style.top = t + "px";
                SVslide.style.left = l + "px";
                HSVupdate(hsv);
            }
            element.setColorPickerValue = setValue;

            function loadSV() {
                var z = '';
                for (var i = 165; i >= 0; i--) {
                    z += "<div style=\"BACKGROUND: #" + color.HSV_HEX({
                        H: Math.round((360 / 165) * i),
                        S: 100,
                        V: 100
                    }) + ";\"><br /><\/div>";
                }
                Hmodel.innerHTML = z;
            }
            var color = {
                cords: function (W) {
                    var W2 = W / 2,
                        rad = (hsv.H / 360) * (Math.PI * 2),
                        hyp = (hsv.S + (100 - hsv.V)) / 100 * (W2 / 2);
                    $('mCur').style.left = Math.round(Math.abs(Math.round(Math.sin(rad) * hyp) + W2 + 3)) + 'px';
                    $('mCur').style.top = Math.round(Math.abs(Math.round(Math.cos(rad) * hyp) - W2 - 21)) + 'px';
                },
                HEX: function (o) {
                    o = Math.round(Math.min(Math.max(0, o), 255));
                    return ("0123456789ABCDEF".charAt((o - o % 16) / 16) + "0123456789ABCDEF".charAt(o % 16));
                },
                RGB_HSV: function (r, g, b) {
                    r = r / 255;
                    g = g / 255;
                    b = b / 255;
                    var max = Math.max(r, g, b),
                        min = Math.min(r, g, b);
                    var h, s, v = max;
                    var d = max - min;
                    s = max === 0 ? 0 : d / max;
                    if (max == min) {
                        h = 0;
                    } else {
                        switch (max) {
                            case r:
                                h = (g - b) / d + (g < b ? 6 : 0);
                                break;
                            case g:
                                h = (b - r) / d + 2;
                                break;
                            case b:
                                h = (r - g) / d + 4;
                                break;
                        }
                        h /= 6;
                    }
                    return {
                        H: h * 360,
                        S: s * 100,
                        V: v * 100
                    };
                },
                RGB_HEX: function (o) {
                    var fu = color.HEX;
                    return (fu(o.R) + fu(o.G) + fu(o.B));
                },
                HSV_RGB: function (o) {
                    var R, G, A, B, C, S = o.S / 100,
                        V = o.V / 100,
                        H = o.H / 360;
                    if (S > 0) {
                        if (H >= 1) {
                            H = 0;
                        }
                        H = 6 * H;
                        F = H - Math.floor(H);
                        A = Math.round(255 * V * (1 - S));
                        B = Math.round(255 * V * (1 - (S * F)));
                        C = Math.round(255 * V * (1 - (S * (1 - F))));
                        V = Math.round(255 * V);
                        switch (Math.floor(H)) {
                            case 0:
                                R = V;
                                G = C;
                                B = A;
                                break;
                            case 1:
                                R = B;
                                G = V;
                                B = A;
                                break;
                            case 2:
                                R = A;
                                G = V;
                                B = C;
                                break;
                            case 3:
                                R = A;
                                G = B;
                                B = V;
                                break;
                            case 4:
                                R = C;
                                G = A;
                                B = V;
                                break;
                            case 5:
                                R = V;
                                G = A;
                                B = B;
                                break;
                        }
                        return ({
                            'R': R ? R : 0,
                            'G': G ? G : 0,
                            'B': B ? B : 0,
                            'A': 1
                        });
                    } else {
                        return ({
                            'R': (V = Math.round(V * 255)),
                            'G': V,
                            'B': V,
                            'A': 1
                        });
                    }
                },
                HSV_HEX: function (o) {
                    return (color.RGB_HEX(color.HSV_RGB(o)));
                }
            };
            $(document.body).insert(plugin);
            loadSV();
            setValue(element.__colorvalue || element.value || "#FFFFFF");
            options.onEnd(element, plugin);
            return element;
        });
    },
    miniLabel: function (element, label, options) {
        options = Object.extend({
            position: 'bottom',
            color: '#666',
            size: 9,
            text: '',
            nobr: false
        }, options || {});
        element.wrap('span');
        span = $(element.parentNode);
        span.setStyle({
            whiteSpace: 'nowrap',
            cssFloat: 'left',
            marginRight: '5px'
        });
        var labelStyle = {
            paddingLeft: '1px',
            fontSize: options.size + "px",
            color: options.color,
            cursor: 'default'
        };
        var labelClick = function () {
            element.focus();
        };
        var br = '<br>';
        if (options.nobr) {
            br = '';
        }
        if (options.position == "top") {
            element.insert({
                before: new Element('span').setText(label + br).setStyle(labelStyle).observe('click', labelClick)
            }).insert({
                after: options.text
            });
        } else {
            element.insert({
                after: new Element('span').setText(br + label).setStyle(labelStyle).observe('click', labelClick)
            }).insert({
                after: options.text
            });
        }
        return span;
    },
    hint: function (element, value, options) {
        element = $(element);
        if ("placeholder" in element) {
            element.writeAttribute('placeholder', value);
            return element;
        }
        if (element.type == 'number') {
            element.value = "0";
            return element;
        }
        if (element.removeHint) {
            return element.hintClear();
        }
        options = Object.extend({
            hintColor: '#bbb'
        }, options || {});
        var color = element.getStyle('color') || '#000';
        if (element.value === '') {
            element.setStyle({
                color: options.hintColor
            });
            element.value = value;
            element.hinted = true;
        }
        var focus = function () {
            if (element.value == value) {
                element.value = "";
                element.setStyle({
                    color: color
                }).hinted = false;
            }
        };
        var blur = function () {
            if (element.value === "") {
                element.value = value;
                element.setStyle({
                    color: options.hintColor
                }).hinted = true;
            }
        };
        var submit = function () {
            if (element.value == value) {
                element.value = "";
                element.hinted = false;
            }
        };
        element.observe('focus', focus);
        element.observe('blur', blur);
        if (element.form) {
            $(element.form).observe('submit', submit);
        }
        element.runHint = blur;
        element.clearHint = function () {
            element.value = "";
            element.setStyle({
                color: color
            }).hinted = false;
        };
        element.hintClear = function () {
            element.value = value;
            element.setStyle({
                color: options.hintColor
            }).hinted = true;
            return element;
        };
        element.removeHint = function () {
            element.setStyle({
                color: color
            });
            if (element.value == value) {
                element.value = "";
            }
            element.hintClear = undefined;
            element.hinted = undefined;
            element.removeHint = undefined;
            element.stopObserving('focus', focus);
            element.stopObserving('blur', blur);
            if (element.form) {
                $(element.form).stopObserving('submit', submit);
            }
            return element;
        };
        return element;
    },
    resizable: function (element, options) {
        options = Object.extend({
            sensitivity: 10,
            overflow: 0,
            onResize: Prototype.K,
            onResizeEnd: Prototype.K,
            imagePath: 'images/resize.png',
            element: false,
            maxHeight: false,
            minHeight: false,
            maxWidth: false,
            minWidth: false,
            maxArea: false,
            autoAdjustOverflow: true,
            constrainViewport: true,
            constrainParent: false,
            keepAspectRatio: false,
            displayHandlers: true
        }, options, {});
        var handlerElem = $(element);
        if (options.element) {
            element = $(options.element);
        } else {
            element = $(element);
        }
        element.resized = true;
        var elementPos = handlerElem.getStyle('position');
        if (!elementPos || elementPos == 'static') {
            handlerElem.setStyle({
                position: 'relative'
            });
        }
        var ratio;
        var firstDim = element.getDimensions();
        var paddings = {
            top: (parseInt(element.getStyle('padding-top'), 10) || 0) + (parseInt(element.getStyle('padding-bottom'), 10) || 0),
            left: (parseInt(element.getStyle('padding-left'), 10) || 0) + (parseInt(element.getStyle('padding-right'), 10) || 0)
        };
        var handler = new Element('div'),
            rightHandler = new Element('div'),
            bottomHandler = new Element('div');
        handler.setStyle({
            height: options.sensitivity + 'px',
            width: options.sensitivity + 'px',
            position: 'absolute',
            bottom: '-' + options.overflow + 'px',
            right: '-' + options.overflow + 'px',
            cursor: 'se-resize',
            zIndex: 10000
        });
        rightHandler.setStyle({
            height: '100%',
            width: options.sensitivity + 'px',
            position: 'absolute',
            top: '0px',
            right: '-' + options.overflow + 'px',
            cursor: 'e-resize',
            zIndex: 10000
        });
        bottomHandler.setStyle({
            height: options.sensitivity + 'px',
            width: '100%',
            position: 'absolute',
            bottom: '-' + options.overflow + 'px',
            left: '0px',
            cursor: 's-resize',
            zIndex: 10000
        });
        handler.setStyle({
            background: 'url(' + options.imagePath + ') no-repeat bottom right'
        });
        var resize = function (e, type) {
            e.stop();
            document.stopDrag = true;
            handlerElem.setUnselectable();
            $(document.body).setUnselectable();
            var sDim = $H(element.getDimensions()).map(function (d) {
                if (d.key == "height") {
                    return d.value - paddings.top;
                } else if (d.key == "width") {
                    return d.value - paddings.left;
                }
                return d.value;
            });
            var startDim = {
                height: sDim[1],
                width: sDim[0]
            };
            if (options.keepAspectRatio) {
                ratio = Math.abs(startDim.height / startDim.width);
            }
            var offs = element.cumulativeOffset();
            var pdim = $(element.parentNode).getDimensions();
            var poff = $(element.parentNode).cumulativeOffset();
            var mouseStart = {
                top: Event.pointerY(e),
                left: Event.pointerX(e)
            };
            var dim = document.viewport.getDimensions();
            var overflowHeight = "";
            var overflowWidth = "";
            switch (type) {
                case "both":
                    handler.setStyle('height:100%; width:100%');
                    break;
                case "horizontal":
                    rightHandler.setStyle({
                        width: '100%'
                    });
                    break;
                case "vertical":
                    bottomHandler.setStyle({
                        height: '100%'
                    });
                    break;
            }
            var setElementSize = function (dims) {
                var height = dims.height;
                var width = dims.width;
                var type = dims.type || 'both';
                if (height) {
                    height = (options.maxHeight && height >= options.maxHeight) ? options.maxHeight : height;
                    height = (options.minHeight && height <= options.minHeight) ? options.minHeight : height;
                    if (options.maxArea) {
                        if (height * element.getWidth() >= options.maxArea) {
                            return;
                        }
                    }
                    element.setStyle({
                        height: height + "px"
                    });
                }
                if (width) {
                    width = (options.maxWidth && width >= options.maxWidth) ? options.maxWidth : width;
                    width = (options.minWidth && width <= options.minWidth) ? options.minWidth : width;
                    if (options.maxArea) {
                        if (element.getHeight() * width >= options.maxArea) {
                            return;
                        }
                    }
                    element.setStyle({
                        width: width + "px"
                    });
                }
                options.onResize((height || startDim.height) + paddings.top, (width || startDim.width) + paddings.left, type);
            };
            var mousemove = function (e) {
                e.stop();
                if (type != "horizontal") {
                    var height = startDim.height + (Event.pointerY(e) - mouseStart.top);
                    var hskip = false;
                    if (options.constrainViewport) {
                        hskip = ((height + offs.top) >= (dim.height - 3));
                    }
                    if (options.constrainParent) {
                        hskip = ((height + offs.top + paddings.top) >= (pdim.height + poff.top - 3));
                        if (hskip) {
                            setElementSize({
                                height: (pdim.height + poff.top - 3) - (offs.top + paddings.top + 3),
                                type: type
                            });
                        }
                    }
                    if (!hskip) {
                        setElementSize({
                            height: height,
                            type: type
                        });
                        if (options.keepAspectRatio) {
                            setElementSize({
                                width: height / ratio,
                                type: type
                            });
                        }
                    }
                }
                if (type != "vertical") {
                    var width = startDim.width + (Event.pointerX(e) - mouseStart.left);
                    var wskip = false;
                    if (options.constrainViewport) {
                        wskip = ((width + offs.left) >= (dim.width - 3));
                    }
                    if (options.constrainParent) {
                        wskip = ((width + offs.left + paddings.left) >= (pdim.width + poff.left - 3));
                        if (wskip) {
                            setElementSize({
                                width: (pdim.width + poff.left - 3) - (offs.left + paddings.left + 3),
                                type: type
                            });
                        }
                    }
                    if (!wskip) {
                        setElementSize({
                            width: width,
                            type: type
                        });
                        if (options.keepAspectRatio) {
                            setElementSize({
                                height: width * ratio,
                                type: type
                            });
                        }
                    }
                }
            };
            var mouseup = function () {
                handler.setStyle({
                    height: options.sensitivity + 'px',
                    width: options.sensitivity + 'px'
                });
                rightHandler.setStyle({
                    width: options.sensitivity + 'px'
                });
                bottomHandler.setStyle({
                    height: options.sensitivity + 'px'
                });
                document.stopObserving('mousemove', mousemove).stopObserving('mouseup', mouseup).stopDrag = false;
                handlerElem.setSelectable();
                options.onResizeEnd(element.getHeight(), element.getWidth());
                $(document.body).setSelectable();
            };
            document.observe('mousemove', mousemove).observe('mouseup', mouseup);
            return false;
        };
        handler.observe('mousedown', function (e) {
            resize(e, 'both');
        });
        rightHandler.observe('mousedown', function (e) {
            resize(e, 'horizontal');
        });
        bottomHandler.observe('mousedown', function (e) {
            resize(e, 'vertical');
        });
        element.hideHandlers = function () {
            handler.hide();
            rightHandler.hide();
            bottomHandler.hide();
        };
        element.showHandlers = function () {
            handler.show();
            rightHandler.show();
            bottomHandler.show();
        };
        handlerElem.insert(bottomHandler).insert(rightHandler).insert(handler);
        return handlerElem;
    },
    positionFixed: function (element, options) {
        element = $(element);
        options = Object.extend({
            offset: 10,
            onPinned: Prototype.K,
            onUnpinned: Prototype.K,
            onBeforeScroll: Prototype.K,
            onBeforeScrollFail: Prototype.K,
            onScroll: Prototype.K
        }, options || {});
        var off = element.cumulativeOffset();
        var sOff = element.cumulativeScrollOffset();
        var top = off.top + sOff.top;
        var left = off.left + sOff.left;
        var onScroll = function () {
            if (element.pinned) {
                return true;
            }
            var style = {};
            var bodyOff = $(document.body).cumulativeScrollOffset();
            if (top <= bodyOff.top + options.offset) {
                style = {
                    position: 'fixed',
                    top: options.offset + 'px'
                };
            } else {
                style = {
                    position: 'absolute',
                    top: top + 'px'
                };
            }
            if (options.onBeforeScroll(element, parseInt(style.top, 10), bodyOff.top) !== false) {
                element.setStyle(style);
                options.onScroll(element, bodyOff.top);
            } else {
                if (element.style.position == "fixed") {
                    element.setStyle({
                        position: 'absolute',
                        top: bodyOff.top + options.offset + 'px'
                    });
                    options.onBeforeScrollFail(element, parseInt(style.top, 10), bodyOff.top);
                }
            }
        };
        element.pin = function () {
            var bodyOff = $(document.body).cumulativeScrollOffset();
            element.style.top = bodyOff.top + options.offset + 'px';
            element.style.position = 'absolute';
            options.onPinned(element);
            element.pinned = true;
        };
        element.isPinned = function () {
            options.onPinned(element);
            return element.pinned;
        };
        element.unpin = function () {
            element.pinned = false;
            onScroll();
            options.onUnpinned(element);
        };
        element.updateScroll = onScroll;
        element.updateTop = function (topLimit) {
            top = topLimit;
            return element;
        };
        Event.observe(window, 'scroll', onScroll);
        return element;
    },
    positionFixedBottom: function (element, options) {
        element = $(element);
        options = Object.extend({
            offset: 0,
            onPinned: Prototype.K,
            onUnpinned: Prototype.K,
            onBeforeScroll: Prototype.K,
            onScroll: Prototype.K
        }, options || {});
        var off = element.cumulativeOffset();
        var sOff = element.cumulativeScrollOffset();
        var top = off.top + sOff.top;
        var h = element.getHeight();
        var left = off.left + sOff.left;
        var onScroll = function () {
            if (element.pinned) {
                return true;
            }
            var style = {};
            var bodyOff = $(document.body).cumulativeScrollOffset();
            if (top + h >= bodyOff.top + options.offset) {
                style = {
                    position: 'fixed',
                    bottom: options.offset + 'px'
                };
            } else {
                if (element.style.position == "fixed") {
                    element.setStyle({
                        position: 'absolute',
                        top: bodyOff.top + options.offset + 'px'
                    });
                    options.onBeforeScrollFail(element, parseInt(style.top, 10), bodyOff.top);
                }
            }
        };
        onScroll();
        element.pin = function () {
            var bodyOff = $(document.body).cumulativeScrollOffset();
            element.style.top = bodyOff.top + options.offset + 'px';
            element.style.position = 'absolute';
            options.onPinned(element);
            element.pinned = true;
        };
        element.isPinned = function () {
            options.onPinned(element);
            return element.pinned;
        };
        element.unpin = function () {
            element.pinned = false;
            onScroll();
            options.onUnpinned(element);
        };
        element.updateScroll = onScroll;
        element.updateTop = function (topLimit) {
            top = topLimit;
            return element;
        };
        Event.observe(window, 'scroll', onScroll);
        return element;
    },
    keepInViewport: function (element, options) {
        element = $(element);
        options = Object.extend({
            offset: [10, 10],
            offsetLeft: false,
            offsetTop: false,
            delay: 0.1,
            onPinned: Prototype.K,
            onUnpinned: Prototype.K,
            onBeforeScroll: Prototype.K,
            onScroll: Prototype.K,
            smooth: false,
            horzontal: false,
            vertical: true,
            animation: {
                duration: 0.2,
                easing: 'sineOut'
            },
            topLimit: parseInt(element.getStyle('top') || 0, 10),
            leftLimit: parseInt(element.getStyle('left') || 0, 10)
        }, options || {});
        options.animation = Object.extend({
            duration: 0.4
        }, options.animation || {});
        options.delay *= 1000;
        if (typeof options.offset == 'number') {
            options.offsetLeft = options.offset;
            options.offsetTop = options.offset;
        } else {
            options.offsetLeft = options.offset[0];
            options.offsetTop = options.offset[1];
        }
        var timer = false;
        var onScroll = function (e) {
            if (element.pinned) {
                return true;
            }
            if (timer) {
                clearTimeout(timer);
            }
            var anim = options.animation;
            var doScroll = function () {
                var off = element.cumulativeOffset();
                var sOff = element.cumulativeScrollOffset();
                var toff = options.offsetTop;
                var loff = options.offsetLeft;
                if (sOff.top < toff) {
                    toff = sOff.top;
                }
                if (sOff.left < loff) {
                    loff = sOff.left;
                }
                if (options.vertical) {
                    if (sOff.top >= off.top - toff) {
                        if (sOff.top > 0) {
                            anim.top = sOff.top + toff + 'px';
                        }
                    } else {
                        if (off.top != options.topLimit) {
                            if (sOff.top + toff > options.topLimit) {
                                anim.top = sOff.top + toff + 'px';
                            } else {
                                anim.top = options.topLimit + 'px';
                            }
                        }
                    }
                }
                if (options.horizontal) {
                    if (sOff.left >= off.left - loff) {
                        if (sOff.left > 0) {
                            anim.left = sOff.left + loff + 'px';
                        }
                    } else {
                        if (off.left != options.leftLimit) {
                            if (sOff.left + loff > options.leftLimit) {
                                anim.left = sOff.left + loff + 'px';
                            } else {
                                anim.left = options.leftLimit + 'px';
                            }
                        }
                    }
                }
                if (options.onBeforeScroll(element, parseInt(anim.top, 10) || 0, parseInt(anim.left, 10) || 0) !== false) {
                    if (options.smooth) {
                        anim.onEnd = function () {
                            options.onScroll(element, anim.top, anim.left);
                        };
                        element.shift(anim);
                    } else {
                        element.style.left = anim.left;
                        element.style.top = anim.top;
                        options.onScroll(element, anim.top, anim.left);
                    }
                }
            };
            if (options.smooth === false) {
                doScroll();
            } else {
                timer = setTimeout(doScroll, options.delay);
            }
            return element;
        };
        element.pin = function () {
            options.onPinned(element);
            element.pinned = true;
        };
        element.isPinned = function () {
            return element.pinned;
        };
        element.unpin = function () {
            element.pinned = false;
            onScroll();
            options.onUnpinned(element);
        };
        element.update = onScroll;
        element.updateLimits = function (top, left) {
            options.topLimit = top || parseInt(element.getStyle('top') || 0, 10);
            options.leftLimit = left || parseInt(element.getStyle('left') || 0, 10);
            return element;
        };
        Event.observe(window, 'scroll', onScroll);
        return element;
    },
    bigSelect: function (element, options) {
        element = $(element);
        if (!Prototype.Browser.IE9 && !Prototype.Browser.IE10 && Prototype.Browser.IE) {
            return element;
        }
        options = Object.extend({
            classpreFix: 'big-select',
            additionalClassName: '',
            onSelect: function (x) {
                return x;
            },
            onComplete: function (x) {
                return x;
            }
        }, options || {});
        if (element.selectConverted) {
            element.selectConverted.remove();
        }
        var cont = new Element('div', {
            className: options.classpreFix + ' ' + options.additionalClassName,
            tabIndex: '1'
        }).setStyle({
            outline: 'none',
            fontSize: element.getStyle('font-size')
        });
        var content = new Element('div', {
            className: options.classpreFix + '-content'
        });
        var list = new Element('div', {
            className: options.classpreFix + '-list'
        }).setStyle('z-index:2000000').hide();
        var arrow = new Element('div', {
            className: options.classpreFix + '-arrow'
        });
        var span = new Element('div', {
            className: options.classpreFix + '-content-span'
        });
        element.selectConverted = cont;
        cont.setUnselectable();
        if (options.width) {
            cont.setStyle({
                width: options.width
            });
        }
        content.update(span);
        cont.insert(content).insert(list).insert(arrow);
        element.insert({
            before: cont
        }).hide();
        element.observe('change', function () {
            span.update(options.onSelect(element.getSelected().text));
        });
        var closeList = function () {
            cont.removeClassName(options.classpreFix + '-open');
            list.hide();
        };
        $A(element.options).each(function (opt) {
            if (opt.selected) {
                span.update(options.onSelect(opt.text));
            }
            var li = new Element('li', {
                value: opt.value
            }).insert(opt.text);
            li.hover(function () {
                li.setStyle('background:#ccc');
            }, function () {
                li.setStyle({
                    background: ''
                });
            });
            li.observe('click', function () {
                span.update(options.onSelect(li.innerHTML, li.readAttribute('value')));
                element.selectOption(li.readAttribute('value'));
                closeList();
            });
            list.insert(li);
        });
        cont.observe('blur', function () {
            closeList();
        });
        list.show();
        var currentTop = list.getStyle('top');
        list.hide();
        var toggleList = function () {
            if (list.visible()) {
                closeList();
            } else {
                list.show();
                cont.addClassName(options.classpreFix + '-open');
                list.setStyle({
                    height: '',
                    overflow: '',
                    bottom: ''
                });
                var vh = document.viewport.getHeight();
                var lt = list.cumulativeOffset().top;
                var lh = list.getHeight();
                if (vh < lt + lh) {
                    if (vh - lt - 20 < 150) {
                        var h = 'auto';
                        if (lh > lt) {
                            h = (lt - 10) + 'px';
                        }
                        list.setStyle({
                            bottom: content.getHeight() + 'px',
                            top: 'auto',
                            height: h,
                            overflow: 'auto'
                        });
                    } else {
                        list.setStyle({
                            height: (vh - lt - 20) + 'px',
                            overflow: 'auto'
                        });
                    }
                }
            }
        };
        arrow.observe('click', toggleList);
        content.observe('click', toggleList);
        options.onComplete(cont, element);
        return element;
    },
    rotatingText: function (element, text, options) {
        element = $(element);
        options = Object.extend({
            delimiter: ' - ',
            duration: 150
        }, options || {});
        var orgText = element.innerHTML.strip();
        text += options.delimiter;
        var orgLength = orgText.length;
        var initialText = text.substr(0, orgLength);
        element.innerHTML = initialText;
        var current = 0;
        var interval = setInterval(function () {
            if (current == text.length) {
                current = 0;
                element.innerHTML = text.substr(current++, orgLength);
            } else if (current + orgLength > text.length) {
                var toInsert = text.substr(current, orgLength);
                toInsert += text.substr(0, orgLength - (text.length - current));
                element.innerHTML = toInsert;
                current++;
            } else {
                element.innerHTML = text.substr(current++, orgLength);
            }
        }, options.duration);
        element.rotatingStop = function () {
            clearTimeout(interval);
            element.innerHTML = orgText;
        };
        return element;
    }
};
Element.addMethods(Protoplus.ui);;
var JotForm = {
    url: "//www.jotform.com/",
    server: "//www.jotform.com/server.php",
    conditions: {},
    condValues: {},
    forms: [],
    saveForm: false,
    imageFiles: ["png", "jpg", "jpeg", "ico", "tiff", "bmp", "gif", "apng", "jp2", "jfif"],
    autoCompletes: {},
    defaultValues: {},
    debug: false,
    highlightInputs: true,
    noJump: false,
    initializing: true,
    lastFocus: false,
    saving: false,
    texts: {
        confirmEmail: 'E-mail does not match',
        pleaseWait: 'Please wait...',
        confirmClearForm: 'Are you sure you want to clear the form',
        lessThan: 'Your score should be less than',
        incompleteFields: 'There are incomplete required fields. Please complete them.',
        required: 'This field is required.',
        email: 'Enter a valid e-mail address',
        alphabetic: 'This field can only contain letters',
        numeric: 'This field can only contain numeric values',
        alphanumeric: 'This field can only contain letters and numbers.',
        uploadExtensions: 'You can only upload following files:',
        uploadFilesize: 'File size cannot be bigger than:'
    },
    getServerURL: function () {
        var form = $$('.jotform-form')[0];
        var action;
        if (form) {
            if ((action = form.readAttribute('action'))) {
                if (action.include('submit.php') || action.include('server.php')) {
                    var n = !action.include('server.php') ? "submit" : "server";
                    this.server = action.replace(n + '.php', 'server.php');
                    this.url = action.replace(n + '.php', '');
                } else {
                    var d = action.replace(/\/submit\/.*?$/, '/');
                    this.server = d + 'server.php';
                    this.url = d;
                }
            }
        }
    },
    alterTexts: function (newTexts) {
        Object.extend(this.texts, newTexts || {});
    },
    ie: function () {
        var undef, v = 3,
            div = document.createElement('div'),
            all = div.getElementsByTagName('i');
        while (div.innerHTML = '<!--[if gt IE ' + (++v) + ']><i></i><![endif]-->', all[0]);
        return v > 4 ? v : undef;
    },
    createConsole: function () {
        var consoleFunc = ['log', 'info', 'warn', 'error'];
        $A(consoleFunc).each(function (c) {
            this[c] = function () {
                if (JotForm.debug) {
                    if ('console' in window) {
                        try {
                            console[c].apply(this, arguments);
                        } catch (e) {
                            if (typeof arguments[0] == "string") {
                                console.log(c.toUpperCase() + ": " + $A(arguments).join(', '));
                            } else {
                                if (Prototype.Browser.IE) {
                                    alert(c + ": " + arguments[0]);
                                } else {
                                    console[c](arguments[0]);
                                }
                            }
                        }
                    }
                }
            };
        }.bind(this));
        if (JotForm.debug) {
            JotForm.debugOptions = document.readJsonCookie('debug_options');
        }
    },
    init: function (callback) {
        var ready = function () {
            try {
                this.populateGet();
                if (document.get.debug == "1") {
                    this.debug = true;
                }
                this.createConsole();
                this.getServerURL();
                if (callback) {
                    callback();
                }
                if ((document.get.mode == "edit" || document.get.mode == "inlineEdit" || document.get.mode == 'submissionToPDF') && document.get.sid) {
                    this.editMode();
                }
                this.noJump = ("nojump" in document.get);
                this.uniqueID = this.uniqid();
                this.checkMultipleUploads();
                this.handleSavedForm();
                this.setTitle();
                this.getDefaults();
                this.handlePayPalProMethods();
                this.handleFormCollapse();
                this.handlePages();
                this.highLightLines();
                this.setButtonActions();
                this.initGradingInputs();
                this.setConditionEvents();
                this.prePopulations();
                this.handleAutoCompletes();
                this.handleTextareaLimits();
                this.handleDateTimeChecks();
                this.handleRadioButtons();
                this.setFocusEvents();
                this.disableAcceptonChrome();
                this.handleScreenshot();
                if (this.getQuerystring("compId")) {
                    var compId = this.getQuerystring("compId");
                    window.wixInit = function () {
                        Wix.init({
                            compId: compId
                        });
                    };
                    (function (d) {
                        var js, id = 'wix-jssdk';
                        if (d.getElementById(id)) {
                            return;
                        }
                        js = d.createElement('script');
                        js.id = id;
                        js.async = true;
                        js.src = "//sslstatic.wix.com/services/js-sdk/1.11.0/js/Wix.js";
                        d.getElementsByTagName('head')[0].appendChild(js);
                    }(document));
                    window.wixInit();
                }
                $A(document.forms).each(function (form) {
                    if (form.name == "form_" + form.id || form.name == "q_form_" + form.id) {
                        this.forms.push(form);
                    }
                }.bind(this));
                this.validator();
                this.fixIESubmitURL();
                this.disableHTML5FormValidation();
            } catch (err) {
                JotForm.error(err);
            }
            this.initializing = false;
        }.bind(this);
        if (document.readyState == 'complete' || (this.jsForm && document.readyState === undefined)) {
            ready();
        } else {
            document.ready(ready);
        }
    },
    fixIESubmitURL: function () {
        try {
            if (this.ie() <= 8 && navigator.appVersion.indexOf('NT 5.')) {
                $A(this.forms).each(function (form) {
                    if (form.action.include("s://submit.")) {
                        form.action = form.action.replace(/\/\/submit\..*?\//, "//secure.jotform.com/");
                    }
                });
            }
        } catch (e) {}
    },
    screenshot: false,
    passive: false,
    onprogress: false,
    compact: false,
    imageSaved: false,
    handleScreenshot: function () {
        var $this = this;
        setTimeout(function () {
            $$('.form-screen-button').each(function (button) {
                if (window.parent && window.parent.JotformFeedbackManager) {
                    $this.getContainer(button).show();
                    button.observe('click', function () {
                        $this.passive = false;
                        try {
                            $this.takeScreenShot(button.id.replace('button_', ''));
                        } catch (e) {
                            console.error(e);
                        }
                    });
                    setTimeout(function () {
                        $this.passive = !window.parent.wishboxInstantLoad;
                        $this.takeScreenShot(button.id.replace('button_', ''));
                    }, 0);
                }
            });
        }, 300);
    },
    getCharset: function (doc) {
        if (!doc) {
            doc = document;
        }
        return doc.characterSet || doc.defaultCharset || doc.charset || 'UTF-8';
    },
    disableHTML5FormValidation: function () {
        $$("form").each(function (f) {
            f.setAttribute("novalidate", true);
        });
    },
    takeScreenShot: function (id) {
        var p = window.parent;
        var pleaseWait = '<div id="js_loading" ' + 'style="position:fixed; z-index:10000000; text-align:center; ' + 'background:#333; border-radius:5px; top: 20px; right: 20px; ' + 'padding:10px; box-shadow:0 0 5 rgba(0,0,0,0.5);">' + '<img src="' + this.url + 'images/loader-black.gif" />' + '<div style="font-family:verdana; font-size:12px;color:#fff;">' + 'Please Wait' + '</div></div>';
        if (this.onprogress) {
            p.$jot(pleaseWait).appendTo('body');
            return;
        }
        if (p.wishboxCompactLoad) {
            this.compact = true;
        }
        if (this.screenshot) {
            if (this.compact) {
                p.$jot('.jt-dimmer').hide();
            } else {
                p.$jot('.jt-dimmer, .jotform-feedback-link, .jt-feedback').hide();
            }
            p.jotformScreenshotURL = this.screenshot.data;
            this.injectEditor(this.screenshot.data, this.screenshot.shotURL);
            return;
        }
        this.scuniq = JotForm.uniqid();
        this.scID = id;
        var f = JotForm.getForm($('button_' + this.scID));
        this.sformID = f.formID.value;
        this.onprogress = true;
        var $this = this;
        this.wishboxServer = 'http://screenshots.jotform.com/wishbox-server.php';
        var form = new Element('form', {
            action: this.wishboxServer,
            target: 'screen_frame',
            id: 'screen_form',
            method: 'post',
            "accept-charset": 'utf-8'
        }).hide();
        var doc = '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd"><html xmlns="http://www.w3.org/1999/xhtml" xml:lang="en" lang="en" >';
        p.$jot('.jt-dimmer, .jotform-feedback-link, .jt-feedback').hide();
        p.$jot('.hide-on-screenshot, .hide-on-screenshot *').css({
            'visibility': 'hidden'
        });
        var parentSource = p.document.getElementsByTagName('html')[0].innerHTML;
        parentSource = parentSource.replace(/(<noscript\b[^>]*>.*?<\/noscript>)+/gim, '');
        parentSource = parentSource.replace(/(<noscript\b[^>]*>(\s+.*\s+)+)+<\/noscript>/gim, '');
        p.$jot('.hide-on-screenshot, .hide-on-screenshot *').css({
            'visibility': 'visible'
        });
        parentSource = parentSource.replace(/(\<\/head\>)/gim, "<style>body,html{ min-height: 800px; }</style>$1");
        var ie = $this.ie();
        if (ie !== undefined && ie < 9) {
            parentSource = parentSource.replace(/(\<\/head\>)/gim, "<style>*{ border-radius:0 !important; text-shadow:none !important; box-shadow:none !important; }</style>$1");
        }
        if (this.passive) {
            p.$jot('.jt-dimmer, .jotform-feedback-link, .jt-feedback').show();
        } else {
            p.$jot('.jotform-feedback-link').show();
            p.$jot(pleaseWait).appendTo('body');
        }
        var html = new Element('textarea', {
            name: 'html'
        });
        var nozip = this.getCharset(p.document).toLowerCase() !== 'utf-8';
        if (nozip) {
            html.value = encodeURIComponent(doc + parentSource + "</html>");
            form.insert(new Element('input', {
                type: 'hidden',
                name: 'nozip'
            }).putValue("1"));
        } else {
            form.insert(new Element('input', {
                type: 'hidden',
                name: 'nozip'
            }).putValue("0"));
            html.value = encodeURIComponent(p.$jot.jSEND((doc + parentSource + "</html>")));
        }
        var charset = new Element('input', {
            type: 'hidden',
            name: 'charset'
        }).putValue(this.getCharset(p.document));
        var height = new Element('input', {
            type: 'hidden',
            name: 'height'
        }).putValue(parseFloat(p.$jot(p).height()));
        var scrollTop = new Element('input', {
            type: 'hidden',
            name: 'scrollTop'
        }).putValue(p.$jot(p).scrollTop());
        var url = new Element('input', {
            type: 'hidden',
            name: 'url'
        }).putValue(p.location.href);
        var uid = new Element('input', {
            type: 'hidden',
            name: 'uniqID'
        }).putValue(this.scuniq);
        var fid = new Element('input', {
            type: 'hidden',
            name: 'formID'
        }).putValue(this.sformID);
        var action = new Element('input', {
            type: 'hidden',
            name: 'action'
        }).putValue("getScreenshot");
        var iframe = new Element('iframe', {
            name: 'screen_frame',
            id: 'screen_frame_id'
        }).hide();
        iframe.observe('load', function () {
            $this.checkScreenShot();
        });
        if (p.wishboxInstantLoad && (ie === undefined || ie > 8)) {
            this.injectEditor(false, false);
        }
        form.insert(html).insert(height).insert(scrollTop).insert(action).insert(uid).insert(url).insert(fid).insert(charset);
        $(document.body).insert(form).insert(iframe);
        form.submit();
    },
    checkScreenShot: function () {
        var $this = this;
        var p = window.parent;
        var count = 10;
        p.$jot.getJSON('http://screenshots.jotform.com/queue/' + this.scuniq + '?callback=?', function (data) {
            if (data.success === true) {
                p.$jot.getJSON(data.dataURL + '?callback=?', function (res) {
                    if ($this.passive === false) {
                        p.jotformScreenshotURL = res.data;
                        $this.injectEditor(res.data, res.shotURL);
                    }
                    $this.screenshot = res;
                    $this.onprogress = false;
                    $('screen_form') && $('screen_form').remove();
                    $('screen_frame_id') && $('screen_frame_id').remove();
                });
            } else {
                if ((data.status == 'waiting' || data.status == 'working') && --count) {
                    setTimeout(function () {
                        $this.checkScreenShot();
                    }, 1000);
                } else {
                    alert('We are under heavy load right now. Please try again later.');
                    p.$jot('.jt-dimmer, .jotform-feedback-link').show();
                    p.$jot('.jt-feedback').show('slow');
                }
            }
        });
    },
    injectEditor: function (data, url) {
        if (this.injected) {
            return;
        }
        this.injected = true;
        var $this = this;
        var p = window.parent;
        p.$jot('#js_loading').remove();
        p.$jot.getJSON(this.server + '?callback=?', {
            action: 'getScreenEditorTemplate',
            compact: this.compact
        }, function (res) {
            var iff = '<iframe allowtransparency="true" id="wishbox-frame" src="" ' + 'frameborder="0" style="display:none;border:none; ';
            if (!$this.compact) {
                iff += 'position:fixed;top:0;width:100%;height:100%;left:0;z-index:100000000;';
            } else {
                iff += ('position:absolute;left:0;top:10px;height:' + (p.$jot(p).height() - 120) + 'px;width:' + ((p.$jot(p).width() - 100) - p.$jot('#js-form-content').width()) + 'px;');
            }
            iff += '" scrolling="no"></iframe>';
            var editorFrame;
            p.iframeWidth = ((p.$jot(p).width() - 100) - p.$jot('#js-form-content').width());
            p.iframeHeight = (p.$jot(p).height() - 120);
            if ($this.compact) {
                editorFrame = p.$jot(iff).insertBefore('#js-form-content');
            } else {
                editorFrame = p.$jot(iff).appendTo('body');
            }
            if ($this.compact) {
                p.$jot('#js-form-content').css({
                    'float': 'right'
                });
            }
            var ie = $this.ie();
            if (ie !== undefined && ie < 9) {
                editorFrame.attr('src', 'http://screenshots.jotform.com/opt/templates/screen_editor.html?shot=' + url + '&uniq=' + $this.scuniq);
                var b = p.$jot('<button style="color:#fff;font-size:14px;background:#F59202;border:1px solid #Fa98a2;font-weight:bold;position:fixed;top:5px;right:40px;width:100px;z-index:100000001;">Close Editor</button>').appendTo('body');
                b.click(function () {
                    p.$jot.getJSON('http://screenshots.jotform.com/wishbox-server.php?callback=?', {
                        action: 'getImage',
                        uniqID: $this.scuniq
                    }, function (res) {
                        if (!res.success) {
                            if (confirm('You haven\'t save your edits. Are you sure you want to close the editor?')) {
                                closeFrame();
                                b.remove();
                            }
                        } else {
                            closeFrame();
                            b.remove();
                            putImageOnForm(res.data, res.shotURL);
                        }
                    });
                });
            } else {
                var e = editorFrame[0];
                var frameDocument = (e.contentWindow) ? e.contentWindow : (e.contentDocument.document) ? e.contentDocument.document : e.contentDocument;
                frameDocument.document.open();
                frameDocument.document.write(res.template);
                setTimeout(function () {
                    frameDocument.document.close();
                }, 200);
                p.jotformScreenshotURL = data;
            }
            var closeFrame = function () {
                if ($this.compact) {
                    editorFrame.remove();
                    p.$jot('#js-form-content').css('width', '100%');
                } else {
                    editorFrame.hide('slow', function () {
                        editorFrame.remove();
                    });
                }
                $this.injected = false;
                p.$jot('.jt-dimmer, .jotform-feedback-link').show();
                p.$jot('.jt-feedback').show('slow');
            };
            var putImageOnForm = function (image, url) {
                $('screen_' + $this.scID).update('<img width="100%" align="center" src="' + (url ? url : image) + '" />');
                $('data_' + $this.scID).value = image;
                $('screen_' + $this.scID).up().show();
            };
            p.JotformCancelEditor = function () {
                closeFrame();
            };
            p.JotformFinishEditing = function (image) {
                closeFrame();
                putImageOnForm(image);
                $this.imageSaved = true;
                if ($this.compact) {
                    setTimeout(function () {
                        $(document).fire('image:loaded');
                    }, 100);
                }
            };
        });
    },
    populateGet: function () {
        try {
            if ('FrameBuilder' in window.parent && "get" in window.parent.FrameBuilder && window.parent.FrameBuilder.get != []) {
                document.get = Object.extend(document.get, window.parent.FrameBuilder.get);
            }
        } catch (e) {}
    },
    checkMultipleUploads: function () {
        if ($$('.form-upload-multiple').length > 0) {
            var script = document.createElement('script');
            script.type = "text/javascript";
            script.src = this.url.replace('submit.', 'www.') + "file-uploader/fileuploader.js";
            $(document.body).appendChild(script);
        }
    },
    uniqid: function (prefix, more_entropy) {
        if (typeof prefix == 'undefined') {
            prefix = "";
        }
        var retId;
        var formatSeed = function (seed, reqWidth) {
            seed = parseInt(seed, 10).toString(16);
            if (reqWidth < seed.length) {
                return seed.slice(seed.length - reqWidth);
            }
            if (reqWidth > seed.length) {
                return Array(1 + (reqWidth - seed.length)).join('0') + seed;
            }
            return seed;
        };
        if (!this.php_js) {
            this.php_js = {};
        }
        if (!this.php_js.uniqidSeed) {
            this.php_js.uniqidSeed = Math.floor(Math.random() * 0x75bcd15);
        }
        this.php_js.uniqidSeed++;
        retId = prefix;
        retId += formatSeed(parseInt(new Date().getTime() / 1000, 10), 8);
        retId += formatSeed(this.php_js.uniqidSeed, 5);
        if (more_entropy) {
            retId += (Math.random() * 10).toFixed(8).toString();
        }
        return retId;
    },
    initMultipleUploads: function () {
        $$('.form-upload-multiple').each(function (file) {
            var parent = file.up('div');
            var f = JotForm.getForm(file);
            var formID = f.formID.value;
            var uniq = formID + "_" + JotForm.uniqueID;
            var className = file.className;
            if (className.include("validate[required]")) {
                parent.addClassName("validate[required]");
                parent.validateInput = function () {
                    if (!JotForm.isVisible(parent)) {
                        JotForm.corrected(parent);
                        return true;
                    }
                    if (parent.select('.qq-upload-list li').length < 1) {
                        JotForm.errored(parent, JotForm.texts.required);
                        return false;
                    } else {
                        JotForm.corrected(parent);
                        return true;
                    }
                };
            }
            var hidden = new Element('input', {
                type: 'hidden',
                name: 'temp_upload_folder'
            }).setValue(uniq);
            f.insert({
                top: hidden
            });
            var exts = (file.readAttribute('file-accept') || "").strip();
            exts = (exts !== '*') ? exts.split(', ') : [];
            var n, subLabel = "";
            if ((n = file.next()) && n.hasClassName('form-sub-label')) {
                subLabel = n.innerHTML;
            }
            var m, buttonText;
            if (m = file.previous('.qq-uploader-buttonText-value')) {
                buttonText = m.innerHTML;
            }
            if (!buttonText) {
                buttonText = "Upload a File";
            };
            var uploader = new qq.FileUploader({
                debug: JotForm.debug,
                element: parent,
                action: JotForm.server,
                subLabel: subLabel,
                buttonText: buttonText,
                sizeLimit: parseInt(file.readAttribute('file-maxsize'), 10) * 1024,
                allowedExtensions: exts,
                onComplete: function (id, aa, result) {
                    if (result.success) {
                        parent.value = "uploaded";
                        JotForm.corrected(parent);
                    }
                },
                showMessage: function (message) {
                    JotForm.errored(parent, message);
                    setTimeout(function () {}, 3000);
                },
                params: {
                    action: 'multipleUpload',
                    field: file.name.replace('[]', ''),
                    folder: uniq
                }
            });
        });
    },
    hiddenSubmit: function (frm) {
        if (JotForm.currentSection) {
            JotForm.currentSection.select('.form-pagebreak')[0].insert(new Element('div', {
                className: 'form-saving-indicator'
            }).setStyle('float:right;padding:21px 12px 10px').update('<img src="' + JotForm.url + 'images/ajax-loader.gif" align="absmiddle" /> Saving...'));
        }
        setTimeout(function () {
            JotForm.saving = true;
        }, 10);
        if (!$('hidden_submit_form')) {
            var iframe = new Element('iframe', {
                name: 'hidden_submit',
                id: 'hidden_submit_form'
            }).hide();
            iframe.observe('load', function () {
                JotForm.makeUploadChecks();
                $$('.form-saving-indicator').invoke('remove');
                JotForm.saving = false;
            });
            $(document.body).insert(iframe);
        }
        $('current_page').value = JotForm.currentSection.pagesIndex;
        frm.writeAttribute('target', 'hidden_submit');
        frm.insert({
            top: new Element('input', {
                type: 'hidden',
                name: 'hidden_submission',
                id: 'hidden_submission'
            }).putValue("1")
        });
        frm.submit();
        frm.writeAttribute('target', '');
        $('hidden_submission').remove();
    },
    makeUploadChecks: function () {
        var formIDField = $$('input[name="formID"]')[0];
        var a = new Ajax.Jsonp(JotForm.url + 'server.php', {
            parameters: {
                action: 'getSavedUploadResults',
                formID: formIDField.value,
                sessionID: document.get.session
            },
            evalJSON: 'force',
            onComplete: function (t) {
                console.log(res);
                var res = t.responseJSON;
                if (res.success) {
                    if (res.submissionID && !$('submission_id')) {
                        formIDField.insert({
                            after: new Element('input', {
                                type: 'hidden',
                                name: 'submission_id',
                                id: 'submission_id'
                            }).putValue(res.submissionID)
                        });
                    }
                    JotForm.editMode(res, true);
                }
            }
        });
    },
    handleSavedForm: function () {
        if (!('session' in document.get)) {
            return;
        }
        JotForm.saveForm = true;
        var formIDField = $$('input[name="formID"]')[0];
        formIDField.insert({
            after: new Element('input', {
                type: 'hidden',
                name: 'session_id',
                id: "session"
            }).putValue(document.get.session)
        });
        formIDField.insert({
            after: new Element('input', {
                type: 'hidden',
                id: 'current_page',
                name: 'current_page'
            }).putValue(0)
        });
        var a = new Ajax.Jsonp(JotForm.url + 'server.php', {
            parameters: {
                action: 'getSavedSubmissionResults',
                formID: formIDField.value,
                sessionID: document.get.session
            },
            evalJSON: 'force',
            onComplete: function (t) {
                var res = t.responseJSON;
                if (res.success) {
                    if (res.submissionID) {
                        formIDField.insert({
                            after: new Element('input', {
                                type: 'hidden',
                                name: 'submission_id',
                                id: 'submission_id'
                            }).putValue(res.submissionID)
                        });
                    }
                    try {
                        JotForm.editMode(res);
                    } catch (e) {
                        console.error(e);
                    }
                    JotForm.openInitially = res.currentPage - 1;
                }
            }
        });
    },
    setTitle: function () {
        if (document.title == "Form") {
            var head;
            if ((head = $$('.form-header')[0])) {
                try {
                    document.title = head.innerHTML.stripTags().strip();
                    document.title = document.title.unescapeHTML();
                } catch (e) {
                    document.title = head.innerHTML;
                }
            }
        }
    },
    setFocusEvents: function () {
        $$('.form-textbox, .form-password, .form-radio, .form-checkbox, .form-textarea, .form-upload, .form-dropdown').each(function (input) {
            input.observe('focus', function () {
                JotForm.lastFocus = input;
            });
        });
    },
    disableAcceptonChrome: function () {
        if (!Prototype.Browser.WebKit) {
            return;
        }
        $$('.form-upload').each(function (input) {
            if (input.hasAttribute('accept')) {
                var r = input.readAttribute('accept');
                input.writeAttribute('accept', '');
                input.writeAttribute('file-accept', r);
            }
        });
    },
    setCalendar: function (id) {
        try {
            Calendar.setup({
                triggerElement: "input_" + id + "_pick",
                dateField: "year_" + id,
                selectHandler: JotForm.formatDate
            });
            $('id_' + id).observe('keyup', function () {
                $('id_' + id).fire('date:changed');
            });
            if (!$('day_' + id).hasClassName('noDefault')) {
                JotForm.formatDate({
                    date: (new Date()),
                    dateField: $('id_' + id)
                });
            }
        } catch (e) {
            JotForm.error(e);
        }
    },
    getDefaults: function () {
        $$('.form-textbox, .form-dropdown, .form-textarea').each(function (input) {
            if (input.hinted || input.value === "") {
                return;
            }
            JotForm.defaultValues[input.id] = input.value;
        });
        $$('.form-radio, .form-checkbox').each(function (input) {
            if (!input.checked) {
                return;
            }
            JotForm.defaultValues[input.id] = input.value;
        });
    },
    handleRadioButtons: function () {
        $$('.form-radio-other-input').each(function (inp) {
            inp.disable().hint('Other');
        });
        $$('.form-radio').each(function (radio) {
            var id = radio.id.replace(/input_(\d+)_\d+/gim, '$1');
            if (id.match('other_')) {
                id = radio.id.replace(/other_(\d+)/, '$1');
            }
            if ($('other_' + id)) {
                var other = $('other_' + id);
                var other_input = $('input_' + id);
                radio.observe('click', function () {
                    if (other.checked) {
                        other_input.enable();
                        other_input.select();
                    } else {
                        if (other_input.hintClear) {
                            other_input.hintClear();
                        }
                        other_input.disable();
                    }
                });
            }
        });
    },
    handleDateTimeChecks: function () {
        $$('[name$=\[month\]]').each(function (monthElement) {
            var questionId = monthElement.id.split('month_').last();
            var dateElement = $('id_' + questionId);
            if (!dateElement) return;
            var dayElement = dateElement.select('#day_' + questionId).first();
            var yearElement = dateElement.select('#year_' + questionId).first();
            var hourElement = dateElement.select('#hour_' + questionId).first();
            var minElement = dateElement.select('#min_' + questionId).first();
            var ampmElement = dateElement.select('#ampm_' + questionId).first();
            var dateTimeCheck = function () {
                var erroredElement = null;
                if (monthElement.value != "" || dayElement.value != "" || yearElement.value != "") {
                    var month = +monthElement.value;
                    var day = +dayElement.value;
                    var year = +yearElement.value;
                    if (isNaN(year) || year < 0) {
                        erroredElement = yearElement;
                    } else if (isNaN(month) || month < 1 || month > 12) {
                        erroredElement = monthElement;
                    } else if (isNaN(day) || day < 1) {
                        erroredElement = dayElement;
                    } else {
                        switch (month) {
                            case 2:
                                if ((year % 4 == 0) ? day > 29 : day > 28) {
                                    erroredElement = dayElement;
                                }
                                break;
                            case 4:
                            case 6:
                            case 9:
                            case 11:
                                if (day > 30) {
                                    erroredElement = dayElement;
                                }
                                break;
                            default:
                                if (day > 31) {
                                    erroredElement = dayElement;
                                }
                                break;
                        }
                    }
                }
                if (!erroredElement && hourElement && minElement && (hourElement.value != "" || minElement.value != "")) {
                    var hour = (hourElement.value.strip() == '') ? -1 : +hourElement.value;
                    var min = (minElement.value.strip() == '') ? -1 : +minElement.value;
                    if (isNaN(hour) || (ampmElement ? (hour < 0 || hour > 12) : (hour < 0 || hour > 23))) {
                        erroredElement = hourElement;
                    } else if (isNaN(min) || min < 0 || min > 59) {
                        erroredElement = minElement;
                    }
                }
                if (erroredElement) {
                    JotForm.errored(erroredElement, 'Enter a valid date');
                    dateElement.addClassName('form-line-error');
                    dateElement.addClassName('form-datetime-validation-error');
                } else {
                    JotForm.corrected(monthElement);
                    JotForm.corrected(dayElement);
                    JotForm.corrected(yearElement);
                    if (hourElement && minElement) {
                        JotForm.corrected(hourElement);
                        JotForm.corrected(minElement);
                    }
                    dateElement.removeClassName('form-line-error');
                    dateElement.removeClassName('form-datetime-validation-error');
                }
            };
            monthElement.observe('change', dateTimeCheck);
            dayElement.observe('change', dateTimeCheck);
            yearElement.observe('change', dateTimeCheck);
            if (hourElement && minElement) {
                hourElement.observe('change', dateTimeCheck);
                minElement.observe('change', dateTimeCheck);
            }
        });
    },
    handleTextareaLimits: function () {
        $$('.form-textarea-limit-indicator span').each(function (el) {
            var inpID = el.id.split('-')[0];
            if (!$(inpID)) {
                return;
            }
            var limitType = el.readAttribute('type');
            var limit = el.readAttribute('limit');
            var input = $(inpID);
            input.observe('keyup', function (e) {
                var count;
                if (limitType == 'Words') {
                    count = $A(input.value.split(/\s+/)).without("").length;
                } else if (limitType == 'Letters') {
                    count = input.value.length;
                }
                if (count > limit) {
                    $(el.parentNode).addClassName('form-textarea-limit-indicator-error');
                } else {
                    $(el.parentNode).removeClassName('form-textarea-limit-indicator-error');
                }
                el.update(count + "/" + limit);
            });
            input.run('keyup');
        });
    },
    handleAutoCompletes: function () {
        $H(JotForm.autoCompletes).each(function (pair) {
            var el = $(pair.key);
            el.writeAttribute('autocomplete', 'off');
            var parent = $(el.parentNode);
            var values = $A(pair.value.split('|'));
            var lastValue;
            var selectCount = 0;
            var liHeight = 0;
            var list = new Element('div', {
                className: 'form-autocomplete-list'
            }).setStyle({
                listStyle: 'none',
                listStylePosition: 'outside',
                position: 'absolute',
                zIndex: '10000'
            }).hide();
            var render = function () {
                var dims = el.getDimensions();
                var offs = el.cumulativeOffset();
                list.setStyle({
                    top: ((dims.height + offs[1])) + 'px',
                    left: offs[0] + 'px',
                    width: ((dims.width < 1 ? 100 : dims.width) - 2) + 'px'
                });
                list.show();
            };
            $(document.body).insert(list);
            list.close = function () {
                list.update();
                list.hide();
                selectCount = 0;
            };
            el.observe('blur', function () {
                list.close();
            });
            el.observe('keyup', function (e) {
                var word = el.value;
                if (lastValue == word) {
                    return;
                }
                lastValue = word;
                list.update();
                if (!word) {
                    list.close();
                    return;
                }
                var matches = values.collect(function (v) {
                    if (v.toLowerCase().include(word.toLowerCase())) {
                        return v;
                    }
                }).compact();
                if (matches.length > 0) {
                    matches.each(function (match) {
                        var li = new Element('li', {
                            className: 'form-autocomplete-list-item'
                        });
                        var val = match;
                        li.val = val;
                        try {
                            val = match.replace(new RegExp('(' + word + ')', 'gim'), '<b>$1</b>');
                        } catch (e) {
                            JotForm.error(e);
                        }
                        li.insert(val);
                        li.onmousedown = function () {
                            el.value = match;
                            list.close();
                        };
                        list.insert(li);
                    });
                    render();
                    liHeight = liHeight || $(list.firstChild).getHeight() + (parseInt($(list.firstChild).getStyle('padding'), 10) || 0) + (parseInt($(list.firstChild).getStyle('margin'), 10) || 0);
                    list.setStyle({
                        height: (liHeight * ((matches.length > 9) ? 10 : matches.length) + 4) + 'px',
                        overflow: 'auto'
                    });
                } else {
                    list.close();
                }
            });
            el.observe('keydown', function (e) {
                var selected;
                if (!list.visible() || !list.firstChild) {
                    return;
                }
                selected = list.select('.form-autocomplete-list-item-selected')[0];
                if (selected) {
                    selected.removeClassName('form-autocomplete-list-item-selected');
                }
                switch (e.keyCode) {
                    case Event.KEY_UP:
                        if (selected && selected.previousSibling) {
                            $(selected.previousSibling).addClassName('form-autocomplete-list-item-selected');
                        } else {
                            $(list.lastChild).addClassName('form-autocomplete-list-item-selected');
                        }
                        if (selectCount <= 1) {
                            if (selected && selected.previousSibling) {
                                $(selected.previousSibling).scrollIntoView(true);
                                selectCount = 0;
                            } else {
                                $(list.lastChild).scrollIntoView(false);
                                selectCount = 10;
                            }
                        } else {
                            selectCount--;
                        }
                        break;
                    case Event.KEY_DOWN:
                        if (selected && selected.nextSibling) {
                            $(selected.nextSibling).addClassName('form-autocomplete-list-item-selected');
                        } else {
                            $(list.firstChild).addClassName('form-autocomplete-list-item-selected');
                        }
                        if (selectCount >= 9) {
                            if (selected && selected.nextSibling) {
                                $(selected.nextSibling).scrollIntoView(false);
                                selectCount = 10;
                            } else {
                                $(list.firstChild).scrollIntoView(true);
                                selectCount = 0;
                            }
                        } else {
                            selectCount++;
                        }
                        break;
                    case Event.KEY_ESC:
                        list.close();
                        break;
                    case Event.KEY_TAB:
                    case Event.KEY_RETURN:
                        if (selected) {
                            el.value = selected.val;
                            lastValue = el.value;
                        }
                        list.close();
                        if (e.keyCode == Event.KEY_RETURN) {
                            e.stop();
                        }
                        break;
                    default:
                        return;
                }
            });
        });
    },
    getFileExtension: function (filename) {
        return (/[.]/.exec(filename)) ? (/[^.]+$/.exec(filename))[0] : undefined;
    },
    prePopulations: function () {
        $H(document.get).each(function (pair) {
            if (pair.key.length < 3) {
                return;
            }
            var n = '[name*="_' + pair.key + '"]';
            var input = $$('.form-textbox%s, .form-dropdown%s, .form-textarea%s, .form-hidden%s'.replace(/\%s/gim, n))[0];
            if (input) {
                input.value = pair.value.replace('+', ' ');
                JotForm.defaultValues[input.id] = input.value;
            }
            $$('.form-checkbox%s, .form-radio%s'.replace(/\%s/gim, n)).each(function (input) {
                if ($A(pair.value.split(',')).include(input.value)) {
                    input.click();
                }
            });
        });
    },
    resetForm: function (frm) {
        var hiddens = $(frm).select('input[type="hidden"]');
        hiddens.each(function (h) {
            h.__defaultValue = h.value;
        });
        $(frm).reset();
        hiddens.each(function (h) {
            h.value = h.__defaultValue;
        });
        return frm;
    },
    editMode: function (data, noreset, skipFields) {
        skipFields = skipFields || [];
        var populateData = function (res) {
            if (!noreset) {
                $A(JotForm.forms).each(function (frm) {
                    JotForm.resetForm(frm);
                });
            }
            $H(res.result).each(function (pair) {
                var qid = pair.key,
                    question = pair.value;
                try {
                    if ($A(skipFields).include(question.type)) {
                        return true;
                    }
                    switch (question.type) {
                        case "control_fileupload":
                            if ($('input_' + qid)) {
                                if ($('input_' + qid).uploadMarked == question.value) {
                                    break;
                                }
                            }
                            setTimeout(function () {
                                if ($$('#id_' + qid + ' .qq-upload-list')[0]) {
                                    var questionValue = question.value;
                                    var multiUploadFiles;
                                    var multiUploadFileNames;
                                    questionValue = questionValue.replace(/<a/g, '<li class=" qq-upload-success"><span class="qq-upload-file"><a');
                                    questionValue = questionValue.replace(/<\/a>/g, '<\/a><\/span><span class="qq-upload-delete">X<\/span><\/li>');
                                    questionValue = questionValue.replace(/<br>/g, '');
                                    $$('#id_' + qid + ' ul.qq-upload-list')[0].update(questionValue);
                                    setTimeout(function () {
                                        var fileList = $$('#id_' + qid + ' ul.qq-upload-list li span.qq-upload-delete');
                                        if (fileList) {
                                            fileList.each(function (li) {
                                                li.observe('click', function () {
                                                    this.up().hide();
                                                    var thisUpSelectA = this.up().select('a')[0].text;
                                                    if (!thisUpSelectA) {
                                                        thisUpSelectA = this.up().select('a')[0].innerText;
                                                    }
                                                    $('uploadedBefores_' + qid).value = $('uploadedBefores_' + qid).value.replace(thisUpSelectA, '');
                                                    if (!$('uploadedBefores_' + qid).value) {
                                                        $('uploadedBefores_' + qid).value = ",";
                                                    }
                                                });
                                            });
                                        }
                                    }, 200);
                                    multiUploadFiles = $$('#id_' + qid + ' ul.qq-upload-list li a');
                                    multiUploadFileNames = "";
                                    if (multiUploadFiles) {
                                        multiUploadFiles.each(function (n) {
                                            if (n.text) {
                                                multiUploadFileNames += n.text + ",";
                                            } else if (n.innerText) {
                                                multiUploadFileNames += n.innerText + ",";
                                            } else {
                                                n.up('li.qq-upload-success').hide();
                                            }
                                        });
                                        multiUploadFileNames = multiUploadFileNames.substring(0, multiUploadFileNames.length - 1);
                                    }
                                    $('cid_' + qid).insert({
                                        after: new Element('input', {
                                            id: 'uploadedBefores_' + qid,
                                            type: 'hidden',
                                            name: 'uploadedBefore' + qid
                                        }).putValue(multiUploadFileNames)
                                    });
                                } else {
                                    $$('#clip_' + qid + ', #link_' + qid + ', #old_' + qid).invoke('remove');
                                    $('input_' + qid).uploadMarked = question.value;
                                    $('input_' + qid).resetUpload();
                                    var file = question.value.split("/");
                                    var filename = file[file.length - 1];
                                    var ext = JotForm.getFileExtension(filename);
                                    if (ext !== undefined) {
                                        if (JotForm.imageFiles.include(ext.toLowerCase())) {
                                            var clipDiv = new Element('div', {
                                                id: 'clip_' + qid
                                            }).setStyle({
                                                height: '50px',
                                                width: '50px',
                                                overflow: 'hidden',
                                                marginRight: '5px',
                                                border: '1px solid #ccc',
                                                background: '#fff',
                                                cssFloat: 'left'
                                            });
                                            var img = new Element("img", {
                                                src: question.value,
                                                width: 50
                                            });
                                            clipDiv.insert(img);
                                            $('input_' + qid).insert({
                                                before: clipDiv
                                            });
                                        }
                                    }
                                    var linkContainer = new Element('div', {
                                        id: 'link_' + qid
                                    });
                                    $('input_' + qid).insert({
                                        after: linkContainer.insert(new Element('a', {
                                            href: question.value,
                                            target: '_blank'
                                        }).insert(filename.shorten(40)))
                                    });
                                    $('input_' + qid).insert({
                                        after: new Element('input', {
                                            type: 'hidden',
                                            name: 'input_' + qid + '_old',
                                            id: 'old_' + qid
                                        }).putValue(question.items)
                                    });
                                }
                            }, 200);
                            break;
                        case "control_scale":
                        case "control_radio":
                            if (question.name == undefined) {
                                var radios = $$("#id_" + qid + ' input[type="radio"]');
                            } else {
                                var radios = document.getElementsByName("q" + qid + "_" + ((question.type == "control_radio" || question.type == "control_scale") ? question.name : qid));
                            }
                            $A(radios).each(function (rad) {
                                if (rad.value == question.value) {
                                    rad.checked = true;
                                }
                            });
                            break;
                        case "control_checkbox":
                            var checks = $$("#id_" + qid + ' input[type="checkbox"]');
                            $A(checks).each(function (chk) {
                                if (question.items.include(chk.value)) {
                                    chk.checked = true;
                                }
                            });
                            break;
                        case "control_rating":
                            if ($('input_' + qid)) {
                                ($('input_' + qid).setRating(question.value));
                            }
                            break;
                        case "control_grading":
                            var props = arguments[0][1];
                            var q_id = arguments[0][0];
                            if (!props.isEmpty) {
                                var total = 0;
                                $A(props.items).each(function (val, i) {
                                    var box = document.getElementById("input_" + q_id + "_" + i);
                                    box.putValue(val);
                                    total += parseInt(val);
                                });
                                var tot = document.getElementById("grade_point_" + q_id);
                                tot.update(total);
                            }
                            break;
                        case "control_slider":
                            $('input_' + qid).setSliderValue(question.value);
                            break;
                        case "control_range":
                            $('input_' + qid + "_from").putValue(question.items.from);
                            $('input_' + qid + "_to").putValue(question.items.to);
                            break;
                        case "control_matrix":
                            var extended, objj = false;
                            if (!Object.isArray(question.items)) {
                                extended = $H(question.items);
                                objj = true;
                            } else {
                                extended = $A(question.items);
                            }
                            if (question.name == undefined) {
                                var firstElementInMatrix = $$("#id_" + qid + ' input')[0] || $$("#id_" + qid + ' select')[0];
                                var questionTmpName = firstElementInMatrix.name;
                                var posOfDashPlusOne = questionTmpName.indexOf('_') + 1;
                                var lengthToBracket = questionTmpName.indexOf('[') - posOfDashPlusOne;
                                question.name = questionTmpName.substr(posOfDashPlusOne, lengthToBracket);
                            }
                            extended.each(function (item, i) {
                                if (objj) {
                                    i = item.key;
                                    item = item.value;
                                }
                                if (Object.isString(item)) {
                                    var els = document.getElementsByName("q" + qid + "_" + question.name + "[" + i + "]");
                                    $A(els).each(function (el) {
                                        if (el.value == item) {
                                            el.checked = true;
                                        }
                                    });
                                } else {
                                    $A(item).each(function (it, j) {
                                        var els = document.getElementsByName("q" + qid + "_" + question.name + "[" + i + "][]");
                                        if (els[j].className == "form-checkbox") {
                                            $A(els).each(function (el) {
                                                if (el.value == it) {
                                                    el.checked = true;
                                                }
                                            });
                                        } else {
                                            els[j].value = it;
                                        }
                                    });
                                }
                            });
                            break;
                        case "control_datetime":
                        case "control_fullname":
                            $H(question.items).each(function (item) {
                                if ($(item.key + "_" + qid)) {
                                    ($(item.key + "_" + qid).value = item.value);
                                }
                            });
                            break;
                        case "control_phone":
                        case "control_birthdate":
                        case "control_address":
                            $H(question.items).each(function (item) {
                                if ($('input_' + qid + "_" + item.key)) {
                                    ($('input_' + qid + "_" + item.key).putValue(item.value));
                                }
                            });
                            break;
                        case "control_autoincrement":
                        case "control_hidden":
                            if ($('input_' + qid)) {
                                if (JotForm.saveForm || document.get.mode == 'edit') {
                                    $('input_' + qid).putValue(question.value);
                                } else {
                                    var sec = $$('.form-section')[0];
                                    $$('.form-section li[title="Hidden Field"]')[0];
                                    var hiddenElements = $$('.form-section li[title="Hidden Field"]');
                                    var liOfHidden = '<li id="id_' + qid + '" class="form-line" title="Hidden Field">' + '<label for="input_' + qid + '" id="label_' + qid + '" class="form-label-left"> ' + question.text + ' </label>' + '<div class="form-input" id="cid_' + qid + '"></div></li>';
                                    if (hiddenElements.size() > 0) {
                                        hiddenElements.last().insert({
                                            after: liOfHidden
                                        });
                                    } else {
                                        sec.insert({
                                            top: liOfHidden
                                        });
                                    }
                                    $('cid_' + qid).insert($('input_' + qid).putValue(question.value));
                                    var hiddenInput = $('input_' + qid);
                                    hiddenInput.replace('<input type="text" id="' + hiddenInput.id + '" name="' + hiddenInput.name + '" value="' + hiddenInput.value + '">');
                                    $('input_' + qid).setStyle({
                                        opacity: 0.9,
                                        border: '1px dashed #999',
                                        padding: '3px'
                                    });
                                }
                            }
                            break;
                        case 'control_payment':
                        case 'control_stripe':
                        case 'control_paypal':
                        case 'control_paypalpro':
                        case 'control_clickbank':
                        case 'control_2co':
                        case 'control_worldpay':
                        case 'control_googleco':
                        case 'control_onebip':
                        case 'control_authnet':
                            $H(question.items).each(function (item) {
                                if (item.key == "price") {
                                    $('input_' + qid + '_donation').value = item.value;
                                } else if ("pid" in item.value) {
                                    if ($('input_' + qid + '_' + item.value.pid)) {
                                        $('input_' + qid + '_' + item.value.pid).checked = true;
                                        if ("options" in item.value) {
                                            $A(item.value.options).each(function (option, i) {
                                                if ($('input_' + qid + '_' + option.type + '_' + item.value.pid + '_' + i)) {
                                                    $('input_' + qid + '_' + option.type + '_' + item.value.pid + '_' + i).value = option.selected;
                                                }
                                            });
                                        }
                                    }
                                }
                            });
                            break;
                        case 'control_email':
                            var emailInput = $('input_' + qid);
                            if (emailInput) {
                                emailInput.putValue(question.value);
                                emailInput = $('input_' + qid + '_confirm');
                                if (emailInput) {
                                    emailInput.putValue(question.value);
                                }
                            }
                            break;
                        default:
                            if ($('input_' + qid)) {
                                ($('input_' + qid).putValue(question.value));
                            }
                            break;
                    }
                } catch (e) {}
            });
            $H(JotForm.fieldConditions).each(function (pair) {
                var field = pair.key;
                var event = pair.value.event;
                if (!$(field)) {
                    return;
                }
                $(field).run(event);
            });
        };
        if (data) {
            populateData(data);
        } else {
            var a = new Ajax.Request('server.php', {
                parameters: {
                    action: 'getSubmissionResults',
                    formID: document.get.sid
                },
                evalJSON: 'force',
                onComplete: function (t) {
                    var res = t.responseJSON;
                    if (res.success) {
                        populateData(res);
                        $$('input[name="formID"]')[0].insert({
                            after: new Element('input', {
                                type: 'hidden',
                                name: 'editSubmission'
                            }).putValue(document.get.sid)
                        });
                        if (document.get.mode == "inlineEdit" || document.get.mode == 'submissionToPDF') {
                            $$('input[name="formID"]')[0].insert({
                                after: new Element('input', {
                                    type: 'hidden',
                                    name: 'inlineEdit'
                                }).putValue("yes")
                            });
                        }
                        JotForm.getContainer($$('.form-captcha')[0]).hide();
                        if (document.get.mode == 'submissionToPDF') {
                            $$('.form-section').each(function (value) {
                                value.setStyle({
                                    display: 'inline'
                                });
                            });
                            $$('.form-section-closed').each(function (value) {
                                value.setStyle({
                                    height: 'auto'
                                });
                            });
                            var a = new Ajax.Request('server.php', {
                                parameters: {
                                    action: 'getSetting',
                                    identifier: 'form',
                                    key: 'columnSetting'
                                },
                                evalJSON: 'force',
                                onComplete: function (t) {
                                    var columnSettings = t.responseJSON.value;
                                    var excludeList = $H();
                                    columnSettings.each(function (setting) {
                                        if (!isNaN(parseInt(setting))) excludeList['id_' + setting] = true;
                                    });
                                    var autoHide = columnSettings.indexOf('autoHide') > -1;
                                    var showNonInputs = columnSettings.indexOf('showNonInputs') > -1;
                                    var formElement = $$('.jotform-form')[0];
                                    if (columnSettings.indexOf('showIP') > -1) formElement.insert({
                                        top: new Element('div').update('IP: ')
                                    });;
                                    if (columnSettings.indexOf('created_at') == -1) formElement.insert({
                                        top: new Element('div').update('Submission Date: ' + res.result.created_at.value)
                                    });
                                    if (columnSettings.indexOf('id') == -1) formElement.insert({
                                        top: new Element('div').update('Submission ID: ' + document.get.sid)
                                    });
                                    $$('.form-line').each(function (value) {
                                        if (excludeList(value.id)) value.setStyle({
                                            display: 'none'
                                        });
                                        else value.setStyle({
                                            display: ''
                                        });
                                    });
                                }.bind(this)
                            });
                        }
                    }
                }.bind(this)
            });
        }
    },
    setConditions: function (conditions) {
        JotForm.conditions = conditions;
        conditions.each(function (condition) {
            condition.action = [].concat(condition.action);
        });
    },
    showField: function (field) {
        var element = null;
        var idField = $('id_' + field);
        var cidField = $('cid_' + field);
        var sectionField = $('section_' + field);
        if (sectionField && cidField) {
            element = sectionField;
        } else if (cidField && !idField) {
            element = cidField;
        } else {
            element = idField;
        }
        if (!element) {
            return element;
        }
        element.removeClassName('form-field-hidden');
        if (sectionField) {
            if (element.hasClassName('form-section-closed')) {
                if (element.select('.form-collapse-table')[0].hasClassName('form-collapse-hidden')) {
                    element.removeClassName('form-section-closed');
                    element.addClassName('form-section');
                    element.setStyle({
                        height: "auto",
                        overflow: "hidden"
                    });
                } else {
                    element.setStyle({
                        overflow: "hidden"
                    });
                }
            } else {
                element.setStyle({
                    height: "auto",
                    overflow: "hidden"
                });
            }
        }
        return element.show();
    },
    hideField: function (field) {
        var idPrefix = 'id_';
        if ($('cid_' + field) && !$('id_' + field)) {
            idPrefix = 'cid_';
        }
        if ($('cid_' + field) && $('section_' + field)) {
            idPrefix = 'section_';
        }
        var element = $(idPrefix + field);
        if (element) {
            element.addClassName('form-field-hidden');
            return element.hide();
        }
    },
    checkValueByOperator: function (operator, condValueOrg, fieldValueOrg) {
        var fieldValue = Object.isBoolean(fieldValueOrg) ? fieldValueOrg : fieldValueOrg.toString().strip();
        var condValue = Object.isBoolean(condValueOrg) ? condValueOrg : condValueOrg.toString().strip();
        switch (operator) {
            case "equals":
                return fieldValue == condValue;
            case "notEquals":
                return fieldValue != condValue;
            case "endsWith":
                return fieldValue.endsWith(condValue);
            case "startsWith":
                return fieldValue.startsWith(condValue);
            case "contains":
                return fieldValue.include(condValue);
            case "notContains":
                return !fieldValue.include(condValue);
            case "greaterThan":
                return (parseInt(fieldValue, 10) || 0) > (parseInt(condValue, 10) || 0);
            case "lessThan":
                if (fieldValue.length) {
                    return (parseInt(fieldValue, 10) || 0) < (parseInt(condValue, 10) || 0);
                } else {
                    return false;
                }
            case "isEmpty":
                if (Object.isBoolean(fieldValue)) {
                    return !fieldValue;
                }
                return fieldValue.empty();
            case "isFilled":
                if (Object.isBoolean(fieldValue)) {
                    return fieldValue;
                }
                return !fieldValue.empty();
            case "before":
                return fieldValueOrg < condValueOrg;
            case "after":
                return fieldValueOrg > condValueOrg;
            default:
                JotForm.error("Could not find this operator", operator);
        }
        return false;
    },
    typeCache: {},
    getInputType: function (id) {
        if (JotForm.typeCache[id]) {
            return JotForm.typeCache[id];
        }
        var type = false;
        if ($('input_' + id)) {
            type = $('input_' + id).nodeName.toLowerCase() == 'input' ? $('input_' + id).readAttribute('type').toLowerCase() : $('input_' + id).nodeName.toLowerCase();
            if ($('input_' + id).hasClassName("form-radio-other-input")) {
                type = "radio";
            }
        } else if ($('input_' + id + '_pick')) {
            type = 'datetime';
        } else {
            if ($$('#id_' + id + ' input')[0]) {
                type = $$('#id_' + id + ' input')[0].readAttribute('type').toLowerCase();
                if (type == "text") {
                    type = "combined";
                }
            }
        }
        JotForm.typeCache[id] = type;
        return type;
    },
    strToDate: function (str) {
        var invalid = new Date(undefined);
        var match = /(\d{4})\-(\d{2})-(\d{2})T?(\d{2})?\:?(\d{2})?/gim;
        if (str.empty()) {
            return invalid;
        }
        if (!match.test(str)) {
            return invalid;
        }
        var d = new Date();
        str.replace(match, function (all, year, month, day, hour, minutes) {
            d.setYear(parseInt(year, 10));
            d.setMonth(parseInt(month, 10) - 1);
            d.setDate(parseInt(day, 10));
            if (hour) {
                d.setHours(parseInt(hour, 10));
                d.setMinutes(parseInt(minutes, 10));
            }
            return all;
        });
        return d;
    },
    getDateValue: function (id) {
        var date = "";
        if ($('year_' + id)) {
            date += ($('year_' + id).value || "%empty%");
        }
        if ($('month_' + id)) {
            date += "-" + ($('month_' + id).value || "%empty%");
        }
        if ($('day_' + id)) {
            date += "-" + ($('day_' + id).value || "%empty%");
        }
        if (date.include("%empty%")) {
            JotForm.info("Wrong date: " + date);
            return "";
        }
        var h = "";
        if ($('ampm_' + id)) {
            if ($('hour_' + id)) {
                h = $('hour_' + id).value;
                if ($('ampm_' + id).value == 'pm') {
                    h = parseInt(h, 10) + 12;
                }
                if (h == "24") {
                    h = 0;
                }
                date += "T" + ((h.length == 1 ? "0" + h : h) || "00");
            }
        } else {
            if ($('hour_' + id)) {
                h = $('hour_' + id).value;
                date += "T" + ((h.length == 1 ? "0" + h : h) || "00");
            }
        }
        if ($('min_' + id)) {
            date += ":" + ($('min_' + id).value || "00");
        }
        if (h === "") {
            date += "T00:00";
        }
        return date;
    },
    checkCondition: function (condition) {
        var any = false,
            all = true;
        var filled;
        $A(condition.terms).each(function (term) {
            var value;
            try {
                switch (JotForm.getInputType(term.field)) {
                    case "combined":
                        if (['isEmpty', 'isFilled'].include(term.operator)) {
                            filled = $$('#id_' + term.field + ' input').collect(function (e) {
                                return e.value;
                            }).any();
                            if (JotForm.checkValueByOperator(term.operator, term.value, filled)) {
                                any = true;
                            } else {
                                all = false;
                            }
                            return;
                        }
                        break;
                    case "datetime":
                        value = JotForm.getDateValue(term.field);
                        if (value === undefined) {
                            return;
                        }
                        if (['isEmpty', 'isFilled'].include(term.operator)) {
                            if (JotForm.checkValueByOperator(term.operator, term.value, value)) {
                                any = true;
                            } else {
                                all = false;
                            }
                        } else {
                            if (JotForm.checkValueByOperator(term.operator, JotForm.strToDate(term.value), JotForm.strToDate(value))) {
                                any = true;
                            } else {
                                all = false;
                            }
                        }
                        break;
                    case "checkbox":
                    case "radio":
                        if (['isEmpty', 'isFilled'].include(term.operator)) {
                            filled = $$('#id_' + term.field + ' input').collect(function (e) {
                                return e.checked;
                            }).any();
                            if (JotForm.checkValueByOperator(term.operator, term.value, filled)) {
                                any = true;
                            } else {
                                all = false;
                            }
                            return;
                        }
                        $$('#id_' + term.field + ' input').each(function (input) {
                            var value = input.checked ? input.value : '';
                            if (JotForm.checkValueByOperator(term.operator, term.value, value)) {
                                any = true;
                            } else {
                                if (term.operator == 'notEquals' && term.value == value) {
                                    any = false;
                                    all = false;
                                    throw $break;
                                }
                                if (input.value == term.value) {
                                    all = false;
                                }
                            }
                        });
                        break;
                    case "tel":


                        function phoneInputCheck(type) {
                            value = $('input_' + term.field + type).value;
                            if ($('input_' + term.field + type).hinted) {
                                value = "";
                            }
                            if (value === undefined) {
                                return;
                            }
                            if (JotForm.checkValueByOperator(term.operator, term.value, value)) {
                                any = true;
                            } else {
                                all = false;
                            }
                        };
                        phoneInputCheck("_area");
                        phoneInputCheck("_phone");
                        break;
                    default:
                        value = $('input_' + term.field).value;
                        if ($('input_' + term.field).hinted) {
                            value = "";
                        }
                        if (value === undefined) {
                            return;
                        }
                        if (JotForm.checkValueByOperator(term.operator, term.value, value)) {
                            any = true;
                        } else {
                            all = false;
                        }
                }
            } catch (e) {
                JotForm.error(e);
            }
        });
        if (condition.type == 'field') {
            var isConditionValid = (condition.link.toLowerCase() == 'any' && any) || (condition.link.toLowerCase() == 'all' && all);
            condition.action.each(function (action) {
                if (isConditionValid) {
                    if (action.visibility.toLowerCase() == 'show') {
                        JotForm.showField(action.field);
                    } else {
                        JotForm.hideField(action.field);
                    }
                } else {
                    if (action.visibility.toLowerCase() == 'show') {
                        JotForm.hideField(action.field);
                    } else {
                        JotForm.showField(action.field);
                    }
                }
            });
        } else {
            JotForm.log("any: %s, all: %s, link: %s", any, all, condition.link.toLowerCase());
            if (JotForm.nextPage) {
                return;
            }
            if ((condition.link.toLowerCase() == 'any' && any) || (condition.link.toLowerCase() == 'all' && all)) {
                var action = condition.action[0];
                JotForm.info('Correct: Skip To: ' + action.skipTo);
                var sections = $$('.form-section');
                if (action.skipTo == 'end') {
                    JotForm.nextPage = sections[sections.length - 1];
                } else {
                    JotForm.nextPage = sections[parseInt(action.skipTo.replace('page-', ''), 10) - 1];
                }
            } else {
                JotForm.info('Fail: Skip To: page-' + JotForm.currentPage + 1);
                JotForm.nextPage = false;
            }
        }
    },
    currentPage: false,
    nextPage: false,
    previousPage: false,
    fieldConditions: {},
    setFieldConditions: function (field, event, condition) {
        if (!JotForm.fieldConditions[field]) {
            JotForm.fieldConditions[field] = {
                event: event,
                conditions: []
            };
        }
        JotForm.fieldConditions[field].conditions.push(condition);
    },
    setConditionEvents: function () {
        try {
            $A(JotForm.conditions).each(function (condition) {
                if (condition.type == 'field') {
                    $A(condition.terms).each(function (term) {
                        var id = term.field;
                        switch (JotForm.getInputType(id)) {
                            case "combined":
                                JotForm.setFieldConditions('id_' + id, 'keyup', condition);
                                break;
                            case "datetime":
                                JotForm.setFieldConditions('id_' + id, 'date:changed', condition);
                                break;
                            case "select":
                            case "file":
                                JotForm.setFieldConditions('input_' + id, 'change', condition);
                                break;
                            case "checkbox":
                            case "radio":
                                JotForm.setFieldConditions('id_' + id, 'click', condition);
                                break;
                            case "tel":
                                JotForm.setFieldConditions('input_' + id + '_area', 'keyup', condition);
                                JotForm.setFieldConditions('input_' + id + '_phone', 'keyup', condition);
                                break;
                            default:
                                JotForm.setFieldConditions('input_' + id, 'keyup', condition);
                        }
                    });
                } else {
                    $A(condition.terms).each(function (term) {
                        var id = term.field;
                        var nextButton = JotForm.getSection($('id_' + id)).select('.form-pagebreak-next')[0];
                        if (!nextButton) {
                            return;
                        }
                        nextButton.observe('mousedown', function () {
                            JotForm.checkCondition(condition);
                        });
                    });
                }
            });
            $H(JotForm.fieldConditions).each(function (pair) {
                var field = pair.key;
                var event = pair.value.event;
                var conds = pair.value.conditions;
                if (!$(field)) {
                    return;
                }
                $(field).observe(event, function () {
                    $A(conds).each(function (cond) {
                        var idf = field.replace(/[^0-9]/gim, '');
                        JotForm.checkCondition(cond);
                    });
                }).run(event);
            });
        } catch (e) {
            JotForm.error(e);
        }
    },
    countTotal: function (prices) {
        var total = 0;
        $H(prices).each(function (pair) {
            total = parseFloat(total);
            var price = parseFloat(pair.value.price);
            if ($(pair.key).checked) {
                if ($(pair.value.quantityField)) {
                    price = price * parseInt($(pair.value.quantityField).getSelected().text, 10);
                }
                total += price;
            }
        });
        if (total === 0) {
            total = "0.00";
        }
        if ($("payment_total")) {
            $("payment_total").update(parseFloat(total).toFixed(2));
        }
    },
    totalCounter: function (prices) {
        $H(prices).each(function (pair) {
            $(pair.key).observe('click', function () {
                JotForm.countTotal(prices);
            });
            if ($(pair.value.quantityField)) {
                $(pair.value.quantityField).observe('change', function () {
                    setTimeout(function () {
                        if (JotForm.isVisible($(pair.value.quantityField))) {
                            $(pair.key).checked = true;
                            JotForm.countTotal(prices);
                        }
                    }, 50);
                });
            }
        });
    },
    initCaptcha: function (id) {
        setTimeout(function () {
            var a = new Ajax.Jsonp(JotForm.server, {
                parameters: {
                    action: 'getCaptchaId'
                },
                evalJSON: 'force',
                onComplete: function (t) {
                    t = t.responseJSON || t;
                    if (t.success) {
                        $(id + '_captcha').src = JotForm.url + 'server.php?action=getCaptchaImg&code=' + t.num;
                        $(id + '_captcha_id').value = t.num;
                    }
                }
            });
        }, 150);
    },
    reloadCaptcha: function (id) {
        $(id + '_captcha').src = JotForm.url + 'images/blank.gif';
        JotForm.initCaptcha(id);
    },
    addZeros: function (n, totalDigits) {
        n = n.toString();
        var pd = '';
        if (totalDigits > n.length) {
            for (i = 0; i < (totalDigits - n.length); i++) {
                pd += '0';
            }
        }
        return pd + n.toString();
    },
    formatDate: function (d) {
        var date = d.date;
        var month = JotForm.addZeros(date.getMonth() + 1, 2);
        var day = JotForm.addZeros(date.getDate(), 2);
        var year = date.getYear() < 1000 ? date.getYear() + 1900 : date.getYear();
        var hour = JotForm.addZeros(date.getHours(), 2);
        var min = JotForm.addZeros(date.getMinutes(), 2);
        var id = d.dateField.id.replace(/\w+\_/gim, '');
        $('month_' + id).value = month;
        $('day_' + id).value = day;
        $('year_' + id).value = year;
        if ($('hour_' + id)) {
            if ($('ampm_' + id)) {
                var ap = 'AM';
                if (hour > 11) {
                    ap = "PM";
                }
                if (hour > 12) {
                    hour = hour - 12;
                }
                if (hour === 0) {
                    hour = 12;
                }
                $('hour_' + id).value = hour;
                $('ampm_' + id).selectOption(ap);
            } else {
                $('hour_' + id).value = hour;
            }
        }
        if ($('min_' + id)) {
            $('min_' + id).value = min;
        }
        $('id_' + id).fire('date:changed');
    },
    highLightLines: function () {
        $$('.form-line').each(function (l, i) {
            l.select('input, select, textarea, div, table div, button').each(function (i) {
                i.observe('focus', function () {
                    if (JotForm.isCollapsed(l)) {
                        JotForm.getCollapseBar(l).run('click');
                    }
                    if (!JotForm.highlightInputs) {
                        return;
                    }
                    l.addClassName('form-line-active');
                    if (l.__classAdded) {
                        l.__classAdded = false;
                    }
                }).observe('blur', function () {
                    if (!JotForm.highlightInputs) {
                        return;
                    }
                    l.removeClassName('form-line-active');
                });
            });
        });
    },
    getForm: function (element) {
        element = $(element);
        if (!element.parentNode) {
            return false;
        }
        if (element && element.tagName == "BODY") {
            return false;
        }
        if (element.tagName == "FORM") {
            return $(element);
        }
        return JotForm.getForm(element.parentNode);
    },
    getContainer: function (element) {
        element = $(element);
        if (!element.parentNode) {
            return false;
        }
        if (element && element.tagName == "BODY") {
            return false;
        }
        if (element.hasClassName("form-line")) {
            return $(element);
        }
        return JotForm.getContainer(element.parentNode);
    },
    getSection: function (element) {
        element = $(element);
        if (!element.parentNode) {
            return false;
        }
        if (element && element.tagName == "BODY") {
            return false;
        }
        if (element.hasClassName("form-section-closed") || element.hasClassName("form-section")) {
            return element;
        }
        return JotForm.getSection(element.parentNode);
    },
    getCollapseBar: function (element) {
        element = $(element);
        if (!element.parentNode) {
            return false;
        }
        if (element && element.tagName == "BODY") {
            return false;
        }
        if (element.hasClassName("form-section-closed") || element.hasClassName("form-section")) {
            return element.select('.form-collapse-table')[0];
        }
        return JotForm.getCollapseBar(element.parentNode);
    },
    isCollapsed: function (element) {
        element = $(element);
        if (!element.parentNode) {
            return false;
        }
        if (element && element.tagName == "BODY") {
            return false;
        }
        if (element.className == "form-section-closed") {
            return true;
        }
        return JotForm.isCollapsed(element.parentNode);
    },
    isVisible: function (element) {
        element = $(element);
        if (!element.parentNode) {
            return false;
        }
        if (element && element.tagName == "BODY") {
            return true;
        }
        if (element.style.display == "none" || element.style.visibility == "hidden") {
            return false;
        }
        return JotForm.isVisible(element.parentNode);
    },
    enableDisableButtonsInMultiForms: function () {
        var allButtons = $$('.form-submit-button');
        allButtons.each(function (b) {
            if (b.up('ul.form-section')) {
                if (b.up('ul.form-section').style.display == "none") {
                    b.disable();
                } else {
                    if (b.className.indexOf("disabled") == -1) {
                        b.enable();
                    }
                }
            }
        });
    },
    enableButtons: function () {
        setTimeout(function () {
            $$('.form-submit-button').each(function (b) {
                b.enable();
                b.innerHTML = b.oldText;
            });
        }, 60);
    },
    setButtonActions: function () {
        $$('.form-submit-button').each(function (b) {
            b.oldText = b.innerHTML;
            b.enable();
            b.observe('click', function () {
                setTimeout(function () {
                    if (!$$('.form-error-message')[0] && !$$('.form-textarea-limit-indicator-error')[0]) {
                        var allButtons = $$('.form-submit-button');
                        allButtons.each(function (bu) {
                            bu.innerHTML = JotForm.texts.pleaseWait;
                            bu.addClassName('lastDisabled');
                            bu.disable();
                        });
                    }
                }, 50);
            });
        });
        $$('.form-submit-reset').each(function (b) {
            b.onclick = function () {
                if (!confirm(JotForm.texts.confirmClearForm)) {
                    return false;
                }
            };
        });
        $$('.form-submit-print').each(function (print_button) {
            print_button.observe("click", function () {
                $(print_button.parentNode).hide();
                $$('.form-textarea, .form-textbox').each(function (el) {
                    if (!el.type) {
                        el.value = el.value || '0';
                    }
                    var dateSeparate;
                    if (dateSeparate = el.next('.date-separate')) {
                        dateSeparate.hide();
                    }
                    var elWidth = "";
                    if (el.value.length < el.size) {
                        elWidth = "width:" + el.size * 9 + "px;";
                    }
                    el.insert({
                        before: new Element('div', {
                            className: 'print_fields'
                        }).update(el.value.replace(/\n/g, '<br>')).setStyle('border:1px solid #ccc; padding:1px 4px;min-height:18px;' + elWidth)
                    }).hide();
                });
                window.print();
                $$('.form-textarea, .form-textbox, .date-separate').invoke('show');
                $$('.print_fields').invoke('remove');
                $(print_button.parentNode).show();
            });
        });
    },
    initGradingInputs: function () {
        $$('.form-grading-input').each(function (item) {
            item.observe('blur', function () {
                var id = item.id.replace(/input_(\d+)_\d+/, "$1");
                var total = 0;
                $("grade_error_" + id).innerHTML = "";
                $(item.parentNode.parentNode).select(".form-grading-input").each(function (sibling) {
                    var stotal = parseFloat(sibling.value) || 0;
                    total += stotal;
                });
                var allowed_total = parseFloat($("grade_total_" + id).innerHTML);
                $("grade_point_" + id).innerHTML = total;
                if (total > allowed_total) {
                    $("grade_error_" + id).innerHTML = ' ' + JotForm.texts.lessThan + ' <b>' + allowed_total + '</b>.';
                }
            });
        });
    },
    backStack: [],
    currentSection: false,
    handlePages: function () {
        var $this = this;
        var pages = [];
        var last;
        $$('.form-pagebreak').each(function (page, i) {
            var section = $(page.parentNode.parentNode);
            if (i >= 1) {
                section.hide();
            } else {
                JotForm.currentSection = section;
            }
            pages.push(section);
            section.pagesIndex = i + 1;
            section.select('.form-pagebreak-next').invoke('observe', 'click', function () {
                if (JotForm.saving) {
                    return;
                }
                if (JotForm.validateAll(JotForm.getForm(section))) {
                    if (JotForm.nextPage) {
                        JotForm.backStack.push(section.hide());
                        JotForm.currentSection = JotForm.nextPage.show();
                        if (!$this.noJump) {
                            JotForm.currentSection.scrollIntoView(true);
                        }
                        JotForm.enableDisableButtonsInMultiForms();
                    } else if (section.next()) {
                        JotForm.backStack.push(section.hide());
                        JotForm.currentSection = section.next().show();
                        if (!$this.noJump) {
                            JotForm.currentSection.scrollIntoView(true);
                        }
                        JotForm.enableDisableButtonsInMultiForms();
                    }
                    JotForm.nextPage = false;
                    if (JotForm.saveForm) {
                        JotForm.hiddenSubmit(JotForm.getForm(section));
                    }
                } else {
                    try {
                        $$('.form-button-error').invoke('remove');
                        $$('.form-pagebreak-next').each(function (nextButton) {
                            var errorBox = new Element('div', {
                                className: 'form-button-error'
                            });
                            errorBox.insert(JotForm.texts.incompleteFields);
                            $(nextButton.parentNode.parentNode).insert(errorBox);
                        });
                    } catch (e) {}
                }
            });
            section.select('.form-pagebreak-back').invoke('observe', 'click', function () {
                if (JotForm.saving) {
                    return;
                }
                section.hide();
                JotForm.currentSection = JotForm.backStack.pop().show();
                if (!$this.noJump) {
                    JotForm.currentSection.scrollIntoView(true);
                }
                JotForm.nextPage = false;
                JotForm.enableDisableButtonsInMultiForms();
                if (JotForm.saveForm) {
                    JotForm.hiddenSubmit(JotForm.getForm(section));
                }
                $$('.form-button-error').invoke('remove');
            });
        });
        if (pages.length > 0) {
            var allSections = $$('.form-section');
            if (allSections.length > 0) {
                last = allSections[allSections.length - 1];
            }
            if (last) {
                last.pagesIndex = allSections.length;
                pages.push(last);
                last.hide();
                var li = new Element('li', {
                    className: 'form-input-wide'
                });
                var cont = new Element('div', {
                    className: 'form-pagebreak'
                });
                var backCont = new Element('div', {
                    className: 'form-pagebreak-back-container'
                });
                var back = $$('.form-pagebreak-back-container')[0].select('button')[0];
                back.observe('click', function () {
                    if (JotForm.saving) {
                        return;
                    }
                    last.hide();
                    JotForm.nextPage = false;
                });
                backCont.insert(back);
                cont.insert(backCont);
                li.insert(cont);
                last.insert(li);
            }
        }
    },
    handleFormCollapse: function () {
        var $this = this;
        var openBar = false;
        var openCount = 0;
        $$('.form-collapse-table').each(function (bar) {
            var section = $(bar.parentNode.parentNode);
            section.setUnselectable();
            if (section.className == "form-section-closed") {
                section.closed = true;
            } else {
                if (section.select('.form-collapse-hidden').length < 0) {
                    openBar = section;
                    openCount++;
                }
            }
            bar.observe('click', function () {
                if (section.closed) {
                    section.setStyle('overflow:visible; height:auto');
                    var h = section.getHeight();
                    if (openBar && openBar != section && openCount <= 1) {
                        openBar.className = "form-section-closed";
                        openBar.shift({
                            height: 60,
                            duration: 0.5
                        });
                        openBar.select('.form-collapse-right-show').each(function (e) {
                            e.addClassName('form-collapse-right-hide').removeClassName('form-collapse-right-show');
                        });
                        openBar.closed = true;
                    }
                    openBar = section;
                    section.setStyle('overflow:hidden; height:60px');
                    setTimeout(function () {
                        section.scrollTop = 0;
                        section.className = "form-section";
                    }, 1);
                    section.shift({
                        height: h,
                        duration: 0.5,
                        onEnd: function (e) {
                            e.scrollTop = 0;
                            e.setStyle("height:auto;");
                            if (!$this.noJump) {
                                e.scrollIntoView();
                            }
                        }
                    });
                    section.select('.form-collapse-right-hide').each(function (e) {
                        e.addClassName('form-collapse-right-show').removeClassName('form-collapse-right-hide');
                    });
                    section.closed = false;
                } else {
                    section.scrollTop = 0;
                    section.shift({
                        height: 60,
                        duration: 0.5,
                        onEnd: function (e) {
                            e.className = "form-section-closed";
                        }
                    });
                    if (openBar) {
                        openBar.select('.form-collapse-right-show').each(function (e) {
                            e.addClassName('form-collapse-right-hide').removeClassName('form-collapse-right-show');
                        });
                    }
                    section.closed = true;
                }
            });
        });
    },
    handlePayPalProMethods: function () {
        if ($('creditCardTable')) {
            $$('.paymentTypeRadios').each(function (radio) {
                radio.observe('click', function () {
                    if (radio.checked && radio.value == "express") {
                        $('creditCardTable').hide();
                    }
                    if (radio.checked && radio.value == "credit") {
                        $('creditCardTable').show();
                    }
                });
            });
        }
    },
    description: function (input, message) {
        if (message == "20") {
            return;
        }
        var lineDescription = false;
        if (!$(input)) {
            var id = input.replace(/[^\d]/gim, '');
            if ($("id_" + id)) {
                input = $("id_" + id);
                lineDescription = true;
            } else if ($('section_' + id)) {
                input = $('section_' + id);
                lineDescription = true;
            } else {
                return;
            }
        }
        if ($(input).setSliderValue) {
            input = $($(input).parentNode);
        }
        var cont = JotForm.getContainer(input);
        if (!cont) {
            return;
        }
        var right = false;
        var bubble = new Element('div', {
            className: 'form-description'
        });
        var arrow = new Element('div', {
            className: 'form-description-arrow'
        });
        var arrowsmall = new Element('div', {
            className: 'form-description-arrow-small'
        });
        var content = new Element('div', {
            className: 'form-description-content'
        });
        var indicator;
        if ("desc" in document.get && document.get.desc == 'v2') {
            right = true;
            cont.insert(indicator = new Element('div', {
                className: 'form-description-indicator'
            }));
            bubble.addClassName('right');
        }
        content.insert(message);
        bubble.insert(arrow).insert(arrowsmall).insert(content).hide();
        cont.insert(bubble);
        if ((cont.getWidth() / 2) < bubble.getWidth()) {
            bubble.setStyle('right: -' + (cont.getWidth() - (right ? 100 : 20)) + 'px');
        }
        if (right) {
            var h = indicator.measure('height');
            arrow.setStyle('top:' + ((h / 2) - 20) + 'px');
            arrowsmall.setStyle('top:' + ((h / 2) - 17) + 'px');
            $(cont).mouseEnter(function () {
                cont.setStyle('z-index:10000');
                if (!cont.hasClassName('form-line-active')) {
                    cont.addClassName('form-line-active');
                    cont.__classAdded = true;
                }
                bubble.show();
            }, function () {
                if (cont.__classAdded) {
                    cont.removeClassName('form-line-active');
                    cont.__classAdded = false;
                }
                cont.setStyle('z-index:0');
                bubble.hide();
            });
            $(input).observe('keydown', function () {
                cont.setStyle('z-index:0');
                bubble.hide();
            });
        } else {
            if (lineDescription) {
                $(input).mouseEnter(function () {
                    cont.setStyle('z-index:10000');
                    bubble.show();
                }, function () {
                    cont.setStyle('z-index:0');
                    bubble.hide();
                });
            } else {
                $(cont).mouseEnter(function () {
                    cont.setStyle('z-index:10000');
                    bubble.show();
                }, function () {
                    cont.setStyle('z-index:0');
                    bubble.hide();
                });
                $(input).observe('keyup', function () {
                    cont.setStyle('z-index:0');
                    bubble.hide();
                });
                $(input).observe('focus', function () {
                    cont.setStyle('z-index:10000');
                    bubble.show();
                });
                $(input).observe('blur', function () {
                    cont.setStyle('z-index:0');
                    bubble.hide();
                });
            }
        }
    },
    validateAll: function (form) {
        var ret = true;
        if ($$('.form-textarea-limit-indicator-error')[0]) {
            ret = false;
        }
        if ($$('.form-datetime-validation-error').first()) {
            ret = false;
        }
        var c = "";
        if (form && form.id) {
            c = "#" + form.id + " ";
        }
        $$(c + '*[class*="validate"]').each(function (input) {
            if (input.validateInput === undefined) {
                return;
            }
            if (!( !! input.validateInput && input.validateInput())) {
                ret = false;
            }
        });
        return ret;
		if(ret) {
			checkInfo();
		}
    },
    errored: function (input, message) {
        input = $(input);
        if (input.errored) {
            return false;
        }
        if (input.runHint) {
            input.runHint();
        }
        if (JotForm.isCollapsed(input)) {
            var collapse = JotForm.getCollapseBar(input);
            if (!collapse.errored) {
                collapse.select(".form-collapse-mid")[0].insert({
                    top: '<img src="' + this.url + 'images/exclamation-octagon.png" align="bottom" style="margin-right:5px;"> '
                }).setStyle({
                    color: 'red'
                });
                collapse.errored = true;
            }
        }
        var container = JotForm.getContainer(input);
        input.errored = true;
        input.addClassName('form-validation-error');
        container.addClassName('form-line-error');
        var insertEl = container;
        insertEl = container.select('.form-input')[0];
        if (!insertEl) {
            insertEl = container.select('.form-input-wide')[0];
        }
        if (!insertEl) {
            insertEl = container;
        }
        insertEl.select('.form-error-message').invoke('remove');
        insertEl.insert(new Element('div', {
            className: 'form-error-message'
        }).insert('<img src="' + this.url + 'images/exclamation-octagon.png" align="left" style="margin-right:5px;"> ' + message).insert(new Element('div', {
            className: 'form-error-arrow'
        }).insert(new Element('div', {
            className: 'form-error-arrow-inner'
        }))));
        return false;
    },
    corrected: function (input) {
        JotForm.hideButtonMessage();
        input = $(input);
        input.errored = false;
        if (JotForm.isCollapsed(input)) {
            var collapse = JotForm.getCollapseBar(input);
            if (collapse.errored) {
                collapse.select(".form-collapse-mid")[0].setStyle({
                    color: ''
                }).select('img')[0].remove();
                collapse.errored = false;
            }
        }
        var container = JotForm.getContainer(input);
        if (!container) {
            return true;
        }
        container.select(".form-validation-error").invoke('removeClassName', 'form-validation-error');
        container.removeClassName('form-line-error');
        container.select('.form-error-message').invoke('remove');
        return true;
    },
    hideButtonMessage: function () {
        $$('.form-button-error').invoke('remove');
    },
    showButtonMessage: function () {
        this.hideButtonMessage();
        $$('.form-submit-button').each(function (button) {
            var errorBox = new Element('div', {
                className: 'form-button-error'
            });
            errorBox.insert(JotForm.texts.incompleteFields);
            $(button.parentNode).insert(errorBox);
        });
    },
    validator: function () {
        if (this.debugOptions && this.debugOptions.stopValidations) {
            this.info('Validations stopped by debug parameter');
            return true;
        }
        var $this = this;
        var reg = {
            email: /[a-z0-9!#$%&'*+\/=?\^_`{|}~\-]+(?:\.[a-z0-9!#$%&'*+\/=?\^_`{|}~\-]+)*@(?:[a-z0-9](?:[a-z0-9\-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9\-]*[a-z0-9])/i,
            alphanumeric: /^[a-zA-Z0-9]+$/,
            numeric: /^(\d+[\.]?)+$/,
            alphabetic: /^[a-zA-Z\s]+$/
        };
        $A(JotForm.forms).each(function (form) {
            if (form.validationSet) {
                return;
            }
            form.validationSet = true;
            form.observe('submit', function (e) {
                try {
                    if (!JotForm.validateAll(form)) {
                        JotForm.enableButtons();
                        JotForm.showButtonMessage();
                        e.stop();
                        return;
                    }
                } catch (err) {
                    JotForm.error(err);
                    e.stop();
                    return;
                }
                $$('.form-field-hidden input', '.form-field-hidden select', '.form-field-hidden textarea').each(function (input) {
                    if (input.tagName == 'input' && ['checkbox', 'radio'].include(input.readAttribute('type'))) {
                        input.checked = false;
                    } else {
                        input.clear();
                    }
                });
                if (JotForm.compact && JotForm.imageSaved == false) {
                    e.stop();
                    window.parent.saveAsImage();
                    $(document).observe('image:loaded', function () {
                        var block;
                        $(document.body).insert(block = new Element('div').setStyle('position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.85);'));
                        block.insert('<table height="100%" width="100%"><tr><td align="center" valign="middle" style="font-family:Verdana;color:#fff;font-size:16px;">Please Wait...</td></tr></table>');
                        setTimeout(function () {
                            form.submit();
                        }, 1000);
                    });
                    return;
                }
            });
            $$('#' + form.id + ' *[class*="validate"]').each(function (input) {
                var validations = input.className.replace(/.*validate\[(.*)\].*/, '$1').split(/\s*,\s*/);
                input.validateInput = function (deep) {
                    if (!JotForm.isVisible(input)) {
                        return true;
                    }
                    JotForm.corrected(input);
                    var vals = validations;
                    if (input.hinted === true) {
                        input.clearHint();
                        setTimeout(function () {
                            input.hintClear();
                        }, 150);
                    }
                    if (vals.include("Email_Confirm")) {
                        console.log("if (vals.include(\"Email_Confirm\")) {");
                        var idEmail = input.id.replace(/.*_(\d+)(?:_confirm)?/gim, '$1');
                        if (($('input_' + idEmail).value != $('input_' + idEmail + '_confirm').value)) {
                            return JotForm.errored(input, JotForm.texts.confirmEmail);
                        }
                    } else if (vals.include("required")) {
                        if (input.tagName == 'INPUT' && input.readAttribute('type') == "file") {
                            if (input.value.empty() && !input.uploadMarked) {
                                return JotForm.errored(input, JotForm.texts.required);
                            } else {
                                return JotForm.corrected(input);
                            }
                        } else if (input.tagName == "INPUT" && (input.readAttribute('type') == "radio" || input.readAttribute('type') == "checkbox")) {
                            if ($(input.parentNode).hasClassName('form-matrix-values')) {
                                var ty = input.readAttribute('type');
                                var matrixRows = {};
                                input.up('table').select('input').each(function (e) {
                                    if (!(e.name in matrixRows)) {
                                        matrixRows[e.name] = false;
                                    }
                                    if (matrixRows[e.name] !== true) {
                                        matrixRows[e.name] = e.checked;
                                    }
                                });
                                if (!$H(matrixRows).values().all()) {
                                    return JotForm.errored(input, JotForm.texts.required);
                                }
                            } else if (!$A(document.getElementsByName(input.name)).map(function (e) {
                                return e.checked;
                            }).any()) {
                                return JotForm.errored(input, JotForm.texts.required);
                            }
                        } else if (input.name && input.name.include("[")) {
                            try {
                                var cont = $this.getContainer(input);
                                var checkValues = cont.select('input,select[name*=' + input.name.replace(/\[.*$/, '') + ']').map(function (e) {
                                    if (e.hasClassName('form-address-state')) {
                                        var country = cont.select('.form-address-country')[0].value;
                                        if (country != 'United States' && country != 'Canada' && country != 'Please Select') {
                                            e.removeClassName('form-validation-error');
                                            e.__skipField = true;
                                            return false;
                                        }
                                    } else {
                                        if (e.__skipField) {
                                            e.__skipField = false;
                                        }
                                    }
                                    if (e.className.include('validate[required]') && JotForm.isVisible(e)) {
                                        if (e.value.empty() || e.value.strip() == 'Please Select') {
                                            e.addClassName('form-validation-error');
                                            return true;
                                        }
                                    }
                                    e.removeClassName('form-validation-error');
                                    return false;
                                });
                                if (checkValues.any()) {
                                    return JotForm.errored(input, JotForm.texts.required);
                                }
                            } catch (e) {
                                JotForm.error(e);
                                return JotForm.corrected(input);
                            }
                        }
                        if (input.__skipField) {
                            return JotForm.corrected(input);
                        }
                        if ((!input.value || input.value.strip(" ").empty() || input.value == 'Please Select') && !(input.readAttribute('type') == "radio" || input.readAttribute('type') == "checkbox")) {
                            return JotForm.errored(input, JotForm.texts.required);
                        }
                        vals = vals.without("required");
                    } else if (input.value.empty()) {
                        return true;
                    }
                    if (!vals[0]) {
                        return true;
                    }
                    switch (vals[0]) {
                        case "Email":
                            if (!reg.email.test(input.value)) {
                                return JotForm.errored(input, JotForm.texts.email);
                            }
                            break;
                        case "Alphabetic":
                            if (!reg.alphabetic.test(input.value)) {
                                return JotForm.errored(input, JotForm.texts.alphabetic);
                            }
                            break;
                        case "Numeric":
                            if (!reg.numeric.test(input.value)) {
                                return JotForm.errored(input, JotForm.texts.numeric);
                            }
                            break;
                        case "AlphaNumeric":
                            if (!reg.alphanumeric.test(input.value)) {
                                return JotForm.errored(input, JotForm.texts.alphanumeric);
                            }
                            break;
                        default:
                    }
                    return JotForm.corrected(input);
                };
                var validatorEvent = function (e) {
                    setTimeout(function () {
                        if ($this.lastFocus && ($this.lastFocus == input || $this.getContainer($this.lastFocus) != $this.getContainer(input))) {
                            input.validateInput();
                        } else if (input.type == "hidden") {
                            input.validateInput();
                        }
                    }, 10);
                };
                if (input.type == 'hidden') {
                    input.observe('change', validatorEvent);
                } else {
                    input.observe('blur', validatorEvent);
                }
            });
            $$('.form-upload').each(function (upload) {
                try {
                    var required = !! upload.validateInput;
                    var exVal = upload.validateInput || Prototype.K;
                    upload.validateInput = function () {
                        if (exVal() !== false) {
                            if (!upload.files) {
                                return true;
                            }
                            var acceptString = upload.readAttribute('accept') || upload.readAttribute('file-accept') || "";
                            var maxsizeString = upload.readAttribute('maxsize') || upload.readAttribute('file-maxsize') || "";
                            var accept = acceptString.strip().split(/\s*\,\s*/gim);
                            var maxsize = parseInt(maxsizeString, 10) * 1024;
                            var file = upload.files[0];
                            if (!file) {
                                return true;
                            }
                            if (!file.fileName) {
                                file.fileName = file.name;
                            }
                            var ext = "";
                            if (JotForm.getFileExtension(file.fileName)) {
                                ext = JotForm.getFileExtension(file.fileName);
                            }
                            if (acceptString != "*" && !accept.include(ext) && !accept.include(ext.toLowerCase())) {
                                return JotForm.errored(upload, JotForm.texts.uploadExtensions + ' ' + acceptString);
                            }
                            if (!file.fileSize) {
                                file.fileSize = file.size;
                            }
                            if (file.fileSize > maxsize) {
                                return JotForm.errored(upload, JotForm.texts.uploadFilesize + ' ' + maxsizeString + 'Kb');
                            }
                            return JotForm.corrected(upload);
                        }
                    };
                    if (!required) {
                        upload.addClassName('validate[upload]');
                        upload.observe('blur', upload.validateInput);
                    }
                } catch (e) {
                    JotForm.error(e);
                }
            });
        });
    },
    FBInit: function () {
        JotForm.FBNoSubmit = true;
        FB.getLoginStatus(function (response) {
            if (response.authResponse) {
                JotForm.FBCollectInformation(response.authResponse.userID);
            } else {
                FB.Event.subscribe('auth.login', function (response) {
                    JotForm.FBCollectInformation(response.authResponse.userID);
                });
            }
        });
    },
    FBCollectInformation: function (id) {
        JotForm.FBNoSubmit = false;
        var fls = $$('.form-helper').collect(function (el) {
            var f = "";
            var d = el.readAttribute('data-info').replace("user_", "");
            switch (d) {
                case "location":
                    f = "current_location";
                    break;
                case "can_be_anyvalue":
                    f = "place correct one here";
                    break;
                default:
                    f = d;
            }
            return [f, el.id];
        });
        var fields = {};
        $A(fls).each(function (p) {
            fields[p[0]] = p[1];
        });
        try {
            var columns = $H(fields).keys().join(", ");
            var query = FB.Data.query('SELECT ' + columns + ' FROM user WHERE uid={0}', id);
            query.wait(function (rows) {
                var inp;
                $H(rows[0]).each(function (pair) {
                    if ((inp = $(fields[pair.key]))) {
                        switch (pair.key) {
                            case "current_location":
                                inp.value = pair.value.name;
                                break;
                            case "website":
                                inp.value = pair.value.split(/\s+/).join(", ");
                                break;
                            default:
                                inp.value = pair.value;
                        }
                    }
                });
                JotForm.bringOldFBSubmissionBack(id);
                var hidden = new Element('input', {
                    type: 'hidden',
                    name: 'fb_user_id'
                }).setValue(id);
                var form = JotForm.getForm(inp);
                form.insert({
                    top: hidden
                });
            });
        } catch (e) {
            console.error(e);
        }
        $$('.fb-login-buttons').invoke('show');
        $$('.fb-login-label').invoke('hide');
    },
    bringOldFBSubmissionBack: function (id) {
        var formIDField = $$('input[name="formID"]')[0];
        var a = new Ajax.Jsonp(JotForm.url + 'server.php', {
            parameters: {
                action: 'bringOldFBSubmissionBack',
                formID: formIDField.value,
                fbid: id
            },
            evalJSON: 'force',
            onComplete: function (t) {
                var res = t.responseJSON;
                if (res.success) {
                    JotForm.editMode(res, true, ['control_helper', 'control_fileupload']);
                }
            }
        });
    },
    getQuerystring: function (key, default_) {
        if (default_ == null) default_ = "";
        key = key.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
        var regex = new RegExp("[\\?&]" + key + "=([^&#]*)");
        var qs = regex.exec(window.location.href);
        if (qs == null) return default_;
        else return qs[1];
    }
};
window.fbAsyncInit = JotForm.FBInit.bind(JotForm);;
var Calendar = Class.create();
Calendar.VERSION = '1.2';
Calendar.DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
Calendar.SHORT_DAY_NAMES = ['S', 'M', 'T', 'W', 'T', 'F', 'S', 'S'];
Calendar.MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
Calendar.SHORT_MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
Calendar.NAV_PREVIOUS_YEAR = -2;
Calendar.NAV_PREVIOUS_MONTH = -1;
Calendar.NAV_TODAY = 0;
Calendar.NAV_NEXT_MONTH = 1;
Calendar.NAV_NEXT_YEAR = 2;
Calendar._checkCalendar = function (event) {
    if (!window._popupCalendar) {
        return false;
    }
    if (Element.descendantOf(Event.element(event), window._popupCalendar.container)) {
        return;
    }
    window._popupCalendar.callCloseHandler();
    return Event.stop(event);
};
Calendar.handleMouseDownEvent = function (event) {
    Event.observe(document, 'mouseup', Calendar.handleMouseUpEvent);
    Event.stop(event);
};
Calendar.handleMouseUpEvent = function (event) {
    var el = Event.element(event);
    var calendar = el.calendar;
    var isNewDate = false;
    if (!calendar) {
        return false;
    }
    if (typeof el.navAction == 'undefined') {
        if (calendar.currentDateElement) {
            Element.removeClassName(calendar.currentDateElement, 'selected');
            Element.addClassName(el, 'selected');
            calendar.shouldClose = (calendar.currentDateElement == el);
            if (!calendar.shouldClose) {
                calendar.currentDateElement = el;
            }
        }
        calendar.date.setDateOnly(el.date);
        isNewDate = true;
        calendar.shouldClose = !el.hasClassName('otherDay');
        var isOtherMonth = !calendar.shouldClose;
        if (isOtherMonth) {
            calendar.update(calendar.date);
        }
    } else {
        var date = new Date(calendar.date);
        if (el.navAction == Calendar.NAV_TODAY) {
            date.setDateOnly(new Date());
        }
        var year = date.getFullYear();
        var mon = date.getMonth();

        function setMonth(m) {
            var day = date.getDate();
            var max = date.getMonthDays(m);
            if (day > max) {
                date.setDate(max);
            }
            date.setMonth(m);
        }
        switch (el.navAction) {
            case Calendar.NAV_PREVIOUS_YEAR:
                if (year > calendar.minYear) {
                    date.setFullYear(year - 1);
                }
                break;
            case Calendar.NAV_PREVIOUS_MONTH:
                if (mon > 0) {
                    setMonth(mon - 1);
                } else if (year-- > calendar.minYear) {
                    date.setFullYear(year);
                    setMonth(11);
                }
                break;
            case Calendar.NAV_TODAY:
                break;
            case Calendar.NAV_NEXT_MONTH:
                if (mon < 11) {
                    setMonth(mon + 1);
                } else if (year < calendar.maxYear) {
                    date.setFullYear(year + 1);
                    setMonth(0);
                }
                break;
            case Calendar.NAV_NEXT_YEAR:
                if (year < calendar.maxYear) {
                    date.setFullYear(year + 1);
                }
                break;
        }
        if (!date.equalsTo(calendar.date)) {
            calendar.setDate(date);
            isNewDate = true;
        } else if (el.navAction === 0) {
            isNewDate = (calendar.shouldClose = true);
        }
    }
    if (isNewDate) {
        event && calendar.callSelectHandler();
    }
    if (calendar.shouldClose) {
        event && calendar.callCloseHandler();
    }
    Event.stopObserving(document, 'mouseup', Calendar.handleMouseUpEvent);
    return Event.stop(event);
};
Calendar.defaultSelectHandler = function (calendar) {
    if (!calendar.dateField) {
        return false;
    }
    if (calendar.dateField.tagName == 'DIV') {
        Element.update(calendar.dateField, calendar.date.print(calendar.dateFormat));
    } else if (calendar.dateField.tagName == 'INPUT') {
        calendar.dateField.value = calendar.date.print(calendar.dateFormat);
    }
    if (typeof calendar.dateField.onchange == 'function') {
        calendar.dateField.onchange();
    }
    if (calendar.shouldClose) {
        calendar.callCloseHandler();
    }
};
Calendar.defaultCloseHandler = function (calendar) {
    calendar.hide();
};
Calendar.setup = function (params) {
    function param_default(name, def) {
        if (!params[name]) {
            params[name] = def;
        }
    }
    param_default('dateField', null);
    param_default('triggerElement', null);
    param_default('parentElement', null);
    param_default('selectHandler', null);
    param_default('closeHandler', null);
    if (params.parentElement) {
        var calendar = new Calendar(params.parentElement);
        calendar.setSelectHandler(params.selectHandler || Calendar.defaultSelectHandler);
        if (params.dateFormat) {
            calendar.setDateFormat(params.dateFormat);
        }
        if (params.dateField) {
            calendar.setDateField(params.dateField);
            calendar.parseDate(calendar.dateField.innerHTML || calendar.dateField.value);
        }
        calendar.show();
        return calendar;
    } else {
        var triggerElement = $(params.triggerElement || params.dateField);
        triggerElement.onclick = function () {
            var calendar = new Calendar();
            calendar.setSelectHandler(params.selectHandler || Calendar.defaultSelectHandler);
            calendar.setCloseHandler(params.closeHandler || Calendar.defaultCloseHandler);
            if (params.dateFormat) {
                calendar.setDateFormat(params.dateFormat);
            }
            if (params.dateField) {
                calendar.setDateField(params.dateField);
                calendar.parseDate(calendar.dateField.innerHTML || calendar.dateField.value);
            }
            if (params.dateField) {
                Date.parseDate(calendar.dateField.value || calendar.dateField.innerHTML, calendar.dateFormat);
            }
            calendar.showAtElement(triggerElement);
            return calendar;
        };
    }
};
Calendar.prototype = {
    container: null,
    selectHandler: null,
    closeHandler: null,
    minYear: 1900,
    maxYear: 2100,
    dateFormat: '%Y-%m-%d',
    date: new Date(),
    currentDateElement: null,
    shouldClose: false,
    isPopup: true,
    dateField: null,
    initialize: function (parent) {
        if (parent) {
            this.create($(parent));
        } else {
            this.create();
        }
    },
    update: function (date) {
        var calendar = this;
        var today = new Date();
        var thisYear = today.getFullYear();
        var thisMonth = today.getMonth();
        var thisDay = today.getDate();
        var month = date.getMonth();
        var dayOfMonth = date.getDate();
        if (date.getFullYear() < this.minYear) {
            date.setFullYear(this.minYear);
        } else if (date.getFullYear() > this.maxYear) {
            date.setFullYear(this.maxYear);
        }
        this.date = new Date(date);
        date.setDate(1);
        date.setDate(-(date.getDay()) + 1);
        Element.getElementsBySelector(this.container, 'tbody tr').each(function (row, i) {
            var rowHasDays = false;
            row.immediateDescendants().each(function (cell, j) {
                var day = date.getDate();
                var dayOfWeek = date.getDay();
                var isCurrentMonth = (date.getMonth() == month);
                cell.className = '';
                cell.date = new Date(date);
                cell.update(day);
                if (!isCurrentMonth) {
                    cell.addClassName('otherDay');
                } else {
                    rowHasDays = true;
                }
                if (isCurrentMonth && day == dayOfMonth) {
                    cell.addClassName('selected');
                    calendar.currentDateElement = cell;
                }
                if (date.getFullYear() == thisYear && date.getMonth() == thisMonth && day == thisDay) {
                    cell.addClassName('today');
                }
                if ([0, 6].indexOf(dayOfWeek) != -1) {
                    cell.addClassName('weekend');
                }
                date.setDate(day + 1);
            });
            rowHasDays ? row.show() : row.hide();
        });
        this.container.getElementsBySelector('td.title')[0].update(Calendar.MONTH_NAMES[month] + ' ' + this.date.getFullYear());
    },
    create: function (parent) {
        if (!parent) {
            parent = document.getElementsByTagName('body')[0];
            this.isPopup = true;
        } else {
            this.isPopup = false;
        }
        var table = new Element('table');
        var thead = new Element('thead');
        table.appendChild(thead);
        var row = new Element('tr');
        var cell = new Element('td', {
            colSpan: 7
        });
        cell.addClassName('title');
        row.appendChild(cell);
        thead.appendChild(row);
        row = new Element('tr');
        this._drawButtonCell(row, '&#x00ab;', 1, Calendar.NAV_PREVIOUS_YEAR);
        this._drawButtonCell(row, '&#x2039;', 1, Calendar.NAV_PREVIOUS_MONTH);
        this._drawButtonCell(row, 'Today', 3, Calendar.NAV_TODAY);
        this._drawButtonCell(row, '&#x203a;', 1, Calendar.NAV_NEXT_MONTH);
        this._drawButtonCell(row, '&#x00bb;', 1, Calendar.NAV_NEXT_YEAR);
        thead.appendChild(row);
        row = new Element('tr');
        for (var i = 0; i < 7; ++i) {
            cell = new Element('th').update(Calendar.SHORT_DAY_NAMES[i]);
            if (i === 0 || i == 6) {
                cell.addClassName('weekend');
            }
            row.appendChild(cell);
        }
        thead.appendChild(row);
        var tbody = table.appendChild(new Element('tbody'));
        for (i = 6; i > 0; --i) {
            row = tbody.appendChild(new Element('tr'));
            row.addClassName('days');
            for (var j = 7; j > 0; --j) {
                cell = row.appendChild(new Element('td'));
                cell.calendar = this;
            }
        }
        this.container = new Element('div');
        this.container.addClassName('calendar');
        if (this.isPopup) {
            this.container.setStyle({
                position: 'absolute',
                display: 'none'
            });
            this.container.addClassName('popup');
        }
        this.container.appendChild(table);
        this.update(this.date);
        Event.observe(this.container, 'mousedown', Calendar.handleMouseDownEvent);
        parent.appendChild(this.container);
    },
    _drawButtonCell: function (parent, text, colSpan, navAction) {
        var cell = new Element('td');
        if (colSpan > 1) {
            cell.colSpan = colSpan;
        }
        cell.className = 'button';
        cell.calendar = this;
        cell.navAction = navAction;
        cell.innerHTML = text;
        cell.unselectable = 'on';
        parent.appendChild(cell);
        return cell;
    },
    callSelectHandler: function () {
        if (this.selectHandler) {
            this.selectHandler(this, this.date.print(this.dateFormat));
        }
    },
    callCloseHandler: function () {
        if (this.closeHandler) {
            this.closeHandler(this);
        }
    },
    show: function () {
        this.container.show();
        if (this.isPopup) {
            window._popupCalendar = this;
            Event.observe(document, 'mousedown', Calendar._checkCalendar);
        }
    },
    showAt: function (x, y) {
        this.container.setStyle({
            left: x + 'px',
            top: y + 'px'
        });
        this.show();
    },
    showAtElement: function (element) {
        var pos = Position.cumulativeOffset(element);
        this.showAt((pos[0] - 140 < 0 ? 50 : pos[0] - 140), (pos[1] + 130 < 0 ? 50 : pos[1] + 130));
    },
    hide: function () {
        if (this.isPopup) {
            Event.stopObserving(document, 'mousedown', Calendar._checkCalendar);
        }
        this.container.hide();
    },
    parseDate: function (str, format) {
        if (!format) {
            format = this.dateFormat;
        }
        this.setDate(Date.parseDate(str, format));
    },
    setSelectHandler: function (selectHandler) {
        this.selectHandler = selectHandler;
    },
    setCloseHandler: function (closeHandler) {
        this.closeHandler = closeHandler;
    },
    setDate: function (date) {
        if (!date.equalsTo(this.date)) {
            this.update(date);
        }
    },
    setDateFormat: function (format) {
        this.dateFormat = format;
    },
    setDateField: function (field) {
        this.dateField = $(field);
    },
    setRange: function (minYear, maxYear) {
        this.minYear = minYear;
        this.maxYear = maxYear;
    }
};
window._popupCalendar = null;
Date.DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
Date.SECOND = 1000;
Date.MINUTE = 60 * Date.SECOND;
Date.HOUR = 60 * Date.MINUTE;
Date.DAY = 24 * Date.HOUR;
Date.WEEK = 7 * Date.DAY;
Date.parseDate = function (str, fmt) {
    var today = new Date();
    var y = 0;
    var m = -1;
    var d = 0;
    var a = str.split(/\W+/);
    var b = fmt.match(/%./g);
    var i = 0,
        j = 0;
    var hr = 0;
    var min = 0;
    for (i = 0; i < a.length; ++i) {
        if (!a[i]) {
            continue;
        }
        switch (b[i]) {
            case "%d":
            case "%e":
                d = parseInt(a[i], 10);
                break;
            case "%m":
                m = parseInt(a[i], 10) - 1;
                break;
            case "%Y":
            case "%y":
                y = parseInt(a[i], 10);
                (y < 100) && (y += (y > 29) ? 1900 : 2000);
                break;
            case "%b":
            case "%B":
                for (j = 0; j < 12; ++j) {
                    if (Calendar.MONTH_NAMES[j].substr(0, a[i].length).toLowerCase() == a[i].toLowerCase()) {
                        m = j;
                        break;
                    }
                }
                break;
            case "%H":
            case "%I":
            case "%k":
            case "%l":
                hr = parseInt(a[i], 10);
                break;
            case "%P":
            case "%p":
                if (/pm/i.test(a[i]) && hr < 12) {
                    hr += 12;
                } else if (/am/i.test(a[i]) && hr >= 12) {
                    hr -= 12;
                }
                break;
            case "%M":
                min = parseInt(a[i], 10);
                break;
        }
    }
    if (isNaN(y)) {
        y = today.getFullYear();
    }
    if (isNaN(m)) {
        m = today.getMonth();
    }
    if (isNaN(d)) {
        d = today.getDate();
    }
    if (isNaN(hr)) {
        hr = today.getHours();
    }
    if (isNaN(min)) {
        min = today.getMinutes();
    }
    if (y != 0 && m != -1 && d != 0) {
        return new Date(y, m, d, hr, min, 0);
    }
    y = 0;
    m = -1;
    d = 0;
    for (i = 0; i < a.length; ++i) {
        if (a[i].search(/[a-zA-Z]+/) != -1) {
            var t = -1;
            for (j = 0; j < 12; ++j) {
                if (Calendar.MONTH_NAMES[j].substr(0, a[i].length).toLowerCase() == a[i].toLowerCase()) {
                    t = j;
                    break;
                }
            }
            if (t != -1) {
                if (m != -1) {
                    d = m + 1;
                }
                m = t;
            }
        } else if (parseInt(a[i], 10) <= 12 && m == -1) {
            m = a[i] - 1;
        } else if (parseInt(a[i], 10) > 31 && y == 0) {
            y = parseInt(a[i], 10);
            (y < 100) && (y += (y > 29) ? 1900 : 2000);
        } else if (d == 0) {
            d = a[i];
        }
    }
    if (y == 0) {
        y = today.getFullYear();
    }
    if (m != -1 && d != 0) {
        return new Date(y, m, d, hr, min, 0);
    }
    return today;
};
Date.prototype.getMonthDays = function (month) {
    var year = this.getFullYear();
    if (typeof month == "undefined") {
        month = this.getMonth();
    }
    if (((0 == (year % 4)) && ((0 != (year % 100)) || (0 == (year % 400)))) && month == 1) {
        return 29;
    } else {
        return Date.DAYS_IN_MONTH[month];
    }
};
Date.prototype.getDayOfYear = function () {
    var now = new Date(this.getFullYear(), this.getMonth(), this.getDate(), 0, 0, 0);
    var then = new Date(this.getFullYear(), 0, 0, 0, 0, 0);
    var time = now - then;
    return Math.floor(time / Date.DAY);
};
Date.prototype.getWeekNumber = function () {
    var d = new Date(this.getFullYear(), this.getMonth(), this.getDate(), 0, 0, 0);
    var DoW = d.getDay();
    d.setDate(d.getDate() - (DoW + 6) % 7 + 3);
    var ms = d.valueOf();
    d.setMonth(0);
    d.setDate(4);
    return Math.round((ms - d.valueOf()) / (7 * 864e5)) + 1;
};
Date.prototype.equalsTo = function (date) {
    return ((this.getFullYear() == date.getFullYear()) && (this.getMonth() == date.getMonth()) && (this.getDate() == date.getDate()) && (this.getHours() == date.getHours()) && (this.getMinutes() == date.getMinutes()));
};
Date.prototype.setDateOnly = function (date) {
    var tmp = new Date(date);
    this.setDate(1);
    this.setFullYear(tmp.getFullYear());
    this.setMonth(tmp.getMonth());
    this.setDate(tmp.getDate());
};
Date.prototype.print = function (str) {
    var m = this.getMonth();
    var d = this.getDate();
    var y = this.getFullYear();
    var wn = this.getWeekNumber();
    var w = this.getDay();
    var s = {};
    var hr = this.getHours();
    var pm = (hr >= 12);
    var ir = (pm) ? (hr - 12) : hr;
    var dy = this.getDayOfYear();
    if (ir == 0) {
        ir = 12;
    }
    var min = this.getMinutes();
    var sec = this.getSeconds();
    s["%a"] = Calendar.SHORT_DAY_NAMES[w];
    s["%A"] = Calendar.DAY_NAMES[w];
    s["%b"] = Calendar.SHORT_MONTH_NAMES[m];
    s["%B"] = Calendar.MONTH_NAMES[m];
    s["%C"] = 1 + Math.floor(y / 100);
    s["%d"] = (d < 10) ? ("0" + d) : d;
    s["%e"] = d;
    s["%H"] = (hr < 10) ? ("0" + hr) : hr;
    s["%I"] = (ir < 10) ? ("0" + ir) : ir;
    s["%j"] = (dy < 100) ? ((dy < 10) ? ("00" + dy) : ("0" + dy)) : dy;
    s["%k"] = hr;
    s["%l"] = ir;
    s["%m"] = (m < 9) ? ("0" + (1 + m)) : (1 + m);
    s["%M"] = (min < 10) ? ("0" + min) : min;
    s["%n"] = "\n";
    s["%p"] = pm ? "PM" : "AM";
    s["%P"] = pm ? "pm" : "am";
    s["%s"] = Math.floor(this.getTime() / 1000);
    s["%S"] = (sec < 10) ? ("0" + sec) : sec;
    s["%t"] = "\t";
    s["%U"] = s["%W"] = s["%V"] = (wn < 10) ? ("0" + wn) : wn;
    s["%u"] = w + 1;
    s["%w"] = w;
    s["%y"] = ('' + y).substr(2, 2);
    s["%Y"] = y;
    s["%%"] = "%";
    return str.gsub(/%./, function (match) {
        return s[match] || match;
    });
};
Date.prototype.__msh_oldSetFullYear = Date.prototype.setFullYear;
Date.prototype.setFullYear = function (y) {
    var d = new Date(this);
    d.__msh_oldSetFullYear(y);
    if (d.getMonth() != this.getMonth()) {
        this.setDate(28);
    }
    this.__msh_oldSetFullYear(y);
};
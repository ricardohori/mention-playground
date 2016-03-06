function extend() {
    var extended = {};

    for (var key in arguments) {
        var argument = arguments[key];
        for (var prop in argument) {
            if (Object.prototype.hasOwnProperty.call(argument, prop)) {
                extended[prop] = argument[prop];
            }
        }
    }

    return extended;
}

function createElement(string) {
    var container = document.createElement('div');
    container.innerHTML = string;
    return container.childNodes[0];
}

function findChild(parent, classSelector) {
    for (var i in parent.childNodes) {
        var child = parent.childNodes[i];
        if (child.className.indexOf(classSelector) > -1) {
            return child;
        }
    }
}

// @author Rob W       http://stackoverflow.com/users/938089/rob-w
// @name               getTextBoundingRect
// @param input          Required HTMLElement with `value` attribute
// @param selectionStart Optional number: Start offset. Default 0
// @param selectionEnd   Optional number: End offset. Default selectionStart
// @param debug          Optional boolean. If true, the created test layer
//                         will not be removed.
function getCoordinates(input, selectionStart, selectionEnd, debug) {
    // Basic parameter validation
    if(!input || !('value' in input)) return input;
    if(typeof selectionStart == "string") selectionStart = parseFloat(selectionStart);
    if(typeof selectionStart != "number" || isNaN(selectionStart)) {
        selectionStart = 0;
    }
    if(selectionStart < 0) selectionStart = 0;
    else selectionStart = Math.min(input.value.length, selectionStart);
    if(typeof selectionEnd == "string") selectionEnd = parseFloat(selectionEnd);
    if(typeof selectionEnd != "number" || isNaN(selectionEnd) || selectionEnd < selectionStart) {
        selectionEnd = selectionStart;
    }
    if (selectionEnd < 0) selectionEnd = 0;
    else selectionEnd = Math.min(input.value.length, selectionEnd);

    // If available (thus IE), use the createTextRange method
    if (typeof input.createTextRange == "function") {
        var range = input.createTextRange();
        range.collapse(true);
        range.moveStart('character', selectionStart);
        range.moveEnd('character', selectionEnd - selectionStart);
        return range.getBoundingClientRect();
    }
    // createTextRange is not supported, create a fake text range
    var offset = getInputOffset(),
        topPos = offset.top,
        leftPos = offset.left,
        width = getInputCSS('width', true),
        height = getInputCSS('height', true);

    // Styles to simulate a node in an input field
    var cssDefaultStyles = "white-space:pre;padding:0;margin:0;",
        listOfModifiers = ['direction', 'font-family', 'font-size', 'font-size-adjust', 'font-variant', 'font-weight',
            'font-style', 'letter-spacing', 'line-height', 'text-align', 'text-indent', 'text-transform', 'word-wrap',
            'word-spacing'];

    topPos += getInputCSS('padding-top', true);
    topPos += getInputCSS('border-top-width', true);
    leftPos += getInputCSS('padding-left', true);
    leftPos += getInputCSS('border-left-width', true);
    leftPos += 1; //Seems to be necessary

    for (var i=0; i<listOfModifiers.length; i++) {
        var property = listOfModifiers[i];
        cssDefaultStyles += property + ':' + getInputCSS(property) +';';
    }
    // End of CSS variable checks

    var text = input.value,
        textLen = text.length,
        fakeClone = document.createElement("div");
    if(selectionStart > 0) appendPart(0, selectionStart);
    var fakeRange = appendPart(selectionStart, selectionEnd);
    if(textLen > selectionEnd) appendPart(selectionEnd, textLen);

    // Styles to inherit the font styles of the element
    fakeClone.style.cssText = cssDefaultStyles;

    // Styles to position the text node at the desired position
    fakeClone.style.position = "absolute";
    fakeClone.style.top = topPos + "px";
    fakeClone.style.left = leftPos + "px";
    fakeClone.style.width = width + "px";
    fakeClone.style.height = height + "px";
    document.body.appendChild(fakeClone);
    var returnValue = fakeRange.getBoundingClientRect(); //Get rect

    if (!debug) fakeClone.parentNode.removeChild(fakeClone); //Remove temp

    return {
        top: returnValue.top,
        bottom: returnValue.bottom,
        left: returnValue.left,
        right: returnValue.right,
        height: returnValue.height + height,
        width: returnValue.width + width
    };

    // Local functions for readability of the previous code
    function appendPart(start, end){
        var span = document.createElement("span");
        span.style.cssText = cssDefaultStyles; //Force styles to prevent unexpected results
        span.textContent = text.substring(start, end);
        fakeClone.appendChild(span);
        return span;
    }
    // Computing offset position
    function getInputOffset(){
        var body = document.body,
            win = document.defaultView,
            docElem = document.documentElement,
            box = document.createElement('div');
        box.style.paddingLeft = box.style.width = "1px";
        body.appendChild(box);
        var isBoxModel = box.offsetWidth == 2;
        body.removeChild(box);
        box = input.getBoundingClientRect();
        var clientTop  = docElem.clientTop  || body.clientTop  || 0,
            clientLeft = docElem.clientLeft || body.clientLeft || 0,
            scrollTop  = win.pageYOffset || isBoxModel && docElem.scrollTop  || body.scrollTop,
            scrollLeft = win.pageXOffset || isBoxModel && docElem.scrollLeft || body.scrollLeft;
        return {
            top : box.top  + scrollTop  - clientTop,
            left: box.left + scrollLeft - clientLeft};
    }

    function getInputCSS(prop, isnumber){
        var val = document.defaultView.getComputedStyle(input, null).getPropertyValue(prop);
        return isnumber ? parseFloat(val) : val;
    }
}

function insertAfter(newNode, referenceNode) {
    return referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling);
}

function filter(array, conditionFunction) {
    var validValues = [];
    for (var index = 0; index < array.length; index++) {
        if (conditionFunction(array[index])) {
            validValues.push(array[index]);
        }
    }
    return validValues;
}

function fireEvent(node, eventName) {
    // Make sure we use the ownerDocument from the provided node to avoid cross-window problems
    var doc, event;
    if (node.ownerDocument) {
        doc = node.ownerDocument;
    } else if (node.nodeType == 9){
        // the node may be the document itself, nodeType 9 = DOCUMENT_NODE
        doc = node;
    } else {
        throw new Error("Invalid node passed to fireEvent: " + node.id);
    }

    if (node.dispatchEvent) {
        // Gecko-style approach (now the standard) takes more work
        var eventClass = "";

        // Different events have different event classes.
        // If this switch statement can't map an eventName to an eventClass,
        // the event firing is going to fail.
        switch (eventName) {
            case "click": // Dispatching of 'click' appears to not work correctly in Safari. Use 'mousedown' or 'mouseup' instead.
            case "mousedown":
            case "mouseup":
                eventClass = "MouseEvents";
                break;

            case "focus":
            case "change":
            case "blur":
            case "select":
                eventClass = "HTMLEvents";
                break;

            default:
                throw "fireEvent: Couldn't find an event class for event '" + eventName + "'.";
                break;
        }
        event = doc.createEvent(eventClass);

        var bubbles = eventName != "change";
        event.initEvent(eventName, bubbles, true); // All events created as bubbling and cancelable.

        event.synthetic = true; // allow detection of synthetic events
        // The second parameter says go ahead with the default action
        node.dispatchEvent(event, true);
    } else  if (node.fireEvent) {
        // IE-old school style
        event = doc.createEventObject();
        event.synthetic = true; // allow detection of synthetic events
        node.fireEvent("on" + eventName, event);
    }
}

var defaults = {
    source: [],
    delimiter: '<<',
    emptyQuery: false,
    queryBy: ['name', 'username'],
    items: 99999,
    menu: createElement('<ul class="vt-dropdown"></ul>'),
    item: '<li><a href="#"></a></li>',
    minLength: 1
};

var VanillaMention = function (element, options) {
    this.$element = element;
    this.options = extend({}, defaults, options);
    this.matcher = this.options.matcher || this.matcher;
    this.sorter = this.options.sorter || this.sorter;
    this.highlighter = this.options.highlighter || this.highlighter;
    this.updater = this.options.updater || this.updater;
    this.source = this.options.source;
    this.$menu = this.options.menu;
    this.shown = false;
    this.listen();
};

VanillaMention.prototype = {
    constructor: VanillaMention,

    select: function () {
        var val = findChild(this.$menu, 'active').getAttribute('data-value');
        this.$element.value = this.updater(val);
        fireEvent(this.$element, 'change');
        return this.hide();
    },

    findDelimiterIndex: function(){
        var data = this.query;
        var caratPos = this.$element.selectionStart;
        var i;

        var charsToCompare = '';
        for (i = caratPos - 1; i >= 0; i--) {
            if(charsToCompare.length == this.options.delimiter.length){
                charsToCompare = data[i] + charsToCompare[0];
            }else{
                charsToCompare = data[i] + charsToCompare;
            }
            if (charsToCompare == this.options.delimiter) {
                break;
            }
        }
        return i;
    },

    updater: function (item) {
        var data = this.query;
        var caratPos = this.$element.selectionStart;
        var i = this.findDelimiterIndex();

        var textBefore = data.substring(0, i);
        var textAfter = data.substring(caratPos);
        data = textBefore + this.options.delimiter + item + '>>' + textAfter;

        return data;
    },

    show: function () {
        var position = getCoordinates(this.$element, this.findDelimiterIndex());

        var node = insertAfter(this.$menu, this.$element);
        node.style.position = 'absolute';
        node.style.top = position.top + position.height + 'px';
        node.style.left = position.left + 'px';
        node.style.display = 'inline';

        this.shown = true;
        return this;
    },

    hide: function () {
        this.$menu.style.display = 'none';
        this.shown = false;
        return this;
    },

    lookup: function () {
        var items;

        this.query = this.$element.value;

        if (!this.query || this.query.length < this.options.minLength) {
            return this.shown ? this.hide() : this;
        }

//        This could be used to get remote data instead of using a source list of objects
//        items = $.isFunction(this.source) ? this.source(this.query, $.proxy(this.process, this)) : this.source
        items = this.source;

        return items ? this.process(items) : this;
    },

    process: function (items) {
        var that = this;

        items = filter(items, function(item) {
            return that.matcher(item)
        });

        items = this.sorter(items);

        if (!items.length) {
            return this.shown ? this.hide() : this;
        }

        return this.render(items.slice(0, this.options.items)).show()
    },

    matcher: function (item) {
        if(this.options.emptyQuery){
            var q = (this.query.toLowerCase());
            var caratPos = this.$element.selectionStart;
            var lastChars = q.slice(caratPos - this.options.delimiter.length, caratPos);

            if(lastChars === this.options.delimiter){
                return true;
            }
        }

        for (var i = 0; i < this.options.queryBy.length; i++) {
            var propertyValue = item[this.options.queryBy[i]];
            if (Boolean(propertyValue)) {
                var lowerCaseValue = propertyValue.toLowerCase();

                var matches = (this.extractCurrentQuery(this.query, this.$element.selectionStart).toLowerCase()).match(new RegExp(this.options.delimiter + '\\w+', "g"));

                if (!!matches) {
                    for (var j = 0; j < matches.length; j++) {
                        var match = (matches[j].substring(this.options.delimiter.length)).toLowerCase();

                        if (lowerCaseValue.indexOf(match) != -1) {
                            return true;
                        }
                    }
                }
            }
        }
    },

    extractCurrentQuery: function(query, caratPos) {
        var currentQuery = this.query;
        var lastMatchIndex = this.query.lastIndexOf(">>");
        if(lastMatchIndex > -1){
            currentQuery = this.query.substring(lastMatchIndex + 2);
        }else {
            var i;
            for (i = caratPos; i >= 0; i--) {
                if (query[i] == this.options.delimiter) {
                    break;
                }
            }
            currentQuery = query.substring(i, caratPos);
        }
        return currentQuery;
    },

    sorter: function (items) {
        if (items.length && this.options.sensitive) {
            var currentUser = this.extractCurrentQuery(this.query, this.$element.selectionStart).substring(1);
            var priorities = {
                highest: [],
                high: [],
                med: [],
                low: []
            };
            var finals = [];
            if (currentUser.length == 1) {
                for (var i = 0; i < items.length; i++) {
                    var currentRes = items[i];

                    if (currentRes.username[0] == currentUser) {
                        priorities.highest.push(currentRes);
                    }
                    else if (currentRes.username[0].toLowerCase() == currentUser.toLowerCase()) {
                        priorities.high.push(currentRes);
                    }
                    else if (currentRes.username.indexOf(currentUser) != -1) {
                        priorities.med.push(currentRes);
                    }
                    else {
                        priorities.low.push(currentRes);
                    }
                }
                for (var y in priorities) {
                    for (var j in priorities[y]) {
                        finals.push(priorities[y][j]);
                    }
                }
                return finals;
            }
        }
        return items;
    },

    highlighter: function (item) {
        var currentQuery = this.extractCurrentQuery(this.query, this.$element.selectionStart);
        var queryTokens = currentQuery.replace(this.options.delimiter, '').split(' ');
        queryTokens = filter(queryTokens, function(token){
            return Boolean  (token.trim());
        });
        if(queryTokens.length > 0) {
            var query = '';
            for(var i = 0 ; i < queryTokens.length ; i++){
                if(Boolean(query)){
                    query = query + '|' + queryTokens[i];
                }else{
                    query = queryTokens[i];
                }
            }

            return item.replace(new RegExp('(' + query + ')', 'ig'), function ($1, match) {
                return '<strong>' + match + '</strong>'
            });
        }else{
            return item;
        }
    },

    render: function (items) {
        var that = this;
        items = items.map(function(item) {

            var newItem = createElement(that.options.item);
            newItem.setAttribute('data-value', item.username);

            var _linkInnerHtml = '<div>';

            if (item.name) {
                var highlightedName = that.highlighter(item.name);
                _linkInnerHtml += '<b class="mention_name">' + highlightedName + '</b>';
            }
            _linkInnerHtml += '</div>';


            newItem.childNodes[0].innerHTML = _linkInnerHtml;
            return newItem;
        });

        items[0].className = items[0].className + ' active';

        that.$menu.innerHTML = '';
        items.forEach(function(item){
            that.$menu.appendChild(item);
            item.addEventListener('mouseenter', that.mouseenter.bind(that));
            item.addEventListener('mouseleave', that.mouseleave.bind(that));
        });

        return this;
    },

    next: function () {
        var active = findChild(this.$menu, 'active');
        active.className = active.className.replace('active', '');
        var next = active.nextElementSibling;

        if (!Boolean(next)) {
            next = this.$menu.childNodes[0];
        }

        next.className = next.className + ' active';
    },

    prev: function () {
        var active = findChild(this.$menu, 'active');
        active.className = active.className.replace('active', '');
        var prev = active.previousElementSibling;

        if (!Boolean(prev)) {
            prev = this.$menu.childNodes[this.$menu.childNodes.length -1];
        }

        prev.className = prev.className + ' active';
    },

    listen: function () {
        this.$element.addEventListener('focus', this.focus.bind(this));
        this.$element.addEventListener('blur', this.blur.bind(this));
        this.$element.addEventListener('keypress', this.keypress.bind(this));
        this.$element.addEventListener('keyup', this.keyup.bind(this));

        if (this.eventSupported('keydown')) {
            this.$element.addEventListener('keydown', this.keydown.bind(this));
        }

        this.$menu.addEventListener('click', this.click.bind(this));
    },

    eventSupported: function (eventName) {
        var isSupported = 'on' + eventName in this.$element;
        if (!isSupported) {
            this.$element.setAttribute(eventName, 'return;');
            isSupported = typeof this.$element[eventName] === 'function';
        }
        return isSupported
    },

    move: function (e) {
        if (!this.shown) return;

        switch (e.keyCode) {
            case 9: // tab
            case 13: // enter
            case 27: // escape
                e.preventDefault();
                break;

            case 38: // up arrow
                e.preventDefault();
                this.prev();
                break;

            case 40: // down arrow
                e.preventDefault();
                this.next();
                break;
        }

        e.stopPropagation();
    },

    keydown: function (e) {
        this.suppressKeyPressRepeat = [40, 38, 9, 13, 27].indexOf(e.keyCode) > -1;
        this.move(e);
    },

    keypress: function (e) {
        if (this.suppressKeyPressRepeat) return;
        this.move(e);
    },

    keyup: function (e) {
        switch (e.keyCode) {
            case 40: // down arrow
            case 38: // up arrow
            case 16: // shift
            case 17: // ctrl
            case 18: // alt
                break;

            case 9: // tab
            case 13: // enter
                if (!this.shown) return;
                this.select();
                break;

            case 27: // escape
                if (!this.shown) return;
                this.hide();
                break;

            default:
                this.lookup();
        }

        e.stopPropagation();
        e.preventDefault();
    },

    focus: function (e) {
        this.focused = true;
    },

    blur: function (e) {
        this.focused = false;
        if (!this.mousedover && this.shown) this.hide();
    },

    click: function (e) {
        e.stopPropagation();
        e.preventDefault();
        this.select();
        this.$element.focus();
    },

    mouseenter: function (e) {
        this.mousedover = true;
        var activeChild = findChild(this.$menu, 'active');
        activeChild.className = activeChild.className.replace('active', '');
        e.currentTarget.className = 'active';
    },

    mouseleave: function (e) {
        this.mousedover = false;
        if (!this.focused && this.shown) this.hide();
    }

};

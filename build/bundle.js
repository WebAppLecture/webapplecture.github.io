
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    function assign(tar, src) {
        // @ts-ignore
        for (const k in src)
            tar[k] = src[k];
        return tar;
    }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function validate_store(store, name) {
        if (store != null && typeof store.subscribe !== 'function') {
            throw new Error(`'${name}' is not a store with a 'subscribe' method`);
        }
    }
    function subscribe(store, ...callbacks) {
        if (store == null) {
            return noop;
        }
        const unsub = store.subscribe(...callbacks);
        return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
    }
    function component_subscribe(component, store, callback) {
        component.$$.on_destroy.push(subscribe(store, callback));
    }
    function create_slot(definition, ctx, $$scope, fn) {
        if (definition) {
            const slot_ctx = get_slot_context(definition, ctx, $$scope, fn);
            return definition[0](slot_ctx);
        }
    }
    function get_slot_context(definition, ctx, $$scope, fn) {
        return definition[1] && fn
            ? assign($$scope.ctx.slice(), definition[1](fn(ctx)))
            : $$scope.ctx;
    }
    function get_slot_changes(definition, $$scope, dirty, fn) {
        if (definition[2] && fn) {
            const lets = definition[2](fn(dirty));
            if ($$scope.dirty === undefined) {
                return lets;
            }
            if (typeof lets === 'object') {
                const merged = [];
                const len = Math.max($$scope.dirty.length, lets.length);
                for (let i = 0; i < len; i += 1) {
                    merged[i] = $$scope.dirty[i] | lets[i];
                }
                return merged;
            }
            return $$scope.dirty | lets;
        }
        return $$scope.dirty;
    }
    function update_slot(slot, slot_definition, ctx, $$scope, dirty, get_slot_changes_fn, get_slot_context_fn) {
        const slot_changes = get_slot_changes(slot_definition, $$scope, dirty, get_slot_changes_fn);
        if (slot_changes) {
            const slot_context = get_slot_context(slot_definition, ctx, $$scope, get_slot_context_fn);
            slot.p(slot_context, slot_changes);
        }
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function toggle_class(element, name, toggle) {
        element.classList[toggle ? 'add' : 'remove'](name);
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error(`Function called outside component initialization`);
        return current_component;
    }
    function beforeUpdate(fn) {
        get_current_component().$$.before_update.push(fn);
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }
    function afterUpdate(fn) {
        get_current_component().$$.after_update.push(fn);
    }
    function onDestroy(fn) {
        get_current_component().$$.on_destroy.push(fn);
    }
    function createEventDispatcher() {
        const component = get_current_component();
        return (type, detail) => {
            const callbacks = component.$$.callbacks[type];
            if (callbacks) {
                // TODO are there situations where events could be dispatched
                // in a server (non-DOM) environment?
                const event = custom_event(type, detail);
                callbacks.slice().forEach(fn => {
                    fn.call(component, event);
                });
            }
        };
    }
    function setContext(key, context) {
        get_current_component().$$.context.set(key, context);
    }
    function getContext(key) {
        return get_current_component().$$.context.get(key);
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function tick() {
        schedule_update();
        return resolved_promise;
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    function add_flush_callback(fn) {
        flush_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);
    function outro_and_destroy_block(block, lookup) {
        transition_out(block, 1, 1, () => {
            lookup.delete(block.key);
        });
    }
    function update_keyed_each(old_blocks, dirty, get_key, dynamic, ctx, list, lookup, node, destroy, create_each_block, next, get_context) {
        let o = old_blocks.length;
        let n = list.length;
        let i = o;
        const old_indexes = {};
        while (i--)
            old_indexes[old_blocks[i].key] = i;
        const new_blocks = [];
        const new_lookup = new Map();
        const deltas = new Map();
        i = n;
        while (i--) {
            const child_ctx = get_context(ctx, list, i);
            const key = get_key(child_ctx);
            let block = lookup.get(key);
            if (!block) {
                block = create_each_block(key, child_ctx);
                block.c();
            }
            else if (dynamic) {
                block.p(child_ctx, dirty);
            }
            new_lookup.set(key, new_blocks[i] = block);
            if (key in old_indexes)
                deltas.set(key, Math.abs(i - old_indexes[key]));
        }
        const will_move = new Set();
        const did_move = new Set();
        function insert(block) {
            transition_in(block, 1);
            block.m(node, next);
            lookup.set(block.key, block);
            next = block.first;
            n--;
        }
        while (o && n) {
            const new_block = new_blocks[n - 1];
            const old_block = old_blocks[o - 1];
            const new_key = new_block.key;
            const old_key = old_block.key;
            if (new_block === old_block) {
                // do nothing
                next = new_block.first;
                o--;
                n--;
            }
            else if (!new_lookup.has(old_key)) {
                // remove old block
                destroy(old_block, lookup);
                o--;
            }
            else if (!lookup.has(new_key) || will_move.has(new_key)) {
                insert(new_block);
            }
            else if (did_move.has(old_key)) {
                o--;
            }
            else if (deltas.get(new_key) > deltas.get(old_key)) {
                did_move.add(new_key);
                insert(new_block);
            }
            else {
                will_move.add(old_key);
                o--;
            }
        }
        while (o--) {
            const old_block = old_blocks[o];
            if (!new_lookup.has(old_block.key))
                destroy(old_block, lookup);
        }
        while (n)
            insert(new_blocks[n - 1]);
        return new_blocks;
    }
    function validate_each_keys(ctx, list, get_context, get_key) {
        const keys = new Set();
        for (let i = 0; i < list.length; i++) {
            const key = get_key(get_context(ctx, list, i));
            if (keys.has(key)) {
                throw new Error(`Cannot have duplicate keys in a keyed each`);
            }
            keys.add(key);
        }
    }

    function bind(component, name, callback) {
        const index = component.$$.props[name];
        if (index !== undefined) {
            component.$$.bound[index] = callback;
            callback(component.$$.ctx[index]);
        }
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const prop_values = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, prop_values, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if ($$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set() {
            // overridden by instance, if it has props
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.24.0' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev("SvelteDOMInsert", { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev("SvelteDOMInsert", { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev("SvelteDOMRemove", { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ["capture"] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev("SvelteDOMAddEventListener", { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev("SvelteDOMRemoveEventListener", { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev("SvelteDOMRemoveAttribute", { node, attribute });
        else
            dispatch_dev("SvelteDOMSetAttribute", { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev("SvelteDOMSetData", { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error(`'target' is a required option`);
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn(`Component was already destroyed`); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    function read(src) {
        let parts = src.split("<!-- Code -->"),
            article = parts[0],
            code = parts[1],
            result = {};

        result.article = article;
        if(code) {
            result.editors = {
                style: isolate(code, "<style>", "</style>"),
                script: isolate(code, "<script>", "</script>"),
                html: isolate(code, "<html>", "</html>"),
            };
        } 
        return result;
    }

    function glue(codeObj) {

        return `
<style>
    body { background: white; }
    ${codeObj.style}
</style>
${codeObj.html}
<script>
window.onerror = function() {
    window.parent.postMessage({message: arguments[0], lineNumber: arguments[2] - 1, columnNumber: arguments[3], id: id}, '*');
    return true;
}
</script>
<script>
${preprocessJS(codeObj.script)}
</script>
`;
    }

    function isolate(string, start, end) {
        if(string.includes(start) && string.includes(end)) {
            return string.slice(string.indexOf(start) + start.length, string.indexOf(end)).trim();
        } else {
            return "";
        }
    }

    function preprocessJS(code) {
        //code = code.replace(/`/g, '\\`');
        return code;
    }

    /* src\components\Sandbox.svelte generated by Svelte v3.24.0 */

    const { window: window_1 } = globals;
    const file = "src\\components\\Sandbox.svelte";

    function create_fragment(ctx) {
    	let div;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div = element("div");
    			attr_dev(div, "class", "sandbox-wrapper svelte-1rpxz89");
    			add_location(div, file, 53, 0, 1660);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			/*div_binding*/ ctx[4](div);

    			if (!mounted) {
    				dispose = listen_dev(window_1, "message", /*message*/ ctx[1], false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			/*div_binding*/ ctx[4](null);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function compare(a, b) {
    	return a.html === b.html && a.script === b.script && a.style === b.style;
    }

    function extractErrorLine(stack) {
    	stack.indexOf("eval at <anonymous");
    }

    function instance($$self, $$props, $$invalidate) {
    	const dispatch = createEventDispatcher();
    	let { content } = $$props;
    	let { id } = $$props;
    	let sandbox, wrapper, lastContent = "", unloaded = true;

    	afterUpdate(() => {
    		if (content) {
    			if (unloaded || !compare(content, lastContent)) {
    				dispatch("change", {});
    				$$invalidate(0, wrapper.innerHTML = "", wrapper);
    				let frame = document.createElement("iframe");
    				frame.setAttribute("name", id);
    				frame.setAttribute("autofocus", false);
    				wrapper.appendChild(frame);
    				sandbox = window.open("", id);
    				sandbox.document.open();
    				sandbox.id = id;
    				let newCode = glue(content);
    				sandbox.document.write(newCode);
    				sandbox.document.close();
    				lastContent = { ...content };
    				unloaded = false;
    			}
    		} else {
    			$$invalidate(0, wrapper.innerHTML = "", wrapper);
    			unloaded = true;
    		}
    	});

    	function message(msg) {
    		if (msg.data.id === id) {
    			let { message, lineNumber, columnNumber } = msg.data;

    			message
    			? dispatch("error", message + "  (at " + lineNumber + ":" + columnNumber + ")")
    			: {};
    		}
    	}

    	const writable_props = ["content", "id"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Sandbox> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Sandbox", $$slots, []);

    	function div_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			wrapper = $$value;
    			$$invalidate(0, wrapper);
    		});
    	}

    	$$self.$set = $$props => {
    		if ("content" in $$props) $$invalidate(2, content = $$props.content);
    		if ("id" in $$props) $$invalidate(3, id = $$props.id);
    	};

    	$$self.$capture_state = () => ({
    		onMount,
    		afterUpdate,
    		createEventDispatcher,
    		glue,
    		dispatch,
    		content,
    		id,
    		sandbox,
    		wrapper,
    		lastContent,
    		unloaded,
    		compare,
    		message,
    		extractErrorLine
    	});

    	$$self.$inject_state = $$props => {
    		if ("content" in $$props) $$invalidate(2, content = $$props.content);
    		if ("id" in $$props) $$invalidate(3, id = $$props.id);
    		if ("sandbox" in $$props) sandbox = $$props.sandbox;
    		if ("wrapper" in $$props) $$invalidate(0, wrapper = $$props.wrapper);
    		if ("lastContent" in $$props) lastContent = $$props.lastContent;
    		if ("unloaded" in $$props) unloaded = $$props.unloaded;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [wrapper, message, content, id, div_binding];
    }

    class Sandbox extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, { content: 2, id: 3 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Sandbox",
    			options,
    			id: create_fragment.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*content*/ ctx[2] === undefined && !("content" in props)) {
    			console.warn("<Sandbox> was created without expected prop 'content'");
    		}

    		if (/*id*/ ctx[3] === undefined && !("id" in props)) {
    			console.warn("<Sandbox> was created without expected prop 'id'");
    		}
    	}

    	get content() {
    		throw new Error("<Sandbox>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set content(value) {
    		throw new Error("<Sandbox>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get id() {
    		throw new Error("<Sandbox>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set id(value) {
    		throw new Error("<Sandbox>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    let id = 1;

    function getId() {
      return `svelte-tabs-${id++}`;
    }

    const subscriber_queue = [];
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=}start start and stop notifications for subscriptions
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = [];
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (let i = 0; i < subscribers.length; i += 1) {
                        const s = subscribers[i];
                        s[1]();
                        subscriber_queue.push(s, value);
                    }
                    if (run_queue) {
                        for (let i = 0; i < subscriber_queue.length; i += 2) {
                            subscriber_queue[i][0](subscriber_queue[i + 1]);
                        }
                        subscriber_queue.length = 0;
                    }
                }
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop) {
            const subscriber = [run, invalidate];
            subscribers.push(subscriber);
            if (subscribers.length === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                const index = subscribers.indexOf(subscriber);
                if (index !== -1) {
                    subscribers.splice(index, 1);
                }
                if (subscribers.length === 0) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }

    /* node_modules\svelte-tabs\src\Tabs.svelte generated by Svelte v3.24.0 */
    const file$1 = "node_modules\\svelte-tabs\\src\\Tabs.svelte";

    function create_fragment$1(ctx) {
    	let div;
    	let current;
    	let mounted;
    	let dispose;
    	const default_slot_template = /*$$slots*/ ctx[4].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[3], null);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (default_slot) default_slot.c();
    			attr_dev(div, "class", "svelte-tabs");
    			add_location(div, file$1, 97, 0, 2405);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			if (default_slot) {
    				default_slot.m(div, null);
    			}

    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(div, "keydown", /*handleKeyDown*/ ctx[1], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot) {
    				if (default_slot.p && dirty & /*$$scope*/ 8) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[3], dirty, null, null);
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (default_slot) default_slot.d(detaching);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    const TABS = {};

    function removeAndUpdateSelected(arr, item, selectedStore) {
    	const index = arr.indexOf(item);
    	arr.splice(index, 1);

    	selectedStore.update(selected => selected === item
    	? arr[index] || arr[arr.length - 1]
    	: selected);
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let $selectedTab;
    	let { initialSelectedIndex = 0 } = $$props;
    	const tabElements = [];
    	const tabs = [];
    	const panels = [];
    	const controls = writable({});
    	const labeledBy = writable({});
    	const selectedTab = writable(null);
    	validate_store(selectedTab, "selectedTab");
    	component_subscribe($$self, selectedTab, value => $$invalidate(5, $selectedTab = value));
    	const selectedPanel = writable(null);

    	function registerItem(arr, item, selectedStore) {
    		arr.push(item);
    		selectedStore.update(selected => selected || item);
    		onDestroy(() => removeAndUpdateSelected(arr, item, selectedStore));
    	}

    	function selectTab(tab) {
    		const index = tabs.indexOf(tab);
    		selectedTab.set(tab);
    		selectedPanel.set(panels[index]);
    	}

    	setContext(TABS, {
    		registerTab(tab) {
    			registerItem(tabs, tab, selectedTab);
    		},
    		registerTabElement(tabElement) {
    			tabElements.push(tabElement);
    		},
    		registerPanel(panel) {
    			registerItem(panels, panel, selectedPanel);
    		},
    		selectTab,
    		selectedTab,
    		selectedPanel,
    		controls,
    		labeledBy
    	});

    	onMount(() => {
    		selectTab(tabs[initialSelectedIndex]);
    	});

    	afterUpdate(() => {
    		for (let i = 0; i < tabs.length; i++) {
    			controls.update(controlsData => ({
    				...controlsData,
    				[tabs[i].id]: panels[i].id
    			}));

    			labeledBy.update(labeledByData => ({
    				...labeledByData,
    				[panels[i].id]: tabs[i].id
    			}));
    		}
    	});

    	async function handleKeyDown(event) {
    		if (event.target.classList.contains("svelte-tabs__tab")) {
    			let selectedIndex = tabs.indexOf($selectedTab);

    			switch (event.key) {
    				case "ArrowRight":
    					selectedIndex += 1;
    					if (selectedIndex > tabs.length - 1) {
    						selectedIndex = 0;
    					}
    					selectTab(tabs[selectedIndex]);
    					tabElements[selectedIndex].focus();
    					break;
    				case "ArrowLeft":
    					selectedIndex -= 1;
    					if (selectedIndex < 0) {
    						selectedIndex = tabs.length - 1;
    					}
    					selectTab(tabs[selectedIndex]);
    					tabElements[selectedIndex].focus();
    			}
    		}
    	}

    	const writable_props = ["initialSelectedIndex"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Tabs> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Tabs", $$slots, ['default']);

    	$$self.$set = $$props => {
    		if ("initialSelectedIndex" in $$props) $$invalidate(2, initialSelectedIndex = $$props.initialSelectedIndex);
    		if ("$$scope" in $$props) $$invalidate(3, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		TABS,
    		afterUpdate,
    		setContext,
    		onDestroy,
    		onMount,
    		tick,
    		writable,
    		initialSelectedIndex,
    		tabElements,
    		tabs,
    		panels,
    		controls,
    		labeledBy,
    		selectedTab,
    		selectedPanel,
    		removeAndUpdateSelected,
    		registerItem,
    		selectTab,
    		handleKeyDown,
    		$selectedTab
    	});

    	$$self.$inject_state = $$props => {
    		if ("initialSelectedIndex" in $$props) $$invalidate(2, initialSelectedIndex = $$props.initialSelectedIndex);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [selectedTab, handleKeyDown, initialSelectedIndex, $$scope, $$slots];
    }

    class Tabs extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, { initialSelectedIndex: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Tabs",
    			options,
    			id: create_fragment$1.name
    		});
    	}

    	get initialSelectedIndex() {
    		throw new Error("<Tabs>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set initialSelectedIndex(value) {
    		throw new Error("<Tabs>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* node_modules\svelte-tabs\src\Tab.svelte generated by Svelte v3.24.0 */
    const file$2 = "node_modules\\svelte-tabs\\src\\Tab.svelte";

    function create_fragment$2(ctx) {
    	let li;
    	let li_id_value;
    	let li_aria_controls_value;
    	let li_tabindex_value;
    	let current;
    	let mounted;
    	let dispose;
    	const default_slot_template = /*$$slots*/ ctx[8].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[7], null);

    	const block = {
    		c: function create() {
    			li = element("li");
    			if (default_slot) default_slot.c();
    			attr_dev(li, "role", "tab");
    			attr_dev(li, "id", li_id_value = /*tab*/ ctx[3].id);
    			attr_dev(li, "aria-controls", li_aria_controls_value = /*$controls*/ ctx[2][/*tab*/ ctx[3].id]);
    			attr_dev(li, "aria-selected", /*isSelected*/ ctx[1]);
    			attr_dev(li, "tabindex", li_tabindex_value = /*isSelected*/ ctx[1] ? 0 : -1);
    			attr_dev(li, "class", "svelte-tabs__tab svelte-1fbofsd");
    			toggle_class(li, "svelte-tabs__selected", /*isSelected*/ ctx[1]);
    			add_location(li, file$2, 45, 0, 812);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, li, anchor);

    			if (default_slot) {
    				default_slot.m(li, null);
    			}

    			/*li_binding*/ ctx[9](li);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(li, "click", /*click_handler*/ ctx[10], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot) {
    				if (default_slot.p && dirty & /*$$scope*/ 128) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[7], dirty, null, null);
    				}
    			}

    			if (!current || dirty & /*$controls*/ 4 && li_aria_controls_value !== (li_aria_controls_value = /*$controls*/ ctx[2][/*tab*/ ctx[3].id])) {
    				attr_dev(li, "aria-controls", li_aria_controls_value);
    			}

    			if (!current || dirty & /*isSelected*/ 2) {
    				attr_dev(li, "aria-selected", /*isSelected*/ ctx[1]);
    			}

    			if (!current || dirty & /*isSelected*/ 2 && li_tabindex_value !== (li_tabindex_value = /*isSelected*/ ctx[1] ? 0 : -1)) {
    				attr_dev(li, "tabindex", li_tabindex_value);
    			}

    			if (dirty & /*isSelected*/ 2) {
    				toggle_class(li, "svelte-tabs__selected", /*isSelected*/ ctx[1]);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(li);
    			if (default_slot) default_slot.d(detaching);
    			/*li_binding*/ ctx[9](null);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let $selectedTab;
    	let $controls;
    	let tabEl;
    	const tab = { id: getId() };
    	const { registerTab, registerTabElement, selectTab, selectedTab, controls } = getContext(TABS);
    	validate_store(selectedTab, "selectedTab");
    	component_subscribe($$self, selectedTab, value => $$invalidate(11, $selectedTab = value));
    	validate_store(controls, "controls");
    	component_subscribe($$self, controls, value => $$invalidate(2, $controls = value));
    	let isSelected;
    	registerTab(tab);

    	onMount(async () => {
    		await tick();
    		registerTabElement(tabEl);
    	});

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Tab> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Tab", $$slots, ['default']);

    	function li_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			tabEl = $$value;
    			$$invalidate(0, tabEl);
    		});
    	}

    	const click_handler = () => selectTab(tab);

    	$$self.$set = $$props => {
    		if ("$$scope" in $$props) $$invalidate(7, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		getContext,
    		onMount,
    		tick,
    		getId,
    		TABS,
    		tabEl,
    		tab,
    		registerTab,
    		registerTabElement,
    		selectTab,
    		selectedTab,
    		controls,
    		isSelected,
    		$selectedTab,
    		$controls
    	});

    	$$self.$inject_state = $$props => {
    		if ("tabEl" in $$props) $$invalidate(0, tabEl = $$props.tabEl);
    		if ("isSelected" in $$props) $$invalidate(1, isSelected = $$props.isSelected);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*$selectedTab*/ 2048) {
    			 $$invalidate(1, isSelected = $selectedTab === tab);
    		}
    	};

    	return [
    		tabEl,
    		isSelected,
    		$controls,
    		tab,
    		selectTab,
    		selectedTab,
    		controls,
    		$$scope,
    		$$slots,
    		li_binding,
    		click_handler
    	];
    }

    class Tab extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Tab",
    			options,
    			id: create_fragment$2.name
    		});
    	}
    }

    /* node_modules\svelte-tabs\src\TabList.svelte generated by Svelte v3.24.0 */

    const file$3 = "node_modules\\svelte-tabs\\src\\TabList.svelte";

    function create_fragment$3(ctx) {
    	let ul;
    	let current;
    	const default_slot_template = /*$$slots*/ ctx[1].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[0], null);

    	const block = {
    		c: function create() {
    			ul = element("ul");
    			if (default_slot) default_slot.c();
    			attr_dev(ul, "role", "tablist");
    			attr_dev(ul, "class", "svelte-tabs__tab-list svelte-12yby2a");
    			add_location(ul, file$3, 8, 0, 116);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, ul, anchor);

    			if (default_slot) {
    				default_slot.m(ul, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot) {
    				if (default_slot.p && dirty & /*$$scope*/ 1) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[0], dirty, null, null);
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(ul);
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<TabList> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("TabList", $$slots, ['default']);

    	$$self.$set = $$props => {
    		if ("$$scope" in $$props) $$invalidate(0, $$scope = $$props.$$scope);
    	};

    	return [$$scope, $$slots];
    }

    class TabList extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "TabList",
    			options,
    			id: create_fragment$3.name
    		});
    	}
    }

    /* node_modules\svelte-tabs\src\TabPanel.svelte generated by Svelte v3.24.0 */
    const file$4 = "node_modules\\svelte-tabs\\src\\TabPanel.svelte";

    // (26:2) {#if $selectedPanel === panel}
    function create_if_block(ctx) {
    	let current;
    	const default_slot_template = /*$$slots*/ ctx[6].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[5], null);

    	const block = {
    		c: function create() {
    			if (default_slot) default_slot.c();
    		},
    		m: function mount(target, anchor) {
    			if (default_slot) {
    				default_slot.m(target, anchor);
    			}

    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (default_slot) {
    				if (default_slot.p && dirty & /*$$scope*/ 32) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[5], dirty, null, null);
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(26:2) {#if $selectedPanel === panel}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$4(ctx) {
    	let div;
    	let div_id_value;
    	let div_aria_labelledby_value;
    	let current;
    	let if_block = /*$selectedPanel*/ ctx[1] === /*panel*/ ctx[2] && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (if_block) if_block.c();
    			attr_dev(div, "id", div_id_value = /*panel*/ ctx[2].id);
    			attr_dev(div, "aria-labelledby", div_aria_labelledby_value = /*$labeledBy*/ ctx[0][/*panel*/ ctx[2].id]);
    			attr_dev(div, "class", "svelte-tabs__tab-panel svelte-epfyet");
    			attr_dev(div, "role", "tabpanel");
    			add_location(div, file$4, 20, 0, 338);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			if (if_block) if_block.m(div, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*$selectedPanel*/ ctx[1] === /*panel*/ ctx[2]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*$selectedPanel*/ 2) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(div, null);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}

    			if (!current || dirty & /*$labeledBy*/ 1 && div_aria_labelledby_value !== (div_aria_labelledby_value = /*$labeledBy*/ ctx[0][/*panel*/ ctx[2].id])) {
    				attr_dev(div, "aria-labelledby", div_aria_labelledby_value);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (if_block) if_block.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let $labeledBy;
    	let $selectedPanel;
    	const panel = { id: getId() };
    	const { registerPanel, selectedPanel, labeledBy } = getContext(TABS);
    	validate_store(selectedPanel, "selectedPanel");
    	component_subscribe($$self, selectedPanel, value => $$invalidate(1, $selectedPanel = value));
    	validate_store(labeledBy, "labeledBy");
    	component_subscribe($$self, labeledBy, value => $$invalidate(0, $labeledBy = value));
    	registerPanel(panel);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<TabPanel> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("TabPanel", $$slots, ['default']);

    	$$self.$set = $$props => {
    		if ("$$scope" in $$props) $$invalidate(5, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		getContext,
    		getId,
    		TABS,
    		panel,
    		registerPanel,
    		selectedPanel,
    		labeledBy,
    		$labeledBy,
    		$selectedPanel
    	});

    	return [$labeledBy, $selectedPanel, panel, selectedPanel, labeledBy, $$scope, $$slots];
    }

    class TabPanel extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "TabPanel",
    			options,
    			id: create_fragment$4.name
    		});
    	}
    }

    var BACKGROUND_COLOR="#fff",LINE_HEIGHT="20px",FONT_SIZE="13px",defaultCssTheme="\n.codeflask {\n  background: "+BACKGROUND_COLOR+";\n  color: #4f559c;\n}\n\n.codeflask .token.punctuation {\n  color: #4a4a4a;\n}\n\n.codeflask .token.keyword {\n  color: #8500ff;\n}\n\n.codeflask .token.operator {\n  color: #ff5598;\n}\n\n.codeflask .token.string {\n  color: #41ad8f;\n}\n\n.codeflask .token.comment {\n  color: #9badb7;\n}\n\n.codeflask .token.function {\n  color: #8500ff;\n}\n\n.codeflask .token.boolean {\n  color: #8500ff;\n}\n\n.codeflask .token.number {\n  color: #8500ff;\n}\n\n.codeflask .token.selector {\n  color: #8500ff;\n}\n\n.codeflask .token.property {\n  color: #8500ff;\n}\n\n.codeflask .token.tag {\n  color: #8500ff;\n}\n\n.codeflask .token.attr-value {\n  color: #8500ff;\n}\n";function cssSupports(e,t){return "undefined"!=typeof CSS?CSS.supports(e,t):"undefined"!=typeof document&&toCamelCase(e)in document.body.style}function toCamelCase(e){return (e=e.split("-").filter(function(e){return !!e}).map(function(e){return e[0].toUpperCase()+e.substr(1)}).join(""))[0].toLowerCase()+e.substr(1)}var FONT_FAMILY='"SFMono-Regular", Consolas, "Liberation Mono", Menlo, Courier, monospace',COLOR=cssSupports("caret-color","#000")?BACKGROUND_COLOR:"#ccc",LINE_NUMBER_WIDTH="40px",editorCss="\n  .codeflask {\n    position: absolute;\n    width: 100%;\n    height: 100%;\n    overflow: hidden;\n  }\n\n  .codeflask, .codeflask * {\n    box-sizing: border-box;\n  }\n\n  .codeflask__pre {\n    pointer-events: none;\n    z-index: 3;\n    overflow: hidden;\n  }\n\n  .codeflask__textarea {\n    background: none;\n    border: none;\n    color: "+COLOR+";\n    z-index: 1;\n    resize: none;\n    font-family: "+FONT_FAMILY+";\n    -webkit-appearance: pre;\n    caret-color: #111;\n    z-index: 2;\n    width: 100%;\n    height: 100%;\n  }\n\n  .codeflask--has-line-numbers .codeflask__textarea {\n    width: calc(100% - "+LINE_NUMBER_WIDTH+");\n  }\n\n  .codeflask__code {\n    display: block;\n    font-family: "+FONT_FAMILY+";\n    overflow: hidden;\n  }\n\n  .codeflask__flatten {\n    padding: 10px;\n    font-size: "+FONT_SIZE+";\n    line-height: "+LINE_HEIGHT+";\n    white-space: pre;\n    position: absolute;\n    top: 0;\n    left: 0;\n    overflow: auto;\n    margin: 0 !important;\n    outline: none;\n    text-align: left;\n  }\n\n  .codeflask--has-line-numbers .codeflask__flatten {\n    width: calc(100% - "+LINE_NUMBER_WIDTH+");\n    left: "+LINE_NUMBER_WIDTH+";\n  }\n\n  .codeflask__line-highlight {\n    position: absolute;\n    top: 10px;\n    left: 0;\n    width: 100%;\n    height: "+LINE_HEIGHT+";\n    background: rgba(0,0,0,0.1);\n    z-index: 1;\n  }\n\n  .codeflask__lines {\n    padding: 10px 4px;\n    font-size: 12px;\n    line-height: "+LINE_HEIGHT+";\n    font-family: 'Cousine', monospace;\n    position: absolute;\n    left: 0;\n    top: 0;\n    width: "+LINE_NUMBER_WIDTH+";\n    height: 100%;\n    text-align: right;\n    color: #999;\n    z-index: 2;\n  }\n\n  .codeflask__lines__line {\n    display: block;\n  }\n\n  .codeflask.codeflask--has-line-numbers {\n    padding-left: "+LINE_NUMBER_WIDTH+";\n  }\n\n  .codeflask.codeflask--has-line-numbers:before {\n    content: '';\n    position: absolute;\n    left: 0;\n    top: 0;\n    width: "+LINE_NUMBER_WIDTH+";\n    height: 100%;\n    background: #eee;\n    z-index: 1;\n  }\n";function injectCss(e,t,n){var a=t||"codeflask-style",s=n||document.head;if(!e)return !1;if(document.getElementById(a))return !0;var o=document.createElement("style");return o.innerHTML=e,o.id=a,s.appendChild(o),!0}var entityMap={"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;","/":"&#x2F;","`":"&#x60;","=":"&#x3D;"};function escapeHtml(e){return String(e).replace(/[&<>"'`=/]/g,function(e){return entityMap[e]})}var commonjsGlobal="undefined"!=typeof globalThis?globalThis:"undefined"!=typeof window?window:"undefined"!=typeof global?global:"undefined"!=typeof self?self:{};function createCommonjsModule(e,t){return e(t={exports:{}},t.exports),t.exports}var prism=createCommonjsModule(function(e){var t=function(e){var t=/\blang(?:uage)?-([\w-]+)\b/i,n=0,a={manual:e.Prism&&e.Prism.manual,disableWorkerMessageHandler:e.Prism&&e.Prism.disableWorkerMessageHandler,util:{encode:function(e){return e instanceof s?new s(e.type,a.util.encode(e.content),e.alias):Array.isArray(e)?e.map(a.util.encode):e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/\u00a0/g," ")},type:function(e){return Object.prototype.toString.call(e).slice(8,-1)},objId:function(e){return e.__id||Object.defineProperty(e,"__id",{value:++n}),e.__id},clone:function e(t,n){var s,o,i=a.util.type(t);switch(n=n||{},i){case"Object":if(o=a.util.objId(t),n[o])return n[o];for(var r in s={},n[o]=s,t)t.hasOwnProperty(r)&&(s[r]=e(t[r],n));return s;case"Array":return o=a.util.objId(t),n[o]?n[o]:(s=[],n[o]=s,t.forEach(function(t,a){s[a]=e(t,n);}),s);default:return t}}},languages:{extend:function(e,t){var n=a.util.clone(a.languages[e]);for(var s in t)n[s]=t[s];return n},insertBefore:function(e,t,n,s){var o=(s=s||a.languages)[e],i={};for(var r in o)if(o.hasOwnProperty(r)){if(r==t)for(var l in n)n.hasOwnProperty(l)&&(i[l]=n[l]);n.hasOwnProperty(r)||(i[r]=o[r]);}var c=s[e];return s[e]=i,a.languages.DFS(a.languages,function(t,n){n===c&&t!=e&&(this[t]=i);}),i},DFS:function e(t,n,s,o){o=o||{};var i=a.util.objId;for(var r in t)if(t.hasOwnProperty(r)){n.call(t,r,t[r],s||r);var l=t[r],c=a.util.type(l);"Object"!==c||o[i(l)]?"Array"!==c||o[i(l)]||(o[i(l)]=!0,e(l,n,r,o)):(o[i(l)]=!0,e(l,n,null,o));}}},plugins:{},highlightAll:function(e,t){a.highlightAllUnder(document,e,t);},highlightAllUnder:function(e,t,n){var s={callback:n,selector:'code[class*="language-"], [class*="language-"] code, code[class*="lang-"], [class*="lang-"] code'};a.hooks.run("before-highlightall",s);for(var o,i=s.elements||e.querySelectorAll(s.selector),r=0;o=i[r++];)a.highlightElement(o,!0===t,s.callback);},highlightElement:function(n,s,o){for(var i,r,l=n;l&&!t.test(l.className);)l=l.parentNode;l&&(i=(l.className.match(t)||[,""])[1].toLowerCase(),r=a.languages[i]),n.className=n.className.replace(t,"").replace(/\s+/g," ")+" language-"+i,n.parentNode&&(l=n.parentNode,/pre/i.test(l.nodeName)&&(l.className=l.className.replace(t,"").replace(/\s+/g," ")+" language-"+i));var c={element:n,language:i,grammar:r,code:n.textContent},d=function(e){c.highlightedCode=e,a.hooks.run("before-insert",c),c.element.innerHTML=c.highlightedCode,a.hooks.run("after-highlight",c),a.hooks.run("complete",c),o&&o.call(c.element);};if(a.hooks.run("before-sanity-check",c),c.code)if(a.hooks.run("before-highlight",c),c.grammar)if(s&&e.Worker){var u=new Worker(a.filename);u.onmessage=function(e){d(e.data);},u.postMessage(JSON.stringify({language:c.language,code:c.code,immediateClose:!0}));}else d(a.highlight(c.code,c.grammar,c.language));else d(a.util.encode(c.code));else a.hooks.run("complete",c);},highlight:function(e,t,n){var o={code:e,grammar:t,language:n};return a.hooks.run("before-tokenize",o),o.tokens=a.tokenize(o.code,o.grammar),a.hooks.run("after-tokenize",o),s.stringify(a.util.encode(o.tokens),o.language)},matchGrammar:function(e,t,n,o,i,r,l){for(var c in n)if(n.hasOwnProperty(c)&&n[c]){if(c==l)return;var d=n[c];d="Array"===a.util.type(d)?d:[d];for(var u=0;u<d.length;++u){var p=d[u],h=p.inside,g=!!p.lookbehind,f=!!p.greedy,m=0,b=p.alias;if(f&&!p.pattern.global){var k=p.pattern.toString().match(/[imuy]*$/)[0];p.pattern=RegExp(p.pattern.source,k+"g");}p=p.pattern||p;for(var y=o,C=i;y<t.length;C+=t[y].length,++y){var F=t[y];if(t.length>e.length)return;if(!(F instanceof s)){if(f&&y!=t.length-1){if(p.lastIndex=C,!(T=p.exec(e)))break;for(var v=T.index+(g?T[1].length:0),x=T.index+T[0].length,w=y,A=C,_=t.length;w<_&&(A<x||!t[w].type&&!t[w-1].greedy);++w)v>=(A+=t[w].length)&&(++y,C=A);if(t[y]instanceof s)continue;E=w-y,F=e.slice(C,A),T.index-=C;}else {p.lastIndex=0;var T=p.exec(F),E=1;}if(T){g&&(m=T[1]?T[1].length:0);x=(v=T.index+m)+(T=T[0].slice(m)).length;var L=F.slice(0,v),N=F.slice(x),S=[y,E];L&&(++y,C+=L.length,S.push(L));var I=new s(c,h?a.tokenize(T,h):T,b,T,f);if(S.push(I),N&&S.push(N),Array.prototype.splice.apply(t,S),1!=E&&a.matchGrammar(e,t,n,y,C,!0,c),r)break}else if(r)break}}}}},tokenize:function(e,t){var n=[e],s=t.rest;if(s){for(var o in s)t[o]=s[o];delete t.rest;}return a.matchGrammar(e,n,t,0,0,!1),n},hooks:{all:{},add:function(e,t){var n=a.hooks.all;n[e]=n[e]||[],n[e].push(t);},run:function(e,t){var n=a.hooks.all[e];if(n&&n.length)for(var s,o=0;s=n[o++];)s(t);}},Token:s};function s(e,t,n,a,s){this.type=e,this.content=t,this.alias=n,this.length=0|(a||"").length,this.greedy=!!s;}if(e.Prism=a,s.stringify=function(e,t,n){if("string"==typeof e)return e;if(Array.isArray(e))return e.map(function(n){return s.stringify(n,t,e)}).join("");var o={type:e.type,content:s.stringify(e.content,t,n),tag:"span",classes:["token",e.type],attributes:{},language:t,parent:n};if(e.alias){var i=Array.isArray(e.alias)?e.alias:[e.alias];Array.prototype.push.apply(o.classes,i);}a.hooks.run("wrap",o);var r=Object.keys(o.attributes).map(function(e){return e+'="'+(o.attributes[e]||"").replace(/"/g,"&quot;")+'"'}).join(" ");return "<"+o.tag+' class="'+o.classes.join(" ")+'"'+(r?" "+r:"")+">"+o.content+"</"+o.tag+">"},!e.document)return e.addEventListener?(a.disableWorkerMessageHandler||e.addEventListener("message",function(t){var n=JSON.parse(t.data),s=n.language,o=n.code,i=n.immediateClose;e.postMessage(a.highlight(o,a.languages[s],s)),i&&e.close();},!1),a):a;var o=document.currentScript||[].slice.call(document.getElementsByTagName("script")).pop();return o&&(a.filename=o.src,a.manual||o.hasAttribute("data-manual")||("loading"!==document.readyState?window.requestAnimationFrame?window.requestAnimationFrame(a.highlightAll):window.setTimeout(a.highlightAll,16):document.addEventListener("DOMContentLoaded",a.highlightAll))),a}("undefined"!=typeof window?window:"undefined"!=typeof WorkerGlobalScope&&self instanceof WorkerGlobalScope?self:{});e.exports&&(e.exports=t),void 0!==commonjsGlobal&&(commonjsGlobal.Prism=t),t.languages.markup={comment:/<!--[\s\S]*?-->/,prolog:/<\?[\s\S]+?\?>/,doctype:/<!DOCTYPE[\s\S]+?>/i,cdata:/<!\[CDATA\[[\s\S]*?]]>/i,tag:{pattern:/<\/?(?!\d)[^\s>\/=$<%]+(?:\s(?:\s*[^\s>\/=]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s'">=]+(?=[\s>]))|(?=[\s/>])))+)?\s*\/?>/i,greedy:!0,inside:{tag:{pattern:/^<\/?[^\s>\/]+/i,inside:{punctuation:/^<\/?/,namespace:/^[^\s>\/:]+:/}},"attr-value":{pattern:/=\s*(?:"[^"]*"|'[^']*'|[^\s'">=]+)/i,inside:{punctuation:[/^=/,{pattern:/^(\s*)["']|["']$/,lookbehind:!0}]}},punctuation:/\/?>/,"attr-name":{pattern:/[^\s>\/]+/,inside:{namespace:/^[^\s>\/:]+:/}}}},entity:/&#?[\da-z]{1,8};/i},t.languages.markup.tag.inside["attr-value"].inside.entity=t.languages.markup.entity,t.hooks.add("wrap",function(e){"entity"===e.type&&(e.attributes.title=e.content.replace(/&amp;/,"&"));}),Object.defineProperty(t.languages.markup.tag,"addInlined",{value:function(e,n){var a={};a["language-"+n]={pattern:/(^<!\[CDATA\[)[\s\S]+?(?=\]\]>$)/i,lookbehind:!0,inside:t.languages[n]},a.cdata=/^<!\[CDATA\[|\]\]>$/i;var s={"included-cdata":{pattern:/<!\[CDATA\[[\s\S]*?\]\]>/i,inside:a}};s["language-"+n]={pattern:/[\s\S]+/,inside:t.languages[n]};var o={};o[e]={pattern:RegExp(/(<__[\s\S]*?>)(?:<!\[CDATA\[[\s\S]*?\]\]>\s*|[\s\S])*?(?=<\/__>)/.source.replace(/__/g,e),"i"),lookbehind:!0,greedy:!0,inside:s},t.languages.insertBefore("markup","cdata",o);}}),t.languages.xml=t.languages.extend("markup",{}),t.languages.html=t.languages.markup,t.languages.mathml=t.languages.markup,t.languages.svg=t.languages.markup,function(e){var t=/("|')(?:\\(?:\r\n|[\s\S])|(?!\1)[^\\\r\n])*\1/;e.languages.css={comment:/\/\*[\s\S]*?\*\//,atrule:{pattern:/@[\w-]+?[\s\S]*?(?:;|(?=\s*\{))/i,inside:{rule:/@[\w-]+/}},url:RegExp("url\\((?:"+t.source+"|.*?)\\)","i"),selector:RegExp("[^{}\\s](?:[^{};\"']|"+t.source+")*?(?=\\s*\\{)"),string:{pattern:t,greedy:!0},property:/[-_a-z\xA0-\uFFFF][-\w\xA0-\uFFFF]*(?=\s*:)/i,important:/!important\b/i,function:/[-a-z0-9]+(?=\()/i,punctuation:/[(){};:,]/},e.languages.css.atrule.inside.rest=e.languages.css;var n=e.languages.markup;n&&(n.tag.addInlined("style","css"),e.languages.insertBefore("inside","attr-value",{"style-attr":{pattern:/\s*style=("|')(?:\\[\s\S]|(?!\1)[^\\])*\1/i,inside:{"attr-name":{pattern:/^\s*style/i,inside:n.tag.inside},punctuation:/^\s*=\s*['"]|['"]\s*$/,"attr-value":{pattern:/.+/i,inside:e.languages.css}},alias:"language-css"}},n.tag));}(t),t.languages.clike={comment:[{pattern:/(^|[^\\])\/\*[\s\S]*?(?:\*\/|$)/,lookbehind:!0},{pattern:/(^|[^\\:])\/\/.*/,lookbehind:!0,greedy:!0}],string:{pattern:/(["'])(?:\\(?:\r\n|[\s\S])|(?!\1)[^\\\r\n])*\1/,greedy:!0},"class-name":{pattern:/((?:\b(?:class|interface|extends|implements|trait|instanceof|new)\s+)|(?:catch\s+\())[\w.\\]+/i,lookbehind:!0,inside:{punctuation:/[.\\]/}},keyword:/\b(?:if|else|while|do|for|return|in|instanceof|function|new|try|throw|catch|finally|null|break|continue)\b/,boolean:/\b(?:true|false)\b/,function:/\w+(?=\()/,number:/\b0x[\da-f]+\b|(?:\b\d+\.?\d*|\B\.\d+)(?:e[+-]?\d+)?/i,operator:/--?|\+\+?|!=?=?|<=?|>=?|==?=?|&&?|\|\|?|\?|\*|\/|~|\^|%/,punctuation:/[{}[\];(),.:]/},t.languages.javascript=t.languages.extend("clike",{"class-name":[t.languages.clike["class-name"],{pattern:/(^|[^$\w\xA0-\uFFFF])[_$A-Z\xA0-\uFFFF][$\w\xA0-\uFFFF]*(?=\.(?:prototype|constructor))/,lookbehind:!0}],keyword:[{pattern:/((?:^|})\s*)(?:catch|finally)\b/,lookbehind:!0},{pattern:/(^|[^.])\b(?:as|async(?=\s*(?:function\b|\(|[$\w\xA0-\uFFFF]|$))|await|break|case|class|const|continue|debugger|default|delete|do|else|enum|export|extends|for|from|function|get|if|implements|import|in|instanceof|interface|let|new|null|of|package|private|protected|public|return|set|static|super|switch|this|throw|try|typeof|undefined|var|void|while|with|yield)\b/,lookbehind:!0}],number:/\b(?:(?:0[xX][\dA-Fa-f]+|0[bB][01]+|0[oO][0-7]+)n?|\d+n|NaN|Infinity)\b|(?:\b\d+\.?\d*|\B\.\d+)(?:[Ee][+-]?\d+)?/,function:/[_$a-zA-Z\xA0-\uFFFF][$\w\xA0-\uFFFF]*(?=\s*(?:\.\s*(?:apply|bind|call)\s*)?\()/,operator:/-[-=]?|\+[+=]?|!=?=?|<<?=?|>>?>?=?|=(?:==?|>)?|&[&=]?|\|[|=]?|\*\*?=?|\/=?|~|\^=?|%=?|\?|\.{3}/}),t.languages.javascript["class-name"][0].pattern=/(\b(?:class|interface|extends|implements|instanceof|new)\s+)[\w.\\]+/,t.languages.insertBefore("javascript","keyword",{regex:{pattern:/((?:^|[^$\w\xA0-\uFFFF."'\])\s])\s*)\/(\[(?:[^\]\\\r\n]|\\.)*]|\\.|[^/\\\[\r\n])+\/[gimyu]{0,5}(?=\s*($|[\r\n,.;})\]]))/,lookbehind:!0,greedy:!0},"function-variable":{pattern:/[_$a-zA-Z\xA0-\uFFFF][$\w\xA0-\uFFFF]*(?=\s*[=:]\s*(?:async\s*)?(?:\bfunction\b|(?:\((?:[^()]|\([^()]*\))*\)|[_$a-zA-Z\xA0-\uFFFF][$\w\xA0-\uFFFF]*)\s*=>))/,alias:"function"},parameter:[{pattern:/(function(?:\s+[_$A-Za-z\xA0-\uFFFF][$\w\xA0-\uFFFF]*)?\s*\(\s*)(?!\s)(?:[^()]|\([^()]*\))+?(?=\s*\))/,lookbehind:!0,inside:t.languages.javascript},{pattern:/[_$a-z\xA0-\uFFFF][$\w\xA0-\uFFFF]*(?=\s*=>)/i,inside:t.languages.javascript},{pattern:/(\(\s*)(?!\s)(?:[^()]|\([^()]*\))+?(?=\s*\)\s*=>)/,lookbehind:!0,inside:t.languages.javascript},{pattern:/((?:\b|\s|^)(?!(?:as|async|await|break|case|catch|class|const|continue|debugger|default|delete|do|else|enum|export|extends|finally|for|from|function|get|if|implements|import|in|instanceof|interface|let|new|null|of|package|private|protected|public|return|set|static|super|switch|this|throw|try|typeof|undefined|var|void|while|with|yield)(?![$\w\xA0-\uFFFF]))(?:[_$A-Za-z\xA0-\uFFFF][$\w\xA0-\uFFFF]*\s*)\(\s*)(?!\s)(?:[^()]|\([^()]*\))+?(?=\s*\)\s*\{)/,lookbehind:!0,inside:t.languages.javascript}],constant:/\b[A-Z](?:[A-Z_]|\dx?)*\b/}),t.languages.insertBefore("javascript","string",{"template-string":{pattern:/`(?:\\[\s\S]|\${[^}]+}|[^\\`])*`/,greedy:!0,inside:{interpolation:{pattern:/\${[^}]+}/,inside:{"interpolation-punctuation":{pattern:/^\${|}$/,alias:"punctuation"},rest:t.languages.javascript}},string:/[\s\S]+/}}}),t.languages.markup&&t.languages.markup.tag.addInlined("script","javascript"),t.languages.js=t.languages.javascript,"undefined"!=typeof self&&self.Prism&&self.document&&document.querySelector&&(self.Prism.fileHighlight=function(e){e=e||document;var n={js:"javascript",py:"python",rb:"ruby",ps1:"powershell",psm1:"powershell",sh:"bash",bat:"batch",h:"c",tex:"latex"};Array.prototype.slice.call(e.querySelectorAll("pre[data-src]")).forEach(function(e){if(!e.hasAttribute("data-src-loaded")){for(var a,s=e.getAttribute("data-src"),o=e,i=/\blang(?:uage)?-([\w-]+)\b/i;o&&!i.test(o.className);)o=o.parentNode;if(o&&(a=(e.className.match(i)||[,""])[1]),!a){var r=(s.match(/\.(\w+)$/)||[,""])[1];a=n[r]||r;}var l=document.createElement("code");l.className="language-"+a,e.textContent="",l.textContent="Loading…",e.appendChild(l);var c=new XMLHttpRequest;c.open("GET",s,!0),c.onreadystatechange=function(){4==c.readyState&&(c.status<400&&c.responseText?(l.textContent=c.responseText,t.highlightElement(l),e.setAttribute("data-src-loaded","")):c.status>=400?l.textContent="✖ Error "+c.status+" while fetching file: "+c.statusText:l.textContent="✖ Error: File does not exist or is empty");},c.send(null);}}),t.plugins.toolbar&&t.plugins.toolbar.registerButton("download-file",function(e){var t=e.element.parentNode;if(t&&/pre/i.test(t.nodeName)&&t.hasAttribute("data-src")&&t.hasAttribute("data-download-link")){var n=t.getAttribute("data-src"),a=document.createElement("a");return a.textContent=t.getAttribute("data-download-link-label")||"Download",a.setAttribute("download",""),a.href=n,a}});},document.addEventListener("DOMContentLoaded",function(){self.Prism.fileHighlight();}));}),CodeFlask=function(e,t){if(!e)throw Error("CodeFlask expects a parameter which is Element or a String selector");if(!t)throw Error("CodeFlask expects an object containing options as second parameter");if(e.nodeType)this.editorRoot=e;else {var n=document.querySelector(e);n&&(this.editorRoot=n);}this.opts=t,this.startEditor();};CodeFlask.prototype.startEditor=function(){if(!injectCss(editorCss,null,this.opts.styleParent))throw Error("Failed to inject CodeFlask CSS.");this.createWrapper(),this.createTextarea(),this.createPre(),this.createCode(),this.runOptions(),this.listenTextarea(),this.populateDefault(),this.updateCode(this.code);},CodeFlask.prototype.createWrapper=function(){this.code=this.editorRoot.innerHTML,this.editorRoot.innerHTML="",this.elWrapper=this.createElement("div",this.editorRoot),this.elWrapper.classList.add("codeflask");},CodeFlask.prototype.createTextarea=function(){this.elTextarea=this.createElement("textarea",this.elWrapper),this.elTextarea.classList.add("codeflask__textarea","codeflask__flatten");},CodeFlask.prototype.createPre=function(){this.elPre=this.createElement("pre",this.elWrapper),this.elPre.classList.add("codeflask__pre","codeflask__flatten");},CodeFlask.prototype.createCode=function(){this.elCode=this.createElement("code",this.elPre),this.elCode.classList.add("codeflask__code","language-"+(this.opts.language||"html"));},CodeFlask.prototype.createLineNumbers=function(){this.elLineNumbers=this.createElement("div",this.elWrapper),this.elLineNumbers.classList.add("codeflask__lines"),this.setLineNumber();},CodeFlask.prototype.createElement=function(e,t){var n=document.createElement(e);return t.appendChild(n),n},CodeFlask.prototype.runOptions=function(){this.opts.rtl=this.opts.rtl||!1,this.opts.tabSize=this.opts.tabSize||2,this.opts.enableAutocorrect=this.opts.enableAutocorrect||!1,this.opts.lineNumbers=this.opts.lineNumbers||!1,this.opts.defaultTheme=!1!==this.opts.defaultTheme,this.opts.areaId=this.opts.areaId||null,this.opts.ariaLabelledby=this.opts.ariaLabelledby||null,this.opts.readonly=this.opts.readonly||null,"boolean"!=typeof this.opts.handleTabs&&(this.opts.handleTabs=!0),"boolean"!=typeof this.opts.handleSelfClosingCharacters&&(this.opts.handleSelfClosingCharacters=!0),"boolean"!=typeof this.opts.handleNewLineIndentation&&(this.opts.handleNewLineIndentation=!0),!0===this.opts.rtl&&(this.elTextarea.setAttribute("dir","rtl"),this.elPre.setAttribute("dir","rtl")),!1===this.opts.enableAutocorrect&&(this.elTextarea.setAttribute("spellcheck","false"),this.elTextarea.setAttribute("autocapitalize","off"),this.elTextarea.setAttribute("autocomplete","off"),this.elTextarea.setAttribute("autocorrect","off")),this.opts.lineNumbers&&(this.elWrapper.classList.add("codeflask--has-line-numbers"),this.createLineNumbers()),this.opts.defaultTheme&&injectCss(defaultCssTheme,"theme-default",this.opts.styleParent),this.opts.areaId&&this.elTextarea.setAttribute("id",this.opts.areaId),this.opts.ariaLabelledby&&this.elTextarea.setAttribute("aria-labelledby",this.opts.ariaLabelledby),this.opts.readonly&&this.enableReadonlyMode();},CodeFlask.prototype.updateLineNumbersCount=function(){for(var e="",t=1;t<=this.lineNumber;t++)e=e+'<span class="codeflask__lines__line">'+t+"</span>";this.elLineNumbers.innerHTML=e;},CodeFlask.prototype.listenTextarea=function(){var e=this;this.elTextarea.addEventListener("input",function(t){e.code=t.target.value,e.elCode.innerHTML=escapeHtml(t.target.value),e.highlight(),setTimeout(function(){e.runUpdate(),e.setLineNumber();},1);}),this.elTextarea.addEventListener("keydown",function(t){e.handleTabs(t),e.handleSelfClosingCharacters(t),e.handleNewLineIndentation(t);}),this.elTextarea.addEventListener("scroll",function(t){e.elPre.style.transform="translate3d(-"+t.target.scrollLeft+"px, -"+t.target.scrollTop+"px, 0)",e.elLineNumbers&&(e.elLineNumbers.style.transform="translate3d(0, -"+t.target.scrollTop+"px, 0)");});},CodeFlask.prototype.handleTabs=function(e){if(this.opts.handleTabs){if(9!==e.keyCode)return;e.preventDefault();var t=this.elTextarea,n=t.selectionDirection,a=t.selectionStart,s=t.selectionEnd,o=t.value,i=o.substr(0,a),r=o.substring(a,s),l=o.substring(s),c=" ".repeat(this.opts.tabSize);if(a!==s&&r.length>=c.length){var d=a-i.split("\n").pop().length,u=c.length,p=c.length;if(e.shiftKey)o.substr(d,c.length)===c?(u=-u,d>a?(r=r.substring(0,d)+r.substring(d+c.length),p=0):d===a?(u=0,p=0,r=r.substring(c.length)):(p=-p,i=i.substring(0,d)+i.substring(d+c.length))):(u=0,p=0),r=r.replace(new RegExp("\n"+c.split("").join("\\"),"g"),"\n");else i=i.substr(0,d)+c+i.substring(d,a),r=r.replace(/\n/g,"\n"+c);t.value=i+r+l,t.selectionStart=a+u,t.selectionEnd=a+r.length+p,t.selectionDirection=n;}else t.value=i+c+l,t.selectionStart=a+c.length,t.selectionEnd=a+c.length;var h=t.value;this.updateCode(h),this.elTextarea.selectionEnd=s+this.opts.tabSize;}},CodeFlask.prototype.handleSelfClosingCharacters=function(e){if(this.opts.handleSelfClosingCharacters){var t=e.key;if(["(","[","{","<","'",'"'].includes(t)||[")","]","}",">","'",'"'].includes(t))switch(t){case"(":case")":this.closeCharacter(t);break;case"[":case"]":this.closeCharacter(t);break;case"{":case"}":this.closeCharacter(t);break;case"<":case">":case"'":case'"':this.closeCharacter(t);}}},CodeFlask.prototype.setLineNumber=function(){this.lineNumber=this.code.split("\n").length,this.opts.lineNumbers&&this.updateLineNumbersCount();},CodeFlask.prototype.handleNewLineIndentation=function(e){if(this.opts.handleNewLineIndentation&&13===e.keyCode){e.preventDefault();var t=this.elTextarea,n=t.selectionStart,a=t.selectionEnd,s=t.value,o=s.substr(0,n),i=s.substring(a),r=s.lastIndexOf("\n",n-1),l=r+s.slice(r+1).search(/[^ ]|$/),c=l>r?l-r:0,d=o+"\n"+" ".repeat(c)+i;t.value=d,t.selectionStart=n+c+1,t.selectionEnd=n+c+1,this.updateCode(t.value);}},CodeFlask.prototype.closeCharacter=function(e){var t=this.elTextarea.selectionStart,n=this.elTextarea.selectionEnd;if(this.skipCloseChar(e)){var a=this.code.substr(n,1)===e,s=a?n+1:n,o=!a&&["'",'"'].includes(e)?e:"",i=""+this.code.substring(0,t)+o+this.code.substring(s);this.updateCode(i),this.elTextarea.selectionEnd=++this.elTextarea.selectionStart;}else {var r=e;switch(e){case"(":r=String.fromCharCode(e.charCodeAt()+1);break;case"<":case"{":case"[":r=String.fromCharCode(e.charCodeAt()+2);}var l=this.code.substring(t,n),c=""+this.code.substring(0,t)+l+r+this.code.substring(n);this.updateCode(c);}this.elTextarea.selectionEnd=t;},CodeFlask.prototype.skipCloseChar=function(e){var t=this.elTextarea.selectionStart,n=this.elTextarea.selectionEnd,a=Math.abs(n-t)>0;return [")","}","]",">"].includes(e)||["'",'"'].includes(e)&&!a},CodeFlask.prototype.updateCode=function(e){this.code=e,this.elTextarea.value=e,this.elCode.innerHTML=escapeHtml(e),this.highlight(),this.setLineNumber(),setTimeout(this.runUpdate.bind(this),1);},CodeFlask.prototype.updateLanguage=function(e){var t=this.opts.language;this.elCode.classList.remove("language-"+t),this.elCode.classList.add("language-"+e),this.opts.language=e,this.highlight();},CodeFlask.prototype.addLanguage=function(e,t){prism.languages[e]=t;},CodeFlask.prototype.populateDefault=function(){this.updateCode(this.code);},CodeFlask.prototype.highlight=function(){prism.highlightElement(this.elCode,!1);},CodeFlask.prototype.onUpdate=function(e){if(e&&"[object Function]"!=={}.toString.call(e))throw Error("CodeFlask expects callback of type Function");this.updateCallBack=e;},CodeFlask.prototype.getCode=function(){return this.code},CodeFlask.prototype.runUpdate=function(){this.updateCallBack&&this.updateCallBack(this.code);},CodeFlask.prototype.enableReadonlyMode=function(){this.elTextarea.setAttribute("readonly",!0);},CodeFlask.prototype.disableReadonlyMode=function(){this.elTextarea.removeAttribute("readonly");};

    /* src\components\CodeFlask.svelte generated by Svelte v3.24.0 */
    const file$5 = "src\\components\\CodeFlask.svelte";

    function create_fragment$5(ctx) {
    	let div;

    	const block = {
    		c: function create() {
    			div = element("div");
    			attr_dev(div, "class", "codeArea svelte-uucjkd");
    			add_location(div, file$5, 30, 0, 616);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			/*div_binding*/ ctx[3](div);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			/*div_binding*/ ctx[3](null);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    const SAVE_TIMEOUT = 500;

    function instance$5($$self, $$props, $$invalidate) {
    	let { opts } = $$props;
    	let { code } = $$props;
    	let flask, codeArea, saveTimeout;

    	onMount(() => {
    		flask = new CodeFlask(codeArea, opts);

    		flask.onUpdate(newCode => {
    			clearTimeout(saveTimeout);

    			saveTimeout = setTimeout(
    				() => {
    					$$invalidate(1, code = newCode);
    				},
    				SAVE_TIMEOUT
    			);
    		});

    		flask.updateCode(code);
    	});

    	afterUpdate(() => {
    		flask.updateCode(code);
    	});

    	const writable_props = ["opts", "code"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<CodeFlask> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("CodeFlask", $$slots, []);

    	function div_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			codeArea = $$value;
    			$$invalidate(0, codeArea);
    		});
    	}

    	$$self.$set = $$props => {
    		if ("opts" in $$props) $$invalidate(2, opts = $$props.opts);
    		if ("code" in $$props) $$invalidate(1, code = $$props.code);
    	};

    	$$self.$capture_state = () => ({
    		onMount,
    		afterUpdate,
    		CodeFlask,
    		opts,
    		code,
    		SAVE_TIMEOUT,
    		flask,
    		codeArea,
    		saveTimeout
    	});

    	$$self.$inject_state = $$props => {
    		if ("opts" in $$props) $$invalidate(2, opts = $$props.opts);
    		if ("code" in $$props) $$invalidate(1, code = $$props.code);
    		if ("flask" in $$props) flask = $$props.flask;
    		if ("codeArea" in $$props) $$invalidate(0, codeArea = $$props.codeArea);
    		if ("saveTimeout" in $$props) saveTimeout = $$props.saveTimeout;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [codeArea, code, opts, div_binding];
    }

    class CodeFlask_1 extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, { opts: 2, code: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "CodeFlask_1",
    			options,
    			id: create_fragment$5.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*opts*/ ctx[2] === undefined && !("opts" in props)) {
    			console.warn("<CodeFlask> was created without expected prop 'opts'");
    		}

    		if (/*code*/ ctx[1] === undefined && !("code" in props)) {
    			console.warn("<CodeFlask> was created without expected prop 'code'");
    		}
    	}

    	get opts() {
    		throw new Error("<CodeFlask>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set opts(value) {
    		throw new Error("<CodeFlask>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get code() {
    		throw new Error("<CodeFlask>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set code(value) {
    		throw new Error("<CodeFlask>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\CodeInput.svelte generated by Svelte v3.24.0 */
    const file$6 = "src\\components\\CodeInput.svelte";

    // (21:2) <Tab>
    function create_default_slot_7(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("HTML");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_7.name,
    		type: "slot",
    		source: "(21:2) <Tab>",
    		ctx
    	});

    	return block;
    }

    // (22:2) <Tab>
    function create_default_slot_6(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("CSS");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_6.name,
    		type: "slot",
    		source: "(22:2) <Tab>",
    		ctx
    	});

    	return block;
    }

    // (23:2) <Tab>
    function create_default_slot_5(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("JS");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_5.name,
    		type: "slot",
    		source: "(23:2) <Tab>",
    		ctx
    	});

    	return block;
    }

    // (20:1) <TabList>
    function create_default_slot_4(ctx) {
    	let tab0;
    	let t0;
    	let tab1;
    	let t1;
    	let tab2;
    	let current;

    	tab0 = new Tab({
    			props: {
    				$$slots: { default: [create_default_slot_7] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	tab1 = new Tab({
    			props: {
    				$$slots: { default: [create_default_slot_6] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	tab2 = new Tab({
    			props: {
    				$$slots: { default: [create_default_slot_5] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(tab0.$$.fragment);
    			t0 = space();
    			create_component(tab1.$$.fragment);
    			t1 = space();
    			create_component(tab2.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(tab0, target, anchor);
    			insert_dev(target, t0, anchor);
    			mount_component(tab1, target, anchor);
    			insert_dev(target, t1, anchor);
    			mount_component(tab2, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const tab0_changes = {};

    			if (dirty & /*$$scope*/ 32) {
    				tab0_changes.$$scope = { dirty, ctx };
    			}

    			tab0.$set(tab0_changes);
    			const tab1_changes = {};

    			if (dirty & /*$$scope*/ 32) {
    				tab1_changes.$$scope = { dirty, ctx };
    			}

    			tab1.$set(tab1_changes);
    			const tab2_changes = {};

    			if (dirty & /*$$scope*/ 32) {
    				tab2_changes.$$scope = { dirty, ctx };
    			}

    			tab2.$set(tab2_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(tab0.$$.fragment, local);
    			transition_in(tab1.$$.fragment, local);
    			transition_in(tab2.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(tab0.$$.fragment, local);
    			transition_out(tab1.$$.fragment, local);
    			transition_out(tab2.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(tab0, detaching);
    			if (detaching) detach_dev(t0);
    			destroy_component(tab1, detaching);
    			if (detaching) detach_dev(t1);
    			destroy_component(tab2, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_4.name,
    		type: "slot",
    		source: "(20:1) <TabList>",
    		ctx
    	});

    	return block;
    }

    // (26:1) <TabPanel>
    function create_default_slot_3(ctx) {
    	let codeflask;
    	let updating_code;
    	let current;

    	function codeflask_code_binding(value) {
    		/*codeflask_code_binding*/ ctx[2].call(null, value);
    	}

    	let codeflask_props = {
    		opts: { language: "html", lineNumbers: true }
    	};

    	if (/*editors*/ ctx[0].html !== void 0) {
    		codeflask_props.code = /*editors*/ ctx[0].html;
    	}

    	codeflask = new CodeFlask_1({ props: codeflask_props, $$inline: true });
    	binding_callbacks.push(() => bind(codeflask, "code", codeflask_code_binding));

    	const block = {
    		c: function create() {
    			create_component(codeflask.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(codeflask, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const codeflask_changes = {};

    			if (!updating_code && dirty & /*editors*/ 1) {
    				updating_code = true;
    				codeflask_changes.code = /*editors*/ ctx[0].html;
    				add_flush_callback(() => updating_code = false);
    			}

    			codeflask.$set(codeflask_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(codeflask.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(codeflask.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(codeflask, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_3.name,
    		type: "slot",
    		source: "(26:1) <TabPanel>",
    		ctx
    	});

    	return block;
    }

    // (30:1) <TabPanel>
    function create_default_slot_2(ctx) {
    	let codeflask;
    	let updating_code;
    	let current;

    	function codeflask_code_binding_1(value) {
    		/*codeflask_code_binding_1*/ ctx[3].call(null, value);
    	}

    	let codeflask_props = {
    		opts: { language: "css", lineNumbers: true }
    	};

    	if (/*editors*/ ctx[0].style !== void 0) {
    		codeflask_props.code = /*editors*/ ctx[0].style;
    	}

    	codeflask = new CodeFlask_1({ props: codeflask_props, $$inline: true });
    	binding_callbacks.push(() => bind(codeflask, "code", codeflask_code_binding_1));

    	const block = {
    		c: function create() {
    			create_component(codeflask.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(codeflask, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const codeflask_changes = {};

    			if (!updating_code && dirty & /*editors*/ 1) {
    				updating_code = true;
    				codeflask_changes.code = /*editors*/ ctx[0].style;
    				add_flush_callback(() => updating_code = false);
    			}

    			codeflask.$set(codeflask_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(codeflask.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(codeflask.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(codeflask, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_2.name,
    		type: "slot",
    		source: "(30:1) <TabPanel>",
    		ctx
    	});

    	return block;
    }

    // (34:1) <TabPanel>
    function create_default_slot_1(ctx) {
    	let codeflask;
    	let updating_code;
    	let current;

    	function codeflask_code_binding_2(value) {
    		/*codeflask_code_binding_2*/ ctx[4].call(null, value);
    	}

    	let codeflask_props = {
    		opts: { language: "js", lineNumbers: true }
    	};

    	if (/*editors*/ ctx[0].script !== void 0) {
    		codeflask_props.code = /*editors*/ ctx[0].script;
    	}

    	codeflask = new CodeFlask_1({ props: codeflask_props, $$inline: true });
    	binding_callbacks.push(() => bind(codeflask, "code", codeflask_code_binding_2));

    	const block = {
    		c: function create() {
    			create_component(codeflask.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(codeflask, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const codeflask_changes = {};

    			if (!updating_code && dirty & /*editors*/ 1) {
    				updating_code = true;
    				codeflask_changes.code = /*editors*/ ctx[0].script;
    				add_flush_callback(() => updating_code = false);
    			}

    			codeflask.$set(codeflask_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(codeflask.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(codeflask.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(codeflask, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_1.name,
    		type: "slot",
    		source: "(34:1) <TabPanel>",
    		ctx
    	});

    	return block;
    }

    // (19:0) <Tabs {initialSelectedIndex}>
    function create_default_slot(ctx) {
    	let tablist;
    	let t0;
    	let div;
    	let tabpanel0;
    	let t1;
    	let tabpanel1;
    	let t2;
    	let tabpanel2;
    	let current;

    	tablist = new TabList({
    			props: {
    				$$slots: { default: [create_default_slot_4] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	tabpanel0 = new TabPanel({
    			props: {
    				$$slots: { default: [create_default_slot_3] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	tabpanel1 = new TabPanel({
    			props: {
    				$$slots: { default: [create_default_slot_2] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	tabpanel2 = new TabPanel({
    			props: {
    				$$slots: { default: [create_default_slot_1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(tablist.$$.fragment);
    			t0 = space();
    			div = element("div");
    			create_component(tabpanel0.$$.fragment);
    			t1 = space();
    			create_component(tabpanel1.$$.fragment);
    			t2 = space();
    			create_component(tabpanel2.$$.fragment);
    			attr_dev(div, "class", "wrapper svelte-5k30ru");
    			add_location(div, file$6, 24, 1, 586);
    		},
    		m: function mount(target, anchor) {
    			mount_component(tablist, target, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, div, anchor);
    			mount_component(tabpanel0, div, null);
    			append_dev(div, t1);
    			mount_component(tabpanel1, div, null);
    			append_dev(div, t2);
    			mount_component(tabpanel2, div, null);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const tablist_changes = {};

    			if (dirty & /*$$scope*/ 32) {
    				tablist_changes.$$scope = { dirty, ctx };
    			}

    			tablist.$set(tablist_changes);
    			const tabpanel0_changes = {};

    			if (dirty & /*$$scope, editors*/ 33) {
    				tabpanel0_changes.$$scope = { dirty, ctx };
    			}

    			tabpanel0.$set(tabpanel0_changes);
    			const tabpanel1_changes = {};

    			if (dirty & /*$$scope, editors*/ 33) {
    				tabpanel1_changes.$$scope = { dirty, ctx };
    			}

    			tabpanel1.$set(tabpanel1_changes);
    			const tabpanel2_changes = {};

    			if (dirty & /*$$scope, editors*/ 33) {
    				tabpanel2_changes.$$scope = { dirty, ctx };
    			}

    			tabpanel2.$set(tabpanel2_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(tablist.$$.fragment, local);
    			transition_in(tabpanel0.$$.fragment, local);
    			transition_in(tabpanel1.$$.fragment, local);
    			transition_in(tabpanel2.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(tablist.$$.fragment, local);
    			transition_out(tabpanel0.$$.fragment, local);
    			transition_out(tabpanel1.$$.fragment, local);
    			transition_out(tabpanel2.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(tablist, detaching);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(div);
    			destroy_component(tabpanel0);
    			destroy_component(tabpanel1);
    			destroy_component(tabpanel2);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot.name,
    		type: "slot",
    		source: "(19:0) <Tabs {initialSelectedIndex}>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$6(ctx) {
    	let tabs;
    	let current;

    	tabs = new Tabs({
    			props: {
    				initialSelectedIndex: /*initialSelectedIndex*/ ctx[1],
    				$$slots: { default: [create_default_slot] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(tabs.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(tabs, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const tabs_changes = {};
    			if (dirty & /*initialSelectedIndex*/ 2) tabs_changes.initialSelectedIndex = /*initialSelectedIndex*/ ctx[1];

    			if (dirty & /*$$scope, editors*/ 33) {
    				tabs_changes.$$scope = { dirty, ctx };
    			}

    			tabs.$set(tabs_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(tabs.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(tabs.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(tabs, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function getDegRng(min, max) {
    	let spread = Math.abs(min) + Math.abs(max);
    	return Math.random() * spread + min;
    }

    function instance$6($$self, $$props, $$invalidate) {
    	let { editors } = $$props;
    	let initialSelectedIndex;
    	const writable_props = ["editors"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<CodeInput> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("CodeInput", $$slots, []);

    	function codeflask_code_binding(value) {
    		editors.html = value;
    		$$invalidate(0, editors);
    	}

    	function codeflask_code_binding_1(value) {
    		editors.style = value;
    		$$invalidate(0, editors);
    	}

    	function codeflask_code_binding_2(value) {
    		editors.script = value;
    		$$invalidate(0, editors);
    	}

    	$$self.$set = $$props => {
    		if ("editors" in $$props) $$invalidate(0, editors = $$props.editors);
    	};

    	$$self.$capture_state = () => ({
    		onMount,
    		afterUpdate,
    		Tabs,
    		Tab,
    		TabList,
    		TabPanel,
    		CodeFlask: CodeFlask_1,
    		editors,
    		initialSelectedIndex,
    		getDegRng
    	});

    	$$self.$inject_state = $$props => {
    		if ("editors" in $$props) $$invalidate(0, editors = $$props.editors);
    		if ("initialSelectedIndex" in $$props) $$invalidate(1, initialSelectedIndex = $$props.initialSelectedIndex);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*editors*/ 1) {
    			 {
    				$$invalidate(1, initialSelectedIndex = [editors.html, editors.style, editors.script].findIndex(el => el !== ""));
    			}
    		}
    	};

    	return [
    		editors,
    		initialSelectedIndex,
    		codeflask_code_binding,
    		codeflask_code_binding_1,
    		codeflask_code_binding_2
    	];
    }

    class CodeInput extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, { editors: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "CodeInput",
    			options,
    			id: create_fragment$6.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*editors*/ ctx[0] === undefined && !("editors" in props)) {
    			console.warn("<CodeInput> was created without expected prop 'editors'");
    		}
    	}

    	get editors() {
    		throw new Error("<CodeInput>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set editors(value) {
    		throw new Error("<CodeInput>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\CodeEditor.svelte generated by Svelte v3.24.0 */
    const file$7 = "src\\components\\CodeEditor.svelte";

    // (14:0) {#if editors}
    function create_if_block$1(ctx) {
    	let codeinput;
    	let updating_editors;
    	let t0;
    	let sandbox;
    	let t1;
    	let if_block_anchor;
    	let current;

    	function codeinput_editors_binding(value) {
    		/*codeinput_editors_binding*/ ctx[4].call(null, value);
    	}

    	let codeinput_props = {};

    	if (/*editors*/ ctx[0] !== void 0) {
    		codeinput_props.editors = /*editors*/ ctx[0];
    	}

    	codeinput = new CodeInput({ props: codeinput_props, $$inline: true });
    	binding_callbacks.push(() => bind(codeinput, "editors", codeinput_editors_binding));

    	sandbox = new Sandbox({
    			props: {
    				content: /*active*/ ctx[1] && /*editors*/ ctx[0],
    				id: /*id*/ ctx[2]
    			},
    			$$inline: true
    		});

    	sandbox.$on("error", /*error_handler*/ ctx[5]);
    	sandbox.$on("change", /*change_handler*/ ctx[6]);
    	let if_block = /*active*/ ctx[1] && /*sandboxError*/ ctx[3] && create_if_block_1(ctx);

    	const block = {
    		c: function create() {
    			create_component(codeinput.$$.fragment);
    			t0 = space();
    			create_component(sandbox.$$.fragment);
    			t1 = space();
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			mount_component(codeinput, target, anchor);
    			insert_dev(target, t0, anchor);
    			mount_component(sandbox, target, anchor);
    			insert_dev(target, t1, anchor);
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const codeinput_changes = {};

    			if (!updating_editors && dirty & /*editors*/ 1) {
    				updating_editors = true;
    				codeinput_changes.editors = /*editors*/ ctx[0];
    				add_flush_callback(() => updating_editors = false);
    			}

    			codeinput.$set(codeinput_changes);
    			const sandbox_changes = {};
    			if (dirty & /*active, editors*/ 3) sandbox_changes.content = /*active*/ ctx[1] && /*editors*/ ctx[0];
    			if (dirty & /*id*/ 4) sandbox_changes.id = /*id*/ ctx[2];
    			sandbox.$set(sandbox_changes);

    			if (/*active*/ ctx[1] && /*sandboxError*/ ctx[3]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block_1(ctx);
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(codeinput.$$.fragment, local);
    			transition_in(sandbox.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(codeinput.$$.fragment, local);
    			transition_out(sandbox.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(codeinput, detaching);
    			if (detaching) detach_dev(t0);
    			destroy_component(sandbox, detaching);
    			if (detaching) detach_dev(t1);
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(14:0) {#if editors}",
    		ctx
    	});

    	return block;
    }

    // (17:0) {#if active && sandboxError}
    function create_if_block_1(ctx) {
    	let output;
    	let t_value = (/*sandboxError*/ ctx[3] ? /*sandboxError*/ ctx[3] : "") + "";
    	let t;

    	const block = {
    		c: function create() {
    			output = element("output");
    			t = text(t_value);
    			attr_dev(output, "value", /*sandboxError*/ ctx[3]);
    			attr_dev(output, "class", "svelte-1f82dwc");
    			add_location(output, file$7, 17, 4, 481);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, output, anchor);
    			append_dev(output, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*sandboxError*/ 8 && t_value !== (t_value = (/*sandboxError*/ ctx[3] ? /*sandboxError*/ ctx[3] : "") + "")) set_data_dev(t, t_value);

    			if (dirty & /*sandboxError*/ 8) {
    				attr_dev(output, "value", /*sandboxError*/ ctx[3]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(output);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(17:0) {#if active && sandboxError}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$7(ctx) {
    	let if_block_anchor;
    	let current;
    	let if_block = /*editors*/ ctx[0] && create_if_block$1(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*editors*/ ctx[0]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*editors*/ 1) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block$1(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$7.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$7($$self, $$props, $$invalidate) {
    	let { editors } = $$props;
    	let { active } = $$props;
    	let { id } = $$props;
    	let sandboxError;
    	const writable_props = ["editors", "active", "id"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<CodeEditor> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("CodeEditor", $$slots, []);

    	function codeinput_editors_binding(value) {
    		editors = value;
    		$$invalidate(0, editors);
    	}

    	const error_handler = e => $$invalidate(3, sandboxError = e.detail);
    	const change_handler = () => $$invalidate(3, sandboxError = "");

    	$$self.$set = $$props => {
    		if ("editors" in $$props) $$invalidate(0, editors = $$props.editors);
    		if ("active" in $$props) $$invalidate(1, active = $$props.active);
    		if ("id" in $$props) $$invalidate(2, id = $$props.id);
    	};

    	$$self.$capture_state = () => ({
    		onMount,
    		Sandbox,
    		CodeInput,
    		editors,
    		active,
    		id,
    		sandboxError
    	});

    	$$self.$inject_state = $$props => {
    		if ("editors" in $$props) $$invalidate(0, editors = $$props.editors);
    		if ("active" in $$props) $$invalidate(1, active = $$props.active);
    		if ("id" in $$props) $$invalidate(2, id = $$props.id);
    		if ("sandboxError" in $$props) $$invalidate(3, sandboxError = $$props.sandboxError);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		editors,
    		active,
    		id,
    		sandboxError,
    		codeinput_editors_binding,
    		error_handler,
    		change_handler
    	];
    }

    class CodeEditor extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$7, create_fragment$7, safe_not_equal, { editors: 0, active: 1, id: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "CodeEditor",
    			options,
    			id: create_fragment$7.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*editors*/ ctx[0] === undefined && !("editors" in props)) {
    			console.warn("<CodeEditor> was created without expected prop 'editors'");
    		}

    		if (/*active*/ ctx[1] === undefined && !("active" in props)) {
    			console.warn("<CodeEditor> was created without expected prop 'active'");
    		}

    		if (/*id*/ ctx[2] === undefined && !("id" in props)) {
    			console.warn("<CodeEditor> was created without expected prop 'id'");
    		}
    	}

    	get editors() {
    		throw new Error("<CodeEditor>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set editors(value) {
    		throw new Error("<CodeEditor>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get active() {
    		throw new Error("<CodeEditor>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set active(value) {
    		throw new Error("<CodeEditor>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get id() {
    		throw new Error("<CodeEditor>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set id(value) {
    		throw new Error("<CodeEditor>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\SideArticle.svelte generated by Svelte v3.24.0 */
    const file$8 = "src\\components\\SideArticle.svelte";

    function create_fragment$8(ctx) {
    	let article_1;
    	let div;
    	let h2;
    	let t1;
    	let code0;
    	let t3;
    	let ul;
    	let li0;
    	let t5;
    	let li1;
    	let t6;
    	let code1;
    	let t8;
    	let li2;
    	let code2;
    	let t10;
    	let t11;
    	let li3;
    	let t13;
    	let li4;
    	let t14;
    	let code3;
    	let t16;
    	let li5;
    	let code4;
    	let t18;
    	let t19;
    	let li6;
    	let t21;
    	let li7;
    	let t22;
    	let code5;
    	let t24;
    	let li8;
    	let code6;
    	let t26;
    	let t27;
    	let li9;
    	let t29;
    	let li10;
    	let t30;
    	let code7;
    	let t32;
    	let li11;
    	let code8;
    	let t34;

    	const block = {
    		c: function create() {
    			article_1 = element("article");
    			div = element("div");
    			h2 = element("h2");
    			h2.textContent = "Great Standin Heading";
    			t1 = text("\r\n        There will be some text ");
    			code0 = element("code");
    			code0.textContent = "here";
    			t3 = text(".\r\n        ");
    			ul = element("ul");
    			li0 = element("li");
    			li0.textContent = "Some placeholder text.";
    			t5 = space();
    			li1 = element("li");
    			t6 = text("You never know who might read this. ");
    			code1 = element("code");
    			code1.textContent = "Aliens?";
    			t8 = space();
    			li2 = element("li");
    			code2 = element("code");
    			code2.textContent = "a + b = c";
    			t10 = text(", stunning realisations occur rapidly.");
    			t11 = space();
    			li3 = element("li");
    			li3.textContent = "Some placeholder text.";
    			t13 = space();
    			li4 = element("li");
    			t14 = text("You never know who might read this. ");
    			code3 = element("code");
    			code3.textContent = "Aliens?";
    			t16 = space();
    			li5 = element("li");
    			code4 = element("code");
    			code4.textContent = "a + b = c";
    			t18 = text(", stunning realisations occur rapidly.");
    			t19 = space();
    			li6 = element("li");
    			li6.textContent = "Some placeholder text.";
    			t21 = space();
    			li7 = element("li");
    			t22 = text("You never know who might read this. ");
    			code5 = element("code");
    			code5.textContent = "Aliens?";
    			t24 = space();
    			li8 = element("li");
    			code6 = element("code");
    			code6.textContent = "a + b = c";
    			t26 = text(", stunning realisations occur rapidly.");
    			t27 = space();
    			li9 = element("li");
    			li9.textContent = "Some placeholder text.";
    			t29 = space();
    			li10 = element("li");
    			t30 = text("You never know who might read this. ");
    			code7 = element("code");
    			code7.textContent = "Aliens?";
    			t32 = space();
    			li11 = element("li");
    			code8 = element("code");
    			code8.textContent = "a + b = c";
    			t34 = text(", stunning realisations occur rapidly.");
    			add_location(h2, file$8, 13, 8, 321);
    			add_location(code0, file$8, 14, 32, 385);
    			add_location(li0, file$8, 16, 12, 431);
    			add_location(code1, file$8, 17, 52, 516);
    			add_location(li1, file$8, 17, 12, 476);
    			add_location(code2, file$8, 18, 16, 559);
    			add_location(li2, file$8, 18, 12, 555);
    			add_location(li3, file$8, 19, 12, 638);
    			add_location(code3, file$8, 20, 52, 723);
    			add_location(li4, file$8, 20, 12, 683);
    			add_location(code4, file$8, 21, 16, 766);
    			add_location(li5, file$8, 21, 12, 762);
    			add_location(li6, file$8, 22, 12, 845);
    			add_location(code5, file$8, 23, 52, 930);
    			add_location(li7, file$8, 23, 12, 890);
    			add_location(code6, file$8, 24, 16, 973);
    			add_location(li8, file$8, 24, 12, 969);
    			add_location(li9, file$8, 25, 12, 1052);
    			add_location(code7, file$8, 26, 52, 1137);
    			add_location(li10, file$8, 26, 12, 1097);
    			add_location(code8, file$8, 27, 16, 1180);
    			add_location(li11, file$8, 27, 12, 1176);
    			add_location(ul, file$8, 15, 8, 413);
    			attr_dev(div, "class", "skeleton svelte-z1gozm");
    			add_location(div, file$8, 12, 4, 289);
    			attr_dev(article_1, "class", "side-article svelte-z1gozm");
    			add_location(article_1, file$8, 11, 0, 231);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, article_1, anchor);
    			append_dev(article_1, div);
    			append_dev(div, h2);
    			append_dev(div, t1);
    			append_dev(div, code0);
    			append_dev(div, t3);
    			append_dev(div, ul);
    			append_dev(ul, li0);
    			append_dev(ul, t5);
    			append_dev(ul, li1);
    			append_dev(li1, t6);
    			append_dev(li1, code1);
    			append_dev(ul, t8);
    			append_dev(ul, li2);
    			append_dev(li2, code2);
    			append_dev(li2, t10);
    			append_dev(ul, t11);
    			append_dev(ul, li3);
    			append_dev(ul, t13);
    			append_dev(ul, li4);
    			append_dev(li4, t14);
    			append_dev(li4, code3);
    			append_dev(ul, t16);
    			append_dev(ul, li5);
    			append_dev(li5, code4);
    			append_dev(li5, t18);
    			append_dev(ul, t19);
    			append_dev(ul, li6);
    			append_dev(ul, t21);
    			append_dev(ul, li7);
    			append_dev(li7, t22);
    			append_dev(li7, code5);
    			append_dev(ul, t24);
    			append_dev(ul, li8);
    			append_dev(li8, code6);
    			append_dev(li8, t26);
    			append_dev(ul, t27);
    			append_dev(ul, li9);
    			append_dev(ul, t29);
    			append_dev(ul, li10);
    			append_dev(li10, t30);
    			append_dev(li10, code7);
    			append_dev(ul, t32);
    			append_dev(ul, li11);
    			append_dev(li11, code8);
    			append_dev(li11, t34);
    			/*article_1_binding*/ ctx[2](article_1);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(article_1);
    			/*article_1_binding*/ ctx[2](null);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$8.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$8($$self, $$props, $$invalidate) {
    	let { article } = $$props;
    	let container;

    	afterUpdate(() => {
    		article !== undefined
    		? $$invalidate(0, container.innerHTML = article, container)
    		: {};
    	});

    	const writable_props = ["article"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<SideArticle> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("SideArticle", $$slots, []);

    	function article_1_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			container = $$value;
    			$$invalidate(0, container);
    		});
    	}

    	$$self.$set = $$props => {
    		if ("article" in $$props) $$invalidate(1, article = $$props.article);
    	};

    	$$self.$capture_state = () => ({ onMount, afterUpdate, article, container });

    	$$self.$inject_state = $$props => {
    		if ("article" in $$props) $$invalidate(1, article = $$props.article);
    		if ("container" in $$props) $$invalidate(0, container = $$props.container);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [container, article, article_1_binding];
    }

    class SideArticle extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$8, create_fragment$8, safe_not_equal, { article: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "SideArticle",
    			options,
    			id: create_fragment$8.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*article*/ ctx[1] === undefined && !("article" in props)) {
    			console.warn("<SideArticle> was created without expected prop 'article'");
    		}
    	}

    	get article() {
    		throw new Error("<SideArticle>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set article(value) {
    		throw new Error("<SideArticle>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    let id$1 = 1;

    function getId$1(prefix) {
      return `${prefix}-${id$1++}`;
    }

    /* src\components\InteractiveArticle.svelte generated by Svelte v3.24.0 */
    const file$9 = "src\\components\\InteractiveArticle.svelte";

    // (54:8) {#if editors}
    function create_if_block$2(ctx) {
    	let codeeditor;
    	let current;

    	codeeditor = new CodeEditor({
    			props: {
    				editors: /*editors*/ ctx[1],
    				id: /*id*/ ctx[5],
    				active: /*editorActive*/ ctx[3]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(codeeditor.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(codeeditor, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const codeeditor_changes = {};
    			if (dirty & /*editors*/ 2) codeeditor_changes.editors = /*editors*/ ctx[1];
    			if (dirty & /*id*/ 32) codeeditor_changes.id = /*id*/ ctx[5];
    			if (dirty & /*editorActive*/ 8) codeeditor_changes.active = /*editorActive*/ ctx[3];
    			codeeditor.$set(codeeditor_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(codeeditor.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(codeeditor.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(codeeditor, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$2.name,
    		type: "if",
    		source: "(54:8) {#if editors}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$9(ctx) {
    	let article_1;
    	let section0;
    	let sidearticle;
    	let t;
    	let section1;
    	let current;
    	let mounted;
    	let dispose;

    	sidearticle = new SideArticle({
    			props: { article: /*article*/ ctx[2] },
    			$$inline: true
    		});

    	let if_block = /*editors*/ ctx[1] && create_if_block$2(ctx);

    	const block = {
    		c: function create() {
    			article_1 = element("article");
    			section0 = element("section");
    			create_component(sidearticle.$$.fragment);
    			t = space();
    			section1 = element("section");
    			if (if_block) if_block.c();
    			attr_dev(section0, "class", "svelte-f8f3vf");
    			add_location(section0, file$9, 48, 4, 1254);
    			attr_dev(section1, "class", "code svelte-f8f3vf");
    			add_location(section1, file$9, 52, 4, 1334);
    			attr_dev(article_1, "data-src", /*content*/ ctx[0]);
    			attr_dev(article_1, "class", "svelte-f8f3vf");
    			add_location(article_1, file$9, 47, 0, 1198);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, article_1, anchor);
    			append_dev(article_1, section0);
    			mount_component(sidearticle, section0, null);
    			append_dev(article_1, t);
    			append_dev(article_1, section1);
    			if (if_block) if_block.m(section1, null);
    			/*section1_binding*/ ctx[9](section1);
    			/*article_1_binding*/ ctx[10](article_1);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(section1, "focusin", /*activate*/ ctx[7], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			const sidearticle_changes = {};
    			if (dirty & /*article*/ 4) sidearticle_changes.article = /*article*/ ctx[2];
    			sidearticle.$set(sidearticle_changes);

    			if (/*editors*/ ctx[1]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*editors*/ 2) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block$2(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(section1, null);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}

    			if (!current || dirty & /*content*/ 1) {
    				attr_dev(article_1, "data-src", /*content*/ ctx[0]);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(sidearticle.$$.fragment, local);
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(sidearticle.$$.fragment, local);
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(article_1);
    			destroy_component(sidearticle);
    			if (if_block) if_block.d();
    			/*section1_binding*/ ctx[9](null);
    			/*article_1_binding*/ ctx[10](null);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$9.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$9($$self, $$props, $$invalidate) {
    	let { content } = $$props;
    	let { active = false } = $$props;
    	let editors, article, editorActive = false, container, id, editContainer;

    	onMount(() => {
    		$$invalidate(5, id = getId$1("sandbox"));

    		fetch(content).then(response => response.text()).then(text => {
    			let src = read(text);
    			$$invalidate(1, editors = src.editors);
    			$$invalidate(2, article = src.article || "");
    		}).then(() => {
    			if (active) {
    				window.scrollTo(0, container.parentElement.offsetTop);
    			}
    		});
    	});

    	function activate() {
    		$$invalidate(3, editorActive = true);
    		window.addEventListener("click", deactivate);
    	}

    	function deactivate(e) {
    		if (!e.path.includes(editContainer)) {
    			window.removeEventListener("click", deactivate);
    			$$invalidate(3, editorActive = false);
    		}
    	}

    	const writable_props = ["content", "active"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<InteractiveArticle> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("InteractiveArticle", $$slots, []);

    	function section1_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			editContainer = $$value;
    			$$invalidate(6, editContainer);
    		});
    	}

    	function article_1_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			container = $$value;
    			$$invalidate(4, container);
    		});
    	}

    	$$self.$set = $$props => {
    		if ("content" in $$props) $$invalidate(0, content = $$props.content);
    		if ("active" in $$props) $$invalidate(8, active = $$props.active);
    	};

    	$$self.$capture_state = () => ({
    		CodeEditor,
    		SideArticle,
    		onMount,
    		getId: getId$1,
    		read,
    		content,
    		active,
    		editors,
    		article,
    		editorActive,
    		container,
    		id,
    		editContainer,
    		activate,
    		deactivate
    	});

    	$$self.$inject_state = $$props => {
    		if ("content" in $$props) $$invalidate(0, content = $$props.content);
    		if ("active" in $$props) $$invalidate(8, active = $$props.active);
    		if ("editors" in $$props) $$invalidate(1, editors = $$props.editors);
    		if ("article" in $$props) $$invalidate(2, article = $$props.article);
    		if ("editorActive" in $$props) $$invalidate(3, editorActive = $$props.editorActive);
    		if ("container" in $$props) $$invalidate(4, container = $$props.container);
    		if ("id" in $$props) $$invalidate(5, id = $$props.id);
    		if ("editContainer" in $$props) $$invalidate(6, editContainer = $$props.editContainer);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		content,
    		editors,
    		article,
    		editorActive,
    		container,
    		id,
    		editContainer,
    		activate,
    		active,
    		section1_binding,
    		article_1_binding
    	];
    }

    class InteractiveArticle extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$9, create_fragment$9, safe_not_equal, { content: 0, active: 8 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "InteractiveArticle",
    			options,
    			id: create_fragment$9.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*content*/ ctx[0] === undefined && !("content" in props)) {
    			console.warn("<InteractiveArticle> was created without expected prop 'content'");
    		}
    	}

    	get content() {
    		throw new Error("<InteractiveArticle>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set content(value) {
    		throw new Error("<InteractiveArticle>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get active() {
    		throw new Error("<InteractiveArticle>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set active(value) {
    		throw new Error("<InteractiveArticle>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\IntersectionObserver.svelte generated by Svelte v3.24.0 */
    const file$a = "src\\components\\IntersectionObserver.svelte";
    const get_default_slot_changes = dirty => ({ intersecting: dirty & /*intersecting*/ 1 });
    const get_default_slot_context = ctx => ({ intersecting: /*intersecting*/ ctx[0] });

    function create_fragment$a(ctx) {
    	let div;
    	let current;
    	const default_slot_template = /*$$slots*/ ctx[8].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[7], get_default_slot_context);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (default_slot) default_slot.c();
    			attr_dev(div, "class", "svelte-1c44y5p");
    			add_location(div, file$a, 63, 0, 1387);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			if (default_slot) {
    				default_slot.m(div, null);
    			}

    			/*div_binding*/ ctx[9](div);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot) {
    				if (default_slot.p && dirty & /*$$scope, intersecting*/ 129) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[7], dirty, get_default_slot_changes, get_default_slot_context);
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (default_slot) default_slot.d(detaching);
    			/*div_binding*/ ctx[9](null);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$a.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$a($$self, $$props, $$invalidate) {
    	const dispatch = createEventDispatcher();
    	let { once = false } = $$props;
    	let { top = 0 } = $$props;
    	let { bottom = 0 } = $$props;
    	let { left = 0 } = $$props;
    	let { right = 0 } = $$props;
    	let intersecting = false;
    	let container;

    	onMount(() => {
    		if (typeof IntersectionObserver !== "undefined") {
    			const rootMargin = `${bottom}px ${left}px ${top}px ${right}px`;

    			const observer = new IntersectionObserver(entries => {
    					$$invalidate(0, intersecting = entries[0].isIntersecting);

    					if (intersecting && once) {
    						observer.unobserve(container);
    					}

    					if (intersecting) {
    						dispatch("intersect");
    					}
    				},
    			{ rootMargin, threshold: 0.5 });

    			observer.observe(container);
    			return () => observer.unobserve(container);
    		}

    		function handler() {
    			const bcr = container.getBoundingClientRect();
    			$$invalidate(0, intersecting = bcr.bottom + bottom > 0 && bcr.right + right > 0 && bcr.top - top < window.innerHeight && bcr.left - left < window.innerWidth);

    			if (intersecting && once) {
    				window.removeEventListener("scroll", handler);
    			}
    		}

    		window.addEventListener("scroll", handler);
    		return () => window.removeEventListener("scroll", handler);
    	});

    	const writable_props = ["once", "top", "bottom", "left", "right"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<IntersectionObserver> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("IntersectionObserver", $$slots, ['default']);

    	function div_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			container = $$value;
    			$$invalidate(1, container);
    		});
    	}

    	$$self.$set = $$props => {
    		if ("once" in $$props) $$invalidate(2, once = $$props.once);
    		if ("top" in $$props) $$invalidate(3, top = $$props.top);
    		if ("bottom" in $$props) $$invalidate(4, bottom = $$props.bottom);
    		if ("left" in $$props) $$invalidate(5, left = $$props.left);
    		if ("right" in $$props) $$invalidate(6, right = $$props.right);
    		if ("$$scope" in $$props) $$invalidate(7, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		onMount,
    		createEventDispatcher,
    		dispatch,
    		once,
    		top,
    		bottom,
    		left,
    		right,
    		intersecting,
    		container
    	});

    	$$self.$inject_state = $$props => {
    		if ("once" in $$props) $$invalidate(2, once = $$props.once);
    		if ("top" in $$props) $$invalidate(3, top = $$props.top);
    		if ("bottom" in $$props) $$invalidate(4, bottom = $$props.bottom);
    		if ("left" in $$props) $$invalidate(5, left = $$props.left);
    		if ("right" in $$props) $$invalidate(6, right = $$props.right);
    		if ("intersecting" in $$props) $$invalidate(0, intersecting = $$props.intersecting);
    		if ("container" in $$props) $$invalidate(1, container = $$props.container);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		intersecting,
    		container,
    		once,
    		top,
    		bottom,
    		left,
    		right,
    		$$scope,
    		$$slots,
    		div_binding
    	];
    }

    class IntersectionObserver_1 extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$a, create_fragment$a, safe_not_equal, {
    			once: 2,
    			top: 3,
    			bottom: 4,
    			left: 5,
    			right: 6
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "IntersectionObserver_1",
    			options,
    			id: create_fragment$a.name
    		});
    	}

    	get once() {
    		throw new Error("<IntersectionObserver>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set once(value) {
    		throw new Error("<IntersectionObserver>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get top() {
    		throw new Error("<IntersectionObserver>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set top(value) {
    		throw new Error("<IntersectionObserver>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get bottom() {
    		throw new Error("<IntersectionObserver>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set bottom(value) {
    		throw new Error("<IntersectionObserver>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get left() {
    		throw new Error("<IntersectionObserver>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set left(value) {
    		throw new Error("<IntersectionObserver>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get right() {
    		throw new Error("<IntersectionObserver>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set right(value) {
    		throw new Error("<IntersectionObserver>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\App.svelte generated by Svelte v3.24.0 */
    const file$b = "src\\App.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[11] = list[i];
    	return child_ctx;
    }

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[14] = list[i];
    	return child_ctx;
    }

    // (69:0) {#if selectedDay}
    function create_if_block$3(ctx) {
    	let header;
    	let h1;
    	let t0_value = /*selectedDay*/ ctx[1].title + "";
    	let t0;
    	let t1;
    	let p;
    	let t2_value = /*selectedDay*/ ctx[1].subtitle + "";
    	let t2;
    	let t3;
    	let nav;
    	let t4;
    	let main;
    	let t5;
    	let footer;
    	let span;
    	let current;
    	let each_value_1 = /*days*/ ctx[0];
    	validate_each_argument(each_value_1);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
    	}

    	let if_block = /*selectedDay*/ ctx[1].slides && create_if_block_1$1(ctx);

    	const block = {
    		c: function create() {
    			header = element("header");
    			h1 = element("h1");
    			t0 = text(t0_value);
    			t1 = space();
    			p = element("p");
    			t2 = text(t2_value);
    			t3 = space();
    			nav = element("nav");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t4 = space();
    			main = element("main");
    			if (if_block) if_block.c();
    			t5 = space();
    			footer = element("footer");
    			span = element("span");
    			span.textContent = "© 2020 Louis Ritzkowski";
    			add_location(h1, file$b, 70, 2, 1752);
    			add_location(p, file$b, 71, 2, 1783);
    			attr_dev(nav, "class", "svelte-1db7huj");
    			add_location(nav, file$b, 72, 2, 1815);
    			attr_dev(header, "class", "svelte-1db7huj");
    			add_location(header, file$b, 69, 1, 1741);
    			attr_dev(main, "class", "svelte-1db7huj");
    			add_location(main, file$b, 78, 1, 1978);
    			add_location(span, file$b, 88, 2, 2335);
    			attr_dev(footer, "class", "svelte-1db7huj");
    			add_location(footer, file$b, 87, 1, 2324);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, header, anchor);
    			append_dev(header, h1);
    			append_dev(h1, t0);
    			append_dev(header, t1);
    			append_dev(header, p);
    			append_dev(p, t2);
    			append_dev(header, t3);
    			append_dev(header, nav);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(nav, null);
    			}

    			insert_dev(target, t4, anchor);
    			insert_dev(target, main, anchor);
    			if (if_block) if_block.m(main, null);
    			insert_dev(target, t5, anchor);
    			insert_dev(target, footer, anchor);
    			append_dev(footer, span);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if ((!current || dirty & /*selectedDay*/ 2) && t0_value !== (t0_value = /*selectedDay*/ ctx[1].title + "")) set_data_dev(t0, t0_value);
    			if ((!current || dirty & /*selectedDay*/ 2) && t2_value !== (t2_value = /*selectedDay*/ ctx[1].subtitle + "")) set_data_dev(t2, t2_value);

    			if (dirty & /*days, selectedDay, selectDay*/ 19) {
    				each_value_1 = /*days*/ ctx[0];
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1(ctx, each_value_1, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block_1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(nav, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value_1.length;
    			}

    			if (/*selectedDay*/ ctx[1].slides) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*selectedDay*/ 2) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block_1$1(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(main, null);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(header);
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(t4);
    			if (detaching) detach_dev(main);
    			if (if_block) if_block.d();
    			if (detaching) detach_dev(t5);
    			if (detaching) detach_dev(footer);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$3.name,
    		type: "if",
    		source: "(69:0) {#if selectedDay}",
    		ctx
    	});

    	return block;
    }

    // (74:3) {#each days as day}
    function create_each_block_1(ctx) {
    	let button;
    	let t_value = /*day*/ ctx[14].title + "";
    	let t;
    	let mounted;
    	let dispose;

    	function click_handler(...args) {
    		return /*click_handler*/ ctx[5](/*day*/ ctx[14], ...args);
    	}

    	const block = {
    		c: function create() {
    			button = element("button");
    			t = text(t_value);
    			toggle_class(button, "selected", /*day*/ ctx[14] === /*selectedDay*/ ctx[1]);
    			add_location(button, file$b, 74, 4, 1848);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			append_dev(button, t);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", click_handler, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty & /*days*/ 1 && t_value !== (t_value = /*day*/ ctx[14].title + "")) set_data_dev(t, t_value);

    			if (dirty & /*days, selectedDay*/ 3) {
    				toggle_class(button, "selected", /*day*/ ctx[14] === /*selectedDay*/ ctx[1]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1.name,
    		type: "each",
    		source: "(74:3) {#each days as day}",
    		ctx
    	});

    	return block;
    }

    // (80:1) {#if selectedDay.slides}
    function create_if_block_1$1(ctx) {
    	let each_blocks = [];
    	let each_1_lookup = new Map();
    	let each_1_anchor;
    	let current;
    	let each_value = /*selectedDay*/ ctx[1].slides;
    	validate_each_argument(each_value);
    	const get_key = ctx => /*article*/ ctx[11];
    	validate_each_keys(ctx, each_value, get_each_context, get_key);

    	for (let i = 0; i < each_value.length; i += 1) {
    		let child_ctx = get_each_context(ctx, each_value, i);
    		let key = get_key(child_ctx);
    		each_1_lookup.set(key, each_blocks[i] = create_each_block(key, child_ctx));
    	}

    	const block = {
    		c: function create() {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each_1_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*window, onIntersect, selectedDay, currentArticle*/ 14) {
    				const each_value = /*selectedDay*/ ctx[1].slides;
    				validate_each_argument(each_value);
    				group_outros();
    				validate_each_keys(ctx, each_value, get_each_context, get_key);
    				each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value, each_1_lookup, each_1_anchor.parentNode, outro_and_destroy_block, create_each_block, each_1_anchor, get_each_context);
    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].d(detaching);
    			}

    			if (detaching) detach_dev(each_1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$1.name,
    		type: "if",
    		source: "(80:1) {#if selectedDay.slides}",
    		ctx
    	});

    	return block;
    }

    // (82:3) <IntersectionObserver on:intersect={() => onIntersect(article)} top={-window.innerHeight / 3} bottom={0}>
    function create_default_slot$1(ctx) {
    	let interactivearticle;
    	let t;
    	let current;

    	interactivearticle = new InteractiveArticle({
    			props: {
    				content: /*article*/ ctx[11],
    				active: /*article*/ ctx[11] === /*currentArticle*/ ctx[2]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(interactivearticle.$$.fragment);
    			t = space();
    		},
    		m: function mount(target, anchor) {
    			mount_component(interactivearticle, target, anchor);
    			insert_dev(target, t, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const interactivearticle_changes = {};
    			if (dirty & /*selectedDay*/ 2) interactivearticle_changes.content = /*article*/ ctx[11];
    			if (dirty & /*selectedDay, currentArticle*/ 6) interactivearticle_changes.active = /*article*/ ctx[11] === /*currentArticle*/ ctx[2];
    			interactivearticle.$set(interactivearticle_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(interactivearticle.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(interactivearticle.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(interactivearticle, detaching);
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$1.name,
    		type: "slot",
    		source: "(82:3) <IntersectionObserver on:intersect={() => onIntersect(article)} top={-window.innerHeight / 3} bottom={0}>",
    		ctx
    	});

    	return block;
    }

    // (81:2) {#each selectedDay.slides as article (article)}
    function create_each_block(key_1, ctx) {
    	let first;
    	let intersectionobserver;
    	let current;

    	function intersect_handler(...args) {
    		return /*intersect_handler*/ ctx[6](/*article*/ ctx[11], ...args);
    	}

    	intersectionobserver = new IntersectionObserver_1({
    			props: {
    				top: -window.innerHeight / 3,
    				bottom: 0,
    				$$slots: { default: [create_default_slot$1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	intersectionobserver.$on("intersect", intersect_handler);

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			first = empty();
    			create_component(intersectionobserver.$$.fragment);
    			this.first = first;
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, first, anchor);
    			mount_component(intersectionobserver, target, anchor);
    			current = true;
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			const intersectionobserver_changes = {};

    			if (dirty & /*$$scope, selectedDay, currentArticle*/ 131078) {
    				intersectionobserver_changes.$$scope = { dirty, ctx };
    			}

    			intersectionobserver.$set(intersectionobserver_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(intersectionobserver.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(intersectionobserver.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(first);
    			destroy_component(intersectionobserver, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(81:2) {#each selectedDay.slides as article (article)}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$b(ctx) {
    	let if_block_anchor;
    	let current;
    	let if_block = /*selectedDay*/ ctx[1] && create_if_block$3(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*selectedDay*/ ctx[1]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*selectedDay*/ 2) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block$3(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$b.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function setSearch(day, article) {
    	window.history.replaceState("", "", "?" + day + "?" + article);
    }

    function instance$b($$self, $$props, $$invalidate) {
    	const urlMatcher = new RegExp(/\?(?<title>[^\?]+)(\?(?<article>[^\?]+))?/g);
    	let days, selectedDay, currentArticle, intersection = false;

    	onMount(() => {
    		intersection = false;

    		fetch("./content/index.json").then(repsonse => repsonse.json()).then(list => {
    			$$invalidate(0, days = list);
    		}).then(() => {
    			window.onpopstate = ev => {
    				extractSelectionFromUrl(ev.target.location.search);
    			};

    			extractSelectionFromUrl(window.location.search);
    		});
    	});

    	beforeUpdate(() => {
    		intersection = false;
    		window.addEventListener("scroll", activateIntersection);
    	});

    	function activateIntersection() {
    		window.removeEventListener("scroll", activateIntersection);
    		intersection = true;
    	}

    	function extractSelectionFromUrl(url) {
    		if (url.match(urlMatcher)) {
    			let { title, article } = url.matchAll(urlMatcher).next().value.groups;
    			$$invalidate(1, selectedDay = days.find(el => el.title === title) || days[0]);
    			$$invalidate(2, currentArticle = selectedDay.slides.find(el => el.includes(article?.replace(/%20/g, " "))));
    		} else {
    			$$invalidate(1, selectedDay = days[0]);
    		}
    	}

    	function onIntersect(article) {
    		if (!intersection) {
    			return;
    		}

    		$$invalidate(2, currentArticle = article);
    		setSearch(selectedDay.title, currentArticle.split("/")[2].split(".")[0]);
    	}

    	function selectDay(day) {
    		$$invalidate(1, selectedDay = day);
    		window.history.pushState("", "", "?" + day.title);
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("App", $$slots, []);
    	const click_handler = day => selectDay(day);
    	const intersect_handler = article => onIntersect(article);

    	$$self.$capture_state = () => ({
    		CodeEditor,
    		InteractiveArticle,
    		IntersectionObserver: IntersectionObserver_1,
    		onMount,
    		beforeUpdate,
    		urlMatcher,
    		days,
    		selectedDay,
    		currentArticle,
    		intersection,
    		activateIntersection,
    		extractSelectionFromUrl,
    		onIntersect,
    		setSearch,
    		selectDay
    	});

    	$$self.$inject_state = $$props => {
    		if ("days" in $$props) $$invalidate(0, days = $$props.days);
    		if ("selectedDay" in $$props) $$invalidate(1, selectedDay = $$props.selectedDay);
    		if ("currentArticle" in $$props) $$invalidate(2, currentArticle = $$props.currentArticle);
    		if ("intersection" in $$props) intersection = $$props.intersection;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		days,
    		selectedDay,
    		currentArticle,
    		onIntersect,
    		selectDay,
    		click_handler,
    		intersect_handler
    	];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$b, create_fragment$b, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$b.name
    		});
    	}
    }

    const app = new App({
    	target: document.body,
    	props: {
    	}
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map

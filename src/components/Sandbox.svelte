<script>
    import { onMount, afterUpdate, createEventDispatcher } from 'svelte';
    import { glue } from '../utils/exampleReader.js';
    const dispatch = createEventDispatcher();

    export let content;
    export let id;

    let sandbox, wrapper, lastContent = "", unloaded = true;

    afterUpdate(() => {
        if(content) {
            if(unloaded || !compare(content, lastContent)) {
                dispatch("change", {});
                wrapper.innerHTML = "";

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
                lastContent = {...content};
                unloaded = false;
            } 
        } else {
            wrapper.innerHTML = "";
            unloaded = true;
        }
    });

    function compare(a, b) {
        return a.html === b.html && a.script === b.script && a.style === b.style;
    }

    function message(msg) {
        if(msg.data.id === id) {
            let {message, lineNumber, columnNumber} = msg.data;
            message ? dispatch("error", message + "  (at " + lineNumber + ":" + columnNumber + ")") : {};
        }
    }

    function extractErrorLine(stack) {
        stack.indexOf("eval at <anonymous")
    }

</script>

<div class="sandbox-wrapper" bind:this={wrapper}></div>

<svelte:window on:message={message}></svelte:window>

<style>
    div {
        width: 100%;
        margin-top: 10px;
        height: 100%;
    }
    div :global(iframe) {
        width: 100%;
        height: 100%;
        border: none;
    }

    div {
        border: 1px solid grey;
    }
</style>
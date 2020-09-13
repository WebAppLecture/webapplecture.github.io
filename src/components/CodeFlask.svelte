<script>
    import { onMount, afterUpdate } from 'svelte';
    import CodeFlask from 'codeflask';

    export let opts;
    export let code;

    const SAVE_TIMEOUT = 500;

    let flask,
        codeArea,
        saveTimeout;
        
    onMount(() => {
		flask = new CodeFlask(codeArea, opts);

		flask.onUpdate(newCode => {
            clearTimeout(saveTimeout);
            saveTimeout = setTimeout(() => {
                code = newCode;
            }, SAVE_TIMEOUT);
        });
		flask.updateCode(code);
	});
	
	afterUpdate(() => {
		flask.updateCode(code);
    });
</script>

<div class="codeArea" bind:this={codeArea}></div>

<style>
    .codeArea {
        height: 100%;
        position: relative;
    }

    :global(.codeArea .codeflask .codeflask__textarea::selection),
    :global(.codeArea .codeflask .codeflask__textarea::-moz-selection) {
        color: transparent;
        
    }

    :global(.codeArea .codeflask .codeflask__pre) {
        width: auto !important;
    }

</style>
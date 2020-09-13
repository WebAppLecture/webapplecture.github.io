<script>
    import { onMount } from 'svelte';
    import Sandbox from './Sandbox.svelte';
    import CodeInput from './CodeInput.svelte';

    export let editors;
    export let active;
    export let id;

    let sandboxError;

</script>

{#if editors}
<CodeInput bind:editors={editors}></CodeInput>
<Sandbox content={active && editors} {id} on:error={e => sandboxError = e.detail} on:change={() => sandboxError = ""}></Sandbox>
{#if active && sandboxError}
    <output value={sandboxError}>{sandboxError ? sandboxError : ""}</output>
{/if}
{/if}

<style>

    output {
        display: block;
        font-family: monospace;
        background: black;
        color: white;
        padding: 0 20px 0 41px;
        transform: translate(15px, 10px) rotate(-3deg);
        float: right;
    }
</style>




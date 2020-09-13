<script>
    import { onMount } from 'svelte';
    export let article;

    let container;

    onMount(() => {
        container.innerHTML = article;
    });    
</script>
{#if article}
<article bind:this={container}>
</article>
{/if}

<style>
    article :global(h2) {
        background: black;
        color: white;
        width: max-content;
        padding: 0 20px 0 40px;
        transform: rotate(-3deg);
        text-transform: uppercase;
        font-weight: 400;
    }

    article :global(code) {
        display: inline-block;
        background: black;
        padding: 0 1em;
        color: white;
    }

    article :global(pre) {
        background: black;
        color: white;
        padding: 5px 15px;
        width: max-content;
        font-family: inherit;
        margin: .5em 0;
        font-size: small;
    }

    article :global(figure) {
        float: right;
    }

    article :global(figcaption) {
        text-align: center;
    }


    article :global(img) {
        max-width: 100%;
    }

</style>
<script>
    import { onMount, afterUpdate } from 'svelte';
    export let article;

    let container;
    
    afterUpdate(() => {
        article !== undefined ? container.innerHTML = article : {};
    });
</script>

<article class="side-article" bind:this={container}>
    <div class="skeleton">
        <h2>Great Standin Heading</h2>
        There will be some text <code>here</code>.
        <ul>
            <li>Some placeholder text.</li>
            <li>You never know who might read this. <code>Aliens?</code></li>
            <li><code>a + b = c</code>, stunning realisations occur rapidly.</li>
            <li>Some placeholder text.</li>
            <li>You never know who might read this. <code>Aliens?</code></li>
            <li><code>a + b = c</code>, stunning realisations occur rapidly.</li>
            <li>Some placeholder text.</li>
            <li>You never know who might read this. <code>Aliens?</code></li>
            <li><code>a + b = c</code>, stunning realisations occur rapidly.</li>
            <li>Some placeholder text.</li>
            <li>You never know who might read this. <code>Aliens?</code></li>
            <li><code>a + b = c</code>, stunning realisations occur rapidly.</li>
        </ul>
    </div>
</article>


<style>

    .skeleton {
        filter: blur(5px);
    }

    article :global(img) {
        max-width: 100%;
    }

    article :global(figure) {
        float: right;
    }

    article :global(figure.full-width) {
        width: 100%;
    }

    article :global(figcaption) {
        text-align: center;
    }

</style>
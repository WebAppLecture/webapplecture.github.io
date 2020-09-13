<script>
    import CodeEditor from './CodeEditor.svelte';
    import SideArticle from './SideArticle.svelte';

    import { onMount } from 'svelte';
    import { getId } from '../utils/id.js';
    import { read } from '../utils/exampleReader.js';

    export let content;
    export let active = false;

    let editors,
        article,
        editorActive = false,
        container,
        id,
        editContainer;

    onMount(() => {
        id = getId("sandbox");
        fetch(content)
        .then(response => response.text())
        .then(text => {
            let src = read(text);
            editors = src.editors;
            article = src.article;
        })
        .then(() => {
            if(active) {
                window.scrollTo(0, container.parentElement.offsetTop);
            }
        });
    });

    function activate() {
        editorActive = true;
        window.addEventListener('click', deactivate)
    }

    function deactivate(e) {
        if(!e.path.includes(editContainer)) {
            window.removeEventListener('click', deactivate);
            editorActive = false;
        }
    }
</script>

<article bind:this={container} data-src={content}>
    {#if article}
    <section>
        <SideArticle {article}></SideArticle>
    </section>
    {:else}
    <section class="filler"></section>
    {/if}
    {#if editors}
    <section bind:this={editContainer} class="code" on:focusin={activate}>
        <CodeEditor {editors} {id} active={editorActive}></CodeEditor>
    </section>
    {:else}
    <section class="filler"></section>
    {/if}
</article>

<style>
    article {
        width: 100%;
        display: flex;
        
    }

    section {
        flex: 1 1 50%;
    }

    .filler {
        flex: 0 1 100px;
    }

    .code {
        min-height: 800px;
    }

    .code > :global(div) {
        height: 46%;
    }
</style>

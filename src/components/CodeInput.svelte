<script>
    import { onMount, afterUpdate } from 'svelte';
	import { Tabs, Tab, TabList, TabPanel } from 'svelte-tabs';
	import CodeFlask from './CodeFlask.svelte';
	export let editors;

	let initialSelectedIndex;
	
	$: {
		initialSelectedIndex = [editors.html, editors.style, editors.script].findIndex(el => el !== "");
	}

	function getDegRng(min, max) {
		let spread = Math.abs(min) + Math.abs(max);
		return Math.random() * spread + min;
	}

</script>
<Tabs {initialSelectedIndex}>
	<TabList>
		<Tab>HTML</Tab>
		<Tab>CSS</Tab>
		<Tab>JS</Tab>
	</TabList>
	<div class="wrapper">
	<TabPanel>
		<CodeFlask bind:code={editors.html} opts={{language: 'html', lineNumbers: true}}></CodeFlask>
	</TabPanel>

	<TabPanel>
		<CodeFlask bind:code={editors.style} opts={{language: 'css', lineNumbers: true}}></CodeFlask>
	</TabPanel>

	<TabPanel>
		<CodeFlask bind:code={editors.script} opts={{language: 'js', lineNumbers: true}}></CodeFlask>
	</TabPanel>
	</div>
</Tabs>

<style>
	.wrapper {
		height: calc(100% - 40px);
	}

	.wrapper :global(.svelte-tabs__tab-panel) {
		height: 100%;
		margin-top: 0 !important;
	}

	.wrapper :global(.svelte-tabs__tab-panel:empty) {
		display: none;
	}

    :global(.svelte-tabs__tab-list) {
        margin-bottom: .5em !important;
	}
	
	:global(.svelte-tabs__tab-list) {
		border: none !important;
	}

</style>
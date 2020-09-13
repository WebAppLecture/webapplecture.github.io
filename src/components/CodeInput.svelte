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
	<div style="--deg1: {getDegRng(-5, 5)}deg; --deg2: {getDegRng(-5, 5)}deg; --deg3: {getDegRng(-5, 5)}deg">
	<TabList>
		<Tab>HTML</Tab>
		<Tab>CSS</Tab>
		<Tab>JS</Tab>
	</TabList>
	</div>
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

	:global(.svelte-tabs__tab) {
		background: black;
		color: white !important;
	}

	:global(.svelte-tabs__tab-list > *:nth-child(1)) {
		transform: rotate(var(--deg1));
		padding-right: 20px;
		padding-left: 30px;
	}

	:global(.svelte-tabs__tab-list > *:nth-child(2)) {
		transform: rotate(var(--deg2));
		padding-right: 25px;
		padding-left: 10px;
	}

	:global(.svelte-tabs__tab-list >*:nth-child(3)) {
		transform: rotate(var(--deg3));
		padding-right: 40px;
		padding-left: 20px;
	}

	:global(.svelte-tabs__selected) {
		background: var(--accent);
		color: var(--highlight) !important;
	}
</style>
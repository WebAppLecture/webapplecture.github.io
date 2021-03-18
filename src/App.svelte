<script>
	import CodeEditor from './components/CodeEditor.svelte';
	import InteractiveArticle from './components/InteractiveArticle.svelte';
	import IntersectionObserver from './components/IntersectionObserver.svelte';

	import { onMount, beforeUpdate } from 'svelte';

	const urlMatcher = new RegExp(/\?(?<title>[^\?]+)(\?(?<article>[^\?]+))?/g);

	let days,
		selectedDay,
		currentArticle,
		intersection = false;

	onMount(() => {
		intersection = false;
		fetch("./content/index.json")
		.then(repsonse => repsonse.json())
		.then(list => {
			days = list;
		})
		.then(() => {
			window.onpopstate = ev => {
				extractSelectionFromUrl(ev.target.location.search);
			}
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
		if(url.match(urlMatcher)) {
			let {title, article} = url.matchAll(urlMatcher).next().value.groups;
			selectedDay = days.find(el => el.title === title) || days[0];
			currentArticle = selectedDay.slides.find(el => el.includes(article.replace(/%20/g," ")));
		} else {
			selectedDay = days[0];
		}
	}

	function onIntersect(article) {
		if(!intersection) {
			return;
		}
		currentArticle = article;
		setSearch(selectedDay.title, currentArticle.split("/")[2].split(".")[0]);
	}

	function setSearch(day, article) {
		window.history.replaceState("", "", "?" + day + "?" + article );
	}

	function selectDay(day) {
		selectedDay = day;
		window.history.pushState("", "", "?" + day.title);
	}

</script>

{#if selectedDay}
	<header>
		<h1>{selectedDay.title}</h1>
		<p>{selectedDay.subtitle}</p>
		<nav>
			{#each days as day}
				<button on:click={() => selectDay(day)} class:selected={day === selectedDay}>{day.title}</button>
			{/each}
		</nav>
	</header>
	<main>
	{#if selectedDay.slides}
		{#each selectedDay.slides as article (article)}
			<IntersectionObserver on:intersect={() => onIntersect(article)} top={-window.innerHeight / 3} bottom={0}>
				<InteractiveArticle content={article} active={article === currentArticle}></InteractiveArticle>
			</IntersectionObserver>
		{/each}
	{/if}
	</main>
	<footer>
		<span>&copy; 2021 Louis Ritzkowski</span>
	</footer>
{/if}
<style>

	main, header, footer {
		max-width: 1000px;
		margin: 0 auto;
	}

	header {
		width: 100%;
		padding: 1em;
	}

	header > nav {
		display: flex;
		flex-wrap: wrap;
	}

</style>
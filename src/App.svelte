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
		<span>&copy; 2020 Louis Ritzkowski</span>
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
		background-image: url('data:image/svg+xml;charset=UTF-8,<svg xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" viewBox="0 0 100 100"><polygon fill="turquoise" points="0 0 75 35 80 75 75 80 73 45"/><polygon fill="purple" points="0 100 100 100 80 13 0 0 75 35 80 75"/></svg>'); 
	}

	header > h1 {
		transform: rotate(-5deg);
	}

	header > p {
		transform: translateY(-20px) rotate(-5deg);
	}

	header > nav {
		transform: rotate(-5deg);
		display: flex;
		flex-wrap: wrap;
	}

	header > nav > button {
		background: black;
		color: white;
		border: none;
		border-radius: 0;
		margin: 5px;
		text-transform: capitalize;
	}

	header > nav > button.selected {
		background: var(--accent);
		color: var(--highlight);
		border: none;
	}

	footer {
		height: 200px;
		
		background-image: url('data:image/svg+xml;charset=UTF-8,<svg xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" viewBox="0 0 100 100"><polygon fill="turquoise" points="30 50 15 50 16 70 50 100 30 25 0 0"/><polygon fill="purple" points="0 0 100 0 50 100 15 50 30 25"/></svg>'); 
		background-size: 100% 100%;
		color: var(--accent);
	}

	footer > span {
		display: inline-block;
		text-align: center;
		width: 100%;
	}

	main > :global(div > article){
		display: flex;
		flex-direction: row;
	}

	main > :global(div > article > section) {
		padding: 50px 20px;
	}

	main > :global(div:nth-of-type(2n) > article > *:nth-child(2n-1)) {
	  background-image: url('data:image/svg+xml;charset=UTF-8,<svg xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" viewBox="0 0 100 100"><polygon fill="turquoise" points="0 1 0 0 100 0 100 15"/><polygon fill="purple" points="0 0 100 0 100 10"/><polygon fill="purple" points="0 100 100 100 100 90"/><polygon fill="purple" points="100 0 100 100 96 100"/></svg>'); 
	  background-size: 100% 100%;
	}

	main > :global(div:nth-of-type(2n) > article > *:nth-child(2n)) {
		background-image: url('data:image/svg+xml;charset=UTF-8,<svg xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" viewBox="0 0 100 100"><polygon fill="purple" points="0 0 100 0 98 30 100 100 0 100"/></svg>'); 
		background-size: 100% 100%;
	}


	main > :global(div:nth-of-type(2n-1) > article > *:nth-child(2n-1)) {
		background-image: url('data:image/svg+xml;charset=UTF-8,<svg xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" viewBox="0 0 100 100"><polygon fill="purple" points="0 0 100 0 100 100 0 100 2 80"/></svg>'); 
		background-size: 100% 100%;
		color: var(--accent);
	}

	main > :global(div:nth-of-type(2n) > article > *:nth-child(2n) .sandbox-wrapper ) {
		border-color: var(--accent);
	}

	main > :global(div:nth-of-type(2n-1) > article > *:nth-child(2n)) {
	  background-image: url('data:image/svg+xml;charset=UTF-8,<svg xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" viewBox="0 0 100 100"><polygon fill="orangered" points="0 0 100 0 98 1 0 13"/><polygon fill="purple" points="0 0 100 0 0 10"/><polygon fill="purple" points="0 100 100 100 0 90"/><polygon fill="purple" points="0 0 0 100 3 0"/></svg>'); 
	  background-size: 100% 100%;
	}



	h1 {
		color: #ff3e00;
		text-transform: uppercase;
		font-size: 4em;
		font-weight: 100;
	}


</style>
export let test = `
<style>
.test {
    color: orange;
}
</style>
<div class="test"></div>
<script>
let a = document.querySelector(".test");
a.innerHTML = "Hello World";
gg
</script>
`;
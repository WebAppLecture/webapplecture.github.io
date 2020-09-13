export function read(src) {
    let parts = src.split("<!-- Code -->"),
        article = parts[0],
        code = parts[1],
        result = {};

    result.article = article;
    if(code) {
        result.editors = {
            style: isolate(code, "<style>", "</style>"),
            script: isolate(code, "<script>", "</script>"),
            html: isolate(code, "<html>", "</html>"),
        }
    } 
    return result;
}

export function glue(codeObj) {

    return `
<style>
    body { background: white; }
    ${codeObj.style}
</style>
${codeObj.html}
<script>
window.onerror = function() {
    window.parent.postMessage({message: arguments[0], lineNumber: arguments[2] - 1, columnNumber: arguments[3], id: id}, '*');
    return true;
}
</script>
<script>
${preprocessJS(codeObj.script)}
</script>
`;
}

function isolate(string, start, end) {
    if(string.includes(start) && string.includes(end)) {
        return string.slice(string.indexOf(start) + start.length, string.indexOf(end)).trim();
    } else {
        return "";
    }
}

function preprocessJS(code) {
    //code = code.replace(/`/g, '\\`');
    return code;
}
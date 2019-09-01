class HtmlCodeEditor {

    constructor(selector) {
        this.buildInterface(selector.querySelector(".container"));

        let source = selector.querySelector(".source"),
            cssSource = selector.querySelector(".css-source"),
            editor = selector.querySelector(".editor"),
            reset = editor.parentNode.querySelector(".uprightTitle"),
            css = selector.querySelector(".css"),
            output = selector.querySelector(".output"),
            defaultContent = this.trimCode(this.prepareInput(source.innerHTML)),
            defaultCss = this.trimCode(this.prepareInput(cssSource.innerHTML));

        editor.value = defaultContent;
        css.value = defaultCss;
        this.update(selector, css, editor, output);

        editor.addEventListener('keydown', this.onKeydown);
        css.addEventListener('keydown', this.onKeydown);
        editor.addEventListener('input', this.update.bind(this,selector,css,editor,output));
        css.addEventListener('input', this.update.bind(this,selector,css,editor,output));
        reset.addEventListener('click', function() {
            editor.value = defaultContent;
            css.value = defaultCss;
        });
    }

    buildInterface(selector) {
        let input = this.getFrame("CSS", "CSS", "textarea"),
            editor = this.getFrame("Editor", "Reset", "textarea"),
            output = this.getFrame("Output", "Output", "div");

        selector.appendChild(input);
        selector.appendChild(editor);
        selector.appendChild(output);
    }

    getFrame(name, titleText, fieldType) {
        let frame = document.createElement("div"),
            title = document.createElement("span"),
            text = document.createElement(fieldType);
        title.classList.add("uprightTitle");
        title.innerText = titleText;
        frame.classList.add("colorFrame");
        text.classList.add(name.toLowerCase());
        text.contentEditable = true;
        text.spellcheck = false;
        text.title = name;
        frame.appendChild(title);
        frame.appendChild(text);
        return frame;
    }

    update(selector, css, editor, output) {
        let scopedCss = this.scopeCss(css.value, selector.id);
        output.innerHTML = scopedCss;
        output.innerHTML += editor.value;
    }

    onKeydown(e) {
        if(e.key === "Tab") {
            e.preventDefault();
            let s = this.selectionStart;
            this.value = this.value.substring(0,this.selectionStart) + "\t" + this.value.substring(this.selectionEnd);
            this.selectionEnd = s+1;
        }
    }

    trimCode(source) {
        let lines = source.split("\n"),
            indentOffset,
            offsetSet;
        for(let line in lines) {
            if(lines[line] !== "" && !offsetSet) {
                indentOffset = lines[line].length - lines[line].trimLeft().length;
                offsetSet = true;
            }
            lines[line] = lines[line].substring(indentOffset, lines[line].length);
        }
        let trimmedLines = lines.filter(function(line) {
            return line !== "";
        });
        return trimmedLines.join("\n");
    }

    prepareInput (source) {
        return source.replace("<!--","").replace("-->","");
    }

    scopeCss(css, id) {
        let cssSplitter = new RegExp("[\{\}]"),
            splitCss = css.split(cssSplitter),
            scopedCss = "<style>";

        for ( let i = 0; i < splitCss.length; i++ ) {
            if ( i%2 === 0 ) {
                scopedCss += "#" + id + " .output " + splitCss[i] + " {";
            } else {
                scopedCss += splitCss[i] + "}";
            }
        }

        return scopedCss += "</style>";
    }
}
class JsCodeEditor {

    constructor(selector) {
        this.buildInterface(selector.querySelector(".container"));

        let source = selector.querySelector(".source"),
            editor = selector.querySelector(".editor"),
            trigger = editor.parentNode.querySelector(".uprightTitle"),
            input = selector.querySelector(".input"),
            colorFrame = selector.querySelector(".colorFrame:nth-child(3)");

        this.output = selector.querySelector(".output");

        editor.value = this.trimCode(source.textContent);
        this.editableFunction = (new Function("return " + editor.value)()).bind(editor, input, this.output);
        trigger.addEventListener('click', this.onTriggerClick.bind(this));
        editor.addEventListener('keydown', function (e) {
            if(e.key === "Tab") {
                e.preventDefault();
                let s = this.selectionStart;
                this.value = this.value.substring(0,this.selectionStart) + "\t" + this.value.substring(this.selectionEnd);
                this.selectionEnd = s+1;
            }
        });
        editor.addEventListener('input', (function () {
            console.log("input");
            trigger.removeEventListener('click', this.onTriggerClick.bind(this));
            try {
                this.editableFunction = (new Function("return " + editor.value)()).bind(editor, input, this.output);
                colorFrame.classList.remove('error');
                trigger.innerText = "Run Code";
                editor.classList.remove('error');
                console.log('try');
            } catch (err) {
                colorFrame.classList.add('error');
                trigger.innerText = "Error!";
                editor.classList.add('error');
                console.log('catch');
            }
        }).bind(this));
    }

    onTriggerClick() {
        let returnValue = this.editableFunction()
        if(returnValue !== undefined) {
            this.output.value = returnValue;
        } 
    }

    buildInterface(selector) {
        let input = this.getFrame("Input", "Input"),
            editor = this.getFrame("Editor", "Run Code"),
            output = this.getFrame("Output", "Output");

        selector.appendChild(input);
        selector.appendChild(editor);
        selector.appendChild(output);
    }

    getFrame(name, titleText) {
        let frame = document.createElement("div"),
            title = document.createElement("span"),
            text = document.createElement("textarea");
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
}
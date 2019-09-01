<article><h2>JavaScript Timers</h2>
    <ul>
    <li>Wie genau funktioniert das mit den <code>n</code> Frames bei den Animationen? Durch <strong>Timers</strong>! Grob: T / 13 = n</li>
    <li>T ist hier die angegebene Zeit in <i>ms</i> durch 13 <i>ms / frame</i> ist die Zeit pro Frame (Standard in jQuery<sup>1</sup>)</li>
    <li>Welche Möglichkeiten haben wir?<div id="testbox" class="inline-hide" style="height:30px;width:80px;background-color:#0F0;border:1px solid #00F;font-size:8pt;line-height:140%;text-align:center;">Over: Startet<br>Click: Beendet</div>
    <ul>
    <li><code>setInterval()</code> zum Starten einer Schleife und <code>clearInterval()</code> zum Stoppen
    <pre lang="javascript">var ms; //Variable zum Merken der Intervallschleife
    function start() { if(!ms) ms = setInterval(move, 100); }//Startet das Intervall falls nicht schon gestartet (mit einem Callback und der Zeit in ms)
    function stop() { clearInterval(ms); ms = null; }//Stoppt das Intervall, Reset von ms
    function move() { $('#testbox').css('margin-left', "+=2px"); }//Bewegt die Box (alle 100ms) um 2px
    </pre>
    </li>
    <li><code>setTimeout()</code> zum Starten einer Einmalverarbeitung und <code>clearTimeout()</code> zum Stoppen <span id="jstimerex" class="hide" style="color:orange;font-size:11pt;font-weight:bold;">noch 10 s</span>
    <pre lang="javascript">var t = 11;//10 Sekunden (dekrementieren vor der Verzweigung)
    $(timer);//Soll sofort (mit jQuery.ready()) starten
    function timer() {
        $('#jstimerex').text('noch ' + (--t) + ' s');//Ausgabe
        if(t) setTimeout(timer, 1000); else alert('Timer abgelaufen!'); }//Erneut oder Alert?
    </pre>
    </li>
    </ul>
    </li>
    </ul>

    <!--läd die jQuery Funktionalität / oder nicht-->
    <script src="scripts/loadjquery.js"></script>
    <script>
    $(function() {
        var ms;
        var t = 11;
        $(timer);
        function timer() {
        //Erste Zeile hier dient nur dazu dass die Alert Box nicht auf anderen Folien auftaucht!
            if(!$('#jstimerex').filter(':visible').length) return;
            $('#jstimerex').text('noch ' + (--t) + ' s');
            if(t) setTimeout(timer, 1000); else alert('Timer abgelaufen!');
        }
        function start() {
            if(!ms) ms = setInterval(move, 100);
        }
        function stop() {
            clearInterval(ms); ms = null;
        }
        function move() {
            $('#testbox').css('margin-left', "+=2px");
        }

        $('#testbox').mouseover(start).click(stop);
    });
    </script>

</article>
$( document ).ready(function(){

    $('#Day1Button').click(function(){getExercisesForDay(1)});
    $('#Day2Button').click(function(){getExercisesForDay(2)});
    $('#Day3Button').click(function(){getExercisesForDay(3)});
    $('#Day4Button').click(function(){getExercisesForDay(4)});
    $('#Day5Button').click(function(){getExercisesForDay(5)});
    $('#FadeBackground').hide();
    $('#LoadingScreen').hide();
    $('#hideSolution').click(function(){$('#FadeBackground').hide();});

    var p = new TeXParser();
    //parses the tex files to HTML --> adds the right tags
    var parseExercise = function(ExerciseTexText){
        p.setTex(ExerciseTexText);
        return p.parse();
    }

    var showSolution = function(DayNumber, ExerciseNumber,showText)
    {
        $.get('https://raw.githubusercontent.com/WebAppLecture/Exercises.Day'+ DayNumber+'/master/Solutions/Aufgabe'+ExerciseNumber+'.html', function(data){

            if(showText)
                $('#TextInput').text(data);
            else
               $('#solutionExplorer').html(data); 
            $('#FadeBackground').show();
        }).fail(function(){
            $('#TextInput').html('Oha\nDa ist wohl was schief gelaufen\nIch konnte die gesuchte Lösung leider nicht finden. Probieren Sie es bitte später noch einmal.\nFalls das auch nicht hilft, können Sie die Lösung normalerweise unter\nhttps://raw.githubusercontent.com/WebAppLecture/Exercises.Day'+
                 DayNumber+'/master/Solutions/Aufgabe'+ExerciseNumber+'.html finden.'); 
            $('#FadeBackground').show();
        });
        
    }


    //expects DayNumber e.g. 1 and Array of "Exercises/XY-Name"
    var loadExercises = function(DayNumber, ExerciseNameArray)
    {
        HowMany = ExerciseNameArray.length;
        counter = 0;
        FormattedText = [];

        //set Path to Image files (omit /Exercises/Figures/ because it is already in the Url of the includegraphics)
         p.setImagePath('https://raw.githubusercontent.com/WebAppLecture/Exercises.Day'+DayNumber+'/master/');

        var StringContainer = {};
        $.each(ExerciseNameArray, function(i,v){
             $.get('https://raw.githubusercontent.com/WebAppLecture/Exercises.Day'+DayNumber+'/master/'+v+'.tex', 
                function(data) {
                counter = counter+1;
                StringContainer[v] = data; //have to do some tricks to reconstruct the right order of exercises
                if(counter == HowMany) 
                {
                   var d;
                   $.each(ExerciseNameArray,function(i,v2){
                        d = $('<div>').html(parseExercise(StringContainer[v2])).css('width','100%').css('font-size','12pt')
                                .append($('<button>').attr('class','FancyButton2').click(function(){
                                                                                                window.open('https://github.com/WebAppLecture/Exercises.Day'+DayNumber+'/raw/master/Sheet'+DayNumber+'.pdf');
                                                                                                }).text('PDF (github)'))
                                .append($('<button>').attr('class','FancyButton2').click(function(){   
                                                                                                if(smallCalculation()) 
                                                                                                    window.open('https://github.com/WebAppLecture/Exercises.Day'+DayNumber+'/blob/master/Solutions/Aufgabe'+ v2.split('/')[1].split('-')[0] + '.html');
                                                                                                }).text('Lösung (github)'))
                                .append($('<button>').attr('class','FancyButton2').text("Lösung (Inline)").click(function(){   
                                                                                                                            if(smallCalculation())
                                                                                                                                showSolution(DayNumber,v2.split('/')[1].split('-')[0],true);
                                                                                                                            }));
                        
                        //Add exercise number to the header tag of the parsed div
                        var ex = d.children().filter('.RequiredExercise') 
                        if(ex.length != 0)
                        {
                            ex.html(v2.substr(10, 2)+". "+ex.html());
                        }
                        else
                        {
                            ex = d.children().filter('.Exercise') 
                            if(ex.length != 0)
                            {
                                ex.html(v2.substr(10, 2)+". "+ex.html());
                            }
                        }
                        
                       
                        //empty the content at the first time, to remove the spinner
                        if(i == 0)
                            $('#content').empty();

                        $('#content').append(d);
                   });
                }         
                }).fail(function(){$('#content').empty().append($('<div>').html("<h1>Entschuldigung</h1> <p>Die Aufgaben konnten nicht geladen werden. Versuchen Sie es bitte später noch einmal oder laden Sie das PDF direkt von hier: </p>")
                                    .append($('<a>').attr('href','https://raw.githubusercontent.com/WebAppLecture/Exercises.Day'+DayNumber+'/master/Sheet'+DayNumber+'.pdf')
                                        .text('Link zum PDF auf github')));});
        });
       

    }

    var extractExercisesFromTexFile = function(data)
    {
        var text = data+"hallo";
        //Search for Files that start with "Exercises/"
        var cutString = text.replace(/[{}]/g,' ').split(' ');
        exercises = [];
        $.each(cutString, 
            function(i,v){
                if(v.indexOf('Exercises/') != -1)
                    exercises.push(v);
            });

            return exercises;
    }

    //expects "1" for Day1, 2 for day 2 and so on
    var getExercisesForDay = function(Day){
         $('#content').empty().append($('<img>').attr('src','loader.gif')).append($('<div>').text("Bitte warten Sie einen Moment. Ich lade gerade die benötigten Dateien herunter und übersetze sie in HTML, das könnte eine Weile dauern.").css('width','100%')) //Please wait, while I get the necessary files and translate them to HTML. This might take me a while.
        $.get('https://raw.githubusercontent.com/WebAppLecture/Exercises.Day'+Day+'/master/Sheet'+Day+'.tex', 
                function(data) {
                 return  loadExercises(Day,extractExercisesFromTexFile(data));              
                }).fail(function(){
                    $('#content').empty()
                    .append( $('<div>').html("<h1>Entschuldigung</h1> <p>Die Aufgaben konnten nicht geladen werden. Versuchen Sie es bitte später noch einmal oder laden Sie das PDF direkt von hier:<p>").append($('<a>').attr('href','https://raw.githubusercontent.com/WebAppLecture/Exercises.Day'+Day+'/master/Sheet'+Day+'.pdf').text('Link zum PDF auf github')))
                    ;});;
    }

    var smallCalculation = function()
    {
        var x1 = Math.floor(Math.random()*10);
        var x2 = Math.floor(Math.random()*10);
        var x3 = Math.floor(Math.random()*10);

        var inp = prompt('Bitte Lösen Sie die folgende Aufgabe:\n('+x1+'+'+x2+')*'+x3 +' =', 'Ihre Eingabe');
        if(inp == (x1*1+x2*1)*1*x3)
            return true;
        else 
        {
            alert('Leider falsch! Richtig wäre '+(x1*1+x2*1)*1*x3+' gewesen.');
            return false;
        }
            
    }
})

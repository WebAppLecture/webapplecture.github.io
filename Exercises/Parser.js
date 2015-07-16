/* 
 * TeXParser JavaScript Class v1.0.0
 *
 * Copyright 2015, Markus A. Huber
 * Released under the MIT license
 * 
 * Date: 2015-07-16T21:28Z
 * --------------------------------------------------------------------------------
 *
 * The MIT License (MIT)
 * 
 * Copyright (c) 2015 Markus A. Huber
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 * 
 */


 /*
 * IMPORTANT NOTES
 * ===============
 * 
 * This project was designed to translate short exercise sheets from LaTeX to  
 * HTML on-the-fly. It therefore only includes a limited subset of replaced 
 * LaTeX Symbols, which were necessary for this purpose. 
 * Additionally, it makes heavy use of regular expressions, which might for
 * larger LaTeX-input reduce the performance of the code. 
 * Thus, for larger projects you should consider a more "classical" approach  
 * using a scanner/lexer and a parser.
 */
function TeXParser()
{
    //Path to images whenever they are hosted on a different server
    var ImagePath = "";

    //Path to all images 
    this.setImagePath = function(Url)
    {
        ImagePath = Url;
    }

    //this is the main variable! Here is the text from beginning to the end stored and modified
    var t = "";

    //set the Text before parsing
    this.setTex = function(Text) {
        //if it already contains < or > we have to escape those
        t = Text.replace(/\</g,"&lt;").replace(/\>/g,"&gt;")
    };

        //make it a little less to write, because this comes very often!
        cs = '</span>';
        span = function(text) {return '<span class="'+text+'">'}; 
        

        //here are the LaTeX-Environments defined including how they are replaces at \begin and \end
        Environments = {
            itemize : ['<ul>', '</ul>'],
            equation : [span('equation'), cs],
            eqnarray : [span('equation'), cs],
            figure : [span('figure'), cs],
            lstlisting : [span('lstlisting'),cs]

        }

        //here is the definition of the usual tags \emph{...} and what should happen at the beginning and end. There are 2 specifications: 
        //1. only string -> replace word by this string
        //2. function (stardIndex, endIndex) returns the string to include but can be used to do intermediate calculations
        //please note that the code currently is case-sensitive, as the input was known at creation of the program.
        KeyMapping = {
            begin : function(startInd, endInd) {
                var name = t.substring(startInd+1, endInd);
                //alert(Environments[name][0]);
                if(Environments[name] !== undefined)
                    return Environments[name][0];
                else
                    return '';
            },
            end : function(startInd, endInd) {
                var name = t.substring(startInd+1, endInd);
                //alert(name);
                if(Environments[name] !== undefined)
                    return Environments[name][1];
                else
                    return '';
            },
            input : function(startInd, endInd){ //This is only doable in my specific case, where I konw that I don't include any other tex files only! tikz files where I have the original pngs as well
                return '<img class="TexImg" src="'+ ImagePath + t.substring(startInd+1, endInd).replace(/.tex/g,'.png').replace(/\[\s*[a-zA-Z\\]*\s*=\s*[0-9.]*\s*\**\s*[a-zA-Z\\]*\s*\]/g, '') ;
            },
            input_Close: '" alt="Image not found" width="100%">',
            emph :                      '<b>', 
            emph_Close:                 '</b>',
            RequiredExercise :          span('RequiredExercise'),
            RequiredExercise_Close :    cs,
            Exercise :                  span('Exercise'),
            Exercise_Close :            cs, 
            htag:                       span('htag'),
            htag_Close: cs,
            jfunc: span('jfunc'),
            jfunc_Close: cs,
            jTag: span('jTag'),
            jTag_Close: cs,
            footnote: span('footnote'),
            footnote_Close: cs,
            url:span('url'),
            url_Close:cs,
            jkey:span('jkey'),
            jkey_Close: cs,
            jvar:span('jvar'),
            jvar_Close:cs,
            footnote:span('footnote'),
            footnote_Close:cs,
            Dollar: '<i>',
            Dollar_Close: '</i>',
            Remark: span('remark'),
            Remark_Close: cs,
            qty: span('qty'),
            qty_Close: cs,
            includegraphics: function(startInd, endInd) {
                return '<img class="TexImg" src="'+ ImagePath + t.substring(startInd+1, endInd).replace(/\[[a-zA-Z\\]*\]/g, '') ; 
            },
            includegraphics_Close: '" alt="Image not found" width="100%">',
            caption: '<figcaption>',
            caption_Close: '</figcaption>',
            label: '<span style="display: none">',    //just hide labels and refs
            label_Close: cs,
            ref: '?<span style="display: none">',
            ref_Close: cs,
            url : function(startInd, endInd){
                return '<a href="'+t.substring(startInd+1, endInd)+ '">'+ t.substring(startInd+1, endInd)+ '</a>';}, 
            url_Close : '',
            SimplyABracket : '{',
            SimplyABracket_Close : '}',
            vspace : function(startInd, endInd){
                return '';}, 
            vspace_Close : ''
        }

        //Single replacements for \item, \par and so on - include your math symbols here!
        SingleReplacements = [
            {key: '\\\\par' , value: '<p>'}, //make use of dirty but valid HTML5 specification where the <p> and <li> tags will be closed automatically
            {key: '\\\\item' , value: '<li>'},
            {key: '\\\\begin' , value: ''},
            {key: '\\\\end' , value: ''},

            {key: '\\\\sqrt', value: '&#8730;'},
            {key: '\\\\degree', value: '°'},
            {key: '\\\\infty', value: '&#8734;'},

            {key: '\\\\cdot', value: '&#8901;'},
            {key: '\\\\cdots', value: '&#8901;...&#8901;'},
            {key: '\\\\equiv', value: '&equiv;'},
            {key: '\\\\prod', value: '&Pi;'},
            {key: '\\\\sum', value: '&Sigma;'},
            {key: '\\\\allowbreak', value: ''}, 
            {key: '\\\\textbar', value: '|'},
            {key: '\\\\small', value: ''},
            {key: '\\\\centering', value: ''},   
        ]

        //get all Geek letters
        var Greeks = ['Alpha','Beta','Gamma', 'Delta', 'Epsilon', 'Zeta', 'Eta', 'Theta', 'Iota', 'Kappa', 'Mu', 'Nu', 'Xi', 'Omicron', 'Pi', 'Rho', 'Sigma', 'Upsilon', 'Phi', 'Chi', 'Psi', 'Omega'];
            
        //make their escape characters
        for (var i = Greeks.length - 1; i >= 0; i--) {
                 SingleReplacements.push({key: '\\\\'+Greeks[i], value: '&'+Greeks[i]+';'});
                 SingleReplacements.push({key: '\\\\'+Greeks[i].toLowerCase(), value: '&'+Greeks[i].toLowerCase()+';'});
                };    	

        //here the changes that have to be done will be stored
        var ChangeLogArray = [];
 
        var MarriedBrackets = {}; //contains matched bracket indizes eg [2,3], [7,12]
        var unmarriedOpenBrackets = []; //saves (yet) unmarried brackets
        var IndexesOpenBracket = []; //saves indexes of open brackets (probably not needed - lets see) 
        //the same for $ signs which will be replaced by <span class='math'></span>
        var IndexLastDollar = [];
        var MarriedDollars =[];

        this.parse = function(){
            ChangeLogArray = [];
             //lets start by matching all brackets 
            MarriedBrackets = {}; //contains matched bracket indizes eg [2,3], [7,12]
            unmarriedOpenBrackets = []; //saves (yet) unmarried brackets
            IndexesOpenBracket = []; //saves indexes of open brackets (probably not needed - lets see)
            //e same for $ signs which will be replaced by <span class='math'></span>
            IndexLastDollar = [];
            MarriedDollars =[];

            //match all curly brackets and dollars
            for(var i = 0; i<t.length; i++)
            {
            	if(t[i] == '{')
            	{
            		 if(t[i-1] != '\\')
                    {
            		IndexesOpenBracket.push(i);
            		unmarriedOpenBrackets.push(i);
                    }
            	}
            	if(t[i] == '}')
            	{
            		 if(t[i-1] != '\\')
                    {
            		MarriedBrackets[unmarriedOpenBrackets.pop()] = i; //changed to have a dictionary of closingbrackets as function of openingbrackets - will be used below to set the closing tags properly.
            	   }
                }
               
            	if(t[i] == '$')
            	{
            		if(IndexLastDollar.length == 0)
            			IndexLastDollar.push(i);
            		else
            			MarriedDollars.push([IndexLastDollar.pop(),i]);
            	}


            }
            //Soft Error if matching didn't work
            if(unmarriedOpenBrackets.length>0)
            {
            	console.log('Bracket matching did not work! There are'+ unmarriedOpenBrackets.length + ' open brackets left!');
            }
            //Soft error when dollars don't match
            if(IndexLastDollar.length>0)
            {
            	console.log('Dollar matching did not work! There are'+ IndexLastDollar.length + ' dollars left!');
            }


            

            //now split the text and look if there is a \whatever{} before
            //take care of _{} ^{} \emph{} \RequiredExercise{}, \Exercise{} as well as \begin{itemize/figure/equation...}
            var temp, phrase, keyword, newKey;
            for(var j= 0; j<IndexesOpenBracket.length;j++)
            {
            	temp = t.substring(0,IndexesOpenBracket[j]).split(/[\s\n]/g); //get rid of all [\textwidth = 1 * \textlength] o.ä.
                //alert(temp)
            	for (var i = temp.length - 1; i >= 0; i--) {
            		if(temp[i] != "")
            		{
            			phrase = temp[i].replace(/\[[\sa-zA-Z0-1\\*=]*\]/g,'').match(/\\[a-zA-Z]+/g);
            			if(phrase != null && phrase.length  != 0)
            			{
            				keyword = phrase[phrase.length-1];
                            
            				ChangeLogArray.push({   index : IndexesOpenBracket[j], 
                                                    key : keyword.replace('\\',''), 
                                                    closingIndex: MarriedBrackets[IndexesOpenBracket[j]]*1});	
                            //add another entry at the end of the bracket, which will then use Keyword_Close and close the tags
                            ChangeLogArray.push({   index : MarriedBrackets[IndexesOpenBracket[j]], 
                                                    key : keyword.replace('\\','')+ '_Close', 
                                                    closingIndex: IndexesOpenBracket[j]}); 
                            break;
                            
            			}
                        else
                        {
                            ChangeLogArray.push({   index : IndexesOpenBracket[j], 
                                                    key : 'SimplyABracket', 
                                                    closingIndex: MarriedBrackets[IndexesOpenBracket[j]]*1});   
                            //add another entry at the end of the bracket, which will then use Keyword_Close and close the tags
                            ChangeLogArray.push({   index : MarriedBrackets[IndexesOpenBracket[j]], 
                                                    key : 'SimplyABracket_Close', 
                                                    closingIndex: IndexesOpenBracket[j]}); 
                            break;
                        }
            		}
            	};
            }
            //Now add all the $..$ cases accordingly
            for(var j= 0; j<MarriedDollars.length;j++)
            {
                ChangeLogArray.push({index : MarriedDollars[j][0], key : 'Dollar' , closingIndex: MarriedDollars[j][0]*1+1}); 
                ChangeLogArray.push({index : MarriedDollars[j][1], 
                                                    key : 'Dollar_Close', 
                                                    closingIndex: MarriedDollars[j][1]*1+1});
            }

            //sort all changes for their index (to be able to work through them from the end without destroyin the index-matching for other tags)
            var SortedChanges = ChangeLogArray.sort(function(a,b) {return (a.index*1 - b.index*1);});

            //now run through the loop from the end and fix all tags
            for (var i = SortedChanges.length - 1; i >= 0; i--) {
                if(typeof KeyMapping[SortedChanges[i].key] === 'function') //call functions, if functions are provided
                {
                     t = t.substring(0,SortedChanges[i].index*1) + ' '+ (KeyMapping[SortedChanges[i].key](SortedChanges[i].index*1,SortedChanges[i].closingIndex*1)|| '') + t.substring(SortedChanges[i].closingIndex*1) ;   
                }
                else //in other case, replace words
                {
                    t = t.substring(0,SortedChanges[i].index*1) + ' '+ (KeyMapping[SortedChanges[i].key]|| '') + t.substring(SortedChanges[i].index*1+1) ;
                }
            };

            //now replace all single things like \item, \alpha,...
            for (var i = SingleReplacements.length - 1; i >= 0; i--) {
                t = t.replace(new RegExp(SingleReplacements[i].key,'g'), SingleReplacements[i].value); 
            };

            // now get rid of all the tags from before the parenthesis, take simply all tags from the KeyMapping, add an initial \ and replace them
            for (var keyw in KeyMapping) {
                if (KeyMapping.hasOwnProperty(keyw)) {
                        t = t.replace(new RegExp('\\\\'+keyw,'g'), ''); 
                }
            }

            //Make some final adjustments to clear all mess that is still left 
            t = t.replace(/\\\\/g,'<br>') //replace \\ by <br>
                    .replace(/\\{/g,'{') //replace \{ by {
                    .replace(/\\}/g,'}') //replaces real brackets by real html brackets
                    .replace(/\s\/\//g,'<br>') //repace // by <br> but not when there is no space before (if not http://www ... gets removed)
                    .replace(/\s%/g, '') //remove comments
                    .replace(/\\%/g,'%') //make the "real" % signs that are no comments to real %-signs in html
                    .replace(/\[!h\]/g,'') //kills figure placements
                    .replace(/\[\s*[a-zA-Z\\]*\s*=\s*[0-9.]*\s*\**\s*[a-zA-Z\\]*\s*\]/g,''); //takes care of [\textwidht = x.y \linewidth] and others like that
            //finally return the parsed result
            return t;
        }

}
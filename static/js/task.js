/*
 * Requires:
 *     psiturk.js
 *     utils.js
 *     recorder_utils.js
 */

// Initalize psiturk object
var psiTurk = new PsiTurk(uniqueId, adServerLoc, mode);

var mycondition = condition;  // these two variables are passed by the psiturk server process
var mycounterbalance = counterbalance;  // they tell you which condition you have been assigned to
// they are not used in the stroop code but may be useful to you

// All pages to be loaded
var pages = [
	"instructions/instruct-1.html",
	"instructions/instruct-2.html",
	"instructions/instruct-3.html",
	"instructions/instruct-ready.html",
	"stage.html",
	"postquestionnaire.html"
];

psiTurk.preloadPages(pages);

var instructionPages = [ // add as a list as many pages as you like
	"instructions/instruct-1.html",
	"instructions/instruct-2.html",
	"instructions/instruct-3.html",
	"instructions/instruct-ready.html"
];


/********************
* HTML manipulation
*
* All HTML files in the templates directory are requested 
* from the server when the PsiTurk object is created above. We
* need code to get those pages from the PsiTurk object and 
* insert them into the document.
*
********************/

/********************
* STROOP TEST       *
********************/
var StroopExperiment = function() {
    var query;
    var element;

	var wordon, // time word is presented
	    listening = false,
            trialId;
    var conds = Math.round(Math.random());
    if (conds == 0){
        var stims = [
			["Criterion: Words that begin with the letter F", "blue", "letter", "1F"],
			["Criterion: Names of any living or non-living things (Nouns)", "red", "animal", "2A"],
			["Criterion: Actions that involve your body movement (Verbs)", "blue", "verb", "3V"],
			/*["RED", "red", "congruent", "4"],
			["GREEN", "green", "congruent", "5"],
			["BLUE", "blue", "congruent", "6"],
			["GREEN", "red", "incongruent", "7"],
			["BLUE", "green", "incongruent", "8"],
			["RED", "blue", "incongruent", "9"]*/
		];
    }
    else{
        var stims = [
			["Criterion: Words that begin with the letter F", "blue", "letter", "1F"],
			["Criterion: Actions that involve your body movement (Verbs)", "red", "verb", "2V"],
			["Criterion: Names of any living or non-living things (Nouns)", "blue", "animal", "3A"],
			/*["RED", "red", "congruent", "4"],
			["GREEN", "green", "congruent", "5"],
			["BLUE", "blue", "congruent", "6"],
			["GREEN", "red", "incongruent", "7"],
			["BLUE", "green", "incongruent", "8"],
			["RED", "blue", "incongruent", "9"]*/
		];
        
    }
	// Stimuli for a basic Stroop experiment
	
	//stims = _.shuffle(stims);

	var next = function() {
		if (stims.length===0) {
			finish();
		}
		else {
                  //start recording (this may not happen immediately hence starting with it
                        //recorder.record();
			stim = stims.shift();
			show_word( stim[0], stim[1] );
                  //play 250msec cue to identify start of recording
                        //playCue(0.250);
			wordon = new Date().getTime(); //this should probably be in a call back, why did they write the code like this?
			//listening = true;
            trialId = stim[3];
            startRecord.disabled = false;
            startRecord.onclick = e => {
            listening = true;
            startRecord.disabled = true;
            //stopRecord.disabled=false;
            audioChunks = [];
            recorder.record();
            countdown( "countdown", 1, 01 );
            }
			query=d3.select("#query").html('<p id="prompt">   </p>');
		}
	};
    
    var countdown = function( elementName, minutes, seconds ){
    var  endTime, hours, mins, msLeft, time;

    function twoDigits( n )
    {
        return (n <= 9 ? "0" + n : n);
    }

    function updateTimer()
    {
        msLeft = endTime - (+new Date);
        if ( msLeft < 1000 ) {
            element.innerHTML = "Countdown's over! <br>Please press '<Strong>Space</Strong>' key on your keyboard to continue.";
            startRecord.disabled = true;
            recorder.stop();
            //listening = false;
            
        } else {
            time = new Date( msLeft );
            hours = time.getUTCHours();
            mins = time.getUTCMinutes();
            element.innerHTML = (hours ? hours + ':' + twoDigits( mins ) : mins) + ':' + twoDigits( time.getUTCSeconds() );
            setTimeout( updateTimer, time.getUTCMilliseconds() + 500 );
        }
    }

    element = document.getElementById( elementName );
    endTime = (+new Date) + 1000 * (60*minutes + seconds) + 500;
    updateTimer();
};
	
	var response_handler = function(e) {
		if (!listening) return;

		var keyCode = e.keyCode,
			response;

		switch (keyCode) {
			case 32:
				// "Space"
				response="red";
				break;
			case 71:
				// "G"
				response="green";
				break;
			case 66:
				// "B"
				response="blue";
				break;
			default:
				response = "";
				break;
		}
		if (response.length>0) {
			listening = false;
			var hit = response == stim[1];
                        //this should be collected at the start of the function to avoid mis-timings
			var rt = new Date().getTime() - wordon;
            element.innerHTML = "";

			query=d3.select("#query").html('<p id="prompt"><Strong>Please wait one moment while we upload your file.</Strong></p>');

                        //stop the recording and upload the file, might want to delay this a bit to avoid losing any post-keypress speech?
            uploadWav(uniqueId, stim[3], function(){
                            remove_word(); //clears screen
                            recorder.clear(); //clears recording buffer
                            __log(this.responseText);
                            next();
                          },
                          function() {
                            remove_word();
                            recorder.clear();
                            next();
                            __log('the upload failed');
                          }
                        );
             //startRecord.disabled = false;           
			psiTurk.recordTrialData({'phase':"TEST",
                                     'trialId':stim[3],
                                     'age':age,
                                     'edu':edu,
                                     //'word':stim[0],
                                     //'color':stim[1],
                                     //'relation':stim[2],
                                     'response':response,
                                     'hit':hit,
                                     'rt':rt}
                                   );
		}
	};


	var finish = function() {
	    $("body").unbind("keydown", response_handler); // Unbind keys
	    currentview = new Questionnaire();
	};
	
	var show_word = function(text, color) {
		d3.select("#stim")
			.append("div")
			.attr("id","word")
			.style("color",color)
			.style("text-align","center")
			.style("font-size","20px")
			.style("font-weight","bold")
			.style("margin","20px")
			.text(text);
	};

	var remove_word = function() {
		d3.select("#word").remove();
	};

	
	// Load the stage.html snippet into the body of the page
	psiTurk.showPage('stage.html');

	// Register the response handler that is defined above to handle any
	// key down events.
	$("body").focus().keydown(response_handler); 

	// Start the test
	next();
};


/****************
* Questionnaire *
****************/

var Questionnaire = function() {

	var error_message = "<h1>Oops!</h1><p>Something went wrong submitting your HIT. This might happen if you lose your internet connection. Press the button to resubmit.</p><button id='resubmit'>Resubmit</button>";

	record_responses = function() {

		psiTurk.recordTrialData({'phase':'postquestionnaire', 'status':'submit'});

		$('textarea').each( function(i, val) {
			psiTurk.recordUnstructuredData(this.id, this.value);
		});
		$('select').each( function(i, val) {
			psiTurk.recordUnstructuredData(this.id, this.value);		
		});

	};

	prompt_resubmit = function() {
		replaceBody(error_message);
		$("#resubmit").click(resubmit);
	};

	resubmit = function() {
		replaceBody("<h1>Trying to resubmit...</h1>");
		reprompt = setTimeout(prompt_resubmit, 10000);
		
		psiTurk.saveData({
			success: function() {
			    clearInterval(reprompt); 
                psiTurk.computeBonus('compute_bonus', function(){finish()}); 
			}, 
			error: prompt_resubmit
		});
	};

	// Load the questionnaire snippet 
	psiTurk.showPage('postquestionnaire.html');
	psiTurk.recordTrialData({'phase':'postquestionnaire', 'status':'begin'});
	
	$("#next").click(function () {
	    record_responses();
	    psiTurk.saveData({
            success: function(){
                psiTurk.computeBonus('compute_bonus', function() { 
                	psiTurk.completeHIT(); // when finished saving compute bonus, the quit
                }); 
            }, 
            error: prompt_resubmit});
	});
    
	
};

// Task object to keep track of the current phase
var currentview;

/*******************
 * Run Task
 ******************/
$(window).load( function(){
    try {
        
        // webkit and mozilla shim
        window.AudioContext = window.AudioContext || window.webkitAudioContext || window.mozAudioContext;
        navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
        window.URL = window.URL || window.webkitURL;

        audio_context = new AudioContext;
        __log('Audio context set up.');
        __log('navigator.getUserMedia ' + (navigator.getUserMedia ? 'available.' : 'not present!'));
        //request mic input
        
        //navigator.mediaDevices.getUserMedia({audio: true},
            //function(stream) {
              //we have a mice, set up the recorder and start the hit.
        navigator.mediaDevices.getUserMedia({audio:true})
	       .then(stream => {
                startRecorder(stream);
                psiTurk.doInstructions(
                    instructionPages, // a list of pages you want to display in sequence
                    function() { currentview = new StroopExperiment(); } // what you want to do when you are done with instructions
                );
              },
            function(e) {
              //maybe also issue alert that this hit should not be accepted as there was an issue getting the audio stream setup?
              //For now if the audio stream doesn't work than the hit doesn't advance but with no error message
                __log('No live audio input: ' + e);
              }
        );
                
    } catch (e) {
        alert('There is no audio recording support in this browser, do not accept this hit');
    }
});

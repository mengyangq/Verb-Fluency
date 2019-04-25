/*
 * Requires:
 *     psiturk.js
 *     utils.js
 *     recorder.js
 *     recorderWorker.js
 *     volume-meter.js
 */

// variable creation so they are in the global space
var audio_context;
var mic_input;
var cue_input;
var cue_tone = 1000;
var rec_input;
var volume_analyzer;
var recorder;

var recorder_config = {
    workerPath: 'static/lib/recorderWorker.js', //it'd be nice if this wasn't hardcoded
    numChannels: 1 //record mono sounds
};

function __log(e, data) {
  console.log(e + " " + (data || ''));
}

function startRecorder(stream) {
  //make the mice input node
  mic_input = audio_context.createMediaStreamSource(stream);
  __log('Mic stream created.');

  //gain node that will serve as a mixer of the mic and cue node
  rec_input = audio_context.createGain();
  __log('Mixer created.');

  //connect mic to mixer
  mic_input.connect(rec_input);

  // this will be used to inject sounds into the recordings
  cue_input = audio_context.createOscillator();
  cue_input.frequency.value = cue_tone;
  cue_input.type = 'square';
  __log('Cue created.');

  //connect cue to mixer
  cue_input.connect(rec_input);

  //start the recorder with the mixer as input
  initRecorder(rec_input);
  //start the volume analyzer for the instruction page
  initVolumeAnalyzer(rec_input);
};

function initRecorder(input) {
    recorder = new Recorder(input, recorder_config);
    __log('Recorder initialised.');
};

function initVolumeAnalyzer(input){
  volume_analyzer = createAudioMeter(audio_context);
  __log('Volume analyzer initialized.');

  input.connect(volume_analyzer);
  __log('Mixer connected to volume analyzer.');
};

function playCue(duration) {
  //immediately play cue
  cue_input.start ? cue_input.start(0) : cue_input.noteOn(0);
  //calculate the duration to play for
  duration = duration || (cue_input.frequency.value / 1000);
  //initiate stop based on that duration
  cue_input.stop(duration);
  //reset cue, which means disconnecting the node and making a new one
  cue_input.onended = function(){
    cue_input.disconnect();
    cue_input = audio_context.createOscillator();
    cue_input.frequency.value = cue_tone;
    cue_input.type = 'square';
    __log('Cue created.');
    cue_input.connect(rec_input);
  };
}

function stopRecordingAndUpload(uid, fname, onload, onerror){
  recorder.stop();
  recorder.exportWAV(function(blob) {
    var request = new XMLHttpRequest();
    request.open('PUT', '/_wav_upload/' + uid + '/' + fname, true);
    request.onload = onload || function(){ recorder.clear(); __log(this.responseText) };
    request.onerror = onerror || function(){
      recorder.clear();
      __log("couldn't connect to server for file upload")
    };
    request.send(blob);
  });
};

function uploadWav(uid, fname, onload, onerror){
  if (!recorder.recording){
    recorder.exportWAV(function(blob) {
      var request = new XMLHttpRequest();
      request.open('PUT', '/_wav_upload/' + uid + '/' + fname, true);
      request.onload = onload || function(){ recorder.clear(); __log(this.responseText) };
      request.onerror = onerror || function(){
        recorder.clear();
        __log("couldn't connect to server for file upload")
      };
      request.send(blob);
    });
  }
};

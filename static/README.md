# Stroop recorder
This is a modification of the stroop task that ships with [psiturk](http://psiturk.org) to allow for in browser audio recording and uploading.

Recording is accomplished with a modified version of the html5 audio recording [RecorderJS library](https://github.com/ebuz/Recorderjs).


## Server code
The `custom.py` defines the required wav uploading support. The function responds to PUT and GET requests at the url `www.your.server.com/_wav_upload/uniqueId/filename`.

The uniqueId is a javascript and sql value that psiturk creates to track workers and can be used to (probably) uniquely identify a worker and the assignment they are completing.
The filename is whatever you want to use to identify the file (you can't leave it blank, saving to the same file name will overwrite a previous file).

Files are saved in whatever directory is provided in the `upload_folder` value in the `[Server Parameters]` portion of the `config.txt` file. It defaults to a folder called `uploads` in the psiturk experiment directory.
The files are saved this way: `uploads/hitId/workerId/assignmentId/filename.wav`
A GET request will return the file (assuming one was uploaded) to play in the browser.

For some amount of security the function will ignore any requests if the worker is marked as anything but `STARTED` which means that they have consented to participant but not finished the experiment.
For the most part your psiturk experimental code will update what status a worker has (see the `static/js/task.js` code).

## Client code
The `static/js/recorder_utils.js` has all the variables and functions you'll need to work with the recorder. The ones you'll most likely work with are:

    startRecorder(stream);
    playCue(duration);
    stopRecordingAndUpload(uniqueId, filename, onload, onerror);
    uploadWav(uniqueId, filename, onload, onerror);
    recorder.start();
    recorder.stop();
    recorder.clear();

`startRecorder()` sets up the recorder as well as some other required things that need to be set up before recording can be done. It needs to be called with a valid audio stream (see the example in the `static/js/task.js` in the `.load` function code).

`playCue()` is supposed to immediately play a square wave tone for `duration` seconds though it seems to not be working correctly for now. I'm not sure why though currently in the experiment it is being called immediately after `recorder.start()` and it might be the case that the sound plays before the recorder has time to start actually recording. More testing is needed.

`stopRecordingAndUpload()` and `uploadWav()` are used to send recordings to the server, the first one will stop the recorder and send the file. The other will upload only but the recorder must be stopped elsewhere. You can see an example of how to use this function in the `static/js/task.js` file around like 119). If the server gives a response (!!Note, this is not the same as the upload having worked!!) than it will call whatever function you give in `onload`, if it fails (i.e. the server can't be reached for some reason) it will run `onerror`. Both those default to running `recorder.clear()` and write out what the server sent back (or a generic error).

The last three functions work the recorder as their names suggest. They don't take any parameters. Starting and stopping recording multiple times will concatenate the recordings together while `recorder.clear()` will remove whatever has been recorded up to that point (and if you haven't uploaded anything it'll be gone forever).


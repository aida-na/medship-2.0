let video = null;
let streamRef = null;
let adjustedCanvas = false;
let drawCanvas = null;
let drawCtx = null;
let captureCanvas = null;
let captureCtx = null;
let timeInterval = null;
let startedup = null;
let constraints = null;
let analytics = {
    "angry": 0,
    "disgust": 0,
    "fear": 0,
    "happy": 0,
    "sad": 0,
    "surprise": 0,
    "neutral": 0,
}

const verbose = true;
var secs = 0;

const ANALYSIS_INTERVAL = 100


// Decide whether your video has large or small face
// var faceMode = affdex.FaceDetectorMode.SMALL_FACES;
var faceMode = affdex.FaceDetectorMode.LARGE_FACES;

// Decide which detector to use photo or stream
// var detector = new affdex.PhotoDetector(faceMode);
var detector = new affdex.FrameDetector(faceMode);

// Initialize Emotion and Expression detectors
detector.detectAllEmotions();
detector.detectAllExpressions();
detector.detectAllEmojis();
detector.detectAllAppearance();

document.getElementById('startCamera').addEventListener('click', function () {
    startCamera();
});

document.getElementById('stopCamera').addEventListener('click', function () {
    stopCamera();
    clearCanvas('drawCanvas');
});


function adjustCanvas() {
    const canvas = document.getElementById('canvasElement');
    const context = canvas.getContext('2d');
    // Resetting or adjusting canvas. For example, you can clear the canvas as follows:
    context.clearRect(0, 0, canvas.width, canvas.height);
}


function startup() {
if (!startedup) {
    detector.start()
    startCamera();
    drawCanvas.width = drawCanvas.width;
    drawCanvas.width = video.videoWidth || drawCanvas.width;
    drawCanvas.height = video.videoHeight || drawCanvas.height;
    captureCanvas.width = video.videoWidth || captureCanvas.width;
    captureCanvas.height = video.videoHeight || captureCanvas.height;
    // drawCtx.lineWidth = "5";
    // drawCtx.strokeStyle = "blue";
    // drawCtx.font = "20px Verdana";
    // drawCtx.fillStyle = "red";
    startedup = true;
}
}


function startCamera() {
    if (navigator.mediaDevices) {
    navigator.mediaDevices.getUserMedia({ video: true, audio: false })
    .then(function onSuccess(stream) {
        const video = document.getElementById('videoElement');
        streamRef = stream;
        video.autoplay = true;
        video.srcObject = stream;
        timeInterval = setInterval(grab, ANALYSIS_INTERVAL);
        if (detector && !detector.isRunning) {
        detector.start();
        }
    })
    } else {
    alert('getUserMedia is not supported in this browser.');
    }
}


function stopInterval() {
    clearInterval(timeInterval);
    clearCanvas('drawCanvas');  // Clear the canvas after the interval is stopped.
}

function stopCamera() {
    if (streamRef === null) {
    console.log("Stop Stream: Stream not started/stopped.");
    }
    else if (streamRef.active) {
    video.pause();
    streamRef.getTracks()[0].stop();

    detector.stop();

    video.srcObject = null;
    clearDrawCanvas();
    stopInterval();
    adjustCanvas();
    updateAnalytics();
    updateSpreadsheet();
 
    startedup = false;
    detectorInit = false;
    
    }
}

document.onreadystatechange = () => {
if (document.readyState === "complete") {
    String.prototype.capitalize = function () {
    return this.charAt(0).toUpperCase() + this.slice(1);
    }
    video = document.querySelector("#videoElement");
    captureCanvas = document.getElementById("captureCanvas");
    captureCtx = captureCanvas.getContext("2d");
    drawCanvas = document.getElementById("drawCanvas");
    drawCtx = drawCanvas.getContext("2d");
}
};

var detectorInit = false;

function grab() {
    captureCtx.drawImage(
        video,
        0,
        0,
        video.videoWidth,
        video.videoHeight,
        0,
        0,
        video.videoWidth,
        video.videoHeight,
    );

    // image base64 data for apis and stuff
    // const base64Image = captureCanvas.toDataURL("image/jpeg");

    if (detector && detector.isRunning && detectorInit) {
        detector.process(captureCtx.getImageData(0, 0, captureCanvas.width, captureCanvas.height), secs);
    };

    secs += ANALYSIS_INTERVAL / 1000;
}

    detector.addEventListener('onInitializeSuccess', function () {
    // console.log('detector initialized');
    detectorInit = true
    });

    detector.addEventListener("onImageResultsSuccess", function (faces, image, timestamp) {
    // drawImage(image);
    //$('#results').html("");
    var time_key = "Timestamp";
    var time_val = timestamp;

    if (verbose) {
        console.log('#results', "Timestamp: " + timestamp.toFixed(2));
        console.log('#results', "Number of faces found: " + faces.length);
        console.log("Number of faces found: " + faces.length);
    }
    if (faces.length > 0) {
        if (verbose) {
            console.log('\nFACES RESULT')
            console.log(faces) }
        // drawFeaturePoints(image, faces[0].featurePoints);
        drawAffdexStats(image, faces[0]);
    } else {
        // If face is not detected skip entry.
        console.log('Cannot find face, skipping entry');
    };
});

//Draw the detected facial feature points on the image
function drawAffdexStats(img, data) {
    let featurePoints = data.featurePoints;
    // var contxt = $('#face_video_canvas')[0].getContext('2d');
    var contxt = document.getElementById('drawCanvas').getContext('2d');
    contxt.clearRect(0, 0, drawCanvas.width, drawCanvas.height);

    var hRatio = contxt.canvas.width / img.width;
    var vRatio = contxt.canvas.height / img.height;
    var ratio = Math.min(hRatio, vRatio);

    contxt.strokeStyle = "#FFFFFF";
    for (var id in featurePoints) {
        contxt.beginPath();
        contxt.arc(featurePoints[id].x,
        featurePoints[id].y, 2, 0, 2 * Math.PI);
        contxt.stroke();
    }


    let emoji = data.emojis.dominantEmoji;
    const emotionWithHighestScore = getEmotionWithHighestScore(data.emotions);
    console.log(emotionWithHighestScore); // Output: "engagement"
    const browFurrow = data.expressions.browFurrow.toFixed(2);
    const browRaise = data.expressions.browRaise.toFixed(2);
    const smile = data.expressions.smile.toFixed(2);
    const innerBrowRaise = data.expressions.innerBrowRaise.toFixed(2);
    const lipPress = data.expressions.lipPress.toFixed(2);
    const upperLipRaise = data.expressions.upperLipRaise.toFixed(2);
    const eyeWiden = data.expressions.eyeWiden.toFixed(2);
    const engagement = data.emotions.engagement.toFixed(2);
    const cheekRaise = data.expressions.cheekRaise.toFixed(2);

    const listeningExpressions = {
        browRaise: browRaise,
        eyeWiden: eyeWiden,
        smile: smile,
        engagement: engagement
    };
    
    const listening = checkListeningDetected(listeningExpressions) ? 'Detected' : 'Not Detected';
    
    const text = `Listening: ${listening}\nBrow Raise: ${browRaise}\nUpper Lid: ${eyeWiden}\nLip Corners Pull: ${smile}\nEngagement ${engagement}\nDominant Emoji: ${emoji}`;

    contxt.font = "20px Arial";
    contxt.fillStyle = "white";

    contxt.lineWidth = 2; // Width of the border line
    contxt.fillStyle = 'white'; // Color of the text
    contxt.strokeStyle = 'black'; // Color of the border

    for (let i = 0; i < text.split("\n").length; i++) {
        contxt.strokeText(text.split("\n")[i], 10, 20 + i * 20);
        contxt.fillText(text.split("\n")[i], 10, 20 + i * 20);
    }
}

function getEmotionWithHighestScore(emotions) {
let maxEmotion = null;
let maxScore = Number.NEGATIVE_INFINITY;

for (const emotion in emotions) {
    const score = emotions[emotion];

    if (score > maxScore) {
    maxScore = score;
    maxEmotion = emotion;
    }
}

return maxEmotion;
}

function checkListeningDetected(expressions) {
    const listeningExpressions = ['','eyeWiden', 'smile', 'engagement'];
    let compassionDetected = true;

    for (const expression of listeningExpressions) {
    const score = expressions[expression];

    if (score <= 20) {
        listeningDetected = false;
        break;
    }
    }

    return listeningDetected ? 'listeningDetected' : null;
}

function clearDrawCanvas() {
    let contxt = document.getElementById("drawCanvas").getContext("2d");
    contxt.clearRect(0, 0, drawCanvas.width, drawCanvas.height);
    console.log("Cleared draw canvas");
  }

function updateSpreadsheet() {
    //send over the data to flask endpoint that updates the google sheet

    fetch("/update-sheet", {
    method: "POST",
    headers: {
        "Content-Type": "application/json",
    },
    body: JSON.stringify({
        test_type: testType,
        columns: dataColumns,
        values: recordedData,
    }),
    })
    .then((response) => response.json())
    .then((data) => {
        let success = data["success"];
        if (success) {
        console.log("Successfully updated spreadsheet");
        } else {
        console.log("Failed to update spreadsheet");
        }
    })
    .catch((error) => {
        console.error("Error:", error);
    });
}



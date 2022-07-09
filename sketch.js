// Global variable to store the classifier
let classifier;

// Label
let label = "Listening...";

// Teachable Machine model URL:
let soundModel = "https://teachablemachine.withgoogle.com/models/VCPbH2iKE/";

let myFont, myGate;

let myCapture, myVida;
let mic;

//Visual
let video;
let facemesh;
let predictionsF = [];
let handpose;
let predictionsH = [];
let s = 1;
let den = 1;
let pg;
function initCaptureDevice() {
  try {
    myCapture = createCapture(VIDEO);
    myCapture.size(320, 240);
    myCapture.elt.setAttribute("playsinline", "");
    myCapture.hide();
    console.log("[Capture] Capture ready.");
  } catch (_err) {
    console.log("[Capture] capture error: " + _err);
  }
}

function preload() {
  // Load the model
  classifier = ml5.soundClassifier(soundModel + "model.json");
  myFont = loadFont("Academy Engraved LET Fonts.ttf");
  myGate = loadImage("men2.png");
}

function setup() {
  createCanvas(windowWidth, windowHeight, WEBGL);
  //create & start an audio input
  mic = new p5.AudioIn();
  mic.start();
  // Start classifying
  // The sound model will continuously listen to the microphone
  classifier.classify(gotResult);
  initCaptureDevice();
  noStroke();
  /*
    VIDA stuff. One parameter - the current sketch - should be passed to the
    class constructor (thanks to this you can use Vida e.g. in the instance
    mode).
  */
  myVida = new Vida(this); // create the object
  /*
    Turn on the progressive background mode.
  */
  myVida.progressiveBackgroundFlag = true;
  /*
    The value of the feedback for the procedure that calculates the background
    image in progressive mode. The value should be in the range from 0.0 to 1.0
    (float). Typical values of this variable are in the range between ~0.9 and
    ~0.98.
  */
  myVida.imageFilterFeedback = 0.96;
  /*
    The value of the threshold for the procedure that calculates the threshold
    image. The value should be in the range from 0.0 to 1.0 (float).
  */
  myVida.imageFilterThreshold = 0.06;
  //
  s = 768 / (640 * den);
  facemesh = ml5.facemesh(myCapture, modelReadyF);
  handpose = ml5.handpose(myCapture, modelReadyH);
  facemesh.on("predict", (results) => {
    predictionsF = results;
  });
  handpose.on("predict", (results) => {
    predictionsH = results;
  });
  pg = createGraphics(width, width * 0.75);
}
function modelReadyF() {
  console.log("Model ready!" + ":" + "facemesh");
}
function modelReadyH() {
  console.log("Model ready!" + ":" + "handpose");
}
function draw() {
  pg.background(0);
  drawKeypoints();
  if (myCapture !== null && myCapture !== undefined) {
    // safety first
    background(0);
    /*
      Call VIDA update function, to which we pass the current video frame as a
      parameter. Usually this function is called in the draw loop (once per
      repetition).
    */
    myVida.update(myCapture);

    fill(255);
    textFont(myFont);
    textSize(32);
    textAlign(CENTER, CENTER);
    text(label, 0, 64 - height / 2);
    if (mouseIsPressed) text(label, mouseX - width / 2, mouseY - height / 2);
    /* If a knock is detected, trigger*/
    if (label == "Knock") {
    } else {
    }
    /*
      Now we can display images: source video (mirrored) and subsequent stages
      of image transformations made by VIDA.
*/
    brightness(255);
    push();
    scale(-1, 1);
    texture(myVida.thresholdImage);
    rotateY(-PI);
    tint(0, 255, 0, 255);
    sphere(height / 5);
    pop();

    push();
    translate(0, 0);
    rotateY(PI);
    //   texture(myVida.differenceImage);
    texture(pg);
    //    tint(0, 255, 0, 255);
    plane(width, 0.75 * width);
    pop();
    /*  	if(frameCount % 4 === 0) {
			glitch.loadImage(myCapture);
		
		// map mouseX to # of randomBytes() + mouseY to limitBytes()
		glitch.limitBytes(0.1);
		glitch.randomBytes(1);
		glitch.buildImage();
	}
*/

    /*
      VIDA has two built-in versions of the function drawing active zones:
        [your vida object].drawActiveZones(x, y);
      and
        [your vida object].drawActiveZones(x, y, w, h);
      But we want to create our own drawing function, which at the same time
      will be used for the current handling of zones and reading their statuses
      (we must also remember about controlling the sound).
    */
  } else {
    /*
      If there are problems with the capture device (it's a simple mechanism so
      not every problem with the camera will be detected, but it's better than
      nothing) we will change the background color to alarmistically red.
    */
    background(255, 0, 0);
  }
}
function drawKeypoints() {
  pg.fill(0, 255, 0);
  pg.stroke(0, 200, 0);
  for (let i = 0; i < predictionsF.length; i += 1) {
    const keypoints = predictionsF[i].scaledMesh;

    for (let j = 0; j < keypoints.length; j += 1) {
      const [x, y] = keypoints[j];
      pg.stroke(0, 200, 0);
      pg.fill(0, 255, 0);
      pg.ellipse(x * s, y * s, 5 * s, 5 * s);
    }
  }
  for (let i = 0; i < predictionsH.length; i += 1) {
    const predictionH = predictionsH[i];
    for (let j = 0; j < predictionH.landmarks.length; j += 1) {
      const keypoint = predictionH.landmarks[j];
      const keypoint0 = predictionH.landmarks[j + 1];
      if (j == 0) pg.ellipse(keypoint[0] * s, keypoint[1] * s, 50 * s, 50 * s);
      else pg.ellipse(keypoint[0] * s, keypoint[1] * s, 10 * s, 10 * s);
      if (j > 0 && j % 4 !== 0)
        pg.line(
          keypoint[0] * s,
          keypoint[1] * s,
          keypoint0[0] * s,
          keypoint0[1] * s
        );
    }
  }
}
// The model recognizing a sound will trigger this event
function gotResult(error, results) {
  if (error) {
    console.error(error);
    return;
  }
  // The results are in an array ordered by confidence.
  // console.log(results[0]);
  label = results[0].label;
}

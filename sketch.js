let canvas;

let capture = -1;
let usingWebcam = false;
let simulatedCamera;

let numCopies = 3;
let selectedCopy = -1;
let copies = [];

let toolSelector;
let numSelector;
let modeSelector;

function initializeCopies() {
  numCopies = numSelector.value();
  let yOffset = windowHeight*0.1;
  for (let i = 0; i < numCopies; i++) {
    let theta = 2*PI*(0.25+i/numCopies);
    if (numCopies % 2 == 0) {
      theta += PI/numCopies;
    } else {
      y_offset = windowHeight*0.5/numCopies;
    }
    let scale = 1.25/sqrt(numCopies);
    copies[i] = {x: windowHeight*0.3*cos(theta), y: windowHeight*(-0.3*sin(theta)) + yOffset, angle: 0, scaleX: scale, scaleY: scale}
  }
}

function selectCameraMode() {
  switch(modeSelector.value()) {
    case "Simulated Camera":
      usingWebcam = false;
      clearSimulatedCamera();
      break;
    case "Webcam":
      usingWebcam = true;
      if (capture == -1) {
        capture = createCapture(VIDEO);
        capture.size(640, 480);
        capture.hide();
      }
      break;
  }
}

function setup() {
  canvas = createCanvas(windowWidth, windowHeight);

  background(0);

  textAlign(CENTER);
  toolSelector = createRadio();
  toolSelector.style('color',color(255,255,255));
  toolSelector.position(10,130);
  toolSelector.option("Move");
  toolSelector.option("Rotate");
  toolSelector.option("Scale");
  toolSelector.selected("Move");

  numSelector = createSelect();
  numSelector.position(10, 100);
  for (let i = 1; i <= 6; i++) {
    numSelector.option(i);
  }
  numSelector.selected(3);
  numSelector.changed(initializeCopies);

  modeSelector = createSelect();
  modeSelector.position(10, 70);
  modeSelector.option("Simulated Camera");
  modeSelector.option("Webcam");
  modeSelector.selected("Simulated Camera");
  modeSelector.changed(selectCameraMode);

  clearSimulatedCamera();
  initializeCopies();
}

function clearSimulatedCamera() {
  let simWidth = floor((height-50)/3)*4;
  let simHeight = simWidth*3/4;
  simulatedCamera = createGraphics(simWidth, simHeight);
  simulatedCamera.loadPixels();
  for (let x = 0; x < simulatedCamera.width; x ++) {
    for (let y = 0; y < simulatedCamera.height; y ++) {
      simulatedCamera.set(x, y, color(255,255,255));
    }
  }
  simulatedCamera.updatePixels();
}

function draw() {
  background(0);

  blendMode(ADD);

  // copy selection
  if (!mouseIsPressed) {
    selectedCopy = -1;
    let minDist = 480;
    let x1 = pwinMouseX - width*0.5;
    let y1 = pwinMouseY - height*0.5;
    for (let i = 0; i < numCopies; i++) {
      let copy = copies[i];
      let dist = sqrt(sq(copy.x-x1) + sq(copy.y-y1));
      if (dist < minDist && dist < max(320*copy.scaleX, 240*copy.scaleY)) {
        selectedCopy = i;
        minDist = dist;
      }
    }
  }

  // copy rendering
  for (let i = 0; i < numCopies; i++) {
    let copy = copies[i];
    resetMatrix();
    translate(width*0.5+copy.x, height*0.5+copy.y);
    rotate(copy.angle);
    scale(copy.scaleX, copy.scaleY);
    if (usingWebcam) {
      image(capture, -320, -240, 640, 480);
    } else {
      image(simulatedCamera, -320, -240, 640, 480);
      noStroke();
      fill(2,5,10);
      rect(-320, -240, 640, 480);
    }
  }
  resetMatrix();

  blendMode(BLEND);


  if (!usingWebcam) {
    loadPixels();
    let iOffset = floor((width - simulatedCamera.width)/2);
    let jOffset = floor((height - simulatedCamera.height)/2);

    simulatedCamera.copy(canvas, iOffset, jOffset, simulatedCamera.width, simulatedCamera.height, 0, 0, simulatedCamera.width, simulatedCamera.height);

    stroke(255);
    noFill();
    rect(iOffset, jOffset, simulatedCamera.width, simulatedCamera.height);
  }

  if (selectedCopy >= 0) {
    let copy = copies[selectedCopy];
    resetMatrix();
    translate(width*0.5+copy.x, height*0.5+copy.y);
    rotate(copy.angle);
    scale(copy.scaleX, copy.scaleY);
    stroke(255);
    noFill();
    rect(-320, -240, 640, 480);
  }
}

function mouseDragged() {
  if (selectedCopy < 0 || selectedCopy >= numCopies) {
    return;
  }
  let c = copies[selectedCopy];
  let xOffset = pwinMouseX - (c.x + width*0.5);
  let yOffset = pwinMouseY - (c.y + height*0.5);
  let dist = sqrt(sq(xOffset)+sq(yOffset));
  let tool = toolSelector.value();

  switch (tool) {
    case "Move":
      c.x += movedX;
      c.y += movedY;
      break;
    case "Rotate":
      let perpdot = -yOffset*movedX + xOffset*movedY;
      c.angle += perpdot/sq(dist);
      break;
    case "Scale":
      let dot = xOffset*movedX + yOffset*movedY;
      c.scaleX += dot/(320*dist);
      c.scaleY += dot/(320*dist);
      c.scaleX = constrain(c.scaleX, 0.25,3);
      c.scaleY = constrain(c.scaleY, 0.25,3);
      break;
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  clearSimulatedCamera();
}

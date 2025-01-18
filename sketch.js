var song;
var fft;
var particles = [];
var fileInput;

function setup() {
  createCanvas(windowWidth, windowHeight, WEBGL); // Using WEBGL for 3D effects
  angleMode(DEGREES);
  fft = new p5.FFT(0.3);
  noLoop(); // Initial state paused

  // Create a custom-styled button for file input
  const container = createDiv('').style('position: absolute; top: 20px; left: 20px;');
  fileInput = createFileInput(handleFile).style('display: none;'); // Hide default input
  const button = createButton('Upload Music File').parent(container);

  // Style the button with CSS
  button.style(`
    padding: 10px 20px;
    background: linear-gradient(135deg, #ff6ec7, #6ebeff);
    border: none;
    border-radius: 30px;
    color: white;
    font-size: 16px;
    font-family: 'Arial', sans-serif;
    font-weight: bold;
    cursor: pointer;
    transition: transform 0.2s, box-shadow 0.2s;
  `);

  // Add hover and active effects
  button.mouseOver(() => {
    button.style('box-shadow: 0px 8px 15px rgba(0, 0, 0, 0.2); transform: scale(1.05);');
  });
  button.mouseOut(() => {
    button.style('box-shadow: none; transform: scale(1);');
  });

  button.mousePressed(() => fileInput.elt.click()); // Trigger file input click on button click
}

function draw() {
  background(10, 10, 30); // Deep blue background

  // Analyze audio frequency spectrum
  fft.analyze();
  let amp = fft.getEnergy(20, 200);

  // Rotate the 3D visualization
  rotateX(frameCount * 0.05);
  rotateY(frameCount * 0.05);
  strokeWeight(2.5);
  noFill();
  let wave = fft.waveform();

  for (let t = -1; t <= 1; t += 2) {
    beginShape();
    for (let i = 0; i <= 180; i += 0.5) {
      let index = floor(map(i, 0, 180, 0, wave.length - 1));
      let r = map(wave[index], -1, 1, 150, 350);
      let x = r * sin(i) * t;
      let y = r * cos(i);
      let z = map(wave[index], -1, 1, -200, 200);
      stroke(lerpColor(color('#ff6ec7'), color('#6ebeff'), i / 180));
      vertex(x, y, z);
    }
    endShape();
  }

  // Add particle effects
  let p = new Particle();
  particles.push(p);

  for (let i = particles.length - 1; i >= 0; i--) {
    if (!particles[i].edges()) {
      particles[i].update(amp > 230); // Accelerate particles based on audio amplitude
      particles[i].show();
    } else {
      particles.splice(i, 1); // Remove particles out of range
    }
  }
}

function mouseClicked() {
  if (song && song.isPlaying()) {
    song.pause();
    noLoop();
  } else if (song) {
    song.play();
    loop();
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight); // Dynamically adjust canvas size
}

// Handle the uploaded file
function handleFile(file) {
  if (file.type === 'audio') {
    if (song) {
      song.stop(); // Stop any previous song
    }
    song = loadSound(file.data, () => {
      song.play();
      loop(); // Start visualization
    });
  } else {
    console.error('Please upload a valid audio file.');
  }
}

class Particle {
  constructor() {
    this.pos = createVector(
      random(-width / 2, width / 2),
      random(-height / 2, height / 2),
      random(-500, 500)
    );
    this.vel = createVector(0, 0, random(-1, 1));
    this.acc = createVector(0, 0, 0);
    this.w = random(5, 10);
    this.colorStart = color(random(150, 255), random(150, 255), random(150, 255));
    this.colorEnd = color(random(50, 150), random(50, 150), random(50, 150));
    this.alpha = 255; // Starting alpha
  }

  update(cond) {
    this.vel.add(this.acc);
    this.pos.add(this.vel);
    this.alpha -= 4; // Fade particles
    if (cond) {
      this.pos.add(this.vel.copy().mult(3)); // Accelerate when amplitude is high
    }
  }

  edges() {
    return (
      this.alpha <= 0 ||
      this.pos.x < -width / 2 ||
      this.pos.x > width / 2 ||
      this.pos.y < -height / 2 ||
      this.pos.y > height / 2 ||
      this.pos.z < -500 ||
      this.pos.z > 500
    );
  }

  show() {
    noStroke();
    let gradientColor = lerpColor(this.colorStart, this.colorEnd, map(this.alpha, 0, 255, 0, 1));
    fill(gradientColor, this.alpha);
    push();
    translate(this.pos.x, this.pos.y, this.pos.z);
    ellipse(0, 0, this.w);
    pop();
  }
}

/**
 * CSCI 4166 Visualization
 * Project: Music Visualizer
 * Ziliang Zhu B00879365
 * This code is the frontend of the project, creating the visualizations based on music features.
 * To run the program, the author uses Visual Studio Code's Go Live button on the bottom right of the window.
 * Some of the code is adapted from the tutorial by Colorful Coding
 * https://www.youtube.com/watch?v=uk96O7N1Yo0&list=WL&index=7&t=505s
 *  */

var track  // saves soundtrack 
var fft    // saves FFT of the soundtrack 
var lastUpdateTime = 0 // saves the time when the genre text is updated
var genreIndex = -1 // saves current index of the genre tag
var droplets = []  // saves an array of droplets 
var genreTags = [] // saves the genre tags retrieved from local storage 

// preload necessary variables before creating anything
function preload () {
  /* Preload the soundtrack || Source: Real-time music style classification with Essentia by MusicTechnologyGroup https://www.youtube.com/watch?v=Cp0zkojT9RQ
   * This track can be replaced by two other songs in the folder, Real-time_music_style_classification.mp3 or 
   * pop.mp3, make sure to change the soundtrack in backend.js too
   * */
  track = loadSound('Real-time_music_style_classification.mp3')
  genreTags = JSON.parse(localStorage.getItem('taggingResults')) // Load genre tags from local storage
}

// set up the canvus 
function setup () {
  createCanvas(windowWidth, windowHeight, WEBGL) // Setup the 3D canvas
  fft = new p5.FFT()  // Create a new FFT object for analyzing the track
  angleMode(DEGREES) // Set angle mode to degrees for easier calculations
  font = loadFont('Ballet.ttf') // Font source: Ballet by Woodcutter https://www.dafont.com/theme.php?cat=720&page=1
  font1 = loadFont('SCRIPTIN.ttf') // Font sourcel: Scriptina by Apostrophic Labs https://www.dafont.com/search.php?q=scriptin
}

// visual creation 
function draw () {

  let currentTime = millis() // Get the current time
  // update the text each 3 seconds
  if (track.isPlaying() && currentTime - lastUpdateTime > 3000 && genreIndex < genreTags.length - 1) {  // 3000 milliseconds = 3 seconds
    lastUpdateTime = currentTime
    genreIndex++
  }

  background(0) // black background 
  stroke(255)
  noFill()
  orbitControl()  // Enable 3D orbit controls

  fft.analyze()   // Analyze the current track
  amp = fft.getEnergy(50, 250)  // Get the amplitude of a frequency range: drum

  var wave = fft.waveform() // Get the waveform of the current track
  rotateX(60)  // Rotate the scene 
  translate(0, height * 0.1)  // Translate the scene for better view

  // displat the genre text 
  if (genreIndex >= 0) {
    push() // Isolate the transformation state
    resetMatrix() // Reset the transformation matrix
    translate(-windowWidth / 2, -windowHeight / 2) // Move the origin to the top-left corner
    fill(253, 131, 37) // Set text color
    textSize(50) // Set text size
    textFont(font)
    text(genreTags[genreIndex], 50, 40)
    textFont(font1)
    text(genreTags[genreIndex], 50, 100)
    pop() // Restore the original transformation state
  }

  // Draw the right side of the circle shape
  beginShape()
  for (var i = 0; i < 181; i++) {
    var index = floor(map(i, 0, 180, 0, wave.length - 1)) // select correct elements in the current wave
    var r = map(wave[index], -1, 1, 150, 350) // map the waveform to the distance from center
    var x = r * sin(i)
    var y = r * cos(i)
    vertex(x, y, 0)
  }
  endShape()

  // Draw the left side of the circle shape
  beginShape()
  for (var i = 0; i < 181; i++) {
    var index = floor(map(i, 0, 180, 0, wave.length - 1))// select correct elements in the current wave
    var r = map(wave[index], -1, 1, 150, 350)// map the waveform to the distance from center
    var x = -r * sin(i)
    var y = r * cos(i)
    vertex(x, y, 0)
  }
  endShape()

  var r1 = 300 // define the distance from the cylinder to the center 

  // Draw cylinders around the circle ( 25 cylinders)
  for (var num = 0; num < 360 - 360 / 25; num += 360 / 25) {
    var index = int(map(num, 0, 360, 0, wave.length - 1)) // select correct elements in the current wave
    var cylinderHeight = abs(300 * wave[index])  // map the waveform to the height of cylinders
    var x = r1 * cos(num)
    var y = r1 * sin(num)
    // move cylinders aound the circle, assigns interpolated color
    push()
    translate(x, y, cylinderHeight / 2)
    rotateX(90)
    var c1 = color(253, 131, 37)
    var c2 = color(37, 9, 28)
    var rate = map(num, 0, 360, 0, 0.9)
    var col = lerpColor(c1, c2, rate)
    stroke(col)
    fill(col)
    cylinder(10, cylinderHeight + 5)
    pop()

    // create the particles when drum volume is high, creating less than 500 droplets to avoid crushing
    if (amp >= 225 && droplets.length < 500) {
      var peak = map(amp, 225, 255, 300, 500)    // map amp to the peak particles reach
      var speed = map(amp, 225, 255, 30, 50)     // map amp to the speed of particles
      droplets.push(new Droplet(x, y, 5 + cylinderHeight, col, peak, speed)) // create a particle based on the cylinder's position and color
    }

  }

  // draw the particles and remove particles that hits the drumhead (circle shape) 
  for (var num = 0; num < droplets.length; num++) {
    droplets[num].move()
    droplets[num].show()
    if (droplets[num].z < 0) {
      droplets.splice(num, 1)
    }
  }
}

// Enable playing music when clicking
function mouseClicked () {
  if (track.isPlaying()) {
    track.pause()
    noLoop()
  } else {
    track.play()
    loop()
  }
}

// class for each particle  
class Droplet {

  constructor(x, y, z, col, peakZ, speedZ) {
    // initial position of the particle
    this.x = x + random(-2, 2)
    this.y = y + random(-2, 2)
    this.z = z
    this.col = col // color
    this.peakZ = peakZ  // peak point they can reach
    // a bit inward speed to the center
    this.speedX = x * random(-0.05, -0.01)
    this.speedY = y * random(-0.05, -0.01)
    this.speedZ = speedZ
  }

  // update the position of particles
  move () {
    // when hitting the peak, drop
    if (this.z > this.peakZ) {
      this.speedZ = -30
    }

    this.x += this.speedX
    this.y += this.speedY
    this.z += this.speedZ

  }

  // draw the particle
  show () {
    push()
    stroke(this.col)
    strokeWeight(1)
    point(this.x, this.y, this.z)
    pop()
  }

}
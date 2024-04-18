/**
 * CSCI 4166 Visualization
 * Project: Music Visualizer
 * Ziliang Zhu B00879365
 * This code is the backend of the project, analyzing the genre of the music using Essentia.js and musiCNN model.
 * To run the program, the author uses Visual Studio Code's Go Live button on the bottom right of the window.
 * The code is adapted from Music Autotagging Projectm by Music Technology Group, https://glitch.com/edit/#!/essentiajs-models-workers-non-rt
 *  */

let taggingResults = [] // stores the autotagging results

// init audio context
const audioCtx = new (AudioContext || new webkitAudioContext())()

// model variables
const modelURL = "./msd-musicnn-1/model.json"
import meta from "./msd-musicnn-1/msd-musicnn.json" assert {type: 'json'}
const classes = meta.classes

let extractor = null
let musicnn = new EssentiaModel.TensorflowMusiCNN(tf, modelURL, true)


// get audio track URL
/* Source: Real-time music style classification with Essentia by MusicTechnologyGroup https://www.youtube.com/watch?v=Cp0zkojT9RQ
 * This track can be replaced by two other songs in the folder, hey.mp3 or 
 * pop.mp3, make sure to change the soundtrack in sketch.js too
 * */
const audioURL = "Real-time_music_style_classification.mp3"

window.onload = () => {
  // load Essentia WASM backend
  EssentiaWASM().then(wasmModule => {
    extractor = new EssentiaModel.EssentiaTFInputExtractor(wasmModule, "musicnn", false)
    // fetch audio and decode, then analyse
    extractor.getAudioBufferFromURL(audioURL, audioCtx).then(analyse)
  })
}

// analyse the music
async function analyse (buffer) {
  const audioData = await extractor.downsampleAudioBuffer(buffer)
  const features = await extractor.computeFrameWise(audioData, 256)
  await musicnn.initialize()
  const predictions = await musicnn.predict(features, true)
  const numericPredictions = predictions.map(innerArray =>
    innerArray.map(Number)
  )

  // store the prediction as strings 
  numericPredictions.forEach(predictionArray => {
    var x = Math.max(...predictionArray)
    const topIndex = predictionArray.indexOf(x)
    const genre = classes[topIndex]
    taggingResults.push(genre)
  })

  // pass the result to the frontend through JSON
  localStorage.setItem('taggingResults', JSON.stringify(taggingResults))
  console.log(taggingResults)
}


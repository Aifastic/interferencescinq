let obra;
let imgCirculos;
let mouseClickeado = true;
let estado = "comenzar";
let fuenteTexto;

//CONFIG INICIAL SONIDO

//-------------SONIDO GENERAL-----------------
let mic;
let audioIniciado = false;

//amplitud
let AMP_MIN = 0.0;
let AMP_MAX = 0.3;
let intensidad = 0;

let calibrandoAmp = true;
let monitor = true;

//frecuencia

let NOTA_MIN = 50;
let NOTA_MAX = 73;

let pitch;
const model_url = "https://cdn.jsdelivr.net/gh/ml5js/ml5-data-and-models/models/pitch-detection/crepe/";
let frec = 0;
let notaMidi = 0;
let altura = 0;
let difAltura = 0;

//VARIABLES SONIDO
let amp = 0;

let pisoAmp = Infinity;
let techoAmp = -Infinity;

let gestorAmp;
let gestorFrec;

//-------ESTADOS Y EVENTOS DE SONIDO-----
let haySonido = false;
let antesHabiaSonido = false;
let empezoElSonido = false;
let terminoElSonido = false;
let umbralRuido = 0.1;
let umbralDuracionSonido = 1100;

//-------TEMPORIZADORES----

let marcaInicioSonido = 0;
let marcaFinSonido = 0;
let durSonido = 0;
let durSilencio = 0;
let sonidoLargo = false;
let ultimoSonidoLargo = false;

// VARIABLES CLASIFICADOR IA
let classifier;
let label = "";

let modoDifference = false;


function preload(){
  fuenteTexto = loadFont("/data/STONIN_.TTF");
  
  
}

function setup() {
  angleMode(RADIANS);
  createCanvas(500, 500);
  mic = new p5.AudioIn();
  gestorAmp = new GestorSenial(AMP_MIN, AMP_MAX);
  gestorFrec = new GestorSenial(NOTA_MIN, NOTA_MAX);

  obra = new Obra();
  obra.iniciar();
  
  
}



function gotResult(error, results) {
  if (error) {
    console.error(error);
    return;
  }

  let nuevoLabel = results[0].label;

  // Si detecta un aplauso nuevo y en el fotograma anterior NO era aplauso:
  if (nuevoLabel == "Aplauso" && label != "Aplauso") {
    modoDifference = !modoDifference; // Alterna entre true (prendido) y false (apagado)
  }

  // Actualizamos el label para el próximo fotograma
  label = nuevoLabel;
}

function draw() {
  background(255);
  if (audioIniciado == false) {
    fill(0);
    textFont(fuenteTexto);
    textAlign(CENTER, CENTER);
    textSize(40);
    text("Hacé click para comenzar", width / 2, height / 2);
    return;
  }
  amp = mic.getLevel();

  if (calibrandoAmp) {
    // Durante calibración guarda extremos reales del entorno para reajustar AMP_MIN/AMP_MAX.
    pisoAmp = min(pisoAmp, amp);
    techoAmp = max(techoAmp, amp);
  } else {
    null;
  }
  
  gestorAmp.actualizar(amp);

  // Variables derivadas del análisis: intensidad (amplitud) y altura (pitch) suavizadas.
  intensidad = gestorAmp.filtrada;
  altura = gestorFrec.filtrada;
  //difAltura = gestorFrec.derivada * 10;
  
  if (intensidad > umbralRuido){
    haySonido = true;
  } else {
    haySonido = false;
  }

     // Detectores de flanco para disparar eventos una sola vez en inicio/fin de sonido.
  if (haySonido == true && antesHabiaSonido == false){
    empezoElSonido = true;
  } else{
    empezoElSonido = false;
  }
  if (haySonido == false && antesHabiaSonido == true){
    terminoElSonido = true;
  }else {
    terminoElSonido = false;
  }

  if (empezoElSonido == true) {
    // Reinicia temporización de evento sonoro y cierra el tramo de silencio previo.
    marcaInicioSonido = millis();
    durSilencio = millis() - marcaFinSonido;
    sonidoLargo = false;
  }

  if (haySonido == true) {
    durSonido = millis() - marcaInicioSonido;
    if (durSonido >= umbralDuracionSonido){
      sonidoLargo = true;
    }else{
      sonidoLargo = false;
    }
  }

  if (terminoElSonido == true) {
    // Al finalizar, fija la duración final para clasificar el último evento.
    durSonido = millis() - marcaInicioSonido;
    marcaFinSonido = millis();
    if (durSonido >= umbralDuracionSonido){
      ultimoSonidoLargo = true;
    }else{
      ultimoSonidoLargo = false;
    }
    sonidoLargo = false;
  }

  if (haySonido == false) {
    durSilencio = millis() - marcaFinSonido;
  }

  if (estado == "comenzar"){
    if (audioIniciado == true){
      estado = "obra";
    }else{
      fill(0);
      textFont(fuenteTexto);
      textAlign(CENTER, CENTER);
      textSize(40);
      text("Hacé click para comenzar", width / 2, height / 2);
    }
  }else if (estado == "obra"){
    obra.dibujar(intensidad, notaMidi, haySonido, durSonido, umbralDuracionSonido);
  }

 /*fill(255,0,0);
 textAlign(CENTER, CENTER);
 textSize(40);
 text(durSonido, width / 2, height / 2);*/

  if (modoDifference) { 
    fill(255); 
    noStroke(); 
    blendMode(DIFFERENCE); 
    rect(0, 0, width, height); 
    blendMode(BLEND); 
  }
  


  // MONITOR VISUAL (Opcional: te ayuda a saber qué está leyendo la IA en la esquina de la pantalla)
  /*fill(0);
  noStroke();
  textSize(16);
  text("IA detecta: " + label, 20, 30);*/
  

  //---------MONITOREO------
  if (monitor) {
    antesHabiaSonido = haySonido; //guardo el estado anterior
    return;
  }


  antesHabiaSonido = haySonido; //guardo el estado anterior

}

//-------INICIALIZACION DE AUDIO-----
async function iniciarAudio() {
  if (audioIniciado) {
    return;
  }

  try {
    // Requisito del navegador: activar WebAudio con interacción del usuario.
    await userStartAudio();
    mic.start(
      () => {
        audioIniciado = true;
        marcaInicioSonido = millis();
        marcaFinSonido = millis();
        // Pitch detection se inicializa cuando el stream del micrófono ya existe.
        startPitch();

        classifier = ml5.soundClassifier('https://teachablemachine.withgoogle.com/models/ykJlJOKUs/model.json', () => {
          classifier.classify(gotResult);
        });
      },

      
      (error) => {
        console.error("No se pudo iniciar el microfono", error);
      },
    );
  } catch (error) {
    console.error("No se pudo habilitar el contexto de audio", error);
  }
}

function mousePressed() {
  iniciarAudio();
}

function keyPressed() {
  if (key === "c" || key === "C") {
    calibrandoAmp = !calibrandoAmp;
    // Exporta rápidamente los extremos capturados para pegarlos en configuración.
    console.log("AMP_MIN =", pisoAmp);
    console.log("AMP_MAX =", techoAmp);
    console.log(`let AMP_MIN = ${pisoAmp}; let AMP_MAX = ${techoAmp};`);
  }
}

//----------------DETECCION DE FRECUENCIA------------
// inicia el modelo de Machine Learning para deteccion de pitch
function startPitch() {
  // Conecta el modelo CREPE al stream de entrada actual.
  pitch = ml5.pitchDetection(
    model_url,
    getAudioContext(),
    mic.stream,
    modelLoaded,
  );
}

function modelLoaded() {
  getPitch();
}

function getPitch() {
  pitch.getPitch(function (err, frequency) {
    if (err) {
      console.error(err);
      getPitch();
      return;
    }

    if (frequency) {
      frec = frequency;
      // Traduce frecuencia continua a escala MIDI para analizar altura musical.
      notaMidi = freqToMidi(frequency);
    } else {
      frec = 0;
      notaMidi = 0;
    }

    gestorFrec.actualizar(notaMidi);
    // Consulta continua para mantener actualización de altura en tiempo real.
    getPitch();
  });
}

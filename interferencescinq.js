let obra;
let imgCirculos;
let mouseClickeado = true;
let estado = "comenzar";
let fuenteTexto;
let fuenteMonitor;


//-------------CONFIGURACION INICIAL-----------------
let AMP_MIN = 0.001;
let AMP_MAX = 0.563;

let NOTA_MIN = 48;
let NOTA_MAX = 76;

let calibrandoAmp = true;
let monitor = false;

let umbralRuido = 0.1;
let umbralDuracionSonido = 1300;

//-------------SONIDO GENERAL-----------------
let mic;
let audioIniciado = false;

//-------------AMPLITUD-----------------
let pisoAmp = Infinity;
let techoAmp = -Infinity;
let amp = 0;
let intensidad = 0;

//----------ANALISIS FRECUENCIA------
let pitch;
const model_url =
  "https://cdn.jsdelivr.net/gh/ml5js/ml5-data-and-models/models/pitch-detection/crepe/";

let frec = 0;
let notaMidi = 0;
let altura = 0;
let difAltura = 0;

//--------GESTORES-------
let gestorAmp;
let gestorFrec;

//-------ESTADOS Y EVENTOS DE SONIDO-----
let haySonido = false;
let antesHabiaSonido = false;
let empezoElSonido = false;
let terminoElSonido = false;

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
  fuenteTexto = loadFont("data/STONIN_.TTF");
  fuenteMonitor = loadFont("data/javatext.ttf");
}

//=================================
//              SETUP
//=================================
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

//=================================
//              DRAW
//=================================

function draw() {
  background(255);

  //------ACTIVACION DE AUDIO----
  if (!audioIniciado) {
    fill(0);
    textFont(fuenteTexto);
    textAlign(CENTER, CENTER);
    textSize(40);
    text("Hacé click para comenzar", width / 2, height / 2);
    return;
  }

  amp = mic.getLevel();

  if (calibrandoAmp) {
    // Captura extremos de amplitud observados para ajustar el rango del gestor.
    pisoAmp = min(pisoAmp, amp);
    techoAmp = max(techoAmp, amp);
    fill(255, 0, 0);
  } else {
    fill(0);
  }

  gestorAmp.actualizar(amp);

  // Variables derivadas del análisis: intensidad (amplitud) y altura (pitch) suavizadas.
  intensidad = gestorAmp.filtrada;
  altura = gestorFrec.filtrada;
  difAltura = gestorFrec.derivada * 10;

  haySonido = intensidad > umbralRuido;

  // Detectores de flanco para disparar eventos una sola vez en inicio/fin de sonido.
  empezoElSonido = haySonido && !antesHabiaSonido;
  terminoElSonido = !haySonido && antesHabiaSonido;

  if (empezoElSonido) {
    // Reinicia temporización de evento sonoro y cierra el tramo de silencio previo.
    marcaInicioSonido = millis();
    durSilencio = millis() - marcaFinSonido;
    sonidoLargo = false;
  }

  if (haySonido) {
    durSonido = millis() - marcaInicioSonido;
    sonidoLargo = durSonido >= umbralDuracionSonido;
  }

  if (terminoElSonido) {
    // Al finalizar, fija la duración final para clasificar el último evento.
    durSonido = millis() - marcaInicioSonido;
    marcaFinSonido = millis();
    ultimoSonidoLargo = durSonido >= umbralDuracionSonido;
    sonidoLargo = false;
  }

  if (!haySonido) {
    durSilencio = millis() - marcaFinSonido;
  }

  if (estado == "comenzar"){
    if (audioIniciado == true){
      estado = "obra";
    }
  }else if (estado == "obra"){
    obra.dibujar(intensidad, notaMidi, haySonido, durSonido, umbralDuracionSonido);
  }

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
    monitoreo();
    antesHabiaSonido = haySonido; //guardo el estado anterior
    return;
  }


  antesHabiaSonido = haySonido; //guardo el estado anterior

}

//=================================
//              FUNCIONES
//=================================

//-------MONITOREO------

function monitoreo() {
  background(0);
  textFont(fuenteMonitor);
  textSize(20);
  textAlign(LEFT, BASELINE);
  text(
    "AMP: " +
      amp.toFixed(3) +
      " | pisoAmp: " +
      pisoAmp.toFixed(3) +
      " | techoAmp: " +
      techoAmp.toFixed(3),
    50,
    50,
  );

  text("FREC: " + frec.toFixed(2), 50, 100);
  text("NOTA: " + notaMidi.toFixed(2), 50, 150);
  text("INTENSIDAD: " + intensidad.toFixed(2), 50, 200);
  text("ALTURA: " + altura.toFixed(2), 50, 250);
  text("DIF ALTURA: " + difAltura.toFixed(2), 50, 300);
  text("DUR SONIDO: " + (durSonido / 1000).toFixed(2) + " s", 50, 350);
  text("DUR SILENCIO: " + (durSilencio / 1000).toFixed(2) + " s", 50, 400);
  text(
    "SONIDO LARGO: " + (sonidoLargo ? "SI" : "NO") +
      " | ULTIMO: " + (ultimoSonidoLargo ? "SI" : "NO") +
      " | UM. " + (umbralDuracionSonido / 1000).toFixed(2) + " s",
    50,
    450,
  );

  gestorAmp.dibujar(width - 270, 100);
  gestorFrec.dibujar(width - 270, 200);
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

function touchStarted() {
  iniciarAudio();
  return false;
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

//--------TECLADO------
function keyPressed() {
  if (key === "c" || key === "C") {
    calibrandoAmp = !calibrandoAmp;
    // Exporta rápidamente los extremos capturados para pegarlos en configuración.
    console.log("AMP_MIN =", pisoAmp);
    console.log("AMP_MAX =", techoAmp);
    console.log(`let AMP_MIN = ${pisoAmp}; let AMP_MAX = ${techoAmp};`);
  }

  if (key === "m" || key === "M") {
    monitor = !monitor;
  }
}

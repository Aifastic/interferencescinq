class Obra {
  constructor() {
    this.seriesCirculos = [];
    this.circulosTinte = [];
    this.a = [];
    this.cantCirculosTinte = round(random(6, 15));
  }

  iniciar() {
    let posXCirculosConcentricos;
    let posYCirculosConcentricos;
    let numLineas = 7;
    let intervalo = round(width / (numLineas-1));
    let numCirculo = 0;
    for (let i=0; i<numLineas; i++) {
      let cantCirculosLinea = round(random(5, 8));
      posXCirculosConcentricos = i * intervalo;
      for (let j=0; j < cantCirculosLinea; j++) {
        posYCirculosConcentricos = j * height / (cantCirculosLinea-1);
        let posXRand = posXCirculosConcentricos + round(random(-40, 40));
        let posYRand = posYCirculosConcentricos + round(random(-30, 30));
        this.seriesCirculos[numCirculo] = new SerieCirculos(posXRand, posYRand);
        numCirculo++;
      }
    }
    this.seriesCirculos = shuffle(this.seriesCirculos);


    for (let i=0; i<this.cantCirculosTinte; i++ ) {
      this.a.push(new CirculoTinte());
    }
  }

  dibujar(intensidad, notaMidi, haySonido, durSonido) {

    for (let i=0; i<this.seriesCirculos.length; i++) {
      this.seriesCirculos[i].iniciar();
      this.seriesCirculos[i].dibujar(intensidad, haySonido, durSonido);
    }

    for ( let i=0; i<this.cantCirculosTinte; i++ ) {
      this.a[i].mover(notaMidi, haySonido, durSonido, umbralDuracionSonido);
      this.a[i].dibujarCirculo();
    }
    
    }
  }

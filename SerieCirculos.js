class SerieCirculos {
  constructor(posXCirculosConcentricos, posYCirculosConcentricos) {
    this.circulosOpacos = [];
    this.cant = round(random(6,11));
    this.posXCirculosConcentricos = posXCirculosConcentricos;
    this.posYCirculosConcentricos = posYCirculosConcentricos;
    this.umbralDuracionAplauso = 470;
  }

  iniciar() {
    for (let i=0; i<=this.cant; i++) {
      this.circulosOpacos[i] = new CirculoOpaco();
    }
  }

  dibujar(intensidad, haySonido) {
    for (let i=0; i<=this.cant; i++) {
      let tam;
      let mapInt = map(intensidad, 0,1,0,15);
      if (haySonido == true && durSonido >= this.umbralDuracionAplauso){ 
        tam = (this.cant-i) * 20 + mapInt;
      }else{
        tam = (this.cant-i) * 20;
      }
        this.circulosOpacos[i].dibujar(this.posXCirculosConcentricos, this.posYCirculosConcentricos, tam, i);
      
    }
    
  }
}

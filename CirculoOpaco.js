class CirculoOpaco {
  constructor() {
    this.color1 = 0;
    this.color2 = 255;
  }

  dibujar(posXCirculosConcentricos, posYCirculosConcentricos, tam, patron) {
    if (patron % 2 == 0) {
      fill (this.color1);
      if (patron % 3 == 0) {
        strokeWeight(0);
      } else {
        strokeWeight(8);
      }
      stroke(this.color1);
    } else if (patron % 2 === 1) {
      fill(this.color2);
      if (patron % 3 == 0 ) {
        strokeWeight(0);
      } else {
        strokeWeight(8);
      }
      stroke(this.color2);
    }
    ellipse(posXCirculosConcentricos, posYCirculosConcentricos, tam, tam);
  }
}

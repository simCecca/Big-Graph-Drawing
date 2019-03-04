class Edge{

    constructor(source, target, color = 'black', block = ''){
        this.id = source.name.concat(target.name);
        this.source = source;
        this.target = target;
        this.color = color;
        this.x1 = source.x;
        this.x2 = target.x;
        this.y1 = source.y;
        this.y2 = target.y;
        //if this edge is an edge from a cutvertex to a cutVertex, then there is a biconnected block  between them
        this.block = block;
        this.x3 = 0;
        this.y3 = 0;
        this.x4 = 0;
        this.y4 = 0;
    }

    setIntermediateCoordinates(){
        let x = (this.source.x + this.target.x) / 2;
        let y = (this.source.y + this.target.y) / 2;


        let c1 = (x - this.block.x);
        let c2 = (y - this.block.y);
        let i = Math.sqrt(c1 ** 2 + c2 ** 2);
        let alphaSource = (c1 === 0 && i === 0) ? 0 : Math.acos(c1 / i);
        if (this.source.y < this.block.y)
            alphaSource = 3.14 - alphaSource + 3.14;

        let proportion = i / (this.block.currentDimension*2);
        if(proportion > 4 && (x > this.block.x)) {
            this.x3 = this.x4 = this.block.x - (this.block.currentDimension + i * 0.3) * Math.cos(alphaSource);
            this.y3 = this.y4 = this.block.y - (this.block.currentDimension + i * 0.3) * Math.sin(alphaSource);
        }
        else{
            this.x3 = this.x4 = this.block.x;
            this.y3 = this.y4 = this.block.y;
        }
        /*
      let c1 = (this.source.x - this.block.x);
      let c2 = (this.source.y - this.block.y);
      let i = Math.sqrt(c1**2 + c2**2);
      let alphaSource = (c1 === 0 && i === 0) ? 0 : Math.acos(c1 / i);
      if(this.source.y < this.block.y)
          alphaSource = 3.14 - alphaSource + 3.14;

      c1 = (this.block.x - this.target.x);
      c2 = (this.block.y - this.target.y);
      let i2 = Math.sqrt(c1**2 + c2**2);
      let alphaTarget = (c1 === 0 && i2 === 0) ? 0 : Math.acos(c1 / i2);
      if(this.block.y < this.target.y)
          alphaTarget = 3.14 - alphaTarget + 3.14;


      this.x3 = this.block.x + (i) * Math.cos(alphaSource);
      this.y3 = this.block.y + (i) * Math.sin(alphaSource);
      this.x4 = this.block.x + (i2) * Math.cos(alphaTarget);
      this.y4 = this.block.y + (i2) * Math.sin(alphaTarget);
      */

    }

}
class Cone{

    constructor(source,target, size){
        this.id = source.name.concat(target.name);
        this.source = source;
        this.target = target;
        this.p1 = [0,0];
        this.p2 = [0,0];
        this.p3 = [0,0];
        this.color = "red";
        this.stroke = "black";
        this.stroke_width = 0.1;
        this.size = size;
        this.maxInTheGraph = 0;
        this.fanProportion = 0;
        this.color = 0;
        this.points = "";
        this.edges = [];
        this.currentAlphaPoint2 = 0;
        this.currentAlphaPoint3 = 0;
    }

    setSouce(zoom){
        if (zoom === 1) {
            this.target.currentDimension = this.target.dimension;
            if (this.target.hide) this.target.currentDimension = 0;
        }
        else {
            if (zoom * 0.293 >= 2)
                this.target.currentDimension = ((this.target.dimension / (zoom * 0.293)));
        }
        let c1 = (this.source.x - this.target.x);
        let c2 = (this.source.y - this.target.y);
        let i = Math.sqrt(c1**2 + c2**2);
        let alpha = (c1 === 0 && i === 0) ? 0 : Math.acos(c1 / i);
        if(this.source.y < this.target.y)
            alpha = 3.14 - alpha + 3.14;
        this.currentAlphaPoint2 = alpha + (6.28 / 4);
        //let currentAlphaPoint3 = (alpha - (6.28 / 4) < 0) ? 6.28 + alpha - (6.28 / 4) : alpha - (6.28 / 4);
        this.currentAlphaPoint3 = alpha - (6.28 / 4);
        this.cDimension = this.target.currentDimension * this.size / this.target.maxConeSize;
        this.dimensionThreshold =(this.target.root) ? this.cDimension / 4 : this.cDimension;//(this.cDimension < (this.target.currentDimension / 2)) ? this.cDimension : this.target.currentDimension / 2;
        if(this.dimensionThreshold === 0) this.dimensionThreshold = 1;
        this.p1 = [this.source.x, this.source.y];
        this.p2 = [this.target.x + this.dimensionThreshold * Math.cos(this.currentAlphaPoint2), this.target.y + this.dimensionThreshold * Math.sin(this.currentAlphaPoint2)];
        this.p3 = [this.target.x + this.dimensionThreshold * Math.cos(this.currentAlphaPoint3), this.target.y + this.dimensionThreshold * Math.sin(this.currentAlphaPoint3)];
        this.points = ""+ this.p1[0] + "," + this.p1[1] + " " + this.p2[0] + "," + this.p2[1] + " " + this.p3[0] + "," + this.p3[1];
        return this.points;
    }

    setColor(max){
        let minDimension = this.target.maxConeSize * (this.target.currentDimension / 2) / this.target.currentDimension;
        let importance = 200;
        if(this.cDimension > this.target.currentDimension / 2 && this.size / max > 0.5) {
            importance -= ((this.size + 1 - minDimension) / (max - minDimension + 1) * 150);
        }
        else{
            importance = 235 - (this.size / max * 35);
        }
        importance = 175;
        this.color = "rgb(" + importance + "," + importance + "," + importance + "," + "0.3" + ")";
        return this.color;
    }

    setCoordinateToTheEdges(){
        let offset = this.dimensionThreshold / this.edges.length;
        let current = 0;
        this.edges.forEach((e, index) => {
            let currentAngle = (index % 2 === 0) ? this.currentAlphaPoint2 : this.currentAlphaPoint3;
            e.x3 = this.target.x + current * Math.cos(currentAngle);
            e.y3 = this.target.y + current * Math.sin(currentAngle);
            (index % 2 === 0) ? current += offset : current;
            e.x4 =  e.x3;
            e.y4 = e.y3;
            e.id = e.id + index;
        });
    }
}
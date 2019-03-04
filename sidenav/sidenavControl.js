class Controller {

    constructor() {
       this.renderer = null;
        // window.addEventListener("resize", () => this.onWindowSizeChange());
        this.loader = new GraphLoader();

    }

    kindOfProcessor(processor) {
        if (processor === "CPU") {
            let width = window.screen.availWidth * 0.97;
            let height = window.screen.availHeight;
            d3.select('#svgdiv').html('<svg id="svgCanvas" width= "100%" height=' + height*0.8 + 'px style=" border : 1px solid gray; background-color: white" transform="translate(0,50)"></svg>');
            this.renderer = new Renderer();
        }
        else{
            this.renderer = new GpuRenderer();
       }
    }

    onFileSelect(evt) {
        const files = evt.target.files;
        const file = files[0];
        dialogueBox("Downloading of the selected graph");
            //dialogueBox("Downloading of the selected graph");
        this.loader.loadFromFile(file)
            .then(graph => {
                this.drawGraph(graph);})
            //.catch(err => this.showError(err));

    }

    onAvailableGraphs(file){
        console.log(file);
        this.loader.loadFromAvailableGraphs(file)
            .then(graph => this.drawGraph(graph))
            //.catch(err => this.showError(err));
    }

    drawGraph(graph) {
        //document.getElementById("dialogText").innerHTML = "Graph Loaded";
        //this.renderer.drawBCTree(graph);
        this.renderer.setGraph(graph);
    }

    stopZoom(){
        this.renderer.stopZoom();
    }


}

const ctrl = new Controller();
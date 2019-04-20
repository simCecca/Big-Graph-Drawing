class Controller {

    constructor() {
       this.renderer = null;
       this.loader = new GraphLoader();
    }

    /*TODO: togli st'svg da qui e caricalo direttamente nell'html*/
    kindOfProcessor(processor) {
        if (processor === "CPU") {
            let width = window.screen.availWidth * 0.97;
            let height = window.screen.availHeight;
            d3.select('#svgdiv').html('<svg id="svgCanvas" width= "100%" height=' + height*0.8 + 'px shape-rendering="crispEdges" style=" border : 1px solid gray; background-color: white" transform="translate(0,50)"></svg>');
            this.renderer = new Renderer();
        }
        else{
            this.renderer = new GpuRenderer();
       }
    }

    onGetFromServer(){
        const graphName = document.getElementById("graphName").value;
       // const operation = document.getElementById("kindOperation").value;
        const requestPath = "http://localhost:1234/bcgraph";
        const requestQuery = requestPath + "?name=" + graphName;
        console.log(graphName);

        this.loader.loadFromServer(requestQuery)
            .then(graph => this.drawGraph(graph))
            .catch(err => this.showError(err));
    }

    onTakeNodeFromServer(){
        const nodeName = document.getElementById("nodeName").value;
        const requestQuery = "http://localhost:1234/bcgraph/node?id=" + nodeName;

        this.loader.loadNodeFromTheServer(requestQuery)
            .then(node => this.renderer.querySingleNode(node))
            .catch(err => this.showError(err));

    }

    onTakeShorthestPath(){
        const nodeName = document.getElementById("nodeName").value;
        const requestQuery = "http://localhost:1234/bcgraph/node?id=" + nodeName;

        this.loader.loadNodeFromTheServer(requestQuery)
            .then(node => this.renderer.querySingleNode(node))
            .catch(err => this.showError(err));

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

    showError(msg) {
        document.getElementById("errorDialog").style.top = "0";

        document.getElementById("errorMsg").innerText = msg;
    }
    closeErrorDialog() {
        document.getElementById("errorDialog").style.top = "-100%";
    }


}

const ctrl = new Controller();
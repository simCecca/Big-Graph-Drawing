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

    //ask f
    onGetFromServerIfExistAJSONFileCalculated(){
        const graphName = document.getElementById("graphName").value;
       // const operation = document.getElementById("kindOperation").value;
        const requestPath = "http://localhost:1234/bcgraph";
        const requestQuery = requestPath + "?name=" + graphName;

        this.loader.loadFromServer(requestQuery)
            .then(graph => {
                let calculateJson = "";
                if(graph === "notExist") {
                    calculateJson = "true";
                }
                else{
                    this.drawGraph(graph);
                    calculateJson = "false";
                }
                this.onDecomposeGraphFromServer(graphName, calculateJson);
            })
            //.catch(err => this.showError(err));
    }

    onDecomposeGraphFromServer(name, returnJson = "false"){
        const graphName = name;
        // const operation = document.getElementById("kindOperation").value;
        const requestPath = "http://localhost:1234/bcgraph/onlydec";
        const requestQuery = requestPath + "?name=" + graphName + "&json=" + returnJson;

        this.loader.loadFromServer(requestQuery)
            .then(graph => {
                if(returnJson !== "false")
                    this.drawGraph(graph);
                this.showSuccess();
            })
            .catch(err => this.showError(err));
    }


    onFileSelect(evt) {
        const files = evt.target.files;
        const file = files[0];
        dialogueBox("Downloading of the selected graph");

        this.loader.loadFromFile(file)
            .then(graph => {
                this.drawGraph(graph);
                this.onDecomposeGraphFromServer(file.name.split(".")[0]);
            })
            .catch(err => this.showError(err));

    }

    onAvailableGraphs(file){

        this.loader.loadFromServer(file)
            .then(graph => {
                this.drawGraph(graph);
                this.onDecomposeGraphFromServer(file.split("/")[2].split(".")[0]);
            })
            .catch(err => this.showError(err));
    }

    _parseSetOfNodes(nodes){
        return nodes.split(/[.,;\/ -]/).filter(string => string !== "");
    }

    onTakeNodeFromServer(){
        const nodeName = document.getElementById("nodeName").value;
        let queue = this._parseSetOfNodes(nodeName);
        const requestQuery = "http://localhost:1234/bcgraph/node?id=";
        this._takeCurrentNode(requestQuery, queue, (n) => this.renderer.querySingleNode(n));
    }

    _takeCurrentNode = (path, queue, renderNode) => {
        this.loader.loadFromTheServer(path + queue.pop())
            .then(node => {
                renderNode(node);
                if(queue.length > 0) this._takeCurrentNode(path, queue, renderNode);
            })
            .catch(err => this.showError(err));
    };

    onTakeNodeNeighboursFromServer(){
        const nodeName = document.getElementById("nodeName").value;
        let queue = this._parseSetOfNodes(nodeName);
        const requestQuery = "http://localhost:1234/bcgraph/neighbours?id=";
        this._takeCurrentNode(requestQuery, queue, (n) => this.renderer.drawNeighbours(n));
    }

    onTakeShorthestPath(){
        const startNode = document.getElementById("startNode").value;
        const targetNode = document.getElementById("targetNode").value;
        const requestQuery = "http://localhost:1234/bcgraph/spath?start=" + startNode + "&target=" + targetNode;

        this.loader.loadFromTheServer(requestQuery)
            .then(nodes => this.renderer.drawShorthestPath(nodes))
            .catch(err => this.showError(err));

    }

    drawGraph(graph) {
        //document.getElementById("dialogText").innerHTML = "Graph Loaded";
        //this.renderer.drawBCTree(graph);
        this.renderer.setGraph(graph);
    }

    stopZoom(){
        this.renderer.stopZoom();
    }

    resetQuery(){
        this.renderer.resetQuery();
    }

    showError(msg) {
        document.getElementById("errorDialog").style.top = "0";
        document.getElementById("errorMsg").innerText = msg;
    }

    closeErrorDialog() {
        document.getElementById("errorDialog").style.top = "-100%";
    }

    showSuccess() {
        document.getElementById("successDialog").style.top = "0";
        //document.getElementById("successMsg").innerText = msg;
    }

    closeSuccessDialog() {
        document.getElementById("successDialog").style.top = "-100%";
    }

}

const ctrl = new Controller();
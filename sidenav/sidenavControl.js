class Controller {

    constructor() {
       this.renderer = null;
       this.loader = new GraphLoader();
    }

    /*TODO: togli st'svg da qui e caricalo direttamente nell'html*/
    kindOfProcessor(processor) {
        if (processor === "CPU") {
            let width = window.screen.availWidth;
            let height = window.screen.availHeight;
            d3.select('#svgdiv').html('<svg id="svgCanvas" width= "100%" height=' + height + 'px shape-rendering="crispEdges" style=" border : 1px solid gray; background-color: white" transform="translate(0,50)"></svg>');
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
        this._takeCurrentNode(requestQuery, queue, (n) => this.renderer.drawNeighbours(n, (i) => (i === 0) ? "rgb(0,75,0)" : "green"));
    }

    async onTakeNodeNeighboursIntersectionFromServer(){
        const nodeName = document.getElementById("nodeName").value;
        let queue = this._parseSetOfNodes(nodeName);
        const requestQuery = "http://localhost:1234/bcgraph/neighbours?id=";
        let nodes = [];
        const queueLength = queue.length;
        while(queue.length > 0){
            const currentNodes = await this.loader.loadFromTheServer(requestQuery + queue.pop());
            nodes.push(currentNodes);
        }
        const nodeName2occurrency = new Map(); //hashmap
        const nodeName2node = new Map();
        nodes.forEach(cNodes => {
            cNodes.neighbours.forEach(node => {
                let currentValue = nodeName2occurrency.get(node.node);
                if(currentValue !== undefined) {
                    nodeName2occurrency.set(node.node,currentValue + 1)
                }else {
                    nodeName2occurrency.set(node.node, 1);
                    nodeName2node.set(node.node, node);
                }
            });
        });
        const nodesToDraw = [];
        for (let [key, value] of nodeName2occurrency.entries()) {
            if(value === queueLength){
                nodesToDraw.push(nodeName2node.get(key));
            }
        }
        console.log(nodesToDraw);
        this.renderer.drawNeighbours({ "neighbours" : nodesToDraw}, (i) => "green");
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
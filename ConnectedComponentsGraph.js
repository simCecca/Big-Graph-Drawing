class ConnectedComponentsGraph{

    constructor(){
        this.graph = [];
    }

    addConnecredComponent(graph){
        this.graph.push(graph);
    }

    getConnectedComponent(i){
        return this.graph[i];
    }

    getAllComponents(){
        return this.graph;
    }

    calculateRootForAllCC(){
        console.log("number cc " + this.graph.length);
        this.graph.forEach(cc => {
            if(cc != undefined) {
                cc.calculateRoot();
            }
        });
    }

    removeAllCutVertex(){
        this.graph.forEach(cc => {
            if(cc != undefined) {
                cc.deleteTheCutVertex();
            }
        });
    }
}
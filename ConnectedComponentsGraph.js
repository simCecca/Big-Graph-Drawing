class ConnectedComponentsGraph{

    constructor(){
        this.graph = [];
        this.totalSize = 0;
        this.totalLogaritmicSize = 0;
    }

    addConnecredComponent(graph){
        if(graph.nodes.length > 0)
            this.graph.push(graph);
    }

    getConnectedComponent(i){
        return this.graph[i];
    }

    getAllComponents(){
        return this.graph;
    }

    getTotalLogaritmicSize(){
        if(this.totalLogaritmicSize === 0) this.graph.forEach(n => this.totalLogaritmicSize += Math.log10(n.size));
        return this.totalLogaritmicSize;
    }

    setTotalSize(tsize){
        this.totalSize = tsize;
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
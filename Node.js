class Node{

    constructor(id, bNode, size, sizeNodes, importance = -1){//todo: if I'm a node of an SPQRTree I'm not a bNode and also a cutvertex, so remove from here  the bNode
        this.x = 0;
        this.y = 0;

        this.name = id;
        this.nameOriginalGraph = -1;
        //this.name = this.name.concat(size);
        this.father = null;
        this.children = [];
        this.edges = [];
        this.numberEdgesToTheCutVertex = new Map(); // each element is composed by (nameOfCutVertex, numberOfEdgesFromThisCutVertexToThisBlock)
        this.fromCutVertexEdges = [];
        this.maxConeSize = 0;
        this.conesMap = new Map();
        this.cones = [];
        this.edgesFromCutVertexToTheBlock = [];
        this.importance = importance;
        this.cutVertexNeighboursFirst = []; //edges from this node to the other cutVertex


        this.visited = 0;
        this.visitedValue = 1;

        this.size = size;//number of edges inside the biconnectec component, if the node is a node inside a block this value represent the degree of the graph
        this.sizeNodes = sizeNodes;// number of nodes inside the biconnected component
        this.subtreeNodes = 0;
        this.weightForChildren = 0;
        this.minWidth = 0;
        this.dimension = 0;
        this.currentDimension = 0;
        //condition
        this.isBlack = false;
        this.root = false;
        this.isABNode = bNode;
        this.innerNode = false;

        //there is another parameter that is the spqrtree graph of this biconnected component
        this.biconnectedGraph = null;//hava Graph as type so have a list of all the nodes and a list of all edges inside this block

    }

    addNeighbour(neighbour){
        this.children.push(neighbour);
    }

    getSize(){
        return this.size;
    }

    getId(){
        return this.name;
    }

    getNeighbours(){
        return this.children;
    }

    getVisited(){
        return (this.visited === this.visitedValue);
    }

    getVisitedValue(){
        return this.visitedValue;
    }

    getX(){
        return this.x;
    }

    getY(){
        return this.y;
    }

    getImportance(){
        return this.importance;
    }

    getSumOfSizes(){
        let sum = 0;
        this.children.forEach((node) => {
            node.setVisitedValue(3);
            if(node.getVisited() !== true)
                sum += node.getSize();
        });
        return sum;
    }

    getDegree(){
        if(this.innerNode)
            return this.size;
        return this.children.length;
    }

    getCurrentDimension(){
        return (this.currentDimension === 0) ? this.dimension : this.currentDimension;
    }

    /*to the question: when is it better to refine the SPQRTree? I think the answer is now, after it's assignment*/
    setSPQRTree(tree){
        this.spqrTree = tree;
        this.spqrTree.getUtilities().processinOfAnSPQRTreeFromAnUnrootedTreeToARootedTree(this.spqrTree);
    }

    getSPQRTree(){
        return this.spqrTree;
    }

    setX(x){
        this.x = x;
    }

    setY(y){
        this.y = y;
    }
    setVisited(){
        this.visited = this.visitedValue;
    }

    setVisitedValue(visitedValue){
        this.visitedValue = visitedValue;
    }

    setIsBlack(value){
        this.isBlack = value;
    }

}
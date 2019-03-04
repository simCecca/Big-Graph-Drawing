// TODO: insert some methods in the the utilities Class
class Graph{

    constructor(){
        this.nodes = [];
        this.cutVertices = [];
        this.blocks
        this.edges = [];
        this.cones = [];
        this.importance = 0;
        this.maxSize = 0;
        this.maxConeSize = 0; // I know that is always positive
        this.root;
        this.utilities = new GraphUtilities();

        this.order2nodes = null;
    }

    addNode(node){
        this.nodes.push(node);
    }

    addEdge(edge){
        this.edges.push(edge);
    }

    setImportace(importance){
        this.importance = importance;
    }

    setMaxSize(max){
        this.maxSize = max;
    }

    getMaxSize(){
        return this.maxSize;
    }

    getNodes(){
        return this.nodes;
    }

    getEdges(){
        return this.edges;
    }

    getUtilities(){
        return this.utilities;
    }

    rankingOfTheNodes(){
        this.nodes.sort((a,b) => (a.size > b.size) ? -1 : ((b.size > a.size) ? 1 : 0));
    }

    //for set the biggest node like root
    calculateRoot(){
        let currentNumberOfChildrens = 0;
        this.nodes.forEach(node =>{
           if (!node.getId().includes("cut") && currentNumberOfChildrens < node.getNeighbours().length){
               this.root = node;
               currentNumberOfChildrens = this.root.getNeighbours().length;
           }
        });
    }

    //utilities-----------------------
    _initGraph(){
        if(this.root !== undefined) {
            this.nodes = [this.root];
            this.edges = [];
            return true;
        }
        else return false;
    }

    createARealTreeWithNoCicleFromSonToFather(){
        if(this._initGraph()) this._removeCircles(this.root);
    }

    _removeCirclesHideBiconnectedBlocksWithOneEdgeAnd2CutVertex(node){
        this.nodes.push(node);
        node.setVisited();
        node.children = this._removeAnElementFromAnArray(node.getNeighbours(), node);
        node.getNeighbours().forEach((children) =>  {
            children.setVisitedValue(node.getVisitedValue());
            if(!children.getVisited()){
                if(!children.getId().includes("cut")) {
                    if (children.getSize() === 1) {
                        if (children.getNeighbours().length === 1) {
                            //is a leaf
                            children.isBlack = true;
                        }
                        else {
                            //ci sono due cutvertex, uno che è il padre ed uno il figlio, notare che il figlio contiene il pradre tra i vicini
                            //quindi lo vado a rimuovere, però non so in che posizione sia
                            children.hide = true;
                        }
                    }
                }
                this.edges.push(new Edge(node,children));
                children.children = this._removeAnElementFromAnArray(children.getNeighbours(), node);// rimuovo il padre (node) dalla lista del figlio (children)
                if(children.getNeighbours().length > 0) this._removeCirclesHideBiconnectedBlocksWithOneEdgeAnd2CutVertex(children);
                else this.nodes.push(children);
            }
        });
    }
    //-----------------------------------
    _setTheEdge(cutVertex, block){
        let numberOfEdges =  block.numberEdgesToTheCutVertex.get(cutVertex.name.substring(2));
        for(let i = 0; i < Math.log10(numberOfEdges); i++) {
            let newNode = new Node(block.getId() + i, false,0);
            newNode.block = block;
            let currentEdge = new Edge(cutVertex, newNode, "red");
            block.fromCutVertexEdges.push(currentEdge);
            this.edges.push(currentEdge);
        }
    }

    _calculateFathersAndFans() {
        if (this.root != undefined) {
            this.root.getNeighbours().forEach((node) => {
                node.father = this.root; // set the father
                if (!node.isABNode) { //if this node is a cutvertex

                    //for the edges from the father
                    this._setTheEdge(node, this.root);
                    //for the edges from the childrens
                    node.getNeighbours((children) => {
                        this._setTheEdge(node, children);
                        this._calculateFathersAndFans();
                    });
                }

            });
        }
    }
    //---------------------hide biconnected blocks with one edge and 2 cutvertex----------------------------------------

    //hide the block with one edge and 2 cutvertex

    //------------------------------------------------------------------------------------------------------------------


    //removal of cut vertex by associating their children as their father's children
    deleteTheCutVertex(){
        if(this._initGraph()) this._deleteCV(this.root);
    }

    _deleteCV(node,cutV){
        let currentNodes = [];
        if(node === undefined) return;
        node.getNeighbours().forEach(child => {
            if(((cutV !== undefined) ? cutV.getId() !== child.getId() : 1 === 1) && child.getId().includes("cut")){
                child.getNeighbours().forEach(newChild => {
                    if(newChild.getId() !== node.getId()) {
                        currentNodes.push(newChild);
                        this.nodes.push(newChild);
                        this.edges.push(new Edge(node, newChild));
                        this._deleteCV(newChild, child);
                    }
                });
            }
        });
        node.children = currentNodes;
    }
    //------------------------------------------------------------------------------------------------------------------

    //removing the elementary blocks
    deleteTheElementaryBlocks(vv){
        if(this._initGraph()){
            //segno la root come visitata
            this.root.setVisitedValue(vv);
            this.root.setVisited();
            this.root.getNeighbours().forEach((node) => {
                node.setVisitedValue(vv);
                this.edges.push(new Edge(this.root,node));
                node.children = this._removeAnElementFromAnArray(node.getNeighbours(), this.root);
                //this._deleteBlocks(node);
                this._removeCirclesHideBiconnectedBlocksWithOneEdgeAnd2CutVertex(node);
            });

        }
    }

    //delete the biconnected blocks with 2 cutvertex and 1 edge and color to black the block with only one edge and one cutvertex (a leaf)
    _deleteBlocks(node){
        let newNeighbours = [];
        node.setVisited();
        this.nodes.push(node);

        node.getNeighbours().forEach((children) => {
            if(children !== undefined && !children.getVisited()) {
                let secondNodeToInsert = children;
                if (!children.getId().includes("cut")) {
                    if (children.getSize() === 1) {
                        if (children.getNeighbours().length === 1) {
                            //leaf
                            children.isBlack = true;
                            children.children = []; // rimuovo il padre
                            newNeighbours.push(children);
                        }
                        else {
                            //ci sono due cutvertex, uno che è il padre ed uno il figlio, notare che il figlio contiene il pradre tra i vicini
                            //quindi lo vado a rimuovere, però non so in che posizione sia
                            secondNodeToInsert = this._removeAnElementFromAnArray(children.getNeighbours(),node)[0];// rimuovo il padre (node) dalla lista del figlio (children)
                            secondNodeToInsert.children = this._removeAnElementFromAnArray(secondNodeToInsert.getNeighbours(), children); // rimuovo il padre (questa volta è children) dalla lista del suo figlio
                            newNeighbours.push(secondNodeToInsert);
                        }
                    }
                    else {//è un blocco non elementare, quindi gli rimuovo il padre
                        children.children = this._removeAnElementFromAnArray(children.getNeighbours(), node); // se è una foglie ha solo il padre, se non è una foglie lui verrà tolto dai figli nelle iterazioni successive
                        newNeighbours.push(children);
                    }
                }
                this._removeAnElementFromAnArray(node.children,node);//mi rimuovo dai miei figli
                this.edges.push(new Edge(node,secondNodeToInsert));
                secondNodeToInsert.setVisitedValue(node.getVisitedValue());
                this._deleteBlocks(secondNodeToInsert);
            }
        });
        if (newNeighbours.length > 0) node.children = newNeighbours;
    }
    _removeAnElementFromAnArray(array, element){
        let newArray = [];
        array.forEach((e) => {
            if(e.getId() !== element.getId())
                newArray.push(e);
        });
        return newArray;
    }
    //------------------------------------------------------------------------------------------------------------------

    sortTheCones(){
        this.cones.sort((a,b) => (a.size > b.size) ? 1 : ((b.size > a.size) ? -1 : 0));
    }
}
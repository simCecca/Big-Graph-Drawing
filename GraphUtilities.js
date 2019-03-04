class GraphUtilities{
    constructor(){

    }

    //this is the right sequence of method to call for refine a starting graph so that you have an SPQRTree
    processinOfAnSPQRTreeFromAnUnrootedTreeToARootedTree(tree){
        this.tree = tree;
        this.tree.root = this.tree.getNodes()[0];
        this.electingTheRootFromTheSPQRTree(this.tree.root, this.tree.root);//this is thhe first because now is a graph and only after decided a root we can remose some edges
        this.fromGraphToTree(this.tree.root);//now I can remove some edges
        this.createTheSetOfNodesAndEdgesForTheRenderer();
    }


    //create the set of node and edge for the renderer, because the edges before this method are mutch than the necessary
    createTheSetOfNodesAndEdgesForTheRenderer(){
        let nodes = [], edges = [];
        this._calculateTheSetOfNodesAndEdjes(this.tree.root, nodes, edges);
        this.tree.nodes = nodes;
        this.tree.edges = edges;
    }

    _calculateTheSetOfNodesAndEdjes(root, nodes, edges){
        nodes.push(root);
        root.getNeighbours((children) => {
            edges.push(new Edge(root, children));
            this._calculateTheSetOfNodesAndEdjes(children, nodes, edges);
        });
    }


    //if I arrive to a node just visited I have to remove it from my son
    fromGraphToTree(root, vv = 7){
        root.setVisitedValue(vv);
        if(!root.getVisited()) {
            let newChildren = [];
            root.getNeighbours().forEach((children) => {
                children.setVisitedValue(vv);
                if(!children.getVisited()){
                    newChildren.push(children);
                }
            });
        }

    }

    //in this case the root is the p node with more neighbour
    electingTheRootFromTheSPQRTree(root, vv = 6){
        root.setVisitedValue(vv);
        if(!root.getVisited()) {
            root.setVisited();
            root.getNeighbours().forEach((neighbour) => {
                neighbour.setVisitedValue(vv);
                if(!neighbour.getVisited()) {
                    if (neighbour.getId().includes("p")) {
                        if (this.tree.root.getNeighbours().length < neighbour.getNeighbours().length || (!this.tree.root.getId().includes("p")))
                            this.tree.root = neighbour;
                    }
                   this.electingTheRootFromTheSPQRTree(neighbour);
                }
            });
        }
    }

}
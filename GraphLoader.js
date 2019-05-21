class GraphLoader{

    constructor(){
        this.server = new Server();
    }

    //load the wole graph from the server
    async loadFromServer(graphPath){
        const graph = await this.server.loadFromServer(graphPath);

        if(graph === "notExist" || graph === "decomposed")
            return graph;
        return this.loadGraph(graph);
    }

    //load a single node from the graph taking information by it's block and it's name in the block
    //shortest path from server
    async loadFromTheServer(graphPath){
        return await this.server.loadFromServer(graphPath);
    }

    //load from file
    async loadFromFile(file) {
        let json = await this._load(file);
        dialogueBox("loading of the graph");
        await sleep(50);
        return this.loadGraph(json);
        //now that the file is loaded, call the renderer to plot every kind of plotting
        // let renderer = new Renderer(json);
    }

    _load(file) {
        const reader = new FileReader();
        const resultPromise = new Promise((resolve, reject) => {
            reader.onload = (event) => {
                try {
                    resolve(JSON.parse(event.target.result));
                }catch (e) {
                    reject(Error("The selected file is not a valid json encoded graph"));
                }
            }
        });
        reader.readAsText(file);
        return resultPromise;
    }

    async loadFromAvailableGraphs(path){
        dialogueBox("Downloading of the selected graph");
        const response = await fetch(path);
        const jsonGraph = await response.json();
        dialogueBox("Graph Loading");
        await sleep(50);
        return this.loadGraph(jsonGraph);
    }

    calculateTheCutVertexId2CutVertexSonId(mappa, cutVerticies){
        cutVerticies.forEach((currentCutVId) => {
            let currentNeighbours = [];
            currentCutVId.children.forEach((son) => {
                if(son.name > 0)
                    currentNeighbours.push([son.name, son.commonBcomponent]);//invece che introdurre solo il nome del cutVertex, introduco anche quello del blocco che connette questi due cutvertex [son.name, son.commonBcomponent]
            });
            if(currentNeighbours.length > 0)
                mappa.set(currentCutVId.name, currentNeighbours);
        });
    }

    /*for creating the graph structure*/
    loadGraph(jsonGraph){
        let sommaNodiInterni = 0;
        //the first thing to do is to create the connected components graph in witch we insert each connected components (subgraph)
        let connectedComponentsGraph = new ConnectedComponentsGraph();
        connectedComponentsGraph.setTotalSize(jsonGraph.size);

        //for each connected components i create a graph and insert it into the total graph
        jsonGraph.children.forEach((connected, i) => {
            let graph = new Graph();

            let id2connectedComponents = new Map();
            let id2BiconnectedBlocks = new Map();

            let currentCC = "a".concat(i);
            //the importance of a connected components depends on their number of edges
            graph.setImportace(connected.size / jsonGraph.size);
            graph.setSize(connected.size);

            //creo una mappa che ha come id un cutVertex e come valore la lista dei cutVertex che gli sono vicini nel grafo originale
            let cutVertexId2cutVertexSonId = new Map();
            this.calculateTheCutVertexId2CutVertexSonId(cutVertexId2cutVertexSonId, connected.cutVerticies);

            connected.children.forEach((node) => { //now node is a node of the current connected component
                let currentNode = new Node(currentCC.concat(node.name), true, node.size, node.sizeNodes, (node.size / connected.size));
                node.children.forEach((neighbour) => {
                    //if I have not created this cut vertex I create it and then set the currentNode as neighbour
                    if(id2connectedComponents.get(currentCC.concat(neighbour.name)) === undefined){
                        let currentCutV = new Node(currentCC.concat(neighbour.name) , false, 1, 1);
                        currentCutV.addNeighbour(currentNode);
                        id2connectedComponents.set(currentCutV.getId(),currentCutV);
                        //currentNode.addNeighbour(currentCutV);
                    }
                    else{id2connectedComponents.get(currentCC.concat(neighbour.name)).addNeighbour(currentNode);
                       // currentNode.addNeighbour(id2connectedComponents.get(neighbour.name));
                    }
                    //adding the current cutvertex tho this Biconnected block
                    currentNode.addNeighbour(id2connectedComponents.get(currentCC.concat(neighbour.name)));
                    currentNode.numberEdgesToTheCutVertex.set(neighbour.name, neighbour.numberEdges);
                });
                graph.addNode(currentNode);
                id2BiconnectedBlocks.set(currentNode.getId(),currentNode);

                //creating the tree structure for this biconnected component (if it exist)
                if(node.tree !== undefined){
                    let newTree = new Graph();
                    let idTreeNode2sons = new Map();
                    node.tree.forEach((treeNode) => {
                        let idRoot = currentNode.getId().concat(treeNode.name);
                        //in this case I use the type Graph for representing a tree because the tree is unrooted and for not replicating the method (ultilities)
                        let currentTreeNode = idTreeNode2sons.get(idRoot);
                        if(currentTreeNode === undefined){
                            currentTreeNode = new Node(idRoot, false, node.size, node.sizeNodes, 0);
                            idTreeNode2sons.set(idRoot, currentTreeNode);
                        }
                        treeNode.children.forEach((treeNodeSons) => {
                            let  id = currentNode.getId().concat(treeNodeSons.name);
                            let currentSon = idTreeNode2sons.get(id);
                            if(currentSon === undefined) {
                                currentSon = new Node(id, false, node.size, node.sizeNodes, 0);
                                idTreeNode2sons.set(id, currentSon);
                            }
                            currentTreeNode.addNeighbour(currentSon); //add this son to the neighbour of the current root
                            newTree.addEdge(new Edge(currentTreeNode,currentSon));//insert this edge in the SPQRTree
                        });
                        newTree.addNode(currentTreeNode);//insert the current node in the SPQRTree

                    });
                    currentNode.setSPQRTree(newTree);
                }
                //--------------------------------end of the SPQRTree creating------------------------------------------
                //--------------------------------creating the biconnected graph inside this block----------------------
                let newGraph = new Graph();
                if(node.innerGraph !== undefined){
                    node.innerGraph.forEach((innerNode) => {
                        let idRoot = currentNode.getId().concat("a" + innerNode.name);
                        let currentInnerNode = new Node(idRoot, true, innerNode.size, node.sizeNodes, 0); // in this case size is the degree
                        currentInnerNode.nameOriginalGraph = innerNode.nameOriginal;
                        currentInnerNode.innerNode = true;
                        currentInnerNode.father = currentNode;
                        newGraph.nodes.push(currentInnerNode);
                        sommaNodiInterni++;
                    });
                    currentNode.biconnectedGraph = newGraph;
                }
            });
            id2connectedComponents.forEach((value, key, map) => {//in this map there are only the cutVertex
                graph.addNode(value);
                //for the edges
                value.getNeighbours().forEach((neighbour) => {
                    const currentNumber = neighbour.numberEdgesToTheCutVertex.get(value.name.substring(2));
                    if(!value.isABNode && currentNumber > 0){
                        let currentCone = new Cone(value, neighbour, currentNumber);
                        let currentCones = value.conesMap.get(currentCone.id); // cone id ==> source.name.concat(targhet.name)
                        (currentCones != undefined) ? currentCones = currentCone : currentCones = currentCone;
                        value.conesMap.set(currentCone.id, currentCones);
                        value.cones.push(currentCone);
                        graph.cones.push(currentCone);
                        if(currentNumber > graph.maxConeSize)
                            graph.maxConeSize = currentNumber;
                        if(currentNumber > neighbour.maxConeSize)
                            neighbour.maxConeSize = currentNumber;
                    }
                    else {
                        let currentEdge = new Edge(neighbour, value);
                        value.edges.push(currentEdge);
                        neighbour.edges.push(currentEdge);
                        graph.addEdge(currentEdge);
                    }
                })
            });
            graph.calculateRoot();
            cutVertexId2cutVertexSonId.forEach((value, key, map) => {
                let currentCutV = id2connectedComponents.get(currentCC.concat("cutv" + key));
                value.forEach(([son, block]) => {
                    let currentSon = id2connectedComponents.get(currentCC.concat("cutv" + son));
                    //these are the edges between cut-vertex so that verteces that connect cut-verteces together
                    let e1 = new Edge(currentCutV, currentSon, "rgb(0,0,0)", id2BiconnectedBlocks.get(currentCC.concat("bc" + block)));
                    currentCutV.cutVertexNeighboursFirst.push(e1);
                    let c = currentCutV.conesMap.get(e1.id);
                    if(c != undefined)
                        c.edges.push(e1);
                });
            });
            graph.setId(i);
            connectedComponentsGraph.addConnecredComponent(graph);
        });

        // for the calculation of the root for each cc, as the node that has the greatest number of childrens
        //connectedComponentsGraph.calculateRootForAllCC();

        return connectedComponentsGraph;
    }

}
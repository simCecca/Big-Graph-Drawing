class DrawAlgorithm{

    constructor(weight, height){
        this.weight = weight;
        this.height = height;
    }


    //------------------------------------------------------------------------------------------------------------------

    _calculateSetsOfChildren(root){
        let set = new Map(), currArray = [], max = 0, min = 500;
        root.getNeighbours().forEach((child) => {
            currArray = set.get(child.deep);
            (currArray === undefined) ? currArray = [child] : currArray.push(child);
            set.set(child.deep,currArray);
            currArray = [];
            if(max < child.deep) max = child.deep;
            if(min > child.deep) min = child.deep;
        });
        return [set,min,max];
    }


    //------------------------------------------------------------------------------------------------------------------
    _sumOfTheSubNodes(nodes){
        let s = 0;
        nodes.forEach(node => {
            s += node.subtreeNodes + 1;
        });
        return s;
    }

    _sumOfLogaritmicValues(map){
        let sum = 0;
        for(let value of map.values()) {
            const current = this._sumOfTheSubNodes(value);
            sum += Math.log10(current);
        }
        return sum;
    }

    //------------------------------------------------------------------------------------------------------------------
    //---------------------------------------sunbursteye with cutvertex, removing the elemtary biconnected blocks-------

    _orderTheChildrenMultipleBlackSingleBlackSingleRedMultipleRedCutVertex(childrens){
        let mapOfElements = new Map();
        childrens.forEach((node) => {
            let sons = node.getNeighbours();
            let currValue = [], currentNode = [node];
            //if have a single son, this node is classifying as single red or single black
            if(sons.length === 1){
                let kindOfSet = "";
                (sons[0].isBlack) ? kindOfSet = "singleBlack" : (sons[0].isABNode) ? kindOfSet = "singleRed" : kindOfSet = "singleCutV";
                currValue = mapOfElements.get(kindOfSet);
                mapOfElements.set(kindOfSet, (currValue != undefined) ? currValue.concat(currentNode) : currentNode);
            }
            else { //have multiple son
                let currentKey = "multipleBlack";
                let otherSon = [], cutV = [];
                node.getNeighbours().forEach((n) => {
                    if(!n.isBlack && n.isABNode)
                        currentKey = "multipleRed";
                    (!n.isABNode) ? cutV.push(n) : otherSon.push(n);
                });

                node.children = otherSon.concat(cutV);
                currValue = mapOfElements.get(currentKey);
                mapOfElements.set(currentKey, (currValue != undefined) ? currValue.concat(currentNode) : currentNode);
            }
        });
        let resultingArray = [];
        ["multipleBlack", "singleBlack", "singleRed", "multipleRed", "singleCutV"].forEach((key) => {
            let currArray = mapOfElements.get(key);
            if(currArray != undefined) resultingArray = resultingArray.concat(currArray);
        });
        return resultingArray;
    }

    //assign the space dividing the father space for the number of the childrens
    _coordinateAssignmentClassifyingInOrderToTheNumerAndColorOfTheChildrens(setOfChildren, startRadiant, sliceStepInRadiant, xRoot, yRoot, stepMinRadius, currentMinRadius, stepMaxRadius, currentMaxRadius){
        let orderedSon = this._orderTheChildrenMultipleBlackSingleBlackSingleRedMultipleRedCutVertex(setOfChildren);
        orderedSon.forEach((node) => {
            const deep = currentMinRadius + (Math.abs(Math.cos(startRadiant)) * currentMaxRadius);
            node.setX(xRoot + (currentMinRadius + currentMaxRadius) * Math.cos(startRadiant + (sliceStepInRadiant / 2)));
            node.setY(yRoot + currentMinRadius * Math.sin(startRadiant + (sliceStepInRadiant / 2)));
            this._coordinateAssignmentClassifyingInOrderToTheNumerAndColorOfTheChildrens(node.children, startRadiant, sliceStepInRadiant/node.getNeighbours().length, xRoot, yRoot, stepMinRadius, currentMinRadius + stepMinRadius, stepMaxRadius, stepMaxRadius + currentMaxRadius);
            startRadiant += sliceStepInRadiant;
        });
    }
    //------------------------------------------------------------------------------------------------------------------
    //sunburst self adapting space, this is a snail with radius magior when the portion have less level

    _sunburstSelfAdaptingSnail(root, weight, height){
        let set = this._calculateSetsOfChildren(root);


        let radiusMin = Math.min(weight,height) * 0.5;
        let radiusMax = Math.max(weight, height) * 0.5;

        //draw the root in the middle
        let xRoot = weight / 2;
        let yRoot = height / 2;
        root.setX(xRoot);
        root.setY(yRoot);

        const sumOfTheLogaritmicNumberOfNodeForEachSet = this._sumOfLogaritmicValues(set[0]);//per dividere i radianti in maniera logaritmica

        let pieceOfSun = [0, 0];

        let iteratore = set[1] - 1; // set[1] is the smallest deep in the tree from the root to the leafs
        let firstVal = set[1];
        let radius = this._assignTheRightSpaceForEachLevel(set[0], radiusMax, radiusMin);
        root.dimension = radius[1][1];
        while(iteratore !== undefined && iteratore <= set[2]){
            let currentSetOfChildren = set[0].get(iteratore);
            //assign the coordinates to this set of children
            //potrebbe essere che la lunghezza passa da 2 a 4 quindi una fila può mancare, se non manca lavoro
            if(currentSetOfChildren !== undefined) {
                let allStepsForRadius = 0;
                let step = 6.28 * (Math.log10(this._sumOfTheSubNodes(currentSetOfChildren)) / sumOfTheLogaritmicNumberOfNodeForEachSet);
                pieceOfSun[1] += step;
                let currentSliceStep = (step - 0.025) / currentSetOfChildren.length;
                let currentStartRadiant = pieceOfSun[0];
                /*calculate the 4 set ov radius in this form [init, 1/3, 2/3, end] */
                let nextNumberOfLayers = this._nextKeyOfTheMap(set, iteratore);
                let nextNumberOfNodes = (set[0].get(nextNumberOfLayers) !== undefined) ? set[0].get(nextNumberOfLayers) : set[0].get(firstVal);
                allStepsForRadius = this._calculateTheRadiusForTheCurrentCone(pieceOfSun, currentSetOfChildren.length, nextNumberOfNodes.length, radiusMin, radiusMax, iteratore, nextNumberOfLayers);
                //this._coordinateAssignmentLogarithmicSpiralsClassifyingInOrderToTheNumerAndColorOfTheChildrens(currentSetOfChildren, currentStartRadiant, currentSliceStep, xRoot, yRoot, allStepsForRadius[0], allStepsForRadius[0], allStepsForRadius[1], allStepsForRadius[1], allStepsForRadius);
                this._coordinateAssignmentCircularly(currentSetOfChildren, currentStartRadiant, currentSliceStep, xRoot, yRoot, radius, 1);
                //this._coordinateAssignmentElliptically(currentSetOfChildren, currentStartRadiant, currentSliceStep, xRoot, yRoot, radius, 1);
                pieceOfSun[0] = pieceOfSun[1];
            }
            iteratore = this._nextKeyOfTheMap(set, iteratore);
        }
    }

    //assign the space dividing the father space for the number of the childrens
    _coordinateAssignmentLogarithmicSpiralsClassifyingInOrderToTheNumerAndColorOfTheChildrens(setOfChildren, startRadiant, sliceStepInRadiant, xRoot, yRoot, stepMinRadius, currentMinRadius, stepMaxRadius, currentMaxRadius, allStepForRadius){
        let orderedSon = this._orderTheChildrenMultipleBlackSingleBlackSingleRedMultipleRedCutVertex(setOfChildren);
        let minRadius = currentMinRadius, maxRadius = currentMaxRadius;
        let sequentialNumber = 0;
        orderedSon.forEach((node) => {
            if(sequentialNumber > allStepForRadius[2] && allStepForRadius[3] > 0){
                minRadius -= ((allStepForRadius[0] - allStepForRadius[3]) / (setOfChildren.length));
                maxRadius -= ((allStepForRadius[1] - allStepForRadius[4]) / (setOfChildren.length));
            }
            node.setX(xRoot + (minRadius + maxRadius) * Math.cos(startRadiant + (sliceStepInRadiant / 2)));
            node.setY(yRoot + minRadius * Math.sin(startRadiant + (sliceStepInRadiant / 2)));
            this._coordinateAssignmentClassifyingInOrderToTheNumerAndColorOfTheChildrens(node.children, startRadiant, sliceStepInRadiant/node.getNeighbours().length, xRoot, yRoot, minRadius, minRadius + minRadius, maxRadius, maxRadius + maxRadius, allStepForRadius);
            startRadiant += sliceStepInRadiant;
            sequentialNumber++;
        });
    }

    _nextKeyOfTheMap(map, iteratore){
        let currentSetOfChildren = [];
        iteratore++;
        do{
            currentSetOfChildren = map[0].get(iteratore);
            iteratore++;
        }while(currentSetOfChildren === undefined && iteratore <= map[2]);

        return (currentSetOfChildren === undefined) ? undefined : iteratore - 1;
    }

    _calculateTheRadiusForTheCurrentCone(currentStartAndEndRadiant, currentNumberOfChildren, nextNumberOfChildren, radiusMin, radiusMax, currentNumberOfLevel, nextNumberOfLevel){
        let setOfCurrentRadiant = [];
        let stepmin = (radiusMin - 9) / currentNumberOfLevel;
        let stepmax = (radiusMax - 9) / currentNumberOfLevel;
        let offset = stepmax - stepmin;

        //radius of the next cone
        let stepminNext = ((radiusMin - 9) / nextNumberOfLevel);
        let stepmaxNext = ((radiusMax - 9) / nextNumberOfLevel);
        let nextOffset = stepmaxNext - stepminNext;

        //
        let twoThirds = currentNumberOfChildren * 0;


        return [stepmin, offset, twoThirds, stepminNext, nextOffset, stepminNext, nextOffset];
    }

    //------------------------------------------------------------------------------------------------------------------
    //utilities
    _deepGraph(root,maxSize, vv = 2){
        if(root.getNeighbours().length === 0){
            root.setVisitedValue(vv);
            root.setVisited();
            root.subtreeNodes = root.getNeighbours().length;
            root.deep = 1;
            return [root.deep, root.subtreeNodes, root.getSize()];
        }
        else {
            let max = 0, currentValues = [0, 0], p = [0,0];
            root.getNeighbours().forEach((neighbour) => {
                neighbour.setVisitedValue(vv);
                if (neighbour.getVisited() === false) {
                    neighbour.setVisited();
                    neighbour.father = root;
                    p = this._deepGraph(neighbour, maxSize);
                    currentValues =[p[0], currentValues[1] + p[1]];
                    if (currentValues[0] > max) max = currentValues[0];
                    if(p[2] > maxSize) maxSize = p[2];
                }
            });
            root.subtreeNodes = currentValues[1] + 1;
            root.deep = max + 1;
            return [root.deep, root.subtreeNodes, ((root.getSize() > maxSize) ? root.getSize() : maxSize)];
        }
    }

    //main method for all kind of drawing
   async drawBCTree(graph){
        dialogueBox("Coordinate Assignment");
        await sleep(50);
        console.log(graph);
        let currentWeight = this.weight, currentHeight = this.height;
        let totalNumberOfNodes = 0, minWeight = 20, minHeight = 0;
        let newCC = [];
        graph.getAllComponents().forEach((connectedComponent) => {
            if(connectedComponent != undefined && connectedComponent.getNodes()[0] != undefined) {
                //delete the cutVertex
                //connectedComponent.deleteTheCutVertex();
                connectedComponent.deleteTheElementaryBlocks(5);

                newCC.push(connectedComponent);
                const root = connectedComponent.getNodes()[0];
                const deep = this._deepGraph(root, 0);
                totalNumberOfNodes += deep[1];
                connectedComponent.setMaxSize(deep[2]);
            }
        });
        newCC.sort((a,b) => {
            return b.getNodes()[0].subtreeNodes - a.getNodes()[0].subtreeNodes;
        });
        newCC.forEach((connectedComponent) => {
          //  if(connectedComponent.getNodes()[0] !== undefined) {
                let root = connectedComponent.getNodes()[0];
                let percentage = root.subtreeNodes / totalNumberOfNodes;
                if (percentage >= 0.3) {
                    root.root = true;
                    root.dimension = 100;
                   //this.assignTheCoordinateToTheBlocksButCircularly(root, currentWeight, currentHeight);
                   this._sunburstSelfAdaptingSnail(root, currentWeight, currentHeight);//coordinate assignment to the bc-trees nodes
                   //connectedComponent._calculateFathersAndFans();
                   minHeight += currentHeight * percentage;
                   this.setTheCoordinatesToEachNodeInEachBlock(connectedComponent);//coordinate assignment to the nodes inside each block
                }
                else {
                  minWeight += currentWeight * percentage;
                }
        });
        dialogueBox("The coordinates have been assigned to all the nodes, now it's the renderer's job");
        await sleep(50);
        //document.getElementById("dialogText").innerHTML = "The coordinates have been assigned to all the nodes";
        console.log("The coordinates have been assigned to all the nodes");
    }

    /*drawing the edges from a cut-vertex to their connected blocks*/
    edgesFromCutVertexToBlocks(cutVertex, endPoint, cc){
        let numberOfEdges =  endPoint.block.numberEdgesToTheCutVertex.get(cutVertex.name.substring(2));
        let offset = 6.28;
        let radiantForEachEdge =  offset / Math.log10(numberOfEdges);
        let currRadiant = 0;
        endPoint.block.fromCutVertexEdges.forEach((edge, i) => {
            const dimension = endPoint.block.currentDimension * 2;
            const x =  (endPoint.block.x) + dimension * Math.cos(currRadiant);
            //set Math.cos also in the y if you want a rect
            const y = (endPoint.block.y) + dimension * Math.sin(currRadiant);
            edge.target.x = x;
            edge.target.y = y;
            currRadiant += radiantForEachEdge;
        });
    }


    setTheCoordinatesToEachNodeInEachBlock(cc){
        cc.nodes.forEach((node) => {
            if(!node.root) node.dimension = (Math.log10(node.getSize()) / Math.log10(cc.getMaxSize())) * 20;//set the dimension of each node, for calculating this parameter it is needed the sixe of the max element in the graph
            if(node.biconnectedGraph !== null){//null and not undefined because in the node's class it is set by default at null
                let raggio = node.dimension; //steps of the raggio
                let radiant = 0;
                let radiantSteps = 6.28 / node.biconnectedGraph.nodes.length;
                //for the fakes points
                let currentRadiant = 0, steps = 6.28 / node.biconnectedGraph.nodes.length;
                node.biconnectedGraph.nodes.forEach((children, index) => {
                    children.dimension = 1;
                    //children.dimension = Math.log10(children.size) / node.biconnectedGraph.maxOrderIntheMap;
                    //a random algorithm draw like a crocie because have a periodic distribution so I generate a fake starting point
                    let fakeX = node.x + (raggio / 2) * Math.cos(currentRadiant);
                    let fakeY = node.y + (raggio / 2) * Math.sin(currentRadiant);
                    let rr = Math.random() * (raggio / 2);
                    let rd = Math.random() * 6.28;
                    //let x = fakeX + (rr + rr) * (Math.cos(rd));
                    let x = fakeX + (rr) * (Math.cos(rd));
                    let y = fakeY + (rr) * (Math.sin(rd));
                    children.x = x;
                    children.y = y;
                    radiant += radiantSteps;
                    currentRadiant += steps;
                    if(node.sizeNodes > 10000)this.assignTheCoordinatesToTheEdgesOfTheCurrentBlok(node, children);
                });
                node.biconnectedGraph.rankingOfTheNodes();
            }
        })
    }
    /*Input: a node that represent a biconnected block, the block have a list of nodes that are the node inside him.
         * this method for each node inside the current block create it's edges and set the coordinates of the edges. */
    assignTheCoordinatesToTheEdgesOfTheCurrentBlok(block, node){
        let numberOfEdges = Math.ceil(Math.log10(node.getDegree()));
        //for each node I have to create it's edges
        let radiant = 6.28, currentRadiant = 0, radiantStep = 6.28 / numberOfEdges;
        for(let i = 0; i < numberOfEdges; i++){
            let target = new Node(block.id + " " + node.id + " " + i, false, 0, 0, 0);
            target.setX(block.x + Math.random() * block.dimension * 0.5 * Math.cos(Math.random() * radiant));
            target.setY(block.y + Math.random() * block.dimension * 0.5 * Math.cos(Math.random() * radiant));
            currentRadiant += radiantStep;
            let currentEdge = new Edge(node, target,"rgb(105,105,105)");
            node.edges.push(currentEdge);
        }
    }

    /*prova per una visualizzazione con la root al centro molto grande, con i cutVertex che sono attaccati al bordo ed emanano internamente
    * Input:
    *       - the root of the current graph => the current BC-Tree
    *       - the current weight
    *       - the current height*/
    assignTheCoordinateToTheBlocksButCircularly(root, currentWeight, currentHeight){
        //set the coordinates to the root
        root.setX(currentWeight / 2);
        root.setY(currentHeight / 2);

        //draw the cutVertex clese to the edge of the block
        let radiant = 6.28, currentRadius = 0, radiusStep = 6.28 / root.children.length;
        let radius = root.dimension * 3 / 2;
        root.children.forEach(cutVertex => {
            cutVertex.setX(root.x + radius * Math.cos(currentRadius));
            cutVertex.setY(root.y + radius * Math.sin(currentRadius));
            currentRadius += radiusStep;
            this.coordinateAssignmentToTheEdgesFromACutVertexToTheBlock(cutVertex);
        });

    }

    coordinateAssignmentToTheEdgesFromACutVertexToTheBlock(cutVertex){
        cutVertex.cones.forEach(cone => {//for each cutvertex, take the dimension of it's edge's fan, then rescale it to the log10, and than create and set the coordinates to this edges
        let numberOfEdges = Math.floor(Math.log10(cone.size));
        //for each node I have to create it's edges
        let radiant = 6.28, currentRadiant = 0, radiantStep = 6.28 / numberOfEdges;
            for (let i = 0; i < numberOfEdges; i++) {
                let target = new Node(cone.target.id + " " + cutVertex.id + " " + i, false, 0, 0, 0);
                target.setX(cone.target.x + Math.random() * cone.target.dimension * 0.6 * Math.cos(Math.random() * radiant));
                target.setY(cone.target.y + Math.random() * cone.target.dimension * 0.6 * Math.cos(Math.random() * radiant));
                currentRadiant += radiantStep;
                let currentEdge = new Edge(cutVertex, target);
                cutVertex.edgesFromCutVertexToTheBlock.push(currentEdge);
            }
        });
    }




    //assign the space for each level
    _assignTheRightSpaceForEachLevel(levels, radiusX, radiusY){
        let raysX = [], raysY = [], max = 0, orderedLevels = [];
        levels.forEach((value, key) => {
            max += Math.log10(value.length);
            orderedLevels[key] = value.length;
        });
        orderedLevels.forEach((value, key) => {
            let percent = (Math.log10(value) / max);
            let currentValueX = percent * radiusX;
            let currentValueY = percent * radiusY;
            raysX[key] = (key > 3 && key % 2 === 0) ? raysX[key - 2] + currentValueX : currentValueX;
            if(currentValueX < 20) raysX[key] += 20;
            raysY[key] = (key > 3 && key % 2 === 0) ? raysY[key - 2] + currentValueY : currentValueY;
            if(currentValueY < 20) raysY[key] += 20;
            raysX[key - 1] = (key % 2 === 0 && key > 2) ? raysX[key - 2] + ((raysX[key] - raysX[key - 2]) / 2) : raysX[key] * 2 / 3;
            raysY[key - 1] = (key % 2 === 0 && key > 2) ? raysY[key - 2] + ((raysY[key] - raysY[key - 2]) / 2) : raysY[key] * 2 / 3;
        });
        return [raysX, raysY];
    }

    //drawing circularly
    //assign the space dividing the father space for the number of the childrens
    _coordinateAssignmentCircularly(setOfChildren, startRadiant, sliceStepInRadiant, xRoot, yRoot, radius, level){
        setOfChildren.forEach((node, index) => {
            node.setX(xRoot + radius[1][level] * Math.cos(startRadiant + (sliceStepInRadiant / 2)));
            node.setY(yRoot + radius[1][level] * Math.sin(startRadiant + (sliceStepInRadiant / 2)));
            this._coordinateAssignmentCircularly(node.children, startRadiant, sliceStepInRadiant/node.getNeighbours().length, xRoot, yRoot, radius, level + 1);
            startRadiant += sliceStepInRadiant;
        });
    }
    //////////////////////////////////////////////////////////////////////////////////////////

    //drawing in an elliptical style
    _coordinateAssignmentElliptically(setOfChildren, startRadiant, sliceStepInRadiant, xRoot, yRoot, radius, level){
        setOfChildren.forEach((node, index) => {
            node.setX(xRoot + radius[0][level] * Math.cos(startRadiant + (sliceStepInRadiant / 2)));
            node.setY(yRoot + radius[1][level] * Math.sin(startRadiant + (sliceStepInRadiant / 2)));
            this._coordinateAssignmentElliptically(node.children, startRadiant, sliceStepInRadiant/node.getNeighbours().length, xRoot, yRoot, radius, level + 1);
            startRadiant += sliceStepInRadiant;
        });
    }
    /////////////////////////////////////////////////////////////////////////////////////////

}
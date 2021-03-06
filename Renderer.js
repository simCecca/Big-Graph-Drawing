
class Renderer {

    //todo: creare una classe unica che definisca il flusso di esecuzione
    constructor() {
        this.svg = d3.select("#svgCanvas");
        this.svgElement = this.svg.append("g");
        this.svgCCNodes = this.svgElement.append("g").attr("id", "ccnodes");
        this.svgNodes = this.svgElement.append("g").attr("id", "nodes");
        this.svgCones = this.svgElement.append("g").attr("id", "cones");
        this.svgEdgesMin = this.svgElement.append("g").attr("id", "edgesMin");
        this.svgConesMin = this.svgElement.append("g").attr("id", "conesMin");
        this.svgEdgesMedium = this.svgElement.append("g").attr("id", "edgesMedium");
        this.svgConesMedium = this.svgElement.append("g").attr("id", "conesMedium");
        this.edgesFromCutV = this.svgElement.append("g").attr("id", "edgesFromCutV");
        this.svgEdgesMax = this.svgElement.append("g").attr("id", "edgesMax");

        this.svgMaxOrder = this.svgElement.append("g").attr("id", "maxOrder");
        this.svgQueryEdges = this.svgElement.append("g").attr("id", "queryEdges");
        this.svgQuery = this.svgElement.append("g").attr("id", "query");
        this.edgesSvgs = [this.svgEdgesMin, this.svgEdgesMedium, this.svgEdgesMax];
        this.conesSvgs = [this.svgCones, this.svgConesMin, this.svgConesMedium];
        this.graph = null;
        this.width = window.screen.availWidth * 0.835;
        this.height = window.screen.availHeight;
        this.algorithm = new DrawAlgorithm(this.width, this.height); // Dummy graph
        this.isJustCreatedTheRectForTheZoom =false;
        this.zoomStop = 0;
        this.previousScale = {k: 1, x: 0, y: 0};
        this.maxZoomSize = ((window.screen.availWidth + window.screen.availHeight) / 2360) + 1;
    }

    verifyOverlappingOverConnectedComponents(){
        let result = false;
        this.graph.graph.forEach((firstNode, firstIndex) => {
            this.graph.graph.forEach((secondNode, secondIndex) => {
                if(firstIndex !== secondIndex){
                    const firstCateto = Math.abs(firstNode.x - secondNode.x), secondCateto = Math.abs(firstNode.y - secondNode.y);
                    const ipotenusa =  Math.sqrt(firstCateto * firstCateto + secondCateto * secondCateto);
                    if(ipotenusa < (parseInt(firstNode.radiusDrawing + this.offset(firstNode)) + parseInt(secondNode.radiusDrawing + this.offset(secondNode)))){
                        result = true;
                    }
                }
            });
        });
        return result;
    }

    async setGraph(graph) {
        this.graph = graph;
        await this.algorithm.drawBCTree(graph);
        this.cleanTheVisualization();
        const simulation = this.drawConnectedComponents();
        while(this.verifyOverlappingOverConnectedComponents()) { console.log("entro"); await sleep(2000);}
        simulation.stop();
        await this.algorithm.reassignTheCoordinatesToTheRightPlace();

        const renderFunction = () => {
            this.render();
        };

        requestAnimationFrame(renderFunction);
    }
    offset(node){
        const c = node.id === this.graph.getConnectedComponent(0).id ? Math.pow(this.graph.getConnectedComponent(0).root.deep, 1.5) : 3;
        return c;
    }
    drawConnectedComponents(){
        // Initialize the circle: all located at the center of the svg area

        const node = this.svgCCNodes.append("g")
            .selectAll("circle")
            .data(this.graph.getAllComponents(), node => node.getId())
            .enter()
            .append("circle")
            .attr("id", node => node.getId())
            .attr("r", node => node.radiusDrawing + this.offset(node))
            .attr('fill', 'transparent')
            .attr("cx", (node) => { node.x = this.width / 2; return this.width/2 })
            .attr("cy", (node) => { node.y = this.height / 2; return this.height/2 })
            .attr("stroke", "blue")
            .attr("stroke-width", 0.5);


// Features of the forces applied to the nodes:
        const simulation = d3.forceSimulation(this.graph.getAllComponents())
            .force("forceX", d3.forceX().strength(.1).x(this.width * .5))
            .force("forceY", d3.forceY().strength(.1).y(this.height * .5))
            .force("center", d3.forceCenter().x(this.width / 2).y(this.height / 2)) // Attraction to the center of the svg area
            .force("charge", d3.forceManyBody().strength(.1)) // Nodes are attracted one each other of value is > 0
            .force("collide", d3.forceCollide().strength(.2).radius(node => node.radiusDrawing + this.offset(node) + 4));// Force that avoids circle overlapping

// Apply these forces to the nodes and update their positions.
// Once the force algorithm is happy with positions ('alpha' value is low enough), simulations will stop.
        simulation
            .nodes(this.graph.getAllComponents())
            .on("tick", (d) => {
                node
                    .attr("cx", (d) => { if(d.size > this.graph.totalSize * 2 / 3) {d.x = this.width / 2;} return d.x; })
                    .attr("cy", (d) => { if(d.size > this.graph.totalSize * 2 / 3) {d.y = this.height / 2;} return d.y; })

            });
        return simulation;
    }

    drawConesInTheMiddle(cones){
        cones.forEach((cone) => {
            this.edgesFromCutV.append("polygon")
                .attr("points", cone.points)
                .attr("fill", cone.color)
                .attr("stroke", cone.stroke)
                .attr("stroke-width", cone.stroke_width / 30)
                .attr("id", cone.id)
        });
    }

    //take in input a node and the connected component that contain this node and draw the information of this node
    drawInfoOfThisNode(node, cc){
        let color = "rgb(170,170,100)";
        let dimension = node.currentDimension * 2, minDimension = this.graph.graph[cc].root.currentDimension * 0.33;
        if(dimension < this.graph.graph[cc].root.currentDimension * 0.33)
            dimension = minDimension;
        let fontSize = Math.max(((node.root) ? dimension / 10 : dimension/3), 10);
        let nodesText = "Nodes: " + node.sizeNodes;
        let edgesText = "Edges: " + node.size;
        let nameText = "Name: " + node.name;
        let dataText = [ edgesText, (node.innerNode) ? "" : nodesText, nameText ];
        let offset = -fontSize * 1.5;
        this.svgQuery.append("rect")
            .attr("width", Math.max(fontSize * (2 + node.name.length), 60))
            .attr("height", Math.max(fontSize * 4, 30))
            .attr("x", Math.max(node.x + node.currentDimension + fontSize * 2, 35))
            .attr("y", node.y - fontSize * 2)
            .attr("stroke", "#5b3a29")
            .attr("stroke-opacity", "0.4")
            .attr("fill-opacity", "0.4")
            .attr("stroke-width", "0.2em");
        this.svgQuery.selectAll("text")
            .data(dataText)
            .enter()
            .append("text")
            .attr("x", node.x + node.currentDimension + fontSize * 3.5)
            .attr("y", () => {offset += fontSize; return node.y + offset})
            .attr("font-size", fontSize + "px")
            .attr("fill", "white")
            .attr("font-family", "Comic Sans MS")
            .text((d) => d);
    }

    renderBiconnectedBlocks(svg, nodes, cc, zoom = 1){
        const svgNodes = svg.selectAll("circle")
            .data(nodes, node => node.getId());

        svgNodes.enter()
            .append("circle")
            .attr("id", node => node.getId())
            .on("mouseover", (node, i, nodes) => {
                this.drawInfoOfThisNode(node, cc);
                })
            .on("mouseout", (node, i, nodes) => {
                this.svgQuery.selectAll("text").remove();
                this.svgQuery.selectAll("rect").remove();
            })
            .attr('fill', node => 'rgb(230,230,230)')
            .attr("cx", node => node.x)
            .attr("cy", node => node.y)
            .merge(svgNodes)
            .attr("r", node => (node.biconnectedGraph.nodes.length === 0) ? 0 : node.dimension)
            .attr("stroke-width", 0.1/zoom);
    }
    renderNodes(svg, nodes, cc, zoom = 1) {
        const svgNodes = svg.selectAll("circle")
            .data(nodes, node => node.getId());

        svgNodes.enter()
            .append("circle")
            .attr("id", node => node.getId())
            .on("mouseover", (node, i, nodes) => {
                let somma = node.size;
                if(!node.isABNode) {
                   //d3.select(nodes[i]).transition().duration(100).attr("r", node => node.currentDimension * 2);
                   if(node.cutVertexNeighboursFirst.length > 0){
                       node.cutVertexNeighboursFirst.forEach((e) => {
                           e.setIntermediateCoordinatesBetweenCutVerteces();
                       });
                       this.drawEdgesbetweenConeAndCircle(node.cutVertexNeighboursFirst, zoom, 500);
                   }
                }
                this.drawInfoOfThisNode(node, cc);
            })
            .on("mouseout", (node, i, nodes) => {
                if(!node.isABNode) {
                    //d3.select(nodes[i]).transition().duration(100).attr("r", node => node.currentDimension);
                }

                this.svgQuery.selectAll("text").remove();
                this.svgQuery.selectAll("rect").remove();
                this.edgesFromCutV.selectAll("polygon").remove();
                this.edgesFromCutV.selectAll("path").remove();

            })
            .call(d3.drag()
            //.on("drag", node => {node.x = d3.event.x; node.y = d3.event.y; this.renderEdges(this.graph.getConnectedComponent(cc).getEdges()); this.renderNodes([node],cc)}))
                .on("drag", node => {node.x = d3.event.x; node.y = d3.event.y; /*this.renderEdges(node.edges);*/ this.renderNodes(this.svgNodes, [node], cc); /*this.renderCones(node.cones, cc);*/}))
            //.on("click", (nodeObject, i, nodes) => { const name = (nodeObject.getSPQRTree() != undefined) ? nodeObject.getSPQRTree().root.getId() : "ciao"; console.log((name.includes("p") ? "P" : name.includes("s") ? "S" : name.includes("r") ? "R" : "noValue"));})
            .attr('fill', node => {
                let color = 'rgb(230,230,230)';
                (!node.isABNode || node.innerNode) ?  color = 'rgb(50,50,50)' : (node.isBlack) ? color = 'dark' : color; return color;
            })
            .merge(svgNodes)
            .attr("cx", node => {return node.x})
            .attr("cy", node => node.y)
            .attr("r", node => {
            //console.log(zoom);
                    if (zoom === 1 || node.currentDimension === undefined) {
                        node.currentDimension = node.dimension;
                        if (node.hide) node.currentDimension = 0;
                        if (!node.isABNode || node.isBlack || (node.currentDimension < 2 && !node.hide) ) {
                            node.currentDimension = 1;
                            //node.dimension = 1;
                        }
                    }
                    else {
                        if (zoom * 0.293 >= 2 && this.zoomStop === 0)
                            node.currentDimension = ((node.dimension / (zoom * 0.293)));
                    }
                    //return (node.root) ? 0 : node.currentDimension;
                    return node.currentDimension;

        })
            .attr("stroke-width", 0.1/zoom);


    sleep(50);
    }

    drawEdgesbetweenConeAndCircle(nodes, zoom, time){
        const svgEdges = this.edgesFromCutV.selectAll("path")
            .data(nodes, edge => edge.id); // edges aren't going to change...



        svgEdges.enter()
            .append("path")
            .merge(svgEdges)
            .attr("d", cutV =>  "M" + cutV.source.x + " " + cutV.source.y + " C " + cutV.x3 + " " + cutV.y3 + ", " + cutV.x4 + " " + cutV.y4 + ", " + cutV.target.x + " " + cutV.target.y)
        //.attr("x2", edge => {if(edge.color === "red") this.algorithm.edgesFromCutVertexToBlocks(edge.source, edge.target, 0); return edge.target.x;})
            .attr("id", edge =>  edge.id)
            .attr("fill", "transparent")
            .attr("stroke", edge => edge.color)
            .attr("stroke-width", 0.5 / zoom);
    }

    stopZoom(){
        this.zoomStop = (this.zoomStop + 1) % 2;
    }

    renderEdges(svg, edges, zoom = 1) {
        //const svgEdges = this.svgEdges.selectAll("line")
        const svgEdges = svg.selectAll("path")
            .data(edges, edge => edge.id); // edges aren't going to change...
        //console.log(edges);

        svgEdges.enter()
            .append("path")
            .merge(svgEdges)
            .attr("d", cutV =>  "M" + cutV.x1 + " " + cutV.y1 + " C " + cutV.x3 + " " + cutV.y3 + ", " + cutV.x4 + " " + cutV.y4 + ", " + cutV.x2 + " " + cutV.y2)
            //.attr("x2", edge => {if(edge.color === "red") this.algorithm.edgesFromCutVertexToBlocks(edge.source, edge.target, 0); return edge.target.x;})
            .attr("id", edge =>  edge.id)
            .attr("fill", "transparent")
            .attr("stroke", edge => edge.color)
            .attr("stroke-width", 0.1 / zoom);
    }


    renderCones(svg, cones, cc, zoom = 0){
        const svgCones = svg.selectAll("polygon")
            .data(cones, cone => cone.id);

        svgCones.enter()
            .append("polygon")
            .merge(svgCones)
            .attr("points", cone => cone.setSouce(zoom))
            .attr("fill", cone => cone.setColor(this.graph.graph[cc].maxConeSize))
            .attr("stroke", cone => cone.stroke)
            .attr("stroke-width", cone => cone.stroke_width / (30 + zoom))
            .attr("id", cone => cone.id);
    }

    //for the zooming
    rendererRectForZooming(){
        if(!this.isJustCreatedTheRectForTheZoom) {
            this.isJustCreatedTheRectForTheZoom = true;
            var zoom = d3.zoom().on("zoom", () => {
                this.zoom();
            });

            //this.svg = d3.select("#svgCanvas"); dove #svgCanvas è l'id assegnato al tag svg
            var gElem = this.svg.call(zoom);

            gElem//.append("rect") non è una buona idea introdurre un rettangolo poichè va a discapito dell'interattività
                .attr("width", "100%")
                .attr("height", this.height)
                //.style("fill", "none")
                .style("pointer-events", "all")
                .on("contextmenu", () => {
                    d3.event.preventDefault();
                    gElem.transition()
                        .duration(750)
                        .call(zoom.transform, d3.zoomIdentity);
                });
        }
    }

    zoom(){
        // d3.event.transform have 3 fields k == scale, x and y
        //rescale all the graph
        //this.svgElement = this.svg.append("g");
        if(!this.zoomStop)
        {
            if (d3.event.transform.k > this.maxZoomSize) {
                //rescale all the nodes & edges
                d3.event.transform.k = this.previousScale.k;
                d3.event.transform.x = this.previousScale.x;
                d3.event.transform.y = this.previousScale.y;
            }
        }
        this.svgElement.attr("transform", d3.event.transform);
        this.previousScale.k = d3.event.transform.k;
        this.previousScale.x = d3.event.transform.x;
        this.previousScale.y = d3.event.transform.y;
        // if(d3.event.transform.k !== this.previousScale && d3.event.transform.k > 2 && !this.zoomStop) {
        //     //rescale all the nodes & edges
        //     this.renderNodes(this.svgNodes, this.graph.graph[0].getNodes(), 0, d3.event.transform.k);
        //     this.renderBiconnectedGraph(this.graph.graph[0], 0, d3.event.transform.k);
        //     this.renderObjectsAlternatingInTheBlock(this.graph.graph[0].cones, 0, d3.event.transform.k);
        //     this.previousScale = d3.event.transform.k;
        // }
    }

     render() {
        this.graph.getAllComponents().forEach((connectedComponent, i) => {
            connectedComponent.sortTheCones();
            //this.renderEdges(this.svgEdges, connectedComponent.getEdges());
            //draw only the cutVertex and the node of the biconnected components
            let cutVToDraw = [];
            let blocks = [];
            connectedComponent.getNodes().forEach(n => {
                if(!n.isABNode || n.isBlack)
                    cutVToDraw.push(n);
                if(n.isABNode)
                    blocks.push(n);
            });
           //cutVToDraw.forEach(n => console.log(n));
            this.renderNodes(this.svgMaxOrder, cutVToDraw, i);
            //console.log("finished the nodes rendering");
            this.renderBiconnectedBlocks(this.svgNodes, blocks, i);
            //console.log("connected blocks");
            this.renderBiconnectedGraph(connectedComponent, i);
            //console.log("finished the biconnected graph rendering");
            this.renderObjectsAlternatingInTheBlock(connectedComponent.cones, i);
            //console.log("coni");
            //this.renderCones(connectedComponent.cones, i);
            this.rendererRectForZooming();
        });
    }

    renderObjectsAlternatingInTheBlock(connectedComponent, i, zoom = 1){
        let cSlice = (connectedComponent.length) / 3;
        let init = 0, end = cSlice;
        let j = 0, w = 0;
        let one = [], two = [], three = [];
        let all = [one, two, three];
        let oneSize = Math.floor(0.01 * connectedComponent.length);
        let oneFrequence = Math.floor(connectedComponent.length / oneSize);
        let currentValue = oneFrequence;

        connectedComponent.forEach((c) => {
            if(w === currentValue){
                all[2].push(c);
                currentValue += oneFrequence;
            }
            else{
                all[j%2].push(c);
                j++;
            }
            //w++;
        });
        for(j = 0; j < 3; j++) {
            this.renderCones(this.conesSvgs[j], all[j], i, zoom);
        }

    }

    renderBiconnectedGraph(bc, i, zoom = 1){
        let all_nodes_arrays = [], all_edges_arrays = [], all_edges = [[],[],[]], all_nodes = [];
        bc.nodes.forEach((children) => {
            if(children.biconnectedGraph !== null) {
                all_nodes_arrays.push(children.biconnectedGraph.nodes.slice(0, (children.root) ? ((children.deep > 11) ? (2000 - 500 * (Math.floor((children.deep / 18) % 2))) : 3000) : 100));
            }
        });
        all_nodes_arrays.forEach(arr => {
            arr.forEach(n => {all_nodes.push(n);
            all_edges_arrays.push(n.edges);
            })
        });
        all_edges_arrays.forEach(edges => {
            edges.forEach(edge => {
                const cSet = Math.floor(Math.random() * 50) % 3;
                all_edges[cSet].push(edge);
            });
        });
        this.renderNodes(this.svgMaxOrder, all_nodes, i, zoom);
        all_edges.forEach((cEdges, i) => {
            this.renderEdges(this.edgesSvgs[i], cEdges);
        })
    }

    removeEdges(edges){
        edges.forEach((edge) => {
            this.svgEdges.select("#" + edge.id).remove();
        });
    }

    blockSVG(node, cc){
        node.currentDimension = (Math.log10(node.getSize()) / Math.log10(this.graph.getConnectedComponent(cc).getMaxSize())) * 20;
        if(node.hide) node.currentDimension = 0; if(!node.isABNode || node.isBlack || (node.currentDimension < 2 && !node.hide))
            node.currentDimension = 2;

        let color = 'white';
        (!node.isABNode) ?  color = 'red' : (node.isBlack) ? color = 'dark' : color = 'white';

        let block =  '<circle r= ' + node.currentDimension + ' fill = ' + color + ' cx = ' + node.x + ' cy = ' + node.y + '></circle>';

        return block;
    }

    //querying the graph
    //single node format { block: name, node: name, nodeoriginal: name, cutvertex: name }
    querySingleNode(node, color = "rgb(0,0,100)"){
        //search the block
        const nodeToDraw = this.findTheNodeInTheGraph(node);
        this.svgQuery.select("#" + nodeToDraw.getId()).attr("fill", color).attr("r",0).transition().duration(500).attr("r", 5).attr("stroke", "black").attr("stroke-width", 0.5);
    }

    findTheNodeInTheGraph(node){
        const connectedComponent = node.cc;
        let blockId = 'a' + connectedComponent + 'bc' + node.block;
        let nodeName = blockId + 'a' + node.node;
        if(node.cutvertex){
            nodeName = 'a' + connectedComponent + 'cutv' + node.block;
        }
        let find = false;
        let nodeToDraw = null;
        this.graph.getAllComponents()[connectedComponent].getNodes().forEach(cNode => {
            if(node.cutvertex){
                if(cNode.getId() === nodeName) {
                    nodeToDraw = cNode;
                    this.renderNodes(this.svgQuery, [nodeToDraw], 0);
                }
            }else {
                if (cNode.getId() === blockId) {
                    cNode.biconnectedGraph.getNodes().forEach(ccNode => {
                        if (ccNode.getId() === nodeName) {
                            find = true;
                            nodeToDraw = ccNode;
                        }
                    });
                    if (!find) {
                        nodeToDraw = new Node(nodeName, false, node.degree, cNode.size);
                        nodeToDraw.x = cNode.x + Math.random() * cNode.dimension * 0.5 * Math.cos(Math.random() * 6.28);
                        nodeToDraw.y = cNode.y + Math.random() * cNode.dimension * 0.5 * Math.cos(Math.random() * 6.28);
                        nodeToDraw.innerNode = nodeToDraw.isABNode = true;
                        nodeToDraw.father = cNode;
                        cNode.biconnectedGraph.getNodes().push(nodeToDraw);
                    }
                    this.renderNodes(this.svgQuery, [nodeToDraw], 0);
                }
            }
        });
        return nodeToDraw;
    }

    _drawTheNodesAfterTheQuery(nodes, colors){
        let nodesToDraw = [];
        let father;
        let edgesToDraw = [];
        nodes.forEach((node, i) =>{
            const currentNode = this.findTheNodeInTheGraph(node);
            nodesToDraw.push(currentNode);
            if(father !== undefined){
                const cEdge = new Edge(father, currentNode, "black", currentNode.father);
                cEdge.setIntermediateCoordinatesBetweenCutVerteces();
                edgesToDraw.push(cEdge);
            }
            father = currentNode;
            this.querySingleNode(node, colors[i]);//(rules(i)) ? "rgb(0,75,0)" : "green");
        });
        return edgesToDraw;
    }
    drawShorthestPath(nodes){
        if(nodes.neighbours === undefined) {
            const sliceForColor = 255 / (nodes.shortestpath.length - 1);
            let currentColor = 0;
            let colors = [];
            nodes.shortestpath.forEach((n, i) => {
                colors[i] = "rgb(" + currentColor + "," + currentColor + " ,255)";
                currentColor += sliceForColor;
            });
            let edgesToDraw = this._drawTheNodesAfterTheQuery(nodes.shortestpath, colors);
            this.renderEdges(this.svgQueryEdges, edgesToDraw, 0.1);
        }
        else this.drawNeighbours(nodes, (i) => "red");
    }

    drawNeighbours(nodes, color){
        let colors = [];
        nodes.neighbours.forEach((n, i) => {
            colors[i] = color(i);
        });
        this._drawTheNodesAfterTheQuery(nodes.neighbours, colors);
    }

    resetQuery(){
        this.svgQueryEdges.selectAll("path").remove();
        this.svgQuery.selectAll("circle").remove();
    }

    cleanTheVisualization() {
        this.svgCCNodes.selectAll("*").remove();
        this.svgNodes.selectAll("*").remove();
        this.svgCones.selectAll("*").remove();
        this.svgEdgesMin.selectAll("*").remove();
        this.svgConesMin.selectAll("*").remove();
        this.svgEdgesMedium.selectAll("*").remove();
        this.svgConesMedium.selectAll("*").remove();
        this.edgesFromCutV.selectAll("*").remove();
        this.svgEdgesMax.selectAll("*").remove();
        this.svgQueryEdges.selectAll("*").remove();
        this.svgMaxOrder.selectAll("*").remove();
        this.svgQuery.selectAll("*").remove();
    }
}
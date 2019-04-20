class Renderer {

    //todo: creare una classe unica che definisca il flusso di esecuzione
    constructor() {
        this.svg = d3.select("#svgCanvas");
        this.svgElement = this.svg.append("g");
        this.svgNodes = this.svgElement.append("g").attr("id", "nodes");
        this.svgCones = this.svgElement.append("g").attr("id", "cones");
        this.svgEdgesMin = this.svgElement.append("g").attr("id", "edgesMin");
        this.svgConesMin = this.svgElement.append("g").attr("id", "conesMin");
        this.svgEdgesMedium = this.svgElement.append("g").attr("id", "edgesMedium");
        this.svgConesMedium = this.svgElement.append("g").attr("id", "conesMedium");
        this.edgesFromCutV = this.svgElement.append("g").attr("id", "edgesFromCutV");
        this.svgEdgesMax = this.svgElement.append("g").attr("id", "edgesMax");


        this.svgMaxOrder = this.svgElement.append("g").attr("id", "maxOrder");
        this.edgesSvgs = [this.svgEdgesMin, this.svgEdgesMedium, this.svgEdgesMax];
        this.conesSvgs = [this.svgCones, this.svgConesMin, this.svgConesMedium];
        this.graph = null;
        this.width = window.screen.availWidth * 0.7;
        this.height = window.screen.availHeight;
        this.algorithm = new DrawAlgorithm(this.width, this.height); // Dummy graph
        this.isJustCreatedTheRectForTheZoom =false;
        this.zoomStop = 0;
        this.previousScale = {k: 1, x: 0, y: 0};
    }

    async setGraph(graph) {
        //dialogueBox("Coordinate Assignment");
        await this.algorithm.drawBCTree(graph);
        this.graph = graph;
        this.render();
        const renderFunction = () => {
            this.render();
            //requestAnimationFrame(renderFunction);
        };

        //requestAnimationFrame(renderFunction);
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
        let fontSize = ((node.root) ? dimension / 10 : dimension/3);
        let nodesText = "Nodes: " + node.sizeNodes;
        let edgesText = "Edges: " + node.size;
        let nameText = "Name: " + node.name;
        let dataText = [ edgesText, nodesText, nameText ];
        let offset = -fontSize * 1.5;
        this.svgMaxOrder.append("rect")
            .attr("width", fontSize * (2 + node.name.length))
            .attr("height", fontSize * 4)
            .attr("x", node.x + node.currentDimension + fontSize * 2)
            .attr("y", node.y - fontSize * 2)
            .attr("stroke", "#5b3a29")
            .attr("stroke-opacity", "0.4")
            .attr("fill-opacity", "0.4")
            .attr("stroke-width", "0.2em");
        this.svgMaxOrder.selectAll("text")
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
                this.svgMaxOrder.selectAll("text").remove();
                this.svgMaxOrder.selectAll("rect").remove();
            })
            .attr('fill', node => 'rgb(230,230,230)')
            .attr("cx", node => node.x)
            .attr("cy", node => node.y)
            .merge(svgNodes)
            .attr("r", node => {
                return node.root ? node.dimension + 1 : node.dimension;
            })
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
                   d3.select(nodes[i]).transition().duration(100).attr("r", node => node.currentDimension * 2);
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
                    d3.select(nodes[i]).transition().duration(100).attr("r", node => node.currentDimension);
                }

                this.svgMaxOrder.selectAll("text").remove();
                this.svgMaxOrder.selectAll("rect").remove();
                this.edgesFromCutV.selectAll("polygon").remove();
                this.edgesFromCutV.selectAll("path").remove();

            })
            .call(d3.drag()
            //.on("drag", node => {node.x = d3.event.x; node.y = d3.event.y; this.renderEdges(this.graph.getConnectedComponent(cc).getEdges()); this.renderNodes([node],cc)}))
                .on("drag", node => {node.x = d3.event.x; node.y = d3.event.y; /*this.renderEdges(node.edges);*/ this.renderNodes(this.svgNodes, [node], cc); /*this.renderCones(node.cones, cc);*/}))
            .on("click", (nodeObject, i, nodes) => { const name = (nodeObject.getSPQRTree() != undefined) ? nodeObject.getSPQRTree().root.getId() : "ciao"; console.log((name.includes("p") ? "P" : name.includes("s") ? "S" : name.includes("r") ? "R" : "noValue"));})
            .attr('fill', node => {
                let color = 'rgb(230,230,230)';
                (!node.isABNode || node.innerNode) ?  color = 'rgb(50,50,50)' : (node.isBlack) ? color = 'dark' : color; return color;
            })
            .merge(svgNodes)
            .attr("cx", node => node.x)
            .attr("cy", node => node.y)
            .attr("r", node => {
            //console.log(zoom);
                    if (zoom === 1 || node.currentDimension === undefined) {
                        node.currentDimension = node.dimension;
                        if (node.hide) node.currentDimension = 0;
                        if (!node.isABNode || node.isBlack || (node.currentDimension < 2 && !node.hide) ) {
                            node.currentDimension = 1;
                            node.dimension = 1;
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
            if (d3.event.transform.k > 2) {
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
            if(i === 0) {
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
                setTimeout(this.renderNodes(this.svgMaxOrder, cutVToDraw, i),20);
                console.log("finished the nodes rendering");
                setTimeout(this.renderBiconnectedBlocks(this.svgNodes, blocks, i),20);
                setTimeout(this.renderBiconnectedGraph(connectedComponent, i),20);
                console.log("finished the biconnected graph rendering");
                setTimeout(this.renderObjectsAlternatingInTheBlock(connectedComponent.cones, i),20);
                console.log("coni");
                //this.renderCones(connectedComponent.cones, i);
                setTimeout(this.rendererRectForZooming(),20);

            }
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
        bc.nodes.forEach((children) => {
            if(children.biconnectedGraph !== null) {
                let nodes_to_renderer =  children.biconnectedGraph.nodes.slice(0, (children.root) ? 3000 : 5);
                this.renderNodes(this.svgMaxOrder, nodes_to_renderer, i, zoom);
                if(children.root) console.log(children);
                nodes_to_renderer.forEach( n => {this.renderEdges(this.edgesSvgs[Math.floor(Math.random() * 50) % 3], n.edges)});
            }
        });
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
    querySingleNode(node){
        //search the block
        const blockId = 'a0bc' + node.block, nodeName = blockId + 'a' + node.node;
        let find = false;

        this.graph.getAllComponents()[0].getNodes().forEach(cNode => {
            if(cNode.getId() === blockId){
                let nodeToDraw;
                cNode.biconnectedGraph.getNodes().forEach(ccNode => {
                    if(ccNode.getId() === nodeName){
                        console.log(ccNode + " " + nodeName);
                        find = true;
                        nodeToDraw = ccNode;
                        d3.select("#" + nodeName).attr("fill", "green").attr("r",50).transition().duration(2000).attr("r", ccNode.dimension);
                    }
                });
                if(!find){
                    nodeToDraw = new Node(nodeName, false, 0, 0);
                    nodeToDraw.x = cNode.x + Math.random() * cNode.dimension * 0.5 * Math.cos(Math.random()*6.28);
                    nodeToDraw.y = cNode.y + Math.random() * cNode.dimension * 0.5 * Math.cos(Math.random()*6.28);
                    cNode.biconnectedGraph.getNodes().push(nodeToDraw);
                }
                this.renderNodes(this.svgMaxOrder, [nodeToDraw],0);
                d3.select("#" + nodeToDraw.getId()).attr("fill", "green").attr("r",50).transition().duration(3000).attr("r", 5);
            }
        });

    }

}
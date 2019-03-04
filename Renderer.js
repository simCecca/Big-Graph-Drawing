class Renderer {

    //todo: creare una classe unica che definisca il flusso di esecuzione
    constructor() {
        this.svg = d3.select("#svgCanvas");
        this.svgElement = this.svg.append("g");
        this.svgCones = this.svgElement.append("g").attr("id", "cones");
        this.svgEdgesMin = this.svgElement.append("g").attr("id", "edgesMin");
        this.svgConesMin = this.svgElement.append("g").attr("id", "conesMin");
        this.svgEdgesMedium = this.svgElement.append("g").attr("id", "edgesMedium");
        this.svgConesMedium = this.svgElement.append("g").attr("id", "conesMedium");
        this.edgesFromCutV = this.svgElement.append("g").attr("id", "edgesFromCutV");
        this.svgEdgesMax = this.svgElement.append("g").attr("id", "edgesMax");

        this.svgNodes = this.svgElement.append("g").attr("id", "nodes");
        this.svgMaxOrder = this.svgElement.append("g").attr("id", "maxOrder");
        this.edgesSvgs = [this.svgEdgesMin, this.svgEdgesMedium, this.svgEdgesMax];
        this.conesSvgs = [this.svgCones, this.svgConesMin, this.svgConesMedium];
        this.graph = null;
        this.width = window.screen.availWidth * 0.7;
        this.height = window.screen.availHeight;
        this.algorithm = new DrawAlgorithm(this.width, this.height); // Dummy graph
        this.isJustCreatedTheRectForTheZoom =false;
        this.zoomStop = 0;
        this.previousScale = 1;
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
                           e.setIntermediateCoordinates();
                       });
                       this.drawEdgesbetweenConeAndCircle(node.cutVertexNeighboursFirst, zoom, 500);
                   }
                }
                this.svgNodes.append("text")
                    .attr("x", node.x + node.currentDimension * 2)
                    .attr("y", node.y + node.currentDimension * 2)
                    .attr("font-size", () =>
                    {
                        let dimension = node.currentDimension * 2, minDimension = this.graph.graph[cc].root.currentDimension * 0.33;
                        if(dimension < this.graph.graph[cc].root.currentDimension * 0.33)
                            dimension = minDimension;
                        return (dimension/2) + "px";
                    })
                    .attr("fill", "grey")
                    .text("Edges " + somma + " Nodes " + node.sizeNodes + " Name: " + node.name);
            })
            .on("mouseout", (node, i, nodes) => {
                if(!node.isABNode) {
                    d3.select(nodes[i]).transition().duration(100).attr("r", node => node.currentDimension);
                    d3.select("#" + node.father.getId()).transition().duration(100).attr("r", n => (n.root) ? 0 : n.currentDimension);
                    //emove the edges from the childrens
                    node.getNeighbours().forEach((children) => {
                        d3.select("#" + children.getId()).transition().duration(100).attr("r", n => n.currentDimension);
                    });
                }

                this.svgNodes.select("text").remove();
                this.edgesFromCutV.selectAll("polygon").remove();
                this.edgesFromCutV.selectAll("path").remove();

            })
            .call(d3.drag()
            //.on("drag", node => {node.x = d3.event.x; node.y = d3.event.y; this.renderEdges(this.graph.getConnectedComponent(cc).getEdges()); this.renderNodes([node],cc)}))
                .on("drag", node => {node.x = d3.event.x; node.y = d3.event.y; /*this.renderEdges(node.edges);*/ this.renderNodes(this.svgNodes, [node], cc); /*this.renderCones(node.cones, cc);*/}))
            .on("click", (nodeObject, i, nodes) => { const name = (nodeObject.getSPQRTree() != undefined) ? nodeObject.getSPQRTree().root.getId() : "ciao"; console.log((name.includes("p") ? "P" : name.includes("s") ? "S" : name.includes("r") ? "R" : "noValue"));})
            .attr('fill', node => {
                let color = 'transparent';
                (!node.isABNode || node.innerNode) ?  color = 'rgb(50,50,50)' : (node.isBlack) ? color = 'dark' : color = 'transparent'; return color;
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
                    return (node.root) ? 0 : node.currentDimension;

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
/*
        const svgEdge = this.edgesFromCutV.selectAll("circle")
            .data(nodes, edge => edge.id);

        svgEdge.enter()
            .append("circle")
            .merge(svgEdge)
            //.attr("x2", edge => {if(edge.color === "red") this.algorithm.edgesFromCutVertexToBlocks(edge.source, edge.target, 0); return edge.target.x;})
            .attr("id", edge =>  edge.id)
            .attr("r", 5)
            .attr("fill", "green")
            .attr("cx", edge => edge.x3)
            .attr("cy", edge => edge.y3);
*/

    }

    stopZoom(){
        this.zoomStop = (this.zoomStop + 1) % 2;
    }

    renderEdges(svg, edges, zoom = 1) {
        //const svgEdges = this.svgEdges.selectAll("line")
        const svgEdges = svg.selectAll("line")
            .data(edges, edge => edge.id); // edges aren't going to change...

        svgEdges.enter()
            .append("line")
            .merge(svgEdges)
            .attr("x1", edge => edge.source.x)
            .attr("y1", edge => edge.source.y)
            //.attr("x2", edge => {if(edge.color === "red") this.algorithm.edgesFromCutVertexToBlocks(edge.source, edge.target, 0); return edge.target.x;})
            .attr("x2", edge => edge.target.x)
            .attr("y2", edge => edge.target.y)
            .attr("id", edge =>  edge.id)
            .attr("stroke", edge => edge.color)
            .attr("stroke-width", 0.3/zoom);
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
        this.svgElement.attr("transform", d3.event.transform);

        if(d3.event.transform.k !== this.previousScale && d3.event.transform.k > 2 && !this.zoomStop) {
            //rescale all the nodes & edges
            this.renderNodes(this.svgNodes, this.graph.graph[0].getNodes(), 0, d3.event.transform.k);
            this.renderBiconnectedGraph(this.graph.graph[0], 0, d3.event.transform.k);
            this.renderObjectsAlternatingInTheBlock(this.graph.graph[0].cones, 0, d3.event.transform.k);
            this.previousScale = d3.event.transform.k;
        }
    }

    render() {
        this.graph.getAllComponents().forEach((connectedComponent, i) => {
            if(i === 0) {
                connectedComponent.sortTheCones();
                //this.renderEdges(this.svgEdges, connectedComponent.getEdges());
                //draw only the cutVertex and the node of the biconnected components
                let cutVToDraw = [];
                connectedComponent.getNodes().forEach(n => {
                    if(!n.isABNode || n.isBlack)
                        cutVToDraw.push(n);
                });
                this.renderNodes(this.svgNodes, cutVToDraw, i);
                console.log("nodes");
                //this.renderNodes(this.svgNodes, connectedComponent.getNodes(), i);
                this.renderBiconnectedGraph(connectedComponent, i);
                console.log("biconnected graph");
                this.renderObjectsAlternatingInTheBlock(connectedComponent.cones, i);
                console.log("coni");
                //this.renderCones(connectedComponent.cones, i);
                this.rendererRectForZooming();
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
                let nodes_to_renderer =  children.biconnectedGraph.nodes.slice(0, Math.floor(zoom) + 500);
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

}
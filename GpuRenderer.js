class GpuRenderer {
    constructor() {
        this.svg = d3.select("#svgCanvas");
        this.svgElement = this.svg.append("g");
        this.graph = null;
        this.width = 1500;
        this.height = 600;
        this.algorithm = new DrawAlgorithm(this.width, this.height); // Dummy graph
        this.isJustCreatedTheRectForTheZoom = false;

        //try GPU
        this.canvas = document.getElementById("main-canvas");
        // Create a WebGL 2D platform on the canvas:
        this.platform = Stardust.platform("webgl-2d", this.canvas, this.width, this.height);

        this.d3Canvas = d3.select("canvas");
    }

    async setGraph(graph) {
        this.graph = graph;
        await this.algorithm.drawBCTree(graph);
        const renderFunction = () => {
            this.render();
            //requestAnimationFrame(renderFunction);
        };

        requestAnimationFrame(renderFunction);
    }

    renderEdges(graph){
        //edges
        var sedges = Stardust.mark.create(Stardust.mark.line(), this.platform);
        sedges
            .attr("width", 0.5)
            .attr("color", [0.1,0.1,0.1,1] );

        sedges.attr("p1", (d) => [d.source.x, d.source.y]);
        sedges.attr("p2", (d) => [d.target.x, d.target.y]);

        sedges.data(graph.edges);
        sedges.render();
    }

    renderNodes(graph, cc){
        var circleSpec = Stardust.mark.circle();
        var circles = Stardust.mark.create(circleSpec, this.platform);
        circles.attr("center", (d) => [ d.x, d.y ]);
        circles.attr("radius", (node) => {node.currentDimension = (Math.log10(node.getSize()) / Math.log10(this.graph.getConnectedComponent(cc).getMaxSize())) * 20; if(node.hide) node.currentDimension = 0; if(!node.isABNode){node.currentDimension = 2} if(node.isBlack){node.currentDimension = 2} return node.dimension});
        //circles.attr("radius", 3);
        circles.attr("color", (node) => {let color = [1, 0.27, 0, 1]; (node.getId().includes("cut")) ?  color = [0, 0.5, 0, 1] : (node.isBlack) ? color = [0, 0, 0, 1] : color = [1, 0.27, 0, 1]; return color;});
        //circles.attr("color", [1, 0.27, 0, 1]);
        circles.data(graph.nodes);
        circles.render();
    }

    //for the zooming
    rendererRectForZooming(){
        if(!this.isJustCreatedTheRectForTheZoom) {
            this.isJustCreatedTheRectForTheZoom = true;
            var canvas = d3.select("canvas").call(d3.zoom().scaleExtent([1, 8]).on("zoom", zoom)),
                context = canvas.node().getContext("2d"),
                width = canvas.property("width"),
                height = canvas.property("height");

            var randomX = d3.randomNormal(width / 2, 80),
                randomY = d3.randomNormal(height / 2, 80),
                data = d3.range(2000).map(function() { return [randomX(), randomY()]; });

            draw();

            function zoom() {
                var transform = d3.event.transform;
                context.save();
                context.clearRect(0, 0, width, height);
                context.translate(transform.x, transform.y);
                context.scale(transform.k, transform.k);
                draw();
                context.restore();
            }

            function draw() {
                var i = -1, n = data.length, d;
                context.beginPath();
                while (++i < n) {
                    d = data[i];
                    context.moveTo(d[0], d[1]);
                    context.arc(d[0], d[1], 2.5, 0, 2 * Math.PI);
                }
                context.fill();
            }
        }
    }

    zoom(){
        //todo: d3.event.transform is a string like this: "translate(30,40) scale(2)" so if the scale is changed from the last update ricalculate the coordinate with the algorithm
        this.canvas.attr("transform", d3.event.transform);
    }

    render() {
        this.graph.getAllComponents().forEach((connectedComponent, i) => {
            this.renderEdges(connectedComponent);
            this.renderNodes(connectedComponent, i);
            //this.rendererRectForZooming();
        });


    }
}
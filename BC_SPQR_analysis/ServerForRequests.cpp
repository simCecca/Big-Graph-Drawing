/*
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////SERVER////////////////////////////////////////////////////////////////////
Server svr;

//httplib::Client cli("localhost", 4000, 1000);
svr.Get("/graph", [](const Request& req, Response& res) {
	res.set_header("access-control-allow-origin", "*");
	//load graph
	Graph G;
	GraphLoader GL = GraphLoader(get_graph_from_keyboard());
	G = GL.getGraph();

	//finish loading
	GraphCompositionJSON GCJ = GraphCompositionJSON(G);
	//GCJ.createJSON("prova");

	res.set_content(*GCJ.createJSON("prova"), "text/plain");
});


svr.listen("localhost", 4000);
///////////////////////////////////////END_SERVER////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//*/
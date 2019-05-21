//ogdf
#include <ogdf/basic/Graph.h>
#include <ogdf/fileformats/GraphIO.h>
#include <ogdf/basic/graph_generators.h>
//ogdf::connected_component
#include <ogdf/basic/Graph_d.h>
#include <ogdf/internal/planarity/ConnectedSubgraph.h>
//biconnected component
#include <ogdf/decomposition/BCTree.h>
#include <ogdf/decomposition/DynamicBCTree.h>
//triconnected component
#include <ogdf/decomposition/DynamicSPQRTree.h>
#include <ogdf/decomposition/DynamicSPQRForest.h>

//standard  c++
#include <iostream>
#include <list>
#include <vector>

//this project
#include "GraphLoader.h"
#include "GraphComposition.h"
#include "Windows.h"
#include "StructureJSON.h"
#include "GraphCompositionJSON.h"
#include "TaskManager.h"
#include "Monitor.h"

//#include "json/json.h"
#include "rapidjson/document.h"
#include "rapidjson/writer.h"
#include "rapidjson/stringbuffer.h"
#include "rapidjson/prettywriter.h"


//for the server
#include <httplib.h>
#include <thread>

using namespace rapidjson;

//stack & heap memory
#pragma comment(linker, "/STACK:300000000")
//#pragma comment(linker, "/HEAP:800000000")

#include <algorithm>
#include <functional>

#pragma comment(lib, "Ws2_32.lib")


using namespace ogdf;
using namespace std;
using namespace httplib;

void createGML(Graph G, std::stringstream& name){
	GraphAttributes GA(G, GraphAttributes::nodeLabel |
		GraphAttributes::edgeLabel); // Create graph attributes for this graph

	node v;
	forall_nodes(v, G){ // iterate through all the node in the grap
		edge curre;
		string s;
		forall_adj_edges(curre, v){
			s += to_string(curre->index()) + ",";
			GA.label(curre) = to_string(curre->index()).c_str();
		}
		char const *pchar = s.c_str(); //use char const* as target type
		GA.label(v) = pchar;
	}
	GraphIO::writeGML(GA, name);
}
//#pragma comment(linker, "/STACK:8000000000")
int main()
{
	/*
	TaskManager *tasks = new TaskManager(0);*/
	
	/* for bctree*/
	TaskManager *task = new TaskManager();
	Server svr;

	svr.Get("/bcgraph", [&task](const Request& req, Response& res) {
		res.set_header("access-control-allow-origin", "*");

		cout << "inside the decomposition of the graph" << endl;
		auto &name = req.get_param_value("name"); //take the name of the graph from the client
		string output = task->createTheCompositionStructure(name.c_str());
		Monitor().getMemoryInformation();
		cout << "sending to the client" << endl;
		res.set_content(output, "text/plain");
	});
	svr.Get("/bcgraph/onlydec", [&task](const Request& req, Response& res) {
		res.set_header("access-control-allow-origin", "*");

		cout << "inside the decomposition of the graph" << endl;
		auto &name = req.get_param_value("name"); //take the name of the graph from the client
		auto &json = req.get_param_value("json");
		task->decomposeTheGraph(name.c_str());
		string output = "\"decomposed\"";
		string yes = "true";
		if (strcmp(json.c_str(),yes.c_str()) == 0){
			output = task->createJson();
			cout << "sending to the client" << endl;
			res.set_content(output, "text/plain");
			task->freeJson();//free the memory
		}
		else{
			res.set_content(output, "text/plain");
		}
		cout << "finished" << endl;
	});

	svr.Get("/bcgraph/node", [task](const Request& req, Response& res) {
		res.set_header("access-control-allow-origin", "*");

		auto &nodeId = req.get_param_value("id");//id of the node in the original graph
		cout << "taking the block of this node" << endl;
		string output = task->getTheBlockOfANode(atoi(nodeId.c_str()));

		res.set_content(output, "text/plain");
		cout << "send to the client " << endl;
	});

	svr.Get("/bcgraph/spath", [task](const Request& req, Response& res) {
		res.set_header("access-control-allow-origin", "*");

		cout << "shorthest path" << endl;
		auto &start = req.get_param_value("start");
		auto &targhet = req.get_param_value("target");

		string output = task->takeTheShortestPath(atoi(start.c_str()), atoi(targhet.c_str()));

		res.set_content(output, "text/plain");
		cout << "send to the client " << endl;
	});

	svr.Get("/bcgraph/neighbours", [&task](const Request& req, Response& res) {
		res.set_header("access-control-allow-origin", "*");

		auto &nodeId = req.get_param_value("id");//id of the node in the original graph
		cout << "taking the neighbours of this node" << endl;
		string output = task->getTheNeighbours(atoi(nodeId.c_str()));

		res.set_content(output, "text/plain");
		cout << "send to the client " << endl;
	});

	int serverLocation = 1234;

	cout << "server up on " << serverLocation << endl;

	svr.listen("localhost", serverLocation);

		
	//end of the program
	cout << "finito tutto" << endl;

	return 0;
}
//ogdf
#include <ogdf/basic/Graph.h>
#include <ogdf/basic/graph_generators.h>
#include <ogdf/layered/DfsAcyclicSubgraph.h>

#include <ogdf/fileformats/GraphIO.h>

//standard
#include <iostream>

//JSON
#include "rapidjson/document.h"
#include "rapidjson/writer.h"
#include "rapidjson/stringbuffer.h"
#include "rapidjson/prettywriter.h"
#include <rapidjson/istreamwrapper.h>
#include <rapidjson/ostreamwrapper.h>

#include "GraphLoader.h"

//this project
#include "StructureJSON.h"
#include "GraphCompositionJSON.h"

using namespace ogdf;
using namespace std;


void GraphLoader::loadFromGML(){
	if (!GraphIO::readGML(*G, "gml/" + graphName + ".gml"))
		std::cerr << "Could not loadd " << "gml/" + graphName + ".gml" << std::endl;
	else
		cout << " NODES: " << G->numberOfNodes() << "    EDGES: " << G->numberOfEdges() << endl;
}

void GraphLoader::getExistingGraphJSON(){
	json = "\"notExist\"";
	std::ifstream ifs;
	string n = graphName + ".json";
	ifs.open(n.c_str());
	if (!ifs.is_open())
	{
		std::cerr << "Could not open file for reading!\n";
		//loadFromGML();
		//return EXIT_FAILURE;
	}
	else{

		IStreamWrapper isw{ ifs };

		Document doc{};
		doc.ParseStream(isw);

		StringBuffer buffer{};
		Writer<StringBuffer> writer{ buffer };
		doc.Accept(writer);

		if (doc.HasParseError())
		{
			std::cout << "Error  : " << doc.GetParseError() << '\n'
				<< "Offset : " << doc.GetErrorOffset() << '\n';
			//return EXIT_FAILURE;
		}
		else{

			const std::string jsonStr{ buffer.GetString() };
			json = jsonStr;
		}
	}
}

//costruttore
GraphLoader::GraphLoader(string name){
	graphName = name;
	G = new Graph();
}

	
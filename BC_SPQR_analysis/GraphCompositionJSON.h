#ifndef GRAPHCOMPOSITIONJSON_H
#define GRAPHCOMPOSITIONJSON_H

//json
#include "rapidjson/document.h"
#include "rapidjson/writer.h"
#include "rapidjson/stringbuffer.h"
#include "rapidjson/prettywriter.h"

using namespace std;
using namespace rapidjson;
using namespace ogdf;

#include "GraphComposition.h"
#include "StructureJSON.h"

class GraphCompositionJSON{

	private:
	
		StructureJSON *json;
		GraphComposition *composition;
		int isLazy;

		void numberOfEdgeOverEachConnectedComponents();
		int numberOfEdgeOverEachBiconnectedComponents(int);
		int numberOfEdgeOverEachTriconnectedComponents(DynamicSPQRTree*);
		int numberOfLazyEdges(int);

	public:
		GraphCompositionJSON(void){}
		GraphCompositionJSON(int);

		string* createJSON(string);

		//getter&setter
		void setGraphComposition(GraphComposition *compositionGraph){
			composition = compositionGraph;
		}

	
};



#endif
//ogdf
#include <ogdf/basic/Graph.h>

//json
#include "rapidjson/document.h"
#include "rapidjson/writer.h"
#include "rapidjson/stringbuffer.h"
#include "rapidjson/prettywriter.h"

//standard
#include<vector>

//this app
#include "StructureJSON.h"
#include "GraphComposition.h"
#include "GraphCompositionJSON.h"
#include "TaskManager.h"

using namespace std;
using namespace ogdf;
using namespace rapidjson;

///*
GraphCompositionJSON::GraphCompositionJSON(int isThisCreationLazy){
	json = new StructureJSON();
	isLazy = isThisCreationLazy;	
}
//*/
//lazy components
int GraphCompositionJSON::numberOfLazyEdges(int currentValue){
	/*a differenza della soluzione con spqrtree dove il numero di archi aumenta grazie agli archi fittizi,
	in questo caso questo numero non aumenta, questa è una differenza importante*/
	json->setKeyArray();
	json->setName("t");
	json->setKeyValue("size", currentValue);
	json->endObject(1);
	json->endArray();
	return currentValue;

}


//triconnected components
int GraphCompositionJSON::numberOfEdgeOverEachTriconnectedComponents(DynamicSPQRTree* tc){
	
	//per ogni spqrtree vado a calcolare
	Graph tree = tc->tree();
	node v;
	int numberOfSEdges = 0;
	int numberOfPEdges = 0;
	int numberOfREdges = 0;
	json->setKeyArray();
	forall_nodes(v, tree){
		//DynamicSkeleton skel;
		int numberOfEdges = tc->skeleton(v).getGraph().numberOfEdges();
		string name = "";

		if (tc->typeOf(v) == tc->SNode){
			numberOfSEdges += numberOfEdges;
			name = "s";
		}
		else if (tc->typeOf(v) == tc->PNode){
			numberOfPEdges += numberOfEdges;
			name = "p";
		}
		else{
			numberOfREdges += numberOfEdges;
			name = "r";
		}
		json->setName(name);
		json->setKeyValue("size", numberOfEdges);
		json->endObject(1);
	}
	
	json->endArray();
	//somma totale archi per questo blocco biconnesso
	return (numberOfSEdges + numberOfPEdges + numberOfREdges);

}


//biconnected components
int GraphCompositionJSON::numberOfEdgeOverEachBiconnectedComponents(int idConnectedComponent){
	
	int realIndexOfBiconnectedComponent = 0, numberOfSPQRTree = 0, totalEdgeOfThisConnectedSubGraph = 0, numberOfLazyComponents = 0;
	json->setKeyArray();
	Graph::CCsInfo *currentBCTree = new  Graph::CCsInfo((*composition->getBCTree())[idConnectedComponent]->auxiliaryGraph());
	//I'm deleting the current BCTree because I haven't to use it again
	delete (*composition->getBCTree())[idConnectedComponent];
	//with the auxiliary graph I have the cut vertex with 0 edges, and in the biconnected blocks I have to distinguish the base case (2 nodes and 1 edges)
	for (int indexOfTheBiconnectedBlock = 0; indexOfTheBiconnectedBlock < currentBCTree->numberOfCCs(); indexOfTheBiconnectedBlock++){
		
		int currentSumOfEdges = currentBCTree->numberOfEdges(indexOfTheBiconnectedBlock);
		
		if (currentSumOfEdges > 0){//I'm a biconnected block and not a Cut vertex
			json->setName("bc" + to_string(realIndexOfBiconnectedComponent));
			realIndexOfBiconnectedComponent++;

			//start triconnected components but only for possible values, so for nbiconnected components with at least 3 edges
			if (currentSumOfEdges > 2){
				//se lazy  è uguale a 0 allora vuol dire che calcolo tutti gli spqrtree, quindi se lazy è == 1 posso entrare solo se si parla di un spqrtree abbastanza grande
				if (currentSumOfEdges > 200 || isLazy == 0){
					ogdf::DynamicSPQRTree* tc = (*composition->getSPQRTree()->at(idConnectedComponent))[numberOfSPQRTree];
					
					currentSumOfEdges = numberOfEdgeOverEachTriconnectedComponents(tc);
					numberOfSPQRTree++;
				}
				else{
					currentSumOfEdges = numberOfLazyEdges((*composition->getNumberOfTriconnectedLessThanX()->at(idConnectedComponent))[numberOfLazyComponents]);
					numberOfLazyComponents++;
				}
			}
			json->setKeyValue("size", currentSumOfEdges);
			totalEdgeOfThisConnectedSubGraph += currentSumOfEdges;
			//end triconnected components
			json->endObject(1);
		}
	}

	//kill the currentBCTree for free some memory
	delete currentBCTree;
	json->endArray();
	//numero di archi per questa componente connessa
	json->setKeyValue("size", totalEdgeOfThisConnectedSubGraph);
	return totalEdgeOfThisConnectedSubGraph;

}

//connected components
void GraphCompositionJSON::numberOfEdgeOverEachConnectedComponents(){
	int totalEdjes = 0;
	json->setKeyArray();
	for (int i = 0; i < composition->getConnectedComponent()->numberOfCCs(); i++){
		
		json->setName("cc" + to_string(i));
		//biconnected components management
		totalEdjes += numberOfEdgeOverEachBiconnectedComponents(i);
		//end biconnected components
		
		json->endObject(1);
	}
	json->endArray();
	//totalsize in funzione della dimensione degli edge dei blocchi triconnessi
	json->setKeyValue("size", totalEdjes);

}

string* GraphCompositionJSON::createJSON(string name){

	int numberCC = composition->getConnectedComponent()->numberOfCCs();
	vector<int> numberEdgeCC;
	json->setName("cc");
	numberOfEdgeOverEachConnectedComponents();
	
	//close the restant object 
	json->endObject(1);

	//finish
	json->saveJSON(name);
	return json->streamJSON();
}

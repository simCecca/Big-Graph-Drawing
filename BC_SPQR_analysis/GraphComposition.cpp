//ogdf
#include <ogdf/basic/Graph.h>
#include <ogdf/layered/DfsAcyclicSubgraph.h>
//connected component
#include <ogdf/fileformats/GraphIO.h>
//biconnected component
#include <ogdf/decomposition/BCTree.h>
#include <ogdf/decomposition/DynamicBCTree.h>
//triconnected component
#include <ogdf/decomposition/SPQRTree.h>
#include <ogdf/decomposition/DynamicSPQRTree.h>

#include <new>
#include <ogdf/internal/basic/PoolMemoryAllocator.h>
#include <ogdf/internal/basic/MallocMemoryAllocator.h>

#include <ogdf/basic/basic.h>
#include <ogdf/basic/System.h>

#include <ogdf/internal/planarity/ConnectedSubgraph.h>

//standard
#include <vector>
#include <iostream>
#include <map>

#include "GraphComposition.h"
#include "Monitor.h"

using namespace ogdf;
using namespace std;

GraphComposition::GraphComposition(Graph *GR){
	G = GR;
	cc = new Graph::CCsInfo(*G);
	cout << "cc fatte" << endl;
	bc = new vector<DynamicBCTree*>();
	BCconstructor();
	cout << "bicomponents fatte" << endl;

	//after the biconnected components I can delete the Graph
	//delete G;

	//tc = new std::map<int, vector<ogdf::DynamicSPQRTree*>*>();
	//SPQRTreeConstructor();
	//cout << "finish triconnected components" << endl;
}


//costruttore caso in cui si vuole costruire tutta la struttura
GraphComposition::GraphComposition(Graph *GR, int isThisCreationLazy){
	G = GR;
	Monitor().getMemoryInformation();
	cc = new Graph::CCsInfo(*G);
	Monitor().getMemoryInformation();
	cout << "finish connected components" << endl;
	//per ogni componente connessa faccio un bc, quindi ho una lista di bc
	bc = new vector<DynamicBCTree*>();
	cout << "start biconnected components" << endl;
	BCconstructor();
	cout << "finish biconnected components" << endl;

	//from now to the rest of the  execution we needn't to conserve the original graph, so we dealloce it for more space
	//delete G;
	//per ogni componente biconnessa ho un tc
	//tc = new std::map<int,vector<ogdf::DynamicSPQRTree*>*>();
	//lazy = isThisCreationLazy;
	//numberOfTriconnectedLessThanX = new std::map<int, vector<int>*>();
	//SPQRTreeConstructor();
	//cout << "finish triconnected components" << endl;
	
}

//sub_constructor for initialize the bc components
void GraphComposition::BCconstructor(){
	
	for (int i = 0; i < cc->numberOfCCs(); i++){
		Graph *SG = new Graph();
		NodeArray<node> *nSG_to_nG = new NodeArray<node>();
		//Monitor().getMemoryInformation();
		ConnectedSubgraph<int>::call(*G,*SG, cc->v(cc->startNode(i)), *nSG_to_nG);
		bc->push_back(new DynamicBCTree(*SG));
		//Monitor().getMemoryInformation();
		//cout << cc->startNode(i) << "  " << cc->numberOfNodes(i) << "  " << cc->startNode(1) << endl;
	}
	
}
const char *yn(bool b)
{
	return b ? "yes" : "no";
}
//sub_constructor for initialize the tc components
//strategy:  for each value of the BCTree vector iterate to each biconnected component of the value and for each component create a SPQRTree 
void GraphComposition::SPQRTreeConstructor(){

	/*a vector of SPQRTree is genereted from each biconnected block of each BCTree in the vector bc */
	
	bool thereIsASPQRTree = false, thereIsALazy = false;
	//run over each BCTree
	for (int i = 0; i < cc->numberOfCCs(); i++){
		int successionOfTheExecution = 0, numberSpqrTreeVector = 0, successionOfTheExecutiony = 0;
		node bT = NULL;
		//in currentTree vengono salvati tutti gli spqrtree dell'albero biconnesso corrente (i-esimo)
		vector<DynamicSPQRTree*> *currentTree = new vector<DynamicSPQRTree*>();
		vector<int> *currentLazy = new vector<int>();
		Graph::CCsInfo *currentBCTree = new Graph::CCsInfo((*bc)[i]->auxiliaryGraph());
		
		for (int j = 0; j < currentBCTree->numberOfCCs(); j++){
			int currentNumberOfEdges = currentBCTree->numberOfEdges(j);
			//if a subGraph have more than 2 edges is a biconnected block af the BCTree
			if (currentBCTree->numberOfEdges(j) > 2){
				if (currentBCTree->numberOfEdges(j) > 200 || lazy == 0){
					if (successionOfTheExecution % 1000 == 1)
						cout << successionOfTheExecution << endl;
					successionOfTheExecution++;

					thereIsASPQRTree = true;

					Graph *SG = new Graph();
					NodeArray<node> *nSG_to_nG = new NodeArray<node>();
					ConnectedSubgraph<int>::call((*bc)[i]->auxiliaryGraph(), *SG, currentBCTree->v(currentBCTree->startNode(j)), *nSG_to_nG);

					currentTree->push_back(new DynamicSPQRTree(*SG));
				}
				else{
					thereIsALazy = true;
					currentLazy->push_back(currentNumberOfEdges);
					successionOfTheExecutiony++;
					if (successionOfTheExecutiony % 1000 == 1){
						cout << "ciccio" << successionOfTheExecutiony << " nn " << currentNumberOfEdges << endl;
						//Monitor().getMemoryInformation();

					}
				}
			
			}
		}
		//now I can free the currentBCTree

		/*nel caso in cui ho creato almeno un spqrtree lo salvo, non posso creare un spqrtee quando ho ho solo 2 nodi e meno di 3 archi*/
		if (thereIsASPQRTree){
			(*tc)[i] = currentTree;
			thereIsASPQRTree = false;

		}
		if (thereIsALazy){
			(*numberOfTriconnectedLessThanX)[i] = currentLazy;
			thereIsALazy = false;

		}

	}

}





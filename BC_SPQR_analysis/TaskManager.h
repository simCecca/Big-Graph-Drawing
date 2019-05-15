#ifndef TASKMANAGER_H
#define TASKMANAGER_H

//this application
#include "GraphComposition.h"
#include "GraphCompositionJSON.h"
#include "GraphLoader.h"
#include "TaskManager.h"
#include "TriconnectedAnalysis.h"
#include "BCTreeJSON.h"

using namespace std;
using namespace ogdf;

class TaskManager{

	private:
		//methods
		string get_graph_from_keyboard();
		int TaskManager::getIdOfTheMaxComponent(){
			//max components
			int maxId = 0, maxEdges = 0;
			for (int i = 0; i < composition->getConnectedComponent()->numberOfCCs(); i++){
				if (composition->getConnectedComponent()->numberOfEdges(i) > maxEdges){
					maxId = i;
					maxEdges = composition->getConnectedComponent()->numberOfEdges(i);
				}
			}
			return maxId;
		}
		node TaskManager::takeANodeInTheGraph(int maxId, int nodeId){
			node v;
			forall_nodes(v, (*composition->getBCTree())[maxId]->originalGraph()){
				if (v->index() == nodeId){//I find the right node in the original graph
					return v;//take the right block
				}
			}
			return NULL;
		}

		string TaskManager::getInformationAboutANode(node v, int maxId){
			string output = "";

			node block = (*composition->getBCTree())[maxId]->bcproper(v);//take the right block
			node nodeInTheBlock = (*composition->getBCTree())[maxId]->repVertex(v, block);//take the corresponding node in the current block
			int isACutVertex = ((*composition->getBCTree())[maxId]->typeOfBNode(block) == BCTree::CComp) ? 1 : 0;
			output = "{ \"block\": " + std::to_string(block->index()) + ", \"node\": " + std::to_string(nodeInTheBlock->index()) + ", \"nodeoriginal\": " + std::to_string(v->index()) + ", \"cutvertex\": " + std::to_string(isACutVertex) + ", \"degree\": " + std::to_string(v->degree()) + " }";
			
			return output;
		}
		

		//for loading the graph
		GraphLoader *GL;
		//starting graph
		Graph *G;

		//for create the tree structure (connected-biconnected-triconnected / components)
		GraphComposition *composition;
		int isLazy;
		
		//for the json
		GraphCompositionJSON *GCJ;

		//for the spqrtree's node importance
		TriconnectedAnalysis *ta;

		//BCTree draw
		BCTreeJSON *bcJSON;

		//GraphName & taskToExecute
		string graphName;
		int task;


	public:
		TaskManager();


		//taking the name of the graph from the client
		string createTheCompositionStructure(string);
		string TaskManager::getTheBlockOfANode(int);
		string TaskManager::takeTheShortestPath(int, int);
		string TaskManager::getTheNeighbours(int);
		void freeJson();

		//methods
		
		//for the json
		void createJsonForBCTrees();
		//void createTheCompositionStructure();
		string createJson();
		void createJsonForAnalysis(int);
		void decomposeTheGraph(string);
			
		//

};

#endif
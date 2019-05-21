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

//this application
#include "GraphComposition.h"
#include "GraphCompositionJSON.h"
#include "GraphLoader.h"
#include "TaskManager.h"
#include "TriconnectedAnalysis.h"
#include "BCTreeJSON.h"


/*create a simple task manager for wich you can execute all the possible tasks with this app*/

/*for execute all the tasks with one command*/
/*
TaskManager::TaskManager(){

	G = new Graph();
	GL = new GraphLoader(get_graph_from_keyboard());
	G = GL->getGraph();
	delete GL;
	
	createTheCompositionStructure();

	//create Json
	createJson();

	//set the importance for each node of each spqrtree
	/*
	ta = new TriconnectedAnalysis();
	ta->setTriconnectedComponents(composition->getSPQRTree());
	ta->calculateTheImportancesOfTheTriconnectedGraphs();
	

}

void TaskManager::createTheCompositionStructure(){
	if (task >= 3)
		composition = new GraphComposition(G);
	else
		composition = new GraphComposition(G, (task - 1)); // if task is not 3 then specify if the composition is lazy or not
}*/

//create the graph from the server
TaskManager::TaskManager(){}

string TaskManager::createTheCompositionStructure(string name){
	GL = new GraphLoader(name);
	GL->getExistingGraphJSON();
	string output = GL->json;
	delete GL;
	graphName = name;
	return output;
}

void TaskManager::decomposeTheGraph(string name){
	G = new Graph();
	GL = new GraphLoader(name);
	GL->loadFromGML();
	G = GL->getGraph();
	graphName = name;
	delete GL;
	composition = new GraphComposition(G);
}

void TaskManager::freeJson(){
	bcJSON->freeSpace();
	delete bcJSON;
}

string TaskManager::getTheNeighbours(int nodeId){
	string output = "";

	int connectedComponent = findTheCC(nodeId);

	node v = takeANodeInTheGraph(connectedComponent, nodeId);
	if (v != NULL){
		output = "{ \"neighbours\": [";
		output.append(getInformationAboutANode(v, connectedComponent));
		//find the all neightbours
		adjEntry adj;
		forall_adj(adj, v){
			node currentNode = adj->twinNode();
			output.append(",");
			output.append(getInformationAboutANode(currentNode, connectedComponent));
		}
		output.append("]}");
	}
	return output;
}

//get the block for a certain node from the client

string TaskManager::getTheBlockOfANode(int nodeId){
	string output = "";

	int connectedComponent = findTheCC(nodeId);
	//take the right biconnected block so the right original graph
	node v = takeANodeInTheGraph(connectedComponent, nodeId);
	if (v != NULL){
		output = getInformationAboutANode(v, connectedComponent);
	}
	return output;
}



//take the shortest path
string TaskManager::takeTheShortestPath(int idNode1, int idNode2){

	//find the start node in the graph
	//max components
	int connectedComponentNode1 = findTheCC(idNode1);
	int connectedComponentNode2 = findTheCC(idNode2);
	
	node start = takeANodeInTheGraph(connectedComponentNode1, idNode1);
	node target = takeANodeInTheGraph(connectedComponentNode2, idNode2);
	string output = "";
	if (connectedComponentNode1 == connectedComponentNode2){
		//bfs for the shortest path
		NodeArray<node>(*fatherOfEachNode) = new NodeArray<node>((*composition->getBCTree())[connectedComponentNode1]->originalGraph());
		NodeArray<bool> mark((*composition->getBCTree())[connectedComponentNode1]->originalGraph(), false);// original graph = (*composition->getBCTree())[maxId]->originalGraph()
		SListPure<node> bfs;
		bfs.pushBack(start);
		// mark the starting node
		mark[start] = true;
		(*fatherOfEachNode)[start] = start;
		bool found = false;//found = true when I find the target node
		while (!bfs.empty() && !found) {
			node w = bfs.popFrontRet();
			adjEntry adj;
			forall_adj(adj, w){
				node v = adj->twinNode();
				if (!mark[v]) {
					mark[v] = true;
					bfs.pushBack(v);
					(*fatherOfEachNode)[v] = w;//set w as father of the current node v
					if (v->index() == target->index()) found = true; //find the target node
				}
			}
		}
		//create the output json
		output = "{ \"shortestpath\": [";
		bool findRoot = false;
		node currentNode = target;
		output.append(getInformationAboutANode(target, connectedComponentNode1) + ",");
		while (currentNode->index() != start->index()){
			currentNode = (*fatherOfEachNode)[currentNode];
			if (currentNode != NULL){
				if (currentNode->index() == start->index())
					findRoot = true;
				else{
					output.append(getInformationAboutANode(currentNode, connectedComponentNode1) + ",");
				}
			}
		}
		output.append(getInformationAboutANode(start, connectedComponentNode1));
		delete fatherOfEachNode;
	}
	else{
		output = "{ \"neighbours\": [";
		output.append(getInformationAboutANode(start, connectedComponentNode1) + ",");
		output.append(getInformationAboutANode(target, connectedComponentNode2));
	}
	output.append("]}");
	return output;
}


string TaskManager::createJson(){
	//create Json
	bcJSON = new BCTreeJSON();
	return bcJSON->createBCTreeJSON(composition, graphName);
}

void TaskManager::createJsonForBCTrees(){
	//for first I create the BCTrees component in the us new structure (GraphComposition)
	//composition->BCconstructor();

	//now I have to create the specific json with the BCTreeJSON class
	//bcJSON = new BCTreeJSON(composition, graphName);
}

//private method
void TaskManager::createJsonForAnalysis(int isThisCreationLazy){
	GCJ = new GraphCompositionJSON(isThisCreationLazy);
	GCJ->setGraphComposition(composition);
	GCJ->createJSON(graphName);
}



//take the name of the graph by input
string TaskManager::get_graph_from_keyboard(){
	cout << "insert a graph name" << endl;
	cin >> graphName;
	cout << "1. for the analysis on the graph based on the distribution of its components (biconnected & triconnected) 3. for the Component's Tree (biconnected & triconnected)" << endl;
	string kindOfTask;
	cin >> kindOfTask;
	task = std::stoi(kindOfTask);
	return graphName + ".gml";
}




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

#include <ogdf/basic/GraphAttributes.h>

//standard
#include <vector>
#include <iostream>
#include <map>
#include <list>


//this application
#include "TriconnectedAnalysis.h"
#include "SPQRAnalytics.h"

TriconnectedAnalysis::TriconnectedAnalysis(){
	triconnectedWithImportanceForEachSkeleton = new std::map<int, vector<SPQRAnalytics*>*>();
}

vector<float> *TriconnectedAnalysis::calculateAnXVectorOfTheSPQRTreeAnalytics(vector<ogdf::DynamicSPQRTree*> currentTree, int i, ogdf::SPQRTree::NodeType type){
	List<node> xNodes = currentTree[i]->nodesOfType(type);
	//create a vector with the dimension of the x components (with x = s || p || r)
	vector<float> *numberOfEdges = new vector<float>(xNodes.size());
	int j = 0, totalEdges = 0;
	for (ogdf::List<node>::iterator itList = xNodes.begin(); itList != xNodes.end(); ++itList){
		//calculate the number of edges for this node
		(*numberOfEdges)[j] = currentTree[i]->skeleton(*itList).getGraph().numberOfEdges();
		//calculate the total edges of this components
		totalEdges += (*numberOfEdges)[j];
		j++;
	}
	j = 0;
	for (ogdf::List<node>::iterator itList = xNodes.begin(); itList != xNodes.end(); ++itList){
		(*numberOfEdges)[j] /= totalEdges;
		cout << " type " << type << " current value " << (*numberOfEdges)[j] << endl;
		j++;
	}
	return numberOfEdges;
}

void TriconnectedAnalysis::calculateTheImportancesOfTheTriconnectedGraphs(){
	//iterate for each connected components
	for (std::map<int, vector<ogdf::DynamicSPQRTree*>*>::iterator it = tc->begin(); it != tc->end(); ++it){

		//for each SPQRTree and for each triconnected components calculate the new graph with the importance for each components
		vector<ogdf::DynamicSPQRTree*> *currentTree = it->second;
		vector<SPQRAnalytics*> *currentAnalytics = new vector<SPQRAnalytics*>((*currentTree).size());
		//for each SPQRTree in the vector
		for (int i = 0; i < currentTree->size(); i++){			
			(*currentAnalytics)[i] = new SPQRAnalytics();
			(*currentAnalytics)[i]->setSNodes(calculateAnXVectorOfTheSPQRTreeAnalytics(*currentTree, i, ogdf::SPQRTree::SNode));
			(*currentAnalytics)[i]->setSNodes(calculateAnXVectorOfTheSPQRTreeAnalytics(*currentTree, i, ogdf::SPQRTree::PNode));
			(*currentAnalytics)[i]->setSNodes(calculateAnXVectorOfTheSPQRTreeAnalytics(*currentTree, i, ogdf::SPQRTree::RNode));
		}
		(*triconnectedWithImportanceForEachSkeleton)[it->first] = currentAnalytics;
	}
}

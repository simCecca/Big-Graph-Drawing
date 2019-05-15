#ifndef TRICONNECTEDANALYSIS_H
#define TRICONNECTEDANALYSIS_H

using namespace std;
using namespace ogdf;

#include "SPQRAnalytics.h"

class TriconnectedAnalysis{
	
	private:
		//methods
		vector<float> *calculateAnXVectorOfTheSPQRTreeAnalytics(vector<ogdf::DynamicSPQRTree*>, int, ogdf::SPQRTree::NodeType);


		//build a map with key<index of the connected components> and value<an array og GraphAttributes that represents an SPQRTree>
		std::map<int, vector<SPQRAnalytics*>*> *triconnectedWithImportanceForEachSkeleton;
		//triconnected subgraph from GraphComposition
		std::map<int, vector<ogdf::DynamicSPQRTree*>*> *tc;

	public:
		TriconnectedAnalysis();

		//methods
		void calculateTheImportancesOfTheTriconnectedGraphs();

		void setTriconnectedComponents(std::map<int, vector<ogdf::DynamicSPQRTree*>*> *currentTc){
			tc = currentTc;
		}
};

#endif

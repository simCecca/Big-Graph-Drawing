#ifndef GRAPHCOMPOSITION_H
#define GRAPHCOMPOSITION_H

#include <map>
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

#include <vector>

using namespace ogdf;
using namespace std;

#if __GNUC__ >= 5
if (std::is_trivially_copy_assignable<E>::value) {
	E *p = static_cast<E *>(realloc(m_pStart, sNew*sizeof(E)));
	if (p == nullptr) OGDF_THROW(InsufficientMemoryException);
	m_pStart = p;
#endif

#define OGDF_NEW new
class GraphComposition{

	private:
		ogdf::Graph *G;

		ogdf::Graph::CCsInfo *cc;
		vector<ogdf::DynamicBCTree*> *bc;

		/*per ogni blocco biconnesso creo un spqrtree quindi avrò un vettore di spqrtree per ogni blocco connesso*/
		std::map<int,vector<ogdf::DynamicSPQRTree*>*> *tc;
		int lazy;
		std::map<int, vector<int>*> *numberOfTriconnectedLessThanX;
		

		//private function
		
		

	public:
		GraphComposition(ogdf::Graph*);
		GraphComposition(ogdf::Graph*, int);

		//for create BCTrees and SPQRTrees
		void BCconstructor();
		void SPQRTreeConstructor();

		//getters and setters
		ogdf::Graph *getGraph(){ return G; }
		vector<DynamicBCTree*> *getBCTree(){ return bc; }
		Graph::CCsInfo *getConnectedComponent(){ return cc; }
		std::map<int,vector<DynamicSPQRTree*>*> *getSPQRTree(){	return tc; }
		std::map<int, vector<int>*> *getNumberOfTriconnectedLessThanX(){ return numberOfTriconnectedLessThanX; }

};



#endif
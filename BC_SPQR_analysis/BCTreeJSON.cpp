

#include "BCTreeJSON.h"
#include <map>
#include <math.h>

#include <iostream>
#include <map>
#include <set>
#include <algorithm>
#include <functional>


BCTreeJSON::BCTreeJSON(){}

string BCTreeJSON::createBCTreeJSON(GraphComposition *composition, string name){
	json = new StructureJSON();
	json->setName("root");
	json->setKeyValue("size", composition->getConnectedComponent()->constGraph().numberOfEdges());
	json->setKeyArray();
	//for each connected components i have a BCTree

	cout << "number of cc " << composition->getConnectedComponent()->numberOfCCs();
	int numero = 0;
	for (int i = 0; i < composition->getConnectedComponent()->numberOfCCs(); i++){
		cout << "cc " << i << endl;
		json->setName("cc" + to_string(i)); //need an endObject
		json->setKeyValue("size", composition->getConnectedComponent()->numberOfEdges(i));
		//map for collecting for each cut vertex the son that are cut vertex too
		std::map<int, vector<int>*> *cutV2cutVNeighbour = new std::map<int, vector<int>*>();
		std::map<int, int> *cutVIDOriginal2cutVIDBCTree = new std::map<int, int>();
		/*per poter dare una rappresentazione i blocchi biconnessi a livello di visualizzazione futura l'idea è quella di andare a far vedere mano a mano che si zoomma le varie componenti interne con maggiore grado
		quindi vado a calcolarmi qual'è la componente connessa più grande a livello di numero di nodi, dopo di che considero solo quelle componenti che */
		//calculating the maximum size in the biconnected blocks
		node v;
		//for all BCTree i generate the specific json
		json->setKeyArray();
		int j = 0, progressiveNumberOfTriconnectedComponents = 0;
		cout << "number of blocks " << (*composition->getBCTree())[i]->numberOfBComps() << endl;
		forall_nodes(v, (*composition->getBCTree())[i]->bcTree()){
			//for all the biconnected blocks of this BCTree i save in the jml all the adjacent (cutvertexes)
			if ((*composition->getBCTree())[i]->typeOfBNode(v) == BCTree::BComp){
				json->setName("bc" + to_string(v->index()));
				json->setKeyValue("size", (*composition->getBCTree())[i]->numberOfEdges(v));
				json->setKeyValue("sizeNodes", (*composition->getBCTree())[i]->numberOfNodes(v));
				adjEntry adj;
				//start array json
				json->setKeyArray();
				forall_adj(adj, v){//now all nodes are cut vertex
					node currentCutVertex = adj->twinNode();
					json->setName("cutv" + to_string(currentCutVertex->index()));
					//ora mi prendo un vicino del cutvertex differente dal blocco corrente
					int currentBNode2currentCNode = 0;

					//ho trovato il cutVertex all'interno del blocco biconnesso v, ora devo solamente contare i suoi vicini
					node cutVertexInTheBlock = (*composition->getBCTree())[i]->cutVertex(currentCutVertex, v);
					currentBNode2currentCNode = cutVertexInTheBlock->degree();

					//salvo il numero di archi che vi sono tra il cutVertex current ed il blocco biconnesso v
					json->setKeyValue("numberEdges", currentBNode2currentCNode);
					json->endObject(1);
				}
				json->endArray();
				//guardo all'interno del blocco biconnesso corrente, calcolo il max degree e prendo tutti i nodi con il min
				//if ((*composition->getBCTree())[i]->numberOfNodes(v) >= 10 && v->firstAdj() != NULL){
				if (v->firstAdj() != NULL){
					node cT = v->firstAdj()->twinNode();
					node cH = (*composition->getBCTree())[i]->cutVertex(cT, v);
					Graph *SG = new Graph();
					NodeArray<node> *nSG_to_nG = new NodeArray<node>();
					ConnectedSubgraph<int>::call((*composition->getBCTree())[i]->auxiliaryGraph(), *SG, cH, *nSG_to_nG);
					node currentNode;
					std::map<int, int> *node2degree = new std::map<int, int>();
					std::map<int, int> *nodeidbctree2nodeidoriginal = new std::map<int, int>();
					int maxDegree = 0;
					json->setKeyArrayName("innerGraph");
					if (SG->numberOfNodes() <= 3000){
						int maxNumber = 0;
						forall_nodes(currentNode, *SG){
							if (maxNumber <= 500){
								json->setObjectKeyValue("name", currentNode->index());
								json->setKeyValue("nameOriginal", (*composition->getBCTree())[i]->original(currentNode)->index());
								json->setKeyValue("size", currentNode->degree());
								json->endObject(1);
							}
							maxNumber++;
						}
						json->endArray();
					}
					else{
						forall_nodes(currentNode, *SG){//find the max degree
							if ((*composition->getBCTree())[i]->typeOfGNode(currentNode) == (*composition->getBCTree())[i]->Normal){
								int degree = currentNode->degree();
								if (degree > maxDegree)
									maxDegree = degree;
							}
						}
						int minDegree = log10(maxDegree) - 1; //int and not float because we wont the floor value
						forall_nodes(currentNode, *SG){//save the important node in the json
							int degree = currentNode->degree();
							if (log10(degree) >= minDegree){
								node2degree->insert(std::pair<int, int>(currentNode->index(), degree));
								nodeidbctree2nodeidoriginal->insert(std::pair<int, int>(currentNode->index(), (*composition->getBCTree())[i]->original(currentNode)->index()));
							}
						}

						///////////////////////////////////////////////////////////SORTING////////////////////////////////////////////////////////////////
						// Declaring the type of Predicate that accepts 2 pairs and return a bool
						typedef std::function<bool(std::pair<int, int>, std::pair<int, int>)> Comparator;

						// Defining a lambda function to compare two pairs. It will compare two pairs using second field
						Comparator compFunctor = [](std::pair<int, int> elem1, std::pair<int, int> elem2)
						{
							if (elem1.second == elem2.second)
								return elem1.first > elem2.first;
							return elem1.second > elem2.second;
						};

						// Declaring a set that will store the pairs using above comparision logic
						std::set<std::pair<int, int>, Comparator> setOfNodes(node2degree->begin(), node2degree->end(), compFunctor);
						///////////////////////////////////////////////////////////END SORTING////////////////////////////////////////////////////////////
						// Iterate over a set using range base for loop
						int numberOfNodesInserted = 0;
						for (std::pair<int, int> element : setOfNodes){
							if (numberOfNodesInserted <= 3000){
								json->setObjectKeyValue("name", element.first);
								json->setKeyValue("nameOriginal", nodeidbctree2nodeidoriginal->find(element.first)->second);
								json->setKeyValue("size", element.second);
								json->endObject(1);
								numberOfNodesInserted++;
							}
						}
						delete node2degree;
						delete nodeidbctree2nodeidoriginal;
						json->endArray();
					}
				}
				//for each Biconnected Components I create the corresponding SPQRTree
				/*
				if ((*composition->getBCTree())[i]->numberOfEdges(v) > 2){ // if it isn't an elementary biconnected block
				json->setKeyArrayName("tree");
				createTheSPQRTreeJson(composition, progressiveNumberOfTriconnectedComponents, i);
				json->endArray();
				progressiveNumberOfTriconnectedComponents++;
				}
				*/
				json->endObject(1);
			}
			j++;

			if(numero % 20000 == 0) cout << "block " << numero << endl;
			numero++;
		}
		//end of this connected component
		json->endArray();
		node currentNodeOfTheBCTree;
		//write the cutVertex	
		json->setKeyArrayName("cutVerticies");
		forall_nodes(currentNodeOfTheBCTree, (*composition->getBCTree())[i]->bcTree()){
			if ((*composition->getBCTree())[i]->typeOfBNode(currentNodeOfTheBCTree) == BCTree::CComp){//if this is  a cutVertex
				json->setObjectKeyValue("name", currentNodeOfTheBCTree->index());
				json->setKeyArray();
				adjEntry adjBlock;
				//forall_adj(adjBlock, currentNodeOfTheBCTree){//i  vicini ora sono tutti blocchi biconnessi
				node neighbourOfTheCurrentCutVertex = currentNodeOfTheBCTree->firstAdj()->twinNode();//blocco biconnesso corrente
				node cH = (*composition->getBCTree())[i]->cutVertex(currentNodeOfTheBCTree, neighbourOfTheCurrentCutVertex);//trovo il cutvertex all'interno del blocco biconnesso quindi ora posso ritrovarmi il nodo nel grafo originale
				node cG = (*composition->getBCTree())[i]->original(cH);//ora ho il nodo nel grafo originale, quindi vedo quale dei vicini è un cutvertex e poi mi ritrovo il suo nodo univoco nel Block cut tree
				adjEntry adjCutVertexOriginalGraph;
				forall_adj(adjCutVertexOriginalGraph, cG){
					node neighbour = adjCutVertexOriginalGraph->twinNode();
					if ((*composition->getBCTree())[i]->typeOfGNode(neighbour) == BCTree::CutVertex){//se è un cutvertex allora mi prendo il suo nodo univoco nel bctree e prendo il sui id
						node correspondingCutVertex = (*composition->getBCTree())[i]->bcproper(neighbour);
						json->setObjectKeyValue("name", correspondingCutVertex->index());
						json->setKeyValue("commonBcomponent", (*composition->getBCTree())[i]->bComponent(cG, neighbour)->index());
						json->endObject(1);
					}
				}
				//}
				json->endArray();
				json->endObject(1);
			}

		}
		json->endArray();
		json->endObject(1);
		cout << "numero " << numero << endl;
	}
	json->endArray();
	json->endObject(1);
	return json->saveJSON(name);
}

void BCTreeJSON::createTheSPQRTreeJson(GraphComposition *composition, int numberOfSPQRTree, int idBcTree){
	//current spqrtree from the map of all the SPQRTree
	ogdf::DynamicSPQRTree* tc = (*composition->getSPQRTree()->at(idBcTree))[numberOfSPQRTree];
	
	Graph tree = tc->tree();
	node root;
	
	//
	forall_nodes(root, tree){
		int numberOfEdges = tc->skeleton(root).getGraph().numberOfEdges();
		
		json->setName(returnTheNameOfTheNode(tc->typeOf(root)) + to_string(root->index()));
		json->setKeyValue("size", numberOfEdges);

		adjEntry adj;

		json->setKeyArray();
		forall_adj(adj, root){
			node current = adj->twinNode();
			
			int sonNumberOfEdges = tc->skeleton(current).getGraph().numberOfEdges();

			json->setName(returnTheNameOfTheNode(tc->typeOf(current)) + to_string(current->index()));
			json->setKeyValue("size", sonNumberOfEdges);
			json->endObject(1);
		}
		//close the array
		json->endArray();
		//now I have visited all my sons, so I close my brace
		json->endObject(1);
	}
}

	string BCTreeJSON::returnTheNameOfTheNode(int rootType){
		string name = "";
		if (rootType == 0){
			name = "s";
		}
		else if (rootType == 1){
			name = "p";
		}
		else{
			name = "r";
		}
		return name;
	}
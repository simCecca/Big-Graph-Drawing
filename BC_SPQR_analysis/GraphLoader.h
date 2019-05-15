#ifndef GRAPHLOADER_H
#define GRAPHLOADER_H

class GraphLoader{

	private:
		ogdf::Graph *G = NULL;
		string graphName;

	public:
		string json = "";
		GraphLoader(string name);
		void loadFromGML();
		ogdf::Graph *getGraph(){	return G; }
		void getExistingGraphJSON();

};



#endif
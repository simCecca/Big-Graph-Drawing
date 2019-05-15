#ifndef BCTREEJSON_H
#define BCTREEJSON_H

//this application
#include "StructureJSON.h"
#include "GraphComposition.h"

using namespace std;
using namespace ogdf;

class BCTreeJSON{
	
	private:
		StructureJSON *json;

		void createTheSPQRTreeJson(GraphComposition*, int, int);
		string returnTheNameOfTheNode(int);

	public:
		BCTreeJSON();
		string BCTreeJSON::createBCTreeJSON(GraphComposition*, string);
		void freeSpace(){ delete json; };




};


#endif
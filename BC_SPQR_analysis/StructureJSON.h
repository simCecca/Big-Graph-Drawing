#ifndef STRUCTUREJSON_H
#define STRUCTUREJSON_H

#include "rapidjson/document.h"
#include "rapidjson/writer.h"
#include "rapidjson/stringbuffer.h"
#include "rapidjson/prettywriter.h"
#include <vector>


using namespace std;
using namespace rapidjson;

class StructureJSON{

	private:
		rapidjson::StringBuffer s;
		PrettyWriter<StringBuffer> writer;

		void init();

public:
	StructureJSON(){
		//reset the writer with a new stream;
		writer.Reset(s);
		
	};

	int i = 0;
	
	//object key value
	void setKeyValue(string, int);
	void setName(string);
	void setObjectKeyValue(string, int);
	void StructureJSON::setObjectNameValue(string, int);
	
	//data structures
	void createObjectArray(string, vector<int>);
	void StructureJSON::setObjectKeyValueArray(string, int, vector<int>);

	//save file
	string saveJSON(string);
	string* streamJSON();
	void visualizeJSON();

	//get & set
	void setKeyArrayName(string);
	void setKeyArray();
	void endArray();

	//primitive
	void startObject(){ writer.StartObject(); }
	void endObject(int i){ for (int j = 0; j < i; j++) writer.EndObject(); };

};



#endif
//json
#include "rapidjson/document.h"
#include "rapidjson/writer.h"
#include "rapidjson/stringbuffer.h"
#include "rapidjson/prettywriter.h"


//this app
#include "StructureJSON.h"

//ogdf
#include <ogdf/basic/Graph.h>

//standard
#include <vector>



using namespace std;
using namespace rapidjson;

void StructureJSON::init(){
	writer.StartObject();
	writer.Key("root");
}

void StructureJSON::setName(string value){
	writer.StartObject();
	string name = "name";
	writer.Key(name.c_str());
	writer.String(value.c_str());
}

void StructureJSON::setObjectKeyValue(string key, int value){
	writer.StartObject();
	//the function key need to a char*
	writer.Key(key.c_str());
	writer.Uint(value);
}

void StructureJSON::setObjectNameValue(string key, int value){
	writer.StartObject();
	//the function key need to a char*
	writer.Key(key.c_str());
	writer.Uint(value);
}

void StructureJSON::setKeyValue(string key, int value){
	//the function key need to a char*
	writer.Key(key.c_str());
	writer.Uint(value);
}

string StructureJSON::saveJSON(string name){
	cout << "in save" << endl;
	std::ofstream of(name + ".json");
	of << s.GetString();
	cout << "saved" << endl;
	if (!of.good())
		throw std::runtime_error("Can't write the JSON string to the file!");
	cout << "before returning saving" << endl;
	return s.GetString();
}

string* StructureJSON::streamJSON(){
	return new string(s.GetString(), s.GetSize());
}


void StructureJSON::visualizeJSON(){
	cout << s.GetString() << endl;
}


//array
void StructureJSON::createObjectArray(string key, vector<int> values){
	setKeyArray();
	writer.StartObject();
	int size = values.size();
	for (int i = 0; i < size; i++){
		setKeyValue(key, values[i]);
	}
	writer.EndObject();
	writer.EndArray();
}

void StructureJSON::setObjectKeyValueArray(string key, int value, vector<int> values){
	writer.StartObject();
	//the function key need to a char*
	writer.Key(key.c_str());
	writer.Uint(value);
	createObjectArray(key, values);
	writer.EndObject();
}

void StructureJSON::setKeyArray(){ 
	string children = "children";
	writer.Key(children.c_str());
	writer.StartArray(); 
}

void StructureJSON::setKeyArrayName(string name){
	string children = name;
	writer.Key(children.c_str());
	writer.StartArray();
}

void StructureJSON::endArray(){ writer.EndArray(); }

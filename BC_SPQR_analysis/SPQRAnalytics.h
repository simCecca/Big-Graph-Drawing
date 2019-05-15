#ifndef SPQRANALYTICS_H
#define SPQRANALYTICS_H

using namespace std;

class SPQRAnalytics{

	private:
		vector<float> *sNodes;
		vector<float> *pNodes;
		vector<float> *rNodes;
	
	public:
		SPQRAnalytics(){
			sNodes = new vector<float>();
			pNodes = new vector<float>();
			rNodes = new vector<float>();
		}

		//get & set
		void setSNodes(vector<float> *nodes){
			sNodes = nodes;
		}
		void setPNodes(vector<float> *nodes){
			pNodes = nodes;
		}
		void setRNodes(vector<float> *nodes){
			rNodes = nodes;
		}
};



#endif
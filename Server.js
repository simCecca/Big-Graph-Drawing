class Server{


    //load graph from server
    async loadFromServer(graphPath){
        const graph = await fetch(graphPath);
        const textOfTheResponse = await graph.json();
       
        return new Promise((resolve, reject) => {
            try{
                resolve(textOfTheResponse);
            }
            catch(e) {
                reject(Error("Problem for taking the graph from the server"));
            }
        });
    }

}
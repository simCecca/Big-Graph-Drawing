#ifndef MONITOR_H
#define MONITOR_H

using namespace std;
using namespace ogdf;

class Monitor{

public:
	void getMemoryInformation(){
		std::cout
			<< "---------------------------------------" << std::endl
			<< "      System-specific information      " << std::endl
			<< "---------------------------------------" << std::endl
			<< std::endl

			<< "Memory management:" << std::endl
			<< "------------------" << std::endl
			<< "Total physical memory: " << System::physicalMemory() / 1024 / 1024 << " MBytes" << std::endl
			<< "  available:           " << System::availablePhysicalMemory() / 1024 / 1024 << " MBytes" << std::endl
			<< "  used by process:     " << System::memoryUsedByProcess() / 1024 << " KBytes" << std::endl
#if defined(OGDF_SYSTEM_WINDOWS) || defined(__CYGWIN__)
			<< "  peak amount:         " << System::peakMemoryUsedByProcess() / 1024 << " KBytes" << std::endl
#endif
			<< std::endl
			<< "allocated by malloc:   " << System::memoryAllocatedByMalloc() / 1024 << " KBytes" << std::endl
			<< "  in freelist:         " << System::memoryInFreelistOfMalloc() / 1024 << " KBytes" << std::endl
			<< std::endl
			<< "allocated by OGDF:     " << System::memoryAllocatedByMemoryManager() / 1024 << " KBytes" << std::endl
			<< "  in global freelist:  " << System::memoryInGlobalFreeListOfMemoryManager() / 1024 << " KBytes" << std::endl
			<< "  in thread freelist:  " << System::memoryInThreadFreeListOfMemoryManager() / 1024 << " KBytes" << std::endl;
	}

};

#endif
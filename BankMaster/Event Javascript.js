
if (!utils.isDataContainerNotPresent(node, "OrganisationSupplierBankAccount")) {
    var bankDc = node.getDataContainerByTypeID("OrganisationSupplierBankAccount").getDataContainers();
    var itr = bankDc.iterator();
    
    while (itr.hasNext()) {
        var bankDcInst = itr.next().getDataContainerObject();
        
		var bankKey = bankDcInst.getValue("BankKeyInternal").getSimpleValue().toString().toUpperCase().trim();//Added trim() - INC2732502 - v812484
		bankDcInst.getValue("BankKeyInternal").setSimpleValue(bankKey);
		
    		var bankCountry = bankDcInst.getValue("Country").getSimpleValue();
    		if (bankCountry == "Czechia") {
            bankCountry = "Czech Republic";
        } else if (bankCountry == "United States") {
            bankCountry = "USA";
        }
		var key = bankKey+bankCountry;
		var bankObject = step.getEntityHome().getObjectByKey("BankMasterUniqueKey", key);

		
		if (bankObject != null) {
			var dcBank = bankDcInst.getDataContainerReferences(reftype);
			if(dcBank.size() && bankObject.getID() == dcBank.iterator().next().getTarget().getID()){
				// if same object then don't do anything
			}else if(!(dcBank.size())){
				try{
					bankDcInst.createReference(bankObject, reftype);
				}catch(e){
					//
				}	
			}else {
				try{
				dcBank.iterator().next().delete();
				bankDcInst.createReference(bankObject, reftype);
				}catch(e){
					//
				}
			}
		}
		else{
			 var parent = step.getEntityHome().getEntityByID("BankMasterRoot");
		      var data = parent.createEntity(null, "BankMaster");
		      logger.info(data.getID());
		      data.getValue("BankKey").setSimpleValue(bankKey);
		      //data.getValue("Country").setSimpleValue(bankCountry);
		      data.getValue("BankCountry").setSimpleValue(bankCountry);
		      if(bankKey && bankCountry){
		      	 data.getValue("InitiatedByOrg").setLOVValueByID("Y");//Added as part of defect 22348
		      	data.startWorkflowByID("BankMasterCreateWorkflow", "Bank Master Create workflow is initiated from Organisation");
		      }
		      if(bankDcInst.getDataContainerReferences(reftype).size()>0){
		      	((bankDcInst.getDataContainerReferences(reftype).toArray())[0]).delete();
		      }
		      bankDcInst.createReference(data, reftype);
		}

    }
}
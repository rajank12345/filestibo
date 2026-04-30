//V812109: 21131 ;
if (!utils.isDataContainerNotPresent(node, "OrganisationSupplierBankAccount")) {
    var bankDc = node.getDataContainerByTypeID("OrganisationSupplierBankAccount").getDataContainers();
    var itr = bankDc.iterator();
    
    while (itr.hasNext()) {
        var bankDcInst = itr.next().getDataContainerObject();
		var bankKeyinter = bankDcInst.getValue("BankKeyInternal").getSimpleValue();
		var bankKey = bankKeyinter == null? "": bankKeyinter.toString().toUpperCase();
		bankDcInst.getValue("BankKeyInternal").setSimpleValue(bankKey);
		
    		var bankCountry = bankDcInst.getValue("Country").getSimpleValue();
    		if (bankCountry == "Czechia") {
            bankCountry = "Czech Republic";
        } else if (bankCountry == "United States") {
            bankCountry = "USA";
        }
		var key = bankKey+bankCountry;
		var bankObject = manager.getEntityHome().getObjectByKey("BankMasterUniqueKey", key);
          if (bankObject != null) {
          	log.severe(bankObject.getID());
			var dcBank = bankDcInst.getDataContainerReferences(reftype);
			if(dcBank.size() && bankObject.getID() == dcBank.iterator().next().getTarget().getID()){
				bankDcInst.getValue("Isinactive?(Bank Master)").setSimpleValue(bankObject.getValue("IsInactive").getSimpleValue());
				bankDcInst.getValue("BankName(Bank Master)").setSimpleValue(bankObject.getValue("BankName").getSimpleValue());
				bankDcInst.getValue("SWIFT/BIC(Bank Master)").setSimpleValue(bankObject.getValue("SWIFTBIC").getSimpleValue());
				bankDcInst.getValue("SWIFTBIC").setSimpleValue(bankDcInst.getValue("SWIFT/BIC(Bank Master)").getSimpleValue()); //20535
				bankDcInst.getValue("BankNumber(Bank Master)").setSimpleValue(bankObject.getValue("BankNumber").getSimpleValue());
				bankDcInst.getValue("LocalLanguageVersion(Bank Master)").setSimpleValue(bankObject.getValue("LocalLanguageVersion").getSimpleValue());
				bankDcInst.getValue("BankNameinlocallanguage1(Bank Master)").setSimpleValue(bankObject.getValue("BankNameInLocalLanguage1").getSimpleValue());
				bankDcInst.getValue("BankNameinlocallanguage2(Bank Master)").setSimpleValue(bankObject.getValue("BankNameInLocalLanguage2").getSimpleValue());
				bankDcInst.getValue("BankStreetinlocallanguage1(Bank Master)").setSimpleValue(bankObject.getValue("BankStreetInLocalLanguage1").getSimpleValue());
				bankDcInst.getValue("BankStreetinlocallanguage2(Bank Master)").setSimpleValue(bankObject.getValue("BankStreetInLocalLanguage2").getSimpleValue());
				bankDcInst.getValue("BankStreetinlocallanguage3(Bank Master)").setSimpleValue(bankObject.getValue("BankStreetInLocalLanguage3").getSimpleValue());
				bankDcInst.getValue("BankStreetinlocallanguage4(Bank Master)").setSimpleValue(bankObject.getValue("BankStreetInLocalLanguage4").getSimpleValue());
				bankDcInst.getValue("BankStreetinlocallanguage5(Bank Master)").setSimpleValue(bankObject.getValue("BankStreetInLocalLanguage5").getSimpleValue());
				bankDcInst.getValue("StreetNuminlocallanguage(Bank Master)").setSimpleValue(bankObject.getValue("StreetNumberInLocalLanguage").getSimpleValue());
				bankDcInst.getValue("Districtinlocallanguage(Bank Master)").setSimpleValue(bankObject.getValue("DistrictInLocalLanguage").getSimpleValue());
				bankDcInst.getValue("Cityinlocallanguage(Bank Master)").setSimpleValue(bankObject.getValue("CityinLocalLanguage").getSimpleValue());
			}
		}
    }
}
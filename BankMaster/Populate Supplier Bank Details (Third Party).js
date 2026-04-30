//V812109: 22739: linked this rule to 3PVendorUpdate WF on Exit of Add Details;
var name1 = node.getValue("NameLine1").getSimpleValue();
var name2 = node.getValue("NameLine2").getSimpleValue();
var map = new java.util.HashMap();
var fullName = node.getValue("LegalName").getSimpleValue();
var bankAccHoldr = fullName == null ? null : (fullName + "").length > 60 ? fullName.substring(0, 60) : fullName;
var c = 1;
var i = 65;

if (!utils.isDataContainerNotPresent(node, "OrganisationSupplierBankAccount")) {
	var bankDc = node.getDataContainerByTypeID("OrganisationSupplierBankAccount").getDataContainers();
    var itr = bankDc.iterator();
    
    while (itr.hasNext()) {
    	var bankDcInst = itr.next().getDataContainerObject();
    	var bankPartnerType = bankDcInst.getValue("PartnerBankType").getSimpleValue();
    	if(bankPartnerType){
    		
    		var bankCurr =  bankDcInst.getValue("UPMCurrency").getID()?bankDcInst.getValue("UPMCurrency").getID():"";
    		var bankSequenceNumber = bankDcInst.getValue("BankAccountSequenceNumber").getSimpleValue();
    		//map.put(bankCurr, bankDcInst.getValue("BankAccountSequenceNumber").getSimpleValue());
            if (map.containsKey(bankCurr)) {
                if(map.get(bankCurr)<bankSequenceNumber){
                	map.put(bankCurr,bankSequenceNumber);
                }
            }
            else{
            	  map.put(bankCurr,bankSequenceNumber);
            }
    		
    	}
    	
    }
}

if (!utils.isDataContainerNotPresent(node, "OrganisationSupplierBankAccount")) {
    var bankDc = node.getDataContainerByTypeID("OrganisationSupplierBankAccount").getDataContainers();
    var itr = bankDc.iterator();
    while (itr.hasNext()) {
        var bankSeq="";
        var bankDcInst = itr.next().getDataContainerObject();
        bankDcInst.getValue("BankAccountHolder").setSimpleValue(bankAccHoldr);
        var ibancode = bankDcInst.getValue("SAP-IBAN").getSimpleValue();
        log.info(ibancode + "adf");
        if (ibancode) {
            ibancode = ibancode.trim().replaceAll("\\s+", "");
            bankDcInst.getValue("SAP-IBAN").setSimpleValue(ibancode);
        }
        //        bankSeq = c > 9 ? String.fromCharCode(i) : c;
        //        bankDcInst.getValue("BankAccountSequenceNumber").setSimpleValue(bankSeq);
        //        c > 9 && c < 35 ? (i++, c++) : c++;
        var bankPartnerType = bankDcInst.getValue("PartnerBankType").getSimpleValue();
        if(bankPartnerType==null){
        var bankCurr =  bankDcInst.getValue("UPMCurrency").getID()?bankDcInst.getValue("UPMCurrency").getID():"";
        if (bankCurr&&bankCurr!="") {
        	//defect 22122 start..
        	var bankKey = bankDcInst.getValue("BankKeyInternal").getSimpleValue();
			 if (bankKey && bankKey.startsWith("IHC")) {
            bankSeq=0; 
			 }//defect 22122 End.. (below logic was already there,added it inside the else part
			 else
			 {
            if (!map.containsKey(bankCurr)) {
                map.put(bankCurr, 1);
            }else{
            	var number = 0;
            	number = parseInt(map.get(bankCurr))+1;
            	map.put(bankCurr, number);
            }
            var count = parseInt(map.get(bankCurr));
            
            //    var bankSeq;
            if (count >= 0 && count <= 9) {
                bankSeq = String.fromCharCode(48 + count);
            } else if (count >= 10 && count <= 35) {
                bankSeq = String.fromCharCode(65 + count - 10);
            } else {
                bankSeq ="";
            }
			 }
            log.severe(bankDcInst.getValue("SAP-BANKN").getSimpleValue());
            //var bankSeq = bankDcInst.getValue("BankAccountSequenceNumber").getSimpleValue();
        }
        bankDcInst.getValue("BankAccountSequenceNumber").setSimpleValue(bankSeq);
        
        bankDcInst.getValue("PartnerBankType").setSimpleValue(bankCurr + bankSeq);
        log.severe(bankDcInst.getValue("PartnerBankType").getSimpleValue()+" - "+map);
        log.severe(bankDcInst.getValue("BankAccountSequenceNumber").getSimpleValue()+"Raghav");

        }

        
        var bankKey = bankDcInst.getValue("BankKeyInternal").getSimpleValue();
        var bankCountry = bankDcInst.getValue("Country").getSimpleValue();
        if (bankCountry == "Czechia") {
            bankCountry = "Czech Republic";
        } else if (bankCountry == "United States") {
            bankCountry = "USA";
        }
        var key = bankKey + bankCountry;
        var bankObject = manager.getEntityHome().getObjectByKey("BankMasterUniqueKey", key);
        if (bankObject) {
            bankDcInst.getValue("IsBankKeyInactive?").setSimpleValue(bankObject.getValue("IsInactive").getSimpleValue());
        }
    }
}
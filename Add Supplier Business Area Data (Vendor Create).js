var selectedNodes = web.getSelectedSetOfNodes(); 
var selection = web.getSelection();
if (selectedNodes.size() == 1) {
	if (selection.size() == 0) {
		var flag = true;
		var selectedNode = selectedNodes.iterator().next();
		var baDataReferenced = utils.getReferencesTargets(node, refTypeLEToBAData);
		for (var i = 0; i < baDataReferenced.size(); i++) {
			var baReferenced = utils.getReferencesTargets(baDataReferenced.get(i), refTypeBADataToBA);
			if (selectedNode.equals(baReferenced.get(0))) {
				web.showAlert("ERROR", "", "The following Business Area is already addded: " + selectedNode.getName() + ". Please select different Business Area.");
				flag = false;
			}
		}
	
		if (flag == true) {
			var bpID = node.getValue("MDMBPNumber").getSimpleValue();
			var selectedNode = selectedNodes.iterator().next();
			var root = manager.getEntityHome().getEntityByID("BA-"+selectedNode.getValue("ReferenceDataID").getSimpleValue() + "-ORG-SUPP-DATA");
			var baData = root.createEntity(null, "SAPOrganisationSupplierBusinessAreaData");
			var ref = baData.createReference(selectedNode, refTypeBADataToBA);
			node.createReference(baData, refTypeLEToBAData);
			baData.createReference(node, baParentRef);
			var referenceDataID = selectedNode.getValue("ReferenceDataID").getSimpleValue();
			var referenceDataName = selectedNode.getValue("ReferenceDataName").getSimpleValue();
			var vendorNumber = getAttrValuesSingleDC(node,"SAPSupplierRoleData","EMVendorNumber");
			var baDataReferenced = utils.getReferencesTargets(node, refTypeLEToBAData);
			for (var i = 0; i < baDataReferenced.size(); i++) {
			var baReferenced = utils.getReferencesTargets(baDataReferenced.get(i), refTypeBADataToBA);
			if(baReferenced.get(0).getValue("ExternalSystemsID").getSimpleValue()==selectedNode.getValue("ExternalSystemsID").getSimpleValue())
			{
				utils.copyReferences(baDataReferenced.get(i),baData,plantRef,plantRef,null);
			
			}
			}
			if(vendorNumber){
				var updatedVendorNumber = vendorNumber.toString().padStart(10,'0');
				baData.getValue("EMVendorNumber").setSimpleValue(updatedVendorNumber);
				
			}
			var vendorSAPBP = getAttrValuesSingleDC(node,"SAPSupplierRoleData","VendorSAPBPNumber");
			if(vendorSAPBP){
				var updatedVendorSAPBPNumber = vendorSAPBP.toString().padStart(10,'0');
				//baData.getValue("VendorSAPBPNumber").setSimpleValue(updatedVendorSAPBPNumber);
				manager.getKeyHome().updateUniqueKeyValues2(java.util.Map.of("VendorSAPBPNumber", updatedVendorSAPBPNumber), baData);
			}
			baData.getValue("DeactivatedforBusinessArea").setLOVValueByID("N");
			baData.getValue("ActiveContractInPlace?").setLOVValueByID("N");
			//Defect 18825: Commented below lines for Ariba
//			baData.getValue("PreferedOrderingMethodsForAGB").setLOVValueByID("EMAIL");
//			baData.getValue("IsVendorNeededforAribaCatalogs?").setLOVValueByID("N");
//			if(baData.getValue("IsVendorNeededforAribaCatalogs?").getSimpleValue() == "Yes"){
//				baData.getValue("AribaCatalogsActivationIndicator").setLOVValueByID("Y");
//			}
			baData.getValue("BusinessAreaID").setSimpleValue(referenceDataID);
			//baData.getValue("EMVendorNumber").setSimpleValue(vendorNumber);
			//baData.getValue("VendorSAPBPNumber").setSimpleValue(vendorSAPBP);
			baData.getValue("ReferenceDataName").setSimpleValue(referenceDataName);
			baData.getValue("MDMBPNumber").setSimpleValue(bpID);
			baData.setName(referenceDataName.trim());
        //This code sets the path as per data level
            var upmPath = node.getValue("DataLevelPath").getSimpleValue();
            var newPath = upmPath +" -<gt/> " + baData.getName();
            baData.getValue("DataLevelPath").setSimpleValue(newPath);
		  baData.getValue("LegalName").setSimpleValue(node.getValue("LegalName").getSimpleValue());//21457 : Suryaamrutha
		  web.showAlert("ACKNOWLEDGMENT", "", "Business Area has been added successfully: "+referenceDataName);
		}		
	} else {
		web.showAlert("INFO", "", "Please deselect rows");
	}
}

function getAttrValuesSingleDC(node,dcID,attrId){
	if(utils.isDataContainerNotPresent(node,dcID)){
		return null;
	}
	var dc = node.getDataContainerByTypeID(dcID);
	var dcObj = dc.getDataContainerObject();
	return dcObj.getValue(attrId).getSimpleValue();
}
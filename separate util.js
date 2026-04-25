function writeUserComments(node, state, approvalSignature, comments) {
	node.getManager().executeWritePrivileged(function () {
		writeUserCommentsInternal(node, state, approvalSignature, comments);
	});
}
function writeUserCommentsInternal(node, state, approvalSignature, comments) {
	var userComments = node.getValue("ATT_UserComments").getSimpleValue();
	var df = new java.text.SimpleDateFormat("yyyy-MM-dd HH:mm:ss");
	var multiDC = node.getDataContainerByTypeID("DC_PubWF_User_Comments");
	var dcObject = multiDC.addDataContainer().createDataContainerObject("");
	dcObject.getValue("ATT_ApprovalDate").setSimpleValue(df.format(new Date()));
	dcObject.getValue("ATT_UserName").setSimpleValue(node.getManager().getCurrentUser().getName());
	if (comments) {
		dcObject.getValue("ATT_UserComments").setSimpleValue(comments);
	}
	dcObject.getValue("ATT_ApprovalSignature").setSimpleValue(approvalSignature);
	dcObject.getValue("ATT_Workflow_State").setSimpleValue(state);
	node.getValue("ATT_UserComments").setSimpleValue("");
}

function setTableDataByTemplateandDC(nodeObj,manager){
	var contexts = manager.getContextHome().getContexts();
	for (var context in Iterator(contexts)) {
		const publicationLinkTypeID = "P2CL_PRODUCTGRP_TO_PUBLICATION_TMPL";
		var classificationProductLinkTypeHome = manager.getHome(com.stibo.core.domain.classificationproductlinktype.ClassificationProductLinkTypeHome);
		var publicationLinkType= classificationProductLinkTypeHome.getLinkTypeByID(publicationLinkTypeID);
		log.info(publicationLinkType)
		manager.executeInContext(context.getID(), function(contextManager) {
		  	var node = contextManager.getProductHome().getProductByID(nodeObj.getID());
			var dimensionTableOption = nodeObj.getValue("ATT_DimensionTableOption").getSimpleValue();
			log.info(dimensionTableOption+ "Tapered")
			var publicationTypeLinks = node.queryClassificationProductLinks(publicationLinkType).asList(1000);
			for (var i = 0; i < publicationTypeLinks.size(); i++) {
				var classificationlink = publicationTypeLinks.get(i);
				var classification = classificationlink.getClassification();
				var classificationID = classification.getID();
				log.info(classificationID+ "  " + context.getID())
				if (classificationID == "PublicationTemplateParocPDSEN14303") {
					setDimensiontableValuesforproductGroup_Cylinder(node,manager);
				}
				if (classificationID == "PublicationTemplateParocPDSEN14303_Flat" || classificationID == "PublicationTemplateParocPDSEN13162") {
					log.info(classificationID+ "")
					if(dimensionTableOption == "Flat Rectangular"){
						setDimensiontableValuesforproductGroup_Flat(node,manager);						
					}
					if(dimensionTableOption == "Tapered"){
						setDimensiontableValuesforproductGroup_Tapered(node,manager);
					}
				}
				if(classificationID == "PublicationTemplateParocPDSEN13162") {
					setThermalResistanceValuesforproductGroup(node,manager);
				}
//				if(classificationID == "PublicationTemplateParocDOPEN14064") {
//					setTCandSCfromDC_DOP(node,manager);
//				}
//				if(classificationID == "PublicationTemplateParocPDSEN14064") {
//					setTCandSCfromDC_PDS(node,manager);					
//				}
			}
		});
	}
}

// XPF-2035 - Added by ADMIN_BS - 19/03/2025
// Function to calculate Dimension Table Attribute Values for Cylinder
function setDimensiontableValuesforproductGroup_Cylinder(node,manager){
	var contexts = manager.getContextHome().getContexts();
	for (var context in Iterator(contexts)) {
		manager.executeInContext(context.getID(), function(contextManager) {
		  	var productGroup = contextManager.getProductHome().getProductByID(node.getID());
		  	productGroup.getValue("ATT_ENLength").deleteCurrent();
		  	productGroup.getValue("ATT_ENThickness").deleteCurrent();
		  	productGroup.getValue("ATT_InnerDiameter").deleteCurrent();
		  	var dict = {}
		  	var lengthRange = [];
		  	var diameterRange = [];
		  	var thicknessRange = [];
		  	var baseItems = node.getChildren().iterator();
		  	var baseItem = null;
			while(baseItems.hasNext()){
				baseItem = baseItems.next();
				if(baseItem.getObjectType().getID().equals("BaseItem")){
					var bsToDisplay = baseItem.getValue("ATT_BaseItemtoDisplay").getValues().iterator();
					while(bsToDisplay.hasNext()){
						var contextID = bsToDisplay.next().getID();
						if(contextID == context.getID()){
							var baseItemLength = baseItem.getValue("ATT_Length1").getValue();
							var baseItemThickness = baseItem.getValue("ATT_Depth1").getValue();
							var baseItemDiameter = baseItem.getValue("ATT_DiamInner1").getValue();
							if(baseItemLength != null){
								lengthRange.push(baseItemLength)
								thicknessRange.push(baseItemThickness)
								diameterRange.push(baseItemDiameter)
							}
							
						}
					}
				}
			}
			if(lengthRange.length > 0){
				lengthRange.sort((x, y) => x - y);
				lengthRange = removeDuplicatesFromArr(lengthRange)
				for(var i = 0; i<lengthRange.length; i++){
					productGroup.getValue("ATT_ENLength").addValue(lengthRange[i]);
				}
			} 
			if(thicknessRange.length > 0){
				thicknessRange.sort((x, y) => x - y);
				var thicknessArray = removeNullFomArry(thicknessRange);
				productGroup.getValue("ATT_ENThickness").setSimpleValue(findMinMaxRangeInArray(thicknessArray));
			}
			if(diameterRange.length > 0){
				diameterRange.sort((x, y) => x - y);
				var diameterArray = removeNullFomArry(diameterRange);
				productGroup.getValue("ATT_InnerDiameter").setSimpleValue(findMinMaxRangeInArray(diameterArray));
			}
		});
	}
	return 0;
}


// XPF-2035 - Added by ADMIN_BS - 18/03/2025
// Function to calculate Thermal Resistance Table Attribute Values
function setThermalResistanceValuesforproductGroup(node,manager){
	var contexts = manager.getContextHome().getContexts();
	for (var context in Iterator(contexts)) {
		manager.executeInContext(context.getID(), function(contextManager) {
		  	var productGroup = contextManager.getProductHome().getProductByID(node.getID());
		  	productGroup.getValue("ATT_ENThermalResistance").deleteCurrent();
		  	productGroup.getValue("ATT_ThermalResistancethickness").deleteCurrent();
		  	if(productGroup.getValue("ATT_ENThermalConductivity").getSimpleValue() != null){
			  	var dict = {}
			  	var baseItems = node.getChildren().iterator();
			  	var baseItem = null;
				while(baseItems.hasNext()){
					baseItem = baseItems.next();
					if(baseItem.getObjectType().getID().equals("BaseItem")){
						var bsToDisplay = baseItem.getValue("ATT_BaseItemtoDisplay").getValues().iterator();
						while(bsToDisplay.hasNext()){
							var contextID = bsToDisplay.next().getID();
							if(contextID == context.getID()){
								var BIThermalresistance = baseItem.getValue("ATT_ThermalResistance").getValue();
								var BIThickness = Number(baseItem.getValue("ATT_Depth1").getValue());
								if(BIThickness != null && BIThickness != "null" && BIThickness != ""){
									dict[BIThickness] = BIThermalresistance;
								}
							}
						}
					}
				}
				var sort = sortNumberKeys(dict)
				for (var key in sort){
					productGroup.getValue("ATT_ThermalResistancethickness").addValue(key);
					productGroup.getValue("ATT_ENThermalResistance").addValue(sort[key]);
				}
		  	}
		});
	} 
	return 0;
}


// XPF-2035 - Added by ADMIN_BS - 19/03/2025
// Function to calculate Dimension Table Attribute Values for Flat Documents
function setDimensiontableValuesforproductGroup_Tapered(node,manager){
	var contexts = manager.getContextHome().getContexts();
	for (var context in Iterator(contexts)) {
		manager.executeInContext(context.getID(), function(contextManager) {
		  	var productGroup = contextManager.getProductHome().getProductByID(node.getID());
		  	productGroup.getValue("ATT_Depth_Thickness").deleteCurrent();
		  	productGroup.getValue("ATT_ENWidthXLength").deleteCurrent();
		  	var dict = {};
		  	var baseItems = node.getChildren().iterator();
		  	var baseItem = null;
			while(baseItems.hasNext()){
				baseItem = baseItems.next();
				if(baseItem.getObjectType().getID().equals("BaseItem")){
					var bsToDisplay = baseItem.getValue("ATT_BaseItemtoDisplay").getValues().iterator();
					while(bsToDisplay.hasNext()){
						var contextID = bsToDisplay.next().getID();
						if(contextID == context.getID()){
							var BIWidth_Length = baseItem.getValue("ATT_BaseItemWidthLength").getValue();
							var BIDepth_Thickness1 = baseItem.getValue("ATT_Depth1").getValue();
							var BIDepth_Thickness2 = baseItem.getValue("ATT_Depth2").getValue();
							if(BIDepth_Thickness1 != null && BIDepth_Thickness1 != "" && BIDepth_Thickness2 != null && BIDepth_Thickness2 != ""){
								dict[BIDepth_Thickness1 + "/" + BIDepth_Thickness2] =  BIWidth_Length;
							}
						}
					}
				}
			}
			var sort = sortNumberKeys(dict)
			for (var key in sort){
				productGroup.getValue("ATT_ENWidthXLength").addValue(sort[key]);
				productGroup.getValue("ATT_Depth_Thickness").addValue(key);
			}
		});
	}
	return 0;
}

function setDimensiontableValuesforproductGroup_Flat(node,manager){
	var contexts = manager.getContextHome().getContexts();
	for (var context in Iterator(contexts)) {
		manager.executeInContext(context.getID(), function(contextManager) {
		  	var productGroup = contextManager.getProductHome().getProductByID(node.getID());
		  	productGroup.getValue("ATT_Depth_Thickness").deleteCurrent();
		  	productGroup.getValue("ATT_ENWidthXLength").deleteCurrent();
		  	var dict = {};
		  	var baseItems = node.getChildren().iterator();
		  	var baseItem = null;
			while(baseItems.hasNext()){
				baseItem = baseItems.next();
				if(baseItem.getObjectType().getID().equals("BaseItem")){
					var bsToDisplay = baseItem.getValue("ATT_BaseItemtoDisplay").getValues().iterator();
					while(bsToDisplay.hasNext()){
						var contextID = bsToDisplay.next().getID();
						if(contextID == context.getID()){
							var BIWidth_Length = baseItem.getValue("ATT_BaseItemWidthLength").getValue();
							var BIDepth_Thickness = baseItem.getValue("ATT_Depth1").getValue();
							if(BIDepth_Thickness && BIWidth_Length){
								dict[BIWidth_Length] +=  BIDepth_Thickness + ",";
							}
						}
					}
				}
			}
			var sort = sortKeysLength_Width(dict)
			for (var key in sort){
				var Thickness = sort[key].slice(9,-1).split(",").filter((item, index) => sort[key].slice(9,-1).split(",").indexOf(item) === index);
				var productThickness = removeNullFomArry(Thickness).sort((a, b) => a - b);
				productGroup.getValue("ATT_ENWidthXLength").addValue(key);
				productGroup.getValue("ATT_Depth_Thickness").addValue(productThickness);
			}
		});
	}
	return 0;
}

// XPF-2035 - Added by ADMIN_BS - 19/03/2025
// Function to calculate Dimension Table Attribute Values for Data Containers
function setTCandSCfromDC_DOP(node,manager){
	var contexts = manager.getContextHome().getContexts();
	var classificationProductLinkTypeHome = manager.getHome(com.stibo.core.domain.classificationproductlinktype.ClassificationProductLinkTypeHome);
	var marketsRef= classificationProductLinkTypeHome.getLinkTypeByID("P2C_SU_to_Market");
	var materialToMarkets = node.queryClassificationProductLinks(marketsRef).asList(1000);
	for (var context in Iterator(contexts)) {
		for (var marketRef in Iterator(materialToMarkets)) {
			var market = marketRef.getClassification();
			var marketCode = market.getValue("ATT_MarketCode").getSimpleValue() + "";
			var contextCode = context.getID().split("_");
			if(marketCode == contextCode[contextCode.length - 1]){
				manager.executeInContext(context.getID(), function(contextManager) {
				  	var productGroup = contextManager.getProductHome().getProductByID(node.getID());
				  	productGroup.getValue("ATT_TCApplicationType_InstalledDensity").deleteCurrent();
				  	productGroup.getValue("ATT_TCApplicationValueFromDC").deleteCurrent();
				  	productGroup.getValue("ATT_SCApplicationTypeFromDC").deleteCurrent();
				  	productGroup.getValue("ATT_SCApplicationValueFromDC").deleteCurrent();
				  	var TC_DC = productGroup.getDataContainerByTypeID("DC_ThermalConductivityByApplication");
				  	var SC_DC = productGroup.getDataContainerByTypeID("DC_SettlementClassByApplication");
				  	var TC_DCIter = TC_DC.getDataContainers().iterator();
				  	var SC_DCIter = SC_DC.getDataContainers().iterator();
				  	var dictTC = {};
				  	var dictSC = {};
				  	while(TC_DCIter.hasNext()){
				  		var currentDC = TC_DCIter.next().getDataContainerObject();
				  		var applicationType = currentDC.getValue("ATT_ThermalConductivityApplicationType").getSimpleValue();
				  		var installedDensity = (currentDC.getValue("ATT_ThermalConductivityInstalledDensity").getSimpleValue()+"").replace("<prefix>","").replace("</prefix>","").replace("<suffix>","").replace("</suffix>","");
				  		var installedDensityLabel = contextManager.getAttributeHome().getAttributeByID("ATT_ThermalConductivityInstalledDensity").getName();
				  		var applicationValue = currentDC.getValue("ATT_ThermalConductivityApplicationValue").getSimpleValue();
				  		var applicationType_installedDensity = applicationType + " (" + installedDensityLabel + ": " + installedDensity + ")";
				  		dictTC[applicationValue] =  applicationType_installedDensity;
				  	}
				  	while(SC_DCIter.hasNext()){
				  		var currentDC = SC_DCIter.next().getDataContainerObject();
				  		var applicationType = currentDC.getValue("ATT_SettlementClassApplicationType").getSimpleValue();
				  		var applicationValue = currentDC.getValue("ATT_SettlementClassApplicationValue").getSimpleValue();
				  		dictSC[applicationValue] =  applicationType;
				  	}
		
				  	var sort = sortKeys(dictTC)
					for (var key in sort){
						productGroup.getValue("ATT_TCApplicationType_InstalledDensity").addValue(sort[key]);
						productGroup.getValue("ATT_TCApplicationValueFromDC").addValue(key);
					}
					var sort = sortKeys(dictSC)
					for (var key in sort){
						productGroup.getValue("ATT_SCApplicationTypeFromDC").addValue(sort[key]);
						productGroup.getValue("ATT_SCApplicationValueFromDC").addValue(key);
					}
				});
			}
		}
	}
	return 0;
}

// XPF-2035 - Added by ADMIN_BS - 19/03/2025
// Function to calculate Dimension Table Attribute Values for Data Containers PDS
function setTCandSCfromDC_PDS(node,manager){
	var contexts = manager.getContextHome().getContexts();
	var classificationProductLinkTypeHome = manager.getHome(com.stibo.core.domain.classificationproductlinktype.ClassificationProductLinkTypeHome);
	var marketsRef= classificationProductLinkTypeHome.getLinkTypeByID("P2C_SU_to_Market");
	var materialToMarkets = node.queryClassificationProductLinks(marketsRef).asList(1000);
	for (var context in Iterator(contexts)) {
		for (var marketRef in Iterator(materialToMarkets)) {
			var market = marketRef.getClassification();
			var marketCode = market.getValue("ATT_MarketCode").getSimpleValue() + "";
			var contextCode = context.getID().split("_");
			if(marketCode == contextCode[contextCode.length - 1]){
				manager.executeInContext(context.getID(), function(contextManager) {
				  	var productGroup = contextManager.getProductHome().getProductByID(node.getID());
				  	productGroup.getValue("ATT_TCApplicationTypePDSFromDC").deleteCurrent();
				  	productGroup.getValue("ATT_TCApplicationValuePDSFromDC").deleteCurrent();
				  	productGroup.getValue("ATT_TCInstalledDensityPDSFromDC").deleteCurrent();
				  	productGroup.getValue("ATT_SCApplicationValuePDSFromDC").deleteCurrent();
				  	productGroup.getValue("ATT_SCApplicationTypePDSFromDC").deleteCurrent();
				  	var TC_DC = productGroup.getDataContainerByTypeID("DC_ThermalConductivityByApplication");
				  	var SC_DC = productGroup.getDataContainerByTypeID("DC_SettlementClassByApplication");
				  	var TC_DCIter = TC_DC.getDataContainers().iterator();
				  	var SC_DCIter = SC_DC.getDataContainers().iterator();
				  	var dictTC = {};
				  	var dictSC = {};
				  	while(TC_DCIter.hasNext()){
				  		var currentDC = TC_DCIter.next().getDataContainerObject();
				  		var applicationType = currentDC.getValue("ATT_ThermalConductivityApplicationType").getSimpleValue();
				  		var installedDensity = (currentDC.getValue("ATT_ThermalConductivityInstalledDensity").getValue()+"").replace("<prefix>","").replace("</prefix>","").replace("<suffix>","").replace("</suffix>","");
				  		var applicationValue = currentDC.getValue("ATT_ThermalConductivityApplicationValue").getValue();
				  		dictTC[applicationValue] =  installedDensity + "/:/" + applicationType;
				  	}
				  	while(SC_DCIter.hasNext()){
				  		var currentDC = SC_DCIter.next().getDataContainerObject();
				  		var applicationType = currentDC.getValue("ATT_SettlementClassApplicationType").getSimpleValue();
				  		var applicationValue = currentDC.getValue("ATT_SettlementClassApplicationValue").getSimpleValue();
				  		dictSC[applicationType] =  applicationValue;
				  	}
		
				  	var sort = sortKeys(dictTC)
					for (var key in sort){
						var installedDensity = sort[key].split("/:/")[0];
						var applicationType = sort[key].split("/:/")[1];
						productGroup.getValue("ATT_TCInstalledDensityPDSFromDC").addValue(installedDensity);
						productGroup.getValue("ATT_TCApplicationTypePDSFromDC").addValue(key);
						productGroup.getValue("ATT_TCApplicationTypePDSFromDC").addValue(applicationType);				
					}
					var sort = sortKeys(dictSC)
					for (var key in sort){
						productGroup.getValue("ATT_SCApplicationValuePDSFromDC").addValue(sort[key]);
						productGroup.getValue("ATT_SCApplicationTypePDSFromDC").addValue(key);
					}
				});
			}
		}
	}
	return 0;
}


//function for Foamglas PDS Dimension Tables
function setTableDataByTemplateandDCFG(nodeObj,manager,web){
	var slabDCType = nodeObj.getDataContainerByTypeID("DC_FGPDS_Slab");
	var taperedDCType = nodeObj.getDataContainerByTypeID("DC_FGPDS_Tapered");
	var perinsulDCType = nodeObj.getDataContainerByTypeID("DC_FGPDS_Perinsul");
	var etaDCType = nodeObj.getDataContainerByTypeID("DC_FGDOP_ETA");
	var dopStandardDCtype = nodeObj.getDataContainerByTypeID("DC_FGDOP_Standard");
  	deleteDataContainer(nodeObj,slabDCType);
  	deleteDataContainer(nodeObj,taperedDCType);
  	deleteDataContainer(nodeObj,perinsulDCType);
	deleteDataContainer(nodeObj,etaDCType);
	deleteDataContainer(nodeObj,dopStandardDCtype);
	var contexts = manager.getContextHome().getContexts();
	for (var context in Iterator(contexts)) {
		const publicationLinkTypeID = "P2CL_PRODUCTGRP_TO_PUBLICATION_TMPL";
		var classificationProductLinkTypeHome = manager.getHome(com.stibo.core.domain.classificationproductlinktype.ClassificationProductLinkTypeHome);
		var publicationLinkType= classificationProductLinkTypeHome.getLinkTypeByID(publicationLinkTypeID);
		manager.executeInContext(context.getID(), function(contextManager) {
		  	var node = contextManager.getProductHome().getProductByID(nodeObj.getID());
			var dimensionTableOption_FG = nodeObj.getValue("ATT_DimensionTableOption_FG").getSimpleValue();
			var publicationTypeLinks = node.queryClassificationProductLinks(publicationLinkType).asList(1000);
			for (var i = 0; i < publicationTypeLinks.size(); i++) {
				var classificationlink = publicationTypeLinks.get(i);
				var classification = classificationlink.getClassification();
				var classificationID = classification.getID();
				if(classificationID == "PublicationTemplateFoamglasPDS"){
					if(dimensionTableOption_FG == "Perinsul" ){
						setDimensiontableValuesforFGproductGroup_Perinsul(node,manager);
					}
					if(dimensionTableOption_FG == "Slab" ){
						setDimensiontableValuesforFGproductGroup_Slab(node,manager);
					}
					if(dimensionTableOption_FG == "Tapered" ){
						setDimensiontableValuesforFGproductGroup_Tapered(node,manager);
					}
					setFG_Length_Width_Thickness(node,manager);
				}
				if (classificationID == "PublicationTemplateFoamglasDOPETA17093" || classificationID == "PublicationTemplateFoamglasDOPETA200221") {
				setDimensiontableValuesforFGproductGroup_ETA(node, manager,context.getID(),web);
				}
				if (classificationID == "PublicationTemplateFoamglasDOPStandard") {
					//setDimensiontableValuesforFGproductGroup_DOP_Standard(node,manager);
				}
					
			}
		});
		
	}
	
}


// XPF-2035 - Added by ADMIN_BS - 19/03/2025
// Function to calculate Dimension Table Attribute Values for Perinsul
function setDimensiontableValuesforFGproductGroup_Perinsul(node,manager){
	var contextID = node.getManager().getCurrentContext().getID();
	manager.executeInContext(contextID, function(contextManager) {
	  	var productGroup = contextManager.getProductHome().getProductByID(node.getID());
	  	var DCType = productGroup.getDataContainerByTypeID("DC_FGPDS_Perinsul");
	  	var baseItems = node.getChildren().iterator();
	  	var baseItem = null;
		while(baseItems.hasNext()){
			baseItem = baseItems.next();
			if(baseItem.getObjectType().getID().equals("BaseItem")){
				var bsToDisplay = baseItem.getValue("ATT_BaseItemtoDisplay").getValues().iterator();
				while(bsToDisplay.hasNext()){
					var BScontextID = bsToDisplay.next().getID();
					if(contextID == BScontextID){
						var baseItemLength = baseItem.getValue("ATT_BaseItemThicknessLength").getValue();
						var baseItemThickness = baseItem.getValue("ATT_Width1").getValue();
						if(baseItemLength != null && baseItemThickness != null){
							var DC_Size = DCType.getDataContainers().size();
							if(DC_Size == 0){
								var slab_DC = DCType.addDataContainer();
								var slab_DC_Obj = slab_DC.createDataContainerObject("");
								slab_DC_Obj.getValue("ATT_FGThicknessXLength").setSimpleValue(baseItemLength);
								slab_DC_Obj.getValue("ATT_FGWidth").addValue(baseItemThickness);
							}
							else{
								var currentDCIter = DCType.getDataContainers().iterator();
								var newLength = true;
								while(currentDCIter.hasNext()){
									var currentcontextDC = currentDCIter.next().getDataContainerObject();
									var currentcontextDCLength = currentcontextDC.getValue("ATT_FGThicknessXLength").getSimpleValue()+"";
					  				var currentcontextDCThickness = currentcontextDC.getValue("ATT_FGWidth").getSimpleValue()+"";
									var contexts = manager.getContextHome().getContexts();
									for (var context in Iterator(contexts)) {
										manager.executeInContext(context.getID(), function(contextManager) {
											var currentDC = contextManager.getObjectFromOtherManager(currentcontextDC);
							  				var currentDCLength = currentDC.getValue("ATT_FGThicknessXLength").getSimpleValue();
							  				var currentDCThickness = currentDC.getValue("ATT_FGWidth").getSimpleValue();							  				
							  				if(currentDCLength == baseItemLength){							
//							  					log.info(currentDCThickness+":::"+baseItemThickness+":::"+(currentDCThickness.indexOf(baseItemThickness) == -1))
							  					if(currentcontextDCLength == "null"){							  						
							  						currentcontextDC.getValue("ATT_FGThicknessXLength").setSimpleValue(baseItemLength);
							  					}
//									  			log.info(!currentcontextDCThickness.split("<multisep/>").includes(baseItemThickness) + context.getID())
							  					if(!currentcontextDCThickness.split("<multisep/>").includes(baseItemThickness)){
							  						currentcontextDC.getValue("ATT_FGWidth").addValue(baseItemThickness);
							  					}
												newLength = false;
											}
										});
									}
								}
								if(newLength){
									var slab_DC = DCType.addDataContainer();
									var slab_DC_Obj = slab_DC.createDataContainerObject("");
									slab_DC_Obj.getValue("ATT_FGThicknessXLength").setSimpleValue(baseItemLength);
									slab_DC_Obj.getValue("ATT_FGWidth").addValue(baseItemThickness);
								}
							}
						}
						
					}
				}
			}
		}
		var DCIter = DCType.getDataContainers().iterator();
		while(DCIter.hasNext()){
			var currentDCObj = DCIter.next()
			var currentDC = currentDCObj.getDataContainerObject();
			var flag = true;
			var currentDCLength = currentDC.getValue("ATT_FGThicknessXLength").getSimpleValue();
			if(currentDCLength){
				var DCThickness = currentDC.getValue("ATT_FGWidth").getSimpleValue().split("<multisep/>");
				var dict = {};
				currentDC.getValue("ATT_FGWidth").deleteCurrent();
				for(var i = 0; i < DCThickness.length; i++){
					dict[DCThickness[i]] = currentDCLength;
				}
				var sort = sortNumberKeys(dict)
				for (var key in sort){
					currentDC.getValue("ATT_FGWidth").addValue(key);
				}
			}
						
		}
//		sortDataContainer_Perinsul(productGroup,DCType);			
	});
	return 0;
}

// XPF-2035 - Added by ADMIN_BS - 19/03/2025
// Function to calculate Dimension Table Attribute Values for Tapered
function setDimensiontableValuesforFGproductGroup_Tapered(node,manager){
	var contextID = node.getManager().getCurrentContext().getID();
	manager.executeInContext(contextID, function(contextManager) {
	  	var productGroup = contextManager.getProductHome().getProductByID(node.getID());
	  	var DCType = productGroup.getDataContainerByTypeID("DC_FGPDS_Tapered");
	  	var baseItems = node.getChildren().iterator();
	  	var baseItem = null;
		while(baseItems.hasNext()){
			baseItem = baseItems.next();
			if(baseItem.getObjectType().getID().equals("BaseItem")){
				var bsToDisplay = baseItem.getValue("ATT_BaseItemtoDisplay").getValues().iterator();
				while(bsToDisplay.hasNext()){
					var BScontextID = bsToDisplay.next().getID();
					if(contextID == BScontextID){
						var baseItemLength = baseItem.getValue("ATT_BaseItemLengthWidth").getValue();
						var baseItemThickness = baseItem.getValue("ATT_BaseItemAverageThickness").getValue();
						if(baseItemLength != null && baseItemThickness != null){
							var DC_Size = DCType.getDataContainers().size();
							if(DC_Size == 0){
								var slab_DC = DCType.addDataContainer();
								var slab_DC_Obj = slab_DC.createDataContainerObject("");
								slab_DC_Obj.getValue("ATT_FGLengthXWidth").setSimpleValue(baseItemLength);
								slab_DC_Obj.getValue("ATT_FGThickness").addValue(baseItemThickness);
							}
							else{
								var currentDCIter = DCType.getDataContainers().iterator();
								var newLength = true;
								while(currentDCIter.hasNext()){
									var currentcontextDC = currentDCIter.next().getDataContainerObject();
									var currentcontextDCLength = currentcontextDC.getValue("ATT_FGLengthXWidth").getSimpleValue()+"";
					  				var currentcontextDCThickness = currentcontextDC.getValue("ATT_FGThickness").getSimpleValue()+"";
									var contexts = manager.getContextHome().getContexts();
									for (var context in Iterator(contexts)) {
										manager.executeInContext(context.getID(), function(contextManager) {
											var currentDC = contextManager.getObjectFromOtherManager(currentcontextDC);
							  				var currentDCLength = currentDC.getValue("ATT_FGLengthXWidth").getSimpleValue();
							  				var currentDCThickness = currentDC.getValue("ATT_FGThickness").getSimpleValue();
							  				var currentDCTR = currentDC.getValue("ATT_FGThermalResistance").getSimpleValue();
							  				if(currentDCLength == baseItemLength){							
//							  					log.info(currentDCThickness+":::"+baseItemThickness+":::"+(currentDCThickness.indexOf(baseItemThickness) == -1))
							  					if(currentcontextDCLength == "null"){							  						
							  						currentcontextDC.getValue("ATT_FGLengthXWidth").setSimpleValue(baseItemLength);
							  					}
//									  			log.info(!currentcontextDCThickness.split("<multisep/>").includes(baseItemThickness) + context.getID())
							  					if(!currentcontextDCThickness.split("<multisep/>").includes(baseItemThickness)){
							  						currentcontextDC.getValue("ATT_FGThickness").addValue(baseItemThickness);
							  					}
												newLength = false;
											}
										});
									}
								}
								if(newLength){
									var slab_DC = DCType.addDataContainer();
									var slab_DC_Obj = slab_DC.createDataContainerObject("");
									slab_DC_Obj.getValue("ATT_FGLengthXWidth").setSimpleValue(baseItemLength);
									slab_DC_Obj.getValue("ATT_FGThickness").addValue(baseItemThickness);
								}
							}
						}
						
					}
				}
			}
		}
		var DCIter = DCType.getDataContainers().iterator();
		while(DCIter.hasNext()){
			var currentDCObj = DCIter.next()
			var currentDC = currentDCObj.getDataContainerObject();
			var flag = true;
			var currentDCLength = currentDC.getValue("ATT_FGLengthXWidth").getSimpleValue();
			if(currentDCLength){
				var DCThickness = currentDC.getValue("ATT_FGThickness").getSimpleValue().split("<multisep/>");
				var dict = {};
				currentDC.getValue("ATT_FGThickness").deleteCurrent();
				for(var i = 0; i < DCThickness.length; i++){
					dict[DCThickness[i]] = currentDCLength;
				}
				var sort = sortNumberKeys(dict)
				for (var key in sort){
					currentDC.getValue("ATT_FGThickness").addValue(key);
				}
			}
						
		}
		sortDataContainer_Tapered(productGroup,DCType);			
	});
	return 0;
}


// XPF-2035 - Added by ADMIN_BS - 19/03/2025
// Function to calculate Dimension Table Attribute Values for Cylinder
function setDimensiontableValuesforFGproductGroup_Slab(node,manager){
	var contextID = node.getManager().getCurrentContext().getID();
	manager.executeInContext(contextID, function(contextManager) {
	  	var productGroup = contextManager.getProductHome().getProductByID(node.getID());
	  	var DCType = productGroup.getDataContainerByTypeID("DC_FGPDS_Slab");
	  	var baseItems = node.getChildren().iterator();
	  	var baseItem = null;
		while(baseItems.hasNext()){
			baseItem = baseItems.next();
			if(baseItem.getObjectType().getID().equals("BaseItem")){
				var bsToDisplay = baseItem.getValue("ATT_BaseItemtoDisplay").getValues().iterator();
				while(bsToDisplay.hasNext()){
					var BScontextID = bsToDisplay.next().getID();
					if(contextID == BScontextID){
						var baseItemLength = baseItem.getValue("ATT_BaseItemLengthWidth").getValue();
						var baseItemThickness = baseItem.getValue("ATT_Depth1").getValue();
						var baseItemTR = baseItem.getValue("ATT_ThermalResistance").getValue();
						if(baseItemLength != null && baseItemThickness != null && baseItemTR!= null){
							var DC_Size = DCType.getDataContainers().size();
							if(DC_Size == 0){
								var slab_DC = DCType.addDataContainer();
								var slab_DC_Obj = slab_DC.createDataContainerObject("");
								slab_DC_Obj.getValue("ATT_FGLengthXWidth").setSimpleValue(baseItemLength);
								slab_DC_Obj.getValue("ATT_FGThickness").addValue(baseItemThickness);
//								try{
									slab_DC_Obj.getValue("ATT_FGThermalResistance").addValue(baseItemTR);
//								}
//								catch(err){
//									throw(baseItemTR + ":::" + baseItem.getID() + ":::" + contextID)
//								}
							}
							else{
								var currentDCIter = DCType.getDataContainers().iterator();
								var newLength = true;
								while(currentDCIter.hasNext()){
									var currentcontextDC = currentDCIter.next().getDataContainerObject();
									var currentcontextDCLength = currentcontextDC.getValue("ATT_FGLengthXWidth").getSimpleValue()+"";
					  				var currentcontextDCThickness = currentcontextDC.getValue("ATT_FGThickness").getSimpleValue()+"";
					  				var currentcontextDCTR = currentcontextDC.getValue("ATT_FGThermalResistance").getSimpleValue()+"";									  				
									var contexts = manager.getContextHome().getContexts();
									for (var context in Iterator(contexts)) {
										manager.executeInContext(context.getID(), function(contextManager) {
											var currentDC = contextManager.getObjectFromOtherManager(currentcontextDC);
							  				var currentDCLength = currentDC.getValue("ATT_FGLengthXWidth").getSimpleValue();
							  				var currentDCThickness = currentDC.getValue("ATT_FGThickness").getSimpleValue();
							  				var currentDCTR = currentDC.getValue("ATT_FGThermalResistance").getSimpleValue();
							  				if(currentDCLength == baseItemLength){
							
//							  					log.info(currentDCThickness+":::"+baseItemThickness+":::"+(currentDCThickness.indexOf(baseItemThickness) == -1))
							  					if(currentcontextDCLength == "null"){
							  						
							  						currentcontextDC.getValue("ATT_FGLengthXWidth").setSimpleValue(baseItemLength);
							  					}
//									  					log.info(!currentcontextDCThickness.split("<multisep/>").includes(baseItemThickness) + context.getID())
							  					if(!currentcontextDCThickness.split("<multisep/>").includes(baseItemThickness)){
							  						currentcontextDC.getValue("ATT_FGThickness").addValue(baseItemThickness);
							  					}
							  					if(!currentcontextDCTR.split("<multisep/>").includes(baseItemTR)){
							  						currentcontextDC.getValue("ATT_FGThermalResistance").addValue(baseItemTR);
							  					}
												newLength = false;
											}
										});
									}
								}
								if(newLength){
									var slab_DC = DCType.addDataContainer();
									var slab_DC_Obj = slab_DC.createDataContainerObject("");
									slab_DC_Obj.getValue("ATT_FGLengthXWidth").setSimpleValue(baseItemLength);
									slab_DC_Obj.getValue("ATT_FGThickness").addValue(baseItemThickness);
									slab_DC_Obj.getValue("ATT_FGThermalResistance").addValue(baseItemTR);
								}
							}
						}
						
					}
				}
			}
		}
		var DCIter = DCType.getDataContainers().iterator();
		while(DCIter.hasNext()){
			var currentDCObj = DCIter.next()
			var currentDC = currentDCObj.getDataContainerObject();
			var flag = true;
			var currentDCLength = currentDC.getValue("ATT_FGLengthXWidth").getSimpleValue();
			if(currentDCLength){
				var DCThickness = currentDC.getValue("ATT_FGThickness").getSimpleValue().split("<multisep/>");
				var DCTR = currentDC.getValue("ATT_FGThermalResistance").getSimpleValue().split("<multisep/>");
				var dict = {};
				currentDC.getValue("ATT_FGThickness").deleteCurrent();
				currentDC.getValue("ATT_FGThermalResistance").deleteCurrent();
				for(var i = 0; i < DCThickness.length; i++){
					dict[DCThickness[i]] = DCTR[i];
				}
				var sort = sortNumberKeys(dict)
				for (var key in sort){
					currentDC.getValue("ATT_FGThickness").addValue(key);
					currentDC.getValue("ATT_FGThermalResistance").addValue(sort[key]);
				}
			}
						
		}
		sortDataContainer_Slab(productGroup,DCType);			
	});
	return 0;
}

//ADMIN_HRY 12/03/2025 XFP-6138 Dimension Table Calculation for DOP ETA

function setDimensiontableValuesforFGproductGroup_ETA(node, manager,contextID,web) 
{
    var contextID = node.getManager().getCurrentContext().getID();
	var ETA_DC;
    manager.executeInContext(contextID, function(contextManager) {
        var productGroup = contextManager.getProductHome().getProductByID(node.getID());
        var DCType = productGroup.getDataContainerByTypeID("DC_FGDOP_ETA");
        //log.info("Data Container Type: DC_FGDOP_ETA");

        var baseItems = node.getChildren().iterator();
        var baseItem = null;

        // Step 1: Iterate BaseItems
        while (baseItems.hasNext()) {
            baseItem = baseItems.next();
            if (baseItem.getObjectType().getID().equals("BaseItem")) {
                var bsToDisplay = baseItem.getValue("ATT_BaseItemtoDisplay").getValues().iterator();
                while (bsToDisplay.hasNext()) {
                    var BScontextID = bsToDisplay.next().getID();
                    if (contextID == BScontextID) 
                    {
                        var thickness = baseItem.getValue("ATT_Depth1").getValue();
                        var density = baseItem.getValue("ATT_BaseItemDensity").getValue();
                        var compressiveStrength = baseItem.getValue("ATT_BaseItemCompressiveStrength").getValue();
                        var loadLevel = baseItem.getValue("ATT_LoadLevel").getValue();
                        var x0 = baseItem.getValue("ATT_X0").getValue();
                        var xctTime1 = baseItem.getValue("ATT_XctTime1").getValue();
                        var xctTime1Unit = baseItem.getValue("ATT_XctTime1").getUnit();
                        var xctValue1 = baseItem.getValue("ATT_XctValue1").getValue();
                        var xct50 = baseItem.getValue("ATT_Xct50").getValue();
                        var xt50 = baseItem.getValue("ATT_Xt50").getValue();
                        var baseItemName = baseItem.getName();
                        if (thickness == null || thickness == "") 
					{
	                        if(productGroup.isInState("WF_ProductMaintenance","ProductManagerMaintenance") || productGroup.isInState("WF_ProductOnboarding","ProductManagerEnrichment"))
	                        {
							web.showAlert("ERROR","WARNING","To receive data in dimension table,please populate all attribute values in Base Item attributes if value for \"Base Item to Display\" attribute is populated.");
						}
						break;
                        }
                        if (density == null || compressiveStrength == null || loadLevel == null || x0 == null || xctTime1 == null || xctValue1 == null || xct50 == null || xt50 == null || density == "" || compressiveStrength == "" || loadLevel == "" || x0 == "" || xctTime1 == "" || xctValue1 == "" || xct50 == "" || xt50 == "") 
					{
	                        if(productGroup.isInState("WF_ProductMaintenance","ComplianceMaintenanceReview") || productGroup.isInState("WF_ProductOnboarding","ComplianceEnrichmentReview"))
	                        {
							web.showAlert("ERROR","WARNING","To receive data in dimension table,please populate all attribute values in Base Item attributes if value for \"Base Item to Display\" attribute is populated.");
						}
						break;
                        }
                        //log.info("Processing BaseItem with Thickness: " + thickness);

                        if (thickness != null) {
                            var DC_Size = DCType.getDataContainers().size();
                            if (DC_Size == 0) {
                                log.info("No existing DC found. Creating first DC for Thickness: " + thickness);
                                ETA_DC = DCType.addDataContainer();
                                var ETA_DC_Obj = ETA_DC.createDataContainerObject("");
                                ETA_DC_Obj.getValue("ATT_PGThickness").setValue(thickness);
                                ETA_DC_Obj.getValue("ATT_PGCompressiveStrength").addValue(compressiveStrength);
                                ETA_DC_Obj.getValue("ATT_PGDensity").addValue(density);
                                ETA_DC_Obj.getValue("ATT_PGLoadLevel").addValue(loadLevel);
                                ETA_DC_Obj.getValue("ATT_PGX0").addValue(x0);
                                ETA_DC_Obj.getValue("ATT_PGXctTime1").addValue(xctTime1,xctTime1Unit);
                                ETA_DC_Obj.getValue("ATT_PGXctValue1").addValue(xctValue1);
                                ETA_DC_Obj.getValue("ATT_PGXct50").addValue(xct50);
                                ETA_DC_Obj.getValue("ATT_PGXt50").addValue(xt50);
                            } else {
                                var DCIter = DCType.getDataContainers().iterator();
                                var newThickness = true;
                                while (DCIter.hasNext()) 
                                {
								var currentDC = DCIter.next().getDataContainerObject();
								var currentThickness = currentDC.getValue("ATT_PGThickness").getValue();
								var contexts1 = manager.getContextHome().getContexts();
								for (var context1 in Iterator(contexts1)) 
								{
									manager.executeInContext(context1.getID(), function(contextManager1) 
									{
										var currentnewDC = contextManager1.getObjectFromOtherManager(currentDC);
										var currentDCThickness = currentnewDC.getValue("ATT_PGThickness").getValue();
                                    			if (currentDCThickness == thickness) 
                                    			{
		                                        	log.info("Updating existing DC for Thickness: " + thickness);
		                                        	// Add values if not already present
		                                        	if(currentThickness == null)
											{							  						
												currentDC.getValue("ATT_PGThickness").setSimpleValue(thickness);
											}
			                                      var multiAttrs = {
			                                            "ATT_PGCompressiveStrength": compressiveStrength,
			                                            "ATT_PGDensity": density,
			                                            "ATT_PGLoadLevel": loadLevel,
			                                            "ATT_PGX0": x0,
			                                            "ATT_PGXctTime1": xctTime1,
			                                            "ATT_PGXctValue1": xctValue1,
			                                            "ATT_PGXct50": xct50,
			                                            "ATT_PGXt50": xt50
			                                       };
			                                       for (var attrId in multiAttrs) 
			                                       {
			                                           var val = multiAttrs[attrId];
												var currentValue = currentDC.getValue(attrId).getSimpleValue()+"";
												val = val+"";
			                                           if (val != null && !currentValue.split("<multisep/>").includes(val)) 
			                                           {
			                                               if(attrId =="ATT_PGXctTime1")
			                                               {
			                                               		var dc = currentValue.split("<multisep/>");
			                                               		for(var k=0;k<dc.length;k++)
			                                               		{
			                                               			var dcval = dc[k];
			                                               			dc[k]=dc[k].split(" ")[0];
			                                               		}
			                                               		if(!dc.includes(val))
			                                               		{
			                               	                		currentDC.getValue(attrId).addValue(val,xctTime1Unit);
			                                               		}
			                                               }
			                                               else
			                                               {
			                                               		currentDC.getValue(attrId).addValue(val);
			                                               }
			                                               log.info("Added value to " + attrId + ": " + val);
			                                           }
			                                        }
			                                        newThickness = false;
											}
			                                    
									});
								}
                                }
                                if (newThickness) {
                                    log.info("Creating new DC for Thickness: " + thickness);
                                    var ETA_DC = DCType.addDataContainer();
                                    var ETA_DC_Obj = ETA_DC.createDataContainerObject("");
                                    ETA_DC_Obj.getValue("ATT_PGThickness").setSimpleValue(thickness);
                                    ETA_DC_Obj.getValue("ATT_PGCompressiveStrength").addValue(compressiveStrength);
                                    ETA_DC_Obj.getValue("ATT_PGDensity").addValue(density);
                                    ETA_DC_Obj.getValue("ATT_PGLoadLevel").addValue(loadLevel);
                                    ETA_DC_Obj.getValue("ATT_PGX0").addValue(x0);
                                    ETA_DC_Obj.getValue("ATT_PGXctTime1").addValue(xctTime1,xctTime1Unit);
                                    ETA_DC_Obj.getValue("ATT_PGXctValue1").addValue(xctValue1);
                                    ETA_DC_Obj.getValue("ATT_PGXct50").addValue(xct50);
                                    ETA_DC_Obj.getValue("ATT_PGXt50").addValue(xt50);
                                }
                            }
                        }
                    }
                }
            }
        }

        // sorting
        //log.info("Starting sorting...");
                //log.info("Sorting multi-values for Thickness: " + currentThickness);
                var multiAttrsSort = ["ATT_PGCompressiveStrength", "ATT_PGDensity", "ATT_PGLoadLevel", "ATT_PGX0", "ATT_PGXctTime1", "ATT_PGXctValue1", "ATT_PGXct50", "ATT_PGXt50"];
                for (var i = 0; i < multiAttrsSort.length; i++) {
                   	var DCIter = DCType.getDataContainers().iterator();
                   	while(DCIter.hasNext()){
					var currentDCObj = DCIter.next()
					var currentDC = currentDCObj.getDataContainerObject();
					var attr = currentDC.getValue(multiAttrsSort[i]);
	                   //log.info(multiAttrsSort[i]);
	                   if(attr.getSimpleValue() != null){
		                    var values = attr.getSimpleValue().split("<multisep/>").sort(function(a, b) { return a - b; });
		                    attr.deleteCurrent();
		                    for (var j = 0; j < values.length; j++) {
		                        
		                    	if(multiAttrsSort[i] =="ATT_PGXctTime1")
							{
								var val = values[j].split(" ");
			                    	var val1 = val[0];
			                    	unit = val[1];
								if(unit == "mon")
								{
									unit = "unece.unit.MON";
								}
								else
								{
									unit = "unece.unit.ANN";
								}
								var unit = manager.getUnitHome().getUnitByID(unit);
								attr.addValue(val1,unit);
			                   }
			                   else{
		                        attr.addValue(values[j]);
			                   }
		                    }
	                   }
	                }
                }
        //log.info("sorting completed.");
        //sortDataContainer_Perinsul(productGroup, DCType);
        
    });
    return 0;
    //log.info("BR execution completed.");
}

/*
//ADMIN_HRY - Dimension Table Calculation for DOP Standard
function setDimensiontableValuesforFGproductGroup_DOP_Standard(node,manager){
	var contexts = manager.getContextHome().getContexts();
	for (var context in Iterator(contexts)) {
		manager.executeInContext(context.getID(), function(contextManager) {
		  	var productGroup = contextManager.getProductHome().getProductByID(node.getID());
		  	productGroup.getValue("ATT_FGDOPThermalResistance").deleteCurrent();
		  	productGroup.getValue("ATT_FGDOPThermalResistanceThickness").deleteCurrent();
		  	if(productGroup.getValue("ATT_ENThermalConductivity").getSimpleValue() != null){
			  	var dict = {}
			  	var baseItems = node.getChildren().iterator();
			  	var baseItem = null;
				while(baseItems.hasNext()){
					baseItem = baseItems.next();
					if(baseItem.getObjectType().getID().equals("BaseItem")){
						var bsToDisplay = baseItem.getValue("ATT_BaseItemtoDisplay").getValues().iterator();
						while(bsToDisplay.hasNext()){
							var contextID = bsToDisplay.next().getID();
							if(contextID == context.getID()){
								var BIThermalresistance = baseItem.getValue("ATT_ThermalResistance").getValue();
								var BIThickness = Number(baseItem.getValue("ATT_BaseItemAverageThickness").getValue());
								if(BIThickness != null && BIThickness != ""){
									dict[BIThickness] = BIThermalresistance;
								}
							}
						}
					}
				}
				var sort = sortNumberKeys(dict)
				for (var key in sort){
					productGroup.getValue("ATT_FGDOPThermalResistanceThickness").addValue(key);
					productGroup.getValue("ATT_FGDOPThermalResistance").addValue(sort[key]);
				}
		  	}
		});
	} 
	return 0;
}
*/

/*function setDimensiontableValuesforFGproductGroup_DOP_Standard(node,manager,context)
{

var classificationProductLinkTypeHome = manager.getHome(com.stibo.core.domain.classificationproductlinktype.ClassificationProductLinkTypeHome);
	var linkType= classificationProductLinkTypeHome.getLinkTypeByID("P2C_ProductSpecification");
	var classLinks = node.queryClassificationProductLinks(linkType).asList(1);
	var classificationlink = classLinks.get(0);
	var classificationID = classificationlink.getClassification().getID();
	const max;
	const min;
	var contexts = manager.getContextHome().getContexts();
	/*for (var context in Iterator(contexts)) 
	{
		manager.executeInContext(context.getID(), function(contextManager) 
		{
			var thicknessmm = [];
		  	var productGroup = node;//contextManager.getProductHome().getProductByID(node.getID());
		  	if(productGroup.getValue("ATT_ENThermalConductivity").getSimpleValue() != null)
			{
			  	var baseItems = node.getChildren().iterator();
			  	var baseItem = null;
				while(baseItems.hasNext())
				{
					baseItem = baseItems.next();
					if(baseItem.getObjectType().getID().equals("BaseItem"))
					{
						var bsToDisplay = baseItem.getValue("ATT_BaseItemtoDisplay").getValues().iterator();
						while(bsToDisplay.hasNext())
						{
							var contextID = bsToDisplay.next().getID();
							if(contextID == context.getID())
							{
								var BIThermalresistance = baseItem.getValue("ATT_ThermalResistance").getValue();
								if(classificationID == "PS_Tapered")
								{
									var BIThickness = Number(baseItem.getValue("ATT_BaseItemAverageThickness").getValue());
									thicknessmm.push(BIThickness);
								}
								else
								{
									var BIThickness = Number(baseItem.getValue("ATT_Depth1").getValue());
									thicknessmm.push(BIThickness);
								}
							}
						}
					}
				}
			}
			min = Math.min(thicknessmm);
			max = Math.max(thicknessmm);
			//log.info(thicknessmm);
			while(min <= max)
			{
				var i=0;
				thicknessmm[i]=min;
				i++;
				min=min+5;
			}
			var dcType = productGroup.getDataContainerByTypeID("DC_FGDOP_Standard");
			var thermalCond = productGroup.getValue("ATT_ENThermalConductivity").getSimpleValue();
			var parts = thermalCond.split("</prefix>");
			var numberPart = parts[1].split(" ")[0];
			var result = Number(numberPart); 

			for(var i=0;i<thicknessmm.length;i++)
			{
				var thickness = thicknessmm[i];
				//log.info(thickness);
				var dcrow = dcType.addDataContainer();
				var dcObj = dcrow.createDataContainerObject("");
				dcObj.getValue("ATT_DCDOPSThickness").setSimpleValue(thickness);
				var thickness = thickness/1000;
				var thermalResistance = Math.trunc(thickness/result/0.05)*0.05;
				dcObj.getValue("ATT_DCDOPSThermalResistance").addValue(thermalResistance.toFixed(2));
			}
		//});
	//}
}
*/

function setDimensiontableValuesforFGproductGroup_DOP_Standard(node, manager)
{
	var thermCond = node.getValue("ATT_ENThermalConductivity").getValue();
	if(thermCond==null || thermCond=="")
	{
		if(node.isInState("WF_ProductMaintenance","ComplianceMaintenanceReview") || node.isInState("WF_ProductOnboarding","ComplianceEnrichmentReview"))
		{
			web.showAlert("ERROR","To receive data in dimension table,please populate Thermal Conductivity attribute.");
		}
	}
	else if(thermCond)
	{
		var classificationProductLinkTypeHome = manager.getHome(com.stibo.core.domain.classificationproductlinktype.ClassificationProductLinkTypeHome);
		var linkType= classificationProductLinkTypeHome.getLinkTypeByID("P2C_ProductSpecification");
	    var classLinks = node.queryClassificationProductLinks(linkType).asList(1);
	    var classificationlink = null;
	    var classificationID=null;
	    if(classLinks.length>0)
	    {
	    		classificationlink = classLinks.get(0);
	    		classificationID = classificationlink.getClassification().getID();
	    }
	    
	    var max;
	    var min;
	    var contexts = manager.getContextHome().getContexts();
	
	    var contextID = node.getManager().getCurrentContext().getID();
	
	    manager.executeInContext(contextID, function(contextManager) {
	        var thicknessmm = [];
	        var productGroup = contextManager.getProductHome().getProductByID(node.getID());
	
	        if (productGroup.getValue("ATT_ENThermalConductivity").getSimpleValue() != null)
	        {
	            var baseItems = node.getChildren().iterator();
	            var baseItem = null;
	            while (baseItems.hasNext())
	            {
	                baseItem = baseItems.next();
	                if (baseItem.getObjectType().getID().equals("BaseItem"))
	                {
	                    var bsToDisplay = baseItem.getValue("ATT_BaseItemtoDisplay").getValues().iterator();
	                    while (bsToDisplay.hasNext())
	                    {
	                        var BScontextID = bsToDisplay.next().getID();
	                        if (contextID == BScontextID)
	                        {
	                            var BIThermalresistance = baseItem.getValue("ATT_ThermalResistance").getValue();
	                            if (classificationID == "PS_Tapered")
	                            {
	                                var BIThickness = Number(baseItem.getValue("ATT_BaseItemAverageThickness").getValue());
	                                thicknessmm.push(BIThickness);
	                            }
	                            else
	                            {
	                                var BIThickness = Number(baseItem.getValue("ATT_Depth1").getValue());
	                                thicknessmm.push(BIThickness);
	                            }
	                        }
	                    }
	                }
	            }
	        }
	
	        min = (thicknessmm.length > 0) ? Math.min.apply(null, thicknessmm) : NaN;
	        max = (thicknessmm.length > 0) ? Math.max.apply(null, thicknessmm) : NaN;
	
	        var i = 0;
	        var t = min;
	        while (!isNaN(t) && t <= max)
	        {
	            thicknessmm[i] = t;
	            i++;
	            t = t + 5;
	        }
	
	        var dcType = productGroup.getDataContainerByTypeID("DC_FGDOP_Standard");
	        var thermalCond = (((node.getValue("ATT_ENThermalConductivity").getValue().split("</prefix>"))[1]+"").split("<suffix>")[0]).trim();
	        var result = Number(thermalCond);
	
	        for (var k = 0; k < thicknessmm.length; k++)
	        {
	            var thickness = thicknessmm[k];
	            var dcrow = dcType.addDataContainer();
	            var dcObj = dcrow.createDataContainerObject("");
	            dcObj.getValue("ATT_DCDOPSThickness").setSimpleValue(thickness);
	            var thicknessMeters = thickness / 1000;
	            var thermalResistance = Math.trunc(thicknessMeters / result / 0.05) * 0.05;
	            dcObj.getValue("ATT_DCDOPSThermalResistance").addValue(thermalResistance.toFixed(2));
	        }
	    });
	}
}



function deleteDataContainer(node,DCType){
	var oldDCIter = DCType.getDataContainers().iterator();
	while(oldDCIter.hasNext()){
		var oldDCObj = oldDCIter.next()
		oldDCObj.deleteLocal();
	}
}


function sortDataContainer_Slab(node,DCType){
	var dict = {};
	var DCIter = DCType.getDataContainers().iterator();
	while(DCIter.hasNext()){
		var DCObj = DCIter.next();
		var currentDC = DCObj.getDataContainerObject();
		var currentDCLength = currentDC.getValue("ATT_FGLengthXWidth").getSimpleValue();
		var currentDCThickness = currentDC.getValue("ATT_FGThickness").getSimpleValue();
		var currentDCTR = currentDC.getValue("ATT_FGThermalResistance").getSimpleValue();
		if(currentDCLength){
			var lengthXWidth = (currentDCLength+"").split(" x ")[0] * (currentDCLength+"").split(" x ")[1];
			dict[lengthXWidth] = currentDC;	
		}
	}
	var sort = sortNumberKeys(dict);
	var serialNo = 1;
	for (var key in sort){
		var DC = sort[key];
		DC.getValue("ATT_FGDCSerialNo").setSimpleValue(serialNo);
		serialNo += 1;
	}
}

function sortDataContainer_Tapered(node,DCType){
	var dict = {};
	var DCIter = DCType.getDataContainers().iterator();
	while(DCIter.hasNext()){
		var DCObj = DCIter.next();
		var currentDC = DCObj.getDataContainerObject();
		var currentDCLength = currentDC.getValue("ATT_FGLengthXWidth").getSimpleValue();
		var currentDCThickness = currentDC.getValue("ATT_FGThickness").getSimpleValue();
		if(currentDCLength){
			var lengthXWidth = (currentDCLength+"").split(" x ")[0] * (currentDCLength+"").split(" x ")[1];
			dict[lengthXWidth] = currentDC;	
		}
	}
	var sort = sortNumberKeys(dict);
	var serialNo = 1;
	for (var key in sort){
		var DC = sort[key];
		DC.getValue("ATT_FGDCSerialNo").setSimpleValue(serialNo);
		serialNo += 1;
	}
}

function sortDataContainer_Perinsul(node,DCType){
	var dict = {};
	var DCIter = DCType.getDataContainers().iterator();
	while(DCIter.hasNext()){
		var DCObj = DCIter.next();
		var currentDC = DCObj.getDataContainerObject();
		var currentDCLength = currentDC.getValue("ATT_FGThicknessXLength").getSimpleValue();
		var currentDCThickness = currentDC.getValue("ATT_FGWidth").getSimpleValue();
		if(currentDCLength){
			var lengthXWidth = (currentDCLength+"").split(" x ")[0] * (currentDCLength+"").split(" x ")[1];
			dict[lengthXWidth] = currentDC;	
		}
	}
	var sort = sortNumberKeys(dict);
	var serialNo = 1;
	for (var key in sort){
		var DC = sort[key];
		DC.getValue("ATT_FGDCSerialNo").setSimpleValue(serialNo);
		serialNo += 1;
	}
}



//Function to sort a Dictonary bsed on Key "String" - ADMIN_BS - 20/03/2025
function decendingSortKeys(obj) {
    // Get the sorted keys
    var keys = Object.keys(obj).sort((a, b) => {
        if (a < b) return 1;
        if (a > b) return -1;
        return 0;
    });

    // Create a temporary object to hold sorted key-value pairs
    var temp = {};

    // Copy sorted key-value pairs to the temporary object
    keys.forEach(key => {
        temp[key] = obj[key];
        delete obj[key]; // Remove original key-value pairs
    });

    // Copy the sorted key-value pairs back to the original object
    keys.forEach(key => {
        obj[key] = temp[key];
    });

    return obj;
}

//Function to sort a Dictonary bsed on Key "Number X Number" - ADMIN_BS - 20/03/2025
function sortKeysLength_Width(obj) {
    // Get the sorted keys
    var keys = Object.keys(obj).sort((a, b) => {
    const [a1, a2] = a.toLowerCase().split("x").map(s => parseInt(s.trim()));
    const [b1, b2] = b.toLowerCase().split("x").map(s => parseInt(s.trim()));
    return a1 !== b1 ? a1 - b1 : a2 - b2;
  });
  
 // Create a new sorted dictionary
  const sortedObj = {};
  keys.forEach(key => {
    sortedObj[key] = obj[key];
  });

  return sortedObj;
}



//Supporting Funtion
// Fundtion to remove null from an array - ADMIN_BS - 20/03/2025
function removeNullFomArry(array) {
	var newArray = [];
	for(var i = 0; i < array.length; i++){
		if(array[i] != null && array[i] != "null" && array[i] != ""){
			newArray.push(array[i]);
		}
	}
	return newArray;
}

//Function to sort a Dictonary bsed on Key "Number" - ADMIN_BS - 20/03/2025
function sortNumberKeys(obj) {
    // Get the sorted keys
    var keys = Object.keys(obj).sort(function(a, b){
      return a-b;
    });

    // Create a temporary object to hold sorted key-value pairs
    var temp = {};

    // Copy sorted key-value pairs to the temporary object
    keys.forEach(key => {
        temp[key] = obj[key];
        delete obj[key]; // Remove original key-value pairs
    });

    // Copy the sorted key-value pairs back to the original object
    keys.forEach(key => {
        obj[key] = temp[key];
    });

    return obj;
}

//Function to sort a Dictonary bsed on Key "String" - ADMIN_BS - 20/03/2025
function sortKeys(obj) {
    // Get the sorted keys
    var keys = Object.keys(obj).sort((a, b) => {
        if (a < b) return -1;
        if (a > b) return 1;
        return 0;
    });

    // Create a temporary object to hold sorted key-value pairs
    var temp = {};

    // Copy sorted key-value pairs to the temporary object
    keys.forEach(key => {
        temp[key] = obj[key];
        delete obj[key]; // Remove original key-value pairs
    });

    // Copy the sorted key-value pairs back to the original object
    keys.forEach(key => {
        obj[key] = temp[key];
    });

    return obj;
}

//Function to find Min and Max of and array and make them as range -  ADMIN_BS - 20/03/2025
function findMinMaxRangeInArray(array){
	var result = "";
	if(array.length > 1){
		result = array[0] + " - " + array.slice(-1);
	}
	else if(array.length == 1){
		result = array[0];
	}
	else{
		result = "";
	}
	return result;
}

//Functiuon to remove duplicates from an array - ADMIN_BS - 28/03/2025
function removeDuplicatesFromArr(array){
	var uniqueArr = [];
	array.forEach(element => {
	    if (!uniqueArr.includes(element)) {
	        uniqueArr.push(element);
	    }
	});
	return uniqueArr;
}



// XPF-2035 - Added by ADMIN_BS - 20/11/2025
// Function to calculate EN length, EN Width, En thickness Attribute Values for Foamglas PDS
function setFG_Length_Width_Thickness(node,manager){
	var pgcontextID = node.getManager().getCurrentContext().getID();
	manager.executeInContext(pgcontextID, function(contextManager) {
	  	var productGroup = contextManager.getProductHome().getProductByID(node.getID());
	  	productGroup.getValue("ATT_FGPGLength").deleteCurrent();
	  	productGroup.getValue("ATT_FGPGThickness").deleteCurrent();
	  	productGroup.getValue("ATT_FGPGWidth").deleteCurrent();
	  	var dict = {}
	  	var lengthRange = [];
	  	var widthRange = [];
	  	var thicknessRange = [];
	  	var baseItems = productGroup.getChildren().iterator();
	  	var baseItem = null;
		while(baseItems.hasNext()){
			baseItem = baseItems.next();
			if(baseItem.getObjectType().getID().equals("BaseItem")){
				var bsToDisplay = baseItem.getValue("ATT_BaseItemtoDisplay").getValues().iterator();
				while(bsToDisplay.hasNext()){
					var contextID = bsToDisplay.next().getID();
					if(contextID == pgcontextID){
						var baseItemLength = baseItem.getValue("ATT_Length1").getValue();
						var baseItemThickness = baseItem.getValue("ATT_Depth1").getValue();
						var baseItemWidth = baseItem.getValue("ATT_Width1").getValue();
						if(baseItemLength != null){
							lengthRange.push(baseItemLength)
							thicknessRange.push(baseItemThickness)
							widthRange.push(baseItemWidth)
						}
						
					}
				}
			}
		}
		if(lengthRange.length > 0){
			lengthRange.sort((x, y) => x - y);
			lengthRange = removeDuplicatesFromArr(lengthRange)
			var result = "";
			for(var i = 0; i<lengthRange.length; i++){
				if(result != ""){
					result +=  ", " + lengthRange[i];
				}
				else{
					result += lengthRange[i];
				}
			}
			productGroup.getValue("ATT_FGPGLength").setSimpleValue(result.trim());
		} 
		if(thicknessRange.length > 0){
			thicknessRange.sort((x, y) => x - y);
			var thicknessArray = removeNullFomArry(thicknessRange);
			productGroup.getValue("ATT_FGPGThickness").setSimpleValue(findMinMaxRangeInArray(thicknessArray));
		}
		if(widthRange.length > 0){
			widthRange.sort((x, y) => x - y);
			var widthArray = removeDuplicatesFromArr(widthRange);
			/*var result = "";
			for(var i = 0; i<widthArray.length; i++){
				if(result != ""){
					result +=  ", " + widthArray[i];
				}
				else{
					result += widthArray[i];
				}
			}
			productGroup.getValue("ATT_FGPGWidth").setSimpleValue(result.trim());*/
			productGroup.getValue("ATT_FGPGWidth").setSimpleValue(findMinMaxRangeInArray(widthRange));
			
		}
	});
	return 0;
}


// XPF-3824 - Added by ADMIN_BS - 08/12/2025
// Function to populate the base item level attributes to the product group level
function setENPointload_Out_Prefix_Suffix(node, manager) {
	var pointLoad_original = node.getValue("ATT_ENPointLoad").getSimpleValue();
	var pointload_NPD = node.getValue("ATT_ENPointLoad_NPD").getSimpleValue();
	if(pointLoad_original && pointload_NPD){
		node.getValue("ATT_ENPointLoad_Out").deleteCurrent();
	}
	else{
		if(pointLoad_original){
			node.getValue("ATT_ENPointLoad_Out").deleteCurrent();
			var attributeValue = node.getValue("ATT_ENPointLoad").getSimpleValue()+"";
			if(attributeValue){
				attributeValuearry = attributeValue.split("</prefix>");
				attributeValue = attributeValuearry.join("</prefix> ");
				attributeValuearry = attributeValue.split("<suffix>");
				attributeValue = attributeValuearry.join(" <suffix>");
				node.getValue("ATT_ENPointLoad_Out").setSimpleValue(attributeValue);
			}
		}
		else if(pointload_NPD){
			node.getValue("ATT_ENPointLoad_Out").setSimpleValue(pointload_NPD);
		}
		else{
			node.getValue("ATT_ENPointLoad_Out").deleteCurrent();
		}
	}
}


//Calcuate Footnote label based on Superscript attribute
//XFP-6149 ADMIN_VK
function setFGFootnote(node, manager) {
    var contexts = manager.getContextHome().getContexts();
    for (var context in Iterator(contexts)) {
        manager.executeInContext(context.getID(), function (contextManager) {
            var ctxNode = contextManager.getProductHome().getProductByID(node.getID());
            // --- Set #1 (Thermal Conductivity) ---
            var indicator1 = ctxNode.getValue("ATT_FGThermalCondSuperScriptIndicator").getSimpleValue();
            if (indicator1 != "Yes") {
                ctxNode.getValue("ATT_FGThermalCondFootnote").deleteCurrent();
            } 
            else {
                var label1 = contextManager.getAttributeHome().getAttributeByID("ATT_ENThermalConductivityTestMethod").getValue("ATT_AttributeLabel").getSimpleValue();
                var value1 = ctxNode.getValue("ATT_ENThermalConductivityTestMethod").getSimpleValue();
                var combined1 = (label1 ? label1.trim() : "") + (value1 ? " (" + value1.trim() + ")" : "");
                ctxNode.getValue("ATT_FGThermalCondFootnote").setSimpleValue(combined1);
            }

            // --- Set #2 (Compressive Stress/Strength) ---
            var indicator2 = ctxNode.getValue("ATT_FGCharComStresStrenSprScrptIndicator").getSimpleValue();
            if (indicator2 != "Yes") {
                ctxNode.getValue("ATT_FGCharCompStesStrenFootnote").deleteCurrent();
            } 
            else {
                var label2 = contextManager.getAttributeHome().getAttributeByID("ATT_CharCompressiveStressStrength").getValue("ATT_AttributeLabel").getSimpleValue();
                var value2 = ctxNode.getValue("ATT_CharCompressiveStressStrength_TM").getSimpleValue();
                var combined2 = (label2 ? label2.trim() : "") + (value2 ? " (" + value2.trim() + ")" : "");
                ctxNode.getValue("ATT_FGCharCompStesStrenFootnote").setSimpleValue(combined2);
            }
        });
    }
    return 0;
}

// XPF-3824 - Added by ADMIN_RH1 - 08/07/2025
// Function to populate the base item level attributes to the product group level
function setBaseItemLevelAttributetoProductGroup(node, manager) {
//    //var contexts = manager.getContextHome().getContexts();
//    //for (var context in Iterator(contexts)) {
//        //manager.executeInContext(context.getID(), function(contextManager) {
//            //var node = contextManager.getProductHome().getProductByID(node.getID());
//            node.getValue("ATT_ENFireReaction").deleteCurrent();
//            node.getValue("ATT_DesignationCode").deleteCurrent();
//            node.getValue("ATT_ENPointLoad").deleteCurrent();
//            node.getValue("ATT_ENThicknessToleranceClass").deleteCurrent();
//            var fireReactionArr = [];
//            var designationCodeArr = [];
//            var enPointLoadArr = [];
//            var thickToleranceArr = [];
//            var baseItems = node.getChildren().iterator();
//            var baseItem = null;
//			while(baseItems.hasNext()){
//				baseItem = baseItems.next();
//				if(baseItem.getObjectType().getID().equals("BaseItem")){
//					//var bsToDisplay = baseItem.getValue("ATT_BaseItemtoDisplay").getValues().iterator();
//					//while(bsToDisplay.hasNext()){
//						//var contextID = bsToDisplay.next().getID();
//						//if(contextID == context.getID())
//						//{
//							var fireReactions = baseItem.getValue("ATT_BaseENFireReaction").getValues().iterator();
//							while (fireReactions.hasNext()) {
//								var val = fireReactions.next();
//								if (val != null && val != "") {
//									fireReactionArr.push(val.getValue());
//								}
//							}
//							var designationCodes = baseItem.getValue("ATT_BaseDesignationCode").getValues().iterator();
//							while (designationCodes.hasNext()) {
//								var val = designationCodes.next();
//								if (val != null && val != "") {
//									designationCodeArr.push(val.getValue());
//								}
//							}
//							if(node.getValue("ATT_ENPointLoad_NPD").getSimpleValue() == null){
//								var enPointLoads = baseItem.getValue("ATT_BasePointLoad").getValues().iterator();
//								while (enPointLoads.hasNext()) {
//									var val = enPointLoads.next();
//									if (val != null && val != "") {
//										enPointLoadArr.push(val.getSimpleValue());
//									}
//								}
//							}
//							var thickTolerances = baseItem.getValue("ATT_BaseENThickToleranceClass").getValues().iterator();
//							while (thickTolerances.hasNext()) {
//								var val = thickTolerances.next();
//								if (val != null && val != "") {
//									thickToleranceArr.push(val.getValue());
//								}
//							}
//						//}
//					//}
//				}
//			}
//                
//                    
//        
//            if (fireReactionArr.length > 0) {
//                fireReactionArr = removeDuplicatesFromArr(fireReactionArr).sort();
//                
//                for (var i = 0; i < fireReactionArr.length; i++) {
//                	log.info(fireReactionArr[i])
//                    node.getValue("ATT_ENFireReaction").addValue(fireReactionArr[i]);
//                }
//            }
//            if (designationCodeArr.length > 0) {
//                designationCodeArr = removeDuplicatesFromArr(designationCodeArr).sort();
//                for (var i = 0; i < designationCodeArr.length; i++)
//
//                {
////                	log.info(designationCodeArr[i]);
//                    node.getValue("ATT_DesignationCode").addValue(designationCodeArr[i]);
//                   
//                }
//            }
//             var ENPointLoad_NPD = node.getValue("ATT_ENPointLoad_NPD").getSimpleValue();
//            if (enPointLoadArr.length > 0 && ENPointLoad_NPD == null) {
//                enPointLoadArr.sort(function(a, b) { return a - b; });
//               enPointLoadArr = removeDuplicatesFromArr(enPointLoadArr);
////                log.info("Here"+enPointLoadArr);
//			var mvBuilder = node.getValue("ATT_ENPointLoad").replace();
//                for (var i = 0; i < enPointLoadArr.length; i++)
//
//                {
//			 		mvBuilder = mvBuilder.addSimpleValue(enPointLoadArr[i]);
//                }
//			 		
//		 	try{
//				mvBuilder.apply();
//			}catch(e){
//				log.info(e)
//			}
//                	
//                   
//            }
//            else{
//            	node.getValue("ATT_ENPointLoad").deleteCurrent();
//            }
//            
//            if (thickToleranceArr.length > 0) {
//                thickToleranceArr.sort(function(a, b) { return a - b; });
//               thickToleranceArr = removeDuplicatesFromArr(thickToleranceArr);
//                for (var i = 0; i < thickToleranceArr.length; i++)
//
//                {
//                	log.info(thickToleranceArr[i]);
//                    node.getValue("ATT_ENThicknessToleranceClass").addValue(thickToleranceArr[i]);
//                   
//                }
//                
//            }
//        //});
//    //}
//    return 0;
}

/*
//Warning if thermal conductivity attribute value is not between 0.032 to 0.045
//used in Web UI|SetBIVisibility
function warnUserAboutThermalResistanceTable(node,step)
{
	const docLinkTypeID="P2CL_PRODUCTGRP_TO_PUBLICATION_TMPL";
	var	classificationID;
	var classificationProductLinkTypeHome = manager.getHome(com.stibo.core.domain.classificationproductlinktype.ClassificationProductLinkTypeHome);
var docLinkType= classificationProductLinkTypeHome.getLinkTypeByID("P2CL_PRODUCTGRP_TO_PUBLICATION_TMPL");
	var docTypeLinks=node.queryClassificationProductLinks(docLinkType).asList(100);
	//log.info(docTypeLinks.size());
	for(var i=0;i<docTypeLinks.size();i++)
	{
			var classificationlink=docTypeLinks.get(i); 
			classificationID =classificationlink.getClassification().getID();
			//log.info(classificationID); //PublicationTemplateParocDOPEN13162
	


	if(classificationID == "PublicationTemplateParocDOPEN13162") 
	{
		
		//Asset_DOP_Photos_Paroc
		//ATT_ENThermalConductivity
		//log.info(context.getID());
		var thermalConValue = node.getValue("ATT_ENThermalConductivity").getSimpleValue();
		if(thermalConValue!=null && thermalConValue!="")
		{
			var thermalCon = thermalConValue.split(" ");
			//log.info(typeof(thermalCon[0].replace("<prefix></prefix>","")));
			var numberT= Number(thermalCon[0].replace("<prefix></prefix>",""))*1000;
			//log.info(numberT);
			if(numberT>=32 && numberT<=45)
			{
				return true;
			}
			else
			{
				return false;
			}
		}
		return false;
	}
	}
	return true;
}
*/

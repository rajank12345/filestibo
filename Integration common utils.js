//get Multi and Single DC attributes in array of structure format
function getDCValues(node, manager, dcID, keysWithAttrIDs, structure, key) {
    var keys = Object.keys(keysWithAttrIDs);
    var output = [];
    var nullFlag = true;
    if (node != null) {
        var isDCMultiValued = node.getDataContainerByTypeID(dcID).getDataContainerType().isMultiValued();
        if (isDCMultiValued) {
            var dc = node.getDataContainerByTypeID(dcID).getDataContainers();
            if (dc.size() == 0) {
                nullFlag = true;
            } else {
                var itr = dc.iterator();
                while (itr.hasNext()) {
                    var currentRec = {};
                    var dcObj = itr.next().getDataContainerObject();
                    for (var j = 0; j < keys.length; j++) {
                        if (keys[j] === "WithholdingTaxExemptionValidityPeriod") {
                            currentRec["WithholdingTaxExemptionValidityPeriod"] = {
                                "StartDate": getAttrValues(dcObj, manager, keysWithAttrIDs["WithholdingTaxExemptionValidityPeriod"]["StartDate"]),
                                "EndDate": getAttrValues(dcObj, manager, keysWithAttrIDs["WithholdingTaxExemptionValidityPeriod"]["EndDate"])
                            };
                        } else { // Shivani - 30-10-2024 : Added code from 24 to 30 for passing TaxIdentificationNumberTypeCode without country code
                            if (keys[j] != "TaxIdentificationNumberTypeCode") {
                                currentRec[keys[j]] = getAttrValues(dcObj, manager, keysWithAttrIDs[keys[j]]);
                            } else {
                                var subStrTaxType = getAttrValues(dcObj, manager, keysWithAttrIDs[keys[j]]);
                                currentRec[keys[j]] = subStrTaxType.substr(2);
                            }
                            // currentRec[keys[j]] = getAttrValues(dcObj, manager, keysWithAttrIDs[keys[j]]);
                        }
                    }
                    if (structure == true) {
                        var obj = {};
                        obj[key] = currentRec;
                        output.push(obj);
                    } else {
                        output.push(currentRec);
                    }
                }
                return output;
            }
        } else {
            var currentRec = {};
            var dcObj = node.getDataContainerByTypeID(dcID).getDataContainerObject();
            if (dcObj == null) {
                nullFlag = true;
            } else {
                for (var j = 0; j < keys.length; j++) {
                    if (keys[j] === "WithholdingTaxExemptionValidityPeriod") {
                        currentRec["WithholdingTaxExemptionValidityPeriod"] = {
                            "StartDate": getAttrValues(dcObj, manager, keysWithAttrIDs["WithholdingTaxExemptionValidityPeriod"]["StartDate"]),
                            "EndDate": getAttrValues(dcObj, manager, keysWithAttrIDs["WithholdingTaxExemptionValidityPeriod"]["EndDate"])
                        };
                    } else { // Shivani - 30-10-2024 : Added code from 24 to 30 for passing TaxIdentificationNumberTypeCode without country code
                        currentRec[keys[j]] = getAttrValues(dcObj, manager, keysWithAttrIDs[keys[j]]);
                    }
                }
                if (structure == true) {
                    var obj = {};
                    obj[key] = currentRec;
                    output.push(obj);
                } else {
                    output.push(currentRec);
                }
                return output;
            }
        }
    }
    if (node == null || nullFlag == true) {
        var currentRec = {};
        for (var j = 0; j < keys.length; j++) {
            if (keys[j] === "WithholdingTaxExemptionValidityPeriod") {
                currentRec["WithholdingTaxExemptionValidityPeriod"] = {
                    "StartDate": "",
                    "EndDate": ""
                };
            } else {
                currentRec[keys[j]] = "";
            }
        }
        if (structure == true) {
            var obj = {};
            obj[key] = currentRec;
            output.push(obj);
        } else {
            output.push(currentRec);
        }
        return output;
    }
}
function sellITgetAttrValues(node, manager, attrID) {
    if (node) {
        var isNull = node.getValue(attrID).getSimpleValue();
        if (isNull != null) {
            var attrObj = manager.getAttributeHome().getAttributeByID(attrID);
            var isLOV = attrObj.hasLOV();
            if (isLOV) {
                var hasValueID = attrObj.getListOfValues().isUsingValueIDs();
                // below "MA" & "" changes for BillingAutoMan attribute included as part of 19445 UAT
                if (attrID == "BillingAutoMan") {
                    var val = node.getValue(attrID).getLOVValue().getID();
                    if (val == "SellIT_Manual billing") {
                        log.severe("Manual billing")
                        var attrValue = "MA" + "";
                    } else {
                        log.severe("Null or automation billing")
                        var attrValue = "" + "";
                    }
                    return attrValue;
                } else if (hasValueID) {
                    var attr = node.getValue(attrID).getLOVValue().getID();
                    var attrValue = attr.split('_')[1] + "";
                    return attrValue;
                }
            } else {
                if (attrObj.isMultiValued()) {
                    var multiArr = [];
                    var attrVal = node.getValue(attrID).getValues();
                    for (var i = 0; i < attrVal.size(); i++) {
                        if (attrVal.get(i).getValue() == "Yes") {
                            multiArr.push(true);
                        } else if (attrVal.get(i).getValue() == "No") {
                            multiArr.push(false);
                        } else {
                            multiArr.push(attrVal.get(i).getSimpleValue() + "");
                        }
                    }
                    return multiArr;
                } else {
                    if (node.getValue(attrID).getSimpleValue() == "Yes") {
                        var attrValue = true;
                    } else if (node.getValue(attrID).getSimpleValue() == "No") {
                        var attrValue = false;
                    }
                    //	                else if(attrID == "MDMBPNumber") {
                    //	            	 	var val = node.getValue(attrID).getSimpleValue();
                    //	            	 	var attrValue = val.split('_')[1] + "";
                    //	            	 }
                    else {
                        var attrValue = node.getValue(attrID).getSimpleValue() + "";
                    }
                    return attrValue;
                }
            }
        } else {
            var lov = node.getValue(attrID).getAttribute().getListOfValues();
            //if(lov && (lov.getID() == "YesNoInternal") && (attrID != "Service-BasedInvoiceVerification") && (attrID != "GR-BasedInvoiceVerification")){
            if (lov && (lov.getID() == "YesNoInternal")) {
                // preethi: 23-dec-2024: As per extension JSON , commented SalesAreaDeliveryBlock and SalesAreaBillingBlock.
                //if(attrID == "CentralOrderBlock" || attrID == "CentralBillingBlock" || attrID == "CentralDeliveryBlock" || attrID == "SalesAreaOrderBlock" || attrID == "SalesAreaBillingBlock" || attrID == "SalesAreaDeliveryBlock" || attrID == "VendorSub-range(VSR)Relevant" || attrID == "TransportationChain") {
                //preethi: 04-Feb-2025: As per extension JSON , commented CentralBillingBlock and CentralDeliveryBlock.
                //if(attrID == "CentralOrderBlock" || attrID == "CentralBillingBlock" || attrID == "CentralDeliveryBlock" || attrID == "SalesAreaOrderBlock" || attrID == "VendorSub-range(VSR)Relevant" || attrID == "TransportationChain") {
                if (attrID == "CentralOrderBlock" || attrID == "SalesAreaOrderBlock" || attrID == "VendorSub-range(VSR)Relevant" || attrID == "TransportationChain") {
                    return "";
                } else {
                    return false;
                }
            } else {
                return "";
            }
        }
    } else {
        return "";
    }
}
//get attribute values - [gets Multi valued attribute, Sets True/False for Yes/No LOVs, Returns LOV ID)
function getAttrValues(node, manager, attrID) {
    if (node) {
        var isNull = node.getValue(attrID).getSimpleValue();
        if (isNull != null) {
            var attrObj = manager.getAttributeHome().getAttributeByID(attrID);
            var isLOV = attrObj.hasLOV();
            if (isLOV) {
                var hasValueID = attrObj.getListOfValues().isUsingValueIDs();
                if (hasValueID) {
                    if (attrObj.isMultiValued()) {
                        var multiArr = [];
                        var attrVal = node.getValue(attrID).getValues();
                        for (var i = 0; i < attrVal.size(); i++) {
                            if (attrVal.get(i).getValue() == "Yes") {
                                multiArr.push(true);
                            } else if (attrVal.get(i).getValue() == "No") {
                                multiArr.push(false);
                            } else {
                                multiArr.push(attrVal.get(i).getID() + "");
                            }
                        }
                        if (attrID == "BusinessUnitCode") {
                            return multiArr.join(';');
                        } else if (attrID == "CustomerBrands") {
                            return multiArr.join(',');
                        } else if (attrID == "SubProductType") {
                            return multiArr.join(',');
                        } else if (attrID == "LoadingInstructions") { //Preethi : 06-May-2025 : ZZLDSC should be an array as part of defect 20174
                            return multiArr.map(item => item.split("_")[1]);
                        } else {
                            return multiArr;
                        }
                    } else {
                        if (node.getValue(attrID).getLOVValue().getValue() == "Yes") {
                            //14/11 : Preethi : added this logic as per madan and erkki's comments
                            //if(attrID == "CentralOrderBlock" || attrID == "CentralBillingBlock" || attrID == "CentralDeliveryBlock" || attrID == "SalesAreaOrderBlock" || attrID == "SalesAreaBillingBlock" || attrID == "SalesAreaDeliveryBlock" || attrID == "VendorSub-range(VSR)Relevant" || attrID == "TransportationChain"){
                            //preethi: 23-dec-2024: As per extension JSON , commented SalesAreaDeliveryBlock and SalesAreaBillingBlock.
                            //preethi: 04-Feb-2025: As per extension JSON , commented CentralBillingBlock and CentralDeliveryBlock.
                            //if(attrID == "CentralOrderBlock" || attrID == "CentralBillingBlock" || attrID == "CentralDeliveryBlock" || attrID == "SalesAreaOrderBlock" || attrID == "VendorSub-range(VSR)Relevant" || attrID == "TransportationChain") {
                            if (attrID == "CentralOrderBlock" || attrID == "SalesAreaOrderBlock" || attrID == "VendorSub-range(VSR)Relevant" || attrID == "TransportationChain") {
                                var attrValue = "01" + "";
                            } else {
                                var attrValue = true;
                            }
                        } else if (node.getValue(attrID).getLOVValue().getValue() == "No") {
                            // preethi: 23-dec-2024: As per extension JSON , commented SalesAreaDeliveryBlock and SalesAreaBillingBlock.
                            //if(attrID == "CentralOrderBlock" || attrID == "CentralBillingBlock" || attrID == "CentralDeliveryBlock" || attrID == "SalesAreaOrderBlock" || attrID == "SalesAreaBillingBlock" || attrID == "SalesAreaDeliveryBlock" || attrID == "VendorSub-range(VSR)Relevant" || attrID == "TransportationChain"){
                            //preethi: 04-Feb-2025: As per extension JSON , commented CentralBillingBlock and CentralDeliveryBlock.
                            //if(attrID == "CentralOrderBlock" || attrID == "CentralBillingBlock" || attrID == "CentralDeliveryBlock" || attrID == "SalesAreaOrderBlock" || attrID == "VendorSub-range(VSR)Relevant" || attrID == "TransportationChain") {
                            if (attrID == "CentralOrderBlock" || attrID == "SalesAreaOrderBlock" || attrID == "VendorSub-range(VSR)Relevant" || attrID == "TransportationChain") {
                                var attrValue = "";
                            } else {
                                var attrValue = false;
                            }
                        } else if (attrID == "WithholdingTaxCode" || attrID == "WithholdingTaxTypes") {
                            var attr = node.getValue(attrID).getLOVValue().getID();
                            var attrValue = attr.slice(-2);
                        } // Preethi: 05-Nov-2024 - Added this loop to send last two characters
                        else if (attrID == "BPCategory") {
                            var attr = node.getValue(attrID).getLOVValue().getID();
                            var attrValue = attr.slice(-1);
                        } // Preethi: 08-Nov-2024 - Added this loop to send last one character	
                        else if (attrID == "CustomerCategory") {
                            var attr = node.getValue(attrID).getLOVValue().getID();
                            var attrValue = attr.split('_')[1] + "";
                        } else if (attrID == "TaxJurisdictionCode") {
                            var attr = node.getValue(attrID).getLOVValue().getID();
                            var attrValue = attr.split('_')[1] + "";
                        } else if (attrID == "PrintBarcodeList") {
                            var attr = node.getValue(attrID).getLOVValue().getID();
                            var attrValue = attr.split('_')[1] + "";
                        } else if (attrID == "RelationshipType") {
                            var attr = node.getValue(attrID).getLOVValue().getID();
                            var attrValue = attr.split('-')[1] + "";
                        }
                        //Commented it as part of defect 20079
                        //                        else if (attrID == "InterestIndicator") {
                        //                            log.severe("Interest Indicator")
                        //                            var attr = node.getValue(attrID).getLOVValue().getID();
                        //                            var attrValue = attr.split('_')[1] + "";
                        //                        }
                        else if (attrID == "CustomerRecordType") {
                            var attrValue = node.getValue("CustomerRecordType").getSimpleValue() + "";
                        } else {
                            var attrValue = node.getValue(attrID).getLOVValue().getID() + "";
                        }
                        return attrValue;
                    }
                } else {
                    if (attrObj.isMultiValued()) {
                        var multiArr = [];
                        var attrVal = node.getValue(attrID).getValues();
                        for (var i = 0; i < attrVal.size(); i++) {
                            if (attrVal.get(i).getValue() == "Yes") {
                                multiArr.push(true);
                            } else if (attrVal.get(i).getValue() == "No") {
                                multiArr.push(false);
                            } else {
                                multiArr.push(attrVal.get(i).getValue() + "");
                            }
                        }
                        return multiArr;
                    } else {
                        if (node.getValue(attrID).getSimpleValue() == "Yes") {
                            var attrValue = true;
                        } else if (node.getValue(attrID).getSimpleValue() == "No") {
                            var attrValue = false;
                        } else {
                            var attrValue = node.getValue(attrID).getSimpleValue() + "";
                        }
                        return attrValue;
                    }
                }
            } else {
                if (attrObj.isMultiValued()) {
                    var multiArr = [];
                    var attrVal = node.getValue(attrID).getValues();
                    for (var i = 0; i < attrVal.size(); i++) {
                        if (attrVal.get(i).getValue() == "Yes") {
                            multiArr.push(true);
                        } else if (attrVal.get(i).getValue() == "No") {
                            multiArr.push(false);
                        } else {
                            multiArr.push(attrVal.get(i).getSimpleValue() + "");
                        }
                    }
                    return multiArr;
                } else {
                    if (node.getValue(attrID).getSimpleValue() == "Yes") {
                        var attrValue = true;
                    } else if (node.getValue(attrID).getSimpleValue() == "No") {
                        var attrValue = false;
                    }
                    //	                else if(attrID == "MDMBPNumber") {
                    //	            	 	var val = node.getValue(attrID).getSimpleValue();
                    //	            	 	var attrValue = val.split('_')[1] + "";
                    //	            	 }
                    else {
                        var attrValue = node.getValue(attrID).getSimpleValue() + "";
                    }
                    return attrValue;
                }
            }
        } else {
            var lov = node.getValue(attrID).getAttribute().getListOfValues();
            //if(lov && (lov.getID() == "YesNoInternal") && (attrID != "Service-BasedInvoiceVerification") && (attrID != "GR-BasedInvoiceVerification")){
            if (lov && (lov.getID() == "YesNoInternal")) {
                //preethi: 23-dec-2024:  As per extension JSON , commented SalesAreaDeliveryBlock and SalesAreaBillingBlock.
                //if(attrID == "CentralOrderBlock" || attrID == "CentralBillingBlock" || attrID == "CentralDeliveryBlock" || attrID == "SalesAreaOrderBlock" || attrID == "SalesAreaBillingBlock" || attrID == "SalesAreaDeliveryBlock" || attrID == "VendorSub-range(VSR)Relevant" || attrID == "TransportationChain") {
                //preethi: 04-Feb-2025: As per extension JSON , commented CentralBillingBlock and CentralDeliveryBlock.
                //if(attrID == "CentralOrderBlock" || attrID == "CentralBillingBlock" || attrID == "CentralDeliveryBlock" || attrID == "SalesAreaOrderBlock" || attrID == "VendorSub-range(VSR)Relevant" || attrID == "TransportationChain") {
                if (attrID == "CentralOrderBlock" || attrID == "SalesAreaOrderBlock" || attrID == "VendorSub-range(VSR)Relevant" || attrID == "TransportationChain") {
                    return "";
                } else {
                    return false;
                }
            } else if (attrID == "LoadingInstructions") { //Preethi : 06-May-2025 : ZZLDSC should be an array as part of defect 20174
                return [];
            } else {
                return "";
            }
        }
    } else {
        return "";
    }
}
//get attribute from the node level
function getnodeValues(node, manager, keysWithAttrIDs, structure, key) {
    var keys = Object.keys(keysWithAttrIDs);
    var output = [];
    var currentRec = {};
    for (var j = 0; j < keys.length; j++) {
        currentRec[keys[j]] = getAttrValues(node, manager, keysWithAttrIDs[keys[j]])
    }
    if (structure == true) {
        var obj = {};
        obj[key] = currentRec;
        output.push(obj);
        return output;
    } else {
        output.push(currentRec);
        return output;
    }
}
//get attribute from single Data container
function getSingleDCValues(node, manager, dcID, attrID) {
    if (node != null) {
        var dcObj = node.getDataContainerByTypeID(dcID).getDataContainerObject();
        if (dcObj == null) {
            var lovObj = manager.getAttributeHome().getAttributeByID(attrID).getListOfValues();
            if (lovObj && (lovObj.getID() == "YesNoInternal")) {
                var attrVal = false;
            } else {
                var attrVal = "";
            }
        } else {
            var attrVal = getAttrValues(dcObj, manager, attrID);
        }
        return attrVal;
    }
}
//get attribute or object from multivalued reference (array of Values format)
function getRefMultiValues(node, manager, refID, attrID, flag) {
    var output = [];
    var refObj = manager.getReferenceTypeHome().getReferenceTypeByID(refID);
    var reference = node.queryReferences(refObj);
    reference.forEach(function(re) {
        var target = re.getTarget();
        if (flag == true) {
            var val = getAttrValues(target, manager, attrID);
            if (val) {
                output.push(val);
            }
        } else if (flag == false) {
            output.push(target);
        }
        return true;
    });
    return output;
}
//get attribute from single valued reference
function getRefrenceAttr(node, manager, refID, attrID, flag) {
    var attrVal = "";
    var refObj = manager.getReferenceTypeHome().getReferenceTypeByID(refID);
    var reference = node.queryReferences(refObj);
    reference.forEach(function(re) {
        var target = re.getTarget();
        if (flag == true) {
            attrVal = target.getName() + "";
        } else {
            if (attrID == "EMVendorNumber" || attrID == "EMCustomerNumber") { //Added EMCustomerNumber as part of RFC 21437
                attrVal = checkInternalId(target, manager, attrID);
            } else {
                attrVal = getAttrValues(target, manager, attrID);
            }
        }
        return true;
    });
    if (node.queryReferences(refObj).asList(2).size() == 0) {
        var lovObj = manager.getAttributeHome().getAttributeByID(attrID).getListOfValues();
        if (lovObj && (lovObj.getID() == "YesNoInternal")) {
            attrVal = false;
        }
    }
    return attrVal;
}
//pass Accounting Information details
function customerAccInfo(node, manager, refID) {
    var output = [];
    var ccArr = getRefMultiValues(node, manager, refID, null, false);
    //Preethi : 07-feb-2025 added set as part of defect#17904
    var set = new java.util.HashSet();
    for (i = 0; i < ccArr.length; i++) {
        //Preethi: 07-feb-2025 : defect#17904 : Added the 3 lines below to send a company code only once if an organisation has the same company code multiple times.    	   
        if (set.contains(getAttrValues(ccArr[i], manager, "CompanyCodeID")))
            continue;
        set.add(getAttrValues(ccArr[i], manager, "CompanyCodeID"));
        //
        var currentRec = {}
        currentRec["CompanyID"] = getAttrValues(ccArr[i], manager, "CompanyCodeID");
        //Preethi - Added below lines for Webservice
        currentRec["BlockedIndicator"] = getAttrValues(ccArr[i], manager, "CompanyCodePostingBlock");
        currentRec["DeletedIndicator"] = getAttrValues(ccArr[i], manager, "InactiveonCompanyCode");
        //currentRec["LocalProcessingIndicator"] = getAttrValues(node, manager, "ProcessIndicator"); 11/11 : Preethi: Need step field
        currentRec["AccountingClerkInitialsCode"] = getRefrenceAttr(ccArr[i], manager, "CCDataEntityAccountingClerk", "ReferenceDataID", false);
        currentRec["CustomerSupplierClearingIndicator"] = getAttrValues(ccArr[i], manager, "ClearingBetweenCustomerAndVendor");
        currentRec["RecordPaymentHistoryIndicator"] = getAttrValues(ccArr[i], manager, "PaymentHistoryRecord");
        currentRec["PayItemsSeparatelyIndicator"] = getAttrValues(ccArr[i], manager, "SinglePayment");
        var sourceSystem = getAttrValues(ccArr[i], manager, "SourceofOtherSystemNumber");
        if (sourceSystem) {
            //Preethi : 02/May/2025 : Added 002, 998, 999, ForIT-FI and ForIT-DE as part of defect 20083
            if (sourceSystem == "001" || sourceSystem == "002" || sourceSystem == "999" || sourceSystem == "998" || sourceSystem == "ForIT-FI" || sourceSystem == "ForIT-DE") {
                currentRec["PreviousCustomerInternalID"] = getAttrValues(ccArr[i], manager, "NumberinOtherSystem");
            }
        }
        currentRec["PaymentBlockCode"] = getRefrenceAttr(ccArr[i], manager, "CCDataEntityPaymentBlock", "ReferenceDataID", false);
        currentRec["PaymentMethodsCode"] = concatPaymentMethod(ccArr[i], manager, "CCDataEntityPaymentMethod", "ReferenceDataID");
        //Preethi - Added below lines for Bio4EST
        var reconcil = {};
        reconcil["ID"] = getRefrenceAttr(ccArr[i], manager, "CCDataEntityReconciliationAccount", "ReferenceDataID", false);
        currentRec["GeneralLedgerAccountReference"] = reconcil;
        currentRec["CashDiscountTermsCode"] = getRefrenceAttr(ccArr[i], manager, "CCDataEntityPaymentTerm", "ReferenceDataID", false);
        //Preethi - Added below lines for DEBMAS Customer
        //Preethi : 02-Jun-2025 - Removed sortcode mapping as part of defect 20837
        //currentRec["SortCode"] = getAttrValues(node, manager, "HFMCode");
        currentRec["PaymentAdvicesSelectionRuleCode"] = getAttrValues(ccArr[i], manager, "SelectionRule");
        //commented and added new line as part of defect 20079
        //currentRec["InterestCalculationInclusionCode"] = getAttrValues(ccArr[i], manager, "InterestIndicator");
        currentRec["InterestCalculationInclusionCode"] = getRefrenceAttr(ccArr[i], manager, "InterestIndicator", "ReferenceDataID", false);
        currentRec["InterestCalculationFrequencyCode"] = getAttrValues(ccArr[i], manager, "InterestCycle");
        // Raghav:  Lockbox attribute is changed to reference. defect 19127,19838
        //currentRec["LockboxCode"] = getAttrValues(ccArr[i], manager, "Lockbox");
        currentRec["LockboxCode"] = getRefrenceAttr(ccArr[i], manager, "Lockbox", "ReferenceDataID", false);
        currentRec["AlternativePayeePartyInternalID"] = getSAPBPNumber(ccArr[i], manager, "AlternativePayer");
        currentRec["HeadOfficeAccountInternalID"] = getSAPBPNumber(ccArr[i], manager, "HeadOffice");
        currentRec["DebtorPartyCreditorID"] = getAttrValues(ccArr[i], manager, "UPMAccountNumberatCustomer");
        currentRec["EmployeeResponsiblePartyFaxFormattedNumberDescription"] = getAttrValues(ccArr[i], manager, "AccountingClerkFaxNumber");
        currentRec["EmployeeResponsiblePartyName"] = getAttrValues(ccArr[i], manager, "AccountingClerkattheCustomer");
        currentRec["EmployeeResponsiblePartyWebAddress"] = getAttrValues(ccArr[i], manager, "AccountingClerkEmailAddress");
        currentRec["EmployeeResponsiblePartyTelephoneFormattedNumberDescription"] = getAttrValues(ccArr[i], manager, "AccountingClerkTelephoneNumber");
        currentRec["PeriodicAccountStatementsCode"] = getAttrValues(ccArr[i], manager, "AccountStatement");
        //Preethi - Added below lines for Webservice
        currentRec["PaymentGroupingCode"] = getAttrValues(ccArr[i], manager, "GroupingKey");
        currentRec["BusinessPartnerToleranceGroupCode"] = getRefrenceAttr(ccArr[i], manager, "CCDataEntityToleranceGroup", "ReferenceDataID", false);
        currentRec["Note"] = getAttrValues(ccArr[i], manager, "FinanceNotes");
        currentRec["PlanningGroupCode"] = getRefrenceAttr(ccArr[i], manager, "CCDataEntityPlanningGroup", "ReferenceDataID", false);
        currentRec["PaymentAdvicesByEDIIndicator"] = getAttrValues(ccArr[i], manager, "SendPaymentAdvicebyEDI");
        currentRec["DunningInformation"] = [];
        var dunprocedure = getAttrValues(ccArr[i], manager, "DunningProcedure");
        if (dunprocedure) {
            var dun = {};
            dun["DunningProcedureCode"] = getAttrValues(ccArr[i], manager, "DunningProcedure");
            dun["DunningClerkInitialsCode"] = getRefrenceAttr(ccArr[i], manager, "CCDataEntityDunningClerk", "ReferenceDataID", false);
            currentRec["DunningInformation"].push(dun);
        }
        //Preethi : Added as part of 21272
        currentRec["UPM_PermittedPayer"] = upmPermittedPayer(ccArr[i], manager);
        //Supriya : Added as part of 21737
        currentRec["UPM_ThailandBranchCode"] = getBranchCodeThailand(ccArr[i],manager);
        output.push(currentRec);
    }
    return output;
}
//pass Accounting Information details
function supplierAccInfo(node, manager, refID) {
    var output = [];
    var ccArr = getRefMultiValues(node, manager, refID, null, false);
    //Preethi : 07-feb-2025 added set as part of defect#17904
    var set = new java.util.HashSet();
    for (i = 0; i < ccArr.length; i++) {
        //Preethi: 07-feb-2025 : defect#17904 : Added the 3 lines below to send a company code only once if an organisation has the same company code multiple times.    	   
        if (set.contains(getAttrValues(ccArr[i], manager, "CompanyCodeID")))
            continue;
        set.add(getAttrValues(ccArr[i], manager, "CompanyCodeID"));
        //
        var currentRec = {}
        //Preethi - added below lines for Bio4EST
        currentRec["CompanyID"] = getAttrValues(ccArr[i], manager, "CompanyCodeID");
        //Preethi - added below lines for Webservice
        currentRec["BlockedIndicator"] = getAttrValues(ccArr[i], manager, "CompanyCodePostingBlock");
        currentRec["DeletedIndicator"] = getAttrValues(ccArr[i], manager, "InactiveonCompanyCode");
        currentRec["PreviousSupplierInternalID"] = getAttrValues(ccArr[i], manager, "NumberinOtherSystem");
        currentRec["WithholdingTaxCountryCode"] = getAttrValues(ccArr[i], manager, "WithholdingTaxCountry");
        currentRec["MinorityIndicatorsCode"] = processMinorityIndicator(ccArr[i], manager, "CompanyCode");
        currentRec["PaymentAdvicesByEDIIndicator"] = getAttrValues(ccArr[i], manager, "SendPaymentAdvicebyEDI");
        //preethi: added below line on 05/dec
        currentRec["WithholdingTax"] = withHoldingTax(ccArr[i], manager, "WithholdingTax");
        //Preethi - added below lines for Webservice
        var reconcil = {};
        reconcil["ID"] = getRefrenceAttr(ccArr[i], manager, "CCDataEntityReconciliationAccount", "ReferenceDataID", false);
        currentRec["GeneralLedgerAccountReference"] = reconcil;
        currentRec["PayItemsSeparatelyIndicator"] = getAttrValues(ccArr[i], manager, "SinglePayment");
        currentRec["DoubleEntriesCheckIndicator"] = getAttrValues(ccArr[i], manager, "CheckDoubleInvoice");
        currentRec["AccountingClerkInitialsCode"] = getRefrenceAttr(ccArr[i], manager, "CCDataEntityAccountingClerk", "ReferenceDataID", false);
        currentRec["CustomerSupplierClearingIndicator"] = getAttrValues(ccArr[i], manager, "ClearingBetweenCustomerAndVendor");
        currentRec["PlanningGroupCode"] = getRefrenceAttr(ccArr[i], manager, "CCDataEntityPlanningGroup", "ReferenceDataID", false);
        currentRec["Note"] = getAttrValues(ccArr[i], manager, "FinanceNotes");
        currentRec["PaymentBlockCode"] = getRefrenceAttr(ccArr[i], manager, "CCDataEntityPaymentBlock", "ReferenceDataID", false);
        currentRec["BusinessPartnerToleranceGroupCode"] = getRefrenceAttr(ccArr[i], manager, "CCDataEntityToleranceGroup", "ReferenceDataID", false);
        // raghav : addded for basware
        currentRec["PeriodicAccountStatementsCode"] = getAttrValues(ccArr[i], manager, "AccountStatement");
        currentRec["EmployeeResponsiblePartyFaxFormattedNumberDescription"] = getAttrValues(ccArr[i], manager, "AccountingClerkFaxNumber");
        currentRec["CashDiscountTermsCode"] = getRefrenceAttr(ccArr[i], manager, "CCDataEntityPaymentTerm", "ReferenceDataID", false);
        currentRec["PaymentMethodsCode"] = concatPaymentMethod(ccArr[i], manager, "CCDataEntityPaymentMethod", "ReferenceDataID");
        currentRec["PaymentGroupingCode"] = getAttrValues(ccArr[i], manager, "GroupingKey");
        currentRec["HeadOfficeAccountInternalID"] = getSAPBPNumber(ccArr[i], manager, "HeadOffice");
        currentRec["PaymentMethodSupplementCode"] = getAttrValues(ccArr[i], manager, "PaymentMethodSupplement");
        // currentRec["InvoiceVerificationToleranceGroupCode"]= "0001"+"";
        //added the InvoiceVerificationToleranceGroupCode as per Tiina's comment - Check Query_SIT Testing doc
        //17/dec: commented as per Erkki and Tiina'Comments
        // currentRec["InvoiceVerificationToleranceGroupCode"] = getRefrenceAttr(ccArr[i], manager, "CCDataEntityToleranceGroup", "ReferenceDataID", false);
        currentRec["DebtorPartyCreditorID"] = getAttrValues(ccArr[i], manager, "UPMAccountNumberAtVendor");
        //Preethi:12/dec: added the below line:
        // By Divya Replaced PrePaymentRelevancyCode with AlternativePayeeAllowedIndicator as part of defect17090
        currentRec["AlternativePayeeAllowedIndicator"] = getAttrValues(ccArr[i], manager, "PermittedPayeeInUse");
        //        currentRec.UPM_AlternativePayee = {};
        //        var UPM_AlternativePayee = currentRec.UPM_AlternativePayee;
        //        UPM_AlternativePayee["AlternativePayeeInternalID"] = getRefrenceAttr(ccArr[i], manager, "AlternativePayee", "MDMBPNumber", false);
        //
        //        UPM_AlternativePayee.AlternativePayeeBankDetails = getAlternateBankAttributes(ccArr[i], manager, "OrganisationSupplierBankAccount");
        //
        //        currentRec.UPM_PermittedPayee = [];
        //        var UPM_PermittedPayee = {};
        //        UPM_PermittedPayee["PermittedPayeeInternalID"] = getRefrenceAttr(ccArr[i], manager, "PermittedPayee", "MDMBPNumber", false);
        //        UPM_PermittedPayee.PermittedPayeeBankDetails = getPermittedPayeeBankDetails(ccArr[i], manager, "OrganisationSupplierBankAccount", "PermittedPayee");
        //        currentRec.UPM_PermittedPayee.push(UPM_PermittedPayee);
        //preethi : 03/dec : commented the below lines as it is wrong
        //          currentRec.UPM_AlternativePayee = {};
        //        var AlternativePayeeInternalID=getRefrenceAttr(ccArr[i], manager, "AlternativePayee", "EMVendorNumber", false);
        //		if(AlternativePayeeInternalID)
        //		{
        //		currentRec.UPM_AlternativePayee = {};
        //        var UPM_AlternativePayee = currentRec.UPM_AlternativePayee;
        //        UPM_AlternativePayee["AlternativePayeeInternalID"] = getRefrenceAttr(ccArr[i], manager, "AlternativePayee", "EMVendorNumber", false);
        //
        //        UPM_AlternativePayee.AlternativePayeeBankDetails = getAlternateBankAttributes(ccArr[i], manager, "OrganisationSupplierBankAccount");
        //		}
        //preethi : 03/dec : commented the above lines as it is wrong
        currentRec.UPM_AlternativePayee = {};
        //currentRec.UPM_AlternativePayee.AlternativePayeeInternalID = getRefrenceAttr(ccArr[i], manager, "AlternativePayee", "EMVendorNumber", false);
        currentRec.UPM_AlternativePayee.AlternativePayeeInternalID = getSAPBPNumber(ccArr[i], manager, "AlternativePayee");
        currentRec.UPM_AlternativePayee.AlternativePayeeBankDetails = getAlternateBankAttributes(ccArr[i], manager, "OrganisationSupplierBankAccount");
        //currentRec.UPM_PermittedPayee = [];
        //var PermittedPayeeInternalID=getRefrenceAttr(ccArr[i], manager, "PermittedPayee", "EMVendorNumber", false);
        //var PermittedPayeeInternalID=getSAPBPNumber(ccArr[i],manager,"PermittedPayee");
        //if(PermittedPayeeInternalID)
        //{
        //        var UPM_PermittedPayee = {};
        //        UPM_PermittedPayee["PermittedPayeeInternalID"] = getRefrenceAttr(ccArr[i], manager, "PermittedPayee", "MDMBPNumber", false);
        //        UPM_PermittedPayee.PermittedPayeeBankDetails = getPermittedPayeeBankDetails(ccArr[i], manager, "OrganisationSupplierBankAccount", "PermittedPayee");
        //        currentRec.UPM_PermittedPayee.push(UPM_PermittedPayee);
        //        output.push(currentRec);
        currentRec.UPM_PermittedPayee = getPermittedPayeeBankDetails(ccArr[i], manager, "OrganisationSupplierBankAccount", "PermittedPayee");
        //	}
        output.push(currentRec);
    }
    return output;
}
//Get Customer sales area Data
function customerSalesArrangement(node, manager, refID) {
    var output = [];
    //preethi : 28/04/2025 : Added as part of 19038
    var set = new java.util.HashSet();
    var salesArr = getRefMultiValues(node, manager, refID, null, false);
    if (salesArr.length != 0) {
        for (i = 0; i < salesArr.length; i++) {
            var salesOrgKey = getRefrenceAttr(salesArr[i], manager, "SAPCustomerSalesAreaDataEntitySalesArea", "SalesOrganisationID", false);
            var divisionCode = getRefrenceAttr(salesArr[i], manager, "SAPCustomerSalesAreaDataEntitySalesArea", "DivisionID", false);
            var distributionChannelCode = getRefrenceAttr(salesArr[i], manager, "SAPCustomerSalesAreaDataEntitySalesArea", "DistributionChannelID", false);
            //preethi : 15/05/2025 : Added as part of 19038(key updated)
            var sourceSystem = getRefrenceAttr(salesArr[i], manager, "SAPCustomerSalesAreaDataEntitySalesArea", "ExternalSystemID", false);
            //preethi : 28/04/2025 : Added as part of 19038
            var keySalesArea = salesOrgKey + "-" + divisionCode + "-" + distributionChannelCode + "-" + sourceSystem;
            if (salesOrgKey && divisionCode && distributionChannelCode) {
                //preethi : 28/04/2025 : Added as part of 19038
                if (set.contains(keySalesArea))
                    continue;
                set.add(keySalesArea);
                var currentRec = {}
                currentRec.UPM_Routing = {};
                currentRec.UPM_Routing.SourceSystem = [];
                currentRec.UPM_Routing.SourceSystem.push(getRefrenceAttr(salesArr[i], manager, "SAPCustomerSalesAreaDataEntitySalesArea", "ExternalSystemID", false))
                // As per extension JSON , Added SalesAreaDeliveryBlock and SalesAreaBillingBlock. - 23-dec-2024: Preethi added below lines.
                currentRec["UPM_SalesAreaDeliveryBlock"] = getAttrValues(salesArr[i], manager, "SalesAreaDeliveryBlock");
                currentRec["UPM_SalesAreaBillingBlock"] = getAttrValues(salesArr[i], manager, "SalesAreaBillingBlock");
                currentRec["SalesOrganisationID"] = getRefrenceAttr(salesArr[i], manager, "SAPCustomerSalesAreaDataEntitySalesArea", "SalesOrganisationID", false);
                currentRec["RebateRelevantIndicator"] = getAttrValues(salesArr[i], manager, "Rebate");
                currentRec["SalesSupportBlockedIndicator"] = getAttrValues(salesArr[i], manager, "SalesAreaBlockforCustomer");
                currentRec["AgencyBusinessRelevanceIndicator"] = getAttrValues(salesArr[i], manager, "AgencyBusiness");
                currentRec["CurrencyCode"] = getAttrValues(salesArr[i], manager, "SalesCurrency");
                currentRec["StatisticsGroupCode"] = getRefrenceAttr(salesArr[i], manager, "SalesAreaDataEntityCustStatGroup", "ReferenceDataID", false);
                //Preethi: added below lines for DEBMAS customer
                currentRec["ManualInvoiceMaintenanceIndicator"] = getAttrValues(salesArr[i], manager, "ManInvoiceMaintSubsInvProcessing");
                currentRec["PriceGroupCode"] = getRefrenceAttr(salesArr[i], manager, "SalesAreaDataEntityPriceGroup", "ReferenceDataID", false); // ? getRefrenceAttr(salesArr[i], manager, "SalesAreaDataEntityPriceGroup", "ReferenceDataID", false).split('_')[1] + "" : ""; //Added by Supriya on 3.7.25 for RFC 19394
                currentRec["PriceListTypeCode"] = getRefrenceAttr(salesArr[i], manager, "SalesAreaDataEntityPriceList", "ReferenceDataID", false); //Added by Supriya on 23.7.25 for RFC 19394
                var deliveryTerms = {};
                var incoTerms = {};
                incoTerms["ClassificationCode"] = getRefrenceAttr(salesArr[i], manager, "SalesAreaDataEntityIncoterm", "ReferenceDataID", false);
                //incoTerms["TransferLocationName"] = getAttrValues(salesArr[i], manager, "IncotermsLocation");
                //Preethi: 28-March-2025 : Added as part of defect 18905
                var incolocationPaper = getRefrenceAttr(salesArr[i], manager, "SalesAreaDataEntityIncotermLocationPaper", "PlaceCodeLocation", false);
                //incoTerms["TransferLocationName"] = (incolocationPaper) ? incolocationPaper : (getAttrValues(salesArr[i], manager, "IncotermsLocation"));
                //Preethi : 30/05 : Added the logic for TransferLocationName as part of defect 20330
                if (getAttrValues(salesArr[i], manager, "IncotermsLocation1")) {
                    incoTerms["TransferLocationName"] = getAttrValues(salesArr[i], manager, "IncotermsLocation1");
                } else if (getAttrValues(salesArr[i], manager, "IncotermsLocation")) {
                    incoTerms["TransferLocationName"] = getAttrValues(salesArr[i], manager, "IncotermsLocation");
                } else if (incolocationPaper) {
                    incoTerms["TransferLocationName"] = incolocationPaper;
                }
                //Preethi: added below lines for DEBMAS customer
                incoTerms["TransferLocationNameLong"] = getAttrValues(salesArr[i], manager, "IncotermsLocation1");
                incoTerms["Version"] = getAttrValues(salesArr[i], manager, "IncotermsVersion"); //Added for the defect 19801
                deliveryTerms.Incoterms = incoTerms;
                var qualityTolerence = {};
                qualityTolerence["OverPercent"] = getAttrValues(salesArr[i], manager, "OverdeliveryToleranceLimit");
                qualityTolerence["UnderPercent"] = getAttrValues(salesArr[i], manager, "UnderdeliveryToleranceLimit");
                deliveryTerms["DeliveryPriorityCode"] = getRefrenceAttr(salesArr[i], manager, "SalesAreaDataEntityDeliveryPriority", "ReferenceDataID", false);
                deliveryTerms["OrderCombinationAllowedIndicator"] = getAttrValues(salesArr[i], manager, "OrderCombination");
                //Preethi : 11-July-2025 : Added PartialDeliveryControlCode as part of RFC 18910
                deliveryTerms["PartialDeliveryControlCode"] = getRefrenceAttr(salesArr[i], manager, "SalesAreaDataPartialDeliveryPerItem", "ReferenceDataID", false);
                deliveryTerms["PartialDeliveryMaximumNumberValue"] = getAttrValues(salesArr[i], manager, "Max.NumberofPartialDeliveries");
                deliveryTerms["QuantityTolerance"] = qualityTolerence;
                currentRec["DeliveryTerms"] = deliveryTerms;
                currentRec["GroupCode"] = getRefrenceAttr(salesArr[i], manager, "SalesAreaDataEntityCustomerGroup", "ReferenceDataID", false);
                currentRec["TransportServiceLevelCode"] = getRefrenceAttr(salesArr[i], manager, "SalesAreaDataEntityShippingCondition", "ReferenceDataID", false);
                // As per extension JSON , commented SalesAreaDeliveryBlock and SalesAreaBillingBlock.Added extension fields
                //currentRec["DeliveryBlockingReasonCode"] = getAttrValues(salesArr[i], manager, "SalesAreaDeliveryBlock");
                //currentRec["BillingBlockingReasonCode"] = getAttrValues(salesArr[i], manager, "SalesAreaBillingBlock");
                currentRec["AccountAssignmentGroupCode"] = getRefrenceAttr(salesArr[i], manager, "SalesAreaDataEntityAccountAssmtGrpCust", "ReferenceDataID", false);
                currentRec["IncoiceListScheduleCalendarCode"] = getRefrenceAttr(salesArr[i], manager, "SalesAreaDataEntityInvoicingListDate", "ReferenceDataID", false);
                currentRec["InvoiceDatesCalendarCode"] = getRefrenceAttr(salesArr[i], manager, "SalesAreaDataEntityInvoicingDate", "ReferenceDataID", false);
                currentRec["DeliveringPlantID"] = getRefrenceAttr(salesArr[i], manager, "SalesAreaDataEntityDeliveringPlant", "ReferenceDataID", false);
                currentRec["CashDiscountTermsCode"] = getRefrenceAttr(salesArr[i], manager, "SalesAreaDataEntityPaymentTerm", "ReferenceDataID", false);
                currentRec["SalesGroupCode"] = getRefrenceAttr(salesArr[i], manager, "SalesAreaDataEntitySalesGroup", "ReferenceDataID", false);
                currentRec["SalesOfficeCode"] = getRefrenceAttr(salesArr[i], manager, "SalesAreaDataEntitySalesOffice", "ReferenceDataID", false);
                currentRec["CustomerDefinedGroupCode"] = getRefrenceAttr(salesArr[i], manager, "SalesAreaDataEntityCustomerGroup1", "ReferenceDataID", false);
                currentRec["FirstAdditionalCustomerDefinedGroupCode"] = getRefrenceAttr(salesArr[i], manager, "SalesAreaDataEntityCustomerGroup2", "ReferenceDataID", false);
                currentRec["SecondAdditionalCustomerDefinedGroupCode"] = getRefrenceAttr(salesArr[i], manager, "SalesAreaDataEntityCustomerGroup3", "ReferenceDataID", false);
                currentRec["ItemOrderProbabilityNumberValue"] = getAttrValues(salesArr[i], manager, "Orderprobability");
                currentRec["SalesDistrictCode"] = getRefrenceAttr(salesArr[i], manager, "SalesAreaDataEntitySalesDistrict", "ReferenceDataID");
                //  currentRec["PricingProcedureDeterminationCode"] = getRefrenceAttr(salesArr[i], manager, "SalesAreaDataEntityCustPricProcedure", "ReferenceDataID", false);
                currentRec["PricingProcedureDeterminationCodeLong"] = getRefrenceAttr(salesArr[i], manager, "SalesAreaDataEntityCustPricProcedure", "ReferenceDataID", false);
                currentRec["OrderBlockingReasonCode"] = getAttrValues(salesArr[i], manager, "SalesAreaOrderBlock");
                currentRec["DeletedIndicator"] = getAttrValues(salesArr[i], manager, "IsinactiveonSalesArea");
                currentRec["DivisionCode"] = getRefrenceAttr(salesArr[i], manager, "SAPCustomerSalesAreaDataEntitySalesArea", "DivisionID", false);
                currentRec["DistributionChannelCode"] = getRefrenceAttr(salesArr[i], manager, "SAPCustomerSalesAreaDataEntitySalesArea", "DistributionChannelID", false);
                // Mapping for SellerPartyBuyerID included as part of incident INC2733264
			  currentRec["SellerPartyBuyerID"] = getAttrValues(salesArr[i], manager, "AccountatCustomer"); 
                // Raghav: as part of defect 19942
                currentRec["CreditControlAreaCode"] = getRefrenceAttr(salesArr[i], manager, "SAPCustomerCCADataEntityCCA", "ReferenceDataID", false);
                currentRec["PartnerFunctions"] = partnerFunction(salesArr[i], manager, "OrganisationSalesAreaDataEntityPFData");
                currentRec["PricingRelevanceIndicator"] = getAttrValues(salesArr[i], manager, "PriceDetermination");
                // Preethi : 31/01/2025 :Added the below condition as part of defect fixing.Defect# 17612
                var AdditionalSalesAreaDataZCUSTneeded = salesArr[i].getValue("AdditionalSalesAreaDataZCUSTneeded?").getLOVValue();
                if (AdditionalSalesAreaDataZCUSTneeded && AdditionalSalesAreaDataZCUSTneeded.getID() == "Y") {
                    // raghav added for seLLIT
                    currentRec.UPM_Z2KSLSDATA = {};
                    var UPM_Z2KSLSDATA = currentRec.UPM_Z2KSLSDATA;
                    UPM_Z2KSLSDATA["ZZALTGRADE"] = getAttrValues(salesArr[i], manager, "InterchangeableProduct");
                    UPM_Z2KSLSDATA["ZZTRMODE"] = sellITgetAttrValues(salesArr[i], manager, "TransportModeLastLeg");
                    UPM_Z2KSLSDATA["ZZVTYPE"] = sellITgetAttrValues(salesArr[i], manager, "TranUnitType");
                    //Preethi : 06-May-2025 : ZZLDSC should be an array as part of defect 20174
                    UPM_Z2KSLSDATA["ZZLDSC"] = getAttrValues(salesArr[i], manager, "LoadingInstructions");
                    UPM_Z2KSLSDATA["ZZTOPLC"] = getAttrValues(salesArr[i], manager, "StackingAllowed");
                    UPM_Z2KSLSDATA["ZZLDMODRL"] = sellITgetAttrValues(salesArr[i], manager, "RLLoadingType");
                    UPM_Z2KSLSDATA["ZZLDMODSH"] = sellITgetAttrValues(salesArr[i], manager, "SHLoadingType");
                    UPM_Z2KSLSDATA["ZZSTACRULE"] = sellITgetAttrValues(salesArr[i], manager, "StackingRule");
                    UPM_Z2KSLSDATA["ZZROWRESTR"] = sellITgetAttrValues(salesArr[i], manager, "RowRestricions");
                    UPM_Z2KSLSDATA["ZZMSYST"] = sellITgetAttrValues(salesArr[i], manager, "MeasureSystem");
                    //UPM_Z2KSLSDATA["ZZMAXPALH"] = getAttrValues(salesArr[i], manager, "MaxPalletHeight"); // changed this line id
                    // Added below line for Defect- 20702  by vainkatesh singh on 21_05
                    var maxPalletWeight = parseFloat(sellITgetAttrValues(salesArr[i], manager, "MaxPalletWeight"));
                    UPM_Z2KSLSDATA["ZZMAXPALW"] = maxPalletWeight ? maxPalletWeight + "" : "";
                    var maxPalletHeight = parseFloat(getAttrValues(salesArr[i], manager, "MaxPalletHeight"));
                    UPM_Z2KSLSDATA["ZZMAXPALH"] = maxPalletHeight ? maxPalletHeight + "" : "";
                    UPM_Z2KSLSDATA["ZZFREESTD"] = getAttrValues(salesArr[i], manager, "FreeStockDays");
                    UPM_Z2KSLSDATA["ZZUOMDIM"] = sellITgetAttrValues(salesArr[i], manager, "UoMDimensions");
                    UPM_Z2KSLSDATA["ZZUOMWT"] = sellITgetAttrValues(salesArr[i], manager, "UoMWeight"); // Added this line to fix defect 17272 on feb25 by SupriyaShivani
                    UPM_Z2KSLSDATA["ZZTRUSP"] = sellITgetAttrValues(salesArr[i], manager, "TrUnitSpecPropRL");
                    UPM_Z2KSLSDATA["ZZMAXRLW"] = getAttrValues(salesArr[i], manager, "MaxWgtPerReel");
                    UPM_Z2KSLSDATA["ZZMAXPCKWEIGHT"] = getAttrValues(salesArr[i], manager, "MaxWgtPerPack");
                    // UPM_Z2KSLSDATA["ZZFREESTD"] = getAttrValues(salesArr[i], manager, "FreeStockingDays");
                    UPM_Z2KSLSDATA["ZZFAKSK"] = sellITgetAttrValues(salesArr[i], manager, "BillingAutoMan");
                    UPM_Z2KSLSDATA["ZZINVUNITR"] = sellITgetAttrValues(salesArr[i], manager, "InvUoMRL");
                    UPM_Z2KSLSDATA["ZZINVUNITS"] = sellITgetAttrValues(salesArr[i], manager, "InvUoMFS");
                    UPM_Z2KSLSDATA["ZZINVUNITC"] = sellITgetAttrValues(salesArr[i], manager, "InvUoMCS");
                    UPM_Z2KSLSDATA["ZZPREINV"] = getAttrValues(salesArr[i], manager, "Stk-invoicing");
                    UPM_Z2KSLSDATA["ZZXINCO2"] = getAttrValues(salesArr[i], manager, "GrpInvIncoterms");
                    UPM_Z2KSLSDATA["ZZXLIFEX"] = getAttrValues(salesArr[i], manager, "InvPerLoad");
                    UPM_Z2KSLSDATA["ZZXKUNNR_SH"] = getAttrValues(salesArr[i], manager, "SplitbySH");
                    UPM_Z2KSLSDATA["ZZXGRADE_GROUP"] = getAttrValues(salesArr[i], manager, "SplitbyGrade");
                    UPM_Z2KSLSDATA["ZZPOSSTRIPE"] = getAttrValues(salesArr[i], manager, "PositionStripe");
                    UPM_Z2KSLSDATA["ZZMAXJOINTS"] = getAttrValues(salesArr[i], manager, "MaxNoOfJoins");
                    UPM_Z2KSLSDATA["ZZPONUMBER"] = getAttrValues(salesArr[i], manager, "PONumbertoShipMark");
                    UPM_Z2KSLSDATA["ZZXPRDTYP"] = getAttrValues(salesArr[i], manager, "SplitbyProdTyp");
                    UPM_Z2KSLSDATA["ZZXVGBEL"] = getAttrValues(salesArr[i], manager, "SplitbySO");
                    UPM_Z2KSLSDATA["ZZXCHARG"] = getAttrValues(salesArr[i], manager, "SplitbySO&line");
                    UPM_Z2KSLSDATA["ZZINNERSTAMP"] = sellITgetAttrValues(salesArr[i], manager, "InnerStampCode");
                    UPM_Z2KSLSDATA["ZZXMATBW"] = getAttrValues(salesArr[i], manager, "SplitbyMaterial");
                    UPM_Z2KSLSDATA["ZZXSUBS"] = getAttrValues(salesArr[i], manager, "SplitbyB/W");
                    UPM_Z2KSLSDATA["ZZXPOS"] = getAttrValues(salesArr[i], manager, "SplitbyPO");
                    UPM_Z2KSLSDATA["ZZBUFOK"] = getAttrValues(salesArr[i], manager, "BUForderallowedforthisZINTcustomer");
                    UPM_Z2KSLSDATA["ZZXMILL"] = getAttrValues(salesArr[i], manager, "SplitbyMill");
                    UPM_Z2KSLSDATA["ZZXMAGAZINE"] = getAttrValues(salesArr[i], manager, "GroupbyEndProduct");
                    UPM_Z2KSLSDATA["ZZMAXRLWIDTH"] = getAttrValues(salesArr[i], manager, "MaxwidthofReel");
                    UPM_Z2KSLSDATA["ZZMINRLWIDTH"] = getAttrValues(salesArr[i], manager, "MinwidthofReel");
                    UPM_Z2KSLSDATA["ZZMAXRLDIAMETER"] = getAttrValues(salesArr[i], manager, "MaxdiameterofReel");
                    UPM_Z2KSLSDATA["ZZMINRLDIAMETER"] = getAttrValues(salesArr[i], manager, "MindiameterofReel");
                    UPM_Z2KSLSDATA["ZZPREINVAFT"] = getAttrValues(salesArr[i], manager, "RentFreeWhsDays");
                    UPM_Z2KSLSDATA["ZZRENTAL_FEE"] = getAttrValues(salesArr[i], manager, "RentalFee");
                    UPM_Z2KSLSDATA["WAERS"] = getAttrValues(salesArr[i], manager, "UPMCurrency");
                    UPM_Z2KSLSDATA["ZZRENTAL_BASIS"] = sellITgetAttrValues(salesArr[i], manager, "RentalBasis");
                    UPM_Z2KSLSDATA["ZZRENTAL_UOM"] = sellITgetAttrValues(salesArr[i], manager, "RentalfeeUoM");
                    UPM_Z2KSLSDATA["ZZINVOICE_METHOD"] = sellITgetAttrValues(salesArr[i], manager, "InvoicingMethod");
                    UPM_Z2KSLSDATA["ZZXGROUP_INV"] = getAttrValues(salesArr[i], manager, "GroupInvItem");
                    UPM_Z2KSLSDATA["ZZIBPBABYPAL"] = sellITgetAttrValues(salesArr[i], manager, "BabyPalAccBulkInd");
                    UPM_Z2KSLSDATA["ZZSBPBABYPAL"] = sellITgetAttrValues(salesArr[i], manager, "BabyPalAccBulkStk");
                    UPM_Z2KSLSDATA["ZZRWBABYPAL"] = sellITgetAttrValues(salesArr[i], manager, "BabyPalAccRW");
                    UPM_Z2KSLSDATA["ZZCERT01"] = sellITgetAttrValues(salesArr[i], manager, "PEFCCertf");
                    UPM_Z2KSLSDATA["ZZCERT02"] = sellITgetAttrValues(salesArr[i], manager, "FSCMixedcr");
                    UPM_Z2KSLSDATA["ZZCERT03"] = sellITgetAttrValues(salesArr[i], manager, "EUEco-label");
                    UPM_Z2KSLSDATA["ZZCERT05"] = sellITgetAttrValues(salesArr[i], manager, "ATEco-label");
                    UPM_Z2KSLSDATA["ZZCERT08"] = sellITgetAttrValues(salesArr[i], manager, "FSCCWWood");
                    UPM_Z2KSLSDATA["ZZCERT10"] = sellITgetAttrValues(salesArr[i], manager, "PEFCRecyc");
                    UPM_Z2KSLSDATA["ZZCERT11"] = sellITgetAttrValues(salesArr[i], manager, "SFICertf");
                    UPM_Z2KSLSDATA["ZZXTRAID"] = getAttrValues(salesArr[i], manager, "SplitVehiculeID");
                    UPM_Z2KSLSDATA["ZZXCNTNRID"] = getAttrValues(salesArr[i], manager, "SplitContainerID");
                    UPM_Z2KSLSDATA["ZZJPRINT"] = getAttrValues(salesArr[i], manager, "Allowjoinprint");
                    UPM_Z2KSLSDATA["ZEINVOICE"] = getAttrValues(salesArr[i], manager, "CustE-invoice");
                    UPM_Z2KSLSDATA["ZPRINT"] = getAttrValues(salesArr[i], manager, "Print");
                    UPM_Z2KSLSDATA["ZEINV"] = getAttrValues(salesArr[i], manager, "E-invoice");
                    UPM_Z2KSLSDATA["ZRECIEVER_ID"] = getAttrValues(salesArr[i], manager, "RecserviceID");
                    UPM_Z2KSLSDATA["ZEMAIL"] = getAttrValues(salesArr[i], manager, "Email");
                    UPM_Z2KSLSDATA["ZCUST_EMAIL"] = getAttrValues(salesArr[i], manager, "CustomerEmailID");
                    UPM_Z2KSLSDATA["ZINVOIC_ATTCHMNT"] = getAttrValues(salesArr[i], manager, "OutputoptionsInvoice");
                    UPM_Z2KSLSDATA["ZINVDEL_ATTCHMNT"] = getAttrValues(salesArr[i], manager, "OutputoptionsInvoicewithdelivery");
                    UPM_Z2KSLSDATA["ZSTOP_OUTPUT"] = getAttrValues(salesArr[i], manager, "Stopexistingoutput");
                    UPM_Z2KSLSDATA["ZOUTPUT_LANG"] = sellITgetAttrValues(salesArr[i], manager, "OutputLanguage");
                    UPM_Z2KSLSDATA["ZZXVBELN"] = getAttrValues(salesArr[i], manager, "SplitbyDelivery");
                    UPM_Z2KSLSDATA["ZPROD_TOL"] = sellITgetAttrValues(salesArr[i], manager, "ProductionTolerance");
                    UPM_Z2KSLSDATA["ZREBATE_OUTPUT"] = getAttrValues(salesArr[i], manager, "AdditionalOutputRebateSettlementReport");
                    UPM_Z2KSLSDATA["ZINVLIST_OUTPUT"] = getAttrValues(salesArr[i], manager, "AdditionalOutputInvoiceList");
                    UPM_Z2KSLSDATA["ZZTRUSP_SH"] = sellITgetAttrValues(salesArr[i], manager, "TrUnitSpecPropSH");
                    //UPM_Z2KSLSDATA["ZZCERT_PROD"] = getAttrValues(salesArr[i], manager, "SplitByCertifiedProduct"); not get any attribute here got in another
                    UPM_Z2KSLSDATA["ZZACTUAL_GI_DATE"] = getAttrValues(salesArr[i], manager, "SplitbyactualGIDate");
                    UPM_Z2KSLSDATA["ZZCERT12"] = sellITgetAttrValues(salesArr[i], manager, "CFCCCertf");
                    UPM_Z2KSLSDATA["ZZCERT13"] = sellITgetAttrValues(salesArr[i], manager, "QSCertf");
                    //Preethi : 25-Apr-2025 : Added ZZMAXPALW and ZZCERT_PROD as these 2 are missing in JSON
                    // UPM_Z2KSLSDATA["ZZMAXPALW"] = getAttrValues(salesArr[i], manager, "MaxPalletWeight");
                    //UPM_Z2KSLSDATA["ZZCERT_PROD"] = sellITgetAttrValues(salesArr[i], manager, "SplitbyCertifiedProduct");    --> Attribute is not available in UAT and mentioned as to be checked in MDD
                    //Preethi : 24-Apr-2025 : Commented UPM_Z2KCUST_MILL as part of new requirement and built new function for it.
                    /*currentRec.UPM_Z2KCUST_MILL = [];
                    var ZZMWERKS = sellITgetAttrValues(salesArr[i], manager, "ManufacturingMill");
                    if (ZZMWERKS) {
                        var UPM_Z2KCUST_MILL = {};
                        UPM_Z2KCUST_MILL["ZZMWERKS"] = sellITgetAttrValues(salesArr[i], manager, "ManufacturingMill");
                        UPM_Z2KCUST_MILL["ZZTRMODE"] = sellITgetAttrValues(salesArr[i], manager, "TransportModeLastLeg");
                        UPM_Z2KCUST_MILL["ZZVTYPE"] = sellITgetAttrValues(salesArr[i], manager, "TranUnitType");
                        UPM_Z2KCUST_MILL["ZZLDSC"] = sellITgetAttrValues(salesArr[i], manager, "LoadingInstructions");
                        UPM_Z2KCUST_MILL["ZZLDMODRL"] = sellITgetAttrValues(salesArr[i], manager, "RLLoadingType");
                        UPM_Z2KCUST_MILL["ZZLDMODSH"] = sellITgetAttrValues(salesArr[i], manager, "SHLoadingType");
                        UPM_Z2KCUST_MILL["ZZTRUSP"] = sellITgetAttrValues(salesArr[i], manager, "TrUnitSpecProp");
                        UPM_Z2KCUST_MILL["ZZROWRESTR"] = sellITgetAttrValues(salesArr[i], manager, "RowRestricions");
                        UPM_Z2KCUST_MILL["ZZFREESTD"] = getAttrValues(salesArr[i], manager, "FreeStockingDays");
                        currentRec.UPM_Z2KCUST_MILL.push(UPM_Z2KCUST_MILL);
                    }*/
                    //Commented as part of RFC 19121
                    //currentRec.UPM_Z2KCUST_MILL = zcumill(salesArr[i], manager);
                }
                //Added as part of RFC 19121
                //19121 code starts here
                var AdditionalSalesAreaDataZMILLneeded = salesArr[i].getValue("AdditionalSalesAreaData(ZCUMILL)needed?").getLOVValue();
                if (AdditionalSalesAreaDataZMILLneeded && AdditionalSalesAreaDataZMILLneeded.getID() == "Y") {
                	currentRec.UPM_Z2KCUST_MILL = zcumill(salesArr[i], manager);
                }
                //19121 code ends here
                
                //Added as part of defect 21054
                //21054 code starts here
                currentRec.UPM_IS_OIL = {};
                currentRec.UPM_IS_OIL.HandlingType = (getAttrValues(salesArr[i], manager, "HandlingType")) ? getAttrValues(salesArr[i], manager, "HandlingType").split('_')[1] + "" : "";
                currentRec.UPM_IS_OIL.EDPricingKey = (getAttrValues(salesArr[i], manager, "EDPricingKey")) ? getAttrValues(salesArr[i], manager, "EDPricingKey").split('_')[1] + "" : "";
                //21054 code ends here
                output.push(currentRec);
            }
        }
    }
    return output
}
function partnerFunction(node, manager, refID) {
    var output = [];
    var refObj = manager.getReferenceTypeHome().getReferenceTypeByID(refID);
    var reference = node.queryReferences(refObj);
    reference.forEach(function(re) {
        var target = re.getTarget();
        var partyrolecode = getRefrenceAttr(target, manager, "PartnerFunctionDataEntityPartnerFunction", "ReferenceDataID", false);
        if (partyrolecode) {
            var currentRec = {};
            currentRec["UPM_PartnerCounter"] = getAttrValues(target, manager, "PartnerCounter");
            var systemID = getRefrenceAttr(node, manager, "SAPCustomerSalesAreaDataEntitySalesArea", "ExternalSystemID", false);
            // added this as said by divya - 19605
            if (partyrolecode == "ZR" || (systemID != "SellIT" && partyrolecode == "ZC") || partyrolecode == "ZD" || partyrolecode == "ZS" || (systemID != "PlyERP" && partyrolecode == "ZV") || partyrolecode == "ES" || partyrolecode == "AP" || partyrolecode == "YY" || partyrolecode == "YZ") {
                currentRec["PartyInternalID"] = getAttrValues(target, manager, "Supplier");
                currentRec["ReceiverPartyInternalID"] = checkInternalId(target, manager, "Supplier");
            } else if (partyrolecode == "VE") {
                // Raghav: added as part of defect 20393
                currentRec["PartyInternalID"] = getAttrValues(target, manager, "SAP-PERNR");
                currentRec["ReceiverPartyInternalID"] = checkInternalId(target, manager, "SAP-PERNR");
            } else {
                currentRec["PartyInternalID"] = getAttrValues(target, manager, "Customer");
                currentRec["ReceiverPartyInternalID"] = checkInternalId(target, manager, "Customer");
            }
            currentRec["PartyRoleCode"] = getRefrenceAttr(target, manager, "PartnerFunctionDataEntityPartnerFunction", "ReferenceDataID", false);
            currentRec["DefaultIndicator"] = getAttrValues(target, manager, "DefaultPartner");
            //Added as part of defect 21438 
            //21438 Code starts here
            currentRec["UPM_Address"] = {};
            var partnerrefObj = manager.getReferenceTypeHome().getReferenceTypeByID("PartnerFunctionDataOrg");
            var partnerRef = target.queryReferences(partnerrefObj).asList(3);
            if (partnerRef.size() > 0) {
                var partner = partnerRef.get(0).getTarget();
                var objectType = partner.getObjectType().getID();
                currentRec["UPM_Address"].FirstLineName = (objectType == "Organisation") ? getAttrValues(partner, manager, "NameLine1") : getAttrValues(partner, manager, "LastName");
            } else {
                currentRec["UPM_Address"].FirstLineName = "";
            }
            //21438 code ends here
            output.push(currentRec);
        }
        //Added as part of defect 21579
        //21579 Code starts here
        var removedPartner = target.getValue("CustPFRemovedPartnerRef").getSimpleValue();
        var removedPartnerORG = target.getValue("CustPFRemovedPartnerORG").getSimpleValue();
        if (removedPartner) {
            var partyrolecode = getRefrenceAttr(target, manager, "PartnerFunctionDataEntityPartnerFunction", "ReferenceDataID", false);
            if (partyrolecode) {
                var currentRec = {};
                currentRec["UPM_DeletedIndicator"] = true;
                currentRec["UPM_PartnerCounter"] = getAttrValues(target, manager, "PartnerCounter");
                currentRec["PartyInternalID"] = removedPartner;
                currentRec["ReceiverPartyInternalID"] = removedPartner;
                currentRec["PartyRoleCode"] = getRefrenceAttr(target, manager, "PartnerFunctionDataEntityPartnerFunction", "ReferenceDataID", false);
                currentRec["DefaultIndicator"] = getAttrValues(target, manager, "DefaultPartner");
                currentRec["UPM_Address"] = {};
                var removedPartnerEntity = manager.getEntityHome().getEntityByID(removedPartnerORG);
                if (removedPartnerEntity) {
                    var partner = removedPartnerEntity;
                    var objectType = partner.getObjectType().getID();
                    currentRec["UPM_Address"].FirstLineName = (objectType == "Organisation") ? getAttrValues(partner, manager, "NameLine1") : getAttrValues(partner, manager, "LastName");
                } else {
                    currentRec["UPM_Address"].FirstLineName = "";
                }
                output.push(currentRec);
            }
        }
        //21579 code ends here
        return true;
    });
    //Added as part of defect 21579
    // 21579 Code starts here
    var removedPartnerFunctions = node.getValue("RemovedPartnerFunction").getSimpleValue();
    if (removedPartnerFunctions) {
        var removedPartnerFunctionsList = removedPartnerFunctions.split(",");
        for (var k = 0; k < removedPartnerFunctionsList.length; k++) {
            var removedPFEntity = manager.getEntityHome().getEntityByID(removedPartnerFunctionsList[k]);
            if (removedPFEntity) {               
                var partyrolecode = getRefrenceAttr(removedPFEntity, manager, "PartnerFunctionDataEntityPartnerFunction", "ReferenceDataID", false);
                if (partyrolecode) {
                    var currentRec = {};
					currentRec["UPM_DeletedIndicator"] = true;
                    currentRec["UPM_PartnerCounter"] = getAttrValues(removedPFEntity, manager, "PartnerCounter");
                    var systemID = getRefrenceAttr(node, manager, "SAPCustomerSalesAreaDataEntitySalesArea", "ExternalSystemID", false);
                    if (partyrolecode == "ZR" || (systemID != "SellIT" && partyrolecode == "ZC") || partyrolecode == "ZD" || partyrolecode == "ZS" || (systemID != "PlyERP" && partyrolecode == "ZV") || partyrolecode == "ES" || partyrolecode == "AP" || partyrolecode == "YY" || partyrolecode == "YZ") {
                        currentRec["PartyInternalID"] = getAttrValues(removedPFEntity, manager, "Supplier");
                        currentRec["ReceiverPartyInternalID"] = checkInternalId(removedPFEntity, manager, "Supplier");
                    } else if (partyrolecode == "VE") {
                        currentRec["PartyInternalID"] = getAttrValues(removedPFEntity, manager, "SAP-PERNR");
                        currentRec["ReceiverPartyInternalID"] = checkInternalId(removedPFEntity, manager, "SAP-PERNR");
                    } else {
                        currentRec["PartyInternalID"] = getAttrValues(removedPFEntity, manager, "Customer");
                        currentRec["ReceiverPartyInternalID"] = checkInternalId(removedPFEntity, manager, "Customer");
                    }
                    currentRec["PartyRoleCode"] = getRefrenceAttr(removedPFEntity, manager, "PartnerFunctionDataEntityPartnerFunction", "ReferenceDataID", false);
                    currentRec["DefaultIndicator"] = getAttrValues(removedPFEntity, manager, "DefaultPartner");
                    currentRec["UPM_Address"] = {};
                    var partnerrefObj = manager.getReferenceTypeHome().getReferenceTypeByID("PartnerFunctionDataOrg");
                    var partnerRef = removedPFEntity.queryReferences(partnerrefObj).asList(3);
                    if (partnerRef.size() > 0) {
                        var partner = partnerRef.get(0).getTarget();
                        var objectType = partner.getObjectType().getID();
                        currentRec["UPM_Address"].FirstLineName = (objectType == "Organisation") ? getAttrValues(partner, manager, "NameLine1") : getAttrValues(partner, manager, "LastName");
                    } else {
                        currentRec["UPM_Address"].FirstLineName = "";
                    }
                    output.push(currentRec);
                }
            }
        }
    }
    // 21579 Code ends here
    return output;
}
function email(node, manager, dcID) {
    var output = [];
    var dc = node.getDataContainerByTypeID(dcID).getDataContainers();
    if (dc.size() != 0) {
        var itr = dc.iterator();
        while (itr.hasNext()) {
            var currentRec = {};
            var dcObj = itr.next().getDataContainerObject();
            //var validFrom = getAttrValues(dcObj, manager, "SAP-VALID_FROM");
            //var validTo = getAttrValues(dcObj, manager, "SAP-VALID_TO");
            var defaultFlag = getAttrValues(dcObj, manager, "DefaultEmailAddress");
            var sequenceNumber = getAttrValues(dcObj, manager, "EmailSequenceNumber");
            if (sequenceNumber) {
                currentRec["UPM_SequenceNumber"] = getAttrValues(dcObj, manager, "EmailSequenceNumber");
                currentRec["URI"] = getAttrValues(dcObj, manager, "EmailAddress");
                var validity = {};
                //Preethi : 06/06/2025 : Updated the Startdate from 1991-01-24 to 0001-01-01 and EndDate from 9999-12-31 to 9999-12-31
                //validity["StartDate"] = validFrom;
                //validity["EndDate"] = validTo;
                validity["StartDate"] = "0001-01-01" + "";
                validity["EndDate"] = "9999-12-31" + "";
                currentRec["ValidityPeriod"] = validity;
                var emailNoteArr = [];
                //Preethi : 15-July-2025 :Commented notekey & note and Added as part of Ariba changes. Erkki has provided the logic
                //var notekey = getAttrValues(dcObj, manager, "EmailNotes");
                //if (notekey) {
                var emailNoteTextAttr = getAttrValues(dcObj, manager, "EmailNotes");
                var emailNoteDesc = getAttrValues(dcObj, manager, "EmailNotesDescription");
                if (emailNoteTextAttr || emailNoteDesc) {
                    var noteData = {};
                    //noteData["Note"] = getAttrValues(dcObj, manager, "EmailNotes");
                    if (emailNoteDesc && emailNoteDesc == "Other") {
                        noteData["Note"] = emailNoteTextAttr;
                    } else {
                        noteData["Note"] = emailNoteDesc;
                    }
                    emailNoteArr.push(noteData);
                }
                currentRec["EmailNote"] = emailNoteArr;
                var emailUsage = [];
                var code = defaultFlag == true ? "AD_DEFAULT" + "" : "AD_HOME" + "";
                if (code) {
                    var usageData = {};
                    usageData.Usage = {};
                    usageData.Usage.Code = defaultFlag == true ? "AD_DEFAULT" + "" : "AD_HOME" + "";
                    usageData.Usage.ValidityPeriod = {};
                    //Preethi : 06/06/2025 : Updated the Startdate from 1991-01-24 to 0001-01-01 and EndDate from 9999-12-31 to 9999-12-31
                    //usageData.Usage.ValidityPeriod.StartDate = validFrom;
                    //usageData.Usage.ValidityPeriod.EndDate = validTo;
                    usageData.Usage.ValidityPeriod.StartDate = "0001-01-01" + "";
                    usageData.Usage.ValidityPeriod.EndDate = "9999-12-31" + "";
                    emailUsage.push(usageData);
                }
                currentRec["EmailUsage"] = emailUsage;
                usageData.DefaultIndicator = getAttrValues(dcObj, manager, "DefaultEmailAddress");
                output.push(currentRec);
            }
        }
    } //Supriya:Added this line as part of defect 21578
    //Preethi : Added lines below as part of defect 18084(Business area specific Email)
    var emailCall = businessSpecificEmailCall(node, manager);
    if (emailCall == true) {
        var businessAreaList = getRefMultiValues(node, manager, "OrganisationBusinessAreaDataEntity", null, false);
        for (i = 0; i < businessAreaList.length; i++) {
            var emailBA = businessAreaSpecificEmail(businessAreaList[i], manager);
            if (JSON.stringify(emailBA) !== '{}') {
                output.push(emailBA);
            }
        }
    }
    //For Defect-17821 
    output.sort(function(a, b) {
        return a.UPM_SequenceNumber - b.UPM_SequenceNumber;
    });
    return output;
}
function telephone(node, manager, dcID) {
    var output = [];
    var dc = node.getDataContainerByTypeID(dcID).getDataContainers();
    if (dc.size() != 0) {
        var itr = dc.iterator();
        while (itr.hasNext()) {
            var currentRec = {};
            var dcObj = itr.next().getDataContainerObject();
            var validFrom = getAttrValues(dcObj, manager, "SAP-VALID_FROM");
            var validTo = getAttrValues(dcObj, manager, "SAP-VALID_TO");
            var defaultFlag = getAttrValues(dcObj, manager, "DefaultTelephoneNumber");
            var sequenceNumber = getAttrValues(dcObj, manager, "TelephoneNumberSequenceNumber");
            if (sequenceNumber) {
                currentRec["UPM_SequenceNumber"] = getAttrValues(dcObj, manager, "TelephoneNumberSequenceNumber");
                var num = {};
                num["SubscriberID"] = getAttrValues(dcObj, manager, "TelephoneNumber");
                num["CountryCode"] = getAttrValues(dcObj, manager, "TelephoneNumberCountry");
                currentRec["Number"] = num;
                var teleNoteArr = [];
                var validity = {};
                validity["StartDate"] = validFrom;
                validity["EndDate"] = validTo;
                currentRec["ValidityPeriod"] = validity;
                var notekey = getAttrValues(dcObj, manager, "TelephoneNumberNotes");
                if (notekey) {
                    var note = {};
                    note["Note"] = getAttrValues(dcObj, manager, "TelephoneNumberNotes");
                    teleNoteArr.push(note);
                }
                currentRec["TelephoneNote"] = teleNoteArr;
                var telePhUsage = [];
                var code = defaultFlag == true ? "AD_DEFAULT" + "" : "AD_HOME" + "";
                if (code) {
                    var usageData = {};
                    usageData.Usage = {};
                    // if(defaultFlag !== ""){
                    usageData.Usage.Code = defaultFlag == true ? "AD_DEFAULT" + "" : "AD_HOME" + "";
                    //            }else{
                    //            	usageData.Usage.Code = "";
                    //		   }
                    usageData.Usage.ValidityPeriod = {};
                    usageData.Usage.ValidityPeriod.StartDate = validFrom;
                    usageData.Usage.ValidityPeriod.EndDate = validTo;
                    usageData.DefaultIndicator = defaultFlag;
                    telePhUsage.push(usageData);
                }
                currentRec["TelephoneUsage"] = telePhUsage;
                output.push(currentRec);
            }
        } //For Defect-17821
        output.sort(function(a, b) {
            return a.UPM_SequenceNumber - b.UPM_SequenceNumber;
        });
    }
    return output;
}
function fax(node, manager, dcID) {
    var output = [];
    var dc = node.getDataContainerByTypeID(dcID).getDataContainers();
    if (dc.size() != 0) {
        var itr = dc.iterator();
        while (itr.hasNext()) {
            var currentRec = {};
            var dcObj = itr.next().getDataContainerObject();
            var defaultFlag = getAttrValues(dcObj, manager, "DefaultFaxNumber");
            var sequenceNumber = getAttrValues(dcObj, manager, "FaxNumberSequenceNumber");
            if (sequenceNumber) {
                currentRec["UPM_SequenceNumber"] = getAttrValues(dcObj, manager, "FaxNumberSequenceNumber");
                var num = {};
                num["SubscriberID"] = getAttrValues(dcObj, manager, "FaxNumber");
                num["CountryCode"] = getAttrValues(dcObj, manager, "FaxNumberCountry");
                currentRec["Number"] = num;
                var faxNoteArr = [];
                var notekey = getAttrValues(dcObj, manager, "FaxNumberNotes");
                if (notekey) {
                    var noteData = {};
                    noteData["Note"] = getAttrValues(dcObj, manager, "FaxNumberNotes");
                    faxNoteArr.push(noteData);
                }
                currentRec["FacsimileNote"] = faxNoteArr;
                var faxUsage = [];
                var code = defaultFlag == true ? "AD_DEFAULT" + "" : "AD_HOME" + "";
                if (code) {
                    var usageData = {};
                    usageData.Usage = {};
                    // if (defaultFlag !== "") {
                    usageData.Usage.Code = defaultFlag == true ? "AD_DEFAULT" + "" : "AD_HOME" + "";
                    //            } else {
                    //                usageData.Usage.Code = "";
                    //            }
                    usageData.DefaultIndicator = defaultFlag;
                    faxUsage.push(usageData);
                }
                currentRec["FacsimileUsage"] = faxUsage;
                output.push(currentRec);
            }
        } //For Defect-17821
        output.sort(function(a, b) {
            return a.UPM_SequenceNumber - b.UPM_SequenceNumber;
        });
    }
    return output;
}
function getrefValuesinArr(node, manager, refID, keysWithAttrIDs, key) {
    var output = [];
    var keys = Object.keys(keysWithAttrIDs);
    var refObj = manager.getReferenceTypeHome().getReferenceTypeByID(refID);
    if (node.queryReferences(refObj).asList(5).size() != 0) {
        var reference = node.queryReferences(refObj);
        reference.forEach(function(re) {
            var currentRec = {};
            var target = re.getTarget();
            var keyvalue = getAttrValues(target, manager, key);
            if (keyvalue) {
                for (var j = 0; j < keys.length; j++) {
                    currentRec[keys[j]] = getAttrValues(target, manager, keysWithAttrIDs[keys[j]]);
                }
                output.push(currentRec);
            }
            return true;
        });
    }
    return output;
}
function taxClassification(node, manager) {
    var output = [];
    var taxMap = new java.util.HashMap();
    //preethi : 28/04/2025 : Added as part of 19038
    var set = new java.util.HashSet();
    var salesAreaRefs = getRefMultiValues(node, manager, "CCDataEntitySalesAreaDataEntity", null, false);
    for (var i = 0; i < salesAreaRefs.length; i++) {
        var saRef = salesAreaRefs[i];
        var salesArea = getSalesAreaNode(saRef, manager);
        var SalesOrganisationID = salesArea.SalesOrganisationID
        var DivisionCode = salesArea.DivisionCode
        var DistributionChannelCode = salesArea.DistributionChannelCode
        var SourceSystemofSales = salesArea.SourceSystem //Added as part of 20373
        //log.info("SourceSystemofSales :: "+SourceSystemofSales)
        //preethi : 28/04/2025 : Added as part of 19038
        var keySalesArea = SalesOrganisationID + "-" + DivisionCode + "-" + DistributionChannelCode + "-" + SourceSystemofSales;
        if (set.contains(keySalesArea))
            continue;
        set.add(keySalesArea);
        var taxRefs = salesArea.taxRefs
        for (var j = 0; j < taxRefs.length; j++) {
            var taxRef = taxRefs[j];
            var tax = getTaxNode(taxRef, manager);
            var TaxTypeCode = tax.TaxTypeCode;
            var TaxCountryCode = tax.TaxCountryCode;
            var TaxGroupCode = tax.TaxGroupCode;
            var UPM_Routing = tax.UPM_Routing;
            var SourceSystemofTax = UPM_Routing ? UPM_Routing.SourceSystem : ""; //Added as part of 20373
            //log.info("SourceSystemofTax :: "+SourceSystemofTax)
            if (!TaxCountryCode || TaxCountryCode == null || (SourceSystemofSales != SourceSystemofTax)) { //Added as part of 20373
                continue;
            }
            var taxKey = TaxTypeCode + "-" + TaxCountryCode + "-" + TaxGroupCode + "-" + SourceSystemofTax;
            if (!taxMap.containsKey(taxKey)) {
                taxMap.put(taxKey, {
                    "UPM_Routing": UPM_Routing,
                    "UPM_SalesArea": [],
                    "TaxCountryCode": TaxCountryCode,
                    "TaxTypeCode": TaxTypeCode,
                    "TaxGroupCode": TaxGroupCode
                });
            }
            var taxEntry = taxMap.get(taxKey);
            var alreadyAdded = false;
            for (var k = 0; k < taxEntry.UPM_SalesArea.length; k++) {
                //Preethi  : 01-July-2025 17.20pm IST : Added 3 lines & commented if , as part of 21714
                //if (taxEntry.UPM_SalesArea[k].SalesOrganisationID === SalesOrganisationID) {
                var addedSalesKey = SalesOrganisationID + "-" + DivisionCode + "-" + DistributionChannelCode;
                var taxentryKey = taxEntry.UPM_SalesArea[k].SalesOrganisationID + "-" + taxEntry.UPM_SalesArea[k].DivisionCode + "-" + taxEntry.UPM_SalesArea[k].DistributionChannelCode
                if (taxentryKey === addedSalesKey) {
                    alreadyAdded = true;
                    break;
                }
            }
            if (!alreadyAdded) {
                taxEntry.UPM_SalesArea.push({
                    "SalesOrganisationID": SalesOrganisationID,
                    "DistributionChannelCode": DistributionChannelCode,
                    "DivisionCode": DivisionCode
                });
            }
        }
    }
    var result = [];
    taxMap.forEach(function(value) {
        result.push(taxMap.get(value))
    });
    return result;
}
function getSalesAreaNode(node, manager) {
    var currentRec = {};
    currentRec["SalesOrganisationID"] = getRefrenceAttr(node, manager, "SAPCustomerSalesAreaDataEntitySalesArea", "SalesOrganisationID", false);
    currentRec["DivisionCode"] = getRefrenceAttr(node, manager, "SAPCustomerSalesAreaDataEntitySalesArea", "DivisionID", false);
    currentRec["DistributionChannelCode"] = getRefrenceAttr(node, manager, "SAPCustomerSalesAreaDataEntitySalesArea", "DistributionChannelID", false);
    currentRec["taxRefs"] = getRefMultiValues(node, manager, "OrganisationSalesAreaDataEntityTaxData", null, false);
    currentRec["SourceSystem"] = getRefrenceAttr(node, manager, "SAPCustomerSalesAreaDataEntitySalesArea", "ExternalSystemID", false) //Added as part of 20373
    return currentRec;
}
function getTaxNode(node, manager) {
    var currentRec = {};
    currentRec.UPM_Routing = {};
    currentRec.UPM_Routing.SourceSystem = []; //Added as part of 20373
    currentRec.UPM_Routing.SourceSystem.push(getRefrenceAttr(node, manager, "TaxDataEntityTaxClassification", "ExternalSystemID", false)); //Added as part of 20373
    var taxcountry = getAttrValues(node, manager, "TaxCountry");
    var taxgroup = getRefrenceAttr(node, manager, "TaxDataEntityTaxClassification", "ReferenceDataID", false);
    if (taxcountry && taxgroup) {
        currentRec["TaxCountryCode"] = getAttrValues(node, manager, "TaxCountry");
        currentRec["TaxTypeCode"] = getRefrenceAttr(node, manager, "TaxDataEntityTaxCategory", "ReferenceDataID", false);
        currentRec["TaxGroupCode"] = getRefrenceAttr(node, manager, "TaxDataEntityTaxClassification", "ReferenceDataID", false);
    }
    return currentRec;
}
function getAddressAttributes(node, manager, localAddresskey, mainAddresskey, jsonBlock) {
    var output = [];
    var localkeys = Object.keys(localAddresskey);
    var mainkeys = Object.keys(mainAddresskey);
    //var localdcObj = node.getDataContainerByTypeID("3PLocalLanguageAddress").getDataContainerObject();
    var mainDCObj = node.getDataContainerByTypeID("MainAddressDataContainer").getDataContainerObject();
    if (mainDCObj != null) {
        var mainDC = {};
        var country = getAttrValues(mainDCObj, manager, "Country");
        // DOne changes by Vainkatesh-Defect-21270
        for (var k = 0; k < mainkeys.length; k++) {
            if (mainkeys[k] == "StreetName" || mainkeys[k] == "HouseID") {
                var fullStreet = getAttrValues(mainDCObj, manager, "StreetConcat");
                // var parsedAddress = parseAddress(fullStreet);
                if (mainkeys[k] == "StreetName") {
                    // mainDC[mainkeys[k]] = parsedAddress.streetName;
                    mainDC[mainkeys[k]] = fullStreet;
                } else if (mainkeys[k] == "HouseID") {
                    mainDC[mainkeys[k]] = getAttrValues(mainDCObj, manager, "StreetNumber");
                    // if(parsedAddress.streetNumber=="")
                    //mainDC[mainkeys[k]]=getAttrValues(mainDCObj, manager,"StreetNumber");
                }
            } else {
                mainDC[mainkeys[k]] = getAttrValues(mainDCObj, manager, mainAddresskey[mainkeys[k]]);
            }
        }
        mainDC["AddressRepresentationCode"] = "";
        // Raghav: as per of defect 19730
        var streetPostalCode = getAttrValues(mainDCObj, manager, "PostalCode");
        var postalCode = getAttrValues(mainDCObj, manager, "POBoxPostalCode");
        var regioncode = getAttrValues(mainDCObj, manager, "Region");
        var region = regioncode ? regioncode.split('_')[1] + "" : "";
        mainDC["RegionCode"] = regioncode ? regioncode.split('_')[1] + "" : "";
        mainDC["CountryCode"] = country;
        mainDC["StreetPostalCode"] = getAttrValues(mainDCObj, manager, "PostalCode");
        mainDC["POBoxPostalCode"] = getAttrValues(mainDCObj, manager, "POBoxPostalCode");
        mainDC["CareOfName"] = getAttrValues(mainDCObj, manager, "c/oName");
        mainDC["POBoxDeviatingCountryCode"] = getAttrValues(mainDCObj, manager, "POBoxCountry");
        //mainDC["POBoxDeviatingRegionCode"] = getAttrValues(mainDCObj, manager, "POBoxRegion");
        //Added By Raghav as Part of defect 17971
        var val = getAttrValues(mainDCObj, manager, "POBoxRegion");
        var result = (val && val !== "") ? val.split("_")[1] || "" : "";
        mainDC["POBoxDeviatingRegionCode"] = result;
        mainDC["POBoxDeviatingCityName"] = getAttrValues(mainDCObj, manager, "POBoxCity");
        mainDC["POBoxID"] = getAttrValues(mainDCObj, manager, "POBoxNumber");
        mainDC["POBoxIDVisibleIndicator"] = getAttrValues(mainDCObj, manager, "PoBoxWithoutNumber");
        if (jsonBlock == "Postal") {
            mainDC["TaxJurisdictionCode"] = getAttrValues(node, manager, "TaxJurisdictionCode");
            // mainDC["TransportationZoneID"] = getDatafromBusinessArea(node, manager, "OrganisationCustBusinessAreaDataEntity", "Transportation Zone");
        }
        output.push(mainDC);
        //if (localdcObj != null) {
        var dc = node.getDataContainerByTypeID("3PLocalLanguageAddress").getDataContainers();
        if (dc.size() != 0) {
            var itr = dc.iterator();
            while (itr.hasNext()) {
                var dcObj = itr.next().getDataContainerObject();
                var localDC = {};
                for (var j = 0; j < localkeys.length; j++) {
                    localDC[localkeys[j]] = getAttrValues(dcObj, manager, localAddresskey[localkeys[j]]);
                }
                localDC["AddressRepresentationCode"] = getAttrValues(dcObj, manager, "LocalLanguageVersion");
                // Raghav: as per of defect 19730
                localDC["RegionCode"] = region;
                localDC["CountryCode"] = country;
                localDC["StreetPostalCode"] = streetPostalCode;
                localDC["POBoxPostalCode"] = postalCode;
                localDC["CareOfName"] = "";
                localDC["POBoxDeviatingCountryCode"] = "";
                localDC["POBoxDeviatingRegionCode"] = "";
                localDC["POBoxDeviatingCityName"] = "";
                localDC["POBoxID"] = "";
                localDC["POBoxIDVisibleIndicator"] = false;
                if (jsonBlock == "Postal") {
                    localDC["TaxJurisdictionCode"] = mainDC["TaxJurisdictionCode"];
                    // localDC["TransportationZoneID"] = mainDC["TransportationZoneID"];
                }
                output.push(localDC);
            }
        }
    }
    //Preethi : 21/05/2025 : As part of defect 20761 , commenting this else block
    /*else {
        var emptyRec = {};
        for (var k = 0; k < mainkeys.length; k++) {
            emptyRec[mainkeys[k]] = "";
        }
        emptyRec["AddressRepresentationCode"] = "";
        emptyRec["RegionCode"] = "";
        emptyRec["CountryCode"] = "";
        emptyRec["StreetPostalCode"] = "";
        emptyRec["POBoxPostalCode"] = "";
        emptyRec["CareOfName"] = "";
        emptyRec["POBoxDeviatingCountryCode"] = "";
        emptyRec["POBoxDeviatingRegionCode"] = "";
        emptyRec["POBoxDeviatingCityName"] = "";
        emptyRec["POBoxID"] = "";
        emptyRec["POBoxIDVisibleIndicator"] = false;
        if (jsonBlock == "Postal") {
            emptyRec["TaxJurisdictionCode"] = getAttrValues(node, manager, "TaxJurisdictionCode");
            //emptyRec["TransportationZoneID"] = getRefMultiValues(node, manager, "OrganisationCustBusinessAreaDataEntity", "Transportation Zone", true);
        }
        output.push(emptyRec);
    }*/
    return output;
}
function getBankAttributes(node, manager, dcID) {
    var output = [];
    var dc = node.getDataContainerByTypeID(dcID).getDataContainers();
    if (dc.size() != 0) {
        var itr = dc.iterator();
        while (itr.hasNext()) {
            var currentRec = {};
            var dcObj = itr.next().getDataContainerObject();
            var bankKey = getAttrValues(dcObj, manager, "BankKeyInternal");
            var bankCountry = getAttrValues(dcObj, manager, "Country");
            var partnerBank = getAttrValues(dcObj, manager, "PartnerBankType");
            if (partnerBank) {
                // Added by Raghav: as per the defect 18337
                // For the Bank Name we have to send this in new mapping "BankName1".
                currentRec.UPM_BankMasterData = {};
                var dcbankRef = dcObj.getDataContainerReferences(manager.getReferenceTypeHome().getReferenceTypeByID("SAPBankAccountDataBankMaster"));
                if (!dcbankRef.isEmpty()) {
                    currentRec.UPM_BankMasterData["BankName1"] = dcbankRef.get(0).getTarget().getValue("BankName").getSimpleValue() + "";
                } else {
                    currentRec.UPM_BankMasterData["BankName1"] = "";
                }
                currentRec["UPM_Currency"] = getAttrValues(dcObj, manager, "UPMCurrency");
                currentRec["UPM_DefaultIndicator"] = (getAttrValues(dcObj, manager, "BankAccountSequenceNumber") == "1") ? true : false;
                currentRec["ID"] = getAttrValues(dcObj, manager, "PartnerBankType");
                var bankRef = {};
                var swiftbic = null;
			  // Below if condition Included as part of INC2732144 - new change RITM2646487
			  if (!dcbankRef.isEmpty()) {
                   swiftbic = dcbankRef.get(0).getTarget().getValue("SWIFTBIC").getSimpleValue() + "";
				if(bankKey == swiftbic){
					bankRef["BankStandardID"] = bankKey;
				}else {
					bankRef["BankStandardID"] = "";
				}
                 }else {
                   	bankRef["BankStandardID"] = "";
               	}
                  // Above if condition Included as part of INC2732144 - new change RITM2646487
				
                bankRef["BankCountryCode"] = bankCountry;
                // bankRef["BankInternalID"] = bankKey + bankCountry + ""; 13/11 : Preethi : it is failed at S4
                bankRef["BankInternalID"] = bankKey;
                currentRec["BankDirectoryReference"] = bankRef;
                // commented by Raghav
                //	           var dcbankRef = dcObj.getDataContainerReferences(manager.getReferenceTypeHome().getReferenceTypeByID("SAPBankAccountDataBankMaster"));
                //			  if (!dcbankRef.isEmpty()){
                //					currentRec["Name"] = dcbankRef.get(0).getTarget().getValue("BankName").getSimpleValue() + "";
                //			  }
                //			  else{
                //			  	currentRec["Name"] = "";
                //			  }
                currentRec["BankAccountID"] = getAttrValues(dcObj, manager, "SAP-BANKN");
                currentRec["BankAccountStandardID"] = getAttrValues(dcObj, manager, "SAP-IBAN");
                currentRec["BankAccountHolderName"] = getAttrValues(dcObj, manager, "BankAccountHolder");
                var validity = {};
                //Added By Raghav: Commented out as per Divya and Erikki's feedback. .
                //validity["StartDate"] = getAttrValues(dcObj, manager, "ValidFrom");
                //validity["EndDate"] = getAttrValues(dcObj, manager, "ValidTo");
                validity["StartDate"] = "1999-01-24";
                validity["EndDate"] = "9999-01-24";
                currentRec["ValidityPeriod"] = validity;
                var ihcIndicator = getAttrValues(dcObj, manager, "IHCCollectionAuthorization"); //Added the line as part of defect 19764
                currentRec["CollectionAuthorisationIndicator"] = (ihcIndicator == true) ? "X" : ""; //Added the lines as part of defect 19764
                currentRec["BankControlKey"] = getAttrValues(dcObj, manager, "ControlKey");
                currentRec["SpecificationsDescription"] = getAttrValues(dcObj, manager, "ReferenceDetails");
                output.push(currentRec);
            }
        }
    }
    return output;
}
function marketingAttributes(node, manager, refID) {
    var output = [];
    var salesArr = getRefMultiValues(node, manager, refID, null, false);
    if (salesArr.length != 0) {
        for (i = 0; i < salesArr.length; i++) {
            var customerGroup = getRefrenceAttr(salesArr[i], manager, "SalesAreaDataEntityCustomerGroup", "ReferenceDataID", false);
            output.push(customerGroup);
        }
    }
    return output;
}
function role(node, manager) {
    var output = [];
    var customerDCRole = getSingleDCValues(node, manager, "SAPCustomerRoleData", "BPRoleSAP");
    var supplierDCRole = getSingleDCValues(node, manager, "SAPSupplierRoleData", "BPRoleSAP");
    var customerRole = false;
    var vendorRole = false;
    var splitJSON = false;
    var workflowIndicator = "";
    var bpRole = node.getValue("BPRoleTech").getValues(); //Get BPRoleTech value from Org level to check the role.
    // if customerRole = true , then it is customer role; if vendorRole = true , then it is vendor role; if both flag is true, then it has both role
    for (var i = 0; i < bpRole.size(); i++) {
        if (bpRole.get(i).getValue() == "Customer") {
            customerRole = true;
        }
        if (bpRole.get(i).getValue() == "Vendor") {
            vendorRole = true;
        }
    }
    if (customerRole == true && vendorRole == true) {
        var custaccgrp = getRefrenceAttr(node, manager, "SAPCustomerAccountGroup", "AccountGroupID", false);
        var supaccgrp = getRefrenceAttr(node, manager, "SAPSupplierAccountGroup", "AccountGroupID", false);
        if (custaccgrp == "ZTPY" && supaccgrp == "ZTPY") {
            splitJSON = true;
        }
    }
    workflowIndicator = node.getValue("WorkflowIndicator").getSimpleValue();
    if (customerDCRole.length != 0 || supplierDCRole.length != 0) {
        var currentRec;
        if (splitJSON == true && workflowIndicator == "Customer" && customerRole == true && vendorRole == true) {
            for (var i = 0; i < customerDCRole.length; i++) {
                currentRec = {};
                currentRec["RoleCode"] = customerDCRole[i];
                output.push(currentRec);
            }
        } else if (splitJSON == true && workflowIndicator == "Vendor" && customerRole == true && vendorRole == true) {
            for (var j = 0; j < supplierDCRole.length; j++) {
                currentRec = {};
                currentRec["RoleCode"] = supplierDCRole[j];
                output.push(currentRec);
            }
        } else {
            for (var i = 0; i < customerDCRole.length; i++) {
                currentRec = {};
                currentRec["RoleCode"] = customerDCRole[i];
                output.push(currentRec);
            }
            for (var j = 0; j < supplierDCRole.length; j++) {
                currentRec = {};
                currentRec["RoleCode"] = supplierDCRole[j];
                output.push(currentRec);
            }
        }
    }
    return output;
}
/// raghav added for cremas
function getProcurementAttributes(node, manager, refId) {
    var output = [];
    var procurementReferences = getRefMultiValues(node, manager, refId, null, false);
    if (procurementReferences.length === 0) {
        return output;
    }
    var map = new java.util.HashMap();
    for (var i = 0; i < procurementReferences.length; i++) {
        var flag = true;
        var purchID = getRefrenceAttr(procurementReferences[i], manager, "PurchasingOrgDataEntityPurchasingOrg", "ReferenceDataID", false);
        var sourceSystem = getRefrenceAttr(procurementReferences[i], manager, "PurchasingOrgDataEntityPurchasingOrg", "ExternalSystemID", false);
        var mapKey = purchID + sourceSystem;
        if (!map.containsKey(mapKey)) {
            map.put(mapKey, new java.util.ArrayList());
            output.push(getProcurementAttributesForPurchAndPlant([procurementReferences[i]], manager, "CCDataEntityPurchasingOrgDataEntity", purchID, sourceSystem,node));
        }
        var plantarray = [];
        var plantDataRef = getRefMultiValues(procurementReferences[i], manager, "PurchasingOrgDataEntityPlantDataEntity", null, false);
        for (var j = 0; j < plantDataRef.length; j++) {
            var plantrefValue = getRefrenceAttr(plantDataRef[j], manager, "PlantOrgDataEntityPlant", "ReferenceDataID", false);
            if (!map.get(mapKey).contains(plantrefValue)) {
                map.get(mapKey).add(plantrefValue);
                output.push(getProcurementAttributesForPurchAndPlant([plantDataRef[j]], manager, "CCDataEntityPurchasingOrgDataEntity", purchID, sourceSystem,node));
            }
        }
    }
    return output;
}
// Raghav: This function has been changed as part of defect 19820,16-05(Now we are also fetching the details of Plant).
function getProcurementAttributesForPurchAndPlant(procurementReferences, manager, refId, purchId, sourceSystem,Orgnode) {
    //var output = [];
    var i = 0;
    //    var output = [];
    //    var procurementReferences = getRefMultiValues(node, manager, refId, null, false);
    //    if (procurementReferences.length === 0) {
    //        return output;
    //    }
    //    //Preethi : 13-feb-2025 added set as part of defect#17904
    //    var set = new java.util.HashSet();
    //    for (var i = 0; i < procurementReferences.length; i++) {
    //        //Preethi: 13-feb-2025 : defect#17904 : Added the 3 lines below to send a purchasing organisation only once if an organisation has the same company code multiple times.
    //        //if (set.contains(getRefrenceAttr(procurementReferences[i], manager, "PurchasingOrgDataEntityPurchasingOrg", "ReferenceDataID", false)))
    //        //   continue;
    //        //set.add(getRefrenceAttr(procurementReferences[i], manager, "PurchasingOrgDataEntityPurchasingOrg", "ReferenceDataID", false));
    //        //Preethi: 06-March-2025 : added 8 lines below as part of 18322 (PORG and plant - key combination)
    //        var purchID = getRefrenceAttr(procurementReferences[i], manager, "PurchasingOrgDataEntityPurchasingOrg", "ReferenceDataID", false);
    //        var plantarray = [];
    //        var plantDataRef = getRefMultiValues(procurementReferences[i], manager, "PurchasingOrgDataEntityPlantDataEntity", null, false);
    //        plantarray = plantDataRef.length > 0 ? plantDataRef : [null];
    //        for (var j = 0; j < plantarray.length; j++) {
    //            var keyval = (plantarray[j] == null) ? (purchID + "-" + null) : (purchID + "-" + getRefrenceAttr(plantarray[j], manager, "PlantOrgDataEntityPlant", "ReferenceDataID", false));
    //            if (!(set.contains(keyval))) {
    //                set.add(keyval)
    var procurementData = {};
    //added UPM_SupplierPhoneNumber as per extended JSON - also defect 17757
    procurementData["UPM_SupplierPhoneNumber"] = getAttrValues(procurementReferences[i], manager, "Telephone");
    procurementData["PurchasingOrganisationID"] = purchId;
    //PurchasingOrgDataEntityPurchasingOrg
    //procurementData["PurchasingOrganisationID"] = getRefrenceAttr(procurementReferences[i], manager, "PurchasingOrgDataEntityPurchasingOrg", "ReferenceDataID", false);
    // Added as part of 17687 Defect
    procurementData["ReceiverPurchasingOrganisationID"] = purchId;
    // Included as part of Ariba new interface deployed on 10/07/2025
    var aribaIndicator = toSetAribaIndicators(purchId, Orgnode, manager);
    procurementData["UPM_AribaGuidedBuyingIndicator"] = aribaIndicator.split(';')[0];
    procurementData["UPM_AribaCatalogActivationIndicator"] = aribaIndicator.split(';')[1];
    //Added as part of RFc 19321
    //19321 code starts here
    procurementData["UPM_FreightSettlementProfileID"] = getAttrValues(procurementReferences[i], manager, "FreightSettlementProfileID");
    procurementData["UPM_CalculationProfileID"] = getAttrValues(procurementReferences[i], manager, "CalculationProfileID");
    
    //19321 code ends here
    //Preethi : 15-July-2025 : Added as part of ariba changes.
    procurementData["UPM_PreferredOrderingMethodForAGB"] = getAttrValues(procurementReferences[i], manager, "PreferedOrderingMethodsForAGB");
    //procurementData["ReceiverPurchasingOrganisationID"] = getRefrenceAttr(procurementReferences[i], manager, "PurchasingOrgDataEntityPurchasingOrg", "ReferenceDataID", false);
    // procurementData["PurchasingOrganisationID"] = getAttrValues(procurementReferences[i], manager, "3PPurchasingOrganisationID");
    // procurementData["PurchaseOrderCurrencyCode"] = getAttrValues(procurementReferences[i], manager, "PurchasingCurrency");
    procurementData["PurchasingGroupID"] = getRefrenceAttr(procurementReferences[i], manager, "PurchasingOrgDataEntityPurchasingGroup", "ReferenceDataID", false);
    //Added By Raghav on 20-03-2025: Deletion Indicator for Supplier at Purchasing Level
    procurementData["DeletedIndicator"] = getAttrValues(procurementReferences[i], manager, "IsInactiveonPurchasingOrganisation?");
    procurementData["SellerPartyContactPersonName"] = getAttrValues(procurementReferences[i], manager, "Salesperson");
    procurementData["StagingDuration"] = getAttrValues(procurementReferences[i], manager, "StagingTime");
    procurementData["TransportationChainCode"] = getAttrValues(procurementReferences[i], manager, "TransportationChain");
    procurementData["SupplierABCClassificationCode"] = getAttrValues(procurementReferences[i], manager, "ABCIndicator");
    //procurementData["LoadBuildingRestrictionProfileCode"] = getAttrValues(procurementReferences[i], manager, "LBrestrictionprofile");
    procurementData["ReleaseApprovalGroupCode"] = getAttrValues(procurementReferences[i], manager, "ReleaseCreationProfile");
    //procurementData["SupplyingPlantID"] = getPlant(procurementReferences[i], manager)
    //Preethi: 06-mar-2025 : as part of defect 18322 - modified SupplyingPlantID
    //procurementData["SupplyingPlantID"] = (plantarray[j] != null) ? getRefrenceAttr(plantarray[j], manager, "PlantOrgDataEntityPlant", "ReferenceDataID", false) : "";
    procurementData["SupplyingPlantID"] = getRefrenceAttr(procurementReferences[i], manager, "PlantOrgDataEntityPlant", "ReferenceDataID", false);
    //Included as part of defect 21594
    procurementData["UPM_ReturnsSupplierIndicator"] = getAttrValues(procurementReferences[i], manager, "ReturnsVendor");
    //Commented below mapping for ReturnsSupplierIndicator. As per comments from Tiina in defect 21594
    //procurementData["ReturnsSupplierIndicator"] = getAttrValues(procurementReferences[i], manager, "VendorRMARequired");
    var purchasingTerms = {};
    purchasingTerms["DeliveryBasedInvoiceVerificationIndicator"] = getAttrValues(procurementReferences[i], manager, "GR-BasedInvoiceVerification");
    //purchasingTerms["CashDiscountTermsCode"] = getAttrValues(procurementReferences[i], manager, "PurchasingPaymentTerm");
    purchasingTerms["CashDiscountTermsCode"] = getRefrenceAttr(procurementReferences[i], manager, "CCDataEntityPaymentTerm", "ReferenceDataID", false);
    //purchasingTerms["PurchaseOrderConfirmationRequirementCode"] = getAttrValues(procurementReferences[i], manager, "AcknowledgmentRequired");
    purchasingTerms["PurchaseOrderCurrencyCode"] = getAttrValues(procurementReferences[i], manager, "PurchasingCurrency");
    purchasingTerms["PlannedDeliveryDuration"] = getAttrValues(procurementReferences[i], manager, "PlannedDeliveryTimeinDays");
    purchasingTerms["ReturnItemsEvaluatedReceiptSettlementIndicator"] = getAttrValues(procurementReferences[i], manager, "AutomaticERSForReturns");
    // purchasingTerms["TransportServiceLevelCode"] = getAttrValues(procurementReferences[i], manager, "SAP-VSBED");
    purchasingTerms["TransportServiceLevelCode"] = getRefrenceAttr(procurementReferences[i], manager, "SalesAreaDataEntityShippingCondition", "ReferenceDataID", false);
    purchasingTerms["AgencyBusinessRelevanceIndicator"] = getAttrValues(procurementReferences[i], manager, "AgencyBusiness");
    purchasingTerms["PricingRelevanceIndicator"] = getAttrValues(procurementReferences[i], manager, "PriceDetermination");
    purchasingTerms["OrderMinimumAmount"] = getAttrValues(procurementReferences[i], manager, "Minimumordervalue");
    purchasingTerms["LoadBuildingRestrictionProfileCode"] = getAttrValues(procurementReferences[i], manager, "LBrestrictionprofile");
    purchasingTerms["EvaluatedReceiptSettlementIndicator"] = getAttrValues(procurementReferences[i], manager, "EvaluatedReceiptSettlement(ERS)");
    purchasingTerms["AutomaticPurchaseOrderGenerationAllowedIndicator"] = getAttrValues(procurementReferences[i], manager, "AutomaticPurchaseOrder");
    purchasingTerms["SubsequentSettlementApplyIndicator"] = getAttrValues(procurementReferences[i], manager, "SubsequentSettlement");
    purchasingTerms["IndexCompilationForSubsequentSettlementAllowedIndicator"] = getAttrValues(procurementReferences[i], manager, "SubsequentSettlementIndex");
    purchasingTerms["BusinessVolumeComparisonRequiredIndicator"] = getAttrValues(procurementReferences[i], manager, "BusinessVolumesComparisionandAgreement");
    purchasingTerms["DocumentIndexAllowedIndicator"] = getAttrValues(procurementReferences[i], manager, "DocumentIndexActive");
    purchasingTerms["ServiceBasedInvoiceVerificationIndicator"] = getAttrValues(procurementReferences[i], manager, "Service-BasedInvoiceVerification");
    purchasingTerms["CustomsOfficeInternalID"] = getAttrValues(procurementReferences[i], manager, "OfficeOfEntry");
    purchasingTerms["GoodsMovementItemSortCriterionCode"] = getAttrValues(procurementReferences[i], manager, "SortCriterion");
    purchasingTerms["RevaluationAllowedIndicator"] = getAttrValues(procurementReferences[i], manager, "RevaluationAllowed");
    purchasingTerms["DiscountInKindAllowedIndicator"] = getAttrValues(procurementReferences[i], manager, "Grantdiscountinkind/QualifyingforDKd");
    purchasingTerms["RackJobbingIncludedIndicator"] = getAttrValues(procurementReferences[i], manager, "Rack-jobbingServiceAgreed");
    purchasingTerms["PurchaseOrderBySupplierProvidedIndicator"] = getAttrValues(procurementReferences[i], manager, "OrderEntrybyVendor");
    purchasingTerms["SalesVolumeFulfillmentPercent"] = getAttrValues(procurementReferences[i], manager, "VendorServiceLevel");
    purchasingTerms["PurchasingBlockedIndicator"] = getAttrValues(procurementReferences[i], manager, "SelectedPurchasingOrg.Block");
    purchasingTerms["TransportModeCode"] = getRefrenceAttr(procurementReferences[i], manager, "ModeOf TransportAtTheBorder", "ReferenceDataID", false);
    purchasingTerms["PriceSpecificationSupplierGroupCode"] = getRefrenceAttr(procurementReferences[i], manager, "PurchasingOrgDataEntitySchemaGroup", "ReferenceDataID", false);
    purchasingTerms["PriceSpecificationDeterminationDateTypeCode"] = getRefrenceAttr(procurementReferences[i], manager, "PurchasingOrgDataEntityPricingDateCtrl", "ReferenceDataID", false);
    // Implemented as part of Defect ID 17757
    purchasingTerms["BuyerPartySellerID"] = getAttrValues(procurementReferences[i], manager, "AccountwithVendor(Purchasing Data)");
    //Commenting below as part of 18707 - as ReturnItemsEvaluatedReceiptSettlementIndicator cannot be used for 2 STEP fields.
    //purchasingTerms["ReturnItemsEvaluatedReceiptSettlementIndicator"] = getAttrValues(procurementReferences[i], manager, "VendorRMARequired");
    // done by Raghav(  Madan said to remove this as it is failing in T12)
    var ackReq = getAttrValues(procurementReferences[i], manager, "AcknowledgmentRequired");
    if (procurementReferences[i].getValue("AcknowledgmentRequired").getSimpleValue()) {
        if (ackReq == true) {
            purchasingTerms["PurchaseOrderConfirmationRequirementCode"] = "02";
        } else {
            purchasingTerms["PurchaseOrderConfirmationRequirementCode"] = "03";
        }
    } else {
        purchasingTerms["PurchaseOrderConfirmationRequirementCode"] = "";
    }
    //purchasingTerms["PurchaseOrderConfirmationRequirementCode"] = getAttrValues(procurementReferences[i], manager, "AcknowledgmentRequired");
    purchasingTerms["ExpectedPurchasingDocumentItemConfirmationTypeCode"] = getRefrenceAttr(procurementReferences[i], manager, "PurchasingOrgDataEntityConfCtrlKey", "ReferenceDataID", false);
    var incoterms = {};
    //incoterms["TransferLocationName"] = getAttrValues(procurementReferences[i], manager, "IncotermsLocation");
    incoterms["ClassificationCode"] = getRefrenceAttr(procurementReferences[i], manager, "SalesAreaDataEntityIncoterm", "ReferenceDataID", false);
    // Added as part of Defect 17757
    incoterms["Version"] = getAttrValues(procurementReferences[i], manager, "IncotermsVersion");
    // Raghav : added as part of defect 20337
    //incoterms["TransferLocationName"] = getAttrValues(procurementReferences[i], manager, "IncotermsLocation");
    if (getAttrValues(procurementReferences[i], manager, "IncotermsLocation1")) {
        incoterms["TransferLocationName"] = getAttrValues(procurementReferences[i], manager, "IncotermsLocation1");
    } else {
        incoterms["TransferLocationName"] = getAttrValues(procurementReferences[i], manager, "IncotermsLocation");
    }
    incoterms["TransferLocationNameLong"] = getAttrValues(procurementReferences[i], manager, "IncotermsLocation1");
    purchasingTerms["Incoterms"] = incoterms;
    procurementData["PurchasingTerms"] = purchasingTerms;
    procurementData["PartnerFunctions"] = getPartnerFunctionDetails(procurementReferences[i], manager, "OrganisationPurOrgDataEntityPFData");
    procurementData.UPM_Routing = {};
    var routingData = procurementData.UPM_Routing;
    var sourceSystemReferences = [];
    //sourceSystemReferences.push(getRefrenceAttr(procurementReferences[i], manager, "PurchasingOrgDataEntityPurchasingOrg", "ExternalSystemID", false));
    sourceSystemReferences.push(sourceSystem);
    routingData["SourceSystem"] = sourceSystemReferences;
    // Defect ID 21550
    procurementData["PurchasingText"] = getPurchasingTextDcAttributes(procurementReferences[i], manager, "3PPurchasingTextDC");
    // output.push(procurementData);
    //            }
    //        }
    //    }
    // return output;
    return procurementData;
}

function toSetAribaIndicators(purchId, node, manager) {
    var procurementReferencesOrg = getRefMultiValues(node, manager, "CCDataEntityPurchasingOrgDataEntity", null, false);
    var buyingIndicator = false;
    var catalogIndicator = false;
    for (var i = 0; i < procurementReferencesOrg.length; i++) {
        //var flag = true;
        // Getting purchasing organisation entities from node
        var purchIDNode = getRefrenceAttr(procurementReferencesOrg[i], manager, "PurchasingOrgDataEntityPurchasingOrg", "ReferenceDataID", false);
        // Comparing Purchasing org ID from node & purchasing entity
        if (purchId == purchIDNode) {
            if ((getAttrValues(procurementReferencesOrg[i], manager, "AribaBuyingActivationIndicator") == "01")) {
                buyingIndicator = true;
                break;
            }
            if ((getAttrValues(procurementReferencesOrg[i], manager, "AribaCatalogsActivationIndicator") == "01")) {
                catalogIndicator = true;
                break;
            }
        }
    }
    return buyingIndicator + ";" + catalogIndicator;
}



function getPartnerFunctionDetails(node, manager, referenceID) {
    var output = [];
    var referenceType = manager.getReferenceTypeHome().getReferenceTypeByID(referenceID);
    var references = node.queryReferences(referenceType);
    if (references.length === 0) {
        return output;
    }
    references.forEach(function(reference) {
        var targetNode = reference.getTarget();
        var referenceData = {};
        referenceData["UPM_PartnerCounter"] = getAttrValues(targetNode, manager, "PartnerCounter");
        referenceData["PartyRoleCode"] = getRefrenceAttr(targetNode, manager, "PartnerFunctionDataEntityPartnerFunction", "ReferenceDataID", false);
        //referenceData["PartyInternalID"] = getAttrValues(targetNode, manager, "EMVendorNumber");
        //Preethi: 17-Jan-2025 : As discussed with Archana, getting EMVendorNumber from "Reference to vendor" reference
        //referenceData["PartyInternalID"] = getRefrenceAttr(targetNode, manager, "ReferenceToVendor", "EMVendorNumber", false);
        //Preethi : 22-Jan-2025 : After discussing with Mayookh,AB and Archana , dev team is populating Partner Function Data Entity Supplier attribute value with the linked Organisation/Contact Person Vendor Number value.
        referenceData["PartyInternalID"] = (getAttrValues(targetNode, manager, "Supplier")) ? (getAttrValues(targetNode, manager, "Supplier") + "").padStart(10, '0') : "";
        referenceData["DefaultIndicator"] = getAttrValues(targetNode, manager, "DefaultPartner");
        //Commented "PERNR"below as part of Erkki's comments 19299
        referenceData["ReceiverPartyInternalID"] = (getAttrValues(targetNode, manager, "Supplier")) ? (getAttrValues(targetNode, manager, "Supplier") + "").padStart(10, '0') : "";
        //referenceData["ReceiverPartyInternalID"] = getAttrValues(targetNode, manager, "SAP-PERNR");
        //Uncommented and commented ReceiverPartyInternalID as part of defect 20480
        //referenceData["ReceiverPartyInternalID"] = getRefrenceAttr(targetNode, manager, "SalesAreaDataEntityPersonnelNumber", "ReferenceDataID", false);
        //Preethi : 02-Jun-2025 : Added as part of 20480
        referenceData["UPM_PersonnelNumber"] = getAttrValues(targetNode, manager, "SAP-PERNR");
        //Added this as part of 21945
        //21945 Code starts here
        var pfCode = getRefrenceAttr(targetNode, manager, "PartnerFunctionDataEntityPartnerFunction", "ReferenceDataID", false);
        if (pfCode && pfCode == "BA") {
            var vendorrefObj = manager.getReferenceTypeHome().getReferenceTypeByID("ReferenceToVendor");
            var vendorRef = targetNode.queryReferences(vendorrefObj).asList(5);
            if (vendorRef.size() > 0) {
                var referencedToVendor = vendorRef.get(0).getTarget();
                referenceData["UPM_Address"] = {};
                referenceData["UPM_Address"].FirstLineName = getAttrValues(referencedToVendor, manager, "NameLine1");
                referenceData["UPM_Address"].CityName = getSingleDCValues(referencedToVendor, manager, "MainAddressDataContainer", "City");
                referenceData["UPM_Address"].StreetName = getSingleDCValues(referencedToVendor, manager, "MainAddressDataContainer", "StreetConcat");
                referenceData["UPM_Address"].StreetPostalCode = getSingleDCValues(referencedToVendor, manager, "MainAddressDataContainer", "PostalCode");
                var regioncode = getSingleDCValues(referencedToVendor, manager, "MainAddressDataContainer", "Region");
                referenceData["UPM_Address"].RegionCode = regioncode ? regioncode.split('_')[1] + "" : "";
                referenceData["UPM_Address"].CountryCode = getSingleDCValues(referencedToVendor, manager, "MainAddressDataContainer", "Country");
                referenceData["UPM_Address"].TelephoneNumber = getAribaAddressDetails(referencedToVendor, manager, "PhoneDataContainer", "TelephoneNumberNotesDescription", "General", "TelephoneNumber");
                referenceData["UPM_Address"].FacsimileNumber = getAribaAddressDetails(referencedToVendor, manager, "Fax", "FaxNumberNotesDescription", "General", "FaxNumber");
                referenceData["UPM_Address"].EmailAddress = getAribaAddressDetails(referencedToVendor, manager, "EmailDataContainer", "EmailNotesDescription", "Ariba", "EmailAddress");
            } else {
                referenceData["UPM_Address"] = {};
                referenceData["UPM_Address"].FirstLineName = "";
                referenceData["UPM_Address"].CityName = "";
                referenceData["UPM_Address"].StreetName = "";
                referenceData["UPM_Address"].StreetPostalCode = "";
                referenceData["UPM_Address"].RegionCode = "";
                referenceData["UPM_Address"].CountryCode = "";
                referenceData["UPM_Address"].TelephoneNumber = "";
                referenceData["UPM_Address"].FacsimileNumber = "";
                referenceData["UPM_Address"].EmailAddress = "";
            }
        }
        //21945 Code ends here
        output.push(referenceData);
        //Added as part of defect 21579
        //21579 code starts here
        var removedPartner = targetNode.getValue("SupplierPFRemovedPartnerRef").getSimpleValue();
        var removedPartnerORG = targetNode.getValue("SupplierPFRemovedPartnerORG").getSimpleValue();
        if (removedPartner) {
            var referenceData = {};
            referenceData["UPM_DeletedIndicator"] = true;
            referenceData["UPM_PartnerCounter"] = getAttrValues(targetNode, manager, "PartnerCounter");
            referenceData["PartyRoleCode"] = getRefrenceAttr(targetNode, manager, "PartnerFunctionDataEntityPartnerFunction", "ReferenceDataID", false);
            referenceData["PartyInternalID"] = (getAttrValues(targetNode, manager, "SupplierPFRemovedPartnerRef")) ? (getAttrValues(targetNode, manager, "SupplierPFRemovedPartnerRef") + "").padStart(10, '0') : "";
            referenceData["DefaultIndicator"] = getAttrValues(targetNode, manager, "DefaultPartner");
            referenceData["ReceiverPartyInternalID"] = (getAttrValues(targetNode, manager, "SupplierPFRemovedPartnerRef")) ? (getAttrValues(targetNode, manager, "SupplierPFRemovedPartnerRef") + "").padStart(10, '0') : "";
            referenceData["UPM_PersonnelNumber"] = getAttrValues(targetNode, manager, "SAP-PERNR");
            var pfCode = getRefrenceAttr(targetNode, manager, "PartnerFunctionDataEntityPartnerFunction", "ReferenceDataID", false);
            if (pfCode && pfCode == "BA") {
                var removedPartnerEntity = manager.getEntityHome().getEntityByID(removedPartnerORG);
                if (removedPartnerEntity) {
                    var referencedToVendor = removedPartnerEntity;
                    referenceData["UPM_Address"] = {};
                    referenceData["UPM_Address"].FirstLineName = getAttrValues(referencedToVendor, manager, "NameLine1");
                    referenceData["UPM_Address"].CityName = getSingleDCValues(referencedToVendor, manager, "MainAddressDataContainer", "City");
                    referenceData["UPM_Address"].StreetName = getSingleDCValues(referencedToVendor, manager, "MainAddressDataContainer", "StreetConcat");
                    referenceData["UPM_Address"].StreetPostalCode = getSingleDCValues(referencedToVendor, manager, "MainAddressDataContainer", "PostalCode");
                    var regioncode = getSingleDCValues(referencedToVendor, manager, "MainAddressDataContainer", "Region");
                    referenceData["UPM_Address"].RegionCode = regioncode ? regioncode.split('_')[1] + "" : "";
                    referenceData["UPM_Address"].CountryCode = getSingleDCValues(referencedToVendor, manager, "MainAddressDataContainer", "Country");
                    referenceData["UPM_Address"].TelephoneNumber = getAribaAddressDetails(referencedToVendor, manager, "PhoneDataContainer", "TelephoneNumberNotesDescription", "General", "TelephoneNumber");
                    referenceData["UPM_Address"].FacsimileNumber = getAribaAddressDetails(referencedToVendor, manager, "Fax", "FaxNumberNotesDescription", "General", "FaxNumber");
                    referenceData["UPM_Address"].EmailAddress = getAribaAddressDetails(referencedToVendor, manager, "EmailDataContainer", "EmailNotesDescription", "Ariba", "EmailAddress");
                } else {
                    referenceData["UPM_Address"] = {};
                    referenceData["UPM_Address"].FirstLineName = "";
                    referenceData["UPM_Address"].CityName = "";
                    referenceData["UPM_Address"].StreetName = "";
                    referenceData["UPM_Address"].StreetPostalCode = "";
                    referenceData["UPM_Address"].RegionCode = "";
                    referenceData["UPM_Address"].CountryCode = "";
                    referenceData["UPM_Address"].TelephoneNumber = "";
                    referenceData["UPM_Address"].FacsimileNumber = "";
                    referenceData["UPM_Address"].EmailAddress = "";
                }
            }
            output.push(referenceData);
        }
        //21579 code ends here
        return true;
    });
    //Added as part of defect 21579
    // 21579 Code starts here
    var removedPartnerFunctions = node.getValue("RemovedPartnerFunction").getSimpleValue();
    if (removedPartnerFunctions) {
        var removedPartnerFunctionsList = removedPartnerFunctions.split(",");
        for (var k = 0; k < removedPartnerFunctionsList.length; k++) {
            var removedPFEntity = manager.getEntityHome().getEntityByID(removedPartnerFunctionsList[k]);
            if (removedPFEntity) {
                var referenceData = {};
                referenceData["UPM_DeletedIndicator"] = true;
                referenceData["UPM_PartnerCounter"] = getAttrValues(removedPFEntity, manager, "PartnerCounter");
                referenceData["PartyRoleCode"] = getRefrenceAttr(removedPFEntity, manager, "PartnerFunctionDataEntityPartnerFunction", "ReferenceDataID", false);
                referenceData["PartyInternalID"] = (getAttrValues(removedPFEntity, manager, "Supplier")) ? (getAttrValues(removedPFEntity, manager, "Supplier") + "").padStart(10, '0') : "";
                referenceData["DefaultIndicator"] = getAttrValues(removedPFEntity, manager, "DefaultPartner");
                referenceData["ReceiverPartyInternalID"] = (getAttrValues(removedPFEntity, manager, "Supplier")) ? (getAttrValues(removedPFEntity, manager, "Supplier") + "").padStart(10, '0') : "";
                referenceData["UPM_PersonnelNumber"] = getAttrValues(removedPFEntity, manager, "SAP-PERNR");
                var pfCode = getRefrenceAttr(removedPFEntity, manager, "PartnerFunctionDataEntityPartnerFunction", "ReferenceDataID", false);
                if (pfCode && pfCode == "BA") {
                    var vendorrefObj = manager.getReferenceTypeHome().getReferenceTypeByID("ReferenceToVendor");
                    var vendorRef = removedPFEntity.queryReferences(vendorrefObj).asList(5);
                    if (vendorRef.size() > 0) {
                        var referencedToVendor = vendorRef.get(0).getTarget();
                        referenceData["UPM_Address"] = {};
                        referenceData["UPM_Address"].FirstLineName = getAttrValues(referencedToVendor, manager, "NameLine1");
                        referenceData["UPM_Address"].CityName = getSingleDCValues(referencedToVendor, manager, "MainAddressDataContainer", "City");
                        referenceData["UPM_Address"].StreetName = getSingleDCValues(referencedToVendor, manager, "MainAddressDataContainer", "StreetConcat");
                        referenceData["UPM_Address"].StreetPostalCode = getSingleDCValues(referencedToVendor, manager, "MainAddressDataContainer", "PostalCode");
                        var regioncode = getSingleDCValues(referencedToVendor, manager, "MainAddressDataContainer", "Region");
                        referenceData["UPM_Address"].RegionCode = regioncode ? regioncode.split('_')[1] + "" : "";
                        referenceData["UPM_Address"].CountryCode = getSingleDCValues(referencedToVendor, manager, "MainAddressDataContainer", "Country");
                        referenceData["UPM_Address"].TelephoneNumber = getAribaAddressDetails(referencedToVendor, manager, "PhoneDataContainer", "TelephoneNumberNotesDescription", "General", "TelephoneNumber");
                        referenceData["UPM_Address"].FacsimileNumber = getAribaAddressDetails(referencedToVendor, manager, "Fax", "FaxNumberNotesDescription", "General", "FaxNumber");
                        referenceData["UPM_Address"].EmailAddress = getAribaAddressDetails(referencedToVendor, manager, "EmailDataContainer", "EmailNotesDescription", "Ariba", "EmailAddress");
                    } else {
                        referenceData["UPM_Address"] = {};
                        referenceData["UPM_Address"].FirstLineName = "";
                        referenceData["UPM_Address"].CityName = "";
                        referenceData["UPM_Address"].StreetName = "";
                        referenceData["UPM_Address"].StreetPostalCode = "";
                        referenceData["UPM_Address"].RegionCode = "";
                        referenceData["UPM_Address"].CountryCode = "";
                        referenceData["UPM_Address"].TelephoneNumber = "";
                        referenceData["UPM_Address"].FacsimileNumber = "";
                        referenceData["UPM_Address"].EmailAddress = "";
                    }
                }
                output.push(referenceData);
            }
        }
    }
    // 21579 Code ends here
    //Added 2 lines below as part of defect 20480
    var result = output.length ? output.filter(x => x["PartyRoleCode"] !== "AP").concat(output.filter(x => x["PartyRoleCode"] === "AP")) : [];
    return result;
}
function getAlternateBankAttributes(node, manager, dcID) {
    var output = [];
    var referenceType = manager.getReferenceTypeHome().getReferenceTypeByID("AlternativePayee");
    var references = node.queryReferences(referenceType).asList(2);
    if (references.size() != 0) {
        var target = references.get(0).getTarget();
        // Added this to know about customer or supplier data coin.i
        var attrVal = "";
        var flag = "";
        var customerRole = false;
        var vendorRole = false;
        var splitJSON = false;
        var workflowIndicator = "";
        var bpRole = target.getValue("BPRoleTech").getValues();
        for (var i = 0; i < bpRole.size(); i++) {
            if (bpRole.get(i).getValue() == "Customer") {
                customerRole = true;
            }
            if (bpRole.get(i).getValue() == "Vendor") {
                vendorRole = true;
            }
        }
        if (customerRole == true && vendorRole == true) {
            var custaccgrp = getRefrenceAttr(node, manager, "SAPCustomerAccountGroup", "AccountGroupID", false);
            var supaccgrp = getRefrenceAttr(node, manager, "SAPSupplierAccountGroup", "AccountGroupID", false);
            if (custaccgrp == "ZTPY" && supaccgrp == "ZTPY") {
                splitJSON = true;
            }
        }
        workflowIndicator = node.getValue("WorkflowIndicator").getSimpleValue();
        if (customerRole == true && vendorRole == false) {
            attrVal = checkInternalId(target, manager, "EMCustomerNumber");
            flag = "Customer";
        } else if ((customerRole == true && vendorRole == true) || (vendorRole == true && customerRole == false)) {
            if (splitJSON == true && workflowIndicator == "Customer" && customerRole == true && vendorRole == true) {
                attrVal = checkInternalId(target, manager, "EMCustomerNumber");
                flag = "Customer";
            } else if (splitJSON == true && workflowIndicator == "Vendor" && customerRole == true && vendorRole == true) {
                attrVal = checkInternalId(target, manager, "EMVendorNumber");
                flag = "Supplier";
            } else {
                attrVal = checkInternalId(target, manager, "EMVendorNumber");
                flag = "Supplier";
            }
        }
        var dataContainers = "";
        if (flag == "Supplier")
            dataContainers = target.getDataContainerByTypeID("OrganisationSupplierBankAccount").getDataContainers();
        else if (flag == "Customer")
            dataContainers = target.getDataContainerByTypeID("OrganisationCustomerBankAccount").getDataContainers();
        if (dataContainers != "" && dataContainers.size() !== 0) {
            var iterator = dataContainers.iterator();
            while (iterator.hasNext()) {
                var currentRecord = {};
                var dataContainerObject = iterator.next().getDataContainerObject();
                currentRecord["ID"] = getAttrValues(dataContainerObject, manager, "PartnerBankType");
                currentRecord["BankAccountID"] = getAttrValues(dataContainerObject, manager, "SAP-BANKN");
                currentRecord["BankAccountStandardID"] = getAttrValues(dataContainerObject, manager, "SAP-IBAN");
                output.push(currentRecord);
            }
        }
    }
    return output;
}
function getPermittedPayeeBankDetails(node, manager, dcID, refId) {
    var output = [];
    var refObj = manager.getReferenceTypeHome().getReferenceTypeByID("PermittedPayee");
    var references = node.queryReferences(refObj);
    if (node.queryReferences(refObj).asList(5).size() == 0) {
        return output;
    }
    references.forEach(function(reference) {
        var target = reference.getTarget();
        // added
        var attrVal = "";
        var flag = "";
        var customerRole = false;
        var vendorRole = false;
        var splitJSON = false;
        var workflowIndicator = "";
        var bpRole = target.getValue("BPRoleTech").getValues();
        for (var i = 0; i < bpRole.size(); i++) {
            if (bpRole.get(i).getValue() == "Customer") {
                customerRole = true;
            }
            if (bpRole.get(i).getValue() == "Vendor") {
                vendorRole = true;
            }
        }
        if (customerRole == true && vendorRole == true) {
            var custaccgrp = getRefrenceAttr(node, manager, "SAPCustomerAccountGroup", "AccountGroupID", false);
            var supaccgrp = getRefrenceAttr(node, manager, "SAPSupplierAccountGroup", "AccountGroupID", false);
            if (custaccgrp == "ZTPY" && supaccgrp == "ZTPY") {
                splitJSON = true;
            }
        }
        workflowIndicator = node.getValue("WorkflowIndicator").getSimpleValue();
        if (customerRole == true && vendorRole == false) {
            attrVal = checkInternalId(target, manager, "EMCustomerNumber");
            flag = "Customer";
        } else if ((customerRole == true && vendorRole == true) || (vendorRole == true && customerRole == false)) {
            if (splitJSON == true && workflowIndicator == "Customer" && customerRole == true && vendorRole == true) {
                attrVal = checkInternalId(target, manager, "EMCustomerNumber");
                flag = "Customer";
            } else if (splitJSON == true && workflowIndicator == "Vendor" && customerRole == true && vendorRole == true) {
                attrVal = checkInternalId(target, manager, "EMVendorNumber");
                flag = "Supplier"
            } else {
                attrVal = checkInternalId(target, manager, "EMVendorNumber");
                flag = "Supplier"
            }
        }
        var dataContainers = "";
        if (flag == "Supplier")
            dataContainers = target.getDataContainerByTypeID("OrganisationSupplierBankAccount").getDataContainers();
        else if (flag == "Customer")
            dataContainers = target.getDataContainerByTypeID("OrganisationCustomerBankAccount").getDataContainers();
        var permittedPayee = {};
        if (attrVal) {
            permittedPayee["PermittedPayeeInternalID"] = attrVal;
            permittedPayee["PermittedPayeeBankDetails"] = [];
            if (dataContainers != "" && dataContainers.size() !== 0) {
                var iterator = dataContainers.iterator();
                while (iterator.hasNext()) {
                    var dataContainerObject = iterator.next().getDataContainerObject();
                    var bankDetail = {};
                    bankDetail["ID"] = getAttrValues(dataContainerObject, manager, "PartnerBankType");
                    bankDetail["BankAccountID"] = getAttrValues(dataContainerObject, manager, "SAP-BANKN");
                    bankDetail["BankAccountStandardID"] = getAttrValues(dataContainerObject, manager, "SAP-IBAN");
                    permittedPayee["PermittedPayeeBankDetails"].push(bankDetail);
                }
            }
            output.push(permittedPayee);
        }
        return true;
    });
    return output;
}
function unloadingPoints(node, manager) {
    var output = [];
    var refObj = manager.getReferenceTypeHome().getReferenceTypeByID("OrganisationCustBusinessAreaDataEntity");
    if (node.queryReferences(refObj).asList(5).size() != 0) {
        var reference = node.queryReferences(refObj);
        reference.forEach(function(re) {
            var target = re.getTarget();
            var businessArea = getRefrenceAttr(target, manager, "SAPBusinessAreaDataEntityBusinessArea", "ReferenceDataID", false);
            var unloadingPoint = getRefMultiValues(target, manager, "SAPCustBADataEntityUnldPointDataEntity", null, false);
            for (j = 0; j < unloadingPoint.length; j++) {
                var currentRec = {};
                var unloadingPointName = getAttrValues(unloadingPoint[j], manager, "UnloadingPoint");
                if (businessArea && unloadingPointName) {
                    currentRec["UPM_BusinessArea"] = businessArea;
                    currentRec["UnloadingPointName"] = getAttrValues(unloadingPoint[j], manager, "UnloadingPoint");
                    //currentRec["DefaultIndicator"] = getAttrValues(target, manager, "DefaultUnloadingPoint");
                    //added as part of 21143 - fetch default indicator from unloading point and not from business area
                    currentRec["DefaultIndicator"] = getAttrValues(unloadingPoint[j], manager, "DefaultUnloadingPoint");
                    //Preethi : 24-feb-2025 : Defect - 17863 : As discussed with Ratna, commented the lined below. need to send the data irrespective of MaintainGoodsReceivingHoursManually 
                    /* var goodsFlag = getAttrValues(unloadingPoint[j], manager, "MaintainGoodsReceivingHoursManually");
                     if (goodsFlag === false) {
                         currentRec["GoodsReceivingHoursID"] = getRefrenceAttr(unloadingPoint[j], manager, "UnloadingPointDataEntityGdRchFoundData", "ReferenceDataID", false);
                     } else {
                         currentRec["GoodsReceivingHoursID"] = "";
                     }*/
                    var rcvngHrsID = getRefrenceAttr(unloadingPoint[j], manager, "UnloadingPointDataEntityGdRchFoundData", "ReferenceDataID", false);
                    currentRec["GoodsReceivingHoursID"] = rcvngHrsID ? rcvngHrsID : "";
                    var businessHrs = {};
                    var calender = getRefrenceAttr(unloadingPoint[j], manager, "SAPOrgUnloadingPointDataCalendarKey", "ReferenceDataID", false);
                    var externalID = getRefrenceAttr(unloadingPoint[j], manager, "SAPOrgUnloadingPointDataCalendarKey", "ExternalSystemID", false)
                    //if (externalID == "SellIT") {commented for the defect 19986
                    if (calender) { //Preethi : 11/Jun/2025 : Added this if else condition as it is getting populated as undefined
                        businessHrs.FactoryCalenderCode = calender.split('_')[1] + "";
                    } else {
                        businessHrs.FactoryCalenderCode = "";
                    }
                    //} else {commented for the defect 19986
                    //businessHrs.FactoryCalenderCode = calender;commented for the defect 19986
                    //}commented for the defect 19986
                    var mondayFlag = false;
                    var tuesdayFlag = false;
                    var wednesdayFlag = false;
                    var thursdayFlag = false;
                    var fridayFlag = false;
                    var saturdayFlag = false;
                    var sundayFlag = false;
                    var unloadingrefObj = manager.getReferenceTypeHome().getReferenceTypeByID("UnloadingPointDataEntityGdRchDataEntity");
                    var unloadingref = unloadingPoint[j].queryReferences(unloadingrefObj);
                    unloadingref.forEach(function(upre) {
                        var goodsTarget = upre.getTarget();
                        var GoodstargetName = upre.getTarget().getName();
                        if (GoodstargetName != null) {
                            if (GoodstargetName.equalsIgnoreCase("MON") || GoodstargetName.equalsIgnoreCase("MONDAY")) {
                                mondayFlag = true;
                                businessHrs.MondayAMStartTime = deliveryHours(goodsTarget, manager, "MorningOpeningTime");
                                businessHrs.MondayAMEndTime = deliveryHours(goodsTarget, manager, "MorningClosingTime");
                                businessHrs.MondayPMStartTime = deliveryHours(goodsTarget, manager, "AfternoonOpeningTime");
                                businessHrs.MondayPMEndTime = deliveryHours(goodsTarget, manager, "AfternoonClosingTime");
                            } else if (GoodstargetName.equalsIgnoreCase("TUE") || GoodstargetName.equalsIgnoreCase("TUESDAY")) {
                                tuesdayFlag = true;
                                businessHrs.TuesdayAMStartTime = deliveryHours(goodsTarget, manager, "MorningOpeningTime");
                                businessHrs.TuesdayAMEndTime = deliveryHours(goodsTarget, manager, "MorningClosingTime");
                                businessHrs.TuesdayPMStartTime = deliveryHours(goodsTarget, manager, "AfternoonOpeningTime");
                                businessHrs.TuesdayPMEndTime = deliveryHours(goodsTarget, manager, "AfternoonClosingTime");
                            } else if (GoodstargetName.equalsIgnoreCase("WED") || GoodstargetName.equalsIgnoreCase("WEDNESDAY")) {
                                wednesdayFlag = true;
                                businessHrs.WednesdayAMStartTime = deliveryHours(goodsTarget, manager, "MorningOpeningTime");
                                businessHrs.WednesdayAMEndTime = deliveryHours(goodsTarget, manager, "MorningClosingTime");
                                businessHrs.WednesdayPMStartTime = deliveryHours(goodsTarget, manager, "AfternoonOpeningTime");
                                businessHrs.WednesdayPMEndTime = deliveryHours(goodsTarget, manager, "AfternoonClosingTime");
                            } else if (GoodstargetName.equalsIgnoreCase("THU") || GoodstargetName.equalsIgnoreCase("THURSDAY")) {
                                thursdayFlag = true;
                                businessHrs.ThursdayAMStartTime = deliveryHours(goodsTarget, manager, "MorningOpeningTime");
                                businessHrs.ThursdayAMEndTime = deliveryHours(goodsTarget, manager, "MorningClosingTime");
                                businessHrs.ThursdayPMStartTime = deliveryHours(goodsTarget, manager, "AfternoonOpeningTime");
                                businessHrs.ThursdayPMEndTime = deliveryHours(goodsTarget, manager, "AfternoonClosingTime");
                            } else if (GoodstargetName.equalsIgnoreCase("FRI") || GoodstargetName.equalsIgnoreCase("FRIDAY")) {
                                fridayFlag = true;
                                businessHrs.FridayAMStartTime = deliveryHours(goodsTarget, manager, "MorningOpeningTime");
                                businessHrs.FridayAMEndTime = deliveryHours(goodsTarget, manager, "MorningClosingTime");
                                businessHrs.FridayPMStartTime = deliveryHours(goodsTarget, manager, "AfternoonOpeningTime");
                                businessHrs.FridayPMEndTime = deliveryHours(goodsTarget, manager, "AfternoonClosingTime");
                            } else if (GoodstargetName.equalsIgnoreCase("SAT") || GoodstargetName.equalsIgnoreCase("SATURDAY")) {
                                saturdayFlag = true;
                                businessHrs.SaturdayAMStartTime = deliveryHours(goodsTarget, manager, "MorningOpeningTime");
                                businessHrs.SaturdayAMEndTime = deliveryHours(goodsTarget, manager, "MorningClosingTime");
                                businessHrs.SaturdayPMStartTime = deliveryHours(goodsTarget, manager, "AfternoonOpeningTime");
                                businessHrs.SaturdayPMEndTime = deliveryHours(goodsTarget, manager, "AfternoonClosingTime");
                            } else if (GoodstargetName.equalsIgnoreCase("SUN") || GoodstargetName.equalsIgnoreCase("SUNDAY")) {
                                sundayFlag = true;
                                businessHrs.SundayAMStartTime = deliveryHours(goodsTarget, manager, "MorningOpeningTime");
                                businessHrs.SundayAMEndTime = deliveryHours(goodsTarget, manager, "MorningClosingTime");
                                businessHrs.SundayPMStartTime = deliveryHours(goodsTarget, manager, "AfternoonOpeningTime");
                                businessHrs.SundayPMEndTime = deliveryHours(goodsTarget, manager, "AfternoonClosingTime");
                            }
                        }
                        return true;
                    });
                    if (unloadingPoint[j].queryReferences(unloadingrefObj).asList(5).size() == 0) {
                        businessHrs.MondayAMStartTime = "",
                            businessHrs.MondayAMEndTime = "",
                            businessHrs.MondayPMStartTime = "",
                            businessHrs.MondayPMEndTime = "",
                            businessHrs.TuesdayAMStartTime = "",
                            businessHrs.TuesdayAMEndTime = "",
                            businessHrs.TuesdayPMStartTime = "",
                            businessHrs.TuesdayPMEndTime = "",
                            businessHrs.WednesdayAMStartTime = "",
                            businessHrs.WednesdayAMEndTime = "",
                            businessHrs.WednesdayPMStartTime = "",
                            businessHrs.WednesdayPMEndTime = "",
                            businessHrs.ThursdayAMStartTime = "",
                            businessHrs.ThursdayAMEndTime = "",
                            businessHrs.ThursdayPMStartTime = "",
                            businessHrs.ThursdayPMEndTime = "",
                            businessHrs.FridayAMStartTime = "",
                            businessHrs.FridayAMEndTime = "",
                            businessHrs.FridayPMStartTime = "",
                            businessHrs.FridayPMEndTime = "",
                            businessHrs.SaturdayAMStartTime = "",
                            businessHrs.SaturdayAMEndTime = "",
                            businessHrs.SaturdayPMStartTime = "",
                            businessHrs.SaturdayPMEndTime = "",
                            businessHrs.SundayAMStartTime = "",
                            businessHrs.SundayAMEndTime = "",
                            businessHrs.SundayPMStartTime = "",
                            businessHrs.SundayPMEndTime = "";
                    } else if (unloadingPoint[j].queryReferences(unloadingrefObj).asList(5).size() != 0) {
                        if (mondayFlag == false) {
                            businessHrs.MondayAMStartTime = "",
                                businessHrs.MondayAMEndTime = "",
                                businessHrs.MondayPMStartTime = "",
                                businessHrs.MondayPMEndTime = "";
                        }
                        if (tuesdayFlag == false) {
                            businessHrs.TuesdayAMStartTime = "",
                                businessHrs.TuesdayAMEndTime = "",
                                businessHrs.TuesdayPMStartTime = "",
                                businessHrs.TuesdayPMEndTime = "";
                        }
                        if (wednesdayFlag == false) {
                            businessHrs.WednesdayAMStartTime = "",
                                businessHrs.WednesdayAMEndTime = "",
                                businessHrs.WednesdayPMStartTime = "",
                                businessHrs.WednesdayPMEndTime = "";
                        }
                        if (thursdayFlag == false) {
                            businessHrs.ThursdayAMStartTime = "",
                                businessHrs.ThursdayAMEndTime = "",
                                businessHrs.ThursdayPMStartTime = "",
                                businessHrs.ThursdayPMEndTime = "";
                        }
                        if (fridayFlag == false) {
                            businessHrs.FridayAMStartTime = "",
                                businessHrs.FridayAMEndTime = "",
                                businessHrs.FridayPMStartTime = "",
                                businessHrs.FridayPMEndTime = "";
                        }
                        if (saturdayFlag == false) {
                            businessHrs.SaturdayAMStartTime = "",
                                businessHrs.SaturdayAMEndTime = "",
                                businessHrs.SaturdayPMStartTime = "",
                                businessHrs.SaturdayPMEndTime = "";
                        }
                        if (sundayFlag == false) {
                            businessHrs.SundayAMStartTime = "",
                                businessHrs.SundayAMEndTime = "",
                                businessHrs.SundayPMStartTime = "",
                                businessHrs.SundayPMEndTime = "";
                        }
                    }
                    currentRec["BusinessHours"] = businessHrs;
                    output.push(currentRec);
                }
            }
            //Added as part of 21143 - Removal of approved unloading points
            //Code starts here
            var removedunloadingPoints = target.getValue("RemovedUnloadingPoints").getSimpleValue();
            if (removedunloadingPoints) {
                var removedunloadingPointsList = removedunloadingPoints.split(",");
                for (var k = 0; k < removedunloadingPointsList.length; k++) {
                    var removedUnloadingPoint = manager.getEntityHome().getEntityByID(removedunloadingPointsList[k]);
                    var currentRec = {};
                    var removedunloadingPointName = getAttrValues(removedUnloadingPoint, manager, "UnloadingPoint");
                    if (businessArea && removedunloadingPointName) {
                        currentRec["UPM_BusinessArea"] = businessArea;
                        currentRec["UPM_DeletedIndicator"] = true;
                        currentRec["UnloadingPointName"] = getAttrValues(removedUnloadingPoint, manager, "UnloadingPoint");
                        currentRec["DefaultIndicator"] = getAttrValues(removedUnloadingPoint, manager, "DefaultUnloadingPoint");
                        var rcvngHrsID = getRefrenceAttr(removedUnloadingPoint, manager, "UnloadingPointDataEntityGdRchFoundData", "ReferenceDataID", false);
                        currentRec["GoodsReceivingHoursID"] = rcvngHrsID ? rcvngHrsID : "";
                        var businessHrs = {};
                        var calender = getRefrenceAttr(removedUnloadingPoint, manager, "SAPOrgUnloadingPointDataCalendarKey", "ReferenceDataID", false);
                        var externalID = getRefrenceAttr(removedUnloadingPoint, manager, "SAPOrgUnloadingPointDataCalendarKey", "ExternalSystemID", false);
                        if (calender) {
                            businessHrs.FactoryCalenderCode = calender.split('_')[1] + "";
                        } else {
                            businessHrs.FactoryCalenderCode = "";
                        }
                        var mondayFlag = false;
                        var tuesdayFlag = false;
                        var wednesdayFlag = false;
                        var thursdayFlag = false;
                        var fridayFlag = false;
                        var saturdayFlag = false;
                        var sundayFlag = false;
                        var unloadingrefObj = manager.getReferenceTypeHome().getReferenceTypeByID("UnloadingPointDataEntityGdRchDataEntity");
                        var unloadingref = removedUnloadingPoint.queryReferences(unloadingrefObj);
                        unloadingref.forEach(function(upre) {
                            var goodsTarget = upre.getTarget();
                            var GoodstargetName = upre.getTarget().getName();
                            if (GoodstargetName != null) {
                                if (GoodstargetName.equalsIgnoreCase("MON") || GoodstargetName.equalsIgnoreCase("MONDAY")) {
                                    mondayFlag = true;
                                    businessHrs.MondayAMStartTime = deliveryHours(goodsTarget, manager, "MorningOpeningTime");
                                    businessHrs.MondayAMEndTime = deliveryHours(goodsTarget, manager, "MorningClosingTime");
                                    businessHrs.MondayPMStartTime = deliveryHours(goodsTarget, manager, "AfternoonOpeningTime");
                                    businessHrs.MondayPMEndTime = deliveryHours(goodsTarget, manager, "AfternoonClosingTime");
                                } else if (GoodstargetName.equalsIgnoreCase("TUE") || GoodstargetName.equalsIgnoreCase("TUESDAY")) {
                                    tuesdayFlag = true;
                                    businessHrs.TuesdayAMStartTime = deliveryHours(goodsTarget, manager, "MorningOpeningTime");
                                    businessHrs.TuesdayAMEndTime = deliveryHours(goodsTarget, manager, "MorningClosingTime");
                                    businessHrs.TuesdayPMStartTime = deliveryHours(goodsTarget, manager, "AfternoonOpeningTime");
                                    businessHrs.TuesdayPMEndTime = deliveryHours(goodsTarget, manager, "AfternoonClosingTime");
                                } else if (GoodstargetName.equalsIgnoreCase("WED") || GoodstargetName.equalsIgnoreCase("WEDNESDAY")) {
                                    wednesdayFlag = true;
                                    businessHrs.WednesdayAMStartTime = deliveryHours(goodsTarget, manager, "MorningOpeningTime");
                                    businessHrs.WednesdayAMEndTime = deliveryHours(goodsTarget, manager, "MorningClosingTime");
                                    businessHrs.WednesdayPMStartTime = deliveryHours(goodsTarget, manager, "AfternoonOpeningTime");
                                    businessHrs.WednesdayPMEndTime = deliveryHours(goodsTarget, manager, "AfternoonClosingTime");
                                } else if (GoodstargetName.equalsIgnoreCase("THU") || GoodstargetName.equalsIgnoreCase("THURSDAY")) {
                                    thursdayFlag = true;
                                    businessHrs.ThursdayAMStartTime = deliveryHours(goodsTarget, manager, "MorningOpeningTime");
                                    businessHrs.ThursdayAMEndTime = deliveryHours(goodsTarget, manager, "MorningClosingTime");
                                    businessHrs.ThursdayPMStartTime = deliveryHours(goodsTarget, manager, "AfternoonOpeningTime");
                                    businessHrs.ThursdayPMEndTime = deliveryHours(goodsTarget, manager, "AfternoonClosingTime");
                                } else if (GoodstargetName.equalsIgnoreCase("FRI") || GoodstargetName.equalsIgnoreCase("FRIDAY")) {
                                    fridayFlag = true;
                                    businessHrs.FridayAMStartTime = deliveryHours(goodsTarget, manager, "MorningOpeningTime");
                                    businessHrs.FridayAMEndTime = deliveryHours(goodsTarget, manager, "MorningClosingTime");
                                    businessHrs.FridayPMStartTime = deliveryHours(goodsTarget, manager, "AfternoonOpeningTime");
                                    businessHrs.FridayPMEndTime = deliveryHours(goodsTarget, manager, "AfternoonClosingTime");
                                } else if (GoodstargetName.equalsIgnoreCase("SAT") || GoodstargetName.equalsIgnoreCase("SATURDAY")) {
                                    saturdayFlag = true;
                                    businessHrs.SaturdayAMStartTime = deliveryHours(goodsTarget, manager, "MorningOpeningTime");
                                    businessHrs.SaturdayAMEndTime = deliveryHours(goodsTarget, manager, "MorningClosingTime");
                                    businessHrs.SaturdayPMStartTime = deliveryHours(goodsTarget, manager, "AfternoonOpeningTime");
                                    businessHrs.SaturdayPMEndTime = deliveryHours(goodsTarget, manager, "AfternoonClosingTime");
                                } else if (GoodstargetName.equalsIgnoreCase("SUN") || GoodstargetName.equalsIgnoreCase("SUNDAY")) {
                                    sundayFlag = true;
                                    businessHrs.SundayAMStartTime = deliveryHours(goodsTarget, manager, "MorningOpeningTime");
                                    businessHrs.SundayAMEndTime = deliveryHours(goodsTarget, manager, "MorningClosingTime");
                                    businessHrs.SundayPMStartTime = deliveryHours(goodsTarget, manager, "AfternoonOpeningTime");
                                    businessHrs.SundayPMEndTime = deliveryHours(goodsTarget, manager, "AfternoonClosingTime");
                                }
                            }
                            return true;
                        });
                        if (removedUnloadingPoint.queryReferences(unloadingrefObj).asList(5).size() == 0) {
                            businessHrs.MondayAMStartTime = "",
                                businessHrs.MondayAMEndTime = "",
                                businessHrs.MondayPMStartTime = "",
                                businessHrs.MondayPMEndTime = "",
                                businessHrs.TuesdayAMStartTime = "",
                                businessHrs.TuesdayAMEndTime = "",
                                businessHrs.TuesdayPMStartTime = "",
                                businessHrs.TuesdayPMEndTime = "",
                                businessHrs.WednesdayAMStartTime = "",
                                businessHrs.WednesdayAMEndTime = "",
                                businessHrs.WednesdayPMStartTime = "",
                                businessHrs.WednesdayPMEndTime = "",
                                businessHrs.ThursdayAMStartTime = "",
                                businessHrs.ThursdayAMEndTime = "",
                                businessHrs.ThursdayPMStartTime = "",
                                businessHrs.ThursdayPMEndTime = "",
                                businessHrs.FridayAMStartTime = "",
                                businessHrs.FridayAMEndTime = "",
                                businessHrs.FridayPMStartTime = "",
                                businessHrs.FridayPMEndTime = "",
                                businessHrs.SaturdayAMStartTime = "",
                                businessHrs.SaturdayAMEndTime = "",
                                businessHrs.SaturdayPMStartTime = "",
                                businessHrs.SaturdayPMEndTime = "",
                                businessHrs.SundayAMStartTime = "",
                                businessHrs.SundayAMEndTime = "",
                                businessHrs.SundayPMStartTime = "",
                                businessHrs.SundayPMEndTime = "";
                        } else if (removedUnloadingPoint.queryReferences(unloadingrefObj).asList(5).size() != 0) {
                            if (mondayFlag == false) {
                                businessHrs.MondayAMStartTime = "",
                                    businessHrs.MondayAMEndTime = "",
                                    businessHrs.MondayPMStartTime = "",
                                    businessHrs.MondayPMEndTime = "";
                            }
                            if (tuesdayFlag == false) {
                                businessHrs.TuesdayAMStartTime = "",
                                    businessHrs.TuesdayAMEndTime = "",
                                    businessHrs.TuesdayPMStartTime = "",
                                    businessHrs.TuesdayPMEndTime = "";
                            }
                            if (wednesdayFlag == false) {
                                businessHrs.WednesdayAMStartTime = "",
                                    businessHrs.WednesdayAMEndTime = "",
                                    businessHrs.WednesdayPMStartTime = "",
                                    businessHrs.WednesdayPMEndTime = "";
                            }
                            if (thursdayFlag == false) {
                                businessHrs.ThursdayAMStartTime = "",
                                    businessHrs.ThursdayAMEndTime = "",
                                    businessHrs.ThursdayPMStartTime = "",
                                    businessHrs.ThursdayPMEndTime = "";
                            }
                            if (fridayFlag == false) {
                                businessHrs.FridayAMStartTime = "",
                                    businessHrs.FridayAMEndTime = "",
                                    businessHrs.FridayPMStartTime = "",
                                    businessHrs.FridayPMEndTime = "";
                            }
                            if (saturdayFlag == false) {
                                businessHrs.SaturdayAMStartTime = "",
                                    businessHrs.SaturdayAMEndTime = "",
                                    businessHrs.SaturdayPMStartTime = "",
                                    businessHrs.SaturdayPMEndTime = "";
                            }
                            if (sundayFlag == false) {
                                businessHrs.SundayAMStartTime = "",
                                    businessHrs.SundayAMEndTime = "",
                                    businessHrs.SundayPMStartTime = "",
                                    businessHrs.SundayPMEndTime = "";
                            }
                        }
                        currentRec["BusinessHours"] = businessHrs;
                        output.push(currentRec);
                    }
                }
            }
            //Code ends here
            return true;
        });
    }
    return output;
}
//concat payment methods
function concatPaymentMethod(node, manager, refID, attrID) {
    var output = "";
    var refObj = manager.getReferenceTypeHome().getReferenceTypeByID(refID);
    var reference = node.queryReferences(refObj);
    reference.forEach(function(ref) {
        var target = ref.getTarget();
        var attr = getAttrValues(target, manager, attrID);
        output = output + attr;
        return true;
    });
    return output;
}
//Pick anyone value from business area entity
function getDatafromBusinessArea(node, manager, refID, attrID) {
    var arr = getRefMultiValues(node, manager, refID, attrID, true);
    return arr.length > 0 ? arr[0] : "";
}
//get plant
function getPlant(node, manager) {
    var plantDataRef = getRefMultiValues(node, manager, "PurchasingOrgDataEntityPlantDataEntity", null, false);
    if (plantDataRef.length > 0) {
        var plant = getRefrenceAttr(plantDataRef[0], manager, "PlantOrgDataEntityPlant", "ReferenceDataID", false);
    } else {
        var plant = "";
    }
    return plant;
}
function businessArea(node, manager, refID) {
    var output = [];
    var businessareaObj = getRefMultiValues(node, manager, refID, null, false);
    for (var i = 0; i < businessareaObj.length; i++) {
        var baID = getRefrenceAttr(businessareaObj[i], manager, "SAPBusinessAreaDataEntityBusinessArea", "ReferenceDataID", false);
        if (baID) {
            output.push(baID);
        }
    }
    return output;
}
function checkInternalId(node, manager, id) {
    var value = getAttrValues(node, manager, id);
    if (value.includes("_") && isNaN(value[0])) {
        return value.split("_", 2)[1];
    } else {
        return value;
    }
}
function createOrganisationName(node, manager) {
    var output = [];
    var dc = node.getDataContainerByTypeID("3PLocalLanguageAddress").getDataContainers();
    if (dc.size() != 0) {
        var itr = dc.iterator();
        while (itr.hasNext()) {
            var dcObj = itr.next().getDataContainerObject();
            var localOrganisationNameData = {};
            localOrganisationNameData.AddressRepresentationCode = getAttrValues(dcObj, manager, "LocalLanguageVersion");
            localOrganisationNameData.Name = {};
            //Preethi: 02/Dec/2024 : Added UPM_FullName as part of FOR-IT
            localOrganisationNameData.Name.UPM_FullName = getAttrValues(node, manager, "LegalName");
            //
            localOrganisationNameData.Name.FirstLineName = getAttrValues(dcObj, manager, "Name1InLocalLanguage");
            localOrganisationNameData.Name.SecondLineName = getAttrValues(dcObj, manager, "Name2InLocalLanguage");
            localOrganisationNameData.Name.ThirdLineName = getAttrValues(dcObj, manager, "NameLine3InLocalLanguage");
            localOrganisationNameData.Name.FourthLineName = getAttrValues(dcObj, manager, "NameLine4InLocalLanguage");
            localOrganisationNameData.KeyWordsText = getAttrValues(dcObj, manager, "SearchTerminLocalLanguage");
            output.push(localOrganisationNameData);
        }
    }
    var mainOrganisationNameData = {};
    mainOrganisationNameData.AddressRepresentationCode = "";
    mainOrganisationNameData.Name = {};
    //Preethi: 02/Dec/2024 : Added UPM_FullName as part of FOR-IT
    mainOrganisationNameData.Name.UPM_FullName = getAttrValues(node, manager, "LegalName");
    //
    mainOrganisationNameData.Name.FirstLineName = getAttrValues(node, manager, "NameLine1");
    mainOrganisationNameData.Name.SecondLineName = getAttrValues(node, manager, "NameLine2");
    mainOrganisationNameData.Name.ThirdLineName = getAttrValues(node, manager, "NameLine3");
    mainOrganisationNameData.Name.FourthLineName = getAttrValues(node, manager, "NameLine4");
    mainOrganisationNameData.KeyWordsText = getAttrValues(node, manager, "SearchTerm");
    mainOrganisationNameData.AdditionalKeyWordsText = getAttrValues(node, manager, "HFMCode");
    output.push(mainOrganisationNameData);
    return output;
}
//this function is for UPM_KNKK Block - Credit Control area attributes for debmas customer(ECC system)
function upmknkk(node, manager) {
    var output = [];
    //Added set as part of 21322
    var set = new java.util.HashSet();
    var custCompanyCode = getRefMultiValues(node, manager, "CustBADataEntityCCDataEntity", null, false);
    for (var i = 0; i < custCompanyCode.length; i++) {
        //Added salesManager & salesManagerEmail as part of 21955
        var salesManager = "";
        var salesManagerEmail = "";
        var ccadObj = manager.getReferenceTypeHome().getReferenceTypeByID("CustCCDataEntityCCADataEntity");
        var ccdareference = custCompanyCode[i].queryReferences(ccadObj).asList(2);
        //Added ccID as part of 21322
        var ccID = getAttrValues(custCompanyCode[i], manager, "CompanyCodeID");
        if (ccdareference.size() != 0) {
            var currentRec = {};
            var ccda = ccdareference.get(0).getTarget();
            var creditControlArea = getRefrenceAttr(ccda, manager, "SAPCustomerCCADataEntityCCA", "ReferenceDataID", false);
            //Added part of 21322 - Starts here
            var setKey = ccID + "-" + creditControlArea;
            if (set.contains(setKey))
                continue;
            set.add(setKey);
            //Added as part of 21322 - ends here
            if (creditControlArea) {
                currentRec["KKBER"] = getRefrenceAttr(ccda, manager, "SAPCustomerCCADataEntityCCA", "ReferenceDataID", false);
                currentRec["KLIMK"] = getAttrValues(ccda, manager, "CreditLimit");
                currentRec["KNKLI"] = getAttrValues(ccda, manager, "CreditAccount");
                //Commented below as RiskCategory is updated as reference type 21836
                //currentRec["CTLPC"] = getAttrValues(ccda, manager, "RiskCategory");
                currentRec["CTLPC"] = getRefrenceAttr(ccda, manager, "CreditControlDataRiskCategory", "ReferenceDataID", false);
                currentRec["SBGRP"] = getRefrenceAttr(ccda, manager, "CrCtrlAreaDataEntityCrRprsntGroup", "ReferenceDataID", false);
                currentRec["DBPAY"] = getAttrValues(ccda, manager, "PaymentIndex");
                //Added as part of 21955 starts here
                if (creditControlArea == "5101") {
                    var baRefObj = manager.getReferenceTypeHome().getReferenceTypeByID("CustBADataEntityCCDataEntity");
                    var baReferences = custCompanyCode[i].queryReferencedBy(baRefObj).asList(50);
                    for (var j = 0; j < baReferences.size(); j++) {
                        var source = baReferences.get(j).getSource();
                        var objectType = source.getObjectType().getID();
                        if (objectType == "SAPOrganisationCustomerBusinessAreaData") {
                            var baID = getRefrenceAttr(source, manager, "SAPBusinessAreaDataEntityBusinessArea", "ReferenceDataID", false);
                            if (baID == "PLY") {
                                salesManager = getAttrValues(source, manager, "SalesManager");
                                salesManagerEmail = getAttrValues(source, manager, "SalesManagerEmailAddress");
                            }
                            break;
                        }
                    }
                }
                currentRec["SalesManager"] = salesManager
                currentRec["SalesManagerEmail"] = salesManagerEmail
                //Added as part of 21955 - Ends here
                output.push(currentRec);
            }
        }
    }
    return output;
}
function taxInformation(node, manager, dcID) {
    var output = [];
    if (node != null) {
        var dc = node.getDataContainerByTypeID(dcID).getDataContainers();
        if (dc.size() != 0) {
            var itr = dc.iterator();
            while (itr.hasNext()) {
                var currentRec = {};
                var dcObj = itr.next().getDataContainerObject();
                var countryCode = getAttrValues(dcObj, manager, "TaxNumberCountry");
                var partytaxID = getAttrValues(dcObj, manager, "TaxRegistrationIDNumber");
                var subStrTaxType = getAttrValues(dcObj, manager, "TaxNumberCategory");
                //	log.info("Country : "+countryCode)
                if (countryCode && (subStrTaxType.substr(2))) {
                    currentRec["CountryCode"] = countryCode;
                    currentRec["TaxIdentificationNumberTypeCode"] = subStrTaxType.substr(2);
                    currentRec["PartyTaxID"] = partytaxID;
                    output.push(currentRec);
                }
            }
        }
        //Added as part of RFC 20752
        //20752 code starts here
        var removedTaxNumbers = node.getValue("3PTaxDeletionIndicator").getValues();
        for (var i = 0; i < removedTaxNumbers.size(); i++) {
            var removedTaxNumbersList = removedTaxNumbers.get(i).getValue().split(",");
            if (removedTaxNumbersList.length > 0) {
                var currentRec = {};
                currentRec["UPM_DeletedIndicator"] = true;
                currentRec["CountryCode"] = removedTaxNumbersList[0];
                currentRec["TaxIdentificationNumberTypeCode"] = removedTaxNumbersList[2].substr(2);
                currentRec["PartyTaxID"] = removedTaxNumbersList[1];
                output.push(currentRec);
            }
        }
        //20752 code ends here
    }
    return output;
}
function personName(node, manager) {
    var output = [];
    var main = {};
    main.AddressRepresentationCode = "";
    main.KeyWordsText = getAttrValues(node, manager, "SearchTerm");
    output.push(main);
    var dc = node.getDataContainerByTypeID("3PLocalLanguageAddress").getDataContainers();
    if (dc.size() != 0) {
        var itr = dc.iterator();
        while (itr.hasNext()) {
            var dcObj = itr.next().getDataContainerObject();
            var local = {};
            local.AddressRepresentationCode = getAttrValues(dcObj, manager, "LocalLanguageVersion");
            local.KeyWordsText = getAttrValues(dcObj, manager, "SearchTerminLocalLanguage");
            output.push(local);
        }
    }
    return output;
}
function upmBusinessAreaData(node, manager, dcID, flag) {
    var output = [];
    var businessareaObj = getRefMultiValues(node, manager, dcID, null, false);
    for (var i = 0; i < businessareaObj.length; i++) {
        var currentRec = {};
        var baID = getRefrenceAttr(businessareaObj[i], manager, "SAPBusinessAreaDataEntityBusinessArea", "ReferenceDataID", false);
        if (baID) {
            currentRec["BusinessArea"] = baID;
            currentRec["DeactivatedForBusinessArea"] = getAttrValues(businessareaObj[i], manager, "DeactivatedforBusinessArea");
            // Added as part of 16866 SIT ALM Defect
            currentRec["OrderCurrency"] = getAttrValues(businessareaObj[i], manager, "3POrderCurrency");
            if (flag == "Customer") {
                currentRec["CustomerCategory"] = getAttrValues(businessareaObj[i], manager, "CustomerCategory");
                // Below if condition added as part of defect 20623 as per Erkki suggestion
                if (getAttrValues(businessareaObj[i], manager, "SearchTerm(UY)")) {
                    currentRec["SearchTerm"] = getAttrValues(businessareaObj[i], manager, "SearchTerm(UY)");
                } else {
                    currentRec["SearchTerm"] = getAttrValues(businessareaObj[i], manager, "SearchTerm(Paper)");
                }
                // Added by Raghav: TransportationZone is updated as Reference.
                //currentRec["TransportationZone"] = getAttrValues(businessareaObj[i], manager, "Transportation Zone");
                currentRec["TransportationZone"] = getRefrenceAttr(businessareaObj[i], manager, "CustBADataEntityTransportationZone", "ReferenceDataID", false);
                currentRec["Location"] = getAttrValues(businessareaObj[i], manager, "Location");
                currentRec["PaperCustomerType"] = getAttrValues(businessareaObj[i], manager, "PaperCustomerType");
                currentRec["PaperCustomerSegment"] = getAttrValues(businessareaObj[i], manager, "PaperCustomerSegment");
                currentRec["CustomerBarCode"] = getAttrValues(businessareaObj[i], manager, "PrintBarcodeList");
                currentRec["CustomerRecordType"] = getAttrValues(businessareaObj[i], manager, "CustomerRecordType");
                currentRec["PlaceCode"] = getRefrenceAttr(businessareaObj[i], manager, "OrgDataEntityPlaceCode", "PlaceCode", false); //Added this line as a partr of 18905 defect
            	  //Added as part of RFC 21881
                currentRec["DeliveringPlantID"] = getRefrenceAttr(businessareaObj[i], manager, "OrgDataRoleDCPlant", "ReferenceDataID", false);	
            }
            //Added as part of RFC 21881
            //21881 code starts here
            if(flag == "Supplier"){
            	 currentRec["SupplyingPlantID"] = getRefrenceAttr(businessareaObj[i], manager, "3PVendorPlant", "ReferenceDataID", false);
            }
            //21881 code ends here
            output.push(currentRec);
        }
    }
    return output;
}
function withHoldingTax(node, manager, dcID) {
    var output = [];
    if (node != null) {
        var dc = node.getDataContainerByTypeID(dcID).getDataContainers();
        if (dc.size() != 0) {
            var itr = dc.iterator();
            while (itr.hasNext()) {
                var dcObj = itr.next().getDataContainerObject();
                var taxTypeCode = getAttrValues(dcObj, manager, "WithholdingTaxTypes");
                var whTaxCode = getAttrValues(dcObj, manager, "WithholdingTaxCode");
                if (taxTypeCode && whTaxCode) {
                    var currentRec = {};
                    //var withholdingIdentificationNum = getAttrValues(dcObj, manager, "W/TaxIdentyficationNumber");
                    //if(withholdingIdentificationNum.length != 0){						
                    var whTaxAgentIndicator = getAttrValues(dcObj, manager, "LiableforWithholdingTax");
                    var whTaxExemptionCertificateID = getAttrValues(dcObj, manager, "ExemptionNumber");
                    var whWithholdingTaxExemptionRate = getAttrValues(dcObj, manager, "ExemptionRate");
                    var sDate = getAttrValues(dcObj, manager, "ExemptionStartDate");
                    var eDate = getAttrValues(dcObj, manager, "ExemptionEndDate");
                    //for(var i=0; i<withholdingIdentificationNum.length; i++){
                    //var currentRec = {}; 
                    currentRec["WithholdingTaxTypeCode"] = taxTypeCode;
                    currentRec["WithholdingTaxCode"] = whTaxCode;
                    currentRec["WithholdingTaxAgentIndicator"] = whTaxAgentIndicator;
                    currentRec["WithholdingTaxExemptionCertificateID"] = whTaxExemptionCertificateID;
                    currentRec["WithholdingTaxExemptionRate"] = whWithholdingTaxExemptionRate;
                    //currentRec["WithholdingTaxIdentificationNumber"] = withholdingIdentificationNum[i];
                    currentRec["WithholdingTaxIdentificationNumber"] = "";
                    var validityPeriod = {};
                    validityPeriod["StartDate"] = sDate;
                    validityPeriod["EndDate"] = eDate;
                    currentRec["WithholdingTaxExemptionValidityPeriod"] = validityPeriod;
                    output.push(currentRec);
                    //}
                    //}	      	
                }
            }
        }
    }
    return output;
}
//Contact Person 
function getcontactPerson(node, manager, businessArea, role) {
    var output = [];
    var businessAreaRef = getRefMultiValues(node, manager, businessArea, null, false);
    for (var i = 0; i < businessAreaRef.length; i++) {
        var contactPersonRef = getRefMultiValues(businessAreaRef[i], manager, "SuppCustBADataContactPerson", null, false);
        for (var j = 0; j < contactPersonRef.length; j++) {
            var contactPerson = contactPersonRef[j];
            var currentRec = {};
            var contactPersonSAPBPNumber = getAttrValues(contactPerson, manager, "ContactPersonSAPBPNumber");
            var SAPContactPersonNumber = getAttrValues(contactPerson, manager, "SAPContactPersonNumber");
            currentRec["UPM_BusinessArea"] = getRefMultiValues(contactPerson, manager, "UPMContactPersonBusinessArea", "ReferenceDataID", true);
            if (contactPersonSAPBPNumber) {
                currentRec["ContactPersonBusinessPartnerNumber"] = contactPersonSAPBPNumber;
            } else if (SAPContactPersonNumber) {
                currentRec["ContactPersonBusinessPartnerNumber"] = SAPContactPersonNumber;
            }
            //Preethi: 04-Mar-2025: Added DeletedIndicator as part of defect 18150 ,17941 and 18036
            currentRec["DeletedIndicator"] = getAttrValues(contactPerson, manager, "IsInactive");
            //Hardcoded it as per erkki's comment. Need confirmation from Biswas on Relationship type
            //currentRec["BusinessPartnerRelationshipRoleCode"] = "BUR001"+"";
            currentRec["BusinessPartnerRelationshipRoleCode"] = getAttrValues(contactPerson, manager, "RelationshipType");
            currentRec["ContactPersonNumber"] = getAttrValues(contactPerson, manager, "SAPContactPersonNumber");
            if (role == "Supplier") {
                currentRec["Department"] = getRefrenceAttr(contactPerson, manager, "UPMContactPersonVendorDepartment", "ReferenceDataID", false);
            } else if (role == "Customer") {
                currentRec["Department"] = getRefrenceAttr(contactPerson, manager, "UPMContactPersonCustomerDepartment", "ReferenceDataID", false);
            }
            currentRec["FirstName"] = getAttrValues(contactPerson, manager, "FirstName");
            currentRec["LastName"] = getAttrValues(contactPerson, manager, "LastName");
            currentRec["ContactPersonFunction"] = getAttrValues(contactPerson, manager, "Responsibility");
            //Commented and added correspondenceLanguage as part of 19610
            //currentRec["CorrespondenceLanguage"] = getAttrValues(contactPerson, manager, "CorrespondenceLanguage");
            var cpCorresLang = getAttrValues(contactPerson, manager, "CorrespondenceLanguage");
            currentRec["CorrespondenceLanguage"] = (cpCorresLang == "EN" || cpCorresLang == "ZEA" || cpCorresLang == "ZEB") ? "EN"+"" : cpCorresLang;
            currentRec["Title"] = getAttrValues(contactPerson, manager, "Title");
            currentRec["ContactPersonNote"] = getAttrValues(contactPerson, manager, "NotesaboutContactPerson");
            currentRec["DefaultCommunicationMethod"] = getAttrValues(contactPerson, manager, "DefaultCommunicationMethod");
            currentRec["Email"] = contactPersonEmail(contactPerson, manager, "EmailDataContainer");
            currentRec["Telephone"] = contactPersonTelePhone(contactPerson, manager, "PhoneDataContainer");
            currentRec["Facsimile"] = contactPersonFax(contactPerson, manager, "Fax");
            output.push(currentRec);
        }
        //Preethi : 24-June-2025 : Added as part of 20999 (Approved Contact Person Removal functionality)
        var removedCPs = businessAreaRef[i].getValue("RemovedContactPerson").getSimpleValue();
        if (removedCPs) {
            var removedCPsList = removedCPs.split(",");
            for (var k = 0; k < removedCPsList.length; k++) {
                var removeContactPerson = manager.getEntityHome().getEntityByID(removedCPsList[k]);
                var currentRec = {};
                var contactPersonSAPBPNumber = getAttrValues(removeContactPerson, manager, "ContactPersonSAPBPNumber");
                var SAPContactPersonNumber = getAttrValues(removeContactPerson, manager, "SAPContactPersonNumber");
                currentRec["UPM_BusinessArea"] = getRefMultiValues(removeContactPerson, manager, "UPMContactPersonBusinessArea", "ReferenceDataID", true);
                if (contactPersonSAPBPNumber) {
                    currentRec["ContactPersonBusinessPartnerNumber"] = contactPersonSAPBPNumber;
                } else if (SAPContactPersonNumber) {
                    currentRec["ContactPersonBusinessPartnerNumber"] = SAPContactPersonNumber;
                }
                //Hardcoding it as true, since it has to be removed from SAP
                currentRec["DeletedIndicator"] = true;
                currentRec["BusinessPartnerRelationshipRoleCode"] = getAttrValues(removeContactPerson, manager, "RelationshipType");
                currentRec["ContactPersonNumber"] = getAttrValues(removeContactPerson, manager, "SAPContactPersonNumber");
                if (role == "Supplier") {
                    currentRec["Department"] = getRefrenceAttr(removeContactPerson, manager, "UPMContactPersonVendorDepartment", "ReferenceDataID", false);
                } else if (role == "Customer") {
                    currentRec["Department"] = getRefrenceAttr(removeContactPerson, manager, "UPMContactPersonCustomerDepartment", "ReferenceDataID", false);
                }
                currentRec["FirstName"] = getAttrValues(removeContactPerson, manager, "FirstName");
                currentRec["LastName"] = getAttrValues(removeContactPerson, manager, "LastName");
                currentRec["ContactPersonFunction"] = getAttrValues(removeContactPerson, manager, "Responsibility");
                currentRec["CorrespondenceLanguage"] = getAttrValues(removeContactPerson, manager, "CorrespondenceLanguage");
                currentRec["Title"] = getAttrValues(removeContactPerson, manager, "Title");
                currentRec["ContactPersonNote"] = getAttrValues(removeContactPerson, manager, "NotesaboutContactPerson");
                currentRec["DefaultCommunicationMethod"] = getAttrValues(removeContactPerson, manager, "DefaultCommunicationMethod");
                currentRec["Email"] = contactPersonEmail(removeContactPerson, manager, "EmailDataContainer");
                currentRec["Telephone"] = contactPersonTelePhone(removeContactPerson, manager, "PhoneDataContainer");
                currentRec["Facsimile"] = contactPersonFax(removeContactPerson, manager, "Fax");
                output.push(currentRec);
            }
        }
    }
    //Preethi: 04-Mar-2025: Added the lines below as part of defect 18150 ,17941 and 18036
    var cpUnlinkingIndicator = node.getValue("ContactPersonUnlinkingIndicator").getSimpleValue();
    var tempRef = [];
    if (cpUnlinkingIndicator && cpUnlinkingIndicator == "Customer" && role == "Customer") {
        tempRef = getRefMultiValues(node, manager, "UnlinkedCustomerContactPerson", null, false);
    } else if (cpUnlinkingIndicator && cpUnlinkingIndicator == "Vendor" && role == "Supplier") {
        tempRef = getRefMultiValues(node, manager, "UnlinkedSupplierContactPerson", null, false);
    }
    for (var i = 0; i < tempRef.length; i++) {
        var tempContactPerson = tempRef[i];
        var currentRec = {};
        var contactPersonSAPBPNumber = getAttrValues(tempContactPerson, manager, "ContactPersonSAPBPNumber");
        var SAPContactPersonNumber = getAttrValues(tempContactPerson, manager, "SAPContactPersonNumber");
        currentRec["UPM_BusinessArea"] = getRefMultiValues(tempContactPerson, manager, "UPMContactPersonBusinessArea", "ReferenceDataID", true);
        if (contactPersonSAPBPNumber) {
            currentRec["ContactPersonBusinessPartnerNumber"] = contactPersonSAPBPNumber;
        } else if (SAPContactPersonNumber) {
            currentRec["ContactPersonBusinessPartnerNumber"] = SAPContactPersonNumber;
        }
        currentRec["DeletedIndicator"] = getAttrValues(tempContactPerson, manager, "IsInactive");
        //Hardcoded it as per erkki's comment. Need confirmation from Biswas on Relationship type
        //currentRec["BusinessPartnerRelationshipRoleCode"] = "BUR001"+"";
        currentRec["BusinessPartnerRelationshipRoleCode"] = getAttrValues(tempContactPerson, manager, "RelationshipType");
        currentRec["ContactPersonNumber"] = getAttrValues(tempContactPerson, manager, "SAPContactPersonNumber");
        if (role == "Supplier") {
            currentRec["Department"] = getRefrenceAttr(tempContactPerson, manager, "UPMContactPersonVendorDepartment", "ReferenceDataID", false);
        } else if (role == "Customer") {
            currentRec["Department"] = getRefrenceAttr(tempContactPerson, manager, "UPMContactPersonCustomerDepartment", "ReferenceDataID", false);
        }
        currentRec["FirstName"] = getAttrValues(tempContactPerson, manager, "FirstName");
        currentRec["LastName"] = getAttrValues(tempContactPerson, manager, "LastName");
        currentRec["ContactPersonFunction"] = getAttrValues(tempContactPerson, manager, "Responsibility");
        currentRec["CorrespondenceLanguage"] = getAttrValues(tempContactPerson, manager, "CorrespondenceLanguage");
        currentRec["Title"] = getAttrValues(tempContactPerson, manager, "Title");
        currentRec["ContactPersonNote"] = getAttrValues(tempContactPerson, manager, "NotesaboutContactPerson");
        currentRec["DefaultCommunicationMethod"] = getAttrValues(tempContactPerson, manager, "DefaultCommunicationMethod");
        currentRec["Email"] = contactPersonEmail(tempContactPerson, manager, "EmailDataContainer");
        currentRec["Telephone"] = contactPersonTelePhone(tempContactPerson, manager, "PhoneDataContainer");
        currentRec["Facsimile"] = contactPersonFax(tempContactPerson, manager, "Fax");
        output.push(currentRec);
    }
    return output;
}
//Contact Person Email
function contactPersonEmail(node, manager, dcID) {
    var output = [];
    var dc = node.getDataContainerByTypeID(dcID).getDataContainers();
    if (dc.size() != 0) {
        var itr = dc.iterator();
        while (itr.hasNext()) {
            var currentRec = {};
            var dcObj = itr.next().getDataContainerObject();
            var defaultFlag = getAttrValues(dcObj, manager, "DefaultEmailAddress");
            var sequenceNumber = getAttrValues(dcObj, manager, "EmailSequenceNumber");
            if (sequenceNumber) {
                currentRec["SequenceNumber"] = getAttrValues(dcObj, manager, "EmailSequenceNumber");
                currentRec["URI"] = getAttrValues(dcObj, manager, "EmailAddress");
                currentRec["DefaultIndicator"] = getAttrValues(dcObj, manager, "DefaultEmailAddress");
                currentRec.EmailNote = {};
                //Preethi : 15-July-2025 : Commented note and Added as part of Ariba changes. Erkki has provided the logic
                //currentRec.EmailNote.Note = getAttrValues(dcObj, manager, "EmailNotes");

                var emailNoteTextAttr = getAttrValues(dcObj, manager, "EmailNotes");
                var emailNoteDesc = getAttrValues(dcObj, manager, "EmailNotesDescription");
                if (emailNoteDesc && emailNoteDesc == "Other") {
                    currentRec.EmailNote.Note = emailNoteTextAttr;
                } else {
                    currentRec.EmailNote.Note = emailNoteDesc;
                }
                output.push(currentRec);
            }
        }
    }
    return output;
}
//Contact Person Telephone
function contactPersonTelePhone(node, manager, dcID) {
    var output = [];
    var dc = node.getDataContainerByTypeID(dcID).getDataContainers();
    if (dc.size() != 0) {
        var itr = dc.iterator();
        while (itr.hasNext()) {
            var currentRec = {};
            var dcObj = itr.next().getDataContainerObject();
            var sequenceNumber = getAttrValues(dcObj, manager, "TelephoneNumberSequenceNumber");
            if (sequenceNumber) {
                currentRec["SequenceNumber"] = getAttrValues(dcObj, manager, "TelephoneNumberSequenceNumber");
                var num = {};
                num["SubscriberID"] = getAttrValues(dcObj, manager, "TelephoneNumber");
                num["CountryCode"] = getAttrValues(dcObj, manager, "TelephoneNumberCountry");
                currentRec["Number"] = num;
                currentRec["DefaultIndicator"] = getAttrValues(dcObj, manager, "DefaultTelephoneNumber");
                currentRec.TelephoneNote = {};
                currentRec.TelephoneNote.Note = getAttrValues(dcObj, manager, "TelephoneNumberNotes");
                output.push(currentRec);
            }
        }
    }
    return output;
}
//Contact Person Fax
function contactPersonFax(node, manager, dcID) {
    var output = [];
    var dc = node.getDataContainerByTypeID(dcID).getDataContainers();
    if (dc.size() != 0) {
        var itr = dc.iterator();
        while (itr.hasNext()) {
            var currentRec = {};
            var dcObj = itr.next().getDataContainerObject();
            var sequenceNumber = getAttrValues(dcObj, manager, "FaxNumberSequenceNumber");
            if (sequenceNumber) {
                currentRec["SequenceNumber"] = getAttrValues(dcObj, manager, "FaxNumberSequenceNumber");
                var num = {};
                num["SubscriberID"] = getAttrValues(dcObj, manager, "FaxNumber");
                num["CountryCode"] = getAttrValues(dcObj, manager, "FaxNumberCountry");
                currentRec["Number"] = num;
                currentRec["DefaultIndicator"] = getAttrValues(dcObj, manager, "DefaultFaxNumber");
                currentRec.FacsimileNote = {};
                currentRec.FacsimileNote.Note = getAttrValues(dcObj, manager, "FaxNumberNotes");
                output.push(currentRec);
            }
        }
    }
    return output;
}
function getSAPBPNumber(node, manager, refID) {
    var attrVal = "";
    var customerRole = false;
    var vendorRole = false;
    var splitJSON = false;
    var workflowIndicator = "";
    var refObj = manager.getReferenceTypeHome().getReferenceTypeByID(refID);
    var reference = node.queryReferences(refObj);
    reference.forEach(function(re) {
        var target = re.getTarget();
        var bpRole = target.getValue("BPRoleTech").getValues(); //Get BPRoleTech value from Org level to check the role.
        // if customerRole = true , then it is customer role; if vendorRole = true , then it is vendor role; if both flag is true, then it has both role
        for (var i = 0; i < bpRole.size(); i++) {
            if (bpRole.get(i).getValue() == "Customer") {
                customerRole = true;
            }
            if (bpRole.get(i).getValue() == "Vendor") {
                vendorRole = true;
            }
        }
        if (customerRole == true && vendorRole == true) {
            var custaccgrp = getRefrenceAttr(node, manager, "SAPCustomerAccountGroup", "AccountGroupID", false);
            var supaccgrp = getRefrenceAttr(node, manager, "SAPSupplierAccountGroup", "AccountGroupID", false);
            if (custaccgrp == "ZTPY" && supaccgrp == "ZTPY") {
                splitJSON = true;
            }
        }
        workflowIndicator = node.getValue("WorkflowIndicator").getSimpleValue();
        if (customerRole == true && vendorRole == false) {
            attrVal = checkInternalId(target, manager, "EMCustomerNumber");
        } else if ((customerRole == true && vendorRole == true) || (vendorRole == true && customerRole == false)) {
            if (splitJSON == true && workflowIndicator == "Customer" && customerRole == true && vendorRole == true) {
                attrVal = checkInternalId(target, manager, "EMCustomerNumber");
            } else if (splitJSON == true && workflowIndicator == "Vendor" && customerRole == true && vendorRole == true) {
                attrVal = checkInternalId(target, manager, "EMVendorNumber");
            } else {
                attrVal = checkInternalId(target, manager, "EMVendorNumber");
            }
        }
        return true;
    });
    return attrVal;
}
function getIdentificationsDetails(node, manager, dcId, refID) {
    //SupplierManagementID(SM ID)
    var output = [];
    var identificationSMID = getSingleDCValues(node, manager, dcId, "SupplierManagementID(SM ID)");
    if (identificationSMID) {
        var currentRec = {};
        currentRec["PartyIdentifierTypeCode"] = "ZAGB01";
        currentRec["BusinessPartnerID"] = identificationSMID;
        output.push(currentRec);
    }
    var identificationACMID = getSingleDCValues(node, manager, dcId, "S4OrgSystemID(ACM ID)");
    if (identificationACMID) {
        var currentRec = {};
        currentRec["PartyIdentifierTypeCode"] = "ZAGB02";
        currentRec["BusinessPartnerID"] = identificationACMID;
        output.push(currentRec);
    }
    var identificationANID = getSingleDCValues(node, manager, dcId, "SAPBusinessNetworkID(ANID)");
    if (identificationANID) {
        var currentRec = {};
        currentRec["PartyIdentifierTypeCode"] = "BUP007";
        currentRec["BusinessPartnerID"] = identificationANID;
        output.push(currentRec);
    }
    var acai = getDatafromBusinessArea(node, manager, "OrganisationBusinessAreaDataEntity", "AribaCatalogsActivationIndicator");
    if (acai == "01") {
        var currentRec = {};
        currentRec["PartyIdentifierTypeCode"] = "ZAPCIN";
        currentRec["BusinessPartnerID"] = "APC";
        output.push(currentRec);
    }
    return output;
}
function getPaperIdentificationBloc(node, manager, refID, roleFlag) {
    var output = [];
    if (node != null) {
        var isCheck = true;
        var ccArr = getRefMultiValues(node, manager, refID, null, false);
        for (i = 0; i < ccArr.length; i++) {
            var currentRec = {};
            var sourceSystem = getAttrValues(ccArr[i], manager, "SourceofOtherSystemNumber");
            if (sourceSystem) {
                if (sourceSystem == "001") {
                    currentRec["PartyIdentifierTypeCode"] = "001";
                    currentRec["BusinessPartnerID"] = getAttrValues(ccArr[i], manager, "NumberinOtherSystem");
                    isCheck = false;
                    output.push(currentRec);
                } else if (sourceSystem == "ZSFPPR") {
                    var salesforceBPNumber = getAttrValues(node, manager, "SalesforceBPNumber");
                    currentRec["BusinessPartnerID"] = salesforceBPNumber;
                    currentRec["PartyIdentifierTypeCode"] = "ZSFPPR" + "";
                    isCheck = false;
                    output.push(currentRec);
                }
            }
        }
        if(roleFlag == "Supplier") { //Added as part of 22259
	        var identificationSMID = getSingleDCValues(node, manager, "SAPSupplierRoleData", "SupplierManagementID(SM ID)");
	        if (identificationSMID) {
	            var currentRec = {};
	            currentRec["PartyIdentifierTypeCode"] = "ZAGB01";
	            currentRec["BusinessPartnerID"] = identificationSMID;
	            output.push(currentRec);
	        }
	        var identificationACMID = getSingleDCValues(node, manager, "SAPSupplierRoleData", "S4OrgSystemID(ACM ID)");
	        if (identificationACMID) {
	            var currentRec = {};
	            currentRec["PartyIdentifierTypeCode"] = "ZAGB02";
	            currentRec["BusinessPartnerID"] = identificationACMID;
	            output.push(currentRec);
	        }
        } //Added as part of 22259
        var identificationANID = getSingleDCValues(node, manager, "SAPSupplierRoleData", "SAPBusinessNetworkID(ANID)");
        if (identificationANID) {
            var currentRec = {};
            currentRec["PartyIdentifierTypeCode"] = "BUP007";
            currentRec["BusinessPartnerID"] = identificationANID;
            output.push(currentRec);
        }
        // Added by Raghav as part of defect 21072 on 26-05-2025
        if (getAribaCatalog(node, manager)) {
            var currentRec = {};
            currentRec["PartyIdentifierTypeCode"] = getAribaCatalog(node, manager);
            currentRec["BusinessPartnerID"] = "APC";
            output.push(currentRec);
        }
        //Preethi : Added as part of RFC 19321
        var dcObj = node.getDataContainerByTypeID("SAPSupplierRoleData").getDataContainerObject();
        if (dcObj != null) {
            var carrier = dcObj.getValue("BPRoleSAP").getValues();
            var IsCarrier = false;
            for (var i = 0; i < carrier.size(); i++) {
                if (carrier.get(i).getID() == "CRM010") {
                    IsCarrier = true;
                    break;
                }
            }
            if (IsCarrier == true) {
            	 //Added as part of defect 21594
            	 //21594 code starts here
			 var scacdesc = getSingleDCValues(node, manager, "SAPSupplierRoleData", "SCACDescription");
			 if(scacdesc) {
			 //21594 code ends here
				var currentRec = {};
				currentRec["PartyIdentifierTypeCode"] = "BUP006" + "";
				currentRec["BusinessPartnerID"] = getSingleDCValues(node, manager, "SAPSupplierRoleData", "SCACDescription");
				output.push(currentRec);
			 } //21594 - Added as part of it
            }
        }
    }
    return output;
}
// Added by Raghav as part of defect 21072 on 26-05-2025
function getAribaCatalog(node, manager) {
    var output = [];
    var result = "";
    var refObj = manager.getReferenceTypeHome().getReferenceTypeByID("CCDataEntityPurchasingOrgDataEntity");
    var reference = node.queryReferences(refObj);
    reference.forEach(function(re) {
        var target = re.getTarget();
        var isVendorneededforAriba = getAttrValues(target, manager, "IsVendorNeededforAribaCatalogs?");
        if (isVendorneededforAriba == true) {
            var aribaCatalogActivationIndicator = getAttrValues(target, manager, "AribaCatalogsActivationIndicator");
            if (aribaCatalogActivationIndicator != null && aribaCatalogActivationIndicator == "01") {
                log.severe("log check")
                output.push(aribaCatalogActivationIndicator);
            }
        }
        return true;
    });
    if (output.length != 0) {
        if (output.includes("01")) {
            result = "ZAPCIN" + "";
        } else {
            result = "";
        }
    }
    return result;
}
//Function only for Ariba to get purchas org attributes
function processMinorityIndicator(node, manager, flag) {
    var output = [];
    var result = "";
    //Commented the existing logic for MinorityIndicatorsCode and directly fetching value from cc - INC2730571 & INC2730653
    /*var refObj = manager.getReferenceTypeHome().getReferenceTypeByID("CCDataEntityPurchasingOrgDataEntity");
    var reference = node.queryReferences(refObj);
    reference.forEach(function(re) {
        var target = re.getTarget();
        var isVendorneededforAriba = getAttrValues(target, manager, "IsVendorneededforAribaGuidedBuying(AGB)?");
        if (isVendorneededforAriba == true) {
            var aribaBuyingActivationIndicator = getAttrValues(target, manager, "AribaBuyingActivationIndicator");
            if (aribaBuyingActivationIndicator != null && aribaBuyingActivationIndicator == "01") {
                log.severe("log check")
                output.push(aribaBuyingActivationIndicator);
            }
        }
        return true;
    });
    if (output.length != 0) {
        if (output.includes("01")) {
            if (flag == "CompanyCode") {
                result = "AGB" + "";
            } else {
                result = "true" + "";
            }
        } else {
            result = "";
        }
    }*/
	
	var minorityIndicator = getAttrValues(node, manager, "MinorityIndicator");
	if(minorityIndicator == true){
		 if (flag == "CompanyCode") {
                result = "AGB" + "";
            } else {
                result = "true" + "";
            }
	}else{
		result = "";
	}
    return result;
}

function padLeft(value, length, paddingChar) {
    value = String(value);
    while (value.length < length) {
        value = paddingChar + value;
    }
    return value;
}
function getDate() {
    var a = new Date();
    var day = padLeft(a.getDate(), 2, '0');
    var month = padLeft(a.getMonth() + 1, 2, '0');
    var year = a.getFullYear();
    var hours = padLeft(a.getHours(), 2, '0');
    var minutes = padLeft(a.getMinutes(), 2, '0');
    var seconds = padLeft(a.getSeconds(), 2, '0');
    var milliseconds = padLeft(a.getMilliseconds(), 3, '0');
    var formattedDateTime = day + month + year + hours + minutes + seconds + milliseconds;
    return formattedDateTime;
}
// this function is for UPM_RiskAssessment irrespective of any key attribute
/*function riskAssessment(node,manager){
	var output = [] ;
	//var output;
	var currentRec = {};
	currentRec["RiskAssessmentToolID"] = getSingleDCValues(node, manager, "SAPCustomerRoleData", "RiskAssessmentToolID");		
	currentRec["RiskAssessmentStatus"] = getSingleDCValues(node, manager, "SAPCustomerRoleData", "RiskAssessmentStatus");
	currentRec["BusinessUnitCode"] = getSingleDCValues(node, manager, "SAPCustomerRoleData", "BusinessUnitCode");
	output.push(currentRec);	
	return output;		
			
}*/
function contactPersonRoleCode(node, manager) {
    var output = [];
    var bpRole = getAttrValues(node, manager, "BPRoleSAP");
    if (bpRole.length != 0) {
        var currentRec;
        for (var i = 0; i < bpRole.length; i++) {
        	// Added if condition as part of 21657
            if(bpRole[i] != "000000") {
	            currentRec = {};
	            currentRec["RoleCode"] = bpRole[i];
	            output.push(currentRec);
            }
        }
    }
    return output;
}
//When you edit this function , please check the Rafgo requirements , consult with Madan and update it.
function rafgoSAPCustUPMPartnerFunctions(node, manager) {
    var output = [];
    var set = new java.util.HashSet();
    var refObj = manager.getReferenceTypeHome().getReferenceTypeByID("OrganisationRafgoPFtoCustData");
    var references = node.queryReferencedBy(refObj);
    references.forEach(function(re) {
        var source = re.getSource();
        var attr = source.getValue("RafgoPartnerFunctionID").getSimpleValue();
        var attrValue = (attr) ? attr.split('_')[0] + "" : "";
        if (set.contains(attrValue))
            return true;
        set.add(attrValue);
        var currRec = {};
        currRec["UPM_PartnerCounter"] = "";
        currRec["PartyRoleCode"] = "RafgoID" + "";
        currRec["PartyInternalID"] = attrValue;
        currRec["ReceiverPartyInternalID"] = "";
        currRec["DefaultIndicator"] = false;
        output.push(currRec);
        return true;
    });
    return output;
}
//When you edit this function , please check the Rafgo requirements , consult with Madan and update it.
function rafgoCustUnloadingPoints(node, manager) {
    var output = [];
    var refObj = manager.getReferenceTypeHome().getReferenceTypeByID("OrganisationCustBusinessAreaDataEntity");
    if (node.queryReferences(refObj).asList(5).size() != 0) {
        var reference = node.queryReferences(refObj);
        //reference.forEach(function (re) {
        //var re = node.queryReferences(refObj).asList(15).get(0);
        var re = node.queryReferences(refObj).asList(100);
        for (var i = 0; i < re.size(); i++) {
            var target = re.get(i).getTarget();
            var businessArea = getRefrenceAttr(target, manager, "SAPBusinessAreaDataEntityBusinessArea", "ReferenceDataID", false);
            if (businessArea == "RAFAPAC" || businessArea == "RAFAME" || businessArea == "RAFEMAIA") {
                var unloadingPoint = getRefMultiValues(target, manager, "SAPCustBADataEntityUnldPointDataEntity", null, false);
                for (j = 0; j < unloadingPoint.length; j++) {
                    var currentRec = {};
                    var unloadingPointName = getAttrValues(unloadingPoint[j], manager, "UnloadingPoint");
                    if (businessArea && unloadingPointName) {
                        currentRec["UPM_BusinessArea"] = businessArea;
                        currentRec["UnloadingPointName"] = getAttrValues(unloadingPoint[j], manager, "UnloadingPoint");
                        currentRec["DefaultIndicator"] = getAttrValues(target, manager, "DefaultUnloadingPoint");
                        //Preethi : 24-feb-2025 : Defect - 17863 : As discussed with Ratna, commented the lined below. need to send the data irrespective of MaintainGoodsReceivingHoursManually
                        /* var goodsFlag = getAttrValues(unloadingPoint[j], manager, "MaintainGoodsReceivingHoursManually");
                        if (goodsFlag === false) {
                        currentRec["GoodsReceivingHoursID"] = getRefrenceAttr(unloadingPoint[j], manager, "UnloadingPointDataEntityGdRchFoundData", "ReferenceDataID", false);
                        } else {
                        currentRec["GoodsReceivingHoursID"] = "";
                        }*/
                        var rcvngHrsID = getRefrenceAttr(unloadingPoint[j], manager, "UnloadingPointDataEntityGdRchFoundData", "ReferenceDataID", false);
                        currentRec["GoodsReceivingHoursID"] = rcvngHrsID ? rcvngHrsID : "";
                        var businessHrs = {};
                        var calender = getRefrenceAttr(unloadingPoint[j], manager, "SAPOrgUnloadingPointDataCalendarKey", "ReferenceDataID", false);
                        var externalID = getRefrenceAttr(unloadingPoint[j], manager, "SAPOrgUnloadingPointDataCalendarKey", "ExternalSystemID", false)
                        if (externalID == "SellIT") {
                            businessHrs.FactoryCalenderCode = calender.split('_')[1] + "";
                        } else {
                            businessHrs.FactoryCalenderCode = calender;
                        }
                        var mondayFlag = false;
                        var tuesdayFlag = false;
                        var wednesdayFlag = false;
                        var thursdayFlag = false;
                        var fridayFlag = false;
                        var saturdayFlag = false;
                        var sundayFlag = false;
                        var unloadingrefObj = manager.getReferenceTypeHome().getReferenceTypeByID("UnloadingPointDataEntityGdRchDataEntity");
                        var unloadingref = unloadingPoint[j].queryReferences(unloadingrefObj);
                        unloadingref.forEach(function(upre) {
                            var goodsTarget = upre.getTarget();
                            var GoodstargetName = upre.getTarget().getName();
                            if (GoodstargetName != null) {
                                if (GoodstargetName.equalsIgnoreCase("MON") || GoodstargetName.equalsIgnoreCase("MONDAY")) {
                                    mondayFlag = true;
                                    businessHrs.MondayAMStartTime = getAttrValues(goodsTarget, manager, "MorningOpeningTime");
                                    businessHrs.MondayAMEndTime = getAttrValues(goodsTarget, manager, "MorningClosingTime");
                                    businessHrs.MondayPMStartTime = getAttrValues(goodsTarget, manager, "AfternoonOpeningTime");
                                    businessHrs.MondayPMEndTime = getAttrValues(goodsTarget, manager, "AfternoonClosingTime");
                                } else if (GoodstargetName.equalsIgnoreCase("TUE") || GoodstargetName.equalsIgnoreCase("TUESDAY")) {
                                    tuesdayFlag = true;
                                    businessHrs.TuesdayAMStartTime = getAttrValues(goodsTarget, manager, "MorningOpeningTime");
                                    businessHrs.TuesdayAMEndTime = getAttrValues(goodsTarget, manager, "MorningClosingTime");
                                    businessHrs.TuesdayPMStartTime = getAttrValues(goodsTarget, manager, "AfternoonOpeningTime");
                                    businessHrs.TuesdayPMEndTime = getAttrValues(goodsTarget, manager, "AfternoonClosingTime");
                                } else if (GoodstargetName.equalsIgnoreCase("WED") || GoodstargetName.equalsIgnoreCase("WEDNESDAY")) {
                                    wednesdayFlag = true;
                                    businessHrs.WednesdayAMStartTime = getAttrValues(goodsTarget, manager, "MorningOpeningTime");
                                    businessHrs.WednesdayAMEndTime = getAttrValues(goodsTarget, manager, "MorningClosingTime");
                                    businessHrs.WednesdayPMStartTime = getAttrValues(goodsTarget, manager, "AfternoonOpeningTime");
                                    businessHrs.WednesdayPMEndTime = getAttrValues(goodsTarget, manager, "AfternoonClosingTime");
                                } else if (GoodstargetName.equalsIgnoreCase("THU") || GoodstargetName.equalsIgnoreCase("THURSDAY")) {
                                    thursdayFlag = true;
                                    businessHrs.ThursdayAMStartTime = getAttrValues(goodsTarget, manager, "MorningOpeningTime");
                                    businessHrs.ThursdayAMEndTime = getAttrValues(goodsTarget, manager, "MorningClosingTime");
                                    businessHrs.ThursdayPMStartTime = getAttrValues(goodsTarget, manager, "AfternoonOpeningTime");
                                    businessHrs.ThursdayPMEndTime = getAttrValues(goodsTarget, manager, "AfternoonClosingTime");
                                } else if (GoodstargetName.equalsIgnoreCase("FRI") || GoodstargetName.equalsIgnoreCase("FRIDAY")) {
                                    fridayFlag = true;
                                    businessHrs.FridayAMStartTime = getAttrValues(goodsTarget, manager, "MorningOpeningTime");
                                    businessHrs.FridayAMEndTime = getAttrValues(goodsTarget, manager, "MorningClosingTime");
                                    businessHrs.FridayPMStartTime = getAttrValues(goodsTarget, manager, "AfternoonOpeningTime");
                                    businessHrs.FridayPMEndTime = getAttrValues(goodsTarget, manager, "AfternoonClosingTime");
                                } else if (GoodstargetName.equalsIgnoreCase("SAT") || GoodstargetName.equalsIgnoreCase("SATURDAY")) {
                                    saturdayFlag = true;
                                    businessHrs.SaturdayAMStartTime = getAttrValues(goodsTarget, manager, "MorningOpeningTime");
                                    businessHrs.SaturdayAMEndTime = getAttrValues(goodsTarget, manager, "MorningClosingTime");
                                    businessHrs.SaturdayPMStartTime = getAttrValues(goodsTarget, manager, "AfternoonOpeningTime");
                                    businessHrs.SaturdayPMEndTime = getAttrValues(goodsTarget, manager, "AfternoonClosingTime");
                                } else if (GoodstargetName.equalsIgnoreCase("SUN") || GoodstargetName.equalsIgnoreCase("SUNDAY")) {
                                    sundayFlag = true;
                                    businessHrs.SundayAMStartTime = getAttrValues(goodsTarget, manager, "MorningOpeningTime");
                                    businessHrs.SundayAMEndTime = getAttrValues(goodsTarget, manager, "MorningClosingTime");
                                    businessHrs.SundayPMStartTime = getAttrValues(goodsTarget, manager, "AfternoonOpeningTime");
                                    businessHrs.SundayPMEndTime = getAttrValues(goodsTarget, manager, "AfternoonClosingTime");
                                }
                            }
                            return true;
                        });
                        if (unloadingPoint[j].queryReferences(unloadingrefObj).asList(5).size() == 0) {
                            businessHrs.MondayAMStartTime = "",
                                businessHrs.MondayAMEndTime = "",
                                businessHrs.MondayPMStartTime = "",
                                businessHrs.MondayPMEndTime = "",
                                businessHrs.TuesdayAMStartTime = "",
                                businessHrs.TuesdayAMEndTime = "",
                                businessHrs.TuesdayPMStartTime = "",
                                businessHrs.TuesdayPMEndTime = "",
                                businessHrs.WednesdayAMStartTime = "",
                                businessHrs.WednesdayAMEndTime = "",
                                businessHrs.WednesdayPMStartTime = "",
                                businessHrs.WednesdayPMEndTime = "",
                                businessHrs.ThursdayAMStartTime = "",
                                businessHrs.ThursdayAMEndTime = "",
                                businessHrs.ThursdayPMStartTime = "",
                                businessHrs.ThursdayPMEndTime = "",
                                businessHrs.FridayAMStartTime = "",
                                businessHrs.FridayAMEndTime = "",
                                businessHrs.FridayPMStartTime = "",
                                businessHrs.FridayPMEndTime = "",
                                businessHrs.SaturdayAMStartTime = "",
                                businessHrs.SaturdayAMEndTime = "",
                                businessHrs.SaturdayPMStartTime = "",
                                businessHrs.SaturdayPMEndTime = "",
                                businessHrs.SundayAMStartTime = "",
                                businessHrs.SundayAMEndTime = "",
                                businessHrs.SundayPMStartTime = "",
                                businessHrs.SundayPMEndTime = "";
                        } else if (unloadingPoint[j].queryReferences(unloadingrefObj).asList(5).size() != 0) {
                            if (mondayFlag == false) {
                                businessHrs.MondayAMStartTime = "",
                                    businessHrs.MondayAMEndTime = "",
                                    businessHrs.MondayPMStartTime = "",
                                    businessHrs.MondayPMEndTime = "";
                            }
                            if (tuesdayFlag == false) {
                                businessHrs.TuesdayAMStartTime = "",
                                    businessHrs.TuesdayAMEndTime = "",
                                    businessHrs.TuesdayPMStartTime = "",
                                    businessHrs.TuesdayPMEndTime = "";
                            }
                            if (wednesdayFlag == false) {
                                businessHrs.WednesdayAMStartTime = "",
                                    businessHrs.WednesdayAMEndTime = "",
                                    businessHrs.WednesdayPMStartTime = "",
                                    businessHrs.WednesdayPMEndTime = "";
                            }
                            if (thursdayFlag == false) {
                                businessHrs.ThursdayAMStartTime = "",
                                    businessHrs.ThursdayAMEndTime = "",
                                    businessHrs.ThursdayPMStartTime = "",
                                    businessHrs.ThursdayPMEndTime = "";
                            }
                            if (fridayFlag == false) {
                                businessHrs.FridayAMStartTime = "",
                                    businessHrs.FridayAMEndTime = "",
                                    businessHrs.FridayPMStartTime = "",
                                    businessHrs.FridayPMEndTime = "";
                            }
                            if (saturdayFlag == false) {
                                businessHrs.SaturdayAMStartTime = "",
                                    businessHrs.SaturdayAMEndTime = "",
                                    businessHrs.SaturdayPMStartTime = "",
                                    businessHrs.SaturdayPMEndTime = "";
                            }
                            if (sundayFlag == false) {
                                businessHrs.SundayAMStartTime = "",
                                    businessHrs.SundayAMEndTime = "",
                                    businessHrs.SundayPMStartTime = "",
                                    businessHrs.SundayPMEndTime = "";
                            }
                        }
                        currentRec["BusinessHours"] = businessHrs;
                        output.push(currentRec);
                    }
                }
                // return true;
                // });
                break;
            }
        }
    }
    return output;
}
//When you edit this function , please check the Rafgo requirements , consult with Madan and update it.
function rafgoCustUPMPartnerFunctions(node, manager) {
    //Mapped the same Org attributes as suggested by Erkki and Madan
    var output = [];
    var refObj = manager.getReferenceTypeHome().getReferenceTypeByID("OrganisationRafgoPFData");
    var reference = node.queryReferences(refObj);
    reference.forEach(function(re) {
        var target = re.getTarget();
        var partyrolecode = getRefrenceAttr(target, manager, "PartnerFunctionDataEntityPartnerFunction", "ReferenceDataID", false);
        if (partyrolecode) {
            var currentRec = {};
            currentRec["UPM_PartnerCounter"] = getAttrValues(target, manager, "PartnercounterRafgo");
            currentRec["PartyRoleCode"] = getRefrenceAttr(target, manager, "PartnerFunctionDataEntityPartnerFunction", "ReferenceDataID", false);
            currentRec["PartyInternalID"] = getAttrValues(target, manager, "RafgoPartnerFunctionID");
            currentRec["ReceiverPartyInternalID"] = "";
            currentRec["DefaultIndicator"] = getAttrValues(target, manager, "DefaultPartner");
            output.push(currentRec);
        }
        return true;
    });
    return output;
}
//When you edit this function , please check the Rafgo requirements , consult with Madan and update it.
function rafgoCustRafgoID(node, manager) {
    var attrVal = "";
    var refObj = manager.getReferenceTypeHome().getReferenceTypeByID("OrganisationCustBusinessAreaDataEntity");
    var references = node.queryReferences(refObj).asList(3);
    if (references.size() != 0) {
        var target = references.get(0).getTarget();
        attrVal = getAttrValues(target, manager, "RafgoID");
    }
    return attrVal;
}
//When you edit this function , please check the Rafgo requirements , consult with Madan and update it.
function rafgoCustUPMRafgoIdData(node, manager) {
    var currRec = {};
    var refObj = manager.getReferenceTypeHome().getReferenceTypeByID("OrganisationCustBusinessAreaDataEntity");
    var references = node.queryReferences(refObj).asList(3);
    if (references.size() == 0) {
        var custrefObj = manager.getReferenceTypeHome().getReferenceTypeByID("RafgoOrganization");
        var custreferences = node.queryReferences(custrefObj).asList(3);
        if (custreferences.size() > 0) {
            var sapcust = custreferences.get(0).getTarget();
            currRec["ParentSAPCustomer"] = getAttrValues(sapcust, manager, "EMCustomerNumber");
        } else {
            currRec["ParentSAPCustomer"] = "";
        }
        currRec["ActiveStatus"] = "";
        currRec["IsPrinter"] = "";
        currRec["PaymentStatus"] = "";
        currRec["LetterOfCredit"] = "";
        currRec["IsSupplier"] = "";
        currRec["CustomerUrl"] = "";
        currRec["CustType"] = "";
        currRec["CustomerBrands"] = "";
        currRec["CustSegmentCategory"] = "";
        currRec["CustSegmentProfile"] = "";
        currRec["SheetReelCust"] = "";
        currRec["PrefUom"] = "";
        currRec["serviceVia"] = "";
        currRec["InvoicingVia"] = "";
        currRec["SalesPerson"] = "";
        //currRec["SalesCtryArea"] = "";
        currRec["SalesAssist"] = "";
        currRec["TechSales"] = "";
        currRec["CreditControlInits"] = "";
        currRec["CurrencyCode"] = "";
        currRec["PriceUnit"] = "";
        currRec["PriceUnitText"] = "";
        currRec["PayMethod"] = "";
        currRec["SitePaysRecycling"] = "";
        currRec["EuroValuesNeeded"] = "";
        currRec["TQuality1"] = "";
        currRec["SubProductType"] = "";
        currRec["SAPTOP"] = "";
        currRec["CustAbbr"] = "";
    } else {
        var target = references.get(0).getTarget();
        var custrefObj = manager.getReferenceTypeHome().getReferenceTypeByID("RafgoOrganization");
        var custreferences = node.queryReferences(custrefObj).asList(3);
        if (custreferences.size() > 0) {
            var sapcust = custreferences.get(0).getTarget();
            currRec["ParentSAPCustomer"] = getAttrValues(sapcust, manager, "EMCustomerNumber");
        } else {
            currRec["ParentSAPCustomer"] = "";
        }
        currRec["ActiveStatus"] = getAttrValues(target, manager, "CustomerStatus");
        currRec["IsPrinter"] = (target.getValue("PN").getSimpleValue() == "Printer") ? true : false;
        currRec["PaymentStatus"] = getSingleDCValues(node, manager, "SAPCustomerRoleData", "CreditStatus");
        currRec["LetterOfCredit"] = getAttrValues(target, manager, "LetterofCredit");
        currRec["IsSupplier"] = getAttrValues(target, manager, "RMSupplier");
        currRec["CustomerUrl"] = getAttrValues(target, manager, "CompanyWebsite");
        currRec["CustType"] = getAttrValues(target, manager, "AccountTypeRafgo");
        currRec["CustomerBrands"] = getAttrValues(target, manager, "CustomerBrands");
        currRec["CustSegmentCategory"] = getAttrValues(target, manager, "Segment");
        currRec["CustSegmentProfile"] = getAttrValues(target, manager, "Profile");
        currRec["SheetReelCust"] = getAttrValues(target, manager, "ProductType");
        currRec["PrefUom"] = getAttrValues(target, manager, "PrefUOM");
        currRec["serviceVia"] = getAttrValues(target, manager, "SalesOffice(Raflatac)");
        //Updated InvoicingVia as part of defect 19387 & 21280
        //currRec["InvoicingVia"] = getAttrValues(target, manager, "InvoicingVia");
        currRec["InvoicingVia"] = getAttrValues(node, manager, "InvoicingVia");
        currRec["SalesPerson"] = getRefrenceAttr(target, manager, "RafgoCustomerBADataEntityFS", "BusinessPartnerID", false) ? getRefrenceAttr(target, manager, "RafgoCustomerBADataEntityFS", "BusinessPartnerID", false) : getAttrValues(target, manager, "FieldSales");
        // currRec["SalesCtryArea"] = getAttrValues(target, manager, "SalesPersonID");
        currRec["SalesAssist"] = getRefrenceAttr(target, manager, "RafgoCustomerBADataEntityCSC", "BusinessPartnerID", false) ? getRefrenceAttr(target, manager, "RafgoCustomerBADataEntityCSC", "BusinessPartnerID", false) : getAttrValues(target, manager, "CustomerServiceCoordinator");
        currRec["TechSales"] = getAttrValues(target, manager, "TechnicalSales");
        currRec["CreditControlInits"] = getAttrValues(target, manager, "CreditController");
        currRec["CurrencyCode"] = getAttrValues(target, manager, "InvoicingCurrency");
        currRec["PriceUnit"] = getAttrValues(target, manager, "InvoicingUnit");
        currRec["PriceUnitText"] = getAttrValues(target, manager, "InvoicingUOM");
        currRec["PayMethod"] = getAttrValues(target, manager, "PayMethod");
        currRec["SitePaysRecycling"] = getAttrValues(target, manager, "Recyclingcost");
        currRec["EuroValuesNeeded"] = getAttrValues(target, manager, "EUROinfoneeded");
        currRec["TQuality1"] = getAttrValues(target, manager, "MaterialDescription");
        currRec["SubProductType"] = getAttrValues(target, manager, "SubProductType");
        var payrefObj = manager.getReferenceTypeHome().getReferenceTypeByID("RafgoOrganisationDataEntityPaymentTerm");
        var payreferences = node.queryReferences(payrefObj).asList(3);
        currRec["SAPTOP"] = (payreferences.size() > 0) ? (payreferences.get(0).getTarget().getValue("ReferenceDataID").getSimpleValue() + "") : "";
        //Preethi : 29/05/2025 : Updated Short name as part of defect 21081 
        //currRec["CustAbbr"] = getAttrValues(node, manager, "ShortNameRafgo");
        currRec["CustAbbr"] = getAttrValues(target, manager, "ShortNameRafgo");
    }
    return currRec;
}
//When you edit this function , please check the Rafgo requirements , consult with Madan and update it.
function rafgoCustBankMasterData(dcObj, manager) {
    var bmdata = {};
    var dcbankRef = dcObj.getDataContainerReferences(manager.getReferenceTypeHome().getReferenceTypeByID("SAPBankAccountDataBankMaster"));
    if (!dcbankRef.isEmpty()) {
        var bmObj = dcbankRef.get(0).getTarget();
        var localDCObj = bmObj.getDataContainerByTypeID("LocalLanguageAddress").getDataContainerObject();
        if (localDCObj == null) {
            //LocalLanguage DC is null.
            bmdata["BankName1Local"] = "";
            bmdata["BankAddr1Local"] = "";
            bmdata["BankAddr2Local"] = "";
        } else {
            //LocalLanguage DC is not null.
            //check with madan
            bmdata["BankName1Local"] = getAttrValues(localDCObj, manager, "BankNameInLocalLanguage1");
            bmdata["BankAddr1Local"] = getAttrValues(localDCObj, manager, "BankStreetInLocalLanguage1");
            bmdata["BankAddr2Local"] = getAttrValues(localDCObj, manager, "CityInLocalLanguage");
        }
        var mainDCObj = bmObj.getDataContainerByTypeID("MainAddressDataContainer").getDataContainerObject();
        if (mainDCObj == null) {
            //main DC is null.
            bmdata["BankAddr1"] = "";
            bmdata["BankAddr2"] = "";
        } else {
            bmdata["BankAddr1"] = getAttrValues(mainDCObj, manager, "Street");
            bmdata["BankAddr2"] = getAttrValues(mainDCObj, manager, "City");
        }
    } else {
        bmdata["BankName1Local"] = "";
        bmdata["BankAddr1Local"] = "";
        bmdata["BankAddr2Local"] = "";
        bmdata["BankAddr1"] = "";
        bmdata["BankAddr2"] = "";
    }
    return bmdata;
}
//When you edit this function , please check the Rafgo requirements , consult with Madan and update it.
function rafgoCustBankDetails(node, manager, dcID) {
    var output = [];
    var dc = node.getDataContainerByTypeID(dcID).getDataContainers();
    if (dc.size() != 0) {
        var itr = dc.iterator();
        while (itr.hasNext()) {
            var currentRec = {};
            var dcObj = itr.next().getDataContainerObject();
            var bankKey = getAttrValues(dcObj, manager, "BankKeyInternal");
            var bankCountry = getAttrValues(dcObj, manager, "Country");
            var partnerBank = getAttrValues(dcObj, manager, "PartnerBankType");
            if (partnerBank) {
                currentRec["UPM_Currency"] = getAttrValues(dcObj, manager, "UPMCurrency");
                currentRec["UPM_DefaultIndicator"] = (getAttrValues(dcObj, manager, "BankAccountSequenceNumber") == "1") ? true : false;
                currentRec["UPM_BankMasterData"] = rafgoCustBankMasterData(dcObj, manager);
                currentRec["ID"] = getAttrValues(dcObj, manager, "PartnerBankType");
                var bankRef = {};
                bankRef["BankStandardID"] = bankKey;
                bankRef["BankCountryCode"] = bankCountry;
                bankRef["BankInternalID"] = bankKey;
                currentRec["BankDirectoryReference"] = bankRef;
                var dcbankRef = dcObj.getDataContainerReferences(manager.getReferenceTypeHome().getReferenceTypeByID("SAPBankAccountDataBankMaster"));
                if (!dcbankRef.isEmpty()) {
                    currentRec["Name"] = dcbankRef.get(0).getTarget().getValue("BankName").getSimpleValue() + "";
                } else {
                    currentRec["Name"] = "";
                }
                currentRec["BankAccountID"] = getAttrValues(dcObj, manager, "SAP-BANKN");
                currentRec["BankAccountStandardID"] = getAttrValues(dcObj, manager, "SAP-IBAN");
                currentRec["BankAccountHolderName"] = getAttrValues(dcObj, manager, "BankAccountHolder");
                var validity = {};
                validity["StartDate"] = getAttrValues(dcObj, manager, "ValidFrom");
                validity["EndDate"] = getAttrValues(dcObj, manager, "ValidTo");
                currentRec["ValidityPeriod"] = validity;
                //currentRec["CollectionAuthorisationIndicator"] = getAttrValues(dcObj, manager, "IHCCollectionAuthorization");
                var ihcIndicator = getAttrValues(dcObj, manager, "IHCCollectionAuthorization");
                currentRec["CollectionAuthorisationIndicator"] = (ihcIndicator == true) ? "X" : "";
                currentRec["BankControlKey"] = getAttrValues(dcObj, manager, "ControlKey");
                currentRec["SpecificationsDescription"] = getAttrValues(dcObj, manager, "ReferenceDetails");
                output.push(currentRec);
            }
        }
    }
    return output;
}
function parseAddress(addressString) {
    if (!addressString) return {
        streetName: "",
        streetNumber: ""
    };
    var line = addressString.trim();
    // Regex to capture number at the beginning or end of the string
    var regex = /^(\d+)?\s*(.*?)\s*(\d+)?$/;
    var match = line.match(regex);
    if (match) {
        var streetNumber = match[1] || match[3] || ""; // Get prefix or suffix number
        var streetName = match[2].trim(); // Get the street name
        return {
            streetName: streetName,
            streetNumber: streetNumber
        };
    } else {
        return {
            streetName: line,
            streetNumber: ""
        };
    }
}
function customerText(node, manager) {
    var output = [];
    var dc = node.getDataContainerByTypeID("3PLocalLanguageAddress").getDataContainers();
    if (dc.size() != 0) {
        var itr = dc.iterator();
        while (itr.hasNext()) {
            var dcObj = itr.next().getDataContainerObject();
            var current = {};
            current.LanguageCode = getAttrValues(dcObj, manager, "LocalLanguageVersion");
            output.push(current);
        }
    }
    return output;
}
function zcumill(node, manager) {
    var output = [];
    if (node != null) {
        var dc = node.getDataContainerByTypeID("ZCUMILL").getDataContainers();
        if (dc.size() != 0) {
            var itr = dc.iterator();
            while (itr.hasNext()) {
                var currentRec = {};
                var dcObj = itr.next().getDataContainerObject();
                if (getAttrValues(dcObj, manager, "ManufacturingMill") != null) {
                    currentRec["ZZMWERKS"] = (getAttrValues(dcObj, manager, "ManufacturingMill")) ? getAttrValues(dcObj, manager, "ManufacturingMill").split('_')[1] + "" : "";
                    currentRec["ZZTRMODE"] = (getAttrValues(dcObj, manager, "TransportModeLastLeg")) ? getAttrValues(dcObj, manager, "TransportModeLastLeg").split('_')[1] + "" : "";
                    currentRec["ZZVTYPE"] = (getAttrValues(dcObj, manager, "TranUnitType")) ? getAttrValues(dcObj, manager, "TranUnitType").split('_')[1] + "" : "";
                    //Preethi : 06-May-2025 : ZZLDSC should be an array as part of defect 20174
                    currentRec["ZZLDSC"] = getAttrValues(dcObj, manager, "LoadingInstructions");
                    currentRec["ZZSTACRULE"] = (getAttrValues(dcObj, manager, "StackingRule")) ? getAttrValues(dcObj, manager, "StackingRule").split('_')[1] + "" : "";
                    currentRec["ZZROWRESTR"] = (getAttrValues(dcObj, manager, "RowRestricions")) ? getAttrValues(dcObj, manager, "RowRestricions").split('_')[1] + "" : "";
                    currentRec["ZZTRUSP"] = (getAttrValues(dcObj, manager, "TrUnitSpecProp")) ? getAttrValues(dcObj, manager, "TrUnitSpecProp").split('_')[1] + "" : "";
                    currentRec["ZZBCTYPE"] = (getAttrValues(dcObj, manager, "BarcodeType")) ? getAttrValues(dcObj, manager, "BarcodeType").split('_')[1] + "" : "";
                    currentRec["ZZLABELCONT"] = (getAttrValues(dcObj, manager, "LabelContent")) ? getAttrValues(dcObj, manager, "LabelContent").split('_')[1] + "" : "";
                    currentRec["ZZWERKS"] = (getAttrValues(dcObj, manager, "DeliveringPlant(Paper)")) ? getAttrValues(dcObj, manager, "DeliveringPlant(Paper)").split('_')[1] + "" : "";
                    currentRec["ZZFREESTD"] = getAttrValues(dcObj, manager, "FreeStockingDays");
                    currentRec["ZZLDMODRL"] = (getAttrValues(dcObj, manager, "RLLoadingType")) ? getAttrValues(dcObj, manager, "RLLoadingType").split('_')[1] + "" : "";
                    currentRec["ZZLDMODSH"] = (getAttrValues(dcObj, manager, "SHLoadingType")) ? getAttrValues(dcObj, manager, "SHLoadingType").split('_')[1] + "" : "";
                    currentRec["ZZNUMLABELSH"] = (getAttrValues(dcObj, manager, "Numberoflabelsforsheets")) ? getAttrValues(dcObj, manager, "Numberoflabelsforsheets").split('_')[1] + "" : "";
                    currentRec["ZZNUMLABELRL"] = (getAttrValues(dcObj, manager, "Numberoflabelsforreels")) ? getAttrValues(dcObj, manager, "Numberoflabelsforreels").split('_')[1] + "" : "";
                    //Preethi : 26-June-2025 - Added as part of 21062
                    var payementRef = dcObj.getDataContainerReferences(manager.getReferenceTypeHome().getReferenceTypeByID("SalesAreaDataEntityPaymentTerm"));
                    if (!payementRef.isEmpty()) {
                        currentRec["ZZDZTERM"] = payementRef.get(0).getTarget().getValue("ReferenceDataID").getSimpleValue() + "";
                    } else {
                        currentRec["ZZDZTERM"] = "";
                    }
                    output.push(currentRec);
                }
            }
        }
    }
    return output;
}
//Preethi : Added this function as part of defect 18084(Business area specific Email)
function businessSpecificEmailCall(node, manager) {
    var customerRole = false;
    var vendorRole = false;
    var splitJSON = false;
    var emailCall = false;
    var bpRole = node.getValue("BPRoleTech").getValues();
    for (var i = 0; i < bpRole.size(); i++) {
        if (bpRole.get(i).getValue() == "Customer") {
            customerRole = true;
        }
        if (bpRole.get(i).getValue() == "Vendor") {
            vendorRole = true;
        }
    }
    if (customerRole == true && vendorRole == true) {
        var custaccgrp = getRefrenceAttr(node, manager, "SAPCustomerAccountGroup", "AccountGroupID", false);
        var supaccgrp = getRefrenceAttr(node, manager, "SAPSupplierAccountGroup", "AccountGroupID", false);
        if (custaccgrp == "ZTPY" && supaccgrp == "ZTPY") {
            splitJSON = true;
        }
        workflowIndicator = node.getValue("WorkflowIndicator").getSimpleValue();
        if ((splitJSON == true && workflowIndicator == "Vendor") || (splitJSON == false)) {
            emailCall = true;
        }
    } else if (vendorRole == true && customerRole == false) {
        emailCall = true;
    }
    return emailCall;
}
//Preethi : Added this function as part of defect 18084(Business area specific Email)
function businessAreaSpecificEmail(businessArea, manager) {
    var currentRec = {};
    var dcObj = businessArea.getDataContainerByTypeID("EmailDataContainerBusinessArea").getDataContainerObject();
    if (dcObj != null) {
        var defaultFlag = getAttrValues(dcObj, manager, "DefaultEmailAddress");
        var sequenceNumber = getAttrValues(dcObj, manager, "EmailSequenceNumber");
        if (sequenceNumber) {
            currentRec["UPM_BusinessArea"] = getRefrenceAttr(businessArea, manager, "SAPBusinessAreaDataEntityBusinessArea", "ReferenceDataID", false)
            currentRec["UPM_SequenceNumber"] = getAttrValues(dcObj, manager, "EmailSequenceNumber");
            currentRec["URI"] = getAttrValues(dcObj, manager, "EmailAddress");
            var validity = {};
            validity["StartDate"] = "";
            validity["EndDate"] = "";
            currentRec["ValidityPeriod"] = validity;
            var emailNoteArr = [];
            //var notekey = getAttrValues(dcObj, manager, "EmailNotes");
            //if (notekey) {
            //Preethi : 15-July-2025 : Added as part of Ariba changes. Erkki has provided the logic
            var emailNoteTextAttr = getAttrValues(dcObj, manager, "EmailNotes");
            var emailNoteDesc = getAttrValues(dcObj, manager, "EmailNotesDescription");
            if (emailNoteTextAttr || emailNoteDesc) {
                var noteData = {};
                //noteData["Note"] = getAttrValues(dcObj, manager, "EmailNotes");
                if (emailNoteDesc && emailNoteDesc == "Other") {
                    noteData["Note"] = emailNoteTextAttr;
                } else {
                    noteData["Note"] = emailNoteDesc;
                }
                emailNoteArr.push(noteData);
            }
            currentRec["EmailNote"] = emailNoteArr;
            var emailUsage = [];
            var code = defaultFlag == true ? "AD_DEFAULT" + "" : "AD_HOME" + "";
            if (code) {
                var usageData = {};
                usageData.Usage = {};
                usageData.Usage.Code = defaultFlag == true ? "AD_DEFAULT" + "" : "AD_HOME" + "";
                usageData.Usage.ValidityPeriod = {};
                usageData.Usage.ValidityPeriod.StartDate = "";
                usageData.Usage.ValidityPeriod.EndDate = "";
                emailUsage.push(usageData);
            }
            currentRec["EmailUsage"] = emailUsage;
            usageData.DefaultIndicator = getAttrValues(dcObj, manager, "DefaultEmailAddress");
        }
    }
    return currentRec;
}
//Added as part of 20508
function creditSegment(node, manager) {
    var output = [];
    var custCompanyCode = getRefMultiValues(node, manager, "CustBADataEntityCCDataEntity", null, false);
    for (var i = 0; i < custCompanyCode.length; i++) {
        var ccadObj = manager.getReferenceTypeHome().getReferenceTypeByID("CustCCDataEntityCCADataEntity");
        var ccdareference = custCompanyCode[i].queryReferences(ccadObj).asList(2);
        if (ccdareference.size() != 0) {
            var ccda = ccdareference.get(0).getTarget();
            var creditSegRef = getRefMultiValues(ccda, manager, "OrgDataEntityCreditSegment", null, false)
            if (creditSegRef.length != 0) {
                for (var j = 0; j < creditSegRef.length; j++) {
                    var currentRec = {};
                    currentRec["CreditSegment"] = getAttrValues(creditSegRef[j], manager, "ReferenceDataID");
                    currentRec["CreditLimit"] = getAttrValues(ccda, manager, "CreditLimit");
                    output.push(currentRec);
                }
            }
        }
    }
    return output;
}
//Added as part of 19986
function deliveryHours(node, manager, attrID) {
    var attrval = "";
    var hrs = node.getValue(attrID).getSimpleValue();
    if (hrs) {
        attrval = hrs + ":00" + "";
    }
    return attrval;
}
//Added as part of 21272
function upmPermittedPayer(node, manager) {
    var output = [];
    var refObj = manager.getReferenceTypeHome().getReferenceTypeByID("AllowedPayer");
    var reference = node.queryReferences(refObj);
    reference.forEach(function(re) {
        var target = re.getTarget();
        var currentRec = {};
        currentRec["PermittedPayerInternalID"] = checkInternalId(target, manager, "EMCustomerNumber");
        output.push(currentRec)
        return true;
    });
    //Added as part of RFC 21951
    var removedAllowedpayer = node.getValue("RemovedAllowedPayer").getSimpleValue();
    if(removedAllowedpayer) {
	    var removedAllowedpayerList = removedAllowedpayer.split(",");
	    for (var k = 0; k < removedAllowedpayerList.length; k++) {
	    		var currentRec = {};
	    		currentRec["DeletedIndicator"] = true;
	    		currentRec["PermittedPayerInternalID"] = removedAllowedpayerList[k];	    		
	    		output.push(currentRec);
	    }
    }
    return output;
}
//Added as part of 21737
function getBranchCodeThailand(node,manager) {
	var attr = "";
	var baRefObj = manager.getReferenceTypeHome().getReferenceTypeByID("CustBADataEntityCCDataEntity");
	var baReferences = node.queryReferencedBy(baRefObj).asList(50);
	for (var i = 0; i < baReferences.size(); i++) {
		var source = baReferences.get(i).getSource();
		var objectType = source.getObjectType().getID();
		if(objectType == "SAPOrganisationCustomerBusinessAreaData"){
			attr = getAttrValues(source, manager, "BranchCodeThailand");
			break;
		}
	}
	return attr;
}
//Added as part of 21945
function getAribaAddressDetails(node, manager, dcID, descAttrID, descAttrValue, targetAttrID) {
    var result = "";
    var dc = node.getDataContainerByTypeID(dcID).getDataContainers();
    if (dc.size() != 0) {
        var itr = dc.iterator();
        while (itr.hasNext()) {
            var desc = "";
            var dcObj = itr.next().getDataContainerObject();
           desc = getAttrValues(dcObj, manager, descAttrID);
           if (desc && desc == descAttrValue) {
               result = getAttrValues(dcObj, manager, targetAttrID);
               break;
           }            
        }
    }
    return result;
}

// Defect ID 21550. PurchasingTextDetails DC attributes
function getPurchasingTextDcAttributes(node, manager, dcID) {
    var output = [];
    var dc = node.getDataContainerByTypeID(dcID).getDataContainers();
    if (dc.size() != 0) {
        var itr = dc.iterator();
        while (itr.hasNext()) {
            var currentRec = {};
            var dcObj = itr.next().getDataContainerObject();
			currentRec["TextTypeCode"] = getAttrValues(dcObj, manager, "PurchasingTextDescription");
			currentRec["LanguageCode"] = getAttrValues(dcObj, manager, "UPMLanguage");
			currentRec.TextSAPScriptLine = [];
			var textSAPScript = {};
			textSAPScript["SAPScriptLineText"] = getAttrValues(dcObj, manager, "PurchasingText");
			currentRec.TextSAPScriptLine.push(textSAPScript);
			output.push(currentRec);
        }
    }
    return output;
}
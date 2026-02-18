function setRequestorNSubmittedDate(node, manager, workflowId, dateTimePattern) {
    var user = manager.getCurrentUser();
    var workflowInstance = node.getWorkflowInstanceByID(workflowId);
    workflowInstance.setSimpleVariable("requestor", user.getName());
    workflowInstance.setSimpleVariable("requestorId", user.getID());
    workflowInstance.setSimpleVariable("requestSubmittedDate", getNowDateTimeAsString(dateTimePattern));
}

function getNowDateTimeAsString(pattern) {
    var nowDate = getNowDateTime();
    var formatter = java.time.format.DateTimeFormatter.ofPattern(pattern);
    return nowDate.format(formatter);
}

function getNowDateTime() {
    var zone = null
        return zone == null ? java.time.LocalDateTime.now() : java.time.LocalDateTime.now(zone);
}

function attachSingleDC(node, manager, lookup, dcTypeId, attrValueJSON, refValueJSON) {
    var dc = node.getDataContainerByTypeID(dcTypeId);
    var dcKey = buildDCKeyOfDC(manager, dcTypeId, lookup, attrValueJSON);
    if (dcKey != null) {
        dcObj = dc.createDataContainerObjectWithKey(dcKey);
    } else {
        dcObj = dc.createDataContainerObject(dcKey);
    }
    if (attrValueJSON != null) {
        for (var key in attrValueJSON) {
            try {
                dcObj.getValue(key).setSimpleValue(attrValueJSON[key]);
            } catch (e) {
                if (!(e.javaException instanceof com.stibo.core.domain.ValidatorException)) {
                    throw (e);
                } else {
                    logger.warning("Exception occurred during setting value for attribute: " + key + ", value: " + attrValueJSON[key] + ", error => " + e);
                }
            }
        }
    }
    if (refValueJSON != null) {
        //TODO if require
    }
}

function buildDCKeyOfDC(manager, dcTypeId, lookup, attrValueJSON) {
    var keyAttrs = lookup.getLookupTableValue("DataContainerTypeToKey", dcTypeId);
    if (keyAttrs != null) {
        var keyBuilder = manager.getHome(com.stibo.core.domain.datacontainerkey.keyhome.DataContainerKeyHome).getDataContainerKeyBuilder(dcTypeId);
        var keyAttrsArr = keyAttrs.split(",");
        for (var i = 0; i < keyAttrsArr.length; i++) {
            keyBuilder.withAttributeValue(keyAttrsArr[i].trim(), attrValueJSON[keyAttrsArr[i].trim()]);
        }
        return keyBuilder.build();
    }
    return null;
}

function mandatoryAttrCheckOfSingleDC(node, manager, dcTypeId, attrGrpId, attrNameJSON) {
    //	var errorMsg = "";//ARKR Commented the line
    var dc = node.getDataContainerByTypeID(dcTypeId);
    return mandatoryAttrCheckForSingleDCObj(manager, dc, attrGrpId, attrNameJSON);
}

function mandatoryAttrCheckForSingleDCObj(manager, dc, attrGrpId, attrNameJSON) {
    var errorMsg = "";
    var dcObj = dc.getDataContainerObject();
    var attributes = manager.getAttributeGroupHome().getAttributeGroupByID(attrGrpId).getAttributes();
    var attributesItr = attributes.iterator();
    while (attributesItr.hasNext()) {
        var attribute = attributesItr.next();
        var value = dcObj.getValue(attribute.getID()).getSimpleValue();
        if (value == null || "".equals(value.trim())) {
            var attrName = attrNameJSON != null ? attrNameJSON[attribute.getID()] != null ? attrNameJSON[attribute.getID()] : attribute.getName() : attribute.getName();
            errorMsg += errorMsg.length == 0 ? attrName : ", " + attrName;
        }
    }
    return errorMsg.length == 0 ? true : "Mandatory attributes are missing for " + dc.getDataContainerType().getName() + ": " + errorMsg;
}

function isDataContainerNotPresent(node, dcTypeId) {
    var dc = node.getDataContainerByTypeID(dcTypeId);
    if (dc.getDataContainerType().isMultiValued()) {
        return isCollectionOrMapEmpty(dc.getDataContainers());
    } else {
        return dc.getDataContainerObject() == null;
    }
}

function isCollectionOrMapEmpty(collectionOrMap) {
    return collectionOrMap == null || collectionOrMap.isEmpty();
}

function isCollectionOrMapNotEmpty(collectionOrMap) {
    return !isCollectionOrMapEmpty(collectionOrMap);
}

function mandatoryAttrCheckOfMultiDC(node, manager, dcTypeId, attrGrpId, attrNameJSON) {
    var result = "";
    var dc = node.getDataContainerByTypeID(dcTypeId);
    var singleDCs = dc.getDataContainers();
    var singleDCsItr = singleDCs.iterator();
    while (singleDCsItr.hasNext()) {
        var singleDC = singleDCsItr.next();
        result = mandatoryAttrCheckForSingleDCObj(manager, singleDC, attrGrpId, attrNameJSON);
        if (result != true) {
            break;
        }
    }
    return result;
}

function copyReferences(sourceNode, targetNode, sourceRefType, targetRefType, metaDataAttrGrp) {
    var references = new java.util.ArrayList();
    var sourceRefs = sourceNode.queryReferences(sourceRefType);
    sourceRefs.forEach(function (reference) {
        references.add(reference)
        if (references.size() == 500) {
            copyRefs(targetNode, references, targetRefType, metaDataAttrGrp);
        }
        return true;
    });
    copyRefs(targetNode, references, targetRefType, metaDataAttrGrp);
}

function copyRefs(targetNode, references, targetRefType, metaDataAttrGrp) {
    for (var i = 0; i < references.size(); i++) {
        try {
            var reference = targetNode.createReference(references.get(i).getTarget(), targetRefType);
            if (metaDataAttrGrp != null) {
                copyReferenceMetaData(references.get(i), reference, metaDataAttrGrp);
            }
        } catch (e) {
            if (!(e.javaException instanceof com.stibo.core.domain.UniqueConstraintException)) {
                throw (e);
            }
        }
    }
    references.clear();
}

function copyReferenceMetaData(sourceRef, targetRef, metaDataAttrGrp) {
    var attributes = metaDataAttrGrp.getAttributes();
    var attributesItr = attributes.iterator();
    while (attributesItr.hasNext()) {
        var attribute = attributesItr.next();
        if (attribute.hasLOV()) {
            targetRef.getValue(attribute.getID()).setLOVValueByID(sourceRef.getValue(attribute.getID()).getID());
        } else {
            targetRef.getValue(attribute.getID()).setSimpleValue(sourceRef.getValue(attribute.getID()).getSimpleValue());
        }
    }
}

function deleteReferences(node, refType) {
    var references = new java.util.ArrayList();
    var refs = node.queryReferences(refType);
    refs.forEach(function (reference) {
        references.add(reference)
        if (references.size() == 500) {
            deleteRefs(references);
            references.clear();
        }
        return true;
    });
    deleteRefs(references);
}

function deleteRefs(references) {
    for (var i = 0; i < references.size(); i++) {
        references.get(i).delete();
    }
}

function isWhiteSpacePresent(value) {
    return /\s/.test(value);
}

function isDoubleWhiteSpacePresent(value) {
    return /\s{2}/.test(value);
}

function isInteger(value) {
    try {
        java.lang.Long.valueOf(value);
    } catch (e) {
        if (e.javaException instanceof java.lang.NumberFormatException) {
            return false;
        } else {
            throw (e);
        }
    }
    return true;
}

function isUpperCase(value) {
    return value.toUpperCase().equals(value) ? true : false;
}

function populateReferenceMetaData(node, manager, refType, attrIDValueJSON) {
    var references = new java.util.ArrayList();
    var refs = node.queryReferences(refType);
    refs.forEach(function (reference) {
        references.add(reference);
        if (references.size() == 500) {
            populateMetadata(manager, references, attrIDValueJSON);
        }
        return true;
    });
    populateMetadata(manager, references, attrIDValueJSON);
}

function populateMetadata(manager, references, attrIDValueJSON) {
    for (var i = 0; i < references.size(); i++) {
        for (var attributeId in attrIDValueJSON) {
            var reference = references.get(i);
            var isCopyRequire = attrIDValueJSON[attributeId][1] ? true : reference.getValue(attributeId).getSimpleValue() == null;
            if (isCopyRequire) {
                var attribute = manager.getAttributeHome().getAttributeByID(attributeId);
                if (attribute.hasLOV()) {
                    reference.getValue(attributeId).setLOVValueByID(attrIDValueJSON[attributeId][0]);
                } else {
                    reference.getValue(attributeId).setSimpleValue(attrIDValueJSON[attributeId][0]);
                }
            }
        }
    }
    references.clear();
}

function approveReferenceTargets(node, refTypes) {
    var references = new java.util.ArrayList();
    for (var i = 0; i < refTypes.length; i++) {
        var refs = node.queryReferences(refTypes[i]);
        refs.forEach(function (reference) {
            references.add(reference);
            if (references.size() == 500) {
                approveReferenceTarget(references);
            }
            return true;
        });
        approveReferenceTarget(references);
    }
}

function approveReferenceTarget(references) {
    for (var i = 0; i < references.size(); i++) {
        references.get(i).getTarget().approve();
    }
    references.clear();
}

function setAssetNameFromMetaData(node, refType, attrIdArrForName) {
    var references = new java.util.ArrayList();
    var refs = node.queryReferences(refType);
    refs.forEach(function (reference) {
        references.add(reference);
        if (references.size() == 500) {
            setAsetNameFromMetaData(references, attrIdArrForName);
            references.clear();
        }
        return true;
    });
    setAsetNameFromMetaData(references);
}

function setAsetNameFromMetaData(references, attrIdArr) {
    for (var i = 0; i < references.size(); i++) {
        var name = "";
        for (var j = 0; j < attrIdArr.length; j++) {
            var value = getNotNullValue(references.get(i), attrIdArr[j]) + ""
                name = name.length == 0 ? value : value.length == 0 ? name : name + " " + value;
        }
        references.get(i).getTarget().setName(name);
    }
}

function getNotNullValue(node, attributeId) {
    if (node.getValue(attributeId).getSimpleValue() != null) {
        return node.getValue(attributeId).getSimpleValue();
    }
    return "";
}

function getApprovedNode(node, manager) {
    return manager.executeInWorkspace("Approved", function (approvedManager) {
        return approvedManager.getObjectFromOtherManager(node);
    });
}

function syncAttriValuesFromApproveToMain(node, manager, attrGrp) {
    var approvedNode = getApprovedNode(node, manager);
    if (approvedNode) {
        var attributes = attrGrp.getAttributes();
        var attributesItr = attributes.iterator();
        while (attributesItr.hasNext()) {
            var attribute = attributesItr.next();
            if (!isAttributeValueSame(node, approvedNode, attribute)) {
                var approvedValue = approvedNode.getValue(attribute.getID()).getSimpleValue();
                if (approvedValue != null) {
                    node.getValue(attribute.getID()).setSimpleValue(approvedValue);
                } else {
                    node.getValue(attribute.getID()).deleteCurrent();
                }
            }
        }
    }
}

function syncDCFromApproveToMain(node, manager, attrGrp, lookup) {
    var approvedNode = getApprovedNode(node, manager);
    var dcTypes = attrGrp.getDataContainerTypes();
    var dcTypesItr = dcTypes.iterator();
    while (dcTypesItr.hasNext()) {
        var dcType = dcTypesItr.next();
        syncDataContainer(manager, approvedNode, node, dcType, lookup);
    }
}

function isAttributeValueSame(node1, node2, attribute) {
    if (attribute.isMultiValued()) {
        return isAttributeValueSameForMultiValued(node1, node2, attribute);
    } else {
        return isAttributeValueSameForSingleValued(node1, node2, attribute);
    }
}

function isAttributeValueSameForMultiValued(node1, node2, attribute) {
    var node1Values = node1.getValue(attribute.getID()).getValues();
    var node2Values = node2.getValue(attribute.getID()).getValues();
    if (node1Values.size() == node2Values.size()) {
        for (var i = 0; i < node1Values.size(); i++) {
            var node1Value = node1Values.get(i).getSimpleValue();
            var node2Value = node2Values.get(i).getSimpleValue();
            if (!isValueSame(node1Value, node2Value)) {
                return false;
            }
        }
        return true;
    }
    return false;
}

function isAttributeValueSameForSingleValued(node1, node2, attribute) {
    return isValueSame(node1.getValue(attribute.getID()).getSimpleValue(), node2.getValue(attribute.getID()).getSimpleValue());
}

function isValueSame(value1, value2) {
    return (value1 == null && value2 == null) || (value1 != null && value1.equals(value2));
}

function syncDataContainer(manager, sourceNode, targetNode, dcType, lookup) {
    if (dcType.isMultiValued()) {
        syncDataContainerMultiValued(manager, sourceNode, targetNode, dcType, lookup);
    } else {
        syncDataContainerSingleValued(manager, sourceNode, targetNode, dcType, lookup);
    }

}

function syncDataContainerSingleValued(manager, sourceNode, targetNode, dcType, lookup) {
    var dcKey = lookup.getLookupTableValue("DataContainerTypeAndKey", dcType.getID());
    var sourceDC = sourceNode.getDataContainerByTypeID(dcType.getID());
    var sourceDCObj = sourceDC.getDataContainerObject();
    var targetDC = targetNode.getDataContainerByTypeID(dcType.getID());
    var targetDCObj = targetDC.getDataContainerObject();
    if (sourceDCObj == null) {
        targetDC.deleteLocal();
    } else if (sourceDCObj != null && targetDCObj == null) {
        copyDCObject(manager, sourceDCObj, targetDC, lookup);
    } else {
        copyValueFromSourceToTargetDC(dcType, sourceDCObj, targetDCObj);
    }
}

function copyDCObject(manager, sourceDCObject, targetDC, lookup) {
    var dcKey = buildDCKeyFromDCObject(manager, sourceDCObject, targetDC.getDataContainerType().getID(), lookup);
    var targetDCObj = null;
    if (dcKey != null) {
        targetDCObj = targetDC.createDataContainerObjectWithKey(dcKey);
    } else {
        targetDCObj = targetDC.createDataContainerObject(dcKey);
    }
    copyValueFromSourceToTargetDC(targetDC.getDataContainerType(), sourceDCObject, targetDCObj);
}

function buildDCKeyFromDCObject(manager, dcObject, dcTypeId, lookup) {
    var keyAttrs = lookup.getLookupTableValue("DataContainerTypeToKey", dcTypeId);
    if (keyAttrs != null) {
        var keyBuilder = manager.getHome(com.stibo.core.domain.datacontainerkey.keyhome.DataContainerKeyHome).getDataContainerKeyBuilder(dcTypeId);
        var keyAttrsArr = keyAttrs.split(",");
        for (var i = 0; i < keyAttrsArr.length; i++) {
            keyBuilder.withAttributeValue(keyAttrsArr[i].trim(), dcObject.getValue(keyAttrsArr[i].trim()).getSimpleValue());
        }
        return keyBuilder.build();
    }
    return null;
}

//V812109: 22096;
function copyValueFromSourceToTargetDC(dcType, sourceDCObj, targetDCObj) {
    var attributes = dcType.getValidDescriptionAttributes();
    var attributesItr = attributes.iterator();
    while (attributesItr.hasNext()) {
        var attribute = attributesItr.next();
        if (!attribute.isDerived()) {
            var sourceValue = sourceDCObj.getValue(attribute.getID()).getSimpleValue();
            if (sourceValue == null) {
                targetDCObj.getValue(attribute.getID()).deleteCurrent();
            } else {
                if (attribute.hasLOV() && !(attribute.isMultiValued())) {
                    sourceValue = sourceDCObj.getValue(attribute.getID()).getLOVValue();
                    if (sourceValue) {
                        sourceValue = sourceValue.getID();
                        targetDCObj.getValue(attribute.getID()).setLOVValueByID(sourceValue);
                    }
                } else {
                    targetDCObj.getValue(attribute.getID()).setSimpleValue(sourceValue);
                }
            }
        }
    }
}

function syncNameFromApproveToMain(node, manager) {
    var approvedNode = getApprovedNode(node, manager);
    node.setName(approvedNode.getName());
}

//Parse Swiftref Response

function parseSwiftRefResponse(restData, node) {
    var json = JSON.parse(restData);
    if (node.getValue("BankKeyType").getSimpleValue() == "SWIFT / BIC code") {
        if (json.structured_address.country_code) {
            node.getValue("BankCountrySwiftRef").setLOVValueByID(json.structured_address.country_code);
        }
        if (json.bic) {
            node.getValue("SWIFTBICSwiftRef").setSimpleValue(json.bic);
        }
        if (json.structured_address.department) {
            node.getValue("BankBranchSwiftRef").setSimpleValue(json.structured_address.department);
        }
        if (json.name) {
            node.getValue("BankNameSwiftRef").setSimpleValue(json.name);
        }
        if (json.structured_address.street_name) {
            node.getValue("BankStreetSwiftRef").setSimpleValue(json.structured_address.street_name);
        }
        if (json.structured_address.building_number) {
            node.getValue("StreetNumberSwiftRef").setSimpleValue(json.structured_address.building_number);
        }
        if (json.structured_address.post_code) {
            node.getValue("BankPostalCodeSwiftRef").setSimpleValue(json.structured_address.post_code);
        }
        if (json.structured_address.town_name) {
            node.getValue("BankCitySwiftRef").setSimpleValue(json.structured_address.town_name);
        }
        if (json.structured_address.country_subdivision_name) {
            node.getValue("BankRegionSwiftRef").setSimpleValue(json.structured_address.country_subdivision_name);
        }
    } else if (node.getValue("BankKeyType").getSimpleValue() == "Bank Number" || node.getValue("BankKeyType").getSimpleValue() == "Bankgiro") {
        if (json.national_ids[0].structured_address.country_code) {
            node.getValue("BankCountrySwiftRef").setLOVValueByID(json.national_ids[0].structured_address.country_code);
        }
        if (json.national_ids[0].national_id) {
            //node.getValue("SWIFTBICSwiftRef").setSimpleValue(json.bic);
            node.getValue("BankNumberSwiftRef").setSimpleValue(json.national_ids[0].national_id);
        }
        if (json.national_ids[0].department) {
            node.getValue("BankBranchSwiftRef").setSimpleValue(json.national_ids[0].department);
        }
        if (json.national_ids[0].name) {
            node.getValue("BankNameSwiftRef").setSimpleValue(json.national_ids[0].name);
        }
        if (json.national_ids[0].structured_address.street_name) {
            node.getValue("BankStreetSwiftRef").setSimpleValue(json.national_ids[0].structured_address.street_name);
        }
        if (json.national_ids[0].structured_address.building_number) {
            node.getValue("StreetNumberSwiftRef").setSimpleValue(json.national_ids[0].structured_address.building_number);
        }
        if (json.national_ids[0].structured_address.post_code) {
            node.getValue("BankPostalCodeSwiftRef").setSimpleValue(json.national_ids[0].structured_address.post_code);
        }
        if (json.national_ids[0].structured_address.town_name) {
            node.getValue("BankCitySwiftRef").setSimpleValue(json.national_ids[0].structured_address.town_name);
        }
        if (json.national_ids[0].structured_address.country_subdivision_name) {
            node.getValue("BankRegionSwiftRef").setSimpleValue(json.national_ids[0].structured_address.country_subdivision_name);
        }
    }
    var count = 0;
    var streetName = node.getValue("BankStreetSwiftRef").getSimpleValue();
    var city = node.getValue("BankCitySwiftRef").getSimpleValue();
    var institutionName = node.getValue("BankNameSwiftRef").getSimpleValue();
    if (node.getValue("BankCountry").getSimpleValue() != "China") {

        if (streetName != null && streetName != "") {
            count = count + 1;
        }
        if (city != null && city != "") {
            count = count + 1;
        }
        if (institutionName != null && institutionName != "") {
            count = count + 1
        }
        log.severe(count)
        if (count == 3) {
            node.getValue("BankServiceVerified").setLOVValueByID("001");
        } else if (count == 2 || count == 1) {
            node.getValue("BankServiceVerified").setLOVValueByID("002");
        } else {
            node.getValue("BankServiceVerified").setLOVValueByID("999");
        }
    } else {
        if (city != null && city != "") {
            count = count + 1;
        }
        if (institutionName != null && institutionName != "") {
            count = count + 1
        }
        if (count == 2) {
            node.getValue("BankServiceVerified").setLOVValueByID("001");
        } else if (count == 1) {
            node.getValue("BankServiceVerified").setLOVValueByID("002");
        } else {
            node.getValue("BankServiceVerified").setLOVValueByID("999");
        }
    }
}

//OAuth Function to get Access Token
function OAuthToken(CLIENTSECRET) {
    var url = new java.net.URL("https://ipaas-test.upm.com/api/swiftref/oauth2/v1/token");
    var http = url.openConnection();
    http.setRequestMethod("GET");
    http.setDoOutput(true);
    http.addRequestProperty("x-api-key", CLIENTSECRET);
    var input = http.getInputStream();

    try {
        var reader = new java.io.BufferedReader(new java.io.InputStreamReader(input));
        var response1 = "";
        while (reader.ready()) {
            response1 = "" + reader.readLine();
        }
        var json1 = JSON.parse(response1);
        var map = new java.util.HashMap();
        log.info("TEST");
        map.put("access_token", json1.access_token); // access token
        map.put("expires_in", "" + json1.expires_in); // expires_in is in seconds since start time.
        map.put("refresh_token_expires_in", "" + json1.refresh_token_expires_in); // starttime is in ms since 1/1 1970
        map.put("token_type", json1.token_type); // Needed ?
        map.put("refresh_token", json1.refresh_token); // Needed ?
        //return map;
    } finally {
        reader.close();
    }
    log.info(json1.access_token);
    var CLIENTSEC = "Bearer " + json1.access_token;
    log.info(CLIENTSEC);
    return CLIENTSEC;
}

function isHighRiskCountry(node, lookup) {
    return lookup.getLookupTableValue("RiskCountries", node.getValue("BankCountry").getID()) != null ? true : false;
}

function populateAttributesOfSingleDC(node, dcTypeId, attrValueJSON) {
    var dc = node.getDataContainerByTypeID(dcTypeId);
    var dcObj = dc.getDataContainerObject();
    for (var attrId in attrValueJSON) {
        if (attrValueJSON[attrId] != null) {
            try {
                dcObj.getValue(attrId).setSimpleValue(attrValueJSON[attrId]);
            } catch (e) {
                if (!(e.javaException instanceof com.stibo.core.domain.ValidatorException)) {
                    throw (e);
                } else {
                    logger.warning("Exception occurred during setting value for attribute: " + attrId + ", value: " + attrValueJSON[attrId] + ", error => " + e);
                }
            }
        } else {
            dcObj.getValue(attrId).deleteCurrent();
        }
    }
}

//return current Date & Time
function getCurrentDateTime() {

    var today = new Date();
    var sdf = new java.text.simpleDateFormat("yyyy-MM-dd HH:mm:ss");

    var parsedDate = sdf.parse(sdf.format(today));
    return parsedDate;
}

//return current Date
function getCurrentDate() {

    var today = new Date();
    var sdf = new java.text.simpleDateFormat("yyyy-MM-dd");

    var parsedDate = sdf.parse(sdf.format(today));
    return parsedDate;
}

//return current Date & Time in ISO format
function getCurrentDateTimeInISO() {

    var date = new Date();
    var hours = date.getHours();
    var minutes = date.getMinutes();
    var seconds = date.getSeconds();

    hours = hours % 12;
    hours = hours ? hours : 12;
    var strTime = padZero(hours) + ":" + padZero(minutes) + ":" + padZero(seconds);

    return padZero(date.getFullYear()) + "-" + padZero(date.getMonth()) + "-" + padZero(date.getDate()) + " " + strTime;
}

//function to run through the textual constraints (Trimming Starting and Ending Spaces, Replacing multiple spaces with single space)

function textualConstraintsCheck(value) {

    var fieldValue = value;

    if (fieldValue) {

        fieldValue = fieldValue.trimStart();
        fieldValue = fieldValue.trimEnd();
        fieldValue = fieldValue.replace(/\s{2,}/g, ' ');
    }

    return fieldValue;
}

//Fetches the value of passed key in Lookup Table. This function does not requires LookupTableHome to be passed in parameters
function getLookupTableValue(manager, lookupTableID, key) {
    var lookupTableHome = manager.getHome(com.stibo.lookuptable.domain.LookupTableHome);
    var lookupValue = lookupTableHome.getLookupTableValue(lookupTableID, key);
    return lookupValue == -1 || lookupValue == "" || lookupValue == null ? null : lookupValue;
}

// This function is used to concatenate new comment and existing comment
function concatenateComments(newComment, existingComment) {

    if (newComment) {
        if (existingComment) {

            existingComment = newComment + "\n\n" + existingComment; //V812149 for INC2739489 - added one more \n
        } else {
            existingComment = newComment;
        }
    }
    return existingComment;
}

//This fuction is used to send email notifications
function sendEmailNotification(node, manager, emailEntityNode, mail, wf) {
    var emailEntityObj = manager.getEntityHome().getEntityByID(emailEntityNode);
    var template = emailEntityObj.getValue('EmailBody').getSimpleValue();
    var emailSubject = emailEntityObj.getValue('EmailSubject').getSimpleValue();
    var eMail = mail.mail();
    var workflowInstance = node.getWorkflowInstance(wf);
    if (workflowInstance) {
        var requestorId = workflowInstance.getSimpleVariable("requestorId");
        var requestDate = workflowInstance.getSimpleVariable("requestSubmittedDate");
        var assignee = manager.getUserHome().getUserByID(requestorId);
        var assigneeName = assignee.getName();
        var assigneeEmail = assignee.getEMail();

        var bankKey = node.getValue("BankKey").getSimpleValue();
        var bankCountry = node.getValue("BankCountry").getSimpleValue();
        var SendBackReason = node.getValue("SendBackReason").getSimpleValue();
        var SendBackComment = node.getValue("SendBackComment").getSimpleValue();
        var RejectionReason = node.getValue("RejectionReason").getSimpleValue();
        var RejectionComment = node.getValue("RejectionComment").getSimpleValue();

        var URL = getEnvironmentURL(manager);
        template = template.replace("(url)", URL);

        emailSubject = emailSubject.replace("{BankKey}", bankKey);
        emailSubject = emailSubject.replace("{BankCountry}", bankCountry);

        template = template.split("<lt/>").join("<");
        template = template.split("<gt/>").join(">");
        template = template.replace("[BankKey]", bankKey);
        template = template.replace("[BankCountry]", bankCountry);
        template = template.replace("[BankKey2]", bankKey);
        template = template.replace("[BankCountry2]", bankCountry);
        template = template.replace("[Requestor’s name]", assigneeName);
        template = template.replace("[SendBackReason]", SendBackReason);
        template = template.replace("[SendBackComment]", SendBackComment);
        template = template.replace("[RejectionReason]", RejectionReason);
        template = template.replace("[RejectionComment]", RejectionComment);
        template = template.replace("[Date]", requestDate);

        eMail.addTo(assigneeEmail, assigneeName);
        eMail.from("noreply@cloudmail.stibo.com", "STEP MDM");
        eMail.subject(emailSubject);
        eMail.htmlMessage(template);
        if (assigneeEmail) {
            eMail.send();
        }
    }
}

//This function is to send email to approver
function sendEmailNotificationApprover(node, manager, emailEntityNode, mail, wf, approverMail) {
    var emailEntityObj = manager.getEntityHome().getEntityByID(emailEntityNode);
    var template = emailEntityObj.getValue('EmailBody').getSimpleValue();
    var emailSubject = emailEntityObj.getValue('EmailSubject').getSimpleValue();
    var eMail = mail.mail();

    var workflowInstance = node.getWorkflowInstance(wf);
    if (workflowInstance) {
        var requestorId = workflowInstance.getSimpleVariable("requestorId");
        var requestDate = workflowInstance.getSimpleVariable("requestSubmittedDate");

        var bankKey = node.getValue('BankKey').getSimpleValue();
        var bankCountry = node.getValue('BankCountry').getSimpleValue();
        var SendBackReason = node.getValue("SendBackReason").getSimpleValue();
        var SendBackComment = node.getValue("SendBackComment").getSimpleValue();
        var RejectionReason = node.getValue("RejectionReason").getSimpleValue();
        var RejectionComment = node.getValue("RejectionComment").getSimpleValue();
        var sendMailFlag = false;

        var URL = getEnvironmentURL(manager);
        template = template.replace("(url)", URL);

        emailSubject = emailSubject.replace("{BankKey}", bankKey);
        emailSubject = emailSubject.replace("{BankCountry}", bankCountry);

        template = template.split("<lt/>").join("<");
        template = template.split("<gt/>").join(">");
        template = template.replace("[BankKey]", bankKey);
        template = template.replace("[BankCountry]", bankCountry);
        template = template.replace("[SendBackReason]", SendBackReason);
        template = template.replace("[SendBackComment]", SendBackComment);
        template = template.replace("[RejectionReason]", RejectionReason);
        template = template.replace("[RejectionComment]", RejectionComment);
        template = template.replace("[Date]", requestDate);

        var approverMailArray = approverMail.toArray();
        var arrSize = approverMailArray.length
            for (var i = 0; i < arrSize; i++) {
                eMail.addTo(approverMailArray[i]);
                sendMailFlag = true;
            }

            eMail.from("noreply@cloudmail.stibo.com", "STEP MDM");
        eMail.subject(emailSubject);
        eMail.htmlMessage(template);
        if (sendMailFlag) {
            eMail.send();
        }
    }
}

function getEnvironmentURL(manager) {
    var emailDomainEntity = manager.getEntityHome().getEntityByID("PartyDomainEmail");
    var URL = emailDomainEntity.getValue("EmailEnvironmentURL").getSimpleValue();
    return URL;
}

function extractEmailIDs(node, manager, userGroupID) {
    var finalEmailIDs = new java.util.HashSet();
    var userGroupUsers = manager.getGroupHome().getGroupByID(userGroupID).getUsers().toArray();
    var emailIDs = getUsersEmailIDs(userGroupUsers).toArray();
    for (var k = 0; k < emailIDs.length; k++) {
        var emailID = emailIDs[k];
        if (emailID && !"".equals(emailID)) {
            finalEmailIDs.add(emailID);
        }
    }
    return finalEmailIDs;
}

function getUsersEmailIDs(users) {
    var mailIDs = new java.util.HashSet();
    var userCount = users.length;
    for (var i = 0; i < userCount; i++) {
        var user = users[i];

        var email = user.getEMail();
        if (email) {
            mailIDs.add(email);
        }
    }
    return mailIDs;
}

//************************BEGINNING OF EMPLOYEE MASTER************************//
function populateAttributeAndTrimLength(node, sourceAttributeID, targetAttributeID, maxLength) {
    var sourceAttributeValue = node.getValue(sourceAttributeID).getSimpleValue();
    if (sourceAttributeValue) {
        var result = "";
        if (sourceAttributeValue.length() >= maxLength) {
            result = sourceAttributeValue.substring(0, maxLength - 1);
        } else {
            result = sourceAttributeValue;
        }
        node.getValue(targetAttributeID).setSimpleValue(result);
    }
}
//V812109 : 20527 modified on 7/7/2025;
function populateAttribute(node, manager, attributeID, attributeValue) {
    var attributeIns = manager.getAttributeHome().getAttributeByID(attributeID);

    if (attributeIns != null) {
        var isLOV = attributeIns.hasLOV();
        if (isLOV) {
            var hasValueID = attributeIns.getListOfValues().isUsingValueIDs();
            if (hasValueID) {
                if (attributeIns.isMultiValued()) {
                    var arr = node.getValue(attributeID).getValues().toArray();
                    var lovIds = [];
                    for (i = 0; i < arr.length; i++) {
                        lovIds.push(arr[i].getID());
                    }
                    var flag = 0;
                    for (j = 0; j < lovIds.length; j++) {
                        if (lovIds[j] == attributeValue) {
                            flag += 1;
                        }
                    }
                    if (flag == 0) {
                        node.getValue(attributeID).addLOVValueByID(attributeValue);
                    }
                } else {
                    node.getValue(attributeID).setLOVValueByID(attributeValue);
                }

            } else {
                if (attributeIns.isMultiValued()) {
                    node.getValue(attributeID).addValue(attributeValue);
                } else {
                    node.getValue(attributeID).setLOVValue(attributeValue);
                }
            }
        } else {
            if (attributeIns.isMultiValued()) {
                node.getValue(attributeID).addValue(attributeValue);
            } else {
                node.getValue(attributeID).setSimpleValue(attributeValue);
            }
        }
    }
}

function populateDCAttribute(node, manager, dcID, attributeID, attributeValue) {
    var isDCMultiValued = node.getDataContainerByTypeID(dcID).getDataContainerType().isMultiValued();
    if (isDCMultiValued) {
        var dc = node.getDataContainerByTypeID(dcID).getDataContainers();
        var itr = dc.iterator();
        while (itr.hasNext()) {
            var dcObj = itr.next().getDataContainerObject();
            populateAttribute(dcObj, manager, attributeID, attributeValue);
        }
    } else {
        var dc = node.getDataContainerByTypeID(dcID).getDataContainerObject();
        populateAttribute(dc, manager, attributeID, attributeValue);
    }
}

function dcCheckUniqueCombination(node, manager, attrID1, attrID2, dcID) {
    var dc = node.getDataContainerByTypeID(dcID).getDataContainers();
    var itr = dc.iterator();
    var dcSize = dc.size();
    var uniqueComb = new java.util.HashSet();
    while (itr.hasNext()) {
        var dcObj = itr.next().getDataContainerObject();
        var att1 = dcObj.getValue(attrID1).getSimpleValue();
        var att2 = dcObj.getValue(attrID2).getSimpleValue();
        var comb = att1 + att2;
        uniqueComb.add(comb);
    }
    var hashSize = uniqueComb.size();
    if (dcSize == hashSize)
        return true;
    else
        return "Please enter unique values.";
}

function populateDataEntity(node, manager, refType, attributeID, attributeValue) {
    var sourceRefs = node.queryReferences(refType);
    var references = new java.util.ArrayList();
    sourceRefs.forEach(function (reference) {
        references.add(reference);
        if (references.size()) {
            var refTar = reference.getTarget();
            populateAttribute(refTar, manager, attributeID, attributeValue);
        }
        return true;
    });
}
//To populate Attribute with LOV Value ids of lov Attribute, except for one LOV Value id
function populateDCLovValueIDToDCAttribute(node, manager, dcID, attrID, lovAttrID, lovValueid) {
    var isDCMultiValued = node.getDataContainerByTypeID(dcID).getDataContainerType().isMultiValued();
    if (isDCMultiValued) {
        var dc = node.getDataContainerByTypeID(dcID).getDataContainers();
        var itr = dc.iterator();
        while (itr.hasNext()) {
            var dcObj = itr.next().getDataContainerObject();
            var lovValue = dcObj.getValue(lovAttrID).getLOVValue();
            if (lovValue) {
                var lovValueID = lovValue.getID();
                //logger.severe(lovValueID);
                if (lovValueID != lovValueid) {
                    dcObj.getValue(attrID).setSimpleValue(lovValueID);
                }
            }
        }
    } else {
        var dc = node.getDataContainerByTypeID(dcID).getDataContainerObject();
        var lovValue = dc.getValue(lovAttrID).getLOVValue();
        if (lovValue) {
            var lovValueID = lovValue.getID();
            if (lovValueID != lovValueid) {
                dc.getValue(attrID).setSimpleValue(lovValueID);
            }
        }
    }
}

//Creating Data container object and returning it
function createDataContainerObject(node, dcTypeID) {
    var dc = node.getDataContainerByTypeID(dcTypeID);
    if (dc.getDataContainerType().isMultiValued()) {
        return dc.addDataContainer().createDataContainerObject(null);
    } else {
        return dc.createDataContainerObject(null);
    }
}

//Linking Entity to Data Container References
function linkEntityToDCReference(node, dcTypeID, refID, refType) {
    var ref = manager.getEntityHome().getEntityByID(refID);
    var dc = node.getDataContainerByTypeID(dcTypeID);
    if (dc.getDataContainerType().isMultiValued()) {
        var singleDCs = dc.getDataContainers();
        var singleDCsItr = singleDCs.iterator();
        while (singleDCsItr.hasNext()) {
            var singleDC = singleDCsItr.next();
            var dcObj = singleDC.getDataContainerObject();
            var dcReference = dcObj.getDataContainerReferences(refType);
            if (dcReference.size() == 0) {
                dcObj.createReference(ref, refType);
            }
        }
    } else {
        var dcObj = dc.getDataContainerObject();
        var dcReference = dcObj.getDataContainerReferences(refType);
        if (dcReference.size() == 0) {
            dcObj.createReference(ref, refType);
        }
    }
}

//Linking Data Container References to Entity
function linkDCReferenceToEntity(node, dcTypeID, sourceAtt, targetAtt) {
    var dc = node.getDataContainerByTypeID(dcTypeID);
    if (dc.getDataContainerType().isMultiValued()) {
        var singleDCs = dc.getDataContainers();
        var singleDCsItr = singleDCs.iterator();
        while (singleDCsItr.hasNext()) {
            var singleDC = singleDCsItr.next();
            var dcObj = singleDC.getDataContainerObject();
            var sourceValue = dcObj.getValue(sourceAtt).getSimpleValue();
            node.getValue(targetAtt).setSimpleValue(sourceValue);
        }
    } else {
        var dcObj = dc.getDataContainerObject();
        var sourceValue = dcObj.getValue(sourceAtt).getSimpleValue();
        node.getValue(targetAtt).setSimpleValue(sourceValue);
    }
}

//Target attribute is mandatory for specific source attribute values in Data Container
function dcConditionalMandatoryForSpecificValues(node, dcTypeId, mandatoryAttributes, sourceAtt, targetAtt) {
    var msg = "";
    var dc = node.getDataContainerByTypeID(dcTypeId);
    if (dc.getDataContainerType().isMultiValued()) {
        var dcs = dc.getDataContainers().toArray();
        for (var i = 0; i < dcs.length; i++) {
            var dcObj = dcs[i].getDataContainerObject();
            var sourceID = dcObj.getValue(sourceAtt).getID();
            var targetID = dcObj.getValue(targetAtt).getID();
            for (var j = 0; j < mandatoryAttributes.length; j++) {
                if (sourceID == mandatoryAttributes[j] && !targetID) {
                    msg = targetAtt + " is mandatory for " + sourceAtt + " : " + sourceID;
                }
            }
        }
    } else {
        var dcs = dc.getDataContainerObject();
        var sourceID = dcs.getValue(sourceAtt).getID();
        var targetID = dcs.getValue(targetAtt).getID();
        for (var i = 0; i < mandatoryAttributes.length; i++) {
            if (sourceID == mandatoryAttributes[i] && !targetID) {
                msg = targetAtt + " is mandatory for " + sourceAtt + " : " + sourceID;
            }
        }
    }
    if (msg) {
        return msg;
    } else {
        return true;
    }
}

function isValuePresent(value, values) {
    for (var i = 0; i < values.length; i++) {
        if (values[i] == value) {
            return true;
        }
    }
    return false;
}

function checkDCCondMandForSpecificValues(node, manager, dcTypeId, sourceAttrId, targetAttrId, values) {
    var srcAttribute = manager.getAttributeHome().getAttributeByID(sourceAttrId);
    var trgAttribute = manager.getAttributeHome().getAttributeByID(targetAttrId);
    var dc = node.getDataContainerByTypeID(dcTypeId);
    if (dc.getDataContainerType().isMultiValued()) {
        var dcs = dc.getDataContainers();
        var dcsItr = dcs.iterator();
        while (dcsItr.hasNext()) {
            var dcObj = dcsItr.next().getDataContainerObject();
            if (checkDCObjCondMandForSpecificValues(dcObj, srcAttribute, trgAttribute, values) != true) {
                return checkDCObjCondMandForSpecificValues(dcObj, srcAttribute, trgAttribute, values);
            }
        }
    } else {
        var dcObj = dc.getDataContainerObject();
        if (checkDCObjCondMandForSpecificValues(dcObj, srcAttribute, trgAttribute, values) != true) {
            return checkDCObjCondMandForSpecificValues(dcObj, srcAttribute, trgAttribute, values);
        }
    }
    return true;
}

function checkDCObjCondMandForSpecificValues(dcObj, srcAttribute, trgAttribute, values) {
    var srcValue = srcAttribute.hasLOV() ? dcObj.getValue(srcAttribute.getID()).getID() : dcObj.getValue(srcAttribute.getID()).getSimpleValue();
    if (isValuePresent(srcValue, values)) {
        return dcObj.getValue(trgAttribute.getID()).getSimpleValue() != null ? true : trgAttribute.getName() + " is mandatory for " + srcAttribute.getName() + " " + dcObj.getValue(srcAttribute.getID()).getSimpleValue();
    }
    return true;
}

function checkDCUniqueness(node, manager, dcTypeId, attributeIdArr) {
    var dc = node.getDataContainerByTypeID(dcTypeId).getDataContainers();
    var dcItr = dc.iterator();
    var uniqueCombSet = new java.util.HashSet();
    while (dcItr.hasNext()) {
        var uniqueComb = "";
        var dcObj = dcItr.next().getDataContainerObject();
        for (var i = 0; i < attributeIdArr.length; i++) {
            uniqueComb += dcObj.getValue(attributeIdArr[i]).getSimpleValue() + "";
        }
        uniqueCombSet.add(uniqueComb);
    }
    return dc.size() == uniqueCombSet.size() ? true : "Please enter unique values for the combination of " + attributeIdArr;
}

function getConcatenatedValue(node, srcAttributeIDArr, separator) {
    var concatValue = "";
    for (var i = 0; i < srcAttributeIDArr.length; i++) {
        var value = getNotNullValue(node, srcAttributeIDArr[i]) + "";
        if (value.length > 0) {
            if (separator != null) {
                concatValue += concatValue.length == 0 ? value : separator + value;
            } else {
                concatValue += value;
            }
        }
    }
    return concatValue.length == 0 ? null : concatValue;
}

function populateDCAttrFromAttrs(node, manager, dcTypeID, attributeID, srcAttributeIDArr, separator, LOVIDNeeded) {
    var dc = node.getDataContainerByTypeID(dcTypeID);
    if (!isDataContainerNotPresent(node, dcTypeID)) {
        var isDCMultiValued = dc.getDataContainerType().isMultiValued();
        if (isDCMultiValued) {
            var singleDCs = dc.getDataContainers();
            var itr = singleDCs.iterator();
            while (itr.hasNext()) {
                var dcObj = itr.next().getDataContainerObject();
                var concatValue = getConcatenatedValueLOVIDOrNot(dcObj, manager, srcAttributeIDArr, separator, LOVIDNeeded);
                dcObj.getValue(attributeID).setSimpleValue(concatValue);
            }
        } else {
            var dcObj = dc.getDataContainerObject();
            var concatValue = getConcatenatedValueLOVIDOrNot(dcObj, manager, srcAttributeIDArr, separator, LOVIDNeeded);
            dcObj.getValue(attributeID).setSimpleValue(concatValue);
        }
    }
}

function checkConditionalMandatory(node, sourceAttrId, targetAttrIdArr) {
    var errorMsg = "";
    if (node.getValue(sourceAttrId).getSimpleValue() != null) {
        for (var i = 0; i < targetAttrIdArr.length; i++) {
            if (node.getValue(targetAttrIdArr[i]).getSimpleValue() == null) {
                errorMsg += errorMsg.length == 0 ? targetAttrIdArr[i] : ", " + targetAttrIdArr[i];
            }
        }
    }
    return errorMsg.length == 0 ? true : "Attributes should be mandatory " + errorMsg + " since " + sourceAttrId + " is having value";
}

function checkDCConditionalMandatory(node, dcTypeId, sourceAttrId, targetAttrIdArr) {
    var dc = node.getDataContainerByTypeID(dcTypeId);
    if (dc.getDataContainerType().isMultiValued()) {
        var singleDCs = dc.getDataContainers();
        var singleDCsItr = singleDCs.iterator();
        while (singleDCsItr.hasNext()) {
            var dcObj = singleDCsItr.next().getDataContainerObject();
            if (checkConditionalMandatory(dcObj, sourceAttrId, targetAttrIdArr) != true) {
                return "For source attribute " + sourceAttrId + " following attributes are mandatory please check all entries: " + targetAttrIdArr;
            }
        }
    } else {
        var dcObj = dc.getDataContainerObject();
        if (checkConditionalMandatory(dcObj, sourceAttrId, targetAttrIdArr) != true) {
            return "For source attribute " + sourceAttrId + " following attributes are mandatory " + targetAttrIdArr;
        }
    }
    return true;
}

function populateAttrFromReferenceDataToData(node, attrIdArr, refTypeNodeToData, refTypeDataToRefData) {
    var references = new java.util.ArrayList();
    var refs = node.queryReferences(refTypeNodeToData);
    refs.forEach(function (reference) {
        references.add(reference)
        if (references.size() == 500) {
            populateAttrFromRefDataToData(references, attrIdArr, refTypeDataToRefData);
            references.clear();
        }
        return true;
    });
    populateAttrFromRefDataToData(references, attrIdArr, refTypeDataToRefData);
}

function populateAttrFromRefDataToData(references, attrIdArr, refTypeDataToRefData) {
    for (var i = 0; i < references.size(); i++) {
        var data = references.get(i).getTarget();
        var refDataRefs = data.queryReferences(refTypeDataToRefData);
        var refDataRefList = refDataRefs.asList(1);
        if (isCollectionOrMapNotEmpty(refDataRefList)) {
            var refData = refDataRefList.get(0).getTarget();
            for (var j = 0; j < attrIdArr.length; j++) {
                var attrValueRefData = refData.getValue(attrIdArr[j]).getSimpleValue();
                var attrValueData = data.getValue(attrIdArr[j]).getSimpleValue();
                if (attrValueData == null && attrValueRefData != null) {
                    data.getValue(attrIdArr[j]).setSimpleValue(attrValueRefData);
                }
            }
        }
    }
}

function populateAttributeOfTargetFromJSON(node, manager, refType, attrIdValueJSON) {
    var references = new java.util.ArrayList();
    var refs = node.queryReferences(refType);
    refs.forEach(function (reference) {
        references.add(reference)
        if (references.size() == 500) {
            populateAttrOfTargetFromJSON(references, manager, attrIdValueJSON);
            references.clear();
        }
        return true;
    });
    populateAttrOfTargetFromJSON(references, manager, attrIdValueJSON);
}

function populateAttrOfTargetFromJSON(references, manager, attrIdValueJSON) {
    for (var i = 0; i < references.size(); i++) {
        var target = references.get(i).getTarget();
        populateAttrOfNodeFromJSON(target, manager, attrIdValueJSON);
    }
}

function populateAttributeOfDCFromJSON(node, manager, dcTypeId, attrIdValueJSON) {
    var dc = node.getDataContainerByTypeID(dcTypeId);
    if (dc.getDataContainerType().isMultiValued()) {
        var singleDCs = dc.getDataContainers();
        var singleDCsItr = singleDCs.iterator();
        while (singleDCsItr.hasNext()) {
            var dcObj = singleDCsItr.next().getDataContainerObject();
            populateAttrOfNodeFromJSON(dcObj, manager, attrIdValueJSON);
        }
    } else {
        var dcObj = dc.getDataContainerObject();
        populateAttrOfNodeFromJSON(dcObj, manager, attrIdValueJSON);
    }
}

function populateAttrOfNodeFromJSON(node, manager, attrIdValueJSON) {
    for (var attrId in attrIdValueJSON) {
        var currentValue = node.getValue(attrId).getSimpleValue();
        if (currentValue == null) { //added by V811875 for Incident - INC2731312
            var attribute = manager.getAttributeHome().getAttributeByID(attrId);
            if (currentValue == null || (currentValue != null && attrIdValueJSON[attrId][1])) {
                if (attribute.hasLOV()) {
                    if (attribute.isMultiValued()) {
                        var flag = true;
                        attrValues = node.getValue(attrId).getValues();
                        for (var i = 0; i < attrValues.size(); i++) {
                            if (attrValues.get(i).getID() == attrIdValueJSON[attrId][0]) {
                                flag = false;
                            }
                        }
                        if (flag) {
                            node.getValue(attrId).addLOVValueByID(attrIdValueJSON[attrId][0]);
                        }
                    } else {
                        node.getValue(attrId).setLOVValueByID(attrIdValueJSON[attrId][0]);
                    }
                } else {
                    if (attribute.isMultiValued()) {
                        node.getValue(attrId).addValue(attrIdValueJSON[attrId][0]);
                    } else {
                        node.getValue(attrId).setSimpleValue(attrIdValueJSON[attrId][0]);
                    }
                }
            }
        } //added by V811875 for Incident - INC2731312
    }
}

function checkMandatoryAttributesForDC(node, manager, dcTypeId, attrGrpId, attrNameJSON, separator, prefixErrorMsgAttrArr, prefixErrorMsgSeparator) {
    var errorMsg = "";
    var dc = node.getDataContainerByTypeID(dcTypeId);
    if (dc.getDataContainerType().isMultiValued()) {
        var singleDCs = dc.getDataContainers();
        var singleDCsItr = singleDCs.iterator();
        while (singleDCsItr.hasNext()) {
            var dcErrorMsg = "";
            var dcObj = singleDCsItr.next().getDataContainerObject();
            var mandCheckResult = checkMandatoryAttributes(dcObj, manager, attrGrpId, attrNameJSON);
            if (mandCheckResult != true) {
                dcErrorMsg = dcErrorMsg.length == 0 ? mandCheckResult : dcErrorMsg + separator + mandCheckResult;
                dcErrorMsg = getPrefixErrorMsg(dcObj, prefixErrorMsgAttrArr, prefixErrorMsgSeparator) + ": " + dcErrorMsg;
                errorMsg += errorMsg.length == 0 ? dcErrorMsg : "<br>" + dcErrorMsg;
            }
        }
    } else {
        var dcObj = dc.getDataContainerObject();
        var mandCheckResult = checkMandatoryAttributes(dcObj, manager, attrGrpId, attrNameJSON);
        if (mandCheckResult != true) {
            errorMsg = mandCheckResult;
        }
    }
    return errorMsg.length == 0 ? true : errorMsg;
}

function getPrefixErrorMsg(node, prefixErrorMsgAttrArr, separator) {
    var result = "";
    if (prefixErrorMsgAttrArr.length > 0) {
        for (var i = 0; i < prefixErrorMsgAttrArr.length; i++) {
            value = getNotNullValue(node, prefixErrorMsgAttrArr[i]) + "";
            result = result.length == 0 ? value : result + separator + value;
        }
    } else if (prefixErrorMsgAttrArr.length == 0) {
        result = node.getID();
    }
    return result;
}

function checkMandatoryAttributes(node, manager, attrGrpId, attrNameJSON) {
    var errorMsg = "";
    var attributes = manager.getAttributeGroupHome().getAttributeGroupByID(attrGrpId).getAttributes();
    var attributesItr = attributes.iterator();
    while (attributesItr.hasNext()) {
        var attribute = attributesItr.next();
        var value = node.getValue(attribute.getID()).getSimpleValue();
        if (value == null || "".equals(value.trim())) {
            var attrName = getAttributeName(attribute, attrNameJSON);
            errorMsg += errorMsg.length == 0 ? attrName : ", " + attrName;
        }
    }
    return errorMsg.length == 0 ? true : errorMsg;
}

function getAttributeName(attribute, attrNameJSON) {
    return attrNameJSON != null ? attrNameJSON[attribute.getID()] != null ? attrNameJSON[attribute.getID()] : attribute.getName() : attribute.getName();
}

function checkIfReferenceIsPresentInLatestData(node, manager, refTypeNodeToData, refTypeDataToRefData, flagAttrIdValueArr) {
    var references = new java.util.ArrayList();
    var refs = node.queryReferences(refTypeNodeToData);

    var isNew = {
        test: function (reference) {
            return flagAttrIdValueArr[1] == getValueOrValueId(reference.getTarget(), manager, flagAttrIdValueArr[0]);
        }
    };

    var isRefPresent = {
        test: function (reference) {
            return reference.getTarget().queryReferences(refTypeDataToRefData).asList(1).size() > 0;
        }
    };

    refs.forEach(function (reference) {
        references.add(reference)
        return true;
    });

    if (references.stream().anyMatch(isNew)) {
        return references.stream().filter(isNew).anyMatch(isRefPresent);
    }
    return true;
}

function populateAttributeOfDCFromAttribute(node, manager, dcTypeId, attrIdJSON) {
    var dc = node.getDataContainerByTypeID(dcTypeId);
    if (dc.getDataContainerType().isMultiValued()) {
        var singleDCs = dc.getDataContainers();
        var singleDCsItr = singleDCs.iterator();
        while (singleDCsItr.hasNext()) {
            var dcObj = singleDCsItr.next().getDataContainerObject();
            populateAttrOfNodeFromAttribute(dcObj, manager, attrIdJSON);
        }
    } else {
        var dcObj = dc.getDataContainerObject();
        populateAttrOfNodeFromAttribute(dcObj, manager, attrIdJSON);
    }
}

function populateAttrOfNodeFromAttribute(node, manager, attrIdJSON) {
    for (var attrId in attrIdJSON) {
        var currentValue = node.getValue(attrId).getSimpleValue();
        var attribute = manager.getAttributeHome().getAttributeByID(attrId);
        if (attribute.hasLOV()) {
            node.getValue(attrId).setLOVValueByID(node.getValue(attrIdJSON[attrId]).getID());
        } else {
            node.getValue(attrId).setSimpleValue(node.getValue(attrIdJSON[attrId]).getSimpleValue());
        }
    }
}

function isIBANUpdated(node, dcTypeID) {
    var dc = node.getDataContainerByTypeID(dcTypeID);
    var dcObj = dc.getDataContainerObject();
    if (dcObj != null) {
        var iban = dcObj.getValue("SAP-IBAN").getSimpleValue();
        if (iban != null) {
            var previousIBAN = dcObj.getValue("PreviousIBANCodeTech").getSimpleValue();
            if (iban != previousIBAN) {
                return true;
            }
        }
    }
    return false;
}

function syncEmployeCompanyCodeReferenceFromApproveToMain(node, manager, refType, attrGrp) {
    var ref = node.getReferences(refType);
    var references = ref.toArray();
    for (var i = 0; i < references.length; i++) {
        references[i].delete();
    }
    var approvedNode = getApprovedNode(node, manager);
    var appRef = approvedNode.getReferences(refType);
    var appReferences = appRef.toArray();
    for (var j = 0; j < appReferences.length; j++) {
        node.createReference(appReferences[j].getTarget(), refType);
        if (attrGrp) {
            syncAttriValuesFromApproveToMain(node.getReferences(refType).toArray()[j].getTarget(), manager, attrGrp);
        }
    }
}

function createOrLinkBankMaster(node, manager, dcTypeID, refType) {
    if (!isDataContainerNotPresent(node, dcTypeID)) {
        var dc = node.getDataContainerByTypeID(dcTypeID);
        var dcObj = dc.getDataContainerObject();
        var bankKey = dcObj.getValue("BankKeyInternal").getSimpleValue();
        var bankCountry = dcObj.getValue("Country").getID();
        if (bankKey != null && bankCountry != null) {
            var keyValue = getConcatenatedValue(dcObj, ["BankKeyInternal", "Country"], null);
            var bm = manager.getNodeHome().getObjectByKey("BankMasterUniqueKey", keyValue);
            if (bm == null) {
                var bmRoot = manager.getEntityHome().getEntityByID("BankMasterRoot");
                bm = bmRoot.createEntity(null, "BankMaster");
                bm.getValue("BankKey").setSimpleValue(bankKey);
                bm.getValue("BankCountry").setLOVValueByID(bankCountry);
                bm.startWorkflowByID("BankMasterCreateWorkflow", "Bank Master Create workflow is initiated from Employee");
            }
            var dcrefs = dcObj.getDataContainerReferences(refType);
            if (dcrefs.size() == 0) {
                dcObj.createReference(bm, refType);
            } else {
                var existingBM = dcrefs.get(0).getTarget();
                var existingKeyValue = getConcatenatedValue(existingBM, ["BankKey", "BankCountry"], null);
                if (keyValue != existingKeyValue) {
                    dcrefs.get(0).delete();
                    dcObj.createReference(bm, refType);
                }
            }
        }
    }
}

function setReferenceTargetFlagNAttrs(node, manager, refType, flagAttrIdValueArr, attrIdValueJSON) {
    var references = new java.util.ArrayList();
    var refs = node.queryReferences(refType);

    var setAttributes = {
        accept: function (reference) {
            var target = reference.getTarget();
            if (target.getValue(flagAttrIdValueArr[0]).getID() == null) {
                populateAttrOfNodeFromJSON(target, manager, attrIdValueJSON);
            } else {
                target.getValue(flagAttrIdValueArr[0]).deleteCurrent();
                target.getValue("StatusIndicator").setLOVValueByID("001");
                target.getValue("BlockedDate").deleteCurrent();
            }
        }
    };

    refs.forEach(function (reference) {
        references.add(reference)
        return true;
    });

    references.stream().forEach(setAttributes);
}

function getValueOrValueId(node, manager, attributeId) {
    var attribute = manager.getAttributeHome().getAttributeByID(attributeId);
    return attribute.hasLOV() ? node.getValue(attributeId).getID() : node.getValue(attributeId).getSimpleValue();
}

function populateRecentReference(node, manager, mainRefType, recentRefType, flagAttrIdValueArr) {
    var isNew = {
        test: function (reference) {
            return flagAttrIdValueArr[1] == getValueOrValueId(reference.getTarget(), manager, flagAttrIdValueArr[0]);
        }
    }
    var reference = getReferenceByFilter(node, manager, mainRefType, isNew);

    if (reference != null) {
        node.createReference(reference.getTarget(), recentRefType);
    }
}

function getReferenceByFilter(node, manager, refType, filter) {
    var references = new java.util.ArrayList();
    var refs = node.queryReferences(refType);
    var recentRef = null;

    refs.forEach(function (reference) {
        references.add(reference);
        if (references.size() == 1) {
            recentRef = getRefByFilter(references, filter);
            if (recentRef != null) {
                return false;
            }
            references.clear();
        }
        return true;
    });

    if (recentRef == null) {
        var recentRef = getRefByFilter(references, filter);
    }
    return recentRef;
}

function getRefByFilter(references, filter) {
    return references.stream().filter(filter).findFirst().orElse(null);
}

function getReferencesTargets(node, refType) {
    var references = new java.util.ArrayList();
    var target = new java.util.ArrayList();
    var refs = node.queryReferences(refType);
    refs.forEach(function (reference) {
        references.add(reference);
        if (references.size() == 500) {
            target = getRefTargets(references);
        }
        return true;
    });

    target = getRefTargets(references);
    return target;
}

function getRefTargets(references) {
    var target = new java.util.ArrayList();
    if (references.size() > 0) {
        var refItr = references.iterator();
        while (refItr.hasNext()) {
            var reference = refItr.next();
            target.add(reference.getTarget());
        }
    }
    return target;
}

function incrementCurrentDateByGivenDays(noOfDays) {
    var currentDate = getNowDateTime();
    var incrementedDate = currentDate.plusDays(noOfDays);
    var formatter = java.time.format.DateTimeFormatter.ofPattern("yyyy-MM-dd");
    return incrementedDate.format(formatter);
}

function checkAttrValueOnDC(node, dcTypeId, attrIdValueJSON) {
    var CheckValue;
    var isValueSame;
    var dc = node.getDataContainerByTypeID(dcTypeId);
    if (dc.getDataContainerType().isMultiValued()) {
        var singleDCs = dc.getDataContainers();
        var singleDCsItr = singleDCs.iterator();
        while (singleDCsItr.hasNext()) {
            var dcObj = singleDCsItr.next().getDataContainerObject();
            for (var attrId in attrIdValueJSON) {
                var attrValue = dcObj.getValue(attrId).getSimpleValue();
                if (attrValue != attrIdValueJSON[attrId][0]) {
                    isValueSame = false;
                }
            }
        }
    } else {
        var dcObj = dc.getDataContainerObject();
        for (var attrId in attrIdValueJSON) {
            var attrValue = dcObj.getValue(attrId).getSimpleValue();
            if (attrValue != attrIdValueJSON[attrId][0]) {
                isValueSame = false;
            }
        }
    }
    if (isValueSame == false) {
        return false;
    } else {
        return true;
    }
}

function createRecentReference(node, manager, mainRefType, recentRefType, flagAttrIdValueArr) {
    var recentReference = null;
    var isNew = {
        test: function (reference) {
            return flagAttrIdValueArr[1] == getValueOrValueId(reference.getTarget(), manager, flagAttrIdValueArr[0]);
        }
    }
    var reference = getReferenceByFilter(node, manager, mainRefType, isNew);
    if (reference != null) {
        var refList = node.queryReferences(recentRefType).asList(1);
        if (isCollectionOrMapNotEmpty(refList)) {
            var existingTarget = refList.get(0).getTarget();
            if (!reference.getTarget().getID().equals(existingTarget.getID())) {
                deleteReferences(node, recentRefType);
                recentReference = node.createReference(reference.getTarget(), recentRefType);
            }
        } else {
            recentReference = node.createReference(reference.getTarget(), recentRefType);
        }
    }
    return recentReference;
}

function getReferenceByFilter(node, manager, refType, filter) {
    var references = new java.util.ArrayList();
    var refs = node.queryReferences(refType);
    var recentRef = null;

    refs.forEach(function (reference) {
        references.add(reference);
        if (references.size() == 500) {
            recentRef = getRefByFilter(references, filter);
            if (recentRef != null) {
                return false;
            }
            references.clear();
        }
        return true;
    });

    if (recentRef == null) {
        recentRef = getRefByFilter(references, filter);
    }
    return recentRef;
}

function getRefByFilter(references, filter) {
    return references.stream().filter(filter).findFirst().orElse(null);
}

function populateSameAttrsFromSourceToTarget(source, target, attrIdArr) {
    srcTrgAttrIdJSON = {};
    for (var i = 0; i < attrIdArr.length; i++) {
        srcTrgAttrIdJSON[attrIdArr[i]] = attrIdArr[i];
    }
    populateAttrsFromSourceToTarget(source, target, srcTrgAttrIdJSON);
}

function populateAttrsFromSourceToTarget(source, target, srcTrgAttrIdJSON) {
    for (var srcAttrId in srcTrgAttrIdJSON) {
        target.getValue(srcTrgAttrIdJSON[srcAttrId]).setSimpleValue(source.getValue(srcAttrId).getSimpleValue());
    }
}
// A function to populate attribute value with Name of Data Container's reference target

function populateAttributeFromRefTargetName(node, manager, dcID, attributeID, refType) {
    var isDCMultiValued = node.getDataContainerByTypeID(dcID).getDataContainerType().isMultiValued();
    var attrValues = new java.util.ArrayList();
    var attributeIns = manager.getAttributeHome().getAttributeByID(attributeID);
    if (isDCMultiValued) {
        var dc = node.getDataContainerByTypeID(dcID).getDataContainers();
        var itr = dc.iterator();
        while (itr.hasNext()) {
            var dcObj = itr.next().getDataContainerObject();
            var dcRef = dcObj.getDataContainerReferences(manager.getReferenceTypeHome().getReferenceTypeByID(refType));
            if (!dcRef.isEmpty()) {
                var itrRef = dcRef.iterator();
                while (itrRef.hasNext()) {
                    var dcRefTar = itrRef.next().getTarget();
                    var attributeValue = dcRefTar.getName();
                    if (attributeIns.isMultiValued()) {
                        var flag = true;
                        attrValues = node.getValue(attributeID).getValues();
                        for (var i = 0; i < attrValues.size(); i++) {
                            if (attrValues.get(i).getSimpleValue() == attributeValue) {
                                flag = false;
                            }
                        }
                        if (flag) {
                            populateAttribute(node, manager, attributeID, attributeValue);
                        }
                    } else {
                        if (node.getValue(attributeID).getSimpleValue() != attributeValue) {
                            populateAttribute(node, manager, attributeID, attributeValue);
                        }
                    }
                }

            }
        }
    } else {
        var dc = node.getDataContainerByTypeID(dcID).getDataContainerObject();
        var dcRef = dc.getDataContainerReferences(manager.getReferenceTypeHome().getReferenceTypeByID(refType));
        if (!dcRef.isEmpty()) {
            var itrRef = dcRef.iterator();
            while (itrRef.hasNext()) {
                var dcRefTar = itrRef.next().getTarget();
                var attributeValue = dcRefTar.getName();
                if (attributeIns.isMultiValued()) {
                    var flag = true;
                    attrValues = node.getValue(attributeID).getValues();
                    for (var i = 0; i < attrValues.size(); i++) {
                        if (attrValues.get(i).getSimpleValue() == attributeValue) {
                            flag = false;
                        }
                    }
                    if (flag) {
                        populateAttribute(node, manager, attributeID, attributeValue);
                    }
                } else {
                    if (node.getValue(attributeID).getSimpleValue() != attributeValue) {
                        populateAttribute(node, manager, attributeID, attributeValue);
                    }
                }
            }
        }
    }
}

function populateBankMasterDetails(node, dcTypeID, refType) {
    if (!isDataContainerNotPresent(node, dcTypeID)) {
        var dc = node.getDataContainerByTypeID(dcTypeID);
        var dcObj = dc.getDataContainerObject();
        var references = dcObj.getDataContainerReferences(refType);
        if (isCollectionOrMapNotEmpty(references)) {
            var bm = references.iterator().next().getTarget();
            dcObj.getValue("BankKeyInternal").setSimpleValue(bm.getValue("BankKey").getSimpleValue());
            dcObj.getValue("Country").setLOVValueByID(bm.getValue("BankCountry").getID());
        }
    }
}

function validateBankAccountFormat(lookup, bankKey, countryId, bankACNo, acflag) {
    var exceptionCountries = lookup.getLookupTableValue("CountryRulesBankAccount", "Exception");
    if (exceptionCountries.indexOf(countryId) > -1) { // present
        var group = lookup.getLookupTableValue("CountryRulesBankAccount", countryId + "_Group");
        if ("Group1".equals(group)) {
            return validateBankAccountFormatForGroup1(lookup, bankKey, countryId, bankACNo);
        } else if ("Group2".equals(group)) {
            return validateBankAccountFormatForGroup2(lookup, bankKey, countryId, bankACNo);
        }
    } else {
        var regexp = lookup.getLookupTableValue("CountryRulesBankAccount", countryId);
        if (regexp != null) {
            log.severe("2nd if")
            var regEx = new RegExp(regexp, "g");
            if (!(regEx.test(bankACNo))) {
                acflag = true;
                return acflag;
            }
            //return regEx.test(bankACNo) ? true : "Bank Account format is invalid for the country " + countryId;{commented 15782. As this return is overwriting acflag false value as true.}
            return acflag;
        } else {
            return "Bank Account format cannot be verified for the country " + countryId;
        }
    }
}

function validateBankAccountFormatForGroup1(lookup, bankKey, countryId, bankACNo, acflag) {
    var regexp = lookup.getLookupTableValue("CountryRulesBankAccount", countryId + "_Bank_Key_" + bankKey);
    if (regexp == null) {
        regexp = lookup.getLookupTableValue("CountryRulesBankAccount", countryId + "_Default");
    }
    var regEx = new RegExp(regexp, "g");
    if (!(regEx.test(bankACNo))) {
        acflag = true;
        return acflag;
    }
    //return regEx.test(bankACNo) ? true : "Bank Account format is invalid for the country " + countryId;{commented 15782. As this return is overwriting acflag false value as true.}
    return acflag;
}

function validateBankAccountFormatForGroup2(lookup, bankKey, countryId, bankACNo, acflag) {
    var bankKeyType = (bankKey == null || countryId == null) ? null : getBankKeyType(lookup, bankKey, countryId);
    if (bankKeyType != null) {
        var regexp = lookup.getLookupTableValue("CountryRulesBankAccount", countryId + "_Bank_KeyType_" + bankKeyType);
        if (regexp == null) {
            regexp = lookup.getLookupTableValue("CountryRulesBankAccount", countryId + "_Default");
        }
        var regEx = new RegExp(regexp, "g");
        if (!(regEx.test(bankACNo))) {
            acflag = true;
            return acflag;
        }
        //return regEx.test(bankACNo) ? true : "Bank Account format is invalid for the country " + countryId;{commented 15782. As this return is overwriting acflag false value as true.}
        return acflag;
    }
    //return "Bank Account format is invalid for the country " + countryId;{commented 15782. As this return is overwriting acflag false value as true.}
    return acflag;
}

function getBankKeyType(lookup, bankKey, bankCountryId) {
    var bankKeyType = null;
    var mappingValue = lookup.getLookupTableValue("BankMasterBankKeyType", bankCountryId);
    if (mappingValue != null) {
        if ("Exception".equals(mappingValue)) {
            var group = lookup.getLookupTableValue("BankMasterBankKeyType", bankCountryId + "_Exception");
            if ("Group1".equals(group)) {
                bankKeyType = getBankKeyTypeForGroup1(bankKey);
            } else if ("Group2".equals(group)) {
                bankKeyType = getBankKeyTypeForGroup2(bankKey);
            } else if ("Group3".equals(group)) {
                bankKeyType = getBankKeyTypeForGroup3(bankKey);
            } else if ("Group4".equals(group)) {
                bankKeyType = getBankKeyTypeForGroup4(bankKey, bankCountryId);
            } else if ("Group5".equals(group)) {
                bankKeyType = getBankKeyTypeForGroup5(bankKey);
            }
        } else {
            bankKeyType = mappingValue;
        }
    } else {
        //If no mapping is given in the table then default it with BIC
        bankKeyType = "BIC";
    }
    return bankKeyType;
}

//Group1=> Bank Number, IHC
function getBankKeyTypeForGroup1(bankKey) {
    if (bankKey.startsWith("IHC")) {
        return "IHC";
    } else {
        return "BNU";
    }
}

//Group2=> BIC, IHC
function getBankKeyTypeForGroup2(bankKey) {
    if (bankKey.startsWith("IHC")) {
        return "IHC";
    } else {
        return "BIC";
    }
}

//Group3=> BIC, Bank Number
function getBankKeyTypeForGroup3(bankKey) {
    if (bankKey.length() > 7) {
        return "BIC";
    } else {
        return "BNU";
    }
}

//Group4=> BIC, Bankgiro, Bank Numer (for SE, VN)
function getBankKeyTypeForGroup4(bankKey, bankCountry) {
    if (bankKey.length() == 11) {
        return "BIC";
    } else if (bankKey.length() == 8) {
        if (bankCountry.equals(bankKey.substring(4, 6))) {
            return "BIC";
        } else if (bankCountry.equals("SE")) {
            return "BGI";
        } else {
            return "BNU";
        }
    }
}

//Group5=> Bank Number, IHC only for China
function getBankKeyTypeForGroup5(bankKey) {
    if (bankKey.startsWith("IHC") && bankKey.length() < 5 && isInteger(bankKey.substring(3))) {
        return "IHC";
    } else {
        return "BNU";
    }
}

function createReferenceToTargetObject(node, manager, refType, refTargetObject) {
    var references = new java.util.ArrayList();
    var refs = node.queryReferences(refType);
    refs.forEach(function (reference) {
        references.add(reference)
        if (references.size() == 500) {
            createReference(node, refTargetObject, references, refType);
            references.clear();
        }
        return true;
    });
    createReference(node, refTargetObject, references, refType);
}

function createReference(node, refTargetObject, references, refType) {
    var flag = true;
    for (var i = 0; i < references.size(); i++) {
        if (references.get(i).getTarget().equals(refTargetObject)) {
            flag = false;
        }
    }

    if (flag) {
        node.createReference(refTargetObject, refType);
    }
}
//V812109 : 20875;
//function populateDCSequenceNumberAndDefaultValue(node, dcType, attrSeqNum, attrDefVal) {
//    var dc = node.getDataContainerByTypeID(dcType).getDataContainers();
//    var itr = dc.iterator();
//    var itr2 = dc.iterator();
//    var itr3 = dc.iterator();
//    var defaultValueSet = false;
//
//    while (itr.hasNext()) {
//        var dcInst = itr.next().getDataContainerObject();
//        var defaultValue = dcInst.getValue(attrDefVal).getSimpleValue();
//        if (defaultValue == "Yes" && defaultValueSet == false) {
//            dcInst.getValue(attrSeqNum).setSimpleValue("1");
//            defaultValueSet = true;
//            break;
//        }
//    }
//    while (itr2.hasNext()) {
//        var dcInst2 = itr2.next().getDataContainerObject();
//        var defaultValue2 = dcInst2.getValue(attrDefVal).getSimpleValue();
//        if (defaultValue2 != "Yes" && defaultValueSet == false) {
//            dcInst2.getValue(attrDefVal).setSimpleValue("Yes");
//            dcInst2.getValue(attrSeqNum).setSimpleValue("1");
//            defaultValueSet = true;
//            break;
//        }
//    }
//    var seqNumValue = 1;
//    while (itr3.hasNext()) {
//        var dcInst3 = itr3.next().getDataContainerObject();
//        var defaultValue3 = dcInst3.getValue(attrDefVal).getSimpleValue();
//        var seqVal3 = dcInst3.getValue(attrSeqNum).getSimpleValue();
//        if (defaultValue3 != "Yes") {
//        	if (seqVal3 === "" || seqVal3 === null){
//              var seqNumIncre = ++seqNumValue;
//              dcInst3.getValue(attrSeqNum).setSimpleValue(seqNumIncre);
//          } else{
//			var currentVal = parseInt(seqVal3);
//			if(!isNaN(currentVal) && currentVal >= seqNumValue){
//				seqNumValue = currentVal;
//			}
//		 }
//        }
//    }
//}
function populateDCSequenceNumberAndDefaultValue(node, manager, dcType, attrSeqNum, attrDefVal) { // Added "manager" as part of INC2730566 - V812484
    var dc = node.getDataContainerByTypeID(dcType).getDataContainers();
    var itr = dc.iterator();
    var entries = [];
    var defaultEntryIndex = -1;

	 // Added as part of INC2730566 - V812484 - Start
    var mainItrDc = dc.toArray();
    var dcLength = mainItrDc.length; 
    var approvedNode = getApprovedNode(node, manager);
    if (approvedNode)
    { // if already in approved WS, then set seq Number only for newly added
	  var adc = approvedNode.getDataContainerByTypeID(dcType).getDataContainers();
       var AdcLength = adc.toArray().length;
       if (AdcLength < dcLength){
       	for (var i = 0; i < dcLength; i++) {
	    		var SequenceNumb = mainItrDc[i].getDataContainerObject().getValue(attrSeqNum).getSimpleValue(); 
	   		if (SequenceNumb!=null && SequenceNumb !="")
	            continue;
            	AdcLength++;log.severe("set"+AdcLength);
        		mainItrDc[i].getDataContainerObject().getValue(attrSeqNum).setSimpleValue(AdcLength.toString());
        	
		}
       }
    }
    else{ // Added as part of INC2730566 - V812484 - End
	    // First, collect all entries and identify the default entry (where attrDefVal == "Yes")
	    var index = 0;
	    while (itr.hasNext()) {
	        var dcInst = itr.next().getDataContainerObject();
	        var isDefault = dcInst.getValue(attrDefVal).getSimpleValue() === "Yes";
	        if (isDefault && defaultEntryIndex === -1) {
	            defaultEntryIndex = index;
	        }
	        entries.push(dcInst);
	        index++;
	    }
	
	    // If a default entry exists, assign sequence 1 to it
	    var seqNum = 1;
	    if (defaultEntryIndex !== -1) {
	        entries[defaultEntryIndex].getValue(attrSeqNum).setSimpleValue(seqNum.toString());
	        seqNum++;
	    }
	
	    // Assign sequence numbers to the rest, skipping the default entry
	    for (var i = 0; i < entries.length; i++) {
	        if (i === defaultEntryIndex)
	            continue;
	        entries[i].getValue(attrSeqNum).setSimpleValue(seqNum.toString());
	        seqNum++;
	    }
    }// Added as part of INC2730566 - V812484
}

function DCconditionalMandatory(node, attrID1, attrID2, dcType) {
    var attrID1Value;
    var attrID2Value;
    var dc;
    var message = "";

    var isDCMultiValued = node.getDataContainerByTypeID(dcType).getDataContainerType().isMultiValued();
    if (isDCMultiValued) {
        dc = node.getDataContainerByTypeID(dcType).getDataContainers();
        var itr = dc.iterator();
        while (itr.hasNext()) {
            var dcInst = itr.next().getDataContainerObject();
            attrID1Value = dcInst.getValue(attrID1).getSimpleValue();
            attrID2Value = dcInst.getValue(attrID2).getSimpleValue();
            if (attrID2Value != null && attrID1Value == null) {
                message = attrID1 + " is mandatory, if " + attrID2 + " is selected \n";
            } else if (attrID2Value == null && attrID1Value != null) {
                message = attrID1 + " can only be added, if " + attrID2 + " is selected \n";
            }
        }
    } else {
        dc = node.getDataContainerByTypeID(dcType).getDataContainerObject();
        attrID1Value = dc.getValue(attrID1).getSimpleValue();
        attrID2Value = dc.getValue(attrID2).getSimpleValue();
        if (attrID2Value != null && attrID1Value == null) {
            message = attrID1 + " is mandatory, if " + attrID2 + " is selected \n";
        } else if (attrID2Value == null && attrID1Value != null) {
            message = attrID1 + " can only be added, if " + attrID2 + " is selected \n";
        }
    }
    return message;
}

function DCconditionalOptional(node, attrID1, attrID2, dcType) {
    var flag = true;
    var attrID1Value;
    var attrID2Value;
    var dc;
    var message = "";

    var isDCMultiValued = node.getDataContainerByTypeID(dcType).getDataContainerType().isMultiValued();
    if (isDCMultiValued) {
        dc = node.getDataContainerByTypeID(dcType).getDataContainers();
        var itr = dc.iterator();
        while (itr.hasNext()) {
            var dcInst = itr.next().getDataContainerObject();
            attrID1Value = dcInst.getValue(attrID1).getSimpleValue();
            attrID2Value = dcInst.getValue(attrID2).getSimpleValue();
            log.info(attrID1Value + attrID2Value);
            if (attrID2Value == null && attrID1Value != null) {
                message = attrID1 + " can only be added, if " + attrID2 + " is added \n";
            }
        }
    } else {
        dc = node.getDataContainerByTypeID(dcType).getDataContainerObject();
        attrID1Value = dc.getValue(attrID1).getSimpleValue();
        attrID2Value = dc.getValue(attrID2).getSimpleValue();
        if (attrID2Value == null && attrID1Value != null) {
            message = attrID1 + " can only be added, if " + attrID2 + " is added \n";
        }
    }
    return message;
}

function populateNotesfromNotesDescription(node, manager, dcTypeID, attributeID, srcAttributeID) {
    var dc = node.getDataContainerByTypeID(dcTypeID);
    if (!isDataContainerNotPresent(node, dcTypeID)) {
        var isDCMultiValued = dc.getDataContainerType().isMultiValued();
        if (isDCMultiValued) {
            var singleDCs = dc.getDataContainers();
            var itr = singleDCs.iterator();
            while (itr.hasNext()) {
                var dcObj = itr.next().getDataContainerObject();
                var srcAttributeValue = dcObj.getValue(srcAttributeID).getID();
                if (srcAttributeValue != null && srcAttributeValue != "Other") {
                    dcObj.getValue(attributeID).setSimpleValue(srcAttributeValue);
                }
            }
        } else {
            var dcObj = dc.getDataContainerObject();
            var srcAttributeValue = dcObj.getValue(srcAttributeID).getID();
            if (srcAttributeValue != null && srcAttributeValue != "Other") {
                dcObj.getValue(attributeID).setSimpleValue(srcAttributeValue);
            }
        }
    }
}

function checkMandatoryReferencesForDC(node, manager, dcTypeId, refType, refTypeNameJSON) {
    var errMsg = "";
    var dc = node.getDataContainerByTypeID(dcTypeId);
    var dcObj = dc.getDataContainerObject();
    var dcReference = dcObj.getDataContainerReferences(refType);
    if (dcReference.size() == 0) {
        errMsg += refTypeNameJSON != null ? refTypeNameJSON[refType.getID()] != null ? refTypeNameJSON[refType.getID()] : refType.getName() : refType.getName();
        //errMsg += refType.getName();
    }
    return errMsg.length == 0 ? true : errMsg;
}

//For DC attributes only
function copyDCAttributes(source, target, manager, srcDataContainerID, targetDataContainerID) {
    var srcDataContainer = source.getDataContainerByTypeID(srcDataContainerID);
    var targetDataContainer = target.getDataContainerByTypeID(targetDataContainerID);
    var validAttributes = srcDataContainer.getDataContainerType().getValidDescriptionAttributes().toArray();
    var sourceRecord = srcDataContainer.getDataContainerObject();
    var targetRecord = targetDataContainer.getDataContainerObject();
    for (var i = 0; i < validAttributes.length; i++) {
        var attribute = validAttributes[i];
        var sourceRecordValue = sourceRecord.getValue(attribute.getID()).getSimpleValue();
        targetRecord.getValue(attribute.getID()).setSimpleValue(sourceRecordValue);
    }
}

//For DC Reference only
function copyDCReferences(sourceNode, targetNode, refType) {
    var sourceRefTypes = sourceNode.getDataContainerReferences(refType);
    var sourceRefTypesItr = sourceRefTypes.iterator();
    while (sourceRefTypesItr.hasNext()) {
        var sourceRefType = sourceRefTypesItr.next();
        var targetRef = targetNode.createReference(sourceRefType.getTarget(), refType);
    }
}

function syncDataContainerMultiValued(manager, sourceNode, targetNode, dcType, lookup) {
    var dcKey = lookup.getLookupTableValue("DataContainerTypeAndKey", dcType.getID());
    var targetDC = targetNode.getDataContainerByTypeID(dcType.getID());
    //var targetDCObj = targetDC.getDataContainerObject();
    targetDC.deleteLocal();
    var sourceNodedc = sourceNode.getDataContainerByTypeID(dcType.getID());
    var approvedSingleDCs = sourceNodedc.getDataContainers();
    var approvedSingleDCsItr = approvedSingleDCs.iterator();
    while (approvedSingleDCsItr.hasNext()) {
        var approvedSingleDC = approvedSingleDCsItr.next();
        var approvedDcObj = approvedSingleDC.getDataContainerObject();
        copyDCObjectMultiValued(manager, approvedDcObj, targetDC, lookup)
    }
}

function copyDCObjectMultiValued(manager, sourceDCObject, targetDC, lookup) {
    var dcKey = buildDCKeyFromDCObject(manager, sourceDCObject, targetDC.getDataContainerType().getID(), lookup);
    var targetDCObj = null;
    if (dcKey != null) {
        targetDCObj = targetDC.addDataContainer().createDataContainerObjectWithKey(dcKey);
    } else {
        targetDCObj = targetDC.addDataContainer().createDataContainerObject(dcKey);
    }
    copyValueFromSourceToTargetDC(targetDC.getDataContainerType(), sourceDCObject, targetDCObj);
}

function getConcatenatedValueLOVIDOrNot(node, manager, srcAttributeIDArr, separator, LOVIDNeeded) {
    var concatValue = "";
    var value;
    var attrHome = manager.getAttributeHome();
    for (var i = 0; i < srcAttributeIDArr.length; i++) {
        var attr = attrHome.getAttributeByID(srcAttributeIDArr[i]);
        if (attr.hasLOV() && LOVIDNeeded == "Y") {
            value = node.getValue(srcAttributeIDArr[i]).getID();
        } else {
            value = node.getValue(srcAttributeIDArr[i]).getSimpleValue();
        }
        if (value.length() > 0) {
            if (separator != null) {
                concatValue += concatValue.length == 0 ? value : separator + value;
            } else {
                concatValue += value;
            }
        }
    }
    return concatValue.length == 0 ? null : concatValue;
}

//Function to identify party type based on wf
function identifyPartyType(node, manager, wf) {
    var partyType;
    //var wfId = wf.getWorkflow().getID();
    var wfId = wf.getID();

    if (wfId == "EMEmployeeCustomer") {
        partyType = "Employee Customer";
    } else if (wfId == "EMManualUpdateEmployeeVendorWorkflows") {
        partyType = "Employee Vendor";
    } else if (wfId == "3PIntercompanyCreate") {
        partyType = "Intercompany";
    } else if (wfId == "3PVendorCreate") {
        partyType = "Vendor";
    } else if (wfId == "3PVendorUpdate") {
        partyType = "Vendor";
    } else if (wfId == "3PCustomerCreate") {
        partyType = "Customer";
    } else if (wfId == "3PCustomerUpdate") {
        partyType = "Customer";
    } else if (wfId == "3PCustomerDeactivate") {
        partyType = "Customer";
    } else if (wfId == "3PVendorDeactivate") {
        partyType = "Vendor";
    } else if (wfId == "3PContactPersonCreate") {
        partyType = "Contact Person";
    }
    return partyType;
}

//Function to send Email for Employee Wfs
function sendEmailNotificationEmployee(node, manager, emailEntityNode, mail, wf, stateId, screenId, recipient) {

    var emailEntityObj = manager.getEntityHome().getEntityByID(emailEntityNode);
    if (emailEntityObj.getValue('EmailBody'))
        var template = emailEntityObj.getValue('EmailBody').getSimpleValue();
    if (emailEntityObj.getValue('EmailSubject'))
        var emailSubject = emailEntityObj.getValue('EmailSubject').getSimpleValue();
    var eMail = mail.mail();

    var templateAttr = new java.util.ArrayList();
    templateAttr = emailEntityObj.getValue("EmailBodyAttributes").getValues();

    var subAttr = new java.util.ArrayList();
    subAttr = emailEntityObj.getValue("EmailSubjectAttributes").getValues();

    var partyType = identifyPartyType(node, manager, wf);
    var workflowInstance = node.getWorkflowInstance(wf);

    if (workflowInstance) {

        var URL = getEnvironmentURL(manager);
        template = template.replace("(url)", URL);
        template = template.replace("(screenId)", screenId);
        template = template.replace("(wfId)", wf.getID());
        template = template.replace("(stateId)", stateId).replace("(stateId)", stateId);

        template = template.split("<lt/>").join("<");
        template = template.split("<gt/>").join(">");

        for (var i = 0; i < templateAttr.size(); i++) {
            var attrStr = templateAttr.get(i).getSimpleValue();
            var str = attrStr.replace("{", "").replace("}", "");
            var strVal = node.getValue(str).getSimpleValue();
            template = template.replace(attrStr, strVal);
        }

        if (partyType)
            template = template.replace("{Counterparty type}", partyType);

        for (var j = 0; j < subAttr.size(); j++) {
            var attrStr = subAttr.get(j).getSimpleValue();
            var str = attrStr.replace("{", "").replace("}", "");
            var strVal = node.getValue(str).getSimpleValue();
            emailSubject = emailSubject.replace(attrStr, strVal);
        }

        if (partyType)
            emailSubject = emailSubject.replace("{Counterparty type}", partyType);

        var sendMailFlag = false;
        if (recipient == "Requestor") {
            var requestorId = workflowInstance.getSimpleVariable("requestorId");
            var requestDate = workflowInstance.getSimpleVariable("requestSubmittedDate");
            var assignee = manager.getUserHome().getUserByID(requestorId);
            var assigneeName = assignee.getName();
            var assigneeEmail = assignee.getEMail();
            template = template.replace("{Name Surname}", assigneeName);
            eMail.addTo(assigneeEmail, assigneeName);
            assigneeEmail != null ? sendMailFlag = true : sendMailFlag = false;
        } else if (recipient == "Master Data Verifier") {
            var userGroup;
            partyType == "Employee Customer" ? userGroup = "95a58324-092a-42f6-bdb3-e0a9a76f3453" : userGroup = "63eb4e48-426b-4f48-8bed-bbcb7f57ee09";
            var verifierMail = extractEmailIDs(node, manager, userGroup);
            var verifierMailArray = verifierMail.toArray();
            var arrSize = verifierMailArray.length;

            for (var i = 0; i < arrSize; i++) {
                eMail.addTo(verifierMailArray[i]);
                sendMailFlag = true;
            }
        } else if (recipient == "Master Data Verifier TL") {
            var tlMail = emailEntityObj.getValue('EmailRecipient').getSimpleValue();
            eMail.addTo(tlMail);
            tlMail != null ? sendMailFlag = true : sendMailFlag = false;
        } else if (recipient == "Finance") {
            var financeMail = emailEntityObj.getValue('EmailRecipient').getSimpleValue();
            eMail.addTo(financeMail);
            financeMail != null ? sendMailFlag = true : sendMailFlag = false;
        }

        eMail.from("noreply@cloudmail.stibo.com", "STEP MDM");
        eMail.subject(emailSubject);
        eMail.htmlMessage(template);
        if (sendMailFlag) {
            eMail.send();
        }
    }
}

//Function to send email reminder to MD Verifier Group with list of existing record link
function sendEmailReminderEmployeeVerifier(nodeList, manager, emailEntityNode, mail, wf, stateId, tabId) {
    var emailEntityObj = manager.getEntityHome().getEntityByID(emailEntityNode);
    var template = emailEntityObj.getValue('EmailBody').getSimpleValue();
    var emailSubject = emailEntityObj.getValue('EmailSubject').getSimpleValue();
    var eMail = mail.mail();
    var linkList = "<br>";
    var nodeLink = "(url)webui/UPMPartyDomain#selection=(empId)&nodeType=entity&workflowID=(wfId)&stateID=(stateId)&selectedTab=(tabId)&contextID=Context1&workspaceID=Main&(wfId)";
    var linkHtml = "<br><a href =" + nodeLink + ">" + "{BusinessPartnerID}" + "</a>" + " (" + "{startDate}" + "/" + "{stateEntry}" + ")";
    var subAttr = new java.util.ArrayList();
    subAttr = emailEntityObj.getValue("EmailSubjectAttributes").getValues();

    for (var i = 0; i < nodeList.size(); i++) {
        var node1 = nodeList.get(i);
        linkList = linkList + linkHtml;
        var empId = node1.getID();
        var workflowInstance = node1.getWorkflowInstance(wf);
        //var workflowInstance=wf;//Comment
        var partyType = identifyPartyType(node1, manager, wf);

        if (workflowInstance) {
            var requestorId = workflowInstance.getSimpleVariable("requestorId");
            var requestDate = workflowInstance.getSimpleVariable("requestSubmittedDate");
            var stateEntry;
            var BusinessPartnerID = node1.getValue("BusinessPartnerID").getSimpleValue();
            var task = workflowInstance.getTasks().iterator().next();
            stateEntry = task.getEntryTime();
            var entryDate = new Date(stateEntry.getYear() + 1900, stateEntry.getMonth(), stateEntry.getDate());
            var parsedDate = stateEntry.getYear() + 1900 + "-" + stateEntry.getMonth() + "-" + stateEntry.getDate();

            var URL = getEnvironmentURL(manager);
            linkList = linkList.replace("(url)", URL);
            linkList = linkList.replace("(empId)", empId);
            linkList = linkList.replace("(tabId)", tabId);
            linkList = linkList.replace("(wfId)", wf.getID()).replace("(wfId)", wf.getID());
            linkList = linkList.replace("(stateId)", stateId);
            linkList = linkList.replace("{startDate}", requestDate);
            linkList = linkList.replace("{stateEntry}", parsedDate);
            linkList = linkList.replace("{BusinessPartnerID}", BusinessPartnerID);

            for (var j = 0; j < subAttr.size(); j++) {
                var attrStr = subAttr.get(j).getSimpleValue();
                var str = attrStr.replace("{", "").replace("}", "");
                var strVal = node1.getValue(str).getSimpleValue();
                emailSubject = emailSubject.replace(attrStr, strVal);
            }

            if (partyType)
                emailSubject = emailSubject.replace("{Counterparty type}", partyType);

            var sendMailFlag = false;
            var userGroup;
            partyType == "Employee Customer" ? userGroup = "95a58324-092a-42f6-bdb3-e0a9a76f3453" : userGroup = "63eb4e48-426b-4f48-8bed-bbcb7f57ee09";
            var verifierMail = extractEmailIDs(node1, manager, userGroup);
            var verifierMailArray = verifierMail.toArray();
            var arrSize = verifierMailArray.length;

            for (var k = 0; k < arrSize; k++) {
                eMail.addTo(verifierMailArray[k]);
                sendMailFlag = true;
            }
        }
    }
    template = template.replace("{list}", linkList);
    template = template.split("<lt/>").join("<");
    template = template.split("<gt/>").join(">");

    eMail.from("noreply@cloudmail.stibo.com", "STEP MDM");
    eMail.subject(emailSubject);
    eMail.htmlMessage(template);
    if (sendMailFlag) {
        eMail.send();
    }

}
//Function to send email reminder to MD Verifier Group with count of existing record
function sendEmailEscalationEmployeeVerifier(nodeList, manager, emailEntityNode, mail, wf) {
    var emailEntityObj = manager.getEntityHome().getEntityByID(emailEntityNode);
    var template = emailEntityObj.getValue('EmailBody').getSimpleValue();
    var emailSubject = emailEntityObj.getValue('EmailSubject').getSimpleValue();
    var eMail = mail.mail();

    var templateAttr = new java.util.ArrayList();
    templateAttr = emailEntityObj.getValue("EmailBodyAttributes").getValues();

    var subAttr = new java.util.ArrayList();
    subAttr = emailEntityObj.getValue("EmailSubjectAttributes").getValues();
    var size = nodeList.size();

    for (var i = 0; i < nodeList.size(); i++) {
        var node1 = nodeList.get(i);
        var empId = node1.getID();
        var workflowInstance = node1.getWorkflowInstance(wf);
        //var workflowInstance=wf;//Comment
        var partyType = identifyPartyType(node1, manager, wf);

        if (workflowInstance) {

            for (var k = 0; i < templateAttr.size(); k++) {
                var attrStr = templateAttr.get(k).getSimpleValue();
                var str = attrStr.replace("{", "").replace("}", "");
                var strVal = node.getValue(str).getSimpleValue();
                template = template.replace(attrStr, strVal);
            }

            for (var j = 0; j < subAttr.size(); j++) {
                var attrStr = subAttr.get(j).getSimpleValue();
                var str = attrStr.replace("{", "").replace("}", "");
                var strVal = node1.getValue(str).getSimpleValue();
                emailSubject = emailSubject.replace(attrStr, strVal);
            }

            if (partyType)
                emailSubject = emailSubject.replace("{Counterparty type}", partyType);
            template = template.replace("{X}", size.toString());
            log.info(template);

            var sendMailFlag = false;
            var tlMail = emailEntityObj.getValue('EmailRecipient').getSimpleValue();
            eMail.addTo(tlMail);
            tlMail != null ? sendMailFlag = true : sendMailFlag = false;

        }

    }

    template = template.split("<lt/>").join("<");
    template = template.split("<gt/>").join(">");

    eMail.from("noreply@cloudmail.stibo.com", "STEP MDM");
    eMail.subject(emailSubject);
    eMail.htmlMessage(template);
    if (sendMailFlag) {
        eMail.send();
    }
}

function populateRefFromDefaultReferencedTargetLookup(node, manager, lookup, lookupTableID, defaultValueEntity, defaultReferencesIDArr) {
    for (var i in defaultReferencesIDArr) {
        var defaultRefTypeTargetID = lookup.getLookupTableValue(lookupTableID, defaultReferencesIDArr[i]);
        var defaultRefType = manager.getReferenceTypeHome().getReferenceTypeByID(defaultReferencesIDArr[i]);
        var targetRefType = manager.getReferenceTypeHome().getReferenceTypeByID(defaultRefTypeTargetID);
        var defaultRefTypeTarget = getReferencesTargets(defaultValueEntity, defaultRefType);
        if (defaultRefTypeTarget.size() > 0) {
            for (var j = 0; j < defaultRefTypeTarget.size(); j++) {
                createReferenceToTargetObject(node, manager, targetRefType, defaultRefTypeTarget.get(j));
            }
        }
    }
}

function validatePostalCodeForAddressDCObj(node, lookup, dcObj) {
    if (dcObj != null) {
        var countryId = dcObj.getValue("Country").getID();
        var postalCode = dcObj.getValue("PostalCode").getSimpleValue();

        var result = validatePostalCode(lookup, countryId, postalCode);
        if (result == "Postal Code format is invalid") {
            var message = lookup.getLookupTableValue("CountryRulesForPostalCodeErrorMessage", countryId);
            return result + ". " + message;
        }
        return result;
        //		return validatePostalCode(lookup, countryId, postalCode);
    }
    return true;
}

function validatePostalCode(lookup, countryId, postalCode) {
    if (postalCode != null) {
        var regExp = lookup.getLookupTableValue("CountryRulesPostalCode", countryId + "_Format");
        if (regExp != null) {
            var regEx = new RegExp(regExp, "g");
            return regEx.test(postalCode) ? true : "Postal Code format is invalid";
        } else {
            return true;
        }
    } else {
        var isMandatory = lookup.getLookupTableValue("CountryRulesPostalCode", countryId + "_Mandatory") != null ? true : false;
        return isMandatory ? "Postal Code is mandatory" : true;
    }
}

function approveReferencedTargets(node, manager) {
    var pendingApprovalRefs = java.util.HashSet();
    var allPartObjects = node.getNonApprovedObjects();
    var unapprovedRefTargets = getUnapprovedReferencedTargets(node, allPartObjects, manager);
    for (var i = 0; i < unapprovedRefTargets.length; i++) {
        unapprovedRefTargets[i].approve();
    }
}

function getUnapprovedReferencedTargets(node, unapprovedObjects, manager) {
    var targets = java.util.HashSet();
    for (var unapprovedInstance in Iterator(unapprovedObjects)) {
        if (unapprovedInstance instanceof com.stibo.core.domain.partobject.ReferencePartObject) {
            var refTypeID = unapprovedInstance.getReferenceType();
            if (refTypeID != "SAPAccountGroupRef") {
                var refType = manager.getReferenceTypeHome().getReferenceTypeByID(refTypeID);
                var refs = node.getReferences(refType);
                for (var i = 0; i < refs.size(); i++) {
                    targets.add(refs.get(i).getTarget());
                }
            }
        }
    }
    return targets.toArray();
}

function getDataContainerReferenceTargets(node, manager, dcTypeID, dcRefTypeID) {
    var target = new java.util.ArrayList();
    var dcObj;
    if (!isDataContainerNotPresent(node, dcTypeID)) {
        var dc = node.getDataContainerByTypeID(dcTypeID);
        if (dc.getDataContainerType().isMultiValued()) {
            var singleDCs = dc.getDataContainers();
            var singleDCsItr = singleDCs.iterator();
            while (singleDCsItr.hasNext()) {
                var singleDC = singleDCsItr.next();
                dcObj = singleDC.getDataContainerObject();
            }
        } else {
            dcObj = dc.getDataContainerObject();
        }
        var dcRefs = dcObj.getDataContainerReferences(manager.getReferenceTypeHome().getReferenceTypeByID(dcRefTypeID));
        if (!dcRefs.isEmpty()) {
            var itrRef = dcRefs.iterator();
            while (itrRef.hasNext()) {
                var dcRef = itrRef.next();
                target.add(dcRef.getTarget());
            }
        }
    }
    return target;
}

//----------------------Bank Key format Validation------------------------
function validateBankKey(bankKey, countryId, lookup) {
    var validationResult = false;
    var bankKeyUpperCase = bankKey.trim().toUpperCase();
    var groups = lookup.getLookupTableValue("BankMasterCountryRules", countryId);
    if (groups != null) {
        var groupsArr = groups.split(",");
        for (var i = 0; i < groupsArr.length; i++) {
            if (!validationResult) {
                validationResult = validateBankKeyForGroup(bankKeyUpperCase, countryId, lookup, groupsArr[i].trim());
            }
        }
        return validationResult ? true : "Entered Bank Key against Country is incorrect, please enter correct data to proceed";
    }
    return "No bank master country rules configured for the selected country, please contact system admin";
}

function validateBankKeyForGroup(bankKey, countryId, lookup, group) {
    var result = false;
    if ("Group1".equals(group)) {
        result = validateGroup1(bankKey, countryId, lookup, group);
    } else if ("Group2".equals(group)) {
        result = validateGroup2(bankKey, countryId, lookup, group);
    } else if ("Group3".equals(group)) {
        result = validateGroup3(bankKey, countryId, lookup, group);
    } else if ("Group4".equals(group)) {
        result = validateGroup4(bankKey, countryId, lookup, group);
    } else if ("Group5".equals(group)) {
        result = validateGroup5(bankKey, countryId, lookup, group);
    } else if ("Group6".equals(group)) {
        result = validateGroup6(bankKey, countryId, lookup, group);
    } else if ("Group7".equals(group)) {
        result = validateGroup7(bankKey, countryId, lookup, group);
    } else if ("Group8".equals(group)) {
        result = validateGroup8(bankKey, countryId, lookup, group);
    }
    return result;
}

//Group1=>without gaps
function validateGroup1(bankKey, countryId, lookup, group) {
    var isLengthCheckPassed = false;
    var length = lookup.getLookupTableValue("BankMasterCountryRules", countryId + "_" + group + "_Length");
    if (length == null) {
        length = lookup.getLookupTableValue("BankMasterCountryRules", "Default_" + group + "_Length");
    }
    var lengthArr = length.split(",");
    for (var i = 0; i < lengthArr.length; i++) {
        if (lengthArr[i].trim() == bankKey.length()) {
            isLengthCheckPassed = true;
            break;
        }
    }
    if (isLengthCheckPassed && !isWhiteSpacePresent(bankKey) && isUpperCase(bankKey) && is5n6thCharCountryCode(countryId, bankKey)) {
        return true;
    }
    return false;
}

//Group2=>Length to be kept to exactly, numerical, without gaps
function validateGroup2(bankKey, countryId, lookup, group) {
    var isLengthCheckPassed = false;
    var length = lookup.getLookupTableValue("BankMasterCountryRules", countryId + "_" + group + "_Length");
    var lengthArr = length.split(",");
    for (var i = 0; i < lengthArr.length; i++) {
        if (lengthArr[i].trim() == bankKey.length()) {
            isLengthCheckPassed = true;
            break;
        }
    }
    if (isLengthCheckPassed && !isWhiteSpacePresent(bankKey) && isInteger(bankKey)) {
        return true;
    }
    return false;
}

//Group3=>Maximum value length
function validateGroup3(bankKey, countryId, lookup, group) {
    var isLengthCheckPassed = false;
    var length = lookup.getLookupTableValue("BankMasterCountryRules", countryId + "_" + group + "_Length");
    var lengthArr = length.split(",");
    for (var i = 0; i < lengthArr.length; i++) {
        if (lengthArr[i].trim() >= bankKey.length()) {
            isLengthCheckPassed = true;
            break;
        }
    }
    if (isLengthCheckPassed && !isDoubleWhiteSpacePresent(bankKey) && isUpperCase(bankKey)) {
        return true;
    }
    return false;
}

//Group4=>Maximum value length, numerical
function validateGroup4(bankKey, countryId, lookup, group) {
    var isLengthCheckPassed = false;
    var length = lookup.getLookupTableValue("BankMasterCountryRules", countryId + "_" + group + "_Length");
    var lengthArr = length.split(",");
    for (var i = 0; i < lengthArr.length; i++) {
        if (lengthArr[i].trim() >= bankKey.length()) {
            isLengthCheckPassed = true;
            break;
        }
    }
    if (isLengthCheckPassed && isInteger(bankKey)) {
        return true;
    }
    return false;
}

//Group5=>Maximum value length, without gaps
function validateGroup5(bankKey, countryId, lookup, group) {
    var isLengthCheckPassed = false;
    var length = lookup.getLookupTableValue("BankMasterCountryRules", countryId + "_" + group + "_Length");
    var lengthArr = length.split(",");
    for (var i = 0; i < lengthArr.length; i++) {
        if (lengthArr[i].trim() >= bankKey.length()) {
            isLengthCheckPassed = true;
            break;
        }
    }
    if (isLengthCheckPassed && !isWhiteSpacePresent(bankKey) && isUpperCase(bankKey)) {
        return true;
    }
    return false;
}

//Group6=>start with IHC, followed by number, without gaps
function validateGroup6(bankKey, countryId, lookup, group) {
    var isLengthCheckPassed = false;
    var length = lookup.getLookupTableValue("BankMasterCountryRules", countryId + "_" + group + "_Length");
    if (length == null) {
        length = lookup.getLookupTableValue("BankMasterCountryRules", "Default_" + group + "_Length");
    }
    var lengthArr = length.split(",");
    for (var i = 0; i < lengthArr.length; i++) {
        if (lengthArr[i].trim() == bankKey.length()) {
            isLengthCheckPassed = true;
            break;
        }
    }
    if (isLengthCheckPassed && !isWhiteSpacePresent(bankKey) && bankKey.startsWith("IHC") && isInteger(bankKey.substring(3)) && isUpperCase(bankKey)) {
        return true;
    }
    return false;
}

//Group7=>Only for FI for one of the scenario where bank key is equal to IHC
function validateGroup7(bankKey, countryId, lookup, group) {
    if (bankKey.equals("IHC")) {
        return true;
    }
    return false;
}

//Group8=>Length to be kept to exactly, without gaps
function validateGroup8(bankKey, countryId, lookup, group) {
    var isLengthCheckPassed = false;
    var length = lookup.getLookupTableValue("BankMasterCountryRules", countryId + "_" + group + "_Length");
    var lengthArr = length.split(",");
    for (var i = 0; i < lengthArr.length; i++) {
        if (lengthArr[i].trim() == bankKey.length()) {
            isLengthCheckPassed = true;
            break;
        }
    }
    if (isLengthCheckPassed && !isWhiteSpacePresent(bankKey)) {
        return true;
    }
    return false;
}

function is5n6thCharCountryCode(bankCountry, bankKey) {
    if (bankKey.length() > 5) {
        var countryCode = bankKey.substring(4, 6);
        if (bankCountry.equals(countryCode)) {
            return true;
        }
    }
    return false;
}
//--------------------------------------End---------------------------------

function validateTaxNo(lookup, countryId, taxNo) {
    if (taxNo != null) {
        var regExp = lookup.getLookupTableValue("CountryRulesTaxNumbers", countryId + "_Format");
        if (regExp != null) {
            var regEx = new RegExp(regExp, "g");
            return regEx.test(taxNo) ? true : "Tax Number format is invalid";
        } else {
            return true;
        }
    } else {
        var isMandatory = lookup.getLookupTableValue("CountryRulesTaxNumbers", countryId + "_Mandatory") != null ? true : false;
        return isMandatory ? "Tax Number format is misssing" : true;
    }
}

function partialApproveName(node) {
    var toBeApprovedObj = new java.util.HashSet();
    var nonApprovedObjs = node.getNonApprovedObjects();
    var nonApprovedObjsItr = nonApprovedObjs.iterator();
    while (nonApprovedObjsItr.hasNext()) {
        var nonApprovedObj = nonApprovedObjsItr.next();
        if (nonApprovedObj instanceof com.stibo.core.domain.partobject.NamePartObject) {
            toBeApprovedObj.add(nonApprovedObj);
            break;
        }
    }
    node.approve(toBeApprovedObj);
}

//Function to send mail for Failed Postal Code Validation
function sendEmailForFailedPostalCode(node, manager, emailEntityNode, mail, dcObj, msg) {
    var emailEntityObj = manager.getEntityHome().getEntityByID(emailEntityNode);
    var template = emailEntityObj.getValue('EmailBody').getSimpleValue();
    var emailSubject = emailEntityObj.getValue('EmailSubject').getSimpleValue();
    var eMail = mail.mail();
    var country = dcObj.getValue("Country").getSimpleValue();
    var postalCode = dcObj.getValue("PostalCode").getSimpleValue();
    var KId = node.getValue("BusinessPartnerID").getSimpleValue();
    var recieverMail = emailEntityObj.getValue('EmailRecipient').getSimpleValue();

    if (postalCode == null) {
        msg = "Postal Code is missing";
        postalCode = "";
    }
    template = template.replace("{BusinessPartnerID}", KId);
    template = template.replace("{Country}", country);
    template = template.replace("{PostalCode}", postalCode);
    template = template.replace("{Reason}", msg);

    emailSubject = emailSubject.replace("{BusinessPartnerID}", KId);
    template = template.split("<lt/>").join("<");
    template = template.split("<gt/>").join(">");

    eMail.addTo(recieverMail);
    eMail.from("noreply@cloudmail.stibo.com", "STEP MDM");
    eMail.subject(emailSubject);
    eMail.htmlMessage(template);
    if (recieverMail) {
        eMail.send();
    }
}
// Function to send mail if IBAN code validation fail
function sendEmailForFailedIBANCode(node, manager, emailEntityNode, mail, dcObj, msg) {
    var emailEntityObj = manager.getEntityHome().getEntityByID(emailEntityNode);
    var template = emailEntityObj.getValue('EmailBody').getSimpleValue();
    var emailSubject = emailEntityObj.getValue('EmailSubject').getSimpleValue();
    var eMail = mail.mail();
    var country = dcObj.getValue("Country").getSimpleValue();
    var ibanCode = dcObj.getValue("SAP-IBAN").getSimpleValue();
    var KId = node.getValue("BusinessPartnerID").getSimpleValue();
    var recieverMail = emailEntityObj.getValue('EmailRecipient').getSimpleValue();

    if (ibanCode == null) {
        msg = "Mising IBAN Code";
        ibanCode = "blank";
    } else {
        msg = "Invalid IBAN Code";
    }
    template = template.replace("{BusinessPartnerID}", KId);
    template = template.replace("{Country}", country);
    template = template.replace("{ibanCode}", ibanCode);
    template = template.replace("{Reason}", msg);

    emailSubject = emailSubject.replace("{BusinessPartnerID}", KId);
    template = template.split("<lt/>").join("<");
    template = template.split("<gt/>").join(">");

    eMail.addTo(recieverMail);
    eMail.from("noreply@cloudmail.stibo.com", "STEP MDM");
    eMail.subject(emailSubject);
    eMail.htmlMessage(template);
    if (recieverMail) {
        eMail.send();
    }
}

//Function to sync Globally Reversible references present in ATG from Approved To Main
function syncReferencesFromApproveToMain(node, manager, attrGrpId) {
    var approvedNode = getApprovedNode(node, manager);
    var refTypes = manager.getAttributeGroupHome().getAttributeGroupByID(attrGrpId).getLinkTypes();
    var refItr = refTypes.iterator();
    while (refItr.hasNext()) {
        var refType = refItr.next();
        deleteReferences(node, refType);
        if (approvedNode) {
            copyReferences(approvedNode, node, refType, refType, null);
        }
    }

}

//Function to sync Globally Reversible reference (from ATG) target attibutes from Approved To Main
/* attrGrpIdRef - Attribute Group Containing references
 *  attrGrpIdAttr - Attribute Group Containing Attributes valid on Reference target
 */

function syncReferenceTargetsFromApproveToMain(node, manager, attrGrpIdRef, attrGrpIdAttr) {
    var approvedNode = getApprovedNode(node, manager);
    var refTypes = manager.getAttributeGroupHome().getAttributeGroupByID(attrGrpIdRef).getLinkTypes();
    var refItr = refTypes.iterator();
    while (refItr.hasNext()) {
        var refType = refItr.next();
        var targets = getReferencesTargets(node, refType);
        var tarItr = targets.iterator();
        while (tarItr.hasNext()) {
            var tar = tarItr.next();
            syncAttriValuesFromApproveToMain(tar, manager, attrGrpIdAttr);
        }
    }
}
// Function to send mail if Bank Account Number validation fail
function sendEmailForFailedBankAccountNumber(node, manager, emailEntityNode, mail, dcObj, msg) {
    var emailEntityObj = manager.getEntityHome().getEntityByID(emailEntityNode);
    var template = emailEntityObj.getValue('EmailBody').getSimpleValue();
    var emailSubject = emailEntityObj.getValue('EmailSubject').getSimpleValue();
    var eMail = mail.mail();
    var country = dcObj.getValue("Country").getSimpleValue();
    var bankAccountNumber = dcObj.getValue("SAP-BANKN").getSimpleValue();
    var KId = node.getValue("BusinessPartnerID").getSimpleValue();
    var recieverMail = emailEntityObj.getValue('EmailRecipient').getSimpleValue();

    if (bankAccountNumber == null) {
        msg = "Mising Bank Account Number Format";
        bankAccountNumber = "blank";
    } else {
        msg = "Invalid Bank Account Number Format";
    }
    template = template.replace("{BusinessPartnerID}", KId);
    template = template.replace("{Country}", country);
    template = template.replace("{bankAccountNumber}", bankAccountNumber);
    template = template.replace("{Reason}", msg);

    emailSubject = emailSubject.replace("{BusinessPartnerID}", KId);
    template = template.split("<lt/>").join("<");
    template = template.split("<gt/>").join(">");

    eMail.addTo(recieverMail);
    eMail.from("noreply@cloudmail.stibo.com", "STEP MDM");
    eMail.subject(emailSubject);
    eMail.htmlMessage(template);
    if (recieverMail) {
        eMail.send();
    }
}

function validateControlKey(lookup, countryId, controlKey, node) {
    var value = lookup.getLookupTableValue("CountryRulesControlKey", countryId);
    if (value != null) {
        if (value == "Mandatory") {
            return validateMandatory(node, value, controlKey, lookup);
        } else if (value == "Optional") {
            return validateOptional(node, value, controlKey);
        }
    } else { // Countries other than list should not hold control key.
        if (controlKey != null) {
            return false;
        } else {
            return true;
        }
    }
}
function validateMandatory(node, value, controlKey, lookup) {
    var value1 = lookup.getLookupTableValue("CountryRulesControlKey", value);
    if (controlKey) {
        if (controlKey.length() == value1) {
            return true;
        }
    } else {
        return false;
    }

}
function validateOptional(node, value, controlKey) {
    if (!controlKey) {
        return true
    } else if (controlKey) {
        if (controlKey.length() <= 2) {
            return true;
        }
    }
}

function sendEmailForFailedControlKey(node, manager, emailEntityNode, mail, dcObj, msg) {
    var emailEntityObj = manager.getEntityHome().getEntityByID(emailEntityNode);
    var template = emailEntityObj.getValue('EmailBody').getSimpleValue();
    var emailSubject = emailEntityObj.getValue('EmailSubject').getSimpleValue();
    var eMail = mail.mail();
    var country = dcObj.getValue("Country").getSimpleValue();
    var controlkey = dcObj.getValue("ControlKey").getSimpleValue();
    var KId = node.getValue("BusinessPartnerID").getSimpleValue();
    var recieverMail = emailEntityObj.getValue('EmailRecipient').getSimpleValue();
    if (controlkey == null) {
        msg = "Control Key is missing";
        controlkey = "";
    }
    template = template.replace("{BusinessPartnerID}", KId);
    template = template.replace("{Country}", country);
    template = template.replace("{ControlKey}", controlkey);
    template = template.replace("{Reason}", msg);

    emailSubject = emailSubject.replace("{BusinessPartnerID}", KId);
    template = template.split("<lt/>").join("<");
    template = template.split("<gt/>").join(">");

    eMail.addTo(recieverMail);
    eMail.from("noreply@cloudmail.stibo.com", "STEP MDM");
    eMail.subject(emailSubject);
    eMail.htmlMessage(template);
    if (recieverMail) {
        eMail.send();
    }
}
//Function to check if all validations on Employee are satisfied, if not returns message
function checkValidationsForPublishEMMsg(node, manager, lookup) {
    var hireRescind = node.getValue("HireRescind").getID();
    if (hireRescind == 1)
        return true;
    else {
        var msg = null;
        var publishFlag = true;

        var MaDc = node.getDataContainerByTypeID("MainAddressDataContainer");
        var MaDcObj = MaDc.getDataContainerObject();
        var taxNo = node.getValue("TaxRegistrationIDNumber").getSimpleValue();
        if (MaDcObj != null) {
            var flag;
            var countryId = MaDcObj.getValue("Country").getID();

            if (validatePostalCodeForAddressDCObj(node, lookup, MaDcObj) != true) //Postal Code Validation
            {
                publishFlag = false;
                msg == null ? msg = validatePostalCodeForAddressDCObj(node, lookup, MaDcObj) : msg += "\n" + validatePostalCodeForAddressDCObj(node, lookup, MaDcObj);
            }
        }
        var country = isDataContainerNotPresent(node, "MainAddressDataContainer") ? null : node.getDataContainerByTypeID("MainAddressDataContainer").getDataContainerObject().getValue("Country").getID();

        if (isDataContainerNotPresent(node, "SupplierBankAccount") && !isValuePresent(country, ["US", "CA"])) {
            publishFlag = false;
            msg == null ? msg = "Vendor Bank Details is not present: " + country : msg += "\n" + "Vendor Bank Details is not present: " + country;

        } else if (!isDataContainerNotPresent(node, "SupplierBankAccount")) {
            var bankdc = node.getDataContainerByTypeID("SupplierBankAccount");
            var bankdcObj = bankdc.getDataContainerObject();

            var bankCountry = bankdcObj.getValue("Country").getID();
            var bankKey = bankdcObj.getValue("BankKeyInternal").getSimpleValue();
            if (bankKey != null && bankCountry != null) {
                if (validateBankKey(bankKey, bankCountry, lookup) != true) //Bank Key
                {
                    publishFlag = false;

                    msg == null ? msg = validateBankKey(bankKey, bankCountry, lookup) : msg += "\n" + validateBankKey(bankKey, bankCountry, lookup);
                }
            } else {
                publishFlag = false;

                msg == null ? msg = "Bank Key & Country must be present" : msg += "\n" + "Bank Key & Country must be present";
            }

            var bankACNo = bankdcObj.getValue("SAP-BANKN").getSimpleValue();
            var acflag = false;
            acflag = validateBankAccountFormat(lookup, bankKey, bankCountry, bankACNo, acflag); //Bank Account
            if (acflag == true) {
                publishFlag = false;
                msg == null ? msg = "Invalid Bank Account Number Format with respect to Country Rules" : msg += "\n" + "Invalid Bank Account Number Format with respect to Country Rules";
            }

            var controlKey = bankdcObj.getValue("ControlKey").getSimpleValue();

            if (validateControlKey(lookup, bankCountry, controlKey, node) != true) // Control key
            {

                publishFlag = false;
                msg == null ? msg = "Invalid Control Key with respect to Country Rules" : msg += "\n" + "Invalid Control Key with respect to Country Rules";
            }

            var bankSerVerf = bankdcObj.getValue("BankAccountServiceVerified").getLOVValue();
            if (bankSerVerf != null) {
                var bankSerVerfId = bankSerVerf.getID();
                var ibanCode = bankdcObj.getValue("SAP-IBAN").getSimpleValue();

                if (bankSerVerfId == 999) {
                    publishFlag = false;

                    if (ibanCode == null) {
                        msg == null ? msg = "Missing IBAN Code" : msg += "\n" + "Missing IBAN Code";
                    } else {
                        msg == null ? msg = "Invalid IBAN Code" : msg += "\n" + "Invalid IBAN Code";
                    }
                }
            }
        }

        if (publishFlag == true)
            return true;
        else
            return msg;
    }
}

//Function to check if all validations on Employee are satisfied, if not returns false
function checkValidationsForPublishEM(node, manager, lookup) {
    var flag = checkValidationsForPublishEMMsg(node, manager, lookup);
    if (flag == true)
        return true;
    else
        return false;
}

/*************************START OF THIRD PARTY*************************/
function getSource(node, refType, sourceObjectTypeID) {
    var references = node.queryReferencedBy(refType).asList(2);
    for (var i = 0; i < references.size(); i++) {
        if (sourceObjectTypeID.equals(references.get(i).getSource().getObjectType().getID())) {
            return references.get(i).getSource();
        }
    }
    return null;
}

function validatePOBoxPostalCodeForAddressDCObj(node, lookup, dcObj) {
    if (dcObj != null) {
        var countryId = dcObj.getValue("POBoxCountry").getID();
        var postalCode = dcObj.getValue("POBoxPostalCode").getSimpleValue();
        var result = validatePOPostalCode(lookup, countryId, postalCode);
        if (result == "PO Box Postal Code format is invalid") {
            var message = lookup.getLookupTableValue("CountryRulesForPostalCodeErrorMessage", countryId);
            return result + ". " + message;
        }
        return result;
    }
    return true;
}

function validatePOPostalCode(lookup, countryId, postalCode) {
    if (postalCode != null) {
        var regExp = lookup.getLookupTableValue("CountryRulesPostalCode", countryId + "_Format");
        if (regExp != null) {
            var regEx = new RegExp(regExp, "g");
            return regEx.test(postalCode) ? true : "PO Box Postal Code format is invalid";
        } else {
            return true;
        }
    } else {
        var isMandatory = lookup.getLookupTableValue("CountryRulesPostalCode", countryId + "_Mandatory") != null ? true : false;
        return isMandatory ? "PO Box Postal Code is mandatory" : true;
    }
}

//----------------------Bank Key format Validation for 3rd Wave------------------------
function validateBankKeyOrg(bankKey, country, lookup, string) {
    var validationResult = false;
    var bankKeyUpperCase = bankKey.trim().toUpperCase();
    var countryId = country.getID();
    var ctry = country.getSimpleValue();
    var msg = "";
    var errorMessage = lookup.getLookupTableValue("CountryRules_ErrorMessage", countryId);
    var groups = lookup.getLookupTableValue("BankMasterCountryRules", countryId);
    if (groups != null) {
        var groupsArr = groups.split(",");
        for (var i = 0; i < groupsArr.length; i++) {
            if (!validationResult) {
                validationResult = validateBankKeyForGroup(bankKeyUpperCase, countryId, lookup, groupsArr[i].trim());
            }
        }
        if (validationResult != true) {
            msg = "Entered Bank Key " + bankKey + " against Country " + ctry + " for " + string + " bank account is incorrect.";
            msg += "\n" + errorMessage;
        }
        return validationResult ? true : msg;
    }
    return "No bank master country rules configured for the selected country " + ctry + ", please contact system admin";
}

//--------------------------------------End---------------------------------
function linkBankMasterOrg(node, manager, dcTypeID, refType) {
    if (!isDataContainerNotPresent(node, dcTypeID)) {
        var bankDc = node.getDataContainerByTypeID(dcTypeID).getDataContainers();
        var itr = bankDc.iterator();
        while (itr.hasNext()) {
            var bankDcInst = itr.next().getDataContainerObject();
            var bankKey = bankDcInst.getValue("BankKeyInternal").getSimpleValue();
            var bankCountry = bankDcInst.getValue("Country").getID();
            if (bankCountry == "CZ") {
                bankCountry = "Czech Republic";
            } else if (bankCountry == "US") {
                bankCountry = "USA";
            } else {
                bankCountry = bankDcInst.getValue("Country").getSimpleValue();
            }

            if (bankKey != null && bankCountry != null) {
                //var keyValue = getConcatenatedValue(bankDcInst, ["BankKeyInternal", "Country"], null);
                var keyValue = bankKey + bankCountry;
                var bm = manager.getNodeHome().getObjectByKey("BankMasterUniqueKey", keyValue);
                var dcrefs = bankDcInst.getDataContainerReferences(refType);
                log.severe(bm);
                if (bm != null) {
                    if (dcrefs.size() == 0) {
                        bankDcInst.createReference(bm, refType);
                    } else if (dcrefs.size() > 0) {
                        var existingBM = dcrefs.get(0).getTarget();
                        var existingKeyValue = getConcatenatedValue(existingBM, ["BankKey", "BankCountry"], null);

                        if (keyValue != existingKeyValue) {
                            dcrefs.get(0).delete();
                            bankDcInst.createReference(bm, refType);
                        }
                    }
                } else {
                    var parent = manager.getEntityHome().getEntityByID("BankMasterRoot");
                    var data = parent.createEntity(null, "BankMaster");
                    logger.info(data.getID());
                    data.getValue("BankKey").setSimpleValue(bankKey);
                    data.getValue("BankCountry").setSimpleValue(bankCountry);
                    data.getValue("InitiatedByOrg").setLOVValueByID("Y"); //Added as part of defect 22348
                    data.startWorkflowByID("BankMasterCreateWorkflow", "Bank Master Create workflow is initiated from Organisation");
                    if (dcrefs.size() > 0) {
                        dcrefs.get(0).delete();
                    }
                    bankDcInst.createReference(data, refType);
                }
            }
        }
    }
}

function isBelongtoIHC(node, manager, dcTypeID, refType) {
    if (!isDataContainerNotPresent(node, dcTypeID)) {
        var flag = false;
        var bankDc = node.getDataContainerByTypeID(dcTypeID).getDataContainers();
        var itr = bankDc.iterator();
        while (itr.hasNext()) {
            var bankDcInst = itr.next().getDataContainerObject();
            var dcrefs = bankDcInst.getDataContainerReferences(refType);
            if (dcrefs.size() > 0) {
                for (i = 0; i < dcrefs.size(); i++) {
                    var bankMaster = dcrefs.get(i).getTarget();
                    var bankKeyType = bankMaster.getValue("BankKeyType").getSimpleValue();
                    if (bankKeyType == "IHC") {
                        flag = true;
                        break;
                    }
                }
            }
        }
    }
    return flag;
}
function hasValidBankRef(node, manager, dcTypeID, refType) {
    if (!isDataContainerNotPresent(node, dcTypeID)) {
        var flag = false;
        var bankDc = node.getDataContainerByTypeID(dcTypeID).getDataContainers();
        var itr = bankDc.iterator();
        while (itr.hasNext()) {
            var bankDcInst = itr.next().getDataContainerObject();
            var dcrefs = bankDcInst.getDataContainerReferences(refType);
            if (dcrefs.size() > 0) {
                var bankMaster = dcrefs.get(0).getTarget();
                if (bankMaster) {
                    flag = true;
                    break;
                }
            }
        }
    }
    return flag;
}
function checkBankUniqueCombination(node, manager, dcTypeID) {
    if (!isDataContainerNotPresent(node, dcTypeID)) {
        var uniqueComb = new java.util.HashSet();
        var bankDc = node.getDataContainerByTypeID(dcTypeID).getDataContainers();
        var itr = bankDc.iterator();
        while (itr.hasNext()) {
            var bankDcInst = itr.next().getDataContainerObject();
            var bankKey = bankDcInst.getValue("BankKeyInternal").getSimpleValue();
            var bankCountry = bankDcInst.getValue("Country").getID();
            var bankAccNo = bankDcInst.getValue("SAP-BANKN").getSimpleValue();
            var bankCurre = bankDcInst.getValue("UPMCurrency").getSimpleValue();
            var comb = bankCountry + bankKey + bankAccNo + bankCurre;
            uniqueComb.add(comb);
        }
        if (bankDc.size() == uniqueComb.size())
            return true;
        else
            return "Banks cannot have same value for combination of Bank Country, Bank Key, Bank Account Number, Bank Currency. Please enter unique values."
    }
}

function validateTaxNoOrg(lookup, countryId, taxNo) {
    if (taxNo != null) {
        var regExp = lookup.getLookupTableValue("3PCountryRulesTaxNumbers", countryId + "_Format");
        if (regExp != null) {
            var regEx = new RegExp(regExp, "g");
            return regEx.test(taxNo) ? true : "Tax / Registration / ID Number format is invalid for Country " + countryId;
        } else {
            return true;
        }
    } else {
        var isMandatory = lookup.getLookupTableValue("3PCountryRulesTaxNumbers", countryId + "_Mandatory") != null ? true : false;
        return isMandatory ? "Tax / Registration / ID Number is mandatory for Country " + countryId : true;
    }
}

function sendEmailNotificationOrganisation(node, manager, emailEntityNode, mail, wf, stateId, screenId, recipient) {
    var emailEntityObj = manager.getEntityHome().getEntityByID(emailEntityNode);
    var emailSwitch = emailEntityObj.getValue('EmailSwitch').getID();
    //if (emailSwitch == "Y") {
    if (emailEntityObj.getValue('EmailBody'))
        var template = emailEntityObj.getValue('EmailBody').getSimpleValue();
    if (emailEntityObj.getValue('EmailSubject'))
        var emailSubject = emailEntityObj.getValue('EmailSubject').getSimpleValue();
    var eMail = mail.mail();

    var templateAttr = new java.util.ArrayList();
    templateAttr = emailEntityObj.getValue("EmailBodyAttributes").getValues();

    var subAttr = new java.util.ArrayList();
    subAttr = emailEntityObj.getValue("EmailSubjectAttributes").getValues();

    var partyType = identifyPartyType(node, manager, wf);
    var workflowInstance = node.getWorkflowInstance(wf);
    //var workflowInstance = node.getWorkflowInstanceByID(wf);
    if (workflowInstance) {

        var URL = getEnvironmentURL(manager);
        template = template.replace("(url)", URL);
        template = template.replace("(screenId)", screenId);
        template = template.replace("(wfId)", wf.getID());
        //template = template.replace("(wfId)", wf);
        template = template.replace("(stateId)", stateId).replace("(stateId)", stateId);
        var orgName = node.getValue("LegalName").getSimpleValue();
        if (orgName != null) {
            var orgLen = orgName.length();
            orgName = orgLen < 70 ? orgName : orgName.substring(0, 70);
            template = template.replace("(Name)", orgName);
            emailSubject = emailSubject.replace("(Name)", orgName);
        } else {
            template = template.replace("(Name)", "");
            emailSubject = emailSubject.replace("(Name)", "");
        }
        //template = template.replace("(Name)", orgName);

        template = template.split("<lt/>").join("<");
        template = template.split("<gt/>").join(">");

        for (var i = 0; i < templateAttr.size(); i++) {
            var attrStr = templateAttr.get(i).getSimpleValue();
            var str = attrStr.replace("{", "").replace("}", "");
            var strVal = node.getValue(str).getSimpleValue();
            template = template.replace(attrStr, strVal);
        }

        if (partyType)
            template = template.replace("{Counterparty type}", partyType);
        for (var j = 0; j < subAttr.size(); j++) {
            var attrStr = subAttr.get(j).getSimpleValue();
            var str = attrStr.replace("{", "").replace("}", "");
            var strVal = node.getValue(str).getSimpleValue();
            emailSubject = emailSubject.replace(attrStr, strVal);
        }

        if (partyType)
            emailSubject = emailSubject.replace("{Counterparty type}", partyType);
        //log.info("orgName>>> "+orgName);
        //emailSubject = emailSubject.replace("(Name)", orgName);
        var sendMailFlag = false;
        if (recipient == "Requestor") {
            var requestorId = workflowInstance.getSimpleVariable("requestorId");
            var requestDate = workflowInstance.getSimpleVariable("requestSubmittedDate");
            var assignee = manager.getUserHome().getUserByID(requestorId);
            var assigneeName = assignee.getName();
            var assigneeEmail = assignee.getEMail();
            log.info(assignee);
            template = template.replace("{Name Surname}", assigneeName);
            eMail.addTo(assigneeEmail, assigneeName);
            assigneeEmail != null ? sendMailFlag = true : sendMailFlag = false;
        } else if (recipient == "Master Data Verifier") {
            var userGroup;
            partyType == "Employee Customer" ? userGroup = "EMCustomerVerifier" : userGroup = "EMVendorVerifier";
            var verifierMail = extractEmailIDs(node, manager, userGroup);
            var verifierMailArray = verifierMail.toArray();
            var arrSize = verifierMailArray.length;

            for (var i = 0; i < arrSize; i++) {
                eMail.addTo(verifierMailArray[i]);
                sendMailFlag = true;
            }
        }
        eMail.from("noreply@cloudmail.stibo.com", "STEP MDM");
        eMail.subject(emailSubject);
        eMail.htmlMessage(template);
        if (sendMailFlag) {
            eMail.send();
        }
    }
}

//Method to send Email Notification for Vendor Create and Update Wfs
function sendEmailNotificationVendor(node, manager, emailEntityNode, mail, wf, stateId, screenId, recipient) {

    var eMail = mail.mail();
    var emailEntityObj = manager.getEntityHome().getEntityByID(emailEntityNode);
    var emailSwitch = emailEntityObj.getValue('EmailSwitch').getID();
    //if (emailSwitch == "Y") {
    if (emailEntityObj.getValue('EmailBody'))
        var template = emailEntityObj.getValue('EmailBody').getSimpleValue();

    if (emailEntityObj.getValue('EmailSubject'))
        var emailSubject = emailEntityObj.getValue('EmailSubject').getSimpleValue();

    var templateAttr = new java.util.ArrayList();
    templateAttr = emailEntityObj.getValue("EmailBodyAttributes").getValues();

    var subjectAttr = new java.util.ArrayList();
    subjectAttr = emailEntityObj.getValue("EmailSubjectAttributes").getValues();

    var partyType = identifyPartyType(node, manager, wf);
    var workflowInstance = node.getWorkflowInstance(wf);

    if (workflowInstance) {
        var URL = getEnvironmentURL(manager);
        template = template.replace("(url)", URL);
        template = template.replace("(screenId)", screenId);
        template = template.replace("(wfId)", wf.getID());
        //template = template.replace("(wfId)", wf);
        template = template.replace("(stateId)", stateId).replace("(stateId)", stateId);

        template = template.split("<lt/>").join("<");
        template = template.split("<gt/>").join(">");

        for (var i = 0; i < templateAttr.size(); i++) {
            var attrStr = templateAttr.get(i).getSimpleValue();
            var str = attrStr.replace("{", "").replace("}", "");
            if (str == "OrganisationBusinessAreaSupplier") {
                var businessAreas = getReferencesTargets(node, manager.getReferenceTypeHome().getReferenceTypeByID("OrgSuppBusinessAreaDataEntityWfl"));
                if (businessAreas.size() > 0) {
                    var baData = businessAreas.get(0);
                    var strVal = baData.getName();
                    template = template.replace(attrStr, strVal);
                } else {
                    template = template.replace(attrStr, "");
                }
            } else {
                var strVal = node.getValue(str).getSimpleValue();
                template = template.replace(attrStr, strVal);
            }
        }

        if (partyType)
            template = template.replace("{Counterparty type}", partyType);

        for (var j = 0; j < subjectAttr.size(); j++) {
            var attrStr = subjectAttr.get(j).getSimpleValue();
            var str = attrStr.replace("{", "").replace("}", "");
            var strVal = node.getValue(str).getSimpleValue();
            if (attrStr && strVal) {
                emailSubject = emailSubject.replace(attrStr, strVal);
            }
        }

        if (partyType)
            emailSubject = emailSubject.replace("{Counterparty type}", partyType);

        var sendMailFlag = false;
        //RFC 22069
        if (recipient == "join.ariba@upm.com") {
            template = template.replace("{Name Surname}", recipient);
            eMail.addTo(recipient);
            sendMailFlag = true;
        }

        if (recipient == "Third Party Requestor") {
            //template = template.replace("{Name Surname}", "Third Party Requestor");
            var requestorId = workflowInstance.getSimpleVariable("requestorId");
            if (manager.getUserHome().getUserByID(requestorId)) {
                var assignee = manager.getUserHome().getUserByID(requestorId);
                var assigneeName = assignee.getName();
                var assigneeEmail = assignee.getEMail();
                template = template.replace("{Name Surname}", assigneeName);
                eMail.addTo(assigneeEmail, assigneeName);
                assigneeEmail != null ? sendMailFlag = true : sendMailFlag = false;
            } else {
                if (requestorId == "3PForITVendorRequestor") {
                    var baRefType1 = manager.getReferenceTypeHome().getReferenceTypeByID("OrganisationBusinessAreaDataEntity");
                    var baRefs = getReferencesTargets(node, baRefType1);
                    if (baRefs.size() > 0) {
                        for (var b = 0; b < baRefs.size(); b++) {
                            var baID = baRefs.get(b).getValue("BusinessAreaID").getSimpleValue();
                            if (baID) {
                                if (baID == "FORFIN") {
                                    var reqMails = extractEmailIDsWithName(node, manager, "906e61de-5479-4e86-968f-689a44424399");
                                    if (reqMails) {
                                        //var nameTemp = "ForIT Requestor";
                                        reqMails.forEach((userEmail, name) => {
                                            eMail.addTo(userEmail, name);
                                            sendMailFlag = true;
                                            //template = template.replace(nameTemp, "{Name Surname}");
                                            template = template.replace("{Name Surname}", "ForIT Requestor");
                                            //nameTemp = name;
                                        });
                                    }
                                } else if (baID == "FORGER") {
                                    eMail.addTo("stammdaten@upm.com");
                                    sendMailFlag = true;
                                }
                            }
                        }
                    }
                } else {
                    var reqMails = extractEmailIDsWithName(node, manager, requestorId);
                    if (reqMails) {
                        reqMails.forEach((userEmail, name) => {
                            eMail.addTo(userEmail, name);
                            sendMailFlag = true;
                            template = template.replace("{Name Surname}", name);
                        });
                    }
                }
            }
        }
        // Vendor MD Verifier
        else if (recipient == "GLO APPS STEP MDM QA Vendor MD Verifier") {
            template = template.replace("{Name Surname}", "Vendor MD Verifier");
            template = template.replace("{Receiver}", "Vendor MD Verifier").replace("{Receiver}", "Vendor MD Verifier");
            var userGroup = "70372901-e496-464c-8084-51dea6b1d9d9";
            var verifierMail = extractEmailIDs(node, manager, userGroup);
            var verifierMailArray = verifierMail.toArray();
            var arrSize = verifierMailArray.length;

            for (var i = 0; i < arrSize; i++) {
                eMail.addTo(verifierMailArray[i]);
                sendMailFlag = true;
            }
        }

        // MD Verifier Business Partner
        else if (recipient == "GLO APPS STEP MDM QA MD Verifier Business Partner") {
            template = template.replace("{Name Surname}", "MD Verifier Business Partner");
            template = template.replace("{Receiver}", "MD Verifier Business Partner").replace("{Receiver}", "MD Verifier Business Partner");
            var userGroup = "75f98826-240b-4da9-8be4-7cad4614a33b";
            var verifierMail = extractEmailIDs(node, manager, userGroup);
            var verifierMailArray = verifierMail.toArray();
            var arrSize = verifierMailArray.length;

            for (var i = 0; i < arrSize; i++) {
                eMail.addTo(verifierMailArray[i]);
                sendMailFlag = true;
            }
        }

        //
        else if (recipient == "GLO APPS STEP MDM QA Counterparty Risk Approver") {
            template = template.replace("{Name Surname}", "Counterparty Risk Approver");
            template = template.replace("{Receiver}", "Counterparty Risk Approver").replace("{Receiver}", "Counterparty Risk Approver");
            var userGroup = "894019a1-cbc5-4f62-8b15-4500d81522a9";
            var verifierMail = extractEmailIDs(node, manager, userGroup);
            var verifierMailArray = verifierMail.toArray();
            var arrSize = verifierMailArray.length;
		  //v812149 for INC2742589 - start
//            for (var i = 0; i < arrSize; i++) {
//              if(verifierMailArray[i] == "cprm@upm.com"){ //v812149 for INC2737093 - added only if condition
//				eMail.addTo(verifierMailArray[i]);
				var cprmMail = "cprm@upm.com";
				eMail.addTo(cprmMail);
				sendMailFlag = true;
//			} //v812149 for INC2737093
//            }
		  //v812149 for INC2742589 - end
        } else if (recipient == "Third Party Supplier") {
            template = template.replace("{Name Surname}", "Third Party Supplier");
            template = template.replace("{Receiver}", "Third Party Supplier").replace("{Receiver}", "Third Party Supplier");
            var userGroup = "3PSupplier";
            var verifierMail = extractEmailIDs(node, manager, userGroup);
            var verifierMailArray = verifierMail.toArray();
            var arrSize = verifierMailArray.length;

            for (var i = 0; i < arrSize; i++) {
                eMail.addTo(verifierMailArray[i]);
                sendMailFlag = true;
            }
        }

        // Vendor Finance Approver
        else if (recipient == "GLO APPS STEP MDM QA Vendor Finance Approver") {
            template = template.replace("{Name Surname}", "Vendor Finance Approver");
            template = template.replace("{Receiver}", "Vendor Finance Approver").replace("{Receiver}", "Vendor Finance Approver");
            var userGroup = "ae75c3d3-2f06-43cd-80ce-287dd806000f";
            var verifierMail = extractEmailIDs(node, manager, userGroup);
            var verifierMailArray = verifierMail.toArray();
            var arrSize = verifierMailArray.length;

            for (var i = 0; i < arrSize; i++) {
                eMail.addTo(verifierMailArray[i]);
                sendMailFlag = true;
            }
        }

        // Bank Account Approver
        else if (recipient == "GLO APPS STEP MDM QA Bank Account Approver") {
            template = template.replace("{Name Surname}", "Bank Account Approver");
            template = template.replace("{Receiver}", "Bank Account Approver").replace("{Receiver}", "Bank Account Approver");
            var userGroup = "15ea08aa-271d-47ab-afbd-311289b0550b";
            var verifierMail = extractEmailIDs(node, manager, userGroup);
            var verifierMailArray = verifierMail.toArray();
            var arrSize = verifierMailArray.length;

            for (var i = 0; i < arrSize; i++) {
                eMail.addTo(verifierMailArray[i]);
                sendMailFlag = true;
            }
        } else if (recipient == "Third Party Supplier Operations") {
            template = template.replace("{Name Surname}", "Third Party Supplier Operations");
            template = template.replace("{Receiver}", "Third Party Supplier Operations").replace("{Receiver}", "Third Party Supplier Operations");
            var userGroup = "3PSupplierOperations";
            var verifierMail = extractEmailIDs(node, manager, userGroup);
            var verifierMailArray = verifierMail.toArray();
            var arrSize = verifierMailArray.length;

            for (var i = 0; i < arrSize; i++) {
                eMail.addTo(verifierMailArray[i]);
                sendMailFlag = true;
            }
        } else if (recipient == "UPM Suppliers") {
            template = template.replace("{Name Surname}", "UPM Suppliers");
            template = template.replace("{Receiver}", "UPM Suppliers").replace("{Receiver}", "UPM Suppliers");
            var userGroup = "UPMSuppliers";
            var verifierMail = extractEmailIDs(node, manager, userGroup);
            var verifierMailArray = verifierMail.toArray();
            var arrSize = verifierMailArray.length;

            for (var i = 0; i < arrSize; i++) {
                eMail.addTo(verifierMailArray[i]);
                sendMailFlag = true;
            }
        }

        // Third Party Business Approver
        else if (recipient == "Third Party Business Approver") {
            if (emailEntityNode == "3PVendorBlockingTaskRejectedTemplate") {
                var refID = manager.getReferenceTypeHome().getReferenceTypeByID("OrganisationBusinessAreaSupplier");
                var refs = getReferencesTargets(node, refID);
                var vendorBusinessAreaList = "";
                for (var i = 0; i < refs.size(); i++) {
                    vendorBusinessAreaList = vendorBusinessAreaList + refs.get(i).getID();
                     + ", ";
                }
                template = template.replace("{OrganisationBusinessAreaSupplier}", vendorBusinessAreaList);
            }
            //RFC 21510 - 0.94 version - line 3501 to 3510 and 3515 to 3528 Added null check for reftype.
            else if (emailEntityNode == "3PVendorTaskPendingNotiTempBusiApp") {
                var refID = manager.getReferenceTypeHome().getReferenceTypeByID("OrganisationBusinessAreaSupplier");
                var refs = getReferencesTargets(node, refID);
                var vendorBusinessAreaList = "";
                for (var i = 0; i < refs.size(); i++) {
                    vendorBusinessAreaList = vendorBusinessAreaList + refs.get(i).getID();
                     + ", ";
                }
                template = template.replace("{OrganisationBusinessAreaSupplier}", vendorBusinessAreaList);
            }

            template = template.replace("{Name Surname}", "Third Party Business Approver");
            template = template.replace("{Receiver}", "Third Party Business Approver").replace("{Receiver}", "Third Party Business Approver");
            var refType = node.getReferences(manager.getReferenceTypeHome().getReferenceTypeByID("OrgSuppBusinessAreaDataEntityWfl")).toArray();
            if (refType.length > 0) {
                var refDataID = refType[0].getTarget().getValue("BusinessAreaID").getSimpleValue();
                var ADGroupID = manager.getHome(com.stibo.lookuptable.domain.LookupTableHome).getLookupTableValue("3PBusinessApproverADforBA", refDataID);

                var userGroup = ADGroupID;
                var verifierMail = extractEmailIDs(node, manager, userGroup);
                var verifierMailArray = verifierMail.toArray();
                var arrSize = verifierMailArray.length;

                for (var i = 0; i < arrSize; i++) {
                    eMail.addTo(verifierMailArray[i]);
                    sendMailFlag = true;
                }
            }
        } else if (recipient == "Supplier Portal") {

            template = template.replace("{Name Surname}", "Third Party Supplier");
            template = template.replace("{Receiver}", "Third Party Supplier").replace("{Receiver}", "Third Party Supplier");
            var userGroup = node.getValue("MDMBPNumber").getSimpleValue();
            var verifierMail = extractEmailIDs(node, manager, userGroup);
            var verifierMailArray = verifierMail.toArray();
            var arrSize = verifierMailArray.length;

            for (var i = 0; i < arrSize; i++) {
                eMail.addTo(verifierMailArray[i]);
                sendMailFlag = true;
            }

        }

        // Vendor Accounts Payable Approver
        else if (recipient == "GLO APPS STEP MDM QA Vendor Accounts Payable Approver") {
            template = template.replace("{Name Surname}", "Vendor Accounts Payable Approver");
            template = template.replace("{Receiver}", "Vendor Accounts Payable Approver").replace("{Receiver}", "Vendor Accounts Payable Approver");
            var userGroup = "a5fcf46f-d0f8-4e9e-b412-c0f0a173869b";
            var verifierMail = extractEmailIDs(node, manager, userGroup);
            var verifierMailArray = verifierMail.toArray();
            var arrSize = verifierMailArray.length;

            for (var i = 0; i < arrSize; i++) {
                eMail.addTo(verifierMailArray[i]);
                sendMailFlag = true;
            }

            // Vendor Ariba Approver
        } else if (recipient == "GLO APPS STEP MDM QA Supplier Operations Maint") {
            template = template.replace("{Name Surname}", "Third Party Ariba Approver");
            template = template.replace("{Receiver}", "Third Party Ariba Approver").replace("{Receiver}", "Third Party Ariba Approver");
            var userGroup = "057b6a3e-9ca9-4d33-b7f8-7b1153d14a5f";
            var verifierMail = extractEmailIDs(node, manager, userGroup);
            var verifierMailArray = verifierMail.toArray();
            var arrSize = verifierMailArray.length;

            for (var i = 0; i < arrSize; i++) {
                eMail.addTo(verifierMailArray[i]);
                sendMailFlag = true;
            }
        } else if (recipient == "Contact Person Requestor") {
            template = template.replace("{Receiver}", "Contact Person Requestor").replace("{Receiver}", "Contact Person Requestor");
            var userGroup = "3PContactPersonRequestor";
            var verifierMail = extractEmailIDs(node, manager, userGroup);
            var verifierMailArray = verifierMail.toArray();
            var arrSize = verifierMailArray.length;

            for (var i = 0; i < arrSize; i++) {
                eMail.addTo(verifierMailArray[i]);
                sendMailFlag = true;
            }
        }
    }
    //}

    eMail.from("noreply@cloudmail.stibo.com", "STEP MDM");
    eMail.subject(emailSubject);
    eMail.htmlMessage(template);
    if (sendMailFlag) {
        eMail.send();
    }
}

function removeReferences(node, refType) {
    var references = node.queryReferences(refType).asList(2);
    for (var i = 0; i < references.size(); i++) {
        references.get(i).delete();
    }
}
function removeReferencedBy(node, refType) {
    var references = node.queryReferencedBy(refType).asList(2);
    for (var i = 0; i < references.size(); i++) {
        references.get(i).delete();
    }
}
function deleteReferencesFromAttributeGroup(node, manager, attrGrpId) {
    var refTypes = manager.getAttributeGroupHome().getAttributeGroupByID(attrGrpId).getLinkTypes();
    var refItr = refTypes.iterator();
    while (refItr.hasNext()) {
        var refType = refItr.next();
        deleteReferences(node, refType);
    }
}
function deleteReferenceTargets(node, refType) {
    var refTargets = getReferencesTargets(node, refType);
    var refItr = refTargets.iterator();
    while (refItr.hasNext()) {
        var refTar = refItr.next();
        refTar.delete();
    }
}
//Method to send Email Notification for Customer Create, Update & Deactivate Wfs
function sendEmailNotificationCustomer(node, manager, emailEntityNode, mail, wf, stateId, screenId, recipient) {

    var eMail = mail.mail();
    var emailEntityObj = manager.getEntityHome().getEntityByID(emailEntityNode);
    var emailSwitch = emailEntityObj.getValue('EmailSwitch').getID();
    //if (emailSwitch == "Y") {
    if (emailEntityObj.getValue('EmailBody'))
        var template = emailEntityObj.getValue('EmailBody').getSimpleValue();

    if (emailEntityObj.getValue('EmailSubject'))
        var emailSubject = emailEntityObj.getValue('EmailSubject').getSimpleValue();

    var templateAttr = new java.util.ArrayList();
    templateAttr = emailEntityObj.getValue("EmailBodyAttributes").getValues();

    var subjectAttr = new java.util.ArrayList();
    subjectAttr = emailEntityObj.getValue("EmailSubjectAttributes").getValues();

    var partyType = identifyPartyType(node, manager, wf);
    var workflowInstance = node.getWorkflowInstance(wf);

    var nameline1 = node.getValue("NameLine1").getSimpleValue();
    var nameline2 = node.getValue("NameLine2").getSimpleValue();
    var nameconcat = nameline2 == null || nameline2 == '' ? nameline1 : nameline1 + " " + nameline2;
    if (nameconcat == null) {
        nameconcat = node.getValue("LegalName").getSimpleValue();
    }
    if (workflowInstance) {
        var URL = getEnvironmentURL(manager);
        template = template.replace("(url)", URL);
        template = template.replace("{Name}", nameconcat);
        template = template.replace("(screenId)", screenId);
        template = template.replace("(wfId)", wf.getID());
        //template = template.replace("(wfId)", wf);
        template = template.replace("(stateId)", stateId).replace("(stateId)", stateId);

        template = template.split("<lt/>").join("<");
        template = template.split("<gt/>").join(">");

        for (var i = 0; i < templateAttr.size(); i++) {
            var attrStr = templateAttr.get(i).getSimpleValue();
            var str = attrStr.replace("{", "").replace("}", "");
            var strVal = node.getValue(str).getSimpleValue();
            template = template.replace(attrStr, strVal);
        }

        if (partyType)
            template = template.replace("{Counterparty type}", partyType);

        for (var j = 0; j < subjectAttr.size(); j++) {
            var attrStr = subjectAttr.get(j).getSimpleValue();
            var str = attrStr.replace("{", "").replace("}", "");
            var strVal = node.getValue(str).getSimpleValue();
            log.severe(attrStr);
            emailSubject = emailSubject.replace(attrStr, strVal);
        }

        if (partyType)
            emailSubject = emailSubject.replace("{Counterparty type}", partyType);
        emailSubject = emailSubject.replace("{Name}", nameconcat);

        var sendMailFlag = false;

        if (recipient == "Third Party Requestor") {
            var requestorId = workflowInstance.getSimpleVariable("requestorId");
            if (manager.getUserHome().getUserByID(requestorId)) {
                var assignee = manager.getUserHome().getUserByID(requestorId);
                var assigneeName = assignee.getName();
                var assigneeEmail = assignee.getEMail();
                template = template.replace("{Name Surname}", assigneeName);
                eMail.addTo(assigneeEmail, assigneeName);
                assigneeEmail != null ? sendMailFlag = true : sendMailFlag = false;
            } else {
                if (requestorId == "3PForITCustomerRequestor") {
                    var baRefType = node.isInWorkflow("3PCustomerCreate") ? "OrganisationCustBusinessAreaDataEntity" : "OrgCustBusinessAreaDataEntityWfl";
                    var baRefType1 = manager.getReferenceTypeHome().getReferenceTypeByID(baRefType);
                    var baRefs = getReferencesTargets(node, baRefType1);
                    if (baRefs.size() > 0) {
                        var baID = baRefs.get(0).getValue("BusinessAreaID").getSimpleValue();
                        if (baID) {
                            if (baID == "FORFIN") {
                                var reqMails = extractEmailIDsWithName(node, manager, "bb4eaa83-fd70-407c-98db-f970604f0d63");
                                if (reqMails) {
                                    //var nameTemp = "ForIT Requestor";
                                    reqMails.forEach((userEmail, name) => {
                                        eMail.addTo(userEmail, name);
                                        sendMailFlag = true;
                                        // template = template.replace(nameTemp, "{Name Surname}");
                                        template = template.replace("{Name Surname}", "ForIT Requestor");
                                        //nameTemp = name;
                                    });
                                }
                            } else if (baID == "FORGER") {
                                eMail.addTo("stammdaten@upm.com");
                                sendMailFlag = true;
                            }
                        }
                    }
                } else {
                    var reqMails = extractEmailIDsWithName(node, manager, requestorId);
                    if (reqMails) {
                        reqMails.forEach((userEmail, name) => {
                            eMail.addTo(userEmail, name);
                            sendMailFlag = true;
                            template = template.replace("{Name Surname}", name);
                        });
                    }
                }
            }
        } //21510 : Start
        else if (recipient == "Customer Business Controller") {
            template = template.replace("{Receiver}", "Customer Business Controller");
            var baRefType = node.isInWorkflow("3PCustomerCreate") ? "OrganisationCustBusinessAreaDataEntity" : "OrgCustBusinessAreaDataEntityWfl";
            var baRefType1 = manager.getReferenceTypeHome().getReferenceTypeByID(baRefType);
            var baRefs = getReferencesTargets(node, baRefType1);
            if (baRefs.size() > 0) {
                var baID = baRefs.get(0).getValue("BusinessAreaID").getSimpleValue();
                if (baID) {
                    if (baID == "COMPAPEUR") {
                        var userGroup = "c308d04a-f9d5-4660-b39d-59b43f2c4d19";
                    } else if (baID == "COMPAPNA") {
                        var userGroup = "8dfaea7a-ae0a-470e-a620-da614714a6bc";
                    } else if (baID == "SPEPAPAPAC") {
                        var userGroup = "c8f1e762-13cd-459e-9a88-329e45e787d5";
                    } else if (baID == "SPEPAPENA") {
                        var userGroup = "c14dc85a-6267-4951-b645-0a52728205c4";
                    }
                }
            }
            var verifierMail = extractEmailIDs(node, manager, userGroup);
            var verifierMailArray = verifierMail.toArray();
            var arrSize = verifierMailArray.length;
            for (var i = 0; i < arrSize; i++) {
                eMail.addTo(verifierMailArray[i]);
                sendMailFlag = true;
            } //21510 : End after closing parenthesis in next line
        } else if (recipient == "GLO APPS STEP MDM QA Counterparty Risk Approver") {
            template = template.replace("{Receiver}", "Counterparty Risk Approver");
            var userGroup = "894019a1-cbc5-4f62-8b15-4500d81522a9";
            var verifierMail = extractEmailIDs(node, manager, userGroup);
            var verifierMailArray = verifierMail.toArray();
            var arrSize = verifierMailArray.length;
            //v812149 for INC2742589 - start
//            for (var i = 0; i < arrSize; i++) {
//            	if(verifierMailArray[i] == "cprm@upm.com"){ //v812149 for INC2733601 - added only if condition
//                eMail.addTo(verifierMailArray[i]);
			  var cprmMail = "cprm@upm.com";
			  eMail.addTo(cprmMail);
                sendMailFlag = true;
//            	}//v812149 for INC2733601
//            }
            //v812149 for INC2742589 - end
        } else if (recipient == "Salesforce Requestor") {
            var IIEPtype = node.getValue("CreatedViaIIEP").getID();
            var requestorId = workflowInstance.getSimpleVariable("requestorId");
            if (IIEPtype == "SalesForce_Paper" || IIEPtype == "SalesForce_Pulp") {
                if (manager.getUserHome().getUserByID(requestorId)) {
                    var assignee = manager.getUserHome().getUserByID(requestorId);
                    var assigneeName = assignee.getName();
                    var assigneeEmail = assignee.getEMail();
                    template = template.replace("{Name Surname}", assigneeName);
                    eMail.addTo(assigneeEmail, assigneeName);
                    assigneeEmail != null ? sendMailFlag = true : sendMailFlag = false;
                } else {
                    if (requestorId == "3PSFPulpCustomerRequestor") {
                        var reqMails = extractEmailIDsWithNameofSubGroups(node, manager, requestorId);
                    } else {
                        var reqMails = extractEmailIDsWithName(node, manager, requestorId);

                    }
                    if (reqMails) {
                        //var nameTemp = "Salesforce Requestor";
                        reqMails.forEach((userEmail, name) => {
                            eMail.addTo(userEmail, name);
                            sendMailFlag = true;
                            //template = template.replace(nameTemp,"{Name Surname}");
                            template = template.replace("{Name Surname}", "Salesforce Requestor");
                            //nameTemp = name;
                        });
                    }
                }
            }
        }
    }

    eMail.from("noreply@cloudmail.stibo.com", "STEP MDM");
    eMail.subject(emailSubject);
    eMail.htmlMessage(template);
    if (sendMailFlag) {
        eMail.send();
    }
}

function extractEmailIDsWithName(node, manager, userGroupID) {
    var emailNameMap = new java.util.HashMap();
    var emailIDs = new java.util.HashMap();
    var userGroupUsers = manager.getGroupHome().getGroupByID(userGroupID).getUsers().toArray();
    emailIDs = getUsersEmailIDsWithName(userGroupUsers);
    emailIDs.forEach((key, value) => {
        var emailID = key;
        if (emailID && !"".equals(emailID)) {
            emailNameMap.put(emailID, value);
        }
    });
    return emailNameMap;
}

function getUsersEmailIDsWithName(users) {
    var mailAndNameMap = new java.util.HashMap();
    var userCount = users.length;
    for (var i = 0; i < userCount; i++) {
        var user = users[i];
        var email = user.getEMail();
        var userName = user.getName();
        if (email) {
            mailAndNameMap.put(email, userName);
        }
    }
    return mailAndNameMap;
}
function validateTaxNumber(lookup, countryId, taxNumDesc, taxNumber, privatePerson) {
    if (taxNumber != null && countryId != null && taxNumDesc != null) {
        var lookupVariable = countryId + "_" + taxNumDesc;
        if (privatePerson == "Yes") {
            lookupVariable += "_" + privatePerson;
        } else if (privatePerson == "No") {
            //    lookupVariable += "_" + privatePerson;
            var regExp = lookup.getLookupTableValue("3PCountryRulesTaxNumbers", lookupVariable);
            log.info("lookup:  " + regExp + "   :" + lookupVariable);
            if (regExp != null) {
                var regEx = new RegExp(regExp, "g");
                return regEx.test(taxNumber.trim()) ? true : "Tax Number format for Country " + countryId + " is invalid";
            }
        }
        var regExp = lookup.getLookupTableValue("3PCountryRulesTaxNumbers", lookupVariable);
        log.info("lookup:  " + regExp + "   :" + lookupVariable);
        if (regExp != null) {
            var regEx = new RegExp(regExp, "g");
            return regEx.test(taxNumber.trim()) ? true : "Tax Number format for Country " + countryId + " is invalid";
        }
        //        else {
        //            return true;
        //        }
        return true;
    }

}
function validateTaxNumberForErrorMessages(node, lookup, dcObj) {
    if (dcObj != null) {
        var country = dcObj.getValue("TaxNumberCountry").getID();
        var taxRegIDNumber = dcObj.getValue("TaxRegistrationIDNumber").getSimpleValue();
        var taxDesc = dcObj.getValue("TaxNumberDescription").getID();
        var privatePerson = node.getValue("PrivatePerson").getSimpleValue();
        if (taxRegIDNumber != null && country != null && taxDesc != null) {
            var lookupVariable = country + "_" + taxDesc;
            if (privatePerson == "Yes") {
                lookupVariable += "_" + privatePerson;
            }
            if (privatePerson == "No") {
                //lookupVariable += "_" + privatePerson;
                var message = lookup.getLookupTableValue("CountryRulesForTaxNumberErrorMessage", (lookupVariable + "_No"));
                var regExp = lookup.getLookupTableValue("3PCountryRulesTaxNumbers", (lookupVariable + "_No"));
                if (message != null && regExp == null) {
                    return message;
                }
            }
        }
        var result = validateTaxNumber(lookup, country, taxDesc, taxRegIDNumber, privatePerson);
        if (result != true) {
            var message = lookup.getLookupTableValue("CountryRulesForTaxNumberErrorMessage", lookupVariable);
            return result + ". " + message;
        }
        return result;
    }
    return true;
}
function validateIBANCodeForBankDC(node, lookup, dcObj) {
    if (dcObj != null) {
        var countryId = dcObj.getValue("Country").getID();
        var ibanCode = dcObj.getValue("SAP-IBAN").getSimpleValue();
        var currencyId = dcObj.getValue("UPMCurrency").getID();
        var bankKey = dcObj.getValue("BankKeyInternal").getSimpleValue();

        var result = validateIBANCode(lookup, countryId, ibanCode, currencyId, bankKey);
        if (result == "IBAN Code format is invalid") {
            var message = lookup.getLookupTableValue("CountryRulesIBANNumberErrorMessage", countryId);
            return result + ". " + message;
        }
        return result;
    }
    return true;
}

function validateIBANCode(lookup, countryId, ibanCode, currencyId, bankKey) {
    if (ibanCode != null) {
        var isMandatory = lookup.getLookupTableValue("CountryRulesIBANNumber", countryId + "_Mandatory") != null ? true : false;
        var regExp = lookup.getLookupTableValue("CountryRulesIBANNumber", countryId + "_Format");
        if (regExp != null) {
            var regEx = new RegExp(regExp, "g");
            return regEx.test(ibanCode) ? true : "IBAN Code format is invalid";
        } else {
            return true;
        }
    } else {
        if (bankKey != "00000" && countryId == "CH") {
            return "IBAN Code is mandatory for if Bank Key is not 00000";
        }
        if (bankKey != "9999" && countryId == "DK") {
            return "IBAN Code is mandatory for if Bank Key is not 9999";
        }
        if (bankKey != "BANKGIRO" && countryId == "SE") {
            return "IBAN Code is mandatory for if Bank Key is not BANKGIRO";
        }
        if (currencyId != "GBP" && countryId == "GB") {
            return "IBAN Code is mandatory for if Currency is not British Pound";
        }
        var isMandatory = lookup.getLookupTableValue("CountryRulesIBANNumber", countryId + "_Mandatory") != null ? true : false;
        if (bankKey.startsWith("IHC")) {
            if (countryId == "DE" || countryId == "FI" || countryId == "FR" || countryId == "GB") {
                isMandatory = false;
            }
        }
        return isMandatory ? "IBAN Code is mandatory" : true;
    }
}
function validateSwiftRefBIC(node, lookup, dcObj) {
    if (dcObj != null) {
        var countryId = dcObj.getValue("Country").getID();
        var bankKey = dcObj.getValue("BankKeyInternal").getSimpleValue();

        var isMandatory = lookup.getLookupTableValue("CountryRulesIBANNumber", countryId + "_Mandatory") != null ? true : false;
        if (bankKey != "00000" && countryId == "CH") {
            isMandatory = true;
        }
        if (bankKey != "9999" && countryId == "DK") {
            isMandatory = true;
        }
        if (bankKey != "BANKGIRO" && countryId == "SE") {
            isMandatory = true;
        }
        if (currencyId != "GBP" && countryId == "GB") {
            isMandatory = true;
        }
        if (bankKey.startsWith("IHC")) {
            if (countryId == "DE" || countryId == "FI" || countryId == "FR" || countryId == "GB") {
                isMandatory = false;
            }
        }
        return isMandatory ? "Swift/BIC is mandatory" : true;
    }
}

function hasAccountGroupForId(node, refType, accountGroupId) {
    return accountGroupId.equals(node.queryReferences(refType).asList(1).get(0).getTarget().getValue("AccountGroupID").getSimpleValue());
}
function checkIfValueIsInArray(value, Array) {
    var flag = false;
    for (var i = 0; i < Array.length; i++) {
        if (value == Array[i]) {
            flag = true;
            break;
        }
    }
    return flag;
}
//Method to send Email Notification for Customer Create, Update & Deactivate Wfs
function sendEmailNotificationCustomerTaskPending(node, manager, emailEntityNode, mail, wf, stateId, screenId, recipient, GeneratedEmailBody, usergroup) {
    var eMail = mail.mail();
    var emailEntityObj = manager.getEntityHome().getEntityByID(emailEntityNode);
    var emailSwitch = emailEntityObj.getValue('EmailSwitch').getID();
    //if (emailSwitch == "Y") {
    if (emailEntityObj.getValue('EmailBody')) {
        var template = emailEntityObj.getValue('EmailBody').getSimpleValue();
    }

    if (emailEntityObj.getValue('EmailSubject')) {
        var emailSubject = emailEntityObj.getValue('EmailSubject').getSimpleValue();
    }

    var templateAttr = new java.util.ArrayList();
    templateAttr = emailEntityObj.getValue("EmailBodyAttributes").getValues();

    var subjectAttr = new java.util.ArrayList();
    subjectAttr = emailEntityObj.getValue("EmailSubjectAttributes").getValues();

    var workflowInstance = node.getWorkflowInstance(wf);
    var nameline1 = node.getValue("NameLine1").getSimpleValue();
    var nameline2 = node.getValue("NameLine2").getSimpleValue();
    var nameconcat = nameline2 == null || nameline2 == '' ? nameline1 : nameline1 + " " + nameline2;
    if (nameconcat == null) {
        nameconcat = node.getValue("LegalName").getSimpleValue();
    }

    if (workflowInstance) {
        var URL = getEnvironmentURL(manager);
        if (GeneratedEmailBody) {
            template = template.replace("{GeneratedEmailBody}", GeneratedEmailBody);
        }
        template = template.replace("(url)", URL);
        template = template.replace("{Name}", nameconcat);
        template = template.replace("(screenId)", screenId);
        template = template.replace("(wfId)", wf.getID());
        //template = template.replace("(wfId)", wf);
        template = template.replace("(stateId)", stateId).replace("(stateId)", stateId);
        template = template.split("<lt/>").join("<");
        template = template.split("<gt/>").join(">");
        var partyType = identifyPartyType(node, manager, wf);
        for (var i = 0; i < templateAttr.size(); i++) {
            var attrStr = templateAttr.get(i).getSimpleValue();
            var str = attrStr.replace("{", "").replace("}", "");
            var strVal = node.getValue(str).getSimpleValue();
            template = template.replace(attrStr, strVal);
        }

        if (partyType)
            template = template.replace("{Counterparty type}", partyType);

        for (var j = 0; j < subjectAttr.size(); j++) {
            var attrStr = subjectAttr.get(j).getSimpleValue();
            var str = attrStr.replace("{", "").replace("}", "");
            var strVal = node.getValue(str).getSimpleValue();
            emailSubject = emailSubject.replace(attrStr, strVal);
        }

        if (partyType) {
            emailSubject = emailSubject.replace("{Counterparty type}", partyType);
        }
        emailSubject = emailSubject.replace("{Name}", nameconcat);
        var sendMailFlag = false;

        if (recipient == "Task Pending Recipient") {
            var userGroupArray = ["3PBusinessController", "3PCustomerBankAccountOwnerVerifier", "3PBankAccountApprover", "3PCredit", "3PCustomerBusinessDataMaintainer", "3PCustomerBankAccountVerifier", "3PCPRM", "UPMSuppliers", "3PMDVerifierBP", "3PCustomerMasterDataVerifier", "3PCustomerRequestor"];
            for (var j = 0; j < userGroupArray.length; j++) {
                if (usergroup == userGroupArray[j]) {
                    var verifierMail = extractEmailIDsWithName(node, manager, userGroupArray[j]);
                    verifierMail.forEach((userEmail, name) => {
                        eMail.addTo(userEmail, name);
                        sendMailFlag = true;
                        template = template.replace("{Name Surname}", name);
                        template = template.replace("{Receiver}", manager.getGroupHome().getGroupByID(userGroupArray[j]).getName());
                    });
                }
            }
        } else if (recipient == "Task Pending Customer Deactivate Recipient") {
            var userGroupArray = ["3PCreditApprover", "3PCustomerMasterDataVerifier"];//removed "3PCBusinessApprover" INC2738649 - V812484
            for (var j = 0; j < userGroupArray.length; j++) {
                if (usergroup == userGroupArray[j]) {
                    var verifierMail = extractEmailIDsWithName(node, manager, userGroupArray[j]);
                    verifierMail.forEach((userEmail, name) => {
                        eMail.addTo(userEmail, name);
                        sendMailFlag = true;
                        template = template.replace("{Name Surname}", name);
                        template = template.replace("{Receiver}", manager.getGroupHome().getGroupByID(userGroupArray[j]).getName());
                    });
                }
            }
            // INC2738649 - V812484 Start
            if (usergroup == "3PCBusinessApprover")
            {
			var refType = node.getReferences(manager.getReferenceTypeHome().getReferenceTypeByID("OrgCustBusinessAreaDataEntityWfl")).toArray();
				if (refType.length > 0) {
					var refDataID = refType[0].getTarget().getValue("BusinessAreaID").getSimpleValue();log.info("refDataID>>"+refDataID);
					var ADGroupID = manager.getHome(com.stibo.lookuptable.domain.LookupTableHome).getLookupTableValue("3PCustBusAppADGroupBAMapping", refDataID);
				
					var userGroup = ADGroupID;
					var verifierMail = extractEmailIDsWithName(node, manager, userGroup);
					verifierMail.forEach((userEmail, name) => {
						eMail.addTo(userEmail, name);
						sendMailFlag = true;
						template = template.replace("{Name Surname}", name);
						template = template.replace("{Receiver}", manager.getGroupHome().getGroupByID(userGroup).getName());
						});
				}
			}// INC2738649 - V812484 End
        }
        eMail.from("noreply@cloudmail.stibo.com", "STEP MDM");
        eMail.subject(emailSubject);
        eMail.htmlMessage(template);
        if (sendMailFlag) {
            eMail.send();
        }
    }
}

function isValuePresentInMultiValueAttrLOV(node, attrId, valueId) {
    return node.getValue(attrId).getValues().stream().anyMatch(value => {
        return valueId.equals(value.getID());
    });
}

function hideAttrsRefsOfAttrGrp(node, hidden, attrGrp) {
    attrGrp.getAttributes().stream().forEach(attribute => {
        hidden.setHidden(node, attribute);
    });

    attrGrp.getLinkTypes().stream().forEach(linkType => {
        hidden.setHidden(node, linkType);
    });
}

function readOnlyAttrsRefsOfAttrGrp(node, readOnly, attrGrp) {
    attrGrp.getAttributes().stream().forEach(attribute => {
        readOnly.setReadOnly(node, attribute);
    });

    attrGrp.getLinkTypes().stream().forEach(linkType => {
        readOnly.setReadOnly(node, linkType);
    });
}

function readOnlyAttrsRefsOfDC(node, dcTypeId, readOnly, attrGrp) {
    var dc = node.getDataContainerByTypeID(dcTypeId);
    if (dc.getDataContainerType().isMultiValued()) {
        var singleDCs = dc.getDataContainers();
        var singleDCsItr = singleDCs.iterator();
        while (singleDCsItr.hasNext()) {
            var dcObj = singleDCsItr.next().getDataContainerObject();
            attrGrp.getAttributes().stream().forEach(attribute => {
                readOnly.setReadOnly(dcObj, attribute);
            });
        }
    } else {
        if (dcObj != null) {
            var dcObj = dc.getDataContainerObject();
            attrGrp.getAttributes().stream().forEach(attribute => {
                readOnly.setReadOnly(dcObj, attribute);
            });
        }
    }
}

function mandatoryAttrsRefsOfAttrGrp(node, mandatory, attrGrp) {
    attrGrp.getAttributes().stream().forEach(attribute => {
        mandatory.setMandatory(node, attribute);
    });

    attrGrp.getLinkTypes().stream().forEach(linkType => {
        mandatory.setMandatory(node, linkType);
    });
}

function mandatoryAttrsRefsOfDC(node, dcTypeId, mandatory, attrGrp) {
    var dc = node.getDataContainerByTypeID(dcTypeId);
    if (dc.getDataContainerType().isMultiValued()) {
        var singleDCs = dc.getDataContainers();
        var singleDCsItr = singleDCs.iterator();
        while (singleDCsItr.hasNext()) {
            var dcObj = singleDCsItr.next().getDataContainerObject();
            attrGrp.getAttributes().stream().forEach(attribute => {
                mandatory.setMandatory(dcObj, attribute);
            });
        }
    } else {
        var dcObj = dc.getDataContainerObject();
        if (dcObj != null) {
            attrGrp.getAttributes().stream().forEach(attribute => {
                mandatory.setMandatory(dcObj, attribute);
            });
        }
    }
}
function extractEmailIDsWithNameofSubGroups(node, manager, userGroupID) {
    var emailNameMap = new java.util.HashMap();
    var emailIDs = new java.util.HashMap();
    var subGroups = manager.getGroupHome().getGroupByID(userGroupID).getChildren().toArray();
    subGroups.forEach((group) => {
        var userGroupUsers = manager.getGroupHome().getGroupByID(group.getID()).getUsers().toArray();
        emailIDs = getUsersEmailIDsWithName(userGroupUsers);
        emailIDs.forEach((key, value) => {
            var emailID = key;
            if (emailID && !"".equals(emailID)) {
                emailNameMap.put(emailID, value);
            }
        });
    });
    return emailNameMap;
}
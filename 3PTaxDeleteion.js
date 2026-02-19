

var TAX_DC_TYPE_ID = "TaxInformationDC";
var LOG_ATTRIBUTE_ID = "3PTaxDeletionIndicator";
var COUNTRY_ATTR_ID = "TaxNumberCountry"; 
var TAX_REG_NO_ATTR_ID = "TaxRegistrationIDNumber";
var CATEGORY_ATTR_ID = "TaxNumberCategory";
node.getValue(LOG_ATTRIBUTE_ID).deleteCurrent();


log.severe("Starting check for updated or deleted Tax records.");

var approvedNode = commonUtils.getApprovedNode(node, manager);

if (!approvedNode) {
    log.severe("No approved version found. Cannot detect changes. Exiting.");
    return;
}

var approvedStateMap = buildApprovedStateMap(approvedNode);
log.severe(approvedStateMap);

var changesToLog = findChangesAndDeletions(node, approvedStateMap);

if (!changesToLog.isEmpty()) {
    log.severe("Found " + changesToLog.size() + " updated or deleted record(s). Recording them now.");
    writeToLogAttribute(changesToLog);
} else {
    log.severe("No relevant updates or deletions were found in the Tax DataContainer.");
}

function buildApprovedStateMap(approvedNode) {
    var map = new java.util.HashMap();
    var approvedContainer = approvedNode.getDataContainerByTypeID(TAX_DC_TYPE_ID);

    if (approvedContainer) {
        var iterator = approvedContainer.getDataContainers().iterator();
        while (iterator.hasNext()) {
            var record = iterator.next().getDataContainerObject();
            var concatenatedValue = getConcatenatedValue(record);
            map.put(record.getID(), concatenatedValue);
        }
    }
    log.severe(map + "arq3rqr4Q");
    return map;
}

function findChangesAndDeletions(currentNode, approvedStateMap) {
    var changes = new java.util.ArrayList();
    var currentContainer = currentNode.getDataContainerByTypeID(TAX_DC_TYPE_ID);

    if (currentContainer) {
        var iterator = currentContainer.getDataContainers().iterator();
        while (iterator.hasNext()) {
            var currentRecord = iterator.next().getDataContainerObject();
            var currentId = currentRecord.getID();
            var currentValue = getConcatenatedValue(currentRecord);

            if (approvedStateMap.containsKey(currentId)) {

                var previousValue = approvedStateMap.get(currentId);

                if (currentValue != previousValue) {
                    log.severe(currentValue + " " + previousValue)
                    log.severe("It was updated! Add the OLD value to our log.");
                    changes.add(previousValue);
                }

                approvedStateMap.remove(currentId);
            }
             //updated by v811875 for Incident - INC2740819 lines - 71 to 84
            else{
              var key = approvedStateMap.keySet().iterator();
               while (key.hasNext()) {
                 var apprKey = key.next();
                 var apprVal = approvedStateMap.get(apprKey);
                 if(apprVal == currentValue){
                   approvedStateMap.remove(apprKey);
                   break;
                 }
               }

            }
      //updated by v811875 for Incident - INC2740819 lines - 71 to 84

        }
    }

    changes.addAll(approvedStateMap.values());

    return changes;
}

function writeToLogAttribute(changesToLog) {
    var multiValueContainer = node.getValue(LOG_ATTRIBUTE_ID);
    var multiValue = null;

    var iterator = changesToLog.iterator();
    while (iterator.hasNext()) {
        var changeString = iterator.next();
        log.severe("Logging change: " + changeString);
        multiValueContainer.addValue(changeString);
    }
}

function getConcatenatedValue(record) {
    var countryVal = record.getValue(COUNTRY_ATTR_ID);
    var taxRegVal = record.getValue(TAX_REG_NO_ATTR_ID);
    var categoryVal = record.getValue(CATEGORY_ATTR_ID);

    var country = countryVal ? countryVal.getID() : "";
    log.severe(country);
    var taxRegNo = taxRegVal ? taxRegVal.getSimpleValue() : "";
    var category = categoryVal ? categoryVal.getSimpleValue() : "";
    var a = [country, taxRegNo, category].join(",");
    log.severe(a);
    return a;
}
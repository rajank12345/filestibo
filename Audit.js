// Workflow Audit Action version 1.0. June 2019, Component audit-messaging
// NOTE: A bind must be made to the relevant audit messaging topic for this to produce an audit message, see at bottom of script
//var workflow=manager.getWorkflowHome("3PVendorUpdate");
var nodeID = node.getID();
var userID = manager.getCurrentUser().getID();
var workflowID = workflow.getID();

var event = transitionEvaluation.getEvent();
var eventID = null;
if (event != null) {
   eventID = event.getID();
}

var transitionMessage = transitionEvaluation.getMessage();
var transitionRejected = transitionEvaluation.isRejected();
var resultMessages = transitionEvaluation.getResultMessages();

if (resultMessages.size() === 0) {
   var concatenatedResults = null;
} else {
   var concatenatedResults = "Evaluation Results (" + resultMessages.size() + "): ";
}

var resultMessageIter = resultMessages.iterator();
while (resultMessageIter.hasNext()) {
   concatenatedResults = concatenatedResults + resultMessageIter.next() + "; ";
}

var sourceState = transitionEvaluation.getSource();
var sourceStateID = null;
if (sourceState) {
   sourceStateID = sourceState.getTitle();
   sourceStateID = sourceStateID.replaceAll(' ','');
}

var targetState = transitionEvaluation.getTarget();
var targetStateID = null;
if (targetState) {
   targetStateID = targetState.getTitle();
   targetStateID = targetStateID.replaceAll(' ','');
}

var logTime = new Date().getTime();
// Added as part of an incident INC2731006
var STEPWorkflowID = "";
if (workflowID == "3PVendorCreate" || workflowID == "3PVendorUpdate" || workflowID == "3PVendorDeactivate"
     || workflowID == "3PContactPersonCreate" || workflowID == "3PContactPersonRaflatacCreate" || workflowID == "3PContactPersonRaflatacUpdate"
     || workflowID == "3PContactPersoanRaflatacDeactivate" || workflowID=="3PBUVendor") {
    STEPWorkflowID = node.getValue("STEPWorkflowIDVendor").getSimpleValue();

} 
else if (workflowID == "3PCustomerCreate" || workflowID == "3PCustomerUpdate" || workflowID == "3PCustomerDeactivate" || workflowID == "3PIntercompanyCreate" || workflowID=="3PBUCustomer") {
    STEPWorkflowID = node.getValue("STEPWorkflowID").getSimpleValue();
}
// End INC2731006

//commented below line as part of an incident INC2731006
//var STEPWorkflowID = node.getValue("STEPWorkflowIDVendor").getSimpleValue()||node.getValue("STEPWorkflowID").getSimpleValue();
var ProcessIndicator = node.getValue("ProcessIndicator").getSimpleValue();

var customerReactivationStatus = node.getValue("ReactivationReason").getSimpleValue();
var CUSTOMER_REACTIVATION_REASON = null;
if(customerReactivationStatus) {
    CUSTOMER_REACTIVATION_REASON = customerReactivationStatus;
}
var VENDOR_REACTIVATION_REASON = null;
 var dcObj = node.getDataContainerByTypeID("SAPSupplierRoleData").getDataContainerObject();
      if (dcObj!=null) {
var vendorReactivationStatus = dcObj.getValue("ReactivationReason").getSimpleValue();
	  

if(vendorReactivationStatus) {
    VENDOR_REACTIVATION_REASON = vendorReactivationStatus;
}
	  }




var reactivationReason = null;
if (CUSTOMER_REACTIVATION_REASON) {
    reactivationReason = CUSTOMER_REACTIVATION_REASON;
} else if (VENDOR_REACTIVATION_REASON) {
    reactivationReason = VENDOR_REACTIVATION_REASON;
}

// When using the Audit Message Receiver JDBC Delivery Plugin, the default behaviour when processing 
// messages is to "insert" each message into the database (i.e. create a new database entry for each 
// message). If you wish to "upsert" messages (i.e. if a message with a matching ID exists, update 
// the entry, otherwise create a new database entry), the audit message should contain a field with
// the key "_ID". For example, the field could be set to be a combination of the nodeID and workflowID.
//
// var auditObject = {
//    "_ID": "" + nodeID + "_" + workflowID,
//    ...
// }

//--------------- UPDATE BELOW TO YOUR SYSTEM SETUP ---------------
// Send audit message to the audit message framework. A bind will have to be made to a
// topic of an audit message receiver plugin.
//topic.sendMessageAsync(auditMessage)

if(sourceStateID!=null){
	var auditObject = {
//		"_ID": "" + nodeID,
		"Node_ID": "" + nodeID,
		"Workflow_ID": "" + workflowID,
		"User_ID": "" + userID,
		"Log_Time": logTime,
		"Event_ID": "" + eventID,
		"Submit_Message": "" + transitionMessage,
		"Source_State_ID": "" + sourceStateID,
		"Destination_State_ID": "" + targetStateID,
		"Transition_Rejected": transitionRejected,
		"Transition_Rejected_Message": "" + concatenatedResults,
		"PROCESS_INDICATOR": ""+ ProcessIndicator,
		"STEP_WORKFLOW_ID" : ""+STEPWorkflowID
		};
		 if (CUSTOMER_REACTIVATION_REASON) {
        auditObject.CUSTOMER_REACTIVATION_REASON = "" + CUSTOMER_REACTIVATION_REASON;
    } else if (VENDOR_REACTIVATION_REASON) {
        auditObject.VENDOR_REACTIVATION_REASON = "" + VENDOR_REACTIVATION_REASON;
    }
	var auditMessage = JSON.stringify(auditObject);
	logger.severe("auditMessage = "+auditMessage);
	auditMessageTopic.sendMessageAsync(auditMessage);
}

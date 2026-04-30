if(node.isInWorkflow("3PVendorCreate") && (node.isInState("3PVendorCreate","BankMasterCreationPending"))){
	node.getWorkflowInstanceByID("3PVendorCreate").setSimpleVariable("workflowState","Skipped");
}

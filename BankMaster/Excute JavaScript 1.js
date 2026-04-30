
var workflowInstance = node.getWorkflowInstanceByID(wf.getID());
if(workflowInstance)
workflowInstance.setSimpleVariable("requestInStateSinceDate", utils.getNowDateTimeAsString("yyyy-MM-dd"));
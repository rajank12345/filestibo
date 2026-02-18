var c = com.stibo.query.condition.Conditions;

var accGrpCondition = null;
var accGrpRef = node.queryReferences(refTypeOrgToAccGrp).asList(1).get(0);
var accGrp = accGrpRef.getTarget();
if (accGrp != null) {
	accGrpCondition = c.id().eq(accGrp.getID());
} else {
	accGrpCondition = c.id().eq("");
}

var searchKeyword = lookup.getLookupTableValue("SearchKeyWord", "All_Result_Keyword");
var updatedSearchStr = "*" + searchString + "*";
var condition = c.hierarchy().simpleBelow(parent).and(c.objectType(baObjType)) 
			.and(c.isReferenced(refTypeToBA).where(c.sourceMatches(accGrpCondition)));

if (searchString != null && !searchString.equalsIgnoreCase(searchKeyword)) {
	condition = condition.and(c.valueOf(refDataName).ignoreCase().like(updatedSearchStr)
	.or(c.valueOf(refDataID).ignoreCase().like(updatedSearchStr)));
}

return queryHome.queryFor(com.stibo.core.domain.entity.Entity).where(condition);

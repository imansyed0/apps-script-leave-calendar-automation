function addImportrangePermission(ssId) {
  // donor or source spreadsheet id, you should get it somewhere
  const donorId = SHEET.getId()

  // adding permission by fetching this url
  const url = `https://docs.google.com/spreadsheets/d/${ssId}/externaldata/addimportrangepermissions?donorDocId=${donorId}`;

  const token = ScriptApp.getOAuthToken();

  const params = {
    method: 'post',
    headers: {
      Authorization: 'Bearer ' + token,
    },
    muteHttpExceptions: true
  };
  
  UrlFetchApp.fetch(url, params);
}

function createTrigger() {
      var FORMID = FormApp.openByUrl(SHEET.getFormUrl()).getId()
      
    trigger = ScriptApp.newTrigger('autoFillGoogleDocFromForm')
      .forForm(FormApp.openById(FORMID))
      .onFormSubmit()
      .create();
}

function checkIfTriggerExists() {
   var triggers = ScriptApp.getProjectTriggers();
 for (var i = 0; i < triggers.length; i++) {
   ScriptApp.deleteTrigger(triggers[i]);
 }

var triggers = ScriptApp.getProjectTriggers();
Logger.log(triggers.map(t => [t.getEventType(), t.getHandlerFunction()]))
}


function autoFillGoogleDocFromForm(e) {
   const responses = e.response.getItemResponses().map((r) => r.getResponse())
  //  hacky solution for corresponding spreadsheet delayed updated on form response
   Utilities.sleep(3000)
// assume it's the first sheet where the data is collected
var sh = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
var last = sh.getLastRow();
var lastcol = sh.getLastColumn();
var Requesteremail = e.response.getRespondentEmail();
var initi = Requesteremail.split("@")[0]
initi = initi[0] + initi[initi.length - 1]
initi = initi.toUpperCase()
var RequestContent = {
  initials: initi,
  startDate: new Date(responses[0]),
  endDate: new Date(responses[1]),
  leaveCode: responses[2],
  notes: responses[3],
};
// Generate Unique ID
var Uuid = uuid_(lastcol);
// return the URL : apps needs to be deployed
var scriptUri = DEPLOY_ID;
Logger.log('uri: '+scriptUri);
// Append results in the Google Sheet
var array = [ [Uuid, "NA", "NA",
'=HYPERLINK("'+scriptUri+'?i="&ROW()&"&state=APPROVED&last="&ROW(),"Approve")', 
'=HYPERLINK("'+scriptUri+'?i="&ROW()&"&state=DENIED&last="&ROW(),"Deny")' ] ]
Logger.log('array to be inserted in the Sheet last: '+array);
// insert colum 4
var newRange = sh.getRange(last,7,1,5);
Logger.log(newRange.getA1Notation());
newRange.setValues(array);
reviewContent_(
  Requesteremail,
  RequestContent,
  Uuid,
  last
  ); // TemplateEmail + Recipients settings 
}
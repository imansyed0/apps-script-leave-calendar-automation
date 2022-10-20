/**
 * @param {String} Requester email to find intent
 * @param {String} Requester content 
 * @param {String} Generated UUID for the request
 * @param {Integer} Id of the last row of the sheet
 * @param {state} Opt state of the request
 */

// Keys are emails of line managers to approve/deny, values are an array of initials of employees line managed by the key
const approvers = {
  "johnsmith@xyz.org" : ["AB", "CD", "ON", "IS"],
  "emilyj@xys.org" : ["NS", "SE"],
}

// Email of google calendar to update
const gCal = ""

function reviewContent_(Requesteremail, RequestContent, Uuid, Last, state) {
  const ind = Object.values(approvers).findIndex((obv) => obv.includes(RequestContent.initials))
  const APPROVER_EMAIL = Object.keys(approvers)[ind]


  Logger.log('reviewContent Requesteremail: ' + Requesteremail + ' RequestContent: ' + JSON.stringify(RequestContent) + ' Uuid: ' + Uuid + ' Last: ' + Last + " state: " + state);
  var scriptUri = DEPLOY_ID;
  Logger.log(scriptUri)
  // hack some values on to the data just for email templates.
  var ApprovalUrl = scriptUri + "?i=" + Uuid + '&state=' + APPROVED_STATE + '&last=' + Last;
  var DenyUrl = scriptUri + "?i=" + Uuid + '&state=' + DENIED_STATE + '&last=' + Last;
  Logger.log(ApprovalUrl);
  Logger.log(DenyUrl);
  var form = {
    requester_Email: Requesteremail,
    requester_Content: RequestContent,
    uu_Id: Uuid,
    approval_Url: ApprovalUrl,
    deny_Url: DenyUrl
  };
  if (state === undefined) {
    // state is new
    var templ = HtmlService.createTemplateFromFile('EmailTemp');
    templ.form = form;
    var message = templ.evaluate().getContent();
    MailApp.sendEmail({
      to: APPROVER_EMAIL,
      subject: "New leave request - " + RequestContent.initials,
      htmlBody: message
    });
  }
  if (state === APPROVED_STATE) {
    // state is approved
    var templ = HtmlService.createTemplateFromFile('EmailApprove');
    templ.form = form;
    var message = templ.evaluate().getContent();
    MailApp.sendEmail({
      to: Requesteremail,
      cc: APPROVER_EMAIL,
      subject: "Leave request approved",
      htmlBody: message
    });
    
    function addDays(date, days) {
      var result = new Date(date);
      result.setDate(result.getDate() + days);
      return result;
    }
    // Update google calendar containing annual leave
    CalendarApp.getCalendarById(gCal).createAllDayEvent(RequestContent.initials + " - OFF", RequestContent.startDate, addDays(RequestContent.endDate, 1))


    function getDates(startDate, stopDate) {
      var dateArray = new Array();
      var currentDate = startDate;
      while (currentDate <= stopDate) {
          dateArray.push(new Date (currentDate));
          currentDate = addDays(currentDate, 1);
      }
      return dateArray;
    }


  // Fill in google sheet with right leave code on right dates
    const sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(RequestContent.initials)
    var rowNo = RequestContent.startDate.getMonth()*2 + 4
    var rw = sh.getRange(rowNo, 2, 4, 37)
    const vals = rw.getValues()
    var colNo = vals[0].findIndex((val) => Number(val) === Number(RequestContent.startDate.getDate())) + 2
    rowNo += 1
      var incr = 0

    getDates(RequestContent.startDate, RequestContent.endDate).forEach((date) => {
    const lastDayInMonth = new Date(2022, date.getMonth() + 1, 0)
      const cell = sh.getRange(rowNo, colNo + incr)

      if ((cell.getBackground() !== '#d9d9d9' && !cell.getValue())
          || (cell.getBackground() == '#d9d9d9' && RequestContent.leaveCode === "TOIL+")) {
        cell.setValue(RequestContent.leaveCode)
      }


      if (date.getTime() === lastDayInMonth.getTime()) {
        rowNo +=2
        colNo = vals[2].findIndex((el) => !!el) + 2
        incr = 0
      } else {
        incr +=1
      }
    })

  }
  if (state === DENIED_STATE) {
    // state is deny
    var templ = HtmlService.createTemplateFromFile('EmailDeny');
    templ.form = form;
    var message = templ.evaluate().getContent();
    MailApp.sendEmail({
      to: Requesteremail,
      cc: APPROVER_EMAIL,
      subject: "Leave request declined",
      htmlBody: message
    });
  }
}

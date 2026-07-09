/**
 * NGƯỜI MỚI HỌC AI — Backend Google Apps Script
 * ------------------------------------------------------------
 * Dán toàn bộ file này vào Extensions > Apps Script của một Google Sheet,
 * rồi Deploy thành Web App. Xem hướng dẫn chi tiết trong README.md.
 *
 * Sheet sẽ tự động tạo tab "Data" với các cột:
 * Timestamp | Type | Name | Phone | Email | Source | Page
 *
 * - type = "pageview": mỗi lượt khách mở trang bán hàng
 * - type = "lead": mỗi khách điền form để lại thông tin
 */

var SHEET_NAME = "Data";

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var sheet = getSheet_();
    sheet.appendRow([
      data.timestamp ? new Date(data.timestamp) : new Date(),
      data.type || "",
      data.name || "",
      data.phone || "",
      data.email || "",
      data.source || "",
      data.page || ""
    ]);
    return ContentService
      .createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: String(err) }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  var sheet = getSheet_();
  var values = sheet.getDataRange().getValues();
  values.shift(); // bỏ dòng tiêu đề

  var data = values
    .filter(function (row) { return row[0]; })
    .map(function (row) {
      var ts = row[0];
      return {
        timestamp: ts instanceof Date ? ts.toISOString() : String(ts),
        type: row[1],
        name: row[2],
        phone: row[3],
        email: row[4],
        source: row[5],
        page: row[6]
      };
    });

  var json = JSON.stringify(data);
  var callback = e && e.parameter && e.parameter.callback;

  if (callback) {
    return ContentService
      .createTextOutput(callback + "(" + json + ");")
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }

  return ContentService
    .createTextOutput(json)
    .setMimeType(ContentService.MimeType.JSON);
}

function getSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(["Timestamp", "Type", "Name", "Phone", "Email", "Source", "Page"]);
  }
  return sheet;
}

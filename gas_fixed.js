const SPREADSHEET_ID = '1VKaaYmgryO6rriK31DJ3M14DQYLbp4miT7e-YEBUdEY';
const ADMIN_SPREADSHEET_ID = '1pcR_WiRVTvkTFzd6WPCcU_rI9d0ZnhYYJh5JzYdTtSc'; // Spreadsheet riêng: users, config, activity_log

const HEADERS = {
  users:      ['username', 'key', 'expiry', 'fullname', 'role', 'permissions', 'title'],
  tariff:     ['carrier', 'size_type', 'damage_location', 'component', 'damage_type', 'repair_type', 'length', 'weight', 'unit', 'limit_qty', 'hour', 'material', 'labour', 'total_cost'],
  emty_stock: ['seq', 'carrier', 'equipment_no', 'size_type', 'size_type_iso', 'manufactured_date', 'huong', 'trang_thai_container', 'fe', 'grade', 'yard_location', 'so_ngay_luu_bai', 'remarks', 'date_in_yard', 'loai_hang', 'hang_hoa', 'trong_luong', 'container_status'],
  estimates:  ['seq', 'equipment_number', 'estimate_datetime', 'carrier', 'size_type', 'repair_seq', 'damage_location', 'component', 'damage_type', 'repair_type', 'length', 'width', 'unit', 'part_number', 'quantity', 'currency', 'labour_hours', 'labour_cost', 'material_cost', 'tax', 'responsible_party', 'upgrade_code', 'material_type', 'repair_remarks', 'header_remarks', 'grade_code', 'associate_container', 'lumpsum_code', 'total_cost', 'approval_status', 'app_damage_location', 'app_component', 'app_damage_type', 'app_repair_type', 'app_length', 'app_width', 'app_unit', 'app_quantity', 'app_labour_hours', 'app_material_cost', 'app_labour_cost', 'app_total_approved', 'app_responsible_party', 'app_material_type', 'app_remark_details', 'approval_date', 'old_part_serial', 'new_part_serial', 'damage_level', 'old_part_no'],
  tracking:   ['seq', 'container_no', 'carrier', 'size', 'est_date', 'ref_number', 'labour_hours', 'labour_cost', 'material_cost', 'total_cost', 'total_approved', 'approved_date', 'approval_status', 'revise_labour_hours', 'revise_material_cost', 'revise_labour_cost', 'revise_total', 'repair_date', 'po_number', 'po_date', 'remarks1', 'remarks2', 'drive_folder', 'special_flag', 'updated_at'],
  summary:    ['seq', 'container_no', 'carrier', 'size', 'est_date', 'ref_number', 'approved_date', 'repair_date', 'po_number', 'po_date', 'approval_status', 'labour_hours', 'labour_cost', 'material_cost', 'total_cost', 'total_approved', 'remarks'],
  location:   ['code', 'short_code', 'full_name']
};

// ===================== ROUTING =====================

// ===================== ADMIN SPREADSHEET =====================
// users, config, activity_log được tách sang spreadsheet riêng
function _getAdminSS() {
  return SpreadsheetApp.openById(ADMIN_SPREADSHEET_ID);
}

function doGet(e) {
  const action = e.parameter && e.parameter.action ? e.parameter.action : null;
  if (!action) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'MNR Estimate API running' }))
      .setMimeType(ContentService.MimeType.JSON);
  }
  let result;
  try {
    switch(action) {
      case 'setupHeaders':  result = setupHeaders(); break;
      case 'login':         result = login(e.parameter.username, e.parameter.key); break;
      case 'getTariff':     result = getTariff(); break;
      case 'getEmtyStock':  result = getEmtyStock(); break;
      case 'getActivityLog': result = getActivityLog(e.parameter); break;
      case 'getTracking':   result = getSheet('tracking'); break;
      case 'getSummary':    result = getSheet('summary'); break;
      case 'getUsers':      result = getUsers(e.parameter.username, e.parameter.key); break;
      case 'getLocation':   result = getSheet('location'); break;
      case 'getEstimates':  result = getEstimatesByContainer(e.parameter.container_no, e.parameter.est_date); break;
      case 'getAllEstimates':    result = getAllEstimates(e.parameter.container_nos); break;
      case 'getPhotos':          result = getPhotosFromDrive(e.parameter); break;
      case 'getWarehouseReport': result = getWarehouseReport(); break;
      case 'countPhotos':       result = countPhotos(e.parameter); break;
      case 'getPhotosByFolder':  result = getPhotosByFolder(e.parameter); break;
      default: result = { error: 'Unknown action: ' + action };
    }
  } catch(err) {
    result = { error: err.message };
  }
  return ContentService
    .createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  const data = JSON.parse(e.postData.contents);
  const action = data.action;
  let result;
  try {
    switch(action) {
      case 'saveEstimate':       result = saveEstimate(data); break;
      case 'saveRevise':         result = saveRevise(data); break;
      case 'importOVM':          result = importOVM(data); break;
      case 'updateTracking':     result = updateTracking(data); break;
      case 'syncSummary':        result = syncSummary(); break;
      case 'setupHeaders':       result = setupHeaders(); break;
      case 'clearCache':         _delCache(); result = { success: true }; break;
      case 'updateTrackingStatus': result = updateTrackingStatus(data); break;
      case 'updateTrackingRemark':  result = updateTrackingRemark(data); break;
      case 'updateTrackingRepairDate': result = updateTrackingRepairDate(data); break;
      case 'updateStock':        result = updateStock(data); break;
      case 'importStockFromTOS': result = importStockFromTOS(data); break;
      case 'appendTariff':       result = appendTariff(data); break;
      case 'deleteEstimate':     result = deleteEstimate(data); break;
      case 'uploadImage':        result = uploadImageToDrive(data); break;
      case 'saveDriveFolder':    result = saveDriveFolderToTracking(data); break;
      case 'deletePhoto':        result = deletePhotoFromDrive(data); break;
      case 'getPhotos':          result = getPhotosFromDrive(data); break;
      case 'countPhotos':       result = countPhotos(e.parameter); break;
      case 'getPhotosByFolder':  result = getPhotosByFolder(data); break;
      case 'getDriveLink':       result = getDriveFolderLink(data); break;
      case 'updateEstimate':     result = updateEstimate(data); break;
      case 'createExportFolder': result = createExportFolder(data); break;
      case 'exportPictures':     result = exportPictures(data); break;
      case 'changePassword':  result = changePassword(data); break;
      case 'saveUser':        result = saveUser(data); break;
      case 'deleteUser':      result = deleteUser(data); break;
      case 'genExcelList':       result = genExcelList(data); break;
      default: result = { error: 'Unknown action: ' + action };
    }
  } catch(err) {
    result = { error: err.message };
  }
  return ContentService
    .createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

// ===================== SETUP HEADERS =====================
function setupHeaders() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const results = [];
  for (const [sheetName, headers] of Object.entries(HEADERS)) {
    let sheet = ss.getSheetByName(sheetName);
    if (!sheet) sheet = ss.insertSheet(sheetName);
    const existingHeader = sheet.getRange(1, 1, 1, Math.max(headers.length, sheet.getLastColumn())).getValues()[0];
    const isEmpty = existingHeader.every(v => v === '');
    if (isEmpty) {
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
      sheet.getRange(1, 1, 1, headers.length).setBackground('#185FA5');
      sheet.getRange(1, 1, 1, headers.length).setFontColor('#ffffff');
      sheet.setFrozenRows(1);
      results.push(sheetName + ': headers created');
    } else {
      // Kiểm tra và thêm cột mới nếu thiếu
      var added = addMissingColumns(sheet, existingHeader, headers);
      results.push(sheetName + ': ' + (added.length > 0 ? 'added cols: ' + added.join(', ') : 'up to date'));
    }
  }
  return { success: true, results };
}

function addMissingColumns(sheet, existingHeader, headers) {
  var added = [];
  headers.forEach(function(h, idx) {
    if (!existingHeader.includes(h)) {
      var col = idx + 1;
      sheet.getRange(1, col).setValue(h);
      sheet.getRange(1, col).setFontWeight('bold').setBackground('#185FA5').setFontColor('#ffffff');
      added.push(h);
    }
  });
  return added;
}

// ===================== LOGIN =====================
function login(username, key) {
  try {
    const ss = _getAdminSS();
    const sheet = ss.getSheetByName('users');
    if (!sheet) return { success: false, error: 'Không tìm thấy danh sách user. Liên hệ admin.' };
    const data = sheet.getDataRange().getValues();

    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const rowUser  = String(row[0]).trim().toLowerCase();
      const rowKey   = String(row[1]).trim();
      const inputUser = String(username).trim().toLowerCase();
      const inputKey  = String(key).trim();

      if (rowUser === inputUser && rowKey === inputKey) {
        const expiry = new Date(row[2]);
        const today  = new Date();
        today.setHours(0, 0, 0, 0);
        expiry.setHours(23, 59, 59, 0);
        if (today <= expiry) {
          const role = String(row[4] || 'user').trim().toLowerCase();
          const defaultPerms = 'estimate,revise,ovm,tracking,summary,bulk,stock,report,pictures,inventory';
          const perms = role === 'admin' ? 'all' : (String(row[5] || '').trim() || defaultPerms);
          // Tính số ngày còn lại để cảnh báo
          const daysLeft = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
          return {
            success: true,
            fullname: row[3] || username,
            expiry: Utilities.formatDate(expiry, 'Asia/Ho_Chi_Minh', 'dd/MM/yyyy'),
            role: role,
            permissions: perms,
            title: String(row[6] || '').trim(),
            days_left: daysLeft
          };
        } else {
          return { success: false, error: 'Tài khoản đã hết hạn. Liên hệ admin để gia hạn.' };
        }
      }
    }
    return { success: false, error: 'Sai Username hoặc Key' };
  } catch(e) {
    Logger.log('[login] Error: ' + e.toString());
    return { success: false, error: 'Lỗi hệ thống: ' + e.message };
  }
}

// ===================== USER MANAGEMENT =====================
function isAdmin(username, key) {
  const ss = _getAdminSS();
  const sheet = ss.getSheetByName('users');
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]).trim().toLowerCase() === String(username).trim().toLowerCase()
     && String(data[i][1]).trim() === String(key).trim()) {
      return String(data[i][4] || '').trim().toLowerCase() === 'admin';
    }
  }
  return false;
}

function getUsers(username, key) {
  if (!isAdmin(username, key)) return { success: false, error: 'Không có quyền' };
  const ss = _getAdminSS();
  const sheet = ss.getSheetByName('users');
  const data = sheet.getDataRange().getValues();
  const users = data.slice(1).filter(r => r[0]).map(r => ({
    username: String(r[0] || ''),
    expiry:   r[2] ? Utilities.formatDate(new Date(r[2]), 'Asia/Ho_Chi_Minh', 'dd/MM/yyyy') : '',
    fullname: String(r[3] || ''),
    role:     String(r[4] || 'user'),
    permissions: String(r[5] || ''),
    title:    String(r[6] || '')
  }));
  return { success: true, data: users };
}

function changePassword(data) {
  const { username, old_key, new_key } = data;
  if (!new_key || new_key.length < 4) return { success: false, error: 'Mật khẩu mới phải ít nhất 4 ký tự' };
  const ss = _getAdminSS();
  const sheet = ss.getSheetByName('users');
  const rows = sheet.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][0]).trim().toLowerCase() === String(username).trim().toLowerCase()
     && String(rows[i][1]).trim() === String(old_key).trim()) {
      sheet.getRange(i + 1, 2).setValue(new_key);
      return { success: true };
    }
  }
  return { success: false, error: 'Username hoặc mật khẩu cũ không đúng' };
}

function saveUser(data) {
  if (!isAdmin(data.admin_username, data.admin_key)) return { success: false, error: 'Không có quyền' };
  const ss = _getAdminSS();
  const sheet = ss.getSheetByName('users');
  const rows = sheet.getDataRange().getValues();
  const expDate = data.expiry ? new Date(data.expiry.split('/').reverse().join('-')) : new Date(new Date().getFullYear(), 11, 31);

  // Tìm user đã tồn tại
  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][0]).trim().toLowerCase() === String(data.username).trim().toLowerCase()) {
      // Update — không đổi pass nếu để trống
      sheet.getRange(i + 1, 2).setValue(data.key || rows[i][1]);
      sheet.getRange(i + 1, 3).setValue(expDate);
      sheet.getRange(i + 1, 4).setValue(data.fullname || rows[i][3]);
      sheet.getRange(i + 1, 5).setValue(data.role || 'user');
      sheet.getRange(i + 1, 6).setValue(data.permissions !== undefined ? data.permissions : (rows[i][5] || ''));
      sheet.getRange(i + 1, 7).setValue(data.title !== undefined ? data.title : (rows[i][6] || ''));
      return { success: true, message: 'Đã cập nhật user' };
    }
  }
  // Thêm mới
  if (!data.key) return { success: false, error: 'Cần nhập mật khẩu cho user mới' };
  sheet.appendRow([data.username, data.key, expDate, data.fullname || data.username, data.role || 'user', data.permissions || '', data.title || '']);
  return { success: true, message: 'Đã thêm user mới' };
}

function deleteUser(data) {
  if (!isAdmin(data.admin_username, data.admin_key)) return { success: false, error: 'Không có quyền' };
  const ss = _getAdminSS();
  const sheet = ss.getSheetByName('users');
  const rows = sheet.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][0]).trim().toLowerCase() === String(data.username).trim().toLowerCase()) {
      sheet.deleteRow(i + 1);
      return { success: true };
    }
  }
  return { success: false, error: 'Không tìm thấy user' };
}

// ===================== GET TARIFF =====================
// A = damage_location_group (bỏ qua)
// B = size_type      ← lookup
// C = damage_location ← lookup
// D = component      ← lookup
// E = damage_type    ← lookup
// F = repair_type    ← exact match
// G = length         ← check range
// H = weight         (bỏ qua)
// I = unit           ← exact match
// J = limit_qty      ← check qty
// K = hour           → kết quả
// L = material       → kết quả
// M = labour         → kết quả
// N = total_cost     → kết quả
// ===================== CACHE HELPERS =====================
var CACHE_TTL      = 60;  // giây — tracking, summary, tariff, stock
var CACHE_TTL_LONG = 300; // giây — estimates (ít thay đổi hơn)

function _getCache(key) {
  try {
    var c = CacheService.getScriptCache().get(key);
    return c ? JSON.parse(c) : null;
  } catch(e) { return null; }
}

function _setCache(key, data, ttl) {
  try {
    var s = JSON.stringify(data);
    // GAS cache giới hạn 100KB/entry
    if (s.length < 90000) {
      CacheService.getScriptCache().put(key, s, ttl || CACHE_TTL);
    }
  } catch(e) {}
}

function _delCache() {
  try {
    CacheService.getScriptCache().removeAll([
      'cache_tracking', 'cache_summary', 'cache_tariff', 'cache_stock', 'cache_estimates_all'
    ]);
  } catch(e) {}
}

function getTariff() {
  var cached = _getCache('cache_tariff');
  if (cached) return cached;

  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName('tariff');
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return { success: true, data: [] };

  const rows = data.slice(1).map(row => ({
    carrier:          String(row[0]  || ''),
    size_type:        String(row[1]  || ''),
    damage_location:  String(row[2]  || ''),
    component:        String(row[3]  || ''),
    damage_type:      String(row[4]  || ''),
    repair_type:      String(row[5]  || ''),
    length:           row[6],
    weight:           row[7],
    unit:             String(row[8]  || ''),
    limit_qty:        row[9],
    hour:             row[10],
    material:         row[11],
    labour:           row[12],
    total_cost:       row[13]
  })).filter(r => r.size_type && r.size_type !== '' && r.size_type !== 'Size Type');

  const result = { success: true, data: rows };
  _setCache('cache_tariff', result);
  return result;
}

// ===================== GET EMTY STOCK =====================
function getEmtyStock() {
  var cached = _getCache('cache_stock');
  if (cached) return cached;

  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName('emty_stock');
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return { success: true, data: [] };

  const rows = data.slice(1).map(row => ({
    seq:                  row[0],
    carrier:              String(row[1]  || ''),
    equipment_no:         String(row[2]  || ''),
    size_type:            String(row[3]  || ''),
    size_type_iso:        String(row[4]  || ''),
    manufactured_date:    row[5]  || '',
    huong:                String(row[6]  || ''),
    trang_thai_container: String(row[7]  || ''),
    fe:                   String(row[8]  || ''),
    grade:                String(row[9]  || ''),
    yard_location:        String(row[10] || ''),
    so_ngay_luu_bai:      row[11] || '',
    remarks:              String(row[12] || ''),
    date_in_yard:         row[13] || '',
    loai_hang:            String(row[14] || ''),
    hang_hoa:             String(row[15] || ''),
    trong_luong:          row[16] || '',
    container_status:     String(row[17] || '')
  })).filter(r => r.equipment_no && r.equipment_no.trim() !== '');

  const result = { success: true, data: rows };
  _setCache('cache_stock', result);
  return result;
}

// ===================== GET SHEET GENERIC =====================
function getSheet(sheetName) {
  // Cache chỉ cho tracking và summary
  var cacheKey = (sheetName === 'tracking') ? 'cache_tracking' : (sheetName === 'summary') ? 'cache_summary' : null;
  if (cacheKey) {
    var cached = _getCache(cacheKey);
    if (cached) return cached;
  }

  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) return { error: 'Sheet not found: ' + sheetName };
  const range = sheet.getDataRange();
  const data = range.getValues();
  const displayData = range.getDisplayValues();
  if (data.length <= 1) return { success: true, data: [] };

  // Dùng HEADERS alias nếu có, fallback về header thực từ Sheets
  const aliasHeaders = HEADERS[sheetName];
  const realHeaders  = data[0];
  const headers = aliasHeaders || realHeaders;

  const DATE_COLS = ['est_date','approved_date','repair_date','po_date','date_in_yard','estimate_datetime'];
  const tz = ss.getSpreadsheetTimeZone();

  const rows = data.slice(1).map((row, rowIdx) => {
    const obj = {};
    headers.forEach((h, i) => {
      var val = row[i];
      if (DATE_COLS.indexOf(h) !== -1) {
        if (val instanceof Date && !isNaN(val)) {
          // Date object → format chuẩn dd/MM/yyyy
          if (h === 'estimate_datetime') {
            val = Utilities.formatDate(val, tz, 'dd/MM/yyyy HH:mm:ss');
          } else {
            val = Utilities.formatDate(val, tz, 'dd/MM/yyyy');
          }
        } else {
          // Không phải Date object → dùng displayValue (format đang hiển thị trong cell)
          // để tránh bị lộn M/D/YYYY vs DD/MM/YYYY
          var dispVal = (displayData[rowIdx + 1] || [])[i] || '';
          if (dispVal && dispVal.trim()) {
            var dp = dispVal.trim().split('/');
            if (dp.length === 3 && dp[2].length === 4) {
              var p0 = parseInt(dp[0]), p1 = parseInt(dp[1]);
              // Nếu p1 > 12: M/D/YYYY → swap
              if (p1 > 12) {
                val = String(p1).padStart(2,'0') + '/' + String(p0).padStart(2,'0') + '/' + dp[2];
              } else {
                val = String(p0).padStart(2,'0') + '/' + String(p1).padStart(2,'0') + '/' + dp[2];
              }
            } else {
              val = dispVal.trim();
            }
          } else {
            val = '';
          }
        }
      }
      obj[h] = val;
    });
    return obj;
  });
  const result = { success: true, data: rows };
  if (cacheKey) _setCache(cacheKey, result);
  return result;
}

// ===================== GET ESTIMATES BY CONTAINER =====================
function getEstimatesByContainer(containerNo, estDate) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName('estimates');
  const range = sheet.getDataRange();
  const data = range.getValues();
  const displayData = range.getDisplayValues();
  if (data.length <= 1) return { success: true, data: [] };
  const tz3 = ss.getSpreadsheetTimeZone();

  // fmtD: chuẩn hoá về dd/MM/yyyy
  var fmtD = function(v) {
    if (v instanceof Date && !isNaN(v)) return Utilities.formatDate(v, tz3, 'dd/MM/yyyy');
    var s = String(v||'').trim();
    var dp = s.split('/');
    if (dp.length === 3 && dp[2].length === 4) return dp[0].padStart(2,'0')+'/'+dp[1].padStart(2,'0')+'/'+dp[2];
    return s;
  };

  // fmtEstDate: lấy phần ngày từ estimate_datetime dùng displayValue để tránh M/D vs D/M
  var fmtEstDate = function(rowIdx) {
    var disp = (displayData[rowIdx] || [])[2] || '';
    if (disp) {
      // displayValue thường là dd/MM/yyyy HH:mm:ss hoặc dd/MM/yyyy
      var datepart = disp.trim().split(' ')[0];
      var dp2 = datepart.split('/');
      if (dp2.length === 3 && dp2[2].length === 4) {
        return dp2[0].padStart(2,'0') + '/' + dp2[1].padStart(2,'0') + '/' + dp2[2];
      }
    }
    // fallback: dùng getValues Date object
    return fmtD(data[rowIdx][2]);
  };

  // Nếu không có estDate, lấy est_date của job active từ tracking
  var filterDate = fmtD(estDate);
  if (!filterDate) {
    var trkSh2 = ss.getSheetByName('tracking');
    var trkD2  = trkSh2.getDataRange().getValues();
    var trkH2  = trkD2[0];
    var iC2 = trkH2.indexOf('container_no');
    var iS2 = trkH2.indexOf('approval_status');
    var iE2 = trkH2.indexOf('est_date');
    var CLOSED2 = ['Repaired','Rejected'];
    for (var ti = 1; ti < trkD2.length; ti++) {
      if (String(trkD2[ti][iC2]).trim().toUpperCase() === String(containerNo).trim().toUpperCase()) {
        if (!CLOSED2.includes(String(trkD2[ti][iS2] || ''))) {
          filterDate = fmtD(trkD2[ti][iE2]);
          break;
        }
      }
    }
  }

  // Col B (index 1) = Equipment Number — dùng index cố định
  const CONT_COL = 1; // B
  const headers = HEADERS.estimates;

  const rows = data.slice(1)
    .filter((row, idx) => {
      if (String(row[CONT_COL]).trim().toUpperCase() !== String(containerNo).trim().toUpperCase()) return false;
      if (!filterDate) return true;
      const rowDate = fmtEstDate(idx + 1); // +1 vì slice(1) bỏ header
      if (!rowDate) return true;
      return rowDate === filterDate;
    })
    .map(row => ({
      seq:               row[0],
      equipment_number:  row[1],
      estimate_datetime: row[2] instanceof Date ? Utilities.formatDate(row[2], tz3, 'dd/MM/yyyy HH:mm:ss') : String(row[2]||''),
      carrier:           row[3],
      size_type:         row[4],
      repair_seq:        row[5],
      damage_location:   row[6],
      component:         row[7],
      damage_type:       row[8],
      repair_type:       row[9],
      length:            row[10],
      width:             row[11],
      unit:              row[12],
      part_number:       row[13],
      quantity:          row[14],
      currency:          row[15],
      labour_hours:      row[16],
      labour_cost:       row[17],
      material_cost:     row[18],
      tax:               row[19],
      responsible_party: row[20],
      upgrade_code:      row[21],
      material_type:     row[22],
      repair_remarks:    row[23],
      header_remarks:    row[24],
      grade_code:        row[25],
      total_cost:        row[28],
      approval_status:   row[29],
      app_damage_location:   row[30],
      app_component:         row[31],
      app_damage_type:       row[32],
      app_repair_type:       row[33],
      app_length:            row[34],
      app_width:             row[35],
      app_unit:              row[36],
      app_quantity:          row[37],
      app_labour_hours:      row[38],
      app_material_cost:     row[39],
      app_labour_cost:       row[40],
      app_total_approved:    row[41],
      app_responsible_party: row[42],
      app_material_type:     row[43],
      app_remark_details:    row[44],
      approval_date:         row[45] instanceof Date ? Utilities.formatDate(row[45], 'Asia/Ho_Chi_Minh', 'dd/MM/yyyy') : String(row[45]||'')
    }));

  return { success: true, data: rows };
}

// ===================== SAVE ESTIMATE =====================
function saveEstimate(data) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const estSheet = ss.getSheetByName('estimates');
  const trkSheet = ss.getSheetByName('tracking');
  const estHeaders = HEADERS.estimates;
  const trkHeaders = HEADERS.tracking;
  const timestamp = new Date();
  const dateStr  = Utilities.formatDate(timestamp, 'Asia/Ho_Chi_Minh', 'dd/MM/yyyy HH:mm:ss');
  const dateOnly = Utilities.formatDate(timestamp, 'Asia/Ho_Chi_Minh', 'dd/MM/yyyy');

  const lastRow = estSheet.getLastRow();
  let nextSeq = lastRow > 1 ? lastRow : 1;

  const lines = data.lines || [];
  lines.forEach((line, idx) => {
    const row = estHeaders.map(h => {
      switch(h) {
        case 'seq':                return nextSeq + idx;       // A
        case 'equipment_number':   return data.container_no;   // B
        case 'estimate_datetime':  return dateStr;             // C
        case 'carrier':            return data.carrier || '';  // D
        case 'size_type':          return data.size_type || '';// E
        case 'repair_seq':         return idx + 1;             // F
        case 'damage_location':    return (line.damage_location || '').toUpperCase(); // G
        case 'component':          return (line.component || '').toUpperCase();       // H
        case 'damage_type':        return (line.damage_type || '').toUpperCase();     // I
        case 'repair_type':        return (line.repair_type || '').toUpperCase();     // J
        case 'length':             return line.length || '';          // K
        case 'width':              return line.width || '';           // L
        case 'unit':               return (line.unit || '').toUpperCase();            // M
        case 'part_number':        return '';                         // N
        case 'quantity':           return line.quantity || 0;         // O
        case 'currency':           return data.currency || 'USD';     // P
        case 'labour_hours':       return line.labour_hours || 0;     // Q
        case 'labour_cost':        return line.labour_cost || 0;      // R
        case 'material_cost':      return line.material_cost || 0;    // S
        case 'tax':                return '';                         // T
        case 'responsible_party':  return (line.responsible_party || '').toUpperCase(); // U
        case 'upgrade_code':       return '';                         // V
        case 'material_type':      return 'SK';                       // W — luôn SK
        case 'repair_remarks':     return '';                         // X
        case 'header_remarks':     return '';                         // Y — bỏ trống
        case 'grade_code':         return '';                         // Z — bỏ trống
        case 'associate_container': return '';                        // AA
        case 'lumpsum_code':       return '';                         // AB
        case 'total_cost':         return line.total_cost || 0;       // AC
        case 'approval_status':    return 'Pending';                  // AD
        default: return '';
      }
    });
    estSheet.appendRow(row);
  });

  const totalHours    = lines.reduce((s, l) => s + (parseFloat(l.labour_hours)  || 0), 0);
  const totalLabour   = lines.reduce((s, l) => s + (parseFloat(l.labour_cost)   || 0), 0);
  const totalMaterial = lines.reduce((s, l) => s + (parseFloat(l.material_cost) || 0), 0);
  const totalCost     = lines.reduce((s, l) => s + (parseFloat(l.total_cost)    || 0), 0);

  const trkData = trkSheet.getDataRange().getValues();
  const trkContIdx   = trkData[0].indexOf('container_no');
  const trkStatusIdx = trkData[0].indexOf('approval_status');

  // Tìm dòng tracking đang ACTIVE (Pending/Sent/Approved/Partially/Repair Pending/Revised)
  // Nếu chỉ có dòng Repaired/Rejected → coi như cont mới (job mới)
  const CLOSED_STATUSES = ['Repaired', 'Rejected'];
  let existingRowIdx = -1;
  for (let i = 1; i < trkData.length; i++) {
    if (String(trkData[i][trkContIdx]).trim() === String(data.container_no).trim()) {
      const st = String(trkData[i][trkStatusIdx] || '');
      if (!CLOSED_STATUSES.includes(st)) {
        existingRowIdx = i; // dòng active → ghi đè
        break;
      }
    }
  }
  // Nếu không có dòng active → tạo dòng mới (job mới hoặc cont hoàn toàn mới)
  const trkLastSeq = trkSheet.getLastRow() > 1 ? trkSheet.getLastRow() - 1 : 0;

  const trkRow = trkHeaders.map(h => {
    switch(h) {
      case 'seq':             return existingRowIdx > 0 ? trkData[existingRowIdx][0] : trkLastSeq + 1;
      case 'container_no':    return data.container_no;
      case 'carrier':         return data.carrier || '';
      case 'size':            return data.size_type || '';
      case 'est_date':        return dateOnly;
      case 'labour_hours':    return round2(totalHours);
      case 'labour_cost':     return round2(totalLabour);
      case 'material_cost':   return round2(totalMaterial);
      case 'total_cost':      return round2(totalCost);
      case 'approval_status': return 'Pending';
      case 'special_flag':    return data.special_flag || '';
      default: return '';
    }
  });

  if (existingRowIdx > 0) {
    trkSheet.getRange(existingRowIdx + 1, 1, 1, trkHeaders.length).setValues([trkRow]);
  } else {
    trkSheet.appendRow(trkRow);
  }

  _delCache();
  try { writeLog(data.username, 'Tạo Estimate', data.container_no, data.lines.length + ' hạng mục · ' + data.carrier + ' ' + data.size_type); } catch(e) {}
  return { success: true, message: 'Estimate saved!', lines_saved: lines.length };
}

// ===================== SAVE REVISE =====================
function saveRevise(data) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const estSheet = ss.getSheetByName('estimates');
  const trkSheet = ss.getSheetByName('tracking');
  const estData  = estSheet.getDataRange().getValues();

  const contIdx   = 1; // B - Equipment Number
  const repSeqIdx = 5; // F - Repair Sequence (index cố định, KHÔNG dùng indexOf)

  const EST = {
    status:29, appDL:30, appCO:31, appDT:32, appRT:33,
    appLen:34, appWid:35, appUnit:36, appQty:37, appLH:38,
    appMat:39, appLab:40, appTot:41, appResp:42, appMType:43,
    appRem:44, appDate:45
  };

  const lines = data.lines || [];
  let updated = 0;

  lines.forEach(function(line) {
    var repSeq = String(line.repair_seq || '').trim();
    var isNew  = repSeq.indexOf('new_') === 0;
    var lineStatus = line.approval_status || 'Partially Approved';

    if (isNew) {
      // Dòng mới do Revise thêm
      var lastRow = estSheet.getLastRow();
      var prevRow = estData[lastRow-1] || [];
      var newRow  = new Array(50).fill('');

      // Tìm repair_seq tiếp theo cho cont này
      var maxRepSeq = 0;
      for (var k = 1; k < estData.length; k++) {
        if (String(estData[k][contIdx]).trim().toUpperCase() === String(data.container_no).trim().toUpperCase()) {
          var rs = parseFloat(estData[k][repSeqIdx]) || 0;
          if (rs > maxRepSeq) maxRepSeq = rs;
        }
      }
      var nextRepSeq = maxRepSeq + 1;

      // Lấy estimate_datetime từ dòng đầu tiên của cont (giữ ngày est gốc)
      var estDatetime = '';
      var estDateOnly = ''; // dd/MM/yyyy để filter match
      for (var k = 1; k < estData.length; k++) {
        if (String(estData[k][contIdx]).trim().toUpperCase() === String(data.container_no).trim().toUpperCase()) {
          var rawDt = estData[k][2];
          if (rawDt instanceof Date && !isNaN(rawDt)) {
            estDatetime = Utilities.formatDate(rawDt, ss.getSpreadsheetTimeZone(), 'dd/MM/yyyy HH:mm:ss');
            estDateOnly = Utilities.formatDate(rawDt, ss.getSpreadsheetTimeZone(), 'dd/MM/yyyy');
          } else {
            estDatetime = String(rawDt || '');
            estDateOnly = estDatetime.split(' ')[0];
          }
          break;
        }
      }
      if (!estDatetime) {
        estDatetime = Utilities.formatDate(new Date(), ss.getSpreadsheetTimeZone(), 'dd/MM/yyyy HH:mm:ss');
        estDateOnly = Utilities.formatDate(new Date(), ss.getSpreadsheetTimeZone(), 'dd/MM/yyyy');
      }

      // Thông tin cơ bản để identify
      newRow[0]          = lastRow;
      newRow[contIdx]    = data.container_no;
      newRow[2]          = estDatetime;      // estimate_datetime = format chuẩn dd/MM/yyyy HH:mm:ss
      newRow[3]          = prevRow[3] || ''; // carrier
      newRow[4]          = prevRow[4] || ''; // size_type
      newRow[repSeqIdx]  = nextRepSeq;       // repair_seq đúng
      newRow[15]         = 'USD';
      newRow[22]         = 'SK';             // material_type

      // CHỈ fill app_* fields — est_* để trống (dòng mới từ MSC approve thêm)
      newRow[EST.status]   = lineStatus;
      newRow[EST.appDL]    = (line.app_damage_location || '').toUpperCase();
      newRow[EST.appCO]    = (line.app_component       || '').toUpperCase();
      newRow[EST.appDT]    = (line.app_damage_type     || '').toUpperCase();
      newRow[EST.appRT]    = (line.app_repair_type     || '').toUpperCase();
      newRow[EST.appLen]   = !isNaN(parseFloat(line.app_length)) ? parseFloat(line.app_length) : '';
      newRow[EST.appWid]   = !isNaN(parseFloat(line.app_width))  ? parseFloat(line.app_width)  : '';
      newRow[EST.appUnit]  = (line.app_unit || '').toUpperCase();
      newRow[EST.appQty]   = parseFloat(line.app_quantity) || 1;
      newRow[EST.appLH]    = parseFloat(line.app_labour_hours)  || 0;
      newRow[EST.appMat]   = parseFloat(line.app_material_cost) || 0;
      newRow[EST.appLab]   = parseFloat(line.app_labour_cost)   || 0;
      newRow[EST.appTot]   = parseFloat(line.app_total_approved) || 0;
      newRow[EST.appResp]  = (line.app_responsible_party || '').toUpperCase();
      newRow[EST.appRem]   = line.app_remark || '';
      newRow[EST.appMType] = 'SK';

      estSheet.getRange(lastRow+1, 1, 1, newRow.length).setValues([newRow]);
      var dc = estSheet.getRange(lastRow+1, EST.appDate+1);
      dc.setNumberFormat('@'); dc.setValue(data.approved_date || '');
      updated++;
      return;
    }

    // So sánh số để tránh "1" !== "1.0"
    var repSeqNum = parseFloat(repSeq);
    for (var i = 1; i < estData.length; i++) {
      var rowCont = String(estData[i][contIdx]).trim().toUpperCase();
      var rowSeq  = parseFloat(estData[i][repSeqIdx]);
      if (rowCont === String(data.container_no).trim().toUpperCase() && rowSeq === repSeqNum) {
        var r = i + 1;
        estSheet.getRange(r, EST.status+1).setValue(lineStatus);
        estSheet.getRange(r, EST.appDL+1).setValue((line.app_damage_location || '').toUpperCase());
        estSheet.getRange(r, EST.appCO+1).setValue((line.app_component || '').toUpperCase());
        estSheet.getRange(r, EST.appDT+1).setValue((line.app_damage_type || '').toUpperCase());
        estSheet.getRange(r, EST.appRT+1).setValue((line.app_repair_type || '').toUpperCase());
        estSheet.getRange(r, EST.appLen+1).setValue(!isNaN(parseFloat(line.app_length)) ? parseFloat(line.app_length) : '');
        estSheet.getRange(r, EST.appWid+1).setValue(!isNaN(parseFloat(line.app_width))  ? parseFloat(line.app_width)  : '');
        estSheet.getRange(r, EST.appUnit+1).setValue((line.app_unit || '').toUpperCase());
        estSheet.getRange(r, EST.appQty+1).setValue(line.app_quantity || 1);
        estSheet.getRange(r, EST.appLH+1).setValue(line.app_labour_hours || 0);
        estSheet.getRange(r, EST.appMat+1).setValue(line.app_material_cost || 0);
        estSheet.getRange(r, EST.appLab+1).setValue(line.app_labour_cost || 0);
        estSheet.getRange(r, EST.appTot+1).setValue(line.app_total_approved || 0);
        estSheet.getRange(r, EST.appResp+1).setValue((line.app_responsible_party || '').toUpperCase());
        estSheet.getRange(r, EST.appMType+1).setValue(estData[i][22] || 'SK'); // material_type từ est gốc
        estSheet.getRange(r, EST.appRem+1).setValue(line.app_remark || '');
        var dc = estSheet.getRange(r, EST.appDate+1);
        dc.setNumberFormat('@'); dc.setValue(data.approved_date || '');
        updated++; break;
      }
    }
  });

  // Update tracking — status: Partially Approved - Revised hoặc Approved
  const trkData    = trkSheet.getDataRange().getValues();
  const trkHeaders = trkData[0];
  const trkContIdx    = trkHeaders.indexOf('container_no');
  const trkStatusIdx  = trkHeaders.indexOf('approval_status');
  const trkAppDateIdx = trkHeaders.indexOf('approved_date');
  const trkTotAppIdx  = trkHeaders.indexOf('total_approved');
  const trkRem2Idx    = trkHeaders.indexOf('remarks2');
  const trkRevTotIdx  = trkHeaders.indexOf('revise_total');
  const trkRevLHIdx   = trkHeaders.indexOf('revise_labour_hours');
  const trkRevMatIdx  = trkHeaders.indexOf('revise_material_cost');
  const trkRevLabIdx  = trkHeaders.indexOf('revise_labour_cost');

  const totalApp = lines.reduce(function(s,l){ return s+(parseFloat(l.app_total_approved)||0); }, 0);
  const totalLH  = lines.reduce(function(s,l){ return s+(parseFloat(l.app_labour_hours)||0); }, 0);
  const totalMat = lines.reduce(function(s,l){ return s+(parseFloat(l.app_material_cost)||0); }, 0);
  const totalLab = lines.reduce(function(s,l){ return s+(parseFloat(l.app_labour_cost)||0); }, 0);

  const CLOSED_REV = ['Repaired', 'Rejected'];
  for (var i = 1; i < trkData.length; i++) {
    if (String(trkData[i][trkContIdx]).trim().toUpperCase() === String(data.container_no).trim().toUpperCase()) {
      const stRev = String(trkData[i][trkStatusIdx] || '');
      if (CLOSED_REV.includes(stRev)) continue;
      trkSheet.getRange(i+1, trkStatusIdx+1).setValue(data.approval_status || 'Partially Approved - Revised');
      // Chỉ ghi approved_date nếu có giá trị — không ghi đè trống
      if (data.approved_date) {
        var tdc = trkSheet.getRange(i+1, trkAppDateIdx+1);
        tdc.setNumberFormat('@'); tdc.setValue(data.approved_date);
      }
      trkSheet.getRange(i+1, trkTotAppIdx+1).setValue(round2(totalApp));
      if (trkRevTotIdx >= 0) trkSheet.getRange(i+1, trkRevTotIdx+1).setValue(round2(totalApp));
      if (trkRevLHIdx  >= 0) trkSheet.getRange(i+1, trkRevLHIdx+1).setValue(round2(totalLH));
      if (trkRevMatIdx >= 0) trkSheet.getRange(i+1, trkRevMatIdx+1).setValue(round2(totalMat));
      if (trkRevLabIdx >= 0) trkSheet.getRange(i+1, trkRevLabIdx+1).setValue(round2(totalLab));
      if (trkRem2Idx   >= 0) trkSheet.getRange(i+1, trkRem2Idx+1).setValue(data.remarks || '');
      break;
    }
  }

  _delCache();
  try { writeLog(data.username, 'Revise Estimate', data.container_no, 'Status: ' + (data.approval_status||'') + ' · ' + (data.lines||[]).length + ' hạng mục'); } catch(e) {}
  return { success: true, message: updated + ' rows updated' };
}

// ===================== UPDATE OVM/OVD =====================
function updateOVM(data) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const trkSheet = ss.getSheetByName('tracking');
  const trkData = trkSheet.getDataRange().getValues();
  const headers = trkData[0];
  const contIdx = headers.indexOf('container_no');
  const mode = data.mode || 'A';
  let updated = 0;

  const CLOSED_OVM = ['Repaired', 'Rejected'];
  (data.updates || []).forEach(upd => {
    for (let i = 1; i < trkData.length; i++) {
      if (String(trkData[i][contIdx]).trim() === String(upd.container_no).trim()) {
        const stOvm = String(trkData[i][headers.indexOf('approval_status')] || '');
        if (CLOSED_OVM.includes(stOvm)) continue; // bỏ qua dòng đã đóng
        if (mode === 'A' || mode === 'C') {
          trkSheet.getRange(i+1, headers.indexOf('total_approved')+1).setValue(upd.total_approved   || 0);
          trkSheet.getRange(i+1, headers.indexOf('approved_date')+1).setValue(upd.approved_date     || '');
          trkSheet.getRange(i+1, headers.indexOf('approval_status')+1).setValue(upd.approval_status || 'Approved');
          if (mode === 'C') {
            trkSheet.getRange(i+1, headers.indexOf('remarks1')+1).setValue('Post Repair Request');
          }
        } else if (mode === 'B') {
          trkSheet.getRange(i+1, headers.indexOf('ref_number')+1).setValue(upd.ref_number || '');
        } else if (mode === 'D') {
          trkSheet.getRange(i+1, headers.indexOf('repair_date')+1).setValue(upd.repair_date || '');
          trkSheet.getRange(i+1, headers.indexOf('po_number')+1).setValue(upd.po_number     || '');
          trkSheet.getRange(i+1, headers.indexOf('po_date')+1).setValue(upd.po_date         || '');
        }
        updated++;
        break;
      }
    }
  });

  _delCache(); // syncSummary chỉ chạy khi user vào màn Tổng hợp (lazy)
  try { writeLog(data.username, 'Cập nhật OVM', '', updated + ' containers · mode ' + mode); } catch(e) {}
  return { success: true, message: updated + ' containers updated (mode ' + mode + ')' };
}

// ===================== UPDATE TRACKING =====================
function updateTracking(data) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName('tracking');
  const sheetData = sheet.getDataRange().getValues();
  const headers = sheetData[0];
  const contIdx = headers.indexOf('container_no');

  const CLOSED_TRK = ['Repaired', 'Rejected'];
  const trkStatusIdxT = headers.indexOf('approval_status');
  for (let i = 1; i < sheetData.length; i++) {
    if (String(sheetData[i][contIdx]).trim() === String(data.container_no).trim()) {
      const stTrk = String(sheetData[i][trkStatusIdxT] || '');
      if (CLOSED_TRK.includes(stTrk)) continue; // bỏ qua dòng đã đóng
      Object.keys(data).forEach(key => {
        if (key === 'action' || key === 'container_no') return;
        const colIdx = headers.indexOf(key);
        if (colIdx >= 0) sheet.getRange(i+1, colIdx+1).setValue(data[key]);
      });
      // syncSummary chỉ chạy khi user vào màn Tổng hợp (lazy)
      return { success: true };
    }
  }
  return { error: 'Container not found in tracking' };
}

// ===================== SYNC SUMMARY =====================
function syncSummary() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const trkSheet = ss.getSheetByName('tracking');
  const sumSheet = ss.getSheetByName('summary');
  const trkData = trkSheet.getDataRange().getValues();
  if (trkData.length <= 1) return { success: true };

  const trkHeaders = trkData[0];
  const sumHeaders = HEADERS.summary;

  if (sumSheet.getLastRow() > 1) {
    sumSheet.getRange(2, 1, sumSheet.getLastRow()-1, sumHeaders.length).clearContent();
  }

  const rows = trkData.slice(1).map((row, idx) => {
    const trk = {};
    trkHeaders.forEach((h, i) => { trk[h] = row[i]; });
    return sumHeaders.map(h => {
      switch(h) {
        case 'seq':             return idx + 1;
        case 'container_no':    return trk['container_no']    || '';
        case 'carrier':         return trk['carrier']         || '';
        case 'size':            return trk['size']            || '';
        case 'est_date':        return trk['est_date']        || '';
        case 'ref_number':      return trk['ref_number']      || '';
        case 'approved_date':   return trk['approved_date']   || '';
        case 'repair_date':     return trk['repair_date']     || '';
        case 'po_number':       return trk['po_number']       || '';
        case 'po_date':         return trk['po_date']         || '';
        case 'approval_status': return trk['approval_status'] || '';
        case 'labour_hours':    return trk['labour_hours']    || 0;
        case 'labour_cost':     return trk['labour_cost']     || 0;
        case 'material_cost':   return trk['material_cost']   || 0;
        case 'total_cost':      return trk['total_cost']      || 0;
        case 'total_approved':  return trk['total_approved']  || 0;
        case 'remarks':         return trk['remarks2']        || '';
        default: return '';
      }
    });
  });

  if (rows.length > 0) {
    sumSheet.getRange(2, 1, rows.length, sumHeaders.length).setValues(rows);
  }
  return { success: true, synced: rows.length };
}

// ===================== UPDATE STOCK (manual JSON) =====================
function updateStock(data) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName('emty_stock');
  const headers = HEADERS.emty_stock;
  if (sheet.getLastRow() > 1) {
    sheet.getRange(2, 1, sheet.getLastRow()-1, headers.length).clearContent();
  }
  const rows = (data.rows || []).map(row => headers.map(h => row[h] || ''));
  if (rows.length > 0) {
    sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
  }
  _delCache();
  return { success: true, message: rows.length + ' containers updated' };
}

// ===================== IMPORT STOCK FROM TOS =====================
// Xoá stock cũ, import stock mới từ file TOS
// Map cột TOS → Sheets emty_stock:
// TOS-A=Seq, TOS-B=Carrier, TOS-G=EquipmentNo, TOS-H=SizeType,
// TOS-I=SizeTypeISO, TOS-L=ManufacturedDate, TOS-M=Huong,
// TOS-N=TrangThaiContainer, TOS-O=FE, TOS-P=Grade,
// TOS-Q=YardLocation, TOS-R=SoNgayLuuBai, TOS-S=Remarks,
// TOS-X=DateInYard, TOS-AB=LoaiHang, TOS-AC=HangHoa,
// TOS-AD=TrongLuong, TOS-col57=ContainerStatus
function importStockFromTOS(data) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName('emty_stock');
  const headers = HEADERS.emty_stock;

  // Xoá dữ liệu cũ (giữ header row 1)
  if (sheet.getLastRow() > 1) {
    sheet.getRange(2, 1, sheet.getLastRow() - 1, headers.length).clearContent();
  }

  const rows = (data.rows || []).map((row, idx) => {
    return [
      idx + 1,      // A - Seq
      row[1]  || '', // B - Carrier (TOS col B = index 1)
      row[6]  || '', // C - Equipment No (TOS col G = index 6)
      row[7]  || '', // D - Size type (TOS col H = index 7)
      row[8]  || '', // E - Size Type ISO (TOS col I = index 8)
      row[11] || '', // F - Manufactured Date (TOS col L = index 11)
      row[12] || '', // G - Hướng (TOS col M = index 12)
      row[13] || '', // H - Trạng thái Container (TOS col N = index 13)
      row[14] || '', // I - F/E (TOS col O = index 14)
      row[15] || '', // J - Grade (TOS col P = index 15)
      row[16] || '', // K - Yard Location (TOS col Q = index 16)
      row[17] || '', // L - Số ngày lưu bãi (TOS col R = index 17)
      row[18] || '', // M - Remarks (TOS col S = index 18)
      row[23] || '', // N - Date in Yard (TOS col X = index 23)
      row[27] || '', // O - Loại Hàng (TOS col AB = index 27)
      row[28] || '', // P - Hàng Hóa (TOS col AC = index 28)
      row[29] || '', // Q - Trọng Lượng (TOS col AD = index 29)
      row[56] || ''  // R - Container Status (TOS col A_ = index 56)
    ];
  });

  if (rows.length > 0) {
    sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
  }

  return { success: true, message: rows.length + ' containers imported from TOS' };
}


// ===================== DELETE ESTIMATE =====================
function deleteEstimate(data) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const trkSheet = ss.getSheetByName('tracking');
  const estSheet = ss.getSheetByName('estimates');
  const contNo  = String(data.container_no).trim().toUpperCase();
  const estDate = String(data.est_date || '').trim(); // ngày của job cần xoá
  let trkDeleted = 0;
  let estDeleted = 0;

  // Xoá trong tracking — nếu có est_date thì xoá đúng dòng đó, không có thì xoá tất cả
  const trkData = trkSheet.getDataRange().getValues();
  const trkContIdx    = trkData[0].indexOf('container_no');
  const trkEstDateIdx = trkData[0].indexOf('est_date');
  const tz = ss.getSpreadsheetTimeZone();
  for (let i = trkData.length - 1; i >= 1; i--) {
    const rowCont = String(trkData[i][trkContIdx]).trim().toUpperCase();
    var rawDate = trkData[i][trkEstDateIdx];
    var rowDate = '';
    if (rawDate instanceof Date && !isNaN(rawDate)) {
      rowDate = Utilities.formatDate(rawDate, tz, 'dd/MM/yyyy');
    } else {
      rowDate = String(rawDate || '').trim().split(' ')[0];
    }
    if (rowCont === contNo) {
      if (!estDate || rowDate === estDate) {
        trkSheet.deleteRow(i + 1);
        trkDeleted++;
      }
    }
  }

  // Xoá trong estimates — nếu có est_date thì chỉ xoá estimates của job đó
  const estData = estSheet.getDataRange().getValues();
  for (let i = estData.length - 1; i >= 1; i--) {
    const rowCont = String(estData[i][1]).trim().toUpperCase();
    var rawEDt = estData[i][2];
    var rowDate = '';
    if (rawEDt instanceof Date && !isNaN(rawEDt)) {
      rowDate = Utilities.formatDate(rawEDt, tz, 'dd/MM/yyyy');
    } else {
      rowDate = String(rawEDt || '').trim().split(' ')[0];
    }
    if (rowCont === contNo) {
      if (!estDate || rowDate === estDate) {
        estSheet.deleteRow(i + 1);
        estDeleted++;
      }
    }
  }

  // Xoá trong summary — theo cont + est_date
  const sumSheet = ss.getSheetByName('summary');
  const sumData = sumSheet.getDataRange().getValues();
  const sumContIdx    = sumData[0].indexOf('container_no');
  const sumEstDateIdx = sumData[0].indexOf('est_date');
  let sumDeleted = 0;
  for (let i = sumData.length - 1; i >= 1; i--) {
    const rowCont = String(sumData[i][sumContIdx]).trim().toUpperCase();
    const rowDate = String(sumData[i][sumEstDateIdx] || '').trim();
    if (rowCont === contNo) {
      if (!estDate || rowDate === estDate) {
        sumSheet.deleteRow(i + 1);
        sumDeleted++;
      }
    }
  }

  _delCache();
  try { writeLog(data.username, 'Xoá Estimate', contNo, trkDeleted + ' tracking + ' + estDeleted + ' estimates đã xoá'); } catch(e) {}
  return {
    success: true,
    message: 'Đã xoá ' + contNo + ': ' + trkDeleted + ' tracking + ' + estDeleted + ' estimates + ' + sumDeleted + ' summary'
  };
}

// ===================== UPDATE ESTIMATE =====================
// Ghi đè lại estimate đã lưu — xoá dòng cũ rồi append dòng mới
function updateEstimate(data) {
  const ss    = SpreadsheetApp.openById(SPREADSHEET_ID);
  const estSh = ss.getSheetByName('estimates');
  const trkSh = ss.getSheetByName('tracking');
  const contNo = String(data.container_no).trim().toUpperCase();

  // 1. Xoá các dòng của cont này trong estimates CHỈ những dòng có est_date = hôm nay (job hiện tại)
  //    Xác định est_date active từ tracking
  const trkShUpd = ss.getSheetByName('tracking');
  const trkDataUpd = trkShUpd.getDataRange().getValues();
  const trkHdrUpd = trkDataUpd[0];
  // Dùng est_date từ JS truyền lên (DD/MM/YYYY) để xác định rows cần xóa
  const activeEstDate = String(data.est_date || '').trim();
  Logger.log('updateEstimate: contNo=' + contNo + ' activeEstDate=' + activeEstDate);

  // Lấy timestamp gốc trước khi xóa (để giữ nguyên khi append lại)
  let origTimestamp = '';
  const estData = estSh.getDataRange().getValues();
  for (let i = 1; i < estData.length; i++) {
    if (String(estData[i][1]).trim().toUpperCase() === contNo) {
      const estDtRaw = estData[i][2];
      if (estDtRaw instanceof Date) {
        origTimestamp = Utilities.formatDate(estDtRaw, 'Asia/Ho_Chi_Minh', 'dd/MM/yyyy HH:mm:ss');
      } else {
        origTimestamp = String(estDtRaw || '').trim();
      }
      if (origTimestamp) break;
    }
  }
  Logger.log('origTimestamp=' + origTimestamp);

  // Xoá rows cũ
  for (let i = estData.length - 1; i >= 1; i--) {
    if (String(estData[i][1]).trim().toUpperCase() === contNo) {
      const estDtRaw = estData[i][2];
      let estDatePart = '';
      if (estDtRaw instanceof Date) {
        estDatePart = Utilities.formatDate(estDtRaw, 'Asia/Ho_Chi_Minh', 'dd/MM/yyyy');
      } else {
        estDatePart = String(estDtRaw || '').trim().split(' ')[0];
      }
      if (!activeEstDate || estDatePart === activeEstDate) {
        estSh.deleteRow(i + 1);
      }
    }
  }

  // 2. Append dòng mới - giữ nguyên timestamp gốc
  const dateStr = origTimestamp || (data.est_date ? data.est_date + ' 00:00:00' : Utilities.formatDate(new Date(), 'Asia/Ho_Chi_Minh', 'dd/MM/yyyy HH:mm:ss'));
  const lines     = data.lines || [];

  // Lấy seq mới
  const lastRow = estSh.getLastRow();
  const nextSeq = lastRow > 1 ? lastRow : 1;

  lines.forEach((line, idx) => {
    estSh.appendRow([
      nextSeq + idx,           // A - Seq
      data.container_no,       // B - Equipment Number
      dateStr,                 // C - Estimate Date & Time
      data.carrier    || '',   // D - Carrier
      data.size_type  || '',   // E - Size Type
      idx + 1,                 // F - Repair Sequence
      line.damage_location || '', // G
      line.component       || '', // H
      line.damage_type     || '', // I
      line.repair_type     || '', // J
      line.length          || '', // K
      line.width           || '', // L
      line.unit            || '', // M
      '',                      // N - Part Number
      line.quantity        || 0,  // O
      data.currency || 'USD',  // P
      line.labour_hours    || 0,  // Q
      line.labour_cost     || 0,  // R
      line.material_cost   || 0,  // S
      '',                      // T - Tax
      line.responsible_party || '', // U
      '',                      // V - Upgrade Code
      'SK',                    // W - Material Type
      '',                      // X - Repair Remarks
      '',                      // Y - Header Remarks (bỏ)
      '',                      // Z - Grade Code (bỏ)
      '',                      // AA - Associate Container
      '',                      // AB - Lumpsum Code
      line.total_cost      || 0,  // AC - Total Cost
      'Pending'                // AD - Approval Status
    ]);
  });

  // 3. Cập nhật tracking
  const totalHours    = lines.reduce((s,l) => s + (parseFloat(l.labour_hours)  || 0), 0);
  const totalLabour   = lines.reduce((s,l) => s + (parseFloat(l.labour_cost)   || 0), 0);
  const totalMaterial = lines.reduce((s,l) => s + (parseFloat(l.material_cost) || 0), 0);
  const totalCost     = lines.reduce((s,l) => s + (parseFloat(l.total_cost)    || 0), 0);

  const trkData    = trkSh.getDataRange().getValues();
  const trkHeaders = trkData[0];
  const trkContIdxU = trkHeaders.indexOf('container_no');
  const trkStatusIdxU = trkHeaders.indexOf('approval_status');

  for (let i = 1; i < trkData.length; i++) {
    if (String(trkData[i][trkContIdxU]).trim().toUpperCase() === contNo) {
      const st = String(trkData[i][trkStatusIdxU] || '');
      if (!['Repaired','Rejected'].includes(st)) { // chỉ update dòng active
        trkSh.getRange(i+1, trkHeaders.indexOf('labour_hours')   + 1).setValue(round2(totalHours));
        trkSh.getRange(i+1, trkHeaders.indexOf('labour_cost')    + 1).setValue(round2(totalLabour));
        trkSh.getRange(i+1, trkHeaders.indexOf('material_cost')  + 1).setValue(round2(totalMaterial));
        trkSh.getRange(i+1, trkHeaders.indexOf('total_cost')     + 1).setValue(round2(totalCost));
        // Không update est_date khi edit - giữ nguyên ngày gốc
        var sfIdx = trkHeaders.indexOf('special_flag');
        if (sfIdx >= 0) trkSh.getRange(i+1, sfIdx+1).setValue(data.special_flag || '');
        break;
      }
    }
  }

  _delCache();
  return { success: true, message: 'Updated!', lines_saved: lines.length };
}

// ===================== APPEND TARIFF =====================
// Nối thêm tariff mới vào tab tariff (không xoá cũ)
function appendTariff(data) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName('tariff');
  const rows = (data.rows || []).map(row => [
    row[0]  || '',  // A - Carrier
    row[1]  || '',  // B - Size Type
    row[2]  || '',  // C - Damage Location Group
    row[3]  || '',  // D - Component
    row[4]  || '',  // E - Damage Type
    row[5]  || '',  // F - Repair Type
    row[6]  || '',  // G - Length
    row[7]  || '',  // H - Weight
    row[8]  || '',  // I - Unit
    row[9]  || '',  // J - Limit
    row[10] || 0,   // K - Hour
    row[11] || 0,   // L - Material
    row[12] || 0,   // M - Labour
    row[13] || 0    // N - Total cost
  ]);

  if (rows.length > 0) {
    sheet.getRange(sheet.getLastRow() + 1, 1, rows.length, 14).setValues(rows);
  }
  return { success: true, message: rows.length + ' rows appended to tariff' };
}

// ===================== TEST DRIVE ACCESS =====================
// Chạy function này để cấp quyền Drive
function testDriveAccess() {
  try {
    var root = DriveApp.getRootFolder();
    var testFolder = getOrCreateFolder(root, 'MNR_Estimate_Test');
    Logger.log('Drive access OK! Test folder: ' + testFolder.getUrl());
    // Xoá folder test
    testFolder.setTrashed(true);
    Logger.log('Drive permission granted successfully!');
    return 'OK';
  } catch(e) {
    Logger.log('Error: ' + e.toString());
    return e.toString();
  }
}

// ===================== GET ALL ESTIMATES =====================
// Lấy toàn bộ estimates cho Bulk List export
function getAllEstimates(containerNosStr) {
  const isAll = !containerNosStr || String(containerNosStr).trim() === '' || String(containerNosStr).trim() === '__ALL__';

  // Cache cho __ALL__ — TTL 60s
  if (isAll) {
    var cached = _getCache('cache_estimates_all');
    if (cached) return cached;
  }

  const ss    = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName('estimates');
  const data  = sheet.getDataRange().getValues();
  if (data.length <= 1) return { success: true, data: [] };

  // Parse danh sách cont filter nếu có
  var filterSet = null;
  if (containerNosStr && String(containerNosStr).trim() !== '' && String(containerNosStr).trim() !== '__ALL__') {
    filterSet = new Set(String(containerNosStr).toUpperCase().split(',').map(function(s){ return s.trim(); }).filter(Boolean));
  }

  // Chỉ lấy các dòng chưa bị xoá (col B = equipment_number không rỗng)
  const tz2 = ss.getSpreadsheetTimeZone();
  const rows = data.slice(1)
    .filter(row => {
      if (!row[1] || String(row[1]).trim() === '') return false;
      if (filterSet && !filterSet.has(String(row[1]).trim().toUpperCase())) return false;
      return true;
    })
    .map(row => {
      var fmtDate = function(v, withTime) {
        if (v instanceof Date && !isNaN(v)) return Utilities.formatDate(v, tz2, withTime ? 'dd/MM/yyyy HH:mm:ss' : 'dd/MM/yyyy');
        return String(v || '');
      };
      return ({
      equipment_number:   String(row[1]  || ''),  // B
      estimate_datetime:  fmtDate(row[2], true),  // C
      carrier:            String(row[3]  || ''),   // D
      size_type:          String(row[4]  || ''),   // E
      repair_seq:         row[5]  || '',           // F
      damage_location:    String(row[6]  || ''),   // G
      component:          String(row[7]  || ''),   // H
      damage_type:        String(row[8]  || ''),   // I
      repair_type:        String(row[9]  || ''),   // J
      length:             row[10] || '',           // K
      width:              row[11] || '',           // L
      unit:               String(row[12] || ''),   // M
      part_number:        String(row[13] || ''),   // N
      quantity:           row[14] || 1,            // O
      currency:           String(row[15] || 'USD'),// P
      labour_hours:       row[16] || 0,            // Q
      labour_cost:        row[17] || 0,            // R
      material_cost:      row[18] || 0,            // S
      tax:                String(row[19] || ''),   // T
      responsible_party:  String(row[20] || ''),   // U
      upgrade_code:       String(row[21] || ''),   // V
      material_type:      String(row[22] || 'SK'), // W
      repair_remarks:     String(row[23] || ''),   // X
      header_remarks:     String(row[24] || ''),   // Y
      grade_code:         String(row[25] || ''),   // Z
      associate_container:String(row[26] || ''),   // AA
      lumpsum_code:       String(row[27] || ''),   // AB
      total_cost:         row[28] || 0,            // AC
      approval_status:    String(row[29] || ''),   // AD
      app_damage_location:String(row[30] || ''),   // AE
      app_component:      String(row[31] || ''),   // AF
      app_damage_type:    String(row[32] || ''),   // AG
      app_repair_type:    String(row[33] || ''),   // AH
      app_length:         row[34] !== '' && row[34] !== null && row[34] !== undefined ? row[34] : '', // AI
      app_width:          row[35] !== '' && row[35] !== null && row[35] !== undefined ? row[35] : '', // AJ
      app_unit:           String(row[36] || ''),   // AK
      app_quantity:       row[37] !== '' && row[37] !== null && row[37] !== undefined ? row[37] : '', // AL
      app_labour_hours:   row[38] || 0,            // AM
      app_material_cost:  row[39] || 0,            // AN
      app_labour_cost:    row[40] || 0,            // AO
      app_total_approved: row[41] || 0,            // AP
      app_responsible_party: String(row[42] || ''),// AQ
      app_material_type:  String(row[43] || ''),   // AR
      app_remark_details: String(row[44] || ''),   // AS
      approval_date:      row[45] || ''            // AT
    });});

  var result = { success: true, data: rows };
  if (isAll) _setCache('cache_estimates_all', result, CACHE_TTL_LONG);
  return result;
}

// ===================== UPLOAD IMAGE TO DRIVE =====================
var SURVEY_FOLDER_NAME = 'MNR_Survey';

function getOrCreateFolder(parent, name) {
  // Dùng query chính xác để tránh tạo trùng folder
  var folders = parent.getFoldersByName(name);
  var found = null;
  while (folders.hasNext()) {
    var f = folders.next();
    if (f.getName() === name) { found = f; break; }
  }
  if (found) return found;
  return parent.createFolder(name);
}

function uploadImageToDrive(data) {
  try {
    var contNo   = String(data.container_no || '').trim().toUpperCase();
    var dateStr  = String(data.date_str || '').trim();   // ddMMyyyy
    var fileName = String(data.file_name || 'image.jpg').trim();
    var base64   = String(data.base64 || '');
    var mimeType = String(data.mime_type || 'image/jpeg');

    if (!contNo || !base64) return { success: false, error: 'Missing data' };

    // Cấu trúc: MNR_Estimate/Carrier/Loại ảnh/ddMMyyyy/CONT_NO/
    var carrier    = String(data.carrier  || 'UNKNOWN').trim().toUpperCase();
    var loaiAnh    = String(data.loai_anh || 'Trước sửa chữa').trim();
    var root       = DriveApp.getRootFolder();
    var surveyDir  = getOrCreateFolder(root, 'MNR_Estimate');
    var carrierDir = getOrCreateFolder(surveyDir, carrier);
    var loaiDir    = getOrCreateFolder(carrierDir, loaiAnh);
    var dateDir    = getOrCreateFolder(loaiDir, dateStr);
    var contDir    = getOrCreateFolder(dateDir, contNo);

    // Decode base64 và tạo file — đặt tên theo CONTNO (N).jpg
    var existingFiles = contDir.getFiles();
    var count = 0;
    while (existingFiles.hasNext()) { existingFiles.next(); count++; }
    var ext = mimeType.indexOf('png') !== -1 ? '.png' : '.jpg';
    var newFileName = contNo + ' (' + (count + 1) + ')' + ext;

    var bytes = Utilities.base64Decode(base64);
    var blob  = Utilities.newBlob(bytes, mimeType, newFileName);
    var file  = contDir.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    return {
      success:    true,
      file_id:    file.getId(),
      file_url:   file.getUrl(),
      folder_url: contDir.getUrl(),
      folder_id:  contDir.getId()
    };
  } catch(e) {
    return { success: false, error: e.toString() };
  }
}

function getDriveFolderLink(data) {
  try {
    var contNo  = String(data.container_no || '').trim().toUpperCase();
    var dateStr = String(data.date_str || '').trim();
    var root      = DriveApp.getRootFolder();
    var surveyDir = getOrCreateFolder(root, SURVEY_FOLDER_NAME);
    var beforeDir = getOrCreateFolder(surveyDir, 'Trước sửa chữa');
    var dateDir   = getOrCreateFolder(beforeDir, dateStr);
    var folders   = dateDir.getFoldersByName(contNo);
    if (folders.hasNext()) {
      var f = folders.next();
      return { success: true, url: f.getUrl() };
    }
    return { success: false, error: 'Folder not found' };
  } catch(e) {
    return { success: false, error: e.toString() };
  }
}

// ===================== SAVE DRIVE FOLDER TO TRACKING =====================
function saveDriveFolderToTracking(data) {
  try {
    var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    var trkSheet = ss.getSheetByName('tracking');
    var trkData = trkSheet.getDataRange().getValues();
    var headers = trkData[0];
    var contIdx = headers.indexOf('container_no');
    var folderIdx = headers.indexOf('drive_folder');

    // Nếu chưa có cột drive_folder thì thêm vào
    if (folderIdx === -1) {
      folderIdx = headers.length;
      trkSheet.getRange(1, folderIdx + 1).setValue('drive_folder');
    }

    var contNo = String(data.container_no || '').trim().toUpperCase();
    var folderUrl = String(data.folder_url || '');

    for (var i = 1; i < trkData.length; i++) {
      if (String(trkData[i][contIdx]).trim().toUpperCase() === contNo) {
        trkSheet.getRange(i + 1, folderIdx + 1).setValue(folderUrl);
        return { success: true };
      }
    }
    return { success: false, error: 'Container not found in tracking' };
  } catch(e) {
    return { success: false, error: e.toString() };
  }
}

// ===================== GET PHOTOS FROM DRIVE =====================
function getPhotosFromDrive(data) {
  try {
    var contNo = String(data.container_no || '').trim().toUpperCase();
    var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    var trkSheet = ss.getSheetByName('tracking');
    var trkData = trkSheet.getDataRange().getValues();
    var headers = trkData[0];
    var contIdx = headers.indexOf('container_no');
    var folderIdx = headers.indexOf('drive_folder');

    if (folderIdx === -1) return { success: true, photos: [], folder_url: null };

    var folderUrl = '';
    for (var i = 1; i < trkData.length; i++) {
      if (String(trkData[i][contIdx]).trim().toUpperCase() === contNo) {
        folderUrl = String(trkData[i][folderIdx] || '');
        break;
      }
    }

    if (!folderUrl) return { success: true, photos: [], folder_url: null };

    // Lấy folder ID từ URL
    var folderId = folderUrl.match(/[-\w]{25,}/);
    if (!folderId) return { success: true, photos: [], folder_url: folderUrl };

    var folder = DriveApp.getFolderById(folderId[0]);
    var files = folder.getFiles();
    var photos = [];

    while (files.hasNext()) {
      var file = files.next();
      var mime = file.getMimeType();
      if (mime.indexOf('image') !== -1) {
        // Lấy thumbnail URL có thể nhúng thẳng
        var thumbUrl = 'https://drive.google.com/thumbnail?id=' + file.getId() + '&sz=w400';
        photos.push({
          id:    file.getId(),
          name:  file.getName(),
          url:   file.getUrl(),
          thumb: thumbUrl
        });
      }
    }

    return { success: true, photos: photos, folder_url: folderUrl };
  } catch(e) {
    return { success: false, error: e.toString(), photos: [] };
  }
}

// ===================== GET PHOTOS BY FOLDER =====================
function getPhotosByFolder(params) {
  try {
    var contNo  = String(params.container_no || '').trim().toUpperCase();
    var carrier = String(params.carrier      || '').trim().toUpperCase();
    var loaiAnh = String(params.loai_anh     || 'Trước sửa chữa').trim();

    var root       = DriveApp.getRootFolder();
    var mnrDir     = root.getFoldersByName('MNR_Estimate');
    if (!mnrDir.hasNext()) return { success: true, photos: [] };
    var carrierDir = mnrDir.next().getFoldersByName(carrier);
    if (!carrierDir.hasNext()) return { success: true, photos: [] };
    var loaiDir    = carrierDir.next().getFoldersByName(loaiAnh);
    if (!loaiDir.hasNext()) return { success: true, photos: [] };

    // Tìm tất cả thư mục ngày rồi tìm thư mục cont
    var photos = [];
    var loaiFolder = loaiDir.next();
    var dateDirs = loaiFolder.getFolders();

    while (dateDirs.hasNext()) {
      var dateFolder = dateDirs.next();
      var contDirs = dateFolder.getFoldersByName(contNo);
      if (contDirs.hasNext()) {
        var contFolder = contDirs.next();
        var files = contFolder.getFiles();
        while (files.hasNext()) {
          var file = files.next();
          if (file.getMimeType().indexOf('image') !== -1) {
            photos.push({
              id:    file.getId(),
              name:  file.getName(),
              url:   file.getUrl(),
              thumb: 'https://drive.google.com/thumbnail?id=' + file.getId() + '&sz=w400',
              date:  dateFolder.getName()
            });
          }
        }
      }
    }

    // Sắp xếp theo tên
    photos.sort(function(a, b) {
  var na = a.name.match(/\d+/g);
  var nb = b.name.match(/\d+/g);
  var ia = na ? parseInt(na[na.length - 1]) : 0;
  var ib = nb ? parseInt(nb[nb.length - 1]) : 0;
  if (ia !== ib) return ia - ib;
  return a.name.localeCompare(b.name);
});
    return { success: true, photos: photos };
  } catch(e) {
    return { success: false, error: e.toString(), photos: [] };
  }
}

// ===================== DELETE PHOTO =====================
function deletePhotoFromDrive(data) {
  try {
    var fileId = String(data.file_id || '').trim();
    if (!fileId) return { success: false, error: 'No file_id' };
    var file = DriveApp.getFileById(fileId);
    file.setTrashed(true);
    return { success: true };
  } catch(e) {
    return { success: false, error: e.toString() };
  }
}

// ===================== DEBUG FUNCTIONS =====================
function debugLogin() {
  const ss = _getAdminSS();
  const sheet = ss.getSheetByName('users');
  const data = sheet.getDataRange().getValues();
  Logger.log('Total rows: ' + data.length);
  Logger.log('Row 0 (header): ' + JSON.stringify(data[0]));
  Logger.log('Row 1 (data): ' + JSON.stringify(data[1]));
  Logger.log('Username type: ' + typeof data[1][0]);
  Logger.log('Key type: ' + typeof data[1][1]);
  Logger.log('Key value: ' + data[1][1]);
}

function debugTariff() {
  const result = getTariff();
  Logger.log('Total tariff rows: ' + result.data.length);
  if (result.data.length > 0) {
    Logger.log('Sample row 1: ' + JSON.stringify(result.data[0]));
    Logger.log('Sample row 2: ' + JSON.stringify(result.data[1]));
  }
}

function debugStock() {
  const result = getEmtyStock();
  Logger.log('Total stock rows: ' + result.data.length);
  if (result.data.length > 0) {
    Logger.log('Sample row 1: ' + JSON.stringify(result.data[0]));
  }
}

// ===================== IMPORT OVM =====================
function importOVM(data) {
  try {
    var rows = data.rows || [];
    if (!rows.length) return { success: false, error: 'Không có dữ liệu!' };

    var ss       = SpreadsheetApp.openById(SPREADSHEET_ID);
    var trkSheet = ss.getSheetByName('tracking');
    var trkData  = trkSheet.getDataRange().getValues();
    var headers  = trkData[0];

    var iCont    = headers.indexOf('container_no');
    var iRef     = headers.indexOf('ref_number');
    var iStatus  = headers.indexOf('approval_status');
    var iAppDate = headers.indexOf('approved_date');
    var iTotApp  = headers.indexOf('total_approved');
    var iRepDate = headers.indexOf('repair_date');
    var iPONum   = headers.indexOf('po_number');
    var iPODate  = headers.indexOf('po_date');
    var iRemarks1= headers.indexOf('remarks1');
    var iUpdAt   = headers.indexOf('updated_at');

    // Estimates sheet
    var estSheet = ss.getSheetByName('estimates');
    var estData  = estSheet.getDataRange().getValues();
    var EST = {
      cont: 1, status: 29, appDate: 45,
      copyPairs: [
        [6,30],[7,31],[8,32],[9,33],[10,34],[11,35],[12,36],
        [14,37],[16,38],[18,39],[17,40],[28,41],[20,42],[22,43]
      ]
    };

    // Priority: Rejected đè tất cả (6), Repaired cao nhất trong flow (5)
    function statusPriority(s) {
      var P = {
        'Pending': 0, 'Sent for Approval': 1,
        'Approved': 2, 'Partially Approved': 2,
        'Partially Approved - Revised': 3,
        'Repair Pending': 4, 'Repaired': 5, 'Rejected': 6
      };
      return P[s] || 0;
    }

    var updated = 0, skipped = 0, notFound = [];

    rows.forEach(function(r) {
      var contNo = String(r.cont_no || '').trim().toUpperCase();
      if (!contNo) return;

      var rowIdx = -1;
      var CLOSED_IMP = ['Repaired', 'Rejected'];
      for (var i = 1; i < trkData.length; i++) {
        if (String(trkData[i][iCont]).trim().toUpperCase() === contNo) {
          var stImp = String(trkData[i][iStatus] || '');
          if (!CLOSED_IMP.includes(stImp)) { rowIdx = i; break; } // lấy dòng active
        }
      }
      if (rowIdx === -1) { notFound.push(contNo); return; }

      var sheetRow  = rowIdx + 1;
      var curStatus = String(trkData[rowIdx][iStatus] || '');
      var newStatus = r.new_status;

      // Priority check — Rejected luôn được phép đè
      if (newStatus !== 'Rejected' && statusPriority(newStatus) < statusPriority(curStatus)) {
        skipped++; return;
      }

      // Lấy est_date của job active để filter estimates đúng
      var rawEstDate = trkData[rowIdx][headers.indexOf('est_date')];
      var activeJobDate = '';
      if (rawEstDate instanceof Date && !isNaN(rawEstDate)) {
        activeJobDate = Utilities.formatDate(rawEstDate, 'Asia/Ho_Chi_Minh', 'dd/MM/yyyy');
      } else {
        // String raw — normalize về dd/MM/yyyy
        var s = String(rawEstDate || '').trim();
        var parts = s.split('/');
        if (parts.length === 3) {
          // Có thể M/D/YYYY hoặc D/M/YYYY — dùng displayValues để an toàn
          activeJobDate = s; // giữ nguyên string, matchEstRow sẽ so sánh
        }
      }

      function matchEstRow(j) {
        if (String(estData[j][EST.cont]).trim().toUpperCase() !== contNo) return false;
        if (!activeJobDate) return true;
        var rawEDt = estData[j][2];
        var eDt = '';
        if (rawEDt instanceof Date && !isNaN(rawEDt)) {
          eDt = Utilities.formatDate(rawEDt, 'Asia/Ho_Chi_Minh', 'dd/MM/yyyy');
        } else {
          eDt = String(rawEDt || '').trim().split(' ')[0];
        }
        return eDt === activeJobDate;
      }

      // === Bước 1: Sent for Approval ===
      if (newStatus === 'Sent for Approval') {
        if (iRef >= 0)    trkSheet.getRange(sheetRow, iRef+1).setValue(r.ref_no || '');
        if (iStatus >= 0) trkSheet.getRange(sheetRow, iStatus+1).setValue('Sent for Approval');
        if (iUpdAt >= 0) trkSheet.getRange(sheetRow, iUpdAt+1).setNumberFormat('@').setValue(Utilities.formatDate(new Date(), 'Asia/Ho_Chi_Minh', 'dd/MM/yyyy HH:mm:ss'));
        // Estimates: chỉ update status của job active
        for (var j = 1; j < estData.length; j++) {
          if (matchEstRow(j)) estSheet.getRange(j+1, EST.status+1).setValue('Sent for Approval');
        }
      }

      // === Bước 2: Approved / Partially Approved ===
      else if (newStatus === 'Approved' || newStatus === 'Partially Approved') {
        if (iRef >= 0)     trkSheet.getRange(sheetRow, iRef+1).setValue(r.ref_no || '');
        if (iStatus >= 0)  trkSheet.getRange(sheetRow, iStatus+1).setValue(newStatus);
        if (iUpdAt >= 0) trkSheet.getRange(sheetRow, iUpdAt+1).setNumberFormat('@').setValue(Utilities.formatDate(new Date(), 'Asia/Ho_Chi_Minh', 'dd/MM/yyyy HH:mm:ss'));
        if (iAppDate >= 0) { var c=trkSheet.getRange(sheetRow,iAppDate+1); c.setNumberFormat('@'); c.setValue(r.app_date||''); }
        if (iTotApp >= 0)  trkSheet.getRange(sheetRow, iTotApp+1).setValue(r.ovm_total||0);
        // Estimates: update status + date + copy chi tiết (chỉ khi Approved)
        var totalAppSum = 0, totalLHSum = 0, totalMatSum = 0, totalLabSum = 0;
        for (var j = 1; j < estData.length; j++) {
          if (!matchEstRow(j)) continue;
          var eRow = j + 1;
          estSheet.getRange(eRow, EST.status+1).setValue(newStatus);
          var dc = estSheet.getRange(eRow, EST.appDate+1); dc.setNumberFormat('@'); dc.setValue(r.app_date||'');
          if (newStatus === 'Approved') {
            // Approved: copy est→app fields
            EST.copyPairs.forEach(function(pair) { estSheet.getRange(eRow, pair[1]+1).setValue(estData[j][pair[0]]); });
            totalAppSum += parseFloat(estData[j][28] || 0); // total_cost
            totalLHSum  += parseFloat(estData[j][16] || 0); // labour_hours
            totalMatSum += parseFloat(estData[j][18] || 0); // material_cost
            totalLabSum += parseFloat(estData[j][17] || 0); // labour_cost
          }
          // Partially Approved: không copy — user tự chỉnh tay qua Revise
        }
        // Cập nhật revise_* trong tracking (chỉ khi Approved)
        if (newStatus === 'Approved') {
          var iRevTot = headers.indexOf('revise_total');
          var iRevLH  = headers.indexOf('revise_labour_hours');
          var iRevMat = headers.indexOf('revise_material_cost');
          var iRevLab = headers.indexOf('revise_labour_cost');
          if (iRevTot >= 0 && totalAppSum > 0) trkSheet.getRange(sheetRow, iRevTot+1).setValue(Math.round(totalAppSum * 100) / 100);
          if (iRevLH  >= 0 && totalLHSum  > 0) trkSheet.getRange(sheetRow, iRevLH+1) .setValue(Math.round(totalLHSum  * 100) / 100);
          if (iRevMat >= 0 && totalMatSum > 0) trkSheet.getRange(sheetRow, iRevMat+1).setValue(Math.round(totalMatSum * 100) / 100);
          if (iRevLab >= 0 && totalLabSum > 0) trkSheet.getRange(sheetRow, iRevLab+1).setValue(Math.round(totalLabSum * 100) / 100);
        }
      }

      // === Bước 4: Repair Pending — chỉ update repair_date + status ===
      else if (newStatus === 'Repair Pending') {
        if (iStatus >= 0)  trkSheet.getRange(sheetRow, iStatus+1).setValue('Repair Pending');
        if (iUpdAt >= 0) trkSheet.getRange(sheetRow, iUpdAt+1).setNumberFormat('@').setValue(Utilities.formatDate(new Date(), 'Asia/Ho_Chi_Minh', 'dd/MM/yyyy HH:mm:ss'));
        if (iRepDate >= 0 && r.repair_date) {
          var rc = trkSheet.getRange(sheetRow, iRepDate+1); rc.setNumberFormat('@'); rc.setValue(r.repair_date);
        }
        // Estimates: chỉ update status
        for (var j = 1; j < estData.length; j++) {
          if (matchEstRow(j)) estSheet.getRange(j+1, EST.status+1).setValue('Repair Pending');
        }
      }

      // === Bước 5: Repaired — chỉ update PO + status ===
      else if (newStatus === 'Repaired') {
        if (iStatus >= 0) trkSheet.getRange(sheetRow, iStatus+1).setValue('Repaired');
        if (iUpdAt >= 0) trkSheet.getRange(sheetRow, iUpdAt+1).setNumberFormat('@').setValue(Utilities.formatDate(new Date(), 'Asia/Ho_Chi_Minh', 'dd/MM/yyyy HH:mm:ss'));
        if (iPONum >= 0 && r.po_number) trkSheet.getRange(sheetRow, iPONum+1).setValue(r.po_number);
        if (iPODate >= 0 && r.po_date) {
          var pc = trkSheet.getRange(sheetRow, iPODate+1); pc.setNumberFormat('@'); pc.setValue(r.po_date);
        }
        // Estimates: chỉ update status
        for (var j = 1; j < estData.length; j++) {
          if (matchEstRow(j)) estSheet.getRange(j+1, EST.status+1).setValue('Repaired');
        }
      }

      // === Bước 6: Rejected — đè tất cả ===
      else if (newStatus === 'Rejected') {
        if (iStatus >= 0) trkSheet.getRange(sheetRow, iStatus+1).setValue('Rejected');
        if (iUpdAt >= 0) trkSheet.getRange(sheetRow, iUpdAt+1).setNumberFormat('@').setValue(Utilities.formatDate(new Date(), 'Asia/Ho_Chi_Minh', 'dd/MM/yyyy HH:mm:ss'));
        if (iRemarks1 >= 0 && r.rej_type) trkSheet.getRange(sheetRow, iRemarks1+1).setValue(r.rej_type);
        for (var j = 1; j < estData.length; j++) {
          if (matchEstRow(j)) estSheet.getRange(j+1, EST.status+1).setValue('Rejected');
        }
      }

      updated++;
    });

    _delCache();
    return { success: true, updated: updated, skipped: skipped, not_found: notFound };
  } catch(e) {
    return { success: false, error: e.toString() };
  }
}

// ===================== EXPORT PICTURES =====================
function createExportFolder(data) {
  try {
    var now        = new Date();
    var folderName = 'Export_bulk_' + Utilities.formatDate(now, 'Asia/Ho_Chi_Minh', 'ddMMyyyy_HHmm');
    var root       = DriveApp.getRootFolder();
    var mnrDir     = getOrCreateFolder(root, 'MNR_Estimate');
    var exportRoot = getOrCreateFolder(mnrDir, 'Export');
    var exportDir  = exportRoot.createFolder(folderName);
    exportDir.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    return { success: true, folder_name: folderName, folder_url: exportDir.getUrl(), folder_id: exportDir.getId() };
  } catch(e) {
    return { success: false, error: e.toString() };
  }
}


function exportPictures(data) {
  try {
    var contList = data.cont_list || [];
    var carrier  = String(data.carrier  || '').trim().toUpperCase();
    var loaiAnh  = String(data.loai_anh || 'Trước sửa chữa').trim();
    var mode     = String(data.mode     || 'B').trim().toUpperCase();
    var refMap   = data.ref_map || {};

    if (!contList.length) return { success: false, error: 'Không có cont nào!' };

    // Lấy access token để dùng Drive REST API
    var token = ScriptApp.getOAuthToken();

    var root       = DriveApp.getRootFolder();
    var mnrDir     = getOrCreateFolder(root, 'MNR_Estimate');
    var exportRoot = getOrCreateFolder(mnrDir, 'Export');
    var exportDir, folderName;

    if (data.folder_id) {
      try {
        exportDir  = DriveApp.getFolderById(data.folder_id);
        folderName = exportDir.getName();
      } catch(e) { exportDir = null; }
    }
    if (!exportDir) {
      folderName = 'Export_bulk_' + Utilities.formatDate(new Date(), 'Asia/Ho_Chi_Minh', 'ddMMyyyy_HHmm');
      exportDir  = exportRoot.createFolder(folderName);
      exportDir.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    }
    var exportFolderId = exportDir.getId();

    var carrierDirs = mnrDir.getFoldersByName(carrier);
    if (!carrierDirs.hasNext()) return { success: false, error: 'Không tìm thấy folder Carrier: ' + carrier };
    var carrierDir = carrierDirs.next();
    var loaiDirs   = carrierDir.getFoldersByName(loaiAnh);
    if (!loaiDirs.hasNext()) return { success: false, error: 'Không tìm thấy folder: ' + loaiAnh };
    var loaiDir = loaiDirs.next();

    // Cache tất cả date folders
    var allDateFolders = [];
    var dateDirsIter = loaiDir.getFolders();
    while (dateDirsIter.hasNext()) allDateFolders.push(dateDirsIter.next());

    // ── BƯỚC 1: Scan tất cả cont → thu thập fileId + tên mới ──
    var notFound = [], results = [];
    // copyTasks = [{fileId, newName, contNo}]
    var copyTasks = [];

    for (var ci = 0; ci < contList.length; ci++) {
      var contNo = String(contList[ci]).trim().toUpperCase();
      if (!contNo) continue;
      var refNo = String(refMap[contNo] || '').trim();

      var allFiles = [];
      for (var di = 0; di < allDateFolders.length; di++) {
        var contDirs = allDateFolders[di].getFoldersByName(contNo);
        if (contDirs.hasNext()) {
          var files = contDirs.next().getFiles();
          while (files.hasNext()) {
            var f = files.next();
            if (f.getMimeType().indexOf('image') !== -1) allFiles.push(f);
          }
        }
      }

      if (!allFiles.length) { notFound.push(contNo); continue; }

      // Sort tự nhiên theo số
      allFiles.sort(function(a, b) {
        var na = a.getName().match(/\d+/g), nb = b.getName().match(/\d+/g);
        return (na ? parseInt(na[na.length-1]) : 0) - (nb ? parseInt(nb[nb.length-1]) : 0);
      });

      var totalFound = allFiles.length;
      var sampleRef  = refNo ? refNo + '_' : '';

      allFiles.forEach(function(file, idx) {
        var seq     = String(idx + 1).padStart(3, '0');
        var newName = refNo
          ? mode + '_' + contNo + '_' + refNo + '_' + seq + '.jpg'
          : mode + '_' + contNo + '_' + seq + '.jpg';
        copyTasks.push({ fileId: file.getId(), newName: newName, contNo: contNo });
      });

      results.push({
        cont: contNo, ref: refNo||'—',
        count: totalFound, total_found: totalFound,
        sample_name: mode+'_'+contNo+'_'+sampleRef+'001.jpg'
      });
    }

    if (!copyTasks.length) {
      return { success: true, folder_name: folderName, folder_url: exportDir.getUrl(),
               folder_id: exportFolderId, total_copied: 0,
               total_conts: contList.length, found_conts: 0,
               results: [], not_found: notFound, timed_out: false };
    }

    // ── BƯỚC 2: Batch copy song song bằng UrlFetchApp.fetchAll ──
    var BATCH_SIZE = 50;
    var totalCopied = 0;
    var copiedFileIds = {}; // track fileId đã copy để tránh trùng

    for (var bi = 0; bi < copyTasks.length; bi += BATCH_SIZE) {
      var batch = copyTasks.slice(bi, bi + BATCH_SIZE);
      var requests = batch.map(function(task) {
        return {
          url: 'https://www.googleapis.com/drive/v3/files/' + task.fileId + '/copy',
          method: 'post',
          contentType: 'application/json',
          headers: { 'Authorization': 'Bearer ' + token },
          payload: JSON.stringify({
            name: task.newName,
            parents: [exportFolderId]
          }),
          muteHttpExceptions: true
        };
      });

      var responses = UrlFetchApp.fetchAll(requests);
      responses.forEach(function(resp, idx) {
        if (resp.getResponseCode() === 200) {
          var respData = JSON.parse(resp.getContentText());
          var newFileId = respData.id;
          var srcFileId = batch[idx].fileId;
          if (copiedFileIds[srcFileId]) {
            // Đã copy rồi — xoá bản trùng
            try {
              UrlFetchApp.fetch(
                'https://www.googleapis.com/drive/v3/files/' + newFileId,
                { method: 'delete', headers: { 'Authorization': 'Bearer ' + token }, muteHttpExceptions: true }
              );
            } catch(e) {}
          } else {
            copiedFileIds[srcFileId] = newFileId;
            totalCopied++;
          }
        }
      });
    }

    // ── BƯỚC 3: Đếm lại file thực tế trong folder để verify (có pagination) ──
    var actualCount = 0;
    try {
      var pageToken = '';
      var baseUrl = 'https://www.googleapis.com/drive/v3/files?q=' +
        encodeURIComponent("'" + exportFolderId + "' in parents and trashed=false") +
        '&fields=nextPageToken,files(id)&pageSize=1000';
      do {
        var pageUrl = baseUrl + (pageToken ? '&pageToken=' + encodeURIComponent(pageToken) : '');
        var countResp = UrlFetchApp.fetch(pageUrl,
          { headers: { 'Authorization': 'Bearer ' + token }, muteHttpExceptions: true }
        );
        if (countResp.getResponseCode() === 200) {
          var countData = JSON.parse(countResp.getContentText());
          actualCount += (countData.files || []).length;
          pageToken = countData.nextPageToken || '';
        } else {
          pageToken = '';
        }
      } while (pageToken);
    } catch(e) { actualCount = totalCopied; }

    return {
      success: true, folder_name: folderName, folder_url: exportDir.getUrl(),
      folder_id: exportFolderId, total_copied: totalCopied,
      actual_count: actualCount, // số file thực tế trong folder
      total_conts: contList.length, found_conts: results.length,
      results: results, not_found: notFound, timed_out: false
    };

  } catch(e) {
    return { success: false, error: e.toString() };
  }
}



// ===================== UPDATE TRACKING REMARK =====================
function updateTrackingRemark(data) {
  try {
    var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    var trkSheet = ss.getSheetByName('tracking');
    var trkData  = trkSheet.getDataRange().getValues();
    var headers  = trkData[0];
    var iSeq     = headers.indexOf('seq');
    var iRem1    = headers.indexOf('remarks1');
    var seq      = String(data.seq || '').trim();
    var remarks1 = String(data.remarks1 || '');

    for (var i = 1; i < trkData.length; i++) {
      if (String(trkData[i][iSeq]).trim() !== seq) continue;
      trkSheet.getRange(i + 1, iRem1 + 1).setValue(remarks1);
      _delCache();
      return { success: true };
    }
    return { success: false, error: 'Không tìm thấy dòng seq=' + seq };
  } catch(e) {
    return { success: false, error: e.toString() };
  }
}

// ===================== UPDATE TRACKING STATUS INLINE =====================
function updateTrackingStatus(data) {
  try {
    var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    var trkSheet = ss.getSheetByName('tracking');
    var trkData  = trkSheet.getDataRange().getValues();
    var headers  = trkData[0];
    var iSeq     = headers.indexOf('seq');
    var iCont    = headers.indexOf('container_no');
    var iStatus  = headers.indexOf('approval_status');
    var iEstDate = headers.indexOf('est_date');
    var seq       = String(data.seq || '').trim();
    var newStatus = String(data.approval_status || '').trim();

    var ALLOWED = ['Pending','Sent for Approval','Approved','Partially Approved',
                   'Partially Approved - Revised','Repair Pending','Repaired','Rejected'];
    if (!ALLOWED.includes(newStatus)) return { success: false, error: 'Status không hợp lệ' };

    var updated = 0;
    for (var i = 1; i < trkData.length; i++) {
      // Tìm đúng dòng bằng seq
      if (String(trkData[i][iSeq]).trim() !== seq) continue;

      var contNo  = String(trkData[i][iCont]    || '').trim().toUpperCase();
      var rowDate = String(trkData[i][iEstDate]  || '').trim();

      trkSheet.getRange(i + 1, iStatus + 1).setValue(newStatus);

      // Update estimates sheet cùng cont + est_date
      var estSheet = ss.getSheetByName('estimates');
      var estData  = estSheet.getDataRange().getValues();
      for (var j = 1; j < estData.length; j++) {
        var eCont = String(estData[j][1] || '').trim().toUpperCase();
        var eDt   = String(estData[j][2] || '').trim().split(' ')[0];
        if (eCont === contNo && (!rowDate || eDt === rowDate)) {
          estSheet.getRange(j + 1, 30).setValue(newStatus);
        }
      }
      updated++;
      break;
    }
    _delCache();
  return { success: true, updated: updated };
  } catch(e) {
    return { success: false, error: e.toString() };
  }
}

// ===================== UTILS =====================
function round2(n) {
  return Math.round((n || 0) * 100) / 100;
}
// ===================== GENERATE EXCEL LIST =====================
function genExcelList(data) {
  try {
    var type = data.type || 'est';
    var rows = data.rows || [];
    Logger.log('genExcelList: type=' + type + ' rows=' + rows.length);
    if (!rows.length) return { success: false, error: 'No data' };

    function fmtD(v) {
      if (!v) return '';
      var s = String(v);
      if (s.indexOf('T') > 0) {
        var d = new Date(s);
        return Utilities.formatDate(d, 'Asia/Ho_Chi_Minh', 'dd/MM/yyyy');
      }
      if (s.match(/^\d{1,2}\/\d{1,2}\/\d{4}$/)) {
        var p = s.split('/');
        return p[0].padStart(2,'0') + '/' + p[1].padStart(2,'0') + '/' + p[2];
      }
      return s;
    }

    function esc(v) {
      if (v === null || v === undefined) return '';
      return String(v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
    }

    var dateHdr = type === 'est' ? 'Estimate Date &amp; Time (DD/MM/YYYY HH:MM:SS)' : 'Approval Date (DD/MM/YYYY)';
    var title = type === 'est' ? 'ESTIMATED CONTAINER LIST' : 'APPROVED CONTAINER LIST';

    var HEADERS = ['Seq','Equipment Number','Size Type', dateHdr, 'Repair Sequence',
      'Damage Location','Component','Damage Type','Repair Type','Length','Width','Unit','Quantity','Currency',
      'Labour Hours','Labour Cost','Material Cost','Total Cost','Responsible Party','Material Type'];

    // Group by container
    var groups = {}, order = [];
    rows.forEach(function(r) {
      var k = r.equipment_number || '';
      if (!groups[k]) { groups[k] = []; order.push(k); }
      groups[k].push(r);
    });

    // Build XML SpreadsheetML
    var xml = '<?xml version="1.0"?>\n';
    xml += '<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" ';
    xml += 'xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet" ';
    xml += 'xmlns:x="urn:schemas-microsoft-com:office:excel">\n';
    xml += '<Styles>\n';
    xml += '<Style ss:ID="title"><Font ss:Bold="1" ss:Color="#FF0000" ss:Size="16"/><Alignment ss:Horizontal="Center" ss:Vertical="Center"/></Style>\n';
    xml += '<Style ss:ID="hdr"><Font ss:Bold="1" ss:Size="9"/><Interior ss:Color="#DCDCDC" ss:Pattern="Solid"/><Alignment ss:Horizontal="Center" ss:Vertical="Center" ss:WrapText="1"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1"/></Borders></Style>\n';
    xml += '<Style ss:ID="data"><Font ss:Size="9"/><Alignment ss:Horizontal="Center" ss:Vertical="Center"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1"/></Borders></Style>\n';
    xml += '<Style ss:ID="num"><Font ss:Size="9"/><Alignment ss:Horizontal="Right" ss:Vertical="Center"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1"/></Borders></Style>\n';
    xml += '<Style ss:ID="tot"><Font ss:Bold="1" ss:Color="#FF0000" ss:Size="9"/><Alignment ss:Horizontal="Center" ss:Vertical="Center"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1"/></Borders></Style>\n';
    xml += '<Style ss:ID="totn"><Font ss:Bold="1" ss:Color="#FF0000" ss:Size="9"/><Alignment ss:Horizontal="Right" ss:Vertical="Center"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1"/></Borders></Style>\n';
    xml += '</Styles>\n';
    xml += '<Worksheet ss:Name="Sheet1"><Table ss:DefaultColumnWidth="80">\n';

    // Col widths
    var colW = [40,130,65,250,95,100,90,90,90,55,55,50,55,65,90,90,100,85,120,100];
    colW.forEach(function(w){ xml += '<Column ss:Width="'+w+'"/>\n'; });

    function cell(val, style, type_) {
      var t = type_ || 'String';
      var v = (val === null || val === undefined || val === '') ? '' : val;
      if (t === 'Number' && (v === '' || isNaN(Number(v)))) { t = 'String'; v = ''; }
      return '<Cell ss:StyleID="'+style+'"><Data ss:Type="'+t+'">'+esc(String(v))+'</Data></Cell>';
    }

    // Row 1: Title (height 40)
    xml += '<Row ss:Height="40"><Cell ss:MergeAcross="19" ss:StyleID="title"><Data ss:Type="String">'+title+'</Data></Cell></Row>\n';
    xml += '<Row ss:Height="8"/>\n';
    xml += '<Row ss:Height="8"/>\n';

    var seqNo = 1;
    order.forEach(function(contNo) {
      var contRows = groups[contNo];

      // Filter valid
      var valid = contRows.filter(function(r) {
        return type==='est' ? (r.damage_location||r.component) : (r.app_damage_location||r.app_component);
      });
      if (!valid.length) return;

      // Header row
      xml += '<Row ss:Height="30">';
      HEADERS.forEach(function(h){ xml += cell(h,'hdr'); });
      xml += '</Row>\n';

      var totQty=0, totLH=0, totLab=0, totMat=0, totTot=0;
      var n = valid.length;

      valid.forEach(function(r, ri) {
        var dl,co,dt,rt,ln,wd,un,qty,lh,lab,mat,tot,resp,mtype,date,repSeq,size;
        size = r.size_type||'';
        if (type==='est') {
          dl=r.damage_location||''; co=r.component||''; dt=r.damage_type||''; rt=r.repair_type||'';
          ln=r.length; wd=r.width; un=r.unit||''; qty=parseFloat(r.quantity)||1;
          lh=parseFloat(r.labour_hours)||0; lab=parseFloat(r.labour_cost)||0;
          mat=parseFloat(r.material_cost)||0; tot=parseFloat(r.total_cost)||0;
          resp=r.responsible_party||''; mtype=r.material_type||'SK';
          date=fmtD((r.estimate_datetime||'').toString().split(' ')[0]);
          repSeq=r.repair_seq||'';
        } else {
          dl=r.app_damage_location||''; co=r.app_component||''; dt=r.app_damage_type||''; rt=r.app_repair_type||'';
          ln=r.app_length; wd=r.app_width; un=r.app_unit||''; qty=parseFloat(r.app_quantity)||1;
          lh=parseFloat(r.app_labour_hours)||0; lab=parseFloat(r.app_labour_cost)||0;
          mat=parseFloat(r.app_material_cost)||0; tot=parseFloat(r.app_total_approved)||0;
          resp=r.app_responsible_party||''; mtype=r.app_material_type||'SK';
          date=fmtD(r.approval_date||''); repSeq=r.repair_seq||'';
        }
        totQty+=qty; totLH+=lh; totLab+=lab; totMat+=mat; totTot+=tot;

        var lnVal = (ln!==null&&ln!==''&&ln!==undefined&&ln!==0&&ln!=='0') ? ln : '';
        var wdVal = (wd!==null&&wd!==''&&wd!==undefined&&wd!==0&&wd!=='0') ? wd : '';

        xml += '<Row ss:Height="15">';
        xml += cell(ri===0?seqNo:'', 'data', ri===0?'Number':'String');
        xml += cell(ri===0?contNo:'', 'data');
        xml += cell(ri===0?size:'', 'data');
        xml += cell(ri===0?date:'', 'data');
        xml += cell(repSeq, 'data', 'Number');
        xml += cell(dl,'data'); xml += cell(co,'data'); xml += cell(dt,'data'); xml += cell(rt,'data');
        xml += cell(lnVal,'num', lnVal!==''?'Number':'String');
        xml += cell(wdVal,'num', wdVal!==''?'Number':'String');
        xml += cell(un,'data');
        xml += cell(qty,'num','Number');
        xml += cell('USD','data');
        xml += cell(Math.round(lh*100)/100,'num','Number');
        xml += cell(Math.round(lab*100)/100,'num','Number');
        xml += cell(Math.round(mat*100)/100,'num','Number');
        xml += cell(Math.round(tot*100)/100,'num','Number');
        xml += cell(resp,'data'); xml += cell(mtype,'data');
        xml += '</Row>\n';
      });

      // Total row
      xml += '<Row ss:Height="15">';
      xml += '<Cell ss:MergeAcross="3" ss:StyleID="tot"><Data ss:Type="String">Total</Data></Cell>';
      // blank cols 5-14
      for (var c=4;c<14;c++) xml += cell('','tot');
      xml += cell(Math.round(totLH*100)/100,'totn','Number');
      xml += cell(Math.round(totLab*100)/100,'totn','Number');
      xml += cell(Math.round(totMat*100)/100,'totn','Number');
      xml += cell(Math.round(totTot*100)/100,'totn','Number');
      xml += cell('','tot'); xml += cell('','tot');
      xml += '</Row>\n';

      // 3 blank rows
      xml += '<Row/><Row/><Row/>\n';
      seqNo++;
    });

    xml += '</Table></Worksheet></Workbook>';

    var blob = Utilities.newBlob(xml, 'application/vnd.ms-excel', 
      type==='est' ? 'Estimated_Container_List.xls' : 'Approved_Container_List.xls');
    var b64 = Utilities.base64Encode(blob.getBytes());
    var fname = type==='est' ? 'Estimated_Container_List.xls' : 'Approved_Container_List.xls';
    Logger.log('genExcelList done, b64 length=' + b64.length);
    return { success: true, b64: b64, filename: fname };

  } catch(err) {
    Logger.log('genExcelList ERROR: ' + err.message);
    return { success: false, error: err.message };
  }
}

function updateTrackingRepairDate(data) {
  try {
    var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    var trkSheet = ss.getSheetByName('tracking');
    var trkData  = trkSheet.getDataRange().getValues();
    var headers  = trkData[0];
    var iSeq     = headers.indexOf('seq');
    var iRepDate = headers.indexOf('repair_date');
    var seq      = String(data.seq || '').trim();
    var val      = String(data.repair_date || '').trim();

    for (var i = 1; i < trkData.length; i++) {
      if (String(trkData[i][iSeq]).trim() !== seq) continue;
      var cell = trkSheet.getRange(i + 1, iRepDate + 1);
      cell.setNumberFormat('@');
      cell.setValue(val);
      return { success: true };
    }
    return { success: false, error: 'Không tìm thấy seq=' + seq };
  } catch(e) {
    return { success: false, error: e.toString() };
  }
}

function countPhotos(params) {
  try {
    var contList = params.cont_list ? String(params.cont_list).split(',').map(function(s){return s.trim();}).filter(Boolean) : [];
    var carrier  = String(params.carrier || '').trim().toUpperCase();
    var loaiAnh  = String(params.loai_anh || 'Trước sửa chữa').trim();

    if (!contList.length || !carrier) return { success: false, error: 'Missing params' };

    var root      = DriveApp.getRootFolder();
    var mnrDir    = getOrCreateFolder(root, 'MNR_Estimate');
    var carrierIt = mnrDir.getFoldersByName(carrier);
    if (!carrierIt.hasNext()) return { success: true, counts: contList.map(function(c){ return {cont:c, count:0}; }) };
    var carrierDir = carrierIt.next();
    var loaiIt = carrierDir.getFoldersByName(loaiAnh);
    if (!loaiIt.hasNext()) return { success: true, counts: contList.map(function(c){ return {cont:c, count:0}; }) };
    var loaiDir = loaiIt.next();

    // Cache date folders
    var allDateFolders = [];
    var it = loaiDir.getFolders();
    while (it.hasNext()) allDateFolders.push(it.next());

    var counts = contList.map(function(contNo) {
      contNo = String(contNo).trim().toUpperCase();
      var count = 0;
      for (var i = 0; i < allDateFolders.length; i++) {
        var contIt = allDateFolders[i].getFoldersByName(contNo);
        if (contIt.hasNext()) {
          var files = contIt.next().getFiles();
          while (files.hasNext()) {
            var f = files.next();
            if (f.getMimeType().indexOf('image') !== -1) count++;
          }
          break;
        }
      }
      return { cont: contNo, count: count };
    });

    return { success: true, counts: counts };
  } catch(e) {
    return { success: false, error: e.toString() };
  }
}

// ===================== AUTO IMPORT STOCK =====================
// Folder: MNR_Estimate/Stock_Auto/ — nhân viên upload file TOS vào đây
// Trigger: 9:00 sáng mỗi ngày
// Sau khi import: gửi Gmail thông báo

var STOCK_AUTO_FOLDER = 'Stock_Auto';
// NOTIFY_EMAILS đọc từ sheet config key=NOTIFY_EMAILS, fallback về hardcode
function _getNotifyEmails() {
  var cfg = getConfig();
  return cfg['NOTIFY_EMAILS'] || 'quanlyrong@thanhphuocport.com.vn,xuandung1001@gmail.com,mnrdry@thanhphuocport.com.vn';
}

function autoImportStock() {
  var log = [];
  var success = false;
  var imported = 0;

  try {
    // Tìm folder MNR_Estimate/Stock_Auto
    var root = DriveApp.getRootFolder();
    var mnrIt = root.getFoldersByName('MNR_Estimate');
    if (!mnrIt.hasNext()) throw new Error('Không tìm thấy folder MNR_Estimate trên Drive');
    var mnrFolder = mnrIt.next();

    var autoIt = mnrFolder.getFoldersByName(STOCK_AUTO_FOLDER);
    if (!autoIt.hasNext()) throw new Error('Không tìm thấy folder ' + STOCK_AUTO_FOLDER);
    var autoFolder = autoIt.next();

    // Lấy file Excel mới nhất trong folder
    var files = autoFolder.getFiles();
    var latestFile = null;
    var latestDate = new Date(0);

    while (files.hasNext()) {
      var f = files.next();
      var mime = f.getMimeType();
      if (mime === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
          mime === 'application/vnd.ms-excel') {
        if (f.getLastUpdated() > latestDate) {
          latestDate = f.getLastUpdated();
          latestFile = f;
        }
      }
    }

    if (!latestFile) throw new Error('Không tìm thấy file Excel trong folder ' + STOCK_AUTO_FOLDER);
    log.push('File: ' + latestFile.getName() + ' (' + Utilities.formatDate(latestDate, Session.getScriptTimeZone(), 'dd/MM/yyyy HH:mm') + ')');

    // Đọc file Excel — cần Drive API v3 trong Services
    var tempName = '_temp_stock_' + new Date().getTime();
    var copiedId = Drive.Files.copy(
      { name: tempName, mimeType: 'application/vnd.google-apps.spreadsheet' },
      latestFile.getId()
    ).id;
    Utilities.sleep(1000);
    var ssTemp   = SpreadsheetApp.openById(copiedId);
    var dataAll  = ssTemp.getSheets()[0].getDataRange().getValues();
    DriveApp.getFileById(copiedId).setTrashed(true);

    // Bỏ header, lọc rows có equipment_no (col G = index 6)
    var dataRows = dataAll.slice(1).filter(function(r) {
      return r[6] && String(r[6]).trim() !== '';
    });

    if (dataRows.length === 0) throw new Error('File không có dữ liệu hợp lệ');
    log.push('Đọc được: ' + dataRows.length + ' containers');

    // Import vào sheet emty_stock — dùng lại logic importStockFromTOS
    var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    var sheet = ss.getSheetByName('emty_stock');
    var headers = HEADERS.emty_stock;

    if (sheet.getLastRow() > 1) {
      sheet.getRange(2, 1, sheet.getLastRow() - 1, headers.length).clearContent();
    }

    var rows = dataRows.map(function(row, idx) {
      return [
        idx + 1,
        row[1]  || '',
        row[6]  || '',
        row[7]  || '',
        row[8]  || '',
        row[11] || '',
        row[12] || '',
        row[13] || '',
        row[14] || '',
        row[15] || '',
        row[16] || '',
        row[17] || '',
        row[18] || '',
        row[23] || '',
        row[27] || '',
        row[28] || '',
        row[29] || '',
        row[56] || ''
      ];
    });

    if (rows.length > 0) {
      sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
    }

    imported = rows.length;
    _delCache(); // Xoá GAS cache để app load data mới
    success = true;
    log.push('Import thành công: ' + imported + ' containers');

  } catch(e) {
    log.push('LỖI: ' + e.toString());
  }

  // Gửi Gmail thông báo nội bộ
  try {
    var now = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'dd/MM/yyyy HH:mm');
    var subject = (success ? '✅' : '❌') + ' Auto Import Stock — Cảng Thạnh Phước — ' + now;
    var body = '<div style="font-family:Arial,sans-serif;font-size:13px">'
      + '<h3 style="color:' + (success ? '#15803d' : '#dc2626') + '">'
      + (success ? '✅ Import Stock thành công' : '❌ Import Stock thất bại')
      + '</h3>'
      + '<table style="border-collapse:collapse;width:100%">'
      + '<tr><td style="padding:6px 12px;background:#f5f5f5;font-weight:600">Thời gian</td>'
      + '<td style="padding:6px 12px">' + now + '</td></tr>'
      + '<tr><td style="padding:6px 12px;background:#f5f5f5;font-weight:600">Kết quả</td>'
      + '<td style="padding:6px 12px">' + (success ? imported + ' containers đã được cập nhật' : 'Thất bại') + '</td></tr>'
      + '<tr><td style="padding:6px 12px;background:#f5f5f5;font-weight:600">Chi tiết</td>'
      + '<td style="padding:6px 12px">' + log.join('<br>') + '</td></tr>'
      + '</table>'
      + '<br><p style="color:#888;font-size:11px">MNR Estimate — Cảng Thạnh Phước</p>'
      + '</div>';

    GmailApp.sendEmail(_getNotifyEmails(), subject, '', { htmlBody: body, from: 'mnrdry@thanhphuocport.com.vn', name: 'THANH PHUOC PORT' });
  } catch(e) {
    Logger.log('Gmail error: ' + e.toString());
  }
}

// ===================== CONFIG READER =====================
// Đọc sheet 'config' (cột A=key, cột B=value), trả về object {key: value}
function getConfig() {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = ss.getSheetByName('config');
  if (!sheet) return {};
  var data = sheet.getDataRange().getValues();
  var cfg = {};
  data.forEach(function(row) {
    var k = String(row[0] || '').trim();
    var v = String(row[1] || '').trim();
    if (k) cfg[k] = v;
  });
  return cfg;
}

// Chạy 1 lần để tạo sheet config với các key mẫu
function setupConfigSheet() {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = ss.getSheetByName('config');
  if (sheet) { Logger.log('Sheet config đã tồn tại, bỏ qua.'); return; }
  sheet = ss.insertSheet('config');
  var rows = [
    ['MSC_EMAIL',         'email-msc@msc.com'],
    ['MSC_EMAIL_CC',      'quanlyrong@thanhphuocport.com.vn'],
    ['MSC_EMAIL_SUBJECT', ''],
    ['NOTIFY_EMAILS',     'quanlyrong@thanhphuocport.com.vn,xuandung1001@gmail.com,mnrdry@thanhphuocport.com.vn'],
  ];
  sheet.getRange(1, 1, rows.length, 2).setValues(rows);
  sheet.getRange(1, 1, rows.length, 1).setFontWeight('bold');
  sheet.autoResizeColumns(1, 2);
  Logger.log('Đã tạo sheet config thành công!');
}

// ===================== MSC INVENTORY EMAIL =====================
// Port logic INV_SIZES, INV_ROWS, calcInvRow từ index.html sang GAS

var GAS_INV_SIZES = ['20DV','20RE','20OT','20FL','20HF','40DV','40HC','40HP','40OT','40HO','40FL','40HF','40HR','45HC','45HP'];

var GAS_SIZE_MAP = {
  '22G0':'20DV','22G1':'20DV','22R1':'20RE','22U1':'20OT','22P1':'20FL','22H0':'20HF','22H1':'20HF',
  '42G0':'40DV','42G1':'40DV',
  '42H0':'40HC','42H1':'40HC','42H2':'40HC',
  '42P1':'40HP','42U1':'40OT',
  '40HO':'40HO','42R1':'40FL','42F1':'40HF','42HR':'40HR',
  'L2G1':'45HC','L2H0':'45HC','L2H1':'45HC','L2P1':'45HP',
};

function _gasNormSize(raw) {
  var s = String(raw||'').toUpperCase().replace(/'/g,'').trim();
  if (GAS_INV_SIZES.indexOf(s) >= 0) return s;
  if (GAS_SIZE_MAP[s]) return GAS_SIZE_MAP[s];
  var s2 = s.replace(/[\s\-]/g,'');
  if (GAS_INV_SIZES.indexOf(s2) >= 0) return s2;
  if (GAS_SIZE_MAP[s2]) return GAS_SIZE_MAP[s2];
  return s;
}
function _gasTeu(s)       { return s && s.charAt(0)==='2' ? 1 : 2; }
function _gastt(r)        { return String(r.container_status||'').toUpperCase().trim(); }
function _gasgr(r)        { return String(r.grade||'').toUpperCase().trim(); }
function _gasIsAV(r)      { return _gastt(r)==='AV'; }
function _gasIsDM(r)      { var g=_gasgr(r); return _gastt(r)==='DM'&&(g==='A'||g==='B'||g==='C'); }
function _gasIsWA(r)      { var g=_gasgr(r); return _gastt(r)==='WA'&&(g==='A'||g==='B'||g==='C'); }
function _gasIsSELL(r)    { return (_gastt(r)==='SL'||_gastt(r)==='SELL')&&_gasgr(r)==='O'; }
function _gasIsOFH(r)     { return _gastt(r)==='OF'||_gastt(r)==='OFH'; }
function _gasIsReefer(r)  { var s=_gasNormSize(r.size_type||r.size_type_iso||''); return s.indexOf('RE')>=0||s.indexOf('RF')>=0; }
function _gasIsGrade(r,g) { return _gasgr(r)===g.toUpperCase(); }
function _gasIsTraxens(r) { return String(r.remarks||'').toLowerCase().indexOf('traxens')>=0; }

function _gasGetInvRows() {
  return [
    { label:'TOTAL AV',                          type:'total',  f:function(r){return _gasIsAV(r);} },
    { label:'Including Smart Containers (AV)',   type:'italic', f:function(r){return _gasIsAV(r)&&_gasIsTraxens(r);} },
    { label:'TOTAL DM ( PENDING FOR REPAIR)',    type:'total',  f:function(r){return _gasIsDM(r);} },
    { label:'TOTAL DM (AWAITING APPROVAL)',      type:'total',  f:function(r){return _gasIsWA(r);} },
    { label:'Including Smart Containers (DM)',   type:'italic', f:function(r){return (_gasIsDM(r)||_gasIsWA(r))&&_gasIsTraxens(r);} },
    { label:'UN SURVEYED',                       type:'sub',    f:function(r){return _gastt(r)==='DM'&&_gasIsGrade(r,'U');} },
    { label:'', type:'separator', f:null },
    { label:'TOTAL GRADE A',                     type:'total',  f:function(r){return (_gasIsAV(r)||_gasIsDM(r)||_gasIsWA(r))&&_gasIsGrade(r,'A');} },
    { label:'AV GRADE A',                        type:'sub',    f:function(r){return _gasIsAV(r)&&_gasIsGrade(r,'A');} },
    { label:'Including Smart Containers (AV)',   type:'italic', f:function(r){return _gasIsAV(r)&&_gasIsGrade(r,'A')&&_gasIsTraxens(r);} },
    { label:'DM ( PENDING FOR REPAIR) GRADE A',  type:'sub',   f:function(r){return _gasIsDM(r)&&_gasIsGrade(r,'A');} },
    { label:'DM (AWAITING APPROVAL) GRADE A',    type:'sub',   f:function(r){return _gasIsWA(r)&&_gasIsGrade(r,'A');} },
    { label:'Including Smart Containers (DM)',   type:'italic', f:function(r){return (_gasIsDM(r)||_gasIsWA(r))&&_gasIsGrade(r,'A')&&_gasIsTraxens(r);} },
    { label:'', type:'separator', f:null },
    { label:'TOTAL GRADE B',                     type:'total',  f:function(r){return (_gasIsAV(r)||_gasIsDM(r)||_gasIsWA(r))&&_gasIsGrade(r,'B');} },
    { label:'AV GRADE B',                        type:'sub',    f:function(r){return _gasIsAV(r)&&_gasIsGrade(r,'B');} },
    { label:'Including Smart Containers (AV)',   type:'italic', f:function(r){return _gasIsAV(r)&&_gasIsGrade(r,'B')&&_gasIsTraxens(r);} },
    { label:'DM ( PENDING FOR REPAIR) GRADE B',  type:'sub',   f:function(r){return _gasIsDM(r)&&_gasIsGrade(r,'B');} },
    { label:'DM (AWAITING APPROVAL) GRADE B',    type:'sub',   f:function(r){return _gasIsWA(r)&&_gasIsGrade(r,'B');} },
    { label:'Including Smart Containers (DM)',   type:'italic', f:function(r){return (_gasIsDM(r)||_gasIsWA(r))&&_gasIsGrade(r,'B')&&_gasIsTraxens(r);} },
    { label:'', type:'separator', f:null },
    { label:'TOTAL GRADE C',                     type:'total',  f:function(r){return (_gasIsAV(r)||_gasIsDM(r)||_gasIsWA(r))&&_gasIsGrade(r,'C');} },
    { label:'AV GRADE C',                        type:'sub',    f:function(r){return _gasIsAV(r)&&_gasIsGrade(r,'C');} },
    { label:'Including Smart Containers (AV)',   type:'italic', f:function(r){return _gasIsAV(r)&&_gasIsGrade(r,'C')&&_gasIsTraxens(r);} },
    { label:'DM ( PENDING FOR REPAIR) GRADE C',  type:'sub',   f:function(r){return _gasIsDM(r)&&_gasIsGrade(r,'C');} },
    { label:'DM (AWAITING APPROVAL) GRADE C',    type:'sub',   f:function(r){return _gasIsWA(r)&&_gasIsGrade(r,'C');} },
    { label:'Including Smart Containers (DM)',   type:'italic', f:function(r){return (_gasIsDM(r)||_gasIsWA(r))&&_gasIsGrade(r,'C')&&_gasIsTraxens(r);} },
    { label:'', type:'separator', f:null },
    { label:'SELL',                              type:'plain',  f:function(r){return _gasIsSELL(r);} },
    { label:'OFH',                               type:'plain',  f:function(r){return _gasIsOFH(r);} },
    { label:'', type:'separator', f:null },
    { label:'REEFER ONLY : SELECTED FOR NOR (AV)', type:'plain', f:function(r){return _gasIsAV(r)&&_gasIsReefer(r);} },
    { label:'REEFER ONLY : SELECTED FOR NOR (DM)', type:'plain', f:function(r){return (_gasIsDM(r)||_gasIsWA(r))&&_gasIsReefer(r);} },
    { label:'', type:'separator', f:null },
    { label:'TOTAL', type:'total', f:function(r){return _gasIsAV(r)||_gasIsDM(r)||_gasIsWA(r)||_gasIsSELL(r)||_gasIsOFH(r)||(_gastt(r)==='DM'&&_gasIsGrade(r,'U'));} },
  ];
}

function _gasCalcRow(data, rowDef) {
  var counts = {};
  GAS_INV_SIZES.forEach(function(s){ counts[s]=0; });
  var totalUnits=0, totalTeus=0;
  data.forEach(function(r){
    if (!rowDef.f(r)) return;
    var raw = r.size_type || r.size_type_iso || '';
    var s = _gasNormSize(raw);
    if (counts.hasOwnProperty(s)) counts[s]++;
    totalUnits++;
    totalTeus += _gasTeu(s);
  });
  return { counts:counts, totalUnits:totalUnits, totalTeus:totalTeus };
}

// Build HTML body — bảng cross-tab giống màn hình app
function _buildInvHtmlBody(data, dateStr) {
  var INV_ROWS = _gasGetInvRows();
  var SIZES = GAS_INV_SIZES;

  // Style constants
  var thStyle   = 'padding:5px 7px;border:1px solid #d1d5db;background:#ffff00;color:#000;font-weight:700;text-align:center;white-space:nowrap;font-size:11px';
  var thLabel   = 'padding:5px 8px;border:1px solid #d1d5db;background:#ffff00;color:#000;font-weight:700;text-align:left;font-size:11px;min-width:220px';
  var tdBase    = 'padding:4px 7px;border:1px solid #d1d5db;text-align:center;font-size:11px;white-space:nowrap';
  var tdLabelB  = 'padding:4px 8px;border:1px solid #d1d5db;text-align:left;font-size:11px;font-weight:700;background:#fffde7';
  var tdLabelS  = 'padding:4px 8px;border:1px solid #d1d5db;text-align:left;font-size:11px';
  var tdLabelI  = 'padding:4px 8px;border:1px solid #d1d5db;text-align:left;font-size:11px;font-style:italic;color:#4a5568';
  var tdTotalB  = 'padding:4px 7px;border:1px solid #d1d5db;text-align:center;font-size:11px;font-weight:700;background:#fffde7';
  var tdSep     = 'padding:3px;border:1px solid #e2e8f0;background:#f1f5f9';
  var dash      = '<span style="color:#9ca3af">-</span>';

  var html = '<div style="font-family:Arial,sans-serif;font-size:12px;color:#1a202c">'
    + '<h2 style="color:#1e40af;margin-bottom:2px">MSC Empty Container Inventory</h2>'
    + '<p style="color:#6b7280;margin-top:0;font-size:12px">ICD Thạnh Phước &nbsp;|&nbsp; Báo cáo ngày <strong>' + dateStr + '</strong></p>'
    + '<hr style="border:none;border-top:2px solid #e5e7eb;margin:10px 0">'
    + '<table style="border-collapse:collapse;font-size:11px">'
    + '<thead><tr>'
    + '<th style="' + thLabel + '">ICD THANH PHUOC</th>';

  SIZES.forEach(function(s){
    html += '<th style="' + thStyle + '">' + s + '</th>';
  });
  html += '<th style="' + thStyle + '">Total Units</th>'
        + '<th style="' + thStyle + '">Total TEUs</th>'
        + '<th style="' + thStyle + '">TRAXENS Devices</th>'
        + '</tr></thead><tbody>';

  // Tách blocks (dùng rowspan cho cột TRAXENS)
  var blocks = [], cur = [];
  INV_ROWS.forEach(function(r){
    if (r.type==='separator'){ if(cur.length) blocks.push(cur); cur=[]; }
    else cur.push(r);
  });
  if (cur.length) blocks.push(cur);

  blocks.forEach(function(block){
    var blockSize = block.length;
    block.forEach(function(rowDef, bi){
      var res = _gasCalcRow(data, rowDef);
      var isTotal  = rowDef.type==='total';
      var isItalic = rowDef.type==='italic';
      var labelTd  = isTotal ? tdLabelB : (isItalic ? tdLabelI : tdLabelS);
      var numTd    = isTotal ? tdTotalB : tdBase + ';background:#fff';

      html += '<tr><td style="' + labelTd + '">' + rowDef.label + '</td>';
      SIZES.forEach(function(s){
        var v = res.counts[s];
        html += '<td style="' + numTd + '">' + (v > 0 ? v : dash) + '</td>';
      });
      html += '<td style="' + numTd + '">' + (res.totalUnits > 0 ? res.totalUnits : dash) + '</td>';
      html += '<td style="' + numTd + '">' + (res.totalTeus  > 0 ? res.totalTeus  : dash) + '</td>';
      // TRAXENS: chỉ render ô đầu block với rowspan
      if (bi === 0) {
        html += '<td rowspan="' + blockSize + '" style="' + tdBase + ';background:#fff;vertical-align:middle"></td>';
      }
      html += '</tr>';
    });
    // Separator row
    html += '<tr><td colspan="' + (SIZES.length + 3) + '" style="' + tdSep + '"></td>'
          + '<td style="' + tdSep + '"></td></tr>';
  });

  html += '</tbody></table>'
        + '<br><hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0">'
        + '<table style="font-size:13px;color:#374151;line-height:1.8">'
        + '<tr><td>Thanks &amp; Best regards,</td></tr>'
        + '<tr><td><strong style="font-size:14px;color:#111">THANH PHUOC PORT</strong></td></tr>'
        + '<tr><td style="color:#6b7280">Add: Số 207, Đường ĐT 747A, Tổ 1, Khu Phố Tân Lương, Phường Tân Khánh, Thành Phố Hồ Chí Minh, Việt Nam.</td></tr>'
        + '<tr><td style="color:#6b7280">Phone &amp; Fax: (0274)3849999 &nbsp;|&nbsp; Email: <a href="mailto:info@thanhphuocport.com.vn" style="color:#374151">info@thanhphuocport.com.vn</a></td></tr>'
        + '</table>'
        + '<br><p style="color:#9ca3af;font-size:10px">Email tự động từ hệ thống MNR Estimate — Cảng Thạnh Phước</p>'
        + '</div>';
  return html;
}

// Build file Excel đính kèm — cùng format bảng cross-tab
// Build file Excel đính kèm — tạo Sheets tạm rồi export xlsx qua UrlFetchApp
function _buildInvExcelBlob(data, dateStr) {
  var INV_ROWS = _gasGetInvRows();
  var SIZES    = GAS_INV_SIZES;

  // Tạo Sheets tạm
  var tmpSS = SpreadsheetApp.create('_tmp_msc_inv_' + new Date().getTime());
  var ws    = tmpSS.getActiveSheet();
  ws.setName('MSC Inventory');

  // Header row
  var headerRow = ['ICD THANH PHUOC'].concat(SIZES).concat(['Total Units','Total TEUs','TRAXENS Devices']);
  ws.appendRow(headerRow);
  var hRange = ws.getRange(1, 1, 1, headerRow.length);
  hRange.setBackground('#FFFF00').setFontWeight('bold').setHorizontalAlignment('center').setFontSize(10);
  hRange.getCell(1,1).setHorizontalAlignment('left');

  // Data rows
  var excelRow = 2;
  var blocks = [], cur = [];
  INV_ROWS.forEach(function(r){
    if (r.type==='separator'){ if(cur.length) blocks.push(cur); cur=[]; }
    else cur.push(r);
  });
  if (cur.length) blocks.push(cur);

  blocks.forEach(function(block){
    var blockStartRow = excelRow;
    var blockSize = block.length;
    block.forEach(function(rowDef, bi){
      var res     = _gasCalcRow(data, rowDef);
      var isTotal = rowDef.type==='total';
      var isItalic= rowDef.type==='italic';
      var rowData = [rowDef.label];
      SIZES.forEach(function(s){ rowData.push(res.counts[s] || null); });
      rowData.push(res.totalUnits || null);
      rowData.push(res.totalTeus  || null);
      rowData.push(null);
      ws.appendRow(rowData);
      var rowRange = ws.getRange(excelRow, 1, 1, headerRow.length);
      rowRange.setBackground(isTotal ? '#FFFDE7' : '#FFFFFF').setFontSize(10);
      if (isTotal)  rowRange.setFontWeight('bold');
      if (isItalic) { rowRange.setFontStyle('italic'); rowRange.setFontColor('#4a5568'); }
      ws.getRange(excelRow, 1).setHorizontalAlignment('left');
      ws.getRange(excelRow, 2, 1, headerRow.length-1).setHorizontalAlignment('center');
      for (var c=2; c<headerRow.length; c++) {
        var cell = ws.getRange(excelRow, c);
        if (cell.getValue() === null) cell.setValue('-');
      }
      rowRange.setBorder(true,true,true,true,true,true,'#d1d5db',SpreadsheetApp.BorderStyle.SOLID);
      ws.setRowHeight(excelRow, 18);
      excelRow++;
    });
    if (blockSize > 1) ws.getRange(blockStartRow, headerRow.length, blockSize, 1).merge();
    ws.getRange(blockStartRow, headerRow.length).setBackground('#FFFFFF');
    ws.appendRow(Array(headerRow.length).fill(''));
    excelRow++;
  });

  ws.setColumnWidth(1, 260);
  for (var c=2; c<=headerRow.length; c++) ws.setColumnWidth(c, 52);
  ws.setColumnWidth(headerRow.length-2, 80);
  ws.setColumnWidth(headerRow.length-1, 80);
  ws.setColumnWidth(headerRow.length,   90);

  ws.insertRowBefore(1);
  ws.getRange(1,1,1,headerRow.length).merge()
    .setValue('MSC Inventory Report — ICD Thạnh Phước — ' + dateStr)
    .setFontWeight('bold').setFontSize(12)
    .setBackground('#1e40af').setFontColor('#ffffff');
  ws.setRowHeight(1, 28);
  ws.setRowHeight(2, 20); // header row (yellow)

  SpreadsheetApp.flush();
  Utilities.sleep(2000);

  // Export xlsx qua UrlFetchApp + OAuth token
  // (cần scope script.external_request trong appsscript.json)
  var tmpId  = tmpSS.getId();
  var token  = ScriptApp.getOAuthToken();
  var url    = 'https://docs.google.com/spreadsheets/d/' + tmpId + '/export?format=xlsx&id=' + tmpId;
  var resultBlob = null;
  try {
    var resp = UrlFetchApp.fetch(url, {
      headers: { Authorization: 'Bearer ' + token },
      muteHttpExceptions: true
    });
    if (resp.getResponseCode() === 200) {
      var fileName = 'MSC_Inventory_' + dateStr.replace(/\//g,'') + '.xlsx';
      resultBlob = resp.getBlob().copyBlob().setName(fileName)
        .setContentType('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    } else {
      Logger.log('[MSC Mail] Export xlsx HTTP ' + resp.getResponseCode() + ': ' + resp.getContentText().substring(0,200));
    }
  } catch(e) {
    Logger.log('[MSC Mail] Export xlsx lỗi: ' + e.toString());
  }

  try { DriveApp.getFileById(tmpId).setTrashed(true); } catch(e) {}
  return resultBlob;
}

// Gửi email MSC — body = bảng cross-tab, attachment = Excel cùng format
// Gọi sau autoImportStock() thành công, CHỈ lúc trigger 9h
function sendMscInventoryEmail() {
  var cfg     = getConfig();
  var toEmail = cfg['MSC_EMAIL'] || '';
  if (!toEmail) {
    Logger.log('[MSC Mail] Bỏ qua: không tìm thấy MSC_EMAIL trong sheet config');
    return;
  }
  var ccEmail  = cfg['MSC_EMAIL_CC']      || '';
  var fromAddr = 'mnrdry@thanhphuocport.com.vn';
  var fromName = 'THANH PHUOC PORT';

  // Lấy data — gọi sau _delCache() nên đọc thẳng sheet mới nhất
  var stockRes = getEmtyStock();
  var allData  = (stockRes && stockRes.data) ? stockRes.data : [];
  // Chỉ MSC
  var data = allData.filter(function(r){
    return String(r.carrier||'').toUpperCase().indexOf('MSC') >= 0;
  });

  var tz      = Session.getScriptTimeZone();
  var now     = new Date();
  var dateStr = Utilities.formatDate(now, tz, 'dd/MM/yyyy');
  var subject = cfg['MSC_EMAIL_SUBJECT'] ||
    ('MSC Empty Container Inventory — ICD Thạnh Phước — ' + dateStr);

  var htmlBody    = _buildInvHtmlBody(data, dateStr);
  var excelBlob   = null;
  try { excelBlob = _buildInvExcelBlob(data, dateStr); } catch(e) {
    Logger.log('[MSC Mail] Lỗi tạo Excel: ' + e.toString());
  }

  var mailOpts = { htmlBody: htmlBody, name: fromName, from: fromAddr };
  if (ccEmail) mailOpts.cc = ccEmail;
  if (excelBlob) mailOpts.attachments = [excelBlob];

  try {
    GmailApp.sendEmail(toEmail, subject, '', mailOpts);
    Logger.log('[MSC Mail] Gửi thành công → ' + toEmail + ' | ' + data.length + ' containers');
  } catch(e) {
    Logger.log('[MSC Mail] Lỗi gửi mail: ' + e.toString());
  }
}

// ===================== WAREHOUSE REPORT =====================
var WAREHOUSE_ID = '1wihWjzpCaQMJ9G1nw-4mAz3LJZmJf6W0eT0ZQ1e221U';

function getWarehouseReport() {
  try {
    var tz = Session.getScriptTimeZone();

    // ── 1. Đọc AppSheet: DM_VatTu, Phieu_Kho, Chi_Tiet_Phieu ──
    var wss = SpreadsheetApp.openById(WAREHOUSE_ID);

    // Danh mục vật tư
    var dmSheet  = wss.getSheetByName('DM_VatTu');
    var dmData   = dmSheet.getDataRange().getValues();
    var vtMap    = {}; // ma → {ten, dv, ton_min, ton_dau}
    for (var i = 1; i < dmData.length; i++) {
      var r = dmData[i];
      var ma = String(r[0]||'').trim();
      if (!ma) continue;
      var tonMin = parseFloat(r[5]) || 0;
      var tonDau = parseFloat(r[6]) || 0;
      vtMap[ma] = { ten: r[1], dv: r[3], ton_min: tonMin, ton_dau: tonDau, nhap: 0, xuat: 0 };
    }

    // Phiếu kho → map mã phiếu → loại GD + tháng
    var pkSheet = wss.getSheetByName('Phieu_Kho');
    var pkData  = pkSheet.getDataRange().getValues();
    var phieuMap = {};
    for (var i = 1; i < pkData.length; i++) {
      var r = pkData[i];
      var ma = String(r[0]||'').trim();
      var ngay = r[1];
      var loai = String(r[2]||'').trim();
      if (!ma || !ngay) continue;
      var d = (ngay instanceof Date) ? ngay : new Date(ngay);
      var monthKey = d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0');
      phieuMap[ma] = { loai: loai, monthKey: monthKey };
    }

    // Chi tiết phiếu → tính nhập/xuất theo tháng và tổng tồn
    var ctSheet = wss.getSheetByName('Chi_Tiet_Phieu');
    var ctData  = ctSheet.getDataRange().getValues();
    var monthlyNhap = {}, monthlyXuat = {}, monthlyTienNhap = {}, monthlyTienXuat = {};

    for (var i = 1; i < ctData.length; i++) {
      var r     = ctData[i];
      var maP   = String(r[1]||'').trim();
      var maVT  = String(r[2]||'').trim();
      var sl    = parseFloat(r[3]) || 0;
      var tt    = parseFloat(r[5]) || 0;
      if (!maP || !maVT) continue;
      var p = phieuMap[maP];
      if (!p) continue;
      var mk = p.monthKey;
      if (!monthlyNhap[mk]) { monthlyNhap[mk]=0; monthlyXuat[mk]=0; monthlyTienNhap[mk]=0; monthlyTienXuat[mk]=0; }
      if (p.loai.indexOf('NHẬP') >= 0) {
        monthlyNhap[mk]     += sl;
        monthlyTienNhap[mk] += tt;
        if (vtMap[maVT]) vtMap[maVT].nhap += sl;
      } else if (p.loai.indexOf('XUẤT') >= 0) {
        monthlyXuat[mk]     += sl;
        monthlyTienXuat[mk] += tt;
        if (vtMap[maVT]) vtMap[maVT].xuat += sl;
      }
    }

    // Tính tồn cuối tháng tích lũy
    var allMonths = Object.keys(monthlyNhap).sort();
    var tonCuoi = {}, runTon = 0;
    allMonths.forEach(function(mk) {
      runTon += (monthlyNhap[mk]||0) - (monthlyXuat[mk]||0);
      tonCuoi[mk] = runTon;
    });

    // Tình trạng tồn kho
    var conHang = 0, sapHet = 0, hetHang = 0;
    Object.keys(vtMap).forEach(function(ma) {
      var d = vtMap[ma];
      var ton = d.ton_dau + d.nhap - d.xuat;
      if (ton <= 0) hetHang++;
      else if (d.ton_min > 0 && ton < d.ton_min) sapHet++;
      else conHang++;
    });

    // Top 10 vật tư xuất nhiều nhất
    var vtXuat = [];
    Object.keys(vtMap).forEach(function(ma) {
      if (vtMap[ma].xuat > 0) vtXuat.push({ ma: ma, ten: String(vtMap[ma].ten||''), sl: vtMap[ma].xuat });
    });
    vtXuat.sort(function(a,b){ return b.sl - a.sl; });
    var top10 = vtXuat.slice(0, 10);

    // ── 2. Doanh thu MNR tính trên frontend từ state.tracking ──
    // (không cần đọc summary ở đây nữa)
    var monthlyDT = {};

    // ── 3. Build response ──
    // Merge months từ cả AppSheet và summary để không bỏ sót
    var allMonthsSet = {};
    allMonths.forEach(function(m){ allMonthsSet[m] = true; });
    Object.keys(monthlyDT).forEach(function(m){ allMonthsSet[m] = true; });
    var months = Object.keys(allMonthsSet).sort();

    // tien_ton: tồn cuối tháng tính bằng tiền (tích lũy tien_nhap - tien_xuat)
    var tienTonMap = {}, runTienTon = 0;
    months.forEach(function(mk) {
      runTienTon += (monthlyTienNhap[mk]||0) - (monthlyTienXuat[mk]||0);
      tienTonMap[mk] = runTienTon;
    });

    // vt_list: danh sách vật tư có xuất/nhập để làm filter
    var vtList = Object.keys(vtMap)
      .filter(function(ma){ return vtMap[ma].nhap > 0 || vtMap[ma].xuat > 0; })
      .sort()
      .map(function(ma){ return { ma: ma, ten: String(vtMap[ma].ten||'') }; });

    // vt_monthly: nhập/xuất/tồn theo tháng cho từng vật tư (chỉ top 50 để giới hạn size)
    var vtMonthly = {};
    var vtXuatAll = Object.keys(vtMap).filter(function(ma){ return vtMap[ma].xuat > 0; });
    vtXuatAll.sort(function(a,b){ return vtMap[b].xuat - vtMap[a].xuat; });
    var topVTs = vtXuatAll.slice(0, 100);

    // Cần tính nhập/xuất từng vật tư theo tháng — dùng lại ctData
    var vtMthNhap = {}, vtMthXuat = {};
    for (var i = 1; i < ctData.length; i++) {
      var r    = ctData[i];
      var maP  = String(r[1]||'').trim();
      var maVT = String(r[2]||'').trim();
      var sl   = parseFloat(r[3]) || 0;
      if (!maP || !maVT || topVTs.indexOf(maVT) < 0) continue;
      var p = phieuMap[maP];
      if (!p) continue;
      var mk = p.monthKey;
      if (!vtMthNhap[maVT]) vtMthNhap[maVT] = {};
      if (!vtMthXuat[maVT]) vtMthXuat[maVT] = {};
      if (p.loai.indexOf('NHẬP') >= 0) vtMthNhap[maVT][mk] = (vtMthNhap[maVT][mk]||0) + sl;
      else if (p.loai.indexOf('XUẤT') >= 0) vtMthXuat[maVT][mk] = (vtMthXuat[maVT][mk]||0) + sl;
    }

    topVTs.forEach(function(ma) {
      var runTon = 0;
      vtMonthly[ma] = {
        months: months,
        nhap: months.map(function(mk){ return Math.round(vtMthNhap[ma]&&vtMthNhap[ma][mk]||0); }),
        xuat: months.map(function(mk){ return Math.round(vtMthXuat[ma]&&vtMthXuat[ma][mk]||0); }),
        ton:  months.map(function(mk){
          runTon += (vtMthNhap[ma]&&vtMthNhap[ma][mk]||0) - (vtMthXuat[ma]&&vtMthXuat[ma][mk]||0);
          return Math.round(runTon);
        })
      };
    });

    // top10_monthly: dùng để filter theo tháng đang xem
    var top10Monthly = [];
    months.forEach(function(mk) {
      Object.keys(vtMthXuat).forEach(function(ma) {
        var sl = vtMthXuat[ma][mk] || 0;
        if (sl > 0) top10Monthly.push({ mk: mk, ma: ma, ten: String(vtMap[ma]&&vtMap[ma].ten||''), sl: sl });
      });
    });

    return {
      success: true,
      months:  months,
      nhap:    months.map(function(m){ return Math.round(monthlyNhap[m]||0); }),
      xuat:    months.map(function(m){ return Math.round(monthlyXuat[m]||0); }),
      ton:     months.map(function(m){ return Math.round(tonCuoi[m]||0); }),
      tien_nhap: months.map(function(m){ return Math.round(monthlyTienNhap[m]||0); }),
      tien_xuat: months.map(function(m){ return Math.round(monthlyTienXuat[m]||0); }),
      tien_ton:  months.map(function(m){ return Math.round(tienTonMap[m]||0); }),
      doanh_thu: months.map(function(m){ return Math.round((monthlyDT[m]||0)*100)/100; }),
      ton_status: { con_hang: conHang, sap_het: sapHet, het_hang: hetHang, tong: Object.keys(vtMap).length },
      top10: top10,
      vt_list: vtList,
      vt_monthly: vtMonthly,
      top10_monthly: top10Monthly
    };
  } catch(e) {
    return { success: false, error: e.toString() };
  }
}

// ===================== ACTIVITY LOG =====================
var LOG_SHEET = 'activity_log';
var LOG_RETENTION_DAYS = 90;

function writeLog(username, action, container_no, detail) {
  try {
    var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    var sheet = ss.getSheetByName(LOG_SHEET);
    if (!sheet) {
      sheet = ss.insertSheet(LOG_SHEET);
      sheet.appendRow(['timestamp', 'username', 'action', 'container_no', 'detail']);
      sheet.getRange(1, 1, 1, 5).setFontWeight('bold').setBackground('#F5C842');
      sheet.setFrozenRows(1);
    }
    var now = new Date();
    var ts = Utilities.formatDate(now, Session.getScriptTimeZone(), 'dd/MM/yyyy HH:mm:ss');
    sheet.appendRow([ts, username || '', action || '', container_no || '', detail || '']);

    // Xoá entries cũ hơn 90 ngày — chỉ chạy 1 lần/ngày để tránh chậm
    var today = Utilities.formatDate(now, Session.getScriptTimeZone(), 'yyyy-MM-dd');
    var lastCleanup = PropertiesService.getScriptProperties().getProperty('log_cleanup_date');
    if (lastCleanup !== today) {
      var cutoff = new Date(now.getTime() - LOG_RETENTION_DAYS * 24 * 3600 * 1000);
      var logData = sheet.getDataRange().getValues();
      var toDelete = [];
      for (var i = logData.length - 1; i >= 1; i--) {
        var parts = String(logData[i][0]).split(/[\/\s:]/);
        if (parts.length < 3) continue;
        var rowDate = new Date(parts[2], parts[1]-1, parts[0]);
        if (rowDate < cutoff) toDelete.push(i + 1);
      }
      toDelete.forEach(function(r) { sheet.deleteRow(r); });
      PropertiesService.getScriptProperties().setProperty('log_cleanup_date', today);
    }
  } catch(e) {
    Logger.log('[writeLog] Error: ' + e.toString());
  }
}

function getActivityLog(params) {
  try {
    var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    var sheet = ss.getSheetByName(LOG_SHEET);
    if (!sheet) { Logger.log('[actlog] sheet not found'); return { success: true, data: [] }; }
    var lastRow = sheet.getLastRow();
    Logger.log('[actlog] lastRow=' + lastRow);
    if (lastRow <= 1) return { success: true, data: [] };
    var data = sheet.getRange(1, 1, lastRow, 5).getDisplayValues();
    Logger.log('[actlog] rows read=' + data.length + ' sample=' + JSON.stringify(data[1]||[]));

    var rows = data.slice(1).filter(function(r){ return r[0] || r[1]; }).map(function(r) {
      return {
        timestamp:    String(r[0] || ''),
        username:     String(r[1] || ''),
        action:       String(r[2] || ''),
        container_no: String(r[3] || ''),
        detail:       String(r[4] || '')
      };
    }).reverse();

    // Loại trừ 'action' và '_t' khỏi filter
    var filterUser   = params && params.filter_user   ? params.filter_user.toLowerCase() : '';
    var filterAction = params && params.filter_action ? params.filter_action : '';
    if (filterUser)   rows = rows.filter(function(r){ return r.username.toLowerCase().indexOf(filterUser) >= 0; });
    if (filterAction) rows = rows.filter(function(r){ return r.action === filterAction; });

    Logger.log('[actlog] returning ' + rows.length + ' rows');
    return { success: true, data: rows };
  } catch(e) {
    Logger.log('[actlog] error: ' + e.toString());
    return { success: false, error: e.toString() };
  }
}

// ===================== SETUP TRIGGER =====================
// Chạy function này 1 lần để tạo trigger
function setupAutoImportTrigger() {
  // Xoá trigger cũ nếu có
  ScriptApp.getProjectTriggers().forEach(function(t) {
    var fn = t.getHandlerFunction();
    if (fn === 'autoImportStock' || fn === 'sendMscInventoryEmail') {
      ScriptApp.deleteTrigger(t);
    }
  });

  // autoImportStock: 8:30, 15:00, 20:00
  // GAS timeBased chỉ set được giờ chẵn → dùng atHour().nearMinute() để set 8:30
  ScriptApp.newTrigger('autoImportStock').timeBased().everyDays(1).atHour(8).nearMinute(30).create();
  ScriptApp.newTrigger('autoImportStock').timeBased().everyDays(1).atHour(15).nearMinute(0).create();
  ScriptApp.newTrigger('autoImportStock').timeBased().everyDays(1).atHour(20).nearMinute(0).create();

  // sendMscInventoryEmail: 8:45 (trigger riêng, độc lập với autoImportStock)
  ScriptApp.newTrigger('sendMscInventoryEmail').timeBased().everyDays(1).atHour(8).nearMinute(45).create();

  Logger.log('Triggers đã tạo: autoImportStock 8:30/15:00/20:00 | sendMscInventoryEmail 8:45');
}
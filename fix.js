const fs = require('fs');
const path = require('path');
const scriptPath = path.join(__dirname, 'script.js');
let code = fs.readFileSync(scriptPath, 'utf8');

// Replace ??
code = code.replace(/targetScreen\?\.availLeft \?\? targetScreen\?\.left \?\? window\.screenX \+ 40/g, '(targetScreen && targetScreen.availLeft != null ? targetScreen.availLeft : (targetScreen && targetScreen.left != null ? targetScreen.left : window.screenX + 40))');
code = code.replace(/targetScreen\?\.availTop \?\? targetScreen\?\.top \?\? window\.screenY \+ 40/g, '(targetScreen && targetScreen.availTop != null ? targetScreen.availTop : (targetScreen && targetScreen.top != null ? targetScreen.top : window.screenY + 40))');
code = code.replace(/targetScreen\?\.availWidth \?\? targetScreen\?\.width \?\? 1200/g, '(targetScreen && targetScreen.availWidth != null ? targetScreen.availWidth : (targetScreen && targetScreen.width != null ? targetScreen.width : 1200))');
code = code.replace(/targetScreen\?\.availHeight \?\? targetScreen\?\.height \?\? 900/g, '(targetScreen && targetScreen.availHeight != null ? targetScreen.availHeight : (targetScreen && targetScreen.height != null ? targetScreen.height : 900))');

// Replace ?.
code = code.replace(/settings\?\.storeName/g, '(settings && settings.storeName)');
code = code.replace(/settings\?\.storeAddress/g, '(settings && settings.storeAddress)');
code = code.replace(/currentUser\?\.name/g, '(currentUser && currentUser.name)');
code = code.replace(/currentUser\?\.id/g, '(currentUser && currentUser.id)');
code = code.replace(/screenDetails\?\.screens/g, '(screenDetails && screenDetails.screens)');
code = code.replace(/data\.user\.email\?\.split\('@'\)\[0\]/g, "((data && data.user && typeof data.user.email === 'string' && data.user.email) ? data.user.email.split('@')[0] : undefined)");
code = code.replace(/session\.user\.email\?\.split\('@'\)\[0\]/g, "((session && session.user && typeof session.user.email === 'string' && session.user.email) ? session.user.email.split('@')[0] : undefined)");
code = code.replace(/data\.user\.user_metadata\?\.name/g, '(data && data.user && data.user.user_metadata && data.user.user_metadata.name)');
code = code.replace(/data\.user\.user_metadata\?\.role/g, '(data && data.user && data.user.user_metadata && data.user.user_metadata.role)');
code = code.replace(/session\.user\.user_metadata\?\.name/g, '(session && session.user && session.user.user_metadata && session.user.user_metadata.name)');
code = code.replace(/session\.user\.user_metadata\?\.role/g, '(session && session.user && session.user.user_metadata && session.user.user_metadata.role)');
code = code.replace(/localSale\?\.receiptnumber/g, '(localSale && localSale.receiptnumber)');
code = code.replace(/localSale\?\.receiptNumber/g, '(localSale && localSale.receiptNumber)');
fs.writeFileSync(scriptPath, code);
console.log('Replaced custom optional chaining and nullish coalescing.');

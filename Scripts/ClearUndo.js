var WM_USER = 0x0400;
var AEM_EMPTYUNDOBUFFER = WM_USER + 2055;
var hEditWnd = AkelPad.GetEditWnd();
AkelPad.SendMessage(hEditWnd, AEM_EMPTYUNDOBUFFER, 0, 0);

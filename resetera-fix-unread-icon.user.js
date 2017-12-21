// ==UserScript==
// @name        ResetEra Fix Unread Icon
// @description Repositions the jump to unread post icon and makes it easier to hit on mobile.
// @namespace   com.toadking.resetera.unreadicon
// @version     0.1
// @grant       none
// @include     https://www.resetera.com/forums/*
// @run-at      document-start
// ==/UserScript==

const ICON_STYLE = `
.LoggedIn body .discussionListItem .unreadLink {
  width: auto;
  height: auto;
  left: 6px;
  top: 4px;
  padding: 5px;
}
`;

let style = document.createElement("style");
style.textContent = ICON_STYLE;
document.head.appendChild(style);

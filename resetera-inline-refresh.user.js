// ==UserScript==
// @name        ResetEra Inline Refresh
// @description Load new posts in a topic without refreshing the whole page
// @namespace   com.toadking.resetera.inlinerefresh
// @version     2.0
// @grant       none
// @include     https://www.resetera.com/threads/*
// @run-at      document-end
// ==/UserScript==

const REFRESH_CLASS = "refreshBtn";
const SPINNER_CLASS = "spin2win";
const RELOAD_ICON_SELECTOR = `.${REFRESH_CLASS}`;
const MESSAGE_LIST_SELECTOR = '[data-lb-id^="thread-"] .block-body';
const MESSAGE_SELECTOR = `${MESSAGE_LIST_SELECTOR} > .message`;
const PAGENAV_SELECTOR = ".pageNavWrapper";
const PAGENAV_GROUP_SELECTOR = ".block-outer:not(.js-threadStatusField)";
const OPPOSITE_CLASS = `${PAGENAV_GROUP_SELECTOR} .block-outer-opposite`;
const BUTTON_GROUP_CLASS = "buttonGroup";
const BUTTON_GROUP_CLASS_SELECTOR = `.${BUTTON_GROUP_CLASS}`;
const BUTTON_LINK_CLASSES = ['button--link', 'button', 'rippleButton'];
const XENFORO_ACTIVATE_SCRIPT = "XF.activate(document);";
const REFRESH_KEY = "r";

const SPINNER_CSS = `
.${REFRESH_CLASS} {
	font-size: 18px;
}

.${REFRESH_CLASS}::before {
  display: inline-block;
  font: normal normal normal 18px/1 "Material Design Icons";
  line-height: 1;
  font-size: inherit;
  text-rendering: auto;
  line-height: 1;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  transform: translate(0, 0);
  width: auto !important;
  content: '\\f06a';
}

.${SPINNER_CLASS} {
  animation-name: spin2win;
  animation-duration: 1s;
  animation-iteration-count: infinite;
  animation-timing-function: linear;
}

@keyframes spin2win {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}
`;

let doing_refresh = false;

function Insert_New_Posts(req) {
  doing_refresh = false;
  
  if (req.responseXML != null) {
    const fetched_posts = req.responseXML.querySelectorAll(MESSAGE_SELECTOR);
    const existing_post_ids = Array.from(document.querySelectorAll(MESSAGE_SELECTOR)).map((m) => m.id);
    const message_list = document.querySelector(MESSAGE_LIST_SELECTOR);

    // only add posts that are not already on the page
    for (let new_post of fetched_posts) {
      if (!existing_post_ids.includes(new_post.id)) {
        message_list.appendChild(new_post);
      }
    }

    // update pagenav
    const new_pagenav = req.responseXML.querySelector(PAGENAV_SELECTOR);

    // there are two pagenavs on a page but they both have identical contents so just reuse this one on both
    const existing_pagenavgroups = document.querySelectorAll(PAGENAV_GROUP_SELECTOR);

    if (new_pagenav != null) {
      for (let group of existing_pagenavgroups) {
        const new_pagenav_dup = new_pagenav.cloneNode(true);
        const pagenav = group.querySelector(PAGENAV_SELECTOR);

        if (pagenav === null) {
          group.appendChild(new_pagenav_dup);
        } else {
          pagenav.replaceWith(new_pagenav_dup);
        }
      }
    }

    // activate new handlers for new content. uses eval so it runs in the page context. fixes dynamic stuff like multiquotes on new posts/scrolling navbar/other stuff
    window.eval(XENFORO_ACTIVATE_SCRIPT);
  }

  const refresh_icons = document.querySelectorAll(RELOAD_ICON_SELECTOR);

  for (let icon of refresh_icons) {
    icon.classList.remove(SPINNER_CLASS);
  }
}

function Inline_Reload(e) {
  e.preventDefault();

  if (!doing_refresh) {
    doing_refresh = true;
    const refresh_icons = document.querySelectorAll(RELOAD_ICON_SELECTOR);

    for (let icon of refresh_icons) {
      icon.classList.add(SPINNER_CLASS);
    }

    const req = new XMLHttpRequest();
    req.addEventListener("loadend", Insert_New_Posts.bind(null, req));
    req.open("GET", window.location.href.split("#")[0]);
    req.responseType = "document";
    req.send();
  }
}

function Handle_Reload_Keypress(e) {
  const target = e.target;
  const nodeName = target.nodeName.toUpperCase();

  // skip it if we're typing something
  if (target.isContentEditable || nodeName === "TEXTAREA" || nodeName === "INPUT") {
    return;
  }

  // skip repeating keys
  if (e.repeat) {
    return;
  }

  // skip if we're holding modifiers
  if (e.altKey || e.ctrlKey || e.shiftKey || e.metaKey) {
    return;
  }

  if (e.key === REFRESH_KEY) {
    Inline_Reload(e);
  }
}

function Setup_Reload_Links(reload_links)
{
  for (let link of reload_links) {
    link.addEventListener("click", Inline_Reload, false);
    // set the onclick attribute so it doens't reload the page but still matches our selector
    link.setAttribute("onclick", "window.location.reload.name; return false;");
  }
}

const oppositeGroups = document.querySelectorAll(OPPOSITE_CLASS);

for (let group of oppositeGroups) {
  let btnGroup = group.querySelector(BUTTON_GROUP_CLASS_SELECTOR);
  
  if (btnGroup == null) {
    btnGroup = document.createElement('div');
    btnGroup.classList.add(BUTTON_GROUP_CLASS);
    group.appendChild(btnGroup);
  }
  
  const refreshLink = document.createElement('a');
  refreshLink.href = 'javascript:void(0);';
  refreshLink.classList.add.apply(refreshLink.classList, BUTTON_LINK_CLASSES);
  refreshLink.setAttribute('data-xf-init', 'tooltip');
  refreshLink.setAttribute('title', 'Inline Refresh');
	refreshLink.addEventListener("click", Inline_Reload, false);
  const refreshIcon = document.createElement('span');
  refreshIcon.classList.add(REFRESH_CLASS);
  refreshLink.appendChild(refreshIcon);
  btnGroup.appendChild(refreshLink);
}

const spinner_css_node = document.createElement("style");
spinner_css_node.textContent = SPINNER_CSS;
document.head.appendChild(spinner_css_node);

window.eval(XENFORO_ACTIVATE_SCRIPT);

// chrome doesn't set the repeat event property on keypress events, have to use keydown
document.addEventListener("keydown", Handle_Reload_Keypress, false);

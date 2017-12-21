// ==UserScript==
// @name        ResetEra Inline Refresh
// @description Load new posts in a topic without refreshing the whole page
// @namespace   com.toadking.resetera
// @version     0.4
// @grant       none
// @include     https://www.resetera.com/threads/*
// @run-at      document-end
// ==/UserScript==

const REFRESH_LINK_SELECTOR = 'a[href^="javascript:window.location.reload"]';
const RELOAD_ICON_SELECTOR = `${REFRESH_LINK_SELECTOR} .fa-refresh`;
const SPINNER_CLASS = "spin2win";
const MESSAGE_LIST_SELECTOR = "#messageList";
const MESSAGE_SELECTOR = `${MESSAGE_LIST_SELECTOR} > .message`;
const PAGENAV_SELECTOR = ".PageNav";
const PAGENAV_GROUP_SELECTOR = ".pageNavLinkGroup";
const HIGHLIGHT_SCRIPT_SIGNATURE = `$('.bbCodeQuote[data-author="`;
const XENFORO_ACTIVATE_SCRIPT = "XenForo.activate(document);";

const SPINNER_CSS = `
.${SPINNER_CLASS} {
  animation-name: spin2win;
  animation-duration: 1s;
  animation-iteration-count: infinite;
  animation-timing-function: linear;

  /* padding messes with transform, make it margin instead. also try to make the icon a perfect square so it rotates better */
  padding: 0.925px 0;
  margin-right: 4px;
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
  if (req.responseXML != null) {
    let fetched_posts = req.responseXML.querySelectorAll(MESSAGE_SELECTOR);
    let existing_post_ids = Array.from(document.querySelectorAll(MESSAGE_SELECTOR)).map((m) => m.id);
    let message_list = document.querySelector(MESSAGE_LIST_SELECTOR);

    // only add posts that are not already on the page
    for (let new_post of fetched_posts) {
      if (!existing_post_ids.includes(new_post.id)) {
        message_list.appendChild(new_post);
      }
    }

    // update pagenav
    let new_pagenav = req.responseXML.querySelector(PAGENAV_SELECTOR);

    // there are two pagenavs on a page but they both have identical contents so just reuse this one on both
    let existing_pagenavgroups = document.querySelectorAll(PAGENAV_GROUP_SELECTOR);

    if (new_pagenav != null) {
      for (let group of existing_pagenavgroups) {
        let new_pagenav_dup = new_pagenav.cloneNode(true);
        let pagenav = group.querySelector(PAGENAV_SELECTOR);

        if (pagenav === null) {
          group.appendChild(new_pagenav_dup);
        } else {
          pagenav.parentNode.replaceChild(new_pagenav_dup, pagenav);
        }
      }
    }

    // activate new handlers for new content. uses eval so it runs in the page context. fixes dynamic stuff like multiquotes on new posts/scrolling navbar/other stuff
    window.eval(XENFORO_ACTIVATE_SCRIPT);

    // apply the quote highlighting script again for new posts
    let page_scripts = document.querySelectorAll("script:not(:empty)");

    for (let script of page_scripts) {
      if (script.textContent.includes(HIGHLIGHT_SCRIPT_SIGNATURE)) {
        window.eval(script.textContent);
        break;
      }
    }
  }

  Load_Done();
}

function Load_Done() {
  doing_refresh = false;

  let refresh_icons = document.querySelectorAll(RELOAD_ICON_SELECTOR);

  for (let icon of refresh_icons) {
    icon.classList.remove(SPINNER_CLASS);
  }
}

function Inline_Reload(e) {
  e.preventDefault();

  if (!doing_refresh) {
    doing_refresh = true;
    let refresh_icons = document.querySelectorAll(RELOAD_ICON_SELECTOR);

    for (let icon of refresh_icons) {
      icon.classList.add(SPINNER_CLASS);
    }

    let req = new XMLHttpRequest();
    req.addEventListener("loadend", Insert_New_Posts.bind(null, req));
    req.open("GET", window.location.href.split("#")[0]);
    req.responseType = "document";
    req.send();
  }
}

let reload_links = document.querySelectorAll(REFRESH_LINK_SELECTOR);

if (reload_links.length > 0) {
  let spinner_css_node = document.createElement("style");
  spinner_css_node.textContent = SPINNER_CSS;
  document.head.appendChild(spinner_css_node);

  for (let link of reload_links) {
    link.addEventListener("click", Inline_Reload, false);
  }
}

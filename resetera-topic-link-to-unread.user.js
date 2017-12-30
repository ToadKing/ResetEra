// ==UserScript==
// @name        ResetEra Topic Link to Unread
// @description Makes the topic title link to the first unread post instead of the first post.
// @namespace   com.toadking.resetera.unreadlink
// @version     0.3
// @grant       none
// @include     https://www.resetera.com/forums/*
// @run-at      document-end
// ==/UserScript==

const TOPICS_SELECTOR = ".discussionListItems .discussionListItem";
const TOPIC_LINK_SELECTOR = ".title a:not(.unreadLink)";
const UNREAD = "unread";
const POSTER_LINE_SELECTOR = ".posterDate";
const PAGENAV_CLASS = "itemPageNav";
const PAGENAV_SELECTOR = `.${PAGENAV_CLASS}`;
const FIRST_PAGE_TEXT = "1";
const FIRST_PAGE_CLASS = "firstPage";

const FIRST_PAGE_CSS = `
body .itemPageNav a.${FIRST_PAGE_CLASS} {
  margin-left: 3px;
}
`;

function Fix_Topic_Link(topic) {
  let title_link = topic.querySelector(TOPIC_LINK_SELECTOR);
  let topic_url = title_link.href;

  if (!topic_url.endsWith(UNREAD)) {
    title_link.href += UNREAD;

    // add link to first post to page list
    let pageNav = topic.querySelector(PAGENAV_SELECTOR);

    // one page topic, add our own pagenav
    if (pageNav === null) {
      pageNav = document.createElement("span");
      pageNav.classList.add(PAGENAV_CLASS);
      topic.querySelector(POSTER_LINE_SELECTOR).appendChild(pageNav);
    }

    let first_post_link = document.createElement("a");
    first_post_link.classList.add(FIRST_PAGE_CLASS);
    first_post_link.href = topic_url;
    first_post_link.textContent = FIRST_PAGE_TEXT;

    // because pageNav.firstChild might not exist, don't use the new ChildNode methods
    pageNav.insertBefore(document.createTextNode(" "), pageNav.firstChild);
    pageNav.insertBefore(first_post_link, pageNav.firstChild);
  }
}

let topics = document.querySelectorAll(TOPICS_SELECTOR);

if (topics.length > 0)
{
  let first_page_css_node = document.createElement("style");
  first_page_css_node.textContent = FIRST_PAGE_CSS;
  document.head.appendChild(first_page_css_node);

  for (let topic of topics) {
    Fix_Topic_Link(topic);
  }
}

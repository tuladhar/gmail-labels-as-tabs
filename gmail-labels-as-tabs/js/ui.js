window.addEventListener("load", onLoad, false);
chrome.runtime.onMessage.addListener(function (message, sender) {
    if (chrome.runtime.id == sender.id) {
        buildTabsUI()
    }
})

function activateTab(tab) {
    let prevActiveTab = document.querySelector('.labels-tab__active')
    if (prevActiveTab) {
        prevActiveTab.classList.remove('labels-tab__active')
    }
    tab.classList.add('labels-tab__active')
    let text = tab.querySelector(".labels-tab__text")
    let label_name = text.getAttribute('label')
    let label_type = text.getAttribute('label_type')
    let origin = window.location.origin;
    let pathname = window.location.pathname;
    let hash = ""
    let href = ""
    if (label_type === "user") {
        hash = `#label/${label_name.toLowerCase()}`;
        href = `${origin}${pathname}${hash}`;
        window.location.href = href;
    } else {
        let hash = ""
        switch (label_name) {
            case "INBOX":
                hash = `#inbox`;
                break;
            case "CHAT":
                hash = "#chats"
                break;
            case "DRAFT":
                hash = "#drafts";
                break;
            case "STARRED":
                hash = "#starred";
                break;
            case "SENT":
                hash = "#sent";
                break;
            case "SPAM":
                hash = "#spam";
                break;
            case "TRASH":
                hash = "#trash";
                break;
            default:
                hash = `#label/${label_name.toLowerCase()}`;
        }
        href = `${origin}${pathname}${hash}`;
        window.location.href = href;
    }
    var texts = document.querySelectorAll(".labels-tab__text")
    if (isGmailDarkMode()) {
        texts.forEach((text) => {
            text.classList.add("labels-tab__darkmode")
        })
    } else {
        texts.forEach((text) => {
            text.classList.remove("labels-tab__darkmode")
        })
    }
}

function isGmailDarkMode() {
    return document.querySelector("a[title='Gmail'] img").src.includes("dark")
}

function createTab(label) {
    var tab = document.createElement("div")
    tab.addEventListener('click', () => activateTab(tab))
    tab.classList.add("labels-tab")

    var text = document.createElement("span")
    text.classList.add('labels-tab__text')
    if (isGmailDarkMode()) {
        text.classList.add("labels-tab__darkmode")
    }
    text.setAttribute('label', label.name)
    text.setAttribute('label_type', label.type)
    text.innerText = label.name
    tab.appendChild(text)

    var chip = document.createElement("span")
    chip.classList.add('labels-tab__chip');
    var label_name = label.name;
    if (label.name == "INBOX") {
        label_name = "Inbox";
    }
    var el = document.querySelector(`div[data-tooltip='${label_name}']`)
    if (el === null) {
        chip.style.display = 'none'
    } else {
        var bsU = el.querySelector('.bsU')
        if (bsU === null) {
            chip.style.display = 'none'
        } else {
            var messagesCount = bsU.innerText
            chip.innerText = messagesCount;
        }
    }
    tab.appendChild(chip)

    return tab
}

function __getUnreadCountByLabel(name) {
    var bsU = document.querySelector(`div[data-tooltip='${name}'] .bsU`)
    if (!bsU) {
        return null
    }
    return bsU.innerText
}

function destroyTabsUI() {
    var tabs = document.querySelector('.labels-tabs')
    if (tabs !== null) {
        tabs.remove()
    }
}

function buildTabsUI() {
    destroyTabsUI()
    chrome.storage.sync.get({ labels: [] }, function (result) {
        var labels = result.labels;
        var div = document.createElement("div");
        div.classList.add('labels-tabs');

        var pinned_labels = labels.filter((label) => { return label.pinned === "true" });
        for (let label of pinned_labels) {
            var tab = createTab(label)
            div.appendChild(tab)
        }
        // BltHke = document.getElementsByClassName("BltHke")[0];
        var dJ = document.querySelector('div.dJ');
        dJ.parentElement.appendChild(div)
    })
}

function keepChipsUpdated() {
    setInterval(() => {
        var tabs = document.querySelectorAll(".labels-tab")
        tabs.forEach((tab) => {
            var text = tab.querySelector('.labels-tab__text')
            var label = text.getAttribute('label')
            if (label === "INBOX") {
                label = "Inbox"
            }
            var chip = tab.querySelector('.labels-tab__chip')
            var unreadCount = __getUnreadCountByLabel(label)
            if (!unreadCount) {
                chip.style.display = 'none'
            } else {
                chip.style.display = 'inline';
                chip.innerText = unreadCount;
            }
        })
    }, 5000);
}

function onLoad() {
    var timer = setInterval(onReady, 1000);
    function onReady() {
        var inbox = document.querySelector(`div[data-tooltip='Inbox']`)
        if (inbox) {
            clearInterval(timer);
            buildTabsUI()
        }
    }
    keepChipsUpdated();
}

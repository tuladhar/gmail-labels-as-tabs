chrome.runtime.onInstalled.addListener(function () {
    var url = "https://tuladhar.github.io/gmail-labels-as-tabs/THANK-YOU";
    chrome.tabs.create({ active: true, url: url })

    chrome.declarativeContent.onPageChanged.removeRules(undefined, function () {
        chrome.declarativeContent.onPageChanged.addRules([{
            conditions: [new chrome.declarativeContent.PageStateMatcher({
                pageUrl: { hostEquals: 'mail.google.com' },
            })
            ],
            actions: [new chrome.declarativeContent.ShowPageAction()]
        }]);
    });
});

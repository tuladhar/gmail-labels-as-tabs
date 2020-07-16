document.querySelector("a#github").addEventListener("click", (event) => {
    var url = "https://tuladhar.github.io/gmail-labels-as-tabs";
    chrome.tabs.create({ active: true, url: url })
})
document.querySelector("a#donation").addEventListener("click", (event) => {
    var url = "https://tuladhar.github.io/gmail-labels-as-tabs/DONATION";
    chrome.tabs.create({ active: true, url: url })
})

document.querySelector("a#authorize").addEventListener('click', handleAuthorize)
function handleAuthorize(event) {
    hideAuthorizeUI()
    showPreloader()
    chrome.identity.getAuthToken(
        { 'interactive': true },
        function (token) { }
    );
}

function saveLabels() {
    var ol = document.querySelector("ol#labels_collection")
    var labels = []

    for (var li of ol.childNodes) {
        label_name = li.getAttribute('label_name')
        pinned = li.getAttribute('pinned')
        id = li.getAttribute("id")
        label_type = li.getAttribute("label_type")

        if (pinned) {
            labels.push({
                name: label_name,
                pinned: pinned,
                id: id,
                type: label_type
            })
        }
    }
    chrome.storage.sync.set({ labels: labels }, function () {
        if (chrome.runtime.lastError !== undefined) {
            hideLabelsUI()
            showErrorBox(chrome.runtime.lastError.message)
        } else {
            chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
                chrome.tabs.sendMessage(tabs[0].id, {});
                sortable('.o-sortable', {
                    items: 'li[pinned="true"]'
                });
            });
        }
    })
}

function showPreloader() {
    document.getElementById("preloader").classList.remove("hide")
}

function hidePreloader() {
    document.getElementById("preloader").classList.add("hide")
}

function buildLabelsUI(labels) {
    document.querySelector("#labels_collection").innerHTML = ""
    for (let i in labels) {
        let label = labels[i]

        if (label === null) { continue; }

        var li = document.createElement("li")
        li.classList.add("collection-item")
        li.setAttribute("label_name", label.name)
        li.setAttribute("label_type", label.type)
        li.setAttribute("id", label.id)
        li.setAttribute("pinned", label.pinned)

        var div = document.createElement("div")
        div.textContent = label.name

        var pinButton = createPinButton('#43a047', 'add_circle');
        pinButton.classList.add('pin-button')
        pinButton.setAttribute('id', `pin-${label.id}`)
        pinButton.addEventListener('click', function () { pinLabel(label); })
        div.appendChild(pinButton)

        var unpinButton = createPinButton('#e53935', 'remove_circle');
        unpinButton.classList.add('unpin-button')
        unpinButton.setAttribute('id', `unpin-${label.id}`)
        unpinButton.addEventListener('click', function () { unpinLabel(label); })
        div.appendChild(unpinButton)

        if (label.pinned === "true") {
            pinButton.classList.add('hide')
            unpinButton.classList.remove('hide')
        } else {
            unpinButton.classList.add('hide')
            pinButton.classList.remove('hide')
        }

        li.appendChild(div)
        document.getElementById("labels_collection").appendChild(li)
    }

    sortable('.o-sortable', {
        items: ':not([pinned="false"])'
    });
    sortable('.o-sortable')[0].addEventListener('sortupdate', function (e) {
        saveLabels()
    })

    hidePreloader()
    showLabelsUI()
}

function showLabelsUI() {
    document.querySelector("#labels-ui").classList.remove("hide")
}

function hideLabelsUI() {
    document.querySelector("#labels-ui").classList.add("hide")
}

function showAuthorizeUI() {
    document.querySelector('div.authorize').classList.remove('hide')
}

function listCachedLabels(callback) {
    chrome.storage.sync.get({ labels: [] }, function (response) {
        callback(response)
    })
}

function listLabels(token, callback, error_callback) {
    gapi.auth.setToken({ "access_token": token })
    gapi.client.load('gmail', 'v1', function () {
        var request = gapi.client.gmail.users.labels.list({ 'userId': 'me' })
        request.execute(function (_response) {
            if (_response.code !== undefined) {
                error_callback(_response)
            } else {
                callback(_response)
            }
        });
    });
}

function hideAuthorizeUI() {
    document.querySelector('div.authorize').classList.add('hide')
}

function pinLabel(label) {
    var li = document.querySelector(`li#${label.id}`);
    li.setAttribute("pinned", true)
    li.querySelector(`.pin-button`).classList.add('hide')
    li.querySelector(`.unpin-button`).classList.remove('hide')
    var ol = document.querySelector("ol#labels_collection")
    var insertBeforeNode;
    for (var node of ol.childNodes) {
        var pinned = node.getAttribute('pinned')
        if (pinned === "false") {
            insertBeforeNode = node
            break
        }
    }
    ol.insertBefore(li, insertBeforeNode)
    saveLabels()
}

function unpinLabel(label) {
    var li = document.querySelector(`li#${label.id}`);
    li.setAttribute('draggable', false)
    li.setAttribute("pinned", false)
    li.querySelector(`.pin-button`).classList.remove('hide')
    li.querySelector(`.unpin-button`).classList.add('hide')
    var ol = document.querySelector("ol#labels_collection")
    var insertBeforeNode;
    for (var node of ol.childNodes) {
        if (node.getAttribute('id') === label.id) {
            continue;
        }
        var pinned = node.getAttribute('pinned')
        if (pinned === "false") {
            insertBeforeNode = node
            break
        }
    }
    ol.insertBefore(li, insertBeforeNode)
    saveLabels()
}

function createPinButton(color, icon) {
    var a = document.createElement('a')
    a.classList.add("secondary-content")

    var i = document.createElement('i')
    i.classList.add('material-icons')
    i.style.color = color
    i.innerText = icon

    a.appendChild(i)

    return a
}

function removeCachedAuthToken(token, callback) {
    chrome.identity.removeCachedAuthToken({
        token: token
    }, function () {
        callback()
    })
}

function isAuthTokenValid(token, callback) {
    gapi.auth.setToken({ "access_token": token })
    gapi.client.load('gmail', 'v1', function () {
        var request = gapi.client.gmail.users.labels.get({
            'userId': 'me',
            'id': 'INBOX'
        })
        request.execute(function (response) {
            if ('error' in response) {
                callback(false)
            } else {
                callback(true)
            }
        })
    })
}

function showErrorBox(message) {
    var span = document.querySelector("#error-message")
    span.innerText = message;
    document.querySelector("#error-box").classList.remove('hide')
}

function isCached(label, callback) {
    chrome.storage.sync.get({ labels: [] }, function (response) {
        for (var cached_label of response.labels) {
            if (label.id == cached_label.id) {
                callback(true)
            }
        }
        callback(false)
    })
}

function onGAPILoad() {
    chrome.identity.getAuthToken(function (token) {
        if (token === undefined) {
            console.log(chrome.runtime.lastError)
            hidePreloader()
            showAuthorizeUI()
        } else {
            isAuthTokenValid(token, function (valid) {
                if (valid) {
                    listCachedLabels((response) => {
                        var cached_labels = response.labels;
                        var labels = response.labels;

                        if (labels.length == 0) {
                            listLabels(token, (r1) => {
                                for (var label of r1.labels) {
                                    if (label.name.startsWith('CATEGORY_')) {
                                        continue;
                                    }
                                    labels.push({
                                        name: label.name,
                                        pinned: "false",
                                        id: label.id,
                                        type: label.type
                                    })
                                }
                                buildLabelsUI(labels)
                            }, (r2) => {
                                var code = response.code;
                                var reason = response.error.data[0].reason
                                if (reason === "authError") {
                                    hidePreloader()
                                    showAuthorizeUI()
                                } else {
                                    var message = `${reason}: ${response.code}: ${response.error.message}`
                                    hidePreloader()
                                    showErrorBox(message)
                                }

                            });
                        } else {
                            listLabels(token, function (r1) {
                                for (var l1 of r1.labels) {
                                    var found = false;
                                    for (var l2 of labels) {
                                        if (l1.id == l2.id || l1.name.startsWith('CATEGORY_')) {
                                            found = true;
                                            break;
                                        }
                                    }
                                    if (!found) {
                                        labels.push({
                                            name: l1.name,
                                            pinned: "false",
                                            id: l1.id,
                                            type: l1.type
                                        })
                                    }
                                }
                                // remove deleted labels
                                for (var i in cached_labels) {
                                    var label = cached_labels[i];
                                    var found = false;
                                    for (var l1 of r1.labels) {
                                        if (l1.id == label.id) {
                                            found = true
                                            break
                                        }
                                    }
                                    if (!found) {
                                        labels.splice(i, 1)
                                    }
                                }
                                chrome.storage.sync.set({ labels: labels }, function () {
                                    buildLabelsUI(labels)
                                })
                            }, function (response) {
                                var code = response.code;
                                var reason = response.error.data[0].reason
                                var message = `${reason}: ${response.code}: ${response.error.message}`
                                hidePreloader()
                                showErrorBox(message)
                            })
                        }
                    })
                } else {
                    removeCachedAuthToken(token, function () {
                        hidePreloader()
                        showAuthorizeUI()
                    })
                }
            });
        }
    })
}

gapi.load('client', onGAPILoad)
